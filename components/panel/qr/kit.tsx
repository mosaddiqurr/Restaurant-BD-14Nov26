'use client';
/* Shared parts for the owner pages that make printed things with a QR code: Table QR (table cards),
   Your website (door stickers) and Print menu.
   Ported from archive/prototype/panel/site.js (PN.palOf, PN.swatches, PN.qrStyleFor) and the print windows of print.js.
   The QR drawing itself comes from components/qr (qrSvg, frames); this file only adds the panel's choices:
   card colours, QR colour, a shape around the code, and showing a real-size page shrunk into a box. */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { frameOf, qrFrameParts, qrStyle, qrSvg, QR_FRAME_CATS, QR_FRAMES, type FrameCat, type FrameOpts, type QrStyle } from '@/components/qr/qr';
import { C, esc } from '@/lib/khabo';
import type { PR } from '@/lib/panel/store';
import { useT } from '../ui';
import '@/styles/panel-qr.css';

/* ---------- colours for anything printed with a QR ----------
   '' = the restaurant's own colours, a khabo colour pair by id, or 'mono' = black and white (cheapest to print) */
export const MONO = { id: 'mono', deep: '#111111', accent: '#FFFFFF', en: 'Black and white', bn: 'সাদা-কালো' };
export type Pal = { deep: string; accent: string };
export const palOf = (r: Pick<PR, 'theme'>, id?: string | null): Pal => (id === 'mono' ? MONO : C.palettes.find(p => p.id === id) || r.theme);

/** the QR in the chosen colours. qrc: 'match' = the deep colour, 'black' = plain black (scans best on any print) */
export function qrStyleFor(r: PR, o: { pal?: string; qrc?: string; look?: string } = {}): QrStyle {
  const th = palOf(r, o.pal), fg = o.qrc === 'black' ? '#111111' : th.deep;
  return qrStyle({ ...r, theme: { ...r.theme, deep: th.deep, accent: th.accent }, qr: { ...(r.qr || {}), ...(o.look ? { look: o.look } : {}), fg, eye: fg } });
}

/* the same code is drawn many times (60 table cards, frame thumbnails), so drawings are kept for a while */
const svgCache = new Map<string, string>();
export function svgFor(url: string, st: QrStyle) {
  const k = url + '|' + JSON.stringify(st);
  let v = svgCache.get(k);
  if (v == null) {
    try { v = qrSvg(url, st); } catch { v = ''; }
    if (svgCache.size > 600) svgCache.clear();
    svgCache.set(k, v);
  }
  return v;
}

/** the address diners open: a restaurant's page, or its table menu */
export const siteLink = (lang: string, r: Pick<PR, 'id'>) => `${location.origin}/${lang}/r/${encodeURIComponent(r.id)}`;
export const tableLink = (lang: string, r: Pick<PR, 'id'>, table?: number | null) => `${location.origin}/${lang}/t/${encodeURIComponent(r.id)}${table ? `?table=${table}` : ''}`;

