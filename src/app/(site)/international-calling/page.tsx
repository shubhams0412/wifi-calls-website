import type { Metadata } from 'next';
import { Highlights, LinkCards, PageHero, SectionHead } from '@/components/site/blocks';
import { CALL_COUNTRIES } from '@/site/content/countries';

export const metadata: Metadata = {
  title: 'International calling',
  description: 'Call and text internationally from your second number with Wi-Fi Calling & Texting — free app-to-app calls, and calls to regular numbers abroad using coins.',
  alternates: { canonical: '/international-calling' },
};

export default function InternationalPage() {
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'International calling' }]} eyebrow="International calling" icon="globe"
        title="Call friends and family abroad"
        intro="Calls between app users are free anywhere in the world. Calls to regular numbers abroad use coins — check the per-country charges in the app before you call." />
      <section className="band"><div className="wrap">
        <Highlights items={[
          { icon: 'wifi', title: 'Free app-to-app', text: 'If they have the app too, call, video call and chat for free over Wi-Fi or data.' },
          { icon: 'globe', title: 'Any number abroad', text: 'Pick the country, dial the number and call from your second number using coins.' },
          { icon: 'dollar', title: 'See charges first', text: 'Settings → Purchase Coins → “See per-minute charges” shows the cost per country for calls and SMS.' },
        ]} />
      </div></section>
      <section className="band alt"><div className="wrap">
        <SectionHead label="Popular countries" title="Calling guides by country" />
        <LinkCards cols={3} items={CALL_COUNTRIES.map((c) => ({ href: `/international-calling/${c.slug}`, flag: c.flag, title: c.title, text: `Country code ${c.dial}` }))} />
      </div></section>
    </>
  );
}
