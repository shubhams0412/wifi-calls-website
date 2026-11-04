'use client';

/* Buy Number (BuyNumberView): pick a US/Canada number. Rendered by Overlays when ui.buyNumberOpen. */
import { useEffect, useState } from 'react';
import { fmtPhone } from '../format';
import { Icon } from '../icons';
import { country, getData } from '../store';
import { alertDialog, closeBuyNumber, openPaywall } from '../ui';
import { wc } from '../api';
import { loadProfile } from '../sync';
import { Empty, Seg, Spinner } from '../components/ui';

export function BuyNumberSheet() {
  const [cc, setCc] = useState<'US' | 'CA'>('US');
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [nums, setNums] = useState<{ phoneNumber: string; friendlyName: string }[] | null>(null);
  const [error, setError] = useState('');
  const c = country(cc);

  useEffect(() => {
    let live = true;
    setNums(null); setError('');
    wc<{ phoneNumber: string; friendlyName: string }[]>('fetchNumbers', { country_code: cc }).then((r) => {
      if (!live) return;
      if (r.ok && Array.isArray(r.data)) setNums(r.data);
      else { setNums([]); setError(r.message || ''); }
    });
    return () => { live = false; };
  }, [cc]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(closeBuyNumber, 1500);
    return () => clearTimeout(t);
  }, [done]);

  const buy = async (n: string, friendly: string) => {
    if (busy) return;
    if (getData().tier === 'none') { closeBuyNumber(); openPaywall(); return; }
    setBusy(n);
    const r = await wc('purchaseNumber', { phone_number: n, friendly_name: friendly });
    setBusy(null);
    if (!r.ok) return alertDialog('Couldn’t get this number', r.code === 403 ? 'Your plan doesn’t include a number. Subscribe in the iPhone app.' : r.message || 'Please pick another number.');
    await loadProfile();
    setDone(n);
  };

  if (done) {
    return (
      <div className="sheet-body center" style={{ alignItems: 'center', padding: '40px 24px', gap: 14 }}>
        <span className="grad-circle" style={{ width: 84, height: 84, fontSize: 36 }}><Icon name="check" /></span>
        <h3 style={{ margin: 0, fontSize: 20 }}>Number added!</h3>
        <span className="chip soft mono" style={{ fontSize: 16 }}>{fmtPhone(done)}</span>
      </div>
    );
  }

  return (
    <>
      <div className="sheet-head">
        <button className="icon-btn plain" onClick={closeBuyNumber} aria-label="Close" style={{ background: 'var(--field)' }}><Icon name="x" /></button>
        <h3 style={{ textAlign: 'center' }}>Get your number</h3>
        <span style={{ width: 38 }} />
      </div>
      <div className="sheet-body">
        <div className="card pad row-lite">
          <span className="circle-ic" style={{ width: 56, height: 56, fontSize: 22, background: 'var(--accent-soft)' }}><Icon name="phonePlus" /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17 }}>Get your private line</div>
            <div className="tiny muted" style={{ fontSize: 13 }}>Make calls, send SMS, keep your real number private.</div>
          </div>
        </div>
        <Seg style={{ margin: 0 }} items={[{ value: 'US', label: '🇺🇸  USA' }, { value: 'CA', label: '🇨🇦  CANADA' }]} value={cc} onChange={(v) => setCc(v as 'US' | 'CA')} />
        <div className="row-between">
          <span className="group-title" style={{ margin: 0, padding: 0 }}>Available numbers</span>
          <span className="chip soft">{nums?.length ?? 0}</span>
        </div>
        {nums === null ? <div className="center" style={{ padding: 24 }}><Spinner /></div> : nums.length ? (
          <div className="list" style={{ padding: 0 }}>
            {nums.map(({ phoneNumber: n, friendlyName }) => (
              <button key={n} className="row num-row" onClick={() => buy(n, friendlyName)} disabled={!!busy && busy !== n}>
                <span className="flag-c">{c.flag}</span>
                <div className="body">
                  <div className="mono" style={{ fontSize: 17, fontWeight: 600 }}>{fmtPhone(n)}</div>
                  <div className="s">
                    <span className="pill-tag"><Icon name="check" /> Voice</span> <span className="pill-tag"><Icon name="check" /> SMS</span>{' '}
                    <span className="faint tiny">{friendlyName}</span>
                  </div>
                </div>
                <span className="grad-circle" style={{ width: 36, height: 36, fontSize: 15 }}>{busy === n ? <Spinner white /> : <Icon name="arrowR" />}</span>
              </button>
            ))}
          </div>
        ) : <Empty icon="phonePlus" title="No numbers available" sub={error || 'Try a different country, or check back in a few minutes.'} />}
      </div>
    </>
  );
}
