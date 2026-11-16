/* Branded QR codes as plain SVG text. No React and no browser APIs, so the same code runs on the server
   (print menu, static pages) and in the browser (owner panel previews).
   Ported from website/code/qr.js. See components/qr/qr.tsx for the React parts and how to use them.

   A restaurant's look comes from its data, never from page code:
     r.qr = { look: 'rounded' }              one of QR_LOOKS
     r.qr = { dots: 'dots', eyes: 'leaf' }   or the two shapes set by hand
     r.qr = { look: 'logo' }                 the whole code takes the shape of r.brand.shape (when there is one)
   With a logo in the middle the code uses the highest error correction (H, about 30%) and the logo covers
   well under that, so phones still read it. Colours stay dark on white. */
import qrcode from 'qrcode-generator';

/** where printed codes point to. In the browser the page's own address is used instead (see useQrOrigin) */
export const QR_ORIGIN = 'https://khabo.app';

/** the address a table code opens: /t/<id>, with the table number when there is one */
export const tableUrl = (id: string, o: { table?: number | string | null; origin?: string } = {}) =>
  `${(o.origin || QR_ORIGIN).replace(/\/$/, '')}/t/${encodeURIComponent(id)}${o.table ? `?table=${encodeURIComponent(String(o.table))}` : ''}`;

export type QrDots = 'square' | 'rounded' | 'dots' | 'diamond' | 'bars';
export type QrEyes = 'square' | 'rounded' | 'circle' | 'leaf';
export type QrLook = 'classic' | 'rounded' | 'dots' | 'leaf' | 'diamond' | 'bars' | 'logo';
export type QrShape = { shape: string; box: number[]; extra?: string; gap?: number };
export type QrStyle = {
  dots: QrDots; eyes: QrEyes; fg: string; eye: string; bg: string;
  /** a picture (src) or the monogram (text on bg) in the middle; none for a plain code */
  logo?: { src: string } | { text: string; bg: string; fg: string } | null;
  /** logo-shaped code (look 'logo') */
  shape?: QrShape | null;
};
/** the little a QR needs to know about a restaurant */
export type QrRest = {
  id: string; mono: string; theme: { deep: string; accent: string };
  qr?: { look?: string; dots?: string; eyes?: string; fg?: string; eye?: string } | null;
  brand?: { logo?: string; shape?: string; box?: number[]; extra?: string; gap?: number } | null;
  logo?: string;
};

/** tested looks a restaurant can choose from; each one is just a pair of shapes */
export const QR_LOOKS: Record<QrLook, { dots: QrDots; eyes: QrEyes; en: string; bn: string; needs?: 'shape' }> = {
  classic: { dots: 'square', eyes: 'square', en: 'Classic', bn: 'ক্লাসিক' },
  rounded: { dots: 'rounded', eyes: 'rounded', en: 'Rounded', bn: 'গোলাকার' },
  dots: { dots: 'dots', eyes: 'circle', en: 'Dots', bn: 'ডট' },
  leaf: { dots: 'rounded', eyes: 'leaf', en: 'Leaf', bn: 'পাতা' },
  diamond: { dots: 'diamond', eyes: 'rounded', en: 'Diamond', bn: 'ডায়মন্ড' },
  bars: { dots: 'bars', eyes: 'rounded', en: 'Lines', bn: 'লাইন' },
  /* only for restaurants with a logo shape (r.brand.shape): the whole code takes the shape of the logo */
  logo: { dots: 'rounded', eyes: 'rounded', en: 'Logo shape', bn: 'লোগোর আকার', needs: 'shape' },
};
const isLook = (k: unknown): k is QrLook => typeof k === 'string' && k in QR_LOOKS;
const hasShape = (r: QrRest) => !!(r.brand && r.brand.shape && r.brand.box && r.brand.box.length >= 3);

/** the looks this restaurant can use (Logo shape only when it has a logo shape) */
export const qrLooksFor = (r: QrRest) => (Object.keys(QR_LOOKS) as QrLook[]).filter(k => !QR_LOOKS[k].needs || hasShape(r));

