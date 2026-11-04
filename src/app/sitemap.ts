import type { MetadataRoute } from 'next';
import { abs } from '@/site/config';
import { allPostSlugs } from '@/site/blog';
import { FEATURES } from '@/site/content/features';
import { USE_CASES } from '@/site/content/useCases';
import { CALL_COUNTRIES, NUMBER_COUNTRIES } from '@/site/content/countries';

/** Every public page; new content records and blog posts are included automatically. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await allPostSlugs();
  const now = new Date();
  const page = (path: string, priority = 0.7): MetadataRoute.Sitemap[number] => ({ url: abs(path), lastModified: now, priority });
  return [
    page('/', 1), page('/features', 0.9), page('/plans', 0.9), page('/numbers', 0.8), page('/international-calling', 0.8),
    page('/use-cases', 0.7), page('/blog', 0.7), page('/faq', 0.6), page('/contact', 0.5), page('/download', 0.6),
    page('/privacy', 0.3), page('/terms', 0.3),
    ...FEATURES.map((f) => page(`/features/${f.slug}`, 0.8)),
    ...USE_CASES.map((u) => page(`/use-cases/${u.slug}`, 0.7)),
    ...NUMBER_COUNTRIES.map((c) => page(`/numbers/${c.slug}`, 0.8)),
    ...CALL_COUNTRIES.map((c) => page(`/international-calling/${c.slug}`, 0.7)),
    ...posts.map((p) => ({ url: abs(`/blog/${p.slug}`), lastModified: new Date(p.updatedAt), priority: 0.6 })),
  ];
}
