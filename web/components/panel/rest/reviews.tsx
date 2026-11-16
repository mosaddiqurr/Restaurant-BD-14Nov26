'use client';
/* Reviews: reply to diners (the reply shows under their review on the page, in the restaurant's colours).
   The khabo team can also hide a review; owners can report one to the team. Ported from website/panel/rest.js (V.reviews)
   and the React partner panel (PReviews). Replies are saved through lib/panel/store (setRev) into the shared demo data. */
import { useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { src } from '@/lib/khabo';
import type { Review } from '@/lib/data/types';
import { can, reviewsOf, setRev } from '@/lib/panel/store';
import { Av, Empty, Ico, Page, Stars, useLive, useR, useT } from '../ui';

type Rv = Review & { flagged?: boolean };
const key = (v: Rv) => `${v.who}|${v.t.slice(0, 24)}`;

export function Reviews() {
  const i = useI(), t = useT(), { r, db, me, area } = useR(), live = useLive();
  const admin = area === 'admin', mod = can('reviews.moderate', me);
  const [f, setF] = useState('all'), [open, setOpen] = useState<string | null>(null), [draft, setDraft] = useState<Record<string, string>>({});
  const all = reviewsOf(db, r.id) as Rv[], vis = all.filter(v => !v.hidden);
  const counts = [5, 4, 3, 2, 1].map(s => vis.filter(v => v.st === s).length), mx = Math.max(1, ...counts);
  const avg = vis.length ? vis.reduce((a, v) => a + v.st, 0) / vis.length : 0;
  const F: [string, string, number][] = [
    ['all', t('All', 'সব'), all.length], ['reply', t('Needs a reply', 'উত্তর দরকার'), all.filter(v => !v.reply && !v.hidden).length],
    ['low', t('3 stars or less', '৩ তারা বা কম'), all.filter(v => v.st <= 3).length],
  ];
  if (admin) F.push(['hidden', t('Hidden', 'লুকানো'), all.filter(v => v.hidden).length]);
  const list = all.filter(v => (f === 'all' ? true : f === 'reply' ? !v.reply && !v.hidden : f === 'low' ? v.st <= 3 : v.hidden));
  const ok = (en: string, bn: string) => toast.success(t(en, bn), { action: { label: t('View', 'দেখুন'), onClick: () => window.open(live(r, '#reviews'), '_blank') } });
  const post = (v: Rv) => {
    const txt = (draft[key(v)] ?? (v.reply ? i.L(v.reply) : '')).trim();
    if (txt.length < 3) return toast.error(t('Write a short reply first.', 'আগে একটি ছোট উত্তর লিখুন।'));
    if (setRev(v, { reply: { en: txt, bn: txt } }, { en: `Replied to ${v.who}`, bn: `${v.who}-কে উত্তর দিয়েছেন` })) {
      setOpen(null); setDraft(d => ({ ...d, [key(v)]: '' })); ok('Reply posted on your page.', 'উত্তর আপনার পেজে দেখা যাচ্ছে।');
    }
  };
  return (
    <Page title={t('Reviews', 'রিভিউ')} sub={t('Reply to diners. Your reply shows under their review on your page.', 'ডাইনারদের উত্তর দিন। আপনার উত্তর তাঁদের রিভিউর নিচে আপনার পেজে দেখায়।')}>
      <div className="grid g-main">
        <div className="card">
          <div className="toolbar"><div className="fchips">{F.map(([k, l, n]) => <button key={k} className={clsx('fchip', f === k && 'on')} onClick={() => setF(k)}>{l}<span>{i.N(n)}</span></button>)}</div></div>
          <div>
            {list.length ? list.map(v => {
              const k = key(v), editing = open === k || (!v.reply && !v.hidden && f === 'reply');
              return (
                <article key={k} className={clsx('rv', v.hidden && 'hidden-rv')}>
                  <div className="rv-h"><Av name={v.who} /><div><b>{v.who}</b><span className="meta">{i.L(v.when)}{v.vf ? ' · ' + t('Verified visit', 'যাচাই করা ভিজিট') : ''}</span></div>
                    <div className="r">{v.hidden ? <span className="badge bad">{t('Hidden by khabo', 'খাবো লুকিয়েছে')}</span> : null}{v.flagged ? <span className="badge warn">{t('Reported', 'অভিযোগ করা')}</span> : null}<Stars n={v.st} /></div></div>
                  <p className="rv-t">{v.t}</p>
                  {v.ord?.length ? <p className="meta">{t('Ordered', 'অর্ডার')}: {v.ord.join(', ')}</p> : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.pics?.length ? <div className="rv-pics">{v.pics.map(p => <img key={p} src={src(p, 200)} alt="" loading="lazy" />)}</div> : null}
                  {v.reply && open !== k ? <div className="rv-reply" style={{ '--rpd': r.theme.deep } as CSSProperties}><b>{t(`Reply from ${r.name.en}`, `${r.name.bn}-এর উত্তর`)}</b><p className="rv-t">{i.L(v.reply)}</p></div> : null}
                  {editing ? (
                    <form className="rv-acts rbox" onSubmit={e => { e.preventDefault(); post(v); }}>
                      <textarea className="inp" rows={3} value={draft[k] ?? (v.reply ? i.L(v.reply) : '')} onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))}
                        placeholder={t(`Write a reply to ${v.who.split(' ')[0]}, in Bangla or English`, `${v.who.split(' ')[0]}-কে বাংলা বা ইংরেজিতে উত্তর লিখুন`)} aria-label={t(`Reply to ${v.who}`, `${v.who}-কে উত্তর`)} />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {open === k ? <button type="button" className="btn sm ghost" onClick={() => setOpen(null)}>{t('Cancel', 'বাতিল')}</button> : null}
                        <button className="btn sm pri"><Ico n="paper-plane-right" sm />{t('Post reply', 'উত্তর দিন')}</button>
                      </div>
                    </form>
                  ) : (
                    <div className="rv-acts">
                      <button className="btn sm" onClick={() => setOpen(k)}><Ico n="chat-circle-dots" sm />{v.reply ? t('Edit reply', 'উত্তর বদলান') : t('Reply', 'উত্তর দিন')}</button>
                      {v.reply ? <button className="btn sm ghost" onClick={() => { if (setRev(v, { reply: null }, { en: `Removed the reply to ${v.who}`, bn: `${v.who}-এর উত্তর সরিয়েছেন` })) toast.success(t('Reply removed.', 'উত্তর সরানো হয়েছে।')); }}>{t('Remove reply', 'উত্তর সরান')}</button> : null}
                      {mod
                        ? <button className={clsx('btn sm', !v.hidden && 'danger')} onClick={() => { if (setRev(v, { hidden: !v.hidden }, { en: `${v.hidden ? 'Showed' : 'Hid'} the review by ${v.who}`, bn: `${v.who}-এর রিভিউ ${v.hidden ? 'আবার দেখিয়েছেন' : 'লুকিয়েছেন'}` })) toast.success(v.hidden ? t('Review is visible again.', 'রিভিউ আবার দেখা যাচ্ছে।') : t('Review hidden from the site.', 'রিভিউ সাইট থেকে লুকানো হয়েছে।')); }}>{v.hidden ? t('Show again', 'আবার দেখান') : t('Hide review', 'রিভিউ লুকান')}</button>
                        : v.flagged ? null : <button className="btn sm ghost" onClick={() => { if (setRev(v, { flagged: true }, { en: `Reported the review by ${v.who}`, bn: `${v.who}-এর রিভিউ নিয়ে অভিযোগ করেছেন` })) toast.success(t('Sent to the khabo team. We check reports within a day.', 'খাবো টিমের কাছে পাঠানো হয়েছে। আমরা এক দিনের মধ্যে দেখি।')); }}><Ico n="warning" sm />{t('Report to khabo', 'খাবোকে জানান')}</button>}
                    </div>
                  )}
                </article>
              );
            }) : <Empty icon="chats-circle" title={t('Nothing here', 'এখানে কিছু নেই')}>{f === 'reply' ? t('Every review has a reply.', 'সব রিভিউর উত্তর দেওয়া হয়েছে।') : t('No reviews in this group.', 'এই ভাগে কোনো রিভিউ নেই।')}</Empty>}
          </div>
        </div>
        <div className="stack" style={{ alignContent: 'start' }}>
          <div className="card stat"><div className="k"><Ico n="star" sm f />{t('Average from reviews on khabo', 'খাবোর রিভিউ থেকে গড়')}</div><div className="v num">{avg ? i.dg(avg.toFixed(1)) : '-'}</div>
            <div className="d">{t(`${vis.length} review${vis.length === 1 ? '' : 's'} here · ${r.reviews} in total`, `এখানে ${i.N(vis.length)}টি রিভিউ · মোট ${i.N(r.reviews)}টি`)}</div>
            <div className="stack" style={{ gap: 8, marginTop: 16 }}>
              {[5, 4, 3, 2, 1].map((s, k) => (
                <div key={s} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 22px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                  <span className="meta">{i.N(s)}★</span><div className="meter"><i style={{ '--w': Math.round((counts[k] / mx) * 100) } as CSSProperties} /></div><span className="num meta">{i.N(counts[k])}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="alert info"><Ico n="info" /><div><b>{t('Good replies', 'ভালো উত্তর')}</b><div className="meta">{t('Thank them by name, answer the point they raised, keep it short. Never argue in public.', 'নাম ধরে ধন্যবাদ দিন, তাঁদের কথার উত্তর দিন, ছোট রাখুন। সবার সামনে তর্ক করবেন না।')}</div></div></div>
        </div>
      </div>
    </Page>
  );
}
