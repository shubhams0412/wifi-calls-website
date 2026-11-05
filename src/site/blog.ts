/* Blog data: a static snapshot of the 10 published articles in content/blog/posts.json, with their
   images in public/blog/. Nothing is fetched at runtime, so every blog page is built once at deploy.
   To add or change an article, edit posts.json (same shape as the old CMS API) and redeploy. */
import data from '../../content/blog/posts.json';

export const PER_PAGE = 12;

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

/* eslint-disable @typescript-eslint/no-explicit-any */
const toImage = (i: any): BlogImage | null => i?.url ? { url: i.url, alt: i.alt ?? '', width: i.width ?? null, height: i.height ?? null } : null;
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
  html: p.contentHtml ?? '',
  tags: Array.isArray(p.tags) ? p.tags : [],
  faqs: Array.isArray(p.faqs) ? p.faqs.map((f: any) => ({ q: f.question, a: f.answer })) : [],
  faqSchema: !!p.faqSchema,
  cta: p.cta ? { ...p.cta, buttonStyle: p.cta.buttonStyle === 'APP_STORE' ? 'APP_STORE' : 'BUTTON' } : null,
  related: Array.isArray(p.related) ? p.related.map(toSummary) : [],
  seo: p.seo ? {
    title: p.seo.title || p.title, description: p.seo.description || p.excerpt || '',
    canonicalUrl: p.seo.canonicalUrl ?? null, ogImage: p.seo.ogImage ?? null,
    index: p.seo.robots?.index !== false, follow: p.seo.robots?.follow !== false,
  } : null,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const POSTS: Post[] = (data.posts as unknown[]).map(toPost).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
const CATEGORIES: BlogCategory[] = (data.categories as BlogCategory[]).filter((c) => POSTS.some((p) => p.category?.slug === c.slug));
const summary = ({ html: _h, tags: _t, faqs: _f, faqSchema: _s, cta: _c, related: _r, seo: _o, ...s }: Post): PostSummary => s; // eslint-disable-line @typescript-eslint/no-unused-vars

/* ---------- Public API used by pages ---------- */

/** One page of articles, newest first, optionally in one category. */
export async function listPosts({ page = 1, perPage = PER_PAGE, category }: { page?: number; perPage?: number; category?: string } = {}): Promise<PostList> {
  const filtered = category ? POSTS.filter((p) => p.category?.slug === category) : POSTS;
  return {
    posts: filtered.slice((page - 1) * perPage, page * perPage).map(summary),
    page,
    totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
    total: filtered.length,
    categories: CATEGORIES,
  };
}

/** The categories that have articles, for the category pages. */
export async function allCategories(): Promise<BlogCategory[]> { return CATEGORIES; }

/** One article, or null. */
export async function getPost(slug: string): Promise<PostLookup> {
  const post = isSlug(slug) ? POSTS.find((p) => p.slug === slug) : undefined;
  return post ? { post } : null;
}

/** Every article (slug + last change), for the sitemap and the prebuilt pages. */
export async function allPostSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  return POSTS.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
