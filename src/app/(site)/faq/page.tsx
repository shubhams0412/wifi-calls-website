import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand, Faqs, PageHero } from '@/components/site/blocks';
import { GENERAL_FAQ } from '@/site/content/faq';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about Wi-Fi Calling & Texting: second numbers, free app-to-app calls, coins, Lite vs Pro, subscriptions and privacy.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'FAQ' }]} eyebrow="Help" icon="question"
        title="Frequently asked questions" intro="Can’t find what you need? Get in touch and we’ll help.">
        <Link className="btn btn-light" href="/contact">Contact us</Link>
      </PageHero>
      <Faqs items={GENERAL_FAQ} title="Everything about the app" />
      <CtaBand />
    </>
  );
}
