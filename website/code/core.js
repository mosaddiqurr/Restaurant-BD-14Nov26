/* khabo core: state, formatting, images, router, chrome, sheets, bill, search. No framework, no build step. */
(function () {
  const K = window.K, D = K.data;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  K.$ = $; K.$$ = $$;
  K.BRAND = 'khabo';

  /* ---------- storage + state ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('kh2.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('kh2.' + k, JSON.stringify(v)); } catch (e) { } }
  };
  K.store = store;
  const qs0 = new URLSearchParams(location.search);
  K.S = {
    lang: qs0.get('lang') || store.get('lang', 'en'),
    theme: qs0.get('theme') || store.get('theme', 'auto'),
    area: store.get('area', 'dhanmondi'),
    bills: store.get('bills', {}),
    lastBill: store.get('lastBill', null),
    recent: store.get('recent', [])
  };
  K.embed = qs0.get('embed') === '1';

  /* ---------- text + numbers ---------- */
  const nf = { en: new Intl.NumberFormat('en-IN'), bn: new Intl.NumberFormat('bn-BD') };
  K.L = o => o == null ? '' : (typeof o === 'string' ? o : (o[K.S.lang] != null ? o[K.S.lang] : o.en));
  K.n = v => nf[K.S.lang === 'bn' ? 'bn' : 'en'].format(v);
  K.tk = v => '৳' + K.n(Math.round(v));
  const BD = '০১২৩৪৫৬৭৮৯';
  K.dg = s => K.S.lang === 'bn' ? String(s).replace(/[0-9]/g, d => BD[d]) : String(s);
  K.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  K.t = (k, v) => {
    const T = K.T || {};
    /* "1 place", not "1 places": a key_one variant wins when the count is one */
    if (v && (v.n === 1 || v.n === '1' || v.n === '১') && T.en && T.en[k + '_one']) k = k + '_one';
    let s = (T[K.S.lang] && T[K.S.lang][k]) || (T.en && T.en[k]) || k;
    if (v) s = s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m);
    return s;
  };
  const t = K.t, L = K.L;
  K.ico = (n, c = '') => `<svg class="ico ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const ico = K.ico;

  /* ---------- data helpers ---------- */
  const byId = {};
  D.restaurants.forEach(r => {
    byId[r.id] = r;
    r.menu.forEach(d => { d.r = r.id; if (!d.cat) d.cat = r.cats[0].id; });
    r.hasTour = !!(r.tour && r.tour.length);
    r.hasFilm = !!r.film;
    r.has3d = r.menu.some(d => d.d3);
    r.hasKitchen = !!r.kitchen;
  });
  K.r = id => byId[id];
  K.dish = (rid, did) => { const r = byId[rid]; return r && r.menu.find(d => d.id === did); };
  K.areaOf = id => D.areas.find(a => a.id === id);
  K.allDishes = D.restaurants.flatMap(r => r.menu);
  K.typeOf = d => D.types[d.type] || {};
  K.cuOf = d => (D.types[d.type] || {}).cu;
  K.revOf = rid => D.reviews.filter(x => x.r === rid);
  K.where = r => `${L(K.areaOf(r.area))}, ${L(D.cities[r.city])}`;
  K.ppRange = r => `${K.tk(r.ppl[0])}-${K.n(r.ppl[1])}`;
  K.allIn = (r, sub) => sub * (1 + (r.vat + r.service) / 100);
  K.checked = days => days <= 1 ? t('checked_today') : t('checked_days', { n: K.n(days) });
  K.priceHist = d => { // 6 months, gentle, deterministic. last value = today
    let s = 0; for (const c of d.id) s = (s * 31 + c.charCodeAt(0)) % 9973;
    const out = []; let p = d.price;
    for (let i = 0; i < 6; i++) { out.unshift(p); s = (s * 57 + 13) % 9973; const step = [0, 0, 0, -10, -10, -20, 10][s % 7]; p = Math.max(20, p + step); }
    return out;
  };
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  K.openState = (r, now = new Date()) => {
    const o = toMin(r.hours[0]); let c = toMin(r.hours[1]); const m = now.getHours() * 60 + now.getMinutes();
    if (c <= o) c += 1440;
    const mm = m < o && m + 1440 < c ? m + 1440 : m;
    const open = mm >= o && mm < c;
    const fmt = s => { let [h, mi] = s.split(':').map(Number); const ap = h >= 12 && h < 24 ? 'PM' : 'AM'; h = h % 12 || 12; return K.dg(`${h}${mi ? ':' + String(mi).padStart(2, '0') : ''} ${K.S.lang === 'bn' ? (ap === 'AM' ? 'এএম' : 'পিএম') : ap}`); };
    return { open, soon: open && c - mm <= 45, label: open ? t('open_till', { t: fmt(r.hours[1]) }) : t('opens_at', { t: fmt(r.hours[0]) }), close: fmt(r.hours[1]), from: fmt(r.hours[0]) };
  };
  K.isLate = r => { const c = toMin(r.hours[1]); return c <= toMin('04:00') || c >= toMin('23:30'); };

  /* ---------- images ---------- */
  K.src = (id, w = 800, h) => {
    if (!id) return '';
    if (id.startsWith('ph:')) return `https://cdn.polyhaven.com/asset_img/primary/${id.slice(3)}.png?height=${Math.min(1200, Math.max(256, Math.round(w)))}`;
    if (id.startsWith('pv:')) { const [, p, v] = id.split(':'); return `${K.panoDir(p)}${p}-${v}.jpg`; }
    const p = D.P[id]; if (!p) return '';
    return `https://images.unsplash.com/photo-${p}?w=${Math.round(w)}${h ? `&h=${Math.round(h)}` : ''}&q=70&auto=format&fit=crop`;
  };
  K.img = (id, o = {}) => {
    const w = o.w || 640, alt = K.esc(o.alt || '');
    if (!id) return '';
    let set = '';
    if (!id.startsWith('pv:')) set = `srcset="${K.src(id, w, o.h)} 1x, ${K.src(id, w * 2, o.h ? o.h * 2 : 0)} 2x"`;
    return `<img src="${K.src(id, w, o.h)}" ${set} alt="${alt}" ${o.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${o.style ? `style="${o.style}"` : ''} onload="this.classList.add('ld')" onerror="this.classList.add('ld')">`;
  };
  /* photo block: studio backdrop for 3D scans, a calm type tile when a dish has no photo yet */
  K.ph = (id, o = {}) => {
    const cls = `ph ${id && id.startsWith('ph:') ? 'studio' : ''} ${o.cls || ''}`;
    const inner = id ? K.img(id, o) : (o.tone ? `<div class="nophoto tone" style="--np-d:${o.tone.deep};--np-a:${o.tone.accent}" aria-hidden="true">${ico(o.icon || 'fork-knife')}</div>` : `<div class="nophoto" aria-hidden="true">${K.esc((o.word || '').trim().charAt(0))}</div>`);
    return `<div class="${cls}" ${o.attr || ''}>${inner}${o.extra || ''}</div>`;
  };

  /* ---------- theme + language ---------- */
  const mq = matchMedia('(prefers-color-scheme: dark)');
  K.applyTheme = () => {
    const th = K.S.theme === 'auto' ? (mq.matches ? 'dark' : 'light') : K.S.theme;
    document.documentElement.dataset.theme = th;
    const m = $('meta[name=theme-color]'); if (m) m.content = th === 'dark' ? '#070A1C' : '#F5F6FB';
  };
  mq.addEventListener && mq.addEventListener('change', () => K.S.theme === 'auto' && K.applyTheme());
  K.setTheme = v => { K.S.theme = v; store.set('theme', v); K.applyTheme(); };
  K.setLang = v => {
    K.S.lang = v; store.set('lang', v); document.documentElement.lang = v;
    renderChrome(); K.route(true); K.bill.paint();
  };

  /* ---------- reveal on scroll ---------- */
  const rvObs = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); rvObs.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 }) : null;
  K.reveal = root => $$('[data-rv]', root).forEach(el => rvObs ? rvObs.observe(el) : el.classList.add('in'));

  /* ---------- cleanup registry for the current view ---------- */
  let leaveFns = [];
  K.onLeave = fn => leaveFns.push(fn);
  const runLeave = () => { leaveFns.forEach(f => { try { f(); } catch (e) { } }); leaveFns = []; };

  /* ---------- router ---------- */
  K.views = {};
  const routes = [
    [/^\/?$/, 'home'], [/^\/restaurants$/, 'restaurants'], [/^\/dishes$/, 'dishes'], [/^\/explore$/, 'explore'],
    [/^\/r\/([\w-]+)$/, 'restaurant'], [/^\/r\/([\w-]+)\/print$/, 'print'], [/^\/t\/([\w-]+)$/, 'table'],
    [/^\/deals$/, 'deals'], [/^\/business$/, 'business'], [/^\/ask$/, 'home']
  ];
  K.parseHash = () => {
    const h = location.hash.replace(/^#/, '') || '/';
    const [path, q] = h.split('?');
    return { path: path || '/', q: new URLSearchParams(q || '') };
  };
  const scrollMem = {};
  let navFlag = false, curKey = null, curView = null;
  K.go = (to, o = {}) => {
    if (o.replace) { history.replaceState(history.state, '', '#' + to); if (!o.silent) K.route(); return; }
    navFlag = true;
    if (location.hash === '#' + to) K.route(true); else location.hash = to;
  };
  K.route = (force) => {
    const { path, q } = K.parseHash();
    let name = 'home', params = [];
    for (const [re, n] of routes) { const m = path.match(re); if (m) { name = n; params = m.slice(1); break; } }
    if ((name === 'restaurant' || name === 'table') && !K.r(params[0])) name = 'home';
    /* old explore links: dishes view goes to Dishes, everything else to Restaurants */
    if (name === 'explore') { const isD = q.get('view') === 'd'; q.delete('view'); name = isD ? 'dishes' : 'restaurants'; history.replaceState(history.state, '', `#/${name}${q.toString() ? '?' + q : ''}`); }
    K.pop && K.pop.close();
    const key = location.hash || '#/';
    const back = !navFlag && !force; navFlag = false;
    const v = K.views[name];
    if (!v) return;
    if (!force || !curKey) K._navCount = (K._navCount || 0) + 1;
    const swap = () => {
      runLeave();
      K.sheet.closeAll(true);
      const app = $('#app');
      app.innerHTML = `<div class="view view-${name}">${v.render(params, q)}</div>`;
      const view = app.firstElementChild;
      app.classList.remove('view-enter'); void app.offsetWidth; if (!document.startViewTransition) app.classList.add('view-enter');
      document.body.className = '';
      const ch = v.chrome || {};
      document.body.classList.toggle('has-tabbar', ch.tabbar !== false);
      document.body.classList.toggle('no-tabbar', ch.tabbar === false);
      document.body.classList.toggle('print-mode', !!ch.print);
      document.body.classList.toggle('pad', !ch.over && !ch.bare);
      document.body.classList.toggle('bare', !!ch.bare);
      $('.tabbar').style.display = ch.tabbar === false ? 'none' : '';
      $('.ftr').style.display = ch.footer === false ? 'none' : '';
      $$('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === (ch.tab || name)));
      $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.tab === (ch.tab || name)));
      document.title = (v.title ? v.title(params, q) + ' · ' : '') + K.BRAND;
      setHeaderMode(ch.over);
      if (!force || curKey !== key) scrollTo(0, back && scrollMem[key] != null ? scrollMem[key] : 0);
      v.mount && v.mount(view, params, q);
      K.reveal(view);
      K.bill.paint();
      curKey = key; curView = name;
      if (path === '/ask') setTimeout(() => K.ai && K.ai.open(q.get('q') || ''), 60);
    };
    const morph = K._morph, prevR = curView === 'restaurant' && name !== 'restaurant' && (curKey || '').match(/^#\/r\/([\w-]+)/);
    if (document.startViewTransition && !force && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      /* back from a restaurant: its photo shrinks back into the card it was opened from */
      let backTo = null; const named = [];
      if (!morph && back && prevR && scrollY < innerHeight * .5) { const m = $('#app .rp-media'); if (m) { m.style.viewTransitionName = 'hero-morph'; named.push(m); backTo = prevR[1]; } }
      K.vt(morph ? 'morph' : back ? 'back' : 'fwd', () => {
        swap();
        const c = backTo && $(`#app [data-vt="${backTo}"] .rc-media`), b = c && c.getBoundingClientRect();
        if (b && b.bottom > 0 && b.top < innerHeight) { c.style.viewTransitionName = 'hero-morph'; named.push(c); }
      }, morph || backTo).finally(() => { if (morph) morph.style.viewTransitionName = ''; named.forEach(x => x.style.viewTransitionName = ''); const h = $('#app [style*="view-transition-name"]'); if (h) h.style.viewTransitionName = ''; K._morph = null; });
    } else { swap(); K._morph = null; }
  };
  /* run a DOM change as a view transition; `kind` picks the choreography in motion.css */
  let vtTok = 0;
  K.vt = (kind, fn, hero) => {
    const d = document.documentElement;
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { fn(); return Promise.resolve(); }
    const my = ++vtTok; d.dataset.vt = kind; if (hero) d.dataset.vtHero = ''; else delete d.dataset.vtHero;
    const v = document.startViewTransition(fn);
    /* a hidden tab or a quicker second click skips the animation; the page still updates */
    v.ready.catch(() => { });
    return v.finished.catch(() => { }).finally(() => { if (my === vtTok) { delete d.dataset.vt; delete d.dataset.vtHero; } });
  };
  addEventListener('hashchange', e => { try { scrollMem[new URL(e.oldURL).hash || '#/'] = scrollY; } catch (x) { } K.route(); });
  /* back button closes the top sheet first */
  addEventListener('popstate', e => { if (K.sheet.count() && !(e.state && e.state.sheet)) K.sheet.close(null, true); });

  /* ---------- header behaviour ---------- */
  let heroObs = null;
  function setHeaderMode(over) {
    const hdr = $('.hdr');
    if (heroObs) { heroObs.disconnect(); heroObs = null; }
    hdr.classList.remove('over');
    if (!over) return;
    const hero = $('[data-hero]');
    if (!hero) return;
    hdr.classList.add('over');
    heroObs = new IntersectionObserver(([en]) => hdr.classList.toggle('over', en.isIntersecting), { rootMargin: `-${hdr.offsetHeight + 4}px 0px 0px 0px`, threshold: 0 });
    heroObs.observe(hero);
  }

  /* ---------- chrome: header, tab bar, footer ---------- */
  const logo = () => `<a class="logo" href="#/" aria-label="${K.BRAND} home"><svg class="logo-mk" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#2A3DB8"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="19.2" cy="13" r="3.1" fill="#F5A300"/></svg><span>${K.BRAND}</span></a>`;
  K.logo = logo;
  /* signed-in diner (demo: kept on this device only) */
  K.user = () => store.get('user', null);
  const initials = s => String(s || '').trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  K.initials = initials;
  const acct = () => { const u = K.user(); return u ? `<button class="acct on" data-act="me" aria-label="${t('your_account')}"><span class="acct-av">${K.esc(initials(u.name))}</span></button>` : `<button class="acct" data-act="me">${ico('user-circle')}<span>${t('sign_in')}</span></button>`; };

  /* the Restaurants menu: every way to browse, one hover away */
  function mega() {
    const cnt = f => D.restaurants.filter(f).length;
    const city = c => `<div class="mg-col"><h4>${L(D.cities[c])}</h4>${D.areas.filter(a => a.city === c).map(a => `<a href="#/restaurants?area=${a.id}">${L(a)}<span>${K.n(cnt(r => r.area === a.id))}</span></a>`).join('')}</div>`;
    const deal = D.restaurants.find(x => x.deal && x.deal.week);
    return `<div class="wrap mg-in">
      ${city('dhaka')}
      <div class="mg-col">${city('bogura').replace('<div class="mg-col">', '').replace(/<\/div>$/, '')}<h4 class="mg-gap">${t('budget_pp')}</h4>${D.budgets.map(b => `<a href="#/restaurants?bud=${b.id}">${L(b)}</a>`).join('')}</div>
      <div class="mg-col"><h4>${t('occasions')}</h4>${D.occasions.filter(o => o.id !== 'tour').map(o => `<a href="#/restaurants?occ=${o.id}">${L(o)}</a>`).join('')}</div>
      <div class="mg-col"><h4>${t('facilities')}</h4>${['cabin', 'rooftop', 'parking', 'prayer', 'kids', 'events'].map(f => `<a href="#/restaurants?fac=${f}">${L(D.facilities[f])}</a>`).join('')}</div>
      ${deal ? `<a class="mg-card" href="#/r/${deal.id}">${K.ph(deal.deal.p, { w: 520 })}<span class="mg-card-t"><span class="meta">${t('deal_week')}</span><b>${K.esc(L(deal.deal))}</b><span>${K.esc(L(deal.name))}, ${K.tk(deal.deal.price)}</span></span></a>` : ''}
    </div>`;
  }

  function renderChrome() {
    document.documentElement.lang = K.S.lang;
    $('.hdr').innerHTML = `<div class="wrap">${logo()}
      <nav class="nav" aria-label="Main">
        <div class="nav-mm"><a href="#/restaurants" data-tab="restaurants">${t('nav_restaurants')}${ico('caret-down', 'sm')}</a><div class="mega">${mega()}</div></div>
        <a href="#/dishes" data-tab="dishes">${t('nav_dishes')}</a>
        <a href="#/deals" data-tab="deals">${t('nav_deals')}</a>
        <a href="#/business" data-tab="business">${t('nav_business')}</a>
      </nav>
      <span class="sp"></span>
      <button class="hdr-search" data-act="search" aria-label="${t('search')}">${ico('magnifying-glass')}<span>${t('search_short')}</span><kbd>/</kbd></button>
      <button class="ibtn m-only" data-act="search" aria-label="${t('search')}">${ico('magnifying-glass')}</button>
      <button class="lang-btn" data-act="lang" aria-label="${t('switch_lang')}">${K.S.lang === 'bn' ? 'EN' : '<span>বাং</span>'}</button>
      <button class="ibtn" data-act="theme" aria-label="${t('switch_theme')}">${ico(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
      <span class="d-only">${acct()}</span>
    </div>`;
    $('.tabbar').innerHTML = `
      <a href="#/" data-tab="home">${ico('house')}<span>${t('tab_home')}</span></a>
      <a href="#/restaurants" data-tab="restaurants">${ico('storefront')}<span>${t('tab_places')}</span></a>
      <a href="#/ask" class="ask" data-tab="ask" data-act="ask"><span class="orb">${ico('sparkle-fill')}</span><span>${t('tab_ask')}</span></a>
      <a href="#/dishes" data-tab="dishes">${ico('bowl-food')}<span>${t('tab_dishes')}</span></a>
      <a href="#me" data-tab="me" data-act="me">${K.user() ? `<span class="tab-av">${K.esc(initials(K.user().name))}</span>` : ico('user-circle')}<span>${t('tab_me')}</span></a>`;
    $('.ftr').innerHTML = footer();
    $$('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === curView));
    $$('.nav a[data-tab]').forEach(a => a.classList.toggle('on', a.dataset.tab === curView));
  }
  K.renderChrome = renderChrome;

  function footer() {
    const col = (h, links) => `<div class="ftr-col"><h4>${h}</h4>${links.map(([href, l]) => href.startsWith('act:') ? `<a href="#/" data-act="${href.slice(4)}">${l}</a>` : `<a href="${href}">${l}</a>`).join('')}</div>`;
    const area = c => D.areas.filter(a => a.city === c).map(a => [`#/restaurants?area=${a.id}`, L(a)]);
    return `<div class="wrap ftr-top">
      <div class="ftr-brand">${logo()}<p>${t('footer_line')}</p>
        <div class="seg ftr-seg"><button class="${K.S.lang === 'en' ? 'on' : ''}" data-act="lang-to" data-l="en">English</button><button class="${K.S.lang === 'bn' ? 'on' : ''}" data-act="lang-to" data-l="bn">বাংলা</button></div></div>
      ${col(L(D.cities.dhaka), area('dhaka'))}
      ${col(L(D.cities.bogura), area('bogura').concat([['#/dishes', t('nav_dishes')], ['#/deals', t('nav_deals')]]))}
      ${col(K.BRAND, [['#/restaurants', t('nav_restaurants')], ['#/ask', t('ask_ai')], ['act:me', t('your_account')], ['#/business', t('help')]])}
      ${col(t('nav_business'), [['#/business', t('get_listed')], ['#/business', t('plans')], ['#/t/shahi-handi', t('qr_menu')], ['#/r/shahi-handi/print', t('print_menu')]])}
    </div>
    <div class="wrap ftr-word" aria-hidden="true">${K.BRAND}</div>
    <div class="wrap ftr-base"><span>© 2026 ${K.BRAND}</span><span class="ftr-legal"><a href="#/business">${t('terms')}</a><a href="#/business">${t('privacy')}</a></span></div>`;
  }

  /* ---------- toast ---------- */
  let toastT;
  K.toast = (msg, icon = 'check-circle') => {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = ico(icon) + `<span>${msg}</span>`;
    requestAnimationFrame(() => el.classList.add('in'));
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('in'), 2600);
  };

  /* ---------- sheets ---------- */
  const stack = [];
  K.sheet = {
    count: () => stack.length,
    top: () => stack[stack.length - 1],
    open(o) {
      const scrim = document.createElement('div'); scrim.className = 'scrim';
      const el = document.createElement('section');
      el.className = `sheet ${o.cls || ''}`; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
      if (o.label) el.setAttribute('aria-label', o.label);
      el.innerHTML = (o.grab === false ? '' : '<span class="grab" aria-hidden="true"></span>') + (o.title != null ? `<header class="sheet-h"><h2>${o.title}</h2><button class="ibtn" data-close aria-label="${t('close')}">${ico('x')}</button></header>` : '') + o.html;
      document.body.append(scrim, el);
      const rec = { el, scrim, o, prevFocus: document.activeElement };
      stack.push(rec);
      document.documentElement.style.overflow = 'hidden';
      history.pushState({ sheet: stack.length }, '', location.href);
      requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('in'); el.classList.add('in'); }));
      scrim.addEventListener('click', () => K.sheet.close(rec));
      el.addEventListener('click', e => { if (e.target.closest('[data-close]') && !e.target.closest('a[href^="#/"]')) K.sheet.close(rec); });
      swipeToClose(rec);
      o.onOpen && o.onOpen(el);
      setTimeout(() => { const f = o.focus ? $(o.focus, el) : $('[data-close]', el); f && f.focus({ preventScroll: true }); }, 320);
      return rec;
    },
    close(rec, fromPop) {
      rec = rec || stack[stack.length - 1]; if (!rec) return;
      const i = stack.indexOf(rec); if (i < 0) return;
      stack.splice(i, 1);
      rec.el.classList.remove('in'); rec.scrim.classList.remove('in');
      rec.o.onClose && rec.o.onClose(rec.el);
      setTimeout(() => { rec.el.remove(); rec.scrim.remove(); }, 480);
      if (!stack.length) document.documentElement.style.overflow = '';
      rec.prevFocus && rec.prevFocus.focus && rec.prevFocus.focus({ preventScroll: true });
      if (!fromPop) { skipPop = true; return new Promise(res => { popResolve = res; history.back(); setTimeout(res, 320); }); }
      return Promise.resolve();
    },
    closeAll(silent) { while (stack.length) { const r = stack.pop(); r.o.onClose && r.o.onClose(r.el); r.el.remove(); r.scrim.remove(); } document.documentElement.style.overflow = ''; }
  };
  let skipPop = false, popResolve = null;
  addEventListener('popstate', e => { if (skipPop) { skipPop = false; e.stopImmediatePropagation(); if (popResolve) { popResolve(); popResolve = null; } } }, true);
  /* navigate away from inside sheets without leaving their history entries behind */
  K.leaveTo = async path => {
    const n = stack.length;
    if (n) { K.sheet.closeAll(); skipPop = true; await new Promise(res => { popResolve = res; history.go(-n); setTimeout(res, 350); }); }
    K.go(path);
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && stack.length) K.sheet.close(); });
  function swipeToClose(rec) {
    const el = rec.el; if (matchMedia('(min-width: 900px)').matches && /drawer|modal/.test(el.className)) return;
    const h = $('.sheet-h', el) || $('.grab', el); if (!h) return;
    let y0 = null, dy = 0;
    const handle = $('.sheet-h', el) || el;
    handle.addEventListener('pointerdown', e => { if (e.target.closest('button,a,input')) return; y0 = e.clientY; dy = 0; el.style.transition = 'none'; handle.setPointerCapture(e.pointerId); });
    handle.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 == null) return; y0 = null; el.style.transition = ''; el.style.transform = ''; if (dy > 110) K.sheet.close(rec); };
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  }

  /* ---------- count-up for totals ---------- */
  K.tween = (el, to, fmt = K.tk) => {
    const from = Number(el.dataset.v || 0); el.dataset.v = to;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 420;
    const step = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ---------- bill calculator ---------- */
  const saveBills = () => { store.set('bills', K.S.bills); store.set('lastBill', K.S.lastBill); };
  K.bill = {
    get(rid) { return K.S.bills[rid] || (K.S.bills[rid] = { items: {}, people: 2 }); },
    qty(rid, did) { const b = K.S.bills[rid]; return b ? (b.items[did] || 0) : 0; },
    add(rid, did, delta) {
      const b = this.get(rid); const q = Math.max(0, Math.min(20, (b.items[did] || 0) + delta));
      if (q) b.items[did] = q; else delete b.items[did];
      K.S.lastBill = rid; saveBills(); this.paint(rid, did, delta > 0);
    },
    load(rid, items, people) { K.S.bills[rid] = { items: Object.assign({}, items), people: people || 2 }; K.S.lastBill = rid; saveBills(); this.paint(rid); },
    people(rid, n) { const b = this.get(rid); b.people = Math.max(1, Math.min(40, n)); saveBills(); this.paint(rid); },
    clear(rid) { delete K.S.bills[rid]; saveBills(); this.paint(rid); },
    totals(rid) {
      const r = K.r(rid), b = K.S.bills[rid] || { items: {}, people: 2 };
      const lines = Object.entries(b.items).map(([did, q]) => { const d = K.dish(rid, did); return d ? { d, q, line: d.price * q } : null; }).filter(Boolean);
      const sub = lines.reduce((s, x) => s + x.line, 0), vat = sub * r.vat / 100, svc = sub * r.service / 100, total = sub + vat + svc;
      return { r, lines, count: lines.reduce((s, x) => s + x.q, 0), sub, vat, svc, total, people: b.people, pp: total / b.people };
    },
    /* the tray only lives on the page of the restaurant the bill belongs to */
    current() {
      const ctx = K._ctxR;
      return ctx && K.S.bills[ctx] && Object.keys(K.S.bills[ctx].items).length ? ctx : null;
    },
    saved() { return Object.keys(K.S.bills).filter(id => K.r(id) && Object.keys(K.S.bills[id].items).length); },
    paint(rid, did, bump) {
      $$('[data-add]').forEach(el => { const [r, d] = el.dataset.add.split('|'); if (!rid || (r === rid && (!did || d === did))) el.outerHTML = K.addBtn(r, d, el.classList.contains('lg'), r === rid && d === did); });
      const cur = this.current(), tray = $('.tray');
      const billOpen = K.sheet.count() && K.sheet.top().o.kind === 'bill';
      if (!cur || billOpen) tray.classList.remove('show');
      if (cur) {
        const x = this.totals(cur), r = x.r;
        tray.style.cssText = `--r-accent:${r.theme.accent};--r-on:${r.theme.deep}`;
        const thumbs = x.lines.slice(-3).reverse().map(l => `<span class="tt">${l.d.p ? `<img src="${K.src(l.d.p, 96)}" alt="">` : `<i>${K.esc(L(l.d.name).charAt(0))}</i>`}</span>`).join('');
        tray.innerHTML = `<button class="tray-open" data-act="bill" aria-label="${t('view_bill')}"><span class="tray-thumbs">${thumbs}</span><span class="tray-n num">${K.n(x.count)}</span></button>
          <div class="tx"><b class="num" data-tray-total>${K.tk(x.total)}<small>${t('all_in')}</small></b><span>${t('n_items', { n: K.n(x.count) })} · ${t('each_for', { v: K.tk(x.pp), n: K.n(x.people) })}</span></div>
          <button class="btn tray-go" data-act="bill">${t('view_bill')}${ico('arrow-right', 'sm')}</button>
          <button class="ibtn tray-x" data-act="tray-min" aria-label="${t('hide_bill')}">${ico('x', 'sm')}</button>`;
        tray.classList.toggle('min', !!K.S.trayMin);
        if (!billOpen) tray.classList.add('show');
        if (bump) { tray.classList.remove('bump'); void tray.offsetWidth; tray.classList.add('bump'); }
      }
      const open = $('.sheet [data-billbody]'); if (open) renderBillBody(open, open.dataset.billbody);
    },
    open(rid) {
      rid = rid || this.current() || K._ctxR; if (!rid) return;
      K.sheet.open({ kind: 'bill', cls: 'drawer bill-sheet', title: t('bill_title'), label: t('bill_title'), html: `<div class="sheet-b" data-billbody="${rid}"></div>`, onOpen: el => { el.style.cssText = `--r-accent:${K.r(rid).theme.accent};--r-deep:${K.r(rid).theme.deep}`; renderBillBody($('[data-billbody]', el), rid, true); $('.tray').classList.remove('show'); }, onClose: () => setTimeout(() => this.paint(), 10) });
    }
  };
  /* a dish photo flies into the bill: feedback that it was added, and where it went */
  K.fly = (from, src) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !from) return;
    const tray = $('.tray'); if (!tray.classList.contains('show')) return;
    const to = ($('.tray-thumbs', tray) || tray).getBoundingClientRect();
    const el = document.createElement('div'); el.className = 'fly'; el.innerHTML = src ? `<img src="${src}" alt="">` : '';
    document.body.appendChild(el);
    const x0 = from.left + from.width / 2 - 24, y0 = from.top + from.height / 2 - 24, x1 = to.left + 4, y1 = to.top + to.height / 2 - 24;
    const a = el.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.4)`, opacity: 0 },
      { transform: `translate(${x0 + (x1 - x0) * .35}px,${Math.min(y0, y1) - 90}px) scale(1.05)`, opacity: 1, offset: .4 },
      { transform: `translate(${x1}px,${y1}px) scale(.55)`, opacity: .9 }
    ], { duration: 720, easing: 'cubic-bezier(.45,0,.25,1)' });
    a.onfinish = () => el.remove();
  };
  function renderBillBody(el, rid, first) {
    const x = K.bill.totals(rid), r = x.r;
    if (!x.lines.length) { el.innerHTML = `<div class="empty"><div class="empty-ic">${ico('receipt', 'lg')}</div><h3>${t('bill_empty')}</h3><p class="meta">${t('bill_empty_sub')}</p><a class="btn btn-primary" href="#/r/${rid}?go=menu" data-close>${t('see_menu')}</a></div>`; return; }
    el.classList.toggle('stagger', !!first);
    el.innerHTML = `<div class="bill-r"><span class="mono" style="--r-deep:${r.theme.deep};--r-accent:${r.theme.accent}">${r.mono}</span><div><b>${K.esc(L(r.name))}</b><div class="fresh">${K.checked(r.checked)}</div></div></div>
      <ul class="bill-lines">${x.lines.map((l, i) => `<li style="--i:${i}"><span class="bl-ph">${l.d.p ? K.img(l.d.p, { w: 120 }) : `<i>${K.esc(L(l.d.name).charAt(0))}</i>`}</span><div><b>${K.esc(L(l.d.name))}</b><span class="meta">${K.tk(l.d.price)} × ${K.n(l.q)}</span></div><span class="price num">${K.tk(l.line)}</span>${K.addBtn(rid, l.d.id)}</li>`).join('')}</ul>
      <div class="bill-ppl"><div><b>${t('people')}</b><span class="meta">${t('split_even')}</span></div><div class="stepper"><button data-ppl="-1" aria-label="${t('fewer')}">${ico('minus')}</button><span class="v num">${K.n(x.people)}</span><button data-ppl="1" aria-label="${t('more')}">${ico('plus')}</button></div></div>
      <dl class="bill-sum"><div><dt>${t('subtotal')}</dt><dd class="num">${K.tk(x.sub)}</dd></div><div><dt>${t('vat')} ${K.n(r.vat)}%</dt><dd class="num">${K.tk(x.vat)}</dd></div><div><dt>${t('service')} ${K.n(r.service)}%</dt><dd class="num">${K.tk(x.svc)}</dd></div><div class="tot"><dt>${t('total_all_in')}</dt><dd class="num" data-tw-total>${K.tk(x.total)}</dd></div></dl>
      <div class="bill-pp"><span>${t('each_person')}</span><b class="num" data-tw-pp>${K.tk(x.pp)}</b></div>
      <p class="meta bill-note">${t('bill_note')}</p>
      <div class="bill-acts"><a class="btn btn-gold btn-lg btn-block" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(billText(x))}">${ico('whatsapp-logo')}${t('share_whatsapp')}</a><button class="btn btn-line btn-block" data-act="bill-clear" data-r="${rid}">${t('clear_bill')}</button></div>`;
    el.querySelectorAll('[data-ppl]').forEach(b => b.onclick = () => K.bill.people(rid, x.people + Number(b.dataset.ppl)));
  }
  function billText(x) {
    const L2 = x.lines.map(l => `${L(l.d.name)} × ${l.q} = ${K.tk(l.line)}`).join('\n');
    return `${L(x.r.name)} (${K.BRAND})\n${L2}\n${t('total_all_in')}: ${K.tk(x.total)}\n${t('each_person')} (${x.people}): ${K.tk(x.pp)}`;
  }
  K.addBtn = (rid, did, lg, pop) => {
    const q = K.bill.qty(rid, did), d = K.dish(rid, did);
    const nm = d ? K.esc(L(d.name)) : '';
    if (!q) return `<span class="add plus ${lg ? 'lg' : ''} ${pop ? 'pop' : ''}" data-add="${rid}|${did}" role="button" tabindex="0" data-inc aria-label="${t('add_to_bill')}: ${nm}">${ico('plus')}</span>`;
    return `<span class="add has ${lg ? 'lg' : ''} ${pop ? 'pop' : ''}" data-add="${rid}|${did}"><button data-dec aria-label="${t('remove_one')}: ${nm}">${ico(q === 1 ? 'x' : 'minus', 'sm')}</button><span class="v num">${K.n(q)}</span><button data-inc aria-label="${t('add_one')}: ${nm}">${ico('plus', 'sm')}</button></span>`;
  };

  /* ---------- rails: arrows on desktop ---------- */
  K.rail = (id, items, o = {}) => `<div class="rail" id="${id}">${o.head ? `<div class="sec-head">${o.head}<div class="rail-nav"><button class="ibtn" data-rail="-1" aria-label="${t('prev')}">${ico('caret-left')}</button><button class="ibtn" data-rail="1" aria-label="${t('next')}">${ico('caret-right')}</button></div></div>` : ''}<div class="rail-track" ${o.style ? `style="${o.style}"` : ''}>${items}</div></div>`;

  /* ---------- global clicks ---------- */
  /* Restaurants menu: shut it after a click, open again only on the next hover */
  document.addEventListener('click', e => { const m = e.target.closest('.nav-mm'); if (m && e.target.closest('a')) { m.classList.add('shut'); document.activeElement && document.activeElement.blur(); } });
  document.addEventListener('pointerout', e => { const m = e.target.closest && e.target.closest('.nav-mm'); if (m && !m.contains(e.relatedTarget)) m.classList.remove('shut'); });
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const vt = e.target.closest('[data-vt]');
    if (vt) { const ph = vt.querySelector('.rc-media') || vt.querySelector('.ph'); if (ph && document.startViewTransition) { ph.style.viewTransitionName = 'hero-morph'; K._morph = ph; } }
    const a = e.target.closest('[data-act],[data-inc],[data-dec],[data-rail],[data-dish],[data-go]');
    if (!a) {
      const ln = e.target.closest('a[href^="#/"]');
      if (ln && !ln.target) { e.preventDefault(); K.leaveTo(ln.getAttribute('href').slice(1)); }
      return;
    }
    if (a.matches('[data-inc],[data-dec]')) {
      e.preventDefault(); e.stopPropagation();
      const host = a.closest('[data-add]'); const [rid, did] = host.dataset.add.split('|');
      const inc = a.matches('[data-inc]'), inBill = K.sheet.count() && K.sheet.top().o.kind === 'bill', from = host.getBoundingClientRect();
      if (inc && !inBill && K.S.trayMin) K.S.trayMin = false;
      K.bill.add(rid, did, inc ? 1 : -1);
      if (inc && !inBill) { const d = K.dish(rid, did); K.fly(from, d && d.p ? K.src(d.p, 96) : ''); if (K.bill.qty(rid, did) === 1) navigator.vibrate && navigator.vibrate(8); }
      return;
    }
    if (a.dataset.rail) { const tr = a.closest('.rail').querySelector('.rail-track'); tr.scrollBy({ left: Number(a.dataset.rail) * tr.clientWidth * .85, behavior: 'smooth' }); return; }
    if (a.dataset.dish) { e.preventDefault(); const [rid, did] = a.dataset.dish.split('|'); K.openDish && K.openDish(rid, did); return; }
    if (a.dataset.go) { e.preventDefault(); K.leaveTo(a.dataset.go); return; }
    const act = a.dataset.act;
    if (!act) return;
    e.preventDefault(); e.stopPropagation();
    if (act === 'search') K.search.open();
    else if (act === 'ask') K.ai && K.ai.open(a.dataset.q || '');
    else if (act === 'lang') K.setLang(K.S.lang === 'bn' ? 'en' : 'bn');
    else if (act === 'theme') { const now = document.documentElement.dataset.theme; K.setTheme(now === 'dark' ? 'light' : 'dark'); renderChrome(); }
    else if (act === 'bill') K.bill.open(a.dataset.r);
    else if (act === 'bill-clear') { K.bill.clear(a.dataset.r); K.sheet.close(); }
    else if (act === 'tray-min') { K.S.trayMin = true; $('.tray').classList.add('min'); }
    else if (act === 'lang-to') { if (a.dataset.l !== K.S.lang) K.setLang(a.dataset.l); }
    else if (act === 'me') openMe();
    else if (act === 'signin') K.auth.open();
    else if (act === 'area') openArea(a.dataset.then, a);
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.add.plus')) { e.preventDefault(); e.target.click(); } if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); K.search.open(); } if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName) && !K.sheet.count()) { e.preventDefault(); K.search.open(); } });

  /* ---------- me sheet ---------- */
  function openMe() {
    const th = K.S.theme, u = K.user(), saved = K.bill.saved(), mine = store.get('myReviews', []);
    const head = u
      ? `<div class="me-card"><div class="me-av on">${K.esc(initials(u.name))}</div><div><b>${K.esc(u.name)}</b><p class="meta">${K.esc(u.phone)}</p></div><button class="btn btn-ghost btn-sm" data-me="out">${t('sign_out')}</button></div>`
      : `<div class="me-card"><div class="me-av">${ico('user-circle', 'lg')}</div><div><b>${t('me_guest')}</b><p class="meta">${t('me_guest_sub')}</p></div></div>
         <button class="btn btn-primary btn-block btn-lg" data-me="login">${ico('phone')}${t('login_phone')}</button>`;
    const bills = saved.length ? `<h3 class="me-h">${t('saved_bills')}</h3><div class="me-bills">${saved.map(id => { const x = K.bill.totals(id); return `<a class="me-bill" href="#/r/${id}?open=bill" data-close><span class="mono" style="--r-deep:${x.r.theme.deep};--r-accent:${x.r.theme.accent}">${x.r.mono}</span><span><b>${K.esc(L(x.r.name))}</b><span class="meta">${t('n_items', { n: K.n(x.count) })} · ${t('each_for', { v: K.tk(x.pp), n: K.n(x.people) })}</span></span><b class="num">${K.tk(x.total)}</b></a>`; }).join('')}</div>` : '';
    const revs = u && mine.length ? `<h3 class="me-h">${t('your_reviews')}</h3><div class="me-bills">${mine.map(v => `<a class="me-bill" href="#/r/${v.r}?go=reviews" data-close><span class="mono" style="--r-deep:${K.r(v.r).theme.deep};--r-accent:${K.r(v.r).theme.accent}">${K.r(v.r).mono}</span><span><b>${K.esc(L(K.r(v.r).name))}</b><span class="meta">${'★'.repeat(v.st)} · ${t('rv_pending')}</span></span></a>`).join('')}</div>` : '';
    K.sheet.open({
      cls: 'drawer', title: t('your_account'), html: `<div class="sheet-b me">
      ${head}${bills}${revs}
      <h3 class="me-h">${t('language')}</h3>
      <div class="seg" role="radiogroup"><button class="${K.S.lang === 'bn' ? 'on' : ''}" data-me-lang="bn">বাংলা</button><button class="${K.S.lang === 'en' ? 'on' : ''}" data-me-lang="en">English</button></div>
      <h3 class="me-h">${t('appearance')}</h3>
      <div class="seg" role="radiogroup"><button class="${th === 'auto' ? 'on' : ''}" data-me-theme="auto">${t('auto')}</button><button class="${th === 'light' ? 'on' : ''}" data-me-theme="light">${ico('sun', 'sm')}${t('light')}</button><button class="${th === 'dark' ? 'on' : ''}" data-me-theme="dark">${ico('moon', 'sm')}${t('dark')}</button></div>
      <div class="me-links"><a href="#/deals" data-close>${ico('tag')}${t('nav_deals')}${ico('caret-right', 'sm')}</a><a href="#/business" data-close>${ico('storefront')}${t('nav_business')}${ico('caret-right', 'sm')}</a><a href="#/business" data-close>${ico('info')}${t('help')}${ico('caret-right', 'sm')}</a></div>
    </div>`, onOpen: el => {
        $$('[data-me-lang]', el).forEach(b => b.onclick = () => { K.sheet.close().then(() => K.setLang(b.dataset.meLang)); });
        $$('[data-me-theme]', el).forEach(b => b.onclick = () => { K.setTheme(b.dataset.meTheme); renderChrome(); $$('[data-me-theme]', el).forEach(x => x.classList.toggle('on', x === b)); });
        const li = $('[data-me=login]', el); if (li) li.onclick = () => K.sheet.close().then(() => K.auth.open());
        const lo = $('[data-me=out]', el); if (lo) lo.onclick = () => { store.set('user', null); renderChrome(); K.sheet.close(); K.toast(t('signed_out'), 'user-circle'); };
      }
    });
  }

  /* ---------- sign in (demo: phone + one-time code, stays on this device) ---------- */
  K.auth = {
    open(then, why) {
      let phone = '';
      const step1 = () => `<div class="au"><div class="au-mark">${K.logo ? logo() : ''}</div><h3 class="au-h">${why || t('signin_h')}</h3><p class="meta">${t('signin_sub')}</p>
        <form class="au-f" data-s1><div class="field"><label for="au-ph">${t('phone_no')}</label><div class="au-ph"><span>+880</span><input id="au-ph" class="input" inputmode="numeric" autocomplete="tel-national" placeholder="1712 345678" maxlength="12" required></div><span class="err" hidden>${t('phone_err')}</span></div>
        <button class="btn btn-primary btn-lg btn-block" type="submit">${t('send_code')}</button></form>
        <div class="au-or"><span>${t('or')}</span></div>
        <button class="btn btn-line btn-lg btn-block" data-google>${ico('globe-hemisphere-east')}${t('google_in')}</button>
        <p class="meta au-fine">${t('signin_fine')}</p></div>`;
      const step2 = () => `<div class="au"><button class="link au-back" data-s-back>${ico('arrow-left', 'sm')}${t('change_no')}</button><h3 class="au-h">${t('enter_code')}</h3><p class="meta">${t('code_sent', { p: '+880 ' + K.esc(phone) })}</p>
        <form class="au-f" data-s2><div class="otp">${[0, 1, 2, 3, 4, 5].map(i => `<input class="input" inputmode="numeric" maxlength="1" aria-label="${t('digit_n', { n: i + 1 })}">`).join('')}</div>
        <p class="meta au-demo">${ico('info', 'sm')}${t('code_demo')}</p>
        <div class="field"><label for="au-nm">${t('your_name')}</label><input id="au-nm" class="input" autocomplete="name" required></div>
        <button class="btn btn-primary btn-lg btn-block" type="submit">${t('continue')}</button></form></div>`;
      K.sheet.open({
        cls: 'modal narrow au-sheet', title: '', label: t('sign_in'), focus: 'input', html: `<div class="sheet-b" data-au>${step1()}</div>`,
        onOpen: el => {
          const box = $('[data-au]', el);
          const bind = () => {
            const s1 = $('[data-s1]', box), s2 = $('[data-s2]', box);
            if (s1) s1.onsubmit = e => { e.preventDefault(); const v = $('input', s1).value.replace(/\D/g, '').replace(/^880/, '').replace(/^0/, ''); const ok = /^1[3-9]\d{8}$/.test(v); $('.err', s1).hidden = ok; $('input', s1).setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok) return; phone = v.replace(/^(\d{4})(\d{6})$/, '$1 $2'); box.innerHTML = step2(); bind(); $('.otp input', box).focus(); };
            const g = $('[data-google]', box); if (g) g.onclick = () => K.toast(t('google_soon'), 'info');
            if (s2) {
              const ins = $$('.otp input', s2);
              ins.forEach((inp, i) => { inp.oninput = () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); }; inp.onkeydown = e => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); }; });
              ins[0].addEventListener('paste', e => { const v = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (v.length === 6) { e.preventDefault(); ins.forEach((x, j) => x.value = v[j]); $('#au-nm', s2).focus(); } });
              $('[data-s-back]', box).onclick = () => { box.innerHTML = step1(); bind(); };
              s2.onsubmit = e => { e.preventDefault(); const code = ins.map(x => x.value).join(''), nm = $('#au-nm', s2).value.trim(); if (code.length < 6) { ins.find(x => !x.value).focus(); return; } if (!nm) { $('#au-nm', s2).focus(); return; } store.set('user', { name: nm, phone: '+880 ' + phone }); renderChrome(); K.sheet.close().then(() => { K.toast(t('signed_in_as', { n: K.esc(nm) }), 'check-circle'); then && then(); }); };
            }
          };
          bind();
        }
      });
    },
    need(then, why) { if (K.user()) then(); else K.auth.open(then, why); }
  };

  /* ---------- popover: anchored on wide screens, a sheet on phones ---------- */
  K.isDesk = () => matchMedia('(min-width: 900px)').matches;
  K.pop = (anchor, html, o = {}) => {
    K.pop.close();
    const p = document.createElement('div'); p.className = `popover ${o.cls || ''}`; p.setAttribute('role', 'dialog'); if (o.label) p.setAttribute('aria-label', o.label);
    p.innerHTML = html; document.body.appendChild(p);
    const r = anchor.getBoundingClientRect(), w = p.offsetWidth;
    p.style.left = Math.round(Math.min(Math.max(12, o.align === 'end' ? r.right - w : r.left), innerWidth - w - 12)) + 'px';
    p.style.top = Math.round(Math.min(r.bottom + 10, innerHeight - p.offsetHeight - 12)) + 'px';
    requestAnimationFrame(() => p.classList.add('in'));
    const off = e => { if (!p.contains(e.target) && !anchor.contains(e.target)) K.pop.close(); };
    const esc = e => { if (e.key === 'Escape') { K.pop.close(); anchor.focus(); } };
    const away = () => K.pop.close();
    setTimeout(() => document.addEventListener('pointerdown', off, true));
    document.addEventListener('keydown', esc); addEventListener('scroll', away, { passive: true, once: true });
    anchor.setAttribute('aria-expanded', 'true');
    K.pop._c = { p, off, esc, away, anchor };
    o.onOpen && o.onOpen(p);
    const f = $('input, button', p); f && setTimeout(() => f.focus({ preventScroll: true }), 30);
    return p;
  };
  K.pop.close = () => {
    const c = K.pop._c; if (!c) return; K.pop._c = null;
    c.p.classList.remove('in'); setTimeout(() => c.p.remove(), 220);
    document.removeEventListener('pointerdown', c.off, true); document.removeEventListener('keydown', c.esc); removeEventListener('scroll', c.away);
    c.anchor.setAttribute('aria-expanded', 'false');
  };
  /* one call for both: popover on desktop when there is an anchor, sheet otherwise */
  K.choose = (anchor, title, html, onOpen, cls = '') => {
    if (anchor && K.isDesk()) return K.pop(anchor, `<div class="pop-h">${title}</div>${html}`, { cls, label: title, onOpen: p => onOpen(p, () => K.pop.close()) });
    K.sheet.open({ cls: 'drawer ' + cls, title, html: `<div class="sheet-b">${html}</div>`, onOpen: el => onOpen(el, () => K.sheet.close()) });
  };

  /* ---------- area picker ---------- */
  /* rough centres, used for "near me" */
  const LL = { dhanmondi: [23.7461, 90.3742], gulshan: [23.7925, 90.4078], banani: [23.7937, 90.4066], mirpur: [23.8223, 90.3654], mohammadpur: [23.7662, 90.3589], uttara: [23.8759, 90.3795], 'old-dhaka': [23.7104, 90.4074], jaleshwaritola: [24.8465, 89.3776], satmatha: [24.8481, 89.3730] };
  K.LL = LL;
  function openArea(then, anchor) {
    const count = id => D.restaurants.filter(r => r.area === id).length;
    const pic = id => { const r = D.restaurants.find(x => x.area === id); return r ? K.img(r.hero[0], { w: 96 }) : ''; };
    const city = c => `<div class="ap-col"><h4>${L(D.cities[c])}</h4>${D.areas.filter(a => a.city === c).map(a => `<button class="ap-row ${K.S.area === a.id ? 'on' : ''}" data-area="${a.id}"><span class="ap-ph">${pic(a.id)}</span><span class="ap-t"><b>${L(a)}</b><span>${t('n_places', { n: K.n(count(a.id)) })}</span></span>${K.S.area === a.id ? ico('check', 'sm') : ''}</button>`).join('')}</div>`;
    const html = `<button class="ap-near" data-near>${ico('navigation-arrow')}<span><b>${t('near_me')}</b><span>${t('near_me_sub')}</span></span></button><div class="ap-cols">${city('dhaka')}${city('bogura')}</div>`;
    K.choose(anchor, t('choose_area'), html, (el, done) => {
      const set = id => { K.S.area = id; store.set('area', id); K.toast(t('area_set', { a: L(K.areaOf(id)) }), 'map-pin'); if (then) { K.pop.close(); K.leaveTo(then.replace('{a}', id)); } else { const p = done(); (p && p.then ? p : Promise.resolve()).then(() => K.route(true)); } };
      $$('[data-area]', el).forEach(b => b.onclick = () => set(b.dataset.area));
      $('[data-near]', el).onclick = () => {
        if (!navigator.geolocation) return K.toast(t('near_fail'), 'map-pin');
        K.toast(t('near_finding'), 'navigation-arrow');
        navigator.geolocation.getCurrentPosition(pos => { const { latitude: la, longitude: lo } = pos.coords; let best = null, bd = 1e9; Object.entries(LL).forEach(([id, [a, b]]) => { const d = (a - la) ** 2 + (b - lo) ** 2; if (d < bd) { bd = d; best = id; } }); bd > 0.5 ? K.toast(t('near_far'), 'map-pin') : set(best); }, () => K.toast(t('near_fail'), 'map-pin'), { timeout: 8000, maximumAge: 600000 });
      };
    }, 'ap');
  }
  K.openArea = openArea;

  /* ---------- QR codes (library loads on first use) ---------- */
  K.qr = (box, url, cell = 4) => {
    const draw = () => { try { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); box.innerHTML = q.createSvgTag({ cellSize: cell, margin: 0, scalable: true }); } catch (e) { box.innerHTML = ico('qr-code', 'lg'); } };
    if (window.qrcode) return draw();
    if (!K.qr._q) { K.qr._q = []; const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload = () => K.qr._q.splice(0).forEach(f => f()); s.onerror = () => K.qr._q.splice(0).forEach(f => f()); document.head.appendChild(s); }
    K.qr._q.push(draw);
  };
  K.siteUrl = path => location.href.split('#')[0].replace(/[?&](embed|lang|theme|hero|hl)=[^&#]*/g, '').replace(/\?$/, '') + '#' + path;

  /* ---------- search palette ---------- */
  const norm = s => String(s || '').toLowerCase().normalize('NFKC').replace(/[০-৯]/g, d => BD.indexOf(d)).trim();
  K.norm = norm;
  K.search = {
    open(q0 = '') {
      const rec = K.sheet.open({
        cls: 'full search-sheet', grab: false, label: t('search'), focus: 'input', html: `<div class="srch-top"><label class="srch-box">${ico('magnifying-glass', 'lg')}<input type="search" enterkeyhint="search" autocomplete="off" placeholder="${t('search_ph')}" value="${K.esc(q0)}" aria-label="${t('search')}"></label><button class="ai-pill" data-srch-ask>${ico('sparkle-fill', 'sm')}${t('ask_ai')}</button><button class="btn btn-ghost btn-sm srch-x" data-close>${t('cancel')}</button></div><div class="srch-res" aria-live="polite"></div><div class="srch-foot d-only"><span><kbd>↵</kbd>${t('kb_search')}</span><span><kbd>esc</kbd>${t('close')}</span></div>`,
        onOpen: el => {
          const inp = $('input', el), res = $('.srch-res', el);
          const paint = () => res.innerHTML = results(inp.value);
          inp.addEventListener('input', paint);
          inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(inp.value); } });
          $('[data-srch-ask]', el).onclick = e => { e.preventDefault(); const v = inp.value; K.sheet.close().then(() => K.ai.open(v)); };
          res.addEventListener('click', e => {
            const b = e.target.closest('[data-s]'); if (!b) return;
            e.preventDefault(); const v = b.dataset.s;
            if (v.startsWith('ask:')) { K.sheet.close().then(() => K.ai.open(v.slice(4))); return; }
            remember(inp.value || b.textContent.trim()); K.leaveTo(v);
          });
          paint();
        }
      });
      return rec;
    }
  };
  function remember(q) { q = String(q).trim(); if (!q) return; K.S.recent = [q, ...K.S.recent.filter(x => x !== q)].slice(0, 6); store.set('recent', K.S.recent); }
  function submit(q) {
    remember(q);
    const p = K.nlp ? K.nlp.parse(q) : {};
    const sp = new URLSearchParams();
    if (p.type) { sp.set('view', 'd'); sp.set('type', p.type); }
    if (p.area) sp.set('area', p.area);
    if (p.city && !p.area) sp.set('city', p.city);
    if (p.maxDish) sp.set('max', p.maxDish);
    if (p.fac && p.fac.length) sp.set('fac', p.fac.join(','));
    if (p.open) sp.set('open', '1');
    if (p.r) { K.leaveTo('/r/' + p.r); return; }
    if (!p.type && !p.area && !p.fac?.length && q.trim()) sp.set('q', q.trim());
    if ((p.budget || p.people) && K.ai) { K.sheet.close().then(() => K.ai.open(q)); return; }
    K.leaveTo('/explore?' + sp.toString());
  }
  function results(q) {
    const n = norm(q);
    const row = (go, icon, title, sub, img) => `<button class="srow" data-s="${K.esc(go)}">${img ? `<span class="srow-img">${img}</span>` : `<span class="srow-ic">${ico(icon)}</span>`}<span class="srow-t"><b>${title}</b>${sub ? `<span class="meta">${sub}</span>` : ''}</span>${ico('arrow-up-right', 'sm srow-go')}</button>`;
    if (!n) {
      const rec = K.S.recent.length ? `<h3 class="srch-h">${t('recent')}</h3>${K.S.recent.slice(0, 4).map(r => row('/restaurants?q=' + encodeURIComponent(r), 'clock', K.esc(r))).join('')}` : '';
      const tries = [t('try_1'), t('try_3'), t('try_4')];
      const tiles = ['kacchi', 'biryani', 'kebab', 'fuchka', 'fish', 'bakery'].map(c => { const x = D.types[c]; return `<button class="srch-tile" data-s="/dishes?type=${c}">${K.ph(x.p, { w: 220, tone: { deep: '#141B5E', accent: '#F5A300' }, icon: x.i })}<span>${L(x)}</span></button>`; }).join('');
      return `<div class="srch-empty"><div class="srch-l">${rec}<h3 class="srch-h">${t('try_asking')}</h3>${tries.map(x => row('ask:' + x, 'sparkle', K.esc(x), t('ask_ai_sub'))).join('')}</div>
        <div class="srch-rt"><h3 class="srch-h">${t('popular')}</h3><div class="srch-tiles">${tiles}</div>
        <h3 class="srch-h">${t('areas')}</h3><div class="srch-areas">${D.areas.map(a => `<button data-s="/restaurants?area=${a.id}">${L(a)}</button>`).join('')}</div></div></div>`;
    }
    const p = K.nlp ? K.nlp.parse(q) : {};
    let out = '';
    const words = n.split(/\s+/).length;
    if (words >= 3 || p.budget || p.people) out += row('ask:' + q, 'sparkle', `${t('ask_ai')}: “${K.esc(q)}”`, t('ask_ai_sub'));
    const m = s => norm(s).includes(n) || (n.length > 2 && norm(s).split(/\s+/).some(w => w.startsWith(n)));
    const typeHits = Object.entries(D.types).filter(([id, x]) => m(x.en) || m(x.bn) || (p.type === id));
    typeHits.slice(0, 4).forEach(([id, x]) => {
      const ds = K.allDishes.filter(d => d.type === id); if (!ds.length) return;
      const pr = ds.map(d => d.price); const nr = new Set(ds.map(d => d.r)).size;
      out += row(`/dishes?type=${id}`, x.i || 'bowl-food', L(x), t('type_range', { n: K.n(nr), lo: K.tk(Math.min(...pr)), hi: K.tk(Math.max(...pr)) }), x.p ? K.img(x.p, { w: 96 }) : '');
    });
    K.allDishes.filter(d => m(d.name.en) || m(d.name.bn)).slice(0, 5).forEach(d => { const r = K.r(d.r); out += row(`/r/${r.id}?dish=${d.id}`, 'bowl-food', K.esc(L(d.name)), `${K.esc(L(r.name))} · ${K.tk(d.price)}`, d.p ? K.img(d.p, { w: 96 }) : ''); });
    D.restaurants.filter(r => m(r.name.en) || m(r.name.bn) || r.cuisines.some(c => m(L(D.cuisines.find(x => x.id === c))))).slice(0, 5).forEach(r => out += row(`/r/${r.id}`, 'storefront', K.esc(L(r.name)), `${K.where(r)} · ${K.ppRange(r)} ${t('per_person_short')}`, K.img(r.hero[0], { w: 96 })));
    D.areas.filter(a => m(a.en) || m(a.bn)).forEach(a => out += row(`/restaurants?area=${a.id}`, 'map-pin', L(a), L(D.cities[a.city])));
    D.cuisines.filter(c => m(c.en) || m(c.bn)).forEach(c => out += row(`/dishes?cu=${c.id}`, 'fork-knife', L(c), t('cuisine')));
    if (!out) out = `<div class="empty"><div class="empty-ic">${ico('magnifying-glass', 'lg')}</div><h3>${t('no_match', { q: K.esc(q) })}</h3><p class="meta">${t('no_match_sub')}</p><button class="btn btn-primary" data-s="ask:${K.esc(q)}">${ico('sparkle')}${t('ask_ai')}</button></div>`;
    return out;
  }

  /* ---------- boot ---------- */
  K.boot = () => {
    /* a refresh or a fresh visit always opens at the top; the browser must not bring back the old scroll spot
       (Back and Forward inside the site still return you to where you were) */
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    K.applyTheme();
    document.documentElement.lang = K.S.lang;
    if (K.embed) document.documentElement.classList.add('embed');
    renderChrome();
    K.route(true);
  };
  document.addEventListener('DOMContentLoaded', () => K.boot());
})();
