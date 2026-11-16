'use client';
/* The panel frame: the sidebar on laptops; on phones a top bar, a tab bar at the bottom and the
   full menu in a sheet. Same for owners and the khabo team (ported from archive/prototype/panel/app.js paintSide). */
import { useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useThemeFlip } from '@/components/ui/theme-flip';
import { useI } from '@/components/providers/i18n';
import { Logo } from '@/components/ui/bits';
import { src, restFile, where } from '@/lib/khabo';
import { allR, canAny, getR, levelName, openRequests, repliesOf, restViewOk, reviewsOf, signOut, type PanelDB, type PR, type User } from '@/lib/panel/store';
import { ADMIN_NAV, ADMIN_TABS, REST_NAV, REST_TABS, SETTINGS_NAV, type NavItem } from '@/lib/panel/words';
import { Av, Ico, MonoR, NavLink, useT } from './ui';
import { SaveBar, useGuard } from './draft';

/** language and light or dark: the same two buttons everywhere in the panels */
export function LangThemeBtns({ cls = 'ibtn sm' }: { cls?: string }) {
  const i = useI(), t = useT(), router = useRouter(), path = usePathname() || '/', guard = useGuard();
  const flip = useThemeFlip();
  const other = i.bn ? 'en' : 'bn';
  const sw = () => guard(() => { document.cookie = `lang=${other}; path=/; max-age=31536000; samesite=lax`; router.push(path.replace(/^\/(en|bn)/, '/' + other), { scroll: false }); });
  return (
    <>
      <button type="button" className={clsx(cls, 'lang')} onClick={sw} aria-label={t('Switch language', 'ভাষা বদলান')}>{i.bn ? 'EN' : <span className="bn">বাং</span>}</button>
      <button type="button" className={cls} onClick={ev => flip(ev)} aria-label={t('Light or dark', 'আলো বা অন্ধকার')}>
        <Ico n="sun" sm cls="th-dark" /><Ico n="moon" sm cls="th-light" />
      </button>
    </>
  );
}

/** where we are inside the panel: the page key, and the restaurant the team is editing */
export function usePlace(area: 'partner' | 'admin') {
  const path = usePathname() || '';
  const parts = path.replace(/^\/(en|bn)/, '').split('/').filter(Boolean).slice(1);
  if (area === 'admin' && parts[0] === 'r') return { view: parts[2] || '', rid: parts[1] ? decodeURIComponent(parts[1]) : null };
  return { view: parts[0] || '', rid: null as string | null };
}

