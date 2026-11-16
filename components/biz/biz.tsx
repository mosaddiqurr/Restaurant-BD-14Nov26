'use client';
/* /business, "For restaurants": what a restaurant gets, how it goes live in about a week, the plans and the
   lead form. Restaurants are khabo's only paying customers; diners never pay.
   Ported from archive/prototype/app/app.js (Biz, BPLANS, Faq). */
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { AnimatePresence, m, useInView } from 'motion/react';
import { toast } from '@/lib/toast';
import { useI } from '@/components/providers/i18n';
import { I, Rise, Seg, Tk, useMounted } from '@/components/ui/bits';
import { useHref } from '@/components/shell/nav';
import { useApp } from '@/lib/store';
import { C, EASE, areaOf, src } from '@/lib/khabo';
import type { Text, Theme, TourRoom } from '@/lib/data/types';
import { QR, QRL, type QRLook } from './qr';
import '@/styles/pages-extra.css';

export type BizShow = {
  id: string; name: Text; theme: Theme; mono: string; area: string;
  kitchen: string | null; tour: TourRoom[];
  dishes: { id: string; name: Text; price: number }[];
};
export type BizPick = { id: string; name: Text; theme: Theme; look: QRLook };

const BPLANS = [
  { id: 'starter', name: { en: 'Starter', bn: 'স্টার্টার' }, dhaka: 1999, sub: { en: 'A professional page with a menu that is always right.', bn: 'সবসময় সঠিক মেনুসহ পেশাদার পেজ।' }, f: ['f_page', 'f_menu', 'f_photos', 'f_qr', 'f_print', 'f_reviews', 'f_report'] },
  { id: 'pro', name: { en: 'Pro', bn: 'প্রো' }, dhaka: 4999, pop: true, sub: { en: 'Stand out with a 360° tour, a film and price insights.', bn: '৩৬০° ট্যুর, ফিল্ম আর দামের তুলনা দিয়ে আলাদা হোন।' }, f: ['f_all_starter', 'f_film', 'f_kitchen', 'f_tour', 'f_video_menu', 'f_insights', 'f_deals'] },
  { id: 'premium', name: { en: 'Premium', bn: 'প্রিমিয়াম' }, dhaka: 9999, sub: { en: 'Maximum reach: featured placement and Deal of the Week.', bn: 'সর্বোচ্চ প্রচার: ফিচারড জায়গা আর সপ্তাহের ডিল।' }, f: ['f_all_pro', 'f_long_film', 'f_3d', 'f_featured', 'f_dotw', 'f_social', 'f_priority'] },
] as const;
const HOW = [['how1', 'calendar-blank', 'pv:warm_restaurant:a'], ['how2', 'camera', 'kc1'], ['how3', 'broadcast', 'kt'], ['how4', 'chart-line-up', 'iB']] as const;
const W = { phone_wait: { en: 'Loading the live page', bn: 'লাইভ পেজ আসছে' } };

