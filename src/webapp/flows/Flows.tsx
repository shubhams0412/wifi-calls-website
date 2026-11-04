'use client';

/* The pre-dashboard journey, in one frame with a 4-part progress bar:
     Discover (4 intro pages) → Choose plan (compare → timeline → reminder → offer)
     → Your account (phone → code → profile) → Get set up (access → number → done) → dashboard.
   Mirrors the iOS flow (App/RootView + AppState) with two web changes: the review prompt is not
   shown before sign-up, and the duplicate "Welcome" sign-in screen is folded into the phone step. */
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon, IconName } from '../icons';
import { APP_NAME, cx, digits, fmtPhone, fmtTyping, longDate } from '../format';
import { wc } from '../api';
import { confirmCode, sendCode } from '../firebase';
import { applyProfile, loadCredit, loadProfile, startPolling, syncAll } from '../sync';
import { country, friends, getData, mutate, useData } from '../store';
import { alertDialog, toast } from '../ui';
import { Spinner } from '../components/ui';
import { openCountryPicker } from '../components/pickers';
import { BuyArea, FeatureList, PlanList, Swap, TierToggle, useOffer } from './Paywall';
import { backward, forward, setFlow, useFlow, type PermState } from './flowState';
import { Frame, StepHead } from './Frame';
import {
  ArtAccess, ArtCall, ArtChat, ArtCrown, ArtDone, ArtFeatures, ArtNumber, ArtProfile, ArtReminder, ArtSecure, ArtSms, ArtTimeline,
} from './Art';

/* ---------------- shared bits ---------------- */
function Cta({ label, onClick, disabled, lead, trail = 'arrowR', pulse, busy }: {
  label: ReactNode; onClick: () => void; disabled?: boolean; lead?: IconName; trail?: IconName | null; pulse?: boolean; busy?: ReactNode;
}) {
  return (
    <button className={cx('btn btn-primary block fx-cta', pulse && 'pulse')} onClick={onClick} disabled={disabled || !!busy}>
      {busy ? <><Spinner white /> {busy}</> : <>{lead && <Icon name={lead} />}<span>{label}</span>{trail && <Icon name={trail} />}</>}
    </button>
  );
}
const Legal = () => (
  <p className="fx-legal">
    By continuing you agree to our <a href="/terms" target="_blank" rel="noopener">Terms</a> and{' '}
    <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>
  </p>
);
const SkipBtn = ({ onClick, label = 'Skip' }: { onClick: () => void; label?: string }) => <button className="fx-skip" onClick={onClick}>{label}</button>;

