import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand, Faqs, LinkCards, PageHero, SectionHead, Steps, StoreButton } from '@/components/site/blocks';
import { CALL_COUNTRIES } from '@/site/content/countries';
import { webApp } from '@/site/config';

export const dynamicParams = false;
export function generateStaticParams() { return CALL_COUNTRIES.map((c) => ({ slug: c.slug })); }
const find = (slug: string) => CALL_COUNTRIES.find((c) => c.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = find((await params).slug);
  if (!c) return {};
  return { title: { absolute: c.seoTitle }, description: c.seoDescription, alternates: { canonical: `/international-calling/${c.slug}` }, openGraph: { title: c.seoTitle, description: c.seoDescription } };
}

export default async function CallCountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = find((await params).slug);
  if (!c) notFound();
  const others = CALL_COUNTRIES.filter((o) => o.slug !== c.slug).slice(0, 6);
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { href: '/international-calling', label: 'International calling' }, { label: c.name }]}
        eyebrow={<><span aria-hidden="true">{c.flag}</span> Country code {c.dial}</>} title={c.title} intro={c.intro}>
        <StoreButton light />
        <Link className="btn btn-ghost-light" href={webApp('/dial')}>Open the dial pad</Link>
      </PageHero>
      <section className="band"><div className="wrap">
        <div className="x-dial">
          <div><span className="label">Number format</span><b className="mono">{c.example}</b><p>Country code {c.dial}, then the local number without the leading 0.</p></div>
        </div>
        <SectionHead label="How to call" title={`Calling ${c.name} from the app`} />
        <Steps steps={[`Open Dial and tap the country button, then choose ${c.name} (${c.dial}).`, 'Type the number without the leading 0 — or pick a saved contact.', 'Tap call. If they also have the app, use App Calls instead — it’s free.']} />
      </div></section>
      <section className="band alt"><div className="wrap">
        <SectionHead label="Tips" title={`Good to know when calling ${c.name}`} />
        <ul className="x-tips">{c.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </div></section>
      <Faqs items={c.faqs} />
      <section className="band"><div className="wrap">
        <SectionHead label="More countries" title="Other calling guides" />
        <LinkCards cols={3} items={others.map((o) => ({ href: `/international-calling/${o.slug}`, flag: o.flag, title: o.title, text: `Country code ${o.dial}` }))} />
      </div></section>
      <CtaBand />
    </>
  );
}
