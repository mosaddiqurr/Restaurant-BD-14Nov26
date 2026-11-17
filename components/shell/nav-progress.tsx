'use client';
/* A thin line across the top that starts the moment a link to another page is tapped, creeps while the page
   is on its way, and runs to the end and fades when it arrives. Fast changes never show it (it waits 120ms).
   So every tap is felt at once, even when the next page takes a moment. Flat colour, no glow. */
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function Bar() {
  const path = usePathname(), sp = useSearchParams();
  const loc = path + '?' + sp.toString();
  const [st, setSt] = useState<'idle' | 'run' | 'done'>('idle');
  const [n, setN] = useState(0);
  /* the new page is here: finish the line */
  const [seen, setSeen] = useState(loc);
  if (seen !== loc) { setSeen(loc); if (st === 'run') setSt('done'); }

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || !a.href || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin) return;
      /* the same page (or only a #jump on it) is not a page change */
      if (u.pathname === location.pathname && u.search === location.search) return;
      setN(x => x + 1); setSt('run');
    };
    addEventListener('click', click, true);
    return () => removeEventListener('click', click, true);
  }, []);
  useEffect(() => {
    if (st === 'done') { const tm = setTimeout(() => setSt('idle'), 450); return () => clearTimeout(tm); }
    /* a page that never comes (offline, cancelled) does not leave the line hanging */
    if (st === 'run') { const tm = setTimeout(() => setSt('idle'), 12000); return () => clearTimeout(tm); }
  }, [st]);
  if (st === 'idle') return null;
  return <div key={n} className={'navp ' + st} aria-hidden="true" />;
}

export function NavProgress() {
  return <Suspense fallback={null}><Bar /></Suspense>;
}
