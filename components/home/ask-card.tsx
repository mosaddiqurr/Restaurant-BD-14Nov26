'use client';
/* One answer card from Ask Mama: a meal plan (tap to load it as your bill), a dish, or a restaurant.
   Used by the home page demo and by the Ask Mama sheet. */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { toast } from '@/lib/toast';
import { useI } from '@/components/providers/i18n';
import { I, Pic, Tk } from '@/components/ui/bits';
import { useHref } from '@/components/shell/nav';
import { openDish } from '@/components/cards/actions';
import { S, useApp } from '@/lib/store';
import { C, areaOf, where } from '@/lib/khabo';
import type { AskCard, AskRest } from '@/lib/ask';
import type { RestaurantMini } from '@/lib/data/types';
import type { I18n } from '@/lib/i18n/core';

const MLink = m.create(Link);
const W = { use: { en: 'Use this plan', bn: 'এই প্ল্যান নিন' } };

const miniOf = (r: AskRest): RestaurantMini => {
  const { hero: _h, ppl: _p, ...m } = r;
  void _h; void _p;
  return m;
};

/** put a plan on the bill, open the restaurant, then show the bill */
export function applyPlan(c: Extract<AskCard, { kind: 'plan' }>, i: I18n, go: (path: string) => void) {
  const st = S(), r = miniOf(c.r);
  st.clearBill(r.id);
  c.lines.forEach(([d, k]) => st.add(r, d, k));
  st.set({ ai: null, people: c.people });
  toast(i.t('bill_loaded'));
  go('/r/' + r.id);
  setTimeout(() => S().set({ billOpen: r.id }), 900);
}

/** the rating, and "Featured" when the place pays to be shown first, so a diner can always tell */
function Meta({ r }: { r: { rating: number; featured?: boolean } }) {
  const i = useI();
  return <span className="opt-meta"><I n="star" f cls="opt-star" />{i.N(r.rating)}{r.featured ? <> · <span className="opt-feat">{i.t('featured')}</span></> : null}</span>;
}

export function AiCard({ c }: { c: AskCard }) {
  const i = useI(), href = useHref(), router = useRouter();
  const set = useApp(s => s.set);
  if (c.kind === 'plan') {
    return (
      <m.button className="opt-c" whileTap={{ scale: 0.97 }} onClick={() => applyPlan(c, i, p => router.push(href(p)))}>
        <Pic id={c.r.hero} w={120} tone={c.r.theme} sizes="52px" />
        <span>
          <b>{i.L(c.r.name)}</b>
          <small>{c.lines.map(([d, k]) => `${i.N(k)} × ${i.L(d.name)}`).join(', ')}</small>
          <em className="opt-go">{i.L(W.use)}<I n="arrow-right" b /></em>
        </span>
        <span className="price-w"><Tk v={c.total} /><small>{i.tx('each', { v: i.tk(c.pp) })}</small></span>
      </m.button>
    );
  }
  if (c.kind === 'dish') {
    const r = c.d.rest;
    return (
      <m.button className="opt-c" whileTap={{ scale: 0.97 }} onClick={() => { set({ ai: null }); openDish(r, c.d); }}>
        <Pic id={c.d.p} w={120} tone={r.theme} icon={C.types[c.d.type]?.i} sizes="52px" />
        <span><b>{i.L(c.d.name)}</b><small>{i.L(r.name)}, {i.L(areaOf(r.area))}<Meta r={r} /></small></span>
        <span className="price-w"><Tk v={c.d.price} /><small>{i.L(c.d.por)}</small></span>
      </m.button>
    );
  }
  return (
    <MLink className="opt-c" href={href('/r/' + c.r.id)} onClick={() => set({ ai: null })} whileTap={{ scale: 0.97 }}>
      <Pic id={c.r.hero} w={120} tone={c.r.theme} sizes="52px" />
      <span><b>{i.L(c.r.name)}</b><small>{where(i, c.r)}<Meta r={c.r} /></small></span>
      <span className="price-w"><Tk v={c.r.ppl[0]} to={c.r.ppl[1]} /><small>{i.t('per_person')}</small></span>
    </MLink>
  );
}

/** "Checking menus and prices" with a light passing over the words */
export const Thinking = () => {
  const i = useI();
  return <span className="shimmer" data-text={i.t('ai_thinking')} role="status">{i.t('ai_thinking')}</span>;
};
