'use client';

/* In-call screens (CallingView / GroupCallingView / VideoCallingView), simulated:
   connecting → ringing → connected, then logged to Recents when ended. */
import { useEffect, useRef, useState } from 'react';
import { uid } from '../data';
import { cx, fmtPhone, initial, mmss } from '../format';
import { Icon } from '../icons';
import { contactById, getData, isPro, mutate } from '../store';
import { endCallUI, toast, useUI, type CallRequest } from '../ui';
import { Avatar } from '../components/ui';

type State = 'connecting' | 'ringing' | 'connected' | 'ended';

function chipText(kind: CallRequest['kind'], st: State) {
  const grp = kind === 'group';
  if (kind === 'phone') return { connecting: 'Outgoing', ringing: 'Ringing', connected: 'Connected', ended: 'Call ended' }[st];
  return { connecting: grp ? 'Outgoing group call' : 'Outgoing', ringing: grp ? 'Outgoing group call' : 'Outgoing', connected: 'Connected', ended: 'Ended' }[st];
}
const statusText = (st: State, t: number) => ({ connecting: 'Calling…', ringing: 'Ringing…', connected: mmss(t), ended: 'Call ended' }[st]);

/* DTMF keypad sheet */
function KeypadSheet({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState('');
  const keys: [string, string][] = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
  return (
    <>
      <div className="sheet-head">
        <div className="mono" style={{ flex: 1, fontSize: 26, fontWeight: 600, minHeight: 34 }}>{typed}</div>
        <button className="link-btn" style={{ fontSize: 16 }} onClick={onClose}>Done</button>
      </div>
      <div className="sheet-body">
        <div className="keypad small">
          {keys.map(([k, l]) => (
            <button key={k} className="key" onClick={() => setTyped((s) => s + k)}><b>{k}</b><small>{l || ' '}</small></button>
          ))}
        </div>
      </div>
    </>
  );
}

function Ctrl({ icon, label, on, onClick }: { icon: Parameters<typeof Icon>[0]['name']; label: string; on?: boolean; onClick: () => void }) {
  return <button className={cx('cbtn', on && 'on')} onClick={onClick}><span><Icon name={icon} /></span><small>{label}</small></button>;
}

/** Self-view tile with the real camera; draggable, snaps to the nearest corner. */
function SelfView({ videoOn, streamRef }: { videoOn: boolean; streamRef: React.MutableRefObject<MediaStream | null> }) {
  const tile = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoOn) return;
    let cancelled = false;
    const attach = (s: MediaStream) => { if (video.current) video.current.srcObject = s; };
    if (streamRef.current) attach(streamRef.current);
    else if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s; attach(s);
      }).catch(() => { /* camera refused or unavailable — placeholder stays */ });
    }
    return () => { cancelled = true; };
  }, [videoOn, streamRef]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = tile.current; if (!el) return;
    const sx = e.clientX, sy = e.clientY, r = el.getBoundingClientRect();
    el.setPointerCapture(e.pointerId); el.style.transition = 'none';
    const mv = (ev: PointerEvent) => { el.style.left = r.left + ev.clientX - sx + 'px'; el.style.top = r.top + ev.clientY - sy + 'px'; el.style.right = 'auto'; };
    const up = () => {
      el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up);
      const b = el.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
      el.style.transition = 'left .25s, top .25s';
      el.style.left = (b.left + b.width / 2 < W / 2 ? 16 : W - b.width - 16) + 'px';
      el.style.top = (b.top + b.height / 2 < H / 2 ? 90 : H - b.height - 140) + 'px';
    };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
  };

  return (
    <div className="v-self" ref={tile} onPointerDown={onDown}>
      {videoOn
        ? <><video ref={video} autoPlay muted playsInline /><span className="v-self-ph"><Icon name="user" /></span></>
        : <span className="v-off"><Icon name="videoOff" /></span>}
    </div>
  );
}

