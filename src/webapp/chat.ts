'use client';

/*
 * App-to-app chat and groups over QuickBlox, compatible with the iPhone app
 * (Core/Chat/LiveQuickBloxChatService.swift):
 *  - our server signs in to QuickBlox and gives the browser a session token (api/wc chatSession);
 *  - 1:1 chats are QuickBlox private dialogs (type 3), groups are group dialogs (type 2) that the
 *    backend creates and updates (wsqr_createGroup / wsqr_updateGroup / wsqr_deleteGroup);
 *  - messages carry the same custom parameters as iOS (save_to_history, dialog_id, type, senderName)
 *    and send the same APNs push, so iPhone users are notified of web messages.
 */

import type QBSDK from 'quickblox';
import type { QBChatDialog, QBChatMessage, QBChatXMPPMessage } from 'quickblox';
import { create } from 'zustand';
import { wc } from './api';
import type { ChatThread, Contact, Group, GroupMember, Message } from './data';
import { getData, mutate } from './store';

type QB = typeof QBSDK;
interface Session { token: string; qbUserId: number; appId: number; accountKey: string; pushEnvironment: 'development' | 'production' }
interface Dialog { id: string; type: number; occupants: number[]; jid: string; name: string }

/** Connection state for the chat screens. */
export const useChat = create<{ state: 'off' | 'connecting' | 'on' | 'error'; message: string; typing: Record<string, number> }>()(
  () => ({ state: 'off', message: '', typing: {} }),
);

let qb: QB | null = null;
let session: Session | null = null;
let starting: Promise<boolean> | null = null;
let openThread: string | null = null;
const dialogs = new Map<string, Dialog>();
const userNames = new Map<number, string>();

const me = () => session?.qbUserId ?? 0;
const cb = <T>(fn: (done: (err: unknown, res?: T | null) => void) => void) =>
  new Promise<T>((resolve, reject) => fn((err, res) => (err ? reject(err) : resolve(res as T))));

/* ---------------- connection ---------------- */

/** Connects to QuickBlox chat (once) and loads the conversation list. Safe to call repeatedly. */
export function startChat(): Promise<boolean> {
  if (qb?.chat.isConnected) return Promise.resolve(true);
  starting ??= connect().finally(() => { starting = null; });
  return starting;
}

async function connect(): Promise<boolean> {
  useChat.setState({ state: 'connecting', message: '' });
  const r = await wc<Session>('chatSession', undefined, undefined, 'GET');
  if (!r.ok || !r.data) { useChat.setState({ state: 'error', message: r.message || 'Chat is unavailable right now.' }); return false; }
  session = r.data;
  try {
    if (!qb) {
      qb = ((await import('quickblox/quickblox.min.js')) as unknown as { default: QB }).default;
      qb.initWithAppId(session.appId, session.accountKey, { chatProtocol: { active: 2 }, streamManagement: { enable: true } } as never);
      await qb.ready?.();
      listen(qb);
    }
    await cb((done) => qb!.startSessionWithToken(session!.token, done));
    await cb((done) => qb!.chat.connect({ userId: session!.qbUserId, password: session!.token }, done));
    useChat.setState({ state: 'on', message: '' });
    await Promise.all([loadDialogs(), loadGroups()]);
    return true;
  } catch (error) {
    console.warn('[chat] connect failed', error);
    useChat.setState({ state: 'error', message: 'Couldn’t connect to chat. Check your connection and try again.' });
    return false;
  }
}

export function stopChat() {
  try { if (qb?.chat.isConnected) qb.chat.disconnect(); } catch { /* already closed */ }
  session = null; dialogs.clear(); openThread = null;
  useChat.setState({ state: 'off', message: '', typing: {} });
}

function listen(q: QB) {
  q.chat.onMessageListener = onMessage;
  q.chat.onMessageTypingListener = (isTyping, userId, dialogId) => {
    if (userId === me()) return;
    const id = dialogId || [...dialogs.values()].find((d) => d.type === 3 && d.occupants.includes(userId))?.id;
    if (!id) return;
    useChat.setState((s) => {
      const typing = { ...s.typing };
      if (isTyping) typing[id] = Date.now(); else delete typing[id];
      return { typing };
    });
  };
  q.chat.onReconnectListener = () => { useChat.setState({ state: 'on' }); loadDialogs(); if (openThread) loadMessages(openThread); };
  q.chat.onDisconnectedListener = () => useChat.setState({ state: 'connecting' });
  // QuickBlox sessions last two hours; get a fresh token from our server and reconnect.
  q.chat.onSessionExpiredListener = () => { stopChat(); startChat(); };
  q.chat.onDialogUpdatedListener = () => { loadDialogs(); loadGroups(); };
}

