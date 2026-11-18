'use client';
/* The table bill: a bar at the bottom while dishes are on it, and a sheet with every line, VAT, service,
   the total and what each person pays. It is the same bill as on the main site (useApp().bill), so a bill
   started on the restaurant's page shows here too. VAT and service appear only here, never next to a dish. */
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { Drawer } from 'vaul';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Tk } from '@/components/ui/bits';
import { EASE } from '@/lib/khabo';
import { useApp } from '@/lib/store';
import type { Restaurant, RestaurantMini } from '@/lib/data/types';
import { Img, TAdd, rVars, sums, useChecked } from './parts';
import { W, fillW } from './words';

type S = ReturnType<typeof sums>;

/** the bar at the bottom: last dishes, the total with VAT and service, and the way to the full bill */
export function TableTray({ r, x, hidden, onOpen }: { r: Restaurant; x: S; hidden: boolean; onOpen: () => void }) {
  const i = useI();
  const show = x.count > 0 && !hidden;
  const tax = r.vat && r.service ? W.withTax : r.vat ? W.withVat : r.service ? W.withSvc : null;
  return (
    <AnimatePresence>
      {show ? (
        <m.div key="tray" className="tmx tmx-tray" style={rVars(r)}
          initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0, transition: { duration: 0.18 } }} transition={{ duration: 0.32, ease: EASE }}>
          <button type="button" className="tmx-tray-open" onClick={onOpen} aria-label={i.t('view_bill')}>
            <m.span className="tmx-thumbs" key={x.count} initial={{ scale: 0.92 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 22 }}>
              {x.lines.slice(-3).reverse().map(l => <span key={l.d.id}>{l.d.p ? <Img id={l.d.p} w={96} sizes="40px" /> : i.L(l.d.name).charAt(0)}</span>)}
            </m.span>
          </button>
          <button type="button" className="tmx-tx" onClick={onOpen}>
            <b><Tk v={x.total} flow /><small>{x.count === 1 ? i.L(W.item) : fillW(i.L(W.items), { n: i.N(x.count) })}</small></b>
            <span>{tax ? i.L(tax) : i.t('each_for', { v: i.tk(x.pp), n: i.N(x.people) })}</span>
          </button>
          <button type="button" className="tmx-go" onClick={onOpen}>{i.t('view_bill')}<I n="arrow-right" b /></button>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}

/** the full bill in a sheet */
export function TableBill({ r, mini, x, open, onClose, table, theme }: { r: Restaurant; mini: RestaurantMini; x: S; open: boolean; onClose: () => void; table: string; theme: string }) {
  const i = useI();
  const set = useApp(s => s.set), clear = useApp(s => s.clearBill);
  const checked = useChecked(r);
  const ppl = (n: number) => set({ people: Math.max(1, Math.min(40, n)) });
  const text = () => {
    const rows = x.lines.map(l => `${i.L(l.d.name)} × ${i.N(l.q)} = ${i.tk(l.line)}`).join('\n');
    return `${i.L(r.name)}${table ? ` · ${i.t('table_n', { n: i.dg(table) })}` : ''} (Khaoya)\n${rows}\n${i.t('total_all_in')}: ${i.tk(x.total)}\n${i.t('each_person')} (${i.N(x.people)}): ${i.tk(x.pp)}`;
  };
  const title = table ? fillW(i.L(W.tableBill), { n: i.dg(table) }) : i.t('bill_title');
  return (
    <Drawer.Root open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="tmx-over" />
        <Drawer.Content className={clsx('tmx tmx-c tmx-bill', 'tm-th-' + theme)} style={rVars(r)} aria-describedby={undefined}>
          <span className="tmx-grab" aria-hidden="true" />
          <div className="tmx-bill-h">
            <Drawer.Title>{title}</Drawer.Title>
            <button type="button" className="tmx-x" onClick={onClose} aria-label={i.L(W.close)}><I n="x" b /></button>
          </div>
          <div className="tmx-scroll">
            {!x.lines.length ? (
              <div className="tmx-empty">
                <span><I n="receipt" /></span>
                <h3>{i.t('bill_empty')}</h3>
                <p>{i.t('bill_empty_sub')}</p>
                <button type="button" className="tmx-btn main" onClick={onClose}>{i.t('see_menu')}</button>
              </div>
            ) : (
              <>
                <div className="tmx-br">
                  <Mono r={r} />
                  <div><b>{i.L(r.name)}</b>{checked ? <span className="tmx-fresh">{checked}</span> : null}</div>
                </div>
                <ul className="tmx-lines">
                  {x.lines.map((l, k) => (
                    <m.li key={l.d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE, delay: Math.min(k, 6) * 0.04 }}>
                      <span className="tmx-th">{l.d.p ? <Img id={l.d.p} w={120} sizes="44px" eager /> : i.L(l.d.name).charAt(0)}</span>
                      <div><b>{i.L(l.d.name)}</b><small>{i.tk(l.d.price)} × {i.N(l.q)}</small></div>
                      <Tk v={l.line} />
                      <TAdd r={mini} d={{ ...l.d, out: false }} />
                    </m.li>
                  ))}
                </ul>
                <div className="tmx-ppl">
                  <div><b>{i.t('people')}</b><small>{i.t('split_even')}</small></div>
                  <div className="tmx-step">
                    <button type="button" onClick={() => ppl(x.people - 1)} aria-label={i.t('fewer')} disabled={x.people <= 1}><I n="minus" b /></button>
                    <b aria-live="polite">{i.N(x.people)}</b>
                    <button type="button" onClick={() => ppl(x.people + 1)} aria-label={i.t('more')}><I n="plus" b /></button>
                  </div>
                </div>
                <dl className="tmx-sum">
                  <div><dt>{i.t('subtotal')}</dt><dd><Tk v={x.sub} /></dd></div>
                  {r.vat ? <div><dt>{i.t('vat')} {i.N(r.vat)}%</dt><dd><Tk v={x.vat} /></dd></div> : null}
                  {r.service ? <div><dt>{i.t('service')} {i.N(r.service)}%</dt><dd><Tk v={x.svc} /></dd></div> : null}
                  <div className="tot"><dt>{i.t('total_all_in')}</dt><dd><Tk v={x.total} flow /></dd></div>
                </dl>
                <div className="tmx-pp"><span>{i.t('each_person')}</span><Tk v={x.pp} flow /></div>
                <p className="tmx-bnote">{i.t('bill_note')}</p>
                <div className="tmx-acts">
                  <a className="tmx-btn main" target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent(text())}`}><I n="whatsapp-logo" />{i.t('share_whatsapp')}</a>
                  <button type="button" className="tmx-btn line" onClick={() => { clear(r.id); onClose(); }}>{i.t('clear_bill')}</button>
                </div>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
