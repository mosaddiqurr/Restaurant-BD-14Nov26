'use client';
/* Light ⇄ dark without a hard snap: the new colours spread out in a circle from the button that was tapped,
   over the old ones (a View Transition; styles in next.css under html[data-vt=theme]). Browsers without View
   Transitions, and people who turn motion off, get the plain instant switch. */
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';

export function useThemeFlip() {
  const { resolvedTheme, setTheme } = useTheme();
  return (ev?: { clientX: number; clientY: number }) => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    const el = document.documentElement;
    /* set the colours straight away inside the transition, so the "after" picture is already the new theme */
    const apply = () => {
      el.setAttribute('data-theme', next);
      el.style.colorScheme = next;
      flushSync(() => setTheme(next));
    };
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !document.startViewTransition) { apply(); return; }
    const x = ev && ev.clientX ? ev.clientX : innerWidth - 60, y = ev && ev.clientY ? ev.clientY : 34;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    el.style.setProperty('--vt-x', `${x}px`); el.style.setProperty('--vt-y', `${y}px`); el.style.setProperty('--vt-r', `${Math.ceil(r)}px`);
    el.dataset.vt = 'theme';
    const t = document.startViewTransition(apply);
    t.finished.finally(() => { if (el.dataset.vt === 'theme') delete el.dataset.vt; });
  };
}
