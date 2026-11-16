/* Shared rules of the site, used on the server and in the browser.
   Pure functions only: no React, no storage. Ported from website/app/app.js. */
import common from '@/data/catalog/common.json';
import type { Common, Deal, Dish, Plan, Restaurant, RestaurantCard } from './data/types';
import type { I18n } from './i18n/core';

export const C = common as unknown as Common;

/* ---------- motion ---------- */
export const EASE = [0.23, 1, 0.32, 1] as const;
export const SHEET = [0.32, 0.72, 0, 1] as const;
export const SPR = { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 } as const;

/* ---------- photos ---------- */
/** a photo id → a real URL at about the given width */
/* the 360 still photos come in sizes made by scripts/media-sizes.mjs: <name>-24 (blurred preview), -480, -960 and full */
const stillBase = (id: string) => {
  if (id.startsWith('pv:')) { const [, p, v] = id.split(':'); return `/media/360/${p}-${v}`; }
  const m = /^\/media\/360\/([\w-]+?)\.jpg$/.exec(id);
  return m && !/-(4k|24|480|960)$/.test(m[1]) ? `/media/360/${m[1]}` : null;
};
export function src(id: string | null | undefined, w = 800) {
  if (!id) return '';
  const still = stillBase(id);
  if (still) return w <= 480 ? `${still}-480.jpg` : w <= 960 ? `${still}-960.jpg` : `${still}.jpg`;
  if (/^(data:|https?:|blob:|\/)/.test(id)) return id;
  if (id.startsWith('ph:')) return `https://cdn.polyhaven.com/asset_img/primary/${id.slice(3)}.png?height=${Math.min(1200, Math.max(256, Math.round(w)))}`;
  const p = C.photos[id];
  return p ? `https://images.unsplash.com/photo-${p}?w=${Math.round(w)}&q=70&auto=format&fit=crop` : '';
}
/** srcset for a photo, so phones download small files */
export function srcSet(id: string | null | undefined, w: number) {
  if (!id) return undefined;
  const still = stillBase(id);
  if (still) return `${still}-480.jpg 480w, ${still}-960.jpg 960w` + (w > 960 ? `, ${still}.jpg 1600w` : '');
  if (!C.photos[id]) return undefined;
  return [0.5, 1, 1.5, 2].map(k => `${src(id, Math.round(w * k))} ${Math.round(w * k)}w`).join(', ');
}
/** a tiny copy of a photo (about 1 KB) shown blurred while the real one loads; '' when there is none */
export function lqip(id: string | null | undefined) {
  if (!id) return '';
  const still = stillBase(id);
  if (still) return `${still}-24.jpg`;
  return C.photos[id] ? `https://images.unsplash.com/photo-${C.photos[id]}?w=24&q=30&auto=format&fit=crop` : '';
}
export const panoFull = (pano: string) => `/media/360/${pano}-4k.jpg`;
export const panoStill = (pano: string) => `/media/360/${pano}-a.jpg`;
export const restFile = (rid: string, f: string) => `/media/r/${rid}/${f}`;

