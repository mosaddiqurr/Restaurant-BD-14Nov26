'use client';
/* The map on Home and on each restaurant page. Leaflet loads only when the map is about to scroll into view.
   Tiles: Stadia Maps "Alidade Smooth", a clean light / dark base map (OpenStreetMap data), switched with
   the site theme. It works on localhost with no key; the live site needs a Stadia plan with the domain
   added (docs/4-tech/17-tech-stack.md). CARTO's free tiles (light_all / dark_all) now ask for an API key,
   so they are kept below as the other choice once Khaoya has one.
   Pins that sit close together merge into one round count; tap it to zoom in. A name shows next to a pin
   only where it has room, otherwise on hover or focus. */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInView } from 'motion/react';
import { useTheme } from 'next-themes';
import 'leaflet/dist/leaflet.css';
import { useI } from '@/components/providers/i18n';
import { useHref } from '@/components/shell/nav';
import { esc } from '@/lib/khabo';
import type { Text, Theme } from '@/lib/data/types';

export type MapPin = { id: string; geo: [number, number]; mono: string; name: Text; theme: Theme };

const TILES = {
  stadia: {
    url: (dark: boolean) => `https://tiles.stadiamaps.com/tiles/${dark ? 'alidade_smooth_dark' : 'alidade_smooth'}/{z}/{x}/{y}{r}.png`,
    attr: '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    subdomains: 'abc',
  },
  carto: {
    url: (dark: boolean) => `https://{s}.basemaps.cartocdn.com/${dark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`,
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    subdomains: 'abcd',
  },
};
const T = TILES.stadia;
const tiles = T.url;
const W = {
  group: { en: '{n} places here, tap to zoom in', bn: 'এখানে {n}টি জায়গা, কাছ থেকে দেখতে চাপুন' },
};
/** pins closer than this (in screen pixels) merge into one count */
const NEAR = 46;
const PIN = 17; /* half a pin */

type Box = [number, number, number, number];
const hit = (a: Box, b: Box) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

let ctx: CanvasRenderingContext2D | null = null;
/** how wide a name label will be (the label font is 650 13px) */
function labelW(t: string) {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return t.length * 7.4 + 20;
  ctx.font = `650 13px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`;
  return ctx.measureText(t).width + 20;
}

