'use client';
/* The panel's root: loads the saved data, decides who is signed in, and only then draws the pages.
   Restaurant owners only ever reach their own restaurant; khabo team levels only reach what their level allows.
   This is a demo lock in the browser. THE REAL LOCK IS ON THE SERVER LATER (Supabase Auth + row level security). */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import type { Restaurant, Review } from '@/lib/data/types';
import {
  canAny, getR, log, openRequests, requestsOf, restViewOk, setBase, setSay, touch, usePanelDB, type PanelDB, type User,
} from '@/lib/panel/store';
import { ADMIN_NAV, REQ, REST_NAV, SETTINGS_NAV } from '@/lib/panel/words';
import { RestTabs, Shell, usePlace } from './shell';
import { SignIn } from './signin';
import { SaveHost } from './draft';
import { RestDraft } from './rdraft';
import { ConfirmHost, Ico, NoAccess, PageExtras, PanelCtx, usePanel as useCtx, useT } from './ui';

export function PanelRoot({ area, restaurants, reviews, children }: { area: 'partner' | 'admin'; restaurants: Restaurant[]; reviews: Review[]; children: ReactNode }) {
  setBase(restaurants, reviews); /* the catalog; saved changes are laid on top */
  const i = useI(), router = useRouter();
  const { db, me, ready } = usePanelDB();
  useEffect(() => { setSay((msg, kind) => (kind === 'bad' ? toast.error(i.L(msg)) : toast.success(i.L(msg)))); }, [i]);
  /* activity keeps the session alive */
  useEffect(() => {
    const f = () => touch();
    addEventListener('pointerdown', f, { passive: true }); addEventListener('keydown', f);
    return () => { removeEventListener('pointerdown', f); removeEventListener('keydown', f); };
  }, []);
  /* an owner on the team panel (or the other way round) goes to their own panel */
  const wrong = !!me && ((area === 'partner' && me.role === 'admin') || (area === 'admin' && me.role === 'restaurant'));
  useEffect(() => { if (wrong && me) router.replace(`/${i.lang}/${me.role === 'admin' ? 'admin' : 'partner'}`); }, [wrong, me, router, i.lang]);
  useLiveNews(db, me);
  if (!ready || !db) return <div className="pnl pnl-app" />;
  if (!me) return <div className="pnl pnl-app"><SignIn db={db} area={area} /><ConfirmHost /></div>;
  if (wrong) return <div className="pnl pnl-app" />;
  return <Inner area={area} db={db} me={me}>{children}</Inner>;
}

function Inner({ area, db, me, children }: { area: 'partner' | 'admin'; db: PanelDB; me: User; children: ReactNode }) {
  const i = useI();
  const base = `/${i.lang}/${area}`;
  const r = me.role === 'restaurant' ? getR(db, me.rid) : undefined;
  const value = useMemo(() => ({
    area, db, me, r,
    rto: (v: string) => (v ? `${base}/${v}` : base),
    to: (p: string) => (p ? `${base}/${p.replace(/^\//, '')}` : base),
  }), [area, db, me, r, base]);
  return (
    <PanelCtx.Provider value={value}>
      <SaveHost>
        <Shell area={area} db={db} me={me}>{children}</Shell>
      </SaveHost>
      <ConfirmHost />
    </PanelCtx.Provider>
  );
}

/** another tab (or later, the server) changed something: a new owner request pops up for the team; an answer pops up for the owner */
function useLiveNews(db: PanelDB | null, me: User | null) {
  const i = useI(), t = useT();
  const prev = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    if (!db || !me) { prev.current = null; return; }
    const now = new Map(db.requests.map(q => [q.id, q.state]));
    const before = prev.current; prev.current = now;
    if (!before) return;
    if (me.role === 'admin' && canAny('rest.admin', me)) openRequests(db).filter(q => !before.has(q.id)).forEach(q => {
      const r = getR(db, q.rid); if (r) toast(t(`New request from ${r.name.en}: ${REQ[q.kind].en}`, `${r.name.bn} থেকে নতুন অনুরোধ: ${REQ[q.kind].bn}`));
    });
    if (me.role === 'restaurant') requestsOf(db, me.rid).filter(q => before.get(q.id) === 'open' && (q.state === 'done' || q.state === 'declined')).forEach(q => {
      const yes = q.state === 'done';
      (yes ? toast.success : toast.error)(t(`khabo ${yes ? 'said yes to' : 'declined'} your request: ${REQ[q.kind].en}`, `খাবো আপনার অনুরোধে ${yes ? 'হ্যাঁ' : 'না'} বলেছে: ${REQ[q.kind].bn}`));
    });
  }, [db, me, i, t]);
}

