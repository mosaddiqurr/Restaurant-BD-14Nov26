import { RestGate } from '@/components/panel/root';
import { Deals } from '@/components/panel/rest/deals';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "deals" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/deals'>) {
  const { rid } = await params;
  return <RestGate view="deals" rid={decodeURIComponent(rid)}><Deals /></RestGate>;
}
