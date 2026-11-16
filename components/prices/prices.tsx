'use client';
/* /prices: what each place charges. Pick a dish (and an area) and see today's menu price at every place,
   cheapest first, with the typical (middle) price and the range. Trends are only ever for a whole area:
   the typical price of 3 or more places, so no restaurant is singled out. One restaurant's own price history
   is not shown here. The Food Price Index tab is the same idea for every dish in a city.
   Menu prices only (VAT and service are added on the bill). Featured gets no special place here.
   The list is drawn on the server; anything that needs the clock waits until the page is live. */
import { Morph } from '@/components/ui/morph';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { toast } from '@/lib/toast';
import { useI } from '@/components/providers/i18n';
import { I, Pic, Rise, Seg, Tk, useNow } from '@/components/ui/bits';
import { Choose } from '@/components/ui/choose';
import { openDish } from '@/components/cards/actions';
import { useHref, type Q } from '@/components/shell/nav';
import { useDemoDB, type HistRow } from '@/lib/demo-db';
import { C, EASE, areaOf, norm } from '@/lib/khabo';
import type { DishCard, PriceLog, Text } from '@/lib/data/types';
import type { I18n } from '@/lib/i18n/core';
import { areaLabel, areaOpts, areaValue, pickArea, useUrlState } from '@/components/listing/filters';
import { canvasFonts, shareCanvas, type IndexRow } from './share';
import { MIN_PLACES, cityOf, rowsOf, trendOf, typeOrder, type Scope, type Trend } from './data';
import type { TrendRow } from './chart';
import '@/styles/prices.css';

const TrendChart = dynamic(() => import('./chart'), { ssr: false, loading: () => <div className="sk" style={{ height: '100%' }} /> });

/* words this page added (English and Bangla) */
const W = {
  title: { en: 'What each place charges', bn: 'কোথায় কত দাম' },
  sub: { en: 'Pick a dish and see today’s menu price at every place, cheapest first. Menu prices only; VAT and service are added on the bill.', bn: 'একটি খাবার বেছে নিন, আজ প্রতিটি জায়গায় এর মেনুর দাম দেখুন, কম দাম আগে। শুধু মেনুর দাম; ভ্যাট আর সার্ভিস বিলে যোগ হয়।' },
  tab1: { en: 'Today’s prices', bn: 'আজকের দাম' },
  typical: { en: 'Typical price', bn: 'সাধারণ দাম' },
  typNote: { en: 'The marigold mark is the typical price: half the places charge less, half charge more.', bn: 'হলুদ দাগটি সাধারণ দাম: অর্ধেক জায়গায় এর কম, অর্ধেক জায়গায় বেশি।' },
  one: { en: 'Only one place here serves this so far.', bn: 'এখানে এখনো শুধু একটি জায়গায় এটি পাওয়া যায়।' },
  open: { en: 'Open {r}', bn: '{r} খুলুন' },
  trendH: { en: 'Typical price, last 6 months', bn: 'সাধারণ দাম, গত ৬ মাস' },
  trendNeed: { en: 'We show a trend once 3 or more places here serve this dish, so it is about the area, never one restaurant.', bn: 'এখানে ৩টি বা বেশি জায়গায় খাবারটি থাকলে তবেই দামের ধারা দেখাই, যাতে এটি পুরো এলাকার কথা বলে, কোনো একটি রেস্টুরেন্টের নয়।' },
  trendNote: { en: 'The typical price across every place here, week by week. We never show one restaurant’s price changes on this page.', bn: 'এখানকার সব জায়গার সাধারণ দাম, সপ্তাহে সপ্তাহে। এই পাতায় কোনো একটি রেস্টুরেন্টের দাম বদল দেখানো হয় না।' },
  order: { en: 'Every place is listed the same way: by price, never by plan or Featured.', bn: 'সব জায়গা একইভাবে সাজানো: দাম অনুযায়ী, প্ল্যান বা ফিচারড দিয়ে নয়।' },
  noDish: { en: 'No place here has this dish yet. Try another area.', bn: 'এই এলাকায় এখনো এই খাবার নেই। অন্য এলাকা দেখুন।' },
  idxSub: { en: 'The typical menu price of everyday dishes in {c}, and how it moved. Only dishes that 3 or more places serve.', bn: '{c} শহরে রোজকার খাবারের সাধারণ মেনু দাম, আর তা কীভাবে বদলেছে। শুধু যেসব খাবার ৩টি বা বেশি জায়গায় আছে।' },
  idx6: { en: 'In 6 months', bn: '৬ মাসে' },
  idxTap: { en: 'Tap a dish to see what each place charges.', bn: 'কোথায় কত দাম দেখতে একটি খাবারে চাপুন।' },
  foot: { en: 'Menu prices, before VAT and service', bn: 'মেনুর দাম, ভ্যাট আর সার্ভিসের আগে' },
  typOf: { en: 'Typical {d}', bn: 'সাধারণ দামে {d}' },
  to: { en: 'to', bn: 'থেকে' },
  dish: { en: 'Dish', bn: 'খাবার' },
};
const w = (i: I18n, o: Text, v: Record<string, string> = {}) => i.L(o).replace(/\{(\w+)\}/g, (s, k) => v[k] ?? s);

