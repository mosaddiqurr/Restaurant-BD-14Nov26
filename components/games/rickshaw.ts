/* Rickshaw Run: an endless runner on a Dhaka street. Tap to jump over potholes, puddles, cones, a lying cow and
   CNGs and buses coming the other way. It gets faster the longer you go. Score = metres, plus 10 for each fuchka.

   Everything is built from simple shapes in code (no image files except the restaurant's own logo, painted on
   its boundary wall and billboard). Static parts are merged into a few big meshes with vertex colours, so the whole street is only a
   few dozen draw calls. Moving scenery is made of strips that repeat, slid along and wrapped. */
import * as THREE from 'three';
import type { Brand, GameFactory } from './types';

type Kind = 'lam' | 'two' | 'flat' | 'sky' | 'edge';
type Rnd = () => number;
type Col = THREE.ColorRepresentation;

const DEG = Math.PI / 180;
const FOV = 36, YAW = 15 * DEG, PITCH = 11 * DEG;
const LANE = 0.6;                       // z of the lane the rickshaw rides in
const JUMP = 10.2, GRAV = 30;           // jump speed and gravity (m/s, m/s²)
const R = 0.42;                         // rickshaw wheel radius
const FRONT = 1.05, REAR = -0.55;       // wheel x positions
const HIT0 = -0.7, HIT1 = 1.15;         // rickshaw hit box along x (a little forgiving)

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const seeded = (seed: number): Rnd => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const pick = <T,>(a: T[], r: Rnd) => a[Math.floor(r() * a.length) % a.length];

/* ---------- palettes ---------- */
type Pal = {
  sky: string; disc: string; hemiSky: string; hemiGround: string; hemiI: number; dirC: string; dirI: number;
  road: string; patch: string; path: string; ground: string; dash: string; curbA: string; curbB: string;
  bld: string[]; win: string[]; lit: string[]; litP: number; lamp: string; tree: string[]; dust: string;
  cloud: string; night: boolean;
};
/* bright clear daytime */
const DAY: Pal = {
  sky: '#BFE0F2', disc: '#FFF6DC', hemiSky: '#FFFFFF', hemiGround: '#B8A88E', hemiI: 2.1, dirC: '#FFF0D8', dirI: 2.9,
  road: '#6A6970', patch: '#5C5B62', path: '#D3C6B0', ground: '#B9AB95', dash: '#FFFFFF', curbA: '#F2C230', curbB: '#2C2C2E',
  bld: ['#F1E1C4', '#EBC9AA', '#D6E0CB', '#F0D3C6', '#CAD8DF', '#E8D9AB', '#DDD1C2', '#F4EBDC', '#E6BB9E'],
  win: ['#6E8296', '#7F98AC', '#5B6B7C', '#8EA2B2'], lit: ['#D8B88E', '#C9A07E'], litP: 0.1, lamp: '#ECE8DE',
  tree: ['#5E9C3E', '#4C8A36', '#74B04C'], dust: '#DCCDB0', cloud: '#FFFFFF', night: false,
};
/* dark mode: warm early evening, the sun just down, lamps and windows coming on. Not a black night */
const DUSK: Pal = {
  sky: '#EDA98A', disc: '#FFE2AE', hemiSky: '#FFE8D6', hemiGround: '#8A7272', hemiI: 2.25, dirC: '#FFCB9E', dirI: 2.5,
  road: '#68646E', patch: '#5B5862', path: '#C4AF9C', ground: '#A48F80', dash: '#FFF1DC', curbA: '#F0BA32', curbB: '#2A2A2E',
  bld: ['#E6C0AC', '#D6B0B0', '#C8C2BC', '#E8C6A2', '#C6B6C6', '#DDBA98', '#D4BEB0', '#EBD0B8'],
  win: ['#5E6278', '#6A6C84', '#57596E'], lit: ['#FFD27A', '#FFE09C', '#FFC45E', '#FFE7B4'], litP: 0.5, lamp: '#FFEBB8',
  tree: ['#4E7E3E', '#436F36', '#5A8C46'], dust: '#C7B3A2', cloud: '#F6C7AA', night: true,
};
const ART = { red: '#B3202A', gold: '#E3A33A', green: '#1F7A4A', blue: '#2456A6', cream: '#FBF3E0' };

/* ---------- geometry kit: add simple shapes with a colour and a transform, get back one merged mesh per material ---------- */
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const T = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
const UP = new THREE.Vector3(0, 1, 0);
/* a unit cylinder stretched from a to b */
const rod = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
  const d = b.clone().sub(a), len = d.length();
  return new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new THREE.Vector3(r * 2, len, r * 2));
};
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const prepped = new WeakMap<THREE.BufferGeometry, { p: ArrayLike<number>; n: ArrayLike<number> }>();
const prep = (g: THREE.BufferGeometry) => {
  let r = prepped.get(g);
  if (!r) {
    const ni = g.index ? g.toNonIndexed() : g;
    if (!ni.attributes.normal) ni.computeVertexNormals();
    r = { p: (ni.attributes.position.array as Float32Array).slice(), n: (ni.attributes.normal.array as Float32Array).slice() };
    if (ni !== g) ni.dispose();
    prepped.set(g, r);
  }
  return r;
};

class Kit {
  private d: Record<Kind, { p: number[]; n: number[]; c: number[] }> = { lam: { p: [], n: [], c: [] }, two: { p: [], n: [], c: [] }, flat: { p: [], n: [], c: [] }, sky: { p: [], n: [], c: [] }, edge: { p: [], n: [], c: [] } };
  private c = new THREE.Color(); private v = new THREE.Vector3(); private nm = new THREE.Matrix3();
  add(g: THREE.BufferGeometry, color: Col, m: THREE.Matrix4, kind: Kind = 'lam') {
    const src = prep(g), out = this.d[kind];
    this.c.set(color); this.nm.getNormalMatrix(m);
    for (let i = 0; i < src.p.length; i += 3) {
      this.v.set(src.p[i], src.p[i + 1], src.p[i + 2]).applyMatrix4(m); out.p.push(this.v.x, this.v.y, this.v.z);
      this.v.set(src.n[i], src.n[i + 1], src.n[i + 2]).applyMatrix3(this.nm).normalize(); out.n.push(this.v.x, this.v.y, this.v.z);
      out.c.push(this.c.r, this.c.g, this.c.b);
    }
    return this;
  }
  /** flags: 1 = casts shadow, 2 = gets shadow. `mat` swaps in one material for every kind (light pools) */
  build(mats: Record<Kind, THREE.Material>, flags = 0, mat?: THREE.Material) {
    const g = new THREE.Group();
    (Object.keys(this.d) as Kind[]).forEach(k => {
      const d = this.d[k]; if (!d.p.length) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(d.p, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(d.n, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(d.c, 3));
      geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, mat || mats[k]);
      m.castShadow = !!(flags & 1); m.receiveShadow = !!(flags & 2);
      g.add(m);
    });
    return g;
  }
}

