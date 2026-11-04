import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand, Faqs, Highlights, LinkCards, PageHero, SectionHead, Sections, Steps, StoreButton } from '@/components/site/blocks';
import { FEATURES } from '@/site/content/features';
import { FEATURE_GROUPS } from '@/site/types';

export const dynamicParams = false;
export function generateStaticParams() { return FEATURES.map((f) => ({ slug: f.slug })); }

const find = (slug: string) => FEATURES.find((f) => f.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const f = find((await params).slug);
  if (!f) return {};
  return { title: { absolute: f.seoTitle }, description: f.seoDescription, alternates: { canonical: `/features/${f.slug}` }, openGraph: { title: f.seoTitle, description: f.seoDescription } };
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const f = find((await params).slug);
  if (!f) notFound();
  const related = f.related.map(find).filter(Boolean) as typeof FEATURES;
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { href: '/features', label: 'Features' }, { label: f.name }]}
        eyebrow={<>{FEATURE_GROUPS[f.group]}{f.pro && <em className="pro-tag light">Included with Pro</em>}</>} title={f.title} intro={f.intro} icon={f.icon}>
        <StoreButton light />
        <Link className="btn btn-ghost-light" href="/app">Try it on the web</Link>
      </PageHero>
      <section className="band"><div className="wrap"><Highlights items={f.highlights} /></div></section>
      <section className="band alt">
        <div className="wrap">
          <SectionHead label="How it works" title={`Using ${f.name.toLowerCase()}`} />
          <Steps steps={f.steps} />
        </div>
      </section>
      <section className="band"><div className="wrap"><Sections items={f.sections} /></div></section>
      <Faqs items={f.faqs} />
      {related.length > 0 && (
        <section className="band">
          <div className="wrap">
            <SectionHead label="Related" title="Works well with" />
            <LinkCards items={related.map((r) => ({ href: `/features/${r.slug}`, icon: r.icon, title: r.name, text: r.short, badge: r.pro ? 'Pro' : undefined }))} />
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
