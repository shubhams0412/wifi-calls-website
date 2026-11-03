'use client';

/* Contacts tab: Friends | Phonebook lists, contact details, friends explainer, new contact. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type MouseEvent } from 'react';
import { Contact, uid } from '../data';
import { APP_NAME, cx, digits, fmtPhone, initial } from '../format';
import { Icon, IconName } from '../icons';
import { contactById, ensureChatWith, ensureSmsWith, friends, inviteText, mutate, useData } from '../store';
import { closeSheet, go, openBuyNumber, openSheet, placePhoneCall, shareText, startCall, toast } from '../ui';
import { Avatar, Empty, Placeholder, Seg, SheetHead } from '../components/ui';
import { SplitView } from '../components/Shell';
import { QbInfoView, UserInfoView } from './UserInfo';

function Chip({ icon, tint, title, onClick }: { icon: IconName; tint: string; title: string; onClick: () => void }) {
  return (
    <button className="circle-ic s32" style={{ ['--c' as string]: tint }} title={title} aria-label={title}
      onClick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); onClick(); }}>
      <Icon name={icon} />
    </button>
  );
}

/** Friend row (also used by the Dial tab's App Calls list). */
export function FriendRow({ f, active }: { f: Contact; active?: boolean }) {
  const hasName = /[A-Za-z]/.test(f.name);
  return (
    <Link className={cx('row', active && 'active')} href={'/app/contacts/friends/' + f.id}>
      <Avatar name={f.name} size={44} />
      <div className="body">
        <div className="t" style={{ fontSize: 15 }}>{f.name}</div>
        {hasName && <div className="s">{fmtPhone(f.phone)}</div>}
      </div>
      <span className="row-acts">
        <Chip icon="phone" tint="var(--success)" title="Free call" onClick={() => startCall({ kind: 'app', name: f.name, phone: f.phone })} />
        <Chip icon="video" tint="var(--accent)" title="Video call" onClick={() => startCall({ kind: 'video', name: f.name, phone: f.phone })} />
        <Chip icon="message" tint="var(--primary)" title="Chat" onClick={() => go('messages/chat/' + ensureChatWith(f))} />
      </span>
    </Link>
  );
}

function PhoneRow({ c, active }: { c: Contact; active?: boolean }) {
  return (
    <Link className={cx('row', active && 'active')} href={'/app/contacts/phonebook/' + c.id}>
      <Avatar name={c.name} size={40} />
      <div className="body">
        <div className="t" style={{ fontSize: 15 }}>{c.name}{c.friend && <> <span className="pill-tag">On app</span></>}</div>
        <div className="s">{fmtPhone(c.phone)}</div>
      </div>
      <span className="row-acts">
        <Chip icon="phone" tint="var(--success)" title="Call" onClick={() => placePhoneCall(c.phone, c.name)} />
        <Chip icon="message" tint="var(--primary)" title="Message" onClick={() => go('messages/sms/' + ensureSmsWith(c.phone, c.name))} />
      </span>
    </Link>
  );
}

function Rings({ icon }: { icon: IconName }) {
  return <div className="rings sm"><span className="grad-circle" style={{ width: 88, height: 88, fontSize: 34 }}><Icon name={icon} /></span></div>;
}

function PermissionCard({ denied }: { denied: boolean }) {
  const allow = () => mutate((d) => { d.contactsPermission = 'granted'; });
  if (denied) {
    return (
      <div className="card pad perm-card center">
        <Rings icon="lock" />
        <h3>Contacts are off</h3>
        <p className="muted">Turn on contacts in your browser settings to match friends already on {APP_NAME}.</p>
        <button className="btn btn-primary block" onClick={allow}>Try again <Icon name="arrowUpRight" /></button>
      </div>
    );
  }
  const lines: [IconName, string][] = [
    ['upload', 'Names and numbers are sent to our server to find your friends'],
    ['lock', 'We never share or store them'],
    ['history', 'Turn off anytime in Settings'],
  ];
  return (
    <div className="card pad perm-card center">
      <Rings icon="users" />
      <h3>Find your friends</h3>
      <p className="muted">Your contacts&apos; names and phone numbers are sent to the {APP_NAME} server only to check who&apos;s already here — they&apos;re not stored after this check.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0 8px' }}>
        {lines.map(([ic, t]) => (
          <div className="row-lite tiny" style={{ fontSize: 13, textAlign: 'left' }} key={t}>
            <span className="circle-ic" style={{ width: 26, height: 26, fontSize: 12, background: 'var(--accent-soft)' }}><Icon name={ic} /></span>{t}
          </div>
        ))}
      </div>
      <button className="btn btn-primary block" onClick={allow}>Continue <Icon name="arrowR" /></button>
    </div>
  );
}

