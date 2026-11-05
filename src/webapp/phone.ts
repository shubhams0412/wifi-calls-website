'use client';

/*
 * Paid calls to phone numbers, like the iPhone app (Core/Voice/CallController.placeCall). The number's
 * provider (purchased_phone_number_info.provider_slug) picks the voice SDK:
 *
 *  Twilio (TwilioVoiceClient.swift):
 *   - token: wsqr_getCapabilityToken (Twilio access token, identity = username), fetched fresh per call;
 *   - connect params: To (E.164), From (the purchased number), CallerName, DeviceToken;
 *     the backend's TwiML app (wsqr_makeOutboundCall) dials, records and bills the call.
 *  Vonage (VonageVoiceClient.swift):
 *   - token: the same endpoint returns a Vonage JWT (provider = "vonage"); createSession(token), region US;
 *   - serverCall({ to }): the backend's answer URL reads `to` and finds the caller from the session user.
 *
 * Both: after the call, wsqr_endCallUpdateStatus {call_sid, duration} finalises the call log and billing.
 */

import type { Call, Device } from '@twilio/voice-sdk';
import type { VonageClient } from '@vonage/client-sdk';
import { create } from 'zustand';
import { wc } from './api';
import { getData } from './store';

export type PhonePhase = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended';
export interface PhoneCallState {
  phase: PhonePhase;
  number: string;
  name: string;
  muted: boolean;
  startedAt: number | null;
  endReason: string;
}

const IDLE: PhoneCallState = { phase: 'idle', number: '', name: '', muted: false, startedAt: null, endReason: '' };
export const usePhoneCall = create<PhoneCallState>()(() => ({ ...IDLE }));
const set = (p: Partial<PhoneCallState>) => usePhoneCall.setState(p);
const phase = () => usePhoneCall.getState().phase;

/** The call in progress, whichever SDK carries it. */
interface ActiveCall { hangUp(): void; mute(muted: boolean): void; digits(d: string): void; sid(): string | undefined }
let active: ActiveCall | null = null;
let hungUpByMe = false;

const connected = () => { if (phase() !== 'connected' && phase() !== 'ended') set({ phase: 'connected', startedAt: Date.now() }); };
const ringing = () => { if (phase() === 'connecting') set({ phase: 'ringing' }); };

async function fetchToken(): Promise<{ token: string; provider: string } | null> {
  const r = await wc<{ token?: string; provider?: string }>('callToken');
  return r.ok && r.data?.token ? { token: r.data.token, provider: r.data.provider || 'twilio' } : null;
}

const MIC = 'Allow microphone access in your browser to make calls.';
const UNAVAILABLE = 'Calling isn’t available right now. Please try again later.';

/** Places a call; resolves with an error message if it couldn't start. */
export async function placePhoneCallNow(number: string, name: string): Promise<string | null> {
  if (phase() !== 'idle') return 'You’re already on a call.';
  const from = getData().number;
  if (!from) return 'Get a phone number first to make calls.';
  hungUpByMe = false;
  set({ ...IDLE, phase: 'connecting', number, name });

  const t = await fetchToken();
  if (!t) { finish('Couldn’t start the call. Please try again.'); return null; }
  if (phase() !== 'connecting') return null; // cancelled while waiting
  // The token says which provider the backend chose; trust it over our cached slug.
  if (t.provider === 'vonage') await callWithVonage(t.token, number);
  else await callWithTwilio(t.token, number, from, name);
  return null;
}

/* ---------------- Twilio ---------------- */

let device: Device | null = null;

function twilioMessage(error: { code?: number; message?: string } | undefined): string {
  const code = error?.code ?? 0;
  if (code === 31208 || code === 31401 || code === 31402 || /permission|NotAllowed/i.test(error?.message ?? '')) return MIC;
  if (code === 31486) return 'Busy';
  if (code === 31480 || code === 31404) return 'Not available';
  if (code === 31603) return 'Declined';
  if (code === 20104 || code === 31205) return 'Your session expired. Try the call again.';
  // The backend issued a token Twilio won't accept: a server setup problem, not something the user can fix.
  if (code === 20101 || code === 20103 || code === 31204) return UNAVAILABLE;
  if (code >= 31000 && code < 31100) return 'Connection problem. Check your internet and try again.';
  return 'The call couldn’t be completed.';
}

async function twilioDevice(token: string): Promise<Device> {
  const { Device: TwilioDevice, Call: TwilioCall } = await import('@twilio/voice-sdk');
  if (device) { device.updateToken(token); return device; }
  device = new TwilioDevice(token, {
    codecPreferences: [TwilioCall.Codec.Opus, TwilioCall.Codec.PCMU],
    closeProtection: 'You’re on a call. Leaving this page will end it.',
    logLevel: 'error',
  });
  // Tokens last an hour; keep a long call alive past that.
  device.on('tokenWillExpire', async () => { const t = await fetchToken(); if (t && t.provider !== 'vonage') device?.updateToken(t.token); });
  // Device-level errors (e.g. a token Twilio rejects) end the call being placed with a readable reason.
  device.on('error', (e: { code?: number; message?: string }) => {
    console.warn('[phone] device error', e?.code, e?.message);
    if (phase() !== 'idle') finish(twilioMessage(e));
  });
  return device;
}