/* ---------------- names ---------------- */

const contactByQb = (qbId: number | string) => getData().contacts.find((c) => c.qbId === String(qbId));

function nameOf(qbId: number): string {
  return contactByQb(qbId)?.name || userNames.get(qbId) || 'Wi-Fi Calls user';
}

/** Looks up QuickBlox names for people who aren't in the contact list. */
async function fetchNames(ids: number[]) {
  const missing = [...new Set(ids)].filter((id) => id !== me() && !contactByQb(id) && !userNames.has(id));
  if (!missing.length || !qb) return;
  try {
    const res = await cb<{ items: { user: { id: number; full_name?: string; login?: string } }[] }>((done) =>
      qb!.users.listUsers({ filter: { field: 'id', param: 'in', value: missing }, per_page: 100 } as never, done as never));
    for (const { user } of res.items ?? []) userNames.set(user.id, user.full_name || 'Wi-Fi Calls user');
  } catch { /* names fall back to "Wi-Fi Calls user" */ }
}

/* ---------------- dialogs ---------------- */

const roomJid = (dialogId: string) => qb!.chat.helpers.getRoomJidFromDialogId(dialogId);

export async function loadDialogs() {
  if (!qb?.chat.isConnected) return;
  let items: QBChatDialog[] = [];
  try {
    const res = await cb<{ items: QBChatDialog[] }>((done) => qb!.chat.dialog.list({ limit: 100, sort_desc: 'last_message_date_sent' }, done));
    items = (res.items ?? []).filter((d) => d.type === 2 || d.type === 3);
  } catch (error) { console.warn('[chat] dialogs', error); return; }

  await fetchNames(items.flatMap((d) => d.occupants_ids));
  for (const d of items) {
    const known = dialogs.get(d._id);
    dialogs.set(d._id, { id: d._id, type: d.type, occupants: d.occupants_ids, jid: d.type === 2 ? roomJid(d._id) : '', name: d.name });
    // Group messages only arrive after joining the room (as on iOS).
    if (d.type === 2 && !known) qb.chat.muc.join(roomJid(d._id), () => undefined);
  }

  mutate((data) => {
    data.chats = items.map((d): ChatThread => {
      const old = data.chats.find((c) => c.id === d._id);
      const other = d.type === 3 ? d.occupants_ids.find((id) => id !== me()) : undefined;
      const at = (d.last_message_date_sent ?? 0) * 1000 || Date.parse(d.updated_at) || Date.now();
      const preview: Message[] = d.last_message
        ? [{ id: 'p' + d._id, out: d.last_message_user_id === me(), body: d.last_message, at, status: 'sent' }] : [];
      // Keep a loaded conversation unless something newer arrived.
      const keep = old?.full && old.messages.length && (old.messages[old.messages.length - 1].at >= at - 1000);
      return {
        id: d._id,
        name: d.type === 2 ? d.name : nameOf(other ?? 0),
        group: d.type === 2,
        groupId: d.type === 2 ? d._id : undefined,
        qbId: other != null ? String(other) : undefined,
        friendId: other != null ? contactByQb(other)?.id : undefined,
        unread: openThread === d._id ? 0 : d.unread_messages_count ?? 0,
        messages: keep ? old!.messages : preview,
        full: keep ? true : false,
        lastPage: keep ? old!.lastPage : undefined,
        created: Date.parse(d.created_at) || at,
      };
    });
  });
}

/** Finds or creates the 1:1 chat with an app friend; returns its id. */
export async function chatWith(contact: Contact): Promise<string | null> {
  if (!contact.qbId) return null;
  const existing = getData().chats.find((c) => !c.group && c.qbId === contact.qbId);
  if (existing) return existing.id;
  if (!(await startChat())) return null;
  try {
    const d = await cb<QBChatDialog>((done) => qb!.chat.dialog.create({ type: 3, occupants_ids: [Number(contact.qbId)] } as never, done));
    await loadDialogs();
    return d._id;
  } catch (error) {
    console.warn('[chat] create dialog', error);
    return null;
  }
}

