'use client';
/* The sections of a restaurant page, top to bottom. Ported from archive/prototype/app/app.js (same class names). */
import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Pic, Pill, RailX, Rise, Seg, Spice, Stars, useMounted } from '@/components/ui/bits';
import { AddBtn, Coupon, ECard, PriceOf, RCard } from '@/components/cards/cards';
import { RvCard, filterRv } from '@/components/cards/review';
import { needSign, openDish } from '@/components/cards/actions';
import { MapBox } from '@/components/media/map';
import { S, useApp } from '@/lib/store';
import { useLiveReviews } from '@/lib/demo-db';
import { C, EASE, checkedLabel, clock, mapUrl, openState, ratingSpread, src, srcSet, waUrl } from '@/lib/khabo';
import type { Deal, Dish, KhaboEvent, Restaurant, RestaurantCard, Review, Text } from '@/lib/data/types';
import type { I18n } from '@/lib/i18n/core';
import { W } from './words';
import { InlinePano } from './pano-inline';
import { photoCats, reducedMotion, type RMini, type RvAllX, type WriteX } from './util';
import { specialOf } from '@/lib/special';

/* ---------- follow the restaurant ---------- */
const handleOf = (k: string, url: string) => {
  try { const p = new URL(url).pathname.split('/').filter(Boolean).pop() || ''; return p ? (k === 'facebook' ? p : '@' + p.replace(/^@/, '')) : ''; } catch { return ''; }
};
function Social({ r, compact }: { r: Restaurant; compact?: boolean }) {
  const i = useI();
  const s = r.social; if (!s || !s.links) return null;
  const keys = Object.keys(C.socials).filter(k => s.links[k] && s.links[k].url); if (!keys.length) return null;
  /* the restaurant's main network first, then the rest in khabo's usual order */
  const main = s.main && keys.includes(s.main) ? s.main : keys[0], list = [main, ...keys.filter(k => k !== main)];
  return (
    <div className={clsx('social', compact && 'compact')}>
      {compact ? null : <h3 className="soc-h">{i.t('follow_r', { r: i.L(r.name) })}</h3>}
      <div className="soc-g">
        {list.map(k => {
          const z = s.links[k], nw = C.socials[k], h = handleOf(k, z.url);
          return (
            <a key={k} className={'soc soc-' + k} href={z.url} target="_blank" rel="noopener nofollow" aria-label={`${nw.en}${z.n ? ', ' + i.t('followers', { n: i.dg(z.n) }) : ''}`}>
              <span className="soc-i"><I n={nw.icon} f /></span>
              <span className="soc-t"><b>{nw.en}</b><small>{z.n ? i.t('followers', { n: i.dg(z.n) }) : h}</small></span>
              <I n="arrow-up-right" b cls="soc-go" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- about the place ---------- */
export function Intro({ r }: { r: Restaurant }) {
  const i = useI();
  const rows: [string, React.ReactNode][] = [
    [i.t('prices'), <span key="p" className="okl"><I n="check-circle" f />{checkedLabel(i, r.checked)}</span>],
    [i.t('on_the_bill'), i.t('vat_plus', { v: i.N(r.vat), s: i.N(r.service) })],
    [i.t('hours'), `${clock(i, r.hours[0])} ${i.t('to')} ${clock(i, r.hours[1])}`],
  ];
  if (r.seats) rows.push([i.t('seats'), `${i.N(r.seats)}${r.fac.includes('cabin') ? ', ' + i.t('has_cabins').toLowerCase() : ''}`]);
  rows.push([i.t('address'), i.L(r.spot)]);
  if (r.since) rows.push([i.t('since_label'), i.dg(r.since)]);
  return (
    <section className="intro">
      <Rise>
        <h2>{i.t('about_r', { r: i.L(r.name) })}</h2>
        <p>{i.L(r.story)}</p>
        <Social r={r} />
      </Rise>
      <Rise d={1} className="info">{rows.map(([a, b]) => <div key={a}><small>{a}</small><b>{b}</b></div>)}</Rise>
    </section>
  );
}

/* ---------- sold out, and how many photos and films a dish has ---------- */
/** the + button, or a greyed one that does nothing when the dish is sold out today */
function Add({ r, d, cls }: { r: RMini; d: Dish; cls?: string }) {
  const i = useI();
  if (!d.out) return <AddBtn r={r} d={d} cls={cls} house />;
  return <button type="button" className={clsx(cls || 'addc', 'off')} disabled aria-label={i.t('sold_out') + ': ' + i.L(d.name)} onClick={ev => ev.stopPropagation()}><I n="plus" b /></button>;
}
export const SoldOut = () => { const i = useI(); return <span className="soldp">{i.t('sold_out')}</span>; };
/** "4 photos · 2 films", or null when the dish has one thing (or nothing) to show */
export function mediaLabel(i: I18n, d: Dish) {
  const g = d.gallery || [];
  const ph = (d.p ? 1 : 0) + g.filter(z => z.kind === 'photo').length, fl = (d.video ? 1 : 0) + g.filter(z => z.kind === 'video').length;
  if (ph + fl < 2) return null;
  const n = (k: number, one: Text, many: Text) => (k === 1 ? i.L(one) : i.L(many).replace('{n}', i.N(k)));
  return [ph ? n(ph, W.onePhoto, W.nPhotos) : '', fl ? n(fl, W.oneFilm, W.nFilms) : ''].filter(Boolean).join(' · ');
}

/* ---------- the dishes the place is known for ---------- */
export function Signature({ r, mini }: { r: Restaurant; mini: RMini }) {
  const i = useI();
  const ds = (r.signature || []).map(id => r.menu.find(d => d.id === id)).filter((d): d is Dish => !!d);
  if (!ds.length) return null;
  return (
    <section className="sig">
      <div className="wrap">
        <RailX head={<Rise as="h2" className="rh2">{i.t('signature')}</Rise>} cls="sig-rail">
          {ds.map(d => (
            <article key={d.id} className={clsx('sig-c', d.out && 'is-out')} role="button" tabIndex={0} aria-label={i.L(d.name)}
              onClick={() => openDish(mini, d, { house: true })} onKeyDown={ev => { if (ev.key === 'Enter') openDish(mini, d, { house: true }); }}>
              <Pic id={d.p} w={760} alt={i.L(d.name)} tone={r.theme} icon={C.types[d.type]?.i} sizes="(max-width: 860px) 82vw, 380px" />
              <div className="row">
                <div style={{ minWidth: 0 }}><b>{i.L(d.name)}</b><small>{d.out ? <span className="soldp">{i.t('sold_out')}</span> : null}{i.L(d.por)}{d.d3 ? ' · ' + i.t('in_3d') : d.video ? ' · ' + i.t('has_video') : ''}</small></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><PriceOf d={d} short /><Add r={mini} d={d} cls="add-r" /></div>
              </div>
            </article>
          ))}
        </RailX>
      </div>
    </section>
  );
}

/* ---------- deals and events ---------- */
export function RDeals({ r, deals }: { r: Restaurant; deals: Deal[] }) {
  const i = useI();
  const all = deals.map(d => ({ r, d, k: r.id + '/' + d.id }));
  if (!all.length) return null;
  if (all.length === 1) return <section className="sec" id="deals"><Rise><Coupon x={all[0]} big place={false} /></Rise></section>;
  return (
    <section className="sec" id="deals">
      <RailX head={<h2 className="h3">{i.t('nav_deals')} <span className="meta" style={{ fontWeight: 500 }}>{i.t('n_deals', { n: i.N(all.length) })}</span></h2>} cls="cp-rail">
        {all.map(z => <Coupon key={z.k} x={z} place={false} />)}
      </RailX>
    </section>
  );
}
export function REvents({ r, events }: { r: Restaurant; events: KhaboEvent[] }) {
  const i = useI();
  if (!events.length) return null;
  return (
    <section className="sec" id="events">
      <Rise as="h2" className="rh2">{i.tx('events')}</Rise>
      <div className="ev-g" style={{ marginTop: 22 }}>{events.map(ev => <ECard key={ev.id} x={{ r, ev, k: ev.id }} place={false} />)}</div>
    </section>
  );
}

/* ---------- the menu: category tabs that follow your reading, search, rows with the + button ---------- */
export function RMenu({ r, mini }: { r: Restaurant; mini: RMini }) {
  const i = useI(), mounted = useMounted();
  const [q, setQ] = useState(''), [cat, setCat] = useState(r.cats[0]?.id);
  const catsRef = useRef<HTMLDivElement>(null), lock = useRef(0);
  const qq = q.trim().toLowerCase(), hit = (d: Dish) => !qq || (d.name.en + ' ' + d.name.bn).toLowerCase().includes(qq);
  const groups = r.cats.map(c => ({ c, ds: r.menu.filter(d => d.cat === c.id && hit(d)) })).filter(g => g.ds.length);
  const jumpCat = (id: string, at: number) => {
    setCat(id); lock.current = at + 900;
    const el = document.getElementById('mc-' + id);
    if (el) el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };
  /* the chosen category follows the reading position (paused for a moment after a tap) */
  const ids = r.cats.map(c => c.id).join();
  useEffect(() => {
    let raf = 0;
    const list = ids.split(',');
    const check = () => {
      raf = 0; if (performance.now() < lock.current) return;
      const bar = catsRef.current?.parentElement; if (!bar) return;
      const line = bar.getBoundingClientRect().bottom + 24;
      let c = list[0];
      for (const id of list) { const el = document.getElementById('mc-' + id); if (el && el.getBoundingClientRect().top < line) c = id; }
      setCat(c);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    addEventListener('scroll', on, { passive: true });
    return () => { removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, [ids]);
  useEffect(() => {
    const box = catsRef.current, el = box?.querySelector<HTMLElement>('button.on');
    if (!box || !el || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({ left: Math.max(0, el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [cat]);
  const open = (d: Dish) => openDish(mini, d, { house: true });
  /* today's special goes first; it depends on today's date (Dhaka), so it shows once the page has loaded */
  const special = mounted && !qq ? specialOf(r) : [];
  const row = (d: Dish) => { const ml = mediaLabel(i, d); return (
    <article key={d.id} className={clsx('mi', d.out && 'is-out')} tabIndex={0} role="button" aria-label={i.L(d.name)}
      onClick={() => open(d)} onKeyDown={ev => { if (ev.key === 'Enter' && ev.target === ev.currentTarget) open(d); }}>
      <div style={{ minWidth: 0 }}>
        <b>{i.L(d.name)}</b>{d.out ? <SoldOut /> : d.best ? <span className="best">{i.t('best_seller')}</span> : null}
        <div className="bnl">{i.bn ? d.name.en : d.name.bn}</div>
        <div className="srv">{i.L(d.por)}{d.spice ? <> · <Spice n={d.spice} /></> : null}{d.veg ? <> · <span className="veg"><I n="leaf" f />{i.t('veg')}</span></> : null}</div>
        {d.desc ? <p>{i.L(d.desc)}</p> : null}
        <div className="pr"><PriceOf d={d} />{d.d3 && !d.p ? <span className="tagm"><I n="cube" />3D</span> : null}{ml ? <span className="tagm"><I n="images" />{ml}</span> : d.video ? <span className="tagm"><I n="play" f />{i.t('video')}</span> : null}</div>
      </div>
      {d.p ? <div className="mi-ph"><Pic id={d.p} w={260} alt="" sizes="108px" />{d.d3 ? <button type="button" className="mi-3d" aria-label={i.t('in_3d')} onClick={ev => { ev.stopPropagation(); openDish(mini, d, { house: true, tab: 'd3' }); }}><I n="cube" b />3D</button> : null}<Add r={mini} d={d} /></div> : <div className="mi-add"><Add r={mini} d={d} /></div>}
    </article>
  ); };
  return (
    <section className="sec" id="menu">
      <div className="menu-h">
        <div>
          <Rise as="h2" className="rh2">{i.t('menu')}</Rise>
          <p className="meta" style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span className="okl"><I n="check-circle" f />{checkedLabel(i, r.checked)}</span><span>{i.t('menu_note', { v: i.N(r.vat), s: i.N(r.service) })}</span>
          </p>
        </div>
        <label className="tb-q"><I n="magnifying-glass" /><input type="search" value={q} onChange={ev => setQ(ev.target.value)} placeholder={i.t('search_menu')} aria-label={i.t('search_menu')} /></label>
      </div>
      <div className="mtools">
        <div className="mcats" ref={catsRef}>
          {r.cats.map(c => (
            <button key={c.id} className={cat === c.id ? 'on' : ''} onClick={ev => jumpCat(c.id, ev.timeStamp)}>
              {cat === c.id ? <Pill id="mcat" /> : null}{i.L(c)}<em>{i.N(r.menu.filter(d => d.cat === c.id).length)}</em>
            </button>
          ))}
        </div>
      </div>
      {special.length ? (
        <div className="mgrp spx" id="mc-special">
          <h3 className="mcat-h"><I n="star" f />{i.t('today_special')}</h3>
          {r.special?.note ? <p className="spx-note">{i.L(r.special.note)}</p> : null}
          <div className="mlist">{special.map(row)}</div>
        </div>
      ) : null}
      {groups.length ? groups.map(({ c, ds }) => (
        <div key={c.id} id={'mc-' + c.id} className="mgrp">
          <h3 className="mcat-h">{i.L(c)}</h3>
          <div className="mlist">
            {ds.map(row)}
          </div>
        </div>
      )) : <p className="meta" style={{ marginTop: 24 }}>{i.t('menu_none')}</p>}
    </section>
  );
}

/* ---------- step inside: the 360 rooms ---------- */
export function RTour({ r }: { r: Restaurant }) {
  const i = useI(), set = useApp(s => s.set);
  const rooms = r.tour || [];
  const [room, setRoom] = useState(rooms[0]?.id);
  if (!rooms.length) return null;
  const rm = rooms.find(z => z.id === room) || rooms[0];
  return (
    <section className="sec" id="inside">
      <Rise as="h2" className="rh2">{i.t('step_inside')}</Rise>
      <p className="sub">{i.t('tour_sub', { d: i.L(r.mediaDate || C.updated) })}</p>
      <div style={{ position: 'relative', marginTop: 22 }}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={rm.pano} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.18 } }} transition={{ duration: 0.35, ease: EASE }}>
            <InlinePano pano={rm.pano} label={i.L(rm)} />
          </m.div>
        </AnimatePresence>
        <button className="btn btn-glass full-b" onClick={() => set({ tour: { r: { id: r.id, name: r.name, theme: r.theme, mono: r.mono }, rooms, room: rm.id } })}><I n="corners-out" b />{i.t('full_screen')}</button>
      </div>
      {rooms.length > 1 ? (
        <div className="rooms">
          {rooms.map(z => (
            <button key={z.id} className={clsx('room', z.id === rm.id && 'on')} onClick={() => setRoom(z.id)} aria-pressed={z.id === rm.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {z.id === rm.id ? <Pill id="room" /> : null}<img src={src(`pv:${z.pano}:a`, 200)} alt="" loading="lazy" />{i.L(z)}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ---------- the kitchen film ---------- */
export function RKitchen({ r }: { r: Restaurant }) {
  const i = useI(), set = useApp(s => s.set);
  const k = r.kitchen; if (!k) return null;
  const ph = (k.photos || []).slice(0, 2);
  return (
    <section className="sec" id="kitchen">
      <Rise as="h2" className="rh2">{i.t('kitchen_title')}</Rise>
      <p className="sub">{i.t('kitchen_sub')}</p>
      <div className={clsx('kit', !ph.length && 'solo')}>
        <m.button whileTap={{ scale: 0.97 }} onClick={() => set({ film: { film: { src: k.src, poster: k.poster, sub: i.L(k.date) } as { src: string; poster: string; sub: string }, title: i.t('kitchen_of', { r: i.L(r.name) }) } })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(k.poster, 1400)} srcSet={srcSet(k.poster, 900)} sizes="(max-width: 760px) 100vw, 760px" alt="" loading="lazy" />
          <span className="play"><I n="play" f /><span><b>{i.t('watch_kitchen')}</b><small>{i.L(k.date)}</small></span></span>
        </m.button>
        {ph.map((p, x) => (
          <button key={p} onClick={() => set({ lb: { pics: k.photos!, i: x, title: i.t('kitchen_of', { r: i.L(r.name) }) } })} aria-label={i.t('photos')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(p, 700)} srcSet={srcSet(p, 400)} sizes="(max-width: 760px) 50vw, 380px" alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- photos by place ---------- */
export function RPhotos({ r }: { r: Restaurant }) {
  const i = useI(), set = useApp(s => s.set);
  const cats = photoCats(i, r);
  const [tab, setTab] = useState(cats[0]?.[0]);
  if (!cats.length) return null;
  const cur = cats.some(c => c[0] === tab) ? tab : cats[0][0];
  const list = r.gallery[cur as keyof Restaurant['gallery']] || [];
  const shown = list.length >= 5 ? 5 : list.length >= 3 ? 3 : list.length, more = list.length - shown;
  return (
    <section className="sec" id="photos">
      <div className="sec-head">
        <div><Rise as="h2" className="rh2">{i.t('photos')}</Rise><p className="meta" style={{ marginTop: 8 }}>{i.t('photos_date', { d: i.L(r.mediaDate || C.updated) })}</p></div>
        <Seg id="ptab" items={cats.map(([c, l]) => [c, l, i.N((r.gallery[c as keyof Restaurant['gallery']] || []).length)])} value={cur} onChange={setTab} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={cur} className={clsx('pg', 'n' + shown)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.3, ease: EASE }}>
          {list.slice(0, shown).map((p, x) => (
            <button key={p + x} className={x === 0 ? 'big' : ''} onClick={() => set({ lb: { pics: list, i: x, title: cats.find(c => c[0] === cur)?.[1] } })} aria-label={i.t('photos') + ' ' + i.dg(x + 1)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(p, x === 0 ? 1200 : 600)} srcSet={srcSet(p, x === 0 ? 800 : 400)} sizes={x === 0 ? '(max-width: 760px) 100vw, 600px' : '(max-width: 760px) 50vw, 300px'} alt="" loading="lazy" />
              {x === shown - 1 && more > 0 ? <span className="more">+{i.N(more)}</span> : null}
            </button>
          ))}
        </m.div>
      </AnimatePresence>
    </section>
  );
}

/* ---------- reviews ---------- */
export function RReviews({ r, mini, reviews }: { r: Restaurant; mini: RMini; reviews: Review[] }) {
  const i = useI(), set = useApp(s => s.set), myRv = useApp(s => s.myRv);
  const [f, setF] = useState('all');
  const list = useLiveReviews(reviews);
  const ds = useMemo(() => ratingSpread(r.rating), [r.rating]);
  const mine = myRv.filter(v => v.r === r.id).map(v => ({ ...v, own: true }));
  const items = [...(f === 'all' ? mine : []), ...filterRv(list, f)];
  const RVF: [string, string][] = [['all', i.t('rv_all')], ['verified', i.t('verified_visit')], ['photos', i.t('with_photos')], ['bn', 'বাংলায়']];
  const write = () => needSign(() => S().set({ write: { r: { ...mini, menu: r.menu.map(d => ({ id: d.id, name: d.name })) } as RMini & WriteX } }));
  return (
    <section className="sec" id="reviews">
      <div className="sec-head"><Rise as="h2" className="rh2">{i.t('reviews')}</Rise><Seg id="rvf" items={RVF} value={f} onChange={setF} /></div>
      <div className="rvs">
        <Rise className="rv-sum">
          <div className="big"><b>{i.N(r.rating)}</b><div><div className="stars"><Stars n={Math.round(r.rating)} /></div><p className="meta">{i.t('rv_counts', { n: i.N(r.reviews), v: i.N(r.verified) })}</p></div></div>
          <div className="dist">
            {ds.map((p, k) => (
              <div key={k}><span>{i.N(5 - k)} ★</span>
                <span className="tr"><m.i style={{ width: p + '%', transformOrigin: '0 50%' }} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: k * 0.06, ease: EASE }} /></span>
                <span>{i.N(p)}%</span>
              </div>
            ))}
          </div>
          <button className="btn btn-own btn-lg" onClick={write}><I n="chat-circle-dots" />{i.t('write_review')}</button>
          <p className="meta">{i.t('verified_how')}</p>
        </Rise>
        <div className="rv-main">
          {items.length ? (
            <div className="rv-grid">{items.slice(0, 4).map((v, k) => <RvCard key={v.who + k + f} v={v} r={r} clamp />)}</div>
          ) : <div className="empty"><I n="chat-circle-dots" /><b>{i.t('no_reviews')}</b></div>}
          <div className="rv-acts">
            <button className="btn btn-line" onClick={() => set({ rvAll: { r: { ...mini, reviews: r.reviews, verified: r.verified } as RMini & RvAllX, list } })}><I n="list-bullets" />{i.tx('see_all_rv')}</button>
            <span className="meta">{i.tx('showing', { n: i.N(Math.min(4, items.length)), t: i.N(r.reviews) })}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- how to get there ---------- */
export function RVisit({ r }: { r: Restaurant }) {
  const i = useI(), m = useMounted();
  const os = m ? openState(i, r) : null;
  return (
    <section className="sec" id="info">
      <Rise as="h2" className="rh2">{i.t('visit')}</Rise>
      <div className="visit">
        <Rise className="vmap">
          <MapBox list={[{ id: r.id, geo: r.geo, mono: r.mono, name: r.name, theme: r.theme }]} single />
          <a className="btn btn-white btn-sm gm" href={mapUrl(r)} target="_blank" rel="noopener"><I n="arrow-up-right" b />{i.t('open_gmaps')}</a>
        </Rise>
        <Rise d={1} className="vinfo">
          <div className="vi wide">
            <h3>{i.t('address')}</h3><p className="big">{i.L(r.address)}</p>
            <div className="vi-btns">
              <a className="btn btn-own" href={mapUrl(r)} target="_blank" rel="noopener"><I n="navigation-arrow" />{i.t('directions')}</a>
              <a className="btn btn-line" href={'tel:' + r.phone}><I n="phone" />{i.t('call')}</a>
              <a className="btn btn-line" href={waUrl(r)} target="_blank" rel="noopener"><I n="whatsapp-logo" />WhatsApp</a>
            </div>
          </div>
          <div className="vi">
            <h3>{i.t('hours')}</h3><p className="big">{clock(i, r.hours[0])} {i.t('to')} {clock(i, r.hours[1])}</p>
            <p>{os ? <span className={os.open ? 'open' : 'closed'}>{os.open ? i.t('open_now') : i.t('closed_now')}</span> : <span>&nbsp;</span>}<span className="meta">{os ? ', ' : ''}{i.t('every_day').toLowerCase()}</span></p>
          </div>
          <div className="vi"><h3>{i.t('payment')}</h3><p className="big">{r.pay.join(', ')}</p><p className="meta">{i.t('vat_plus', { v: i.N(r.vat), s: i.N(r.service) })}</p></div>
          {r.social && r.social.links ? <div className="vi wide"><h3>{i.t('follow_short')}</h3><Social r={r} compact /></div> : null}
          <div className="vi wide">
            <h3>{i.t('facilities')}</h3>
            {r.fac.length ? <ul className="fac">{r.fac.filter(f => C.facilities[f]).map(f => <li key={f}><I n={C.facilities[f].i} />{i.L(C.facilities[f])}</li>)}</ul> : <p className="meta">{i.t('fac_none')}</p>}
          </div>
        </Rise>
      </div>
    </section>
  );
}

/* ---------- more places nearby ---------- */
export function RMore({ r, more }: { r: Restaurant; more: RestaurantCard[] }) {
  const i = useI();
  if (!more.length) return null;
  return (
    <section className="sec">
      <RailX head={<h2 className="h2">{i.t('more_near', { a: i.L(C.areas.find(a => a.id === r.area)) })}</h2>} cls="rc-rail">
        {more.map(z => <RCard key={z.id} r={z} plain />)}
      </RailX>
    </section>
  );
}
