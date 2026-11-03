'use client';

/* Groups: list (GroupListView), create (CreateGroupView, 2-step sheet), info (GroupInfoView). */
import Link from 'next/link';
import { useState } from 'react';
import { ChatThread, Group, uid } from '../data';
import { APP_NAME, cx, fmtPhone } from '../format';
import { Icon } from '../icons';
import { contactById, displayName, ensureChatWith, friends, getData, lastMsg, mutate, useData } from '../store';
import { closeSheet, confirmDialog, go, openSheet, promptDialog, requirePro, shareText, startCall, toast } from '../ui';
import { Avatar, Empty, Placeholder, TopBar } from '../components/ui';
import { openFriendPicker } from '../components/pickers';

/** Open (creating if needed) the group's chat thread. */
export function openGroupChat(groupId: string) {
  const g = getData().groups.find((x) => x.id === groupId);
  if (!g) return;
  let dialog = g.dialog;
  if (!dialog) {
    const t: ChatThread = { id: 'd' + uid(), name: g.name, group: true, groupId: g.id, unread: 0, messages: [], created: Date.now() };
    dialog = t.id;
    mutate((d) => { d.chats.unshift(t); const gg = d.groups.find((x) => x.id === groupId); if (gg) gg.dialog = t.id; });
  }
  go('messages/chat/' + dialog);
}

export function newGroup() {
  if (!requirePro()) return;
  openSheet(<CreateGroupSheet />);
}

