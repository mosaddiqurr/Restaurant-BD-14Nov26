'use client';
import Link from 'next/link';
import { m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I } from '@/components/ui/bits';
import { EASE } from '@/lib/khabo';
import { useHref } from './nav';
import { PlayBlock } from '@/components/games/play-block';

/* an empty plate: the page you wanted is not on the menu */
export function NotFoundView() {
  const i = useI(), href = useHref();
  const w = i.bn
    ? { h: 'এই পাতাটা মেনুতে নেই', p: 'ঠিকানাটা হয়তো বদলে গেছে বা ভুল লেখা হয়েছে। নিচের যেকোনো জায়গা থেকে আবার শুরু করুন।', home: 'হোমে ফিরুন', rest: 'রেস্টুরেন্ট দেখুন', search: 'খুঁজুন' }
    : { h: 'This page is not on the menu', p: 'The address may have changed or has a typo. Start again from one of these.', home: 'Back to home', rest: 'See restaurants', search: 'Search' };
  return (
    <section className="wrap nf">
      <m.svg className="nf-plate" viewBox="0 0 120 120" aria-hidden="true" initial={{ opacity: 0, rotate: -40, scale: 0.92 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} transition={{ duration: 0.7, ease: EASE }}>
        <circle cx="60" cy="60" r="56" fill="var(--surface)" stroke="var(--line-2)" />
        <circle cx="60" cy="60" r="40" fill="var(--sunk)" />
        <circle cx="60" cy="60" r="40" fill="none" stroke="var(--line)" />
      </m.svg>
      <m.h1 className="h2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}>{w.h}</m.h1>
      <m.p className="sub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease: EASE }}>{w.p}</m.p>
      <m.div className="nf-a" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24, ease: EASE }}>
        <Link className="btn btn-pri" href={href('/')}><I n="house" />{w.home}</Link>
        <Link className="btn btn-line" href={href('/restaurants')}><I n="storefront" />{w.rest}</Link>
      </m.div>
      <PlayBlock />
    </section>
  );
}
