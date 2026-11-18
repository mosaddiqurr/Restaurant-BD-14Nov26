'use client';
import Link from 'next/link';
import { useI } from '@/components/providers/i18n';
import { Logo, Seg } from '@/components/ui/bits';
import { useApp } from '@/lib/store';
import { C } from '@/lib/khabo';
import { useHref } from './nav';
import { useOtherLang } from './header';

export function Footer() {
  const i = useI(), href = useHref();
  const set = useApp(s => s.set);
  const { other, go: goLang } = useOtherLang();
  const areas = (c: string) => C.areas.filter(z => z.city === c).map(z => <Link key={z.id} href={href('/restaurants', { area: z.id })}>{i.L(z)}</Link>);
  const btn = (label: string, fn: () => void) => <a href="#" onClick={ev => { ev.preventDefault(); fn(); }}>{label}</a>;
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="cols">
          <div>
            <span className="logo"><Logo /></span>
            <p style={{ marginTop: 10, maxWidth: '34ch' }}>{i.t('footer_line')}</p>
            <div style={{ marginTop: 16 }}>
              <Seg id="f-lang" cls="dark" items={[['en', 'English'], ['bn', 'বাংলা']]} value={i.lang}
                onChange={v => { if (v === other) goLang(); }} />
            </div>
          </div>
          <div><b>{i.L(C.cities.dhaka)}</b>{areas('dhaka')}</div>
          <div><b>{i.L(C.cities.bogura)}</b>{areas('bogura')}<Link href={href('/dishes')}>{i.t('nav_dishes')}</Link><Link href={href('/deals')}>{i.t('nav_deals')}</Link></div>
          <div>
            <b>Khaoya</b>
            <Link href={href('/restaurants')}>{i.t('nav_restaurants')}</Link>
            <Link href={href('/prices')}>{i.tx('prices')}</Link>
            <Link href={href('/events')}>{i.tx('events')}</Link>
            {btn(i.t('ask_ai'), () => set({ ai: { q: '' } }))}
            {btn(i.t('your_account'), () => set({ signin: {} }))}
            <Link href={href('/business')}>{i.t('help')}</Link>
          </div>
          <div>
            <b>{i.t('nav_business')}</b>
            <Link href={href('/business')}>{i.t('get_listed')}</Link>
            <Link href={href('/business') + '#plans'}>{i.t('plans')}</Link>
            <Link href={href('/t/shahi-handi')}>{i.t('qr_menu')}</Link>
            <Link href={href('/partner')}>{i.t('partner_sign_in')}</Link>
          </div>
        </div>
        <div className="word" aria-hidden="true">khaoya</div>
        <div className="base"><span>© 2026 Khaoya</span><span style={{ display: 'flex', gap: 16 }}><Link href={href('/business')}>{i.t('terms')}</Link><Link href={href('/business')}>{i.t('privacy')}</Link></span></div>
      </div>
    </footer>
  );
}
