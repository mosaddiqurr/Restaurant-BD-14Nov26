'use client';
/* /events/[id]: one event in full. The photo, what it is and when, the entry price, where it is (with directions),
   a button to put it in the phone's calendar, and other events at the same place and nearby.
   Restaurants add events in their panel; every event card on the site opens this page.
   Whether it is on now, coming up or over is worked out with the browser's clock, so it is always true. */
import Link from 'next/link';
import { m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Pic, Rise, useNow } from '@/components/ui/bits';
import { ECard, ETYPE, evE, evS, useEvWhen, type EventX } from '@/components/cards/cards';
import { useHref } from '@/components/shell/nav';
import { toast } from '@/lib/toast';
import { EASE, areaOf, dhakaAt, dirUrl } from '@/lib/khabo';
import type { RestaurantCard } from '@/lib/data/types';
import '@/styles/pages-extra.css';

export type EvPlace = Pick<RestaurantCard, 'id' | 'name' | 'mono' | 'theme' | 'area' | 'city' | 'geo' | 'rating' | 'phone'>;

const W = {
  back: { en: 'All events', bn: 'সব ইভেন্ট' },
  cal: { en: 'Add to calendar', bn: 'ক্যালেন্ডারে রাখুন' },
  ended: { en: 'This event has ended', bn: 'এই ইভেন্ট শেষ হয়ে গেছে' },
  endedSub: { en: 'See what is coming up next below.', bn: 'নিচে সামনের ইভেন্টগুলো দেখুন।' },
  soon: { en: 'Starts in {t}', bn: '{t} পরে শুরু' },
  days: { en: '{n} days', bn: '{n} দিন' },
  hours: { en: '{n} hours', bn: '{n} ঘণ্টা' },
  mins: { en: '{n} minutes', bn: '{n} মিনিট' },
  about: { en: 'About this event', bn: 'ইভেন্ট সম্পর্কে' },
  where: { en: 'Where', bn: 'কোথায়' },
  when: { en: 'When', bn: 'কখন' },
  entry: { en: 'Entry', bn: 'প্রবেশ' },
  page: { en: 'See the restaurant', bn: 'রেস্টুরেন্ট দেখুন' },
  here: { en: 'More at {r}', bn: '{r}-এ আরও' },
  near: { en: 'More events nearby', bn: 'কাছাকাছি আরও ইভেন্ট' },
  copied: { en: 'Link copied', bn: 'লিংক কপি হয়েছে' },
};

