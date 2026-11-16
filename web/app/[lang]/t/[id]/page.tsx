import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { getRestaurant, getRestaurantIds } from '@/lib/data/catalog';
import { isLang } from '@/lib/i18n/core';
import { TableMenu } from '@/components/table/table-menu';

/* every restaurant's table menu is made ahead of time, so it opens fast after a scan */
export async function generateStaticParams() {
  return (await getRestaurantIds()).map(id => ({ id }));
}

async function tableData(id: string) {
  'use cache';
  cacheLife('hours');
  return getRestaurant(id);
}

export async function generateMetadata({ params }: PageProps<'/[lang]/t/[id]'>): Promise<Metadata> {
  const { lang, id } = await params;
  const r = await tableData(id);
  if (!r) return {};
  const bn = lang === 'bn', name = bn ? r.name.bn : r.name.en;
  return {
    title: `${name} · ${bn ? 'মেনু' : 'Menu'}`,
    description: bn ? `${name}-এর মেনু আর দাম। টেবিলের কিউআর কোড স্ক্যান করে খুলুন।` : `The menu and prices at ${name}. Opened from the QR code on your table.`,
    alternates: { languages: { en: `/en/t/${id}`, bn: `/bn/t/${id}` } },
    /* the restaurant page is the one to find in search; this one is for guests at the table */
    robots: { index: false, follow: true },
  };
}

export default async function TablePage({ params }: PageProps<'/[lang]/t/[id]'>) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const r = await tableData(id);
  if (!r) notFound();
  return <TableMenu r={r} />;
}
