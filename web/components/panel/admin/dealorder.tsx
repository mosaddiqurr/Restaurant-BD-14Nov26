'use client';
/* Deal order (khabo team only): every live deal. Premium partners always come first, then Pro, then Starter;
   the team drags a deal to change its place inside its plan. The order is saved where the diner Deals page
   and Home read it (lib/store dealOrder). Ported from website/app/app.js (DealOrder). */
import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useI } from '@/components/providers/i18n';
import { Pic, Tk } from '@/components/ui/bits';
import { areaOf, liveDealsOf, rankDeals, type DealRow } from '@/lib/khabo';
import { useApp } from '@/lib/store';
import type { Plan } from '@/lib/data/types';
import { allR, logIn, mutate, type PR } from '@/lib/panel/store';
import { PLANS } from '@/lib/panel/words';
import { bnN } from '@/lib/panel/admin';
import { Empty, Ico, Page, usePanel, useT } from '../ui';
import { useDraft, useSaveEntry } from '../draft';
import '@/styles/panel-admin.css';

type Row = DealRow<PR>;
const GROUPS: Plan[] = ['premium', 'pro', 'starter'];

/** the diner site's saved state comes back from this browser after the page has drawn; wait for it before saving */
async function ready() {
  if (!useApp.persist.hasHydrated()) await useApp.persist.rehydrate();
}

function SortRow({ id, children }: { id: string; children: (h: HTMLAttributes<HTMLElement>) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} className={clsx('ro-row', isDragging && 'dragging')} style={{ transform: CSS.Translate.toString(transform), transition }}>
      {children({ ...attributes, ...listeners } as HTMLAttributes<HTMLElement>)}
    </div>
  );
}

export function DealOrder() {
  const i = useI(), t = useT(), { db } = usePanel();
  const order = useApp(s => s.dealOrder);
  const [hyd, setHyd] = useState(() => useApp.persist.hasHydrated());
  useEffect(() => { if (!hyd) { const off = useApp.persist.onFinishHydration(() => setHyd(true)); ready().then(() => setHyd(true)); return off; } }, [hyd]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const rows: Row[] = allR(db).filter(r => !r.hidden).flatMap(r => liveDealsOf(r).map((d, k) => ({ r, d, k: r.id + '/' + d.id, i: k })));
  /* the order being changed: a draft until Save changes */
  const od = useDraft<string[]>(order);
  const all = rankDeals(rows, od.draft);
  const groups = GROUPS.map(p => ({ p, items: all.filter(z => z.r.plan === p) })).filter(g => g.items.length);

  const [what, setWhat] = useState<{ en: string; bn: string } | null>(null);
  const save = async () => {
    if (!od.dirty) return true;
    const keys = od.draft;
    await ready();
    useApp.getState().set({ dealOrder: keys });
    mutate(d => { d.dealOrder = keys; logIn(d, null, what || { en: 'Changed the deal order', bn: 'অফারের ক্রম বদলেছেন' }); });
    od.done(keys); setWhat(null);
    return true;
  };
  useSaveEntry({ count: od.dirty ? 1 : 0, save, discard: () => { od.discard(); setWhat(null); } });
  const end = (p: Plan) => ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const g = groups.find(z => z.p === p)!.items;
    const moved = arrayMove(g, g.findIndex(z => z.k === active.id), g.findIndex(z => z.k === over.id));
    const z = g.find(x => x.k === active.id)!, at = moved.indexOf(z) + 1;
    od.set(groups.flatMap(x => (x.p === p ? moved : x.items)).map(x => x.k));
    setWhat({ en: `Changed the deal order: ${z.d.en} is now number ${at} in ${PLANS[p].name.en}`, bn: `অফারের ক্রম বদলেছেন: ${z.d.bn || z.d.en} এখন ${PLANS[p].name.bn}-এ ${bnN(at)} নম্বরে` });
  };
  const reset = () => { od.set([]); setWhat({ en: 'Put the deal order back to the default', bn: 'অফারের ক্রম আগের মতো করেছেন' }); };
  const total = all.length;

  return (
    <Page title={t('Deal order', 'অফারের ক্রম')}
      sub={t('Premium partners always come first, then Pro, then Starter. Drag a deal to change its place inside its plan, then press Save changes. Diners see this order on the Deals page and on Home.', 'প্রিমিয়াম পার্টনার সবসময় আগে, তারপর প্রো, তারপর স্টার্টার। প্ল্যানের ভেতরে জায়গা বদলাতে একটি অফার টেনে সরান, তারপর "বদল রাখুন" চাপুন। ডাইনাররা অফার পেজ আর হোমে এই ক্রমই দেখেন।')}
      acts={<>
        <a className="btn" href={`/${i.lang}/deals`} target="_blank" rel="noopener"><Ico n="arrow-up-right" sm />{t('Open the Deals page', 'অফার পেজ খুলুন')}</a>
        {hyd && od.draft.length ? <button type="button" className="btn" onClick={reset}><Ico n="arrow-counter-clockwise" sm />{t('Default order', 'আগের ক্রম')}</button> : null}
      </>}>
      <div className="alert info" style={{ marginBottom: 18 }}><Ico n="info" /><div className="meta">
        {t(`${total} live deals. Only deals that are on today show here. The Deals page shows every one of them.`, `${i.N(total)}টি চালু অফার। আজ চালু থাকা অফারই শুধু এখানে দেখায়। অফার পেজে এর প্রতিটি দেখা যায়।`)}
        {' '}{t('Drag the dots, or tab to them and use Space and the arrow keys.', 'ছয় বিন্দুর জায়গাটা টেনে সরান, অথবা ট্যাব দিয়ে সেখানে গিয়ে স্পেস আর তীর চাবি ব্যবহার করুন।')}
      </div></div>
      {groups.length ? groups.map(g => (
        <section key={g.p} className="ro-g" aria-label={i.L(PLANS[g.p].name)}>
          <h2>{i.L(PLANS[g.p].name)} · {t(`${g.items.length} deal${g.items.length === 1 ? '' : 's'}`, `${i.N(g.items.length)}টি অফার`)}</h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end(g.p)}>
            <SortableContext items={g.items.map(z => z.k)} strategy={verticalListSortingStrategy}>
              <div className="ro-list">
                {g.items.map((z, k) => (
                  <SortRow key={z.k} id={z.k}>{h => <>
                    <button type="button" className="handle" {...h} aria-label={t(`Move ${z.d.en}`, `${z.d.bn || z.d.en} সরান`)}><Ico n="dots-six-vertical" b /></button>
                    <Pic id={z.d.p} w={100} tone={z.r.theme} icon="tag" />
                    <span style={{ minWidth: 0 }}>
                      <b><span className="ro-n">{i.N(k + 1)}.</span>{i.L(z.d)}</b>
                      <small>{i.L(z.r.name)}, {i.L(areaOf(z.r.area))}{z.d.week ? <> · <span className="ro-wk">{t('Deal of the week', 'সপ্তাহের অফার')}</span></> : null}</small>
                    </span>
                    <Tk v={z.d.price} />
                  </>}</SortRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )) : <div className="card"><Empty icon="tag" title={t('No live deals', 'কোনো চালু অফার নেই')}>{t('When a restaurant puts a deal live, it shows here.', 'কোনো রেস্টুরেন্ট অফার চালু করলে এখানে দেখাবে।')}</Empty></div>}
    </Page>
  );
}
