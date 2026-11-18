import type { Metadata } from 'next';
import { PanelRoot } from '@/components/panel/root';
import { getAllReviews, getRestaurants } from '@/lib/data/catalog';
import '@/styles/panel.css';
import '@/styles/panel-extra.css';

/* The khabo team (admin) panel. Data comes from the catalog on the server; who is signed in is decided in the browser
   for this prototype (the real lock is server-side later, see components/panel/root.tsx). */
/* panel pages are drawn in the browser after sign in, so the title is fixed here (never indexed) */
export const metadata: Metadata = { title: 'Khaoya team panel · খাওয়া টিম প্যানেল', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<'/[lang]/admin'>) {
  const [restaurants, reviews] = await Promise.all([getRestaurants(), getAllReviews()]);
  return <PanelRoot area="admin" restaurants={restaurants} reviews={reviews}>{children}</PanelRoot>;
}
