'use client';
/* One review, with the restaurant's reply in the restaurant's own colours. */
import { useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Pic, Stars } from '@/components/ui/bits';
import { avatarTone, initials } from '@/lib/khabo';
import type { Restaurant, Review } from '@/lib/data/types';

export const RV_FILTERS = ['all', 'verified', 'photos', 'bn'] as const;
export const filterRv = (list: Review[], f: string) =>
  f === 'verified' ? list.filter(v => v.vf) : f === 'photos' ? list.filter(v => v.pics?.length) : f === 'bn' ? list.filter(v => /[ঀ-৿]/.test(v.t)) : list;
/** is this review about this dish? (it lists the dish among what was ordered) */
export const aboutDish = (v: Review, name: { en: string; bn: string }) => (v.ord || []).some(o => o.toLowerCase() === name.en.toLowerCase() || o === name.bn);

export function RvCard({ v, r, clamp, flat }: { v: Review & { own?: boolean }; r: Pick<Restaurant, 'name' | 'mono' | 'theme'>; clamp?: boolean; flat?: boolean }) {
  const i = useI();
  const [open, setOpen] = useState(false), long = v.t.length > 170, tone = avatarTone(v.who);
  return (
    <m.article className={clsx('rvc', flat && 'flat')} layout>
      <header>
        <span className="av" style={{ '--d': tone[0], '--a': tone[1] } as CSSProperties}>{initials(v.who)}</span>
        <div><b>{v.who}</b><small>{i.L(v.when)}</small></div>
        <span className="st" role="img" aria-label={i.t('n_stars', { n: v.st })}><Stars n={v.st} /></span>
      </header>
      {v.own || v.mine ? <span className="vf pend"><I n="clock" />{i.t('rv_pending')}</span> : v.vf ? <span className="vf"><I n="seal-check" f />{i.t('verified_visit')}</span> : null}
      <p className={clsx('txt', clamp && long && !open && 'clamp')}>{v.t}</p>
      {clamp && long ? <button className="more-l" onClick={() => setOpen(!open)}>{open ? i.tx('less') : i.tx('read_more')}</button> : null}
      {v.ord && v.ord.length ? <div className="ord"><small>{i.t('ordered')}</small>{v.ord.map(o => <span key={o}>{o}</span>)}</div> : null}
      {v.pics?.length ? <div className="rv-pics">{v.pics.map(p => <Pic key={p} id={p} w={200} />)}</div> : null}
      {v.reply ? (
        <div className="reply" style={{ '--rpa': r.theme.accent, '--rpd': r.theme.deep } as CSSProperties} aria-label={i.t('reply_from', { r: i.L(r.name) })}>
          <div className="reply-h"><Mono r={r} /><span><b>{i.L(r.name)}</b><small><I n="seal-check" f />{i.tx('owner_reply')}</small></span></div>
          <p>{i.L(v.reply)}</p>
        </div>
      ) : null}
    </m.article>
  );
}
