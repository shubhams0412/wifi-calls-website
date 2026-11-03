'use client';

/* My Recordings (Settings → My Recordings): Pro toggle + expandable recording cards. */
import { mmss, when } from '../format';
import { Icon } from '../icons';
import { isPro, mutate, nameFor, useData } from '../store';
import { openPaywall } from '../ui';
import { selectTrack, stopPlayer, usePlayer } from '../player';
import { Empty, PlayButton, PlayerCard, ScrubBar, Toggle, TopBar } from '../components/ui';

const tint = (c: string) => ({ ['--c' as string]: c });

export function RecordingsView() {
  const d = useData();
  const pro = isPro(d);
  const openId = usePlayer((p) => p.id);

  const toggleCard = (id: string, dur: number) => { if (openId === id) stopPlayer(); else selectTrack(id, dur); };
  const del = (id: string) => { stopPlayer(); mutate((x) => { x.recordings = x.recordings.filter((r) => r.id !== id); }); };

  return (
    <>
      <TopBar title="My Recordings" rootBack back="settings" />
      <div className="scroll">
        <div className="content">
          <div className="card pad row-lite" role={pro ? undefined : 'button'} style={pro ? undefined : { cursor: 'pointer' }} onClick={pro ? undefined : openPaywall}>
            <span className="tile-ic lg"><Icon name="record" /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Call recording {!pro && <span className="pro-pill"><Icon name="lock" /> PRO</span>}</div>
              <div className="tiny muted" style={{ fontSize: 13 }}>Automatically record every outgoing call.</div>
            </div>
            {pro && <Toggle checked={d.settings.recording} label="Call recording" onChange={(v) => mutate((x) => { x.settings.recording = v; })} />}
          </div>
          {d.recordings.length ? d.recordings.map((r) => {
            const name = r.name || nameFor(d, r.phone);
            return (
              <PlayerCard key={r.id} id={r.id} className="card flat rec">
                <div className="rec-top" role="button" tabIndex={0} onClick={() => toggleCard(r.id, r.dur)}
                  onKeyDown={(e) => { if (e.key === 'Enter') toggleCard(r.id, r.dur); }}>
                  <span className="circle-ic s38" style={tint(r.dir === 'in' ? 'var(--success)' : 'var(--primary)')}>
                    <Icon name={r.dir === 'in' ? 'arrowDownLeft' : 'arrowUpRight'} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    <div className="tiny muted">{when(r.at)}</div>
                  </div>
                  <span className="tiny faint mono">{mmss(r.dur)}</span>
                </div>
                <div className="vm-expand">
                  <div className="row-lite" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
                    <PlayButton id={r.id} dur={r.dur} solid />
                    <div style={{ flex: 1 }}><ScrubBar id={r.id} dur={r.dur} /></div>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: 6 }}>
                    <button className="link-btn tiny" style={{ color: 'var(--danger)' }} onClick={() => del(r.id)}><Icon name="trash" /> Delete</button>
                  </div>
                </div>
              </PlayerCard>
            );
          }) : <Empty icon="waveform" title="No Call Recording Found" />}
        </div>
      </div>
    </>
  );
}
