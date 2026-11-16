/* Fuchka Catch. Fuchka fall in front of the restaurant's own wall (its colours, its logo as the big sign);
   slide the plate along the counter to catch them and keep away from the red chillies (three lives). A golden
   fuchka counts double and a bowl of tamarind water makes the plate wider for a few seconds. It gets faster,
   busier and more slanted the longer you last.
   three.js, low-poly, flat solid colours, one soft shadow. The frame (host.tsx) draws the score and the cards. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Brand, GameFactory } from './types';

/* ---------- tuning ---------- */
const POOL = 28;            // falling items on screen at most
const CRUMBS = 64;          // crumb particles at most
const SLOTS = 6;            // fuchka that fit on the plate before they get eaten
const LIVES = 3;
const PLATE_R = 0.95;
const COUNTER_Y = 0.42;     // top of the counter the plate slides on
const PLATE_Y = COUNTER_Y + 0.02;
const CATCH_Y = PLATE_Y + 0.32;
const ITEM_Z = 0.35;        // the depth everything falls in
const FOV = 42;
const TILT = 0.27;          // how much the camera looks down (radians)
const WIDE_TIME = 7;        // seconds the tamarind bowl keeps the plate wide
const END_TIME = 0.6;       // the little end animation before onOver

type Kind = 0 | 1 | 2 | 3;  // fuchka, golden double fuchka, chilli, tamarind bowl
type Item = {
  on: boolean; kind: Kind; x: number; y: number; vx: number; vy: number;
  rx: number; ry: number; rz: number; sx: number; sy: number; sz: number;
  out: boolean;             // chilli knocked off the plate: no longer catchable
};
type Crumb = { on: boolean; x: number; y: number; z: number; vx: number; vy: number; vz: number; r: number; life: number; s: number };
type Slot = { on: boolean; t: number; gold: boolean };

/* ---------- small helpers ---------- */
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);

