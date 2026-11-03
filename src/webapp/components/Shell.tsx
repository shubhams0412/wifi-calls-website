'use client';

/* Main app chrome: sidebar (desktop) / bottom tab bar (phones) + the routed tab content.
   Tabs render <SplitView/> (list + detail) or <FullPane/>. */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Icon, IconName } from '../icons';
import { cx, fmtPhone } from '../format';
import { displayName, unreadTotal, useData } from '../store';
import { closeAllSheets, setNavigate } from '../ui';
import { stopPlayer } from '../player';
import { Avatar } from './ui';

const TABS: { id: string; label: string; icon: IconName }[] = [
  { id: 'calls', label: 'Calls', icon: 'phone' },
  { id: 'messages', label: 'Messages', icon: 'messages' },
  { id: 'dial', label: 'Dial', icon: 'grid' },
  { id: 'contacts', label: 'Contacts', icon: 'user' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.getAttribute('data-theme') === 'dark'); }, []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try { localStorage.setItem('wificalls-theme', next ? 'dark' : 'light'); } catch { /* storage unavailable */ }
    setDark(next);
  };
  return [dark, toggle];
}

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const d = useData();
  const [dark, toggleDark] = useDarkMode();
  const tab = pathname.split('/')[2] || 'dial';
  const unread = unreadTotal(d);
  const name = displayName(d);

  useEffect(() => { setNavigate((href) => router.push(href)); }, [router]);
  // Navigating anywhere dismisses open sheets and stops playback (like the app's pop behaviour).
  useEffect(() => { closeAllSheets(); stopPlayer(); }, [pathname]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/" title="Back to website"><span className="app-icon" /><span>Wi-Fi Calling</span></Link>
        {TABS.map((t) => (
          <Link key={t.id} href={'/app/' + t.id} className={cx('navitem', t.id === tab && 'active')} title={t.label}>
            <Icon name={t.icon} /><span className="lbl">{t.label}</span>
            {t.id === 'messages' && unread > 0 && <span className="badge">{unread}</span>}
          </Link>
        ))}
        <div className="spacer" />
        <button className="navitem" onClick={toggleDark} title="Toggle theme">
          <Icon name={dark ? 'sun' : 'moon'} /><span className="lbl">{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <Link className="me" href="/app/settings/account">
          <Avatar name={name} size={40} />
          <div className="meta" style={{ minWidth: 0, textAlign: 'left' }}>
            <div className="t">{name}</div>
            <div className="s">{d.number ? fmtPhone(d.number) : 'No number yet'}</div>
          </div>
        </Link>
      </aside>
      <div className="main" id="main">{children}</div>
      <nav className="tabbar">
        {TABS.map((t) => (
          <Link key={t.id} href={'/app/' + t.id} className={cx(t.id === tab && 'active')}>
            <Icon name={t.icon} />{t.label}
            {t.id === 'messages' && unread > 0 && <span className="badge">{unread}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** List pane + detail pane. On phones only one shows: the detail when `open`. */
export function SplitView({ list, detail, open }: { list: ReactNode; detail: ReactNode; open: boolean }) {
  return (
    <div className="split" data-detail={open ? 'open' : 'closed'} style={{ display: 'contents' }}>
      <section className="pane-list">{list}</section>
      <section className="pane-detail">{detail}</section>
      <DetailFlag open={open} />
    </div>
  );
}
/** The phone layout keys off .main[data-detail]; keep it in sync with the current tab. */
function DetailFlag({ open }: { open: boolean }) {
  useEffect(() => { document.getElementById('main')?.setAttribute('data-detail', open ? 'open' : 'closed'); }, [open]);
  return null;
}

export function FullPane({ children }: { children: ReactNode }) {
  return <div className="pane-full"><DetailFlag open={false} />{children}</div>;
}
