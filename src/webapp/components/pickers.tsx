'use client';

/* Shared pickers (sheets): CountryPickerSheet, contact picker (PhoneBookPickerSheet) and
   friend picker (FriendListPickerSheet). Use the open* helpers from anywhere. */
import { useMemo, useState } from 'react';
import { Contact, COUNTRIES, Country } from '../data';
import { APP_NAME, cx, digits, fmtPhone } from '../format';
import { Icon } from '../icons';
import { friends, getData } from '../store';
import { closeSheet, openSheet } from '../ui';
import { Avatar, Empty, SheetHead } from './ui';

/* ---------------- country ---------------- */
function CountrySheet({ current, onPick }: { current: string; onPick: (c: Country) => void }) {
  const [q, setQ] = useState('');
  const items = COUNTRIES.filter((c) => {
    const s = q.trim().toLowerCase();
    return !s || c.name.toLowerCase().includes(s) || c.dial.includes(s) || c.code.toLowerCase() === s;
  });
  return (
    <>
      <SheetHead title="Select country" sub="Pick the country your number belongs to" />
      <div className="sheet-body">
        <div className="search"><Icon name="search" /><input placeholder="Search by country or code" value={q} onChange={(e) => setQ(e.target.value)} autoFocus /></div>
        {items.length ? (
          <div className="list" style={{ padding: 0 }}>
            {items.map((c) => {
              const on = c.code === current;
              return (
                <button key={c.code} className={cx('row country-row', on && 'sel')} onClick={() => { closeSheet(); onPick(c); }}>
                  <span className="flag-c">{c.flag}</span>
                  <span className="body"><span className="t">{c.name}</span></span>
                  <span className="dial-c mono">{c.dial}</span>
                  {on && <span className="ok-c"><Icon name="check" /></span>}
                </button>
              );
            })}
          </div>
        ) : <Empty icon="globe" title="No country found" sub="Try a different name or dial code." />}
      </div>
    </>
  );
}
export const openCountryPicker = (current: string, onPick: (c: Country) => void) => openSheet(<CountrySheet current={current} onPick={onPick} />);

/* ---------------- people (contacts / friends) ---------------- */
function PeopleSheet({ title, items, placeholder, multi, selected = [], emptyMsg, onDone }: {
  title: string; items: Contact[]; placeholder: string; multi?: boolean; selected?: string[]; emptyMsg: string; onDone: (list: Contact[]) => void;
}) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string[]>(selected);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((c) => !s || c.name.toLowerCase().includes(s) || (digits(s) && digits(c.phone).includes(digits(s))));
  }, [q, items]);
  const pick = (c: Contact) => {
    if (!multi) { closeSheet(); onDone([c]); return; }
    setSel((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]));
  };
  return (
    <>
      <div className="sheet-head">
        <button className="icon-btn plain" style={{ background: 'var(--field)' }} onClick={closeSheet} aria-label="Close"><Icon name="x" /></button>
        <div style={{ flex: 1 }}>
          <h3>{title}</h3>
          {multi && <div className="tiny muted">{sel.length ? `${sel.length} selected` : 'None selected'}</div>}
        </div>
        {multi && (
          <button className="chip on" style={{ opacity: sel.length ? 1 : 0.5 }} disabled={!sel.length}
            onClick={() => { closeSheet(); onDone(sel.map((id) => items.find((c) => c.id === id)).filter(Boolean) as Contact[]); }}>Done</button>
        )}
      </div>
      <div className="sheet-body">
        <div className="search"><Icon name="search" /><input placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} autoFocus /></div>
        {!items.length ? <Empty icon="users" title={emptyMsg} />
          : !shown.length ? <Empty icon="userQ" title="No matches" sub="Try a different name or number." />
          : (
            <div className="list" style={{ padding: 0 }}>
              {shown.map((c) => {
                const on = sel.includes(c.id);
                return (
                  <button key={c.id} className={cx('row pick', on && 'sel')} onClick={() => pick(c)}>
                    <Avatar name={c.name} size={40} />
                    <div className="body"><div className="t" style={{ fontSize: 15 }}>{c.name}</div><div className="s">{fmtPhone(c.phone)}</div></div>
                    {multi ? <span className="check-c">{on && <Icon name="check" />}</span> : <span className="chev"><Icon name="chevR" /></span>}
                  </button>
                );
              })}
            </div>
          )}
      </div>
    </>
  );
}

/** Phonebook picker. Single mode calls back with one contact. */
export function openContactPicker(o: { title?: string; multi?: boolean; selected?: string[] }, onDone: (list: Contact[]) => void) {
  const all = [...getData().contacts].sort((a, b) => a.name.localeCompare(b.name));
  return openSheet(<PeopleSheet title={o.title ?? (o.multi ? 'Pick contacts' : 'Pick contact')} items={all} placeholder="Search name or number"
    multi={o.multi} selected={o.selected} emptyMsg="No contacts" onDone={onDone} />);
}
/** Friend picker (app users only). */
export function openFriendPicker(o: { title?: string; multi?: boolean; exclude?: string[] }, onDone: (list: Contact[]) => void) {
  const list = friends(getData()).filter((f) => !(o.exclude ?? []).includes(f.id));
  return openSheet(<PeopleSheet title={o.title ?? (o.multi ? 'Pick friends' : 'Pick a friend')} items={list} placeholder="Search friends"
    multi={o.multi} emptyMsg={`No ${APP_NAME} friends yet.`} onDone={onDone} />);
}
