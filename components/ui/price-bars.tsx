'use client';
/* How a dish's menu prices spread across town, as a row of small bars, cheapest on the left.
   Up to 24 prices: one bar per plate, as tall as its price, so the steps show how far apart places are.
   More than that: the bars become price bands, as tall as the number of places charging about that much.
   The typical price is the gold bar. The bars grow in from the floor when the dish changes.
   Used by the home price check and the price page, on the deep green boxes. */
import clsx from 'clsx';
import { m } from 'motion/react';
import { EASE } from '@/lib/khabo';

const EACH = 24;

export function PriceBars({ prices, lo, hi, mid, id, cls }: { prices: number[]; lo: number; hi: number; mid: number; id: string; cls?: string }) {
  let bars: { h: number; typ: boolean; on: boolean }[];
  if (prices.length <= EACH) {
    const pr = prices.slice().sort((a, b) => a - b), at = pr.indexOf(mid);
    /* the cheapest bar is a third of the height, the dearest is full height */
    bars = pr.map((p, k) => ({ h: hi === lo ? 60 : 32 + (68 * (p - lo)) / (hi - lo), typ: k === at, on: true }));
  } else {
    const n = 16, band = (p: number) => (hi === lo ? Math.floor(n / 2) : Math.min(n - 1, Math.floor(((p - lo) / (hi - lo)) * n)));
    const count = Array.from({ length: n }, () => 0);
    prices.forEach(p => { count[band(p)]++; });
    const top = Math.max(...count, 1), typ = band(mid);
    bars = count.map((c, k) => ({ h: c ? 22 + (78 * c) / top : 8, typ: k === typ, on: c > 0 }));
  }
  return (
    <span className={clsx('pbars', cls)} aria-hidden="true">
      {bars.map((b, k) => (
        <m.i key={id + k} className={clsx(b.typ ? 'typ' : b.on && 'on')} style={{ height: b.h + '%', originY: 1 }}
          initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.04 + Math.min(k, 20) * 0.03, ease: EASE }} />
      ))}
    </span>
  );
}
