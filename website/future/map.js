/* khabo map prototype (PRD D-7). Leaflet 1.9.4 + OpenStreetMap tiles.
   The restaurants are fictional, so each pin sits near its area centre with a small offset derived from its id. */
(function () {
  'use strict';
  const F = window.F; if (!F) return;
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = F.esc, ico = F.ico, L = F.L, D = F.D;
  $('#bar').outerHTML = F.siteBar('map');

  const CENTRES = {
    dhanmondi: [23.7461, 90.3742], gulshan: [23.7925, 90.4078], banani: [23.7937, 90.4066], mirpur: [23.8223, 90.3654],
    mohammadpur: [23.7662, 90.3589], uttara: [23.8759, 90.3795], 'old-dhaka': [23.7104, 90.4074],
    jaleshwaritola: [24.8465, 89.3776], satmatha: [24.8481, 89.3730]
  };
  /* 150 to 600 m from the area centre, in a direction set by the id */
  const spot = r => {
    const c = CENTRES[r.area] || [23.78, 90.39], h = F.hash(r.id);
    const ang = (h % 3600) / 3600 * Math.PI * 2, dist = 150 + (h >>> 12) % 451;
    return [c[0] + dist * Math.cos(ang) / 111320, c[1] + dist * Math.sin(ang) / (111320 * Math.cos(c[0] * Math.PI / 180))];
  };

  /* ---------- filters (kept in the URL) ---------- */
  const qs = new URLSearchParams(location.search);
  const S = { city: qs.has('city') ? qs.get('city') : 'dhaka', bud: qs.get('bud') || '' };
  if (S.city && !D.cities[S.city]) S.city = 'dhaka';
  if (S.bud && !D.budgets.some(b => b.id === S.bud)) S.bud = '';
  $('#city').innerHTML = `<option value="">All cities</option>${Object.keys(D.cities).map(c => `<option value="${c}">${esc(L(D.cities[c]))}</option>`).join('')}`;
  $('#bud').innerHTML = `<option value="">Any budget</option>${D.budgets.map(b => `<option value="${b.id}">${esc(L(b))} per person</option>`).join('')}`;
  $('#city').value = S.city; $('#bud').value = S.bud;
  const budOk = r => { const b = D.budgets.find(x => x.id === S.bud); return !b || (r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0)); };
  const visible = () => F.all().filter(r => (!S.city || r.city === S.city) && budOk(r)).sort((a, b) => b.rating - a.rating);
  const syncUrl = () => { const p = new URLSearchParams(); if (S.city !== 'dhaka') p.set('city', S.city || ''); if (S.bud) p.set('bud', S.bud); const q = p.toString(); history.replaceState(null, '', q ? `?${q}` : location.pathname); };

  /* ---------- map ---------- */
  let map = null; const markers = {};
  const hasLeaflet = !!window.L && !!window.L.map;
  if (hasLeaflet) {
    map = window.L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView([23.78, 90.39], 12);
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    F.all().forEach(r => {
      const icon = window.L.divIcon({ className: 'pin-wrap', html: `<span class="pin" style="--c:${r.theme.accent};--d:${r.theme.deep}"></span>`, iconSize: [26, 26], iconAnchor: [13, 31], popupAnchor: [0, -30] });
      const m = window.L.marker(spot(r), { icon, title: L(r.name), riseOnHover: true, keyboard: true }).bindPopup(() => popup(r), { maxWidth: 260, minWidth: 240, autoPanPadding: [24, 24] });
      m.on('mouseover', () => hl(r.id, true, 'pin')); m.on('mouseout', () => hl(r.id, false, 'pin'));
      m.on('popupopen', () => hl(r.id, true, 'popup')); m.on('popupclose', () => hl(r.id, false, 'popup'));
      markers[r.id] = m;
    });
    /* keep tiles and pins aligned when the panel layout changes size (mobile sticky map, window resizes) */
    if ('ResizeObserver' in window) { let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => map.invalidateSize(), 80); }).observe($('#map')); }
  } else {
    $('#map').innerHTML = '<div class="map-msg"><div><b>The map could not load.</b><br>Check the internet connection. The list on the left still works.</div></div>';
  }

  function popup(r) {
    const near = F.all().filter(o => o.id !== r.id && o.city === r.city).sort((a, b) => Math.hypot(spot(a)[0] - spot(r)[0], spot(a)[1] - spot(r)[1]) - Math.hypot(spot(b)[0] - spot(r)[0], spot(b)[1] - spot(r)[1]))[0];
    return `<div class="pop">${r.hero && r.hero[0] ? `<img src="${F.src(r.hero[0], 480)}" alt="">` : ''}<div class="pb">
      <b>${esc(L(r.name))}</b><span>${esc(L(r.spot))}</span>
      <span>${F.pp(r)} per person</span>
      <span>${ico('star-fill')} ${r.rating.toFixed(1)} from ${F.n(r.reviews)} reviews</span>
      <div class="acts"><a class="btn sm primary" href="${F.pageUrl(r.id)}">Open page</a>${near ? `<a class="btn sm" href="compare.html?ids=${r.id},${near.id}" title="Compare with ${esc(L(near.name))}">Compare</a>` : ''}</div></div></div>`;
  }

  /* highlight a pin and its row. Sources: list hover, pin hover, open popup */
  const hot = {};
  function hl(id, on, src) {
    hot[id] = hot[id] || new Set(); on ? hot[id].add(src) : hot[id].delete(src);
    const lit = hot[id].size > 0, m = markers[id];
    if (m && m.getElement()) { m.getElement().classList.toggle('hl', lit); m.setZIndexOffset(lit ? 1000 : 0); }
    const row = $(`.item[data-id="${CSS.escape(id)}"]`); if (row) row.classList.toggle('hl', lit);
  }

  /* ---------- list ---------- */
  function render(fit) {
    const rs = visible(), ids = new Set(rs.map(r => r.id));
    $('#count').innerHTML = rs.length ? `${rs.length} restaurant${rs.length > 1 ? 's' : ''}${S.city ? ` in ${esc(L(D.cities[S.city]))}` : ''}, best rated first` : '';
    $('#list').innerHTML = rs.length ? rs.map(r => `<div class="item" data-id="${r.id}" tabindex="0" role="button" aria-label="${esc(L(r.name))}, ${esc(F.where(r))}. Show on map">
        ${r.hero && r.hero[0] ? `<img class="ph" src="${F.src(r.hero[0], 160)}" alt="" loading="lazy">` : '<span class="ph"></span>'}
        <div style="min-width:0"><b><span class="pin-dot" style="--c:${r.theme.accent};--d:${r.theme.deep}"></span>${esc(L(r.name))}</b>
          <div class="l2">${esc(L(r.spot))}</div>
          <div class="l3"><span>${F.pp(r)}</span><span>${ico('star-fill')} ${r.rating.toFixed(1)} <span class="muted">(${F.n(r.reviews)})</span></span>${r.featured ? '<span class="tag indigo">Featured</span>' : ''}</div></div></div>`).join('')
      : `<div class="empty"><div class="em-ic">${ico('map-pin')}</div><h3>No restaurants match</h3><p>Nothing ${S.city ? `in ${esc(L(D.cities[S.city]))} ` : ''}fits this budget yet.</p><button class="btn" type="button" id="clear">Show every budget</button></div>`;
    if (!map) return;
    Object.entries(markers).forEach(([id, m]) => { if (ids.has(id)) { if (!map.hasLayer(m)) m.addTo(map); } else if (map.hasLayer(m)) { m.closePopup(); map.removeLayer(m); } });
    if (fit) {
      const pts = rs.map(spot);
      const area = pts.length ? pts : F.all().filter(r => !S.city || r.city === S.city).map(spot);
      if (area.length === 1) map.setView(area[0], 15); else if (area.length) map.fitBounds(area, { padding: [48, 48], maxZoom: 15 });
    }
  }

  const list = $('#list');
  list.addEventListener('mouseover', e => { const it = e.target.closest('.item'); if (it && !it.contains(e.relatedTarget)) hl(it.dataset.id, true, 'row'); });
  list.addEventListener('mouseout', e => { const it = e.target.closest('.item'); if (it && !it.contains(e.relatedTarget)) hl(it.dataset.id, false, 'row'); });
  list.addEventListener('focusin', e => { const it = e.target.closest('.item'); if (it) hl(it.dataset.id, true, 'row'); });
  list.addEventListener('focusout', e => { const it = e.target.closest('.item'); if (it) hl(it.dataset.id, false, 'row'); });
  const go = id => {
    const m = markers[id]; if (!map || !m) { location.href = F.pageUrl(id); return; }
    map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.6 });
    map.once('moveend', () => m.openPopup());
    if (window.innerWidth <= 860) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  list.addEventListener('click', e => { if (e.target.closest('#clear')) { S.bud = ''; $('#bud').value = ''; syncUrl(); render(true); return; } const it = e.target.closest('.item'); if (it) go(it.dataset.id); });
  list.addEventListener('keydown', e => { const it = e.target.closest('.item'); if (it && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(it.dataset.id); } });
  $('#city').onchange = e => { S.city = e.target.value; syncUrl(); render(true); };
  $('#bud').onchange = e => { S.bud = e.target.value; syncUrl(); render(true); };

  render(true);
})();
