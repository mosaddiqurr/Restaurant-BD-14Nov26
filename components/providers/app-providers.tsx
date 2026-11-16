'use client';
/* Everything the whole site shares: language, light or dark, motion settings, toasts, saved state, shortcuts. */
import { useEffect, type ReactNode } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { LazyMotion, MotionConfig } from 'motion/react';
import dynamic from 'next/dynamic';
/* the toast area loads after the page has drawn */
const Toaster = dynamic(() => import('sonner').then(m => m.Toaster), { ssr: false });
import type { Lang } from '@/lib/data/types';
import type { Dict } from '@/lib/i18n/core';
import { useApp } from '@/lib/store';
import { I18nProvider } from './i18n';

const loadMotion = () => import('@/lib/motion-features').then(r => r.default);

function Toasts() {
  const { resolvedTheme } = useTheme();
  return <Toaster position="top-center" theme={resolvedTheme === 'dark' ? 'dark' : 'light'} toastOptions={{ style: { fontFamily: 'var(--sans)', borderRadius: '14px' } }} />;
}

function Keys() {
  useEffect(() => {
    /* the bill, area and own reviews come back from this browser after the page has drawn */
    useApp.persist.rehydrate();
    const h = (ev: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName || '';
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); useApp.getState().set({ palette: true }); }
      else if (ev.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag)) { ev.preventDefault(); useApp.getState().set({ palette: true }); }
    };
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, []);
  return null;
}

export function AppProviders({ lang, dict, children }: { lang: Lang; dict: Dict; children: ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      <I18nProvider lang={lang} dict={dict}>
        <LazyMotion features={loadMotion}>
          <MotionConfig reducedMotion="user">
            {children}
            <Keys />
            <Toasts />
          </MotionConfig>
        </LazyMotion>
      </I18nProvider>
    </ThemeProvider>
  );
}
