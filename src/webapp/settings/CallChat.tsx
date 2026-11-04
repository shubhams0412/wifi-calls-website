'use client';

/* Call settings, Voicemail settings (+ greeting recorder), Blocked numbers, Chat settings, Chat background. */
import { useEffect, useRef, useState } from 'react';
import { cx, digits, fmtPhone, fmtTyping, mmss } from '../format';
import { Icon } from '../icons';
import { country, isBlocked, isPro, mutate, nameFor, useData } from '../store';
import { alertDialog, confirmDialog, toast } from '../ui';
import { wc } from '../api';
import { loadBlocklist, persist } from '../sync';
import { blockNumber, unblockNumber } from '../messages/Threads';
import { stopPlayer } from '../player';
import { Empty, PlayButton, PlayerCard, ScrubBar, TopBar } from '../components/ui';
import { openContactPicker, openCountryPicker } from '../components/pickers';
import { LinkTile, SectionHead, tint, ToggleTile } from './parts';

export function CallSettingsView() {
  const d = useData();
  const clearCalls = async () => {
    if (!(await confirmDialog({ title: 'Clear all call history?', ok: 'Clear', danger: true }))) return;
    const r = await wc('clearCallLogs');
    if (!r.ok) return toast(r.message || 'Couldn’t clear call history. Please try again.');
    mutate((x) => { x.calls = []; });
    toast('Call history cleared');
  };
  return (
    <>
      <TopBar title="Call Settings" rootBack back="settings" />
      <div className="scroll">
        <div className="content narrow">
          <SectionHead icon="lock">PRIVACY</SectionHead>
          <ToggleTile icon="userQ" color="accent" title="Anonymous call" sub="Hide your number from the person you're calling." pro
            on={d.settings.anon} onChange={(v) => persist('anonymousSetting', { is_anonymous: v }, (x) => { x.settings.anon = v; })} />
          <ToggleTile icon="record" color="primary" title="Call recording" sub="Automatically record every outgoing call." pro
            on={d.settings.recording} onChange={(v) => persist('recordingSetting', { is_call_record: v }, (x) => { x.settings.recording = v; })} />
          <SectionHead icon="sliders" style={{ marginTop: 6 }}>MANAGE</SectionHead>
          <LinkTile href="settings/call/voicemail" icon="mic" color="success" title="Voicemail" sub="Set up greetings and record missed-call messages." pro />
          <LinkTile href="settings/call/blocked" icon="phoneDown" color="warning" title="Blocked numbers" sub="Stop calls and texts from specific numbers." />
          <LinkTile onClick={clearCalls} icon="trash" color="danger" title="Clear call history" sub="Permanently delete every call log entry." danger />
        </div>
      </div>
    </>
  );
}

/* ---------------- voicemail ---------------- */
function Recorder() {
  const custom = useData().settings.customGreeting;
  const [state, setState] = useState<'idle' | 'recording' | 'review'>('idle');
  const [t, setT] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [saving, setSaving] = useState(false);

  const stopTracks = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach((x) => x.stop()); stream.current = null; };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); stopTracks(); }, []);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    stopTracks();
    setState('review');
  };
  const start = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      recorder.current = new MediaRecorder(stream.current);
      recorder.current.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      recorder.current.start();
    } catch {
      toast('Microphone access is needed to record.');
      return;
    }
    setT(0);
    setState('recording');
    timer.current = setInterval(() => {
      setT((v) => {
        if (v + 1 >= 60) { toast('Recording limit reached (60 seconds).'); setTimeout(stop, 0); }
        return v + 1;
      });
    }, 1000);
  };

  if (state === 'recording') {
    return (
      <div className="card pad rec-box">
        <span className="rec-live" />
        <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Recording</div><div className="mono" style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 20 }}>{mmss(t)}</div></div>
        <button className="chip" style={{ background: 'var(--danger)', color: '#fff' }} onClick={stop}><Icon name="stop" /> Stop</button>
      </div>
    );
  }
  if (state === 'review') {
    const dur = Math.max(1, t);
    return (
      <PlayerCard id="greeting" className="card pad">
        <div className="row-lite">
          <PlayButton id="greeting" dur={dur} />
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>Review your recording</div><ScrubBar id="greeting" dur={dur} /></div>
        </div>
        <div className="row-lite" style={{ marginTop: 12 }}>
          <button className="btn btn-outline sm" style={{ flex: 1 }} onClick={() => { stopPlayer(); setState('idle'); }}>Discard</button>
          <button className="btn btn-primary sm" style={{ flex: 1 }} disabled={saving} onClick={async () => {
            const type = recorder.current?.mimeType || 'audio/webm';
            const ext = /mp4|aac|m4a/.test(type) ? 'm4a' : /ogg/.test(type) ? 'ogg' : 'webm';
            const file = new File(chunks.current, `greeting.${ext}`, { type });
            if (!file.size) return toast('Nothing was recorded. Try again.');
            setSaving(true);
            const r = await wc('customVoicemail', {}, { voiceMailMessageFile: file });
            setSaving(false);
            if (!r.ok) return alertDialog('Couldn’t save your greeting', r.message || 'Please try again.');
            await persist('voicemailSettings', { isEnabled: 1, voiceMailType: 0 }, (x) => { x.settings.customGreeting = true; x.settings.greeting = 'custom'; });
            stopPlayer(); setState('idle'); toast('Greeting saved');
          }}><Icon name="check" /> {saving ? 'Saving…' : 'Save'}</button>
        </div>
      </PlayerCard>
    );
  }
  return <button className="btn btn-primary block" onClick={start}><Icon name="mic" /> {custom ? 'Record new greeting' : 'Start recording'}</button>;
}

