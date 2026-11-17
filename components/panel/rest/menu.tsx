'use client';
/* Menu & prices: change a price and press Enter, mark a dish sold out, drag dishes into order, edit or add a dish,
   rename categories. Ported from archive/prototype/panel/rest.js (V.menu, dishDrawer, catModal) and the React partner
   panel in archive/prototype/app/app.js (PMenu, PriceIn, DishEdit, CatEdit: drag to reorder, area compare). */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useI } from '@/components/providers/i18n';
import { C, areaOf, src, srcSet } from '@/lib/khabo';
import type { DishMedia, Text } from '@/lib/data/types';
import { allR, clone, histOf, priceChange, slugOf, type PDish, type PR } from '@/lib/panel/store';
import { SPICE_N } from '@/lib/panel/words';
import { AreaF, Drawer, Empty, Field, Ico, Modal, MoneyF, Page, Seg, SelF, Sw, SwRow, TextF, Thumb, confirm, pickPhotos, useAgo, useR, useSaved, useT } from '../ui';
import { MenuPhoto } from './menuphoto';
import { PORTIONS, TAGS, TAG_LEN, TAG_MAX, tagsOf } from '@/lib/tags';
import type { DishTag } from '@/lib/data/types';
import { SpecialBox } from './special';

/** the middle price for the same kind of dish nearby: the same area if two or more places have it, else the same city */
function useAreaMid(r: PR) {
  const { db } = useR();
  return useMemo(() => {
    const others = allR(db).filter(x => x.id !== r.id && !x.hidden);
    return (d: PDish) => {
      const pick = (f: (x: PR) => boolean) => others.filter(f).flatMap(x => x.menu.filter(o => o.type === d.type && !o.share).map(o => o.price));
      let pool = pick(x => x.area === r.area), scope: Text = areaOf(r.area);
      if (pool.length < 2) { pool = pick(x => x.city === r.city); scope = C.cities[r.city] || scope; }
      if (!pool.length) return null;
      const s = pool.sort((a, b) => a - b);
      return { mid: s[Math.floor(s.length / 2)], scope };
    };
  }, [db, r.id, r.area, r.city]);
}

export function MenuPage() {
  const i = useI(), t = useT(), { r } = useR(), saved = useSaved();
  const [q, setQ] = useState(''), [cat, setCat] = useState('all');
  const [edit, setEdit] = useState<{ d: PDish | null; cat: string } | null>(null), [cats, setCats] = useState(false), [mp, setMp] = useState(false);
  const mid = useAreaMid(r);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const qq = q.trim().toLowerCase(), cnt = (id: string) => r.menu.filter(d => d.cat === id).length;
  const groups = r.cats.filter(c => cat === 'all' || c.id === cat)
    .map(c => ({ c, ds: r.menu.filter(d => d.cat === c.id && (!qq || (d.name.en + ' ' + d.name.bn).toLowerCase().includes(qq))) }))
    .filter(g => !qq || g.ds.length);
  const toggle = (d: PDish, on: boolean) => {
    const nr = clone(r), x = nr.menu.find(z => z.id === d.id)!;
    if (on) delete x.out; else x.out = true;
    saved(nr, on ? { en: `Unmarked ${d.name.en} sold out`, bn: `${d.name.bn} আবার পাওয়া যাচ্ছে বলে চিহ্নিত` } : { en: `Marked ${d.name.en} as sold out`, bn: `${d.name.bn} শেষ বলে চিহ্নিত` },
      on ? { en: `${d.name.en} is available again.`, bn: `${d.name.bn} আবার পাওয়া যাচ্ছে।` } : { en: `${d.name.en} shows as sold out today.`, bn: `আজ ${d.name.bn} শেষ বলে দেখাচ্ছে।` });
  };
  const moved = (cid: string) => ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const nr = clone(r), inCat = nr.menu.filter(d => d.cat === cid), from = inCat.findIndex(d => d.id === active.id), to = inCat.findIndex(d => d.id === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(inCat, from, to), known = new Set(nr.cats.map(c => c.id)), c = nr.cats.find(z => z.id === cid);
    nr.menu = [...nr.cats.flatMap(z => (z.id === cid ? next : nr.menu.filter(d => d.cat === z.id))), ...nr.menu.filter(d => !known.has(d.cat))];
    const d = next[to];
    saved(nr, { en: `Moved ${d.name.en} in ${c?.en || 'the menu'}`, bn: `${c?.bn || 'মেনু'}-তে ${d.name.bn} সরিয়েছেন` }, { en: `Moved ${d.name.en}. The new order is live on your page.`, bn: `${d.name.bn} সরানো হয়েছে। নতুন ক্রম আপনার পেজে দেখা যাচ্ছে।` });
  };
  return (
    <Page title={t('Menu & prices', 'মেনু ও দাম')}
      sub={t(`${r.menu.length} dishes. Change a price, then press Save changes to put it live. Prices are before VAT ${r.vat}% and service ${r.service}%.`,
        `${i.N(r.menu.length)}টি খাবার। দাম বদলে "বদল রাখুন" চাপুন, তখন পেজে দেখা যাবে। দাম ভ্যাট ${i.N(r.vat)}% আর সার্ভিস ${i.N(r.service)}% ছাড়া।`)}
      acts={<>
        <button className="btn" onClick={() => setMp(true)}><Ico n="camera" sm />{t('Upload menu photo', 'মেনুর ছবি আপলোড')}</button>
        <button className="btn" onClick={() => setCats(true)}><Ico n="sliders-horizontal" sm />{t('Categories', 'ক্যাটাগরি')}</button>
        <button className="btn pri" onClick={() => setEdit({ d: null, cat: cat !== 'all' ? cat : r.cats[0]?.id })}><Ico n="plus" sm />{t('Add dish', 'খাবার যোগ করুন')}</button>
      </>}>
      <SpecialBox />
      <div className="card" style={{ marginBottom: 6 }}>
        <div className="toolbar" style={{ border: 0 }}>
          <div className="search"><Ico n="magnifying-glass" sm /><input className="inp" type="search" placeholder={t('Search your menu', 'আপনার মেনুতে খুঁজুন')} value={q} onChange={e => setQ(e.target.value)} aria-label={t('Search your menu', 'আপনার মেনুতে খুঁজুন')} /></div>
          <div className="fchips">
            {[['all', t('All', 'সব'), r.menu.length] as const, ...r.cats.map(c => [c.id, i.L(c), cnt(c.id)] as const)].map(([id, l, n]) => (
              <button key={id} className={clsx('fchip', cat === id && 'on')} onClick={() => setCat(id)}>{l}<span>{i.N(n)}</span></button>
            ))}
          </div>
        </div>
      </div>
      {groups.length ? groups.map(({ c, ds }) => (
        <section key={c.id} className="mcat">
          <div className="mcat-h"><h3>{i.bn ? c.bn || c.en : c.en}</h3>{i.bn ? null : <span className="meta bn">{c.bn || ''}</span>}<span className="meta">{t(`${ds.length} dish${ds.length === 1 ? '' : 'es'}`, `${i.N(ds.length)}টি খাবার`)}</span>
            <div className="r"><button className="btn sm ghost" onClick={() => setEdit({ d: null, cat: c.id })}><Ico n="plus" sm />{t('Add here', 'এখানে যোগ করুন')}</button></div></div>
          <div className="card">
            {ds.length ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={moved(c.id)}>
                <SortableContext items={ds.map(d => d.id)} strategy={verticalListSortingStrategy}>
                  {ds.map(d => <DishRow key={d.id} r={r} d={d} am={d.share ? 'share' : mid(d)} drag={!qq} onEdit={() => setEdit({ d, cat: d.cat })} onToggle={on => toggle(d, on)} />)}
                </SortableContext>
              </DndContext>
            ) : <Empty icon="fork-knife" title={t('No dishes yet', 'এখনো কোনো খাবার নেই')} style={{ padding: 28 }}>{t(`Add the first dish in ${c.en}.`, `${c.bn || c.en}-তে প্রথম খাবার যোগ করুন।`)}</Empty>}
          </div>
        </section>
      )) : <div className="card"><Empty icon="magnifying-glass" title={t(`No dish matches "${q}"`, `"${q}" নামে কোনো খাবার নেই`)}>{t('Try another name.', 'অন্য নাম দিয়ে খুঁজুন।')}</Empty></div>}
      <DishEdit open={edit} onClose={() => setEdit(null)} />
      <CatEdit open={cats} onClose={() => setCats(false)} />
      <MenuPhoto open={mp} onClose={() => setMp(false)} />
    </Page>
  );
}

