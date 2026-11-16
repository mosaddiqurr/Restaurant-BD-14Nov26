'use client';
/* Events: live music, match screenings, iftar specials, festival menus. Each hides from diners by itself once it ends.
   Saved on the restaurant (r.events) with Save changes, then the diner pages show them. Ported from website/panel/events.js. */
import { useState } from 'react';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { src } from '@/lib/khabo';
import type { EventType, KhaboEvent } from '@/lib/data/types';
import { clone, type PR } from '@/lib/panel/store';
import { EVENT_TYPES } from '@/lib/panel/words';
import { AreaF, Drawer, Empty, Field, Ico, MoneyF, Page, SelF, TextF, confirm, pickPhotos, useR, useSaved, useT } from '../ui';

const stateOf = (ev: KhaboEvent, now = Date.now()) => { const s = +new Date(ev.start), e = +new Date(ev.end); return e < now ? 'ended' : s <= now ? 'now' : 'soon'; };
const pad = (n: number) => String(n).padStart(2, '0');
const local = (t: string | number) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function useWhen() {
  const i = useI(), t = useT();
  return (ev: KhaboEvent) => {
    const s = new Date(ev.start), e = new Date(ev.end), loc = i.bn ? 'bn-BD' : 'en-GB';
    const d = s.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' }), tm = (x: Date) => x.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
    return s.toDateString() === e.toDateString() ? `${d}, ${tm(s)} ${t('to', 'থেকে')} ${tm(e)}` : `${d} ${t('to', 'থেকে')} ${e.toLocaleDateString(loc, { day: 'numeric', month: 'short' })}`;
  };
}

