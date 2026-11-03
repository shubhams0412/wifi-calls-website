/* Formatting helpers — mirror Core/Utils (PhoneFormatting, TimestampFormatting) in the iOS app. */

export const APP_NAME = 'Wi-Fi Calling & Texting';
export const SUPPORT_EMAIL = 'support@wifiphonecalls.com';
export const STORE_URL = 'https://apps.apple.com/app/id6781677176';

export const digits = (s: string | null | undefined) => String(s ?? '').replace(/\D/g, '');

/** US/CA national formatting: "+1 (212) 555-0143" / "(212) 555-0143". */
export function fmtPhone(raw: string | null | undefined): string {
  const d = digits(raw);
  if (!d) return '';
  if (d.length === 11 && d[0] === '1') return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (String(raw).trim()[0] === '+') return '+' + d;
  return d;
}

/** As-you-type formatting for a national number. */
export function fmtTyping(raw: string): string {
  const d = digits(raw);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return d;
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n: number) => (n < 10 ? '0' : '') + n;

export const sameDay = (a: number | Date, b: number | Date) => {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};
const yesterday = () => { const y = new Date(); y.setDate(y.getDate() - 1); return y; };

export function clock(t: number | Date): string {
  const d = new Date(t), h = d.getHours();
  return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Inbox / call-history timestamp. */
export function when(t: number): string {
  const d = new Date(t), now = new Date();
  if (sameDay(d, now)) return clock(d);
  if (sameDay(d, yesterday())) return 'Yesterday';
  if (d.getFullYear() === now.getFullYear()) return `${MON[d.getMonth()]} ${d.getDate()}, ${clock(d)}`;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${clock(d)}`;
}

/** Day separator pill in threads. */
export function dayLabel(t: number): string {
  const d = new Date(t), now = new Date();
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, yesterday())) return 'Yesterday';
  if (d.getFullYear() === now.getFullYear()) return `${DAY[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
  return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
}

export const longDate = (t: number | Date) => { const d = new Date(t); return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };

export function purchaseDate(t: number): string {
  const d = new Date(t), now = new Date();
  if (sameDay(d, now)) return 'Today · ' + clock(d);
  if (sameDay(d, yesterday())) return 'Yesterday · ' + clock(d);
  if (d.getFullYear() === now.getFullYear()) return `${MON[d.getMonth()]} ${d.getDate()} · ${clock(d)}`;
  return `${longDate(t)} · ${clock(d)}`;
}

/** "45s", "2m 5s", "1h 3m". */
export function dur(s: number): string {
  s = Math.round(s || 0);
  if (s < 60) return s + 's';
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export const mmss = (s: number) => { s = Math.max(0, Math.round(s || 0)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };

/** First letter of a name for avatars ("" when there is none — avatar then shows a person glyph). */
export const initial = (name: string | null | undefined) => {
  const m = String(name ?? '').match(/[A-Za-zÀ-ɏ]/);
  return m ? m[0].toUpperCase() : '';
};

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
