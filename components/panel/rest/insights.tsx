'use client';
/* Price insights (private to the restaurant and the khabo team): how each single-plate dish compares with the same
   kind of dish elsewhere in the city. Ported from archive/prototype/panel/rest.js (V.insights). */
import { useMemo } from 'react';
import { useI } from '@/components/providers/i18n';
import { C } from '@/lib/khabo';
import { allR } from '@/lib/panel/store';
import { Ico, Page, Thumb, useR, useT } from '../ui';

export function Insights() {
  const i = useI(), t = useT(), { r, db } = useR();
  const rows = useMemo(() => {
    const others = allR(db).filter(x => x.id !== r.id && x.city === r.city && !x.hidden);
    return r.menu.filter(d => !d.share).map(d => {
      const ps = others.flatMap(x => x.menu.filter(o => o.type === d.type && !o.share).map(o => o.price)).sort((a, b) => a - b);
      if (!ps.length) return { d, none: true as const };
      const med = ps[Math.floor(ps.length / 2)], pct = Math.round(((d.price - med) / med) * 100);
      return { d, none: false as const, med, pct, n: ps.length, lo: ps[0], hi: ps[ps.length - 1] };
    });
  }, [db, r]);
  const cmp = rows.filter(x => !x.none) as Extract<(typeof rows)[number], { none: false }>[];
  const above = cmp.filter(x => x.pct > 10).length, below = cmp.filter(x => x.pct < -10).length;
  const city = C.cities[r.city] || { en: r.city, bn: r.city };
  return (
    <Page title={t('Price insights', 'দামের তুলনা')} sub={t(`How your prices compare with the same kind of dish elsewhere in ${city.en}. Only you and the Khaoya team see this.`, `${city.bn}-এর অন্য জায়গায় একই ধরনের খাবারের সঙ্গে আপনার দাম কেমন। শুধু আপনি আর খাওয়া টিম এটা দেখেন।`)}>
      <div className="grid g3">
        <div className="card stat"><div className="k"><Ico n="chart-line-up" sm />{t('Dishes compared', 'তুলনা করা খাবার')}</div><div className="v num">{i.N(cmp.length)}</div><div className="d">{t(`of ${rows.length} single-portion dishes`, `${i.N(rows.length)}টি এক প্লেটের খাবারের মধ্যে`)}</div></div>
        <div className="card stat"><div className="k"><Ico n="arrow-up" sm />{t('Priced above typical', 'সাধারণের চেয়ে বেশি দাম')}</div><div className="v num">{i.N(above)}</div><div className="d">{t(`more than 10% over the ${city.en} middle price`, `${city.bn}-এর মাঝামাঝি দামের চেয়ে ১০%-এর বেশি`)}</div></div>
        <div className="card stat"><div className="k"><Ico n="tag" sm />{t('Priced below typical', 'সাধারণের চেয়ে কম দাম')}</div><div className="v num">{i.N(below)}</div><div className="d">{t('a good value point to mention', 'বলার মতো ভালো দাম')}</div></div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="tbl-wrap"><table className="tbl tbl-m">
          <thead><tr><th>{t('Dish', 'খাবার')}</th><th className="r">{t('Your price', 'আপনার দাম')}</th><th className="r">{t(`Middle price in ${city.en}`, `${city.bn}-এ মাঝামাঝি দাম`)}</th><th>{t('Range elsewhere', 'অন্য জায়গায় দামের সীমা')}</th><th className="r">{t('Difference', 'পার্থক্য')}</th></tr></thead>
          <tbody>
            {rows.map(x => (
              <tr key={x.d.id}>
                <td className="who-td"><div className="who"><Thumb p={x.d.p} word={x.d.name.en} /><div><b>{i.L(x.d.name)}</b><span className="meta">{i.L(C.types[x.d.type])}</span></div></div></td>
                <td className="r num" data-k={t('Yours', 'আপনার')} style={{ fontWeight: 700 }}>{i.tk(x.d.price)}</td>
                {x.none ? <td colSpan={3} className="meta" data-k={t('Compared', 'তুলনা')}>{t(`Nobody else in ${city.en} serves this kind of dish yet`, `${city.bn}-এ আর কেউ এখনো এই ধরনের খাবার দেয় না`)}</td> : <>
                  <td className="r num" data-k={t('Middle', 'মাঝামাঝি')}>{i.tk(x.med)}</td>
                  <td className="meta num" data-k={t('Range', 'সীমা')}>{i.tk(x.lo)} {t('to', 'থেকে')} {i.tk(x.hi)} · {t(`${x.n} dish${x.n > 1 ? 'es' : ''}`, `${i.N(x.n)}টি খাবার`)}</td>
                  <td className="r end"><span className={`badge ${x.pct > 10 ? 'warn' : x.pct < -10 ? 'ok' : ''}`}>{x.pct > 0 ? '+' : ''}{i.N(x.pct)}%</span></td>
                </>}
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </Page>
  );
}
