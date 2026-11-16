'use client';
/* The restaurant page: film or photo at the top with the name plaque, the key facts, the section bar
   (Call, Directions and Bill fly up into it once it sticks), then every section. Ported from archive/prototype/app/app.js. */
import '@/styles/restaurant-extra.css';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject, ViewTransition } from 'react';
import clsx from 'clsx';
import { AnimatePresence, animate, m as mo } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Num, TNum, Tk, useMounted } from '@/components/ui/bits';
import { coverName } from '@/components/cards/cards';
import { useApp, billCount, billSub, S } from '@/lib/store';
import { needSign } from '@/components/cards/actions';
import { toast } from '@/lib/toast';
import { useIsListed, useLiveRestaurant } from '@/lib/demo-db';
import { NotFoundView } from '@/components/shell/not-found';
import { C, EASE, LL, SPR, areaOf, distKm, liveDealsOf, mapUrl, openState, restFile, src, srcSet, waUrl, where } from '@/lib/khabo';
import type { Restaurant, RestaurantCard, Review } from '@/lib/data/types';
import { eventsOf, miniOf, openBill, photoCats, reducedMotion, scrollToId, tidy, type RMini, type WriteX } from './util';
import { W } from './words';
import { Intro, RDeals, REvents, RKitchen, RMenu, RMore, RPhotos, RReviews, RTour, RVisit, Signature } from './sections';

export type RestProps = { r: Restaurant; reviews: Review[]; more: RestaurantCard[]; dealIds: string[]; evIds: string[] };

export function Rest({ r: r0, reviews, more, dealIds, evIds }: RestProps) {
  const live = useLiveRestaurant(r0);
  /* the khabo team can take a restaurant off the site in the panel */
  const listed = useIsListed(r0.id);
  const r = useMemo(() => tidy(live), [live]);
  const mini = useMemo(() => miniOf(r), [r]);
  const mounted = useMounted();
  /* deals and events start and end by the clock: the server's list first, the browser's own once it has drawn */
  const deals = mounted ? liveDealsOf(r) : (r.deals || []).filter(d => dealIds.includes(d.id));
  const events = mounted ? eventsOf(r) : evIds.map(id => (r.events || []).find(ev => ev.id === id)!).filter(Boolean);
  const srcRef = useRef<HTMLDivElement>(null);

  /* /r/<id>#menu, #deals, #events, #reviews: go there once the page has settled */
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id || !/^[\w-]+$/.test(id)) return;
    /* photos and late text above can still grow after the first jump: line it up again when the scroll ends,
       unless the diner has started scrolling by themselves */
    let tries = 2, quit = false;
    const stop = () => { quit = true; };
    const again = () => {
      const el = document.getElementById(id); if (quit || !el || tries-- <= 0) return;
      const want = (parseFloat(getComputedStyle(el).scrollMarginTop) || 0) + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
      if (Math.abs(el.getBoundingClientRect().top - want) > 6) scrollToId(id);
    };
    const tm = setTimeout(() => scrollToId(id), 420);
    const tm2 = setTimeout(again, 1500), tm3 = setTimeout(again, 2600);
    addEventListener('wheel', stop, { passive: true }); addEventListener('touchstart', stop, { passive: true }); addEventListener('keydown', stop);
    return () => {
      [tm, tm2, tm3].forEach(clearTimeout);
      removeEventListener('wheel', stop); removeEventListener('touchstart', stop); removeEventListener('keydown', stop);
    };
  }, [r0.id]);

  /* the table menu's "Rate your visit" links here with ?open=review: open the review form (sign in first) */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('open') !== 'review') return;
    history.replaceState(null, '', location.pathname + location.hash);
    const tm = setTimeout(() => needSign(() => S().set({ write: { r: { ...mini, menu: r.menu.map(d => ({ id: d.id, name: d.name })) } as RMini & WriteX } })), 500);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r0.id]);

  if (!listed) return <NotFoundView />;
  return (
    <div className="rp" data-font={r.theme.font} style={{ '--rd': r.theme.deep, '--ra': r.theme.accent } as CSSProperties}>
      <RProg r={r} />
      <div className="wrap"><Cover r={r} /><Under r={r} mini={mini} srcRef={srcRef} /></div>
      <RNav r={r} mini={mini} srcRef={srcRef} deals={deals.length > 0} events={events.length > 0} />
      {/* the menu comes first, right under the hours and prices: it is what most diners came for */}
      <div className="wrap">
        {/* the 360° walk-through sits first, right under the section bar: it is the premium thing khabo brings */}
        <RTour r={r} />
        <RMenu r={r} mini={mini} />
        <RDeals r={r} deals={deals} />
        <REvents r={r} events={events} />
        <Intro r={r} />
      </div>
      <Signature r={r} mini={mini} />
      <div className="wrap">
        <RKitchen r={r} />
        <RPhotos r={r} />
        <RReviews r={r} mini={mini} reviews={reviews} />
        <RVisit r={r} />
        <RMore r={r} more={more} />
      </div>
      <BillPill r={r} mini={mini} />
      <Dock r={r} />
    </div>
  );
}

