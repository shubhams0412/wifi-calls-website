'use client';

/* Audio player for voicemail, recordings and the greeting review. Tracks with a URL (see
   setTrackUrl) play real audio; others (e.g. an unsaved greeting) just run the timer. */
import { create } from 'zustand';

interface PlayerState { id: string | null; t: number; dur: number; playing: boolean }
export const usePlayer = create<PlayerState>()(() => ({ id: null, t: 0, dur: 0, playing: false }));

const urls = new Map<string, string>();
/** Registers where a track's audio is (voicemail and recording URLs from the backend). */
export const setTrackUrl = (id: string, url: string | undefined) => { if (url) urls.set(id, url); };

let timer: ReturnType<typeof setInterval> | null = null;
let audio: HTMLAudioElement | null = null;
const clear = () => { if (timer) clearInterval(timer); timer = null; audio?.pause(); };

function play(id: string) {
  const url = urls.get(id);
  if (url) {
    if (!audio || audio.dataset.id !== id) {
      audio?.pause();
      audio = new Audio(url);
      audio.dataset.id = id;
      audio.ontimeupdate = () => { if (usePlayer.getState().id === id) usePlayer.setState({ t: audio!.currentTime }); };
      audio.onloadedmetadata = () => { if (Number.isFinite(audio!.duration)) usePlayer.setState({ dur: audio!.duration }); };
      audio.onended = () => usePlayer.setState({ playing: false, t: 0 });
      audio.onerror = () => { usePlayer.setState({ playing: false }); import('./ui').then(({ toast }) => toast('This recording couldn’t be played.')); };
    }
    audio.currentTime = usePlayer.getState().t;
    audio.play().catch(() => usePlayer.setState({ playing: false }));
    return;
  }
  timer = setInterval(() => {
    const p = usePlayer.getState();
    const t = Math.min(p.dur, p.t + 0.25);
    if (t >= p.dur) { clear(); usePlayer.setState({ t, playing: false }); } else usePlayer.setState({ t });
  }, 250);
}

/** Play/pause `id`; switching ids restarts from 0. */
export function togglePlay(id: string, dur: number) {
  const s = usePlayer.getState();
  if (s.id === id && s.playing) { clear(); usePlayer.setState({ playing: false }); return; }
  if (s.id !== id) { clear(); usePlayer.setState({ id, t: 0, dur }); }
  usePlayer.setState({ playing: true });
  clear();
  play(id);
}
/** Select an item without playing (expands its card). */
export function selectTrack(id: string, dur: number) { clear(); usePlayer.setState({ id, t: 0, dur, playing: false }); }
export function stopPlayer() { clear(); usePlayer.setState({ id: null, t: 0, dur: 0, playing: false }); }
export function scrubTo(pct: number) {
  const p = usePlayer.getState();
  if (!p.id) return;
  const t = p.dur * Math.min(1, Math.max(0, pct));
  usePlayer.setState({ t });
  if (audio && audio.dataset.id === p.id) audio.currentTime = t;
}