function FriendsExplainer({ count }: { count: number }) {
  const rows: [IconName, string, string, string][] = [
    ['phone', 'var(--success)', 'Free calls and chat', 'Call, video call, and message your friends at no cost.'],
    ['lock', 'var(--accent)', 'Private and secure', 'Your contacts are kept private and never shared.'],
    ['share', 'var(--primary)', 'Invite anyone', 'Bring more friends over to connect for free.'],
  ];
  return (
    <>
      <div className="sheet-head"><span style={{ flex: 1 }} /><button className="icon-btn plain" onClick={closeSheet} aria-label="Close"><Icon name="x" /></button></div>
      <div className="sheet-body center" style={{ alignItems: 'center' }}>
        <div className="rings sm" style={{ position: 'relative' }}>
          <span className="grad-circle" style={{ width: 80, height: 80, fontSize: 32 }}><Icon name="users" /></span>
          <span className="badge" style={{ position: 'absolute', top: 8, right: 8, background: 'var(--success)' }}>{count}</span>
        </div>
        <h3 style={{ margin: 0, fontSize: 20 }}>Friends on {APP_NAME}</h3>
        <p className="muted" style={{ margin: 0 }}>Your friends who use {APP_NAME} show up here so you can reach them for free.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', textAlign: 'left' }}>
          {rows.map(([ic, tint, t, s]) => (
            <div className="card pad row-lite" style={{ boxShadow: 'none', border: '1px solid var(--hairline)' }} key={t}>
              <span className="circle-ic" style={{ ['--c' as string]: tint }}><Icon name={ic} /></span>
              <div><div style={{ fontWeight: 600 }}>{t}</div><div className="tiny muted" style={{ fontSize: 13 }}>{s}</div></div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary block" onClick={() => shareText(inviteText())}>Invite a friend</button>
      </div>
    </>
  );
}

function NewContactSheet() {
  const [f, setF] = useState({ first: '', last: '', company: '', phone: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const name = `${f.first} ${f.last}`.trim();
    const ph = digits(f.phone);
    if (!name && !ph) { toast('Add a name or a phone number.'); return; }
    if (ph && ph.length < 7) { toast('Enter a valid phone number.'); return; }
    const c: Contact = { id: 'c' + uid(), name: name || fmtPhone(ph), phone: ph.length === 10 ? '+1' + ph : '+' + ph, friend: false };
    mutate((d) => { d.contacts.push(c); });
    closeSheet();
    toast('Contact saved');
    go('contacts/phonebook/' + c.id);
  };
  return (
    <>
      <SheetHead title="New Contact" />
      <form className="sheet-body" onSubmit={save}>
        <div className="center"><span className="avatar s88" style={{ margin: '0 auto', background: '#94A3D6', ['--s' as string]: '88px' }}><Icon name="user" /></span></div>
        <div className="group">
          <input className="item input-plain" placeholder="First name" value={f.first} onChange={set('first')} autoFocus />
          <input className="item input-plain" placeholder="Last name" value={f.last} onChange={set('last')} />
          <input className="item input-plain" placeholder="Company" value={f.company} onChange={set('company')} />
          <input className="item input-plain" placeholder="Phone" inputMode="tel" value={f.phone} onChange={set('phone')} />
        </div>
        <button className="btn btn-primary block" type="submit"><Icon name="check" /> Save contact</button>
      </form>
    </>
  );
}

export default function ContactsTab({ rest }: { rest: string[] }) {
  const d = useData();
  const pathname = usePathname();
  const pb = rest[0] === 'phonebook';
  const [q, setQ] = useState('');
  useEffect(() => { setQ(''); }, [pb]);

  const s = q.trim().toLowerCase();
  const match = (c: Contact) => !s || c.name.toLowerCase().includes(s) || (!!digits(s) && digits(c.phone).includes(digits(s)));
  const fr = friends(d);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  let body;
  if (pb) {
    const all = [...d.contacts].sort((a, b) => a.name.localeCompare(b.name));
    const items = all.filter(match);
    if (!all.length) body = <Empty icon="user" title="No phonebook contacts" sub="Add contacts to see them here." />;
    else if (!items.length) body = <Empty icon="userQ" title="No matches" sub="Try a different name or number." />;
    else {
      let letter = '';
      body = (
        <>
          <div className="count-line">{items.length} contact{items.length === 1 ? '' : 's'}</div>
          <div className="list">
            {items.map((c) => {
              const l = initial(c.name) || '#';
              const head = l !== letter ? <div className="letter">{l}</div> : null;
              letter = l;
              return <div key={c.id} style={{ display: 'contents' }}>{head}<PhoneRow c={c} active={isActive('/app/contacts/phonebook/' + c.id)} /></div>;
            })}
          </div>
        </>
      );
    }
  } else if (d.contactsPermission !== 'granted') {
    body = <div className="content" style={{ paddingTop: 4 }}><PermissionCard denied={d.contactsPermission === 'denied'} /></div>;
  } else if (!fr.length) {
    body = (
      <div className="content" style={{ paddingTop: 4 }}>
        <div className="card no-friends">
          <div className="nf-top">
            <div className="net">
              <span className="hub"><Icon name="user" /></span>
              {[0, 1, 2, 3, 4].map((i) => <span key={i} className={cx('sat2', 'n' + i, i % 2 === 1 && 'dash')}><Icon name={i % 2 ? 'plus' : 'user'} /></span>)}
            </div>
          </div>
          <div className="pad" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>No friends here yet</h3>
            <p className="muted" style={{ margin: 0 }}>None of your contacts are on {APP_NAME} so far. Send an invite — once they join, you&apos;ll see them here and can talk free.</p>
            <div className="row-lite" style={{ gap: 6 }}>
              <span className="chip soft"><Icon name="phone" /> Calls</span><span className="chip soft"><Icon name="video" /> Video</span><span className="chip soft"><Icon name="message" /> Chat</span>
            </div>
            <button className="btn btn-primary block" onClick={() => shareText(inviteText())}><Icon name="share" /> Invite friends</button>
          </div>
        </div>
        {!d.number && (
          <button className="btn btn-ghost block" style={{ border: '1.5px solid color-mix(in srgb,var(--primary) 25%,transparent)' }} onClick={openBuyNumber}>
            <Icon name="phonePlus" /> Get a phone number
          </button>
        )}
      </div>
    );
  } else {
    const items = fr.filter(match);
    body = items.length ? (
      <>
        <div className="count-line">{fr.length} friend{fr.length === 1 ? '' : 's'} on {APP_NAME}</div>
        <div className="list">{items.map((f) => <FriendRow key={f.id} f={f} active={isActive('/app/contacts/friends/' + f.id)} />)}</div>
      </>
    ) : <Empty icon="userQ" title="No matches" sub="Try a different name or number." />;
  }

  const right = pb
    ? <button className="icon-btn grad" onClick={() => openSheet(<NewContactSheet />)} title="New contact" aria-label="New contact"><Icon name="plus" /></button>
    : fr.length ? <button className="icon-btn" onClick={() => openSheet(<FriendsExplainer count={fr.length} />)} title="About friends" aria-label="About friends"><Icon name="info" /></button> : null;

  const list = (
    <>
      <div className="phead"><h1>Contacts</h1><div className="actions">{right}</div></div>
      <Seg items={[{ value: 'friends', label: 'Friends' }, { value: 'phonebook', label: 'Phonebook' }]} value={pb ? 'phonebook' : 'friends'}
        hrefs={{ friends: 'contacts', phonebook: 'contacts/phonebook' }} />
      {(pb || d.contactsPermission === 'granted') && (
        <div className="search"><Icon name="search" /><input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      )}
      <div className="scroll">{body}</div>
    </>
  );

  // detail
  let detail;
  let open = false;
  if ((rest[0] === 'friends' || rest[0] === 'phonebook') && rest[1]) {
    open = true;
    const c = contactById(d, rest[1]);
    if (!c) detail = <Placeholder icon="user" title="Contact not found" />;
    else if (rest[0] === 'friends' && c.friend) detail = <QbInfoView contact={c} />;
    else detail = <UserInfoView contact={c} back={rest[0] === 'friends' ? 'contacts' : 'contacts/phonebook'} />;
  } else if (rest[0] === 'number' && rest[1]) {
    open = true;
    detail = <UserInfoView contact={{ name: '', phone: rest[1] }} back="contacts/phonebook" />;
  } else {
    detail = pb
      ? <Placeholder icon="book" title="Your phonebook" sub="Call or text any contact from your private number." />
      : <Placeholder icon="users" title={'Friends on ' + APP_NAME} sub="Friends who use the app can call, video call and chat with you for free." />;
  }

  return <SplitView list={list} detail={detail} open={open} />;
}
