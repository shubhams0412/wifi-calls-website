import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand, Faqs, Highlights, LinkCards, PageHero, SectionHead, Sections, StoreButton } from '@/components/site/blocks';
import { USE_CASES } from '@/site/content/useCases';
import { FEATURES } from '@/site/content/features';
import { webApp } from '@/site/config';

export const dynamicParams = false;
export function generateStaticParams() { return USE_CASES.map((u) => ({ slug: u.slug })); }
const find = (slug: string) => USE_CASES.find((u) => u.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const u = find((await params).slug);
  if (!u) return {};
  return { title: { absolute: u.seoTitle }, description: u.seoDescription, alternates: { canonical: `/use-cases/${u.slug}` }, openGraph: { title: u.seoTitle, description: u.seoDescription } };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const u = find((await params).slug);
  if (!u) notFound();
  const feats = u.features.map((s) => FEATURES.find((f) => f.slug === s)).filter(Boolean) as typeof FEATURES;
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { href: '/use-cases', label: 'Use cases' }, { label: u.name }]} eyebrow={u.name} title={u.title} intro={u.intro} icon={u.icon}>
        <StoreButton light />
        <Link className="btn btn-ghost-light" href={webApp()}>Try it on the web</Link>
      </PageHero>
      <section className="band"><div className="wrap">
        <SectionHead label="Sound familiar?" title="Where a second number helps" />
        <Highlights items={u.problems} />
      </div></section>
      <section className="band alt"><div className="wrap">
        <SectionHead label="Features" title="The features you'll use most" />
        <LinkCards items={feats.map((f) => ({ href: `/features/${f.slug}`, icon: f.icon, title: f.name, text: f.short, badge: f.pro ? 'Pro' : undefined }))} />
      </div></section>
      <section className="band"><div className="wrap"><Sections items={u.sections} /></div></section>
      <Faqs items={u.faqs} />
      <CtaBand />
    </>
  );
}
