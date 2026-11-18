'use client';
/* The top of the home page: a slow wall of real photos, the headline, the search bar with the area
   picker and Ask Mama, then the partner names running by. */
import { Morph } from '@/components/ui/morph';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { I, MamaMark, Mono } from '@/components/ui/bits';
import { AreaPop } from '@/components/ui/choose';
import { useHref } from '@/components/shell/nav';
import { useApp } from '@/lib/store';
import { src } from '@/lib/khabo';
import type { Text, Theme } from '@/lib/data/types';
import '@/styles/home-extra.css';

/** false once the element has scrolled out of sight (so loops can rest) */
function useOnScreen<T extends Element>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '80px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}

const DUR = [64, 82, 70, 90];

export function Hero({ wall, areaCount }: { wall: string[]; areaCount: Record<string, number> }) {
  const i = useI();
  const set = useApp(s => s.set);
  const [ref, on] = useOnScreen<HTMLElement>();
  const cols = useMemo(() => { const c: string[][] = [[], [], [], []]; wall.forEach((p, k) => c[k % 4].push(p)); return c; }, [wall]);
  const ex = [i.t('ph_1'), i.t('ph_2'), i.t('ph_3'), i.t('ph_4')];
  const [ri, setRi] = useState(0);
  useEffect(() => {
    if (!on) return;
    const iv = setInterval(() => setRi(k => (k + 1) % ex.length), 2800);
    return () => clearInterval(iv);
  }, [on, ex.length]);
  return (
    <section className={clsx('hero', !on && 'hero-off')} ref={ref}>
      <div className="wall" aria-hidden="true">
        {cols.map((c, ci) => (
          <div className="wall-col" key={ci}>
            <div className="wall-run" style={{ '--dur': DUR[ci] + 's' } as CSSProperties}>
              {c.concat(c).map((p, k) => (
                <div key={k} className={clsx('wall-t', (k + ci) % 3 === 0 && 'tall')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src(p, 360)} alt="" loading={k < 3 ? 'eager' : 'lazy'} decoding="async" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="wrap hero-in">
        <h1 className="h1">
          {[i.t('hero_1'), i.t('hero_2')].map((s, k) => <span key={k} className="ln" style={{ '--i': k } as CSSProperties}>{s}</span>)}
        </h1>
        <p className="hero-p">{i.t('hero_sub')}</p>
        <div className="hs">
          <AreaPop cls="area-b" counts={areaCount} />
          <button className="hs-q" onClick={() => set({ palette: true })} aria-label={i.t('search')}>
            <I n="magnifying-glass" b />
            <span className="rot" aria-live="off">
              {/* each example morphs into the next: shared letters slide, the rest fade */}
              <Morph>{ex[ri]}</Morph>
            </span>
          </button>
          <button className="btn btn-gold ai-b" onClick={() => set({ ai: { q: '' } })}><MamaMark />{i.t('ask_ai')}</button>
        </div>
      </div>
    </section>
  );
}

export type PartnerLock = { id: string; mono: string; theme: Theme; name: Text };

export function Partners({ list, total }: { list: PartnerLock[]; total: number }) {
  const i = useI(), href = useHref();
  const [ref, on] = useOnScreen<HTMLElement>();
  const row = (k: string) => list.map(r => (
    <Link key={k + r.id} href={href('/r/' + r.id)} className={clsx('lock', r.theme.font === 'serif' && 'serif')} tabIndex={k ? -1 : undefined} aria-hidden={k ? true : undefined}>
      <Mono r={r} />{i.L(r.name)}
    </Link>
  ));
  return (
    <section className={clsx('pt', !on && 'pt-off')} aria-label={i.t('partners')} ref={ref}>
      <p>{i.t('partners_line', { n: i.N(total) })}</p>
      <div className="marq"><div className="marq-t">{row('')}{row('d')}</div></div>
    </section>
  );
}
