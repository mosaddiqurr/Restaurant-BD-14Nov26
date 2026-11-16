'use client';
/* Activity: every change, by the team and by restaurants. Search, filter by restaurant, who, when, city,
   area, cuisine and kind; sort by time, restaurant or person; grouped by day.
   Ported from archive/prototype/panel/admin.js (V.activity). */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { C, areaOf } from '@/lib/khabo';
import { allR, can, getR, resetAll, signOut, type Log } from '@/lib/panel/store';
import { KINDS, kindOf, logWhat } from '@/lib/panel/admin';
import { Av, Empty, Ico, MonoR, Page, confirm, useAgo, usePanel, useT } from '../ui';
import { useKeep, useNow } from './parts';

const AF0 = { q: '', rid: 'all', who: 'all', when: 'all', city: 'all', area: 'all', cu: 'all', kind: 'all', sort: 'new' };
type AF = typeof AF0;
const STEP = 60;

/** the search words marked in the text */
function Hl({ s, q }: { s: string; q: string }): ReactNode {
  if (!q) return s;
  const k = s.toLowerCase().indexOf(q.toLowerCase());
  if (k < 0) return s;
  return <>{s.slice(0, k)}<mark>{s.slice(k, k + q.length)}</mark><Hl s={s.slice(k + q.length)} q={q} /></>;
}
function Seg2({ v, opts, set }: { v: string; opts: [string, string][]; set: (v: string) => void }) {
  return <div className="seg sm" role="radiogroup">{opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? 'on' : ''} onClick={() => set(k)}>{l}</button>)}</div>;
}

