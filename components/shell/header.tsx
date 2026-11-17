'use client';
/* The diner header: logo, main pages, search, language, light or dark, sign in.
   On the home page it sits over the photo wall until you scroll past it. */
import { useEffect, useLayoutEffect, useRef, useState, ViewTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useThemeFlip } from '@/components/ui/theme-flip';
import { toast } from '@/lib/toast';
import { useI } from '@/components/providers/i18n';
import { I, Logo, Pic, Pill, Tk } from '@/components/ui/bits';
import { useApp } from '@/lib/store';
import { C, EASE } from '@/lib/khabo';
import type { Nav } from '@/lib/data/catalog';
import { useHref } from './nav';
import { MoreSheet } from './more';

export function useScrolled(limit: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let raf = 0;
    const f = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setOn(window.scrollY > limit)); };
    addEventListener('scroll', f, { passive: true }); f();
    return () => { removeEventListener('scroll', f); cancelAnimationFrame(raf); };
  }, [limit]);
  return on;
}

/** the page this address belongs to, for the active tab */
export function usePage() {
  const path = usePathname() || '/';
  const p = path.replace(/^\/(en|bn)/, '') || '/';
  if (p === '/') return 'home';
  return p.split('/')[1];
}

/** the same page in the other language */
export function useOtherLang() {
  const path = usePathname() || '/';
  const { lang } = useI();
  const router = useRouter();
  const other = lang === 'bn' ? 'en' : 'bn';
  const href = path.replace(/^\/(en|bn)/, '/' + other);
  /* the same page in the other language is fetched ahead, so the switch is instant (no loading screen) */
  useEffect(() => { router.prefetch(href); }, [router, href]);
  /* switching language: the page stays where it is and the words cross-fade in place (next.css, html[data-vt=lang]),
     instead of the usual page-change fade and rise; filters in the address are kept */
  /* building the page in the other language takes a moment: the page dims at once so the tap is felt
     (html[data-lang-wait]), then the new words fade in over it. The marks come off once the new language is drawn */
  const go = () => {
    document.cookie = `lang=${other}; path=/; max-age=31536000; samesite=lax`;
    const el = document.documentElement;
    const w = window as Window & { __khaboVT?: string };
    el.dataset.vt = 'lang'; el.dataset.langWait = ''; w.__khaboVT = 'lang';
    setTimeout(() => { delete el.dataset.langWait; if (el.dataset.vt === 'lang') delete el.dataset.vt; w.__khaboVT = undefined; }, 5000);
    router.push(href + location.search + location.hash, { scroll: false });
  };
  useLayoutEffect(() => {
    const el = document.documentElement;
    delete el.dataset.langWait;
    const tm = setTimeout(() => { if (el.dataset.vt === 'lang') delete el.dataset.vt; (window as Window & { __khaboVT?: string }).__khaboVT = undefined; }, 700);
    return () => clearTimeout(tm);
  }, [lang]);
  return { other, href, go };
}

