'use client';
/* A diner page failed: keep the header and footer, show the friendly error with Try again and a small game */
import { ErrorView } from '@/components/shell/error-view';

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView reset={reset} />;
}
