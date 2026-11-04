'use client';

/* Broadcast list, compose and thread (BroadcastListView / BroadcastComposeView). */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { wc } from '../api';
import { loadBroadcastMessages, loadBroadcasts } from '../sync';
import { AppData, Broadcast } from '../data';
import { cx, fmtPhone, when } from '../format';
import { Icon } from '../icons';
import { alertDialog, canSendSms, go, openBuyNumber, requirePro, toast } from '../ui';
import { contactById, getData, lastMsg, mutate, useData } from '../store';
import { Avatar, Empty, Placeholder, Spinner, TopBar } from '../components/ui';
import { openContactPicker } from '../components/pickers';
import { Bubbles, Composer, fontPx, Preview, pushMsg, ThreadBody } from './shared';
import { deleteThread } from './Threads';

export function recipientsName(d: AppData, b: Broadcast) {
  if (b.title) return b.title;
  const n = (b.recipients || []).map((id) => contactById(d, id)?.name.split(' ')[0] ?? '').filter(Boolean);
  return n.length ? n.join(', ') : 'Broadcast';
}

export function newBroadcast() {
  if (!requirePro()) return;
  if (!getData().number) { toast('Get a phone number first to send broadcasts.'); openBuyNumber(); return; }
  go('messages/broadcasts/new');
}

export function BroadcastPane({ activeId }: { activeId?: string }) {
  const d = useData();
  useEffect(() => { loadBroadcasts(); }, []);
  return (
    <>
      <div className="topbar">
        <Link className="back" href="/app/messages" aria-label="Back"><Icon name="chevL" /></Link>
        <div className="title">Broadcast</div>
        <button className="icon-btn grad" title="New broadcast" onClick={newBroadcast}><Icon name="compose" /></button>
      </div>
      <div className="scroll" style={{ paddingTop: 12 }}>
        {d.broadcasts.length ? (
          <div className="list">
            {d.broadcasts.map((b) => {
              const m = lastMsg(b);
              return (
                <Link key={b.id} className={cx('row', activeId === b.id && 'active')} href={'/app/messages/broadcasts/' + b.id}>
                  <Avatar size={44} solid icon="megaphone" />
                  <div className="body"><div className="t" style={{ fontSize: 15 }}>{recipientsName(d, b)}</div><div className="s"><Preview m={m} empty="" /></div></div>
                  <span className="time">{m ? when(m.at) : ''}</span>
                </Link>
              );
            })}
          </div>
        ) : <Empty icon="megaphone" title="No broadcasts yet" sub="Send one message to many people — each gets a private SMS." />}
      </div>
    </>
  );
}

export function BroadcastCompose() {
  const d = useData();
  const [recipients, setRecipients] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = recipients.length > 0 && !!text.trim();
  const send = () => {
    if (!canSendSms()) return;
    const people = recipients.map((id) => contactById(d, id)).filter((c): c is NonNullable<typeof c> => !!c);
    if (!d.number) return toast('Get a number first to send broadcasts.');
    setBusy(true);
    wc<{ broadcast?: { id: string | number; receipants_name?: string } }>('createBroadcast', {
      to_numbers: people.map((c) => c.phone).join(','), from_number: d.number, to_username: people.map((c) => c.name).join(','),
    }).then((r) => {
      setBusy(false);
      const id = r.data?.broadcast?.id;
      if (!r.ok || id == null) return alertDialog('Couldn’t create the broadcast', r.code === 403 ? 'Broadcasts are a Pro feature. Upgrade in the iPhone app.' : r.message || 'Please try again.');
      const b: Broadcast = { id: String(id), recipients, title: r.data?.broadcast?.receipants_name, messages: [] };
      mutate((dd) => { dd.broadcasts.unshift(b); });
      pushMsg('broadcast', b.id, { body: text.trim() });
      go('messages/broadcasts/' + b.id);
    });
  };
  return (
    <>
      <TopBar title="New broadcast" rootBack back="messages/broadcasts" />
      <div className="scroll">
        <div className="content narrow">
          <div className="card pad row-lite">
            <span className="grad-circle" style={{ width: 54, height: 54, fontSize: 22 }}><Icon name="megaphone" /></span>
            <div>
              <div style={{ fontWeight: 700 }}>Send one message</div>
              <div className="tiny muted" style={{ fontSize: 13 }}>Pick recipients, write your text — they each get a private SMS.</div>
            </div>
          </div>
          <div className="card pad">
            <div className="card-h">
              <Icon name="users" /> RECIPIENTS {recipients.length > 0 && <span className="badge grad">{recipients.length}</span>}
              <span className="grow" />
              <button className="chip on" onClick={() => openContactPicker({ multi: true, title: 'Pick contacts', selected: recipients }, (list) => setRecipients(list.map((c) => c.id)))}>
                <Icon name="plus" /> Add
              </button>
            </div>
            {recipients.length ? recipients.map((id) => {
              const c = contactById(d, id);
              if (!c) return null;
              return (
                <div className="rcpt" key={id}>
                  <Avatar name={c.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div><div className="mono tiny muted">{fmtPhone(c.phone)}</div></div>
                  <button className="rm" aria-label="Remove" onClick={() => setRecipients((r) => r.filter((x) => x !== id))}><Icon name="x" /></button>
                </div>
              );
            }) : (
              <div className="row-lite muted" style={{ fontSize: 14, padding: '6px 0' }}>
                <span className="circle-ic" style={{ background: 'var(--accent-soft)' }}><Icon name="contactPlus" /></span>
                Tap Add to pick contacts you want to broadcast to.
              </div>
            )}
          </div>
          <div className="card pad">
            <div className="card-h"><Icon name="message" /> MESSAGE<span className="grow" /><span className="chip soft mono" style={{ fontSize: 11 }}>{text.length}</span></div>
            <textarea className="input" style={{ minHeight: 140 }} placeholder="Type your broadcast message here…" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <button className="btn btn-primary block" disabled={!ok || busy} onClick={send}>
            {busy ? <><Spinner white /> Sending…</> : <><Icon name="send" /> Send broadcast</>}
          </button>
        </div>
      </div>
    </>
  );
}

export function BroadcastThread({ id }: { id: string }) {
  const d = useData();
  useEffect(() => { loadBroadcastMessages(id); }, [id]);
  const b = d.broadcasts.find((x) => x.id === id);
  if (!b) return <Placeholder icon="megaphone" title="Broadcast not found" />;
  const name = recipientsName(d, b);
  return (
    <>
      <TopBar title={name} rootBack back="messages/broadcasts" right={
        <button className="icon-btn plain" title="Delete" onClick={() => deleteThread('broadcast', b.id)}><Icon name="trash" /></button>
      } />
      <ThreadBody count={b.messages.length}>
        <Bubbles messages={b.messages} allOut name={name} fontSize={fontPx(d)} hint="Each recipient gets a private SMS." />
      </ThreadBody>
      <Composer key={b.id} onSend={(m) => { if (canSendSms()) pushMsg('broadcast', b.id, m); }} autoFocus />
    </>
  );
}
