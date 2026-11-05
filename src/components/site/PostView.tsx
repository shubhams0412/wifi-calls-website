import Link from 'next/link';
import { Icon } from '@/components/icons';
import { Crumbs, CtaBand, Faqs } from '@/components/site/blocks';
import BlogCard from '@/components/site/BlogCard';
import { formatDate, type Post } from '@/site/blog';
import { abs, BRAND } from '@/site/config';

const external = (url: string) => (/^https?:/.test(url) ? { target: '_blank', rel: 'noopener' } : {});

/** Lets wide tables scroll sideways on phones without shrinking them on desktop. */
const wrapTables = (html: string) => html.replace(/<table\b/g, '<div class="x-table"><table').replace(/<\/table>/g, '</table></div>');

/** A full article: used by /blog/[slug] and by the admin panel's preview (/blog/preview/[token]). */
export default function PostView({ p, preview }: { p: Post; preview?: string }) {
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
      {preview && <div className="x-preview-bar" role="status"><b>Preview</b> · {preview} · Only people with this link can see this page.</div>}
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
        <div className={'x-post-layout' + (p.cta ? ' has-cta' : '')}>
          <div className="x-post-main">
            <div className="prose x-article" dangerouslySetInnerHTML={{ __html: wrapTables(p.html) }} />

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
          </div>

          {/* The article's call to action: sticky beside the text on desktop, below it on phones. */}
          {p.cta && (
            <aside className="x-post-cta" aria-label="Get the app">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.cta.image && <img className="x-post-cta-img" src={p.cta.image} alt="" loading="lazy" />}
              <div className="x-post-cta-body">
                <span className="appicon" role="img" aria-label="Wi-Fi Calling & Texting app icon" />
                <h2>{p.cta.title}</h2>
                {p.cta.description && <p>{p.cta.description}</p>}
                {p.cta.buttonStyle === 'APP_STORE' ? (
                  <a className="x-store-badge" href={p.cta.buttonUrl} aria-label={p.cta.buttonText || 'Download on the App Store'} {...external(p.cta.buttonUrl)}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2-.1 1.6-.8 3-.8s1.8.8 3 .7c1.2 0 2-1.1 2.8-2.3.9-1.3 1.2-2.6 1.3-2.7-.1 0-2.4-1-2.4-3.6zM14.2 5.9c.6-.8 1.1-1.9.9-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.3-.6 3-1.4z" /></svg>
                    <span><small>Download on the</small>App Store</span>
                  </a>
                ) : (
                  <a className="btn btn-primary" href={p.cta.buttonUrl} {...external(p.cta.buttonUrl)}>{p.cta.buttonText} <Icon name="arrowR" /></a>
                )}
              </div>
            </aside>
          )}
        </div>
      </div></article>

      {p.faqs.length > 0 && <Faqs items={p.faqs} schema={p.faqSchema} />}

      {p.related.length > 0 && (
        <section className="band alt"><div className="wrap">
          <div className="sec-head"><span className="label">Keep reading</span><h2>Related articles</h2></div>
          <div className="x-posts">{p.related.map((m) => <BlogCard p={m} key={m.slug} headingLevel={3} />)}</div>
        </div></section>
      )}
      <CtaBand />
      {!preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
    </>
  );
}
