'use client';
/* /dishes: every dish from every restaurant, grouped by cuisine or dish, or as one price list.
   Pick a dish type to compare its prices side by side. Ported from archive/prototype/app/app.js (Dishes, PricePanel, PriceList). */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Pic, Pill, RailX, Rise, Seg, Tk, useMounted } from '@/components/ui/bits';
import { AreaPop, Choose, type Opt } from '@/components/ui/choose';
import { DCard } from '@/components/cards/cards';
import { openDish } from '@/components/cards/actions';
import type { Q } from '@/components/shell/nav';
import { useApp } from '@/lib/store';
import { C, DF0, DISH_X, EASE, MAIN_DISHES, SPICE, areaOf, cuName, cuOf, matchR, norm, planOf, src, type DFilter } from '@/lib/khabo';
import type { DishCard, RestaurantCard } from '@/lib/data/types';
import { SORTS, areaLabel, areaOpts, areaValue, chipsOf, countAll, dropChip, pickArea, sortLabel, useLiveText, useUrlState, ActiveChips } from './filters';
import '@/styles/pages-extra.css';

/* a dish type, or the price list, is sorted cheapest first unless the diner picks another order */
const defSort = (f: Pick<DFilter, 'type' | 'mode'>) => (f.type || f.mode === 'prices' ? 'price' : 'rel');
const readD = (q: Record<string, string | string[]>): DFilter => {
  const f = { ...DF0(), ...q } as DFilter;
  if (!q.sort) f.sort = defSort(f);
  return f;
};
const writeD = (f: DFilter): Q => ({ ...f, sort: f.sort === defSort(f) ? '' : f.sort, group: f.group === 'cu' ? '' : f.group, mode: f.mode === 'grid' ? '' : f.mode });

/** the same rules as the prototype's dishes(): restaurant filters first, then the dish filters, then the order */
export function filterDishes(all: DishCard[], cards: RestaurantCard[], f: DFilter, near: string, live: boolean) {
  const ok = new Set(cards.filter(r => matchR(r, live ? f : { ...f, open: '' }, true)).map(r => r.id));
  let ds = all.filter(d => ok.has(d.r));
  if (f.type) ds = ds.filter(d => d.type === f.type);
  if (f.cu) ds = ds.filter(d => cuOf(d) === f.cu);
  if (f.max) ds = ds.filter(d => d.price <= Number(f.max));
  if (f.veg) ds = ds.filter(d => d.veg);
  /* "Mild only" links from before still work: they mean up to mild */
  const sp = SPICE.find(z => z.id === (f.spice || (f.mild ? '1' : '')));
  if (sp) ds = ds.filter(d => sp.ok(d.spice));
  for (const x of DISH_X) if ((f.dx || []).includes(x.id)) ds = ds.filter(d => x.ok(d));
  if (f.q) {
    const words = norm(f.q).split(/\s+/).filter(Boolean);
    ds = ds.filter(d => {
      const ty = C.types[d.type], ar = areaOf(d.rest.area);
      const h = norm([d.name.en, d.name.bn, ty?.en, ty?.bn, d.rest.name.en, d.rest.name.bn, ar.en, ar.bn].join(' '));
      return words.every(w => h.includes(w));
    });
  }
  const s: Record<string, (a: DishCard, b: DishCard) => number> = {
    price: (a, b) => a.price - b.price,
    rating: (a, b) => b.rest.rating - a.rest.rating,
    fresh: (a, b) => a.rest.checked - b.rest.checked,
    rel: (a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0) || (MAIN_DISHES.includes(b.type) ? 1 : 0) - (MAIN_DISHES.includes(a.type) ? 1 : 0) || planOf(b.rest) - planOf(a.rest) || b.rest.rating - a.rest.rating,
    near: (a, b) => Number(b.rest.area === near) - Number(a.rest.area === near) || a.price - b.price,
  };
  return ds.slice().sort(s[f.sort] || s.price);
}

