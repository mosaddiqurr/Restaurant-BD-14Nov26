/* What the dish sheet loads after it opens (the core of the sheet shows at once from what the page already has):
   GET /api/dish?r=<restaurant>&d=<dish>
     → the same dish at other places (cheapest first), reviews that mention it, its price log, and "also popular here"
   GET /api/dish?r=<restaurant>
     → the restaurant's dish names (for "What did you order?" when writing a review) */
import type { NextRequest } from 'next/server';
import { getDishes, getPriceLogFor, getRestaurant, getReviews } from '@/lib/data/catalog';
import type { Dish, DishCard, Review, Text } from '@/lib/data/types';

export type DishExtras = {
  others: DishCard[];
  reviews: Review[];
  log: [string, number][] | null;
  also: Dish[];
};
export type MenuNames = { menu: { id: string; name: Text }[] };

const about = (v: Review, name: Text) => (v.ord || []).some(o => o.toLowerCase() === name.en.toLowerCase() || o === name.bn);
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' } });

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams, rid = sp.get('r') || '', did = sp.get('d') || '';
  const r = await getRestaurant(rid);
  if (!r) return json({ error: 'not_found' }, 404);
  if (!did) return json({ menu: r.menu.map(d => ({ id: d.id, name: d.name })) } satisfies MenuNames);
  const d = r.menu.find(z => z.id === did);
  if (!d) return json({ error: 'not_found' }, 404);
  const [dishes, reviews, log] = await Promise.all([getDishes(), getReviews(rid), getPriceLogFor(rid)]);
  const others = dishes.filter(z => z.type === d.type && !z.share).sort((a, b) => a.price - b.price).slice(0, 7);
  const sig = (r.signature || []).map(id => r.menu.find(m => m.id === id)).filter((m): m is Dish => !!m);
  const also = [...sig, ...r.menu.filter(m => m.best)].filter((m, k, a) => m.id !== d.id && a.indexOf(m) === k).slice(0, 4);
  const out: DishExtras = { others, reviews: reviews.filter(v => about(v, d.name)), log: log[rid + '|' + did] || null, also };
  return json(out);
}
