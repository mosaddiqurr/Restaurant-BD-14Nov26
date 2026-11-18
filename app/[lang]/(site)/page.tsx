import { getHomeData } from '@/components/home/data';
import { Hero, Partners } from '@/components/home/hero';
import { Cravings, Hub, MapSec, Near } from '@/components/home/browse';
import { AiSec } from '@/components/home/ask';
import { SeeSec } from '@/components/home/see';
import { HomeDeals, HomeEvents } from '@/components/home/deals';
import { PriceSec } from '@/components/home/price';
import { isLang } from '@/lib/i18n/core';

/* Home: the photo wall and search, partners, cravings, open around you, the map, browse every way,
   Ask Mama, see it before you go, deals, events and the price check. The home page is for diners;
   restaurant owners have their own page (/business).
   Everything that needs the whole catalog is worked out on the server (components/home/data.ts). */
export default async function Home({ params }: PageProps<'/[lang]'>) {
  const { lang: l } = await params;
  const h = await getHomeData(isLang(l) ? l : 'en');
  return (
    <>
      <Hero wall={h.wall} areaCount={h.areaCount} />
      <Partners list={h.partners} total={h.total} />
      <Cravings list={h.cravings} />
      <Near near={h.near} areaCount={h.areaCount} />
      <MapSec pins={h.pins} cities={h.cities} />
      <Hub hub={h.hub} />
      <AiSec q={h.ai.q} a={h.ai.a} />
      <SeeSec see={h.see} />
      <HomeDeals rows={h.deals} />
      <HomeEvents list={h.events} />
      <PriceSec list={h.price} />
    </>
  );
}
