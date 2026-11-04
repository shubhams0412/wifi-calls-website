import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand, PageHero } from '@/components/site/blocks';
import { formatDate, getPosts } from '@/site/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Guides and tips on second phone numbers, Wi-Fi calling, privacy and calling abroad from the Wi-Fi Calling & Texting team.',
  alternates: { canonical: '/blog' },
};

export default function BlogIndex() {
  const posts = getPosts();
  return (
    <>
      <PageHero crumbs={[{ href: '/', label: 'Home' }, { label: 'Blog' }]} eyebrow="Blog" icon="message"
        title="Guides & tips" intro="Practical advice on second numbers, Wi-Fi calling, privacy and staying in touch abroad." />
      <section className="band"><div className="wrap">
        {posts.length === 0 ? <p className="x-note">No posts yet.</p> : (
          <div className="x-posts">
            {posts.map((p) => (
              <Link className="x-post" href={`/blog/${p.slug}`} key={p.slug}>
                <div className="x-post-meta">{p.tags[0] && <span className="tag">{p.tags[0]}</span>}<time dateTime={p.date}>{formatDate(p.date)}</time>{p.draft && <span className="tag draft">Draft</span>}</div>
                <h2>{p.title}</h2>
                <p>{p.description}</p>
                <span className="x-post-more">Read · {p.readingMinutes} min</span>
              </Link>
            ))}
          </div>
        )}
      </div></section>
      <CtaBand />
    </>
  );
}
