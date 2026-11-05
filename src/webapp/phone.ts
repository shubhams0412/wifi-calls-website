'use client';

/*
 * Paid calls to phone numbers through Twilio, like the iPhone app (Core/Voice/TwilioVoiceClient.swift,
 * CallController.placeCall):
 *  - token: wsqr_getCapabilityToken (a Twilio access token, identity = username), fetched fresh per call;
 *  - connect params: To (E.164), From (the user's purchased number), CallerName, DeviceToken;
 *    the backend's TwiML app (wsqr_makeOutboundCall) dials, records and bills the call;
 *  - after the call: wsqr_endCallUpdateStatus {call_sid, duration} finalises the call log and billing.
 * Vonage numbers use a different SDK and aren't connected yet.
 */

import type { Call, Device } from '@twilio/voice-sdk';
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

let device: Device | null = null;
let active: Call | null = null;
let hungUpByMe = false;

async function fetchToken(): Promise<string | null> {
  const r = await wc<{ token?: string }>('callToken');
  return r.ok && r.data?.token ? r.data.token : null;
}

async function getDevice(token: string): Promise<Device> {
  const { Device: TwilioDevice, Call: TwilioCall } = await import('@twilio/voice-sdk');
  if (device) { device.updateToken(token); return device; }
  device = new TwilioDevice(token, {
    codecPreferences: [TwilioCall.Codec.Opus, TwilioCall.Codec.PCMU],
    closeProtection: 'You’re on a call. Leaving this page will end it.',
    logLevel: 'error',
  });
  // Tokens last an hour; keep a long call alive past that.
  device.on('tokenWillExpire', async () => { const t = await fetchToken(); if (t) device?.updateToken(t); });
  // Device-level errors (e.g. a token Twilio rejects) end the call being placed with a readable reason.
  device.on('error', (e: { code?: number; message?: string }) => {
    console.warn('[phone] device error', e?.code, e?.message);
    if (usePhoneCall.getState().phase !== 'idle') finish(describe(e));
  });
  return device;
}

/** Twilio error → something a person can act on. */
function describe(error: { code?: number; message?: string } | undefined): string {
  const code = error?.code ?? 0;
  if (code === 31208 || code === 31401 || code === 31402 || /permission|NotAllowed/i.test(error?.message ?? '')) return 'Allow microphone access in your browser to make calls.';
  if (code === 31486) return 'Busy';
  if (code === 31480 || code === 31404) return 'Not available';
  if (code === 31603) return 'Declined';
  if (code === 20104 || code === 31205) return 'Your session expired. Try the call again.';
  // The backend issued a token Twilio won't accept: a server setup problem, not something the user can fix.
  if (code === 20101 || code === 20103 || code === 31204) return 'Calling isn’t available right now. Please try again later.';
  if (code >= 31000 && code < 31100) return 'Connection problem. Check your internet and try again.';
  return 'The call couldn’t be completed.';
}

/** Places a call; resolves with an error message if it couldn't start. */
export async function placeTwilioCall(number: string, name: string): Promise<string | null> {
  if (usePhoneCall.getState().phase !== 'idle') return 'You’re already on a call.';
  const from = getData().number;
  if (!from) return 'Get a phone number first to make calls.';
  hungUpByMe = false;
  set({ ...IDLE, phase: 'connecting', number, name });

  const token = await fetchToken();
  if (!token) { finish('Couldn’t start the call. Please try again.'); return null; }
  if (usePhoneCall.getState().phase !== 'connecting') return null; // cancelled while waiting

  try {
    const d = await getDevice(token);
    const call = await d.connect({ params: { To: number, From: from, CallerName: name || number, DeviceToken: 'blank' } });
    active = call;
    if (hungUpByMe) { call.disconnect(); return null; }
    call.on('ringing', () => { if (usePhoneCall.getState().phase === 'connecting') set({ phase: 'ringing' }); });
    call.on('accept', () => set({ phase: 'connected', startedAt: Date.now() }));
    call.on('mute', (muted: boolean) => set({ muted }));
    call.on('disconnect', () => finish(hungUpByMe ? 'Call ended' : usePhoneCall.getState().startedAt ? 'Call ended' : 'No answer'));
    call.on('cancel', () => finish('Call ended'));
    call.on('reject', () => finish('Declined'));
    call.on('error', (e: { code?: number; message?: string }) => { console.warn('[phone] call error', e?.code, e?.message); finish(describe(e)); });
  } catch (error) {
    console.warn('[phone] connect failed', error);
    finish(describe(error as { code?: number; message?: string }));
  }
  return null;
}

export function hangUpPhone() {
  hungUpByMe = true;
  if (active) active.disconnect();
  else finish('Cancelled');
}

export function setPhoneMuted(muted: boolean) {
  active?.mute(muted);
  set({ muted });
}

/** DTMF tones for menus ("press 1…"). */
export function sendPhoneDigits(digits: string) { active?.sendDigits(digits); }

function finish(reason: string) {
  const call = active;
  active = null;
  const st = usePhoneCall.getState();
  if (st.phase === 'idle' || st.phase === 'ended') return;
  const sid = call?.parameters?.CallSid;
  const duration = st.startedAt ? Math.round((Date.now() - st.startedAt) / 1000) : 0;
  set({ phase: 'ended', endReason: reason });
  setTimeout(() => { if (usePhoneCall.getState().phase === 'ended') usePhoneCall.setState({ ...IDLE }); }, 1500);

  // Tell the backend (call log + billing), then refresh history and balance.
  (async () => {
    if (sid) await wc('endCall', { call_sid: sid, duration: String(duration) }).catch(() => undefined);
    const { loadCalls, loadCredit } = await import('./sync');
    await Promise.all([loadCalls(), loadCredit()]).catch(() => undefined);
  })();
}

/** On sign-out: drop the Twilio device and its token. */
export function stopPhone() {
  try { active?.disconnect(); device?.destroy(); } catch { /* already gone */ }
  active = null; device = null;
  usePhoneCall.setState({ ...IDLE });
}
