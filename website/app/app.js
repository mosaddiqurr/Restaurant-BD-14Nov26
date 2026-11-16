/* khabo final design preview (React + htm, no build step).
   Every restaurant, dish, deal, review and line of text comes from the prototype's own files:
   restaurants/<name>/restaurant.js, data/common.js and code/i18n.js. Nothing here is retyped,
   so a deal or dish added in the panels shows up here too. */
import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import clsx from 'clsx';
import { create } from 'zustand';
import { motion, AnimatePresence, MotionConfig, useInView } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { Drawer } from 'vaul';
import { Command } from 'cmdk';
import { OTPInput } from 'input-otp';
import NumberFlow from '@number-flow/react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Popover } from '@base-ui/react/popover';
import { Switch } from '@base-ui/react/switch';
import { Dialog } from '@base-ui/react/dialog';

const html = htm.bind(React.createElement);
const Fragment = React.Fragment;
const K = window.K, D = K.data;
const EASE = [0.23, 1, 0.32, 1];
const SHEET = [0.32, 0.72, 0, 1];
const SPR = { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 };
const EMPTY = {};
let FRAME = null;
/* the site folder, so the same app works as the main site (index.html) and as the preview (design-options/final.html) */
const ROOT = new URL('../', import.meta.url).href;
const MAIN = !!window.KHABO_MAIN, EMBED = new URLSearchParams(location.search).get('embed') === '1';

/* ================= text and numbers ================= */
const e = (en, bn) => ({ en, bn });
let LANG = 'en';
const L = o => o == null ? '' : typeof o === 'string' ? o : (o[LANG] != null ? o[LANG] : o.en);
const NF = { en: new Intl.NumberFormat('en-IN'), bn: new Intl.NumberFormat('bn-BD') };
const N = v => NF[LANG === 'bn' ? 'bn' : 'en'].format(v);
const tk = v => '৳' + N(Math.round(v));
const tkEn = v => '৳' + NF.en.format(Math.round(v));
const BD = '০১২৩৪৫৬৭৮৯';
const dg = s => LANG === 'bn' ? String(s).replace(/[0-9]/g, c => BD[c]) : String(s);
const fill = (s, v) => v ? s.replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m) : s;
const t = (k, v) => { const T = K.T; if (v && (v.n === 1 || v.n === '1' || v.n === '১') && T.en[k + '_one']) k += '_one'; return fill((T[LANG] && T[LANG][k]) || T.en[k] || k, v); };
/* a translated line with a React element (a price, say) dropped into one of its {slots} */
const tj = (k, v = {}) => { const flat = {}; Object.keys(v).forEach(a => { flat[a] = typeof v[a] === 'object' ? '\u0000' + a + '\u0000' : v[a]; }); return t(k, flat).split(/\u0000(\w+)\u0000/).map((p, i) => html`<${Fragment} key=${i}>${i % 2 ? v[p] : p}<//>`); };
/* the few words this design adds that the live site does not have yet, in both languages */
const X = {
  undo: e('Undo', 'ফিরিয়ে নিন'), copy: e('Copy code', 'কোড কপি করুন'), copied: e('Code copied', 'কোড কপি হয়েছে'), ends: e('Ends in', 'শেষ হবে'),
  sample_code: e('Coupon codes are samples until each restaurant adds its own.', 'রেস্টুরেন্ট নিজের কোড না দেওয়া পর্যন্ত কোডগুলো নমুনা।'),
  km: e('{v} km away', '{v} কিমি দূরে'), photos_v: e('Photos', 'ছবি'), price_list: e('Price list', 'দামের তালিকা'),
  see_all_rv: e('See all reviews', 'সব রিভিউ দেখুন'), all_rv: e('All reviews', 'সব রিভিউ'), showing: e('Showing {n} of {t} reviews', '{t}টির মধ্যে {n}টি রিভিউ'),
  newest: e('Newest', 'নতুন আগে'), high: e('Highest rating', 'বেশি রেটিং আগে'), low: e('Lowest rating', 'কম রেটিং আগে'),
  read_more: e('Read more', 'আরও পড়ুন'), less: e('Show less', 'কম দেখান'), rooms_n: e('{n} rooms in 360°', '৩৬০°-এ {n}টি ঘর'),
  reorder: e('Deal order', 'ডিলের ক্রম'), team: e('khabo team', 'খাবো টিম'),
  premium_first: e('Premium partners always come first, then Pro, then Starter. Drag to change the order inside each plan.', 'প্রিমিয়াম পার্টনার সবসময় আগে, তারপর প্রো, তারপর স্টার্টার। প্রতিটি প্ল্যানের ভেতরে ক্রম বদলাতে টেনে সরান।'),
  moved: e('New order is live on the Deals page.', 'নতুন ক্রম ডিলস পেজে দেখা যাচ্ছে।'),
  pause: e('Pause film', 'ফিল্ম থামান'), play: e('Play film', 'ফিল্ম চালান'), full_film: e('Watch with sound', 'শব্দসহ দেখুন'),
  you: e('You', 'আপনি'), again: e('Ask again', 'আবার দেখুন'), use_plan: e('Use this plan', 'এই প্ল্যান নিন'), plan_n: e('{n} people', '{n} জন'),
  each: e('{v} each', 'জনপ্রতি {v}'),
  owner_reply: e('Reply from the restaurant', 'রেস্টুরেন্টের উত্তর'), rv_dish: e('Review this dish', 'এই খাবারের রিভিউ দিন'), rv_dish_none: e('No one has reviewed this dish yet. Be the first.', 'এই খাবারের এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন।'), rv_dish_all: e('See all {n} reviews of this dish', 'এই খাবারের সব {n}টি রিভিউ দেখুন'), rv_about: e('Reviews of {d}', '{d}-এর রিভিউ'),
  prices: e('Prices', 'দাম'), pt_title: e('Price tracker', 'দামের খোঁজ'), pt_sub: e('How menu prices change over time, from real saved price changes. Menu prices only, before VAT and service.', 'সময়ের সাথে মেনুর দাম কীভাবে বদলায়, সংরক্ষিত আসল দাম বদলের হিসাবে। শুধু মেনুর দাম, ভ্যাট আর সার্ভিসের আগে।'),
  pt_tab1: e('Price tracker', 'দামের খোঁজ'), pt_tab2: e('Food Price Index', 'খাবারের দাম সূচক'), pt_search: e('Search a dish: kacchi, biryani, tehari, coffee', 'খাবার খুঁজুন: কাচ্চি, বিরিয়ানি, তেহারি, কফি'),
  pt_none: e('No restaurant on khabo has “{q}” yet.', 'খাবোর কোনো রেস্টুরেন্টে এখনো “{q}” নেই।'), pt_chart: e('{d}: prices over the last 6 months', '{d}: গত ৬ মাসের দাম'),
  pt_avg: e('Area average', 'এলাকার গড়'), pt_avg_need: e('The area average shows only when 3 or more restaurants have this dish.', '৩টি বা তার বেশি রেস্টুরেন্টে খাবারটি থাকলে তবেই এলাকার গড় দেখায়।'),
  pt_now: e('Now', 'এখন'), pt_3m: e('3 months ago', '৩ মাস আগে'), pt_change: e('Change', 'পরিবর্তন'), pt_upd: e('Updated {n}', 'হালনাগাদ {n}'), d_today: e('today', 'আজ'), d_ago: e('{n} days ago', '{n} দিন আগে'),
  pt_month: e('This month in {c}', '{c}-এ এই মাসে'), pt_rises: e('Biggest rises', 'সবচেয়ে বেশি বেড়েছে'), pt_drops: e('Biggest drops', 'সবচেয়ে বেশি কমেছে'), pt_nodrops: e('No price went down this month.', 'এই মাসে কোনো দাম কমেনি।'), pt_norises: e('No price went up this month.', 'এই মাসে কোনো দাম বাড়েনি।'),
  pt_empty: e('No restaurant here has this dish yet. Try another area.', 'এই এলাকায় এখনো এই খাবার নেই। অন্য এলাকা দেখুন।'), pt_rule: e('Every restaurant is listed the same way: by price, never by plan or Featured.', 'সব রেস্টুরেন্ট একইভাবে দেখানো হয়: দাম অনুযায়ী, প্ল্যান বা ফিচারড দিয়ে নয়।'),
  pi_title: e('The Kacchi Report', 'কাচ্চি রিপোর্ট'), pi_sub: e('The average menu price of everyday dishes in {c}, {m}. Only dishes that 3 or more restaurants serve.', '{c}-এ রোজকার খাবারের গড় মেনু দাম, {m}। শুধু যেসব খাবার ৩টি বা বেশি রেস্টুরেন্টে আছে।'),
  pi_avg: e('Average {d}', 'গড় {d}'), pi_vs: e('{v} since last month', 'গত মাস থেকে {v}'), pi_6m: e('6 months ago', '৬ মাস আগে'), pi_lm: e('Last month', 'গত মাস'), pi_places: e('{n} places', '{n}টি জায়গা'), pi_none: e('Not enough restaurants here yet for an index. It needs 3 or more for each dish.', 'সূচকের জন্য এখানে এখনো যথেষ্ট রেস্টুরেন্ট নেই। প্রতিটি খাবারের জন্য ৩টি বা বেশি লাগে।'),
  share_img: e('Share the image', 'ছবি শেয়ার করুন'), dl_img: e('Download', 'ডাউনলোড'), see_hist: e('See price history', 'দামের ইতিহাস দেখুন'), demo_hist: e('Prototype: six months of demo price history.', 'প্রোটোটাইপ: ছয় মাসের নমুনা দামের ইতিহাস।'),
  events: e('Events', 'ইভেন্ট'), ev_sub: e('Live music, match screenings, iftar specials and festival menus at partner restaurants. Each one hides by itself once it ends.', 'পার্টনার রেস্টুরেন্টে লাইভ মিউজিক, খেলা দেখা, ইফতার স্পেশাল আর উৎসবের মেনু। শেষ হলে নিজেই লুকিয়ে যায়।'),
  up_events: e('Upcoming events', 'আসন্ন ইভেন্ট'), all_events: e('All events', 'সব ইভেন্ট'), free_entry: e('Free entry', 'ফ্রি এন্ট্রি'), entry: e('Entry {v}', 'এন্ট্রি {v}'), on_now: e('On now', 'এখন চলছে'),
  any_date: e('Any date', 'যেকোনো দিন'), d_today_f: e('Today', 'আজ'), d_week: e('Next 7 days', 'আগামী ৭ দিন'), d_weekend: e('This weekend', 'এই সপ্তাহান্তে'), d_month: e('Next 30 days', 'আগামী ৩০ দিন'), no_events: e('No events match these filters.', 'এই ফিল্টারে কোনো ইভেন্ট নেই।'), all_types: e('All types', 'সব ধরন'), vat_in: e('with VAT and service', 'ভ্যাট আর সার্ভিসসহ'), compare: e('Compare every price', 'সব দাম মিলিয়ে দেখুন')
};
const tx = (k, v) => fill(L(X[k]) || k, v);
const MON = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], bn: ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'] };
const dm = d => `${dg(d.getDate())} ${MON[LANG === 'bn' ? 'bn' : 'en'][d.getMonth()]}`;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => { let a = hash(seed); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let z = Math.imul(a ^ a >>> 15, 1 | a); z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z; return ((z ^ z >>> 14) >>> 0) / 4294967296; }; };
const initials = s => String(s).split(/\s+/).filter(w => /\p{L}/u.test(w[0] || '')).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/* ================= the real data, prepared the way core.js prepares it ================= */
const byId = {};
D.restaurants.forEach(r => {
  byId[r.id] = r;
  r.menu.forEach(d => { d.r = r.id; if (!d.cat) d.cat = r.cats[0].id; });
  r.hasTour = !!(r.tour && r.tour.length); r.hasFilm = !!r.film; r.has3d = r.menu.some(d => d.d3); r.hasKitchen = !!r.kitchen;
  r.gallery = r.gallery || {};
});
const RR = id => byId[id];
const allDishes = () => D.restaurants.flatMap(r => r.menu);
const dishOf = (rid, did) => { const r = byId[rid]; return r && r.menu.find(d => d.id === did); };
const areaOf = id => D.areas.find(a => a.id === id) || D.areas[0];
const cuOf = d => (D.types[d.type] || {}).cu;
const cuName = id => L(D.cuisines.find(c => c.id === id) || {});
const typePic = id => { const ty = D.types[id]; if (ty && ty.p) return ty.p; const d = allDishes().find(z => z.type === id && z.p); return d ? d.p : null; };
const typeStats = id => { const all = allDishes().filter(d => d.type === id), solo = all.filter(d => !d.share), ds = solo.length ? solo : all, pr = ds.map(d => d.price); return { n: all.length, places: new Set(all.map(d => d.r)).size, lo: pr.length ? Math.min(...pr) : 0, hi: pr.length ? Math.max(...pr) : 0 }; };
const revOf = rid => D.reviews.filter(v => v.r === rid && !v.hidden);
const where = r => `${L(areaOf(r.area))}, ${L(D.cities[r.city])}`;
const checked = days => days <= 1 ? t('checked_today') : t('checked_days', { n: N(days) });
const photoCats = r => [['inside', t('inside')], ['outside', t('outside')], ['kitchen', t('kitchen')], ['food', t('food')]].filter(([c]) => r.gallery[c] && r.gallery[c].length);
const mapUrl = r => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address.en)}`;
const waUrl = r => `https://wa.me/${r.phone.replace(/[^\d]/g, '')}`;
const LL = { dhanmondi: [23.7461, 90.3742], gulshan: [23.7925, 90.4078], banani: [23.7937, 90.4066], mirpur: [23.8223, 90.3654], mohammadpur: [23.7662, 90.3589], uttara: [23.8759, 90.3795], 'old-dhaka': [23.7104, 90.4074], jaleshwaritola: [24.8465, 89.3776], satmatha: [24.8481, 89.3730] };
const distKm = (a, b) => { if (!a || !b) return null; const R = 6371, rad = x => x * Math.PI / 180, dLa = rad(b[0] - a[0]), dLo = rad(b[1] - a[1]); const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const dist = rating => { const five = Math.round(Math.max(30, Math.min(85, (rating - 3.6) * 70))); const four = Math.round((100 - five) * 0.6); const three = Math.round((100 - five - four) * 0.55); const two = Math.round((100 - five - four - three) * 0.5); return [five, four, three, two, Math.max(0, 100 - five - four - three - two)]; };
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const openState = (r, now = new Date()) => {
  const o = toMin(r.hours[0]); let c = toMin(r.hours[1]); const m = now.getHours() * 60 + now.getMinutes();
  if (c <= o) c += 1440;
  const mm = m < o && m + 1440 < c ? m + 1440 : m, open = mm >= o && mm < c;
  const fmt = s => { let [h, mi] = s.split(':').map(Number); const ap = h >= 12 && h < 24 ? 'PM' : 'AM'; h = h % 12 || 12; return dg(`${h}${mi ? ':' + String(mi).padStart(2, '0') : ''} ${LANG === 'bn' ? (ap === 'AM' ? 'এএম' : 'পিএম') : ap}`); };
  return { open, label: open ? t('open_till', { t: fmt(r.hours[1]) }) : t('opens_at', { t: fmt(r.hours[0]) }), close: fmt(r.hours[1]), from: fmt(r.hours[0]) };
};
const isLate = r => { const c = toMin(r.hours[1]); return c <= toMin('04:00') || c >= toMin('23:30'); };
const priceHist = d => { let s = 0; for (const c of d.id) s = (s * 31 + c.charCodeAt(0)) % 9973; const out = []; let p = d.price; for (let i = 0; i < 6; i++) { out.unshift(p); s = (s * 57 + 13) % 9973; const step = [0, 0, 0, -10, -10, -20, 10][s % 7]; p = Math.max(20, p + step); } return out; };
const src = (id, w = 800) => {
  if (!id) return '';
  if (/^(data:|https?:|blob:)/.test(id)) return id;
  if (id.startsWith('ph:')) return `https://cdn.polyhaven.com/asset_img/primary/${id.slice(3)}.png?height=${Math.min(1200, Math.max(256, Math.round(w)))}`;
  if (id.startsWith('pv:')) { const [, p, v] = id.split(':'); return `${K.panoDir(p)}${p}-${v}.jpg`; }
  const p = D.P[id]; return p ? `https://images.unsplash.com/photo-${p}?w=${Math.round(w)}&q=70&auto=format&fit=crop` : '';
};
const avatarTone = s => { const p = D.palettes[hash(s) % D.palettes.length]; return [p.deep, p.accent]; };

/* ================= plans and deals: Premium partners always come first ================= */
const PLAN = { premium: 3, pro: 2, starter: 1 };
const PLAN_N = { premium: e('Premium', 'প্রিমিয়াম'), pro: e('Pro', 'প্রো'), starter: e('Starter', 'স্টার্টার') };
const planOf = r => PLAN[r.plan] || 0;
const liveDeals = () => D.restaurants.flatMap(r => K.dealsOf(r).map((d, i) => ({ r, d, k: r.id + '/' + d.id, i })));
/* order: plan (Premium, Pro, Starter), then the order the khabo team set, then the deal of the week, then rating */
const rankDeals = (list, order = []) => list.slice().sort((a, b) => {
  const ia = order.indexOf(a.k), ib = order.indexOf(b.k);
  return planOf(b.r) - planOf(a.r) || (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || (b.d.week ? 1 : 0) - (a.d.week ? 1 : 0) || b.r.rating - a.r.rating || a.i - b.i;
});
const dealTag = d => d.week ? t('deal_week') : L(K.DEAL_TAGS[d.tag] || K.DEAL_TAGS.offer);
const dealRing = d => d.week ? 'DEAL OF THE WEEK' : (K.DEAL_TAGS[d.tag] || K.DEAL_TAGS.offer).ring;
/* a deal can carry its own code (d.code); until then the preview shows a sample made from the restaurant and the deal */
const codeOf = (r, d) => d.code || `${r.mono}-${d.id.split('-')[0].toUpperCase().slice(0, 7)}`;
const weekEnd = () => { const now = new Date(), add = (5 - now.getDay() + 7) % 7; return new Date(now.getFullYear(), now.getMonth(), now.getDate() + add, 23, 59, 59).getTime(); };
const dealEnd = d => d.week ? weekEnd() : d.to ? new Date(d.to + 'T23:59:59').getTime() : null;
const weekRange = () => { const now = new Date(), s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 1) % 7), f = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6); return `${dm(s)} ${t('to')} ${dm(f)}`; };
const dealDates = d => d.week ? weekRange() : d.from && d.to ? `${dm(new Date(d.from))} ${t('to')} ${dm(new Date(d.to))}` : d.to ? t('until_x', { v: dm(new Date(d.to)) }) : d.from ? t('from_x', { v: dm(new Date(d.from)) }) : '';

/* ================= filters (the same rules as the live listing pages) ================= */
const LIST = ['fac', 'media', 'tags'];
const F0 = () => ({ fac: [], media: [], tags: [], sort: 'rel' });
const DF0 = () => ({ sort: 'rel', group: 'cu', mode: 'grid', type: '', cu: '', q: '' });
const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
const hay = r => norm([r.name.en, r.name.bn, areaOf(r.area).en, areaOf(r.area).bn, ...r.cuisines.map(c => { const z = D.cuisines.find(y => y.id === c); return z ? z.en + ' ' + z.bn : ''; }), ...r.menu.map(d => d.name.en + ' ' + d.name.bn + ' ' + D.types[d.type].en + ' ' + D.types[d.type].bn)].join(' '));
function matchR(r, f, dishLevel) {
  if (f.area && r.area !== f.area) return false;
  if (f.city && r.city !== f.city) return false;
  if (!dishLevel) {
    if (f.cu && !r.cuisines.includes(f.cu) && !r.menu.some(d => cuOf(d) === f.cu)) return false;
    if (f.type && !r.menu.some(d => d.type === f.type)) return false;
    if (f.q) { const h = hay(r); if (!norm(f.q).split(/\s+/).every(w => h.includes(w))) return false; }
  }
  const b = D.budgets.find(z => z.id === f.bud); if (b && !(r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0))) return false;
  if (f.open && !openState(r).open) return false;
  if (f.late && !isLate(r)) return false;
  if (f.rating && r.rating < Number(f.rating)) return false;
  if ((f.fac || []).length && !f.fac.every(z => r.fac.includes(z))) return false;
  const md = f.media || [], tg = f.tags || [];
  if (md.includes('tour') && !r.hasTour) return false;
  if (md.includes('film') && !r.hasFilm) return false;
  if (md.includes('3d') && !r.has3d) return false;
  if (md.includes('kitchen') && !r.hasKitchen) return false;
  if (tg.includes('deals') && !r.deal) return false;
  if (tg.includes('featured') && !r.featured) return false;
  if (tg.includes('founding') && !r.founding) return false;
  const o = D.occasions.find(z => z.id === f.occ);
  if (o) {
    if (o.q.fac && !o.q.fac.every(z => r.fac.includes(z))) return false;
    if (o.q.maxPP && r.ppl[0] > o.q.maxPP) return false;
    if (o.q.late && !isLate(r)) return false;
    if (o.q.media && o.q.media.includes('tour') && !r.hasTour) return false;
  }
  return true;
}
function restaurants(f, near) {
  const nearCity = areaOf(near).city;
  const s = {
    /* best match: featured places first, then by plan, then rating */
    rel: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || planOf(b) - planOf(a) || b.rating - a.rating,
    price: (a, b) => a.ppl[0] - b.ppl[0], rating: (a, b) => b.rating - a.rating,
    near: (a, b) => (b.area === near) - (a.area === near) || (b.city === nearCity) - (a.city === nearCity) || b.rating - a.rating,
    fresh: (a, b) => a.checked - b.checked
  }[f.sort] || ((a, b) => b.rating - a.rating);
  return D.restaurants.filter(r => matchR(r, f)).sort(s);
}
const MAIN_DISHES = ['kacchi', 'biryani', 'tehari', 'polao', 'thali', 'fish', 'thai', 'chinese', 'platter', 'kebab', 'curry', 'fuchka', 'bakery'];
function dishes(f, near) {
  const ok = new Set(D.restaurants.filter(r => matchR(r, f, true)).map(r => r.id));
  let ds = allDishes().filter(d => ok.has(d.r));
  if (f.type) ds = ds.filter(d => d.type === f.type);
  if (f.cu) ds = ds.filter(d => cuOf(d) === f.cu);
  if (f.max) ds = ds.filter(d => d.price <= Number(f.max));
  if (f.veg) ds = ds.filter(d => d.veg);
  if (f.mild) ds = ds.filter(d => d.spice <= 1);
  if (f.q) { const q = norm(f.q); ds = ds.filter(d => { const r = RR(d.r), h = norm(d.name.en + ' ' + d.name.bn + ' ' + D.types[d.type].en + ' ' + D.types[d.type].bn + ' ' + r.name.en + ' ' + areaOf(r.area).en); return q.split(/\s+/).every(w => h.includes(w)); }); }
  const s = {
    price: (a, b) => a.price - b.price, rating: (a, b) => RR(b.r).rating - RR(a.r).rating, fresh: (a, b) => RR(a.r).checked - RR(b.r).checked,
    rel: (a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0) || (MAIN_DISHES.includes(b.type) ? 1 : 0) - (MAIN_DISHES.includes(a.type) ? 1 : 0) || planOf(RR(b.r)) - planOf(RR(a.r)) || RR(b.r).rating - RR(a.r).rating,
    near: (a, b) => (RR(b.r).area === near) - (RR(a.r).area === near) || a.price - b.price
  }[f.sort] || ((a, b) => a.price - b.price);
  return ds.sort(s);
}

