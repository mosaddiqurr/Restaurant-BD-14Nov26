'use client';
/* Branded QR codes for khabo: a restaurant's code in its own colours and chosen look, optionally inside a frame.

   HOW TO USE
     import { QR, QRFrame, qrFor, qrStyle, QR_LOOKS, qrLooksFor, QR_FRAMES, QR_FRAME_CATS, tableUrl } from '@/components/qr/qr';

     <QR r={r} />                              the restaurant's table code (/t/<id>) in its saved look (r.qr.look)
     <QR r={r} table={4} />                    the code for table 4 (/t/<id>?table=4)
     <QR r={r} look="leaf" size={120} />       preview another look; size in px (default: fills its box)
     <QR url="https://..." style={qrStyle(r)} />   any address in a restaurant's style
     <QRFrame frame="handi" r={r} t1="Scan for the menu" t2={r.name.en} table={2} />
                                               the code inside a drawn frame (QR_FRAMES lists them, by QR_FRAME_CATS)
     qrFor(r, { table: 4, origin, look })      the same code as SVG text (downloads, print windows, the server)
     qrFrameHtml(frameId, { d, a, t1, t2, qr }) a framed code as HTML text

   ADDRESSES: codes point to the live site (NEXT_PUBLIC_SITE_URL) + '/t/<id>' when drawn on the server. In the
   browser they switch to the page's own address right after the page loads, so a code printed from a test site
   opens that test site; on localhost they keep the live address, since a phone cannot open localhost (qrOrigin).
   Pass `origin` to fix it to one address.

   SERVER COMPONENTS: this file is a client module. On the server, import the text helpers (qrFor, qrSvg, qrStyle,
   tableUrl, QR_LOOKS) from '@/components/qr/qr-core' and the frames from '@/components/qr/frames'.

   LOOKS: classic, rounded, dots, leaf, diamond, bars, and logo (the whole code takes the restaurant's logo
   shape, r.brand.shape; only offered by qrLooksFor(r) when the restaurant has one). Colours stay dark on white
   so every phone camera reads them. */
import { useId, useMemo, useSyncExternalStore, type CSSProperties } from 'react';
import { QR_ORIGIN, qrOrigin, qrStyle, qrSvg, tableUrl, type QrRest, type QrStyle } from './qr-core';
import { qrFrameParts, type FrameOpts } from './frames';

export { QR_ORIGIN, qrOrigin, QR_LOOKS, qrLooksFor, qrStyle, qrSvg, qrFor, tableUrl, type QrLook, type QrRest, type QrStyle, type QrDots, type QrEyes, type QrShape } from './qr-core';
export { QR_FRAMES, QR_FRAME_CATS, frameOf, qrFrameHtml, qrFrameParts, type QrFrame, type FrameCat, type FrameOpts } from './frames';

/** the address codes point to: the live site on the server and while the page loads, then qrOrigin() */
const noop = () => () => {};
export function useQrOrigin(fixed?: string) {
  const here = useSyncExternalStore(noop, qrOrigin, () => QR_ORIGIN);
  return fixed || here;
}

type QRProps = {
  /** the restaurant (draws its table code in its own look) */
  r?: QrRest;
  /** any address instead of the restaurant's table code */
  url?: string;
  /** the table number, added as ?table=<n> */
  table?: number | string | null;
  /** preview another look (QR_LOOKS key) */
  look?: string | null;
  /** a style made by hand (overrides the restaurant's) */
  style?: QrStyle;
  /** fix the address origin (default: this site, or https://khabo.app on the server) */
  origin?: string;
  /** width and height in px; leave out to fill the box it sits in */
  size?: number;
  className?: string;
  label?: string;
};

/** a branded QR code. Give it a restaurant (r) or an address (url) */
export function QR({ r, url, table, look, style, origin, size, className, label }: QRProps) {
  const base = useQrOrigin(origin);
  const href = url || (r ? tableUrl(r.id, { table, origin: base }) : base);
  const st = style || (r ? qrStyle(r, look) : { dots: 'rounded', eyes: 'rounded', fg: '#0C5A3E', eye: '#0C5A3E', bg: '#fff' } as QrStyle);
  const key = JSON.stringify(st);
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const svg = useMemo(() => qrSvg(href, st, label || 'QR code'), [href, key, label]);
  const box: CSSProperties = size ? { display: 'block', width: size, height: size, lineHeight: 0 } : { display: 'block', width: '100%', height: '100%', lineHeight: 0 };
  return <span className={className} style={box} data-href={href} dangerouslySetInnerHTML={{ __html: svg }} />;
}

type FrameProps = Omit<QRProps, 'size' | 'className' | 'style'> & FrameOpts & {
  /** frame id from QR_FRAMES (default: banner) */
  frame?: string | null;
  /** a style for the code inside (default: the restaurant's) */
  qrStyle?: QrStyle;
  className?: string;
};

/** a QR code inside a drawn frame. Colours default to the restaurant's (d = deep, a = accent) */
export function QRFrame({ frame, r, d, a, l, dk, t1, t2, qrStyle: st, className, ...q }: FrameProps) {
  const uid = 'qf' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const parts = useMemo(() => qrFrameParts(frame, { d: d || r?.theme.deep, a: a || r?.theme.accent, l, dk, t1, t2 }, uid), [frame, d, a, l, dk, t1, t2, r?.theme.deep, r?.theme.accent, uid]);
  return (
    <div className={className} style={{ position: 'relative', width: '100%', aspectRatio: String(parts.ratio), fontFamily: 'var(--font-figtree, Figtree), var(--font-bangla, "Noto Sans Bengali"), system-ui, sans-serif' }}>
      <span style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: parts.svg }} />
      <span style={{ position: 'absolute', aspectRatio: '1', background: '#fff', display: 'grid', placeItems: 'center', left: parts.box.left + '%', top: parts.box.top + '%', width: parts.box.width + '%' }}>
        <QR r={r} style={st} {...q} />
      </span>
    </div>
  );
}
