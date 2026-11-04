import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostView from '@/components/site/PostView';
import { getPreview } from '@/site/blog';

/* The admin panel's Preview frames this page: GET admin/blogs/{id}/preview-url returns
   {SITE_URL}/blog/preview/{token}/, and the token loads the article (drafts too) from v1/preview/{token}. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } };

const STATUS: Record<string, string> = { DRAFT: 'Draft', SCHEDULED: 'Scheduled', PUBLISHED: 'Published' };

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const r = await getPreview((await params).token);
  if (!r) notFound();
  return <PostView p={r.post} preview={STATUS[r.status] ?? 'Unsaved changes'} />;
}
