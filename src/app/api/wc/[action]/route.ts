import { ApiError, call, type ApiResult } from '@/server/wc/api';
import { authKey, clearAuthKey, device, setAuthKey, verifiedPhone } from '@/server/wc/session';
import { chatSession } from '@/server/wc/quickblox';

/*
 * The web app's only way to the Wi-Fi Calls backend. Each action maps to one backend endpoint
 * with a fixed list of fields it may send, so the browser can't reach anything else through
 * this proxy. Responses are { ok, code, data, message } (code = the backend's own code).
 *
 * Session actions:
 *   POST session   { idToken }  Firebase-verified phone → signInWithFirebase → verifyNow
 *   GET  session                 the signed-in user (getUserInfo), or 401
 *   DELETE session               logout this browser
 *   GET  chatSession             a QuickBlox session token for app-to-app chat (see server/wc/quickblox.ts)
 */

export const dynamic = 'force-dynamic';

type Spec = { path: string | ((p: Record<string, string>) => string); method?: 'GET' | 'POST' | 'DELETE'; fields?: string[]; files?: string[] };

const ACTIONS: Record<string, Spec> = {
  // account
  profile: { path: 'wsqr_getUserInfo' },
  // Finds which contacts are on Wi-Fi Calls. Friends are kept per signed-in device (login history),
  // so this only replaces this browser's friend list, never the iPhone's.
  friends: { path: 'wsqr_fetchFriend', fields: ['contacts'] },
  updateProfile: { path: 'wsqr_addUserInfo', fields: ['first_name', 'last_name', 'username'] },
  devices: { path: 'wsqr_getLoggedInDevices' },
  logoutAll: { path: 'wsqr_logoutFromAllDevices' },
  deleteAccount: { path: 'wsqr_deleteAccount', method: 'GET' },
  // number
  fetchNumbers: { path: 'wsqr_fetchNumbers', fields: ['country_code'] },
  purchaseNumber: { path: 'wsqr_purchaseNumber', fields: ['phone_number', 'friendly_name'] },
  deleteNumber: { path: 'wsqr_deleteNumber', fields: ['phone_number'] },
  // wallet & usage
  credit: { path: 'wsqr_getCredit', method: 'GET' },
  pricing: { path: 'wsqr_getCreditPricing', method: 'GET' },
  usage: { path: 'wsqr_getUsage', fields: ['date'] },
  recordings: { path: 'wsqr_getRecordings' },
  // SMS
  smsThreads: { path: 'wsqr_retrieveAllSms', method: 'GET' },
  smsConversation: { path: 'wsqr_retrieveSmsConversion', fields: ['from_number', 'to_number', 'page'] },
  sendSms: { path: 'wsqr_sendSms', fields: ['body', 'to_number', 'from_number', 'to_username', 'is_media_attached'], files: ['media'] },
  clearSms: { path: 'wsqr_clearSmsLogs', fields: ['to_number'] },
  // broadcasts
  broadcasts: { path: 'wsqr_retrieveAllBroadcast', method: 'GET' },
  createBroadcast: { path: 'wsqr_createBroadcast', fields: ['to_numbers', 'from_number', 'to_username'] },
  sendBroadcast: { path: 'wsqr_sendBroadcastMessage', fields: ['body', 'broadcast_id', 'is_media_attached'], files: ['media'] },
  broadcastMessages: { path: 'wsqr_retrieveBroadcastMessage', fields: ['broadcast_id'] },
  deleteBroadcast: { path: 'wsqr_deleteBroadcast', method: 'DELETE', fields: ['broadcast_id'] },
  // calls
  callLogs: { path: 'wsqr_getCallLogs' },
  // Phone calls (Twilio / Vonage): a voice-SDK token for this user, and the call's end for billing and the call log.
  callToken: { path: 'wsqr_getCapabilityToken' },
  endCall: { path: 'wsqr_endCallUpdateStatus', fields: ['call_sid', 'duration'] },
  clearCallLogs: { path: 'wsqr_clearCallLogs' },
  clearCallLog: { path: (p) => `wsqr_clearSingleCallLogCallHistoryId/${encodeURIComponent(p.id ?? '')}`, fields: ['id'] },
  blocklist: { path: 'wsqr_getBlocklist' },
  block: { path: 'wsqr_callBlocking', fields: ['blocked_number', 'blocked_name'] },
  unblock: { path: 'wsqr_callUnblocking', fields: ['blocked_id'] },
  forwarding: { path: 'wsqr_callForwarding', fields: ['is_forwarding', 'forward_to'] },
  // voicemail
  voicemails: { path: 'wsqr_getVoiceMailList' },
  voicemailThread: { path: 'wsqr_getSingleVoiceMailList', fields: ['fromPhoneNumber', 'fromUserName'] },
  deleteVoicemail: { path: 'wsqr_deleteSingleVoiceMailList', fields: ['fromPhoneNumber'] },
  voicemailSettings: { path: 'wsqr_saveVoiceMailSettings', fields: ['isEnabled', 'voiceMailType'] },
  customVoicemail: { path: 'wsqr_addCustomVoiceMail', files: ['voiceMailMessageFile'] },
  // settings
  recordingSetting: { path: 'wsqr_saveCallRecordingSettings', fields: ['is_call_record'] },
  anonymousSetting: { path: 'wsqr_saveAnonymousCallSetting', fields: ['is_anonymous'] },
  chatSettings: { path: 'wsqr_saveChatSetting', fields: ['font_size', 'chat_signature', 'remove_chat_background'], files: ['chat_background'] },
  // groups (the backend creates and updates the QuickBlox group dialog; messages go through QuickBlox)
  groups: { path: 'wsqr_retrieveGroup' },
  group: { path: 'wsqr_retrieveGroupById', method: 'GET', fields: ['group_id'] },
  createGroup: { path: 'wsqr_createGroup', fields: ['name', 'type', 'occupants_ids'], files: ['group_icon'] },
  updateGroup: { path: 'wsqr_updateGroup', fields: ['quick_blox_chat_dialog_id', 'name', 'occupants_ids', 'type'], files: ['group_icon'] },
  deleteGroup: { path: 'wsqr_deleteGroup', fields: ['quick_blox_chat_dialog_id', 'force'] },
};

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const signedOut = () => json({ ok: false, code: 401, data: null, message: 'Please sign in again.' }, 401);