/* a calendar file (.ics) made in the browser: every phone and laptop calendar opens it */
function calFile(title: string, place: string, ev: EventX['ev'], url: string) {
  const f = (t: string) => new Date(dhakaAt(t)).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//khabo//events//EN', 'BEGIN:VEVENT',
    `UID:${ev.id}@khabo`, `DTSTAMP:${f(new Date().toISOString())}`, `DTSTART:${f(ev.start)}`, `DTEND:${f(ev.end)}`,
    `SUMMARY:${esc(title)}`, `LOCATION:${esc(place)}`, `URL:${url}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = ev.id + '.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function EventView({ x, r, here, near }: { x: EventX; r: EvPlace; here: EventX[]; near: EventX[] }) {
  const i = useI(), href = useHref(), when = useEvWhen();
  const now = useNow();
  const { ev } = x, ty = ETYPE[ev.type] || ETYPE.other;
  const s = evS(ev), e = evE(ev);
  const state = now == null ? null : now >= e ? 'ended' : now >= s ? 'on' : 'soon';
  const left = now == null ? 0 : s - now;
  const leftTxt = left > 864e5 ? i.L(W.days).replace('{n}', i.N(Math.ceil(left / 864e5)))
    : left > 36e5 ? i.L(W.hours).replace('{n}', i.N(Math.round(left / 36e5))) : i.L(W.mins).replace('{n}', i.N(Math.max(1, Math.round(left / 6e4))));
  const place = `${i.L(r.name)}, ${i.L(areaOf(r.area))}`;
  /* events that ended since the page was made drop out of the lists below */
  const live = (l: EventX[]) => (now == null ? l : l.filter(z => evE(z.ev) > now));
  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: i.L(ev), text: place, url });
      else { await navigator.clipboard.writeText(url); toast.success(i.L(W.copied)); }
    } catch { /* the diner closed the share sheet */ }
  };
  return (
    <div className="wrap lp evp" style={{ '--rd': r.theme.deep, '--ra': r.theme.accent } as React.CSSProperties}>
      <Link className="link evp-back" href={href('/events')}><I n="arrow-left" b />{i.L(W.back)}</Link>
      <div className="evp-top">
        <m.div className="evp-ph" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: EASE }}>
          <Pic id={ev.p} w={1200} tone={r.theme} icon={ty[1]} sizes="(max-width: 900px) 100vw, 640px" eager />
        </m.div>
        <div className="evp-info">
          <Rise className="evp-type"><I n={ty[1]} />{i.L(ty[0])}</Rise>
          <Rise as="h1" className="h1 evp-t" d={1}>{i.L(ev)}</Rise>
          {state === 'on' ? <p className="evp-st on"><i />{i.tx('on_now')}</p>
            : state === 'soon' ? <p className="evp-st">{i.L(W.soon).replace('{t}', leftTxt)}</p>
              : state === 'ended' ? <p className="evp-st end">{i.L(W.ended)}</p> : <p className="evp-st" aria-hidden="true">&nbsp;</p>}
          <dl className="evp-dl">
            <div><dt><I n="calendar-blank" />{i.L(W.when)}</dt><dd suppressHydrationWarning>{when(ev)}</dd></div>
            <div><dt><I n="map-pin" />{i.L(W.where)}</dt><dd>{place}</dd></div>
            <div><dt><I n="money" />{i.L(W.entry)}</dt><dd>{ev.price ? i.tx('entry', { v: i.tk(ev.price) }) : i.tx('free_entry')}</dd></div>
          </dl>
          <div className="evp-act">
            {state !== 'ended' ? <button className="btn btn-pri" onClick={() => calFile(i.L(ev), place, ev, location.href)}><I n="calendar-star" />{i.L(W.cal)}</button> : null}
            <a className="btn btn-line" href={dirUrl(r)} target="_blank" rel="noopener"><I n="navigation-arrow" />{i.t('directions')}</a>
            <button className="btn btn-line" onClick={share}><I n="share-network" />{i.t('share')}</button>
          </div>
        </div>
      </div>

      <div className="evp-body">
        <section className="evp-about">
          <h2 className="h3">{i.L(W.about)}</h2>
          {ev.desc && i.L(ev.desc) ? <p>{i.L(ev.desc)}</p> : null}
          {state === 'ended' ? <p className="meta">{i.L(W.endedSub)}</p> : null}
        </section>
        <Link className="evp-place" href={href('/r/' + r.id)}>
          <Mono r={r} />
          <span><b>{i.L(r.name)}</b><small>{i.L(areaOf(r.area))}, <I n="star" f /> {i.dg(r.rating.toFixed(1))}</small></span>
          <span className="link">{i.L(W.page)}<I n="arrow-right" b /></span>
        </Link>
      </div>

      {live(here).length ? (
        <section className="sec"><h2 className="h2">{i.L(W.here).replace('{r}', i.L(r.name))}</h2>
          <div className="ev-g" style={{ marginTop: 22 }}>{live(here).map(z => <ECard key={z.k} x={z} />)}</div>
        </section>
      ) : null}
      {live(near).length ? (
        <section className="sec"><h2 className="h2">{i.L(W.near)}</h2>
          <div className="ev-g" style={{ marginTop: 22 }}>{live(near).slice(0, 6).map(z => <ECard key={z.k} x={z} />)}</div>
        </section>
      ) : null}
    </div>
  );
}
