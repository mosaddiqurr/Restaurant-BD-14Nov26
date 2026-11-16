'use client';
/* /events: live music, match screenings, iftar specials and festival menus at partner restaurants.
   Which events show depends on today's date, so the list is worked out in the browser after the page loads.
   Ported from archive/prototype/app/app.js (Events). */
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Rise, Seg } from '@/components/ui/bits';
import { Choose } from '@/components/ui/choose';
import { ECard, ETYPE, evE, evS, type EventX } from '@/components/cards/cards';
import { EASE } from '@/lib/khabo';
import { areaLabel, areaOpts, areaValue, pickArea } from '@/components/listing/filters';
import { EventGridSkeleton } from '@/components/listing/skeletons';
import { useNow } from '@/components/listing/hooks';
import '@/styles/pages-extra.css';

const DAYMS = 864e5;
type EF = { date: string; area: string; city: string; type: string };
const EF0: EF = { date: 'any', area: '', city: '', type: '' };

/** the time window for a date choice. The weekend in Bangladesh is Friday and Saturday */
function windowOf(date: string, now: Date): [number, number] | null {
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const wd = now.getDay(), fri = wd === 6 ? day0 - DAYMS : day0 + ((5 - wd + 7) % 7) * DAYMS;
  const w: Record<string, [number, number]> = { today: [day0, day0 + DAYMS], week: [day0, day0 + 7 * DAYMS], weekend: [fri, fri + 2 * DAYMS], month: [day0, day0 + 30 * DAYMS] };
  return w[date] || null;
}

export function EventsView({ rows }: { rows: EventX[] }) {
  const i = useI();
  const [ef, setEf] = useState<EF>(EF0);
  const setE = (o: Partial<EF>) => setEf(s => ({ ...s, ...o }));
  /* the clock is read only in the browser, so server and browser draw the same first page */
  const t = useNow();
  /* the first cards rise in one after another; later filter changes just swap */
  const [intro, setIntro] = useState(true);
  useEffect(() => { if (t != null) { const tm = setTimeout(() => setIntro(false), 500); return () => clearTimeout(tm); } }, [t]);

  const list = useMemo(() => {
    if (t == null) return null;
    const win = windowOf(ef.date, new Date(t));
    return rows.filter(({ r, ev }) => evE(ev) > t
      && (!ef.area || r.area === ef.area) && (!ef.city || r.city === ef.city)
      && (!ef.type || ev.type === ef.type)
      && (!win || (evS(ev) < win[1] && evE(ev) > win[0])));
  }, [rows, ef, t]);

  return (
    <div className="wrap lp">
      <div className="lh"><div>
        <Rise as="h1" className="h1">{i.tx('events')}</Rise>
        <Rise as="p" className="sub" d={1}>{i.tx('ev_sub')}</Rise>
      </div></div>
      <div className="ev-tools">
        <Seg id="evdate" items={[['any', i.tx('any_date')], ['today', i.tx('d_today_f')], ['weekend', i.tx('d_weekend')], ['week', i.tx('d_week')], ['month', i.tx('d_month')]]} value={ef.date} onChange={v => setE({ date: v })} />
        <Choose icon="map-pin" label={areaLabel(i, ef)} on={!!(ef.area || ef.city)} title={i.t('area')} opts={areaOpts(i)} value={areaValue(ef)} onPick={v => setE(pickArea(v))} align="start" />
      </div>
      <div className="chips" style={{ marginTop: 12 }} role="group" aria-label={i.tx('all_types')}>
        <button className={clsx('chip sm', !ef.type && 'on')} aria-pressed={!ef.type} onClick={() => setE({ type: '' })}>{i.tx('all_types')}</button>
        {Object.entries(ETYPE).map(([k, [lb, ic]]) => (
          <button key={k} className={clsx('chip sm', ef.type === k && 'on')} aria-pressed={ef.type === k} onClick={() => setE({ type: ef.type === k ? '' : k })}><I n={ic} />{i.L(lb)}</button>
        ))}
      </div>
      {list == null ? <EventGridSkeleton /> : list.length ? (
        <div className="ev-g" style={{ marginTop: 24 }}>
          <AnimatePresence mode="popLayout">
            {list.map((z, k) => (
              <m.div key={z.k} layout initial={{ opacity: 0, scale: 0.97, y: intro ? 10 : 0 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.16, ease: EASE } }}
                transition={{ duration: 0.3, ease: EASE, delay: intro ? Math.min(k, 5) * 0.05 : 0 }}>
                <ECard x={z} />
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <m.div className="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
          <I n="calendar-x" /><b>{i.tx('no_events')}</b>
          <button className="btn btn-line" onClick={() => setEf(EF0)}>{i.t('clear_all')}</button>
        </m.div>
      )}
    </div>
  );
}
