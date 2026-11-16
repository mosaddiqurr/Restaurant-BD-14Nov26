'use client';
/* Moving between pages: every link keeps the page language (/en or /bn) and lists keep their filters in the address. */
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useI } from '@/components/providers/i18n';
import { LIST_KEYS } from '@/lib/khabo';

export type Q = Record<string, string | number | boolean | string[] | undefined | null>;
export const qs = (f: Q) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v == null || v === '' || v === false || (Array.isArray(v) && !v.length)) continue;
    p.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = p.toString();
  return s ? '?' + s : '';
};
export const parseQs = (sp: URLSearchParams) => {
  const f: Record<string, string | string[]> = {};
  sp.forEach((v, k) => { f[k] = (LIST_KEYS as readonly string[]).includes(k) ? v.split(',').filter(Boolean) : v; });
  return f;
};

/** an address inside the current language */
export function useHref() {
  const { lang } = useI();
  return useCallback((path: string, q?: Q) => `/${lang}${path === '/' ? '' : path}${q ? qs(q) : ''}`, [lang]);
}

/** go to a page, with the soft page change */
export function useGo() {
  const router = useRouter();
  const href = useHref();
  return useCallback((path: string, q?: Q, o?: { scroll?: boolean }) => router.push(href(path, q), { scroll: o?.scroll ?? true }), [router, href]);
}