async function callWithTwilio(token: string, number: string, from: string, name: string) {
  try {
    const d = await twilioDevice(token);
    const call: Call = await d.connect({ params: { To: number, From: from, CallerName: name || number, DeviceToken: 'blank' } });
    active = { hangUp: () => call.disconnect(), mute: (m) => call.mute(m), digits: (x) => call.sendDigits(x), sid: () => call.parameters?.CallSid };
    if (hungUpByMe) { call.disconnect(); return; }
    call.on('ringing', ringing);
    call.on('accept', connected);
    call.on('mute', (muted: boolean) => set({ muted }));
    call.on('disconnect', () => finish(hungUpByMe || usePhoneCall.getState().startedAt ? 'Call ended' : 'No answer'));
    call.on('cancel', () => finish('Call ended'));
    call.on('reject', () => finish('Declined'));
    call.on('error', (e: { code?: number; message?: string }) => { console.warn('[phone] call error', e?.code, e?.message); finish(twilioMessage(e)); });
  } catch (error) {
    console.warn('[phone] twilio connect failed', error);
    finish(twilioMessage(error as { code?: number; message?: string }));
  }
}

/* ---------------- Vonage ---------------- */

let vonage: VonageClient | null = null;
let vonageSession = false;
let vonageCallId: string | null = null;
// A recorded call's NCCO opens a setup leg that completes before the callee rings; ignore that
// `COMPLETED` until a leg has actually rung or answered (as iOS does).
let sawLegProgress = false;

const VONAGE_HANGUP: Record<string, string> = {
  REMOTE_HANGUP: 'Call ended', LOCAL_HANGUP: 'Call ended', REMOTE_REJECT: 'Declined', REMOTE_BUSY: 'Busy',
  REMOTE_NO_ANSWER_TIMEOUT: 'No answer', REMOTE_NOT_FOUND: 'Not available', MEDIA_TIMEOUT: 'Connection lost', REMOTE_FAILURE: 'The call couldn’t be completed.',
};

async function vonageClient(): Promise<VonageClient> {
  if (vonage) return vonage;
  const { VonageClient: Client } = await import('@vonage/client-sdk');
  // Region must match the backend's Vonage application (the iPhone app hardcodes US).
  const c = new Client({ region: 'US' } as never);
  c.on('legStatusUpdate', (callId: string, _leg: string, status: string) => {
    if (callId !== vonageCallId) return;
    if (status === 'RINGING') { sawLegProgress = true; ringing(); }
    else if (status === 'ANSWERED') { sawLegProgress = true; connected(); }
    else if (status === 'COMPLETED' && sawLegProgress) finish('Call ended');
  });
  c.on('callHangup', (callId: string, _q: unknown, reason: string) => {
    if (callId !== vonageCallId) return;
    finish(hungUpByMe ? 'Call ended' : VONAGE_HANGUP[reason] ?? 'Call ended');
  });
  c.on('callMediaError', (callId: string, error: unknown) => { if (callId === vonageCallId) { console.warn('[phone] vonage media', error); finish('Connection lost'); } });
  c.on('sessionError', () => { vonageSession = false; });
  vonage = c;
  return c;
}

function vonageMessage(error: unknown): string {
  const text = String((error as { message?: string })?.message ?? error ?? '');
  if (/NotAllowed|permission|microphone/i.test(text)) return MIC;
  if (/token|jwt|auth|session/i.test(text)) return UNAVAILABLE;
  return 'The call couldn’t be completed.';
}

async function callWithVonage(token: string, number: string) {
  try {
    const c = await vonageClient();
    sawLegProgress = false;
    // A fresh token per call, like iOS; replace any older session first.
    if (vonageSession) { await c.deleteSession().catch(() => undefined); vonageSession = false; }
    await c.createSession(token);
    vonageSession = true;
    if (phase() !== 'connecting') return; // cancelled while connecting
    const callId = await c.serverCall({ to: number });
    vonageCallId = callId;
    active = {
      hangUp: () => { c.hangup(callId).catch(() => finish('Call ended')); },
      mute: (m) => { (m ? c.mute(callId) : c.unmute(callId)).catch(() => undefined); },
      digits: (x) => { c.sendDTMF(callId, x).catch(() => undefined); },
      sid: () => callId,
    };
    if (hungUpByMe) active.hangUp();
  } catch (error) {
    console.warn('[phone] vonage call failed', error);
    finish(vonageMessage(error));
  }
}

/* ---------------- controls ---------------- */

export function hangUpPhone() {
  hungUpByMe = true;
  if (active) active.hangUp();
  else finish('Cancelled');
}

export function setPhoneMuted(muted: boolean) {
  active?.mute(muted);
  set({ muted });
}

/** DTMF tones for menus ("press 1…"). */
export function sendPhoneDigits(digits: string) { active?.digits(digits); }

function finish(reason: string) {
  const call = active;
  active = null;
  vonageCallId = null;
  const st = usePhoneCall.getState();
  if (st.phase === 'idle' || st.phase === 'ended') return;
  const sid = call?.sid();
  const duration = st.startedAt ? Math.round((Date.now() - st.startedAt) / 1000) : 0;
  set({ phase: 'ended', endReason: reason });
  setTimeout(() => { if (phase() === 'ended') usePhoneCall.setState({ ...IDLE }); }, 1500);

  // Tell the backend (call log + billing; for Vonage this also cancels a callee still ringing),
  // then refresh history and balance.
  (async () => {
    if (sid) await wc('endCall', { call_sid: sid, duration: String(duration) }).catch(() => undefined);
    const { loadCalls, loadCredit } = await import('./sync');
    await Promise.all([loadCalls(), loadCredit()]).catch(() => undefined);
  })();
}

/** On sign-out: drop both SDKs and their tokens. */
export function stopPhone() {
  try { active?.hangUp(); } catch { /* already gone */ }
  try { device?.destroy(); } catch { /* fine */ }
  if (vonage && vonageSession) vonage.deleteSession().catch(() => undefined);
  active = null; device = null; vonageSession = false; vonageCallId = null;
  usePhoneCall.setState({ ...IDLE });
}
