import { RestGate } from '@/components/panel/root';
import { PrintMenu } from '@/components/panel/rest/print';
import { getRestaurantIds } from '@/lib/data/catalog';

/* the khabo team's view of one restaurant's "print" page (drawn in the browser after sign in) */

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(rid => ({ rid }));
}

export default async function Page({ params }: PageProps<'/[lang]/admin/r/[rid]/print'>) {
  const { rid } = await params;
  return <RestGate view="print" rid={decodeURIComponent(rid)}><PrintMenu /></RestGate>;
}
