import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Crumbs, CtaBand } from '@/components/site/blocks';
import { formatDate, getPost, getPosts } from '@/site/blog';
import { abs, BRAND } from '@/site/config';

export const dynamicParams = false;
export function generateStaticParams() { return getPosts().map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPost((await params).slug);
  if (!p) return {};
  return {
    title: p.title, description: p.description, alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: 'article', title: p.title, description: p.description, publishedTime: p.date, authors: [p.author] },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPost((await params).slug);
  if (!p) notFound();
  const more = getPosts().filter((x) => x.slug !== p.slug).slice(0, 3);
  const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, author: { '@type': 'Organization', name: p.author }, publisher: { '@type': 'Organization', name: BRAND }, mainEntityOfPage: abs(`/blog/${p.slug}`) };
  return (
    <>
      <section className="page-hero xh post-hero">
        <div className="wrap">
          <Crumbs items={[{ href: '/', label: 'Home' }, { href: '/blog', label: 'Blog' }, { label: p.title }]} />
          <div className="x-post-meta light">{p.tags.map((t) => <span className="tag" key={t}>{t}</span>)}<time dateTime={p.date}>{formatDate(p.date)}</time><span>· {p.readingMinutes} min read</span></div>
          <h1>{p.title}</h1>
          <p>{p.description}</p>
        </div>
      </section>
      <article className="doc-page"><div className="wrap">
        <div className="prose x-article" dangerouslySetInnerHTML={{ __html: p.html }} />
        <div className="doc-foot-links"><Link href="/blog">← All posts</Link><span>By {p.author}</span></div>
      </div></article>
      {more.length > 0 && (
        <section className="band alt"><div className="wrap">
          <div className="sec-head"><span className="label">Keep reading</span><h2>More guides</h2></div>
          <div className="x-posts">
            {more.map((m) => (
              <Link className="x-post" href={`/blog/${m.slug}`} key={m.slug}>
                <div className="x-post-meta"><time dateTime={m.date}>{formatDate(m.date)}</time></div>
                <h2>{m.title}</h2><p>{m.description}</p>
              </Link>
            ))}
          </div>
        </div></section>
      )}
      <CtaBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
