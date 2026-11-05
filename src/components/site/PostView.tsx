import Link from 'next/link';
import { Icon } from '@/components/icons';
import { Crumbs, Faqs } from '@/components/site/blocks';
import BlogCard from '@/components/site/BlogCard';
import { formatDate, type Post } from '@/site/blog';
import { abs, BRAND } from '@/site/config';

const external = (url: string) => (/^https?:/.test(url) ? { target: '_blank', rel: 'noopener' } : {});

/** Lets wide tables scroll sideways on phones without shrinking them on desktop. */
const wrapTables = (html: string) => html.replace(/<table\b/g, '<div class="x-table"><table').replace(/<\/table>/g, '</table></div>');

/** A full article: used by /blog/[slug] and by the admin panel's preview (/blog/preview/[token]). */
/** True for a CMS call to action that asks the reader to download or get the app. */
const isAppDownloadCta = (cta: { buttonStyle?: string; buttonUrl?: string | null; buttonText?: string | null }) =>
  cta.buttonStyle === 'APP_STORE' || /apps\.apple\.com|play\.google\.com/.test(cta.buttonUrl ?? '') || /download|get the app|app store/i.test(cta.buttonText ?? '');

export default function PostView({ p, preview }: { p: Post; preview?: string }) {
  const updated = p.updatedAt.slice(0, 10) !== p.publishedAt.slice(0, 10);
  // The site offers no app downloads, so a "get / download the app" call to action from the CMS isn't shown.
  const cta = p.cta && !isAppDownloadCta(p.cta) ? p.cta : null;
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
        <div className={'x-post-layout' + (cta ? ' has-cta' : '')}>
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
          {cta && (
            <aside className="x-post-cta" aria-label={cta.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {cta.image && <img className="x-post-cta-img" src={cta.image} alt="" loading="lazy" />}
              <div className="x-post-cta-body">
                <span className="appicon" role="img" aria-label="Wi-Fi Calling & Texting app icon" />
                <h2>{cta.title}</h2>
                {cta.description && <p>{cta.description}</p>}
                <a className="btn btn-primary" href={cta.buttonUrl} {...external(cta.buttonUrl)}>{cta.buttonText} <Icon name="arrowR" /></a>
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
      {!preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
    </>
  );
}
