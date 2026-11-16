'use client';
/* A scrolling column with no grey scroll bar. Instead a thin line sits on top: a fork at the start, a knife
   at the end, and a small plate that rolls along as you scroll (the same plate as the restaurant page).
   The line shows only when there is more to scroll. Styles: styles/scroll.css */
import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';

const FORK = <svg className="pm-fork" viewBox="0 0 8 24" aria-hidden="true"><path d="M1.2 1v6.2a2.8 2.8 0 0 0 2 2.7V23a.8.8 0 0 0 1.6 0V9.9a2.8 2.8 0 0 0 2-2.7V1M4 1v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const KNIFE = <svg className="pm-knife" viewBox="0 0 8 24" aria-hidden="true"><path d="M3.4 1C5.6 2.6 6.4 6 6.4 10.4c0 .6-.4 1-1 1H4.6V23a.8.8 0 0 1-1.6 0V1.6c0-.4.2-.6.4-.6z" fill="currentColor" /></svg>;
const PLATE = (
  <span className="pm-plate"><svg viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="15.5" fill="#FBF8F2" /><circle cx="16" cy="16" r="11.6" fill="#F0EADF" />
    <circle cx="16" cy="16" r="11.6" fill="none" stroke="rgba(60,40,10,.12)" strokeWidth=".8" />
    <path d="M10.6 17.4c0-3.5 2.6-6.1 5.9-6.1 3.1 0 5 2.2 5 4.8 0 3.3-2.8 5.4-6 5.4-2.9 0-4.9-1.6-4.9-4.1z" fill="#E39A2B" />
    <circle cx="14.3" cy="15.6" r="1.3" fill="#C2561E" /><circle cx="18.2" cy="17.9" r="1.1" fill="#C2561E" />
    <path d="M19.6 10.6c1.6-.9 3.2-.6 4.1.3-1 1.3-2.7 1.6-4.1-.3z" fill="#4E8B3A" />
  </svg></span>
);

export function CutleryScroll({ children, cls, label, more }: { children: ReactNode; cls?: string; label?: string; more?: string }) {
  const root = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null), track = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const r = root.current, b = body.current, t = track.current;
    if (!r || !b || !t) return;
    let raf = 0;
    /* written straight to CSS variables: no React work while scrolling */
    const draw = () => {
      raf = 0;
      const max = b.scrollHeight - b.clientHeight;
      r.classList.toggle('can', max > 4);
      /* 'end': nothing more below, so the "more below" button and the bottom fade go away */
      r.classList.toggle('end', b.scrollTop >= max - 4);
      r.style.setProperty('--p', max > 0 ? Math.min(1, Math.max(0, b.scrollTop / max)).toFixed(4) : '0');
      r.style.setProperty('--w', t.clientWidth + 'px');
      /* a sticky column starts lower on the page than where it sticks: until it sticks, shrink it so its bottom
         (and the "more below" button) is always on screen instead of hanging below the fold */
      const host = r.parentElement;
      if (host && getComputedStyle(host).position === 'sticky') {
        const stick = parseFloat(getComputedStyle(host).top) || 0;
        const top = Math.max(stick, host.getBoundingClientRect().top);
        host.style.maxHeight = Math.max(240, innerHeight - top - 20) + 'px';
      }
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw();
    b.addEventListener('scroll', ask, { passive: true });
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask);
    const ro = new ResizeObserver(ask);
    ro.observe(b); if (b.firstElementChild) ro.observe(b.firstElementChild);
    return () => { b.removeEventListener('scroll', ask); removeEventListener('scroll', ask); removeEventListener('resize', ask); ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={root} className={clsx('cs', cls)}>
      <div className="cs-meter" aria-hidden="true">
        {FORK}
        <span className="cs-track" ref={track}><span className="cs-fill" /><span className="cs-plate">{PLATE}</span></span>
        {KNIFE}
      </div>
      <div ref={body} className="cs-body" aria-label={label}><div>{children}</div></div>
      {/* the plain-words hint: a button at the bottom that says there is more, and scrolls down when tapped */}
      {more ? (
        <button type="button" className="cs-more" tabIndex={-1} onClick={() => { const b = body.current; if (b) b.scrollBy({ top: b.clientHeight * 0.7, behavior: 'smooth' }); }}>
          {more}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      ) : null}
    </div>
  );
}