/** paint one flat colour into a geometry (vertex colours) so several parts can share one mesh and one draw call */
function tinted(g: THREE.BufferGeometry, hex: THREE.ColorRepresentation): THREE.BufferGeometry {
  const geo = g.index ? g.toNonIndexed() : g;
  if (geo !== g) g.dispose();
  if (geo.getAttribute('uv')) geo.deleteAttribute('uv');
  const c = new THREE.Color(hex), n = geo.getAttribute('position').count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
function merged(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const m = mergeGeometries(parts) ?? new THREE.BufferGeometry();
  parts.forEach(p => p.dispose());
  return m;
}
const at = (g: THREE.BufferGeometry, x: number, y: number, z: number) => g.translate(x, y, z);

/* ---------- shapes ---------- */
/** a crisp round puri with the hole on top, a little filling showing */
function fuchkaGeo() {
  const shell = new THREE.SphereGeometry(0.42, 11, 8, 0, Math.PI * 2, 0.56, Math.PI - 0.56);
  shell.scale(1, 0.82, 1);
  const fill = new THREE.CircleGeometry(0.24, 9); fill.rotateX(-Math.PI / 2); at(fill, 0, 0.25, 0);
  const pea = new THREE.IcosahedronGeometry(0.07, 0); at(pea, 0.06, 0.28, 0.03);
  const herb = new THREE.TetrahedronGeometry(0.06); at(herb, -0.07, 0.28, -0.04);
  const onion = new THREE.TetrahedronGeometry(0.05); at(onion, 0.0, 0.28, -0.1);
  return merged([tinted(shell, '#DDA042'), tinted(fill, '#5A2D14'), tinted(pea, '#E8C977'), tinted(herb, '#3F8A35'), tinted(onion, '#B04A6A')]);
}
/** a curled red chilli with a green cap */
function chilliGeo() {
  const body = new THREE.CylinderGeometry(0.13, 0.025, 0.95, 8, 6);
  const p = body.getAttribute('position');
  for (let i = 0; i < p.count; i++) { const t = (0.475 - p.getY(i)) / 0.95; p.setX(i, p.getX(i) + 0.26 * t * t); }
  const shoulder = new THREE.SphereGeometry(0.13, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2); at(shoulder, 0, 0.475, 0);
  const cap = new THREE.CylinderGeometry(0.11, 0.075, 0.07, 7); at(cap, 0, 0.58, 0);
  const stem = new THREE.CylinderGeometry(0.025, 0.035, 0.2, 5); stem.rotateZ(-0.45); at(stem, 0.04, 0.69, 0);
  const g = merged([tinted(body, '#D3271C'), tinted(shoulder, '#D3271C'), tinted(cap, '#3E7F2C'), tinted(stem, '#4F8E33')]);
  return g.translate(-0.06, -0.12, 0);
}
/** a clay bowl of tamarind water */
function bowlGeo() {
  const pts = [[0, 0], [0.24, 0], [0.4, 0.1], [0.5, 0.28], [0.5, 0.34], [0.46, 0.34]].map(([x, y]) => new THREE.Vector2(x, y));
  const bowl = new THREE.LatheGeometry(pts, 12);
  const water = new THREE.CircleGeometry(0.46, 12); water.rotateX(-Math.PI / 2); at(water, 0, 0.3, 0);
  const lemon = new THREE.CylinderGeometry(0.1, 0.1, 0.03, 7); at(lemon, 0.14, 0.31, 0.06);
  return merged([tinted(bowl, '#B4602F'), tinted(water, '#5C2A10'), tinted(lemon, '#D8D35A')]).translate(0, -0.15, 0);
}

/* ---------- colours ---------- */
/* light: a bright day; dark: a warm, well lit evening (never black). The wall itself wears the restaurant's colours */
type Pal = { cloth: string; well: string; dish: string; hemiSky: string; hemiGround: string; hemi: number; sun: string; sunI: number; lamp: number; bulbK: number };
const DAY: Pal = {
  cloth: '#F7EFDF', well: '#E6DCC8', dish: '#F4EEE3', hemiSky: '#FFF6E6', hemiGround: '#B9A27F', hemi: 1.6, sun: '#FFF1DA', sunI: 2.0, lamp: 0, bulbK: 0.94,
};
const NIGHT: Pal = {
  cloth: '#F0E3CA', well: '#D9CCB3', dish: '#EDE4D3', hemiSky: '#FFE1BC', hemiGround: '#5A4030', hemi: 1.3, sun: '#FFD9A6', sunI: 1.35, lamp: 16, bulbK: 1,
};

const FONT = 'Figtree, "Noto Sans Bengali", system-ui, sans-serif';
const hexOf = (c: THREE.Color) => '#' + c.getHexString();
const mix = (a: string, b: string, k: number) => hexOf(new THREE.Color(a).lerp(new THREE.Color(b), k));
/** the brand's deep colour, lifted just enough that the wall never reads as black */
function lift(hex: string, minL: number, mul: number) {
  const c = new THREE.Color(hex), h = { h: 0, s: 0, l: 0 };
  c.getHSL(h, THREE.SRGBColorSpace);
  c.setHSL(h.h, h.s, Math.max(minL, h.l * mul), THREE.SRGBColorSpace);
  return hexOf(c);
}
/** the colours of this restaurant's room */
type Look = { deep: string; accent: string; wall: string; halo: string; motif: string; wire: string; cloth: string; check: string; pin: string; well: string };
function lookOf(brand: Brand, dark: boolean, P: Pal): Look {
  const wall = dark ? lift(brand.deep, 0.16, 0.95) : lift(brand.deep, 0.22, 1.1);
  return {
    deep: brand.deep, accent: brand.accent, wall,
    halo: mix(wall, brand.accent, dark ? 0.13 : 0.11),
    motif: mix(wall, brand.accent, 0.38),
    wire: mix(wall, '#000000', 0.45),
    cloth: P.cloth, check: mix(P.cloth, brand.accent, 0.5), pin: mix(P.cloth, brand.deep, 0.55),
    well: P.well,
  };
}

/* ---------- canvas drawings (all flat colours) ---------- */
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function canvasOf(w: number, h: number) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }
function texOf(cv: HTMLCanvasElement, repeat = false) {
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** the big sign on the wall: the restaurant logo, or its initials and name, or khabo's plate mark. Never any other
    logo. Drawn centred in a square canvas; returns how much of the width and height the sign fills */
function drawSign(cv: HTMLCanvasElement, brand: Brand, L: Look, logo: HTMLImageElement | null): [number, number] {
  const c = cv.getContext('2d'); if (!c) return [1, 1];
  const S = cv.width;
  c.clearRect(0, 0, S, S);
  const panel = (w: number, h: number) => {
    const x = (S - w) / 2, y = (S - h) / 2;
    c.fillStyle = L.halo; rr(c, x, y, w, h, 44); c.fill();
    c.strokeStyle = L.accent; c.lineWidth = 10; rr(c, x + 5, y + 5, w - 10, h - 10, 40); c.stroke();
    c.lineWidth = 3; rr(c, x + 24, y + 24, w - 48, h - 48, 26); c.stroke();
    /* a small diamond on each side, like a carved plaque */
    c.fillStyle = L.accent;
    for (const dx of [x + 24, x + w - 24]) { c.beginPath(); c.moveTo(dx, S / 2 - 14); c.lineTo(dx + 14, S / 2); c.lineTo(dx, S / 2 + 14); c.lineTo(dx - 14, S / 2); c.fill(); }
  };
  if (logo) {
    const iw = logo.naturalWidth || 400, ih = logo.naturalHeight || 120, a = iw / ih, pad = 70;
    let lw = S - 40 - pad * 2, lh = lw / a;
    if (lh > S * 0.6) { lh = S * 0.6; lw = lh * a; }
    const w = lw + pad * 2, h = lh + pad * 2;
    panel(w, h);
    c.drawImage(logo, (S - lw) / 2, (S - lh) / 2, lw, lh);
    return [w / S, h / S];
  }
  const name = (brand.name || '').trim(), mono = (brand.mono || '').trim();
  const r = 150;
  let size = 0, nameW = 0;
  if (name) {
    size = 132; c.font = `800 ${size}px ${FONT}`;
    while (size > 48 && c.measureText(name).width > S - 220) { size -= 6; c.font = `800 ${size}px ${FONT}`; }
    nameW = c.measureText(name).width;
  }
  const w = Math.min(S - 40, Math.max(2 * r + 200, nameW + 200));
  const h = 2 * r + 150 + (name ? size * 1.2 + 10 : 0);
  panel(w, h);
  const cx = S / 2, cy = (S - h) / 2 + 75 + r;
  c.fillStyle = L.accent; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
  if (mono) {
    c.fillStyle = L.deep; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${mono.length > 2 ? 104 : 140}px ${FONT}`; c.fillText(mono, cx, cy + 6, r * 1.7);
  } else {
    /* khabo's plate mark: a plate and a dot */
    c.strokeStyle = L.deep; c.lineWidth = 20; c.beginPath(); c.arc(cx, cy, r * 0.58, 0, Math.PI * 2); c.stroke();
    c.fillStyle = L.deep; c.beginPath(); c.arc(cx, cy, r * 0.22, 0, Math.PI * 2); c.fill();
  }
  if (name) {
    c.fillStyle = L.accent; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${size}px ${FONT}`; c.fillText(name, cx, cy + r + 30 + size * 0.55, S - 220);
  }
  return [w / S, h / S];
}
/** the patterned band along the top of the wall (repeats sideways) */
function drawBand(cv: HTMLCanvasElement, L: Look) {
  const c = cv.getContext('2d'); if (!c) return;
  const W = cv.width, H = cv.height;
  c.fillStyle = L.wall; c.fillRect(0, 0, W, H);
  c.fillStyle = L.accent; c.fillRect(0, H - 7, W, 7); c.fillRect(0, 9, W, 3);
  c.fillStyle = L.motif;
  const my = (H + 12) / 2;
  c.beginPath(); c.moveTo(W / 2, my - 15); c.lineTo(W / 2 + 22, my); c.lineTo(W / 2, my + 15); c.lineTo(W / 2 - 22, my); c.fill();
  for (const x of [0, W]) { c.beginPath(); c.arc(x, my, 6, 0, Math.PI * 2); c.fill(); }
  for (const x of [W / 4, W * 3 / 4]) { c.beginPath(); c.arc(x, my, 3.5, 0, Math.PI * 2); c.fill(); }
}
/** the tablecloth on the counter: a check in the restaurant's colours */
function drawCloth(cv: HTMLCanvasElement, L: Look) {
  const c = cv.getContext('2d'); if (!c) return;
  const S = cv.width, q = S / 4;
  c.fillStyle = L.cloth; c.fillRect(0, 0, S, S);
  c.fillStyle = L.check; c.fillRect(q * 1.5, 0, q, S); c.fillRect(0, q * 1.5, S, q);
  c.fillStyle = L.accent; c.fillRect(q * 1.5, q * 1.5, q, q);
  c.fillStyle = L.pin; c.fillRect(q * 0.5 - 2, 0, 4, S); c.fillRect(0, q * 0.5 - 2, S, 4);
}
/** the front of the counter: the deep colour with a hem of little flags and a row of diamonds */
function drawFront(cv: HTMLCanvasElement, L: Look) {
  const c = cv.getContext('2d'); if (!c) return;
  const W = cv.width, H = cv.height;
  c.fillStyle = L.deep; c.fillRect(0, 0, W, H);
  c.fillStyle = L.accent; c.fillRect(0, 0, W, 12);
  for (const x0 of [0, W / 2]) { c.beginPath(); c.moveTo(x0 + 10, 12); c.lineTo(x0 + W / 2 - 10, 12); c.lineTo(x0 + W / 4, 40); c.fill(); }
  c.fillStyle = mix(L.deep, L.accent, 0.45);
  for (const x of [W / 4, W * 3 / 4]) { c.beginPath(); c.moveTo(x, 66); c.lineTo(x + 12, 78); c.lineTo(x, 90); c.lineTo(x - 12, 78); c.fill(); }
  c.fillRect(0, 104, W, 3);
}
/** the plate's middle: a ring of the restaurant's colours, its initials in the centre when it has them */
function drawWell(cv: HTMLCanvasElement, brand: Brand, L: Look) {
  const c = cv.getContext('2d'); if (!c) return;
  const S = cv.width, m = S / 2;
  c.fillStyle = L.well; c.fillRect(0, 0, S, S);
  c.strokeStyle = L.deep; c.lineWidth = 6; c.beginPath(); c.arc(m, m, S * 0.4, 0, Math.PI * 2); c.stroke();
  c.fillStyle = L.accent;
  for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; c.beginPath(); c.arc(m + Math.cos(a) * S * 0.455, m + Math.sin(a) * S * 0.455, 5, 0, Math.PI * 2); c.fill(); }
  const mono = (brand.mono || '').trim();
  if (mono && !brand.logo) {
    c.fillStyle = mix(L.well, L.deep, 0.6); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${mono.length > 2 ? 54 : 70}px ${FONT}`; c.fillText(mono, m, m + 3, S * 0.5);
  }
}
/** the little frame behind the lives */
function drawPill(cv: HTMLCanvasElement, L: Look) {
  const c = cv.getContext('2d'); if (!c) return;
  const W = cv.width, H = cv.height;
  c.clearRect(0, 0, W, H);
  c.fillStyle = L.deep; rr(c, 3, 3, W - 6, H - 6, (H - 6) / 2); c.fill();
  c.strokeStyle = L.accent; c.lineWidth = 5; rr(c, 6, 6, W - 12, H - 12, (H - 12) / 2); c.stroke();
}

/** only a same-site image may be loaded (no other network) */
function sameSite(url: string) {
  try { return new URL(url, location.href).origin === location.origin; } catch { return false; }
}

const WALL_Z = -2.6;        // the restaurant wall behind the counter
const BAND_H = 0.5;         // the patterned band along its top

/* ===================================================================== */
const make: GameFactory = ({ canvas, brand, dark, reduced, onScore, onOver }) => {
  const P = dark ? NIGHT : DAY;
  const L = lookOf(brand, dark, P);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(L.wall);
  const cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);
  scene.add(cam);

  /* lights: warm fill, one sun with a small soft shadow, and warm room lamps in the evening */
  scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemi));
  const sun = new THREE.DirectionalLight(P.sun, P.sunI);
  sun.position.set(-3, 12, 9); sun.target.position.set(0, 0, -1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 9, bottom: -5, near: 1, far: 40 });
  sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  if (P.lamp) {
    const lamp = new THREE.PointLight('#FFC47E', P.lamp, 16, 1.6); lamp.position.set(0, 4.6, 1.2); scene.add(lamp);
    const lamp2 = new THREE.PointLight('#FFD29A', P.lamp * 0.6, 10, 1.6); lamp2.position.set(0, 3, 3.5); scene.add(lamp2);
  }

  /* shared materials */
  const flat = (color: THREE.ColorRepresentation, extra: THREE.MeshLambertMaterialParameters = {}) =>
    new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
  const basic = (p: THREE.MeshBasicMaterialParameters) => new THREE.MeshBasicMaterial(p);
  const vcol = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
  const deepMat = flat(brand.deep), accMat = flat(brand.accent);
  const texs: THREE.Texture[] = [];
  const tex = (cv: HTMLCanvasElement, repeat = false) => { const t = texOf(cv, repeat); texs.push(t); return t; };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o;
  };
  const fGeo = fuchkaGeo(), cGeo = chilliGeo(), bGeo = bowlGeo();

  /* ---------- the restaurant's wall ---------- */
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), basic({ color: L.wall }));
  wall.position.set(0, 30, WALL_Z); scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 20), basic({ color: mix(L.wall, '#000000', 0.3) }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.6, WALL_Z + 8); scene.add(floor);

  /* the patterned band along the top */
  const bandCv = canvasOf(256, 64); drawBand(bandCv, L);
  const bandTex = tex(bandCv, true); bandTex.repeat.set(200 / (BAND_H * 4), 1);
  const band = new THREE.Mesh(new THREE.PlaneGeometry(200, BAND_H), basic({ map: bandTex }));
  scene.add(band);

  /* the big sign: the restaurant's logo (or initials and name) on a slightly lighter plaque */
  const signCv = canvasOf(1024, 1024);
  let signFit = drawSign(signCv, brand, L, null);
  const signTex = tex(signCv);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic({ map: signTex, transparent: true, depthWrite: false }));
  scene.add(sign);
  let alive = true;
  if (brand.logo && sameSite(brand.logo)) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!alive) return;
      signFit = drawSign(signCv, brand, L, img); signTex.needsUpdate = true;
      layoutWall();
      if (!raf) draw();
    };
    img.src = brand.logo;
  }

  /* string lights in the restaurant's colours: small plain bulbs, not glowing */
  const lights = new THREE.Group(); lights.position.z = WALL_Z + 0.3; scene.add(lights);
  {
    const SPAN = 2.4, N = 26, SEG = 12, SAG = 0.32, x0 = -SPAN * N / 2;
    const wp: number[] = [];
    const sagAt = (t: number) => -Math.sin(t * Math.PI) * SAG;
    for (let k = 0; k < N; k++) for (let s = 0; s < SEG; s++) {
      const a = s / SEG, b = (s + 1) / SEG;
      wp.push(x0 + (k + a) * SPAN, sagAt(a), 0, x0 + (k + b) * SPAN, sagAt(b), 0);
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    lights.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: L.wire })));
    const cols = [brand.accent, mix(brand.accent, '#FFFFFF', 0.55), '#FFF3D6'];
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 8, 6), basic({ color: '#ffffff' }), N * 4);
    const caps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 6), basic({ color: L.wire }), N * 4);
    const m = new THREE.Matrix4(), c = new THREE.Color();
    let n = 0;
    for (let k = 0; k < N; k++) for (const t of [0.2, 0.4, 0.6, 0.8]) {
      const x = x0 + (k + t) * SPAN, y = sagAt(t);
      caps.setMatrixAt(n, m.makeTranslation(x, y - 0.04, 0));
      bulbs.setMatrixAt(n, m.makeTranslation(x, y - 0.13, 0));
      bulbs.setColorAt(n, c.set(cols[n % cols.length]).multiplyScalar(P.bulbK));
      n++;
    }
    lights.add(caps, bulbs);
  }

  /* ---------- the counter the plate slides on (a checked tablecloth in the restaurant's colours) ---------- */
  const clothCv = canvasOf(256, 256); drawCloth(clothCv, L);
  const clothTex = tex(clothCv, true); clothTex.repeat.set(80 / 1.1, 1.7 / 1.1);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(80, 1.7), flat('#ffffff', { map: clothTex }));
  top.rotation.x = -Math.PI / 2; top.position.set(0, COUNTER_Y, ITEM_Z); top.receiveShadow = true; scene.add(top);
  const frontCv = canvasOf(256, 128); drawFront(frontCv, L);
  const frontTex = tex(frontCv, true); frontTex.repeat.set(80 / 2.04, 1);
  const frontH = COUNTER_Y + 0.6;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(80, frontH), flat('#ffffff', { map: frontTex }));
  front.position.set(0, COUNTER_Y - frontH / 2, ITEM_Z + 0.85); scene.add(front);
  box(80, 0.06, 0.06, accMat, 0, COUNTER_Y - 0.01, ITEM_Z + 0.86);
  box(80, 0.05, 0.05, deepMat, 0, COUNTER_Y - 0.01, ITEM_Z - 0.86);

  /* ---------- the plate: rim in the restaurant's colours ---------- */
  const plate = new THREE.Group(); scene.add(plate);
  const plateInner = new THREE.Group(); plate.add(plateInner);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(PLATE_R, PLATE_R * 0.7, 0.12, 26), flat(P.dish));
  dish.position.y = 0.06; dish.castShadow = true; plateInner.add(dish);
  const band2 = new THREE.Mesh(new THREE.CylinderGeometry(PLATE_R * 0.93, PLATE_R * 0.8, 0.05, 26, 1, true), flat(brand.deep, { side: THREE.DoubleSide }));
  band2.position.y = 0.05; plateInner.add(band2);
  const wellCv = canvasOf(256, 256); drawWell(wellCv, brand, L);
  const well = new THREE.Mesh(new THREE.CircleGeometry(PLATE_R * 0.74, 26), flat('#ffffff', { map: tex(wellCv) }));
  well.rotation.x = -Math.PI / 2; well.position.y = 0.122; plateInner.add(well);
  const rimMat = flat(brand.accent);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(PLATE_R - 0.03, 0.06, 6, 30), rimMat);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.125; rim.castShadow = true; plateInner.add(rim);
  const rimBase = new THREE.Color(brand.accent), red = new THREE.Color('#E0261B');

  /* ---------- pooled things that move (one draw call per kind) ---------- */
  const fallF = new THREE.InstancedMesh(fGeo, vcol, POOL); fallF.castShadow = true; fallF.frustumCulled = false;
  const fallC = new THREE.InstancedMesh(cGeo, vcol, POOL); fallC.castShadow = true; fallC.frustumCulled = false;
  const fallB = new THREE.InstancedMesh(bGeo, vcol, 2); fallB.castShadow = true; fallB.frustumCulled = false;
  const onPlate = new THREE.InstancedMesh(fGeo, vcol, SLOTS); onPlate.castShadow = true; onPlate.frustumCulled = false;
  const crumbMesh = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.07), flat('#ffffff'), CRUMBS); crumbMesh.frustumCulled = false;
  scene.add(fallF, fallC, fallB, onPlate, crumbMesh);
  const plain = new THREE.Color(1, 1, 1), gold = new THREE.Color(1.25, 1.12, 0.45);
  for (let i = 0; i < POOL; i++) fallF.setColorAt(i, plain);
  for (let i = 0; i < SLOTS; i++) onPlate.setColorAt(i, plain);
  for (let i = 0; i < CRUMBS; i++) crumbMesh.setColorAt(i, plain);

  /* lives: three small fuchka in the top middle of the view (the frame's score sits in the top corners) */
  const livesMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, emissive: dark ? '#6A4A1C' : '#2A1C08' });
  const livesMesh = new THREE.InstancedMesh(fGeo, livesMat, LIVES); livesMesh.frustumCulled = false;
  for (let i = 0; i < LIVES; i++) livesMesh.setColorAt(i, plain);
  cam.add(livesMesh);
  /* a little frame behind them in the restaurant's colours (a bit further back than the icons) */
  const pillCv = canvasOf(256, 80); drawPill(pillCv, L);
  const pill = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic({ map: tex(pillCv), transparent: true, depthWrite: false }));
  cam.add(pill);
  const lost = new THREE.Color(0.22, 0.22, 0.24);
  const lifePop = [0, 0, 0];
  let lifeY = 0, lifeGap = 0, lifeScale = 0.1;

  const items: Item[] = Array.from({ length: POOL }, () => ({ on: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, rx: 0, ry: 0, rz: 0, sx: 0, sy: 0, sz: 0, out: false }));
  const crumbs: Crumb[] = Array.from({ length: CRUMBS }, () => ({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 0, life: 0, s: 1 }));
  const crumbCol: THREE.Color[] = Array.from({ length: CRUMBS }, () => new THREE.Color());
  const slots: Slot[] = Array.from({ length: SLOTS }, () => ({ on: false, t: 0, gold: false }));
  const slotXZ = [[0, 0], ...Array.from({ length: SLOTS - 1 }, (_, k) => { const a = k / (SLOTS - 1) * Math.PI * 2 + 0.3; return [Math.cos(a) * 0.5, Math.sin(a) * 0.42]; })];

  /* ---------- state ---------- */
  type Phase = 'idle' | 'play' | 'end' | 'over';
  let phase: Phase = 'idle';
  let score = 0, lives = LIVES, t = 0, spawnIn = 0, clock = 0, endT = 0;
  let plateX = 0, targetX = 0, plateV = 0, keyL = false, keyR = false;
  let hopY = 0, hopV = 0, bump = 0, flash = 0, shake = 0, wideT = 0, wide = 1, tip = 0;
  let halfW = 4, playHalf = 3.4, topY = 9;
  let raf = 0, last = 0, paused = false, seen = true;

  /* ---------- effects ---------- */
  const burst = (x: number, y: number, z: number, n: number, colors: string[], power = 1) => {
    const count = reduced ? Math.ceil(n / 2) : n;
    for (let k = 0, i = 0; k < count && i < CRUMBS; i++) {
      const c = crumbs[i]; if (c.on) continue;
      c.on = true; c.x = x + rand(-0.2, 0.2); c.y = y; c.z = z + rand(-0.2, 0.2);
      const a = rand(0, Math.PI * 2), sp = rand(0.8, 2.4) * power;
      c.vx = Math.cos(a) * sp; c.vz = Math.sin(a) * sp * 0.6; c.vy = rand(1.6, 3.6) * power;
      c.r = rand(0, 6); c.life = rand(0.45, 0.8); c.s = rand(0.6, 1.3);
      crumbCol[i].set(colors[k % colors.length]);
      k++;
    }
  };
  const CRUMB = ['#DDA042', '#C98A30', '#EBC07A'], CHILLI = ['#D3271C', '#3E7F2C'], TAMARIND = ['#5C2A10', '#B4602F', '#D8D35A'];

  const addToPlate = (isGold: boolean) => {
    let i = slots.findIndex(s => !s.on);
    if (i < 0) {
      /* plate full: they get eaten, crumbs fly, start a new plate */
      slots.forEach(s => { s.on = false; });
      burst(plateX, PLATE_Y + 0.3, ITEM_Z, 12, CRUMB, 1.1);
      i = 0;
    }
    slots[i].on = true; slots[i].t = 0; slots[i].gold = isGold;
  };

  const catchItem = (it: Item) => {
    bump = 1;
    if (it.kind === 2) {
      /* chilli: lose a life, the rim flashes red, the chilli is knocked away */
      lives = Math.max(0, lives - 1);
      lifePop[lives] = 1;
      flash = 1; shake = reduced ? 0 : 1;
      it.out = true; it.vy = 5.5; it.vx = (it.x >= plateX ? 1 : -1) * rand(2.5, 3.5);
      burst(it.x, CATCH_Y, ITEM_Z, 6, CHILLI, 0.8);
      if (lives === 0) { phase = 'end'; endT = 0; slots.forEach(s => { s.on = false; }); burst(plateX, PLATE_Y + 0.3, ITEM_Z, 16, CRUMB, 1.3); }
      return;
    }
    it.on = false;
    if (it.kind === 3) { wideT = WIDE_TIME; burst(it.x, CATCH_Y, ITEM_Z, 10, TAMARIND, 0.9); return; }
    score += it.kind === 1 ? 2 : 1;
    onScore(score);
    addToPlate(it.kind === 1);
    burst(it.x, CATCH_Y, ITEM_Z, it.kind === 1 ? 10 : 6, CRUMB, 0.8);
  };

  const spawn = () => {
    const it = items.find(i => !i.on); if (!it) return;
    const d = Math.min(t, 150);
    const pChilli = Math.min(0.42, 0.13 + d * 0.0042);
    let kind: Kind = Math.random() < pChilli ? 2 : 0;
    if (kind === 0 && Math.random() < 0.08) kind = 1;
    if (kind === 0 && t > 12 && wideT <= 0 && !items.some(o => o.on && o.kind === 3) && Math.random() < 0.035) kind = 3;
    it.on = true; it.kind = kind; it.out = false;
    it.x = rand(-playHalf, playHalf); it.y = topY + 0.8;
    it.vy = -(2.7 + d * 0.045) * rand(0.88, 1.12);
    const drift = t > 18 && Math.random() < Math.min(0.6, (t - 18) * 0.012);
    it.vx = drift ? (Math.random() < 0.5 ? -1 : 1) * rand(0.4, 0.5 + Math.min(1.3, (t - 18) * 0.02)) : 0;
    it.rx = rand(0, 6); it.ry = rand(0, 6); it.rz = rand(0, 6);
    it.sx = rand(-2.5, 2.5); it.sy = rand(-2, 2); it.sz = rand(-2.5, 2.5);
    if (kind === 3) { it.sx *= 0.3; it.sz *= 0.3; it.rx = 0; it.rz = 0; }
  };

  /* ---------- per frame ---------- */
  const step = (dt: number) => {
    clock += dt;
    if (phase === 'play') {
      t += dt;
      const dir = (keyR ? 1 : 0) - (keyL ? 1 : 0);
      if (dir) targetX += dir * 9 * dt;
      spawnIn -= dt;
      if (spawnIn <= 0) { spawn(); const d = Math.min(t, 150); spawnIn = Math.max(0.34, 0.85 - d * 0.0075) * rand(0.75, 1.25); }
    }
    if (phase === 'idle') targetX = 0;

    /* the plate glides after the finger */
    const reach = halfW - PLATE_R * 0.35;
    targetX = clamp(targetX, -reach, reach);
    const prevX = plateX;
    plateX += (targetX - plateX) * damp(18, dt);
    plateV = (plateX - prevX) / Math.max(dt, 1e-4);
    wideT = Math.max(0, wideT - dt);
    wide += ((wideT > 0 ? 1.5 : 1) - wide) * damp(8, dt);
    hopV -= 30 * dt; hopY = Math.max(0, hopY + hopV * dt); if (hopY === 0) hopV = 0;
    bump = Math.max(0, bump - dt * 5); flash = Math.max(0, flash - dt * 2.2); shake = Math.max(0, shake - dt * 3);
    if (phase === 'end' || phase === 'over') tip += (0.3 - tip) * damp(10, dt); else tip += (0 - tip) * damp(10, dt);

    /* falling things */
    const catchR = PLATE_R * wide;
    for (const it of items) {
      if (!it.on) continue;
      const py = it.y;
      it.vy -= (it.out ? 14 : 1.1) * dt;
      it.x += it.vx * dt; it.y += it.vy * dt;
      if (!it.out && Math.abs(it.x) > playHalf) { it.x = Math.sign(it.x) * playHalf; it.vx = -it.vx; }
      it.rx += it.sx * dt; it.ry += it.sy * dt; it.rz += it.sz * dt;
      if (phase === 'play' && !it.out && py >= CATCH_Y && it.y < CATCH_Y) {
        const dx = Math.abs(it.x - plateX), r = it.kind === 2 ? catchR - 0.1 : catchR + 0.15;
        if (dx < r) { catchItem(it); continue; }
      }
      /* hit the counter: break into crumbs */
      if (it.y < COUNTER_Y + 0.2) {
        it.on = false;
        burst(it.x, COUNTER_Y + 0.1, ITEM_Z, it.kind === 2 ? 3 : 5, it.kind === 2 ? CHILLI : it.kind === 3 ? TAMARIND : CRUMB, 0.6);
      }
    }

    /* crumbs */
    for (const c of crumbs) {
      if (!c.on) continue;
      c.life -= dt; if (c.life <= 0) { c.on = false; continue; }
      c.vy -= 12 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.r += dt * 8;
      if (c.y < COUNTER_Y + 0.03) { c.y = COUNTER_Y + 0.03; c.vy *= -0.3; c.vx *= 0.6; c.vz *= 0.6; }
    }
    for (const s of slots) if (s.on) s.t += dt;
    for (let i = 0; i < LIVES; i++) lifePop[i] = Math.max(0, lifePop[i] - dt * 2.5);

    if (phase === 'end') {
      endT += dt;
      if (endT >= END_TIME) { phase = 'over'; onOver(score); }
    }
  };

  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3();
  const draw = () => {
    /* plate */
    const jig = shake > 0 ? Math.sin(clock * 70) * 0.09 * shake : 0;
    plate.position.set(plateX + jig, PLATE_Y + hopY, ITEM_Z);
    const squash = 1 - Math.sin(bump * Math.PI) * 0.12;
    plateInner.scale.set(wide * (2 - squash), squash, wide * (2 - squash));
    plate.rotation.z = (phase === 'play' && !reduced ? clamp(-plateV * 0.012, -0.12, 0.12) : 0) + tip * (plateX > 0 ? -1 : 1);
    rimMat.color.copy(rimBase).lerp(red, flash);

    /* plated fuchka: drop in with a squash and a little bounce */
    let n = 0;
    slots.forEach((s, i) => {
      if (!s.on) return;
      const k = Math.min(1, s.t / 0.16);
      const drop = (1 - k) * 0.6;
      const wob = s.t > 0.16 ? Math.exp(-(s.t - 0.16) * 9) * Math.sin((s.t - 0.16) * 30) : 0;
      const sy = 0.62 * (1 - 0.3 * wob - (k >= 1 && s.t < 0.2 ? 0.25 : 0)), sxz = 0.62 * (1 + 0.18 * wob);
      const [ox, oz] = slotXZ[i];
      v4.set(ox * wide, 0.12 + 0.2 + drop + (i ? 0 : 0.06), oz * wide);
      plate.localToWorld(v4);
      q4.setFromEuler(e4.set(0.15, i * 1.7, plate.rotation.z));
      onPlate.setMatrixAt(n, m4.compose(v4, q4, s4.set(sxz, sy, sxz)));
      onPlate.setColorAt(n, s.gold ? gold : plain);
      n++;
    });
    onPlate.count = n;
    if (onPlate.instanceColor) onPlate.instanceColor.needsUpdate = true;
    onPlate.instanceMatrix.needsUpdate = true;

    /* falling items, packed into their meshes */
    let nf = 0, nc = 0, nb = 0;
    const put = (mesh: THREE.InstancedMesh, i: number, x: number, y: number, rx: number, ry: number, rz: number, s: number) => {
      mesh.setMatrixAt(i, m4.compose(v4.set(x, y, ITEM_Z), q4.setFromEuler(e4.set(rx, ry, rz)), s4.setScalar(s)));
    };
    if (phase === 'idle') {
      /* before the first start: two fuchka gently bobbing over the plate */
      put(fallF, 0, -0.75, 2.5 + Math.sin(clock * 2) * 0.18, 0.3, clock * 0.8, 0.15, 1); fallF.setColorAt(0, plain);
      put(fallF, 1, 0.85, 3.4 + Math.sin(clock * 2 + 1.7) * 0.18, -0.2, -clock * 0.6, -0.2, 1.12); fallF.setColorAt(1, gold);
      nf = 2;
    }
    for (const it of items) {
      if (!it.on) continue;
      if (it.kind === 2) put(fallC, nc++, it.x, it.y, it.rx, it.ry, it.rz, 1.05);
      else if (it.kind === 3) { if (nb < 2) put(fallB, nb++, it.x, it.y, 0.35, it.ry, 0, 1.15); }
      else { put(fallF, nf, it.x, it.y, it.rx, it.ry, it.rz, it.kind === 1 ? 1.15 : 1); fallF.setColorAt(nf, it.kind === 1 ? gold : plain); nf++; }
    }
    fallF.count = nf; fallC.count = nc; fallB.count = nb;
    fallF.instanceMatrix.needsUpdate = fallC.instanceMatrix.needsUpdate = fallB.instanceMatrix.needsUpdate = true;
    if (fallF.instanceColor) fallF.instanceColor.needsUpdate = true;

    /* crumbs */
    let nk = 0;
    crumbs.forEach((c, i) => {
      if (!c.on) return;
      const s = c.s * Math.min(1, c.life * 3);
      crumbMesh.setMatrixAt(nk, m4.compose(v4.set(c.x, c.y, c.z), q4.setFromEuler(e4.set(c.r, c.r * 0.7, 0)), s4.setScalar(s)));
      crumbMesh.setColorAt(nk, crumbCol[i]);
      nk++;
    });
    crumbMesh.count = nk;
    crumbMesh.instanceMatrix.needsUpdate = true;
    if (crumbMesh.instanceColor) crumbMesh.instanceColor.needsUpdate = true;

    /* lives */
    for (let i = 0; i < LIVES; i++) {
      const has = i < lives, pop = lifePop[i];
      const s = lifeScale * (has ? 1 : 0.82) * (1 + Math.sin(pop * Math.PI) * 0.5);
      const bob = has && phase !== 'over' ? Math.sin(clock * 2.4 + i * 0.9) * lifeScale * 0.06 : 0;
      livesMesh.setMatrixAt(i, m4.compose(v4.set((i - 1) * lifeGap, lifeY + bob, -2), q4.setFromEuler(e4.set(0.75, i * 0.8, 0)), s4.setScalar(s)));
      livesMesh.setColorAt(i, has ? plain : lost);
    }
    livesMesh.instanceMatrix.needsUpdate = true;
    if (livesMesh.instanceColor) livesMesh.instanceColor.needsUpdate = true;

    renderer.render(scene, cam);
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    step(dt); draw();
  };
  const run = () => {
    if (raf || !alive || paused || !seen) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

  /* before and after a run, stop drawing when the game is off screen (during a run the frame pauses us) */
  const io = new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (seen) run(); else if (phase !== 'play') stop();
  });
  io.observe(canvas);

  /* ---------- camera framing: fit the play area on tall phones and wide screens ---------- */
  const ray = new THREE.Vector3();
  const worldXAt = (sx: number) => {
    /* where a screen x (0..1) lands at the plate's height on the play plane */
    v4.set(0, PLATE_Y, ITEM_Z).project(cam);
    ray.set(sx * 2 - 1, v4.y, 0.5).unproject(cam).sub(cam.position);
    const k = (ITEM_Z - cam.position.z) / ray.z;
    return cam.position.x + ray.x * k;
  };
  const frameCam = (w: number, h: number) => {
    const aspect = w / h;
    const H = Math.max(8.2, 7.4 / aspect);
    const dist = H / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const cy = -0.25 + H / 2;
    cam.aspect = aspect;
    cam.position.set(0, cy + Math.sin(TILT) * dist, ITEM_Z + Math.cos(TILT) * dist);
    cam.lookAt(0, cy, ITEM_Z);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    halfW = worldXAt(1);
    playHalf = Math.max(1, halfW - 0.55);
    topY = cy + H / 2 + 0.6;
    /* lives: ~24px icons, 30px apart, centred 30px from the top */
    const hh = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * 2;
    const px = (2 * hh) / h;
    lifeScale = (24 * px) / 0.84; lifeGap = 31 * px; lifeY = hh - 30 * px;
    const pk = 2.25 / 2;
    pill.position.set(0, lifeY * pk, -2.25); pill.scale.set(112 * px * pk, 35 * px * pk, 1);
    layoutWall();
  };
  /* where a screen point (-1..1 each way) lands on the wall */
  const onWall = (nx: number, ny: number) => {
    ray.set(nx, ny, 0.5).unproject(cam).sub(cam.position);
    const k = (WALL_Z - cam.position.z) / ray.z;
    return ray.multiplyScalar(k).add(cam.position);
  };
  /* the band at the top, the lights under it, the sign centred in the space between them and the plate */
  const layoutWall = () => {
    if (!cam.position.z) return;
    const wallTop = onWall(0, 1).y;
    const half = Math.abs(onWall(1, 0.2).x);
    v4.set(0, CATCH_Y + 0.6, ITEM_Z).project(cam);
    const low = onWall(0, v4.y).y;
    band.position.set(0, wallTop - BAND_H / 2 + 0.02, WALL_Z + 0.01);
    /* the lights hang below the score boxes, the sign sits under them */
    lights.position.y = wallTop - BAND_H - 1.0;
    const high = lights.position.y - 0.75, room = Math.max(1, high - low);
    const S = Math.min(Math.min(half * 2 * 0.8, 9.5) / signFit[0], room * 0.8 / signFit[1]);
    sign.scale.set(S, S, 1); sign.position.set(0, (high + low) / 2, WALL_Z + 0.02);
  };

  return {
    start() {
      items.forEach(i => { i.on = false; });
      crumbs.forEach(c => { c.on = false; });
      slots.forEach(s => { s.on = false; });
      score = 0; lives = LIVES; t = 0; spawnIn = 0.5; endT = 0;
      targetX = plateX; wideT = 0; flash = 0; shake = 0; bump = 0; tip = 0;
      lifePop.fill(0);
      phase = 'play';
      onScore(0);
      paused = false; run();
    },
    pause() { paused = true; stop(); keyL = keyR = false; },
    resume() { paused = false; run(); },
    resize(w, h) {
      if (w < 2 || h < 2) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      frameCam(w, h);
      draw();
      run();
    },
    input(e) {
      if (e.type === 'move') { if (phase === 'play') targetX = worldXAt(e.x); }
      else if (e.type === 'left') keyL = e.down;
      else if (e.type === 'right') keyR = e.down;
      else if (e.type === 'press' && phase === 'play' && hopY === 0) hopV = 3.2;
    },
    destroy() {
      alive = false; stop(); io.disconnect();
      const mats = new Set<THREE.Material>(), geos = new Set<THREE.BufferGeometry>();
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.geometry) geos.add(m.geometry);
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => mats.add(x));
        if (o instanceof THREE.InstancedMesh) o.dispose();
      });
      geos.forEach(g => g.dispose()); mats.forEach(x => x.dispose());
      texs.forEach(x => x.dispose());
      renderer.dispose();
    },
  };
};

export default make;
