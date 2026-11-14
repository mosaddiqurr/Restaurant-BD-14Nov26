/* QR table menu: what a diner sees after scanning the card on the table.
   Light on purpose: one small header photo, small dish photos, works on slow connections. No login. */
(function () {
  const K = window.K, t = K.t, L = K.L, ico = K.ico, $ = K.$, $$ = K.$$;

  function item(r, d) {
    return `<article class="tm-i" data-dish="${r.id}|${d.id}" data-name="${K.esc((d.name.en + ' ' + d.name.bn).toLowerCase())}" tabindex="0">
      <div class="tm-t"><b>${K.esc(L(d.name))}${d.best ? `<span class="tm-best">${t('best_seller')}</span>` : ''}</b><span class="tm-alt">${K.esc(K.S.lang === 'bn' ? d.name.en : d.name.bn)}</span><span class="tm-por">${K.esc(L(d.por))}${d.spice ? ' · ' + K.spice(d.spice) : ''}${d.veg ? ` · <span class="veg">${t('veg')}</span>` : ''}</span><span class="tm-price num">${K.tk(d.price)}</span></div>
      <div class="tm-r">${d.p ? `<span class="tm-ph">${K.img(d.p, { w: 200, alt: '' })}</span>` : ''}${K.addBtn(r.id, d.id)}</div>
    </article>`;
  }

  K.views.table = {
    chrome: { tabbar: false, footer: false, bare: true, tab: 'restaurants' },
    title: p => `${L(K.r(p[0]).name)} · ${t('menu')}`,
    render: ([id], q) => {
      const r = K.r(id), tbl = (q.get('table') || '').replace(/\D/g, '').slice(0, 3), os = K.openState(r);
      const pop = r.signature.map(x => r.menu.find(d => d.id === x)).filter(d => d && d.p).slice(0, 6);
      return `<div class="tm" data-font="${r.theme.font}" style="--r-accent:${r.theme.accent};--r-deep:${r.theme.deep};--r-on:${r.theme.deep}">
        <header class="tm-h">
          <div class="tm-bg" aria-hidden="true">${K.img(r.hero[0], { w: 900, eager: true, alt: '' })}</div>
          <div class="tm-w tm-h-in">
            <div class="tm-top">${K.mono(r)}<span class="sp"></span><button class="tm-lang" data-act="lang">${K.S.lang === 'bn' ? 'EN' : 'বাংলা'}</button></div>
            ${tbl ? `<p class="tm-wel">${t('tm_welcome')}<span class="tm-tbl">${t('table_n', { n: K.dg(tbl) })}</span></p>` : ''}
            <h1 class="tm-name rp-display">${K.esc(L(r.name))}</h1>
            <p class="tm-sub">${L(K.areaOf(r.area))} · <span class="${os.open ? 'open-now' : 'closed'}">${os.open ? t('open_now') : t('closed_now')}</span> · ${os.from} ${t('to')} ${os.close}</p>
            <label class="tm-q">${ico('magnifying-glass', 'sm')}<input type="search" placeholder="${t('search_menu')}" aria-label="${t('search_menu')}"></label>
          </div>
        </header>
        <nav class="tm-cats" aria-label="${t('menu')}"><div class="tm-w"><div class="chips scroll">${r.cats.map((c, i) => `<button class="chip sm ${i ? '' : 'on'}" data-tcat="${c.id}">${L(c)}</button>`).join('')}</div></div></nav>
        <main class="tm-w tm-body">
          <p class="tm-note">${ico('receipt', 'sm')}<span>${t('tm_note', { v: K.n(r.vat), s: K.n(r.service) })}</span></p>
          ${pop.length ? `<section class="tm-pop"><h2 class="rp-display">${t('tm_popular')}</h2><div class="tm-pop-r">${pop.map(d => `<article class="tm-pc" data-dish="${r.id}|${d.id}" tabindex="0"><span class="tm-pc-ph">${K.img(d.p, { w: 320, alt: '' })}</span><b>${K.esc(L(d.name))}</b><span class="tm-pc-p"><span class="num">${K.tk(d.price)}</span>${K.addBtn(r.id, d.id)}</span></article>`).join('')}</div></section>` : ''}
          ${r.cats.map(c => { const ds = r.menu.filter(d => d.cat === c.id); return `<section class="tm-g" id="tc-${c.id}" data-cat="${c.id}"><h2 class="rp-display">${L(c)}<span>${t('tm_items', { n: K.n(ds.length) })}</span></h2>${ds.map(d => item(r, d)).join('')}</section>`; }).join('')}
          <p class="tm-none meta" hidden>${t('menu_none')}</p>
          <div class="tm-end">
            <a class="tm-card" href="#/r/${r.id}?open=review">${ico('star-fill')}<span><b>${t('tm_rate')}</b><span>${t('tm_rate_sub')}</span></span>${ico('caret-right', 'sm')}</a>
            <a class="tm-card" href="#/r/${r.id}">${ico('storefront')}<span><b>${t('tm_full')}</b><span>${t('tm_full_sub')}</span></span>${ico('caret-right', 'sm')}</a>
            <p class="meta tm-by">${t('tm_by', { b: K.BRAND })}</p>
          </div>
        </main>
      </div>`;
    },
    mount(el, [id]) {
      K._ctxR = id; K._house = id;
      const chips = $$('[data-tcat]', el);
      const mo = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) chips.forEach(c => { const on = c.dataset.tcat === en.target.dataset.cat; c.classList.toggle('on', on); if (on) c.parentNode.scrollTo({ left: c.offsetLeft - 16, behavior: 'smooth' }); }); }), { rootMargin: '-35% 0px -60% 0px' });
      $$('.tm-g', el).forEach(g => mo.observe(g));
      K.onLeave(() => { mo.disconnect(); K._ctxR = null; K._house = null; });
      el.addEventListener('click', e => { const c = e.target.closest('[data-tcat]'); if (c) { const g = $('#tc-' + c.dataset.tcat, el); g && g.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.tm-i, .tm-pc')) e.target.click(); });
      const qi = $('.tm-q input', el), pop = $('.tm-pop', el);
      qi.addEventListener('input', () => { const v = K.norm(qi.value); let n = 0; if (pop) pop.hidden = !!v; $$('.tm-i', el).forEach(m => { const ok = !v || m.dataset.name.includes(v); m.hidden = !ok; if (ok) n++; }); $$('.tm-g', el).forEach(g => g.hidden = !$$('.tm-i:not([hidden])', g).length); $('.tm-none', el).hidden = n > 0; });
    }
  };
})();
