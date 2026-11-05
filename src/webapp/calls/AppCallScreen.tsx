'use client';

/* Real app-to-app call screens (voice, video, group) driven by rtc.ts. Incoming calls ring here too. */
import { useEffect, useRef, useState } from 'react';
import { cx, initial, mmss } from '../format';
import { Icon } from '../icons';
import { Avatar } from '../components/ui';
import { acceptCall, declineCall, hangUp, switchCamera, toggleCamera, toggleMute, useCall, type CallState, type Peer } from '../rtc';
import { toast, useUI } from '../ui';

const PEER_TEXT: Record<Peer['state'], string> = {
  ringing: 'Ringing', connecting: 'Connecting', connected: 'Connected', rejected: 'Declined', left: 'Left', 'no-answer': 'No answer',
};

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
}

function status(c: CallState, secs: number) {
  switch (c.phase) {
    case 'dialing': return 'Calling…';
    case 'incoming': return c.video ? 'Incoming video call' : c.group ? 'Incoming group call' : 'Incoming call';
    case 'connecting': return 'Connecting…';
    case 'connected': return mmss(secs);
    case 'ended': return c.endReason || 'Call ended';
    default: return '';
  }
}

/** Plays (or shows) a MediaStream. Remote audio must not be muted; the local preview always is. */
function Media({ stream, video, muted, mirror }: { stream?: MediaStream | null; video?: boolean; muted?: boolean; mirror?: boolean }) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== (stream ?? null)) el.srcObject = stream ?? null;
    if (stream) el.play().catch(() => undefined);
  }, [stream]);
  if (!video) return <audio ref={ref} autoPlay muted={muted} />;
  return <video ref={ref} autoPlay playsInline muted={muted} style={mirror ? { transform: 'scaleX(-1)' } : undefined} />;
}

const hasVideo = (s?: MediaStream) => !!s?.getVideoTracks().length;

function IncomingControls() {
  return (
    <div className="c-answer">
      <button className="vbtn hang big" onClick={declineCall} aria-label="Decline"><Icon name="phoneDown" /></button>
      <button className="vbtn accept big" onClick={acceptCall} aria-label="Accept"><Icon name="phone" /></button>
    </div>
  );
}

export default function AppCallScreen() {
  const c = useCall();
  const secs = useElapsed(c.startedAt);
  const peers = Object.values(c.peers);
  const live = peers.filter((p) => p.stream);

  // Esc hangs up (or declines) when no sheet is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !useUI.getState().sheets.length) hangUp(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const flip = async () => { if (!(await switchCamera())) toast('No other camera found.'); };
  const ringing = c.phase === 'incoming';
  const ended = c.phase === 'ended';

  if (c.video) {
    const remote = live.filter((p) => hasVideo(p.stream));
    const cap = ringing ? 'Incoming video call' : c.phase === 'connected' ? 'On video call' : ended ? 'Call ended' : 'Outgoing video call';
    return (
      <div className="call-screen video" role="dialog" aria-label="Video call">
        <div className={cx('v-remote', remote.length > 1 && 'grid')}>
          {remote.length
            ? remote.map((p) => <div key={p.id} className="v-tile"><Media stream={p.stream} video />{remote.length > 1 && <small>{p.name}</small>}</div>)
            : <Avatar name={c.title} size={144} />}
          {/* Audio of anyone whose camera is off. */}
          {live.filter((p) => !hasVideo(p.stream)).map((p) => <Media key={p.id} stream={p.stream} />)}
        </div>
        <div className="v-shade" />
        {c.local && !ringing && (
          <div className="v-self">
            {c.cameraOn && c.local.getVideoTracks().length ? <Media stream={c.local} video muted mirror /> : <span className="v-off"><Icon name="videoOff" /></span>}
          </div>
        )}
        <div className="v-head">
          <small>{cap}</small><b>{c.title}</b><small>{status(c, secs)}</small>
          {c.mediaError && <small className="c-warn">{c.mediaError}</small>}
        </div>
        {ringing ? <div className="v-ctrls"><IncomingControls /></div> : (
          <div className="v-ctrls">
            <button className={cx('vbtn', c.muted && 'on')} onClick={toggleMute} title="Mute" aria-label="Mute"><Icon name={c.muted ? 'micOff' : 'mic'} /></button>
            <button className={cx('vbtn', !c.cameraOn && 'on')} onClick={toggleCamera} title="Camera" aria-label="Camera"><Icon name={c.cameraOn ? 'video' : 'videoOff'} /></button>
            <button className="vbtn" onClick={flip} title="Switch camera" aria-label="Switch camera"><Icon name="flipCamera" /></button>
            <button className="vbtn hang" onClick={hangUp} disabled={ended} title="Hang up" aria-label="Hang up"><Icon name="phoneDown" /></button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="call-screen" role="dialog" aria-label="Call">
      <div className="c-bg"><i /><i /></div>
      {live.map((p) => <Media key={p.id} stream={p.stream} />)}
      <div className="c-inner">
        <div className="c-chip">{c.phase === 'connected' ? <i className="live" /> : <Icon name="antenna" />}
          {ringing ? (c.group ? 'Incoming group call' : 'Incoming call') : c.phase === 'connected' ? 'Connected' : ended ? 'Ended' : c.group ? 'Outgoing group call' : 'Outgoing'}
        </div>
        {c.group ? (
          <div className={cx('c-rings big', c.phase === 'connected' && 'still')}><i /><i /><i />
            <div className="c-stack">{peers.slice(0, 3).map((p) => <Avatar key={p.id} name={p.name} size={110} />)}</div>
          </div>
        ) : (
          <div className={cx('c-rings', c.phase === 'connected' && 'still')}><i /><i /><i /><Avatar name={c.title} size={168} /></div>
        )}
        <div className="c-text">
          <div className="c-name">{c.title}</div>
          <div className="c-status mono">{status(c, secs)}</div>
          {c.mediaError && <div className="c-note c-warn"><Icon name="micOff" /> {c.mediaError}</div>}
        </div>
        {c.group && (
          <div className="c-strip">
            {peers.map((p) => (
              <div key={p.id} className={cx('c-mem', p.state === 'ringing' && 'ringing')}>
                <span className="m-av">{initial(p.name) || '#'}</span>
                <small>{p.name.split(' ')[0]}</small><em>{PEER_TEXT[p.state]}</em>
              </div>
            ))}
          </div>
        )}
        <div className="c-bottom">
          {ringing ? <IncomingControls /> : (
            <>
              <div className="c-panel">
                <button className={cx('cbtn', c.muted && 'on')} onClick={toggleMute}><span><Icon name={c.muted ? 'micOff' : 'mic'} /></span><small>{c.muted ? 'Unmute' : 'Mute'}</small></button>
              </div>
              <button className="end-btn" onClick={hangUp} disabled={ended}><Icon name="phoneDown" /> {c.phase === 'connected' ? 'End call' : 'Cancel'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
