import type { Metadata } from 'next';
import { getDishes, getPriceLog, getTypeOrder } from '@/lib/data/catalog';
import { PricesView } from '@/components/prices/prices';
import { UrlParams } from '@/components/listing/url-params';

const META = {
  en: { title: 'What each place charges', description: 'Today’s menu price for a dish at every place on khabo, cheapest first, with the typical price and the range in each area.' },
  bn: { title: 'কোথায় কত দাম', description: 'খাবোর প্রতিটি জায়গায় একটি খাবারের আজকের মেনু দাম, কম দাম আগে, প্রতিটি এলাকার সাধারণ দাম আর দামের পরিসর সহ।' },
};

export async function generateMetadata({ params }: PageProps<'/[lang]/prices'>): Promise<Metadata> {
  const { lang } = await params;
  return META[lang === 'bn' ? 'bn' : 'en'];
}

export default async function Page() {
  const [all, log, order] = await Promise.all([getDishes(), getPriceLog(), getTypeOrder()]);
  /* plates shared by a table are not compared with single plates */
  const dishes = all.filter(d => !d.share);
  return (
    <UrlParams>
      <PricesView dishes={dishes} log={log} order={order.filter(id => dishes.some(d => d.type === id))} />
    </UrlParams>
  );
}
