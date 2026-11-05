'use client';

/* Sticky top bar with mega-menus (Features, Use cases, Countries), theme toggle and CTAs.
   Desktop: dropdowns open on hover/focus/click. Phones: one collapsible menu with sections. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import type { Menu, MenuLink } from '@/site/menu';

const SUN = <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>;
const MOON = <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;
type Panel = 'features' | 'use-cases' | 'countries' | null;

function Item({ l, onPick }: { l: MenuLink; onPick: () => void }) {
  return (
    <Link href={l.href} className="mm-item" onClick={onPick}>
      {l.flag ? <span className="mm-flag" aria-hidden="true">{l.flag}</span> : l.icon && <span className="mm-ic" aria-hidden="true"><Icon name={l.icon} /></span>}
      <span className="mm-txt"><b>{l.label}{l.pro && <em className="pro-tag">Pro</em>}</b>{l.sub && <span>{l.sub}</span>}</span>
    </Link>
  );
}

export default function SiteNav({ menu }: { menu: Menu }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);          // phone menu
  const [panel, setPanel] = useState<Panel>(null);   // desktop dropdown
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setDark(document.documentElement.getAttribute('data-theme') === 'dark'); }, []);
  useEffect(() => { setOpen(false); setPanel(null); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPanel(null); setOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('wificalls-theme', next); } catch { /* storage unavailable */ }
    setDark(!dark);
  };
  const enter = (p: Panel) => { if (closeTimer.current) clearTimeout(closeTimer.current); setPanel(p); };
  const leave = () => { closeTimer.current = setTimeout(() => setPanel(null), 140); };
  const pick = () => { setPanel(null); setOpen(false); };
  const isActive = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + '/');

  const featuresPanel = (
    <div className="mm-cols features">
      {menu.features.map((g) => (
        <div className="mm-col" key={g.title}>
          <div className="mm-h">{g.title}</div>
          {g.links.map((l) => <Item l={l} key={l.href} onPick={pick} />)}
        </div>
      ))}
      <Link href="/features" className="mm-all" onClick={pick}>See all features <Icon name="arrowR" /></Link>
    </div>
  );
  const useCasesPanel = (
    <div className="mm-cols use-cases">
      <div className="mm-col wide">
        <div className="mm-h">Who it&apos;s for</div>
        <div className="mm-grid2">{menu.useCases.map((l) => <Item l={l} key={l.href} onPick={pick} />)}</div>
      </div>
      <Link href="/use-cases" className="mm-all" onClick={pick}>All use cases <Icon name="arrowR" /></Link>
    </div>
  );
  const countriesPanel = (
    <div className="mm-cols countries">
      <div className="mm-col">
        <div className="mm-h">Get a number</div>
        {menu.numbers.map((l) => <Item l={l} key={l.href} onPick={pick} />)}
        <Link href="/numbers" className="mm-more" onClick={pick}>All numbers <Icon name="arrowR" /></Link>
      </div>
      <div className="mm-col wide">
        <div className="mm-h">Call abroad</div>
        <div className="mm-grid2">{menu.calling.map((l) => <Item l={l} key={l.href} onPick={pick} />)}</div>
        <Link href="/international-calling" className="mm-more" onClick={pick}>All countries <Icon name="arrowR" /></Link>
      </div>
    </div>
  );

  // A plain function (not a component) so React keeps the same DOM nodes — focus is not lost on re-render.
  const drop = (id: Exclude<Panel, null>, label: string, href: string, children: React.ReactNode) => (
    <div key={id} className={'nav-drop' + (panel === id ? ' open' : '')} onMouseEnter={() => enter(id)} onMouseLeave={leave}>
      <button className={'nav-drop-btn' + (isActive(href) ? ' active' : '')} aria-expanded={panel === id} aria-haspopup="true"
        onClick={() => setPanel(panel === id ? null : id)} onFocus={() => enter(id)}>
        {label} <Icon name="chevD" />
      </button>
      <div className="mega" role="menu" onMouseEnter={() => enter(id)} onMouseLeave={leave}>{children}</div>
    </div>
  );

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link className="brand" href="/" aria-label="Wi-Fi Calling and Texting home">
          <span className="appicon" role="img" aria-label="App icon" />
          <span className="name">Wi-Fi Calling &amp; Texting</span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {drop('features', 'Features', '/features', featuresPanel)}
          {drop('use-cases', 'Use cases', '/use-cases', useCasesPanel)}
          {drop('countries', 'Countries', '/numbers', countriesPanel)}
          <Link href="/plans" className={isActive('/plans') ? 'active' : undefined}>Plans</Link>
          <Link href="/blog" className={isActive('/blog') ? 'active' : undefined}>Blog</Link>
        </nav>
        <div className="nav-right">
          <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle light or dark theme" title="Toggle theme">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{dark ? SUN : MOON}</svg>
          </button>
          <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobileMenu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      <nav className={'mobile-menu' + (open ? ' open' : '')} id="mobileMenu" aria-label="Mobile navigation">
        <details><summary>Features <Icon name="chevD" /></summary>{menu.features.flatMap((g) => g.links).map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}<Link href="/features">All features</Link></details>
        <details><summary>Use cases <Icon name="chevD" /></summary>{menu.useCases.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}</details>
        <details><summary>Countries <Icon name="chevD" /></summary>{menu.numbers.map((l) => <Link key={l.href} href={l.href}>{l.flag} {l.label}</Link>)}<Link href="/international-calling">International calling</Link></details>
        <Link href="/plans">Plans</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
}
