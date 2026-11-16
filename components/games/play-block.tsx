'use client';
/* "Play while you wait": Rickshaw Run under the message on the error page, the wrong-address page and the
   no-signal page. The offline page passes the game in already loaded (factory) so it works with no signal. */
import { useI } from '@/components/providers/i18n';
import { GameHost } from './host';
import type { GameFactory } from './types';

export function PlayBlock({ factory }: { factory?: GameFactory }) {
  const i = useI();
  return (
    <div className="gm-blk">
      <h2 className="h3">{i.bn ? 'অপেক্ষার মাঝে একটু খেলুন' : 'Play while you wait'}</h2>
      <GameHost id="rickshaw" factory={factory} />
    </div>
  );
}
