/* Restaurant page: works as the restaurant's own website, in its own colours and type */
(function () {
  const K = window.K, D = K.data, t = K.t, L = K.L, ico = K.ico, $ = K.$, $$ = K.$$;
  const digits = p => p.replace(/[^\d]/g, '');
  const mapUrl = r => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address.en)}`;
  const embedUrl = r => `https://maps.google.com/maps?q=${encodeURIComponent(r.address.en)}&z=15&output=embed`;
  const waUrl = r => `https://wa.me/${digits(r.phone)}`;
  const dist = rating => { const five = Math.round(Math.max(30, Math.min(85, (rating - 3.6) * 70))); const four = Math.round((100 - five) * .6); const three = Math.round((100 - five - four) * .55); const two = Math.round((100 - five - four - three) * .5); return [five, four, three, two, Math.max(0, 100 - five - four - three - two)]; };
  const mark = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#2A3DB8"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="19.2" cy="13" r="3.1" fill="#F5A300"/></svg>`;
  /* the khabo mark as a round wheel, for the reading line along the top */
  /* the reading-line mark: a plate that rolls as you read, with a fork and knife that stay upright beside it */
  const plateMark = `<svg class="pm-fork" viewBox="0 0 8 24"><path d="M1.2 1v6.2a2.8 2.8 0 0 0 2 2.7V23a.8.8 0 0 0 1.6 0V9.9a2.8 2.8 0 0 0 2-2.7V1M4 1v6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    + `<span class="pm-plate"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15.5" fill="#FBF8F2"/><circle cx="16" cy="16" r="11.6" fill="#F0EADF"/><circle cx="16" cy="16" r="11.6" fill="none" stroke="rgba(60,40,10,.12)" stroke-width=".8"/><path d="M10.6 17.4c0-3.5 2.6-6.1 5.9-6.1 3.1 0 5 2.2 5 4.8 0 3.3-2.8 5.4-6 5.4-2.9 0-4.9-1.6-4.9-4.1z" fill="#E39A2B"/><circle cx="14.3" cy="15.6" r="1.3" fill="#C2561E"/><circle cx="18.2" cy="17.9" r="1.1" fill="#C2561E"/><path d="M19.6 10.6c1.6-.9 3.2-.6 4.1.3-1 1.3-2.7 1.6-4.1-.3z" fill="#4E8B3A"/></svg></span>`
    + `<svg class="pm-knife" viewBox="0 0 8 24"><path d="M3.4 1C5.6 2.6 6.4 6 6.4 10.4c0 .6-.4 1-1 1H4.6V23a.8.8 0 0 1-1.6 0V1.6c0-.4.2-.6.4-.6z" fill="currentColor"/></svg>`;
  let photoTab = 'inside', rvFilter = 'all';
  const mine = () => K.store.get('myReviews', []);

  /* the name, split into words and (in English) letters, so each text-animation style can move what it needs.
     Bangla stays whole words: splitting it into letters would break its joined letters. */
  function nameSpans(name) {
    let c = 0; const letters = K.S.lang !== 'bn';
    return name.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}"><span>${letters ? Array.from(w).map(ch => `<span class="c" style="--c:${c++}">${K.esc(ch)}</span>`).join('') : K.esc(w)}</span></span>`).join(' ');
  }

  function hero(r) {
    const os = K.openState(r), morph = K._morph ? 'style="view-transition-name:hero-morph"' : '';
    const imgs = r.hero.map((id, i) => `<div class="rp-slide ${i === 0 ? 'on' : ''}">${K.img(id, { w: 1800, eager: i === 0, alt: '' })}</div>`).join('');
    const ctas = [];
    if (r.hasTour) ctas.push(`<button class="btn btn-lg rp-cta-tour" data-tour="${r.id}">${ico('virtual-reality')}${t('step_inside')}</button>`);
    if (r.hasFilm) ctas.push(`<button class="btn btn-lg btn-glass" data-film="${r.id}">${ico('play-fill')}<span>${t('watch_film')}</span><span class="rp-len num">${K.dg(r.film.len)}</span></button>`);
    if (!ctas.length) ctas.push(`<button class="btn btn-lg rp-cta-tour" data-photos="all">${ico('images')}${t('see_photos')}</button>`);
    ctas.push(`<a class="btn btn-lg btn-glass" href="#menu" data-jump="menu">${ico('fork-knife')}${t('see_menu')}</a>`);
    const labels = [r.featured ? t('featured') : '', r.founding ? t('founding') : ''].filter(Boolean);
    return `<section class="rp-hero ${K._morph ? 'morph' : ''}" data-hero>
      <div class="rp-media" ${morph}>${imgs}${r.hasFilm ? `<video class="rp-vid" muted loop playsinline preload="none" aria-hidden="true"></video>` : ''}</div>
      <div class="rp-shade" aria-hidden="true"></div>
      <div class="rp-top wrap"><button class="ibtn glass" data-back aria-label="${t('back')}">${ico('arrow-left')}</button><a class="rp-home" href="#/" aria-label="${t('go_home', { b: K.BRAND })}">${mark}<span>${K.BRAND}</span></a><span class="sp"></span><button class="ibtn glass" data-share aria-label="${t('share')}">${ico('share-network')}</button></div>
      <div class="wrap rp-hin">
        <p class="rp-kick">${K.mono(r)}<span>${L(K.areaOf(r.area))}, ${L(D.cities[r.city])}</span>${labels.length ? `<span class="rp-lbl">${labels.join(' / ')}</span>` : ''}</p>
        <h1 class="rp-name rp-display" aria-label="${K.esc(L(r.name))}" style="--n:${Array.from(L(r.name).replace(/\s+/g, '')).length}">${nameSpans(L(r.name))}</h1>
        <p class="rp-alt">${K.esc(K.S.lang === 'bn' ? r.name.en : r.name.bn)}</p>
        <p class="rp-tag">${K.esc(L(r.tagline))}</p>
        <div class="rp-facts">
          <button class="rp-fact" data-jump="reviews" style="--i:0"><b class="num">${ico('star-fill', 'sm')}${K.n(r.rating)}</b><span>${t('n_reviews', { n: K.n(r.reviews) })}</span></button>
          <span class="rp-fact" style="--i:1"><b class="num">${K.ppRange(r)}</b><span>${t('per_person')}</span></span>
          <button class="rp-fact" data-jump="info" style="--i:2"><b class="${os.open ? 'open-now' : 'closed'}">${os.open ? t('open_now') : t('closed_now')}</b><span>${os.label}</span></button>
        </div>
        <div class="rp-ctas">${ctas.map((c, i) => c.replace(/^<(a|button) class="/, `<$1 style="--i:${i}" class="`)).join('')}</div>
      </div>
      ${r.hero.length > 1 ? `<div class="rp-dots" aria-hidden="true">${r.hero.map((x, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>` : ''}
    </section>`;
  }

  function nav(r) {
    const tabs = [['menu', t('menu')]];
    if (r.hasTour) tabs.push(['inside', t('inside')]);
    if (r.hasKitchen) tabs.push(['kitchen', t('kitchen')]);
    tabs.push(['photos', t('photos')], ['reviews', t('reviews')], ['info', t('visit_short')]);
    return `<nav class="rp-nav" aria-label="${t('sections')}"><div class="wrap rp-nav-in">
      <span class="rp-nav-lead"><a class="rp-nav-home" href="#/" aria-label="${t('go_home', { b: K.BRAND })}">${mark}</a><span class="rp-nav-id">${K.mono(r)}<b class="rp-display">${K.esc(L(r.name))}</b></span></span>
      <div class="rp-tabs">${tabs.map(([id, l]) => `<a href="#${id}" data-jump="${id}">${l}</a>`).join('')}<i class="rp-ink" aria-hidden="true"></i></div>
      <span class="sp"></span>
      <a class="btn btn-sm btn-line d-only" href="tel:${r.phone}">${ico('phone')}${t('call')}</a>
      <button class="btn btn-sm rp-acc d-only" data-act="bill" data-r="${r.id}">${ico('receipt')}${t('bill')}</button>
    </div></nav>`;
  }

  function intro(r) {
    const os = K.openState(r);
    const rows = [
      [t('prices'), `<span class="fresh">${K.checked(r.checked)}</span>`],
      [t('on_the_bill'), t('vat_plus', { v: K.n(r.vat), s: K.n(r.service) })],
      [t('hours'), `${os.from} ${t('to')} ${os.close}`],
      [t('seats'), `${K.n(r.seats)}${r.fac.includes('cabin') ? ', ' + t('has_cabins').toLowerCase() : ''}`],
      [t('address'), K.esc(L(r.spot))],
      [t('since_label'), K.dg(r.since)]
    ];
    return `<section class="sec rp-intro"><div class="wrap rp-intro-in">
      <div class="rp-story" data-rv><h2 class="h3 rp-display">${t('about_r', { r: K.esc(L(r.name)) })}</h2><p>${K.esc(L(r.story))}</p>
        <div class="rp-acts"><a class="btn btn-line btn-sm" href="tel:${r.phone}">${ico('phone')}${t('call')}</a><a class="btn btn-line btn-sm" href="${waUrl(r)}" target="_blank" rel="noopener">${ico('whatsapp-logo')}WhatsApp</a><a class="btn btn-line btn-sm" href="${mapUrl(r)}" target="_blank" rel="noopener">${ico('navigation-arrow')}${t('directions')}</a></div></div>
      <dl class="rp-dl" data-rv>${rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
    </div></section>`;
  }

  function signature(r) {
    const ds = r.signature.map(id => r.menu.find(d => d.id === id)).filter(Boolean);
    return `<section class="sec rp-sig"><div class="wrap">
      ${K.rail('sig', ds.map((d, i) => `<article class="sig" data-rv style="--d:${i}">
        <a class="sig-ph" href="#/r/${r.id}?dish=${d.id}" data-dish="${r.id}|${d.id}">${K.ph(d.p, { w: 760, word: L(d.name), alt: L(d.name), tone: r.theme, icon: (D.types[d.type] || {}).i })}</a>
        <div class="sig-b"><div><h3 class="rp-display">${K.esc(L(d.name))}</h3><p class="meta">${K.esc(L(d.por))}${d.d3 ? ` · ${t('in_3d')}` : d.video ? ` · ${t('has_video')}` : ''}</p></div><div class="sig-p"><span class="price num">${K.tk(d.price)}</span>${K.addBtn(r.id, d.id)}</div></div>
      </article>`).join(''), { head: `<h2 class="h2 rp-display" data-rv>${t('signature')}</h2>` })}
    </div></section>`;
  }

  function deal(r) {
    if (!r.deal) return '';
    const d = r.deal;
    return `<section class="rp-deal-s"><div class="wrap"><div class="rp-deal" data-rv>
      ${K.ph(d.p, { w: 700 })}
      <div class="rp-deal-b"><span class="rp-deal-k">${d.week ? t('deal_week') : t('deal')}</span><h3 class="rp-display">${K.esc(L(d))}</h3><p>${K.esc(L(d.desc))}</p><p class="meta">${K.esc(L(d.when))}</p></div>
      <div class="rp-deal-p"><b class="num">${K.tk(d.price)}</b><span class="was num">${K.tk(d.was)}</span><span class="meta">${t('save_x', { v: K.tk(d.was - d.price) })}</span></div>
    </div></div></section>`;
  }

  function menuItem(r, d, i = 0) {
    const media = [d.d3 ? `<span class="mi-tag">${ico('cube', 'sm')}3D</span>` : '', d.video ? `<span class="mi-tag">${ico('play-fill', 'sm')}${t('video')}</span>` : ''].join('');
    return `<article class="mi ${d.p ? '' : 'np'}" data-rv style="--d:${i % 3}" data-dish="${r.id}|${d.id}" data-name="${K.esc((d.name.en + ' ' + d.name.bn).toLowerCase())}" tabindex="0">
      <div class="mi-t"><h4>${K.esc(L(d.name))}${d.best ? `<span class="mi-best">${t('best_seller')}</span>` : ''}</h4>
        <p class="mi-alt">${K.esc(K.S.lang === 'bn' ? d.name.en : d.name.bn)}</p>
        <p class="mi-por">${K.esc(L(d.por))}${d.spice ? ' · ' + K.spice(d.spice) : ''}${d.veg ? ` · <span class="veg">${ico('leaf', 'sm')}${t('veg')}</span>` : ''}</p>
        ${d.desc ? `<p class="mi-desc">${K.esc(L(d.desc))}</p>` : ''}
        <div class="mi-p"><span class="price num">${K.tk(d.price)}</span>${media}</div>
      </div>
      ${d.p ? `<div class="mi-ph">${K.ph(d.p, { w: 260, alt: '' })}${K.addBtn(r.id, d.id)}</div>` : `<div class="mi-add">${K.addBtn(r.id, d.id)}</div>`}
    </article>`;
  }
  function menu(r) {
    return `<section class="sec rp-menu" id="menu"><div class="wrap">
      <div class="rp-menu-h"><div><h2 class="h2 rp-display" data-rv>${t('menu')}</h2><p class="meta" data-rv><span class="fresh">${K.checked(r.checked)}</span><span>${t('menu_note', { v: K.n(r.vat), s: K.n(r.service) })}</span></p></div>
        <div class="rp-menu-tools"><label class="msearch">${ico('magnifying-glass', 'sm')}<input type="search" placeholder="${t('search_menu')}" aria-label="${t('search_menu')}"></label><button class="btn btn-line btn-sm" data-qrmenu>${ico('qr-code')}${t('qr_menu_btn')}</button><a class="btn btn-line btn-sm" href="#/r/${r.id}/print">${ico('printer')}${t('print_menu')}</a></div></div>
      <div class="mcats"><div class="chips scroll">${r.cats.map((c, i) => `<button class="chip sm ${i === 0 ? 'on' : ''}" data-mcat="${c.id}">${L(c)}<span class="meta">${K.n(r.menu.filter(d => d.cat === c.id).length)}</span></button>`).join('')}</div></div>
      ${r.cats.map(c => `<div class="mgroup" id="mc-${c.id}" data-cat="${c.id}"><h3 class="mgroup-h rp-display">${L(c)}</h3><div class="mlist">${r.menu.filter(d => d.cat === c.id).map((d, i) => menuItem(r, d, i)).join('')}</div></div>`).join('')}
      <p class="mnone meta" hidden>${t('menu_none')}</p>
    </div></section>`;
  }

  function tour(r) {
    if (!r.hasTour) return '';
    const room = r.tour[0];
    return `<section class="sec rp-tour" id="inside"><div class="wrap">
      <div class="sec-head"><div><h2 class="h2 rp-display" data-rv>${t('step_inside')}</h2><p class="sub" data-rv>${t('tour_sub', { d: L(r.mediaDate || D.updated) })}</p></div></div>
      <div class="rp-pano" data-rv="scale"><canvas aria-label="${t('tour_of', { r: L(r.name) })}"></canvas><img class="rp-pano-poster" src="${K.src(`pv:${room.pano}:a`)}" alt="" loading="lazy">
        <span class="bx-drag">${ico('hand-grabbing')}${t('drag_look')}</span>
        <button class="btn rp-acc rp-pano-full" data-tour="${r.id}|${room.id}">${ico('corners-out')}${t('full_screen')}</button></div>
      ${r.tour.length > 1 ? `<div class="rp-rooms">${r.tour.map((x, i) => `<button class="rp-room ${i === 0 ? 'on' : ''}" data-iroom="${x.id}"><img src="${K.panoSrc.thumb(x.pano)}" alt="" loading="lazy"><span>${K.esc(L(x))}</span></button>`).join('')}</div>` : ''}
    </div></section>`;
  }

  function kitchen(r) {
    if (!r.hasKitchen) return '';
    const k = r.kitchen, ph = (k.photos || []).slice(0, 3);
    return `<section class="sec rp-kitchen" id="kitchen"><div class="wrap">
      <div class="rp-k-h"><h2 class="h2 rp-display" data-rv>${t('kitchen_title')}</h2><p class="sub" data-rv>${t('kitchen_sub')}</p></div>
      <div class="rp-k-grid ${ph.length ? '' : 'solo'}">
        <button class="rp-k-film" data-film="${r.id}|kitchen" data-rv="scale">${K.ph(k.poster, { w: 1400 })}<span class="rp-k-cap"><span class="rp-play">${ico('play-fill', 'lg')}</span><span><b>${t('watch_kitchen')}</b><span>${L(k.date)}</span></span></span></button>
        ${ph.map((p, i) => `<button class="rp-k-ph" data-photos="kitchen" data-i="${i}" data-rv="scale" style="--d:${i + 1}">${K.ph(p, { w: 600, alt: '' })}</button>`).join('')}
      </div>
    </div></section>`;
  }

  const photoCats = r => [['inside', t('inside')], ['outside', t('outside')], ['kitchen', t('kitchen')], ['food', t('food')]].filter(([c]) => r.gallery[c] && r.gallery[c].length);
  function photosGrid(r) {
    const list = r.gallery[photoTab] || [];
    const shown = list.length >= 5 ? 5 : list.length >= 3 ? 3 : list.length;
    const more = list.length - shown;
    return list.slice(0, shown).map((p, i) => `<button class="pg-i ${i === 0 ? 'big' : ''}" data-photos="${photoTab}" data-i="${i}">${K.ph(p, { w: i === 0 ? 1200 : 600, alt: '' })}${i === shown - 1 && more > 0 ? `<span class="pg-more">+${K.n(more)}</span>` : ''}</button>`).join('');
  }
  function photos(r) {
    const cats = photoCats(r); if (!cats.length) return '';
    if (!r.gallery[photoTab] || !r.gallery[photoTab].length) photoTab = cats[0][0];
    const n = (r.gallery[photoTab] || []).length;
    return `<section class="sec rp-photos" id="photos"><div class="wrap">
      <div class="sec-head"><h2 class="h2 rp-display" data-rv>${t('photos')}</h2><span class="meta">${t('photos_date', { d: L(r.mediaDate || D.updated) })}</span></div>
      <div class="seg pg-seg">${cats.map(([c, l]) => `<button class="${c === photoTab ? 'on' : ''}" data-ptab="${c}">${l}<span class="meta">${K.n(r.gallery[c].length)}</span></button>`).join('')}</div>
      <div class="pg" data-n="${n >= 5 ? 5 : n >= 3 ? 3 : n}">${photosGrid(r)}</div>
    </div></section>`;
  }

  /* ---------- reviews ---------- */
  function revCard(v, i, own) {
    const nm = own ? v.who : v.who;
    return `<article class="rv ${own ? 'own' : ''}" data-rv style="--d:${i % 3}">
      <header><span class="av">${K.esc(K.initials(nm))}</span><div><b>${K.esc(nm)}</b><span class="meta">${K.esc(L(v.when))}</span></div><span class="rv-st" aria-label="${t('n_stars', { n: v.st })}">${ico('star-fill', 'sm').repeat(v.st)}${ico('star', 'sm').repeat(5 - v.st)}</span></header>
      ${own ? `<span class="rv-pend">${ico('clock', 'sm')}${t('rv_pending')}</span>` : v.vf ? `<span class="vf">${ico('seal-check-fill', 'sm')}${t('verified_visit')}</span>` : ''}
      <p>${K.esc(v.t)}</p>
      ${v.ord.length ? `<p class="rv-ord">${t('ordered')}: ${v.ord.map(K.esc).join(', ')}</p>` : ''}
      ${v.pics ? `<div class="rv-pics">${v.pics.map(p => K.ph(p, { w: 240 })).join('')}</div>` : ''}
      ${v.reply ? `<div class="rv-reply"><b>${t('owner_reply')}</b><p>${K.esc(L(v.reply))}</p></div>` : ''}
    </article>`;
  }
  function revList(r) {
    let rv = K.revOf(r.id);
    if (rvFilter === 'verified') rv = rv.filter(v => v.vf);
    if (rvFilter === 'photos') rv = rv.filter(v => v.pics);
    if (rvFilter === 'bn') rv = rv.filter(v => /[ঀ-৿]/.test(v.t));
    const own = mine().filter(v => v.r === r.id);
    const items = (rvFilter === 'all' ? own.map((v, i) => revCard(v, i, true)) : []).concat(rv.map((v, i) => revCard(v, i + own.length)));
    return items.join('') || `<div class="empty sm"><p>${t('no_reviews')}</p></div>`;
  }
  function reviews(r) {
    const ds = dist(r.rating);
    const f = [['all', t('rv_all')], ['verified', t('verified_visit')], ['photos', t('with_photos')], ['bn', 'বাংলায়']];
    return `<section class="sec rp-reviews" id="reviews"><div class="wrap">
      <div class="rv-head"><h2 class="h2 rp-display" data-rv>${t('reviews')}</h2><div class="seg rv-f">${f.map(([id, l]) => `<button class="${rvFilter === id ? 'on' : ''}" data-rvf="${id}">${l}</button>`).join('')}</div></div>
      <div class="rv-top" data-rv>
        <div class="rv-score"><b class="rv-big num">${K.n(r.rating)}</b><div><span class="rv-stars">${ico('star-fill').repeat(Math.round(r.rating))}</span><p class="meta">${t('rv_counts', { n: K.n(r.reviews), v: K.n(r.verified) })}</p></div></div>
        <div class="rv-bars">${ds.map((p, i) => `<div><span class="num">${K.n(5 - i)}</span><i style="--w:${p}%"></i><span class="num meta">${K.n(p)}%</span></div>`).join('')}</div>
        <div class="rv-cta"><button class="btn rp-acc btn-lg" data-write>${ico('chat-circle-dots')}${t('write_review')}</button><p class="meta">${t('verified_how')}</p></div>
      </div>
      <div class="rv-list">${revList(r)}</div>
    </div></section>`;
  }
  function writeReview(r, el) {
    K.auth.need(() => {
      const dishes = r.menu.slice(0, 12);
      let st = 0;
      K.sheet.open({
        cls: 'drawer wr-sheet', title: t('write_review'), html: `<form class="sheet-b wr" novalidate>
          <div class="wr-r">${K.mono(r)}<div><b>${K.esc(L(r.name))}</b><span class="meta">${L(K.areaOf(r.area))}</span></div></div>
          <fieldset class="wr-st"><legend>${t('your_rating')}</legend><div class="wr-stars" role="radiogroup">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="false" data-st="${n}" aria-label="${t('n_stars', { n })}">${ico('star-fill', 'lg')}</button>`).join('')}</div><span class="meta" data-stl>${t('tap_stars')}</span></fieldset>
          <fieldset><legend>${t('what_ordered')}</legend><div class="chips">${dishes.map(d => `<button type="button" class="chip sm" data-ord="${K.esc(L(d.name))}">${K.esc(L(d.name))}</button>`).join('')}</div></fieldset>
          <div class="field"><label for="wr-t">${t('your_review')}</label><textarea id="wr-t" class="textarea" rows="5" placeholder="${t('review_ph')}"></textarea><span class="help">${t('review_help')}</span><span class="err" hidden>${t('review_err')}</span></div>
          <div class="field"><span class="lbl">${t('add_photos')}</span><label class="wr-pics"><input type="file" accept="image/*" multiple hidden data-pics>${ico('camera')}<span>${t('choose_photos')}</span></label><div class="wr-prev" data-prev></div></div>
          <p class="wr-note meta">${ico('seal-check', 'sm')}${t('review_note')}</p>
          <button class="btn rp-acc btn-lg btn-block" type="submit">${t('post_review')}</button>
        </form>`,
        onOpen: s => {
          s.style.cssText = `--r-accent:${r.theme.accent};--r-on:${r.theme.deep}`;
          const form = $('form', s), ord = new Set();
          const labels = ['', t('st_1'), t('st_2'), t('st_3'), t('st_4'), t('st_5')];
          $$('[data-st]', s).forEach(b => b.onclick = () => { st = Number(b.dataset.st); $$('[data-st]', s).forEach(x => { const on = Number(x.dataset.st) <= st; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(Number(x.dataset.st) === st)); }); $('[data-stl]', s).textContent = labels[st]; });
          $$('[data-ord]', s).forEach(b => b.onclick = () => { const v = b.dataset.ord; ord.has(v) ? ord.delete(v) : ord.add(v); b.classList.toggle('on', ord.has(v)); });
          $('[data-pics]', s).onchange = e => { $('[data-prev]', s).innerHTML = Array.from(e.target.files).slice(0, 4).map(f => `<img src="${URL.createObjectURL(f)}" alt="">`).join(''); };
          form.onsubmit = e => {
            e.preventDefault();
            const tx = $('#wr-t', s).value.trim();
            if (!st) { $('[data-stl]', s).textContent = t('pick_stars'); $('[data-stl]', s).classList.add('err'); return; }
            const bad = tx.length < 20; $('.err', form).hidden = !bad; $('#wr-t', s).setAttribute('aria-invalid', String(bad)); if (bad) { $('#wr-t', s).focus(); return; }
            const u = K.user();
            const list = mine(); list.unshift({ r: r.id, who: u.name, st, t: tx, ord: Array.from(ord), when: { en: t('just_now'), bn: 'এইমাত্র' }, vf: false });
            K.store.set('myReviews', list);
            K.sheet.close().then(() => { rvFilter = 'all'; const sec = $('#reviews', el); sec.outerHTML = reviews(r); $$('#reviews [data-rv]', el).forEach(x => x.classList.add('in')); K.toast(t('review_thanks'), 'check-circle'); });
          };
        }
      });
    }, t('signin_review'));
  }

  /* ---------- QR table menu: what the code on the table opens ---------- */
  const look = r => (r.qr && r.qr.look) || 'rounded';
  function qrSheet(r) {
    K.sheet.open({
      cls: 'drawer qrs', title: t('qr_menu'), html: `<div class="sheet-b qrs-b">
        <div class="qrs-card" data-font="${r.theme.font}"><span class="qrs-name rp-display">${K.esc(L(r.name))}</span><span class="qrs-code" data-qrs></span><b>${t('qrs_scan')}</b><span class="qrs-tbl">${t('table_n', { n: K.dg(5) })}</span></div>
        <div class="qrs-looks"><p class="qrs-lh"><b>${t('qrs_brand')}</b><span>${t('qrs_brand_sub')}</span></p><div class="qrs-lr" role="radiogroup" aria-label="${t('qrs_brand')}">${Object.keys(K.QR_LOOKS).map(k => `<button role="radio" aria-checked="${k === look(r) ? 'true' : 'false'}" class="${k === look(r) ? 'on' : ''}" data-look="${k}"><span class="qrs-lp" data-lp="${k}"></span><span>${L(K.QR_LOOKS[k])}</span></button>`).join('')}</div></div>
        <p class="qrs-how">${t('qrs_how')}</p>
        <ol class="qrs-steps"><li>${ico('qr-code')}<span>${t('qrs_s1')}</span></li><li>${ico('fork-knife')}<span>${t('qrs_s2')}</span></li><li>${ico('receipt')}<span>${t('qrs_s3')}</span></li></ol>
        <div class="qrs-acts"><a class="btn rp-acc btn-lg btn-block" href="#/t/${r.id}?table=5">${ico('arrow-up-right')}${t('qrs_open')}</a><a class="btn btn-line btn-lg btn-block" href="#/r/${r.id}/print?cards=1">${ico('printer')}${t('qrs_cards')}</a></div>
      </div>`,
      onOpen: s => {
        s.style.cssText = `--r-accent:${r.theme.accent};--r-on:${r.theme.deep};--r-deep:${r.theme.deep}`;
        const url = K.siteUrl(`/t/${r.id}?table=5`), cards = $('[href*="/print?cards=1"]', s);
        const show = k => { K.qrArt($('[data-qrs]', s), url, K.qrStyle(r, k)); cards.setAttribute('href', `#/r/${r.id}/print?cards=1&look=${k}`); };
        show(look(r));
        /* small previews of every look, drawn from the same renderer */
        $$('[data-lp]', s).forEach(b => K.qrArt(b, url, K.qrStyle(r, b.dataset.lp)));
        $$('[data-look]', s).forEach(b => b.onclick = () => { $$('[data-look]', s).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); }); show(b.dataset.look); });
        $$('a', s).forEach(a => a.addEventListener('click', e => { e.preventDefault(); K.leaveTo(a.getAttribute('href').slice(1)); })); }
    });
  }

  /* ---------- plan your visit ---------- */
  function info(r) {
    const os = K.openState(r);
    return `<section class="sec rp-info" id="info"><div class="wrap">
      <h2 class="h2 rp-display" data-rv>${t('visit')}</h2>
      <div class="visit">
        <div class="vmap" data-rv="scale"><div class="vmap-ph"><span>${ico('map-trifold', 'lg')}</span><b>${K.esc(L(r.spot))}</b></div><iframe data-src="${embedUrl(r)}" title="${t('map_of', { r: K.esc(L(r.name)) })}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
          <a class="btn btn-white btn-sm vmap-open" href="${mapUrl(r)}" target="_blank" rel="noopener">${ico('arrow-up-right', 'sm')}${t('open_gmaps')}</a></div>
        <div class="vinfo" data-rv>
          <div class="vi"><h3>${t('address')}</h3><p class="vi-big">${K.esc(L(r.address))}</p><div class="vi-btns"><a class="btn rp-acc" href="${mapUrl(r)}" target="_blank" rel="noopener">${ico('navigation-arrow')}${t('directions')}</a><a class="btn btn-line" href="tel:${r.phone}">${ico('phone')}${t('call')}</a><a class="btn btn-line" href="${waUrl(r)}" target="_blank" rel="noopener">${ico('whatsapp-logo')}WhatsApp</a></div></div>
          <div class="vi"><h3>${t('hours')}</h3><p class="vi-big">${os.from} ${t('to')} ${os.close}</p><p><span class="${os.open ? 'open-now' : 'closed'}">${os.open ? t('open_now') : t('closed_now')}</span><span class="meta">, ${t('every_day').toLowerCase()}</span></p></div>
          <div class="vi"><h3>${t('payment')}</h3><p>${r.pay.join(', ')}</p><p class="meta">${t('vat_plus', { v: K.n(r.vat), s: K.n(r.service) })}</p></div>
          <div class="vi wide"><h3>${t('facilities')}</h3><ul class="fac">${r.fac.map(f => `<li>${ico(D.facilities[f].i)}${L(D.facilities[f])}</li>`).join('') || `<li class="meta">${t('fac_none')}</li>`}</ul></div>
        </div>
      </div>
    </div></section>`;
  }

  function more(r) {
    const rs = D.restaurants.filter(x => x.id !== r.id && x.city === r.city).sort((a, b) => (b.area === r.area) - (a.area === r.area) || b.rating - a.rating).slice(0, 6);
    return `<section class="sec rp-more"><div class="wrap">${K.rail('more', rs.map(x => K.rcard(x, { w: true })).join(''), { head: `<h2 class="h2">${t('more_near', { a: L(K.areaOf(r.area)) })}</h2>` })}</div></section>`;
  }

  function dock(r) {
    return `<div class="dock" style="--r-accent:${r.theme.accent};--r-on:${r.theme.deep}"><a href="tel:${r.phone}">${ico('phone')}${t('call')}</a><a href="${waUrl(r)}" target="_blank" rel="noopener">${ico('whatsapp-logo')}WhatsApp</a><a href="${mapUrl(r)}" target="_blank" rel="noopener">${ico('navigation-arrow')}${t('directions')}</a><button class="pri" data-jump="menu">${ico('fork-knife')}${t('menu')}</button></div>`;
  }

  K.views.restaurant = {
    chrome: { over: true, tabbar: false, tab: 'restaurants' },
    title: p => L(K.r(p[0]).name),
    render: ([id]) => {
      const r = K.r(id);
      return `<div class="rp" data-font="${r.theme.font}" style="--r-accent:${r.theme.accent};--r-deep:${r.theme.deep};--r-on:${r.theme.deep}">${hero(r)}${nav(r)}<div class="rp-body">${intro(r)}${signature(r)}${deal(r)}${menu(r)}${tour(r)}${kitchen(r)}${photos(r)}${reviews(r)}${info(r)}${more(r)}</div>${dock(r)}</div>`;
    },
    mount(el, [id], q) {
      const r = K.r(id); K._ctxR = id; K._house = id; K.S.trayMin = false;
      const hdr = $('.hdr'), heroEl = $('.rp-hero', el), navEl = $('.rp-nav', el);
      document.body.classList.add('rp-mode');
      /* no scrollbar on the right: a line across the top fills in the restaurant's accent as you read down,
         and a small plate rolls along it like a wheel */
      const root = document.documentElement; root.classList.add('rp-noscroll');
      const prog = document.createElement('div'); prog.className = 'rp-prog'; prog.setAttribute('aria-hidden', 'true');
      prog.style.cssText = `--r-accent:${r.theme.accent}`;
      prog.innerHTML = `<i class="rp-prog-fill"></i><span class="rp-prog-mark">${plateMark}</span>`;
      document.body.append(prog);
      const MARK_W = 40, PLATE = 20; let praf = 0;
      const paintProg = () => {
        praf = 0;
        const max = root.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0, x = p * (innerWidth - MARK_W - 8);
        prog.style.setProperty('--p', p.toFixed(4)); prog.style.setProperty('--x', x.toFixed(1) + 'px');
        prog.style.setProperty('--rot', (x / (Math.PI * PLATE) * 360).toFixed(1) + 'deg');
        prog.classList.toggle('on', p > .003);
      };
      const onProg = () => { if (!praf) praf = requestAnimationFrame(paintProg); };
      addEventListener('scroll', onProg, { passive: true }); addEventListener('resize', onProg); paintProg();
      /* the section bar opens exactly as wide as the name needs, so the tabs glide over instead of stalling */
      const lead = $('.rp-nav-lead', el), sizeLead = () => { const id = $('.rp-nav-id', lead); lead.style.setProperty('--lead-w', (40 + 12 + id.scrollWidth) + 'px'); };
      sizeLead(); document.fonts && document.fonts.ready.then(sizeLead); addEventListener('resize', sizeLead);
      /* the restaurant's own bar takes over from the site header once the hero has gone */
      const vid = $('.rp-vid', el);
      let stuck = null;
      const ho = new IntersectionObserver(([en]) => {
        const past = !en.isIntersecting; if (past === stuck) return; stuck = past;
        hdr.classList.toggle('hide', past); navEl.classList.toggle('stuck', past);
        /* the hero film only plays while you can see it, so scrolling the rest of the page stays smooth */
        if (vid && vid.classList.contains('on')) past ? vid.pause() : vid.play().catch(() => { });
        heroEl.classList.toggle('paused', past);
      }, { rootMargin: '-64px 0px 0px 0px' });
      ho.observe(heroEl);
      /* hero: crossfading photos, then the film if the connection allows */
      const slides = $$('.rp-slide', el), dots = $$('.rp-dots i', el); let si = 0, timer;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const conn = navigator.connection || {};
      if (vid && !reduce && !conn.saveData && !/2g|3g/.test(conn.effectiveType || '')) {
        setTimeout(() => { if (!vid.isConnected) return; vid.src = r.film.src; vid.play().then(() => { vid.classList.add('on'); clearInterval(timer); }).catch(() => { }); }, 900);
      }
      if (slides.length > 1 && !reduce) timer = setInterval(() => { slides[si].classList.remove('on'); dots[si] && dots[si].classList.remove('on'); si = (si + 1) % slides.length; slides[si].classList.add('on'); dots[si] && dots[si].classList.add('on'); }, 5200);
      /* section spy, with a sliding underline */
      const tabs = $$('.rp-tabs a', el), ink = $('.rp-ink', el);
      const moveInk = a => { if (!a) { ink.style.opacity = 0; return; } ink.style.opacity = 1; ink.style.transform = `translateX(${a.offsetLeft + 13}px) scaleX(${(a.offsetWidth - 26) / 100})`; };
      const so = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { let cur = null; tabs.forEach(a => { const on = a.dataset.jump === en.target.id; a.classList.toggle('on', on); if (on) cur = a; }); moveInk(cur); if (cur) { const strip = cur.parentNode, x = cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2; if (Math.abs(strip.scrollLeft - x) > 4) strip.scrollTo({ left: x, behavior: 'smooth' }); } } }), { rootMargin: '-45% 0px -50% 0px' });
      $$('section[id]', el).forEach(s => so.observe(s));
      /* menu category chips follow the scroll */
      const mchips = $$('[data-mcat]', el);
      const mo = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) mchips.forEach(c => { const on = c.dataset.mcat === en.target.dataset.cat; c.classList.toggle('on', on); if (on) c.parentNode.scrollTo({ left: c.offsetLeft - 24, behavior: 'smooth' }); }); }), { rootMargin: '-40% 0px -55% 0px' });
      $$('.mgroup', el).forEach(g => mo.observe(g));
      /* the chip bar gets a shadow once it sticks */
      const mc = $('.mcats', el), sentinel = document.createElement('i'); sentinel.className = 'mcats-s'; mc.before(sentinel);
      const mso = new IntersectionObserver(([en]) => mc.classList.toggle('stuck', !en.isIntersecting && en.boundingClientRect.top < 200), { rootMargin: '-125px 0px 0px 0px' }); mso.observe(sentinel);
      /* inline 360 and the map wake up when they scroll into view */
      const pano = $('.rp-pano', el); let pv = null, room = r.hasTour ? r.tour[0] : null;
      const po = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        if (en.target === pano && !pv) { pv = K.inlinePano(pano, room.pano, { yaw: room.yaw, pitch: -3, fov: matchMedia('(max-width:700px)').matches ? 90 : 76, auto: 3, hi: true, onReady: () => $('.rp-pano-poster', el).classList.add('gone'), onUser: () => pano.classList.add('touched') }); if (pv) $('canvas', pano).style.touchAction = 'pan-y'; }
        if (en.target.tagName === 'IFRAME' && !en.target.src) { en.target.src = en.target.dataset.src; en.target.onload = () => en.target.closest('.vmap').classList.add('ready'); po.unobserve(en.target); }
      }), { rootMargin: '300px 0px' });
      if (pano) po.observe(pano);
      const mapF = $('.vmap iframe', el); if (mapF) po.observe(mapF);
      K.onLeave(() => { K._house = null; root.classList.remove('rp-noscroll'); prog.remove(); cancelAnimationFrame(praf); removeEventListener('scroll', onProg); removeEventListener('resize', onProg); removeEventListener('resize', sizeLead); ho.disconnect(); so.disconnect(); mo.disconnect(); mso.disconnect(); po.disconnect(); clearInterval(timer); hdr.classList.remove('hide'); document.body.classList.remove('rp-mode'); K._ctxR = null; if (vid) { vid.pause(); vid.removeAttribute('src'); } });

      el.addEventListener('click', e => {
        const j = e.target.closest('[data-jump]'); if (j) { e.preventDefault(); const s = $('#' + j.dataset.jump, el); s && s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); return; }
        if (e.target.closest('[data-back]')) { if (K._navCount > 1) history.back(); else K.go('/'); return; }
        if (e.target.closest('[data-share]')) { const url = location.href; if (navigator.share) navigator.share({ title: L(r.name), text: L(r.tagline), url }).catch(() => { }); else navigator.clipboard && navigator.clipboard.writeText(url).then(() => K.toast(t('link_copied'), 'share-network')); return; }
        const mcb = e.target.closest('[data-mcat]'); if (mcb) { const g = $('#mc-' + mcb.dataset.mcat, el); g && g.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); return; }
        const ir = e.target.closest('[data-iroom]'); if (ir && pv) { room = r.tour.find(x => x.id === ir.dataset.iroom); $$('[data-iroom]', el).forEach(b => b.classList.toggle('on', b === ir)); pv.load(room.pano, { fade: true, zoom: true, yaw: room.yaw, hi: true }); $('.rp-pano-full', el).dataset.tour = `${r.id}|${room.id}`; return; }
        const pt = e.target.closest('[data-ptab]'); if (pt) { photoTab = pt.dataset.ptab; $$('[data-ptab]', el).forEach(b => b.classList.toggle('on', b === pt)); const g = $('.pg', el), n = (r.gallery[photoTab] || []).length; g.dataset.n = n >= 5 ? 5 : n >= 3 ? 3 : n; g.classList.add('swap'); setTimeout(() => { g.innerHTML = photosGrid(r); g.classList.remove('swap'); }, 160); return; }
        const ph = e.target.closest('[data-photos]'); if (ph) { const c = ph.dataset.photos; const list = c === 'all' ? Object.values(r.gallery).flat() : (c === 'kitchen' && r.kitchen && !(r.gallery.kitchen || []).length ? r.kitchen.photos : r.gallery[c]); K.lightbox.open(list, Number(ph.dataset.i || 0), L(r.name)); return; }
        const rf = e.target.closest('[data-rvf]'); if (rf) { rvFilter = rf.dataset.rvf; $$('[data-rvf]', el).forEach(b => b.classList.toggle('on', b === rf)); const l = $('.rv-list', el); l.innerHTML = revList(r); $$('[data-rv]', l).forEach(x => x.classList.add('in')); return; }
        if (e.target.closest('[data-write]')) { writeReview(r, el); return; }
        if (e.target.closest('[data-qrmenu]')) { qrSheet(r); return; }
      });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.mi')) e.target.click(); });
      /* menu search */
      const ms = $('.msearch input', el);
      ms && ms.addEventListener('input', () => {
        const v = K.norm(ms.value); let shown = 0;
        $$('.mi', el).forEach(m => { const ok = !v || m.dataset.name.includes(v); m.hidden = !ok; if (ok) shown++; });
        $$('.mgroup', el).forEach(g => g.hidden = !$$('.mi:not([hidden])', g).length);
        $('.mnone', el).hidden = shown > 0;
      });
      /* deep links */
      const go = q.get('go'), open = q.get('open'), dish = q.get('dish');
      if (go) setTimeout(() => { const s = $('#' + go, el); s && s.scrollIntoView({ behavior: 'auto', block: 'start' }); }, 80);
      if (dish) setTimeout(() => K.openDish(id, dish, q.get('tab')), 260);
      if (open === 'tour') setTimeout(() => K.tour.open(id), 200);
      if (open === 'film') setTimeout(() => K.openFilm(id), 200);
      if (open === 'bill') setTimeout(() => K.bill.open(id), 200);
      if (open === 'review') setTimeout(() => writeReview(r, el), 300);
      if (dish || open || go) history.replaceState(history.state, '', `#/r/${id}`);
    }
  };
})();
