/* Types + the empty starting state. Shapes follow the iOS app's Core/Models (simplified for the UI).
   The store caches this in localStorage; after sign-in it is filled from the backend (see sync.ts). */

export type Stage = 'splash' | 'onboarding' | 'rating' | 'paywall' | 'auth' | 'perms' | 'main';
export type Tier = 'none' | 'lite' | 'pro';

export interface Country { name: string; code: string; dial: string; flag: string }
export interface Contact { id: string; name: string; phone: string; friend: boolean; username?: string; /** QuickBlox user id (app friends). */ qbId?: string }
export interface Message { id: string; out: boolean; body: string; at: number; status: 'sending' | 'sent' | 'failed'; sender?: string | null; image?: string | null }
export interface SmsThread { id: string; phone: string; name: string; unread: number; messages: Message[]; created?: number; /** All messages loaded (not just the list preview). */ full?: boolean; lastPage?: boolean }
/** App-to-app chat: a QuickBlox dialog. `id` is the dialog id; 1:1 chats keep the other person's QuickBlox id. */
export interface ChatThread {
  id: string; name: string; friendId?: string; qbId?: string; group?: boolean; groupId?: string; unread: number; messages: Message[]; created?: number;
  /** History loaded (not just the list preview) / no older messages left. */ full?: boolean; lastPage?: boolean;
}
export interface GroupMember { qbId: string; name: string; admin: boolean }
/** A group as kept by the backend; `id` and `dialog` are the QuickBlox dialog id. */
export interface Group { id: string; name: string; admin: boolean; members: GroupMember[]; dialog: string | null; icon?: string }
export type CallType = 'phone' | 'app' | 'video' | 'group' | 'wifi';
/** App-to-app calls aren't recorded by the backend; the web logs them locally with id `qb:<session>` and the QuickBlox ids in `members`. */
export interface CallLog { id: string; phone: string; name: string; dir: 'in' | 'out' | 'missed'; dur: number; at: number; type: CallType; members?: string[] }
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
  voiceProvider?: 'twilio' | 'vonage';
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

export const DATA_VERSION = 5;

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
