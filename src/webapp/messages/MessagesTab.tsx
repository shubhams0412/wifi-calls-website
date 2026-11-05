'use client';

/* Messages tab: SMS | Chat inbox + every messages route.
   /app/messages                 SMS inbox         /app/messages/sms/:id|new     SMS thread / New Message
   /app/messages/chat            Chat inbox        /app/messages/chat/:id        chat thread
   /app/messages/broadcasts[/id|new]               /app/messages/groups[/id]     group info */
import Link from 'next/link';
import { useState } from 'react';
import { cx, digits, when } from '../format';
import { Icon } from '../icons';
import { openChatWith } from '../chat';
import { lastAt, lastMsg, nameFor, useData } from '../store';
import { go, openBuyNumber } from '../ui';
import { Avatar, Empty, Placeholder, Seg } from '../components/ui';
import { SplitView } from '../components/Shell';
import { openFriendPicker } from '../components/pickers';
import { ImageViewer, Preview } from './shared';
import { ChatThreadView, NewSmsView, SmsThreadView } from './Threads';
import { BroadcastCompose, BroadcastPane, BroadcastThread, newBroadcast } from './Broadcasts';
import { GroupInfo, GroupPane } from './Groups';

type SegKey = 'sms' | 'chat';

function InboxRow({ href, name, preview, at, unread, avatar, active }: {
  href: string; name: string; preview: React.ReactNode; at: number; unread: number; avatar: React.ReactNode; active: boolean;
}) {
  return (
    <Link className={cx('row inbox', unread > 0 && 'unread', active && 'active')} href={href}>
      {avatar}
      <div className="body">
        <div className="line1"><span className="t">{name}</span><span className="time">{at ? when(at) : ''}</span></div>
        <div className="line2"><span className="s">{preview}</span>{unread > 0 && <span className="badge grad">{unread}</span>}</div>
      </div>
    </Link>
  );
}

function Inbox({ seg, activeId }: { seg: SegKey; activeId?: string }) {
  const d = useData();
  const [q, setQ] = useState('');
  const s = q.trim().toLowerCase();
  const sms = seg === 'sms';

  let rows: React.ReactNode;
  if (sms) {
    const items = [...d.sms].sort((a, b) => lastAt(b) - lastAt(a)).filter((c) => {
      if (!s) return true;
      const n = (c.name || nameFor(d, c.phone, '')).toLowerCase();
      return n.includes(s) || (!!digits(s) && digits(c.phone).includes(digits(s))) || c.messages.some((m) => (m.body || '').toLowerCase().includes(s));
    });
    rows = !d.sms.length ? <Empty icon="message" title="No SMS yet" sub="Tap the pencil button to start your first SMS conversation." />
      : !items.length ? <Empty icon="search" title="No matches" sub="Try a different name, number or word." />
      : (
        <div className="list">
          {items.map((c) => {
            const name = c.name || nameFor(d, c.phone, '');
            return <InboxRow key={c.id} href={'/app/messages/sms/' + c.id} name={name} preview={<Preview m={lastMsg(c)} />} at={lastAt(c)}
              unread={c.unread} avatar={<Avatar name={name} size={56} />} active={activeId === c.id} />;
          })}
        </div>
      );
  } else {
    const items = [...d.chats].sort((a, b) => lastAt(b) - lastAt(a))
      .filter((c) => !s || c.name.toLowerCase().includes(s) || c.messages.some((m) => (m.body || '').toLowerCase().includes(s)));
    rows = !d.chats.length ? (
      <div className="empty"><div className="m" style={{ fontSize: 22 }}>No chat found</div><div className="sub">Start a chat to see it here</div></div>
    ) : !items.length ? <Empty icon="search" title="No matches" /> : (
      <div className="list">
        {items.map((c) => {
          const m = lastMsg(c);
          const prefix = c.group && m && !m.out && m.sender ? m.sender.split(' ')[0] + ': ' : undefined;
          return <InboxRow key={c.id} href={'/app/messages/chat/' + c.id} name={c.name} preview={<Preview m={m} prefix={prefix} />} at={lastAt(c)}
            unread={c.unread} avatar={<Avatar name={c.name} size={56} group={c.group} />} active={activeId === c.id} />;
        })}
      </div>
    );
  }

  const newChat = () => openFriendPicker({ title: 'Pick a friend' }, ([f]) => { if (f) openChatWith(f); });

  return (
    <>
      <div className="phead">
        <h1>Messages</h1>
        <div className="actions">
          {sms
            ? <Link className="icon-btn" href="/app/messages/broadcasts" title="Broadcasts"><Icon name="megaphone" /></Link>
            : <Link className="icon-btn" href="/app/messages/groups" title="Groups"><Icon name="users" /></Link>}
          <button className="icon-btn grad" title="New message" onClick={sms ? () => go('messages/sms/new') : newChat}><Icon name="compose" /></button>
        </div>
      </div>
      {!d.number && (
        <div style={{ padding: '0 20px 10px' }}>
          <button className="chip soft" style={{ fontSize: 13, padding: '8px 14px' }} onClick={openBuyNumber}>
            <Icon name="phonePlus" /> Get a phone number <Icon name="arrowR" />
          </button>
        </div>
      )}
      <Seg items={[{ value: 'sms', label: 'SMS' }, { value: 'chat', label: 'Chat' }]} value={seg} hrefs={{ sms: 'messages', chat: 'messages/chat' }} />
      <div className="search"><Icon name="search" /><input placeholder="Search messages" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="scroll">{rows}</div>
    </>
  );
}

