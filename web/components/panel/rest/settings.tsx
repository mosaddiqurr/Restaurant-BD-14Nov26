'use client';
/* Admin settings for one restaurant: the khabo team's tab. Owners never see it.
   Each card shows only to the levels that may use it: visibility and labels, web address and cuisine,
   360 tour and film (rest.admin), plan (billing), sign-in accounts (users.rest), delete (rest.delete).
   Ported from website/panel/rest.js (V.settings). */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { C, headDeal, src } from '@/lib/khabo';
import type { Plan, TourRoom } from '@/lib/data/types';
import { DOMAIN, allR, billOf, can, clone, deleteR, levelName, type PR } from '@/lib/panel/store';
import { BILL_STATUS, PLANS } from '@/lib/panel/words';
import { bnN } from '@/lib/panel/admin';
import { InviteCard, UserModal, type Invite } from '../users';
import { Av, Empty, Ico, Page, SelF, SwRow, confirm, useR, useSaved, useT } from '../ui';
import '@/styles/panel-admin.css';

const thumbOf = (x: TourRoom) => x.thumb || x.img || `/media/360/${x.pano}-s.jpg`;
/** a photo made smaller (wide side at most w pixels) as a JPEG data URL */
const shrink = (dataUrl: string, w: number, q = 0.82) => new Promise<string>((res, rej) => {
  const im = new Image();
  im.onload = () => { const k = Math.min(1, w / im.width), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q)); };
  im.onerror = rej; im.src = dataUrl;
});
const pickFile = (accept: string) => new Promise<File | null>(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.onchange = () => res(inp.files?.[0] || null); inp.click(); });

function Card({ title, right, red, children }: { title: string; right?: React.ReactNode; red?: boolean; children: React.ReactNode }) {
  return (
    <div className="card" style={red ? { borderColor: 'color-mix(in srgb, var(--red) 30%, transparent)' } : undefined}>
      <div className="card-h"><h2 style={red ? { color: 'var(--red)' } : undefined}>{title}</h2>{right ? <span className="r">{right}</span> : null}</div>
      {children}
    </div>
  );
}

/** a room's name in English and Bangla; saved when you leave the box */
function RoomName({ room, onSave }: { room: TourRoom; onSave: (en: string, bn: string) => void }) {
  const t = useT();
  const [en, setEn] = useState(room.en), [bn, setBn] = useState(room.bn);
  const done = () => { const a = en.trim(), b = bn.trim(); if (!a) { setEn(room.en); return; } if (a !== room.en || (b || a) !== room.bn) onSave(a, b || a); };
  return (
    <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <input className="inp sm" value={en} onChange={e => setEn(e.target.value)} onBlur={done} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} aria-label={t('Room name in English', 'রুমের নাম ইংরেজিতে')} lang="en" />
      <input className="inp sm bn" value={bn} onChange={e => setBn(e.target.value)} onBlur={done} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} aria-label={t('Room name in Bangla', 'রুমের নাম বাংলায়')} lang="bn" />
    </div>
  );
}

