'use client';
/* khabo panels: accounts, team levels, sign-in safety, saves and the activity log.

   PROTOTYPE ONLY. Everything is saved in this browser through lib/demo-db.ts (localStorage "khabo.panel.v1"),
   so a change made here shows on the diner pages straight away. The sign-in below is a demo: it only decides
   what this browser shows. THE REAL LOCK IS SERVER-SIDE LATER: Supabase Auth plus row level security that ties
   each restaurant account to its own restaurant, and team levels checked on the server for every write
   (docs/4-tech/18-security-and-access.md). Every save here still goes through the same checks a server would make. */
import { useSyncExternalStore } from 'react';
import { readDB, writeDB, revKey, type DemoDB, type LogRow } from '@/lib/demo-db';
import type { Dish, Plan, Restaurant, Review, Text } from '@/lib/data/types';
import { LEVELS, LOCKED, PERMS, PLANS, REQ, type Level, type Perm, type ReqKind } from './words';

/* ---------- shapes ---------- */
export type Role = 'admin' | 'restaurant';
export type User = {
  u: string; name: string; role: Role; level?: Level; rid?: string; contact?: string;
  salt?: string; hash?: string; sv?: number; p?: string;
  inv?: { salt: string; hash: string; exp: number };
  active: boolean; created: number; last?: number; fails?: number; lockUntil?: number; by?: string; joined?: number;
};
export type Req = {
  id: string; rid: string; kind: ReqKind; data: { en?: string; bn?: string; text?: string }; note?: string; by: string; at: number;
  state: 'open' | 'done' | 'declined' | 'cancelled'; doneAt?: number; doneBy?: string; reply?: string; ownerSeen?: boolean;
};
export type Bill = { status: 'paid' | 'due' | 'overdue' | 'trial'; method: string };
export type Lead = { id: string; name: string; area: string; person: string; phone: string; stage: string; note: string; [k: string]: unknown };
export type Log = LogRow & { bn?: string };
export type RevState = { hidden?: boolean; reply?: Text | null; flagged?: boolean };
/** a dish with the extra words the panel can add ("About this dish") */
export type PDish = Dish & { made?: Text; ing?: Text[]; side?: Text };
export type QrOpts = { tables?: number; layout?: string; header?: string; theme?: string; card?: string; frame?: string; look?: string; cpal?: string; qrc?: string; ctext?: string; cbn?: boolean; tnum?: boolean; color?: string };
/** a restaurant as the panels edit it: the diner shape plus a few panel-only settings */
export type PR = Omit<Restaurant, 'qr' | 'menu'> & {
  menu: PDish[]; qr?: QrOpts; slug?: string; oldSlugs?: string[]; hidePpl?: boolean;
  printMenu?: Record<string, unknown>; promo?: Record<string, unknown>;
};
export type PanelDB = Omit<DemoDB, 'reviews' | 'log' | 'rest'> & {
  users: User[]; requests: Req[]; billing: Record<string, Bill>; leads: Lead[]; log: Log[];
  rest: Record<string, PR>; gone: Record<string, boolean>; reviews: Record<string, RevState>;
  hist: NonNullable<DemoDB['hist']>; dealOrder?: string[]; content?: Record<string, unknown>;
};

export { LEVELS, PERMS, PLANS, REQ, LOCKED };
export type { Level, Perm, ReqKind };

const SESSION = 'khabo.panel.session';
export const INVITE_DAYS = 3;
const MAX_TRIES = 5, LOCK_MIN = 10;
const IDLE = { admin: 30 * 60e3, restaurant: 12 * 3600e3 }, LONG = { admin: 12 * 3600e3, restaurant: 30 * 864e5 };
export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
const T = (en: string, bn: string): Text => ({ en, bn });

/* ---------- messages: the panel UI shows them as toasts in the page's language ---------- */
type Say = (msg: Text, kind?: 'ok' | 'bad') => void;
let say: Say = () => {};
export const setSay = (fn: Say) => { say = fn; };
const bad = (msg: Text) => { say(msg, 'bad'); return false as const; };

