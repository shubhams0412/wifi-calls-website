import { listPosts } from '@/site/blog';
import { abs, BRAND } from '@/site/config';

export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));

/** RSS feed of the latest 30 articles, built once at deploy. */
export async function GET() {
  const { posts } = await listPosts({ perPage: 30 });
  const items = posts.map((p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${abs(`/blog/${p.slug}`)}</link>
      <guid>${abs(`/blog/${p.slug}`)}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>${p.category ? `\n      <category>${esc(p.category.name)}</category>` : ''}
      <description>${esc(p.excerpt)}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${esc(BRAND)} Blog</title>
  <link>${abs('/blog')}</link>
  <description>Guides and tips on second numbers, Wi-Fi calling and privacy.</description>${items}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
