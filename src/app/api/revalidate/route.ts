import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Called by the admin panel after an article, category, author or setting
 * changes, so the blog shows it on the next visit instead of after the
 * 60-second cache runs out.
 *
 * When REVALIDATE_SECRET is set, the request must send it in the
 * `x-revalidate-secret` header. All this route can do is drop cached copies,
 * so without a secret the worst case is a few extra CMS requests.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (secret && request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  // CMS responses (lists, articles, sitemap), then every prebuilt page that used them.
  revalidateTag('blog', { expire: 0 });
  revalidatePath('/', 'layout');
  return Response.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