/* ---------- small helpers ---------- */
export const hash = (s: string) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const rng = (seed: string) => { let a = hash(seed); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let z = Math.imul(a ^ a >>> 15, 1 | a); z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z; return ((z ^ z >>> 14) >>> 0) / 4294967296; }; };
export const initials = (s: string) => String(s).split(/\s+/).filter(w => /\p{L}/u.test(w[0] || '')).slice(0, 2).map(w => w[0]).join('').toUpperCase();
export const norm = (s: string) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
export const avatarTone = (s: string): [string, string] => { const p = C.palettes[hash(s) % C.palettes.length]; return [p.deep, p.accent]; };
export const esc = (s: unknown) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/* ---------- places ---------- */
export const areaOf = (id: string) => C.areas.find(a => a.id === id) || C.areas[0];
export const cuOf = (d: Pick<Dish, 'type'>) => C.types[d.type]?.cu;
export const cuName = (i: I18n, id: string) => i.L(C.cuisines.find(c => c.id === id));
export const where = (i: I18n, r: { area: string; city: string }) => `${i.L(areaOf(r.area))}, ${i.L(C.cities[r.city])}`;
export const LL: Record<string, [number, number]> = { dhanmondi: [23.7461, 90.3742], gulshan: [23.7925, 90.4078], banani: [23.7937, 90.4066], mirpur: [23.8223, 90.3654], mohammadpur: [23.7662, 90.3589], uttara: [23.8759, 90.3795], 'old-dhaka': [23.7104, 90.4074], jaleshwaritola: [24.8465, 89.3776], satmatha: [24.8481, 89.3730] };
export const distKm = (a?: [number, number] | null, b?: [number, number] | null) => {
  if (!a || !b) return null;
  const R = 6371, rad = (x: number) => x * Math.PI / 180, dLa = rad(b[0] - a[0]), dLo = rad(b[1] - a[1]);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
export const mapUrl = (r: { address: { en: string } }) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address.en)}`;
export const dirUrl = (r: { geo: [number, number] }) => `https://www.google.com/maps/dir/?api=1&destination=${r.geo[0]},${r.geo[1]}`;
export const waUrl = (r: { phone: string }) => `https://wa.me/${r.phone.replace(/[^\d]/g, '')}`;
/** how the star ratings spread, from the average (demo data) */
export const ratingSpread = (rating: number) => { const five = Math.round(Math.max(30, Math.min(85, (rating - 3.6) * 70))); const four = Math.round((100 - five) * 0.6); const three = Math.round((100 - five - four) * 0.55); const two = Math.round((100 - five - four - three) * 0.5); return [five, four, three, two, Math.max(0, 100 - five - four - three - two)]; };

/* ---------- opening hours ---------- */
const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export function clock(i: I18n, s: string) {
  const [h0, mi] = s.split(':').map(Number); let h = h0; const ap = h >= 12 && h < 24 ? 'PM' : 'AM'; h = h % 12 || 12;
  return i.dg(`${h}${mi ? ':' + String(mi).padStart(2, '0') : ''} ${i.bn ? (ap === 'AM' ? 'এএম' : 'পিএম') : ap}`);
}
export function isOpen(r: { hours: [string, string] }, now = new Date()) {
  const o = toMin(r.hours[0]); let c = toMin(r.hours[1]); const m = now.getHours() * 60 + now.getMinutes();
  if (c <= o) c += 1440;
  const mm = m < o && m + 1440 < c ? m + 1440 : m;
  return mm >= o && mm < c;
}
export function openState(i: I18n, r: { hours: [string, string] }, now = new Date()) {
  const open = isOpen(r, now);
  return { open, label: open ? i.t('open_till', { t: clock(i, r.hours[1]) }) : i.t('opens_at', { t: clock(i, r.hours[0]) }), close: clock(i, r.hours[1]), from: clock(i, r.hours[0]) };
}
export const isLate = (r: { hours: [string, string] }) => { const c = toMin(r.hours[1]); return c <= toMin('04:00') || c >= toMin('23:30'); };
export const checkedLabel = (i: I18n, days: number) => days <= 1 ? i.t('checked_today') : i.t('checked_days', { n: i.N(days) });