/** Opens the 1:1 chat with an app friend, creating it if needed (the buttons on contacts, dial pad, groups). */
export async function openChatWith(contact: Contact) {
  const { go, toast } = await import('./ui');
  if (!contact.qbId) return toast(`${contact.name} isn’t on Wi-Fi Calls yet.`);
  const id = await chatWith(contact);
  if (id) go('messages/chat/' + id);
  else toast(useChat.getState().message || 'Couldn’t open the chat. Please try again.');
}

/* ---------------- messages ---------------- */

function toMessage(m: QBChatMessage | QBChatXMPPMessage, dialogType: number): Message {
  const x = m as Partial<QBChatMessage> & Partial<QBChatXMPPMessage> & Record<string, unknown>;
  const sender = Number(x.sender_id ?? 0);
  const attachment = (x.attachments ?? x.extension?.attachments ?? []).find((a) => a.type === 'image');
  const image = attachment ? qb!.content.privateUrl(String(attachment.id)) : null;
  const body = (x.message ?? x.body ?? '') as string;
  const senderName = (x.senderName ?? x.extension?.senderName) as string | undefined;
  const at = Number(x.date_sent ?? x.extension?.date_sent ?? 0) * 1000 || Date.now();
  return {
    id: String(x._id ?? x.extension?.message_id ?? x.id),
    out: sender === me(),
    // iOS sends "Photo" as the text of an image message.
    body: image && body === 'Photo' ? '' : body,
    at,
    status: 'sent',
    sender: dialogType === 2 && sender !== me() ? contactByQb(sender)?.name || senderName || nameOf(sender) : null,
    image,
  };
}

/** Loads the newest messages of a chat (or the next older page) and marks it read. */
export async function loadMessages(threadId: string, older = false) {
  if (!(await startChat())) return;
  const dialog = dialogs.get(threadId);
  const thread = getData().chats.find((c) => c.id === threadId);
  if (!dialog || !thread) return;
  const skip = older ? thread.messages.filter((m) => !m.id.startsWith('p') && m.status !== 'sending').length : 0;
  try {
    const res = await cb<{ items: QBChatMessage[] }>((done) =>
      qb!.chat.message.list({ chat_dialog_id: threadId, sort_desc: 'date_sent', limit: 50, skip } as never, done));
    const items = res.items ?? [];
    await fetchNames(items.map((m) => m.sender_id));
    const fetched = items.map((m) => toMessage(m, dialog.type)).reverse();
    mutate((d) => {
      const t = d.chats.find((c) => c.id === threadId);
      if (!t) return;
      const pending = t.messages.filter((m) => m.status !== 'sent');
      const kept = older ? t.messages.filter((m) => !m.id.startsWith('p') && m.status === 'sent') : [];
      const byId = new Map([...fetched, ...kept].map((m) => [m.id, m]));
      t.messages = [...byId.values(), ...pending.filter((p) => !byId.has(p.id))].sort((a, b) => a.at - b.at);
      t.full = true;
      t.lastPage = items.length < 50;
      t.unread = 0;
    });
    // Tell the senders their messages were read (blue ticks on iOS).
    for (const m of items) {
      if (m.sender_id !== me() && !(m.read_ids ?? []).includes(me())) qb!.chat.sendReadStatus({ messageId: m._id, dialogId: threadId, userId: m.sender_id });
    }
  } catch (error) { console.warn('[chat] messages', error); }
}

/** Which chat is on screen (incoming messages there don't count as unread). */
export function setOpenThread(id: string | null) { openThread = id; }

function onMessage(userId: number, msg: QBChatXMPPMessage) {
  const dialogId = msg.dialog_id || msg.extension?.dialog_id;
  if (!dialogId) return;
  const dialog = dialogs.get(dialogId);
  if (!dialog) { loadDialogs(); return; }
  useChat.setState((s) => { const typing = { ...s.typing }; delete typing[dialogId]; return { typing }; });
  const m = toMessage({ ...msg, sender_id: userId } as never, dialog.type);
  mutate((d) => {
    const t = d.chats.find((c) => c.id === dialogId);
    if (!t) return;
    // Our own group messages come back from the room: they replace the pending copy.
    const i = t.messages.findIndex((x) => x.id === m.id);
    if (i >= 0) { t.messages[i] = { ...t.messages[i], status: 'sent' }; return; }
    t.messages.push(m);
    if (!m.out && openThread !== dialogId) t.unread = (t.unread || 0) + 1;
  });
  if (!m.out && msg.markable) {
    qb!.chat.sendDeliveredStatus({ messageId: m.id, dialogId, userId });
    if (openThread === dialogId) qb!.chat.sendReadStatus({ messageId: m.id, dialogId, userId });
  }
}

