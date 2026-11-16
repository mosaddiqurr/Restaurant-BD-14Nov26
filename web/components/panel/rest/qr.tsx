'use client';
/* Table QR (ported from V.qr in website/panel/rest.js).
   Guests scan the card on their table and see the menu in the restaurant's colours. No app needed.
   Every choice shows straight away in the phone preview and the cards below, but nothing is saved until
   "Save changes". Leaving the page with unsaved changes asks first. */
import { useDeferredValue, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { QR_LOOKS, qrLooksFor, QR_FRAMES, type QrLook } from '@/components/qr/qr';
import { C, src } from '@/lib/khabo';
import type { Text } from '@/lib/data/types';
import { clone, type PR, type QrOpts } from '@/lib/panel/store';
import { Page, SwRow, useR, useSaved, useT, Ico } from '../ui';
import { countChanges, useSaveEntry } from '../draft';
import { FramePicker, Framed, palOf, QrSvg, qrStyleFor, Scaled, svgFor, Swatches, tableLink } from '../qr/kit';

type Draft = Required<Pick<QrOpts, 'tables' | 'layout' | 'header' | 'theme' | 'card' | 'frame' | 'look' | 'cpal' | 'qrc' | 'ctext' | 'cbn' | 'tnum'>>;
type Tx = (en: string, bn: string) => string;
type Fo = { d: string; a: string; l: string; t1: string; t2: string };

/* the table card designs. Every design shares the same parts (mark, name, QR, table number, words) laid out differently */
const CARDS: Record<string, Text> = {
  shape: { en: 'Shapes', bn: 'আকার' }, dark: { en: 'Colour', bn: 'রঙিন' }, light: { en: 'Light', bn: 'হালকা' }, tent: { en: 'Table tent', bn: 'ভাঁজ করা কার্ড' },
  frame: { en: 'Scan frame', bn: 'স্ক্যান ফ্রেম' }, number: { en: 'Big letters', bn: 'বড় অক্ষর' }, elegant: { en: 'Fine dining', bn: 'ফাইন ডাইনিং' }, photo: { en: 'Photo', bn: 'ছবি' },
};
/* the table menu choices. The keys (and their order) come from the data; these are their names in both languages */
const LAYOUTS: Record<string, Text> = {
  list: { en: 'List with photos', bn: 'ছবিসহ তালিকা' }, photos: { en: 'Photo grid', bn: 'ছবির গ্রিড' }, cards: { en: 'Big photos', bn: 'বড় ছবি' },
  compact: { en: 'Text only', bn: 'শুধু লেখা' }, classic: { en: 'Classic menu', bn: 'ক্লাসিক মেনু' },
};
const HINTS: Record<string, Text> = {
  list: { en: 'Good for most menus: name, price and a small photo.', bn: 'বেশির ভাগ মেনুর জন্য ভালো: নাম, দাম আর ছোট ছবি।' },
  photos: { en: 'Two photos side by side. Best for cafés and desserts.', bn: 'পাশাপাশি দুটি ছবি। ক্যাফে আর মিষ্টির জন্য সবচেয়ে ভালো।' },
  cards: { en: 'One big photo per dish. Best for short menus with great photos.', bn: 'প্রতিটি খাবারের একটি বড় ছবি। ভালো ছবিসহ ছোট মেনুর জন্য সবচেয়ে ভালো।' },
  compact: { en: 'No photos, loads fastest. Best for long menus.', bn: 'ছবি নেই, সবচেয়ে দ্রুত খোলে। লম্বা মেনুর জন্য সবচেয়ে ভালো।' },
  classic: { en: 'Like a printed menu card: name, dotted line, price. Elegant for fine dining.', bn: 'ছাপা মেনু কার্ডের মতো: নাম, ডট লাইন, দাম। ফাইন ডাইনিংয়ের জন্য মানানসই।' },
};
const HEADERS: Record<string, Text> = { photo: { en: 'Cover photo', bn: 'কভার ছবি' }, colour: { en: 'Your colour', bn: 'আপনার রং' } };
const THEMES: Record<string, Text> = { auto: { en: 'Light', bn: 'হালকা' }, paper: { en: 'Warm paper', bn: 'উষ্ণ কাগজ' }, night: { en: 'Dark', bn: 'গাঢ়' }, brand: { en: 'Your colour', bn: 'আপনার রং' } };
/* what each setting is called in the activity log */
const NAMES: Record<keyof Draft, Text> = {
  layout: { en: 'menu layout', bn: 'মেনুর ধরন' }, header: { en: 'menu top', bn: 'মেনুর ওপরের অংশ' }, theme: { en: 'menu colours', bn: 'মেনুর রং' },
  look: { en: 'QR style', bn: 'কিউআর স্টাইল' }, card: { en: 'card design', bn: 'কার্ডের ডিজাইন' }, frame: { en: 'card shape', bn: 'কার্ডের আকার' },
  cpal: { en: 'card colours', bn: 'কার্ডের রং' }, qrc: { en: 'QR colour', bn: 'কিউআরের রং' }, ctext: { en: 'card words', bn: 'কার্ডের লেখা' },
  cbn: { en: 'Bangla name', bn: 'বাংলা নাম' }, tnum: { en: 'table number', bn: 'টেবিল নম্বর' }, tables: { en: 'number of tables', bn: 'টেবিলের সংখ্যা' },
};

const defaults = (t: Tx): Draft => ({ tables: 12, layout: 'list', header: 'photo', theme: 'auto', card: 'dark', frame: 'banner', look: 'rounded', cpal: '', qrc: 'match', ctext: t('Scan for the menu and prices', 'মেনু আর দাম দেখতে স্ক্যান করুন'), cbn: false, tnum: false });
const baseOf = (r: PR, t: Tx): Draft => {
  const d = { ...defaults(t), ...(r.qr || {}) } as Draft;
  if (!CARDS[d.card]) d.card = 'dark';
  if (!QR_FRAMES.some(f => f.id === d.frame)) d.frame = 'banner';
  return d;
};
const clampN = (v: unknown) => Math.min(60, Math.max(1, Math.round(Number(v)) || 1));

export function TableQr() {
  const { r } = useR();
  const i = useI(), t = useT(), saved = useSaved();
  const base = useMemo(() => baseOf(r, t), [r, t]);
  const [edits, setEdits] = useState<Partial<Draft>>({});
  const [nText, setNText] = useState<string | null>(null);
  const draft: Draft = { ...base, ...edits };
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setEdits(e => ({ ...e, [k]: v }));
  /* the cards follow a moment later while typing, so the words box stays quick */
  const view = useDeferredValue(draft);

  const prevUrl = `/${i.lang}/t/${encodeURIComponent(r.id)}?table=4&tml=${draft.layout}&tmh=${draft.header}&tmt=${draft.theme}&embed=1`;
  const looks = qrLooksFor(r);
  const swOf: Record<string, [string, string]> = { auto: ['#FFFFFF', '#E9ECF5'], paper: ['#F6F0E4', '#E3D5BB'], night: ['#0E1018', '#2A2F40'], brand: [r.theme.deep, r.theme.accent] };

  /** puts the choices into the restaurant's draft; the save bar saves them */
  const save = () => {
    if (!dirty) return true;
    const before = (r.qr || {}) as Partial<Draft>;
    const what = (Object.keys(NAMES) as (keyof Draft)[]).filter(k => before[k] !== draft[k]).map(k => NAMES[k]);
    const nr = clone(r); nr.qr = { ...(r.qr || {}), ...draft };
    const ok = saved(nr,
      { en: `Changed the table QR: ${what.map(x => x.en).join(', ') || 'settings'}`, bn: `টেবিল কিউআর বদলেছেন: ${what.map(x => x.bn).join(', ') || 'সেটিংস'}` },
      { en: 'Saved. Guests see it on their next scan.', bn: 'রাখা হয়েছে। পরের স্ক্যানে অতিথিরা নতুনটা দেখবেন।' });
    if (ok) { setEdits({}); setNText(null); }
    return ok;
  };
  const discard = () => { setEdits({}); setNText(null); };
  const doPrint = () => {
    if (dirty) toast(t('Printing what you see. Save to keep these choices.', 'যা দেখছেন তাই প্রিন্ট হচ্ছে। এই পছন্দগুলো রাখতে সেভ করুন।'));
    setTimeout(() => window.print(), 60);
  };
  useSaveEntry({ count: countChanges(base, draft), save, discard, pri: 0 });

  const seg = <K extends 'header' | 'card' | 'qrc' | 'look'>(k: K, items: [string, string][]) => (
    <div className="seg" role="radiogroup">
      {items.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={draft[k] === v} className={draft[k] === v ? 'on' : ''} onClick={() => set(k, v as Draft[K])}>{l}</button>)}
    </div>
  );

  /* the code for a table, in the card's colours and style */
  const st = useMemo(() => qrStyleFor(r, { pal: view.cpal, qrc: view.qrc, look: view.look }), [r, view.cpal, view.qrc, view.look]);
  const n = clampN(view.tables);
  const th = palOf(r, view.cpal);
  const fo = (k: number): Fo => ({ d: th.deep, a: th.accent, l: view.cpal === 'mono' ? th.deep : th.accent, t1: view.tnum ? `${t('Table', 'টেবিল')} ${i.N(k)}` : r.name.en, t2: view.tnum ? view.ctext || r.name.en : view.ctext });
  const qr1 = svgFor(tableLink(i.lang, r, 1), st);

  return (
    <Page title={t('Table QR', 'টেবিল কিউআর')}
      sub={t('Guests scan the card on their table and see your menu in your colours. No app needed. Try a choice, see it on the right, then save.', 'অতিথিরা টেবিলের কার্ড স্ক্যান করে আপনার রঙে মেনু দেখেন। কোনো অ্যাপ লাগে না। একটা পছন্দ করে ডান পাশে দেখুন, তারপর সেভ করুন।')}
      acts={<>
        <a className="btn" href={tableLink(i.lang, r, 1)} target="_blank" rel="noopener"><Ico n="arrow-up-right" sm />{t('Open table menu', 'টেবিল মেনু খুলুন')}</a>
        <button type="button" className="btn pri" onClick={doPrint}><Ico n="printer" sm />{t('Print cards', 'কার্ড প্রিন্ট')}</button>
      </>}>
      <div className="pq">
      <div className="grid g-main">
        <div className="card">
          <div className="card-h"><h2>{t('Table menu', 'টেবিল মেনু')}</h2><span className="r meta">{t('What guests see after scanning', 'স্ক্যানের পরে অতিথিরা যা দেখেন')}</span></div>
          <div className="card-b stack">
            <div className="field">
              <span className="lbl">{t('Layout', 'সাজানোর ধরন')}</span>
              <div className="lays" role="radiogroup">
                {Object.keys(C.tableMenu.layouts).map(k => (
                  <button key={k} type="button" role="radio" aria-checked={draft.layout === k} className={clsx('lay', draft.layout === k && 'on')} onClick={() => set('layout', k)}>
                    <span className={`lay-ic lay-${k}`} aria-hidden="true"><i /><i /><i /><i /></span><span>{LAYOUTS[k] ? i.L(LAYOUTS[k]) : C.tableMenu.layouts[k]}</span>
                  </button>
                ))}
              </div>
              {HINTS[draft.layout] ? <span className="hint">{i.L(HINTS[draft.layout])}</span> : null}
            </div>
            <div className="field">
              <span className="lbl">{t('Colour theme', 'রঙের ধরন')}</span>
              <div className="tms" role="radiogroup">
                {Object.keys(C.tableMenu.themes).map(k => (
                  <button key={k} type="button" role="radio" aria-checked={draft.theme === k} className={clsx('tm-sw', draft.theme === k && 'on')} onClick={() => set('theme', k)}>
                    <i style={{ '--x': (swOf[k] || swOf.auto)[0], '--y': (swOf[k] || swOf.auto)[1] } as CSSProperties} /><span>{THEMES[k] ? i.L(THEMES[k]) : C.tableMenu.themes[k]}</span>
                  </button>
                ))}
              </div>
              <span className="hint">{t('Light follows the guest’s phone: dark at night if their phone is set that way.', 'হালকা রং অতিথির ফোন মেনে চলে: ফোনে সেটা চালু থাকলে রাতে গাঢ় হয়ে যায়।')}</span>
            </div>
            <div className="field">
              <span className="lbl">{t('Top of the menu', 'মেনুর ওপরের অংশ')}</span>
              {seg('header', Object.keys(C.tableMenu.headers).map(k => [k, HEADERS[k] ? i.L(HEADERS[k]) : C.tableMenu.headers[k]]))}
            </div>
          </div>
        </div>
        <div className="tm-prev">
          <div className="ws-phone static"><Scaled w={390} url={prevUrl} title={t('Table menu preview', 'টেবিল মেনুর প্রিভিউ')} /></div>
          <span className="meta">{t('Live preview, table 4. Scroll inside the phone.', 'লাইভ প্রিভিউ, টেবিল ৪। ফোনের ভেতরে স্ক্রল করুন।')}</span>
        </div>
      </div>

      <div className="card cd-opts" style={{ marginTop: 16 }}>
        <div className="card-h"><h2>{t('Table cards', 'টেবিল কার্ড')}</h2><span className="r meta">{t('What you print and put on each table', 'যা প্রিন্ট করে প্রতিটি টেবিলে রাখবেন')}</span></div>
        <div className="card-b">
          <div className="cd-grid">
            <div className="field full"><span className="lbl">{t('Design', 'ডিজাইন')}</span>{seg('card', Object.keys(CARDS).map(k => [k, i.L(CARDS[k])]))}</div>
            {draft.card === 'shape' ? (
              <FramePicker value={draft.frame} onChange={v => set('frame', v)} o={fo(1)} qr={qr1} label={t('Shape around the code', 'কোডের চারপাশের আকার')}
                hint={t('Your name (or the table number, if it is on) goes in big letters, your words under it. Every shape keeps the code on white so phones read it.', 'আপনার নাম (বা টেবিল নম্বর চালু থাকলে সেটি) বড় অক্ষরে থাকে, নিচে আপনার লেখা। প্রতিটি আকারে কোড সাদার ওপর থাকে, তাই ফোন সহজে পড়তে পারে।')} />
            ) : null}
            <div className="field full"><span className="lbl">{t('Colours', 'রং')}</span><Swatches r={r} value={draft.cpal} onChange={v => set('cpal', v)} /></div>
            <div className="field"><span className="lbl">{t('QR code colour', 'কিউআর কোডের রং')}</span>{seg('qrc', [['match', t('Same as the card', 'কার্ডের মতোই')], ['black', t('Black', 'কালো')]])}</div>
            <div className="field">
              <span className="lbl">{t('QR style', 'কিউআর স্টাইল')}</span>
              {seg('look', looks.map((k: QrLook) => [k, i.L(QR_LOOKS[k])]))}
              {r.brand?.shape ? <span className="hint">{t('Logo shape makes the whole code look like your logo. Phones read it like any QR code.', 'লোগোর আকারে পুরো কোডটা আপনার লোগোর মতো দেখায়। ফোন এটাও সাধারণ কিউআরের মতোই পড়ে।')}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="qr-ct">{t('Words on the card', 'কার্ডের লেখা')}</label>
              <input className="inp" id="qr-ct" maxLength={40} value={draft.ctext} placeholder={t('Leave empty to hide', 'লুকাতে খালি রাখুন')} onChange={e => set('ctext', e.target.value)} />
            </div>
            <div className="field cd-small">
              <div className="field">
                <label htmlFor="qr-n">{t('Number of tables', 'টেবিলের সংখ্যা')}</label>
                <input className="inp num" id="qr-n" type="number" min={1} max={60} inputMode="numeric" value={nText ?? String(draft.tables)}
                  onChange={e => { setNText(e.target.value); if (e.target.value !== '') set('tables', clampN(e.target.value)); }}
                  onBlur={() => setNText(null)} />
              </div>
              <SwRow label={t('Bangla name', 'বাংলা নাম')} on={draft.cbn} onChange={v => set('cbn', v)} />
            </div>
            <div className="field full cd-tsw">
              <SwRow label={t('Show the table number on the card', 'কার্ডে টেবিল নম্বর দেখান')} on={draft.tnum} onChange={v => set('tnum', v)}
                hint={t('Off by default, so every card looks the same. Each code still opens the menu for its own table.', 'শুরুতে বন্ধ থাকে, তাই সব কার্ড একরকম দেখায়। তবু প্রতিটি কোড নিজের টেবিলের মেনুই খোলে।')} />
            </div>
          </div>
        </div>
      </div>

      <div className="sec-t"><h2>{t('Cards to print', 'প্রিন্টের কার্ড')}</h2><span className="meta">{t(`${n} tables`, `${i.N(n)}টি টেবিল`)} · {i.L(CARDS[view.card])}</span></div>
      <div className="qr-print">
        <div className="qr-grid">
          {Array.from({ length: n }, (_, k) => <TableCard key={k} r={r} d={view} n={k + 1} svg={svgFor(tableLink(i.lang, r, k + 1), st)} fo={fo(k + 1)} t={t} N={i.N} />)}
        </div>
      </div>
      </div>

    </Page>
  );
}

/** one printed table card */
function TableCard({ r, d, n, svg, fo, t, N }: { r: PR; d: Draft; n: number; svg: string; fo: Fo; t: Tx; N: (n: number) => string }) {
  const th = palOf(r, d.cpal), k = d.card;
  if (k === 'shape') return <div className="qr-card cd-shape"><Framed id={d.frame} o={fo} qr={svg} /></div>;
  const vars = { '--d': th.deep, '--a': th.accent, '--l': d.cpal === 'mono' ? th.deep : th.accent } as CSSProperties;
  const mark = r.mono || r.name.en.slice(0, 2);
  const mono = <i className="cd-mono">{mark}</i>;
  const nm = <><b className="cd-name">{r.name.en}</b>{d.cbn && r.name.bn ? <em className="cd-bn">{r.name.bn}</em> : null}</>;
  const tx = d.ctext ? <small className="cd-tx">{d.ctext}</small> : null;
  const box = <QrSvg cls="qr-box" svg={svg} />;
  /* the table number is optional (off by default): every design works with or without it */
  const tb = d.tnum ? <span className="cd-t"><em>{t('Table', 'টেবিল')}</em>{N(n)}</span> : null;
  const head = <div className="cd-head">{mono}{nm}</div>;
  const inner: Record<string, ReactNode> = {
    dark: <>{head}{box}{tb}{tx}</>,
    light: <>{head}{box}{tb}{tx}</>,
    tent: <><div className="cd-back">{mono}{nm}{tb}{tx}</div><div className="cd-front">{box}{tb}</div></>,
    frame: <>{head}<div className="cd-fr"><div className="cd-fq">{box}</div><span className="cd-tab">{d.ctext || t('Scan for the menu', 'মেনু দেখতে স্ক্যান করুন')}</span></div>{tb}</>,
    number: d.tnum
      ? <><div className="cd-big"><em>{t('Table', 'টেবিল')}</em><strong>{N(n)}</strong><span>{r.name.en}</span></div><div className="cd-low">{box}{tx}</div></>
      : <><div className="cd-big no-n"><strong>{mark}</strong><span>{r.name.en}</span></div><div className="cd-low">{box}{tx}</div></>,
    elegant: <>{nm}<span className="cd-orn"><i />✦<i /></span>{box}{d.tnum ? <span className="cd-no">{t('Table', 'টেবিল')} <b>{N(n)}</b></span> : null}{tx}</>,
    // eslint-disable-next-line @next/next/no-img-element
    photo: <><div className="cd-ph">{r.hero?.[0] ? <img src={src(r.hero[0], 600)} alt="" /> : null}<div>{nm}</div></div>{box}{tb}{tx}</>,
  };
  return <div className={`qr-card cd-${k}`} style={vars}>{inner[k] || inner.dark}</div>;
}
