'use client';
import { createContext, useContext, useMemo } from 'react';
import type { Lang } from '@/lib/data/types';
import { createI18n, type Dict, type I18n } from '@/lib/i18n/core';

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ lang, dict, children }: { lang: Lang; dict: Dict; children: React.ReactNode }) {
  const value = useMemo(() => createI18n(lang, dict), [lang, dict]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** words, numbers and prices in the page's language */
export function useI() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI must be used inside I18nProvider');
  return v;
}
