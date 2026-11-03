/* Types + sample data. Shapes follow the iOS app's Core/Models (simplified for the UI).
   Everything lives in localStorage via the store; Settings → "Reset demo data" restores this seed. */

export type Stage = 'splash' | 'onboarding' | 'rating' | 'paywall' | 'auth' | 'perms' | 'main';
export type Tier = 'none' | 'lite' | 'pro';

export interface Country { name: string; code: string; dial: string; flag: string }
export interface Contact { id: string; name: string; phone: string; friend: boolean; username?: string }
export interface Message { id: string; out: boolean; body: string; at: number; status: 'sending' | 'sent' | 'failed'; sender?: string | null; image?: string | null }
export interface SmsThread { id: string; phone: string; name: string; unread: number; messages: Message[]; created?: number }
export interface ChatThread { id: string; name: string; friendId?: string; group?: boolean; groupId?: string; unread: number; messages: Message[]; created?: number }
export interface Group { id: string; name: string; admin: boolean; members: string[]; dialog: string | null }
export type CallType = 'phone' | 'app' | 'video' | 'group' | 'wifi';
export interface CallLog { id: string; phone: string; name: string; dir: 'in' | 'out' | 'missed'; dur: number; at: number; type: CallType }
export interface VoicemailItem { id: string; dir: string; dur: number; at: number; text?: string }
export interface Voicemail { id: string; phone: string; items: VoicemailItem[] }
export interface Recording { id: string; name: string; phone: string; dir: 'in' | 'out'; dur: number; at: number }
export interface Broadcast { id: string; recipients: string[]; messages: Message[] }
export interface Device { id: string; name: string; type: 'ios' | 'android' | 'web'; os: string; current: boolean; seen: number }
export interface UsageMonth { incoming_call: string; outgoing_call: string; sms_received: string; sms_sent: string }
export interface Settings {
  anon: boolean; recording: boolean; voicemail: boolean; greeting: 'default' | 'custom'; customGreeting: boolean;
  fontSize: 'Small' | 'Medium' | 'Large'; signature: string; chatBg: string | null;
}
export interface User { first: string; last: string; username: string; phone: string; country: string }

export interface AppData {
  v: number;
  stage: Stage;
  tier: Tier;
  permsDone: boolean;
  launches: number;
  ratingSeen?: boolean;
  user: User;
  number: string | null;
  coins: number;
  purchases: { coins: number; at: number }[];
  contacts: Contact[];
  contactsPermission: 'unknown' | 'granted' | 'denied';
  sms: SmsThread[];
  chats: ChatThread[];
  groups: Group[];
  calls: CallLog[];
  voicemails: Voicemail[];
  recordings: Recording[];
  broadcasts: Broadcast[];
  blocked: { phone: string; name: string }[];
  devices: Device[];
  usage: { thisMonth: UsageMonth; previousMonth: UsageMonth };
  settings: Settings;
}

