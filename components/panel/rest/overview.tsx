'use client';
/* Overview: this week's numbers first (views, QR scans, calls, directions), then what needs doing (khabo's
   suggestions plus the owner's own to-do list with its history), and recent changes. Page colours live on the
   Restaurant page, with Save changes.
   Ported from archive/prototype/panel/rest.js (V.overview) and the React partner panel (Overview, PageLook) in archive/prototype/app/app.js.
   The traffic numbers are a sample (marked "Sample") until the site is live. */
import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { EASE, headDeal, src, where } from '@/lib/khabo';
import { saveTodos, todosOf, type DemoDB, type TodoRow } from '@/lib/demo-db';
import { clone, hash, repliesOf, requestsOf, reviewsOf, rng } from '@/lib/panel/store';
import { REQ } from '@/lib/panel/words';
import { Av, Empty, Ico, Page, Sample, Seg, Spark, useAgo, useDays, useR, useSaveNow, useT } from '../ui';

const ViewsChart = dynamic(() => import('./chart'), { ssr: false, loading: () => <div className="chart" /> });

/* sample traffic, the same every time for the same restaurant */
export function traffic(id: string) {
  const rnd = rng(id + '|traffic'), base = 60 + (hash(id) % 120);
  const days = Array.from({ length: 30 }, (_, k) => Math.round(base * (0.75 + rnd() * 0.5) * (k % 7 === 4 || k % 7 === 5 ? 1.35 : 1)));
  const sum = days.reduce((a, b) => a + b, 0);
  const k = (f: number) => ({ v: Math.round(sum * f), p: Math.round((rnd() - 0.35) * 30), s: days.map(x => Math.round(x * f * (0.8 + rnd() * 0.4))) });
  return { days, views: { v: sum, p: Math.round((rnd() - 0.3) * 24), s: days }, qr: k(0.21), calls: k(0.028), dirs: k(0.06) };
}

const stamp = () => Date.now();
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
/** this week (the last 7 days) against the 7 days before */
const week = (s: number[]) => { const a = sum(s.slice(-7)), b = sum(s.slice(-14, -7)); return { v: a, p: b ? Math.round(((a - b) / b) * 100) : 0, s: s.slice(-14) }; };

