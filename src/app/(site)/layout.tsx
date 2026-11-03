import '@/styles/site.css';

/** Marketing + legal pages. All site styles are scoped under .site-root. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className="site-root">{children}</div>;
}
