'use client';
/* When something breaks: a calm "something went wrong" with Try again and Home, and Rickshaw Run to play while
   waiting (components/games). Used by app/[lang]/error.tsx and app/[lang]/(site)/error.tsx. */
import Link from 'next/link';
import { useI } from '@/components/providers/i18n';
import { I } from '@/components/ui/bits';
import { PlayBlock } from '@/components/games/play-block';
import '@/styles/error.css';

const W = {
  title: { en: 'Something went wrong in the kitchen', bn: 'রান্নাঘরে একটু সমস্যা হয়েছে' },
  sub: { en: 'This page did not load. Try again, or go back to the home page.', bn: 'পেজটি খোলেনি। আবার চেষ্টা করুন, অথবা হোমে ফিরে যান।' },
  again: { en: 'Try again', bn: 'আবার চেষ্টা করুন' },
  home: { en: 'Home', bn: 'হোম' },
};

export function ErrorView({ reset }: { reset: () => void }) {
  const i = useI();
  return (
    <section className="errv wrap" role="alert">
      <div className="errv-ic" aria-hidden="true"><I n="cooking-pot" /></div>
      <h1 className="h2">{i.L(W.title)}</h1>
      <p className="sub">{i.L(W.sub)}</p>
      <div className="errv-a">
        <button type="button" className="btn btn-pri" onClick={reset}><I n="arrow-clockwise" b />{i.L(W.again)}</button>
        <Link className="btn btn-line" href={`/${i.lang}`}><I n="house" />{i.L(W.home)}</Link>
      </div>
      <PlayBlock />
    </section>
  );
}
