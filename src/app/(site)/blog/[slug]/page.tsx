import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { cache } from 'react';
import { Crumbs, CtaBand, Faqs } from '@/components/site/blocks';
import BlogCard from '@/components/site/BlogCard';
import { allPostSlugs, formatDate, getPost } from '@/site/blog';
import { abs, BRAND } from '@/site/config';

// Pages are prebuilt for known articles and refreshed at most once a minute; articles published
// later in the admin panel are rendered on first visit (dynamicParams defaults to true).
export const revalidate = 60;
export async function generateStaticParams() { return (await allPostSlugs()).map(({ slug }) => ({ slug })); }

/** Lets wide tables scroll sideways on phones without shrinking them on desktop. */
const wrapTables = (html: string) => html.replace(/<table\b/g, '<div class="x-table"><table').replace(/<\/table>/g, '</table></div>');

type Params = Promise<{ slug: string }>;
const load = cache(getPost); // one CMS request shared by generateMetadata and the page

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await load((await params).slug);
  if (!r || !('post' in r)) return {};
  const p = r.post;
  const title = p.seo?.title || p.title;
  const description = p.seo?.description || p.excerpt;
  const image = p.seo?.ogImage || p.image?.url;
  return {
    title: { absolute: `${title} | ${BRAND}` },
    description,
    alternates: { canonical: p.seo?.canonicalUrl || `/blog/${p.slug}` },
    robots: p.seo && (!p.seo.index || !p.seo.follow) ? { index: p.seo.index, follow: p.seo.follow } : undefined,
    openGraph: {
      type: 'article', title, description, url: abs(`/blog/${p.slug}`),
      publishedTime: p.publishedAt, modifiedTime: p.updatedAt,
      authors: p.author ? [p.author.name] : undefined, section: p.category?.name,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image] : undefined },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const r = await load((await params).slug);
  if (!r) notFound();
  if ('redirect' in r) {
    const to = r.redirect.startsWith('/blog/') ? r.redirect.replace(/\/+$/, '') : r.redirect;
    return r.permanent ? permanentRedirect(to) : redirect(to);
  }
  const p = r.post;
  const updated = p.updatedAt.slice(0, 10) !== p.publishedAt.slice(0, 10);
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: p.title, description: p.excerpt, image: p.image?.url,
    datePublished: p.publishedAt, dateModified: p.updatedAt,
    author: p.author ? { '@type': 'Person', name: p.author.name, jobTitle: p.author.role ?? undefined } : { '@type': 'Organization', name: BRAND },
    publisher: { '@type': 'Organization', name: BRAND },
    mainEntityOfPage: abs(`/blog/${p.slug}`),
  };

  return (
    <>
      <section className="page-hero xh post-hero">
        <div className="wrap">
          <Crumbs items={[{ href: '/', label: 'Home' }, { href: '/blog', label: 'Blog' }, { label: p.title }]} />
          <div className="x-post-meta light">
            {p.category && <Link className="tag" href={`/blog?category=${p.category.slug}`}>{p.category.name}</Link>}
            {p.draft && <span className="tag">Draft</span>}
          </div>
          <h1>{p.title}</h1>
          {p.excerpt && <p>{p.excerpt}</p>}
          <div className="x-byline">
            {p.author?.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.author.image} alt="" width={36} height={36} />}
            <span>
              {p.author && <b>{p.author.name}</b>}
              <span>{updated ? 'Updated ' : ''}<time dateTime={updated ? p.updatedAt : p.publishedAt}>{formatDate(updated ? p.updatedAt : p.publishedAt)}</time> · {p.readingMinutes} min read</span>
            </span>
          </div>
        </div>
      </section>

      <article className="doc-page"><div className="wrap">
        {p.image && (
          <figure className="x-hero-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image.url} alt={p.image.alt} width={p.image.width ?? undefined} height={p.image.height ?? undefined} fetchPriority="high" />
          </figure>
        )}
        <div className="prose x-article" dangerouslySetInnerHTML={{ __html: wrapTables(p.html) }} />

        {p.cta && (
          <aside className="x-post-cta">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.cta.image && <img src={p.cta.image} alt="" loading="lazy" />}
            <div>
              <h2>{p.cta.title}</h2>
              {p.cta.description && <p>{p.cta.description}</p>}
              <a className="btn btn-primary" href={p.cta.buttonUrl} {...(/^https?:/.test(p.cta.buttonUrl) ? { target: '_blank', rel: 'noopener' } : {})}>{p.cta.buttonText}</a>
            </div>
          </aside>
        )}

        {p.tags.length > 0 && <div className="x-tags">{p.tags.map((t) => <span key={t.slug}>#{t.name}</span>)}</div>}

        {p.author && (p.author.bio || p.author.role) && (
          <div className="x-author">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.author.image && <img src={p.author.image} alt="" width={64} height={64} loading="lazy" />}
            <div>
              <b>{p.author.name}</b>
              {p.author.role && <span>{p.author.role}</span>}
              {p.author.bio && <p>{p.author.bio}</p>}
            </div>
          </div>
        )}
        <div className="doc-foot-links"><Link href="/blog">← All articles</Link></div>
      </div></article>

      {p.faqs.length > 0 && <Faqs items={p.faqs} schema={p.faqSchema} />}

      {p.related.length > 0 && (
        <section className="band alt"><div className="wrap">
          <div className="sec-head"><span className="label">Keep reading</span><h2>Related articles</h2></div>
          <div className="x-posts">{p.related.map((m) => <BlogCard p={m} key={m.slug} headingLevel={3} />)}</div>
        </div></section>
      )}
      <CtaBand />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </>
  );
}
