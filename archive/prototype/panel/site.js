/* khabo panels: "Your website".
   Every restaurant's khabo page is also its own website: the QR on the table opens it, and the owner can put the
   same link on Facebook, Instagram, Google Maps and so on. This page gives them the link, the QR and the places to put it. */
(function () {
  'use strict';
  const PN = window.PN, $ = PN.$, $$ = PN.$$, ico = PN.ico, esc = PN.esc;

  /* the planned public address. The name and domain are not final yet (docs/90-decisions-needed.md) */
  PN.DOMAIN = 'khabo.com';
  PN.siteAddr = r => `${PN.DOMAIN}/${r.slug || r.id}`;
  PN.siteLink = r => new URL(PN.page(r), location.href).href; /* works today, in this prototype */

  PN.copy = async (text, msg = 'Copied.') => {
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const t = document.createElement('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.append(t); t.select(); try { document.execCommand('copy'); } catch (x) { } t.remove(); }
    PN.toast(msg, 'ok');
  };

  /* where an owner can put their link. Saved per restaurant in r.promo = { id: true } */
  const SPOTS = [
    { id: 'facebook', icon: 'share-network', t: 'Facebook page', h: 'In your page’s About or Page info, paste the link in the Website box.' },
    { id: 'instagram', icon: 'camera', t: 'Instagram bio', h: 'Edit profile, then add the link under Links.' },
    { id: 'google', icon: 'map-pin', t: 'Google Maps', h: 'In your Google Business Profile, put the link in the Website box. People who find you on Maps land on your menu.' },
    { id: 'whatsapp', icon: 'whatsapp-logo', t: 'WhatsApp Business', h: 'Add the link to your business profile, and send it when someone asks for the menu.' },
    { id: 'door', icon: 'door-open', t: 'Door or window', h: 'A QR sticker lets people passing by see the menu and prices before they walk in.', act: 'sticker' },
    { id: 'bill', icon: 'receipt', t: 'Bill and visiting cards', h: 'Print the QR on your bill pad and cards so people come back.', act: 'png' },
    { id: 'takeaway', icon: 'bowl-food', t: 'Takeaway bags and boxes', h: 'A small QR sticker brings takeaway customers back to your page.', act: 'png' }
  ];

  /* everything the website shows, and where the owner changes it */
  const PARTS = [['list', 'Menu and prices', 'menu'], ['tag', 'Deals', 'deals'], ['images', 'Photos', 'photos'], ['virtual-reality', '360° tour', 'photos'], ['chat-circle-dots', 'Reviews and your replies', 'reviews'], ['clock', 'Opening hours and map', 'page'], ['phone', 'Call and WhatsApp buttons', 'page']];

  const post = (r, lang) => lang === 'bn'
    ? `${r.name.bn || r.name.en}-এর পুরো মেনু, আজকের দাম, ছবি${r.tour && r.tour.length ? ', ৩৬০° ট্যুর' : ''} আর রিভিউ এক জায়গায়। কোনো অ্যাপ লাগবে না: ${PN.siteAddr(r)}`
    : `See our full menu, today’s prices, photos${r.tour && r.tour.length ? ', a 360° tour' : ''} and reviews in one place. No app needed: ${PN.siteAddr(r)}`;

  /* QR as a file: SVG as is, PNG drawn at print size */
  const qrFile = (r, kind) => {
    const svg = K.qrSvg(PN.siteLink(r), K.qrStyle(r)), name = `${r.id}-khabo-qr`;
    const save = (href, ext) => { const a = document.createElement('a'); a.href = href; a.download = `${name}.${ext}`; document.body.append(a); a.click(); a.remove(); };
    const blob = new Blob([svg.replace('<svg ', '<svg width="1200" height="1200" ')], { type: 'image/svg+xml' }), url = URL.createObjectURL(blob);
    if (kind === 'svg') { save(url, 'svg'); setTimeout(() => URL.revokeObjectURL(url), 2000); return; }
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 1200; c.getContext('2d').drawImage(img, 0, 0, 1200, 1200); save(c.toDataURL('image/png'), 'png'); URL.revokeObjectURL(url); };
    img.onerror = () => { PN.toast('Could not make the PNG. Try the SVG.', 'bad'); URL.revokeObjectURL(url); };
    img.src = url;
  };

  /* ---------- colours for anything printed with a QR (door stickers, table cards) ----------
     '' = the restaurant's own colours, a khabo colour pair by id, or 'mono' = black and white (cheapest to print). */
  const MONO = { deep: '#111111', accent: '#FFFFFF', en: 'Black and white' };
  PN.palOf = (r, id) => id === 'mono' ? MONO : (PN.D.palettes.find(p => p.id === id) || r.theme);
  PN.swatches = (r, cur) => `<div class="sws">${[['', r.theme, 'Your colours'], ...PN.D.palettes.map(p => [p.id, p, p.en]), ['mono', MONO, MONO.en]].map(([id, p, n]) => `<button type="button" class="sw-c ${(cur || '') === id ? 'on' : ''}" data-k="${id}" style="--d:${p.deep};--a:${p.accent}" title="${esc(n)}" aria-label="${esc(n)}"><i></i></button>`).join('')}</div>`;
  /* the QR in the chosen colours. qrc: 'match' = the deep colour, 'black' = plain black (scans best on any print) */
  PN.qrStyleFor = (r, o = {}) => {
    const th = PN.palOf(r, o.pal), fg = o.qrc === 'black' ? '#111111' : th.deep;
    return K.qrStyle(Object.assign({}, r, { theme: Object.assign({}, r.theme, { deep: th.deep, accent: th.accent }), qr: Object.assign({}, r.qr, o.look ? { look: o.look } : {}, { fg, eye: fg }) }));
  };

  /* ---------- door and window stickers ----------
     Eight designs. The look of each lives in sticker.css (.st-<id>). To add one: a line here, a body below, a block there.
     The owner's choices are kept in r.promo._stk: { id, pal, qrc, head, line, bn, addr, size } */
  PN.STICKERS = [
    { id: 'classic', name: 'Classic', note: 'Deep colour, white QR card' },
    { id: 'paper', name: 'Paper', note: 'Warm paper, quiet and classy' },
    { id: 'bold', name: 'Bold', note: 'Big words, easy to see from far' },
    { id: 'frame', name: 'Scan frame', note: 'The QR in a thick frame' },
    { id: 'split', name: 'Photo', note: 'Your photo on top, QR below' },
    { id: 'minimal', name: 'Minimal', note: 'White, a big QR, nothing else' },
    { id: 'arch', name: 'Doorway', note: 'An arch for glass doors' },
    { id: 'round', name: 'Round', note: 'A circle, words running round' },
    { id: 'shape', name: 'Shapes', note: 'Your code inside a shape: a pot, a tea cup, an Eid arch and more' }
  ];
  PN.STK_SIZES = { a6: ['A6', 'Small, 105 × 148 mm', .7071], a5: ['A5', 'Standard, 148 × 210 mm', 1], a4: ['A4', 'Large, 210 × 297 mm', 1.4142] };
  const stkWhat = r => `Our menu, today’s prices${r.tour && r.tour.length ? ' and a 360° look inside' : ''}.`;
  PN.stkDefaults = r => Object.assign({ id: 'classic', pal: '', qrc: 'match', head: 'Scan for the menu', line: stkWhat(r), bn: true, addr: true, size: 'a5', frame: 'banner' }, r.promo && r.promo._stk, r.promo && r.promo._sticker && !(r.promo._stk) ? { id: r.promo._sticker } : {});
  const phoneIco = '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M176,16H80A24,24,0,0,0,56,40V216a24,24,0,0,0,24,24h96a24,24,0,0,0,24-24V40A24,24,0,0,0,176,16Zm8,200a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h96a8,8,0,0,1,8,8ZM140,60a12,12,0,1,1-12-12A12,12,0,0,1,140,60Z"/></svg>';
  let stkN = 0;
  PN.stickerHtml = (r, id, opt) => {
    const o = Object.assign(PN.stkDefaults(r), opt, { id }), th = PN.palOf(r, o.pal);
    const st = PN.qrStyleFor(r, o), shaped = !!st.shape, q = `<div class="st-q ${shaped ? 'shape' : ''}">${K.qrSvg(PN.siteLink(r), st)}</div>`;
    const logo = r.brand && r.brand.logo && !o.pal ? `<img class="st-logo" src="${K.restFile(r, r.brand.logo)}" alt="">` : '';
    const mono = `<span class="st-mono">${esc(r.mono || r.name.en.slice(0, 2))}</span>`;
    const name = `<h1 class="st-n">${esc(r.name.en)}</h1>`, bn = o.bn && r.name.bn && r.name.bn !== r.name.en ? `<div class="st-bn">${esc(r.name.bn)}</div>` : '';
    const head = esc(o.head || ''), line = o.line ? `<p class="st-say">${esc(o.line)}</p>` : '';
    const addr = o.addr ? `<div class="st-addr">${esc(PN.siteAddr(r))}</div>` : '', by = `<div class="st-by">on khabo</div>`;
    const scan = head ? `<span class="st-scan">${phoneIco}${head}</span>` : '';
    const words = (o.head || '').split(/\s+/).filter(Boolean), half = Math.ceil(words.length / 2);
    const big = words.length ? `<h2 class="st-big">${esc(words.slice(0, half).join(' '))}<span>${esc(words.slice(half).join(' '))}</span></h2>` : '';
    const ringId = `st-c-${r.id}-${++stkN}`, ring = head ? Array(Math.max(1, Math.floor(56 / (o.head.length + 3)))).fill(o.head).join(' · ') + ' · ' : '';
    const photo = r.hero && r.hero[0] ? `<img class="st-ph" src="${PN.src(r.hero[0], 1000)}" alt="">` : '';
    const body = {
      classic: `${logo || name}${bn}${line}${q}${scan}${addr}${by}`,
      paper: `${name}${bn}<span class="st-rule"></span>${q}${scan}${line}${addr}${by}`,
      bold: `${big}${q}<div class="st-row">${mono}<div>${name}${addr}</div></div>${by}`,
      frame: `${logo || name}${bn}<div class="st-fr">${q}${head ? `<span class="st-tab">${phoneIco}${head}</span>` : ''}</div>${line}${addr}${by}`,
      split: `<div class="st-top">${photo}<div class="st-top-in">${name}${bn}</div></div><div class="st-bot">${q}<div class="st-bot-t">${scan}${line}${addr}</div></div>${by}`,
      minimal: `${head ? `<p class="st-head">${head}</p>` : ''}${q}${name}${addr}${by}`,
      arch: `<div class="st-in">${logo || name}${bn}${q}${scan}${line}${addr}</div>${by}`,
      shape: `<div class="st-shp">${K.qrFrame ? K.qrFrame(o.frame, { d: th.deep, a: th.accent, l: o.pal === 'mono' ? th.deep : th.accent, t1: o.head, t2: r.name.en, qr: o.qrs || K.qrSvg(PN.siteLink(r), st) }) : ''}</div>${bn}${line}${addr}${by}`,
      round: `<div class="st-disc">${ring ? `<svg class="st-ring" viewBox="0 0 200 200"><defs><path id="${ringId}" d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0"/></defs><text><textPath href="#${ringId}" startOffset="0" textLength="520" lengthAdjust="spacing">${esc(ring)}</textPath></text></svg>` : ''}${q}</div><div class="st-under">${name}${bn}${addr}</div>${by}`
    }[id] || '';
    return `<div class="st st-${id}" style="--d:${th.deep};--a:${th.accent}">${body}</div>`;
  };
  PN.printSticker = (r, o) => {
    const w = open('', '_blank'); if (!w) { PN.toast('Allow pop-ups for this page to print.', 'bad'); return; }
    const css = new URL('sticker.css', location.href).href, z = (PN.STK_SIZES[o.size] || PN.STK_SIZES.a5)[2], pg = (o.size || 'a5').toUpperCase();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.name.en)} sticker</title><link rel="stylesheet" href="${PN.FONTS}"><link rel="stylesheet" href="${css}"><style>body{margin:0;background:#E9E9EC}.st{zoom:${z}}@page{size:${pg};margin:0}@media screen{.st{margin:24px auto;box-shadow:0 10px 40px rgba(0,0,0,.18)}}</style></head><body>${PN.stickerHtml(r, o.id, o)}<script>addEventListener('load',function(){(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){setTimeout(function(){print()},350)})})<\/script></body></html>`);
    w.document.close();
  };
  /* pick a design and make it yours: colours, QR colour, the words, the size. The big preview follows every change. */
  const sticker = r => {
    const o = PN.stkDefaults(r);
    const A5W = 559.4; /* 148 mm in CSS pixels */
    const seg = (key, entries) => `<div class="seg sm" data-o="${key}">${entries.map(([k, l]) => `<button type="button" class="${String(o[key]) === String(k) ? 'on' : ''}" data-k="${k}">${l}</button>`).join('')}</div>`;
    PN.drawer({
      title: 'Door and window stickers',
      body: `<div class="stk-wrap">
          <div class="stk-left"><div class="stk-big" data-big>${PN.stickerHtml(r, o.id, o)}</div><p class="meta stk-size" data-sz>${PN.STK_SIZES[o.size][0]} · ${PN.STK_SIZES[o.size][1]}. The QR opens your website.</p></div>
          <div class="stk-opts">
            <div class="field"><span class="lbl">Design</span><div class="stk-grid">${PN.STICKERS.map(x => `<button class="stk-t ${x.id === o.id ? 'on' : ''}" data-st="${x.id}" title="${esc(x.note)}"><span class="stk-th">${PN.stickerHtml(r, x.id, o)}</span><b>${x.name}</b></button>`).join('')}</div></div>
            <div class="field qfp" data-frames style="${o.id === 'shape' ? '' : 'display:none'}"><span class="lbl">Shape</span><div class="qfp-tabs" data-qfcat>${Object.entries(K.QR_FRAME_CATS).map(([k, l]) => `<button type="button" class="${(K.QR_FRAMES.find(f => f.id === o.frame) || K.QR_FRAMES[0]).cat === k ? 'on' : ''}" data-c="${k}">${l}</button>`).join('')}</div><div class="qfp-grid" data-qfgrid></div></div>
            <div class="field"><span class="lbl">Colours</span><div data-o="pal">${PN.swatches(r, o.pal)}</div></div>
            <div class="field"><span class="lbl">QR code colour</span>${seg('qrc', [['match', 'Same as the sticker'], ['black', 'Black']])}<span class="hint">Black scans best if your printer’s colours are pale.</span></div>
            <div class="f-grid">
              ${PN.f.text('head', 'Big words', o.head, { full: true, attr: 'maxlength="28"', hint: 'e.g. Scan for the menu · মেনু দেখুন' })}
              ${PN.f.text('line', 'Small line', o.line, { full: true, attr: 'maxlength="90"', hint: 'Leave empty to hide it.' })}
            </div>
            <div class="stk-sw">${PN.f.sw('bn', 'Bangla name', o.bn)}${PN.f.sw('addr', 'Web address', o.addr)}</div>
            <div class="field"><span class="lbl">Size</span>${seg('size', Object.entries(PN.STK_SIZES).map(([k, v]) => [k, v[0]]))}</div>
          </div></div>`,
      foot: `<button class="btn ghost l" data-cancel>Close</button><button class="btn" data-keep>Save choices</button><button class="btn pri" data-go>${ico('printer', 'sm')}Print</button>`,
      mount: (box, close) => {
        box.classList.add('wide', 'xwide');
        const fit = () => { $$('.stk-big, .stk-th', box).forEach(b => { const p = b.firstElementChild; if (p) p.style.zoom = b.clientWidth / A5W; }); };
        requestAnimationFrame(fit); setTimeout(fit, 300); document.fonts && document.fonts.ready.then(fit);
        let t = 0;
        const paint = (thumbs) => {
          $('[data-big]', box).innerHTML = PN.stickerHtml(r, o.id, o);
          $('[data-sz]', box).textContent = `${PN.STK_SIZES[o.size][0]} · ${PN.STK_SIZES[o.size][1]}. The QR opens your website.`;
          if (thumbs) $$('[data-st]', box).forEach(b => { $('.stk-th', b).innerHTML = PN.stickerHtml(r, b.dataset.st, o); });
          if (o.id === 'shape' && (thumbs || !$('[data-qfgrid]', box).childElementCount)) frames();
          $('[data-frames]', box).style.display = o.id === 'shape' ? '' : 'none';
          fit();
        };
        /* shapes for the sticker: drawn with the real code, in the chosen colours */
        let qfCat = (K.QR_FRAMES.find(f => f.id === o.frame) || K.QR_FRAMES[0]).cat;
        const frames = () => {
          const th = PN.palOf(r, o.pal), qs = K.qrSvg(PN.siteLink(r), PN.qrStyleFor(r, o));
          $('[data-qfgrid]', box).innerHTML = K.QR_FRAMES.filter(f => f.cat === qfCat).map(f => `<button type="button" class="qfp-t ${o.frame === f.id ? 'on' : ''}" data-fr="${f.id}" title="${esc(f.en)}"><span>${K.qrFrame(f.id, { d: th.deep, a: th.accent, l: o.pal === 'mono' ? th.deep : th.accent, t1: o.head, t2: r.name.en, qr: qs })}</span><b>${esc(f.en)}</b></button>`).join('');
        };
        $('[data-qfcat]', box).addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; qfCat = b.dataset.c; $$('[data-c]', e.currentTarget).forEach(x => x.classList.toggle('on', x === b)); frames(); });
        $('[data-qfgrid]', box).addEventListener('click', e => { const b = e.target.closest('[data-fr]'); if (!b) return; o.frame = b.dataset.fr; $$('[data-fr]', e.currentTarget).forEach(x => x.classList.toggle('on', x === b)); paint(); });
        if (o.id === 'shape') frames();
        $$('[data-st]', box).forEach(b => b.onclick = () => { o.id = b.dataset.st; $$('[data-st]', box).forEach(x => x.classList.toggle('on', x === b)); paint(); });
        $$('[data-o]', box).forEach(g => g.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; o[g.dataset.o] = b.dataset.k; $$('[data-k]', g).forEach(x => x.classList.toggle('on', x === b)); paint(g.dataset.o === 'pal' || g.dataset.o === 'qrc'); }));
        $$('[name=head],[name=line]', box).forEach(i => i.addEventListener('input', () => { o[i.name] = i.value.trim(); clearTimeout(t); t = setTimeout(() => paint(true), 220); }));
        $$('[name=bn],[name=addr]', box).forEach(i => i.addEventListener('change', () => { o[i.name] = i.checked; paint(true); }));
        const keep = () => { r.promo = Object.assign({}, r.promo, { _stk: Object.assign({}, o) }); delete r.promo._sticker; return PN.saveR(r, `Saved the ${PN.STICKERS.find(x => x.id === o.id).name} door sticker`); };
        $('[data-cancel]', box).onclick = close;
        $('[data-keep]', box).onclick = () => { if (keep()) PN.toast('Sticker saved. It opens like this next time.'); };
        $('[data-go]', box).onclick = () => { keep(); PN.printSticker(r, o); };
      }
    });
  };

  PN.views.rest.site = ({ r, base }) => {
    const done = Object.assign({}, r.promo), n = SPOTS.filter(s => done[s.id]).length;
    const tr = PN.traffic(r), lang = (r.promo && r.promo._lang) || 'en';
    const stat = (k, i, v, note) => `<div class="card stat"><div class="k">${ico(i, 'sm')}${k}</div><div class="v num">${PN.n(v)}</div><div class="d">${note}</div></div>`;
    return {
      title: 'Your website', sub: 'Your khabo page is your restaurant’s own website. The QR on your tables opens it, and you can share the same link anywhere.',
      acts: `<a class="btn" href="${PN.page(r)}" target="_blank" rel="noopener">${ico('arrow-up-right', 'sm')}Open your website</a><button class="btn pri" data-copy>${ico('check', 'sm')}Copy link</button>`,
      html: `<section class="card ws-hero" style="--d:${r.theme.deep};--a:${r.theme.accent}">
        <div class="ws-stage">
          <div class="ws-desk"><div class="ws-bar"><i></i><i></i><i></i><span>${ico('globe-hemisphere-east', 'sm')}${esc(PN.siteAddr(r))}</span></div><div class="ws-view" data-frame="1280"><iframe src="${PN.page(r)}" title="Your website on a computer" loading="lazy" tabindex="-1"></iframe></div></div>
          <div class="ws-phone"><div class="ws-view" data-frame="390"><iframe src="${PN.page(r).replace('index.html', 'index.html?embed=1')}" title="Your website on a phone" loading="lazy" tabindex="-1"></iframe></div></div>
        </div>
        <div class="ws-side">
          <h2>${esc(r.name.en)} has its own website</h2>
          <p>No web designer and no hosting bill. Whatever you change in this panel shows on it straight away.</p>
          <div class="ws-addr"><span>${ico('globe-hemisphere-east')}<b>${esc(PN.siteAddr(r))}</b></span><button class="btn sm" data-copy>Copy</button></div>
          <p class="meta">This will be your address once khabo is live. For now the link opens this prototype.</p>
          <div class="ws-share"><a class="btn sm" href="https://wa.me/?text=${encodeURIComponent(post(r, 'en').replace(PN.siteAddr(r), PN.siteLink(r)))}" target="_blank" rel="noopener">${ico('whatsapp-logo', 'sm')}WhatsApp</a><a class="btn sm" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(PN.siteLink(r))}" target="_blank" rel="noopener">${ico('share-network', 'sm')}Facebook</a>${navigator.share ? `<button class="btn sm" data-share>${ico('share-network', 'sm')}More</button>` : ''}</div>
          <div class="ws-qr"><div class="ws-qr-box" data-qr></div><div><b>Your website QR</b><span class="meta">The same code works on the door, on bills, cards and takeaway bags. Table cards are under <a href="${base}qr">Table QR</a>.</span>
            <div class="ws-share"><button class="btn sm" data-dl="png">${ico('arrow-down', 'sm')}PNG</button><button class="btn sm" data-dl="svg">${ico('arrow-down', 'sm')}SVG</button><button class="btn sm" data-sticker>${ico('printer', 'sm')}Door sticker</button></div></div></div>
        </div>
      </section>

      <div class="grid g-main" style="margin-top:16px">
        <div class="card"><div class="card-h"><h2>Where to put your link</h2><span class="r meta">${n} of ${SPOTS.length} done</span></div>
          <div class="card-b" style="padding-top:0"><div class="meter" style="margin-bottom:6px"><i style="--w:${Math.round(n / SPOTS.length * 100)}"></i></div></div>
          <div class="ws-spots">${SPOTS.map(s => `<label class="ws-spot ${done[s.id] ? 'on' : ''}"><input type="checkbox" data-spot="${s.id}" ${done[s.id] ? 'checked' : ''}><span class="ws-ic">${ico(s.icon)}</span><span class="ws-t"><b>${s.t}</b><span class="meta">${s.h}</span></span>${s.act === 'sticker' ? `<button type="button" class="btn sm" data-sticker>Print</button>` : s.act === 'png' ? `<button type="button" class="btn sm" data-dl="png">QR</button>` : `<button type="button" class="btn sm" data-copy>Copy link</button>`}</label>`).join('')}</div>
        </div>
        <div class="stack" style="gap:16px">
          <div class="card"><div class="card-h"><h2>Ready-made post</h2><span class="r"><div class="seg" data-lang><button class="${lang === 'en' ? 'on' : ''}" data-v="en">English</button><button class="${lang === 'bn' ? 'on' : ''}" data-v="bn">বাংলা</button></div></span></div>
            <div class="card-b stack"><textarea class="inp ${lang === 'bn' ? 'bn' : ''}" rows="4" data-post>${esc(post(r, lang))}</textarea><button class="btn" data-copypost style="justify-self:start">${ico('check', 'sm')}Copy post</button></div></div>
          <div class="card"><div class="card-h"><h2>Always up to date</h2></div><div class="ws-parts">${PARTS.map(([i, t, v]) => `<a href="${base}${v}">${ico(i, 'sm')}<span>${t}</span>${ico('caret-right', 'sm')}</a>`).join('')}</div></div>
        </div>
      </div>

      <div class="sec-t"><h2>Visits to your website, last 30 days</h2>${PN.sample}</div>
      <div class="grid g3">${stat('All visits', 'eye', tr.views.v, 'From khabo, your link and your QR')}${stat('From your QR codes', 'qr-code', tr.qr.v, 'Tables, door, bills and bags')}${stat('From your shared link', 'share-network', Math.round(tr.views.v * .14), 'Facebook, Instagram, WhatsApp, Maps')}</div>`,
      mount: el => {
        const fit = () => $$('[data-frame]', el).forEach(v => { const f = v.firstElementChild, w = Number(v.dataset.frame), s = v.clientWidth / w; f.style.width = w + 'px'; f.style.height = (v.clientHeight / s) + 'px'; f.style.transform = `scale(${s})`; });
        fit(); addEventListener('resize', fit, { passive: true });
        K.qrArt($('[data-qr]', el), PN.siteLink(r), K.qrStyle(r));
        const save = (patch, what) => { r.promo = Object.assign({}, r.promo, patch); PN.saveR(r, what); };
        el.addEventListener('click', e => {
          const b = e.target.closest('button,a'); if (!b) return;
          if (b.matches('[data-copy]')) { e.preventDefault(); PN.copy(PN.siteLink(r), 'Link copied. Paste it anywhere.'); }
          else if (b.matches('[data-copypost]')) PN.copy($('[data-post]', el).value, 'Post copied.');
          else if (b.matches('[data-dl]')) { e.preventDefault(); qrFile(r, b.dataset.dl); }
          else if (b.matches('[data-sticker]')) { e.preventDefault(); sticker(r); }
          else if (b.matches('[data-share]')) navigator.share({ title: r.name.en, text: post(r, 'en'), url: PN.siteLink(r) }).catch(() => { });
          else if (b.closest('[data-lang]') && b.dataset.v) { save({ _lang: b.dataset.v }); PN.rerender(); }
        });
        $$('[data-spot]', el).forEach(c => c.onchange = () => { const s = SPOTS.find(x => x.id === c.dataset.spot); save({ [s.id]: c.checked || undefined }, `${c.checked ? 'Added' : 'Removed'} the website link: ${s.t}`); PN.rerender(); });
      }
    };
  };
})();
