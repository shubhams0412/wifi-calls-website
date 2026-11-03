'use client';

/* Small shared pieces for settings screens. */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, IconName } from '../icons';
import { isPro, useData } from '../store';
import { openPaywall } from '../ui';
import { Toggle } from '../components/ui';

export const tint = (c: string) => ({ ['--c' as string]: c.startsWith('#') || c.startsWith('var') ? c : `var(--${c})` });

export function ProPill() {
  const pro = isPro(useData());
  if (pro) return null;
  return <> <span className="pro-pill" style={{ fontSize: 9, padding: '3px 8px' }}><Icon name="lock" /> PRO</span></>;
}

export function SectionHead({ icon, children, style }: { icon: IconName; children: ReactNode; style?: React.CSSProperties }) {
  return <div className="card-h" style={{ padding: '0 4px', color: 'var(--text-2)', ...style }}><span style={{ color: 'var(--primary)' }}><Icon name={icon} /></span> {children}</div>;
}

export function ToggleTile({ icon, color, title, sub, on, onChange, pro }: { icon: IconName; color: string; title: string; sub: string; on: boolean; onChange: (v: boolean) => void; pro?: boolean }) {
  const locked = !!pro && !isPro(useData());
  return (
    <div className="card pad row-lite tile" onClick={locked ? openPaywall : undefined} role={locked ? 'button' : undefined} style={locked ? { cursor: 'pointer' } : undefined}>
      <span className="tile-ic lg" style={tint(color)}><Icon name={icon} /></span>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{title}{pro && <ProPill />}</div><div className="tiny muted" style={{ fontSize: 13 }}>{sub}</div></div>
      {!locked && <Toggle checked={on} onChange={onChange} label={title} />}
    </div>
  );
}

export function LinkTile({ href, onClick, icon, color, title, sub, pro, danger }: { href?: string; onClick?: () => void; icon: IconName; color: string; title: string; sub: string; pro?: boolean; danger?: boolean }) {
  const locked = !!pro && !isPro(useData());
  const inner = (
    <>
      <span className="tile-ic lg" style={tint(color)}><Icon name={icon} /></span>
      <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontWeight: 600, color: danger ? 'var(--danger)' : undefined }}>{title}{pro && <ProPill />}</div><div className="tiny muted" style={{ fontSize: 13 }}>{sub}</div></div>
      <span className="circle-ic s32" style={danger ? tint('danger') : { background: 'var(--accent-soft)' }}><Icon name={danger ? 'alert' : 'arrowR'} /></span>
    </>
  );
  const cls = 'card pad row-lite tile' + (danger ? ' danger-tile' : '');
  if (locked) return <button className={cls} onClick={openPaywall}>{inner}</button>;
  if (href) return <Link className={cls} href={'/app/' + href}>{inner}</Link>;
  return <button className={cls} onClick={onClick}>{inner}</button>;
}
