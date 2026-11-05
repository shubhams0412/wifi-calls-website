import Link from 'next/link';
import { buildMenu } from '@/site/menu';
import { APP_STORE_URL, webApp } from '@/site/config';

/** Footer with link groups for every section of the site. */
export default function SiteFooter() {
  const m = buildMenu();
  const features = m.features.flatMap((g) => g.links).slice(0, 7);
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-top x-foot">
          <div className="foot-brand">
            <div className="fb-head">
              <span className="appicon" role="img" aria-label="App icon" />
              <span className="fb-name">Wi-Fi Calling &amp; Texting</span>
            </div>
            <p>A private second phone number with free app-to-app calling and texting over any Wi-Fi or data connection.</p>
            <div className="foot-cta">
              <a className="btn btn-light sm" href={APP_STORE_URL} target="_blank" rel="noopener">Download on iOS</a>
              <Link className="btn btn-ghost-light sm" href={webApp()}>Web app</Link>
            </div>
          </div>
          <div className="foot-col">
            <h4>Features</h4>
            {features.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
            <Link href="/features">All features</Link>
          </div>
          <div className="foot-col">
            <h4>Use cases</h4>
            {m.useCases.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </div>
          <div className="foot-col">
            <h4>Countries</h4>
            {m.numbers.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
            {m.calling.slice(0, 4).map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
            <Link href="/international-calling">International calling</Link>
          </div>
          <div className="foot-col">
            <h4>Company</h4>
            <Link href="/plans">Plans</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact us</Link>
            <Link href="/download">Download</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <div>© {new Date().getFullYear()} Wi-Fi Calling &amp; Texting. All rights reserved.</div>
          <div><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/contact">Contact</Link> · <a href="/blog/rss.xml">RSS</a></div>
        </div>
      </div>
    </footer>
  );
}