/* ---------- passwords: never kept as typed. Salted SHA-256 here; the real build uses Argon2 or bcrypt on the server ---------- */
export function sha256(s: string) {
  const K2: number[] = [], H: number[] = [], w: number[] = [], f = (n: number, x: number) => (n >>> x) | (n << (32 - x));
  const bytes = unescape(encodeURIComponent(s));
  let p = 2;
  for (let c = 0; c < 64; p++) {
    let q = 1; for (let d = 2; d * d <= p; d++) if (p % d === 0) { q = 0; break; }
    if (q) { if (c < 8) H[c] = (Math.pow(p, 0.5) * 4294967296) | 0; K2[c++] = (Math.pow(p, 1 / 3) * 4294967296) | 0; }
  }
  const m = bytes + '\x80', l = m.length, words: number[] = [];
  for (let i = 0; i < l; i++) words[i >> 2] |= (m.charCodeAt(i) & 255) << ((3 - (i % 4)) * 8);
  const n = (((bytes.length + 8) >> 6) + 1) << 4; words[n - 1] = bytes.length * 8; for (let i = 0; i < n; i++) words[i] = words[i] | 0;
  for (let j = 0; j < n; j += 16) {
    const o = H.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      if (i < 16) w[i] = words[j + i];
      else { const a = w[i - 15], b = w[i - 2]; w[i] = (w[i - 16] + (f(a, 7) ^ f(a, 18) ^ (a >>> 3)) + w[i - 7] + (f(b, 17) ^ f(b, 19) ^ (b >>> 10))) | 0; }
      const [A, B, C, , E, F, G, Hh] = H;
      const t1 = (Hh + (f(E, 6) ^ f(E, 11) ^ f(E, 25)) + ((E & F) ^ (~E & G)) + K2[i] + w[i]) | 0, t2 = ((f(A, 2) ^ f(A, 13) ^ f(A, 22)) + ((A & B) ^ (A & C) ^ (B & C))) | 0;
      H.unshift((t1 + t2) | 0); H[4] = (H[4] + t1) | 0; H.pop();
    }
    for (let i = 0; i < 8; i++) H[i] = (H[i] + o[i]) | 0;
  }
  return H.slice(0, 8).map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
const salt = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
const setPw = (u: User, p: string) => { u.salt = salt(); u.hash = sha256(u.salt + '|' + p); delete u.p; u.sv = (u.sv || 0) + 1; };
export const checkPw = (u: User | undefined, p: string) => !!u && (u.p != null ? u.p === p : !!u.hash && sha256(u.salt + '|' + p) === u.hash);
const code6 = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, '0');
const newInvite = (u: User) => { const c = code6(), s = salt(); u.inv = { salt: s, hash: sha256(s + '|' + c), exp: Date.now() + INVITE_DAYS * 864e5 }; return c; };
/** phone numbers and emails kept in one tidy form, so people can sign in with either */
export const contactOf = (v0: unknown) => {
  const v = String(v0 || '').trim().toLowerCase(), ph = v.replace(/[\s-]/g, '');
  if (/^(\+?88)?01[3-9]\d{8}$/.test(ph)) return '+880' + ph.slice(-10);
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v) ? v : '';
};

/* ---------- the demo accounts (archive/prototype/README.md) ---------- */
const DEFAULT_USERS: Omit<User, 'active' | 'created'>[] = [
  { u: 'admin', p: 'admin', name: 'Mosaddiqur Rahman', role: 'admin', level: 'master' },
  { u: 'manager', p: 'manager', name: 'Farzana Karim', role: 'admin', level: 'manager' },
  { u: 'support', p: 'support', name: 'Rafiq Islam', role: 'admin', level: 'support' },
  { u: 'sales', p: 'sales', name: 'Sabbir Hasan', role: 'admin', level: 'sales' },
  { u: 'finance', p: 'finance', name: 'Nusrat Jahan', role: 'admin', level: 'finance' },
  { u: 'client1', p: 'client1', name: 'Kamal Hossain', role: 'restaurant', rid: 'shahi-handi' },
  { u: 'client2', p: 'client2', name: 'Nadia Rahman', role: 'restaurant', rid: 'kathgolap' },
  { u: 'client3', p: 'client3', name: 'Tanvir Ahmed', role: 'restaurant', rid: 'cha-adda' },
];
const DEFAULT_LEADS: Lead[] = [
  { id: 'l1', name: 'Haji Biryani', area: 'old-dhaka', person: 'Mr. Selim', phone: '+8801711000001', stage: 'new', note: 'Walk-in visit planned for Thursday.' },
  { id: 'l2', name: 'Spice Garden', area: 'gulshan', person: 'Ms. Farah', phone: '+8801711000002', stage: 'contacted', note: 'Wants to see the 360 tour first.' },
  { id: 'l3', name: 'Chillox', area: 'dhanmondi', person: 'Mr. Arif', phone: '+8801711000003', stage: 'visited', note: 'Interested in Pro. Asked about QR cards.' },
  { id: 'l4', name: 'Bogura Doi Ghar', area: 'satmatha', person: 'Mr. Rahim', phone: '+8801711000004', stage: 'trial', note: 'Trial ends 30 Nov.' },
  { id: 'l5', name: 'Sultan’s Dine', area: 'banani', person: 'Mr. Jamil', phone: '+8801711000005', stage: 'new', note: '' },
  { id: 'l6', name: 'The Tea House', area: 'uttara', person: 'Ms. Nabila', phone: '+8801711000006', stage: 'won', note: 'Signed Starter. Shoot booked.' },
];

