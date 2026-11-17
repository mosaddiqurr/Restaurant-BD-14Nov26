import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { getCards, getEvents } from '@/lib/data/catalog';
import { isLang } from '@/lib/i18n/core';
import { dhakaAt, evPath } from '@/lib/khabo';
import { EventView } from '@/components/events/event-page';

/* one event's own page. The address is the restaurant and the event: /events/shahi-handi--qawwali-night (evPath) */
export async function generateStaticParams() {
  return (await getEvents()).map(z => ({ id: evPath(z.k) }));
}

async function pageData(id: string) {
  'use cache';
  cacheLife('hours');
  const all = await getEvents();
  const x = all.find(z => evPath(z.k) === id);
  if (!x) return null;
  const card = (await getCards()).find(c => c.id === x.r.id);
  if (!card) return null;
  const lite = (z: typeof x) => ({ r: { id: z.r.id, name: z.r.name, mono: z.r.mono, theme: z.r.theme, area: z.r.area, city: z.r.city }, ev: z.ev, k: z.k });
  const now = Date.now();
  const later = all.filter(z => z.k !== x.k && dhakaAt(z.ev.end) > now);
  return {
    x: lite(x),
    r: { id: card.id, name: card.name, mono: card.mono, theme: card.theme, area: card.area, city: card.city, geo: card.geo, rating: card.rating, phone: card.phone },
    here: later.filter(z => z.r.id === x.r.id).map(lite),
    near: later.filter(z => z.r.id !== x.r.id && z.r.city === x.r.city).sort((a, b) => Number(b.r.area === x.r.area) - Number(a.r.area === x.r.area)).slice(0, 6).map(lite),
  };
}

export async function generateMetadata({ params }: PageProps<'/[lang]/events/[id]'>): Promise<Metadata> {
  const { lang, id } = await params;
  const d = await pageData(id);
  if (!d) return {};
  const bn = lang === 'bn';
  return { title: bn ? d.x.ev.bn : d.x.ev.en, description: [bn ? d.r.name.bn : d.r.name.en, bn ? d.x.ev.desc?.bn : d.x.ev.desc?.en].filter(Boolean).join('. ') };
}

export default async function EventPage({ params }: PageProps<'/[lang]/events/[id]'>) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const d = await pageData(id);
  if (!d) notFound();
  return <EventView {...d} />;
}
