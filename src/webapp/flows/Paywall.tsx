'use client';

/* PaywallDetailed — the offer screen (Pro/Lite plans). Split into pieces so the first-launch flow can
   place the plan picker in its form column and the feature list in its brand panel, while the
   mid-session cover (PaywallModal) keeps the classic two-column layout. */
import { useState } from 'react';
import { Icon } from '../icons';
import { APP_NAME, cx } from '../format';
import { getData, useData } from '../store';
import { loadCredit } from '../sync';
import { alertDialog, closePaywall, toast } from '../ui';

/** Subscriptions are sold by Apple only (the backend checks App Store receipts). */
export const APP_STORE_URL = 'https://apps.apple.com/app/id6781677176';
import { TopBar } from '../components/ui';

export type TierView = 'pro' | 'lite';
interface Plan { id: string; label: string; price: string; desc: string; badge?: [string, string] }

const PLANS: Record<TierView, Plan[]> = {
  pro: [
    { id: 'weekly', label: 'Pro - Weekly', price: '$6.99/week', desc: 'Billed weekly · cancel anytime', badge: ['MOST POPULAR', '#5B2C9F'] },
    { id: 'monthly', label: 'Pro - Monthly', price: '$19.99/month', desc: 'Billed monthly · cancel anytime', badge: ['SAVE', '#16A34A'] },
    { id: 'yearly', label: 'Pro - Yearly', price: '$89.99/year', desc: 'Billed yearly · cancel anytime', badge: ['BEST VALUE', '#F59E0B'] },
  ],
  lite: [
    { id: 'weekly', label: 'Lite - Weekly', price: '$3.99/week', desc: 'Billed weekly · cancel anytime' },
    { id: 'monthly', label: 'Lite - Monthly', price: '$9.99/month', desc: 'Billed monthly · cancel anytime' },
    { id: 'yearly', label: 'Lite - Yearly', price: '$49.99/year', desc: 'Billed yearly · cancel anytime', badge: ['BEST VALUE', '#F59E0B'] },
  ],
};
export const FEATURES: [string, boolean][] = [
  ['Chat and video calls', true], ['App-to-SMS messaging', true], ['Unlimited app-to-app calls', true], ['Broadcast messages', false],
  ['Call recording', false], ['Voicemail with custom greeting', false], ['Call forwarding', false], ['Group calls', false], ['Anonymous caller ID', false],
];

/** Renders both tier variants in the same grid cell and shows one, so switching Pro ↔ Lite
    never changes the block's height (no layout jump). */
export function Swap({ pro, children: [proNode, liteNode] }: { pro: boolean; children: [React.ReactNode, React.ReactNode] }) {
  return (
    <span className="swap">
      <span className={cx(pro && 'on')} aria-hidden={!pro}>{proNode}</span>
      <span className={cx(!pro && 'on')} aria-hidden={pro}>{liteNode}</span>
    </span>
  );
}

/** Shared selection state. "Buying" opens the App Store (subscriptions are Apple-only), then
    `onBought` runs so the flow can continue; the plan shows on the web once the backend has it. */
export function useOffer(onBought: (tier: TierView) => void) {
  const d = useData();
  const [tier, setTier] = useState<TierView>('pro');
  const [plan, setPlan] = useState('weekly');
  const purchase = () => {
    window.open(APP_STORE_URL, '_blank', 'noopener');
    onBought(tier);
  };
  return { tier, setTier: (t: TierView) => { setTier(t); setPlan('weekly'); }, plan, setPlan, purchase, owned: d.tier === tier, current: d.tier };
}
type Offer = ReturnType<typeof useOffer>;

export function TierToggle({ o }: { o: Offer }) {
  const cur = (t: TierView) => (o.current === t ? ' • Current' : '');
  return (
    <div className="tier-toggle" data-tier={o.tier}>
      <span className="thumb" />
      <button data-t="pro" onClick={() => o.setTier('pro')}><Icon name="antenna" /> Pro{cur('pro')}</button>
      <button data-t="lite" onClick={() => o.setTier('lite')}><Icon name="radioDot" /> Lite{cur('lite')}</button>
    </div>
  );
}

