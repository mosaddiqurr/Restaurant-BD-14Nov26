'use client';
/* Save changes, everywhere in the panels.
   Edits are a draft: nothing reaches the saved data (and so the diner site) until "Save changes" is pressed.
   - useDraft(base): a draft copy of anything, with how many changes it has.
   - useSaveEntry(...): a page tells the save bar it has unsaved changes and how to save or drop them.
   - SaveHost: wraps the panel. Draws one sticky save bar (count, Discard, Save changes), shows a short toast
     after saving, and asks before leaving the page or switching section while something is unsaved.
   - useGuard(): run something (switch language, sign out) only after the same question. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import type { Text } from '@/lib/data/types';
import { Ico, Modal, useT } from './ui';

/* ---------- comparing a draft with what is saved ---------- */
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
/** JSON with the keys sorted, so the same data always gives the same text */
export function stable(x: unknown): string {
  if (Array.isArray(x)) return '[' + x.map(v => (v === undefined ? 'null' : stable(v))).join(',') + ']';
  if (isObj(x)) return '{' + Object.keys(x).filter(k => x[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(x[k])).join(',') + '}';
  return JSON.stringify(x ?? null);
}
const idList = (a: unknown[]) => a.length > 0 && a.every(o => isObj(o) && typeof o.id === 'string');
function countList(a: Record<string, unknown>[], b: Record<string, unknown>[]) {
  const A = new Map(a.map(o => [o.id as string, stable(o)])), B = new Map(b.map(o => [o.id as string, stable(o)]));
  let n = 0;
  B.forEach((v, id) => { if (A.get(id) !== v) n++; });
  A.forEach((_, id) => { if (!B.has(id)) n++; });
  return n || 1; /* only the order changed */
}
/** how many changes a person would count: one per changed field, one per added, removed or edited item in a list (dishes, deals, events) */
export function countChanges(a: unknown, b: unknown, skip: string[] = []): number {
  if (stable(a) === stable(b)) return 0;
  if (!isObj(a) || !isObj(b)) return 1;
  let n = 0;
  new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => {
    if (skip.includes(k)) return;
    const x = a[k], y = b[k];
    if (stable(x) === stable(y)) return;
    if (Array.isArray(x) && Array.isArray(y) && (idList(x) || idList(y)) && (idList(x) || !x.length) && (idList(y) || !y.length)) n += countList(x as Record<string, unknown>[], y as Record<string, unknown>[]);
    else n += 1;
  });
  return n;
}

/* ---------- a draft of anything ---------- */
/** a draft copy of base. While nothing is changed it follows base (for example after a save, or a save in another tab) */
export function useDraft<T>(base: T, skip: string[] = []) {
  const [st, setSt] = useState<{ base: T; draft: T }>({ base, draft: base });
  let cur = st;
  if (st.base !== base) {
    const was = countChanges(st.base, st.draft, skip) > 0;
    cur = { base, draft: was ? st.draft : base };
    setSt(cur);
  }
  const skipKey = skip.join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const count = useMemo(() => countChanges(cur.base, cur.draft, skip), [cur.base, cur.draft, skipKey]);
  const set = useCallback((v: T | ((p: T) => T)) => setSt(s => ({ ...s, draft: typeof v === 'function' ? (v as (p: T) => T)(s.draft) : v })), []);
  const discard = useCallback(() => setSt(s => ({ ...s, draft: s.base })), []);
  /** after a save: the draft is now what is saved */
  const done = useCallback((v?: T) => setSt(s => { const d = v === undefined ? s.draft : v; return { base: d, draft: d }; }), []);
  return { base: cur.base, draft: cur.draft, set, discard, done, count, dirty: count > 0 };
}

/* ---------- the pages that have something to save ---------- */
export type SaveEntry = {
  count: number;
  /** save; false when something was wrong (the entry says why in a toast) */
  save: () => boolean | Promise<boolean>;
  discard: () => void;
  /** lower goes first: forms put their words into a draft before the draft itself is saved */
  pri?: number;
  /** a link to see the change live, shown on the "saved" toast */
  view?: string;
};
type Reg = {
  map: Map<string, SaveEntry>;
  subs: Set<() => void>;
  snap: { count: number };
  put: (id: string, e: SaveEntry | null) => void;
};
function makeReg(): Reg {
  const reg: Reg = {
    map: new Map(), subs: new Set(), snap: { count: 0 },
    put(id, e) {
      if (e) reg.map.set(id, e); else reg.map.delete(id);
      let n = 0; reg.map.forEach(x => { n += x.count; });
      if (n !== reg.snap.count) { reg.snap = { count: n }; reg.subs.forEach(f => f()); }
    },
  };
  return reg;
}
type HostCtx = { reg: Reg; guard: (go: () => void) => void; saveAll: () => Promise<boolean>; discardAll: () => void; busy: boolean };
const Host = createContext<HostCtx | null>(null);

