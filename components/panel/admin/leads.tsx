'use client';
/* Leads: restaurants the sales team is talking to. Board (drag a card to the next stage) or list.
   Each lead keeps a follow-up date and a short history of notes, so nobody forgets to call back.
   Ported from archive/prototype/panel/admin.js (V.leads, leadDrawer). Dragging uses dnd-kit. */
import { useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { useI } from '@/components/providers/i18n';
import { C, areaOf } from '@/lib/khabo';
import type { Plan } from '@/lib/data/types';
import { getR, initials, logIn, mutate, type PanelDB } from '@/lib/panel/store';
import { daysTo, isoDay, leadFix, okPhone, STAGES, stageOf, telOf, todayIso, type LeadX, type Stage } from '@/lib/panel/admin';
import { PLANS } from '@/lib/panel/words';
import { Drawer, Empty, Ico, Page, SelF, TextF, confirm, useAgo, usePanel, useT } from '../ui';
import { AddRestaurant, useA, useKeep, useNow, type AddPre } from './parts';

/** the leads with their dates and notes filled in (copies: nothing is saved by looking) */
const leadsOf = (db: PanelDB): LeadX[] => db.leads.map(l => leadFix(JSON.parse(JSON.stringify(l))));

/* ---------- saving ---------- */
function moveLead(id: string, k: Stage, who: string) {
  const s = stageOf(k).l;
  return mutate(db => {
    const l = db.leads.find(x => x.id === id); if (!l) return false;
    const y = leadFix(l); if (y.stage === k) return false;
    y.stage = k; y.upd = Date.now();
    y.hist.unshift({ at: y.upd, who, what: `Moved to ${s.en}`, bn: `“${s.bn}” ধাপে নেওয়া হয়েছে` });
    logIn(db, null, { en: `Moved lead ${y.name} to ${s.en}`, bn: `লিড ${y.name}-কে “${s.bn}” ধাপে নিয়েছেন` });
    return true;
  });
}

/* ---------- one card on the board ---------- */
function Card({ x, onMove, onConvert, lift, ghost }: {
  x: LeadX; onMove?: (d: number) => void; onConvert?: () => void; lift?: boolean; ghost?: boolean;
}) {
  const i = useI(), t = useT(), ago = useAgo(), a = useA(), { db } = usePanel();
  const st = stageOf(x.stage), last = x.hist[0], tel = telOf(x.phone);
  const stop = (e: MouseEvent) => e.stopPropagation();
  return (
    <article className={clsx('ld', lift && 'lift', ghost && 'ghost')} style={{ '--c': st.c } as CSSProperties}>
      <div className="ld-top"><span className="ld-av">{initials(x.name)}</span><div><b>{x.name}</b><span className="meta">{i.L(areaOf(x.area))}{x.person ? ` · ${x.person}` : ''}</span></div></div>
      {x.plan && PLANS[x.plan as Plan] ? <span className="ld-plan"><Ico n="sparkle" sm />{t(`Interested in ${PLANS[x.plan as Plan].name.en}`, `${PLANS[x.plan as Plan].name.bn}-এ আগ্রহী`)}</span> : null}
      {last ? <p>{i.bn ? last.bn || last.what : last.what}</p> : null}
      <NextChip x={x} />
      <div className="ld-f">
        <span className="meta" title={t('Last updated', 'শেষ বদল')}>{x.upd ? ago(x.upd) : ''}</span>
        <span className="ld-acts" onClick={stop} onPointerDown={e => e.stopPropagation()}>
          {tel ? <>
            <a className="ibtn sm" href={`tel:${tel}`} aria-label={t(`Call ${x.person || x.name}`, `${x.person || x.name}-কে ফোন করুন`)} title={t('Call', 'ফোন')}><Ico n="phone" sm /></a>
            <a className="ibtn sm" href={`https://wa.me/${tel.replace('+', '')}`} target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp"><Ico n="whatsapp-logo" sm /></a>
          </> : null}
          {x.stage !== STAGES[0].k && onMove ? <button type="button" className="ibtn sm" onClick={() => onMove(-1)} aria-label={t('Move back a stage', 'এক ধাপ পেছনে নিন')} title={t('Move back', 'পেছনে')}><Ico n="caret-left" sm /></button> : null}
          {x.stage !== 'won' && onMove ? <button type="button" className="ibtn sm" onClick={() => onMove(1)} aria-label={t('Move to the next stage', 'পরের ধাপে নিন')} title={t('Next stage', 'পরের ধাপ')}><Ico n="caret-right" sm /></button> : null}
        </span>
      </div>
      {x.stage === 'won' ? (x.rid && getR(db, x.rid)
        ? <Link className="btn sm ghost ld-cta" href={a(`r/${x.rid}`)} onClick={stop} onPointerDown={e => e.stopPropagation()}><Ico n="storefront" sm />{t('Open restaurant', 'রেস্টুরেন্ট খুলুন')}</Link>
        : onConvert ? <button type="button" className="btn sm gold ld-cta" onClick={e => { stop(e); onConvert(); }} onPointerDown={e => e.stopPropagation()}><Ico n="plus" sm />{t('Add to khabo', 'খাবোতে যোগ করুন')}</button> : null) : null}
    </article>
  );
}
/** when to call back: overdue in red, today in amber, later in grey */
function NextChip({ x, none }: { x: LeadX; none?: boolean }) {
  const i = useI(), t = useT();
  if (!x.next || x.stage === 'won') return none ? <span className="meta">{t('None set', 'ঠিক করা নেই')}</span> : null;
  const d = daysTo(x.next);
  const day = new Date(x.next + 'T00:00').toLocaleDateString(i.bn ? 'bn-BD' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const [cls, txt] = d < 0
    ? ['bad', d === -1 ? t('Call back was due yesterday', 'গতকাল ফোন করার কথা ছিল') : t(`Call back was due ${-d} days ago`, `${i.N(-d)} দিন আগে ফোন করার কথা ছিল`)]
    : d === 0 ? ['warn', t('Call back today', 'আজ ফোন করুন')]
      : ['', d === 1 ? t('Call back tomorrow', 'কাল ফোন করুন') : t(`Call back ${day}`, `ফোন করুন ${day}`)];
  return <span className={clsx('ld-next', cls)}><Ico n="calendar-blank" sm />{txt}</span>;
}

function DragCard({ x, open, move, convert }: { x: LeadX; open: () => void; move: (d: number) => void; convert: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: x.id });
  const t = useT();
  const key = (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); open(); } };
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} role="button" tabIndex={0} aria-roledescription={t('lead card, drag to another stage', 'লিড কার্ড, অন্য ধাপে টেনে নিন')}
      aria-label={t(`${x.name}, open details`, `${x.name}, বিস্তারিত খুলুন`)} onClick={open} onKeyDown={key} style={{ outline: 'none' }}>
      <Card x={x} onMove={move} onConvert={convert} ghost={isDragging} />
    </div>
  );
}
function Column({ k, children, n, empty }: { k: Stage; children: React.ReactNode; n: number; empty: string }) {
  const i = useI(), { setNodeRef, isOver } = useDroppable({ id: k });
  const st = stageOf(k);
  return (
    <section ref={setNodeRef} className={clsx('ld-col', isOver && 'over')} style={{ '--c': st.c } as CSSProperties} aria-label={i.L(st.l)}>
      <header><i />{i.L(st.l)}<span>{i.N(n)}</span></header>
      <div className="ld-list">{n ? children : <p className="ld-empty">{empty}</p>}</div>
    </section>
  );
}
/* the column under the pointer wins; when the pointer is between columns, the one the card overlaps most */
const collide: CollisionDetection = args => { const p = pointerWithin(args); return p.length ? p : rectIntersection(args); };

