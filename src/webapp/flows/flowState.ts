'use client';

/* Flow-local state for the pre-login journey (not persisted). */
import { create } from 'zustand';

export type AuthStep = 'phone' | 'otp' | 'details';
export type SetupStep = 'access' | 'number' | 'done';
export type PermState = 'idle' | 'requesting' | 'granted' | 'denied';
type PermKey = 'mic' | 'notif' | 'contacts';

interface FlowState {
  /** +1 when moving forward, -1 when going back — drives the slide direction. */
  dir: 1 | -1;
  page: number;
  pay: number;
  auth: AuthStep;
  setup: SetupStep;
  country: string;
  phone: string;
  otp: string;
  resend: number;
  perm: Record<PermKey, PermState>;
}

export const useFlow = create<FlowState>()(() => ({
  dir: 1, page: 0, pay: 0, auth: 'phone', setup: 'access', country: 'US', phone: '', otp: '', resend: 0,
  perm: { mic: 'idle', notif: 'idle', contacts: 'idle' },
}));

export const setFlow = (p: Partial<FlowState>) => useFlow.setState(p);
/** Move forward (or back with dir -1) and apply the patch in one update. */
export const forward = (p: Partial<FlowState>) => useFlow.setState({ ...p, dir: 1 });
export const backward = (p: Partial<FlowState>) => useFlow.setState({ ...p, dir: -1 });
