/* Words and numbers in English and Bangla. Used on the server and in the browser.
   The words themselves live in messages/en.json and messages/bn.json. */
import type { Lang, Text } from '@/lib/data/types';

export type Dict = Record<string, string>;
export const LANGS: Lang[] = ['en', 'bn'];
export const isLang = (v: unknown): v is Lang => v === 'en' || v === 'bn';

const BD = '০১২৩৪৫৬৭৮৯';
const MON = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  bn: ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'],
};
/* words the design added that share a key with older words: those were saved as x_<key> */
const CLASH = new Set(['pause', 'play', 'owner_reply', 'prices']);
const NF = { en: new Intl.NumberFormat('en-IN'), bn: new Intl.NumberFormat('bn-BD') };

export const fill = (s: string, v?: Record<string, string | number>) =>
  v ? s.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? String(v[k]) : m)) : s;

export type Vars = Record<string, string | number>;

export function createI18n(lang: Lang, dict: Dict, fallback?: Dict) {
  const word = (k: string) => dict[k] ?? fallback?.[k];
  /** a word from the dictionary, with {slots} filled in. "_one" versions are used when n is 1 */
  const t = (k: string, v?: Vars) => {
    if (v && (v.n === 1 || v.n === '1' || v.n === '১') && word(k + '_one') != null) k += '_one';
    return fill(word(k) ?? k, v);
  };
  /** the same, for the words this design added (they were kept apart in the prototype) */
  const tx = (k: string, v?: Vars) => t(CLASH.has(k) ? 'x_' + k : k, v);
  /** pick the right language from a {en, bn} text */
  const L = (o: Partial<Text> | string | null | undefined) =>
    o == null ? '' : typeof o === 'string' ? o : (o[lang] ?? o.en ?? '');
  const N = (v: number) => NF[lang].format(v);
  const dg = (s: string | number) => (lang === 'bn' ? String(s).replace(/[0-9]/g, c => BD[+c]) : String(s));
  /** a price as plain text: ৳420 */
  const tk = (v: number) => '৳' + N(Math.round(v));
  const dm = (d: Date) => `${dg(d.getDate())} ${MON[lang][d.getMonth()]}`;
  const mon = (m: number) => MON[lang][m];
  return { lang, t, tx, L, N, dg, tk, dm, mon, bn: lang === 'bn' };
}
export type I18n = ReturnType<typeof createI18n>;
