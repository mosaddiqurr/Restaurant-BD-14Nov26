import { RestGate } from '@/components/panel/root';
import { REST_VIEWS } from '@/components/panel/rest/views';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

/* the khabo team opens one restaurant: the same pages the owner has, with tabs on top */
export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]'>) {
  const { rid } = await params;
  const V = REST_VIEWS[''];
  return <RestGate view="" rid={decodeURIComponent(rid)}><V /></RestGate>;
}