/* a menu tab that opens a drop-down panel on hover or keyboard focus */
function Drop({ label, to, on, children }: { label: string; to: string; on: boolean; children: (close: () => void) => ReactNode }) {
  const [o, setO] = useState(false);
  const tm = useRef<ReturnType<typeof setTimeout>>(undefined);
  /* opening one drop-down closes any other at once, so two never show together */
  const enter = () => { clearTimeout(tm.current); setO(true); dispatchEvent(new CustomEvent('khabo-drop', { detail: label })); };
  const leave = () => { tm.current = setTimeout(() => setO(false), 160); };
  useEffect(() => {
    const f = (e: Event) => { if ((e as CustomEvent).detail !== label) { clearTimeout(tm.current); setO(false); } };
    addEventListener('khabo-drop', f);
    return () => removeEventListener('khabo-drop', f);
  }, [label]);
  /* (a leave timer still waiting only closes it again, so close needs nothing else) */
  const close = () => setO(false);
  /* a new page: the drop-down is gone at once, not fading out while the page changes */
  const path = usePathname();
  const [seen, setSeen] = useState(path);
  if (seen !== path) { setSeen(path); setO(false); }
  return (
    <div className="mm" onMouseEnter={enter} onMouseLeave={leave} onKeyDown={e => { if (e.key === 'Escape') close(); }}>
      <Link href={to} className={on ? 'on' : ''} aria-expanded={o} onClick={close} onFocus={enter}>
        {on ? <Pill id="hnav" /> : null}{label}<I n="caret-down" />
      </Link>
      <AnimatePresence>
        {o ? (
          <m.div key="mm" className="mm-pop" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }} transition={{ duration: 0.18, ease: EASE }}>
            {children(close)}
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const MW = {
  week: { en: 'Deal of the week', bn: 'সপ্তাহের অফার' },
  premium: { en: 'Premium partner', bn: 'প্রিমিয়াম পার্টনার' },
  deal: { en: 'Deal', bn: 'অফার' },
  allAreas: { en: 'All areas', bn: 'সব এলাকা' },
  allDishes: { en: 'Every dish', bn: 'সব খাবার' },
  kinds: { en: '{n} kinds of dish', bn: '{n} ধরনের খাবার' },
  prices: { en: 'Compare prices', bn: 'দাম তুলনা করুন' },
  pricesSub: { en: 'The same dish at every place', bn: 'একই খাবার, সব জায়গায়' },
};
/** the most areas listed under a city before "All areas" */
const AREA_CAP = 8;
/** the most kinds of dish listed under a cuisine */
const TYPE_CAP = 5;

/* the drop-down's deals, one at a time: they slide on by themselves every few seconds (not while the mouse is
   on them, never with reduced motion), and the dots jump to any of them */
function MegaDeals({ list, close }: { list: Nav['deals']; close: () => void }) {
  const i = useI(), href = useHref();
  const [k, setK] = useState(0), [hold, setHold] = useState(false);
  const reduce = useReducedMotion();
  const n = list.length;
  useEffect(() => {
    if (hold || reduce || n < 2) return;
    const tm = setTimeout(() => setK(x => (x + 1) % n), 4200);
    return () => clearTimeout(tm);
  }, [k, hold, reduce, n]);
  if (!n) return null;
  const z = list[k % n];
  return (
    <div className="mg-deals" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="mg-dx">
        <AnimatePresence initial={false} mode="popLayout">
          <m.div key={z.k} className="mg-dw" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24, transition: { duration: 0.16 } }} transition={{ duration: 0.32, ease: EASE }}>
            <Link className="mg-card" href={href('/r/' + z.rid) + '#deals'} onClick={close}>
              <Pic id={z.p} w={520} />
              <span><small>{i.L(z.week ? MW.week : z.plan === 'premium' ? MW.premium : MW.deal)}</small><b>{i.L(z.deal)}</b><span>{i.L(z.rname)}, <Tk v={z.price} /></span></span>
            </Link>
          </m.div>
        </AnimatePresence>
      </div>
      {n > 1 ? (
        <div className="mg-dots">
          {list.map((d, ix) => <button key={d.k} type="button" aria-label={i.L(d.deal)} aria-current={ix === k % n} onClick={() => setK(ix)} />)}
        </div>
      ) : null}
    </div>
  );
}

function RestMenu({ nav, on }: { nav: Nav; on: boolean }) {
  const i = useI(), href = useHref();
  const city = (c: string, close: () => void) => {
    const areas = C.areas.filter(a => a.city === c && nav.areaCount[a.id]).sort((a, b) => nav.areaCount[b.id] - nav.areaCount[a.id]);
    return (
      <div key={c}><h4>{i.L(C.cities[c])}</h4>
        {areas.slice(0, AREA_CAP).map(a => <Link key={a.id} href={href('/restaurants', { area: a.id })} onClick={close}>{i.L(a)}<em>{i.N(nav.areaCount[a.id])}</em></Link>)}
        {areas.length > AREA_CAP ? <Link className="dd-all" href={href('/restaurants', { city: c })} onClick={close}>{i.L(MW.allAreas)}<I n="arrow-right" /></Link> : null}
      </div>
    );
  };
  /* the busiest city gets its own column; the others share the next one with the budgets */
  const [c1, ...cs] = nav.cities;
  return (
    <Drop label={i.t('nav_restaurants')} to={href('/restaurants')} on={on}>
      {close => (
        <div className="dd">
          {c1 ? city(c1, close) : <div />}
          <div>{cs.map(c => city(c, close))}<h4 style={{ marginTop: 10 }}>{i.t('budget_pp')}</h4>{C.budgets.map(b => <Link key={b.id} href={href('/restaurants', { bud: b.id })} onClick={close}>{i.L(b)}</Link>)}</div>
          <div><h4>{i.t('occasions')}</h4>{C.occasions.filter(z => z.id !== 'tour').map(z => <Link key={z.id} href={href('/restaurants', { occ: z.id })} onClick={close}><I n={z.i} />{i.L(z)}</Link>)}</div>
          <div><h4>{i.t('facilities')}</h4>{Object.keys(C.facilities).slice(0, 8).map(f => <Link key={f} href={href('/restaurants', { fac: [f] })} onClick={close}><I n={C.facilities[f].i} />{i.L(C.facilities[f])}</Link>)}</div>
          <MegaDeals list={nav.deals} close={close} />
        </div>
      )}
    </Drop>
  );
}

