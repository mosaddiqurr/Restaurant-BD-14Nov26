'use client';
/* Phones: the "More" button in the top bar opens this sheet with every part of khabo the bottom bar has no room for
   (Prices, Events, For restaurants), the main ones again for pages without the bottom bar (a restaurant's page),
   and the language and light/dark switches. Laptops have all of this in the top bar already. */
import Link from 'next/link';
import { Drawer } from 'vaul';
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { I } from '@/components/ui/bits';
import { useThemeFlip } from '@/components/ui/theme-flip';
import { useHref } from './nav';
import { useOtherLang, usePage } from './header';

export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const i = useI(), href = useHref(), page = usePage();
  const { resolvedTheme } = useTheme();
  const flip = useThemeFlip();
  const { go: switchLang } = useOtherLang();
  const tiles: [string, string, string, string][] = [
    ['restaurants', '/restaurants', 'storefront', i.t('more_rest')],
    ['dishes', '/dishes', 'bowl-food', i.t('more_dishes')],
    ['deals', '/deals', 'tag', i.t('mm_deals')],
    ['prices', '/prices', 'chart-line-up', i.t('more_prices')],
    ['events', '/events', 'calendar-star', i.t('more_events')],
    ['business', '/business', 'handshake', i.t('more_business')],
  ];
  const names: Record<string, string> = {
    restaurants: i.t('nav_restaurants'), dishes: i.t('nav_dishes'), deals: i.t('nav_deals'),
    prices: i.tx('prices'), events: i.tx('events'), business: i.t('nav_business'),
  };
  const dark = resolvedTheme === 'dark';
  return (
    <Drawer.Root open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="vaul-over" />
        <Drawer.Content className="vaul-c" aria-describedby={undefined}>
          <div className="sheet more-s">
            <div className="sheet-grip" />
            <div className="sheet-h"><Drawer.Title className="h3">{i.t('more')}</Drawer.Title><button className="x" onClick={onClose} aria-label={i.t('close')}><I n="x" b /></button></div>
            <nav className="more-g" aria-label={i.t('more')}>
              {tiles.map(([p, path, icon, line]) => (
                <Link key={p} href={href(path)} className={clsx('more-t', page === p && 'on')} onClick={onClose}>
                  <span className="more-i"><I n={icon} f={page === p} /></span>
                  <b>{names[p]}</b><small>{line}</small>
                </Link>
              ))}
            </nav>
            <div className="more-sw">
              <div className="more-row">
                <span><I n="translate" />{i.t('language')}</span>
                <div className="more-seg" role="group" aria-label={i.t('language')}>
                  <button type="button" className={!i.bn ? 'on' : ''} aria-pressed={!i.bn} onClick={() => { if (i.bn) { onClose(); switchLang(); } }}>English</button>
                  <button type="button" className={i.bn ? 'on' : ''} aria-pressed={i.bn} onClick={() => { if (!i.bn) { onClose(); switchLang(); } }}><span className="bn">বাংলা</span></button>
                </div>
              </div>
              <div className="more-row">
                <span><I n={dark ? 'moon' : 'sun'} />{i.t('look')}</span>
                <div className="more-seg" role="group" aria-label={i.t('look')}>
                  <button type="button" className={!dark ? 'on' : ''} aria-pressed={!dark} onClick={ev => { if (dark) flip(ev); }}>{i.t('light')}</button>
                  <button type="button" className={dark ? 'on' : ''} aria-pressed={dark} onClick={ev => { if (!dark) flip(ev); }}>{i.t('dark')}</button>
                </div>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
