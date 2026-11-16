'use client';
/* Menu from a photo (RD-6, ported from website/panel/menuphoto.js).
   The owner or the khabo team uploads photos of the paper menu. The AI reads dishes, prices and categories into a draft.
   A person checks the draft and confirms. For an update, only the changes are shown, each with a tick box.
   Nothing goes live without a person confirming. Every price change goes into price history with who confirmed it.

   PROTOTYPE: there is no AI call here. "Reading" returns a ready-made draft built from the restaurant's own menu
   (one price up, one price unreadable, one new dish, one dish gone), and the sample photo is drawn from that draft.
   At go-live the photos go to a server function that sends them to Claude (docs/2-product/27-new-features-brief.md). */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { C } from '@/lib/khabo';
import { clone, priceChange, type PDish, type PR } from '@/lib/panel/store';
import { Ico, Modal, pickPhotos, useR, useSaved, useT } from '../ui';
import '@/styles/panel-qr.css';

type Row = { cat: string; en: string; bn: string; price: number | null; por: string; unclear?: boolean };
type Change = { kind: 'price'; d: PDish; x: Row; keep: boolean } | { kind: 'new'; x: Row; keep: boolean } | { kind: 'gone'; d: PDish; keep: boolean };
type Step = 'pick' | 'read' | 'draft' | 'changes';

const norm = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s: string) => norm(s).replace(/ /g, '-') || 'dish';

/* ---------- the ready-made draft (stands in for the AI result) ---------- */
const NEW_MENU: [string, string, string, number | null, string][] = [
  ['Rice', 'Mutton Kacchi', 'মাটন কাচ্চি', 380, 'Serves 1'], ['Rice', 'Chicken Biryani', 'চিকেন বিরিয়ানি', 260, 'Serves 1'], ['Rice', 'Beef Tehari', 'বিফ তেহারি', 220, 'Serves 1'],
  ['Kebab', 'Chicken Tikka', 'চিকেন টিক্কা', 200, '4 pieces'], ['Kebab', 'Beef Chap', 'বিফ চাপ', null, '1 piece'], ['Drinks', 'Borhani', 'বোরহানি', 70, '1 glass'], ['Drinks', 'Lassi', 'লাচ্চি', 90, '1 glass'],
];
function draftFor(r: PR): Row[] {
  if (!r.menu.length) return NEW_MENU.map(([cat, en, bn, price, por]) => ({ cat, en, bn, price, por, unclear: price == null }));
  const catName = (d: PDish) => (r.cats.find(c => c.id === d.cat) || r.cats[0] || { en: 'Menu' }).en;
  const rows: Row[] = r.menu.map(d => ({ cat: catName(d), en: d.name.en, bn: d.name.bn, price: d.price, por: d.por?.en || '' }));
  const bi = Math.max(0, r.menu.findIndex(d => d.best));
  rows[bi].price = (rows[bi].price || 0) + ((rows[bi].price || 0) >= 1000 ? 100 : 40);       /* the printed menu has a newer price */
  const ui = rows.findIndex((_, k) => k !== bi && k >= 2); if (ui >= 0) { rows[ui].price = null; rows[ui].unclear = true; } /* a smudged price */
  if (rows.length > 4) rows.pop();                                                              /* a dish no longer on paper */
  const extra = ([['Beef Tehari', 'বিফ তেহারি', 280], ['Chicken Roast', 'চিকেন রোস্ট', 240], ['Mango Lassi', 'আমের লাচ্চি', 140]] as const).find(([en]) => !r.menu.some(d => norm(d.name.en) === norm(en)));
  if (extra) rows.splice(1, 0, { cat: rows[0].cat, en: extra[0], bn: extra[1], price: extra[2], por: 'Serves 1' });
  return rows;
}