/** the saved data with every list filled in (first visit: the demo accounts and leads) */
function normalize(raw: DemoDB | null): PanelDB {
  const db = (raw || {}) as PanelDB;
  db.users = db.users || DEFAULT_USERS.map(x => ({ active: true, created: 0, ...x }));
  DEFAULT_USERS.filter(d => d.role === 'admin' && d.level !== 'master' && !db.users.some(x => x.u === d.u)).forEach(d => db.users.push({ active: true, created: 0, ...d }));
  db.users.forEach(x => { if (x.role === 'admin' && !x.level) x.level = 'master'; });
  db.requests = db.requests || [];
  db.rest = db.rest || {}; db.gone = db.gone || {}; db.reviews = db.reviews || {}; db.hist = db.hist || {}; db.billing = db.billing || {};
  db.leads = db.leads || DEFAULT_LEADS.map(x => ({ ...x }));
  db.log = db.log || [];
  return db;
}
/** read, change and save in one go (every write goes through here) */
export function mutate<R>(fn: (db: PanelDB) => R): R {
  const db = normalize(readDB());
  db.users.forEach(u => { if (u.p != null) setPw(u, u.p); }); /* demo passwords get hashed the first time anything is saved */
  const out = fn(db);
  db.log.length = Math.min(db.log.length, 300);
  writeDB(db as unknown as DemoDB);
  return out;
}
export const fresh = () => normalize(readDB());

/* ---------- the saved data as a React snapshot (kept fresh across tabs) ---------- */
let dbCache: PanelDB | null = null, dbDirty = true;
const subDB = (cb: () => void) => {
  const f = () => { dbDirty = true; cb(); };
  addEventListener('khabo-db', f); addEventListener('storage', f);
  return () => { removeEventListener('khabo-db', f); removeEventListener('storage', f); };
};
const snapDB = () => { if (dbDirty || !dbCache) { dbCache = normalize(readDB()); dbDirty = false; } return dbCache; };
let sesCache: string | null | undefined;
const readSesRaw = () => { try { return sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION); } catch { return null; } };
const subSes = (cb: () => void) => {
  const f = () => { sesCache = undefined; cb(); };
  addEventListener('khabo-session', f); addEventListener('storage', f);
  const t = setInterval(f, 30e3); /* idle sign-out is checked every half minute */
  return () => { removeEventListener('khabo-session', f); removeEventListener('storage', f); clearInterval(t); };
};
const snapSes = () => { if (sesCache === undefined) sesCache = readSesRaw(); return sesCache; };
type Ses = { u: string; sv: number; at: number; exp: number; keep: boolean };
const parseSes = (raw: string | null): Ses | null => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
/** the signed-in account, or null when the session ran out, was signed out elsewhere or the account was turned off */
export function meOf(db: PanelDB, raw: string | null): User | null {
  const s = parseSes(raw); if (!s) return null;
  const u = db.users.find(x => x.u === s.u), now = Date.now();
  if (!u || !u.active || s.sv !== (u.sv || 0) || now > s.exp || ((!s.keep || u.role === 'admin') && now - s.at > IDLE[u.role])) return null;
  return u;
}
export const getMe = () => meOf(fresh(), readSesRaw());
/** keep an active session alive (called on taps and key presses, at most once a minute) */
export function touch() {
  const s = parseSes(readSesRaw()); if (!s || Date.now() - s.at < 60e3) return;
  s.at = Date.now();
  try { (s.keep ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(s)); } catch { /* ignore */ }
}
const sesChanged = () => { sesCache = undefined; dispatchEvent(new Event('khabo-session')); };

/** everything the panel pages need: the saved data, the signed-in account and a version that changes on every save */
export function usePanelDB() {
  const db = useSyncExternalStore(subDB, snapDB, () => null);
  const ses = useSyncExternalStore(subSes, snapSes, () => null);
  return { db, me: db ? meOf(db, ses) : null, ready: !!db, hasSession: !!ses };
}

/* ---------- permissions ---------- */
export const can = (perm: Perm, user: User | null | undefined) => !!user && user.role === 'admin' && (LEVELS[user.level || 'master'] || { perms: [] }).perms.includes(perm);
export const canAny = (perms: Perm | Perm[] | undefined, user: User | null | undefined) => !perms || ([] as Perm[]).concat(perms).some(p => can(p, user));
export const levelName = (u: User): Text => u.role === 'admin' ? (LEVELS[u.level || 'master'] || LEVELS.support).name : T('Owner', 'মালিক');
/* inside one restaurant: content pages need rest.edit, Admin settings needs any of these */
const SETTINGS_PERMS: Perm[] = ['rest.admin', 'billing', 'rest.delete', 'users.rest'];
export const restViewOk = (view: string, me: User | null) =>
  !me ? false : me.role === 'restaurant' ? view !== 'settings' : view === '' ? can('rest.view', me) : view === 'settings' ? SETTINGS_PERMS.some(p => can(p, me)) : can('rest.edit', me);

