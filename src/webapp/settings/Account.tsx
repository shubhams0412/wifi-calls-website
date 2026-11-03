'use client';

/* Account, Edit profile, Devices, Delete account. */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fmtPhone, initial, when } from '../format';
import { Icon, IconName } from '../icons';
import { displayName, mutate, useApp, useData } from '../store';
import { confirmDialog, go, toast } from '../ui';
import { Avatar, Empty, Spinner, TopBar } from '../components/ui';
import { tint } from './parts';

function ActCard({ href, onClick, icon, color, title, sub, trail }: { href?: string; onClick?: () => void; icon: IconName; color: string; title: string; sub: string; trail: IconName }) {
  const danger = color === 'danger';
  const inner = (
    <>
      <span className="circle-ic s44" style={{ ...tint(color), background: `color-mix(in srgb,var(--${color}) 12%,transparent)` }}><Icon name={icon} /></span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontWeight: 600, color: danger ? 'var(--danger)' : 'var(--text)' }}>{title}</div>
        <div className="tiny muted" style={{ fontSize: 13 }}>{sub}</div>
      </div>
      <span style={{ color: danger ? 'var(--danger)' : 'var(--text-3)' }}><Icon name={trail} /></span>
    </>
  );
  return href ? <Link className="card pad row-lite act-card" href={'/app/' + href}>{inner}</Link> : <button className="card pad row-lite act-card" onClick={onClick}>{inner}</button>;
}

const signOutOthers = async (title: string, message: string, ok: string) => {
  if (!(await confirmDialog({ title, message, ok, danger: true }))) return;
  mutate((d) => { d.devices = d.devices.filter((x) => x.current); });
  toast('Signed out of other devices');
};

export function AccountView() {
  const d = useData();
  const u = d.user, name = displayName(d);
  return (
    <>
      <TopBar title="Account" rootBack back="settings" right={<Link className="chip soft" href="/app/settings/account/edit"><Icon name="pencil" /> Edit</Link>} />
      <div className="scroll">
        <div className="content narrow">
          <div className="card pad center hero-card">
            <span className="avatar" style={{ ['--s' as string]: '96px', margin: '0 auto', boxShadow: '0 0 0 4px var(--accent-soft),0 10px 20px rgba(91,44,159,.3)' }}>{initial(name) || '?'}</span>
            <h2 style={{ margin: 0, fontSize: 20 }}>{name}</h2>
            {u.username && <span className="chip soft" style={{ fontSize: 13 }}><Icon name="at" /> {u.username}</span>}
            <span className="chip mono" style={{ fontSize: 15 }}><span style={{ color: 'var(--success)' }}><Icon name="phone" /></span> {fmtPhone(u.phone) || '—'}</span>
          </div>
          <ActCard href="settings/account/devices" icon="iphone" color="primary" title="My Devices" sub="Manage every device signed in to your account" trail="chevR" />
          <ActCard onClick={() => signOutOthers('Log out from all other devices?', 'This device will stay signed in.', 'Log out')} icon="logout" color="danger" title="Sign out elsewhere" sub="Keep this device signed in, end every other session" trail="arrowR" />
          <ActCard href="settings/delete" icon="trash" color="danger" title="Delete account" sub="Permanently delete your account and all its data" trail="chevR" />
        </div>
      </div>
    </>
  );
}

