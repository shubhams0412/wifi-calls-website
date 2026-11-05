import Link from 'next/link';
import { PageHero } from '@/components/site/blocks';
import BlogCard from '@/components/site/BlogCard';
import type { BlogCategory, PostSummary } from '@/site/blog';

/** The blog list, for all articles (/blog) or one category (/blog/category/<slug>). Static pages. */
export default function BlogList({ posts, categories, current }: { posts: PostSummary[]; categories: BlogCategory[]; current?: BlogCategory }) {
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, current ? { href: '/blog', label: 'Blog' } : { label: 'Blog' }, ...(current ? [{ label: current.name }] : [])]}
        eyebrow="Blog" icon="message"
        title="Guides & tips" intro="Practical advice on second numbers, Wi-Fi calling, privacy and staying in touch abroad." />
      <section className="band"><div className="wrap">
        {categories.length > 0 && (
          <nav className="x-cats" aria-label="Blog categories">
            <Link href="/blog" className={!current ? 'on' : undefined} aria-current={!current ? 'page' : undefined}>All</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/blog/category/${c.slug}`} className={c.slug === current?.slug ? 'on' : undefined} aria-current={c.slug === current?.slug ? 'page' : undefined}>{c.name}</Link>
            ))}
          </nav>
        )}
        <h2 className="x-posts-h">{current ? current.name : 'Latest articles'}</h2>
        {current?.description && <p className="x-note left">{current.description}</p>}
        {posts.length === 0
          ? <p className="x-note">No articles yet — check back soon.</p>
          : <div className="x-posts">{posts.map((p) => <BlogCard p={p} key={p.slug} />)}</div>}
      </div></section>
    </>
  );
}
