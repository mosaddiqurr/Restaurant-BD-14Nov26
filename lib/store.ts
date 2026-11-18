'use client';
/* What the diner is doing right now: the bill, the open sheet or dialog, the chosen area, saved reviews.
   The bill, area and own reviews are kept in this browser (localStorage) so a refresh keeps them. */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Dish, Film, Restaurant, RestaurantMini, Review, Text, TourRoom } from './data/types';

export type BillLine = { d: Pick<Dish, 'id' | 'name' | 'price' | 'p' | 'por' | 'type'>; q: number };
export type BillOf = { r: RestaurantMini; items: Record<string, BillLine> };

export type DishOpen = { r: RestaurantMini; d: Dish; house?: boolean; tab?: 'photo' | 'video' | 'd3'; n: number };
export type TourOpen = { r: Pick<Restaurant, 'id' | 'name' | 'theme' | 'mono'>; rooms: TourRoom[]; room?: string };
export type FilmOpen = { film: Film; title: string; sub?: string };
export type LightboxOpen = { pics: string[]; i: number; title?: string };
export type WriteOpen = { r: RestaurantMini; dish?: string; menu?: { id: string; name: Text }[] };

type State = {
  area: string;
  people: number;
  bill: Record<string, BillOf>;
  billOpen: string | null;
  dish: DishOpen | null;
  palette: boolean;
  ai: { q: string } | null;
  /** the restaurant page the diner is on, so Mama knows what "here" means */
  here: { id: string; name: Text } | null;
  signin: { then?: 'write' } | null;
  user: string | null;
  film: FilmOpen | null;
  tour: TourOpen | null;
  lb: LightboxOpen | null;
  rvAll: { r: RestaurantMini & { reviews?: number; verified?: number }; list: Review[]; dish?: Text } | null;
  write: WriteOpen | null;
  myRv: Review[];
  dealOrder: string[];
  set: (o: Partial<State>) => void;
  add: (r: RestaurantMini, d: BillLine['d'], k?: number) => void;
  setQty: (rid: string, did: string, q: number) => void;
  clearBill: (rid: string) => void;
  addReview: (v: Review) => void;
};

export const useApp = create<State>()(persist((set) => ({
  area: 'dhanmondi', people: 2, bill: {}, billOpen: null, dish: null, palette: false, ai: null, here: null, signin: null, user: null,
  film: null, tour: null, lb: null, rvAll: null, write: null, myRv: [], dealOrder: [],
  set: o => set(o),
  add: (r, d, k = 1) => set(s => {
    const cur = s.bill[r.id] || { r, items: {} };
    const items = { ...cur.items };
    const q = Math.max(0, (items[d.id]?.q || 0) + k);
    if (q) items[d.id] = { d: { id: d.id, name: d.name, price: d.price, p: d.p, por: d.por, type: d.type }, q }; else delete items[d.id];
    return { bill: { ...s.bill, [r.id]: { r, items } } };
  }),
  setQty: (rid, did, q) => set(s => {
    const cur = s.bill[rid]; if (!cur) return {};
    const items = { ...cur.items };
    if (q > 0 && items[did]) items[did] = { ...items[did], q }; else delete items[did];
    return { bill: { ...s.bill, [rid]: { ...cur, items } } };
  }),
  clearBill: rid => set(s => { const b = { ...s.bill }; delete b[rid]; return { bill: b }; }),
  addReview: v => set(s => ({ myRv: [v, ...s.myRv] })),
}), {
  name: 'khabo.app',
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ area: s.area, people: s.people, bill: s.bill, user: s.user, myRv: s.myRv, dealOrder: s.dealOrder }),
  skipHydration: true,
}));

export const S = () => useApp.getState();
/** how many plates are on the bill for one restaurant */
export const billCount = (b?: BillOf) => b ? Object.values(b.items).reduce((s, x) => s + x.q, 0) : 0;
export const billSub = (b?: BillOf) => b ? Object.values(b.items).reduce((s, x) => s + x.q * x.d.price, 0) : 0;
