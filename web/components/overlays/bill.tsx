'use client';
/* The bill: today's cash memo for one restaurant, in a sheet from the bottom. Dishes with + and −, then
   VAT and service (only here, never on the menu), the total, a split between people, and WhatsApp.
   Ported from website/app/app.js (BillDrawer, Memo). */
import '@/styles/restaurant-extra.css';
import { useState } from 'react';
import clsx from 'clsx';
import { Drawer } from 'vaul';
import { AnimatePresence, LayoutGroup, m } from 'motion/react';
import { toast } from '@/lib/toast';
import { useI } from '@/components/providers/i18n';
import { I, Num, TNum, Tk } from '@/components/ui/bits';
import { useApp, billSub, type BillOf } from '@/lib/store';
import { C, EASE, src, where } from '@/lib/khabo';
import type { RMini } from '@/components/restaurant/util';
import { W } from '@/components/restaurant/words';

export function BillDrawer() {
  const i = useI();
  const billOpen = useApp(s => s.billOpen), set = useApp(s => s.set);
  const b = useApp(s => (s.billOpen ? s.bill[s.billOpen] : undefined));
  /* keep the restaurant while the sheet slides away, and after the bill is cleared */
  const [keep, setKeep] = useState<{ id: string; r: RMini } | null>(null);
  if (b && keep?.r !== b.r) setKeep({ id: b.r.id, r: b.r });
  const r = b?.r || (keep && (!billOpen || keep.id === billOpen) ? keep.r : null);
  return (
    <Drawer.Root open={!!billOpen} onOpenChange={o => { if (!o) set({ billOpen: null }); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="vaul-over" />
        <Drawer.Content className="vaul-c" aria-describedby={undefined}>
          <div className="vaul-h" />
          <Drawer.Title className="sr">{i.t('bill_title')}</Drawer.Title>
          <div className="memo-edge" />
          {r ? <Memo r={r} b={b} /> : <div className="memo" />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Memo({ r, b }: { r: RMini; b?: BillOf }) {
  const i = useI();
  const people = useApp(s => s.people), set = useApp(s => s.set), add = useApp(s => s.add), clearBill = useApp(s => s.clearBill);
  const lines = b ? Object.values(b.items).filter(z => z.q > 0) : [];
  const sub = billSub(b), vat = sub * r.vat / 100, svc = sub * r.service / 100, total = sub + vat + svc;
  const today = new Date();
  const share = () => {
    const text = [i.L(r.name), ...lines.map(z => `${i.dg(z.q)} x ${i.L(z.d.name)}: ${i.tk(z.d.price * z.q)}`), `${i.L(W.withVat)}: ${i.tk(total)}`].join('\n');
    return 'https://wa.me/?text=' + encodeURIComponent(text);
  };
  const clear = () => {
    const was = b;
    clearBill(r.id);
    if (was) toast(i.t('clear_bill'), { action: { label: i.tx('undo'), onClick: () => useApp.setState(s => ({ bill: { ...s.bill, [r.id]: was } })) } });
  };
  return (
    <div className="memo" style={{ '--memo': r.theme.deep } as React.CSSProperties}>
      <div className="memo-h">
        <b className={clsx(r.theme.font === 'serif' && !i.bn && 'serif')}>{i.L(r.name)}</b>
        <span>{r.spot ? i.L(r.spot) : where(i, r)}<br />{i.dm(today)} {i.dg(today.getFullYear())}</span>
      </div>
      {lines.length ? (
        <LayoutGroup>
          <AnimatePresence initial={false} mode="popLayout">
            {lines.map(z => (
              <m.div key={z.d.id} layout className="ml" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16, transition: { duration: 0.16 } }} transition={{ duration: 0.25, ease: EASE }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="pic">{z.d.p ? <img src={src(z.d.p, 80)} alt="" /> : <I n={C.types[z.d.type]?.i || 'fork-knife'} />}</span>
                <b>{i.L(z.d.name)}</b>
                <span className="stepper">
                  <button onClick={() => add(r, z.d, -1)} aria-label={'− ' + i.L(z.d.name)}><I n="minus" b /></button>
                  <b><Num v={z.q} /></b>
                  <button onClick={() => add(r, z.d, 1)} aria-label={'+ ' + i.L(z.d.name)}><I n="plus" b /></button>
                </span>
                <Tk v={z.d.price * z.q} flow />
              </m.div>
            ))}
          </AnimatePresence>
          <m.div layout="position" transition={{ duration: 0.25, ease: EASE }}>
            <div className="ml sub"><span>{i.t('subtotal')}</span><Tk v={sub} flow /></div>
            <div className="ml sub"><span>{i.t('vat')} {i.N(r.vat)}%</span><Tk v={vat} flow /></div>
            <div className="ml sub"><span>{i.t('service')} {i.N(r.service)}%</span><Tk v={svc} flow /></div>
            <div className="memo-t"><b>{i.t('total_all_in')}</b><Tk v={total} flow /></div>
            <div className="memo-pp">
              <span>{i.t('people')}</span>
              <span className="stepper">
                <button onClick={() => set({ people: Math.max(1, people - 1) })} aria-label={'− ' + i.t('people')}><I n="minus" b /></button>
                <b><Num v={people} /></b>
                <button onClick={() => set({ people: Math.min(30, people + 1) })} aria-label={'+ ' + i.t('people')}><I n="plus" b /></button>
              </span>
              <span style={{ marginLeft: 'auto' }}><TNum k="each_of" n={people} /></span>
              <Tk v={total / people} flow />
            </div>
            <p className="memo-note">{i.t('bill_note')}</p>
            <div className="memo-a">
              <a className="btn b1" href={share()} target="_blank" rel="noopener"><I n="whatsapp-logo" />{i.t('share_whatsapp')}</a>
              <button className="btn b2" onClick={clear}>{i.t('clear_bill')}</button>
            </div>
          </m.div>
        </LayoutGroup>
      ) : (
        <div className="memo-empty"><b>{i.t('bill_empty')}</b><p>{i.t('bill_empty_sub')}</p></div>
      )}
    </div>
  );
}
