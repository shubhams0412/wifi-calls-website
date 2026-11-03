'use client';

/* FAQs, Contact Us, Support bot (ChatSupportView + SupportContent), Invite friends. */
import { useEffect, useRef, useState } from 'react';
import { APP_NAME, cx, STORE_URL, SUPPORT_EMAIL } from '../format';
import { Icon } from '../icons';
import { displayName, useData } from '../store';
import { copyText, shareText } from '../ui';
import { TopBar } from '../components/ui';

const FAQS: [string, string][] = [
  ['How do I cancel my subscription?', `Open Settings → Apple ID → Subscriptions, find ${APP_NAME} and tap Cancel.`],
  ['What happens if I delete the app?', 'Deleting the app does not cancel your subscription. Cancel via Apple Subscriptions.'],
  ['When will I be charged for my subscription?', 'After your free trial ends, on the renewal date shown in the App Store.'],
  ["Why can't the developer handle cancellations or refunds?", 'Subscriptions are managed by Apple. Refunds must be requested through Apple Support.'],
  ['Can I request a refund?', 'Yes — visit reportaproblem.apple.com and submit a refund request.'],
  ['How do I manage or change my subscription?', 'Open Settings → Apple ID → Subscriptions to switch plans or cancel.'],
];

export function FaqsView() {
  const [open, setOpen] = useState(-1);
  return (
    <>
      <TopBar title="FAQs" rootBack back="settings" />
      <div className="scroll">
        <div className="content narrow">
          <div className="card pad row-lite">
            <span className="circle-ic" style={{ width: 48, height: 48, fontSize: 20, background: 'var(--accent-soft)' }}><Icon name="questionPlain" /></span>
            <div><div style={{ fontWeight: 600, fontSize: 17 }}>How can we help?</div><div className="tiny muted" style={{ fontSize: 13 }}>Common questions about subscriptions and billing.</div></div>
          </div>
          {FAQS.map(([q, a], i) => (
            <div className={cx('card pad faq', open === i && 'open')} key={q}>
              <button className="row-between" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span style={{ fontWeight: 600 }}>{q}</span>
                <span className={cx('circle-ic rot', open === i && 'on')} style={{ width: 28, height: 28, fontSize: 12, background: 'var(--accent-soft)' }}><Icon name="chevD" /></span>
              </button>
              {open === i && <p className="muted" style={{ margin: '10px 0 0' }}>{a}</p>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function metaBlock(name: string, phone: string) {
  return `---\nFrom: ${name}  /  ${phone}\nApp: Web 1.0\nDevice: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`;
}

export function ContactUsView() {
  const d = useData();
  const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('App Support Request')}&body=${encodeURIComponent('Let us know here\n\n\n' + metaBlock(displayName(d), d.user.phone))}`;
  return (
    <>
      <TopBar title="Contact Us" rootBack back="settings" />
      <div className="scroll">
        <div className="content narrow center" style={{ alignItems: 'center', paddingTop: 48, gap: 12 }}>
          <span className="circle-ic" style={{ width: 110, height: 110, fontSize: 42 }}><Icon name="mail" /></span>
          <h2 style={{ margin: '6px 0 0', fontSize: 22 }}>Need help?</h2>
          <p className="muted" style={{ margin: 0, maxWidth: 360 }}>Tap below to email our support team. We&apos;ll get back to you within 24 hours.</p>
          <a className="btn btn-primary block" style={{ marginTop: 24, maxWidth: 360 }} href={href}>Contact Support</a>
          <button className="link-btn tiny faint" onClick={() => copyText(SUPPORT_EMAIL)}>{SUPPORT_EMAIL} · Copy</button>
          <p className="tiny faint">Or write to us from the <a href="/#contact">website contact form</a>.</p>
        </div>
      </div>
    </>
  );
}

/* ---------------- support bot ---------------- */
const TOPICS = [
  { t: 'Cancel subscription', q: 'How do I cancel my subscription?', a: `Subscriptions are billed by Apple, so cancellation happens there:\n\nSettings → tap your name → Subscriptions → ${APP_NAME} → Cancel Subscription.\n\nYou'll keep access until the end of the current billing period.`, k: ['cancel', 'unsubscribe', 'stop', 'subscription', 'renew'] },
  { t: 'Refund', q: 'Can I get a refund?', a: `Refunds are handled by Apple, not in the app. Visit reportaproblem.apple.com, sign in, find the ${APP_NAME} charge and request a refund.`, k: ['refund', 'money back', 'chargeback', 'reimburse'] },
  { t: 'Billing & charges', q: 'When will I be charged?', a: "If you started a free trial, you're charged on the renewal date once the trial ends. You can see the exact date in Settings → your name → Subscriptions.", k: ['charge', 'charged', 'billing', 'payment', 'trial', 'when', 'cost', 'price'] },
  { t: 'Get a number', q: 'How do I get a phone number?', a: 'Open Settings → Get a phone number (or tap the banner on Contacts / Messages). Pick a number and confirm — calls and texts then send from it. An active subscription is required.', k: ['number', 'phone number', 'get number', 'buy number', 'twilio'] },
  { t: 'Coins & credits', q: 'What are coins used for?', a: `Coins pay for calls and texts to regular (non-app) US numbers — roughly 1 coin per minute / message. App-to-app calls and chats between ${APP_NAME} users are free. Top up any time from Settings → Purchase Coins.`, k: ['coin', 'coins', 'credit', 'credits', 'balance', 'minutes', 'top up', 'topup'] },
  { t: "Call or text won't send", q: "Why can't I make a call or send a text?", a: "Most often it's one of these:\n• No active subscription — re-subscribe from the paywall.\n• No phone number yet — get one in Settings.\n• Out of coins — top up under Purchase Coins.\n• Microphone access off — enable it in your browser settings for calls.", k: ["can't call", 'cannot call', "won't send", 'not sending', 'failed', 'call', 'text', 'sms', 'message', 'error'] },
  { t: 'App-to-app calls', q: 'How do free app-to-app calls work?', a: `When both people use ${APP_NAME}, calls and chats between you are free and don't use coins — just open the contact and tap Call or Message.`, k: ['app to app', 'free call', 'free', 'friend', 'wifi'] },
];
type BotMsg = { bot?: boolean; text: string };
type Mode = 'topics' | 'answered' | 'collect' | 'ticket';
const GREETING = `Hi! I'm the ${APP_NAME} assistant. Pick a topic below and I'll help right away — or describe your issue and I'll prepare a support ticket.`;

export function SupportView() {
  const d = useData();
  const [msgs, setMsgs] = useState<BotMsg[]>([{ bot: true, text: GREETING }]);
  const [mode, setMode] = useState<Mode>('topics');
  const [topic, setTopic] = useState<string | null>(null);
  const [userLines, setUserLines] = useState<string[]>([]);
  const [text, setText] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { const s = scroller.current; if (s) s.scrollTop = s.scrollHeight; }, [msgs, mode]);

  const say = (...m: BotMsg[]) => setMsgs((p) => [...p, ...m]);
  const pickTopic = (i: number) => { const t = TOPICS[i]; setTopic(t.t); say({ text: t.q }, { bot: true, text: t.a }); setMode('answered'); };
  const contact = (label: string) => { say({ text: label }, { bot: true, text: "No problem — tell me a bit about what's happening and I'll prepare a support ticket for you." }); setMode('collect'); };
  const back = () => { say({ text: 'Back to topics' }, { bot: true, text: 'Sure — what would you like help with?' }); setMode('topics'); };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setText('');
    setUserLines((p) => [...p, v]);
    say({ text: v });
    setTimeout(() => {
      if (mode === 'collect' || mode === 'ticket') {
        setMode('ticket');
        say({ bot: true, text: 'Thanks. Tap “Generate support ticket” below — I\'ll open a pre-filled email. Add anything else there and send.' });
        return;
      }
      const lc = v.toLowerCase();
      let best: (typeof TOPICS)[number] | null = null, score = 0;
      for (const t of TOPICS) { const s = t.k.filter((k) => lc.includes(k)).length; if (s > score) { score = s; best = t; } }
      if (best) { setTopic(best.t); say({ bot: true, text: best.a }); setMode('answered'); }
      else { setMode('ticket'); say({ bot: true, text: "I couldn't find an exact answer for that. I can turn this into a support ticket — add any detail above, then tap below." }); }
    }, 250);
  };

  const ticket = () => {
    const body = (topic ? `Topic: ${topic}\n\n` : '') + userLines.join('\n\n') + '\n\n' + metaBlock(displayName(d), d.user.phone);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(topic ? 'App Support: ' + topic : 'App Support Request')}&body=${encodeURIComponent(body)}`;
    say({ bot: true, text: `I've opened a pre-filled email in your mail app. If nothing opened, email us directly at ${SUPPORT_EMAIL}. Anything else I can help with?` });
    setMode('topics');
  };

  return (
    <>
      <TopBar title="Support" rootBack back="settings" />
      <div className="thread" ref={scroller}>
        {msgs.map((m, i) => m.bot ? (
          <div className="bot-row" key={i}>
            <span className="grad-circle" style={{ width: 30, height: 30, fontSize: 13 }}><Icon name="headphones" /></span>
            <div className="bot-b" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
          </div>
        ) : <div className="user-b" key={i}>{m.text}</div>)}
        <div className="quick">
          {mode === 'topics' && <>
            {TOPICS.map((t, i) => <button className="qr" key={t.t} onClick={() => pickTopic(i)}>{t.t}</button>)}
            <button className="qr subtle" onClick={() => contact('Contact support')}>Contact support</button>
          </>}
          {mode === 'answered' && <>
            <button className="qr subtle" onClick={() => { say({ text: 'Yes, thanks' }, { bot: true, text: 'Glad that helped! Pick another topic, or describe anything else.' }); setMode('topics'); }}>Yes, thanks</button>
            <button className="qr" onClick={() => contact('No, contact support')}>No, contact support</button>
          </>}
          {mode === 'ticket' && <>
            <button className="qr wide" onClick={ticket}><Icon name="mail" /> Generate support ticket</button>
            <button className="qr subtle" onClick={back}>Back to topics</button>
          </>}
          {mode === 'collect' && <button className="qr subtle" onClick={back}>Back to topics</button>}
        </div>
      </div>
      <form className="composer bot" onSubmit={send}>
        <textarea rows={1} placeholder="Type a message" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
        <button type="submit" className="send-btn" disabled={!text.trim()} aria-label="Send"><Icon name="arrowUp" /></button>
      </form>
    </>
  );
}

export function InviteView() {
  const code = 'WIFICALLS-AB12';
  return (
    <>
      <TopBar title="Invite Friends" rootBack back="settings" />
      <div className="scroll">
        <div className="content narrow center" style={{ alignItems: 'center' }}>
          <div className="circle-ic" style={{ width: 152, height: 152, background: 'var(--accent-soft)' }}>
            <span className="grad-circle" style={{ width: 110, height: 110, fontSize: 44 }}><Icon name="gift" /></span>
          </div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Invite your friends</h2>
          <p className="muted" style={{ margin: 0 }}>Share {APP_NAME} — when they join, you both get bonus coins.</p>
          <div className="card pad row-between" style={{ width: '100%' }}>
            <div style={{ textAlign: 'left' }}><div className="tiny muted">Your invite code</div><div className="mono" style={{ fontWeight: 700, fontSize: 20 }}>{code}</div></div>
            <button className="chip soft" onClick={() => copyText(code)}><Icon name="copy" /> Copy</button>
          </div>
          <button className="btn btn-primary block" onClick={() => shareText(`Try ${APP_NAME} — use code ${code} to get bonus coins. ${STORE_URL}`)}><Icon name="share" /> Share invite</button>
          {['You get 50 bonus coins per friend', 'They get a free 7-day Pro trial', 'No limit — invite as many as you like'].map((p) => (
            <div className="card pad row-lite" style={{ width: '100%', boxShadow: 'none', border: '1px solid var(--hairline)' }} key={p}>
              <span style={{ color: 'var(--success)', fontSize: 20 }}><Icon name="checkCircle" /></span>{p}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