/* ---------- canvas pictures (billboards, rickshaw art) ---------- */
const canvas2d = (w: number, h: number) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return { c, x: c.getContext('2d') as CanvasRenderingContext2D };
};
const flower = (x: CanvasRenderingContext2D, cx: number, cy: number, r: number, petal: string, mid: string) => {
  x.fillStyle = petal;
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    x.beginPath(); x.ellipse(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.45, r * 0.3, a, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = mid; x.beginPath(); x.arc(cx, cy, r * 0.32, 0, Math.PI * 2); x.fill();
};
/* side panel of the passenger seat, rickshaw-art style */
const sideArt = () => {
  const { c, x } = canvas2d(256, 112);
  x.fillStyle = ART.red; x.fillRect(0, 0, 256, 112);
  x.strokeStyle = ART.gold; x.lineWidth = 10; x.strokeRect(5, 5, 246, 102);
  x.fillStyle = ART.green;
  for (const [ex, ey, a] of [[64, 72, -0.6], [96, 74, 0.6], [160, 72, -0.6], [192, 74, 0.6]]) { x.beginPath(); x.ellipse(ex, ey, 16, 7, a, 0, Math.PI * 2); x.fill(); }
  flower(x, 80, 52, 30, ART.cream, ART.gold);
  flower(x, 176, 52, 30, ART.cream, ART.blue);
  x.fillStyle = ART.gold; for (const dx of [28, 128, 228]) { x.beginPath(); x.arc(dx, 56, 7, 0, Math.PI * 2); x.fill(); }
  return c;
};
/* a plain food poster: a plate of fuchka on marigold, no words */
const posterArt = () => {
  const { c, x } = canvas2d(512, 256);
  x.fillStyle = ART.gold; x.fillRect(0, 0, 512, 256);
  x.fillStyle = ART.red; x.beginPath(); x.arc(392, 128, 150, 0, Math.PI * 2); x.fill();
  x.fillStyle = ART.green; x.fillRect(0, 220, 512, 36);
  x.fillStyle = ART.cream; x.beginPath(); x.ellipse(200, 150, 150, 52, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#E2D6BE'; x.beginPath(); x.ellipse(200, 150, 112, 34, 0, 0, Math.PI * 2); x.fill();
  const balls: [number, number][] = [[140, 128], [200, 120], [260, 128], [170, 104], [230, 104], [200, 86]];
  for (const [bx, by] of balls) {
    x.fillStyle = '#C98A3A'; x.beginPath(); x.arc(bx, by, 26, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#E2A94E'; x.beginPath(); x.arc(bx - 6, by - 6, 15, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#6B3A1A'; x.beginPath(); x.ellipse(bx, by - 14, 9, 4, 0, 0, Math.PI * 2); x.fill();
  }
  flower(x, 420, 70, 34, ART.cream, ART.blue);
  return c;
};
const roundRect = (x: CanvasRenderingContext2D, l: number, t: number, w: number, h: number, r: number) => {
  x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
};
/* the brand board: the restaurant's initials (or khabo's plate mark) on its own colours. The logo is drawn on later */
const brandArt = (b: Brand) => {
  const { c, x } = canvas2d(512, 256);
  x.fillStyle = b.deep; x.fillRect(0, 0, 512, 256);
  x.fillStyle = b.accent; x.fillRect(0, 232, 512, 24);
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  if (b.mono) {
    x.fillStyle = b.accent; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `800 ${b.name ? 128 : 150}px ${font}`;
    x.fillText(b.mono, 256, b.name ? 100 : 118, 440);
    if (b.name) { x.fillStyle = '#FBF3E0'; x.font = `700 34px ${font}`; x.fillText(b.name, 256, 192, 440); }
  } else {
    x.strokeStyle = '#FBF3E0'; x.lineWidth = 14; x.beginPath(); x.arc(256, 116, 78, 0, Math.PI * 2); x.stroke();
    x.fillStyle = b.accent; x.beginPath(); x.arc(256, 116, 44, 0, Math.PI * 2); x.fill();
  }
  return c;
};
const logoOnto = (cv: HTMLCanvasElement, b: Brand, img: HTMLImageElement) => {
  const x = cv.getContext('2d'); if (!x) return;
  x.fillStyle = b.deep; x.fillRect(0, 0, 512, 256);
  x.fillStyle = b.accent; x.fillRect(0, 232, 512, 24);
  x.fillStyle = '#FBF3E0'; roundRect(x, 28, 22, 456, 192, 26); x.fill();
  const iw = img.naturalWidth || 300, ih = img.naturalHeight || 150;
  const s = Math.min(400 / iw, 160 / ih), w = iw * s, h = ih * s;
  x.drawImage(img, 256 - w / 2, 118 - h / 2, w, h);
};

/* ---------- obstacles ---------- */
type ObKind = 'pothole' | 'puddle' | 'cone' | 'cng' | 'bus' | 'cow';
type Ob = { kind: ObKind; g: THREE.Group; x: number; len: number; h: number; hole: boolean; extra: number; live: boolean };
const OB: Record<ObKind, { len: number; h: number; hole: boolean }> = {
  pothole: { len: 1.4, h: 0, hole: true },
  puddle: { len: 1.9, h: 0, hole: true },
  cone: { len: 0.5, h: 0.68, hole: false },
  cng: { len: 2.2, h: 1.2, hole: false },
  bus: { len: 2.7, h: 1.2, hole: false },
  cow: { len: 1.7, h: 0.74, hole: false },
};

const make: GameFactory = (o) => {
  const { canvas, brand, dark, reduced } = o;
  const P = dark ? DUSK : DAY;
  let dead = false;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const skyC = new THREE.Color(P.sky).lerp(new THREE.Color(brand.accent), 0.05);
  scene.background = skyC;
  const fog = new THREE.Fog(skyC.clone(), 40, 190);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 520);

  scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI));
  const sun = new THREE.DirectionalLight(P.dirC, P.dirI);
  sun.position.set(9, 14, 10); sun.target.position.set(3, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera; sc.left = -12; sc.right = 12; sc.top = 10; sc.bottom = -10; sc.near = 2; sc.far = 45;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const M: Record<Kind, THREE.Material> = {
    lam: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
    two: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }),
    flat: new THREE.MeshBasicMaterial({ vertexColors: true }),
    sky: new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }),
    /* outlines: a slightly bigger copy seen from the inside, so a solid dark edge shows around the shape */
    edge: new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }),
  };
  const textures: THREE.Texture[] = [];
  const tex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; textures.push(t); return t;
  };

  /* shared unit shapes, only used while building (freed at the end of setup) */
  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
    wire: new THREE.CylinderGeometry(0.5, 0.5, 1, 4, 1, true),
    cone: new THREE.ConeGeometry(0.5, 1, 10),
    ball: new THREE.IcosahedronGeometry(0.5, 1),
    rock: new THREE.IcosahedronGeometry(0.5, 0),
    disc: new THREE.CircleGeometry(0.5, 22).rotateX(-Math.PI / 2),
    circle: new THREE.CircleGeometry(0.5, 32),
    plane: new THREE.PlaneGeometry(1, 1),
  };
  const temp: THREE.BufferGeometry[] = [];
  const once = <T extends THREE.BufferGeometry>(g: T) => { temp.push(g); return g; };

  /* ---------- street: the parts that never move ---------- */
  const base = new Kit();
  base.add(G.box, P.road, T(0, -0.1, 0, 0, 0, 0, 700, 0.2, 4.8));
  base.add(G.box, P.path, T(0, 0.09, -5.05, 0, 0, 0, 700, 0.18, 5.3));
  base.add(G.box, P.path, T(0, 0.09, 4.7, 0, 0, 0, 700, 0.18, 4.6));
  base.add(G.box, P.ground, T(0, -0.04, -45, 0, 0, 0, 900, 0.08, 70));
  base.add(G.box, P.dash, T(0, 0.006, 2.05, 0, 0, 0, 700, 0.012, 0.09));
  base.add(G.box, P.dash, T(0, 0.006, -2.05, 0, 0, 0, 700, 0.012, 0.09));
  scene.add(base.build(M, 2));

  /* strips repeat every `period` metres and slide at `f` times the road speed, so far things move slower */
  const strips: { g: THREE.Group; period: number; f: number }[] = [];
  const strip = (period: number, f: number, from: number, to: number, seed: number, fill: (k: Kit, x0: number, r: Rnd) => void, flags = 0) => {
    const kit = new Kit();
    for (let k = Math.floor(from / period); k * period < to; k++) fill(kit, k * period, seeded(seed));
    const g = kit.build(M, flags); scene.add(g); strips.push({ g, period, f }); return g;
  };

  /* lane dashes and old road patches */
  strip(24, 1, -60, 130, 3, (k, x0) => {
    for (let i = 0; i < 6; i++) k.add(G.box, P.dash, T(x0 + i * 4, 0.006, -0.35, 0, 0, 0, 2.1, 0.012, 0.14));
    k.add(G.box, P.patch, T(x0 + 7, 0.003, 1.1, 0, 0, 0, 3.2, 0.006, 1.3));
    k.add(G.box, P.patch, T(x0 + 17.5, 0.003, -1.35, 0, 0.05, 0, 2.2, 0.006, 0.9));
  }, 2);
  /* painted kerbs, one block yellow, one black */
  strip(2, 1, -60, 130, 4, (k, x0) => {
    for (const z of [-2.42, 2.42]) {
      k.add(G.box, P.curbA, T(x0 + 0.5, 0.11, z, 0, 0, 0, 0.98, 0.22, 0.26));
      k.add(G.box, P.curbB, T(x0 + 1.5, 0.11, z, 0, 0, 0, 0.98, 0.22, 0.26));
    }
  }, 2);

  /* buildings in three rows. The front row has shops with awnings and signs */
  type Row = { z: number; depth: number; period: number; f: number; h: [number, number]; w: [number, number]; from: number; to: number; shops: boolean; win: [number, number]; seed: number };
  const rows: Row[] = [
    { z: -36, depth: 6, period: 160, f: 0.45, h: [14, 34], w: [6, 12], from: -150, to: 240, shops: false, win: [0.62, 0.72], seed: 31 },
    { z: -20, depth: 6, period: 120, f: 0.72, h: [10, 24], w: [5, 9], from: -95, to: 165, shops: false, win: [0.72, 0.85], seed: 21 },
    { z: -10.2, depth: 5, period: 84, f: 1, h: [7, 16], w: [4.5, 7.5], from: -60, to: 120, shops: true, win: [0.78, 0.95], seed: 11 },
  ];
  /* the restaurant's own colours show up on the shop awnings and signs too */
  const awnings = [ART.red, ART.green, ART.blue, ART.gold, '#7A3E8C', '#D9612E', brand.accent, brand.deep, brand.accent];
  const signs = [ART.gold, ART.blue, ART.green, ART.red, '#F4EDE0', '#2E9C8E', brand.accent];
  for (const L of rows) {
    strip(L.period, L.f, L.from, L.to, L.seed, (k, x0, r) => {
      let x = 0;
      while (x < L.period - 2) {
        let w = lerp(L.w[0], L.w[1], r());
        if (x + w > L.period - 0.2) w = L.period - 0.2 - x;
        const gap = 0.15 + r() * 0.5;
        const h = lerp(L.h[0], L.h[1], r() * 0.6 + r() * 0.4);
        const d = L.depth * (0.85 + r() * 0.15);
        const cx = x0 + x + w / 2, front = L.z + d / 2;
        const col = new THREE.Color(pick(P.bld, r)).multiplyScalar(0.92 + r() * 0.12);
        const trim = col.clone().multiplyScalar(0.8);
        k.add(G.box, col, T(cx, h / 2, L.z, 0, 0, 0, w, h, d));
        k.add(G.box, trim, T(cx, h + 0.2, L.z, 0, 0, 0, w + 0.12, 0.4, d + 0.12));
        if (r() < 0.75) k.add(G.cyl, '#242426', T(cx + (r() - 0.5) * w * 0.5, h + 0.75, L.z - d * 0.2, 0, 0, 0, 1.0, 1.1, 1.0));
        const ledges = r() < 0.55;
        const y0 = L.shops ? 4.3 : 2.0, fh = L.shops ? 1.8 : 1.7;
        const n = Math.max(1, Math.floor((w - 0.6) / 1.45)), sp = w / n;
        const ww = Math.min(L.win[0], sp * 0.55), wh = L.win[1];
        for (let fy = y0; fy < h - 0.9; fy += fh) {
          if (ledges) k.add(G.box, trim, T(cx, fy - wh / 2 - 0.22, front + 0.2, 0, 0, 0, w + 0.1, 0.12, 0.42));
          for (let i = 0; i < n; i++) {
            const lit = r() < P.litP;
            k.add(G.plane, lit ? pick(P.lit, r) : pick(P.win, r), T(cx - w / 2 + sp * (i + 0.5), fy, front + 0.02, 0, 0, 0, ww, wh, 1), 'flat');
            if (L.shops && r() < 0.12) k.add(G.box, '#E7E4DC', T(cx - w / 2 + sp * (i + 0.5), fy - wh / 2 - 0.08, front + 0.14, 0, 0, 0, 0.5, 0.3, 0.26));
          }
        }
        if (L.shops) {
          k.add(G.box, pick(['#8E9196', '#A7A9AC', '#6F7D8A', '#9B8C7A'], r), T(cx, 1.25, front + 0.05, 0, 0, 0, w - 0.5, 2.5, 0.1));
          k.add(G.box, pick(awnings, r), T(cx, 2.78, front + 0.52, 0.32, 0, 0, w - 0.3, 0.08, 1.15));
          k.add(G.box, pick(signs, r), T(cx, 3.4, front + 0.06, 0, 0, 0, w * 0.72, 0.62, 0.08), 'flat');
        }
        x += w + gap;
      }
    });
  }

  /* electric poles with sagging wires, street lamps, trees */
  const POLE_Z = -3.4;
  strip(36, 1, -60, 130, 5, (k, x0) => {
    for (let i = 0; i < 3; i++) {
      const px = x0 + i * 12;
      k.add(G.box, '#9A968E', T(px, 3.6, POLE_Z, 0, 0, 0, 0.22, 7.2, 0.22));
      k.add(G.box, '#7D7A74', T(px, 6.7, POLE_Z, 0, 0, 0, 0.12, 0.12, 1.4));
      k.add(G.box, '#5C5A56', T(px, 6.0, POLE_Z + 0.85, 0, 0, 0, 0.08, 0.08, 1.7));
      k.add(G.box, P.lamp, T(px, 5.92, POLE_Z + 1.65, 0, 0, 0, 0.42, 0.12, 0.26), 'flat');
      k.add(G.box, '#3A3A3C', T(px, 4.6, POLE_Z + 0.13, 0, 0, 0, 0.3, 0.4, 0.06));
      /* wires to the next pole: a few straight ones from the crossbar and two loose low ones */
      const wires: [number, number, number][] = [[6.75, -0.55, 0.45], [6.75, -0.18, 0.55], [6.75, 0.2, 0.5], [6.75, 0.55, 0.6], [5.7, -0.1, 1.05], [5.5, 0.12, 1.3]];
      for (const [wy, wz, sag] of wires) {
        let prev = v3(px, wy, POLE_Z + wz);
        for (let s = 1; s <= 8; s++) {
          const t = s / 8, nx = v3(px + 12 * t, wy - sag * 4 * t * (1 - t), POLE_Z + wz);
          k.add(G.wire, '#26262A', rod(prev, nx, 0.022));
          prev = nx;
        }
      }
    }
    /* trees on the footpath */
    for (const [tx, s] of [[5.5, 1], [28.5, 0.85]] as [number, number][]) {
      const bx = x0 + tx, z = -5.0;
      k.add(G.box, '#6B4A2E', T(bx, 1.4 * s, z, 0, 0, 0, 0.26, 2.8 * s, 0.26));
      k.add(G.rock, P.tree[0], T(bx, 3.6 * s, z, 0.3, 0.2, 0, 2.6 * s, 2.0 * s, 2.4 * s));
      k.add(G.rock, P.tree[1], T(bx - 0.8 * s, 3.0 * s, z + 0.3, 0.8, 0.4, 0, 1.8 * s, 1.5 * s, 1.7 * s));
      k.add(G.rock, P.tree[2], T(bx + 0.7 * s, 4.3 * s, z - 0.2, 0.1, 0.9, 0, 1.7 * s, 1.4 * s, 1.6 * s));
    }
  }, 2);

  /* pools of lamp light on the street at dusk: flat see-through discs, no glow */
  const poolMat = new THREE.MeshBasicMaterial({ color: '#FFC46B', transparent: true, opacity: 0.12, depthWrite: false });
  if (P.night) {
    const kit = new Kit();
    for (let k = -2; k * 36 < 130; k++) for (let i = 0; i < 3; i++) kit.add(G.disc, '#ffffff', T(k * 36 + i * 12, 0.03, -1.3, 0, 0, 0, 4.2, 1, 3.6), 'flat');
    const g = kit.build(M, 0, poolMat); g.renderOrder = 1; scene.add(g); strips.push({ g, period: 36, f: 1 });
  }

  /* the restaurant's own street: a long boundary wall in its colours carrying its logo (or initials) big and often,
     a billboard with the same logo, and one plain food poster. Every logo is the same texture, and all the logo
     panels are one merged mesh, so this costs only a few draw calls */
  const BB_P = 70, BB_Z = -6.1, WALL_Z = -6.75, WALL_H = 3.2, WALL_F = WALL_Z + 0.15;
  const bbGroup = new THREE.Group(); scene.add(bbGroup); strips.push({ g: bbGroup, period: BB_P, f: 1 });
  const brandCanvas = brandArt(brand), brandTex = tex(brandCanvas), posterTex = tex(posterArt());
  const brandMat = new THREE.MeshBasicMaterial({ map: brandTex });
  const posterMat = new THREE.MeshBasicMaterial({ map: posterTex, color: P.night ? '#F4EEE6' : '#ffffff' });
  /* many flat 2:1 picture panels in one geometry: [x, y, z, width] */
  const panels = (list: [number, number, number, number][]) => {
    const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
    list.forEach(([x, y, z, w], i) => {
      const hw = w / 2, hh = w / 4;
      pos.push(x - hw, y - hh, z, x + hw, y - hh, z, x + hw, y + hh, z, x - hw, y + hh, z);
      nor.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeBoundingSphere();
    return g;
  };
  {
    const kit = new Kit(), logos: [number, number, number, number][] = [], posters: [number, number, number, number][] = [];
    const deep = brand.deep, acc = brand.accent;
    for (let k = -1; k * BB_P < 120; k++) {
      const x0 = k * BB_P;
      /* the wall from x0+2 to x0+46, with piers between the logos */
      const w0 = x0 + 2, w1 = x0 + 46, len = w1 - w0, mid = (w0 + w1) / 2;
      kit.add(G.box, deep, T(mid, WALL_H / 2, WALL_Z, 0, 0, 0, len, WALL_H, 0.3));
      kit.add(G.box, acc, T(mid, WALL_H + 0.08, WALL_Z, 0, 0, 0, len + 0.1, 0.16, 0.42));
      kit.add(G.box, acc, T(mid, 0.42, WALL_F + 0.02, 0, 0, 0, len, 0.1, 0.06));
      for (const px of [w0, x0 + 7.5, x0 + 20, x0 + 33, x0 + 41, w1]) {
        kit.add(G.box, deep, T(px, (WALL_H + 0.3) / 2, WALL_Z, 0, 0, 0, 0.55, WALL_H + 0.3, 0.5));
        kit.add(G.box, acc, T(px, WALL_H + 0.36, WALL_Z, 0, 0, 0, 0.66, 0.14, 0.62));
      }
      for (const lx of [x0 + 13.5, x0 + 26.5, x0 + 37]) {
        kit.add(G.box, acc, T(lx, 1.75, WALL_F + 0.03, 0, 0, 0, 4.7, 2.5, 0.06));
        logos.push([lx, 1.75, WALL_F + 0.07, 4.4]);
      }
      /* billboards: the brand one in front of the wall, the poster over the shops */
      for (const [bx, own] of [[x0 + 7, true], [x0 + 57, false]] as [number, boolean][]) {
        for (const lx of [-1.4, 1.4]) kit.add(G.box, '#6A6C72', T(bx + lx, 1.95, BB_Z, 0, 0, 0, 0.16, 3.9, 0.16));
        kit.add(G.box, own ? deep : '#2B2B2E', T(bx, 4.78, BB_Z, 0, 0, 0, 4.7, 2.55, 0.22));
        kit.add(G.box, own ? acc : ART.gold, T(bx, 3.44, BB_Z, 0, 0, 0, 4.7, 0.12, 0.26));
        kit.add(G.box, '#7A7C80', T(bx, 3.48, BB_Z + 0.32, 0, 0, 0, 4.4, 0.07, 0.5));
        (own ? logos : posters).push([bx, 4.8, BB_Z + 0.12, 4.3]);
      }
    }
    bbGroup.add(kit.build(M, 2));
    bbGroup.add(new THREE.Mesh(panels(logos), brandMat), new THREE.Mesh(panels(posters), posterMat));
  }
  if (brand.logo) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { if (dead) return; logoOnto(brandCanvas, brand, img); brandTex.needsUpdate = true; if (!running) draw(); };
    img.src = brand.logo;
  }

  /* sky: the sun (low and big at dusk) and a few flat clouds */
  {
    const kit = new Kit();
    kit.add(G.circle, P.disc, P.night ? T(-30, 20, -190, 0, 0, 0, 26) : T(-10, 34, -190, 0, 0, 0, 20), 'sky');
    scene.add(kit.build(M));
    strip(260, 0.03, -260, 360, 9, (k, x0, r) => {
      for (let i = 0; i < 5; i++) {
        const cx = x0 + i * 52 + r() * 20, cy = 34 + r() * 26;
        for (let j = 0; j < 3; j++) k.add(G.rock, P.cloud, T(cx + j * 6 - 6, cy + (j === 1 ? 2 : 0), -180, 0, r(), 0, 14 - Math.abs(j - 1) * 4, 3.2, 3), 'sky');
      }
    });
  }

  /* ---------- the rickshaw ---------- */
  const rick = new THREE.Group();          // moves up and down
  const tip = new THREE.Group();           // turns around the front wheel when it crashes, squashes on landing
  const body = new THREE.Group();
  tip.position.x = FRONT; body.position.x = -FRONT;
  rick.position.z = LANE;
  rick.add(tip); tip.add(body); scene.add(rick);

  const wheelProto = (() => {
    const k = new Kit();
    k.add(once(new THREE.TorusGeometry(R - 0.03, 0.045, 5, 24)), '#1D1D1F', T());
    k.add(once(new THREE.TorusGeometry(R - 0.09, 0.02, 4, 24)), ART.gold, T());
    k.add(G.cyl, ART.red, T(0, 0, 0, Math.PI / 2, 0, 0, 0.13, 0.12, 0.13));
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, z = i % 2 ? 0.025 : -0.025;
      k.add(G.wire, '#C9CBCF', rod(v3(0, 0, z), v3(Math.cos(a) * (R - 0.09), Math.sin(a) * (R - 0.09), 0), 0.009));
    }
    return k.build(M, 1);
  })();
  const wheels = [v3(FRONT, R, 0), v3(REAR, R, 0.58), v3(REAR, R, -0.58)].map(p => {
    const w = wheelProto.clone(); w.position.copy(p); body.add(w); return w;
  });

  const CRANK = v3(0.42, 0.4, 0), HIP = v3(0.4, 1.14, 0), L1 = 0.44, L2 = 0.47;
  {
    const k = new Kit(), frame = '#2A2A2D';
    /* bicycle frame */
    k.add(G.cyl, frame, rod(v3(FRONT, R, 0), v3(0.97, 1.2, 0), 0.03));
    k.add(G.cyl, frame, rod(v3(0.97, 1.0, 0), v3(0.42, 1.06, 0), 0.03));
    k.add(G.cyl, frame, rod(v3(0.97, 0.95, 0), CRANK, 0.03));
    k.add(G.cyl, frame, rod(v3(0.42, 1.1, 0), CRANK, 0.03));
    k.add(G.cyl, frame, rod(CRANK, v3(REAR, R, 0), 0.03));
    k.add(G.cyl, frame, rod(v3(REAR, R, -0.6), v3(REAR, R, 0.6), 0.03));
    k.add(G.cyl, frame, rod(v3(0.97, 1.22, -0.3), v3(0.97, 1.22, 0.3), 0.025));
    k.add(G.box, '#3A2A20', T(0.42, 1.12, 0, 0, 0, 0, 0.26, 0.07, 0.16));
    k.add(once(new THREE.TorusGeometry(R + 0.06, 0.03, 4, 12, Math.PI * 0.75)), ART.green, T(FRONT, R, 0, 0, 0, Math.PI * 0.12));
    for (const z of [0.58, -0.58]) k.add(once(new THREE.TorusGeometry(R + 0.06, 0.04, 4, 12, Math.PI * 0.8)), ART.green, T(REAR, R, z, 0, 0, Math.PI * 0.1));
    /* tassels hanging from the handlebar */
    for (const z of [-0.28, -0.14, 0.14, 0.28]) k.add(G.box, z > 0 ? ART.gold : ART.red, T(0.99, 1.1, z, 0, 0, 0, 0.04, 0.16, 0.04));
    k.add(G.box, '#FFE7A8', T(1.02, 1.0, 0, 0, 0, 0, 0.08, 0.1, 0.12), 'flat');
    /* passenger seat */
    k.add(G.box, '#5A3A22', T(0.04, 0.5, 0, 0, 0, 0, 0.42, 0.05, 0.86));
    k.add(G.cyl, frame, rod(v3(0.05, 0.5, 0), CRANK, 0.025));
    k.add(G.box, brand.deep, T(-0.55, 0.77, 0, 0, 0, 0, 0.82, 0.34, 0.84));
    k.add(G.box, ART.gold, T(-0.55, 0.95, 0, 0, 0, 0, 0.86, 0.04, 0.88));
    k.add(G.box, ART.red, T(-0.56, 1.03, 0, 0, 0, 0, 0.76, 0.12, 0.8));
    k.add(G.box, brand.deep, T(-0.94, 1.28, 0, 0, 0, 0, 0.1, 0.52, 0.8));
    k.add(G.box, brand.accent, T(-0.94, 1.56, 0, 0, 0, 0, 0.12, 0.05, 0.82));
    /* rider: torso, head with a gamcha, arms */
    const shirt = '#F1EBDD', skin = '#7A4B2E';
    k.add(once(new THREE.CapsuleGeometry(0.16, 0.34, 3, 8)), shirt, T(0.53, 1.47, 0, 0, 0, -0.42));
    k.add(G.ball, skin, T(0.72, 1.88, 0, 0, 0, 0, 0.26));
    k.add(G.ball, '#1C1A19', T(0.69, 1.93, 0, 0, 0, 0, 0.25, 0.18, 0.25));
    k.add(G.cyl, ART.red, T(0.71, 1.95, 0, 0, 0, -0.2, 0.28, 0.07, 0.28));
    for (const z of [0.18, -0.18]) {
      k.add(G.cyl, shirt, rod(v3(0.64, 1.7, z * 0.9), v3(0.8, 1.42, z), 0.055));
      k.add(G.cyl, skin, rod(v3(0.8, 1.42, z), v3(0.96, 1.24, z * 1.4), 0.045));
    }
    body.add(k.build(M, 1));
    /* hood: rickshaw-art bands over the seat, folded back */
    const hood = new Kit(), hr = 0.72, hz = 1.02, hx = -0.5, hy = 1.0;
    const bands = [ART.red, ART.gold, ART.red, brand.accent, ART.red, ART.green, ART.red];
    const t0 = 0.74 * Math.PI, tl = 0.84 * Math.PI;
    bands.forEach((c, i) => hood.add(once(new THREE.CylinderGeometry(hr, hr, hz, 3, 1, true, t0 + tl * i / bands.length, tl / bands.length)), c, T(hx, hy, 0, Math.PI / 2, 0, 0), 'two'));
    for (const z of [hz / 2, -hz / 2]) hood.add(once(new THREE.TorusGeometry(hr, 0.03, 4, 18, tl)), ART.gold, T(hx, hy, z, 0, 0, t0 - Math.PI / 2));
    hood.add(G.cyl, frame, rod(v3(hx + 0.1, 1.0, 0.52), v3(hx + 0.32, 1.65, 0.52), 0.02));
    body.add(hood.build(M, 1));
    /* rickshaw art on the side of the seat */
    const side = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.3), new THREE.MeshLambertMaterial({ map: tex(sideArt()) }));
    side.position.set(-0.55, 0.77, 0.425); body.add(side);
  }
  const crank = (() => {
    const k = new Kit();
    k.add(G.cyl, '#8A8C90', T(0, 0, 0, Math.PI / 2, 0, 0, 0.16, 0.05, 0.16));
    k.add(G.box, '#3A3A3D', T(0.08, 0, 0.1, 0, 0, 0, 0.17, 0.035, 0.03));
    k.add(G.box, '#3A3A3D', T(-0.08, 0, -0.1, 0, 0, 0, 0.17, 0.035, 0.03));
    const g = k.build(M, 1); g.position.copy(CRANK); body.add(g); return g;
  })();
  const legs = [0.13, -0.13].map(z => {
    const th = new Kit(), sh = new Kit();
    th.add(once(new THREE.CapsuleGeometry(0.085, L1 - 0.12, 2, 6)), '#2E6B8A', T(0, -L1 / 2, 0));
    sh.add(once(new THREE.CapsuleGeometry(0.06, L2 - 0.1, 2, 6)), '#7A4B2E', T(0, -L2 / 2, 0));
    sh.add(G.box, '#3A2A20', T(0.05, -L2, 0, 0, 0, 0, 0.2, 0.05, 0.09));
    const thigh = th.build(M, 1), shin = sh.build(M, 1);
    thigh.position.set(HIP.x, HIP.y, z); shin.position.z = z;
    body.add(thigh, shin);
    return { thigh, shin };
  });
  /* simple two-bone legs: hip fixed, foot on the pedal, knee forward */
  const pose = (phase: number) => {
    crank.rotation.z = -phase;
    legs.forEach((l, i) => {
      const a = -phase + i * Math.PI;
      const px = CRANK.x + Math.cos(a) * 0.16, py = CRANK.y + Math.sin(a) * 0.16;
      const dx = px - HIP.x, dy = py - HIP.y, d = clamp(Math.hypot(dx, dy), 0.1, L1 + L2 - 0.001);
      const th = Math.atan2(dy, dx) + Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
      const kx = HIP.x + Math.cos(th) * L1, ky = HIP.y + Math.sin(th) * L1;
      l.thigh.rotation.z = th + Math.PI / 2;
      l.shin.position.x = kx; l.shin.position.y = ky;
      l.shin.rotation.z = Math.atan2(py - ky, px - kx) + Math.PI / 2;
    });
  };

  /* ---------- obstacles (kept in pools and reused) ---------- */
  const buildOb = (kind: ObKind) => {
    const k = new Kit();
    let flags = 1;
    const INK = '#1A1A1C';
    /* a box with a dark outline round it */
    const ob = (col: Col, x: number, y: number, z: number, sx: number, sy: number, sz: number, rz = 0) => {
      k.add(G.box, col, T(x, y, z, 0, 0, rz, sx, sy, sz));
      k.add(G.box, INK, T(x, y, z, 0, 0, rz, sx + 0.1, sy + 0.1, sz + 0.1), 'edge');
    };
    /* a small dark contact shadow on the road so things sit on it */
    const shadow = (w: number, d: number) => k.add(G.disc, '#2A2930', T(0, 0.008, 0, 0, 0, 0, w, 1, d), 'flat');
    if (kind === 'pothole') {
      flags = 2;
      k.add(G.disc, '#E4DCCB', T(0, 0.004, 0, 0, 0, 0, 1.95, 1, 1.45), 'flat');
      k.add(G.disc, '#4A4640', T(0, 0.008, 0, 0, 0, 0, 1.62, 1, 1.18));
      k.add(G.disc, '#1C1A19', T(0, 0.012, 0, 0, 0, 0, 1.38, 1, 1.0), 'flat');
      k.add(G.disc, '#0C0B0B', T(0.05, 0.016, 0.02, 0, 0, 0, 0.85, 1, 0.6), 'flat');
      for (const [rx, rz] of [[-0.92, 0.32], [0.88, -0.36], [0.3, 0.66], [-0.4, -0.64]]) k.add(G.rock, '#CFC6B6', T(rx, 0.03, rz, 0.4, rx, 0, 0.18, 0.09, 0.16));
    } else if (kind === 'puddle') {
      flags = 2;
      k.add(G.disc, '#E6EEF2', T(0, 0.004, 0, 0, 0, 0, 2.35, 1, 1.5), 'flat');
      k.add(G.disc, P.night ? '#2E5F96' : '#2C74B8', T(0, 0.008, 0, 0, 0, 0, 2.1, 1, 1.3), 'flat');
      k.add(G.disc, P.night ? '#4A82BC' : '#4D97D6', T(-0.1, 0.012, 0, 0, 0, 0, 1.7, 1, 1.0), 'flat');
      k.add(G.disc, P.night ? '#FFD9A0' : '#E8F4FF', T(-0.3, 0.016, 0.18, 0, 0, 0, 0.75, 1, 0.16), 'flat');
      k.add(G.disc, P.night ? '#FFD9A0' : '#E8F4FF', T(0.35, 0.016, -0.2, 0, 0, 0, 0.5, 1, 0.12), 'flat');
    } else if (kind === 'cone') {
      shadow(0.85, 0.85);
      ob('#232325', 0, 0.03, 0, 0.56, 0.06, 0.56);
      k.add(G.cone, '#FF6A0D', T(0, 0.41, 0, 0, 0, 0, 0.5, 0.7, 0.5));
      k.add(G.cone, INK, T(0, 0.41, 0, 0, 0, 0, 0.6, 0.82, 0.6), 'edge');
      /* two white bands; the cone is 0.25 wide at 0.06 and a point at 0.76 */
      const r = (h: number) => 0.25 * (0.76 - h) / 0.7 + 0.008;
      for (const [a, b] of [[0.25, 0.35], [0.47, 0.56]]) k.add(once(new THREE.CylinderGeometry(r(b), r(a), b - a, 12)), '#FFFFFF', T(0, (a + b) / 2, 0), 'flat');
    } else if (kind === 'cng') {
      const g = '#16A34A', dg = '#0E6B33';
      shadow(2.6, 1.5);
      ob(g, 0.1, 0.52, 0, 1.75, 0.5, 1.12);
      ob(g, -0.93, 0.48, 0, 0.42, 0.42, 0.62);
      ob(dg, 0.05, 1.15, 0, 1.9, 0.09, 1.2);
      for (const [px, pz] of [[-0.78, 0.5], [-0.78, -0.5], [0.9, 0.5], [0.9, -0.5]]) k.add(G.box, g, T(px, 0.95, pz, 0, 0, 0, 0.07, 0.42, 0.07));
      for (const px of [-0.2, 0.2, 0.55]) k.add(G.box, '#2A2A2D', T(px, 0.96, 0.56, 0, 0, 0, 0.04, 0.38, 0.03));
      k.add(G.box, '#2A3640', T(-0.8, 0.96, 0, 0, 0, 0, 0.04, 0.36, 0.92));
      k.add(G.box, '#FFFFFF', T(0.1, 0.3, 0, 0, 0, 0, 1.78, 0.08, 1.15), 'flat');
      k.add(G.box, '#FFE6A0', T(-1.15, 0.58, 0, 0, 0, 0, 0.04, 0.12, 0.2), 'flat');
      for (const [wx, wz] of [[-0.95, 0], [0.55, 0.5], [0.55, -0.5]]) k.add(G.cyl, '#1D1D1F', T(wx, 0.22, wz, Math.PI / 2, 0, 0, 0.44, 0.16, 0.44));
    } else if (kind === 'bus') {
      const red = '#E3302A';
      shadow(3.2, 1.6);
      ob(red, 0, 0.66, 0, 2.7, 0.92, 1.2);
      k.add(G.box, '#FFFFFF', T(0, 0.42, 0, 0, 0, 0, 2.72, 0.12, 1.22), 'flat');
      k.add(G.box, '#2A3640', T(0.05, 0.9, 0, 0, 0, 0, 2.5, 0.3, 1.22));
      k.add(G.box, '#FFC23A', T(0, 0.72, 0, 0, 0, 0, 2.72, 0.06, 1.22), 'flat');
      k.add(G.box, '#B3221D', T(0, 1.15, 0, 0, 0, 0, 2.6, 0.07, 1.14));
      k.add(G.box, '#2A3640', T(-1.36, 0.88, 0, 0, 0, 0, 0.03, 0.36, 1.0));
      k.add(G.box, '#FFC23A', T(-1.36, 1.08, 0, 0, 0, 0, 0.04, 0.1, 0.7), 'flat');
      for (const z of [0.42, -0.42]) k.add(G.box, '#FFE6A0', T(-1.36, 0.5, z, 0, 0, 0, 0.04, 0.1, 0.16), 'flat');
      for (const wx of [-0.85, 0.85]) for (const wz of [0.52, -0.52]) k.add(G.cyl, '#1D1D1F', T(wx, 0.24, wz, Math.PI / 2, 0, 0, 0.48, 0.16, 0.48));
    } else {
      const hide = '#FBF7EE', patch = '#7A4A2C';
      shadow(2.0, 1.1);
      ob(hide, 0.1, 0.32, 0, 1.3, 0.5, 0.66);
      k.add(G.box, patch, T(0.3, 0.45, 0.2, 0, 0, 0, 0.45, 0.3, 0.3));
      k.add(G.box, patch, T(-0.2, 0.35, -0.22, 0, 0, 0, 0.35, 0.3, 0.25));
      ob(hide, -0.25, 0.1, 0.38, 0.5, 0.16, 0.18);
      ob(hide, 0.5, 0.1, 0.38, 0.45, 0.16, 0.18);
      ob(hide, -0.68, 0.55, 0.05, 0.42, 0.3, 0.3, -0.3);
      k.add(G.box, '#E7B9A6', T(-0.88, 0.48, 0.05, 0, 0, -0.3, 0.14, 0.2, 0.24));
      for (const z of [0.16, -0.06]) k.add(G.cone, '#D9CBB0', T(-0.62, 0.78, z, 0, 0, 0.5, 0.07, 0.2, 0.07));
      k.add(G.box, patch, T(0.82, 0.32, 0, 0, 0, 0.9, 0.05, 0.38, 0.05));
    }
    return k.build(M, flags);
  };
  const pool: Record<ObKind, Ob[]> = { pothole: [], puddle: [], cone: [], cng: [], bus: [], cow: [] };
  const live: Ob[] = [];
  const getOb = (kind: ObKind) => {
    let ob = pool[kind].find(b => !b.live);
    if (!ob) {
      ob = { kind, g: buildOb(kind), x: 0, ...OB[kind], extra: 0, live: false };
      ob.g.visible = false; ob.g.position.z = LANE; scene.add(ob.g); pool[kind].push(ob);
    }
    return ob;
  };
  (Object.keys(pool) as ObKind[]).forEach(k => { getOb(k); getOb(k); });

  /* fuchka pickups */
  const coinProto = (() => {
    const k = new Kit();
    k.add(G.ball, '#F0A630', T(0, 0, 0, 0, 0, 0, 0.56, 0.48, 0.56));
    k.add(G.ball, '#5A2E10', T(0, 0, 0, 0, 0, 0, 0.66, 0.58, 0.66), 'edge');
    k.add(G.ball, '#FFD27A', T(-0.07, 0.07, 0.12, 0, 0, 0, 0.26, 0.21, 0.26));
    k.add(G.disc, '#5A2E10', T(0, 0.235, 0, 0, 0, 0, 0.2, 1, 0.2));
    return k.build(M, 1);
  })();
  const coins = Array.from({ length: 9 }, () => {
    const g = coinProto.clone(); g.visible = false; scene.add(g);
    return { g, x: 0, y: 0, live: false, ph: 0 };
  });

  /* dust and pop bits: one instanced mesh */
  const NP = 48;
  const partGeo = new THREE.IcosahedronGeometry(0.5, 0);
  const parts = new THREE.InstancedMesh(partGeo, new THREE.MeshLambertMaterial({ flatShading: true }), NP);
  parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage); parts.frustumCulled = false;
  const pd = { x: new Float32Array(NP), y: new Float32Array(NP), z: new Float32Array(NP), vx: new Float32Array(NP), vy: new Float32Array(NP), vz: new Float32Array(NP), age: new Float32Array(NP), life: new Float32Array(NP), size: new Float32Array(NP) };
  const zero = new THREE.Matrix4().makeScale(0, 0, 0), pm = new THREE.Matrix4(), pc = new THREE.Color();
  for (let i = 0; i < NP; i++) { parts.setMatrixAt(i, zero); parts.setColorAt(i, pc.set(P.dust)); }
  scene.add(parts);
  let pNext = 0, pAlive = false;
  const puff = (x: number, y: number, z: number, n: number, color: string, spread = 1, up = 1.4) => {
    const count = reduced ? Math.ceil(n / 3) : n;
    for (let j = 0; j < count; j++) {
      const i = pNext; pNext = (pNext + 1) % NP;
      pd.x[i] = x; pd.y[i] = y; pd.z[i] = z + (Math.random() - 0.5) * 0.5;
      pd.vx[i] = (Math.random() - 0.7) * 2.4 * spread; pd.vy[i] = up * (0.4 + Math.random()); pd.vz[i] = (Math.random() - 0.5) * 1.6 * spread;
      pd.age[i] = 0; pd.life[i] = 0.35 + Math.random() * 0.3; pd.size[i] = 0.1 + Math.random() * 0.1;
      parts.setColorAt(i, pc.set(color));
    }
    if (parts.instanceColor) parts.instanceColor.needsUpdate = true;
    pAlive = true;
  };

  /* setup shapes are no longer needed */
  Object.values(G).forEach(g => g.dispose());
  temp.forEach(g => g.dispose());

  /* ---------- camera framing: keep the same stretch of road in view on a tall phone or a wide screen ---------- */
  let ahead = 6, tgtY = 3, camDist = 25, spawnX = 30, despawnX = -14, aspect = 1;
  const camDir = v3(-Math.sin(YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW) * Math.cos(PITCH));
  const frame = () => {
    const a = clamp(aspect, 0.5, 2.4);
    const wvis = clamp(5.5 + 9 * a, 13.5, 23);
    const tanV = Math.tan(FOV * DEG / 2);
    camDist = wvis / 2 / (tanV * a);
    ahead = wvis * 0.3;
    tgtY = 1.0 + 2 * camDist * tanV * (a < 1 ? 0.24 : 0.22);
    spawnX = ahead + wvis * 0.5 + 12;
    despawnX = ahead - wvis * 0.5 - 8;
    fog.near = camDist + 14; fog.far = camDist + 175;
  };

  /* ---------- game state ---------- */
  type State = 'idle' | 'run' | 'crash' | 'over';
  let state: State = 'idle';
  let t = 0, v = 3.2, dist = 0, scroll = 0, bonus = 0, lastScore = -1;
  let y = 0, vy = 0, grounded = true, buffer = 0, squash = 0, phase = 0, follow = 0, shake = 0;
  let crashT = 0, crashHole = false, overSent = false;
  let nextFree = 0;
  let pending: { items: { kind: ObKind; off: number }[]; len: number; extra: number; gap: number } | null = null;
  const coinQueue: number[] = [];

  const speedAt = (s: number) => Math.min(24, 9 + 10 * (1 - Math.exp(-s / 55)) + 0.02 * s);
  const choose = () => {
    const k = clamp(t / 90, 0, 1);
    const r = Math.random();
    const gap = lerp(1.25, 0.72, k) + Math.random() * lerp(1.0, 0.5, k);
    const one = (kind: ObKind, extra = 0) => ({ items: [{ kind, off: 0 }], len: OB[kind].len, extra, gap });
    if (t > 30 && r < 0.2 + 0.15 * k) {
      /* doubles: two small things close enough to clear in one jump, or later two jumps in a row */
      if (t > 45 && Math.random() < 0.4) {
        const a: ObKind = Math.random() < 0.5 ? 'pothole' : 'cone', b: ObKind = Math.random() < 0.5 ? 'puddle' : 'cone';
        const off = OB[a].len + v * 0.82;
        return { items: [{ kind: a, off: 0 }, { kind: b, off }], len: off + OB[b].len, extra: 0, gap: gap + 0.15 };
      }
      const a: ObKind = Math.random() < 0.5 ? 'cone' : 'pothole';
      const off = OB[a].len + 1.6 + Math.random() * 0.6;
      return { items: [{ kind: a, off: 0 }, { kind: 'cone' as ObKind, off }], len: off + OB.cone.len, extra: 0, gap: gap + 0.15 };
    }
    const w: [ObKind, number][] = [['pothole', 3], ['puddle', 2], ['cone', 2.2]];
    if (t > 7) w.push(['cng', 2]);
    if (t > 15) w.push(['cow', 0.55]);
    if (t > 40) w.push(['bus', 1.3]);
    let sum = 0; w.forEach(e => sum += e[1]);
    let q = Math.random() * sum, kind: ObKind = 'pothole';
    for (const [kk, ww] of w) { q -= ww; if (q <= 0) { kind = kk; break; } }
    if (kind === 'cng') return one(kind, 3.5 + 3 * k + (t > 60 ? Math.min(3, (t - 60) / 20) : 0));
    if (kind === 'bus') return one(kind, 2 + 2 * k);
    return one(kind);
  };
  const spawn = (p: NonNullable<typeof pending>) => {
    for (const it of p.items) {
      const ob = getOb(it.kind);
      ob.live = true; ob.extra = p.extra; ob.x = spawnX + it.off + ob.len / 2;
      ob.g.position.x = ob.x; ob.g.rotation.y = it.kind === 'cow' && Math.random() < 0.5 ? Math.PI : 0;
      ob.g.visible = true; live.push(ob);
    }
  };
  const clearAll = () => {
    for (const ob of live) { ob.live = false; ob.g.visible = false; }
    live.length = 0;
    for (const c of coins) { c.live = false; c.g.visible = false; }
    coinQueue.length = 0;
    for (let i = 0; i < NP; i++) { pd.life[i] = 0; parts.setMatrixAt(i, zero); }
    parts.instanceMatrix.needsUpdate = true;
  };
  const resetRick = () => {
    y = 0; vy = 0; grounded = true; buffer = 0; squash = 0; crashT = 0; shake = 0;
    rick.position.y = 0; rick.rotation.z = 0; tip.rotation.z = 0; tip.scale.set(1, 1, 1);
    wheels.forEach(w => { w.rotation.x = 0; });
  };
  const crash = (hole: boolean) => {
    state = 'crash'; crashT = 0; crashHole = hole && grounded; overSent = false;
    for (const ob of live) ob.extra = 0;
    shake = reduced ? 0 : 1;
    puff(FRONT, 0.15, LANE, 14, P.dust, 1.4, 2);
  };

  const step = (dt: number) => {
    /* speed */
    if (state === 'run') { t += dt; v += (speedAt(t) - v) * Math.min(1, dt * 2.5); }
    else if (state === 'idle') v += (3.2 - v) * Math.min(1, dt * 3);
    else v *= Math.exp(-dt * 7);
    const dx = v * dt;
    scroll += dx;
    if (state === 'run') dist += dx;
    for (const s of strips) s.g.position.x = -((scroll * s.f) % s.period);

    /* jump */
    if (state === 'run' || state === 'idle') {
      buffer = Math.max(0, buffer - dt);
      if (buffer > 0 && grounded && state === 'run') { vy = JUMP; grounded = false; buffer = 0; }
    }
    if (!grounded) {
      vy -= GRAV * (vy < 0 ? 1.2 : 1) * dt; y += vy * dt;
      if (y <= 0) {
        y = 0; grounded = true;
        if (state === 'run') {
          squash = 1;
          puff(FRONT, 0.05, LANE, 5, P.dust); puff(REAR, 0.05, LANE + 0.4, 4, P.dust);
          if (buffer > 0) { vy = JUMP; grounded = false; buffer = 0; }
        } else vy = 0;
      }
    }

    /* obstacles: move, hit test (swept over this frame so nothing slips through at speed), recycle */
    for (let i = live.length - 1; i >= 0; i--) {
      const ob = live[i];
      const mv = dx + ob.extra * dt;
      ob.x -= mv; ob.g.position.x = ob.x;
      if (state === 'run') {
        const a0 = ob.x - ob.len / 2, a1 = ob.x + ob.len / 2;
        if (ob.hole) {
          const in0 = a0 + 0.32, in1 = a1 - 0.32 + mv;
          if (y < 0.06 && ((FRONT > in0 && FRONT < in1) || (REAR > in0 && REAR < in1))) crash(true);
        } else if (a1 - 0.22 + mv > HIT0 && a0 + 0.22 < HIT1 && y < ob.h - 0.14) crash(false);
      }
      if (ob.x < despawnX) { ob.live = false; ob.g.visible = false; live.splice(i, 1); }
    }

    /* new obstacles: wait until this pattern would arrive at least `gap` seconds after the last one has passed */
    if (state === 'run' && t > 1.4) {
      if (!pending) {
        pending = choose();
        if (pending.gap > 1.15 && t > 4 && Math.random() < 0.55) coinQueue.push(nextFree + pending.gap * 0.5);
      }
      const close = v + pending.extra;
      const arrive = t + spawnX / close;
      if (arrive >= nextFree + pending.gap) {
        spawn(pending);
        nextFree = arrive + (pending.len + 2) / close;
        pending = null;
      }
    }

    /* fuchka: a row of three in the air between obstacles */
    if (state === 'run' && coinQueue.length && t + spawnX / v >= coinQueue[0]) {
      coinQueue.shift();
      let n = 0;
      for (const c of coins) {
        if (c.live || n > 2) continue;
        c.live = true; c.x = spawnX + n * 1.1; c.y = n === 1 ? 2.3 : 2.05; c.ph = n; c.g.visible = true; n++;
      }
    }
    for (const c of coins) {
      if (!c.live) continue;
      c.x -= dx; c.ph += dt * 3;
      c.g.position.set(c.x, c.y + Math.sin(c.ph * 1.3) * 0.08, LANE);
      c.g.rotation.y = c.ph;
      if (state === 'run' && Math.abs(c.x - 0.3) < 1.0 && Math.abs(c.y - (y + 1.15)) < 0.75) {
        c.live = false; c.g.visible = false; bonus += 10;
        puff(c.x, c.y, LANE, 7, ART.gold, 0.8, 1.6);
      } else if (c.x < despawnX) { c.live = false; c.g.visible = false; }
    }

    /* score: metres plus fuchka, sent only when the number changes */
    if (state === 'run') {
      const s = Math.floor(dist) + bonus;
      if (s !== lastScore) { lastScore = s; o.onScore(s); }
    }

    /* rickshaw pose */
    if (state !== 'crash' && state !== 'over') {
      phase += dx * 1.1;
      for (const w of wheels) w.rotation.z -= dx / R;
      pose(phase);
      squash = Math.max(0, squash - dt * 5);
      const sq = Math.sin(squash * Math.PI) * 0.5 * squash;
      tip.scale.set(1 + sq * 0.1, 1 - sq * 0.16, 1);
      rick.position.y = y;
      rick.rotation.z = grounded ? 0 : clamp(vy * 0.011, -0.1, 0.12);
    } else {
      crashT += dt;
      const k = clamp(crashT / 0.45, 0, 1), e = easeOut(k);
      if (!crashHole && y > 0) { vy -= GRAV * dt; y = Math.max(0, y + vy * dt); }
      rick.position.y = crashHole ? -0.26 * e : y;
      rick.rotation.z *= 0.85;
      tip.rotation.z = -(crashHole ? 0.32 : 0.5) * e + Math.sin(k * Math.PI) * 0.06;
      tip.scale.set(1, 1, 1);
      const wob = Math.sin(crashT * 38) * 0.3 * (1 - clamp(crashT / 0.8, 0, 1));
      wheels.forEach((w, i) => { w.rotation.x = i === 0 ? wob : wob * 0.5; w.rotation.z -= dx / R; });
      if (crashT >= 0.6 && !overSent) { overSent = true; state = 'over'; o.onOver(Math.floor(dist) + bonus); }
    }

    /* bits */
    if (pAlive) {
      let any = false;
      for (let i = 0; i < NP; i++) {
        if (pd.life[i] <= 0) continue;
        pd.age[i] += dt;
        if (pd.age[i] >= pd.life[i]) { pd.life[i] = 0; parts.setMatrixAt(i, zero); continue; }
        any = true;
        pd.vy[i] -= 5 * dt; pd.vx[i] *= 0.96; pd.vz[i] *= 0.96;
        pd.x[i] += pd.vx[i] * dt - dx; pd.y[i] = Math.max(0.04, pd.y[i] + pd.vy[i] * dt); pd.z[i] += pd.vz[i] * dt;
        const s = pd.size[i] * (1 - pd.age[i] / pd.life[i]) * 2;
        pm.makeScale(s, s, s).setPosition(pd.x[i], pd.y[i], pd.z[i]);
        parts.setMatrixAt(i, pm);
      }
      parts.instanceMatrix.needsUpdate = true;
      pAlive = any;
    }

    /* camera: gentle follow of the jump, a small bob, a short shake on a crash */
    follow += (y * 0.25 - follow) * Math.min(1, dt * 4);
    const bob = reduced ? 0 : Math.sin(phase * 2) * 0.02 * Math.min(1, v / 10);
    shake = Math.max(0, shake - dt * 3);
    const sx = shake ? (Math.random() - 0.5) * 0.25 * shake : 0, sy = shake ? (Math.random() - 0.5) * 0.2 * shake : 0;
    const fov = FOV + (reduced ? 0 : clamp((v - 9) / 12, 0, 1) * 3);
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.position.set(ahead + camDir.x * camDist + sx, tgtY + camDir.y * camDist + follow + bob + sy, LANE + camDir.z * camDist);
    camera.lookAt(ahead, tgtY + follow * 0.6, LANE);
  };

  /* ---------- loop ---------- */
  let raf = 0, last = 0, running = false;
  const draw = () => { if (!dead) renderer.render(scene, camera); };
  const loop = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    step(dt); draw();
    if (state === 'over' && crashT > 1.0 && !pAlive) { running = false; return; }
    raf = requestAnimationFrame(loop);
  };
  const play = () => { if (running || dead) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
  const halt = () => { running = false; cancelAnimationFrame(raf); };

  frame(); pose(0); step(0); play();

  return {
    start() {
      clearAll(); resetRick();
      state = 'run'; t = 0; dist = 0; bonus = 0; lastScore = -1; nextFree = 0; pending = null; overSent = false;
      o.onScore(0); lastScore = 0;
      play();
    },
    pause() { halt(); },
    resume() { play(); },
    resize(w: number, h: number) {
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix();
      frame(); step(0); draw();
    },
    input(e) {
      if (e.type !== 'press' || state !== 'run') return;
      if (grounded) { vy = JUMP; grounded = false; buffer = 0; } else buffer = 0.14;
    },
    destroy() {
      dead = true; halt();
      scene.traverse(obj => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose();
      });
      Object.values(M).forEach(m => m.dispose());
      textures.forEach(x => x.dispose());
      poolMat.dispose(); partGeo.dispose();
      renderer.dispose();
    },
  };
};

export default make;
