'use client';

/*
 * App-to-app voice, video and group calls over QuickBlox WebRTC, compatible with the iPhone app
 * (Core/Voice/QuickBloxGroupCallClient.swift):
 *  - signalling rides the chat (XMPP) connection from chat.ts, so chat must be connected;
 *  - the invite carries the same userInfo as iOS: `info` = caller's name, `video` = "1" for video;
 *  - the callee's iPhone is woken with the same VoIP push payload (VOIPCall, SESSION_ID, CALLER_NAME…);
 *  - the backend doesn't record app calls (iOS keeps its own log), so the web logs them locally.
 * A browser can only ring while the web app is open in a tab.
 */

import type QBSDK from 'quickblox';
import type { QBWebRTCSession } from 'quickblox';
import { create } from 'zustand';
import { fetchNames, nameOf, onQuickBlox, quickBlox, senderName, startChat } from './chat';
import type { CallLog } from './data';
import { getData, mutate } from './store';

type QB = typeof QBSDK;

export type PeerState = 'ringing' | 'connecting' | 'connected' | 'rejected' | 'left' | 'no-answer';
export type CallPhase = 'idle' | 'dialing' | 'incoming' | 'connecting' | 'connected' | 'ended';

export interface Peer { id: number; name: string; state: PeerState; stream?: MediaStream }
export interface CallState {
  phase: CallPhase;
  incoming: boolean;
  video: boolean;
  group: boolean;
  title: string;
  peers: Record<number, Peer>;
  local: MediaStream | null;
  muted: boolean;
  cameraOn: boolean;
  startedAt: number | null;
  /** Shown on the ended screen, e.g. "No answer". */
  endReason: string;
  /** Media permission problem, shown as a note while the call carries on. */
  mediaError: string;
}

const IDLE: CallState = {
  phase: 'idle', incoming: false, video: false, group: false, title: '', peers: {}, local: null,
  muted: false, cameraOn: false, startedAt: null, endReason: '', mediaError: '',
};
export const useCall = create<CallState>()(() => ({ ...IDLE }));

let session: QBWebRTCSession | null = null;
let log: (CallLog & { members: string[] }) | null = null;
const set = (p: Partial<CallState>) => useCall.setState(p);
const setPeer = (id: number, p: Partial<Peer>) => useCall.setState((s) => {
  const old = s.peers[id] ?? { id, name: nameOf(id), state: 'ringing' as PeerState };
  return { peers: { ...s.peers, [id]: { ...old, ...p } } };
});

/* ---------------- ringing tones ---------------- */

// Generated with Web Audio so no sound files are needed: a two-tone ring for incoming calls,
// a single long beep every 4 s for ringback while dialling.
let tone: { ctx: AudioContext; timer: ReturnType<typeof setInterval> } | null = null;
function startTone(kind: 'ring' | 'ringback') {
  stopTone();
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  ctx.resume().catch(() => undefined);
  const beep = (freq: number, at: number, len: number) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + at);
    gain.gain.linearRampToValueAtTime(kind === 'ring' ? 0.18 : 0.08, ctx.currentTime + at + 0.02);
    gain.gain.setValueAtTime(kind === 'ring' ? 0.18 : 0.08, ctx.currentTime + at + len - 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + at + len);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + at); osc.stop(ctx.currentTime + at + len);
  };
  const play = kind === 'ring'
    ? () => { beep(880, 0, 0.4); beep(660, 0.45, 0.4); beep(880, 1, 0.4); beep(660, 1.45, 0.4); }
    : () => { beep(440, 0, 1.6); };
  play();
  tone = { ctx, timer: setInterval(play, kind === 'ring' ? 3000 : 4000) };
}
function stopTone() {
  if (!tone) return;
  clearInterval(tone.timer);
  tone.ctx.close().catch(() => undefined);
  tone = null;
}

