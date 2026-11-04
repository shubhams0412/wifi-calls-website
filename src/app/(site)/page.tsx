import HeroSignal from '@/components/site/HeroSignal';
import ContactForm from '@/components/site/ContactForm';
import Link from 'next/link';
import { Faqs, LinkCards, SectionHead } from '@/components/site/blocks';
import { FEATURES } from '@/site/content/features';
import { USE_CASES } from '@/site/content/useCases';
import { CALL_COUNTRIES, NUMBER_COUNTRIES } from '@/site/content/countries';
import { GENERAL_FAQ } from '@/site/content/faq';
import { formatDate, getPosts } from '@/site/blog';

export default function HomePage() {
  return (
    <>
      <a id="top" />
<section className="hero">
  <HeroSignal />
  <div className="wrap hero-inner">
    <span className="appicon" role="img" aria-label="Wi-Fi Calling and Texting app icon"></span>
    <h1>Free calls and texts, over any Wi-Fi.</h1>
    <p className="lede">
      Wi-Fi Calling and Texting gives you a private phone number and free app-to-app
      calling and messaging on any Wi-Fi or data connection — no extra SIM, no carrier plan.
    </p>
    <div className="hero-actions">
      <a className="btn btn-primary" href="https://apps.apple.com/app/id6781677176" target="_blank" rel="noopener">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2-.1 1.6-.8 3-.8s1.8.8 3 .7c1.2 0 2-1.1 2.8-2.3.9-1.3 1.2-2.6 1.3-2.7-.1 0-2.4-1-2.4-3.6zM14.2 5.9c.6-.8 1.1-1.9.9-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.3-.6 3-1.4z"/></svg>
        Download on iOS
      </a>
      <a className="btn btn-outline" href="/app">Use it on the web</a>
    </div>
    <div className="trust">
      <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Private second number</span>
      <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Encrypted, secure sessions</span>
      <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Works on Wi-Fi &amp; data</span>
    </div>
  </div>
  <div className="hero-wave" aria-hidden="true">
    <svg viewBox="0 0 1440 70" preserveAspectRatio="none"><path d="M0,40 C240,72 480,72 720,44 C960,16 1200,16 1440,44 L1440,70 L0,70 Z"/></svg>
  </div>
</section>

<div>
{/* ===================== FEATURES ===================== */}
<section className="band" id="features">
  <div className="wrap">
    <div className="sec-head">
      <span className="label">Features</span>
      <h2>One app for calling and texting.</h2>
      <p>Everything you need to stay in touch — a real number, free calls, and messaging that just works.</p>
    </div>
    <div className="feature-grid">
      <div className="fcard">
        <span className="ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg></span>
        <h3>Free app-to-app calls</h3>
        <p>Call and be called by other users for free over any Wi-Fi or data connection — crystal-clear, wherever you are.</p>
      </div>
      <div className="fcard">
        <span className="ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M11 18h2"/></svg></span>
        <h3>Your private number</h3>
        <p>Get a dedicated virtual phone number to share and keep your personal line private. Reachable without a second SIM.</p>
      </div>
      <div className="fcard">
        <span className="ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 20l1-4a8.4 8.4 0 0 1-1-4A8.4 8.4 0 0 1 11.5 3h.5a8.4 8.4 0 0 1 9 8v.5z"/></svg></span>
        <h3>Text &amp; group chat</h3>
        <p>Send messages, share photos, and stay in touch with one-to-one and group conversations — all in one place.</p>
      </div>
      <div className="fcard">
        <span className="ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 0 0-9 9v5a2 2 0 0 0 2 2h1v-6H5v-1a7 7 0 0 1 14 0v1h-1v6h1a2 2 0 0 0 2-2v-5a9 9 0 0 0-9-9z"/></svg></span>
        <h3>Private &amp; secure</h3>
        <p>Encrypted sessions, clear permissions, and full control over your data — including deleting your account any time.</p>
      </div>
    </div>
    <div className="home-explore">
      <LinkCards items={FEATURES.slice(0, 9).map((f) => ({ href: `/features/${f.slug}`, icon: f.icon, title: f.name, text: f.short, badge: f.pro ? 'Pro' : undefined }))} />
      <p className="x-note"><Link href="/features">See all {FEATURES.length} features →</Link></p>
    </div>
  </div>
</section>

{/* ===================== HOW IT WORKS ===================== */}
<section className="band alt" id="how">
  <div className="wrap">
    <div className="sec-head">
      <span className="label">How it works</span>
      <h2>Up and running in minutes.</h2>
    </div>
    <div className="steps">
      <div className="step">
        <div className="num">1</div>
        <h3>Download the app</h3>
        <p>Install Wi-Fi Calling and Texting from the App Store and create your account in seconds.</p>
      </div>
      <div className="step">
        <div className="num">2</div>
        <h3>Get your number</h3>
        <p>Pick up a private virtual phone number that's yours to call and text from.</p>
      </div>
      <div className="step">
        <div className="num">3</div>
        <h3>Call &amp; text anywhere</h3>
        <p>Connect over any Wi-Fi or data — free between users, wherever you both are.</p>
      </div>
    </div>
  </div>
</section>

{/* ===================== CONTACT ===================== */}
{/* ===================== USE CASES ===================== */}
<section className="band" id="use-cases">
  <div className="wrap">
    <SectionHead label="Use cases" title="A second number for every part of life" sub="Keep work, side projects and dating separate from your personal line." />
    <LinkCards items={USE_CASES.map((u) => ({ href: `/use-cases/${u.slug}`, icon: u.icon, title: u.name, text: u.short }))} />
  </div>
</section>

{/* ===================== COUNTRIES ===================== */}
<section className="band alt" id="countries">
  <div className="wrap">
    <SectionHead label="Countries" title="Local numbers, worldwide calling" sub="Get a US or Canadian number, and call friends and family abroad — free when they have the app too." />
    <div className="home-countries">
      <div>
        <h3>Get a number</h3>
        <LinkCards cols={2} items={NUMBER_COUNTRIES.map((c) => ({ href: `/numbers/${c.slug}`, flag: c.flag, title: `${c.name} numbers`, text: `Country code ${c.dial}` }))} />
      </div>
      <div>
        <h3>Call abroad</h3>
        <LinkCards cols={2} items={CALL_COUNTRIES.slice(0, 6).map((c) => ({ href: `/international-calling/${c.slug}`, flag: c.flag, title: `Call ${c.name}`, text: `Country code ${c.dial}` }))} />
        <p className="x-note"><Link href="/international-calling">All calling guides →</Link></p>
      </div>
    </div>
  </div>
</section>

{/* ===================== PLANS ===================== */}
<section className="band" id="plans">
  <div className="wrap">
    <SectionHead label="Plans" title="Start free, upgrade when you need more" sub="Lite covers the essentials. Pro adds call recording, voicemail, forwarding, broadcasts, group calls and anonymous calling." />
    <div className="home-plans">
      <Link className="btn btn-primary" href="/plans">Compare Lite and Pro</Link>
      <Link className="btn btn-outline" href="/app">Try the web app</Link>
    </div>
  </div>
</section>

{/* ===================== FAQ ===================== */}
<Faqs items={GENERAL_FAQ.slice(0, 6)} />

{/* ===================== BLOG ===================== */}
{getPosts().length > 0 && (
<section className="band" id="blog">
  <div className="wrap">
    <SectionHead label="Blog" title="Guides & tips" />
    <div className="x-posts">
      {getPosts().slice(0, 3).map((p) => (
        <Link className="x-post" href={`/blog/${p.slug}`} key={p.slug}>
          <div className="x-post-meta">{p.tags[0] && <span className="tag">{p.tags[0]}</span>}<time dateTime={p.date}>{formatDate(p.date)}</time></div>
          <h2>{p.title}</h2><p>{p.description}</p>
        </Link>
      ))}
    </div>
    <p className="x-note"><Link href="/blog">All posts →</Link></p>
  </div>
</section>
)}

<section className="band alt" id="contact">
  <div className="wrap">
    <div className="sec-head">
      <span className="label">Contact Us</span>
      <h2>We're here to help.</h2>
      <p>Questions, feedback, or something not working? Send us a message and we'll get back to you.</p>
    </div>
    <div className="contact-grid">
      <div className="ccard">
        <h3>Send us a message</h3>
        <p>Fill in the form below and it goes straight to our support team. We usually reply within a day.</p>
        <ContactForm />
      </div>
    </div>
  </div>
</section>
</div>
    </>
  );
}