/* ================= Splash ================= */
function Splash() {
  useEffect(() => {
    const t = setTimeout(() => {
      // resolveInitialRoute: logged in → Main (or setup), otherwise → onboarding
      const d = getData();
      forward({ page: 0, setup: 'access' });
      mutate((x) => { x.stage = d.user.phone && d.user.first ? (d.permsDone ? 'main' : 'perms') : 'onboarding'; });
    }, 1300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fx-splash">
      <div className="fx-glow"><i /><i /></div>
      <span className="app-icon xl" />
      <h1>{APP_NAME}</h1>
      <p>Calls &amp; messages over the internet</p>
      <span className="fx-loadbar"><i /></span>
    </div>
  );
}

/* ================= 1 · Discover ================= */
const PAGES: { eyebrow: string; title: string; sub: string; Art: () => ReactNode }[] = [
  { eyebrow: `Welcome to ${APP_NAME}`, title: 'Stay connected, anywhere.', sub: 'Endless app-to-app calls and texts, no limits.', Art: ArtCall },
  { eyebrow: 'A second number', title: 'Get a second phone number for all your needs.', sub: 'Send SMS to real phone numbers or chat in-app with friends — photos, voice notes, the lot.', Art: ArtChat },
  { eyebrow: 'Calls & SMS', title: 'SMS & calling from your new phone number.', sub: 'Get a dedicated US number — perfect for sign-ups, listings and work calls without sharing your real line.', Art: () => <ArtNumber /> },
  { eyebrow: 'Private by design', title: 'Keep in touch wherever you go, at no cost to you.', sub: 'End-to-end encrypted in-app chat, your number stays yours. We never sell your contacts.', Art: ArtSecure },
];

/** completeOnboarding: subscribed → account, otherwise → plan. */
function completeOnboarding() {
  forward({ pay: 0, auth: 'phone' });
  mutate((x) => { x.stage = x.tier !== 'none' ? 'auth' : 'paywall'; });
}

/* Intro carousel: the slides auto-scroll (and loop); the single "Get started" button and the
   frame around it never change or re-animate — only the illustration and copy slide. */
const SLIDE_MS = 4000;

function Onboarding() {
  const page = useFlow((s) => s.page);
  const p = PAGES[page];
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const show = (i: number, dir: 1 | -1 = 1) => (dir > 0 ? forward : backward)({ page: (i + PAGES.length) % PAGES.length });

  // Auto-scroll every 4s, looping back to the first slide; any slide change restarts the timer.
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => show(page + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [page, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Frame stage={0} frac={0.5} stepKey="onb" artKey={'onb' + page} art={<p.Art />} mobileArt
      actions={<>
        <Cta label="Get started" onClick={completeOnboarding} />
        <p className="fx-alt">Already have an account?{' '}
          <button className="link-btn" onClick={() => { forward({ auth: 'phone' }); mutate((x) => { x.stage = 'auth'; }); }}>Sign in</button>
        </p>
      </>}>
      <div className="fx-carousel"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
        onTouchEnd={(e) => {
          const start = touchX.current; touchX.current = null; setPaused(false);
          if (start === null) return;
          const dx = e.changedTouches[0].clientX - start;
          if (Math.abs(dx) > 40) show(page + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        }}>
        <div key={page} className="fx-slide" aria-live="polite">
          <StepHead eyebrow={p.eyebrow} title={p.title} sub={p.sub} />
        </div>
        <div className="fx-dots" role="tablist" aria-label="Intro slides">
          {PAGES.map((_, i) => (
            <button key={i} role="tab" aria-selected={i === page} aria-label={`Slide ${i + 1}`} className={cx(i === page && 'on', i === page && !paused && 'run')}
              style={{ ['--slide-ms' as string]: SLIDE_MS + 'ms' }} onClick={() => show(i, i >= page ? 1 : -1)} />
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ================= 2 · Choose plan ================= */
const trialEnd = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return longDate(d); };

function Plan() {
  const s = useFlow((x) => x.pay);
  const next = () => forward({ pay: s + 1 });
  const back = () => (s > 0 ? backward({ pay: s - 1 }) : (backward({ page: 3 }), mutate((x) => { x.stage = 'onboarding'; })));
  if (s >= 3) return <PlanOffer onBack={back} />;

  if (s === 0) {
    const rows: [string, boolean][] = [
      ['Get 2nd Phone number', true], ['Send SMS to anyone.', true], ['Make app-to-cellular calls and record calls easily.', true],
      ['Anonymous calls', false], ['Call recordings', false], ['Enjoy voice calls and call forwarding', false],
    ];
    return (
      <Frame stage={1} frac={1 / 4} stepKey="pay0" artKey="pay0" art={<ArtCrown />} onBack={back}
        actions={<Cta label="Try free for 3 days" onClick={next} />}>
        <StepHead eyebrow="Lite vs Pro" title="Calls & messages with a private number." sub="See what Pro gets you compared to free." />
        <div className="card cmp">
          <div className="cmp-row head"><span>Feature</span><span className="cmp-c">LITE</span><span className="cmp-c"><b className="pro-cap">PRO</b></span></div>
          {rows.map(([label, lite]) => (
            <div className="cmp-row" key={label}>
              <span>{label}</span>
              <span className="cmp-c">{lite ? <i className="ck lite"><Icon name="check" /></i> : <i className="ck no"><Icon name="minus" /></i>}</span>
              <span className="cmp-c"><i className="ck pro"><Icon name="check" /></i></span>
            </div>
          ))}
        </div>
      </Frame>
    );
  }
  if (s === 1) {
    const steps: [IconName, string, string, boolean][] = [
      ['download', 'Today', 'Install the app and get access to every feature.', true],
      ['bell', 'In 2 days', 'We will send you a reminder that your free trial is about to end.', false],
      ['card', 'In 3 days', "You'll be charged, unless you cancel anytime before.", false],
    ];
    return (
      <Frame stage={1} frac={2 / 4} stepKey="pay1" artKey="pay1" art={<ArtTimeline />} onBack={back}
        actions={<><Cta label="Continue" onClick={next} />
          <p className="fx-legal"><a href="/terms" target="_blank" rel="noopener">Terms &amp; Conditions</a> · <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a></p></>}>
        <StepHead eyebrow="Free trial" title="How your free trial works" sub="No surprises. Cancel anytime before the trial ends." />
        <div className="card pad timeline">
          {steps.map(([icon, title, sub, on], i) => (
            <div key={title} className={cx('tl', on && 'on', i === steps.length - 1 && 'last')}>
              <div className="tl-dot"><Icon name={icon} /></div>
              <div><div className="tl-t">{title}</div><div className="tl-s">{sub}</div></div>
            </div>
          ))}
        </div>
      </Frame>
    );
  }
  return (
    <Frame stage={1} frac={3 / 4} stepKey="pay2" artKey="pay2" art={<ArtReminder />} onBack={back}
      actions={<Cta label="Start my free trial" onClick={next} />}>
      <StepHead eyebrow="No surprises" title="We'll remind you before your trial ends." sub="The day before your trial ends, we'll send a reminder so you can decide." />
      <div className="card pad remind">
        <div className="row-lite">
          <span className="grad-circle"><Icon name="calendar" /></span>
          <div><div className="tiny muted">Trial ends</div><div style={{ fontWeight: 600, fontSize: 17 }}>{trialEnd(3)}</div></div>
        </div>
        <div className="row-lite">
          <span className="grad-circle soft"><Icon name="bell" /></span>
          <div><div className="tiny muted">Reminder</div><div style={{ fontWeight: 600, fontSize: 17 }}>{trialEnd(2)}</div></div>
        </div>
      </div>
    </Frame>
  );
}

function PlanOffer({ onBack }: { onBack: () => void }) {
  const o = useOffer(() => { forward({ auth: 'phone' }); mutate((x) => { x.stage = 'auth'; }); });
  const pro = o.tier === 'pro';
  return (
    <Frame stage={1} frac={1} stepKey="pay3" artKey="pay3" art={<ArtFeatures />} onBack={onBack} actions={<BuyArea o={o} />}>
      <StepHead eyebrow={<><Icon name="sparkles" /> {APP_NAME} <Swap pro={pro}>{['Pro', 'Lite']}</Swap></>}
        title={<Swap pro={pro}>{['Unlock everything with Pro', 'Start with the essentials']}</Swap>}
        sub={<Swap pro={pro}>{['Every feature, unlimited — calls, broadcasts, voicemail, recording and more.', 'The essentials to stay connected. Upgrade to Pro anytime.']}</Swap>} />
      <TierToggle o={o} />
      <PlanList o={o} />
      <details className="fx-included">
        <summary><Icon name="checklist" /> What&apos;s included <Icon name="chevD" /></summary>
        <FeatureList pro={pro} />
      </details>
    </Frame>
  );
}

/* ================= 3 · Your account ================= */
function backFromAccount() {
  const tier = getData().tier;
  if (tier !== 'none') { backward({ pay: 3 }); mutate((x) => { x.stage = 'paywall'; }); }
  else { backward({ page: 3 }); mutate((x) => { x.stage = 'onboarding'; }); }
}

function PhoneStep() {
  const code = useFlow((s) => s.country);
  const phone = useFlow((s) => s.phone);
  const [busy, setBusy] = useState(false);
  const c = country(code);
  const n = phone.length;
  const ok = n >= 7 && n <= 15;

  const send = () => {
    if (!n) return toast('Enter your phone number.');
    if (n < 7) return toast('Phone number is too short.');
    if (n > 15) return toast('Phone number is too long.');
    setBusy(true);
    sendCode(c.dial + phone, 'fx-recaptcha')
      .then(() => forward({ auth: 'otp', otp: '', resend: 30 }))
      .catch((e: Error) => { setBusy(false); alertDialog('Couldn’t send the code', e.message); });
  };

  return (
    <Frame stage={2} frac={1 / 3} stepKey="phone" artKey="sms" art={<ArtSms />} onBack={backFromAccount}
      actions={<><Cta label="Send verification code" onClick={send} disabled={!ok} busy={busy ? 'Sending code…' : undefined} /><Legal /></>}>
      <StepHead eyebrow="Sign in or create an account" title="What's your phone number?" sub="We'll text you a 6-digit code to verify it's you. Already use the iPhone app? Use the same number." />
      <div id="fx-recaptcha" />
      <div className="fx-field">
        <span className="fx-label">Phone number</span>
        <div className="fx-phone">
          <button className="fx-cc" onClick={() => openCountryPicker(code, (x) => setFlow({ country: x.code }))} aria-label={`Country: ${c.name}`}>
            <span className="flag">{c.flag}</span><b className="mono">{c.dial}</b><Icon name="chevD" />
          </button>
          <input className="mono" inputMode="tel" autoComplete="tel-national" placeholder="(555) 123-4567" autoFocus
            value={fmtTyping(phone)} onChange={(e) => setFlow({ phone: digits(e.target.value).slice(0, 15) })}
            onKeyDown={(e) => { if (e.key === 'Enter' && ok && !busy) send(); }} />
        </div>
        <span className="fx-hint"><Icon name="lock" /> Your number stays private — we&apos;ll never share it. Standard SMS rates may apply.</span>
      </div>
    </Frame>
  );
}

function OtpStep() {
  const code = useFlow((s) => s.country);
  const phone = useFlow((s) => s.phone);
  const otp = useFlow((s) => s.otp);
  const resend = useFlow((s) => s.resend);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const c = country(code);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setFlow({ resend: useFlow.getState().resend - 1 }), 1000);
    return () => clearTimeout(t);
  }, [resend]);

  const verify = (value = otp) => {
    if (value.length !== 6) return toast('Enter the 6-digit code.');
    if (busy) return;
    setBusy(true);
    (async () => {
      try {
        const idToken = await confirmCode(value);
        const r = await wc<Parameters<typeof applyProfile>[0]>('session', { idToken });
        if (!r.ok) throw new Error(r.message || 'Sign-in failed. Please try again.');
        mutate((x) => { x.user.phone = c.dial + phone; x.user.country = c.code; });
        applyProfile(r.data ?? {});
        await Promise.all([loadProfile(), loadCredit()]);
        const u = getData().user;
        if (u.first && u.last && u.username) goSetup(); else forward({ auth: 'details' });
      } catch (e) {
        setBusy(false);
        setFlow({ otp: '' });
        alertDialog('Couldn’t verify the code', (e as Error).message);
      }
    })();
  };
  const resendCode = () => {
    setFlow({ resend: 30 });
    sendCode(c.dial + phone, 'fx-recaptcha')
      .then(() => { toast('Code sent again'); inputRef.current?.focus(); })
      .catch((e: Error) => alertDialog('Couldn’t send the code', e.message));
  };

  return (
    <Frame stage={2} frac={2 / 3} stepKey="otp" artKey="sms" art={<ArtSms />} onBack={() => backward({ auth: 'phone', otp: '' })}
      actions={<Cta label="Verify" trail="check" onClick={() => verify()} disabled={otp.length !== 6} busy={busy ? 'Verifying…' : undefined} />}>
      <StepHead eyebrow="Verify your number" title="Enter the code we sent" sub={<>Sent to <b>{c.dial} {fmtTyping(phone)}</b> · <button className="link-btn" onClick={() => backward({ auth: 'phone', otp: '' })}>Change</button></>} />
      <label className={cx('otp fx-otp', busy && 'busy')} htmlFor="otpIn">
        {Array.from({ length: 6 }, (_, i) => <span key={i} className={cx('otp-box', i === otp.length && !busy && 'active', otp[i] && 'filled')}>{otp[i] ?? ''}</span>)}
        <input id="otpIn" ref={inputRef} className="otp-in" inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-label="Verification code"
          value={otp} disabled={busy}
          onChange={(e) => { const v = digits(e.target.value).slice(0, 6); setFlow({ otp: v }); if (v.length === 6) verify(v); }} />
      </label>
      <div className="fx-resend">
        {resend > 0
          ? <span>Didn&apos;t get it? Resend in <b className="mono">0:{String(resend).padStart(2, '0')}</b></span>
          : <span>Didn&apos;t get it? <button className="link-btn" onClick={resendCode}>Resend code</button></span>}
      </div>
      <div id="fx-recaptcha" />
    </Frame>
  );
}

function DetailsStep() {
  const u = useData().user;
  const [busy, setBusy] = useState(false);
  const [userTouched, setUserTouched] = useState(!!u.username);
  const valid = !!(u.first && u.last && (u.username || '').length >= 3);

  const suggest = (first: string, last: string) => `${first}.${last}`.toLowerCase().replace(/[^a-z0-9._-]/g, '').replace(/^\.|\.$/g, '');
  const setName = (key: 'first' | 'last', v: string) => mutate((x) => {
    x.user[key] = v.trim();
    if (!userTouched) x.user.username = suggest(x.user.first, x.user.last);
  });

  const finish = () => {
    if (!u.first) return toast('Enter your first name.');
    if (!u.last) return toast('Enter your last name.');
    if (!u.username) return toast('Enter a username.');
    if (u.username.length < 3) return toast('Username must be at least 3 characters.');
    if (!/^[A-Za-z0-9._-]+$/.test(u.username)) return toast("Username can only contain letters, numbers, '.', '_' or '-'.");
    setBusy(true);
    wc('updateProfile', { first_name: u.first, last_name: u.last, username: u.username }).then((r) => {
      if (r.ok) return goSetup();
      setBusy(false);
      alertDialog('Couldn’t save your profile', /USERNAME|username/.test(r.message) && /exist|taken/i.test(r.message) ? 'That username is taken. Try another one.' : r.message || 'Please try again.');
    });
  };
  const onEnter = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && valid && !busy) finish(); };

  return (
    <Frame stage={2} frac={1} stepKey="details" artKey="profile" art={<ArtProfile />}
      actions={<Cta label="Continue" onClick={finish} disabled={!valid} busy={busy ? 'Saving…' : undefined} />}>
      <StepHead eyebrow="Create your profile" title="What should we call you?" sub={`Your name and username are how friends recognise you and reach you on ${APP_NAME}.`} />
      <div className="fx-row2">
        <label className="fx-field"><span className="fx-label">First name</span>
          <input className="fx-input" value={u.first} autoFocus autoComplete="given-name" onChange={(e) => setName('first', e.target.value)} onKeyDown={onEnter} /></label>
        <label className="fx-field"><span className="fx-label">Last name</span>
          <input className="fx-input" value={u.last} autoComplete="family-name" onChange={(e) => setName('last', e.target.value)} onKeyDown={onEnter} /></label>
      </div>
      <label className="fx-field"><span className="fx-label">Username</span>
        <span className="fx-prefix"><span>@</span>
          <input className="fx-input" value={u.username} autoCapitalize="none" spellCheck={false}
            onChange={(e) => { setUserTouched(true); const v = e.target.value.trim(); mutate((x) => { x.user.username = v; }); }} onKeyDown={onEnter} /></span>
        <span className="fx-hint">Letters, numbers, “.”, “_” or “-”. At least 3 characters.</span>
      </label>
    </Frame>
  );
}

function Account() {
  const step = useFlow((s) => s.auth);
  if (step === 'otp') return <OtpStep />;
  if (step === 'details') return <DetailsStep />;
  return <PhoneStep />;
}

/* ================= 4 · Get set up ================= */
function goSetup() {
  syncAll();
  startPolling();
  forward({ setup: 'access' });
  mutate((x) => { x.stage = x.permsDone ? 'main' : 'perms'; });
}

function AccessStep() {
  const perm = useFlow((s) => s.perm);
  const setPerm = (k: 'mic' | 'notif' | 'contacts', v: PermState) => setFlow({ perm: { ...useFlow.getState().perm, [k]: v } });
  const ask = (k: 'mic' | 'notif' | 'contacts') => {
    setPerm(k, 'requesting');
    const done = (ok: boolean) => setPerm(k, ok ? 'granted' : 'denied');
    if (k === 'mic' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => { s.getTracks().forEach((t) => t.stop()); done(true); }).catch(() => done(false));
    } else if (k === 'notif' && typeof Notification !== 'undefined' && Notification.requestPermission) {
      Notification.requestPermission().then((p) => done(p === 'granted')).catch(() => done(false));
    } else setTimeout(() => done(true), 400);
  };
  const next = () => {
    mutate((x) => { x.contactsPermission = perm.contacts === 'granted' ? 'granted' : 'unknown'; });
    const d = getData();
    forward({ setup: d.tier !== 'none' && !d.number ? 'number' : 'done' });
  };
  const rows: ['mic' | 'notif' | 'contacts', IconName, string, string][] = [
    ['mic', 'mic', 'Microphone', 'So the person on the other end can hear you on calls.'],
    ['notif', 'bellBadge', 'Notifications', "So you don't miss an incoming call or message."],
    ['contacts', 'users', 'Find friends', `Match your contacts with ${APP_NAME} users. Used once, never stored or sold.`],
  ];
  const allSet = rows.every(([k]) => perm[k] === 'granted');
  return (
    <Frame stage={3} frac={1 / 3} stepKey="access" artKey="access" art={<ArtAccess />}
      topRight={<SkipBtn label="Skip" onClick={next} />}
      actions={<Cta label={allSet ? 'Continue' : 'Continue'} onClick={next} />}>
      <StepHead eyebrow="Almost there" title="Set up your experience" sub="Allow these so calls and alerts work the way you'd expect. You can change them anytime." />
      <div className="fx-perms">
        {rows.map(([k, icon, title, sub]) => {
          const st = perm[k];
          return (
            <div className={cx('fx-perm', st === 'granted' && 'ok')} key={k}>
              <span className="pi"><Icon name={icon} /></span>
              <div className="pt"><b>{title}</b><span>{sub}</span></div>
              {st === 'granted' ? <span className="pok"><Icon name="checkCircle" /></span>
                : st === 'requesting' ? <Spinner />
                : st === 'denied' ? <button className="link-btn" onClick={() => alertDialog('Permission denied', "Open your browser's site settings to allow access, then come back.")}>Settings</button>
                : <button className="fx-allow" onClick={() => ask(k)}>Allow</button>}
            </div>
          );
        })}
      </div>
      <a className="fx-hint link" href="/privacy" target="_blank" rel="noopener">How we use this — Privacy Policy <Icon name="arrowUpRight" /></a>
    </Frame>
  );
}

function NumberStep() {
  const [cc, setCc] = useState<'US' | 'CA'>('US');
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<{ phoneNumber: string; friendlyName: string }[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setList(null); setError(''); setSel(null);
    wc<{ phoneNumber: string; friendlyName: string }[]>('fetchNumbers', { country_code: cc }).then((r) => {
      if (!live) return;
      if (r.ok && Array.isArray(r.data)) setList(r.data.slice(0, 5));
      else { setList([]); setError(r.message || 'Couldn’t load numbers. Please try again.'); }
    });
    return () => { live = false; };
  }, [cc]);

  const chosen = list?.find((x) => x.phoneNumber === sel);
  const claim = async () => {
    if (!chosen) return;
    setBusy(true);
    const r = await wc('purchaseNumber', { phone_number: chosen.phoneNumber, friendly_name: chosen.friendlyName });
    if (!r.ok) { setBusy(false); return alertDialog('Couldn’t claim this number', r.message || 'Please pick another number.'); }
    await loadProfile();
    forward({ setup: 'done' });
  };
  return (
    <Frame stage={3} frac={2 / 3} stepKey="number" artKey={'num' + (sel || '')}
      art={<ArtNumber phone={sel ? fmtPhone(sel) : undefined} label={sel ? 'YOUR NEW NUMBER' : 'PICK A NUMBER'} />}
      onBack={() => backward({ setup: 'access' })} topRight={<SkipBtn label="Later" onClick={() => forward({ setup: 'done' })} />}
      actions={<Cta label={sel ? `Claim ${fmtPhone(sel)}` : 'Choose a number'} onClick={claim} disabled={!sel} busy={busy ? 'Claiming…' : undefined} />}>
      <StepHead eyebrow="Your private line" title="Pick your new number" sub="Make calls, send SMS, keep your real number private." />
      <div className="seg" style={{ margin: 0 }}>
        <button className={cx(cc === 'US' && 'on')} onClick={() => setCc('US')}>🇺🇸  USA</button>
        <button className={cx(cc === 'CA' && 'on')} onClick={() => setCc('CA')}>🇨🇦  Canada</button>
      </div>
      <div className="fx-numbers" role="radiogroup" aria-label="Available numbers">
        {list === null ? <div className="center" style={{ padding: 24 }}><Spinner /></div>
          : error ? <p className="fx-hint">{error}</p>
          : list.length === 0 ? <p className="fx-hint">No numbers are available in this country right now. Try the other one, or pick a number later in Settings.</p>
          : list.map((n) => (
            <button key={n.phoneNumber} role="radio" aria-checked={sel === n.phoneNumber} className={cx('fx-num', sel === n.phoneNumber && 'on')} onClick={() => setSel(n.phoneNumber)}>
              <span className="radio">{sel === n.phoneNumber && <Icon name="check" />}</span>
              <span className="nn mono">{fmtPhone(n.phoneNumber)}</span>
              <span className="nc">{n.friendlyName}</span>
            </button>
          ))}
      </div>
    </Frame>
  );
}

function DoneStep() {
  const router = useRouter();
  const d = useData();
  const finish = () => {
    mutate((x) => { x.permsDone = true; x.stage = 'main'; });
    router.push('/app/dial');
  };
  const items: [IconName, string, string][] = [
    ['crown', 'Plan', d.tier === 'pro' ? 'Pro' : d.tier === 'lite' ? 'Lite' : 'Free · subscribe in the iPhone app'],
    ['phone', 'Your number', d.number ? fmtPhone(d.number) : 'Pick one anytime in Settings'],
    ['users', 'Friends on the app', `${friends(d).length} of your contacts`],
  ];
  return (
    <Frame stage={3} frac={1} stepKey="done" artKey="done" art={<ArtDone />} mobileArt
      actions={<Cta label="Open my dashboard" onClick={finish} />}>
      <StepHead eyebrow="Account ready" title={`You're all set${d.user.first ? `, ${d.user.first}` : ''}!`} sub="Everything is ready. Call, text and chat — free between app users." />
      <div className="fx-summary">
        {items.map(([icon, k, v]) => (
          <div className="fs-row" key={k}><span className="si"><Icon name={icon} /></span><span className="sk">{k}</span><b className="sv">{v}</b></div>
        ))}
      </div>
    </Frame>
  );
}

function Setup() {
  const step = useFlow((s) => s.setup);
  if (step === 'number') return <NumberStep />;
  if (step === 'done') return <DoneStep />;
  return <AccessStep />;
}

/* ================= router ================= */
export default function Flows() {
  const stage = useData().stage;
  useEffect(() => { document.querySelector('.flow-scroll')?.scrollTo(0, 0); }, [stage]);
  switch (stage) {
    case 'splash': return <Splash />;
    case 'onboarding': return <Onboarding />;
    case 'rating': // not shown before sign-up on the web
    case 'paywall': return <Plan />;
    case 'auth': return <Account />;
    case 'perms': return <Setup />;
    default: return null;
  }
}
