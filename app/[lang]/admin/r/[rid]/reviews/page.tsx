import { RestGate } from '@/components/panel/root';
import { Reviews } from '@/components/panel/rest/reviews';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "reviews" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/reviews'>) {
  const { rid } = await params;
  return <RestGate view="reviews" rid={decodeURIComponent(rid)}><Reviews /></RestGate>;
}