export const COUNTRIES: Country[] = [
  ['United States', 'US', '+1', '🇺🇸'], ['Canada', 'CA', '+1', '🇨🇦'],
  ['Afghanistan', 'AF', '+93', '🇦🇫'], ['Albania', 'AL', '+355', '🇦🇱'], ['Algeria', 'DZ', '+213', '🇩🇿'],
  ['Argentina', 'AR', '+54', '🇦🇷'], ['Australia', 'AU', '+61', '🇦🇺'], ['Austria', 'AT', '+43', '🇦🇹'],
  ['Bangladesh', 'BD', '+880', '🇧🇩'], ['Belgium', 'BE', '+32', '🇧🇪'], ['Brazil', 'BR', '+55', '🇧🇷'],
  ['Chile', 'CL', '+56', '🇨🇱'], ['China', 'CN', '+86', '🇨🇳'], ['Colombia', 'CO', '+57', '🇨🇴'],
  ['Denmark', 'DK', '+45', '🇩🇰'], ['Egypt', 'EG', '+20', '🇪🇬'], ['Finland', 'FI', '+358', '🇫🇮'],
  ['France', 'FR', '+33', '🇫🇷'], ['Germany', 'DE', '+49', '🇩🇪'], ['Greece', 'GR', '+30', '🇬🇷'],
  ['Hong Kong', 'HK', '+852', '🇭🇰'], ['India', 'IN', '+91', '🇮🇳'], ['Indonesia', 'ID', '+62', '🇮🇩'],
  ['Ireland', 'IE', '+353', '🇮🇪'], ['Israel', 'IL', '+972', '🇮🇱'], ['Italy', 'IT', '+39', '🇮🇹'],
  ['Japan', 'JP', '+81', '🇯🇵'], ['Kenya', 'KE', '+254', '🇰🇪'], ['Malaysia', 'MY', '+60', '🇲🇾'],
  ['Mexico', 'MX', '+52', '🇲🇽'], ['Netherlands', 'NL', '+31', '🇳🇱'], ['New Zealand', 'NZ', '+64', '🇳🇿'],
  ['Nigeria', 'NG', '+234', '🇳🇬'], ['Norway', 'NO', '+47', '🇳🇴'], ['Pakistan', 'PK', '+92', '🇵🇰'],
  ['Philippines', 'PH', '+63', '🇵🇭'], ['Poland', 'PL', '+48', '🇵🇱'], ['Portugal', 'PT', '+351', '🇵🇹'],
  ['Saudi Arabia', 'SA', '+966', '🇸🇦'], ['Singapore', 'SG', '+65', '🇸🇬'], ['South Africa', 'ZA', '+27', '🇿🇦'],
  ['South Korea', 'KR', '+82', '🇰🇷'], ['Spain', 'ES', '+34', '🇪🇸'], ['Sri Lanka', 'LK', '+94', '🇱🇰'],
  ['Sweden', 'SE', '+46', '🇸🇪'], ['Switzerland', 'CH', '+41', '🇨🇭'], ['Thailand', 'TH', '+66', '🇹🇭'],
  ['Turkey', 'TR', '+90', '🇹🇷'], ['United Arab Emirates', 'AE', '+971', '🇦🇪'], ['United Kingdom', 'GB', '+44', '🇬🇧'],
  ['Vietnam', 'VN', '+84', '🇻🇳'],
].map(([name, code, dial, flag]) => ({ name, code, dial, flag }));

/** Per-minute / per-SMS coin rates (PerMinuteRatesView) — illustrative values. */
export const RATES = COUNTRIES.map((c, i) => {
  const base = c.code === 'US' || c.code === 'CA' ? 1 : 2 + ((i * 7) % 9);
  return { name: c.name, code: c.code, flag: c.flag, call: base, sms: Math.max(1, Math.round(base * 0.8)) };
}).sort((a, b) => a.name.localeCompare(b.name));

/** Numbers offered by Buy Number: [digits, city, region]. */
export const AVAILABLE: Record<'US' | 'CA', [string, string, string][]> = {
  US: [
    ['12125550143', 'New York', 'NY'], ['13105550178', 'Los Angeles', 'CA'], ['13125550126', 'Chicago', 'IL'],
    ['14155550190', 'San Francisco', 'CA'], ['17865550112', 'Miami', 'FL'], ['15125550164', 'Austin', 'TX'],
    ['12065550155', 'Seattle', 'WA'], ['16175550133', 'Boston', 'MA'],
  ],
  CA: [
    ['14165550147', 'Toronto', 'ON'], ['16045550121', 'Vancouver', 'BC'], ['15145550186', 'Montréal', 'QC'],
    ['14035550119', 'Calgary', 'AB'], ['16135550170', 'Ottawa', 'ON'],
  ],
};

export const DATA_VERSION = 3;

let n = 0;
export const uid = () => Date.now().toString(36) + (n++).toString(36) + Math.random().toString(36).slice(2, 6);

const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