/** Passes a backend result through, ending the session when the backend says it's gone. */
async function reply(result: ApiResult) {
  // 203 SESSION_TIME_OUT: the auth key was revoked (logout elsewhere, "log out all devices").
  if (result.code === 203) { await clearAuthKey(); return signedOut(); }
  // 400 with an auth message means the token itself was refused.
  if (result.code === 400 && /UNAUTHORIZED|REQUIRE_AUTH/i.test(result.message)) { await clearAuthKey(); return signedOut(); }
  return json({ ok: result.ok, code: result.code, data: result.data, message: result.message });
}

async function readInput(request: Request, spec?: Spec) {
  const params: Record<string, string> = {};
  const files: Record<string, Blob> = {};
  const type = request.headers.get('content-type') ?? '';
  if (request.method === 'GET') {
    for (const [k, v] of new URL(request.url).searchParams) params[k] = v;
    return { params, files };
  }
  if (type.includes('multipart/form-data')) {
    const form = await request.formData();
    for (const [k, v] of form) {
      if (typeof v === 'string') params[k] = v;
      else if (spec?.files?.includes(k)) files[k] = v;
    }
  } else if (type.includes('json')) {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body === 'object') for (const [k, v] of Object.entries(body)) if (v != null) params[k] = String(v);
  }
  return { params, files };
}

