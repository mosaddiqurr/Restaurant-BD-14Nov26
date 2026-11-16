'use client';
/* Table menu: three small games to play while the food comes (Rickshaw Run, Fuchka Catch, Cha Stack). They wear
   THIS restaurant's colours and logo only: the logo comes from this restaurant's own files (r.brand.logo), and with
   no logo the games show its initials. Best scores are kept per restaurant. The games load only when opened. */
import { useState } from 'react';
import clsx from 'clsx';
import { Drawer } from 'vaul';
import { useI } from '@/components/providers/i18n';
import { I } from '@/components/ui/bits';
import { GAMES, GameHost } from '@/components/games/host';
import type { Brand, GameId } from '@/components/games/types';
import { restFile } from '@/lib/khabo';
import type { Restaurant } from '@/lib/data/types';
import { rVars } from './parts';

const ORDER: GameId[] = ['rickshaw', 'fuchka', 'cha'];
const W = {
  title: { en: 'Play while you wait', bn: 'অপেক্ষার মাঝে খেলুন' },
  sub: { en: 'Three quick games while your food is on the way', bn: 'খাবার আসা পর্যন্ত তিনটি ছোট খেলা' },
  close: { en: 'Close', bn: 'বন্ধ করুন' },
};

export const brandOf = (r: Pick<Restaurant, 'id' | 'theme' | 'brand' | 'mono' | 'name'>): Brand => ({
  deep: r.theme.deep, accent: r.theme.accent,
  logo: r.brand?.logo ? restFile(r.id, r.brand.logo) : null,
  mono: r.mono, name: r.name.en,
});

/** the card in the menu that opens the games */
export function GamesCard({ onOpen }: { onOpen: () => void }) {
  const i = useI();
  return (
    <button type="button" className="tm-card tm-play" onClick={onOpen}>
      <I n="game-controller" /><span><b>{i.L(W.title)}</b><span>{i.L(W.sub)}</span></span><I n="caret-right" b />
    </button>
  );
}

export function TableGames({ r, open, onClose, theme }: { r: Restaurant; open: boolean; onClose: () => void; theme: string }) {
  const i = useI();
  const [g, setG] = useState<GameId>('rickshaw');
  return (
    <Drawer.Root open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="tmx-over" />
        <Drawer.Content className={clsx('tmx tmx-c tmx-games', 'tm-th-' + theme)} style={rVars(r)} data-font={r.theme.font} aria-describedby={undefined}
          /* tapping into the game can make the browser scroll the sheet to show it; the sheet never scrolls */
          onScroll={ev => { if (ev.currentTarget.scrollTop) ev.currentTarget.scrollTop = 0; }}>
          <div className="tmx-g-h">
            <span className="tmx-grip" aria-hidden="true" />
            <Drawer.Title className="tmx-name">{i.L(W.title)}</Drawer.Title>
            <button type="button" className="tmx-x" onClick={onClose} aria-label={i.L(W.close)}><I n="x" b /></button>
          </div>
          <div className="tmx-g-tabs" role="tablist">
            {ORDER.map(id => (
              <button key={id} type="button" role="tab" aria-selected={g === id} className={g === id ? 'on' : ''} onClick={() => setG(id)}>
                <I n={GAMES[id].icon} f={g === id} />{i.L(GAMES[id].name)}
              </button>
            ))}
          </div>
          {/* the game takes every touch inside it: dragging there never pulls the sheet down */}
          <div className="tmx-g-play" data-vaul-no-drag="">
            {open ? <GameHost key={g} id={g} brand={brandOf(r)} scope={r.id} compact /> : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
