'use client';
/* Small parts the table menu, its dish sheet and its bill share: the add button, photos, bill sums. */
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { I, Num, useMounted } from '@/components/ui/bits';
import { checkedLabel, src, srcSet } from '@/lib/khabo';
import { useApp, type BillOf } from '@/lib/store';
import { plates } from '@/components/cards/actions';
import type { Dish, Restaurant, RestaurantMini } from '@/lib/data/types';

/** the restaurant's colours (and font) for anything drawn outside the page, like the sheets */
export const rVars = (r: Pick<Restaurant, 'theme'>) => ({ '--r-deep': r.theme.deep, '--r-accent': r.theme.accent, '--d': r.theme.deep, '--a': r.theme.accent } as CSSProperties);

/** a photo, small on phones. crossOrigin lets the offline copy keep it without wasting space */
export function Img({ id, w, sizes, alt = '', eager, cls }: { id?: string | null; w: number; sizes?: string; alt?: string; eager?: boolean; cls?: string }) {
  if (!id) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src(id, w)} srcSet={srcSet(id, w)} sizes={sizes || `${Math.round(w / 2)}px`} alt={alt} crossOrigin="anonymous"
      loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : undefined} className={clsx(id.startsWith('ph:') && 'studio', cls)} />
  );
}

const EMPTY: BillOf['items'] = {};
/** what the add button needs to know about a dish */
export type AddDish = Pick<Dish, 'id' | 'name' | 'price' | 'p' | 'por' | 'type'> & { out?: boolean; sizes?: Dish['sizes'] };
const buzz = () => { try { navigator.vibrate?.(8); } catch { /* no buzz on this phone */ } };

/** + to add; then − 1 + once it is on the bill. Sold-out dishes say so instead */
export function TAdd({ r, d, onPick }: { r: RestaurantMini; d: AddDish; onPick?: () => void }) {
  const i = useI();
  const q = useApp(s => (s.bill[r.id]?.items || EMPTY)[d.id]?.q || 0);
  const all = useApp(s => plates(s.bill[r.id]?.items, d.id));
  const add = useApp(s => s.add);
  const name = i.L(d.name);
  if (d.out) return <span className="tm-add out">{i.t('sold_out')}</span>;
  /* a dish with portions: + opens the dish so the guest picks Full or Half first */
  if (d.sizes?.length) return (
    <button type="button" className={clsx('tm-add plus', all && 'has-n')} aria-label={`${i.t('pick_portion')}: ${name}`} onClick={ev => { ev.stopPropagation(); onPick?.(); }}>
      {all ? <b><Num v={all} /></b> : <I n="plus" b />}
    </button>
  );
  if (!q) {
    return (
      <button type="button" className="tm-add plus" aria-label={`${i.t('add_to_bill')}: ${name}`}
        onClick={ev => { ev.stopPropagation(); add(r, d, 1); buzz(); }}>
        <I n="plus" b />
      </button>
    );
  }
  return (
    <span className="tm-add has pop" onClick={ev => ev.stopPropagation()} onKeyDown={ev => ev.stopPropagation()}>
      <button type="button" aria-label={`${i.t('remove_one')}: ${name}`} onClick={() => add(r, d, -1)}><I n={q === 1 ? 'x' : 'minus'} b /></button>
      <span className="v" aria-live="polite"><Num v={q} /></span>
      <button type="button" aria-label={`${i.t('add_one')}: ${name}`} onClick={() => q < 20 && add(r, d, 1)}><I n="plus" b /></button>
    </span>
  );
}

/** how many days ago the prices were checked. An owner's or the team's save (checkedAt) counts from today */
export const checkedDays = (r: Pick<Restaurant, 'checked' | 'checkedAt'>, now = Date.now()) =>
  r.checkedAt ? Math.max(0, Math.floor((now - r.checkedAt) / 864e5)) : r.checked;
/** "Prices checked 2 days ago", only after the page has loaded (it depends on today's date) */
export function useChecked(r: Pick<Restaurant, 'checked' | 'checkedAt'>) {
  const i = useI(), on = useMounted();
  return on ? checkedLabel(i, checkedDays(r)) : '';
}

export type Line ={ d: Dish | (BillOf['items'][string]['d'] & Partial<Dish>); q: number; line: number };
/** the bill for one restaurant, priced from the live menu (an owner's new price shows straight away) */
export function sums(r: Restaurant, b: BillOf | undefined, people: number) {
  const lines: Line[] = Object.values(b?.items || {}).map(x => {
    const live = r.menu.find(m => m.id === x.d.id);
    const d = live || x.d;
    return { d, q: x.q, line: d.price * x.q };
  });
  const sub = lines.reduce((s, x) => s + x.line, 0), vat = sub * r.vat / 100, svc = sub * r.service / 100, total = sub + vat + svc;
  const ppl = Math.max(1, people || 1);
  return { lines, count: lines.reduce((s, x) => s + x.q, 0), sub, vat, svc, total, people: ppl, pp: total / ppl };
}
