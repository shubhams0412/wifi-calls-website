'use client';

/* Browser side of the backend connection: every call goes to our own /api/wc/<action>
   (src/app/api/wc/[action]/route.ts), which signs, encrypts and forwards it. */

export interface WcResult<T = unknown> { ok: boolean; code: number; data: T; message: string }

let onSignedOut: (() => void) | null = null;
/** Called once by the store: what to do when the backend ends the session. */
export const setSignedOutHandler = (fn: () => void) => { onSignedOut = fn; };

/**
 * Calls an action. Never throws: network failures come back as { ok: false, message }.
 * A 401 (session revoked or expired) signs the user out locally.
 */
export async function wc<T = unknown>(
  action: string,
  params?: Record<string, string | number | boolean | null | undefined>,
  files?: Record<string, Blob>,
  method: 'GET' | 'POST' | 'DELETE' = 'POST',
): Promise<WcResult<T>> {
  let body: BodyInit | undefined;
  const headers: Record<string, string> = {};
  if (method !== 'GET') {
    const clean = Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v)]));
    if (files && Object.keys(files).length) {
      const form = new FormData();
      for (const [k, v] of Object.entries(clean)) form.set(k, v);
      for (const [k, f] of Object.entries(files)) form.set(k, f);
      body = form;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(clean);
    }
  }
  try {
    const r = await fetch(`/api/wc/${action}`, { method, headers, body, credentials: 'same-origin', cache: 'no-store' });
    const json = (await r.json().catch(() => null)) as WcResult<T> | null;
    if (r.status === 401 && action !== 'session') onSignedOut?.();
    if (!json) return { ok: false, code: r.status, data: null as T, message: 'Something went wrong. Please try again.' };
    return json;
  } catch {
    return { ok: false, code: 0, data: null as T, message: "You're offline. Check your connection and try again." };
  }
}

/** Unix seconds or milliseconds (or a date string) → milliseconds. */
export function toMs(value: unknown): number {
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return toMs(Number(value));
  const t = typeof value === 'string' ? Date.parse(value.replace(' ', 'T')) : NaN;
  return Number.isFinite(t) ? t : Date.now();
}

/** "+1 415…" / "1415…" → "+1415…" */
export const e164 = (phone: string) => '+' + String(phone ?? '').replace(/\D/g, '');
