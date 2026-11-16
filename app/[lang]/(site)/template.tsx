import { ViewTransition } from 'react';

/* every page change: the old page fades out quickly, the new one rises in (the browser's View Transitions).
   The header and tab bar stay still. Photos with the same name (a restaurant card and its cover) fly between pages. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