function DishMenu({ nav, on }: { nav: Nav; on: boolean }) {
  const i = useI(), href = useHref();
  const n = new Map(nav.types.map(t => [t.id, t]));
  /* each cuisine with the kinds of dish places serve, read from the menus, so a new kind appears here by itself */
  const groups = C.cuisines.map(c => ({ c, ts: Object.keys(C.types).filter(id => C.types[id].cu === c.id && n.has(id)).sort((a, b) => n.get(b)!.n - n.get(a)!.n) })).filter(g => g.ts.length);
  return (
    <Drop label={i.t('nav_dishes')} to={href('/dishes')} on={on}>
      {close => (
        <div className="dd dd-dish">
          <div className="dd-cols">
            {groups.map(({ c, ts }) => (
              <div key={c.id} className="dd-g">
                <h4><Link href={href('/dishes', { cu: c.id })} onClick={close}>{i.L(c)}</Link></h4>
                {ts.slice(0, TYPE_CAP).map(id => <Link key={id} href={href('/dishes', { type: id })} onClick={close}>{i.L(C.types[id])}<em>{i.N(n.get(id)!.n)}</em></Link>)}
              </div>
            ))}
          </div>
          <div className="dd-side">
            <Link className="dd-big" href={href('/dishes')} onClick={close}><I n="bowl-food" /><span><b>{i.L(MW.allDishes)}</b><small>{i.L(MW.kinds).replace('{n}', i.N(nav.types.length))}</small></span></Link>
            <Link className="dd-big" href={href('/prices')} onClick={close}><I n="chart-line-up" /><span><b>{i.L(MW.prices)}</b><small>{i.L(MW.pricesSub)}</small></span></Link>
          </div>
        </div>
      )}
    </Drop>
  );
}

export function Header({ nav }: { nav: Nav }) {
  const i = useI(), href = useHref(), page = usePage();
  const flip = useThemeFlip();
  const set = useApp(s => s.set), user = useApp(s => s.user);
  const past = useScrolled(420), over = page === 'home' && !past;
  const { go: switchLang } = useOtherLang();
  const [more, setMore] = useState(false);
  const tab = (p: string, path: string, label: string) => (
    <Link href={href(path)} className={page === p ? 'on' : ''}>{page === p ? <Pill id="hnav" /> : null}{label}</Link>
  );
  return (
    <ViewTransition name="hdr">
      <header className={clsx('hdr', over && 'over')}>
        <div className="wrap">
          <Link href={href('/')} className="logo"><Logo />khabo</Link>
          <nav className="hnav" aria-label="Main">
            <RestMenu nav={nav} on={page === 'restaurants'} />
            <DishMenu nav={nav} on={page === 'dishes'} />
            {tab('deals', '/deals', i.t('nav_deals'))}
            {tab('prices', '/prices', i.tx('prices'))}
            {tab('events', '/events', i.tx('events'))}
            {tab('business', '/business', i.t('nav_business'))}
          </nav>
          <div className="hr">
            <button className="hsearch" onClick={() => set({ palette: true })} aria-label={i.t('search')}>
              <I n="magnifying-glass" b /><span>{i.t('search_short')}</span><span className="kbd">Ctrl K</span>
            </button>
            <button className="circ" onClick={switchLang} aria-label={i.t('switch_lang')}>{i.bn ? 'EN' : <span className="bn">বাং</span>}</button>
            <button className="circ th-b" onClick={ev => flip(ev)} aria-label={i.t('switch_theme')}>
              <I n="sun" cls="th-dark" /><I n="moon" cls="th-light" />
            </button>
            {/* phones: everything else (Prices, Events, For restaurants, light/dark) is one tap away in More */}
            <button className="circ more-b" onClick={() => setMore(true)} aria-label={i.t('more')} aria-expanded={more}>
              <I n="squares-four" />
            </button>
            {/* on phones only the icon shows, so the button carries its name for screen readers */}
            <button className="signin" aria-label={user ? i.tx('you') : i.t('sign_in')} onClick={() => user ? toast(i.t('signed_in_as', { n: user })) : set({ signin: {} })}>
              <I n="user-circle" /><span>{user ? i.tx('you') : i.t('sign_in')}</span>
            </button>
          </div>
        </div>
      </header>
      <MoreSheet open={more} onClose={() => setMore(false)} />
    </ViewTransition>
  );
}

export function TabBar() {
  const i = useI(), href = useHref(), page = usePage();
  const set = useApp(s => s.set);
  if (page === 'r' || page === 'partner' || page === 'admin' || page === 't') return null;
  const b = (p: string, path: string, icon: string, label: string) => (
    <Link href={href(path)} className={page === p ? 'on' : ''}><I n={icon} f={page === p} />{label}</Link>
  );
  return (
    <ViewTransition name="tabbar">
      <nav className="tabbar">
        {b('home', '/', 'house', i.t('tab_home'))}
        {b('restaurants', '/restaurants', 'storefront', i.t('nav_restaurants'))}
        <button onClick={() => set({ ai: { q: '' } })}><span className="orb"><I n="sparkle" f /></span>{i.t('tab_ask')}</button>
        {b('dishes', '/dishes', 'bowl-food', i.t('tab_dishes'))}
        {b('deals', '/deals', 'tag', i.t('nav_deals'))}
      </nav>
    </ViewTransition>
  );
}
