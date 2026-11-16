/* The 360 viewer for the full screen tour: the room photo (equirectangular) on the inside of a sphere, looked at
   from the middle. Drag or swipe to look around (it glides on a little when you let go), pinch or scroll to zoom,
   arrow keys work too, and it turns gently by itself until you touch it. Draws only while something moves.
   Three.js loads only when the tour opens (this file is imported with import()). */
import * as THREE from 'three';

export type Spot = { yaw: number; pitch: number; el: HTMLElement };
type Opts = { yaw?: number; pitch?: number; auto?: number; onReady?: (pano: string) => void };

const rad = (d: number) => d * Math.PI / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/* look direction for a yaw and pitch in degrees (same convention as the room data: yaw 0 = middle of the photo) */
const dirOf = (yaw: number, pitch: number, v = new THREE.Vector3()) =>
  v.set(Math.sin(rad(yaw)) * Math.cos(rad(pitch)), Math.sin(rad(pitch)), -Math.cos(rad(yaw)) * Math.cos(rad(pitch)));

export class PanoViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private geo: THREE.SphereGeometry;
  private mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null = null;
  private fading: { mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>; t0: number } | null = null;
  private loader = new THREE.TextureLoader();
  private spots: Spot[] = [];
  private raf = 0; private last = 0; private alive = true; private token = 0;
  private yaw: number; private pitch: number; private fov = 75;
  private vx = 0; private vy = 0; private dragging = false; private idleAt = 0; private touched = false;
  private pts = new Map<number, { x: number; y: number }>(); private pinch = 0;
  private turn: { from: number; to: number; t0: number; dur: number } | null = null;
  private auto: number; private still: boolean;
  private ro: ResizeObserver; private io: IntersectionObserver; private seen = true;
  private v = new THREE.Vector3(); private fwd = new THREE.Vector3();

  constructor(private host: HTMLElement, private o: Opts = {}) {
    this.yaw = o.yaw ?? 0; this.pitch = o.pitch ?? -4; this.auto = o.auto ?? 2.4;
    this.still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x050806, 1);
    host.prepend(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(this.fov, 1, 0.1, 1100);
    /* phiStart = 90° lines the photo up so yaw 0 looks at its middle; scale −1 shows it from the inside */
    this.geo = new THREE.SphereGeometry(500, 72, 40, Math.PI / 2);
    this.geo.scale(-1, 1, 1);
    this.size();
    this.ro = new ResizeObserver(() => { this.size(); this.kick(); });
    this.ro.observe(host);
    this.io = new IntersectionObserver(([e]) => { this.seen = e.isIntersecting; this.kick(); });
    this.io.observe(host);
    host.addEventListener('pointerdown', this.down);
    host.addEventListener('pointermove', this.move);
    host.addEventListener('pointerup', this.up);
    host.addEventListener('pointercancel', this.up);
    host.addEventListener('wheel', this.wheel, { passive: false });
    host.addEventListener('keydown', this.key);
    document.addEventListener('visibilitychange', this.kick);
  }

  /** show a room. The first one appears at once; later ones fade in over the last */
  async load(pano: string, url: string, yaw?: number) {
    const my = ++this.token;
    const tex = await this.loader.loadAsync(url);
    if (!this.alive || my !== this.token) { tex.dispose(); return; }
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: !!this.mesh, opacity: this.mesh ? 0 : 1, depthWrite: false });
    const mesh = new THREE.Mesh(this.geo, mat);
    if (yaw != null) { if (this.mesh) this.lookTo(yaw, 700); else this.yaw = yaw; }
    if (this.mesh && !this.still) {
      mesh.renderOrder = 1; mesh.scale.setScalar(0.99);
      if (this.fading) this.finishFade();
      this.scene.add(mesh); this.fading = { mesh, t0: performance.now() };
    } else {
      if (this.mesh) this.drop(this.mesh);
      mat.transparent = false; mat.opacity = 1;
      this.scene.add(mesh); this.mesh = mesh;
    }
    this.o.onReady?.(pano);
    this.kick();
  }
  setSpots(list: Spot[]) { this.spots = list; this.kick(); }
  zoom(by: number) { this.fov = clamp(this.fov + by, 32, 95); this.touch(); this.kick(); }
  lookTo(yaw: number, dur = 600) {
    let d = (yaw - this.yaw) % 360; if (d > 180) d -= 360; if (d < -180) d += 360;
    this.turn = { from: this.yaw, to: this.yaw + d, t0: performance.now(), dur: this.still ? 1 : dur };
    this.kick();
  }
  destroy() {
    this.alive = false; cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.io.disconnect();
    const h = this.host;
    h.removeEventListener('pointerdown', this.down); h.removeEventListener('pointermove', this.move); h.removeEventListener('pointerup', this.up);
    h.removeEventListener('pointercancel', this.up); h.removeEventListener('wheel', this.wheel); h.removeEventListener('keydown', this.key);
    document.removeEventListener('visibilitychange', this.kick);
    if (this.fading) this.drop(this.fading.mesh);
    if (this.mesh) this.drop(this.mesh);
    this.geo.dispose(); this.renderer.dispose(); this.renderer.domElement.remove();
  }

  /* ---------- inside ---------- */
  private drop(m: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>) { this.scene.remove(m); m.material.map?.dispose(); m.material.dispose(); }
  private finishFade() {
    const f = this.fading; if (!f) return;
    if (this.mesh) this.drop(this.mesh);
    f.mesh.material.opacity = 1; f.mesh.material.transparent = false; f.mesh.renderOrder = 0; f.mesh.scale.setScalar(1);
    this.mesh = f.mesh; this.fading = null;
  }
  private size() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  private touch() { this.touched = true; this.idleAt = performance.now(); }
  private kick = () => { if (!this.raf && this.alive && this.seen && !document.hidden) { this.last = performance.now(); this.raf = requestAnimationFrame(this.frame); } };
  private frame = (now: number) => {
    this.raf = 0; if (!this.alive) return;
    const dt = Math.min(64, now - this.last); this.last = now;
    let moving = false;
    if (this.turn) {
      const p = Math.min(1, (now - this.turn.t0) / this.turn.dur);
      this.yaw = this.turn.from + (this.turn.to - this.turn.from) * easeOut(p);
      if (p >= 1) this.turn = null; moving = true;
    }
    if (!this.dragging) {
      if (Math.abs(this.vx) > 0.0005 || Math.abs(this.vy) > 0.0005) {
        this.yaw += this.vx * dt; this.pitch = clamp(this.pitch + this.vy * dt, -85, 85);
        const k = Math.pow(0.93, dt / 16.7); this.vx *= k; this.vy *= k; moving = true;
      } else if (!this.still && !this.turn && this.auto) {
        /* the gentle turn comes back slowly a few seconds after the last touch */
        const wait = this.touched ? now - this.idleAt - 3500 : 1e9;
        if (wait > 0) { this.yaw += this.auto * Math.min(1, wait / 1500) * dt / 1000; moving = true; }
        else moving = true;
      }
    }
    if (this.fading) {
      const p = Math.min(1, (now - this.fading.t0) / 650);
      this.fading.mesh.material.opacity = easeOut(p);
      if (p >= 1) this.finishFade();
      moving = true;
    }
    this.draw();
    if (moving || this.dragging) this.kick();
  };
  private draw() {
    if (this.camera.fov !== this.fov) { this.camera.fov = this.fov; this.camera.updateProjectionMatrix(); }
    dirOf(this.yaw, this.pitch, this.fwd);
    this.camera.lookAt(this.fwd);
    this.renderer.render(this.scene, this.camera);
    if (!this.spots.length) return;
    const w = this.host.clientWidth, h = this.host.clientHeight;
    for (const s of this.spots) {
      dirOf(s.yaw, s.pitch, this.v);
      const front = this.v.dot(this.fwd) > 0.15;
      this.v.project(this.camera);
      if (!front || Math.abs(this.v.x) > 1.2 || Math.abs(this.v.y) > 1.2) { s.el.style.opacity = '0'; s.el.style.pointerEvents = 'none'; continue; }
      s.el.style.opacity = '1'; s.el.style.pointerEvents = s.el.tagName === 'BUTTON' ? 'auto' : 'none';
      s.el.style.transform = `translate3d(${((this.v.x + 1) / 2 * w).toFixed(1)}px, ${((1 - this.v.y) / 2 * h).toFixed(1)}px, 0)`;
    }
  }
  private down = (ev: PointerEvent) => {
    if ((ev.target as HTMLElement).closest('button')) return;
    this.host.setPointerCapture(ev.pointerId);
    this.pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    this.dragging = true; this.vx = this.vy = 0; this.turn = null; this.touch(); this.lastMove = performance.now();
    if (this.pts.size === 2) this.pinch = this.gap();
    this.host.dispatchEvent(new Event('pano-touch'));
    this.kick();
  };
  private lastMove = 0;
  private move = (ev: PointerEvent) => {
    const p = this.pts.get(ev.pointerId); if (!p) return;
    const now = performance.now(), dt = Math.max(1, now - this.lastMove);
    const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
    p.x = ev.clientX; p.y = ev.clientY;
    if (this.pts.size >= 2) {
      const g = this.gap(); if (this.pinch) this.fov = clamp(this.fov * this.pinch / g, 32, 95); this.pinch = g;
    } else {
      /* one finger: the room follows the finger (degrees per pixel from the field of view) */
      const k = this.fov / this.host.clientHeight;
      const ya = -dx * k, pa = dy * k;
      this.yaw += ya; this.pitch = clamp(this.pitch + pa, -85, 85);
      this.vx = this.vx * 0.5 + (ya / dt) * 0.5; this.vy = this.vy * 0.5 + (pa / dt) * 0.5;
    }
    this.lastMove = now; this.touch(); this.kick();
  };
  private up = (ev: PointerEvent) => {
    this.pts.delete(ev.pointerId);
    if (this.pts.size < 2) this.pinch = 0;
    if (!this.pts.size) {
      this.dragging = false;
      if (performance.now() - this.lastMove > 80) this.vx = this.vy = 0;
      this.touch(); this.kick();
    }
  };
  private gap() { const [a, b] = [...this.pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; }
  private wheel = (ev: WheelEvent) => { ev.preventDefault(); this.zoom(ev.deltaY * 0.04); };
  private key = (ev: KeyboardEvent) => {
    const k = ev.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') { ev.preventDefault(); this.touch(); this.lookTo(this.yaw + (k === 'ArrowLeft' ? -30 : 30), 450); }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { ev.preventDefault(); this.touch(); this.pitch = clamp(this.pitch + (k === 'ArrowUp' ? 10 : -10), -85, 85); this.kick(); }
    else if (k === '+' || k === '=') this.zoom(-8);
    else if (k === '-' || k === '_') this.zoom(8);
  };
}