/** what a restaurant's code looks like; pass a look to preview another one */
export function qrStyle(r: QrRest, look?: string | null): QrStyle {
  const q = r.qr || {}, key = look || q.look;
  if (key === 'logo' && hasShape(r)) {
    const b = r.brand!;
    return { dots: 'rounded', eyes: 'rounded', fg: q.fg || r.theme.deep, eye: q.eye || q.fg || r.theme.deep, bg: '#fff', shape: { shape: b.shape!, box: b.box!, extra: b.extra, gap: b.gap } };
  }
  const L = isLook(key) && key !== 'logo' ? QR_LOOKS[key] : QR_LOOKS.rounded;
  return {
    dots: look ? L.dots : (q.dots as QrDots) || L.dots, eyes: look ? L.eyes : (q.eyes as QrEyes) || L.eyes,
    fg: q.fg || r.theme.deep, eye: q.eye || q.fg || r.theme.deep, bg: '#fff',
    logo: r.logo ? { src: r.logo } : { text: r.mono, bg: r.theme.deep, fg: r.theme.accent },
  };
}

/* ---------- shapes, all drawn in module units on an n x n grid ---------- */
const f = (v: number) => +v.toFixed(3);
const escX = (s: unknown) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
type On = (x: number, y: number) => boolean;