/* ---------- a sample photo of the paper menu, drawn from the draft (no made-up food images) ---------- */
function paperPhoto(r: PR, rows: Row[], page: number, pages: number) {
  const c = document.createElement('canvas'), W = 900, H = 1200; c.width = W; c.height = H; const g = c.getContext('2d')!;
  const bnFont = getComputedStyle(document.documentElement).getPropertyValue('--font-bangla').trim() || '"Noto Sans Bengali", sans-serif';
  const deep = r.theme?.deep || '#2A0C14';
  g.fillStyle = '#2B2622'; g.fillRect(0, 0, W, H);                                   /* the table it lies on */
  g.save(); g.translate(W / 2, H / 2); g.rotate((page % 2 ? 1 : -1) * 0.018); g.translate(-W / 2, -H / 2);
  g.fillStyle = '#F6EFDF'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 30; g.fillRect(60, 50, W - 120, H - 100); g.shadowBlur = 0;
  g.strokeStyle = deep; g.lineWidth = 3; g.strokeRect(84, 74, W - 168, H - 148);
  g.fillStyle = deep; g.textAlign = 'center';
  g.font = '700 46px Georgia, serif'; g.fillText(r.name.en || 'Menu', W / 2, 160);
  g.font = `28px ${bnFont}`; g.fillText(r.name.bn || '', W / 2, 205);
  g.font = '20px Georgia, serif'; g.fillText(`Page ${page + 1} of ${pages}`, W / 2, H - 100);
  let y = 270, cat: string | null = null;
  rows.forEach(x => {
    if (x.cat !== cat) { cat = x.cat; y += 18; g.textAlign = 'left'; g.font = 'italic 700 30px Georgia, serif'; g.fillStyle = deep; g.fillText(cat, 120, y); y += 46; }
    g.textAlign = 'left'; g.fillStyle = '#2A2320'; g.font = '26px Georgia, serif'; g.fillText(x.en, 120, y);
    const nameW = g.measureText(x.en).width;
    g.font = `20px ${bnFont}`; g.fillStyle = '#5A4E44'; g.fillText(x.bn || '', 120, y + 28);
    g.strokeStyle = 'rgba(42,35,32,.35)'; g.setLineDash([2, 6]); g.beginPath(); g.moveTo(120 + nameW + 20, y - 6); g.lineTo(W - 230, y - 6); g.stroke(); g.setLineDash([]);
    g.textAlign = 'right'; g.font = '700 28px Georgia, serif'; g.fillStyle = '#2A2320';
    if (x.price != null) g.fillText('Tk ' + x.price, W - 120, y);
    else { g.fillText('Tk 3', W - 160, y); g.fillStyle = 'rgba(70,55,40,.55)'; g.beginPath(); g.ellipse(W - 140, y - 10, 34, 18, -0.3, 0, Math.PI * 2); g.fill(); } /* a smudge */
    y += 74;
  });
  g.restore();
  return c.toDataURL('image/jpeg', 0.86);
}

/* ---------- what changes against the live menu ---------- */
function diff(r: PR, rows: Row[]): Change[] {
  const live = new Map(r.menu.map(d => [norm(d.name.en), d])), seen = new Set<PDish>(), out: Change[] = [];
  rows.forEach(x => {
    const d = live.get(norm(x.en));
    if (d) { seen.add(d); if (x.price != null && x.price !== d.price) out.push({ kind: 'price', d, x, keep: true }); }
    else out.push({ kind: 'new', x, keep: true });
  });
  r.menu.forEach(d => { if (!seen.has(d)) out.push({ kind: 'gone', d, keep: true }); });
  return out;
}
const guessType = (en: string) => {
  const n = norm(en);
  const hit = Object.keys(C.types).find(k => n.includes(k) || n.includes(norm(C.types[k].en).split(' ')[0]));
  return hit || (/(lassi|borhani|juice|shake)/.test(n) ? 'drink' : /(tea|coffee|cha)/.test(n) ? 'tea' : 'curry');
};
const catFor = (r: PR, name: string) => {
  let c = r.cats.find(z => norm(z.en) === norm(name));
  if (!c) { c = { id: slug(name) + '-' + Date.now().toString(36).slice(-3), en: name, bn: name }; r.cats.push(c); }
  return c.id;
};
const newDish = (r: PR, x: Row): PDish => ({
  id: slug(x.en) + '-' + Math.random().toString(36).slice(2, 6), type: guessType(x.en), name: { en: x.en, bn: x.bn || x.en }, price: Math.round(x.price || 0), p: null,
  por: { en: x.por || 'Serves 1', bn: x.por || '১ জন' }, spice: 0, cat: catFor(r, x.cat),
});

