'use client';

/* Shared thread pieces: bubbles, composer, send logic, fake chat replies, image viewer. */
import { wc } from '../api';
import { loadCredit, mapMessage, type SmsMessage } from '../sync';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import { AppData, Message, uid } from '../data';
import { clock, cx, dayLabel, sameDay } from '../format';
import { Icon } from '../icons';
import { getData, mutate } from '../store';
import { alertDialog, closeSheet, openSheet, toast } from '../ui';
import { Avatar, SheetHead } from '../components/ui';

export type ThreadKind = 'sms' | 'chat' | 'broadcast';

export function findThread(d: AppData, kind: ThreadKind, id: string): { messages: Message[] } | undefined {
  if (kind === 'sms') return d.sms.find((t) => t.id === id);
  if (kind === 'chat') return d.chats.find((t) => t.id === id);
  return d.broadcasts.find((t) => t.id === id);
}

export const fontPx = (d: AppData) => ({ Small: 15, Medium: 17, Large: 19 }[d.settings.fontSize] || 15);

/** Inbox preview text: "📷 Photo" style for images. */
export function Preview({ m, empty = 'Tap to chat', prefix }: { m?: Message; empty?: string; prefix?: string }) {
  if (!m) return <>{empty}</>;
  if (m.image) return <>{prefix}<Icon name="image" /> Photo</>;
  return <>{prefix}{m.body}</>;
}

/** URLs become links; newlines become <br>. */
function Linkify({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(/(https?:\/\/[^\s<]+)/g).map((part, i) =>
            /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener">{part}</a> : <Fragment key={i}>{part}</Fragment>,
          )}
        </Fragment>
      ))}
    </>
  );
}

/* ---------------- fullscreen image viewer ---------------- */
export const useViewer = create<{ src: string | null }>()(() => ({ src: null }));
export function ImageViewer() {
  const src = useViewer((s) => s.src);
  const [z, setZ] = useState(1);
  useEffect(() => { setZ(1); }, [src]);
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') useViewer.setState({ src: null }); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [src]);
  if (!src) return null;
  return (
    <div className="fullscreen-img" onClick={(e) => { if (e.target === e.currentTarget) useViewer.setState({ src: null }); }}
      onWheel={(e) => setZ((v) => Math.min(4, Math.max(1, v - e.deltaY * 0.002)))}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{ transform: `scale(${z})` }} onDoubleClick={() => setZ((v) => (v === 1 ? 2 : 1))} />
      <button className="fs-close" aria-label="Close" onClick={() => useViewer.setState({ src: null })}><Icon name="x" /></button>
    </div>
  );
}

function RetrySheet() {
  return (
    <>
      <SheetHead title="Message failed to send" />
      <div className="sheet-body">
        <button className="btn btn-primary block" onClick={closeSheet}>Try Again</button>
        <button className="btn btn-outline block" style={{ color: 'var(--danger)' }} onClick={closeSheet}>Delete</button>
      </div>
    </>
  );
}

/* ---------------- bubbles ---------------- */
export function Bubbles({ messages, group, allOut, name, hint, groupAvatar, fontSize }: {
  messages: Message[]; group?: boolean; allOut?: boolean; name: string; hint: string; groupAvatar?: boolean; fontSize: number;
}) {
  if (!messages.length) {
    return (
      <div className="thread-empty">
        <Avatar name={name} size={88} group={groupAvatar} />
        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 10 }}>{name || 'New Message'}</div>
        <div className="muted tiny" style={{ fontSize: 13 }}>{hint || 'Say hello 👋'}</div>
      </div>
    );
  }
  return (
    <>
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const mine = m.out || allOut;
        return (
          <Fragment key={m.id}>
            {(!prev || !sameDay(prev.at, m.at)) && <div className="day-pill"><span>{dayLabel(m.at)}</span></div>}
            <div className={cx('msg', mine ? 'out' : 'in')}>
              {group && !mine && m.sender && <div className="sender">{m.sender}</div>}
              {m.image && (
                <button className="msg-img" onClick={() => useViewer.setState({ src: m.image! })}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.image} alt="Photo" />
                </button>
              )}
              {m.body && (
                <div className="bubble" style={{ fontSize }} onClick={m.status === 'failed' ? () => openSheet(<RetrySheet />) : undefined}>
                  <Linkify text={m.body} />
                </div>
              )}
              <div className="meta">
                {m.status === 'failed' ? <span style={{ color: 'var(--danger)' }}>Failed to send</span> : m.status === 'sending' ? 'Sending…' : clock(m.at)}
              </div>
            </div>
          </Fragment>
        );
      })}
    </>
  );
}

/** Scrollable thread body that sticks to the bottom when messages are added. */
export function ThreadBody({ count, children, wallpaper }: { count: number; children: ReactNode; wallpaper?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = ref.current; if (el) el.scrollTop = el.scrollHeight; }, [count]);
  return (
    <div className={cx('thread', wallpaper && 'wallpaper')} ref={ref} style={wallpaper ? { backgroundImage: `url(${wallpaper})` } : undefined}>
      {children}
    </div>
  );
}

