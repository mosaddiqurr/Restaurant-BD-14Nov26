'use client';
/* "See it before you go": the virtual walkthrough, a dish in 3D, the kitchen on film and the full bill first.
   One big stage shows one of them at a time; the list beside it (a row of chips on phones) switches between
   them. The words live in the list, so the stage is all picture. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m, useInView, useReducedMotion } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Rise, TNum, Tk } from '@/components/ui/bits';
import { Model } from '@/components/media/model';
import { openDish } from '@/components/cards/actions';
import { useApp } from '@/lib/store';
import { EASE, SPR, src } from '@/lib/khabo';
import type { HomeData } from './data';
import { PHONE, useMedia, useSaveData } from './util';

type See = HomeData['see'];

function TourBox({ t }: { t: NonNullable<See['tour']> }) {
  const i = useI();
  const set = useApp(s => s.set);
  return (
    <div className="bx bx-a ph-c">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src(t.still, 1400)} alt="" loading="lazy" decoding="async" />
      <div className="bx-cap">
        <h3>{i.t('bx_tour')}</h3>
        <p>{i.t('bx_tour_sub', { r: i.L(t.r.name) })}</p>
        <button className="btn btn-white" onClick={() => set({ tour: { r: t.r, rooms: t.rooms, room: t.rooms[0]?.id } })}>
          <I n="virtual-reality" />{i.t('step_inside')}
        </button>
      </div>
    </div>
  );
}

function CakeBox({ c }: { c: NonNullable<See['cake']> }) {
  const i = useI();
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: '200px 0px' });
  return (
    <div className="bx bx-b bx-3d">
      <div className="bx-cap"><h3>{i.t('bx_3d')}</h3><p>{i.L(c.d.name)}, {i.L(c.r.name)}</p></div>
      <div className="stage3" ref={ref}>
        {near && c.d.d3 ? <Model id={c.d.d3} compact alt={i.L(c.d.name)} />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={src(c.d.p, 600)} alt="" loading="lazy" decoding="async" />}
      </div>
      <div className="act3">
        <button className="btn btn-pri btn-sm" onClick={() => openDish(c.r, c.d, { tab: 'd3' })}><I n="cube" />{i.t('turn_it')}</button>
      </div>
    </div>
  );
}

/* the kitchen film plays by itself (muted) on laptops while it is on screen. On phones, or with reduced
   motion or data saver, it waits until the diner taps play */
function KitchenBox({ k }: { k: NonNullable<See['kitchen']> }) {
  const i = useI();
  const vref = useRef<HTMLVideoElement>(null);
  const inView = useInView(vref, { margin: '120px 0px' });
  const phone = useMedia(PHONE), reduce = useReducedMotion();
  const saver = useSaveData();
  const [asked, setAsked] = useState<boolean | null>(null);
  const auto = !phone && !reduce && !saver;
  const play = asked ?? auto;
  useEffect(() => {
    const v = vref.current; if (!v) return;
    if (inView && play) {
      v.muted = true; v.playsInline = true;
      if (!v.getAttribute('src')) v.src = k.src;
      v.play().catch(() => {});
    } else v.pause();
  }, [inView, play, k.src]);
  return (
    <div className="bx bx-c ph-c">
      <video ref={vref} muted loop playsInline preload="none" poster={src(k.poster, 900)} aria-label={i.t('kitchen_film')} />
      <div className="bx-cap">
        <h3>{i.t('bx_kitchen')}</h3>
        <p>{i.L(k.name)}. {i.L(k.date)}</p>
        {!auto || asked != null ? (
          <m.button className="btn btn-glass btn-sm" whileTap={{ scale: 0.97 }} onClick={() => setAsked(!play)} aria-pressed={play}>
            <I n={play ? 'pause' : 'play'} f />{i.tx(play ? 'pause' : 'play')}
          </m.button>
        ) : null}
      </div>
    </div>
  );
}

