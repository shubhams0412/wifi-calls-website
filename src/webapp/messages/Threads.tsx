'use client';

/* SMS thread, New Message, app-to-app chat thread + their menus. */
import { useEffect, useState } from 'react';
import { fmtPhone, fmtTyping, digits } from '../format';
import { Icon } from '../icons';
import { contactById, contactByPhone, country, getData, isBlocked, mutate, nameFor, useData } from '../store';
import { canSendSms, closeSheet, confirmDialog, go, openSheet, placePhoneCall, startCall, toast } from '../ui';
import { Placeholder, SheetHead, TopBar } from '../components/ui';
import { openContactPicker, openCountryPicker } from '../components/pickers';
import { Bubbles, Composer, fakeReply, fontPx, pushMsg, setOpenChat, ThreadBody, ThreadKind, useTyping } from './shared';

/* ---------------- block / unblock / delete ---------------- */
export function blockNumber(phone: string) {
  mutate((d) => { d.blocked.push({ phone, name: contactByPhone(d, phone)?.name ?? '' }); });
  toast('Number blocked');
}
export function unblockNumber(phone: string) {
  const p = digits(phone).slice(-10);
  mutate((d) => { d.blocked = d.blocked.filter((b) => digits(b.phone).slice(-10) !== p); });
  toast('Number unblocked');
}
export async function deleteThread(kind: ThreadKind, id: string) {
  closeSheet();
  const ok = await confirmDialog({ title: 'Delete conversation?', message: 'This removes all messages in this thread.', ok: 'Delete', danger: true });
  if (!ok) return;
  mutate((d) => {
    if (kind === 'sms') d.sms = d.sms.filter((t) => t.id !== id);
    if (kind === 'chat') d.chats = d.chats.filter((t) => t.id !== id);
    if (kind === 'broadcast') d.broadcasts = d.broadcasts.filter((t) => t.id !== id);
  });
  go(kind === 'chat' ? 'messages/chat' : kind === 'broadcast' ? 'messages/broadcasts' : 'messages');
}

function SmsMenu({ id }: { id: string }) {
  const d = useData();
  const t = d.sms.find((x) => x.id === id);
  if (!t) return null;
  const blocked = isBlocked(d, t.phone);
  const info = () => {
    closeSheet();
    const c = contactByPhone(d, t.phone);
    go(c ? `contacts/${c.friend ? 'friends' : 'phonebook'}/${c.id}` : 'contacts/number/' + encodeURIComponent(t.phone));
  };
  return (
    <>
      <SheetHead title={t.name || fmtPhone(t.phone)} />
      <div className="sheet-body">
        <div className="group">
          <button className="item" onClick={info}><span className="tile-ic"><Icon name="infoCircle" /></span><span className="lbl">Contact info</span></button>
          <button className="item" onClick={() => { closeSheet(); if (blocked) unblockNumber(t.phone); else blockNumber(t.phone); }}>
            <span className="tile-ic" style={{ ['--c' as string]: `var(--${blocked ? 'success' : 'danger'})` }}><Icon name={blocked ? 'checkCircle' : 'nosign'} /></span>
            <span className="lbl">{blocked ? 'Unblock' : 'Block'}</span>
          </button>
          <button className="item danger" onClick={() => deleteThread('sms', t.id)}>
            <span className="tile-ic" style={{ ['--c' as string]: 'var(--danger)' }}><Icon name="trash" /></span><span className="lbl">Delete conversation</span>
          </button>
        </div>
      </div>
    </>
  );
}

/** Mark a thread read when it opens (sidebar badge follows the store). */
function useMarkRead(kind: 'sms' | 'chat', id: string, unread: number | undefined) {
  useEffect(() => {
    if (!unread) return;
    mutate((d) => {
      const t = kind === 'sms' ? d.sms.find((x) => x.id === id) : d.chats.find((x) => x.id === id);
      if (t) t.unread = 0;
    });
  }, [kind, id, unread]);
}

export function SmsThreadView({ id }: { id: string }) {
  const d = useData();
  const t = d.sms.find((x) => x.id === id);
  useMarkRead('sms', id, t?.unread);
  if (!t) return <Placeholder icon="message" title="Conversation not found" />;
  const name = t.name || nameFor(d, t.phone, '') || fmtPhone(t.phone);
  const blocked = isBlocked(d, t.phone);
  const send = (m: { body?: string; image?: string }) => {
    if (!canSendSms()) return;
    if (isBlocked(getData(), t.phone)) { toast('Unblock this number to send messages.'); return; }
    pushMsg('sms', t.id, m);
  };
  return (
    <>
      <TopBar title={name} rootBack back="messages" right={<>
        <button className="icon-btn" title="Call" onClick={() => placePhoneCall(t.phone, t.name)}><Icon name="phone" /></button>
        <button className="icon-btn plain" title="More" onClick={() => openSheet(<SmsMenu id={t.id} />)}><Icon name="more" /></button>
      </>} />
      <ThreadBody count={t.messages.length}>
        <Bubbles messages={t.messages} name={name} fontSize={fontPx(d)} hint={'SMS from ' + (d.number ? fmtPhone(d.number) : 'your number')} />
      </ThreadBody>
      {blocked && (
        <div className="blocked-bar"><Icon name="nosign" /> You have blocked this number
          <button className="link-btn" onClick={() => unblockNumber(t.phone)}>Unblock</button>
        </div>
      )}
      <Composer key={t.id} onSend={send} disabled={blocked} autoFocus />
    </>
  );
}