/* a blocked attempt is logged once (React runs effects twice while developing) */
const seen = new Map<string, number>();
const once = (k: string) => { const now = Date.now(), was = seen.get(k) || 0; seen.set(k, now); return now - was > 2000; };

/* ---------- gates: the same check a server would make. A page your level cannot open never renders ---------- */
/** one page about one restaurant. Owners: their own. Team: the restaurant in the address, with tabs above */
export function RestGate({ view, rid, children }: { view: string; rid?: string; children: ReactNode }) {
  const p = useCtx(), i = useI(), t = useT();
  const r = rid ? getR(p.db, rid) : p.r;
  const ok = !!r && restViewOk(view, p.me) && (p.me.role === 'admin' || p.me.rid === r.id);
  const label = [...REST_NAV, SETTINGS_NAV].find(x => x.k === view)?.l;
  const rid0 = r?.id, rn = r?.name;
  useEffect(() => {
    if (rid0 && rn && !ok && once(`${rid0}|${view}`)) log(rid0, { en: `Tried to open ${label?.en || view} for ${rn.en} (no access)`, bn: `${rn.bn}-এর ${label?.bn || view} খোলার চেষ্টা (অনুমতি নেই)` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid0, ok, view]);
  if (!r) return (
    <div className="pg"><div className="card empty" style={{ marginTop: 24 }}><Ico n="storefront" /><b>{t('This restaurant is not on khabo any more', 'এই রেস্টুরেন্ট আর খাবোতে নেই')}</b>
      {p.area === 'admin' ? <Link className="btn sm" href={`/${i.lang}/admin/restaurants`} style={{ marginTop: 12 }}>{t('All restaurants', 'সব রেস্টুরেন্ট')}</Link> : null}</div></div>
  );
  if (!ok) return <NoAccess what={t(`this page for ${r.name.en}`, `${r.name.bn}-এর এই পেজ`)} />;
  const base = p.area === 'admin' ? `/${i.lang}/admin/r/${r.id}` : `/${i.lang}/partner`;
  const extras = p.area === 'admin'
    ? { crumb: <div className="crumb"><Link href={`/${i.lang}/admin/restaurants`}>{t('Restaurants', 'রেস্টুরেন্ট')}</Link><Ico n="caret-right" sm /><span>{i.L(r.name)}</span></div>, tabs: <RestTabs r={r} me={p.me} view={view} /> }
    : {};
  return (
    <RestDraft key={r.id} live={r} base={base}>
      <PageExtras.Provider value={extras}><div key={r.id + view} style={{ display: 'contents' }}>{children}</div></PageExtras.Provider>
    </RestDraft>
  );
}
/** one khabo team page (Requests, Leads, Billing...) */
export function AdminGate({ k, children }: { k: string; children: ReactNode }) {
  const p = useCtx(), i = useI();
  const item = ADMIN_NAV.find(x => x.k === k);
  const ok = p.me.role === 'admin' && (!item || canAny(item.perm, p.me));
  useEffect(() => { if (!ok && item && once('admin|' + item.k)) log(null, { en: `Tried to open ${item.l.en} (no access)`, bn: `${item.l.bn} খোলার চেষ্টা (অনুমতি নেই)` }); }, [ok, item]);
  if (!ok) return <NoAccess what={item ? i.L(item.l) : k} />;
  return <>{children}</>;
}
export { usePlace };
