'use client';

/* Calls tab: Recents | Voicemail (list pane) with call info / voicemail detail (detail pane). */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { wc } from '../api';
import { loadVoicemailThread } from '../sync';
import { CallLog } from '../data';
import { cx, dur as fmtDur, fmtPhone, mmss, when } from '../format';
import { Icon, IconName } from '../icons';
import { contactByPhone, getData, mutate, nameFor, useData } from '../store';
import { confirmDialog, go, placePhoneCall, startCall, toast } from '../ui';
import { Avatar, Empty, Placeholder, PlayButton, PlayerCard, ScrubBar, Spinner, TopBar } from '../components/ui';
import { SplitView } from '../components/Shell';
import { ProfileHero, UserInfoView } from '../contacts/UserInfo';

const isMissed = (c: CallLog) => c.dir === 'missed';
function callIcon(c: CallLog): IconName {
  if (c.type === 'group') return 'group';
  if (c.type === 'video') return isMissed(c) ? 'videoOff' : 'video';
  return isMissed(c) ? 'phoneDown' : c.dir === 'out' ? 'phoneOut' : 'phoneIn';
}
const callTint = (c: CallLog) => (isMissed(c) ? 'var(--danger)' : c.dir === 'out' ? 'var(--primary)' : 'var(--success)');
const BADGE: Partial<Record<CallLog['type'], string>> = { wifi: 'WiFi Call', video: 'Video Call', group: 'Group Call', app: 'WiFi Call' };
const tint = (c: string) => ({ ['--c' as string]: c });

function redial(c: CallLog) {
  if (c.type === 'group') {
    const g = getData().groups.find((x) => x.name === c.name);
    return startCall({ kind: 'group', name: c.name, members: g ? g.members.map((m) => m.qbId) : [] });
  }
  if (c.type === 'video') return startCall({ kind: 'video', name: c.name, phone: c.phone });
  if (c.type === 'app') return startCall({ kind: 'app', name: c.name, phone: c.phone });
  placePhoneCall(c.phone, c.name);
}

async function deleteCall(id: string) {
  const r = await wc('clearCallLog', { id });
  if (!r.ok) return toast(r.message || 'Couldn’t delete this call. Please try again.');
  mutate((x) => { x.calls = x.calls.filter((k) => k.id !== id); });
}