/* one question: the answer eases open and comes into focus */
function Faq({ k }: { k: string }) {
  const i = useI();
  const [o, setO] = useState(false);
  return (
    <div className="faq-i">
      <button className="faq-q" onClick={() => setO(!o)} aria-expanded={o}>{i.t(k)}
        <m.span className="faq-c" animate={{ rotate: o ? 45 : 0 }} transition={{ duration: 0.25, ease: EASE }}><I n="plus" b /></m.span>
      </button>
      <AnimatePresence initial={false}>
        {o ? (
          <m.div key="a" className="faq-a" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0, transition: { duration: 0.22, ease: EASE } }} transition={{ duration: 0.32, ease: EASE }}>
            <m.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.14 } }} transition={{ duration: 0.3, ease: EASE, delay: 0.04 }}>{i.t(k + '_a')}</m.p>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function BizView({ sh, picks }: { sh: BizShow; picks: BizPick[] }) {
  const i = useI(), href = useHref();
  const set = useApp(s => s.set);
  const [city, setCity] = useState('dhaka');
  const [plan, setPlan] = useState('pro');
  const [sent, setSent] = useState(false);
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const mounted = useMounted();
  const fref = useRef<HTMLElement>(null);
  const phRef = useRef<HTMLDivElement>(null), phIn = useInView(phRef, { once: true, margin: '200px 0px' });
  const [phReady, setPhReady] = useState(false);
  const vref = useRef<HTMLVideoElement>(null), vIn = useInView(vref, { margin: '120px 0px' });
  useEffect(() => {
    const v = vref.current; if (!v || !sh.kitchen) return;
    if (vIn) { v.muted = true; if (!v.getAttribute('src')) v.src = sh.kitchen; v.play().catch(() => { }); } else v.pause();
  }, [vIn, sh.kitchen]);

  /* the QR codes point at this site's own table menu, so they work when scanned from the screen */
  const tableUrl = (id: string) => (mounted ? location.origin : 'https://khabo.app') + href('/t/' + id);
  const price = (p: { dhaka: number }) => (city === 'dhaka' ? p.dhaka : p.dhaka - 500);
  const toForm = (id?: string) => { if (id) setPlan(id); fref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const submit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget), b: Record<string, boolean> = {};
    (['n', 'r'] as const).forEach(k => { if (!String(fd.get(k) || '').trim()) b[k] = true; });
    if (!/^(\+?880|0)?1[3-9]\d{8}$/.test(String(fd.get('p') || '').replace(/[\s-]/g, ''))) b.p = true;
    setBad(b);
    if (Object.keys(b).length) { (ev.currentTarget.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus(); return; }
    setSent(true);
    toast.success(i.t('form_done'), { description: i.t('form_done_sub') });
  };
  const kd = (id: string) => sh.dishes.find(d => d.id === id);
  const kacchi = kd('mutton-kacchi');

  return (
    <div className="wrap lp">
      <section className="bz-hero">
        <div>
          <Rise as="h1" className="h1">{i.t('biz_h1')}</Rise>
          <Rise as="p" className="sub" d={1} style={{ fontSize: 18 }}>{i.t('biz_sub')}</Rise>
          <Rise d={2} className="bz-btns">
            <button className="btn btn-pri btn-lg" onClick={() => toForm()}><I n="calendar-blank" />{i.t('book_visit')}</button>
            <Link className="btn btn-line btn-lg" href={href('/r/' + sh.id)}>{i.t('see_live')}<I n="arrow-up-right" b /></Link>
            <Link className="btn btn-line btn-lg" href={href('/partner')}><I n="user-circle" />{i.t('partner_sign_in')}</Link>
          </Rise>
          <p className="meta bz-note">{i.t('biz_note')}</p>
        </div>
        <Rise d={1}>
          <div className="phone" ref={phRef}>
            <div className="notch" />
            {phIn ? <iframe title={i.t('see_live')} src={href('/r/' + sh.id)} allow="autoplay" loading="lazy" onLoad={() => setPhReady(true)} /> : null}
            <AnimatePresence>{!phReady ? <m.div key="w" className="ph-wait" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><span className="sk" style={{ position: 'absolute', inset: 0, borderRadius: 38 }} /><span className="meta" style={{ position: 'relative' }}>{i.L(W.phone_wait)}</span></m.div> : null}</AnimatePresence>
          </div>
        </Rise>
      </section>

      <section className="sec">
        <Rise as="h2" className="h2">{i.t('vs_title')}</Rise>
        <div className="vs">
          <Rise className="vs-c old"><h3>{i.t('vs_old')}</h3><ul>{['vs_o1', 'vs_o2', 'vs_o3', 'vs_o4'].map(k => <li key={k}><I n="x-circle" />{i.t(k)}</li>)}</ul></Rise>
          <Rise d={1} className="vs-c new"><h3>{i.t('vs_new', { b: 'khabo' })}</h3><ul>{['vs_n1', 'vs_n2', 'vs_n3', 'vs_n4'].map(k => <li key={k}><I n="check-circle" f />{i.t(k)}</li>)}</ul></Rise>
        </div>
      </section>

      <section className="sec">
        <Rise as="h2" className="h2">{i.t('get_title')}</Rise>
        <Rise as="p" className="sub" d={1}>{i.t('get_sub')}</Rise>
        <div className="get">
          <Rise className="g1 phc">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src('pv:warm_reception_dinner:a', 1400)} alt="" loading="lazy" decoding="async" />
            <div className="cap"><h3>{i.t('g_tour')}</h3><p>{i.t('g_tour_sub')}</p>
              {sh.tour.length ? <button className="btn btn-white btn-sm" onClick={() => set({ tour: { r: { id: sh.id, name: sh.name, theme: sh.theme, mono: sh.mono }, rooms: sh.tour, room: 'banquet' } })}><I n="virtual-reality" />{i.t('try_it')}</button> : null}
            </div>
          </Rise>
          <Rise d={1} className="g2 phc">
            <video ref={vref} muted loop playsInline preload="none" poster={src('kc1', 900)} aria-hidden="true" />
            <div className="cap"><h3>{i.t('g_film')}</h3><p>{i.t('g_film_sub')}</p></div>
          </Rise>
          <Rise d={2} className="g3"><div className="pad"><h3>{i.t('g_menu')}</h3><p>{i.t('g_menu_sub')}</p>
            <div className="show">
              <div className="paper"><b>{i.L(sh.name)}</b><ul>{['mutton-kacchi', 'kacchi-handi', 'morog-polao'].map(kd).filter(Boolean).map(d => <li key={d!.id}><span>{i.L(d!.name)}</span><i /><b><Tk v={d!.price} /></b></li>)}</ul></div>
              <div className="tent">{mounted ? <QR text={tableUrl(sh.id)} look="rounded" /> : <div className="qr"><div className="qr-wait" /></div>}<span>{i.t('tc_scan')}</span></div>
            </div>
            <a className="btn btn-line btn-sm" style={{ justifySelf: 'start' }} href={href('/print/' + sh.id)} target="_blank" rel="noopener"><I n="printer" />{i.t('see_print')}</a>
          </div></Rise>
          <Rise d={3} className="g4"><div className="pad"><h3>{i.t('g_report')}</h3><p>{i.t('g_report_sub')}</p>
            <div className="rep">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><b>{i.L(sh.name)}</b><span className="meta">{i.t('sample')} · {i.t('oct')}</span></div>
              <div className="rep-k">
                <div><small>{i.t('page_views')}</small><b>{i.N(4812)}</b><em>+{i.N(18)}%</em></div>
                <div><small>{i.t('qr_scans')}</small><b>{i.N(1236)}</b><em>+{i.N(9)}%</em></div>
                <div><small>{i.t('calls_dirs')}</small><b>{i.N(388)}</b><em>+{i.N(12)}%</em></div>
              </div>
              <div className="rep-top"><span className="meta">{i.t('top_dishes')}</span>
                <ol>{([['mutton-kacchi', 100], ['kacchi-handi', 64], ['morog-polao', 41]] as const).filter(([id]) => kd(id)).map(([id, w], k) => (
                  <li key={id}><span>{i.L(kd(id)!.name)}</span><span><m.i style={{ width: w + '%' }} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 + k * 0.08 }} /></span></li>
                ))}</ol>
              </div>
              {kacchi ? <p className="meta" style={{ display: 'flex', gap: 6 }}><I n="info" />{i.t('insight_line', { d: i.L(kacchi.name), v: i.tk(kacchi.price), a: i.L(areaOf(sh.area)), m: i.tk(380) })}</p> : null}
            </div>
          </div></Rise>
        </div>
      </section>

      <section className="sec">
        <Rise as="h2" className="h2">{i.t('qrb_title')}</Rise>
        <Rise as="p" className="sub" d={1}>{i.t('qrb_sub')}</Rise>
        <div className="qrb">
          {picks.map(r => (
            <m.a key={r.id} className="qrb-c" href={href('/t/' + r.id)} target="_blank" rel="noopener" style={{ '--td': r.theme.deep, '--ta': r.theme.accent } as CSSProperties}
             >
              <span className={clsx('nm', r.theme.font === 'serif' && 'serif')}>{i.L(r.name)}</span>
              {mounted ? <QR text={tableUrl(r.id)} look={r.look} /> : <div className="qr"><div className="qr-wait" /></div>}
              <small>{i.L(QRL[r.look])}</small>
            </m.a>
          ))}
        </div>
        <ul className="qrb-pts"><li><I n="storefront" />{i.t('qrb_p1')}</li><li><I n="squares-four" />{i.t('qrb_p2')}</li><li><I n="check-circle" />{i.t('qrb_p3')}</li></ul>
      </section>

      <section className="sec">
        <Rise className="how-band">
          <h2 className="h2">{i.t('how_title')}</h2>
          <ol className="how">
            <m.i className="how-fill" aria-hidden="true" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE, delay: 0.2 }} />
            {HOW.map(([k, ic, ph], n) => (
              <m.li key={k} whileHover={{ y: -6 }}>
                <span className="ic"><I n={ic} /></span><span className="nb" aria-hidden="true">{i.dg(n + 1)}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="how-pic"><img src={src(ph, 600)} alt="" loading="lazy" decoding="async" /></div>
                <b>{i.t(k)}</b><p>{i.t(k + '_s')}</p>
              </m.li>
            ))}
          </ol>
        </Rise>
      </section>

      <section className="sec" id="plans" style={{ scrollMarginTop: 90 }}>
        <div className="sec-head">
          <div><Rise as="h2" className="h2">{i.t('plans_title')}</Rise><Rise as="p" className="sub" d={1}>{i.t('plans_sub')}</Rise></div>
          <Seg id="bcity" items={[['dhaka', i.L(C.cities.dhaka)], ['bogura', i.L(C.cities.bogura)]]} value={city} onChange={setCity} />
        </div>
        <div className="plans">
          {BPLANS.map((p, n) => (
            <Rise key={p.id} d={n} className={clsx('plan', 'pop' in p && p.pop && 'hot')}>
              {'pop' in p && p.pop ? <span className="most">{i.t('most_popular')}</span> : null}
              <h3>{i.L(p.name)}</h3><p>{i.L(p.sub)}</p>
              <div className="pp"><Tk v={price(p)} flow /><span>{i.t('per_month')}</span></div>
              <p className="day">{i.t('per_day', { v: i.tk(Math.round(price(p) / 30)) })}</p>
              <ul>{p.f.map(k => <li key={k}><I n="check" b />{i.t(k)}</li>)}</ul>
              <m.button className={clsx('btn', 'pop' in p && p.pop ? 'btn-gold' : 'btn-line')} whileTap={{ scale: 0.97 }} onClick={() => toForm(p.id)}>{i.t('choose_plan', { p: i.L(p.name) })}</m.button>
            </Rise>
          ))}
        </div>
        <p className="meta" style={{ marginTop: 16 }}>{i.t('plans_note')}</p>
      </section>

      <section className="sec">
        <div className="faq-w">
          <Rise as="h2" className="h2">{i.t('faq')}</Rise>
          <div className="faq">{['faq1', 'faq2', 'faq3', 'faq4', 'faq5'].map(k => <Faq key={k} k={k} />)}</div>
        </div>
      </section>

      <section className="sec" ref={fref} id="visit" style={{ scrollMarginTop: 90 }}>
        <Rise className="bf">
          <div>
            <h2 className="h2">{i.t('form_title')}</h2><p className="sub">{i.t('form_sub')}</p>
            <ul>{['form_p1', 'form_p2', 'form_p3'].map(k => <li key={k}><I n="check-circle" f />{i.t(k)}</li>)}</ul>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {sent ? (
              <m.div key="ok" className="done" role="status" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: EASE }}>
                <m.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.08 }} style={{ display: 'grid' }}><I n="check-circle" f s={52} cls="ok-ic" /></m.span>
                <b className="h3">{i.t('form_done')}</b><p className="meta">{i.t('form_done_sub')}</p>
              </m.div>
            ) : (
              <m.form key="f" className="form" noValidate onSubmit={submit} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}>
                <label>{i.t('your_name')}<input name="n" autoComplete="name" aria-invalid={!!bad.n} onInput={() => bad.n && setBad({ ...bad, n: false })} /></label>
                <label>{i.t('rest_name')}<input name="r" autoComplete="organization" aria-invalid={!!bad.r} onInput={() => bad.r && setBad({ ...bad, r: false })} /></label>
                <label className="full">{i.t('phone')}
                  <input name="p" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" aria-invalid={!!bad.p} aria-describedby="bf-ph" onInput={() => bad.p && setBad({ ...bad, p: false })} />
                  <span id="bf-ph" className={bad.p ? 'err' : 'help'}>{bad.p ? i.t('phone_err') : i.t('phone_help')}</span>
                </label>
                <label>{i.t('area')}<select name="a">{C.areas.map(a => <option key={a.id}>{i.L(a)}, {i.L(C.cities[a.city])}</option>)}<option>{i.t('other_area')}</option></select></label>
                <label>{i.t('plan')}<select name="pl" value={plan} onChange={ev => setPlan(ev.target.value)}>{BPLANS.map(p => <option key={p.id} value={p.id}>{i.L(p.name)}</option>)}<option value="unsure">{i.t('not_sure')}</option></select></label>
                <m.button className="btn btn-pri btn-lg full" type="submit" whileTap={{ scale: 0.97 }}>{i.t('book_visit')}</m.button>
                <p className="meta full">{i.t('form_privacy')}</p>
              </m.form>
            )}
          </AnimatePresence>
        </Rise>
      </section>
    </div>
  );
}
