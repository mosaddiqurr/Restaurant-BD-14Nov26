/* Words the partner and khabo team panels share, in English and Bangla.
   Page words live next to each page as t('English', 'বাংলা'); the lists here are used in many places. */
import type { Text } from '@/lib/data/types';

export const tx = (en: string, bn: string): Text => ({ en, bn });

/* ---------- the owner's pages (path under /partner, label, icon) ---------- */
/* s = a short label for the phone bottom bar, where long names would be cut off */
export type NavItem = { k: string; l: Text; i: string; s?: Text };
export const REST_NAV: NavItem[] = [
  { k: '', l: tx('Overview', 'সারসংক্ষেপ'), i: 'squares-four', s: tx('Home', 'হোম') },
  { k: 'menu', l: tx('Menu & prices', 'মেনু ও দাম'), i: 'list', s: tx('Menu', 'মেনু') },
  { k: 'profile', l: tx('Restaurant page', 'রেস্টুরেন্টের পেজ'), i: 'storefront' },
  { k: 'site', l: tx('Your website', 'আপনার ওয়েবসাইট'), i: 'globe-hemisphere-east' },
  { k: 'photos', l: tx('Photos', 'ছবি'), i: 'images' },
  { k: 'deals', l: tx('Deals', 'অফার'), i: 'tag' },
  { k: 'events', l: tx('Events', 'ইভেন্ট'), i: 'calendar-blank' },
  { k: 'reviews', l: tx('Reviews', 'রিভিউ'), i: 'chat-circle-dots' },
  { k: 'qr', l: tx('Table QR', 'টেবিল কিউআর'), i: 'qr-code' },
  { k: 'print', l: tx('Print menu', 'মেনু প্রিন্ট'), i: 'printer' },
  { k: 'insights', l: tx('Price insights', 'দামের তুলনা'), i: 'chart-line-up' },
  { k: 'team', l: tx('Team & account', 'টিম ও অ্যাকাউন্ট'), i: 'users' },
];
/* what the phone bottom bar shows for owners; everything else is under "More" */
export const REST_TABS = ['', 'menu', 'deals', 'reviews'];
export const SETTINGS_NAV: NavItem = { k: 'settings', l: tx('Admin settings', 'অ্যাডমিন সেটিংস'), i: 'sliders-horizontal' };

/* ---------- the khabo team's pages, with the permission each needs ---------- */
export type AdminItem = NavItem & { perm?: Perm | Perm[] };
export const ADMIN_NAV: AdminItem[] = [
  { k: '', l: tx('Overview', 'সারসংক্ষেপ'), i: 'squares-four' },
  { k: 'requests', l: tx('Requests', 'অনুরোধ'), i: 'paper-plane-right', perm: 'rest.admin' },
  { k: 'restaurants', l: tx('Restaurants', 'রেস্টুরেন্ট'), i: 'storefront', perm: 'rest.view' },
  { k: 'users', l: tx('Team & users', 'টিম ও ব্যবহারকারী'), i: 'users', perm: ['users.rest', 'users.admin'] },
  { k: 'reviews', l: tx('Reviews', 'রিভিউ'), i: 'chat-circle-dots', perm: 'reviews.moderate' },
  { k: 'dealorder', l: tx('Deal order', 'অফারের ক্রম'), i: 'arrows-down-up', perm: 'rest.admin' },
  { k: 'billing', l: tx('Plans & billing', 'প্ল্যান ও বিল'), i: 'credit-card', perm: 'billing' },
  { k: 'leads', l: tx('Leads', 'লিড'), i: 'briefcase', perm: 'leads' },
  { k: 'content', l: tx('Site text', 'সাইটের লেখা'), i: 'translate', perm: 'site' },
  { k: 'activity', l: tx('Activity', 'কার্যকলাপ'), i: 'clock', perm: 'activity' },
];
export const ADMIN_TABS = ['', 'restaurants', 'reviews', 'activity'];

