'use client';

/* Brand-panel illustrations: small mock-ups of real app UI (call card, chat, number card…),
   drawn in HTML/CSS so they stay crisp and can animate. Designed for the dark brand panel. */
import { Icon } from '../icons';
import { cx, fmtTyping, initial } from '../format';
import { country, useData } from '../store';
import { FeatureList } from './Paywall';
import { useFlow } from './flowState';

const Chip = ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={cx('art-chip', className)}>{children}</span>;

export function ArtCall() {
  return (
    <div className="art art-call">
      <div className="glass call-card">
        <div className="cc-top"><span className="live" /> Wi-Fi call · <b>02:14</b></div>
        <div className="cc-who"><span className="av">A</span><div><div className="nm">Ava Johnson</div><div className="sb">+1 (415) 555-0101</div></div></div>
        <div className="wave">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 8) * 0.09}s` }} />)}</div>
        <div className="cc-btns"><span><Icon name="mic" /></span><span><Icon name="speakerWave" /></span><span className="end"><Icon name="phoneDown" /></span></div>
      </div>
      <Chip className="c1"><Icon name="wifi" /> HD voice</Chip>
      <Chip className="c2"><Icon name="checkCircle" /> Free · app-to-app</Chip>
    </div>
  );
}

export function ArtChat() {
  return (
    <div className="art art-chat">
      <div className="glass chat-card">
        <div className="ch-head"><span className="av">D</span><b>Daniel Smith</b><span className="on">online</span></div>
        <div className="b in">Did you get the new number? 😄</div>
        <div className="b out">Yes! Texting you from it now</div>
        <div className="b in">Works perfectly 🙌</div>
        <div className="b in typing"><i /><i /><i /></div>
      </div>
      <Chip className="c1"><Icon name="image" /> Photos &amp; voice notes</Chip>
      <Chip className="c2"><Icon name="message" /> SMS to any number</Chip>
    </div>
  );
}

export function ArtNumber({ phone, label = 'PERSONAL · ACTIVE' }: { phone?: string; label?: string }) {
  return (
    <div className="art art-number">
      <div className="num-card">
        <div className="nc-top"><span className="flag">🇺🇸</span><span className="seal"><Icon name="seal" /></span></div>
        <div className="nc-num">{phone || '+1 (212) 555-0199'}</div>
        <div className="nc-tag">{label}</div>
      </div>
      <Chip className="c1"><Icon name="phone" /> Voice</Chip>
      <Chip className="c2"><Icon name="message" /> SMS</Chip>
    </div>
  );
}

export function ArtSecure() {
  return (
    <div className="art art-secure">
      <div className="rings"><i /><i /><i /></div>
      <div className="lock-core"><Icon name="lock" /></div>
      <Chip className="c1"><Icon name="shieldCheck" /> End-to-end encrypted</Chip>
      <Chip className="c2"><Icon name="nosign" /> Contacts never sold</Chip>
    </div>
  );
}

export function ArtCrown() {
  return (
    <div className="art art-crown">
      <div className="glass pro-card">
        <div className="pc-top"><span className="crown"><Icon name="crown" /></span><b>Pro</b><span className="pill">3 days free</span></div>
        {['Second phone number', 'Unlimited app calls', 'Call recording', 'Voicemail & forwarding'].map((t) => (
          <div className="pc-row" key={t}><Icon name="check" /> {t}</div>
        ))}
      </div>
    </div>
  );
}

export function ArtTimeline() {
  const steps: [string, string, boolean][] = [['Today', 'Full access unlocked', true], ['Day 2', 'Reminder before it ends', false], ['Day 3', 'Trial ends', false]];
  return (
    <div className="art art-timeline">
      <div className="glass tl-card">
        {steps.map(([d, t, on]) => (
          <div className={cx('tl-row', on && 'on')} key={d}><span className="dot" /><div><b>{d}</b><span>{t}</span></div></div>
        ))}
      </div>
    </div>
  );
}

export function ArtReminder() {
  return (
    <div className="art art-reminder">
      <div className="glass notif">
        <span className="ni"><span className="app-icon" /></span>
        <div><div className="nt"><b>Wi-Fi Calling</b><span>now</span></div><div className="nb">Your free trial ends tomorrow. Keep Pro or cancel anytime.</div></div>
      </div>
      <div className="glass notif back"><span className="ni" /><div><div className="nb">&nbsp;</div></div></div>
    </div>
  );
}

export function ArtFeatures() {
  return (
    <div className="art art-features">
      <div className="glass feat-card-dark">
        <div className="fh"><Icon name="checklist" /> What&apos;s included</div>
        <FeatureList pro />
      </div>
    </div>
  );
}

/** Code-by-SMS mock, showing the number being verified. */
export function ArtSms() {
  const code = useFlow((s) => s.country);
  const phone = useFlow((s) => s.phone);
  const auth = useFlow((s) => s.auth);
  const c = country(code);
  return (
    <div className="art art-sms">
      <div className="glass notif">
        <span className="ni sms"><Icon name="message" /></span>
        <div><div className="nt"><b>Messages</b><span>now</span></div><div className="nb">Your Wi-Fi Calling code is <b>{auth === 'otp' ? '482913' : '••••••'}</b></div></div>
      </div>
      <div className="glass to-card"><Icon name="phone" /> {phone ? `${c.dial} ${fmtTyping(phone)}` : 'Your phone number'}</div>
    </div>
  );
}

/** Live profile preview — updates as the user types their name. */
export function ArtProfile() {
  const u = useData().user;
  const name = `${u.first} ${u.last}`.trim();
  return (
    <div className="art art-profile">
      <div className="glass prof-card">
        <span className="av big">{initial(name) || <Icon name="user" />}</span>
        <div className="pn">{name || 'Your name'}</div>
        <div className="pu">@{u.username || 'username'}</div>
        <div className="pb"><span><Icon name="phone" /> Call</span><span><Icon name="message" /> Chat</span><span><Icon name="video" /> Video</span></div>
      </div>
    </div>
  );
}

export function ArtAccess() {
  const perm = useFlow((s) => s.perm);
  const rows: ['mic' | 'notif' | 'contacts', string, 'mic' | 'bellBadge' | 'users'][] = [['mic', 'Microphone', 'mic'], ['notif', 'Notifications', 'bellBadge'], ['contacts', 'Contacts', 'users']];
  return (
    <div className="art art-access">
      <div className="glass acc-card">
        {rows.map(([k, t, ic]) => (
          <div className="acc-row" key={k}><span className="ai"><Icon name={ic} /></span><b>{t}</b><span className={cx('sw', perm[k] === 'granted' && 'on')}><i /></span></div>
        ))}
      </div>
    </div>
  );
}

export function ArtDone() {
  return (
    <div className="art art-done">
      <div className="burst">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ transform: `rotate(${i * (360 / 14)}deg) translateY(-118px)`, animationDelay: `${(i % 7) * 0.05}s` }} />)}</div>
      <div className="done-core"><Icon name="check" /></div>
    </div>
  );
}
