import 'server-only';
import { createHmac, randomInt } from 'crypto';

/*
 * QuickBlox sign-in for the web app's chat. The apps log in to QuickBlox themselves with a
 * login and password derived from the backend user id (see the iOS QuickBloxAuth.qbLogin); a
 * browser can't be trusted with that scheme or with the app's auth secret, so the server signs
 * in for the signed-in user and hands the browser only the resulting session token. The browser
 * then uses the token for the REST API and as its chat (XMPP) password.
 */

const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

export interface ChatSession { token: string; qbUserId: number; appId: number; accountKey: string; pushEnvironment: string }

/** Same login the iOS app uses: `wc_quickblox_<backend user id>`, password identical. */
const qbLogin = (backendUserId: string | number) => `wc_quickblox_${backendUserId}`;

export async function chatSession(backendUserId: string | number): Promise<ChatSession | null> {
  const login = qbLogin(backendUserId);
  const params: Record<string, string> = {
    application_id: env('WC_QB_APP_ID'),
    auth_key: env('WC_QB_AUTH_KEY'),
    nonce: String(randomInt(1, 2 ** 31 - 1)),
    timestamp: String(Math.floor(Date.now() / 1000)),
    'user[login]': login,
    'user[password]': login,
  };
  // QuickBlox signs the alphabetically sorted parameters with HMAC-SHA1 and the auth secret.
  const signature = createHmac('sha1', env('WC_QB_AUTH_SECRET'))
    .update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&'))
    .digest('hex');

  const response = await fetch(`${env('WC_QB_API_ENDPOINT')}/session.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'QuickBlox-REST-API-Version': '0.1.0' },
    body: JSON.stringify({
      application_id: params.application_id, auth_key: params.auth_key, nonce: params.nonce, timestamp: params.timestamp, signature,
      user: { login, password: login },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!response?.ok) {
    console.error('[qb] session failed', response?.status, response ? (await response.text()).slice(0, 200) : 'unreachable');
    return null;
  }
  const { session } = (await response.json()) as { session: { token: string; user_id: number } };
  return {
    token: session.token,
    qbUserId: session.user_id,
    appId: Number(env('WC_QB_APP_ID')),
    accountKey: env('WC_QB_ACCOUNT_KEY'),
    // Chat pushes go to the iPhone app over APNs; TestFlight and App Store builds use production.
    pushEnvironment: process.env.WC_QB_PUSH_ENV || 'production',
  };
}
