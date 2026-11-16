/* Cha Stack: a tea stall stacking game. A cup slides over the stack, a press drops it, and the part that hangs
   over the cup below is cut off and falls away, so the next cup is smaller. A near perfect drop snaps in place
   with a ring ripple (three in a row grows the cup back a little). Miss the stack and the run is over.
   Flat low-poly look: Lambert materials, flat shading, one soft shadow. No glow, no shiny gradients.
   It wears the restaurant: its logo large on a framed board in the back corner (it rides up with the camera and
   stays above the tower, also at game over), its colours on the counter, saucer, lids and its own cup.
   The frame (host.tsx) draws the score and the cards; this file only draws the scene. */
import * as THREE from 'three';
import type { Brand, GameFactory } from './types';

/* sizes in world units */
const H = 0.66;            // height of one cup layer
const R0 = 0.95;           // full cup radius
const Y0 = 0.12;           // top of the saucer the stack stands on
const PERFECT = 0.08;      // a drop this close to the centre snaps
const MIN_LEFT = 0.08;     // less overlap than this counts as a miss
const MAX_LAYERS = 120;    // older cups far below are dropped from the scene
const MAX_PIECES = 10;     // falling cut pieces kept at once
const WALL = -5.4;         // the two back walls (x and z)
const FRONT = 3;           // front edge of the counter (x and z)

/* board with the logo: its size on screen (world units at zoom 1) and the gap above it */
const BW = 3.3, BH = 1.65, BTOP = 0.28;
const BOARD_MIN = 0.45;    // below this zoom the board stops growing with the view and gets a bit smaller

type Look = { body: string; rim: string; tea: string; handle: boolean; logo: boolean };
/* one look per layer, in turn: the restaurant's own cup (with its logo on the side), clay cup, glass with amber tea,
   the restaurant's cup again, white enamel with blue rim, steel. The first cup on the saucer is the restaurant's */
const looksFor = (b: Brand): Look[] => [
  { body: b.accent, rim: b.deep, tea: '#B07440', handle: true, logo: true },
  { body: '#B4613D', rim: '#8F4528', tea: '#C49060', handle: false, logo: false },
  { body: '#C98A34', rim: '#EFE8D8', tea: '#9E4C18', handle: true, logo: false },
  { body: b.accent, rim: b.deep, tea: '#B07440', handle: true, logo: true },
  { body: '#F2EEE5', rim: '#2E5AA6', tea: '#B98652', handle: true, logo: false },
  { body: '#AEB5BA', rim: '#77818A', tea: '#94541F', handle: true, logo: false },
];
/* a colour part way from a to b */
const mix = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

type Layer = { g: THREE.Group; x: number; z: number; r: number; y: number };
type Mover = Layer & { axis: 'x' | 'z'; p: number; dir: number; look: number };
/* a falling bit. `restY` and `step` say how it lies once it lands on the counter (step = snap angle) */
type Piece = { o: THREE.Object3D; v: THREE.Vector3; w: THREE.Vector3; geo?: THREE.BufferGeometry; restY: number; step: number; still: boolean };
type Settle = { g: THREE.Group; x0: number; z0: number; r0: number; x1: number; z1: number; r1: number; y: number; t: number };
type Ripple = { m: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; r: number; t: number };
type Puff = { s: THREE.Sprite; life: number; rate: number; drift: number };

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const ease = (k: number, dt: number) => 1 - Math.exp(-k * dt);

