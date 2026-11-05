import type { Metadata } from 'next';
import { listPosts } from '@/site/blog';
import BlogList from './BlogList';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Guides and tips on second phone numbers, Wi-Fi calling, privacy and calling abroad from the Wi-Fi Calling & Texting team.',
  alternates: { canonical: '/blog' },
};

export default async function BlogIndex() {
  const { posts, categories } = await listPosts({ perPage: 1000 });
  return <BlogList posts={posts} categories={categories} />;
}
