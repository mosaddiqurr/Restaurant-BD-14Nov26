import type { Metadata } from 'next';
import { getLiveDeals } from '@/lib/data/catalog';
import { getI18n } from '@/lib/i18n/server';
import { isLang } from '@/lib/i18n/core';
import { DealsView } from '@/components/deals/deals';

export async function generateMetadata({ params }: PageProps<'/[lang]/deals'>): Promise<Metadata> {
  const { lang } = await params;
  const i = getI18n(isLang(lang) ? lang : 'en');
  return { title: i.t('deals_title'), description: i.t('deals_sub') };
}

export default async function Page() {
  /* only what a coupon needs about its restaurant, so the page stays light */
  const rows = (await getLiveDeals()).map(({ r, d, k, i }) => ({
    r: { id: r.id, name: r.name, mono: r.mono, theme: r.theme, area: r.area, city: r.city, rating: r.rating, plan: r.plan }, d, k, i,
  }));
  return <DealsView rows={rows} />;
}
