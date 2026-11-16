/* khabo compare prototype (PRD D-6). Pick 2 or 3 restaurants; the choice lives in ?ids=a,b,c */
(function () {
  'use strict';
  const F = window.F; if (!F) return;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = F.esc, ico = F.ico, L = F.L;
  const DEFAULT = ['shahi-handi', 'nawabpur-kacchi', 'mirpur-bawarchi'];
  $('#bar').outerHTML = F.siteBar('compare');

  let ids = (new URLSearchParams(location.search).get('ids') || '').split(',').map(s => s.trim()).filter((id, i, a) => F.r(id) && a.indexOf(id) === i).slice(0, 3);
  if (ids.length < 2) DEFAULT.forEach(id => { if (ids.length < 2 && !ids.includes(id)) ids.push(id); });

  const sync = () => history.replaceState(null, '', `?ids=${ids.join(',')}`);
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const openNow = r => {
    const now = new Date(), m = now.getHours() * 60 + now.getMinutes(), o = toMin(r.hours[0]); let c = toMin(r.hours[1]);
    if (c <= o) c += 1440;
    const mm = m < o && m + 1440 < c ? m + 1440 : m;
    return mm >= o && mm < c;
  };
  const late = r => { const c = toMin(r.hours[1]); return c <= toMin('04:00') || c >= toMin('23:30'); };
  const allIn = (r, p) => p * (1 + (r.vat + r.service) / 100);
  const side = d => /^1 piece$/i.test(d.por ? d.por.en : ''); // a single shami or jali kabab is a side, not a main
  const cheapestMain = r => F.menu(r.id).filter(d => F.isMain(d) && !side(d) && !d.soldOut).sort((a, b) => a.price - b.price)[0] || null;
  const media = r => ({ rooms: (r.tour || []).length, film: r.film ? r.film.len : '', kitchen: !!r.kitchen, d3: r.menu.filter(d => d.d3).length });

  /* mark the best value in a row when values differ */
  const bestOf = (vals, dir) => {
    const ok = vals.filter(v => v != null); if (ok.length < 2 || ok.every(v => v === ok[0])) return null;
    return dir === 'min' ? Math.min(...ok) : Math.max(...ok);
  };
  const tag = t => `<span class="tag indigo best">${t}</span>`;

  function render() {
    const rs = ids.map(F.r), n = rs.length;
    const cmp = $('#cmp'); cmp.style.setProperty('--n', n);
    $('#add').hidden = n > 2;
    const row = (label, cells, cls = '') => `<div class="cmp-row ${cls}"><div class="lab">${label}</div>${cells.join('')}</div>`;

    /* head with selectors */
    const sel = (r, i) => `<select class="select sm" data-slot="${i}" aria-label="Restaurant ${i + 1}">${F.all().map(o => `<option value="${o.id}" ${o.id === r.id ? 'selected' : ''} ${o.id !== r.id && ids.includes(o.id) ? 'disabled' : ''}>${esc(L(o.name))}</option>`).join('')}</select>`;
    const head = `<div class="cmp-row head"><div class="lab">${n} restaurants</div>${rs.map((r, i) => `<div class="hd">
        <div class="hd-top">${F.thumb(r.hero && r.hero[0], '')}<div>${sel(r, i)}<span class="sub">${esc(F.where(r))}</span></div></div>
        <div class="acts"><a class="btn sm ghost" href="${F.pageUrl(r.id)}">${ico('arrow-up-right')}Open page</a>${n > 2 ? `<button class="btn sm ghost" type="button" data-remove="${i}" aria-label="Remove ${esc(L(r.name))}">${ico('x')}Remove</button>` : ''}</div></div>`).join('')}</div>`;

    /* price per person */
    const mids = rs.map(r => (r.ppl[0] + r.ppl[1]) / 2), bMid = bestOf(mids, 'min');
    const price = row('Price per person<span class="sub">before VAT and service</span>', rs.map((r, i) => `<div><div class="v big">${F.pp(r)}</div>${mids[i] === bMid ? tag('Lowest') : ''}</div>`));

    /* rating */
    const bR = bestOf(rs.map(r => r.rating), 'max');
    const rating = row('Rating', rs.map(r => `<div><div class="row" style="gap:8px"><span class="v big">${r.rating.toFixed(1)}</span>${F.stars(Math.round(r.rating))}</div><div class="small muted">${F.n(r.reviews)} reviews, ${F.n(r.verified)} verified</div>${r.rating === bR ? tag('Highest') : ''}</div>`));

    /* VAT + service */
    const ch = rs.map(r => r.vat + r.service), bC = bestOf(ch, 'min');
    const charges = row('VAT and service<span class="sub">added to the bill</span>', rs.map((r, i) => `<div><div class="v">${r.vat || r.service ? `${r.vat}% VAT + ${r.service}% service` : 'None'}</div><div class="small muted">A ${F.tk(1000)} bill comes to ${F.tk(allIn(r, 1000))}</div>${ch[i] === bC ? tag('Lowest') : ''}</div>`));

    /* hours */
    const hours = row('Open hours', rs.map(r => { const o = openNow(r); return `<div><div class="v">${F.hours(r)}</div><div class="open ${o ? '' : 'closed'}"><span class="dot"></span>${o ? 'Open now' : 'Closed now'}</div>${late(r) ? '<span class="tag best">Late night</span>' : ''}</div>`; }));

    /* cheapest main */
    const mains = rs.map(cheapestMain), ai = mains.map((d, i) => d ? allIn(rs[i], d.price) : null), bM = bestOf(ai, 'min');
    const cheap = row('Cheapest main dish<span class="sub">not counting drinks, desserts or single-piece sides</span>', mains.map((d, i) => d
      ? `<div><div class="row" style="gap:10px;align-items:flex-start">${F.thumb(d.p)}<div style="min-width:0"><div style="font-weight:600">${esc(L(d.name))}</div><div class="v">${F.tk(d.price)}</div></div></div><div class="small muted" style="margin-top:6px">${esc(d.por ? L(d.por) : '')}${d.por ? '. ' : ''}${F.tk(ai[i])} with VAT and service</div>${ai[i] === bM ? tag('Lowest') : ''}</div>`
      : `<div><span class="no">No main dishes on the menu. ${esc(F.L(F.D.cuisines.find(c => c.id === rs[i].cuisines[0])))} menu.</span></div>`));

    /* facilities */
    const facIds = Object.keys(F.D.facilities).filter(f => rs.some(r => r.fac.includes(f)));
    const facHead = row('Facilities', rs.map(r => `<div class="small muted">${r.fac.length} of ${Object.keys(F.D.facilities).length} listed</div>`), 'sect');
    const facRows = facIds.map(f => row(`${ico(F.facility(f).i, 'sm')}${esc(L(F.facility(f)))}`, rs.map(r => `<div>${r.fac.includes(f) ? `<span class="yes">${ico('check', 'sm')}Yes</span>` : '<span class="no">Not listed</span>'}</div>`), 'sub-row')).join('');

    /* media */
    const ms = rs.map(media);
    const medHead = row('See before you go', rs.map(() => '<div></div>'), 'sect');
    const yes = t => `<span class="yes">${ico('check', 'sm')}${esc(t)}</span>`, no = '<span class="no">Not yet</span>';
    const medRows = [
      row(`${ico('virtual-reality', 'sm')}360 tour`, ms.map(m => `<div>${m.rooms ? yes(`${m.rooms} room${m.rooms > 1 ? 's' : ''}`) : no}</div>`), 'sub-row'),
      row(`${ico('film-strip', 'sm')}Film`, ms.map(m => `<div>${m.film ? yes(`${m.film} film${m.kitchen ? ', plus kitchen' : ''}`) : m.kitchen ? yes('Kitchen film') : no}</div>`), 'sub-row'),
      row(`${ico('cube', 'sm')}3D dishes`, ms.map(m => `<div>${m.d3 ? yes(`${m.d3} dish${m.d3 > 1 ? 'es' : ''}`) : no}</div>`), 'sub-row')
    ].join('');

    cmp.innerHTML = head + price + rating + charges + hours + cheap + facHead + facRows + medHead + medRows;
    document.title = `${rs.map(r => L(r.name)).join(' vs ')} · khabo`;
  }

  document.addEventListener('change', e => {
    const s = e.target.closest('[data-slot]'); if (!s) return;
    ids[+s.dataset.slot] = s.value; sync(); render();
  });
  document.addEventListener('click', e => {
    const rm = e.target.closest('[data-remove]');
    if (rm) { ids.splice(+rm.dataset.remove, 1); sync(); render(); return; }
    if (e.target.closest('#add')) {
      const next = F.all().map(r => r.id).filter(id => !ids.includes(id)).sort((a, b) => (F.r(b).city === F.r(ids[0]).city) - (F.r(a).city === F.r(ids[0]).city))[0];
      if (next) { ids.push(next); sync(); render(); const s = document.querySelector('[data-slot="2"]'); if (s) s.focus(); }
    }
    if (e.target.closest('#copy')) {
      const url = location.href;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => F.toast('Link copied'), () => F.toast(url));
    }
  });

  sync(); render();
})();
