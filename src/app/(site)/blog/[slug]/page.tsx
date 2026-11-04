import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { cache } from 'react';
import PostView from '@/components/site/PostView';
import { allPostSlugs, getPost } from '@/site/blog';
import { abs, BRAND } from '@/site/config';

// Pages are prebuilt for known articles and refreshed at most once a minute; articles published
// later in the admin panel are rendered on first visit (dynamicParams defaults to true).
export const revalidate = 60;
export async function generateStaticParams() { return (await allPostSlugs()).map(({ slug }) => ({ slug })); }

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
  return <PostView p={r.post} />;
}
