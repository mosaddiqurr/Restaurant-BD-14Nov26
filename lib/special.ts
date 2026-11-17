/* Today's special: which of a restaurant's dishes show as special right now. One place for the rule, used by the
   restaurant page, the table QR menu and the owner panel. Days are counted in Dhaka time, so "today only" ends at
   midnight in Bangladesh whatever clock the phone has. */
import type { Dish, Restaurant } from './data/types';

/** today's date in Dhaka as 'YYYY-MM-DD' */
export const dhakaDay = (at: number | Date = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);

/** the most dishes a special can have: enough for a small row, few enough to still feel special */
export const SPECIAL_MAX = 6;

/** is the special switched on for this day? (a special with an end day stops after that day) */
export const specialOn = (r: Pick<Restaurant, 'special'>, day = dhakaDay()) => {
  const s = r.special;
  return !!s && s.ids.length > 0 && (!s.until || day <= s.until);
};

/** the special dishes to show today, in the order the owner picked them. Deleted dishes drop out by themselves */
export function specialOf<D extends Dish>(r: Pick<Restaurant, 'special'> & { menu: D[] }, day = dhakaDay()): D[] {
  if (!specialOn(r, day)) return [];
  return r.special!.ids.map(id => r.menu.find(d => d.id === id)).filter((d): d is D => !!d);
}
