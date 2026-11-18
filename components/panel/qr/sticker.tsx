'use client';
/* Door and window stickers (ported from archive/prototype/panel/site.js).
   Nine designs. The look of each lives in styles/panel.css (.st-<id>, from the prototype's sticker.css).
   To add one: a line in STICKERS, a body in Sticker below, a CSS block there.
   The owner's choices are kept in r.promo._stk: { id, pal, qrc, head, line, bn, addr, size, frame } */
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { restFile, src } from '@/lib/khabo';
import type { Text } from '@/lib/data/types';
import { clone, siteAddr, type PR } from '@/lib/panel/store';
import { Drawer, Ico, Seg, SwRow, TextF, useSaved, useT } from '../ui';
import { Fit, FramePicker, Framed, palOf, printWindow, QrSvg, qrStyleFor, realSize, svgFor, Swatches, usePrintFonts } from './kit';
import { toast } from 'sonner';

export type StkOpts = { id: string; pal: string; qrc: string; head: string; line: string; bn: boolean; addr: boolean; size: string; frame: string };
type Tx = (en: string, bn: string) => string;

export const STICKERS: { id: string; name: Text; note: Text }[] = [
  { id: 'classic', name: { en: 'Classic', bn: 'ক্লাসিক' }, note: { en: 'Deep colour, white QR card', bn: 'গাঢ় রং, সাদা কিউআর কার্ড' } },
  { id: 'paper', name: { en: 'Paper', bn: 'কাগজ' }, note: { en: 'Warm paper, quiet and classy', bn: 'উষ্ণ কাগজ, শান্ত আর রুচিশীল' } },
  { id: 'bold', name: { en: 'Bold', bn: 'জোরালো' }, note: { en: 'Big words, easy to see from far', bn: 'বড় লেখা, দূর থেকেও চোখে পড়ে' } },
  { id: 'frame', name: { en: 'Scan frame', bn: 'স্ক্যান ফ্রেম' }, note: { en: 'The QR in a thick frame', bn: 'মোটা ফ্রেমের ভেতরে কিউআর' } },
  { id: 'split', name: { en: 'Photo', bn: 'ছবি' }, note: { en: 'Your photo on top, QR below', bn: 'ওপরে আপনার ছবি, নিচে কিউআর' } },
  { id: 'minimal', name: { en: 'Minimal', bn: 'সাদামাটা' }, note: { en: 'White, a big QR, nothing else', bn: 'সাদা, বড় কিউআর, আর কিছু নয়' } },
  { id: 'arch', name: { en: 'Doorway', bn: 'দরজা' }, note: { en: 'An arch for glass doors', bn: 'কাচের দরজার জন্য খিলান' } },
  { id: 'round', name: { en: 'Round', bn: 'গোল' }, note: { en: 'A circle, words running round', bn: 'গোল, চারপাশে লেখা ঘোরে' } },
  { id: 'shape', name: { en: 'Shapes', bn: 'আকার' }, note: { en: 'Your code inside a shape: a pot, a tea cup, an Eid arch and more', bn: 'আকারের ভেতরে আপনার কোড: হাঁড়ি, চায়ের কাপ, ঈদের খিলান আর আরও অনেক' } },
];
/** paper sizes: name, size, zoom from A5 */
export const STK_SIZES: Record<string, [string, Text, number]> = {
  a6: ['A6', { en: 'Small, 105 × 148 mm', bn: 'ছোট, ১০৫ × ১৪৮ মিমি' }, 0.7071],
  a5: ['A5', { en: 'Standard, 148 × 210 mm', bn: 'সাধারণ, ১৪৮ × ২১০ মিমি' }, 1],
  a4: ['A4', { en: 'Large, 210 × 297 mm', bn: 'বড়, ২১০ × ২৯৭ মিমি' }, 1.4142],
};
const A5W = 559.4; /* 148 mm in CSS pixels */

export function stkDefaults(r: PR, t: Tx): StkOpts {
  const tour = !!r.tour?.length, promo = (r.promo || {}) as { _stk?: Partial<StkOpts>; _sticker?: string };
  return {
    id: 'classic', pal: '', qrc: 'match', bn: true, addr: true, size: 'a5', frame: 'banner',
    head: t('Scan for the menu', 'মেনু দেখতে স্ক্যান করুন'),
    line: t(`Our menu, today’s prices${tour ? ' and a 360° look inside' : ''}.`, `আমাদের মেনু, আজকের দাম${tour ? ' আর ভেতরের ৩৬০° দৃশ্য' : ''}।`),
    ...(promo._stk || (promo._sticker ? { id: promo._sticker } : {})),
  };
}

const phoneIco = <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M176,16H80A24,24,0,0,0,56,40V216a24,24,0,0,0,24,24h96a24,24,0,0,0,24-24V40A24,24,0,0,0,176,16Zm8,200a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h96a8,8,0,0,1,8,8ZM140,60a12,12,0,1,1-12-12A12,12,0,0,1,140,60Z" /></svg>;

