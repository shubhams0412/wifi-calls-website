import type { Metadata } from 'next';
import SiteNav from '@/components/site/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';
import { buildMenu } from '@/site/menu';
import { BRAND, SITE_URL } from '@/site/config';
import '@/styles/site.css';
import '@/styles/site-x.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} — Free Calls, Texts & a Private Number`, template: `%s | ${BRAND}` },
  openGraph: { siteName: BRAND, type: 'website' },
  twitter: { card: 'summary_large_image' },
  alternates: { types: { 'application/rss+xml': '/blog/rss.xml' } },
};

/** Marketing website: shared nav + footer. All site styles are scoped under .site-root. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-root">
      <SiteNav menu={buildMenu()} />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
