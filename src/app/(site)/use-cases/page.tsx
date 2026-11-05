import type { Metadata } from 'next';
import { LinkCards, PageHero } from '@/components/site/blocks';
import { USE_CASES } from '@/site/content/useCases';

export const metadata: Metadata = {
  title: 'Use cases',
  description: 'How people use a second phone number from Wi-Fi Calling & Texting — for business, freelancing, selling online, dating, travel and everyday privacy.',
  alternates: { canonical: '/use-cases' },
};

export default function UseCasesPage() {
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'Use cases' }]} eyebrow="Use cases" icon="users"
        title="One app, many reasons to have a second number"
        intro="Keep work, side projects and personal life apart — and your real number private." />
      <section className="band"><div className="wrap">
        <LinkCards cols={2} items={USE_CASES.map((u) => ({ href: `/use-cases/${u.slug}`, icon: u.icon, title: u.name, text: u.short }))} />
      </div></section>
    </>
  );
}