/** one sticker at real size (A5). The QR opens the restaurant's website */
export function Sticker({ r, id, o, url, uid }: { r: PR; id: string; o: StkOpts; url: string; uid: string }) {
  const t = useT();
  const th = palOf(r, o.pal), st = qrStyleFor(r, o), qs = svgFor(url, st);
  const q = <QrSvg cls={clsx('st-q', st.shape && 'shape')} svg={qs} />;
  // eslint-disable-next-line @next/next/no-img-element
  const logo = r.brand?.logo && !o.pal ? <img className="st-logo" src={restFile(r.id, r.brand.logo)} alt="" /> : null;
  const mono = <span className="st-mono">{r.mono || r.name.en.slice(0, 2)}</span>;
  const name = <h1 className="st-n">{r.name.en}</h1>;
  const bn = o.bn && r.name.bn && r.name.bn !== r.name.en ? <div className="st-bn">{r.name.bn}</div> : null;
  const head = (o.head || '').trim();
  const line = o.line ? <p className="st-say">{o.line}</p> : null;
  const addr = o.addr ? <div className="st-addr">{siteAddr(r)}</div> : null;
  const by = <div className="st-by">{t('on Khaoya', 'খাওয়া-তে')}</div>;
  const scan = head ? <span className="st-scan">{phoneIco}{head}</span> : null;
  const words = head.split(/\s+/).filter(Boolean), half = Math.ceil(words.length / 2);
  const big = words.length ? <h2 className="st-big">{words.slice(0, half).join(' ')}<span>{words.slice(half).join(' ')}</span></h2> : null;
  const ring = head ? Array(Math.max(1, Math.floor(56 / (head.length + 3)))).fill(head).join(' · ') + ' · ' : '';
  // eslint-disable-next-line @next/next/no-img-element
  const photo = r.hero?.[0] ? <img className="st-ph" src={src(r.hero[0], 1000)} alt="" /> : null;
  const ringId = `st-c-${uid}`;
  const body: Record<string, ReactNode> = {
    classic: <>{logo || name}{bn}{line}{q}{scan}{addr}{by}</>,
    paper: <>{name}{bn}<span className="st-rule" />{q}{scan}{line}{addr}{by}</>,
    bold: <>{big}{q}<div className="st-row">{mono}<div>{name}{addr}</div></div>{by}</>,
    frame: <>{logo || name}{bn}<div className="st-fr">{q}{head ? <span className="st-tab">{phoneIco}{head}</span> : null}</div>{line}{addr}{by}</>,
    split: <><div className="st-top">{photo}<div className="st-top-in">{name}{bn}</div></div><div className="st-bot">{q}<div className="st-bot-t">{scan}{line}{addr}</div></div>{by}</>,
    minimal: <>{head ? <p className="st-head">{head}</p> : null}{q}{name}{addr}{by}</>,
    arch: <><div className="st-in">{logo || name}{bn}{q}{scan}{line}{addr}</div>{by}</>,
    shape: <><div className="st-shp"><Framed id={o.frame} o={{ d: th.deep, a: th.accent, l: o.pal === 'mono' ? th.deep : th.accent, t1: head, t2: r.name.en }} qr={qs} /></div>{bn}{line}{addr}{by}</>,
    round: <>
      <div className="st-disc">
        {ring ? <svg className="st-ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id={ringId} d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0" /></defs><text><textPath href={`#${ringId}`} startOffset="0" textLength="520" lengthAdjust="spacing">{ring}</textPath></text></svg> : null}
        {q}
      </div>
      <div className="st-under">{name}{bn}{addr}</div>{by}
    </>,
  };
  return <div className={`st st-${id}`} style={{ '--d': th.deep, '--a': th.accent } as CSSProperties}>{body[id] || body.classic}</div>;
}

