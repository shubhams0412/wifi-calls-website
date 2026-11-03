import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <div className="fb-head">
              <span className="appicon" role="img" aria-label="App icon" />
              <span className="fb-name">Wi-Fi Calling &amp; Texting</span>
            </div>
            <p>A private phone number with free app-to-app calling and texting over any Wi-Fi or data connection.</p>
          </div>
          <div className="foot-col">
            <h4>Product</h4>
            <Link href="/#features">Features</Link>
            <Link href="/#how">How it works</Link>
            <a href="https://apps.apple.com/app/id6781677176" target="_blank" rel="noopener">Download on iOS</a>
            <Link href="/app">Use on the web</Link>
          </div>
          <div className="foot-col">
            <h4>Legal &amp; Support</h4>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
            <Link href="/#contact">Contact Us</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <div>© {new Date().getFullYear()}. All rights reserved.</div>
          <div><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/#contact">Contact</Link></div>
        </div>
      </div>
    </footer>
  );
}
