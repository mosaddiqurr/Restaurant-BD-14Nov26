/* Restaurant map: one module for every map on the site (home today; area pages and a full map page later).

   Built to grow from a dozen restaurants to thousands:
   - Positions come only from data: r.geo = [lat, lng], pinned by our team at onboarding (BRANCH.lat/lng in the ERD).
     A restaurant without r.geo falls back to its area centre and is drawn as an approximate pin.
   - Leaflet and the map tiles load only when the map scrolls near the screen.
   - Labels never pile up: when two names would overlap, the better-rated one keeps its label
     and the other shows its monogram until you zoom in, hover or tap.
   - When a view holds too many pins (CLUSTER_AT), pins collapse into one bubble per area with a count. */
(function () {
  const K = window.K, t = K.t, L = K.L;
  const CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  const JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  /* OpenStreetMap tiles are fine for the preview; production should use a paid tile plan or our own tiles (see docs/17-tech-stack.md) */
  const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
  const CLUSTER_AT = 60, CLUSTER_BELOW_ZOOM = 14;

  let loading = null;
  const load = () => window.L && window.L.map ? Promise.resolve(true) : (loading = loading || new Promise(res => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = CSS; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = JS; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s);
  }));

  /* where a restaurant is: its pinned spot, or its area centre when not pinned yet */
  K.geoOf = r => r.geo ? { ll: r.geo, exact: true } : { ll: (K.LL[r.area] || [23.78, 90.39]), exact: false };

  const card = r => {
    const os = K.openState(r);
    return `<a class="mpc" href="#/r/${r.id}">${K.img(r.hero[0], { w: 480, alt: '' })}
      <span class="mpc-b"><span class="mpc-t">${K.mono(r)}<b>${K.esc(L(r.name))}</b></span>
      <span class="mpc-m">${K.esc(L(r.spot))}</span>
      <span class="mpc-f"><span class="num">${K.ico('star-fill', 'sm')}${K.n(r.rating)}</span><span class="num">${K.ppRange(r)}</span><span class="${os.open ? 'open-now' : 'closed'}">${os.open ? t('open_now') : t('closed_now')}</span></span></span></a>`;
  };

  /* mount(el, { list, fit }) -> { show(list), destroy() } */
  K.restMap = (el, opts = {}) => {
    let map = null, layer = null, list = opts.list || [], dead = false;
    const touch = matchMedia('(pointer: coarse)').matches;
    const api = {
      show(next) { list = next; if (map) draw(true); },
      destroy() { dead = true; if (map) { map.remove(); map = null; } }
    };
    load().then(ok => {
      if (dead) return;
      if (!ok) { el.classList.add('mp-fail'); el.innerHTML = `<p class="meta">${t('map_fail')}</p>`; return; }
      const Lf = window.L;
      map = Lf.map(el, { zoomSnap: .25, zoomDelta: .5, zoomControl: false, scrollWheelZoom: false, dragging: !touch, tap: false, attributionControl: true, minZoom: 6, maxZoom: 18 });
      Lf.control.zoom({ position: 'bottomright' }).addTo(map);
      Lf.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map);
      /* wheel zoom only after the map is clicked, so scrolling the page never gets stuck on it */
      map.on('click focus', () => map.scrollWheelZoom.enable());
      el.addEventListener('mouseleave', () => map && map.scrollWheelZoom.disable());
      /* zooming only redraws when switching between pins and area bubbles; otherwise it just re-checks labels */
      map.on('zoomend', () => { if (mode() !== drawn) draw(false); else declutter(); });
      draw(true);
    });

    let drawn = null;
    const mode = () => list.length > CLUSTER_AT && map.getZoom() < CLUSTER_BELOW_ZOOM ? 'areas' : 'pins';
    function draw(refit) {
      const Lf = window.L; if (!map) return;
      if (refit && list.length) {
        map.invalidateSize(false);
        const b = Lf.latLngBounds(list.map(r => K.geoOf(r).ll));
        map.fitBounds(b, { padding: [44, 44], maxZoom: 15, animate: false });
      }
      if (layer) layer.remove();
      layer = Lf.layerGroup().addTo(map);
      drawn = mode();
      if (drawn === 'areas') return drawAreas(list);
      /* best rated first, so they win the label space */
      const sorted = list.slice().sort((a, b) => b.rating - a.rating);
      sorted.forEach(r => {
        const g = K.geoOf(r);
        const icon = Lf.divIcon({ className: 'mk-w', iconSize: null, html: `<span class="mk ${g.exact ? '' : 'approx'}" style="--r-deep:${r.theme.deep};--r-accent:${r.theme.accent}"><i>${r.mono}</i><b>${K.esc(L(r.name))}</b></span>` });
        const m = Lf.marker(g.ll, { icon, title: L(r.name), riseOnHover: true, keyboard: true, zIndexOffset: Math.round(r.rating * 100) }).addTo(layer);
        m.bindPopup(card(r), { className: 'mpp', closeButton: true, maxWidth: 280, minWidth: 240, offset: [0, -14], autoPanPadding: [24, 24] });
        m._r = r;
      });
      requestAnimationFrame(declutter);
    }

    /* place each label to the right of its pin, else to the left, else hide it until hover or zoom.
       Better-rated restaurants are placed first, and no label may cover another restaurant's pin. */
    function declutter() {
      if (!map) return;
      const mks = [];
      layer.eachLayer(m => { const n = m.getElement && m.getElement(), mk = n && n.querySelector('.mk'); if (mk) { mk.classList.remove('nolabel', 'left'); mks.push(mk); } });
      const pins = mks.map(mk => { const r = mk.querySelector('i').getBoundingClientRect(); return { l: r.left - 2, r: r.right + 2, t: r.top - 2, b: r.bottom + 2, mk }; });
      const hit = (x, list) => list.some(p => x.l < p.r && x.r > p.l && x.t < p.b && x.b > p.t);
      const placed = [];
      mks.forEach(mk => {
        const i = mk.querySelector('i').getBoundingClientRect(), b = mk.querySelector('b').getBoundingClientRect(), w = b.width, gap = b.left - i.right;
        const others = pins.filter(p => p.mk !== mk);
        const right = { l: i.right + gap - 2, r: i.right + gap + w + 2, t: b.top - 2, b: b.bottom + 2 };
        const left = { l: i.left - gap - w - 2, r: i.left - gap + 2, t: b.top - 2, b: b.bottom + 2 };
        const box = el.getBoundingClientRect(), inside = x => x.l > box.left + 4 && x.r < box.right - 4;
        if (inside(right) && !hit(right, placed) && !hit(right, others)) placed.push(right);
        else if (inside(left) && !hit(left, placed) && !hit(left, others)) { mk.classList.add('left'); placed.push(left); }
        else mk.classList.add('nolabel');
      });
    }

    function drawAreas(rs) {
      const Lf = window.L, by = {};
      rs.forEach(r => { (by[r.area] = by[r.area] || []).push(r); });
      Object.entries(by).forEach(([a, items]) => {
        const c = K.LL[a] || K.geoOf(items[0]).ll;
        const icon = Lf.divIcon({ className: 'mk-w', iconSize: null, html: `<span class="mk-area"><b class="num">${K.n(items.length)}</b><span>${K.esc(L(K.areaOf(a)))}</span></span>` });
        Lf.marker(c, { icon, keyboard: true, title: L(K.areaOf(a)) }).on('click', () => map.setView(c, CLUSTER_BELOW_ZOOM)).addTo(layer);
      });
    }

    api.touch = touch;
    return api;
  };
})();