/** pick a design and make it yours: colours, QR colour, the words, the size. The big preview follows every change */
export function StickerDrawer({ r, open, onClose, url }: { r: PR; open: boolean; onClose: () => void; url: string }) {
  const i = useI(), t = useT(), saved = useSaved();
  const [o, setO] = useState<StkOpts>(() => stkDefaults(r, t));
  const bigRef = useRef<HTMLDivElement>(null);
  usePrintFonts();
  /* every time it opens, it starts from the saved choices */
  const [was, setWas] = useState(open);
  if (was !== open) { setWas(open); if (open) setO(stkDefaults(r, t)); }
  const set = <K extends keyof StkOpts>(k: K, v: StkOpts[K]) => setO(x => ({ ...x, [k]: v }));
  const sz = STK_SIZES[o.size] || STK_SIZES.a5;
  const th = palOf(r, o.pal), qs = svgFor(url, qrStyleFor(r, o));
  const cur = STICKERS.find(x => x.id === o.id) || STICKERS[0];

  const keep = () => {
    const nr = clone(r);
    const promo = { ...(nr.promo || {}), _stk: { ...o } } as Record<string, unknown>; delete promo._sticker;
    nr.promo = promo;
    return saved(nr, { en: `Saved the ${cur.name.en} door sticker`, bn: `${cur.name.bn} দরজার স্টিকার রেখেছেন` });
  };
  const doPrint = () => {
    keep();
    const el = bigRef.current?.querySelector('.st');
    printWindow({
      title: `${r.name.en} ${t('sticker', 'স্টিকার')}`, lang: i.lang, body: realSize(el), blocked: t('Allow pop-ups for this page to print.', 'প্রিন্ট করতে এই পেজের পপ-আপ চালু করুন।'),
      css: `.pnl .st{zoom:${sz[2]}}@page{size:${sz[0]};margin:0}@media screen{.pnl .st{margin:24px auto;box-shadow:0 10px 40px rgba(0,0,0,.18)}}`,
      script: `addEventListener('load',function(){(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){setTimeout(function(){print()},350)})})`,
    });
  };
  const sizeLine = `${sz[0]} · ${i.L(sz[1])}. ${t('The QR opens your website.', 'কিউআর আপনার ওয়েবসাইট খোলে।')}`;

  return (
    <Drawer open={open} onClose={onClose} size="xwide" title={t('Door and window stickers', 'দরজা আর জানালার স্টিকার')}
      foot={<>
        <button type="button" className="btn ghost l" onClick={onClose}>{t('Close', 'বন্ধ করুন')}</button>
        <button type="button" className="btn" onClick={() => { if (keep()) { toast(t('Kept. Press Save changes to keep it for next time.', 'রাখা হলো। পরের বারের জন্য রাখতে "বদল রাখুন" চাপুন।')); onClose(); } }}>{t('Keep choices', 'পছন্দ রাখুন')}</button>
        <button type="button" className="btn pri" onClick={doPrint}><Ico n="printer" sm />{t('Print', 'প্রিন্ট')}</button>
      </>}>
      <div className="stk-wrap">
        <div className="stk-left">
          <div ref={bigRef}><Fit w={A5W} cls="stk-big"><Sticker r={r} id={o.id} o={o} url={url} uid="big" /></Fit></div>
          <p className="meta stk-size">{sizeLine}</p>
        </div>
        <div className="stk-opts">
          <div className="field">
            <span className="lbl">{t('Design', 'ডিজাইন')}</span>
            <div className="stk-grid">
              {STICKERS.map(x => (
                <button key={x.id} type="button" className={clsx('stk-t', x.id === o.id && 'on')} title={i.L(x.note)} aria-pressed={x.id === o.id} onClick={() => set('id', x.id)}>
                  <Fit w={A5W} cls="stk-th"><Sticker r={r} id={x.id} o={o} url={url} uid={'t-' + x.id} /></Fit><b>{i.L(x.name)}</b>
                </button>
              ))}
            </div>
          </div>
          {o.id === 'shape' ? <FramePicker value={o.frame} onChange={v => set('frame', v)} label={t('Shape', 'আকার')} qr={qs} o={{ d: th.deep, a: th.accent, l: o.pal === 'mono' ? th.deep : th.accent, t1: o.head, t2: r.name.en }} /> : null}
          <div className="field"><span className="lbl">{t('Colours', 'রং')}</span><Swatches r={r} value={o.pal} onChange={v => set('pal', v)} /></div>
          <div className="field">
            <span className="lbl">{t('QR code colour', 'কিউআর কোডের রং')}</span>
            <Seg cls="sm" value={o.qrc} onChange={v => set('qrc', v)} items={[['match', t('Same as the sticker', 'স্টিকারের মতোই')], ['black', t('Black', 'কালো')]]} />
            <span className="hint">{t('Black scans best if your printer’s colours are pale.', 'প্রিন্টারের রং হালকা হলে কালো কোড সবচেয়ে ভালো স্ক্যান হয়।')}</span>
          </div>
          <div className="f-grid">
            <TextF full label={t('Big words', 'বড় লেখা')} value={o.head} onChange={v => set('head', v)} attr={{ maxLength: 28 }} hint={t('For example: Scan for the menu · মেনু দেখুন', 'যেমন: মেনু দেখুন · Scan for the menu')} />
            <TextF full label={t('Small line', 'ছোট লাইন')} value={o.line} onChange={v => set('line', v)} attr={{ maxLength: 90 }} hint={t('Leave empty to hide it.', 'লুকাতে খালি রাখুন।')} />
          </div>
          <div className="stk-sw">
            <SwRow label={t('Bangla name', 'বাংলা নাম')} on={o.bn} onChange={v => set('bn', v)} />
            <SwRow label={t('Web address', 'ওয়েব ঠিকানা')} on={o.addr} onChange={v => set('addr', v)} />
          </div>
          <div className="field"><span className="lbl">{t('Size', 'মাপ')}</span><Seg cls="sm" value={o.size} onChange={v => set('size', v)} items={Object.entries(STK_SIZES).map(([k, v]) => [k, v[0]] as [string, string])} /></div>
        </div>
      </div>
    </Drawer>
  );
}