/* ---------- plans and deals: Premium partners always come first ---------- */
export const PLAN: Record<Plan, number> = { premium: 3, pro: 2, starter: 1 };
export const PLAN_N = { premium: { en: 'Premium', bn: 'প্রিমিয়াম' }, pro: { en: 'Pro', bn: 'প্রো' }, starter: { en: 'Starter', bn: 'স্টার্টার' } };
export const planOf = (r: { plan: Plan }) => PLAN[r.plan] || 0;
/** today's date in Dhaka style YYYY-MM-DD (local time) */
export const today = () => { const n = new Date(); return new Date(n.getTime() - n.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
export const dealState = (d: Deal) => { const t = today(); return d.off ? 'off' : d.from && d.from > t ? 'soon' : d.to && d.to < t ? 'ended' : 'live'; };
export const liveDealsOf = (r: { deals?: Deal[] }) => (r.deals || []).filter(d => dealState(d) === 'live');
/** the headline deal used by cards and filters: the deal of the week first */
export const headDeal = (r: { deals?: Deal[] }) => { const live = liveDealsOf(r); return live.find(d => d.week) || live[0]; };
export type DealRow<R = RestaurantCard> = { r: R; d: Deal; k: string; i: number };
/** order: plan (Premium, Pro, Starter), then the order the khabo team set, then the deal of the week, then rating */
export function rankDeals<R extends { plan: Plan; rating: number }>(list: DealRow<R>[], order: string[] = []) {
  return list.slice().sort((a, b) => {
    const ia = order.indexOf(a.k), ib = order.indexOf(b.k);
    return planOf(b.r) - planOf(a.r) || (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || (b.d.week ? 1 : 0) - (a.d.week ? 1 : 0) || b.r.rating - a.r.rating || a.i - b.i;
  });
}
export const dealTag = (i: I18n, d: Deal) => d.week ? i.t('deal_week') : i.L(C.dealTags[d.tag || 'offer'] || C.dealTags.offer);
export const dealRing = (d: Deal) => d.week ? 'DEAL OF THE WEEK' : (C.dealTags[d.tag || 'offer'] || C.dealTags.offer).ring;
/** a deal can carry its own code; until then the preview shows a sample made from the restaurant and the deal */
export const codeOf = (r: { mono: string }, d: Deal) => d.code || `${r.mono}-${d.id.split('-')[0].toUpperCase().slice(0, 7)}`;
export const weekEnd = () => { const now = new Date(), add = (5 - now.getDay() + 7) % 7; return new Date(now.getFullYear(), now.getMonth(), now.getDate() + add, 23, 59, 59).getTime(); };
export const dealEnd = (d: Deal) => d.week ? weekEnd() : d.to ? new Date(d.to + 'T23:59:59').getTime() : null;
export function dealDates(i: I18n, d: Deal) {
  if (d.week) {
    const now = new Date(), s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 1) % 7), f = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
    return `${i.dm(s)} ${i.t('to')} ${i.dm(f)}`;
  }
  return d.from && d.to ? `${i.dm(new Date(d.from))} ${i.t('to')} ${i.dm(new Date(d.to))}` : d.to ? i.t('until_x', { v: i.dm(new Date(d.to)) }) : d.from ? i.t('from_x', { v: i.dm(new Date(d.from)) }) : '';
}

/* ---------- filters (the same rules as the live listing pages) ---------- */
export type RFilter = { area?: string; city?: string; cu?: string; type?: string; q?: string; bud?: string; open?: string | boolean; late?: string | boolean; rating?: string; occ?: string; fac: string[]; media: string[]; tags: string[]; sort: string };
export type DFilter = { area?: string; city?: string; cu?: string; type?: string; q?: string; max?: string; veg?: string | boolean; mild?: string | boolean; sort: string; group: string; mode: string; bud?: string; fac?: string[]; media?: string[]; tags?: string[]; rating?: string; open?: string | boolean };
export const LIST_KEYS = ['fac', 'media', 'tags'] as const;
export const F0 = (): RFilter => ({ fac: [], media: [], tags: [], sort: 'rel' });
export const DF0 = (): DFilter => ({ sort: 'rel', group: 'cu', mode: 'grid', type: '', cu: '', q: '' });
export function matchR(r: RestaurantCard, f: Partial<RFilter> & Partial<DFilter>, dishLevel = false) {
  if (f.area && r.area !== f.area) return false;
  if (f.city && r.city !== f.city) return false;
  if (!dishLevel) {
    if (f.cu && !r.cuisines.includes(f.cu) && !r.types.some(ty => C.types[ty]?.cu === f.cu)) return false;
    if (f.type && !r.types.includes(f.type)) return false;
    if (f.q) { if (!norm(f.q).split(/\s+/).every(w => r.hay.includes(w))) return false; }
  }
  const b = C.budgets.find(z => z.id === f.bud); if (b && !(r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0))) return false;
  if (f.open && !isOpen(r)) return false;
  if (f.late && !isLate(r)) return false;
  if (f.rating && r.rating < Number(f.rating)) return false;
  if ((f.fac || []).length && !f.fac!.every(z => r.fac.includes(z))) return false;
  const md = f.media || [], tg = f.tags || [];
  if (md.includes('tour') && !r.hasTour) return false;
  if (md.includes('film') && !r.hasFilm) return false;
  if (md.includes('3d') && !r.has3d) return false;
  if (md.includes('kitchen') && !r.hasKitchen) return false;
  if (tg.includes('deals') && !r.deal) return false;
  if (tg.includes('featured') && !r.featured) return false;
  if (tg.includes('founding') && !r.founding) return false;
  const o = C.occasions.find(z => z.id === f.occ);
  if (o) {
    if (o.q.fac && !o.q.fac.every(z => r.fac.includes(z))) return false;
    if (o.q.maxPP && r.ppl[0] > o.q.maxPP) return false;
    if (o.q.late && !isLate(r)) return false;
    if (o.q.media && o.q.media.includes('tour') && !r.hasTour) return false;
  }
  return true;
}
export function sortRestaurants(list: RestaurantCard[], f: { sort: string }, near: string) {
  const nearCity = areaOf(near).city;
  const s: Record<string, (a: RestaurantCard, b: RestaurantCard) => number> = {
    /* best match: featured places first, then by plan, then rating */
    rel: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || planOf(b) - planOf(a) || b.rating - a.rating,
    price: (a, b) => a.ppl[0] - b.ppl[0], rating: (a, b) => b.rating - a.rating,
    near: (a, b) => Number(b.area === near) - Number(a.area === near) || Number(b.city === nearCity) - Number(a.city === nearCity) || b.rating - a.rating,
    fresh: (a, b) => a.checked - b.checked,
  };
  return list.slice().sort(s[f.sort] || ((a, b) => b.rating - a.rating));
}
export const MAIN_DISHES = ['kacchi', 'biryani', 'tehari', 'polao', 'thali', 'fish', 'thai', 'chinese', 'platter', 'kebab', 'curry', 'fuchka', 'bakery'];

