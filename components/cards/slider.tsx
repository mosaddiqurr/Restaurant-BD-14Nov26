'use client';
/* The big deal slider for Premium partners (Home and the Deals page).
   All slides sit in one row (the track). While you drag, the track follows your finger or mouse
   (a motion value, so no React render per frame). On release it springs to the nearest slide, carrying
   the speed of your flick. Arrows and dots move the same track. It moves on by itself every 6 seconds,
   but waits while you hover, touch or focus it, while it is off screen, and never with reduced motion. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, m, useInView, useMotionValue, useReducedMotion, type PanInfo } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I } from '@/components/ui/bits';
import { useHref } from '@/components/shell/nav';
import { Coupon, type DealX } from './cards';

const WAIT = 6000;
const SPRING = { type: 'spring', stiffness: 380, damping: 38, mass: 1 } as const;

export function Slider({ items }: { items: DealX[] }) {
  const i = useI(), href = useHref(), router = useRouter();
  const n = items.length;
  const [k, setK] = useState(0);
  const [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [held, setHeld] = useState(false);
  const [hidden, setHidden] = useState(false), [width, setWidth] = useState(0);
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { amount: 0.4 });
  const x = useMotionValue(0);
  const w = useRef(0), dragged = useRef(false), kRef = useRef(0);
  const anim = useRef<ReturnType<typeof animate> | null>(null);

  /* slide width follows the box; the track jumps (no animation) when the width changes */
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const fit = () => { w.current = el.clientWidth; setWidth(el.clientWidth); anim.current?.stop(); x.set(-kRef.current * w.current); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [x]);

  /* the tab in the background does not move the slider */
  useEffect(() => {
    const f = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);

  const to = useCallback((t: number, velocity = 0) => {
    const nx = ((t % n) + n) % n;
    kRef.current = nx; setK(nx);
    anim.current?.stop();
    const target = -nx * w.current;
    if (reduce) { x.set(target); return; }
    anim.current = animate(x, target, { ...SPRING, velocity });
  }, [n, reduce, x]);

  const paused = hover || focus || held || hidden || !inView || !!reduce;
  useEffect(() => {
    if (paused || n < 2) return;
    const tm = setTimeout(() => to(kRef.current + 1), WAIT);
    return () => clearTimeout(tm);
  }, [k, paused, n, to]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    setHeld(false);
    const v = info.velocity.x, cur = kRef.current, sw = w.current || 1;
    /* where the flick would carry the track, then the nearest slide (one step at a time at most) */
    const aim = -(x.get() + v * 0.18) / sw;
    let t = Math.round(aim);
    if (Math.abs(v) > 350 && t === cur) t = cur + (v < 0 ? 1 : -1);
    t = Math.max(cur - 1, Math.min(cur + 1, t));
    t = Math.max(0, Math.min(n - 1, t));
    to(t, v);
    setTimeout(() => { dragged.current = false; }, 60);
  };

  if (!n) return null;
  return (
    <div className="slider" onPointerEnter={e => { if (e.pointerType === 'mouse') setHover(true); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setHover(false); }}
      onFocus={() => setFocus(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocus(false); }}
      role="region" aria-roledescription="carousel">
      <div className="slides" ref={box} style={{ overflow: 'hidden', paddingBottom: 30, marginBottom: -30 }}>
        <m.div className="sl-track" style={{ x, display: 'flex', touchAction: 'pan-y' }}
          drag={n > 1 ? 'x' : false} dragConstraints={{ left: -(n - 1) * width, right: 0 }} dragElastic={0.14} dragMomentum={false}
          onPointerDown={() => { anim.current?.stop(); setHeld(true); }} onPointerUp={() => setHeld(false)} onPointerCancel={() => setHeld(false)}
          onDragStart={() => { dragged.current = true; anim.current?.stop(); }}
          onDragEnd={onDragEnd}>
          {items.map((it, ix) => (
            <div key={it.k} className="sl-item" style={{ flex: '0 0 100%', minWidth: 0 }} inert={ix !== k} aria-hidden={ix !== k}
              aria-roledescription="slide" aria-label={`${i.N(ix + 1)} / ${i.N(n)}`}>
              <Coupon x={it} big onOpen={() => { if (!dragged.current) router.push(href('/r/' + it.r.id) + '#deals'); }} />
            </div>
          ))}
        </m.div>
      </div>
      {n > 1 ? (
        <div className="slide-ctl">
          <button className="sl-b" aria-label={i.t('prev')} onClick={() => to(k - 1)}><I n="caret-left" b /></button>
          <div className="slide-dots">
            {items.map((it, ix) => (
              <button key={it.k} onClick={() => to(ix)} aria-label={i.L(it.d)} aria-current={ix === k}>
                {ix === k
                  ? (reduce ? <i style={{ transform: 'none' }} />
                    : <m.i key={'p' + k + (paused ? 'p' : 'r')} initial={{ scaleX: 0 }} animate={{ scaleX: paused ? 0.12 : 1 }} transition={{ duration: paused ? 0.2 : WAIT / 1000, ease: 'linear' }} />)
                  : ix < k ? <i style={{ transform: 'none' }} /> : null}
              </button>
            ))}
          </div>
          <button className="sl-b" aria-label={i.t('next')} onClick={() => to(k + 1)}><I n="caret-right" b /></button>
        </div>
      ) : null}
    </div>
  );
}