export function Overview() {
  const [now] = useState(stamp);
  const i = useI(), t = useT(), ago = useAgo(), days = useDays(), saveNow = useSaveNow();
  const { r, live, db, area, rto } = useR();
  const admin = area === 'admin';
  const tr = useMemo(() => traffic(r.id), [r.id]);
  const stale = r.checked >= 30, revs = reviewsOf(db, r.id).filter(v => !v.hidden);
  const needReply = revs.filter(v => !v.reply && v.st <= 3), noPhoto = r.menu.filter(d => !d.p).length, out = r.menu.filter(d => d.out);
  const top = r.menu.filter(d => !d.share).map(d => ({ d, v: Math.round((d.best ? 1.8 : 1) * (40 + (hash(d.id) % 120))) })).sort((a, b) => b.v - a.v).slice(0, 5);
  const tmax = top.length ? top[0].v : 1;
  const news = admin ? [] : repliesOf(db, r.id), waiting = admin ? 0 : requestsOf(db, r.id).filter(q => q.state === 'open').length;
  const logs = db.log.filter(x => x.rid === r.id).slice(0, 5);
  const confirmPrices = () => {
    /* a one-tap confirmation: saved straight away, from the saved copy */
    const nr = clone(live || r); nr.checkedAt = stamp(); nr.checked = 0;
    saveNow(nr, { en: 'Confirmed all prices are correct', bn: 'সব দাম ঠিক আছে বলে নিশ্চিত করেছেন' }, { en: 'Thanks. Diners now see "prices checked today".', bn: 'ধন্যবাদ। ডাইনাররা এখন দেখছেন "আজ দাম মিলিয়ে দেখা হয়েছে"।' });
  };
  type Todo = { k: string; cls?: string; icon: string; b: string; s: string; a: string; href?: string; fn?: () => void };
  const todo: Todo[] = [
    ...news.map(q => ({ k: q.id, cls: q.state === 'done' ? 'ok' : 'bad', icon: q.state === 'done' ? 'check-circle' : 'warning',
      b: q.state === 'done' ? t(`khabo said yes: ${REQ[q.kind].en}`, `খাবো হ্যাঁ বলেছে: ${REQ[q.kind].bn}`) : t(`khabo said no: ${REQ[q.kind].en}`, `খাবো না বলেছে: ${REQ[q.kind].bn}`),
      s: q.reply || (q.state === 'done' ? t('The change is live.', 'বদলটি এখন দেখা যাচ্ছে।') : t('Open the request to see why.', 'কেন, তা অনুরোধ খুলে দেখুন।')), a: t('See', 'দেখুন'), href: rto('team') + '#requests' })),
    ...(waiting ? [{ k: 'wait', cls: 'info', icon: 'clock', b: t(`${waiting} request${waiting > 1 ? 's' : ''} with the khabo team`, `খাবো টিমের কাছে ${i.N(waiting)}টি অনুরোধ`), s: t('You will see the answer here.', 'উত্তর এখানেই দেখবেন।'), a: t('See', 'দেখুন'), href: rto('team') + '#requests' }] : []),
    ...(stale ? [{ k: 'stale', cls: 'bad', icon: 'warning', b: t(`Prices were last confirmed ${days(r.checked)}.`, `দাম শেষবার মিলিয়ে দেখা হয়েছে ${days(r.checked)}।`), s: t('Diners see this date. Check your prices and confirm them.', 'ডাইনাররা এই তারিখ দেখেন। দাম মিলিয়ে নিশ্চিত করুন।'), a: t('Confirm', 'নিশ্চিত করুন'), fn: confirmPrices }] : []),
    ...(needReply.length ? [{ k: 'rv', icon: 'chat-circle-dots', b: t(`${needReply.length} low rating${needReply.length > 1 ? 's' : ''} without a reply`, `${i.N(needReply.length)}টি কম রেটিংয়ের উত্তর দেওয়া হয়নি`), s: t('A short, polite reply helps the next diner decide.', 'ছোট, ভদ্র উত্তর পরের ডাইনারকে সিদ্ধান্ত নিতে সাহায্য করে।'), a: t('Reply', 'উত্তর দিন'), href: rto('reviews') }] : []),
    ...(out.length ? [{ k: 'out', cls: 'info', icon: 'info', b: t(`${out.length} dish${out.length > 1 ? 'es' : ''} marked sold out`, `${i.N(out.length)}টি খাবার শেষ বলে চিহ্নিত`), s: `${out.map(d => i.L(d.name)).join(', ')}. ${t('Switch back when available.', 'আবার পাওয়া গেলে চালু করুন।')}`, a: t('Menu', 'মেনু'), href: rto('menu') }] : []),
    ...(noPhoto ? [{ k: 'ph', cls: 'info', icon: 'camera', b: t(`${noPhoto} dish${noPhoto > 1 ? 'es have' : ' has'} no photo`, `${i.N(noPhoto)}টি খাবারের ছবি নেই`), s: t('Dishes with photos get viewed far more.', 'ছবিসহ খাবার অনেক বেশি দেখা হয়।'), a: t('Add', 'যোগ করুন'), href: rto('menu') }] : []),
    ...(!headDeal(r) ? [{ k: 'deal', cls: 'info', icon: 'tag', b: t('No deal running', 'কোনো অফার চলছে না'), s: t('Deals show on the khabo Deals page and your page.', 'অফার খাবোর অফার পেজে আর আপনার পেজে দেখায়।'), a: t('Add', 'যোগ করুন'), href: rto('deals') }] : []),
  ];
  const chart = tr.days.map((v, k) => ({ d: i.dm(new Date(now - (29 - k) * 864e5)), v }));
  const delta = (p: number) => <><span className={p >= 0 ? 'up' : 'down'}>{p >= 0 ? '+' : ''}{i.N(p)}%</span> {t('vs last week', 'গত সপ্তাহের তুলনায়')}</>;
  const stat = (k: string, icon: string, x: { v: number; p: number; s: number[] }, n: number) => (
    <m.div className="card stat" key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 + n * 0.05, ease: EASE }}>
      <div className="k"><Ico n={icon} sm />{k}</div><div className="v num">{i.N(x.v)}</div><div className="d">{delta(x.p)}</div><Spark vals={x.s.slice(-14)} />
    </m.div>
  );
  const hr = new Date(now).getHours();
  return (
    <Page title={admin ? i.L(r.name) : hr < 12 ? t('Good morning', 'শুভ সকাল') : hr < 17 ? t('Good afternoon', 'শুভ দুপুর') : t('Good evening', 'শুভ সন্ধ্যা')}
      sub={admin ? where(i, r) : t(`Here is how ${r.name.en} is doing on khabo.`, `খাবোতে ${r.name.bn} কেমন করছে, দেখুন।`)}>
      <div className="sec-t ov-first"><h2>{t('This week', 'এই সপ্তাহে')}</h2><Sample /></div>
      <div className="grid g4">
        {stat(t('Page views', 'পেজ দেখা'), 'eye', week(tr.views.s), 0)}{stat(t('QR menu scans', 'কিউআর মেনু স্ক্যান'), 'qr-code', week(tr.qr.s), 1)}
        {stat(t('Call taps', 'কল করতে চাপ'), 'phone', week(tr.calls.s), 2)}{stat(t('Directions taps', 'পথ দেখতে চাপ'), 'navigation-arrow', week(tr.dirs.s), 3)}
      </div>
      <section className="hero" style={{ marginTop: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {r.hero?.[0] ? <img src={src(r.hero[0], 1400)} alt="" /> : null}
        <div className="hero-in">
          <div>
            <h2 className={clsx(r.theme.font === 'serif' && 'serif')}>{i.L(r.name)}</h2>
            <p>{where(i, r)} · {t(`${i.tk(r.ppl[0])} to ${i.tk(r.ppl[1])} per person`, `জনপ্রতি ${i.tk(r.ppl[0])} থেকে ${i.tk(r.ppl[1])}`)}</p>
            <div className="chips">
              <span className={clsx('chip', r.hidden && 'warn')}><i className="dot" />{r.hidden ? t('Hidden from khabo', 'খাবোতে লুকানো') : t('Live on khabo', 'খাবোতে দেখা যাচ্ছে')}</span>
              <span className={clsx('chip', stale && 'warn')}><Ico n="receipt" sm />{t(`Prices checked ${days(r.checked)}`, `দাম মিলিয়ে দেখা ${days(r.checked)}`)}</span>
              <span className="chip"><Ico n="fork-knife" sm />{t(`${r.menu.length} dishes`, `${i.N(r.menu.length)}টি খাবার`)}</span>
              <span className="chip"><Ico n="star" sm f />{r.rating ? i.dg(r.rating.toFixed(1)) : t('New', 'নতুন')} · {t(`${i.N(r.reviews)} reviews`, `${i.N(r.reviews)}টি রিভিউ`)}</span>
            </div>
          </div>
          <div className="acts">
            <Link className="btn" href={rto('site')}><Ico n="globe-hemisphere-east" sm />{t('Your website', 'আপনার ওয়েবসাইট')}</Link>
            <button className="btn gold" onClick={confirmPrices}><Ico n="check-circle" sm />{t('Prices are correct', 'দাম ঠিক আছে')}</button>
          </div>
        </div>
      </section>
      <div className="grid g-main" style={{ marginTop: 16 }}>
        <div className="card"><div className="card-h"><h2>{t('Page views per day', 'প্রতিদিন পেজ দেখা')}</h2><span className="r"><Sample /></span></div>
          <div className="chart"><ViewsChart data={chart} unit={v => t(`${v} views`, `${i.N(v)} বার দেখা`)} /></div></div>
        <TodoCard rid={r.id} db={db as unknown as DemoDB} own={!admin} nSug={todo.length} sug={todo.map((x, n) => (
          <m.div key={x.k} className={clsx('alert', x.cls)} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.08 + n * 0.04, ease: EASE }}>
            <Ico n={x.icon} /><div><b>{x.b}</b><div className="meta">{x.s}</div></div>
            {x.href ? <Link className="btn sm" href={x.href}>{x.a}</Link> : <button className="btn sm" onClick={x.fn}>{x.a}</button>}
          </m.div>
        ))} />
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card"><div className="card-h"><h2>{t('Most viewed dishes', 'সবচেয়ে বেশি দেখা খাবার')}</h2><span className="r"><Sample /></span></div>
          <div className="rows" style={{ padding: '6px 0' }}>
            {top.map((x, n) => (
              <div key={x.d.id} className="row"><span className="meta num" style={{ width: 16 }}>{i.N(n + 1)}</span>
                <div style={{ display: 'grid', gap: 6 }}><b>{i.L(x.d.name)}</b><div className="meter"><i style={{ '--w': Math.round((x.v / tmax) * 100) } as CSSProperties} /></div></div>
                <span className="num" style={{ fontWeight: 700 }}>{i.N(x.v)}</span></div>
            ))}
          </div></div>
        <div className="card"><div className="card-h"><h2>{t('Recent changes', 'সাম্প্রতিক বদল')}</h2>
          {admin ? <Link className="r btn sm ghost" href={`/${i.lang}/admin/activity?r=${r.id}`}><Ico n="magnifying-glass" sm />{t('Search all', 'সব খুঁজুন')}</Link> : null}</div>
          <div className="rows" style={{ padding: '6px 0' }}>
            {logs.length ? logs.map((x, n) => (
              <div key={n} className="act"><Av name={x.who} sm /><div><b>{x.who}</b> <span style={{ color: 'var(--ink-2)' }}>{i.bn && x.bn ? x.bn : x.what}</span></div><span className="meta">{ago(x.at)}</span></div>
            )) : <Empty icon="clock" title={t('No changes yet', 'এখনো কোনো বদল নেই')}>{t('Changes you make here are listed with who made them.', 'এখানে করা বদল, কে করেছেন সহ, এখানে দেখা যাবে।')}</Empty>}
          </div></div>
      </div>
    </Page>
  );
}

