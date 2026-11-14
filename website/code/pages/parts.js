/* Shared building blocks used by several pages */
(function () {
  const K = window.K, D = K.data, t = K.t, L = K.L, ico = K.ico;

  K.cuName = id => L(D.cuisines.find(c => c.id === id) || {});
  K.spice = n => n ? `<span class="spice" aria-label="${t('spice_' + n)}" title="${t('spice_' + n)}">${ico('pepper', 'sm').repeat(n)}</span>` : '';
  K.mediaLine = r => [r.hasTour ? `<span>${ico('virtual-reality', 'sm')}360°</span>` : '', r.hasFilm ? `<span>${ico('play', 'sm')}${t('film')}</span>` : '', r.has3d ? `<span>${ico('cube', 'sm')}3D</span>` : ''].join('');
  K.mediaBadges = K.mediaLine;

  /* a restaurant's mark: monogram in its own colours */
  K.mono = (r, cls = '') => `<span class="mono ${cls}" style="--r-deep:${r.theme.deep};--r-accent:${r.theme.accent}" aria-hidden="true">${r.mono}</span>`;
  /* logo lockup for the partner strip: mark plus the name set in the restaurant's own type */
  K.lockup = r => `<a class="lk" href="#/r/${r.id}" data-font="${r.theme.font}" aria-label="${K.esc(L(r.name))}">${K.mono(r)}<span class="lk-n">${K.esc(r.name.en)}</span></a>`;

  /* picture for a dish category: its own photo, else any dish of that kind that has one */
  K.typePic = id => { const ty = D.types[id]; if (ty && ty.p) return ty.p; const d = K.allDishes.find(x => x.type === id && x.p); return d ? d.p : null; };
  K.typeStats = id => { const all = K.allDishes.filter(d => d.type === id), solo = all.filter(d => !d.share), ds = solo.length ? solo : all; const pr = ds.map(d => d.price); return { n: all.length, places: new Set(all.map(d => d.r)).size, lo: pr.length ? Math.min(...pr) : 0, hi: pr.length ? Math.max(...pr) : 0 }; };

  K.rcard = (r, o = {}) => {
    const os = K.openState(r);
    const second = r.hero[1] || r.gallery.inside[1];
    return `<a class="rc ${o.w ? 'w' : ''}" href="#/r/${r.id}" data-vt="${r.id}" ${o.rv ? 'data-rv' : ''} style="--vtn:rc-${r.id};--d:${o.i || 0}">
      <div class="rc-media">${K.ph(r.hero[0], { w: o.w ? 680 : 760, alt: L(r.name) })}${second ? `<div class="rc-alt">${K.img(second, { w: o.w ? 680 : 760, alt: '' })}</div>` : ''}</div>
      <div class="rc-b">
        <div class="rc-id">${K.mono(r)}<span class="rc-tt"><b class="rc-n">${K.esc(L(r.name))}${r.founding ? `<span class="rc-seal" title="${t('founding')}">${ico('seal-check-fill', 'sm')}</span>` : ''}</b><span class="rc-l">${L(K.areaOf(r.area))}, ${r.cuisines.slice(0, 2).map(K.cuName).join(', ')}</span></span><span class="rc-st">${ico('star-fill', 'sm')}<b class="num">${K.n(r.rating)}</b></span></div>
        <div class="rc-f"><span class="num"><b>${K.ppRange(r)}</b> ${t('pp_short')}</span><span class="${os.open ? 'open-now' : 'closed'}">${os.label}</span></div>
        <div class="rc-x">${r.featured ? `<span class="rc-feat">${t('featured')}</span>` : ''}${K.mediaLine(r)}</div>
      </div></a>`;
  };

  K.dcard = (d, o = {}) => {
    const r = K.r(d.r);
    return `<a class="dc ${o.w ? 'w' : ''}" href="#/r/${r.id}?dish=${d.id}" data-dish="${r.id}|${d.id}" ${o.rv ? 'data-rv' : ''} style="--vtn:dc-${r.id}-${d.id};--d:${o.i || 0}">
      ${K.ph(d.p, { w: o.w ? 420 : 480, alt: L(d.name), word: L(d.name), tone: r.theme, icon: (D.types[d.type] || {}).i })}
      <div class="nm">${K.esc(L(d.name))}</div>
      <div class="rs">${o.noR ? K.esc(L(d.por)) : `${K.esc(L(r.name))}, ${L(K.areaOf(r.area))}`}</div>
      <div class="pr"><span class="price">${K.tk(d.price)}</span>${o.lowest ? `<span class="dc-low">${t('lowest')}</span>` : ''}${d.d3 ? `<span class="dc-m">${ico('cube', 'sm')}3D</span>` : d.video ? `<span class="dc-m">${ico('play', 'sm')}</span>` : ''}</div>
    </a>`;
  };
})();
