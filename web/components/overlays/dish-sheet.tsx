'use client';
/* One dish: a dialog on laptops, a bottom sheet on phones (drag it down to close). Photo, video or 3D on the left,
   then the price, add to bill, how it is made, its price over six months, the same dish at other places,
   and what people said. The core shows at once; the rest comes from /api/dish a moment later.
   Ported from website/app/app.js (DishModal). */
import '@/styles/restaurant-extra.css';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Drawer } from 'vaul';
import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, animate, m, useMotionValue } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Pic, Pill, Spice, Tk } from '@/components/ui/bits';
import { RvCard, aboutDish } from '@/components/cards/review';
import { addDish, needSign, sized } from '@/components/cards/actions';
import { Stepper } from '@/components/cards/cards';
import { Model } from '@/components/media/model';
import { useHref } from '@/components/shell/nav';
import { S, useApp, type DishOpen } from '@/lib/store';
import { useDemoDB, useLiveReviews } from '@/lib/demo-db';
import { C, EASE, checkedLabel, src, where } from '@/lib/khabo';
import type { Dish, DishMedia, DishType, Review, Text } from '@/lib/data/types';
import type { DishExtras } from '@/app/api/dish/route';
import { logOf, reducedMotion, sixMonths, useIsPhone, type RMini, type RvAllX } from '@/components/restaurant/util';
import { W } from '@/components/restaurant/words';

type TypeX = DishType & { ing?: Text[]; side?: Text };
type DishX = Dish & { made?: Text; ing?: Text[]; side?: Text };
const NONE: Review[] = [];

/* each dish's extras are fetched once per visit */
const cache = new Map<string, Promise<DishExtras>>();
function extrasOf(rid: string, did: string) {
  const k = rid + '|' + did;
  let p = cache.get(k);
  if (!p) {
    p = fetch(`/api/dish?r=${encodeURIComponent(rid)}&d=${encodeURIComponent(did)}`).then(x => { if (!x.ok) throw new Error(String(x.status)); return x.json() as Promise<DishExtras>; });
    p.catch(() => cache.delete(k));
    cache.set(k, p);
  }
  return p;
}

/** the last value that was not null, so the sheet keeps its dish while it slides away */
function useKept<T>(v: T | null) {
  const [k, setK] = useState<T | null>(v);
  if (v && v !== k) setK(v);
  return v || k;
}

/* a click on a toast (Undo) must not count as a click outside the sheet */
const onToast = (t: EventTarget | null | undefined) => t instanceof Element && !!t.closest('[data-sonner-toaster]');

type Cur = { r: RMini; d: Dish };
type TitleFn = (c: ReactNode) => ReactNode;

/* Phones get a Vaul drawer (drag down to close, Vaul reads the flick speed); laptops a Base UI dialog
   (focus stays inside, Escape closes, focus goes back, the page stays still). The inside is the same. */
