'use client';
import { useState } from 'react';
import { useI } from '@/components/providers/i18n';
import { I, Logo } from '@/components/ui/bits';
import rickshaw from './rickshaw';
import fuchka from './fuchka';
import cha from './cha';
import { GAMES, GameHost } from './host';
import type { GameFactory, GameId } from './types';

/* all three games are built into this page (not loaded later), so the phone keeps them and they play with no signal */
const ALL: Record<GameId, GameFactory> = { rickshaw, fuchka, cha };
const ORDER: GameId[] = ['rickshaw', 'fuchka', 'cha'];
import '@/styles/error.css';

/** no signal: say so plainly, offer Try again, and three games to play meanwhile */
export function OfflineView() {
  const i = useI();
  const [g, setG] = useState<GameId>('rickshaw');
  /* Try again: back to the page the person wanted (the worker sends ?from=...), else reload */
  const again = () => {
    const from = new URLSearchParams(location.search).get('from');
    if (from && from.startsWith('/') && !from.startsWith('//')) location.href = from; else location.reload();
  };
  const w = i.bn
    ? { h: 'ইন্টারনেট সংযোগ নেই', p: 'নেটওয়ার্ক ফিরলে আবার চেষ্টা করুন। ততক্ষণ একটু খেলে নিন।', again: 'আবার চেষ্টা করুন' }
    : { h: 'No internet connection', p: 'Try again when you have signal. Until then, have a little game.', again: 'Try again' };
  return (
    <main className="errv wrap off-v" role="alert">
      <span className="logo off-logo"><Logo /></span>
      <div className="errv-ic" aria-hidden="true"><I n="wifi-slash" /></div>
      <h1 className="h2">{w.h}</h1>
      <p className="sub">{w.p}</p>
      <div className="errv-a">
        <button type="button" className="btn btn-pri" onClick={again}><I n="arrow-clockwise" b />{w.again}</button>
      </div>
      <div className="gm-blk">
        <h2 className="h3">{i.bn ? 'অপেক্ষার মাঝে একটু খেলুন' : 'Play while you wait'}</h2>
        <div className="gm-tabs" role="tablist">
          {ORDER.map(id => (
            <button key={id} type="button" role="tab" aria-selected={g === id} className={g === id ? 'on' : ''} onClick={() => setG(id)}>
              <I n={GAMES[id].icon} f={g === id} />{i.L(GAMES[id].name)}
            </button>
          ))}
        </div>
        <GameHost key={g} id={g} factory={ALL[g]} />
      </div>
    </main>
  );
}
