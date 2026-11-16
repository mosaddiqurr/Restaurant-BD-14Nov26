'use client';
/* Shared pieces of the partner and khabo team panels: words, page frame, form fields, switch, sheets,
   dialogs, the "are you sure" box, photo picking and small display bits. Class names follow styles/panel.css. */
import { createContext, useCallback, useContext, useEffect, useId, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Drawer as Vaul } from 'vaul';
import { Dialog } from '@base-ui/react/dialog';
import { Switch } from '@base-ui/react/switch';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { I } from '@/components/ui/bits';
import { src, srcSet } from '@/lib/khabo';
import type { Text } from '@/lib/data/types';
import { saveR, initials, type PanelDB, type PR, type User } from '@/lib/panel/store';

/* ---------- words ---------- */
/** t('English', 'বাংলা'): the word in the page's language */
export function useT() {
  const i = useI();
  return useCallback((en: string, bn: string) => (i.bn ? bn : en), [i.bn]);
}
export const L2 = (bn: boolean, o: Text | string | undefined | null) => (o == null ? '' : typeof o === 'string' ? o : (bn ? o.bn || o.en : o.en || o.bn));

/** "5 min ago", "yesterday" in both languages */
export function useAgo() {
  const i = useI();
  return useCallback((ts: number) => {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return i.bn ? 'এইমাত্র' : 'just now';
    if (s < 3600) return i.bn ? `${i.N(Math.round(s / 60))} মিনিট আগে` : `${Math.round(s / 60)} min ago`;
    if (s < 86400) return i.bn ? `${i.N(Math.round(s / 3600))} ঘণ্টা আগে` : `${Math.round(s / 3600)} h ago`;
    const d = Math.round(s / 86400);
    return d === 1 ? (i.bn ? 'গতকাল' : 'yesterday') : i.bn ? `${i.N(d)} দিন আগে` : `${d} days ago`;
  }, [i]);
}
export function useDays() {
  const i = useI();
  return useCallback((n: number) => n <= 0 ? (i.bn ? 'আজ' : 'today') : n === 1 ? (i.bn ? 'গতকাল' : 'yesterday') : i.bn ? `${i.N(n)} দিন আগে` : `${n} days ago`, [i]);
}

/* ---------- where things are ---------- */
export type PanelArea = 'partner' | 'admin';
type Ctx = {
  area: PanelArea; db: PanelDB; me: User;
  /** the restaurant being edited (owner: their own; team: the one opened from Restaurants) */
  r?: PR;
  /** link to a page of the current restaurant: owner "/partner/menu", team "/admin/r/<id>/menu" */
  rto: (view: string) => string;
  /** link inside the panel area */
  to: (path: string) => string;
  /** restaurant pages: the saved copy (r above is the draft being edited) */
  live?: PR;
  /** restaurant pages: put a changed copy into the draft (saved with "Save changes") */
  edit?: (nr: PR, what?: Text) => void;
};
export const PanelCtx = createContext<Ctx | null>(null);
export function usePanel() {
  const v = useContext(PanelCtx);
  if (!v) throw new Error('usePanel must be used inside the panel');
  return v;
}
/** the restaurant this page is about (always set on restaurant pages) */
export function useR() { const p = usePanel(); return { ...p, r: p.r! }; }
/** the diner page of a restaurant, in the page's language */
export function useLive() {
  const { lang } = useI();
  return useCallback((r: Pick<PR, 'id' | 'slug'>, hash = '') => `/${lang}/r/${r.id}${hash}`, [lang]);
}

/* ---------- saving ---------- */
/** a change on a restaurant page: it goes into the draft, and the save bar saves it.
    Outside a restaurant page (or with now) it is saved straight away with a toast */
export function useSaved() {
  const p = useContext(PanelCtx), now = useSaveNow(), edit = p?.edit;
  return useCallback((r: PR, what?: Text, msg?: Text) => {
    if (edit) { edit(r, what); return true; }
    return now(r, what, msg);
  }, [edit, now]);
}
/** save straight away (one-tap confirmations such as "Prices are correct") */
export function useSaveNow() {
  const i = useI(), live = useLive(), t = useT();
  return useCallback((r: PR, what?: Text, msg?: Text) => {
    const ok = saveR(r, what);
    if (ok) toast.success(i.L(msg || { en: 'Saved. It is live on your page.', bn: 'রাখা হয়েছে। আপনার পেজে এখনই দেখা যাচ্ছে।' }), { action: { label: t('View', 'দেখুন'), onClick: () => window.open(live(r), '_blank') } });
    return ok;
  }, [i, live, t]);
}