/* ================= state ================= */
const qs = new URLSearchParams(location.search);
const kept = (k, d) => { try { return localStorage.getItem('khabo-final-' + k) || d; } catch (er) { return d; } };
const keep = (k, v) => { try { localStorage.setItem('khabo-final-' + k, v); } catch (er) { /* private window */ } };
const PAGES = ['home', 'list', 'dishes', 'deals', 'rest', 'biz', 'dash', 'menu', 'reviews', 'order', 'prices', 'events'];
/* web addresses on the main site; the old ones keep working (table menu and print menu open the classic pages) */
const ROUTES = { '': 'home', prices: 'prices', events: 'events', restaurants: 'list', dishes: 'dishes', deals: 'deals', business: 'biz', partner: 'dash', 'partner/menu': 'menu', 'partner/reviews': 'reviews', 'admin/deals': 'order' };
const pathOf = (page, rid) => page === 'rest' ? '/r/' + rid : '/' + (Object.keys(ROUTES).find(k => ROUTES[k] === page) || '');
function readHash() {
  const [path, q0] = (location.hash.replace(/^#/, '') || '/').split('?'), p = path.replace(/^\/|\/$/g, ''), q = new URLSearchParams(q0 || ''), o = {};
  const m = p.match(/^r\/([\w-]+)$/);
  if (m && byId[m[1]]) { o.page = 'rest'; o.rid = m[1]; if (q.get('dish')) o.openDish = q.get('dish'); return o; }
  if (p === 'ask' || p === 'explore') { o.page = 'home'; o.ask = p === 'ask'; return o; }
  o.page = ROUTES[p] || 'home';
  const lst = ['fac', 'media', 'tags'], f = {};
  q.forEach((v, k) => { f[k] = lst.includes(k) ? v.split(',').filter(Boolean) : v; });
  if (o.page === 'list' && q0) o.lf = f;
  if (o.page === 'dishes' && q0) o.df = f;
  if (o.page === 'prices' && f.type) o.pf = { type: f.type };
  return o;
}
const RVKEY = 'khabo.myReviews';
const savedRv = () => { try { return JSON.parse(localStorage.getItem(RVKEY) || '[]'); } catch (er) { return []; } };
const saveRv = list => { try { localStorage.setItem(RVKEY, JSON.stringify(list)); } catch (er) { /* private window */ } };
const savedOrder = () => { try { return JSON.parse(localStorage.getItem('khabo.dealOrder') || '[]'); } catch (er) { return []; } };
const init = {
  page: qs.get('page') || kept('page', 'home'), rid: qs.get('rid') || kept('rid', 'shahi-handi'), lang: qs.get('lang') || kept('lang', 'en'),
  theme: qs.get('theme') || kept('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'), view: qs.get('view') || kept('view', 'desktop')
};
const fromHash = MAIN ? readHash() : null;
if (fromHash) { init.page = fromHash.page; if (fromHash.rid) init.rid = fromHash.rid; init.view = 'desktop'; }
if (!PAGES.includes(init.page)) init.page = 'home';
if (!byId[init.rid]) init.rid = D.restaurants[0].id;
LANG = init.lang;
const scroller = () => document.querySelector('.scroller');
const toTop = () => { const sc = scroller(); if (sc) sc.scrollTo({ top: 0 }); };
const useApp = create((set, get) => ({
  ...init, area: 'dhanmondi', ver: 0, lf: { ...F0(), ...((fromHash && fromHash.lf) || {}) }, df: { ...DF0(), ...((fromHash && fromHash.df) || {}) },
  bill: {}, billOpen: null, people: 2, dish: null, palette: false, ai: null, signin: null, user: null, film: null, tour: null, lb: null,
  rvAll: null, rvDish: null, write: null, writeDish: null, docked: false, myRv: savedRv(), order: savedOrder(), jump: null,
  pf: { type: 'kacchi', area: '', city: '', tab: 'track', ...((fromHash && fromHash.pf) || {}) }, ef: { date: 'any', area: '', city: '', type: '' },
  set: o => set(o),
  go: (page, o = {}) => { const s0 = get(), same = s0.page === page && (!o.rid || o.rid === s0.rid); keep('page', page); if (o.rid) keep('rid', o.rid); set({ page, dish: null, ...o }); if (same) toTop(); },
  bump: () => set(s => ({ ver: s.ver + 1 })),
  add: (rid, did, k = 1) => set(s => { const b = { ...s.bill }, m = { ...(b[rid] || {}) }; m[did] = Math.max(0, (m[did] || 0) + k); if (!m[did]) delete m[did]; b[rid] = m; return { bill: b }; }),
  clearBill: rid => set(s => ({ bill: { ...s.bill, [rid]: {} } }))
}));
const S = () => useApp.getState();
/* owner changes are saved where the panel saves them (same browser key), so diners and the panel both see them */
const PKEY = 'khabo.panel.v1';
const readDB = () => { try { return JSON.parse(localStorage.getItem(PKEY) || 'null') || {}; } catch (er) { return {}; } };
const writeDB = db => { try { localStorage.setItem(PKEY, JSON.stringify(db)); } catch (er) { /* private window: changes last for this visit only */ } };
const persist = (r, what) => { const db = readDB(); db.rest = db.rest || {}; db.rest[r.id] = JSON.parse(JSON.stringify(r)); if (what) { db.log = db.log || []; db.log.unshift({ at: Date.now(), who: 'Restaurant owner', role: 'restaurant', rid: r.id, what }); } writeDB(db); };
const persistReply = v => { const db = readDB(), k = K.revKey(v); db.reviews = db.reviews || {}; db.reviews[k] = { ...(db.reviews[k] || {}), reply: v.reply }; db.log = db.log || []; db.log.unshift({ at: Date.now(), who: 'Restaurant owner', role: 'restaurant', rid: v.r, what: `Replied to ${v.who}` }); writeDB(db); };
const agoEn = t => { const m = (Date.now() - t) / 6e4; return m < 1 ? 'just now' : m < 60 ? Math.round(m) + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; };
const logsOf = rid => (readDB().log || []).filter(z => z.rid === rid).slice(0, 5).map(z => ({ who: z.who, what: z.what, at: agoEn(z.at) }));
/* every new page starts at the top, after the old page has faded out, so nothing jumps while it fades */
const Top = () => { useLayoutEffect(() => { const sc = scroller(); if (sc) sc.scrollTop = 0; }, []); return null; };
const addDish = (rid, did) => { const d = dishOf(rid, did); if (!d || d.out) return; S().add(rid, did, 1); toast(`${L(d.name)} ${t('added_bill')}`, { action: { label: tx('undo'), onClick: () => S().add(rid, did, -1) } }); };
const toList = f => { S().set({ lf: { ...F0(), ...f } }); S().go('list'); };
const toDishes = f => { S().set({ df: { ...DF0(), ...f } }); S().go('dishes'); };
const scrollToId = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

/* ================= opening transitions =================
   The photo you tapped flies into its place on the next screen: a restaurant card into the film at the top
   of the restaurant page, a dish card into the dish sheet. It is one image moving, so it stays smooth. */
function fly(fromEl, img, targetSel, o = {}) {
  if (!fromEl || !img || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const a = fromEl.getBoundingClientRect(); if (!a.width) return;
  const f = document.createElement('img'); f.className = 'flight'; f.src = img; f.alt = '';
  const r0 = o.from || '18px';
  Object.assign(f.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', borderRadius: r0 });
  document.body.appendChild(f);
  let tries = 0;
  const land = () => {
    const to = document.querySelector(targetSel);
    if (!to || !to.getBoundingClientRect().width) { if (tries++ < 40) return requestAnimationFrame(land); f.remove(); return; }
    const b = to.getBoundingClientRect();
    const an = f.animate([{ left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', borderRadius: r0 }, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', borderRadius: o.to || '26px' }], { duration: o.dur || 560, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' });
    an.onfinish = () => { f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).onfinish = () => f.remove(); };
  };
  requestAnimationFrame(() => requestAnimationFrame(land));
}
const openRest = (rid, fromEl, jump) => {
  const im = fromEl && fromEl.querySelector && fromEl.querySelector('img');
  if (im) fly(fromEl, im.currentSrc || im.src, '.cover', { to: S().view === 'phone' ? '0px' : '26px' });
  S().go('rest', { rid, jump: jump || null });
};
const openDish = (rid, did, fromEl, house, tab) => {
  const d = dishOf(rid, did); if (!d) return;
  S().set({ dish: { rid, did, house: !!house, tab: tab || 'photo', n: Date.now() } });
  const im = fromEl && fromEl.querySelector && fromEl.querySelector('img');
  if (im) fly(fromEl, src(d.p, 1100), '.ds-media', { to: S().view === 'phone' ? '26px 26px 0 0' : '26px 0 0 26px', dur: 520 });
};

/* ================= small parts ================= */
const I = ({ n, f, b, cls, s }) => html`<i className=${clsx(f ? 'ph-fill' : b ? 'ph-bold' : 'ph', 'ph-' + n, cls)} style=${s ? { fontSize: s } : null} aria-hidden="true"></i>`;
const Tk = ({ v, flow, cls, to }) => html`<span className=${clsx('price', cls)}><span className="cur">৳</span>${flow ? html`<${Num} v=${Math.round(v)} />` : N(Math.round(v))}${to != null ? '-' + N(to) : null}</span>`;
/* animated numbers; the animation cannot draw Bangla digits, so Bangla shows the plain number */
const Num = ({ v, en }) => LANG === 'bn' && !en ? dg(N(v)) : html`<${NumberFlow} value=${v} locales="en-IN" />`;
const Mono = ({ r, cls }) => html`<span className=${clsx('mono', cls)} style=${{ '--d': r.theme.deep, '--a': r.theme.accent }} aria-hidden="true">${r.mono}</span>`;
const Pic = ({ id, w = 600, alt = '', word, cls, eager, children, style, tone, icon }) => html`<div className=${clsx('pic', id && id.startsWith('ph:') && 'studio', cls)} style=${style}>
  ${id ? html`<img src=${src(id, w)} alt=${alt} loading=${eager ? 'eager' : 'lazy'} decoding="async" />` : tone ? html`<span className="word tone" style=${{ background: tone.deep, color: tone.accent }}><${I} n=${icon || 'fork-knife'} s=${26} /></span>` : html`<span className="word">${(word || '').trim().charAt(0)}</span>`}${children}</div>`;
const Rise = ({ children, d = 0, as = 'div', ...p }) => { const M = motion[as]; return html`<${M} initial=${{ opacity: 0, y: 16 }} whileInView=${{ opacity: 1, y: 0 }} viewport=${{ once: true, margin: '0px 0px -8% 0px' }} transition=${{ duration: 0.55, delay: d * 0.07, ease: EASE }} ...${p}>${children}<//>`; };
const Pill = ({ id }) => html`<${motion.span} layoutId=${id} className="pill" transition=${SPR} />`;
const Seg = ({ items, value, onChange, id, cls }) => html`<div className=${clsx('seg', cls)} role="tablist">${items.map(([v, l, extra]) => html`<button key=${v} role="tab" aria-selected=${v === value} className=${v === value ? 'on' : ''} onClick=${() => onChange(v)}>${v === value ? html`<${Pill} id=${'seg-' + id} />` : null}${l}${extra != null ? html`<em>${extra}</em>` : null}</button>`)}</div>`;
const Stars = ({ n }) => Array.from({ length: 5 }, (_, i) => html`<${I} key=${i} n="star" f=${i < n} />`);
const Spice = ({ n }) => html`<span className="spice" title=${t('spice_' + n)}>${Array.from({ length: n }, (_, i) => html`<${I} key=${i} n="pepper" f />`)}</span>`;
const Logo = () => html`<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#0C5A3E"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#F7F1DE" stroke-width="2.6"/><circle cx="19.2" cy="13" r="3.1" fill="#F4B91A"/></svg>`;
function RailX({ head, children, cls }) {
  const ref = useRef();
  const by = d => { const el = ref.current; if (el) el.scrollBy({ left: d * el.clientWidth * 0.9, behavior: 'smooth' }); };
  return html`<div>${head ? html`<div className="sec-head">${head}<div className="rx-btns"><button aria-label=${t('prev')} onClick=${() => by(-1)}><${I} n="caret-left" b /></button><button aria-label=${t('next')} onClick=${() => by(1)}><${I} n="caret-right" b /></button></div></div>` : null}<div className=${clsx('rail-x', cls)} ref=${ref}>${children}</div></div>`;
}
/* a choice list in a small popover (sort, area, price) */
function Choose({ label, icon, title, opts, value, onPick, on, cls, align = 'end', children }) {
  const [o, setO] = useState(false);
  return html`<${Popover.Root} open=${o} onOpenChange=${setO}>
    <${Popover.Trigger} className=${cls || clsx('tb-btn', on && 'on')}>${children || html`${icon ? html`<${I} n=${icon} />` : null}<span>${label}</span><${I} n="caret-down" />`}<//>
    <${Popover.Portal}><${Popover.Positioner} sideOffset=${8} align=${align} className="posr"><${Popover.Popup} className="pop">
      ${title ? html`<h4>${title}</h4>` : null}
      ${opts.map(([v, l, head]) => head ? html`<h4 key=${'h' + l}>${l}</h4>` : html`<button key=${v} className=${clsx('popt', v === value && 'on')} onClick=${() => { onPick(v); setO(false); }}><span className="ck">${v === value ? html`<${I} n="check" b />` : null}</span>${l}</button>`)}
    <//><//><//><//>`;
}
function AreaPop({ cls, children }) {
  const { area, set } = useApp();
  const opts = ['dhaka', 'bogura'].flatMap(c => [[c, L(D.cities[c]), true], ...D.areas.filter(a => a.city === c).map(a => [a.id, html`<span style=${{ flex: 1 }}>${L(a)}</span><em>${N(D.restaurants.filter(r => r.area === a.id).length)}</em>`])]);
  return html`<${Choose} cls=${cls} opts=${opts} value=${area} onPick=${v => set({ area: v })} align="start">${children || html`<${I} n="map-pin" f /><span>${L(areaOf(area))}</span><${I} n="caret-down" />`}<//>`;
}
/* QR codes drawn from the real link, in a restaurant's chosen look */
const qrCache = {};
const qrMatrix = text => { if (qrCache[text]) return qrCache[text]; if (!window.qrcode) return null; const q = window.qrcode(0, 'M'); q.addData(text); q.make(); const c = q.getModuleCount(), m = []; for (let y = 0; y < c; y++) { const row = []; for (let x = 0; x < c; x++) row.push(q.isDark(y, x)); m.push(row); } return (qrCache[text] = m); };
const tableUrl = id => ROOT + 'index.html#/t/' + id;
function QR({ text, look = 'rounded', color = '#141414' }) {
  const m = qrMatrix(text); if (!m) return html`<div className="qr" />`;
  const c = m.length, eye = (y, x) => (y < 7 && x < 7) || (y < 7 && x >= c - 7) || (y >= c - 7 && x < 7), parts = [];
  for (let y = 0; y < c; y++) for (let x = 0; x < c; x++) {
    if (!m[y][x] || eye(y, x)) continue;
    const k = y + '-' + x;
    if (look === 'dots') parts.push(html`<circle key=${k} cx=${x + 0.5} cy=${y + 0.5} r=${0.42} />`);
    else if (look === 'diamond') parts.push(html`<path key=${k} d=${`M${x + 0.5} ${y + 0.04}L${x + 0.96} ${y + 0.5}L${x + 0.5} ${y + 0.96}L${x + 0.04} ${y + 0.5}Z`} />`);
    else if (look === 'classic') parts.push(html`<rect key=${k} x=${x} y=${y} width="1.02" height="1.02" />`);
    else parts.push(html`<rect key=${k} x=${x + 0.06} y=${y + 0.06} width="0.88" height="0.88" rx=${look === 'leaf' ? 0.44 : 0.3} />`);
  }
  const eyeAt = (x, y, k) => {
    if (look === 'dots') return html`<g key=${k}><circle cx=${x + 3.5} cy=${y + 3.5} r="3" fill="none" stroke=${color} strokeWidth="1" /><circle cx=${x + 3.5} cy=${y + 3.5} r="1.5" /></g>`;
    if (look === 'leaf') return html`<g key=${k}><path d=${`M${x + 0.5} ${y + 3.5}A3 3 0 0 1 ${x + 3.5} ${y + 0.5}H${x + 6.5}V${y + 3.5}A3 3 0 0 1 ${x + 3.5} ${y + 6.5}H${x + 0.5}Z`} fill="none" stroke=${color} strokeWidth="1" /><path d=${`M${x + 2} ${y + 3.5}A1.5 1.5 0 0 1 ${x + 3.5} ${y + 2}H${x + 5}V${y + 3.5}A1.5 1.5 0 0 1 ${x + 3.5} ${y + 5}H${x + 2}Z`} /></g>`;
    const rx = look === 'classic' ? 0 : 1.6;
    return html`<g key=${k}><rect x=${x + 0.5} y=${y + 0.5} width="6" height="6" rx=${rx} fill="none" stroke=${color} strokeWidth="1" /><rect x=${x + 2} y=${y + 2} width="3" height="3" rx=${rx / 2} /></g>`;
  };
  return html`<div className="qr"><svg viewBox=${`-1 -1 ${c + 2} ${c + 2}`} fill=${color} role="img" aria-label="QR code">${parts}${eyeAt(0, 0, 'a')}${eyeAt(c - 7, 0, 'b')}${eyeAt(0, c - 7, 'c')}</svg></div>`;
}
const QRL = { rounded: e('Rounded', 'গোলাকার'), leaf: e('Leaf', 'পাতা'), dots: e('Dots', 'ডট'), diamond: e('Diamond', 'ডায়মন্ড'), classic: e('Classic', 'ক্লাসিক') };
/* 3D dishes: the same model files and viewer the live site uses */
let mvP = null, mdP = null;
const mvLib = () => mvP || (mvP = new Promise((res, rej) => { if (customElements.get('model-viewer')) return res(); const s = document.createElement('script'); s.type = 'module'; s.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js'; s.onload = () => customElements.whenDefined('model-viewer').then(res); s.onerror = rej; document.head.appendChild(s); }));
const models = () => mdP || (mdP = new Promise((res, rej) => { if (K.models) return res(K.models); const s = document.createElement('script'); s.src = ROOT + 'media/dish-3d-models.js'; s.onload = () => res(K.models); s.onerror = rej; document.head.appendChild(s); }));
const modelUrl = id => { const g = K.models[id]; if (!g._blob) g._blob = URL.createObjectURL(new Blob([JSON.stringify(g)], { type: 'model/gltf+json' })); return g._blob; };
function Model({ id, compact, alt = '' }) {
  const host = useRef(); const [st, setSt] = useState('load');
  useEffect(() => {
    let dead = false;
    Promise.all([mvLib(), models()]).then(() => {
      if (dead || !host.current || !K.models || !K.models[id]) { if (!dead) setSt('fail'); return; }
      const mv = document.createElement('model-viewer');
      mv.setAttribute('src', modelUrl(id)); mv.setAttribute('alt', alt);
      ['auto-rotate'].concat(compact ? [] : ['camera-controls']).forEach(a => mv.setAttribute(a, ''));
      mv.setAttribute('auto-rotate-delay', '0'); mv.setAttribute('rotation-per-second', compact ? '18deg' : '24deg'); mv.setAttribute('interaction-prompt', 'none');
      mv.setAttribute('shadow-intensity', '1.1'); mv.setAttribute('exposure', '1.05'); mv.setAttribute('environment-image', 'neutral'); mv.setAttribute('tone-mapping', 'commerce');
      mv.setAttribute('camera-orbit', '25deg 68deg auto'); mv.setAttribute('touch-action', 'pan-y');
      mv.addEventListener('load', () => setSt('ok')); mv.addEventListener('error', () => setSt('fail'));
      host.current.appendChild(mv);
    }).catch(() => !dead && setSt('fail'));
    return () => { dead = true; if (host.current) host.current.innerHTML = ''; };
  }, [id]);
  return html`<div className="mv"><div className="mv-host" ref=${host}></div>${st === 'load' ? html`<span className="mv-l">${t('loading_3d')}</span>` : st === 'fail' ? html`<span className="mv-l">${t('d3_fail')}</span>` : null}</div>`;
}
/* 360 rooms: the full room photo from the restaurant's own folder, dragged left and right */
const panoCache = {};
K.panoData = (id, size, url) => { const c = panoCache[id] = panoCache[id] || { res: [] }; c.url = url; c.res.forEach(f => f(url)); c.res = []; };
const loadPano = id => { const c = panoCache[id] = panoCache[id] || { res: [] }; if (c.url) return Promise.resolve(c.url); if (!c.p) c.p = new Promise(res => { c.res.push(res); const s = document.createElement('script'); s.src = `${K.panoDir(id)}${id}-4k.js`; s.onerror = () => res(null); document.head.appendChild(s); }); return c.p; };
function Pano({ pano, tall }) {
  const ref = useRef(); const [full, setFull] = useState(null); const [hint, setHint] = useState(true);
  useEffect(() => { let dead = false; loadPano(pano).then(u => { if (!dead && u) setFull(u); }); return () => { dead = true; }; }, [pano]);
  useEffect(() => {
    const el = ref.current; if (!el || !full) return;
    let x = 0, vx = 0, drag = false, lx = 0, lt = 0, raf = 0, idle = true;
    const paint = () => { el.style.backgroundPositionX = x.toFixed(1) + 'px'; };
    const tick = () => { if (!drag) { if (Math.abs(vx) > 0.01) { x += vx * 16; vx *= 0.94; } else if (idle) x -= 0.25; paint(); } raf = requestAnimationFrame(tick); };
    const down = ev => { drag = true; idle = false; lx = ev.clientX; lt = performance.now(); vx = 0; el.setPointerCapture(ev.pointerId); setHint(false); };
    const move = ev => { if (!drag) return; const now = performance.now(), dx = ev.clientX - lx; x += dx; vx = dx / Math.max(1, now - lt); lx = ev.clientX; lt = now; paint(); };
    const up = () => { drag = false; };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
  }, [full]);
  return html`<div ref=${ref} className=${clsx('pano', !full && 'still', tall && 'tall')} style=${{ backgroundImage: `url("${full || `${K.panoDir(pano)}${pano}-a.jpg`}")` }}><span className="hint" style=${{ opacity: hint ? 1 : 0 }}><${I} n="hand-grabbing" />${t('drag_look')}</span></div>`;
}
/* the one map on Home and on each restaurant page */
function MapBox({ list, single }) {
  const ref = useRef(), mp = useRef(), lay = useRef(); const view = useApp(s => s.view);
  useEffect(() => {
    const Lf = window.L; if (!Lf || !ref.current) return;
    const m = Lf.map(ref.current, { scrollWheelZoom: false });
    /* the same tiles as the live site (code/map.js); production needs a paid tile plan, see docs/4-tech/17-tech-stack.md */
    Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(m);
    mp.current = m; lay.current = Lf.layerGroup().addTo(m);
    return () => m.remove();
  }, []);
  useEffect(() => {
    const Lf = window.L, m = mp.current; if (!Lf || !m) return;
    lay.current.clearLayers(); const pts = [];
    list.forEach(r => {
      const ic = Lf.divIcon({ className: 'mk', html: `<div class="mk-w" style="--d:${r.theme.deep};--a:${r.theme.accent}"><span class="mk-b">${esc(r.mono)}</span>${single ? '' : `<span class="mk-n">${esc(L(r.name))}</span>`}</div>`, iconSize: [0, 0] });
      const mk = Lf.marker(r.geo, { icon: ic, keyboard: true, title: L(r.name) }).addTo(lay.current);
      if (!single) mk.on('click', () => openRest(r.id));
      pts.push(r.geo);
    });
    if (pts.length === 1) m.setView(pts[0], 15); else if (pts.length) m.fitBounds(pts, { padding: [70, 70], maxZoom: 14 });
  }, [list.map(r => r.id).join(), LANG]);
  useEffect(() => { const tm = setTimeout(() => mp.current && mp.current.invalidateSize(), 350); return () => clearTimeout(tm); }, [view]);
  return html`<div ref=${ref} style=${{ position: 'absolute', inset: 0 }} />`;
}

/* ================= restaurant card and dish card ================= */
function RCard({ r, plain }) {
  const os = openState(r), second = r.hero[1] || (r.gallery.inside || [])[1];
  const lift = { whileHover: { y: -4, transition: { duration: 0.3, ease: EASE } } };
  const motionP = plain ? lift : { ...lift, initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '0px 0px -6% 0px' }, transition: { duration: 0.5, ease: EASE } };
  return html`<${motion.article} className="rcard" role="link" tabIndex="0" aria-label=${L(r.name)} onClick=${ev => openRest(r.id, ev.currentTarget.querySelector('.pic'))} onKeyDown=${ev => ev.key === 'Enter' && openRest(r.id, ev.currentTarget.querySelector('.pic'))} whileTap=${{ scale: 0.985 }} ...${motionP}>
    <${Pic} id=${r.hero[0]} w=${760} alt=${L(r.name)}>${second ? html`<img className="alt" src=${src(second, 760)} alt="" loading="lazy" />` : null}<//>
    <div className="rc-top"><${Mono} r=${r} /><div style=${{ minWidth: 0 }}><b>${L(r.name)}${r.founding ? html`<${I} n="seal-check" f />` : null}</b><small>${L(areaOf(r.area))}, ${r.cuisines.slice(0, 2).map(cuName).join(', ')}</small></div><span className="rt"><${I} n="star" f cls="star" />${N(r.rating)}</span></div>
    <div className="rc-pr"><span><${Tk} v=${r.ppl[0]} to=${r.ppl[1]} /> ${t('pp_short')}</span><span className=${os.open ? 'open' : 'closed'}>${os.label}</span></div>
    ${r.featured || r.hasTour || r.hasFilm || r.has3d ? html`<div className="rc-f">${r.featured ? html`<span className="feat">${t('featured')}</span>` : null}${r.hasTour ? html`<span><${I} n="virtual-reality" />360°</span>` : null}${r.hasFilm ? html`<span><${I} n="play" />${t('film')}</span>` : null}${r.has3d ? html`<span><${I} n="cube" />3D</span>` : null}</div>` : null}
  <//>`;
}
function DCard({ d, lowest, house }) {
  const r = RR(d.r);
  return html`<${motion.button} className="dc" onClick=${ev => openDish(r.id, d.id, ev.currentTarget.querySelector('.pic'), house)} whileTap=${{ scale: 0.98 }}>
    <${Pic} id=${d.p} w=${480} alt=${L(d.name)} tone=${r.theme} icon=${(D.types[d.type] || {}).i}>${d.d3 ? html`<span className="mk3"><${I} n="cube" />3D</span>` : d.video ? html`<span className="mk3"><${I} n="play" f /></span>` : null}<//>
    <div className="dc-t"><b>${L(d.name)}</b><${Tk} v=${d.price} /></div>
    <small><${Mono} r=${r} />${L(r.name)}, ${L(areaOf(r.area))}</small>
    ${lowest ? html`<span className="low"><${I} n="arrow-down" b /> ${t('lowest')}</span>` : null}
  <//>`;
}
function AddBtn({ r, d, cls = 'addc' }) {
  const q = useApp(s => (s.bill[r.id] || EMPTY)[d.id] || 0);
  if (d.out) return html`<span className=${clsx(cls, 'out')}>${t('sold_out')}</span>`;
  return html`<${motion.button} className=${clsx(cls, q && 'has')} whileTap=${{ scale: 0.86 }} onClick=${ev => { ev.stopPropagation(); addDish(r.id, d.id); }} aria-label=${t('add_to_bill') + ': ' + L(d.name)}>${q ? html`<${Num} v=${q} />` : html`<${I} n="plus" b />`}<//>`;
}

/* ================= deals: coupons ================= */
function Countdown({ to }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
  let s = Math.max(0, Math.floor((to - now) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; const mm = Math.floor(s / 60), ss = s % 60;
  const p2 = v => dg(String(v).padStart(2, '0'));
  return html`<span className="count"><${I} n="timer" />${tx('ends')} <b>${dd ? dg(dd) + (LANG === 'bn' ? 'দি ' : 'd ') : ''}${p2(hh)}:${p2(mm)}:${p2(ss)}</b></span>`;
}
function Code({ code }) {
  const [ok, setOk] = useState(false);
  const copy = ev => { ev.stopPropagation(); try { navigator.clipboard.writeText(code).catch(() => { }); } catch (er) { /* no clipboard here */ } setOk(true); toast(`${tx('copied')}: ${code}`); setTimeout(() => setOk(false), 1600); };
  return html`<button className="code" onClick=${copy} aria-label=${tx('copy') + ' ' + code}>${code}<span><${AnimatePresence} mode="popLayout" initial=${false}><${motion.span} key=${ok ? 'y' : 'n'} style=${{ display: 'grid' }} initial=${{ scale: 0.4, opacity: 0, filter: 'blur(4px)' }} animate=${{ scale: 1, opacity: 1, filter: 'blur(0px)' }} exit=${{ scale: 0.4, opacity: 0, filter: 'blur(4px)' }} transition=${{ duration: 0.2 }}><${I} n=${ok ? 'check' : 'copy'} b /><//><//></span></button>`;
}
function Seal({ d }) {
  const id = useMemo(() => 'sl' + Math.random().toString(36).slice(2, 8), []), ring = dealRing(d), pct = d.was > d.price ? Math.round((d.was - d.price) / d.was * 100) : 0;
  return html`<span className="seal-w" aria-hidden="true"><svg className="seal" viewBox="0 0 100 100"><defs><path id=${id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs><circle cx="50" cy="50" r="49" fill="var(--cd)" /><circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" /><text fontSize="8.2" fontWeight="800" fill="currentColor" textLength="232" lengthAdjust="spacing"><textPath href=${'#' + id}>${ring} ✦ ${ring} ✦</textPath></text></svg><span className="seal-c">${pct ? '−' + N(pct) + '%' : '✦'}</span></span>`;
}
function Coupon({ x, big, place = true, onOpen }) {
  const { r, d } = x, save = d.was > d.price ? d.was - d.price : 0, end = dealEnd(d), dates = dealDates(d);
  const open = ev => { if (onOpen) return onOpen(ev); if (place) openRest(r.id, ev.currentTarget.querySelector('.pic'), 'deals'); };
  return html`<${motion.article} className=${clsx('coupon', big && 'big', !place && 'here')} style=${{ '--cd': r.theme.deep, '--ca': r.theme.accent }} whileHover=${place ? { y: -3 } : null} transition=${{ duration: 0.25, ease: EASE }} onClick=${open}>
    <${Pic} id=${d.p} w=${big ? 1200 : 760} tone=${r.theme} icon="tag" />
    <div className="cp-b">
      <h3>${L(d)}</h3>
      ${d.desc && L(d.desc) ? html`<p>${L(d.desc)}</p>` : null}
      ${d.when && L(d.when) ? html`<p className="cp-when"><${I} n="clock" />${L(d.when)}</p>` : null}
      ${place ? html`<span className="cp-by"><${Mono} r=${r} />${L(r.name)}, ${L(areaOf(r.area))}</span>` : null}
      <div className="cp-p"><${Tk} v=${d.price} />${save ? html`<s>${tk(d.was)}</s><span className="cp-save">${t('you_save', { v: tk(save) })}</span>` : null}</div>
      <div className="cp-f"><${Code} code=${codeOf(r, d)} /><span className="cp-tag"><${I} n="tag" />${dealTag(d)}${dates ? ' · ' + dates : ''}</span>${end ? html`<${Countdown} to=${end} />` : null}</div>
    </div>
    ${d.week && big ? html`<${Seal} d=${d} />` : null}
  <//>`;
}

/* ================= the preview shell ================= */
function Rail() {
  const { page, theme, view, lang, go, set } = useApp();
  const item = (p, icon, label) => html`<button key=${p} className=${page === p ? 'on' : ''} onClick=${() => go(p)}>${page === p ? html`<${Pill} id="rail-pill" />` : null}<${I} n=${icon} />${label}</button>`;
  return html`<aside className="rail">
    <div className="rail-h"><${Logo} /><div><b>khabo final</b><small>Green, Figtree, live data</small></div></div>
    <nav aria-label="Diner site"><h4>Diner site</h4>${item('home', 'house', 'Home')}${item('list', 'list-magnifying-glass', 'Restaurants')}${item('dishes', 'bowl-food', 'Dishes')}${item('deals', 'tag', 'Deals')}${item('prices', 'chart-line-up', 'Prices')}${item('events', 'calendar-star', 'Events')}${item('rest', 'storefront', 'Restaurant page')}${item('biz', 'handshake', 'For restaurants')}</nav>
    <nav aria-label="Partner panel"><h4>Partner panel</h4>${item('dash', 'squares-four', 'Overview')}${item('menu', 'list-dashes', 'Menu and prices')}${item('reviews', 'chat-circle-dots', 'Reviews')}</nav>
    <nav aria-label="khabo team"><h4>khabo team</h4>${item('order', 'arrows-down-up', 'Deal order')}</nav>
    <nav aria-label="Compare designs"><h4>Compare</h4>
      <a href="current.html"><${I} n="circle-half" />Current site</a><a href="redesign.html"><${I} n="number-circle-one" />Redesign A</a><a href="redesign-b.html"><${I} n="number-circle-two" />Redesign B</a><a href="redesign-c.html"><${I} n="number-circle-three" />Redesign C</a><a className="on" href="final.html"><${I} n="star-four" />Final</a>
    </nav>
    <div className="rail-ctl">
      <label>Look</label><${Seg} id="r-theme" cls="dark" items=${[['light', html`<${I} n="sun" />Light`], ['dark', html`<${I} n="moon" />Dark`]]} value=${theme} onChange=${v => set({ theme: v })} />
      <label>Screen</label><${Seg} id="r-view" cls="dark" items=${[['desktop', html`<${I} n="desktop" />Laptop`], ['phone', html`<${I} n="device-mobile" />Phone`]]} value=${view} onChange=${v => set({ view: v })} />
      <label>Language</label><${Seg} id="r-lang" cls="dark" items=${[['en', 'English'], ['bn', html`<span className="bn">বাংলা</span>`]]} value=${lang} onChange=${v => set({ lang: v })} />
      <p className="rail-note">Every restaurant, dish, deal and review here is read from the prototype's own files, so content matches the live site. Press Ctrl K to search.</p>
    </div>
  </aside>`;
}
function App() {
  const { page, theme, view, lang, rid } = useApp();
  LANG = lang;
  useEffect(() => { document.documentElement.dataset.theme = theme; keep('theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; keep('lang', lang); }, [lang]);
  useEffect(() => { keep('view', view); }, [view]);
  useEffect(() => {
    const h = ev => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); S().set({ palette: true }); }
      else if (ev.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) { ev.preventDefault(); S().set({ palette: true }); }
    };
    addEventListener('keydown', h); return () => removeEventListener('keydown', h);
  }, []);
  useEffect(() => {
    if (!MAIN) return;
    const titles = { home: 'khabo · Eat out without the guesswork', list: t('nav_restaurants'), dishes: t('nav_dishes'), deals: t('nav_deals'), biz: t('nav_business'), dash: 'Partner · Overview', menu: 'Partner · Menu & prices', reviews: 'Partner · Reviews', order: 'khabo team · Deal order', prices: tx('pt_title'), events: tx('events') };
    document.title = page === 'rest' ? `${L(RR(rid).name)} · khabo` : (page === 'home' ? '' : 'khabo · ') + (titles[page] || 'khabo');
    const want = '#' + pathOf(page, rid);
    if (location.hash.split('?')[0] !== want && !(page === 'home' && !location.hash)) history.pushState(null, '', want + (EMBED ? '' : ''));
  }, [page, rid, lang]);
  useEffect(() => {
    if (!MAIN) return;
    if (fromHash && fromHash.openDish) setTimeout(() => openDish(fromHash.rid, fromHash.openDish, null, true), 600);
    if (fromHash && fromHash.ask) setTimeout(() => S().set({ ai: { q: '' } }), 600);
    const back = () => { const o = readHash(); S().set({ page: o.page, ...(o.rid ? { rid: o.rid } : {}), ...(o.lf ? { lf: { ...F0(), ...o.lf } } : {}), ...(o.df ? { df: { ...DF0(), ...o.df } } : {}), dish: null }); };
    addEventListener('popstate', back); return () => removeEventListener('popstate', back);
  }, []);
  const panel = ['dash', 'menu', 'reviews'].includes(page);
  return html`<${MotionConfig} reducedMotion="user"><div className=${clsx('app', MAIN && 'site', EMBED && 'embed')} data-view=${MAIN ? 'desktop' : view}>
    ${MAIN ? null : html`<${Rail} />`}
    <main className="stage"><div className="frame" ref=${el => { if (el) FRAME = el; }}>
      <${motion.div} className="scroller" layoutScroll>
        <div className="screen">${panel ? html`<${Partner} />` : html`<${Diner} key=${'d'} page=${page} rid=${rid} />`}</div>
      <//>
      <${Overlays} />
      <${Toaster} position="top-center" theme=${theme} toastOptions=${{ style: { fontFamily: 'var(--sans)', borderRadius: '14px' } }} />
    </div></main>
  </div><//>`;
}
function Overlays() {
  return html`<${DishSheet} /><${BillDrawer} /><${Palette} /><${AiSheet} /><${SignIn} /><${FilmDlg} /><${TourDlg} /><${Lightbox} /><${AllReviews} /><${WriteReview} />`;
}

/* ================= diner chrome: header, footer, phone tab bar ================= */
function useScrolled(limit) {
  const [on, setOn] = useState(false);
  useEffect(() => { const sc = scroller(); if (!sc) return; const f = () => setOn(sc.scrollTop > limit); sc.addEventListener('scroll', f, { passive: true }); f(); return () => sc.removeEventListener('scroll', f); }, [limit]);
  return on;
}
function Mega() {
  const { page, go } = useApp(); const [o, setO] = useState(false); const tm = useRef();
  const enter = () => { clearTimeout(tm.current); setO(true); }, leave = () => { tm.current = setTimeout(() => setO(false), 160); };
  const pick = f => { setO(false); toList(f); };
  const cnt = fn => D.restaurants.filter(fn).length;
  const city = c => html`<div><h4>${L(D.cities[c])}</h4>${D.areas.filter(a => a.city === c).map(a => html`<button key=${a.id} onClick=${() => pick({ area: a.id })}>${L(a)}<em>${N(cnt(r => r.area === a.id))}</em></button>`)}</div>`;
  const wk = rankDeals(liveDeals(), S().order).find(z => z.d.week);
  return html`<div className="mm" onMouseEnter=${enter} onMouseLeave=${leave}>
    <a href="#" className=${page === 'list' ? 'on' : ''} aria-expanded=${o} onClick=${ev => { ev.preventDefault(); setO(false); toList({}); }} onFocus=${enter}>${page === 'list' ? html`<${Pill} id="hnav" />` : null}${t('nav_restaurants')}<${I} n="caret-down" /></a>
    <${AnimatePresence}>${o ? html`<${motion.div} key="mm" className="mm-pop" initial=${{ opacity: 0, y: -6, scale: 0.98 }} animate=${{ opacity: 1, y: 0, scale: 1 }} exit=${{ opacity: 0, y: -4, scale: 0.98 }} transition=${{ duration: 0.18, ease: EASE }}><div className="dd">
      ${city('dhaka')}
      <div>${city('bogura')}<h4 style=${{ marginTop: 10 }}>${t('budget_pp')}</h4>${D.budgets.map(b => html`<button key=${b.id} onClick=${() => pick({ bud: b.id })}>${L(b)}</button>`)}</div>
      <div><h4>${t('occasions')}</h4>${D.occasions.filter(z => z.id !== 'tour').map(z => html`<button key=${z.id} onClick=${() => pick({ occ: z.id })}><${I} n=${z.i} />${L(z)}</button>`)}</div>
      <div><h4>${t('facilities')}</h4>${['cabin', 'rooftop', 'parking', 'prayer', 'kids', 'events'].map(f => html`<button key=${f} onClick=${() => pick({ fac: [f] })}><${I} n=${D.facilities[f].i} />${L(D.facilities[f])}</button>`)}</div>
      ${wk ? html`<button className="mg-card" onClick=${ev => { setO(false); openRest(wk.r.id, ev.currentTarget, 'deals'); }}><${Pic} id=${wk.d.p} w=${520} /><span><small>${t('deal_week')}</small><b>${L(wk.d)}</b><span>${L(wk.r.name)}, <${Tk} v=${wk.d.price} /></span></span></button>` : null}
    </div><//>` : null}<//>
  </div>`;
}
function Hdr() {
  const { page, go, set, theme, lang, user } = useApp();
  const past = useScrolled(420), over = page === 'home' && !past;
  const tab = (p, label) => html`<a href="#" className=${page === p ? 'on' : ''} onClick=${ev => { ev.preventDefault(); go(p); }}>${page === p ? html`<${Pill} id="hnav" />` : null}${label}</a>`;
  return html`<header className=${clsx('hdr', over && 'over')}><div className="wrap">
    <a href="#" className="logo" onClick=${ev => { ev.preventDefault(); go('home'); }}><${Logo} />khabo</a>
    <nav className="hnav" aria-label="Main"><${Mega} />${tab('dishes', t('nav_dishes'))}${tab('deals', t('nav_deals'))}${tab('prices', tx('prices'))}${tab('events', tx('events'))}${tab('biz', t('nav_business'))}</nav>
    <div className="hr">
      <button className="hsearch" onClick=${() => set({ palette: true })} aria-label=${t('search')}><${I} n="magnifying-glass" b /><span>${t('search_short')}</span><span className="kbd">Ctrl K</span></button>
      <button className="circ" onClick=${() => set({ lang: lang === 'bn' ? 'en' : 'bn' })} aria-label=${t('switch_lang')}>${lang === 'bn' ? 'EN' : html`<span className="bn">বাং</span>`}</button>
      <button className="circ" onClick=${() => set({ theme: theme === 'dark' ? 'light' : 'dark' })} aria-label=${t('switch_theme')}><${I} n=${theme === 'dark' ? 'sun' : 'moon'} /></button>
      <button className="signin" onClick=${() => user ? toast(t('signed_in_as', { n: user })) : set({ signin: {} })}><${I} n="user-circle" /><span>${user ? tx('you') : t('sign_in')}</span></button>
    </div></div></header>`;
}
function TabBar() {
  const { page, go, set } = useApp();
  const b = (p, icon, label) => html`<button className=${page === p ? 'on' : ''} onClick=${() => go(p)}><${I} n=${icon} f=${page === p} />${label}</button>`;
  return html`<nav className="tabbar">${b('home', 'house', t('tab_home'))}${b('list', 'storefront', t('nav_restaurants'))}<button onClick=${() => set({ ai: { q: '' } })}><span className="orb"><${I} n="sparkle" f /></span>${t('tab_ask')}</button>${b('dishes', 'bowl-food', t('tab_dishes'))}${b('deals', 'tag', t('nav_deals'))}</nav>`;
}
function Foot() {
  const { lang, set, go } = useApp();
  const a = (label, fn) => html`<a href="#" key=${label} onClick=${ev => { ev.preventDefault(); fn(); }}>${label}</a>`;
  const areas = c => D.areas.filter(z => z.city === c).map(z => a(L(z), () => toList({ area: z.id })));
  return html`<footer className="foot"><div className="wrap">
    <div className="cols">
      <div><span className="logo"><${Logo} />khabo</span><p style=${{ marginTop: 10, maxWidth: '34ch' }}>${t('footer_line')}</p><div style=${{ marginTop: 16 }}><${Seg} id="f-lang" cls="dark" items=${[['en', 'English'], ['bn', 'বাংলা']]} value=${lang} onChange=${v => set({ lang: v })} /></div></div>
      <div><b>${L(D.cities.dhaka)}</b>${areas('dhaka')}</div>
      <div><b>${L(D.cities.bogura)}</b>${areas('bogura')}${a(t('nav_dishes'), () => go('dishes'))}${a(t('nav_deals'), () => go('deals'))}</div>
      <div><b>khabo</b>${a(t('nav_restaurants'), () => toList({}))}${a(tx('prices'), () => toPrices({}))}${a(tx('events'), () => go('events'))}${a(t('ask_ai'), () => set({ ai: { q: '' } }))}${a(t('your_account'), () => set({ signin: {} }))}${a(t('help'), () => go('biz'))}</div>
      <div><b>${t('nav_business')}</b>${a(t('get_listed'), () => go('biz'))}${a(t('plans'), () => go('biz'))}<a href=${tableUrl('shahi-handi')} target="_blank" rel="noopener">${t('qr_menu')}</a>${a(t('partner_sign_in'), () => go('dash'))}</div>
    </div>
    <div className="word" aria-hidden="true">khabo</div>
    <div className="base"><span>© 2026 khabo</span><span style=${{ display: 'flex', gap: 16 }}>${a(t('terms'), () => go('biz'))}${a(t('privacy'), () => go('biz'))}</span></div>
  </div></footer>`;
}
function Diner({ page, rid }) {
  const P = { home: Home, list: List, dishes: Dishes, deals: Deals, rest: Rest, biz: Biz, order: DealOrder, prices: Prices, events: Events }[page] || Home;
  const bare = EMBED && page === 'order';
  return html`${bare ? null : html`<${Hdr} />`}<${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${page === 'rest' ? 'rest-' + rid : page} initial=${page === 'rest' ? { opacity: 0 } : { opacity: 0, y: 12 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0, y: page === 'rest' ? 0 : -6, transition: { duration: 0.16, ease: EASE } }} transition=${{ duration: 0.42, ease: EASE }}><${Top} /><${P} />${bare ? null : html`<${Foot} />`}<//><//>${page === 'rest' || bare ? null : html`<${TabBar} />`}`;
}

/* ================= HOME (the current order: hero, partners, craving, open around, map, browse, ask, see, deals, prices, owners) ================= */
function Home() {
  return html`<${Hero} /><${Partners} /><${Cravings} /><${Near} /><${MapSec} /><${Hub} /><${AiSec} /><${SeeSec} /><${HomeDeals} /><${HomeEvents} /><${PriceSec} /><${OwnSec} />`;
}
function wallPics() {
  const seen = new Set(), pics = [];
  const add = id => { if (id && !seen.has(id) && !String(id).startsWith('ph:')) { seen.add(id); pics.push(id); } };
  D.restaurants.forEach(r => { add(r.hero[0]); r.signature.forEach(s => { const d = r.menu.find(z => z.id === s); if (d) add(d.p); }); });
  D.restaurants.forEach(r => add(r.gallery.inside && r.gallery.inside[1]));
  return pics;
}
function Hero() {
  const { set } = useApp();
  const pics = useMemo(wallPics, []), cols = [[], [], [], []]; pics.slice(0, 28).forEach((p, i) => cols[i % 4].push(p));
  const ex = [t('ph_1'), t('ph_2'), t('ph_3'), t('ph_4')]; const [ri, setRi] = useState(0);
  useEffect(() => { const iv = setInterval(() => setRi(i => (i + 1) % 4), 2800); return () => clearInterval(iv); }, []);
  return html`<section className="hero">
    <div className="wall" aria-hidden="true">${cols.map((c, ci) => html`<div className="wall-col" key=${ci}><div className="wall-run" style=${{ '--dur': [64, 82, 70, 90][ci] + 's' }}>${c.concat(c).map((p, i) => html`<div key=${i} className=${clsx('wall-t', (i + ci) % 3 === 0 && 'tall')}><img src=${src(p, 360)} alt="" loading=${i < 3 ? 'eager' : 'lazy'} /></div>`)}</div></div>`)}</div>
    <div className="wrap hero-in">
      <h1 className="h1">${[t('hero_1'), t('hero_2')].map((s, i) => html`<${motion.span} key=${i + LANG} className="ln" initial=${{ opacity: 0, y: 28, filter: 'blur(6px)' }} animate=${{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition=${{ duration: 0.7, delay: 0.08 + i * 0.12, ease: EASE }}>${s}<//>`)}</h1>
      <${motion.p} initial=${{ opacity: 0, y: 14 }} animate=${{ opacity: 1, y: 0 }} transition=${{ duration: 0.6, delay: 0.3, ease: EASE }}>${t('hero_sub')}<//>
      <${motion.div} className="hs" initial=${{ opacity: 0, y: 18, scale: 0.98 }} animate=${{ opacity: 1, y: 0, scale: 1 }} transition=${{ duration: 0.6, delay: 0.42, ease: EASE }}>
        <${AreaPop} cls="area-b" />
        <button className="hs-q" onClick=${() => set({ palette: true })} aria-label=${t('search')}><${I} n="magnifying-glass" b /><span className="rot"><${AnimatePresence} initial=${false}><${motion.span} key=${ri + LANG} initial=${{ y: 22, opacity: 0 }} animate=${{ y: 0, opacity: 1 }} exit=${{ y: -22, opacity: 0 }} transition=${{ duration: 0.4, ease: EASE }}>${ex[ri]}<//><//></span></button>
        <button className="btn btn-gold ai-b" onClick=${() => set({ ai: { q: '' } })}><${I} n="sparkle" f />${t('ask_ai')}</button>
      <//>
    </div></section>`;
}
function Partners() {
  const row = k => D.restaurants.map(r => html`<button key=${k + r.id} className=${clsx('lock', r.theme.font === 'serif' && 'serif')} tabIndex=${k ? -1 : 0} aria-hidden=${k ? 'true' : null} onClick=${() => openRest(r.id)}><${Mono} r=${r} />${r.name.en}</button>`);
  return html`<section className="pt" aria-label=${t('partners')}><p>${t('partners_line', { n: N(D.restaurants.length) })}</p><div className="marq"><div className="marq-t">${row('')}${row('d')}</div></div></section>`;
}
function Cravings() {
  const [all, setAll] = useState(false);
  const order = D.cravings.concat(Object.keys(D.types).filter(id => !D.cravings.includes(id))).filter(id => allDishes().some(d => d.type === id));
  const shown = all ? order : order.slice(0, 12);
  return html`<section className="sec"><div className="wrap">
    <div className="sec-head"><${Rise} as="h2" className="h2">${t('craving')}<//><a className="link" href="#" onClick=${ev => { ev.preventDefault(); toDishes({}); }}>${t('all_dishes')}<${I} n="arrow-right" b /></a></div>
    <${motion.div} layout className="cats">${shown.map((id, i) => {
      const ty = D.types[id], s = typeStats(id), pic = typePic(id);
      return html`<${motion.button} layout key=${id} className="cat" onClick=${() => toDishes({ type: id })} initial=${{ opacity: 0, y: 14 }} whileInView=${{ opacity: 1, y: 0 }} viewport=${{ once: true }} transition=${{ duration: 0.45, delay: (i % 6) * 0.04, ease: EASE }} whileTap=${{ scale: 0.97 }}>
        <${Pic} id=${pic} w=${420}>${pic ? null : html`<span className="cat-np"><${I} n=${ty.i || 'fork-knife'} /></span>`}<//>
        <b>${L(ty)}</b><span>${tj('from_price', { p: html`<${Tk} v=${s.lo} />` })}</span><//>`;
    })}<//>
    ${order.length > 12 ? html`<div className="cat-more"><button className="btn btn-line" onClick=${() => setAll(!all)}>${all ? t('show_less') : t('show_all_cats', { n: N(order.length) })}<${I} n=${all ? 'caret-up' : 'caret-down'} b /></button></div>` : null}
  </div></section>`;
}
function Near() {
  const { area } = useApp(); const [bud, setBud] = useState('all'); const a = areaOf(area);
  let rs = D.restaurants.filter(r => r.city === a.city); const b = D.budgets.find(z => z.id === bud);
  if (b) rs = rs.filter(r => r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0));
  rs = rs.slice().sort((p, q) => (q.area === a.id) - (p.area === a.id) || openState(q).open - openState(p).open || q.rating - p.rating);
  const head = html`<div><${Rise} as="h2" className="h2">${t('near_title', { a: L(a) })}<//><div className="near-tools"><${AreaPop} cls="link"><${I} n="map-pin" b />${t('change_area')}<//><a className="link" href="#" onClick=${ev => { ev.preventDefault(); toList({ city: a.city }); }}>${t('all_in_city', { c: L(D.cities[a.city]) })}<${I} n="arrow-right" b /></a><${Seg} id="nearbud" items=${[['all', t('any_budget')], ...D.budgets.map(z => [z.id, L(z)])]} value=${bud} onChange=${setBud} /></div></div>`;
  return html`<section className="sec"><div className="wrap"><${RailX} head=${head} cls="rc-rail" key=${bud + area}>${rs.length ? rs.map(r => html`<${RCard} key=${r.id} r=${r} />`) : html`<div className="empty"><p>${t('no_budget_area')}</p></div>`}<//></div></section>`;
}
function MapSec() {
  const { area } = useApp(); const [city, setCity] = useState(areaOf(area).city);
  const list = D.restaurants.filter(r => r.city === city), cities = Object.keys(D.cities).filter(c => D.restaurants.some(r => r.city === c));
  const ref = useRef(), inView = useInView(ref, { once: true, margin: '400px 0px' });
  return html`<section className="sec"><div className="wrap">
    <div className="sec-head"><div><${Rise} as="h2" className="h2">${t('map_title')}<//><${Rise} as="p" className="sub" d=${1}>${t('map_sub')}<//></div><${Seg} id="mapcity" items=${cities.map(c => [c, L(D.cities[c]), N(D.restaurants.filter(r => r.city === c).length)])} value=${city} onChange=${setCity} /></div>
    <div className="map" ref=${ref}>${inView ? html`<${MapBox} list=${list} />` : null}<span className="map-hint"><${I} n="hand-pointing" />${t('map_hint')}</span></div>
    <p style=${{ marginTop: 14 }}><a className="link" href="#" onClick=${ev => { ev.preventDefault(); toList({ city }); }}>${t('all_in_city', { c: L(D.cities[city]) })}<${I} n="arrow-right" b /></a></p>
  </div></section>`;
}
function Hub() {
  const [tab, setTab] = useState('areas');
  const rcount = f => D.restaurants.filter(f).length;
  const body = () => {
    if (tab === 'areas') return html`<div className="hub-g">${D.areas.map(a => { const rs = D.restaurants.filter(r => r.area === a.id); return html`<button key=${a.id} className="area-c" onClick=${() => toList({ area: a.id })}><${Pic} id=${rs[0] ? rs[0].hero[0] : null} w=${520} word=${L(a)} /><b>${L(a)}</b><span>${L(D.cities[a.city])}, ${t('n_places', { n: N(rs.length) })}</span><p>${L(a.blurb)}</p></button>`; })}</div>`;
    if (tab === 'cuisines') return html`<div className="hub-g">${D.cuisines.map(c => { const ds = allDishes().filter(d => cuOf(d) === c.id); return html`<button key=${c.id} className="tile" onClick=${() => toDishes({ cu: c.id })}><b>${L(c)}</b><span>${t('n_dishes_places', { d: N(ds.length), p: N(new Set(ds.map(d => d.r)).size) })}</span></button>`; })}</div>`;
    if (tab === 'occasions') return html`<div className="hub-g">${D.occasions.map(o => html`<button key=${o.id} className="tile" onClick=${() => toList({ occ: o.id })}><${I} n=${o.i} /><b>${L(o)}</b></button>`)}</div>`;
    if (tab === 'budget') return html`<div className="hub-g">${D.budgets.map(b => html`<button key=${b.id} className="tile" onClick=${() => toList({ bud: b.id })}><span>${t('per_person')}</span><b style=${{ fontSize: 22 }}>${L(b)}</b><span>${t('n_places', { n: N(rcount(r => r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0))) })}</span></button>`)}</div>`;
    return html`<div className="hub-g">${Object.entries(D.facilities).map(([id, f]) => html`<button key=${id} className="tile" onClick=${() => toList({ fac: [id] })}><${I} n=${f.i} /><b>${L(f)}</b><span>${t('n_places', { n: N(rcount(r => r.fac.includes(id))) })}</span></button>`)}</div>`;
  };
  return html`<section className="sec"><div className="wrap">
    <div className="sec-head"><${Rise} as="h2" className="h2">${t('browse_all')}<//><${Seg} id="hub" items=${[['areas', t('areas')], ['occasions', t('occasions')], ['budget', t('budget')], ['facilities', t('facilities')], ['cuisines', t('cuisines')]]} value=${tab} onChange=${setTab} /></div>
    <${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${tab} initial=${{ opacity: 0, y: 10 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0, y: -6 }} transition=${{ duration: 0.25, ease: EASE }}>${body()}<//><//>
  </div></section>`;
}

/* ---------- Ask the AI: the same plain-words planner idea as the live site, on the real menus ---------- */
const TYPE_WORDS = { kacchi: ['kacchi', 'kachchi', 'kachi', 'কাচ্চি'], biryani: ['biryani', 'biriyani', 'বিরিয়ানি'], tehari: ['tehari', 'তেহারি'], kebab: ['kebab', 'kabab', 'chap', 'কাবাব', 'চাপ'], fuchka: ['fuchka', 'phuchka', 'chotpoti', 'ফুচকা', 'চটপটি'], fish: ['fish', 'mach', 'ilish', 'মাছ', 'ইলিশ'], thali: ['thali', 'bhorta', 'ভর্তা', 'থালি'], naan: ['naan', 'নান'], polao: ['polao', 'pulao', 'পোলাও'], bakery: ['cake', 'bakery', 'কেক'], tea: ['tea', 'coffee', 'চা'], chinese: ['chinese', 'চাইনিজ'], thai: ['thai', 'থাই'], dessert: ['dessert', 'doi', 'mishti', 'দই', 'মিষ্টি'], platter: ['platter', 'প্ল্যাটার'] };
const toAscii = s => String(s).replace(/[০-৯]/g, c => BD.indexOf(c));
function parseQ(q0) {
  const q = toAscii(q0).toLowerCase(), p = { people: 0, budget: 0, area: null, city: null, type: null };
  for (const m of q.matchAll(/(\d[\d,]*)\s*(taka|tk|টাকা|৳)?/g)) { const v = +m[1].replace(/,/g, ''); if (!v) continue; if (m[2] || v >= 100) { if (!p.budget) p.budget = v; } else if (v <= 30 && !p.people) p.people = v; }
  if (/৳\s*\d/.test(q) && !p.budget) p.budget = +(q.match(/৳\s*(\d[\d,]*)/)[1].replace(/,/g, ''));
  D.areas.forEach(a => { if (q.includes(a.en.toLowerCase()) || q.includes(a.bn) || q.includes(a.id.replace('-', ' '))) p.area = a.id; });
  Object.entries(D.cities).forEach(([id, c]) => { if (q.includes(c.en.toLowerCase()) || q.includes(c.bn)) p.city = id; });
  p.family = /family|ফ্যামিলি|পরিবার|parents/.test(q);
  p.rooftop = /rooftop|roof|ছাদ|রুফটপ|date|ডেট/.test(q);
  p.open = /open now|ekhon|এখন খোলা/.test(q);
  p.late = /late|raat|রাত|midnight/.test(q);
  Object.entries(TYPE_WORDS).forEach(([ty, ws]) => { if (!p.type && ws.some(w => q.includes(w))) p.type = ty; });
  return p;
}
function meal(r, ppl) {
  const mains = r.menu.filter(d => !d.share && !d.out && !['drink', 'dessert', 'tea', 'naan', 'snack'].includes(d.type)); if (!mains.length) return null;
  const main = mains.find(d => d.best) || mains.slice().sort((a, b) => a.price - b.price)[0], drink = r.menu.find(d => d.type === 'drink' && !d.out);
  const lines = [[main, ppl]].concat(drink ? [[drink, ppl]] : []), sub = lines.reduce((s, [d, k]) => s + d.price * k, 0), total = Math.round(sub * (1 + (r.vat + r.service) / 100));
  return { r, lines, total, pp: Math.round(total / ppl), people: ppl };
}
function answer(q) {
  const p = parseQ(q), say = (en, bn) => LANG === 'bn' ? bn : en;
  let rs = D.restaurants.slice();
  if (p.area) rs = rs.filter(r => r.area === p.area); else if (p.city) rs = rs.filter(r => r.city === p.city);
  if (p.family) rs = rs.filter(r => r.fac.includes('cabin'));
  if (p.rooftop) rs = rs.filter(r => r.fac.includes('rooftop'));
  if (p.open) rs = rs.filter(r => openState(r).open);
  if (p.late) rs = rs.filter(isLate);
  const wh = p.area ? L(areaOf(p.area)) : p.city ? L(D.cities[p.city]) : '';
  const none = { text: say('I could not find a place that matches all of that yet. Try fewer words, or another area.', 'সব শর্ত মেলে এমন জায়গা এখনো পাইনি। কম কথায় বা অন্য এলাকা দিয়ে চেষ্টা করুন।'), cards: [] };
  if (p.people || p.budget) {
    const ppl = p.people || 2, fit = m => !p.budget || m.total <= p.budget;
    const plans = rs.map(r => meal(r, ppl)).filter(Boolean).sort((a, b) => (fit(b) - fit(a)) || b.r.rating - a.r.rating);
    if (!plans.length) return none;
    const best = plans[0], ok = fit(best);
    const text = ok
      ? say(`For ${ppl} people${wh ? ' in ' + wh : ''}${p.budget ? ' with ' + tk(p.budget) : ''}, ${best.r.name.en} fits best: about ${tk(best.total)} with VAT and service, ${tk(best.pp)} each.`, `${wh ? wh + '-এ ' : ''}${N(ppl)} জনের জন্য${p.budget ? ' ' + tk(p.budget) + '-এর মধ্যে' : ''} ${best.r.name.bn} সবচেয়ে ভালো: ভ্যাট আর সার্ভিসসহ প্রায় ${tk(best.total)}, জনপ্রতি ${tk(best.pp)}।`)
      : say(`With ${tk(p.budget)} for ${ppl} it is tight. The closest is ${best.r.name.en}, about ${tk(best.total)} with VAT and service.`, `${N(ppl)} জনের জন্য ${tk(p.budget)}-এ একটু টানাটানি। সবচেয়ে কাছাকাছি ${best.r.name.bn}, ভ্যাট আর সার্ভিসসহ প্রায় ${tk(best.total)}।`);
    return { text, cards: plans.slice(0, 3).map(m => ({ kind: 'plan', ...m })) };
  }
  if (p.type) {
    const ok = new Set(rs.map(r => r.id)), ds = allDishes().filter(d => d.type === p.type && !d.share && ok.has(d.r)).sort((a, b) => a.price - b.price);
    if (!ds.length) return none;
    const lo = ds[0], nm = L(D.types[p.type]);
    return { text: say(`${nm}${wh ? ' in ' + wh : ''}: ${ds.length} plates on khabo. The lowest is ${tk(lo.price)} at ${RR(lo.r).name.en}.`, `${wh ? wh + '-এ ' : ''}${nm}: খাবোতে ${N(ds.length)}টি প্লেট। সবচেয়ে কম ${tk(lo.price)}, ${RR(lo.r).name.bn}-এ।`), cards: ds.slice(0, 3).map(d => ({ kind: 'dish', d })) };
  }
  if (!rs.length) return none;
  rs.sort((a, b) => b.rating - a.rating);
  return { text: say(`These are the best rated places${wh ? ' in ' + wh : ''} for that.`, `${wh ? wh + '-এ ' : ''}এর জন্য সবচেয়ে ভালো রেটিংয়ের জায়গা।`), cards: rs.slice(0, 3).map(r => ({ kind: 'rest', r })) };
}
const usePlan = m => { const st = S(); st.clearBill(m.r.id); m.lines.forEach(([d, k]) => st.add(m.r.id, d.id, k)); st.set({ ai: null, people: m.people }); toast(t('bill_loaded')); openRest(m.r.id); setTimeout(() => S().set({ billOpen: m.r.id }), 900); };
function AiCard({ c, demo }) {
  if (c.kind === 'plan') return html`<button className="opt-c" tabIndex=${demo ? -1 : 0} onClick=${() => usePlan(c)}><${Pic} id=${c.r.hero[0]} w=${120} /><span><b>${L(c.r.name)}</b><small>${c.lines.map(([d, k]) => `${N(k)} × ${L(d.name)}`).join(', ')}</small></span><span className="price-w"><${Tk} v=${c.total} /><small>${tx('each', { v: tk(c.pp) })}</small></span></button>`;
  if (c.kind === 'dish') { const r = RR(c.d.r); return html`<button className="opt-c" tabIndex=${demo ? -1 : 0} onClick=${ev => { S().set({ ai: null }); openDish(r.id, c.d.id, ev.currentTarget); }}><${Pic} id=${c.d.p} w=${120} tone=${r.theme} /><span><b>${L(c.d.name)}</b><small>${L(r.name)}, ${L(areaOf(r.area))}</small></span><span className="price-w"><${Tk} v=${c.d.price} /><small>${L(c.d.por)}</small></span></button>`; }
  return html`<button className="opt-c" tabIndex=${demo ? -1 : 0} onClick=${ev => { S().set({ ai: null }); openRest(c.r.id, ev.currentTarget); }}><${Pic} id=${c.r.hero[0]} w=${120} /><span><b>${L(c.r.name)}</b><small>${where(c.r)}</small></span><span className="price-w"><${Tk} v=${c.r.ppl[0]} to=${c.r.ppl[1]} /><small>${t('per_person')}</small></span></button>`;
}
function AiDemo() {
  const q = LANG === 'bn' ? 'আমরা ৪ জন, ২৫০০ টাকা, ধানমন্ডি, ফ্যামিলি' : 'amra 4 jon, 2500 taka, Dhanmondi, family';
  const [i, setI] = useState(0), [step, setStep] = useState('type'), [run, setRun] = useState(0);
  const a = useMemo(() => answer(q), [q]);
  useEffect(() => { setI(0); setStep('type'); }, [run, q]);
  useEffect(() => {
    if (step === 'type') { if (i < q.length) { const tm = setTimeout(() => setI(i + 1), 34); return () => clearTimeout(tm); } setStep('think'); }
    if (step === 'think') { const tm = setTimeout(() => setStep('done'), 1700); return () => clearTimeout(tm); }
  }, [i, step]);
  return html`<div className="me">${q.slice(0, i)}${step === 'type' ? html`<span className="caret" style=${{ display: 'inline-block', height: 16, verticalAlign: -2, marginLeft: 2, background: 'currentColor' }} />` : null}</div>
    <${AnimatePresence} mode="wait">${step === 'think' ? html`<${motion.span} key="th" className="shimmer" data-text=${t('ai_thinking')} initial=${{ opacity: 0 }} animate=${{ opacity: 1 }} exit=${{ opacity: 0 }}>${t('ai_thinking')}<//>` : null}${step === 'done' ? html`<${motion.div} key="ans" className="bot" initial=${{ opacity: 0, y: 8, filter: 'blur(4px)' }} animate=${{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition=${{ duration: 0.45, ease: EASE }}><p>${a.text}</p><div className="opts" style=${{ marginTop: 12 }}>${a.cards.map((c, k) => html`<${AiCard} key=${k} c=${c} demo />`)}</div><button className="link" style=${{ marginTop: 12 }} onClick=${() => setRun(run + 1)}><${I} n="arrow-counter-clockwise" b />${tx('again')}</button><//>` : null}<//>`;
}
function AiSec() {
  const { set } = useApp(); const ex = [t('try_1'), t('try_4'), t('try_5')];
  const ref = useRef(), inView = useInView(ref, { once: true, margin: '-12% 0px' });
  return html`<section className="sec" id="ask"><div className="wrap ai-s">
    <div><${Rise} as="h2" className="h2">${t('ai_title')}<//><${Rise} as="p" className="sub" d=${1}>${t('ai_sub')}<//>
      <div className="ai-ex">${ex.map((q, i) => html`<${motion.button} key=${i + LANG} onClick=${() => set({ ai: { q } })} initial=${{ opacity: 0, x: -10 }} whileInView=${{ opacity: 1, x: 0 }} viewport=${{ once: true }} transition=${{ duration: 0.4, delay: 0.1 + i * 0.07, ease: EASE }}><span>${q}</span><${I} n="arrow-up-right" b /><//>`)}</div>
      <button className="btn btn-pri btn-lg" onClick=${() => set({ ai: { q: '' } })}><${I} n="sparkle" f />${t('ask_title')}</button></div>
    <${Rise} d=${1} className="ai-win"><div className="ai-win-h"><span className="orb"><${I} n="sparkle" f /></span><b>${t('ask_title')}</b><span className="meta">${t('ask_langs')}</span></div><div className="ai-body" ref=${ref}>${inView ? html`<${AiDemo} key=${LANG} />` : null}</div><//>
  </div></section>`;
}
function SeeSec() {
  const { set } = useApp();
  const kr = RR('kathgolap'), sh = RR('shahi-handi'), ca = RR('cha-adda');
  const cake = ca && ca.menu.find(d => d.d3), k = sh && sh.menu.find(d => d.id === 'mutton-kacchi');
  const vref = useRef(), mref = useRef(), vIn = useInView(vref, { margin: '120px 0px' }), mIn = useInView(mref, { once: true, margin: '200px 0px' });
  useEffect(() => { const v = vref.current; if (!v) return; if (vIn) { v.muted = true; v.playsInline = true; if (!v.src) v.src = sh.kitchen.src; v.play().catch(() => { }); } else v.pause(); }, [vIn]);
  const sub = k ? k.price * 4 : 0, vat = k ? sub * sh.vat / 100 : 0, svc = k ? sub * sh.service / 100 : 0;
  return html`<section className="sec"><div className="wrap">
    <${Rise} as="h2" className="h2">${t('see_title')}<//><${Rise} as="p" className="sub" d=${1}>${t('see_sub')}<//>
    <div className="bento">
      ${kr ? html`<${Rise} className="bx bx-a ph-c"><img src=${src('pv:hotel_rooftop_balcony:a', 1400)} alt="" loading="lazy" /><div className="bx-cap"><h3>${t('bx_tour')}</h3><p>${t('bx_tour_sub', { r: L(kr.name) })}</p><button className="btn btn-white" onClick=${() => set({ tour: { rid: kr.id } })}><${I} n="virtual-reality" />${t('step_inside')}</button></div><//>` : null}
      ${cake ? html`<${Rise} d=${1} className="bx bx-b bx-3d"><div className="bx-cap"><h3>${t('bx_3d')}</h3><p>${L(cake.name)}, ${L(ca.name)}</p></div><div className="stage3" ref=${mref}>${mIn ? html`<${Model} id=${cake.d3} compact alt=${L(cake.name)} />` : html`<img src=${src(cake.p, 600)} alt="" />`}</div><div className="act3"><button className="btn btn-pri btn-sm" onClick=${() => openDish(ca.id, cake.id, null, false, 'd3')}><${I} n="cube" />${t('turn_it')}</button></div><//>` : null}
      ${sh && sh.kitchen ? html`<${Rise} d=${2} className="bx bx-c ph-c"><video ref=${vref} muted loop playsInline preload="none" poster=${src(sh.kitchen.poster, 900)} /><div className="bx-cap"><h3>${t('bx_kitchen')}</h3><p>${L(sh.name)}. ${L(sh.kitchen.date)}</p></div><//>` : null}
      ${k ? html`<${Rise} d=${3} className="bx bx-d"><div className="bx-pad"><h3>${t('bx_bill')}</h3><p>${t('bx_bill_sub')}</p>
        <div className="minib"><div className="row" style=${{ alignItems: 'center', justifyContent: 'flex-start', gap: 10 }}><${Mono} r=${sh} /><b>${L(sh.name)}</b></div>
          <div className="row"><span>${N(4)} × ${L(k.name)}</span><${Tk} v=${sub} /></div>
          <div className="row m"><span>${t('vat')} ${N(sh.vat)}%</span><${Tk} v=${vat} /></div>
          <div className="row m"><span>${t('service')} ${N(sh.service)}%</span><${Tk} v=${svc} /></div>
          <div className="row tot"><span>${t('total_all_in')}</span><${Tk} v=${sub + vat + svc} /></div>
          <div className="row pp"><span>${t('each_of', { n: N(4) })}</span><${Tk} v=${(sub + vat + svc) / 4} /></div></div></div><//>` : null}
    </div></div></section>`;
}
function HomeDeals() {
  const { order, go } = useApp();
  const all = rankDeals(liveDeals(), order); if (!all.length) return null;
  /* Premium partners get the big slider; everyone else is in "More deals around town" */
  const prem = all.filter(z => z.r.plan === 'premium'), big = prem.length ? prem : all.slice(0, 1), rest = all.filter(z => !big.includes(z));
  return html`<section className="sec"><div className="wrap">
    <${Rise}>${big.length > 1 ? html`<${Slider} items=${big} />` : html`<${Coupon} x=${big[0]} big />`}<//>
    ${rest.length ? html`<div style=${{ marginTop: 40 }}><${RailX} head=${html`<h2 className="h3">${t('more_deals')} <span className="meta" style=${{ fontWeight: 500 }}>${t('n_deals', { n: N(rest.length) })}</span></h2>`} cls="cp-rail">${rest.map(z => html`<${Coupon} key=${z.k} x=${z} />`)}<//></div>` : null}
    <div style=${{ display: 'flex', justifyContent: 'center', marginTop: 28 }}><button className="btn btn-line" onClick=${() => go('deals')}>${t('all_deals')}<${I} n="arrow-right" b /></button></div>
  </div></section>`;
}
function PriceSec() {
  const PRICE = ['kacchi', 'biryani', 'kebab', 'fuchka', 'thali'].filter(id => allDishes().some(d => d.type === id));
  const [ty, setTy] = useState(PRICE[0]);
  const ds = allDishes().filter(d => d.type === ty && !d.share).sort((a, b) => a.price - b.price);
  const pr = ds.map(d => d.price), lo = pr[0] || 0, hi = Math.max(0, ...pr), mid = pr[Math.floor(pr.length / 2)] || 0, pos = p => hi === lo ? 50 : (p - lo) / (hi - lo) * 100;
  const nm = L(D.types[ty] || {}), tone = p => p < mid ? 'lo' : p > mid ? 'hi' : 'typ';
  return html`<section className="sec"><div className="wrap">
    <div className="sec-head"><div><${Rise} as="h2" className="h2">${t('pc_title')}<//><${Rise} as="p" className="sub" d=${1}>${t('pc_sub')}<//></div><${Seg} id="pc" items=${PRICE.map(id => [id, L(D.types[id])])} value=${ty} onChange=${setTy} /></div>
    <${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${ty + LANG} className="pc" initial=${{ opacity: 0, y: 10 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0, y: -6 }} transition=${{ duration: 0.28, ease: EASE }}>
      <div className="pc-sum"><span className="k">${t('pc_typical', { d: nm.toLowerCase() })}</span><b className="big"><${Tk} v=${mid} flow /></b>
        <div className="scale" aria-hidden="true">${ds.map((d, i) => html`<i key=${i} className=${d.price === mid ? 'mid' : ''} style=${{ '--x': pos(d.price) + '%' }} />`)}</div>
        <div className="ends"><span><b><${Tk} v=${lo} /></b>${t('lowest')}</span><span style=${{ textAlign: 'right' }}><b><${Tk} v=${hi} /></b>${t('highest')}</span></div>
        <p className="k">${t('pc_range', { lo: tk(lo), hi: tk(hi), n: N(new Set(ds.map(d => d.r)).size) })}</p>
        ${hi > lo ? html`<p className="pc-save"><${I} n="tag" />${t('pc_save', { v: tk(hi - lo) })}</p>` : null}
        <button className="btn btn-gold" style=${{ justifySelf: 'start' }} onClick=${() => toDishes({ type: ty, mode: 'prices', sort: 'price' })}>${t('pc_all', { d: nm.toLowerCase() })}<${I} n="arrow-right" b /></button><button className="link" style=${{ color: 'var(--gold)' }} onClick=${() => toPrices({ type: ty })}><${I} n="chart-line-up" b />${tx('see_hist')}</button></div>
      <ol className="pc-list" style=${{ listStyle: 'none', margin: 0, padding: 0 }}>${ds.slice(0, 6).map((d, i) => { const r = RR(d.r), diff = d.price - mid, tn = tone(d.price); return html`<${motion.li} key=${d.r + d.id} initial=${{ opacity: 0, x: 12 }} animate=${{ opacity: 1, x: 0 }} transition=${{ duration: 0.35, delay: i * 0.05, ease: EASE }}><button className="pc-row" style=${{ width: '100%' }} onClick=${ev => openDish(r.id, d.id, ev.currentTarget.querySelector('.pic'))}>
        <${Pic} id=${d.p} w=${160} word=${L(d.name)} tone=${r.theme} />
        <span style=${{ minWidth: 0 }}><b>${L(d.name)}${i === 0 ? html` <span className="pc-chip lo">· ${t('lowest')}</span>` : null}</b><small><${Mono} r=${r} cls="sm" />${L(r.name)} · ${L(areaOf(r.area))}</small></span>
        <span className="mini" aria-hidden="true"><i className=${tn} style=${{ '--x': pos(d.price) + '%' }} /></span>
        <span className="p"><${Tk} v=${d.price} /><span className=${clsx('pc-chip', tn)}>${diff === 0 ? t('pc_typ') : (diff < 0 ? '−' : '+') + tk(Math.abs(diff))}</span></span></button><//>`; })}</ol>
    <//><//>
  </div></section>`;
}
function OwnSec() {
  const { go } = useApp(); const r = RR('shahi-handi'); if (!r) return null;
  return html`<section className="own"><div className="wrap">
    <div><${Rise} as="h2">${t('own_title')}<//><${Rise} as="p" className="lede" d=${1}>${t('own_sub')}<//>
      <ul>${[['qr-code', 'own_p1'], ['printer', 'own_p2'], ['chart-line-up', 'own_p3']].map(([ic, k], i) => html`<${motion.li} key=${k} initial=${{ opacity: 0, y: 12 }} whileInView=${{ opacity: 1, y: 0 }} viewport=${{ once: true }} transition=${{ duration: 0.45, delay: i * 0.08, ease: EASE }}><${I} n=${ic} /><div><b>${t(k)}</b><span>${t(k + 's')}</span></div><//>`)}</ul>
      <div style=${{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button className="btn btn-gold btn-lg" onClick=${() => go('biz')}>${t('see_plans')}</button><a className="btn btn-glass btn-lg" href=${tableUrl(r.id)} target="_blank" rel="noopener">${t('try_table')}</a></div></div>
    <${Rise} d=${1} className="own-art"><img src=${src('pv:warm_restaurant_night:b', 1000)} alt="" loading="lazy" />
      <${motion.a} className="tcard" href=${tableUrl(r.id)} target="_blank" rel="noopener" style=${{ '--td': r.theme.deep, '--ta': r.theme.accent }} whileHover=${{ y: -4, rotate: -1 }} transition=${{ duration: 0.3, ease: EASE }}><span className=${clsx(r.theme.font === 'serif' && 'serif')}>${r.name.en}</span><${QR} text=${tableUrl(r.id)} look="rounded" /><b>${t('tc_scan')}</b><span>মেনু ও দাম দেখতে স্ক্যান করুন</span><span>khabo</span><//><//>
  </div></section>`;
}

/* ================= RESTAURANTS (today's collapsible filter groups, made smoother) ================= */
function Grp({ title, open0 = true, children }) {
  const [o, setO] = useState(open0);
  return html`<div className="fg"><button className="fg-h" onClick=${() => setO(!o)} aria-expanded=${o}>${title}<${motion.span} className="chev" animate=${{ rotate: o ? 180 : 0 }} transition=${{ duration: 0.25, ease: EASE }}><${I} n="caret-down" b /><//></button>
    <${AnimatePresence} initial=${false}>${o ? html`<${motion.div} key="b" className="fg-b" initial=${{ height: 0, opacity: 0 }} animate=${{ height: 'auto', opacity: 1 }} exit=${{ height: 0, opacity: 0 }} transition=${{ duration: 0.3, ease: EASE }}><div className="fg-in">${children}</div><//>` : null}<//></div>`;
}
function SideFilters({ f, setF, id }) {
  const cnt = fn => D.restaurants.filter(fn).length;
  const city = f.city || (f.area && areaOf(f.area).city) || '';
  const radio = (k, v, l, n) => { const on = f[k] === v; return html`<button key=${k + v} className=${clsx('fo', on && 'on')} role="radio" aria-checked=${on} onClick=${() => setF({ ...f, [k]: on ? '' : v, ...(k === 'area' && !on ? { city: '' } : {}) })}><i className="r" /><span>${l}</span>${n != null ? html`<em>${N(n)}</em>` : null}</button>`; };
  const check = (k, v, l, n) => { const on = (f[k] || []).includes(v); return html`<button key=${k + v} className=${clsx('fo', on && 'on')} role="checkbox" aria-checked=${on} onClick=${() => setF({ ...f, [k]: on ? f[k].filter(z => z !== v) : [...(f[k] || []), v] })}><i className="c"><${I} n="check" b /></i><span>${l}</span>${n != null ? html`<em>${N(n)}</em>` : null}</button>`; };
  const tog = (k, l) => { const on = !!f[k]; return html`<button key=${k} className=${clsx('fo', on && 'on')} role="checkbox" aria-checked=${on} onClick=${() => setF({ ...f, [k]: on ? '' : '1' })}><i className="c"><${I} n="check" b /></i><span>${l}</span></button>`; };
  return html`<div>
    <${Grp} title=${t('where')}><${Seg} id=${id + 'city'} items=${[['', t('anywhere')], ['dhaka', L(D.cities.dhaka)], ['bogura', L(D.cities.bogura)]]} value=${city} onChange=${v => setF({ ...f, city: v, area: '' })} /><div>${D.areas.filter(a => !city || a.city === city).map(a => radio('area', a.id, L(a), cnt(r => r.area === a.id)))}</div><//>
    <${Grp} title=${t('budget_pp')}><div>${D.budgets.map(b => radio('bud', b.id, L(b)))}</div><//>
    <${Grp} title=${t('food_type')}><label className="sel"><select value=${f.type || ''} onChange=${ev => setF({ ...f, type: ev.target.value })} aria-label=${t('food_type')}><option value="">${t('any_food')}</option>${D.cuisines.map(c => html`<optgroup key=${c.id} label=${L(c)}>${Object.entries(D.types).filter(([, z]) => z.cu === c.id).map(([tid, z]) => html`<option key=${tid} value=${tid}>${L(z)}</option>`)}</optgroup>`)}</select><${I} n="caret-down" /></label>
      <div className="chips">${D.cuisines.map(c => html`<button key=${c.id} className=${clsx('chip sm', f.cu === c.id && 'on')} onClick=${() => setF({ ...f, cu: f.cu === c.id ? '' : c.id })}>${L(c)}</button>`)}</div><//>
    <${Grp} title=${t('occasion')}><div className="chips">${D.occasions.filter(o => o.id !== 'tour').map(o => html`<button key=${o.id} className=${clsx('chip sm', f.occ === o.id && 'on')} onClick=${() => setF({ ...f, occ: f.occ === o.id ? '' : o.id })}><${I} n=${o.i} />${L(o)}</button>`)}</div><//>
    <${Grp} title=${t('when')}><div>${tog('open', t('q_open'))}${tog('late', t('late_night'))}</div><//>
    <${Grp} title=${t('rating')} open0=${false}><div>${radio('rating', '4', dg('4.0+'))}${radio('rating', '4.5', dg('4.5+'))}</div><//>
    <${Grp} title=${t('facilities')} open0=${false}><div>${Object.entries(D.facilities).map(([fid, z]) => check('fac', fid, L(z), cnt(r => r.fac.includes(fid))))}</div><//>
    <${Grp} title=${t('see_before')} open0=${false}><div>${check('media', 'tour', t('q_tour'))}${check('media', 'film', t('film'))}${check('media', 'kitchen', t('kitchen_film'))}${check('media', '3d', t('menu_3d'))}</div><//>
    <${Grp} title=${t('labels')} open0=${false}><div>${check('tags', 'deals', t('q_deals'), cnt(r => r.deal))}${check('tags', 'featured', t('featured'), cnt(r => r.featured))}${check('tags', 'founding', t('founding'), cnt(r => r.founding))}</div><//>
  </div>`;
}
const countAll = (f, skip = []) => Object.keys(f).filter(k => !['group', 'sort', 'mode', ...skip].includes(k) && (Array.isArray(f[k]) ? f[k].length : f[k])).reduce((s, k) => s + (Array.isArray(f[k]) ? f[k].length : 1), 0);
function chipsOf(f) {
  const out = [], z = (k, v, label) => out.push({ k, v, label });
  if (f.q) z('q', '', `“${f.q}”`); if (f.city) z('city', '', L(D.cities[f.city])); if (f.area) z('area', '', L(areaOf(f.area))); if (f.cu) z('cu', '', cuName(f.cu));
  if (f.type) z('type', '', t('serves_x', { d: L(D.types[f.type]) })); if (f.occ) z('occ', '', L(D.occasions.find(o => o.id === f.occ)));
  if (f.bud) z('bud', '', L(D.budgets.find(b => b.id === f.bud))); if (f.max) z('max', '', t('dish_upto', { v: tk(f.max) })); if (f.rating) z('rating', '', dg(f.rating) + '+');
  if (f.open) z('open', '', t('q_open')); if (f.late) z('late', '', t('late_night')); if (f.veg) z('veg', '', t('veg')); if (f.mild) z('mild', '', t('mild'));
  (f.fac || []).forEach(v => z('fac', v, L(D.facilities[v])));
  (f.media || []).forEach(v => z('media', v, { tour: t('q_tour'), film: t('film'), '3d': t('menu_3d'), kitchen: t('kitchen_film') }[v]));
  (f.tags || []).forEach(v => z('tags', v, { deals: t('q_deals'), featured: t('featured'), founding: t('founding') }[v]));
  return out;
}
const dropChip = (f, c) => { const n = { ...f }; if (LIST.includes(c.k)) n[c.k] = n[c.k].filter(z => z !== c.v); else delete n[c.k]; return n; };
const SORTS = page => page === 'dishes' ? [['rel', t('sort_rel')], ['price', t('sort_price')], ['rating', t('sort_rating')], ['near', t('sort_near')], ['fresh', t('sort_fresh')]] : [['rel', t('sort_rel')], ['price', t('sort_price_pp')], ['rating', t('sort_rating')], ['near', t('sort_near')], ['fresh', t('sort_fresh')]];
function FilterDrawer({ open, onClose, f0, apply }) {
  const [f, setF] = useState(f0); const { area } = useApp();
  useEffect(() => { if (open) setF(f0); }, [open]);
  const n = restaurants(f, area).length;
  return html`<${Drawer.Root} open=${open} onOpenChange=${o => !o && onClose()}><${Drawer.Portal} container=${FRAME}><${Drawer.Overlay} className="vaul-over" /><${Drawer.Content} className="vaul-c" aria-describedby=${undefined}><div className="sheet"><div className="sheet-grip" /><div className="sheet-h"><${Drawer.Title} className="h3">${t('filters')}<//><button className="x" onClick=${onClose} aria-label=${t('close')}><${I} n="x" b /></button></div>
    <${SideFilters} f=${f} setF=${setF} id="m" />
    <div style=${{ display: 'flex', gap: 8, position: 'sticky', bottom: -24, background: 'var(--surface)', padding: '14px 0' }}><button className="btn btn-line" onClick=${() => setF({ ...F0(), sort: f.sort, q: f.q })}>${t('clear_all')}</button><button className="btn btn-pri" style=${{ flex: 1 }} onClick=${() => { apply(f); onClose(); }}>${n ? t('show_n_places', { n: N(n) }) : t('no_results')}</button></div>
  </div><//><//><//>`;
}
function List() {
  const { lf: f, set, area } = useApp(); const setF = nf => set({ lf: nf }); const [sheet, setSheet] = useState(false);
  const rs = restaurants(f, area), a = f.area && areaOf(f.area), o = D.occasions.find(z => z.id === f.occ);
  const title = a ? t('rs_in', { a: L(a) }) : f.city ? t('rs_in', { a: L(D.cities[f.city]) }) : o ? L(o) : t('nav_restaurants');
  const chips = chipsOf(f), nf = countAll(f, ['q']);
  return html`<div className="wrap">
    <div className="lh"><div><${Rise} as="h1" className="h1" key=${title}>${title}<//><p className="sub">${a ? L(a.blurb) : t('rs_sub', { n: N(D.restaurants.length) })}</p></div>
      <label className="field"><${I} n="magnifying-glass" b /><input type="search" value=${f.q || ''} onChange=${ev => setF({ ...f, q: ev.target.value })} placeholder=${t('rs_search')} aria-label=${t('rs_search')} /></label></div>
    <div className="ls">
      <aside className="side-f" aria-label=${t('filters')}><${SideFilters} f=${f} setF=${setF} id="s" /></aside>
      <div style=${{ minWidth: 0 }}>
        <div className="lbar"><button className="tb-btn m-flt" onClick=${() => setSheet(true)}><${I} n="sliders-horizontal" />${t('filters')}${nf ? html`<span className="cnt">${N(nf)}</span>` : null}</button><span className="n"><b><${Num} v=${rs.length} /></b> ${t(rs.length === 1 ? 'place_one' : 'places_word')}</span><span className="sp" /><${Choose} icon="sort-ascending" label=${(SORTS('list').find(z => z[0] === f.sort) || SORTS('list')[0])[1]} title=${t('sort')} opts=${SORTS('list')} value=${f.sort} onPick=${v => setF({ ...f, sort: v })} /></div>
        ${chips.length ? html`<div className="act">${chips.map(c => html`<button key=${c.k + c.v} className="chip on" onClick=${() => setF(dropChip(f, c))}>${c.label}<${I} n="x" b /></button>`)}<button className="link" onClick=${() => setF({ ...F0(), sort: f.sort })}>${t('clear_all')}</button></div>` : null}
        ${rs.length ? html`<${motion.div} layout className="grid3"><${AnimatePresence} mode="popLayout" initial=${false}>${rs.map(r => html`<${motion.div} key=${r.id} layout initial=${{ opacity: 0, scale: 0.96 }} animate=${{ opacity: 1, scale: 1 }} exit=${{ opacity: 0, scale: 0.96 }} transition=${{ duration: 0.32, ease: EASE }}><${RCard} r=${r} plain /><//>`)}<//><//>`
          : html`<div className="empty"><${I} n="magnifying-glass" /><b>${t('nothing_all')}</b><p>${t('nothing_sub')}</p><div style=${{ display: 'flex', gap: 8 }}><button className="btn btn-line" onClick=${() => setF({ ...F0(), sort: f.sort })}>${t('clear_all')}</button><button className="btn btn-pri" onClick=${() => set({ ai: { q: f.q || '' } })}><${I} n="sparkle" f />${t('ask_ai')}</button></div></div>`}
      </div>
    </div>
    <${FilterDrawer} open=${sheet} onClose=${() => setSheet(false)} f0=${f} apply=${setF} />
  </div>`;
}

/* ================= DISHES (today's filters; prices as text, plus a full price list) ================= */
function PricePanel({ solo }) {
  const pr = solo.map(d => d.price).sort((a, b) => a - b), lo = pr[0], hi = pr[pr.length - 1], mid = pr[Math.floor(pr.length / 2)], pos = v => hi === lo ? 50 : (v - lo) / (hi - lo) * 100;
  const sorted = solo.slice().sort((a, b) => a.price - b.price), mi = Math.floor(pr.length / 2);
  return html`<div className="dh-price"><dl className="dh-stats"><div><dt>${t('lowest')}</dt><dd><${Tk} v=${lo} flow /></dd></div><div className="typ"><dt>${t('typical')}</dt><dd><${Tk} v=${mid} flow /></dd></div><div><dt>${t('highest')}</dt><dd><${Tk} v=${hi} flow /></dd></div></dl>
    <div className="dh-bar" role="img" aria-label=${t('dh_bar_label', { n: N(pr.length), lo: tk(lo), hi: tk(hi), m: tk(mid) })}>${sorted.map((d, i) => { const r = RR(d.r); return html`<button key=${d.r + d.id} className=${clsx('dh-dot', i === mi && 'typ')} style=${{ '--x': pos(d.price) + '%' }} title=${`${L(d.name)}, ${L(r.name)}, ${tk(d.price)}`} onClick=${ev => openDish(r.id, d.id, null)} />`; })}</div></div>`;
}
function PriceList({ ds }) {
  /* main dishes first, in the same order as the category strip */
  const order = D.cravings.concat(Object.keys(D.types).filter(id => !D.cravings.includes(id)));
  const types = [...new Set(ds.map(d => d.type))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return html`<div className="plist">${types.map(ty => {
    const g = ds.filter(d => d.type === ty && !d.share).sort((a, b) => a.price - b.price); if (!g.length) return null;
    const pr = g.map(d => d.price), lo = pr[0], hi = pr[pr.length - 1], mid = pr[Math.floor(pr.length / 2)], pos = v => hi === lo ? 50 : (v - lo) / (hi - lo) * 100;
    return html`<${Rise} key=${ty} className="pl-b"><div className="pl-h"><div><h3 className="h3">${L(D.types[ty])}</h3><p className="meta">${t('stat_dishes', { n: N(g.length), p: N(new Set(g.map(d => d.r)).size) })}</p></div><dl className="pl-k"><div><dt>${t('lowest')}</dt><dd><${Tk} v=${lo} /></dd></div><div className="typ"><dt>${t('typical')}</dt><dd><${Tk} v=${mid} /></dd></div><div><dt>${t('highest')}</dt><dd><${Tk} v=${hi} /></dd></div></dl></div>
      <div className="pl-rows">${g.map(d => { const r = RR(d.r), diff = d.price - mid, tn = diff < 0 ? 'lo' : diff > 0 ? 'hi' : 'typ'; return html`<button key=${d.r + d.id} className="pl-r" onClick=${ev => openDish(r.id, d.id, ev.currentTarget.querySelector('.pic'))}><${Pic} id=${d.p} w=${120} tone=${r.theme} icon=${(D.types[d.type] || {}).i} /><span className="nm"><b>${L(d.name)}</b><small><${Mono} r=${r} />${L(r.name)} · ${L(areaOf(r.area))}</small><span className="por">${L(d.por)}</span></span><span className="mini" aria-hidden="true"><i className=${tn} style=${{ '--x': pos(d.price) + '%' }} /></span><span className="p"><${Tk} v=${d.price} /><span className=${clsx('pc-chip', tn)}>${diff === 0 ? t('pc_typ') : (diff < 0 ? '−' : '+') + tk(Math.abs(diff))}</span></span></button>`; })}</div><//>`;
  })}</div>`;
}
function Dishes() {
  const { df: f, set, area } = useApp(); const setF = nf => set({ df: nf });
  const tbRef = useRef(); const [stuck, setStuck] = useState(false);
  useEffect(() => { const el = tbRef.current; if (!el) return; const io = new IntersectionObserver(([en]) => setStuck(!en.isIntersecting && en.boundingClientRect.top < 80), { rootMargin: '-68px 0px 0px 0px' }); io.observe(el); return () => io.disconnect(); }, []);
  const ds = dishes(f, area), ty = f.type && D.types[f.type], cu = f.cu && D.cuisines.find(c => c.id === f.cu);
  const title = ty ? L(ty) : cu ? L(cu) : f.q ? `“${f.q}”` : t('nav_dishes');
  const solo = ds.filter(d => !d.share), places = new Set(ds.map(d => d.r)).size, panel = ty && solo.length > 2;
  const sub = !ty && !cu && !f.q ? t('dishes_sub') : ds.length ? t(places === 1 && ds.length > 1 ? 'stat_dishes_1p' : 'stat_dishes', { n: N(ds.length), p: N(places) }) : '';
  const pic = ty ? typePic(f.type) : cu ? cu.p : null;
  const order = D.cravings.concat(Object.keys(D.types).filter(id => !D.cravings.includes(id))).filter(id => allDishes().some(d => d.type === id));
  const pickType = id => { setF({ ...f, type: id, cu: '', sort: id ? 'price' : 'rel' }); toTop(); };
  const areaLabel = f.area ? L(areaOf(f.area)) : f.city ? L(D.cities[f.city]) : t('anywhere');
  const areaOpts = [['', t('anywhere')], ...['dhaka', 'bogura'].flatMap(c => [[c + 'h', L(D.cities[c]), true], ['c:' + c, t('all_of', { c: L(D.cities[c]) })], ...D.areas.filter(a => a.city === c).map(a => ['a:' + a.id, L(a)])])];
  const areaVal = f.area ? 'a:' + f.area : f.city ? 'c:' + f.city : '';
  const caps = [150, 250, 400, 600, 1000];
  let body;
  if (!ds.length) body = html`<div className="empty"><${I} n="bowl-food" /><b>${t('nothing_all')}</b><p>${t('nothing_sub')}</p><button className="btn btn-line" onClick=${() => setF({ ...DF0(), group: f.group, mode: f.mode })}>${t('clear_all')}</button></div>`;
  else if (f.mode === 'prices') body = html`<${PriceList} ds=${ds} />`;
  else if (f.type) { const low = solo.slice().sort((a, b) => a.price - b.price)[0]; body = html`<${motion.div} layout className="dgrid"><${AnimatePresence} mode="popLayout" initial=${false}>${ds.map(d => html`<${motion.div} key=${d.r + d.id} layout initial=${{ opacity: 0, scale: 0.96 }} animate=${{ opacity: 1, scale: 1 }} exit=${{ opacity: 0, scale: 0.96 }} transition=${{ duration: 0.3, ease: EASE }}><${DCard} d=${d} lowest=${d === low} /><//>`)}<//><//>`; }
  else {
    const key = f.group === 'type' ? d => d.type : d => cuOf(d), ord = f.group === 'type' ? Object.keys(D.types) : D.cuisines.map(c => c.id);
    body = ord.map(k => ({ k, ds: ds.filter(d => key(d) === k) })).filter(g => g.ds.length).map(g => {
      const label = f.group === 'type' ? L(D.types[g.k]) : cuName(g.k), pr = g.ds.filter(d => !d.share).map(d => d.price);
      const head = html`<div className="dg-h" style=${{ marginBottom: 0 }}><h2 className="h3">${label}</h2><p className="meta"><span>${t('stat_dishes', { n: N(g.ds.length), p: N(new Set(g.ds.map(d => d.r)).size) })}${pr.length ? `, ${tk(Math.min(...pr))} ${t('to')} ${tk(Math.max(...pr))}` : ''}</span><a className="link" href="#" onClick=${ev => { ev.preventDefault(); if (f.group === 'type') pickType(g.k); else { setF({ ...f, cu: g.k }); toTop(); } }}>${t('see_all')}<${I} n="arrow-right" b /></a></p></div>`;
      return html`<section key=${g.k} className="dgroup"><${RailX} head=${head} cls="dc-rail">${g.ds.map(d => html`<${DCard} key=${d.r + d.id} d=${d} />`)}<//></section>`;
    });
  }
  return html`<div>
    <div className="dh"><div className="wrap"><div className="dh-in">
      <div><${AnimatePresence} mode="wait" initial=${false}><${motion.h1} key=${title} className="h1" initial=${{ opacity: 0, y: 12 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0, y: -8 }} transition=${{ duration: 0.3, ease: EASE }}>${title}<//><//><p className="sub">${sub}</p></div>
      ${pic ? html`<${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${pic} className="dh-plate" initial=${{ opacity: 0, rotate: -40, scale: 0.85 }} animate=${{ opacity: 1, rotate: 0, scale: 1 }} exit=${{ opacity: 0, rotate: 30, scale: 0.9 }} transition=${{ duration: 0.6, ease: EASE }}><img src=${src(pic, 560)} alt="" /><//><//>` : null}
      ${panel ? html`<${PricePanel} solo=${solo} />` : null}
    </div></div></div>
    <div className="tb" ref=${tbRef}><div className="wrap">
      <div className="crail" role="tablist" aria-label=${t('categories')}><button className=${clsx('cr', !f.type && 'on')} onClick=${() => pickType('')}>${!f.type ? html`<${Pill} id="crail" />` : null}<span className="cr-ph"><${I} n="squares-four" /></span>${t('all_food')}</button>${order.map(id => { const p = typePic(id), on = f.type === id; return html`<button key=${id} className=${clsx('cr', on && 'on')} role="tab" aria-selected=${on} onClick=${() => pickType(id)}>${on ? html`<${Pill} id="crail" />` : null}<span className="cr-ph">${p ? html`<img src=${src(p, 96)} alt="" loading="lazy" />` : html`<${I} n=${D.types[id].i || 'fork-knife'} />`}</span>${L(D.types[id])}</button>`; })}</div>
      <div className="tb-row">
        <label className="tb-q"><${I} n="magnifying-glass" /><input type="search" value=${f.q || ''} onChange=${ev => setF({ ...f, q: ev.target.value })} placeholder=${t('dish_search')} aria-label=${t('dish_search')} /></label>
        <${Choose} icon="map-pin" label=${areaLabel} on=${!!(f.area || f.city)} title=${t('area')} opts=${areaOpts} value=${areaVal} onPick=${v => setF({ ...f, area: v.startsWith('a:') ? v.slice(2) : '', city: v.startsWith('c:') ? v.slice(2) : '' })} align="start" />
        <${Choose} icon="money" label=${f.max ? t('dish_upto', { v: tk(f.max) }) : t('any_price')} on=${!!f.max} title=${t('max_price')} opts=${[['', t('any_price')], ...caps.map(v => [String(v), t('dish_upto', { v: tk(v) })])]} value=${String(f.max || '')} onPick=${v => setF({ ...f, max: v })} align="start" />
        ${[['veg', 'leaf', t('veg')], ['mild', 'pepper', t('mild')], ['open', 'clock', t('q_open')]].map(([k, ic, l]) => html`<button key=${k} className=${clsx('tb-btn', f[k] && 'on')} aria-pressed=${!!f[k]} onClick=${() => setF({ ...f, [k]: f[k] ? '' : '1' })}><${I} n=${ic} />${l}</button>`)}
        <span className="sp" />
        <${Seg} id="dmode" items=${[['grid', html`<${I} n="squares-four" />${tx('photos_v')}`], ['prices', html`<${I} n="list-numbers" />${tx('price_list')}`]]} value=${f.mode} onChange=${v => setF({ ...f, mode: v, sort: v === 'prices' ? 'price' : f.sort })} />
        ${!f.type && f.mode !== 'prices' ? html`<${Seg} id="dgroup" items=${[['cu', t('by_cuisine')], ['type', t('by_dish')]]} value=${f.group} onChange=${v => setF({ ...f, group: v })} />` : null}
        <${Choose} icon="sort-ascending" label=${(SORTS('dishes').find(z => z[0] === f.sort) || SORTS('dishes')[0])[1]} title=${t('sort')} opts=${SORTS('dishes')} value=${f.sort} onPick=${v => setF({ ...f, sort: v })} />
      </div>
    </div></div>
    <div className="tbm-w"><${AnimatePresence}>${stuck ? html`<${motion.div} key="m" className="tb-mini" initial=${{ y: -14, opacity: 0 }} animate=${{ y: 0, opacity: 1 }} exit=${{ y: -14, opacity: 0 }} transition=${{ duration: 0.25, ease: EASE }}><div className="wrap">
      <span className="tbm-cat">${pic ? html`<img src=${src(pic, 80)} alt="" />` : html`<${I} n="squares-four" />`}${title}</span>
      <div className="tbm-chips">${chipsOf({ ...f, type: '' }).map(c => html`<button key=${c.k + c.v} className="chip sm on" onClick=${() => setF(dropChip(f, c))}>${c.label}<${I} n="x" b /></button>`)}${f.mode === 'prices' ? html`<span className="chip sm">${tx('price_list')}</span>` : null}</div>
      <button className="tb-btn" onClick=${() => tbRef.current && tbRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })}><${I} n="sliders-horizontal" />${t('filters')}${countAll(f, ['type']) ? html`<span className="cnt">${N(countAll(f, ['type']))}</span>` : null}</button>
    </div><//>` : null}<//></div>
    <div className="wrap">
      ${countAll(f, ['q', 'type']) ? html`<div className="act" style=${{ marginTop: 18 }}>${chipsOf({ ...f, type: '', q: '' }).map(c => html`<button key=${c.k + c.v} className="chip on" onClick=${() => setF(dropChip(f, c))}>${c.label}<${I} n="x" b /></button>`)}<button className="link" onClick=${() => setF({ ...DF0(), group: f.group, mode: f.mode, type: f.type })}>${t('clear_all')}</button></div>` : null}
      <${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${(f.type || 'all') + (f.cu || '') + f.mode + f.group} initial=${{ opacity: 0, y: 12 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0 }} transition=${{ duration: 0.28, ease: EASE }}>${body}<//><//>
    </div>
  </div>`;
}

/* ================= DEALS (slider of the top deals, premium coupons, Premium partners first) ================= */
function Slider({ items }) {
  const [i, setI] = useState(0), [dir, setDir] = useState(1), [paused, setPaused] = useState(false), dragged = useRef(false), n = items.length;
  const go = (k, d) => { setDir(d); setI((k + n) % n); };
  useEffect(() => { if (paused || n < 2) return; const tm = setTimeout(() => go(i + 1, 1), 6000); return () => clearTimeout(tm); }, [i, paused, n]);
  if (!n) return null;
  const cur = items[Math.min(i, n - 1)];
  return html`<div className="slider" onMouseEnter=${() => setPaused(true)} onMouseLeave=${() => setPaused(false)}>
    <div className="slides"><${AnimatePresence} initial=${false} custom=${dir} mode="popLayout"><${motion.div} key=${cur.k} custom=${dir}
      variants=${{ enter: d => ({ x: d > 0 ? 60 : -60, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: d => ({ x: d > 0 ? -60 : 60, opacity: 0 }) }} initial="enter" animate="center" exit="exit" transition=${{ duration: 0.5, ease: EASE }}
      drag=${n > 1 ? 'x' : false} dragConstraints=${{ left: 0, right: 0 }} dragElastic=${0.18} onDragStart=${() => { dragged.current = true; }} onDragEnd=${(ev, info) => { if (info.offset.x < -70) go(i + 1, 1); else if (info.offset.x > 70) go(i - 1, -1); setTimeout(() => { dragged.current = false; }, 50); }}>
      <${Coupon} x=${cur} big onOpen=${ev => { if (!dragged.current) openRest(cur.r.id, ev.currentTarget.querySelector('.pic'), 'deals'); }} /><//><//></div>
    ${n > 1 ? html`<div className="slide-ctl"><button className="sl-b" aria-label=${t('prev')} onClick=${() => go(i - 1, -1)}><${I} n="caret-left" b /></button><div className="slide-dots">${items.map((it, k) => html`<button key=${it.k} onClick=${() => go(k, k > i ? 1 : -1)} aria-label=${L(it.d)} aria-current=${k === i}>${k === i ? html`<${motion.i} key=${'p' + i + (paused ? 'p' : 'r')} initial=${{ scaleX: 0 }} animate=${{ scaleX: paused ? 0.12 : 1 }} transition=${{ duration: paused ? 0.2 : 6, ease: 'linear' }} />` : k < i ? html`<i style=${{ transform: 'none' }} />` : null}</button>`)}</div><button className="sl-b" aria-label=${t('next')} onClick=${() => go(i + 1, 1)}><${I} n="caret-right" b /></button></div>` : null}
  </div>`;
}
function Deals() {
  const { order } = useApp(); const [city, setCity] = useState('all');
  const all = rankDeals(liveDeals(), order), prem = all.filter(z => z.r.plan === 'premium'), top = prem.length ? prem : all.slice(0, 5), list = all.filter(z => city === 'all' || z.r.city === city);
  return html`<div className="wrap">
    <div className="lh"><div><${Rise} as="h1" className="h1">${t('deals_title')}<//><${Rise} as="p" className="sub" d=${1}>${t('deals_sub')}<//></div></div>
    <${Rise} d=${1}><${Slider} items=${top} /><//>
    <section className="sec" style=${{ paddingTop: 72 }}>
      <div className="sec-head"><h2 className="h2">${t('all_deals')}</h2><div style=${{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}><${Seg} id="dcity" items=${[['all', t('all')], ['dhaka', L(D.cities.dhaka)], ['bogura', L(D.cities.bogura)]]} value=${city} onChange=${setCity} /></div></div>
      ${list.length ? html`<${motion.div} layout className="deal-grid"><${AnimatePresence} mode="popLayout" initial=${false}>${list.map(z => html`<${motion.div} key=${z.k} layout initial=${{ opacity: 0, scale: 0.97 }} animate=${{ opacity: 1, scale: 1 }} exit=${{ opacity: 0, scale: 0.97 }} transition=${{ duration: 0.32, ease: EASE }}><${Coupon} x=${z} /><//>`)}<//><//>` : html`<div className="empty"><${I} n="tag" /><b>${t('no_deals')}</b></div>`}
      <p className="meta" style=${{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'flex-start' }}><${I} n="info" />${t('deal_note')} ${tx('sample_code')}</p>
    </section>
  </div>`;
}
function SortRow({ id, cls, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return html`<div ref=${setNodeRef} className=${clsx(cls, isDragging && 'dragging')} style=${{ transform: CSS.Transform.toString(transform), transition }}>${children({ ...attributes, ...listeners })}</div>`;
}
/* khabo team only: the order of deals. Premium always first, then Pro, then Starter; drag inside each plan.
   On the main site it opens inside the admin panel (Deal order) and at #/admin/deals. */
function DealOrder() {
  const { set, order } = useApp();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const all = rankDeals(liveDeals(), order), groups = ['premium', 'pro', 'starter'].map(p => ({ p, items: all.filter(z => z.r.plan === p) })).filter(g => g.items.length);
  const save = o => { set({ order: o }); try { localStorage.setItem('khabo.dealOrder', JSON.stringify(o)); } catch (er) { /* private window */ } };
  const end = p => ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const g = groups.find(z => z.p === p).items, moved = arrayMove(g, g.findIndex(z => z.k === active.id), g.findIndex(z => z.k === over.id));
    save(groups.flatMap(z => z.p === p ? moved : z.items).map(z => z.k)); toast.success('New order is live on the Deals page.');
  };
  return html`<div className="wrap" style=${{ maxWidth: 860 }}>
    <div className="lh"><div><h1 className="h1" style=${{ fontSize: 'clamp(34px,4vw,48px)' }}>Deal order</h1><p className="sub">Premium partners always come first, then Pro, then Starter. Drag a deal to change its place inside its plan. Diners see this order on the Deals page and on Home.</p></div>
      ${order.length ? html`<button className="btn btn-line" onClick=${() => { save([]); toast('Back to the default order.'); }}><${I} n="arrow-counter-clockwise" b />Default order</button>` : null}</div>
    <div style=${{ marginTop: 26 }}>${groups.map(g => html`<div key=${g.p} className="ro-g"><h4>${PLAN_N[g.p].en} · ${g.items.length} deal${g.items.length === 1 ? '' : 's'}</h4><${DndContext} sensors=${sensors} collisionDetection=${closestCenter} onDragEnd=${end(g.p)}><${SortableContext} items=${g.items.map(z => z.k)} strategy=${verticalListSortingStrategy}>${g.items.map((z, i) => html`<${SortRow} key=${z.k} id=${z.k} cls="ro-row">${h => html`<button className="handle" ...${h} aria-label=${'Move ' + z.d.en}><${I} n="dots-six-vertical" b /></button><${Pic} id=${z.d.p} w=${100} tone=${z.r.theme} icon="tag" /><span style=${{ minWidth: 0 }}><b>${i + 1}. ${z.d.en}</b><small>${z.r.name.en}, ${areaOf(z.r.area).en}${z.d.week ? ' · Deal of the week' : ''}</small></span><${Tk} v=${z.d.price} />`}<//>`)}<//><//></div>`)}</div>
  </div>`;
}

/* ================= PRICE TRACKER (D-9) =================
   Only real saved price changes: the demo log in data/prices.js plus every change saved in the panels.
   Menu prices only. An area average only when 3 or more restaurants have the dish. Featured gets no special place. */
const DAYMS = 864e5, NOWT = Date.now();
let HIST = null;
const savedHist = () => HIST || (HIST = readDB().hist || {});
const addHist = (r, d, was, v) => { const db = readDB(), k = r.id + '|' + d.id; db.hist = db.hist || {}; const h = db.hist[k] = db.hist[k] || []; if (!h.length) h.push({ at: Date.now() - 1, v: was, who: 'Before' }); h.push({ at: Date.now(), v, who: 'Restaurant owner' }); writeDB(db); HIST = null; };
const logOf = d => {
  const base = ((K.priceLog || {})[d.r + '|' + d.id] || [['2026-05-16', d.price]]).map(([dt, v]) => ({ at: +new Date(dt + 'T12:00:00'), v }));
  const pts = base.concat((savedHist()[d.r + '|' + d.id] || []).filter(z => z.who !== 'Before').map(z => ({ at: z.at, v: z.v }))).sort((a, b) => a.at - b.at);
  if (pts[pts.length - 1].v !== d.price) pts.push({ at: NOWT, v: d.price });
  return pts;
};
const priceAt = (pts, at) => { let v = pts[0].v; for (const z of pts) if (z.at <= at) v = z.v; return v; };
const daysAgo = at => { const n = Math.max(0, Math.floor((NOWT - at) / DAYMS)); return n < 1 ? tx('d_today') : tx('d_ago', { n: N(n) }); };
const toPrices = f => { S().set({ pf: { ...S().pf, ...f, tab: f.tab || 'track' } }); S().go('prices'); };
const LINE_C = ['#0C5A3E', '#C2410C', '#2563EB', '#9333EA', '#DB2777', '#0891B2', '#A16207', '#4B5563', '#059669', '#B91C1C', '#7C3AED', '#0E7490'];
const inScope = (r, f) => (!f.area || r.area === f.area) && (!f.city || r.city === f.city);
const Arrow = ({ v }) => v > 0 ? html`<span className="pch up"><${I} n="arrow-up" b />${tk(v)}</span>` : v < 0 ? html`<span className="pch down"><${I} n="arrow-down" b />${tk(-v)}</span>` : html`<span className="pch same">${tk(0)}</span>`;
function PriceTip({ active, payload, label, names }) {
  if (!active || !payload || !payload.length) return null;
  const rows = payload.filter(z => z.value != null).sort((a, b) => b.value - a.value).slice(0, 9);
  return html`<div className="tt"><b>${label}</b>${rows.map(z => html`<div key=${z.dataKey} className="tt-r"><i style=${{ background: z.stroke }} />${z.dataKey === 'avg' ? tx('pt_avg') : names[z.dataKey]}<span>${tk(z.value)}</span></div>`)}</div>`;
}
function Tracker() {
  const { pf, set } = useApp(); const setP = o => set({ pf: { ...pf, ...o } });
  const [q, setQ] = useState(''), [hl, setHl] = useState(null);
  const order = D.cravings.concat(Object.keys(D.types).filter(id => !D.cravings.includes(id))).filter(id => allDishes().some(d => d.type === id));
  const qq = norm(q), hits = qq ? order.filter(id => norm(D.types[id].en + ' ' + D.types[id].bn).includes(qq) || allDishes().some(d => d.type === id && norm(d.name.en + ' ' + d.name.bn).includes(qq))) : order;
  const ty = D.types[pf.type] ? pf.type : order[0];
  const ds = allDishes().filter(d => d.type === ty && !d.share && inScope(RR(d.r), pf)).sort((a, b) => a.price - b.price);
  const series = ds.map((d, i) => ({ d, r: RR(d.r), key: d.r + '|' + d.id, color: LINE_C[i % LINE_C.length], lg: logOf(d) }));
  const showAvg = new Set(ds.map(d => d.r)).size >= 3;
  const ticks = Array.from({ length: 27 }, (_, i) => NOWT - (26 - i) * 7 * DAYMS);
  const data = ticks.map(at => { const o = { t: dm(new Date(at)) }; let sum = 0; series.forEach(z => { o[z.key] = priceAt(z.lg, at); sum += o[z.key]; }); if (showAvg) o.avg = Math.round(sum / series.length); return o; });
  const names = Object.fromEntries(series.map(z => [z.key, `${L(z.d.name)}, ${L(z.r.name)}`]));
  const areaOpts = [['', t('anywhere')], ...['dhaka', 'bogura'].flatMap(c => [[c + 'h', L(D.cities[c]), true], ['c:' + c, t('all_of', { c: L(D.cities[c]) })], ...D.areas.filter(a => a.city === c).map(a => ['a:' + a.id, L(a)])])];
  const areaLabel = pf.area ? L(areaOf(pf.area)) : pf.city ? L(D.cities[pf.city]) : t('anywhere');
  /* this month: biggest moves in the city */
  const city = pf.city || (pf.area && areaOf(pf.area).city) || 'dhaka';
  const moves = allDishes().filter(d => !d.share && RR(d.r).city === city).map(d => { const lg = logOf(d); return { d, r: RR(d.r), was: priceAt(lg, NOWT - 30 * DAYMS), v: d.price }; }).map(z => ({ ...z, ch: z.v - z.was })).filter(z => z.ch);
  const rises = moves.filter(z => z.ch > 0).sort((a, b) => b.ch - a.ch).slice(0, 5), drops = moves.filter(z => z.ch < 0).sort((a, b) => a.ch - b.ch).slice(0, 5);
  const moveRow = z => html`<button key=${z.d.r + z.d.id} className="mv-r" onClick=${ev => openDish(z.r.id, z.d.id, null)}><${Mono} r=${z.r} /><span><b>${L(z.d.name)}</b><small>${L(z.r.name)}, ${L(areaOf(z.r.area))}</small></span><span className="mv-p"><s>${tk(z.was)}</s> <${Tk} v=${z.v} /></span><${Arrow} v=${z.ch} /></button>`;
  return html`<div>
    <div className="pt-tools">
      <div className="pt-q"><label className="tb-q"><${I} n="magnifying-glass" /><input type="search" value=${q} onChange=${ev => setQ(ev.target.value)} onKeyDown=${ev => { if (ev.key === 'Enter' && hits[0]) { setP({ type: hits[0] }); setQ(''); } }} placeholder=${tx('pt_search')} aria-label=${tx('pt_search')} /></label>
        <${Choose} icon="map-pin" label=${areaLabel} on=${!!(pf.area || pf.city)} title=${t('area')} opts=${areaOpts} value=${pf.area ? 'a:' + pf.area : pf.city ? 'c:' + pf.city : ''} onPick=${v => setP({ area: v.startsWith('a:') ? v.slice(2) : '', city: v.startsWith('c:') ? v.slice(2) : '' })} align="start" /></div>
      ${hits.length ? html`<div className="pt-types">${hits.map(id => html`<button key=${id} className=${clsx('chip sm', id === ty && 'on')} onClick=${() => { setP({ type: id }); setQ(''); }}>${L(D.types[id])}</button>`)}</div>` : html`<p className="meta" style=${{ marginTop: 12 }}>${tx('pt_none', { q })}</p>`}
    </div>
    ${series.length ? html`<${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${ty + pf.area + pf.city} initial=${{ opacity: 0, y: 10 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0 }} transition=${{ duration: 0.3, ease: EASE }}>
      <div className="card pt-card"><div className="card-h"><h2>${tx('pt_chart', { d: L(D.types[ty]) })}</h2><span>${t('stat_dishes', { n: N(ds.length), p: N(new Set(ds.map(d => d.r)).size) })}</span></div>
        <div className="pt-chart"><${ResponsiveContainer} width="100%" height="100%"><${LineChart} data=${data} margin=${{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <${CartesianGrid} vertical=${false} stroke="var(--line)" />
          <${XAxis} dataKey="t" tickLine=${false} axisLine=${false} tick=${{ fill: 'var(--ink-3)', fontSize: 12 }} interval=${5} />
          <${YAxis} tickLine=${false} axisLine=${false} tick=${{ fill: 'var(--ink-3)', fontSize: 12 }} width=${56} tickFormatter=${v => '৳' + N(v)} domain=${['auto', 'auto']} />
          <${Tooltip} content=${html`<${PriceTip} names=${names} />`} cursor=${{ stroke: 'var(--line-2)' }} />
          ${series.map(z => html`<${Line} key=${z.key} type="stepAfter" dataKey=${z.key} stroke=${z.color} strokeWidth=${hl === z.key ? 3 : 2} strokeOpacity=${hl && hl !== z.key ? 0.18 : 0.95} dot=${false} animationDuration=${900} />`)}
          ${showAvg ? html`<${Line} type="monotone" dataKey="avg" stroke="var(--ink)" strokeWidth=${4.5} strokeOpacity=${hl ? 0.35 : 1} dot=${false} animationDuration=${1100} />` : null}
        <//><//></div>
        <p className="meta pt-note">${showAvg ? html`<span className="pt-key"><i />${tx('pt_avg')}</span>` : tx('pt_avg_need')}</p>
        <div className="pt-list"><div className="pt-lh"><span /><span>${t('nav_restaurants')}</span><span>${tx('pt_now')}</span><span>${tx('pt_3m')}</span><span>${tx('pt_change')}</span></div>
          ${series.map(z => { const was = priceAt(z.lg, NOWT - 91 * DAYMS), last = z.lg.length > 1 ? z.lg[z.lg.length - 1].at : z.lg[0].at; return html`<button key=${z.key} className=${clsx('pt-row', hl === z.key && 'hl')} onMouseEnter=${() => setHl(z.key)} onMouseLeave=${() => setHl(null)} onFocus=${() => setHl(z.key)} onBlur=${() => setHl(null)} onClick=${() => openDish(z.r.id, z.d.id, null)}>
            <i className="pt-dot" style=${{ background: z.color }} /><span className="pt-n"><b>${L(z.r.name)}</b><small>${L(z.d.name)} · ${L(areaOf(z.r.area))} · ${tx('pt_upd', { n: daysAgo(last) })}</small></span><${Tk} v=${z.d.price} /><span className="pt-was">${tk(was)}</span><${Arrow} v=${z.d.price - was} /></button>`; })}</div>
        <p className="meta pt-note"><${I} n="info" />${tx('pt_rule')} ${tx('demo_hist')}</p>
      </div><//><//>` : html`<div className="card empty"><${I} n="chart-line" /><b>${tx('pt_empty')}</b></div>`}
    <section className="sec" style=${{ paddingTop: 56 }}><div className="sec-head"><h2 className="h2">${tx('pt_month', { c: L(D.cities[city]) })}</h2><${Seg} id="ptcity" items=${[['dhaka', L(D.cities.dhaka)], ['bogura', L(D.cities.bogura)]]} value=${city} onChange=${v => setP({ city: v, area: '' })} /></div>
      <div className="mv-g"><div className="card"><div className="card-h"><h2><${I} n="trend-up" b /> ${tx('pt_rises')}</h2></div>${rises.length ? rises.map(moveRow) : html`<p className="meta">${tx('pt_norises')}</p>`}</div>
        <div className="card"><div className="card-h"><h2><${I} n="trend-down" b /> ${tx('pt_drops')}</h2></div>${drops.length ? drops.map(moveRow) : html`<p className="meta">${tx('pt_nodrops')}</p>`}</div></div></section>
  </div>`;
}
/* the monthly Food Price Index, with a share image drawn from the same numbers */
function indexRows(city) {
  const eom = k => k ? new Date(new Date().getFullYear(), new Date().getMonth() - k + 1, 0, 23).getTime() : NOWT;
  return D.cravings.concat(Object.keys(D.types).filter(id => !D.cravings.includes(id))).map(id => {
    const ds = allDishes().filter(d => d.type === id && !d.share && RR(d.r).city === city); if (new Set(ds.map(d => d.r)).size < 3) return null;
    const avg = k => Math.round(ds.reduce((s, d) => s + priceAt(logOf(d), eom(k)), 0) / ds.length);
    return { id, n: new Set(ds.map(d => d.r)).size, now: avg(0), lm: avg(1), m6: avg(5) };
  }).filter(Boolean);
}
const monthName = () => new Date().toLocaleDateString(LANG === 'bn' ? 'bn-BD' : 'en-GB', { month: 'long', year: 'numeric' });
function shareCanvas(rows, city) {
  const c = document.createElement('canvas'), W = 1080, H = 1350; c.width = W; c.height = H; const g = c.getContext('2d');
  const font = (w, sz) => `${w} ${sz}px Figtree, "Noto Sans Bengali", sans-serif`;
  g.fillStyle = '#0B3B29'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#F4B91A'; g.fillRect(0, 0, W, 14);
  g.fillStyle = '#F4F1E6'; g.font = font(800, 76); g.fillText(tx('pi_title'), 80, 170);
  g.fillStyle = 'rgba(244,241,230,.74)'; g.font = font(500, 34); g.fillText(`${L(D.cities[city])} · ${monthName()}`, 80, 228);
  const top = rows[0];
  if (top) {
    g.fillStyle = 'rgba(244,241,230,.74)'; g.font = font(600, 36); g.fillText(tx('pi_avg', { d: L(D.types[top.id]).toLowerCase() }), 80, 340);
    g.fillStyle = '#F4B91A'; g.font = font(800, 170); g.fillText(tk(top.now), 74, 500);
    const ch = top.now - top.lm; g.fillStyle = ch > 0 ? '#F0745F' : ch < 0 ? '#4CC88F' : 'rgba(244,241,230,.74)'; g.font = font(700, 40); g.fillText(tx('pi_vs', { v: (ch > 0 ? '▲ ' : ch < 0 ? '▼ ' : '') + tk(Math.abs(ch)) }), 80, 570);
  }
  let y = 690; rows.slice(1, 8).forEach(z => {
    g.fillStyle = 'rgba(244,241,230,.12)'; g.fillRect(80, y - 52, W - 160, 2);
    g.fillStyle = '#F4F1E6'; g.font = font(700, 40); g.fillText(L(D.types[z.id]), 80, y);
    g.textAlign = 'right'; g.font = font(800, 42); g.fillText(tk(z.now), W - 260, y);
    const ch = z.now - z.lm; g.fillStyle = ch > 0 ? '#F0745F' : ch < 0 ? '#4CC88F' : 'rgba(244,241,230,.6)'; g.font = font(700, 32); g.fillText((ch > 0 ? '▲ ' : ch < 0 ? '▼ ' : '') + tk(Math.abs(ch)), W - 80, y); g.textAlign = 'left'; y += 86;
  });
  g.fillStyle = 'rgba(244,241,230,.6)'; g.font = font(500, 28); g.fillText(LANG === 'bn' ? 'মেনুর দাম, ভ্যাট আর সার্ভিসের আগে' : 'Menu prices, before VAT and service', 80, H - 90);
  g.fillStyle = '#F4F1E6'; g.font = font(800, 44); g.textAlign = 'right'; g.fillText('khabo', W - 80, H - 86); g.textAlign = 'left';
  return c;
}
function PriceIndex() {
  const { pf, set } = useApp(); const city = pf.city || (pf.area && areaOf(pf.area).city) || 'dhaka';
  const rows = indexRows(city), [img, setImg] = useState(null);
  useEffect(() => { setImg(rows.length ? shareCanvas(rows, city).toDataURL('image/png') : null); }, [city, LANG, rows.length]);
  const share = async () => { const c = shareCanvas(rows, city); c.toBlob(async b => { const f = new File([b], 'khabo-kacchi-report.png', { type: 'image/png' }); try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: tx('pi_title') }); return; } } catch (er) { return; } const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'khabo-kacchi-report.png'; a.click(); }); };
  const top = rows[0];
  return html`<div>
    <div className="sec-head"><div><h2 className="h2">${tx('pi_title')}</h2><p className="sub">${tx('pi_sub', { c: L(D.cities[city]), m: monthName() })}</p></div><${Seg} id="picity" items=${[['dhaka', L(D.cities.dhaka)], ['bogura', L(D.cities.bogura)]]} value=${city} onChange=${v => set({ pf: { ...pf, city: v, area: '' } })} /></div>
    ${rows.length ? html`<div className="pi">
      <div className="pi-main">
        <div className="pi-hero"><span>${tx('pi_avg', { d: L(D.types[top.id]).toLowerCase() })}</span><b><${Tk} v=${top.now} flow /></b><span><${Arrow} v=${top.now - top.lm} /> ${tx('pi_lm')} ${tk(top.lm)} · ${tx('pi_6m')} ${tk(top.m6)}</span></div>
        <div className="pi-t"><div className="pi-h"><span /><span>${tx('pt_now')}</span><span>${tx('pi_lm')}</span><span>${tx('pi_6m')}</span></div>
          ${rows.map((z, i) => html`<${motion.button} key=${z.id} className="pi-r" onClick=${() => set({ pf: { ...pf, type: z.id, tab: 'track' } })} initial=${{ opacity: 0, y: 8 }} animate=${{ opacity: 1, y: 0 }} transition=${{ delay: i * 0.04, duration: 0.3, ease: EASE }}><span><b>${L(D.types[z.id])}</b><small>${tx('pi_places', { n: N(z.n) })}</small></span><${Tk} v=${z.now} /><span><${Arrow} v=${z.now - z.lm} /></span><span><${Arrow} v=${z.now - z.m6} /></span><//>`)}</div></div>
      <div className="pi-share">${img ? html`<img src=${img} alt=${tx('pi_title')} />` : null}<div style=${{ display: 'flex', gap: 8 }}><button className="btn btn-pri" onClick=${share}><${I} n="share-network" />${tx('share_img')}</button>${img ? html`<a className="btn btn-line" href=${img} download="khabo-kacchi-report.png"><${I} n="download-simple" />${tx('dl_img')}</a>` : null}</div></div>
    </div>` : html`<div className="card empty"><${I} n="chart-bar" /><b>${tx('pi_none')}</b></div>`}
  </div>`;
}
function Prices() {
  const { pf, set } = useApp();
  return html`<div className="wrap">
    <div className="lh"><div><${Rise} as="h1" className="h1">${tx('pt_title')}<//><${Rise} as="p" className="sub" d=${1}>${tx('pt_sub')}<//></div>
      <${Seg} id="pttab" items=${[['track', tx('pt_tab1')], ['index', tx('pt_tab2')]]} value=${pf.tab} onChange=${v => set({ pf: { ...pf, tab: v } })} /></div>
    <div style=${{ marginTop: 26 }}><${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${pf.tab} initial=${{ opacity: 0, y: 10 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0 }} transition=${{ duration: 0.3, ease: EASE }}>${pf.tab === 'index' ? html`<${PriceIndex} />` : html`<${Tracker} />`}<//><//></div>
  </div>`;
}

/* ================= EVENTS (D-12) ================= */
const ETYPE = { music: [e('Live music', 'লাইভ মিউজিক'), 'music-notes'], match: [e('Match screening', 'খেলা দেখা'), 'television-simple'], iftar: [e('Iftar special', 'ইফতার স্পেশাল'), 'moon-stars'], festival: [e('Festival menu', 'উৎসবের মেনু'), 'confetti'], other: [e('Event', 'ইভেন্ট'), 'calendar-star'] };
const evS = ev => +new Date(ev.start), evE = ev => +new Date(ev.end);
const eventsOf = r => (r.events || []).filter(ev => evE(ev) > Date.now()).sort((a, b) => evS(a) - evS(b));
const allEvents = () => D.restaurants.flatMap(r => eventsOf(r).map(ev => ({ r, ev, k: r.id + '/' + ev.id }))).sort((a, b) => evS(a.ev) - evS(b.ev));
const evWhen = ev => {
  const s = new Date(ev.start), en = new Date(ev.end), loc = LANG === 'bn' ? 'bn-BD' : 'en-GB';
  const day = x => x.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' }), tm = x => x.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
  return s.toDateString() === en.toDateString() ? `${day(s)}, ${tm(s)} ${t('to')} ${tm(en)}` : `${day(s)} ${t('to')} ${day(en)}`;
};
function ECard({ x, place = true }) {
  const { r, ev } = x, ty = ETYPE[ev.type] || ETYPE.other, on = evS(ev) <= Date.now();
  return html`<${motion.article} className="evc" style=${{ '--rd': r.theme.deep, '--ra': r.theme.accent }} whileHover=${{ y: -4 }} transition=${{ duration: 0.25, ease: EASE }} onClick=${e2 => { if (place) openRest(r.id, e2.currentTarget.querySelector('.pic'), 'events'); }}>
    <${Pic} id=${ev.p} w=${700} tone=${r.theme} icon=${ty[1]} />
    <div className="evc-b"><h3>${L(ev)}</h3>
      <p className="evc-when"><${I} n=${ty[1]} />${L(ty[0])} · ${evWhen(ev)}${on ? html` · <b className="open">${tx('on_now')}</b>` : null}</p>
      ${ev.desc && L(ev.desc) ? html`<p className="evc-d">${L(ev.desc)}</p>` : null}
      <div className="evc-f">${place ? html`<span className="evc-by"><${Mono} r=${r} />${L(r.name)}, ${L(areaOf(r.area))}</span>` : html`<span />`}<span className="evc-p">${ev.price ? tx('entry', { v: tk(ev.price) }) : tx('free_entry')}</span></div></div>
  <//>`;
}
function REvents({ r }) {
  const list = eventsOf(r).map(ev => ({ r, ev, k: ev.id })); if (!list.length) return null;
  return html`<section className="sec" id="events"><${Rise} as="h2" className="rh2">${tx('events')}<//><div className="ev-g" style=${{ marginTop: 22 }}>${list.map(z => html`<${ECard} key=${z.k} x=${z} place=${false} />`)}</div></section>`;
}
function HomeEvents() {
  const { go } = useApp(); const list = allEvents(); if (!list.length) return null;
  return html`<section className="sec"><div className="wrap"><${RailX} head=${html`<${Rise} as="h2" className="h2">${tx('up_events')}<//>`} cls="ev-rail">${list.slice(0, 8).map(z => html`<${ECard} key=${z.k} x=${z} />`)}<//>
    <div style=${{ display: 'flex', justifyContent: 'center', marginTop: 24 }}><button className="btn btn-line" onClick=${() => go('events')}>${tx('all_events')}<${I} n="arrow-right" b /></button></div></div></section>`;
}
function Events() {
  const { ef, set } = useApp(); const setE = o => set({ ef: { ...ef, ...o } });
  const now = new Date(), day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const fri = day0 + ((5 - now.getDay() + 7) % 7) * DAYMS;   /* the weekend in Bangladesh is Friday and Saturday */
  const win = { today: [day0, day0 + DAYMS], week: [day0, day0 + 7 * DAYMS], weekend: [fri, fri + 2 * DAYMS], month: [day0, day0 + 30 * DAYMS] }[ef.date];
  const list = allEvents().filter(({ r, ev }) => inScope(r, ef) && (!ef.type || ev.type === ef.type) && (!win || (evS(ev) < win[1] && evE(ev) > win[0])));
  const areaOpts = [['', t('anywhere')], ...['dhaka', 'bogura'].flatMap(c => [[c + 'h', L(D.cities[c]), true], ['c:' + c, t('all_of', { c: L(D.cities[c]) })], ...D.areas.filter(a => a.city === c).map(a => ['a:' + a.id, L(a)])])];
  return html`<div className="wrap">
    <div className="lh"><div><${Rise} as="h1" className="h1">${tx('events')}<//><${Rise} as="p" className="sub" d=${1}>${tx('ev_sub')}<//></div></div>
    <div className="ev-tools"><${Seg} id="evdate" items=${[['any', tx('any_date')], ['today', tx('d_today_f')], ['weekend', tx('d_weekend')], ['week', tx('d_week')], ['month', tx('d_month')]]} value=${ef.date} onChange=${v => setE({ date: v })} />
      <${Choose} icon="map-pin" label=${ef.area ? L(areaOf(ef.area)) : ef.city ? L(D.cities[ef.city]) : t('anywhere')} on=${!!(ef.area || ef.city)} title=${t('area')} opts=${areaOpts} value=${ef.area ? 'a:' + ef.area : ef.city ? 'c:' + ef.city : ''} onPick=${v => setE({ area: v.startsWith('a:') ? v.slice(2) : '', city: v.startsWith('c:') ? v.slice(2) : '' })} align="start" /></div>
    <div className="chips" style=${{ marginTop: 12 }}><button className=${clsx('chip sm', !ef.type && 'on')} onClick=${() => setE({ type: '' })}>${tx('all_types')}</button>${Object.entries(ETYPE).map(([k, [lb, ic]]) => html`<button key=${k} className=${clsx('chip sm', ef.type === k && 'on')} onClick=${() => setE({ type: ef.type === k ? '' : k })}><${I} n=${ic} />${L(lb)}</button>`)}</div>
    ${list.length ? html`<${motion.div} layout className="ev-g" style=${{ marginTop: 24 }}><${AnimatePresence} mode="popLayout" initial=${false}>${list.map(z => html`<${motion.div} key=${z.k} layout initial=${{ opacity: 0, scale: 0.97 }} animate=${{ opacity: 1, scale: 1 }} exit=${{ opacity: 0, scale: 0.97 }} transition=${{ duration: 0.3, ease: EASE }}><${ECard} x=${z} /><//>`)}<//><//>`
      : html`<div className="empty"><${I} n="calendar-x" /><b>${tx('no_events')}</b><button className="btn btn-line" onClick=${() => set({ ef: { date: 'any', area: '', city: '', type: '' } })}>${t('clear_all')}</button></div>`}
  </div>`;
}

/* ================= RESTAURANT PAGE ================= */
/* the reading line: fills in the restaurant's accent as you read down, and a small plate rolls along it
   with a fork and knife that stay upright beside it (brought back from the classic page) */
const PLATE = `<svg class="pm-fork" viewBox="0 0 8 24"><path d="M1.2 1v6.2a2.8 2.8 0 0 0 2 2.7V23a.8.8 0 0 0 1.6 0V9.9a2.8 2.8 0 0 0 2-2.7V1M4 1v6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  + `<span class="pm-plate"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15.5" fill="#FBF8F2"/><circle cx="16" cy="16" r="11.6" fill="#F0EADF"/><circle cx="16" cy="16" r="11.6" fill="none" stroke="rgba(60,40,10,.12)" stroke-width=".8"/><path d="M10.6 17.4c0-3.5 2.6-6.1 5.9-6.1 3.1 0 5 2.2 5 4.8 0 3.3-2.8 5.4-6 5.4-2.9 0-4.9-1.6-4.9-4.1z" fill="#E39A2B"/><circle cx="14.3" cy="15.6" r="1.3" fill="#C2561E"/><circle cx="18.2" cy="17.9" r="1.1" fill="#C2561E"/><path d="M19.6 10.6c1.6-.9 3.2-.6 4.1.3-1 1.3-2.7 1.6-4.1-.3z" fill="#4E8B3A"/></svg></span>`
  + `<svg class="pm-knife" viewBox="0 0 8 24"><path d="M3.4 1C5.6 2.6 6.4 6 6.4 10.4c0 .6-.4 1-1 1H4.6V23a.8.8 0 0 1-1.6 0V1.6c0-.4.2-.6.4-.6z" fill="currentColor"/></svg>`;
function RProg() {
  const ref = useRef();
  useEffect(() => {
    const sc = scroller(), el = ref.current; if (!sc || !el) return; let raf = 0;
    const paint = () => { raf = 0; const max = sc.scrollHeight - sc.clientHeight, pr = max > 0 ? Math.min(1, Math.max(0, sc.scrollTop / max)) : 0, x = pr * (el.clientWidth - 48); el.style.setProperty('--p', pr.toFixed(4)); el.style.setProperty('--x', x.toFixed(1) + 'px'); el.style.setProperty('--rot', (x / (Math.PI * 20) * 360).toFixed(1) + 'deg'); el.classList.toggle('on', pr > 0.003); };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    sc.addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); paint();
    return () => { sc.removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return html`<div className="rp-prog-w" aria-hidden="true"><div ref=${ref} className="rp-prog"><i className="rp-prog-fill" /><span className="rp-prog-mark" dangerouslySetInnerHTML=${{ __html: PLATE }} /></div></div>`;
}
function Rest() {
  const { rid, jump, set } = useApp(); const r = RR(rid);
  useEffect(() => { if (jump) { const tm = setTimeout(() => { scrollToId(jump); set({ jump: null }); }, 650); return () => clearTimeout(tm); } }, [rid, jump]);
  return html`<div className="rp" data-font=${r.theme.font} style=${{ '--rd': r.theme.deep, '--ra': r.theme.accent }}>
    <${RProg} />
    <div className="wrap"><${Cover} r=${r} /><${Under} r=${r} /></div>
    <${RNav} r=${r} />
    <div className="wrap"><${Intro} r=${r} /></div>
    <${Signature} r=${r} />
    <div className="wrap"><${RDeals} r=${r} /><${REvents} r=${r} /><${RMenu} r=${r} /><${RTour} r=${r} /><${RKitchen} r=${r} /><${RPhotos} r=${r} /><${RReviews} r=${r} /><${RVisit} r=${r} /><${RMore} r=${r} /></div>
    <${BillPill} r=${r} /><${Dock} r=${r} />
  </div>`;
}
function Cover({ r }) {
  const v = useRef(); const [play, setPlay] = useState(true); const { set } = useApp();
  useEffect(() => { const el = v.current; if (!el) return; el.muted = true; el.defaultMuted = true; if (play) { const go = () => el.play().catch(() => { }); go(); el.addEventListener('canplay', go, { once: true }); } else el.pause(); }, [play, r.id]);
  const logo = r.brand && r.brand.logo ? K.restFile(r, r.brand.logo) : null;
  return html`<div className="cover">
    ${r.film ? html`<video ref=${v} key=${r.id} src=${r.film.src} poster=${src(r.film.poster, 1600)} muted loop playsInline autoPlay preload="auto" aria-hidden="true" />` : html`<${motion.img} src=${src(r.hero[0], 1600)} alt="" initial=${{ scale: 1.06 }} animate=${{ scale: 1 }} transition=${{ duration: 6, ease: 'easeOut' }} />`}
    ${r.film ? html`<div className="vctl"><button onClick=${() => setPlay(!play)} aria-label=${play ? tx('pause') : tx('play')}><${I} n=${play ? 'pause' : 'play'} f /></button><button onClick=${() => set({ film: { src: r.film.src, poster: r.film.poster, title: L(r.name), sub: `${t('film')} · ${t('captured')} ${L(r.mediaDate || D.updated)}` } })} aria-label=${tx('full_film')}><${I} n="speaker-high" f /></button></div>` : null}
    <${motion.div} className="plaq" initial="h" animate="s" variants=${{ h: { opacity: 0, y: 24, clipPath: 'inset(0 100% 0 0 round 20px)' }, s: { opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0 round 20px)', transition: { duration: 0.75, ease: SHEET, delay: 0.25, staggerChildren: 0.07, delayChildren: 0.5 } } }}>
      <${motion.span} className="plaq-logo" variants=${{ h: { opacity: 0, scale: 0.6, rotate: -10 }, s: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 360, damping: 20 } } }}>${logo ? html`<img src=${logo} alt="" />` : html`<b>${r.mono}</b>`}<//>
      <div style=${{ minWidth: 0 }}>
        <h1 className=${clsx(r.theme.font === 'serif' && LANG !== 'bn' && 'serif')} aria-label=${L(r.name)}>${L(r.name).split(/\s+/).map((w, i) => html`<span key=${i} className="pw" aria-hidden="true"><${motion.span} variants=${{ h: { y: '105%' }, s: { y: 0, transition: { duration: 0.7, ease: EASE } } }}>${w}<//></span>`)}</h1>
        <${motion.p} className="bnn" variants=${{ h: { opacity: 0, y: 8 }, s: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}>${LANG === 'bn' ? r.name.en : r.name.bn}<//>
        <${motion.i} className="plaq-rule" variants=${{ h: { scaleX: 0 }, s: { scaleX: 1, transition: { duration: 0.8, ease: EASE } } }} />
        <${motion.p} className="plaq-tag" variants=${{ h: { opacity: 0, y: 8 }, s: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}>${L(r.tagline)}<//>
      </div>
    <//></div>`;
}
function Under({ r }) {
  const { area, set } = useApp();
  const os = openState(r), a = areaOf(area), km = a.city === r.city ? distKm(LL[a.id], r.geo) : null;
  const labels = [r.featured ? t('featured') : '', r.founding ? t('founding') : ''].filter(Boolean);
  const fact = (b, small, go, cls, i) => html`<${motion.button} className="fact" onClick=${go ? () => scrollToId(go) : null} initial=${{ opacity: 0, y: 10 }} animate=${{ opacity: 1, y: 0 }} transition=${{ delay: 0.5 + i * 0.06, duration: 0.45, ease: EASE }}><b className=${cls}>${b}</b><small>${small}</small><//>`;
  return html`<div className="under"><div>
      <div className="facts">
        ${fact(html`<${I} n="star" f cls="star" />${N(r.rating)}`, t('n_reviews', { n: N(r.reviews) }), 'reviews', '', 0)}
        ${r.hidePpl ? null : fact(html`<${Tk} v=${r.ppl[0]} to=${r.ppl[1]} />`, t('per_person'), null, '', 1)}
        ${fact(os.open ? t('open_now') : t('closed_now'), os.label, 'info', os.open ? 'open' : 'closed', 2)}
        ${fact(L(r.spot), km != null ? tx('km', { v: dg(km < 10 ? km.toFixed(1) : Math.round(km)) }) : where(r), 'info', '', 3)}
      </div>
      ${labels.length ? html`<p className="meta" style=${{ marginTop: 12 }}>${where(r)} · ${labels.join(' · ')}</p>` : null}
    </div>
    <${motion.div} className="racts" initial=${{ opacity: 0, x: 14 }} animate=${{ opacity: 1, x: 0 }} transition=${{ delay: 0.55, duration: 0.5, ease: EASE }}>
      ${r.hasTour ? html`<button className="tour-b" onClick=${() => set({ tour: { rid: r.id } })}><span className="th"><img src=${src(`pv:${r.tour[0].pano}:a`, 300)} alt="" /><${I} n="virtual-reality" /></span><span><b>${t('step_inside')}</b><small>${tx('rooms_n', { n: N(r.tour.length) })}</small></span><${I} n="arrow-right" b cls="go" /></button>`
        : html`<button className="tour-b" onClick=${() => scrollToId('photos')}><span className="th"><img src=${src(r.hero[0], 300)} alt="" /><${I} n="images" /></span><span><b>${t('see_photos')}</b><small>${t('photos')}</small></span><${I} n="arrow-right" b cls="go" /></button>`}
      <div className="racts-2"><${ActBtns} r=${r} /></div>
    <//></div>`;
}
/* Call, Directions and Bill. There is only ever one set: beside the film, or (once that scrolls away) in the
   section bar. Both places share layout ids, so the same buttons slide up into the bar and back down. */
function ActBtns({ r, small, off }) {
  const set = useApp(s => s.set), items = useApp(s => Object.values(s.bill[r.id] || EMPTY).reduce((a, b) => a + b, 0));
  const c = cls => clsx('btn', cls, small && 'btn-sm'), tab = off ? -1 : 0;
  return html`<a className=${c('btn-line')} tabIndex=${tab} href=${'tel:' + r.phone}><${I} n="phone" />${t('call')}</a>
    <a className=${c('btn-line')} tabIndex=${tab} href=${mapUrl(r)} target="_blank" rel="noopener"><${I} n="navigation-arrow" />${t('directions')}</a>
    <button className=${c('btn-own')} tabIndex=${tab} onClick=${() => set({ billOpen: r.id })}><${I} n="receipt" />${t('bill')}${items ? html`<span className="bcount"><${Num} v=${items} /></span>` : null}</button>`;
}
function RNav({ r }) {
  const tabs = [['menu', t('menu')]]; if (r.hasTour) tabs.push(['inside', t('inside')]); if (r.hasKitchen) tabs.push(['kitchen', t('kitchen')]); if (photoCats(r).length) tabs.push(['photos', t('photos')]); tabs.push(['reviews', t('reviews')], ['info', t('visit_short')]);
  const [cur, setCur] = useState('menu'); const [docked, setDocked] = useState(false); const { set } = useApp(); const barRef = useRef(), first = useRef(true);
  /* Call and Bill sit beside the film; the bar shows its own copy only after those have scrolled away */
  /* dock once the buttons beside the film would slip under the header and this bar */
  /* as the three buttons beside the film reach this bar, they shrink and fly up into it; scrolling back, they grow back down.
     Only transform is animated (from where the big buttons are to where the small ones sit), so it stays smooth while scrolling */
  /* dock exactly when this bar sticks under the header */
  useEffect(() => { const sc = scroller(), nav = document.querySelector('.rnav'); if (!sc || !nav) return; let raf = 0; const top = () => parseFloat(getComputedStyle(nav).top) || 68; const on = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; setDocked(nav.getBoundingClientRect().top - (sc.getBoundingClientRect().top) <= top() + 0.5 && sc.scrollTop > 200); }); }; sc.addEventListener('scroll', on, { passive: true }); on(); return () => { sc.removeEventListener('scroll', on); cancelAnimationFrame(raf); }; }, [r.id]);
  useEffect(() => {
    const bar = barRef.current, src = document.querySelector('.racts-2'); if (!bar || !src) return;
    if (first.current) { first.current = false; return; }
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || getComputedStyle(bar).display === 'none';
    const bb = [...bar.children], sb = [...src.children];
    const fromOf = (b, i) => { const a = sb[i].getBoundingClientRect(), z = b.getBoundingClientRect(); return `translate(${a.left - z.left}px, ${a.top - z.top}px) scale(${a.width / z.width}, ${a.height / z.height})`; };
    bb.forEach(b => b.getAnimations().forEach(x => x.cancel()));
    if (docked) {
      src.classList.add('gone'); bar.classList.add('on');
      if (!still) bb.forEach((b, i) => b.animate([{ transform: fromOf(b, i) }, { transform: 'none' }], { duration: 420, delay: i * 30, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'backwards' }));
    } else {
      if (still) { bar.classList.remove('on'); src.classList.remove('gone'); return; }
      let n = bb.length; bb.forEach((b, i) => { const an = b.animate([{ transform: 'none' }, { transform: fromOf(b, i) }], { duration: 360, delay: (bb.length - 1 - i) * 25, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' }); an.onfinish = () => { if (--n === 0) { bar.classList.remove('on'); src.classList.remove('gone'); bb.forEach(x => x.getAnimations().forEach(y => y.cancel())); } }; });
    }
  }, [docked]);
  useEffect(() => { const sc = scroller(); if (!sc) return; const on = () => { let c = tabs[0][0]; tabs.forEach(([id]) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 220) c = id; }); setCur(c); }; sc.addEventListener('scroll', on, { passive: true }); return () => sc.removeEventListener('scroll', on); }, [r.id]);
  return html`<div className="rnav"><div className="wrap"><nav aria-label=${t('sections')}>${tabs.map(([id, l]) => html`<button key=${id} className=${cur === id ? 'on' : ''} onClick=${() => scrollToId(id)}>${l}${cur === id ? html`<${motion.span} layoutId="rnav-ul" className="ul" transition=${SPR} />` : null}</button>`)}</nav>
    <div ref=${barRef} className="r" aria-hidden=${!docked}><${ActBtns} r=${r} small off=${!docked} /></div></div></div>`;
}
const handleOf = (k, url) => { try { const p = new URL(url).pathname.split('/').filter(Boolean).pop() || ''; return p ? (k === 'facebook' ? p : '@' + p.replace(/^@/, '')) : ''; } catch (er) { return ''; } };
function Social({ r, compact }) {
  const s = r.social; if (!s || !s.links) return null;
  const keys = Object.keys(D.socials).filter(k => s.links[k] && s.links[k].url); if (!keys.length) return null;
  const main = keys.includes(s.main) ? s.main : keys[0], rest = keys.filter(k => k !== main), z = s.links[main], nw = D.socials[main];
  return html`<div className="social">${compact ? null : html`<span className="meta">${t('follow_r', { r: L(r.name) })}</span>`}
    <a className="soc-main" href=${z.url} target="_blank" rel="noopener nofollow"><${I} n=${nw.i} f /><span><b>${nw.en}</b><small>${[z.n ? t('followers', { n: z.n }) : '', handleOf(main, z.url)].filter(Boolean).join(' · ')}</small></span></a>
    ${rest.map(k => html`<a key=${k} className="circ" href=${s.links[k].url} target="_blank" rel="noopener nofollow" aria-label=${D.socials[k].en}><${I} n=${D.socials[k].i} /></a>`)}</div>`;
}
function Intro({ r }) {
  const os = openState(r);
  const rows = [[t('prices'), html`<span className="okl"><${I} n="check-circle" f />${checked(r.checked)}</span>`], [t('on_the_bill'), t('vat_plus', { v: N(r.vat), s: N(r.service) })], [t('hours'), `${os.from} ${t('to')} ${os.close}`], [t('seats'), `${N(r.seats)}${r.fac.includes('cabin') ? ', ' + t('has_cabins').toLowerCase() : ''}`], [t('address'), L(r.spot)], [t('since_label'), dg(r.since)]];
  return html`<section className="intro">
    <${Rise}><h2>${t('about_r', { r: L(r.name) })}</h2><p>${L(r.story)}</p>
      <div className="ints"><a className="btn btn-line btn-sm" href=${'tel:' + r.phone}><${I} n="phone" />${t('call')}</a><a className="btn btn-line btn-sm" href=${waUrl(r)} target="_blank" rel="noopener"><${I} n="whatsapp-logo" />WhatsApp</a><a className="btn btn-line btn-sm" href=${mapUrl(r)} target="_blank" rel="noopener"><${I} n="navigation-arrow" />${t('directions')}</a></div>
      <${Social} r=${r} /><//>
    <${Rise} d=${1} className="info">${rows.map(([a, b]) => html`<div key=${a}><small>${a}</small><b>${b}</b></div>`)}<//>
  </section>`;
}
function Signature({ r }) {
  const ds = r.signature.map(id => r.menu.find(d => d.id === id)).filter(Boolean); if (!ds.length) return null;
  return html`<section className="sig"><div className="wrap"><${RailX} head=${html`<${Rise} as="h2" className="rh2">${t('signature')}<//>`} cls="sig-rail">${ds.map((d, i) => html`<${motion.article} key=${d.id} className="sig-c" onClick=${ev => openDish(r.id, d.id, ev.currentTarget.querySelector('.pic'), true)} initial=${{ opacity: 0, y: 20 }} whileInView=${{ opacity: 1, y: 0 }} viewport=${{ once: true }} transition=${{ duration: 0.5, delay: i * 0.08, ease: EASE }}>
    <${Pic} id=${d.p} w=${760} alt=${L(d.name)} tone=${r.theme} icon=${(D.types[d.type] || {}).i} />
    <div className="row"><div style=${{ minWidth: 0 }}><b>${L(d.name)}</b><small>${L(d.por)}${d.d3 ? ' · ' + t('in_3d') : d.video ? ' · ' + t('has_video') : ''}</small></div><div style=${{ display: 'flex', alignItems: 'center', gap: 12 }}><${Tk} v=${d.price} /><${AddBtn} r=${r} d=${d} cls="add-r" /></div></div><//>`)}<//></div></section>`;
}
function RDeals({ r }) {
  const all = K.dealsOf(r).map((d, i) => ({ r, d, k: r.id + '/' + d.id, i })); if (!all.length) return null;
  if (all.length === 1) return html`<section className="sec" id="deals"><${Rise}><${Coupon} x=${all[0]} big place=${false} /><//></section>`;
  return html`<section className="sec" id="deals"><${RailX} head=${html`<h2 className="h3">${t('nav_deals')} <span className="meta" style=${{ fontWeight: 500 }}>${t('n_deals', { n: N(all.length) })}</span></h2>`} cls="cp-rail">${all.map(z => html`<${Coupon} key=${z.k} x=${z} place=${false} />`)}<//></section>`;
}
function RMenu({ r }) {
  const [q, setQ] = useState(''); const [cat, setCat] = useState(r.cats[0].id); useApp(s => s.ver);
  const qq = q.trim().toLowerCase(), hit = d => !qq || (d.name.en + ' ' + d.name.bn).toLowerCase().includes(qq);
  const jumpCat = id => { setCat(id); const el = document.getElementById('mc-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const groups = r.cats.map(c => ({ c, ds: r.menu.filter(d => d.cat === c.id && hit(d)) })).filter(g => g.ds.length);
  return html`<section className="sec" id="menu">
    <div className="menu-h"><div><${Rise} as="h2" className="rh2">${t('menu')}<//><p className="meta" style=${{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap' }}><span className="okl"><${I} n="check-circle" f />${checked(r.checked)}</span><span>${t('menu_note', { v: N(r.vat), s: N(r.service) })}</span></p></div>
      <label className="tb-q"><${I} n="magnifying-glass" /><input type="search" value=${q} onChange=${ev => setQ(ev.target.value)} placeholder=${t('search_menu')} aria-label=${t('search_menu')} /></label></div>
    <div className="mtools"><div className="mcats">${r.cats.map(c => html`<button key=${c.id} className=${cat === c.id ? 'on' : ''} onClick=${() => jumpCat(c.id)}>${cat === c.id ? html`<${Pill} id="mcat" />` : null}${L(c)}<em>${N(r.menu.filter(d => d.cat === c.id).length)}</em></button>`)}</div></div>
    ${groups.length ? groups.map(({ c, ds }) => html`<div key=${c.id} id=${'mc-' + c.id} className="mgrp"><h3 className="mcat-h">${L(c)}</h3><div className="mlist">${ds.map((d, i) => html`<${motion.article} key=${d.id} className=${clsx('mi', d.out && 'is-out')} tabIndex="0" onClick=${ev => openDish(r.id, d.id, ev.currentTarget.querySelector('.pic'), true)} onKeyDown=${ev => ev.key === 'Enter' && openDish(r.id, d.id, null, true)} initial=${{ opacity: 0, y: 12 }} whileInView=${{ opacity: 1, y: 0 }} viewport=${{ once: true }} transition=${{ duration: 0.4, delay: (i % 2) * 0.05, ease: EASE }}>
      <div style=${{ minWidth: 0 }}><b>${L(d.name)}</b>${d.best ? html`<span className="best">${t('best_seller')}</span>` : null}<div className="bnl">${LANG === 'bn' ? d.name.en : d.name.bn}</div>
        <div className="srv">${L(d.por)}${d.spice ? html` · <${Spice} n=${d.spice} />` : null}${d.veg ? html` · <span className="veg"><${I} n="leaf" f />${t('veg')}</span>` : null}</div>
        ${d.desc ? html`<p>${L(d.desc)}</p>` : null}
        <div className="pr"><${Tk} v=${d.price} />${d.d3 ? html`<span className="tagm"><${I} n="cube" />3D</span>` : null}${d.video ? html`<span className="tagm"><${I} n="play" f />${t('video')}</span>` : null}</div></div>
      ${d.p ? html`<div className="mi-ph"><${Pic} id=${d.p} w=${260} /><${AddBtn} r=${r} d=${d} /></div>` : html`<div className="mi-add"><${AddBtn} r=${r} d=${d} /></div>`}<//>`)}</div></div>`) : html`<p className="meta" style=${{ marginTop: 24 }}>${t('menu_none')}</p>`}
  </section>`;
}
function RTour({ r }) {
  const [room, setRoom] = useState(r.hasTour ? r.tour[0].id : null); const { set } = useApp();
  if (!r.hasTour) return null;
  const rm = r.tour.find(z => z.id === room) || r.tour[0];
  return html`<section className="sec" id="inside"><${Rise} as="h2" className="rh2">${t('step_inside')}<//><p className="sub">${t('tour_sub', { d: L(r.mediaDate || D.updated) })}</p>
    <div style=${{ position: 'relative', marginTop: 22 }}><${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${rm.pano} initial=${{ opacity: 0, scale: 1.02 }} animate=${{ opacity: 1, scale: 1 }} exit=${{ opacity: 0 }} transition=${{ duration: 0.35, ease: EASE }}><${Pano} pano=${rm.pano} /><//><//><button className="btn btn-glass full-b" onClick=${() => set({ tour: { rid: r.id, room: rm.id } })}><${I} n="corners-out" b />${t('full_screen')}</button></div>
    ${r.tour.length > 1 ? html`<div className="rooms">${r.tour.map(z => html`<button key=${z.id} className=${clsx('room', z.id === rm.id && 'on')} onClick=${() => setRoom(z.id)}>${z.id === rm.id ? html`<${Pill} id="room" />` : null}<img src=${`${K.panoDir(z.pano)}${z.pano}-a.jpg`} alt="" loading="lazy" />${L(z)}</button>`)}</div>` : null}
  </section>`;
}
function RKitchen({ r }) {
  const { set } = useApp(); if (!r.hasKitchen) return null;
  const k = r.kitchen, ph = (k.photos || []).slice(0, 2);
  return html`<section className="sec" id="kitchen"><${Rise} as="h2" className="rh2">${t('kitchen_title')}<//><p className="sub">${t('kitchen_sub')}</p>
    <div className=${clsx('kit', !ph.length && 'solo')}><${motion.button} whileHover=${{ scale: 1.005 }} onClick=${() => set({ film: { src: k.src, poster: k.poster, title: t('kitchen_of', { r: L(r.name) }), sub: L(k.date) } })}><img src=${src(k.poster, 1400)} alt="" /><span className="play"><${I} n="play" f /><span><b>${t('watch_kitchen')}</b><small>${L(k.date)}</small></span></span><//>
      ${ph.map((p, i) => html`<button key=${p} onClick=${() => set({ lb: { list: k.photos, i } })}><img src=${src(p, 700)} alt="" loading="lazy" /></button>`)}</div></section>`;
}
function RPhotos({ r }) {
  const cats = photoCats(r), [tab, setTab] = useState(cats.length ? cats[0][0] : null); const { set } = useApp();
  if (!cats.length) return null;
  const list = r.gallery[tab] || [], shown = list.length >= 5 ? 5 : list.length >= 3 ? 3 : list.length, more = list.length - shown;
  return html`<section className="sec" id="photos"><div className="sec-head"><div><${Rise} as="h2" className="rh2">${t('photos')}<//><p className="meta" style=${{ marginTop: 8 }}>${t('photos_date', { d: L(r.mediaDate || D.updated) })}</p></div><${Seg} id="ptab" items=${cats.map(([c, l]) => [c, l, N(r.gallery[c].length)])} value=${tab} onChange=${setTab} /></div>
    <${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${tab} className=${clsx('pg', 'n' + shown)} initial=${{ opacity: 0, y: 10 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0 }} transition=${{ duration: 0.3, ease: EASE }}>${list.slice(0, shown).map((p, i) => html`<button key=${p + i} className=${i === 0 ? 'big' : ''} onClick=${() => set({ lb: { list, i } })}><img src=${src(p, i === 0 ? 1200 : 600)} alt="" loading="lazy" />${i === shown - 1 && more > 0 ? html`<span className="more">+${N(more)}</span>` : null}</button>`)}<//><//></section>`;
}
const RVF = () => [['all', t('rv_all')], ['verified', t('verified_visit')], ['photos', t('with_photos')], ['bn', 'বাংলায়']];
const filterRv = (list, f) => f === 'verified' ? list.filter(v => v.vf) : f === 'photos' ? list.filter(v => v.pics) : f === 'bn' ? list.filter(v => /[ঀ-৿]/.test(v.t)) : list;
function RvCard({ v, r, clamp, flat }) {
  const [open, setOpen] = useState(false), long = v.t.length > 170, tone = avatarTone(v.who);
  return html`<${motion.article} className=${clsx('rvc', flat && 'flat')} layout initial=${{ opacity: 0, y: 14 }} whileInView=${{ opacity: 1, y: 0 }} viewport=${{ once: true }} transition=${{ duration: 0.45, ease: EASE }}>
    <header><span className="av" style=${{ '--d': tone[0], '--a': tone[1] }}>${initials(v.who)}</span><div><b>${v.who}</b><small>${L(v.when)}</small></div><span className="st" aria-label=${t('n_stars', { n: v.st })}><${Stars} n=${v.st} /></span></header>
    ${v.own ? html`<span className="vf pend"><${I} n="clock" />${t('rv_pending')}</span>` : v.vf ? html`<span className="vf"><${I} n="seal-check" f />${t('verified_visit')}</span>` : null}
    <p className=${clsx('txt', clamp && long && !open && 'clamp')}>${v.t}</p>
    ${clamp && long ? html`<button className="more-l" onClick=${() => setOpen(!open)}>${open ? tx('less') : tx('read_more')}</button>` : null}
    ${v.ord && v.ord.length ? html`<div className="ord"><small>${t('ordered')}</small>${v.ord.map(o => html`<span key=${o}>${o}</span>`)}</div>` : null}
    ${v.pics ? html`<div className="rv-pics">${v.pics.map(p => html`<${Pic} key=${p} id=${p} w=${200} />`)}</div>` : null}
    ${v.reply ? html`<div className="reply" style=${{ '--rpa': r.theme.accent, '--rpd': r.theme.deep }} aria-label=${t('reply_from', { r: L(r.name) })}><div className="reply-h"><${Mono} r=${r} /><span><b>${L(r.name)}</b><small><${I} n="seal-check" f />${tx('owner_reply')}</small></span></div><p>${L(v.reply)}</p></div>` : null}
  <//>`;
}
const needSign = then => { const st = S(); if (st.user) then(); else st.set({ signin: { then } }); };
function RReviews({ r }) {
  const { myRv, set } = useApp(); const [f, setF] = useState('all'), ds = dist(r.rating);
  const items = [...(f === 'all' ? myRv.filter(v => v.r === r.id).map(v => ({ ...v, own: true })) : []), ...filterRv(revOf(r.id), f)];
  return html`<section className="sec" id="reviews">
    <div className="sec-head"><${Rise} as="h2" className="rh2">${t('reviews')}<//><${Seg} id="rvf" items=${RVF()} value=${f} onChange=${setF} /></div>
    <div className="rvs">
      <${Rise} className="rv-sum">
        <div className="big"><b>${N(r.rating)}</b><div><div className="stars"><${Stars} n=${Math.round(r.rating)} /></div><p className="meta">${t('rv_counts', { n: N(r.reviews), v: N(r.verified) })}</p></div></div>
        <div className="dist">${ds.map((p, i) => html`<div key=${i}><span>${N(5 - i)} ★</span><span className="tr"><${motion.i} initial=${{ width: 0 }} whileInView=${{ width: p + '%' }} viewport=${{ once: true }} transition=${{ duration: 0.8, delay: i * 0.06, ease: EASE }} /></span><span>${N(p)}%</span></div>`)}</div>
        <button className="btn btn-own btn-lg" onClick=${() => needSign(() => S().set({ write: r.id }))}><${I} n="chat-circle-dots" />${t('write_review')}</button>
        <p className="meta">${t('verified_how')}</p>
      <//>
      <div className="rv-main">
        ${items.length ? html`<div className="rv-grid">${items.slice(0, 4).map((v, i) => html`<${RvCard} key=${v.who + i + f} v=${v} r=${r} clamp />`)}</div>` : html`<div className="empty"><${I} n="chat-circle-dots" /><b>${t('no_reviews')}</b></div>`}
        <div className="rv-acts"><button className="btn btn-line" onClick=${() => set({ rvAll: r.id })}><${I} n="list-bullets" />${tx('see_all_rv')}</button><span className="meta">${tx('showing', { n: N(Math.min(4, items.length)), t: N(r.reviews) })}</span></div>
      </div>
    </div></section>`;
}
function RVisit({ r }) {
  const os = openState(r);
  return html`<section className="sec" id="info"><${Rise} as="h2" className="rh2">${t('visit')}<//>
    <div className="visit">
      <${Rise} className="vmap"><${MapBox} list=${[r]} single /><a className="btn btn-white btn-sm gm" href=${mapUrl(r)} target="_blank" rel="noopener"><${I} n="arrow-up-right" b />${t('open_gmaps')}</a><//>
      <${Rise} d=${1} className="vinfo">
        <div className="vi wide"><h3>${t('address')}</h3><p className="big">${L(r.address)}</p><div className="vi-btns"><a className="btn btn-own" href=${mapUrl(r)} target="_blank" rel="noopener"><${I} n="navigation-arrow" />${t('directions')}</a><a className="btn btn-line" href=${'tel:' + r.phone}><${I} n="phone" />${t('call')}</a><a className="btn btn-line" href=${waUrl(r)} target="_blank" rel="noopener"><${I} n="whatsapp-logo" />WhatsApp</a></div></div>
        <div className="vi"><h3>${t('hours')}</h3><p className="big">${os.from} ${t('to')} ${os.close}</p><p><span className=${os.open ? 'open' : 'closed'}>${os.open ? t('open_now') : t('closed_now')}</span><span className="meta">, ${t('every_day').toLowerCase()}</span></p></div>
        <div className="vi"><h3>${t('payment')}</h3><p className="big">${r.pay.join(', ')}</p><p className="meta">${t('vat_plus', { v: N(r.vat), s: N(r.service) })}</p></div>
        ${r.social && r.social.links ? html`<div className="vi wide"><h3>${t('follow_short')}</h3><${Social} r=${r} compact /></div>` : null}
        <div className="vi wide"><h3>${t('facilities')}</h3>${r.fac.length ? html`<ul className="fac">${r.fac.map(f => html`<li key=${f}><${I} n=${D.facilities[f].i} />${L(D.facilities[f])}</li>`)}</ul>` : html`<p className="meta">${t('fac_none')}</p>`}</div>
      <//></div></section>`;
}
function RMore({ r }) {
  const rs = D.restaurants.filter(z => z.id !== r.id && z.city === r.city).sort((a, b) => (b.area === r.area) - (a.area === r.area) || b.rating - a.rating).slice(0, 6);
  if (!rs.length) return null;
  return html`<section className="sec"><${RailX} head=${html`<h2 className="h2">${t('more_near', { a: L(areaOf(r.area)) })}</h2>`} cls="rc-rail">${rs.map(z => html`<${RCard} key=${z.id} r=${z} />`)}<//></section>`;
}
const billLines = (r, b) => Object.entries(b || {}).map(([did, q]) => ({ d: dishOf(r.id, did), q })).filter(z => z.d && z.q);
function BillPill({ r }) {
  const b = useApp(s => s.bill[r.id] || EMPTY), set = useApp(s => s.set);
  const lines = billLines(r, b), count = lines.reduce((s, z) => s + z.q, 0), sub = lines.reduce((s, z) => s + z.d.price * z.q, 0), total = sub * (1 + (r.vat + r.service) / 100);
  return html`<div className="billpill"><${AnimatePresence}>${count ? html`<${motion.button} key="bp" initial=${{ y: 90, opacity: 0, scale: 0.9 }} animate=${{ y: 0, opacity: 1, scale: 1 }} exit=${{ y: 90, opacity: 0, scale: 0.9 }} transition=${{ type: 'spring', stiffness: 420, damping: 32 }} onClick=${() => set({ billOpen: r.id })}>
    <span className="thumbs"><${AnimatePresence} initial=${false}>${lines.slice(-4).map(z => html`<${motion.span} key=${z.d.id} layout initial=${{ scale: 0, x: -12 }} animate=${{ scale: 1, x: 0 }} exit=${{ scale: 0, opacity: 0 }} transition=${{ type: 'spring', stiffness: 520, damping: 26 }}>${z.d.p ? html`<img src=${src(z.d.p, 80)} alt="" />` : html`<${I} n="fork-knife" />`}<//>`)}<//></span>
    <span>${t('n_items', { n: N(count) })}</span><${Tk} v=${total} flow /><span className="go">${t('view_bill')}<${I} n="arrow-right" b /></span><//>` : null}<//></div>`;
}
function Dock({ r }) {
  return html`<nav className="dock"><a href=${'tel:' + r.phone}><${I} n="phone" />${t('call')}</a><a href=${waUrl(r)} target="_blank" rel="noopener"><${I} n="whatsapp-logo" />WhatsApp</a><a href=${mapUrl(r)} target="_blank" rel="noopener"><${I} n="navigation-arrow" />${t('directions')}</a><button className="pri" onClick=${() => scrollToId('menu')}><${I} n="fork-knife" />${t('menu')}</button></nav>`;
}

/* ================= dish sheet ================= */
function DishSheet() {
  const dish = useApp(s => s.dish);
  return html`<${AnimatePresence}>${dish ? html`<${DishModal} key=${'ds' + dish.n} ...${dish} />` : null}<//>`;
}
function DishModal({ rid, did, house, tab: tab0 }) {
  const { set, view } = useApp(); const [cur, setCur] = useState({ rid, did }); const [tab, setTab] = useState(tab0 || 'photo'); const info = useRef();
  const r = RR(cur.rid), d = dishOf(cur.rid, cur.did), close = () => set({ dish: null }), phone = view === 'phone';
  useEffect(() => { const h = ev => ev.key === 'Escape' && close(); addEventListener('keydown', h); return () => removeEventListener('keydown', h); }, []);
  if (!d) return null;
  const tabs = [['photo', html`<${I} n="image" />${t('photo')}`]]; if (d.video) tabs.push(['video', html`<${I} n="play" f />${t('video')}`]); if (d.d3) tabs.push(['d3', html`<${I} n="cube" />3D`]);
  const tb = tabs.find(z => z[0] === tab) ? tab : 'photo';
  const others = allDishes().filter(z => z.type === d.type && !z.share).sort((a, b) => a.price - b.price), isHouse = house && cur.rid === rid;
  const lowest = isHouse ? null : others[0], rest = isHouse ? [] : others.filter(z => z !== d).slice(0, 5);
  const more = isHouse ? [...r.signature.map(z => r.menu.find(m => m.id === z)), ...r.menu.filter(m => m.best)].filter((m, i, a) => m && m !== d && a.indexOf(m) === i).slice(0, 4) : [];
  const myRv = useApp(s => s.myRv), aboutDish = v => (v.ord || []).some(o => o.toLowerCase() === d.name.en.toLowerCase() || o === L(d.name));
  const revs = [...myRv.filter(v => v.r === cur.rid && aboutDish(v)).map(v => ({ ...v, own: true })), ...D.reviews.filter(v => v.r === cur.rid && !v.hidden && aboutDish(v))];
  const ty = D.types[d.type] || {}, made = d.made || ty.made, ing = d.ing || ty.ing, side = d.side || ty.side, showSpice = d.spice > 0 || !['tea', 'bakery', 'dessert', 'drink'].includes(d.type);
  const nowD = new Date(), lg = logOf(d), mon = [5, 4, 3, 2, 1, 0].map(k => MON[LANG === 'bn' ? 'bn' : 'en'][(nowD.getMonth() - k + 12) % 12]), hist = [5, 4, 3, 2, 1, 0].map(k => priceAt(lg, k ? new Date(nowD.getFullYear(), nowD.getMonth() - k + 1, 0, 23).getTime() : NOWT)), hmax = Math.max(...hist), hmin = Math.min(...hist), diff = hist[5] - hist[0];
  const swap = (a, b) => { setCur({ rid: a, did: b }); setTab('photo'); if (info.current) info.current.scrollTo({ top: 0, behavior: 'smooth' }); };
  const q = useApp(s => (s.bill[cur.rid] || EMPTY)[cur.did] || 0);
  const media = tb === 'video' ? html`<video key="v" autoPlay muted loop playsInline poster=${src(d.p, 1000)} src=${d.video} style=${{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />` : tb === 'd3' ? html`<div key="m" style=${{ position: 'absolute', inset: 0, background: 'radial-gradient(110% 80% at 50% 30%, #fff, #e6ece6)' }}><${Model} id=${d.d3} alt=${L(d.name)} /></div>` : html`<${Pic} key=${'p' + d.id} id=${d.p} w=${1100} eager alt=${L(d.name)} word=${L(d.name)} tone=${r.theme} icon=${ty.i} />`;
  return html`<${Fragment}>
    <${motion.div} className="ds-back" initial=${{ opacity: 0 }} animate=${{ opacity: 1 }} exit=${{ opacity: 0 }} transition=${{ duration: 0.25 }} onClick=${close} />
    <div className="ds-wrap"><${motion.div} className="ds" role="dialog" aria-modal="true" aria-label=${L(d.name)} style=${{ '--rd': r.theme.deep, '--ra': r.theme.accent }}
      initial=${phone ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 14 }} animate=${phone ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }} exit=${phone ? { y: '100%' } : { opacity: 0, scale: 0.97, y: 10 }} transition=${{ duration: 0.45, ease: SHEET }}>
      <div className="ds-media"><${AnimatePresence} mode="popLayout" initial=${false}><${motion.div} key=${cur.did + tb} style=${{ position: 'absolute', inset: 0 }} initial=${{ opacity: 0, scale: 1.03 }} animate=${{ opacity: 1, scale: 1 }} exit=${{ opacity: 0 }} transition=${{ duration: 0.35, ease: EASE }}>${media}<//><//>
        ${tb === 'video' ? html`<span className="ds-note"><${I} n="video-camera" />${t('dish_video_note')}</span>` : tb === 'd3' ? html`<span className="ds-note"><${I} n="hand-grabbing" />${t('d3_hint')}</span>` : null}
        ${tabs.length > 1 ? html`<div className="ds-tabs" role="tablist">${tabs.map(([id, l]) => html`<button key=${id} role="tab" className=${tb === id ? 'on' : ''} onClick=${() => setTab(id)}>${tb === id ? html`<${Pill} id="dstab" />` : null}${l}</button>`)}</div>` : null}
        <button className="ds-close" onClick=${close} aria-label=${t('close')}><${I} n="x" b /></button></div>
      <div className="ds-info" ref=${info}><${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${cur.rid + cur.did} style=${{ display: 'grid', gap: 14 }} initial=${{ opacity: 0, y: 10 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0, y: -6 }} transition=${{ duration: 0.28, ease: EASE }}>
        <button className="ds-r" onClick=${() => { if (!isHouse) { close(); openRest(r.id); } }} style=${{ cursor: isHouse ? 'default' : 'pointer' }}><${Mono} r=${r} /><span style=${{ textAlign: 'left' }}><b>${L(r.name)}</b><small>${where(r)}</small></span>${isHouse ? null : html`<${I} n="caret-right" b />`}</button>
        <div><h2>${L(d.name)}</h2><p className="alt" style=${{ marginTop: 4 }}>${LANG === 'bn' ? d.name.en : d.name.bn}</p></div>
        <div className="ds-meta"><span>${L(d.por)}</span>${d.spice ? html`<span><${Spice} n=${d.spice} />${t('spice_' + d.spice)}</span>` : null}${d.veg ? html`<span className="badge b-green"><${I} n="leaf" f />${t('veg')}</span>` : null}${d.best ? html`<span className="badge b-gold">${t('best_seller')}</span>` : null}${d.share ? html`<span className="badge b-green"><${I} n="users-three" />${t('for_n', { n: N(d.share) })}</span>` : null}</div>
        ${d.desc ? html`<p className="ds-desc">${L(d.desc)}</p>` : null}
        <div className="buy"><${Tk} v=${d.price} />${d.out ? html`<span className="add-l">${t('sold_out')}</span>` : html`<${motion.button} className="add-l" whileTap=${{ scale: 0.95 }} onClick=${() => addDish(r.id, d.id)}>${q ? html`<${Num} v=${q} /> ·` : html`<${I} n="plus" b />`} ${t('add_to_bill')}<//>`}</div>
        <div className="fresh"><span className="ok"><${I} n="check-circle" f />${checked(r.checked)}</span>${lowest && lowest === d ? html`<span className="badge b-green">${t('lowest_in', { d: L(ty).toLowerCase() })}</span>` : null}</div>
        ${made || ing || side ? html`<div className="ds-sec"><h3>${t('about_dish')}</h3><dl className="about-d">
          ${made ? html`<dt>${t('how_made')}</dt><dd>${L(made)}</dd>` : null}
          ${ing ? html`<dt>${t('main_ing')}</dt><dd><div className="ings">${ing.map((z, i) => html`<span key=${i}>${L(z)}</span>`)}</div></dd>` : null}
          ${showSpice ? html`<dt>${t('spice_lvl')}</dt><dd>${t('spice_note_' + d.spice)}</dd>` : null}
          ${side ? html`<dt>${t('served_with')}</dt><dd>${L(side)}</dd>` : null}</dl></div>` : null}
        ${isHouse ? null : html`<div className="ds-sec"><h3>${t('price_6m')}</h3><p className="meta">${diff === 0 ? t('price_same', { m: mon[0] }) : diff > 0 ? t('price_up', { v: tk(diff), m: mon[0] }) : t('price_down', { v: tk(-diff), m: mon[0] })}</p><div className="hist">${hist.map((v, i) => html`<div key=${i}><${motion.i} initial=${{ height: 0 }} animate=${{ height: (hmax === hmin ? 60 : 24 + (v - hmin) / (hmax - hmin) * 40) + 'px' }} transition=${{ duration: 0.6, delay: 0.2 + i * 0.05, ease: EASE }} title=${tk(v)} /><span>${mon[i]}</span></div>`)}</div><button className="link" style=${{ justifySelf: 'start' }} onClick=${() => { close(); toPrices({ type: d.type }); }}><${I} n="chart-line-up" b />${tx('see_hist')}</button></div>`}
        ${more.length ? html`<div className="ds-sec"><h3>${t('also_here')}</h3>${more.map(z => html`<button key=${z.id} className="drow" onClick=${() => swap(r.id, z.id)}><${Pic} id=${z.p} w=${120} word=${L(z.name)} tone=${r.theme} /><span><b>${L(z.name)}</b><small>${L(z.por)}</small></span><${Tk} v=${z.price} /></button>`)}</div>` : null}
        ${rest.length ? html`<div className="ds-sec"><h3>${t('same_dish_else', { d: L(ty).toLowerCase() })}</h3>${rest.map(z => { const zr = RR(z.r); return html`<button key=${z.r + z.id} className="drow" onClick=${() => swap(zr.id, z.id)}><${Pic} id=${z.p} w=${120} word=${L(z.name)} tone=${zr.theme} /><span><b>${L(z.name)}</b><small>${L(zr.name)} · ${L(areaOf(zr.area))}</small></span><span style=${{ textAlign: 'right' }}><${Tk} v=${z.price} />${z === lowest ? html`<small className="low" style=${{ display: 'block', color: 'var(--good)', fontWeight: 700 }}>${t('lowest')}</small>` : null}</span></button>`; })}</div>` : null}
        <div className="ds-sec ds-rv"><div className="ds-rv-h"><h3>${t('people_said')}${revs.length ? html` <span className="meta">${N(revs.length)}</span>` : null}</h3><button className="btn btn-sm btn-own" onClick=${() => { close(); needSign(() => S().set({ write: r.id, writeDish: d.name.en })); }}><${I} n="chat-circle-dots" />${tx('rv_dish')}</button></div>
          ${revs.length ? revs.slice(0, 2).map((v, i) => html`<${RvCard} key=${(v.id || v.who) + i} v=${v} r=${r} clamp flat />`) : html`<p className="meta">${tx('rv_dish_none')}</p>`}
          ${revs.length > 2 ? html`<button className="link" style=${{ justifySelf: 'start' }} onClick=${() => { close(); S().set({ rvAll: r.id, rvDish: d.name.en }); }}>${tx('rv_dish_all', { n: N(revs.length) })}<${I} n="arrow-right" b /></button>` : null}</div>
      <//><//></div>
    <//></div><//>`;
}

/* ================= the bill: today's cash memo, opened as a sheet, without the stamp ================= */
function BillDrawer() {
  const billOpen = useApp(s => s.billOpen), set = useApp(s => s.set), r = billOpen && RR(billOpen);
  return html`<${Drawer.Root} open=${!!billOpen} onOpenChange=${o => !o && set({ billOpen: null })}><${Drawer.Portal} container=${FRAME}><${Drawer.Overlay} className="vaul-over" /><${Drawer.Content} className="vaul-c" aria-describedby=${undefined}><div className="vaul-h" /><${Drawer.Title} className="sr">${t('bill_title')}<//><div className="memo-edge" />${r ? html`<${Memo} r=${r} />` : null}<//><//><//>`;
}
function Memo({ r }) {
  const b = useApp(s => s.bill[r.id] || EMPTY), people = useApp(s => s.people), set = useApp(s => s.set), add = useApp(s => s.add), clearBill = useApp(s => s.clearBill);
  const lines = billLines(r, b), sub = lines.reduce((s, z) => s + z.d.price * z.q, 0), vat = sub * r.vat / 100, svc = sub * r.service / 100, total = sub + vat + svc;
  const today = new Date(), text = `${r.name.en}\n${lines.map(z => `${z.q} x ${z.d.name.en}: ${tkEn(z.d.price * z.q)}`).join('\n')}\nTotal with VAT and service: ${tkEn(total)}`;
  return html`<div className="memo" style=${{ '--memo': r.theme.deep }}>
    <div className="memo-h"><b className=${clsx(r.theme.font === 'serif' && LANG !== 'bn' && 'serif')}>${L(r.name)}</b><span>${L(r.spot)}<br />${dm(today)} ${dg(today.getFullYear())}</span></div>
    ${lines.length ? html`<${Fragment}>
      <${AnimatePresence} initial=${false}>${lines.map(z => html`<${motion.div} key=${z.d.id} layout className="ml" initial=${{ opacity: 0, height: 0 }} animate=${{ opacity: 1, height: 'auto' }} exit=${{ opacity: 0, height: 0 }} transition=${{ duration: 0.25, ease: EASE }} style=${{ overflow: 'hidden' }}>
        <span className="pic">${z.d.p ? html`<img src=${src(z.d.p, 80)} alt="" />` : html`<${I} n=${(D.types[z.d.type] || {}).i || 'fork-knife'} />`}</span><b>${L(z.d.name)}</b>
        <span className="stepper"><button onClick=${() => add(r.id, z.d.id, -1)} aria-label="−"><${I} n="minus" b /></button><b><${Num} v=${z.q} /></b><button onClick=${() => add(r.id, z.d.id, 1)} aria-label="+"><${I} n="plus" b /></button></span><${Tk} v=${z.d.price * z.q} flow /><//>`)}<//>
      <div className="ml sub"><span>${t('subtotal')}</span><${Tk} v=${sub} flow /></div>
      <div className="ml sub"><span>${t('vat')} ${N(r.vat)}%</span><${Tk} v=${vat} flow /></div>
      <div className="ml sub"><span>${t('service')} ${N(r.service)}%</span><${Tk} v=${svc} flow /></div>
      <div className="memo-t"><b>${t('total_all_in')}</b><${Tk} v=${total} flow /></div>
      <div className="memo-pp"><span>${t('people')}</span><span className="stepper"><button onClick=${() => set({ people: Math.max(1, people - 1) })} aria-label="−"><${I} n="minus" b /></button><b><${Num} v=${people} /></b><button onClick=${() => set({ people: Math.min(30, people + 1) })} aria-label="+"><${I} n="plus" b /></button></span><span style=${{ marginLeft: 'auto' }}>${t('each_of', { n: N(people) })}</span><${Tk} v=${total / people} flow /></div>
      <p className="memo-note">${t('bill_note')}</p>
      <div className="memo-a"><a className="btn b1" href=${'https://wa.me/?text=' + encodeURIComponent(text)} target="_blank" rel="noopener"><${I} n="whatsapp-logo" />${t('share_whatsapp')}</a><button className="btn b2" onClick=${() => clearBill(r.id)}>${t('clear_bill')}</button></div>
    <//>` : html`<div className="memo-empty"><b>${t('bill_empty')}</b><p>${t('bill_empty_sub')}</p></div>`}
  </div>`;
}

/* ================= search, AI, sign in, film, tour, photos ================= */
function Palette() {
  const palette = useApp(s => s.palette), set = useApp(s => s.set); const [q, setQ] = useState('');
  const pick = fn => () => { set({ palette: false }); setQ(''); setTimeout(fn, 30); };
  const ds = q.trim().length > 1 ? allDishes() : allDishes().filter(d => d.best).slice(0, 6);
  return html`<${Command.Dialog} open=${palette} onOpenChange=${o => set({ palette: o })} label=${t('search')} container=${FRAME} overlayClassName="cmdk-over" loop>
    <${Command.Input} value=${q} onValueChange=${setQ} placeholder=${t('ph_1')} />
    <${Command.List}>
      <${Command.Empty}>${t('no_match', { q })}<//>
      <${Command.Group} heading=${t('nav_restaurants')}>${D.restaurants.map(r => html`<${Command.Item} key=${r.id} value=${'r ' + r.id + ' ' + r.name.en + ' ' + r.name.bn + ' ' + areaOf(r.area).en} onSelect=${pick(() => openRest(r.id))}><${Pic} id=${r.hero[0]} w=${80} /><div><div>${L(r.name)}</div><small>${where(r)}</small></div><//>`)}<//>
      <${Command.Group} heading=${t('nav_dishes')}>${ds.map(d => { const r = RR(d.r); return html`<${Command.Item} key=${d.r + d.id} value=${'d ' + d.r + ' ' + d.id + ' ' + d.name.en + ' ' + d.name.bn + ' ' + D.types[d.type].en + ' ' + r.name.en} onSelect=${pick(() => openDish(r.id, d.id))}><${Pic} id=${d.p} w=${80} tone=${r.theme} /><div><div>${L(d.name)}</div><small>${L(r.name)}</small></div><${Tk} v=${d.price} /><//>`; })}<//>
      <${Command.Group} heading=${t('areas')}>${D.areas.map(a => html`<${Command.Item} key=${a.id} value=${'a ' + a.id + ' ' + a.en + ' ' + a.bn} onSelect=${pick(() => toList({ area: a.id }))}><${I} n="map-pin" /><div><div>${L(a)}</div><small>${L(D.cities[a.city])}</small></div><//>`)}<//>
      <${Command.Group} heading="khabo">
        <${Command.Item} value=${'ask ai ' + q} onSelect=${pick(() => set({ ai: { q } }))}><${I} n="sparkle" f /><div><div>${t('ask_ai')}${q ? `: “${q}”` : ''}</div></div><//>
        ${[['deals', t('nav_deals'), 'tag'], ['dishes', t('nav_dishes'), 'bowl-food'], ['biz', t('nav_business'), 'handshake'], ['dash', t('partner_sign_in'), 'squares-four']].map(([p, l, ic]) => html`<${Command.Item} key=${p} value=${'p ' + p + ' ' + l} onSelect=${pick(() => S().go(p))}><${I} n=${ic} /><div><div>${l}</div></div><//>`)}
      <//>
    <//>
    <div className="cmdk-foot"><span><span className="kbd">↑↓</span></span><span><span className="kbd">Enter</span></span><span><span className="kbd">Esc</span></span></div>
  <//>`;
}
function AiSheet() {
  const ai = useApp(s => s.ai), set = useApp(s => s.set), view = useApp(s => s.view);
  const [msgs, setMsgs] = useState([]), [q, setQ] = useState(''), [busy, setBusy] = useState(false), body = useRef();
  const ask = text => { if (!text.trim()) return; setMsgs(m => [...m, { me: text }]); setBusy(true); setQ(''); setTimeout(() => { setMsgs(m => [...m, { bot: answer(text) }]); setBusy(false); }, 1500); };
  useEffect(() => { if (!ai) return; setMsgs([]); if (ai.q) ask(ai.q); }, [ai]);
  useEffect(() => { const el = body.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, [msgs, busy]);
  const ex = [t('try_1'), t('try_4'), t('try_5')];
  return html`<${Drawer.Root} open=${!!ai} onOpenChange=${o => !o && set({ ai: null })} direction=${view === 'phone' ? 'bottom' : 'right'}><${Drawer.Portal} container=${FRAME}><${Drawer.Overlay} className="vaul-over" /><${Drawer.Content} className="vaul-r ai-sheet" aria-describedby=${undefined}>
    <div className="side-h"><div style=${{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="orb"><${I} n="sparkle" f /></span><div><${Drawer.Title} className="h3" style=${{ fontSize: 18 }}>${t('ask_title')}<//><span className="meta">${t('ask_langs')}</span></div></div><button className="x" onClick=${() => set({ ai: null })} aria-label=${t('close')}><${I} n="x" b /></button></div>
    <div className="side-p ai-body" ref=${body}>
      ${!msgs.length ? html`<div className="ai-ex" style=${{ margin: 0 }}>${ex.map((z, i) => html`<button key=${i} onClick=${() => ask(z)}><span>${z}</span><${I} n="arrow-up-right" b /></button>`)}</div>` : null}
      ${msgs.map((m, i) => m.me ? html`<${motion.div} key=${i} className="me" initial=${{ opacity: 0, y: 8, scale: 0.98 }} animate=${{ opacity: 1, y: 0, scale: 1 }} transition=${{ duration: 0.3, ease: EASE }}>${m.me}<//>` : html`<${motion.div} key=${i} className="bot" initial=${{ opacity: 0, y: 8, filter: 'blur(4px)' }} animate=${{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition=${{ duration: 0.45, ease: EASE }}><p>${m.bot.text}</p><div className="opts" style=${{ marginTop: 10 }}>${m.bot.cards.map((c, k) => html`<${AiCard} key=${k} c=${c} />`)}</div><//>`)}
      ${busy ? html`<span className="shimmer" data-text=${t('ai_thinking')}>${t('ai_thinking')}</span>` : null}
    </div>
    <form className="ai-form" style=${{ margin: '0 16px 16px' }} onSubmit=${ev => { ev.preventDefault(); ask(q); }}><input value=${q} onChange=${ev => setQ(ev.target.value)} placeholder=${t('ph_2')} aria-label=${t('ask_title')} /><button className="btn btn-pri" type="submit" disabled=${!q.trim()}><${I} n="paper-plane-right" f />${t('send')}</button></form>
  <//><//><//>`;
}
const Slot = ({ char, isActive, hasFakeCaret }) => html`<div className=${clsx('slot', isActive && 'act')}>${char}${hasFakeCaret ? html`<div className="caret" />` : null}</div>`;
function SignIn() {
  const signin = useApp(s => s.signin), set = useApp(s => s.set);
  const [step, setStep] = useState('phone'), [ph, setPh] = useState(''), [err, setErr] = useState(false), [code, setCode] = useState('');
  useEffect(() => { if (signin) { setStep('phone'); setCode(''); setErr(false); } }, [signin]);
  const digits = ph.replace(/\D/g, '').replace(/^(880|0)/, ''), ok = /^1[3-9]\d{8}$/.test(digits);
  const done = () => { const then = signin && signin.then; set({ user: '+880 ' + digits, signin: null }); toast.success(t('signed_in_as', { n: '+880 ' + digits })); if (then) setTimeout(then, 300); };
  return html`<${Dialog.Root} open=${!!signin} onOpenChange=${o => !o && set({ signin: null })}><${Dialog.Portal} container=${FRAME}><${Dialog.Backdrop} className="dlg-back" /><${Dialog.Popup} className="dlg">
    <${AnimatePresence} mode="wait" initial=${false}>${step === 'phone' ? html`<${motion.form} key="p" initial=${{ opacity: 0, x: -12 }} animate=${{ opacity: 1, x: 0 }} exit=${{ opacity: 0, x: -12 }} transition=${{ duration: 0.22 }} onSubmit=${ev => { ev.preventDefault(); if (!ok) { setErr(true); return; } setStep('code'); }}>
        <${Dialog.Title}>${t('signin_h')}<//><${Dialog.Description}>${t('signin_sub')}<//>
        <label className="form" style=${{ display: 'grid', marginTop: 18 }}><span style=${{ fontWeight: 600, fontSize: 14.5 }}>${t('phone_no')}</span><span className="pin" style=${{ marginTop: 6 }}><span>+880</span><input value=${ph} onChange=${ev => { setPh(ev.target.value); setErr(false); }} inputMode="tel" autoComplete="tel" placeholder="1712 345678" aria-invalid=${err} /></span>${err ? html`<span className="err" style=${{ color: 'var(--bad)', fontSize: 13.5, fontWeight: 650, marginTop: 6 }}>${t('phone_err')}</span>` : null}</label>
        <p className="meta" style=${{ marginTop: 10 }}>${t('signin_fine')}</p>
        <div className="acts-d"><${Dialog.Close} className="btn btn-line">${t('close')}<//><button className="btn btn-pri" type="submit">${t('send_code')}</button></div><//>`
      : html`<${motion.div} key="c" initial=${{ opacity: 0, x: 12 }} animate=${{ opacity: 1, x: 0 }} exit=${{ opacity: 0, x: 12 }} transition=${{ duration: 0.22 }}>
        <${Dialog.Title}>${t('enter_code')}<//><${Dialog.Description}>${t('code_sent', { p: '+880 ' + digits })} ${t('code_demo')}<//>
        <${OTPInput} maxLength=${6} value=${code} onChange=${setCode} onComplete=${done} containerClassName="otp" autoFocus render=${({ slots }) => html`<${Fragment}>${slots.slice(0, 3).map((s, i) => html`<${Slot} key=${i} ...${s} />`)}<div className="otp-gap" />${slots.slice(3).map((s, i) => html`<${Slot} key=${i + 3} ...${s} />`)}<//>`} />
        <div className="acts-d"><button className="btn btn-line" onClick=${() => setStep('phone')}>${t('back')}</button><button className="btn btn-pri" disabled=${code.length < 6} onClick=${done}>${t('continue')}</button></div><//>`}<//>
  <//><//><//>`;
}
function FilmDlg() {
  const film = useApp(s => s.film), set = useApp(s => s.set);
  return html`<${Dialog.Root} open=${!!film} onOpenChange=${o => !o && set({ film: null })}><${Dialog.Portal} container=${FRAME}><${Dialog.Backdrop} className="dlg-back" /><${Dialog.Popup} className="dlg wide">${film ? html`<${Fragment}><video src=${film.src} poster=${src(film.poster, 1400)} controls autoPlay playsInline style=${{ width: '100%', display: 'block', maxHeight: '72vh', background: '#000' }} /><div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 18px', color: '#fff' }}><div><${Dialog.Title} style=${{ fontSize: 18, color: '#fff' }}>${film.title}<//><p style=${{ color: 'rgba(255,255,255,.7)', margin: 0, fontSize: 14 }}>${film.sub}</p></div><${Dialog.Close} className="btn btn-glass btn-sm">${t('close')}<//></div><//>` : null}<//><//><//>`;
}
function TourDlg() {
  const tour = useApp(s => s.tour), set = useApp(s => s.set); const r = tour && RR(tour.rid); const [room, setRoom] = useState(null);
  useEffect(() => { if (tour) setRoom(tour.room || (r && r.tour && r.tour[0].id)); }, [tour]);
  const rm = r && r.tour && (r.tour.find(z => z.id === room) || r.tour[0]);
  return html`<${Dialog.Root} open=${!!tour} onOpenChange=${o => !o && set({ tour: null })}><${Dialog.Portal} container=${FRAME}><${Dialog.Backdrop} className="dlg-back" /><${Dialog.Popup} className="dlg tourd">${rm ? html`<${Fragment}>
    <div className="tour-h"><div><${Dialog.Title} style=${{ fontSize: 20, color: '#fff' }}>${L(r.name)}<//><p style=${{ color: 'rgba(255,255,255,.72)', margin: 0, fontSize: 14 }}>${L(rm)}${(rm.spots || []).filter(z => z.info).map(z => ' · ' + L(z.info)).join('')}</p></div><${Dialog.Close} className="circ" aria-label=${t('close')}><${I} n="x" b /><//></div>
    <${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${rm.pano} style=${{ flex: 1, minHeight: 0, display: 'flex' }} initial=${{ opacity: 0 }} animate=${{ opacity: 1 }} exit=${{ opacity: 0 }} transition=${{ duration: 0.3 }}><${Pano} pano=${rm.pano} tall /><//><//>
    ${r.tour.length > 1 ? html`<div className="rooms" style=${{ padding: '12px 16px 16px', margin: 0 }}>${r.tour.map(z => html`<button key=${z.id} className=${clsx('room', z.id === rm.id && 'on')} onClick=${() => setRoom(z.id)}>${z.id === rm.id ? html`<${Pill} id="troom" />` : null}<img src=${`${K.panoDir(z.pano)}${z.pano}-a.jpg`} alt="" />${L(z)}</button>`)}</div>` : null}
  <//>` : null}<//><//><//>`;
}
function Lightbox() {
  const lb = useApp(s => s.lb), set = useApp(s => s.set); const [i, setI] = useState(0), [dir, setDir] = useState(1);
  useEffect(() => { if (lb) setI(lb.i || 0); }, [lb]);
  useEffect(() => { if (!lb) return; const h = ev => { if (ev.key === 'Escape') set({ lb: null }); if (ev.key === 'ArrowRight') { setDir(1); setI(k => (k + 1) % lb.list.length); } if (ev.key === 'ArrowLeft') { setDir(-1); setI(k => (k - 1 + lb.list.length) % lb.list.length); } }; addEventListener('keydown', h); return () => removeEventListener('keydown', h); }, [lb]);
  const go = d => { setDir(d); setI(k => (k + d + lb.list.length) % lb.list.length); };
  return html`<${AnimatePresence}>${lb ? html`<${motion.div} key="lb" className="lb" initial=${{ opacity: 0 }} animate=${{ opacity: 1 }} exit=${{ opacity: 0 }} transition=${{ duration: 0.22 }} role="dialog" aria-modal="true">
    <div className="lb-h"><span>${dg(i + 1)} / ${dg(lb.list.length)}</span><button onClick=${() => set({ lb: null })} aria-label=${t('close')}><${I} n="x" b /></button></div>
    <div className="lb-img"><${AnimatePresence} initial=${false} custom=${dir} mode="popLayout"><${motion.img} key=${lb.list[i]} src=${src(lb.list[i], 1600)} alt="" custom=${dir} variants=${{ a: d => ({ opacity: 0, x: d * 60 }), b: { opacity: 1, x: 0 }, c: d => ({ opacity: 0, x: -d * 60 }) }} initial="a" animate="b" exit="c" transition=${{ duration: 0.35, ease: EASE }} drag="x" dragConstraints=${{ left: 0, right: 0 }} onDragEnd=${(ev, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1); }} /><//></div>
    <div className="lb-nav"><button onClick=${() => go(-1)} aria-label=${t('prev')}><${I} n="caret-left" b /></button><button onClick=${() => go(1)} aria-label=${t('next')}><${I} n="caret-right" b /></button></div>
    <div className="lb-th">${lb.list.map((p, k) => html`<button key=${p + k} className=${k === i ? 'on' : ''} onClick=${() => { setDir(k > i ? 1 : -1); setI(k); }}><img src=${src(p, 160)} alt="" /></button>`)}</div>
  <//>` : null}<//>`;
}
function AllReviews() {
  const rid = useApp(s => s.rvAll), rvDish = useApp(s => s.rvDish), set = useApp(s => s.set), view = useApp(s => s.view), myRv = useApp(s => s.myRv); const r = rid && RR(rid);
  const [f, setF] = useState('all'), [sort, setSort] = useState('new');
  let list = r ? [...(f === 'all' ? myRv.filter(v => v.r === r.id).map(v => ({ ...v, own: true })) : []), ...filterRv(revOf(r.id), f)] : [];
  if (rvDish) list = list.filter(v => (v.ord || []).some(o => o.toLowerCase() === rvDish.toLowerCase()));
  if (sort === 'high') list = list.slice().sort((a, b) => b.st - a.st); if (sort === 'low') list = list.slice().sort((a, b) => a.st - b.st);
  return html`<${Drawer.Root} open=${!!rid} onOpenChange=${o => !o && set({ rvAll: null, rvDish: null })} direction=${view === 'phone' ? 'bottom' : 'right'}><${Drawer.Portal} container=${FRAME}><${Drawer.Overlay} className="vaul-over" /><${Drawer.Content} className="vaul-r" aria-describedby=${undefined}>${r ? html`<${Fragment}>
    <div className="side-h"><div><${Drawer.Title} className="h3">${rvDish ? tx('rv_about', { d: rvDish }) : tx('all_rv')}<//><p className="meta" style=${{ marginTop: 2 }}><${I} n="star" f cls="star" /> ${N(r.rating)} · ${t('rv_counts', { n: N(r.reviews), v: N(r.verified) })}</p></div><button className="x" onClick=${() => set({ rvAll: null })} aria-label=${t('close')}><${I} n="x" b /></button></div>
    <div className="side-p" style=${{ display: 'grid', gap: 12, alignContent: 'start' }}>
      <div style=${{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><${Seg} id="rva" items=${RVF()} value=${f} onChange=${setF} /><${Choose} icon="sort-ascending" label=${tx(sort === 'new' ? 'newest' : sort === 'high' ? 'high' : 'low')} opts=${[['new', tx('newest')], ['high', tx('high')], ['low', tx('low')]]} value=${sort} onPick=${setSort} /></div>
      ${list.length ? list.map((v, i) => html`<${RvCard} key=${v.who + i + f + sort} v=${v} r=${r} />`) : html`<div className="empty"><b>${t('no_reviews')}</b></div>`}
      <button className="btn btn-own" onClick=${() => { set({ rvAll: null }); needSign(() => S().set({ write: r.id })); }}><${I} n="chat-circle-dots" />${t('write_review')}</button>
    </div><//>` : null}<//><//><//>`;
}
function WriteReview() {
  const rid = useApp(s => s.write), set = useApp(s => s.set), view = useApp(s => s.view), user = useApp(s => s.user); const r = rid && RR(rid);
  const [st, setSt] = useState(0), [ord, setOrd] = useState([]), [txt, setTxt] = useState(''), [pics, setPics] = useState([]), [err, setErr] = useState('');
  useEffect(() => { if (rid) { setSt(0); setOrd(S().writeDish ? [S().writeDish] : []); setTxt(''); setPics([]); setErr(''); } }, [rid]);
  const submit = ev => {
    ev.preventDefault();
    if (!st) { setErr('st'); return; } if (txt.trim().length < 20) { setErr('t'); return; }
    const mine = [{ id: 'm' + Date.now().toString(36), r: r.id, who: S().user ? tx('you') + ' (' + S().user + ')' : tx('you'), st, t: txt.trim(), ord, when: e(t('just_now'), 'এইমাত্র'), at: Date.now(), vf: false, mine: true }, ...S().myRv];
    saveRv(mine); set({ myRv: mine, write: null, writeDish: null });
    toast.success(t('review_thanks'));
  };
  return html`<${Drawer.Root} open=${!!rid} onOpenChange=${o => !o && set({ write: null, writeDish: null })} direction=${view === 'phone' ? 'bottom' : 'right'}><${Drawer.Portal} container=${FRAME}><${Drawer.Overlay} className="vaul-over" /><${Drawer.Content} className="vaul-r" aria-describedby=${undefined}>${r ? html`<form className="wr" onSubmit=${submit} noValidate style=${{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div className="side-h"><div style=${{ display: 'flex', gap: 10, alignItems: 'center' }}><${Mono} r=${r} /><div><${Drawer.Title} className="h3">${t('write_review')}<//><span className="meta">${L(r.name)}${user ? ' · ' + user : ''}</span></div></div><button type="button" className="x" onClick=${() => set({ write: null })} aria-label=${t('close')}><${I} n="x" b /></button></div>
    <div className="side-p">
      <b style=${{ display: 'block', fontSize: 14.5 }}>${t('your_rating')}</b>
      <div className="pick-st" role="radiogroup" style=${{ marginTop: 6 }}>${[1, 2, 3, 4, 5].map(k => html`<${motion.button} type="button" key=${k} className=${k <= st ? 'on' : ''} role="radio" aria-checked=${k === st} aria-label=${t('n_stars', { n: k })} onClick=${() => { setSt(k); setErr(''); }} whileTap=${{ scale: 0.8 }} animate=${k <= st ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition=${{ duration: 0.3, delay: k * 0.03 }}><${I} n="star" f /><//>`)}</div>
      <p className="meta" style=${{ color: err === 'st' ? 'var(--bad)' : null }}>${st ? t('st_' + st) : err === 'st' ? t('pick_stars') : t('tap_stars')}</p>
      <label><span>${t('what_ordered')}</span></label>
      <div className="chips" style=${{ marginTop: 8 }}>${r.menu.slice(0, 12).map(d => { const on = ord.includes(d.name.en); return html`<button type="button" key=${d.id} className=${clsx('chip sm', on && 'on')} onClick=${() => setOrd(on ? ord.filter(z => z !== d.name.en) : [...ord, d.name.en])}>${L(d.name)}</button>`; })}</div>
      <label>${t('your_review')}<textarea value=${txt} onChange=${ev => { setTxt(ev.target.value); setErr(''); }} placeholder=${t('review_ph')} aria-invalid=${err === 't'} /><span className="meta" style=${{ fontWeight: 500 }}>${t('review_help')}</span>${err === 't' ? html`<span style=${{ color: 'var(--bad)', fontSize: 13.5 }}>${t('review_err')}</span>` : null}</label>
      <label>${t('add_photos')}<span className="btn btn-line btn-sm" style=${{ justifySelf: 'start' }}><${I} n="camera" />${t('choose_photos')}<input type="file" accept="image/*" multiple hidden onChange=${ev => setPics(Array.from(ev.target.files).slice(0, 4).map(f => URL.createObjectURL(f)))} /></span></label>
      ${pics.length ? html`<div className="rv-pics" style=${{ marginTop: 8 }}>${pics.map(p => html`<div key=${p} className="pic"><img src=${p} alt="" /></div>`)}</div>` : null}
      <p className="meta" style=${{ marginTop: 14, display: 'flex', gap: 6 }}><${I} n="seal-check" />${t('review_note')}</p>
    </div>
    <div style=${{ padding: '12px 22px 20px', borderTop: '1px solid var(--line)' }}><button className="btn btn-own btn-lg" type="submit" style=${{ width: '100%' }}>${t('post_review')}</button></div>
  </form>` : null}<//><//><//>`;
}

/* ================= FOR RESTAURANTS (every section of today's page, new look) ================= */
const BPLANS = [
  { id: 'starter', name: e('Starter', 'স্টার্টার'), dhaka: 1999, sub: e('A professional page with a menu that is always right.', 'সবসময় সঠিক মেনুসহ পেশাদার পেজ।'), f: ['f_page', 'f_menu', 'f_photos', 'f_qr', 'f_print', 'f_reviews', 'f_report'] },
  { id: 'pro', name: e('Pro', 'প্রো'), dhaka: 4999, pop: true, sub: e('Stand out with a 360° tour, a film and price insights.', '৩৬০° ট্যুর, ফিল্ম আর দামের তুলনা দিয়ে আলাদা হোন।'), f: ['f_all_starter', 'f_film', 'f_kitchen', 'f_tour', 'f_video_menu', 'f_insights', 'f_deals'] },
  { id: 'premium', name: e('Premium', 'প্রিমিয়াম'), dhaka: 9999, sub: e('Maximum reach: featured placement and Deal of the Week.', 'সর্বোচ্চ প্রচার: ফিচারড জায়গা আর সপ্তাহের ডিল।'), f: ['f_all_pro', 'f_long_film', 'f_3d', 'f_featured', 'f_dotw', 'f_social', 'f_priority'] }
];
function Faq({ k }) {
  const [o, setO] = useState(false);
  return html`<div className="faq-i"><button className="faq-q" onClick=${() => setO(!o)} aria-expanded=${o}>${t(k)}<${motion.span} className="faq-c" animate=${{ rotate: o ? 45 : 0 }} transition=${{ duration: 0.25, ease: EASE }}><${I} n="plus" b /><//></button>
    <${AnimatePresence} initial=${false}>${o ? html`<${motion.div} key="a" className="faq-a" initial=${{ height: 0, opacity: 0 }} animate=${{ height: 'auto', opacity: 1 }} exit=${{ height: 0, opacity: 0 }} transition=${{ duration: 0.3, ease: EASE }}><p>${t(k + '_a')}</p><//>` : null}<//></div>`;
}
function Biz() {
  const { set } = useApp(); const sh = RR('shahi-handi'); const [city, setCity] = useState('dhaka'); const [plan, setPlan] = useState('pro'); const [sent, setSent] = useState(false); const [bad, setBad] = useState({});
  const fref = useRef(), phRef = useRef(), phIn = useInView(phRef, { once: true, margin: '200px 0px' }), vref = useRef(), vIn = useInView(vref, { margin: '120px 0px' });
  useEffect(() => { const v = vref.current; if (!v || !sh) return; if (vIn) { v.muted = true; v.playsInline = true; if (!v.src) v.src = sh.kitchen.src; v.play().catch(() => { }); } else v.pause(); }, [vIn]);
  const price = p => city === 'dhaka' ? p.dhaka : p.dhaka - 500;
  const toForm = id => { if (id) setPlan(id); if (fref.current) fref.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const submit = ev => { ev.preventDefault(); const fd = new FormData(ev.currentTarget), b = {}; ['n', 'r'].forEach(k => { if (!String(fd.get(k) || '').trim()) b[k] = 1; }); if (!/^(\+?880|0)?1[3-9]\d{8}$/.test(String(fd.get('p') || '').replace(/[\s-]/g, ''))) b.p = 1; setBad(b); if (!Object.keys(b).length) setSent(true); };
  const picks = [['shahi-handi', 'rounded'], ['kathgolap', 'leaf'], ['cha-adda', 'dots'], ['nawabpur-kacchi', 'diamond']].filter(([id]) => RR(id));
  if (!sh) return null;
  const kd = id => dishOf('shahi-handi', id);
  return html`<div className="wrap">
    <section className="bz-hero"><div>
      <${Rise} as="h1" className="h1">${t('biz_h1')}<//><${Rise} as="p" className="sub" d=${1} style=${{ fontSize: 18 }}>${t('biz_sub')}<//>
      <${Rise} d=${2} className="bz-btns"><button className="btn btn-pri btn-lg" onClick=${() => toForm()}><${I} n="calendar-blank" />${t('book_visit')}</button><button className="btn btn-line btn-lg" onClick=${() => openRest('shahi-handi')}>${t('see_live')}<${I} n="arrow-up-right" b /></button><button className="btn btn-line btn-lg" onClick=${() => S().go('dash')}><${I} n="user-circle" />${t('partner_sign_in')}</button><//>
      <p className="meta bz-note">${t('biz_note')}</p></div>
      <${Rise} d=${1}><div className="phone" ref=${phRef}><div className="notch" />${phIn ? html`<iframe title=${t('see_live')} src=${ROOT + 'index.html?embed=1#/r/shahi-handi'} allow="autoplay" />` : null}</div><//>
    </section>
    <section className="sec"><${Rise} as="h2" className="h2">${t('vs_title')}<//><div className="vs">
      <${Rise} className="vs-c old"><h3>${t('vs_old')}</h3><ul>${['vs_o1', 'vs_o2', 'vs_o3', 'vs_o4'].map(k => html`<li key=${k}><${I} n="x-circle" />${t(k)}</li>`)}</ul><//>
      <${Rise} d=${1} className="vs-c new"><h3>${t('vs_new', { b: 'khabo' })}</h3><ul>${['vs_n1', 'vs_n2', 'vs_n3', 'vs_n4'].map(k => html`<li key=${k}><${I} n="check-circle" f />${t(k)}</li>`)}</ul><//>
    </div></section>
    <section className="sec"><${Rise} as="h2" className="h2">${t('get_title')}<//><${Rise} as="p" className="sub" d=${1}>${t('get_sub')}<//>
      <div className="get">
        <${Rise} className="g1 phc"><img src=${src('pv:warm_reception_dinner:a', 1400)} alt="" loading="lazy" /><div className="cap"><h3>${t('g_tour')}</h3><p>${t('g_tour_sub')}</p><button className="btn btn-white btn-sm" onClick=${() => set({ tour: { rid: 'shahi-handi', room: 'banquet' } })}><${I} n="virtual-reality" />${t('try_it')}</button></div><//>
        <${Rise} d=${1} className="g2 phc"><video ref=${vref} muted loop playsInline preload="none" poster=${src('kc1', 900)} /><div className="cap"><h3>${t('g_film')}</h3><p>${t('g_film_sub')}</p></div><//>
        <${Rise} d=${2} className="g3"><div className="pad"><h3>${t('g_menu')}</h3><p>${t('g_menu_sub')}</p>
          <div className="show"><div className="paper"><b>${L(sh.name)}</b><ul>${['mutton-kacchi', 'kacchi-handi', 'morog-polao'].map(kd).filter(Boolean).map(d => html`<li key=${d.id}><span>${L(d.name)}</span><i /><b><${Tk} v=${d.price} /></b></li>`)}</ul></div><div className="tent"><${QR} text=${tableUrl('shahi-handi')} look="rounded" /><span>${t('tc_scan')}</span></div></div>
          <a className="btn btn-line btn-sm" style=${{ justifySelf: 'start' }} href=${ROOT + 'index.html#/r/shahi-handi/print'} target="_blank" rel="noopener"><${I} n="printer" />${t('see_print')}</a></div><//>
        <${Rise} d=${3} className="g4"><div className="pad"><h3>${t('g_report')}</h3><p>${t('g_report_sub')}</p>
          <div className="rep"><div style=${{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><b>${L(sh.name)}</b><span className="meta">${t('sample')} · ${t('oct')}</span></div>
            <div className="rep-k"><div><small>${t('page_views')}</small><b>${N(4812)}</b><em>+18%</em></div><div><small>${t('qr_scans')}</small><b>${N(1236)}</b><em>+9%</em></div><div><small>${t('calls_dirs')}</small><b>${N(388)}</b><em>+12%</em></div></div>
            <div className="rep-top"><span className="meta">${t('top_dishes')}</span><ol>${[['mutton-kacchi', 100], ['kacchi-handi', 64], ['morog-polao', 41]].filter(([id]) => kd(id)).map(([id, w]) => html`<li key=${id}><span>${L(kd(id).name)}</span><${motion.i} style=${{ '--w': w + '%' }} initial=${{ width: 0 }} whileInView=${{ width: w + '%' }} viewport=${{ once: true }} transition=${{ duration: 0.8, ease: EASE }} /></li>`)}</ol></div>
            <p className="meta" style=${{ display: 'flex', gap: 6 }}><${I} n="info" />${t('insight_line', { d: L(kd('mutton-kacchi').name), v: tk(420), a: L(areaOf('dhanmondi')), m: tk(380) })}</p></div></div><//>
      </div></section>
    <section className="sec"><${Rise} as="h2" className="h2">${t('qrb_title')}<//><${Rise} as="p" className="sub" d=${1}>${t('qrb_sub')}<//>
      <div className="qrb">${picks.map(([id, lk], i) => { const r = RR(id); return html`<${motion.a} key=${id} className="qrb-c" href=${tableUrl(id)} target="_blank" rel="noopener" style=${{ '--td': r.theme.deep, '--ta': r.theme.accent }} initial=${{ opacity: 0, y: 16 }} whileInView=${{ opacity: 1, y: 0 }} viewport=${{ once: true }} transition=${{ duration: 0.45, delay: i * 0.07, ease: EASE }}><span className=${clsx('nm', r.theme.font === 'serif' && 'serif')}>${L(r.name)}</span><${QR} text=${tableUrl(id)} look=${lk} /><small>${L(QRL[lk])}</small><//>`; })}</div>
      <ul className="qrb-pts"><li><${I} n="storefront" />${t('qrb_p1')}</li><li><${I} n="squares-four" />${t('qrb_p2')}</li><li><${I} n="check-circle" />${t('qrb_p3')}</li></ul></section>
    <section className="sec"><${Rise} className="how-band">
      <h2 className="h2">${t('how_title')}</h2>
      <ol className="how"><${motion.i} className="how-fill" aria-hidden="true" initial=${{ scaleX: 0 }} whileInView=${{ scaleX: 1 }} viewport=${{ once: true }} transition=${{ duration: 1.4, ease: EASE, delay: 0.2 }} />
        ${[['how1', 'calendar-blank', 'pv:warm_restaurant:a'], ['how2', 'camera', 'kc1'], ['how3', 'broadcast', 'kt'], ['how4', 'chart-line-up', 'iB']].map(([k, ic, ph], i) => html`<${motion.li} key=${k} initial=${{ opacity: 0, y: 20 }} whileInView=${{ opacity: 1, y: 0 }} viewport=${{ once: true }} transition=${{ duration: 0.55, delay: 0.25 + i * 0.12, ease: EASE }} whileHover=${{ y: -6 }}>
          <span className="ic"><${I} n=${ic} /></span><span className="nb" aria-hidden="true">${dg(i + 1)}</span>
          <div className="how-pic"><img src=${src(ph, 600)} alt="" loading="lazy" /></div>
          <b>${t(k)}</b><p>${t(k + '_s')}</p><//>`)}</ol>
    <//></section>
    <section className="sec" id="plans"><div className="sec-head"><div><${Rise} as="h2" className="h2">${t('plans_title')}<//><${Rise} as="p" className="sub" d=${1}>${t('plans_sub')}<//></div><${Seg} id="bcity" items=${[['dhaka', L(D.cities.dhaka)], ['bogura', L(D.cities.bogura)]]} value=${city} onChange=${setCity} /></div>
      <div className="plans">${BPLANS.map((p, i) => html`<${Rise} key=${p.id} d=${i} className=${clsx('plan', p.pop && 'hot')}>${p.pop ? html`<span className="most">${t('most_popular')}</span>` : null}<h3>${L(p.name)}</h3><p>${L(p.sub)}</p>
        <div className="pp"><${Tk} v=${price(p)} flow /><span>${t('per_month')}</span></div><p className="day">${t('per_day', { v: tk(Math.round(price(p) / 30)) })}</p>
        <ul>${p.f.map(k => html`<li key=${k}><${I} n="check" b />${t(k)}</li>`)}</ul>
        <button className=${clsx('btn', p.pop ? 'btn-gold' : 'btn-line')} onClick=${() => toForm(p.id)}>${t('choose_plan', { p: L(p.name) })}</button><//>`)}</div>
      <p className="meta" style=${{ marginTop: 16 }}>${t('plans_note')}</p></section>
    <section className="sec"><div className="faq-w"><${Rise} as="h2" className="h2">${t('faq')}<//><div className="faq">${['faq1', 'faq2', 'faq3', 'faq4', 'faq5'].map(k => html`<${Faq} key=${k} k=${k} />`)}</div></div></section>
    <section className="sec" ref=${fref} style=${{ scrollMarginTop: 90 }}><${Rise} className="bf">
      <div><h2 className="h2">${t('form_title')}</h2><p className="sub">${t('form_sub')}</p><ul>${['form_p1', 'form_p2', 'form_p3'].map(k => html`<li key=${k}><${I} n="check-circle" f />${t(k)}</li>`)}</ul></div>
      <${AnimatePresence} mode="wait" initial=${false}>${sent ? html`<${motion.div} key="ok" className="done" initial=${{ opacity: 0, scale: 0.96 }} animate=${{ opacity: 1, scale: 1 }} transition=${{ duration: 0.35, ease: EASE }}><${I} n="check-circle" f /><b className="h3">${t('form_done')}</b><p className="meta">${t('form_done_sub')}</p></${motion.div}>`
        : html`<${motion.form} key="f" className="form" noValidate onSubmit=${submit} exit=${{ opacity: 0 }}>
        <label>${t('your_name')}<input name="n" autoComplete="name" aria-invalid=${!!bad.n} /></label>
        <label>${t('rest_name')}<input name="r" aria-invalid=${!!bad.r} /></label>
        <label className="full">${t('phone')}<input name="p" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" aria-invalid=${!!bad.p} /><span className=${bad.p ? 'err' : 'help'}>${bad.p ? t('phone_err') : t('phone_help')}</span></label>
        <label>${t('area')}<select name="a">${D.areas.map(a => html`<option key=${a.id}>${L(a)}, ${L(D.cities[a.city])}</option>`)}<option>${t('other_area')}</option></select></label>
        <label>${t('plan')}<select name="pl" value=${plan} onChange=${ev => setPlan(ev.target.value)}>${BPLANS.map(p => html`<option key=${p.id} value=${p.id}>${L(p.name)}</option>`)}<option value="unsure">${t('not_sure')}</option></select></label>
        <button className="btn btn-pri btn-lg full" type="submit">${t('book_visit')}</button><p className="meta full">${t('form_privacy')}</p><//>`}<//>
    <//></section>
  </div>`;
}

/* ================= PARTNER PANEL ================= */
const REST_NAV = [['dash', 'Overview', 'squares-four'], ['menu', 'Menu & prices', 'list'], ['page', 'Restaurant page', 'storefront'], ['site', 'Your website', 'globe-hemisphere-east'], ['photos', 'Photos', 'images'], ['deals', 'Deals', 'tag'], ['events', 'Events', 'calendar-star'], ['reviews', 'Reviews', 'chat-circle-dots'], ['qr', 'Table QR', 'qr-code'], ['print', 'Print menu', 'printer'], ['insights', 'Price insights', 'chart-line-up'], ['team', 'Team & account', 'users']];
const LIVE = { dash: 1, menu: 1, reviews: 1 };
const sampleTag = html`<span className="badge b-gold" title="Real numbers come once the site is live">Sample</span>`;
const traffic = r => {
  const rnd = rng(r.id + '|traffic'), base = 60 + hash(r.id) % 120;
  const days = Array.from({ length: 30 }, (_, i) => Math.round(base * (0.75 + rnd() * 0.5) * (i % 7 === 4 || i % 7 === 5 ? 1.35 : 1))), sum = days.reduce((a, b) => a + b, 0);
  const k = f => ({ v: Math.round(sum * f), p: Math.round((rnd() - 0.35) * 30), s: days.map(z => Math.round(z * f * (0.8 + rnd() * 0.4))) });
  return { days, views: { v: sum, p: Math.round((rnd() - 0.3) * 24), s: days }, qr: k(0.21), calls: k(0.028), dirs: k(0.06) };
};
const Spark = ({ s }) => { const w = 120, h = 34, lo = Math.min(...s), hi = Math.max(...s), pts = s.map((v, i) => `${(i / (s.length - 1) * w).toFixed(1)},${(h - 3 - (hi === lo ? 0.5 : (v - lo) / (hi - lo)) * (h - 6)).toFixed(1)}`); return html`<svg viewBox=${`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><polyline points=${pts.join(' ')} fill="none" stroke="var(--hl)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>`; };
const ChartTip = ({ active, payload, label }) => active && payload && payload.length ? html`<div className="tt"><b>${NF.en.format(payload[0].value)} views</b>${label}</div>` : null;
function Side({ r }) {
  const { page, go } = useApp(); const logo = r.brand && r.brand.logo ? K.restFile(r, r.brand.logo) : null;
  const needReply = revOf(r.id).filter(v => !v.reply && v.st <= 3).length;
  return html`<aside className="dside">
    <a href="#" className="logo" onClick=${ev => { ev.preventDefault(); go('home'); }}><${Logo} />khabo<span className="meta" style=${{ fontWeight: 600, fontSize: 13, marginLeft: 2 }}>Partner</span></a>
    <div className="rcrd" style=${{ '--rd': r.theme.deep, '--ra': r.theme.accent }}>
      <div className="cv"><img src=${src(r.hero[0], 520)} alt="" /><span className="live"><i />${r.hidden ? 'Hidden' : 'Live'}</span></div>
      <div className="id"><span className="lg">${logo ? html`<img src=${logo} alt="" />` : html`<b>${r.mono}</b>`}</span>
        <h3 className=${clsx(r.theme.font === 'serif' && 'serif')}>${r.name.en}</h3>
        <div className="sm"><span className="plan-t">${PLAN_N[r.plan] ? PLAN_N[r.plan].en + ' plan' : 'Partner'}</span><span>${r.spot.en}</span></div>
        <div className="sm"><span>${r.featured ? 'Featured on khabo' : 'On khabo'}</span><span>Since ${r.since}</span></div>
        <button className="btn" onClick=${() => go('rest', { rid: r.id })}><${I} n="arrow-up-right" b />See your page</button></div>
    </div>
    <nav className="snav">${REST_NAV.map(([k, l, ic]) => html`<a key=${k} href="#" className=${page === k ? 'on' : ''} onClick=${ev => { ev.preventDefault(); if (LIVE[k]) go(k); else if (k === 'page') go('rest', { rid: r.id }); else toast('This page is not part of the preview.', { action: { label: 'Open the current panel', onClick: () => window.open(ROOT + 'panel/index.html#/' + k, '_blank') } }); }}>${page === k ? html`<${Pill} id="snav" />` : null}<${I} n=${ic} />${l}${k === 'reviews' && needReply ? html`<em>${needReply}</em>` : null}</a>`)}</nav>
    <div className="me-b"><span className="av" style=${{ '--d': r.theme.deep, '--a': r.theme.accent }}>OW</span><div><b>Restaurant owner</b><span className="meta">${r.name.en}</span></div></div>
  </aside>`;
}
function DTabs() {
  const { page, go } = useApp();
  return html`<nav className="dtabs">${[['dash', 'Overview', 'squares-four'], ['menu', 'Menu', 'list'], ['reviews', 'Reviews', 'chat-circle-dots'], ['rest', 'Page', 'storefront'], ['home', 'Site', 'house']].map(([k, l, ic]) => html`<a key=${k} href="#" className=${page === k ? 'on' : ''} onClick=${ev => { ev.preventDefault(); go(k); }}><${I} n=${ic} f=${page === k} />${l}</a>`)}</nav>`;
}
function Partner() {
  const { page } = useApp(); const r = RR('shahi-handi') || D.restaurants[0];
  return html`<div className="db"><${Side} r=${r} /><main className="main"><${AnimatePresence} mode="wait" initial=${false}><${motion.div} key=${page} initial=${{ opacity: 0, y: 10 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0, transition: { duration: 0.12 } }} transition=${{ duration: 0.3, ease: EASE }}><${Top} />${page === 'menu' ? html`<${PMenu} r=${r} />` : page === 'reviews' ? html`<${PReviews} r=${r} />` : html`<${Overview} r=${r} />`}<//><//><${DTabs} /></main></div>`;
}
function PageLook({ r }) {
  useApp(s => s.ver); const bump = useApp(s => s.bump);
  const cur = D.palettes.find(pl => pl.deep === r.theme.deep && pl.accent === r.theme.accent);
  const logo = r.brand && r.brand.logo ? K.restFile(r, r.brand.logo) : null;
  const pick = pl => { if (pl === cur) return; r.theme = { ...r.theme, deep: pl.deep, accent: pl.accent }; persist(r, `Changed page colours to ${pl.en}`); bump(); toast.success(`Your page now uses ${pl.en}.`, { action: { label: 'View', onClick: () => S().go('rest', { rid: r.id }) } }); };
  return html`<div className="sec-t"><h2>Your page colours</h2></div>
    <div className="card look"><div className="look-prev" style=${{ '--rd': r.theme.deep, '--ra': r.theme.accent }}><img src=${src(r.film ? r.film.poster : r.hero[0], 900)} alt="" />
      <${motion.div} className="plaq" layout transition=${{ duration: 0.4, ease: EASE }}><span className="plaq-logo">${logo ? html`<img src=${logo} alt="" />` : html`<b>${r.mono}</b>`}</span><div style=${{ minWidth: 0 }}><h1 className=${clsx(r.theme.font === 'serif' && 'serif')}>${r.name.en}</h1><p className="bnn">${r.name.bn}</p><i className="plaq-rule" /><p className="plaq-tag">${r.tagline.en}</p></div><//></div>
      <div className="look-pick"><p>Pick one of khabo's 12 colour pairs. Your name box, signature dishes, menu, deals and bill all use it, and diners see the change straight away.</p>
        <div className="pal">${D.palettes.map(pl => html`<button key=${pl.id} className=${clsx('pal-c', cur === pl && 'on')} onClick=${() => pick(pl)} aria-pressed=${cur === pl}><span style=${{ background: pl.deep }}><i style=${{ background: pl.accent }} />${cur === pl ? html`<${motion.b} layoutId="pal-on" className="pal-ring" transition=${SPR} />` : null}</span><small>${pl.en}</small></button>`)}</div>
        <p className="meta">The name font is set by the khabo team, so menus and prices always read the same everywhere.</p></div></div>`;
}
function Overview({ r }) {
  const { go, bump } = useApp(); useApp(s => s.ver); const logs = logsOf(r.id);
  const tr = useMemo(() => traffic(r), [r.id]), stale = r.checked >= 30, revs = revOf(r.id);
  const needReply = revs.filter(v => !v.reply && v.st <= 3), noPhoto = r.menu.filter(d => !d.p).length, out = r.menu.filter(d => d.out);
  const top = r.menu.filter(d => !d.share).map(d => ({ d, v: Math.round((d.best ? 1.8 : 1) * (40 + hash(d.id) % 120)) })).sort((a, b) => b.v - a.v).slice(0, 5), tmax = top.length ? top[0].v : 1;
  const hr = new Date().getHours(), days = (n => n <= 1 ? 'today' : n + ' days ago')(r.checked);
  const data = tr.days.map((v, i) => { const d = new Date(Date.now() - (29 - i) * 864e5); return { d: `${d.getDate()} ${MON.en[d.getMonth()]}`, v }; });
  const confirm = () => { r.checked = 0; r.checkedAt = Date.now(); persist(r, 'Confirmed all prices are correct'); bump(); toast.success('Thanks. Diners now see "prices checked today".'); };
  const todo = [
    stale ? { bad: 1, i: 'warning', b: `Prices were last confirmed ${days}.`, s: 'Diners see this date. Check your prices and confirm them.', a: 'Confirm', fn: confirm } : null,
    needReply.length ? { i: 'chat-circle-dots', b: `${needReply.length} low rating${needReply.length > 1 ? 's' : ''} without a reply`, s: 'A short, polite reply helps the next diner decide.', a: 'Reply', fn: () => go('reviews') } : null,
    out.length ? { i: 'info', b: `${out.length} dish${out.length > 1 ? 'es' : ''} marked sold out`, s: `${out.map(d => d.name.en).join(', ')}. Switch back when available.`, a: 'Menu', fn: () => go('menu') } : null,
    noPhoto ? { i: 'camera', b: `${noPhoto} dish${noPhoto > 1 ? 'es have' : ' has'} no photo`, s: 'Dishes with photos get viewed far more.', a: 'Add', fn: () => go('menu') } : null,
    !r.deal ? { i: 'tag', b: 'No deal running', s: 'Deals show on the khabo Deals page and your page.', a: 'Add', fn: () => toast('Deals open in the current panel.') } : null
  ].filter(Boolean);
  const sampleLogs = [{ who: 'Restaurant owner', what: 'Changed Mutton Kacchi from ৳400 to ৳420', at: '2 days ago' }, { who: 'khabo team', what: 'Added 3 photos of the family lounge', at: '1 week ago' }, { who: 'Restaurant owner', what: 'Started the deal Family Feast for 4', at: '2 weeks ago' }, { who: 'khabo team', what: 'Filmed the kitchen', at: '1 month ago' }];
  const stat = (k, ic, z, i) => html`<${motion.div} className="kpi" initial=${{ opacity: 0, y: 12 }} animate=${{ opacity: 1, y: 0 }} transition=${{ duration: 0.4, delay: 0.1 + i * 0.06, ease: EASE }}><span><${I} n=${ic} />${k}</span><b className="v"><${NumberFlow} value=${z.v} locales="en-IN" /></b><span className="d"><b className=${z.p < 0 ? 'down' : ''}>${z.p >= 0 ? '+' : ''}${z.p}%</b> vs last month</span><${Spark} s=${z.s.slice(-14)} /><//>`;
  return html`<div>
    <div className="top"><div><h1>Good ${hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening'}</h1><p>Here is how ${r.name.en} is doing on khabo.</p></div></div>
    <section className="ohero"><img src=${src(r.hero[0], 1400)} alt="" /><div className="oh-in"><div>
      <h2 className=${clsx(r.theme.font === 'serif' && 'serif')}>${r.name.en}</h2><p>${areaOf(r.area).en}, ${D.cities[r.city].en} · ${tkEn(r.ppl[0])} to ${tkEn(r.ppl[1])} per person</p>
      <div className="ochips"><span className=${clsx('ochip', r.hidden && 'warn')}><i className="dot" />${r.hidden ? 'Hidden from khabo' : 'Live on khabo'}</span><span className=${clsx('ochip', stale && 'warn')}><${I} n="receipt" />Prices checked ${days}</span><span className="ochip"><${I} n="fork-knife" />${r.menu.length} dishes</span><span className="ochip"><${I} n="star" f />${r.rating ? r.rating.toFixed(1) : 'New'} · ${NF.en.format(r.reviews)} reviews</span></div></div>
      <div className="oacts"><button className="btn btn-glass" onClick=${() => go('rest', { rid: r.id })}><${I} n="globe-hemisphere-east" />Your website</button><button className="btn btn-gold" onClick=${confirm}><${I} n="check-circle" f />Prices are correct</button></div></div></section>
    <${PageLook} r=${r} />
    <div className="sec-t"><h2>Last 30 days</h2>${sampleTag}</div>
    <div className="kpis">${stat('Page views', 'eye', tr.views, 0)}${stat('QR menu scans', 'qr-code', tr.qr, 1)}${stat('Call taps', 'phone', tr.calls, 2)}${stat('Directions taps', 'navigation-arrow', tr.dirs, 3)}</div>
    <div className="g2">
      <div className="card"><div className="card-h"><h2>Page views per day</h2>${sampleTag}</div><div className="chart"><${ResponsiveContainer} width="100%" height="100%"><${AreaChart} data=${data} margin=${{ top: 8, right: 8, left: -14, bottom: 0 }}><${CartesianGrid} vertical=${false} stroke="var(--line)" /><${XAxis} dataKey="d" tickLine=${false} axisLine=${false} tick=${{ fill: 'var(--ink-3)', fontSize: 12 }} interval=${6} /><${YAxis} tickLine=${false} axisLine=${false} tick=${{ fill: 'var(--ink-3)', fontSize: 12 }} width=${44} /><${Tooltip} content=${ChartTip} cursor=${{ stroke: 'var(--line-2)' }} /><${Area} type="monotone" dataKey="v" stroke="var(--hl)" strokeWidth=${2.4} fill="var(--hl)" fillOpacity=${0.12} activeDot=${{ r: 5 }} /><//><//></div></div>
      <div className="card"><div className="card-h"><h2>To do</h2><span>${todo.length ? `${todo.length} item${todo.length > 1 ? 's' : ''}` : ''}</span></div><div className="todo">${todo.length ? todo.map((z, i) => html`<${motion.div} key=${z.b} className=${z.bad ? 'bad' : ''} initial=${{ opacity: 0, x: 10 }} animate=${{ opacity: 1, x: 0 }} transition=${{ delay: 0.15 + i * 0.06, duration: 0.35, ease: EASE }}><span className="ic"><${I} n=${z.i} /></span><div><b>${z.b}</b><span>${z.s}</span></div><button className="btn btn-sm btn-line" onClick=${z.fn}>${z.a}</button><//>`) : html`<div><span className="ic"><${I} n="check-circle" f /></span><div><b>All done</b><span>Prices confirmed, reviews answered.</span></div></div>`}</div></div>
    </div>
    <div className="g2b">
      <div className="card"><div className="card-h"><h2>Most viewed dishes</h2>${sampleTag}</div><div className="dishv">${top.map((z, i) => html`<div key=${z.d.id}><span className="meta">${i + 1}</span>${z.d.p ? html`<${Pic} id=${z.d.p} w=${100} />` : html`<span className="noph"><${I} n="camera" /></span>`}<div><b>${z.d.name.en}</b><${motion.span} className="bar" initial=${{ width: 0 }} animate=${{ width: Math.round(z.v / tmax * 100) + '%' }} transition=${{ duration: 0.8, delay: 0.2 + i * 0.06, ease: EASE }} /></div><span className="n">${NF.en.format(z.v)}</span></div>`)}</div></div>
      <div className="card"><div className="card-h"><h2>Recent changes</h2>${logs.length ? null : sampleTag}</div><div className="logs">${[...logs, ...sampleLogs].slice(0, 5).map((z, i) => html`<div key=${i}><span className="av">${initials(z.who)}</span><div><b>${z.who}</b> <span style=${{ color: 'var(--ink-2)' }}>${z.what}</span></div><span className="meta">${z.at}</span></div>`)}</div></div>
    </div>
  </div>`;
}
const areaMid = (r, d) => { let pool = allDishes().filter(z => z.type === d.type && !z.share && z.r !== r.id && RR(z.r).area === r.area); let scope = areaOf(r.area).en; if (pool.length < 2) { pool = allDishes().filter(z => z.type === d.type && !z.share && z.r !== r.id && RR(z.r).city === r.city); scope = D.cities[r.city].en; } if (!pool.length) return null; const pr = pool.map(z => z.price).sort((a, b) => a - b); return { mid: pr[Math.floor(pr.length / 2)], scope }; };
function PriceIn({ r, d }) {
  const [v, setV] = useState(String(d.price)), [ok, setOk] = useState(false);
  useEffect(() => setV(String(d.price)), [d.price]);
  const commit = () => {
    const nv = Math.round(Number(v)); if (!nv || nv < 1) { setV(String(d.price)); toast.error('Enter a price above zero.'); return; }
    if (nv === d.price) return;
    const was = d.price; d.price = nv; r.checked = 0; r.checkedAt = Date.now();
    persist(r, `Changed ${d.name.en} from ${tkEn(was)} to ${tkEn(nv)}`); addHist(r, d, was, nv); S().bump();
    setOk(true); setTimeout(() => setOk(false), 1400);
    toast.success(`${d.name.en} is now ${tkEn(nv)} on your page.`, { action: { label: 'View', onClick: () => S().go('rest', { rid: r.id, jump: 'menu' }) } });
  };
  return html`<label className=${clsx('pin', ok && 'saved')}><span>৳</span><input type="number" min="1" inputMode="numeric" value=${v} onChange=${ev => setV(ev.target.value)} onKeyDown=${ev => { if (ev.key === 'Enter') { ev.preventDefault(); ev.target.blur(); } }} onBlur=${commit} aria-label=${'Price of ' + d.name.en} />${ok ? html`<${motion.span} initial=${{ scale: 0 }} animate=${{ scale: 1 }} style=${{ color: 'var(--good)' }}><${I} n="check" b /><//>` : null}</label>`;
}
function PMenu({ r }) {
  const { bump } = useApp(); useApp(s => s.ver);
  const [q, setQ] = useState(''), [cat, setCat] = useState('all'), [edit, setEdit] = useState(null), [cats, setCats] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const qq = q.toLowerCase(), cnt = id => r.menu.filter(d => d.cat === id).length;
  const toggle = (d, on) => { if (on) delete d.out; else d.out = true; persist(r, `${on ? 'Unmarked' : 'Marked'} ${d.name.en} ${on ? 'sold out' : 'as sold out'}`); bump(); toast.success(on ? `${d.name.en} is available again.` : `${d.name.en} shows as sold out today.`); };
  const moved = cid => ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const inCat = r.menu.filter(d => d.cat === cid), from = inCat.findIndex(d => d.id === active.id), to = inCat.findIndex(d => d.id === over.id), next = arrayMove(inCat, from, to);
    const known = new Set(r.cats.map(c => c.id));
    r.menu = [...r.cats.flatMap(c => c.id === cid ? next : r.menu.filter(d => d.cat === c.id)), ...r.menu.filter(d => !known.has(d.cat))];
    persist(r, `Moved ${next[to].name.en} in ${(r.cats.find(c => c.id === cid) || {}).en || 'the menu'}`); bump(); toast.success(`Moved ${next[to].name.en}. The new order is live on your page.`);
  };
  const groups = r.cats.filter(c => cat === 'all' || c.id === cat).map(c => ({ c, ds: r.menu.filter(d => d.cat === c.id && (!qq || (d.name.en + ' ' + d.name.bn).toLowerCase().includes(qq))) })).filter(g => !qq || g.ds.length);
  return html`<div>
    <div className="top"><div><h1>Menu & prices</h1><p>${r.menu.length} dishes. Change a price and press Enter; it is live straight away. Prices are before VAT ${r.vat}% and service ${r.service}%.</p></div>
      <div className="top-r"><button className="btn btn-line" onClick=${() => setCats(true)}><${I} n="sliders-horizontal" />Categories</button><button className="btn btn-pri" onClick=${() => setEdit({ cat: cat !== 'all' ? cat : r.cats[0].id })}><${I} n="plus" b />Add dish</button></div></div>
    <div className="mtool"><label className="tb-q"><${I} n="magnifying-glass" /><input type="search" value=${q} onChange=${ev => setQ(ev.target.value)} placeholder="Search your menu" aria-label="Search your menu" /></label>
      <div className="chips">${[['all', 'All', r.menu.length], ...r.cats.map(c => [c.id, c.en, cnt(c.id)])].map(([id, l, n]) => html`<button key=${id} className=${clsx('chip sm', cat === id && 'on')} onClick=${() => setCat(id)}>${l}<span style=${{ opacity: 0.7 }}>${n}</span></button>`)}</div></div>
    <div className="mhead"><span /><span /><span>Dish</span><span>Area compare</span><span>Price</span><span>Today</span><span /></div>
    ${groups.length ? groups.map(({ c, ds }) => html`<section key=${c.id} className="grp"><div className="grp-h"><h3>${c.en}</h3><span className="meta bn">${c.bn || ''}</span><span className="meta">${ds.length} dish${ds.length === 1 ? '' : 'es'}</span><div className="r"><button className="btn btn-sm btn-line" onClick=${() => setEdit({ cat: c.id })}><${I} n="plus" b />Add here</button></div></div>
      ${ds.length ? html`<${DndContext} sensors=${sensors} collisionDetection=${closestCenter} onDragEnd=${moved(c.id)}><${SortableContext} items=${ds.map(d => d.id)} strategy=${verticalListSortingStrategy}><div className="rows">${ds.map(d => { const am = areaMid(r, d), hi = am && d.price > am.mid * 1.15, lo = am && d.price < am.mid * 0.87; return html`<${SortRow} key=${d.id} id=${d.id} cls=${clsx('mrow', d.out && 'out')}>${h => html`
        <button className="handle" ...${h} aria-label=${'Move ' + d.name.en}><${I} n="dots-six-vertical" b /></button>
        ${d.p ? html`<${Pic} id=${d.p} w=${120} />` : html`<span className="noph"><${I} n="camera" /></span>`}
        <div style=${{ minWidth: 0 }}><b>${d.name.en}${d.best ? html`<span className="badge b-gold">Best seller</span>` : null}${d.share ? html`<span className="badge b-green">For ${d.share}</span>` : null}</b><span className="bnl bn">${d.name.bn}</span><span className="mt">${d.por.en}${D.types[d.type] ? ' · ' + D.types[d.type].en : ''}${d.spice ? ' · ' : ''}${d.spice ? html`<${Spice} n=${d.spice} />` : null}${d.veg ? ' · Veg' : ''}</span></div>
        <div className="area-r">${d.share ? html`Shared dish<em>Not compared with single plates</em>` : am ? html`${am.scope} typical ${tkEn(am.mid)}<em className=${hi ? 'hi' : ''}>${hi ? 'Higher than most' : lo ? 'Lower than most' : 'In line with the area'}</em>` : html`<em>No other place has this yet</em>`}</div>
        <${PriceIn} r=${r} d=${d} />
        <div className="avail"><span>${d.out ? 'Sold out' : 'Available'}</span><${Switch.Root} className="sw" checked=${!d.out} onCheckedChange=${on => toggle(d, on)} aria-label=${d.name.en + ' available today'}><${Switch.Thumb} className="sw-t" /><//></div>
        <button className="ib" onClick=${() => setEdit(d)} aria-label=${'Edit ' + d.name.en}><${I} n="dots-three" b /></button>`}<//>`; })}</div><//><//>` : html`<div className="card empty"><${I} n="fork-knife" /><b>No dishes yet</b>Add the first dish in ${c.en}.</div>`}</section>`)
      : html`<div className="card empty"><${I} n="magnifying-glass" /><b>No dish matches "${q}"</b>Try another name.</div>`}
    <${DishEdit} r=${r} d=${edit} onClose=${() => setEdit(null)} />
    <${CatEdit} r=${r} open=${cats} onClose=${() => setCats(false)} />
  </div>`;
}
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dish';
function DishEdit({ r, d: open, onClose }) {
  /* keep the last dish while the drawer slides away, so it never renders empty */
  const last = useRef(null); if (open) last.current = open; const d = last.current;
  const view = useApp(s => s.view), isNew = !!d && !d.id;
  const [f, setF] = useState(null);
  useEffect(() => { if (open) setF({ en: d.name ? d.name.en : '', bn: d.name ? d.name.bn : '', price: d.price || '', cat: d.cat || r.cats[0].id, type: d.type || 'curry', poren: d.por ? d.por.en : 'Serves 1', porbn: d.por ? d.por.bn : '১ জন', spice: d.spice || 0, veg: !!d.veg, best: !!d.best, desc: d.desc ? d.desc.en : '', p: d.p || null }); }, [open]);
  const up = (k, v) => setF(z => ({ ...z, [k]: v }));
  const save = ev => {
    ev.preventDefault(); if (!f.en.trim() || !(Number(f.price) > 0)) { toast.error('Add a name and a price above zero.'); return; }
    const o = d.id ? d : { id: slug(f.en) + '-' + Date.now().toString(36).slice(-3), r: r.id };
    Object.assign(o, { name: { en: f.en.trim(), bn: f.bn.trim() }, price: Math.round(Number(f.price)), cat: f.cat, type: f.type, por: { en: f.poren, bn: f.porbn }, spice: Number(f.spice), p: f.p });
    if (f.veg) o.veg = true; else delete o.veg; if (f.best) o.best = true; else delete o.best; if (f.desc.trim()) o.desc = { en: f.desc.trim(), bn: (o.desc && o.desc.bn) || '' }; else delete o.desc;
    if (!d.id) r.menu.push(o);
    persist(r, `${isNew ? 'Added' : 'Edited'} ${o.name.en}`); S().bump(); onClose(); toast.success(isNew ? `${o.name.en} is on your menu.` : `Saved. ${o.name.en} is live on your page.`, { action: { label: 'View', onClick: () => S().go('rest', { rid: r.id, jump: 'menu' }) } });
  };
  const remove = () => { const i = r.menu.indexOf(d); if (i < 0) return; r.menu.splice(i, 1); persist(r, `Removed ${d.name.en}`); S().bump(); onClose(); toast(`${d.name.en} was removed.`, { action: { label: 'Undo', onClick: () => { r.menu.splice(i, 0, d); persist(r, `Put back ${d.name.en}`); S().bump(); } } }); };
  const photo = ev => { const file = ev.target.files && ev.target.files[0]; if (!file) return; const fr = new FileReader(); fr.onload = () => up('p', fr.result); fr.readAsDataURL(file); };
  return html`<${Drawer.Root} open=${!!open} onOpenChange=${o => !o && onClose()} direction=${view === 'phone' ? 'bottom' : 'right'}><${Drawer.Portal} container=${FRAME}><${Drawer.Overlay} className="vaul-over" /><${Drawer.Content} className="vaul-r" aria-describedby=${undefined}>${f && d ? html`<form className="edit" onSubmit=${save} style=${{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div className="side-h"><${Drawer.Title} className="h3">${isNew ? 'Add a dish' : 'Edit ' + d.name.en}<//><button type="button" className="x" onClick=${onClose} aria-label="Close"><${I} n="x" b /></button></div>
    <div className="side-p">
      <div className="ph-up">${f.p ? html`<${Pic} id=${f.p} w=${200} />` : html`<span className="noph"><${I} n="camera" /></span>`}<div style=${{ display: 'grid', gap: 6 }}><b>Dish photo</b><span className="meta">A clear photo of the real plate. JPG or PNG.</span><div style=${{ display: 'flex', gap: 8 }}><label className="btn btn-sm btn-line"><${I} n="camera" />${f.p ? 'Replace' : 'Upload'}<input type="file" accept="image/*" hidden onChange=${photo} /></label>${f.p ? html`<button type="button" className="btn btn-sm btn-line" onClick=${() => up('p', null)}>Remove</button>` : null}</div></div></div>
      <div className="two"><label>Name (English)<input value=${f.en} onChange=${ev => up('en', ev.target.value)} placeholder="e.g. Mutton Kacchi" required /></label><label>Name (Bangla)<input className="bn" value=${f.bn} onChange=${ev => up('bn', ev.target.value)} placeholder="যেমন মাটন কাচ্চি" /></label></div>
      <div className="two"><label>Price<span className="pin"><span>৳</span><input type="number" min="1" value=${f.price} onChange=${ev => up('price', ev.target.value)} required /></span><span className="meta">Before VAT ${r.vat}% and service ${r.service}%</span></label><label>Category<select value=${f.cat} onChange=${ev => up('cat', ev.target.value)}>${r.cats.map(c => html`<option key=${c.id} value=${c.id}>${c.en}</option>`)}</select></label></div>
      <div className="two"><label>Kind of dish<select value=${f.type} onChange=${ev => up('type', ev.target.value)}>${Object.entries(D.types).map(([k, z]) => html`<option key=${k} value=${k}>${z.en}</option>`)}</select></label><label>Spice<${Seg} id="spice" items=${[[0, 'None'], [1, '1'], [2, '2'], [3, '3']]} value=${Number(f.spice)} onChange=${v => up('spice', v)} /></label></div>
      <div className="two"><label>Portion (English)<input value=${f.poren} onChange=${ev => up('poren', ev.target.value)} /></label><label>Portion (Bangla)<input className="bn" value=${f.porbn} onChange=${ev => up('porbn', ev.target.value)} /></label></div>
      <label>Description<textarea rows="3" value=${f.desc} onChange=${ev => up('desc', ev.target.value)} placeholder="What is in it, how it is cooked" /></label>
      <div className="row-sw"><span>Vegetarian</span><${Switch.Root} className="sw" checked=${f.veg} onCheckedChange=${v => up('veg', v)}><${Switch.Thumb} className="sw-t" /><//></div>
      <div className="row-sw"><span>Best seller</span><${Switch.Root} className="sw" checked=${f.best} onCheckedChange=${v => up('best', v)}><${Switch.Thumb} className="sw-t" /><//></div>
    </div>
    <div className="acts" style=${{ padding: '12px 22px 18px', borderTop: '1px solid var(--line)', marginTop: 0, position: 'static' }}>${isNew ? html`<span />` : html`<button type="button" className="btn btn-line" style=${{ color: 'var(--bad)' }} onClick=${remove}><${I} n="trash" />Remove</button>`}<button className="btn btn-pri" type="submit">${isNew ? 'Add to menu' : 'Save'}</button></div>
  </form>` : null}<//><//><//>`;
}
function CatEdit({ r, open, onClose }) {
  useApp(s => s.ver); const bump0 = useApp(s => s.bump), bump = () => { persist(r); bump0(); };
  const mv = (i, d) => { const j = i + d; if (j < 0 || j >= r.cats.length) return; const c = r.cats.splice(i, 1)[0]; r.cats.splice(j, 0, c); bump(); };
  return html`<${Dialog.Root} open=${open} onOpenChange=${o => !o && onClose()}><${Dialog.Portal} container=${FRAME}><${Dialog.Backdrop} className="dlg-back" /><${Dialog.Popup} className="dlg" style=${{ width: 'min(620px, calc(100% - 24px))' }}>
    <${Dialog.Title}>Categories<//><${Dialog.Description}>The sections of your menu, in the order diners see them.<//>
    <div className="catl">${r.cats.map((c, i) => html`<${motion.div} key=${c.id} layout transition=${SPR}><input value=${c.en} onChange=${ev => { c.en = ev.target.value; bump(); }} aria-label="English name" /><input className="bn" value=${c.bn || ''} onChange=${ev => { c.bn = ev.target.value; bump(); }} aria-label="Bangla name" /><button className="ib" onClick=${() => mv(i, -1)} aria-label="Move up" disabled=${i === 0}><${I} n="arrow-up" b /></button><button className="ib" onClick=${() => mv(i, 1)} aria-label="Move down" disabled=${i === r.cats.length - 1}><${I} n="arrow-down" b /></button><button className="ib" title=${r.menu.some(d => d.cat === c.id) ? 'Move its dishes first' : 'Delete'} disabled=${r.menu.some(d => d.cat === c.id) || r.cats.length < 2} onClick=${() => { r.cats.splice(i, 1); bump(); }} aria-label="Delete"><${I} n="trash" /></button><//>`)}</div>
    <div className="acts-d"><button className="btn btn-line" onClick=${() => { r.cats.push({ id: 'cat-' + Date.now().toString(36), en: 'New category', bn: 'নতুন ক্যাটাগরি' }); bump(); }}><${I} n="plus" b />Add category</button><${Dialog.Close} className="btn btn-pri">Done<//></div>
  <//><//><//>`;
}
function PReviews({ r }) {
  useApp(s => s.ver); const bump = useApp(s => s.bump); const [f, setF] = useState('all'); const [draft, setDraft] = useState({});
  const myRv = useApp(s => s.myRv), all = [...myRv.filter(v => v.r === r.id), ...revOf(r.id)], need = all.filter(v => !v.reply), list = f === 'need' ? need : f === 'done' ? all.filter(v => v.reply) : all, ds = dist(r.rating);
  const post = v => { const txt = (draft[v.who] || '').trim(); if (txt.length < 3) { toast.error('Write a short reply first.'); return; } v.reply = { en: txt, bn: txt }; if (v.mine) saveRv(S().myRv); else persistReply(v); setDraft({ ...draft, [v.who]: '' }); bump(); toast.success('Reply posted. It shows under the review on your page.'); };
  return html`<div>
    <div className="top"><div><h1>Reviews</h1><p>Reply to diners. Replies show under the review on your page.</p></div></div>
    <div className="rvh"><div className="big">${r.rating.toFixed(1)}</div><div style=${{ display: 'grid', gap: 10 }}><div><span className="star"><${Stars} n=${Math.round(r.rating)} /></span><p className="meta">${NF.en.format(r.reviews)} reviews, ${NF.en.format(r.verified)} verified visits</p></div><div className="dist">${ds.map((p, i) => html`<div key=${i}><span>${5 - i} ★</span><span className="tr"><${motion.i} initial=${{ width: 0 }} animate=${{ width: p + '%' }} transition=${{ duration: 0.8, delay: i * 0.05, ease: EASE }} /></span><span>${p}%</span></div>`)}</div></div></div>
    <div style=${{ marginTop: 18 }}><${Seg} id="prv" items=${[['all', 'All', all.length], ['need', 'Needs a reply', need.length], ['done', 'Replied', all.length - need.length]]} value=${f} onChange=${setF} /></div>
    <div className="rlist">${list.map(v => html`<${motion.div} key=${v.who} layout className="card"><${RvCard} v=${v} r=${r} />${v.reply ? null : html`<div className="rbox" style=${{ marginTop: 12 }}><textarea value=${draft[v.who] || ''} onChange=${ev => setDraft({ ...draft, [v.who]: ev.target.value })} placeholder=${'Reply to ' + v.who.split(' ')[0] + ', in Bangla or English'} aria-label=${'Reply to ' + v.who} /><div className="a"><button className="btn btn-pri btn-sm" onClick=${() => post(v)}><${I} n="paper-plane-right" f />Post reply</button></div></div>`}<//>`)}</div>
  </div>`;
}

createRoot(document.getElementById('root')).render(html`<${App} />`);