/** a QR drawing (SVG text) in a box */
export function QrSvg({ svg, cls, style }: { svg: string; cls?: string; style?: CSSProperties }) {
  return <div className={cls} style={style} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/* ---------- a shape around the code (components/qr/frames) ---------- */
export const frameHtml = (id: string | null | undefined, o: FrameOpts, qr: string, uid: string) => {
  const p = qrFrameParts(id, o, uid);
  return `<div class="qf qf-${p.frame.id}" style="--ar:${p.ratio.toFixed(4)}">${p.svg}<div class="qf-q" style="left:${p.box.left.toFixed(3)}%;top:${p.box.top.toFixed(3)}%;width:${p.box.width.toFixed(3)}%">${qr}</div></div>`;
};
const useUid = () => 'pq' + useId().replace(/[^a-zA-Z0-9]/g, '');
/** the code inside a drawn frame */
export function Framed({ id, o, qr }: { id: string | null | undefined; o: FrameOpts; qr: string }) {
  const uid = useUid();
  const html = useMemo(() => frameHtml(id, o, qr, uid), [id, o.d, o.a, o.l, o.dk, o.t1, o.t2, qr, uid]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="pq-fr" dangerouslySetInnerHTML={{ __html: html }} />;
}
/** the shape picker: groups as tabs, every shape in the group drawn with the real code in the chosen colours */
export function FramePicker({ value, onChange, o, qr, label, hint }: { value: string; onChange: (id: string) => void; o: FrameOpts; qr: string; label: ReactNode; hint?: ReactNode }) {
  const i = useI();
  const [cat, setCat] = useState<FrameCat>(() => frameOf(value).cat);
  return (
    <div className="field full qfp">
      <span className="lbl">{label}</span>
      <div className="qfp-tabs" role="tablist">
        {(Object.keys(QR_FRAME_CATS) as FrameCat[]).map(k => <button key={k} type="button" role="tab" aria-selected={cat === k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>{i.L(QR_FRAME_CATS[k])}</button>)}
      </div>
      <div className="qfp-grid">
        {QR_FRAMES.filter(f => f.cat === cat).map(f => (
          <button key={f.id} type="button" className={clsx('qfp-t', value === f.id && 'on')} title={i.L(f)} aria-pressed={value === f.id} onClick={() => onChange(f.id)}>
            <span><Framed id={f.id} o={o} qr={qr} /></span><b>{i.L(f)}</b>
          </button>
        ))}
      </div>
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

/** the colour choice: the restaurant's own pair, the khabo pairs, black and white */
export function Swatches({ r, value, onChange }: { r: Pick<PR, 'theme'>; value: string; onChange: (id: string) => void }) {
  const i = useI(), t = useT();
  const list: [string, Pal, string][] = [['', r.theme, t('Your colours', 'আপনার রং')], ...C.palettes.map(p => [p.id, p, i.L(p)] as [string, Pal, string]), ['mono', MONO, i.L(MONO)]];
  return (
    <div className="sws" role="radiogroup">
      {list.map(([id, p, n]) => (
        <button key={id || 'own'} type="button" role="radio" aria-checked={(value || '') === id} className={clsx('sw-c', (value || '') === id && 'on')}
          style={{ '--d': p.deep, '--a': p.accent } as CSSProperties} title={n} aria-label={n} onClick={() => onChange(id)}><i /></button>
      ))}
    </div>
  );
}

/* ---------- a real-size page (A4 menu, A5 sticker) shown at the width of its box ---------- */
/** zoom the first child to the box width. `prep` runs on the child at full size first (the menu uses it to fit one sheet) */
export function Fit({ w, cls, prep, children }: { w: number; cls?: string; prep?: (el: HTMLElement) => void; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null), go = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    go.current = () => {
      const b = ref.current, p = b?.firstElementChild as HTMLElement | null;
      if (!b || !p || !b.clientWidth) return;
      p.style.zoom = '1'; prep?.(p); p.style.zoom = String(b.clientWidth / w);
    };
    go.current();
  });
  useEffect(() => {
    const b = ref.current; if (!b) return;
    let raf = 0;
    const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => go.current()); };
    const ro = new ResizeObserver(later); ro.observe(b);
    /* photos and fonts change the height of a page, so fit again once they arrive */
    const onLoad = (e: Event) => { if ((e.target as Element).tagName === 'IMG') later(); };
    b.addEventListener('load', onLoad, true);
    document.fonts?.ready.then(later);
    return () => { ro.disconnect(); b.removeEventListener('load', onLoad, true); cancelAnimationFrame(raf); };
  }, []);
  return <span ref={ref} className={cls} style={{ display: 'block' }}>{children}</span>;
}

/** a live page in a small frame (the table menu on a phone, the website on a laptop) */
export function Scaled({ w, url, title, lazy }: { w: number; url: string; title: string; lazy?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const fit = () => { const f = v.firstElementChild as HTMLElement | null; if (!f || !v.clientWidth) return; const s = v.clientWidth / w; f.style.width = w + 'px'; f.style.height = v.clientHeight / s + 'px'; f.style.transform = `scale(${s})`; };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(v);
    return () => ro.disconnect();
  }, [w]);
  return <div className="ws-view" ref={ref}><iframe src={url} title={title} loading={lazy ? 'lazy' : undefined} tabIndex={lazy ? -1 : undefined} /></div>;
}

