'use client';
/* Photos: cover photos (the first is the big one at the top of the page) and the gallery groups.
   Real photos only, no AI images. Ported from website/panel/rest.js (V.photos).
   Photos chosen here are shrunk and kept in this browser for the prototype; the real build uploads them to storage. */
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { src } from '@/lib/khabo';
import { clone, type PR } from '@/lib/panel/store';
import { GALLERY } from '@/lib/panel/words';
import { Ico, Page, confirm, pickPhotos, useR, useSaved, useT } from '../ui';
import type { Text } from '@/lib/data/types';

type Key = 'hero' | 'inside' | 'outside' | 'kitchen' | 'food';

export function Photos() {
  const i = useI(), t = useT(), { r } = useR(), saved = useSaved();
  const lbl: Record<Key, Text> = { hero: { en: 'cover', bn: 'কভার' }, inside: { en: 'inside', bn: 'ভেতরের' }, outside: { en: 'outside', bn: 'বাইরের' }, kitchen: { en: 'kitchen', bn: 'রান্নাঘরের' }, food: { en: 'food', bn: 'খাবারের' } };
  const arrOf = (nr: PR, k: Key) => { if (k === 'hero') return nr.hero; nr.gallery = nr.gallery || {}; return (nr.gallery[k] = nr.gallery[k] || []); };
  const add = async (k: Key) => {
    const ps = await pickPhotos(true); if (!ps.length) return;
    const nr = clone(r), a = arrOf(nr, k), room = k === 'hero' ? Math.max(0, 6 - a.length) : 30;
    const n = Math.min(room, ps.length); if (!n) return;
    a.push(...ps.slice(0, n));
    saved(nr, { en: `Added ${n} ${lbl[k].en} photo${n > 1 ? 's' : ''}`, bn: `${i.N(n)}টি ${lbl[k].bn} ছবি যোগ করেছেন` });
  };
  const mv = (k: Key, a: number, by: number) => {
    const nr = clone(r), arr = arrOf(nr, k), b = a + by; [arr[a], arr[b]] = [arr[b], arr[a]];
    saved(nr, { en: `Reordered ${lbl[k].en} photos`, bn: `${lbl[k].bn} ছবির ক্রম বদলেছেন` }, { en: 'Order saved.', bn: 'ক্রম রাখা হয়েছে।' });
  };
  const del = async (k: Key, a: number) => {
    if (k === 'hero' && r.hero.length <= 1) { toast.error(t('Keep at least one cover photo.', 'অন্তত একটি কভার ছবি রাখুন।')); return; }
    if (!await confirm({ title: t('Remove this photo?', 'এই ছবি সরাবেন?'), text: t('It will no longer show on your page.', 'এটা আর আপনার পেজে দেখাবে না।'), ok: t('Remove', 'সরান'), danger: true })) return;
    const nr = clone(r); arrOf(nr, k).splice(a, 1);
    saved(nr, { en: `Removed a ${lbl[k].en} photo`, bn: `একটি ${lbl[k].bn} ছবি সরিয়েছেন` }, { en: 'Photo removed.', bn: 'ছবি সরানো হয়েছে।' });
  };
  const grid = (k: Key, arr: string[], cover?: boolean) => (
    <div className="pgrid">
      {arr.map((p, a) => (
        <div key={p.slice(0, 64) + a} className="pcell">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(p, 400)} alt="" loading="lazy" />
          {cover ? <span className="pc-n">{a === 0 ? t('Main', 'প্রধান') : i.N(a + 1)}</span> : null}
          <div className="pc-tools">
            {a > 0 ? <button onClick={() => mv(k, a, -1)} aria-label={t('Move earlier', 'আগে নিন')}><Ico n="arrow-left" sm /></button> : null}
            {a < arr.length - 1 ? <button onClick={() => mv(k, a, 1)} aria-label={t('Move later', 'পরে নিন')}><Ico n="arrow-right" sm /></button> : null}
            {k === 'hero' && arr.length <= 1 ? null : <button className="del" onClick={() => del(k, a)} aria-label={t('Remove photo', 'ছবি সরান')}><Ico n="x" sm /></button>}
          </div>
        </div>
      ))}
      {k !== 'hero' || arr.length < 6 ? <button className="pcell add" onClick={() => add(k)}><span><Ico n="plus" />{t('Add photos', 'ছবি যোগ করুন')}</span></button> : null}
    </div>
  );
  const tour = r.tour || [];
  return (
    <Page title={t('Photos', 'ছবি')} sub={t('The first cover photo is the big one at the top of your page.', 'প্রথম কভার ছবিটি আপনার পেজের ওপরে বড় করে দেখায়।')}>
      <div className="card"><div className="card-h"><h2>{t('Cover photos', 'কভার ছবি')}</h2><span className="meta">{t(`${r.hero.length} of 6`, `৬টির মধ্যে ${i.N(r.hero.length)}টি`)}</span></div><div className="card-b">{grid('hero', r.hero, true)}</div></div>
      {GALLERY.map(([k, l]) => {
        const arr = r.gallery?.[k] || [];
        return <div key={k} className="card" style={{ marginTop: 16 }}><div className="card-h"><h2>{i.L(l)}</h2><span className="meta">{t(`${arr.length} photos`, `${i.N(arr.length)}টি ছবি`)}</span></div><div className="card-b">{grid(k, arr)}</div></div>;
      })}
      <div className="alert info" style={{ marginTop: 16 }}><Ico n="cube" /><div><b>{t('360° tour and film', '৩৬০° ট্যুর আর ভিডিও')}</b>
        <div className="meta">{tour.length ? t(`Your tour has ${tour.length} room${tour.length > 1 ? 's' : ''}: ${tour.map(x => x.en).join(', ')}.`, `আপনার ট্যুরে ${i.N(tour.length)}টি ঘর: ${tour.map(x => x.bn || x.en).join(', ')}।`) : t('No 360° tour yet.', 'এখনো ৩৬০° ট্যুর নেই।')}{' '}
          {r.film ? t('Your page has a short film.', 'আপনার পেজে একটি ছোট ভিডিও আছে।') : ''} {t('The khabo team films these; ask us to reshoot any time.', 'এগুলো খাবো টিম ধারণ করে; যেকোনো সময় আবার ধারণ করতে বলুন।')}</div></div></div>
    </Page>
  );
}
