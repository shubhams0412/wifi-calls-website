'use client';

/* Loads the signed-in user's data from the backend into the store, and maps the backend's
   shapes (see the iOS app's Core/Networking and the backend's repositories) to the UI's. */

import { e164, setSignedOutHandler, toMs, wc } from './api';
import type { AppData, CallLog, Message, Recording, SmsThread, Tier, UsageMonth, Voicemail } from './data';
import { seed } from './data';
import { startChat, stopChat } from './chat';
import { stopPhone } from './phone';
import { firebaseSignOut } from './firebase';
import { setTrackUrl } from './player';
import { getData, mutate, useApp } from './store';

/* ---------------- backend shapes ---------------- */
type Str = string | number | null | undefined;
interface UserInfo {
  user_id?: Str; first_name?: string; last_name?: string; username?: string; user_number?: string; phone_number?: string;
  quickblox_id?: Str; is_anonymous?: Str; is_forwarding?: Str; forward_to?: string;
}
interface ProfileData {
  user_info?: UserInfo;
  purchased_phone_number_info?: { phone_number?: string } | null;
  settings?: { font_size?: string; chat_signature?: string; chat_background?: string; is_voicemail_enabled?: Str; is_default?: Str; is_call_record?: Str };
  friend_info?: { quickblox_id?: Str; full_name?: string; phone_number?: string; username?: string }[];
}
interface SmsSummary { id: Str; number: string; username?: string; body?: string; timestamp?: Str; unreadMessageCount?: number }
export interface SmsMessage { id: Str; from_number?: string; to_number?: string; body?: string; direction?: string; is_media_attached?: Str; media_url?: string; timestamp?: Str; status?: string }
interface CallRow { callHistoryId: Str; CallerName?: string; phoneNumber?: string; direction?: string; status?: string; duration?: Str; startTime?: Str; callType?: string; isQuickbloxCall?: Str }
interface Credit { coins?: Str; purchase_credit_history?: { coins?: Str; created_at?: string }[]; entitlements?: { lite?: boolean; pro?: boolean } }
interface UsageRaw { this_month_usage?: Partial<UsageMonth>; previous_month_usage?: Partial<UsageMonth> }

const on = (v: Str) => v === 1 || v === '1' || v === true as unknown;
const num = (v: Str) => Number(v ?? 0) || 0;

/* ---------------- mappers ---------------- */
export function mapMessage(m: SmsMessage): Message {
  const out = !String(m.direction ?? '').startsWith('inbound');
  const status = String(m.status ?? '').toLowerCase();
  return {
    id: String(m.id),
    out,
    body: m.body ?? '',
    at: toMs(m.timestamp),
    status: /fail|undeliver/.test(status) ? 'failed' : 'sent',
    image: on(m.is_media_attached) && m.media_url ? m.media_url : null,
  };
}

const smsThreadId = (phone: string) => 's' + phone.replace(/\D/g, '');

function mapThreads(list: SmsSummary[], current: SmsThread[]): SmsThread[] {
  return list.map((t) => {
    const phone = e164(t.number);
    const id = smsThreadId(phone);
    const old = current.find((c) => c.id === id);
    const at = toMs(t.timestamp);
    const preview: Message = { id: 'p' + String(t.id), out: false, body: t.body ?? '', at, status: 'sent' };
    // Keep a loaded conversation if nothing new arrived; otherwise show the list preview until it's opened.
    const keep = old?.full && old.messages.length && Math.abs((old.messages[old.messages.length - 1]?.at ?? 0) - at) < 1000;
    // With no saved name the backend repeats the number as `username`; leave the name empty so contacts can name it.
    const username = t.username && t.username.replace(/\D/g, '') !== phone.replace(/\D/g, '') ? t.username : '';
    return { id, phone, name: username || old?.name || '', unread: t.unreadMessageCount ?? 0, messages: keep ? old!.messages : [preview], full: keep ? true : false, created: at };
  });
}

function mapCall(c: CallRow): CallLog {
  const inbound = String(c.direction ?? '').startsWith('in');
  const status = String(c.status ?? '').toLowerCase();
  const missed = inbound && /no-answer|busy|failed|cancel|missed/.test(status);
  return {
    id: String(c.callHistoryId),
    phone: c.phoneNumber ? e164(c.phoneNumber) : '',
    name: c.CallerName ?? '',
    dir: missed ? 'missed' : inbound ? 'in' : 'out',
    dur: num(c.duration),
    at: toMs(c.startTime),
    type: on(c.isQuickbloxCall) ? 'app' : /wifi/i.test(c.callType ?? '') ? 'wifi' : 'phone',
  };
}

function tierOf(credit: Credit | null): Tier {
  if (credit?.entitlements?.pro) return 'pro';
  if (credit?.entitlements?.lite) return 'lite';
  return 'none';
}

