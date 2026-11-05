import Link from 'next/link';
import { formatDate, type PostSummary } from '@/site/blog';

/** Article card used on /blog, the homepage and "Keep reading". Plain <img> so any CMS image host works. */
export default function BlogCard({ p, headingLevel = 2 }: { p: PostSummary; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <Link className={'x-post' + (p.image ? ' has-img' : '')} href={`/blog/${p.slug}`}>
      {p.image && (
        <span className="x-post-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image.url} alt={p.image.alt} width={p.image.width ?? undefined} height={p.image.height ?? undefined} loading="lazy" decoding="async" />
        </span>
      )}
      <span className="x-post-body">
        <span className="x-post-meta">
          {p.category && <span className="tag">{p.category.name}</span>}
        </span>
        <H>{p.title}</H>
        {p.excerpt && <p>{p.excerpt}</p>}
        <span className="x-post-by">
          {p.author && <b>{p.author.name}</b>}
          <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
          <span>· {p.readingMinutes} min read</span>
        </span>
      </span>
    </Link>
  );
}