/** what needs doing: khabo's suggestions, the owner's own to-dos (add, tick, remove) and the history of what was done */
function TodoCard({ rid, db, own, sug, nSug }: { rid: string; db: DemoDB; own: boolean; sug: ReactNode; nSug: number }) {
  const i = useI(), t = useT();
  const [tab, setTab] = useState<'now' | 'hist'>('now');
  const [txt, setTxt] = useState('');
  const list = todosOf(db, rid), open = list.filter(x => !x.done), done = list.filter(x => x.done).sort((a, b) => (b.done || 0) - (a.done || 0));
  const n = nSug + (own ? open.length : 0);
  const add = (e: FormEvent) => {
    e.preventDefault();
    const v = txt.trim(); if (!v) return;
    saveTodos(rid, l => [{ id: 'td' + Date.now().toString(36), text: v.slice(0, 200), at: Date.now() }, ...l]);
    setTxt('');
  };
  const tick = (x: TodoRow, on: boolean) => saveTodos(rid, l => l.map(y => (y.id === x.id ? { ...y, done: on ? Date.now() : undefined } : y)));
  const del = (x: TodoRow) => saveTodos(rid, l => l.filter(y => y.id !== x.id));
  const date = (ts: number) => i.dm(new Date(ts));
  const row = (x: TodoRow) => (
    <div key={x.id} className={clsx('td-row', x.done && 'is-done')}>
      <button type="button" className="td-tick" role="checkbox" aria-checked={!!x.done} onClick={() => tick(x, !x.done)}
        aria-label={x.done ? t(`Mark "${x.text}" as not done`, `"${x.text}" হয়নি বলে চিহ্নিত করুন`) : t(`Mark "${x.text}" as done`, `"${x.text}" হয়েছে বলে চিহ্নিত করুন`)}>
        {x.done ? <Ico n="check" sm b /> : null}
      </button>
      <div className="td-tx"><span>{x.text}</span>
        <span className="meta">{x.done ? t(`Done ${date(x.done)}`, `${date(x.done)} হয়েছে`) : t(`Added ${date(x.at)}`, `${date(x.at)} যোগ করা`)}</span></div>
      <button type="button" className="ibtn sm" onClick={() => del(x)} aria-label={t(`Remove "${x.text}"`, `"${x.text}" সরান`)}><Ico n="x" sm /></button>
    </div>
  );
  return (
    <div className="card">
      <div className="card-h"><h2>{t('To do', 'যা করতে হবে')}</h2>
        {own ? <span className="r"><Seg cls="sm" value={tab} onChange={setTab} items={[['now', t(`Open${n ? ` (${n})` : ''}`, `বাকি${n ? ` (${i.N(n)})` : ''}`)], ['hist', t('History', 'ইতিহাস')]]} /></span>
          : <span className="meta">{n ? t(`${n} item${n > 1 ? 's' : ''}`, `${i.N(n)}টি`) : ''}</span>}</div>
      <div className="card-b stack" style={{ gap: 10 }}>
        {tab === 'hist' && own ? (
          done.length ? <div className="td-list">{done.map(row)}</div>
            : <Empty icon="clock" title={t('Nothing done yet', 'এখনো কিছু হয়নি')} style={{ padding: 20 }}>{t('Tick a to-do and it moves here with the date.', 'কোনো কাজে টিক দিলে তারিখসহ এখানে চলে আসবে।')}</Empty>
        ) : <>
          {sug}
          {own && open.length ? <div className="td-list">{open.map(row)}</div> : null}
          {!n ? <div className="alert ok"><Ico n="check-circle" /><div><b>{t('All done', 'সব হয়ে গেছে')}</b><div className="meta">{t('Prices confirmed, reviews answered.', 'দাম নিশ্চিত, রিভিউর উত্তর দেওয়া।')}</div></div></div> : null}
          {own ? (
            <form className="td-add" onSubmit={add}>
              <input className="inp" value={txt} onChange={e => setTxt(e.target.value)} maxLength={200} placeholder={t('Add your own to-do', 'নিজের একটি কাজ যোগ করুন')} aria-label={t('New to-do', 'নতুন কাজ')} />
              <button type="submit" className="btn" disabled={!txt.trim()}><Ico n="plus" sm />{t('Add', 'যোগ করুন')}</button>
            </form>
          ) : null}
        </>}
      </div>
    </div>
  );
}
