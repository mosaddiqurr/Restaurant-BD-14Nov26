'use client';
/* Reviews on every restaurant. The team hides reviews that break the rules (reported ones come first);
   owners reply from their own panel. Ported from archive/prototype/panel/admin.js (V.reviews). */
import Link from 'next/link';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { getR, reviewsOf, setRev } from '@/lib/panel/store';
import type { Review } from '@/lib/data/types';
import { Ico, MonoR, Page, Stars, usePanel, useT } from '../ui';
import { useA, useKeep } from './parts';

type RV = Review & { flagged?: boolean };
const STEP = 40;

export function AdminReviews() {
  const i = useI(), t = useT(), a = useA(), { db } = usePanel();
  const [f, setF] = useKeep('rv.f', 'attention');
  const [n, setN] = useKeep('rv.n', STEP);
  const all = reviewsOf(db).filter(v => !!getR(db, v.r));
  const F: [string, string, (v: RV) => boolean][] = [
    ['attention', t('Needs attention', 'নজর দরকার'), v => !v.hidden && (!!v.flagged || v.st <= 2)],
    ['all', t('All', 'সব'), () => true],
    ['low', t('3 stars or less', '৩ তারা বা কম'), v => v.st <= 3],
    ['flagged', t('Reported', 'অভিযোগ এসেছে'), v => !!v.flagged],
    ['hidden', t('Hidden', 'লুকানো'), v => !!v.hidden],
  ];
  const cur = F.find(x => x[0] === f) || F[0];
  /* reported first, then the lowest stars */
  const list = all.filter(cur[2]).sort((x, y) => Number(!!y.flagged) - Number(!!x.flagged) || (cur[0] === 'all' ? 0 : x.st - y.st));
  const hide = (v: RV) => {
    const was = !!v.hidden;
    if (setRev(v, { hidden: !was, flagged: false }, was ? { en: `Showed the review by ${v.who}`, bn: `${v.who}-এর রিভিউ আবার দেখানো হয়েছে` } : { en: `Hid the review by ${v.who}`, bn: `${v.who}-এর রিভিউ লুকিয়েছেন` }))
      toast.success(was ? t('Review is visible again.', 'রিভিউটি আবার দেখা যাচ্ছে।') : t('Review hidden from khabo.', 'রিভিউটি খাবো থেকে লুকানো হয়েছে।'));
  };
  const clear = (v: RV) => {
    if (setRev(v, { flagged: false }, { en: `Cleared the report on the review by ${v.who}`, bn: `${v.who}-এর রিভিউয়ের অভিযোগ মুছেছেন` }))
      toast.success(t('Report cleared. The review stays.', 'অভিযোগ মোছা হয়েছে। রিভিউটি থাকছে।'));
  };
  return (
    <Page title={t('Reviews', 'রিভিউ')} sub={t('Every review on khabo. Hide reviews that break the rules; owners reply from their panel.', 'খাবোর সব রিভিউ। নিয়ম ভাঙা রিভিউ লুকান; মালিকেরা নিজের প্যানেল থেকে উত্তর দেন।')}>
      <div className="card">
        <div className="toolbar">
          <div className="fchips" role="radiogroup" aria-label={t('Show', 'দেখান')}>
            {F.map(([k, l, fn]) => <button key={k} type="button" role="radio" aria-checked={f === k} className={clsx('fchip', f === k && 'on')} onClick={() => { setF(k); setN(STEP); }}>{l}<span>{i.N(all.filter(fn).length)}</span></button>)}
          </div>
        </div>
        {list.length ? list.slice(0, n).map(v => {
          const r = getR(db, v.r)!;
          return (
            <article key={`${v.r}|${v.who}|${v.t.slice(0, 24)}`} className={clsx('rv', v.hidden && 'hidden-rv')}>
              <div className="rv-h">
                <MonoR r={r} />
                <div><b>{v.who} <span className="meta" style={{ display: 'inline' }}>{t('on', 'লিখেছেন')}</span> <Link href={a(`r/${r.id}/reviews`)}>{i.L(r.name)}</Link></b>
                  <span className="meta">{i.L(v.when)}{v.vf ? ` · ${t('Verified visit', 'যাচাই করা ভিজিট')}` : ''}</span></div>
                <div className="r">{v.flagged ? <span className="badge warn">{t('Reported', 'অভিযোগ এসেছে')}</span> : null}{v.hidden ? <span className="badge bad">{t('Hidden', 'লুকানো')}</span> : null}<Stars n={v.st} /></div>
              </div>
              <p className="rv-t">{v.t}</p>
              {v.reply ? <div className="rv-reply"><b>{t(`Reply from ${r.name.en}`, `${r.name.bn}-এর উত্তর`)}</b><p className="rv-t">{i.L(v.reply)}</p></div> : null}
              <div className="rv-acts">
                <button type="button" className={clsx('btn sm', !v.hidden && 'danger')} onClick={() => hide(v)}>{v.hidden ? t('Show again', 'আবার দেখান') : t('Hide review', 'রিভিউ লুকান')}</button>
                {v.flagged ? <button type="button" className="btn sm ghost" onClick={() => clear(v)}>{t('Keep it, clear report', 'রাখুন, অভিযোগ মুছুন')}</button> : null}
              </div>
            </article>
          );
        }) : <div className="empty"><Ico n="check-circle" /><b>{t('Nothing here', 'এখানে কিছু নেই')}</b>{t('No reviews in this group.', 'এই দলে কোনো রিভিউ নেই।')}</div>}
        {list.length > n ? <button type="button" className="btn ad-more" onClick={() => setN(n + STEP)}>{t(`Show ${Math.min(STEP, list.length - n)} more of ${list.length - n}`, `আরও ${i.N(Math.min(STEP, list.length - n))}টি দেখান (বাকি ${i.N(list.length - n)})`)}</button> : null}
      </div>
    </Page>
  );
}