async function handle(request: Request, action: string) {
  try {
    if (action === 'session') return await session(request);
    if (action === 'chatSession') return await chat();

    const spec = ACTIONS[action];
    if (!spec) return json({ ok: false, code: 404, data: null, message: 'Unknown action.' }, 404);
    const key = await authKey();
    if (!key) return signedOut();

    const { params, files } = await readInput(request, spec);
    const allowed = Object.fromEntries(Object.entries(params).filter(([k]) => spec.fields?.includes(k)));
    const path = typeof spec.path === 'function' ? spec.path(allowed) : spec.path;
    if (typeof spec.path === 'function') delete allowed.id;
    return reply(await call(path, { method: spec.method ?? 'POST', params: allowed, files, auth: { authKey: key }, device: await device() }));
  } catch (error) {
    if (error instanceof ApiError) return json({ ok: false, code: error.code, data: null, message: error.message }, 502);
    console.error('[wc] proxy error', error);
    return json({ ok: false, code: 500, data: null, message: 'Something went wrong. Please try again.' }, 500);
  }
}

async function session(request: Request) {
  const dev = await device();

  if (request.method === 'GET') {
    const key = await authKey();
    if (!key) return signedOut();
    return reply(await call('wsqr_getUserInfo', { auth: { authKey: key }, device: dev }));
  }

  if (request.method === 'DELETE') {
    const key = await authKey();
    if (key) await call('wsqr_logout', { auth: { authKey: key }, device: dev }).catch(() => null);
    await clearAuthKey();
    return json({ ok: true, code: 200, data: null, message: 'Signed out.' });
  }

  // Sign in: the browser proved the number with Firebase; we check that proof ourselves.
  const { idToken } = (await request.json().catch(() => ({}))) as { idToken?: string };
  const phone = idToken ? await verifiedPhone(idToken) : null;
  if (!phone) return json({ ok: false, code: 400, data: null, message: 'We couldn’t verify that code. Please try again.' }, 400);

  const signIn = await call<{ auth_key?: string }>('wsqr_signInWithFirebase', { auth: 'bootstrap', device: dev, params: { phone_number: phone, subscriptionReceipt: '' } });
  const key = signIn.data?.auth_key;
  if (!signIn.ok || !key) return json({ ok: false, code: signIn.code, data: null, message: signIn.message || 'Sign-in failed. Please try again.' }, 400);

  const verified = await call('wsqr_verifyNow', { auth: { authKey: key }, device: dev });
  if (!verified.ok) return json({ ok: false, code: verified.code, data: null, message: verified.message || 'Sign-in failed. Please try again.' }, 400);

  await setAuthKey(key);
  return json({ ok: true, code: 200, data: verified.data, message: verified.message });
}

/** Signs the user in to QuickBlox on the server and returns only the session token. */
async function chat() {
  const key = await authKey();
  if (!key) return signedOut();
  const profile = await call<{ user_info?: { user_id?: number | string; quickblox_id?: number | string | null } }>('wsqr_getUserInfo', { auth: { authKey: key }, device: await device() });
  if (profile.code === 203) { await clearAuthKey(); return signedOut(); }
  const info = profile.data?.user_info;
  if (!profile.ok || !info?.user_id) return json({ ok: false, code: profile.code, data: null, message: profile.message || 'Couldn’t load your account.' }, 502);
  // The backend creates the QuickBlox user once the account has an active plan.
  if (!info.quickblox_id) return json({ ok: false, code: 409, data: null, message: 'App chat isn’t set up for your account yet.' }, 409);
  const session = await chatSession(info.user_id);
  if (!session) return json({ ok: false, code: 502, data: null, message: 'Chat is unavailable right now. Please try again.' }, 502);
  if (String(session.qbUserId) !== String(info.quickblox_id)) console.warn('[qb] session user differs from profile quickblox_id');
  return json({ ok: true, code: 200, data: session, message: '' });
}

type Ctx = { params: Promise<{ action: string }> };
export async function GET(request: Request, { params }: Ctx) { return handle(request, (await params).action); }
export async function POST(request: Request, { params }: Ctx) { return handle(request, (await params).action); }
export async function DELETE(request: Request, { params }: Ctx) { return handle(request, (await params).action); }
