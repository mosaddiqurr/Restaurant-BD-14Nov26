'use client';
/* Restaurant card, dish card, the + button, coupons and event cards. Ported from website/app/app.js. */
import { useEffect, useMemo, useState, type CSSProperties, ViewTransition } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { toast } from '@/lib/toast';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Num, Pic, Tk, useMounted, useNow } from '@/components/ui/bits';
import { useHref } from '@/components/shell/nav';
import { useApp } from '@/lib/store';
import { C, EASE, areaOf, clock, codeOf, cuName, dealDates, dealEnd, dealRing, dealTag, openState, src } from '@/lib/khabo';
import type { Deal, Dish, DishCard, KhaboEvent, RestaurantCard, RestaurantMini } from '@/lib/data/types';
import { addDish, lessDish, openDish, plates } from './actions';

/** the shared name for a restaurant's first photo, so it flies into the top of its page */
const MLink = m.create(Link);

export const coverName = (rid: string) => 'cover-' + rid;

export function RCard({ r, eager }: { r: RestaurantCard; plain?: boolean; eager?: boolean }) {
  const i = useI(), href = useHref();
  const live = useMounted();
  /* open or closed depends on the clock: only in the browser. Reading the clock while the page is built ahead
     of time makes Next.js drop the whole list to a grey placeholder */
  const os = live ? openState(i, r) : null, second = r.hero[1];
  return (
    <MLink href={href('/r/' + r.id)} className="rcard" aria-label={i.L(r.name)} whileTap={{ scale: 0.97 }}>
        <ViewTransition name={coverName(r.id)} share="morph" default="none">
          <Pic id={r.hero[0]} w={760} alt={i.L(r.name)} eager={eager} sizes="(max-width: 600px) 92vw, (max-width: 1080px) 46vw, 380px">
            {second ? // eslint-disable-next-line @next/next/no-img-element
              <img className="alt" src={src(second, 760)} alt="" loading="lazy" decoding="async" ref={el => { if (el && el.complete && el.naturalWidth) el.classList.add('ok'); }} onLoad={e => e.currentTarget.classList.add('ok')} /> : null}
          </Pic>
        </ViewTransition>
        <div className="rc-top">
          <Mono r={r} />
          <div style={{ minWidth: 0 }}>
            <b>{i.L(r.name)}{r.founding ? <I n="seal-check" f /> : null}</b>
            <small>{i.L(areaOf(r.area))}, {r.cuisines.slice(0, 2).map(c => cuName(i, c)).join(', ')}</small>
          </div>
          <span className="rt"><I n="star" f cls="star" />{i.N(r.rating)}</span>
        </div>
        <div className="rc-pr"><span><Tk v={r.ppl[0]} to={r.ppl[1]} /> {i.t('pp_short')}</span>{os ? <span className={os.open ? 'open' : 'closed'}>{os.label}</span> : <span />}</div>
        {r.featured || r.hasTour || r.hasFilm || r.has3d ? (
          <div className="rc-f">
            {r.featured ? <span className="feat">{i.t('featured')}</span> : null}
            {r.hasTour ? <span><I n="virtual-reality" />360°</span> : null}
            {r.hasFilm ? <span><I n="play" />{i.t('film')}</span> : null}
            {r.has3d ? <span><I n="cube" />3D</span> : null}
          </div>
        ) : null}
    </MLink>
  );
}

export function DCard({ d, lowest, house }: { d: DishCard; lowest?: boolean; house?: boolean }) {
  const i = useI();
  const r = d.rest;
  return (
    <m.button className="dc" onClick={() => openDish(r, d, { house })} whileTap={{ scale: 0.97 }}>
      <Pic id={d.p} w={480} alt={i.L(d.name)} tone={r.theme} icon={C.types[d.type]?.i} sizes="(max-width: 600px) 46vw, 240px">
        {d.d3 ? <span className="mk3"><I n="cube" />3D</span> : d.video ? <span className="mk3"><I n="play" f /></span> : null}
      </Pic>
      <div className="dc-t"><b>{i.L(d.name)}</b><PriceOf d={d} short /></div>
      <small><Mono r={r} />{i.L(r.name)}, {i.L(areaOf(r.area))}</small>
      {lowest ? <span className="low"><I n="arrow-down" b /> {i.t('lowest')}</span> : null}
    </m.button>
  );
}

