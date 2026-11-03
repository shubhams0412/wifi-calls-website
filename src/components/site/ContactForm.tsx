'use client';

import { useState } from 'react';

const SUPPORT = 'support@wifiphonecalls.com';

type Note = { text: string; kind?: 'ok' | 'err' };

/** Contact form → POST /api/contact, which relays the message over SMTP. */
export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<Note>({ text: "We'll only use your email to reply to this message." });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const payload = {
      name: String(f.get('name') || '').trim(),
      email: String(f.get('email') || '').trim(),
      subject: String(f.get('subject') || '').trim(),
      message: String(f.get('message') || '').trim(),
      hp_check: String(f.get('hp_check') || ''), // honeypot — real users leave it empty
    };
    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setNote({ text: 'Please fill in every field so we can help.', kind: 'err' });
      return;
    }
    setSending(true);
    setNote({ text: 'Sending your message…' });
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        form.reset();
        setNote({ text: "Thanks — your message is on its way. We'll reply by email soon.", kind: 'ok' });
      } else {
        setNote({ text: data.error || `Sorry, we couldn't send that. Please email ${SUPPORT} directly.`, kind: 'err' });
      }
    } catch {
      setNote({ text: `Network error — check your connection, or email ${SUPPORT} directly.`, kind: 'err' });
    } finally {
      setSending(false);
    }
  }

  return (
    <form id="contactForm" noValidate onSubmit={onSubmit}>
      {/* Honeypot. Named hp_check (not website/url/email) and readonly so browser autofill
          never fills it — a filled trap silently discards a real message. */}
      <div className="hp" aria-hidden="true">
        <input type="text" name="hp_check" tabIndex={-1} autoComplete="off" readOnly />
      </div>
      <div className="field-row">
        <label className="field">
          <span className="flabel">Name</span>
          <input type="text" name="name" autoComplete="name" placeholder="Your name" required />
        </label>
        <label className="field">
          <span className="flabel">Email</span>
          <input type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
        </label>
      </div>
      <label className="field">
        <span className="flabel">Subject</span>
        <input type="text" name="subject" placeholder="How can we help?" required />
      </label>
      <label className="field">
        <span className="flabel">Message</span>
        <textarea name="message" rows={5} placeholder="Tell us what's going on…" required />
      </label>
      <button type="submit" className="btn btn-primary" disabled={sending}>
        {sending ? 'Sending…' : (
          <>
            Send message
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </>
        )}
      </button>
      <p className={'form-note' + (note.kind ? ' ' + note.kind : '')} role="status" aria-live="polite">{note.text}</p>
    </form>
  );
}