export function PlanList({ o }: { o: Offer }) {
  return (
    <div className="plans">
      {PLANS[o.tier].map((p) => {
        const on = o.plan === p.id;
        return (
          <button key={p.id} className={cx('plan', on && 'on')} onClick={() => o.setPlan(p.id)}>
            {p.badge && <span className="plan-badge" style={{ background: p.badge[1] }}>{p.badge[0]}</span>}
            <span className="radio">{on && <Icon name="check" />}</span>
            <span style={{ flex: 1, textAlign: 'left' }}><span className="pl">{p.label}</span><span className="pd">{p.desc}</span></span>
            <span className="pp">{p.price}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FeatureList({ pro, className }: { pro: boolean; className?: string }) {
  return (
    <div className={className}>
      {FEATURES.map(([label, lite]) => {
        const ok = pro || lite;
        return <div key={label} className={cx('feat', !ok && 'off')}><i><Icon name={ok ? 'check' : 'x'} /></i><span>{label}</span></div>;
      })}
    </div>
  );
}

/** Re-reads the plan from the backend (e.g. after subscribing on the iPhone). */
async function restore() {
  if (!getData().user.id) return alertDialog('Sign in first', 'Sign in with the phone number you used in the iPhone app, and your plan comes with you.');
  const r = await loadCredit();
  if (!r.ok) return alertDialog('Couldn’t check your plan', r.message || 'Please try again.');
  const tier = r.data && (r.data as { entitlements?: { pro?: boolean; lite?: boolean } }).entitlements;
  if (tier?.pro || tier?.lite) toast(`Your ${tier.pro ? 'Pro' : 'Lite'} plan is active.`);
  else alertDialog('No subscription found', 'Subscribe in the iPhone app with this phone number, then tap Restore again.');
}

export function BuyArea({ o }: { o: Offer }) {
  const pro = o.tier === 'pro';
  // Both states are always rendered in one grid cell (only the right one is visible/interactive),
  // so switching tiers never changes this block's height.
  return (
    <>
      <div className="buy-swap">
        <div className={cx('bs', o.owned && 'on')} aria-hidden={!o.owned} inert={!o.owned}>
          <div className="card pad row-lite" style={{ boxShadow: 'none', border: '1px solid var(--hairline)' }}>
            <span style={{ color: 'var(--success)', fontSize: 26 }}><Icon name="seal" /></span>
            <div>
              <div style={{ fontWeight: 700 }}>You&apos;re all set</div>
              <div className="tiny muted"><Swap pro={pro}>{['Subscribed to Pro - every feature unlocked.', 'Subscribed to Lite - upgrade to Pro for the full lineup.']}</Swap></div>
            </div>
          </div>
          <button className="btn block" disabled style={{ background: 'var(--field)', color: 'var(--text-3)' }}>You&apos;re on <Swap pro={pro}>{['Pro', 'Lite']}</Swap></button>
        </div>
        <div className={cx('bs', !o.owned && 'on')} aria-hidden={o.owned} inert={o.owned}>
          <button className="btn btn-primary block pulse fx-cta" onClick={o.purchase}>
            <span>Get <Swap pro={pro}>{['Pro', 'Lite']}</Swap> in the iPhone app</span><Icon name="arrowUpRight" />
          </button>
          <p className="tiny faint center" style={{ margin: 0 }}>
            Subscriptions are handled by Apple. Subscribe in the iPhone app, then use the same phone number here - your plan works on the web too.
          </p>
        </div>
      </div>
      <div className="foot-chips">
        <a className="chip" href="/terms" target="_blank" rel="noopener">Terms</a>
        <a className="chip" href="/privacy" target="_blank" rel="noopener">Privacy</a>
        <button className="chip" onClick={restore}>Restore</button>
      </div>
    </>
  );
}

/** Settings → Subscription: the same offer, shown inside the settings detail panel. */
export function SubscriptionView() {
  const o = useOffer(() => toast('Subscribe in the iPhone app, then tap Restore here.'));
  const pro = o.tier === 'pro';
  return (
    <>
      <TopBar title="Subscription" rootBack back="settings" />
      <div className="scroll">
        <div className="content sub-view">
          <div className="sub-head">
            <span className="chip soft" style={{ letterSpacing: '.06em' }}><Icon name="sparkles" /> {APP_NAME} <Swap pro={pro}>{['Pro', 'Lite']}</Swap></span>
            <h2><Swap pro={pro}>{['Unlock everything with Pro', 'Start with the essentials']}</Swap></h2>
            <p className="muted"><Swap pro={pro}>{['Every feature, unlimited — calls, broadcasts, voicemail, recording and more.', 'The essentials to stay connected. Upgrade to Pro anytime.']}</Swap></p>
          </div>
          <div className="sub-grid">
            <div className="sub-col">
              <TierToggle o={o} />
              <PlanList o={o} />
              <div className="buy-panel"><BuyArea o={o} /></div>
            </div>
            <div className="sub-col">
              <div className="card pad">
                <div className="feat-h"><Icon name="checklist" /> What&apos;s included</div>
                <FeatureList pro={pro} />
              </div>
              <div className="trust3">
                <div className="card"><Icon name="shieldCheck" /><span>Apple-secure</span></div>
                <div className="card"><Icon name="xCircle" /><span>Cancel anytime</span></div>
                <div className="card"><Icon name="heartBolt" /><span>1M+ users</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Mid-session paywall: opens straight on the offer screen, with a close X. */
export function PaywallModal() {
  const o = useOffer(() => { closePaywall(); toast('Subscribe in the iPhone app, then tap Restore in Settings → Subscription.'); });
  const pro = o.tier === 'pro';
  return (
    <div className="paywall-modal">
      <div className="flow pay detailed modal">
        <div className="orbs"><i /><i /></div>
        <div className="flow-card wide offer">
          <div className="offer-close">
            <button className="circle-btn" onClick={closePaywall} aria-label="Close"><Icon name="x" /></button>
          </div>
          <div className="offer-l">
            <span className="chip soft" style={{ alignSelf: 'center', letterSpacing: '.06em' }}><Icon name="sparkles" /> {APP_NAME} <Swap pro={pro}>{['Pro', 'Lite']}</Swap></span>
            <div className="pulse-hero sm"><i /><i /><div className="core"><Icon name={pro ? 'antenna' : 'radioDot'} /></div></div>
            <h1 className="center" style={{ fontSize: 26, margin: 0, fontWeight: 700 }}>
              <Swap pro={pro}>{['Unlock WiFi Calling & Texting Pro', 'Start with WiFi Calling & Texting Lite']}</Swap>
            </h1>
            <p className="sub center">
              <Swap pro={pro}>{['Every feature, unlimited - calls, broadcasts, voicemail, recording and more.', 'The essentials to stay connected. Upgrade to Pro anytime.']}</Swap>
            </p>
            <TierToggle o={o} />
            <PlanList o={o} />
          </div>
          <div className="offer-r">
            <div className="card pad">
              <div className="feat-h"><Icon name="checklist" /> What&apos;s included</div>
              <FeatureList pro={pro} />
            </div>
            <div className="trust3">
              <div className="card"><Icon name="shieldCheck" /><span>Apple-secure</span></div>
              <div className="card"><Icon name="xCircle" /><span>Cancel anytime</span></div>
              <div className="card"><Icon name="heartBolt" /><span>1M+ users</span></div>
            </div>
            <div className="buy-panel"><BuyArea o={o} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
