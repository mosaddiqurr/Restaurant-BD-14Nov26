/* Dish sheet: photo, film or 3D; price with VAT; six-month price line; the same dish at other places.
   Opened from a restaurant's own page or QR table menu (K._house) it stays about that restaurant only:
   no other places, no 'lowest' badge, no price history, and more of its own dishes instead. */
(function () {
  const K = window.K, D = K.data, t = K.t, L = K.L, ico = K.ico, $ = K.$, $$ = K.$$;
  const MONTHS = { en: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'], bn: ['জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে'] };

  function spark(d) {
    const h = K.priceHist(d), lo = Math.min(...h), hi = Math.max(...h), W = 300, H = 64, pad = 8;
    const y = v => hi === lo ? H / 2 : H - pad - (v - lo) / (hi - lo) * (H - pad * 2);
    const pts = h.map((v, i) => [pad + i * (W - pad * 2) / (h.length - 1), y(v)]);
    const diff = h[h.length - 1] - h[0];
    const msg = diff === 0 ? t('price_same', { m: MONTHS[K.S.lang === 'bn' ? 'bn' : 'en'][0] }) : diff > 0 ? t('price_up', { v: K.tk(diff), m: MONTHS[K.S.lang === 'bn' ? 'bn' : 'en'][0] }) : t('price_down', { v: K.tk(-diff), m: MONTHS[K.S.lang === 'bn' ? 'bn' : 'en'][0] });
    return `<div class="ds-hist"><div class="ds-hist-h"><b>${t('price_6m')}</b><span class="meta">${msg}</span></div>
      <svg viewBox="0 0 ${W} ${H + 18}" class="spark" role="img" aria-label="${t('price_6m')}: ${h.map(K.tk).join(', ')}">
        <path d="M${pts.map(p => p.join(',')).join(' L')}" fill="none" stroke="var(--indigo)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" class="spark-l"/>
        ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 4.5 : 2.6}" fill="${i === pts.length - 1 ? 'var(--gold)' : 'var(--indigo)'}"/>`).join('')}
        ${pts.map((p, i) => `<text x="${p[0]}" y="${H + 14}" text-anchor="middle">${MONTHS[K.S.lang === 'bn' ? 'bn' : 'en'][i]}</text>`).join('')}
      </svg></div>`;
  }

  /* how it is made, what is in it, how hot it is, what comes with it: the dish's own words first, then its type's */
  const SWEET = ['tea', 'bakery', 'dessert', 'drink'];
  function about(d) {
    const ty = D.types[d.type] || {}, made = d.made || ty.made, ing = d.ing || ty.ing, side = d.side || ty.side;
    const showSpice = d.spice > 0 || !SWEET.includes(d.type);
    const rows = [
      made ? `<div class="da-r"><dt>${t('how_made')}</dt><dd>${K.esc(L(made))}</dd></div>` : '',
      ing ? `<div class="da-r"><dt>${t('main_ing')}</dt><dd><ul class="da-ing">${ing.map(x => `<li>${K.esc(L(x))}</li>`).join('')}</ul></dd></div>` : '',
      showSpice ? `<div class="da-r"><dt>${t('spice_lvl')}</dt><dd class="da-sp"><span class="da-heat h${d.spice}" aria-hidden="true"><i></i><i></i><i></i></span>${t('spice_note_' + d.spice)}</dd></div>` : '',
      side ? `<div class="da-r"><dt>${t('served_with')}</dt><dd>${K.esc(L(side))}</dd></div>` : ''
    ].join('');
    return rows ? `<section class="ds-about"><h3>${t('about_dish')}</h3><dl>${rows}</dl></section>` : '';
  }

  function body(rid, did, tab) {
    const r = K.r(rid), d = K.dish(rid, did);
    const tabs = [['photo', ico('image', 'sm') + t('photo')]];
    if (d.video) tabs.push(['video', ico('play-fill', 'sm') + t('video')]);
    if (d.d3) tabs.push(['d3', ico('cube', 'sm') + '3D']);
    if (!tabs.find(x => x[0] === tab)) tab = 'photo';
    const allin = K.allIn(r, d.price);
    const others = K.allDishes.filter(x => x.type === d.type && !x.share).sort((a, b) => a.price - b.price);
    const house = K._house === rid;
    const lowest = house ? null : others[0];
    const rest = house ? [] : others.filter(x => x !== d).slice(0, 5);
    const more = house ? [...r.signature.map(x => r.menu.find(m => m.id === x)), ...r.menu.filter(m => m.best)].filter((m, i, a) => m && m !== d && a.indexOf(m) === i).slice(0, 4) : [];
    const revs = D.reviews.filter(v => v.r === rid && v.ord.some(o => o.toLowerCase() === d.name.en.toLowerCase()));
    const other = K.S.lang === 'bn' ? d.name.en : d.name.bn;
    const tags = [d.veg ? `<span class="badge b-green">${ico('leaf', 'sm')}${t('veg')}</span>` : '', d.best ? `<span class="badge b-indigo">${t('best_seller')}</span>` : '', d.share ? `<span class="badge b-soft">${ico('users-three', 'sm')}${t('for_n', { n: K.n(d.share) })}</span>` : ''].join('');
    return `<div class="ds" style="--r-accent:${r.theme.accent};--r-deep:${r.theme.deep}">
      <div class="ds-media">
        <div class="ds-stage" data-stage="${tab}"></div>
        ${tabs.length > 1 ? `<div class="seg dark ds-tabs" role="tablist">${tabs.map(([id, l]) => `<button role="tab" class="${id === tab ? 'on' : ''}" data-dtab="${id}">${l}</button>`).join('')}</div>` : ''}
        <button class="ibtn glass ds-x" data-close aria-label="${t('close')}">${ico('x')}</button>
      </div>
      <div class="ds-info">
        <${house ? 'div' : 'a'} class="ds-r" ${house ? '' : `href="#/r/${r.id}"`}><span class="mono" style="background:${r.theme.deep};color:${r.theme.accent}">${r.mono}</span><span><b>${K.esc(L(r.name))}</b><span class="meta">${K.where(r)}</span></span>${house ? '' : ico('caret-right', 'sm') + '</a>'}${house ? '</div>' : ''}
        <h2 class="ds-name">${K.esc(L(d.name))}</h2>
        <p class="ds-alt">${K.esc(other)}</p>
        <div class="ds-meta"><span>${K.esc(L(d.por))}</span>${d.spice ? `<span>${K.spice(d.spice)} ${t('spice_' + d.spice)}</span>` : ''}${tags}</div>
        ${d.desc ? `<p class="ds-desc">${K.esc(L(d.desc))}</p>` : ''}
        <div class="ds-buy">
          <div><div class="price ds-price num">${K.tk(d.price)}</div><div class="meta">${t('allin_line', { v: K.tk(allin), vat: K.n(r.vat), s: K.n(r.service) })}</div></div>
          ${K.addBtn(r.id, d.id, true)}
        </div>
        <div class="ds-fresh"><span class="fresh">${K.checked(r.checked)}</span>${lowest && lowest.id === d.id ? `<span class="badge b-green">${t('lowest_in', { d: L(D.types[d.type]).toLowerCase() })}</span>` : ''}</div>
        ${about(d)}
        ${house ? '' : spark(d)}
        ${more.length ? `<div class="ds-cmp"><h3>${t('also_here')}</h3>${more.map(x => `<button class="ds-row" data-other="${r.id}|${x.id}">${K.ph(x.p, { w: 120, word: L(x.name) })}<span><b>${K.esc(L(x.name))}</b><span class="meta">${K.esc(L(x.por))}</span></span><span class="price num">${K.tk(x.price)}</span></button>`).join('')}</div>` : ''}
        ${rest.length ? `<div class="ds-cmp"><h3>${t('same_dish_else', { d: L(D.types[d.type]).toLowerCase() })}</h3>${rest.map(x => { const xr = K.r(x.r); return `<button class="ds-row" data-other="${xr.id}|${x.id}">${K.ph(x.p, { w: 120, word: L(x.name) })}<span><b>${K.esc(L(x.name))}</b><span class="meta">${K.esc(L(xr.name))} · ${L(K.areaOf(xr.area))}</span></span><span class="price num ${x === lowest ? 'gold' : ''}">${K.tk(x.price)}${x === lowest ? `<em class="badge b-green">${t('lowest')}</em>` : ''}</span></button>`; }).join('')}</div>` : ''}
        ${revs.length ? `<div class="ds-rev"><h3>${t('people_said')}</h3>${revs.slice(0, 2).map(v => `<blockquote><p>${K.esc(v.t)}</p><footer>${K.esc(v.who)} · ${'★'.repeat(v.st)}${v.vf ? ` · <span class="vf">${ico('seal-check-fill', 'sm')}${t('verified')}</span>` : ''}</footer></blockquote>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  function stage(el, rid, did, tab) {
    const d = K.dish(rid, did), st = $('.ds-stage', el);
    st.dataset.stage = tab;
    $$('[data-dtab]', el).forEach(b => b.classList.toggle('on', b.dataset.dtab === tab));
    if (tab === 'video') { st.innerHTML = `<video autoplay muted loop playsinline poster="${K.src(d.p, 1000)}" src="${d.video}"></video><span class="ds-note">${ico('video-camera', 'sm')}${t('dish_video_note')}</span>`; return; }
    if (tab === 'd3') { st.innerHTML = '<div class="ds-3d"></div>'; K.d3.mount($('.ds-3d', st), d.d3, { alt: L(d.name) }); st.insertAdjacentHTML('beforeend', `<span class="ds-note">${ico('hand-grabbing', 'sm')}${t('d3_hint')}</span>`); return; }
    st.innerHTML = d.p ? K.ph(d.p, { w: 1100, eager: true, alt: L(d.name) }) : `<div class="ds-nophoto">${K.ph(null, { word: L(d.name) })}<span>${t('photo_soon')}</span></div>`;
  }

  K.openDish = (rid, did, tab) => {
    const d = K.dish(rid, did); if (!d) return;
    tab = tab || K._dishTab || 'photo'; K._dishTab = null;
    K.sheet.open({
      kind: 'dish', cls: 'modal dish-sheet', grab: true, label: L(d.name),
      html: `<div class="sheet-b ds-scroll">${body(rid, did, tab)}</div>`,
      onOpen: el => {
        let cur = { rid, did };
        const paint = (r2, d2, tb) => { cur = { rid: r2, did: d2 }; const sc = $('.ds-scroll', el); sc.innerHTML = body(r2, d2, tb); sc.scrollTop = 0; stage(el, r2, d2, tb || 'photo'); };
        stage(el, rid, did, $('.ds-stage', el).dataset.stage);
        el.addEventListener('click', e => {
          const tb = e.target.closest('[data-dtab]'); if (tb) { stage(el, cur.rid, cur.did, tb.dataset.dtab); return; }
          const o = e.target.closest('[data-other]'); if (o) { const [a, b] = o.dataset.other.split('|'); paint(a, b, 'photo'); }
        });
      },
      onClose: el => { const v = $('video', el); v && v.pause(); }
    });
  };
})();
