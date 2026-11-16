'use client';
/* Print menu (ported from archive/prototype/panel/print.js).
   Pick a design; it is filled from the menu on khabo, so a fresh print always has today's dishes, prices and photos.
   Every choice goes into the draft (r.printMenu) and is saved with Save changes; the preview shows it at once. */
import { memo, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { qrStyle } from '@/components/qr/qr';
import type { Text } from '@/lib/data/types';
import { clone, type PR } from '@/lib/panel/store';
import { Ico, Page, pickPhotos, Seg, Thumb, useR, useSaved, useT } from '../ui';
import { Fit, printWindow, realSize, siteLink, svgFor, usePrintFonts } from '../qr/kit';
import { A4W, fitMenu, MenuSheet, MENUS, PICS, pmOpts as pmOpts0, type PmOpts, type PrintRest } from '@/components/print/menu';
import '@/styles/print-menu.css';

/* the print menu is the same one the public print page uses (components/print/menu.tsx, styles under .pmw) */
const pmOpts = (r: PR) => pmOpts0(r as unknown as PrintRest);
/* the same fitting as fitMenu, as plain JS for the print window */
const FIT_JS = `function (pm) {
  var body = pm && pm.querySelector('.pm-body'); if (!body) return;
  var over = function () { return pm.offsetHeight / pm.offsetWidth * 210 > 297.5; };
  var shrink = function (min) { var z = 1; body.style.zoom = 1; while (over() && z > min) { z = Math.round((z - .02) * 100) / 100; body.style.zoom = z; } };
  var keep = /pics-(card|strip)/.test(pm.className);
  body.style.columns = '';
  shrink(keep ? .62 : .86);
  if (!keep && over() && getComputedStyle(body).columnCount !== '2') { body.style.columns = '2'; shrink(.72); }
}`;

type Words = Partial<Pick<PmOpts, 'title' | 'tag' | 'note'>>;

export function PrintMenu() {
  const { r } = useR();
  const i = useI(), t = useT(), saved = useSaved();
  usePrintFonts();
  const o = pmOpts(r);
  const [words, setWords] = useState<Words>({});
  const [open, setOpen] = useState(false);
  const bigRef = useRef<HTMLDivElement>(null);
  const ov: PmOpts = { ...o, ...words };
  const view = useDeferredValue(ov);

  /* every choice is kept for next time (no activity line for small switches) */
  const rRef = useRef(r); /* saves always start from the latest copy (words are saved a moment later) */
  useLayoutEffect(() => { rRef.current = r; });
  const set = (patch: Partial<PmOpts>, what?: Text) => { const cur = rRef.current, nr = clone(cur); nr.printMenu = { ...pmOpts(cur), ...patch }; return saved(nr, what); };
  /* own words: the preview follows as you type, saved a moment after you stop */
  useEffect(() => {
    if (!Object.keys(words).length) return;
    const tm = setTimeout(() => { set(words); setWords({}); }, 400);
    return () => clearTimeout(tm);
  }, [words]);

  const qrLang = ov.lang === 'both' ? i.lang : ov.lang;
  const qr = useMemo(() => svgFor(siteLink(qrLang, r), qrStyle(r)), [qrLang, r]);
  const hide = ov.hide || [];
  const picked = (d: PR['menu'][number]) => !!d.p && (!ov.pick || ov.pick.includes(d.id));
  const groups = r.cats.map(c => ({ c, ds: r.menu.filter(d => d.cat === c.id) })).filter(x => x.ds.length);
  const shown = r.menu.length - hide.filter(id => r.menu.some(d => d.id === id)).length;
  const nPic = r.menu.filter(d => !hide.includes(d.id) && picked(d)).length;

  const pick = (m: (typeof MENUS)[number]) => set({ look: m.id, ...(m.pics ? { pics: m.pics } : {}) }, { en: `Chose the ${m.name.en} print menu`, bn: `${m.name.bn} প্রিন্ট মেনু বেছে নিয়েছেন` });
  const toggleCat = (id: string) => {
    const all = groups.map(g => g.c.id), cur = ov.cats?.length ? ov.cats.slice() : all.slice(), k = cur.indexOf(id);
    if (k >= 0) cur.splice(k, 1); else cur.push(id);
    if (!cur.length) { toast.error(t('Keep at least one section.', 'অন্তত একটি ভাগ রাখুন।')); return; }
    set({ cats: cur.length === all.length ? null : cur });
  };
  const toggleHide = (id: string) => {
    const h = hide.slice(), k = h.indexOf(id);
    if (k >= 0) h.splice(k, 1);
    else { if (h.length >= r.menu.length - 1) { toast.error(t('Keep at least one dish.', 'অন্তত একটি খাবার রাখুন।')); return; } h.push(id); }
    set({ hide: h });
  };
  const togglePic = async (id: string) => {
    const d = r.menu.find(x => x.id === id); if (!d) return;
    if (!d.p) {
      /* no photo yet: add one. It is saved to the menu too */
      const [p] = await pickPhotos(false); if (!p) return;
      const nr = clone(r), nd = nr.menu.find(x => x.id === id)!; nd.p = p;
      const pk = pmOpts(r).pick; if (pk) nr.printMenu = { ...pmOpts(r), pick: pk.concat(id) };
      saved(nr, { en: `Added a photo for ${d.name.en}`, bn: `${d.name.bn || d.name.en}-এর ছবি যোগ করেছেন` }, { en: 'Photo added to your menu.', bn: 'ছবিটি আপনার মেনুতে যোগ হয়েছে।' });
      return;
    }
    const withP = r.menu.filter(x => x.p).map(x => x.id), cur = (ov.pick || withP).slice(), k = cur.indexOf(id);
    if (k >= 0) cur.splice(k, 1); else cur.push(id);
    set({ pick: withP.every(x => cur.includes(x)) ? null : cur });
  };
  const go = (auto: boolean) => {
    const pm = bigRef.current?.querySelector('.pm');
    printWindow({
      title: `${r.name.en} ${t('menu', 'মেনু')}`, lang: ov.lang === 'bn' ? 'bn' : 'en', body: `<div class="pmw${ov.size === 'a5' ? ' a5' : ''}">${realSize(pm)}</div>`, blocked: t('Allow pop-ups for this page to print.', 'প্রিন্ট করতে এই পেজের পপ-আপ চালু করুন।'),
      css: `.pmw{min-height:0;background:none}@media screen{.pmw .pm{margin:24px auto;box-shadow:0 10px 40px rgba(0,0,0,.18)}}${ov.size === 'a5' ? '@media print{.pmw.a5 .pm{zoom:.7048}}' : ''}`,
      script: `addEventListener('load',function(){document.body.offsetHeight;(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){(${FIT_JS})(document.querySelector('.pm'));${auto ? 'setTimeout(function(){print()},250);' : ''}})})`,
    });
  };
  const seg = <K extends 'lang' | 'desc' | 'qr' | 'size' | 'bw' | 'pics'>(k: K, items: [string, string][]) => (
    <Seg value={String(ov[k])} items={items} onChange={v => set({ [k]: v === 'true' ? true : v === 'false' ? false : v } as Partial<PmOpts>)} />
  );

  return (
    <Page title={t('Print menu', 'মেনু প্রিন্ট')}
      sub={t('Pick a design. It is filled from your menu on khabo, so a fresh print always has today’s dishes, prices and photos.', 'একটি ডিজাইন বেছে নিন। এটি খাবোতে থাকা আপনার মেনু দিয়েই ভরা হয়, তাই নতুন প্রিন্টে সবসময় আজকের খাবার, দাম আর ছবি থাকে।')}
      acts={<>
        <button type="button" className="btn" onClick={() => go(false)}><Ico n="arrow-up-right" sm />{t('Open full size', 'পুরো মাপে খুলুন')}</button>
        <button type="button" className="btn pri" onClick={() => go(true)}><Ico n="printer" sm />{t('Print', 'প্রিন্ট')}</button>
      </>}>
      <div className="pmk pmw pmw-in">
        <div className="pmk-main card">
          <div className="pmk-tools">
            {seg('lang', [['both', 'English + বাংলা'], ['en', 'English'], ['bn', 'বাংলা']])}
            {seg('desc', [['true', t('With descriptions', 'বর্ণনাসহ')], ['false', t('Names only', 'শুধু নাম')]])}
            {seg('qr', [['true', t('With QR code', 'কিউআর কোডসহ')], ['false', t('No QR', 'কিউআর ছাড়া')]])}
            {seg('size', [['a4', 'A4'], ['a5', 'A5']])}
            {seg('bw', [['false', t('Colour', 'রঙিন')], ['true', t('Black and white', 'সাদা-কালো')]])}
          </div>
          <div className="pmk-pics"><span className="lbl"><Ico n="image" sm />{t('Dish photos', 'খাবারের ছবি')}</span>{seg('pics', PICS.map(([k, l]) => [k, i.L(l)]))}</div>
          <div className="pmk-cats">
            <span className="lbl">{t('Sections', 'ভাগ')}</span>
            {groups.map(({ c }) => <button key={c.id} type="button" className={clsx('tchip', (!ov.cats?.length || ov.cats.includes(c.id)) && 'on')} aria-pressed={!ov.cats?.length || ov.cats.includes(c.id)} onClick={() => toggleCat(c.id)}>{i.L(c)}</button>)}
            <span className="meta">{t('Untick to print, say, a drinks-only menu.', 'শুধু পানীয়ের মেনুর মতো কিছু প্রিন্ট করতে বাকিগুলোর টিক তুলে দিন।')}</span>
          </div>
          <div className="pmk-words">
            <label><span className="lbl">{t('Name at the top', 'ওপরের নাম')}</span><input className="inp" maxLength={40} value={ov.title} placeholder={r.name.en} onChange={e => setWords(w => ({ ...w, title: e.target.value }))} /></label>
            <label><span className="lbl">{t('Line under the name', 'নামের নিচের লাইন')}</span><input className="inp" maxLength={80} value={ov.tag} placeholder={r.tagline?.en || t('Leave empty to hide', 'লুকাতে খালি রাখুন')} onChange={e => setWords(w => ({ ...w, tag: e.target.value }))} /></label>
            <label className="full"><span className="lbl">{t('Your note at the bottom', 'নিচে আপনার কথা')}</span><input className="inp" maxLength={90} value={ov.note} placeholder={t('For example: Free home delivery within 2 km. Call 01700-000000', 'যেমন: ২ কিমির মধ্যে ফ্রি হোম ডেলিভারি। কল করুন ০১৭০০-০০০০০০')} onChange={e => setWords(w => ({ ...w, note: e.target.value }))} /></label>
          </div>
          <details className="pmk-dish" open={open} onToggle={e => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>
              <span><b>{t('Dishes and photos', 'খাবার আর ছবি')}</b><span className="meta">{t(`${shown} of ${r.menu.length} dishes on the paper · ${nPic} with a photo`, `${i.N(r.menu.length)}টির মধ্যে ${i.N(shown)}টি খাবার কাগজে · ${i.N(nPic)}টিতে ছবি`)}</span></span>
              <Ico n="caret-down" sm />
            </summary>
            <p className="meta">{t('Tap a dish to leave it off the paper. The camera chooses whether its photo is used. No photo yet? Tap the plus to add one; it is saved to your menu too.', 'কোনো খাবার কাগজ থেকে বাদ দিতে সেটিতে চাপুন। ক্যামেরা চাপলে ঠিক হয় ছবিটি থাকবে কি না। ছবি নেই? প্লাস চেপে যোগ করুন; এটি আপনার মেনুতেও থেকে যাবে।')}</p>
            {open ? groups.map(({ c, ds }) => (
              <div key={c.id} className="pmk-dg">
                <span className="lbl">{i.L(c)}</span>
                {ds.map(d => {
                  const off = hide.includes(d.id), on = !!d.p && picked(d);
                  return (
                    <div key={d.id} className={clsx('pmk-d', off && 'off')}>
                      <button type="button" className="pmk-dn" aria-pressed={!off} onClick={() => toggleHide(d.id)}><Thumb p={d.p} word={d.name.en} /><span>{i.L(d.name)}</span><em className="num">{i.tk(d.price)}</em></button>
                      <button type="button" className={clsx('pmk-cam', on && 'on', !d.p && 'add')} aria-pressed={on} onClick={() => togglePic(d.id)}
                        title={d.p ? (on ? t('Photo is used', 'ছবিটি আছে') : t('Photo not used', 'ছবিটি নেই')) : t('Add a photo', 'ছবি যোগ করুন')}
                        aria-label={d.p ? (on ? t('Photo is used', 'ছবিটি আছে') : t('Photo not used', 'ছবিটি নেই')) : t('Add a photo', 'ছবি যোগ করুন')}>
                        <Ico n={d.p ? 'camera' : 'plus'} sm />
                      </button>
                    </div>
                  );
                })}
              </div>
            )) : null}
          </details>
          <div ref={bigRef}><Fit w={A4W} cls="pmk-big" prep={fitMenu}><MenuSheet r={r as unknown as PrintRest} o={ov} qr={qr} /></Fit></div>
        </div>
        <div className="pmk-side">
          <h2>{t(`${MENUS.length} designs`, `${i.N(MENUS.length)}টি ডিজাইন`)}</h2>
          <p className="meta pmk-sub">{t('The first six are made for dish photos. Every design can show photos with the Dish photos switch.', 'প্রথম ছয়টি খাবারের ছবির জন্য বানানো। “খাবারের ছবি” থেকে যেকোনো ডিজাইনে ছবি দেখানো যায়।')}</p>
          <div className="pmk-grid">
            {MENUS.map(m => <MenuThumb key={m.id} r={r} m={m} on={view.look === m.id} bn={i.bn} o={{ ...view, look: m.id, qr: false, pics: m.pics || (view.look === m.id ? view.pics : 'none') }} onPick={pick} />)}
          </div>
        </div>
      </div>
    </Page>
  );
}

/** one design in the list, drawn small with the real menu. Drawn again only when its own choices change */
const MenuThumb = memo(function MenuThumb({ r, m, on, bn, o, onPick }: { r: PR; m: (typeof MENUS)[number]; on: boolean; bn: boolean; o: PmOpts; onPick: (m: (typeof MENUS)[number]) => void }) {
  return (
    <button type="button" className={clsx('pmk-t', on && 'on')} aria-pressed={on} onClick={() => onPick(m)}>
      <Fit w={A4W} cls="pmk-th" prep={fitMenu}><MenuSheet r={r as unknown as PrintRest} o={o} /></Fit>
      <b>{bn ? m.name.bn : m.name.en}{on ? <Ico n="check-circle" sm /> : null}</b>
      <span>{bn ? m.note.bn : m.note.en}</span>
    </button>
  );
}, (a, b) => a.r === b.r && a.on === b.on && a.bn === b.bn && JSON.stringify(a.o) === JSON.stringify(b.o));
