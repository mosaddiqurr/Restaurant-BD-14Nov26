'use client';
/* The 360 room on the page itself: a still photo first, then the whole room as a long strip you drag
   left and right (with a little glide when you let go). Only transform moves. The full viewer with
   looking up and down (Three.js) opens from the Full screen button. */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useInView } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I } from '@/components/ui/bits';
import { panoMid, panoStill } from '@/lib/khabo';
import { reducedMotion } from './util';

export function InlinePano({ pano, tall, label }: { pano: string; tall?: boolean; label?: string }) {
  const i = useI();
  const ref = useRef<HTMLDivElement>(null), strip = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: '300px 0px' });
  const [full, setFull] = useState<string | null>(null), [hint, setHint] = useState(true);

  useEffect(() => {
    if (!near) return;
    let dead = false;
    const im = new Image(); im.decoding = 'async'; im.src = panoMid(pano);
    im.decode().then(() => { if (!dead) setFull(im.src); }).catch(() => {});
    return () => { dead = true; };
  }, [near, pano]);

  useEffect(() => {
    const el = ref.current, st = strip.current; if (!el || !st || !full) return;
    let x = 0, vx = 0, drag = false, lx = 0, lt = 0, raf = 0, idle = true, seen = true, last = performance.now(), tile = 0;
    const still = reducedMotion();
    const size = () => { tile = el.clientHeight * 1.5 * 2; st.style.width = (tile + el.clientWidth + 2) + 'px'; };
    const paint = () => { if (!tile) return; const tx = ((x % tile) + tile) % tile - tile; st.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`; };
    const tick = (now: number) => {
      const dt = Math.min(64, now - last); last = now;
      if (!drag) {
        if (Math.abs(vx) > 0.005) { x += vx * dt; vx *= Math.pow(0.94, dt / 16.7); paint(); }
        else if (idle && !still) { x -= dt * 0.016; paint(); }
      }
      raf = seen && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf && seen) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const down = (ev: PointerEvent) => { drag = true; idle = false; lx = ev.clientX; lt = performance.now(); vx = 0; el.setPointerCapture(ev.pointerId); setHint(false); kick(); };
    const move = (ev: PointerEvent) => { if (!drag) return; const now = performance.now(), dx = ev.clientX - lx; x += dx; vx = dx / Math.max(1, now - lt); lx = ev.clientX; lt = now; paint(); };
    const up = () => { drag = false; };
    const key = (ev: KeyboardEvent) => { if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { ev.preventDefault(); idle = false; setHint(false); vx = ev.key === 'ArrowLeft' ? 0.9 : -0.9; kick(); } };
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) kick(); });
    const ro = new ResizeObserver(() => { size(); paint(); });
    size(); paint();
    io.observe(el); ro.observe(el);
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('keydown', key);
    kick();
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('keydown', key);
    };
  }, [full]);

  return (
    <div ref={ref} className={clsx('pano still', full && 'live', tall && 'tall')} style={{ backgroundImage: `url("${panoStill(pano)}")` }}
      tabIndex={0} role="img" aria-label={label || i.t('drag_look')}>
      {full ? <div ref={strip} className="pano-strip" style={{ backgroundImage: `url("${full}")` }} /> : null}
      <span className="hint" style={{ opacity: hint ? 1 : 0 }}><I n="hand-grabbing" />{i.t('drag_look')}</span>
    </div>
  );
}