const senderName = () => {
  const u = getData().user;
  return `${u.first || ''} ${u.last || ''}`.trim() || u.username || '';
};

const dataUrlToBlob = (dataUrl: string) => fetch(dataUrl).then((r) => r.blob());

/** Sends a text and/or photo to a chat. The message shows straight away and is marked failed if it can't be sent. */
export async function sendChat(threadId: string, input: { body?: string; image?: string | null }) {
  const local: Message = { id: 'local-' + Date.now().toString(36), out: true, body: input.body || '', at: Date.now(), status: 'sending', image: input.image ?? null };
  mutate((d) => { d.chats.find((c) => c.id === threadId)?.messages.push(local); });
  const fail = () => mutate((d) => {
    const m = d.chats.find((c) => c.id === threadId)?.messages.find((x) => x.id === local.id);
    if (m) m.status = 'failed';
  });

  if (!(await startChat())) return fail();
  const dialog = dialogs.get(threadId);
  if (!dialog) return fail();
  try {
    let attachments: { id: string; type: string }[] | undefined;
    if (input.image) {
      const blob = await dataUrlToBlob(input.image);
      const file = await cb<{ uid: string }>((done) =>
        qb!.content.createAndUpload({ file: blob, name: 'photo.jpg', type: blob.type || 'image/jpeg', size: blob.size, public: false }, done as never));
      attachments = [{ id: file.uid, type: 'image' }];
    }
    const body = input.body || (attachments ? 'Photo' : '');
    const name = senderName();
    const message = {
      type: dialog.type === 2 ? 'groupchat' : 'chat',
      body,
      extension: { save_to_history: 1, dialog_id: threadId, type: String(dialog.type), ...(name ? { senderName: name } : {}), ...(attachments ? { attachments } : {}) },
      markable: 1,
    } as const;
    const to = dialog.type === 2 ? dialog.jid : dialog.occupants.find((id) => id !== me())!;
    const id = qb!.chat.send(to, message as never);
    mutate((d) => {
      const m = d.chats.find((c) => c.id === threadId)?.messages.find((x) => x.id === local.id);
      if (m) { m.id = id; m.status = 'sent'; }
    });
    pushToRecipients(dialog, body);
  } catch (error) {
    console.warn('[chat] send', error);
    fail();
  }
}

/** Same APNs push the iPhone app sends, so the recipients' phones show the message. */
function pushToRecipients(dialog: Dialog, preview: string) {
  const ids = dialog.occupants.filter((id) => id !== me());
  if (!ids.length || !session) return;
  const payload = {
    aps: { alert: { title: 'New Message', body: preview }, sound: 'default' },
    type: 'chat', dialog_id: dialog.id, is_group: dialog.type === 3 ? '0' : '1', dialog_name: dialog.name ?? '',
    sender_qb_id: String(me()), senderName: senderName() || 'New message', message: preview,
  };
  const message = 'payload=' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  qb!.pushnotifications.events.create(
    { notification_type: 'push', push_type: 'apns', environment: session.pushEnvironment, user: { ids: ids.join(',') }, message } as never,
    // 422 means none of the recipients has a phone registered for pushes; the message itself was delivered.
    (err) => { if (err && (err as { code?: number }).code !== 422) console.warn('[chat] push', err); },
  );
}

export function sendTyping(threadId: string, typing: boolean) {
  const dialog = dialogs.get(threadId);
  if (!dialog || !qb?.chat.isConnected) return;
  const to = dialog.type === 2 ? dialog.jid : dialog.occupants.find((id) => id !== me());
  if (to == null) return;
  if (typing) qb.chat.sendIsTypingStatus(to); else qb.chat.sendIsStopTypingStatus(to);
}

