'use cache';
/* The data layer. Every page reads restaurants, dishes, deals, events, reviews and prices only through
   the functions in this file. Today they read data/catalog/*.json. When the backend arrives, these
   same functions call Supabase instead, and no page or component has to change.
   'use cache' keeps each answer for a while (like a database query cache), so pages stay static and fast,
   and deals or events that start or end today still appear or hide on time. */
import 'server-only';
import { cache } from 'react';
import { RESTAURANT_FILES } from '@/data/catalog/index';
import prices from '@/data/catalog/prices.json';
import { C, cuOf, dhakaAt, liveDealsOf, rankDeals, toCard, toMini, type DealRow } from '@/lib/khabo';
import type { DishCard, KhaboEvent, PriceLog, Restaurant, RestaurantCard, Review } from './types';

type Raw = Restaurant & { reviewList?: Review[]; deal?: unknown };

const load = cache(() => {
  const restaurants: Restaurant[] = [];
  const reviews: Review[] = [];
  for (const raw of RESTAURANT_FILES as unknown as Raw[]) {
    const { reviewList, deal: _headline, ...r } = raw;
    void _headline;
    r.menu = r.menu.map(d => ({ ...d, cat: d.cat || r.cats[0].id }));
    r.gallery = r.gallery || {};
    if (!r.deals) r.deals = [];
    if (r.hidden) continue;
    restaurants.push(r);
    reviews.push(...(reviewList || []));
  }
  return { restaurants, reviews, byId: new Map(restaurants.map(r => [r.id, r])) };
});

/* ---------- restaurants ---------- */
export const getRestaurants = async () => load().restaurants;
export const getRestaurant = async (id: string) => load().byId.get(id) ?? null;
export const getRestaurantIds = async () => load().restaurants.map(r => r.id);
export const getCards = async (): Promise<RestaurantCard[]> => load().restaurants.map(toCard);

/* ---------- dishes ---------- */
export const getDishes = async (): Promise<DishCard[]> =>
  load().restaurants.flatMap(r => r.menu.map(d => ({ ...d, r: r.id, rest: toMini(r) })));

/** per dish type: how many plates, at how many places, from what price, and a photo */
export const getTypeStats = async () => {
  const ds = await getDishes();
  const out: Record<string, { n: number; places: number; lo: number; hi: number; pic: string | null }> = {};
  for (const id of Object.keys(C.types)) {
    const all = ds.filter(d => d.type === id);
    if (!all.length) continue;
    const solo = all.filter(d => !d.share), use = solo.length ? solo : all, pr = use.map(d => d.price);
    out[id] = { n: all.length, places: new Set(all.map(d => d.r)).size, lo: Math.min(...pr), hi: Math.max(...pr), pic: C.types[id].p || all.find(d => d.p)?.p || null };
  }
  return out;
};
/** dish types in the order the home page shows them: cravings first */
export const getTypeOrder = async () => {
  const st = await getTypeStats();
  return C.cravings.concat(Object.keys(C.types).filter(id => !C.cravings.includes(id))).filter(id => st[id]);
};
export const getCuisineStats = async () => {
  const ds = await getDishes();
  return Object.fromEntries(C.cuisines.map(c => { const list = ds.filter(d => cuOf(d) === c.id); return [c.id, { d: list.length, p: new Set(list.map(d => d.r)).size }]; }));
};

/* ---------- deals ---------- */
export const getLiveDeals = async (): Promise<DealRow[]> => {
  const cards = new Map((await getCards()).map(c => [c.id, c]));
  return rankDeals(load().restaurants.flatMap(r => liveDealsOf(r).map((d, i) => ({ r: cards.get(r.id)!, d, k: r.id + '/' + d.id, i }))));
};

/* ---------- events ---------- */
export type EventRow = { r: RestaurantCard; ev: KhaboEvent; k: string };
export const getEvents = async (): Promise<EventRow[]> => {
  const cards = new Map((await getCards()).map(c => [c.id, c]));
  return load().restaurants.flatMap(r => (r.events || []).map(ev => ({ r: cards.get(r.id)!, ev, k: r.id + '/' + ev.id })))
    .sort((a, b) => dhakaAt(a.ev.start) - dhakaAt(b.ev.start));
};

/* ---------- reviews ---------- */
export const getReviews = async (rid: string) => load().reviews.filter(v => v.r === rid && !v.hidden);
export const getAllReviews = async () => load().reviews;

