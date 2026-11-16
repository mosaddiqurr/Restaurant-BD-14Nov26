'use client';
/* Price check: one dish across town. The typical price rolls to the new number when you switch dish,
   the dots show where every plate sits, and each row opens that dish. Menu prices only. */
import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Pic, Rise, Seg, Tk, type SegItem } from '@/components/ui/bits';
import { openDish } from '@/components/cards/actions';
import { useHref } from '@/components/shell/nav';
import { C, EASE, areaOf } from '@/lib/khabo';
import type { HomeData } from './data';

export function PriceSec({ list }: { list: HomeData['price'] }) {
  const i = useI(), href = useHref();
  const [ty, setTy] = useState(list[0]?.id || '');
  /* rows are there from the start; after a dish switch the new rows slide in quickly */
  const [moved, setMoved] = useState(false);
  const cur = list.find(z => z.id === ty) || list[0];
  if (!cur) return null;
  const nm = i.L(C.types[cur.id]);
  const pos = (p: number) => (cur.hi === cur.lo ? 50 : ((p - cur.lo) / (cur.hi - cur.lo)) * 100);
  const tone = (p: number) => (p < cur.mid ? 'lo' : p > cur.mid ? 'hi' : 'typ');
  return (
    <section className="sec"><div className="wrap">
      <div className="sec-head">
        <div><Rise as="h2" className="h2">{i.t('pc_title')}</Rise><Rise as="p" className="sub" d={1}>{i.t('pc_sub')}</Rise></div>
        {/* a few dishes to switch between, then the way to every dish's prices */}
        <div className="pc-tabs">
          <Seg id="pc" items={list.map(z => [z.id, i.L(C.types[z.id])] as SegItem)} value={cur.id} onChange={v => { setMoved(true); setTy(v); }} />
          <Link className="pc-more" href={href('/prices')}>{i.t('all_dishes')}<I n="arrow-right" b /></Link>
        </div>
      </div>
      <div className="pc">
        <div className="pc-sum">
          <span className="k">{i.t('pc_typical', { d: nm.toLowerCase() })}</span>
          <b className="big"><Tk v={cur.mid} flow /></b>
          <m.div key={cur.id} className="pc-var" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
            <div className="scale" aria-hidden="true">
              {cur.dots.map(d => <i key={d.x} className={d.mid ? 'mid' : ''} style={{ '--x': d.x + '%' } as CSSProperties} />)}
            </div>
            <div className="ends">
              <span><b><Tk v={cur.lo} /></b>{i.t('lowest')}</span>
              <span style={{ textAlign: 'right' }}><b><Tk v={cur.hi} /></b>{i.t('highest')}</span>
            </div>
            <p className="k">{i.t('pc_range', { lo: i.tk(cur.lo), hi: i.tk(cur.hi), n: i.N(cur.places) })}</p>
            {cur.hi > cur.lo ? <p className="pc-save"><I n="tag" />{i.t('pc_save', { v: i.tk(cur.hi - cur.lo) })}</p> : null}
          </m.div>
          <Link className="btn btn-gold" style={{ justifySelf: 'start' }} href={href('/dishes', { type: cur.id, mode: 'prices', sort: 'price' })}>
            {i.t('pc_all', { d: nm.toLowerCase() })}<I n="arrow-right" b />
          </Link>
          <Link className="link" style={{ color: 'var(--gold)', justifySelf: 'start' }} href={href('/prices', { type: cur.id })}><I n="chart-line-up" b />{i.L({ en: 'See the price at every place', bn: 'সব জায়গার দাম দেখুন' })}</Link>
        </div>
        <ol className="pc-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {cur.rows.map(({ d, r }, k) => {
            const diff = d.price - cur.mid, tn = tone(d.price);
            return (
              <m.li key={cur.id + r.id + d.id} initial={moved ? { opacity: 0, x: 10 } : false} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.24, delay: k * 0.03, ease: EASE }}>
                <m.button className="pc-row" style={{ width: '100%' }} onClick={() => openDish(r, d)} whileTap={{ scale: 0.97 }}>
                  <Pic id={d.p} w={160} word={i.L(d.name)} tone={r.theme} sizes="56px" />
                  <span style={{ minWidth: 0 }}>
                    <b>{i.L(d.name)}{k === 0 ? <> <span className="pc-chip lo">· {i.t('lowest')}</span></> : null}</b>
                    <small><Mono r={r} cls="sm" />{i.L(r.name)} · {i.L(areaOf(r.area))}</small>
                  </span>
                  <span className="mini" aria-hidden="true"><i className={tn} style={{ '--x': pos(d.price) + '%' } as CSSProperties} /></span>
                  <span className="p"><Tk v={d.price} /><span className={clsx('pc-chip', tn)}>{diff === 0 ? i.t('pc_typ') : (diff < 0 ? '−' : '+') + i.tk(Math.abs(diff))}</span></span>
                </m.button>
              </m.li>
            );
          })}
        </ol>
      </div>
    </div></section>
  );
}
