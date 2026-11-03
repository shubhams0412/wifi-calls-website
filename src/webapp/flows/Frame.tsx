'use client';

/* One frame for the whole pre-dashboard journey.
   Desktop: brand panel (logo, step illustration, journey, trust line) + form column.
   Phones: top bar with back + segmented progress, optional illustration card, sticky actions. */
import { useEffect, type ReactNode } from 'react';
import { Icon } from '../icons';
import { cx } from '../format';
import { useFlow } from './flowState';

export const JOURNEY = ['Discover', 'Choose plan', 'Your account', 'Get set up'] as const;

function Progress({ stage, frac }: { stage: number; frac: number }) {
  return (
    <div className="fx-progress" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={stage + frac}
      aria-label={`Step ${stage + 1} of 4: ${JOURNEY[stage]}`}>
      {JOURNEY.map((label, i) => (
        <div className="pseg" key={label}>
          <span className="track"><span className="fill" style={{ width: `${i < stage ? 100 : i === stage ? Math.max(8, frac * 100) : 0}%` }} /></span>
          <span className={cx('lbl', i === stage && 'on', i < stage && 'done')}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function Frame({ stage, frac, stepKey, art, artKey, mobileArt, onBack, topRight, children, actions, wide }: {
  stage: number; frac: number; stepKey: string; art: ReactNode; artKey: string; mobileArt?: boolean;
  onBack?: () => void; topRight?: ReactNode; children: ReactNode; actions?: ReactNode; wide?: boolean;
}) {
  const dir = useFlow((s) => s.dir);
  // Every new step starts at the top (sub-steps within a stage would otherwise keep the old scroll).
  useEffect(() => { document.querySelector('.flow-scroll')?.scrollTo(0, 0); }, [stepKey]);
  return (
    <div className="fx">
      <aside className="fx-brand" aria-hidden="true">
        <div className="fx-glow"><i /><i /></div>
        <div className="fx-logo"><span className="app-icon" /> Wi-Fi Calling &amp; Texting</div>
        <div className="fx-art" key={artKey}>{art}</div>
        <ol className="fx-journey">
          {JOURNEY.map((label, i) => (
            <li key={label} className={cx(i < stage && 'done', i === stage && 'on')}>
              <span className="jdot">{i < stage ? <Icon name="check" /> : i + 1}</span>{label}
            </li>
          ))}
        </ol>
        <div className="fx-trust"><span className="stars">★★★★★</span> 4.9 · Trusted by 1M+ people</div>
      </aside>

      <main className="fx-main">
        <header className="fx-top">
          {onBack ? <button className="fx-back" onClick={onBack} aria-label="Back"><Icon name="arrowL" /></button> : <span className="fx-back-sp" />}
          <Progress stage={stage} frac={frac} />
          <div className="fx-right">{topRight}</div>
        </header>
        <div className={cx('fx-body', wide && 'wide')}>
          <div key={stepKey} className={cx('fx-step', dir > 0 ? 'in-fwd' : 'in-back')}>
            {mobileArt && <div className="fx-art-m" key={artKey}>{art}</div>}
            {children}
            {actions && <div className="fx-actions">{actions}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Heading block used by every step. */
export function StepHead({ eyebrow, title, sub }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="fx-head">
      {eyebrow && <div className="fx-eyebrow">{eyebrow}</div>}
      <h1 className="fx-title">{title}</h1>
      {sub && <p className="fx-sub">{sub}</p>}
    </div>
  );
}
