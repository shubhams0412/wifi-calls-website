'use client';

/* Groups: list (GroupListView), create (CreateGroupView, 2-step sheet), info (GroupInfoView).
   Groups live on the backend (wsqr_*Group), which creates the QuickBlox group dialog; see chat.ts. */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { APP_NAME, cx, fmtPhone } from '../format';
import { Icon } from '../icons';
import { displayName, friends, getData, lastMsg, useData } from '../store';
import { alertDialog, closeSheet, confirmDialog, go, openSheet, promptDialog, requirePro, shareText, startCall, toast } from '../ui';
import { Avatar, Empty, Placeholder, Spinner, TopBar } from '../components/ui';
import { openFriendPicker } from '../components/pickers';
import { changeMembers, chatWith, createGroup, leaveGroup, loadGroup, renameGroup } from '../chat';

/** A group's chat is its QuickBlox dialog, which has the same id. */
export function openGroupChat(groupId: string) { go('messages/chat/' + groupId); }

/** Creating groups is a Pro feature (the backend checks GROUP_CHAT_CREATE). */
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
              const t = d.chats.find((c) => c.id === g.id);
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
  const [icon, setIcon] = useState<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const create = async () => {
    if (!name.trim() || !members.length || busy) return;
    const qbIds = friends(getData()).filter((f) => members.includes(f.id) && f.qbId).map((f) => f.qbId!);
    setBusy(true);
    const r = await createGroup(name.trim(), qbIds, icon?.file);
    setBusy(false);
    if (!r.ok) return alertDialog('Couldn’t create the group', r.message || 'Please try again.');
    closeSheet();
    toast('Group created');
    if (r.data?.quick_blox_chat_dialog_id) openGroupChat(r.data.quick_blox_chat_dialog_id);
  };
  const top = (
    <div className="ob-top" style={{ padding: '18px 20px 6px' }}>
      <button className="circle-btn" onClick={() => (step === 1 ? closeSheet() : setStep(1))} aria-label={step === 1 ? 'Close' : 'Back'}>
        <Icon name={step === 1 ? 'x' : 'arrowL'} />
      </button>
      <span className="step-pill">{step === 1 ? 'Step 1 · Group' : 'Step 2 · Members'}</span>
      {step === 2
        ? <button className="chip on" disabled={!name.trim() || !members.length || busy} style={name.trim() && members.length && !busy ? undefined : { opacity: 0.5 }} onClick={create}>{busy ? <Spinner /> : 'Create'}</button>
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
          <button className="cg-photo" onClick={() => fileRef.current?.click()} aria-label="Choose a group picture"
            style={icon ? { backgroundImage: `url(${icon.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!icon && <Icon name="camera" />}<span className="plus"><Icon name="plus" /></span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setIcon({ file: f, url: URL.createObjectURL(f) });
          }} />
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
  const fr = friends(d).filter((f) => f.qbId && (!s || f.name.toLowerCase().includes(s)));
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
  useEffect(() => { loadGroup(id); }, [id]);
  if (!g) return <Placeholder icon="group" title="Group not found" />;

  const rename = async () => {
    const v = (await promptDialog({ title: 'Rename group', placeholder: 'Group name', value: g.name }))?.trim().slice(0, 25);
    if (!v || v === g.name) return;
    const r = await renameGroup(id, v);
    if (!r.ok) toast(r.message || 'Couldn’t rename the group. Please try again.');
  };
  const inGroup = new Set(g.members.map((m) => m.qbId));
  const addMembers = () => openFriendPicker({ multi: true, title: 'Pick friends', exclude: friends(getData()).filter((f) => !f.qbId || inGroup.has(f.qbId)).map((f) => f.id) }, async (list) => {
    const ids = list.map((f) => f.qbId!).filter(Boolean);
    if (!ids.length) return;
    const r = await changeMembers(id, ids, true);
    toast(r.ok ? (ids.length === 1 ? 'Member added' : 'Members added') : r.message || 'Couldn’t add members. Please try again.');
  });
  const remove = async (qbId: string, name: string) => {
    if (!(await confirmDialog({ title: `Remove ${name}?`, ok: 'Remove', danger: true }))) return;
    const r = await changeMembers(id, [qbId], false);
    if (!r.ok) toast(r.message || 'Couldn’t remove this member. Please try again.');
  };
  const leave = async () => {
    const ok = await confirmDialog({ title: g.admin ? 'Delete group?' : 'Leave group?', message: g.admin ? 'The group is deleted for everyone.' : undefined, ok: g.admin ? 'Delete' : 'Leave', danger: true });
    if (!ok) return;
    const r = await leaveGroup(g.id);
    if (!r.ok) return toast(r.message || 'Please try again.');
    toast(g.admin ? 'Group deleted' : 'You left the group');
    go('messages/groups');
  };
  const contactOf = (qbId: string) => getData().contacts.find((c) => c.qbId === qbId);
  const memberChat = async (qbId: string) => {
    const c = contactOf(qbId);
    const chat = c ? await chatWith(c) : null;
    if (chat) go('messages/chat/' + chat); else toast('Couldn’t open the chat. Please try again.');
  };
  const memberCall = (qbId: string) => { const c = contactOf(qbId); startCall({ kind: 'app', name: c?.name, phone: c?.phone }); };
  const myQb = d.user.quickbloxId;

  return (
    <>
      <TopBar title={g.name} rootBack back="messages/groups" />
      <div className="scroll">
        <div className="content narrow">
          <div className="card pad center hero-card">
            <div className="rings">
              {g.icon
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={g.icon} alt="" width={88} height={88} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                : <Avatar name={g.name} size={88} group />}
            </div>
            <div className="row-lite" style={{ justifyContent: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{g.name}</h2>
              {g.admin && <button className="circle-ic s22" onClick={rename} title="Rename"><Icon name="pencil" /></button>}
            </div>
            <span className="chip soft"><Icon name="users" /> {g.members.length} members</span>
            <div className="row-lite" style={{ justifyContent: 'center', gap: 10, marginTop: 6 }}>
              <button className="btn btn-ghost sm" onClick={() => openGroupChat(g.id)}><Icon name="message" /> Chat</button>
              <button className="btn btn-ghost sm" onClick={() => startCall({ kind: 'group', name: g.name, members: g.members.map((m) => m.qbId) })}><Icon name="phone" /> Call Group</button>
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
            {g.members.map((m) => {
              const me = m.qbId === myQb;
              const name = me ? displayName(d) + ' (You)' : m.name;
              return (
                <div className="mem-row" key={m.qbId}>
                  <Avatar name={me ? displayName(d) : name} size={40} />
                  <div style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
                    {name}
                    {!me && contactOf(m.qbId) && <div className="tiny muted" style={{ fontWeight: 400 }}>{fmtPhone(contactOf(m.qbId)!.phone)}</div>}
                  </div>
                  {m.admin && (
                    <span className="chip" style={{ background: 'color-mix(in srgb,var(--warning) 14%,transparent)', color: 'var(--warning)', fontSize: 11 }}>
                      <Icon name="crown" /> Admin
                    </span>
                  )}
                  {!me && contactOf(m.qbId) && <>
                    <button className="circle-ic s32" style={{ background: 'var(--accent-soft)' }} onClick={() => memberChat(m.qbId)} title="Message"><Icon name="message" /></button>
                    <button className="circle-ic s32" style={{ ['--c' as string]: 'var(--success)' }} onClick={() => memberCall(m.qbId)} title="Call"><Icon name="phone" /></button>
                  </>}
                  {!me && g.admin && !m.admin && (
                    <button className="circle-ic s32" style={{ ['--c' as string]: 'var(--danger)' }} onClick={() => remove(m.qbId, m.name)} title="Remove"><Icon name="x" /></button>
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