let notice: Notification | null = null;
function notifyIncoming(title: string, video: boolean) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !document.hidden) return;
  try {
    notice = new Notification(video ? 'Incoming video call' : 'Incoming call', { body: title, tag: 'wc-call', requireInteraction: true });
    notice.onclick = () => { window.focus(); notice?.close(); };
  } catch { /* some browsers only allow notifications from a service worker */ }
}

/* ---------------- media ---------------- */

async function getMedia(s: QBWebRTCSession, video: boolean): Promise<MediaStream | null> {
  const ask = (v: boolean) => new Promise<MediaStream>((resolve, reject) =>
    s.getUserMedia({ audio: true, video: v ? { facingMode: 'user' } : false } as never, (err, stream) => (err ? reject(err) : resolve(stream as MediaStream))));
  try {
    return await ask(video);
  } catch (error) {
    if (video) {
      // No camera, or camera refused: carry on with audio only.
      try { const a = await ask(false); set({ cameraOn: false, mediaError: 'Your camera isn’t available, so you’re on audio only.' }); return a; } catch { /* fall through */ }
    }
    console.warn('[call] media', error);
    set({ mediaError: 'Allow microphone access in your browser to talk on this call.' });
    return null;
  }
}

/* ---------------- placing calls ---------------- */

export interface AppCallTarget { qbIds: number[]; title: string; video: boolean; group: boolean }

/** Starts a call to one or more app users. Resolves false (with a reason) if it couldn't start. */
export async function placeAppCall(t: AppCallTarget): Promise<{ ok: boolean; message?: string }> {
  if (useCall.getState().phase !== 'idle') return { ok: false, message: 'You’re already on a call.' };
  if (!t.qbIds.length) return { ok: false, message: t.group ? 'This group has no one else to call.' : 'This contact can’t be called yet.' };
  set({ ...IDLE, phase: 'dialing', video: t.video, cameraOn: t.video, group: t.group, title: t.title,
    peers: Object.fromEntries(t.qbIds.map((id) => [id, { id, name: nameOf(id), state: 'ringing' as PeerState }])) });
  startTone('ringback');

  if (!(await startChat())) { finish('Couldn’t connect. Check your connection and try again.'); return { ok: false }; }
  const c = quickBlox()!;
  const ids = t.qbIds.filter((id) => id !== c.myId);
  if (!ids.length) { finish(''); return { ok: false, message: 'This group has no one else to call.' }; }
  // Group member lists include us; drop our own tile.
  useCall.setState((s) => ({ peers: Object.fromEntries(Object.entries(s.peers).filter(([id]) => Number(id) !== c.myId)) }));
  fetchNames(ids).then(() => ids.forEach((id) => setPeer(id, { name: nameOf(id) })));

  const s = c.qb.webrtc.createNewSession(ids, t.video ? c.qb.webrtc.CallType.VIDEO : c.qb.webrtc.CallType.AUDIO);
  session = s;
  const local = await getMedia(s, t.video);
  if (session !== s) return { ok: false }; // hung up while the browser was asking for permission
  set({ local });

  const myName = senderName() || 'Wi-Fi Calls user';
  s.call(t.video ? { info: myName, video: '1' } : { info: myName });
  log = { id: 'qb:' + s.ID, phone: '', name: t.title, dir: 'out', dur: 0, at: Date.now(), type: t.group ? 'group' : t.video ? 'video' : 'app', members: ids.map(String) };
  wakePhones(c.qb, c.pushEnvironment, ids, s.ID, myName, t);
  return { ok: true };
}

