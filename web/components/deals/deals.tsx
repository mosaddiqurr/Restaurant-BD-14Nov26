'use client';
/* /deals: the slider of Premium partners' deals, then every live deal. Premium first, then Pro, then Starter;
   the khabo team's order inside each plan comes from this browser's saved deal order.
   Ported from website/app/app.js (Deals). */
import { useMemo, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Rise, Seg, useMounted } from '@/components/ui/bits';
import { Coupon, type DealX } from '@/components/cards/cards';
import { Slider } from '@/components/cards/slider';
import { useApp } from '@/lib/store';
import { C, EASE, dealState, rankDeals, type DealRow } from '@/lib/khabo';
import type { Plan, RestaurantCard } from '@/lib/data/types';
import '@/styles/pages-extra.css';

export type DealR = Pick<RestaurantCard, 'id' | 'name' | 'mono' | 'theme' | 'area' | 'city' | 'rating'> & { plan: Plan };

export function DealsView({ rows }: { rows: DealRow<DealR>[] }) {
  const i = useI();
  const order = useApp(s => s.dealOrder);
  const [city, setCity] = useState('all');
  /* the server list is from earlier today: drop any deal that has ended since */
  const live = useMounted();
  const all = useMemo(() => rankDeals(live ? rows.filter(z => dealState(z.d) === 'live') : rows, order), [rows, order, live]);
  const prem = all.filter(z => z.r.plan === 'premium'), top = (prem.length ? prem : all.slice(0, 5)) as DealX[];
  const list = all.filter(z => city === 'all' || z.r.city === city);
  return (
    <div className="wrap lp">
      <div className="lh"><div>
        <Rise as="h1" className="h1">{i.t('deals_title')}</Rise>
        <Rise as="p" className="sub" d={1}>{i.t('deals_sub')}</Rise>
      </div></div>
      {top.length ? <Rise d={1}><Slider items={top} /></Rise> : null}
      <section className="sec" style={{ paddingTop: 72 }}>
        <div className="sec-head">
          <h2 className="h2">{i.t('all_deals')}</h2>
          <Seg id="dcity" items={[['all', i.t('all')], ['dhaka', i.L(C.cities.dhaka)], ['bogura', i.L(C.cities.bogura)]]} value={city} onChange={setCity} />
        </div>
        {list.length ? (
          <div className="deal-grid">
            <AnimatePresence mode="popLayout" initial={false}>
              {list.map(z => (
                <m.div key={z.k} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.16, ease: EASE } }} transition={{ duration: 0.32, ease: EASE }}>
                  <Coupon x={z as DealX} />
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="empty"><I n="tag" /><b>{i.t('no_deals')}</b></div>
        )}
        <p className="meta" style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'flex-start' }}><I n="info" /><span>{i.t('deal_note')} {i.tx('sample_code')}</span></p>
      </section>
    </div>
  );
}
