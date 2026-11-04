'use client';

/* App data store (demo data, persisted to localStorage) + lookups and cross-screen helpers. */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppData, ChatThread, Contact, COUNTRIES, Country, DATA_VERSION, Message, seed, SmsThread, uid } from './data';
import { APP_NAME, digits, fmtPhone } from './format';

interface AppStore {
  data: AppData;
  hydrated: boolean;
  /** Apply an in-place change to a copy of the data and save it. */
  mutate: (fn: (d: AppData) => void) => void;
  reset: () => void;
}

export const useApp = create<AppStore>()(
  persist(
    (set) => ({
      data: seed(),
      hydrated: false,
      mutate: (fn) => set((s) => { const d = structuredClone(s.data); fn(d); return { data: d }; }),
      reset: () => set({ data: seed() }),
    }),
    {
      name: 'wificalls-web-v2',
      version: DATA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data }),
      // A saved state from an older data shape is thrown away rather than half-migrated.
      migrate: () => ({ data: seed() }) as unknown as AppStore,
      // Loaded explicitly after mount (see hydrateApp) so server and first client render match.
      skipHydration: true,
    },
  ),
);

/** Load saved data from localStorage once, then mark the store ready. */
export async function hydrateApp() {
  if (useApp.getState().hydrated) return;
  try { await useApp.persist.rehydrate(); } catch { /* storage unavailable — keep the seed */ }
  useApp.setState({ hydrated: true });
}

/** Current data (subscribes the component to changes). */
export const useData = () => useApp((s) => s.data);
export const mutate = (fn: (d: AppData) => void) => useApp.getState().mutate(fn);
export const getData = () => useApp.getState().data;

/* ---------------- lookups (pure, take the data) ---------------- */
export const country = (code: string): Country => COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
export const contactById = (d: AppData, id?: string | null) => d.contacts.find((c) => c.id === id);
export function contactByPhone(d: AppData, phone?: string | null): Contact | undefined {
  const p = digits(phone);
  if (!p) return undefined;
  return d.contacts.find((c) => { const cd = digits(c.phone); return cd === p || cd.slice(-10) === p.slice(-10); });
}
/** Saved contact name for a number, else the fallback, else the formatted number. */
export const nameFor = (d: AppData, phone: string, fallback = '') => contactByPhone(d, phone)?.name || fallback || fmtPhone(phone) || 'Unknown';
export const friends = (d: AppData) => d.contacts.filter((c) => c.friend);
export const isBlocked = (d: AppData, phone: string) => {
  const p = digits(phone).slice(-10);
  return d.blocked.some((b) => digits(b.phone).slice(-10) === p);
};
export const isPro = (d: AppData) => d.tier === 'pro';
export function displayName(d: AppData): string {
  const n = `${d.user.first || ''} ${d.user.last || ''}`.trim();
  return n || d.user.username || APP_NAME + ' user';
}
export const unreadTotal = (d: AppData) => d.sms.reduce((n, t) => n + (t.unread || 0), 0) + d.chats.reduce((n, t) => n + (t.unread || 0), 0);
export const lastMsg = (t: { messages: Message[] }) => t.messages[t.messages.length - 1];
export const lastAt = (t: { messages: Message[]; created?: number }) => lastMsg(t)?.at ?? t.created ?? 0;
export const inviteText = () =>
  `Stay connected with ${APP_NAME}! Make high-quality calls and send texts anytime, anywhere. Download now and start communicating without limits! https://apps.apple.com/app/id6781677176`;

/* ---------------- cross-screen helpers ---------------- */
/** Find or create the 1:1 chat with an app friend; returns its id. */
export function ensureChatWith(contact: Contact): string {
  const existing = getData().chats.find((c) => c.friendId === contact.id);
  if (existing) return existing.id;
  const t: ChatThread = { id: 'd' + uid(), name: contact.name, friendId: contact.id, unread: 0, messages: [], created: Date.now() };
  mutate((d) => { d.chats.unshift(t); });
  return t.id;
}
/** Find or create the SMS thread with a number; returns its id. */
export function ensureSmsWith(phone: string, name = ''): string {
  const p = digits(phone).slice(-10);
  const existing = getData().sms.find((t) => digits(t.phone).slice(-10) === p);
  if (existing) return existing.id;
  const t: SmsThread = { id: 's' + digits(phone), phone: '+' + digits(phone), name, unread: 0, messages: [], created: Date.now(), full: true };
  mutate((d) => { d.sms.unshift(t); });
  return t.id;
}
