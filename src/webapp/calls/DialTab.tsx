'use client';

/* Dial tab: phone keypad (Phone Calls) + app-user list (App Calls) side by side on desktop. */
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Contact } from '../data';
import { APP_NAME, cx, digits, fmtPhone, fmtTyping } from '../format';
import { Icon } from '../icons';
import { openChatWith } from '../chat';
import { country, friends, useData } from '../store';
import { openBuyNumber, placePhoneCall, startCall, toast, useDialog, useUI } from '../ui';
import { Avatar, Empty } from '../components/ui';
import { FullPane } from '../components/Shell';
import { openContactPicker, openCountryPicker } from '../components/pickers';

const KEYS: [string, string][] = [['1', '---'], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ' '], ['0', '+'], ['#', ' ']];
const tint = (c: string) => ({ ['--c' as string]: c });

/** Long-press helper: returns pointer handlers + a flag telling the click to skip. */
function useHold(onHold: () => void) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const cancel = () => { if (t.current) clearTimeout(t.current); };
  return {
    held,
    handlers: {
      onPointerDown: () => { held.current = false; cancel(); t.current = setTimeout(() => { held.current = true; onHold(); }, 400); },
      onPointerUp: cancel,
      onPointerLeave: cancel,
    },
  };
}

function FriendRow({ f }: { f: Contact }) {
  const hasName = /[A-Za-z]/.test(f.name);
  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
  return (
    <Link className="row" href={'/app/contacts/friends/' + f.id}>
      <Avatar name={f.name} size={44} />
      <div className="body">
        <div className="t" style={{ fontSize: 15 }}>{f.name}</div>
        {hasName && <div className="s">{fmtPhone(f.phone)}</div>}
      </div>
      <span className="row-acts">
        <button className="circle-ic s32" style={tint('var(--success)')} title="Free call" aria-label="Free call"
          onClick={(e) => { stop(e); startCall({ kind: 'app', name: f.name, phone: f.phone }); }}><Icon name="phone" /></button>
        <button className="circle-ic s32" style={tint('var(--accent)')} title="Video call" aria-label="Video call"
          onClick={(e) => { stop(e); startCall({ kind: 'video', name: f.name, phone: f.phone }); }}><Icon name="video" /></button>
        <button className="circle-ic s32" style={tint('var(--primary)')} title="Chat" aria-label="Chat"
          onClick={(e) => { stop(e); openChatWith(f); }}><Icon name="message" /></button>
      </span>
    </Link>
  );
}