export function Activity() {
  const i = useI(), t = useT(), ago = useAgo(), { db, me } = usePanel();
  const [f, setF] = useKeep<AF>('ac.f', AF0);
  const [n, setN] = useState(STEP);
  const [qIn, setQIn] = useState(f.q);
  const [open, setOpen] = useState(false);
  const up = (o: Partial<AF>) => { setF(x => ({ ...x, ...o })); setN(STEP); };
  /* typing waits a moment before searching */
  useEffect(() => { const tm = setTimeout(() => { if (qIn.trim() !== f.q) up({ q: qIn.trim() }); }, 160); return () => clearTimeout(tm); });
  /* /admin/activity?r=<restaurant> opens with that restaurant picked */
  useEffect(() => {
    const r = new URLSearchParams(location.search).get('r');
    if (r && getR(db, r)) { setF({ ...AF0, rid: r }); history.replaceState(null, '', location.pathname); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rests = allR(db).slice().sort((x, y) => x.name.en.localeCompare(y.name.en));
  const areas = C.areas.filter(x => f.city === 'all' || x.city === f.city);
  const all = db.log as Log[], now = useNow();
  const base = useMemo(() => {
    const t0 = new Date(now).setHours(0, 0, 0, 0);
    const lim = ({ today: t0, d7: now - 7 * 864e5, d30: now - 30 * 864e5 } as Record<string, number>)[f.when];
    const q = f.q.toLowerCase(), place = f.city !== 'all' || f.area !== 'all' || f.cu !== 'all';
    return all.filter(x => {
      const r = x.rid ? getR(db, x.rid) : undefined;
      if (f.rid === 'none' ? !!x.rid : f.rid !== 'all' && x.rid !== f.rid) return false;
      if ((f.who === 'team' && x.role !== 'admin') || (f.who === 'rest' && x.role !== 'restaurant')) return false;
      if (place && (!r || (f.city !== 'all' && r.city !== f.city) || (f.area !== 'all' && r.area !== f.area) || (f.cu !== 'all' && !(r.cuisines || []).includes(f.cu)))) return false;
      if (lim && x.at < lim) return false;
      if (q && !`${x.who} ${x.what} ${x.bn || ''} ${r ? `${r.name.en} ${r.name.bn} ${areaOf(r.area).en} ${areaOf(r.area).bn}` : 'khabo খাবো'}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, db, f, now]);
  const counts: Record<string, number> = {};
  base.forEach(x => { const k = kindOf(x).k; counts[k] = (counts[k] || 0) + 1; });
  const kind = f.kind !== 'all' && !counts[f.kind] ? 'all' : f.kind;
  const rn = (x: Log) => { const r = x.rid ? getR(db, x.rid) : undefined; return r ? i.L(r.name) : '~khabo'; };
  const SORT: Record<string, (a: Log, b: Log) => number> = {
    new: (a, b) => b.at - a.at, old: (a, b) => a.at - b.at,
    rest: (a, b) => rn(a).localeCompare(rn(b)) || b.at - a.at, who: (a, b) => a.who.localeCompare(b.who) || b.at - a.at,
  };
  const list = (kind === 'all' ? base : base.filter(x => kindOf(x).k === kind)).slice().sort(SORT[f.sort] || SORT.new);
  const people = new Set(list.map(x => x.who)).size, places = new Set(list.filter(x => x.rid).map(x => x.rid)).size;
  const active = (Object.keys(AF0) as (keyof AF)[]).filter(k => k !== 'sort' && f[k] !== AF0[k]).length;
  const loc = i.bn ? 'bn-BD' : 'en-GB';
  const dayLabel = (ts: number) => {
    const d = new Date(ts), t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const diff = Math.round((t0.getTime() - new Date(ts).setHours(0, 0, 0, 0)) / 864e5);
    return diff === 0 ? t('Today', 'আজ') : diff === 1 ? t('Yesterday', 'গতকাল') : d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
  };
  /** "8:26 am" or "সকাল ৮:২৬" */
  const clock = (d: Date) => {
    const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0'), h12 = h % 12 || 12;
    if (!i.bn) return `${h12}:${m} ${h < 12 ? 'am' : 'pm'}`;
    const part = h < 4 ? 'রাত' : h < 12 ? 'সকাল' : h < 16 ? 'দুপুর' : h < 18 ? 'বিকেল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
    return `${part} ${i.dg(`${h12}:${m}`)}`;
  };
  const grp = (x: Log) => f.sort === 'rest' ? (rn(x) === '~khabo' ? t('khabo, no restaurant', 'খাবো, কোনো রেস্টুরেন্ট নয়') : rn(x)) : f.sort === 'who' ? x.who : dayLabel(x.at);
  const reset = async () => {
    if (!await confirm({ title: t('Reset all demo data?', 'সব ডেমো ডেটা আগের মতো করবেন?'), text: t('Every change made in the panels is undone: menus, photos, users, reviews and billing go back to the start. Everyone is signed out.', 'প্যানেলে করা সব বদল মুছে যাবে: মেনু, ছবি, ব্যবহারকারী, রিভিউ আর বিল শুরুর মতো হবে। সবাই সাইন আউট হবেন।'), ok: t('Reset everything', 'সব আগের মতো করুন'), danger: true })) return;
    if (resetAll()) { signOut(); location.reload(); }
  };
  let last: string | null = null;
  const rowsOut: ReactNode[] = [];
  list.slice(0, n).forEach((x, k) => {
    const g = grp(x);
    if (g !== last) { rowsOut.push(<div className="ac-day" key={'g' + k}>{g}</div>); last = g; }
    const r = x.rid ? getR(db, x.rid) : undefined, kd = kindOf(x), time = new Date(x.at);
    rowsOut.push(
      <div className="ac-it" key={k}>
        <Av name={x.who} sm style={x.role === 'restaurant' && r ? { background: r.theme.deep, color: r.theme.accent } : undefined} />
        <div className="ac-m">
          <div className="ac-who"><b><Hl s={x.who} q={f.q} /></b><span className={clsx('ac-role', x.role === 'admin' && 'team')}>{x.role === 'admin' ? t('khabo team', 'খাবো টিম') : x.role === 'restaurant' ? t('Restaurant', 'রেস্টুরেন্ট') : t('System', 'সিস্টেম')}</span></div>
          <p><Hl s={logWhat(i.bn, x)} q={f.q} /></p>
          <div className="ac-tags">
            {r ? <button type="button" className="ac-r" onClick={() => up({ rid: r.id })} title={t(`Show only ${r.name.en}`, `শুধু ${r.name.bn} দেখান`)}><MonoR r={r} /><Hl s={i.L(r.name)} q={f.q} /><span className="meta">{i.L(areaOf(r.area))}</span></button> : null}
            <span className="ac-k"><Ico n={kd.i} sm />{i.L(kd.l)}</span>
          </div>
        </div>
        <time dateTime={time.toISOString()} title={time.toLocaleString(loc)}>{clock(time)}<span>{ago(x.at)}</span></time>
      </div>,
    );
  });

  return (
    <Page title={t('Activity', 'কার্যকলাপ')} sub={t('Every change, by the team and by restaurants. Search, filter and sort to find anything.', 'টিম আর রেস্টুরেন্টের প্রতিটি বদল। যা খুঁজছেন, খুঁজুন, ছাঁকুন আর সাজান।')}
      acts={can('reset', me) ? <button type="button" className="btn danger" onClick={reset}>{t('Reset demo data', 'ডেমো ডেটা আগের মতো করুন')}</button> : null}>
      <div className={clsx('card ac-filters', open && 'open')}>
        <div className="ac-row1">
          <label className="search"><span className="sr">{t('Search activity', 'কার্যকলাপ খুঁজুন')}</span><Ico n="magnifying-glass" sm />
            <input className="inp" type="search" placeholder={t('Search what changed, who, or a restaurant', 'কী বদলেছে, কে, বা কোন রেস্টুরেন্ট')} value={qIn} onChange={e => setQIn(e.target.value)} /></label>
          <select className="sel" value={f.rid} onChange={e => up({ rid: e.target.value })} aria-label={t('Restaurant', 'রেস্টুরেন্ট')}>
            <option value="all">{t('All restaurants', 'সব রেস্টুরেন্ট')}</option>
            <option value="none">{t('khabo only (no restaurant)', 'শুধু খাবো (কোনো রেস্টুরেন্ট নয়)')}</option>
            {rests.map(r => <option key={r.id} value={r.id}>{i.L(r.name)}</option>)}
          </select>
          <select className="sel" value={f.sort} onChange={e => up({ sort: e.target.value })} aria-label={t('Sort', 'সাজান')}>
            <option value="new">{t('Newest first', 'নতুনগুলো আগে')}</option><option value="old">{t('Oldest first', 'পুরোনোগুলো আগে')}</option>
            <option value="rest">{t('By restaurant, A to Z', 'রেস্টুরেন্ট অনুযায়ী')}</option><option value="who">{t('By person, A to Z', 'মানুষ অনুযায়ী')}</option>
          </select>
        </div>
        <button type="button" className="btn sm ac-ftog" aria-expanded={open} onClick={() => setOpen(o => !o)}><Ico n="sliders-horizontal" sm /><span>{open ? t('Fewer filters', 'কম ফিল্টার') : t('More filters', 'আরও ফিল্টার')}</span></button>
        <div className="ac-row2">
          <div className="ac-g"><span className="lbl">{t('Who', 'কে')}</span><Seg2 v={f.who} set={v => up({ who: v })} opts={[['all', t('Everyone', 'সবাই')], ['team', t('khabo team', 'খাবো টিম')], ['rest', t('Restaurants', 'রেস্টুরেন্ট')]]} /></div>
          <div className="ac-g"><span className="lbl">{t('When', 'কখন')}</span><Seg2 v={f.when} set={v => up({ when: v })} opts={[['all', t('Any time', 'যেকোনো সময়')], ['today', t('Today', 'আজ')], ['d7', t('7 days', '৭ দিন')], ['d30', t('30 days', '৩০ দিন')]]} /></div>
          <div className="ac-g"><span className="lbl">{t('City', 'শহর')}</span><Seg2 v={f.city} set={v => up({ city: v, area: v !== 'all' && f.area !== 'all' && areaOf(f.area).city !== v ? 'all' : f.area })} opts={[['all', t('All', 'সব')], ...Object.keys(C.cities).map(k => [k, i.L(C.cities[k])] as [string, string])]} /></div>
          <div className="ac-g"><span className="lbl">{t('Area', 'এলাকা')}</span>
            <select className="sel sm" value={f.area} onChange={e => up({ area: e.target.value })} aria-label={t('Area', 'এলাকা')}>
              <option value="all">{t('All areas', 'সব এলাকা')}</option>{areas.map(x => <option key={x.id} value={x.id}>{i.L(x)}</option>)}
            </select></div>
          <div className="ac-g"><span className="lbl">{t('Cuisine', 'রান্নার ধরন')}</span>
            <select className="sel sm" value={f.cu} onChange={e => up({ cu: e.target.value })} aria-label={t('Cuisine', 'রান্নার ধরন')}>
              <option value="all">{t('All cuisines', 'সব ধরন')}</option>{C.cuisines.map(c => <option key={c.id} value={c.id}>{i.L(c)}</option>)}
            </select></div>
        </div>
        <div className="ac-kinds">
          <button type="button" className={clsx('fchip', kind === 'all' && 'on')} onClick={() => up({ kind: 'all' })}>{t('All kinds', 'সব ধরন')} <span>{i.N(base.length)}</span></button>
          {KINDS.filter(k => counts[k.k]).map(k => <button key={k.k} type="button" className={clsx('fchip', kind === k.k && 'on')} onClick={() => up({ kind: k.k })}><Ico n={k.i} sm />{i.L(k.l)} <span>{i.N(counts[k.k])}</span></button>)}
        </div>
      </div>
      <div className="ac-sum">
        {i.bn ? <><b>{i.N(list.length)}টি</b> বদল · {i.N(people)} জন · {i.N(places)}টি রেস্টুরেন্ট</>
          : <><b>{list.length}</b> change{list.length === 1 ? '' : 's'} · {people} {people === 1 ? 'person' : 'people'} · {places} restaurant{places === 1 ? '' : 's'}</>}
        {active ? <button type="button" className="ac-clear" onClick={() => { setF({ ...AF0, sort: f.sort }); setQIn(''); setN(STEP); }}><Ico n="x" sm />{t(`Clear ${active} filter${active > 1 ? 's' : ''}`, `${i.N(active)}টি ফিল্টার মুছুন`)}</button> : null}
      </div>
      <div className="card ac-res">
        {list.length ? <>
          {rowsOut}
          {list.length > n ? <button type="button" className="btn ac-more" onClick={() => setN(n + STEP)}>{t(`Show ${Math.min(STEP, list.length - n)} more of ${list.length - n}`, `আরও ${i.N(Math.min(STEP, list.length - n))}টি দেখান (বাকি ${i.N(list.length - n)})`)}</button> : null}
        </> : all.length
          ? <Empty icon="clock" title={t('Nothing matches', 'কিছু মেলেনি')}>{t('Try fewer words or clear a filter.', 'কম শব্দ দিয়ে খুঁজুন বা একটি ফিল্টার মুছুন।')}</Empty>
          : <Empty icon="clock" title={t('No activity yet', 'এখনো কোনো কার্যকলাপ নেই')}>{t('Changes appear here as soon as anyone makes one.', 'কেউ কিছু বদলালেই এখানে দেখা যাবে।')}</Empty>}
      </div>
    </Page>
  );
}
