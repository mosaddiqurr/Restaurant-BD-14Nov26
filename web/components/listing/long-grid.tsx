'use client';
/* Lists that can grow to thousands (restaurants, dishes). Up to BIG items: the normal grid with its swap animation.
   Past that: Virtuoso (Emil Kowalski's pick for long lists) draws only the cards near the screen, so a list of
   3,000 restaurants scrolls as smoothly as 12. The first cards are in the first HTML either way. */
import type { ReactNode } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';

export const BIG = 60;

export function LongGrid<T>({ items, small, card, cls = 'grid3', first = 24 }: {
  items: T[]; small: () => ReactNode; card: (it: T, k: number) => ReactNode; cls?: string; first?: number;
}) {
  if (items.length <= BIG) return <>{small()}</>;
  return (
    <VirtuosoGrid useWindowScroll data={items} totalCount={items.length} initialItemCount={Math.min(first, items.length)} increaseViewportBy={600}
      listClassName={cls} itemContent={(k, it) => card(it, k)} />
  );
}
