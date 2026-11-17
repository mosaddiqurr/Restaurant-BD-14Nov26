'use client';
/* /r/[id]/reviews: every review of one restaurant on its own page. The summary (stars and how they spread),
   filters with how many reviews each one holds, the order (newest, highest, lowest), and the reviews themselves,
   ten more at a time. ?dish=<dish id> shows only reviews that ordered that dish.
   The filters and order sit right on the page (no pop-ups), so they always respond. */
import '@/styles/restaurant-extra.css';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Rise, Seg, Stars } from '@/components/ui/bits';
import { RvCard, aboutDish, filterRv } from '@/components/cards/review';
import { needSign } from '@/components/cards/actions';
import { useHref } from '@/components/shell/nav';
import { S, useApp } from '@/lib/store';
import { useLiveReviews } from '@/lib/demo-db';
import { EASE, ratingSpread } from '@/lib/khabo';
import type { Review, Text } from '@/lib/data/types';
import type { RMini, WriteX } from './util';

const PAGE = 10;
const W = {
  back: { en: 'Back to {r}', bn: '{r}-এ ফিরে যান' },
  about: { en: 'Reviews that ordered {d}', bn: '{d} নিয়েছেন এমন রিভিউ' },
  allDish: { en: 'All reviews', bn: 'সব রিভিউ' },
  more: { en: 'Show {n} more', bn: 'আরও {n}টি দেখুন' },
  sort: { en: 'Order', bn: 'সাজানো' },
};

export function ReviewsPage({ mini, rating, total, verified, menu, reviews, dish }: {
  mini: RMini; rating: number; total: number; verified: number; menu: { id: string; name: Text }[]; reviews: Review[]; dish: { id: string; name: Text } | null;
}) {
  const i = useI(), href = useHref();
  const myRv = useApp(s => s.myRv);
  const [f, setF] = useState('all'), [sort, setSort] = useState('new'), [n, setN] = useState(PAGE);
  const live = useLiveReviews(reviews);
  const mine = useMemo(() => myRv.filter(v => v.r === mini.id).map(v => ({ ...v, own: true })), [myRv, mini.id]);
  const base = useMemo(() => {
    const all: (Review & { own?: boolean })[] = [...mine, ...live];
    return dish ? all.filter(v => aboutDish(v, dish.name)) : all;
  }, [mine, live, dish]);
  const RVF: [string, string][] = [['all', i.t('rv_all')], ['verified', i.t('verified_visit')], ['photos', i.t('with_photos')], ['bn', 'বাংলায়']];
  /* each filter shows how many reviews it holds, so a tap always visibly changes something */
  const count = (k: string) => (k === 'all' ? base.length : filterRv(base, k).length);
  let list = f === 'all' ? base : filterRv(base, f);
  if (sort === 'high') list = list.slice().sort((a, b) => b.st - a.st);
  if (sort === 'low') list = list.slice().sort((a, b) => a.st - b.st);
  const shown = list.slice(0, n);
  const spread = ratingSpread(rating);
  const pick = (fn: (v: string) => void) => (v: string) => { fn(v); setN(PAGE); };
  const write = () => needSign(() => S().set({ write: { r: { ...mini, menu } as RMini & WriteX, dish: dish?.name.en } }));
  return (
    <div className="wrap lp rvp" style={{ '--rd': mini.theme.deep, '--ra': mini.theme.accent } as React.CSSProperties}>
      <Link className="link rvp-back" href={href('/r/' + mini.id) + '#reviews'}><I n="arrow-left" b />{i.L(W.back).replace('{r}', i.L(mini.name))}</Link>
      <div className="rvp-h">
        <Mono r={mini} />
        <div>
          <Rise as="h1" className="h1">{dish ? i.L(W.about).replace('{d}', i.L(dish.name)) : i.tx('all_rv')}</Rise>
          <p className="sub">{i.L(mini.name)}{dish ? <> · <Link className="link" href={href('/r/' + mini.id + '/reviews')}>{i.L(W.allDish)}</Link></> : null}</p>
        </div>
      </div>

      <div className="rvs rvp-body">
        <aside className="rv-sum rvp-sum">
          <div className="big"><b>{i.N(rating)}</b><div><div className="stars"><Stars n={Math.round(rating)} /></div><p className="meta">{i.t('rv_counts', { n: i.N(total), v: i.N(verified) })}</p></div></div>
          <div className="dist">
            {spread.map((p, k) => (
              <div key={k}><span>{i.N(5 - k)} ★</span>
                <span className="tr"><m.i style={{ width: p + '%', transformOrigin: '0 50%' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: k * 0.06, ease: EASE }} /></span>
                <span>{i.N(p)}%</span>
              </div>
            ))}
          </div>
          <button className="btn btn-own btn-lg" onClick={write}><I n="chat-circle-dots" />{i.t('write_review')}</button>
          <p className="meta">{i.t('verified_how')}</p>
        </aside>

        <div className="rvp-main">
          <div className="rvp-tools">
            <Seg id="rvpf" items={RVF.map(([k, l]) => [k, l, i.N(count(k))])} value={f} onChange={pick(setF)} />
            <Seg id="rvps" cls="rvp-sort" items={[['new', i.tx('newest')], ['high', i.tx('high')], ['low', i.tx('low')]]} value={sort} onChange={pick(setSort)} />
          </div>
          <p className="meta rvp-n" aria-live="polite">{i.tx('showing', { n: i.N(shown.length), t: i.N(list.length) })}</p>
          <div className="rvp-list">
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.length ? shown.map((v, k) => (
                <m.div key={v.who + (v.at || '') + v.t.slice(0, 12)} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.26, delay: Math.min(k % PAGE, 6) * 0.03, ease: EASE }}>
                  <RvCard v={v} r={mini} />
                </m.div>
              )) : <m.div key="none" className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><I n="chat-circle-dots" /><b>{i.t('no_reviews')}</b></m.div>}
            </AnimatePresence>
          </div>
          {list.length > n ? (
            <div className="cat-more"><button className="btn btn-line" onClick={() => setN(n + PAGE)}>{i.L(W.more).replace('{n}', i.N(Math.min(PAGE, list.length - n)))}<I n="caret-down" b /></button></div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
