/* khabo panels: printable menus.
   The restaurant picks one of the designs in PN.MENUS; it is filled from their real menu, so paper always matches khabo.
   The look of each design lives in print-menu.css (.pm-<id>). To add a design: add a line here and a CSS block there.
   Dish photos are an option on every design (o.pics): none, beside each dish, photo cards, big photos in the corners,
   or a strip down the side. The photo designs simply start with one of those switched on. */
(function () {
  'use strict';
  const PN = window.PN, $ = PN.$, $$ = PN.$$, ico = PN.ico, esc = PN.esc, L = PN.L;

  PN.MENUS = [
    { id: 'plates', name: 'Round plates', note: 'Big round dish photos at the corners', pics: 'corner', ph: 1 },
    { id: 'cards', name: 'Photo cards', note: 'Each dish with its photo above the name', pics: 'card', ph: 1 },
    { id: 'board', name: 'Board', note: 'Dark board, a round photo beside each dish', pics: 'side', ph: 1 },
    { id: 'star', name: 'Star dish', note: 'Your best dish big on top, small photos below', pics: 'side', ph: 1 },
    { id: 'strip', name: 'Photo strip', note: 'A column of dish photos down the right side', pics: 'strip', ph: 1 },
    { id: 'split', name: 'Half photo', note: 'Photos fill the left side, menu on the right', pics: 'strip', ph: 1 },
    { id: 'classic', name: 'Classic', note: 'Ivory paper, centred serif, dotted lines to the price' },
    { id: 'bistro', name: 'Bistro', note: 'Black and white, big title, framed, two columns' },
    { id: 'modern', name: 'Modern', note: 'Clean sans, your own colour, fine lines' },
    { id: 'night', name: 'Night', note: 'Your deep colour with your accent, for dinner places' },
    { id: 'heritage', name: 'Heritage', note: 'Bangla first, double frame, warm paper' },
    { id: 'cafe', name: 'Café', note: 'Friendly and light, two columns' },
    { id: 'editorial', name: 'Editorial', note: 'Magazine style with numbered sections' },
    { id: 'minimal', name: 'Minimal', note: 'Quiet and centred, fine-dining feel' },
    { id: 'photo-t', name: 'Cover photo', note: 'Your cover photo across the top' },
    { id: 'deco', name: 'Deco', note: 'Ivory and gold, art deco frame' },
    { id: 'kitchen', name: 'Kitchen', note: 'Bold street-food board, marigold header' },
    { id: 'bilingual', name: 'Two languages', note: 'English left, Bangla right, price between' }
  ];
  const PICS = [['none', 'No photos'], ['side', 'Beside each dish'], ['card', 'Photo cards'], ['corner', 'Big photos at the corners'], ['strip', 'Photo strip']];
  /* pick: dishes whose photo is used (null = every dish that has one). hide: dishes left off the paper.
     title / tag / note: the owner's own words (empty = use the restaurant's name, tagline, no note). */
  const DEF = { look: 'classic', lang: 'both', desc: true, qr: true, size: 'a4', bw: false, cats: null, pics: 'none', pick: null, hide: [], title: '', tag: '', note: '' };
  const BD = '০১২৩৪৫৬৭৮৯', bnNum = s => String(s).replace(/\d/g, d => BD[d]);
  const opts = r => Object.assign({}, DEF, r.printMenu);
  const siteUrl = r => new URL(`../index.html#/r/${r.id}`, location.href).href;
  const qrSvg = r => { try { return window.qrcode ? K.qrSvg(siteUrl(r), K.qrStyle(r)) : ''; } catch (e) { return ''; } };

  /* which dishes get a photo, best first: signature dishes, then the rest of the menu */
  const photoDishes = (r, o) => {
    const sig = r.signature || [], hide = o.hide || [];
    return r.menu.filter(d => d.p && !hide.includes(d.id) && (!o.pick || o.pick.includes(d.id)))
      .sort((a, b) => (sig.includes(a.id) ? sig.indexOf(a.id) : 99) - (sig.includes(b.id) ? sig.indexOf(b.id) : 99));
  };
  PN.photoDishes = photoDishes;

  /* one menu page as HTML. o = { look, lang: both|en|bn, desc, qr, pics, pick, hide, title, tag, note } */
  PN.menuHtml = (r, o) => {
    o = Object.assign({}, DEF, o);
    const bnFirst = o.lang === 'bn', price = v => o.lang === 'bn' ? bnNum(PN.n(v)) : PN.n(v);
    const bnMain = bnFirst || (o.look === 'heritage' && o.lang === 'both');
    const nm = x => bnMain ? x.bn || x.en : x.en, alt = x => o.lang === 'both' ? (bnMain ? x.en : (x.bn && x.bn !== x.en ? x.bn : '')) : '';
    const area = PN.area(r.area), hide = o.hide || [];
    const cats = r.cats.map((c, i) => ({ c, i, ds: r.menu.filter(d => d.cat === c.id && !hide.includes(d.id)) })).filter(x => x.ds.length && (!o.cats || !o.cats.length || o.cats.includes(x.c.id)));
    const note = bnFirst ? `দাম টাকায়, ভ্যাট ${bnNum(r.vat)}% ও সার্ভিস ${bnNum(r.service)}% ছাড়া।` : `Prices in taka, before VAT ${r.vat}% and service charge ${r.service}%.`;
    const pics = o.pics || 'none', withPic = photoDishes(r, o), has = new Set(withPic.map(d => d.id));
    const img = (d, w, cls = '') => `<img class="${cls}" src="${PN.src(d.p, w)}" alt="">`;
    const title = o.title || (bnFirst ? r.name.bn : r.name.en), tag = o.tag || (r.tagline ? (bnFirst ? r.tagline.bn : r.tagline.en) : '');
    /* big decorative photos for the corner, strip and star layouts */
    const deco = pics === 'corner' ? `<div class="pm-corner" aria-hidden="true">${withPic.slice(0, 2).map((d, i) => `<span class="pm-c${i}">${img(d, 900)}</span>`).join('')}</div>`
      : pics === 'strip' ? `<aside class="pm-photos" aria-hidden="true">${withPic.slice(0, o.look === 'split' ? 3 : 4).map(d => `<figure>${img(d, 700)}<figcaption>${esc(nm(d.name))}</figcaption></figure>`).join('')}</aside>` : '';
    const star = o.look === 'star' && withPic[0] ? `<div class="pm-hero">${img(withPic[0], 1400)}<div><span>${bnFirst ? 'আমাদের সেরা' : 'House favourite'}</span><b>${esc(nm(withPic[0].name))}</b><em>৳${price(withPic[0].price)}</em></div></div>` : '';
    const item = d => {
      const desc = o.desc ? (bnFirst ? (d.desc && d.desc.bn) || d.por.bn : L(d.desc) || L(d.por)) : '';
      const a = alt(d.name) || (o.look === 'bilingual' && !bnFirst ? d.name.bn : '');
      const pic = (pics === 'side' || pics === 'card') && has.has(d.id) ? img(d, pics === 'card' ? 600 : 240, 'pm-pic') : '';
      return `<li class="pm-i ${pic ? 'has-pic' : ''}">${pic}<div class="pm-tx"><div class="pm-row"><b class="pm-nm ${bnMain ? 'bn' : ''}">${esc(nm(d.name))}</b><span class="pm-dots"></span><span class="pm-p ${bnFirst ? 'bn' : ''}">${price(d.price)}</span></div>${a ? `<span class="pm-alt ${bnMain ? '' : 'bn'}">${esc(a)}</span>` : ''}${desc ? `<span class="pm-d ${bnFirst ? 'bn' : ''}">${esc(desc)}</span>` : ''}</div></li>`;
    };
    /* photo cards: dishes with a photo become cards, the rest stay as a plain list under them */
    const list = ds => pics === 'card'
      ? `${ds.some(d => has.has(d.id)) ? `<ul class="pm-grid">${ds.filter(d => has.has(d.id)).map(item).join('')}</ul>` : ''}${ds.some(d => !has.has(d.id)) ? `<ul>${ds.filter(d => !has.has(d.id)).map(item).join('')}</ul>` : ''}`
      : `<ul>${ds.map(item).join('')}</ul>`;
    return `<article class="pm pm-${o.look} pics-${pics} ${o.bw ? 'pm-bw' : ''}" style="--d:${o.bw ? '#161616' : r.theme.deep};--a:${o.bw ? '#161616' : r.theme.accent}">
      ${deco}<div class="pm-photo">${r.hero && r.hero[0] ? `<img src="${PN.src(r.hero[0], 1400)}" alt="">` : ''}</div>
      <header class="pm-h"><p class="pm-k ${bnFirst ? 'bn' : ''}">${esc(bnFirst ? area.bn : area.en)}${r.since ? ` · ${bnFirst ? 'স্থাপিত ' + bnNum(r.since) : 'Since ' + r.since}` : ''}</p>
        <h1 class="pm-n ${bnFirst ? 'bn' : ''}">${esc(title)}</h1>${!o.title && !bnFirst && (o.lang === 'both' || o.look === 'heritage' || o.look === 'bilingual') && r.name.bn ? `<p class="pm-nb">${esc(r.name.bn)}</p>` : ''}
        ${tag ? `<p class="pm-tag ${bnFirst ? 'bn' : ''}">${esc(tag)}</p>` : ''}</header>
      ${star}
      <div class="pm-body">${cats.map(({ c, i, ds }) => `<section class="pm-cat"><h2><span class="pm-no">${String(i + 1).padStart(2, '0')}</span><span class="pm-cn ${bnFirst ? 'bn' : ''}">${esc(bnFirst ? c.bn || c.en : c.en)}</span>${o.lang === 'both' && c.bn ? `<span class="pm-calt bn">${esc(c.bn)}</span>` : ''}</h2>${list(ds)}</section>`).join('')}</div>
      <footer class="pm-f">${o.qr ? `<div class="pm-qr">${qrSvg(r)}</div>` : ''}<div>${o.qr ? `<b>${bnFirst ? 'স্ক্যান করে ছবি আর আজকের দাম দেখুন' : 'Scan for photos and today’s prices'}</b>` : ''}${o.note ? `<span class="pm-own">${esc(o.note)}</span>` : ''}<span class="${bnFirst ? 'bn' : ''}">${note}</span><span>${esc(bnFirst ? (r.address || {}).bn || L(r.address) : L(r.address))}${r.phone ? ' · ' + esc(r.phone) : ''}</span></div><div class="pm-by">khabo</div></footer>
    </article>`;
  };

  /* a long menu first shrinks a little; if it still does not fit one A4 sheet, it goes to two columns
     (photo cards and side layouts only shrink: two columns of cards would be too small to read) */
  const FIT = function (pm) {
    const body = pm && pm.querySelector(".pm-body"); if (!body) return;
    const over = () => pm.scrollHeight / pm.offsetWidth * 210 > 297.5;
    const shrink = min => { let z = 1; body.style.zoom = 1; while (over() && z > min) { z = Math.round((z - .02) * 100) / 100; body.style.zoom = z; } };
    const keep = /pics-(card|strip)/.test(pm.className);
    body.style.columns = "";
    shrink(keep ? .62 : .86);
    if (!keep && over() && getComputedStyle(body).columnCount !== "2") { body.style.columns = "2"; shrink(.72); }
  };
  PN.fitMenu = FIT;

  /* print in a clean window: only the menu, real A4 size, fonts and photos loaded first */
  const FONTS = 'https://fonts.googleapis.com/css2?family=Figtree:wght@300..800&family=Noto+Sans+Bengali:wght@400..700&family=Tiro+Bangla&family=Cormorant+Garamond:ital,wght@0,300;0,500;0,600;0,700;1,500;1,600&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Serif+Display&family=Bebas+Neue&display=swap';
  PN.FONTS = FONTS;
  PN.printMenu = (r, o, auto = true) => {
    const w = open('', '_blank'); if (!w) { PN.toast('Allow pop-ups for this page to print.', 'bad'); return; }
    const css = new URL('print-menu.css', location.href).href;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.name.en)} menu</title><link rel="stylesheet" href="${FONTS}"><link rel="stylesheet" href="${css}"><style>body{margin:0;background:#E9E9EC}@media screen{.pm{margin:24px auto;box-shadow:0 10px 40px rgba(0,0,0,.18)}}${o.size === 'a5' ? '@page{size:A5;margin:0}@media print{.pm{zoom:.7048}}' : ''}</style></head><body>${PN.menuHtml(r, o)}<script>addEventListener('load', function () { document.body.offsetHeight; (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { (${FIT.toString()})(document.querySelector('.pm')); ${auto ? 'setTimeout(function () { print(); }, 250);' : ''} }); });<\/script></body></html>`);
    w.document.close();
  };

  /* fit a real-size A4 page into a box */
  const A4 = 793.7; /* 210mm in CSS pixels */
  const fit = el => $$('[data-fit]', el).forEach(b => { const p = b.firstElementChild; if (!p || !b.clientWidth) return; p.style.zoom = 1; FIT(p); p.style.zoom = b.clientWidth / A4; });

  let pmOpen = false; /* is the dish chooser open (kept across re-renders) */
  PN.views.rest.print = ({ r }) => {
    const o = opts(r);
    const seg = (key, vals) => `<div class="seg" data-o="${key}">${vals.map(([v, l]) => `<button class="${String(o[key]) === String(v) ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const hide = o.hide || [], picked = d => d.p && (!o.pick || o.pick.includes(d.id));
    const groups = r.cats.map(c => ({ c, ds: r.menu.filter(d => d.cat === c.id) })).filter(x => x.ds.length);
    const shown = r.menu.length - hide.filter(id => r.menu.some(d => d.id === id)).length, nPic = r.menu.filter(d => !hide.includes(d.id) && picked(d)).length;
    const chooser = `<details class="pmk-dish" ${pmOpen ? 'open' : ''}><summary><span><b>Dishes and photos</b><span class="meta">${shown} of ${r.menu.length} dishes on the paper · ${nPic} with a photo</span></span>${ico('caret-down', 'sm')}</summary>
      <p class="meta">Tap a dish to leave it off the paper. The camera chooses whether its photo is used. No photo yet? Tap the camera to add one; it is saved to your menu too.</p>
      ${groups.map(({ c, ds }) => `<div class="pmk-dg"><span class="lbl">${esc(c.en)}</span>${ds.map(d => { const off = hide.includes(d.id); return `<div class="pmk-d ${off ? 'off' : ''}"><button class="pmk-dn" data-hide="${d.id}" aria-pressed="${!off}">${PN.thumb(d.p, d.name.en)}<span>${esc(d.name.en)}</span><em class="num">৳${PN.n(d.price)}</em></button><button class="pmk-cam ${d.p && picked(d) ? 'on' : ''} ${d.p ? '' : 'add'}" data-pic="${d.id}" title="${d.p ? (picked(d) ? 'Photo is used' : 'Photo not used') : 'Add a photo'}" aria-pressed="${!!(d.p && picked(d))}">${ico(d.p ? 'camera' : 'plus', 'sm')}</button></div>`; }).join('')}</div>`).join('')}
      <input type="file" accept="image/*" hidden data-up></details>`;
    return {
      title: 'Print menu', sub: 'Pick a design. It is filled from your menu on khabo, so a fresh print always has today’s dishes, prices and photos.',
      acts: `<button class="btn" data-open>${ico('arrow-up-right', 'sm')}Open full size</button><button class="btn pri" data-print>${ico('printer', 'sm')}Print</button>`,
      html: `<div class="pmk">
        <div class="pmk-main card"><div class="pmk-tools">${seg('lang', [['both', 'English + বাংলা'], ['en', 'English'], ['bn', 'বাংলা']])}${seg('desc', [['true', 'With descriptions'], ['false', 'Names only']])}${seg('qr', [['true', 'With QR code'], ['false', 'No QR']])}${seg('size', [['a4', 'A4'], ['a5', 'A5']])}${seg('bw', [['false', 'Colour'], ['true', 'Black and white']])}</div>
          <div class="pmk-pics"><span class="lbl">${ico('image', 'sm')}Dish photos</span>${seg('pics', PICS)}</div>
          <div class="pmk-cats"><span class="lbl">Sections</span>${groups.map(({ c }) => `<button class="tchip ${!o.cats || !o.cats.length || o.cats.includes(c.id) ? 'on' : ''}" data-cat="${c.id}">${esc(c.en)}</button>`).join('')}<span class="meta">Untick to print, say, a drinks-only menu.</span></div>
          <div class="pmk-words"><label><span class="lbl">Name at the top</span><input class="inp" data-w="title" maxlength="40" value="${esc(o.title)}" placeholder="${esc(r.name.en)}"></label><label><span class="lbl">Line under the name</span><input class="inp" data-w="tag" maxlength="80" value="${esc(o.tag)}" placeholder="${esc((r.tagline && r.tagline.en) || 'Leave empty to hide')}"></label><label class="full"><span class="lbl">Your note at the bottom</span><input class="inp" data-w="note" maxlength="90" value="${esc(o.note)}" placeholder="For example: Free home delivery within 2 km. Call 01700-000000"></label></div>
          ${chooser}
          <div class="pmk-big" data-fit>${PN.menuHtml(r, o)}</div></div>
        <div class="pmk-side"><h2>${PN.MENUS.length} designs</h2><p class="meta pmk-sub">The first six are made for dish photos. Every design can show photos with the Dish photos switch.</p><div class="pmk-grid">${PN.MENUS.map(m => `<button class="pmk-t ${o.look === m.id ? 'on' : ''}" data-look="${m.id}" aria-pressed="${o.look === m.id}"><span class="pmk-th" data-fit>${PN.menuHtml(r, Object.assign({}, o, { look: m.id, qr: false, pics: m.pics || (o.look === m.id ? o.pics : 'none') }))}</span><b>${m.name}${o.look === m.id ? ico('check-circle', 'sm') : ''}</b><span>${m.note}</span></button>`).join('')}</div></div>
      </div>`,
      mount: el => {
        const set = patch => { r.printMenu = Object.assign(opts(r), patch); PN.saveR(r, null); };
        requestAnimationFrame(() => fit(el));
        addEventListener('resize', () => fit(document), { passive: true });
        if (o.qr) K.qrArt($('.pmk-big .pm-qr', el), siteUrl(r), K.qrStyle(r));
        if (document.fonts) { document.fonts.ready.then(() => fit(el)); document.fonts.addEventListener('loadingdone', () => fit(el)); }
        /* photos change the height of a page, so fit again once they arrive */
        $$('.pm img', el).forEach(im => { if (!im.complete) im.addEventListener('load', () => fit(el), { once: true }); });
        setTimeout(() => fit(el), 900);
        $('.pmk-dish', el).addEventListener('toggle', e => { pmOpen = e.currentTarget.open; });
        /* a photo design turns its photo layout on; a plain design keeps whatever the owner chose */
        $$('[data-look]', el).forEach(b => b.onclick = () => { const m = PN.MENUS.find(x => x.id === b.dataset.look); set(Object.assign({ look: m.id }, m.pics ? { pics: m.pics } : {})); PN.log(r.id, `Chose the ${m.name} print menu`); PN.save(); PN.rerender(); });
        $$('[data-o]', el).forEach(s => s.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; const v = b.dataset.v; set({ [s.dataset.o]: v === 'true' ? true : v === 'false' ? false : v }); PN.rerender(); });
        $$('[data-cat]', el).forEach(b => b.onclick = () => { const all = groups.map(g => g.c.id); let cur = o.cats && o.cats.length ? o.cats.slice() : all.slice(); const i = cur.indexOf(b.dataset.cat); if (i >= 0) cur.splice(i, 1); else cur.push(b.dataset.cat); if (!cur.length) return PN.toast('Keep at least one section.', 'bad'); set({ cats: cur.length === all.length ? null : cur }); PN.rerender(); });
        /* own words: the preview follows as you type, saved a moment after you stop */
        let wt = 0;
        $$('[data-w]', el).forEach(i => i.addEventListener('input', () => { clearTimeout(wt); wt = setTimeout(() => { set({ [i.dataset.w]: i.value.trim() }); const big = $('.pmk-big', el); big.innerHTML = PN.menuHtml(r, opts(r)); if (opts(r).qr) K.qrArt($('.pm-qr', big), siteUrl(r), K.qrStyle(r)); fit(el); }, 350); }));
        $$('[data-hide]', el).forEach(b => b.onclick = () => { const id = b.dataset.hide, h = (opts(r).hide || []).slice(), i = h.indexOf(id); if (i >= 0) h.splice(i, 1); else { if (h.length >= r.menu.length - 1) return PN.toast('Keep at least one dish.', 'bad'); h.push(id); } set({ hide: h }); PN.rerender(); });
        let upFor = null; const up = $('[data-up]', el);
        $$('[data-pic]', el).forEach(b => b.onclick = () => {
          const d = r.menu.find(x => x.id === b.dataset.pic); if (!d) return;
          if (!d.p) { upFor = d; up.value = ''; up.click(); return; }
          const cur = opts(r).pick || r.menu.filter(x => x.p).map(x => x.id), i = cur.indexOf(d.id);
          if (i >= 0) cur.splice(i, 1); else cur.push(d.id);
          set({ pick: r.menu.filter(x => x.p).every(x => cur.includes(x.id)) ? null : cur }); PN.rerender();
        });
        up.onchange = async () => {
          const f = up.files && up.files[0]; if (!f || !upFor) return;
          try { upFor.p = await PN.readPhoto(f, 1200); } catch (e) { return PN.toast('That file is not a photo.', 'bad'); }
          const pk = opts(r).pick; if (pk) set({ pick: pk.concat(upFor.id) });
          PN.saveR(r, `Added a photo for ${upFor.name.en}`); PN.toast('Photo added to your menu.', 'ok'); PN.rerender();
        };
        $('[data-print]', el).onclick = () => PN.printMenu(r, opts(r));
        $('[data-open]', el).onclick = () => PN.printMenu(r, opts(r), false);
      }
    };
  };
})();
