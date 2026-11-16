/* Rules and words only the khabo team pages use: lead stages, follow-up dates, activity kinds.
   No React here. Ported from archive/prototype/panel/admin.js. */
import type { Text } from '@/lib/data/types';
import { hash, type Lead, type Log } from './store';

const tx = (en: string, bn: string): Text => ({ en, bn });

/* ---------- leads ---------- */
export type Stage = 'new' | 'contacted' | 'visited' | 'trial' | 'won';
export const STAGES: { k: Stage; l: Text; c: string }[] = [
  { k: 'new', l: tx('New', 'নতুন'), c: '#6C7293' },
  { k: 'contacted', l: tx('Contacted', 'যোগাযোগ হয়েছে'), c: '#2A3DB8' },
  { k: 'visited', l: tx('Visited', 'দেখা করা হয়েছে'), c: '#7A4FD0' },
  { k: 'trial', l: tx('On trial', 'ট্রায়ালে'), c: '#C27A00' },
  { k: 'won', l: tx('Signed', 'যুক্ত হয়েছে'), c: '#12804A' },
];
export const stageOf = (k: string) => STAGES.find(s => s.k === k) || STAGES[0];

export type LeadNote = { at: number; who: string; what: string; bn?: string };
export type LeadX = Lead & { at: number; upd: number; next: string; plan: string; hist: LeadNote[]; rid?: string };

/** a day as "2026-11-16", n days from today */
export const isoDay = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
export const todayIso = () => isoDay(0);

/* the demo leads get a believable start date, follow-up and plan, and their first note in Bangla too */
const LEAD_SEED: Record<string, { n?: number; d?: string; plan?: string; bn?: string }> = {
  l1: { n: 2, bn: 'বৃহস্পতিবার দেখা করতে যাওয়ার কথা।' },
  l2: { n: -1, plan: 'pro', bn: 'আগে ৩৬০ ট্যুর দেখতে চান।' },
  l3: { n: 0, plan: 'pro', bn: 'প্রো প্ল্যানে আগ্রহী। কিউআর কার্ডের কথা জিজ্ঞেস করেছেন।' },
  l4: { d: '2026-11-30', plan: 'starter', bn: 'ট্রায়াল শেষ হবে ৩০ নভেম্বর।' },
  l5: { n: 4 },
  l6: { plan: 'starter', bn: 'স্টার্টার প্ল্যান নিয়েছেন। শুটের দিন ঠিক হয়েছে।' },
};
/** fills in what older saved leads do not have yet. Changes the object it is given */
export function leadFix(x: Lead): LeadX {
  const y = x as LeadX;
  if (!y.at) {
    const h = hash(y.id), s = LEAD_SEED[y.id] || {};
    y.at = Date.now() - (4 + (h % 20)) * 864e5; y.upd = Date.now() - (h % 4) * 864e5 - 36e5;
    const o = y as Record<string, unknown>;
    if (!('next' in o)) y.next = s.d || (s.n != null ? isoDay(s.n) : '');
    if (!('plan' in o)) y.plan = s.plan || '';
  }
  if (!y.hist) y.hist = y.note ? [{ at: y.upd || y.at, who: 'khabo team', what: y.note, bn: LEAD_SEED[y.id]?.bn }] : [];
  y.next = y.next || ''; y.plan = y.plan || '';
  return y;
}
/** days from today to the follow-up date (negative = overdue) */
export const daysTo = (iso: string) => Math.round((new Date(iso + 'T00:00').getTime() - new Date(todayIso() + 'T00:00').getTime()) / 864e5);
export const telOf = (p: string) => String(p || '').replace(/[^\d+]/g, '');
export const okPhone = (p: string) => /^(\+?880|0)1\d{9}$/.test(String(p || '').replace(/[\s-]/g, ''));

/* ---------- activity ---------- */
export type Kind = { k: string; l: Text; rx: RegExp; i: string };
export const KINDS: Kind[] = [
  { k: 'request', l: tx('Requests', 'অনুরোধ'), rx: /request/i, i: 'paper-plane-right' },
  { k: 'deal', l: tx('Deals', 'অফার'), rx: /deal/i, i: 'tag' },
  { k: 'review', l: tx('Reviews', 'রিভিউ'), rx: /review|repl/i, i: 'star' },
  { k: 'account', l: tx('Accounts', 'অ্যাকাউন্ট'), rx: /invite|account|password|signed|user|code|team member|level|unlock|locked/i, i: 'users' },
  { k: 'sales', l: tx('Sales and billing', 'বিক্রি ও বিল'), rx: /lead|plan|invoice|paid|payment|billing|reminder/i, i: 'briefcase' },
  { k: 'site', l: tx('Site text', 'সাইটের লেখা'), rx: /site text/i, i: 'translate' },
  { k: 'media', l: tx('Photos and film', 'ছবি ও ভিডিও'), rx: /photo|film|tour|cover|video|360|room/i, i: 'images' },
  { k: 'menu', l: tx('Menu and prices', 'মেনু ও দাম'), rx: /dish|menu|price|item|sold out|categor/i, i: 'fork-knife' },
  { k: 'page', l: tx('Page and other', 'পেজ ও অন্যান্য'), rx: /[\s\S]/, i: 'storefront' },
];
export const kindOf = (x: Pick<Log, 'what'>) => KINDS.find(k => k.rx.test(x.what)) || KINDS[KINDS.length - 1];
/** a number in Bangla digits, for the Bangla half of saved words (whatever the page's language is) */
export const bnN = (n: number) => n.toLocaleString('bn-BD');
/** a log row in the page's language */
export const logWhat = (bn: boolean, x: Pick<Log, 'what' | 'bn'>) => (bn ? x.bn || x.what : x.what);