export function Leads() {
  const i = useI(), t = useT(), ago = useAgo(), { db, me } = usePanel();
  const [q, setQ] = useKeep('ld.q', '');
  const [city, setCity] = useKeep('ld.city', 'all');
  const [view, setView] = useKeep<'board' | 'list'>('ld.view', 'board');
  /* the drawer and the add box keep what they show while they slide away; a new key each time they open */
  const [sel, setSel] = useState<{ id: string | null; n: number; on: boolean }>({ id: null, n: 0, on: false });
  const setOpen = (o: { id: string | null } | null) => setSel(p => (o ? { id: o.id, n: p.n + 1, on: true } : { ...p, on: false }));
  const [conv, setConvS] = useState<{ pre: AddPre | null; n: number; on: boolean }>({ pre: null, n: 0, on: false });
  const setConv = (pre: AddPre | null) => setConvS(p => (pre ? { pre, n: p.n + 1, on: true } : { ...p, on: false }));
  const [drag, setDrag] = useState<string | null>(null);
  const justDragged = useRef(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );
  const all = leadsOf(db), openL = all.filter(x => x.stage !== 'won'), today = todayIso();
  const due = openL.filter(x => x.next && x.next <= today).length, won = all.filter(x => x.stage === 'won').length;
  const now = useNow(), fresh7 = all.filter(x => now - x.at < 7 * 864e5).length;
  const qq = q.trim().toLowerCase();
  const ls = all.filter(x => (city === 'all' || areaOf(x.area).city === city)
    && (!qq || [x.name, x.person, areaOf(x.area).en, areaOf(x.area).bn, x.note, x.phone, ...x.hist.map(h => h.what)].join(' ').toLowerCase().includes(qq)));
  const byNext = (a: LeadX, b: LeadX) => ((a.next || '9') < (b.next || '9') ? -1 : (a.next || '9') > (b.next || '9') ? 1 : 0);

  const setStage = (x: LeadX, k: Stage) => {
    if (!moveLead(x.id, k, me.name)) return;
    if (k === 'won') toast.success(t(`${x.name} signed. Add them to khabo when you are ready.`, `${x.name} যুক্ত হয়েছে। প্রস্তুত হলে খাবোতে যোগ করুন।`));
  };
  const move = (x: LeadX, d: number) => { const k = STAGES.findIndex(s => s.k === x.stage) + d; if (STAGES[k]) setStage(x, STAGES[k].k); };
  const convert = (x: LeadX) => setConv({ name: x.name, area: x.area, phone: x.phone, person: x.person, lead: x.id });
  const show = (id: string) => { if (!justDragged.current) setOpen({ id }); };
  const onStart = (e: DragStartEvent) => setDrag(String(e.active.id));
  const onEnd = (e: DragEndEvent) => {
    setDrag(null); justDragged.current = true; setTimeout(() => { justDragged.current = false; }, 250); /* the click after a drop does not open the card */
    const x = all.find(l => l.id === e.active.id), k = e.over?.id as Stage | undefined;
    if (x && k && k !== x.stage) setStage(x, k);
  };
  const dragged = drag ? all.find(x => x.id === drag) : undefined;
  const stat = (k: string, v: string, d: string, cls = '') => <div className={clsx('ld-stat', cls)}><span>{k}</span><b className="num">{v}</b><small>{d}</small></div>;

  return (
    <Page title={t('Leads', 'লিড')} sub={t('Restaurants the team is talking to. Drag a card to the next stage as the talk moves on.', 'যেসব রেস্টুরেন্টের সঙ্গে টিম কথা বলছে। আলোচনা এগোলে কার্ডটি পরের ধাপে টেনে নিন।')}
      acts={<button type="button" className="btn pri" onClick={() => setOpen({ id: null })}><Ico n="plus" sm />{t('Add lead', 'লিড যোগ করুন')}</button>}>
      <div className="ld-stats">
        {stat(t('In talks', 'আলোচনায়'), i.N(openL.length), t(`${fresh7} new this week`, `এই সপ্তাহে ${i.N(fresh7)}টি নতুন`))}
        {stat(t('Call back today', 'আজ ফোন করুন'), i.N(due), due ? t('Including overdue', 'সময় পার হওয়াগুলোসহ') : t('All caught up', 'সব ঠিকঠাক'), due ? 'due' : '')}
        {stat(t('Signed', 'যুক্ত হয়েছে'), i.N(won), t('Joined khabo', 'খাবোতে এসেছে'))}
        {stat(t('Signed out of all', 'মোটের মধ্যে যুক্ত'), `${i.N(all.length ? Math.round((won / all.length) * 100) : 0)}%`, t(`${won} of ${all.length} leads`, `${i.N(all.length)}টি লিডের ${i.N(won)}টি`))}
      </div>
      <div className="ld-bar">
        <label className="search"><span className="sr">{t('Search leads', 'লিড খুঁজুন')}</span><Ico n="magnifying-glass" sm />
          <input className="inp sm" type="search" placeholder={t('Search name, person, area or note', 'নাম, মানুষ, এলাকা বা নোট খুঁজুন')} value={q} onChange={e => setQ(e.target.value)} /></label>
        <div className="seg sm" role="radiogroup" aria-label={t('City', 'শহর')}>
          {[['all', t('All cities', 'সব শহর')], ...Object.keys(C.cities).map(k => [k, i.L(C.cities[k])])].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={city === k} className={city === k ? 'on' : ''} onClick={() => setCity(k)}>{l}</button>)}
        </div>
        <div className="seg sm" role="radiogroup" aria-label={t('View', 'দেখার ধরন')}>
          <button type="button" role="radio" aria-checked={view === 'board'} className={view === 'board' ? 'on' : ''} onClick={() => setView('board')}><Ico n="squares-four" sm />{t('Board', 'বোর্ড')}</button>
          <button type="button" role="radio" aria-checked={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><Ico n="list" sm />{t('List', 'তালিকা')}</button>
        </div>
      </div>

      {view === 'board' ? (
        <DndContext sensors={sensors} collisionDetection={collide} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setDrag(null)}>
          <div className="ld-board">
            {STAGES.map(s => {
              const col = ls.filter(x => x.stage === s.k).sort(byNext);
              return (
                <Column key={s.k} k={s.k} n={col.length} empty={qq ? t('No match here', 'এখানে কিছু মেলেনি') : t('Drop a lead here', 'এখানে একটি লিড ছাড়ুন')}>
                  {col.map(x => <DragCard key={x.id} x={x} open={() => show(x.id)} move={d => move(x, d)} convert={() => convert(x)} />)}
                </Column>
              );
            })}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>{dragged ? <Card x={dragged} lift /> : null}</DragOverlay>
        </DndContext>
      ) : (
        <div className="card"><div className="tbl-wrap">
          <table className="tbl ld-tbl">
            <thead><tr><th>{t('Restaurant', 'রেস্টুরেন্ট')}</th><th>{t('Stage', 'ধাপ')}</th><th>{t('Contact', 'যোগাযোগ')}</th><th>{t('Next step', 'পরের কাজ')}</th><th>{t('Updated', 'শেষ বদল')}</th></tr></thead>
            <tbody>
              {ls.slice().sort((x, y) => Number(x.stage === 'won') - Number(y.stage === 'won') || byNext(x, y)).map(x => {
                const st = stageOf(x.stage);
                return (
                  <tr key={x.id} tabIndex={0} onClick={() => setOpen({ id: x.id })} onKeyDown={e => { if (e.key === 'Enter') setOpen({ id: x.id }); }}>
                    <td><div className="ld-top"><span className="ld-av" style={{ '--c': st.c } as CSSProperties}>{initials(x.name)}</span><div><b>{x.name}</b><span className="meta">{i.L(areaOf(x.area))}</span></div></div></td>
                    <td><span className="ld-stage" style={{ '--c': st.c } as CSSProperties}>{i.L(st.l)}</span></td>
                    <td>{x.person || ''}<span className="meta" style={{ display: 'block' }}>{x.phone || ''}</span></td>
                    <td><NextChip x={x} none /></td>
                    <td className="meta">{x.upd ? ago(x.upd) : ''}</td>
                  </tr>
                );
              })}
              {!ls.length ? <tr><td colSpan={5}><Empty icon="magnifying-glass" title={t('No leads found', 'কোনো লিড পাওয়া যায়নি')}>{t('Try another search or city.', 'অন্যভাবে খুঁজুন বা অন্য শহর বাছুন।')}</Empty></td></tr> : null}
            </tbody>
          </table>
        </div></div>
      )}
      <LeadDrawer key={sel.n} open={sel.on} x={sel.id ? all.find(l => l.id === sel.id) || null : null} onClose={() => setOpen(null)} />
      <AddRestaurant key={'c' + conv.n} open={conv.on} pre={conv.pre} onClose={() => setConv(null)} />
    </Page>
  );
}

