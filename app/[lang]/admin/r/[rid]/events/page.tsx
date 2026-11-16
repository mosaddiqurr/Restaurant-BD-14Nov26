import { RestGate } from '@/components/panel/root';
import { Events } from '@/components/panel/rest/events';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "events" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/events'>) {
  const { rid } = await params;
  return <RestGate view="events" rid={decodeURIComponent(rid)}><Events /></RestGate>;
}