export function NewSmsView() {
  const d = useData();
  const [cc, setCc] = useState('US');
  const [phone, setPhone] = useState('');
  const c = country(cc);
  const send = (m: { body?: string; image?: string }) => {
    const n = digits(phone);
    if (n.length < 7) { toast('Enter a valid phone number to message.'); return; }
    if (!canSendSms()) return;
    const full = c.dial + n;
    const p10 = digits(full).slice(-10);
    let t = getData().sms.find((x) => digits(x.phone).slice(-10) === p10);
    if (!t) {
      t = { id: 's' + Date.now().toString(36), phone: full, name: contactByPhone(getData(), full)?.name || '', unread: 0, messages: [] };
      const nt = t;
      mutate((dd) => { dd.sms.unshift(nt); });
    }
    pushMsg('sms', t.id, m);
    go('messages/sms/' + t.id);
  };
  return (
    <>
      <TopBar title="New Message" rootBack back="messages" />
      <div className="to-bar">
        <span className="faint">To</span>
        <button className="country-pill" onClick={() => openCountryPicker(cc, (x) => setCc(x.code))}>{c.flag} <b>{c.dial}</b> <Icon name="chevD" /></button>
        <input inputMode="tel" placeholder="Phone number" autoFocus value={fmtTyping(phone)} onChange={(e) => setPhone(digits(e.target.value).slice(0, 15))} />
        <button className="icon-btn plain" style={{ color: 'var(--primary)' }} title="Pick from contacts"
          onClick={() => openContactPicker({ title: 'Pick contact' }, ([ct]) => {
            if (!ct) return;
            const n = digits(ct.phone);
            setCc('US');
            setPhone(n.length === 11 && n[0] === '1' ? n.slice(1) : n);
          })}><Icon name="contactPlus" /></button>
      </div>
      <ThreadBody count={0}>
        <Bubbles messages={[]} name="New Message" fontSize={fontPx(d)} hint="Enter a number above, then type your message." />
      </ThreadBody>
      <Composer onSend={send} />
    </>
  );
}

function ChatMenu({ id }: { id: string }) {
  const d = useData();
  const t = d.chats.find((x) => x.id === id);
  if (!t) return null;
  const to = (p: string) => { closeSheet(); go(p); };
  return (
    <>
      <SheetHead title={t.name} />
      <div className="sheet-body">
        <div className="group">
          <button className="item" onClick={() => to(t.group ? 'messages/groups/' + t.groupId : 'contacts/friends/' + t.friendId)}>
            <span className="tile-ic"><Icon name="infoCircle" /></span><span className="lbl">{t.group ? 'Group info' : 'User details'}</span>
          </button>
          <button className="item" onClick={() => to('settings/chat')}>
            <span className="tile-ic" style={{ ['--c' as string]: 'var(--accent)' }}><Icon name="palette" /></span><span className="lbl">Chat settings</span>
          </button>
          <button className="item danger" onClick={() => deleteThread('chat', t.id)}>
            <span className="tile-ic" style={{ ['--c' as string]: 'var(--danger)' }}><Icon name="trash" /></span><span className="lbl">Delete chat</span>
          </button>
        </div>
      </div>
    </>
  );
}

export function ChatThreadView({ id }: { id: string }) {
  const d = useData();
  const t = d.chats.find((x) => x.id === id);
  const typing = useTyping((s) => s.id === id);
  useMarkRead('chat', id, t?.unread);
  useEffect(() => { setOpenChat(id); return () => setOpenChat(null); }, [id]);
  if (!t) return <Placeholder icon="messages" title="Chat not found" />;

  const call = () => {
    if (t.group) {
      const g = d.groups.find((x) => x.id === t.groupId);
      startCall({ kind: 'group', name: t.name, members: g ? g.members : [] });
      return;
    }
    const f = contactById(d, t.friendId);
    startCall({ kind: 'app', name: t.name, phone: f ? f.phone : '' });
  };
  const video = () => { const f = contactById(d, t.friendId); startCall({ kind: 'video', name: t.name, phone: f ? f.phone : '' }); };
  const send = (m: { body?: string; image?: string }) => { pushMsg('chat', t.id, m); fakeReply(t.id); };

  return (
    <>
      <TopBar title={t.name} rootBack back="messages/chat" right={<>
        <button className="icon-btn" title="Voice call" onClick={call}><Icon name="phone" /></button>
        {t.group
          ? <button className="icon-btn plain" title="Group info" onClick={() => go('messages/groups/' + t.groupId)}><Icon name="infoCircle" /></button>
          : <button className="icon-btn" title="Video call" onClick={video}><Icon name="video" /></button>}
        <button className="icon-btn plain" title="More" onClick={() => openSheet(<ChatMenu id={t.id} />)}><Icon name="more" /></button>
      </>} />
      <ThreadBody count={t.messages.length} wallpaper={d.settings.chatBg}>
        <Bubbles messages={t.messages} group={t.group} groupAvatar={t.group} name={t.name} fontSize={fontPx(d)}
          hint={t.group ? 'Say hi to the group 👋' : 'Free chat over the internet'} />
      </ThreadBody>
      {typing && <div className="typing">typing…</div>}
      <Composer key={t.id} onSend={send} autoFocus />
    </>
  );
}
