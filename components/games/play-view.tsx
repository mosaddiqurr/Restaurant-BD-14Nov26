'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { GameHost, KHABO } from './host';
import type { Brand, GameId } from './types';

function Inner() {
  const q = useSearchParams();
  const g = (['rickshaw', 'fuchka', 'cha'].includes(q.get('g') || '') ? q.get('g') : 'rickshaw') as GameId;
  const brand: Brand = q.get('logo') ? { deep: q.get('deep') || '#3A1416', accent: q.get('acc') || '#E3A33A', logo: q.get('logo'), mono: 'SH', name: 'Test' } : KHABO;
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, minHeight: '100dvh', background: 'var(--bg)' }}>
      <GameHost id={g} brand={brand} />
    </main>
  );
}
export function PlayView() { return <Suspense><Inner /></Suspense>; }
