'use client';

/* Settings tab: list pane (SettingsView) + every subscreen as the detail pane. */
import { signOut } from '../sync';
import { setFlow } from '../flows/flowState';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { APP_NAME, cx, fmtPhone } from '../format';
import { Icon, IconName } from '../icons';
import { displayName, inviteText, isPro, useData } from '../store';
import { confirmDialog, openBuyNumber, openPaywall, shareText } from '../ui';
import { Avatar, Placeholder, Toggle } from '../components/ui';
import { SplitView, useDarkMode } from '../components/Shell';
import { RecordingsView } from '../calls/Recordings';
import { SubscriptionView } from '../flows/Paywall';
import { AccountView, DeleteAccountView, DevicesView, EditProfileView } from './Account';
import { CoinsView, UsageView } from './Wallet';
import { BlockedView, CallForwardingView, CallSettingsView, ChatBackgroundView, ChatSettingsView, VoicemailSettingsView } from './CallChat';
import { ContactUsView, FaqsView, InviteView, SupportView } from './Help';
import { tint } from './parts';

function Item({ href, onClick, icon, color, label, sub, val, noChev, ext }: {
  href?: string; onClick?: () => void; icon: IconName; color: string; label: string; sub?: string; val?: React.ReactNode; noChev?: boolean; ext?: boolean;
}) {
  const pathname = usePathname();
  const inner = (
    <>
      <span className="tile-ic" style={tint(color)}><Icon name={icon} /></span>
      <span className="lbl">{label}{sub && <small>{sub}</small>}</span>
      {val && <span className="val">{val}</span>}
      {!noChev && <span className="chev faint"><Icon name={ext ? 'arrowUpRight' : 'chevR'} /></span>}
    </>
  );
  if (href?.startsWith('/') && ext) return <a className="item" href={href} target="_blank" rel="noopener">{inner}</a>;
  if (href) {
    const full = '/app/' + href;
    return <Link className={cx('item', (pathname === full || pathname.startsWith(full + '/')) && 'active')} href={full}>{inner}</Link>;
  }
  return <button className="item" onClick={onClick}>{inner}</button>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <><div className="group-title">{title}</div><div className="group">{children}</div></>;
}

function ListPane() {
  const d = useData();
  const router = useRouter();
  const [dark, toggleDark] = useDarkMode();
  const name = displayName(d);
  const tierLabel = { none: 'Free', lite: 'Lite', pro: 'Pro' }[d.tier];

  const logout = async () => {
    if (!(await confirmDialog({ title: 'Log out?', ok: 'Log out', danger: true }))) return;
    setFlow({ auth: 'phone', otp: '', phone: '', dir: 1 });
    await signOut();
    router.push('/app');
  };

  return (
    <>
      <div className="phead"><h1>Settings</h1></div>
      <div className="scroll">
        <div className="content" style={{ paddingTop: 4, gap: 14 }}>
          <Link className="card pad row-lite profile" href="/app/settings/account">
            <Avatar name={name} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{name}</div>
              <div className="muted" style={{ fontSize: 14 }}>{d.user.phone ? fmtPhone(d.user.phone) : '—'}</div>
            </div>
            <span className="chev faint"><Icon name="chevR" /></span>
          </Link>
          {d.number ? (
            <div className="num-banner owned"><Icon name="seal" /><div><div className="tiny" style={{ opacity: 0.85 }}>Your number</div><div style={{ fontWeight: 700, fontSize: 20 }}>{fmtPhone(d.number)}</div></div></div>
          ) : (
            <button className="num-banner" onClick={openBuyNumber}><Icon name="phonePlus" /><b style={{ flex: 1, textAlign: 'left', fontSize: 17 }}>Get a phone number</b><Icon name="arrowR" /></button>
          )}
          <Section title="Wallet">
            <Item href="settings/coins" icon="dollar" color="warning" label="Purchase Coins" val={<span className="mono">{d.coins.toFixed(2)}</span>} />
            <Item href="settings/usage" icon="chart" color="primary" label="Usage" />
          </Section>
          <Section title="Calls & Messages">
            <Item href="settings/call" icon="phone" color="primary" label="Call Settings" />
            <Item href="settings/chat" icon="messages" color="accent" label="Chat Settings" />
            <Item href="settings/recordings" icon="record" color="danger" label="My Recordings" />
          </Section>
          <Section title="Account">
            <Item href="settings/account" icon="user" color="primary" label="Account Settings" />
            <Item href="settings/subscription" icon="crown" color="warning" label="Subscription" val={<span className="chip soft" style={{ padding: '3px 10px' }}>{tierLabel}</span>} />
            <Item onClick={() => shareText(inviteText())} icon="userPlus" color="accent" label="Invite Friends" noChev />
          </Section>
          <Section title="Help & Legal">
            <Item href="settings/support" icon="headphones" color="accent" label="Chat Support" />
            <Item href="settings/faqs" icon="question" color="warning" label="FAQs" />
            <Item href="settings/contact" icon="mail" color="primary" label="Contact Us" />
            <Item href="/privacy" ext icon="shieldCheck" color="success" label="Privacy Policy" />
            <Item href="/terms" ext icon="checklist" color="primary" label="Terms of Use" />
          </Section>
          <Section title="Web app">
            <div className="item">
              <span className="tile-ic" style={tint('accent')}><Icon name="moon" /></span><span className="lbl">Dark mode</span>
              <Toggle checked={dark} onChange={toggleDark} label="Dark mode" />
            </div>
          </Section>
          <button className="btn block logout" onClick={logout}><Icon name="logout" /> Log out</button>
          <Link className="link-btn center" style={{ color: 'var(--danger)', padding: 10 }} href="/app/settings/delete"><Icon name="trash" /> Delete Account</Link>
          <p className="tiny faint center" style={{ margin: 0 }}>{APP_NAME} for Web · Version 1.0</p>
        </div>
      </div>
    </>
  );
}

/** Pro-only call screens: without Pro, show the paywall over Call Settings. */
function ProGate({ children }: { children: React.ReactNode }) {
  const pro = isPro(useData());
  useEffect(() => { if (!pro) openPaywall(); }, [pro]);
  return pro ? <>{children}</> : <CallSettingsView />;
}

export default function SettingsTab({ rest }: { rest: string[] }) {
  const [a, b] = rest;
  let detail: React.ReactNode;
  switch (a) {
    case 'account': detail = b === 'edit' ? <EditProfileView /> : b === 'devices' ? <DevicesView /> : <AccountView />; break;
    case 'delete': detail = <DeleteAccountView />; break;
    case 'coins': detail = <CoinsView />; break;
    case 'usage': detail = <UsageView />; break;
    case 'subscription': detail = <SubscriptionView />; break;
    case 'call': detail = b === 'voicemail' ? <ProGate><VoicemailSettingsView /></ProGate> : b === 'forwarding' ? <ProGate><CallForwardingView /></ProGate> : b === 'blocked' ? <BlockedView /> : <CallSettingsView />; break;
    case 'chat': detail = b === 'background' ? <ChatBackgroundView /> : <ChatSettingsView />; break;
    case 'recordings': detail = <RecordingsView />; break;
    case 'support': detail = <SupportView />; break;
    case 'faqs': detail = <FaqsView />; break;
    case 'contact': detail = <ContactUsView />; break;
    case 'invite': detail = <InviteView />; break;
    default: detail = null;
  }
  return (
    <SplitView
      list={<ListPane />}
      open={!!detail}
      detail={detail ?? <Placeholder icon="settings" title="Settings" sub="Choose a section on the left — account, wallet, calls, chats and help." />}
    />
  );
}
