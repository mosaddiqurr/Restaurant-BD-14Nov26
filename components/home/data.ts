/* What the home page needs, worked out on the server from the whole catalog, so the browser only gets
   small, ready-to-draw props. Kept for a while like the catalog itself ('use cache'), so the page stays
   static and deals or events that start or end today still show or hide on time. */
import 'server-only';
import { getCards, getCuisineStats, getDishes, getEvents, getLiveDeals, getRestaurant, getRestaurants, getTypeOrder, getTypeStats } from '@/lib/data/catalog';
import { answer, demoQuestion } from '@/lib/ask';
import { C, matchR, planOf, src, toMini } from '@/lib/khabo';
import type { Dish, Lang, Restaurant, RestaurantCard } from '@/lib/data/types';

/* The khabo team's picks for the "see it before you go" boxes.
   If a pick is missing (or loses that media), the best Premium partner that has it is used. */
const SHOWCASE = { tour: ['kathgolap'], d3: ['cha-adda'], kitchen: ['shahi-handi'], bill: ['shahi-handi'] };
const BILL_DISH = 'mutton-kacchi';
/** dish types the price check can switch between */
const PRICE_TYPES = ['kacchi', 'biryani', 'kebab', 'fuchka', 'thali'];
/** how many cards per city the "open around you" rail can choose from */
const NEAR_CAP = 40;

const byPlan = <T extends { plan: Restaurant['plan']; rating: number }>(a: T, b: T) => planOf(b) - planOf(a) || b.rating - a.rating;

async function pick(ids: string[], has: (r: Restaurant) => boolean) {
  for (const id of ids) { const r = await getRestaurant(id); if (r && has(r)) return r; }
  return (await getRestaurants()).filter(has).sort(byPlan)[0] || null;
}

/** a card without the long search words (the home page never searches cards) */
const lite = (c: RestaurantCard): RestaurantCard => ({ ...c, hay: '' });

