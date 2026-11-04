/* Types + the empty starting state. Shapes follow the iOS app's Core/Models (simplified for the UI).
   The store caches this in localStorage; after sign-in it is filled from the backend (see sync.ts). */

export type Stage = 'splash' | 'onboarding' | 'rating' | 'paywall' | 'auth' | 'perms' | 'main';
export type Tier = 'none' | 'lite' | 'pro';

export interface Country { name: string; code: string; dial: string; flag: string }
export interface Contact { id: string; name: string; phone: string; friend: boolean; username?: string }
export interface Message { id: string; out: boolean; body: string; at: number; status: 'sending' | 'sent' | 'failed'; sender?: string | null; image?: string | null }
export interface SmsThread { id: string; phone: string; name: string; unread: number; messages: Message[]; created?: number; /** All messages loaded (not just the list preview). */ full?: boolean; lastPage?: boolean }
export interface ChatThread { id: string; name: string; friendId?: string; group?: boolean; groupId?: string; unread: number; messages: Message[]; created?: number }
export interface Group { id: string; name: string; admin: boolean; members: string[]; dialog: string | null }
export type CallType = 'phone' | 'app' | 'video' | 'group' | 'wifi';
export interface CallLog { id: string; phone: string; name: string; dir: 'in' | 'out' | 'missed'; dur: number; at: number; type: CallType }
export interface VoicemailItem { id: string; dir: string; dur: number; at: number; text?: string; url?: string }
export interface Voicemail { id: string; phone: string; name?: string; items: VoicemailItem[] }
export interface Recording { id: string; name: string; phone: string; dir: 'in' | 'out'; dur: number; at: number; url?: string }
export interface Broadcast { id: string; recipients: string[]; messages: Message[]; /** Recipient names as saved on the backend. */ title?: string }
export interface Device { id: string; name: string; type: 'ios' | 'android' | 'web'; os: string; current: boolean; seen: number }
export interface UsageMonth { incoming_call: string; outgoing_call: string; sms_received: string; sms_sent: string }
export interface Settings {
  anon: boolean; recording: boolean; voicemail: boolean; greeting: 'default' | 'custom'; customGreeting: boolean;
  fontSize: 'Small' | 'Medium' | 'Large'; signature: string; chatBg: string | null;
}
export interface User { first: string; last: string; username: string; phone: string; country: string; id?: string; quickbloxId?: string }

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
  blocked: { id?: string; phone: string; name: string }[];
  devices: Device[];
  usage: { thisMonth: UsageMonth; previousMonth: UsageMonth };
  settings: Settings;
  /** Forwarding as saved on the backend. */
  forwarding?: { on: boolean; to: string };
  /** When the backend data was last loaded. */
  syncedAt?: number;
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

export const DATA_VERSION = 4;

let n = 0;
export const uid = () => Date.now().toString(36) + (n++).toString(36) + Math.random().toString(36).slice(2, 6);

/** The signed-out starting state. Everything else comes from the backend after sign-in. */
export function seed(): AppData {
  return {
    v: DATA_VERSION,
    stage: 'splash',
    tier: 'none',
    permsDone: false,
    launches: 0,
    user: { first: '', last: '', username: '', phone: '', country: 'US' },
    number: null,
    coins: 0,
    purchases: [],
    contacts: [],
    contactsPermission: 'unknown',
    sms: [],
    chats: [],
    groups: [],
    calls: [],
    voicemails: [],
    recordings: [],
    broadcasts: [],
    blocked: [],
    devices: [],
    usage: {
      thisMonth: { incoming_call: '0', outgoing_call: '0', sms_received: '0', sms_sent: '0' },
      previousMonth: { incoming_call: '0', outgoing_call: '0', sms_received: '0', sms_sent: '0' },
    },
    settings: { anon: false, recording: false, voicemail: false, greeting: 'default', customGreeting: false, fontSize: 'Small', signature: 'None', chatBg: null },
  };
}
