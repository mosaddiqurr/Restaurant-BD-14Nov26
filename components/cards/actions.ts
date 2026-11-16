'use client';
/* Things many parts of the site do: open a dish, add it to the bill, ask for sign in first. */
import { toast } from '@/lib/toast';
import { S } from '@/lib/store';
import type { Dish, DishSize, RestaurantMini } from '@/lib/data/types';
import type { I18n } from '@/lib/i18n/core';

export function openDish(r: RestaurantMini, d: Dish, o: { house?: boolean; tab?: 'photo' | 'video' | 'd3' } = {}) {
  S().set({ dish: { r, d, house: !!o.house, tab: o.tab || 'photo', n: Date.now() } });
}

/** one portion of a dish as its own bill line: "Mutton Kacchi · Half" at the half price.
    Its id is dish~portion, so each portion is counted on its own */
export function sized(d: Dish, s: DishSize): Dish {
  return { ...d, id: `${d.id}~${s.id}`, price: s.price, por: s.por || d.por, sizes: undefined,
    name: { en: `${d.name.en} · ${s.name.en}`, bn: `${d.name.bn} · ${s.name.bn}` } };
}
/** how many plates of a dish are on the bill, counting every portion */
export const plates = (items: Record<string, { q: number }> | undefined, id: string) =>
  items ? Object.entries(items).reduce((n, [k, v]) => n + (k === id || k.startsWith(id + '~') ? v.q : 0), 0) : 0;

export function addDish(i: I18n, r: RestaurantMini, d: Dish) {
  if (d.out) return;
  S().add(r, d, 1);
  /* on the restaurant page the bill bar itself bounces, so no message. Elsewhere one message that is replaced,
     never a stack of them */
  if (typeof document !== 'undefined' && document.querySelector(`.billpill[data-rid="${r.id}"]`)) return;
  toast(`${i.L(d.name)} ${i.t('added_bill')}`, { id: 'bill-add', action: { label: i.tx('undo'), onClick: () => S().add(r, d, -1) } });
}

/** one fewer on the bill (the − of the counter) */
export function lessDish(r: RestaurantMini, d: Dish) { S().add(r, d, -1); }

/** some things (reviews) need an account: sign in first, then carry on */
export function needSign(then: () => void) {
  const st = S();
  if (st.user) then(); else { st.set({ signin: {} }); pending = then; }
}
let pending: (() => void) | null = null;
export const takePending = () => { const p = pending; pending = null; return p; };
