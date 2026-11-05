import 'server-only';
import { createCipheriv, createDecipheriv, createHash, createHmac } from 'crypto';

/*
 * Server-side client for the Wi-Fi Calls mobile API (the Symfony backend the iOS app uses).
 * The browser never talks to the backend directly: it has no CORS headers, and the app's
 * sign-in header, JWT secret and encryption key must stay off the client. The web app calls
 * /api/wc/*, which uses this.
 *
 * Wire format (mirrors the iOS app's Core/Networking/APIClient.swift):
 *  - POST body: JSON params → AES-256-CBC → base64, sent as the raw body (Content-Type JSON).
 *    Multipart: the params go encrypted in a `dataset` field, files ride alongside.
 *  - Responses: base64 AES-256-CBC of {code, data, message}; HTTP status = code.
 *  - Key = SHA-256(secret[0, 32]), IV = MD5(ivSeed) (OpenSslApiCryptor on both sides).
 *  - Signed-in calls carry `authToken`: an HS256 JWT {iss, aud, iat, authKey}, valid ~100 min.
 *  - Sign-in calls carry the app's static bootstrap header instead.
 */

const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const base = () => env('WC_API_URL').replace(/\/+$/, '');
const cipherKey = () => createHash('sha256').update(env('WC_ENCRYPTION_KEY').slice(0, 32)).digest();
const cipherIv = () => createHash('md5').update(env('WC_ENCRYPTION_IV')).digest();

export function encrypt(plain: string): string {
  const c = createCipheriv('aes-256-cbc', cipherKey(), cipherIv());
  return c.update(plain, 'utf8', 'base64') + c.final('base64');
}

export function decrypt(cipherText: string): string | null {
  try {
    const d = createDecipheriv('aes-256-cbc', cipherKey(), cipherIv());
    return d.update(cipherText.trim(), 'base64', 'utf8') + d.final('utf8');
  } catch {
    return null;
  }
}

const b64url = (data: Buffer | string) => Buffer.from(data).toString('base64url');

/** The per-request `authToken` JWT. `iat` is 30 s in the past to absorb clock skew, as on iOS. */
export function authToken(authKey?: string): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const claims: Record<string, unknown> = { aud: 'wificalls', iat: Math.floor(Date.now() / 1000) - 30, iss: 'wifiCalls' };
  if (authKey) claims.authKey = authKey;
  const payload = b64url(JSON.stringify(claims));
  const signature = createHmac('sha256', env('WC_JWT_SECRET')).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

/** Device fields every sign-in and most signed-in calls need (see validateDeviceInfo). */
export interface Device { id: string; name: string; os: string; token?: string }
const deviceParams = (d: Device) => ({
  device_id: d.id,
  device_name: d.name,
  device_type: '3', // digits only; iOS sends 1, Android 2. 3 marks the web app.
  device_token: d.token || 'blank', // must be non-empty; "blank" is the iOS app's placeholder
  os_version: d.os,
});

export interface ApiResult<T = unknown> { ok: boolean; status: number; code: number; data: T; message: string }

/** An error the backend reported in its own words (or a transport failure). */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code: number) { super(message); }
}

type Auth = { authKey: string } | 'bootstrap' | 'none';

export interface CallOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  params?: Record<string, string | number | boolean | undefined>;
  files?: Record<string, Blob>;
  auth: Auth;
  device: Device;
}

/**
 * Calls `/api/v1/<path>` and returns the decrypted {code, data, message}. Never throws for
 * app-level errors (the backend uses HTTP 400/401/402/403/409 for those); throws ApiError only
 * when the backend can't be reached or answers with something unreadable.
 */
export async function call<T = unknown>(path: string, opts: CallOptions): Promise<ApiResult<T>> {
  const method = opts.method ?? 'POST';
  const headers: Record<string, string> = {};
  if (opts.auth === 'bootstrap') headers[env('WC_APP_HEADER_NAME')] = env('WC_APP_HEADER_VALUE');
  // The backend decrypts authToken like the body (ApiEncryptionListener), so it's sent encrypted, as on iOS.
  else if (opts.auth !== 'none') headers.authToken = encrypt(authToken(opts.auth.authKey));

  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...deviceParams(opts.device), ...opts.params })) {
    if (v !== undefined) params[k] = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
  }

  let body: BodyInit | undefined;
  if (method !== 'GET') {
    if (opts.files && Object.keys(opts.files).length) {
      const form = new FormData();
      form.set('dataset', encrypt(JSON.stringify(params)));
      for (const [k, file] of Object.entries(opts.files)) form.set(k, file);
      body = form;
    } else {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      body = encrypt(JSON.stringify(params));
    }
  }

  // GET routes (e.g. wsqr_retrieveGroupById?group_id=…) read their few parameters from the query string.
  const query = method === 'GET' && opts.params
    ? Object.entries(opts.params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
    : '';

  let response: Response;
  try {
    response = await fetch(`${base()}/api/v1/${path}${query ? '?' + query : ''}`, { method, headers, body, cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  } catch (error) {
    console.error(`[wc] ${path} unreachable`, error);
    throw new ApiError('The service is not reachable right now. Please try again.', 503, 503);
  }

  const text = await response.text();
  const plain = decrypt(text) ?? text; // a few routes answer in plain JSON
  let parsed: { code?: number; data?: T; message?: string } | null = null;
  try { parsed = JSON.parse(plain); } catch { /* HTML error page or empty body */ }

  if (!parsed || typeof parsed !== 'object') {
    // wsqr_deleteNumber exits with an empty 200 on success.
    if (response.ok && text.trim() === '') return { ok: true, status: 200, code: 200, data: null as T, message: '' };
    const title = /<title>([\s\S]*?)<\/title>/.exec(text)?.[1]?.replace(/\s+/g, ' ').trim();
    console.error(`[wc] ${path} ${response.status}: ${title ?? text.slice(0, 200)}`);
    throw new ApiError('Something went wrong on our side. Please try again in a moment.', response.status, response.status);
  }
  const code = Number(parsed.code ?? response.status);
  return { ok: code === 200, status: response.status, code, data: (parsed.data ?? null) as T, message: String(parsed.message ?? '') };
}
