import { RestGate } from '@/components/panel/root';
import { Team } from '@/components/panel/rest/team';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "team" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/team'>) {
  const { rid } = await params;
  return <RestGate view="team" rid={decodeURIComponent(rid)}><Team /></RestGate>;
}