export default function MessagesTab({ rest }: { rest: string[] }) {
  const [a, b] = rest;
  let section: 'sms' | 'chat' | 'broadcasts' | 'groups' = 'sms';
  if (a === 'chat') section = 'chat';
  else if (a === 'broadcasts') section = 'broadcasts';
  else if (a === 'groups') section = 'groups';

  // List pane — keyed by section so its search/scroll survive detail changes but reset per segment.
  const list =
    section === 'broadcasts' ? <BroadcastPane key="bc" activeId={b} />
    : section === 'groups' ? <GroupPane key="gr" activeId={b} />
    : <Inbox key={section} seg={section} activeId={b} />;

  let detail: React.ReactNode;
  let open = !!b;
  if (a === 'sms' && b) detail = b === 'new' ? <NewSmsView /> : <SmsThreadView id={b} />;
  else if (a === 'chat' && b) detail = <ChatThreadView id={b} />;
  else if (a === 'broadcasts' && b) detail = b === 'new' ? <BroadcastCompose /> : <BroadcastThread id={b} />;
  else if (a === 'groups' && b) detail = <GroupInfo id={b} />;
  else {
    open = false;
    if (section === 'broadcasts') {
      detail = (
        <>
          <Placeholder icon="megaphone" title="Broadcasts" sub="Send one SMS to many people at once. Each recipient gets it privately." />
          <div className="center" style={{ paddingBottom: 40 }}>
            <button className="btn btn-primary sm" onClick={newBroadcast}><Icon name="compose" /> New broadcast</button>
          </div>
        </>
      );
    } else if (section === 'groups') {
      detail = <Placeholder icon="group" title="Groups" sub="Chat and call with several friends at once — free over the internet." />;
    } else if (section === 'chat') {
      detail = <Placeholder icon="messages" title="Free app-to-app chat" sub="Pick a conversation, or start one with the pencil button." />;
    } else {
      detail = <Placeholder icon="message" title="Text anyone from your number" sub="Pick a conversation on the left, or tap the pencil to start a new SMS." />;
    }
  }

  return (
    <>
      <SplitView list={list} detail={detail} open={open} />
      <ImageViewer />
    </>
  );
}
