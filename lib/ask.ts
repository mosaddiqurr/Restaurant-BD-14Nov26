/* Ask khabo: a small plain-words planner over the real menus. It reads Bangla, English and Banglish
   ("amra 4 jon, 2500 taka, Dhanmondi, family") and answers only from restaurants and prices on Khaoya.
   Runs on the server (app/api/ask and the home page demo) and returns plain cards the browser can draw.
   Ported from archive/prototype/app/app.js (parseQ, meal, answer). Later a real language model can sit in front
   of parseQ; the answer cards stay the same. */
import { C, areaOf, isLate, isOpen, toMini } from './khabo';
import { createI18n } from './i18n/core';
import type { Dish, DishCard, Lang, Restaurant, RestaurantMini } from './data/types';

const BD = '০১২৩৪৫৬৭৮৯';
/** the words people use for each kind of dish, in English, Banglish and Bangla */
const TYPE_WORDS: Record<string, string[]> = {
  kacchi: ['kacchi', 'kachchi', 'kachi', 'কাচ্চি'], biryani: ['biryani', 'biriyani', 'বিরিয়ানি'], tehari: ['tehari', 'তেহারি'],
  kebab: ['kebab', 'kabab', 'chap', 'কাবাব', 'চাপ'], fuchka: ['fuchka', 'phuchka', 'chotpoti', 'ফুচকা', 'চটপটি'], fish: ['fish', 'mach', 'ilish', 'মাছ', 'ইলিশ'],
  thali: ['thali', 'bhorta', 'ভর্তা', 'থালি'], naan: ['naan', 'নান'], polao: ['polao', 'pulao', 'পোলাও'], bakery: ['cake', 'bakery', 'কেক'],
  tea: ['tea', 'coffee', 'চা'], chinese: ['chinese', 'চাইনিজ'], thai: ['thai', 'থাই'], dessert: ['dessert', 'doi', 'mishti', 'দই', 'মিষ্টি'], platter: ['platter', 'প্ল্যাটার'],
};
/** "in Dhanmondi" in Bangla: ধানমন্ডিতে, বগুড়ায়, গুলশানে */
const inBn = (s: string) => (/া$/.test(s) ? s + 'য়' : /[িীুূৃেৈোৌ]$/.test(s) ? s + 'তে' : s + 'ে');
const toAscii = (s: string) => String(s).replace(/[০-৯]/g, c => String(BD.indexOf(c)));

export type AskQuery = {
  people: number; budget: number; area: string | null; city: string | null; type: string | null;
  family: boolean; rooftop: boolean; open: boolean; late: boolean;
};

/** what the person asked for: how many people, budget, area or city, kind of dish, and a few wishes */
export function parseQ(q0: string): AskQuery {
  const q = toAscii(q0).toLowerCase();
  const p: AskQuery = { people: 0, budget: 0, area: null, city: null, type: null, family: false, rooftop: false, open: false, late: false };
  for (const m of q.matchAll(/(\d[\d,]*)\s*(taka|tk|টাকা|৳)?/g)) {
    const v = +m[1].replace(/,/g, '');
    if (!v) continue;
    if (m[2] || v >= 100) { if (!p.budget) p.budget = v; } else if (v <= 30 && !p.people) p.people = v;
  }
  const tkm = q.match(/৳\s*(\d[\d,]*)/);
  if (tkm && !p.budget) p.budget = +tkm[1].replace(/,/g, '');
  C.areas.forEach(a => { if (q.includes(a.en.toLowerCase()) || q.includes(a.bn) || q.includes(a.id.replace('-', ' '))) p.area = a.id; });
  Object.entries(C.cities).forEach(([id, c]) => { if (q.includes(c.en.toLowerCase()) || q.includes(c.bn)) p.city = id; });
  p.family = /family|ফ্যামিলি|পরিবার|parents/.test(q);
  p.rooftop = /rooftop|roof|ছাদ|রুফটপ|date|ডেট/.test(q);
  p.open = /open now|ekhon|এখন খোলা/.test(q);
  p.late = /late|raat|রাত|midnight/.test(q);
  for (const [ty, ws] of Object.entries(TYPE_WORDS)) if (!p.type && ws.some(w => q.includes(w))) p.type = ty;
  return p;
}