/* ---------- the reading line: a thin line on the bottom edge of the top bar fills in the restaurant's accent as
   you read, and the restaurant's own logo rolls along it like a plate (its initials when it has no logo),
   lined up with the page content (not the screen corner) ---------- */

function RProg({ r }: { r: Restaurant }) {
  const ref = useRef<HTMLDivElement>(null), lane = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current, ln = lane.current; if (!el || !ln) return;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight, pr = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      const x = pr * ln.clientWidth;
      el.style.setProperty('--p', pr.toFixed(4)); el.style.setProperty('--x', x.toFixed(1) + 'px');
      el.style.setProperty('--rot', (x / (Math.PI * 24) * 360).toFixed(1) + 'deg');
      el.classList.toggle('on', pr > 0.003);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); paint();
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="rp-prog-w" aria-hidden="true">
      <div ref={ref} className="rp-prog">
        <div ref={lane} className="rp-prog-lane"><i className="rp-prog-fill" /><span className="rp-prog-mark">
          <span className={clsx('pm-plate', 'rp-logo', !r.brand?.logo && 'mono')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {r.brand?.logo ? <img src={restFile(r.id, r.brand.logo)} alt="" /> : <b>{r.mono}</b>}
          </span>
        </span></div>
      </div>
    </div>
  );
}

/* ---------- the top: the film (or first photo) and the name plaque ---------- */
function Cover({ r }: { r: Restaurant }) {
  const i = useI(), set = useApp(s => s.set), m = useMounted();
  const v = useRef<HTMLVideoElement>(null);
  /* the film plays by itself on every screen, with no sound and no buttons (a still photo for people who turn
     motion off in their phone settings) */
  const [ready, setReady] = useState(false);
  const on = m && !reducedMotion();
  useEffect(() => {
    const el = v.current; if (!el) return;
    el.muted = true; el.defaultMuted = true;
    if (on) { const go = () => { el.play().catch(() => {}); }; go(); el.addEventListener('canplay', go, { once: true }); return () => el.removeEventListener('canplay', go); }
    el.pause();
  }, [on, r.id]);
  const logo = r.brand?.logo ? restFile(r.id, r.brand.logo) : null;
  const pic = r.film ? r.film.poster : r.hero[0];
  const serif = r.theme.font === 'serif' && !i.bn;
  return (
    <div className="cover">
      <ViewTransition name={coverName(r.id)} share="morph" default="none">
        <div className="cover-m">
          {r.film ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(pic, 1600)} srcSet={srcSet(pic, 1200)} sizes="(max-width: 900px) 100vw, 1140px" alt="" fetchPriority="high" />
              <video ref={v} key={r.id} className={clsx(ready && 'on')} src={on || ready ? r.film.src : undefined} muted loop playsInline preload="none" aria-hidden="true" onPlaying={() => setReady(true)} />
            </>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={src(pic, 1600)} srcSet={srcSet(pic, 1200)} sizes="(max-width: 900px) 100vw, 1140px" alt="" fetchPriority="high" />
          )}
        </div>
      </ViewTransition>
      {/* the premium views, said loud on the photo itself: walk inside in 360° */}
      {r.tour?.length ? (
        <div className="cv-x">
          {r.tour?.length ? (
            <button className="cv-360" onClick={() => set({ tour: { r: { id: r.id, name: r.name, theme: r.theme, mono: r.mono }, rooms: r.tour! } })}>
              <span className="cv-ring" aria-hidden="true"><b>360°</b></span>
              <span><b>{i.t('step_inside')}</b><small>{r.tour.length === 1 ? i.L(W.oneRoom) : i.tx('rooms_n', { n: i.N(r.tour.length) })}</small></span>
            </button>
          ) : null}
        </div>
      ) : null}
      {/* the name plaque comes in with a short CSS rise (restaurant-extra.css), so it reads at once, even before the scripts load */}
      <div className="plaq">
        <span className="plaq-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt="" /> : <b>{r.mono}</b>}
        </span>
        <div style={{ minWidth: 0 }}>
          <h1 className={clsx(serif && 'serif')} data-len={i.L(r.name).length > 22 ? 'xl' : i.L(r.name).length > 14 ? 'l' : undefined}>{i.L(r.name)}</h1>
          <p className="bnn">{i.bn ? r.name.en : r.name.bn}</p>
          <i className="plaq-rule" />
          <p className="plaq-tag">{i.L(r.tagline)}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- under the cover: rating, price, open now, where; the tour button and Call, Directions, Bill ---------- */