/** Removes a 1:1 chat from this user's list (as on iOS; the other person keeps theirs). */
export async function deleteChat(threadId: string): Promise<boolean> {
  if (!(await startChat())) return false;
  try {
    await cb((done) => qb!.chat.dialog.delete(threadId, done));
    dialogs.delete(threadId);
    mutate((d) => { d.chats = d.chats.filter((c) => c.id !== threadId); });
    return true;
  } catch (error) { console.warn('[chat] delete', error); return false; }
}

/* ---------------- groups (backend) ---------------- */

interface GroupRow { is_admin?: number | string | boolean; quick_blox_chat_dialog_id: string; group_name: string; group_icon?: string; occupants_ids?: string }
interface MemberRow { is_admin?: number | string | boolean; full_name?: string; quickblox_id: number | string }
const truthy = (v: unknown) => v === true || v === 1 || v === '1';

function member(qbId: string, admin = false, name?: string): GroupMember {
  const mine = qbId === String(me()) || qbId === getData().user.quickbloxId;
  return { qbId, admin, name: mine ? 'You' : (name?.trim() || contactByQb(qbId)?.name || userNames.get(Number(qbId)) || 'Wi-Fi Calls user') };
}

export async function loadGroups() {
  const r = await wc<{ groups?: GroupRow[] }>('groups');
  if (!r.ok && r.code !== 400) return r;
  const rows = r.data?.groups ?? [];
  await fetchNames(rows.flatMap((g) => (g.occupants_ids ?? '').split(',').map(Number).filter(Boolean)));
  mutate((d) => {
    d.groups = rows.map((g): Group => {
      const old = d.groups.find((x) => x.id === g.quick_blox_chat_dialog_id);
      const ids = (g.occupants_ids ?? '').split(',').map((x) => x.trim()).filter(Boolean);
      return {
        id: g.quick_blox_chat_dialog_id, dialog: g.quick_blox_chat_dialog_id, name: g.group_name, admin: truthy(g.is_admin),
        icon: g.group_icon || undefined,
        // Keep the detailed member list (with admins) if it's been loaded.
        members: old?.members.length === ids.length ? old.members : ids.map((id) => member(id)),
      };
    });
  });
  return r;
}

export async function loadGroup(id: string) {
  const r = await wc<{ group_name?: string; group_icon?: string; members?: MemberRow[] }>('group', { group_id: id }, undefined, 'GET');
  if (r.ok && r.data) {
    const data = r.data;
    mutate((d) => {
      const g = d.groups.find((x) => x.id === id);
      if (!g) return;
      if (data.group_name) g.name = data.group_name;
      g.members = (data.members ?? []).map((m) => member(String(m.quickblox_id), truthy(m.is_admin), m.full_name));
    });
  }
  return r;
}

export async function createGroup(name: string, memberQbIds: string[], icon?: Blob) {
  const r = await wc<{ quick_blox_chat_dialog_id?: string }>('createGroup', { name, type: '2', occupants_ids: memberQbIds.join(',') }, icon ? { group_icon: icon } : undefined);
  if (r.ok) { await loadGroups(); await loadDialogs(); }
  return r;
}

export async function renameGroup(id: string, name: string) {
  const r = await wc('updateGroup', { quick_blox_chat_dialog_id: id, name });
  if (r.ok) mutate((d) => {
    const g = d.groups.find((x) => x.id === id); if (g) g.name = name;
    const t = d.chats.find((c) => c.id === id); if (t) t.name = name;
  });
  return r;
}

/** Adds (push_all) or removes (pull_all) members, as the backend expects. */
export async function changeMembers(id: string, qbIds: string[], add: boolean) {
  const r = await wc('updateGroup', { quick_blox_chat_dialog_id: id, occupants_ids: qbIds.join(','), type: add ? 'push_all' : 'pull_all' });
  if (r.ok) { await loadGroup(id); loadDialogs(); }
  return r;
}

/** The admin deletes the group for everyone; anyone else leaves it. */
export async function leaveGroup(id: string) {
  const r = await wc('deleteGroup', { quick_blox_chat_dialog_id: id, force: '' });
  if (r.ok) {
    try { if (qb?.chat.isConnected) qb.chat.muc.leave(roomJid(id), () => undefined); } catch { /* not joined */ }
    dialogs.delete(id);
    mutate((d) => { d.groups = d.groups.filter((g) => g.id !== id); d.chats = d.chats.filter((c) => c.id !== id); });
  }
  return r;
}