/* ---------- activity ---------- */
export function logIn(db: PanelDB, rid: string | null | undefined, what: Text, who?: User | null) {
  const me = who === undefined ? meOf(db, readSesRaw()) : who;
  db.log.unshift({ at: Date.now(), who: me ? me.name : 'Someone', role: me ? me.role : '', rid: rid || undefined, what: what.en, bn: what.bn });
}
export const log = (rid: string | null | undefined, what: Text) => mutate(db => logIn(db, rid, what));

/* ---------- sign in and out ---------- */
export const findUser = (db: PanelDB, id: string) => { const v = String(id || '').trim().toLowerCase(), c = contactOf(v); return db.users.find(x => x.u.toLowerCase() === v || (!!c && x.contact === c)); };
type SignRes = { user: User; error?: undefined } | { error: Text; user?: undefined };
export function signIn(id: string, p: string, keep: boolean, restExists: (rid: string) => boolean): SignRes {
  return mutate<SignRes>(db => {
    const user = findUser(db, id), now = Date.now();
    const badMsg = T('That username and password do not match.', 'ইউজারনেম আর পাসওয়ার্ড মিলছে না।');
    if (user && (user.lockUntil || 0) > now) { const m = Math.ceil((user.lockUntil! - now) / 60e3); return { error: T(`Too many wrong tries. Try again in ${m} minutes, or ask the khabo team.`, `অনেকবার ভুল হয়েছে। ${m} মিনিট পরে আবার চেষ্টা করুন, বা খাবো টিমকে বলুন।`) }; }
    if (user && !user.hash && user.p == null && user.inv) return { error: T('This account is not set up yet. Tap “I have an invite code” below.', 'এই অ্যাকাউন্ট এখনো চালু হয়নি। নিচে “আমার কাছে আমন্ত্রণ কোড আছে” চাপুন।') };
    if (!user || !checkPw(user, p)) {
      if (user) {
        user.fails = (user.fails || 0) + 1;
        if (user.fails >= MAX_TRIES) {
          user.lockUntil = now + LOCK_MIN * 60e3; user.fails = 0;
          db.log.unshift({ at: now, who: 'Security', role: '', rid: user.rid, what: `Locked ${user.u} for ${LOCK_MIN} minutes after ${MAX_TRIES} wrong passwords`, bn: `${MAX_TRIES}বার ভুল পাসওয়ার্ডের পরে ${user.u} ${LOCK_MIN} মিনিটের জন্য বন্ধ` });
          return { error: T(`Too many wrong tries. This account is locked for ${LOCK_MIN} minutes. The khabo team can unlock it sooner.`, `অনেকবার ভুল হয়েছে। অ্যাকাউন্টটি ${LOCK_MIN} মিনিটের জন্য বন্ধ। খাবো টিম আগেই খুলে দিতে পারে।`) };
        }
        if (user.fails >= MAX_TRIES - 2) { const left = MAX_TRIES - user.fails; return { error: T(`${badMsg.en} ${left} tries left before the account is locked for a while.`, `${badMsg.bn} অ্যাকাউন্ট কিছুক্ষণের জন্য বন্ধ হওয়ার আগে আর ${left}বার চেষ্টা করা যাবে।`) }; }
      }
      return { error: badMsg };
    }
    if (!user.active) return { error: T('This account is turned off. Ask the khabo team to turn it back on.', 'এই অ্যাকাউন্ট বন্ধ করা আছে। আবার চালু করতে খাবো টিমকে বলুন।') };
    if (user.role === 'restaurant' && (!user.rid || db.gone[user.rid] || !restExists(user.rid))) return { error: T('The restaurant for this account no longer exists.', 'এই অ্যাকাউন্টের রেস্টুরেন্টটি আর নেই।') };
    user.fails = 0; delete user.lockUntil;
    const long = keep && user.role !== 'admin';
    const s: Ses = { u: user.u, sv: user.sv || 0, at: now, exp: now + (keep ? LONG : IDLE)[user.role], keep: long };
    try { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); (long ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(s)); } catch { /* ignore */ }
    user.last = now;
    return { user: clone(user) };
  });
}
export function signOut() {
  try { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); } catch { /* ignore */ }
  sesChanged();
}
export const announceSignIn = sesChanged;
/** a new password signs the person out everywhere else; their own session carries on */
export function setPassword(uname: string, p: string) {
  mutate(db => {
    const u = db.users.find(x => x.u === uname); if (!u) return;
    const s = parseSes(readSesRaw()), self = s?.u === uname;
    setPw(u, p);
    if (self && s) { s.sv = u.sv || 0; try { (s.keep ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(s)); } catch { /* ignore */ } }
    logIn(db, u.rid, T('Changed their password', 'নিজের পাসওয়ার্ড বদলেছেন'));
  });
  sesChanged();
}
/** first sign-in with an invite code: they choose their own password and are signed in */
export function acceptInvite(id: string, code: string, p: string, keep: boolean, restExists: (rid: string) => boolean): SignRes {
  const badMsg = T('That invite code is not right, or it has run out. Ask for a new one.', 'আমন্ত্রণ কোডটি ঠিক নয়, বা মেয়াদ শেষ। নতুন কোড চেয়ে নিন।');
  const r = mutate<SignRes | null>(db => {
    const u = findUser(db, id), now = Date.now();
    if (!u || !u.inv || u.hash) return { error: badMsg };
    if ((u.lockUntil || 0) > now) { const m = Math.ceil((u.lockUntil! - now) / 60e3); return { error: T(`Too many wrong tries. Try again in ${m} minutes.`, `অনেকবার ভুল হয়েছে। ${m} মিনিট পরে আবার চেষ্টা করুন।`) }; }
    if (now > u.inv.exp || sha256(u.inv.salt + '|' + String(code).replace(/\D/g, '')) !== u.inv.hash) {
      u.fails = (u.fails || 0) + 1; if (u.fails >= MAX_TRIES) { u.lockUntil = now + LOCK_MIN * 60e3; u.fails = 0; }
      return { error: badMsg };
    }
    if (String(p || '').length < 6) return { error: T('Choose a password of at least 6 characters.', 'অন্তত ৬ অক্ষরের পাসওয়ার্ড দিন।') };
    setPw(u, p); delete u.inv; u.fails = 0; u.joined = now;
    db.log.unshift({ at: now, who: u.name, role: u.role, rid: u.rid, what: 'Accepted the invite and set a password', bn: 'আমন্ত্রণ গ্রহণ করে পাসওয়ার্ড দিয়েছেন' });
    return null;
  });
  return r || signIn(id, p, keep, restExists);
}

