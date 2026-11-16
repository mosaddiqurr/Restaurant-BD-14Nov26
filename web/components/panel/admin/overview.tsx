'use client';
/* The khabo team's home: owner requests first, four numbers, what needs attention, plans, the sales
   pipeline and the latest activity. Each part shows only to the levels that may use it.
   Ported from website/panel/admin.js (V.overview). */
import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { C } from '@/lib/khabo';
import type { Plan, Text } from '@/lib/data/types';
import { allR, billOf, can, getR, openRequests, reviewsOf, restViewOk, type PR } from '@/lib/panel/store';
import { leadFix, STAGES } from '@/lib/panel/admin';
import { PLANS } from '@/lib/panel/words';
import { Empty, Ico, MonoR, Page, usePanel, useT } from '../ui';
import { ActRow, AddRestaurant, ReqRows, useA } from './parts';

type Att = { r: PR; i: string; t: Text; k: string; go: string; b: Text };

export function AdminOverview() {
  const i = useI(), t = useT(), a = useA(), { db, me } = usePanel();
  const [add, setAdd] = useState(false);
  const rs = allR(db), live = rs.filter(r => !r.hidden), stale = rs.filter(r => r.checked >= 30);
  const revs = reviewsOf(db).filter(v => !!getR(db, v.r));
  const flagged = revs.filter(v => v.flagged && !v.hidden), low = revs.filter(v => v.st <= 3 && !v.reply && !v.hidden);
  const bills = rs.map(r => ({ r, b: billOf(db, r) }));
  const mrr = bills.filter(x => x.b.status !== 'trial').reduce((s, x) => s + PLANS[x.r.plan].price, 0);
  const overdue = bills.filter(x => x.b.status === 'overdue');
  const leads = db.leads.map(l => leadFix({ ...l })), talks = leads.filter(l => l.stage !== 'won');
  const qs = can('rest.admin', me) ? openRequests(db) : [];
  /* a link only where this level may go; otherwise the restaurant's own overview */
  const rgo = (r: PR, view: string) => a(`r/${r.id}${restViewOk(view, me) ? (view ? '/' + view : '') : ''}`);
  const att: Att[] = [
    ...stale.map(r => ({ r, i: 'receipt', t: { en: `Prices last confirmed ${r.checked} days ago`, bn: `দাম শেষ যাচাই হয়েছে ${i.N(r.checked)} দিন আগে` }, k: 'bad', go: rgo(r, 'menu'), b: { en: 'Check menu', bn: 'মেনু দেখুন' } })),
    ...(can('billing', me) ? overdue.map(x => ({ r: x.r, i: 'credit-card', t: { en: `${PLANS[x.r.plan].name.en} payment overdue`, bn: `${PLANS[x.r.plan].name.bn} প্ল্যানের টাকা বাকি, সময় পার` }, k: 'bad', go: a('billing'), b: { en: 'Billing', bn: 'বিল' } })) : []),
    ...(can('reviews.moderate', me) ? flagged.map(v => ({ r: getR(db, v.r)!, i: 'warning', t: { en: `Review by ${v.who} reported by the restaurant`, bn: `${v.who}-এর রিভিউ নিয়ে রেস্টুরেন্ট অভিযোগ করেছে` }, k: 'warn', go: a('reviews'), b: { en: 'Review', bn: 'রিভিউ' } })) : []),
    ...rs.filter(r => r.hidden).map(r => ({ r, i: 'eye', t: { en: 'Hidden from khabo', bn: 'খাবোতে লুকানো' }, k: '', go: rgo(r, 'settings'), b: { en: 'Settings', bn: 'সেটিংস' } })),
  ];
  const byPlan = (Object.keys(PLANS) as Plan[]).map(k => [k, rs.filter(r => r.plan === k).length] as const), pmax = Math.max(1, ...byPlan.map(x => x[1]));
  const byCity = Object.keys(C.cities).map(k => [C.cities[k], rs.filter(r => r.city === k).length] as const);
  const logs = db.log.slice(0, 7);
  const h = new Date().getHours(), first = me.name.split(' ')[0];
  const hello = h < 12 ? t(`Good morning, ${first}`, `শুভ সকাল, ${first}`) : h < 17 ? t(`Good afternoon, ${first}`, `শুভ দুপুর, ${first}`) : t(`Good evening, ${first}`, `শুভ সন্ধ্যা, ${first}`);
  const dishes = rs.reduce((s, r) => s + r.menu.length, 0);
  return (
    <Page title={hello} sub={t('Everything on khabo today.', 'আজ খাবোতে যা কিছু।')}
      acts={can('rest.add', me) ? <button type="button" className="btn pri" onClick={() => setAdd(true)}><Ico n="plus" sm />{t('Add restaurant', 'রেস্টুরেন্ট যোগ করুন')}</button> : null}>
      {qs.length ? (
        <div className="card rq-card" style={{ marginBottom: 16 }}>
          <div className="card-h"><h2>{t('Requests from restaurants', 'রেস্টুরেন্টের অনুরোধ')}</h2><span className="badge gold">{t(`${qs.length} waiting`, `${i.N(qs.length)}টি অপেক্ষায়`)}</span><Link className="r btn sm ghost" href={a('requests')}>{t('See all', 'সব দেখুন')}</Link></div>
          <div className="rows" style={{ padding: '4px 0' }}><ReqRows list={qs.slice(0, 3)} act /></div>
        </div>
      ) : null}
      <div className="grid g4">
        <div className="card stat hl flat"><div className="k"><Ico n="storefront" sm />{t('Restaurants live', 'চালু রেস্টুরেন্ট')}</div><div className="v num">{i.N(live.length)}</div>
          <div className="d">{t(`${rs.length - live.length} hidden · ${dishes} dishes`, `${i.N(rs.length - live.length)}টি লুকানো · ${i.N(dishes)}টি খাবার`)}</div></div>
        {can('billing', me) ? (
          <div className="card stat"><div className="k"><Ico n="credit-card" sm />{t('Monthly plan revenue', 'মাসিক প্ল্যানের আয়')}</div><div className="v num">{i.tk(mrr)}</div>
            <div className="d">{t(`${overdue.length} overdue · sample payments`, `${i.N(overdue.length)}টির সময় পার · নমুনা পেমেন্ট`)}</div></div>
        ) : (
          <div className="card stat"><div className="k"><Ico n="briefcase" sm />{t('Restaurants in talks', 'আলোচনায় থাকা রেস্টুরেন্ট')}</div><div className="v num">{i.N(talks.length)}</div>
            <div className="d">{t('sales leads', 'বিক্রির লিড')}</div></div>
        )}
        <div className="card stat"><div className="k"><Ico n="receipt" sm />{t('Menus to check', 'যাচাই করার মেনু')}</div><div className="v num">{i.N(stale.length)}</div>
          <div className="d">{t('prices older than 30 days', '৩০ দিনের বেশি পুরোনো দাম')}</div></div>
        <div className="card stat"><div className="k"><Ico n="chat-circle-dots" sm />{t('Reviews to watch', 'নজর রাখার রিভিউ')}</div><div className="v num">{i.N(flagged.length + low.length)}</div>
          <div className="d">{t(`${flagged.length} reported · ${low.length} low without reply`, `${i.N(flagged.length)}টিতে অভিযোগ · ${i.N(low.length)}টি কম রেটিং, উত্তর নেই`)}</div></div>
      </div>
      <div className="grid g-main ad-gap">
        <div className="card">
          <div className="card-h"><h2>{t('Needs attention', 'নজর দরকার')}</h2><span className="meta">{t(`${att.length} item${att.length === 1 ? '' : 's'}`, `${i.N(att.length)}টি`)}</span></div>
          <div className="rows" style={{ padding: '6px 0' }}>
            {att.length ? att.slice(0, 8).map((x, k) => (
              <Link key={k} className="row click" href={x.go}><MonoR r={x.r} /><div><b>{i.L(x.r.name)}</b><span className="meta">{i.L(x.t)}</span></div><span className={clsx('badge', x.k)}>{i.L(x.b)}</span></Link>
            )) : <Empty icon="check-circle" title={t('Nothing needs attention', 'কিছুতে নজর দরকার নেই')}>{t('All menus are fresh and payments are in.', 'সব মেনু হালনাগাদ, পেমেন্টও এসেছে।')}</Empty>}
          </div>
        </div>
        <div className="stack" style={{ alignContent: 'start' }}>
          <div className="card">
            <div className="card-h"><h2>{t('Restaurants by plan', 'প্ল্যান অনুযায়ী রেস্টুরেন্ট')}</h2></div>
            <div className="card-b stack" style={{ gap: 12 }}>
              {byPlan.map(([k, n]) => (
                <div className="ad-plan" key={k}><span>{i.L(PLANS[k].name)}</span><div className="meter"><i style={{ '--w': Math.round((n / pmax) * 100) } as CSSProperties} /></div><span className="num meta">{i.N(n)}</span></div>
              ))}
              <div className="meta">{byCity.map(([c, n]) => t(`${n} in ${c.en}`, `${c.bn}-এ ${i.N(n)}টি`)).join(' · ')}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-h"><h2>{t('Sales pipeline', 'বিক্রির ধাপ')}</h2>{can('leads', me) ? <Link className="r btn sm ghost" href={a('leads')}>{t('Open', 'খুলুন')}</Link> : null}</div>
            <div className="card-b">
              <div className="ad-big num">{i.N(talks.length)} <span className="meta">{t('restaurants in talks', 'রেস্টুরেন্টের সঙ্গে আলোচনা চলছে')}</span></div>
              <div className="meta" style={{ marginTop: 4 }}>{STAGES.filter(s => s.k !== 'won').map(s => `${i.N(leads.filter(l => l.stage === s.k).length)} ${i.L(s.l).toLowerCase()}`).join(' · ')}</div>
            </div>
          </div>
        </div>
      </div>
      {can('activity', me) ? (
        <div className="card ad-gap">
          <div className="card-h"><h2>{t('Latest activity', 'সাম্প্রতিক কার্যকলাপ')}</h2><Link className="r btn sm ghost" href={a('activity')}>{t('See all', 'সব দেখুন')}</Link></div>
          <div className="rows" style={{ padding: '6px 0' }}>
            {logs.length ? logs.map((x, k) => <ActRow key={k} x={x} />) : <Empty icon="clock" title={t('No changes yet', 'এখনো কোনো বদল নেই')}>{t('Every change by the team or a restaurant shows here.', 'টিম বা কোনো রেস্টুরেন্টের প্রতিটি বদল এখানে দেখাবে।')}</Empty>}
          </div>
        </div>
      ) : null}
      <AddRestaurant open={add} onClose={() => setAdd(false)} />
    </Page>
  );
}