const keyOf = (d: DishCard) => d.r + '/' + d.id;
const spread = (pr: number[]) => { const lo = pr[0], hi = pr[pr.length - 1]; return { lo, hi, mid: pr[Math.floor(pr.length / 2)], pos: (v: number) => (hi === lo ? 50 : (v - lo) / (hi - lo) * 100) }; };

/* ---------- one dish type: lowest, typical and highest, and every price as a dot on a line ---------- */
function PricePanel({ solo }: { solo: DishCard[] }) {
  const i = useI();
  const sorted = solo.slice().sort((a, b) => a.price - b.price), { lo, hi, mid, pos } = spread(sorted.map(d => d.price)), mi = Math.floor(sorted.length / 2);
  return (
    <m.div className="dh-price" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: EASE }}>
      <dl className="dh-stats">
        <div><dt>{i.t('lowest')}</dt><dd><Tk v={lo} flow /></dd></div>
        <div className="typ"><dt>{i.t('typical')}</dt><dd><Tk v={mid} flow /></dd></div>
        <div><dt>{i.t('highest')}</dt><dd><Tk v={hi} flow /></dd></div>
      </dl>
      <div className="dh-bar" role="img" aria-label={i.t('dh_bar_label', { n: i.N(sorted.length), lo: i.tk(lo), hi: i.tk(hi), m: i.tk(mid) })}>
        {sorted.map((d, k) => (
          <m.button key={keyOf(d)} className={clsx('dh-dot', k === mi && 'typ')} style={{ '--x': pos(d.price) + '%' } as CSSProperties}
            title={`${i.L(d.name)}, ${i.L(d.rest.name)}, ${i.tk(d.price)}`} aria-label={`${i.L(d.name)}, ${i.L(d.rest.name)}, ${i.tk(d.price)}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.1 + k * 0.03 }}
            onClick={() => openDish(d.rest, d)} />
        ))}
      </div>
    </m.div>
  );
}

/* ---------- the full price list: one block per dish, cheapest first, each price against the typical one ----------
   Built for thousands of places: each block shows its cheapest few rows and opens the rest on request, and
   the page shows a handful of blocks at a time with a button for the next ones. */
const PL_ROWS = 6, PL_BLOCKS = 8;
function PriceList({ ds, order }: { ds: DishCard[]; order: string[] }) {
  const i = useI();
  const [blocks, setBlocks] = useState(PL_BLOCKS);
  const types = [...new Set(ds.map(d => d.type))].sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999))
    .filter(ty => ds.some(d => d.type === ty && !d.share));
  return (
    <div className="plist">
      {types.slice(0, blocks).map(ty => <PLBlock key={ty} ty={ty} g={ds.filter(d => d.type === ty && !d.share).sort((a, b) => a.price - b.price)} />)}
      {types.length > blocks ? (
        <div className="cat-more"><button className="btn btn-line" onClick={() => setBlocks(blocks + PL_BLOCKS)}>{i.L(DW.moreDishes).replace('{n}', i.N(types.length - blocks))}<I n="caret-down" b /></button></div>
      ) : null}
    </div>
  );
}
function PLBlock({ ty, g }: { ty: string; g: DishCard[] }) {
  const i = useI();
  const [all, setAll] = useState(false);
  const { lo, hi, mid, pos } = spread(g.map(d => d.price));
  const rows = all ? g : g.slice(0, PL_ROWS);
  return (
          <Rise className="pl-b">
            <div className="pl-h">
              <div><h3 className="h3">{i.L(C.types[ty])}</h3><p className="meta">{i.t('stat_dishes', { n: i.N(g.length), p: i.N(new Set(g.map(d => d.r)).size) })}</p></div>
              <dl className="pl-k">
                <div><dt>{i.t('lowest')}</dt><dd><Tk v={lo} /></dd></div>
                <div className="typ"><dt>{i.t('typical')}</dt><dd><Tk v={mid} /></dd></div>
                <div><dt>{i.t('highest')}</dt><dd><Tk v={hi} /></dd></div>
              </dl>
            </div>
            <div className="pl-rows">
              {rows.map(d => {
                const r = d.rest, diff = d.price - mid, tn = diff < 0 ? 'lo' : diff > 0 ? 'hi' : 'typ';
                return (
                  <button key={keyOf(d)} className="pl-r" onClick={() => openDish(r, d)}>
                    <Pic id={d.p} w={120} tone={r.theme} icon={C.types[d.type]?.i} sizes="48px" />
                    <span className="nm"><b>{i.L(d.name)}</b><small><Mono r={r} />{i.L(r.name)} · {i.L(areaOf(r.area))}</small><span className="por">{i.L(d.por)}</span></span>
                    <span className="mini" aria-hidden="true"><i className={tn} style={{ '--x': pos(d.price) + '%' } as CSSProperties} /></span>
                    <span className="p"><Tk v={d.price} /><span className={clsx('pc-chip', tn)}>{diff === 0 ? i.t('pc_typ') : (diff < 0 ? '−' : '+') + i.tk(Math.abs(diff))}</span></span>
                  </button>
                );
              })}
            </div>
            {g.length > PL_ROWS ? (
              <button className="link pl-more" onClick={() => setAll(!all)} aria-expanded={all}>
                {all ? i.t('show_less') : i.L(DW.showAll).replace('{n}', i.N(g.length))}<I n={all ? 'caret-up' : 'caret-down'} b />
              </button>
            ) : null}
          </Rise>
  );
}

const CAPS = [150, 250, 400, 600, 1000];
const DW = {
  spice: { en: 'Spice', bn: 'ঝাল' },
  spiceT: { en: 'How spicy', bn: 'কতটা ঝাল' },
  anySpice: { en: 'Any spice', bn: 'যেকোনো ঝাল' },
  allCats: { en: 'All kinds', bn: 'সব ধরন' },
  findCat: { en: 'Find a kind of dish', bn: 'খাবারের ধরন খুঁজুন' },
  noCat: { en: 'No kind of dish by that name.', bn: 'এই নামে কোনো ধরন নেই।' },
  showAll: { en: 'Show all {n}', bn: 'সব {n}টি দেখুন' },
  moreDishes: { en: 'Show more dishes ({n})', bn: 'আরও খাবার দেখুন ({n})' },
};

/* every kind of dish in one panel, grouped by cuisine, with a search box: the rail above shows the
   popular ones, this holds them all however many there are */
function AllKinds({ order, counts, value, onPick }: { order: string[]; counts: Record<string, number>; value: string; onPick: (id: string) => void }) {
  const i = useI();
  const [q, setQ] = useState('');
  const qq = norm(q.trim());
  const ok = (id: string) => !qq || norm(C.types[id].en + ' ' + C.types[id].bn).includes(qq);
  const groups = C.cuisines.map(c => ({ c, ts: order.filter(id => C.types[id]?.cu === c.id && ok(id)) })).filter(g => g.ts.length);
  return (
    <div className="kinds">
      <label className="tb-q kinds-q"><I n="magnifying-glass" /><input type="search" value={q} onChange={ev => setQ(ev.target.value)} placeholder={i.L(DW.findCat)} aria-label={i.L(DW.findCat)} /></label>
      {groups.length ? (
        <div className="kinds-g">
          {groups.map(({ c, ts }) => (
            <div key={c.id}>
              <h4>{i.L(c)}</h4>
              <div className="chips">{ts.map(id => <button key={id} className={clsx('chip sm', value === id && 'on')} aria-pressed={value === id} onClick={() => onPick(id)}>{i.L(C.types[id])}<em>{i.N(counts[id] || 0)}</em></button>)}</div>
            </div>
          ))}
        </div>
      ) : <p className="meta">{i.L(DW.noCat)}</p>}
    </div>
  );
}
const pop = { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96, transition: { duration: 0.16, ease: EASE } }, transition: { duration: 0.3, ease: EASE } };

export function DishesView({ dishes, cards, order, pics }: { dishes: DishCard[]; cards: RestaurantCard[]; order: string[]; pics: Record<string, string | null> }) {
  const i = useI();
  const [f, setF] = useUrlState('/dishes', readD, writeD);
  const near = useApp(s => s.area);
  const live = useMounted();
  const ds = useMemo(() => filterDishes(dishes, cards, f, near, live), [dishes, cards, f, near, live]);
  const [q, setQ] = useLiveText(f.q || '', v => setF({ ...f, q: v }));

  /* the toolbar scrolls away; once it has, a slim bar shows what is applied */
  const tbRef = useRef<HTMLDivElement>(null);
  const [kinds, setKinds] = useState(false);
  const kindCount = useMemo(() => { const n: Record<string, number> = {}; dishes.forEach(d => { n[d.type] = (n[d.type] || 0) + 1; }); return n; }, [dishes]);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = tbRef.current; if (!el) return;
    const io = new IntersectionObserver(([en]) => setStuck(!en.isIntersecting && en.boundingClientRect.top < 80), { rootMargin: '-68px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ty = f.type ? C.types[f.type] : null, cu = f.cu ? C.cuisines.find(c => c.id === f.cu) : null;
  const title = ty ? i.L(ty) : cu ? i.L(cu) : f.q ? `“${f.q}”` : i.t('nav_dishes');
  const solo = ds.filter(d => !d.share), places = new Set(ds.map(d => d.r)).size, panel = !!ty && solo.length > 2;
  const sub = !ty && !cu && !f.q ? i.t('dishes_sub') : ds.length ? i.t(places === 1 && ds.length > 1 ? 'stat_dishes_1p' : 'stat_dishes', { n: i.N(ds.length), p: i.N(places) }) : '';
  const pic = ty ? pics[f.type!] : cu ? cu.p : null;
  const toTop = () => window.scrollTo({ top: 0 });
  const pickType = (id: string) => { setF({ ...f, type: id, cu: '', sort: defSort({ type: id, mode: f.mode }) }); };
  const sorts = SORTS(i, 'dishes');
  const priceOpts: Opt[] = [['', i.t('any_price')], ...CAPS.map(v => [String(v), i.t('dish_upto', { v: i.tk(v) })] as Opt)];
  const nAll = countAll(f, ['type']);
  const spiceNow = SPICE.find(z => z.id === (f.spice || (f.mild ? '1' : '')));
  const spiceOpts: Opt[] = [['', i.L(DW.anySpice)], ...SPICE.map(z => [z.id, i.L(z)] as Opt)];

  let body: React.ReactNode;
  if (!ds.length) {
    body = (
      <div className="empty">
        <I n="bowl-food" /><b>{i.t('nothing_all')}</b><p>{i.t('nothing_sub')}</p>
        <button className="btn btn-line" onClick={() => setF({ ...DF0(), group: f.group, mode: f.mode })}>{i.t('clear_all')}</button>
      </div>
    );
  } else if (f.mode === 'prices') {
    body = <PriceList ds={ds} order={order} />;
  } else if (f.type) {
    const low = solo.slice().sort((a, b) => a.price - b.price)[0];
    body = (
      <div className="dgrid">
        <AnimatePresence mode="popLayout" initial={false}>
          {ds.map(d => <m.div key={keyOf(d)} layout {...pop}><DCard d={d} lowest={d === low} /></m.div>)}
        </AnimatePresence>
      </div>
    );
  } else {
    const byType = f.group === 'type';
    const key = byType ? (d: DishCard) => d.type : (d: DishCard) => cuOf(d);
    const ord = byType ? Object.keys(C.types) : C.cuisines.map(c => c.id);
    body = ord.map(k => ({ k, ds: ds.filter(d => key(d) === k) })).filter(g => g.ds.length).map(g => {
      const label = byType ? i.L(C.types[g.k]) : cuName(i, g.k), pr = g.ds.filter(d => !d.share).map(d => d.price);
      const head = (
        <div className="dg-h" style={{ marginBottom: 0 }}>
          <h2 className="h3">{label}</h2>
          <p className="meta">
            <span>{i.t('stat_dishes', { n: i.N(g.ds.length), p: i.N(new Set(g.ds.map(d => d.r)).size) })}{pr.length ? `, ${i.tk(Math.min(...pr))} ${i.t('to')} ${i.tk(Math.max(...pr))}` : ''}</span>
            <button className="link" onClick={() => { if (byType) pickType(g.k); else setF({ ...f, cu: g.k }); toTop(); }}>{i.t('see_all')}<I n="arrow-right" b /></button>
          </p>
        </div>
      );
      return <section key={g.k} className="dgroup"><RailX head={head} cls="dc-rail">{g.ds.map(d => <DCard key={keyOf(d)} d={d} />)}</RailX></section>;
    });
  }

  return (
    <div className="lp">
      <div className="dh"><div className="wrap"><div className="dh-in">
        <div className="dh-h">
          <AnimatePresence mode="wait" initial={false}>
            <m.h1 key={title} className="h1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }} transition={{ duration: 0.3, ease: EASE }}>{title}</m.h1>
          </AnimatePresence>
          <p className="sub">{sub}</p>
        </div>
        {pic ? (
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={pic} className="dh-plate" initial={{ opacity: 0, rotate: -40, scale: 0.9 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 30, scale: 0.94, transition: { duration: 0.18 } }} transition={{ duration: 0.5, ease: EASE }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(pic, 560)} alt="" />
            </m.div>
          </AnimatePresence>
        ) : null}
        {panel ? <PricePanel solo={solo} /> : null}
      </div></div></div>

      <div className="tb" ref={tbRef}><div className="wrap">
        <div className="crail" role="tablist" aria-label={i.t('categories')}>
          <button className={clsx('cr', !f.type && 'on')} role="tab" aria-selected={!f.type} onClick={() => pickType('')}>
            {!f.type ? <Pill id="crail" /> : null}<span className="cr-ph"><I n="squares-four" /></span>{i.t('all_food')}
          </button>
          <button className={clsx('cr cr-all', kinds && 'open')} aria-expanded={kinds} onClick={() => setKinds(!kinds)}>
            <span className="cr-ph"><I n={kinds ? 'x' : 'list-bullets'} /></span>{i.L(DW.allCats)}<em>{i.N(order.length)}</em>
          </button>
          {order.map(id => {
            const p = pics[id], on = f.type === id;
            return (
              <button key={id} className={clsx('cr', on && 'on')} role="tab" aria-selected={on} onClick={() => pickType(id)}>
                {on ? <Pill id="crail" /> : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="cr-ph">{p ? <img src={src(p, 96)} alt="" loading="lazy" decoding="async" /> : <I n={C.types[id]?.i || 'fork-knife'} />}</span>{i.L(C.types[id])}
              </button>
            );
          })}
        </div>
        <AnimatePresence initial={false}>
          {kinds ? (
            <m.div key="k" className="kinds-w" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: EASE } }} transition={{ duration: 0.3, ease: EASE }}>
              <AllKinds order={order} counts={kindCount} value={f.type || ''} onPick={id => { pickType(id); setKinds(false); }} />
            </m.div>
          ) : null}
        </AnimatePresence>
        <div className="tb-row">
          <label className="tb-q"><I n="magnifying-glass" /><input type="search" value={q} onChange={ev => setQ(ev.target.value)} placeholder={i.t('dish_search')} aria-label={i.t('dish_search')} enterKeyHint="search" /></label>
          <div className="tb-sc">
            <Choose icon="map-pin" label={areaLabel(i, f)} on={!!(f.area || f.city)} title={i.t('area')} opts={areaOpts(i)} value={areaValue(f)} onPick={v => setF({ ...f, ...pickArea(v) })} align="start" />
            <Choose icon="money" label={f.max ? i.t('dish_upto', { v: i.tk(Number(f.max)) }) : i.t('any_price')} on={!!f.max} title={i.t('max_price')} opts={priceOpts} value={String(f.max || '')} onPick={v => setF({ ...f, max: v })} align="start" />
            <Choose icon="pepper" label={spiceNow ? i.L(spiceNow) : i.L(DW.spice)} on={!!spiceNow} title={i.L(DW.spiceT)} opts={spiceOpts} value={spiceNow?.id || ''} onPick={v => setF({ ...f, spice: v, mild: '' })} align="start" />
            {([['veg', 'leaf', i.t('veg')], ['open', 'clock', i.t('q_open')]] as const).map(([k, ic, l]) => (
              <button key={k} className={clsx('tb-btn', f[k] && 'on')} aria-pressed={!!f[k]} onClick={() => setF({ ...f, [k]: f[k] ? '' : '1' })}><I n={ic} />{l}</button>
            ))}
            {DISH_X.map(x => {
              const on = (f.dx || []).includes(x.id);
              return <button key={x.id} className={clsx('tb-btn', on && 'on')} aria-pressed={on} onClick={() => setF({ ...f, dx: on ? (f.dx || []).filter(z => z !== x.id) : [...(f.dx || []), x.id] })}><I n={x.i} />{i.L(x)}</button>;
            })}
            <span className="sp" />
            <Seg id="dmode" items={[['grid', <><I n="squares-four" />{i.tx('photos_v')}</>], ['prices', <><I n="list-numbers" />{i.tx('price_list')}</>]]} value={f.mode} onChange={v => setF({ ...f, mode: v, sort: v === 'prices' ? 'price' : f.sort })} />
            {!f.type && f.mode !== 'prices' ? <Seg id="dgroup" items={[['cu', i.t('by_cuisine')], ['type', i.t('by_dish')]]} value={f.group} onChange={v => setF({ ...f, group: v })} /> : null}
            {f.sort === 'near' ? <AreaPop cls="tb-btn" /> : null}
            <Choose icon="sort-ascending" label={sortLabel(sorts, f.sort)} title={i.t('sort')} opts={sorts} value={f.sort} onPick={v => setF({ ...f, sort: v })} />
          </div>
        </div>
      </div></div>

      <div className="tbm-w">
        <AnimatePresence>
          {stuck ? (
            <m.div key="m" className="tb-mini" initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0, transition: { duration: 0.16 } }} transition={{ duration: 0.25, ease: EASE }}>
              <div className="wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="tbm-cat">{pic ? <img src={src(pic, 80)} alt="" /> : <I n="squares-four" />}{title}</span>
                <div className="tbm-chips">
                  {chipsOf(i, { ...f, type: '' }).map(c => <button key={c.k + c.v} className="chip sm on" onClick={() => setF(dropChip(f, c))}>{c.label}<I n="x" b /></button>)}
                  {f.mode === 'prices' ? <span className="chip sm">{i.tx('price_list')}</span> : null}
                </div>
                <button className="tb-btn" onClick={() => tbRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <I n="sliders-horizontal" />{i.t('filters')}{nAll ? <span className="cnt">{i.N(nAll)}</span> : null}
                </button>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="wrap">
        <ActiveChips chips={chipsOf(i, { ...f, type: '', q: '' })} onDrop={c => setF(dropChip(f, c))} onClear={() => setF({ ...DF0(), group: f.group, mode: f.mode, type: f.type, sort: defSort(f) })} style={{ marginTop: 18 }} />
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={(f.type || 'all') + (f.cu || '') + f.mode + f.group} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.28, ease: EASE }}>
            {body}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