/** "Kacchi in Dhanmondi", "Kacchi in Dhaka", "Kacchi everywhere on khabo" */
function placeTitle(i: I18n, d: string, f: Scope) {
  if (f.area) return i.bn ? `${i.L(areaOf(f.area))} এলাকায় ${d}` : `${d} in ${i.L(areaOf(f.area))}`;
  if (f.city) return i.bn ? `${i.L(C.cities[f.city])} শহরে ${d}` : `${d} in ${i.L(C.cities[f.city])}`;
  return i.bn ? `খাবোর সব জায়গায় ${d}` : `${d} everywhere on khabo`;
}
/** "about 6% higher than 6 months ago" (lower case, to follow a title) */
function moveText(i: I18n, pct: number) {
  const p = Math.round(Math.abs(pct));
  if (p < 1) return i.bn ? '৬ মাস আগের মতোই' : 'about the same as 6 months ago';
  if (i.bn) return `৬ মাস আগের চেয়ে প্রায় ${i.N(p)}% ${pct > 0 ? 'বেশি' : 'কম'}`;
  return `about ${i.N(p)}% ${pct > 0 ? 'higher' : 'lower'} than 6 months ago`;
}
/** "1 place", "6 places" */
const nPlaces = (i: I18n, n: number) => (i.bn ? `${i.N(n)}টি জায়গা` : `${i.N(n)} ${n === 1 ? 'place' : 'places'}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const moveIcon = (pct: number) => (Math.round(Math.abs(pct)) < 1 ? 'minus' : pct > 0 ? 'trend-up' : 'trend-down');
/** where a price sits between the lowest and highest, 0 to 1 */
const at01 = (p: number, lo: number, hi: number) => (hi === lo ? 0.5 : (p - lo) / (hi - lo));

type PF = { tab: 'now' | 'index'; type: string; area: string; city: string };
const readP = (q: Record<string, string | string[]>): PF => ({ tab: q.tab === 'index' ? 'index' : 'now', type: String(q.type || ''), area: String(q.area || ''), city: String(q.city || '') });
const writeP = (f: PF): Q => ({ tab: f.tab === 'index' ? 'index' : '', type: f.type, area: f.area, city: f.city });
type Ctx = { dishes: DishCard[]; log: PriceLog; hist: Record<string, HistRow[]>; now: number | null; order: string[] };

/* ---------- the strip: one dot per price, the typical price marked ---------- */
function Strip({ prices, lo, hi, mid, cls }: { prices: number[]; lo: number; hi: number; mid: number; cls?: string }) {
  const xs = [...new Set(prices)];
  return (
    <span className={clsx('px-strip', cls)} aria-hidden="true">
      {xs.map(p => <i key={p} style={{ '--p': at01(p, lo, hi) } as CSSProperties} />)}
      <s style={{ '--p': at01(mid, lo, hi) } as CSSProperties} />
    </span>
  );
}

/* ---------- today's prices for one dish ---------- */
function Compare({ pf, setP, cx }: { pf: PF; setP: (o: Partial<PF>) => void; cx: Ctx }) {
  const i = useI(), href = useHref();
  const { dishes, log, hist, now, order } = cx;
  const [q, setQ] = useState('');
  const [moved, setMoved] = useState(false);
  const qq = norm(q);
  const hits = qq ? order.filter(id => norm(C.types[id].en + ' ' + C.types[id].bn).includes(qq) || dishes.some(d => d.type === id && norm(d.name.en + ' ' + d.name.bn).includes(qq))) : order;
  const ty = order.includes(pf.type) ? pf.type : order[0];
  const pick = (id: string) => { setMoved(true); setP({ type: id }); setQ(''); };

  /* places per dish in the chosen area, for the dish chips */
  const placesBy = useMemo(() => {
    const o: Record<string, Set<string>> = {};
    for (const d of dishes) if ((!pf.area || d.rest.area === pf.area) && (!pf.city || d.rest.city === pf.city)) (o[d.type] ||= new Set()).add(d.r);
    return o;
  }, [dishes, pf.area, pf.city]);

  /* keep the chosen dish in view in its sideways row */
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = rowRef.current, el = row?.querySelector<HTMLElement>('.px-type.on');
    if (row && el) row.scrollTo({ left: el.offsetLeft - row.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [ty]);

  const st = rowsOf(dishes, ty, pf);
  const { ds, lo, hi, mid, places } = st;
  const name = i.L(C.types[ty]);
  const title = placeTitle(i, name, pf);
  const sig = ds.map(d => d.r + d.id + d.price).join();
  const tr: Trend | null | undefined = useMemo(() => (now == null ? undefined : trendOf(ds, log, hist, now)), [now, sig, log, hist]); // eslint-disable-line react-hooks/exhaustive-deps
  const data: TrendRow[] = tr ? tr.pts.map(z => ({ t: i.dm(new Date(z.at)), v: z.v })) : [];
  const many = ds.length > 1;

  return (
    <div>
      <div className="px-tools">
        <div className="px-q">
          <label className="tb-q">
            <I n="magnifying-glass" />
            <input type="search" value={q} onChange={ev => setQ(ev.target.value)} onKeyDown={ev => { if (ev.key === 'Enter' && hits[0]) pick(hits[0]); }} placeholder={i.tx('pt_search')} aria-label={i.tx('pt_search')} enterKeyHint="search" />
          </label>
          <Choose icon="map-pin" label={areaLabel(i, pf)} on={!!(pf.area || pf.city)} title={i.t('area')} opts={areaOpts(i)} value={areaValue(pf)} onPick={v => setP(pickArea(v))} align="start" />
        </div>
        {hits.length ? (
          <div className="px-types" ref={rowRef} role="tablist" aria-label={i.t('categories')}>
            {hits.map(id => {
              const n = placesBy[id]?.size || 0;
              return (
                <button key={id} role="tab" aria-selected={id === ty} className={clsx('px-type', id === ty && 'on', !n && 'none')} onClick={() => pick(id)}>
                  <Pic id={C.types[id].p} w={120} word={i.L(C.types[id])} sizes="44px" />
                  <span><b>{i.L(C.types[id])}</b><small>{nPlaces(i, n)}</small></span>
                </button>
              );
            })}
          </div>
        ) : <p className="meta px-none">{i.tx('pt_none', { q })}</p>}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.div key={ty + pf.area + pf.city} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.24, ease: EASE }}>
          {!ds.length ? (
            <div className="card empty px-empty"><I n="map-pin" /><b>{i.L(W.noDish)}</b></div>
          ) : (
            <div className="px-grid">
              <section className="px-sum" aria-label={title}>
                <h2><Morph>{title}</Morph></h2>
                <div>
                  <span className="k">{i.L(W.typical)}</span>
                  <b className="big"><Tk v={mid} flow /></b>
                </div>
                {many ? (
                  <div>
                    <Strip prices={ds.map(d => d.price)} lo={lo} hi={hi} mid={mid} />
                    <div className="px-ends">
                      <span><Tk v={lo} /><small>{i.t('lowest')}</small></span>
                      <span><Tk v={hi} /><small>{i.t('highest')}</small></span>
                    </div>
                  </div>
                ) : null}
                <p className="k">{many ? i.bn ? `${nPlaces(i, places)}য় ${i.tk(lo)} থেকে ${i.tk(hi)}` : `${i.tk(lo)} to ${i.tk(hi)} across ${nPlaces(i, places)}` : i.L(W.one)}</p>
                {many ? <p className="k px-small">{i.L(W.typNote)}</p> : null}
              </section>

              <ol className="px-list" aria-label={title}>
                {ds.map((d, k) => (
                  <m.li key={ty + d.r + d.id} className="px-row" initial={moved ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: Math.min(k, 8) * 0.03, ease: EASE }}>
                    <m.button className="px-main" onClick={() => openDish(d.rest, d)} whileTap={{ scale: 0.97 }}>
                      <Pic id={d.p} w={160} word={i.L(d.name)} tone={d.rest.theme} sizes="56px" />
                      <span className="px-t">
                        <b>{i.L(d.rest.name)}</b>
                        <small>{i.L(d.name)} · {i.L(areaOf(d.rest.area))}</small>
                      </span>
                      <span className="px-p"><Tk v={d.price} />{many && d.price === lo ? <em>{i.t('lowest')}</em> : null}</span>
                      {many ? (
                        <span className="px-bar" aria-hidden="true">
                          <s style={{ '--p': at01(mid, lo, hi) } as CSSProperties} />
                          <i style={{ '--p': at01(d.price, lo, hi) } as CSSProperties} />
                        </span>
                      ) : null}
                    </m.button>
                    <Link className="px-go" href={href('/r/' + d.r)} aria-label={w(i, W.open, { r: i.L(d.rest.name) })} title={w(i, W.open, { r: i.L(d.rest.name) })}>
                      <I n="storefront" />
                    </Link>
                  </m.li>
                ))}
              </ol>

              <section className="card px-trend">
                <h2>{i.L(W.trendH)}</h2>
                {places < MIN_PLACES ? <p className="meta">{i.L(W.trendNeed)}</p>
                  : !tr ? (
                    <div className="px-tr-sk" aria-busy="true"><div className="sk" style={{ height: 22, width: '80%' }} /><div className="sk" style={{ height: 170 }} /></div>
                  ) : (
                    <>
                      <p className="px-move"><I n={moveIcon(tr.pct)} b /><span>{title}: {moveText(i, tr.pct)}</span></p>
                      <div className="px-chart" role="img" aria-label={`${title}: ${moveText(i, tr.pct)}`}><TrendChart data={data} name={i.L(W.typical)} /></div>
                      <p className="meta px-small">{i.L(W.trendNote)} {i.tx('demo_hist')}</p>
                    </>
                  )}
              </section>
            </div>
          )}
        </m.div>
      </AnimatePresence>
      <p className="meta px-rule"><I n="info" />{i.L(W.order)}</p>
    </div>
  );
}

/* ---------- the Food Price Index: the typical price of every everyday dish in a city ---------- */
type IRow = { id: string; n: number; now: number; lo: number; hi: number; tr?: Trend | null };
function Spark({ pts }: { pts: number[] }) {
  const lo = Math.min(...pts), hi = Math.max(...pts), W0 = 72, H0 = 24;
  const d = pts.map((v, k) => `${(k / (pts.length - 1)) * W0},${hi === lo ? H0 / 2 : H0 - 2 - ((v - lo) / (hi - lo)) * (H0 - 4)}`).join(' ');
  return <svg className="pxi-spark" viewBox={`0 0 ${W0} ${H0}`} aria-hidden="true"><polyline points={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}
function Change({ pct }: { pct: number }) {
  const i = useI();
  const p = Math.round(Math.abs(pct));
  return <span className={clsx('pxi-ch', p < 1 ? 'same' : pct > 0 ? 'up' : 'down')}><I n={moveIcon(pct)} b />{p < 1 ? i.dg('0') + '%' : (pct > 0 ? '+' : '−') + i.N(p) + '%'}</span>;
}
const monthName = (i: I18n, now: number) => new Date(now).toLocaleDateString(i.bn ? 'bn-BD' : 'en-GB', { month: 'long', year: 'numeric' });

function PriceIndex({ pf, setP, cx }: { pf: PF; setP: (o: Partial<PF>) => void; cx: Ctx }) {
  const i = useI();
  const city = cityOf(pf), now = cx.now;
  /* today's typical prices need no clock: they are in the first HTML. The moves arrive once the page is live */
  const base = useMemo(() => typeOrder().map(id => {
    const s = rowsOf(cx.dishes, id, { city });
    return s.places >= MIN_PLACES ? { id, n: s.places, now: s.mid, lo: s.lo, hi: s.hi } : null;
  }).filter(Boolean) as IRow[], [cx.dishes, city]);
  const rows: IRow[] = useMemo(() => (now == null ? base : base.map(z => ({ ...z, tr: trendOf(cx.dishes.filter(d => d.type === z.id && d.rest.city === city), cx.log, cx.hist, now) }))), [base, now, cx, city]);
  const ready = now != null;
  const shareRows: IndexRow[] | null = ready ? rows.map(z => ({ id: z.id, n: z.n, now: z.now, lm: z.tr?.lm ?? z.now, m6: z.tr?.was ?? z.now })) : null;

  const [shot, setShot] = useState<{ k: string; url: string } | null>(null);
  const words = () => ({
    title: i.tx('pi_title'), place: `${i.L(C.cities[city])} · ${monthName(i, now!)}`,
    avg: (d: string) => w(i, W.typOf, { d: i.bn ? d : d.toLowerCase() }), vs: (v: string) => i.tx('pi_vs', { v }), type: (id: string) => i.L(C.types[id]), tk: i.tk,
    foot: i.L(W.foot),
  });
  const key = shareRows ? i.lang + city + shareRows.map(z => z.id + z.now + z.lm).join() : '';
  const img = shot && shot.k === key ? shot.url : null;
  useEffect(() => {
    if (!shareRows || !shareRows.length) return;
    let gone = false;
    canvasFonts().then(fam => { if (!gone) setShot({ k: key, url: shareCanvas(shareRows, words(), fam).toDataURL('image/png') }); });
    return () => { gone = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const share = async () => {
    if (!shareRows) return;
    const c = shareCanvas(shareRows, words(), await canvasFonts());
    c.toBlob(async b => {
      if (!b) return;
      const f = new File([b], 'khabo-kacchi-report.png', { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: i.tx('pi_title') }); return; }
      } catch { return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'khabo-kacchi-report.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast(i.tx('dl_img'));
    });
  };
  const go = (id: string) => { setP({ tab: 'now', type: id, city, area: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const top = rows[0];
  return (
    <div>
      <div className="sec-head">
        <div>
          <h2 className="h2">{i.tx('pi_title')}</h2>
          <p className="sub">{w(i, W.idxSub, { c: i.L(C.cities[city]) })}{ready ? ' ' + monthName(i, now) + '.' : ''}</p>
        </div>
        <Seg id="picity" items={[['dhaka', i.L(C.cities.dhaka)], ['bogura', i.L(C.cities.bogura)]]} value={city} onChange={v => setP({ city: v, area: '' })} />
      </div>
      {rows.length && top ? (
        <div className="pxi">
          <div className="pxi-main">
            <button className="px-sum pxi-hero" onClick={() => go(top.id)}>
              <span className="k">{w(i, W.typOf, { d: i.bn ? i.L(C.types[top.id]) : i.L(C.types[top.id]).toLowerCase() })}, {i.L(C.cities[city])}</span>
              <b className="big"><Tk v={top.now} flow /></b>
              <Strip prices={cx.dishes.filter(d => d.type === top.id && d.rest.city === city).map(d => d.price)} lo={top.lo} hi={top.hi} mid={top.now} />
              <span className="px-ends"><span><Tk v={top.lo} /><small>{i.t('lowest')}</small></span><span><Tk v={top.hi} /><small>{i.t('highest')}</small></span></span>
              <span className="k px-move">{top.tr ? <><I n={moveIcon(top.tr.pct)} b />{cap(moveText(i, top.tr.pct))}</> : top.tr === null ? null : <span className="sk" style={{ display: 'block', height: 18, width: '70%' }} />}</span>
            </button>
            <div className="card pxi-list">
              <div className="pxi-h"><span>{i.L(W.dish)}</span><span>{i.L(W.typical)}</span><span>{i.L(W.idx6)}</span></div>
              {rows.map((z, k) => (
                <m.button key={z.id} className="pxi-r" onClick={() => go(z.id)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(k, 8) * 0.03, duration: 0.24, ease: EASE }}>
                  <Pic id={C.types[z.id].p} w={120} word={i.L(C.types[z.id])} sizes="44px" />
                  <span className="pxi-n"><b>{i.L(C.types[z.id])}</b><small>{nPlaces(i, z.n)} · {i.tk(z.lo)} {i.L(W.to)} {i.tk(z.hi)}</small></span>
                  <span className="pxi-sp">{z.tr ? <Spark pts={z.tr.pts.map(p => p.v)} /> : null}</span>
                  <Tk v={z.now} cls="pxi-p" />
                  <span className="pxi-c">{z.tr ? <Change pct={z.tr.pct} /> : z.tr === null ? null : <span className="sk" style={{ display: 'block', height: 16, width: 44 }} />}</span>
                </m.button>
              ))}
            </div>
            <p className="meta px-small">{i.L(W.idxTap)} {i.tx('demo_hist')}</p>
          </div>
          <div className="pxi-share">
            {img
              ? <m.img key={img.length} src={img} alt={i.tx('pi_title')} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: EASE }} />
              : <div className="sk" style={{ aspectRatio: '1080 / 1350', borderRadius: 18 }} />}
            <div className="pxi-btns">
              <button className="btn btn-pri" onClick={share} disabled={!ready}><I n="share-network" />{i.tx('share_img')}</button>
              {img ? <a className="btn btn-line" href={img} download="khabo-kacchi-report.png"><I n="download-simple" />{i.tx('dl_img')}</a> : null}
            </div>
          </div>
        </div>
      ) : <div className="card empty px-empty"><I n="chart-bar" /><b>{i.tx('pi_none')}</b></div>}
    </div>
  );
}

export function PricesView({ dishes, log, order }: { dishes: DishCard[]; log: PriceLog; order: string[] }) {
  const i = useI();
  const [pf, setPf] = useUrlState('/prices', readP, writeP);
  const setP = (o: Partial<PF>) => setPf({ ...pf, ...o });
  const db = useDemoDB();
  /* the clock and this browser's saved panel changes are only known after the page loads */
  const now = useNow();
  /* prices changed in the owner panel show here straight away */
  const live = useMemo(() => {
    const rest = db.rest;
    if (!rest) return dishes;
    return dishes.map(d => { const ld = rest[d.r]?.menu.find(x => x.id === d.id); return ld && ld.price !== d.price ? { ...d, price: ld.price } : d; });
  }, [dishes, db.rest]);
  const cx: Ctx = useMemo(() => ({ dishes: live, log, hist: db.hist || {}, now, order }), [live, log, db.hist, now, order]);
  const tabs: [string, ReactNode][] = [['now', i.L(W.tab1)], ['index', i.tx('pt_tab2')]];
  return (
    <div className="wrap lp px">
      <div className="lh">
        <div>
          <Rise as="h1" className="h1">{i.L(W.title)}</Rise>
          <Rise as="p" className="sub" d={1}>{i.L(W.sub)}</Rise>
        </div>
        <Seg id="pttab" items={tabs} value={pf.tab} onChange={v => setP({ tab: v as PF['tab'] })} />
      </div>
      <div className="px-body">
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={pf.tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.24, ease: EASE }}>
            {pf.tab === 'index' ? <PriceIndex pf={pf} setP={setP} cx={cx} /> : <Compare pf={pf} setP={setP} cx={cx} />}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