export function EditProfileView() {
  const d = useData();
  const u = d.user;
  const [f, setF] = useState({ first: u.first, last: u.last, username: u.username });
  const [saving, setSaving] = useState(false);
  const changed = f.first !== u.first || f.last !== u.last || f.username !== u.username;
  const valid = !!(f.first && f.last && f.username && changed);

  const save = () => {
    if (!f.first) return toast('First name must not be blank');
    if (!f.last) return toast('Last name must not be blank');
    if (!f.username) return toast('Username must not be blank');
    setSaving(true);
    setTimeout(() => {
      mutate((x) => { x.user.first = f.first; x.user.last = f.last; x.user.username = f.username; });
      toast('Profile updated');
      go('settings/account');
    }, 500);
  };
  const field = (k: keyof typeof f, label: string, icon: IconName, ph: string, auto?: boolean) => (
    <label className="field">
      <span style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 11 }}>{label}</span>
      <span className="icon-input"><Icon name={icon} />
        <input className="input" placeholder={ph} value={f[k]} autoFocus={auto}
          autoCapitalize={k === 'username' ? 'none' : undefined} spellCheck={k === 'username' ? false : undefined}
          onChange={(e) => setF({ ...f, [k]: e.target.value.trim() })} />
      </span>
    </label>
  );
  return (
    <>
      <TopBar title="Edit profile" rootBack back="settings/account" />
      <div className="scroll">
        <div className="content narrow">
          <div className="center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div className="rings"><Avatar name={displayName(d)} size={88} /></div>
            <span className="chip mono">{fmtPhone(u.phone) || '—'}</span>
          </div>
          <div className="card form-card">
            {field('first', 'First name', 'user', 'First', true)}
            {field('last', 'Last name', 'user', 'Last')}
            {field('username', 'Username', 'at', 'username')}
          </div>
          <button className="btn btn-primary block" disabled={!valid || saving} onClick={save}>
            {saving ? <><Spinner white /> Saving…</> : <>Save changes <Icon name="check" /></>}
          </button>
        </div>
      </div>
    </>
  );
}

export function DevicesView() {
  const d = useData();
  const icon: Record<string, IconName> = { ios: 'iphone', android: 'iphone', web: 'desktop' };
  const others = d.devices.some((x) => !x.current);
  return (
    <>
      <TopBar title="Devices" rootBack back="settings/account" />
      <div className="scroll">
        <div className="content narrow">
          {d.devices.length ? d.devices.map((x) => (
            <div className="card flat pad row-lite" key={x.id}>
              <span className="grad-circle" style={{ width: 40, height: 40, background: 'var(--primary)' }}><Icon name={icon[x.type] || 'phone'} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{x.name}{x.current && <> <span className="chip" style={{ background: 'var(--success)', color: '#fff', fontSize: 10, padding: '2px 8px' }}>Current</span></>}</div>
                <div className="tiny muted">{(x.type === 'web' ? 'Web · ' : 'iOS ') + x.os}</div>
                <div className="tiny faint" style={{ fontSize: 11 }}>{x.current ? 'Active now' : 'Last seen ' + when(x.seen)}</div>
              </div>
            </div>
          )) : <Empty icon="devices" title="No active devices" />}
          {others && (
            <button className="btn btn-outline block" style={{ color: 'var(--danger)' }}
              onClick={() => signOutOthers('Sign out other devices?', "You'll stay signed in on this device.", 'Sign Out')}>Sign out other devices</button>
          )}
        </div>
      </div>
    </>
  );
}

export function DeleteAccountView() {
  const router = useRouter();
  const rows: [IconName, string][] = [
    ['userCard', 'Your profile, username, and phone number'],
    ['phone', 'Your assigned number, call history, and recordings'],
    ['messages', 'All your messages, chats, and groups'],
  ];
  const del = async () => {
    if (!(await confirmDialog({ title: 'Delete account?', message: 'This permanently deletes your account and all associated data. This can’t be undone.', ok: 'Delete', danger: true }))) return;
    useApp.getState().reset();
    router.push('/app');
  };
  return (
    <>
      <TopBar title="Delete Account" rootBack back="settings" />
      <div className="scroll">
        <div className="content narrow">
          <div className="center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="danger-hero"><Icon name="alert" /></div>
            <h2 style={{ margin: 0, fontSize: 22 }}>Delete your account</h2>
            <p className="muted" style={{ margin: 0 }}>This is permanent and can’t be undone. Please review what will be removed before you continue.</p>
          </div>
          <div className="card pad">
            <div className="tiny muted" style={{ letterSpacing: '.06em', fontWeight: 600, marginBottom: 6 }}>This will permanently remove</div>
            {rows.map(([ic, t]) => (
              <div className="row-lite del-row" key={t}><span className="tile-ic" style={tint('danger')}><Icon name={ic} /></span><span style={{ fontWeight: 600, fontSize: 14 }}>{t}</span></div>
            ))}
          </div>
          <div className="note warn"><Icon name="infoCircle" /><span>Deleting your account won’t cancel an active subscription. Manage or cancel it in the App Store under your Apple Account.</span></div>
          <button className="btn btn-danger block" style={{ boxShadow: '0 8px 18px rgba(225,29,72,.3)' }} onClick={del}><Icon name="trash" /> Delete my account</button>
        </div>
      </div>
    </>
  );
}
