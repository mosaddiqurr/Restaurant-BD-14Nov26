'use client';
/* The Kacchi Report as a picture to share (1080 x 1350, the size social feeds like), drawn from the same numbers
   as the page. Ported from archive/prototype/app/app.js (shareCanvas). */

export type IndexRow = { id: string; n: number; now: number; lm: number; m6: number };
export type ShareWords = { title: string; place: string; avg: (d: string) => string; vs: (v: string) => string; type: (id: string) => string; tk: (v: number) => string; foot: string };

/** the page's own fonts (next/font gives them generated names), ready for the canvas */
export async function canvasFonts() {
  const cs = getComputedStyle(document.documentElement);
  const fig = cs.getPropertyValue('--font-figtree').trim() || 'Figtree';
  const bn = cs.getPropertyValue('--font-bangla').trim() || '"Noto Sans Bengali"';
  const fam = `${fig}, ${bn}, sans-serif`;
  try { await Promise.all([document.fonts.load(`800 40px ${fig}`), document.fonts.load(`700 40px ${bn}`, 'কাচ্চি'), document.fonts.ready]); } catch { /* draw with what is there */ }
  return fam;
}

export function shareCanvas(rows: IndexRow[], w: ShareWords, fam: string) {
  const c = document.createElement('canvas'), W = 1080, H = 1350;
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const font = (wt: number, sz: number) => `${wt} ${sz}px ${fam}`;
  const arrow = (ch: number) => (ch > 0 ? '▲ ' : ch < 0 ? '▼ ' : '');
  const tone = (ch: number, same = 'rgba(244,241,230,.74)') => (ch > 0 ? '#F0745F' : ch < 0 ? '#4CC88F' : same);
  g.fillStyle = '#0B3B29'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#F4B91A'; g.fillRect(0, 0, W, 14);
  g.fillStyle = '#F4F1E6'; g.font = font(800, 76); g.fillText(w.title, 80, 170);
  g.fillStyle = 'rgba(244,241,230,.74)'; g.font = font(500, 34); g.fillText(w.place, 80, 228);
  const top = rows[0];
  if (top) {
    g.fillStyle = 'rgba(244,241,230,.74)'; g.font = font(600, 36); g.fillText(w.avg(w.type(top.id)), 80, 340);
    g.fillStyle = '#F4B91A'; g.font = font(800, 170); g.fillText(w.tk(top.now), 74, 500);
    const ch = top.now - top.lm;
    g.fillStyle = tone(ch); g.font = font(700, 40); g.fillText(w.vs(arrow(ch) + w.tk(Math.abs(ch))), 80, 570);
  }
  let y = 690;
  rows.slice(1, 8).forEach(z => {
    g.fillStyle = 'rgba(244,241,230,.12)'; g.fillRect(80, y - 52, W - 160, 2);
    g.fillStyle = '#F4F1E6'; g.font = font(700, 40); g.fillText(w.type(z.id), 80, y);
    g.textAlign = 'right'; g.font = font(800, 42); g.fillText(w.tk(z.now), W - 260, y);
    const ch = z.now - z.lm;
    g.fillStyle = tone(ch, 'rgba(244,241,230,.6)'); g.font = font(700, 32); g.fillText(arrow(ch) + w.tk(Math.abs(ch)), W - 80, y);
    g.textAlign = 'left'; y += 86;
  });
  g.fillStyle = 'rgba(244,241,230,.6)'; g.font = font(500, 28); g.fillText(w.foot, 80, H - 90);
  g.fillStyle = '#F4F1E6'; g.font = font(800, 44); g.textAlign = 'right'; g.fillText('Khaoya', W - 80, H - 86); g.textAlign = 'left';
  return c;
}
