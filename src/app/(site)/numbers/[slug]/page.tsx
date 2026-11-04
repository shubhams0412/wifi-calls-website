import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand, Faqs, PageHero, SectionHead, Sections, Steps, StoreButton } from '@/components/site/blocks';
import { NUMBER_COUNTRIES } from '@/site/content/countries';

export const dynamicParams = false;
export function generateStaticParams() { return NUMBER_COUNTRIES.map((c) => ({ slug: c.slug })); }
const find = (slug: string) => NUMBER_COUNTRIES.find((c) => c.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = find((await params).slug);
  if (!c) return {};
  return { title: { absolute: c.seoTitle }, description: c.seoDescription, alternates: { canonical: `/numbers/${c.slug}` }, openGraph: { title: c.seoTitle, description: c.seoDescription } };
}

export default async function NumberCountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = find((await params).slug);
  if (!c) notFound();
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { href: '/numbers', label: 'Numbers' }, { label: c.name }]}
        eyebrow={<><span aria-hidden="true">{c.flag}</span> {c.name} · {c.dial}</>} title={c.title} intro={c.intro}>
        <StoreButton light />
        <Link className="btn btn-ghost-light" href="/app">Get one on the web</Link>
      </PageHero>
      <section className="band"><div className="wrap">
        <SectionHead label="Area codes" title="Example area codes" sub="Availability changes — in the app you pick from the numbers available at that moment." />
        <div className="x-codes">
          {c.areaCodes.map((a) => <div className="x-code" key={a.code}><b>{a.code}</b><span>{a.city}</span></div>)}
        </div>
      </div></section>
      <section className="band alt"><div className="wrap">
        <SectionHead label="How it works" title={`Get your ${c.name} number`} />
        <Steps steps={['Download the app (or open the web app) and sign in with your phone number.', `Tap “Get a phone number” and choose ${c.name}.`, 'Pick a number from the list — calls and texts work right away.']} />
      </div></section>
      <section className="band"><div className="wrap"><Sections items={c.sections} /></div></section>
      <Faqs items={c.faqs} />
      <CtaBand />
    </>
  );
}
