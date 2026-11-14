/* khabo 360 engine. A single full-screen WebGL quad samples an equirectangular photo per pixel.
   One parameter (dd) blends rectilinear (0) and stereographic "tiny planet" (1) projection, which gives the opening
   animation for free. About 8 KB, no 3D library. */
(function () {
  const K = window.K;
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FS = (deriv) => `${deriv ? '#extension GL_OES_standard_derivatives : enable\n' : ''}precision highp float;
uniform sampler2D t0,t1;uniform float mixv,f,dd,asp,ex;uniform mat3 R;varying vec2 v;
const float PI=3.14159265;
vec4 samp(sampler2D t,vec3 d){
  float u1=atan(d.x,-d.z)/(2.*PI)+.5;float vv=acos(clamp(d.y,-1.,1.))/PI;
  ${deriv ? 'float u2=fract(u1+.5)-.5;float u=fwidth(u1)>fwidth(u2)+1e-6?u2:u1;' : 'float u=u1;'}
  return texture2D(t,vec2(u,vv));
}
void main(){
  vec2 q=(v*2.-1.)*vec2(asp,1.);vec3 r=normalize(vec3(q,-f));
  float b=dd*r.z;float c=dd*dd-1.;float tt=-b+sqrt(max(b*b-c,0.));
  vec3 d=normalize(R*(vec3(0.,0.,dd)+tt*r));
  vec4 col=samp(t0,d);if(mixv>.001)col=mix(col,samp(t1,d),mixv);
  gl_FragColor=vec4(col.rgb*ex,1.);
}`;
  const rad = d => d * Math.PI / 180, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPOT = n => (n & (n - 1)) === 0;

  /* ---- image sources ---- */
  const imgCache = {};
  const loadImg = url => imgCache[url] || (imgCache[url] = new Promise((res, rej) => {
    const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
    im.onload = () => res(im); im.onerror = () => { delete imgCache[url]; rej(new Error('img ' + url)); }; im.src = url;
  }));
  const hiWait = {};
  K.panoData = (id, tag, uri) => { const w = hiWait[id + tag]; if (w) w(uri); };
  const loadHi = id => imgCache['hi:' + id] || (imgCache['hi:' + id] = new Promise((res, rej) => {
    hiWait[id + '4k'] = uri => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = uri; };
    const s = document.createElement('script'); s.src = `assets/pano/${id}-4k.js`; s.async = true; s.onerror = () => { delete imgCache['hi:' + id]; rej(new Error('4k ' + id)); };
    document.head.appendChild(s);
  }));
  K.panoSrc = {
    thumb: id => `assets/pano/${id}-s.jpg`,
    low: id => loadImg(`https://cdn.polyhaven.com/asset_img/primary/${id}.png?height=256`),
    mid: id => loadImg(`https://cdn.polyhaven.com/asset_img/primary/${id}.png?height=1024`),
    hi: loadHi
  };
  K.panoPrefetch = (id) => { K.panoSrc.low(id).catch(() => { }); };

  function Pano(canvas, o = {}) {
    if (!(this instanceof Pano)) return new Pano(canvas, o);
    this.c = canvas; this.o = o;
    this.yaw = o.yaw || 0; this.pitch = o.pitch != null ? o.pitch : -4; this.fov = o.fov || 78; this.dd = 0; this.ex = 1;
    this.minFov = o.minFov || 32; this.maxFov = o.maxFov || 100;
    this.auto = o.auto || 0; this.vx = 0; this.vy = 0; this.mix = 0; this.anim = null; this.dirty = true;
    this.spots = []; this.visible = true; this.alive = true; this.userMoved = false;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    if (!gl) { this.failed = true; o.onFail && o.onFail(); return; }
    this.gl = gl;
    const deriv = !!gl.getExtension('OES_standard_derivatives');
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS(deriv))); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { this.failed = true; o.onFail && o.onFail(); return; }
    gl.useProgram(pr); this.pr = pr;
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {}; ['t0', 't1', 'mixv', 'f', 'dd', 'asp', 'R', 'ex'].forEach(n => this.u[n] = gl.getUniformLocation(pr, n));
    gl.uniform1i(this.u.t0, 0); gl.uniform1i(this.u.t1, 1);
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.tex = [null, null];
    this.bind();
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this.kick(); }, { threshold: 0 });
    this.io.observe(canvas);
    this.onVis = () => { if (!document.hidden) this.kick(); };
    document.addEventListener('visibilitychange', this.onVis);
    this.ro = new ResizeObserver(() => { this.dirty = true; this.kick(); }); this.ro.observe(canvas);
    this.last = performance.now();
    this.kick();
  }
  const P = Pano.prototype;

  P.makeTex = function (img) {
    const gl = this.gl; let src = img, w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const cap = Math.min(this.maxTex, this.o.cap || 4096);
    let tw = w, th = h;
    if (!isPOT(w) || !isPOT(h) || w > cap) { tw = Math.min(cap, Math.pow(2, Math.round(Math.log2(w)))); th = tw / 2; }
    if (tw !== w || th !== h) { const cv = document.createElement('canvas'); cv.width = tw; cv.height = th; const cx = cv.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(img, 0, 0, tw, th); src = cv; }
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    if (this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    return t;
  };
  P.setTex = function (slot, t) { const gl = this.gl; if (this.tex[slot] && this.tex[slot] !== t) gl.deleteTexture(this.tex[slot]); this.tex[slot] = t; gl.activeTexture(gl.TEXTURE0 + slot); gl.bindTexture(gl.TEXTURE_2D, t); this.dirty = true; this.kick(); };

  /* progressive load of one room: tiny, then 1600 px, then 4K. fade=true crossfades from the previous room */
  P.load = function (id, opt = {}) {
    if (this.failed) return Promise.resolve();
    const token = this.token = {}; this.room = id;
    const steps = [K.panoSrc.low(id), K.panoSrc.mid(id)];
    const hi = opt.hi != null ? opt.hi : this.o.hi;
    let first = true;
    const apply = img => {
      if (!this.alive || this.token !== token) return;
      const t = this.makeTex(img);
      if (first && opt.fade && this.tex[0]) { first = false; return this.crossfade(t, opt); }
      first = false; this.setTex(0, t); this.o.onReady && this.o.onReady(id);
    };
    let chain = steps[0].then(apply).catch(() => { });
    chain = chain.then(() => steps[1]).then(apply).catch(() => { });
    if (hi) chain = chain.then(() => K.panoSrc.hi(id)).then(apply).catch(() => { });
    return chain;
  };
  P.crossfade = function (t, opt) {
    return new Promise(res => {
      this.setTex(1, t); this.mix = 0;
      const z = opt.zoom ? this.fov : null, dur = reduce() ? 1 : (opt.dur || 750), t0 = performance.now();
      if (opt.yaw != null) { this.yaw = opt.yaw; }
      this.anim = now => {
        const p = Math.min(1, (now - t0) / dur), e = ease(p);
        this.mix = e;
        if (z) this.fov = z - Math.sin(p * Math.PI) * 10;
        if (p >= 1) { const gl = this.gl; const old = this.tex[0]; this.tex[0] = this.tex[1]; this.tex[1] = null; if (old) gl.deleteTexture(old); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[0]); this.mix = 0; if (z) this.fov = z; this.anim = null; this.o.onReady && this.o.onReady(this.room); res(); }
      };
      this.kick();
    });
  };
  P.intro = function (dur = 2600) {
    if (reduce()) return;
    const y1 = this.yaw, p1 = this.pitch, f1 = this.fov, t0 = performance.now();
    this.dd = 1; this.pitch = -90; this.fov = 150; this.yaw = y1 - 150;
    this.anim = now => {
      const p = Math.min(1, (now - t0) / dur), e = ease(p);
      this.dd = 1 - e; this.pitch = -90 + (p1 + 90) * e; this.fov = 150 + (f1 - 150) * e; this.yaw = y1 - 150 * (1 - e);
      if (p >= 1) { this.dd = 0; this.anim = null; this.o.onIntroEnd && this.o.onIntroEnd(); }
    };
    this.kick();
  };
  P.go = function (to, dur = 900) {
    const from = { yaw: this.yaw, pitch: this.pitch, fov: this.fov }, t0 = performance.now();
    let dy = ((to.yaw != null ? to.yaw : from.yaw) - from.yaw) % 360; if (dy > 180) dy -= 360; if (dy < -180) dy += 360;
    this.anim = now => {
      const p = Math.min(1, (now - t0) / dur), e = ease(p);
      this.yaw = from.yaw + dy * e;
      if (to.pitch != null) this.pitch = from.pitch + (to.pitch - from.pitch) * e;
      if (to.fov != null) this.fov = from.fov + (to.fov - from.fov) * e;
      if (p >= 1) this.anim = null;
    };
    this.kick();
  };
  P.kick = function () { if (!this.raf && this.alive) this.raf = requestAnimationFrame(t => this.frame(t)); };
  P.frame = function (now) {
    this.raf = 0; if (!this.alive) return;
    const dt = Math.min(64, now - this.last) / 1000; this.last = now;
    let moving = false;
    if (this.anim) { this.anim(now); moving = true; }
    if (!this.drag) {
      if (Math.abs(this.vx) > .01 || Math.abs(this.vy) > .01) { this.yaw += this.vx; this.pitch = clamp(this.pitch + this.vy, -85, 85); this.vx *= .92; this.vy *= .92; moving = true; }
      else if (this.auto && !this.anim && !this.gyro && !reduce()) { this.yaw += this.auto * dt; moving = true; }
    }
    if (this.gyro && this.gyroT) { const g = this.gyroT; this.yaw += ((((g.yaw - this.yaw) % 360) + 540) % 360 - 180) * .2; this.pitch += (g.pitch - this.pitch) * .2; moving = true; }
    if (moving || this.dirty) { this.draw(); this.dirty = false; }
    if ((moving || this.dirty) && this.visible && !document.hidden) this.kick();
  };
  P.draw = function () {
    const gl = this.gl, c = this.c; if (!this.tex[0]) return;
    const dpr = Math.min(devicePixelRatio || 1, this.o.dprCap || 2) * (this.o.scale || 1);
    const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    gl.viewport(0, 0, w, h);
    const y = rad(this.yaw), p = rad(this.pitch);
    const fw = [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)];
    const rt = [Math.cos(y), 0, Math.sin(y)], bk = [-fw[0], -fw[1], -fw[2]];
    const up = [bk[1] * rt[2] - bk[2] * rt[1], bk[2] * rt[0] - bk[0] * rt[2], bk[0] * rt[1] - bk[1] * rt[0]];
    this.basis = { rt, up, bk };
    gl.uniformMatrix3fv(this.u.R, false, new Float32Array([...rt, ...up, ...bk]));
    this.f = 1 / Math.tan(rad(this.fov) / 2);
    gl.uniform1f(this.u.f, this.f); gl.uniform1f(this.u.dd, this.dd); gl.uniform1f(this.u.asp, w / h);
    gl.uniform1f(this.u.mixv, this.mix); gl.uniform1f(this.u.ex, this.ex);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.placeSpots(w / h);
    this.o.onFrame && this.o.onFrame(this);
  };
  /* hotspots: DOM elements placed at yaw/pitch */
  P.setSpots = function (list) { this.spots = list || []; this.dirty = true; this.kick(); };
  P.placeSpots = function (asp) {
    if (!this.spots.length) return;
    const { rt, up, bk } = this.basis, W = this.c.clientWidth, H = this.c.clientHeight;
    for (const s of this.spots) {
      const y = rad(s.yaw), p = rad(s.pitch || 0);
      const d = [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)];
      const cx = d[0] * rt[0] + d[1] * rt[1] + d[2] * rt[2], cy = d[0] * up[0] + d[1] * up[1] + d[2] * up[2], cz = d[0] * bk[0] + d[1] * bk[1] + d[2] * bk[2];
      const show = cz < -.05 && this.dd < .05;
      if (!show) { s.el.style.opacity = 0; s.el.style.pointerEvents = 'none'; continue; }
      const x = cx / -cz * this.f, yy = cy / -cz * this.f;
      const sx = (x / asp + 1) / 2 * W, sy = (1 - (yy + 1) / 2) * H;
      const edge = Math.min(sx, W - sx, sy, H - sy);
      s.el.style.opacity = edge < 0 ? 0 : Math.min(1, edge / 60);
      s.el.style.pointerEvents = edge > 20 ? 'auto' : 'none';
      s.el.style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`;
    }
  };
  /* pointer, wheel, pinch, keys */
  P.bind = function () {
    const c = this.c, pts = new Map(); let lx = 0, ly = 0, pinch0 = 0, fov0 = 0, moved = 0;
    const allowWheel = this.o.wheel;
    this.h = {
      down: e => {
        if (e.button) return; pts.set(e.pointerId, e); c.setPointerCapture && c.setPointerCapture(e.pointerId);
        if (pts.size === 1) { this.drag = true; lx = e.clientX; ly = e.clientY; this.vx = this.vy = 0; moved = 0; }
        if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); fov0 = this.fov; }
        this.stopAuto();
      },
      move: e => {
        if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
        if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); this.fov = clamp(fov0 * pinch0 / d, this.minFov, this.maxFov); this.kick(); return; }
        if (!this.drag) return;
        const k = this.fov / c.clientHeight;
        const dx = (e.clientX - lx) * k, dy = (e.clientY - ly) * k; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        this.yaw -= dx; this.pitch = clamp(this.pitch + dy, -85, 85); this.vx = -dx * .9; this.vy = dy * .9;
        this.userMoved = true; this.dirty = true; this.kick();
        this.o.onUser && this.o.onUser();
      },
      up: e => { pts.delete(e.pointerId); if (!pts.size) { this.drag = false; this.kick(); } },
      wheel: e => { if (!allowWheel) return; e.preventDefault(); this.fov = clamp(this.fov + e.deltaY * .05, this.minFov, this.maxFov); this.stopAuto(); this.kick(); },
      key: e => {
        const m = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, 6], ArrowDown: [0, -6] }[e.key];
        if (m) { e.preventDefault(); this.stopAuto(); this.go({ yaw: this.yaw + m[0], pitch: clamp(this.pitch + m[1], -85, 85) }, 260); }
        if (e.key === '+' || e.key === '=') this.go({ fov: clamp(this.fov - 10, this.minFov, this.maxFov) }, 260);
        if (e.key === '-') this.go({ fov: clamp(this.fov + 10, this.minFov, this.maxFov) }, 260);
      }
    };
    c.addEventListener('pointerdown', this.h.down); addEventListener('pointermove', this.h.move); addEventListener('pointerup', this.h.up); addEventListener('pointercancel', this.h.up);
    c.addEventListener('wheel', this.h.wheel, { passive: false }); c.addEventListener('keydown', this.h.key);
  };
  P.stopAuto = function () { if (this.auto) { this.auto = 0; this.o.onAutoStop && this.o.onAutoStop(); } };
  P.zoom = function (d) { this.stopAuto(); this.go({ fov: clamp(this.fov + d, this.minFov, this.maxFov) }, 320); };
  P.enableGyro = async function (on) {
    if (!on) { this.gyro = false; removeEventListener('deviceorientation', this.h.ori); return false; }
    try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') return false; } } catch (e) { return false; }
    let base = null;
    this.h.ori = e => {
      if (e.alpha == null) return;
      const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      if (!base) base = { a: e.alpha, yaw: this.yaw };
      let pitch = ang === 0 ? e.beta - 90 : (ang === 90 ? -e.gamma - 90 : e.gamma - 90);
      if (pitch < -180) pitch += 360;
      this.gyroT = { yaw: base.yaw - (e.alpha - base.a), pitch: clamp(pitch, -85, 85) };
      this.kick();
    };
    addEventListener('deviceorientation', this.h.ori); this.gyro = true; this.stopAuto(); return true;
  };
  P.destroy = function () {
    this.alive = false; cancelAnimationFrame(this.raf);
    if (this.io) this.io.disconnect(); if (this.ro) this.ro.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
    if (this.h) { this.c.removeEventListener('pointerdown', this.h.down); removeEventListener('pointermove', this.h.move); removeEventListener('pointerup', this.h.up); removeEventListener('pointercancel', this.h.up); if (this.h.ori) removeEventListener('deviceorientation', this.h.ori); }
    if (this.gl) { const l = this.gl.getExtension('WEBGL_lose_context'); this.tex.forEach(t => t && this.gl.deleteTexture(t)); l && l.loseContext(); }
  };
  K.Pano = Pano;
  K.webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl')); } catch (e) { return false; } })();
})();
