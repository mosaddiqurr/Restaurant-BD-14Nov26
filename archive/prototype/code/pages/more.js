/* Deals, For restaurants, printable menu */
(function () {
  const K = window.K, D = K.data, t = K.t, L = K.L, ico = K.ico, $ = K.$, $$ = K.$$;

  /* ---------------- deals ---------------- */
  let dealCity = 'all';
  const dealCard = ({ r, d }, i) => K.dealTicket(r, d, { href: `#/r/${r.id}`, sm: true, place: true, w: 720, d: i % 3 });
  K.views.deals = {
    chrome: { tab: 'deals' },
    title: () => t('nav_deals'),
    render: () => {
      const all = D.restaurants.flatMap(r => K.dealsOf(r).map(d => ({ r, d })));
      const wk = all.find(x => x.d.week) || all[0];
      if (!wk) return `<div class="pg-head wrap"><h1 class="h1 sm">${t('deals_title')}</h1><p class="lede">${t('deals_sub')}</p></div>`;
      const list = all.filter(x => x !== wk && (dealCity === 'all' || x.r.city === dealCity));
      return `<div class="pg-head wrap"><h1 class="h1 sm" data-rv>${t('deals_title')}</h1><p class="lede" data-rv>${t('deals_sub')}</p></div>
      <section class="wrap">${K.dealTicket(wk.r, wk.d, { href: `#/r/${wk.r.id}`, cta: t('see_deal'), place: true, h: 'h2', note: t('featured'), w: 1200, eager: true })}</section>
      <section class="sec"><div class="wrap"><div class="sec-head"><h2 class="h3">${t('all_deals')}</h2><div class="seg"><button class="${dealCity === 'all' ? 'on' : ''}" data-dc="all">${t('all')}</button><button class="${dealCity === 'dhaka' ? 'on' : ''}" data-dc="dhaka">${L(D.cities.dhaka)}</button><button class="${dealCity === 'bogura' ? 'on' : ''}" data-dc="bogura">${L(D.cities.bogura)}</button></div></div>
        <div class="deal-grid">${list.map(dealCard).join('') || `<div class="empty sm"><p>${t('no_deals')}</p></div>`}</div>
        <p class="meta deal-note">${ico('info', 'sm')} ${t('deal_note')}</p></div></section>`;
    },
    mount(el) { K._ctxR = null; el.addEventListener('click', e => { const b = e.target.closest('[data-dc]'); if (b) { dealCity = b.dataset.dc; K.route(true); } }); }
  };

  /* ---------------- for restaurants ---------------- */
  let bizCity = 'dhaka';
  const PLANS = [
    { id: 'starter', name: e2('Starter', 'স্টার্টার'), dhaka: 1999, sub: e2('A professional page with a menu that is always right.', 'সবসময় সঠিক মেনুসহ পেশাদার পেজ।'), f: ['f_page', 'f_menu', 'f_photos', 'f_qr', 'f_print', 'f_reviews', 'f_report'] },
    { id: 'pro', name: e2('Pro', 'প্রো'), dhaka: 4999, pop: true, sub: e2('Stand out with a 360° tour, a film and price insights.', '৩৬০° ট্যুর, ফিল্ম আর দামের তুলনা দিয়ে আলাদা হোন।'), f: ['f_all_starter', 'f_film', 'f_kitchen', 'f_tour', 'f_video_menu', 'f_insights', 'f_deals'] },
    { id: 'premium', name: e2('Premium', 'প্রিমিয়াম'), dhaka: 9999, sub: e2('Maximum reach: featured placement and Deal of the Week.', 'সর্বোচ্চ প্রচার: ফিচারড জায়গা আর সপ্তাহের ডিল।'), f: ['f_all_pro', 'f_long_film', 'f_3d', 'f_featured', 'f_dotw', 'f_social', 'f_priority'] }
  ];
  function e2(en, bn) { return { en, bn }; }
  const price = p => bizCity === 'dhaka' ? p.dhaka : p.dhaka - 500;
  const FAQ = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5'];
  /* branded QR showcase: a few partner restaurants, each in a different look */
  function qrShow() {
    const picks = [['shahi-handi', 'rounded'], ['kathgolap', 'leaf'], ['cha-adda', 'dots'], ['nawabpur-kacchi', 'diamond']].filter(([id]) => K.r(id));
    return `<section class="sec biz-qr"><div class="wrap">
      <div class="sec-head"><div><h2 class="h2" data-rv>${t('qrb_title')}</h2><p class="sub" data-rv>${t('qrb_sub')}</p></div></div>
      <div class="qrb">${picks.map(([id, lk], i) => { const r = K.r(id); return `<a class="qrb-c" href="#/t/${id}" data-rv style="--d:${i};--r-deep:${r.theme.deep};--r-accent:${r.theme.accent}" data-font="${r.theme.font}"><span class="qrb-n rp-display">${K.esc(L(r.name))}</span><span class="qrb-q" data-qrb="${id}|${lk}"></span><span class="qrb-l">${L(K.QR_LOOKS[lk])}</span></a>`; }).join('')}</div>
      <ul class="qrb-pts" data-rv><li>${ico('storefront')}<span>${t('qrb_p1')}</span></li><li>${ico('squares-four')}<span>${t('qrb_p2')}</span></li><li>${ico('check-circle')}<span>${t('qrb_p3')}</span></li></ul>
    </div></section>`;
  }
  K.views.business = {
    chrome: { tab: 'business' },
    title: () => t('nav_business'),
    render: () => {
      const sh = K.r('shahi-handi');
      return `<section class="biz-hero"><div class="wrap biz-hero-in">
        <div class="biz-copy"><h1 class="h1" data-rv>${t('biz_h1')}</h1><p class="lede" data-rv>${t('biz_sub')}</p>
          <div class="biz-btns" data-rv><a class="btn btn-primary btn-lg" href="#biz-form" data-jump="biz-form">${ico('calendar-blank')}${t('book_visit')}</a><a class="btn btn-line btn-lg" href="#/r/shahi-handi">${t('see_live')}${ico('arrow-up-right', 'sm')}</a><a class="btn btn-line btn-lg" href="panel/index.html">${ico('user-circle')}${t('partner_sign_in')}</a></div>
          <p class="meta biz-note" data-rv>${t('biz_note')}</p></div>
        <div class="biz-phone" data-rv="scale"><div class="phone"><div class="phone-notch"></div><iframe title="${t('see_live')}" loading="lazy" data-src="index.html?embed=1#/r/shahi-handi"></iframe></div></div>
      </div></section>

      <section class="sec biz-vs"><div class="wrap">
        <h2 class="h2" data-rv>${t('vs_title')}</h2>
        <div class="vs">
          <div class="vs-c old" data-rv><h3>${t('vs_old')}</h3><ul>${['vs_o1', 'vs_o2', 'vs_o3', 'vs_o4'].map(k => `<li>${ico('x-circle')}${t(k)}</li>`).join('')}</ul></div>
          <div class="vs-c new" data-rv style="--d:1"><h3>${t('vs_new', { b: K.BRAND })}</h3><ul>${['vs_n1', 'vs_n2', 'vs_n3', 'vs_n4'].map(k => `<li>${ico('check-circle')}${t(k)}</li>`).join('')}</ul></div>
        </div>
      </div></section>

      <section class="sec biz-get"><div class="wrap">
        <h2 class="h2" data-rv>${t('get_title')}</h2><p class="sub" data-rv>${t('get_sub')}</p>
        <div class="bz">
          <article class="bz-c bz-photo bz-tour" data-rv style="--d:0"><img src="${K.src('pv:warm_reception_dinner:a')}" alt="" loading="lazy">
            <div class="bz-cap"><h3>${t('g_tour')}</h3><p>${t('g_tour_sub')}</p><button class="btn btn-white btn-sm" data-tour="shahi-handi|banquet">${ico('virtual-reality')}${t('try_it')}</button></div></article>
          <article class="bz-c bz-photo bz-film" data-rv style="--d:1"><video muted loop playsinline preload="none" poster="${K.src('kc1', 900)}" data-src="${sh.kitchen.src}"></video>
            <div class="bz-cap"><h3>${t('g_film')}</h3><p>${t('g_film_sub')}</p></div></article>
          <article class="bz-c bz-menu" data-rv style="--d:2">
            <div class="bz-txt"><h3>${t('g_menu')}</h3><p>${t('g_menu_sub')}</p></div>
            <div class="bz-show" style="--r-deep:${sh.theme.deep};--r-accent:${sh.theme.accent}">
              <div class="bz-paper" data-font="${sh.theme.font}"><b class="rp-display">${K.esc(L(sh.name))}</b>
                <ul>${['mutton-kacchi', 'kacchi-handi', 'morog-polao'].map(id => K.dish('shahi-handi', id)).filter(Boolean).map(d => `<li><span>${K.esc(L(d.name))}</span><i></i><b class="num">${K.tkH(d.price)}</b></li>`).join('')}</ul></div>
              <div class="bz-tent"><span class="bz-q" data-qrb="shahi-handi|rounded"></span><b>${t('tc_scan')}</b></div>
            </div>
            <a class="btn btn-line btn-sm" href="#/r/shahi-handi/print">${ico('printer')}${t('see_print')}</a></article>
          <article class="bz-c bz-report" data-rv style="--d:3">
            <div class="bz-txt"><h3>${t('g_report')}</h3><p>${t('g_report_sub')}</p></div>
            <div class="rep-h"><b>${K.esc(L(sh.name))}</b><span class="meta">${t('sample')} · ${t('oct')}</span></div>
            <div class="rep-k"><div><span>${t('page_views')}</span><b class="num">${K.n(4812)}</b><em>+18%</em></div><div><span>${t('qr_scans')}</span><b class="num">${K.n(1236)}</b><em>+9%</em></div><div><span>${t('calls_dirs')}</span><b class="num">${K.n(388)}</b><em>+12%</em></div></div>
            <div class="rep-top"><span class="meta">${t('top_dishes')}</span><ol>${[['mutton-kacchi', 100], ['kacchi-handi', 64], ['morog-polao', 41]].map(([id, w]) => `<li><span>${K.esc(L(K.dish('shahi-handi', id).name))}</span><i style="--w:${w}%"></i></li>`).join('')}</ol></div>
            <p class="rep-cmp">${ico('info', 'sm')}<span>${t('insight_line', { d: L(K.dish('shahi-handi', 'mutton-kacchi').name), v: K.tk(420), a: L(K.areaOf('dhanmondi')), m: K.tk(380) })}</span></p></article>
        </div>
      </div></section>

      ${qrShow()}

      <section class="sec biz-how"><div class="wrap">
        <h2 class="h2" data-rv>${t('how_title')}</h2>
        <ol class="how">${[['how1', 'calendar-blank'], ['how2', 'camera'], ['how3', 'broadcast'], ['how4', 'chart-line-up']].map(([k, i], n) => `<li data-rv style="--d:${n}"><span class="how-i">${ico(i, 'lg')}</span><b>${t(k)}</b><p class="meta">${t(k + '_s')}</p></li>`).join('')}</ol>
      </div></section>

      <section class="sec biz-plans" id="plans"><div class="wrap">
        <div class="sec-head"><div><h2 class="h2" data-rv>${t('plans_title')}</h2><p class="sub" data-rv>${t('plans_sub')}</p></div><div class="seg" role="tablist"><button class="${bizCity === 'dhaka' ? 'on' : ''}" data-bc="dhaka">${L(D.cities.dhaka)}</button><button class="${bizCity === 'bogura' ? 'on' : ''}" data-bc="bogura">${L(D.cities.bogura)}</button></div></div>
        <div class="plans">${PLANS.map((p, i) => `<article class="plan ${p.pop ? 'pop' : ''}" data-rv style="--d:${i}">${p.pop ? `<span class="badge b-gold plan-pop">${t('most_popular')}</span>` : ''}<h3>${L(p.name)}</h3><p class="meta">${L(p.sub)}</p>
          <div class="plan-p"><b class="num">${K.tk(price(p))}</b><span>${t('per_month')}</span></div><p class="plan-day meta">${t('per_day', { v: K.tk(Math.round(price(p) / 30)) })}</p>
          <ul>${p.f.map(k => `<li>${ico('check', 'sm')}${t(k)}</li>`).join('')}</ul>
          <a class="btn ${p.pop ? 'btn-primary' : 'btn-line'} btn-block" href="#biz-form" data-jump="biz-form" data-plan="${p.id}">${t('choose_plan', { p: L(p.name) })}</a></article>`).join('')}</div>
        <p class="meta plans-note">${t('plans_note')}</p>
      </div></section>

      <section class="sec biz-faq"><div class="wrap biz-faq-in"><h2 class="h2" data-rv>${t('faq')}</h2><div class="faq">${FAQ.map((k, i) => `<div class="t-acc faq-i" data-rv data-open="false"><button type="button" class="t-acc-head" aria-expanded="false" aria-controls="faq-${i}">${t(k)}<span class="t-acc-chev">${ico('caret-down', 'sm')}</span></button><div class="t-acc-panel" id="faq-${i}" role="region"><div class="t-acc-in"><p>${t(k + '_a')}</p></div></div></div>`).join('')}</div></div></section>

      <section class="sec biz-form-s" id="biz-form"><div class="wrap"><div class="biz-form" data-rv>
        <div class="bf-copy"><h2 class="h2">${t('form_title')}</h2><p class="lede">${t('form_sub')}</p><ul class="bf-list"><li>${ico('check-circle')}${t('form_p1')}</li><li>${ico('check-circle')}${t('form_p2')}</li><li>${ico('check-circle')}${t('form_p3')}</li></ul></div>
        <form class="bf" novalidate>
          <div class="field"><label for="bf-n">${t('your_name')}</label><input class="input" id="bf-n" name="n" autocomplete="name" required></div>
          <div class="field"><label for="bf-r">${t('rest_name')}</label><input class="input" id="bf-r" name="r" required></div>
          <div class="field"><label for="bf-p">${t('phone')}</label><input class="input" id="bf-p" name="p" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX" required><span class="help">${t('phone_help')}</span></div>
          <div class="bf-2"><div class="field"><label for="bf-a">${t('area')}</label><select class="select input" id="bf-a" name="a">${D.areas.map(a => `<option>${L(a)}, ${L(D.cities[a.city])}</option>`).join('')}<option>${t('other_area')}</option></select></div>
          <div class="field"><label for="bf-pl">${t('plan')}</label><select class="select input" id="bf-pl" name="pl">${PLANS.map(p => `<option value="${p.id}" ${p.pop ? 'selected' : ''}>${L(p.name)}</option>`).join('')}<option value="unsure">${t('not_sure')}</option></select></div></div>
          <button class="btn btn-primary btn-lg btn-block">${t('book_visit')}</button>
          <p class="meta">${t('form_privacy')}</p>
        </form>
      </div></div></section>`;
    },
    mount(el) {
      K._ctxR = null;
      const io = new IntersectionObserver(es => es.forEach(en => {
        const x = en.target;
        if (x.tagName === 'IFRAME') { if (en.isIntersecting && !x.src) x.src = x.dataset.src; return; }
        if (en.isIntersecting) { if (!x.src) x.src = x.dataset.src; x.play().catch(() => { }); } else x.pause();
      }), { rootMargin: '200px 0px' });
      $$('iframe[data-src], video[data-src]', el).forEach(x => io.observe(x));
      $$('[data-qrb]', el).forEach(b => { const [id, lk] = b.dataset.qrb.split('|'); K.qrArt(b, K.siteUrl(`/t/${id}`), K.qrStyle(K.r(id), lk)); });
      K.onLeave(() => io.disconnect());
      el.addEventListener('click', e => {
        const j = e.target.closest('[data-jump]'); if (j) { e.preventDefault(); const s = $('#' + j.dataset.jump, el); if (j.dataset.plan) $('#bf-pl', el).value = j.dataset.plan; s && s.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        const c = e.target.closest('[data-bc]'); if (c) { bizCity = c.dataset.bc; const y = scrollY; K.route(true); scrollTo(0, y); }
      });
      const f = $('.bf', el);
      f.addEventListener('submit', e => {
        e.preventDefault();
        let ok = true;
        $$('.field .err', f).forEach(x => x.remove());
        $$('[required]', f).forEach(inp => {
          const bad = !inp.value.trim() || (inp.type === 'tel' && !/^(\+?88)?01[3-9]\d{8}$/.test(inp.value.replace(/[\s-]/g, '')));
          inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
          if (bad) { ok = false; inp.closest('.field').insertAdjacentHTML('beforeend', `<span class="err">${inp.type === 'tel' ? t('err_phone') : t('err_required')}</span>`); }
        });
        if (!ok) { $('[aria-invalid="true"]', f).focus(); return; }
        f.innerHTML = `<div class="bf-done">${ico('check-circle', 'lg')}<h3>${t('form_done')}</h3><p class="meta">${t('form_done_sub')}</p></div>`;
      });
    }
  };

  /* ---------------- printable menu (paper always matches online) ---------------- */
  K.views.print = {
    chrome: { tabbar: false, footer: false, print: true },
    title: p => `${L(K.r(p[0]).name)} · ${t('print_menu')}`,
    render: ([id], q) => {
      const r = K.r(id), cards = q.get('cards') === '1', lk = K.QR_LOOKS[q.get('look')] ? `look=${q.get('look')}` : '';
      const bar = `<div class="pm-bar wrap noprint"><a class="btn btn-ghost" href="#/r/${id}">${ico('arrow-left')}${t('back')}</a><div class="seg"><a class="${cards ? '' : 'on'}" href="#/r/${id}/print${lk ? '?' + lk : ''}" data-pm>${t('pm_menu')}</a><a class="${cards ? 'on' : ''}" href="#/r/${id}/print?cards=1${lk ? '&' + lk : ''}" data-pm>${t('pm_cards')}</a></div><span class="meta">${cards ? t('pm_cards_help') : t('print_help')}</span><button class="btn btn-primary" data-print>${ico('printer')}${t('print_save')}</button></div>`;
      const st = `style="--r-accent:${r.theme.accent};--r-deep:${r.theme.deep};--r-on:${r.theme.deep}"`;
      if (cards) return `${bar}<article class="pm pm-cards" data-font="${r.theme.font}" ${st}>${[1, 2, 3, 4, 5, 6].map(n => `<div class="pc-card">
        <div class="pc-top">${K.mono(r)}<span class="pc-name rp-display">${K.esc(r.name.en)}</span><span class="pc-nbn">${K.esc(r.name.bn)}</span></div>
        <span class="pc-qr" data-qrt="${n}"></span>
        <b>Scan for the menu and prices</b><span class="pc-bn">মেনু ও দাম দেখতে ক্যামেরা দিয়ে স্ক্যান করুন</span>
        <span class="pc-t">Table ${n} <span>· টেবিল ${'০১২৩৪৫৬৭৮৯'[n]}</span></span>
        <small>No app needed · ${K.BRAND}</small></div>`).join('')}</article>`;
      const price = v => `৳${new Intl.NumberFormat('en-IN').format(v)}`;
      return `${bar}
      <article class="pm" data-font="${r.theme.font}" ${st}>
        <header class="pm-h">${K.mono(r)}<h1 class="rp-display">${K.esc(r.name.en)}</h1><p class="pm-bn">${K.esc(r.name.bn)}</p><span class="pm-rule" aria-hidden="true"></span><p class="pm-tag">${K.esc(r.tagline.en)}</p><p class="pm-where">${K.esc(r.address.en)} · ${K.esc(r.phone)}</p></header>
        <div class="pm-cols">${r.cats.map(c => `<section><h2><span class="rp-display">${K.esc(c.en)}</span><small>${K.esc(c.bn)}</small></h2>${r.menu.filter(d => d.cat === c.id).map(d => `<div class="pm-i"><div class="pm-l"><span class="pm-n"><b>${K.esc(d.name.en)}</b>${r.signature.includes(d.id) ? '<i class="pm-star">★</i>' : ''}<span class="pm-dots"></span><b class="num pm-pr">${price(d.price)}</b></span><span class="pm-ibn">${K.esc(d.name.bn)}<span class="pm-por"> · ${K.esc(d.por.en)}${d.veg ? ' · Veg' : ''}</span></span></div></div>`).join('')}</section>`).join('')}</div>
        <footer class="pm-f"><div class="pm-qr" data-qr></div><div class="pm-ft"><p class="pm-ft-h">${t('pm_scan')}</p><p class="pm-ft-bn">${t('pm_scan_bn')}</p><p class="pm-small"><i class="pm-star">★</i> House favourite · Prices in taka, before VAT ${r.vat}%${r.service ? ` and service ${r.service}%` : ''} · ${t('pm_updated', { d: D.updated.en })}</p></div><span class="pm-brand">${K.BRAND}</span></footer>
      </article>`;
    },
    mount(el, [id], q) {
      K._ctxR = null;
      const st = K.qrStyle(K.r(id), K.QR_LOOKS[q.get('look')] ? q.get('look') : null);
      $('[data-print]', el).onclick = () => print();
      $$('[data-pm]', el).forEach(a => a.onclick = e => { e.preventDefault(); K.go(a.getAttribute('href').slice(1), { replace: true }); });
      const box = $('[data-qr]', el); if (box) K.qrArt(box, K.siteUrl('/t/' + id), st);
      $$('[data-qrt]', el).forEach(b => K.qrArt(b, K.siteUrl(`/t/${id}?table=${b.dataset.qrt}`), st));
    }
  };
})();
