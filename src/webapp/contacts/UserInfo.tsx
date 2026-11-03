'use client';

/* Contact detail screens: UserInfoView (phone contact / unsaved number), QbInfoView (app user)
   and the shared ProfileHero card. */
import type { ReactNode } from 'react';
import { Contact, uid } from '../data';
import { APP_NAME, fmtPhone } from '../format';
import { Icon, IconName } from '../icons';
import { contactByPhone, ensureChatWith, ensureSmsWith, inviteText, isBlocked, mutate, nameFor, useData } from '../store';
import { copyText, go, placePhoneCall, promptDialog, shareText, startCall, toast } from '../ui';
import { Avatar, TopBar } from '../components/ui';

export function ProfileHero({ name, phone, group, sub }: { name: string; phone?: string; group?: boolean; sub?: ReactNode }) {
  return (
    <div className="card pad center hero-card">
      <span className="hero-deco" />
      <div className="rings"><Avatar name={name} size={88} group={group} /></div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{name || fmtPhone(phone) || 'Unknown'}</h2>
      {name && phone && <span className="chip mono" style={{ fontSize: 14 }}>{fmtPhone(phone)}</span>}
      {sub}
    </div>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: IconName; label: string; value: string; mono?: boolean }) {
  return (
    <div className="info-row">
      <span className="circle-ic s32" style={{ background: 'var(--accent-soft)' }}><Icon name={icon} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tiny faint" style={{ fontWeight: 700, letterSpacing: '.06em' }}>{label}</div>
        <div className={mono ? 'mono' : undefined} style={{ fontWeight: 600 }}>{value}</div>
      </div>
      <button className="icon-btn plain" onClick={() => copyText(value)} title="Copy" aria-label={'Copy ' + label}><Icon name="copy" /></button>
    </div>
  );
}

export function blockNumber(phone: string, name = '') {
  mutate((d) => { d.blocked.push({ phone, name }); });
  toast('Number blocked');
}
export function unblockNumber(phone: string) {
  const p = phone.replace(/\D/g, '').slice(-10);
  mutate((d) => { d.blocked = d.blocked.filter((b) => b.phone.replace(/\D/g, '').slice(-10) !== p); });
  toast('Number unblocked');
}

/** UserInfoView — a phone contact or unsaved number. */
export function UserInfoView({ contact, back, extra, title }: { contact: { id?: string; name: string; phone: string }; back: string; extra?: ReactNode; title?: string }) {
  const d = useData();
  const name = contact.name || nameFor(d, contact.phone, '');
  const known = contact.id ? d.contacts.find((c) => c.id === contact.id) : contactByPhone(d, contact.phone);
  const blocked = isBlocked(d, contact.phone);

  const saveNumber = async () => {
    const v = await promptDialog({ title: 'Add to contacts', placeholder: 'Name' });
    if (!v) return;
    mutate((dd) => { dd.contacts.push({ id: 'c' + uid(), name: v, phone: contact.phone, friend: false }); });
    toast('Contact saved');
  };

  return (
    <>
      <TopBar title={title || 'Contact'} rootBack back={back} />
      <div className="scroll">
        <div className="content narrow">
          <ProfileHero name={name} phone={contact.phone} />
          <div className="act-tiles">
            <button className="card act-tile" onClick={() => placePhoneCall(contact.phone, name)}><span style={{ background: 'var(--success)' }}><Icon name="phone" /></span>Call</button>
            <button className="card act-tile" onClick={() => go('messages/sms/' + ensureSmsWith(contact.phone, name))}><span style={{ background: 'var(--primary)' }}><Icon name="message" /></span>Message</button>
            {known?.friend && (
              <button className="card act-tile" onClick={() => go('messages/chat/' + ensureChatWith(known))}><span style={{ background: 'var(--accent)' }}><Icon name="messages" /></span>Free chat</button>
            )}
          </div>
          {extra}
          <div className="card pad">
            <div className="card-h"><Icon name="infoCircle" /> INFO</div>
            <InfoRow icon="phone" label="PHONE" value={fmtPhone(contact.phone)} mono />
            {known?.username && <InfoRow icon="at" label={APP_NAME.toUpperCase()} value={'@' + known.username} />}
          </div>
          <div className="group">
            <button className="item" onClick={() => (blocked ? unblockNumber(contact.phone) : blockNumber(contact.phone, name))}>
              <span className="tile-ic" style={{ ['--c' as string]: blocked ? 'var(--success)' : 'var(--danger)' }}><Icon name={blocked ? 'checkCircle' : 'nosign'} /></span>
              <span className="lbl">{blocked ? 'Unblock this number' : 'Block this number'}</span>
            </button>
            {known && !known.friend && (
              <button className="item" onClick={() => shareText(inviteText())}>
                <span className="tile-ic" style={{ ['--c' as string]: 'var(--accent)' }}><Icon name="userPlus" /></span>
                <span className="lbl">Invite to {APP_NAME}<small>Talk for free once they join.</small></span>
              </button>
            )}
            {!known && (
              <button className="item" onClick={saveNumber}>
                <span className="tile-ic"><Icon name="contactPlus" /></span><span className="lbl">Add to contacts</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/** QBUserInfoView — an app user (friend). */
export function QbInfoView({ contact: c }: { contact: Contact }) {
  const Btn = ({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) => (
    <button className="qb-btn" onClick={onClick}><span><Icon name={icon} /></span>{label}</button>
  );
  return (
    <>
      <TopBar title="User Details" rootBack back="contacts" />
      <div className="scroll">
        <div className="content narrow">
          <div className="card pad center hero-card">
            <Avatar name={c.name} size={110} solid style={{ background: 'var(--primary)', margin: '0 auto' }} />
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{c.name}</h2>
            <div className="qb-acts">
              <Btn icon="video" label="Video Call" onClick={() => startCall({ kind: 'video', name: c.name, phone: c.phone })} />
              <Btn icon="phone" label="Voice Call" onClick={() => startCall({ kind: 'app', name: c.name, phone: c.phone })} />
              <Btn icon="messages" label="Message" onClick={() => go('messages/chat/' + ensureChatWith(c))} />
            </div>
          </div>
          <div className="card pad">
            <InfoRow icon="at" label={APP_NAME + ' Username'} value={'@' + (c.username || 'user')} />
            <InfoRow icon="phone" label="Phone" value={fmtPhone(c.phone)} mono />
          </div>
          <div className="group">
            <button className="item" onClick={() => placePhoneCall(c.phone, c.name)}>
              <span className="tile-ic" style={{ ['--c' as string]: 'var(--success)' }}><Icon name="phoneOut" /></span>
              <span className="lbl">Call their phone number<small>Uses coins — app calls are free.</small></span>
            </button>
            <button className="item" onClick={() => go('messages/sms/' + ensureSmsWith(c.phone, c.name))}>
              <span className="tile-ic"><Icon name="message" /></span><span className="lbl">Send SMS</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