const MAX_N = 12;
/* the bill as a receipt: pick how many plates and every line adds up, VAT and service included */
function BillBox({ b }: { b: NonNullable<See['bill']> }) {
  const i = useI();
  const [n, setN] = useState(b.n);
  const sub = b.d.price * n, vat = (sub * b.r.vat) / 100, svc = (sub * b.r.service) / 100, tot = sub + vat + svc;
  const W = { less: { en: 'One plate less', bn: 'এক প্লেট কম' }, more: { en: 'One plate more', bn: 'এক প্লেট বেশি' }, plates: { en: 'Plates', bn: 'প্লেট' } };
  return (
    <div className="bx bx-d">
      <div className="bill2">
        <div className="bill2-pick">
          <span className="k">{i.L(W.plates)}</span>
          <span className="mb-step big">
            <m.button whileTap={{ scale: 0.9 }} onClick={() => setN(Math.max(1, n - 1))} disabled={n <= 1} aria-label={i.L(W.less)}><I n="minus" b /></m.button>
            <b className="num">{i.N(n)}</b>
            <m.button whileTap={{ scale: 0.9 }} onClick={() => setN(Math.min(MAX_N, n + 1))} disabled={n >= MAX_N} aria-label={i.L(W.more)}><I n="plus" b /></m.button>
          </span>
          <span className="bill2-d">{i.L(b.d.name)}, <Tk v={b.d.price} /></span>
        </div>
        <div className="rcpt">
          <div className="rcpt-h"><Mono r={b.r} /><b>{i.L(b.r.name)}</b></div>
          <div className="rcpt-r"><span>{i.N(n)} × {i.L(b.d.name)}</span><Tk v={sub} flow /></div>
          <div className="rcpt-r m"><span>{i.t('vat')} {i.N(b.r.vat)}%</span><Tk v={vat} flow /></div>
          <div className="rcpt-r m"><span>{i.t('service')} {i.N(b.r.service)}%</span><Tk v={svc} flow /></div>
          <div className="rcpt-r tot"><span>{i.t('total_all_in')}</span><Tk v={tot} flow /></div>
          <div className="rcpt-pp"><span><TNum k="each_of" n={n} /></span><Tk v={tot / n} flow /></div>
        </div>
      </div>
    </div>
  );
}

/* short names for the switch on phones */
const SHORT = {
  tour: { en: 'Walkthrough', bn: 'ওয়াকথ্রু' },
  d3: { en: 'In 3D', bn: '৩ডি' },
  kitchen: { en: 'Kitchen', bn: 'রান্নাঘর' },
  bill: { en: 'Full bill', bn: 'পুরো বিল' },
};
type Part = { id: keyof typeof SHORT; ic: string; h: string; p: ReactNode; box: ReactNode };

export function SeeSec({ see }: { see: See }) {
  const i = useI();
  const { tour, cake, kitchen, bill } = see;
  const parts: Part[] = [];
  if (tour) parts.push({ id: 'tour', ic: 'virtual-reality', h: i.t('bx_tour'), p: i.t('bx_tour_sub', { r: i.L(tour.r.name) }), box: <TourBox t={tour} /> });
  if (cake) parts.push({ id: 'd3', ic: 'cube', h: i.t('bx_3d'), p: <>{i.L(cake.d.name)}, {i.L(cake.r.name)}</>, box: <CakeBox c={cake} /> });
  if (kitchen) parts.push({ id: 'kitchen', ic: 'video-camera', h: i.t('bx_kitchen'), p: <>{i.L(kitchen.name)}. {i.L(kitchen.date)}</>, box: <KitchenBox k={kitchen} /> });
  if (bill) parts.push({ id: 'bill', ic: 'receipt', h: i.t('bx_bill'), p: i.t('bx_bill_sub'), box: <BillBox b={bill} /> });
  const [act, setAct] = useState<string>(parts[0]?.id || '');
  if (!parts.length) return null;
  const cur = parts.find(z => z.id === act) || parts[0];
  return (
    <section className="sec"><div className="wrap">
      <Rise as="h2" className="h2">{i.t('see_title')}</Rise>
      <Rise as="p" className="sub" d={1}>{i.t('see_sub')}</Rise>
      <div className="see">
        <div className="see-nav" role="tablist" aria-label={i.t('see_title')}>
          {parts.map((z, k) => (
            <button key={z.id} type="button" role="tab" id={'see-t-' + z.id} aria-selected={z.id === cur.id} aria-controls="see-stage"
              className={clsx('see-t', z.id === cur.id && 'on')} onClick={() => setAct(z.id)}>
              {z.id === cur.id ? <m.span layoutId="see-on" className="see-on" transition={SPR} /> : null}
              <span className="see-n num">{i.N(k + 1).padStart(2, i.N(0))}</span>
              <span className="see-ic"><I n={z.ic} f={z.id === cur.id} /></span>
              <span className="see-tx"><b>{z.h}</b><span>{z.p}</span></span>
              <span className="see-sh">{i.L(SHORT[z.id])}</span>
            </button>
          ))}
        </div>
        <div className="see-stage" id="see-stage" role="tabpanel" aria-labelledby={'see-t-' + cur.id}>
          <AnimatePresence initial={false} mode="popLayout">
            <m.div key={cur.id} className="see-box" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.18, ease: EASE } }} transition={{ duration: 0.38, ease: EASE }}>
              {cur.box}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </div></section>
  );
}