/* ---------- restaurants ---------- */
let BASE: PR[] = [];
let REVIEWS: Review[] = [];
/** the restaurants and reviews the server sent (the catalog). Saved changes are laid on top */
export function setBase(list: Restaurant[], reviews: Review[]) { BASE = list as unknown as PR[]; REVIEWS = reviews; }
export const baseReviews = () => REVIEWS;
/** every restaurant as the panels see it: saved copies first, deleted ones left out, added ones at the end */
export function allR(db: PanelDB | null): PR[] {
  const saved = db?.rest || {}, gone = db?.gone || {};
  const out = BASE.filter(r => !gone[r.id]).map(r => saved[r.id] || r);
  Object.values(saved).forEach(r => { if (!gone[r.id] && !BASE.some(b => b.id === r.id)) out.push(r); });
  return out;
}
export const getR = (db: PanelDB | null, id: string | null | undefined) => (id ? allR(db).find(r => r.id === id) : undefined);

const LOCK_KEYS = Object.keys(LOCKED);
const lockOf = (r: PR) => {
  const o: Record<string, string> = {};
  LOCK_KEYS.forEach(k => { const v = (r as Record<string, unknown>)[k]; o[k] = JSON.stringify(v === undefined ? null : v); });
  return { o, week: (r.deals || []).filter(d => d.week).map(d => d.id) };
};
/** every save goes through here, like a server check: owners only their own restaurant, and never the locked fields */
export function saveR(r: PR, what?: Text): boolean {
  const db0 = fresh(), me = meOf(db0, readSesRaw());
  if (!me) { signOut(); return false; }
  if (me.role === 'restaurant' ? me.rid !== r.id : !can('rest.edit', me) && !can('rest.admin', me)) return bad(T('You cannot change this restaurant.', 'আপনি এই রেস্টুরেন্ট বদলাতে পারবেন না।'));
  if (!can('rest.admin', me)) {
    const prev = getR(db0, r.id) || r, was = lockOf(prev), now = lockOf(r);
    const keys = LOCK_KEYS.filter(k => was.o[k] !== now.o[k]);
    const addedWeek = now.week.filter(id => !was.week.includes(id));
    if (keys.length || addedWeek.length) {
      const names = keys.map(k => LOCKED[k]).concat(addedWeek.length ? [T('Deal of the week', 'সপ্তাহের অফার')] : []);
      const en = names.map(n => n.en).join(', '), bn = names.map(n => n.bn).join(', ');
      log(r.id, T(`Tried to change ${en} (blocked)`, `${bn} বদলানোর চেষ্টা (আটকানো হয়েছে)`));
      return bad(T(`Only the khabo team can change ${en}.`, `${bn} শুধু খাবো টিম বদলাতে পারে।`));
    }
  }
  /* price changes waiting in a draft go into the price history now, with the save */
  const rr = clone(r) as PR & { _ph?: { did: string; was: number; v: number; at: number; who: string }[]; _what?: unknown };
  const ph = rr._ph || []; delete rr._ph; delete rr._what;
  try {
    mutate(db => {
      db.rest[r.id] = rr;
      ph.forEach(x => { const k = r.id + '|' + x.did, h = db.hist[k] = db.hist[k] || []; if (!h.length) h.push({ at: x.at - 1, v: x.was, who: 'Before' }); h.push({ at: x.at, v: x.v, who: x.who }); });
      if (what) logIn(db, r.id, what, me);
    });
  } catch {
    return bad(T('This browser is out of space. Remove a few uploaded photos and try again.', 'এই ব্রাউজারে জায়গা নেই। কয়েকটি আপলোড করা ছবি সরিয়ে আবার চেষ্টা করুন।'));
  }
  return true;
}
/** a new price: the change goes into the price history when it is saved, and the menu counts as checked today */
export function priceChange(r: PR, d: PDish, v: number) {
  const me = getMe(), x = r as PR & { _ph?: { did: string; was: number; v: number; at: number; who: string }[] };
  /* kept with the draft and written to the price history by saveR, so nothing is saved before "Save changes" */
  x._ph = [...(x._ph || []), { did: d.id, was: d.price, v, at: Date.now(), who: me?.name || '' }];
  d.price = v; r.checkedAt = Date.now(); r.checked = 0;
}
export const histOf = (db: PanelDB | null, rid: string, did: string) => db?.hist[rid + '|' + did] || [];
export function addR(r: PR) {
  const me = getMe(); if (!can('rest.add', me)) return bad(T('Only some khabo team levels can add restaurants.', 'শুধু কিছু খাবো টিম লেভেল রেস্টুরেন্ট যোগ করতে পারে।'));
  mutate(db => { db.rest[r.id] = clone(r); delete db.gone[r.id]; logIn(db, r.id, T('Added the restaurant', 'রেস্টুরেন্টটি যোগ করেছেন')); });
  return true;
}
export function deleteR(id: string) {
  const db0 = fresh(), me = meOf(db0, readSesRaw());
  if (!can('rest.delete', me)) return bad(T('Your level cannot delete restaurants.', 'আপনার লেভেলে রেস্টুরেন্ট মোছা যায় না।'));
  const r = getR(db0, id); if (!r) return false;
  mutate(db => {
    delete db.rest[id]; db.gone[id] = true;
    db.users.forEach(u => { if (u.rid === id) u.active = false; });
    logIn(db, null, T(`Deleted ${r.name.en}`, `${r.name.bn} মুছে ফেলেছেন`));
  });
  return true;
}
export function setPlan(r: PR, plan: Plan) {
  if (!can('billing', getMe())) return bad(T('Only the khabo team can change plans.', 'প্ল্যান শুধু খাবো টিম বদলাতে পারে।'));
  mutate(db => { db.rest[r.id] = { ...clone(r), plan }; logIn(db, r.id, T(`Changed the plan to ${PLANS[plan].name.en}`, `প্ল্যান বদলে ${PLANS[plan].name.bn} করেছেন`)); });
  return true;
}