export function DishSheet() {
  const dish = useApp(s => s.dish), set = useApp(s => s.set);
  const o = useKept<DishOpen>(dish);
  const phone = useIsPhone();
  /* the dish on show: starts as the one opened, changes when a row inside is tapped */
  const [cur, setCur] = useState<Cur | null>(null), [seen, setSeen] = useState(-1);
  if (o && o.n !== seen) { setSeen(o.n); setCur({ r: o.r, d: o.d }); }
  const pop = useRef<HTMLDivElement>(null);
  const open = !!dish;
  const close = () => set({ dish: null });
  if (!o || !cur) return null;
  const style = { '--rd': cur.r.theme.deep, '--ra': cur.r.theme.accent } as CSSProperties;
  const cls = clsx('ds', cur.d.out && 'is-out');
  const body = (T: TitleFn) => <DishBody key={'ds' + o.n} o={o} cur={cur} setCur={setCur} phone={phone} T={T} />;

  if (phone) {
    return (
      <Drawer.Root open={open} onOpenChange={v => { if (!v) close(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="ds-back" />
          <Drawer.Content className={clsx(cls, 'ds-v')} style={style} aria-describedby={undefined}
            onPointerDownOutside={ev => { if (onToast(ev.target)) ev.preventDefault(); }}>
            {body(c => <Drawer.Title asChild><h2>{c}</h2></Drawer.Title>)}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }
  return (
    <Dialog.Root open={open} onOpenChange={(v, e) => {
      if (v) return;
      if (e.reason === 'outside-press' && onToast(e.event?.target)) { e.cancel(); return; }
      close();
    }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="ds-back bu" />
        <Dialog.Viewport className="ds-wrap">
          <Dialog.Popup ref={pop} className={clsx(cls, 'ds-dlg')} style={style} initialFocus={pop}>
            {body(c => <Dialog.Title>{c}</Dialog.Title>)}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function DishBody({ o, cur, setCur, phone, T }: { o: DishOpen; cur: Cur; setCur: (c: Cur) => void; phone: boolean; T: TitleFn }) {
  const i = useI(), href = useHref(), router = useRouter();
  const set = useApp(s => s.set), myRv = useApp(s => s.myRv);
  /* every photo and film of the dish in one swipeable strip (main photo, main film, then the gallery), and 3D on its own tab */
  const [tab, setTab] = useState<'media' | 'd3'>(o.tab === 'd3' ? 'd3' : 'media');
  const [at, setAt] = useState(0);
  const [want, setWant] = useState<'photo' | 'video'>(o.tab === 'video' ? 'video' : 'photo');
  const [got, setGot] = useState<{ k: string; v: DishExtras } | null>(null);
  const info = useRef<HTMLDivElement>(null);
  const db = useDemoDB();
  const { r, d } = cur;
  const close = () => set({ dish: null });

  const key = r.id + '|' + d.id, x = got && got.k === key ? got.v : null;
  /* if the price history and reviews fail to load, say so with Try again instead of loading forever */
  const [fail, setFail] = useState(''), [tries, setTries] = useState(0);
  const failed = fail === key && !x;
  useEffect(() => {
    let dead = false;
    extrasOf(r.id, d.id).then(v => { if (!dead) setGot({ k: r.id + '|' + d.id, v }); }).catch(() => { if (!dead) setFail(r.id + '|' + d.id); });
    return () => { dead = true; };
  }, [r.id, d.id, tries]);
  const failNote = (
    <p className="meta ds-fail"><I n="warning" />{i.L(W.loadFail)} <button type="button" className="link" onClick={() => { setFail(''); setTries(t => t + 1); }}>{i.L(W.tryAgain)}</button></p>
  );

  const liveRv = useLiveReviews(x?.reviews || NONE);
  /* a dish with portions: the diner picks one (the first is chosen to start), and the price, the counter and the
     bill line follow that portion */
  const [szId, setSzId] = useState<string | null>(null);
  const sz = d.sizes?.length ? d.sizes.find(z => z.id === szId) || d.sizes[0] : null;
  const pick = sz ? sized(d, sz) : d;
  const qty = useApp(s => s.bill[r.id]?.items[pick.id]?.q || 0);

  const items = mediaOf(d);
  const onlyFilm = items.length === 1 && items[0].kind === 'video';
  const tabs: [typeof tab, ReactNode][] = [['media', onlyFilm ? <><I n="play" f />{i.t('video')}</> : <><I n="image" />{items.length > 1 ? i.t('photos') : i.t('photo')}</>]];
  if (d.d3) tabs.push(['d3', <><I n="cube" />3D</>]);
  const tb = tabs.some(z => z[0] === tab) ? tab : 'media';
  /* opened from a "video" link: start on the film */
  const start = want === 'video' ? Math.max(0, items.findIndex(z => z.kind === 'video')) : 0;
  const onFilm = tb === 'media' && items[Math.min(at, Math.max(0, items.length - 1))]?.kind === 'video';

  const ty = C.types[d.type] as TypeX | undefined, dx = d as DishX;
  const made = dx.made || ty?.made, ing = dx.ing || ty?.ing, side = dx.side || ty?.side;
  const showSpice = d.spice > 0 || !['tea', 'bakery', 'dessert', 'drink'].includes(d.type);
  const isHouse = !!o.house && r.id === o.r.id;
  const others = x?.others || [];
  const lowest = isHouse ? null : others[0];
  const isLowest = !!lowest && lowest.r === r.id && lowest.id === d.id;
  const rest = isHouse ? [] : others.filter(z => !(z.r === r.id && z.id === d.id)).slice(0, 5);
  const more = isHouse ? x?.also || [] : [];
  const revs = [...myRv.filter(v => v.r === r.id && aboutDish(v, d.name)).map(v => ({ ...v, own: true })), ...liveRv];
  const h = x && !isHouse ? sixMonths(logOf(d, x.log || undefined, db.hist?.[r.id + '|' + d.id]), i) : null;
  const tyName = ty ? i.L(ty).toLowerCase() : '';

  const swap = (nr: RMini, nd: Dish) => {
    setCur({ r: nr, d: nd }); setTab('media'); setAt(0); setWant('photo'); setSzId(null);
    info.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toRest = () => { if (isHouse) return; close(); router.push(href('/r/' + r.id)); };
  const media = tb === 'd3'
    ? <div key="m" className="mv-wrap" data-vaul-no-drag=""><Model id={d.d3!} alt={i.L(d.name)} /></div>
    : items.length
      ? <Gallery key={'g' + r.id + d.id + start} items={items} start={start} alt={i.L(d.name)} poster={d.p} onAt={setAt} />
      : <Pic key={'p' + d.id} id={d.p} w={1100} eager alt={i.L(d.name)} word={i.L(d.name)} tone={r.theme} icon={ty?.i} sizes="(max-width: 720px) 100vw, 520px" />;

  return (
    <>
          <div className="ds-media">
            {phone ? <span className="ds-grab" aria-hidden="true" title={i.L(W.dragClose)} /> : null}
            <AnimatePresence mode="popLayout" initial={false}>
              <m.div key={r.id + d.id + tb} style={{ position: 'absolute', inset: 0 }} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.35, ease: EASE }}>
                {media}
              </m.div>
            </AnimatePresence>
            {onFilm ? <span className="ds-note"><I n="video-camera" />{i.t('dish_video_note')}</span> : tb === 'd3' ? <span className="ds-note"><I n="hand-grabbing" />{i.t('d3_hint')}</span> : null}
            {tabs.length > 1 ? (
              <div className="ds-tabs" role="tablist">
                {tabs.map(([id, l]) => (
                  <button key={id} role="tab" aria-selected={tb === id} className={tb === id ? 'on' : ''} onClick={() => { setTab(id); setWant('photo'); setAt(0); }}>{tb === id ? <Pill id="dstab" /> : null}{l}</button>
                ))}
              </div>
            ) : null}
            <button className="ds-close" onClick={close} aria-label={i.t('close')}><I n="x" b /></button>
          </div>
          <div className="ds-info" ref={info}>
            <AnimatePresence mode="wait" initial={false}>
              <m.div key={r.id + d.id} style={{ display: 'grid', gap: 14 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }} transition={{ duration: 0.28, ease: EASE }}>
                <button className="ds-r" onClick={toRest} style={{ cursor: isHouse ? 'default' : 'pointer' }} tabIndex={isHouse ? -1 : 0}>
                  <Mono r={r} /><span style={{ textAlign: 'left' }}><b>{i.L(r.name)}</b><small>{where(i, r)}</small></span>{isHouse ? null : <I n="caret-right" b />}
                </button>
                <div>{T(i.L(d.name))}{d.out ? <span className="soldp big">{i.t('sold_out')}</span> : null}<p className="alt" style={{ marginTop: 4 }}>{i.bn ? d.name.en : d.name.bn}</p></div>
                <div className="ds-meta">
                  <span>{i.L(sz?.por || d.por)}</span>
                  {d.spice ? <span><Spice n={d.spice} />{i.t('spice_' + d.spice)}</span> : null}
                  {d.veg ? <span className="badge b-green"><I n="leaf" f />{i.t('veg')}</span> : null}
                  {d.best ? <span className="badge b-gold">{i.t('best_seller')}</span> : null}
                  {d.share ? <span className="badge b-green"><I n="users-three" />{i.t('for_n', { n: i.N(d.share) })}</span> : null}
                </div>
                {d.desc ? <p className="ds-desc">{i.L(d.desc)}</p> : null}
                {d.sizes?.length ? (
                  <div className="szs" role="radiogroup" aria-label={i.t('portion')}>
                    {d.sizes.map(z => (
                      <button key={z.id} type="button" role="radio" aria-checked={z.id === sz?.id} className={z.id === sz?.id ? 'on' : ''} onClick={() => setSzId(z.id)}>
                        <b>{i.L(z.name)}</b><Tk v={z.price} />
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="buy">
                  <Tk v={pick.price} />
                  {d.out ? <button type="button" className="add-l off" disabled><I n="x-circle" b />{i.t('sold_out')}</button> : (
                    qty ? <Stepper i={i} r={r} d={pick} q={qty} cls="add-l stp big" /> : (
                      <m.button className="add-l" whileTap={{ scale: 0.97 }} onClick={() => addDish(i, r, pick)}>
                        <I n="plus" b /> {i.t('add_to_bill')}
                      </m.button>
                    )
                  )}
                </div>
                <div className="fresh">
                  <span className="ok"><I n="check-circle" f />{checkedLabel(i, r.checked)}</span>
                  {isLowest ? <span className="badge b-green">{i.t('lowest_in', { d: tyName })}</span> : null}
                </div>
                {made || ing || side ? (
                  <div className="ds-sec"><h3>{i.t('about_dish')}</h3>
                    <dl className="about-d">
                      {made ? <><dt>{i.t('how_made')}</dt><dd>{i.L(made)}</dd></> : null}
                      {ing ? <><dt>{i.t('main_ing')}</dt><dd><div className="ings">{ing.map((z, k) => <span key={k}>{i.L(z)}</span>)}</div></dd></> : null}
                      {showSpice ? <><dt>{i.t('spice_lvl')}</dt><dd>{i.t('spice_note_' + d.spice)}</dd></> : null}
                      {side ? <><dt>{i.t('served_with')}</dt><dd>{i.L(side)}</dd></> : null}
                    </dl>
                  </div>
                ) : null}
                {isHouse ? null : (
                  <div className="ds-sec" aria-busy={!h}>
                    <h3>{i.t('price_6m')}</h3>
                    {failed ? failNote : null}
                    <p className="meta">{h ? (h.diff === 0 ? i.t('price_same', { m: h.mon[0] }) : h.diff > 0 ? i.t('price_up', { v: i.tk(h.diff), m: h.mon[0] }) : i.t('price_down', { v: i.tk(-h.diff), m: h.mon[0] })) : ' '}</p>
                    <div className="hist">
                      {h ? h.vals.map((v, k) => (
                        <div key={k} title={i.tk(v)}>
                          <m.i style={{ height: (h.max === h.min ? 60 : 24 + (v - h.min) / (h.max - h.min) * 40) + 'px' }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: 0.05 + k * 0.04, ease: EASE }} />
                          <span>{h.mon[k]}</span>
                        </div>
                      )) : failed ? null : [0, 1, 2, 3, 4, 5].map(k => <div key={k}><span className="sk" style={{ height: 40 }} /><span>&nbsp;</span></div>)}
                    </div>
                    <button className="link" style={{ justifySelf: 'start' }} onClick={() => { close(); router.push(href('/prices', { type: d.type })); }}><I n="chart-line-up" b />{i.tx('see_hist')}</button>
                  </div>
                )}
                {more.length ? (
                  <div className="ds-sec"><h3>{i.t('also_here')}</h3>
                    {more.map(z => (
                      <button key={z.id} className="drow" onClick={() => swap(r, z)}>
                        <Pic id={z.p} w={120} word={i.L(z.name)} tone={r.theme} sizes="46px" /><span><b>{i.L(z.name)}</b><small>{i.L(z.por)}</small></span><Tk v={z.price} />
                      </button>
                    ))}
                  </div>
                ) : null}
                {rest.length ? (
                  <div className="ds-sec"><h3>{i.t('same_dish_else', { d: tyName })}</h3>
                    {rest.map(z => (
                      <button key={z.r + z.id} className="drow" onClick={() => swap(z.rest, z)}>
                        <Pic id={z.p} w={120} word={i.L(z.name)} tone={z.rest.theme} sizes="46px" />
                        <span><b>{i.L(z.name)}</b><small>{i.L(z.rest.name)} · {where(i, z.rest)}</small></span>
                        <span><Tk v={z.price} />{lowest && z.r === lowest.r && z.id === lowest.id ? <small className="low-t">{i.t('lowest')}</small> : null}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="ds-sec ds-rv">
                  <div className="ds-rv-h">
                    <h3>{i.t('people_said')}{revs.length ? <> <span className="meta">{i.N(revs.length)}</span></> : null}</h3>
                    <button className="btn btn-sm btn-own" onClick={() => { close(); needSign(() => S().set({ write: { r, dish: d.name.en } })); }}><I n="chat-circle-dots" />{i.tx('rv_dish')}</button>
                  </div>
                  {revs.length ? revs.slice(0, 2).map((v, k) => <RvCard key={v.who + k} v={v} r={r} clamp flat />) : x ? <p className="meta">{i.tx('rv_dish_none')}</p> : failed ? failNote : <span className="sk sk-line" style={{ width: '60%' }} />}
                  {revs.length > 2 ? (
                    <button className="link" style={{ justifySelf: 'start' }} onClick={() => { close(); set({ rvAll: { r: { ...r, dish: d.name } as RMini & RvAllX, list: x?.reviews || [] } }); }}>
                      {i.tx('rv_dish_all', { n: i.N(revs.length) })}<I n="arrow-right" b />
                    </button>
                  ) : null}
                </div>
              </m.div>
            </AnimatePresence>
          </div>
    </>
  );
}

/* ---------- all the photos and films of a dish ---------- */
/** main photo, main film, then the gallery the owner uploaded (the same picture is never shown twice) */
function mediaOf(d: Dish): DishMedia[] {
  const out: DishMedia[] = [];
  if (d.p) out.push({ kind: 'photo', src: d.p });
  if (d.video) out.push({ kind: 'video', src: d.video, poster: d.p || undefined });
  for (const z of d.gallery || []) if (z && z.src && !out.some(y => y.src === z.src)) out.push(z);
  return out;
}

const SNAP = { type: 'spring' as const, stiffness: 420, damping: 42, mass: 0.9 };

/* A strip that follows the finger (transform only), snaps with a spring, and turns around if you change your mind.
   A swipe that goes down is left to the sheet (Vaul) so it still closes; once a swipe goes sideways the sheet
   no longer sees it. Films play muted while they are shown. */
function Gallery({ items, start, alt, poster, onAt }: {
  items: DishMedia[]; start: number; alt: string; poster?: string | null; onAt: (k: number) => void;
}) {
  const i = useI();
  const [k, setK] = useState(start);
  const box = useRef<HTMLDivElement>(null), vids = useRef<(HTMLVideoElement | null)[]>([]);
  const x = useMotionValue(0), w = useRef(0), kRef = useRef(start);
  const n = items.length;

  /* keep the strip lined up with the box (also after the sheet or the window changes size) */
  useEffect(() => {
    const el = box.current; if (!el) return;
    const fit = () => { w.current = el.clientWidth; x.set(-kRef.current * w.current); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [x]);
  useEffect(() => { onAt(start); }, [onAt, start]);

  const go = (to: number) => {
    const t = Math.max(0, Math.min(n - 1, to));
    kRef.current = t; setK(t); onAt(t);
    if (reducedMotion()) x.set(-t * w.current); else animate(x, -t * w.current, SNAP);
  };

  /* only the film on screen plays */
  useEffect(() => {
    vids.current.forEach((v, j) => {
      if (!v) return;
      if (j === k) { v.muted = true; v.play().catch(() => {}); } else v.pause();
    });
  }, [k]);

  /* the swipe: decide sideways or down after a few pixels, then follow the finger */
  const g = useRef<{ id: number; x0: number; y0: number; ax: boolean; base: number; t: number; lx: number } | null>(null);
  const down = (ev: React.PointerEvent) => {
    if (n < 2) return;
    if ((ev.target as HTMLElement).closest('button, a')) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    x.stop();
    g.current = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, ax: false, base: x.get(), t: performance.now(), lx: ev.clientX };
  };
  const move = (ev: React.PointerEvent) => {
    const s = g.current; if (!s || s.id !== ev.pointerId) return;
    const dx = ev.clientX - s.x0, dy = ev.clientY - s.y0;
    if (!s.ax) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) { g.current = null; return; }
      s.ax = true; box.current?.setPointerCapture(ev.pointerId);
    }
    /* a sideways swipe is the strip's own: the sheet must not start moving with it */
    ev.stopPropagation();
    /* a little give past the first and the last */
    let nx = s.base + dx;
    const min = -(n - 1) * w.current;
    if (nx > 0) nx *= 0.3; else if (nx < min) nx = min + (nx - min) * 0.3;
    x.set(nx);
    const now = performance.now(); if (now - s.t > 40) { s.t = now; s.lx = ev.clientX; }
  };
  const up = (ev: React.PointerEvent) => {
    const s = g.current; g.current = null; if (!s || !s.ax) return;
    const dx = ev.clientX - s.x0, v = (ev.clientX - s.lx) / Math.max(16, performance.now() - s.t);
    let to = kRef.current;
    if (dx < -w.current * 0.2 || v < -0.45) to += 1; else if (dx > w.current * 0.2 || v > 0.45) to -= 1;
    go(to);
  };
  const key = (ev: React.KeyboardEvent) => {
    if (ev.key === 'ArrowRight') { ev.preventDefault(); go(k + 1); } else if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(k - 1); }
  };

  return (
    <div ref={box} className={clsx('dg', n > 1 && 'many')} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      tabIndex={n > 1 ? 0 : -1} onKeyDown={n > 1 ? key : undefined} role={n > 1 ? 'region' : undefined} aria-roledescription={n > 1 ? 'carousel' : undefined} aria-label={alt}>
      <m.div className="dg-track" style={{ x }}>
        {items.map((z, j) => (
          <div key={z.src + j} className="dg-s" aria-hidden={j !== k} aria-label={n > 1 ? i.L(W.mediaN).replace('{n}', i.N(j + 1)).replace('{t}', i.N(n)) : undefined}>
            {z.kind === 'video' ? (
              <video ref={el => { vids.current[j] = el; }} muted loop playsInline preload={Math.abs(j - k) <= 1 ? 'auto' : 'none'}
                poster={z.poster || poster ? src(z.poster || poster, 1000) : undefined} src={Math.abs(j - k) <= 1 ? src(z.src) : undefined} />
            ) : (
              <Pic id={z.src} w={1100} eager={j === start} alt={j === 0 ? alt : ''} sizes="(max-width: 720px) 100vw, 520px" />
            )}
          </div>
        ))}
      </m.div>
      {n > 1 ? (
        <>
          <div className="dg-dots" aria-hidden="true">{items.map((z, j) => <i key={j} className={clsx(j === k && 'on', z.kind === 'video' && 'v')} />)}</div>
          <button type="button" className="dg-a prev" onClick={() => go(k - 1)} disabled={k === 0} aria-label={i.L(W.prevMedia)}><I n="caret-left" b /></button>
          <button type="button" className="dg-a next" onClick={() => go(k + 1)} disabled={k === n - 1} aria-label={i.L(W.nextMedia)}><I n="caret-right" b /></button>
        </>
      ) : null}
    </div>
  );
}
