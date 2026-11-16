import { RestGate } from '@/components/panel/root';
import { SitePage } from '@/components/panel/rest/site';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "site" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/site'>) {
  const { rid } = await params;
  return <RestGate view="site" rid={decodeURIComponent(rid)}><SitePage /></RestGate>;
}
