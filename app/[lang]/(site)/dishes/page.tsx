import type { Metadata } from 'next';
import { getCards, getDishes, getTypeOrder, getTypeStats } from '@/lib/data/catalog';
import { getI18n } from '@/lib/i18n/server';
import { isLang } from '@/lib/i18n/core';
import { DishesView } from '@/components/listing/dishes';
import { UrlParams } from '@/components/listing/url-params';

export async function generateMetadata({ params }: PageProps<'/[lang]/dishes'>): Promise<Metadata> {
  const { lang } = await params;
  const i = getI18n(isLang(lang) ? lang : 'en');
  return { title: i.t('nav_dishes'), description: i.t('dishes_sub') };
}

export default async function Page() {
  const [dishes, cards, order, stats] = await Promise.all([getDishes(), getCards(), getTypeOrder(), getTypeStats()]);
  const pics = Object.fromEntries(Object.entries(stats).map(([id, s]) => [id, s.pic]));
  return (
    <UrlParams>
      <DishesView dishes={dishes} cards={cards} order={order} pics={pics} />
    </UrlParams>
  );
}
