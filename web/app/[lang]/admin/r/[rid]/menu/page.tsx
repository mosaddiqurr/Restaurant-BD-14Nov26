import { RestGate } from '@/components/panel/root';
import { MenuPage } from '@/components/panel/rest/menu';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "menu" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/menu'>) {
  const { rid } = await params;
  return <RestGate view="menu" rid={decodeURIComponent(rid)}><MenuPage /></RestGate>;
}