/** tell the save bar about this page's unsaved changes (entries with nothing changed may still save: a form can flush into a draft) */
export function useSaveEntry(e: SaveEntry) {
  const h = useContext(Host), id = useRef<string>('');
  const ref = useRef(e);
  useEffect(() => { ref.current = e; });
  useEffect(() => {
    if (!h) return;
    if (!id.current) id.current = 'e' + Math.random().toString(36).slice(2);
    const k = id.current;
    h.reg.put(k, { count: e.count, pri: e.pri, view: e.view, save: () => ref.current.save(), discard: () => ref.current.discard() });
  }, [h, e.count, e.pri, e.view]);
  useEffect(() => () => { if (h && id.current) h.reg.put(id.current, null); }, [h]);
}
/** run go now, or after asking when there are unsaved changes */
export function useGuard() {
  const h = useContext(Host);
  return useCallback((go: () => void) => (h ? h.guard(go) : go()), [h]);
}
/** how many unsaved changes there are on this page */
export function useUnsaved() {
  const h = useContext(Host);
  return useSyncExternalStore(
    cb => { if (!h) return () => {}; h.reg.subs.add(cb); return () => { h.reg.subs.delete(cb); }; },
    () => (h ? h.reg.snap.count : 0), () => 0,
  );
}

/* ---------- the host: one save bar and the "leave without saving?" question ---------- */
export function SaveHost({ children }: { children: ReactNode }) {
  const i = useI(), t = useT(), router = useRouter();
  const [reg] = useState(makeReg);
  const [ask, setAsk] = useState<null | (() => void)>(null);
  const [busy, setBusy] = useState(false);
  const count = useSyncExternalStore(cb => { reg.subs.add(cb); return () => { reg.subs.delete(cb); }; }, () => reg.snap.count, () => 0);

  const saveAll = useCallback(async () => {
    const list = [...reg.map.values()].sort((a, b) => (a.pri || 0) - (b.pri || 0));
    const n = reg.snap.count, view = list.find(x => x.view && x.count)?.view || list.find(x => x.view)?.view;
    setBusy(true);
    try {
      for (const e of list) { if (!(await e.save())) return false; }
    } finally { setBusy(false); }
    const msg: Text = view
      ? { en: n > 1 ? `${n} changes saved. They are live now.` : 'Saved. It is live now.', bn: n > 1 ? `${i.N(n)}টি বদল রাখা হয়েছে। এখন দেখা যাচ্ছে।` : 'রাখা হয়েছে। এখন দেখা যাচ্ছে।' }
      : { en: n > 1 ? `${n} changes saved.` : 'Saved.', bn: n > 1 ? `${i.N(n)}টি বদল রাখা হয়েছে।` : 'রাখা হয়েছে।' };
    toast.success(i.L(msg), view ? { action: { label: t('View', 'দেখুন'), onClick: () => window.open(view, '_blank') } } : undefined);
    return true;
  }, [reg, i, t]);
  const discardAll = useCallback(() => { [...reg.map.values()].forEach(e => e.discard()); }, [reg]);
  const guard = useCallback((go: () => void) => { if (reg.snap.count > 0) setAsk(() => go); else go(); }, [reg]);

  /* links inside the panel and closing the tab ask first */
  useEffect(() => {
    if (!count) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.closest('[data-sonner-toast]')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      e.preventDefault(); e.stopPropagation();
      setAsk(() => () => router.push(u.pathname + u.search + u.hash));
    };
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    document.addEventListener('click', onClick, true); addEventListener('beforeunload', unload);
    return () => { document.removeEventListener('click', onClick, true); removeEventListener('beforeunload', unload); };
  }, [count, router]);

  const value = useMemo(() => ({ reg, guard, saveAll, discardAll, busy }), [reg, guard, saveAll, discardAll, busy]);
  const go = ask;
  const leave = async (how: 'save' | 'drop') => {
    if (how === 'save' && !(await saveAll())) { setAsk(null); return; }
    if (how === 'drop') discardAll();
    setAsk(null); go?.();
  };
  return (
    <Host.Provider value={value}>
      {children}
      <Modal open={!!ask} onClose={() => setAsk(null)} title={t('Save your changes?', 'বদলগুলো রাখবেন?')}
        foot={<>
          <button type="button" className="btn ghost l" onClick={() => setAsk(null)}>{t('Stay here', 'এখানেই থাকুন')}</button>
          <button type="button" className="btn danger" onClick={() => leave('drop')}>{t('Discard', 'বাদ দিন')}</button>
          <button type="button" className="btn pri" onClick={() => leave('save')} autoFocus>{t('Save and go', 'রেখে যান')}</button>
        </>}>
        <p style={{ color: 'var(--ink-2)' }}>{t(`You have ${count} unsaved change${count === 1 ? '' : 's'} on this page. Save them before you go, or discard them.`, `এই পেজে ${i.N(count)}টি বদল এখনো রাখা হয়নি। যাওয়ার আগে রাখুন, বা বাদ দিন।`)}</p>
      </Modal>
    </Host.Provider>
  );
}

/** the sticky bar: how many changes, Discard and Save changes. Drawn by the panel frame, inside .pnl */
export function SaveBar() {
  const h = useContext(Host), i = useI(), t = useT();
  const count = useUnsaved();
  if (!h) return null;
  return (
    <div className={clsx('savebar', count > 0 && 'on')} role="region" aria-label={t('Unsaved changes', 'রাখা হয়নি এমন বদল')} aria-live="polite" inert={!count}>
      <span><Ico n="note" sm />{t(`${count} unsaved change${count === 1 ? '' : 's'}`, `${i.N(count)}টি বদল এখনো রাখা হয়নি`)}</span>
      <button type="button" className="btn ghost sm" onClick={() => { h.discardAll(); toast(t('Changes discarded.', 'বদলগুলো বাদ দেওয়া হয়েছে।')); }} disabled={h.busy}>{t('Discard', 'বাদ দিন')}</button>
      <button type="button" className="btn gold sm" onClick={() => { void h.saveAll(); }} disabled={h.busy}>{t('Save changes', 'বদল রাখুন')}</button>
    </div>
  );
}
