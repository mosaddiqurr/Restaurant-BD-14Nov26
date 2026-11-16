'use client';
/* Any other page failed (owner panel, khabo team panel, table menu, print menu): the same friendly error */
import { ErrorView } from '@/components/shell/error-view';

export default function LangError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{ minHeight: '100dvh', display: 'grid', alignContent: 'center' }}><ErrorView reset={reset} /></main>;
}