/* ---------- who can do what (see docs/4-tech/18-security-and-access.md) ---------- */
export const PERMS = {
  'rest.view': tx('See all restaurants', 'সব রেস্টুরেন্ট দেখা'),
  'rest.edit': tx('Edit menus, pages, photos and deals', 'মেনু, পেজ, ছবি আর অফার বদলানো'),
  'rest.admin': tx('Name, web address, area, cuisine, 360 tour, film, visibility, Featured, Deal of the week', 'নাম, ওয়েব ঠিকানা, এলাকা, রান্নার ধরন, ৩৬০ ট্যুর, ভিডিও, দেখা যাবে কি না, ফিচার্ড, সপ্তাহের অফার'),
  'rest.add': tx('Add restaurants', 'রেস্টুরেন্ট যোগ করা'),
  'rest.delete': tx('Delete restaurants', 'রেস্টুরেন্ট মুছে ফেলা'),
  'reviews.moderate': tx('Hide or keep reported reviews', 'অভিযোগ আসা রিভিউ লুকানো বা রাখা'),
  'users.rest': tx('Restaurant sign-in accounts', 'রেস্টুরেন্টের সাইন-ইন অ্যাকাউন্ট'),
  'users.admin': tx('khabo team accounts and levels', 'খাবো টিমের অ্যাকাউন্ট আর লেভেল'),
  billing: tx('Plans, payments and invoices', 'প্ল্যান, পেমেন্ট আর ইনভয়েস'),
  leads: tx('Sales leads', 'বিক্রির লিড'),
  site: tx('Site text (home page and more)', 'সাইটের লেখা (হোম পেজ ও আরও)'),
  activity: tx('Activity log', 'কার্যকলাপের তালিকা'),
  reset: tx('Reset the demo data', 'ডেমো ডেটা আগের মতো করা'),
} as const;
export type Perm = keyof typeof PERMS;
export type Level = 'master' | 'manager' | 'support' | 'sales' | 'finance';
export const LEVELS: Record<Level, { name: Text; note: Text; perms: Perm[] }> = {
  master: { name: tx('Master', 'মাস্টার'), note: tx('Everything, including team accounts and money', 'সবকিছু, টিমের অ্যাকাউন্ট আর টাকাসহ'), perms: Object.keys(PERMS) as Perm[] },
  manager: { name: tx('Manager', 'ম্যানেজার'), note: tx('Runs restaurants, reviews, sales and site text. No money, no team accounts, no deleting', 'রেস্টুরেন্ট, রিভিউ, বিক্রি আর সাইটের লেখা দেখেন। টাকা, টিমের অ্যাকাউন্ট বা মুছে ফেলা নয়'), perms: ['rest.view', 'rest.edit', 'rest.admin', 'rest.add', 'reviews.moderate', 'users.rest', 'leads', 'site', 'activity'] },
  support: { name: tx('Support', 'সাপোর্ট'), note: tx('Helps restaurants with menus, photos and deals, and looks after reviews', 'মেনু, ছবি আর অফারে রেস্টুরেন্টকে সাহায্য করেন, রিভিউ দেখেন'), perms: ['rest.view', 'rest.edit', 'reviews.moderate', 'activity'] },
  sales: { name: tx('Sales', 'সেলস'), note: tx('Leads and adding new restaurants (they start hidden)', 'লিড আর নতুন রেস্টুরেন্ট যোগ করা (শুরুতে লুকানো থাকে)'), perms: ['rest.view', 'rest.add', 'leads'] },
  finance: { name: tx('Finance', 'ফাইন্যান্স'), note: tx('Plans, payments and invoices', 'প্ল্যান, পেমেন্ট আর ইনভয়েস'), perms: ['rest.view', 'billing', 'activity'] },
};
/* fields only the khabo team (rest.admin) may change. An owner's save that touches them is undone. */
export const LOCKED: Record<string, Text> = {
  name: tx('name', 'নাম'), slug: tx('web address', 'ওয়েব ঠিকানা'), area: tx('area', 'এলাকা'), city: tx('city', 'শহর'), cuisines: tx('cuisine', 'রান্নার ধরন'),
  tour: tx('360 tour', '৩৬০ ট্যুর'), film: tx('film', 'ভিডিও'), hidden: tx('visibility', 'দেখা যাবে কি না'), featured: tx('Featured', 'ফিচার্ড'),
  founding: tx('Founding Partner', 'ফাউন্ডিং পার্টনার'), plan: tx('plan', 'প্ল্যান'),
};

