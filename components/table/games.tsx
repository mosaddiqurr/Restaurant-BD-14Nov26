'use client';
/* Table menu: three small games to play while the food comes (Rickshaw Run, Fuchka Catch, Cha Stack). They wear
   THIS restaurant's colours and logo only: the logo comes from this restaurant's own files (r.brand.logo), and with
   no logo the games show its initials. Best scores are kept per restaurant. The games load only when opened.
   Two ways in: a small "Games" button at the top of the menu (always easy to reach) and a card at the end of the
   menu, so the games never sit between the guest and the food. */
import { useState } from 'react';
import clsx from 'clsx';
import { Drawer } from 'vaul';
import { useI } from '@/components/providers/i18n';
import { I, Mono } from '@/components/ui/bits';
import { GAMES, GameHost, bestKey, readBest } from '@/components/games/host';
import type { Brand, GameId } from '@/components/games/types';
import { restFile } from '@/lib/khabo';
import type { Restaurant } from '@/lib/data/types';
import { rVars } from './parts';

const ORDER: GameId[] = ['rickshaw', 'fuchka', 'cha'];
const W = {
  title: { en: 'Play while you wait', bn: 'অপেক্ষার মাঝে খেলুন' },
  sub: { en: 'Three quick games while your food is on the way', bn: 'খাবার আসা পর্যন্ত তিনটি ছোট খেলা' },
  short: { en: 'Games', bn: 'খেলা' },
  pick: { en: 'Pick a game', bn: 'একটি খেলা বাছুন' },
  best: { en: 'Best {n}', bn: 'সেরা {n}' },
  fresh: { en: 'Not played yet', bn: 'এখনো খেলেননি' },
  close: { en: 'Close', bn: 'বন্ধ করুন' },
};

export const brandOf = (r: Pick<Restaurant, 'id' | 'theme' | 'brand' | 'mono' | 'name'>): Brand => ({
  deep: r.theme.deep, accent: r.theme.accent,
  logo: r.brand?.logo ? restFile(r.id, r.brand.logo) : null,
  mono: r.mono, name: r.name.en,
});

/** the small button at the top of the menu, next to the language switch */
export function GamesButton({ onOpen }: { onOpen: () => void }) {
  const i = useI();
  return <button type="button" className="tm-lang tm-play-b" onClick={onOpen}><I n="game-controller" f />{i.L(W.short)}</button>;
}

/** the card at the end of the menu: the three games in a row, tap one to start it */
export function GamesCard({ onOpen }: { onOpen: (g?: GameId) => void }) {
  const i = useI();
  return (
    <div className="tm-card tm-play">
      <button type="button" className="tm-play-h" onClick={() => onOpen()}>
        <I n="game-controller" /><span><b>{i.L(W.title)}</b><span>{i.L(W.sub)}</span></span><I n="caret-right" b />
      </button>
      <div className="tm-play-g">
        {ORDER.map(id => (
          <button key={id} type="button" onClick={() => onOpen(id)}>
            <span className="tg-ic"><I n={GAMES[id].icon} /></span>{i.L(GAMES[id].name)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TableGames({ r, open, onClose, theme, start }: { r: Restaurant; open: boolean; onClose: () => void; theme: string; start?: GameId }) {
  const i = useI();
  const [g, setG] = useState<GameId>('rickshaw');
  const [best, setBest] = useState<Partial<Record<GameId, number>>>({});
  /* each time it opens: start on the game the guest tapped, and read the best scores kept on this phone */
  const [was, setWas] = useState(false);
  if (open && !was) {
    setWas(true);
    if (start) setG(start);
    setBest(Object.fromEntries(ORDER.map(id => [id, readBest(bestKey(id, r.id))])));
  }
  if (!open && was) setWas(false);
  const pick = (id: GameId) => { setG(id); setBest(b => ({ ...b, [g]: readBest(bestKey(g, r.id)) })); };
  return (
    <Drawer.Root open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="tmx-over" />
        <Drawer.Content className={clsx('tmx tmx-c tmx-games', 'tm-th-' + theme)} style={rVars(r)} data-font={r.theme.font}
          /* tapping into the game can make the browser scroll the sheet to show it; the sheet never scrolls */
          onScroll={ev => { if (ev.currentTarget.scrollTop) ev.currentTarget.scrollTop = 0; }}>
          <span className="tmx-grip" aria-hidden="true" />
          <div className="tmx-g-h">
            <Mono r={r} />
            <div className="tmx-g-t">
              <Drawer.Title className="tmx-name">{i.L(W.title)}</Drawer.Title>
              <Drawer.Description className="tmx-g-sub">{i.L(r.name)}</Drawer.Description>
            </div>
            <button type="button" className="tmx-x" onClick={onClose} aria-label={i.L(W.close)}><I n="x" b /></button>
          </div>
          <div className="tmx-g-tabs" role="tablist" aria-label={i.L(W.pick)}>
            {ORDER.map(id => {
              const n = best[id] || 0;
              return (
                <button key={id} type="button" role="tab" aria-selected={g === id} className={g === id ? 'on' : ''} onClick={() => pick(id)}>
                  <span className="tg-ic"><I n={GAMES[id].icon} f={g === id} /></span>
                  <b>{i.L(GAMES[id].name)}</b>
                  <small>{n ? i.L(W.best).replace('{n}', i.N(n)) : i.L(W.fresh)}</small>
                </button>
              );
            })}
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
