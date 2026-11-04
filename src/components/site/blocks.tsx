/* Building blocks for the marketing pages (server components). Styles: src/styles/site-x.css. */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/webapp/icons';
import { APP_STORE_URL, abs } from '@/site/config';
import type { Faq, Point, Section } from '@/site/types';

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, ...(it.href ? { item: abs(it.href) } : {}) })),
  };
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <span className="sep">/</span>}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </nav>
  );
}

export function StoreButton({ light }: { light?: boolean }) {
  return (
    <a className={'btn ' + (light ? 'btn-light' : 'btn-primary')} href={APP_STORE_URL} target="_blank" rel="noopener">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2-.1 1.6-.8 3-.8s1.8.8 3 .7c1.2 0 2-1.1 2.8-2.3.9-1.3 1.2-2.6 1.3-2.7-.1 0-2.4-1-2.4-3.6zM14.2 5.9c.6-.8 1.1-1.9.9-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.3-.6 3-1.4z" /></svg>
      Download on iOS
    </a>
  );
}

/** Gradient page header used by every inner page. */
export function PageHero({ crumbs, eyebrow, title, intro, icon, children }: {
  crumbs?: { href?: string; label: string }[]; eyebrow?: ReactNode; title: string; intro?: string; icon?: IconName; children?: ReactNode;
}) {
  return (
    <section className="page-hero xh">
      <div className="wrap">
        {crumbs && <Crumbs items={crumbs} />}
        <div className="xh-row">
          <div className="xh-copy">
            {eyebrow && <span className="label">{eyebrow}</span>}
            <h1>{title}</h1>
            {intro && <p>{intro}</p>}
            {children && <div className="xh-actions">{children}</div>}
          </div>
          {icon && <span className="xh-icon" aria-hidden="true"><Icon name={icon} /></span>}
        </div>
      </div>
    </section>
  );
}

export function SectionHead({ label, title, sub }: { label?: string; title: string; sub?: string }) {
  return (
    <div className="sec-head">
      {label && <span className="label">{label}</span>}
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

export function Highlights({ items }: { items: Point[] }) {
  return (
    <div className="x-grid">
      {items.map((p) => (
        <div className="fcard" key={p.title}>
          <span className="ic" aria-hidden="true"><Icon name={p.icon} /></span>
          <h3>{p.title}</h3>
          <p>{p.text}</p>
        </div>
      ))}
    </div>
  );
}

export function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="x-steps">
      {steps.map((s, i) => <li key={i}><span className="num">{i + 1}</span><p>{s}</p></li>)}
    </ol>
  );
}

export function Sections({ items }: { items: Section[] }) {
  return (
    <div className="x-sections">
      {items.map((s) => (
        <div className="x-section" key={s.title}>
          <h2>{s.title}</h2>
          <p>{s.text}</p>
          {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
        </div>
      ))}
    </div>
  );
}

/** FAQ accordion + FAQPage structured data for search engines. */
export function Faqs({ items, title = 'Frequently asked questions' }: { items: Faq[]; title?: string }) {
  if (!items.length) return null;
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  return (
    <section className="band alt">
      <div className="wrap">
        <SectionHead label="FAQ" title={title} />
        <div className="x-faq">
          {items.map((f) => (
            <details key={f.q}>
              <summary>{f.q}<Icon name="chevD" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </section>
  );
}

export interface CardLink { href: string; icon?: IconName; flag?: string; title: string; text?: string; badge?: string }
export function LinkCards({ items, cols = 3 }: { items: CardLink[]; cols?: 2 | 3 | 4 }) {
  return (
    <div className={'x-cards cols-' + cols}>
      {items.map((c) => (
        <Link className="x-card" href={c.href} key={c.href}>
          {c.flag ? <span className="flag" aria-hidden="true">{c.flag}</span> : c.icon && <span className="ic" aria-hidden="true"><Icon name={c.icon} /></span>}
          <span className="x-card-body">
            <b>{c.title}{c.badge && <em className="pro-tag">{c.badge}</em>}</b>
            {c.text && <span>{c.text}</span>}
          </span>
          <Icon name="arrowR" className="go" />
        </Link>
      ))}
    </div>
  );
}

/** Closing call to action band. */
export function CtaBand({ title = 'Get your second number today', text = 'Download the app or open the web app — set up takes a couple of minutes.' }: { title?: string; text?: string }) {
  return (
    <section className="x-cta">
      <div className="wrap">
        <div className="x-cta-in">
          <div>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <div className="x-cta-actions">
            <StoreButton light />
            <Link className="btn btn-ghost-light" href="/app">Use it on the web</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export const ProTag = () => <em className="pro-tag">Pro</em>;
