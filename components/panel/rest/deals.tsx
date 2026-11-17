'use client';
/* Deals: as many offers as the owner likes, each with a first and last day; they show and hide by themselves.
   The list order is the order diners see. Ported from archive/prototype/panel/rest.js (V.deals, dealDrawer).
   On the khabo Deals page, Premium restaurants' deals still come first, then Pro, then Starter. */
import { useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { C, dealState, src, today } from '@/lib/khabo';
import type { Deal } from '@/lib/data/types';
import { clone, type PR } from '@/lib/panel/store';
import { Drawer, Empty, Ico, MoneyF, Page, SelF, SwRow, TextF, confirm, pickPhotos, useR, useSaved, useT } from '../ui';

const MAX_DEALS = 8;
const newId = (k: string) => `${k}-${Date.now().toString(36)}`;

function useWhen() {
  const i = useI(), t = useT();
  const d = (v?: string) => (v ? i.dm(new Date(v + 'T00:00')) : '');
  return (x: Partial<Deal>) => x.week ? t('This week', 'এই সপ্তাহ') : x.from && x.to ? `${d(x.from)} ${t('to', 'থেকে')} ${d(x.to)}` : x.to ? t(`Until ${d(x.to)}`, `${d(x.to)} পর্যন্ত`) : x.from ? t(`From ${d(x.from)}`, `${d(x.from)} থেকে`) : '';
}

/** what diners save, worked out from the deal price and the usual price */
export const saveOf = (price: number, was: number) => (was > price && price > 0 ? { v: was - price, pct: Math.round(((was - price) / was) * 100) } : null);
function SaveLine({ price, was }: { price: number; was: number }) {
  const i = useI(), t = useT();
  const sv = saveOf(price, was);
  if (!price || !was) return <p className="full dsave">{t('Add the usual price and khabo works out the saving for you.', 'সাধারণ দাম দিন, খাবো নিজেই হিসাব করবে কত বাঁচছে।')}</p>;
  if (!sv) return <p className="full dsave bad"><Ico n="warning" sm />{t('The usual price should be higher than the deal price.', 'সাধারণ দাম অফারের দামের চেয়ে বেশি হতে হবে।')}</p>;
  return (
    <p className="full dsave ok"><Ico n="tag" sm />
      {t(`Diners save ${i.tk(sv.v)} (${sv.pct}% off). Worked out for you from the two prices.`, `ডাইনাররা বাঁচাবেন ${i.tk(sv.v)} (${i.N(sv.pct)}% ছাড়)। দুই দাম থেকে নিজে থেকেই হিসাব করা।`)}
    </p>
  );
}

/** how the deal looks to diners: the restaurant's colours, the photo, the tag, the price and what it was */
function DealLook({ r, x }: { r: PR; x: Partial<Deal> }) {
  const i = useI(), t = useT(), when = useWhen();
  const tag = x.week ? t('Deal of the week', 'সপ্তাহের অফার') : i.L(C.dealTags[x.tag || 'offer'] || C.dealTags.offer);
  const sv = saveOf(x.price || 0, x.was || 0), pct = sv ? sv.pct : 0;
  const w = when(x);
  return (
    <div className="look dlook" style={{ '--d': r.theme.deep, '--a': r.theme.accent, minHeight: 200 } as CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {x.p ? <img src={src(x.p, 800)} alt="" /> : null}
      <div>
        <span className="dl-tag">{pct ? <i>{i.N(pct)}%</i> : null}{tag}{w ? ` · ${w}` : ''}</span>
        <b>{i.bn ? x.bn || x.en : x.en}</b>
        {x.desc ? <p style={{ color: 'rgba(255,255,255,.75)', marginTop: 6 }}>{i.L(x.desc)}</p> : null}
        {x.when && i.L(x.when) ? <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>{i.L(x.when)}</p> : null}
        <span className="lb">{x.price ? i.tk(x.price) : ''}{sv ? <><s style={{ opacity: 0.6, marginLeft: 6 }}>{i.tk(x.was!)}</s><em className="dl-save">{i.t('you_save', { v: i.tk(sv.v) })}</em></> : null}</span>
      </div>
    </div>
  );
}

export function Deals() {
  const i = useI(), t = useT(), { r } = useR(), saved = useSaved();
  const [edit, setEdit] = useState<{ d: Deal | null } | null>(null);
  const all = r.deals || [], full = all.length >= MAX_DEALS;
  const n = (k: string) => all.filter(d => dealState(d) === k).length;
  const live = n('live');
  const d8 = (v?: string) => (v ? i.dm(new Date(v + 'T00:00')) : '');
  const save = (nr: PR, en: string, bn: string, msg: [string, string]) => saved(nr, { en, bn }, { en: msg[0], bn: msg[1] });
  const tog = (k: number) => {
    const nr = clone(r), d = nr.deals![k];
    if (d.off) delete d.off; else d.off = true;
    save(nr, `${d.off ? 'Paused' : 'Showed'} deal: ${d.en}`, `অফার ${d.off ? 'থামিয়েছেন' : 'চালু করেছেন'}: ${d.bn}`, d.off ? ['Deal paused.', 'অফার থামানো হয়েছে।'] : ['Deal is live on khabo.', 'অফারটি খাবোতে দেখা যাচ্ছে।']);
  };
  const move = (k: number, j: number) => {
    const nr = clone(r), list = nr.deals!; const [d] = list.splice(k, 1); list.splice(j, 0, d);
    save(nr, `Moved deal: ${d.en}`, `অফারের ক্রম বদলেছেন: ${d.bn}`, ['Order saved.', 'ক্রম রাখা হয়েছে।']);
  };
  const extra = ([['off', t('paused', 'থামানো')], ['soon', t('starting later', 'পরে শুরু হবে')], ['ended', t('ended', 'শেষ')]] as const)
    .map(([k, l]) => [n(k), l] as const).filter(([c]) => c).map(([c, l]) => `, ${i.N(c)} ${l}`).join('');
  return (
    <Page title={t('Deals', 'অফার')}
      sub={t('Run as many offers as you like. Give each one a first and last day and it shows and hides by itself. Several deals sit side by side on your page.', 'যত খুশি অফার চালান। প্রতিটির প্রথম আর শেষ দিন দিন, নিজে থেকেই দেখাবে আর লুকাবে। আপনার পেজে কয়েকটি অফার পাশাপাশি থাকে।')}
      acts={<button className="btn pri" disabled={full} onClick={() => setEdit({ d: null })}><Ico n="plus" sm />{t('Add a deal', 'অফার যোগ করুন')}</button>}>
      {all.length ? <>
        <p className="meta" style={{ margin: '-4px 0 14px' }}>{t(`${live} showing`, `${i.N(live)}টি দেখা যাচ্ছে`)}{extra}. {t('The first one is shown first.', 'প্রথমটি সবার আগে দেখায়।')}{full ? ' ' + t(`You can have up to ${MAX_DEALS}.`, `সর্বোচ্চ ${i.N(MAX_DEALS)}টি রাখা যায়।`) : ''}</p>
        <div className="deal-list">
          {all.map((d, k) => {
            const st = dealState(d);
            return (
              <div key={d.id} className={clsx('card deal-c', d.off && 'off')}>
                <DealLook r={r} x={d} />
                <div className="deal-c-b">
                  <div className="deal-c-s">
                    {st === 'off' ? <span className="badge">{t('Paused', 'থামানো')}</span>
                      : st === 'soon' ? <span className="badge ind">{t(`Starts ${d8(d.from)}`, `${d8(d.from)} শুরু`)}</span>
                        : st === 'ended' ? <span className="badge warn">{t('Ended, hidden', 'শেষ, লুকানো')}</span>
                          : <span className="badge ok"><i className="dot" />{d.to ? t(`Showing until ${d8(d.to)}`, `${d8(d.to)} পর্যন্ত দেখা যাবে`) : t('Showing', 'দেখা যাচ্ছে')}</span>}
                    {d.week ? <span className="badge ind">{t('Deal of the week', 'সপ্তাহের অফার')}</span> : null}
                  </div>
                  <div className="deal-c-a">
                    <button className="btn sm ghost ic" disabled={!k} onClick={() => move(k, k - 1)} aria-label={t('Move up', 'ওপরে নিন')}><Ico n="caret-up" sm /></button>
                    <button className="btn sm ghost ic" disabled={k === all.length - 1} onClick={() => move(k, k + 1)} aria-label={t('Move down', 'নিচে নিন')}><Ico n="caret-down" sm /></button>
                    <button className="btn sm" onClick={() => tog(k)}>{d.off ? <><Ico n="eye" sm />{t('Show', 'দেখান')}</> : <><Ico n="pause" sm />{t('Pause', 'থামান')}</>}</button>
                    <button className="btn sm" onClick={() => setEdit({ d })}>{t('Edit', 'বদলান')}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </> : (
        <div className="card"><Empty icon="tag" title={t('No deals yet', 'এখনো কোনো অফার নেই')}>{t('A deal shows on your page and on the khabo Deals page.', 'অফার আপনার পেজে আর খাবোর অফার পেজে দেখায়।')}
          <div><button className="btn pri" style={{ marginTop: 12 }} onClick={() => setEdit({ d: null })}><Ico n="plus" sm />{t('Add your first deal', 'প্রথম অফার যোগ করুন')}</button></div></Empty></div>
      )}
      <DealEdit open={edit} onClose={() => setEdit(null)} />
    </Page>
  );
}

type F = { t: string; tbn: string; desc: string; descbn: string; tag: string; from: string; to: string; when: string; whenbn: string; price: string; was: string; on: boolean; p: string | null };
const toF = (r: PR, d: Deal | null): F => ({
  t: d?.en || '', tbn: d?.bn || '', desc: d?.desc?.en || '', descbn: d?.desc?.bn || '', tag: d?.tag || 'offer', from: d?.from || '', to: d?.to || '',
  when: d?.when?.en || '', whenbn: d?.when?.bn || '', price: d?.price ? String(d.price) : '', was: d?.was ? String(d.was) : '', on: !d?.off,
  p: d ? d.p || null : r.menu.find(x => x.p)?.p || r.hero[0] || null,
});
function DealEdit({ open, onClose }: { open: { d: Deal | null } | null; onClose: () => void }) {
  const i = useI(), t = useT(), { r } = useR(), saved = useSaved();
  const [f, setF] = useState<F>(() => toF(r, null));
  const [last, setLast] = useState<typeof open>(null);
  if (open && open !== last) { setLast(open); setF(toF(r, open.d)); }
  const d = (open || last)?.d || null, isNew = !d;
  const up = <K extends keyof F>(k: K) => (v: F[K]) => setF(o => ({ ...o, [k]: v }));
  const x: Deal = {
    id: d?.id || '', en: f.t.trim(), bn: f.tbn.trim() || f.t.trim(),
    desc: { en: f.desc.trim(), bn: f.descbn.trim() || f.desc.trim() }, when: { en: f.when.trim(), bn: f.whenbn.trim() || f.when.trim() },
    price: Math.round(Number(f.price)) || 0, was: Math.round(Number(f.was)) || 0, p: f.p || undefined, tag: f.tag, from: f.from || undefined, to: f.to || undefined, week: d?.week,
  };
  const save = () => {
    if (!x.en || !x.price) return toast.error(t('Add the offer and the deal price.', 'অফারের নাম আর অফারের দাম দিন।'));
    if (x.was && x.was <= x.price) return toast.error(t('The usual price should be higher than the deal price.', 'সাধারণ দাম অফারের দামের চেয়ে বেশি হতে হবে।'));
    if (x.from && x.to && x.to < x.from) return toast.error(t('The last day is before the first day.', 'শেষ দিন প্রথম দিনের আগে পড়েছে।'));
    if (x.to && x.to < today()) return toast.error(t('The last day has already passed.', 'শেষ দিন পার হয়ে গেছে।'));
    const o: Deal = { ...x, id: x.id || newId('deal') };
    (['from', 'to', 'week', 'p'] as const).forEach(k => { if (!o[k]) delete o[k]; });
    if (!o.was) delete (o as Partial<Deal>).was;
    if (!f.on) o.off = true;
    const nr = clone(r); nr.deals = nr.deals || [];
    if (isNew) nr.deals.push(o); else nr.deals = nr.deals.map(z => (z.id === d!.id ? o : z));
    if (saved(nr, { en: `${isNew ? 'Added' : 'Updated'} deal: ${o.en}`, bn: `অফার ${isNew ? 'যোগ করেছেন' : 'বদলেছেন'}: ${o.bn}` },
      o.off ? { en: 'Deal saved and paused.', bn: 'অফার রাখা হয়েছে, থামানো আছে।' } : { en: 'Deal is live on khabo.', bn: 'অফারটি খাবোতে দেখা যাচ্ছে।' })) onClose();
  };
  const remove = async () => {
    if (!d || !await confirm({ title: t('Delete this deal?', 'এই অফার মুছবেন?'), text: t('It disappears from your page and the Deals page.', 'এটা আপনার পেজ আর অফার পেজ থেকে চলে যাবে।'), ok: t('Delete', 'মুছুন'), danger: true })) return;
    const nr = clone(r); nr.deals = (nr.deals || []).filter(z => z.id !== d.id);
    if (saved(nr, { en: `Deleted deal: ${d.en}`, bn: `অফার মুছেছেন: ${d.bn}` }, { en: 'Deal deleted.', bn: 'অফার মুছে ফেলা হয়েছে।' })) onClose();
  };
  return (
    <Drawer open={!!open} onClose={onClose} title={isNew ? t('Add a deal', 'অফার যোগ করুন') : t('Edit deal', 'অফার বদলান')}
      foot={<>{isNew ? null : <button className="btn danger l" onClick={remove}><Ico n="trash" sm />{t('Delete', 'মুছুন')}</button>}
        <button className={clsx('btn ghost', isNew && 'l')} onClick={onClose}>{t('Cancel', 'বাতিল')}</button>
        <button className="btn pri" onClick={save}>{isNew ? t('Add deal', 'অফার যোগ করুন') : t('Done', 'ঠিক আছে')}</button></>}>
      <div className="dish-ph">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="pcell">{f.p ? <img src={src(f.p, 300)} alt="" /> : null}</div>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}><b>{t('Deal photo', 'অফারের ছবি')}</b><span className="meta">{t('Starts with one of your dish photos. Upload your own if you like.', 'আপনার একটি খাবারের ছবি দিয়ে শুরু হয়। চাইলে নিজের ছবি দিন।')}</span>
          <button type="button" className="btn sm" onClick={async () => { const [p] = await pickPhotos(false); if (p) up('p')(p); }}><Ico n="camera" sm />{t('Replace', 'বদলান')}</button></div>
      </div>
      <div className="f-grid">
        <TextF full label={t('Offer (English)', 'অফার (ইংরেজি)')} value={f.t} onChange={up('t')} ph="e.g. Weekday lunch, 15% off" />
        <TextF full bn label={t('Offer (Bangla)', 'অফার (বাংলা)')} value={f.tbn} onChange={up('tbn')} ph="যেমন সপ্তাহের দিনের দুপুর, ১৫% ছাড়" />
        <TextF full label={t('What is included (English)', 'যা থাকছে (ইংরেজি)')} value={f.desc} onChange={up('desc')} />
        <TextF full bn label={t('What is included (Bangla)', 'যা থাকছে (বাংলা)')} value={f.descbn} onChange={up('descbn')} />
        <SelF full label={t('Kind of deal', 'অফারের ধরন')} value={f.tag} onChange={up('tag')} opts={Object.entries(C.dealTags).map(([k, v]) => [k, i.L(v)])}
          hint={d?.week ? t('This one is the khabo Deal of the week, so it shows as that.', 'এটি খাবোর সপ্তাহের অফার, তাই সেভাবেই দেখায়।') : t('Shown on the gold seal and above the price.', 'সোনালি সিলে আর দামের ওপরে দেখায়।')} />
        <TextF type="date" label={t('First day', 'প্রথম দিন')} value={f.from} onChange={up('from')} hint={t('Leave empty to start now', 'এখনই শুরু করতে খালি রাখুন')} />
        <TextF type="date" label={t('Last day', 'শেষ দিন')} value={f.to} onChange={up('to')} hint={t('Leave empty to keep it running. After this day it hides by itself.', 'চালু রাখতে খালি রাখুন। এই দিনের পরে নিজে থেকেই লুকিয়ে যাবে।')} />
        <TextF label={t('Days and times (English)', 'দিন আর সময় (ইংরেজি)')} value={f.when} onChange={up('when')} ph="Sunday to Thursday, 12pm to 4pm" />
        <TextF bn label={t('Days and times (Bangla)', 'দিন আর সময় (বাংলা)')} value={f.whenbn} onChange={up('whenbn')} />
        <MoneyF label={t('Deal price', 'অফারের দাম')} value={f.price} onChange={up('price')} />
        <MoneyF label={t('Usual price', 'সাধারণ দাম')} value={f.was} onChange={up('was')} hint={t('What it costs without the deal', 'অফার ছাড়া যে দাম')} />
        {/* the saving is worked out from the two prices, never typed in, so it is always right */}
        <SaveLine price={Number(f.price) || 0} was={Number(f.was) || 0} />
      </div>
      <div className="card" style={{ padding: '0 16px' }}><SwRow label={t('Show this deal on khabo', 'এই অফার খাবোতে দেখান')} on={f.on} onChange={up('on')} /></div>
      <p className="dw-sub">{t('Preview', 'যেমন দেখাবে')}</p>
      {x.en ? <DealLook r={r} x={x} /> : <div className="card"><Empty icon="tag" title={t('Your deal', 'আপনার অফার')}>{t('Fill in the offer to see it.', 'দেখতে অফারের নাম লিখুন।')}</Empty></div>}
    </Drawer>
  );
}
