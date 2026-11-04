import { getPosts } from '@/site/blog';
import { abs, BRAND } from '@/site/config';

export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));

/** RSS feed of published blog posts. */
export function GET() {
  const items = getPosts().map((p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${abs(`/blog/${p.slug}`)}</link>
      <guid>${abs(`/blog/${p.slug}`)}</guid>
      <pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${esc(BRAND)} Blog</title>
  <link>${abs('/blog')}</link>
  <description>Guides and tips on second numbers, Wi-Fi calling and privacy.</description>${items}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
