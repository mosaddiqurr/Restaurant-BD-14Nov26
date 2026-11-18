'use client';
/* The printable menu page (app/[lang]/print/[id]): the restaurant's chosen design on real A4 (or A5) paper,
   filled from its live menu, with its table QR code. A bar on screen lets you try another design (?d=<design>),
   the paper size (?size=a5) and the language on the paper (?lang=both|en|bn), then print. The bar never prints. */
import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { I, Seg } from '@/components/ui/bits';
import { useHref } from '@/components/shell/nav';
import { QR } from '@/components/qr/qr';
import { useLiveRestaurant } from '@/lib/demo-db';
import { A4W, MENUS, MenuSheet, designOf, fitMenu, pmOpts, type PmOpts, type PrintRest } from './menu';

const T = {
  back: { en: 'Back', bn: 'ফিরে যান' },
  design: { en: 'Design', bn: 'ডিজাইন' },
  print: { en: 'Print or save PDF', bn: 'প্রিন্ট বা পিডিএফ' },
  both: { en: 'English + বাংলা', bn: 'English + বাংলা' },
  help: { en: 'Filled from the menu on Khaoya, so a fresh print always has today’s dishes and prices. The QR code opens the menu with photos.', bn: 'খাওয়া-র মেনু থেকে তৈরি, তাই নতুন প্রিন্টে সবসময় আজকের খাবার আর দাম থাকে। কিউআর কোড ছবিসহ মেনু খোলে।' },
};
type Q = { d?: string; size?: 'a4' | 'a5'; lang?: PmOpts['lang'] };
const noop = () => () => {};

export function PrintPage({ r: r0 }: { r: PrintRest }) {
  const i = useI(), href = useHref();
  const r = useLiveRestaurant(r0) as PrintRest;
  const saved = pmOpts(r);
  /* choices in the address win over the saved ones, so a link can open one design; picks made here win over both */
  const search = useSyncExternalStore(noop, () => location.search, () => '');
  const [picked, setPicked] = useState<Q>({});
  const fromUrl = useMemo(() => {
    const sp = new URLSearchParams(search), size = sp.get('size'), lang = sp.get('lang');
    return { d: designOf(sp.get('d'))?.id, size: size === 'a5' || size === 'a4' ? size : undefined, lang: lang === 'en' || lang === 'bn' || lang === 'both' ? lang : undefined } as Q;
  }, [search]);
  const q: Q = { ...fromUrl, ...picked };
  const set = (p: Q) => {
    const n = { ...q, ...p }; setPicked(n);
    const sp = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(n)) { if (v) sp.set(k, v); else sp.delete(k); }
    history.replaceState(null, '', location.pathname + (sp.toString() ? '?' + sp : ''));
  };
  const m = designOf(q.d);
  const o: PmOpts = { ...saved, ...(m ? { look: m.id, ...(m.pics ? { pics: m.pics } : {}) } : {}), ...(q.size ? { size: q.size } : {}), ...(q.lang ? { lang: q.lang } : {}) };

  /* the paper fits the screen (phones see the whole sheet, smaller); it prints at full size */
  const wrap = useRef<HTMLDivElement>(null), paper = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = wrap.current; if (!el) return;
    const fit = () => { const w = el.clientWidth - 32; el.style.setProperty('--pmw-z', String(Math.min(1, w / A4W))); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /* a long menu shrinks or goes to two columns to stay on one sheet; again once fonts and photos arrive */
  const key = JSON.stringify(o) + r.menu.length;
  useLayoutEffect(() => {
    const pm = paper.current?.querySelector<HTMLElement>('.pm'); if (!pm) return;
    const run = () => fitMenu(pm);
    run();
    let alive = true;
    document.fonts?.ready.then(() => { if (alive) run(); });
    const imgs = Array.from(pm.querySelectorAll('img')).filter(im => !im.complete);
    imgs.forEach(im => im.addEventListener('load', run, { once: true }));
    const t = setTimeout(run, 900);
    return () => { alive = false; clearTimeout(t); imgs.forEach(im => im.removeEventListener('load', run)); };
  }, [key]);

  const print = async () => {
    try { await document.fonts?.ready; } catch { /* print anyway */ }
    const pm = paper.current?.querySelector<HTMLElement>('.pm');
    await Promise.all(Array.from(pm?.querySelectorAll('img') || []).map(im => im.complete ? null : new Promise(res => { im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true }); })));
    if (pm) fitMenu(pm);
    window.print();
  };

  return (
    <div className={clsx('pmw', o.size === 'a5' && 'a5')} ref={wrap}>
      <div className="pmw-bar noprint">
        <Link className="pmw-back" href={href('/r/' + r.id)}><I n="arrow-left" b />{i.L(T.back)}</Link>
        <label className="pmw-pick">
          <span className="sr">{i.L(T.design)}</span>
          <select value={o.look} onChange={e => set({ d: e.target.value })} aria-label={i.L(T.design)}>
            {MENUS.map(x => <option key={x.id} value={x.id}>{i.L(x.name)}</option>)}
          </select>
          <I n="caret-down" b />
        </label>
        <Seg id="pmw-size" value={o.size} onChange={v => set({ size: v as 'a4' | 'a5' })} items={[['a4', 'A4'], ['a5', 'A5']]} />
        <Seg id="pmw-lang" value={o.lang} onChange={v => set({ lang: v as PmOpts['lang'] })} items={[['both', i.L(T.both)], ['en', 'English'], ['bn', 'বাংলা']]} />
        <span className="sp" />
        <button type="button" className="btn btn-pri" onClick={print}><I n="printer" b />{i.L(T.print)}</button>
        <p className="pmw-help">{designOf(o.look) ? i.L(designOf(o.look)!.note) + '. ' : ''}{i.L(T.help)}</p>
      </div>
      <div className="pmw-stage">
        <div className="pmw-paper" ref={paper}>
          <MenuSheet r={r} o={o} qr={<QR r={r} label={i.bn ? 'মেনুর কিউআর কোড' : 'Menu QR code'} />} />
        </div>
      </div>
    </div>
  );
}
