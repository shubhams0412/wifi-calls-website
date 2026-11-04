import type { MetadataRoute } from 'next';
import { abs } from '@/site/config';

export default function robots(): MetadataRoute.Robots {
  // The web app (/app) is an interactive tool, not content — keep it out of search results.
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/app', '/api'] }], sitemap: abs('/sitemap.xml') };
}
