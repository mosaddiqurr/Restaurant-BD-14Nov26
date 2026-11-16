/* The page the phone shows when there is no internet at all (public/sw.js keeps a copy of it and its files on the
   phone after the first visit to khabo). Rickshaw Run is built into it, so it plays with no signal. */
import type { Metadata } from 'next';
import { OfflineView } from '@/components/games/offline-view';

export const metadata: Metadata = { title: 'No internet', robots: { index: false, follow: false } };

export default function OfflinePage() {
  return <OfflineView />;
}
