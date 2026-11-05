/* Blog data. Two sources, same shape:

   1. The blog CMS (admin panel → Laravel API), used when CMS_ENCRYPTION_KEY is set.
        GET {CMS_API_URL}/v1/posts?page=&perPage=&category=   list + categories
        GET {CMS_API_URL}/v1/posts/{slug}                      one article (or 404, maybe with a redirect)
        GET {CMS_API_URL}/v1/sitemap                           every published article
      Every response (404s too) is RNCryptor v3 encrypted with the Blog API key and marked
      `X-Blog-Encryption: rncryptor-v3`. Pages re-fetch at most once a minute (ISR), so an article
      published in the admin panel shows up here within ~60 seconds without a redeploy.

   2. Local Markdown in content/blog/*.md — the fallback when no CMS key is configured. */
import { createDecipheriv, createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { decryptRncryptor } from './rncryptor';

export const REVALIDATE = 60;
export const PER_PAGE = 12;

const CMS_API_URL = (process.env.CMS_API_URL || 'https://secondphonenumber.worksqr.com/api').replace(/\/+$/, '');
const CMS_KEY = process.env.CMS_ENCRYPTION_KEY || '';
// Only for `X-Blog-Encryption: aes-256-cbc` (the WiFi Calls Symfony backend): the IV seed.
const CMS_IV = process.env.CMS_ENCRYPTION_IV || '';

/** OpenSSL-style AES-256-CBC, as the backend's OpenSslApiCryptor: key = SHA-256(secret[0,32]),
    IV = MD5(ivSeed), PKCS#7 padding, base64 body. */
function decryptAesCbc(base64: string): string {
  if (!CMS_IV) throw new Error('Blog CMS: aes-256-cbc response but CMS_ENCRYPTION_IV is not set');
  const key = createHash('sha256').update(CMS_KEY.slice(0, 32)).digest();
  const iv = createHash('md5').update(CMS_IV).digest();
  const d = createDecipheriv('aes-256-cbc', key, iv);
  try { return d.update(base64.trim(), 'base64', 'utf8') + d.final('utf8'); }
  catch { throw new Error('Blog CMS: aes-256-cbc decrypt failed (wrong CMS_ENCRYPTION_KEY / CMS_ENCRYPTION_IV?)'); }
}
export const blogSource: 'cms' | 'local' = CMS_KEY ? 'cms' : 'local';

/* ---------- Shapes the pages use ---------- */
export interface BlogImage { url: string; alt: string; width: number | null; height: number | null }
export interface BlogCategory { name: string; slug: string; description?: string | null }
export interface BlogAuthor { name: string; role: string | null; bio: string | null; image: string | null }
export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  image: BlogImage | null;
  category: BlogCategory | null;
  author: BlogAuthor | null;
  publishedAt: string;   // ISO
  updatedAt: string;     // ISO
  readingMinutes: number;
  draft?: boolean;
}
export interface BlogCta { title: string; description: string | null; buttonText: string; buttonUrl: string; buttonStyle: 'APP_STORE' | 'BUTTON'; image: string | null }
export interface Post extends PostSummary {
  html: string;
  tags: { name: string; slug: string }[];
  faqs: { q: string; a: string }[];
  faqSchema: boolean;
  cta: BlogCta | null;
  related: PostSummary[];
  seo: { title: string; description: string; canonicalUrl: string | null; ogImage: string | null; index: boolean; follow: boolean } | null;
}
export interface PostList { posts: PostSummary[]; page: number; totalPages: number; total: number; categories: BlogCategory[] }
export type PostLookup = { post: Post } | { redirect: string; permanent: boolean } | null;

export const isSlug = (s: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);

/* ---------- CMS (Laravel API) ---------- */
/* eslint-disable @typescript-eslint/no-explicit-any */
async function cms<T = any>(endpoint: string, { fresh = false } = {}): Promise<{ status: number; body: T }> {
  const res = await fetch(`${CMS_API_URL}/${endpoint}`, {
    headers: { Accept: 'application/json, text/plain' },
    ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: REVALIDATE, tags: ['blog'] } }),
  });
  const raw = await res.text();
  const enc = res.headers.get('x-blog-encryption');
  const text = !enc ? raw
    : enc === 'rncryptor-v3' ? await decryptRncryptor(raw, CMS_KEY)
    : enc === 'aes-256-cbc' ? decryptAesCbc(raw)
    : (() => { throw new Error(`Blog CMS: unknown encryption "${enc}"`); })();
  try { return { status: res.status, body: JSON.parse(text) as T }; }
  catch { throw new Error(`Blog CMS: ${endpoint} → HTTP ${res.status}, not JSON`); }
}

