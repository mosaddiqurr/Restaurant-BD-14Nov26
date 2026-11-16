import { RestGate } from '@/components/panel/root';
import { Photos } from '@/components/panel/rest/photos';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "photos" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/photos'>) {
  const { rid } = await params;
  return <RestGate view="photos" rid={decodeURIComponent(rid)}><Photos /></RestGate>;
}
