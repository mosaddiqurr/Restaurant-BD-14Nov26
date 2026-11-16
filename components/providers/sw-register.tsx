'use client';
/* Puts the khabo worker (public/sw.js) on the phone after the page has settled, so a later visit with no signal
   shows the "No internet" page with Rickshaw Run instead of the browser's error. The table menu also registers it. */
import { useEffect } from 'react';

export function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const go = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(() => navigator.serviceWorker.ready)
        .then(reg => reg.active?.postMessage({ type: 'offline' }))
        .catch(() => { /* the site still works online */ });
    };
    const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const id = ric ? ric(go, { timeout: 6000 }) : window.setTimeout(go, 3000);
    return () => { if (!ric) clearTimeout(id); };
  }, []);
  return null;
}