/* ---------- small display bits ---------- */
/** a panel icon (Phosphor sprite), sized by the panel styles: .ico 20px, sm 16px, lg 26px */
export const Ico = ({ n, sm, lg, f, b, cls }: { n: string; sm?: boolean; lg?: boolean; f?: boolean; b?: boolean; cls?: string }) =>
  <I n={n} f={f} b={b} cls={clsx('ico', sm && 'sm', lg && 'lg', cls)} />;
/** a small photo: phones and laptops get a small file (about 160px), never the full-size photo */
export const Thumb = ({ p, word = '', cls = 'thumb', w = 80 }: { p?: string | null; word?: string; cls?: string; w?: number }) =>
  // eslint-disable-next-line @next/next/no-img-element
  p ? <img className={cls} src={src(p, w * 2)} srcSet={srcSet(p, w)} sizes={`${w}px`} alt="" loading="lazy" decoding="async" /> : <span className={cls} aria-hidden="true">{String(word).trim().charAt(0)}</span>;
export const MonoR = ({ r, cls }: { r: Pick<PR, 'mono' | 'theme' | 'name'>; cls?: string }) =>
  <span className={clsx('mono', cls)} style={{ '--d': r.theme.deep, '--a': r.theme.accent } as CSSProperties} aria-hidden="true">{r.mono || r.name.en.slice(0, 2).toUpperCase()}</span>;
export const Av = ({ name, sm, style }: { name: string; sm?: boolean; style?: CSSProperties }) => <span className={clsx('av', sm && 'sm')} style={style}>{initials(name)}</span>;
export function Stars({ n }: { n: number }) {
  const t = useT();
  return <span className="stars" aria-label={t(`${n} out of 5`, `৫-এর মধ্যে ${n}`)}>{[1, 2, 3, 4, 5].map(k => <Ico key={k} n="star" f cls={k <= n ? '' : 'off'} />)}</span>;
}
export function Spark({ vals, color = 'var(--indigo)' }: { vals: number[]; color?: string }) {
  const lo = Math.min(...vals), hi = Math.max(...vals), W = 92, H = 34;
  const pts = vals.map((v, k) => `${((k / (vals.length - 1)) * W).toFixed(1)},${(H - 3 - (hi === lo ? 0.5 : (v - lo) / (hi - lo)) * (H - 6)).toFixed(1)}`);
  return <svg className="spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function Empty({ icon, title, children, style }: { icon: string; title: ReactNode; children?: ReactNode; style?: CSSProperties }) {
  return <div className="empty" style={style}><Ico n={icon} /><b>{title}</b>{children}</div>;
}
export function Sample() {
  const t = useT();
  return <span className="badge gold" title={t('Real numbers come once the site is live', 'সাইট চালু হলে আসল সংখ্যা দেখাবে')}>{t('Sample', 'নমুনা')}</span>;
}

/* ---------- page frame ---------- */
/** extra parts the team's restaurant pages put between the title and the page (crumb and tabs) */
export const PageExtras = createContext<{ crumb?: ReactNode; tabs?: ReactNode }>({});
export function Page({ title, sub, acts, children }: { title: ReactNode; sub?: ReactNode; acts?: ReactNode; children: ReactNode }) {
  const ex = useContext(PageExtras);
  const [sc, setSc] = useState(false);
  useEffect(() => {
    let raf = 0;
    const f = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setSc(scrollY > 4)); };
    addEventListener('scroll', f, { passive: true }); f();
    return () => { removeEventListener('scroll', f); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <header className={clsx('top', sc && 'scrolled')}>
        <div>{ex.crumb}<h1>{title}</h1>{sub ? <p className="sub">{sub}</p> : null}</div>
        {acts ? <div className="acts">{acts}</div> : null}
      </header>
      {ex.tabs}
      <div className="pg">{children}</div>
    </>
  );
}
/** a page this level cannot open: never drawn, and the attempt is logged by the caller */
export function NoAccess({ what }: { what: string }) {
  const t = useT();
  return (
    <Page title={t('No access', 'অনুমতি নেই')}>
      <div className="card empty" style={{ padding: '48px 24px' }}>
        <Ico n="lock-simple" /><b>{t(`Your level cannot open ${what}`, `আপনার লেভেলে ${what} খোলা যায় না`)}</b>
        {t('Ask a Master admin if you need it. Every attempt is written to the activity log.', 'দরকার হলে মাস্টার অ্যাডমিনকে বলুন। প্রতিটি চেষ্টা কার্যকলাপের তালিকায় লেখা থাকে।')}
      </div>
    </Page>
  );
}

