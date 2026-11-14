/* khabo admin panel prototype (PRD 4.10, AD-1 to AD-12). Hash routes, one page, no backend. */
(function () {
  'use strict';
  const F = window.F; if (!F) return;
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = F.esc, ico = F.ico, L = F.L;
  const ME = { name: 'Rumana Akter', role: 'Admin' };
  const DAY = 864e5;
  const main = $('#main'), nav = $('#nav');

  const NAV = [
    ['restaurants', 'Restaurants', 'storefront'], ['menus', 'Menus & prices', 'receipt'], ['media', 'Media', 'images'], '-',
    ['reviews', 'Reviews queue', 'chats-circle'], '-',
    ['deals', 'Deals & featured', 'tag'], ['billing', 'Plans & billing', 'credit-card'], ['leads', 'Leads', 'briefcase'], '-',
    ['reports', 'Reports', 'chart-line-up'], ['stale', 'Staleness alerts', 'clock-countdown'], ['team', 'Team', 'users-three']
  ];
  const SOURCES = ['WhatsApp from owner', 'Phone call', 'Visit', 'Admin panel'];
  const S = {
    q: '', city: '', plan: '',
    rid: F.store.get('admin.rid', 'shahi-handi'),
    source: F.store.get('admin.source', SOURCES[0]),
    rvTab: 'pending', rvR: '',
    staleDays: F.store.get('admin.staleDays', 30),
    leadOwner: ''
  };
  if (!F.r(S.rid)) S.rid = F.all()[0].id;

  const head = (title, desc, actions = '') => `<div class="ph"><div><h1>${esc(title)}</h1>${desc ? `<p>${desc}</p>` : ''}</div>${actions ? `<div class="row">${actions}</div>` : ''}</div>`;
  const empty = (icon, title, text, action = '') => `<div class="empty"><div class="em-ic">${ico(icon)}</div><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ''}${action}</div>`;
  const rOptions = sel => F.all().map(r => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(L(r.name))} (${esc(L(F.area(r.area)))})</option>`).join('');
  const phone = p => p.replace(/^\+880(\d{4})(\d+)$/, '+880 $1 $2');
  const norm = s => F.bnDigits(String(s || '')).toLowerCase().replace(/[^a-z0-9ঀ-৿]+/g, ' ').trim();

  /* ---------- counts in the sidebar ---------- */
  const pendingCount = () => F.reviews().filter(x => x.status === 'pending').length;
  const staleList = (thr = S.staleDays) => F.all().map(r => { const t = F.confirmed(r.id); return { r, t, d: F.daysSince(t), sn: F.snoozed(r.id) }; });
  const overdueCount = () => staleList().filter(x => x.d >= S.staleDays && !x.sn).length;

  function paintNav(view) {
    const counts = { reviews: pendingCount(), stale: overdueCount() };
    nav.innerHTML = NAV.map(n => n === '-' ? '<hr>' : `<a href="#/${n[0]}" class="${view === n[0] ? 'on' : ''}" ${view === n[0] ? 'aria-current="page"' : ''}>${ico(n[2])}<span>${n[1]}</span>${counts[n[0]] ? `<span class="count ${n[0] === 'stale' ? 'alert' : ''}">${counts[n[0]]}</span>` : ''}</a>`).join('');
  }

  /* ---------- router ---------- */
  const VIEWS = {};
  function route() {
    const [v, arg] = location.hash.replace(/^#\/?/, '').split('/');
    const view = VIEWS[v] ? v : 'restaurants';
    paintNav(view);
    VIEWS[view](arg ? decodeURIComponent(arg) : '');
    const n = NAV.find(x => x[0] === view);
    document.title = `${n ? n[1] : 'Admin'} · khabo Admin`;
  }
  window.addEventListener('hashchange', () => { route(); main.focus({ preventScroll: true }); window.scrollTo(0, 0); });

  $('#reset').onclick = async () => {
    if (await F.confirm('Reset demo data', 'This clears every edit made in these prototypes in this browser: prices, sold-out flags, reviews, deals and leads.', 'Reset', true)) { F.reset(); location.reload(); }
  };

  /* =====================================================================
     Restaurants
     ===================================================================== */
  VIEWS.restaurants = function () {
    main.innerHTML = head('Restaurants', `${F.all().length} restaurants in Dhaka and Bogura. Select a restaurant to edit its menu.`) + `
      <div class="card"><div class="toolbar">
        <label class="search">${ico('magnifying-glass', 'sm')}<input class="input" id="q" type="search" placeholder="Search by name, area or dish" value="${esc(S.q)}" aria-label="Search restaurants"></label>
        <select class="select" id="fcity" aria-label="City"><option value="">All cities</option>${Object.keys(F.D.cities).map(c => `<option value="${c}" ${S.city === c ? 'selected' : ''}>${esc(L(F.D.cities[c]))}</option>`).join('')}</select>
        <select class="select" id="fplan" aria-label="Plan"><option value="">All plans</option>${['starter', 'pro', 'premium'].map(p => `<option value="${p}" ${S.plan === p ? 'selected' : ''}>${F.plan(p)}</option>`).join('')}</select>
        <span class="muted small" id="cnt" aria-live="polite"></span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Restaurant</th><th>Area</th><th>Plan</th><th>Billing</th><th class="num">Rating</th><th class="num">Dishes</th><th>Menu confirmed</th><th><span class="sr">Open page</span></th></tr></thead>
        <tbody id="rows"></tbody></table></div><div id="rempty"></div></div>`;
    const paint = () => {
      const q = norm(S.q);
      const list = F.all().filter(r => (!S.city || r.city === S.city) && (!S.plan || r.plan === S.plan) &&
        (!q || norm([r.id, r.name.en, r.name.bn, F.area(r.area).en, F.area(r.area).bn, F.city(r.city).en, ...F.menu(r.id).map(d => d.name.en + ' ' + d.name.bn)].join(' ')).includes(q)));
      $('#cnt').textContent = list.length === F.all().length ? `${list.length} restaurants` : `${list.length} of ${F.all().length}`;
      $('#rows').innerHTML = list.map(r => {
        const menu = F.menu(r.id), so = menu.filter(d => d.soldOut).length, days = F.daysSince(F.confirmed(r.id));
        const tags = [r.featured ? '<span class="tag indigo">Featured</span>' : '', r.founding ? '<span class="tag gold">Founding Partner</span>' : ''].join(' ');
        return `<tr class="click" data-go="#/menus/${r.id}">
          <td><div class="cell-r">${F.mono(r)}<div><a href="#/menus/${r.id}"><b>${esc(L(r.name))}</b></a><span class="sub">${esc(L(r.spot))} ${tags}</span></div></div></td>
          <td class="nowrap">${esc(F.where(r))}</td>
          <td>${F.plan(r.plan)}</td>
          <td>${F.statusTag(F.billing(r.id).status)}</td>
          <td class="num nowrap">${r.rating.toFixed(1)} <span class="muted">(${F.n(r.reviews)})</span></td>
          <td class="num nowrap">${menu.length}${so ? ` <span class="muted">(${so} sold out)</span>` : ''}</td>
          <td class="nowrap">${days >= S.staleDays ? `<span class="tag red">${days} days ago</span>` : esc(F.ago(F.confirmed(r.id)))}</td>
          <td class="num"><a class="btn ghost icon" href="${F.pageUrl(r.id)}" target="_blank" rel="noopener" data-stop title="Open the diner page" aria-label="Open ${esc(L(r.name))} on the site">${ico('arrow-up-right')}</a></td></tr>`;
      }).join('');
      $('#rempty').innerHTML = list.length ? '' : empty('magnifying-glass', 'No restaurants match', S.q ? `Nothing found for "${esc(S.q)}". Try a restaurant name, an area such as Banani, or a dish such as kacchi.` : 'No restaurant matches these filters.', '<button class="btn" data-act="clear">Clear search and filters</button>');
    };
    $('#q').addEventListener('input', e => { S.q = e.target.value; paint(); });
    $('#fcity').onchange = e => { S.city = e.target.value; paint(); };
    $('#fplan').onchange = e => { S.plan = e.target.value; paint(); };
    paint();
  };

  /* =====================================================================
     Menus & prices
     ===================================================================== */
  VIEWS.menus = function (arg) {
    if (arg && F.r(arg)) S.rid = arg;
    F.store.set('admin.rid', S.rid);
    const r = F.r(S.rid);
    main.innerHTML = head('Menus & prices', 'Change a price and press Enter. Every change goes into the price history with its source and who made it.',
      `<button class="btn" data-act="bulk">${ico('list')}Bulk paste</button><button class="btn primary" data-act="confirm">${ico('check-circle')}Mark prices confirmed</button>`) + `
      <div class="card"><div class="toolbar">
        <select class="select" id="rsel" aria-label="Restaurant">${rOptions(r.id)}</select>
        <label class="row small muted">Source of changes <select class="select sm" id="src">${SOURCES.map(s => `<option ${s === S.source ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <span class="spacer"></span><span class="small status-line" id="conf"></span>
        <a class="btn sm ghost" href="${F.pageUrl(r.id)}" target="_blank" rel="noopener">${ico('arrow-up-right')}View page</a></div>
        <div class="tbl-wrap"><table class="tbl menu-tbl"><thead><tr><th>Dish</th><th>Type</th><th class="num">Price</th><th>Last change</th><th>Sold out</th><th><span class="sr">History</span></th></tr></thead><tbody id="mrows"></tbody></table></div></div>
      <div class="card" style="margin-top:16px"><div class="card-h"><h2>Price history</h2><span class="muted small" id="hcount"></span></div><div id="hist"></div></div>`;

    const lastCell = d => {
      const h = F.history(r.id, d.id)[0];
      if (!h) return '<span class="muted">No changes yet</span>';
      return `${h.from == null ? `Added at ${F.tk(h.to)}` : `${F.tk(h.from)} ${ico('arrow-right', 'sm')} ${F.tk(h.to)}`} <span class="muted">${F.dateShort(h.at)}</span>`;
    };
    const row = d => {
      const t = F.type(d.type);
      return `<tr data-did="${esc(d.id)}" class="${d.soldOut ? 'off' : ''}">
        <td><div class="cell-r">${F.thumb(d.p)}<div><span class="dname">${esc(L(d.name))}</span>${d.added ? ' <span class="tag indigo">New</span>' : ''}${d.name.bn ? `<span class="sub bn">${esc(d.name.bn)}</span>` : ''}</div></div></td>
        <td class="muted">${t ? esc(L(t)) : 'Not set'}${d.share ? `<span class="sub">Serves ${d.share}</span>` : ''}</td>
        <td class="num"><label class="money"><span class="sr">Price of ${esc(L(d.name))}</span><input class="input sm" inputmode="numeric" autocomplete="off" value="${d.price}" data-price></label></td>
        <td class="small nowrap" data-last>${lastCell(d)}</td>
        <td><label class="switch so"><input type="checkbox" data-so ${d.soldOut ? 'checked' : ''} aria-label="Sold out: ${esc(L(d.name))}"><span class="tr"></span></label></td>
        <td class="num"><button class="btn ghost icon" type="button" data-act="dhist" title="Price history" aria-label="Price history for ${esc(L(d.name))}">${ico('clock-countdown')}</button></td></tr>`;
    };
    const paintRows = () => {
      const menu = F.menu(r.id);
      const known = new Set(r.cats.map(c => c.id));
      const groups = r.cats.map(c => [L(c), menu.filter(d => d.cat === c.id)]).concat([['Other', menu.filter(d => !known.has(d.cat))]]);
      $('#mrows').innerHTML = groups.filter(g => g[1].length).map(g => `<tr class="group"><td colspan="6">${esc(g[0])} <span class="count">${g[1].length}</span></td></tr>${g[1].map(row).join('')}`).join('');
    };
    const paintConf = () => {
      const t = F.confirmed(r.id), d = F.daysSince(t), by = F.confirmedBy(r.id);
      $('#conf').innerHTML = `${d >= S.staleDays ? `<span class="tag red">${ico('warning', 'sm')}${d} days</span>` : ''}<span class="muted">Last confirmed ${esc(F.ago(t))}, ${F.date(t)}${by ? ` by ${esc(by.by)}` : ''}</span>`;
    };
    const paintHist = () => {
      const h = F.history(r.id);
      $('#hcount').textContent = h.length ? `${h.length} change${h.length > 1 ? 's' : ''}` : '';
      $('#hist').innerHTML = h.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Dish</th><th class="num">Old</th><th class="num">New</th><th>Source</th><th>By</th></tr></thead><tbody>${h.slice(0, 40).map(x => `<tr>
          <td class="nowrap">${esc(F.time(x.at))}</td><td>${esc(x.name)}</td>
          <td class="num">${x.from == null ? '<span class="muted">New dish</span>' : F.tk(x.from)}</td><td class="num"><b>${F.tk(x.to)}</b></td>
          <td>${esc(x.source)}</td><td>${esc(x.by)}</td></tr>`).join('')}</tbody></table></div>`
        : empty('clock-countdown', 'No price changes yet', 'Edit a price above or use Bulk paste. Each change is saved here with the old price, the new price, the source and who made it.');
    };
    const refreshRow = did => {
      const tr = $(`tr[data-did="${CSS.escape(did)}"]`), d = F.dish(r.id, did); if (!tr || !d) return;
      const inp = $('[data-price]', tr); inp.value = d.price; inp.classList.remove('changed');
      $('[data-last]', tr).innerHTML = lastCell(d);
    };
    const commit = async inp => {
      const did = inp.closest('tr').dataset.did, d = F.dish(r.id, did);
      const raw = F.bnDigits(inp.value).replace(/[৳,\s]/g, '');
      const v = Math.round(Number(raw));
      const revert = () => { inp.value = d.price; inp.classList.remove('changed'); };
      if (raw === '' || !Number.isFinite(v) || v <= 0) { revert(); F.toast('Enter a price above ৳0'); return; }
      if (v === d.price) { revert(); return; }
      const pct = Math.abs(v - d.price) / d.price;
      if (pct >= 0.5 && !(await F.confirm('Check this price', `${L(d.name)} would go from ${F.tk(d.price)} to ${F.tk(v)}, a ${Math.round(pct * 100)}% change. Save it?`, 'Save price'))) { revert(); return; }
      const from = d.price;
      F.setPrice(r.id, did, v, { by: ME.name, source: S.source });
      refreshRow(did); paintHist(); paintConf(); paintNav('menus');
      F.toast(`${L(d.name)}: ${F.tk(from)} to ${F.tk(v)}`, { label: 'Undo', run: () => { F.setPrice(r.id, did, from, { by: ME.name, source: 'Undo' }); refreshRow(did); paintHist(); } });
    };

    const tb = $('#mrows');
    tb.addEventListener('input', e => { if (e.target.matches('[data-price]')) { const d = F.dish(r.id, e.target.closest('tr').dataset.did); e.target.classList.toggle('changed', String(d.price) !== e.target.value.trim()); } });
    tb.addEventListener('keydown', e => {
      if (!e.target.matches('[data-price]')) return;
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Escape') { const d = F.dish(r.id, e.target.closest('tr').dataset.did); e.target.value = d.price; e.target.classList.remove('changed'); e.target.blur(); }
    });
    tb.addEventListener('change', e => {
      if (e.target.matches('[data-price]')) commit(e.target);
      if (e.target.matches('[data-so]')) {
        const tr = e.target.closest('tr'), did = tr.dataset.did, d = F.dish(r.id, did);
        F.setSoldOut(r.id, did, e.target.checked); tr.classList.toggle('off', e.target.checked);
        F.toast(e.target.checked ? `${L(d.name)} is marked sold out` : `${L(d.name)} is back on the menu`);
      }
    });
    $('#rsel').onchange = e => { location.hash = `#/menus/${e.target.value}`; };
    $('#src').onchange = e => { S.source = e.target.value; F.store.set('admin.source', S.source); };
    main.onclickMenus = {
      bulk: () => bulkPaste(r, () => { paintRows(); paintHist(); paintConf(); paintNav('menus'); }),
      confirm: () => { F.touch(r.id, ME.name, 'confirm', S.source); paintConf(); paintNav('menus'); F.toast(`Prices confirmed for ${L(r.name)}`); },
      dhist: el => dishHistory(r, el.closest('tr').dataset.did)
    };
    paintRows(); paintConf(); paintHist();
  };

  function dishHistory(r, did) {
    const d = F.dish(r.id, did), h = F.history(r.id, did);
    F.modal({
      title: `Price history: ${L(d.name)}`,
      body: `<p class="ink2">Current price <b>${F.tk(d.price)}</b>. Price in the demo data: ${F.tk(d.base)}.</p>` + (h.length
        ? `<div class="tbl-wrap card"><table class="tbl"><thead><tr><th>When</th><th class="num">Old</th><th class="num">New</th><th>Source</th><th>By</th></tr></thead><tbody>${h.map(x => `<tr><td class="nowrap">${esc(F.time(x.at))}</td><td class="num">${x.from == null ? 'New' : F.tk(x.from)}</td><td class="num"><b>${F.tk(x.to)}</b></td><td>${esc(x.source)}</td><td>${esc(x.by)}</td></tr>`).join('')}</tbody></table></div>`
        : empty('clock-countdown', 'No changes recorded', 'This dish still has its original price.'))
    });
  }

  /* bulk paste: "Dish name, price" per line */
  function parseBulk(r, text) {
    const menu = F.menu(r.id), idx = new Map();
    menu.forEach(d => { idx.set(norm(d.name.en), d); if (d.name.bn) idx.set(norm(d.name.bn), d); });
    const out = text.split(/\r?\n/).map((ln, i) => ({ ln: ln.trim(), n: i + 1 })).filter(x => x.ln).map(x => {
      const s = F.bnDigits(x.ln);
      const m = /^(.+?)\s*[,\t;]\s*(?:৳|tk\.?|taka)?\s*([\d,]+(?:\.\d+)?)\s*(?:৳|tk\.?|taka|\/-)?\s*$/i.exec(s);
      if (!m) return Object.assign(x, { kind: 'err', msg: 'Needs a name, a comma and a price' });
      const name = m[1].trim(), price = Math.round(Number(m[2].replace(/,/g, '')));
      if (!name) return Object.assign(x, { kind: 'err', msg: 'Missing dish name' });
      if (!(price > 0)) return Object.assign(x, { kind: 'err', msg: 'Price must be above ৳0' });
      if (price > 50000) return Object.assign(x, { kind: 'err', msg: 'Price looks too high' });
      const d = idx.get(norm(name));
      if (d) return Object.assign(x, { name: L(d.name), d, price, kind: d.price === price ? 'same' : 'update' });
      return Object.assign(x, { name, price, kind: 'new' });
    });
    const seen = new Map();
    out.forEach((x, i) => { if (x.kind === 'err') return; const k = x.d ? 'd:' + x.d.id : 'n:' + norm(x.name); if (seen.has(k)) out[seen.get(k)].kind = 'dup'; seen.set(k, i); });
    return out;
  }
  function bulkPaste(r, done) {
    const m = F.modal({
      title: `Bulk paste: ${L(r.name)}`, wide: true,
      body: `<label class="field"><span>One dish per line: dish name, comma, price</span>
          <textarea class="input mono-text" id="bp" rows="7" spellcheck="false" placeholder="Mutton Kacchi, 440&#10;Borhani, 95&#10;Mutton Leg Roast, 520"></textarea>
          <span class="hint">A name that matches the menu updates its price. A new name adds a new dish. Two columns pasted from a spreadsheet also work. Lines with problems are skipped.</span></label>
        <div class="row wrap" style="align-items:flex-end">
          <label class="field"><span>Category for new dishes</span><select class="select" id="bpcat">${r.cats.map(c => `<option value="${c.id}">${esc(L(c))}</option>`).join('')}</select></label>
          <label class="field"><span>Source</span><select class="select" id="bpsrc">${SOURCES.map(s => `<option ${s === S.source ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
        <div id="bpprev"></div>`,
      foot: `<span class="spacer small muted" id="bpsum"></span><button class="btn" type="button" data-cancel>Cancel</button><button class="btn primary" type="button" id="bpgo" disabled>Apply changes</button>`
    });
    const el = m.el; let rows = [];
    const TAG = { update: '<span class="tag indigo">Update</span>', new: '<span class="tag green">New dish</span>', same: '<span class="tag">No change</span>', dup: '<span class="tag">Replaced by a later line</span>' };
    const paint = () => {
      rows = parseBulk(r, $('#bp', el).value);
      const nU = rows.filter(x => x.kind === 'update').length, nN = rows.filter(x => x.kind === 'new').length, nE = rows.filter(x => x.kind === 'err').length;
      $('#bpprev', el).innerHTML = rows.length ? `<div class="card tbl-wrap"><table class="tbl"><thead><tr><th class="num">Line</th><th>Dish</th><th class="num">Now</th><th class="num">New</th><th>Result</th></tr></thead><tbody>${rows.map(x => `<tr>
          <td class="num muted">${x.n}</td><td>${x.kind === 'err' ? `<span class="muted">${esc(x.ln)}</span>` : esc(x.name)}</td>
          <td class="num">${x.d ? F.tk(x.d.price) : '<span class="muted">None</span>'}</td><td class="num">${x.price ? `<b>${F.tk(x.price)}</b>` : ''}</td>
          <td>${x.kind === 'err' ? `<span class="tag red">${esc(x.msg)}</span>` : TAG[x.kind]}</td></tr>`).join('')}</tbody></table></div>` : '';
      const parts = [nU && `${nU} price update${nU > 1 ? 's' : ''}`, nN && `${nN} new dish${nN > 1 ? 'es' : ''}`, nE && `${nE} line${nE > 1 ? 's' : ''} to fix`].filter(Boolean);
      $('#bpsum', el).textContent = parts.join(', ');
      const go = $('#bpgo', el); go.disabled = !(nU + nN); go.textContent = nU + nN ? `Apply ${nU + nN} change${nU + nN > 1 ? 's' : ''}` : 'Apply changes';
    };
    $('#bp', el).addEventListener('input', paint);
    $('[data-cancel]', el).onclick = m.close;
    $('#bpgo', el).onclick = () => {
      const src = $('#bpsrc', el).value + ' (bulk paste)', cat = $('#bpcat', el).value;
      let n = 0;
      rows.forEach(x => {
        if (x.kind === 'update' && F.setPrice(r.id, x.d.id, x.price, { by: ME.name, source: src })) n++;
        if (x.kind === 'new') { F.addDish(r.id, { name: x.name, price: x.price, cat }, { by: ME.name, source: src }); n++; }
      });
      m.close(); done(); F.toast(`Applied ${n} change${n === 1 ? '' : 's'} to ${L(r.name)}`);
    };
  }

  /* =====================================================================
     Media
     ===================================================================== */
  VIEWS.media = function () {
    const rows = F.all().map(r => {
      const g = r.gallery || {}, photos = new Set([...(r.hero || []), ...Object.values(g).flat(), ...r.menu.map(d => d.p).filter(Boolean)]);
      const film = r.film, kitchen = r.kitchen, rooms = (r.tour || []).length, d3 = r.menu.filter(d => d.d3).length;
      const gaps = [];
      if (r.plan !== 'starter') { if (!film) gaps.push('Promo video'); if (!kitchen) gaps.push('Kitchen film'); if (!rooms) gaps.push('360 tour'); }
      if (r.plan === 'premium' && !d3) gaps.push('3D dishes');
      return { r, photos: photos.size, film, kitchen, rooms, d3, gaps };
    });
    const nGaps = rows.filter(x => x.gaps.length).length;
    const yes = v => v ? `<span class="cell-ok">${ico('check', 'sm')} ${v === true ? 'Yes' : esc(v)}</span>` : '<span class="muted">None</span>';
    main.innerHTML = head('Media', `What each restaurant has today and what its plan still needs. ${nGaps} restaurant${nGaps === 1 ? '' : 's'} have media to shoot.`) + `
      <div class="note" style="margin-bottom:16px">${ico('info')}<span>Uploading photos, films, 360 panoramas and 3D models needs file storage, so it is not part of this prototype. Starter includes photos. Pro adds a promo video, kitchen film and 360 tour. Premium adds 3D dishes.</span></div>
      <div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Restaurant</th><th>Plan</th><th class="num">Photos</th><th>Promo video</th><th>Kitchen film</th><th>360 tour</th><th>3D dishes</th><th>Shot</th><th>Still needed</th></tr></thead><tbody>
      ${rows.map(x => `<tr><td><div class="cell-r">${F.thumb(x.r.hero && x.r.hero[0], '')}<div><b>${esc(L(x.r.name))}</b><span class="sub">${esc(F.where(x.r))}</span></div></div></td>
        <td>${F.plan(x.r.plan)}</td><td class="num">${x.photos}</td>
        <td class="nowrap">${yes(x.film && x.film.len)}</td><td class="nowrap">${yes(x.kitchen && L(x.kitchen.date).replace('Filmed ', ''))}</td>
        <td class="nowrap">${yes(x.rooms && `${x.rooms} room${x.rooms > 1 ? 's' : ''}`)}</td><td class="nowrap">${yes(x.d3 && `${x.d3} dish${x.d3 > 1 ? 'es' : ''}`)}</td>
        <td class="nowrap muted">${esc(L(x.r.mediaDate) || 'Not yet')}</td>
        <td>${x.gaps.length ? x.gaps.map(g => `<span class="tag gold">${esc(g)}</span>`).join(' ') : '<span class="muted">Complete</span>'}</td></tr>`).join('')}
      </tbody></table></div>`;
  };

  /* =====================================================================
     Reviews queue
     ===================================================================== */
  const REJECT = ['Spam or advertising', 'No sign of a real visit', 'Abusive or personal attack', 'Off-topic', 'Duplicate review', 'Contains personal details'];
  VIEWS.reviews = function () {
    const all = F.reviews();
    const cnt = s => all.filter(x => x.status === s && (!S.rvR || x.r === S.rvR)).length;
    const tabs = [['pending', 'Waiting'], ['published', 'Published'], ['rejected', 'Rejected']];
    main.innerHTML = head('Reviews queue', 'New reviews wait here until someone on the team approves them. Oldest first. Approved reviews appear on the restaurant page and in the owner dashboard.',
      `<select class="select" id="rvr" aria-label="Restaurant"><option value="">All restaurants</option>${rOptions(S.rvR)}</select>`) + `
      <div class="tabs" role="tablist" style="margin-bottom:16px">${tabs.map(t => `<button role="tab" aria-selected="${S.rvTab === t[0]}" class="${S.rvTab === t[0] ? 'on' : ''}" data-tab="${t[0]}">${t[1]} <span class="count">${cnt(t[0])}</span></button>`).join('')}</div>
      <div class="rv-list" id="rvl"></div>`;
    const list = all.filter(x => x.status === S.rvTab && (!S.rvR || x.r === S.rvR));
    if (S.rvTab === 'pending') list.sort((a, b) => a.at - b.at);
    const card = x => {
      const r = F.r(x.r), bn = /[ঀ-৿]/.test(x.t);
      const acts = x.status === 'pending'
        ? `<button class="btn sm primary" data-act="approve">${ico('check')}Approve</button><button class="btn sm" data-act="reject">${ico('x')}Reject</button><button class="btn sm ghost" data-act="reply">${x.reply ? 'Edit reply' : 'Reply'}</button>${x.flags.includes('Price complaint') ? `<a class="btn sm ghost" href="#/menus/${x.r}">${ico('receipt')}Check menu prices</a>` : ''}`
        : x.status === 'published'
          ? `<button class="btn sm ghost" data-act="reply">${x.reply ? 'Edit reply' : 'Reply'}</button><button class="btn sm ghost" data-act="requeue">Move back to queue</button>`
          : `<button class="btn sm" data-act="requeue">Restore to queue</button>`;
      return `<article class="card rv" data-id="${x.id}">
        <div class="rv-h">${F.mono(r)}<div class="grow-1"><b>${esc(L(r.name))}</b><span class="sub">${esc(x.who)}, ${esc(F.ago(x.at))}</span></div>${F.stars(x.st)}</div>
        <div class="rv-tags">${x.vf ? `<span class="tag green">${ico('seal-check', 'sm')}Verified visit</span>` : '<span class="tag">Not verified</span>'}${x.flags.map(f => `<span class="tag gold">${ico('warning', 'sm')}${esc(f)}</span>`).join('')}${x.status === 'rejected' ? `<span class="tag red">Rejected: ${esc(x.reason || 'No reason given')}</span>` : ''}</div>
        <p class="rv-t ${bn ? 'bn' : ''}">${esc(x.t)}</p>
        ${x.ord.length ? `<p class="small muted">Ordered: ${x.ord.map(esc).join(', ')}</p>` : ''}
        ${x.reply ? `<div class="rv-reply"><b>Reply from ${esc(L(r.name))}</b><p>${esc(x.reply)}</p></div>` : ''}
        <div class="rv-a">${acts}</div><div class="rv-x" hidden></div></article>`;
    };
    const emptyText = { pending: ['check-circle', 'The queue is clear', 'No reviews are waiting. New reviews from diners will show up here.'], published: ['chats-circle', 'No published reviews', 'Approved reviews for this restaurant will show up here.'], rejected: ['x', 'Nothing rejected', 'Rejected reviews stay here so they can be restored.'] }[S.rvTab];
    $('#rvl').innerHTML = list.length ? list.map(card).join('') : `<div class="card">${empty(...emptyText)}</div>`;
    $('#rvr').onchange = e => { S.rvR = e.target.value; VIEWS.reviews(); };
  };
  function reviewAction(act, el) {
    const art = el.closest('.rv'), id = art.dataset.id, x = F.reviews().find(v => v.id === id), r = F.r(x.r), box = $('.rv-x', art);
    const redo = () => { VIEWS.reviews(); paintNav('reviews'); };
    if (act === 'approve') {
      F.setReview(id, { status: 'published' }); redo();
      F.toast(`Published on ${L(r.name)}`, { label: 'Undo', run: () => { F.setReview(id, { status: 'pending' }); redo(); } });
    }
    if (act === 'requeue') { F.setReview(id, { status: 'pending', reason: '' }); redo(); F.toast('Moved back to the queue'); }
    if (act === 'reject') {
      box.hidden = false;
      box.innerHTML = `<label class="field"><span>Reason (the reviewer sees this)</span><select class="select" data-reason>${REJECT.map(o => `<option>${o}</option>`).join('')}</select></label>
        <div class="row"><button class="btn sm danger" data-act="reject-go">Reject review</button><button class="btn sm ghost" data-act="close-x">Cancel</button></div>`;
      $('select', box).focus();
    }
    if (act === 'reject-go') {
      const reason = $('[data-reason]', box).value; F.setReview(id, { status: 'rejected', reason }); redo();
      F.toast('Review rejected', { label: 'Undo', run: () => { F.setReview(id, { status: 'pending', reason: '' }); redo(); } });
    }
    if (act === 'reply') {
      box.hidden = false;
      box.innerHTML = `<label class="field"><span>Reply as ${esc(L(r.name))}</span><textarea class="input" rows="3" data-reply maxlength="600" placeholder="Thank you for visiting...">${esc(x.reply)}</textarea>
        <span class="hint">Shown publicly under the restaurant's name. Use this when the owner sends a reply by WhatsApp or phone.</span></label>
        <div class="row"><button class="btn sm primary" data-act="reply-go">Post reply</button>${x.reply ? '<button class="btn sm ghost danger" data-act="reply-del">Remove reply</button>' : ''}<button class="btn sm ghost" data-act="close-x">Cancel</button></div>`;
      $('textarea', box).focus();
    }
    if (act === 'reply-go') {
      const t = $('[data-reply]', box).value.trim(); if (!t) { F.toast('Write a reply first'); return; }
      F.setReview(id, { reply: t, replyAt: Date.now(), replyBy: ME.name }); redo(); F.toast('Reply posted');
    }
    if (act === 'reply-del') { F.setReview(id, { reply: '' }); redo(); F.toast('Reply removed'); }
    if (act === 'close-x') { box.hidden = true; box.innerHTML = ''; }
  }

  /* =====================================================================
     Deals & featured
     ===================================================================== */
  VIEWS.deals = function () {
    const dotw = F.dotw();
    const allDeals = F.all().flatMap(r => F.deals(r.id).map(d => ({ r, d })));
    const cityCard = city => {
      const opts = F.all().filter(r => r.city === city && r.plan === 'premium').flatMap(r => F.deals(r.id).filter(d => d.status === 'active').map(d => ({ r, d })));
      const cur = dotw[city], curR = cur && F.r(cur), curD = curR && F.deals(cur).find(d => d.status === 'active');
      return `<div class="card"><div class="card-h"><h3>Deal of the Week, ${esc(L(F.city(city)))}</h3></div><div class="card-b stack">
        ${opts.length ? `<label class="field"><span>Restaurant</span><select class="select" data-dotw="${city}"><option value="">No deal this week</option>${opts.map(o => `<option value="${o.r.id}" ${cur === o.r.id ? 'selected' : ''}>${esc(L(o.r.name))}: ${esc(o.d.title)}</option>`).join('')}</select></label>
          ${curD ? `<div class="row">${F.thumb(curD.p, '')}<div><b>${esc(curD.title)}</b><div class="small muted">${F.tk(curD.price)} instead of ${F.tk(curD.was)}, ${esc(curD.when)}</div></div></div>` : cur ? '<p class="small muted">The selected restaurant has no active deal right now.</p>' : ''}`
          : `<p class="muted">No Premium restaurant in ${esc(L(F.city(city)))} has an active deal. Deal of the Week is a Premium slot.</p>`}
      </div></div>`;
    };
    const featured = F.all().filter(r => r.featured);
    main.innerHTML = head('Deals & featured', 'Deals come from Pro and Premium restaurants. Deal of the Week and featured placement are Premium slots and are always labelled on the site.') + `
      <div class="cards2" style="margin-bottom:16px">${Object.keys(F.D.cities).map(cityCard).join('')}</div>
      <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Featured placement</h2><span class="muted small">${featured.length} restaurants</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Restaurant</th><th>Plan</th><th>Shown at the top of</th><th>Label on the site</th></tr></thead><tbody>
        ${featured.map(r => `<tr><td><div class="cell-r">${F.mono(r)}<b>${esc(L(r.name))}</b></div></td><td>${F.plan(r.plan)}</td><td>${esc(L(F.area(r.area)))} search, ${r.cuisines.map(c => esc(L(F.D.cuisines.find(x => x.id === c)))).join(', ')}</td><td><span class="tag indigo">Featured</span></td></tr>`).join('')}
        </tbody></table></div><div class="card-b small muted" style="border-top:1px solid var(--line)">Featured status never changes ratings or review order.</div></div>
      <div class="card"><div class="card-h"><h2>All deals</h2><span class="muted small">${allDeals.length} deals</span></div>
        ${allDeals.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Restaurant</th><th>Deal</th><th class="num">Deal price</th><th class="num">Usual</th><th>When</th><th>Status</th><th><span class="sr">Actions</span></th></tr></thead><tbody>
        ${allDeals.map(({ r, d }) => `<tr data-rid="${r.id}" data-deal="${esc(d.id)}"><td><div class="cell-r">${F.mono(r)}<div><b>${esc(L(r.name))}</b><span class="sub">${F.plan(r.plan)}</span></div></div></td>
          <td><b>${esc(d.title)}</b><span class="sub muted small" style="display:block">${esc(d.desc)}</span></td><td class="num">${F.tk(d.price)}</td><td class="num muted">${F.tk(d.was)}</td><td>${esc(d.when)}</td>
          <td>${d.status === 'active' ? '<span class="tag green">Active</span>' : '<span class="tag">Paused</span>'}</td>
          <td class="num"><button class="btn sm ghost" data-act="deal-toggle">${d.status === 'active' ? 'Pause' : 'Resume'}</button></td></tr>`).join('')}
        </tbody></table></div>` : empty('tag', 'No deals yet', 'Deals added by owners in their dashboard will show up here.')}</div>`;
    $$('[data-dotw]').forEach(s => s.onchange = () => { F.setDotw(s.dataset.dotw, s.value); VIEWS.deals(); F.toast(s.value ? `Deal of the Week set for ${L(F.city(s.dataset.dotw))}` : 'Deal of the Week cleared'); });
  };

  /* =====================================================================
     Plans & billing (sample statuses)
     ===================================================================== */
  VIEWS.billing = function () {
    const rows = F.all().map(r => ({ r, b: F.billing(r.id), m: F.monthly(r) }));
    const paying = rows.filter(x => x.b.status === 'active' || x.b.status === 'past_due');
    const mrr = paying.reduce((s, x) => s + x.m, 0), due = rows.filter(x => x.b.status === 'past_due');
    main.innerHTML = head('Plans & billing', `List prices from the pricing sheet: Dhaka ৳1,999, ৳4,999 and ৳9,999 a month; Bogura ৳500 less. Founding Partners on Pro pay the Starter price for 12 months. <span class="sample">Sample payment status</span>`) + `
      <div class="kpis" style="margin-bottom:16px">
        <div class="card kpi"><div class="k-l">Monthly revenue</div><div class="k-v">${F.tk(mrr)}</div><div class="k-d">${paying.length} paying restaurants</div></div>
        <div class="card kpi"><div class="k-l">On trial</div><div class="k-v">${rows.filter(x => x.b.status === 'trial').length}</div><div class="k-d">7-day free trial</div></div>
        <div class="card kpi"><div class="k-l">Past due</div><div class="k-v">${due.length}</div><div class="k-d">${F.tk(due.reduce((s, x) => s + x.m, 0))} owed</div></div>
        <div class="card kpi"><div class="k-l">Founding Partners</div><div class="k-v">${rows.filter(x => x.r.founding).length}</div><div class="k-d">of the first 50</div></div></div>
      <div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Restaurant</th><th>Plan</th><th class="num">Monthly</th><th>Status</th><th>Last payment</th><th>Next invoice</th></tr></thead><tbody>
      ${rows.map(({ r, b, m }) => `<tr><td><div class="cell-r">${F.mono(r)}<div><b>${esc(L(r.name))}</b><span class="sub">${esc(L(F.city(r.city)))}</span></div></div></td>
        <td>${F.plan(r.plan)}${r.founding ? ' <span class="tag gold">Founding</span>' : ''}</td><td class="num">${F.tk(m)}</td><td>${F.statusTag(b.status)}</td>
        <td class="nowrap">${b.paidDays != null ? `${esc(b.method)}, ${F.date(F.daysAgoTs(b.paidDays))}` : '<span class="muted">None yet</span>'}</td>
        <td class="nowrap">${b.status === 'trial' ? `Trial ends ${F.inDays(b.dueIn)}` : b.dueIn < 0 ? `<span class="tag gold">${-b.dueIn} days overdue</span>` : F.date(F.today0 + b.dueIn * DAY)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="small muted" style="margin-top:12px">At launch, payments by bKash, Nagad, bank transfer or cash are confirmed by hand with the transaction ID. After 7 days overdue a page drops to a basic listing; after 30 days it is hidden.</p>`;
  };

  /* =====================================================================
     Leads pipeline
     ===================================================================== */
  const STAGES = [['new', 'New'], ['called', 'Called'], ['demo', 'Demo'], ['signed', 'Signed']];
  const OWNERS = F.TEAM.filter(t => t.role === 'sales' || t.role === 'admin').map(t => t.name);
  const LEAD_SOURCES = ['Visit', 'Business page form', 'Referral', 'Phone'];
  VIEWS.leads = function () {
    const leads = F.leads().filter(l => !S.leadOwner || (S.leadOwner === '__none' ? !l.owner : l.owner === S.leadOwner));
    const dueN = leads.filter(l => l.stage !== 'signed' && l.next != null && l.next <= F.today0).length;
    main.innerHTML = head('Leads', `Restaurant sign-ups from visits, the business page form and referrals. Drag a card or use its button to move it. ${dueN ? `<b>${dueN} follow-up${dueN > 1 ? 's' : ''} due today or overdue.</b>` : ''}`,
      `<select class="select" id="lown" aria-label="Owner"><option value="">All owners</option>${OWNERS.map(o => `<option ${S.leadOwner === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}<option value="__none" ${S.leadOwner === '__none' ? 'selected' : ''}>Unassigned</option></select><button class="btn primary" data-act="lead-new">${ico('plus')}Add lead</button>`) +
      `<div class="board" id="board">${STAGES.map(([k, label], si) => {
        const ls = leads.filter(l => l.stage === k);
        return `<section class="col" data-stage="${k}" aria-label="${label}"><div class="col-h">${label}<span class="count">${ls.length}</span></div>
          ${ls.length ? ls.map(l => leadCard(l, si)).join('') : `<div class="col-empty">${k === 'new' ? 'No new leads' : 'Drop a lead here'}</div>`}</section>`;
      }).join('')}</div>`;
    $('#lown').onchange = e => { S.leadOwner = e.target.value; VIEWS.leads(); };
    bindBoard();
  };
  function leadCard(l, si) {
    let follow = '';
    if (l.stage !== 'signed') {
      if (l.next == null) follow = '<span class="muted small">No follow-up set</span>';
      else { const d = Math.round((l.next - F.today0) / DAY); follow = d < 0 ? `<span class="tag red">Overdue ${-d} day${d === -1 ? '' : 's'}</span>` : d === 0 ? '<span class="tag gold">Follow up today</span>' : `<span class="tag">Follow up ${F.inDays(d)}</span>`; }
    } else follow = `<span class="tag green">${ico('check', 'sm')}Signed, ${F.plan(l.plan)}</span>`;
    const nxt = STAGES[si + 1];
    return `<div class="lead" draggable="true" tabindex="0" data-id="${l.id}" aria-label="${esc(l.name)}, ${STAGES[si][1]}">
      <div class="row"><b class="grow-1">${esc(l.name)}</b>${l.stage !== 'signed' ? `<span class="tag line">${F.plan(l.plan)}</span>` : ''}</div>
      <div class="small muted">${esc(L(F.area(l.area)))}, ${esc(l.contact)} · ${esc(l.source)}</div>
      <div class="row">${follow}<span class="spacer"></span>${l.owner ? `<span class="avatar" title="${esc(l.owner)}">${F.initials(l.owner)}</span>` : '<span class="small muted">Unassigned</span>'}</div>
      ${nxt ? `<button class="btn sm ghost mv" data-mv="${nxt[0]}" type="button">Move to ${nxt[1]} ${ico('arrow-right')}</button>` : ''}</div>`;
  }
  function moveLead(id, stage) {
    const list = F.leads(), l = list.find(x => x.id === id); if (!l || l.stage === stage) return;
    const from = l.stage; l.stage = stage; l.log = (l.log || []).concat({ at: Date.now(), by: ME.name, text: `Moved from ${STAGES.find(s => s[0] === from)[1]} to ${STAGES.find(s => s[0] === stage)[1]}` });
    F.saveLeads(list); VIEWS.leads();
    F.toast(stage === 'signed' ? `${l.name} signed. Next: create the restaurant and start the trial.` : `${l.name} moved to ${STAGES.find(s => s[0] === stage)[1]}`,
      { label: 'Undo', run: () => { const L2 = F.leads(), x = L2.find(y => y.id === id); x.stage = from; x.log.pop(); F.saveLeads(L2); VIEWS.leads(); } });
  }
  function bindBoard() {
    const board = $('#board'); let dragId = null;
    board.addEventListener('dragstart', e => { const c = e.target.closest('.lead'); if (!c) return; dragId = c.dataset.id; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
    board.addEventListener('dragend', e => { const c = e.target.closest('.lead'); if (c) c.classList.remove('dragging'); $$('.col.over').forEach(x => x.classList.remove('over')); });
    board.addEventListener('dragover', e => { const col = e.target.closest('.col'); if (!col || !dragId) return; e.preventDefault(); $$('.col.over').forEach(x => x !== col && x.classList.remove('over')); col.classList.add('over'); });
    board.addEventListener('dragleave', e => { const col = e.target.closest('.col'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('over'); });
    board.addEventListener('drop', e => { const col = e.target.closest('.col'); if (!col) return; e.preventDefault(); const id = e.dataTransfer.getData('text/plain') || dragId; dragId = null; moveLead(id, col.dataset.stage); });
    board.addEventListener('click', e => {
      const mv = e.target.closest('[data-mv]'); if (mv) { moveLead(mv.closest('.lead').dataset.id, mv.dataset.mv); return; }
      const c = e.target.closest('.lead'); if (c) leadModal(c.dataset.id);
    });
    board.addEventListener('keydown', e => { const c = e.target.closest('.lead'); if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); leadModal(c.dataset.id); } });
  }
  function leadModal(id) {
    const list = F.leads(), l = id ? list.find(x => x.id === id) : { id: 'ld' + Date.now().toString(36), name: '', area: 'dhanmondi', contact: '', phone: '', source: 'Visit', stage: 'new', owner: ME.name, next: F.today0 + DAY, plan: 'starter', notes: '', log: [] };
    const iso = t => { if (t == null) return ''; const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const m = F.modal({
      title: id ? l.name : 'Add lead',
      body: `<div class="grid2">
          <label class="field"><span>Restaurant name</span><input class="input" name="name" value="${esc(l.name)}" required></label>
          <label class="field"><span>Area</span><select class="select" name="area">${F.D.areas.map(a => `<option value="${a.id}" ${l.area === a.id ? 'selected' : ''}>${esc(a.en)}, ${esc(L(F.city(a.city)))}</option>`).join('')}</select></label>
          <label class="field"><span>Contact person</span><input class="input" name="contact" value="${esc(l.contact)}"></label>
          <label class="field"><span>Phone</span><input class="input" name="phone" type="tel" value="${esc(l.phone)}" placeholder="+880"></label>
          <label class="field"><span>Source</span><select class="select" name="source">${LEAD_SOURCES.map(s => `<option ${l.source === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
          <label class="field"><span>Interested in</span><select class="select" name="plan">${['starter', 'pro', 'premium'].map(p => `<option value="${p}" ${l.plan === p ? 'selected' : ''}>${F.plan(p)}</option>`).join('')}</select></label>
          <label class="field"><span>Stage</span><select class="select" name="stage">${STAGES.map(s => `<option value="${s[0]}" ${l.stage === s[0] ? 'selected' : ''}>${s[1]}</option>`).join('')}</select></label>
          <label class="field"><span>Owner</span><select class="select" name="owner"><option value="">Unassigned</option>${OWNERS.map(o => `<option ${l.owner === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>
          <label class="field"><span>Next follow-up</span><input class="input" type="date" name="next" value="${iso(l.next)}"></label></div>
        <label class="field"><span>Notes</span><textarea class="input" name="notes" rows="3">${esc(l.notes)}</textarea></label>
        ${id ? `<div class="field"><span>Activity</span><div class="row"><input class="input grow-1" name="logtext" placeholder="Log a call or visit, for example: Called, owner asked for a demo on Sunday"><button class="btn" type="button" data-log>Add</button></div>
          <div class="log">${(l.log || []).slice().reverse().map(x => `<div>${esc(x.text)}<span>${esc(x.by)}, ${esc(F.time(x.at))}</span></div>`).join('') || '<div class="muted">No activity logged yet.</div>'}</div></div>` : ''}`,
      foot: `${id ? '<button class="btn danger" type="button" data-del>Delete</button><span class="spacer"></span>' : ''}<button class="btn" type="button" data-cancel>Cancel</button><button class="btn primary" type="button" data-save>${id ? 'Save' : 'Add lead'}</button>`
    });
    const el = m.el, val = n => el.querySelector(`[name="${n}"]`).value;
    $('[data-cancel]', el).onclick = m.close;
    if (id) {
      $('[data-log]', el).onclick = () => {
        const t = val('logtext').trim(); if (!t) return;
        const L2 = F.leads(), x = L2.find(y => y.id === id); x.log = (x.log || []).concat({ at: Date.now(), by: ME.name, text: t }); F.saveLeads(L2);
        m.close(); leadModal(id);
      };
      $('[data-del]', el).onclick = async () => {
        m.close();
        if (await F.confirm('Delete lead', `Delete ${l.name} from the pipeline? This cannot be undone in the prototype.`, 'Delete lead', true)) { F.saveLeads(F.leads().filter(x => x.id !== id)); VIEWS.leads(); F.toast('Lead deleted'); }
      };
    }
    $('[data-save]', el).onclick = () => {
      const name = val('name').trim(); if (!name) { el.querySelector('[name="name"]').focus(); F.toast('Add the restaurant name'); return; }
      const nx = val('next'), next = nx ? new Date(nx + 'T00:00:00').getTime() : null;
      const L2 = F.leads(); let x = L2.find(y => y.id === l.id);
      if (!x) { x = Object.assign({}, l, { log: [{ at: Date.now(), by: ME.name, text: 'Lead added' }] }); L2.push(x); }
      Object.assign(x, { name, area: val('area'), contact: val('contact').trim(), phone: val('phone').trim(), source: val('source'), plan: val('plan'), stage: val('stage'), owner: val('owner'), next, notes: val('notes').trim() });
      F.saveLeads(L2); m.close(); VIEWS.leads(); F.toast(id ? 'Lead saved' : `${name} added to New`);
    };
  }

  /* =====================================================================
     Reports
     ===================================================================== */
  VIEWS.reports = function () {
    const prev = new Date(); prev.setDate(1); prev.setMonth(prev.getMonth() - 1);
    const month = F.month(prev.getTime()), sent = F.store.get('reportsSent', {});
    const NOT_SENT = new Set(['kabab-ghor', 'shamiana', 'lake-view']), NEW = new Set(['mirpur-bawarchi', 'satmatha-fuchka']);
    const rows = F.all().map(r => {
      const s = sent[r.id];
      const status = NEW.has(r.id) ? 'new' : s ? 'sent' : NOT_SENT.has(r.id) ? 'ready' : 'sent';
      return { r, status, at: s ? s.at : F.daysAgoTs(Math.max(0, new Date().getDate() - 1 - F.hash(r.id) % 3), 10) };
    });
    const ready = rows.filter(x => x.status === 'ready').length;
    main.innerHTML = head('Monthly reports', `Reports for ${esc(month)}. Each restaurant gets page views, QR scans, top dishes and call and directions taps, plus price insights on Pro and Premium. ${ready ? `<b>${ready} ready to send.</b>` : 'All sent.'} <span class="sample">Sample send status</span>`) + `
      <div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Restaurant</th><th>Plan</th><th>Includes</th><th>Status</th><th><span class="sr">Actions</span></th></tr></thead><tbody>
      ${rows.map(({ r, status, at }) => `<tr data-rid="${r.id}"><td><div class="cell-r">${F.mono(r)}<div><b>${esc(L(r.name))}</b><span class="sub">${esc(F.where(r))}</span></div></div></td>
        <td>${F.plan(r.plan)}</td><td class="small">${r.plan === 'starter' ? 'Views, QR scans, top dishes, taps' : 'Views, QR scans, top dishes, taps, price insights'}</td>
        <td class="nowrap">${status === 'sent' ? `<span class="tag green">Sent</span> <span class="small muted">${F.dateShort(at)} by WhatsApp</span>` : status === 'ready' ? '<span class="tag gold">Ready to send</span>' : '<span class="small muted">Joined this month. First report next month.</span>'}</td>
        <td class="num nowrap"><a class="btn sm ghost" href="dashboard.html?r=${r.id}#report">Open owner view</a>${status === 'ready' ? '<button class="btn sm" data-act="report-sent">Mark as sent</button>' : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="small muted" style="margin-top:12px">In production the report is generated on the 1st, saved as a PDF and sent to the owner's WhatsApp. Here, "Mark as sent" only records the status.</p>`;
  };

  /* =====================================================================
     Staleness alerts
     ===================================================================== */
  VIEWS.stale = function () {
    const thr = S.staleDays, rows = staleList();
    const over = rows.filter(x => x.d >= thr && !x.sn).sort((a, b) => b.d - a.d);
    const soon = rows.filter(x => x.d >= thr - 7 && x.d < thr && !x.sn).sort((a, b) => b.d - a.d);
    const snz = rows.filter(x => x.sn);
    const tbl = (list, kind) => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Restaurant</th><th>Plan</th><th>Last confirmed</th><th>Phone</th><th><span class="sr">Actions</span></th></tr></thead><tbody>
      ${list.map(({ r, t, d, sn }) => `<tr data-rid="${r.id}"><td><div class="cell-r">${F.mono(r)}<div><b>${esc(L(r.name))}</b><span class="sub">${esc(F.where(r))}</span></div></div></td>
        <td>${F.plan(r.plan)}${r.plan === 'premium' ? ' <span class="tag line">Same-day support</span>' : ''}</td>
        <td class="nowrap">${kind === 'over' ? `<b style="color:var(--red)">${d} days ago</b>` : `${d} days ago`} <span class="muted small">${F.date(t)}</span></td>
        <td class="nowrap"><a href="tel:${esc(r.phone)}">${esc(phone(r.phone))}</a></td>
        <td class="num nowrap">${kind === 'snz' ? `<span class="small muted">Snoozed until ${F.dateShort(sn)}</span> <button class="btn sm ghost" data-act="unsnooze">Unsnooze</button>`
          : `<a class="btn sm ghost" href="#/menus/${r.id}">Open menu</a><button class="btn sm" data-act="stale-ok">${ico('check')}Mark confirmed</button>${kind === 'over' ? '<button class="btn sm ghost" data-act="snooze">Snooze 7 days</button>' : ''}`}</td></tr>`).join('')}</tbody></table></div>`;
    main.innerHTML = head('Staleness alerts', `Menus with no price edit or confirmation for ${thr} days or more. Diners see when prices were last checked, so call these restaurants first. <span class="sample">Sample dates</span>`,
      `<label class="row small muted">Alert after <select class="select" id="thr">${[14, 30, 45, 60].map(n => `<option value="${n}" ${n === thr ? 'selected' : ''}>${n} days</option>`).join('')}</select></label>`) + `
      <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Overdue</h2><span class="count ${over.length ? 'alert' : ''}">${over.length}</span></div>
        ${over.length ? tbl(over, 'over') : empty('check-circle', 'No overdue menus', `Every menu was edited or confirmed in the last ${thr} days.`)}</div>
      <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>Due in the next 7 days</h2><span class="count">${soon.length}</span></div>
        ${soon.length ? tbl(soon, 'soon') : empty('calendar-blank', 'Nothing due this week', 'No menu reaches the limit in the next 7 days.')}</div>
      ${snz.length ? `<div class="card"><div class="card-h"><h2>Snoozed</h2><span class="count">${snz.length}</span></div>${tbl(snz, 'snz')}</div>` : ''}`;
    $('#thr').onchange = e => { S.staleDays = +e.target.value; F.store.set('admin.staleDays', S.staleDays); paintNav('stale'); VIEWS.stale(); };
  };
  function staleAction(act, el) {
    const rid = el.closest('tr').dataset.rid, r = F.r(rid);
    if (act === 'stale-ok') {
      const prev = F.store.get('confirmed', {})[rid];
      F.touch(rid, ME.name, 'confirm', 'Phone call'); VIEWS.stale(); paintNav('stale');
      F.toast(`${L(r.name)} confirmed today`, { label: 'Undo', run: () => { const c = F.store.get('confirmed', {}); if (prev) c[rid] = prev; else delete c[rid]; F.store.set('confirmed', c); VIEWS.stale(); paintNav('stale'); } });
    }
    if (act === 'snooze') { F.snooze(rid, 7); VIEWS.stale(); paintNav('stale'); F.toast(`${L(r.name)} snoozed for 7 days`); }
    if (act === 'unsnooze') { F.snooze(rid, 0); VIEWS.stale(); paintNav('stale'); }
  }

  /* =====================================================================
     Team
     ===================================================================== */
  const PERM = [
    ['Restaurants and menus', 'E', 'V', 'E', 'E', 'V'], ['Media', 'E', 'V', 'E', 'V', '-'], ['Reviews queue', 'E', 'V', 'V', '-', 'E'],
    ['Deals and featured', 'E', 'E', 'V', 'V', '-'], ['Plans and billing', 'E', 'V', '-', '-', '-'], ['Leads', 'E', 'E', '-', '-', '-'],
    ['Reports', 'E', 'V', 'V', '-', '-'], ['Team', 'E', '-', '-', '-', '-']
  ];
  VIEWS.team = function () {
    const roles = Object.keys(F.ROLES);
    const cell = v => v === 'E' ? '<span class="cell-ok">Edit</span>' : v === 'V' ? '<span class="cell-view">View</span>' : '<span class="cell-no">No access</span>';
    main.innerHTML = head('Team', 'Who can do what in the admin panel. Five roles: admin, sales, content, data entry and moderator.') + `
      <div class="card" style="margin-bottom:16px"><div class="card-h"><h2>People</h2><span class="muted small">${F.TEAM.length} people</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>City</th><th>Last active</th></tr></thead><tbody>
        ${F.TEAM.map(p => `<tr><td><div class="cell-r"><span class="avatar">${F.initials(p.name)}</span><b>${esc(p.name)}</b>${p.name === ME.name ? ' <span class="tag">You</span>' : ''}</div></td><td>${F.ROLES[p.role]}</td><td>${esc(p.city)}</td><td class="muted">${esc(p.seen)}</td></tr>`).join('')}
        </tbody></table></div></div>
      <div class="card"><div class="card-h"><h2>Permissions by role</h2></div><div class="tbl-wrap"><table class="tbl perm"><thead><tr><th>Section</th>${roles.map(r => `<th>${F.ROLES[r]}</th>`).join('')}</tr></thead><tbody>
        ${PERM.map(p => `<tr><td>${p[0]}</td>${p.slice(1).map(cell).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="card-b small muted" style="border-top:1px solid var(--line)">Sample names. In production every change records the person and role that made it.</div></div>`;
  };

  /* ---------- delegated clicks ---------- */
  main.addEventListener('click', e => {
    if (e.target.closest('[data-stop]')) return;
    const a = e.target.closest('[data-act]');
    if (a) {
      const act = a.dataset.act;
      if (main.onclickMenus && main.onclickMenus[act] && location.hash.startsWith('#/menus')) return main.onclickMenus[act](a);
      if (act === 'clear') { S.q = ''; S.city = ''; S.plan = ''; return VIEWS.restaurants(); }
      if (['approve', 'reject', 'reject-go', 'reply', 'reply-go', 'reply-del', 'requeue', 'close-x'].includes(act)) return reviewAction(act, a);
      if (act === 'lead-new') return leadModal(null);
      if (['stale-ok', 'snooze', 'unsnooze'].includes(act)) return staleAction(act, a);
      if (act === 'report-sent') { const rid = a.closest('tr').dataset.rid, s = F.store.get('reportsSent', {}); s[rid] = { at: Date.now(), by: ME.name }; F.store.set('reportsSent', s); VIEWS.reports(); F.toast('Marked as sent. No message was sent from the prototype.'); return; }
      if (act === 'deal-toggle') {
        const tr = a.closest('tr'), rid = tr.dataset.rid, list = F.deals(rid), d = list.find(x => x.id === tr.dataset.deal);
        d.status = d.status === 'active' ? 'paused' : 'active'; F.saveDeals(rid, list); VIEWS.deals(); F.toast(`${d.title}: ${d.status === 'active' ? 'resumed' : 'paused'}`); return;
      }
    }
    const tab = e.target.closest('[data-tab]'); if (tab) { S.rvTab = tab.dataset.tab; VIEWS.reviews(); return; }
    const go = e.target.closest('[data-go]'); if (go && !e.target.closest('a,button,input,select,label')) location.hash = go.dataset.go;
  });

  route();
})();
