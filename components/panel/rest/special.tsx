'use client';
/* Today's special, at the top of Menu & prices. The owner (or the khabo team, on the same page) picks a few dishes
   from this menu; diners see them at the top of the menu on the restaurant page and on the table QR menu, at the
   normal menu price. "Today only" hides by itself after midnight (Dhaka time), so diners never see a special from
   yesterday. Saved on the restaurant (r.special) with Save changes, like every other menu change. */
import { useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { SPECIAL_MAX, dhakaDay, specialOf, specialOn } from '@/lib/special';
import { clone, type PDish } from '@/lib/panel/store';
import { AreaF, Drawer, Ico, Seg, Thumb, useR, useSaved, useT } from '../ui';

type Keep = 'today' | 'always';

export function SpecialBox() {
  const i = useI(), t = useT(), { r } = useR(), saved = useSaved();
  const [open, setOpen] = useState(false);
  const day = dhakaDay();
  const list = specialOf(r, day), on = specialOn(r, day);
  const s = r.special, ended = !!s && s.ids.length > 0 && !on;
  const stop = () => {
    const nr = clone(r); delete nr.special;
    saved(nr, { en: "Turned off today's special", bn: 'আজকের স্পেশাল বন্ধ করেছেন' }, { en: "Today's special is off.", bn: 'আজকের স্পেশাল বন্ধ।' });
  };
  const drop = (d: PDish) => {
    const nr = clone(r), ids = (nr.special?.ids || []).filter(x => x !== d.id);
    if (ids.length) nr.special = { ...nr.special!, ids }; else delete nr.special;
    saved(nr, { en: `Took ${d.name.en} off today's special`, bn: `${d.name.bn} আজকের স্পেশাল থেকে সরিয়েছেন` });
  };
  const status = on
    ? (s?.until ? t('Showing today. It hides by itself after midnight.', 'আজ দেখাচ্ছে। মাঝরাতের পর নিজেই লুকিয়ে যাবে।') : t('Showing every day until you change it.', 'আপনি না বদলানো পর্যন্ত প্রতিদিন দেখাচ্ছে।'))
    : ended ? t('Yesterday\'s special has ended and is hidden from diners. Pick today\'s.', 'গতকালের স্পেশাল শেষ, ডাইনারদের কাছে লুকানো। আজকেরটা বেছে নিন।')
      : t('Pick a few dishes to show first on your menu and your table QR menu.', 'কয়েকটি খাবার বেছে নিন, আপনার মেনু আর টেবিলের কিউআর মেনুতে সবার আগে দেখাবে।');
  return (
    <div className={clsx('card spc', on && 'on')}>
      <div className="spc-h">
        <span className="spc-i"><Ico n="star" f={on} /></span>
        <div className="spc-t"><b>{t("Today's special", 'আজকের স্পেশাল')}</b><span className="meta">{status}</span></div>
        <div className="spc-a">
          {on ? <button className="btn sm ghost" onClick={stop}><Ico n="x" sm />{t('Turn off', 'বন্ধ করুন')}</button> : null}
          <button className={clsx('btn sm', !on && 'pri')} onClick={() => setOpen(true)}><Ico n={on ? 'sliders-horizontal' : 'plus'} sm />{on ? t('Change', 'বদলান') : t('Choose dishes', 'খাবার বাছুন')}</button>
        </div>
      </div>
      {on ? <>
        {s?.note ? <p className="spc-note">{i.L(s.note)}</p> : null}
        <div className="spc-list">
          {list.map(d => (
            <div key={d.id} className={clsx('spc-d', d.out && 'out')}>
              <Thumb p={d.p} word={d.name.en} />
              <span className="spc-n"><b>{i.L(d.name)}</b><span className="meta">{d.out ? t('Sold out, shown as sold out', 'শেষ, শেষ বলেই দেখাচ্ছে') : d.sizes?.length ? t(`From ${i.tk(Math.min(...d.sizes.map(z => z.price)))}`, `${i.tk(Math.min(...d.sizes.map(z => z.price)))} থেকে`) : i.tk(d.price)}</span></span>
              <button className="ibtn sm" onClick={() => drop(d)} aria-label={t(`Take ${d.name.en} off the special`, `${d.name.bn} স্পেশাল থেকে সরান`)}><Ico n="x" sm /></button>
            </div>
          ))}
        </div>
      </> : null}
      <SpecialEdit open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function SpecialEdit({ open, onClose }: { open: boolean; onClose: () => void }) {
  const i = useI(), t = useT(), { r } = useR(), saved = useSaved();
  const [ids, setIds] = useState<string[]>([]), [keep, setKeep] = useState<Keep>('today'), [en, setEn] = useState(''), [bn, setBn] = useState(''), [q, setQ] = useState('');
  const [was, setWas] = useState(false);
  /* fill the form each time it opens: the dishes showing now, or a fresh pick */
  if (open && !was) {
    setWas(true);
    const on = specialOn(r);
    setIds(on ? specialOf(r).map(d => d.id) : []);
    setKeep(on && r.special && !r.special.until ? 'always' : 'today');
    setEn(on ? r.special?.note?.en || '' : ''); setBn(on ? r.special?.note?.bn || '' : ''); setQ('');
  }
  if (!open && was) setWas(false);
  const qq = q.trim().toLowerCase();
  const flip = (id: string) => setIds(a => {
    if (a.includes(id)) return a.filter(x => x !== id);
    if (a.length >= SPECIAL_MAX) { toast.error(t(`Pick up to ${SPECIAL_MAX} dishes. A short list feels more special.`, `সর্বোচ্চ ${i.N(SPECIAL_MAX)}টি খাবার বাছুন। ছোট তালিকাই বেশি স্পেশাল লাগে।`)); return a; }
    return [...a, id];
  });
  const save = () => {
    if (!ids.length) return toast.error(t('Pick at least one dish, or use Turn off.', 'অন্তত একটি খাবার বাছুন, অথবা "বন্ধ করুন" চাপুন।'));
    const nr = clone(r);
    const note = en.trim() || bn.trim() ? { en: en.trim() || bn.trim(), bn: bn.trim() || en.trim() } : undefined;
    nr.special = { ids, until: keep === 'today' ? dhakaDay() : null, ...(note ? { note } : {}) };
    const names = ids.map(id => r.menu.find(d => d.id === id)?.name.en).filter(Boolean).join(', ');
    if (saved(nr, { en: `Set today's special: ${names}`, bn: 'আজকের স্পেশাল ঠিক করেছেন' },
      keep === 'today' ? { en: "Today's special is set. It hides by itself after midnight.", bn: 'আজকের স্পেশাল ঠিক হয়েছে। মাঝরাতের পর নিজেই লুকিয়ে যাবে।' }
        : { en: "Today's special is set. It shows every day until you change it.", bn: 'আজকের স্পেশাল ঠিক হয়েছে। আপনি না বদলানো পর্যন্ত প্রতিদিন দেখাবে।' })) onClose();
  };
  return (
    <Drawer open={open} onClose={onClose} title={t("Today's special", 'আজকের স্পেশাল')}
      foot={<><button className="btn ghost l" onClick={onClose}>{t('Cancel', 'বাতিল')}</button>
        <button className="btn pri" onClick={save}>{ids.length ? t(`Show ${ids.length} dish${ids.length === 1 ? '' : 'es'}`, `${i.N(ids.length)}টি খাবার দেখান`) : t('Show', 'দেখান')}</button></>}>
      <p className="meta">{t('Diners see these first, on your menu and on your table QR menu, at their normal menu price. To give money off, add a deal instead.', 'ডাইনাররা এগুলো সবার আগে দেখবেন, আপনার মেনু আর টেবিলের কিউআর মেনুতে, মেনুর স্বাভাবিক দামে। দাম কমাতে চাইলে ডিল যোগ করুন।')}</p>
      <div className="stack" style={{ gap: 8 }}>
        <b>{t('How long', 'কতদিন')}</b>
        <Seg<Keep> value={keep} onChange={setKeep} items={[['today', t('Today only', 'শুধু আজ')], ['always', t('Every day until I change it', 'না বদলানো পর্যন্ত প্রতিদিন')]]} />
      </div>
      <div className="f-grid">
        <AreaF label={t('Short note (English, optional)', 'ছোট কথা (ইংরেজি, ঐচ্ছিক)')} value={en} onChange={setEn} rows={2} ph="e.g. Fresh hilsa from Chandpur today" />
        <AreaF bn label={t('Short note (Bangla, optional)', 'ছোট কথা (বাংলা, ঐচ্ছিক)')} value={bn} onChange={setBn} rows={2} ph="যেমন আজ চাঁদপুরের তাজা ইলিশ" />
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <b>{t(`Dishes (${ids.length} of up to ${SPECIAL_MAX})`, `খাবার (সর্বোচ্চ ${i.N(SPECIAL_MAX)}টির মধ্যে ${i.N(ids.length)}টি)`)}</b>
        <div className="search"><Ico n="magnifying-glass" sm /><input className="inp" type="search" placeholder={t('Search your menu', 'আপনার মেনুতে খুঁজুন')} value={q} onChange={e => setQ(e.target.value)} aria-label={t('Search your menu', 'আপনার মেনুতে খুঁজুন')} /></div>
        {r.cats.map(c => {
          const ds = r.menu.filter(d => d.cat === c.id && (!qq || (d.name.en + ' ' + d.name.bn).toLowerCase().includes(qq)));
          if (!ds.length) return null;
          return (
            <div key={c.id} className="spc-g">
              <span className="meta">{i.L(c)}</span>
              {ds.map(d => {
                const k = ids.indexOf(d.id);
                return (
                  <button key={d.id} type="button" className={clsx('spc-pick', k >= 0 && 'on', d.out && 'out')} aria-pressed={k >= 0} onClick={() => flip(d.id)}>
                    <Thumb p={d.p} word={d.name.en} />
                    <span className="spc-n"><b>{i.L(d.name)}</b><span className="meta">{d.out ? t('Sold out today', 'আজ শেষ') : i.tk(d.price)}</span></span>
                    <span className="spc-k" aria-hidden="true">{k >= 0 ? i.N(k + 1) : <Ico n="plus" sm />}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}
