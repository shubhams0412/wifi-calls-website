'use client';

/* Coins (balance + history), Add coins sheet, per-minute rates sheet, Usage. */
import { useState } from 'react';
import { RATES, UsageMonth } from '../data';
import { APP_NAME, cx, purchaseDate } from '../format';
import { Icon, IconName } from '../icons';
import { mutate, useData } from '../store';
import { closeSheet, openSheet, toast } from '../ui';
import { Empty, SheetHead, Spinner, TopBar } from '../components/ui';
import { tint } from './parts';

const PACKS = [
  { coins: 100, price: '$4.99', badge: 'Starter' },
  { coins: 500, price: '$9.99', badge: 'Best value', save: 'Save 77%' },
];

function RatesSheet() {
  const [mode, setMode] = useState<'call' | 'sms'>('call');
  const [q, setQ] = useState('');
  const s = q.trim().toLowerCase();
  const items = RATES.filter((r) => !s || r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s));
  return (
    <>
      <SheetHead title="Call & SMS Rates" sub="Coin cost by country for calls & SMS" />
      <div className="sheet-body">
        <div className="seg" style={{ margin: 0 }}>
          <button className={cx(mode === 'call' && 'on')} onClick={() => setMode('call')}>Call</button>
          <button className={cx(mode === 'sms' && 'on')} onClick={() => setMode('sms')}>SMS</button>
        </div>
        <div className="search"><Icon name="search" /><input placeholder="Search by country or code" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {items.length ? (
          <div className="list" style={{ padding: 0 }}>
            {items.map((r) => (
              <div className="row country-row" key={r.code}>
                <span className="flag-c">{r.flag}</span>
                <div className="body"><div className="t">{r.name}</div><div className="s mono">{r.code}</div></div>
                <span className="chip soft"><b className="mono">{mode === 'call' ? r.call : r.sms}</b> <span style={{ opacity: 0.65 }}>{mode === 'call' ? 'coins/min' : 'coins/sms'}</span></span>
              </div>
            ))}
          </div>
        ) : <Empty icon="globe" title="No country found" sub="Try a different name or code." />}
        <p className="tiny faint center" style={{ margin: 0 }}>Costs are shown in coins — per minute for calls, per message for SMS. Actual charges may vary.</p>
      </div>
    </>
  );
}

