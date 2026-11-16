'use client';
/* Deals and events on the home page. Premium partners' deals get the big slider, every other live deal
   is in the rail below, in the order the khabo team set (inside each plan). */
import { useMemo } from 'react';
import Link from 'next/link';
import { useI } from '@/components/providers/i18n';
import { I, RailX, Rise } from '@/components/ui/bits';
import { Coupon, ECard } from '@/components/cards/cards';
import { Slider } from '@/components/cards/slider';
import { useHref } from '@/components/shell/nav';
import { useApp } from '@/lib/store';
import { rankDeals } from '@/lib/khabo';
import type { HomeData } from './data';
import { useMinute } from './util';

export function HomeDeals({ rows }: { rows: HomeData['deals'] }) {
  const i = useI(), href = useHref();
  const order = useApp(s => s.dealOrder);
  const all = useMemo(() => rankDeals(rows, order), [rows, order]);
  if (!all.length) return null;
  const prem = all.filter(z => z.r.plan === 'premium'), big = prem.length ? prem : all.slice(0, 1), rest = all.filter(z => !big.includes(z));
  return (
    <section className="sec home-deals"><div className="wrap">
      {big.length > 1 ? <Slider items={big} /> : <Coupon x={big[0]} big />}
      {rest.length ? (
        <div style={{ marginTop: 40 }}>
          <RailX cls="cp-rail" head={<h2 className="h3">{i.t('more_deals')} <span className="meta" style={{ fontWeight: 500 }}>{i.t('n_deals', { n: i.N(rest.length) })}</span></h2>}>
            {rest.map(z => <Coupon key={z.k} x={z} />)}
          </RailX>
        </div>
      ) : null}
      <div className="home-more"><Link className="btn btn-line" href={href('/deals')}>{i.t('all_deals')}<I n="arrow-right" b /></Link></div>
    </div></section>
  );
}

export function HomeEvents({ list }: { list: HomeData['events'] }) {
  const i = useI(), href = useHref(), min = useMinute();
  /* the server already dropped ended events; the browser checks again with its own clock */
  const shown = useMemo(() => (min ? list.filter(z => +new Date(z.ev.end) > min * 60000) : list).slice(0, 8), [list, min]);
  if (!shown.length) return null;
  return (
    <section className="sec"><div className="wrap">
      <RailX cls="ev-rail" head={<Rise as="h2" className="h2">{i.tx('up_events')}</Rise>}>
        {shown.map(z => <ECard key={z.k} x={z} />)}
      </RailX>
      <div className="home-more"><Link className="btn btn-line" href={href('/events')}>{i.tx('all_events')}<I n="arrow-right" b /></Link></div>
    </div></section>
  );
}
