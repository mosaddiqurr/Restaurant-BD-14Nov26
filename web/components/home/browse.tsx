'use client';
/* Ways in: what you are craving, places open around you, the map, and browse by area, occasion,
   budget, facility or cuisine. Every tile is a real link into the listing pages. */
import { Morph } from '@/components/ui/morph';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { AnimatePresence, m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Pic, Rise, Seg, Tk, RailX, type SegItem } from '@/components/ui/bits';
import { AreaPop } from '@/components/ui/choose';
import { RCard } from '@/components/cards/cards';
import { MapBox, type MapPin } from '@/components/media/map';
import { useHref } from '@/components/shell/nav';
import { useApp } from '@/lib/store';
import { C, EASE, areaOf, isOpen } from '@/lib/khabo';
import type { RestaurantCard } from '@/lib/data/types';
import type { HomeData } from './data';
import { tj, useMinute } from './util';

/* words that are not in messages/*.json yet */
const W = { area: { en: 'Area', bn: 'এলাকা' } };

const MLink = m.create(Link);

/* ---------- what are you craving ---------- */
export function Cravings({ list }: { list: HomeData['cravings'] }) {
  const i = useI(), href = useHref();
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, 12);
  return (
    <section className="sec"><div className="wrap">
      <div className="sec-head">
        <Rise as="h2" className="h2">{i.t('craving')}</Rise>
        <Link className="link" href={href('/dishes')}>{i.t('all_dishes')}<I n="arrow-right" b /></Link>
      </div>
      {/* phones: a row you swipe; "Show all" opens every category downwards as a grid (home-extra.css .cats.all) */}
      <div className={clsx('cats', all && 'all')}>
        <AnimatePresence initial={false}>
          {shown.map((c, k) => {
            const ty = C.types[c.id];
            return (
              <MLink key={c.id} href={href('/dishes', { type: c.id })} className="cat"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                transition={{ duration: 0.24, delay: (k % 6) * 0.03, ease: EASE }} whileTap={{ scale: 0.97 }}>
                <Pic id={c.pic} w={420} sizes="(max-width: 900px) 31vw, 180px">
                  {c.pic ? null : <span className="cat-np"><I n={ty?.i || 'fork-knife'} /></span>}
                </Pic>
                <b>{i.L(ty)}</b>
                <span>{tj(i, 'from_price', { p: <Tk v={c.lo} /> })}</span>
              </MLink>
            );
          })}
        </AnimatePresence>
      </div>
      {list.length > 12 ? (
        <div className="cat-more">
          <button className="btn btn-line" onClick={() => setAll(!all)} aria-expanded={all}>
            {all ? i.t('show_less') : i.t('show_all_cats', { n: i.N(list.length) })}<I n={all ? 'caret-up' : 'caret-down'} b />
          </button>
        </div>
      ) : null}
    </div></section>
  );
}

/* ---------- open around you ---------- */
export function Near({ near, areaCount }: { near: Record<string, RestaurantCard[]>; areaCount: Record<string, number> }) {
  const i = useI(), href = useHref(), min = useMinute();
  const area = useApp(s => s.area);
  const a = areaOf(area);
  const [bud, setBud] = useState('all');
  const rs = useMemo(() => {
    let l = near[a.city] || [];
    const b = C.budgets.find(z => z.id === bud);
    if (b) l = l.filter(r => r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0));
    /* places in the chosen area first, then the ones open right now (only known in the browser), then rating */
    const now = new Date(min * 60000);
    return l.slice().sort((p, q) => Number(q.area === a.id) - Number(p.area === a.id) || (min ? Number(isOpen(q, now)) - Number(isOpen(p, now)) : 0) || q.rating - p.rating);
  }, [near, a, bud, min]);
  /* heading with the "all restaurants" button beside it on laptops (under it on phones),
     then the area switcher and the budget tabs on one tidy row */
  const head = (
    <div className="near-h">
      <h2 className="h2 near-t rise"><Morph>{i.t('near_title', { a: i.L(a) })}</Morph></h2>
      <Link className="btn btn-line near-all" href={href('/restaurants', { city: a.city })}>
        {i.t('all_in_city', { c: i.L(C.cities[a.city]) })}<I n="arrow-right" b />
      </Link>
      <div className="near-tools">
        <AreaPop cls="area-sw" counts={areaCount}>
          <I n="map-pin" f /><span className="area-sw-k">{i.L(W.area)}</span><b>{i.L(a)}</b><I n="caret-down" b />
        </AreaPop>
        <Seg id="nearbud" items={[['all', i.t('any_budget')], ...C.budgets.map(z => [z.id, i.L(z)] as SegItem)]} value={bud} onChange={setBud} />
      </div>
    </div>
  );
  return (
    <section className="sec"><div className="wrap">
      {/* changing the budget or area swaps the cards in place: the row stays, cards that stay slide to their
          new spot, new ones fade in, gone ones fade out */}
      <RailX head={head} cls="rc-rail">
        <AnimatePresence mode="popLayout" initial={false}>
          {rs.length ? rs.map(r => (
            <m.div key={r.id} className="rc-slot" layout="position" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
              <RCard r={r} />
            </m.div>
          )) : (
            <m.div key="none" className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><I n="bowl-food" /><p>{i.t('no_budget_area')}</p></m.div>
          )}
        </AnimatePresence>
      </RailX>
    </div></section>
  );
}