/* ---------- prices ---------- */
export const getPriceLog = async (): Promise<PriceLog> => prices as unknown as PriceLog;
export const getPriceLogFor = async (rid: string) => {
  const all = prices as unknown as PriceLog, out: PriceLog = {};
  for (const k of Object.keys(all)) if (k.startsWith(rid + '|')) out[k] = all[k];
  return out;
};

/* ---------- search ---------- */
export type SearchHit =
  | { kind: 'rest'; id: string; name: Restaurant['name']; area: string; city: string; hero: string; mono: string; theme: Restaurant['theme']; rating: number }
  | { kind: 'dish'; id: string; r: string; name: Restaurant['name']; price: number; p: string | null; rest: Restaurant['name']; area: string; theme: Restaurant['theme']; mono: string }
  | { kind: 'area'; id: string; name: Restaurant['name']; city: string; n: number }
  | { kind: 'type'; id: string; name: Restaurant['name']; lo: number; n: number; pic: string | null };

const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
export async function search(q0: string, limit = 6): Promise<SearchHit[]> {
  const q = fold(q0.trim());
  if (!q) return [];
  const words = q.split(/\s+/);
  const has = (s: string) => { const h = fold(s); return words.every(w => h.includes(w)); };
  const { restaurants } = load();
  const st = await getTypeStats();
  const types: SearchHit[] = Object.entries(C.types).filter(([id, ty]) => st[id] && has(ty.en + ' ' + ty.bn + ' ' + id))
    .map(([id, ty]) => ({ kind: 'type', id, name: { en: ty.en, bn: ty.bn }, lo: st[id].lo, n: st[id].n, pic: st[id].pic }));
  const areas: SearchHit[] = C.areas.filter(a => has(a.en + ' ' + a.bn)).map(a => ({ kind: 'area', id: a.id, name: { en: a.en, bn: a.bn }, city: a.city, n: restaurants.filter(r => r.area === a.id).length }));
  const rests: SearchHit[] = restaurants.filter(r => has(r.name.en + ' ' + r.name.bn + ' ' + r.area + ' ' + r.cuisines.join(' ')))
    .map(r => ({ kind: 'rest', id: r.id, name: r.name, area: r.area, city: r.city, hero: r.hero[0], mono: r.mono, theme: r.theme, rating: r.rating }));
  const dishes: SearchHit[] = restaurants.flatMap(r => r.menu.filter(d => has(d.name.en + ' ' + d.name.bn + ' ' + (C.types[d.type]?.en || '') + ' ' + (C.types[d.type]?.bn || '')))
    .map(d => ({ kind: 'dish' as const, id: d.id, r: r.id, name: d.name, price: d.price, p: d.p, rest: r.name, area: r.area, theme: r.theme, mono: r.mono })))
    .sort((a, b) => a.price - b.price);
  return [...types.slice(0, 3), ...areas.slice(0, 3), ...rests.slice(0, limit), ...dishes.slice(0, limit)];
}

/* ---------- what the header and footer need ---------- */
export const getNav = async () => {
  const cards = await getCards();
  const areaCount: Record<string, number> = {};
  cards.forEach(c => { areaCount[c.area] = (areaCount[c.area] || 0) + 1; });
  /* the drop-down's sliding deals: the deal of the week first, then Premium, Pro and Starter (rankDeals order) */
  const live = await getLiveDeals();
  const pick = [...live.filter(z => z.d.week), ...live.filter(z => !z.d.week)].slice(0, 6);
  const deals = pick.map(z => ({ k: z.k, rid: z.r.id, rname: z.r.name, plan: z.r.plan, week: !!z.d.week, deal: { en: z.d.en, bn: z.d.bn }, price: z.d.price, p: z.d.p || null }));
  /* every kind of dish places really serve, with how many dishes, so a new kind shows up in the menu by itself */
  const st = await getTypeStats();
  const types = (await getTypeOrder()).map(id => ({ id, n: st[id].n, lo: st[id].lo }));
  /* cities that have places, busiest first */
  const cities = Object.keys(C.cities).filter(c => cards.some(r => r.city === c))
    .sort((a, b) => cards.filter(r => r.city === b).length - cards.filter(r => r.city === a).length);
  return { areaCount, total: cards.length, deals, types, cities };
};
export type Nav = Awaited<ReturnType<typeof getNav>>;