const make: GameFactory = (o) => {
  const { brand, dark, reduced } = o;
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  /* light: a bright tea stall by day. dark: a warm evening (dusky walls, warm lamp light), never black */
  const pal = dark
    ? { wallA: '#7A6470', wallB: '#685462', saucer: '#EAE3D6', cream: '#E8DCC6', sky: '#FFE2BE', ground: '#5A4030', hemi: 1.75, sun: '#FFD3A0', sunI: 1.25, steam: 0.32, wallLift: 0.3 }
    : { wallA: '#F3EADA', wallB: '#E7D9C0', saucer: '#FBF8F2', cream: '#F6EEDF', sky: '#FFF8EC', ground: '#C4A684', hemi: 1.7, sun: '#FFF3E2', sunI: 1.95, steam: 0.42, wallLift: 0.4 };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(pal.wallB);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  const DIR = new THREE.Vector3(1, 0.82, 1).normalize();
  const UP = new THREE.Vector3(0, 1, 0);
  /* the camera's own up and right, to place the board at a fixed spot on screen */
  const FWD = DIR.clone().negate();
  const UPV = UP.clone().sub(FWD.clone().multiplyScalar(UP.dot(FWD))).normalize();
  const RIGHT = new THREE.Vector3().crossVectors(FWD, UPV).normalize();
  let view = 4; // half height of the view at zoom 1

  /* light: soft sky fill plus one sun with a small shadow map that follows the top of the stack */
  scene.add(new THREE.HemisphereLight(pal.sky, pal.ground, pal.hemi));
  const sun = new THREE.DirectionalLight(pal.sun, pal.sunI);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera;
  sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 0.5; sc.far = 40;
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  /* shared things, freed in destroy() */
  const lam = (c: string, extra: THREE.MeshLambertMaterialParameters = {}) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...extra });

  /* the restaurant's mark, drawn into canvases: the big board and a small decal for its cups. Its logo (same-site
     image only), else its initials and name on its deep colour with its accent, else khabo's plate mark */
  const font = (() => {
    try { return getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif'; } catch { return 'system-ui, sans-serif'; }
  })();
  const signCv = document.createElement('canvas'); signCv.width = 1024; signCv.height = 512;
  const decalCv = document.createElement('canvas'); decalCv.width = 512; decalCv.height = 176;
  const signTex = new THREE.CanvasTexture(signCv); signTex.colorSpace = THREE.SRGBColorSpace; signTex.anisotropy = 4;
  const decalTex = new THREE.CanvasTexture(decalCv); decalTex.colorSpace = THREE.SRGBColorSpace; decalTex.anisotropy = 4;
  let logoImg: HTMLImageElement | null = null, logoOk = false;
  const drawMark = (cv: HTMLCanvasElement, big: boolean) => {
    const c = cv.getContext('2d'); if (!c) return;
    const W = cv.width, Hh = cv.height, f = big ? 14 : 7;
    c.clearRect(0, 0, W, Hh);
    c.fillStyle = brand.deep; c.fillRect(0, 0, W, Hh);
    c.strokeStyle = brand.accent; c.lineWidth = f; c.strokeRect(f * 1.6, f * 1.6, W - f * 3.2, Hh - f * 3.2);
    if (big) { c.lineWidth = 3; c.strokeRect(f * 3.4, f * 3.4, W - f * 6.8, Hh - f * 6.8); }
    const pad = big ? 92 : 30;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (logoImg && logoOk) {
      const iw = logoImg.naturalWidth || 400, ih = logoImg.naturalHeight || 120;
      const s = Math.min((W - pad * 2) / iw, (Hh - pad * 2) / ih);
      c.drawImage(logoImg, (W - iw * s) / 2, (Hh - ih * s) / 2, iw * s, ih * s);
    } else {
      const name = big ? (brand.name || '') : '';
      const cy = name ? Hh * 0.42 : Hh / 2;
      if (brand.mono) {
        c.fillStyle = brand.accent;
        c.font = `800 ${Math.round(Hh * (name ? 0.4 : 0.56))}px ${font}`;
        c.fillText(brand.mono, W / 2, cy + Hh * 0.02, W - pad * 2);
      } else {
        // khabo's plate mark: a plate seen from above
        const r = Hh * (name ? 0.17 : 0.26);
        c.strokeStyle = brand.accent; c.lineWidth = r * 0.16;
        c.beginPath(); c.arc(W / 2, cy, r, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(W / 2, cy, r * 0.56, 0, Math.PI * 2); c.stroke();
      }
      if (name) {
        c.fillStyle = '#F7EFDF';
        c.font = `700 ${Math.round(Hh * 0.15)}px ${font}`;
        c.fillText(name, W / 2, Hh * 0.75, W - pad * 2);
      }
    }
  };
  const drawMarks = () => { drawMark(signCv, true); drawMark(decalCv, false); signTex.needsUpdate = true; decalTex.needsUpdate = true; };
  drawMarks();
  if (brand.logo) {
    try {
      const u = new URL(brand.logo, location.href);
      if (u.origin === location.origin) {
        logoImg = new Image();
        logoImg.onload = () => { if (logoImg) { logoOk = true; drawMarks(); } };
        logoImg.src = u.href;
      }
    } catch { /* bad url: keep the initials */ }
  }
  // the page font may still be loading: draw the initials again once it is in
  let alive = true;
  try { void document.fonts?.ready.then(() => { if (alive && !logoOk) drawMarks(); }); } catch { /* old browser */ }

  const looks = looksFor(brand).map(l => ({ ...l, mBody: lam(l.body), mRim: lam(l.rim), mTea: lam(l.tea) }));
  const mDecal = new THREE.MeshLambertMaterial({ map: decalTex, polygonOffset: true, polygonOffsetFactor: -2 });
  const gBody = new THREE.CylinderGeometry(1, 0.84, H * 0.86, 28).translate(0, H * 0.43, 0);
  const gRim = new THREE.CylinderGeometry(1.03, 1.0, H * 0.14, 28).translate(0, H * 0.93, 0);
  const gTea = new THREE.CircleGeometry(0.86, 28).rotateX(-Math.PI / 2).translate(0, H + 0.002, 0);
  const gHandle = new THREE.TorusGeometry(0.26, 0.07, 6, 12, Math.PI).rotateZ(-Math.PI / 2).translate(0.93, H * 0.5, 0);
  const gRing = new THREE.RingGeometry(1.0, 1.09, 48).rotateX(-Math.PI / 2);
  /* the logo decal: a strip of the cup's side that faces the camera, just outside the tapered body */
  const dy0 = H * 0.2, dy1 = H * 0.68, bodyR = (y: number) => 0.84 + 0.16 * (y / (H * 0.86)) + 0.012;
  const gDecal = new THREE.CylinderGeometry(bodyR(dy1), bodyR(dy0), dy1 - dy0, 6, 1, true, Math.PI / 4 - 0.5, 1.0).translate(0, (dy0 + dy1) / 2, 0);

  /* one cup, made at radius 1 and scaled in x and z */
  const cup = (look: number, r: number) => {
    const l = looks[look % looks.length];
    const g = new THREE.Group();
    const body = new THREE.Mesh(gBody, l.mBody); body.castShadow = true; body.receiveShadow = true;
    const rim = new THREE.Mesh(gRim, l.mRim); rim.castShadow = true;
    g.add(body, rim, new THREE.Mesh(gTea, l.mTea));
    if (l.logo) g.add(new THREE.Mesh(gDecal, mDecal));
    if (l.handle) {
      const h = new THREE.Mesh(gHandle, l.mBody); h.castShadow = true;
      const pivot = new THREE.Group(); pivot.rotation.y = Math.PI / 4; pivot.add(h); // points to the right of the screen
      g.add(pivot);
    }
    g.scale.set(r, 1, r);
    return g;
  };

  /* the stall: a counter in the restaurant's colours (deep front, accent trim, a pale top tinted with its colour),
     two plain walls, a kettle and a biscuit jar with lids in its colours */
  const stall = new THREE.Group(); scene.add(stall);
  const mDeep = lam(brand.deep), mAcc = lam(brand.accent);
  {
    const w = FRONT - WALL, mid = (FRONT + WALL) / 2;
    const mTop = lam(mix(brand.deep, pal.cream, dark ? 0.72 : 0.84));
    const counter = new THREE.Mesh(new THREE.BoxGeometry(w, 30, w), [mDeep, mDeep, mTop, mDeep, mDeep, mDeep]);
    counter.position.set(mid, -15, mid); counter.receiveShadow = true; stall.add(counter);
    const trimZ = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.14, 0.08), mAcc); trimZ.position.set(mid + 0.04, -0.07, FRONT + 0.04);
    const trimX = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, w + 0.08), mAcc); trimX.position.set(FRONT + 0.04, -0.07, mid + 0.04);
    const lineZ = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.05, 0.07), mAcc); lineZ.position.set(mid + 0.05, -0.42, FRONT + 0.035);
    const lineX = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, w + 0.1), mAcc); lineX.position.set(FRONT + 0.035, -0.42, mid + 0.05);
    stall.add(trimZ, trimX, lineZ, lineX);

    const wallZ = new THREE.Mesh(new THREE.PlaneGeometry(40, 400), lam(pal.wallA, { emissive: pal.wallA, emissiveIntensity: pal.wallLift })); wallZ.position.set(WALL + 20, 180, WALL); wallZ.receiveShadow = true;
    const wallX = new THREE.Mesh(new THREE.PlaneGeometry(40, 400), lam(pal.wallB, { emissive: pal.wallB, emissiveIntensity: pal.wallLift })); wallX.rotation.y = Math.PI / 2; wallX.position.set(WALL, 180, WALL + 20); wallX.receiveShadow = true;
    stall.add(wallZ, wallX);

    // saucer: white with the restaurant's accent rim and a deep foot
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 0.42, R0 + 0.22, Y0 * 0.7, 32).translate(0, Y0 * 0.3 + Y0 * 0.35, 0), lam(pal.saucer));
    const sRim = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 0.44, R0 + 0.43, Y0 * 0.3, 32, 1, true).translate(0, Y0 * 0.85, 0), mAcc);
    const sFoot = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 0.12, R0 + 0.05, Y0 * 0.3, 28).translate(0, Y0 * 0.15, 0), mDeep);
    for (const m of [saucer, sRim, sFoot]) { m.receiveShadow = true; m.castShadow = true; stall.add(m); }

    // kettle, front left: steel with a lid and handle in the restaurant's colours
    const steel = lam('#B4BBC0');
    const k = new THREE.Group(); k.position.set(-1.8, 0, 1.8);
    const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.62, 16).translate(0, 0.31, 0), steel);
    const kl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 0.16, 16).translate(0, 0.7, 0), mDeep);
    const kk = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6).translate(0, 0.82, 0), mAcc);
    const ks = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.6, 8), steel); ks.rotation.z = -0.9; ks.position.set(0.55, 0.42, 0);
    const kh = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 6, 14, Math.PI), mDeep); kh.position.set(0, 0.74, 0); kh.rotation.y = Math.PI / 4;
    for (const m of [kb, kl, kk, ks, kh]) { m.castShadow = true; k.add(m); }
    k.rotation.y = -Math.PI / 4;
    stall.add(k);

    // biscuit jar, back right
    const j = new THREE.Group(); j.position.set(1.8, 0, -1.8);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.72, 16).translate(0, 0.36, 0), lam('#DCE6E2', { transparent: true, opacity: 0.4, depthWrite: false }));
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.1, 16).translate(0, 0.77, 0), mDeep);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 10).translate(0, 0.86, 0), mAcc);
    const biscuit = lam('#D8A257'), gBis = new THREE.CylinderGeometry(0.3, 0.3, 0.07, 14);
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(gBis, biscuit); b.position.set(Math.sin(i * 2.1) * 0.02, 0.06 + i * 0.09, 0); b.rotation.z = Math.sin(i * 1.7) * 0.12; j.add(b); }
    lid.castShadow = true; glass.castShadow = true;
    j.add(glass, lid, knob);
    stall.add(j);
  }

  /* the restaurant's board: its logo large on its deep colour, framed in its accent, hung across the back corner
     so it faces the camera and touches both walls. update() keeps it at the top of the screen, above the tower */
  const board = new THREE.Group();
  {
    const PH = BH / UPV.y; // the camera looks down a little, so the board is a bit taller to look BW x BH on screen
    const frame = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.16, PH + 0.16, 0.1), mAcc);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, PH), new THREE.MeshBasicMaterial({ map: signTex }));
    face.position.z = 0.052;
    frame.receiveShadow = true;
    board.add(frame, face);
    board.rotation.y = Math.PI / 4; // faces the camera
    scene.add(board);
  }
  /* evening: a bare warm bulb on a cord beside the board, and a warm lamp light over the stack */
  let bulbLight: THREE.PointLight | null = null;
  const bulb = new THREE.Group();
  if (dark) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: '#FFD58A' }));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8).translate(0, 0.15, 0), lam('#3A3236'));
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 30, 4).translate(0, 15.2, 0), lam('#1A1418'));
    bulbLight = new THREE.PointLight('#FFC98A', 16, 0, 1.5);
    bulb.add(b, cap, cord);
    scene.add(bulb, bulbLight);
  }

  /* steam: a few soft white puffs rising from the top cup */
  const puffCv = document.createElement('canvas'); puffCv.width = puffCv.height = 64;
  {
    const c = puffCv.getContext('2d');
    if (c) {
      const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
    }
  }
  const puffTex = new THREE.CanvasTexture(puffCv);
  const puffs: Puff[] = [];
  const nPuff = reduced ? 3 : 7;
  for (let i = 0; i < nPuff; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 }));
    s.renderOrder = 2;
    scene.add(s);
    puffs.push({ s, life: i / nPuff, rate: (reduced ? 0.22 : 0.34) + (i % 3) * 0.05, drift: (i * 2.4) % (Math.PI * 2) });
  }

  /* game state */
  let state: 'idle' | 'play' | 'ending' | 'over' = 'idle';
  let layers: Layer[] = [];
  let mover: Mover | null = null;
  let pieces: Piece[] = [];
  let settles: Settle[] = [];
  const ripples: Ripple[] = [];
  let score = 0, combo = 0, endT = 0, overSent = false, time = 0, sway = 0;
  let camX = 0, camZ = 0, camY = 1.1, zoom = 1, aspect = 0.8;
  const tmp = new THREE.Vector3();

  const clearStack = () => {
    for (const l of layers) scene.remove(l.g);
    for (const p of pieces) { scene.remove(p.o); p.geo?.dispose(); }
    if (mover) scene.remove(mover.g);
    for (const s of settles) scene.remove(s.g);
    for (const r of ripples) r.m.visible = false;
    layers = []; pieces = []; settles = []; mover = null;
  };

  const addBase = () => {
    const g = cup(0, R0); g.position.set(0, Y0, 0); scene.add(g);
    layers.push({ g, x: 0, z: 0, r: R0, y: Y0 });
  };

  const speed = () => Math.min(2.5 + score * 0.085, 6.4);
  const reach = () => Math.min(2.6 + score * 0.045, 3.9);

  const spawn = () => {
    const top = layers[layers.length - 1];
    const n = layers.length, axis: 'x' | 'z' = n % 2 ? 'x' : 'z';
    const look = n % looks.length;
    const side = Math.random() < 0.5 ? -1 : 1;
    const y = Y0 + n * H;
    const g = cup(look, top.r); scene.add(g);
    mover = { g, x: top.x, z: top.z, r: top.r, y, axis, p: side * reach(), dir: -side, look };
    placeMover();
  };
  const placeMover = () => {
    if (!mover) return;
    const top = layers[layers.length - 1];
    if (mover.axis === 'x') { mover.x = top.x + mover.p; mover.z = top.z; } else { mover.z = top.z + mover.p; mover.x = top.x; }
    mover.g.position.set(mover.x, mover.y, mover.z);
  };

  const ripple = (x: number, y: number, z: number, r: number) => {
    let rp = ripples.find(q => !q.m.visible);
    if (!rp) {
      if (ripples.length >= 3) rp = ripples[0];
      else { rp = { m: new THREE.Mesh(gRing, new THREE.MeshBasicMaterial({ color: '#FFF8EA', transparent: true, depthWrite: false })), r, t: 0 }; scene.add(rp.m); ripples.push(rp); }
    }
    rp.m.position.set(x, y + 0.01, z); rp.r = r; rp.t = 0; rp.m.visible = true;
  };

  /* the bit of a dropped cup that hangs over the edge: a slice of circle (radius r, centre c on the slide axis)
     beyond the line at `edge`, on side `side` */
  const cutPiece = (m: Mover, c: number, edge: number, side: number) => {
    const r = m.r, k = side * (edge - c);
    const a = Math.acos(clamp(k / r, -1, 1)), t0 = side > 0 ? 0 : Math.PI;
    const sh = new THREE.Shape();
    sh.moveTo(r * Math.cos(t0 - a), r * Math.sin(t0 - a));
    sh.absarc(0, 0, r, t0 - a, t0 + a, false);
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: H * 0.95, bevelEnabled: false, curveSegments: 18 });
    geo.rotateX(-Math.PI / 2); // shape x stays x, extrusion goes up
    if (m.axis === 'z') geo.rotateY(-Math.PI / 2); // shape x now runs along z
    geo.computeBoundingBox();
    const ctr = new THREE.Vector3(); geo.boundingBox?.getCenter(ctr);
    geo.translate(-ctr.x, -ctr.y, -ctr.z);
    const l = looks[m.look % looks.length];
    const mesh = new THREE.Mesh(geo, [l.mTea, l.mBody]); mesh.castShadow = true;
    const bx = m.axis === 'x' ? c : m.x, bz = m.axis === 'z' ? c : m.z;
    mesh.position.set(bx + ctr.x, m.y + ctr.y, bz + ctr.z);
    scene.add(mesh);
    addPiece(mesh, m.axis, side, H * 0.48, Math.PI, geo);
  };
  const addPiece = (obj: THREE.Object3D, axis: 'x' | 'z', side: number, restY: number, step: number, geo?: THREE.BufferGeometry) => {
    const v = axis === 'x' ? new THREE.Vector3(side * 1.6, 0.6, 0) : new THREE.Vector3(0, 0.6, side * 1.6);
    const w = axis === 'x' ? new THREE.Vector3(0, 0, -side * (reduced ? 2 : 3.4)) : new THREE.Vector3(side * (reduced ? 2 : 3.4), 0, 0);
    pieces.push({ o: obj, v, w, geo, restY, step, still: false });
    while (pieces.length > MAX_PIECES) { const p = pieces.shift(); if (p) { scene.remove(p.o); p.geo?.dispose(); } }
  };

  const drop = () => {
    const m = mover; if (!m || state !== 'play') return;
    const top = layers[layers.length - 1];
    const c1 = m.axis === 'x' ? top.x : top.z, c2 = c1 + m.p, d = m.p;
    let nx = m.x, nz = m.z, nr = m.r;
    if (Math.abs(d) < PERFECT) {
      combo++;
      nx = top.x; nz = top.z;
      nr = combo >= 3 ? Math.min(R0, top.r + 0.07) : top.r;
      ripple(nx, m.y + H, nz, nr);
    } else {
      combo = 0;
      const lo = Math.max(c1 - top.r, c2 - m.r), hi = Math.min(c1 + top.r, c2 + m.r);
      if (hi - lo < MIN_LEFT * 2) { miss(m, d); return; }
      const side = d > 0 ? 1 : -1;
      cutPiece(m, c2, side > 0 ? hi : lo, side);
      nr = (hi - lo) / 2;
      const nc = (hi + lo) / 2;
      if (m.axis === 'x') nx = nc; else nz = nc;
    }
    settles.push({ g: m.g, x0: m.x, z0: m.z, r0: m.r, x1: nx, z1: nz, r1: nr, y: m.y, t: 0 });
    layers.push({ g: m.g, x: nx, z: nz, r: nr, y: m.y });
    mover = null;
    score++; o.onScore(score);
    trimLayers();
    spawn();
  };

  const miss = (m: Mover, d: number) => {
    addPiece(m.g, m.axis, d > 0 ? 1 : -1, m.r * 0.92, Math.PI / 2);
    mover = null;
    state = 'ending'; endT = 0;
    for (const l of layers) l.g.visible = true;
  };

  /* keep the scene small: drop very old cups, hide the ones far below the view */
  const trimLayers = () => {
    while (layers.length > MAX_LAYERS) { const l = layers.shift(); if (l) scene.remove(l.g); }
    const below = camY - (view * 1.9) / zoom - 1;
    for (const l of layers) l.g.visible = l.y > below;
  };

  const topY = () => (layers.length ? layers[layers.length - 1].y + H : Y0 + H);

  /* low on the stack, the camera stays high enough that the board stands clear above the counter */
  const camMin = () => {
    const a1 = ((BW + 0.16) / 2 + 0.06) / Math.SQRT2;
    return 0.08 + BH / UPV.y / 2 - (view - BTOP - BH / 2 - (UPV.x + UPV.z) * (WALL + a1)) / UPV.y;
  };

  /* frame loop */
  const update = (dt: number) => {
    time += dt;
    if (state === 'play' && mover) {
      const D = reach();
      mover.p += mover.dir * speed() * dt;
      if (mover.p > D) { mover.p = 2 * D - mover.p; mover.dir = -1; }
      else if (mover.p < -D) { mover.p = -2 * D - mover.p; mover.dir = 1; }
      placeMover();
    }

    // a dropped cup slides into place and shrinks to what is left
    settles = settles.filter(s => {
      s.t = Math.min(1, s.t + dt / 0.14);
      const k = 1 - Math.pow(1 - s.t, 3), r = s.r0 + (s.r1 - s.r0) * k;
      const bump = reduced ? 0 : Math.sin(s.t * Math.PI) * 0.035;
      s.g.position.set(s.x0 + (s.x1 - s.x0) * k, s.y + bump, s.z0 + (s.z1 - s.z0) * k);
      s.g.scale.set(r, 1, r);
      return s.t < 1;
    });

    // falling pieces: gravity and a tumble, removed once well below the view
    const floor = camY - (view * 2.2) / zoom - 4;
    pieces = pieces.filter(p => {
      if (p.still) return true;
      p.v.y -= 19 * dt;
      p.o.position.addScaledVector(p.v, dt);
      p.o.rotation.x += p.w.x * dt; p.o.rotation.z += p.w.z * dt;
      const { x, y, z } = p.o.position;
      const rest = p.restY + (x * x + z * z < (R0 + 0.45) ** 2 ? Y0 : 0); // on the saucer or the counter
      if (y < rest && y > rest - 0.6 && x > WALL && x < FRONT && z > WALL && z < FRONT) {
        // landed: lie still, flat or on its side
        p.still = true; p.o.position.y = rest;
        const ax = p.w.x ? 'x' : 'z';
        let k = Math.round(p.o.rotation[ax] / p.step);
        if (p.step < Math.PI && k % 2 === 0) k += Math.sign(p.w[ax]); // a whole cup lies on its side
        p.o.rotation[ax] = k * p.step;
        return true;
      }
      if (p.o.position.y < floor) { scene.remove(p.o); p.geo?.dispose(); return false; }
      return true;
    });

    for (const rp of ripples) {
      if (!rp.m.visible) continue;
      rp.t += dt / 0.55;
      if (rp.t >= 1) { rp.m.visible = false; continue; }
      const s = rp.r * (1 + rp.t * 0.65);
      rp.m.scale.set(s, 1, s);
      rp.m.material.opacity = 0.85 * (1 - rp.t);
    }

    // steam from the top cup on the stack
    const top = layers[layers.length - 1];
    if (top) {
      const ty = top.g.position.y + H, tr = top.g.scale.x;
      for (const pf of puffs) {
        pf.life += pf.rate * dt;
        if (pf.life > 1) { pf.life -= 1; pf.drift = Math.random() * Math.PI * 2; }
        const L = pf.life, wob = Math.sin(time * 1.3 + pf.drift) * 0.18 * L;
        const ox = Math.cos(pf.drift) * tr * 0.35, oz = Math.sin(pf.drift) * tr * 0.35;
        pf.s.position.set(top.g.position.x + ox + wob, ty + 0.12 + L * 1.25, top.g.position.z + oz - wob * 0.5);
        const s = (0.32 + L * 0.55) * Math.max(0.6, tr / R0);
        pf.s.scale.set(s, s, 1);
        pf.s.material.opacity = pal.steam * Math.sin(Math.PI * L) * (state === 'play' || state === 'idle' ? 1 : 0.6);
      }
    }

    // camera: follows the top of the stack; at the end it pulls back to show the whole tower under the board
    let wantY = topY() - 0.2, wantZoom = 1, wantX = top ? top.x : 0, wantZ = top ? top.z : 0;
    if (state === 'idle') wantY = 1.0;
    wantY = Math.max(wantY, camMin());
    if (state === 'ending' || state === 'over') {
      const bottom = layers.length ? layers[0].y : 0;
      const tall = topY() - bottom;
      // the tower (plus saucer and steam) must fit between the bottom of the view and the bottom of the board
      const need = UPV.y * tall + 1.7, room = BTOP + BH;
      wantZoom = (2 * view - room) / need;
      if (wantZoom < BOARD_MIN) wantZoom = 2 * view / (need + room / BOARD_MIN);
      wantZoom = clamp(wantZoom, 0.12, 1);
      const bs = 1 / Math.max(wantZoom, BOARD_MIN);
      wantY = bottom + tall * 0.5 + 0.1 + (room * bs * 0.5) / UPV.y;
      wantX = 0; wantZ = 0;
    }
    const k = ease(state === 'ending' ? 4.5 : 3.2, dt);
    camY += (wantY - camY) * k; zoom += (wantZoom - zoom) * k;
    camX += (wantX * 0.6 - camX) * ease(2, dt); camZ += (wantZ * 0.6 - camZ) * ease(2, dt);
    const swayTo = state === 'idle' && !reduced ? Math.sin(time * 0.45) * 0.14 : 0;
    sway += (swayTo - sway) * ease(2, dt);
    const d = DIR.clone().applyAxisAngle(UP, sway).multiplyScalar(40);
    cam.position.set(camX + d.x, camY + d.y, camZ + d.z);
    cam.lookAt(camX, camY, camZ);
    if (Math.abs(cam.zoom - zoom) > 1e-4) { cam.zoom = zoom; cam.updateProjectionMatrix(); }

    // the board keeps its place at the top of the screen and its size (it only shrinks a little on a very tall
    // tower); it stays pushed into the back corner, touching both walls
    const bs = 1 / Math.max(zoom, BOARD_MIN);
    const a = ((BW + 0.16) / 2 * bs + 0.06) / Math.SQRT2;
    const bx = WALL + a, bz = WALL + a;
    const U = view / zoom - (BTOP + BH / 2) * bs; // the board's centre, up from the middle of the screen
    const by = camY + (U - UPV.x * (bx - camX) - UPV.z * (bz - camZ)) / UPV.y;
    board.position.set(bx, Math.max(by, BH / UPV.y / 2 * bs + 0.06), bz);
    board.scale.setScalar(bs);
    if (dark && bulbLight) {
      // the bulb hangs left of the board; its light sits up and in front of the stack
      tmp.set(bx, by, bz).addScaledVector(RIGHT, -(BW / 2 + 0.4) * bs).addScaledVector(UPV, -(BH / 2 + 0.15) * bs).addScaledVector(DIR, 2.2);
      bulb.position.copy(tmp);
      bulbLight.position.set(camX - 1.2, camY + 2.6 / zoom, camZ + 2.4);
    }

    sun.position.set(camX + 5, camY + 9, camZ + 2.5);
    sun.target.position.set(camX, camY - 2, camZ);

    if (state === 'ending') {
      endT += dt;
      if (endT >= 0.85 && !overSent) { overSent = true; state = 'over'; o.onOver(score); }
    }
  };

  let raf = 0, last = 0, running = false;
  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, 1 / 20);
    last = now;
    update(dt);
    renderer.render(scene, cam);
  };
  const run = () => { if (running || !alive) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  addBase();
  run();

  return {
    start() {
      clearStack();
      addBase();
      score = 0; combo = 0; endT = 0; overSent = false;
      state = 'play';
      o.onScore(0);
      spawn();
      run();
    },
    pause: stop,
    resume: run,
    resize(w: number, h: number) {
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      aspect = w / h;
      view = Math.max(3.2, 3.0 / aspect); // narrow screens see more height so the slide still fits across
      cam.top = view; cam.bottom = -view; cam.left = -view * aspect; cam.right = view * aspect;
      cam.updateProjectionMatrix();
      if (state === 'idle') camY = Math.max(camY, camMin());
      if (!running) renderer.render(scene, cam);
    },
    input(e) {
      if (e.type === 'press') drop();
    },
    destroy() {
      alive = false; stop();
      if (logoImg) { logoImg.onload = null; logoImg = null; }
      clearStack();
      scene.traverse(obj => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = (m as { material?: THREE.Material | THREE.Material[] }).material;
        if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose();
      });
      for (const l of looks) { l.mBody.dispose(); l.mRim.dispose(); l.mTea.dispose(); }
      for (const g of [gBody, gRim, gTea, gHandle, gRing, gDecal]) g.dispose();
      mDecal.dispose(); signTex.dispose(); decalTex.dispose(); puffTex.dispose();
      renderer.dispose();
    },
  };
};

export default make;