function DishRow({ r, d, am, drag, onEdit, onToggle }: { r: PR; d: PDish; am: { mid: number; scope: Text } | null | 'share'; drag: boolean; onEdit: () => void; onToggle: (on: boolean) => void }) {
  const i = useI(), t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: d.id, disabled: !drag });
  const ty = C.types[d.type];
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const hi = am && am !== 'share' && d.price > am.mid * 1.15, lo = am && am !== 'share' && d.price < am.mid * 0.87;
  return (
    <div ref={setNodeRef} style={style} className={clsx('dish dnd', d.out && 'out', isDragging && 'dragging')}>
      <button className="handle" {...attributes} {...listeners} aria-label={t(`Move ${d.name.en}`, `${d.name.bn} সরান`)} disabled={!drag}><Ico n="dots-six-vertical" sm b /></button>
      <Thumb p={d.p} word={d.name.en} />
      <div className="nm">
        <b>{i.bn ? d.name.bn || d.name.en : d.name.en}{tagsOf(d).map(g => <span key={g.id} className={clsx('badge', g.id === 'best' && 'gold')}>{i.L(g)}</span>)}{d.share ? <span className="badge">{t(`For ${d.share}`, `${i.N(d.share)} জনের`)}</span> : null}</b>
        <span className="bn">{i.bn ? d.name.en : d.name.bn}</span>
        <span className="meta" style={{ display: 'block' }}>{i.L(d.por)}{ty ? ' · ' + i.L(ty) : ''}{d.spice ? <> · <span className="spice" aria-label={i.L(SPICE_N[d.spice])}>{Array.from({ length: d.spice }, (_, k) => <Ico key={k} n="pepper" sm f />)}</span></> : null}{d.veg ? ' · ' + t('Veg', 'নিরামিষ') : ''}</span>
      </div>
      <div className="area-r">
        {am === 'share' ? <><b>{t('Shared dish', 'ভাগ করে খাওয়ার খাবার')}</b><em>{t('Not compared with single plates', 'এক প্লেটের সঙ্গে তুলনা হয় না')}</em></>
          : am ? <><b>{t(`${am.scope.en} typical ${i.tk(am.mid)}`, `${am.scope.bn}-তে সাধারণত ${i.tk(am.mid)}`)}</b><em className={hi ? 'hi' : lo ? 'lo' : ''}>{hi ? t('Higher than most', 'বেশিরভাগের চেয়ে বেশি') : lo ? t('Lower than most', 'বেশিরভাগের চেয়ে কম') : t('In line with the area', 'এলাকার সঙ্গে মিল আছে')}</em></>
            : <em>{t('No other place has this yet', 'আর কোথাও এটা এখনো নেই')}</em>}
      </div>
      {/* a dish with portions shows each portion's price; they are changed in the dish editor */}
      {d.sizes?.length ? (
        <button type="button" className="szp" onClick={onEdit} aria-label={t(`Edit portions of ${d.name.en}`, `${d.name.bn}-এর পরিমাণ বদলান`)}>
          {d.sizes.map(z => <span key={z.id}><small>{i.L(z.name)}</small><b className="num">{i.tk(z.price)}</b></span>)}
        </button>
      ) : <PriceIn r={r} d={d} />}
      <label className="avail"><Sw on={!d.out} onChange={onToggle} label={t(`${d.name.en} available today`, `আজ ${d.name.bn} পাওয়া যাচ্ছে`)} /><span>{d.out ? t('Sold out', 'শেষ') : t('Available', 'পাওয়া যাচ্ছে')}</span></label>
      <button className="ibtn" onClick={onEdit} aria-label={t(`Edit ${d.name.en}`, `${d.name.bn} বদলান`)}><Ico n="dots-three" b /></button>
    </div>
  );
}

