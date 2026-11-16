'use client';
/* QR table menu: what a guest sees after scanning the card on the table. Ported from website/code/pages/table.js.
   Light on purpose: one small header photo, small dish photos, works on slow connections and offline. No login.
   The restaurant picks its layout, top and colours in its panel (r.qr.layout, r.qr.header, r.qr.theme). */
import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Spice, Tk, useMounted } from '@/components/ui/bits';
import { useHref } from '@/components/shell/nav';
import { useLiveRestaurant } from '@/lib/demo-db';
import { C, SPR, areaOf, clock, isOpen, norm, toMini } from '@/lib/khabo';
import { useApp } from '@/lib/store';
import type { Dish, Restaurant } from '@/lib/data/types';
import { TableDishSheet } from './dish-sheet';
import { TableBill, TableTray } from './bill';
import { OfflineNote, useTableOffline } from './offline';
import { Img, TAdd, sums, useChecked } from './parts';
import { PriceOf } from '@/components/cards/cards';
import { W, fillW } from './words';
import { GamesCard, TableGames } from './games';

const noop = () => () => {};
/** the address's ?query, read after the page has loaded (the page itself is made ahead of time) */
const useSearchString = () => useSyncExternalStore(noop, () => location.search, () => '');
const pick = (v: string | null | undefined, ok: Record<string, unknown>, d: string): string => (v && v in ok ? v : d);