/** The VoIP push the iPhone app sends (QuickBloxGroupCallClient.startCall), so a locked iPhone rings. */
function wakePhones(qb: QB, environment: string, ids: number[], sessionId: string, myName: string, t: AppCallTarget) {
  const u = getData().user;
  const first = u.first || myName.split(' ')[0] || 'User';
  const kind = t.video ? 'video call' : 'call';
  const payload = {
    message: t.group ? `Group ${kind} from ${first} in ${t.title}` : `${t.video ? 'Video call' : 'Call'} from ${myName}`,
    ios_voip: '1', VOIPCall: '1', ...(t.group ? { GROUP_CALL: '1' } : {}),
    SESSION_ID: sessionId, CALLER_NAME: myName, CALLER_IMAGE: '', VIDEO_CALL: t.video ? '1' : '0',
  };
  const message = 'payload=' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  // No push_type, like iOS: QuickBlox delivers to every subscription, including the iPhone's VoIP token.
  qb.pushnotifications.events.create(
    { notification_type: 'push', environment, user: { ids: ids.join(',') }, message } as never,
    // 422 = none of them has a phone registered for pushes; the in-app invite still goes out.
    (err) => { if (err && (err as { code?: number }).code !== 422) console.warn('[call] push', err); },
  );
}

/* ---------------- answering ---------------- */

export async function acceptCall() {
  const s = session;
  if (!s || useCall.getState().phase !== 'incoming') return;
  stopTone(); notice?.close();
  set({ phase: 'connecting' });
  const local = await getMedia(s, useCall.getState().video);
  if (session !== s) return;
  set({ local });
  s.accept({});
  if (log) log.dir = 'in';
}

export function declineCall() {
  if (!session) return;
  if (log) log.dir = 'in'; // set first: rejecting can close the session synchronously
  try { session.reject({}); } catch { /* already gone */ }
  finish('Declined');
}

/* ---------------- in-call controls ---------------- */

export function hangUp() {
  const s = session;
  if (!s) { finish(''); return; }
  const { phase, incoming } = useCall.getState();
  try {
    if (incoming && phase === 'incoming') { if (log) log.dir = 'in'; s.reject({}); }
    else s.stop({ reason: 'user_hangup' });
  } catch { /* already closed */ }
  finish(phase === 'connected' ? 'Call ended' : incoming ? 'Declined' : 'Cancelled');
}

export function toggleMute() {
  const muted = !useCall.getState().muted;
  try { if (muted) session?.mute('audio'); else session?.unmute('audio'); } catch { /* no local stream */ }
  set({ muted });
}

export function toggleCamera() {
  const cameraOn = !useCall.getState().cameraOn;
  const track = useCall.getState().local?.getVideoTracks()[0];
  if (!track) return;
  track.enabled = cameraOn;
  set({ cameraOn });
}

export async function switchCamera() {
  const s = session, local = useCall.getState().local;
  const qb = quickBlox()?.qb;
  if (!s || !local || !qb) return false;
  const cams = await qb.webrtc.getMediaDevices('videoinput').catch(() => [] as MediaDeviceInfo[]);
  if (cams.length < 2) return false;
  const current = local.getVideoTracks()[0]?.getSettings().deviceId;
  const next = cams[(cams.findIndex((c) => c.deviceId === current) + 1) % cams.length];
  return new Promise<boolean>((resolve) => s.switchMediaTracks({ video: { exact: next.deviceId } }, (err, stream) => {
    if (!err && stream) set({ local: stream as MediaStream });
    resolve(!err);
  }));
}

/* ---------------- ending ---------------- */

function finish(reason: string) {
  stopTone(); notice?.close();
  const s = session;
  session = null;
  const st = useCall.getState();
  st.local?.getTracks().forEach((t) => t.stop());
  if (s) { try { quickBlox()?.qb.webrtc.clearSession(s.ID); } catch { /* fine */ } }

  if (log) {
    const entry = { ...log, dur: st.startedAt ? Math.round((Date.now() - st.startedAt) / 1000) : 0 };
    mutate((d) => { d.calls = [entry, ...d.calls.filter((c) => c.id !== entry.id)]; });
    log = null;
  }
  if (st.phase === 'idle') return;
  set({ phase: 'ended', endReason: reason, local: null });
  setTimeout(() => { if (useCall.getState().phase === 'ended') useCall.setState({ ...IDLE }); }, 1500);
}

/** Ends the call once nobody else is still in it (or still ringing). */
function endIfAlone(reason: string) {
  const left = Object.values(useCall.getState().peers).some((p) => p.state === 'ringing' || p.state === 'connecting' || p.state === 'connected');
  if (!left) finish(reason);
}