/* ---------- reviews ---------- */
export const revState = (db: PanelDB | null, v: Review): RevState => db?.reviews[revKey(v)] || {};
/** reviews with the team's hiding, owner replies and reports applied */
export function reviewsOf(db: PanelDB | null, rid?: string | null): (Review & { flagged?: boolean })[] {
  return REVIEWS.filter(v => !rid || v.r === rid).map(v => {
    const s = revState(db, v);
    return { ...v, hidden: 'hidden' in s ? !!s.hidden : v.hidden, reply: 'reply' in s ? s.reply || undefined : v.reply, flagged: s.flagged };
  });
}
export function setRev(v: Review, patch: RevState, what: Text) {
  const db0 = fresh(), me = meOf(db0, readSesRaw()); if (!me) return false;
  if ('hidden' in patch && !can('reviews.moderate', me)) return bad(T('Only the khabo team can change whether a review shows.', 'রিভিউ দেখাবে কি না, তা শুধু খাবো টিম ঠিক করে।'));
  if ('reply' in patch && (me.role === 'restaurant' ? me.rid !== v.r : !can('rest.edit', me))) return bad(T('You cannot reply for this restaurant.', 'আপনি এই রেস্টুরেন্টের হয়ে উত্তর দিতে পারবেন না।'));
  mutate(db => { const k = revKey(v); db.reviews[k] = { ...db.reviews[k], ...patch }; logIn(db, v.r, what, me); });
  return true;
}

/* ---------- users ---------- */
/* who may manage an account: owners their own team, team members with users.rest any restaurant account,
   only users.admin the khabo team. Nobody can remove or turn off themselves, or the last master. */