export function TableMenu({ r: r0 }: { r: Restaurant }) {
  const i = useI(), href = useHref(), mounted = useMounted();
  const r = useLiveRestaurant(r0);
  const mini = useMemo(() => toMini(r), [r]);
  const off = useTableOffline();
  const checked = useChecked(r);

  /* the table number comes from the code on the table (?table=4). The panel's live preview may pass unsaved
     choices (tml = layout, tmh = top, tmt = colours); they only count inside that preview (a frame) */
  const search = useSearchString();
  const sp = new URLSearchParams(search);
  const table = (sp.get('table') || '').replace(/\D/g, '').slice(0, 3);
  const inFrame = useSyncExternalStore(noop, () => window.self !== window.top, () => false);
  const prev = inFrame ? { layout: sp.get('tml'), header: sp.get('tmh'), theme: sp.get('tmt') } : {};
  /* the phone's top bar takes the restaurant's own colour while the menu is open */
  useEffect(() => {
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
    const was = metas.map(m => m.content);
    metas.forEach(m => { m.content = r.theme.deep; });
    return () => metas.forEach((m, k) => { m.content = was[k]; });
  }, [r.theme.deep]);
  const qs: { layout?: string; header?: string; theme?: string } = { ...r.qr, ...Object.fromEntries(Object.entries(prev).filter(([, v]) => v)) };
  const lay = pick(qs.layout, C.tableMenu.layouts, 'list'), hd = pick(qs.header, C.tableMenu.headers, 'photo'), th = pick(qs.theme, C.tableMenu.themes, 'auto');
  const big = lay === 'photos' || lay === 'cards';

  /* groups and search */
  const groups = useMemo(() => r.cats.map(c => ({ c, ds: r.menu.filter(d => (d.cat || r.cats[0]?.id) === c.id) })).filter(g => g.ds.length), [r]);
  const pop = useMemo(() => (r.signature || []).map(x => r.menu.find(d => d.id === x)).filter((d): d is Dish => !!d && !!d.p).slice(0, 6), [r]);
  const [q, setQ] = useState('');
  const dq = norm(useDeferredValue(q).trim());
  const words = dq ? dq.split(/\s+/) : [];
  const hit = (d: Dish) => { if (!words.length) return true; const h = norm(d.name.en + ' ' + d.name.bn + ' ' + (C.types[d.type]?.en || '') + ' ' + (C.types[d.type]?.bn || '')); return words.every(w => h.includes(w)); };
  const shown = groups.map(g => ({ ...g, ds: g.ds.filter(hit) })).filter(g => g.ds.length);

  /* the tab of the section on screen; it slides along as the guest scrolls */
  const [cat, setCat] = useState(groups[0]?.c.id || '');
  const chipRow = useRef<HTMLDivElement>(null), nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.tm-g[data-cat]'));
    if (!els.length) return;
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) setCat((en.target as HTMLElement).dataset.cat || ''); }), { rootMargin: '-35% 0px -60% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [shown.length, dq]);
  useEffect(() => {
    const row = chipRow.current, chip = row?.querySelector<HTMLElement>(`[data-tcat="${CSS.escape(cat)}"]`);
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - 16, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [cat]);
  const goCat = (id: string) => {
    const el = document.getElementById('tc-' + id); if (!el) return;
    setCat(id);
    const top = el.getBoundingClientRect().top + scrollY - (nav.current?.offsetHeight || 56);
    scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  /* the dish sheet and the bill */
  const [dish, setDish] = useState<Dish | null>(null), [dishOpen, setDishOpen] = useState(false), [billOpen, setBillOpen] = useState(false), [games, setGames] = useState(false);
  const openDish = (d: Dish) => { setDish(d); setDishOpen(true); };
  const bill = useApp(s => s.bill[r.id]), people = useApp(s => s.people);
  const x = sums(r, bill, people);
  const keyOpen = (d: Dish) => (ev: React.KeyboardEvent) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openDish(d); } };

  /* open now is a matter of the clock, so it shows once the page has loaded */
  const from = clock(i, r.hours[0]), until = clock(i, r.hours[1]), open = mounted && isOpen(r);
  const other = i.bn ? 'en' : 'bn';
  const langHref = `/${other}/t/${encodeURIComponent(r.id)}${search}`;
  const note = r.vat && r.service ? i.t('tm_note', { v: i.N(r.vat), s: i.N(r.service) }) : r.vat ? fillW(i.L(W.noteVat), { v: i.N(r.vat) }) : r.service ? fillW(i.L(W.noteSvc), { s: i.N(r.service) }) : i.L(W.noteNone);
  const vars = { '--r-deep': r.theme.deep, '--r-accent': r.theme.accent, '--d': r.theme.deep, '--a': r.theme.accent } as CSSProperties;

  const item = (d: Dish) => (
    <article key={d.id} className={clsx('tm-i', d.out && 'is-out')} role="button" tabIndex={0} aria-label={i.L(d.name)} onClick={() => openDish(d)} onKeyDown={keyOpen(d)}>
      <div className="tm-t">
        <b>{i.L(d.name)}{d.best ? <span className="tm-best">{i.t('best_seller')}</span> : null}</b>
        <span className="tm-alt">{i.bn ? d.name.en : d.name.bn}</span>
        <span className="tm-por">{i.L(d.por)}{d.spice ? <>{' · '}<Spice n={d.spice} /></> : null}{d.veg ? <>{' · '}<span className="tm-veg">{i.t('veg')}</span></> : null}</span>
        {d.sizes?.length ? <span className="tm-price"><PriceOf d={d} /></span> : <Tk v={d.price} cls="tm-price" />}
      </div>
      <div className="tm-r">
        {d.p ? <span className="tm-ph"><Img id={d.p} w={big ? 560 : 200} sizes={big ? (lay === 'photos' ? '(max-width: 680px) 46vw, 320px' : '(max-width: 680px) 92vw, 640px') : '84px'} alt="" /></span> : null}
        <TAdd r={mini} d={d} onPick={() => openDish(d)} />
      </div>
    </article>
  );

  return (
    <div className={clsx('tm', 'tm-l-' + lay, 'tm-hd-' + hd, 'tm-th-' + th)} data-font={r.theme.font} style={vars}>
      <header className="tm-h">
        <div className="tm-bg" aria-hidden="true">{hd === 'photo' && r.hero[0] ? <Img id={r.hero[0]} w={900} sizes="100vw" eager /> : null}</div>
        <div className="tm-w">
          <div className="tm-top">
            <Mono r={r} /><span className="sp" />
            <a className="tm-lang" href={langHref} lang={other} aria-label={i.L(W.langLabel)}
              onClick={() => { document.cookie = `lang=${other}; path=/; max-age=31536000; samesite=lax`; }}>
              {i.L(W.viewIn)}
            </a>
          </div>
          {table ? <p className="tm-wel">{i.t('tm_welcome')}<span className="tm-tbl">{i.t('table_n', { n: i.dg(table) })}</span></p> : null}
          <h1 className="tm-name">{i.L(r.name)}</h1>
          <p className="tm-sub">
            {i.L(areaOf(r.area))}
            {mounted ? <>{' · '}<span className={open ? 'on' : 'off'}>{open ? i.t('open_now') : i.t('closed_now')}</span></> : null}
            {' · '}{from} {i.t('to')} {until}
          </p>
          <label className="tm-q">
            <I n="magnifying-glass" b />
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={i.t('search_menu')} aria-label={i.t('search_menu')} enterKeyHint="search" />
            {q ? <button type="button" className="tm-q-x" onClick={() => setQ('')} aria-label={i.L(W.clearSearch)}><I n="x-circle" f /></button> : null}
          </label>
        </div>
      </header>

      <nav className="tm-cats" aria-label={i.t('menu')} ref={nav}>
        <div className="tm-w">
          <div className="tm-chips" ref={chipRow}>
            {shown.map(({ c }) => (
              <button key={c.id} type="button" className={clsx('tm-chip', cat === c.id && 'on')} data-tcat={c.id} aria-current={cat === c.id ? 'true' : undefined} onClick={() => goCat(c.id)}>
                {cat === c.id ? <m.span layoutId="tm-cat" className="tm-pill" transition={SPR} /> : null}{i.L(c)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="tm-w tm-body">
        <OfflineNote s={off} r={r} />
        <div className="tm-note">
          <p><I n="receipt" /><span>{note}</span></p>
          {checked ? <p className="tm-ok"><I n="check-circle" /><span>{checked}</span></p> : null}
        </div>

        {pop.length && !dq ? (
          <section className="tm-pop">
            <h2>{i.t('tm_popular')}</h2>
            <div className="tm-pop-r">
              {pop.map(d => (
                <article key={d.id} className="tm-pc" role="button" tabIndex={0} aria-label={i.L(d.name)} onClick={() => openDish(d)} onKeyDown={keyOpen(d)}>
                  <span className="tm-pc-ph"><Img id={d.p} w={320} sizes="152px" alt="" /></span>
                  <b>{i.L(d.name)}</b>
                  <span className="tm-pc-p"><PriceOf d={d} short /><TAdd r={mini} d={d} onPick={() => openDish(d)} /></span>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!dq ? <GamesCard onOpen={() => setGames(true)} /> : null}

        {shown.map(({ c, ds }) => (
          <section key={c.id} className="tm-g" id={'tc-' + c.id} data-cat={c.id}>
            <h2>{i.L(c)}<span>{i.t('tm_items', { n: i.N(ds.length) })}</span></h2>
            {ds.map(item)}
          </section>
        ))}
        {!shown.length ? <p className="tm-none">{i.t('menu_none')}</p> : null}

        <div className="tm-end">
          <Link className="tm-card" href={href('/r/' + r.id, { open: 'review' })}>
            <I n="star" f /><span><b>{i.t('tm_rate')}</b><span>{i.t('tm_rate_sub')}</span></span><I n="caret-right" b />
          </Link>
          <Link className="tm-card" href={href('/r/' + r.id)}>
            <I n="storefront" /><span><b>{i.t('tm_full')}</b><span>{i.t('tm_full_sub')}</span></span><I n="caret-right" b />
          </Link>
          <div className="tm-by">
            <span>{i.t('tm_by', { b: 'khabo' })}</span>
            {off.saved && !off.off && !off.fromCopy ? <span><I n="cloud-arrow-down" />{i.L(W.savedHere)}</span> : null}
          </div>
        </div>
      </main>

      <TableTray r={r} x={x} hidden={billOpen} onOpen={() => setBillOpen(true)} />
      <TableBill r={r} mini={mini} x={x} open={billOpen} onClose={() => setBillOpen(false)} table={table} theme={th} />
      <TableGames r={r} open={games} onClose={() => setGames(false)} theme={th} />
      <TableDishSheet r={r} mini={mini} dish={dish} open={dishOpen} onClose={() => setDishOpen(false)} onPick={openDish} theme={th} />
    </div>
  );
}