export async function getHomeData(lang: Lang) {
  'use cache';
  const rs = await getRestaurants();
  const cards = (await getCards()).map(lite);
  const ranked = rs.slice().sort(byPlan);

  /* hero: a slow wall of real photos (restaurant fronts, signature dishes, rooms) */
  const seen = new Set<string>(), wall: string[] = [];
  const add = (id?: string | null) => { if (id && !seen.has(id) && !id.startsWith('ph:')) { seen.add(id); wall.push(id); } };
  ranked.forEach(r => { add(r.hero[0]); (r.signature || []).forEach(s => add(r.menu.find(z => z.id === s)?.p)); });
  ranked.forEach(r => add(r.gallery.inside?.[1]));

  const partners = ranked.slice(0, 30).map(r => ({ id: r.id, mono: r.mono, theme: r.theme, name: r.name }));

  /* cravings: every dish type, cravings first, with its lowest single-plate price */
  const st = await getTypeStats();
  const cravings = (await getTypeOrder()).map(id => ({ id, lo: st[id].lo, pic: st[id].pic }));

  /* open around you: the best cards of each city (the browser sorts them by the chosen area) */
  const cities = Object.keys(C.cities).filter(c => cards.some(r => r.city === c));
  const near: Record<string, RestaurantCard[]> = {};
  const pins: Record<string, { id: string; geo: [number, number]; mono: string; name: Restaurant['name']; theme: Restaurant['theme'] }[]> = {};
  for (const c of cities) {
    const inCity = cards.filter(r => r.city === c);
    near[c] = inCity.slice().sort((a, b) => b.rating - a.rating).slice(0, NEAR_CAP);
    pins[c] = inCity.map(r => ({ id: r.id, geo: r.geo, mono: r.mono, name: r.name, theme: r.theme }));
  }

  /* browse every way: counts per area, cuisine, budget and facility */
  const areaCount: Record<string, number> = {};
  cards.forEach(c => { areaCount[c.area] = (areaCount[c.area] || 0) + 1; });
  const cu = await getCuisineStats();
  const full = new Map(rs.map(r => [r.id, r]));
  const ds = await getDishes();
  /* Every tile gets a real photo from the places (or dishes) it leads to, best plan first.
     A photo is used once per tab where possible, so the grid never repeats the same picture. */
  const real = (id?: string | null) => !!id && !id.startsWith('ph:');
  const roomPics = (r: Restaurant) => [...(r.gallery.inside || []), ...(r.tour || []).map(t => `pv:${t.pano}:a`), ...(r.gallery.outside || []), ...r.hero];
  const foodPics = (r: Restaurant) => [...(r.signature || []).map(s => r.menu.find(d => d.id === s)?.p), ...(r.gallery.food || []), ...r.menu.filter(d => d.best).map(d => d.p)];
  const chooser = () => {
    const used = new Set<string>();
    return (lists: (string | null | undefined)[][]) => {
      /* the first photo in the given order that this tab has not shown yet */
      const flat = lists.flat().filter((z): z is string => !!z && !!src(z));
      const id = flat.find(z => !used.has(z)) || flat[0] || null;
      if (id) used.add(id);
      return id;
    };
  };
  const placesOf = (ok: (c: RestaurantCard) => boolean) => cards.filter(ok).sort(byPlan).map(c => full.get(c.id)!).filter(Boolean);
  const pOcc = chooser(), pBud = chooser(), pFac = chooser(), pCu = chooser();
  const hub = {
    areas: C.areas.map(a => ({ id: a.id, n: areaCount[a.id] || 0, pic: cards.filter(r => r.area === a.id).sort(byPlan)[0]?.hero[0] || null })).filter(z => z.n),
    occasions: C.occasions.map(o => {
      const ps = placesOf(c => matchR(c, { occ: o.id }));
      return { id: o.id, n: ps.length, pic: pOcc(ps.map(roomPics)) };
    }).filter(z => z.n),
    cuisines: C.cuisines.map(c => {
      const list = ds.filter(d => C.types[d.type]?.cu === c.id).sort((a, b) => planOf(b.rest) - planOf(a.rest) || Number(!!b.best) - Number(!!a.best));
      return { id: c.id, d: cu[c.id]?.d || 0, p: cu[c.id]?.p || 0, pic: pCu([
        /* the cuisine's own dishes (real photos, then studio shots), then food from places that cook it */
        list.map(d => d.p).filter(real), [c.p], list.map(d => d.p), ...placesOf(r => r.cuisines.includes(c.id)).map(r => foodPics(r).filter(real)),
      ]) };
    }).filter(z => z.d),
    budgets: C.budgets.map(b => {
      const ps = placesOf(r => r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0));
      return { id: b.id, n: ps.length, pic: pBud([...ps.map(r => foodPics(r).filter(real)), ...ps.map(foodPics)]) };
    }).filter(z => z.n),
    facilities: Object.keys(C.facilities).map(id => {
      const ps = placesOf(r => r.fac.includes(id));
      return { id, n: ps.length, pic: pFac(ps.map(roomPics)) };
    }).filter(z => z.n),
  };

  /* Ask khabo: the sample question and its real answer */
  const q = demoQuestion(lang);
  const ai = { q, a: answer(q, lang, rs) };

  /* see it before you go */
  const tr = await pick(SHOWCASE.tour, r => !!r.tour?.length);
  const tour = tr && tr.tour ? { r: { id: tr.id, name: tr.name, theme: tr.theme, mono: tr.mono }, rooms: tr.tour, still: `pv:${tr.tour[0].pano}:a` } : null;
  const cr = await pick(SHOWCASE.d3, r => r.menu.some(d => d.d3));
  const cakeDish = cr?.menu.find(d => d.d3 && d.best) || cr?.menu.find(d => d.d3);
  const cake = cr && cakeDish ? { r: toMini(cr), d: cakeDish } : null;
  const kr = await pick(SHOWCASE.kitchen, r => !!r.kitchen);
  const kitchen = kr && kr.kitchen ? { name: kr.name, src: kr.kitchen.src, poster: kr.kitchen.poster, date: kr.kitchen.date } : null;
  const br = await pick(SHOWCASE.bill, r => r.menu.some(d => !d.share && !d.out));
  const bd = br ? br.menu.find(d => d.id === BILL_DISH) || br.menu.find(d => d.best && !d.share) || br.menu.find(d => !d.share) : null;
  const bill = br && bd ? { r: { id: br.id, name: br.name, mono: br.mono, theme: br.theme, vat: br.vat, service: br.service }, d: { name: bd.name, price: bd.price }, n: 4 } : null;

  /* deals: every live deal, Premium first (the browser applies the khabo team's order on top) */
  const deals = (await getLiveDeals()).map(z => ({ r: { id: z.r.id, name: z.r.name, mono: z.r.mono, theme: z.r.theme, area: z.r.area, plan: z.r.plan, rating: z.r.rating }, d: z.d, k: z.k, i: z.i }));

  /* upcoming events (ended ones are dropped here and again in the browser) */
  const t = Date.now();
  const events = (await getEvents()).filter(z => +new Date(z.ev.end) > t).slice(0, 12)
    .map(z => ({ r: { id: z.r.id, name: z.r.name, mono: z.r.mono, theme: z.r.theme, area: z.r.area, city: z.r.city }, ev: z.ev, k: z.k }));

  /* price check: one dish across town */
  const price = PRICE_TYPES.map(id => {
    const list = ds.filter(d => d.type === id && !d.share).sort((a, b) => a.price - b.price);
    if (!list.length) return null;
    const pr = list.map(d => d.price), lo = pr[0], hi = pr[pr.length - 1], mid = pr[Math.floor(pr.length / 2)];
    const pos = (p: number) => (hi === lo ? 50 : ((p - lo) / (hi - lo)) * 100);
    /* the dots on the scale: one per price, merged when they sit on top of each other */
    const dm = new Map<number, boolean>();
    pr.forEach(p => { const x = Math.round(pos(p) * 2) / 2; dm.set(x, dm.get(x) || p === mid); });
    const dots = [...dm].map(([x, m]) => ({ x, mid: m }));
    const rows = list.slice(0, 6).map(({ r: _r, rest, ...d }) => { void _r; return { d: d as Dish, r: rest }; });
    return { id, lo, hi, mid, places: new Set(list.map(d => d.r)).size, dots, rows };
  }).filter((z): z is NonNullable<typeof z> => !!z);

  return {
    wall: wall.slice(0, 28), partners, total: cards.length, cravings, cities, near, pins, areaCount, hub, ai,
    see: { tour, cake, kitchen, bill }, deals, events, price,
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
