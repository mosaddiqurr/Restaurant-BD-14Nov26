'use client';
/* Text that changes smoothly: letters that stay slide into place, the rest fade (torph, Emil Kowalski's pick for
   animated text). Use it where words change while you look at them: the rotating examples in the home search box,
   headings that follow a choice ("Open around Dhanmondi" → "Open around Gulshan", "Kacchi in Dhanmondi").
   The text is in the first HTML; with "reduce motion" it simply swaps. */
import { TextMorph } from 'torph/react';
import { useI } from '@/components/providers/i18n';
import { useMedia } from './bits';

type As = 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'b' | 'strong';
export function Morph({ children, as = 'span', className, duration = 380 }: { children: string; as?: As; className?: string; duration?: number }) {
  const i = useI();
  const still = useMedia('(prefers-reduced-motion: reduce)');
  if (still) { const T = as; return <T className={className}>{children}</T>; }
  return <TextMorph as={as} className={className} duration={duration} ease="cubic-bezier(.23, 1, .32, 1)" locale={i.lang}>{children}</TextMorph>;
}
