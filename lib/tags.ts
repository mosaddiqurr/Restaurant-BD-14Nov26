/* Dish tags and quick portions. One place for the lists, used by the owner panel (dish editor) and by every place a
   diner sees a dish: the restaurant page menu, Today's special, the table QR menu and the dish sheets.
   "Best seller" is kept as d.best (search and lists rank by it); every other tag lives in d.tags. */
import type { Dish, DishTag, Text } from './data/types';

/** ready-made tags the owner can tap. Their own tags can be typed in too */
export const TAGS: DishTag[] = [
  { id: 'best', en: 'Best seller', bn: 'বেস্ট সেলার' },
  { id: 'chef', en: "Chef's pick", bn: 'শেফের পছন্দ' },
  { id: 'new', en: 'New', bn: 'নতুন' },
  { id: 'must', en: 'Must try', bn: 'অবশ্যই চেখে দেখুন' },
  { id: 'house', en: 'House special', bn: 'হাউস স্পেশাল' },
  { id: 'limited', en: 'Limited', bn: 'সীমিত' },
  { id: 'light', en: 'Light & healthy', bn: 'হালকা ও স্বাস্থ্যকর' },
  { id: 'kids', en: "Kids' favourite", bn: 'বাচ্চাদের প্রিয়' },
];
/** the most tags on one dish: a few say something, many say nothing */
export const TAG_MAX = 3;
/** the longest tag the owner can type, so it fits on a phone next to the dish name */
export const TAG_LEN = 22;

/** a dish's tags in order, Best seller first */
export function tagsOf(d: Pick<Dish, 'best' | 'tags'>): DishTag[] {
  const out: DishTag[] = d.best ? [TAGS[0]] : [];
  for (const t of d.tags || []) if (t.id !== 'best' && !out.some(o => o.id === t.id)) out.push(t);
  return out.slice(0, TAG_MAX);
}

/** quick portions the owner can tap; they can still type their own */
export const PORTIONS: Text[] = [
  { en: 'Serves 1', bn: '১ জন' },
  { en: 'Serves 1 to 2', bn: '১-২ জন' },
  { en: 'Serves 2', bn: '২ জন' },
  { en: 'Serves 3 to 4', bn: '৩-৪ জন' },
  { en: 'Full', bn: 'ফুল' },
  { en: 'Half', bn: 'হাফ' },
  { en: '1 plate', bn: '১ প্লেট' },
  { en: '1 bowl', bn: '১ বাটি' },
  { en: '1 glass', bn: '১ গ্লাস' },
  { en: '1 piece', bn: '১ পিস' },
];
