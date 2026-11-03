'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SUN = <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>;
const MOON = <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;
const STORE = 'https://apps.apple.com/app/id6781677176';

type Active = 'privacy' | 'terms' | undefined;

function Links({ active, legal }: { active: Active; legal: boolean }) {
  const cls = (k: Active) => (active === k ? 'active' : undefined);
  return (
    <>
      <Link href="/#features">Features</Link>
      <Link href="/#how">How it works</Link>
      {legal && <Link href="/privacy" className={cls('privacy')} aria-current={active === 'privacy' ? 'page' : undefined}>Privacy</Link>}
      {legal && <Link href="/terms" className={cls('terms')} aria-current={active === 'terms' ? 'page' : undefined}>Terms</Link>}
      <Link href="/app">Web app</Link>
      <Link href="/#contact">Contact</Link>
    </>
  );
}

/** Sticky top bar: brand, links, theme toggle, App Store button and the mobile menu. */
export default function SiteNav({ active }: { active?: Active }) {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const legal = !!active;

  useEffect(() => { setDark(document.documentElement.getAttribute('data-theme') === 'dark'); }, []);

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('wificalls-theme', next); } catch { /* storage unavailable */ }
    setDark(!dark);
  };

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link className="brand" href="/" aria-label="Wi-Fi Calling and Texting home">
          <span className="appicon" role="img" aria-label="App icon" />
          <span className="name">Wi-Fi Calling &amp; Texting</span>
        </Link>
        <nav className="nav-links" aria-label="Primary"><Links active={active} legal={legal} /></nav>
        <div className="nav-right">
          <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle light or dark theme" title="Toggle theme">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{dark ? SUN : MOON}</svg>
          </button>
          <a className="btn btn-primary nav-cta" href={STORE} target="_blank" rel="noopener">Get the app</a>
          <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobileMenu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      <nav className={'mobile-menu' + (open ? ' open' : '')} id="mobileMenu" aria-label="Mobile navigation" onClick={() => setOpen(false)}>
        <Links active={active} legal={legal} />
      </nav>
    </header>
  );
}
