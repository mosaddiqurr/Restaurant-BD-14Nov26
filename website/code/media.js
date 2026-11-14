/* Immersive media: full-screen 360 tour, film player, photo lightbox, 3D dish viewer. */
(function () {
  const K = window.K, t = K.t, L = K.L, ico = K.ico, $ = K.$, $$ = K.$$;
  const fmtTime = s => { s = Math.max(0, Math.floor(s || 0)); return K.dg(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`); };
  const isTouch = matchMedia('(pointer: coarse)').matches;

  /* ================= 360 tour ================= */
  K.tour = {
    open(rid, roomId) {
      const r = K.r(rid); if (!r || !r.hasTour) return;
      let room = r.tour.find(x => x.id === roomId) || r.tour[0];
      let night = true, viewer = null;
      const rooms = r.tour.map(x => `<button class="tr-room ${x.id === room.id ? 'on' : ''}" data-room="${x.id}"><img src="${K.panoSrc.thumb(x.pano)}" alt="" loading="lazy"><span>${K.esc(L(x))}</span></button>`).join('');
      K.sheet.open({
        cls: 'full dark tour-sheet', grab: false, label: t('tour_of', { r: L(r.name) }), focus: '.tr-cv',
        html: `<div class="tr" style="--r-accent:${r.theme.accent}">
          <canvas class="tr-cv" tabindex="0" aria-label="${K.esc(t('tour_of', { r: L(r.name) }))}"></canvas>
          <div class="tr-spots"></div>
          <div class="tr-vig" aria-hidden="true"></div>
          <header class="tr-top">
            <div class="tr-id"><span class="tr-mono" style="background:${r.theme.accent};color:${r.theme.deep}">${r.mono}</span><div><b>${K.esc(L(r.name))}</b><span class="tr-sub"></span></div></div>
            <button class="ibtn glass" data-close aria-label="${t('close')}">${ico('x')}</button>
          </header>
          <div class="tr-hint" aria-hidden="true">${ico('hand-grabbing', 'lg')}<span>${isTouch ? t('tour_hint_touch') : t('tour_hint')}</span></div>
          <div class="tr-tools">
            <button class="ibtn glass" data-z="-12" aria-label="${t('zoom_in')}">${ico('plus')}</button>
            <button class="ibtn glass" data-z="12" aria-label="${t('zoom_out')}">${ico('minus')}</button>
            ${isTouch ? `<button class="ibtn glass" data-gyro aria-label="${t('use_motion')}" aria-pressed="false">${ico('device-rotate')}</button>` : `<button class="ibtn glass" data-fs aria-label="${t('fullscreen')}">${ico('corners-out')}</button>`}
          </div>
          <footer class="tr-bot">
            <div class="tr-dn" hidden><div class="seg dark"><button data-dn="day">${ico('sun', 'sm')}${t('day')}</button><button class="on" data-dn="night">${ico('moon', 'sm')}${t('night')}</button></div></div>
            ${r.tour.length > 1 ? `<div class="tr-rooms">${rooms}</div>` : ''}
            <div class="tr-cta"><a class="btn btn-glass" href="#/r/${rid}?go=menu">${ico('fork-knife')}${t('see_menu')}</a><a class="btn tr-call" href="tel:${r.phone}">${ico('phone')}${t('call_book')}</a></div>
          </footer>
          <div class="tr-load"><div class="ring"></div><span>${t('loading_4k')}</span></div>
        </div>`,
        onOpen: el => {
          const cv = $('.tr-cv', el), spotsEl = $('.tr-spots', el), sub = $('.tr-sub', el), load = $('.tr-load', el), hint = $('.tr-hint', el);
          const setSub = () => sub.textContent = `${L(room)} · ${t('captured')} ${L(r.mediaDate || K.data.updated)}`;
          setSub();
          if (!K.webgl) { el.querySelector('.tr').insertAdjacentHTML('beforeend', `<div class="tr-fail">${t('no_webgl')}</div>`); return; }
          const hi = !(navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')));
          viewer = K.Pano(cv, {
            yaw: room.yaw || 0, pitch: -4, fov: matchMedia('(max-width: 600px)').matches ? 88 : 76, hi, wheel: true, auto: 0, cap: (navigator.deviceMemory && navigator.deviceMemory < 4) ? 2048 : 4096,
            onReady: () => load.classList.add('done'),
            onUser: () => hint.classList.add('gone')
          });
          if (viewer.failed) return;
          const spots = () => {
            spotsEl.innerHTML = (room.spots || []).map((s, i) => s.to
              ? `<button class="spot go" data-i="${i}" data-to="${s.to}"><span class="pulse"></span><span class="lbl">${K.esc(L(r.tour.find(x => x.id === s.to)))}${ico('arrow-right', 'sm')}</span></button>`
              : `<button class="spot info" data-i="${i}" aria-label="${K.esc(L(s.info))}"><span class="dot">${ico('info', 'sm')}</span><span class="lbl">${K.esc(L(s.info))}</span></button>`).join('');
            viewer.setSpots((room.spots || []).map((s, i) => ({ yaw: s.yaw, pitch: s.pitch, el: spotsEl.children[i] })));
          };
          const dn = $('.tr-dn', el);
          const showDn = () => { dn.hidden = !room.day; night = true; $$('[data-dn]', el).forEach(b => b.classList.toggle('on', b.dataset.dn === 'night')); };
          viewer.load(room.pano).then(() => { });
          viewer.intro(2400);
          spots(); showDn();
          const goRoom = id => {
            const nr = r.tour.find(x => x.id === id); if (!nr || nr === room) return;
            room = nr; setSub(); spotsEl.innerHTML = ''; viewer.setSpots([]);
            $$('.tr-room', el).forEach(b => b.classList.toggle('on', b.dataset.room === id));
            viewer.load(room.pano, { fade: true, zoom: true, yaw: room.yaw }).then(() => { spots(); });
            setTimeout(spots, 800); showDn();
          };
          el.addEventListener('click', e => {
            const go = e.target.closest('[data-to]'); if (go) return goRoom(go.dataset.to);
            const info = e.target.closest('.spot.info'); if (info) { info.classList.toggle('open'); return; }
            const rm = e.target.closest('[data-room]'); if (rm) return goRoom(rm.dataset.room);
            const z = e.target.closest('[data-z]'); if (z) return viewer.zoom(Number(z.dataset.z));
            const d = e.target.closest('[data-dn]'); if (d && room.day) {
              const want = d.dataset.dn === 'night'; if (want === night) return; night = want;
              $$('[data-dn]', el).forEach(b => b.classList.toggle('on', b === d));
              viewer.load(night ? room.pano : room.day, { fade: true, dur: 1100 });
              return;
            }
            const g = e.target.closest('[data-gyro]'); if (g) { const on = g.getAttribute('aria-pressed') !== 'true'; viewer.enableGyro(on).then(ok => { g.setAttribute('aria-pressed', on && ok ? 'true' : 'false'); if (on && !ok) K.toast(t('motion_denied'), 'info'); }); return; }
            const fs = e.target.closest('[data-fs]'); if (fs) { const tr = $('.tr', el); if (document.fullscreenElement) document.exitFullscreen(); else tr.requestFullscreen && tr.requestFullscreen(); }
          });
          setTimeout(() => hint.classList.add('gone'), 6500);
        },
        onClose: () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); if (viewer) setTimeout(() => viewer.destroy(), 450); }
      });
    }
  };

  /* ================= film player ================= */
  K.film = {
    open(o) {
      let v;
      K.sheet.open({
        cls: 'full dark film-sheet', grab: false, label: o.title,
        html: `<div class="fm">
          <video class="fm-v" playsinline preload="auto" poster="${K.src(o.poster, 1600)}" src="${o.src}"></video>
          <header class="fm-top"><div><b>${K.esc(o.title)}</b>${o.sub ? `<span>${K.esc(o.sub)}</span>` : ''}</div><button class="ibtn glass" data-close aria-label="${t('close')}">${ico('x')}</button></header>
          <button class="fm-big" aria-label="${t('play')}">${ico('play-fill', 'lg')}</button>
          <div class="fm-end" hidden><p>${t('film_end')}</p><div class="fm-end-b">${o.after || ''}<button class="btn btn-glass" data-replay>${ico('arrow-clockwise')}${t('replay')}</button></div></div>
          <footer class="fm-bar">
            <button class="ibtn" data-pp aria-label="${t('pause')}">${ico('pause')}</button>
            <span class="fm-t num">0:00</span>
            <input class="fm-seek range" type="range" min="0" max="1000" value="0" aria-label="${t('seek')}">
            <span class="fm-d num">${o.len ? K.dg(o.len) : ''}</span>
            <button class="ibtn" data-mute aria-label="${t('mute')}">${ico('speaker-high')}</button>
          </footer>
        </div>`,
        onOpen: el => {
          v = $('.fm-v', el);
          const big = $('.fm-big', el), pp = $('[data-pp]', el), seek = $('.fm-seek', el), tm = $('.fm-t', el), du = $('.fm-d', el), mute = $('[data-mute]', el), end = $('.fm-end', el), wrap = $('.fm', el);
          const sync = () => { const paused = v.paused; pp.innerHTML = ico(paused ? 'play' : 'pause'); pp.setAttribute('aria-label', paused ? t('play') : t('pause')); big.classList.toggle('show', paused && !v.ended); wrap.classList.toggle('paused', paused); if (!paused) end.hidden = true; };
          const play = () => v.play().catch(() => { v.muted = true; mute.innerHTML = ico('speaker-slash'); v.play().catch(() => { }); });
          v.addEventListener('play', sync); v.addEventListener('pause', sync);
          v.addEventListener('loadedmetadata', () => du.textContent = fmtTime(v.duration));
          v.addEventListener('timeupdate', () => { tm.textContent = fmtTime(v.currentTime); if (v.duration) { const p = v.currentTime / v.duration * 1000; seek.value = p; seek.style.setProperty('--p', p / 10 + '%'); } });
          v.addEventListener('ended', () => { end.hidden = false; sync(); });
          seek.addEventListener('input', () => { end.hidden = true; if (v.duration) v.currentTime = seek.value / 1000 * v.duration; });
          pp.onclick = big.onclick = () => v.paused ? play() : v.pause();
          v.onclick = () => v.paused ? play() : v.pause();
          mute.onclick = () => { v.muted = !v.muted; mute.innerHTML = ico(v.muted ? 'speaker-slash' : 'speaker-high'); };
          $('[data-replay]', el).onclick = () => { end.hidden = true; v.currentTime = 0; play(); };
          let idle; const wake = () => { wrap.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => !v.paused && wrap.classList.add('idle'), 2600); };
          wrap.addEventListener('pointermove', wake); wrap.addEventListener('pointerdown', wake); wake();
          el.addEventListener('keydown', e => { if (e.key === ' ' && e.target === document.body || e.key === 'k') { e.preventDefault(); v.paused ? play() : v.pause(); } });
          play(); sync();
        },
        onClose: () => { if (v) { v.pause(); v.removeAttribute('src'); v.load(); } }
      });
    }
  };

  /* ================= photo lightbox ================= */
  K.lightbox = {
    open(items, i0 = 0, title = '') {
      K.sheet.open({
        cls: 'full dark lb-sheet', grab: false, label: title || t('photos'),
        html: `<div class="lb"><header class="lb-top"><b>${K.esc(title)}</b><span class="lb-n num"></span><button class="ibtn glass" data-close aria-label="${t('close')}">${ico('x')}</button></header>
          <div class="lb-track">${items.map(id => `<figure class="lb-f"><img src="${K.src(id, 1800)}" alt="" loading="lazy" decoding="async" onload="this.classList.add('ld')"></figure>`).join('')}</div>
          <button class="ibtn glass lb-nav l" data-lb="-1" aria-label="${t('prev')}">${ico('caret-left')}</button><button class="ibtn glass lb-nav r" data-lb="1" aria-label="${t('next')}">${ico('caret-right')}</button></div>`,
        onOpen: el => {
          const tr = $('.lb-track', el), n = $('.lb-n', el);
          const idx = () => Math.round(tr.scrollLeft / tr.clientWidth);
          const upd = () => n.textContent = `${K.n(idx() + 1)} / ${K.n(items.length)}`;
          requestAnimationFrame(() => { tr.scrollLeft = i0 * tr.clientWidth; upd(); });
          tr.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
          const go = d => tr.scrollTo({ left: (idx() + d) * tr.clientWidth, behavior: 'smooth' });
          $$('[data-lb]', el).forEach(b => b.onclick = () => go(Number(b.dataset.lb)));
          el.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
        }
      });
    }
  };

  /* ================= 3D dish (model-viewer, loaded only when asked) ================= */
  let mvLib = null;
  const MV = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
  K.d3 = {
    lib() { return mvLib || (mvLib = new Promise((res, rej) => { if (customElements.get('model-viewer')) return res(); const s = document.createElement('script'); s.type = 'module'; s.src = MV; s.onload = () => customElements.whenDefined('model-viewer').then(res); s.onerror = rej; document.head.appendChild(s); })); },
    models() { return K.models ? Promise.resolve(K.models) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'media/dish-3d-models.js'; s.onload = () => res(K.models); s.onerror = rej; document.head.appendChild(s); }); },
    url(id) { const g = K.models[id]; if (!g._blob) g._blob = URL.createObjectURL(new Blob([JSON.stringify(g)], { type: 'model/gltf+json' })); return g._blob; },
    /* mount a live 3D view into el. o.compact: no AR button / smaller UI */
    mount(el, id, o = {}) {
      el.classList.add('d3');
      el.innerHTML = `<div class="d3-load"><div class="d3-bar"><i></i></div><span>${t('loading_3d')}</span></div>`;
      return Promise.all([this.lib(), this.models()]).then(() => {
        const mv = document.createElement('model-viewer');
        mv.setAttribute('src', this.url(id));
        mv.setAttribute('alt', o.alt || '');
        ['camera-controls', 'auto-rotate', 'ar'].forEach(a => mv.setAttribute(a, ''));
        mv.setAttribute('auto-rotate-delay', '0'); mv.setAttribute('rotation-per-second', o.compact ? '18deg' : '24deg');
        mv.setAttribute('interaction-prompt', 'none'); mv.setAttribute('shadow-intensity', '1.1'); mv.setAttribute('shadow-softness', '.9');
        mv.setAttribute('exposure', '1.05'); mv.setAttribute('environment-image', 'neutral'); mv.setAttribute('tone-mapping', 'commerce');
        mv.setAttribute('camera-orbit', '25deg 68deg auto'); mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look'); mv.setAttribute('touch-action', 'pan-y');
        if (o.compact) mv.removeAttribute('camera-controls');
        mv.innerHTML = o.compact ? '' : `<button slot="ar-button" class="btn btn-white d3-ar">${ico('cube-focus')}${t('view_table')}</button>`;
        mv.addEventListener('progress', e => { const b = el.querySelector('.d3-bar i'); if (b) b.style.width = Math.round(e.detail.totalProgress * 100) + '%'; });
        mv.addEventListener('load', () => { el.classList.add('ready'); const l = el.querySelector('.d3-load'); l && l.remove(); });
        mv.addEventListener('error', () => { el.innerHTML = `<div class="d3-fail">${t('d3_fail')}</div>`; });
        el.appendChild(mv);
        return mv;
      }).catch(() => { el.innerHTML = `<div class="d3-fail">${t('d3_fail')}</div>`; });
    }
  };

  /* restaurant films: promo or kitchen, with next steps at the end */
  K.openFilm = (rid, kind) => {
    const r = K.r(rid); if (!r) return;
    const k = kind === 'kitchen' && r.kitchen;
    const f = k ? r.kitchen : r.film; if (!f) return;
    K.film.open({
      src: f.src, poster: f.poster, len: f.len,
      title: k ? t('kitchen_of', { r: L(r.name) }) : L(r.name),
      sub: k ? L(r.kitchen.date) : `${t('film')} · ${t('captured')} ${L(r.mediaDate || K.data.updated)}`,
      after: `${r.hasTour ? `<button class="btn btn-gold" data-film-tour="${rid}">${ico('virtual-reality')}${t('step_inside')}</button>` : ''}<a class="btn btn-glass" href="#/r/${rid}?go=menu">${ico('fork-knife')}${t('see_menu')}</a>`
    });
  };
  document.addEventListener('click', e => {
    const tb = e.target.closest('[data-tour]');
    if (tb) { e.preventDefault(); const [rid, room] = tb.dataset.tour.split('|'); K.tour.open(rid, room); return; }
    const ft = e.target.closest('[data-film-tour]');
    if (ft) { e.preventDefault(); const rid = ft.dataset.filmTour; K.sheet.close().then(() => K.tour.open(rid)); return; }
    const fb = e.target.closest('[data-film]');
    if (fb) { e.preventDefault(); const [rid, kind] = fb.dataset.film.split('|'); K.openFilm(rid, kind); }
  });

  /* ================= inline 360 (restaurant page + home) ================= */
  K.inlinePano = (host, pano, o = {}) => {
    const cv = host.querySelector('canvas'); if (!cv || !K.webgl) return null;
    const v = K.Pano(cv, Object.assign({ yaw: 0, pitch: -4, fov: 80, auto: 3, wheel: false, scale: o.scale || 1, dprCap: o.dprCap || 1.5 }, o));
    if (v.failed) return null;
    v.load(pano, { hi: o.hi });
    K.onLeave(() => v.destroy());
    return v;
  };
})();
