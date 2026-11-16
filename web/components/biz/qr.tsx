'use client';
/* A QR code drawn as an SVG from the real link, in one of the table-card looks. Ported from website/app/app.js (QR). */
import { useMemo, type ReactElement } from 'react';
import qrcode from 'qrcode-generator';

export const QRL = { rounded: { en: 'Rounded', bn: 'গোলাকার' }, leaf: { en: 'Leaf', bn: 'পাতা' }, dots: { en: 'Dots', bn: 'ডট' }, diamond: { en: 'Diamond', bn: 'ডায়মন্ড' }, classic: { en: 'Classic', bn: 'ক্লাসিক' } };
export type QRLook = keyof typeof QRL;

const cache = new Map<string, boolean[][]>();
function matrix(text: string) {
  const hit = cache.get(text); if (hit) return hit;
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const c = q.getModuleCount(), m: boolean[][] = [];
  for (let y = 0; y < c; y++) { const row: boolean[] = []; for (let x = 0; x < c; x++) row.push(q.isDark(y, x)); m.push(row); }
  cache.set(text, m);
  return m;
}

export function QR({ text, look = 'rounded', color = '#141414' }: { text: string; look?: QRLook; color?: string }) {
  const svg = useMemo(() => {
    const m = matrix(text), c = m.length, parts: ReactElement[] = [];
    const eye = (y: number, x: number) => (y < 7 && x < 7) || (y < 7 && x >= c - 7) || (y >= c - 7 && x < 7);
    for (let y = 0; y < c; y++) for (let x = 0; x < c; x++) {
      if (!m[y][x] || eye(y, x)) continue;
      const k = y + '-' + x;
      if (look === 'dots') parts.push(<circle key={k} cx={x + 0.5} cy={y + 0.5} r={0.42} />);
      else if (look === 'diamond') parts.push(<path key={k} d={`M${x + 0.5} ${y + 0.04}L${x + 0.96} ${y + 0.5}L${x + 0.5} ${y + 0.96}L${x + 0.04} ${y + 0.5}Z`} />);
      else if (look === 'classic') parts.push(<rect key={k} x={x} y={y} width="1.02" height="1.02" />);
      else parts.push(<rect key={k} x={x + 0.06} y={y + 0.06} width="0.88" height="0.88" rx={look === 'leaf' ? 0.44 : 0.3} />);
    }
    const eyeAt = (x: number, y: number, k: string) => {
      if (look === 'dots') return <g key={k}><circle cx={x + 3.5} cy={y + 3.5} r="3" fill="none" stroke={color} strokeWidth="1" /><circle cx={x + 3.5} cy={y + 3.5} r="1.5" /></g>;
      if (look === 'leaf') return <g key={k}><path d={`M${x + 0.5} ${y + 3.5}A3 3 0 0 1 ${x + 3.5} ${y + 0.5}H${x + 6.5}V${y + 3.5}A3 3 0 0 1 ${x + 3.5} ${y + 6.5}H${x + 0.5}Z`} fill="none" stroke={color} strokeWidth="1" /><path d={`M${x + 2} ${y + 3.5}A1.5 1.5 0 0 1 ${x + 3.5} ${y + 2}H${x + 5}V${y + 3.5}A1.5 1.5 0 0 1 ${x + 3.5} ${y + 5}H${x + 2}Z`} /></g>;
      const rx = look === 'classic' ? 0 : 1.6;
      return <g key={k}><rect x={x + 0.5} y={y + 0.5} width="6" height="6" rx={rx} fill="none" stroke={color} strokeWidth="1" /><rect x={x + 2} y={y + 2} width="3" height="3" rx={rx / 2} /></g>;
    };
    return { c, parts, eyes: [eyeAt(0, 0, 'a'), eyeAt(c - 7, 0, 'b'), eyeAt(0, c - 7, 'c')] };
  }, [text, look, color]);
  return (
    <div className="qr">
      <svg viewBox={`-1 -1 ${svg.c + 2} ${svg.c + 2}`} fill={color} role="img" aria-label="QR code">{svg.parts}{svg.eyes}</svg>
    </div>
  );
}
