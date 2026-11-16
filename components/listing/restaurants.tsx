'use client';
import { CutleryScroll } from '@/components/ui/cutlery-scroll';
/* /restaurants: every partner restaurant with the full filters. The filters live in the address, so a
   filtered list can be shared or bookmarked. Ported from archive/prototype/app/app.js (List). */
import { useMemo, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Num, Rise, useMounted } from '@/components/ui/bits';
import { AreaPop, Choose } from '@/components/ui/choose';
import { RCard } from '@/components/cards/cards';
import { LongGrid } from './long-grid';
import { useLiveCards } from '@/lib/demo-db';
import { useApp } from '@/lib/store';
import { C, EASE, F0, areaOf, matchR, sortRestaurants, type RFilter } from '@/lib/khabo';
import type { RestaurantCard } from '@/lib/data/types';
import { ActiveChips, FilterDrawer, SORTS, SideFilters, chipsOf, countAll, dropChip, sortLabel, useLiveText, useUrlState, writeR } from './filters';
import '@/styles/pages-extra.css';

const readR = (q: Record<string, string | string[]>): RFilter => ({ ...F0(), ...q } as RFilter);

export function RestaurantsView({ cards: cards0 }: { cards: RestaurantCard[] }) {
  const i = useI();
  /* changes from the panels (a hidden or new restaurant) show at once */
  const cards = useLiveCards(cards0);
  const [f, setF] = useUrlState('/restaurants', readR, writeR);
  const area = useApp(s => s.area), set = useApp(s => s.set);
  const [sheet, setSheet] = useState(false);
  /* "open now" depends on the clock, so it only applies once the page runs in the browser */
  const live = useMounted();
  const run = (g: RFilter) => sortRestaurants(cards.filter(r => matchR(r, live ? g : { ...g, open: '' })), g, area);
  const rs = useMemo(() => sortRestaurants(cards.filter(r => matchR(r, live ? f : { ...f, open: '' })), f, area), [f, cards, area, live]);
  const [q, setQ] = useLiveText(f.q || '', v => setF({ ...f, q: v }));

  const a = f.area ? areaOf(f.area) : null, o = C.occasions.find(z => z.id === f.occ);
  const title = a ? i.t('rs_in', { a: i.L(a) }) : f.city ? i.t('rs_in', { a: i.L(C.cities[f.city]) }) : o ? i.L(o) : i.t('nav_restaurants');
  const sub = a ? i.L(a.blurb) : i.t('rs_sub', { n: i.N(cards.length) });
  const chips = chipsOf(i, f), nf = countAll(f, ['q']);
  const sorts = SORTS(i, 'list');
  const counts = useMemo(() => { const o: Record<string, number> = {}; cards.forEach(r => { o[r.area] = (o[r.area] || 0) + 1; }); return o; }, [cards]);
  const clear = () => setF({ ...F0(), sort: f.sort });

  return (
    <div className="wrap lp">
      <div className="lh">
        <div>
          <AnimatePresence mode="wait" initial={false}>
            <m.h1 key={title} className="h1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }} transition={{ duration: 0.28, ease: EASE }}>{title}</m.h1>
          </AnimatePresence>
          <Rise as="p" className="sub" d={1}>{sub}</Rise>
        </div>
        <label className="field">
          <I n="magnifying-glass" b />
          <input type="search" value={q} onChange={ev => setQ(ev.target.value)} placeholder={i.t('rs_search')} aria-label={i.t('rs_search')} enterKeyHint="search" />
        </label>
      </div>
      <div className="ls">
        <aside className="side-f cs-host" aria-label={i.t('filters')}><CutleryScroll more={i.t('more_filters')}><SideFilters f={f} setF={setF} id="s" cards={cards} /></CutleryScroll></aside>
        <div style={{ minWidth: 0 }}>
          <div className="lbar">
            <m.button className="tb-btn m-flt" onClick={() => setSheet(true)} whileTap={{ scale: 0.97 }}>
              <I n="sliders-horizontal" />{i.t('filters')}{nf ? <span className="cnt">{i.N(nf)}</span> : null}
            </m.button>
            <span className="n" aria-live="polite"><b><Num v={rs.length} /></b> {i.t(rs.length === 1 ? 'place_one' : 'places_word')}</span>
            <span className="sp" />
            {/* "nearest first" sorts from the diner's own area: let them change it right here */}
            <AnimatePresence initial={false}>
              {f.sort === 'near' ? (
                <m.span key="near" className="near-w" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }} transition={{ duration: 0.2, ease: EASE }}>
                  <AreaPop cls="tb-btn" counts={counts} />
                </m.span>
              ) : null}
            </AnimatePresence>
            <Choose icon="sort-ascending" label={sortLabel(sorts, f.sort)} title={i.t('sort')} opts={sorts} value={f.sort} onPick={v => setF({ ...f, sort: v })} />
          </div>
          <ActiveChips chips={chips} onDrop={c => setF(dropChip(f, c))} onClear={clear} />
          {rs.length ? (
            <LongGrid items={rs} card={(r, k) => <RCard r={r} plain eager={k < 3} />} small={() => (
              <div className="grid3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {rs.map((r, k) => (
                    <m.div key={r.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: EASE } }} transition={{ duration: 0.3, ease: EASE }}>
                      <RCard r={r} plain eager={k < 3} />
                    </m.div>
                  ))}
                </AnimatePresence>
              </div>
            )} />
          ) : (
            <m.div className="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
              <I n="magnifying-glass" />
              <b>{i.t('nothing_all')}</b>
              <p>{i.t('nothing_sub')}</p>
              <div className="empty-a">
                <button className="btn btn-line" onClick={clear}>{i.t('clear_all')}</button>
                <button className="btn btn-pri" onClick={() => set({ ai: { q: f.q || '' } })}><I n="sparkle" f />{i.t('ask_ai')}</button>
              </div>
            </m.div>
          )}
        </div>
      </div>
      <FilterDrawer open={sheet} onClose={() => setSheet(false)} f0={f} apply={setF} cards={cards} count={g => run(g).length} />
    </div>
  );
}