const EMPTY = {} as Record<string, { q: number }>;
/** − n + : once a dish is on the bill, the + becomes a counter (same as the table menu) */
export function Stepper({ i, r, d, q, cls }: { i: ReturnType<typeof useI>; r: RestaurantMini; d: Dish; q: number; cls?: string }) {
  return (
    <span className={cls} onClick={ev => ev.stopPropagation()}>
      <m.button type="button" whileTap={{ scale: 0.9 }} onClick={() => lessDish(r, d)} aria-label={i.t('remove_one') + ': ' + i.L(d.name)}><I n="minus" b /></m.button>
      <b aria-live="polite"><Num v={q} /></b>
      <m.button type="button" whileTap={{ scale: 0.9 }} onClick={() => addDish(i, r, d)} aria-label={i.t('add_one') + ': ' + i.L(d.name)}><I n="plus" b /></m.button>
    </span>
  );
}
/** a dish's price: one price, or each portion with its own price ("Half ৳220 · Full ৳420") */
export function PriceOf({ d, short }: { d: Dish; short?: boolean }) {
  const i = useI();
  if (!d.sizes?.length) return <Tk v={d.price} />;
  if (short) return <span className="psz one"><Tk v={d.sizes[0].price} /><small>{i.L(d.sizes[0].name)}</small></span>;
  return <span className="psz">{d.sizes.map(s => <span key={s.id}><small>{i.L(s.name)}</small><Tk v={s.price} /></span>)}</span>;
}
export function AddBtn({ r, d, cls = 'addc', house }: { r: RestaurantMini; d: Dish; cls?: string; house?: boolean }) {
  const i = useI();
  const q = useApp(s => (s.bill[r.id]?.items || EMPTY)[d.id]?.q || 0);
  const all = useApp(s => plates(s.bill[r.id]?.items, d.id));
  if (d.out) return <span className={clsx(cls, 'out')}>{i.t('sold_out')}</span>;
  /* a dish with portions: + opens the dish so the diner picks Half or Full first; the count shows every portion */
  if (d.sizes?.length) return (
    <m.button className={clsx(cls, all && 'has-n')} whileTap={{ scale: 0.9 }} onClick={ev => { ev.stopPropagation(); openDish(r, d, { house }); }} aria-label={i.t('pick_portion') + ': ' + i.L(d.name)}>
      {all ? <b><Num v={all} /></b> : <I n="plus" b />}
    </m.button>
  );
  if (q) return <Stepper i={i} r={r} d={d} q={q} cls={clsx(cls, 'has', 'stp')} />;
  return (
    <m.button className={cls} whileTap={{ scale: 0.9 }} onClick={ev => { ev.stopPropagation(); addDish(i, r, d); }} aria-label={i.t('add_to_bill') + ': ' + i.L(d.name)}>
      <I n="plus" b />
    </m.button>
  );
}

/* ---------- deals: coupons ---------- */
export function Countdown({ to }: { to: number }) {
  const i = useI();
  const live = useMounted();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);
  if (!live) return <span className="count"><I n="timer" />{i.tx('ends')} <b>&nbsp;</b></span>;
  let s = Math.max(0, Math.floor((to - now) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; const mm = Math.floor(s / 60), ss = s % 60;
  const p2 = (v: number) => i.dg(String(v).padStart(2, '0'));
  return <span className="count"><I n="timer" />{i.tx('ends')} <b>{dd ? i.dg(dd) + (i.bn ? 'দি ' : 'd ') : ''}{p2(hh)}:{p2(mm)}:{p2(ss)}</b></span>;
}

export function Code({ code }: { code: string }) {
  const i = useI();
  const [ok, setOk] = useState(false);
  const copy = (ev: React.MouseEvent) => {
    ev.stopPropagation(); ev.preventDefault();
    navigator.clipboard?.writeText(code).catch(() => {});
    setOk(true); toast(`${i.tx('copied')}: ${code}`); setTimeout(() => setOk(false), 1600);
  };
  return (
    <button className="code" onClick={copy} aria-label={i.tx('copy') + ' ' + code}>{code}
      <span><AnimatePresence mode="popLayout" initial={false}>
        <m.span key={ok ? 'y' : 'n'} style={{ display: 'grid' }} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.2 }}>
          <I n={ok ? 'check' : 'copy'} b />
        </m.span>
      </AnimatePresence></span>
    </button>
  );
}

export function Seal({ d }: { d: Deal }) {
  const i = useI();
  const id = useMemo(() => 'sl' + d.id.replace(/\W/g, ''), [d.id]), ring = dealRing(d), pct = d.was > d.price ? Math.round((d.was - d.price) / d.was * 100) : 0;
  return (
    <span className="seal-w" aria-hidden="true">
      <svg className="seal" viewBox="0 0 100 100">
        <defs><path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
        <circle cx="50" cy="50" r="49" fill="var(--cd)" /><circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" />
        <text fontSize="8.2" fontWeight="800" fill="currentColor" textLength="232" lengthAdjust="spacing"><textPath href={'#' + id}>{ring} ✦ {ring} ✦</textPath></text>
      </svg>
      <span className="seal-c">{pct ? '−' + i.N(pct) + '%' : '✦'}</span>
    </span>
  );
}

