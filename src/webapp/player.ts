'use client';

/* Simulated audio player for voicemail / recordings / greeting review (no real audio in the demo). */
import { create } from 'zustand';

interface PlayerState { id: string | null; t: number; dur: number; playing: boolean }
export const usePlayer = create<PlayerState>()(() => ({ id: null, t: 0, dur: 0, playing: false }));

let timer: ReturnType<typeof setInterval> | null = null;
const clear = () => { if (timer) clearInterval(timer); timer = null; };

/** Play/pause `id`; switching ids restarts from 0. */
export function togglePlay(id: string, dur: number) {
  const s = usePlayer.getState();
  if (s.id === id && s.playing) { clear(); usePlayer.setState({ playing: false }); return; }
  if (s.id !== id) { clear(); usePlayer.setState({ id, t: 0, dur }); }
  usePlayer.setState({ playing: true });
  clear();
  timer = setInterval(() => {
    const p = usePlayer.getState();
    const t = Math.min(p.dur, p.t + 0.25);
    if (t >= p.dur) { clear(); usePlayer.setState({ t, playing: false }); } else usePlayer.setState({ t });
  }, 250);
}
/** Select an item without playing (expands its card). */
export function selectTrack(id: string, dur: number) { clear(); usePlayer.setState({ id, t: 0, dur, playing: false }); }
export function stopPlayer() { clear(); usePlayer.setState({ id: null, t: 0, dur: 0, playing: false }); }
export function scrubTo(pct: number) { const p = usePlayer.getState(); if (p.id) usePlayer.setState({ t: p.dur * Math.min(1, Math.max(0, pct)) }); }
