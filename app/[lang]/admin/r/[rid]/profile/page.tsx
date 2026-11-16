import { RestGate } from '@/components/panel/root';
import { Profile } from '@/components/panel/rest/profile';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "profile" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/profile'>) {
  const { rid } = await params;
  return <RestGate view="profile" rid={decodeURIComponent(rid)}><Profile /></RestGate>;
}