function Under({ r, mini, srcRef }: { r: Restaurant; mini: RMini; srcRef: RefObject<HTMLDivElement | null> }) {
  const i = useI(), area = useApp(s => s.area), m = useMounted();
  const os = m ? openState(i, r) : null;
  const a = areaOf(area), km = m && a.city === r.city ? distKm(LL[a.id], r.geo) : null;
  const labels = [r.featured ? i.t('featured') : '', r.founding ? i.t('founding') : ''].filter(Boolean);
  const NB = ' ';
  const fact = (k: number, b: React.ReactNode, small: React.ReactNode, go?: string, cls?: string) => (
    <button key={k} className="fact" onClick={go ? () => scrollToId(go) : undefined} tabIndex={go ? 0 : -1} style={{ '--k': k } as CSSProperties}>
      <b className={cls}>{b}</b><small>{small}</small>
    </button>
  );
  const hidePpl = (r as Restaurant & { hidePpl?: boolean }).hidePpl;
  return (
    <div className="under">
      <div>
        <div className="facts">
          {fact(0, <><I n="star" f cls="star" />{i.N(r.rating)}</>, i.t('n_reviews', { n: i.N(r.reviews) }), 'reviews')}
          {hidePpl ? null : fact(1, <Tk v={r.ppl[0]} to={r.ppl[1]} />, i.t('per_person'))}
          {fact(2, os ? (os.open ? i.t('open_now') : i.t('closed_now')) : NB, os ? os.label : NB, 'info', os ? (os.open ? 'open' : 'closed') : undefined)}
          {fact(3, i.L(r.spot), km != null ? i.t('km', { v: i.dg(km < 10 ? km.toFixed(1) : String(Math.round(km))) }) : where(i, r), 'info')}
        </div>
        {labels.length ? <p className="meta" style={{ marginTop: 12 }}>{where(i, r)} · {labels.join(' · ')}</p> : null}
      </div>
      <div className="racts">
        {/* the 360° button now sits big on the cover photo; here only the photos shortcut for places without a tour */}
        {r.tour && r.tour.length ? null : (
          <button className="tour-b" onClick={() => scrollToId('photos')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="th"><img src={src(r.hero[0], 300)} alt="" /><I n="images" /></span>
            <span><b>{i.t('see_photos')}</b><small>{i.t('photos')}</small></span><I n="arrow-right" b cls="go" />
          </button>
        )}
        <div className="racts-2" ref={srcRef}><ActBtns r={r} mini={mini} wa /></div>
      </div>
    </div>
  );
}

/* Call, Directions and Bill (plus WhatsApp beside the film on laptops; phones have it in the bottom dock).
   One set sits beside the film; the section bar has its own small copy that slides in once the bar sticks */
function ActBtns({ r, mini, small, off, wa }: { r: Restaurant; mini: RMini; small?: boolean; off?: boolean; wa?: boolean }) {
  const i = useI();
  const items = useApp(s => billCount(s.bill[r.id]));
  const c = (cls: string) => clsx('btn', cls, small && 'btn-sm'), tab = off ? -1 : 0;
  const k = (n: number) => ({ '--k': n }) as CSSProperties;
  return (
    <>
      <a className={c('btn-line')} style={k(0)} tabIndex={tab} href={'tel:' + r.phone}><I n="phone" />{i.t('call')}</a>
      {wa ? <a className={c('btn-line wa-b')} tabIndex={tab} href={waUrl(r)} target="_blank" rel="noopener"><I n="whatsapp-logo" />WhatsApp</a> : null}
      <a className={c('btn-line')} style={k(1)} tabIndex={tab} href={mapUrl(r)} target="_blank" rel="noopener"><I n="navigation-arrow" />{i.t('directions')}</a>
      <button className={c('btn-own')} style={k(2)} tabIndex={tab} onClick={() => openBill(mini)}>
        <I n="receipt" />{i.t('bill')}
        <AnimatePresence initial={false}>
          {items ? <mo.span key="c" className="bcount" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.2, ease: EASE }}><Num v={items} /></mo.span> : null}
        </AnimatePresence>
      </button>
    </>
  );
}