export function MapBox({ list, single }: { list: MapPin[]; single?: boolean }) {
  const i = useI(), href = useHref(), router = useRouter();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '400px 0px' });
  const map = useRef<import('leaflet').Map | null>(null), layer = useRef<import('leaflet').LayerGroup | null>(null);
  const tl = useRef<import('leaflet').TileLayer | null>(null);
  const draw = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const darkRef = useRef(dark);

  useEffect(() => {
    if (!inView || !ref.current) return;
    let dead = false;
    import('leaflet').then(Lf => {
      if (dead || !ref.current) return;
      /* on phones one finger scrolls the page, not the map (pinch still zooms) */
      const m = Lf.map(ref.current, { scrollWheelZoom: false, attributionControl: true, dragging: !Lf.Browser.mobile, zoomSnap: 0.5 });
      /* these tiles already come in a dark style, so the old "invert" filter for dark mode is switched off */
      m.getPane('tilePane')!.style.filter = 'none';
      /* only the map data credits (they must stay); the Leaflet link is optional and crowds phones */
      m.attributionControl.setPrefix(false);
      tl.current = Lf.tileLayer(tiles(darkRef.current), { attribution: T.attr, subdomains: T.subdomains, maxZoom: 19 }).addTo(m);
      /* labels are placed again whenever the view settles (zoom or pan) */
      m.on('moveend', () => draw.current());
      map.current = m; layer.current = Lf.layerGroup().addTo(m); setReady(true);
    });
    return () => { dead = true; map.current?.remove(); map.current = null; tl.current = null; };
  }, [inView]);

  /* light or dark tiles follow the theme */
  useEffect(() => { darkRef.current = dark; tl.current?.setUrl(tiles(dark)); }, [dark, ready]);

  const key = list.map(r => r.id).join() + i.lang;
  useEffect(() => {
    if (!ready) return;
    import('leaflet').then(Lf => {
      const m = map.current, lay = layer.current; if (!m || !lay) return;
      const go = (r: MapPin) => router.push(href('/r/' + r.id));

      if (single) {
        lay.clearLayers();
        list.forEach(r => {
          const ic = Lf.divIcon({ className: 'mk', html: `<div class="mk-w" style="--d:${r.theme.deep};--a:${r.theme.accent}"><span class="mk-b">${esc(r.mono)}</span></div>`, iconSize: [0, 0] });
          Lf.marker(r.geo, { icon: ic, keyboard: true, title: i.L(r.name) }).addTo(lay);
        });
        if (list.length) m.setView(list[0].geo, 15);
        draw.current = () => {};
        return;
      }

      draw.current = () => {
        lay.clearLayers();
        const z = m.getZoom(), view = m.getPixelBounds();
        const pts = list.map(r => ({ r, p: m.project(r.geo, z) }));
        /* 1. merge pins that would sit on top of each other (not at the closest zoom: then they are really neighbours) */
        type G = { items: typeof pts; x: number; y: number };
        const groups: G[] = [];
        const merge = z < m.getMaxZoom() - 1;
        for (const it of pts) {
          const g = merge ? groups.find(q => Math.hypot(q.x - it.p.x, q.y - it.p.y) < NEAR) : undefined;
          if (g) { g.items.push(it); g.x = g.items.reduce((s, v) => s + v.p.x, 0) / g.items.length; g.y = g.items.reduce((s, v) => s + v.p.y, 0) / g.items.length; }
          else groups.push({ items: [it], x: it.p.x, y: it.p.y });
        }
        /* 2. every pin and count takes its space first; then names go right (or left) of a pin where they fit */
        const taken: Box[] = groups.map(g => { const h = g.items.length > 1 ? 22 : PIN; return [g.x - h, g.y - h, g.x + h, g.y + h]; });
        groups.forEach((g, gi) => {
          if (g.items.length > 1) {
            const n = g.items.length;
            const ic = Lf.divIcon({ className: 'mk', html: `<div class="kc${n > 9 ? ' kc-l' : ''}"><b>${esc(i.N(n))}</b></div>`, iconSize: [0, 0] });
            const mk = Lf.marker(m.unproject([g.x, g.y], z), { icon: ic, keyboard: true, title: i.L(W.group).replace('{n}', i.N(n)), zIndexOffset: 1000 }).addTo(lay);
            mk.on('click', () => {
              const b = Lf.latLngBounds(g.items.map(v => v.r.geo));
              const to = Math.min(m.getBoundsZoom(b.pad(0.4)), m.getMaxZoom());
              m.flyTo(b.getCenter(), Math.max(to, z + 1.5), { duration: 0.45 });
            });
            return;
          }
          const r = g.items[0].r, nm = i.L(r.name), w = labelW(nm);
          const right: Box = [g.x + PIN + 4, g.y - 13, g.x + PIN + 4 + w, g.y + 13];
          const left: Box = [g.x - PIN - 4 - w, g.y - 13, g.x - PIN - 4, g.y + 13];
          const others = taken.filter((_, k) => k !== gi);
          /* a name must also stay inside the map */
          const inside = (b: Box) => b[0] > view.min!.x + 6 && b[2] < view.max!.x - 6 && b[1] > view.min!.y + 4 && b[3] < view.max!.y - 4;
          const fits = (b: Box) => inside(b) && !others.some(o => hit(o, b));
          const side = fits(right) ? 'r' : fits(left) ? 'l' : '';
          if (side) taken.push(side === 'r' ? right : left);
          const ic = Lf.divIcon({
            className: 'mk',
            html: `<div class="kp${side ? '' : ' nl'}${side === 'l' ? ' l' : ''}" style="--d:${r.theme.deep};--a:${r.theme.accent}"><span class="kp-b">${esc(r.mono)}</span><span class="kp-n">${esc(nm)}</span></div>`,
            iconSize: [0, 0],
          });
          const mk = Lf.marker(r.geo, { icon: ic, keyboard: true, title: nm, riseOnHover: true }).addTo(lay);
          mk.on('click', () => go(r));
        });
      };

      /* fit the restaurants snugly (drawing happens when the view settles) */
      const geo = list.map(r => r.geo);
      if (geo.length === 1) m.setView(geo[0], 15, { animate: false });
      else if (geo.length) m.fitBounds(geo, { padding: [36, 36], maxZoom: 15, animate: false });
      else draw.current();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);
  return <div ref={ref} className={single ? undefined : 'kmap'} style={{ position: 'absolute', inset: 0 }} />;
}
