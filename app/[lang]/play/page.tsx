/* A page to try the mini games on their own (not linked anywhere, not indexed): /en/play?g=rickshaw|fuchka|cha,
   optionally &r=<restaurant id> to wear that restaurant's colours and logo like on its table menu. */
import type { Metadata } from 'next';
import { PlayView } from '@/components/games/play-view';

export const metadata: Metadata = { title: 'Games', robots: { index: false, follow: false } };

export default function PlayPage() {
  return <PlayView />;
}