/* ---------------- composer ---------------- */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 720 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('bad image'));
      img.src = String(r.result);
    };
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export function Composer({ onSend, disabled, autoFocus }: { onSend: (m: { body?: string; image?: string }) => void; disabled?: boolean; autoFocus?: boolean }) {
  const [text, setText] = useState('');
  const ta = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus && window.innerWidth > 820) ta.current?.focus(); }, [autoFocus]);
  // The box grows with its text through CSS (field-sizing: content, min 40px, max 120px).
  // Fallback for browsers without it; skipped while hidden, when scrollHeight would be 0.
  useEffect(() => {
    const el = ta.current; if (!el || CSS.supports('field-sizing', 'content')) return;
    el.style.height = 'auto';
    if (el.scrollHeight > 0) el.style.height = Math.min(120, Math.max(40, el.scrollHeight)) + 'px';
  }, [text]);
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = text.trim();
    if (!v) return;
    onSend({ body: v });
    setText('');
    ta.current?.focus();
  };
  return (
    <form className="composer" autoComplete="off" onSubmit={submit}>
      <button type="button" className="icon-btn" title="Send a photo" onClick={() => file.current?.click()} disabled={disabled}><Icon name="image" /></button>
      <textarea ref={ta} rows={1} placeholder="Type a message" maxLength={1024} value={text} disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} />
      <button type="submit" className="send-btn" disabled={!text.trim() || disabled} aria-label="Send"><Icon name="send" /></button>
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        shrink(f).then((image) => onSend({ image, body: '' })).catch(() => toast("That image couldn't be opened."));
      }} />
    </form>
  );
}

/* ---------------- sending ---------------- */
/** A data: URL (from the photo picker) → a file for upload. */
function dataUrlToBlob(url: string): Blob {
  const [head, b64] = url.split(',');
  const type = /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Sends an SMS through the backend; the bubble shows "sending" until it answers. */
async function sendSms(threadId: string, m: Message) {
  const d = getData();
  const t = d.sms.find((x) => x.id === threadId);
  if (!t || !d.number) return;
  const files = m.image ? { media: dataUrlToBlob(m.image) } : undefined;
  const r = await wc<{ conversion?: SmsMessage[] }>('sendSms', {
    body: m.body, to_number: t.phone, from_number: d.number, to_username: t.name || undefined, is_media_attached: m.image ? '1' : '0',
  }, files);
  mutate((dd) => {
    const tt = dd.sms.find((x) => x.id === threadId);
    const i = tt?.messages.findIndex((x) => x.id === m.id) ?? -1;
    if (!tt || i < 0) return;
    const sent = r.ok ? r.data?.conversion?.map(mapMessage).at(-1) : undefined;
    tt.messages[i] = sent ? { ...sent, image: sent.image ?? m.image } : { ...m, status: r.ok ? 'sent' : 'failed' };
  });
  if (!r.ok) {
    const msg = r.code === 409 ? 'You don’t have enough coins to send this message. Add coins in the iPhone app.' : r.message || 'Please try again.';
    alertDialog('Message not sent', msg);
  }
  loadCredit();
}

/** Append an outgoing message (with the signature for SMS/broadcast) and send it. */
export function pushMsg(kind: ThreadKind, id: string, msg: { body?: string; image?: string | null }) {
  let body = msg.body || '';
  const sig = getData().settings.signature;
  if (kind !== 'chat' && body && sig && sig !== 'None') body += '\n\n— ' + sig;
  const m: Message = { id: 'm' + uid(), out: true, body, image: msg.image ?? null, at: Date.now(), status: 'sending' };
  mutate((d) => {
    const t = findThread(d, kind, id);
    if (t) t.messages.push(m);
  });
  if (kind === 'sms') return void sendSms(id, m);
  if (kind === 'broadcast') return void sendBroadcast(id, m);
  // App-to-app chat isn't connected yet (it runs on QuickBlox, coming with calling).
  setTimeout(() => mutate((d) => {
    const mm = findThread(d, kind, id)?.messages.find((x) => x.id === m.id);
    if (mm) mm.status = 'sent';
  }), 500);
}

async function sendBroadcast(id: string, m: Message) {
  const files = m.image ? { media: dataUrlToBlob(m.image) } : undefined;
  const r = await wc('sendBroadcast', { body: m.body, broadcast_id: id, is_media_attached: m.image ? '1' : '0' }, files);
  mutate((d) => {
    const mm = findThread(d, 'broadcast', id)?.messages.find((x) => x.id === m.id);
    if (mm) mm.status = r.ok ? 'sent' : 'failed';
  });
  if (!r.ok) alertDialog('Broadcast not sent', r.code === 409 ? 'You don’t have enough coins for every recipient. Add coins in the iPhone app.' : r.message || 'Please try again.');
  loadCredit();
}

/* ---------------- fake chat replies ---------------- */
const REPLIES = ['Haha nice 😄', 'Sounds good!', 'On my way', 'Sure, talk soon', '👍', 'Let me check and get back to you', 'Love it ❤️'];
let openChat: string | null = null;
export const setOpenChat = (id: string | null) => { openChat = id; };
export const useTyping = create<{ id: string | null }>()(() => ({ id: null }));

export function fakeReply(chatId: string) {
  setTimeout(() => { if (openChat === chatId) useTyping.setState({ id: chatId }); }, 700);
  setTimeout(() => {
    useTyping.setState((s) => (s.id === chatId ? { id: null } : s));
    mutate((d) => {
      const t = d.chats.find((c) => c.id === chatId);
      if (!t) return;
      let sender: string | null = null;
      if (t.group) {
        const g = d.groups.find((x) => x.id === t.groupId);
        const ids = g ? g.members.filter((m) => m !== 'me') : [];
        const p = d.contacts.find((c) => c.id === ids[Math.floor(Math.random() * ids.length)]);
        sender = p ? p.name : 'Friend';
      }
      t.messages.push({ id: 'm' + uid(), out: false, body: REPLIES[Math.floor(Math.random() * REPLIES.length)], at: Date.now(), status: 'sent', sender });
      if (openChat !== chatId) t.unread = (t.unread || 0) + 1;
    });
  }, 2200 + Math.random() * 1200);
}
