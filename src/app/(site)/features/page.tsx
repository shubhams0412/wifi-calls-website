import type { Metadata } from 'next';
import { CtaBand, LinkCards, PageHero, SectionHead } from '@/components/site/blocks';
import { FEATURES } from '@/site/content/features';
import { FEATURE_GROUPS, type FeatureGroup } from '@/site/types';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Everything in Wi-Fi Calling & Texting: a private second number, free app-to-app calls and chat, texting, voicemail, call recording, forwarding and more.',
  alternates: { canonical: '/features' },
};

export default function FeaturesPage() {
  const groups = Object.keys(FEATURE_GROUPS) as FeatureGroup[];
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'Features' }]} eyebrow="Features" icon="sparkles"
        title="Everything you need in a second phone number"
        intro="A private number, free calls and chat between app users, texting to any number and the call tools you'd expect — on iPhone and the web." />
      {groups.map((g, i) => {
        const items = FEATURES.filter((f) => f.group === g);
        if (!items.length) return null;
        return (
          <section className={'band' + (i % 2 ? ' alt' : '')} key={g}>
            <div className="wrap">
              <SectionHead label={FEATURE_GROUPS[g]} title={FEATURE_GROUPS[g]} />
              <LinkCards items={items.map((f) => ({ href: `/features/${f.slug}`, icon: f.icon, title: f.name, text: f.short, badge: f.pro ? 'Pro' : undefined }))} />
            </div>
          </section>
        );
      })}
      <CtaBand />
    </>
  );
}
