/* The sums behind /prices. Plain functions, no React: the same numbers on the server and in the browser.
   Rule of the page: today's menu price at every place, and trends only for a whole area (the typical price
   of 3 or more places). One restaurant's own price changes are never shown here. */
import type { DishCard, PriceLog } from '@/lib/data/types';
import type { HistRow } from '@/lib/demo-db';
import { C, areaOf } from '@/lib/khabo';

export const DAYMS = 864e5;
/** an area trend needs this many places, so no single restaurant's change can be read from it */
export const MIN_PLACES = 3;
export type Pt = { at: number; v: number };
export type Scope = { area?: string; city?: string };

/** the middle price (the typical price). With an even count, the mean of the two middle prices */
export function median(list: number[]) {
  if (!list.length) return 0;
  const s = [...list].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export const inScope = (d: DishCard, f: Scope) => (!f.area || d.rest.area === f.area) && (!f.city || d.rest.city === f.city);
export const cityOf = (f: Scope) => f.city || (f.area ? areaOf(f.area).city : '') || 'dhaka';

/** every price a dish has had: the saved log, then owner panel changes, then today's price if it moved since */
export function logOf(d: DishCard, log: PriceLog, hist: Record<string, HistRow[]>, now: number): Pt[] {
  const k = d.r + '|' + d.id;
  const base = (log[k] || [['2026-05-16', d.price]]).map(([dt, v]) => ({ at: +new Date(dt + 'T12:00:00'), v }));
  const pts = base.concat((hist[k] || []).filter(z => z.who !== 'Before').map(z => ({ at: z.at, v: z.v }))).sort((a, b) => a.at - b.at);
  if (!pts.length || pts[pts.length - 1].v !== d.price) pts.push({ at: now, v: d.price });
  return pts;
}
export const priceAt = (pts: Pt[], at: number) => { let v = pts[0].v; for (const z of pts) if (z.at <= at) v = z.v; return v; };

/** today's prices for one dish type in one place, cheapest first (ties by restaurant, so the order never jumps) */
export function rowsOf(dishes: DishCard[], type: string, f: Scope) {
  const ds = dishes.filter(d => d.type === type && inScope(d, f)).sort((a, b) => a.price - b.price || a.r.localeCompare(b.r) || a.id.localeCompare(b.id));
  const pr = ds.map(d => d.price);
  return { ds, n: ds.length, places: new Set(ds.map(d => d.r)).size, lo: pr[0] ?? 0, hi: pr[pr.length - 1] ?? 0, mid: median(pr) };
}

export type Trend = { pts: { at: number; v: number }[]; now: number; was: number; lm: number; pct: number };
/** the typical price of these dishes, week by week for 26 weeks. null when too few places share the dish */
export function trendOf(ds: DishCard[], log: PriceLog, hist: Record<string, HistRow[]>, now: number): Trend | null {
  if (new Set(ds.map(d => d.r)).size < MIN_PLACES) return null;
  const lgs = ds.map(d => logOf(d, log, hist, now));
  const at = (t: number) => median(lgs.map(lg => priceAt(lg, t)));
  const pts = Array.from({ length: 27 }, (_, k) => { const t = now - (26 - k) * 7 * DAYMS; return { at: t, v: at(t) }; });
  const d0 = new Date(now), endLast = new Date(d0.getFullYear(), d0.getMonth(), 0, 23).getTime();
  const cur = at(now), was = pts[0].v;
  return { pts, now: cur, was, lm: at(endLast), pct: was ? ((cur - was) / was) * 100 : 0 };
}

/** dish types in the order the site shows them (cravings first) */
export const typeOrder = () => C.cravings.concat(Object.keys(C.types).filter(id => !C.cravings.includes(id)));