/* ---------- things owners ask the team to change ---------- */
export const REQ = {
  name: tx('Restaurant name', 'রেস্টুরেন্টের নাম'), area: tx('Area or map pin', 'এলাকা বা ম্যাপের পিন'), slug: tx('Web address', 'ওয়েব ঠিকানা'),
  cuisine: tx('Cuisine type', 'রান্নার ধরন'), tour: tx('360° tour', '৩৬০° ট্যুর'), film: tx('Restaurant film', 'রেস্টুরেন্টের ভিডিও'),
  plan: tx('Plan or billing', 'প্ল্যান বা বিল'), other: tx('Something else', 'অন্য কিছু'),
} as const;
export type ReqKind = keyof typeof REQ;
export const REQ_STATE = {
  open: [tx('Waiting for khabo', 'খাবোর উত্তরের অপেক্ষায়'), 'warn'], done: [tx('Done', 'হয়ে গেছে'), 'ok'],
  declined: [tx('Declined', 'না বলা হয়েছে'), 'bad'], cancelled: [tx('Cancelled', 'বাতিল'), ''],
} as const;

/* ---------- plans (restaurants are the only paying customers) ---------- */
export const PLANS = {
  starter: { name: tx('Starter', 'স্টার্টার'), price: 1999 },
  pro: { name: tx('Pro', 'প্রো'), price: 4999 },
  premium: { name: tx('Premium', 'প্রিমিয়াম'), price: 9999 },
} as const;
export const BILL_STATUS = {
  paid: [tx('Paid', 'পরিশোধিত'), 'ok'], due: [tx('Due', 'বাকি'), 'warn'], overdue: [tx('Overdue', 'মেয়াদ পার'), 'bad'], trial: [tx('Trial', 'ট্রায়াল'), 'ind'],
} as const;

export const PAYS = ['Cash', 'bKash', 'Nagad', 'Card', 'Rocket'];
export const PAY_N: Record<string, Text> = { Cash: tx('Cash', 'নগদ টাকা'), bKash: tx('bKash', 'বিকাশ'), Nagad: tx('Nagad', 'নগদ'), Card: tx('Card', 'কার্ড'), Rocket: tx('Rocket', 'রকেট') };

export const EVENT_TYPES = {
  music: [tx('Live music', 'লাইভ মিউজিক'), 'microphone'], match: [tx('Match screening', 'খেলা দেখা'), 'broadcast'],
  iftar: [tx('Iftar special', 'ইফতার স্পেশাল'), 'moon-stars'], festival: [tx('Festival menu', 'উৎসবের মেনু'), 'confetti'], other: [tx('Other', 'অন্যান্য'), 'calendar-blank'],
} as const;

export const GALLERY = [
  ['inside', tx('Inside', 'ভেতরে')], ['outside', tx('Outside', 'বাইরে')], ['kitchen', tx('Kitchen', 'রান্নাঘর')], ['food', tx('Food', 'খাবার')],
] as const;

export const SPICE_N = [tx('Not spicy', 'ঝাল নেই'), tx('Mild', 'অল্প ঝাল'), tx('Medium', 'মাঝারি ঝাল'), tx('Hot', 'বেশি ঝাল')];
