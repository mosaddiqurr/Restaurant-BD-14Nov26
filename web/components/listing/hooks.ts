'use client';
/* Small browser-only readings for these pages, safe for the first (server-matching) render:
   the server and the hydrating browser both see null / false, then the real value. */
import { useSyncExternalStore } from 'react';

const none = () => () => {};
let T: number | null = null;
/** the time, read once a minute at most so every part of a page agrees. null on the server and while hydrating */
export function useNow() {
  return useSyncExternalStore(none, () => { const n = Date.now(); if (T == null || n - T > 6e4) T = n; return T; }, () => null);
}

/** a media query, e.g. "(max-width: 600px)". false on the server */
export function useMedia(q: string) {
  return useSyncExternalStore(
    cb => { const m = matchMedia(q); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => matchMedia(q).matches,
    () => false,
  );
}