/* ---------- form fields (controlled) ---------- */
type FieldBase = { label: ReactNode; hint?: ReactNode; full?: boolean; id?: string; cls?: string };
const useFid = (id?: string) => { const auto = useId(); return id || 'pf' + auto.replace(/:/g, ''); };
export function Field({ label, hint, full, id, cls, children }: FieldBase & { children: ReactNode }) {
  return <div className={clsx('field', full && 'full', cls)}>{id ? <label htmlFor={id}>{label}</label> : <span className="lbl">{label}</span>}{children}{hint ? <span className="hint">{hint}</span> : null}</div>;
}
export function TextF({ label, hint, full, id, cls, value, onChange, bn, type, ph, req, attr, onBlur }: FieldBase & {
  value: string | number | null | undefined; onChange: (v: string) => void; bn?: boolean; type?: string; ph?: string; req?: boolean;
  attr?: React.InputHTMLAttributes<HTMLInputElement>; onBlur?: () => void;
}) {
  const fid2 = useFid(id);
  return (
    <Field label={label} hint={hint} full={full} id={fid2} cls={cls}>
      <input className={clsx('inp', bn && 'bn')} id={fid2} value={value ?? ''} type={type} placeholder={ph} required={req} onChange={e => onChange(e.target.value)} onBlur={onBlur} {...attr} />
    </Field>
  );
}
export function AreaF({ label, hint, full, id, value, onChange, bn, rows = 3, ph }: FieldBase & { value: string | undefined; onChange: (v: string) => void; bn?: boolean; rows?: number; ph?: string }) {
  const fid2 = useFid(id);
  return (
    <Field label={label} hint={hint} full={full} id={fid2}>
      <textarea className={clsx('inp', bn && 'bn')} id={fid2} rows={rows} value={value ?? ''} placeholder={ph} onChange={e => onChange(e.target.value)} />
    </Field>
  );
}
export function MoneyF({ label, hint, full, id, value, onChange }: FieldBase & { value: number | string | null | undefined; onChange: (v: string) => void }) {
  const fid2 = useFid(id);
  return (
    <Field label={label} hint={hint} full={full} id={fid2}>
      <div className="pre"><span>৳</span><input className="inp num" id={fid2} type="number" min={0} step={1} inputMode="numeric" value={value ?? ''} onChange={e => onChange(e.target.value)} /></div>
    </Field>
  );
}
export function SelF({ label, hint, full, id, value, onChange, opts }: FieldBase & { value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  const fid2 = useFid(id);
  return (
    <Field label={label} hint={hint} full={full} id={fid2}>
      <select className="sel" id={fid2} value={value} onChange={e => onChange(e.target.value)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </Field>
  );
}
/** an on/off switch (Base UI) */
export function Sw({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return <Switch.Root className="bsw" checked={on} onCheckedChange={v => onChange(v)} aria-label={label} disabled={disabled}><Switch.Thumb className="bsw-t" /></Switch.Root>;
}
/** a switch with its words, in a row */
export function SwRow({ label, hint, on, onChange }: { label: ReactNode; hint?: ReactNode; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="swrow">
      <span>{label}{hint ? <span className="meta">{hint}</span> : null}</span>
      <Sw on={on} onChange={onChange} label={typeof label === 'string' ? label : undefined} />
    </label>
  );
}
export function Seg<V extends string | number>({ items, value, onChange, cls }: { items: [V, ReactNode][]; value: V; onChange: (v: V) => void; cls?: string }) {
  return (
    <div className={clsx('seg', cls)} role="radiogroup">
      {items.map(([v, l]) => <button key={String(v)} type="button" role="radio" aria-checked={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}

/* ---------- phone or laptop ---------- */
const mq = '(max-width: 860px)';
export function useIsPhone() {
  return useSyncExternalStore(
    cb => { const m = matchMedia(mq); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => matchMedia(mq).matches,
    () => false,
  );
}

/* ---------- sheets and dialogs ---------- */
/** a side sheet on laptops, a bottom sheet on phones (Vaul) */
export function Drawer({ open, onClose, title, children, foot, size }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; foot?: ReactNode; size?: 'wide' | 'xwide' }) {
  const phone = useIsPhone(), t = useT();
  return (
    <Vaul.Root open={open} onOpenChange={o => { if (!o) onClose(); }} direction={phone ? 'bottom' : 'right'} repositionInputs={false}>
      <Vaul.Portal>
        <Vaul.Overlay className="pnl-scrim" />
        <Vaul.Content className={clsx('pnl pnl-dw', size)} aria-describedby={undefined}>
          <span className="dw-grab" aria-hidden="true" />
          <div className="dw-h"><Vaul.Title asChild><h2>{title}</h2></Vaul.Title><button type="button" className="ibtn" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন')}><Ico n="x" /></button></div>
          <div className="dw-b" data-vaul-no-drag="">{children}</div>
          {foot ? <div className="dw-f">{foot}</div> : null}
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
/** a centred dialog (Base UI) */
export function Modal({ open, onClose, title, children, foot, size }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; foot?: ReactNode; size?: 'wide' | 'xwide' }) {
  const t = useT();
  return (
    <Dialog.Root open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="pnl-scrim bu" />
        <Dialog.Popup className={clsx('pnl pnl-md', size)}>
          <div className="dw-h"><Dialog.Title render={<h2 />}>{title}</Dialog.Title><button type="button" className="ibtn" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন')}><Ico n="x" /></button></div>
          <div className="dw-b">{children}</div>
          {foot ? <div className="dw-f">{foot}</div> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------- "are you sure?" ---------- */
type Ask = { title: string; text: ReactNode; ok: string; danger?: boolean; res: (v: boolean) => void };
let pushAsk: ((a: Ask | null) => void) | null = null;
/** await confirm({ title, text, ok, danger }) → true when they said yes */
export const confirm = (o: Omit<Ask, 'res'>) => new Promise<boolean>(res => { if (pushAsk) pushAsk({ ...o, res }); else res(window.confirm(o.title)); });
export function ConfirmHost() {
  const [a, setA] = useState<Ask | null>(null), t = useT();
  useEffect(() => { pushAsk = setA; return () => { pushAsk = null; }; }, []);
  const done = (v: boolean) => { a?.res(v); setA(null); };
  return (
    <Modal open={!!a} onClose={() => done(false)} title={a?.title || ''}
      foot={<><button className="btn ghost l" onClick={() => done(false)}>{t('Cancel', 'বাতিল')}</button><button className={clsx('btn', a?.danger ? 'danger solid' : 'pri')} onClick={() => done(true)} autoFocus>{a?.ok}</button></>}>
      <p style={{ color: 'var(--ink-2)' }}>{a?.text}</p>
    </Modal>
  );
}

/* ---------- photos: chosen from the computer and shrunk before saving, so the browser does not run out of space ---------- */
export const readPhoto = (file: File, max = 1200) => new Promise<string>((res, rej) => {
  if (!file || !/^image\//.test(file.type)) return rej(new Error('not an image'));
  const url = URL.createObjectURL(file), im = new Image();
  im.onload = () => {
    const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    res(c.toDataURL('image/jpeg', 0.78));
  };
  im.onerror = rej; im.src = url;
});
export const pickPhotos = (multi = true) => new Promise<string[]>(res => {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = multi;
  inp.onchange = async () => { const out: string[] = []; for (const f of Array.from(inp.files || [])) { try { out.push(await readPhoto(f)); } catch { /* skip */ } } res(out); };
  inp.click();
});

/* ---------- links ---------- */
export function NavLink({ href, on, children, cls, onClick }: { href: string; on?: boolean; children: ReactNode; cls?: string; onClick?: () => void }) {
  return <Link href={href} className={clsx(cls, on && 'on')} aria-current={on ? 'page' : undefined} onClick={onClick}>{children}</Link>;
}
export const copyText = async (text: string, msg: string) => {
  try { await navigator.clipboard.writeText(text); toast.success(msg); }
  catch { const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast.success(msg); }
};
