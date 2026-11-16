/* Search for the palette: GET /api/search?q=kacchi → { q, hits }.
   With no words it returns a starting list (top places, signature dishes, areas).
   Dish hits carry the full dish and a small restaurant so the dish sheet can open straight away. */
import type { NextRequest } from 'next/server';
import { getCards, getDishes, getRestaurant, search, type SearchHit } from '@/lib/data/catalog';
import { C, planOf, toMini } from '@/lib/khabo';
import type { Dish, RestaurantMini } from '@/lib/data/types';

export type PaletteHit =
  | Exclude<SearchHit, { kind: 'dish' }>
  | (Extract<SearchHit, { kind: 'dish' }> & { dish: Dish; mini: RestaurantMini });
export type SearchOut = { q: string; hits: PaletteHit[] };

const LIMIT = 6;

async function starting(): Promise<PaletteHit[]> {
  const cards = await getCards();
  const top = cards.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || planOf(b) - planOf(a) || b.rating - a.rating).slice(0, LIMIT);
  const rests: PaletteHit[] = top.map(r => ({ kind: 'rest', id: r.id, name: r.name, area: r.area, city: r.city, hero: r.hero[0], mono: r.mono, theme: r.theme, rating: r.rating }));
  const best = (await getDishes()).filter(d => d.best && !d.out).sort((a, b) => planOf(b.rest) - planOf(a.rest) || b.rest.rating - a.rest.rating);
  /* one signature dish per place, so the list is varied */
  const seen = new Set<string>();
  const dishes: PaletteHit[] = [];
  for (const d of best) {
    if (seen.has(d.r) || dishes.length >= LIMIT) continue;
    seen.add(d.r);
    const { r, rest, ...dish } = d;
    dishes.push({ kind: 'dish', id: d.id, r, name: d.name, price: d.price, p: d.p, rest: rest.name, area: rest.area, theme: rest.theme, mono: rest.mono, dish, mini: rest });
  }
  const count: Record<string, number> = {};
  cards.forEach(c => { count[c.area] = (count[c.area] || 0) + 1; });
  const areas: PaletteHit[] = C.areas.map(a => ({ kind: 'area', id: a.id, name: { en: a.en, bn: a.bn }, city: a.city, n: count[a.id] || 0 }));
  return [...rests, ...dishes, ...areas];
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 80);
  if (!q) return Response.json({ q, hits: await starting() } satisfies SearchOut);
  const raw = await search(q, LIMIT);
  const hits: PaletteHit[] = [];
  for (const h of raw) {
    if (h.kind !== 'dish') { hits.push(h); continue; }
    const r = await getRestaurant(h.r);
    const dish = r?.menu.find(d => d.id === h.id);
    if (r && dish) hits.push({ ...h, dish, mini: toMini(r) });
  }
  return Response.json({ q, hits } satisfies SearchOut);
}