export type DealX = { r: Pick<RestaurantCard, 'id' | 'name' | 'mono' | 'theme' | 'area'>; d: Deal; k: string };
export function Coupon({ x, big, place = true, onOpen }: { x: DealX; big?: boolean; place?: boolean; onOpen?: () => void }) {
  const i = useI(), href = useHref();
  const { r, d } = x, save = d.was > d.price ? d.was - d.price : 0;
  /* dates and the countdown depend on today, so they are worked out in the browser */
  const live = useMounted();
  const end = live ? dealEnd(d) : null, dates = live ? dealDates(i, d) : '';
  const body = (
    <>
      <Pic id={d.p} w={big ? 1200 : 760} tone={r.theme} icon="tag" sizes={big ? '(max-width: 720px) 100vw, 600px' : '340px'} />
      <div className="cp-b">
        <h3>{i.L(d)}</h3>
        {d.desc && i.L(d.desc) ? <p>{i.L(d.desc)}</p> : null}
        {d.when && i.L(d.when) ? <p className="cp-when"><I n="clock" />{i.L(d.when)}</p> : null}
        {place ? <span className="cp-by"><Mono r={r} />{i.L(r.name)}, {i.L(areaOf(r.area))}</span> : null}
        <div className="cp-p"><Tk v={d.price} />{save ? <><s>{i.tk(d.was)}</s><span className="cp-save">{i.t('you_save', { v: i.tk(save) })}</span></> : null}</div>
        <div className="cp-f">
          <Code code={codeOf(r, d)} />
          <span className="cp-tag"><I n="tag" />{dealTag(i, d)}{dates ? ' · ' + dates : ''}</span>
          {end ? <Countdown to={end} /> : null}
        </div>
      </div>
      {d.week && big ? <Seal d={d} /> : null}
    </>
  );
  const style = { '--cd': r.theme.deep, '--ca': r.theme.accent } as CSSProperties;
  if (place && !onOpen) {
    return (
      <m.article className={clsx('coupon', big && 'big')} style={style} whileHover={{ y: -3 }} transition={{ duration: 0.25, ease: EASE }}>
        <Link href={href('/r/' + r.id) + '#deals'} className="cp-a" aria-label={i.L(d) + ', ' + i.L(r.name)} />
        {body}
      </m.article>
    );
  }
  return (
    <m.article className={clsx('coupon', big && 'big', !place && 'here')} style={style} onClick={onOpen}>{body}</m.article>
  );
}

/* ---------- events ---------- */
export const ETYPE: Record<string, [{ en: string; bn: string }, string]> = {
  music: [{ en: 'Live music', bn: 'লাইভ মিউজিক' }, 'music-notes'], match: [{ en: 'Match screening', bn: 'খেলা দেখা' }, 'television-simple'],
  iftar: [{ en: 'Iftar special', bn: 'ইফতার স্পেশাল' }, 'moon-stars'], festival: [{ en: 'Festival menu', bn: 'উৎসবের মেনু' }, 'confetti'], other: [{ en: 'Event', bn: 'ইভেন্ট' }, 'calendar-star'],
};
export const evS = (ev: KhaboEvent) => +new Date(ev.start), evE = (ev: KhaboEvent) => +new Date(ev.end);
export function useEvWhen() {
  const i = useI();
  return (ev: KhaboEvent) => {
    const s = new Date(ev.start), en = new Date(ev.end), loc = i.bn ? 'bn-BD' : 'en-GB';
    const day = (x: Date) => `${x.toLocaleDateString(loc, { weekday: 'short' })}, ${i.dm(x)}`;
    const tm = (x: Date) => clock(i, `${x.getHours()}:${String(x.getMinutes()).padStart(2, '0')}`);
    return s.toDateString() === en.toDateString() ? `${day(s)}, ${tm(s)} ${i.t('to')} ${tm(en)}` : `${day(s)} ${i.t('to')} ${day(en)}`;
  };
}
export type EventX = { r: Pick<RestaurantCard, 'id' | 'name' | 'mono' | 'theme' | 'area' | 'city'>; ev: KhaboEvent; k: string };
export function ECard({ x, place = true }: { x: EventX; place?: boolean }) {
  const i = useI(), href = useHref(), when = useEvWhen();
  const { r, ev } = x, ty = ETYPE[ev.type] || ETYPE.other;
  const now = useNow();
  const on = now != null && evS(ev) <= now;
  const inner = (
    <>
      <Pic id={ev.p} w={700} tone={r.theme} icon={ty[1]} sizes="(max-width: 600px) 92vw, 360px" />
      <div className="evc-b"><h3>{i.L(ev)}</h3>
        <p className="evc-when" suppressHydrationWarning><I n={ty[1]} />{i.L(ty[0])} · {when(ev)}{on ? <> · <b className="open">{i.tx('on_now')}</b></> : null}</p>
        {ev.desc && i.L(ev.desc) ? <p className="evc-d">{i.L(ev.desc)}</p> : null}
        <div className="evc-f">{place ? <span className="evc-by"><Mono r={r} />{i.L(r.name)}, {i.L(areaOf(r.area))}</span> : <span />}<span className="evc-p">{ev.price ? i.tx('entry', { v: i.tk(ev.price) }) : i.tx('free_entry')}</span></div>
      </div>
    </>
  );
  const style = { '--rd': r.theme.deep, '--ra': r.theme.accent } as CSSProperties;
  return (
    <m.article className="evc" style={style} whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: EASE }}>
      {place ? <Link href={href('/r/' + r.id) + '#events'} className="cp-a" aria-label={i.L(ev) + ', ' + i.L(r.name)} /> : null}
      {inner}
    </m.article>
  );
}