export const canManage = (target: Pick<User, 'role' | 'rid'>, me: User | null) =>
  !!me && (me.role === 'restaurant' ? target.role === 'restaurant' && target.rid === me.rid : target.role === 'admin' ? can('users.admin', me) : can('users.rest', me));
const masters = (db: PanelDB) => db.users.filter(x => x.role === 'admin' && (x.level || 'master') === 'master' && x.active);
export const isLastMaster = (db: PanelDB, u: User) => u.role === 'admin' && (u.level || 'master') === 'master' && masters(db).length <= 1;
/** returns the invite code to pass on (shown once), or false */
export function addUser(x: Omit<User, 'active' | 'created'>): string | false {
  const me = getMe();
  if (!canManage(x, me)) return bad(T('You cannot add these accounts.', 'আপনি এই অ্যাকাউন্ট যোগ করতে পারবেন না।'));
  return mutate(db => {
    const u: User = { active: true, created: Date.now(), by: me?.name, ...x }; delete u.p;
    const code = newInvite(u); db.users.push(u);
    const lv = x.role === 'admin' && x.level ? LEVELS[x.level].name : null;
    logIn(db, x.rid, T(`Invited ${lv ? lv.en + ' team member' : 'team member'} ${x.u}`, `${lv ? lv.bn + ' টিম সদস্য' : 'টিম সদস্য'} ${x.u}-কে আমন্ত্রণ জানিয়েছেন`));
    return code;
  });
}
/** forgot password: the old one is wiped and they get a new invite code (nobody sets a password for someone else) */
export function resetToInvite(uname: string): string | false {
  const me = getMe();
  return mutate(db => {
    const u = db.users.find(x => x.u === uname); if (!u || !canManage(u, me)) { bad(T('You cannot change this account.', 'আপনি এই অ্যাকাউন্ট বদলাতে পারবেন না।')); return false; }
    delete u.hash; delete u.salt; delete u.p; u.sv = (u.sv || 0) + 1; const c = newInvite(u);
    logIn(db, u.rid, T(`Reset ${u.u}: old password removed, new invite code made`, `${u.u} রিসেট: পুরোনো পাসওয়ার্ড মুছে নতুন আমন্ত্রণ কোড`));
    return c;
  });
}
export function reinvite(uname: string): string | false {
  const me = getMe();
  return mutate(db => {
    const u = db.users.find(x => x.u === uname); if (!u || !canManage(u, me) || u.hash || u.p != null) return false;
    const c = newInvite(u); logIn(db, u.rid, T(`Sent a new invite code to ${u.u}`, `${u.u}-কে নতুন আমন্ত্রণ কোড পাঠিয়েছেন`)); return c;
  });
}
export function removeUser(uname: string) {
  const me = getMe();
  return mutate(db => {
    const x = db.users.find(y => y.u === uname); if (!x) return false;
    if (!canManage(x, me)) return bad(T('You cannot change this account.', 'আপনি এই অ্যাকাউন্ট বদলাতে পারবেন না।'));
    if (x.u === me?.u || isLastMaster(db, x)) return bad(T('You cannot remove yourself or the last Master account.', 'নিজেকে বা শেষ মাস্টার অ্যাকাউন্ট সরানো যায় না।'));
    db.users.splice(db.users.indexOf(x), 1); logIn(db, x.rid, T(`Removed user ${uname}`, `${uname} ব্যবহারকারীকে সরিয়েছেন`)); return true;
  });
}
/** change one account (turn on or off, level, unlock). The same checks as above */
export function updateUser(uname: string, patch: Partial<User>, what: Text) {
  const me = getMe();
  return mutate(db => {
    const x = db.users.find(y => y.u === uname); if (!x) return false;
    if (!canManage(x, me)) return bad(T('You cannot change this account.', 'আপনি এই অ্যাকাউন্ট বদলাতে পারবেন না।'));
    if ((patch.active === false || (patch.level && patch.level !== 'master')) && (x.u === me?.u || isLastMaster(db, x))) return bad(T('You cannot turn off or lower yourself or the last Master account.', 'নিজেকে বা শেষ মাস্টার অ্যাকাউন্ট বন্ধ বা নিচে নামানো যায় না।'));
    Object.assign(x, patch); if (patch.lockUntil === 0) { delete x.lockUntil; x.fails = 0; }
    logIn(db, x.rid, what); return true;
  });
}

