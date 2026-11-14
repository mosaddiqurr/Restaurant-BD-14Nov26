/* Restaurants and Dishes: two listing pages that share one filter engine.
   Restaurants: filters on the side (a drawer on phones), results update as you tap.
   Dishes: every dish from every restaurant, by category, grouped by cuisine or by dish. */
(function () {
  const K = window.K, D = K.data, t = K.t, L = K.L, ico = K.ico, $ = K.$, $$ = K.$$;
  const LIST = ['fac', 'media', 'tags'];
  const MAIN = ['kacchi', 'biryani', 'tehari', 'polao', 'thali', 'fish', 'thai', 'chinese', 'platter', 'kebab', 'curry', 'fuchka', 'bakery'];

  /* ---------- filter state lives in the URL ---------- */
  function readF(q, page) {
    const f = {};
    for (const [k, v] of q.entries()) f[k] = LIST.includes(k) ? v.split(',').filter(Boolean) : v;
    LIST.forEach(k => f[k] = f[k] || []);
    f.group = f.group || 'cu';
    f.sort = f.sort || defSort(f, page);
    return f;
  }
  const defSort = (f, page) => page === 'dishes' ? (f.type ? 'price' : 'rel') : 'rel';
  function writeF(f, page) {
    const sp = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (k === 'sort' && v === defSort(f, page)) return;
      if (k === 'group' && v === 'cu') return;
      if (Array.isArray(v)) { if (v.length) sp.set(k, v.join(',')); } else if (v != null && v !== '' && v !== false) sp.set(k, v);
    });
    return sp.toString();
  }
  const occOf = f => D.occasions.find(o => o.id === f.occ);
  const budOf = f => D.budgets.find(b => b.id === f.bud);
  const hay = r => K.norm([r.name.en, r.name.bn, K.areaOf(r.area).en, K.areaOf(r.area).bn, ...r.cuisines.map(c => { const x = D.cuisines.find(y => y.id === c); return x.en + ' ' + x.bn; }), ...r.menu.map(d => d.name.en + ' ' + d.name.bn + ' ' + D.types[d.type].en + ' ' + D.types[d.type].bn)].join(' '));
  const textHit = (r, q) => { const n = K.norm(q); if (!n) return true; const h = hay(r); return n.split(/\s+/).every(w => h.includes(w)); };

  function matchR(r, f, dishLevel) {
    if (f.area && r.area !== f.area) return false;
    if (f.city && r.city !== f.city) return false;
    if (!dishLevel) {
      if (f.cu && !r.cuisines.includes(f.cu) && !r.menu.some(d => K.cuOf(d) === f.cu)) return false;
      if (f.type && !r.menu.some(d => d.type === f.type)) return false;
      if (f.q && !textHit(r, f.q)) return false;
    }
    const b = budOf(f); if (b && !(r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0))) return false;
    if (f.open && !K.openState(r).open) return false;
    if (f.late && !K.isLate(r)) return false;
    if (f.rating && r.rating < Number(f.rating)) return false;
    if (f.fac.length && !f.fac.every(x => r.fac.includes(x))) return false;
    if (f.media.includes('tour') && !r.hasTour) return false;
    if (f.media.includes('film') && !r.hasFilm) return false;
    if (f.media.includes('3d') && !r.has3d) return false;
    if (f.media.includes('kitchen') && !r.hasKitchen) return false;
    if (f.tags.includes('deals') && !r.deal) return false;
    if (f.tags.includes('featured') && !r.featured) return false;
    if (f.tags.includes('founding') && !r.founding) return false;
    if (f.deals && !r.deal) return false;
    const o = occOf(f);
    if (o) {
      if (o.q.fac && !o.q.fac.every(x => r.fac.includes(x))) return false;
      if (o.q.maxPP && r.ppl[0] > o.q.maxPP) return false;
      if (o.q.late && !K.isLate(r)) return false;
      if (o.q.media && o.q.media.includes('tour') && !r.hasTour) return false;
    }
    return true;
  }
  function restaurants(f) {
    const near = K.S.area, nearCity = K.areaOf(near).city;
    const s = {
      rel: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating,
      price: (a, b) => a.ppl[0] - b.ppl[0],
      rating: (a, b) => b.rating - a.rating,
      near: (a, b) => (b.area === near) - (a.area === near) || (b.city === nearCity) - (a.city === nearCity) || b.rating - a.rating,
      fresh: (a, b) => a.checked - b.checked
    }[f.sort] || ((a, b) => b.rating - a.rating);
    return D.restaurants.filter(r => matchR(r, f)).sort(s);
  }
  function dishes(f) {
    const ok = new Set(D.restaurants.filter(r => matchR(r, f, true)).map(r => r.id));
    let ds = K.allDishes.filter(d => ok.has(d.r));
    if (f.type) ds = ds.filter(d => d.type === f.type);
    if (f.cu) ds = ds.filter(d => K.cuOf(d) === f.cu);
    if (f.max) ds = ds.filter(d => d.price <= Number(f.max));
    if (f.veg) ds = ds.filter(d => d.veg);
    if (f.mild) ds = ds.filter(d => d.spice <= 1);
    if (f.q) { const n = K.norm(f.q); ds = ds.filter(d => { const h = K.norm(d.name.en + ' ' + d.name.bn + ' ' + D.types[d.type].en + ' ' + D.types[d.type].bn + ' ' + K.r(d.r).name.en + ' ' + K.areaOf(K.r(d.r).area).en); return n.split(/\s+/).every(w => h.includes(w)); }); }
    const s = { price: (a, b) => a.price - b.price, rating: (a, b) => K.r(b.r).rating - K.r(a.r).rating, fresh: (a, b) => K.r(a.r).checked - K.r(b.r).checked, rel: (a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0) || (MAIN.includes(b.type) ? 1 : 0) - (MAIN.includes(a.type) ? 1 : 0) || K.r(b.r).rating - K.r(a.r).rating, near: (a, b) => (K.r(b.r).area === K.S.area) - (K.r(a.r).area === K.S.area) || a.price - b.price }[f.sort] || ((a, b) => a.price - b.price);
    return ds.sort(s);
  }
  K.flt = { readF, writeF, matchR, restaurants, dishes };

  /* ---------- shared pieces ---------- */
  const sorts = page => page === 'dishes'
    ? [['rel', t('sort_rel')], ['price', t('sort_price')], ['rating', t('sort_rating')], ['near', t('sort_near')], ['fresh', t('sort_fresh')]]
    : [['rel', t('sort_rel')], ['price', t('sort_price_pp')], ['rating', t('sort_rating')], ['near', t('sort_near')], ['fresh', t('sort_fresh')]];
  const sortBtn = (f, page) => `<button class="tb-btn" data-sortpop>${ico('sort-ascending', 'sm')}<span>${(sorts(page).find(s => s[0] === f.sort) || sorts(page)[0])[1]}</span>${ico('caret-down', 'sm')}</button>`;
  function activeChips(f) {
    const out = [];
    const x = (k, v, label) => out.push(`<button class="chip on sm" data-rm="${k}" data-v="${K.esc(v || '')}">${label}${ico('x', 'x')}</button>`);
    if (f.q) x('q', '', `“${K.esc(f.q)}”`);
    if (f.city) x('city', '', L(D.cities[f.city]));
    if (f.area) x('area', '', L(K.areaOf(f.area)));
    if (f.cu) x('cu', '', K.cuName(f.cu));
    if (f.type) x('type', '', t('serves_x', { d: L(D.types[f.type]) }));
    if (f.occ) x('occ', '', L(occOf(f)));
    if (f.bud) x('bud', '', L(budOf(f)));
    if (f.max) x('max', '', t('dish_upto', { v: K.tk(f.max) }));
    if (f.rating) x('rating', '', `${K.n(f.rating)}+`);
    if (f.open) x('open', '', t('q_open'));
    if (f.late) x('late', '', t('late_night'));
    if (f.veg) x('veg', '', t('veg'));
    if (f.mild) x('mild', '', t('mild'));
    f.fac.forEach(v => x('fac', v, L(D.facilities[v])));
    f.media.forEach(v => x('media', v, { tour: t('q_tour'), film: t('film'), '3d': t('menu_3d'), kitchen: t('kitchen_film') }[v]));
    f.tags.forEach(v => x('tags', v, { deals: t('q_deals'), featured: t('featured'), founding: t('founding') }[v]));
    return out.join('');
  }
  const countAll = (f, skip = []) => Object.keys(f).filter(k => !['group', 'sort', ...skip].includes(k) && (Array.isArray(f[k]) ? f[k].length : f[k])).reduce((s, k) => s + (Array.isArray(f[k]) ? f[k].length : 1), 0);

  /* ================= RESTAURANTS ================= */
  function sideFilters(f) {
    const radio = (k, v, l, extra = '') => `<button class="fo ${f[k] === v ? 'on' : ''}" data-fs="${k}" data-v="${v}" role="radio" aria-checked="${f[k] === v}"><i class="fo-r"></i><span>${l}</span>${extra}</button>`;
    const check = (k, v, l, n) => `<button class="fo ${f[k].includes(v) ? 'on' : ''}" data-fm="${k}" data-v="${v}" role="checkbox" aria-checked="${f[k].includes(v)}"><i class="fo-c">${ico('check', 'sm')}</i><span>${l}</span>${n != null ? `<em class="num">${K.n(n)}</em>` : ''}</button>`;
    const tog = (k, l) => `<button class="fo ${f[k] ? 'on' : ''}" data-ft="${k}" role="checkbox" aria-checked="${!!f[k]}"><i class="fo-c">${ico('check', 'sm')}</i><span>${l}</span></button>`;
    const cnt = fn => D.restaurants.filter(fn).length;
    const city = f.city || (f.area && K.areaOf(f.area).city) || '';
    const grp = (title, body, open = true) => `<details class="fg" ${open ? 'open' : ''}><summary>${title}${ico('caret-down', 'sm')}</summary><div class="fg-b">${body}</div></details>`;
    return `<div class="fl">
      ${grp(t('where'), `<div class="seg fl-city"><button class="${!city ? 'on' : ''}" data-city="">${t('anywhere')}</button><button class="${city === 'dhaka' ? 'on' : ''}" data-city="dhaka">${L(D.cities.dhaka)}</button><button class="${city === 'bogura' ? 'on' : ''}" data-city="bogura">${L(D.cities.bogura)}</button></div>
        <div class="fo-list" role="radiogroup">${D.areas.filter(a => !city || a.city === city).map(a => radio('area', a.id, L(a), `<em class="num">${K.n(cnt(r => r.area === a.id))}</em>`)).join('')}</div>`)}
      ${grp(t('budget_pp'), `<div class="fo-list" role="radiogroup">${D.budgets.map(b => radio('bud', b.id, L(b))).join('')}</div>`)}
      ${grp(t('food_type'), `<label class="fl-sel"><span class="sr">${t('food_type')}</span><select class="select" data-ftype><option value="">${t('any_food')}</option>${D.cuisines.map(c => `<optgroup label="${K.esc(L(c))}">${Object.entries(D.types).filter(([, x]) => x.cu === c.id).map(([id, x]) => `<option value="${id}" ${f.type === id ? 'selected' : ''}>${L(x)}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <div class="chips fl-cu">${D.cuisines.map(c => `<button class="chip sm ${f.cu === c.id ? 'on' : ''}" data-fs="cu" data-v="${c.id}">${L(c)}</button>`).join('')}</div>`)}
      ${grp(t('occasion'), `<div class="chips">${D.occasions.filter(o => o.id !== 'tour').map(o => `<button class="chip sm ${f.occ === o.id ? 'on' : ''}" data-fs="occ" data-v="${o.id}">${ico(o.i, 'sm')}${L(o)}</button>`).join('')}</div>`)}
      ${grp(t('when'), `<div class="fo-list">${tog('open', t('q_open'))}${tog('late', t('late_night'))}</div>`)}
      ${grp(t('rating'), `<div class="fo-list" role="radiogroup">${radio('rating', '4', '4.0+')}${radio('rating', '4.5', '4.5+')}</div>`, false)}
      ${grp(t('facilities'), `<div class="fo-list">${Object.entries(D.facilities).map(([id, x]) => check('fac', id, L(x), cnt(r => r.fac.includes(id)))).join('')}</div>`, false)}
      ${grp(t('see_before'), `<div class="fo-list">${check('media', 'tour', t('q_tour'))}${check('media', 'film', t('film'))}${check('media', 'kitchen', t('kitchen_film'))}${check('media', '3d', t('menu_3d'))}</div>`, false)}
      ${grp(t('labels'), `<div class="fo-list">${check('tags', 'deals', t('q_deals'), cnt(r => r.deal))}${check('tags', 'featured', t('featured'), cnt(r => r.featured))}${check('tags', 'founding', t('founding'), cnt(r => r.founding))}</div>`, false)}
    </div>`;
  }
  function applyFilterClick(f, e) {
    const s = e.target.closest('[data-fs]'); if (s) { const k = s.dataset.fs, v = s.dataset.v; f[k] = f[k] === v ? '' : v; if (k === 'area' && f[k]) delete f.city; return true; }
    const m = e.target.closest('[data-fm]'); if (m) { const k = m.dataset.fm, v = m.dataset.v; f[k] = f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]; return true; }
    const tg = e.target.closest('[data-ft]'); if (tg) { const k = tg.dataset.ft; f[k] = f[k] ? '' : '1'; return true; }
    const c = e.target.closest('[data-city]'); if (c) { f.city = c.dataset.city; delete f.area; return true; }
    return false;
  }
  function rHead(f, rs) {
    const a = f.area && K.areaOf(f.area), o = occOf(f), b = budOf(f);
    const title = a ? t('rs_in', { a: L(a) }) : f.city ? t('rs_in', { a: L(D.cities[f.city]) }) : o ? L(o) : t('nav_restaurants');
    const sub = a ? L(a.blurb) : t('rs_sub', { n: K.n(D.restaurants.length) });
    return `<header class="ls-head"><div class="wrap ls-head-in"><div><h1 class="h2">${title}</h1><p class="sub">${sub}</p></div>
      <label class="ls-search">${ico('magnifying-glass')}<input type="search" placeholder="${t('rs_search')}" value="${K.esc(f.q || '')}" aria-label="${t('rs_search')}" data-q></label></div></header>`;
  }
  function rResults(f) {
    const rs = restaurants(f);
    return `<div class="ls-bar"><button class="tb-btn m-flt" data-filters>${ico('sliders-horizontal', 'sm')}${t('filters')}${countAll(f, ['q']) ? `<span class="cnt">${K.n(countAll(f, ['q']))}</span>` : ''}</button><p class="ls-count"><b class="num">${K.n(rs.length)}</b> ${t(rs.length === 1 ? 'place_one' : 'places_word')}</p><span class="sp"></span>${sortBtn(f, 'restaurants')}</div>
      ${countAll(f) ? `<div class="chips ls-act">${activeChips(f)}<button class="link sm" data-clear>${t('clear_all')}</button></div>` : ''}
      ${rs.length ? `<div class="ls-grid">${rs.map((r, i) => K.rcard(r, { rv: true, i: i % 3 })).join('')}</div>` : empty(f, 'restaurants')}`;
  }
  function empty(f, page) {
    return `<div class="empty"><div class="empty-ic">${ico('magnifying-glass', 'lg')}</div><h3>${t('nothing_all')}</h3><p class="meta">${t('nothing_sub')}</p><div class="chips" style="justify-content:center">${activeChips(f)}</div><div class="chips" style="justify-content:center"><button class="btn btn-line" data-clear>${t('clear_all')}</button><button class="btn btn-primary" data-act="ask" data-q="${K.esc(f.q || '')}">${ico('sparkle-fill')}${t('ask_ai')}</button></div></div>`;
  }

  let RF = null;
  K.views.restaurants = {
    chrome: { tab: 'restaurants' },
    title: () => t('nav_restaurants'),
    render: (p, q) => { RF = readF(q, 'restaurants'); return `<div class="ls">${rHead(RF, null)}<div class="wrap ls-body"><aside class="ls-side" aria-label="${t('filters')}">${sideFilters(RF)}</aside><div class="ls-main" aria-live="polite">${rResults(RF)}</div></div></div>`; },
    mount(el) {
      K._ctxR = null;
      const side = $('.ls-side', el), main = $('.ls-main', el);
      const update = (nf, o = {}) => {
        RF = nf;
        K.go('/restaurants?' + writeF(RF, 'restaurants'), { replace: true, silent: true });
        const paint = () => {
          main.innerHTML = rResults(RF); $$('[data-rv]', main).forEach(x => x.classList.add('in'));
          if (!o.keepSide) { const open = $$('details', side).map(d => d.open); side.innerHTML = sideFilters(RF); $$('details', side).forEach((d, i) => d.open = open[i]); }
        };
        /* cards that stay slide to their new places; a closing filter sheet is left to finish on its own */
        $('.sheet') ? paint() : K.vt('list', paint);
      };
      side.addEventListener('click', e => { const nf = JSON.parse(JSON.stringify(RF)); if (applyFilterClick(nf, e)) { e.preventDefault(); update(nf); } });
      side.addEventListener('change', e => { if (e.target.matches('[data-ftype]')) update(Object.assign(JSON.parse(JSON.stringify(RF)), { type: e.target.value })); });
      main.addEventListener('click', e => {
        const rm = e.target.closest('[data-rm]'); if (rm) { const nf = JSON.parse(JSON.stringify(RF)), k = rm.dataset.rm; if (LIST.includes(k)) nf[k] = nf[k].filter(x => x !== rm.dataset.v); else delete nf[k]; if (k === 'q') $('[data-q]', el).value = ''; return update(nf); }
        if (e.target.closest('[data-clear]')) { $('[data-q]', el).value = ''; return update({ fac: [], media: [], tags: [], group: 'cu', sort: RF.sort }); }
        const sb = e.target.closest('[data-sortpop]'); if (sb) return sortPop(sb, RF, 'restaurants', v => update(Object.assign({}, RF, { sort: v }), { keepSide: true }));
        if (e.target.closest('[data-filters]')) return mobileFilters(el, RF, nf => update(nf));
      });
      let qt; $('[data-q]', el).addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => update(Object.assign(JSON.parse(JSON.stringify(RF)), { q: e.target.value.trim() }), { keepSide: true }), 180); });
    }
  };
  function sortPop(anchor, f, page, done) {
    K.choose(anchor, t('sort'), `<div class="fo-list" role="radiogroup">${sorts(page).map(([v, l]) => `<button class="fo ${f.sort === v ? 'on' : ''}" data-sv="${v}" role="radio" aria-checked="${f.sort === v}"><i class="fo-r"></i><span>${l}</span></button>`).join('')}</div>`, (p, close) => $$('[data-sv]', p).forEach(b => b.onclick = () => { const v = b.dataset.sv; const c = close(); (c && c.then ? c : Promise.resolve()).then(() => done(v)); }), 'pop-sm');
  }
  function mobileFilters(el, f0, done) {
    let f = JSON.parse(JSON.stringify(f0));
    K.sheet.open({
      cls: 'drawer', title: t('filters'), html: `<div class="fl-wrap"><div class="sheet-b" data-fb>${sideFilters(f)}</div><div class="sheet-f"><button class="btn btn-ghost" data-fclear>${t('clear_all')}</button><button class="btn btn-primary btn-lg" style="flex:1" data-fapply></button></div></div>`,
      onOpen: s => {
        const body = $('[data-fb]', s);
        const label = () => { const n = restaurants(f).length; $('[data-fapply]', s).textContent = n ? t('show_n_places', { n: K.n(n) }) : t('no_results'); };
        const paint = () => { const st = body.scrollTop, open = $$('details', body).map(d => d.open); body.innerHTML = sideFilters(f); $$('details', body).forEach((d, i) => d.open = open[i]); body.scrollTop = st; label(); };
        label();
        body.addEventListener('click', e => { if (applyFilterClick(f, e)) { e.preventDefault(); paint(); } });
        body.addEventListener('change', e => { if (e.target.matches('[data-ftype]')) { f.type = e.target.value; paint(); } });
        $('[data-fclear]', s).onclick = () => { f = { fac: [], media: [], tags: [], group: 'cu', sort: f.sort, q: f.q }; paint(); };
        $('[data-fapply]', s).onclick = () => K.sheet.close().then(() => done(f));
      }
    });
  }

  /* ================= DISHES ================= */
  function catRail(f) {
    const order = D.cravings.concat(Object.keys(D.types).filter(id => !D.cravings.includes(id))).filter(id => K.allDishes.some(d => d.type === id));
    return `<div class="crail" role="tablist" aria-label="${t('categories')}"><button class="cr ${!f.type ? 'on' : ''}" data-type="">${!f.type ? '<i class="cr-ind" aria-hidden="true"></i>' : ''}${ico('squares-four')}<span>${t('all_food')}</span></button>${order.map(id => { const pic = K.typePic(id); return `<button class="cr ${f.type === id ? 'on' : ''}" data-type="${id}" role="tab" aria-selected="${f.type === id}">${f.type === id ? '<i class="cr-ind" aria-hidden="true"></i>' : ''}${pic ? `<span class="cr-ph">${K.img(pic, { w: 96 })}</span>` : ico(D.types[id].i || 'fork-knife')}<span>${L(D.types[id])}</span></button>`; }).join('')}</div>`;
  }
  function dHead(f, ds) {
    const ty = f.type && D.types[f.type], cu = f.cu && D.cuisines.find(c => c.id === f.cu);
    const title = ty ? L(ty) : cu ? L(cu) : f.q ? `“${K.esc(f.q)}”` : t('nav_dishes');
    const solo = ds.filter(d => !d.share), pr = solo.map(d => d.price).sort((a, b) => a - b);
    const places = new Set(ds.map(d => d.r)).size;
    /* a price panel once there are enough prices to compare; otherwise the range sits in the line under the title */
    const panel = ty && pr.length > 2;
    let sub = ds.length ? t(places === 1 && ds.length > 1 ? 'stat_dishes_1p' : 'stat_dishes', { n: K.n(ds.length), p: K.n(places) }) + (pr.length && !panel ? (pr[0] === pr[pr.length - 1] ? `, ${K.tk(pr[0])}` : `, ${K.tk(pr[0])} ${t('to')} ${K.tk(pr[pr.length - 1])}`) : '') : '';
    if (!ty && !cu && !f.q) sub = t('dishes_sub');
    const pic = ty ? K.typePic(f.type) : cu ? cu.p : null;
    return `<header class="ls-head dh ${pic ? 'has-pic' : ''} ${panel ? 'has-price' : ''}">${pic ? `<div class="dh-amb" aria-hidden="true">${K.img(pic, { w: 96 })}</div>` : ''}<div class="wrap ls-head-in">
      <div class="dh-txt"><h1 class="h2 dh-t">${title}</h1><p class="sub">${sub}</p></div>
      ${pic ? `<div class="dh-pic" aria-hidden="true"><div class="dh-plate">${K.ph(pic, { w: 560, eager: true })}</div></div>` : ''}
      ${panel ? pricePanel(ds.filter(d => !d.share), pr) : ''}
    </div></header>`;
  }
  /* Lowest, typical and highest price in big numbers, with every dish as a dot on one line underneath */
  function pricePanel(solo, pr) {
    const lo = pr[0], hi = pr[pr.length - 1], med = pr[Math.floor(pr.length / 2)], pos = v => hi === lo ? 50 : (v - lo) / (hi - lo) * 100;
    const stat = (k, v, cls) => `<div class="${cls || ''}"><dt>${t(k)}</dt><dd class="num">${K.tk(v)}</dd></div>`;
    /* the typical price is the middle dish's price, so that dish's dot is the gold one */
    const mid = Math.floor(pr.length / 2);
    const dots = solo.slice().sort((a, b) => a.price - b.price).map((d, i) => { const r = K.r(d.r), x = pos(d.price); return `<button class="dh-dot ${i === mid ? 'typ' : ''} ${x < 18 ? 'l' : x > 82 ? 'r' : ''}" style="--x:${pos(d.price).toFixed(2)}%;--i:${i}" data-dish="${r.id}|${d.id}" tabindex="-1"><span class="dh-tip"><b>${K.esc(L(d.name))}</b><span>${K.esc(L(r.name))} · <span class="num">${K.tk(d.price)}</span></span></span></button>`; }).join('');
    return `<div class="dh-price">
      <dl class="dh-stats">${stat('lowest', lo)}${stat('typical', med, 'typ')}${stat('highest', hi)}</dl>
      <div class="dh-bar" role="img" aria-label="${K.esc(t('dh_bar_label', { n: K.n(pr.length), lo: K.tk(lo), hi: K.tk(hi), m: K.tk(med) }))}"><span class="dh-track"></span>${dots}</div>
    </div>`;
  }
  function dToolbar(f) {
    const a = f.area ? L(K.areaOf(f.area)) : f.city ? L(D.cities[f.city]) : t('anywhere');
    return `<div class="tb"><div class="wrap tb-in">
      ${catRail(f)}
      <div class="tb-row">
        <label class="tb-q">${ico('magnifying-glass', 'sm')}<input type="search" placeholder="${t('dish_search')}" value="${K.esc(f.q || '')}" aria-label="${t('dish_search')}" data-q></label>
        <button class="tb-btn ${f.area || f.city ? 'on' : ''}" data-dpop="area">${ico('map-pin', 'sm')}<span>${a}</span>${ico('caret-down', 'sm')}</button>
        <button class="tb-btn ${f.max ? 'on' : ''}" data-dpop="max">${ico('money', 'sm')}<span>${f.max ? t('dish_upto', { v: K.tk(f.max) }) : t('any_price')}</span>${ico('caret-down', 'sm')}</button>
        <button class="tb-btn ${f.veg ? 'on' : ''}" data-dt="veg">${ico('leaf', 'sm')}<span>${t('veg')}</span></button>
        <button class="tb-btn ${f.mild ? 'on' : ''}" data-dt="mild">${ico('pepper', 'sm')}<span>${t('mild')}</span></button>
        <button class="tb-btn ${f.open ? 'on' : ''}" data-dt="open">${ico('clock', 'sm')}<span>${t('q_open')}</span></button>
        <span class="sp"></span>
        ${!f.type ? `<div class="seg tb-grp" role="tablist" aria-label="${t('group_by')}"><button class="${f.group === 'cu' ? 'on' : ''}" data-group="cu">${t('by_cuisine')}</button><button class="${f.group === 'type' ? 'on' : ''}" data-group="type">${t('by_dish')}</button></div>` : ''}
        ${sortBtn(f, 'dishes')}
      </div>
    </div></div>`;
  }
  function dResults(f, ds) {
    if (!ds.length) return empty(f, 'dishes');
    if (f.type) {
      const low = ds.filter(d => !d.share).sort((a, b) => a.price - b.price)[0];
      return `<div class="dish-grid">${ds.map((d, i) => K.dcard(d, { lowest: d === low, rv: true, i: i % 5 })).join('')}</div>`;
    }
    const groupKey = f.group === 'type' ? d => d.type : d => K.cuOf(d);
    const order = f.group === 'type' ? Object.keys(D.types) : D.cuisines.map(c => c.id);
    const groups = order.map(k => ({ k, ds: ds.filter(d => groupKey(d) === k) })).filter(g => g.ds.length);
    return groups.map(g => {
      const label = f.group === 'type' ? L(D.types[g.k]) : K.cuName(g.k);
      const pr = g.ds.filter(d => !d.share).map(d => d.price);
      const link = f.group === 'type' ? `/dishes?${writeF(Object.assign({}, f, { type: g.k }), 'dishes')}` : `/dishes?${writeF(Object.assign({}, f, { cu: g.k }), 'dishes')}`;
      return `<section class="dgroup">${K.rail('g-' + g.k, g.ds.map(d => K.dcard(d, { w: true })).join(''), { head: `<div class="dg-h"><h2 class="h3">${label}</h2><p class="meta">${t('stat_dishes', { n: K.n(g.ds.length), p: K.n(new Set(g.ds.map(d => d.r)).size) })}${pr.length ? `, ${K.tk(Math.min(...pr))} ${t('to')} ${K.tk(Math.max(...pr))}` : ''}<a class="link sm" href="#${link}">${t('see_all')}${ico('arrow-right', 'sm')}</a></p></div>` })}</section>`;
    }).join('');
  }

  let DF = null;
  K.views.dishes = {
    chrome: { tab: 'dishes' },
    title: () => t('nav_dishes'),
    render: (p, q) => { DF = readF(q, 'dishes'); const ds = dishes(DF); return `<div class="ls dishes">${dHead(DF, ds)}${dToolbar(DF)}<div class="wrap ls-res" aria-live="polite">${countAll(DF, ['q', 'type']) ? `<div class="chips ls-act">${activeChips(Object.assign({}, DF, { type: '' }))}<button class="link sm" data-clear>${t('clear_all')}</button></div>` : ''}${dResults(DF, ds)}</div></div>`; },
    mount(el) {
      K._ctxR = null;
      const update = (nf, keepTop) => {
        const typeChanged = nf.type !== DF.type || nf.cu !== DF.cu;
        if (nf.type !== DF.type) nf.sort = defSort(nf, 'dishes');
        DF = nf; K.go('/dishes?' + writeF(DF, 'dishes'), { replace: true, silent: true });
        const y = scrollY, rail = $('.crail', el), rx = rail ? rail.scrollLeft : 0;
        const swap = () => {
          el.innerHTML = K.views.dishes.render(null, new URLSearchParams(writeF(DF, 'dishes')));
          const r2 = $('.crail', el); if (r2) r2.scrollLeft = rx;
          if (typeChanged) {
            K.reveal(el);
            const on = $('.cr.on', el); if (on && r2) r2.scrollLeft += on.getBoundingClientRect().left - r2.getBoundingClientRect().left - (r2.clientWidth - on.offsetWidth) / 2;
            scrollTo({ top: 0 });
          } else { $$('[data-rv]', el).forEach(x => x.classList.add('in')); scrollTo({ top: y }); }
        };
        /* a new category brings in its own plate, title and prices; filters inside one category just swap */
        /* typing in search stays instant so the cursor never leaves the box */
        if (typeChanged) K.vt('cat', swap); else if (keepTop === 'q' || $('.sheet')) swap(); else K.vt('list', swap);
        if (document.activeElement === document.body && keepTop === 'q') { const qi = $('[data-q]', el); qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); }
      };
      el.addEventListener('click', e => {
        const nf = () => JSON.parse(JSON.stringify(DF));
        const ty = e.target.closest('[data-type]'); if (ty) { const n = nf(); n.type = ty.dataset.type; delete n.cu; return update(n); }
        const g = e.target.closest('[data-group]'); if (g) { const n = nf(); n.group = g.dataset.group; return update(n, true); }
        const dt = e.target.closest('[data-dt]'); if (dt) { const n = nf(), k = dt.dataset.dt; n[k] = n[k] ? '' : '1'; return update(n, true); }
        const rm = e.target.closest('[data-rm]'); if (rm) { const n = nf(), k = rm.dataset.rm; if (LIST.includes(k)) n[k] = n[k].filter(x => x !== rm.dataset.v); else delete n[k]; return update(n, true); }
        if (e.target.closest('[data-clear]')) return update({ fac: [], media: [], tags: [], group: DF.group, type: DF.type });
        const sb = e.target.closest('[data-sortpop]'); if (sb) return sortPop(sb, DF, 'dishes', v => update(Object.assign(nf(), { sort: v }), true));
        const dp = e.target.closest('[data-dpop]'); if (dp) {
          if (dp.dataset.dpop === 'area') {
            const opt = (k, v, l) => `<button class="fo ${(DF[k] || '') === v && (k === 'city' ? !DF.area : true) ? 'on' : ''}" data-ak="${k}" data-av="${v}"><i class="fo-r"></i><span>${l}</span></button>`;
            return K.choose(dp, t('area'), `<div class="fo-list">${opt('city', '', t('anywhere'))}${['dhaka', 'bogura'].map(c => `<h4 class="fo-h">${L(D.cities[c])}</h4>${opt('city', c, t('all_of', { c: L(D.cities[c]) }))}${D.areas.filter(a => a.city === c).map(a => opt('area', a.id, L(a))).join('')}`).join('')}</div>`, (p, close) => $$('[data-ak]', p).forEach(b => b.onclick = () => { const n = nf(); if (b.dataset.ak === 'area') { n.area = b.dataset.av; delete n.city; } else { n.city = b.dataset.av; delete n.area; } const c = close(); (c && c.then ? c : Promise.resolve()).then(() => update(n, true)); }), 'pop-sm');
          }
          const caps = [150, 250, 400, 600, 1000];
          return K.choose(dp, t('max_price'), `<div class="fo-list"><button class="fo ${!DF.max ? 'on' : ''}" data-mx=""><i class="fo-r"></i><span>${t('any_price')}</span></button>${caps.map(v => `<button class="fo ${String(DF.max) === String(v) ? 'on' : ''}" data-mx="${v}"><i class="fo-r"></i><span>${t('dish_upto', { v: K.tk(v) })}</span></button>`).join('')}</div>`, (p, close) => $$('[data-mx]', p).forEach(b => b.onclick = () => { const n = nf(); n.max = b.dataset.mx; const c = close(); (c && c.then ? c : Promise.resolve()).then(() => update(n, true)); }), 'pop-sm');
        }
      });
      let qt; el.addEventListener('input', e => { if (!e.target.matches('[data-q]')) return; clearTimeout(qt); const v = e.target.value.trim(); qt = setTimeout(() => { const n = JSON.parse(JSON.stringify(DF)); n.q = v; update(n, 'q'); const qi = $('[data-q]', el); qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); }, 260); });
    }
  };
})();