/* ---------- fonts the printed designs use (loaded only on these pages) ---------- */
export const PRINT_FONTS = 'https://fonts.googleapis.com/css2?family=Figtree:wght@300..800&family=Noto+Sans+Bengali:wght@400..700&family=Tiro+Bangla&family=Cormorant+Garamond:ital,wght@0,300;0,500;0,600;0,700;1,500;1,600&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Serif+Display&family=Bebas+Neue&display=swap';
export function usePrintFonts() {
  useEffect(() => {
    if (document.getElementById('pnl-print-fonts')) return;
    const l = document.createElement('link'); l.id = 'pnl-print-fonts'; l.rel = 'stylesheet'; l.href = PRINT_FONTS;
    document.head.append(l);
  }, []);
}

/* ---------- printing in a clean window ----------
   The window gets the panel's own styles (every sheet with .pnl or .pmw rules, the print menu designs), the fonts and the page HTML,
   so the paper looks exactly like the preview. Page size rules live only in that window. */
function panelCss() {
  let out = '';
  for (const sh of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sh.cssRules; } catch { continue; }
    let txt = '';
    for (const rule of Array.from(rules)) txt += rule.cssText + '\n';
    if (txt.includes('.pnl') || txt.includes('.pmw')) out += txt;
  }
  return out;
}
export function printWindow(o: { title: string; body: string; css?: string; script?: string; lang: string; blocked: string }) {
  const w = window.open('', '_blank');
  if (!w) { toast.error(o.blocked); return false; }
  w.document.write(`<!doctype html><html lang="${o.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.title)}</title>
<link rel="stylesheet" href="${PRINT_FONTS}"><style>${panelCss()}</style>
<style>html,body{margin:0;background:#E9E9EC}.pnl{background:none}@media print{html,body{background:#fff}body *{visibility:visible!important}}${o.css || ''}</style></head>
<body><div class="pnl">${o.body}</div>${o.script ? `<script>${o.script}</script>` : ''}</body></html>`);
  w.document.close();
  return true;
}
/** the markup of a preview page at real size (the zoom used to show it small is taken off) */
export const realSize = (el: Element | null | undefined) => {
  if (!el) return '';
  const c = el.cloneNode(true) as HTMLElement;
  c.style.removeProperty('zoom');
  return c.outerHTML;
};

/* ---------- saving a file ---------- */
export function saveFile(href: string, name: string) {
  const a = document.createElement('a'); a.href = href; a.download = name; document.body.append(a); a.click(); a.remove();
}
/** a QR as a file: SVG as it is, PNG drawn at print size (1200 px) */
export function qrFile(svg: string, name: string, kind: 'png' | 'svg', failed: string) {
  const big = svg.replace('<svg ', '<svg width="1200" height="1200" ');
  const url = URL.createObjectURL(new Blob([big], { type: 'image/svg+xml' }));
  if (kind === 'svg') { saveFile(url, `${name}.svg`); setTimeout(() => URL.revokeObjectURL(url), 2000); return; }
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = c.height = 1200;
    const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, 1200, 1200); g.drawImage(img, 0, 0, 1200, 1200);
    saveFile(c.toDataURL('image/png'), `${name}.png`); URL.revokeObjectURL(url);
  };
  img.onerror = () => { toast.error(failed); URL.revokeObjectURL(url); };
  img.src = url;
}

/** numbers in the page's language: 1,250 or ১,২৫০ */
export const bnDigits = (s: string | number) => String(s).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]);