function connected() {
  stopTone();
  const st = useCall.getState();
  if (st.phase !== 'connected') set({ phase: 'connected', startedAt: st.startedAt ?? Date.now() });
}

/* ---------------- incoming events ---------------- */

const mine = (s: QBWebRTCSession) => session !== null && s.ID === session.ID;

onQuickBlox((qb) => {
  const w = qb.webrtc;

  w.onCallListener = (s, ext) => {
    const c = quickBlox();
    // Busy (or an invite we already have): turn it down, as the iPhone app does.
    if (session || useCall.getState().phase !== 'idle') { if (!session || s.ID !== session.ID) s.reject({ reason: 'busy' }); return; }
    session = s;
    const video = s.callType === w.CallType.VIDEO || ext?.video === '1';
    const others = [...new Set([s.initiatorID, ...s.opponentsIDs])].filter((id) => id !== c?.myId);
    const callerName = getData().contacts.find((x) => x.qbId === String(s.initiatorID))?.name || (ext?.info as string) || nameOf(s.initiatorID);
    const group = others.length > 1;
    const title = group ? (getData().groups.find((g) => g.name && others.every((id) => g.members.some((m) => m.qbId === String(id))))?.name || `${callerName} + ${others.length - 1}`) : callerName;
    set({ ...IDLE, phase: 'incoming', incoming: true, video, cameraOn: video, group, title,
      peers: Object.fromEntries(others.map((id) => [id, { id, name: id === s.initiatorID ? callerName : nameOf(id), state: (id === s.initiatorID ? 'connecting' : 'ringing') as PeerState }])) });
    log = { id: 'qb:' + s.ID, phone: getData().contacts.find((x) => x.qbId === String(s.initiatorID))?.phone || '', name: title, dir: 'missed', dur: 0, at: Date.now(), type: group ? 'group' : video ? 'video' : 'app', members: others.map(String) };
    fetchNames(others).then(() => others.forEach((id) => { if (id !== s.initiatorID) setPeer(id, { name: nameOf(id) }); }));
    startTone('ring');
    notifyIncoming(title, video);
  };

  w.onAcceptCallListener = (s, userId) => {
    if (!mine(s)) return;
    stopTone();
    setPeer(userId, { state: 'connecting' });
    if (useCall.getState().phase === 'dialing') set({ phase: 'connecting' });
  };

  w.onRemoteStreamListener = (s, userId, stream) => {
    if (!mine(s)) return;
    setPeer(userId, { stream, state: 'connected' });
    connected();
  };

  w.onSessionConnectionStateChangedListener = (s, userId, state) => {
    if (!mine(s)) return;
    const S = w.SessionConnectionState;
    if (state === S.CONNECTED || state === S.COMPLETED) { setPeer(userId, { state: 'connected' }); connected(); }
    else if (state === S.FAILED || state === S.CLOSED) { setPeer(userId, { state: 'left', stream: undefined }); endIfAlone('Call ended'); }
  };

  w.onRejectCallListener = (s, userId, ext) => {
    if (!mine(s)) return;
    setPeer(userId, { state: 'rejected' });
    endIfAlone(ext?.reason === 'busy' ? 'Busy' : 'Declined');
  };

  w.onStopCallListener = (s, userId) => {
    if (!mine(s)) return;
    // The caller cancelled before we answered: that's a missed call.
    if (useCall.getState().phase === 'incoming') { finish('Missed call'); return; }
    setPeer(userId, { state: 'left', stream: undefined });
    endIfAlone('Call ended');
  };

  w.onUserNotAnswerListener = (s, userId) => {
    if (!mine(s)) return;
    setPeer(userId, { state: 'no-answer' });
    endIfAlone('No answer');
  };

  w.onSessionCloseListener = (s) => {
    if (!mine(s)) return;
    finish(useCall.getState().phase === 'incoming' ? 'Missed call' : 'Call ended');
  };
});