/** a square with only its free corners rounded, so touching modules melt together */
function blob(x: number, y: number, on: On, r: number) {
  const t = !on(x, y - 1), b = !on(x, y + 1), l = !on(x - 1, y), rt = !on(x + 1, y);
  const tl = t && l ? r : 0, tr = t && rt ? r : 0, br = b && rt ? r : 0, bl = b && l ? r : 0;
  return `M${x + tl} ${y}H${f(x + 1 - tr)}${tr ? `A${r} ${r} 0 0 1 ${x + 1} ${f(y + tr)}` : ''}V${f(y + 1 - br)}${br ? `A${r} ${r} 0 0 1 ${f(x + 1 - br)} ${y + 1}` : ''}H${f(x + bl)}${bl ? `A${r} ${r} 0 0 1 ${x} ${f(y + 1 - bl)}` : ''}V${f(y + tl)}${tl ? `A${r} ${r} 0 0 1 ${f(x + tl)} ${y}` : ''}Z`;
}
/** rounded rectangle with its own radius per corner: tl, tr, br, bl */
function rrect(x: number, y: number, w: number, h: number, [a, b, c, d]: number[]) {
  return `M${f(x + a)} ${y}H${f(x + w - b)}A${b} ${b} 0 0 1 ${f(x + w)} ${f(y + b)}V${f(y + h - c)}A${c} ${c} 0 0 1 ${f(x + w - c)} ${f(y + h)}H${f(x + d)}A${d} ${d} 0 0 1 ${x} ${f(y + h - d)}V${f(y + a)}A${a} ${a} 0 0 1 ${f(x + a)} ${y}Z`;
}
const circ = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0Z`;

function moduleShape(style: QrDots, x: number, y: number, on: On) {
  switch (style) {
    case 'dots': return circ(x + 0.5, y + 0.5, 0.43);
    case 'diamond': return `M${x + 0.5} ${f(y - 0.02)}L${f(x + 1.02)} ${y + 0.5}L${x + 0.5} ${f(y + 1.02)}L${f(x - 0.02)} ${y + 0.5}Z`;
    case 'rounded': return blob(x, y, on, 0.5);
    default: return `M${x} ${y}h1v1h-1Z`;
  }
}
/** finder corners: outer ring (7x7) and centre (3x3); the leaf points away from the code */
function eyeShape(style: QrEyes, x: number, y: number, corner: 'tl' | 'tr' | 'bl') {
  const ring = (rad: number[], inner: number[]) => rrect(x, y, 7, 7, rad) + rrect(x + 1, y + 1, 5, 5, inner);
  const leafOuter = corner === 'tl' ? [3.5, 0.6, 3.5, 0.6] : [0.6, 3.5, 0.6, 3.5];
  const leafCore = corner === 'tl' ? [1.5, 0.3, 1.5, 0.3] : [0.3, 1.5, 0.3, 1.5];
  switch (style) {
    case 'circle': return { ring: circ(x + 3.5, y + 3.5, 3.5) + circ(x + 3.5, y + 3.5, 2.5), core: circ(x + 3.5, y + 3.5, 1.5) };
    case 'rounded': return { ring: ring([2, 2, 2, 2], [1.3, 1.3, 1.3, 1.3]), core: rrect(x + 2, y + 2, 3, 3, [0.9, 0.9, 0.9, 0.9]) };
    case 'leaf': return { ring: ring(leafOuter, leafOuter.map(v => Math.max(0.3, v - 1))), core: rrect(x + 2, y + 2, 3, 3, leafCore) };
    default: return { ring: `M${x} ${y}h7v7h-7ZM${x + 1} ${y + 1}h5v5h-5Z`, core: `M${x + 2} ${y + 2}h3v3h-3Z` };
  }
}
const SVG_STYLE = 'display:block;width:100%;height:100%';

/* ---------- point in an SVG path, without a canvas (so it also works on the server) ---------- */
type Pt = [number, number];
/** turns an SVG path into closed outlines of straight lines (curves and arcs are sampled) */
export function pathOutlines(d: string): Pt[][] {
  let i = 0;
  const n = d.length, out: Pt[][] = [];
  let cur: Pt[] = [], x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0, cmd = '', last = '';
  const ws = () => { while (i < n && /[\s,]/.test(d[i])) i++; };
  const num = () => { ws(); const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(d.slice(i)); if (!m) { i = n; return 0; } i += m[0].length; return parseFloat(m[0]); };
  const flag = () => { ws(); return d[i++] === '1'; };
  const close = () => { if (cur.length > 2) out.push(cur); cur = []; };
  const to = (nx: number, ny: number) => { cur.push([nx, ny]); x = nx; y = ny; };
  const STEPS = 12;
  const cubic = (x1: number, y1: number, x2: number, y2: number, ex: number, ey: number) => {
    const x0 = x, y0 = y;
    for (let k = 1; k <= STEPS; k++) { const t = k / STEPS, u = 1 - t; cur.push([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey]); }
    x = ex; y = ey; cx = x2; cy = y2;
  };
  const quad = (x1: number, y1: number, ex: number, ey: number) => {
    const x0 = x, y0 = y;
    for (let k = 1; k <= STEPS; k++) { const t = k / STEPS, u = 1 - t; cur.push([u * u * x0 + 2 * u * t * x1 + t * t * ex, u * u * y0 + 2 * u * t * y1 + t * t * ey]); }
    x = ex; y = ey; cx = x1; cy = y1;
  };
  /* SVG arc: endpoint form to centre form (SVG spec, appendix F.6.5), then sampled */
  const arc = (rx: number, ry: number, rot: number, large: boolean, sweep: boolean, ex: number, ey: number) => {
    if (!rx || !ry) { to(ex, ey); return; }
    rx = Math.abs(rx); ry = Math.abs(ry);
    const phi = rot * Math.PI / 180, cs = Math.cos(phi), sn = Math.sin(phi);
    const dx = (x - ex) / 2, dy = (y - ey) / 2, x1 = cs * dx + sn * dy, y1 = -sn * dx + cs * dy;
    const lam = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry);
    if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
    const num2 = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1, den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
    let co = Math.sqrt(Math.max(0, num2 / den)); if (large === sweep) co = -co;
    const cxp = co * rx * y1 / ry, cyp = -co * ry * x1 / rx;
    const ccx = cs * cxp - sn * cyp + (x + ex) / 2, ccy = sn * cxp + cs * cyp + (y + ey) / 2;
    const ang = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const t1 = ang(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry);
    let dt = ang((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
    if (!sweep && dt > 0) dt -= 2 * Math.PI; else if (sweep && dt < 0) dt += 2 * Math.PI;
    for (let k = 1; k <= STEPS; k++) { const t = t1 + dt * k / STEPS; cur.push([ccx + rx * Math.cos(t) * cs - ry * Math.sin(t) * sn, ccy + rx * Math.cos(t) * sn + ry * Math.sin(t) * cs]); }
    x = ex; y = ey;
  };
  while (true) {
    ws(); if (i >= n) break;
    if (/[a-zA-Z]/.test(d[i])) cmd = d[i++]; else if (!cmd) break;
    const rel = cmd === cmd.toLowerCase(), C0 = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    switch (C0) {
      case 'M': { close(); const nx = num() + ox, ny = num() + oy; x = sx = nx; y = sy = ny; cur = [[nx, ny]]; cmd = rel ? 'l' : 'L'; break; }
      case 'L': to(num() + ox, num() + oy); break;
      case 'H': to(num() + ox, y); break;
      case 'V': to(x, num() + oy); break;
      case 'C': { const a = num() + ox, b = num() + oy, c = num() + ox, e = num() + oy, g = num() + ox, h = num() + oy; cubic(a, b, c, e, g, h); break; }
      case 'S': { const r1 = /[CS]/i.test(last) ? 2 * x - cx : x, r2 = /[CS]/i.test(last) ? 2 * y - cy : y; const c = num() + ox, e = num() + oy, g = num() + ox, h = num() + oy; cubic(r1, r2, c, e, g, h); break; }
      case 'Q': { const a = num() + ox, b = num() + oy, g = num() + ox, h = num() + oy; quad(a, b, g, h); break; }
      case 'T': { const a = /[QT]/i.test(last) ? 2 * x - cx : x, b = /[QT]/i.test(last) ? 2 * y - cy : y; quad(a, b, num() + ox, num() + oy); break; }
      case 'A': { const rx = num(), ry = num(), rot = num(), lg = flag(), sw = flag(); arc(rx, ry, rot, lg, sw, num() + ox, num() + oy); break; }
      case 'Z': close(); x = sx; y = sy; cur = [[x, y]]; break;
      default: i = n;
    }
    last = C0;
  }
  close();
  return out;
}
/** is the point inside the outlines (nonzero rule, the same as a canvas fill) */
export function inOutlines(polys: Pt[][], px: number, py: number) {
  let w = 0;
  for (const p of polys) {
    for (let k = 0, m = p.length; k < m; k++) {
      const [x0, y0] = p[k], [x1, y1] = p[(k + 1) % m];
      if (y0 <= py) { if (y1 > py && (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0) > 0) w++; }
      else if (y1 <= py && (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0) < 0) w--;
    }
  }
  return w !== 0;
}

/* a repeatable random list, so the same address always draws the same pattern */
const rng = (s: string) => { let a = 0; for (let k = 0; k < s.length; k++) a = Math.imul(a ^ s.charCodeAt(k), 2654435761) >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

/* Logo-shaped code. Phones only read a square QR, so the real code sits whole inside the shape (sh.box),
   with a clear band around it, and the rest of the shape is filled with look-alike dots.
   The eye sees the logo; the camera still finds the three corner squares and the code. */
function qrShapeSvg(url: string, st: QrStyle, label: string) {
  const sh = st.shape!, q = qrcode(0, 'H'); q.addData(url); q.make();
  const n = q.getModuleCount(), gap = sh.gap || 3, G = Math.ceil((n + gap * 2) / (sh.box[2] / 100)), k = G / 100;
  const ox = Math.round(sh.box[0] * k) + gap, oy = Math.round(sh.box[1] * k) + gap;
  const polys = pathOutlines(sh.shape);
  const inShape = (x: number, y: number) => inOutlines(polys, x / k, y / k);
  const inEye = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const near = (x: number, y: number) => x >= ox - gap && x < ox + n + gap && y >= oy - gap && y < oy + n + gap;
  const rnd = rng(url), deco = new Uint8Array(G * G), m = 0.95;
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    if (near(x, y)) continue;
    const c = x + 0.5, d = y + 0.5;
    if (inShape(c, d) && inShape(c - m, d - m) && inShape(c + m, d - m) && inShape(c - m, d + m) && inShape(c + m, d + m)) deco[y * G + x] = rnd() < 0.46 ? 1 : 0;
  }
  const on: On = (x, y) => {
    if (x < 0 || y < 0 || x >= G || y >= G) return false;
    if (x >= ox && x < ox + n && y >= oy && y < oy + n) { const a = x - ox, b = y - oy; return q.isDark(b, a) && !inEye(a, b); }
    return deco[y * G + x] === 1;
  };
  let dots = '';
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) if (on(x, y)) dots += moduleShape(st.dots, x, y, on);
  let eyes = '', cores = '';
  ([[ox, oy, 'tl'], [ox + n - 7, oy, 'tr'], [ox, oy + n - 7, 'bl']] as const).forEach(([x, y, c]) => { const e = eyeShape(st.eyes, x, y, c); eyes += e.ring; cores += e.core; });
  const sw = f(1 / k);
  return `<svg class="qra qra-shape" viewBox="0 0 ${G} ${G}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escX(label)}" style="${SVG_STYLE}"><g transform="scale(${f(k)})"><path d="${escX(sh.shape)}" fill="${escX(st.bg)}" stroke="${escX(st.eye)}" stroke-width="${f(sw * 1.1)}" stroke-linejoin="round"/>${sh.extra ? `<path d="${escX(sh.extra)}" fill="none" stroke="${escX(st.eye)}" stroke-width="${f(sw * 1.3)}" stroke-linecap="round"/>` : ''}</g><path d="${dots}" fill="${escX(st.fg)}"/><path d="${eyes}" fill="${escX(st.eye)}" fill-rule="evenodd"/><path d="${cores}" fill="${escX(st.eye)}"/></svg>`;
}

/** the SVG markup for an address in a style. Returns text, so it works for print, downloads and the server */
export function qrSvg(url: string, st: QrStyle, label = 'QR code') {
  if (st.shape && st.shape.shape) return qrShapeSvg(url, st, label);
  const logoOn = !!st.logo;
  const q = qrcode(0, logoOn ? 'H' : 'M'); q.addData(url); q.make();
  const n = q.getModuleCount();
  /* logo window: about a fifth of the width, always an odd size so it sits dead centre */
  let lw = logoOn ? Math.round(n * 0.22) : 0; if (lw && lw % 2 === 0) lw++;
  const l0 = (n - lw) / 2 - 0.5, l1 = l0 + lw + 1;
  const inEye = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const inLogo = (x: number, y: number) => !!lw && x >= l0 && x < l1 && y >= l0 && y < l1;
  const on: On = (x, y) => x >= 0 && y >= 0 && x < n && y < n && q.isDark(y, x) && !inEye(x, y) && !inLogo(x, y);
  let d = '';
  if (st.dots === 'bars') {
    /* vertical runs merged into one rounded bar each */
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
      if (!on(x, y) || on(x, y - 1)) continue;
      let e = y; while (on(x, e + 1)) e++;
      d += rrect(x + 0.1, y + 0.05, 0.8, e - y + 0.9, [0.4, 0.4, 0.4, 0.4]);
    }
  } else {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (on(x, y)) d += moduleShape(st.dots, x, y, on);
  }
  let eyes = '', cores = '';
  ([[0, 0, 'tl'], [n - 7, 0, 'tr'], [0, n - 7, 'bl']] as const).forEach(([x, y, c]) => { const e = eyeShape(st.eyes, x, y, c); eyes += e.ring; cores += e.core; });
  let logo = '';
  if (st.logo) {
    const s = lw - 0.6, x = (n - s) / 2;
    logo = 'src' in st.logo
      ? `<rect x="${f(x - 0.3)}" y="${f(x - 0.3)}" width="${f(s + 0.6)}" height="${f(s + 0.6)}" rx="${f(s * 0.26)}" fill="#fff"/><image href="${escX(st.logo.src)}" x="${f(x)}" y="${f(x)}" width="${f(s)}" height="${f(s)}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round ${f(s * 0.22)})"/>`
      : `<rect x="${f(x)}" y="${f(x)}" width="${f(s)}" height="${f(s)}" rx="${f(s * 0.26)}" fill="${escX(st.logo.bg)}"/><text x="${n / 2}" y="${n / 2}" fill="${escX(st.logo.fg)}" style="font-family:var(--font-figtree, Figtree), system-ui, sans-serif" font-weight="800" font-size="${f(s * (String(st.logo.text).length > 2 ? 0.34 : 0.42))}" text-anchor="middle" dominant-baseline="central" letter-spacing="-.02em">${escX(st.logo.text)}</text>`;
  }
  return `<svg class="qra" viewBox="-.5 -.5 ${n + 1} ${n + 1}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escX(label)}" style="${SVG_STYLE}"><rect x="-.5" y="-.5" width="${n + 1}" height="${n + 1}" fill="${escX(st.bg)}"/><path d="${d}" fill="${escX(st.fg)}"/><path d="${eyes}" fill="${escX(st.eye)}" fill-rule="evenodd"/><path d="${cores}" fill="${escX(st.eye)}"/>${logo}</svg>`;
}

/** a restaurant's table code in one call: qrFor(r, { table: 4 }) */
export const qrFor = (r: QrRest, o: { table?: number | string | null; origin?: string; look?: string | null; label?: string } = {}) =>
  qrSvg(tableUrl(r.id, o), qrStyle(r, o.look), o.label);