/* ---------- requests from owners for things only the khabo team can change ---------- */
export const requestsOf = (db: PanelDB | null, rid?: string | null) => (db?.requests || []).filter(q => !rid || q.rid === rid);
export const openRequests = (db: PanelDB | null) => (db?.requests || []).filter(q => q.state === 'open' && !!getR(db, q.rid));
export function request(rid: string, kind: ReqKind, data: Req['data'], note?: string) {
  const me = getMe(); if (!me || (me.role === 'restaurant' && me.rid !== rid)) return false;
  mutate(db => {
    db.requests.unshift({ id: 'q' + Date.now().toString(36), rid, kind, data, note, by: me.name, at: Date.now(), state: 'open' });
    logIn(db, rid, T(`Asked khabo to change the ${REQ[kind].en.toLowerCase()}`, `খাবোকে ${REQ[kind].bn} বদলাতে বলেছেন`), me);
  });
  return true;
}
export function cancelRequest(id: string) {
  const me = getMe();
  return mutate(db => {
    const q = db.requests.find(x => x.id === id);
    if (!me || !q || q.state !== 'open' || (me.role === 'restaurant' && me.rid !== q.rid)) return false;
    q.state = 'cancelled'; q.doneAt = Date.now(); q.ownerSeen = true;
    logIn(db, q.rid, T(`Cancelled a request (${REQ[q.kind].en.toLowerCase()})`, `একটি অনুরোধ বাতিল করেছেন (${REQ[q.kind].bn})`), me);
    return true;
  });
}
export function resolveRequest(id: string, ok: boolean, reply: string) {
  const db0 = fresh(), me = meOf(db0, readSesRaw());
  if (!can('rest.admin', me)) return bad(T('Only the khabo team can answer requests.', 'অনুরোধের উত্তর শুধু খাবো টিম দেয়।'));
  const q0 = db0.requests.find(x => x.id === id); if (!q0) return false;
  if (ok && q0.kind === 'name' && q0.data.en) {
    const r = getR(db0, q0.rid);
    if (r) { const nr = clone(r); nr.name = { en: q0.data.en, bn: q0.data.bn || q0.data.en }; nr.mono = monoOf(q0.data.en); saveR(nr, T(`Changed the name to ${q0.data.en} (owner request)`, `মালিকের অনুরোধে নাম বদলে ${nr.name.bn} করেছেন`)); }
  }
  return mutate(db => {
    const q = db.requests.find(x => x.id === id)!;
    q.state = ok ? 'done' : 'declined'; q.doneAt = Date.now(); q.doneBy = me!.name; q.reply = reply || ''; q.ownerSeen = false;
    logIn(db, q.rid, T(`${ok ? 'Approved' : 'Declined'} a request: ${REQ[q.kind].en.toLowerCase()}`, `একটি অনুরোধে ${ok ? 'হ্যাঁ' : 'না'} বলেছেন: ${REQ[q.kind].bn}`), me);
    return true;
  });
}
/** answers the owner has not looked at yet */
export const repliesOf = (db: PanelDB | null, rid: string) => (db?.requests || []).filter(q => q.rid === rid && (q.state === 'done' || q.state === 'declined') && !q.ownerSeen);
export function seeReplies(rid: string) {
  if (!repliesOf(fresh(), rid).length) return;
  mutate(db => db.requests.forEach(q => { if (q.rid === rid && !q.ownerSeen && q.state !== 'open') q.ownerSeen = true; }));
}

/* ---------- billing (sample until payments are real) ---------- */
export function billOf(db: PanelDB | null, r: Pick<Restaurant, 'id'>): Bill {
  const saved = db?.billing[r.id]; if (saved) return saved;
  const n = hash(r.id) % 10;
  return { status: n < 6 ? 'paid' : n < 8 ? 'due' : n < 9 ? 'overdue' : 'trial', method: n % 2 ? 'bKash' : 'Nagad' };
}
export function setBill(rid: string, b: Bill, what: Text) {
  if (!can('billing', getMe())) return bad(T('Only the khabo team can change billing.', 'বিল শুধু খাবো টিম বদলাতে পারে।'));
  mutate(db => { db.billing[rid] = b; logIn(db, rid, what); });
  return true;
}

/* ---------- small helpers ---------- */
/** deterministic sample numbers from a string, so the same restaurant always shows the same sample */
export const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const rng = (seed: string) => { let a = hash(seed); return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const initials = (s: string) => String(s).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
export const monoOf = (en: string) => (initials(en) + en.replace(/\s/g, '').slice(1, 2).toUpperCase()).slice(0, 2);
export const slugOf = (s: string) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
export const DOMAIN = 'khabo.com';
export const siteAddr = (r: Pick<PR, 'id' | 'slug'>) => `${DOMAIN}/${r.slug || r.id}`;
export { PERMS as PERM_NAMES };
/** reset everything this browser saved (Master only) */
export function resetAll() {
  if (!can('reset', getMe())) return bad(T('Only a Master admin can reset the demo.', 'ডেমো রিসেট শুধু মাস্টার অ্যাডমিন করতে পারেন।'));
  try { localStorage.removeItem('khabo.panel.v1'); } catch { /* ignore */ }
  dispatchEvent(new Event('khabo-db'));
  return true;
}
