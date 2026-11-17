'use client';
/* Small browser-only readings for these pages, safe for the first (server-matching) render:
   the server and the hydrating browser both see null / false, then the real value. */
import { useSyncExternalStore } from 'react';

/** calls back at the start of every minute, and when the tab comes back into view, so times on screen stay true
    (an event that just ended goes away by itself) */
export function everyMinute(cb: () => void) {
  let tm: ReturnType<typeof setTimeout>;
  const go = () => { tm = setTimeout(() => { cb(); go(); }, 60000 - (Date.now() % 60000) + 30); };
  const seen = () => { if (!document.hidden) cb(); };
  go(); document.addEventListener('visibilitychange', seen);
  return () => { clearTimeout(tm); document.removeEventListener('visibilitychange', seen); };
}
let T: number | null = null;
/** the time, read once a minute at most so every part of a page agrees. null on the server and while hydrating */
export function useNow() {
  return useSyncExternalStore(everyMinute, () => { const n = Date.now(); if (T == null || Math.floor(n / 6e4) !== Math.floor(T / 6e4)) T = n; return T; }, () => null);
}

/** a media query, e.g. "(max-width: 600px)". false on the server */
export function useMedia(q: string) {
  return useSyncExternalStore(
    cb => { const m = matchMedia(q); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => matchMedia(q).matches,
    () => false,
  );
}
