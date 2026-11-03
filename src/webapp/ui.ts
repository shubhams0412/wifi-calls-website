'use client';

/* Ephemeral UI state: toasts, sheet stack, dialogs, the active call, paywall and buy-number covers,
   plus the gates that decide whether a paid action may proceed. Rendered by <Overlays/>. */
import { createElement, type ReactNode } from 'react';
import { create } from 'zustand';
import { getData, isBlocked, contactByPhone, isPro } from './store';
import { APP_NAME, digits } from './format';

export type CallKind = 'phone' | 'app' | 'video' | 'group';
export interface CallRequest { kind: CallKind; name?: string; phone?: string; members?: string[] }

export interface SheetEntry { id: number; node: ReactNode; wide?: boolean; dialog?: boolean; dismissible?: boolean }
interface Toast { id: number; text: string }

interface UIStore {
  toasts: Toast[];
  sheets: SheetEntry[];
  call: CallRequest | null;
  paywallOpen: boolean;
  buyNumberOpen: boolean;
}

export const useUI = create<UIStore>()(() => ({ toasts: [], sheets: [], call: null, paywallOpen: false, buyNumberOpen: false }));

let seq = 0;

const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();
const TOAST_MS = 2800, MAX_TOASTS = 3;

/** Show a short message. Repeating the same message (e.g. tapping a button several times) keeps a
    single toast and restarts its timer; at most three different toasts are shown at once. */
export function toast(text: string) {
  const prev = toastTimers.get(text);
  if (prev) clearTimeout(prev);
  if (!useUI.getState().toasts.some((t) => t.text === text)) {
    const id = ++seq;
    useUI.setState((s) => ({ toasts: [...s.toasts, { id, text }].slice(-MAX_TOASTS) }));
  }
  toastTimers.set(text, setTimeout(() => {
    toastTimers.delete(text);
    useUI.setState((s) => ({ toasts: s.toasts.filter((t) => t.text !== text) }));
  }, TOAST_MS));
}

/** Push a sheet (bottom sheet on phones, centred modal on desktop). The node owns its own state. */
export function openSheet(node: ReactNode, opts: { wide?: boolean; dialog?: boolean; dismissible?: boolean } = {}) {
  const id = ++seq;
  useUI.setState((s) => ({ sheets: [...s.sheets, { id, node, ...opts }] }));
  return id;
}
export const closeSheet = () => useUI.setState((s) => ({ sheets: s.sheets.slice(0, -1) }));
export const closeAllSheets = () => useUI.setState({ sheets: [] });

/* ---- dialogs (rendered by <Dialog/> in Overlays; resolve on button press) ---- */
export interface ConfirmOpts { title: string; message?: string; ok?: string; cancel?: string; danger?: boolean }
export interface PromptOpts { title: string; placeholder?: string; value?: string; ok?: string }
type DialogEntry =
  | ({ kind: 'confirm'; resolve: (v: boolean) => void } & ConfirmOpts)
  | ({ kind: 'prompt'; resolve: (v: string | null) => void } & PromptOpts);
export const useDialog = create<{ dialog: DialogEntry | null }>()(() => ({ dialog: null }));

export const confirmDialog = (o: ConfirmOpts) =>
  new Promise<boolean>((resolve) => useDialog.setState({ dialog: { kind: 'confirm', resolve, ...o } }));
export const alertDialog = (title: string, message?: string) => confirmDialog({ title, message, ok: 'OK', cancel: 'Close' });
export const promptDialog = (o: PromptOpts) =>
  new Promise<string | null>((resolve) => useDialog.setState({ dialog: { kind: 'prompt', resolve, ...o } }));

/* ---- covers ---- */
export const openPaywall = () => useUI.setState({ paywallOpen: true });
export const closePaywall = () => useUI.setState({ paywallOpen: false });
export const openBuyNumber = () => useUI.setState({ buyNumberOpen: true });
export const closeBuyNumber = () => useUI.setState({ buyNumberOpen: false });
/** True when Pro; otherwise opens the paywall and returns false. */
export function requirePro(): boolean {
  if (isPro(getData())) return true;
  openPaywall();
  return false;
}

/* ---- navigation from non-component code (set by the app shell) ---- */
let navigateImpl: (href: string) => void = (href) => { window.location.href = href; };
export const setNavigate = (fn: (href: string) => void) => { navigateImpl = fn; };
/** Navigate inside the web app, e.g. go('messages/sms/s1') → /app/messages/sms/s1. */
export const go = (path: string) => navigateImpl('/app/' + path.replace(/^\/+/, ''));

/* ---- calls ---- */
export function startCall(req: CallRequest) {
  if (useUI.getState().call) { toast("You're already on a call."); return; }
  const d = getData();
  if ((req.kind === 'video' || req.kind === 'app') && req.phone) {
    const c = contactByPhone(d, req.phone);
    if (c && !c.friend) { toast(`This contact isn't on ${APP_NAME} yet.`); return; }
  }
  if (req.kind === 'group' && !requirePro()) return;
  useUI.setState({ call: req });
}
export const endCallUI = () => useUI.setState({ call: null });

/** Paid phone call — same gate order as DialpadView: subscription → number → coins. */
export function placePhoneCall(phone: string, name?: string) {
  const d = getData();
  if (!digits(phone)) { toast('Enter a valid phone number to call.'); return; }
  if (d.tier === 'none') { openPaywall(); return; }
  if (!d.number) { toast('Get a phone number first to make calls.'); openBuyNumber(); return; }
  if (d.coins <= 0) { toast("You're out of coins — top up to keep calling."); go('settings/coins'); return; }
  if (isBlocked(d, phone)) { toast('You have blocked this number.'); return; }
  startCall({ kind: 'phone', phone, name: name || contactByPhone(d, phone)?.name || '' });
}

/** Gate for sending SMS (subscription → number → coins). */
export function canSendSms(): boolean {
  const d = getData();
  if (d.tier === 'none') { openPaywall(); return false; }
  if (!d.number) { toast('Get a phone number first to send SMS.'); openBuyNumber(); return false; }
  if (d.coins <= 0) { toast("You're out of coins — top up to keep texting."); go('settings/coins'); return false; }
  return true;
}

/* ---- clipboard / share (fall back to a copy sheet when the browser refuses) ---- */
export async function copyText(text: string, okMsg = 'Copied!') {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); toast(okMsg); return; }
  } catch { /* fall through */ }
  const { CopySheet } = await import('./components/CopySheet');
  openSheet(createElement(CopySheet, { text }));
}
export async function shareText(text: string) {
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return;
  }
  copyText(text, 'Invite link copied');
}
