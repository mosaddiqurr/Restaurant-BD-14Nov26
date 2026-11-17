import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { getRestaurant, getRestaurantIds, getReviews } from '@/lib/data/catalog';
import { isLang } from '@/lib/i18n/core';
import { toMini } from '@/lib/khabo';
import { ReviewsPage } from '@/components/restaurant/reviews-page';

/* every review of one restaurant on its own page: /r/<id>/reviews, or /r/<id>/reviews?dish=<dish id> */
export async function generateStaticParams() {
  return (await getRestaurantIds()).map(id => ({ id }));
}

async function pageData(id: string) {
  'use cache';
  cacheLife('hours');
  const r = await getRestaurant(id);
  if (!r) return null;
  return {
    mini: { ...toMini(r), spot: r.spot }, rating: r.rating, total: r.reviews, verified: r.verified,
    menu: r.menu.map(d => ({ id: d.id, name: d.name })), reviews: await getReviews(id),
  };
}

export async function generateMetadata({ params }: PageProps<'/[lang]/r/[id]/reviews'>): Promise<Metadata> {
  const { lang, id } = await params;
  const r = await getRestaurant(id);
  if (!r) return {};
  const name = lang === 'bn' ? r.name.bn : r.name.en;
  return { title: lang === 'bn' ? `${name}: সব রিভিউ` : `${name}: all reviews`, alternates: { languages: { en: `/en/r/${id}/reviews`, bn: `/bn/r/${id}/reviews` } } };
}

export default async function Page({ params, searchParams }: PageProps<'/[lang]/r/[id]/reviews'>) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const d = await pageData(id);
  if (!d) notFound();
  const q = await searchParams;
  const did = typeof q.dish === 'string' ? q.dish : '';
  const dish = d.menu.find(x => x.id === did) || null;
  return <ReviewsPage {...d} dish={dish} />;
}