export default function CallScreen() {
  const req = useUI((s) => s.call) as CallRequest;
  const [st, setSt] = useState<State>('connecting');
  const [t, setT] = useState(0);
  const [mute, setMute] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [keypad, setKeypad] = useState(false);
  const [members, setMembers] = useState<Record<string, string>>(() =>
    Object.fromEntries((req.members ?? []).filter((m) => m !== 'me').map((m) => [m, 'Ringing'])));
  const started = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const ended = useRef(false);

  const stopStream = () => { stream.current?.getTracks().forEach((x) => x.stop()); stream.current = null; };

  // connecting → ringing → connected, then tick the timer.
  useEffect(() => {
    const a = setTimeout(() => setSt((s) => (s === 'connecting' ? 'ringing' : s)), 900);
    let tick: ReturnType<typeof setInterval> | undefined;
    const b = setTimeout(() => {
      if (ended.current) return;
      started.current = Date.now();
      setSt('connected');
      setMembers((m) => Object.fromEntries(Object.keys(m).map((id, i) => [id, i === 2 ? 'No answer' : 'Connected'])));
      tick = setInterval(() => setT(Math.floor((Date.now() - (started.current ?? Date.now())) / 1000)), 1000);
    }, 3200);
    return () => { clearTimeout(a); clearTimeout(b); if (tick) clearInterval(tick); stopStream(); };
  }, []);

  const end = () => {
    if (ended.current) return;
    ended.current = true;
    stopStream();
    setSt('ended');
    const dur = started.current ? Math.floor((Date.now() - started.current) / 1000) : 0;
    const d = getData();
    mutate((x) => {
      x.calls.unshift({ id: uid(), phone: req.phone || '', name: req.name || '', dir: 'out', dur, at: Date.now(), type: req.kind });
      if (req.kind === 'phone' && dur > 0) {
        x.coins = Math.max(0, +(x.coins - Math.ceil(dur / 60)).toFixed(2));
        if (isPro(d) && d.settings.recording) x.recordings.unshift({ id: uid(), name: req.name || '', phone: req.phone || '', dir: 'out', dur, at: Date.now() });
      }
    });
    setKeypad(false);
    setTimeout(endCallUI, 600);
  };

  // Esc hangs up (when no sheet/dialog is open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || useUI.getState().sheets.length) return;
      if (document.querySelector('.call-keypad')) { setKeypad(false); return; }
      end();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = getData();
  const title = req.name || fmtPhone(req.phone) || (req.kind === 'video' ? 'Video call' : 'Unknown');

  if (req.kind === 'video') {
    const cap = { connecting: 'Outgoing video call', ringing: 'Outgoing video call', connected: 'On video call', ended: 'Call ended' }[st];
    return (
      <div className="call-screen video" role="dialog" aria-label="Video call">
        <div className="v-remote">
          {st === 'connected'
            ? <div className="v-fake"><span className="avatar s144 solid">{initial(title) || '?'}</span><small>Video preview — demo</small></div>
            : <span className="avatar s144 solid">{initial(title) || '?'}</span>}
        </div>
        <div className="v-shade" />
        {st === 'connected' && <SelfView videoOn={videoOn} streamRef={stream} />}
        <div className="v-head"><small>{cap}</small><b>{title}</b><small>{statusText(st, t)}</small></div>
        <div className="v-ctrls">
          <button className={cx('vbtn', mute && 'on')} onClick={() => setMute(!mute)} title="Mute" aria-label="Mute"><Icon name={mute ? 'micOff' : 'mic'} /></button>
          <button className={cx('vbtn', !videoOn && 'on')} title="Camera" aria-label="Camera"
            onClick={() => { if (videoOn) stopStream(); setVideoOn(!videoOn); }}><Icon name={videoOn ? 'video' : 'videoOff'} /></button>
          <button className="vbtn" onClick={() => toast('Camera flipped')} title="Flip camera" aria-label="Flip camera"><Icon name="flipCamera" /></button>
          <button className="vbtn hang" onClick={end} title="Hang up" aria-label="Hang up"><Icon name="phoneDown" /></button>
        </div>
      </div>
    );
  }

  const others = (req.members ?? []).filter((m) => m !== 'me');
  const recording = req.kind === 'phone' && d.settings.recording && isPro(d) && st === 'connected';
  return (
    <div className="call-screen" role="dialog" aria-label="Call">
      <div className="c-bg"><i /><i /></div>
      <div className="c-inner">
        <div className="c-chip">{st === 'connected' ? <i className="live" /> : <Icon name="antenna" />}{chipText(req.kind, st)}</div>
        {req.kind === 'group' ? (
          <div className="c-rings big"><i /><i /><i />
            <div className="c-stack">{others.slice(0, 3).map((id) => <Avatar key={id} name={contactById(d, id)?.name ?? ''} size={110} />)}</div>
          </div>
        ) : (
          <div className={cx('c-rings', st === 'connected' && req.kind !== 'phone' && 'still')}><i /><i /><i />
            <Avatar name={title} size={168} />
            {recording && <span className="rec-dot" title="Recording" />}
          </div>
        )}
        <div className="c-text">
          <div className="c-name">{title}</div>
          {req.name && req.phone && <div className="c-num mono">{fmtPhone(req.phone)}</div>}
          <div className="c-status mono">{statusText(st, t)}</div>
          {req.kind === 'phone' && d.settings.anon && isPro(d) && <div className="c-note"><Icon name="userQ" /> Anonymous caller ID</div>}
        </div>
        {req.kind === 'group' && (
          <div className="c-strip">
            {Object.keys(members).map((id) => {
              const p = contactById(d, id), s = members[id];
              return (
                <div key={id} className={cx('c-mem', s === 'Ringing' && 'ringing')}>
                  <span className="m-av">{initial(p?.name) || '#'}</span>
                  <small>{p ? p.name.split(' ')[0] : 'User'}</small><em>{s}</em>
                </div>
              );
            })}
          </div>
        )}
        <div className="c-bottom">
          <div className="c-panel">
            <Ctrl icon={mute ? 'micOff' : 'mic'} label={mute ? 'Unmute' : 'Mute'} on={mute} onClick={() => setMute(!mute)} />
            {req.kind === 'phone' && <Ctrl icon="keypad" label="Keypad" onClick={() => setKeypad(true)} />}
            <Ctrl icon={speaker ? 'speakerWave' : 'speaker'} label="Speaker" on={speaker} onClick={() => setSpeaker(!speaker)} />
          </div>
          <button className="end-btn" onClick={end}><Icon name="phoneDown" /> End call</button>
        </div>
      </div>
      {keypad && (
        // Rendered inside the call screen: the shared sheet stack sits below it.
        <div className="overlay" style={{ zIndex: 85 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setKeypad(false); }}>
          <div className="sheet call-keypad" role="dialog" aria-modal="true" style={{ color: 'var(--text)' }}><KeypadSheet onClose={() => setKeypad(false)} /></div>
        </div>
      )}
    </div>
  );
}
