import type { Metadata } from 'next';
import { getEvents } from '@/lib/data/catalog';
import { getI18n } from '@/lib/i18n/server';
import { isLang } from '@/lib/i18n/core';
import { EventsView } from '@/components/events/events';

export async function generateMetadata({ params }: PageProps<'/[lang]/events'>): Promise<Metadata> {
  const { lang } = await params;
  const i = getI18n(isLang(lang) ? lang : 'en');
  return { title: i.tx('events'), description: i.tx('ev_sub') };
}

export default async function Page() {
  const rows = (await getEvents()).map(({ r, ev, k }) => ({ r: { id: r.id, name: r.name, mono: r.mono, theme: r.theme, area: r.area, city: r.city }, ev, k }));
  return <EventsView rows={rows} />;
}
