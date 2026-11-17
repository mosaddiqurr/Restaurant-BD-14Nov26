import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { getCards, getRestaurant, getRestaurantIds, getReviews } from '@/lib/data/catalog';
import { isLang } from '@/lib/i18n/core';
import { dhakaAt, liveDealsOf } from '@/lib/khabo';
import { Rest } from '@/components/restaurant/rest';

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(id => ({ id }));
}

/* everything the page needs, kept for a while like a database query. Deals and events depend on the day,
   so they are worked out here (and again in the browser once it has drawn) */
async function pageData(id: string) {
  'use cache';
  cacheLife('hours');
  const r = await getRestaurant(id);
  if (!r) return null;
  const [reviews, cards] = await Promise.all([getReviews(id), getCards()]);
  const more = cards.filter(z => z.id !== r.id && z.city === r.city)
    .sort((a, b) => Number(b.area === r.area) - Number(a.area === r.area) || b.rating - a.rating).slice(0, 6);
  const now = Date.now();
  const dealIds = liveDealsOf(r).map(d => d.id);
  const evIds = (r.events || []).filter(ev => dhakaAt(ev.end) > now).sort((a, b) => dhakaAt(a.start) - dhakaAt(b.start)).map(ev => ev.id);
  return { r, reviews, more, dealIds, evIds };
}

export async function generateMetadata({ params }: PageProps<'/[lang]/r/[id]'>): Promise<Metadata> {
  const { lang, id } = await params;
  const r = await getRestaurant(id);
  if (!r) return {};
  const bn = lang === 'bn', name = bn ? r.name.bn : r.name.en, tag = bn ? r.tagline.bn : r.tagline.en;
  return {
    title: name,
    description: tag,
    alternates: { languages: { en: `/en/r/${id}`, bn: `/bn/r/${id}` } },
    /* the share picture comes from opengraph-image.tsx next to this page */
    openGraph: { title: name, description: tag },
  };
}

export default async function RestaurantPage({ params }: PageProps<'/[lang]/r/[id]'>) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const data = await pageData(id);
  if (!data) notFound();
  return <Rest {...data} />;
}