/* ---------- the section bar. When it sticks under the header, the big buttons beside the film fade up and away
   while the bar's small copies slide in one after another (CSS transitions on opacity and transform only, so they
   never stretch the text and turn around smoothly if you change direction halfway). Phones keep the bottom dock. ---------- */
function RNav({ r, mini, srcRef, deals, events }: { r: Restaurant; mini: RMini; srcRef: RefObject<HTMLDivElement | null>; deals?: boolean; events?: boolean }) {
  const i = useI();
  const tabs = useMemo(() => {
    const t: [string, string][] = [];
    if (r.tour && r.tour.length) t.push(['inside', i.t('inside')]);
    t.push(['menu', i.t('menu')]);
    /* deals and events sit right after the menu on the page, so their tabs do too (only when there are any) */
    if (deals) t.push(['deals', i.t('nav_deals')]);
    if (events) t.push(['events', i.t('events')]);
    if (r.kitchen) t.push(['kitchen', i.t('kitchen')]);
    if (photoCats(i, r).length) t.push(['photos', i.t('photos')]);
    t.push(['reviews', i.t('reviews')], ['info', i.t('visit_short')]);
    return t;
  }, [i, r, deals, events]);
  const [cur, setCur] = useState(tabs[0][0]), [docked, setDocked] = useState(false);
  const navRef = useRef<HTMLDivElement>(null), tabsRef = useRef<HTMLElement>(null);
  const ids = tabs.map(t => t[0]).join();
  /* after a tab tap the underline goes straight to that tab and stays there until the page stops scrolling,
     instead of walking through every section on the way */
  const jump = useRef<{ id: string; until: number } | null>(null);
  const go = (id: string, at: number) => {
    jump.current = { id, until: at + 1400 };
    setCur(id);
    scrollToId(id);
  };

  /* one light scroll listener: is the bar stuck, and which section are we reading */
  useEffect(() => {
    const nav = navRef.current; if (!nav) return;
    let raf = 0, top = parseFloat(getComputedStyle(nav).top) || 68;
    const list = ids.split(',');
    const check = () => {
      raf = 0;
      setDocked(nav.getBoundingClientRect().top <= top + 0.5 && scrollY > 200);
      let c = list[0];
      for (const id of list) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 220) c = id; }
      const j = jump.current;
      if (j && performance.now() < j.until) return;
      jump.current = null;
      setCur(c);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    /* the jump is over as soon as the scroll settles, or the diner touches the page themselves */
    const end = () => { if (jump.current) { jump.current = null; on(); } };
    addEventListener('scrollend', end); addEventListener('wheel', end, { passive: true }); addEventListener('touchstart', end, { passive: true });
    const size = () => { top = parseFloat(getComputedStyle(nav).top) || 68; on(); };
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', size); check();
    return () => {
      removeEventListener('scroll', on); removeEventListener('resize', size); cancelAnimationFrame(raf);
      removeEventListener('scrollend', end); removeEventListener('wheel', end); removeEventListener('touchstart', end);
    };
  }, [ids]);

  /* keep the chosen tab in view on phones, where the bar scrolls sideways */
  useEffect(() => {
    const nav = tabsRef.current, el = nav?.querySelector<HTMLElement>('button.on');
    if (!nav || !el || nav.scrollWidth <= nav.clientWidth) return;
    const left = el.offsetLeft - (nav.clientWidth - el.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [cur]);

  /* the big buttons step aside while the small ones are in the bar */
  useEffect(() => { srcRef.current?.classList.toggle('gone', docked); }, [docked, srcRef]);

  return (
    <div className="rnav" ref={navRef}>
      <div className="wrap">
        <nav aria-label={i.t('sections')} ref={tabsRef}>
          {tabs.map(([id, l]) => (
            <button key={id} className={cur === id ? 'on' : ''} aria-current={cur === id ? 'true' : undefined} onClick={ev => go(id, ev.timeStamp)}>
              {l}{cur === id ? <mo.span layoutId="rnav-ul" className="ul" transition={SPR} /> : null}
            </button>
          ))}
        </nav>
        <div className={clsx('r', docked && 'on')} aria-hidden={!docked}><ActBtns r={r} mini={mini} small off={!docked} /></div>
      </div>
    </div>
  );
}

/* ---------- the floating bill: dish thumbnails and a rolling total ---------- */
function BillPill({ r, mini }: { r: Restaurant; mini: RMini }) {
  const i = useI();
  const b = useApp(s => s.bill[r.id]);
  const lines = b ? Object.values(b.items).filter(z => z.q > 0) : [];
  const count = billCount(b), total = billSub(b) * (1 + (r.vat + r.service) / 100);
  /* each add makes the bar give a small bounce (instead of a message popping up every time) */
  const barRef = useRef<HTMLButtonElement>(null), was = useRef(count);
  useEffect(() => {
    const el = barRef.current, up = count > was.current;
    was.current = count;
    if (!el || !up || reducedMotion()) return;
    const a = animate(el, { scale: [1, 1.06, 1] }, { duration: 0.32, ease: 'easeOut' });
    return () => a.stop();
  }, [count]);
  /* clear the whole bill, with a way back in case it was a slip */
  const clear = () => {
    const keep = S().bill[r.id];
    S().clearBill(r.id);
    toast(i.t('bill_cleared'), { action: { label: i.tx('undo'), onClick: () => S().set({ bill: { ...S().bill, [r.id]: keep } }) } });
  };
  return (
    <div className="billpill" data-rid={r.id}>
      <AnimatePresence>
        {count ? (
          <mo.div key="bp" className="bp" initial={{ y: 90, opacity: 0, scale: 0.94 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 90, opacity: 0, scale: 0.94, transition: { duration: 0.22, ease: EASE } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
            <mo.button ref={barRef} className="bp-open" whileTap={{ scale: 0.97 }} onClick={() => openBill(mini)} aria-label={i.t('view_bill')}>
              <span className="thumbs">
                <AnimatePresence initial={false}>
                  {lines.slice(-4).map(z => (
                    <mo.span key={z.d.id} layout initial={{ scale: 0.5, opacity: 0, x: -12 }} animate={{ scale: 1, opacity: 1, x: 0 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 30 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {z.d.p ? <img src={src(z.d.p, 80)} alt="" /> : <I n={C.types[z.d.type]?.i || 'fork-knife'} />}
                    </mo.span>
                  ))}
                </AnimatePresence>
              </span>
              <span><TNum k="n_items" n={count} /></span>
              <Tk v={total} flow />
              <span className="go">{i.t('view_bill')}<I n="arrow-right" b /></span>
            </mo.button>
            <button type="button" className="bp-x" onClick={clear} aria-label={i.t('clear_bill')} title={i.t('clear_bill')}><I n="x" b /></button>
          </mo.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ---------- phones: Call, WhatsApp, Directions and Menu, always at the bottom ---------- */
function Dock({ r }: { r: Restaurant }) {
  const i = useI();
  return (
    <nav className="dock" aria-label={i.L(r.name)}>
      <a href={'tel:' + r.phone}><I n="phone" />{i.t('call')}</a>
      <a href={waUrl(r)} target="_blank" rel="noopener"><I n="whatsapp-logo" />WhatsApp</a>
      <a href={mapUrl(r)} target="_blank" rel="noopener"><I n="navigation-arrow" />{i.t('directions')}</a>
      <button className="pri" onClick={() => scrollToId('menu')}><I n="fork-knife" />{i.t('menu')}</button>
    </nav>
  );
}

