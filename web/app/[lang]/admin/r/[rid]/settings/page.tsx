import { RestGate } from '@/components/panel/root';
import { AdminSettings } from '@/components/panel/rest/settings';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "settings" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/settings'>) {
  const { rid } = await params;
  return <RestGate view="settings" rid={decodeURIComponent(rid)}><AdminSettings /></RestGate>;
}