/* ---------- the cards an answer carries (plain objects, safe to send to the browser) ---------- */
export type PlanDish = Pick<Dish, 'id' | 'name' | 'price' | 'p' | 'por' | 'type'>;
export type PlanLine = [PlanDish, number];
/** a restaurant with what an answer card shows: first photo and price per person */
export type AskRest = RestaurantMini & { hero: string | null; ppl: [number, number] };
export type AskCard =
  | { kind: 'plan'; r: AskRest; lines: PlanLine[]; total: number; pp: number; people: number }
  | { kind: 'dish'; d: DishCard }
  | { kind: 'rest'; r: AskRest };
export type AskAnswer = { text: string; cards: AskCard[] };

const askRest = (r: Restaurant): AskRest => ({ ...toMini(r), hero: r.hero[0] || null, ppl: r.ppl });
const planDish = (d: Dish): PlanDish => ({ id: d.id, name: d.name, price: d.price, p: d.p, por: d.por, type: d.type });

/** a simple meal at one place: its best main for everyone (of the asked kind, if any), plus a drink each.
    The total has VAT and service in, like the bill */
export function meal(r: Restaurant, ppl: number, type?: string | null) {
  let mains = r.menu.filter(d => !d.share && !d.out && !['drink', 'dessert', 'tea', 'naan', 'snack'].includes(d.type));
  if (type) mains = r.menu.filter(d => d.type === type && !d.share && !d.out);
  if (!mains.length) return null;
  const main = mains.find(d => d.best) || mains.slice().sort((a, b) => a.price - b.price)[0];
  const drink = r.menu.find(d => d.type === 'drink' && !d.out);
  const lines: [Dish, number][] = [[main, ppl], ...(drink ? [[drink, ppl] as [Dish, number]] : [])];
  const sub = lines.reduce((s, [d, k]) => s + d.price * k, 0);
  const total = Math.round(sub * (1 + (r.vat + r.service) / 100));
  return { r, lines, total, pp: Math.round(total / ppl), people: ppl };
}

/** the answer to a question, in the page language, from the given restaurants */
export function answer(q: string, lang: Lang, restaurants: Restaurant[], now = new Date()): AskAnswer {
  const i = createI18n(lang, {});
  const p = parseQ(q), say = (en: string, bn: string) => (lang === 'bn' ? bn : en);
  let rs = restaurants.slice();
  if (p.area) rs = rs.filter(r => r.area === p.area); else if (p.city) rs = rs.filter(r => r.city === p.city);
  if (p.family) rs = rs.filter(r => r.fac.includes('cabin'));
  if (p.rooftop) rs = rs.filter(r => r.fac.includes('rooftop'));
  if (p.open) rs = rs.filter(r => isOpen(r, now));
  if (p.late) rs = rs.filter(isLate);
  const wh = p.area ? i.L(areaOf(p.area)) : p.city ? i.L(C.cities[p.city]) : '';
  const none: AskAnswer = { text: say('I could not find a place that matches all of that yet. Try fewer words, or another area.', 'সব শর্ত মেলে এমন জায়গা এখনো পাইনি। কম কথায় বা অন্য এলাকা দিয়ে চেষ্টা করুন।'), cards: [] };

  /* "kacchi under 400": a kind of dish with a price but no group is about the plate, not a meal plan */
  if (p.type && !p.people) return dishes(p, rs, wh, i, say, none);

  if (p.people || p.budget) {
    const ppl = p.people || 2, fit = (m: { total: number }) => (!p.budget || m.total <= p.budget ? 1 : 0);
    const plans = rs.map(r => meal(r, ppl, p.type)).filter((m): m is NonNullable<typeof m> => !!m).sort((a, b) => fit(b) - fit(a) || b.r.rating - a.r.rating);
    if (!plans.length) return none;
    const best = plans[0], ok = fit(best);
    const text = ok
      ? say(`For ${ppl} people${wh ? ' in ' + wh : ''}${p.budget ? ' with ' + i.tk(p.budget) : ''}, ${best.r.name.en} fits best: about ${i.tk(best.total)} with VAT and service, ${i.tk(best.pp)} each.`,
        `${wh ? inBn(wh) + ' ' : ''}${i.N(ppl)} জনের জন্য${p.budget ? ' ' + i.tk(p.budget) + '-এর মধ্যে' : ''} ${best.r.name.bn} সবচেয়ে ভালো: ভ্যাট আর সার্ভিসসহ প্রায় ${i.tk(best.total)}, জনপ্রতি ${i.tk(best.pp)}।`)
      : say(`With ${i.tk(p.budget)} for ${ppl} it is tight. The closest is ${best.r.name.en}, about ${i.tk(best.total)} with VAT and service.`,
        `${i.N(ppl)} জনের জন্য ${i.tk(p.budget)}-এ একটু টানাটানি। সবচেয়ে কাছাকাছি ${best.r.name.bn}, ভ্যাট আর সার্ভিসসহ প্রায় ${i.tk(best.total)}।`);
    return {
      text,
      cards: plans.slice(0, 3).map(m => ({ kind: 'plan' as const, r: askRest(m.r), lines: m.lines.map(([d, k]) => [planDish(d), k] as PlanLine), total: m.total, pp: m.pp, people: m.people })),
    };
  }

  if (!rs.length) return none;
  rs.sort((a, b) => b.rating - a.rating);
  return {
    text: say(`These are the best rated places${wh ? ' in ' + wh : ''} for that.`, `এর জন্য ${wh ? inBn(wh) + ' ' : ''}সবচেয়ে ভালো রেটিংয়ের জায়গাগুলো।`),
    cards: rs.slice(0, 3).map(r => ({ kind: 'rest' as const, r: askRest(r) })),
  };
}