export function Shell({ area, db, me, children }: { area: 'partner' | 'admin'; db: PanelDB; me: User; children: ReactNode }) {
  const i = useI(), t = useT(), guard = useGuard();
  const { view, rid } = usePlace(area);
  const [open, setOpen] = useState(false);
  const path = usePathname(), [atPath, setAtPath] = useState(path);
  if (atPath !== path) { setAtPath(path); setOpen(false); }
  const base = `/${i.lang}/${area}`;
  const owner = me.role === 'restaurant';
  const r = owner ? getR(db, me.rid) : rid ? getR(db, rid) : undefined;
  const lowNoReply = (id: string | null) => reviewsOf(db, id).filter(v => !v.reply && !v.hidden && v.st <= 3).length;
  const badge = (k: string) => {
    if (k === 'reviews') { const n = lowNoReply(owner ? me.rid! : null); return n ? <span className="cnt">{i.N(n)}</span> : null; }
    if (k === 'restaurants') return <span className="cnt dim">{i.N(allR(db).length)}</span>;
    if (k === 'requests') { const n = openRequests(db).length; return n ? <span className="cnt gold">{i.N(n)}</span> : null; }
    if (k === 'team' && owner) { const n = repliesOf(db, me.rid!).length; return n ? <span className="cnt gold" title={t('New answer from khabo', 'খাবোর নতুন উত্তর')}>{i.N(n)}</span> : null; }
    return null;
  };
  const href = (k: string) => (k ? `${base}/${k}` : base);
  const adminItems = ADMIN_NAV.filter(x => canAny(x.perm, me));
  const active = rid ? 'restaurants' : view;
  const navList = owner
    ? REST_NAV.map(x => <NavLink key={x.k} href={href(x.k)} on={view === x.k} cls="nl"><Ico n={x.i} /><span>{i.L(x.l)}</span>{badge(x.k)}</NavLink>)
    : adminItems.map(x => <NavLink key={x.k} href={href(x.k)} on={active === x.k} cls="nl"><Ico n={x.i} /><span>{i.L(x.l)}</span>{badge(x.k)}</NavLink>);
  const accent = owner && r ? ({ '--accent': r.theme.accent, '--accent-ink': r.theme.deep } as CSSProperties) : undefined;
  const tabs: NavItem[] = owner ? REST_NAV.filter(x => REST_TABS.includes(x.k)) : adminItems.filter(x => ADMIN_TABS.includes(x.k));
  return (
    <div className={clsx('pnl pnl-app', open && 'nav-open')} style={accent}>
      <div className="shell">
        <aside className="side" aria-label={t('Main menu', 'মূল মেনু')}>
          <Link className="side-brand" href={base}><Logo /><span>khabo</span><small>{owner ? t('Partner', 'পার্টনার') : i.L(levelName(me))}</small></Link>
          {owner && r ? <RestCard r={r} /> : null}
          <nav className="nav" aria-label={owner ? t('Restaurant', 'রেস্টুরেন্ট') : t('Admin', 'অ্যাডমিন')}>
            {owner ? null : <h4>{t('khabo team', 'খাবো টিম')}</h4>}
            {navList}
          </nav>
          {!owner && r ? (
            <nav className="nav" aria-label={t('Now editing', 'এখন বদলানো হচ্ছে')}>
              <h4>{t('Now editing', 'এখন বদলানো হচ্ছে')}</h4>
              <Link className="nl on" href={`${base}/r/${r.id}`} style={{ height: 'auto', padding: '8px 12px' }}><MonoR r={r} cls="sm" /><span style={{ lineHeight: 1.25 }}>{i.L(r.name)}</span></Link>
            </nav>
          ) : null}
          <div className="side-foot">
            <div className="side-tools"><LangThemeBtns /><a className="ibtn sm" href={`/${i.lang}`} target="_blank" rel="noopener" aria-label={t('Open khabo', 'খাবো খুলুন')}><Ico n="globe-hemisphere-east" sm /></a><span className="note">{t('Prototype', 'প্রোটোটাইপ')}</span></div>
            <div className="me"><Av name={me.name} sm /><div><b>{me.name}</b><span>{owner ? t('Owner', 'মালিক') : `${i.L(levelName(me))} · ${t('khabo team', 'খাবো টিম')}`} · {me.u}</span></div>
              <button type="button" className="ibtn sm" onClick={() => guard(() => signOut())} aria-label={t('Sign out', 'সাইন আউট')}><Ico n="door-open" sm /></button></div>
          </div>
        </aside>
        <div className="nav-scrim" onClick={() => setOpen(false)} />
        <div className="main">
          <div className="mtop">
            <button type="button" className="ibtn" onClick={() => setOpen(true)} aria-label={t('Open menu', 'মেনু খুলুন')}><Ico n="list" /></button>
            <b>{r ? i.L(r.name) : t('khabo admin', 'খাবো অ্যাডমিন')}</b>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}><LangThemeBtns cls="ibtn" /></span>
          </div>
          {children}
        </div>
      </div>
      <SaveBar />
      <nav className="ptabs" aria-label={t('Quick menu', 'দ্রুত মেনু')}>
        {tabs.map(x => <NavLink key={x.k} href={href(x.k)} on={owner ? view === x.k : active === x.k}><Ico n={x.i} f={owner ? view === x.k : active === x.k} /><span>{i.L(x.s || x.l)}</span></NavLink>)}
        <button type="button" onClick={() => setOpen(true)}><Ico n="dots-three" /><span>{t('More', 'আরও')}</span></button>
      </nav>
    </div>
  );
}

/** the restaurant's own card at the top of the owner's menu: its cover, logo, colours and font */
function RestCard({ r }: { r: PR }) {
  const i = useI(), t = useT();
  return (
    <div className="side-ctx" data-font={r.theme.font || 'sans'} style={{ '--d': r.theme.deep, '--a': r.theme.accent } as CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className="sc-ph">{r.hero?.[0] ? <img src={src(r.hero[0], 600)} alt="" /> : null}</span>
      <div className="sc-id">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <span className="sc-logo">{r.brand?.logo ? <img src={restFile(r.id, r.brand.logo)} alt="" /> : <i>{r.mono || r.name.en.slice(0, 2).toUpperCase()}</i>}</span>
        <div className="sc-tx"><b>{i.L(r.name)}</b><span><Ico n="map-pin" sm />{where(i, r)}</span></div>
      </div>
      <a className="sc-go" href={`/${i.lang}/r/${r.id}`} target="_blank" rel="noopener">{t('View your page', 'আপনার পেজ দেখুন')}<Ico n="arrow-up-right" sm /></a>
    </div>
  );
}

/** the tabs above a restaurant's pages when the khabo team opens one */
export function RestTabs({ r, me, view }: { r: PR; me: User; view: string }) {
  const i = useI(), t = useT();
  const base = `/${i.lang}/admin/r/${r.id}`;
  const items = [...REST_NAV.filter(x => x.k !== 'team'), SETTINGS_NAV].filter(x => restViewOk(x.k, me));
  return (
    <nav className="rtabs" aria-label={i.L(r.name)}>
      {items.map(x => <NavLink key={x.k} href={x.k ? `${base}/${x.k}` : base} on={view === x.k}><Ico n={x.i} sm />{i.L(x.l)}</NavLink>)}
      <span className="sr">{t('Restaurant pages', 'রেস্টুরেন্টের পেজ')}</span>
    </nav>
  );
}