/** the price box: type a new price and press Enter (or leave the box); it goes into the draft until Save changes */
function PriceIn({ r, d }: { r: PR; d: PDish }) {
  const i = useI(), t = useT(), saved = useSaved();
  const [v, setV] = useState(String(d.price)), [ok, setOk] = useState(0), [was, setWas] = useState(d.price);
  if (was !== d.price) { setWas(d.price); setV(String(d.price)); }
  useEffect(() => { if (!ok) return; const tm = setTimeout(() => setOk(0), 1600); return () => clearTimeout(tm); }, [ok]);
  const commit = () => {
    const nv = Math.round(Number(v));
    if (!nv || nv < 1) { setV(String(d.price)); toast.error(t('Enter a price above zero.', 'শূন্যের বেশি দাম লিখুন।')); return; }
    if (nv === d.price) return;
    const nr = clone(r), x = nr.menu.find(z => z.id === d.id)!, was = x.price;
    priceChange(nr, x, nv);
    if (saved(nr, { en: `Changed ${d.name.en} from ৳${was} to ৳${nv}`, bn: `${d.name.bn}-এর দাম ${i.tk(was)} থেকে ${i.tk(nv)} করেছেন` }, { en: `${d.name.en} is now ${i.tk(nv)} on your page.`, bn: `আপনার পেজে ${d.name.bn} এখন ${i.tk(nv)}।` })) setOk(k => k + 1);
    else setV(String(d.price));
  };
  return (
    <label key={ok} className={clsx('pr-in', ok && 'saved')} data-saved={t('Changed', 'বদলেছে')}>
      <span>৳</span>
      <input type="number" min={1} step={1} inputMode="numeric" value={v} onChange={e => setV(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} aria-label={t(`Price of ${d.name.en}`, `${d.name.bn}-এর দাম`)} />
    </label>
  );
}

/* ---------- add or edit a dish ---------- */
type DF = { en: string; bn: string; price: string; cat: string; type: string; poren: string; porbn: string; share: string; spice: number; veg: boolean; tags: DishTag[];
  desc: string; descbn: string; made: string; madebn: string; ing: string; ingbn: string; side: string; sidebn: string; p: string | null;
  /** every photo and video of the dish in order; p is the main photo */
  media: DishMedia[];
  /** portions, each with its own price; empty means the dish has one price */
  sizes: SzF[] };
type SzF = { id: string; en: string; bn: string; price: string; poren: string; porbn: string };
const toF = (d: PDish | null, cat: string): DF => ({
  en: d?.name.en || '', bn: d?.name.bn || '', price: d ? String(d.price) : '', cat: d?.cat || cat, type: d?.type || 'curry',
  poren: d?.por.en || 'Serves 1', porbn: d?.por.bn || '১ জন', share: d?.share ? String(d.share) : '', spice: d?.spice || 0, veg: !!d?.veg, tags: d ? tagsOf(d) : [],
  desc: d?.desc?.en || '', descbn: d?.desc?.bn || '', made: d?.made?.en || '', madebn: d?.made?.bn || '',
  ing: (d?.ing || []).map(x => x.en).join(', '), ingbn: (d?.ing || []).map(x => x.bn || '').join(', '), side: d?.side?.en || '', sidebn: d?.side?.bn || '', p: d?.p || null,
  media: [...(d?.p ? [{ kind: 'photo' as const, src: d.p }] : []), ...(d?.gallery || []).filter(m => !(m.kind === 'photo' && m.src === d?.p))],
  sizes: (d?.sizes || []).map(z => ({ id: z.id, en: z.name.en, bn: z.name.bn, price: String(z.price), poren: z.por?.en || '', porbn: z.por?.bn || '' })),
});
function DishEdit({ open, onClose }: { open: { d: PDish | null; cat: string } | null; onClose: () => void }) {
  const i = useI(), t = useT(), { r, db } = useR(), saved = useSaved(), ago = useAgo();
  const [f, setF] = useState<DF>(() => toF(null, r.cats[0]?.id || ''));
  const [last, setLast] = useState<{ d: PDish | null; cat: string } | null>(null);
  if (open && open !== last) { setLast(open); setF(toF(open.d, open.cat)); }
  const d = (open || last)?.d || null, isNew = !d;
  const up = <K extends keyof DF>(k: K) => (v: DF[K]) => setF(o => ({ ...o, [k]: v }));
  const hist = d ? histOf(db, r.id, d.id) : [];
  const save = () => {
    /* with portions, the first one is the usual plate: its price is the dish's price, used to compare with other places */
    const szs = f.sizes.filter(z => z.en.trim() || z.bn.trim() || z.price);
    if (szs.some(z => !z.en.trim() && !z.bn.trim())) return toast.error(t('Give every portion a name, like Half or Full.', 'প্রতিটি পরিমাণের একটি নাম দিন, যেমন হাফ বা ফুল।'));
    if (szs.some(z => !(Math.round(Number(z.price)) >= 1))) return toast.error(t('Give every portion a price above zero.', 'প্রতিটি পরিমাণের দাম শূন্যের বেশি দিন।'));
    if (szs.length === 1) return toast.error(t('Add at least two portions, or remove this one so the dish has one price.', 'অন্তত দুটি পরিমাণ দিন, অথবা এটি মুছে দিন যাতে খাবারের একটাই দাম থাকে।'));
    const price = szs.length ? Math.round(Number(szs[0].price)) : Math.round(Number(f.price));
    if (!f.en.trim()) return toast.error(t('Give the dish an English name.', 'খাবারের একটি ইংরেজি নাম দিন।'));
    if (!price || price < 1) return toast.error(t('Enter a price above zero.', 'শূন্যের বেশি দাম লিখুন।'));
    const nr = clone(r);
    let x = d ? nr.menu.find(z => z.id === d.id) : undefined;
    if (!x) { let id = `${r.id.slice(0, 3)}-${slugOf(f.en)}`; while (nr.menu.some(z => z.id === id)) id += '-2'; x = { id, type: f.type, name: { en: '', bn: '' }, price, p: null, por: { en: '', bn: '' }, spice: 0, cat: f.cat }; nr.menu.push(x); }
    if (d && price !== x.price) priceChange(nr, x, price); else x.price = price;
    const two = (en: string, bn: string) => (en.trim() || bn.trim() ? { en: en.trim() || bn.trim(), bn: bn.trim() || en.trim() } : undefined);
    const list = (en: string, bn: string) => { const a = en.split(',').map(s => s.trim()).filter(Boolean), b = bn.split(',').map(s => s.trim()).filter(Boolean); return a.length || b.length ? (a.length ? a : b).map((z, k) => ({ en: a[k] || z, bn: b[k] || a[k] || z })) : undefined; };
    /* the main photo is p; every other photo and video goes into the gallery, in the order shown */
    const photos = f.media.filter(m => m.kind === 'photo'), main = f.p && photos.some(m => m.src === f.p) ? f.p : photos[0]?.src || null;
    const gal = f.media.filter(m => !(m.kind === 'photo' && m.src === main));
    Object.assign(x, { name: { en: f.en.trim(), bn: f.bn.trim() || f.en.trim() }, cat: f.cat, type: f.type, por: { en: f.poren || 'Serves 1', bn: f.porbn || f.poren || '১ জন' }, spice: f.spice, p: main });
    if (gal.length) x.gallery = gal; else delete x.gallery;
    if (szs.length) x.sizes = szs.map((z, k) => {
      const en = z.en.trim() || z.bn.trim(), bn = z.bn.trim() || en;
      const por = z.poren.trim() || z.porbn.trim() ? { en: z.poren.trim() || z.porbn.trim(), bn: z.porbn.trim() || z.poren.trim() } : undefined;
      return { id: z.id || slugOf(en) || 's' + k, name: { en, bn }, price: Math.round(Number(z.price)), ...(por ? { por } : {}) };
    }); else delete x.sizes;
    if (f.veg) x.veg = true; else delete x.veg;
    /* Best seller stays d.best (lists and search rank by it); the other tags go in d.tags */
    if (f.tags.some(z => z.id === 'best')) x.best = true; else delete x.best;
    const tg = f.tags.filter(z => z.id !== 'best'); if (tg.length) x.tags = tg; else delete x.tags;
    const sh = Number(f.share); if (sh >= 2) x.share = sh; else delete x.share;
    const extra = { desc: two(f.desc, f.descbn), made: two(f.made, f.madebn), ing: list(f.ing, f.ingbn), side: two(f.side, f.sidebn) } as const;
    (Object.keys(extra) as (keyof typeof extra)[]).forEach(k => { const v = extra[k]; if (v) (x as Record<string, unknown>)[k] = v; else delete (x as Record<string, unknown>)[k]; });
    const nm = x.name;
    if (saved(nr, isNew ? { en: `Added ${nm.en}`, bn: `${nm.bn} যোগ করেছেন` } : { en: `Edited ${nm.en}`, bn: `${nm.bn} বদলেছেন` },
      isNew ? { en: `${nm.en} was added to your menu.`, bn: `${nm.bn} আপনার মেনুতে যোগ হয়েছে।` } : { en: `${nm.en} was updated.`, bn: `${nm.bn} বদলানো হয়েছে।` })) onClose();
  };
  const remove = async () => {
    if (!d) return;
    if (!await confirm({ title: t(`Delete ${d.name.en}?`, `${d.name.bn} মুছে ফেলবেন?`), text: t('It disappears from your menu, the Dishes page and search. This cannot be undone.', 'এটা আপনার মেনু, খাবারের পেজ আর খোঁজ থেকে চলে যাবে। আর ফেরানো যাবে না।'), ok: t('Delete dish', 'খাবার মুছুন'), danger: true })) return;
    const nr = clone(r); nr.menu = nr.menu.filter(z => z.id !== d.id); nr.signature = (nr.signature || []).filter(z => z !== d.id);
    if (saved(nr, { en: `Deleted ${d.name.en}`, bn: `${d.name.bn} মুছে ফেলেছেন` }, { en: `${d.name.en} was removed from your menu.`, bn: `${d.name.bn} আপনার মেনু থেকে সরানো হয়েছে।` })) onClose();
  };
  const ty = C.types[f.type];
  return (
    <Drawer open={!!open} onClose={onClose} title={isNew ? t('Add a dish', 'খাবার যোগ করুন') : t('Edit dish', 'খাবার বদলান')}
      foot={<>{isNew ? null : <button className="btn danger l" onClick={remove}><Ico n="trash" sm />{t('Delete', 'মুছুন')}</button>}
        <button className={clsx('btn ghost', isNew && 'l')} onClick={onClose}>{t('Cancel', 'বাতিল')}</button>
        <button className="btn pri" onClick={save}>{isNew ? t('Add dish', 'খাবার যোগ করুন') : t('Done', 'ঠিক আছে')}</button></>}>
      <DishMediaEd media={f.media} main={f.p} onChange={(media, p) => setF(o => ({ ...o, media, p }))} />
      <div className="f-grid">
        <TextF label={t('Name (English)', 'নাম (ইংরেজি)')} value={f.en} onChange={up('en')} req ph="e.g. Mutton Kacchi" />
        <TextF label={t('Name (Bangla)', 'নাম (বাংলা)')} value={f.bn} onChange={up('bn')} bn ph="যেমন মাটন কাচ্চি" />
        {f.sizes.length ? null : <MoneyF label={t('Price', 'দাম')} value={f.price} onChange={up('price')} hint={t(`Before VAT ${r.vat}% and service ${r.service}%`, `ভ্যাট ${i.N(r.vat)}% আর সার্ভিস ${i.N(r.service)}% ছাড়া`)} />}
        <SelF label={t('Category', 'ক্যাটাগরি')} value={f.cat} onChange={up('cat')} opts={r.cats.map(c => [c.id, i.L(c)])} />
        <PorPick en={f.poren} onPick={p => setF(o => ({ ...o, poren: p.en, porbn: p.bn }))} />
        <TextF label={t('Portion (English)', 'পরিমাণ (ইংরেজি)')} value={f.poren} onChange={up('poren')} ph="Serves 1 · 2 pcs" hint={t('Tap one above, or type your own', 'ওপরে একটি চাপুন, অথবা নিজে লিখুন')} />
        <TextF label={t('Portion (Bangla)', 'পরিমাণ (বাংলা)')} value={f.porbn} onChange={up('porbn')} bn />
        <SelF label={t('Kind of dish', 'খাবারের ধরন')} value={f.type} onChange={up('type')} opts={Object.entries(C.types).map(([k, v]) => [k, i.L(v)])} hint={t('Used for search and the Dishes page', 'খোঁজ আর খাবারের পেজে কাজে লাগে')} />
        <TextF label={t('Shared by (people)', 'কতজন ভাগ করে খাবেন')} value={f.share} onChange={up('share')} type="number" ph={t('Leave empty for one person', 'একজনের হলে খালি রাখুন')} attr={{ min: 2, max: 20 }} />
      </div>
      <SizesEd sizes={f.sizes} price={f.price} onChange={sizes => setF(o => ({ ...o, sizes }))} />
      <Field label={t('Spice', 'ঝাল')}>
        <Seg value={f.spice} onChange={up('spice')} items={SPICE_N.map((l, k) => [k, <span key={k} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{k ? <span className="spice">{Array.from({ length: k }, (_, j) => <Ico key={j} n="pepper" sm f />)}</span> : null}{i.L(l)}</span>])} />
      </Field>
      <div className="card" style={{ padding: '0 16px' }}>
        <SwRow label={t('Vegetarian', 'নিরামিষ')} on={f.veg} onChange={up('veg')} />
      </div>
      <TagsEd tags={f.tags} onChange={up('tags')} />
      <p className="dw-sub">{t('Description', 'বিবরণ')}</p>
      <div className="f-grid">
        <AreaF label={t('Short description (English)', 'ছোট বিবরণ (ইংরেজি)')} value={f.desc} onChange={up('desc')} rows={2} />
        <AreaF label={t('Short description (Bangla)', 'ছোট বিবরণ (বাংলা)')} value={f.descbn} onChange={up('descbn')} rows={2} bn />
      </div>
      <p className="dw-sub">{t('About this dish', 'এই খাবার সম্পর্কে')}</p>
      <p className="meta" style={{ marginTop: -10 }}>{t(`Shown under "About this dish". Leave empty to use khabo's general text for ${ty?.en || 'this kind of dish'}.`, `"এই খাবার সম্পর্কে" অংশে দেখায়। খালি রাখলে ${ty?.bn || 'এই ধরনের খাবার'}-এর জন্য খাবোর সাধারণ লেখা দেখাবে।`)}</p>
      <div className="f-grid">
        <AreaF label={t('How it is made (English)', 'কীভাবে রান্না হয় (ইংরেজি)')} value={f.made} onChange={up('made')} rows={2} />
        <AreaF label={t('How it is made (Bangla)', 'কীভাবে রান্না হয় (বাংলা)')} value={f.madebn} onChange={up('madebn')} rows={2} bn />
        <TextF label={t('Main ingredients (English)', 'মূল উপকরণ (ইংরেজি)')} value={f.ing} onChange={up('ing')} ph="Mutton, Basmati rice, Ghee" hint={t('Separate with commas', 'কমা দিয়ে আলাদা করুন')} />
        <TextF label={t('Main ingredients (Bangla)', 'মূল উপকরণ (বাংলা)')} value={f.ingbn} onChange={up('ingbn')} bn ph="মাটন, বাসমতি চাল, ঘি" />
        <TextF label={t('Served with (English)', 'সঙ্গে যা থাকে (ইংরেজি)')} value={f.side} onChange={up('side')} ph="Borhani and salad" />
        <TextF label={t('Served with (Bangla)', 'সঙ্গে যা থাকে (বাংলা)')} value={f.sidebn} onChange={up('sidebn')} bn />
      </div>
      {hist.length ? <>
        <p className="dw-sub">{t('Price history', 'দামের ইতিহাস')}</p>
        <div className="hist">{hist.slice().reverse().map((h, k) => <div key={k}><span className="num" style={{ fontWeight: 700 }}>{i.tk(h.v)}</span><span className="meta">{h.who === 'Before' ? t('Before changes', 'বদলের আগে') : `${h.who} · ${ago(h.at)}`}</span></div>)}</div>
      </> : null}
    </Drawer>
  );
}

/* ---------- quick portions: tap one to fill both portion boxes ---------- */
function PorPick({ en, onPick }: { en: string; onPick: (p: { en: string; bn: string }) => void }) {
  const i = useI(), t = useT();
  return (
    <Field label={t('Portion', 'পরিমাণ')} full>
      <div className="tchips">
        {PORTIONS.map(p => <button key={p.en} type="button" className={clsx('tchip sm', en.trim() === p.en && 'on')} aria-pressed={en.trim() === p.en} onClick={() => onPick(p)}>{i.L(p)}</button>)}
      </div>
    </Field>
  );
}

/* ---------- tags: ready-made ones to tap, or the owner's own words; up to TAG_MAX ---------- */
function TagsEd({ tags, onChange }: { tags: DishTag[]; onChange: (t: DishTag[]) => void }) {
  const i = useI(), t = useT();
  const [en, setEn] = useState(''), [bn, setBn] = useState('');
  const has = (id: string) => tags.some(z => z.id === id);
  const full = () => { toast.error(t(`Up to ${TAG_MAX} tags on a dish. A few say more than many.`, `একটি খাবারে সর্বোচ্চ ${i.N(TAG_MAX)}টি ট্যাগ। কম ট্যাগই বেশি চোখে পড়ে।`)); };
  const flip = (g: DishTag) => {
    if (has(g.id)) return onChange(tags.filter(z => z.id !== g.id));
    if (tags.length >= TAG_MAX) return full();
    onChange([...tags, g]);
  };
  const own = tags.filter(z => !TAGS.some(p => p.id === z.id));
  const add = () => {
    const e = en.trim(), b = bn.trim();
    if (!e && !b) return toast.error(t('Type the tag first.', 'আগে ট্যাগটি লিখুন।'));
    if (tags.length >= TAG_MAX) return full();
    const name = e || b;
    if (tags.some(z => z.en.toLowerCase() === name.toLowerCase())) return toast.error(t('This dish already has that tag.', 'এই খাবারে এই ট্যাগ আগেই আছে।'));
    onChange([...tags, { id: 'own-' + (slugOf(name) || Date.now().toString(36)), en: name, bn: b || e }]);
    setEn(''); setBn('');
  };
  return (
    <div className="tged">
      <p className="dw-sub">{t('Tags', 'ট্যাগ')}</p>
      <p className="meta" style={{ marginTop: -10 }}>{t(`Short labels next to the dish name, on your menu, Today's special and your table QR menu. Up to ${TAG_MAX}.`, `খাবারের নামের পাশে ছোট লেখা: আপনার মেনু, আজকের স্পেশাল আর টেবিলের কিউআর মেনুতে। সর্বোচ্চ ${i.N(TAG_MAX)}টি।`)}</p>
      <div className="tchips">
        {TAGS.map(g => <button key={g.id} type="button" className={clsx('tchip sm', has(g.id) && 'on')} aria-pressed={has(g.id)} onClick={() => flip(g)}>{has(g.id) ? <Ico n="check" sm /> : null}{i.L(g)}</button>)}
        {own.map(g => <button key={g.id} type="button" className="tchip sm on" onClick={() => flip(g)} aria-label={t(`Remove tag ${g.en}`, `${g.bn} ট্যাগ সরান`)}>{i.L(g)}<Ico n="x" sm /></button>)}
      </div>
      <div className="tged-own">
        <TextF label={t('Your own tag (English)', 'নিজের ট্যাগ (ইংরেজি)')} value={en} onChange={setEn} ph="e.g. Ramadan only" attr={{ maxLength: TAG_LEN }} />
        <TextF label={t('Your own tag (Bangla)', 'নিজের ট্যাগ (বাংলা)')} value={bn} onChange={setBn} bn ph="যেমন শুধু রমজানে" attr={{ maxLength: TAG_LEN }} />
        <button type="button" className="btn ghost sm" onClick={add}><Ico n="plus" sm />{t('Add tag', 'ট্যাগ যোগ করুন')}</button>
      </div>
    </div>
  );
}

/* ---------- portions: Half / Full, Small / Medium / Large, each with its own price ---------- */
const PRESETS: { en: string; bn: string; list: [string, string][] }[] = [
  { en: 'Full and Half', bn: 'ফুল আর হাফ', list: [['Full', 'ফুল'], ['Half', 'হাফ']] },
  { en: 'Regular, Small, Large', bn: 'রেগুলার, ছোট, বড়', list: [['Regular', 'রেগুলার'], ['Small', 'ছোট'], ['Large', 'বড়']] },
  { en: '1 person, 2 people', bn: '১ জন, ২ জন', list: [['1 person', '১ জন'], ['2 people', '২ জন']] },
];
function SizesEd({ sizes, price, onChange }: { sizes: SzF[]; price: string; onChange: (s: SzF[]) => void }) {
  const t = useT();
  const blank = (en = '', bn = '', p = ''): SzF => ({ id: '', en, bn, price: p, poren: '', porbn: '' });
  const set = (k: number, o: Partial<SzF>) => onChange(sizes.map((z, j) => (j === k ? { ...z, ...o } : z)));
  return (
    <div className="szed">
      <p className="dw-sub">{t('Portions', 'পরিমাণ')}</p>
      <p className="meta" style={{ marginTop: -10 }}>{sizes.length
        ? t('Each portion has its own price. Diners pick one before adding it to their bill. Put your usual plate first: its price is compared with other places.', 'প্রতিটি পরিমাণের আলাদা দাম। খাবার বিলে যোগ করার আগে ক্রেতা একটি বেছে নেন। আপনার সাধারণ প্লেটটি প্রথমে দিন: এর দাম অন্য জায়গার সঙ্গে তুলনা হয়।')
        : t('Sell this dish in more than one size, like Half and Full? Add portions here.', 'এই খাবার কি একাধিক পরিমাণে বিক্রি হয়, যেমন হাফ আর ফুল? এখানে যোগ করুন।')}</p>
      {sizes.map((z, k) => (
        <div key={k} className="szed-r">
          <TextF label={t('Portion (English)', 'পরিমাণ (ইংরেজি)')} value={z.en} onChange={v => set(k, { en: v })} ph="Half" />
          <TextF label={t('Portion (Bangla)', 'পরিমাণ (বাংলা)')} value={z.bn} onChange={v => set(k, { bn: v })} bn ph="হাফ" />
          <MoneyF label={t('Price', 'দাম')} value={z.price} onChange={v => set(k, { price: v })} />
          <TextF label={t('Serves (English)', 'কতজন (ইংরেজি)')} value={z.poren} onChange={v => set(k, { poren: v })} ph={t('Optional, e.g. Serves 1', 'না দিলেও চলে')} />
          <TextF label={t('Serves (Bangla)', 'কতজন (বাংলা)')} value={z.porbn} onChange={v => set(k, { porbn: v })} bn ph="১ জন" />
          <button type="button" className="ibtn szed-x" onClick={() => onChange(sizes.filter((_, j) => j !== k))} aria-label={t(`Remove portion ${z.en || k + 1}`, `পরিমাণ ${z.bn || k + 1} মুছুন`)}><Ico n="trash" sm /></button>
        </div>
      ))}
      <div className="szed-a">
        {sizes.length ? null : PRESETS.map(p => (
          <button key={p.en} type="button" className="btn ghost sm" onClick={() => onChange(p.list.map(([en, bn], k) => blank(en, bn, k === 0 ? price : '')))}>
            <Ico n="plus" sm />{t(p.en, p.bn)}
          </button>
        ))}
        <button type="button" className="btn ghost sm" onClick={() => onChange([...sizes, ...(sizes.length ? [blank()] : [blank('', '', price), blank()])])}>
          <Ico n="plus" sm />{t('Add a portion', 'পরিমাণ যোগ করুন')}
        </button>
      </div>
    </div>
  );
}

/* ---------- categories: rename, move, add, remove (only empty ones) ---------- */
function CatEdit({ open, onClose }: { open: boolean; onClose: () => void }) {
  const i = useI(), t = useT(), { r } = useR(), saved = useSaved();
  const [rows, setRows] = useState(r.cats.map(c => ({ ...c })));
  const [was, setWas] = useState(false);
  if (open && !was) { setWas(true); setRows(r.cats.map(c => ({ ...c }))); }
  if (!open && was) setWas(false);
  const mv = (k: number, by: number) => setRows(a => { const b = a.slice(), j = k + by; if (j < 0 || j >= b.length) return a; [b[k], b[j]] = [b[j], b[k]]; return b; });
  const save = () => {
    const out = rows.filter(x => x.en.trim() || x.bn.trim());
    if (!out.length) return toast.error(t('Keep at least one category.', 'অন্তত একটি ক্যাটাগরি রাখুন।'));
    const nr = clone(r);
    nr.cats = out.map(x => ({ id: x.id || slugOf(x.en || x.bn) + '-' + Date.now().toString(36).slice(-3), en: x.en.trim() || x.bn.trim(), bn: x.bn.trim() || x.en.trim() }));
    if (saved(nr, { en: 'Updated menu categories', bn: 'মেনুর ক্যাটাগরি বদলেছেন' })) onClose();
  };
  return (
    <Modal open={open} onClose={onClose} size="wide" title={t('Menu categories', 'মেনুর ক্যাটাগরি')}
      foot={<><button className="btn ghost l" onClick={onClose}>{t('Cancel', 'বাতিল')}</button><button className="btn pri" onClick={save}>{t('Done', 'ঠিক আছে')}</button></>}>
      <p className="meta">{t('The sections of your menu, in the order diners see them. A category with dishes in it cannot be removed.', 'আপনার মেনুর অংশগুলো, ডাইনাররা যে ক্রমে দেখেন। যে ক্যাটাগরিতে খাবার আছে, সেটা সরানো যায় না।')}</p>
      <div className="stack" style={{ gap: 10 }}>
        {rows.map((c, k) => {
          const used = !!c.id && r.menu.some(d => d.cat === c.id);
          return (
            <div key={k} className="catrow">
              <input className="inp" value={c.en} onChange={e => setRows(a => a.map((z, j) => (j === k ? { ...z, en: e.target.value } : z)))} aria-label={t('English name', 'ইংরেজি নাম')} placeholder="English" />
              <input className="inp bn" value={c.bn} onChange={e => setRows(a => a.map((z, j) => (j === k ? { ...z, bn: e.target.value } : z)))} aria-label={t('Bangla name', 'বাংলা নাম')} placeholder="বাংলা" />
              <span className="catrow-b">
                <button type="button" className="ibtn sm" onClick={() => mv(k, -1)} disabled={k === 0} aria-label={t('Move up', 'ওপরে নিন')}><Ico n="arrow-up" sm /></button>
                <button type="button" className="ibtn sm" onClick={() => mv(k, 1)} disabled={k === rows.length - 1} aria-label={t('Move down', 'নিচে নিন')}><Ico n="arrow-down" sm /></button>
                <button type="button" className="ibtn sm" disabled={used || rows.length < 2} title={used ? t('Move or delete its dishes first', 'আগে এর খাবারগুলো সরান বা মুছুন') : undefined}
                  onClick={() => setRows(a => a.filter((_, j) => j !== k))} aria-label={t('Remove category', 'ক্যাটাগরি সরান')}><Ico n="trash" sm /></button>
              </span>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn sm" style={{ justifySelf: 'start' }} onClick={() => setRows(a => [...a, { id: '', en: '', bn: '' }])}><Ico n="plus" sm />{t('Add category', 'ক্যাটাগরি যোগ করুন')}</button>
      <span className="sr">{i.lang}</span>
    </Modal>
  );
}

/* ---------- a dish's photos and videos: add several, put them in order, pick the main photo, remove ---------- */
const pickVideos = () => new Promise<DishMedia[]>(res => {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'video/*'; inp.multiple = true;
  /* demo only: a video stays in this browser tab (an object URL). The real build uploads it to storage */
  inp.onchange = () => res(Array.from(inp.files || []).filter(f => /^video\//.test(f.type)).map(f => ({ kind: 'video' as const, src: URL.createObjectURL(f) })));
  inp.click();
});
function DishMediaEd({ media, main, onChange }: { media: DishMedia[]; main: string | null; onChange: (media: DishMedia[], main: string | null) => void }) {
  const i = useI(), t = useT();
  const firstPhoto = (l: DishMedia[]) => l.find(m => m.kind === 'photo')?.src || null;
  const set = (l: DishMedia[], p = main) => onChange(l, p && l.some(m => m.kind === 'photo' && m.src === p) ? p : firstPhoto(l));
  const mv = (k: number, by: number) => { const l = media.slice(), j = k + by; if (j < 0 || j >= l.length) return; [l[k], l[j]] = [l[j], l[k]]; set(l); };
  const del = (k: number) => { const m = media[k]; if (m.kind === 'video' && m.src.startsWith('blob:')) URL.revokeObjectURL(m.src); set(media.filter((_, j) => j !== k)); };
  /* the main photo also moves to the front, where diners see it first */
  const makeMain = (k: number) => { const m = media[k]; set([m, ...media.filter((_, j) => j !== k)], m.src); };
  const addPhotos = async () => {
    const ps = await pickPhotos(true); if (!ps.length) return;
    const l = [...media, ...ps.slice(0, Math.max(0, 12 - media.length)).map(p => ({ kind: 'photo' as const, src: p }))];
    set(l, main || firstPhoto(l));
  };
  const addVideos = async () => {
    const vs = await pickVideos(); if (!vs.length) return;
    set([...media, ...vs.slice(0, Math.max(0, 12 - media.length))]);
    toast(t('Video added. In this demo it is kept only while this tab is open.', 'ভিডিও যোগ হয়েছে। এই ডেমোতে ট্যাব খোলা থাকা পর্যন্তই এটা থাকে।'));
  };
  const nP = media.filter(m => m.kind === 'photo').length, nV = media.length - nP;
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div><b>{t('Photos and videos', 'ছবি আর ভিডিও')}</b>
        <p className="meta">{t(`Real photos of the real plate. The star marks the main photo, shown first everywhere. ${nP} photo${nP === 1 ? '' : 's'}, ${nV} video${nV === 1 ? '' : 's'}.`, `আসল প্লেটের আসল ছবি। তারা চিহ্নিত ছবিটি প্রধান ছবি, সব জায়গায় আগে দেখায়। ${i.N(nP)}টি ছবি, ${i.N(nV)}টি ভিডিও।`)}</p></div>
      {media.length ? (
        <div className="dm-grid">
          {media.map((m, k) => {
            const isMain = m.kind === 'photo' && m.src === main;
            return (
              <div key={m.src.slice(0, 80) + k} className="pcell dm-cell">
                {m.kind === 'video'
                  ? <video src={m.src} poster={m.poster ? src(m.poster, 240) : undefined} muted playsInline preload="metadata" aria-label={t(`Video ${k + 1}`, `ভিডিও ${i.N(k + 1)}`)} />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={src(m.src, 240)} srcSet={srcSet(m.src, 120)} sizes="120px" alt="" loading="lazy" decoding="async" />}
                {isMain ? <span className="pc-n main">{t('Main', 'প্রধান')}</span> : m.kind === 'video' ? <span className="pc-n"><Ico n="video-camera" sm />{t('Video', 'ভিডিও')}</span> : null}
                <div className="pc-tools">
                  {m.kind === 'photo'
                    ? <button type="button" className={clsx(isMain && 'on')} onClick={() => makeMain(k)} aria-pressed={isMain} aria-label={t('Make this the main photo', 'এটিকে প্রধান ছবি করুন')} title={t('Main photo', 'প্রধান ছবি')}><Ico n="star" sm f={isMain} /></button>
                    : <span />}
                  <button type="button" onClick={() => mv(k, -1)} disabled={k === 0} aria-label={t('Move earlier', 'আগে নিন')}><Ico n="arrow-left" sm /></button>
                  <button type="button" onClick={() => mv(k, 1)} disabled={k === media.length - 1} aria-label={t('Move later', 'পরে নিন')}><Ico n="arrow-right" sm /></button>
                  <button type="button" className="del" onClick={() => del(k)} aria-label={t('Remove', 'সরান')}><Ico n="x" sm /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="dm-acts">
        <button type="button" className="btn sm" onClick={addPhotos} disabled={media.length >= 12}><Ico n="camera" sm />{t('Add photos', 'ছবি যোগ করুন')}</button>
        <button type="button" className="btn sm" onClick={addVideos} disabled={media.length >= 12}><Ico n="video-camera" sm />{t('Add videos', 'ভিডিও যোগ করুন')}</button>
      </div>
      <p className="meta">{t('Photos are made smaller (up to 1200 pixels) so they load fast. Videos: in this demo they stay only while this tab is open; the real site will keep them online. Up to 12 in all.', 'ছবি ছোট করা হয় (১২০০ পিক্সেল পর্যন্ত), যাতে দ্রুত খোলে। ভিডিও: এই ডেমোতে ট্যাব খোলা থাকা পর্যন্তই থাকে; আসল সাইটে অনলাইনে রাখা হবে। সব মিলিয়ে ১২টি পর্যন্ত।')}</p>
    </div>
  );
}
