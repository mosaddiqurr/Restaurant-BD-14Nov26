'use client';
/* A choice list in a small popover (sort, area, price).
   The popover code (Base UI) is not part of the first download: the button is drawn at once, and the real
   popover loads the moment a pointer comes near it, it gets focus, or it is tapped (then it opens straight away). */
import { lazy, Suspense, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { useApp } from '@/lib/store';
import { C, areaOf } from '@/lib/khabo';
import { I } from './bits';

export type Opt = [string, ReactNode, boolean?];
export type ChooseProps = {
  label?: ReactNode; icon?: string; title?: string; opts: Opt[]; value: string; onPick: (v: string) => void; on?: boolean; cls?: string;
  align?: 'start' | 'center' | 'end'; children?: ReactNode;
};

const Real = lazy(() => import('./choose-real'));

export function Choose(p: ChooseProps) {
  const [load, setLoad] = useState(false), [openNow, setOpenNow] = useState(false), [focusNow, setFocusNow] = useState(false);
  const face = p.children || <>{p.icon ? <I n={p.icon} /> : null}<span>{p.label}</span><I n="caret-down" /></>;
  const btn = (
    <button type="button" className={p.cls || clsx('tb-btn', p.on && 'on')} aria-haspopup="dialog"
      onPointerEnter={() => setLoad(true)}
      /* on a phone the tap may finish before the popover arrives: open it when it does */
      onPointerDown={e => { if (e.pointerType !== 'mouse') setOpenNow(true); setLoad(true); }}
      onFocus={e => { if (e.currentTarget.matches(':focus-visible')) setFocusNow(true); setLoad(true); }}
      onClick={() => { setOpenNow(true); setLoad(true); }}>{face}</button>
  );
  if (!load) return btn;
  return <Suspense fallback={btn}><Real {...p} initialOpen={openNow} initialFocus={focusNow} /></Suspense>;
}

/** pick the area the diner is in (kept in this browser). counts = restaurants per area */
export function AreaPop({ cls, children, counts }: { cls?: string; children?: ReactNode; counts?: Record<string, number> }) {
  const i = useI();
  const area = useApp(s => s.area), set = useApp(s => s.set);
  const opts: Opt[] = ['dhaka', 'bogura'].flatMap(c => [
    [c, i.L(C.cities[c]), true] as Opt,
    ...C.areas.filter(a => a.city === c).map(a => [a.id, <><span style={{ flex: 1 }}>{i.L(a)}</span>{counts ? <em>{i.N(counts[a.id] || 0)}</em> : null}</>] as Opt),
  ]);
  return (
    <Choose cls={cls} opts={opts} value={area} onPick={v => set({ area: v })} align="start">
      {children || <><I n="map-pin" f /><span>{i.L(areaOf(area))}</span><I n="caret-down" /></>}
    </Choose>
  );
}
