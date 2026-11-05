import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand, Faqs, PageHero, SectionHead, StoreButton } from '@/components/site/blocks';
import { Icon } from '@/components/icons';
import { webApp } from '@/site/config';

export const metadata: Metadata = {
  title: 'Plans',
  description: 'Compare Wi-Fi Calling & Texting Lite and Pro. Both include a second number and free app-to-app calls; Pro adds recording, voicemail, forwarding and more.',
  alternates: { canonical: '/plans' },
};

/** Same list as the in-app paywall ("What's included"): [feature, included in Lite]. */
const APP_FEATURES: [string, boolean][] = [
  ['Chat and video calls', true], ['App-to-SMS messaging', true], ['Unlimited app-to-app calls', true], ['Broadcast messages', false],
  ['Call recording', false], ['Voicemail with custom greeting', false], ['Call forwarding', false], ['Group calls', false], ['Anonymous caller ID', false],
];

const PLAN_FAQ = [
  { q: 'How much does it cost?', a: 'Prices are shown in the app before you subscribe, in your local currency. Both plans are available weekly, monthly or yearly and start with a free trial.' },
  { q: 'Is there a free trial?', a: 'Yes. New subscribers get a free trial. You can cancel anytime before it ends in Settings → Apple ID → Subscriptions and you won’t be charged.' },
  { q: 'What are coins?', a: 'Coins pay for calls and texts to regular phone numbers. App-to-app calls and chats are free and never use coins. You can top up anytime in Settings → Purchase Coins.' },
  { q: 'Can I switch plans later?', a: 'Yes — open Settings → Subscription in the app to switch between Lite and Pro, or manage it from Apple’s Subscriptions settings.' },
];

export default function PlansPage() {
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'Plans' }]} eyebrow="Plans" icon="crown"
        title="Simple plans, free trial included"
        intro="Start with Lite for the essentials or go Pro for every feature. Prices are shown in the app before you subscribe.">
        <StoreButton light />
        <Link className="btn btn-ghost-light" href={webApp()}>Start on the web</Link>
      </PageHero>
      <section className="band"><div className="wrap">
        <div className="x-plans">
          <div className="x-plan">
            <span className="label">Lite</span>
            <h2>The essentials</h2>
            <p>A second number with calling, texting and free app-to-app chat.</p>
            <ul>{APP_FEATURES.map(([f, lite]) => <li key={f} className={lite ? '' : 'off'}><Icon name={lite ? 'check' : 'x'} />{f}</li>)}</ul>
          </div>
          <div className="x-plan pro">
            <span className="label">Pro · Most popular</span>
            <h2>Everything included</h2>
            <p>All of Lite, plus recording, voicemail, forwarding, broadcasts, group calls and anonymous calling.</p>
            <ul>{APP_FEATURES.map(([f]) => <li key={f}><Icon name="check" />{f}</li>)}</ul>
          </div>
        </div>
        <p className="x-note">Weekly, monthly and yearly billing for both plans. Subscriptions are billed by Apple and renew until cancelled.</p>
      </div></section>
      <section className="band alt"><div className="wrap">
        <SectionHead label="Coins" title="Calls and texts to regular numbers" sub="Coins pay for calls and SMS to non-app numbers — roughly 1 coin per minute or message for US numbers. App-to-app calls and chats are always free." />
      </div></section>
      <Faqs items={PLAN_FAQ} />
      <CtaBand />
    </>
  );
}
