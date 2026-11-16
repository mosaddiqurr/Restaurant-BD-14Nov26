'use client';
/* The diner header: logo, main pages, search, language, light or dark, sign in.
   On the home page it sits over the photo wall until you scroll past it. */
import { useEffect, useLayoutEffect, useRef, useState, ViewTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
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

function Mega({ nav, on }: { nav: Nav; on: boolean }) {
  const i = useI(), href = useHref();
  const [o, setO] = useState(false);
  const tm = useRef<ReturnType<typeof setTimeout>>(undefined);
  const enter = () => { clearTimeout(tm.current); setO(true); }, leave = () => { tm.current = setTimeout(() => setO(false), 160); };
  const close = () => { clearTimeout(tm.current); setO(false); };
  /* a new page: the drop-down is gone at once, not fading out while the page changes */
  const path = usePathname();
  const [seen, setSeen] = useState(path);
  if (seen !== path) { setSeen(path); setO(false); }
  const city = (c: string) => (
    <div><h4>{i.L(C.cities[c])}</h4>
      {C.areas.filter(a => a.city === c).map(a => <Link key={a.id} href={href('/restaurants', { area: a.id })} onClick={close}>{i.L(a)}<em>{i.N(nav.areaCount[a.id] || 0)}</em></Link>)}
    </div>
  );
  return (
    <div className="mm" onMouseEnter={enter} onMouseLeave={leave}>
      <Link href={href('/restaurants')} className={on ? 'on' : ''} aria-expanded={o} onClick={close} onFocus={enter}>
        {on ? <Pill id="hnav" /> : null}{i.t('nav_restaurants')}<I n="caret-down" />
      </Link>
      <AnimatePresence>
        {o ? (
          <m.div key="mm" className="mm-pop" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }} transition={{ duration: 0.18, ease: EASE }}>
            <div className="dd">
              {city('dhaka')}
              <div>{city('bogura')}<h4 style={{ marginTop: 10 }}>{i.t('budget_pp')}</h4>{C.budgets.map(b => <Link key={b.id} href={href('/restaurants', { bud: b.id })} onClick={close}>{i.L(b)}</Link>)}</div>
              <div><h4>{i.t('occasions')}</h4>{C.occasions.filter(z => z.id !== 'tour').map(z => <Link key={z.id} href={href('/restaurants', { occ: z.id })} onClick={close}><I n={z.i} />{i.L(z)}</Link>)}</div>
              <div><h4>{i.t('facilities')}</h4>{['cabin', 'rooftop', 'parking', 'prayer', 'kids', 'events'].map(f => <Link key={f} href={href('/restaurants', { fac: [f] })} onClick={close}><I n={C.facilities[f].i} />{i.L(C.facilities[f])}</Link>)}</div>
              {nav.week ? (
                <Link className="mg-card" href={href('/r/' + nav.week.rid) + '#deals'} onClick={close}>
                  <Pic id={nav.week.p} w={520} />
                  <span><small>{i.t('deal_week')}</small><b>{i.L(nav.week.deal)}</b><span>{i.L(nav.week.rname)}, <Tk v={nav.week.price} /></span></span>
                </Link>
              ) : null}
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
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
            <Mega nav={nav} on={page === 'restaurants'} />
            {tab('dishes', '/dishes', i.t('nav_dishes'))}
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
            <button className="signin" onClick={() => user ? toast(i.t('signed_in_as', { n: user })) : set({ signin: {} })}>
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