/* ---------- one drawer for adding a lead and for looking after one: details, stage, follow-up date and notes ---------- */
function LeadDrawer({ open, x: xIn, onClose }: { open: boolean; x: LeadX | null; onClose: () => void }) {
  const i = useI(), t = useT(), ago = useAgo(), { me } = usePanel();
  const [x] = useState(xIn); /* what it showed when it opened, also while it slides away */
  const isNew = !x;
  const [f, setF] = useState(() => ({
    name: x?.name || '', area: x?.area || C.areas[0].id, plan: x?.plan || '', person: x?.person || '', phone: x?.phone || '',
    next: x ? x.next || '' : isoDay(2), stage: (x?.stage || 'new') as Stage, note: '',
  }));
  const up = (k: keyof typeof f) => (v: string) => setF(o => ({ ...o, [k]: v }));
  const del = async () => {
    if (!x) return;
    if (!await confirm({ title: t(`Delete ${x.name}?`, `${x.name} মুছবেন?`), text: t('The lead and its notes are removed. This cannot be undone.', 'লিড আর তার নোট মুছে যাবে। এটা ফেরানো যাবে না।'), ok: t('Delete', 'মুছুন'), danger: true })) return;
    mutate(db => { db.leads = db.leads.filter(l => l.id !== x.id); logIn(db, null, { en: `Deleted lead ${x.name}`, bn: `লিড ${x.name} মুছেছেন` }); });
    toast.success(t('Lead deleted.', 'লিড মোছা হয়েছে।')); onClose();
  };
  const save = () => {
    const name = f.name.trim(), note = f.note.trim(), now = Date.now();
    if (!name) return toast.error(t('Add the restaurant name.', 'রেস্টুরেন্টের নাম লিখুন।'));
    if (f.phone.trim() && !okPhone(f.phone)) return toast.error(t('That phone number does not look right. Use a mobile number like 01712 345678.', 'ফোন নম্বরটি ঠিক মনে হচ্ছে না। 01712 345678-এর মতো মোবাইল নম্বর দিন।'));
    mutate(db => {
      let y: LeadX;
      if (x) { const l = db.leads.find(z => z.id === x.id); if (!l) return; y = leadFix(l); }
      else { y = leadFix({ id: 'l' + now.toString(36), name, area: f.area, person: '', phone: '', stage: 'new', note: '' }); y.at = now; y.hist = []; db.leads.unshift(y); }
      const moved = !isNew && f.stage !== y.stage, s = stageOf(f.stage).l;
      Object.assign(y, { name, area: f.area, plan: f.plan, person: f.person.trim(), phone: f.phone.trim(), next: f.next, upd: now });
      if (moved) { y.stage = f.stage; y.hist.unshift({ at: now, who: me.name, what: `Moved to ${s.en}`, bn: `“${s.bn}” ধাপে নেওয়া হয়েছে` }); }
      if (note) { y.hist.unshift({ at: now, who: me.name, what: note }); y.note = note; }
      logIn(db, null, isNew ? { en: `Added lead ${name}`, bn: `লিড ${name} যোগ করেছেন` }
        : { en: `Updated lead ${name}${moved ? ` (now ${s.en})` : ''}`, bn: `লিড ${name} হালনাগাদ করেছেন${moved ? ` (এখন ${s.bn})` : ''}` });
    });
    toast.success(isNew ? t('Lead added.', 'লিড যোগ হয়েছে।') : t('Lead saved.', 'লিড রাখা হয়েছে।'));
    onClose();
  };
  return (
    <Drawer open={open} onClose={onClose} title={isNew ? t('Add a lead', 'লিড যোগ করুন') : x!.name}
      foot={<>{isNew ? <button type="button" className="btn ghost l" onClick={onClose}>{t('Cancel', 'বাতিল')}</button> : <button type="button" className="btn ghost danger l" onClick={del}>{t('Delete lead', 'লিড মুছুন')}</button>}
        <button type="button" className="btn pri" onClick={save}>{isNew ? t('Add lead', 'লিড যোগ করুন') : t('Save', 'রাখুন')}</button></>}>
      {!isNew ? (
        <div className="field" style={{ marginBottom: 16 }}><span className="lbl">{t('Stage', 'ধাপ')}</span>
          <div className="ld-steps" role="radiogroup" aria-label={t('Stage', 'ধাপ')}>
            {STAGES.map(s => <button key={s.k} type="button" role="radio" aria-checked={f.stage === s.k} className={f.stage === s.k ? 'on' : ''} style={{ '--c': s.c } as CSSProperties} onClick={() => setF(o => ({ ...o, stage: s.k }))}>{i.L(s.l)}</button>)}
          </div></div>
      ) : null}
      <div className="f-grid">
        <TextF full label={t('Restaurant name', 'রেস্টুরেন্টের নাম')} value={f.name} onChange={up('name')} />
        <SelF label={t('Area', 'এলাকা')} value={f.area} onChange={up('area')} opts={C.areas.map(a => [a.id, `${i.L(a)}, ${i.L(C.cities[a.city])}`])} />
        <SelF label={t('Interested in', 'যাতে আগ্রহী')} value={f.plan} onChange={up('plan')} opts={[['', t('Not sure yet', 'এখনো ঠিক নয়')], ...(Object.keys(PLANS) as Plan[]).map(k => [k, `${i.L(PLANS[k].name)}, ${i.tk(PLANS[k].price)} ${t('a month', 'মাসে')}`] as [string, string])]} />
        <TextF label={t('Contact person', 'যোগাযোগের মানুষ')} value={f.person} onChange={up('person')} />
        <TextF label={t('Phone', 'ফোন')} value={f.phone} onChange={up('phone')} type="tel" ph="01712 345678" />
        <TextF full label={t('Call back on', 'ফোন করার দিন')} value={f.next} onChange={up('next')} type="date"
          hint={t('Leave empty if there is nothing to do yet. Due and overdue calls show in red on the board.', 'এখনো কিছু করার না থাকলে খালি রাখুন। যেদিন ফোন করার কথা বা পার হয়ে গেছে, বোর্ডে লাল দেখায়।')} />
      </div>
      <div className="field" style={{ marginTop: 18 }}>
        <label htmlFor="ld-note">{isNew ? t('First note', 'প্রথম নোট') : t('Add a note', 'নোট যোগ করুন')}</label>
        <textarea className="inp" id="ld-note" rows={2} value={f.note} onChange={e => up('note')(e.target.value)} placeholder={t('What was said, what they asked for, what happens next', 'কী কথা হলো, তাঁরা কী চাইলেন, এরপর কী হবে')} />
      </div>
      {x && x.hist.length ? (
        <div className="ld-hist"><span className="lbl">{t('History', 'আগের কথা')}</span>
          {x.hist.map((h, k) => <div key={k}><i /><p>{i.bn ? h.bn || h.what : h.what}</p><span className="meta">{h.who === 'khabo team' ? t('khabo team', 'খাবো টিম') : h.who} · {ago(h.at)}</span></div>)}
        </div>
      ) : null}
    </Drawer>
  );
}