/** Applies getUserInfo / verifyNow data. */
export function applyProfile(p: ProfileData) {
  mutate((d) => {
    const u = p.user_info ?? {};
    d.user.first = u.first_name ?? '';
    d.user.last = u.last_name ?? '';
    d.user.username = u.username ?? '';
    if (u.user_number) d.user.phone = e164(u.user_number);
    d.user.id = u.user_id != null ? String(u.user_id) : undefined;
    d.user.quickbloxId = u.quickblox_id ? String(u.quickblox_id) : undefined;
    const bought = p.purchased_phone_number_info?.phone_number || u.phone_number;
    d.number = bought ? e164(bought) : null;
    d.settings.anon = on(u.is_anonymous);
    d.forwarding = { on: on(u.is_forwarding), to: u.forward_to ?? '' };
    const s = p.settings;
    if (s) {
      if (s.font_size === 'Small' || s.font_size === 'Medium' || s.font_size === 'Large') d.settings.fontSize = s.font_size;
      d.settings.signature = s.chat_signature || 'None';
      d.settings.chatBg = s.chat_background || null;
      d.settings.voicemail = on(s.is_voicemail_enabled);
      d.settings.greeting = s.is_default == null || on(s.is_default) ? 'default' : 'custom';
      d.settings.recording = on(s.is_call_record);
    }
    if (p.friend_info) applyFriends(d, p.friend_info);
  });
}

type FriendRow = NonNullable<ProfileData['friend_info']>[number];
/** App friends found from the user's contacts; kept alongside any contacts already loaded. */
function applyFriends(d: AppData, list: FriendRow[]) {
  for (const f of list) {
    const phone = f.phone_number ? e164(f.phone_number) : '';
    const qbId = f.quickblox_id ? String(f.quickblox_id) : undefined;
    const existing = d.contacts.find((c) => c.phone.replace(/\D/g, '').slice(-10) === phone.replace(/\D/g, '').slice(-10));
    if (existing) { existing.friend = true; existing.username = f.username; existing.qbId = qbId ?? existing.qbId; }
    else d.contacts.push({ id: 'f' + String(f.quickblox_id ?? phone), name: f.full_name || f.username || phone, phone, friend: true, username: f.username, qbId });
  }
}

/* ---------------- loaders ---------------- */
export async function loadProfile() {
  const r = await wc<ProfileData>('profile');
  if (r.ok && r.data) applyProfile(r.data);
  return r;
}

/** Sends the contacts saved in this browser to the backend, which answers with those on Wi-Fi Calls. */
export async function loadFriends() {
  const list = getData().contacts.filter((c) => !c.id.startsWith('f') && c.phone).map((c) => ({ name: c.name, phone: c.phone }));
  if (!list.length) return null;
  const r = await wc<{ friend_info?: FriendRow[] }>('friends', { contacts: JSON.stringify(list) });
  if (r.ok && r.data?.friend_info) { const rows = r.data.friend_info; mutate((d) => applyFriends(d, rows)); }
  return r;
}

export async function loadCredit() {
  const r = await wc<Credit>('credit', undefined, undefined, 'GET');
  if (r.ok && r.data) {
    const c = r.data;
    mutate((d) => {
      d.coins = num(c.coins);
      d.tier = tierOf(c);
      d.purchases = (c.purchase_credit_history ?? []).map((h) => ({ coins: num(h.coins), at: toMs(h.created_at) }));
    });
  }
  return r;
}

export async function loadSmsThreads() {
  const r = await wc<{ sms?: SmsSummary[] }>('smsThreads', undefined, undefined, 'GET');
  // The backend answers 400 with an empty list when there are no conversations.
  if (r.ok || Array.isArray(r.data?.sms)) mutate((d) => { d.sms = mapThreads(r.data?.sms ?? [], d.sms); });
  return r;
}

/** Loads one conversation (page 1 = newest page) and marks it read on the backend. */
export async function loadConversation(phone: string, page = 1) {
  const d0 = getData();
  const r = await wc<{ conversion?: SmsMessage[]; is_last_page?: boolean }>('smsConversation', { from_number: d0.number ?? '', to_number: phone, page });
  if (!r.ok || !r.data) return r;
  const msgs = (r.data.conversion ?? []).map(mapMessage).sort((a, b) => a.at - b.at);
  const id = smsThreadId(e164(phone));
  mutate((d) => {
    let t = d.sms.find((x) => x.id === id);
    if (!t) { t = { id, phone: e164(phone), name: '', unread: 0, messages: [], created: Date.now() }; d.sms.unshift(t); }
    const pending = t.messages.filter((m) => m.status === 'sending' || m.status === 'failed');
    const known = page > 1 ? t.messages.filter((m) => !m.id.startsWith('p')) : [];
    const byId = new Map([...known, ...msgs].map((m) => [m.id, m]));
    t.messages = [...byId.values(), ...pending.filter((p) => !byId.has(p.id))].sort((a, b) => a.at - b.at);
    t.full = true;
    t.unread = 0;
    if (page === 1 || r.data.is_last_page) t.lastPage = !!r.data.is_last_page;
  });
  return r;
}

