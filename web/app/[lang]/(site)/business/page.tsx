import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRestaurant, getRestaurants } from '@/lib/data/catalog';
import { getI18n } from '@/lib/i18n/server';
import { isLang } from '@/lib/i18n/core';
import { BizView, type BizPick } from '@/components/biz/biz';

export async function generateMetadata({ params }: PageProps<'/[lang]/business'>): Promise<Metadata> {
  const { lang } = await params;
  const i = getI18n(isLang(lang) ? lang : 'en');
  return { title: i.t('nav_business'), description: i.t('biz_sub') };
}

/* the example restaurant shown on this page, and the table cards in four looks */
const SHOW = 'shahi-handi';
const PICKS: [string, BizPick['look']][] = [['shahi-handi', 'rounded'], ['kathgolap', 'leaf'], ['cha-adda', 'dots'], ['nawabpur-kacchi', 'diamond']];

export default async function Page() {
  const r = await getRestaurant(SHOW);
  if (!r) notFound();
  const all = await getRestaurants();
  const sh = {
    id: r.id, name: r.name, theme: r.theme, mono: r.mono, area: r.area,
    kitchen: r.kitchen?.src || null, tour: r.tour || [],
    dishes: r.menu.filter(d => ['mutton-kacchi', 'kacchi-handi', 'morog-polao'].includes(d.id)).map(d => ({ id: d.id, name: d.name, price: d.price })),
  };
  const picks: BizPick[] = PICKS.map(([id, look]) => { const p = all.find(x => x.id === id); return p ? { id, name: p.name, theme: p.theme, look } : null; }).filter(Boolean) as BizPick[];
  return <BizView sh={sh} picks={picks} />;
}
