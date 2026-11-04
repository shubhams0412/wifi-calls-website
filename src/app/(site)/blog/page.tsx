import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand, PageHero } from '@/components/site/blocks';
import BlogCard from '@/components/site/BlogCard';
import { isSlug, listPosts } from '@/site/blog';

type Search = Promise<{ page?: string; category?: string }>;

function parse(sp: { page?: string; category?: string }) {
  const page = Math.min(10_000, Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1));
  const category = sp.category && isSlug(sp.category) ? sp.category : undefined;
  return { page, category };
}
const href = (page: number, category?: string) => {
  const q = new URLSearchParams();
  if (category) q.set('category', category);
  if (page > 1) q.set('page', String(page));
  const s = q.toString();
  return '/blog' + (s ? `?${s}` : '');
};

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { page, category } = parse(await searchParams);
  const filtered = page > 1 || !!category;
  return {
    title: 'Blog',
    description: 'Guides and tips on second phone numbers, Wi-Fi calling, privacy and calling abroad from the Wi-Fi Calling & Texting team.',
    alternates: { canonical: href(page, category) },
    // Filtered and paged listings are reachable but shouldn't compete with /blog in search results.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogIndex({ searchParams }: { searchParams: Search }) {
  const { page, category } = parse(await searchParams);
  const { posts, totalPages, categories } = await listPosts({ page, category });
  const current = categories.find((c) => c.slug === category);

  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'Blog' }]} eyebrow="Blog" icon="message"
        title="Guides & tips" intro="Practical advice on second numbers, Wi-Fi calling, privacy and staying in touch abroad." />
      <section className="band"><div className="wrap">
        {categories.length > 0 && (
          <nav className="x-cats" aria-label="Blog categories">
            <Link href="/blog" className={!category ? 'on' : undefined} aria-current={!category ? 'page' : undefined}>All</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={href(1, c.slug)} className={c.slug === category ? 'on' : undefined} aria-current={c.slug === category ? 'page' : undefined}>{c.name}</Link>
            ))}
          </nav>
        )}
        <h2 className="x-posts-h">{current ? current.name : 'Latest articles'}</h2>
        {current?.description && <p className="x-note left">{current.description}</p>}

        {posts.length === 0 ? (
          <p className="x-note">{category ? 'No articles in this category yet.' : 'No articles yet — check back soon.'} {category && <Link href="/blog">See all articles</Link>}</p>
        ) : (
          <div className="x-posts">{posts.map((p) => <BlogCard p={p} key={p.slug} />)}</div>
        )}

        {totalPages > 1 && (
          <nav className="x-pager" aria-label="Pagination">
            {page > 1 ? <Link href={href(page - 1, category)} rel="prev">← Newer</Link> : <span className="off">← Newer</span>}
            <span className="pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
                n === page ? <b key={n} aria-current="page">{n}</b> : <Link key={n} href={href(n, category)}>{n}</Link>)}
            </span>
            {page < totalPages ? <Link href={href(page + 1, category)} rel="next">Older →</Link> : <span className="off">Older →</span>}
          </nav>
        )}
      </div></section>
      <CtaBand />
    </>
  );
}