export function VoicemailSettingsView() {
  const d = useData();
  const st = d.settings;
  const on = st.voicemail && isPro(d);
  const Radio = ({ k, title, sub }: { k: 'default' | 'custom'; title: string; sub: string }) => (
    <button className={cx('card pad row-lite radio-tile', st.greeting === k && 'on')} onClick={() => {
      // The default greeting is saved straight away; "your own" is saved once a recording is uploaded.
      if (k === 'default') persist('voicemailSettings', { isEnabled: 1, voiceMailType: 1 }, (x) => { x.settings.greeting = 'default'; });
      else if (st.customGreeting) persist('voicemailSettings', { isEnabled: 1, voiceMailType: 0 }, (x) => { x.settings.greeting = 'custom'; });
      else mutate((x) => { x.settings.greeting = 'custom'; });
    }}>
      <span className="radio-c"><i /></span>
      <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontWeight: 600 }}>{title}</div><div className="tiny muted" style={{ fontSize: 13 }}>{sub}</div></div>
    </button>
  );
  return (
    <>
      <TopBar title="Voicemail" back="settings/call" />
      <div className="scroll">
        <div className="content narrow">
          <div className="card pad row-lite">
            <span className="grad-circle" style={{ width: 50, height: 50 }}><Icon name="phone" /></span>
            <div style={{ flex: 1 }}><div className="tiny muted">Voicemail for</div><div className="mono" style={{ fontWeight: 700, fontSize: 17 }}>{d.number ? fmtPhone(d.number) : '—'}</div></div>
            <span className="chip" style={on ? { background: 'color-mix(in srgb,var(--success) 12%,transparent)', color: 'var(--success)' } : undefined}>
              <i className="dot" style={{ background: 'currentColor' }} />{on ? 'On' : 'Off'}
            </span>
          </div>
          <ToggleTile icon="mic" color="success" title="Use voicemail" sub="Play your greeting and record missed-call messages." pro
            on={on} onChange={(v) => persist('voicemailSettings', { isEnabled: v, voiceMailType: st.greeting === 'custom' && st.customGreeting ? 0 : 1 }, (x) => { x.settings.voicemail = v; })} />
          {on && (
            <>
              <SectionHead icon="waveform" style={{ marginTop: 6 }}>GREETING</SectionHead>
              <Radio k="default" title="Default greeting" sub="Standard voicemail message." />
              <Radio k="custom" title="Your own greeting" sub={st.customGreeting ? 'Custom recording uploaded.' : 'Record a custom message in your voice.'} />
              {st.greeting === 'custom' && <Recorder />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- blocked numbers ---------------- */
export function BlockedView() {
  const d = useData();
  useEffect(() => { loadBlocklist(); }, []);
  const [cc, setCc] = useState('US');
  const [phone, setPhone] = useState('');
  const c = country(cc);

  const block = () => {
    if (phone.length < 7) { toast('That number is too short to block.'); return; }
    const p = c.dial + phone;
    if (isBlocked(d, p)) { toast('That number is already blocked.'); return; }
    blockNumber(p);
    setPhone('');
  };
  const blockContact = () => openContactPicker({ title: 'Block a contact' }, ([ct]) => {
    if (!ct) return;
    if (isBlocked(d, ct.phone)) { toast('Already blocked.'); return; }
    blockNumber(ct.phone);
  });

  return (
    <>
      <TopBar title="Blocked numbers" back="settings/call"
        right={<button className="icon-btn" onClick={blockContact} title="Block a contact" aria-label="Block a contact"><Icon name="contactPlus" /></button>} />
      <div className="scroll">
        <div className="content narrow">
          <div className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="row-lite">
              <span className="circle-ic" style={tint('danger')}><Icon name="nosign" /></span>
              <div><div style={{ fontWeight: 600 }}>Block a number</div><div className="tiny muted" style={{ fontSize: 13 }}>They won&apos;t be able to call or text you.</div></div>
            </div>
            <div className="phone-row">
              <button className="country-pill" onClick={() => openCountryPicker(cc, (x) => setCc(x.code))}>{c.flag} <b className="mono">{c.dial}</b> <Icon name="chevD" /></button>
              <span className="icon-input" style={{ flex: 1 }}><Icon name="phone" />
                <input className="input mono" inputMode="tel" placeholder="Phone number" value={fmtTyping(phone)}
                  onChange={(e) => setPhone(digits(e.target.value).slice(0, 15))} onKeyDown={(e) => { if (e.key === 'Enter' && phone.length >= 4) block(); }} />
              </span>
            </div>
            <button className="btn btn-primary sm block" disabled={phone.length < 4} onClick={block}><Icon name="nosign" /> Block this number</button>
          </div>
          <div className="card-h" style={{ padding: '0 4px' }}><span style={{ color: 'var(--danger)' }}><Icon name="nosign" /></span> BLOCKED {d.blocked.length > 0 && <span className="badge">{d.blocked.length}</span>}</div>
          <div className="list" style={{ padding: 0 }}>
            {d.blocked.length ? d.blocked.map((b, i) => {
              const name = b.name || nameFor(d, b.phone, '');
              const hasName = !!name && name !== fmtPhone(b.phone);
              return (
                <div className="row" key={b.phone + i}>
                  <span className="circle-ic" style={tint('danger')}><Icon name="nosign" /></span>
                  <div className="body">
                    <div className="t" style={{ fontSize: 15 }}>{hasName ? name : fmtPhone(b.phone)}</div>
                    {hasName && <div className="s mono" style={{ fontSize: 11 }}>{fmtPhone(b.phone)}</div>}
                  </div>
                  <button className="chip success" onClick={() => unblockNumber(b.phone)}>Unblock</button>
                </div>
              );
            }) : <Empty icon="shieldCheck" title="Nothing blocked" sub="Numbers you block won't be able to call or text you." />}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- chat settings ---------------- */
export function ChatSettingsView() {
  const d = useData();
  const st = d.settings, u = d.user;
  const [open, setOpen] = useState<'font' | 'sig' | null>(null);
  const fullName = `${u.first || ''} ${u.last || ''}`.trim();
  const sigs = ['None', 'Message from ' + (fullName || u.username || 'me'), 'Message from ID: ' + fmtPhone(d.number || u.phone)];

  const Exp = ({ k, icon, color, title, sub, options, cur, onPick }: {
    k: 'font' | 'sig'; icon: 'textSize' | 'signature'; color: string; title: string; sub: string; options: string[]; cur: string; onPick: (v: string) => void;
  }) => (
    <div className="card pad tile">
      <button className="row-lite" style={{ width: '100%' }} onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k}>
        <span className="tile-ic lg" style={tint(color)}><Icon name={icon} /></span>
        <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontWeight: 600 }}>{title}</div><div className="tiny muted" style={{ fontSize: 13 }}>{sub}</div></div>
        <span className={cx('circle-ic s32 rot', open === k && 'on')} style={{ background: 'var(--accent-soft)' }}><Icon name="chevD" /></span>
      </button>
      {open === k && (
        <div className="opts">
          {options.map((o) => <button key={o} className={cx('chip', o === cur && 'on')} onClick={() => onPick(o)}>{o === cur && <Icon name="check" />} {o}</button>)}
        </div>
      )}
    </div>
  );

  const clearChats = async () => {
    if (!(await confirmDialog({ title: 'Clear all chats?', message: 'Are you sure want to clear all chats?', ok: 'Clear', danger: true }))) return;
    mutate((x) => { x.chats.forEach((c) => { c.messages = []; c.unread = 0; }); });
    toast('Successfully cleared all chats');
  };

  return (
    <>
      <TopBar title="Chat Settings" rootBack back="settings" />
      <div className="scroll">
        <div className="content narrow">
          <SectionHead icon="palette">APPEARANCE</SectionHead>
          <LinkTile href="settings/chat/background" icon="image" color="accent" title="Chat background" sub="Pick a wallpaper for chat threads." />
          <Exp k="font" icon="textSize" color="primary" title="Font size" sub={'Currently · ' + st.fontSize} options={['Small', 'Medium', 'Large']} cur={st.fontSize}
            onPick={(v) => persist('chatSettings', { font_size: v }, (x) => { x.settings.fontSize = v as typeof st.fontSize; })} />
          <Exp k="sig" icon="signature" color="warning" title="Message signature" sub={st.signature || 'Add a signature'} options={sigs} cur={st.signature}
            onPick={(v) => persist('chatSettings', { chat_signature: v }, (x) => { x.settings.signature = v; })} />
          <SectionHead icon="sliders" style={{ marginTop: 6 }}>MANAGE</SectionHead>
          <LinkTile onClick={clearChats} icon="trash" color="danger" title="Clear all chats" sub="Permanently delete every chat thread." danger />
        </div>
      </div>
    </>
  );
}

const PRESETS: [string, string][] = [['#EDE4FB', '#FDE6F4'], ['#E0F2FE', '#EDE4FB'], ['#FFF1D6', '#FDE6F4'], ['#DCFCE7', '#E0F2FE'], ['#1A1233', '#4A2380']];

export function ChatBackgroundView() {
  const bg = useData().settings.chatBg;
  const fileRef = useRef<HTMLInputElement>(null);
  const setBg = async (url: string | null, msg: string) => {
    if (!url) return void persist('chatSettings', { remove_chat_background: 1 }, (x) => { x.settings.chatBg = null; }, { ok: msg });
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], blob.type === 'image/png' ? 'background.png' : 'background.jpg', { type: blob.type });
    persist('chatSettings', {}, (x) => { x.settings.chatBg = url; }, { files: { chat_background: file }, ok: msg });
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 900 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = img.width * s; c.height = img.height * s;
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        setBg(c.toDataURL('image/jpeg', 0.75), 'Chat background updated');
      };
      img.onerror = () => toast("That image couldn't be opened.");
      img.src = String(r.result);
    };
    r.readAsDataURL(f);
  };
  const preset = ([a, b]: [string, string]) => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 400;
    const x = c.getContext('2d')!;
    const g = x.createLinearGradient(0, 0, 400, 400); g.addColorStop(0, a); g.addColorStop(1, b);
    x.fillStyle = g; x.fillRect(0, 0, 400, 400);
    setBg(c.toDataURL('image/png'), 'Chat background updated');
  };

  return (
    <>
      <TopBar title="Chat Background" back="settings/chat" />
      <div className="scroll">
        <div className="content narrow">
          <div className="group">
            <button className="item" onClick={() => fileRef.current?.click()}>
              <span className="tile-ic" style={{ ['--c' as string]: '#fff', background: '#6366F1' }}><Icon name="image" /></span>
              <span className="lbl">Choose Existing</span><span className="chev faint"><Icon name="chevR" /></span>
            </button>
          </div>
          <div className="group-title">Presets</div>
          <div className="bg-presets">
            {PRESETS.map((p, i) => <button key={i} style={{ background: `linear-gradient(135deg,${p[0]},${p[1]})` }} onClick={() => preset(p)} aria-label={'Preset ' + (i + 1)} />)}
          </div>
          {bg && (
            <>
              <div className="group-title">Current Background</div>
              <div className="bg-preview" style={{ backgroundImage: `url(${bg})` }} />
              <button className="btn btn-outline block" style={{ color: 'var(--danger)' }} onClick={() => setBg(null, 'Chat background wallpaper removed successfully.')}>Remove background</button>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
      </div>
    </>
  );
}