export function seed(): AppData {
  const now = Date.now();
  const t = (ago: number) => now - ago;
  const msgs = (list: [number, string, number, string?][]): Message[] =>
    list.map((m, i) => ({ id: 'm' + i + uid(), out: m[0] === 1, body: m[1], at: t(m[2]), status: 'sent', sender: m[3] ?? null }));

  const contacts: Contact[] = [
    { id: 'c1', name: 'Ava Johnson', phone: '+14155550101', friend: true, username: 'ava.j' },
    { id: 'c2', name: 'Daniel Smith', phone: '+12125550102', friend: true, username: 'dan_smith' },
    { id: 'c3', name: 'Emily Clark', phone: '+13105550103', friend: true, username: 'emilyk' },
    { id: 'c4', name: 'James Rodriguez', phone: '+16175550104', friend: false },
    { id: 'c5', name: 'Mia Patel', phone: '+17865550105', friend: true, username: 'miap' },
    { id: 'c6', name: 'Noah Williams', phone: '+15125550106', friend: false },
    { id: 'c7', name: 'Olivia Martin', phone: '+12065550107', friend: true, username: 'olivia.m' },
    { id: 'c8', name: 'Sophia Lee', phone: '+13125550108', friend: false },
    { id: 'c9', name: 'Liam Brown', phone: '+14165550109', friend: false },
    { id: 'c10', name: 'Isabella Garcia', phone: '+16045550110', friend: false },
    { id: 'c11', name: 'Ethan Davis', phone: '+17185550111', friend: true, username: 'ethan_d' },
    { id: 'c12', name: 'Dentist — Bright Smiles', phone: '+18005550112', friend: false },
  ];

  return {
    v: DATA_VERSION,
    stage: 'splash',
    tier: 'none',
    permsDone: false,
    launches: 0,
    user: { first: '', last: '', username: '', phone: '', country: 'US' },
    number: null,
    coins: 25,
    purchases: [{ coins: 100, at: t(12 * DAY) }],
    contacts,
    contactsPermission: 'granted',
    sms: [
      { id: 's1', phone: '+14155550101', name: 'Ava Johnson', unread: 2, messages: msgs([
        [1, 'Hey! Are we still on for Saturday?', 2 * DAY + 3 * HOUR],
        [0, 'Yes! 11am at the farmers market 🌽', 2 * DAY + 2 * HOUR],
        [1, 'Perfect, see you there', 2 * DAY + 2 * HOUR - 4 * MIN],
        [0, 'Running 10 min late, sorry!', 22 * MIN],
        [0, 'Grab a coffee for me? ☕️', 20 * MIN],
      ]) },
      { id: 's2', phone: '+18005550112', name: 'Dentist — Bright Smiles', unread: 1, messages: msgs([
        [0, 'Reminder: your cleaning appointment is tomorrow at 3:30 PM. Reply C to confirm.', 3 * HOUR],
      ]) },
      { id: 's3', phone: '+16175550104', name: 'James Rodriguez', unread: 0, messages: msgs([
        [0, 'Can you send me the listing link?', DAY + 5 * HOUR],
        [1, 'Sure — sending it over now', DAY + 4 * HOUR],
        [1, 'https://example.com/listing/2041', DAY + 4 * HOUR - MIN],
        [0, 'Thanks, looks great 👍', DAY + 2 * HOUR],
      ]) },
      { id: 's4', phone: '+13125550108', name: 'Sophia Lee', unread: 0, messages: msgs([
        [1, 'Happy birthday Sophia!! 🎉', 9 * DAY],
        [0, 'Aww thank you so much ❤️', 9 * DAY - HOUR],
      ]) },
      { id: 's5', phone: '+19175550177', name: '', unread: 0, messages: msgs([[0, 'Your verification code is 482913', 40 * DAY]]) },
    ],
    chats: [
      { id: 'd1', name: 'Daniel Smith', friendId: 'c2', unread: 1, messages: msgs([
        [0, 'Did you watch the game last night?', 5 * HOUR],
        [1, 'Yes!! That last-minute goal 🔥', 4 * HOUR],
        [0, 'Unreal. Call later?', 50 * MIN],
      ]) },
      { id: 'd2', name: 'Emily Clark', friendId: 'c3', unread: 0, messages: msgs([
        [1, 'Sent you the recipe', DAY + 6 * HOUR],
        [0, 'Made it tonight — delicious 😋', DAY + HOUR],
      ]) },
      { id: 'd3', name: 'Weekend Hikers', group: true, groupId: 'g1', unread: 3, messages: msgs([
        [0, 'Trail is open again from Saturday', 7 * HOUR, 'Mia Patel'],
        [0, 'I can drive, have space for 3', 6 * HOUR, 'Ethan Davis'],
        [1, 'Count me in!', 6 * HOUR - 10 * MIN],
        [0, 'Meet at 7:30 at the trailhead?', 2 * HOUR, 'Olivia Martin'],
      ]) },
      { id: 'd4', name: 'Olivia Martin', friendId: 'c7', unread: 0, messages: [] },
    ],
    groups: [
      { id: 'g1', name: 'Weekend Hikers', admin: true, members: ['me', 'c5', 'c7', 'c11'], dialog: 'd3' },
      { id: 'g2', name: 'Family', admin: false, members: ['me', 'c1', 'c3'], dialog: null },
    ],
    calls: [
      { id: 'h1', phone: '+14155550101', name: 'Ava Johnson', dir: 'out', dur: 312, at: t(35 * MIN), type: 'phone' },
      { id: 'h2', phone: '+12125550102', name: 'Daniel Smith', dir: 'missed', dur: 0, at: t(3 * HOUR), type: 'app' },
      { id: 'h3', phone: '+13105550103', name: 'Emily Clark', dir: 'in', dur: 754, at: t(5 * HOUR), type: 'video' },
      { id: 'h4', phone: '+18005550112', name: 'Dentist — Bright Smiles', dir: 'in', dur: 95, at: t(DAY + 2 * HOUR), type: 'phone' },
      { id: 'h5', phone: '+19175550177', name: '', dir: 'missed', dur: 0, at: t(DAY + 7 * HOUR), type: 'phone' },
      { id: 'h6', phone: '', name: 'Weekend Hikers', dir: 'out', dur: 1880, at: t(3 * DAY), type: 'group' },
      { id: 'h7', phone: '+16175550104', name: 'James Rodriguez', dir: 'out', dur: 45, at: t(6 * DAY), type: 'wifi' },
      { id: 'h8', phone: '+13125550108', name: 'Sophia Lee', dir: 'in', dur: 2410, at: t(70 * DAY), type: 'phone' },
    ],
    voicemails: [
      { id: 'v1', phone: '+16175550104', items: [
        { id: 'vi1', dir: 'inbound', dur: 23, at: t(4 * HOUR), text: "Hey, it's James — call me back about the apartment when you get a sec." },
        { id: 'vi2', dir: 'inbound', dur: 41, at: t(3 * DAY), text: 'Hi, just following up on the viewing. Thursday works for me.' },
      ] },
      { id: 'v2', phone: '+19175550177', items: [
        { id: 'vi3', dir: 'inbound', dur: 12, at: t(DAY + 7 * HOUR), text: 'This is a message for the account holder…' },
      ] },
    ],
    recordings: [
      { id: 'r1', name: 'Ava Johnson', phone: '+14155550101', dir: 'out', dur: 312, at: t(35 * MIN) },
      { id: 'r2', name: 'James Rodriguez', phone: '+16175550104', dir: 'out', dur: 45, at: t(6 * DAY) },
      { id: 'r3', name: 'Dentist — Bright Smiles', phone: '+18005550112', dir: 'in', dur: 95, at: t(DAY + 2 * HOUR) },
    ],
    broadcasts: [
      { id: 'b1', recipients: ['c4', 'c8', 'c9'], messages: [{ id: 'bm1', body: 'Open house this Sunday 1–4pm at 21 Elm St. Hope to see you!', at: t(4 * DAY), out: true, status: 'sent' }] },
    ],
    blocked: [{ phone: '+12025550199', name: '' }],
    devices: [
      { id: 'dv1', name: 'Web browser', type: 'web', os: 'Web', current: true, seen: now },
      { id: 'dv2', name: 'iPhone 16 Pro', type: 'ios', os: '26.1', current: false, seen: t(2 * HOUR) },
      { id: 'dv3', name: 'iPad Air', type: 'ios', os: '26.0', current: false, seen: t(9 * DAY) },
    ],
    usage: {
      thisMonth: { incoming_call: '14', outgoing_call: '22', sms_received: '57', sms_sent: '41' },
      previousMonth: { incoming_call: '19', outgoing_call: '30', sms_received: '88', sms_sent: '63' },
    },
    settings: { anon: false, recording: true, voicemail: false, greeting: 'default', customGreeting: false, fontSize: 'Small', signature: 'None', chatBg: null },
  };
}
