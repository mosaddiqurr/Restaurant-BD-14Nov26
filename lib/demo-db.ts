'use client';
/* Prototype stand-in for the database: changes made in the owner and khabo team panels are saved in this
   browser (localStorage "khabo.panel.v1", the same key the old prototype used) and show on the diner pages
   straight away. When Supabase arrives, these calls become real database writes; the shapes stay the same. */
import { useEffect, useMemo, useState } from 'react';
import { toCard } from './khabo';
import type { Restaurant, RestaurantCard, Review } from './data/types';

export const PKEY = 'khabo.panel.v1';
export type LogRow = { at: number; who: string; role: string; rid?: string; what: string };
export type HistRow = { at: number; v: number; who: string };
export type DemoDB = {
  /** full saved copies of restaurants that were changed */
  rest?: Record<string, Restaurant>;
  /** restaurants removed by the khabo team */
  gone?: Record<string, boolean>;
  /** review changes by review key (see revKey): hidden by the team, or a reply from the owner */
  reviews?: Record<string, { hidden?: boolean; reply?: { en: string; bn: string } }>;
  /** price changes saved in the panels: "restaurant|dish" → rows */
  hist?: Record<string, HistRow[]>;
  log?: LogRow[];
  [k: string]: unknown;
};

export const revKey = (v: Pick<Review, 'r' | 'who' | 't'>) => `${v.r}|${v.who}|${String(v.t).slice(0, 24)}`;
export const readDB = (): DemoDB => { try { return JSON.parse(localStorage.getItem(PKEY) || 'null') || {}; } catch { return {}; } };
export const writeDB = (db: DemoDB) => {
  try { localStorage.setItem(PKEY, JSON.stringify(db)); } catch { /* private window: lasts for this visit only */ }
  window.dispatchEvent(new Event('khabo-db'));
};
export function saveRestaurant(r: Restaurant, what?: string, who = 'Restaurant owner', role = 'restaurant') {
  const db = readDB(); db.rest = db.rest || {}; db.rest[r.id] = JSON.parse(JSON.stringify(r));
  if (what) { db.log = db.log || []; db.log.unshift({ at: Date.now(), who, role, rid: r.id, what }); }
  writeDB(db);
}
export function saveReply(v: Review, reply: { en: string; bn: string } | undefined, who = 'Restaurant owner') {
  const db = readDB(), k = revKey(v); db.reviews = db.reviews || {};
  db.reviews[k] = { ...(db.reviews[k] || {}), reply };
  db.log = db.log || []; db.log.unshift({ at: Date.now(), who, role: 'restaurant', rid: v.r, what: `Replied to ${v.who}` });
  writeDB(db);
}
export function addPriceChange(rid: string, did: string, was: number, v: number, who = 'Restaurant owner') {
  const db = readDB(), k = rid + '|' + did; db.hist = db.hist || {};
  const h = db.hist[k] = db.hist[k] || [];
  if (!h.length) h.push({ at: Date.now() - 1, v: was, who: 'Before' });
  h.push({ at: Date.now(), v, who });
  writeDB(db);
}

/** the saved demo database, kept fresh when any panel saves (also across tabs) */
export function useDemoDB() {
  const [db, setDb] = useState<DemoDB>({});
  useEffect(() => {
    const f = () => setDb(readDB());
    f();
    addEventListener('khabo-db', f); addEventListener('storage', f);
    return () => { removeEventListener('khabo-db', f); removeEventListener('storage', f); };
  }, []);
  return db;
}

/** a restaurant as the diner should see it: the saved copy from the panels if there is one */
export function useLiveRestaurant(r: Restaurant) {
  const db = useDemoDB();
  return (db.rest && db.rest[r.id]) || r;
}
/** false when the khabo team removed or hid this restaurant in the panel */
export function useIsListed(id: string) {
  const db = useDemoDB();
  return !(db.gone && db.gone[id]) && !(db.rest && db.rest[id] && db.rest[id].hidden);
}
/** restaurant cards as the diner should see them: panel changes applied, removed or hidden ones left out,
    restaurants the team added in the panel included */
export function useLiveCards(cards: RestaurantCard[]) {
  const db = useDemoDB();
  return useMemo(() => {
    if (!db.rest && !db.gone) return cards;
    const rest = db.rest || {}, gone = db.gone || {};
    const out = cards.filter(c => !gone[c.id] && !(rest[c.id] && rest[c.id].hidden)).map(c => (rest[c.id] ? toCard(rest[c.id]) : c));
    for (const r of Object.values(rest)) if (!cards.some(c => c.id === r.id) && !r.hidden && !gone[r.id] && r.menu && r.hero) out.push(toCard(r));
    return out;
  }, [cards, db]);
}
/** reviews with the team's hiding and the owner's replies applied */
export function useLiveReviews(list: Review[]) {
  const db = useDemoDB();
  if (!db.reviews) return list;
  return list.map(v => { const s = db.reviews![revKey(v)]; return s ? { ...v, hidden: !!s.hidden, reply: 'reply' in s ? s.reply || undefined : v.reply } : v; }).filter(v => !v.hidden);
}

/* ---------- the owner's own to-do list, per restaurant (db.todos[rid]) ---------- */
export type TodoRow = { id: string; text: string; at: number; done?: number; by?: string };
/** the saved to-dos of a restaurant, newest first */
export const todosOf = (db: DemoDB, rid: string): TodoRow[] => ((db.todos as Record<string, TodoRow[]> | undefined)?.[rid]) || [];
/** change a restaurant's to-dos and save them (they are the owner's own notes, so they save straight away) */
export function saveTodos(rid: string, fn: (list: TodoRow[]) => TodoRow[]) {
  const db = readDB(), all = ((db.todos as Record<string, TodoRow[]> | undefined) || {});
  all[rid] = fn((all[rid] || []).slice()).slice(0, 200);
  db.todos = all;
  writeDB(db);
}
