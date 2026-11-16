'use client';
/* Offline for the table menu. After the first scan the menu is saved on the phone by a small service worker
   (public/sw.js), so it opens again with weak or no signal. This file registers that worker (only the table menu
   does), tells it which files this page used so they are kept too, and finds out whether the page on screen is
   the saved copy, so the guest can see how old the prices are. */
import { useEffect, useState } from 'react';
import { useI } from '@/components/providers/i18n';
import { I } from '@/components/ui/bits';
import type { Restaurant } from '@/lib/data/types';
import { W, fillW } from './words';

export type Offline = {
  /** the phone has no connection */
  off: boolean;
  /** this page is the copy saved on the phone (no signal, or too weak to load in time) */
  fromCopy: boolean;
  /** when the copy on this phone was saved */
  savedAt: number | null;
  /** the menu is saved on this phone now */
  saved: boolean;
  /** when the connection was last checked */
  seenAt: number;
};

/* the same names as in public/sw.js */
const PAGES = 'khabo-pages-v1';
const KEEP = /^\/(_next\/static|icons|media)\//;
const PHOTO_HOSTS = /^(images\.unsplash\.com|cdn\.polyhaven\.com|fonts\.(gstatic|googleapis)\.com)$/;

/** ask the worker something and wait (up to a few seconds) for its answer */
function ask<T>(sw: ServiceWorker, msg: Record<string, unknown>, ms = 8000): Promise<T | null> {
  return new Promise(res => {
    const ch = new MessageChannel(), t = setTimeout(() => res(null), ms);
    ch.port1.onmessage = e => { clearTimeout(t); res(e.data as T); };
    try { sw.postMessage(msg, [ch.port2]); } catch { clearTimeout(t); res(null); }
  });
}

/** the files this page has used that are worth keeping for the next visit with no signal */
function usedFiles() {
  const out = new Set<string>();
  try {
    for (const e of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
      const u = new URL(e.name);
      if (u.origin === location.origin ? KEEP.test(u.pathname) : PHOTO_HOSTS.test(u.hostname)) out.add(u.href);
    }
  } catch { /* old browser: the worker still keeps files as they load */ }
  document.querySelectorAll<HTMLImageElement>('img[src]').forEach(im => { if (im.currentSrc) out.add(im.currentSrc); });
  return [...out].slice(0, 200);
}

export function useTableOffline(): Offline {
  const [s, setS] = useState<Offline>({ off: false, fromCopy: false, savedAt: null, saved: false, seenAt: 0 });
  useEffect(() => {
    let alive = true;
    const set = (o: Partial<Offline>) => { if (alive) setS(v => ({ ...v, ...o })); };
    const net = () => set({ off: !navigator.onLine, seenAt: Date.now() });
    net();
    addEventListener('online', net); addEventListener('offline', net);
    const page = location.pathname.replace(/\/$/, '');
    /* the time the copy on this phone was saved (kept with the copy) */
    const readSaved = async () => {
      try {
        const hit = await (await caches.open(PAGES)).match(location.origin + page);
        const at = Number(hit?.headers.get('x-khabo-saved')) || null;
        if (at) set({ savedAt: at, saved: true });
      } catch { /* no storage in a private window */ }
    };
    readSaved();
    if (!('serviceWorker' in navigator)) return () => { alive = false; removeEventListener('online', net); removeEventListener('offline', net); };
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => { /* the menu still works online */ });
    let idle = 0;
    navigator.serviceWorker.ready.then(async reg => {
      const sw = navigator.serviceWorker.controller || reg.active;
      if (!sw || !alive) return;
      const info = await ask<{ from: 'cache' | 'net'; at: number | null }>(sw, { type: 'info' }, 3000);
      if (info?.from === 'cache') { set({ fromCopy: true, savedAt: info.at, saved: true }); return; }
      /* keep this page and what it used; wait for a quiet moment so it never slows the menu down */
      const save = async () => {
        const done = await ask<{ at: number | null }>(sw, { type: 'save', page, files: usedFiles() }, 20000);
        if (done?.at) set({ savedAt: done.at, saved: true });
      };
      const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) idle = ric(() => { save(); }, { timeout: 4000 }); else idle = window.setTimeout(save, 1500);
    });
    /* photos that load later (while scrolling) are kept by the worker as they arrive; this catches the rest */
    const hide = () => { if (document.visibilityState === 'hidden' && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ type: 'save', page, files: usedFiles(), quiet: true }); };
    document.addEventListener('visibilitychange', hide);
    return () => { alive = false; clearTimeout(idle); removeEventListener('online', net); removeEventListener('offline', net); document.removeEventListener('visibilitychange', hide); };
  }, []);
  return s;
}

/** the quiet note at the top of the menu when the guest sees the saved copy */
export function OfflineNote({ s, r }: { s: Offline; r: Pick<Restaurant, 'checked' | 'checkedAt'> }) {
  const i = useI();
  if (!s.off && !s.fromCopy) return null;
  const base = s.savedAt || s.seenAt;
  const pricesAt = new Date(r.checkedAt || base - r.checked * 864e5);
  const savedAt = s.savedAt ? new Date(s.savedAt) : null;
  const time = savedAt ? savedAt.toLocaleTimeString(i.bn ? 'bn-BD' : 'en-GB', { hour: 'numeric', minute: '2-digit' }) + ', ' + i.dm(savedAt) : '';
  return (
    <div className="tm-off" role="status">
      <p><I n="wifi-slash" /><span>{fillW(i.L(s.off ? W.offline : W.weak), { d: i.dm(pricesAt) })}</span></p>
      {time ? <small>{fillW(i.L(W.updated), { t: time })}</small> : null}
    </div>
  );
}
