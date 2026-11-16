import { RestGate } from '@/components/panel/root';
import { Insights } from '@/components/panel/rest/insights';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "insights" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/insights'>) {
  const { rid } = await params;
  return <RestGate view="insights" rid={decodeURIComponent(rid)}><Insights /></RestGate>;
}