export function AdminSettings() {
  const i = useI(), t = useT(), router = useRouter(), saved = useSaved(), { r, me, db } = useR();
  const [slug, setSlug] = useState(r.slug || r.id);
  const [film, setFilm] = useState(r.film?.src || '');
  const [addU, setAddU] = useState(false);
  const [inv, setInv] = useState<Invite | null>(null);
  const accts = db.users.filter(u => u.rid === r.id), b = billOf(db, r), tour = r.tour || [], head = headDeal(r);
  const admin = can('rest.admin', me);
  const msg = (en: string, bn: string) => ({ en, bn });

  /* ---------- visibility and labels ---------- */
  const setLive = (on: boolean) => {
    const nr = clone(r); if (on) delete nr.hidden; else nr.hidden = true;
    saved(nr, on ? msg('Put the page live', 'পেজটি চালু করেছেন') : msg('Hid the page from khabo', 'পেজটি খাবো থেকে লুকিয়েছেন'), on ? msg('The page is live.', 'পেজটি চালু হয়েছে।') : msg('The page is hidden from khabo.', 'পেজটি খাবো থেকে লুকানো হয়েছে।'));
  };
  const setFlag = (k: 'featured' | 'founding', on: boolean) => {
    const nr = clone(r); if (on) nr[k] = true; else delete nr[k];
    const n = k === 'featured' ? msg('Featured', 'ফিচার্ড') : msg('Founding Partner', 'ফাউন্ডিং পার্টনার');
    saved(nr, on ? msg(`Turned on ${n.en}`, `${n.bn} চালু করেছেন`) : msg(`Turned off ${n.en}`, `${n.bn} বন্ধ করেছেন`), msg('Saved.', 'রাখা হয়েছে।'));
  };
  /* only one restaurant has the deal of the week at a time: saving takes it off the others */
  const setWeek = (on: boolean) => {
    const nr = clone(r); (nr.deals || []).forEach(d => { delete d.week; });
    if (on && head) { const d = (nr.deals || []).find(z => z.id === head.id); if (d) d.week = true; }
    saved(nr, on ? msg(`Made “${head?.en}” the deal of the week`, `“${head?.bn || head?.en}” সপ্তাহের অফার করেছেন`) : msg('Removed it as deal of the week', 'সপ্তাহের অফার থেকে সরিয়েছেন'), msg('Saved.', 'রাখা হয়েছে।'));
  };

  /* ---------- web address and cuisine ---------- */
  const saveSlug = () => {
    const v = slug.trim().toLowerCase(), cur = r.slug || r.id;
    if (v === cur) return toast(t('That is already the address.', 'এটাই এখনকার ঠিকানা।'));
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) || v.length < 3 || v.length > 40) return toast.error(t('Use 3 to 40 small letters, numbers and single dashes.', '৩ থেকে ৪০টি ছোট অক্ষর, সংখ্যা আর একক ড্যাশ ব্যবহার করুন।'));
    if (allR(db).some(x => x.id !== r.id && (x.id === v || x.slug === v || (x.oldSlugs || []).includes(v)))) return toast.error(t('Another restaurant already uses that address.', 'অন্য একটি রেস্টুরেন্ট এই ঠিকানা ব্যবহার করছে।'));
    const nr = clone(r);
    nr.oldSlugs = [...new Set([...(r.oldSlugs || []), cur])].filter(x => x !== v && x !== r.id);
    if (!nr.oldSlugs.length) delete nr.oldSlugs;
    if (v === r.id) delete nr.slug; else nr.slug = v;
    saved(nr, msg(`Changed the web address to ${DOMAIN}/${v}`, `ওয়েব ঠিকানা বদলে ${DOMAIN}/${v} করেছেন`), msg(`New address: ${DOMAIN}/${v}. The old one still works.`, `নতুন ঠিকানা: ${DOMAIN}/${v}। পুরোনোটিও কাজ করবে।`));
  };
  const togCu = (id: string) => {
    const list = (r.cuisines || []).includes(id) ? r.cuisines.filter(x => x !== id) : [...(r.cuisines || []), id];
    if (!list.length) return toast.error(t('Keep at least one cuisine.', 'অন্তত একটি রান্নার ধরন রাখুন।'));
    const nr = clone(r); nr.cuisines = list;
    const names = list.map(k => C.cuisines.find(c => c.id === k)).filter(Boolean);
    saved(nr, msg(`Set the cuisine to ${names.map(c => c!.en).join(', ')}`, `রান্নার ধরন ঠিক করেছেন: ${names.map(c => c!.bn).join(', ')}`), msg('Cuisine saved.', 'রান্নার ধরন রাখা হয়েছে।'));
  };

  /* ---------- 360 tour ---------- */
  const withTour = (fn: (list: TourRoom[], nr: PR) => void) => { const nr = clone(r); nr.tour = nr.tour || []; fn(nr.tour, nr); if (!nr.tour.length) delete nr.tour; return nr; };
  const moveRoom = (k: number, d: number) => saved(withTour(list => { list.splice(k + d, 0, list.splice(k, 1)[0]); }), msg('Reordered the 360 tour', '৩৬০ ট্যুরের ক্রম বদলেছেন'), msg('Order saved. The first room opens first.', 'ক্রম রাখা হয়েছে। প্রথম রুমটি আগে খোলে।'));
  const renameRoom = (k: number, en: string, bn: string) => saved(withTour(list => { list[k] = { ...list[k], en, bn }; }), msg(`Renamed a 360 room to ${en}`, `৩৬০ রুমের নাম বদলে ${bn} করেছেন`), msg('Room name saved.', 'রুমের নাম রাখা হয়েছে।'));
  const removeRoom = async (k: number) => {
    const room = tour[k];
    if (!await confirm({ title: t(`Remove ${room.en}?`, `${room.bn || room.en} সরাবেন?`), text: t('It leaves the 360 tour on the page.', 'এটি পেজের ৩৬০ ট্যুর থেকে চলে যাবে।'), ok: t('Remove room', 'রুম সরান'), danger: true })) return;
    saved(withTour(list => { list.splice(k, 1); list.forEach(x => { x.spots = (x.spots || []).filter(s => s.to !== room.id); }); }),
      msg(`Removed the 360 room ${room.en}`, `৩৬০ রুম ${room.bn || room.en} সরিয়েছেন`), msg('Room removed.', 'রুম সরানো হয়েছে।'));
  };
  const addRoom = async () => {
    const f = await pickFile('image/*'); if (!f) return;
    const data = await new Promise<string>((res, rej) => { const rd = new FileReader(); rd.onload = () => res(String(rd.result)); rd.onerror = rej; rd.readAsDataURL(f); }).catch(() => '');
    if (!data) return toast.error(t('Could not read that photo.', 'ছবিটি পড়া গেল না।'));
    const ratio = await new Promise<number>(res => { const im = new Image(); im.onload = () => res(im.width / im.height); im.onerror = () => res(0); im.src = data; });
    if (!ratio) return toast.error(t('Could not read that photo.', 'ছবিটি পড়া গেল না।'));
    if (ratio < 1.9 || ratio > 2.1) return toast.error(t('That is not a 360° photo. It should be twice as wide as it is tall.', 'এটি ৩৬০° ছবি নয়। ছবির চওড়া উচ্চতার দ্বিগুণ হতে হবে।'));
    const img = await shrink(data, 2048), thumb = await shrink(data, 360, 0.7);
    const n = tour.length + 1, id = 'room-' + Date.now().toString(36);
    const nr = withTour(list => { list.push({ id, en: `Room ${n}`, bn: `রুম ${bnN(n)}`, pano: 'up-' + id, img, thumb, yaw: 0, spots: [] }); });
    saved(nr, msg('Added a 360 room', 'একটি ৩৬০ রুম যোগ করেছেন'), msg('Room added. Give it a name.', 'রুম যোগ হয়েছে। একটি নাম দিন।'));
  };

  /* ---------- film ---------- */
  const saveFilm = () => {
    const v = film.trim(), nr = clone(r);
    if (!v) { if (!r.film) return; delete nr.film; saved(nr, msg('Removed the film', 'ভিডিও সরিয়েছেন'), msg('Film removed.', 'ভিডিও সরানো হয়েছে।')); return; }
    let u: URL; try { u = new URL(v); } catch { return toast.error(t('That is not a link.', 'এটি কোনো লিংক নয়।')); }
    if (u.protocol !== 'https:' || (!/\.(mp4|webm)(\?|$)/i.test(u.pathname + u.search) && !/videos\.pexels\.com|player\.vimeo\.com/.test(u.hostname))) return toast.error(t('Use an https link to an MP4 or WebM file.', 'একটি MP4 বা WebM ফাইলের https লিংক দিন।'));
    nr.film = { ...r.film, src: u.href, poster: r.film?.poster || r.hero[0], len: r.film?.len || '0:15' };
    saved(nr, msg('Changed the film', 'ভিডিও বদলেছেন'), msg('Film saved.', 'ভিডিও রাখা হয়েছে।'));
  };
  const filmOff = async () => {
    if (!await confirm({ title: t('Remove the film?', 'ভিডিও সরাবেন?'), text: t('The page will open with its cover photos.', 'পেজটি কভার ছবি দিয়ে খুলবে।'), ok: t('Remove', 'সরান'), danger: true })) return;
    const nr = clone(r); delete nr.film; if (saved(nr, msg('Removed the film', 'ভিডিও সরিয়েছেন'), msg('Film removed.', 'ভিডিও সরানো হয়েছে।'))) setFilm('');
  };

  /* ---------- delete ---------- */
  const del = async () => {
    if (!await confirm({ title: t(`Delete ${r.name.en}?`, `${r.name.bn} মুছবেন?`), text: t('The page, menu and deals leave khabo and its accounts are turned off. This cannot be undone.', 'পেজ, মেনু আর অফার খাবো থেকে চলে যাবে, আর এর অ্যাকাউন্টগুলো বন্ধ হবে। এটা ফেরানো যাবে না।'), ok: t('Delete restaurant', 'রেস্টুরেন্ট মুছুন'), danger: true })) return;
    const name = r.name;
    if (!deleteR(r.id)) return;
    toast.success(t(`${name.en} was deleted.`, `${name.bn} মুছে ফেলা হয়েছে।`));
    router.push(`/${i.lang}/admin/restaurants`);
  };

  const st = BILL_STATUS[b.status];
  return (
    <Page title={t('Admin settings', 'অ্যাডমিন সেটিংস')} sub={t('Only the khabo team sees this tab. Owners cannot change anything here.', 'এই ট্যাব শুধু খাবো টিম দেখে। মালিকেরা এখানে কিছু বদলাতে পারেন না।')}
      acts={<span className="badge ind">{i.L(levelName(me))}</span>}>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        {admin ? (
          <Card title={t('Visibility and labels', 'দেখা যাবে কি না, আর লেবেল')}>
            <div className="card-b" style={{ paddingTop: 4, paddingBottom: 4 }}>
              <SwRow label={t('Live on khabo', 'খাবোতে চালু')} hint={t('Off hides the page, its dishes and its deals from the whole site', 'বন্ধ করলে পেজ, এর খাবার আর অফার পুরো সাইট থেকে লুকানো থাকে')} on={!r.hidden} onChange={setLive} />
              <SwRow label={t('Featured', 'ফিচার্ড')} hint={t('Shown first in lists, with a “Featured” label', 'তালিকায় আগে দেখায়, “ফিচার্ড” লেবেলসহ')} on={!!r.featured} onChange={v => setFlag('featured', v)} />
              <SwRow label={t('Founding Partner', 'ফাউন্ডিং পার্টনার')} hint={t('One of the first 50 restaurants', 'প্রথম ৫০টি রেস্টুরেন্টের একটি')} on={!!r.founding} onChange={v => setFlag('founding', v)} />
              {head ? <SwRow label={t('Deal of the week', 'সপ্তাহের অফার')} hint={t(`Puts “${head.en}” on the home page. Only one restaurant at a time.`, `“${head.bn || head.en}” হোম পেজে দেখায়। একবারে শুধু একটি রেস্টুরেন্ট।`)} on={!!head.week} onChange={setWeek} /> : null}
            </div>
          </Card>
        ) : null}
        {admin ? (
          <Card title={t('Web address and cuisine', 'ওয়েব ঠিকানা আর রান্নার ধরন')}>
            <div className="card-b stack">
              <div className="field"><label htmlFor="st-slug">{t('Web address', 'ওয়েব ঠিকানা')}</label>
                <div className="addr-in"><span>{DOMAIN}/</span><input className="inp" id="st-slug" value={slug} onChange={e => setSlug(e.target.value)} autoCapitalize="off" spellCheck={false} /></div>
                <span className="hint">{t('Small letters, numbers and dashes. Old addresses keep working, so printed QR codes never break.', 'ছোট অক্ষর, সংখ্যা আর ড্যাশ। পুরোনো ঠিকানাও কাজ করে, তাই ছাপা কিউআর কোড কখনো নষ্ট হয় না।')}
                  {(r.oldSlugs || []).length ? ` ${t('Old:', 'পুরোনো:')} ${r.oldSlugs!.join(', ')}` : ''}</span></div>
              <button type="button" className="btn sm" style={{ justifySelf: 'start' }} onClick={saveSlug}>{t('Use this address', 'এই ঠিকানা নিন')}</button>
              <div className="field"><span className="lbl">{t('Cuisine', 'রান্নার ধরন')}</span>
                <div className="tchips">{C.cuisines.map(c => <button key={c.id} type="button" className={clsx('tchip', (r.cuisines || []).includes(c.id) && 'on')} aria-pressed={(r.cuisines || []).includes(c.id)} onClick={() => togCu(c.id)}>{i.L(c)}</button>)}</div>
                <span className="hint">{t('Diners filter by these. Press Save changes to put them live.', 'ডাইনাররা এগুলো দিয়ে ছাঁকেন। চালু করতে "বদল রাখুন" চাপুন।')}</span></div>
            </div>
          </Card>
        ) : null}
        {admin ? (
          <Card title={t('360° tour', '৩৬০° ট্যুর')} right={<span className="meta">{t(`${tour.length} room${tour.length === 1 ? '' : 's'}`, `${i.N(tour.length)}টি রুম`)}</span>}>
            <div className="rows">
              {tour.length ? tour.map((x, k) => (
                <div className="row tour-row" key={x.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="thumb" src={thumbOf(x)} alt="" />
                  <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                    <RoomName room={x} onSave={(en, bn) => renameRoom(k, en, bn)} />
                    <span className="meta">{x.img ? t('Uploaded here', 'এখানে আপলোড করা') : t('Shot by the khabo team', 'খাবো টিমের তোলা')}{x.day ? t(' · day and night', ' · দিন আর রাত') : ''}</span>
                  </div>
                  <span className="ro-b">
                    <button type="button" className="ibtn sm" disabled={!k} onClick={() => moveRoom(k, -1)} aria-label={t('Move up', 'ওপরে নিন')}><Ico n="caret-up" sm /></button>
                    <button type="button" className="ibtn sm" disabled={k >= tour.length - 1} onClick={() => moveRoom(k, 1)} aria-label={t('Move down', 'নিচে নিন')}><Ico n="caret-down" sm /></button>
                    <button type="button" className="ibtn sm" onClick={() => removeRoom(k)} aria-label={t('Remove room', 'রুম সরান')}><Ico n="x" sm /></button>
                  </span>
                </div>
              )) : <Empty icon="virtual-reality" title={t('No tour yet', 'এখনো ট্যুর নেই')} style={{ padding: 22 }}>{t('Add a room from a 360° photo.', 'একটি ৩৬০° ছবি থেকে রুম যোগ করুন।')}</Empty>}
            </div>
            <div className="card-b" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="btn sm" onClick={addRoom}><Ico n="plus" sm />{t('Add a room from a 360° photo', '৩৬০° ছবি থেকে রুম যোগ করুন')}</button>
              <span className="meta">{t('A 2:1 photo from a 360° camera. It is made smaller to fit this prototype.', '৩৬০° ক্যামেরার ২:১ ছবি। এই প্রোটোটাইপে আঁটাতে ছোট করা হয়।')}</span>
            </div>
          </Card>
        ) : null}
        {admin ? (
          <Card title={t('Restaurant film', 'রেস্টুরেন্টের ভিডিও')}>
            <div className="card-b stack">
              {r.film ? (
                <div className="film-row">
                  <video src={r.film.src} poster={src(r.film.poster, 400)} muted playsInline preload="metadata" />
                  <div><b>{t('Film is on', 'ভিডিও চালু আছে')}</b><span className="meta">{r.film.len ? i.dg(r.film.len) + ' · ' : ''}{t('plays at the top of the page', 'পেজের ওপরে চলে')}</span></div>
                  <button type="button" className="btn sm danger" onClick={filmOff}>{t('Remove', 'সরান')}</button>
                </div>
              ) : <p className="meta">{t('No film. The page opens with its cover photos.', 'ভিডিও নেই। পেজটি কভার ছবি দিয়ে খোলে।')}</p>}
              <div className="field"><label htmlFor="st-film">{t('Film link (MP4)', 'ভিডিওর লিংক (MP4)')}</label>
                <input className="inp" id="st-film" value={film} onChange={e => setFilm(e.target.value)} placeholder="https://.../film.mp4" autoCapitalize="off" spellCheck={false} />
                <span className="hint">{t('A short silent film, 10 to 30 seconds. Use a link from khabo’s video storage.', '১০ থেকে ৩০ সেকেন্ডের ছোট, শব্দহীন ভিডিও। খাবোর ভিডিও স্টোরেজের লিংক দিন।')}</span></div>
              <button type="button" className="btn sm" style={{ justifySelf: 'start' }} onClick={saveFilm}>{t('Use this film', 'এই ভিডিও নিন')}</button>
            </div>
          </Card>
        ) : null}
        {can('billing', me) ? (
          <Card title={t('Plan', 'প্ল্যান')} right={<span className={clsx('badge', st[1])}>{i.L(st[0])}</span>}>
            <div className="card-b stack">
              <SelF label={t('Plan', 'প্ল্যান')} value={r.plan} onChange={v => { const nr = clone(r); nr.plan = v as Plan; saved(nr); /* the plan change is logged when it is saved */ }}
                opts={(Object.keys(PLANS) as Plan[]).map(k => [k, `${i.L(PLANS[k].name)} · ${i.tk(PLANS[k].price)} ${t('a month', 'মাসে')}`])} />
              <Link className="btn" href={`/${i.lang}/admin/billing`} style={{ justifySelf: 'start' }}>{t('Open billing', 'বিল খুলুন')}</Link>
            </div>
          </Card>
        ) : null}
        {can('users.rest', me) ? (
          <Card title={t('Sign-in accounts', 'সাইন-ইন অ্যাকাউন্ট')} right={<button type="button" className="btn sm" onClick={() => setAddU(true)}><Ico n="plus" sm />{t('Add', 'যোগ করুন')}</button>}>
            <div className="rows">
              {accts.length ? accts.map(u => (
                <div className="row" key={u.u}><Av name={u.name} sm /><div><b>{u.name}</b><span className="meta">{u.u}{u.active ? '' : t(' · turned off', ' · বন্ধ')}{!u.hash && u.inv && u.p == null ? t(' · invited', ' · আমন্ত্রিত') : ''}</span></div>
                  <Link className="btn sm ghost" href={`/${i.lang}/admin/users`}>{t('Manage', 'সামলান')}</Link></div>
              )) : <Empty icon="users" title={t('No accounts yet', 'এখনো কোনো অ্যাকাউন্ট নেই')} style={{ padding: 24 }}>{t('Add one so the owner can sign in.', 'মালিক যেন সাইন ইন করতে পারেন, একটি যোগ করুন।')}</Empty>}
            </div>
          </Card>
        ) : null}
        {can('rest.delete', me) ? (
          <Card title={t('Delete restaurant', 'রেস্টুরেন্ট মুছুন')} red>
            <div className="card-b stack">
              <p className="meta">{t('Removes the page, menu and deals from khabo and turns off its sign-in accounts. This cannot be undone.', 'খাবো থেকে পেজ, মেনু আর অফার সরিয়ে দেয় আর এর সাইন-ইন অ্যাকাউন্ট বন্ধ করে। এটা ফেরানো যাবে না।')}</p>
              <button type="button" className="btn danger" style={{ justifySelf: 'start' }} onClick={del}>{t(`Delete ${r.name.en}`, `${r.name.bn} মুছুন`)}</button>
            </div>
          </Card>
        ) : null}
      </div>
      <UserModal open={addU} onClose={() => setAddU(false)} rid={r.id} lockRole done={x => setInv(x)} />
      <InviteCard inv={inv} onClose={() => setInv(null)} />
    </Page>
  );
}
