'use client';
/* Small helpers for the home page and the overlays it opens. */
import { Fragment, useSyncExternalStore, type ReactNode } from 'react';
import type { I18n } from '@/lib/i18n/core';

/** a word with parts inside it (a price, a link): "from {p}" with p = <Tk v={280} /> */
export function tj(i: I18n, k: string, v: Record<string, ReactNode>) {
  const flat: Record<string, string> = {};
  Object.keys(v).forEach(a => { flat[a] = '\u0000' + a + '\u0000'; });
  return i.t(k, flat).split(/\u0000(\w+)\u0000/).map((p, n) => <Fragment key={n}>{n % 2 ? v[p] : p}</Fragment>);
}

/** true while a media query matches (false on the server and in the first paint) */
export function useMedia(q: string) {
  return useSyncExternalStore(
    cb => { const m = matchMedia(q); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => matchMedia(q).matches,
    () => false,
  );
}

const still = () => () => {};
/** the current minute, known only in the browser (0 on the server and in the first paint, so pages hydrate cleanly) */
export const useMinute = () => useSyncExternalStore(still, () => Math.floor(Date.now() / 60000), () => 0);
/** true when the phone asks to save data */
export const useSaveData = () => useSyncExternalStore(still, () => !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData, () => false);

/** phones get bottom sheets and films that wait to be asked */
export const PHONE = '(max-width: 720px)';
