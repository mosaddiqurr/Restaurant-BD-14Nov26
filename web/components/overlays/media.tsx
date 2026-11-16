'use client';
/* Film, 360 tour and photos, opened over any page. Ported from website/app/app.js (FilmDlg, TourDlg, Lightbox).
   The tour is a real 360 viewer (Three.js, downloaded only when a tour opens); photos swipe and slide. */
import '@/styles/restaurant-extra.css';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Pill } from '@/components/ui/bits';
import { useApp, type FilmOpen, type LightboxOpen, type TourOpen } from '@/lib/store';
import { EASE, panoFull, panoStill, src, srcSet } from '@/lib/khabo';
import type { TourRoom } from '@/lib/data/types';
import { InlinePano } from '@/components/restaurant/pano-inline';
import type { PanoViewer } from '@/components/restaurant/pano3d';
import { reducedMotion } from '@/components/restaurant/util';
import { W } from '@/components/restaurant/words';

/** the last value that was not null, so a dialog keeps its content while it closes */
function useKept<T>(v: T | null) {
  const [k, setK] = useState<T | null>(v);
  if (v && v !== k) setK(v);
  return v || k;
}

/* ---------- a film with sound ---------- */
export function FilmDlg() {
  const i = useI();
  const film = useApp(s => s.film), set = useApp(s => s.set);
  const f = useKept<FilmOpen>(film);
  const v = useRef<HTMLVideoElement>(null);
  const sub = f ? (f.film as FilmOpen['film'] & { sub?: string }).sub : '';
  return (
    <Dialog.Root open={!!film} onOpenChange={o => { if (!o) { v.current?.pause(); set({ film: null }); } }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dlg-back" />
        <Dialog.Popup className="dlg wide">
          {f ? (
            <>
              <video ref={v} key={f.film.src} className="film-v" src={f.film.src} poster={src(f.film.poster, 1400)} controls autoPlay playsInline />
              <div className="film-f">
                <div><Dialog.Title>{f.title}</Dialog.Title>{sub ? <p>{sub}</p> : null}</div>
                <Dialog.Close className="btn btn-glass btn-sm">{i.t('close')}</Dialog.Close>
              </div>
            </>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------- the 360 tour ---------- */
export function TourDlg() {
  const i = useI();
  const tour = useApp(s => s.tour), set = useApp(s => s.set);
  const t = useKept<TourOpen>(tour);
  /* each time a tour opens, start in the room it was opened for */
  const [room, setRoom] = useState<string | null>(null), [seen, setSeen] = useState<TourOpen | null>(null);
  if (tour && tour !== seen) { setSeen(tour); setRoom(tour.room || tour.rooms[0]?.id || null); }
  const rm = t ? t.rooms.find(z => z.id === room) || t.rooms[0] : null;
  const look = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root open={!!tour} onOpenChange={o => { if (!o) set({ tour: null }); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dlg-back" />
        <Dialog.Popup className="dlg tourd" initialFocus={look}>
          {t && rm ? (
            <>
              <div className="tour-h">
                <div>
                  <Dialog.Title>{i.L(t.r.name)}</Dialog.Title>
                  <p>{i.L(rm)}{(rm.spots || []).filter(z => z.info).map(z => ' · ' + i.L(z.info)).join('')}</p>
                </div>
                <Dialog.Close className="circ" aria-label={i.t('close')}><I n="x" b /></Dialog.Close>
              </div>
              {tour ? <Tour3D rooms={t.rooms} rm={rm} onRoom={setRoom} host={look} /> : <div className="t3d" />}
              {t.rooms.length > 1 ? (
                <div className="rooms" role="tablist" aria-label={i.L(W.rooms)}>
                  {t.rooms.map(z => (
                    <button key={z.id} role="tab" aria-selected={z.id === rm.id} className={clsx('room', z.id === rm.id && 'on')} onClick={() => setRoom(z.id)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {z.id === rm.id ? <Pill id="troom" /> : null}<img src={panoStill(z.pano)} alt="" />{i.L(z)}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Tour3D({ rooms, rm, onRoom, host }: { rooms: TourRoom[]; rm: TourRoom; onRoom: (id: string) => void; host: React.RefObject<HTMLDivElement | null> }) {
  const i = useI();
  const view = useRef<PanoViewer | null>(null), spotEls = useRef<(HTMLElement | null)[]>([]);
  const [ready, setReady] = useState<string | null>(null), [fail, setFail] = useState(false), [hint, setHint] = useState(true), [boot, setBoot] = useState(false);

  /* start the viewer once (Three.js downloads here, the first time) */
  useEffect(() => {
    let dead = false;
    const el = host.current; if (!el) return;
    const touched = () => setHint(false);
    el.addEventListener('pano-touch', touched);
    import('@/components/restaurant/pano3d').then(({ PanoViewer }) => {
      if (dead) return;
      try {
        view.current = new PanoViewer(el, { yaw: rm.yaw ?? 0, onReady: p => setReady(p) });
        setBoot(true);
      } catch { setFail(true); }
    }).catch(() => !dead && setFail(true));
    return () => { dead = true; el.removeEventListener('pano-touch', touched); view.current?.destroy(); view.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* each room: the photo first, then the full room fades in */
  useEffect(() => {
    const v = view.current; if (!v || !boot) return;
    v.load(rm.pano, panoFull(rm.pano), rm.yaw).catch(() => setFail(true));
  }, [rm.pano, rm.yaw, boot]);

  const spots = (rm.spots || []).filter(s => (s.to && rooms.some(z => z.id === s.to)) || s.info);
  useEffect(() => {
    const v = view.current; if (!v || !boot) return;
    v.setSpots(spots.map((s, k) => ({ yaw: s.yaw, pitch: s.pitch, el: spotEls.current[k]! })).filter(s => s.el));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rm.id, boot]);

  const loaded = ready === rm.pano;
  if (fail) {
    return (
      <div className="t3d" style={{ display: 'flex', flexDirection: 'column' }}>
        <InlinePano pano={rm.pano} tall label={i.L(rm)} />
        <p className="t3d-load" style={{ top: 'auto', bottom: 14, left: 16, right: 'auto' }}>{i.L(W.noGl)}</p>
      </div>
    );
  }
  return (
    <div ref={host} className="t3d" tabIndex={0} role="application" aria-label={`${i.L(rm)}. ${i.t('drag_look')}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={clsx('t3d-still', ready && 'gone')} src={panoStill(rm.pano)} alt="" />
      <span className="hint" style={{ opacity: hint && ready ? 1 : 0 }}><I n="hand-grabbing" />{i.t('drag_look')}</span>
      {!loaded ? <span className="t3d-load">{i.L(W.roomLoading)}</span> : null}
      {spots.map((s, k) => s.to ? (
        <button key={rm.id + k} ref={el => { spotEls.current[k] = el; }} className="t3d-spot go" onClick={() => onRoom(s.to!)} aria-label={i.L(W.goTo).replace('{r}', i.L(rooms.find(z => z.id === s.to)))}>
          <I n="arrow-up" b />{i.L(rooms.find(z => z.id === s.to))}
        </button>
      ) : (
        <span key={rm.id + k} ref={el => { spotEls.current[k] = el; }} className="t3d-spot info"><span>{i.L(s.info)}</span></span>
      ))}
      <div className="t3d-zoom">
        <button onClick={() => view.current?.zoom(-10)} aria-label={i.L(W.zoomIn)}><I n="plus" b /></button>
        <button onClick={() => view.current?.zoom(10)} aria-label={i.L(W.zoomOut)}><I n="minus" b /></button>
      </div>
    </div>
  );
}

/* ---------- photos: swipe or drag, arrow keys, thumbnails ---------- */
/* Base UI keeps focus inside, closes on Escape, keeps the page still and puts focus back after */
export function Lightbox() {
  const i = useI();
  const lb = useApp(s => s.lb), set = useApp(s => s.set);
  const k = useKept<LightboxOpen>(lb);
  /* each opening starts fresh at the photo it was opened on */
  const [n, setN] = useState(0), [seen, setSeen] = useState<LightboxOpen | null>(null);
  if (lb && lb !== seen) { setSeen(lb); setN(n + 1); }
  const pop = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root open={!!lb} onOpenChange={o => { if (!o) set({ lb: null }); }}>
      <Dialog.Portal>
        <Dialog.Popup ref={pop} className="lb" aria-label={k?.title || i.t('photos')} initialFocus={pop}>
          {k ? <LB key={n} lb={k} close={() => set({ lb: null })} /> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LB({ lb, close }: { lb: LightboxOpen; close: () => void }) {
  const i = useI();
  const pics = lb.pics, n = pics.length;
  const [k, setK] = useState(Math.min(lb.i || 0, n - 1)), [dir, setDir] = useState(1);
  const th = useRef<HTMLDivElement>(null), dragged = useRef(false);
  /* how fast the last swipe was: the photos carry that speed, so a hard flick moves faster than a slow drag */
  const [flick, setFlick] = useState(0);
  const go = (d: number, v = 0) => { if (n < 2) return; setFlick(v); setDir(d); setK(x => (x + d + n) % n); };
  const to = (x: number) => { if (x === k) return; setDir(x > k ? 1 : -1); setK(x); };

  /* left and right arrows move through the photos (focus is always inside the viewer) */
  useEffect(() => {
    const el = th.current?.closest<HTMLElement>('.lb'); if (!el) return;
    const key = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); go(1); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(-1); }
    };
    el.addEventListener('keydown', key);
    return () => el.removeEventListener('keydown', key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* keep the chosen thumbnail in view */
  useEffect(() => {
    const row = th.current, el = row?.children[k] as HTMLElement | undefined;
    if (!row || !el) return;
    row.scrollTo({ left: el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [k]);
  /* the next and previous photos load early, so a swipe never waits */
  useEffect(() => {
    if (n < 2) return;
    [pics[(k + 1) % n], pics[(k - 1 + n) % n]].forEach(p => { const im = new Image(); im.src = src(p, 1600); });
  }, [k, n, pics]);

  return (
    <>
      <div className="lb-h">
        <span aria-live="polite">{i.dg(k + 1)} / {i.dg(n)}</span>
        {lb.title ? <b>{lb.title}</b> : null}
        <button onClick={close} aria-label={i.t('close')}><I n="x" b /></button>
      </div>
      <div className="lb-img" onClick={ev => { if (ev.target === ev.currentTarget && !dragged.current) close(); }}>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <m.img key={pics[k] + k} src={src(pics[k], 1600)} srcSet={srcSet(pics[k], 1200)} sizes="92vw" alt={i.L(W.photoN).replace('{n}', i.dg(k + 1)).replace('{t}', i.dg(n))}
            draggable={false} custom={dir}
            variants={{
              a: (d: number) => ({ opacity: 0, x: d * 120, scale: 0.98 }),
              b: { opacity: 1, x: 0, scale: 1 },
              c: (d: number) => ({ opacity: 0, x: -d * 160, scale: 0.98, transition: { x: { type: 'spring', stiffness: 360, damping: 38, velocity: flick }, opacity: { duration: 0.18 }, scale: { duration: 0.2 } } }),
            }}
            initial="a" animate="b" exit="c"
            transition={{ x: { type: 'spring', stiffness: 380, damping: 36, velocity: flick }, opacity: { duration: 0.2, ease: EASE }, scale: { duration: 0.24, ease: EASE } }}
            drag={n > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.55}
            onDragStart={() => { dragged.current = true; }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -450) go(1, info.velocity.x || 1); else if (info.offset.x > 60 || info.velocity.x > 450) go(-1, info.velocity.x || -1);
              setTimeout(() => { dragged.current = false; }, 60);
            }} />
        </AnimatePresence>
      </div>
      {n > 1 ? (
        <div className="lb-nav">
          <button onClick={() => go(-1)} aria-label={i.t('prev')}><I n="caret-left" b /></button>
          <button onClick={() => go(1)} aria-label={i.t('next')}><I n="caret-right" b /></button>
        </div>
      ) : <div />}
      <div className="lb-th" ref={th}>
        {n > 1 ? pics.map((p, x) => (
          <button key={p + x} className={x === k ? 'on' : ''} onClick={() => to(x)} aria-label={i.L(W.photoN).replace('{n}', i.dg(x + 1)).replace('{t}', i.dg(n))} aria-current={x === k}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(p, 160)} alt="" loading="lazy" />
          </button>
        )) : null}
      </div>
    </>
  );
}