/* ---------- restaurant → card ---------- */
export function toCard(r: Restaurant): RestaurantCard {
  const area = areaOf(r.area);
  const hay = norm([r.name.en, r.name.bn, area.en, area.bn,
    ...r.cuisines.map(c => { const z = C.cuisines.find(y => y.id === c); return z ? z.en + ' ' + z.bn : ''; }),
    ...r.menu.map(d => d.name.en + ' ' + d.name.bn + ' ' + (C.types[d.type]?.en || '') + ' ' + (C.types[d.type]?.bn || ''))].join(' '));
  return {
    id: r.id, name: r.name, mono: r.mono, area: r.area, city: r.city, geo: r.geo, spot: r.spot, cuisines: r.cuisines, theme: r.theme, tagline: r.tagline,
    rating: r.rating, reviews: r.reviews, verified: r.verified, ppl: r.ppl, hours: r.hours, fac: r.fac, plan: r.plan, featured: r.featured, founding: r.founding,
    checked: r.checked, hero: [r.hero[0], r.hero[1] || (r.gallery.inside || [])[1]].filter(Boolean) as string[], phone: r.phone,
    hasTour: !!(r.tour && r.tour.length), hasFilm: !!r.film, has3d: r.menu.some(d => d.d3), hasKitchen: !!r.kitchen,
    deal: headDeal(r), types: [...new Set(r.menu.map(d => d.type))], hay, filmSrc: r.film?.src, vat: r.vat, service: r.service,
  };
}
export const toMini = (r: Restaurant | RestaurantCard) => ({ id: r.id, name: r.name, mono: r.mono, area: r.area, city: r.city, theme: r.theme, rating: r.rating, plan: r.plan, checked: r.checked, vat: r.vat, service: r.service, hours: r.hours, featured: r.featured });