function AddCoinsSheet() {
  const coins = useData().coins;
  const [sel, setSel] = useState(1);
  const [busy, setBusy] = useState(false);
  const p = PACKS[sel];
  const benefits: [string, string][] = [
    ['Call & text any US number', 'Spend coins on voice calls and SMS to any number in the US.'],
    ['App-to-app calls are free', `Talk to other ${APP_NAME} users anytime — no coins used.`],
    ['Top-up is instant', 'Your balance updates the moment your purchase confirms.'],
    ['No subscription', 'A one-time top-up — add more only when you want to.'],
  ];
  const buy = () => {
    setBusy(true);
    setTimeout(() => {
      mutate((d) => { d.coins = +(d.coins + p.coins).toFixed(2); d.purchases.push({ coins: p.coins, at: Date.now() }); });
      closeSheet();
      toast(`+${p.coins} coins added`);
    }, 900);
  };
  return (
    <>
      <div className="sheet-head">
        <button className="icon-btn plain" onClick={closeSheet} style={{ background: 'var(--field)' }} aria-label="Close"><Icon name="x" /></button>
        <h3>Add coins</h3>
        <span className="chip" style={{ background: 'color-mix(in srgb,var(--warning) 14%,transparent)', color: 'var(--warning)' }}><Icon name="dollar" /> {coins.toFixed(2)}</span>
      </div>
      <div className="sheet-body coins-grid">
        <div className="cg-col">
        <p className="muted" style={{ margin: 0 }}>Top up to keep calling and texting your contacts.</p>
        <div className="balance get">
          <span className="deco" />
          <div className="row-between">
            <span className="tiny" style={{ fontWeight: 700, letterSpacing: '.1em' }}><Icon name="sparkles" /> YOU&apos;LL GET</span>
            {p.save && <span className="chip" style={{ background: 'var(--success)', color: '#fff', fontSize: 11 }}><Icon name="tag" /> {p.save}</span>}
          </div>
          <div className="get-row">
            <div><b>{p.coins}</b> coins<small>added to your balance</small></div><i />
            <div><b>{p.coins}</b> minutes<small>to call any US number</small></div>
          </div>
        </div>
        <div className="card-h"><Icon name="card" /> CHOOSE A PACK</div>
        {PACKS.map((k, i) => (
          <button key={k.coins} className={cx('pack', i === sel && 'on')} onClick={() => setSel(i)}>
            <span className="pk-ic"><Icon name="dollarPlain" /></span>
            <span style={{ flex: 1, textAlign: 'left' }}><b>{k.coins} coins</b> <span className="pk-badge">{k.badge}</span><small>≈ {k.coins} min US calls</small></span>
            <span style={{ textAlign: 'right' }}>
              <span className="muted" style={{ fontWeight: 600, fontSize: 13, display: 'block' }}>{k.price}</span>
              {k.save && <span className="chip success" style={{ fontSize: 10, padding: '2px 8px' }}>{k.save}</span>}
            </span>
          </button>
        ))}
        </div>
        <div className="cg-col">
        <div className="card pad" style={{ boxShadow: 'none', border: '1px solid var(--hairline)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>What&apos;s included</div>
          {benefits.map(([t, s]) => (
            <div className="feat" style={{ alignItems: 'flex-start' }} key={t}>
              <i style={{ width: 22, height: 22, fontSize: 11 }}><Icon name="check" /></i>
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div><div className="tiny muted" style={{ fontSize: 13 }}>{s}</div></div>
            </div>
          ))}
          <button className="chip soft" style={{ marginTop: 8 }} onClick={() => openSheet(<RatesSheet />)}><Icon name="infoCircle" /> See per-minute charges</button>
        </div>
        <button className="btn btn-primary block" disabled={busy} onClick={buy}>
          {busy ? <><Spinner white /> Processing…</> : <>Buy {p.coins} coins <Icon name="arrowR" /></>}
        </button>
        <div className="foot-chips">
          <a className="chip" href="/terms" target="_blank" rel="noopener">Terms</a>
          <a className="chip" href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>
        </div>
        </div>
      </div>
    </>
  );
}

export function CoinsView() {
  const d = useData();
  const hist = [...d.purchases].sort((a, b) => b.at - a.at);
  return (
    <>
      <TopBar title="Coins" rootBack back="settings" />
      <div className="scroll">
        <div className="content narrow">
          <div className="balance">
            <span className="deco" />
            <div className="tiny" style={{ letterSpacing: '.12em', fontWeight: 700, opacity: 0.9 }}><i className="dot" /> AVAILABLE BALANCE</div>
            <div className="row-lite" style={{ alignItems: 'flex-end' }}>
              <span className="bal">{d.coins.toFixed(2)}</span>
              <span style={{ fontWeight: 600, fontSize: 18, opacity: 0.85, paddingBottom: 10 }}>coins</span>
              <span style={{ marginLeft: 'auto', fontSize: 44, opacity: 0.55 }}><Icon name="dollar" /></span>
            </div>
            <button className="btn" style={{ background: '#fff', color: '#5B2C9F', height: 48 }} onClick={() => openSheet(<AddCoinsSheet />, { wide: true })}><Icon name="plus" /> Add coins</button>
          </div>
          <div className="card-h" style={{ padding: '0 4px' }}><Icon name="history" /> PURCHASE HISTORY {hist.length > 0 && <span className="chip soft" style={{ padding: '2px 8px' }}>{hist.length}</span>}</div>
          <div className="list" style={{ padding: 0 }}>
            {hist.length ? hist.map((p, i) => (
              <div className="row" style={{ boxShadow: 'none', border: '1px solid var(--hairline)' }} key={i}>
                <span className="circle-ic" style={tint('success')}><Icon name="plus" /></span>
                <div className="body"><div className="t" style={{ fontSize: 15 }}>+{p.coins} coins</div><div className="s">{purchaseDate(p.at)}</div></div>
                <span style={{ color: 'var(--success)' }}><Icon name="seal" /></span>
              </div>
            )) : <Empty icon="sparkles" title="No purchases yet" sub="Tap “Add coins” above to top up your balance." />}
          </div>
        </div>
      </div>
    </>
  );
}

export function UsageView() {
  const d = useData();
  const block = (title: string, m: UsageMonth) => {
    const row = (icon: IconName, color: string, label: string, v: string) => (
      <div className="item" key={label}>
        <span className="tile-ic" style={{ ...tint(color), width: 38, height: 38 }}><Icon name={icon} /></span>
        <span className="lbl">{label}</span>
        <span style={{ fontSize: 22, fontWeight: 800 }}>{parseInt(v, 10) || 0}</span>
      </div>
    );
    return (
      <>
        <div className="group-title">{title}</div>
        <div className="group">
          {row('phoneIn', 'primary', 'Incoming calls', m.incoming_call)}
          {row('phoneOut', 'primary', 'Outgoing calls', m.outgoing_call)}
          {row('mail', 'accent', 'Received', m.sms_received)}
          {row('send', 'accent', 'Sent', m.sms_sent)}
        </div>
      </>
    );
  };
  return (
    <>
      <TopBar title="Usage" rootBack back="settings" />
      <div className="scroll"><div className="content narrow">{block('This month', d.usage.thisMonth)}{block('Last month', d.usage.previousMonth)}</div></div>
    </>
  );
}