/* Links in CMS content that point at the other brand's site (secondlinenumber.com) are sent to the
   matching page on this site instead. Image hosts (e.g. api.secondlinenumber.com) are not touched. */
const FOREIGN_HOSTS = new Set(['secondlinenumber.com', 'www.secondlinenumber.com']);
const OWN_ROUTES = ['/features', '/use-cases', '/numbers', '/international-calling', '/plans', '/blog', '/faq', '/contact', '/download', '/privacy', '/terms'];
const PATH_MAP: Record<string, string> = {
  '/business/phone-numbers': '/numbers', '/phone-numbers': '/numbers', '/pricing': '/plans', '/reviews': '/',
  '/privacy-policy': '/privacy', '/terms-of-use': '/terms', '/terms-and-conditions': '/terms', '/contact-us': '/contact',
};
/** Maps a link to this site when it points at a foreign host; other links are returned unchanged. */
export function ownLink(url: string): string {
  let u: URL;
  try { u = new URL(url, 'https://secondlinenumber.com'); } catch { return url; }
  const isRelative = !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('//');
  if (isRelative && !url.startsWith('/')) return url;          // #anchor, ?query, relative path
  if (!isRelative && !FOREIGN_HOSTS.has(u.hostname)) return url; // other sites stay as they are
  const p = u.pathname.replace(/\/+$/, '') || '/';
  const own = p === '/' || OWN_ROUTES.some((r) => p === r || p.startsWith(r + '/'));
  return (own ? p : PATH_MAP[p] ?? '/') + (own ? u.search : '') + u.hash;
}
const ownLinksInHtml = (html: string) =>
  html.replace(/(<a\b[^>]*?\bhref=)(["'])(.*?)\2/gi, (_m, pre: string, q: string, href: string) =>
    `${pre}${q}${ownLink(href.replace(/&amp;/g, '&')).replace(/&/g, '&amp;')}${q}`);

const toImage =(i: any): BlogImage | null => i?.url ? { url: i.url, alt: i.alt ?? '', width: i.width ?? null, height: i.height ?? null } : null;
const toSummary = (p: any): PostSummary => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt ?? '',
  image: toImage(p.featuredImage),
  category: p.category ? { name: p.category.name, slug: p.category.slug, description: p.category.description ?? null } : null,
  author: p.author ? { name: p.author.name, role: p.author.role ?? null, bio: p.author.bio ?? null, image: p.author.image ?? null } : null,
  publishedAt: p.publishedAt,
  updatedAt: p.updatedAt ?? p.publishedAt,
  readingMinutes: p.readingMinutes || 1,
});
const toPost = (p: any): Post => ({
  ...toSummary(p),
  html: ownLinksInHtml(p.contentHtml ?? ''),
  tags: Array.isArray(p.tags) ? p.tags : [],
  faqs: Array.isArray(p.faqs) ? p.faqs.map((f: any) => ({ q: f.question, a: f.answer })) : [],
  faqSchema: !!p.faqSchema,
  cta: p.cta ? { ...p.cta, buttonUrl: ownLink(p.cta.buttonUrl), buttonStyle: p.cta.buttonStyle === 'APP_STORE' ? 'APP_STORE' : 'BUTTON' } : null,
  related: Array.isArray(p.related) ? p.related.map(toSummary) : [],
  seo: p.seo ? {
    title: p.seo.title || p.title, description: p.seo.description || p.excerpt || '',
    canonicalUrl: p.seo.canonicalUrl ?? null, ogImage: p.seo.ogImage ?? null,
    index: p.seo.robots?.index !== false, follow: p.seo.robots?.follow !== false,
  } : null,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ---------- Local Markdown ---------- */
const DIR = path.join(process.cwd(), 'content', 'blog');
const showDrafts = process.env.NODE_ENV !== 'production';
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function readLocal(slug: string): Post | null {
  const file = path.join(DIR, slug + '.md');
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  const tags: string[] = Array.isArray(data.tags) ? data.tags.map(String) : [];
  const date = new Date(String(data.date ?? '1970-01-01').slice(0, 10) + 'T12:00:00Z').toISOString();
  return {
    slug,
    title: String(data.title ?? slug),
    excerpt: String(data.description ?? ''),
    image: data.image ? { url: String(data.image), alt: String(data.imageAlt ?? ''), width: null, height: null } : null,
    category: tags[0] ? { name: tags[0], slug: slugify(tags[0]) } : null,
    author: { name: String(data.author ?? 'Wi-Fi Calling & Texting Team'), role: null, bio: null, image: null },
    publishedAt: date,
    updatedAt: date,
    readingMinutes: Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 220)),
    draft: data.draft === true,
    html: marked.parse(content, { async: false, gfm: true }) as string,
    tags: tags.map((t) => ({ name: t, slug: slugify(t) })),
    faqs: [], faqSchema: false, cta: null, related: [], seo: null,
  };
}
function allLocal(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.md'))
    .map((f) => readLocal(f.replace(/\.md$/, '')))
    .filter((p): p is Post => !!p && (showDrafts || !p.draft))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
const summary = ({ html: _h, tags: _t, faqs: _f, faqSchema: _s, cta: _c, related: _r, seo: _o, ...s }: Post): PostSummary => s; // eslint-disable-line @typescript-eslint/no-unused-vars

/* ---------- Public API used by pages ---------- */

/** One page of published articles, newest first, optionally in one category. */
export async function listPosts({ page = 1, perPage = PER_PAGE, category }: { page?: number; perPage?: number; category?: string } = {}): Promise<PostList> {
  if (blogSource === 'cms') {
    try {
      const q = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (category) q.set('category', category);
      const { status, body } = await cms(`v1/posts?${q}`);
      if (status !== 200 || !Array.isArray(body?.posts)) throw new Error(`HTTP ${status}`);
      return {
        posts: body.posts.map(toSummary),
        page: body.pagination?.page ?? page,
        totalPages: body.pagination?.totalPages ?? 1,
        total: body.pagination?.total ?? body.posts.length,
        categories: Array.isArray(body.categories) ? body.categories : [],
      };
    } catch (e) {
      console.error('[blog] list failed:', (e as Error).message);
      return { posts: [], page, totalPages: 0, total: 0, categories: [] };
    }
  }
  const all = allLocal();
  const cats = new Map<string, BlogCategory>();
  all.forEach((p) => p.category && cats.set(p.category.slug, p.category));
  const filtered = category ? all.filter((p) => p.category?.slug === category) : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  return {
    posts: filtered.slice((page - 1) * perPage, page * perPage).map(summary),
    page, totalPages, total: filtered.length, categories: [...cats.values()],
  };
}

/** One article, or a redirect when its slug moved, or null. */
export async function getPost(slug: string): Promise<PostLookup> {
  if (!isSlug(slug)) return null;
  if (blogSource === 'cms') {
    try {
      const { status, body } = await cms(`v1/posts/${slug}`);
      if (status === 200 && body?.post) return { post: toPost(body.post) };
      if (body?.redirect?.destination) return { redirect: body.redirect.destination, permanent: body.redirect.permanent !== false };
      return null;
    } catch (e) {
      console.error(`[blog] post "${slug}" failed:`, (e as Error).message);
      return null;
    }
  }
  const p = readLocal(slug);
  if (!p || (!showDrafts && p.draft)) return null;
  p.related = allLocal().filter((x) => x.slug !== slug).slice(0, 3).map(summary);
  return { post: p };
}

/** An article by preview token (drafts and scheduled too, with unsaved autosave applied). Never cached. */
export async function getPreview(token: string): Promise<{ post: Post; status: string } | null> {
  if (blogSource !== 'cms' || !/^[A-Za-z0-9._~-]{8,2048}$/.test(token)) return null;
  try {
    const { status, body } = await cms(`v1/preview/${encodeURIComponent(token)}`, { fresh: true });
    return status === 200 && body?.post ? { post: toPost(body.post), status: String(body.status ?? '') } : null;
  } catch (e) {
    console.error('[blog] preview failed:', (e as Error).message);
    return null;
  }
}

/** Every published article (slug + last change), for the sitemap, RSS and prebuilt pages. */
export async function allPostSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  if (blogSource === 'cms') {
    try {
      const { status, body } = await cms<{ posts: { path: string; updatedAt: string }[] }>('v1/sitemap');
      if (status !== 200 || !Array.isArray(body?.posts)) throw new Error(`HTTP ${status}`);
      return body.posts
        .map((p) => ({ slug: p.path.replace(/^\/?blog\//, '').replace(/\/+$/, ''), updatedAt: p.updatedAt }))
        .filter((p) => isSlug(p.slug));
    } catch (e) {
      console.error('[blog] sitemap failed:', (e as Error).message);
      return [];
    }
  }
  return allLocal().map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