function Recents({ filter, setFilter, current }: { filter: 'all' | 'missed'; setFilter: (f: 'all' | 'missed') => void; current?: string }) {
  const d = useData();
  const items = [...d.calls].sort((a, b) => b.at - a.at).filter((c) => filter === 'all' || isMissed(c));
  const clear = async () => {
    if (await confirmDialog({ title: 'Clear all call history?', ok: 'Clear', danger: true })) {
      const r = await wc('clearCallLogs');
      if (!r.ok) return toast(r.message || 'Couldn’t clear call history. Please try again.');
      mutate((x) => { x.calls = []; });
      go('calls');
    }
  };
  return (
    <>
      <div className="chips">
        <button className={cx('chip', filter === 'all' && 'on')} onClick={() => setFilter('all')}>All</button>
        <button className={cx('chip', filter === 'missed' && 'on')} onClick={() => setFilter('missed')}>Missed</button>
        <span className="grow" />
        {d.calls.length > 0 && <button className="chip danger" onClick={clear}><Icon name="trash" /> Clear</button>}
      </div>
      {!items.length ? (
        <Empty icon={filter === 'all' ? 'phone' : 'phoneDown'} title={filter === 'all' ? 'No Call History Found' : 'No Missed Calls'} bare />
      ) : (
        <div className="list">
          {items.map((c) => {
            const name = c.name || nameFor(d, c.phone, '') || 'Unknown';
            const label = isMissed(c) ? 'Missed' : c.dir === 'out' ? 'Outgoing' : 'Incoming';
            return (
              <div key={c.id} className={cx('row clickable call-row', current === c.id && 'active')} role="button" tabIndex={0}
                onClick={() => redial(c)} onKeyDown={(e) => { if (e.key === 'Enter') redial(c); }}>
                <span className="circle-ic" style={tint(callTint(c))}><Icon name={callIcon(c)} /></span>
                <div className="body">
                  <div className={cx('t', isMissed(c) && 'danger')}>{name}</div>
                  <div className="s">
                    {label}
                    {c.dur > 0 && <> · <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{fmtDur(c.dur)}</span></>}
                    {BADGE[c.type] && <> <span className="pill-tag">{BADGE[c.type]}</span></>}
                  </div>
                </div>
                <div className="trail">
                  <span className="time">{when(c.at)}</span>
                  <Link className="info-btn" href={'/app/calls/recents/info/' + c.id} aria-label="Call info" title="Call info" onClick={(e) => e.stopPropagation()}>
                    <Icon name="infoCircle" />
                  </Link>
                </div>
                <button className="row-del" aria-label="Delete" title="Delete"
                  onClick={(e) => { e.stopPropagation(); deleteCall(c.id); }}>
                  <Icon name="trash" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function VoicemailList({ current }: { current?: string }) {
  const d = useData();
  return (
    <>
      <div className="chips" style={{ justifyContent: 'flex-end' }}>
        <Link className="chip soft" href="/app/settings/call/voicemail"><Icon name="settings" /> Voicemail settings</Link>
      </div>
      {!d.voicemails.length ? (
        <Empty icon="mic" title="No voicemail yet" sub="When someone leaves a voicemail, you'll see it here." />
      ) : (
        <div className="list">
          {d.voicemails.map((v) => {
            const name = nameFor(d, v.phone);
            return (
              <Link key={v.id} className={cx('row', current === v.id && 'active')} href={'/app/calls/voicemail/' + v.id}>
                <Avatar name={name} size={56} />
                <div className="body">
                  <div className="t">{name}</div>
                  <div className="s" style={{ color: 'var(--primary)' }}><Icon name="mic" /> Voicemail · {v.items.length}</div>
                </div>
                <span className="chev"><Icon name="chevR" /></span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function VoicemailDetail({ id }: { id: string }) {
  const d = useData();
  const v = d.voicemails.find((x) => x.id === id);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!v) return;
    setLoading(true);
    loadVoicemailThread(v.phone, v.name).finally(() => setLoading(false));
  }, [v?.phone]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!v) return <Placeholder icon="mic" title="Voicemail not found" />;
  const name = nameFor(d, v.phone);
  const hasName = !!contactByPhone(d, v.phone);
  const del = async () => {
    if (!(await confirmDialog({ title: 'Delete voicemail?', message: 'All messages from this caller will be removed.', ok: 'Delete', danger: true }))) return;
    const r = await wc('deleteVoicemail', { fromPhoneNumber: v.phone });
    if (!r.ok) return toast(r.message || 'Couldn’t delete this voicemail. Please try again.');
    mutate((x) => { x.voicemails = x.voicemails.filter((k) => k.id !== v.id); });
    go('calls/voicemail');
  };
  return (
    <>
      <TopBar title={name} rootBack back="calls/voicemail"
        right={<button className="icon-btn" onClick={() => placePhoneCall(v.phone)} title="Call back"><Icon name="phone" /></button>} />
      <div className="scroll">
        <div className="content">
          <div className="card pad row-lite">
            <Avatar name={name} size={56} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{name}</div>
              {hasName && <div className="tiny muted" style={{ fontSize: 13 }}>{fmtPhone(v.phone)}</div>}
            </div>
            <span className="circle-ic s38" style={{ background: 'var(--accent-soft)' }}><Icon name="mic" /></span>
          </div>
          {v.items.length ? v.items.map((it) => (
            <PlayerCard key={it.id} id={it.id} className="card vm-item">
              <div className="vm-top">
                <PlayButton id={it.id} dur={it.dur} />
                <div style={{ flex: 1 }}>
                  <span className="pill-soft">{it.dir ? it.dir.charAt(0).toUpperCase() + it.dir.slice(1) : 'Voicemail'}</span>
                  <div className="time" style={{ marginTop: 4 }}>{when(it.at)}</div>
                </div>
                <span className="mono tiny muted">{mmss(it.dur)}</span>
              </div>
              <div className="vm-expand">
                <ScrubBar id={it.id} dur={it.dur} />
                {it.text && <p className="transcript">“{it.text}”</p>}
              </div>
            </PlayerCard>
          )) : loading ? <div className="center" style={{ padding: 24 }}><Spinner /></div> : <Empty icon="mic" title="No voicemail found" sub="When this caller leaves a message, it'll show up here." />}
          <button className="btn btn-outline sm" style={{ alignSelf: 'center', color: 'var(--danger)' }} onClick={del}>
            <Icon name="trash" /> Delete voicemail
          </button>
        </div>
      </div>
    </>
  );
}

function CallInfo({ id }: { id: string }) {
  const d = useData();
  const c = d.calls.find((x) => x.id === id);
  if (!c) return <Placeholder icon="phone" title="Call not found" />;
  const name = c.name || nameFor(d, c.phone, '');
  const label = isMissed(c) ? 'Missed call' : c.dir === 'out' ? 'Outgoing call' : 'Incoming call';
  const extra = (
    <div className="card pad">
      <div className="group-title" style={{ margin: '0 0 10px', padding: 0 }}>This call</div>
      <div className="row-lite">
        <span className="circle-ic" style={tint(callTint(c))}><Icon name={callIcon(c)} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{label}{BADGE[c.type] && <> <span className="pill-tag">{BADGE[c.type]}</span></>}</div>
          <div className="tiny muted">{when(c.at)}</div>
        </div>
        {c.dur > 0 && <span className="mono muted">{fmtDur(c.dur)}</span>}
      </div>
    </div>
  );
  if (c.type === 'group') {
    return (
      <>
        <TopBar title={name} rootBack back="calls" />
        <div className="scroll"><div className="content"><ProfileHero name={name} phone="" group />{extra}</div></div>
      </>
    );
  }
  return <UserInfoView contact={{ name, phone: c.phone }} back="calls" extra={extra} title="Contact" />;
}

export default function CallsTab({ rest }: { rest: string[] }) {
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const vm = rest[0] === 'voicemail';
  let detail: React.ReactNode;
  let open = false;
  if (vm && rest[1]) { detail = <VoicemailDetail id={rest[1]} />; open = true; }
  else if (rest[0] === 'recents' && rest[1] === 'info' && rest[2]) { detail = <CallInfo id={rest[2]} />; open = true; }
  else detail = (
    <Placeholder icon={vm ? 'mic' : 'phone'} title={vm ? 'Your voicemail' : 'Your recent calls'}
      sub={vm ? 'Pick a caller on the left to play their messages.' : 'Click a call to call back, or the ⓘ button for details.'} />
  );

  const list = (
    <>
      <div className="phead"><h1>Calls</h1></div>
      <div className="seg">
        <Link href="/app/calls" className={cx(!vm && 'on')}>Recents</Link>
        <Link href="/app/calls/voicemail" className={cx(vm && 'on')}>Voicemail</Link>
      </div>
      <div className="scroll">
        {vm ? <VoicemailList current={rest[1]} /> : <Recents filter={filter} setFilter={setFilter} current={rest[2]} />}
      </div>
    </>
  );
  return <SplitView list={list} detail={detail} open={open} />;
}