export function GroupPane({ activeId }: { activeId?: string }) {
  const d = useData();
  const [q, setQ] = useState('');
  const s = q.trim().toLowerCase();
  const items = d.groups.filter((g) => !s || g.name.toLowerCase().includes(s));
  return (
    <>
      <div className="topbar">
        <Link className="back" href="/app/messages/chat" aria-label="Back"><Icon name="chevL" /></Link>
        <div className="title">Group</div>
        <button className="icon-btn grad" title="Create group" onClick={newGroup}><Icon name="plus" /></button>
      </div>
      <div className="search" style={{ marginTop: 12 }}><Icon name="search" /><input placeholder="Search groups" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="scroll">
        {!d.groups.length ? (
          <Empty icon="group" title="No groups yet" bare>
            <button className="btn btn-primary sm" onClick={newGroup}>Create a group</button>
          </Empty>
        ) : !items.length ? <Empty icon="search" title="No matching groups" /> : (
          <div className="list">
            {items.map((g) => {
              const t = g.dialog ? d.chats.find((c) => c.id === g.dialog) : undefined;
              const m = t && lastMsg(t);
              return (
                <div key={g.id} className={cx('row clickable', activeId === g.id && 'active')} role="button" tabIndex={0}
                  onClick={() => openGroupChat(g.id)} onKeyDown={(e) => { if (e.key === 'Enter') openGroupChat(g.id); }}>
                  <Avatar name={g.name} size={56} group />
                  <div className="body">
                    <div className="t">{g.name}</div>
                    <div className="s">{m ? (m.image ? '📷 Photo' : m.body) : <><Icon name="users" /> {g.members.length} members</>}</div>
                  </div>
                  {t && t.unread > 0 && <span className="badge grad">{t.unread}</span>}
                  <Link className="circle-ic s32" style={{ background: 'var(--accent-soft)' }} href={'/app/messages/groups/' + g.id} title="Group info" onClick={(e) => e.stopPropagation()}>
                    <Icon name="info" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function CreateGroupSheet() {
  const d = useData();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const create = () => {
    if (!name.trim() || !members.length) return;
    const g: Group = { id: 'g' + uid(), name: name.trim(), admin: true, members: ['me', ...members], dialog: null };
    const t: ChatThread = { id: 'd' + uid(), name: g.name, group: true, groupId: g.id, unread: 0, messages: [], created: Date.now() };
    g.dialog = t.id;
    mutate((dd) => { dd.groups.unshift(g); dd.chats.unshift(t); });
    closeSheet();
    toast('Group created');
    go('messages/chat/' + t.id);
  };
  const top = (
    <div className="ob-top" style={{ padding: '18px 20px 6px' }}>
      <button className="circle-btn" onClick={() => (step === 1 ? closeSheet() : setStep(1))} aria-label={step === 1 ? 'Close' : 'Back'}>
        <Icon name={step === 1 ? 'x' : 'arrowL'} />
      </button>
      <span className="step-pill">{step === 1 ? 'Step 1 · Group' : 'Step 2 · Members'}</span>
      {step === 2
        ? <button className="chip on" disabled={!name.trim() || !members.length} style={name.trim() && members.length ? undefined : { opacity: 0.5 }} onClick={create}>Create</button>
        : <span style={{ width: 38 }} />}
    </div>
  );
  if (step === 1) {
    return (
      <>
        {top}
        <div className="sheet-body" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ margin: '8px 0 0', fontSize: 22 }}>Name your group</h3>
          <p className="muted" style={{ margin: 0 }}>Pick a name and a picture — you can change them later.</p>
          <div className="cg-photo"><Icon name="camera" /><span className="plus"><Icon name="plus" /></span></div>
          <div className="card pad" style={{ width: '100%', textAlign: 'left' }}>
            <div className="card-h"><Icon name="tag" /> GROUP NAME<span className="grow" /><span className="tiny muted">{name.length}/25</span></div>
            <span className="icon-input"><Icon name="group" />
              <input className="input" maxLength={25} placeholder="Family · Work team · Book club…" value={name} autoFocus
                onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) setStep(2); }} />
            </span>
          </div>
          <button className="btn btn-primary block" onClick={() => { if (!name.trim()) { toast('Give your group a name.'); return; } setStep(2); }}>
            Continue <Icon name="arrowR" />
          </button>
        </div>
      </>
    );
  }
  const s = q.trim().toLowerCase();
  const fr = friends(d).filter((f) => !s || f.name.toLowerCase().includes(s));
  return (
    <>
      {top}
      <div className="sheet-body">
        <div className="row-between">
          <div>
            <h3 style={{ margin: 0, fontSize: 20 }}>Add members</h3>
            <div className="tiny muted">{members.length ? `${members.length} selected` : `Tap to pick friends on ${APP_NAME}`}</div>
          </div>
          {members.length > 0 && <span className="badge grad">{members.length}</span>}
        </div>
        <div className="search"><Icon name="search" /><input placeholder="Search friends" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="row" onClick={() => shareText(`Join me on ${APP_NAME} — free calls and texts over Wi-Fi. https://apps.apple.com/app/id6781677176`)}>
          <span className="circle-ic" style={{ background: 'var(--accent-soft)' }}><Icon name="userPlus" /></span>
          <div className="body"><div className="t" style={{ fontSize: 15 }}>Invite a friend</div><div className="s">Share a link — they join, you both get coins.</div></div>
          <Icon name="share" />
        </button>
        {fr.length ? (
          <div className="list" style={{ padding: 0 }}>
            {fr.map((f) => {
              const on = members.includes(f.id);
              return (
                <button key={f.id} className={cx('row pick', on && 'sel')} onClick={() => setMembers((m) => (on ? m.filter((x) => x !== f.id) : [...m, f.id]))}>
                  <Avatar name={f.name} size={40} />
                  <div className="body"><div className="t" style={{ fontSize: 15 }}>{f.name}</div><div className="s">{fmtPhone(f.phone)}</div></div>
                  <span className="check-c">{on && <Icon name="check" />}</span>
                </button>
              );
            })}
          </div>
        ) : <Empty icon="users" title={`No friends on ${APP_NAME} yet`} sub="Share an invite — when they join, they'll show up here." />}
      </div>
    </>
  );
}

export function GroupInfo({ id }: { id: string }) {
  const d = useData();
  const g = d.groups.find((x) => x.id === id);
  if (!g) return <Placeholder icon="group" title="Group not found" />;

  const rename = async () => {
    const v = await promptDialog({ title: 'Rename group', placeholder: 'Group name', value: g.name });
    if (!v) return;
    mutate((dd) => {
      const gg = dd.groups.find((x) => x.id === id);
      if (!gg) return;
      gg.name = v.slice(0, 25);
      const t = dd.chats.find((c) => c.id === gg.dialog);
      if (t) t.name = gg.name;
    });
  };
  const addMembers = () => openFriendPicker({ multi: true, title: 'Pick friends', exclude: g.members }, (list) => {
    mutate((dd) => { const gg = dd.groups.find((x) => x.id === id); if (gg) list.forEach((f) => { if (!gg.members.includes(f.id)) gg.members.push(f.id); }); });
  });
  const remove = (mid: string) => mutate((dd) => { const gg = dd.groups.find((x) => x.id === id); if (gg) gg.members = gg.members.filter((m) => m !== mid); });
  const leave = async () => {
    const ok = await confirmDialog({ title: g.admin ? 'Delete group?' : 'Leave group?', ok: g.admin ? 'Delete' : 'Leave', danger: true });
    if (!ok) return;
    mutate((dd) => { dd.groups = dd.groups.filter((x) => x.id !== g.id); dd.chats = dd.chats.filter((c) => c.id !== g.dialog); });
    go('messages/groups');
  };
  const memberChat = (mid: string) => { const c = contactById(getData(), mid); if (c) go('messages/chat/' + ensureChatWith(c)); };
  const memberCall = (mid: string) => { const c = contactById(getData(), mid); if (c) startCall({ kind: 'app', name: c.name, phone: c.phone }); };

  return (
    <>
      <TopBar title={g.name} rootBack back="messages/groups" />
      <div className="scroll">
        <div className="content narrow">
          <div className="card pad center hero-card">
            <div className="rings"><Avatar name={g.name} size={88} group /></div>
            <div className="row-lite" style={{ justifyContent: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{g.name}</h2>
              {g.admin && <button className="circle-ic s22" onClick={rename} title="Rename"><Icon name="pencil" /></button>}
            </div>
            <span className="chip soft"><Icon name="users" /> {g.members.length} members</span>
            <div className="row-lite" style={{ justifyContent: 'center', gap: 10, marginTop: 6 }}>
              <button className="btn btn-ghost sm" onClick={() => openGroupChat(g.id)}><Icon name="message" /> Chat</button>
              <button className="btn btn-ghost sm" onClick={() => startCall({ kind: 'group', name: g.name, members: g.members })}><Icon name="phone" /> Call Group</button>
            </div>
          </div>
          <div className="card pad">
            <div className="card-h"><Icon name="users" /> MEMBERS<span className="grow" /><span className="tiny muted">{g.members.length}</span></div>
            {g.admin && (
              <button className="mem-row add" onClick={addMembers}>
                <span className="grad-circle" style={{ width: 40, height: 40 }}><Icon name="plus" /></span>
                <span style={{ flex: 1, textAlign: 'left', color: 'var(--primary)', fontWeight: 600 }}>Add member</span>
                <Icon name="chevR" />
              </button>
            )}
            {g.members.map((mid, i) => {
              const me = mid === 'me';
              const c = me ? undefined : contactById(d, mid);
              const name = me ? displayName(d) + ' (You)' : c ? c.name : 'User';
              const admin = (me && g.admin) || (!g.admin && i === 1);
              return (
                <div className="mem-row" key={mid}>
                  <Avatar name={me ? displayName(d) : name} size={40} />
                  <div style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{name}</div>
                  {admin && (
                    <span className="chip" style={{ background: 'color-mix(in srgb,var(--warning) 14%,transparent)', color: 'var(--warning)', fontSize: 11 }}>
                      <Icon name="crown" /> Admin
                    </span>
                  )}
                  {!me && <>
                    <button className="circle-ic s32" style={{ background: 'var(--accent-soft)' }} onClick={() => memberChat(mid)} title="Message"><Icon name="message" /></button>
                    <button className="circle-ic s32" style={{ ['--c' as string]: 'var(--success)' }} onClick={() => memberCall(mid)} title="Call"><Icon name="phone" /></button>
                  </>}
                  {!me && g.admin && !admin && (
                    <button className="circle-ic s32" style={{ ['--c' as string]: 'var(--danger)' }} onClick={() => remove(mid)} title="Remove"><Icon name="x" /></button>
                  )}
                </div>
              );
            })}
          </div>
          <button className="btn block danger-soft" onClick={leave}>
            <Icon name={g.admin ? 'trash' : 'logout'} /> {g.admin ? 'Delete group' : 'Leave group'}
          </button>
        </div>
      </div>
    </>
  );
}
