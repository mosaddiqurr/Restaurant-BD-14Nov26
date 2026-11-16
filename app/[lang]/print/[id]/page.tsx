import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { getRestaurant, getRestaurantIds } from '@/lib/data/catalog';
import { isLang } from '@/lib/i18n/core';
import { PrintPage } from '@/components/print/print-page';

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(id => ({ id }));
}

async function printData(id: string) {
  'use cache';
  cacheLife('hours');
  return getRestaurant(id);
}

export async function generateMetadata({ params }: PageProps<'/[lang]/print/[id]'>): Promise<Metadata> {
  const { lang, id } = await params;
  const r = await printData(id);
  if (!r) return {};
  const bn = lang === 'bn';
  return {
    title: `${bn ? r.name.bn : r.name.en} · ${bn ? 'প্রিন্ট মেনু' : 'Print menu'}`,
    robots: { index: false, follow: false },
  };
}

export default async function PrintMenuPage({ params }: PageProps<'/[lang]/print/[id]'>) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const r = await printData(id);
  if (!r) notFound();
  return <PrintPage r={r} />;
}
