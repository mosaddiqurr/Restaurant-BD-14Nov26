'use client';
/* The filters live in the address (?area=gulshan&sort=price). Reading the address stops a page from being
   saved ahead of time, so this reads it inside its own Suspense: the saved page (what search engines and the
   first paint see) shows the full list with no filters, then the browser swaps in the filtered list. */
import { createContext, Suspense, useContext, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

const Ctx = createContext('');

function Reader({ children }: { children: ReactNode }) {
  const sp = useSearchParams();
  return <Ctx.Provider value={sp.toString()}>{children}</Ctx.Provider>;
}

export function UrlParams({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Ctx.Provider value="">{children}</Ctx.Provider>}>
      <Reader>{children}</Reader>
    </Suspense>
  );
}

/** the address query as a string ("" while the saved page is showing) */
export const useQueryString = () => useContext(Ctx);
