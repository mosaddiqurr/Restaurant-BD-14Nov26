'use client';
/* Switching Bangla ⇄ English swaps the whole page frame, and React then clears everything set on <html>: the
   dark or light theme (next-themes only puts it back a moment later, so the page flashed the wrong colours) and
   the mark that makes the language cross-fade. Put both back before the new page is drawn. */
import { useLayoutEffect } from 'react';

type W = Window & { __khaboVT?: string };

export function KeepHtml() {
  useLayoutEffect(() => {
    const el = document.documentElement;
    try {
      const t = localStorage.getItem('theme') || 'system';
      const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      el.setAttribute('data-theme', dark ? 'dark' : 'light');
      el.style.colorScheme = dark ? 'dark' : 'light';
    } catch { /* storage blocked: next-themes still sets it */ }
    const vt = (window as W).__khaboVT;
    if (vt) el.dataset.vt = vt;
  }, []);
  return null;
}