export async function loadCalls() {
  const r = await wc<{ call_logs?: CallRow[] }>('callLogs');
  // Keep the app-to-app calls this browser logged itself (the backend doesn't record them).
  if (r.ok || r.code === 400) mutate((d) => {
    d.calls = [...(r.data?.call_logs ?? []).map(mapCall), ...d.calls.filter((c) => c.id.startsWith('qb:'))].sort((a, b) => b.at - a.at);
  });
  return r;
}

export async function loadBlocklist() {
  const r = await wc<{ blocked_id: Str; blocked_number: string; blocked_name?: string }[]>('blocklist');
  if (r.ok || r.code === 400) setBlocked(Array.isArray(r.data) ? r.data : []);
  return r;
}
export function setBlocked(list: { blocked_id: Str; blocked_number: string; blocked_name?: string }[]) {
  mutate((d) => { d.blocked = list.map((b) => ({ id: String(b.blocked_id), phone: e164(b.blocked_number), name: b.blocked_name ?? '' })); });
}

export async function loadVoicemails() {
  const r = await wc<{ voice_mail_records?: { username?: string; number: string }[] }>('voicemails');
  if (r.ok || r.code === 400) {
    mutate((d) => {
      d.voicemails = (r.data?.voice_mail_records ?? []).map((v): Voicemail => {
        const phone = e164(v.number);
        const old = d.voicemails.find((x) => x.phone === phone);
        return { id: 'v' + phone.replace(/\D/g, ''), phone, name: v.username, items: old?.items ?? [] };
      });
    });
  }
  return r;
}

export async function loadVoicemailThread(phone: string, name?: string) {
  const r = await wc<{ voice_mails?: { id: Str; recording_url?: string; duration?: Str; timestamp?: Str }[] }>('voicemailThread', { fromPhoneNumber: phone, fromUserName: name });
  if (r.ok) {
    mutate((d) => {
      const v = d.voicemails.find((x) => x.phone === e164(phone));
      if (v) v.items = (r.data?.voice_mails ?? []).map((m) => ({ id: 'vm' + String(m.id), dir: 'inbound', dur: num(m.duration), at: toMs(m.timestamp), url: m.recording_url }));
      v?.items.forEach((it) => setTrackUrl(it.id, it.url));
    });
  }
  return r;
}

export async function loadRecordings() {
  const r = await wc<{ call_records?: { direction?: string; user_name?: string; recording_url?: string; duration?: Str; timestamp?: Str }[] }>('recordings');
  if (r.ok || r.code === 400) {
    mutate((d) => {
      d.recordings = (r.data?.call_records ?? []).map((c, i): Recording => ({
        id: 'r' + i + String(c.timestamp ?? ''),
        name: c.user_name ?? '',
        phone: c.user_name && /^\+?\d+$/.test(c.user_name) ? e164(c.user_name) : '',
        dir: String(c.direction ?? '').startsWith('in') ? 'in' : 'out',
        dur: num(c.duration),
        at: toMs(c.timestamp),
        url: c.recording_url,
      }));
      d.recordings.forEach((rec) => setTrackUrl(rec.id, rec.url));
    });
  }
  return r;
}

export async function loadUsage() {
  const date = new Date().toISOString().slice(0, 10);
  const r = await wc<UsageRaw>('usage', { date });
  if (r.ok && r.data) {
    const m = (x?: Partial<UsageMonth>): UsageMonth => ({ incoming_call: String(x?.incoming_call ?? 0), outgoing_call: String(x?.outgoing_call ?? 0), sms_received: String(x?.sms_received ?? 0), sms_sent: String(x?.sms_sent ?? 0) });
    mutate((d) => { d.usage = { thisMonth: m(r.data.this_month_usage), previousMonth: m(r.data.previous_month_usage) }; });
  }
  return r;
}

export async function loadDevices() {
  const r = await wc<{ logged_in_devices?: { device_name?: string }[] }>('devices');
  if (r.ok) {
    mutate((d) => {
      d.devices = (r.data?.logged_in_devices ?? []).map((x, i) => {
        const name = x.device_name || 'Device';
        const type = /\(web\)/i.test(name) ? 'web' : /iphone|ipad|ios/i.test(name) ? 'ios' : 'android';
        return { id: 'dv' + i, name, type, os: '', current: false, seen: 0 };
      });
    });
  }
  return r;
}

