import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allCategories, listPosts } from '@/site/blog';
import BlogList from '../../BlogList';

// One static page per category, built at deploy; any other slug is a 404.
export const dynamicParams = false;
export async function generateStaticParams() { return (await allCategories()).map((c) => ({ slug: c.slug })); }

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = (await allCategories()).find((x) => x.slug === slug);
  if (!c) return {};
  return {
    title: `${c.name} — Blog`,
    description: c.description || `Articles about ${c.name.toLowerCase()} from the Wi-Fi Calling & Texting team.`,
    alternates: { canonical: `/blog/category/${c.slug}` },
  };
}

export default async function BlogCategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { posts, categories } = await listPosts({ perPage: 1000, category: slug });
  const current = categories.find((c) => c.slug === slug);
  if (!current) notFound();
  return <BlogList posts={posts} categories={categories} current={current} />;
}
