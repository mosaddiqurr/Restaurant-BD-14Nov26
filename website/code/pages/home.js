/* Home: one search for the whole city, then every way in */
(function () {
  const K = window.K, D = K.data, t = K.t, L = K.L, ico = K.ico, $ = K.$, $$ = K.$$;
  const qs = new URLSearchParams(location.search);
  /* hero concept and headline can be previewed from options.html with ?hero= and ?hl= */
  const HERO = ['wall', 'plate', 'map'].includes(qs.get('hero')) ? qs.get('hero') : 'wall';
  const PRICE = ['kacchi', 'biryani', 'kebab', 'fuchka', 'thali'];
  const SPOT = ['kacchi', 'biryani', 'kebab', 'fuchka', 'fish', 'thali', 'tehari', 'bakery'];
  let priceType = 'kacchi', budget = 'all', hubTab = 'areas', showAllCats = false;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- hero ---------------- */
  function headline() {
    const hl = qs.get('hl');
    const parts = hl ? hl.split('|') : [t('hero_1'), t('hero_2')];
    return parts.map(p => `<span class="ln"><span>${K.esc(p)}</span></span>`).join(' ');
  }
  function searchBar() {
    const a = K.areaOf(K.S.area), ex = [t('ph_1'), t('ph_2'), t('ph_3'), t('ph_4')];
    return `<div class="hs">
      <button class="hs-area" data-act="area" aria-haspopup="dialog">${ico('map-pin')}<span><small>${t('area')}</small><b>${L(a)}</b></span>${ico('caret-down', 'sm')}</button>
      <button class="hs-q" data-act="search" aria-label="${t('search')}">${ico('magnifying-glass')}<span class="hs-rot" aria-hidden="true"><span>${ex.map(x => `<span>${K.esc(x)}</span>`).join('')}<span>${K.esc(ex[0])}</span></span></span></button>
      <button class="hs-ai" data-act="ask">${ico('sparkle-fill')}<span>${t('ask_ai')}</span></button>
    </div>`;
  }
  function wallArt() {
    const seen = new Set(), pics = [];
    const add = id => { if (id && !seen.has(id) && !String(id).startsWith('ph:')) { seen.add(id); pics.push(id); } };
    D.restaurants.forEach(r => { add(r.hero[0]); r.signature.forEach(s => { const d = r.menu.find(x => x.id === s); d && add(d.p); }); });
    D.restaurants.forEach(r => add(r.gallery.inside && r.gallery.inside[1]));
    const cols = [[], [], [], []]; pics.slice(0, 28).forEach((p, i) => cols[i % 4].push(p));
    return `<div class="wall" aria-hidden="true">${cols.map((c, ci) => `<div class="wall-col" style="--dur:${[64, 82, 70, 90][ci]}s"><div class="wall-run">${c.concat(c).map((p, i) => `<div class="wall-t ${(i + ci) % 3 === 0 ? 'tall' : ''}">${K.img(p, { w: 360, eager: i < 3 })}</div>`).join('')}</div></div>`).join('')}</div>`;
  }
  function plateArt() {
    const items = SPOT.filter(id => K.typePic(id));
    return `<div class="plate" aria-live="off">
      <div class="plate-disc">${items.map((id, i) => `<div class="plate-i ${i ? '' : 'on'}" data-pi="${i}">${K.img(K.typePic(id), { w: 900, eager: i === 0, alt: '' })}</div>`).join('')}<span class="plate-rim" aria-hidden="true"></span></div>
      <div class="plate-cap">${items.map((id, i) => { const s = K.typeStats(id); return `<a class="plate-c ${i ? '' : 'on'}" href="#/dishes?type=${id}" data-pc="${i}"><b>${L(D.types[id])}</b><span>${t('from_at', { p: K.tk(s.lo), n: K.n(s.places) })}</span></a>`; }).join('')}</div>
    </div>`;
  }
  function mapArt() {
    const box = { lo0: 90.335, lo1: 90.43, la0: 23.695, la1: 23.895 };
    const xy = (la, lo) => [((lo - box.lo0) / (box.lo1 - box.lo0) * 520 + 40).toFixed(1), ((box.la1 - la) / (box.la1 - box.la0) * 560 + 20).toFixed(1)];
    const jit = (id, k) => { let s = 0; for (const c of id) s = (s * 33 + c.charCodeAt(0)) % 997; return ((s % 21) - 10) * k; };
    const rs = D.restaurants.filter(r => r.city === 'dhaka');
    /* Banani and Gulshan sit almost on top of each other, so Banani's label goes above its circle */
    const areas = D.areas.filter(a => a.city === 'dhaka').map(a => { const [x, y] = xy(...K.LL[a.id]); return `<g class="mp-a"><circle cx="${x}" cy="${y}" r="46"/><text x="${x}" y="${a.id === 'banani' ? +y - 56 : +y + 64}">${L(a)}</text></g>`; }).join('');
    const pins = rs.map((r, i) => { const [x, y] = xy(...K.LL[r.area]); const px = +x + jit(r.id, 2.2), py = +y + jit(r.id + 'y', 2.2); return `<g class="mp-p" data-mp="${i}" style="--c:${r.theme.accent};--d:${i * .35}s" transform="translate(${px.toFixed(1)} ${py.toFixed(1)})"><circle class="mp-ring" r="14"/><circle class="mp-dot" r="6.5"/></g>`; }).join('');
    const cards = rs.map((r, i) => { const [x, y] = xy(...K.LL[r.area]); return `<a class="mp-card ${i ? '' : 'on'}" data-mc="${i}" href="#/r/${r.id}" style="--x:${(x / 600 * 100).toFixed(1)}%;--y:${(y / 600 * 100).toFixed(1)}%">${K.ph(r.hero[0], { w: 160 })}<span><b>${K.esc(L(r.name))}</b><span>${L(K.areaOf(r.area))}, ${K.ppRange(r)}</span></span></a>`; }).join('');
    return `<div class="mapart" aria-hidden="false"><svg viewBox="0 0 600 600" role="img" aria-label="${t('map_alt')}">
      <path class="mp-river" d="M-10 520 C 80 500, 140 560, 230 548 S 380 600, 470 560 S 560 600, 620 590"/>
      <path class="mp-river" d="M70 -10 C 60 80, 110 140, 80 230 S 40 380, 90 470 S 120 520, 150 600"/>
      <path class="mp-river thin" d="M560 -10 C 540 120, 600 240, 560 360 S 520 520, 600 610"/>
      <path class="mp-road" d="M300 20 L 300 590 M 40 330 L 580 330 M 120 120 L 520 520"/>
      ${areas}${pins}</svg>${cards}</div>`;
  }
  function hero() {
    const art = HERO === 'plate' ? plateArt() : HERO === 'map' ? mapArt() : wallArt();
    return `<section class="hm-hero hero-${HERO}" data-hero>
      <div class="hm-art">${art}</div>
      <div class="hm-shade" aria-hidden="true"></div>
      <div class="wrap hm-in">
        <h1 class="hm-title">${headline()}</h1>
        <p class="hm-sub">${t('hero_sub')}</p>
        ${searchBar()}
      </div>
    </section>`;
  }

  /* ---------------- partners strip (the page's one marquee) ---------------- */
  function partners() {
    const row = D.restaurants.map(K.lockup).join('');
    return `<section class="pt" aria-label="${t('partners')}"><div class="wrap pt-h"><p>${t('partners_line', { n: K.n(D.restaurants.length) })}</p></div>
      <div class="pt-track"><div class="pt-run">${row}<span class="pt-dup" aria-hidden="true">${row.replace(/<a /g, '<a tabindex="-1" ')}</span></div></div></section>`;
  }

  /* ---------------- categories ---------------- */
  function catTile(id, i) {
    const ty = D.types[id], s = K.typeStats(id), pic = K.typePic(id);
    return `<a class="cat" href="#/dishes?type=${id}" data-rv style="--d:${i % 6}">
      <div class="cat-ph">${pic ? K.ph(pic, { w: 420, alt: '' }) : `<div class="cat-np">${ico(ty.i || 'fork-knife')}</div>`}</div>
      <div class="cat-t"><b>${L(ty)}</b><span>${t('from_price', { p: K.tk(s.lo) })}</span></div></a>`;
  }
  function cats() {
    const order = D.cravings.concat(Object.keys(D.types).filter(id => !D.cravings.includes(id))).filter(id => K.allDishes.some(d => d.type === id));
    const shown = showAllCats ? order : order.slice(0, 12);
    return `<section class="sec hm-cats"><div class="wrap">
      <div class="sec-head"><h2 class="h2" data-rv>${t('craving')}</h2><a class="link more" href="#/dishes">${t('all_dishes')}${ico('arrow-right', 'sm')}</a></div>
      <div class="cat-grid">${shown.map(catTile).join('')}</div>
      ${order.length > 12 ? `<button class="btn btn-line cat-more" data-cats>${showAllCats ? t('show_less') : t('show_all_cats', { n: K.n(order.length) })}</button>` : ''}
    </div></section>`;
  }

  /* ---------------- near you ---------------- */
  function nearList() {
    const a = K.areaOf(K.S.area);
    let rs = D.restaurants.filter(r => r.city === a.city);
    const b = D.budgets.find(x => x.id === budget);
    if (b) rs = rs.filter(r => r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0));
    rs.sort((x, y) => (y.area === a.id) - (x.area === a.id) || K.openState(y).open - K.openState(x).open || y.rating - x.rating);
    return rs.length ? rs.map(r => K.rcard(r, { w: true })).join('') : `<div class="empty sm"><p>${t('no_budget_area')}</p></div>`;
  }
  function near() {
    const a = K.areaOf(K.S.area);
    return `<section class="sec hm-near"><div class="wrap">
      ${K.rail('near', nearList(), { head: `<div class="near-h"><h2 class="h2" data-rv>${t('near_title', { a: L(a) })}</h2><div class="near-tools"><button class="link" data-act="area">${ico('map-pin', 'sm')}${t('change_area')}</button><a class="link near-all" href="#/restaurants?city=${a.city}">${t('all_in_city', { c: L(D.cities[a.city]) })}${ico('arrow-right', 'sm')}</a><div class="seg near-seg" role="tablist" aria-label="${t('budget_pp')}"><button class="${budget === 'all' ? 'on' : ''}" data-bud="all">${t('any_budget')}</button>${D.budgets.map(b => `<button class="${budget === b.id ? 'on' : ''}" data-bud="${b.id}">${L(b)}</button>`).join('')}</div></div></div>` })}
      <a class="link near-foot" href="#/restaurants?city=${a.city}">${t('all_in_city', { c: L(D.cities[a.city]) })}${ico('arrow-right', 'sm')}</a>
    </div></section>`;
  }

  /* ---------------- every partner restaurant on one map ---------------- */
  let mapCity = null;
  const mapList = c => D.restaurants.filter(r => r.city === c);
  function mapSec() {
    mapCity = mapCity || K.areaOf(K.S.area).city;
    const cities = Object.keys(D.cities).filter(c => mapList(c).length);
    return `<section class="sec hm-map"><div class="wrap">
      <div class="sec-head map-head"><div><h2 class="h2" data-rv>${t('map_title')}</h2><p class="sub" data-rv>${t('map_sub')}</p></div>
        <div class="seg map-seg" role="tablist" aria-label="${t('city')}">${cities.map(c => `<button role="tab" class="${c === mapCity ? 'on' : ''}" data-mcity="${c}">${L(D.cities[c])}<span class="meta">${K.n(mapList(c).length)}</span></button>`).join('')}</div></div>
      <div class="hm-mapbox" data-rv="scale"><div class="hm-mapc" role="region" aria-label="${t('map_title')}"><div class="hm-map-ph">${ico('map-trifold', 'lg')}</div></div><span class="map-hint">${t('map_hint')}</span></div>
      <a class="link" href="#/restaurants?city=${mapCity}" data-mall>${t('all_in_city', { c: L(D.cities[mapCity]) })}${ico('arrow-right', 'sm')}</a>
    </div></section>`;
  }

  /* ---------------- browse every way ---------------- */
  function hub() {
    const tabs = [['areas', t('areas')], ['occasions', t('occasions')], ['budget', t('budget')], ['facilities', t('facilities')], ['cuisines', t('cuisines')]];
    return `<section class="sec hm-hub"><div class="wrap">
      <h2 class="h2" data-rv>${t('browse_all')}</h2>
      <div class="seg hub-seg" role="tablist">${tabs.map(([id, l]) => `<button role="tab" class="${hubTab === id ? 'on' : ''}" data-hub="${id}">${l}</button>`).join('')}</div>
      <div class="hub-body">${hubBody()}</div>
    </div></section>`;
  }
  function hubBody() {
    const rcount = f => D.restaurants.filter(f).length;
    if (hubTab === 'areas') return `<div class="area-grid">${D.areas.map((a, i) => { const rs = D.restaurants.filter(r => r.area === a.id); return `<a class="area-card" href="#/restaurants?area=${a.id}" data-rv style="--d:${i % 4}">${K.ph(rs[0] ? rs[0].hero[0] : null, { w: 520, word: L(a) })}<div class="ac-t"><b>${L(a)}</b><span>${L(D.cities[a.city])}, ${t('n_places', { n: K.n(rs.length) })}</span></div><p>${L(a.blurb)}</p></a>`; }).join('')}</div>`;
    if (hubTab === 'cuisines') return `<div class="tile-grid">${D.cuisines.map((c, i) => { const ds = K.allDishes.filter(d => K.cuOf(d) === c.id); return `<a class="tile" href="#/dishes?cu=${c.id}" data-rv style="--d:${i % 4}"><b>${L(c)}</b><span>${t('n_dishes_places', { d: K.n(ds.length), p: K.n(new Set(ds.map(d => d.r)).size) })}</span>${ico('arrow-right', 'sm')}</a>`; }).join('')}</div>`;
    if (hubTab === 'occasions') return `<div class="tile-grid">${D.occasions.map((o, i) => `<a class="tile" href="#/restaurants?occ=${o.id}" data-rv style="--d:${i % 4}">${ico(o.i, 'lg')}<b>${L(o)}</b>${ico('arrow-right', 'sm')}</a>`).join('')}</div>`;
    if (hubTab === 'budget') return `<div class="tile-grid">${D.budgets.map((b, i) => `<a class="tile big" href="#/restaurants?bud=${b.id}" data-rv style="--d:${i}"><span class="meta">${t('per_person')}</span><b>${L(b)}</b><span>${t('n_places', { n: K.n(rcount(r => r.ppl[0] < (b.max || 1e9) && r.ppl[1] > (b.min || 0))) })}</span></a>`).join('')}</div>`;
    return `<div class="tile-grid">${Object.entries(D.facilities).map(([id, f], i) => `<a class="tile" href="#/restaurants?fac=${id}" data-rv style="--d:${i % 4}">${ico(f.i, 'lg')}<b>${L(f)}</b><span>${t('n_places', { n: K.n(rcount(r => r.fac.includes(id))) })}</span></a>`).join('')}</div>`;
  }

  /* ---------------- ask ---------------- */
  function aiSec() {
    const ex = [t('try_1'), t('try_4'), t('try_5')];
    return `<section class="sec hm-ai" id="ask"><div class="wrap hm-ai-in">
      <div class="hm-ai-copy">
        <h2 class="h2" data-rv>${t('ai_title')}</h2>
        <p class="lede" data-rv>${t('ai_sub')}</p>
        <div class="ai-ex" data-rv>${ex.map(x => `<button data-act="ask" data-q="${K.esc(x)}"><span>${K.esc(x)}</span>${ico('arrow-up-right', 'sm')}</button>`).join('')}</div>
        <button class="btn btn-primary btn-lg" data-act="ask" data-rv>${ico('sparkle-fill')}${t('ask_title')}</button>
      </div>
      <div class="hm-ai-demo"><div class="ai-demo-win"><div class="ai-demo-h"><span class="ai-orb">${ico('sparkle-fill')}</span><b>${t('ask_title')}</b><span class="meta">${t('ask_langs')}</span></div><div class="ai-demo-body"></div></div></div>
    </div></section>`;
  }

  /* ---------------- see it before you go ---------------- */
  function bento() {
    const kr = K.r('kathgolap'), sh = K.r('shahi-handi'), ca = K.r('cha-adda');
    const cake = ca.menu.find(d => d.id === 'strawberry-cake');
    const k = sh.menu.find(d => d.id === 'mutton-kacchi');
    const sub = k.price * 4, vat = sub * sh.vat / 100, svc = sub * sh.service / 100;
    return `<section class="sec hm-see"><div class="wrap">
      <h2 class="h2" data-rv>${t('see_title')}</h2><p class="sub" data-rv>${t('see_sub')}</p>
      <div class="bento">
        <div class="bx bx-tour" data-rv="scale"><canvas aria-hidden="true"></canvas><img class="bx-poster" src="${K.src('pv:hotel_rooftop_balcony:a')}" alt="" loading="lazy"><div class="bx-cap"><h3>${t('bx_tour')}</h3><p>${t('bx_tour_sub', { r: L(kr.name) })}</p><button class="btn btn-white" data-tour="${kr.id}">${ico('virtual-reality')}${t('step_inside')}</button></div></div>
        <div class="bx bx-3d" data-rv="scale" style="--d:1"><div class="bx-3d-stage" data-d3="${cake.d3}">${K.ph(cake.p, { w: 600 })}</div><div class="bx-cap"><h3>${t('bx_3d')}</h3><p>${K.esc(L(cake.name))}, ${K.esc(L(ca.name))}</p><button class="btn btn-ink btn-sm" data-dish="${ca.id}|${cake.id}" data-tab="d3">${ico('cube')}${t('turn_it')}</button></div></div>
        <div class="bx bx-film" data-rv="scale" style="--d:2"><video muted loop playsinline preload="none" poster="${K.src(sh.kitchen.poster, 900)}" data-src="${sh.kitchen.src}"></video><div class="bx-cap"><h3>${t('bx_kitchen')}</h3><p>${K.esc(L(sh.name))}. ${L(sh.kitchen.date)}</p></div></div>
        <div class="bx bx-bill" data-rv="scale" style="--d:3"><div class="bx-cap"><h3>${t('bx_bill')}</h3><p>${t('bx_bill_sub')}</p></div>
          <div class="mini-bill"><div class="mb-r">${K.mono(sh)}<b>${K.esc(L(sh.name))}</b></div>
            <div class="mb-l"><span>${K.n(4)} × ${K.esc(L(k.name))}</span><span class="num">${K.tk(sub)}</span></div>
            <div class="mb-l m"><span>${t('vat')} ${K.n(sh.vat)}%</span><span class="num">${K.tk(vat)}</span></div>
            <div class="mb-l m"><span>${t('service')} ${K.n(sh.service)}%</span><span class="num">${K.tk(svc)}</span></div>
            <div class="mb-t"><span>${t('total_all_in')}</span><b class="num">${K.tk(sub + vat + svc)}</b></div>
            <div class="mb-pp"><span>${t('each_of', { n: K.n(4) })}</span><b class="num">${K.tk((sub + vat + svc) / 4)}</b></div></div></div>
      </div>
    </div></section>`;
  }

  /* ---------------- deal of the week ---------------- */
  function dealSec() {
    const r = D.restaurants.find(x => x.deal && x.deal.week), d = r.deal;
    return `<section class="sec hm-deal"><div class="wrap">
      <a class="deal-wide" href="#/r/${r.id}" style="--r-accent:${r.theme.accent};--r-deep:${r.theme.deep}" data-rv>
        ${K.ph(d.p, { w: 1100 })}
        <div class="dw-body"><span class="dw-k">${t('deal_week')}</span>
          <h2 class="h2">${K.esc(L(d))}</h2><p>${K.esc(L(d.desc))} ${K.esc(L(d.when))}.</p>
          <div class="dw-price"><b class="num">${K.tk(d.price)}</b><span class="was num">${K.tk(d.was)}</span><span class="dw-save">${t('save_x', { v: K.tk(d.was - d.price) })}</span></div>
          <span class="dw-r">${K.mono(r)}${K.esc(L(r.name))}, ${L(K.areaOf(r.area))}${ico('arrow-right', 'sm')}</span></div>
      </a>
      <div class="hm-deal-more"><a class="link" href="#/deals">${t('all_deals')}${ico('arrow-right', 'sm')}</a></div>
    </div></section>`;
  }

  /* ---------------- price check: one dish, every restaurant ---------------- */
  function priceBody() {
    const ds = K.allDishes.filter(d => d.type === priceType && !d.share).sort((a, b) => a.price - b.price);
    if (!ds.length) return '';
    const pr = ds.map(d => d.price), mid = pr[Math.floor(pr.length / 2)], max = Math.max(...pr);
    const name = L(D.types[priceType]);
    return `<div class="pc-sum"><span class="meta">${t('pc_typical', { d: name.toLowerCase() })}</span><b class="num">${K.tk(mid)}</b><span class="meta">${t('pc_range', { lo: K.tk(pr[0]), hi: K.tk(max), n: K.n(new Set(ds.map(d => d.r)).size) })}</span>
        <a class="btn btn-line btn-sm" href="#/dishes?type=${priceType}">${t('pc_all', { d: name.toLowerCase() })}${ico('arrow-right', 'sm')}</a></div>
      <ol class="pc-list">${ds.slice(0, 7).map((d, i) => { const r = K.r(d.r), diff = d.price - mid; return `<li style="--i:${i}"><a href="#/r/${r.id}?dish=${d.id}" data-dish="${r.id}|${d.id}">${K.mono(r)}<span class="pc-n"><b>${K.esc(L(r.name))}</b><span>${K.esc(L(d.name))}, ${L(K.areaOf(r.area))}</span></span><span class="pc-bar ${diff === 0 ? 'typ' : ''}" style="--w:${(d.price / max * 100).toFixed(1)}%"></span><span class="pc-p"><b class="num">${K.tk(d.price)}</b><span class="${diff < 0 ? 'lo' : diff > 0 ? 'hi' : ''}">${diff === 0 ? t('pc_typ') : (diff < 0 ? '−' : '+') + K.tk(Math.abs(diff))}</span></span></a></li>`; }).join('')}</ol>`;
  }
  function priceSec() {
    return `<section class="sec hm-price"><div class="wrap">
      <h2 class="h2" data-rv>${t('pc_title')}</h2><p class="sub" data-rv>${t('pc_sub')}</p>
      <div class="seg pc-seg" role="tablist">${PRICE.map(id => `<button role="tab" class="${id === priceType ? 'on' : ''}" data-pt="${id}">${L(D.types[id])}</button>`).join('')}</div>
      <div class="pc" data-rv>${priceBody()}</div>
    </div></section>`;
  }

  /* ---------------- owners ---------------- */
  function ownerSec() {
    const r = K.r('shahi-handi');
    return `<section class="hm-own"><div class="wrap own-in">
      <div class="own-copy"><h2 class="h2" data-rv>${t('own_title')}</h2><p class="lede" data-rv>${t('own_sub')}</p>
        <ul class="own-pts" data-rv><li>${ico('qr-code')}<span><b>${t('own_p1')}</b>${t('own_p1s')}</span></li><li>${ico('printer')}<span><b>${t('own_p2')}</b>${t('own_p2s')}</span></li><li>${ico('chart-line-up')}<span><b>${t('own_p3')}</b>${t('own_p3s')}</span></li></ul>
        <div class="own-btns" data-rv><a class="btn btn-gold btn-lg" href="#/business">${t('see_plans')}</a><a class="btn btn-glass btn-lg" href="#/t/${r.id}">${t('try_table')}</a></div></div>
      <div class="own-art" data-rv="scale">${K.ph('pv:warm_restaurant_night:b', { w: 1000 })}
        <a class="tcard" href="#/t/${r.id}" style="--r-deep:${r.theme.deep};--r-accent:${r.theme.accent}" data-font="${r.theme.font}"><span class="tc-n rp-display">${K.esc(r.name.en)}</span><span class="tc-qr" data-qrhome></span><b>${t('tc_scan')}</b><span>মেনু ও দাম দেখতে স্ক্যান করুন</span><small>${K.BRAND}</small></a></div>
    </div></section>`;
  }

  K.views.home = {
    chrome: { over: true, tab: 'home' },
    render: () => `${hero()}${partners()}${cats()}${near()}${mapSec()}${hub()}${aiSec()}${bento()}${dealSec()}${priceSec()}${ownerSec()}`,
    mount(el) {
      K._ctxR = null;
      const heroEl = $('.hm-hero', el);
      /* hero motion only runs while the hero is on screen */
      const hv = new IntersectionObserver(([en]) => heroEl.classList.toggle('paused', !en.isIntersecting), { threshold: 0 });
      hv.observe(heroEl);
      let cyc = null;
      if (HERO === 'plate' && !reduce()) { const items = $$('.plate-i', el), caps = $$('.plate-c', el); let i = 0; cyc = setInterval(() => { if (heroEl.classList.contains('paused') || document.hidden) return; items[i].classList.remove('on'); caps[i].classList.remove('on'); i = (i + 1) % items.length; items[i].classList.add('on'); caps[i].classList.add('on'); }, 3400); }
      if (HERO === 'map') { const pins = $$('.mp-p', el), cards = $$('.mp-card', el); let i = 0; const show = n => { pins.forEach((p, j) => p.classList.toggle('on', j === n)); cards.forEach((c, j) => c.classList.toggle('on', j === n)); }; show(0); if (!reduce()) cyc = setInterval(() => { if (heroEl.classList.contains('paused') || document.hidden) return; i = (i + 1) % pins.length; show(i); }, 2600); pins.forEach((p, j) => p.addEventListener('pointerenter', () => { i = j; show(j); })); }
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-bud]'); if (b) { budget = b.dataset.bud; $$('[data-bud]', el).forEach(x => x.classList.toggle('on', x === b)); const tr = $('#near .rail-track', el); tr.innerHTML = nearList(); tr.scrollTo({ left: 0 }); return; }
        const p = e.target.closest('[data-pt]'); if (p) { priceType = p.dataset.pt; $$('[data-pt]', el).forEach(x => x.classList.toggle('on', x === p)); const w = $('.pc', el); w.classList.add('swap'); setTimeout(() => { w.innerHTML = priceBody(); w.classList.remove('swap'); }, 160); return; }
        const h = e.target.closest('[data-hub]'); if (h) { hubTab = h.dataset.hub; $$('[data-hub]', el).forEach(x => x.classList.toggle('on', x === h)); const hb = $('.hub-body', el); hb.innerHTML = hubBody(); K.reveal(hb); return; }
        if (e.target.closest('[data-cats]')) { showAllCats = !showAllCats; const s = $('.hm-cats', el); s.outerHTML = cats(); $$('.hm-cats [data-rv]', el).forEach(x => x.classList.add('in')); return; }
        const dt = e.target.closest('[data-tab="d3"][data-dish]'); if (dt) { K._dishTab = 'd3'; }
        const mc = e.target.closest('[data-mcity]'); if (mc) { mapCity = mc.dataset.mcity; $$('[data-mcity]', el).forEach(x => x.classList.toggle('on', x === mc)); const all = $('[data-mall]', el); all.setAttribute('href', `#/restaurants?city=${mapCity}`); all.firstChild.textContent = t('all_in_city', { c: L(D.cities[mapCity]) }); if (rmap) rmap.show(mapList(mapCity)); return; }
      }, true);
      /* heavy media wakes up only when it scrolls into view */
      const io = new IntersectionObserver(es => es.forEach(en => {
        const x = en.target;
        if (x.classList.contains('bx-tour')) { if (en.isIntersecting && !x._v) { x._v = K.inlinePano(x, 'hotel_rooftop_balcony', { yaw: 130, pitch: -2, fov: 82, auto: 3, scale: .9, onReady: () => $('.bx-poster', x).classList.add('gone') }); if (x._v) $('canvas', x).style.touchAction = 'pan-y'; } return; }
        if (x.tagName === 'VIDEO') { if (en.isIntersecting) { if (!x.src) x.src = x.dataset.src; x.play().catch(() => { }); } else x.pause(); return; }
        if (x.dataset.d3 && en.isIntersecting && !x._m) { x._m = 1; K.d3.mount(x, x.dataset.d3, { compact: true, alt: '' }); io.unobserve(x); return; }
        if (x.classList.contains('hm-ai-demo') && en.isIntersecting && !x._p) { x._p = 1; playDemo(x); }
        if (x.hasAttribute('data-qrhome') && en.isIntersecting && !x._q) { x._q = 1; K.qrArt(x, K.siteUrl('/t/shahi-handi'), K.qrStyle(K.r('shahi-handi'))); }
      }), { rootMargin: '160px 0px' });
      $$('.bx-tour, .bx-film video, [data-d3], .hm-ai-demo, [data-qrhome]', el).forEach(x => io.observe(x));
      /* the map (and its library) loads only when you get near it */
      let rmap = null;
      const mapEl = $('.hm-mapc', el);
      const mo = new IntersectionObserver(([en]) => { if (en.isIntersecting && !rmap) { mapEl.innerHTML = ''; rmap = K.restMap(mapEl, { list: mapList(mapCity) }); mo.disconnect(); } }, { rootMargin: '400px 0px' });
      mo.observe(mapEl);
      K.onLeave(() => { io.disconnect(); hv.disconnect(); mo.disconnect(); clearInterval(cyc); rmap && rmap.destroy(); });
    }
  };

  /* the demo replays a real answer from the same engine the assistant uses */
  function playDemo(host) {
    const body = $('.ai-demo-body', host); if (!K.ai) return;
    const q = K.S.lang === 'bn' ? 'আমরা ৪ জন, ২৫০০ টাকা, ধানমন্ডি, ফ্যামিলি' : 'amra 4 jon, 2500 taka, Dhanmondi, family';
    const a = K.ai.preview(q);
    const final = `<div class="ai-msg me"><p>${K.esc(q)}</p></div><div class="ai-msg bot done"><p>${K.esc(a.text)}</p><div class="ai-cards">${a.html}</div></div>`;
    /* lay the finished chat out once, unseen, so the window is its final size from the start and never jumps */
    const fit = () => {
      if (body._done) return;
      const g = document.createElement('div'); g.className = 'ai-demo-body';
      g.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:0;right:0;top:0;padding:0';
      g.innerHTML = final; body.style.position = 'relative'; body.append(g);
      body.style.minHeight = (g.offsetHeight + parseFloat(getComputedStyle(body).paddingTop)) + 'px'; g.remove();
    };
    if (!host._fit) { host._fit = 1; addEventListener('resize', fit); }
    body.innerHTML = `<div class="ai-msg me"><p class="typed"></p></div>`; fit();
    const p = $('.typed', body); let i = 0;
    const type = () => { p.textContent = q.slice(0, ++i); if (i < q.length && !reduce()) setTimeout(type, 36); else think(); };
    /* the typing dots show it is working, then the answer fades in as one piece */
    const think = () => { body.insertAdjacentHTML('beforeend', `<div class="ai-msg bot typing"><span></span><span></span><span></span></div>`); setTimeout(reply, 1100); };
    const reply = () => { const ty = $('.typing', body); if (ty) ty.remove(); body.insertAdjacentHTML('beforeend', `<div class="ai-msg bot done"><p>${K.esc(a.text)}</p><div class="ai-cards">${a.html}</div></div>`); $$('[data-use]', body).forEach(b => b.setAttribute('tabindex', '-1')); body._done = 1; body.style.minHeight = ''; };
    reduce() ? (p.textContent = q, reply()) : type();
  }
})();
