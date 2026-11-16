import 'server-only';
import en from '@/messages/en.json';
import bn from '@/messages/bn.json';
import type { Lang } from '@/lib/data/types';
import { createI18n, type Dict } from './core';

/* Bangla falls back to English for any word not translated yet */
const DICTS: Record<Lang, Dict> = { en, bn: { ...en, ...bn } };
export const getDict = (lang: Lang): Dict => DICTS[lang];
export const getI18n = (lang: Lang) => createI18n(lang, DICTS[lang]);
