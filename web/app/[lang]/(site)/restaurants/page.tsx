import type { Metadata } from 'next';
import { getCards } from '@/lib/data/catalog';
import { getI18n } from '@/lib/i18n/server';
import { isLang } from '@/lib/i18n/core';
import { RestaurantsView } from '@/components/listing/restaurants';
import { UrlParams } from '@/components/listing/url-params';

export async function generateMetadata({ params }: PageProps<'/[lang]/restaurants'>): Promise<Metadata> {
  const { lang } = await params;
  const i = getI18n(isLang(lang) ? lang : 'en');
  const n = (await getCards()).length;
  return { title: i.t('nav_restaurants'), description: i.t('rs_sub', { n: i.N(n) }) };
}

/* the filters are read from the address in the browser; the saved page shows the full list */
export default async function Page() {
  const cards = await getCards();
  return (
    <UrlParams>
      <RestaurantsView cards={cards} />
    </UrlParams>
  );
}
