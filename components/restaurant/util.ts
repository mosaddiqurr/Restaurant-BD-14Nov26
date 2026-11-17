'use client';
/* Small helpers for the restaurant page and the sheets it opens (dish, bill, tour, photos, reviews). */
import { useSyncExternalStore } from 'react';
import { S, useApp } from '@/lib/store';
import { dhakaAt, toMini } from '@/lib/khabo';
import type { Dish, KhaboEvent, Restaurant, RestaurantMini, Text } from '@/lib/data/types';
import type { I18n } from '@/lib/i18n/core';

/** what the bill and the sheets keep about a restaurant: the mini card plus the street, for the cash memo */
export type RMini = RestaurantMini & { spot?: Text };
export const miniOf = (r: Restaurant): RMini => ({ ...toMini(r), spot: r.spot });

/** a saved copy from the owner panel may miss a few defaults: fill them like the data layer does */
export function tidy(r: Restaurant): Restaurant {
  if (r.menu.every(d => d.cat) && r.gallery && r.deals) return r;
  return { ...r, gallery: r.gallery || {}, deals: r.deals || [], menu: r.menu.map(d => (d.cat ? d : { ...d, cat: r.cats[0]?.id })) };
}

export const PHOTO_CATS = ['inside', 'outside', 'kitchen', 'food'] as const;
export const photoCats = (i: I18n, r: Restaurant) =>
  PHOTO_CATS.filter(c => (r.gallery[c] || []).length).map(c => [c, i.t(c)] as [string, string]);

/** scroll so a section sits just under the header and the section bar (scroll-margin-top does the rest) */
export function scrollToId(id: string, smooth = true) {
  const el = document.getElementById(id);
  if (!el) return false;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: smooth && !still ? 'smooth' : 'auto', block: 'start' });
  return true;
}

export const evS = (ev: KhaboEvent) => dhakaAt(ev.start), evE = (ev: KhaboEvent) => dhakaAt(ev.end);
/** events that have not ended yet, soonest first */
export const eventsOf = (r: Pick<Restaurant, 'events'>, now = Date.now()) =>
  (r.events || []).filter(ev => evE(ev) > now).sort((a, b) => evS(a) - evS(b));

/** true on phones (the same width where the sheets turn into bottom sheets) */
export function useIsPhone(max = 720) {
  return useSyncExternalStore(
    cb => { const m = matchMedia(`(max-width: ${max}px)`); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => matchMedia(`(max-width: ${max}px)`).matches,
    () => false,
  );
}
export const reducedMotion = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** open the bill for a restaurant, even when nothing is on it yet (the memo still needs the name) */
export function openBill(r: RMini) {
  useApp.setState(s => (s.bill[r.id] ? {} : { bill: { ...s.bill, [r.id]: { r, items: {} } } }));
  S().set({ billOpen: r.id });
}

/* ---------- price history: the price log, plus every change saved in the owner panel ---------- */
export type PricePoint = { at: number; v: number };
export function logOf(d: Pick<Dish, 'price'>, base: [string, number][] | undefined, saved: { at: number; v: number; who: string }[] | undefined, now = Date.now()) {
  const pts: PricePoint[] = (base && base.length ? base : [['2026-05-16', d.price] as [string, number]]).map(([dt, v]) => ({ at: +new Date(dt + 'T12:00:00'), v }))
    .concat((saved || []).filter(z => z.who !== 'Before').map(z => ({ at: z.at, v: z.v })))
    .sort((a, b) => a.at - b.at);
  if (pts[pts.length - 1].v !== d.price) pts.push({ at: now, v: d.price });
  return pts;
}
export const priceAt = (pts: PricePoint[], at: number) => { let v = pts[0].v; for (const z of pts) if (z.at <= at) v = z.v; return v; };
/** the price at the end of each of the last six months (this month = today) */
export function sixMonths(pts: PricePoint[], i: I18n, now = new Date()) {
  const ks = [5, 4, 3, 2, 1, 0];
  const mon = ks.map(k => i.mon((now.getMonth() - k + 12) % 12));
  const vals = ks.map(k => priceAt(pts, k ? new Date(now.getFullYear(), now.getMonth() - k + 1, 0, 23).getTime() : now.getTime()));
  return { mon, vals, max: Math.max(...vals), min: Math.min(...vals), diff: vals[5] - vals[0] };
}

/** the extra props some sheets carry on top of the store's shapes (see the report: worth adding to lib/store.ts) */
export type RvAllX = { dish?: Text; reviews?: number; verified?: number };
export type WriteX = { menu?: { id: string; name: Text }[] };