/* ---------- the map ---------- */
export function MapSec({ pins, cities }: { pins: Record<string, MapPin[]>; cities: string[] }) {
  const i = useI(), href = useHref();
  const area = useApp(s => s.area);
  const [picked, setPicked] = useState<string | null>(null);
  /* follows the chosen area until the diner picks a city here */
  const city = picked && pins[picked] ? picked : (pins[areaOf(area).city] ? areaOf(area).city : cities[0]);
  return (
    <section className="sec"><div className="wrap">
      <div className="sec-head">
        <div><Rise as="h2" className="h2">{i.t('map_title')}</Rise><Rise as="p" className="sub" d={1}>{i.t('map_sub')}</Rise></div>
        {cities.length > 1 ? <Seg id="mapcity" items={cities.map(c => [c, i.L(C.cities[c]), i.N(pins[c].length)] as SegItem)} value={city} onChange={setPicked} /> : null}
      </div>
      <div className="map">
        <MapBox list={pins[city] || []} />
        <span className="map-hint"><I n="hand-pointing" />{i.t('map_hint')}</span>
      </div>
      <div className="map-foot">
        <Link className="btn btn-pri" href={href('/restaurants', { city })}>{i.t('all_in_city', { c: i.L(C.cities[city]) })}<I n="arrow-right" b /></Link>
      </div>
    </div></section>
  );
}

/* ---------- browse every way ---------- */
/* Every tab is a grid of real photo tiles: the name and how many places match. One big tile leads,
   and a few wide ones fill the rows so the grid always ends flush (4 columns on laptops, 2 on phones). */
type Tile = { k: string; to: string; pic: string | null; name: string; sub: string; blurb?: string };
/** laptop layout: 1 big tile (2x2) + w wide tiles (2x1) so the cells add up to full rows of 4 */
const shape = (n: number, k: number) => {
  if (n < 4) return '';
  const w = (((1 - n) % 4) + 4) % 4;
  return k === 0 ? 'big' : k > n - 1 - w ? 'wide' : '';
};
export function Hub({ hub }: { hub: HomeData['hub'] }) {
  const i = useI(), href = useHref();
  const [tab, setTab] = useState('areas');
  /* tiles are there from the start; after a tab change the new ones settle in quickly */
  const [moved, setMoved] = useState(false);
  const tiles = (): Tile[] => {
    if (tab === 'areas') return hub.areas.map(z => {
      const a = areaOf(z.id);
      return { k: z.id, to: href('/restaurants', { area: z.id }), pic: z.pic, name: i.L(a), sub: `${i.L(C.cities[a.city])}, ${i.t('n_places', { n: i.N(z.n) })}`, blurb: i.L(a.blurb) };
    });
    if (tab === 'cuisines') return hub.cuisines.map(z => ({ k: z.id, to: href('/dishes', { cu: z.id }), pic: z.pic, name: i.L(C.cuisines.find(c => c.id === z.id)), sub: i.t('n_dishes_places', { d: i.N(z.d), p: i.N(z.p) }) }));
    if (tab === 'occasions') return hub.occasions.map(z => ({ k: z.id, to: href('/restaurants', { occ: z.id }), pic: z.pic, name: i.L(C.occasions.find(o => o.id === z.id)), sub: i.t('n_places', { n: i.N(z.n) }) }));
    if (tab === 'budget') return hub.budgets.map(z => ({ k: z.id, to: href('/restaurants', { bud: z.id }), pic: z.pic, name: i.L(C.budgets.find(b => b.id === z.id)), sub: `${i.t('per_person')}, ${i.t('n_places', { n: i.N(z.n) })}` }));
    return hub.facilities.map(z => ({ k: z.id, to: href('/restaurants', { fac: [z.id] }), pic: z.pic, name: i.L(C.facilities[z.id]), sub: i.t('n_places', { n: i.N(z.n) }) }));
  };
  const list = tiles();
  return (
    <section className="sec"><div className="wrap">
      <div className="sec-head">
        <Rise as="h2" className="h2">{i.t('browse_all')}</Rise>
        <Seg id="hub" items={[['areas', i.t('areas')], ['occasions', i.t('occasions')], ['budget', i.t('budget')], ['facilities', i.t('facilities')], ['cuisines', i.t('cuisines')]]} value={tab} onChange={v => { setMoved(true); setTab(v); }} />
      </div>
      {/* old and new grids share one cell, so the new tab fades in while the old one fades out */}
      <div className="hub-x">
        <AnimatePresence initial={false}>
          <m.div key={tab} className={clsx('hub-g hub-m', (list.length - (list.length >= 4 ? 1 : 0)) % 2 === 1 && 'odd')} role="tabpanel"
            initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.22, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.14, ease: EASE } }}>
            {list.map((z, k) => {
              const sh = shape(list.length, k);
              return (
                <MLink key={z.k} href={z.to} className={clsx('hub-t', sh)}
                  initial={moved ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: Math.min(k, 8) * 0.025, ease: EASE }}
                  whileTap={{ scale: 0.97 }}>
                  <Pic id={z.pic} w={sh === 'big' ? 900 : 520} word={z.name} sizes={sh === 'big' ? '(max-width: 900px) 92vw, 560px' : '(max-width: 900px) 46vw, 280px'} />
                  <span className="hub-tx"><b>{z.name}</b><span>{z.sub}</span>{z.blurb && sh === 'big' ? <p>{z.blurb}</p> : null}</span>
                </MLink>
              );
            })}
          </m.div>
        </AnimatePresence>
      </div>
    </div></section>
  );
}