/** plates of one kind, cheapest first (under the budget, if one was given) */
function dishes(p: AskQuery, rs: Restaurant[], wh: string, i: ReturnType<typeof createI18n>, say: (en: string, bn: string) => string, none: AskAnswer): AskAnswer {
  const all = rs.flatMap(r => r.menu.filter(d => d.type === p.type && !d.share && !d.out).map(d => ({ d, r }))).sort((a, b) => a.d.price - b.d.price);
  if (!all.length) return none;
  const nm = i.L(C.types[p.type!]), ds = p.budget ? all.filter(z => z.d.price <= p.budget) : all;
  const card = ({ d, r }: { d: Dish; r: Restaurant }): AskCard => ({ kind: 'dish', d: { ...d, r: r.id, rest: toMini(r) } });
  if (!ds.length) {
    const lo = all[0];
    return {
      text: say(`No ${nm.toLowerCase()} up to ${i.tk(p.budget)}${wh ? ' in ' + wh : ''} yet. The lowest is ${i.tk(lo.d.price)} at ${lo.r.name.en}.`,
        `${wh ? inBn(wh) + ' ' : ''}${i.tk(p.budget)}-এর মধ্যে এখনো কোনো ${nm} নেই। সবচেয়ে কম ${i.tk(lo.d.price)}, ${lo.r.name.bn}-এ।`),
      cards: all.slice(0, 3).map(card),
    };
  }
  const lo = ds[0];
  return {
    text: say(`${nm}${p.budget ? ' up to ' + i.tk(p.budget) : ''}${wh ? ' in ' + wh : ''}: ${ds.length} ${ds.length === 1 ? 'plate' : 'plates'} on Khaoya. The lowest is ${i.tk(lo.d.price)} at ${lo.r.name.en}.`,
      `${wh ? inBn(wh) + ' ' : ''}${p.budget ? i.tk(p.budget) + '-এর মধ্যে ' : ''}${nm}: খাওয়া-তে ${i.N(ds.length)}টি প্লেট। সবচেয়ে কম ${i.tk(lo.d.price)}, ${lo.r.name.bn}-এ।`),
    cards: ds.slice(0, 3).map(card),
  };
}

/** the sample question the home page types out, in the page language */
export const demoQuestion = (lang: Lang) => (lang === 'bn' ? 'আমরা ৪ জন, ২৫০০ টাকা, ধানমন্ডি, ফ্যামিলি' : 'amra 4 jon, 2500 taka, Dhanmondi, family');
