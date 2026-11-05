'use client';

/* In-call screen for paid phone calls (CallingView), driven by phone.ts (Twilio). App-to-app calls use AppCallScreen. */
import { useEffect, useState } from 'react';
import { cx, fmtPhone, mmss } from '../format';
import { Icon } from '../icons';
import { getData, isPro } from '../store';
import { hangUpPhone, sendPhoneDigits, setPhoneMuted, usePhoneCall, type PhonePhase } from '../phone';
import { useUI } from '../ui';
import { Avatar } from '../components/ui';

const CHIP: Record<PhonePhase, string> = { idle: '', connecting: 'Outgoing', ringing: 'Ringing', connected: 'Connected', ended: 'Call ended' };

/* DTMF keypad: each key is sent to the call as a tone. */
function KeypadSheet({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState('');
  const keys: [string, string][] = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
  const press = (k: string) => { setTyped((s) => s + k); sendPhoneDigits(k); };
  return (
    <>
      <div className="sheet-head">
        <div className="mono" style={{ flex: 1, fontSize: 26, fontWeight: 600, minHeight: 34 }}>{typed}</div>
        <button className="link-btn" style={{ fontSize: 16 }} onClick={onClose}>Done</button>
      </div>
      <div className="sheet-body">
        <div className="keypad small">
          {keys.map(([k, l]) => (
            <button key={k} className="key" onClick={() => press(k)}><b>{k}</b><small>{l || ' '}</small></button>
          ))}
        </div>
      </div>
    </>
  );
}

function Ctrl({ icon, label, on, onClick }: { icon: Parameters<typeof Icon>[0]['name']; label: string; on?: boolean; onClick: () => void }) {
  return <button className={cx('cbtn', on && 'on')} onClick={onClick}><span><Icon name={icon} /></span><small>{label}</small></button>;
}

export default function CallScreen() {
  const c = usePhoneCall();
  const [keypad, setKeypad] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!c.startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [c.startedAt]);

  // Esc closes the keypad, otherwise hangs up (when no sheet is open). Keys 0-9 * # send tones while connected.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (useUI.getState().sheets.length) return;
        if (document.querySelector('.call-keypad')) { setKeypad(false); return; }
        hangUpPhone();
      } else if (/^[0-9*#]$/.test(e.key) && usePhoneCall.getState().phase === 'connected' && !document.querySelector('.call-keypad')) {
        sendPhoneDigits(e.key);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const d = getData();
  const title = c.name || fmtPhone(c.number) || 'Unknown';
  const secs = c.startedAt ? Math.max(0, Math.floor((now - c.startedAt) / 1000)) : 0;
  const status = { idle: '', connecting: 'Calling…', ringing: 'Ringing…', connected: mmss(secs), ended: c.endReason || 'Call ended' }[c.phase];
  const recording = d.settings.recording && isPro(d) && c.phase === 'connected';

  return (
    <div className="call-screen" role="dialog" aria-label="Call">
      <div className="c-bg"><i /><i /></div>
      <div className="c-inner">
        <div className="c-chip">{c.phase === 'connected' ? <i className="live" /> : <Icon name="antenna" />}{CHIP[c.phase]}</div>
        <div className={cx('c-rings', c.phase === 'connected' && 'still')}><i /><i /><i />
          <Avatar name={title} size={168} />
          {recording && <span className="rec-dot" title="Recording" />}
        </div>
        <div className="c-text">
          <div className="c-name">{title}</div>
          {c.name && c.number && <div className="c-num mono">{fmtPhone(c.number)}</div>}
          <div className="c-status mono">{status}</div>
          {d.settings.anon && isPro(d) && <div className="c-note"><Icon name="userQ" /> Anonymous caller ID</div>}
        </div>
        <div className="c-bottom">
          <div className="c-panel">
            <Ctrl icon={c.muted ? 'micOff' : 'mic'} label={c.muted ? 'Unmute' : 'Mute'} on={c.muted} onClick={() => setPhoneMuted(!c.muted)} />
            <Ctrl icon="keypad" label="Keypad" onClick={() => setKeypad(true)} />
          </div>
          <button className="end-btn" onClick={hangUpPhone} disabled={c.phase === 'ended'}><Icon name="phoneDown" /> {c.phase === 'connected' ? 'End call' : 'Cancel'}</button>
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