/** Everything the main screens show. Failures leave the cached copy in place. */
export async function syncAll() {
  await Promise.all([loadProfile(), loadCredit()]);
  loadFriends();
  // App chat connects in the background; it loads the chat and group lists itself (chat.ts).
  startChat();
  await Promise.all([loadSmsThreads(), loadCalls(), loadBlocklist(), loadVoicemails()]);
  mutate((d) => { d.syncedAt = Date.now(); });
}

/* ---------------- broadcasts ---------------- */
type BroadcastMsg = { id: Str; body?: string; timestamp?: Str; is_media_attached?: Str; media_url?: string };
export async function loadBroadcasts() {
  const r = await wc<{ broadcast_id: Str; receipants_name?: string; last_message?: BroadcastMsg | string | null }[]>('broadcasts', undefined, undefined, 'GET');
  if (r.ok || r.code === 400) {
    mutate((d) => {
      d.broadcasts = (Array.isArray(r.data) ? r.data : []).map((b) => {
        const id = String(b.broadcast_id);
        const old = d.broadcasts.find((x) => x.id === id);
        const lm = b.last_message;
        const preview: Message[] = lm && typeof lm === 'object' ? [{ id: 'p' + String(lm.id), out: true, body: lm.body ?? '', at: toMs(lm.timestamp), status: 'sent' }]
          : typeof lm === 'string' && lm ? [{ id: 'p' + id, out: true, body: lm, at: Date.now(), status: 'sent' }] : [];
        return { id, recipients: old?.recipients ?? [], title: b.receipants_name, messages: old?.messages.length ? old.messages : preview };
      });
    });
  }
  return r;
}
export async function loadBroadcastMessages(id: string) {
  const r = await wc<{ recipients_name?: string; conversion?: BroadcastMsg[] }>('broadcastMessages', { broadcast_id: id });
  if (r.ok && r.data) {
    mutate((d) => {
      const b = d.broadcasts.find((x) => x.id === id);
      if (!b) return;
      const pending = b.messages.filter((m) => m.status !== 'sent');
      b.messages = [...(r.data.conversion ?? []).map((m) => ({ id: String(m.id), out: true, body: m.body ?? '', at: toMs(m.timestamp), status: 'sent' as const, image: on(m.is_media_attached) && m.media_url ? m.media_url : null })).sort((a, c) => a.at - c.at), ...pending];
      if (r.data.recipients_name) b.title = r.data.recipients_name;
    });
  }
  return r;
}

/* ---------------- saving ---------------- */
/**
 * Applies a change straight away, saves it with `action`, and if the backend refuses, reloads
 * the real values and says why. Returns whether it was saved.
 */
export async function persist(
  action: string,
  params: Record<string, string | number | boolean | null | undefined>,
  apply: (d: AppData) => void,
  opts: { files?: Record<string, Blob>; ok?: string; method?: 'POST' | 'DELETE' } = {},
): Promise<boolean> {
  mutate(apply);
  const r = await wc(action, params, opts.files, opts.method ?? 'POST');
  if (r.ok) { if (opts.ok) toastLater(opts.ok); return true; }
  await loadProfile();
  toastLater(r.code === 403 && /pro/i.test(r.message) ? 'This is a Pro feature. Upgrade in the iPhone app.' : r.message || 'Couldn’t save that. Please try again.');
  return false;
}
// ui.ts imports the store too; loading it lazily keeps this module free of import cycles.
const toastLater = (msg: string) => { import('./ui').then(({ toast }) => toast(msg)); };

/* ---------------- polling ---------------- */
// The backend has no live connection for the web (the apps get push notifications), so the web app
// checks for new messages and calls while it's open and visible.
let timer: ReturnType<typeof setInterval> | null = null;
export function startPolling() {
  if (timer) return;
  let tick = 0;
  timer = setInterval(() => {
    if (document.visibilityState !== 'visible' || getData().stage !== 'main') return;
    tick++;
    loadSmsThreads();
    if (tick % 3 === 0) { loadCalls(); loadVoicemails(); }
    if (tick % 12 === 0) loadCredit();
  }, 10_000);
}
export function stopPolling() { if (timer) clearInterval(timer); timer = null; }

/* ---------------- session ---------------- */
/** Clears everything local and returns to the sign-in flow. */
export function signOutLocal() {
  stopPolling();
  stopChat();
  stopPhone();
  const launches = getData().launches;
  useApp.setState({ data: { ...seed(), stage: 'auth', launches, ratingSeen: true } });
  firebaseSignOut();
}

/** Ends this browser's session on the backend, then locally. */
export async function signOut() {
  await wc('session', undefined, undefined, 'DELETE');
  signOutLocal();
}

setSignedOutHandler(signOutLocal);

export type { AppData };
