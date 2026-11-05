import type { Metadata } from 'next';
import { LinkCards, PageHero, SectionHead, Steps } from '@/components/site/blocks';
import { NUMBER_COUNTRIES } from '@/site/content/countries';

export const metadata: Metadata = {
  title: 'Phone numbers by country',
  description: 'Get a second phone number in the United States or Canada with Wi-Fi Calling & Texting. Pick from available numbers and start calling and texting in minutes.',
  alternates: { canonical: '/numbers' },
};

export default function NumbersPage() {
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'Numbers' }]} eyebrow="Numbers" icon="phonePlus"
        title="Get a second phone number"
        intro="Choose a local number in the United States or Canada. Use it for calls and texts alongside your existing line." />
      <section className="band"><div className="wrap">
        <SectionHead label="Countries" title="Where you can get a number" />
        <LinkCards cols={2} items={NUMBER_COUNTRIES.map((c) => ({ href: `/numbers/${c.slug}`, flag: c.flag, title: `${c.name} phone numbers`, text: c.intro }))} />
      </div></section>
      <section className="band alt"><div className="wrap">
        <SectionHead label="How it works" title="Your number in three steps" />
        <Steps steps={['Sign in with your phone number.', 'Choose a plan, then tap “Get a phone number” and pick a country.', 'Select a number from the available list — it’s ready for calls and texts straight away.']} />
      </div></section>
    </>
  );
}
