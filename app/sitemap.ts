import type { MetadataRoute } from 'next';
import { getRestaurantIds } from '@/lib/data/catalog';

/* every page in both languages, so search engines find each restaurant */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://khabo.app';
  const pages = ['', '/restaurants', '/dishes', '/deals', '/prices', '/events', '/business'];
  const ids = await getRestaurantIds();
  return ['en', 'bn'].flatMap(l => [
    ...pages.map(p => ({ url: `${base}/${l}${p}`, changeFrequency: 'daily' as const, priority: p ? 0.7 : 1 })),
    ...ids.map(id => ({ url: `${base}/${l}/r/${id}`, changeFrequency: 'daily' as const, priority: 0.8 })),
  ]);
}