/** "Upload menu photo": pick photos, reading, the draft, the changes, confirm. Opened from the Menu page */
export function MenuPhoto({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { r, me } = useR();
  const i = useI(), t = useT(), saved = useSaved();
  const [photos, setPhotos] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [step, setStep] = useState<Step>('pick');
  const [page, setPage] = useState(0);
  const [changes, setChanges] = useState<Change[]>([]);
  const timer = useRef(0);
  const isNew = !r.menu.length;
  /* every time it opens, it starts fresh */
  const [was, setWas] = useState(open);
  if (was !== open) { setWas(open); if (open) { setPhotos([]); setRows(null); setStep('pick'); setPage(0); setChanges([]); } }
  useEffect(() => () => clearTimeout(timer.current), [open]);

  const bad = (rows || []).filter(x => x.price == null).length;
  const sample = () => {
    const d = draftFor(r), half = Math.ceil(d.length / 2);
    const parts = d.length > 6 ? [d.slice(0, half), d.slice(half)] : [d];
    setPhotos(parts.map((part, k) => paperPhoto(r, part, k, parts.length))); setRows(d);
  };
  const add = async () => { const got = await pickPhotos(true); setPhotos(p => p.concat(got || []).slice(0, 6)); };
  const read = () => {
    setStep('read'); setRows(x => x || draftFor(r)); setPage(0);
    timer.current = window.setTimeout(() => setStep('draft'), 1800);
  };
  const edit = (k: number, key: keyof Row, v: string) => setRows(rs => (rs || []).map((x, j) => {
    if (j !== k) return x;
    if (key === 'price') { const n = v === '' ? null : Number(v); return { ...x, price: n != null && n > 0 ? n : null }; }
    return { ...x, [key]: v };
  }));

  const apply = () => {
    if (!rows) return;
    const nr = clone(r), who = me?.name || 'Someone';
    if (isNew) {
      rows.forEach(x => nr.menu.push(newDish(nr, x)));
      const ok = saved(nr, { en: `Added ${rows.length} dishes from a menu photo (checked by ${who})`, bn: `মেনুর ছবি থেকে ${i.N(rows.length)}টি খাবার যোগ করেছেন (দেখে নিয়েছেন ${who})` },
        { en: `${rows.length} dishes are on your menu.`, bn: `${i.N(rows.length)}টি খাবার মেনুতে যোগ হয়েছে।` });
      if (ok) onClose();
      return;
    }
    const keep = changes.filter(c => c.keep); let p = 0, a = 0, g = 0;
    keep.forEach(c => {
      if (c.kind === 'price') { const d = nr.menu.find(z => z.id === c.d.id); if (d) { priceChange(nr, d, Math.round(c.x.price || d.price)); p++; } }   /* kept in price history with who confirmed it */
      if (c.kind === 'new') { nr.menu.push(newDish(nr, c.x)); a++; }
      if (c.kind === 'gone') { const k = nr.menu.findIndex(z => z.id === c.d.id); if (k >= 0) nr.menu.splice(k, 1); g++; }
    });
    const en = [p && `${p} price change${p > 1 ? 's' : ''}`, a && `${a} new`, g && `${g} removed`].filter(Boolean).join(', ');
    const bn = [p && `${i.N(p)}টি দাম বদল`, a && `${i.N(a)}টি নতুন`, g && `${i.N(g)}টি বাদ`].filter(Boolean).join(', ');
    const ok = saved(nr, { en: `Menu photo update: ${en} (checked by ${who})`, bn: `মেনুর ছবি থেকে হালনাগাদ: ${bn} (দেখে নিয়েছেন ${who})` },
      { en: `${keep.length} change${keep.length > 1 ? 's are' : ' is'} live on your page.`, bn: `${i.N(keep.length)}টি পরিবর্তন আপনার পেজে লাইভ।` });
    if (ok) onClose();
  };

  const viewer = (
    <div className="mp-view">
      <div className="mp-pages">{photos.map((_, k) => <button key={k} type="button" className={k === page ? 'on' : ''} onClick={() => setPage(k)}>{t('Page', 'পাতা')} {i.N(k + 1)}</button>)}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photos[page] ? <img src={photos[page]} alt={`${t('Menu page', 'মেনুর পাতা')} ${i.N(page + 1)}`} /> : null}
    </div>
  );
  const warn = bad
    ? <span className="mp-warn"><Ico n="warning" sm />{t(`${bad} price${bad > 1 ? 's' : ''} could not be read. Fix them in the marigold boxes.`, `${i.N(bad)}টি দাম পড়া যায়নি। হলুদ ঘরে ঠিক করুন।`)}</span>
    : <span className="mp-ok"><Ico n="check-circle" sm />{t('Every price is filled in', 'সব দাম দেওয়া আছে')}</span>;
  const nKeep = changes.filter(c => c.keep).length;

  let body: ReactNode, foot: ReactNode = null;
  if (step === 'pick') {
    body = (
      <div className="mp">
        <p className="mp-lead">{t('Take a clear photo of every page of the paper menu. You will check everything before it goes live.', 'কাগজের মেনুর প্রতিটি পাতার পরিষ্কার ছবি তুলুন। লাইভ হওয়ার আগে সব আপনি দেখে নেবেন।')}</p>
        <div className="mp-drop">
          <button type="button" className="btn pri" onClick={add}><Ico n="camera" sm />{t('Add menu photos', 'মেনুর ছবি দিন')}</button>
          <button type="button" className="btn" onClick={sample}><Ico n="image" sm />{t('Use the sample menu photo', 'নমুনা মেনুর ছবি নিন')}</button>
          <span className="meta">{t('JPG or PNG, up to 6 pages', 'JPG বা PNG, ৬ পাতা পর্যন্ত')}</span>
        </div>
        {photos.length ? (
          <div className="mp-thumbs">
            {photos.map((p, k) => (
              <figure key={k}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={`${t('Menu page', 'মেনুর পাতা')} ${i.N(k + 1)}`} />
                <figcaption>{t('Page', 'পাতা')} {i.N(k + 1)}</figcaption>
                <button type="button" className="ibtn sm" aria-label={t('Remove', 'বাদ দিন')} onClick={() => setPhotos(ps => ps.filter((_, j) => j !== k))}><Ico n="x" sm /></button>
              </figure>
            ))}
          </div>
        ) : null}
        <p className="mp-note"><Ico n="info" sm />{t('Prototype: reading uses a ready-made draft, not a real AI call.', 'প্রোটোটাইপ: পড়ার কাজে আগে থেকে তৈরি একটি খসড়া দেখানো হয়, আসল এআই নয়।')}</p>
      </div>
    );
    foot = <>
      <button type="button" className="btn ghost l" onClick={onClose}>{t('Cancel', 'বাতিল')}</button>
      <button type="button" className="btn pri" disabled={!photos.length} onClick={read}><Ico n="sparkle" sm />{t('Read the menu', 'মেনু পড়ুন')}</button>
    </>;
  } else if (step === 'read') {
    const msg = t('Reading the menu', 'মেনু পড়া হচ্ছে');
    body = (
      <div className="mp mp-reading" role="status">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="mp-scan">{photos[0] ? <img src={photos[0]} alt="" /> : null}<i /></div>
        <p className="t-shimmer" data-text={msg}>{msg}</p>
        <p className="meta">{t(`${photos.length} photo${photos.length > 1 ? 's' : ''}: dishes, prices and categories`, `${i.N(photos.length)}টি ছবি: খাবার, দাম আর ক্যাটাগরি`)}</p>
      </div>
    );
  } else if (step === 'draft' && rows) {
    body = (
      <div className="mp-split">
        {viewer}
        <div className="mp-draft">
          <div className="mp-dh"><b>{t(`Draft: ${rows.length} dishes`, `খসড়া: ${i.N(rows.length)}টি খাবার`)}</b>{warn}</div>
          <div className="mp-head"><span>{t('Category', 'ক্যাটাগরি')}</span><span>{t('Name (English)', 'নাম (ইংরেজি)')}</span><span>{t('Name (Bangla)', 'নাম (বাংলা)')}</span><span>{t('Price', 'দাম')}</span><span>{t('Portion', 'পরিমাণ')}</span></div>
          {rows.map((x, k) => (
            <div key={k} className={clsx('mp-row', x.price == null && 'unclear')}>
              <input className="inp" data-k="cat" value={x.cat} aria-label={t('Category', 'ক্যাটাগরি')} onChange={e => edit(k, 'cat', e.target.value)} />
              <input className="inp" data-k="en" value={x.en} aria-label={t('Name (English)', 'নাম (ইংরেজি)')} onChange={e => edit(k, 'en', e.target.value)} />
              <input className="inp bn" data-k="bn" value={x.bn} aria-label={t('Name (Bangla)', 'নাম (বাংলা)')} onChange={e => edit(k, 'bn', e.target.value)} />
              <label className="mp-price"><span>৳</span><input className="inp num" data-k="price" type="number" min={1} inputMode="numeric" value={x.price == null ? '' : x.price} placeholder={t('Not readable', 'পড়া যায়নি')} aria-label={t('Price', 'দাম')} onChange={e => edit(k, 'price', e.target.value)} /></label>
              <input className="inp" data-k="por" value={x.por} aria-label={t('Portion', 'পরিমাণ')} onChange={e => edit(k, 'por', e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    );
    foot = <>
      <button type="button" className="btn ghost l" onClick={() => setStep('pick')}>{t('Back', 'পেছনে')}</button>
      {isNew
        ? <button type="button" className="btn pri" disabled={!!bad} onClick={apply}><Ico n="check" sm />{t(`Confirm and save ${rows.length} dishes`, `নিশ্চিত করে ${i.N(rows.length)}টি খাবার রাখুন`)}</button>
        : <button type="button" className="btn pri" disabled={!!bad} onClick={() => { setChanges(diff(r, rows)); setStep('changes'); }}>{t('See the changes', 'পরিবর্তন দেখুন')}<Ico n="arrow-right" sm /></button>}
    </>;
  } else {
    const line = (c: Change, j: number) => {
      const what = c.kind === 'price'
        ? <><b>{i.L(c.d.name)}</b> <span className="mp-was">{i.tk(c.d.price)}</span> <Ico n="arrow-right" sm /> <b className="num">{i.tk(c.x.price || 0)}</b></>
        : c.kind === 'new'
          ? <><span className="mp-tag new">{t('New', 'নতুন')}</span><b>{i.bn ? c.x.bn || c.x.en : c.x.en}</b> <span className="meta">{c.x.cat}</span> <b className="num">{i.tk(c.x.price || 0)}</b></>
          : <><span className="mp-tag gone">{t('Gone', 'বাদ')}</span><b>{i.L(c.d.name)}</b> <span className="meta">{t('not on the new paper menu', 'নতুন কাগজের মেনুতে নেই')}</span></>;
      return <label key={j} className="mp-ch"><input type="checkbox" checked={c.keep} onChange={e => setChanges(cs => cs.map((z, q) => (q === j ? { ...z, keep: e.target.checked } : z)))} /><span>{what}</span></label>;
    };
    const groups: [Change['kind'], string][] = [['price', t('Price changed', 'দাম বদলেছে')], ['new', t('New dishes', 'নতুন খাবার')], ['gone', t('Removed dishes', 'বাদ পড়া খাবার')]];
    body = (
      <div className="mp-split">
        {viewer}
        <div className="mp-draft">
          <div className="mp-dh">
            <b>{changes.length ? t(`${changes.length} change${changes.length > 1 ? 's' : ''} from your live menu`, `লাইভ মেনু থেকে ${i.N(changes.length)}টি পরিবর্তন`) : t('No changes: the paper menu matches your live menu.', 'কোনো পরিবর্তন নেই: কাগজের মেনু আর লাইভ মেনু একই।')}</b>
            <span className="meta">{t('Untick anything you do not want to change.', 'যা বদলাতে চান না তার টিক তুলে দিন।')}</span>
          </div>
          {groups.map(([k, l]) => {
            const list = changes.map((c, j) => [c, j] as const).filter(([c]) => c.kind === k);
            return list.length ? <div key={k} style={{ display: 'contents' }}><p className="mp-sub">{l}</p>{list.map(([c, j]) => line(c, j))}</div> : null;
          })}
        </div>
      </div>
    );
    foot = <>
      <button type="button" className="btn ghost l" onClick={() => setStep('draft')}>{t('Back to the draft', 'খসড়ায় ফিরুন')}</button>
      <button type="button" className="btn pri" disabled={!nKeep} onClick={apply}><Ico n="check" sm />{t(`Confirm ${nKeep} change${nKeep === 1 ? '' : 's'}`, `${i.N(nKeep)}টি পরিবর্তন নিশ্চিত করুন`)}</button>
    </>;
  }

  return <Modal open={open} onClose={onClose} size="xwide" title={t('Menu from a photo', 'ছবি থেকে মেনু')} foot={foot}><div className="mp-box">{body}</div></Modal>;
}