export default function DialTab() {
  const d = useData();
  const [num, setNum] = useState('');
  const [cc, setCc] = useState('US');
  const [seg, setSeg] = useState<'phone' | 'app'>('phone');
  const [q, setQ] = useState('');
  const c = country(cc);

  const call = useCallback(() => {
    const clean = num.replace(/[^\d+*#]/g, '');
    if (digits(clean).length < 7) { toast('Enter a valid phone number to call.'); return; }
    placePhoneCall(clean[0] === '+' ? clean : c.dial + clean);
  }, [num, c.dial]);

  const zero = useHold(() => setNum((n) => n + '+'));
  const del = useHold(() => setNum(''));

  // Keyboard typing / paste while the Dial tab is showing and nothing is on top.
  useEffect(() => {
    const blocked = (e: Event) => {
      const tag = ((e.target as HTMLElement)?.tagName || '').toLowerCase();
      const ui = useUI.getState();
      return tag === 'input' || tag === 'textarea' || ui.sheets.length > 0 || !!ui.call || ui.paywallOpen || ui.buyNumberOpen || !!useDialog.getState().dialog;
    };
    const onKey = (e: KeyboardEvent) => {
      if (blocked(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9*#+]$/.test(e.key)) { setNum((n) => (n.length < 16 ? n + e.key : n)); e.preventDefault(); }
      else if (e.key === 'Backspace') { setNum((n) => n.slice(0, -1)); e.preventDefault(); }
      else if (e.key === 'Enter') { call(); }
    };
    const onPaste = (e: ClipboardEvent) => {
      if (blocked(e)) return;
      const t = e.clipboardData?.getData('text');
      if (t) setNum(t.replace(/[^\d+]/g, '').slice(0, 16));
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('paste', onPaste);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('paste', onPaste); };
  }, [call]);

  const press = (k: string) => {
    if (k === '0' && zero.held.current) { zero.held.current = false; return; }
    setNum((n) => (n.length < 16 ? n + k : n));
  };

  const all = friends(d);
  const s = q.trim().toLowerCase();
  const shown = all.filter((f) => !s || f.name.toLowerCase().includes(s) || (!!digits(s) && digits(f.phone).includes(digits(s))));

  return (
    <FullPane>
      <div className="dial-page" data-seg={seg}>
        <div className="phead" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <h1>Dial</h1>
          {d.number
            ? <span className="chip success"><Icon name="seal" /> {fmtPhone(d.number)}</span>
            : <button className="chip soft" style={{ fontSize: 13, padding: '8px 14px' }} onClick={openBuyNumber}><Icon name="phonePlus" /> Get a phone number <Icon name="arrowR" /></button>}
        </div>
        <div className="seg dial-seg" style={{ margin: '0 0 14px' }}>
          <button className={cx(seg === 'phone' && 'on')} onClick={() => setSeg('phone')}>Phone Calls</button>
          <button className={cx(seg === 'app' && 'on')} onClick={() => setSeg('app')}>App Calls</button>
        </div>
        <div className="dial-grid">
          <div className="dial-phone">
            <div className="dial-card card">
              <div className="dial-num">
                <button className="country-pill" onClick={() => openCountryPicker(cc, (x) => setCc(x.code))}>{c.flag} <b>{c.dial}</b> <Icon name="chevD" /></button>
                <div className="num mono" aria-live="polite" style={{ fontSize: num.length > 13 ? 20 : num.length > 9 ? 24 : 30 }}>{num ? fmtTyping(num) : <span className="ph">Enter Number</span>}</div>
              </div>
              <div className="center tiny muted" style={{ fontSize: 13, fontWeight: 500 }}>
                <span style={{ color: 'var(--success)' }}><Icon name="connection" /></span> Internet Call
              </div>
              <div className="keypad">
                {KEYS.map(([k, l]) => (
                  <button key={k} className="key" onClick={() => press(k)} {...(k === '0' ? zero.handlers : {})} aria-label={k}>
                    <b>{k}</b><small>{l}</small>
                  </button>
                ))}
              </div>
              <div className="dial-actions">
                <button className="icon-btn lg" title="Phonebook" aria-label="Phonebook"
                  onClick={() => openContactPicker({ title: 'Pick contact' }, ([ct]) => { if (ct) setNum(digits(ct.phone).replace(/^1(?=\d{10}$)/, '')); })}>
                  <Icon name="book" />
                </button>
                <button className="call-btn" disabled={!num} onClick={call} aria-label="Call"><Icon name="phone" /></button>
                <button className="icon-btn lg plain" title="Delete (hold to clear)" aria-label="Delete" {...del.handlers}
                  onClick={() => { if (del.held.current) { del.held.current = false; return; } setNum((n) => n.slice(0, -1)); }}>
                  <Icon name="deleteLeft" />
                </button>
              </div>
              <p className="tiny faint center dial-tip" style={{ margin: '6px 0 0' }}>Tip: you can type or paste a number with your keyboard.</p>
            </div>
          </div>
          <div className="dial-app">
            <div className="app-calls">
              <div className="sec-h"><h2>App Calls</h2><span className="tiny muted">Free over the internet</span></div>
              <div className="search" style={{ margin: '0 0 12px' }}>
                <Icon name="search" />
                <input placeholder={`Search ${APP_NAME} users`} value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              {!all.length ? (
                <Empty icon="users" title={`No ${APP_NAME} users yet`} sub={`Invite friends — when they install ${APP_NAME}, you'll be able to call them free over the internet.`} />
              ) : !shown.length ? (
                <Empty icon="users" title="No matches" />
              ) : (
                <div className="list" style={{ padding: 0 }}>{shown.map((f) => <FriendRow key={f.id} f={f} />)}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FullPane>
  );
}
