'use client';
import { useQueryString } from './url-params';
/* Filters shared by the restaurant and dish lists: the URL state, the side filter groups, the phone sheet,
   the "applied" chips and the sort choices. Ported from archive/prototype/app/app.js (Grp, SideFilters, chipsOf, SORTS, FilterDrawer). */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { Drawer } from 'vaul';
import { useI } from '@/components/providers/i18n';
import { I, Seg, TNum } from '@/components/ui/bits';
import type { Opt } from '@/components/ui/choose';
import { parseQs, qs, useHref, type Q } from '@/components/shell/nav';
import { C, DISH_X, EASE, LIST_KEYS, SPICE, areaOf, cuName, type DFilter, type RFilter } from '@/lib/khabo';
import type { I18n } from '@/lib/i18n/core';
import type { RestaurantCard } from '@/lib/data/types';

export type AnyF = Partial<RFilter> & Partial<DFilter> & Record<string, unknown>;

/* ---------- the URL holds the filters ---------- */
/** filters read from the address, and a setter that writes them back without a page load.
    The screen answers at once from local state; the address follows (history.replaceState is part of the
    Next router, so nothing is fetched). If the address changes from outside (a link to this page with other
    filters, back or forward), the filters are read from it again. */
export function useUrlState<T>(path: string, read: (q: Record<string, string | string[]>) => T, write: (v: T) => Q) {
  const key = useQueryString();
  const href = useHref();
  const [v, setV] = useState(() => read(parseQs(new URLSearchParams(key))));
  /* addresses this page wrote itself and has not seen come back yet */
  const pending = useRef<string[]>([]), seen = useRef(key);
  useEffect(() => {
    if (key === seen.current) return;
    seen.current = key;
    const k = pending.current.indexOf(key);
    if (k >= 0) { pending.current = pending.current.slice(k + 1); return; }
    pending.current = [];
    setV(read(parseQs(new URLSearchParams(key))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((n: T) => {
    setV(n);
    const q = qs(write(n)), url = href(path) + q;
    if (url === location.pathname + location.search) return;
    pending.current.push(q.slice(1));
    window.history.replaceState(null, '', url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href, path]);
  return [v, set] as const;
}

/** a search box: the letters show at once, but the list only changes once typing pauses (250ms),
    so the cards do not jump and re-animate on every key */
export function useLiveText(value: string, onChange: (v: string) => void) {
  const [text, setText] = useState(value);
  const mine = useRef(value), latest = useRef(onChange), tm = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => { latest.current = onChange; });
  useEffect(() => { if (value !== mine.current) { mine.current = value; setText(value); } }, [value]);
  useEffect(() => () => clearTimeout(tm.current), []);
  return [text, (v: string) => {
    mine.current = v; setText(v);
    clearTimeout(tm.current);
    /* clearing the box answers straight away */
    if (!v) latest.current(v); else tm.current = setTimeout(() => latest.current(v), 250);
  }] as const;
}

/** restaurant filters: defaults are left out of the address */
export const writeR = (f: RFilter): Q => ({ ...f, sort: f.sort === 'rel' ? '' : f.sort });

/* ---------- counts, chips, sorts ---------- */
export const countAll = (f: AnyF, skip: string[] = []) =>
  Object.keys(f).filter(k => !['group', 'sort', 'mode', ...skip].includes(k) && (Array.isArray(f[k]) ? (f[k] as unknown[]).length : f[k]))
    .reduce((s, k) => s + (Array.isArray(f[k]) ? (f[k] as unknown[]).length : 1), 0);

export type Chip = { k: string; v: string; label: string };
export function chipsOf(i: I18n, f: AnyF): Chip[] {
  const out: Chip[] = [], z = (k: string, v: string, label: string) => out.push({ k, v, label });
  if (f.q) z('q', '', `“${f.q}”`);
  if (f.city) z('city', '', i.L(C.cities[f.city]));
  if (f.area) z('area', '', i.L(areaOf(f.area)));
  if (f.cu) z('cu', '', cuName(i, f.cu));
  if (f.type && C.types[f.type]) z('type', '', i.t('serves_x', { d: i.L(C.types[f.type]) }));
  if (f.occ) z('occ', '', i.L(C.occasions.find(o => o.id === f.occ)));
  if (f.bud) z('bud', '', i.L(C.budgets.find(b => b.id === f.bud)));
  if (f.max) z('max', '', i.t('dish_upto', { v: i.tk(Number(f.max)) }));
  if (f.rating) z('rating', '', i.dg(String(f.rating)) + '+');
  if (f.open) z('open', '', i.t('q_open'));
  if (f.late) z('late', '', i.t('late_night'));
  if (f.veg) z('veg', '', i.t('veg'));
  if (f.mild && !f.spice) z('mild', '', i.t('mild'));
  const sp = SPICE.find(s => s.id === f.spice); if (sp) z('spice', '', i.L(sp));
  (f.dx || []).forEach(v => { const x = DISH_X.find(s => s.id === v); if (x) z('dx', v, i.L(x)); });
  (f.fac || []).forEach(v => z('fac', v, i.L(C.facilities[v])));
  const media: Record<string, string> = { tour: i.t('q_tour'), film: i.t('film'), '3d': i.t('menu_3d'), kitchen: i.t('kitchen_film') };
  (f.media || []).forEach(v => z('media', v, media[v] || v));
  const tags: Record<string, string> = { deals: i.t('q_deals'), featured: i.t('featured'), founding: i.t('founding') };
  (f.tags || []).forEach(v => z('tags', v, tags[v] || v));
  return out;
}
export function dropChip<T extends AnyF>(f: T, c: Chip): T {
  const n = { ...f } as Record<string, unknown>;
  if ((LIST_KEYS as readonly string[]).includes(c.k)) n[c.k] = ((n[c.k] as string[]) || []).filter(z => z !== c.v);
  else n[c.k] = '';
  return n as T;
}
export const SORTS = (i: I18n, page: 'list' | 'dishes'): Opt[] => [
  ['rel', i.t('sort_rel')], ['price', page === 'dishes' ? i.t('sort_price') : i.t('sort_price_pp')],
  ['rating', i.t('sort_rating')], ['near', i.t('sort_near')], ['fresh', i.t('sort_fresh')],
];
export const sortLabel = (opts: Opt[], v: string) => (opts.find(z => z[0] === v) || opts[0])[1];

/** the area picker: anywhere, a whole city, or one area. Values: '', 'c:dhaka', 'a:gulshan' */
export const areaOpts = (i: I18n): Opt[] => [
  ['', i.t('anywhere')],
  ...Object.keys(C.cities).filter(c => C.areas.some(a => a.city === c)).flatMap(c => [
    [c + 'h', i.L(C.cities[c]), true] as Opt,
    ['c:' + c, i.t('all_of', { c: i.L(C.cities[c]) })] as Opt,
    ...C.areas.filter(a => a.city === c).map(a => ['a:' + a.id, i.L(a)] as Opt),
  ]),
];
export const areaValue = (f: { area?: string; city?: string }) => f.area ? 'a:' + f.area : f.city ? 'c:' + f.city : '';
export const areaLabel = (i: I18n, f: { area?: string; city?: string }) => f.area ? i.L(areaOf(f.area)) : f.city ? i.L(C.cities[f.city]) : i.t('anywhere');
export const pickArea = (v: string) => ({ area: v.startsWith('a:') ? v.slice(2) : '', city: v.startsWith('c:') ? v.slice(2) : '' });

/* ---------- one collapsible group: height eases open, the inside fades in with a light blur ---------- */
export function Grp({ title, open0 = true, children }: { title: ReactNode; open0?: boolean; children: ReactNode }) {
  const [o, setO] = useState(open0);
  return (
    <div className="fg">
      <button className="fg-h" onClick={() => setO(!o)} aria-expanded={o}>{title}
        <m.span className="chev" animate={{ rotate: o ? 180 : 0 }} transition={{ duration: 0.25, ease: EASE }}><I n="caret-down" b /></m.span>
      </button>
      <AnimatePresence initial={false}>
        {o ? (
          <m.div key="b" className="fg-b" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0, transition: { duration: 0.2, ease: EASE } }} transition={{ duration: 0.3, ease: EASE }}>
            <m.div className="fg-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.28, ease: EASE }}>{children}</m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ---------- the restaurant filters (side panel on laptops, sheet on phones) ---------- */
export function SideFilters({ f, setF, id, cards }: { f: RFilter; setF: (f: RFilter) => void; id: string; cards: RestaurantCard[] }) {
  const i = useI();
  const cnt = (fn: (r: RestaurantCard) => unknown) => cards.filter(fn).length;
  const city = f.city || (f.area ? areaOf(f.area).city : '') || '';
  const val = (k: string) => (f as unknown as Record<string, unknown>)[k];
  const radio = (k: keyof RFilter, v: string, l: ReactNode, n?: number) => {
    const on = val(k) === v;
    return (
      <button key={k + v} className={clsx('fo', on && 'on')} role="radio" aria-checked={on} onClick={() => setF({ ...f, [k]: on ? '' : v, ...(k === 'area' && !on ? { city: '' } : {}) })}>
        <i className="r" /><span>{l}</span>{n != null ? <em>{i.N(n)}</em> : null}
      </button>
    );
  };
  const check = (k: 'fac' | 'media' | 'tags', v: string, l: ReactNode, n?: number) => {
    const list = f[k] || [], on = list.includes(v);
    return (
      <button key={k + v} className={clsx('fo', on && 'on')} role="checkbox" aria-checked={on} onClick={() => setF({ ...f, [k]: on ? list.filter(z => z !== v) : [...list, v] })}>
        <i className="c"><I n="check" b /></i><span>{l}</span>{n != null ? <em>{i.N(n)}</em> : null}
      </button>
    );
  };
  const tog = (k: 'open' | 'late', l: ReactNode) => {
    const on = !!f[k];
    return (
      <button key={k} className={clsx('fo', on && 'on')} role="checkbox" aria-checked={on} onClick={() => setF({ ...f, [k]: on ? '' : '1' })}>
        <i className="c"><I n="check" b /></i><span>{l}</span>
      </button>
    );
  };
  return (
    <div>
      <Grp title={i.t('where')}>
        <Seg id={id + 'city'} items={[['', i.t('anywhere')], ...Object.keys(C.cities).filter(c => cards.some(r => r.city === c)).map(c => [c, i.L(C.cities[c])] as [string, string])]} value={city} onChange={v => setF({ ...f, city: v, area: '' })} />
        <div role="radiogroup">{C.areas.filter(a => !city || a.city === city).map(a => radio('area', a.id, i.L(a), cnt(r => r.area === a.id)))}</div>
      </Grp>
      <Grp title={i.t('budget_pp')}><div role="radiogroup">{C.budgets.map(b => radio('bud', b.id, i.L(b)))}</div></Grp>
      <Grp title={i.t('food_type')}>
        <label className="sel">
          <select value={f.type || ''} onChange={ev => setF({ ...f, type: ev.target.value })} aria-label={i.t('food_type')}>
            <option value="">{i.t('any_food')}</option>
            {C.cuisines.map(c => (
              <optgroup key={c.id} label={i.L(c)}>
                {Object.entries(C.types).filter(([, z]) => z.cu === c.id).map(([tid, z]) => <option key={tid} value={tid}>{i.L(z)}</option>)}
              </optgroup>
            ))}
          </select>
          <I n="caret-down" />
        </label>
        <div className="chips">{C.cuisines.map(c => <button key={c.id} className={clsx('chip sm', f.cu === c.id && 'on')} aria-pressed={f.cu === c.id} onClick={() => setF({ ...f, cu: f.cu === c.id ? '' : c.id })}>{i.L(c)}</button>)}</div>
      </Grp>
      <Grp title={i.t('occasion')}>
        <div className="chips">{C.occasions.filter(o => o.id !== 'tour').map(o => <button key={o.id} className={clsx('chip sm', f.occ === o.id && 'on')} aria-pressed={f.occ === o.id} onClick={() => setF({ ...f, occ: f.occ === o.id ? '' : o.id })}><I n={o.i} />{i.L(o)}</button>)}</div>
      </Grp>
      <Grp title={i.t('when')}><div>{tog('open', i.t('q_open'))}{tog('late', i.t('late_night'))}</div></Grp>
      <Grp title={i.t('rating')} open0={false}><div role="radiogroup">{radio('rating', '4', i.dg('4.0+'))}{radio('rating', '4.5', i.dg('4.5+'))}</div></Grp>
      <Grp title={i.t('facilities')} open0={false}><div>{Object.entries(C.facilities).map(([fid, z]) => check('fac', fid, i.L(z), cnt(r => r.fac.includes(fid))))}</div></Grp>
      <Grp title={i.t('see_before')} open0={false}><div>{check('media', 'tour', i.t('q_tour'))}{check('media', 'film', i.t('film'))}{check('media', 'kitchen', i.t('kitchen_film'))}{check('media', '3d', i.t('menu_3d'))}</div></Grp>
      <Grp title={i.t('labels')} open0={false}><div>{check('tags', 'deals', i.t('q_deals'), cnt(r => r.deal))}{check('tags', 'featured', i.t('featured'), cnt(r => r.featured))}{check('tags', 'founding', i.t('founding'), cnt(r => r.founding))}</div></Grp>
    </div>
  );
}

/* ---------- phones: the same filters in a sheet; nothing applies until "Show 6 places" ---------- */
export function FilterDrawer({ open, onClose, f0, apply, cards, count }: {
  open: boolean; onClose: () => void; f0: RFilter; apply: (f: RFilter) => void; cards: RestaurantCard[]; count: (f: RFilter) => number;
}) {
  const i = useI();
  const [f, setF] = useState(f0);
  const [seen, setSeen] = useState(open);
  if (open !== seen) { setSeen(open); if (open) setF(f0); }
  const n = count(f);
  return (
    <Drawer.Root open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="vaul-over" />
        <Drawer.Content className="vaul-c" aria-describedby={undefined}>
          <div className="sheet">
            <div className="sheet-grip" />
            <div className="sheet-h"><Drawer.Title className="h3">{i.t('filters')}</Drawer.Title><button className="x" onClick={onClose} aria-label={i.t('close')}><I n="x" b /></button></div>
            <SideFilters f={f} setF={setF} id="m" cards={cards} />
            <div className="flt-go">
              <button className="btn btn-line" onClick={() => setF({ fac: [], media: [], tags: [], sort: f.sort, q: f.q })}>{i.t('clear_all')}</button>
              <button className="btn btn-pri" style={{ flex: 1 }} onClick={() => { apply(f); onClose(); }} disabled={!n}>{n ? <TNum k="show_n_places" n={n} /> : i.t('no_results')}</button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** the applied filters as chips; tap one to drop it */
export function ActiveChips({ chips, onDrop, onClear, style }: { chips: Chip[]; onDrop: (c: Chip) => void; onClear: () => void; style?: React.CSSProperties }) {
  const i = useI();
  return (
    <AnimatePresence initial={false}>
      {chips.length ? (
        <m.div key="act" className="act" style={style} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.22, ease: EASE }}>
          <AnimatePresence mode="popLayout" initial={false}>
            {chips.map(c => (
              <m.button layout key={c.k + c.v} className="chip on" onClick={() => onDrop(c)}
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.12 } }} transition={{ duration: 0.2, ease: EASE }} whileTap={{ scale: 0.97 }}>
                {c.label}<I n="x" b />
              </m.button>
            ))}
          </AnimatePresence>
          <m.button layout className="link" onClick={onClear}>{i.t('clear_all')}</m.button>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
