'use client';

/* Everything that floats above the app: toasts, the sheet stack, confirm/prompt dialogs,
   the in-call screen, the mid-session paywall and the Buy Number cover. */
import { useEffect, useRef, useState } from 'react';
import CallScreen from '../calls/CallScreen';
import AppCallScreen from '../calls/AppCallScreen';
import { useCall } from '../rtc';
import { usePhoneCall } from '../phone';
import { PaywallModal } from '../flows/Paywall';
import { BuyNumberSheet } from '../messages/BuyNumber';
import { cx } from '../format';
import { closeBuyNumber, closeSheet, useDialog, useUI } from '../ui';

function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => <div className="toast" key={t.id}>{t.text}</div>)}
    </div>
  );
}

function Sheets() {
  const sheets = useUI((s) => s.sheets);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && useUI.getState().sheets.length && !useDialog.getState().dialog) closeSheet(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <>
      {sheets.map((s) => (
        <div className="overlay" key={s.id} onMouseDown={(e) => { if (e.target === e.currentTarget && s.dismissible !== false) closeSheet(); }}>
          <div className={cx('sheet', s.wide && 'wide')} role="dialog" aria-modal="true">{s.node}</div>
        </div>
      ))}
    </>
  );
}

function Dialog() {
  const dialog = useDialog((s) => s.dialog);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (dialog?.kind === 'prompt') { setValue(dialog.value ?? ''); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [dialog]);
  if (!dialog) return null;
  const done = (ok: boolean) => {
    useDialog.setState({ dialog: null });
    if (dialog.kind === 'confirm') dialog.resolve(ok);
    else dialog.resolve(ok ? value.trim() : null);
  };
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) done(false); }}
      onKeyDown={(e) => { if (e.key === 'Escape') done(false); }}>
      <div className="sheet dialog-wrap dialog-sheet" role="alertdialog" aria-modal="true">
        <div className="dialog" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>{dialog.title}</h3>
          {dialog.kind === 'confirm'
            ? (dialog.message ? <p>{dialog.message}</p> : <div style={{ height: 14 }} />)
            : <input ref={inputRef} className="input" style={{ margin: '14px 0' }} placeholder={dialog.placeholder} value={value}
                onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') done(true); }} />}
          <div className="acts">
            <button className="btn btn-outline" onClick={() => done(false)} autoFocus={dialog.kind === 'confirm'}>
              {dialog.kind === 'confirm' ? dialog.cancel ?? 'Cancel' : 'Cancel'}
            </button>
            <button className={cx('btn', dialog.kind === 'confirm' && dialog.danger ? 'btn-danger' : 'btn-primary')} onClick={() => done(true)}>
              {dialog.ok ?? (dialog.kind === 'confirm' ? 'OK' : 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyNumberCover() {
  const open = useUI((s) => s.buyNumberOpen);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeBuyNumber(); }}>
      <div className="sheet wide" role="dialog" aria-modal="true"><BuyNumberSheet /></div>
    </div>
  );
}

export default function Overlays() {
  const call = usePhoneCall((s) => s.phase !== 'idle');
  const appCall = useCall((s) => s.phase !== 'idle');
  const paywall = useUI((s) => s.paywallOpen);
  return (
    <>
      {paywall && <PaywallModal />}
      <BuyNumberCover />
      <Sheets />
      {call && <CallScreen />}
      {appCall && <AppCallScreen />}
      <Dialog />
      <Toasts />
    </>
  );
}
