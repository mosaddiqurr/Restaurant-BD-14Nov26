/* khabo prototype · media viewers: 360° tour, video, photo lightbox, 3D dish (three.js r160 via unpkg) */
(function () {
  const A = window.APP, D = A.D, ic = A.ic, L = A.L, t = A.t;
  A.addT({
    en: { vLoading:'Loading 3D tour', vDrag:'Drag to look around', vZin:'Zoom in', vZout:'Zoom out', vFull:'Full screen', vGo:'Go to', vOf:'of', d3Drag:'Drag to turn the plate', tourOf:'3D tour' },
    bn: { vLoading:'3D ট্যুর লোড হচ্ছে', vDrag:'চারপাশ দেখতে টানুন', vZin:'বড় করুন', vZout:'ছোট করুন', vFull:'ফুল স্ক্রিন', vGo:'যান', vOf:'/', d3Drag:'প্লেট ঘোরাতে টানুন', tourOf:'3D ট্যুর' }
  });
  let TP;
  const three = () => TP || (TP = import('https://unpkg.com/three@0.160.0/build/three.module.js'));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- overlay ---------- */
  let vw, cleanup = null, lastFocus;
  function ensureVw() {
    if (vw) return vw;
    vw = document.createElement('div'); vw.className = 'vw'; vw.tabIndex = -1; vw.style.outline = 'none'; vw.setAttribute('role', 'dialog'); vw.setAttribute('aria-modal', 'true');
    document.body.appendChild(vw);
    vw.addEventListener('click', e => { if (e.target.closest('[data-vclose]')) closeVw(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && vw.classList.contains('on')) closeVw(); });
    return vw;
  }
  function showVw(html, label) {
    const v = ensureVw(); lastFocus = document.activeElement;
    if (cleanup) { cleanup(); cleanup = null; }
    v.innerHTML = html; v.setAttribute('aria-label', label || '');
    requestAnimationFrame(() => v.classList.add('on')); document.body.style.overflow = 'hidden';
    setTimeout(() => v.focus({ preventScroll: true }), 80);
    return v;
  }
  function closeVw() {
    vw.classList.remove('on'); document.body.style.overflow = '';
    if (cleanup) { cleanup(); cleanup = null; }
    const vid = vw.querySelector('video'); if (vid) vid.pause();
    setTimeout(() => { if (!vw.classList.contains('on')) vw.innerHTML = ''; }, 300);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  const head = (title, sub) => `<div class="vh"><div><b>${title}</b><span data-sub>${sub || ''}</span></div><div class="sp"></div><button class="gb" data-vclose aria-label="${t('close')}">${ic('x')}</button></div>`;

  /* ---------- panorama scene ---------- */
  async function panoScene(canvas, o) {
    o = o || {};
    const T = await three();
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(o.fov || 72, 1, 1, 1100);
    const geo = new T.SphereGeometry(500, 64, 40); geo.scale(-1, 1, 1);
    const mat = new T.MeshBasicMaterial({ color: 0xffffff }); scene.add(new T.Mesh(geo, mat));
    const loader = new T.TextureLoader(); loader.setCrossOrigin('anonymous');
    let lon = o.lon || 0, lat = 0, tlon = lon, tlat = 0, fov = o.fov || 72, tfov = fov, drag = false, sx = 0, sy = 0, slon = 0, slat = 0, idleAt = 0, raf = 0, alive = true, visible = true;
    const pts = new Map(); let pinch0 = 0, pfov = fov;
    const ptr = e => { pts.set(e.pointerId, e); };
    canvas.addEventListener('pointerdown', e => { ptr(e); canvas.setPointerCapture(e.pointerId); drag = true; sx = e.clientX; sy = e.clientY; slon = tlon; slat = tlat; idleAt = performance.now(); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); pfov = tfov; } o.onInteract && o.onInteract(); });
    canvas.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; ptr(e);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); tfov = Math.max(35, Math.min(90, pfov * pinch0 / d)); return; }
      if (!drag) return; const k = fov / canvas.clientHeight * 1.1;
      tlon = slon - (e.clientX - sx) * k; tlat = Math.max(-75, Math.min(75, slat + (e.clientY - sy) * k)); idleAt = performance.now();
    });
    const up = e => { pts.delete(e.pointerId); if (!pts.size) drag = false; idleAt = performance.now(); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    if (o.wheel !== false) canvas.addEventListener('wheel', e => { e.preventDefault(); tfov = Math.max(35, Math.min(90, tfov + e.deltaY * 0.04)); }, { passive: false });
    const size = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    const ro = new ResizeObserver(size); ro.observe(canvas); size();
    let io; if (o.lazy) { io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(canvas); }
    const v3 = new T.Vector3(); let last = performance.now();
    function frame(now) {
      if (!alive) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(64, now - last); last = now;
      if (!visible) return;
      if (o.auto && !drag && !reduce && now - idleAt > 2600) tlon += dt * 0.006;
      lon += (tlon - lon) * 0.14; lat += (tlat - lat) * 0.14; fov += (tfov - fov) * 0.14;
      if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
      const phi = (90 - lat) * Math.PI / 180, th = lon * Math.PI / 180;
      cam.lookAt(500 * Math.sin(phi) * Math.cos(th), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(th));
      renderer.render(scene, cam);
      if (o.onFrame) o.onFrame((lonD, latD) => {
        const p = (90 - latD) * Math.PI / 180, q = lonD * Math.PI / 180;
        v3.set(400 * Math.sin(p) * Math.cos(q), 400 * Math.cos(p), 400 * Math.sin(p) * Math.sin(q)).project(cam);
        return { x: (v3.x + 1) / 2 * canvas.clientWidth, y: (1 - v3.y) / 2 * canvas.clientHeight, ok: v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05 };
      });
    }
    raf = requestAnimationFrame(frame);
    return {
      load: (url, ok) => new Promise((res, rej) => loader.load(url, tex => { if (!alive || (ok && !ok())) { tex.dispose(); return res(); } tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4; const old = mat.map; mat.map = tex; mat.needsUpdate = true; old && old.dispose(); res(); }, undefined, rej)),
      zoom: d => { tfov = Math.max(35, Math.min(90, tfov + d)); },
      look: l => { tlon = l; },
      dispose: () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io && io.disconnect(); geo.dispose(); mat.map && mat.map.dispose(); mat.dispose(); renderer.dispose(); }
    };
  }

  /* ---------- 3D tour overlay ---------- */
  async function openTour(r, roomId) {
    if (!r || !r.tour) return;
    let idx = Math.max(0, r.tour.findIndex(x => x.id === roomId));
    const v = showVw(`${head(L(r.name) + ' · ' + t('tourOf'), '')}
      <div class="stagev"><canvas aria-label="${t('vDrag')}"></canvas><div class="load">${ic('spinner-gap')}<span>${t('vLoading')}</span></div><div class="hand">${ic('hand-grabbing')}<span>${t('vDrag')}</span></div><div data-hs></div>
        <div class="ctl"><button class="gb" data-zin aria-label="${t('vZin')}">${ic('plus')}</button><button class="gb" data-zout aria-label="${t('vZout')}">${ic('minus')}</button><button class="gb" data-fs aria-label="${t('vFull')}">${ic('arrows-out-simple')}</button></div></div>
      <div class="vf"><div class="rooms">${r.tour.map((x, i) => `<button data-room="${i}" aria-pressed="${i === idx}"><span style="background-image:url('${D.PANO(x.pano)(256)}')"></span>${L(x)}</button>`).join('')}</div></div>`, L(r.name) + ' 3D');
    const canvas = v.querySelector('canvas'), load = v.querySelector('.load'), hand = v.querySelector('.hand'), hsBox = v.querySelector('[data-hs]'), sub = v.querySelector('[data-sub]');
    let hs = [];
    const mkHs = () => {
      hs = r.tour.map((x, i) => i === idx ? null : { i, lon: ((i - idx) * 97 + 360) % 360 - 20, lat: -6, x }).filter(Boolean);
      hsBox.innerHTML = hs.map(h => `<button class="hs" data-room="${h.i}" style="display:none"><span class="o">${ic('arrow-up')}</span><span>${t('vGo')}: ${L(h.x)}</span></button>`).join('');
    };
    const els = () => [...hsBox.querySelectorAll('.hs')];
    let sc;
    try {
      sc = await panoScene(canvas, { auto: true, onInteract: () => { hand.style.opacity = 0; }, onFrame: proj => { els().forEach((el, k) => { const p = proj(hs[k].lon, hs[k].lat); el.style.display = p.ok ? '' : 'none'; el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; }); } });
    } catch (e) { load.innerHTML = 'WebGL is not available on this device.'; return; }
    cleanup = () => sc.dispose();
    let tok = 0;
    const go = async i => {
      const me = ++tok, still = () => me === tok;
      idx = i; load.style.display = ''; sub.textContent = L(r.tour[i]) + (r.photosDate ? ' · ' + r.photosDate : '');
      v.querySelectorAll('.rooms [data-room]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.room) === i)));
      mkHs();
      /* progressive: small image first (often cached), sharp one swaps in when ready */
      try { await sc.load(D.PANO(r.tour[i].pano)(512), still); } catch (e) {}
      if (still()) load.style.display = 'none';
      sc.load(D.PANO(r.tour[i].pano)(1024), still).catch(() => {});
    };
    v.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.room != null) go(Number(b.dataset.room));
      else if (b.hasAttribute('data-zin')) sc.zoom(-10);
      else if (b.hasAttribute('data-zout')) sc.zoom(10);
      else if (b.hasAttribute('data-fs')) { const el = document.fullscreenElement; el ? document.exitFullscreen() : (v.requestFullscreen && v.requestFullscreen().catch(() => {})); }
    });
    setTimeout(() => { hand.style.opacity = 0; }, 4200);
    go(idx);
  }

  /* ---------- video ---------- */
  function openVideo(src, title, sub, poster) {
    showVw(`${head(title || '', sub || '')}<div class="stagev"><video src="${src}" ${poster ? `poster="${poster}"` : ''} controls autoplay playsinline></video></div>`, title);
  }

  /* ---------- lightbox ---------- */
  function openGallery(list, start, title) {
    const v = showVw(`${head(title || '', '')}<div class="stagev"><div class="lb">${list.map(k => `<figure><img src="${A.img(k, 1600)}" alt="" loading="lazy"></figure>`).join('')}</div>
      <button class="gb lbnav l" data-lb="-1" aria-label="Previous">${ic('caret-left')}</button><button class="gb lbnav r" data-lb="1" aria-label="Next">${ic('caret-right')}</button></div>`, title);
    const lb = v.querySelector('.lb'), sub = v.querySelector('[data-sub]');
    const cur = () => Math.round(lb.scrollLeft / lb.clientWidth);
    const upd = () => { sub.textContent = A.N(cur() + 1) + ' ' + t('vOf') + ' ' + A.N(list.length); };
    requestAnimationFrame(() => { lb.scrollLeft = lb.clientWidth * (start || 0); upd(); });
    lb.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    const step = d => lb.scrollTo({ left: lb.clientWidth * Math.max(0, Math.min(list.length - 1, cur() + d)), behavior: 'smooth' });
    v.querySelectorAll('[data-lb]').forEach(b => b.addEventListener('click', () => step(Number(b.dataset.lb))));
    const key = e => { if (!v.classList.contains('on')) return document.removeEventListener('keydown', key); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); };
    document.addEventListener('keydown', key);
  }

  /* ---------- inline tour tile (home) ---------- */
  async function mountTourTile(el, pano) {
    const c = document.createElement('canvas'); c.style.opacity = 0; c.style.transition = 'opacity .6s'; el.prepend(c);
    try { const sc = await panoScene(c, { auto: true, lazy: true, fov: 80, wheel: false }); await sc.load(D.PANO(pano)(512)); c.style.opacity = 1; } catch (e) { c.remove(); }
  }

  /* ---------- 3D dish ---------- */
  async function mountDish(el, photoKey) {
    const T = await three();
    const canvas = document.createElement('canvas'); el.appendChild(canvas);
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 0.1, 50);
    scene.add(new T.HemisphereLight(0xffffff, 0x2a3470, 1.25));
    const dl = new T.DirectionalLight(0xfff4e0, 2.2); dl.position.set(3, 6, 4); scene.add(dl);
    const rim = new T.DirectionalLight(0x8fa0ff, 0.8); rim.position.set(-4, 2, -3); scene.add(rim);
    const g = new T.Group(); scene.add(g);
    const prof = [[0.001, 0], [1.25, 0], [1.42, 0.05], [1.62, 0.17], [1.67, 0.21], [1.63, 0.225], [1.45, 0.13], [1.22, 0.09], [0.001, 0.09]].map(p => new T.Vector2(p[0], p[1]));
    const plate = new T.Mesh(new T.LatheGeometry(prof, 96), new T.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.32, metalness: 0, side: T.DoubleSide }));
    g.add(plate);
    const ring = new T.Mesh(new T.TorusGeometry(1.655, 0.012, 8, 128), new T.MeshStandardMaterial({ color: 0x2a3db8, roughness: 0.4 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.215; g.add(ring);
    const N = 48, mp = []; for (let i = 0; i <= N; i++) { const s = i / N; mp.push(new T.Vector2(Math.max(0.001, 1.12 * s), 0.09 + 0.36 * (1 - Math.pow(s, 2.4)) + 0.02 * Math.sin(s * 9))); }
    mp.reverse();
    const mg = new T.LatheGeometry(mp, 96); const pos = mg.attributes.position, uv = mg.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 2.5 + 0.5, pos.getZ(i) / 2.5 + 0.5);
    uv.needsUpdate = true; mg.computeVertexNormals();
    const fm = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: T.DoubleSide });
    const food = new T.Mesh(mg, fm); g.add(food);
    const loader = new T.TextureLoader(); loader.setCrossOrigin('anonymous');
    loader.load(A.img(photoKey, 1024, 1024), tex => { tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4; fm.map = tex; fm.needsUpdate = true; });
    const sh = document.createElement('canvas'); sh.width = sh.height = 128; const x = sh.getContext('2d'); const gr = x.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const shadow = new T.Mesh(new T.PlaneGeometry(4.6, 4.6), new T.MeshBasicMaterial({ map: new T.CanvasTexture(sh), transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.02; scene.add(shadow);
    let ry = 0.6, rx = 0.0, tRy = ry, tRx = rx, dist = 7.4, tDist = dist, drag = false, sx = 0, sy = 0, sRy = 0, sRx = 0, idleAt = 0, alive = true, raf;
    canvas.addEventListener('pointerdown', e => { drag = true; canvas.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; sRy = tRy; sRx = tRx; idleAt = performance.now(); el.dispatchEvent(new CustomEvent('kb:touch')); });
    canvas.addEventListener('pointermove', e => { if (!drag) return; tRy = sRy + (e.clientX - sx) * 0.012; tRx = Math.max(-0.35, Math.min(0.5, sRx + (e.clientY - sy) * 0.006)); idleAt = performance.now(); });
    const up = () => { drag = false; idleAt = performance.now(); }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', e => { e.preventDefault(); tDist = Math.max(4.6, Math.min(10, tDist + e.deltaY * 0.004)); }, { passive: false });
    const size = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    const ro = new ResizeObserver(size); ro.observe(el); size();
    let last = performance.now();
    (function loop(now) {
      if (!alive) return; raf = requestAnimationFrame(loop); const dt = Math.min(64, now - last); last = now;
      if (!el.offsetParent && el.closest('.pane') && !el.closest('.pane').classList.contains('on')) return;
      if (!drag && !reduce && now - idleAt > 2200) tRy += dt * 0.00035;
      ry += (tRy - ry) * 0.12; rx += (tRx - rx) * 0.12; dist += (tDist - dist) * 0.12;
      g.rotation.y = ry; g.rotation.x = rx;
      cam.position.set(0, dist * 0.58, dist * 0.82); cam.lookAt(0, 0.12, 0);
      renderer.render(scene, cam);
    })(last);
    return { dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); } };
  }

  /* ---------- delegated triggers ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tour],[data-video],[data-gal]'); if (!b) return; e.preventDefault();
    if (b.dataset.tour) openTour(A.R(b.dataset.tour), b.dataset.room);
    else if (b.dataset.video) openVideo(b.dataset.video, b.dataset.title, b.dataset.sub, b.dataset.poster);
    else if (b.dataset.gal) openGallery(b.dataset.gal.split(','), Number(b.dataset.i || 0), b.dataset.title);
  });

  /* warm up three.js when the page has 3D content, so the tour opens fast */
  const warm = () => { if (document.querySelector('[data-tour],[data-tab="d3"]')) three().catch(() => {}); };
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 2500);

  window.VIEW = { openTour, openVideo, openGallery, mountTourTile, mountDish, three };
})();