export function Events() {
  const t = useT(), i = useI(), { r } = useR(), saved = useSaved(), when = useWhen();
  const [edit, setEdit] = useState<{ ev: KhaboEvent | null } | null>(null);
  const list = (r.events || []).slice().sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const live = list.filter(ev => stateOf(ev) !== 'ended'), past = list.filter(ev => stateOf(ev) === 'ended');
  const remove = async (ev: KhaboEvent) => {
    if (!await confirm({ title: t('Remove this event?', 'এই ইভেন্ট সরাবেন?'), text: t(`${ev.en} will no longer show to diners.`, `${ev.bn || ev.en} আর ডাইনারদের কাছে দেখাবে না।`), ok: t('Remove', 'সরান'), danger: true })) return;
    const nr = clone(r); nr.events = (nr.events || []).filter(x => x.id !== ev.id);
    saved(nr, { en: `Removed the event "${ev.en}"`, bn: `"${ev.bn || ev.en}" ইভেন্ট সরিয়েছেন` }, { en: 'Event removed.', bn: 'ইভেন্ট সরানো হয়েছে।' });
  };
  const row = (ev: KhaboEvent) => {
    const st = stateOf(ev), ty = EVENT_TYPES[ev.type] || EVENT_TYPES.other;
    return (
      <div key={ev.id} className={clsx('ev-row', st === 'ended' && 'ended')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="ev-ph">{ev.p ? <img src={src(ev.p, 400)} alt="" /> : <span><Ico n={ty[1]} /></span>}</div>
        <div className="ev-t"><span className="ev-type"><Ico n={ty[1]} sm />{i.L(ty[0])}</span><b>{i.bn ? ev.bn || ev.en : ev.en}</b>
          <span className="meta"><Ico n="calendar-blank" sm />{when(ev)}</span>
          <span className="meta">{ev.price ? `${t('Entry', 'এন্ট্রি')} ${i.tk(ev.price)}` : t('Free entry', 'ফ্রি এন্ট্রি')}{st === 'ended' ? ` · ${t('Ended, hidden from diners', 'শেষ, ডাইনারদের কাছে লুকানো')}` : st === 'now' ? <> · <b className="ev-now">{t('On now', 'এখন চলছে')}</b></> : ''}</span></div>
        <div className="ev-a"><button className="btn sm" onClick={() => setEdit({ ev })}><Ico n="sliders-horizontal" sm />{t('Edit', 'বদলান')}</button><button className="btn sm ghost" onClick={() => remove(ev)}><Ico n="x" sm />{t('Remove', 'সরান')}</button></div>
      </div>
    );
  };
  return (
    <Page title={t('Events', 'ইভেন্ট')}
      sub={t('Live music, match screenings, iftar specials and festival menus. They show on your page, the Events page and Home, and hide by themselves when they end. With no events, nothing shows.', 'লাইভ মিউজিক, খেলা দেখা, ইফতার স্পেশাল আর উৎসবের মেনু। এগুলো আপনার পেজ, ইভেন্ট পেজ আর হোমে দেখায়, শেষ হলে নিজেই লুকিয়ে যায়। কোনো ইভেন্ট না থাকলে কিছুই দেখায় না।')}
      acts={<button className="btn pri" onClick={() => setEdit({ ev: null })}><Ico n="plus" sm />{t('Add event', 'ইভেন্ট যোগ করুন')}</button>}>
      <div className="card"><div className="card-h"><h2>{t('Upcoming and on now', 'আসছে আর এখন চলছে')}</h2><span className="meta">{i.N(live.length)}</span></div>
        {live.length ? <div className="ev-list">{live.map(row)}</div> : <Empty icon="calendar-blank" title={t('No events yet', 'এখনো কোনো ইভেন্ট নেই')} style={{ padding: 30 }}>{t('Add one and diners will see it on your page.', 'একটি যোগ করুন, ডাইনাররা আপনার পেজে দেখতে পাবেন।')}</Empty>}</div>
      {past.length ? <div className="card" style={{ marginTop: 16 }}><div className="card-h"><h2>{t('Ended', 'শেষ হয়েছে')}</h2><span className="meta">{t('Hidden from diners', 'ডাইনারদের কাছে লুকানো')}</span></div><div className="ev-list">{past.map(row)}</div></div> : null}
      <EventEdit open={edit} onClose={() => setEdit(null)} />
    </Page>
  );
}

type F = { en: string; bn: string; type: EventType; start: string; end: string; price: string; desc: string; descbn: string; p: string | null; extra: string[] };
const toF = (ev: KhaboEvent | null): F => {
  const s = ev ? ev.start : Date.now() + 2 * 864e5, e = ev ? ev.end : Date.now() + 2 * 864e5 + 3 * 36e5;
  return { en: ev?.en || '', bn: ev?.bn || '', type: ev?.type || 'music', start: local(s), end: local(e), price: ev?.price ? String(ev.price) : '', desc: ev?.desc?.en || '', descbn: ev?.desc?.bn || '', p: ev?.p || null, extra: [] };
};
function EventEdit({ open, onClose }: { open: { ev: KhaboEvent | null } | null; onClose: () => void }) {
  const i = useI(), t = useT(), { r } = useR(), saved = useSaved();
  const [f, setF] = useState<F>(() => toF(null)), [err, setErr] = useState('');
  const [last, setLast] = useState<typeof open>(null);
  if (open && open !== last) { setLast(open); setF(toF(open.ev)); setErr(''); }
  const ev = (open || last)?.ev || null, isNew = !ev;
  const up = <K extends keyof F>(k: K) => (v: F[K]) => setF(o => ({ ...o, [k]: v }));
  const pics = Array.from(new Set([...(r.hero || []), ...(r.gallery?.inside || []), ...(r.gallery?.food || []), ...(f.p && !String(f.p).startsWith('data:') ? [f.p] : []), ...f.extra])).slice(0, 10);
  const save = () => {
    const s = +new Date(f.start), e = +new Date(f.end);
    const bad = !f.en.trim() ? t('Add a title in English.', 'ইংরেজিতে শিরোনাম দিন।') : !s || !e ? t('Add a start and an end time.', 'শুরু আর শেষের সময় দিন।')
      : e <= s ? t('The end must be after the start.', 'শেষের সময় শুরুর পরে হতে হবে।') : e < Date.now() ? t('This time has already passed.', 'এই সময় পার হয়ে গেছে।') : '';
    if (bad) { setErr(bad); return; }
    const o: KhaboEvent = { id: ev?.id || `${f.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36).slice(-4)}`, en: f.en.trim(), bn: f.bn.trim() || f.en.trim(), type: f.type, start: f.start, end: f.end, desc: { en: '', bn: '' } };
    if (f.p) o.p = f.p;
    const price = Math.round(Number(f.price)); if (price > 0) o.price = price;
    if (f.desc.trim() || f.descbn.trim()) o.desc = { en: f.desc.trim() || f.descbn.trim(), bn: f.descbn.trim() || f.desc.trim() };
    const nr: PR = clone(r);
    nr.events = (nr.events || []).filter(x => x.id !== o.id).concat(o).sort((a, b) => +new Date(a.start) - +new Date(b.start));
    if (saved(nr, { en: `${isNew ? 'Added' : 'Edited'} the event "${o.en}"`, bn: `"${o.bn}" ইভেন্ট ${isNew ? 'যোগ করেছেন' : 'বদলেছেন'}` },
      isNew ? { en: 'Event added. Diners can see it now.', bn: 'ইভেন্ট যোগ হয়েছে। ডাইনাররা এখন দেখতে পাবেন।' } : { en: 'Event saved.', bn: 'ইভেন্ট রাখা হয়েছে।' })) onClose();
  };
  return (
    <Drawer open={!!open} onClose={onClose} title={isNew ? t('Add an event', 'ইভেন্ট যোগ করুন') : t('Edit event', 'ইভেন্ট বদলান')}
      foot={<><button className="btn ghost l" onClick={onClose}>{t('Cancel', 'বাতিল')}</button><button className="btn pri" onClick={save}>{isNew ? t('Add event', 'ইভেন্ট যোগ করুন') : t('Done', 'ঠিক আছে')}</button></>}>
      <div className="f-grid">
        <TextF label={t('Title (English)', 'শিরোনাম (ইংরেজি)')} value={f.en} onChange={up('en')} req ph="e.g. Acoustic Friday on the roof" />
        <TextF bn label={t('Title (Bangla)', 'শিরোনাম (বাংলা)')} value={f.bn} onChange={up('bn')} ph="যেমন ছাদে অ্যাকোস্টিক শুক্রবার" />
      </div>
      <SelF label={t('Type', 'ধরন')} value={f.type} onChange={v => up('type')(v as EventType)} opts={(Object.keys(EVENT_TYPES) as EventType[]).map(k => [k, i.L(EVENT_TYPES[k][0])])} />
      <div className="f-grid">
        <TextF type="datetime-local" label={t('Starts', 'শুরু')} value={f.start} onChange={up('start')} req />
        <TextF type="datetime-local" label={t('Ends', 'শেষ')} value={f.end} onChange={up('end')} req hint={t('It hides from diners after this.', 'এর পরে ডাইনারদের কাছে লুকিয়ে যাবে।')} />
      </div>
      <MoneyF label={t('Entry price (optional)', 'এন্ট্রি দাম (ঐচ্ছিক)')} value={f.price} onChange={up('price')} hint={t('Leave empty for free entry.', 'ফ্রি হলে খালি রাখুন।')} />
      <div className="f-grid">
        <AreaF label={t('Short note (English, optional)', 'ছোট বিবরণ (ইংরেজি, ঐচ্ছিক)')} value={f.desc} onChange={up('desc')} rows={2} />
        <AreaF bn label={t('Short note (Bangla, optional)', 'ছোট বিবরণ (বাংলা, ঐচ্ছিক)')} value={f.descbn} onChange={up('descbn')} rows={2} />
      </div>
      <Field label={t('Photo', 'ছবি')} hint={t('A real photo of your place or the event. No AI images.', 'আপনার জায়গা বা ইভেন্টের আসল ছবি। এআই ছবি নয়।')}>
        <div className="ev-pick">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pics.map(p => <button key={p} type="button" className={f.p === p ? 'on' : ''} onClick={() => up('p')(p)}><img src={src(p, 160)} alt="" /></button>)}
          <button type="button" className="ev-up" onClick={async () => { const [p] = await pickPhotos(false); if (p) setF(o => ({ ...o, p, extra: [...o.extra, p] })); }}><Ico n="camera" /><span>{t('Upload', 'আপলোড')}</span></button>
        </div>
      </Field>
      {err ? <p className="err" role="alert">{err}</p> : null}
    </Drawer>
  );
}
