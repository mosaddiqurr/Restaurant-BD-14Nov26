'use client';
/* Small shared parts used on every page: icons, prices, numbers, photos, the moving pill, segmented tabs.
   Ported from archive/prototype/app/app.js ("small parts"). */
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { useI } from '@/components/providers/i18n';
import { EASE, SPR, lqip, src, srcSet } from '@/lib/khabo';
import type { Theme } from '@/lib/data/types';
import type { IconName } from './icon-names';

export type { IconName };

/** true after the page has loaded in the browser: use it for anything that depends on the clock
    (open now, countdowns), so the saved page and the live page never disagree */
const noSub = () => () => {};
export function useMounted() {
  return useSyncExternalStore(noSub, () => true, () => false);
}
let T: number | null = null;
/** the time, read once a minute at most so every part of a page agrees. null on the server and while the page wakes up */
export function useNow() {
  return useSyncExternalStore(noSub, () => { const n = Date.now(); if (T == null || n - T > 6e4) T = n; return T; }, () => null);
}
/** a media query such as "(max-width: 720px)". false on the server */
export function useMedia(q: string) {
  return useSyncExternalStore(
    cb => { const m = matchMedia(q); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => matchMedia(q).matches,
    () => false,
  );
}

/** a Phosphor icon from the sprite in public/icons (no JavaScript cost). f = filled, b = bold */
export function I({ n, f, b, cls, s, title }: { n: IconName | string; f?: boolean; b?: boolean; cls?: string; s?: number; title?: string }) {
  const w = f ? 'fill' : b ? 'bold' : 'regular';
  return (
    <i className={clsx('ph', cls)} style={s ? { fontSize: s } : undefined} aria-hidden={title ? undefined : true} title={title}>
      <svg viewBox="0 0 256 256"><use href={`/icons/${w}.svg?v=1#${n}`} /></svg>
    </i>
  );
}

/** animated numbers: the digits roll when the number changes. NumberFlow cannot draw Bangla digits, so Bangla
    uses BnRoll below, which rolls only the digits that changed */
export function Num({ v, en }: { v: number; en?: boolean }) {
  const i = useI();
  if (i.bn && !en) return <BnRoll text={i.dg(i.N(v))} v={v} />;
  return <NumberFlow value={v} locales="en-IN" />;
}

function BnRoll({ text, v }: { text: string; v: number }) {
  /* up: new digits come from below; down: from above */
  const [last, setLast] = useState(v), [up, setUp] = useState(true);
  if (last !== v) { setUp(v > last); setLast(v); }
  const ch = Array.from(text), n = ch.length;
  return (
    <span className="bnroll" aria-label={text}>
      {ch.map((c, k) => (
        <span className="bnr-d" key={n - k} aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span key={c} initial={{ y: up ? '70%' : '-70%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: up ? '-70%' : '70%', opacity: 0 }}
              transition={{ duration: 0.26, ease: EASE }}>{c}</m.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

/** a sentence from the word list with its number rolling, e.g. "Show 8 places" where 8 rolls to 5 */
export function TNum({ k, n, vars }: { k: string; n: number; vars?: Record<string, string | number> }) {
  const i = useI();
  const [a, b = ''] = i.t(k, { ...vars, n: '' }).split('');
  return <>{a}<Num v={n} />{b}</>;
}

/** a price: "৳420" with a smaller taka sign. flow = the digits roll when the price changes */
export function Tk({ v, flow, cls, to }: { v: number; flow?: boolean; cls?: string; to?: number }) {
  const i = useI();
  return (
    <span className={clsx('price', cls)}>
      <span className="cur">৳</span>
      {flow ? <Num v={Math.round(v)} /> : i.N(Math.round(v))}
      {to != null ? '-' + i.N(to) : null}
    </span>
  );
}

export function Mono({ r, cls }: { r: { mono: string; theme: Theme }; cls?: string }) {
  return <span className={clsx('mono', cls)} style={{ '--d': r.theme.deep, '--a': r.theme.accent } as CSSProperties} aria-hidden="true">{r.mono}</span>;
}

/** a photo with a soft placeholder. Studio scans (ph:) sit on a plain background */
export function Pic({ id, w = 600, alt = '', word, cls, eager, children, style, tone, icon, sizes }: {
  id?: string | null; w?: number; alt?: string; word?: string; cls?: string; eager?: boolean; children?: ReactNode; style?: CSSProperties;
  tone?: Theme; icon?: string; sizes?: string;
}) {
  /* a tiny blurred copy sits under the photo while it loads; once the page is live the photo fades in over it
     (before that it simply shows, so nothing waits for the site's code) */
  const lq = lqip(id), live = useMounted();
  return (
    <div className={clsx('pic', id && id.startsWith('ph:') && 'studio', live && 'fx', cls)} style={style}>
      {lq ? <span className="pic-lq" style={{ backgroundImage: `url(${lq})` }} aria-hidden="true" /> : null}
      {id ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src(id, w)} srcSet={srcSet(id, w)} sizes={sizes || `${w}px`} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : undefined}
          ref={el => { if (el && el.complete && el.naturalWidth) el.classList.add('ok'); }} onLoad={e => e.currentTarget.classList.add('ok')} />
      ) : tone ? (
        <span className="word tone" style={{ background: tone.deep, color: tone.accent }}><I n={icon || 'fork-knife'} s={26} /></span>
      ) : (
        <span className="word">{(word || '').trim().charAt(0)}</span>
      )}
      {children}
    </div>
  );
}

type RiseProps = { children?: ReactNode; d?: number; as?: 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'section' | 'li' | 'span'; className?: string; style?: CSSProperties; id?: string };
/** a quick fade as the page appears. Plain CSS (styles/next.css .rise), so the words are there in the first HTML
    and never wait for the animation code or for scrolling into view */
export function Rise({ children, d = 0, as = 'div', className, style, id }: RiseProps) {
  const T = as;
  return <T id={id} className={clsx('rise', className)} style={d ? { ...style, '--rd': Math.min(d, 4) * 40 + 'ms' } as CSSProperties : style}>{children}</T>;
}

/** the pill that slides under the chosen tab */
export const Pill = ({ id }: { id: string }) => <m.span layoutId={id} className="pill" transition={SPR} />;

export type SegItem = [string, ReactNode, ReactNode?];
export function Seg({ items, value, onChange, id, cls }: { items: SegItem[]; value: string; onChange: (v: string) => void; id: string; cls?: string }) {
  /* on a narrow screen the row scrolls sideways: the chosen tab always slides into view, never left behind the edge */
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current, on = el?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!el || !on || el.scrollWidth <= el.clientWidth) return;
    const l = on.offsetLeft - el.offsetLeft, pad = 24;
    const to = l < el.scrollLeft + pad ? l - pad : l + on.offsetWidth > el.scrollLeft + el.clientWidth - pad ? l + on.offsetWidth - el.clientWidth + pad : null;
    if (to != null) el.scrollTo({ left: to, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [value]);
  return (
    <div className={clsx('seg', cls)} role="tablist" ref={box}>
      {items.map(([v, l, extra]) => (
        <button key={v} role="tab" aria-selected={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
          {v === value ? <Pill id={'seg-' + id} /> : null}{l}{extra != null ? <em>{extra}</em> : null}
        </button>
      ))}
    </div>
  );
}

export const Stars = ({ n }: { n: number }) => <>{Array.from({ length: 5 }, (_, k) => <I key={k} n="star" f={k < n} />)}</>;

export function Spice({ n }: { n: number }) {
  const i = useI();
  return <span className="spice" title={i.t('spice_' + n)}>{Array.from({ length: n }, (_, k) => <I key={k} n="pepper" f />)}</span>;
}

export const Logo = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#0C5A3E" /><circle cx="16" cy="16" r="8.5" fill="none" stroke="#F7F1DE" strokeWidth="2.6" /><circle cx="19.2" cy="13" r="3.1" fill="#F4B91A" /></svg>
);

/** a sideways row of cards with arrow buttons on laptops (phones just swipe) */
export function RailX({ head, children, cls }: { head?: ReactNode; children: ReactNode; cls?: string }) {
  const i = useI();
  const ref = useRef<HTMLDivElement>(null);
  const by = (d: number) => { const el = ref.current; if (el) el.scrollBy({ left: d * el.clientWidth * 0.9, behavior: 'smooth' }); };
  return (
    <div>
      {head ? (
        <div className="sec-head">{head}
          <div className="rx-btns">
            <button aria-label={i.t('prev')} onClick={() => by(-1)}><I n="caret-left" b /></button>
            <button aria-label={i.t('next')} onClick={() => by(1)}><I n="caret-right" b /></button>
          </div>
        </div>
      ) : null}
      <div className={clsx('rail-x', cls)} ref={ref}>{children}</div>
    </div>
  );
}
