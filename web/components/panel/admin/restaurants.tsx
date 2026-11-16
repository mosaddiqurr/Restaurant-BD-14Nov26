'use client';
/* Restaurants: every restaurant on khabo. Search, city and plan filters; open one to change anything on it.
   Ported from website/panel/admin.js (V.restaurants). */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI } from '@/components/providers/i18n';
import { C, where } from '@/lib/khabo';
import type { Plan } from '@/lib/data/types';
import { allR, can } from '@/lib/panel/store';
import { PLANS } from '@/lib/panel/words';
import { Ico, MonoR, Page, Seg, useDays, usePanel, useT } from '../ui';
import { AddRestaurant, PlanBadge, useA, useKeep } from './parts';

export function Restaurants() {
  const i = useI(), t = useT(), days = useDays(), a = useA(), router = useRouter(), { db, me } = usePanel();
  const [q, setQ] = useKeep('rs.q', '');
  const [city, setCity] = useKeep('rs.city', 'all');
  const [plan, setPlan] = useKeep('rs.plan', 'all');
  const [add, setAdd] = useState(false);
  const all = allR(db);
  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return all.filter(r => (city === 'all' || r.city === city) && (plan === 'all' || r.plan === plan)
      && (!qq || `${r.name.en} ${r.name.bn} ${where(i, r)} ${r.area}`.toLowerCase().includes(qq)));
  }, [all, q, city, plan, i]);
  return (
    <Page title={t('Restaurants', 'রেস্টুরেন্ট')}
      sub={t(`${all.length} restaurants. ${can('rest.edit', me) ? 'Open one to change anything on it.' : 'Open one to see how it is doing.'}`,
        `${i.N(all.length)}টি রেস্টুরেন্ট। ${can('rest.edit', me) ? 'যেকোনো কিছু বদলাতে একটি খুলুন।' : 'কেমন চলছে দেখতে একটি খুলুন।'}`)}
      acts={can('rest.add', me) ? <button type="button" className="btn pri" onClick={() => setAdd(true)}><Ico n="plus" sm />{t('Add restaurant', 'রেস্টুরেন্ট যোগ করুন')}</button> : null}>
      <div className="card">
        <div className="toolbar">
          <label className="search"><span className="sr">{t('Search restaurants', 'রেস্টুরেন্ট খুঁজুন')}</span><Ico n="magnifying-glass" sm />
            <input className="inp" type="search" placeholder={t('Search by name or area', 'নাম বা এলাকা দিয়ে খুঁজুন')} value={q} onChange={e => setQ(e.target.value)} /></label>
          <Seg items={[['all', t('All cities', 'সব শহর')], ...Object.keys(C.cities).map(k => [k, i.L(C.cities[k])] as [string, string])]} value={city} onChange={setCity} />
          <select className="sel sm" style={{ width: 'auto' }} value={plan} onChange={e => setPlan(e.target.value)} aria-label={t('Plan', 'প্ল্যান')}>
            <option value="all">{t('All plans', 'সব প্ল্যান')}</option>
            {(Object.keys(PLANS) as Plan[]).map(k => <option key={k} value={k}>{i.L(PLANS[k].name)}</option>)}
          </select>
        </div>
        <div className="tbl-wrap">
          <table className="tbl tbl-m">
            <thead><tr>
              <th>{t('Restaurant', 'রেস্টুরেন্ট')}</th><th>{t('Area', 'এলাকা')}</th><th>{t('Plan', 'প্ল্যান')}</th><th>{t('Status', 'অবস্থা')}</th>
              <th>{t('Prices checked', 'দাম যাচাই')}</th><th className="r">{t('Dishes', 'খাবার')}</th><th className="r">{t('Rating', 'রেটিং')}</th><th><span className="sr">{t('View', 'দেখুন')}</span></th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="click" onClick={e => { if ((e.target as HTMLElement).closest('a')) return; router.push(a(`r/${r.id}`)); }}>
                  <td className="who-td"><div className="who"><MonoR r={r} /><div><Link href={a(`r/${r.id}`)}><b>{i.L(r.name)}</b></Link><span className="meta">{i.L(r.spot)}</span></div></div></td>
                  <td data-k={t('Area', 'এলাকা')}>{where(i, r)}</td>
                  <td data-k={t('Plan', 'প্ল্যান')}><PlanBadge p={r.plan} /></td>
                  <td data-k={t('Status', 'অবস্থা')}>{r.hidden ? <span className="badge">{t('Hidden', 'লুকানো')}</span> : <span className="badge ok"><i className="dot" />{t('Live', 'চালু')}</span>}</td>
                  <td data-k={t('Prices', 'দাম')}>{r.checked >= 30 ? <span className="badge bad">{days(r.checked)}</span> : <span className="meta">{days(r.checked)}</span>}</td>
                  <td className="r num" data-k={t('Dishes', 'খাবার')}>{i.N(r.menu.length)}</td>
                  <td className="r num" data-k={t('Rating', 'রেটিং')}>{r.rating ? i.dg(r.rating.toFixed(1)) : t('New', 'নতুন')}</td>
                  <td className="r end"><a className="ibtn sm" href={`/${i.lang}/r/${r.id}`} target="_blank" rel="noopener" aria-label={t(`View ${r.name.en} on khabo`, `খাবোতে ${r.name.bn} দেখুন`)}><Ico n="arrow-up-right" sm /></a></td>
                </tr>
              ))}
              {!rows.length ? <tr><td colSpan={8}><div className="empty"><Ico n="magnifying-glass" /><b>{t('No restaurant matches', 'কোনো রেস্টুরেন্ট মেলেনি')}</b>{t('Try another name or filter.', 'অন্য নাম বা ফিল্টার দিয়ে দেখুন।')}</div></td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
      <AddRestaurant open={add} onClose={() => setAdd(false)} />
    </Page>
  );
}
