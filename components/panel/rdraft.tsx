'use client';
/* The draft of one restaurant, for every restaurant page in both panels (menu, page details and colours,
   deals, events, photos, website, table QR, print menu, admin settings with the 360 tour, film and plan).
   Pages read the draft as r and change it with useSaved(); the save bar saves it in one go.
   The live diner site only changes after "Save changes". */
import { useCallback, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Text } from '@/lib/data/types';
import { allR, clone, fresh, getR, log, saveR, setPlan, type PR } from '@/lib/panel/store';
import { PanelCtx, useLive, usePanel } from './ui';
import { useDraft, useSaveEntry } from './draft';

type DR = PR & { _what?: Text[] };
/* fields that change by themselves with another change, so they are not counted on their own */
const SKIP = ['_what', '_ph', 'checkedAt', 'checked'];

export function RestDraft({ live, base, children }: { live: PR; base: string; children: ReactNode }) {
  const p = usePanel(), liveUrl = useLive();
  const d = useDraft<DR>(live, SKIP);
  /* the newest draft, also between a change and the next draw (a form can put its words in just before saving) */
  const ref = useRef<DR>(d.draft);
  useLayoutEffect(() => { ref.current = d.draft; });
  const { set, done, discard } = d;

  const edit = useCallback((nr: PR, what?: Text) => {
    const prev = ref.current, n = nr as DR;
    n._what = [...(prev._what || []), ...(what ? [what] : [])];
    ref.current = n; set(n);
  }, [set]);

  const save = useCallback(() => {
    const dr = clone(ref.current), lv = getR(fresh(), live.id) || live;
    const whats = dr._what || [];
    delete dr._what;
    const planTo = dr.plan !== lv.plan ? dr.plan : null;
    if (planTo) dr.plan = lv.plan; /* the plan is changed through billing, on its own */
    const cmp = (x: PR) => { const y = clone(x) as DR & { _ph?: unknown }; delete y._ph; delete y._what; return JSON.stringify(y); };
    const changed = cmp(dr) !== cmp(lv) || !!(dr as DR & { _ph?: unknown[] })._ph?.length;
    if (!changed && !planTo) { done(); return true; }
    if (changed) {
      /* only one restaurant has the deal of the week at a time */
      const wk = (dr.deals || []).some(x => x.week) && !(lv.deals || []).some(x => x.week);
      if (!saveR(dr)) return false;
      if (wk) allR(fresh()).forEach(x => {
        if (x.id === dr.id || !(x.deals || []).some(z => z.week)) return;
        const nx = clone(x); (nx.deals || []).forEach(z => { delete z.week; });
        saveR(nx, { en: `Removed ${x.name.en} as deal of the week`, bn: `${x.name.bn}-কে সপ্তাহের অফার থেকে সরিয়েছেন` });
      });
      const seen = new Set<string>();
      whats.filter(w => { const k = w.en; if (seen.has(k)) return false; seen.add(k); return true; }).slice(-12).forEach(w => log(dr.id, w));
      if (!whats.length) log(dr.id, { en: 'Saved changes', bn: 'বদল রেখেছেন' });
    }
    if (planTo) { const now = getR(fresh(), live.id); if (!now || !setPlan(now, planTo)) return false; }
    const after = getR(fresh(), live.id) || live;
    ref.current = after; done(after);
    return true;
  }, [live, done]);

  useSaveEntry({ count: d.count, save, discard, pri: 10, view: liveUrl(live) });

  const value = useMemo(() => ({ ...p, r: d.draft as PR, live, edit, rto: (v: string) => (v ? `${base}/${v}` : base) }), [p, d.draft, live, edit, base]);
  return <PanelCtx.Provider value={value}>{children}</PanelCtx.Provider>;
}
