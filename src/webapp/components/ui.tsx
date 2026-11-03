'use client';

/* Shared building blocks — markup and class names match the app's DesignSystem port (wa-*.css). */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { Icon, IconName } from '../icons';
import { cx, initial, mmss } from '../format';
import { closeSheet } from '../ui';
import { scrubTo, togglePlay, usePlayer } from '../player';

/** Gradient circle with the first letter, a person glyph, or a group glyph. */
export function Avatar({ name, size = 48, group, icon, solid, style }: { name?: string; size?: number; group?: boolean; icon?: IconName; solid?: boolean; style?: CSSProperties }) {
  const i = group ? '' : initial(name);
  return (
    <span className={cx('avatar', 's' + size, solid && 'solid')} style={{ ['--s' as string]: size + 'px', ...style }} aria-hidden="true">
      {group ? <Icon name="group" /> : icon ? <Icon name={icon} /> : i || <Icon name="user" />}
    </span>
  );
}

/** EmptyState: optional icon bubble, message, subtitle and extra content. */
export function Empty({ icon, title, sub, bare, children }: { icon?: IconName; title: string; sub?: string; bare?: boolean; children?: ReactNode }) {
  return (
    <div className="empty">
      {icon && (bare ? <div className="bare"><Icon name={icon} /></div> : <div className="bubble"><Icon name={icon} /></div>)}
      <div className={cx('m', bare && 'light')}>{title}</div>
      {sub && <div className="sub">{sub}</div>}
      {children}
    </div>
  );
}

/** Detail-pane placeholder shown on desktop when nothing is selected. */
export function Placeholder({ icon, title, sub, children }: { icon: IconName; title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="placeholder">
      <div>
        <div className="big"><Icon name={icon} /></div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="toggle" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span />
    </label>
  );
}

/** Detail-pane header. `back` is an /app-relative path; on desktop the back button is hidden for root details. */
export function TopBar({ title, back, rootBack, center, right }: { title: string; back?: string | false; rootBack?: boolean; center?: boolean; right?: ReactNode }) {
  const router = useRouter();
  return (
    <div className={cx('topbar', rootBack && 'desktop-hide-back')}>
      {back !== false && (
        back
          ? <Link className="back" href={'/app/' + back} aria-label="Back"><Icon name="chevL" /></Link>
          : <button className="back" onClick={() => router.back()} aria-label="Back"><Icon name="chevL" /></button>
      )}
      <div className={cx('title', center && 'center')}>{title}</div>
      {right}
    </div>
  );
}

/** Segmented control. Items are links (route-based) or buttons. */
export function Seg<T extends string>({ items, value, onChange, hrefs, className, style }: {
  items: { value: T; label: ReactNode }[]; value: T; onChange?: (v: T) => void; hrefs?: Record<T, string>; className?: string; style?: CSSProperties;
}) {
  return (
    <div className={cx('seg', className)} style={style} role="tablist">
      {items.map((it) =>
        hrefs ? (
          <Link key={it.value} href={'/app/' + hrefs[it.value]} className={cx(it.value === value && 'on')} role="tab" aria-selected={it.value === value}>{it.label}</Link>
        ) : (
          <button key={it.value} className={cx(it.value === value && 'on')} onClick={() => onChange?.(it.value)} role="tab" aria-selected={it.value === value}>{it.label}</button>
        ),
      )}
    </div>
  );
}

export function SheetHead({ title, sub, right, onClose = closeSheet }: { title: string; sub?: string; right?: ReactNode; onClose?: () => void }) {
  return (
    <div className="sheet-head">
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3>{title}</h3>
        {sub && <div className="tiny muted">{sub}</div>}
      </div>
      {right}
      <button className="icon-btn plain" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
    </div>
  );
}

export const Spinner = ({ white }: { white?: boolean }) => <span className={cx('spinner', white && 'white')} />;

export function ShimmerRows({ n, avatars }: { n: number; avatars?: boolean }) {
  return (
    <div className="list">
      {Array.from({ length: n }, (_, i) => (
        <div className="row" style={{ boxShadow: 'none' }} key={i}>
          {avatars && <span className="shimmer" style={{ width: 44, height: 44, borderRadius: '50%' }} />}
          <div className="body">
            <div className="shimmer" style={{ height: 13, width: `${40 + ((i * 17) % 40)}%` }} />
            <div className="shimmer" style={{ height: 10, width: '30%', marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- player UI ---------------- */
export function PlayButton({ id, dur, solid }: { id: string; dur: number; solid?: boolean }) {
  const playing = usePlayer((p) => p.id === id && p.playing);
  return (
    <button className={cx('play-btn', solid && 'solid')} onClick={(e) => { e.stopPropagation(); togglePlay(id, dur); }} aria-label={playing ? 'Pause' : 'Play'}>
      <Icon name={playing ? 'pause' : 'play'} />
    </button>
  );
}

/** Scrub bar + equalizer + elapsed/total. Click or drag to seek. */
export function ScrubBar({ id, dur }: { id: string; dur: number }) {
  const mine = usePlayer((p) => p.id === id);
  const t = usePlayer((p) => (p.id === id ? p.t : 0));
  const pct = mine && dur ? (t / dur) * 100 : 0;
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    if (usePlayer.getState().id !== id) togglePlay(id, dur);
    const move = (ev: PointerEvent | React.PointerEvent) => { const r = bar.getBoundingClientRect(); scrubTo((ev.clientX - r.left) / r.width); };
    move(e);
    const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  return (
    <>
      <div className="player-row">
        <div className="scrub" onPointerDown={onDown} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={dur} aria-valuenow={Math.round(t)}>
          <span className="scrub-track"><span className="scrub-fill" style={{ width: pct + '%' }} /></span>
          <span className="scrub-thumb" style={{ left: pct + '%' }} />
        </div>
        <span className="eq"><i /><i /><i /></span>
      </div>
      <div className="p-times"><span className="p-cur">{mmss(t)}</span><span>{mmss(dur)}</span></div>
    </>
  );
}

/** Wraps a playable card: adds .open/.playing classes used by the CSS. */
export function PlayerCard({ id, className, children, onClick }: { id: string; className?: string; children: ReactNode; onClick?: () => void }) {
  const open = usePlayer((p) => p.id === id);
  const playing = usePlayer((p) => p.id === id && p.playing);
  return <div className={cx(className, open && 'open', playing && 'playing')} data-player={id} onClick={onClick}>{children}</div>;
}
