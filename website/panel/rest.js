/* khabo panels: the pages for ONE restaurant.
   A restaurant owner sees these for their own restaurant only.
   The khabo admin sees the same pages for any restaurant (Restaurants > Manage), plus "Admin settings".
   Every view returns { title, sub, acts, html, mount } and is drawn by app.js. */
(function () {
  'use strict';
  const PN = window.PN, D = PN.D, $ = PN.$, $$ = PN.$$, ico = PN.ico, esc = PN.esc, L = PN.L;
  const V = PN.views.rest = {};
  const chili = n => n ? `<span class="spice" aria-label="Spice ${n} of 3">${ico('pepper', 'sm').repeat(n)}</span>` : '';
  const live = r => ({ href: PN.page(r), text: 'View' });
  const saved = (r, what, msg) => { const ok = PN.saveR(r, what); if (ok) PN.toast(msg || 'Saved. It is live on your page.', 'ok', live(r)); else if (ok === false && !PN.me()) location.reload(); PN.refreshSide(); return ok; };
  const sample = `<span class="badge gold" title="Real numbers come once the site is live">Sample</span>`;

  /* ---------- sample traffic (deterministic per restaurant) ---------- */
  const traffic = r => {
    const rnd = PN.rng(r.id + '|traffic'), base = 60 + PN.hash(r.id) % 120;
    const days = Array.from({ length: 30 }, (_, i) => Math.round(base * (0.75 + rnd() * 0.5) * (i % 7 === 4 || i % 7 === 5 ? 1.35 : 1)));
    const sum = days.reduce((a, b) => a + b, 0);
    const k = (f, s) => { const v = Math.round(sum * f); const p = Math.round((rnd() - .35) * 30); return { v, p, s: days.map(x => Math.round(x * f * (0.8 + rnd() * .4))) }; };
    return { days, views: { v: sum, p: Math.round((rnd() - .3) * 24), s: days }, qr: k(.21), calls: k(.028), dirs: k(.06) };
  };
  PN.traffic = traffic; PN.sample = sample;
  const delta = p => `<span class="${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '+' : ''}${p}%</span> vs last month`;

  /* =================== Overview =================== */
  V.overview = ({ r, base, admin }) => {
    const tr = traffic(r), stale = r.checked >= 30, revs = PN.reviews(r.id).filter(v => !v.hidden);
    const needReply = revs.filter(v => !v.reply && v.st <= 3), noPhoto = r.menu.filter(d => !d.p).length, out = r.menu.filter(d => d.out);
    const max = Math.max(...tr.days);
    const top = r.menu.filter(d => !d.share).map(d => ({ d, v: Math.round((d.best ? 1.8 : 1) * (40 + PN.hash(d.id) % 120)) })).sort((a, b) => b.v - a.v).slice(0, 5);
    const tmax = top.length ? top[0].v : 1;
    const news = admin ? [] : PN.replies(r.id), waiting = admin ? 0 : PN.requests(r.id).filter(q => q.state === 'open').length;
    const todo = [
      ...news.map(q => `<div class="alert ${q.state === 'done' ? 'ok' : 'bad'}">${ico(q.state === 'done' ? 'check-circle' : 'warning')}<div><b>khabo ${q.state === 'done' ? 'said yes' : 'said no'}: ${esc(PN.REQ[q.kind] || q.kind)}</b><div class="meta">${q.reply ? esc(q.reply) : q.state === 'done' ? 'The change is live.' : 'Open the request to see why.'}</div></div><a class="btn sm" href="${base}team#requests">See</a></div>`),
      waiting ? `<div class="alert info">${ico('clock')}<div><b>${waiting} request${waiting > 1 ? 's' : ''} with the khabo team</b><div class="meta">You will see the answer here.</div></div><a class="btn sm" href="${base}team#requests">See</a></div>` : '',
      stale ? `<div class="alert bad">${ico('warning')}<div><b>Prices were last confirmed ${PN.days(r.checked)}.</b><div class="meta">Diners see this date. Check your prices and confirm them.</div></div><button class="btn sm" data-confirm>Confirm</button></div>` : '',
      needReply.length ? `<div class="alert">${ico('chat-circle-dots')}<div><b>${needReply.length} low rating${needReply.length > 1 ? 's' : ''} without a reply</b><div class="meta">A short, polite reply helps the next diner decide.</div></div><a class="btn sm" href="${base}reviews">Reply</a></div>` : '',
      out.length ? `<div class="alert info">${ico('info')}<div><b>${out.length} dish${out.length > 1 ? 'es' : ''} marked sold out</b><div class="meta">${out.map(d => esc(d.name.en)).join(', ')}. Switch back when available.</div></div><a class="btn sm" href="${base}menu">Menu</a></div>` : '',
      noPhoto ? `<div class="alert info">${ico('camera')}<div><b>${noPhoto} dish${noPhoto > 1 ? 'es have' : ' has'} no photo</b><div class="meta">Dishes with photos get viewed far more.</div></div><a class="btn sm" href="${base}menu">Add</a></div>` : '',
      !r.deal ? `<div class="alert info">${ico('tag')}<div><b>No deal running</b><div class="meta">Deals show on the khabo Deals page and your page.</div></div><a class="btn sm" href="${base}deals">Add</a></div>` : ''
    ].filter(Boolean);
    const stat = (k, i, x) => `<div class="card stat"><div class="k">${ico(i, 'sm')}${k}</div><div class="v num">${PN.n(x.v)}</div><div class="d">${delta(x.p)}</div>${PN.spark(x.s.slice(-14))}</div>`;
    const logs = PN.logs(r.id).slice(0, 5);
    return {
      title: admin ? esc(r.name.en) : `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}`,
      sub: admin ? esc(PN.where(r)) : `Here is how ${esc(r.name.en)} is doing on khabo.`,
      html: `
      <section class="hero">${r.hero && r.hero[0] ? `<img src="${PN.src(r.hero[0], 1400)}" alt="">` : ''}
        <div class="hero-in"><div><h2>${esc(r.name.en)}</h2><p>${esc(PN.where(r))} · ${PN.tk(r.ppl[0])} to ${PN.tk(r.ppl[1])} per person</p>
          <div class="chips"><span class="chip ${r.hidden ? 'warn' : ''}"><i class="dot"></i>${r.hidden ? 'Hidden from khabo' : 'Live on khabo'}</span><span class="chip ${stale ? 'warn' : ''}">${ico('receipt', 'sm')}Prices checked ${PN.days(r.checked)}</span><span class="chip">${ico('fork-knife', 'sm')}${r.menu.length} dishes</span><span class="chip">${ico('star-fill', 'sm')}${r.rating ? r.rating.toFixed(1) : 'New'} · ${PN.n(r.reviews)} reviews</span></div></div>
          <div class="acts"><a class="btn" href="${base}site">${ico('globe-hemisphere-east', 'sm')}Your website</a><button class="btn gold" data-confirm>${ico('check-circle', 'sm')}Prices are correct</button></div></div>
      </section>
      <div class="sec-t"><h2>Last 30 days</h2>${sample}</div>
      <div class="grid g4">${stat('Page views', 'eye', tr.views)}${stat('QR menu scans', 'qr-code', tr.qr)}${stat('Call taps', 'phone', tr.calls)}${stat('Directions taps', 'navigation-arrow', tr.dirs)}</div>
      <div class="grid g-main" style="margin-top:16px">
        <div class="card"><div class="card-h"><h2>Page views per day</h2><span class="r">${sample}</span></div><div class="card-b"><div class="bars">${tr.days.map((v, i) => `<i style="--h:${Math.round(v / max * 100)};--i:${i}" class="${i >= 23 ? 'hi' : ''}" data-v="${v} views"></i>`).join('')}</div><div class="bars-x"><span>30 days ago</span><span>This week</span></div></div></div>
        <div class="card"><div class="card-h"><h2>To do</h2><span class="meta">${todo.length ? `${todo.length} item${todo.length > 1 ? 's' : ''}` : ''}</span></div><div class="card-b stack" style="gap:10px">${todo.join('') || `<div class="alert ok">${ico('check-circle')}<div><b>All done</b><div class="meta">Prices confirmed, reviews answered.</div></div></div>`}</div></div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><div class="card-h"><h2>Most viewed dishes</h2><span class="r">${sample}</span></div><div class="rows" style="padding:6px 0">${top.map((x, i) => `<div class="row"><span class="meta num" style="width:16px">${i + 1}</span><div style="display:grid;gap:6px"><b>${esc(x.d.name.en)}</b><div class="meter"><i style="--w:${Math.round(x.v / tmax * 100)}"></i></div></div><span class="num" style="font-weight:700">${PN.n(x.v)}</span></div>`).join('')}</div></div>
        <div class="card"><div class="card-h"><h2>Recent changes</h2>${admin ? `<a class="r btn sm ghost" href="#/activity/${r.id}">${ico('magnifying-glass', 'sm')}Search all</a>` : ''}</div><div class="rows" style="padding:6px 0">${logs.length ? logs.map(x => `<div class="act"><span class="av sm">${PN.initials(x.who)}</span><div><b>${esc(x.who)}</b> <span style="color:var(--ink-2)">${esc(x.what)}</span></div><span class="meta">${PN.ago(x.at)}</span></div>`).join('') : `<div class="empty">${ico('clock')}<b>No changes yet</b>Changes you make here are listed with who made them.</div>`}</div></div>
      </div>`,
      mount: el => $$('[data-confirm]', el).forEach(b => b.onclick = () => { r.checkedAt = Date.now(); r.checked = 0; saved(r, 'Confirmed all prices are correct', 'Thanks. Diners now see "prices checked today".'); PN.rerender(); })
    };
  };

  /* =================== Menu & prices =================== */
  let menuQ = '', menuCat = 'all';
  const dishRow = (r, d) => {
    const ty = D.types[d.type];
    return `<div class="dish ${d.out ? 'out' : ''}" data-did="${d.id}">
      ${PN.thumb(d.p, d.name.en)}
      <div class="nm"><b>${esc(d.name.en)}${d.best ? '<span class="badge gold">Best seller</span>' : ''}${d.share ? `<span class="badge">For ${d.share}</span>` : ''}</b><span class="bn">${esc(d.name.bn)}</span><span class="meta" style="display:block">${esc(L(d.por))}${ty ? ' · ' + esc(ty.en) : ''}${d.spice ? ' · ' + chili(d.spice) : ''}${d.veg ? ' · Veg' : ''}</span></div>
      <label class="pr-in"><span>৳</span><input type="number" min="1" step="1" inputmode="numeric" value="${d.price}" data-price aria-label="Price of ${esc(d.name.en)}"></label>
      <label class="avail"><span class="sw"><input type="checkbox" data-avail ${d.out ? '' : 'checked'} aria-label="${esc(d.name.en)} available today"><i></i></span><span>${d.out ? 'Sold out' : 'Available'}</span></label>
      <button class="ibtn" data-edit aria-label="Edit ${esc(d.name.en)}">${ico('dots-three')}</button>
    </div>`;
  };
  V.menu = ({ r }) => {
    const cats = r.cats, cnt = id => r.menu.filter(d => d.cat === id).length;
    const body = () => {
      const q = menuQ.toLowerCase();
      const list = cats.filter(c => menuCat === 'all' || c.id === menuCat).map(c => {
        const ds = r.menu.filter(d => d.cat === c.id && (!q || (d.name.en + ' ' + d.name.bn).toLowerCase().includes(q)));
        if (q && !ds.length) return '';
        return `<section class="mcat"><div class="mcat-h"><h3>${esc(c.en)}</h3><span class="meta bn">${esc(c.bn || '')}</span><span class="meta">${ds.length} dish${ds.length === 1 ? '' : 'es'}</span><div class="r"><button class="btn sm ghost" data-add-in="${c.id}">${ico('plus', 'sm')}Add here</button></div></div>
          <div class="card">${ds.length ? ds.map(d => dishRow(r, d)).join('') : `<div class="empty" style="padding:28px">${ico('fork-knife')}<b>No dishes yet</b>Add the first dish in ${esc(c.en)}.</div>`}</div></section>`;
      }).join('');
      return list || `<div class="card empty">${ico('magnifying-glass')}<b>No dish matches "${esc(menuQ)}"</b>Try another name.</div>`;
    };
    return {
      title: 'Menu & prices', sub: `${r.menu.length} dishes. Change a price and press Enter; it is live straight away. Prices are before VAT ${r.vat}% and service ${r.service}%.`,
      acts: `<button class="btn" data-photo>${ico('camera', 'sm')}Upload menu photo</button><button class="btn" data-cats>${ico('sliders-horizontal', 'sm')}Categories</button><button class="btn pri" data-add>${ico('plus', 'sm')}Add dish</button>`,
      html: `<div class="card" style="margin-bottom:6px"><div class="toolbar" style="border:0"><div class="search">${ico('magnifying-glass', 'sm')}<input class="inp" type="search" placeholder="Search your menu" value="${esc(menuQ)}" data-q aria-label="Search your menu"></div>
        <div class="fchips">${[['all', 'All', r.menu.length], ...cats.map(c => [c.id, c.en, cnt(c.id)])].map(([id, l, n]) => `<button class="fchip ${menuCat === id ? 'on' : ''}" data-cat="${id}">${esc(l)}<span>${n}</span></button>`).join('')}</div></div></div>
        <div data-list>${body()}</div>`,
      mount: el => {
        const list = $('[data-list]', el);
        const repaint = () => { list.innerHTML = body(); };
        $('[data-q]', el).oninput = e => { menuQ = e.target.value; repaint(); };
        $$('[data-cat]', el).forEach(b => b.onclick = () => { menuCat = b.dataset.cat; $$('[data-cat]', el).forEach(x => x.classList.toggle('on', x === b)); repaint(); });
        $('[data-add]', el).onclick = () => dishDrawer(r, null, menuCat !== 'all' ? menuCat : cats[0].id);
        $('[data-cats]', el).onclick = () => catModal(r);
        $('[data-photo]', el).onclick = () => PN.menuPhoto(r);
        list.addEventListener('click', e => {
          const a = e.target.closest('[data-add-in]'); if (a) return dishDrawer(r, null, a.dataset.addIn);
          const ed = e.target.closest('[data-edit]'); if (ed) return dishDrawer(r, r.menu.find(d => d.id === ed.closest('[data-did]').dataset.did));
        });
        const commit = inp => {
          const d = r.menu.find(x => x.id === inp.closest('[data-did]').dataset.did), v = Math.round(Number(inp.value));
          if (!v || v < 1) { inp.value = d.price; PN.toast('Enter a price above zero.', 'bad'); return; }
          if (v === d.price) return;
          const was = d.price; PN.priceChange(r, d, v);
          if (PN.saveR(r, `Changed ${d.name.en} from ${PN.tk(was)} to ${PN.tk(v)}`)) { const w = inp.parentNode; w.classList.remove('saved'); void w.offsetWidth; w.classList.add('saved'); PN.toast(`${d.name.en} is now ${PN.tk(v)} on your page.`, 'ok', live(r)); }
        };
        list.addEventListener('keydown', e => { if (e.target.matches('[data-price]') && e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
        list.addEventListener('focusout', e => { if (e.target.matches('[data-price]')) commit(e.target); });
        list.addEventListener('change', e => {
          if (!e.target.matches('[data-avail]')) return;
          const row = e.target.closest('[data-did]'), d = r.menu.find(x => x.id === row.dataset.did);
          d.out = !e.target.checked; if (!d.out) delete d.out;
          row.classList.toggle('out', !!d.out); row.querySelector('.avail span:last-child').textContent = d.out ? 'Sold out' : 'Available';
          saved(r, `${d.out ? 'Marked' : 'Unmarked'} ${d.name.en} ${d.out ? 'as sold out' : 'sold out'}`, d.out ? `${d.name.en} shows as sold out today.` : `${d.name.en} is available again.`);
        });
      }
    };
  };

  const dishDrawer = (r, d, cat) => {
    const isNew = !d;
    d = d || { id: '', type: 'curry', name: { en: '', bn: '' }, price: null, p: null, por: { en: 'Serves 1', bn: '১ জন' }, spice: 0, cat };
    let photo = d.p, spice = d.spice || 0;
    const types = Object.entries(D.types).map(([k, v]) => [k, v.en]);
    const arr = a => (a || []).map(x => L(x)).join(', '), arrBn = a => (a || []).map(x => x.bn || '').join(', ');
    const hist = PN.hist(r.id, d.id);
    const body = `
      <div class="dish-ph"><div class="pcell" data-ph>${photo ? `<img src="${PN.src(photo, 300)}" alt="">` : ''}</div><div style="display:grid;gap:8px;justify-items:start"><b>Dish photo</b><span class="meta">A clear photo of the real plate. JPG or PNG.</span><div style="display:flex;gap:8px"><button type="button" class="btn sm" data-up>${ico('camera', 'sm')}${photo ? 'Replace' : 'Upload'}</button>${photo ? `<button type="button" class="btn sm ghost" data-rm>Remove</button>` : ''}</div></div></div>
      <div class="f-grid">
        ${PN.f.text('en', 'Name (English)', d.name.en, { req: true, ph: 'e.g. Mutton Kacchi' })}${PN.f.text('bn', 'Name (Bangla)', d.name.bn, { bn: true, ph: 'যেমন মাটন কাচ্চি' })}
        ${PN.f.money('price', 'Price', d.price, { req: true, hint: `Before VAT ${r.vat}% and service ${r.service}%` })}
        ${PN.f.sel('cat', 'Category', d.cat, r.cats.map(c => [c.id, c.en]))}
        ${PN.f.text('poren', 'Portion (English)', L(d.por), { ph: 'Serves 1 · 2 pcs' })}${PN.f.text('porbn', 'Portion (Bangla)', d.por.bn, { bn: true })}
        ${PN.f.sel('type', 'Kind of dish', d.type, types, { hint: 'Used for search and the Dishes page' })}
        ${PN.f.text('share', 'Shared by (people)', d.share || '', { type: 'number', ph: 'Leave empty for one person', attr: 'min="2" max="20"' })}
      </div>
      <div class="field"><span class="lbl">Spice</span><div class="seg" data-spice>${['Not spicy', 'Mild', 'Medium', 'Hot'].map((l, i) => `<button type="button" class="${spice === i ? 'on' : ''}" data-s="${i}">${chili(i)}${l}</button>`).join('')}</div></div>
      <div class="card" style="padding:4px 16px">${PN.f.sw('veg', 'Vegetarian', d.veg)}<div style="border-top:1px solid var(--line)"></div>${PN.f.sw('best', 'Best seller', d.best, { hint: 'Shows a "Best seller" label' })}</div>
      <p class="dw-sub">Description</p>
      <div class="f-grid">${PN.f.area('desc', 'Short description (English)', L(d.desc), { rows: 2 })}${PN.f.area('descbn', 'Short description (Bangla)', d.desc ? d.desc.bn : '', { rows: 2, bn: true })}</div>
      <p class="dw-sub">About this dish</p>
      <p class="meta" style="margin-top:-10px">Shown under "About this dish". Leave empty to use khabo's general text for ${esc((D.types[d.type] || {}).en || 'this kind of dish')}.</p>
      <div class="f-grid">
        ${PN.f.area('made', 'How it is made (English)', L(d.made), { rows: 2 })}${PN.f.area('madebn', 'How it is made (Bangla)', d.made ? d.made.bn : '', { rows: 2, bn: true })}
        ${PN.f.text('ing', 'Main ingredients (English)', arr(d.ing), { ph: 'Mutton, Basmati rice, Ghee', hint: 'Separate with commas' })}${PN.f.text('ingbn', 'Main ingredients (Bangla)', arrBn(d.ing), { bn: true, ph: 'মাটন, বাসমতি চাল, ঘি' })}
        ${PN.f.text('side', 'Served with (English)', L(d.side), { ph: 'Borhani and salad' })}${PN.f.text('sidebn', 'Served with (Bangla)', d.side ? d.side.bn : '', { bn: true })}
      </div>
      ${hist.length ? `<p class="dw-sub">Price history</p><div class="hist">${hist.slice().reverse().map(h => `<div><span class="num" style="font-weight:700">${PN.tk(h.v)}</span><span class="meta">${h.who === 'Before' ? 'Before changes' : `${esc(h.who)} · ${PN.ago(h.at)}`}</span></div>`).join('')}</div>` : ''}`;
    PN.drawer({
      title: isNew ? 'Add a dish' : 'Edit dish', body,
      foot: `${isNew ? '' : `<button class="btn danger l" data-del>${ico('x', 'sm')}Delete</button>`}<button class="btn ghost ${isNew ? 'l' : ''}" data-cancel>Cancel</button><button class="btn pri" data-save>${isNew ? 'Add dish' : 'Save changes'}</button>`,
      mount: (box, close) => {
        const paintPh = () => { $('[data-ph]', box).innerHTML = photo ? `<img src="${PN.src(photo, 300)}" alt="">` : ''; $('[data-up]', box).lastChild.textContent = photo ? 'Replace' : 'Upload'; };
        $('[data-up]', box).onclick = async () => { const [p] = await PN.pickPhotos(false); if (p) { photo = p; paintPh(); } };
        const rm = $('[data-rm]', box); if (rm) rm.onclick = () => { photo = null; rm.remove(); paintPh(); };
        $$('[data-s]', box).forEach(b => b.onclick = () => { spice = Number(b.dataset.s); $$('[data-s]', box).forEach(x => x.classList.toggle('on', x === b)); });
        $('[data-cancel]', box).onclick = close;
        const del = $('[data-del]', box);
        if (del) del.onclick = async () => {
          if (!await PN.confirm({ title: `Delete ${d.name.en}?`, text: 'It disappears from your menu, the Dishes page and search. This cannot be undone.', ok: 'Delete dish', danger: true })) return;
          r.menu.splice(r.menu.indexOf(d), 1); r.signature = (r.signature || []).filter(x => x !== d.id);
          close(); saved(r, `Deleted ${d.name.en}`, `${d.name.en} was removed from your menu.`); PN.rerender();
        };
        $('[data-save]', box).onclick = () => {
          const v = PN.form($('.dw-b', box));
          if (!v.en) { PN.toast('Give the dish an English name.', 'bad'); $('#f-en', box).focus(); return; }
          if (!v.price || v.price < 1) { PN.toast('Enter a price above zero.', 'bad'); $('#f-price', box).focus(); return; }
          const two = (en, bn) => en || bn ? { en: en || bn, bn: bn || en } : undefined;
          const list = (en, bn) => { const a = en.split(',').map(s => s.trim()).filter(Boolean), b = bn.split(',').map(s => s.trim()).filter(Boolean); return a.length || b.length ? a.map((x, i) => ({ en: x, bn: b[i] || x })) : undefined; };
          if (isNew) { let id = `${r.id.slice(0, 3)}-${PN.slug(v.en)}`; while (r.menu.some(x => x.id === id)) id += '-2'; d.id = id; }
          const priceChanged = !isNew && v.price !== d.price;
          if (priceChanged) PN.priceChange(r, d, v.price); else d.price = v.price;
          Object.assign(d, { name: { en: v.en, bn: v.bn || v.en }, cat: v.cat, type: v.type, por: { en: v.poren || 'Serves 1', bn: v.porbn || v.poren || '১ জন' }, spice, p: photo || null });
          ['veg', 'best'].forEach(k => { if (v[k]) d[k] = true; else delete d[k]; });
          const sh = Number(v.share); if (sh >= 2) d.share = sh; else delete d.share;
          const fields = { desc: two(v.desc, v.descbn), made: two(v.made, v.madebn), ing: list(v.ing, v.ingbn), side: two(v.side, v.sidebn) };
          Object.entries(fields).forEach(([k, x]) => { if (x) d[k] = x; else delete d[k]; });
          if (isNew) r.menu.push(d);
          close(); saved(r, isNew ? `Added ${d.name.en}` : `Edited ${d.name.en}`, isNew ? `${d.name.en} was added to your menu.` : `${d.name.en} was updated.`); PN.rerender();
        };
      }
    });
  };

  const catModal = r => {
    const row = c => `<div class="f-grid" data-c="${c ? c.id : ''}" style="grid-template-columns:1fr 1fr auto;align-items:end">${PN.f.text('en', 'English', c ? c.en : '')}${PN.f.text('bn', 'Bangla', c ? c.bn : '', { bn: true })}<button type="button" class="ibtn" data-rmc aria-label="Remove category" ${c && r.menu.some(d => d.cat === c.id) ? 'disabled title="Move or delete its dishes first"' : ''}>${ico('x', 'sm')}</button></div>`;
    PN.modal({
      title: 'Menu categories', body: `<p class="meta">Rename, add or remove sections of your menu. A category with dishes in it cannot be removed.</p><div class="stack" data-rows style="gap:12px">${r.cats.map(row).join('')}</div><button type="button" class="btn sm" data-addc style="justify-self:start">${ico('plus', 'sm')}Add category</button>`,
      foot: `<button class="btn ghost l" data-x2>Cancel</button><button class="btn pri" data-savec>Save</button>`,
      mount: (box, close) => {
        $('[data-x2]', box).onclick = close;
        $('[data-addc]', box).onclick = () => { $('[data-rows]', box).insertAdjacentHTML('beforeend', row(null)); $$('[data-rows] > div', box).pop().querySelector('input').focus(); };
        $('[data-rows]', box).addEventListener('click', e => { const b = e.target.closest('[data-rmc]'); if (b && !b.disabled) b.parentNode.remove(); });
        $('[data-savec]', box).onclick = () => {
          const out = $$('[data-rows] > div', box).map(x => ({ id: x.dataset.c, en: $('[name=en]', x).value.trim(), bn: $('[name=bn]', x).value.trim() })).filter(x => x.en);
          if (!out.length) { PN.toast('Keep at least one category.', 'bad'); return; }
          r.cats = out.map(x => ({ id: x.id || PN.slug(x.en), en: x.en, bn: x.bn || x.en }));
          close(); saved(r, 'Updated menu categories'); PN.rerender();
        };
      }
    });
  };

  /* =================== Restaurant page details =================== */
  /* social links: a full link or just the handle (@name). Returns a clean https link, or null when it is not that network */
  PN.socialUrl = (k, v) => {
    const n = D.socials[k]; v = String(v || '').trim(); if (!v) return '';
    if (!/^https?:\/\//i.test(v)) { if (/^[\w.@-]+$/.test(v)) return n.base + v.replace(/^@/, ''); v = 'https://' + v; }
    try { const u = new URL(v), h = u.hostname.toLowerCase().replace(/^(www|m)\./, ''); return /^https?:$/.test(u.protocol) && n.host.test(h) ? 'https://' + h + u.pathname.replace(/\/$/, '') : null; } catch (e) { return null; }
  };
  /* "Ask khabo": the one way an owner asks for something only the team can change.
     It goes to the team's Requests inbox; the answer comes back on Overview and Team & account. */
  PN.askKhabo = (r, kind = 'name') => {
    const kinds = Object.entries(PN.REQ);
    PN.modal({
      title: 'Ask the khabo team',
      body: `<p class="meta" style="margin-bottom:12px">Some things only the khabo team changes, so diners, reviews and printed QR codes never lose track of you. We usually answer within a day.</p>
        <div class="f-grid">${PN.f.sel('kind', 'What do you want to change?', kind, kinds, { full: true })}
        <div class="full f-grid" data-k="name">${PN.f.text('en', 'New name (English)', '', { full: true })}${PN.f.text('bn', 'New name (Bangla)', '', { full: true, bn: true })}</div>
        <div class="full" data-k="text">${PN.f.area('text', 'What should it be?', '', { full: true, rows: 3, ph: 'e.g. We moved to House 12, Road 27, Dhanmondi. The map pin should move too.' })}</div>
        ${PN.f.area('note', 'Anything else? (optional)', '', { full: true, rows: 2, ph: 'e.g. We rebranded in December' })}</div>`,
      foot: `<button class="btn ghost l" data-c>Cancel</button><button class="btn pri" data-ok>${ico('paper-plane-right', 'sm')}Send to khabo</button>`,
      mount: (box, close) => {
        const sel = $('[name=kind]', box), show = () => { $('[data-k=name]', box).style.display = sel.value === 'name' ? '' : 'none'; $('[data-k=text]', box).style.display = sel.value === 'name' ? 'none' : ''; };
        sel.onchange = show; show();
        $('[data-c]', box).onclick = close;
        $('[data-ok]', box).onclick = () => {
          const v = PN.form($('.dw-b', box)), k = v.kind;
          if (PN.requests(r.id).some(q => q.state === 'open' && q.kind === k)) return PN.toast(`You already asked about the ${PN.REQ[k].toLowerCase()}. Cancel that one first under Team & account.`, 'bad');
          if (k === 'name' && (!v.en || v.en === r.name.en)) return PN.toast('Write the new English name.', 'bad');
          if (k !== 'name' && v.text.length < 4) return PN.toast('Write what should change.', 'bad');
          if (!PN.request(r.id, k, k === 'name' ? { en: v.en, bn: v.bn } : { text: v.text }, v.note)) return;
          close(); PN.toast('Sent. The khabo team has been told and will answer here.'); PN.rerender();
        };
      }
    });
  };
  const nameAsk = r => PN.askKhabo(r, 'name');
  /* the owner's list of requests, with the team's answers */
  const REQ_ST = { open: ['Waiting for khabo', 'warn'], done: ['Done', 'ok'], declined: ['Declined', 'bad'], cancelled: ['Cancelled', ''] };
  const reqList = r => {
    const qs = PN.requests(r.id).slice(0, 12);
    return qs.length ? qs.map(q => `<div class="row rq" data-q="${q.id}"><span class="av sm">${ico(q.state === 'done' ? 'check' : q.state === 'open' ? 'clock' : 'x', 'sm')}</span><div><b>${esc(PN.REQ[q.kind] || q.kind)}</b><span class="rq-w">${PN.reqWhat ? PN.reqWhat(q) : esc(q.kind === 'name' ? q.data.en : q.data.text)}</span><span class="meta">Asked ${PN.ago(q.at)}${q.state !== 'open' && q.doneAt ? ` · answered ${PN.ago(q.doneAt)}` : ''}</span>${q.reply ? `<span class="rq-reply">${ico('chat-circle-dots', 'sm')}<span><b>khabo:</b> ${esc(q.reply)}</span></span>` : ''}</div><span class="rq-a"><span class="badge ${REQ_ST[q.state][1]}">${REQ_ST[q.state][0]}</span>${q.state === 'open' ? `<button class="btn sm ghost" data-cancelq>Cancel</button>` : ''}</span></div>`).join('')
      : `<div class="empty">${ico('paper-plane-right')}<b>No requests yet</b>Need a new name, area, web address or a new 360 shoot? Ask here.</div>`;
  };
  V.page = ({ r, admin }) => {
    const fac = D.facilities, pays = ['Cash', 'bKash', 'Nagad', 'Card', 'Rocket'], team = PN.can('rest.admin');
    const sec = (h, p, body) => `<div class="f-sec"><div><h3>${h}</h3><p>${p}</p></div><div class="f-grid">${body}</div></div>`;
    let theme = Object.assign({}, r.theme), facs = (r.fac || []).slice(), pay = (r.pay || []).slice();
    const soc = Object.assign({ links: {}, main: '' }, r.social), ask = PN.requests(r.id).find(q => q.state === 'open' && q.kind === 'name');
    const custom = !D.palettes.some(x => x.deep === theme.deep && x.accent === theme.accent);
    const look = () => `<div class="look ${theme.font === 'serif' ? 'serif' : ''}" style="--d:${theme.deep};--a:${theme.accent}">${r.hero && r.hero[0] ? `<img src="${PN.src(r.hero[0], 700)}" alt="">` : ''}<div><span>${esc(PN.where(r))}</span><b>${esc(r.name.en)}</b><span class="lb">See the menu</span></div></div>`;
    const lockedName = `<div class="field full"><span class="lbl">Restaurant name</span><div class="locked">${ico('lock-simple', 'sm')}<div><b>${esc(r.name.en)}</b><span class="bn">${esc(r.name.bn)}</span></div>${ask ? `<span class="badge warn">Asked for “${esc(ask.data.en)}”</span>` : `<button type="button" class="btn sm" data-askname>Ask for a change</button>`}</div><span class="hint">Only the khabo team changes names, so diners and reviews never lose track of you.</span></div>`;
    return {
      title: 'Restaurant page', sub: 'What diners see on your khabo page.',
      acts: `<a class="btn" href="${PN.page(r)}" target="_blank" rel="noopener">${ico('arrow-up-right', 'sm')}View page</a>`,
      html: `<form class="card" data-form novalidate>
        ${sec('Name and story', 'Your name, a one-line tagline and a few words about the place.',
          (team ? PN.f.text('en', 'Name (English)', r.name.en, { req: true }) + PN.f.text('bn', 'Name (Bangla)', r.name.bn, { bn: true }) : lockedName) +
          PN.f.text('tag', 'Tagline (English)', L(r.tagline), { full: true, hint: 'One sentence. Shown under your name.' }) + PN.f.text('tagbn', 'Tagline (Bangla)', r.tagline ? r.tagline.bn : '', { full: true, bn: true }) +
          PN.f.area('story', 'About (English)', L(r.story), { full: true }) + PN.f.area('storybn', 'About (Bangla)', r.story ? r.story.bn : '', { full: true, bn: true }))}
        ${sec('Contact and address', 'How diners call and find you.',
          PN.f.text('phone', 'Phone', r.phone, { type: 'tel' }) + PN.f.text('spot', 'Short location (English)', L(r.spot), { hint: 'e.g. Road 27, Dhanmondi' }) +
          PN.f.text('addr', 'Full address (English)', L(r.address), { full: true }) + PN.f.text('addrbn', 'Full address (Bangla)', r.address ? r.address.bn : '', { full: true, bn: true }) +
          (team ? PN.f.sel('area', 'Area', r.area, D.areas.map(a => [a.id, `${a.en}, ${D.cities[a.city].en}`])) : `<div class="field"><span class="lbl">Area</span><div class="locked sm">${ico('lock-simple', 'sm')}<b>${esc(PN.where(r))}</b><button type="button" class="btn sm" data-askarea>Ask for a change</button></div><span class="hint">Set by the khabo team</span></div>`))}
        ${sec('Social media', 'Shown on your page under your story and in Visit. Pick the one you post on most; it is shown first and bigger.',
          `<div class="full soc-ed">${Object.entries(D.socials).map(([k, n]) => { const x = soc.links[k] || {}; return `<div class="soc-row"><span class="soc-ic">${ico(n.i)}</span><div class="field"><label for="f-s-${k}">${n.en}</label><input class="inp" id="f-s-${k}" name="s_${k}" value="${esc(x.url || '')}" placeholder="${k === 'facebook' ? 'facebook.com/yourpage' : '@yourname'}" autocapitalize="off" spellcheck="false"></div><div class="field"><label for="f-n-${k}">Followers</label><input class="inp" id="f-n-${k}" name="n_${k}" value="${esc(x.n || '')}" placeholder="e.g. 12k"></div><label class="soc-main" title="Show this one first"><input type="radio" name="smain" value="${k}" ${soc.main === k ? 'checked' : ''}><span>Main</span></label></div>`; }).join('')}<span class="hint">Leave empty what you do not use. Followers are optional, write them the way you like (12k, 3,400).</span></div>`)}
        ${sec('Hours and prices', 'Opening hours and the charges added to every bill.',
          PN.f.text('open', 'Opens', r.hours[0], { type: 'time' }) + PN.f.text('close', 'Closes', r.hours[1], { type: 'time', hint: 'After midnight is fine, e.g. 01:00' }) +
          PN.f.money('ppl0', 'Per person, from', r.ppl[0]) + PN.f.money('ppl1', 'Per person, up to', r.ppl[1]) +
          `<div class="full card" style="padding:2px 16px">${PN.f.sw('showppl', 'Show price per person on my page', !r.hidePpl, { hint: 'Off hides it from the top of your page. khabo still uses it for search filters like "under ৳500".' })}</div>` +
          PN.f.text('vat', 'VAT (%)', r.vat, { type: 'number', attr: 'min="0" max="20"' }) + PN.f.text('service', 'Service charge (%)', r.service, { type: 'number', attr: 'min="0" max="20"' }) +
          PN.f.text('seats', 'Seats', r.seats || '', { type: 'number' }))}
        ${sec('Facilities and payment', 'Diners filter by these. Only pick what you really have.',
          `<div class="full"><div class="tchips" data-fac>${Object.entries(fac).map(([k, f]) => `<button type="button" class="tchip ${facs.includes(k) ? 'on' : ''}" data-k="${k}" aria-pressed="${facs.includes(k)}">${ico(f.i, 'sm')}${esc(f.en)}</button>`).join('')}</div></div>
           <div class="full field"><span class="lbl">Payment</span><div class="tchips" data-pay>${pays.map(p => `<button type="button" class="tchip ${pay.includes(p) ? 'on' : ''}" data-k="${p}" aria-pressed="${pay.includes(p)}">${p}</button>`).join('')}</div></div>`)}
        ${sec('Page look', 'Pick a colour pair. Every pair is made to sit well with khabo, so your page always looks like it belongs.',
          `<div class="full" data-look>${look()}</div>
           <div class="full field"><span class="lbl">Colour pairs</span><div class="pals">${D.palettes.map(x => `<button type="button" class="pal ${theme.deep === x.deep && theme.accent === x.accent ? 'on' : ''}" style="--d:${x.deep};--a:${x.accent}" data-sw="${x.deep}|${x.accent}"><i></i><span>${esc(x.en)}</span></button>`).join('')}${custom ? `<button type="button" class="pal on" style="--d:${r.theme.deep};--a:${r.theme.accent}" data-sw="${r.theme.deep}|${r.theme.accent}"><i></i><span>Custom (set by khabo)</span></button>` : ''}</div></div>
           ${team ? `<div class="full colors"><label><input type="color" value="${theme.deep}" data-c="deep"> Background</label><label><input type="color" value="${theme.accent}" data-c="accent"> Accent</label><span class="meta">khabo team only: custom colours. Keep the background dark and the accent bright.</span></div>` : ''}`)}
      </form>
      <div class="savebar" role="region" aria-label="Unsaved changes"><span>You have unsaved changes</span><button class="btn ghost sm" data-discard>Discard</button><button class="btn gold sm" data-savep>Save changes</button></div>`,
      mount: el => {
        const form = $('[data-form]', el), bar = $('.savebar', el);
        const dirty = () => bar.classList.add('on');
        form.addEventListener('input', dirty); form.addEventListener('change', dirty);
        const an = $('[data-askname]', el); if (an) an.onclick = () => nameAsk(r);
        const aa = $('[data-askarea]', el); if (aa) aa.onclick = () => PN.askKhabo(r, 'area');
        const tog = (sel, arr) => $(sel, el).addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k, i = arr.indexOf(k); if (i >= 0) arr.splice(i, 1); else arr.push(k); b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0); dirty(); });
        tog('[data-fac]', facs); tog('[data-pay]', pay);
        const paintLook = () => { $('[data-look]', el).innerHTML = look(); $$('[data-sw]', el).forEach(s => s.classList.toggle('on', s.dataset.sw === `${theme.deep}|${theme.accent}`)); $$('[data-c]', el).forEach(c => c.value = theme[c.dataset.c]); dirty(); };
        $$('[data-sw]', el).forEach(s => s.onclick = () => { [theme.deep, theme.accent] = s.dataset.sw.split('|'); paintLook(); });
        $$('[data-c]', el).forEach(c => c.oninput = () => { theme[c.dataset.c] = c.value; paintLook(); });
        $('[data-discard]', el).onclick = () => PN.rerender();
        $('[data-savep]', el).onclick = () => {
          const v = PN.form(form);
          if (team && !v.en) { PN.toast('The page needs an English name.', 'bad'); $('#f-en', el).focus(); return; }
          if (v.ppl0 && v.ppl1 && v.ppl1 < v.ppl0) { PN.toast('"Up to" must be more than "from".', 'bad'); return; }
          if (!team && !D.palettes.some(x => x.deep === theme.deep && x.accent === theme.accent) && !(theme.deep === r.theme.deep && theme.accent === r.theme.accent)) { PN.toast('Pick one of the colour pairs.', 'bad'); return; }
          const links = {}; let badSoc = '';
          Object.keys(D.socials).forEach(k => { const u = PN.socialUrl(k, v['s_' + k]); if (u === null) badSoc = badSoc || D.socials[k].en; else if (u) links[k] = { url: u, n: v['n_' + k] || undefined }; });
          if (badSoc) { PN.toast(`That ${badSoc} link does not look right. Paste the link to your ${badSoc} page, or just @yourname.`, 'bad'); $(`#f-s-${Object.keys(D.socials).find(k => D.socials[k].en === badSoc)}`, el).focus(); return; }
          const two = (en, bn, old) => en || bn ? { en: en || bn, bn: bn || en } : old;
          if (team) { if (v.en !== r.name.en) r.mono = (PN.initials(v.en) + v.en.replace(/\s/g, '').slice(1, 2).toUpperCase()).slice(0, 2); r.name = { en: v.en, bn: v.bn || v.en }; }
          r.tagline = two(v.tag, v.tagbn); r.story = two(v.story, v.storybn);
          r.phone = v.phone; r.spot = two(v.spot, L(r.spot) === v.spot ? (r.spot || {}).bn : '', r.spot); r.address = two(v.addr, v.addrbn, r.address);
          if (team && v.area) { r.area = v.area; r.city = PN.area(v.area).city; }
          r.hours = [v.open || r.hours[0], v.close || r.hours[1]]; r.ppl = [v.ppl0 || r.ppl[0], v.ppl1 || r.ppl[1]];
          if (v.showppl) delete r.hidePpl; else r.hidePpl = true;
          r.vat = Number(v.vat) || 0; r.service = Number(v.service) || 0; if (v.seats) r.seats = Number(v.seats);
          r.fac = facs; r.pay = pay; r.theme = theme;
          const main = links[v.smain] ? v.smain : Object.keys(links)[0] || '';
          if (Object.keys(links).length) r.social = { links, main }; else delete r.social;
          bar.classList.remove('on'); if (saved(r, 'Updated page details') !== false) PN.rerender();
        };
      }
    };
  };

  /* =================== Photos =================== */
  const GAL = [['inside', 'Inside'], ['outside', 'Outside'], ['kitchen', 'Kitchen'], ['food', 'Food']];
  V.photos = ({ r }) => {
    r.gallery = r.gallery || { inside: [], outside: [], kitchen: [], food: [] };
    const grid = (key, arr, cover) => `<div class="pgrid" data-g="${key}">${arr.map((k, i) => `<div class="pcell">${`<img src="${PN.src(k, 400)}" alt="">`}${cover ? `<span class="pc-n">${i === 0 ? 'Main' : i + 1}</span>` : ''}<div class="pc-tools">${i > 0 ? `<button data-mv="-1" data-i="${i}" aria-label="Move earlier">${ico('arrow-left', 'sm')}</button>` : ''}${i < arr.length - 1 ? `<button data-mv="1" data-i="${i}" aria-label="Move later">${ico('arrow-right', 'sm')}</button>` : ''}<button class="del" data-del data-i="${i}" aria-label="Remove photo">${ico('x', 'sm')}</button></div></div>`).join('')}<button class="pcell add" data-up>${'<span>' + ico('plus') + 'Add photos</span>'}</button></div>`;
    return {
      title: 'Photos', sub: 'The first cover photo is the big one at the top of your page.',
      html: `<div class="card"><div class="card-h"><h2>Cover photos</h2><span class="meta">${r.hero.length} of 6</span></div><div class="card-b">${grid('hero', r.hero, true)}</div></div>
        ${GAL.map(([k, l]) => `<div class="card" style="margin-top:16px"><div class="card-h"><h2>${l}</h2><span class="meta">${(r.gallery[k] || []).length} photos</span></div><div class="card-b">${grid(k, r.gallery[k] || [])}</div></div>`).join('')}
        <div class="alert info" style="margin-top:16px">${ico('virtual-reality')}<div><b>360° tour and film</b><div class="meta">${r.tour && r.tour.length ? `Your tour has ${r.tour.length} room${r.tour.length > 1 ? 's' : ''}: ${r.tour.map(t => esc(t.en)).join(', ')}.` : 'No 360° tour yet.'} ${r.film ? 'Your page has a short film.' : ''} The khabo team films these; ask us to reshoot any time.</div></div></div>`,
      mount: el => el.addEventListener('click', async e => {
        const g = e.target.closest('[data-g]'); if (!g) return;
        const key = g.dataset.g, arr = key === 'hero' ? r.hero : (r.gallery[key] = r.gallery[key] || []);
        const lbl = key === 'hero' ? 'cover' : (GAL.find(x => x[0] === key) || [, ''])[1].toLowerCase();
        if (e.target.closest('[data-up]')) {
          const ps = await PN.pickPhotos(true); if (!ps.length) return;
          const room = key === 'hero' ? Math.max(0, 6 - arr.length) : 30; arr.push(...ps.slice(0, room));
          saved(r, `Added ${ps.length} ${lbl} photo${ps.length > 1 ? 's' : ''}`); PN.rerender(); return;
        }
        const mv = e.target.closest('[data-mv]');
        if (mv) { const i = Number(mv.dataset.i), j = i + Number(mv.dataset.mv); [arr[i], arr[j]] = [arr[j], arr[i]]; saved(r, `Reordered ${lbl} photos`, 'Order saved.'); PN.rerender(); return; }
        const del = e.target.closest('[data-del]');
        if (del) {
          if (key === 'hero' && arr.length <= 1) { PN.toast('Keep at least one cover photo.', 'bad'); return; }
          if (!await PN.confirm({ title: 'Remove this photo?', text: 'It will no longer show on your page.', ok: 'Remove', danger: true })) return;
          arr.splice(Number(del.dataset.i), 1); saved(r, `Removed a ${lbl} photo`, 'Photo removed.'); PN.rerender();
        }
      })
    };
  };

  /* =================== Deals =================== */
  /* r.deals is the list in the order diners see it; paused deals stay in the list with off: true */
  const MAX_DEALS = 8;
  const fmtD = v => v ? new Date(v + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
  const dealWhen = x => x.week ? 'This week' : x.from && x.to ? `${fmtD(x.from)} to ${fmtD(x.to)}` : x.to ? `Until ${fmtD(x.to)}` : x.from ? `From ${fmtD(x.from)}` : '';
  const dealLook = (r, x) => { const tg = x.week ? 'Deal of the week' : (K.DEAL_TAGS[x.tag] || K.DEAL_TAGS.offer).en, pct = x.was > x.price ? Math.round((x.was - x.price) / x.was * 100) : 0; return `<div class="look dlook" style="--d:${r.theme.deep};--a:${r.theme.accent};min-height:200px">${x.p ? `<img src="${PN.src(x.p, 800)}" alt="">` : ''}<div><span class="dl-tag">${pct ? `<i>${pct}%</i>` : ''}${esc(tg)}${dealWhen(x) ? ` · ${esc(dealWhen(x))}` : ''}</span><b>${esc(L(x))}</b><p style="color:rgba(255,255,255,.75);margin-top:6px">${esc(L(x.desc))}</p>${L(x.when) ? `<p style="color:rgba(255,255,255,.65);font-size:13px">${esc(L(x.when))}</p>` : ''}<span class="lb">${PN.tk(x.price)}${x.was ? ` <s style="opacity:.6;margin-left:6px">${PN.tk(x.was)}</s>` : ''}</span></div></div>`; };
  const dealDrawer = (r, d) => {
    const isNew = !d; d = d || { p: (r.menu.find(x => x.p) || {}).p || r.hero[0] };
    let photo = d.p;
    const body = `
      <div class="dish-ph"><div class="pcell" data-ph>${photo ? `<img src="${PN.src(photo, 300)}" alt="">` : ''}</div><div style="display:grid;gap:8px;justify-items:start"><b>Deal photo</b><span class="meta">Starts with one of your dish photos. Upload your own if you like.</span><button type="button" class="btn sm" data-up>${ico('camera', 'sm')}Replace</button></div></div>
      <div class="f-grid">${PN.f.text('t', 'Offer (English)', isNew ? '' : L(d), { full: true, ph: 'e.g. Weekday lunch, 15% off' })}${PN.f.text('tbn', 'Offer (Bangla)', isNew ? '' : d.bn, { full: true, bn: true })}
      ${PN.f.text('desc', 'What is included (English)', d.desc ? L(d.desc) : '', { full: true })}${PN.f.text('descbn', 'What is included (Bangla)', d.desc ? d.desc.bn : '', { full: true, bn: true })}
      ${PN.f.sel('tag', 'Kind of deal', d.tag || 'offer', Object.entries(K.DEAL_TAGS).map(([k, v]) => [k, v.en]), { full: true, hint: d.week ? 'This one is the khabo Deal of the week, so it shows as that.' : 'Shown on the gold seal and above the price.' })}
      ${PN.f.text('from', 'First day', d.from || '', { type: 'date', hint: 'Leave empty to start now' })}${PN.f.text('to', 'Last day', d.to || '', { type: 'date', hint: 'Leave empty to keep it running. After this day it hides by itself.' })}
      ${PN.f.text('when', 'Days and times (English)', d.when ? L(d.when) : '', { ph: 'Sunday to Thursday, 12pm to 4pm' })}${PN.f.text('whenbn', 'Days and times (Bangla)', d.when ? d.when.bn : '', { bn: true })}
      ${PN.f.money('price', 'Deal price', d.price)}${PN.f.money('was', 'Usual price', d.was, { hint: 'Diners see how much they save' })}</div>
      <div class="card" style="padding:4px 16px">${PN.f.sw('on', 'Show this deal on khabo', !d.off)}</div>
      <p class="dw-sub">Preview</p><div data-prev>${isNew ? `<div class="card empty">${ico('tag')}<b>Your deal</b>Fill in the offer to see it.</div>` : dealLook(r, d)}</div>`;
    PN.drawer({
      title: isNew ? 'Add a deal' : 'Edit deal', body,
      foot: `${isNew ? '' : `<button class="btn danger l" data-del>${ico('x', 'sm')}Delete</button>`}<button class="btn ghost ${isNew ? 'l' : ''}" data-cancel>Cancel</button><button class="btn pri" data-save>${isNew ? 'Publish deal' : 'Save deal'}</button>`,
      mount: (box, close) => {
        const read = () => { const v = PN.form($('.dw-b', box)); return { v, x: { id: d.id || 'deal-' + Date.now().toString(36), en: v.t, bn: v.tbn || v.t, desc: { en: v.desc, bn: v.descbn || v.desc }, when: { en: v.when, bn: v.whenbn || v.when }, price: v.price, was: v.was, p: photo, tag: v.tag, from: v.from || undefined, to: v.to || undefined, week: d.week } }; };
        const paint = () => { const { x } = read(); if (x.en) $('[data-prev]', box).innerHTML = dealLook(r, x); };
        $('.dw-b', box).addEventListener('input', paint);
        $('[data-up]', box).onclick = async () => { const [p] = await PN.pickPhotos(false); if (p) { photo = p; $('[data-ph]', box).innerHTML = `<img src="${PN.src(p, 300)}" alt="">`; paint(); } };
        $('[data-cancel]', box).onclick = close;
        const del = $('[data-del]', box);
        if (del) del.onclick = async () => {
          if (!await PN.confirm({ title: 'Delete this deal?', text: 'It disappears from your page and the Deals page.', ok: 'Delete', danger: true })) return;
          r.deals.splice(r.deals.indexOf(d), 1); K.syncDeal(r); close(); saved(r, `Deleted deal: ${d.en}`, 'Deal deleted.'); PN.rerender();
        };
        $('[data-save]', box).onclick = () => {
          const { v, x } = read();
          if (!x.en || !x.price) { PN.toast('Add the offer and the deal price.', 'bad'); return; }
          if (x.was && x.was <= x.price) { PN.toast('The usual price should be higher than the deal price.', 'bad'); return; }
          if (x.from && x.to && x.to < x.from) { PN.toast('The last day is before the first day.', 'bad'); return; }
          if (x.to && x.to < K.today()) { PN.toast('The last day has already passed.', 'bad'); return; }
          if (!x.from) delete x.from; if (!x.to) delete x.to; if (!x.week) delete x.week;
          if (!x.was) delete x.was;
          if (!v.on) x.off = true;
          if (isNew) r.deals.push(x); else r.deals[r.deals.indexOf(d)] = x;
          K.syncDeal(r); close();
          saved(r, `${isNew ? 'Added' : 'Updated'} deal: ${x.en}`, x.off ? 'Deal saved and paused.' : 'Deal is live on khabo.'); PN.rerender();
        };
      }
    });
  };
  V.deals = ({ r }) => {
    K.syncDeal(r);
    const all = r.deals, live = K.dealsOf(r).length, full = all.length >= MAX_DEALS;
    return {
      title: 'Deals', sub: 'Run as many offers as you like. Give each one a first and last day and it shows and hides by itself. Several deals sit side by side on your page.',
      acts: `<button class="btn pri" data-add ${full ? 'disabled' : ''}>${ico('plus', 'sm')}Add a deal</button>`,
      html: all.length ? `<p class="meta" style="margin:-4px 0 14px">${live} showing${['off', 'soon', 'ended'].map(k => [all.filter(d => K.dealState(d) === k).length, { off: 'paused', soon: 'starting later', ended: 'ended' }[k]]).filter(([n]) => n).map(([n, l]) => `, ${n} ${l}`).join('')}. The first one is shown first.${full ? ` You can have up to ${MAX_DEALS}.` : ''}</p>
        <div class="deal-list">${all.map((d, i) => `<div class="card deal-c ${d.off ? 'off' : ''}">
          ${dealLook(r, d)}
          <div class="deal-c-b"><div class="deal-c-s">${{ off: '<span class="badge">Paused</span>', soon: `<span class="badge ind">Starts ${fmtD(d.from)}</span>`, ended: '<span class="badge warn">Ended, hidden</span>', live: `<span class="badge ok"><i class="dot"></i>Showing${d.to ? ` until ${fmtD(d.to)}` : ''}</span>` }[K.dealState(d)]}${d.week ? '<span class="badge ind">Deal of the week</span>' : ''}</div>
            <div class="deal-c-a"><button class="btn sm ghost ic" data-up-i="${i}" ${i ? '' : 'disabled'} aria-label="Move up">${ico('caret-up', 'sm')}</button><button class="btn sm ghost ic" data-dn-i="${i}" ${i < all.length - 1 ? '' : 'disabled'} aria-label="Move down">${ico('caret-down', 'sm')}</button>
            <button class="btn sm" data-tog="${i}">${d.off ? `${ico('eye', 'sm')}Show` : `${ico('pause', 'sm')}Pause`}</button><button class="btn sm" data-edit="${i}">Edit</button></div></div>
        </div>`).join('')}</div>`
        : `<div class="card empty">${ico('tag')}<b>No deals yet</b>A deal shows on your page and on the khabo Deals page.<button class="btn pri" data-add style="margin-top:10px">${ico('plus', 'sm')}Add your first deal</button></div>`,
      mount: el => {
        const root = el.closest('.main') || document;
        $$('[data-add]', root).forEach(b => b.onclick = () => dealDrawer(r, null));
        $$('[data-edit]', el).forEach(b => b.onclick = () => dealDrawer(r, all[Number(b.dataset.edit)]));
        $$('[data-tog]', el).forEach(b => b.onclick = () => { const d = all[Number(b.dataset.tog)]; if (d.off) delete d.off; else d.off = true; K.syncDeal(r); saved(r, `${d.off ? 'Paused' : 'Showed'} deal: ${d.en}`, d.off ? 'Deal paused.' : 'Deal is live on khabo.'); PN.rerender(); });
        const move = (i, j) => { const [d] = all.splice(i, 1); all.splice(j, 0, d); K.syncDeal(r); saved(r, `Moved deal: ${d.en}`, 'Order saved.'); PN.rerender(); };
        $$('[data-up-i]', el).forEach(b => b.onclick = () => { const i = Number(b.dataset.upI); move(i, i - 1); });
        $$('[data-dn-i]', el).forEach(b => b.onclick = () => { const i = Number(b.dataset.dnI); move(i, i + 1); });
      }
    };
  };

  /* =================== Reviews =================== */
  let rvF = 'all';
  V.reviews = ({ r, admin }) => {
    const all = PN.reviews(r.id), vis = all.filter(v => !v.hidden);
    const counts = [5, 4, 3, 2, 1].map(s => vis.filter(v => v.st === s).length), mx = Math.max(1, ...counts);
    const avg = vis.length ? vis.reduce((a, v) => a + v.st, 0) / vis.length : 0;
    const F = [['all', 'All', all.length], ['reply', 'Needs a reply', all.filter(v => !v.reply && !v.hidden).length], ['low', '3 stars or less', all.filter(v => v.st <= 3).length]];
    if (admin) F.push(['hidden', 'Hidden', all.filter(v => v.hidden).length]);
    const list = all.filter(v => rvF === 'all' ? true : rvF === 'reply' ? !v.reply && !v.hidden : rvF === 'low' ? v.st <= 3 : v.hidden);
    const card = (v, i) => `<article class="rv ${v.hidden ? 'hidden-rv' : ''}" data-i="${all.indexOf(v)}">
      <div class="rv-h"><span class="av">${PN.initials(v.who)}</span><div><b>${esc(v.who)}</b><span class="meta">${esc(L(v.when))}${v.vf ? ' · Verified visit' : ''}</span></div><div class="r">${v.hidden ? '<span class="badge bad">Hidden by khabo</span>' : ''}${PN.stars(v.st)}</div></div>
      <p class="rv-t">${esc(v.t)}</p>${v.ord && v.ord.length ? `<p class="meta">Ordered: ${v.ord.map(esc).join(', ')}</p>` : ''}
      ${v.reply ? `<div class="rv-reply"><b>Reply from ${esc(r.name.en)}</b><p class="rv-t">${esc(L(v.reply))}</p></div>` : ''}
      <div class="rv-acts" data-acts><button class="btn sm" data-reply>${ico('chat-circle-dots', 'sm')}${v.reply ? 'Edit reply' : 'Reply'}</button>${v.reply ? `<button class="btn sm ghost" data-unreply>Remove reply</button>` : ''}${PN.can('reviews.moderate') ? `<button class="btn sm ${v.hidden ? '' : 'danger'}" data-hide>${v.hidden ? 'Show again' : 'Hide review'}</button>` : `<button class="btn sm ghost" data-flag>${ico('warning', 'sm')}Report to khabo</button>`}</div>
    </article>`;
    return {
      title: 'Reviews', sub: 'Reply to diners. Your reply shows under their review on your page.',
      html: `<div class="grid g-main">
        <div class="card"><div class="toolbar"><div class="fchips">${F.map(([k, l, n]) => `<button class="fchip ${rvF === k ? 'on' : ''}" data-f="${k}">${l}<span>${n}</span></button>`).join('')}</div></div>
          <div data-list>${list.length ? list.map(card).join('') : `<div class="empty">${ico('chats-circle')}<b>Nothing here</b>${rvF === 'reply' ? 'Every review has a reply.' : 'No reviews in this group.'}</div>`}</div></div>
        <div class="stack" style="align-content:start"><div class="card stat"><div class="k">${ico('star-fill', 'sm')}Average from reviews on khabo</div><div class="v num">${avg ? avg.toFixed(1) : '–'}</div><div class="d">${vis.length} review${vis.length === 1 ? '' : 's'} here · ${PN.n(r.reviews)} in total</div>
          <div class="stack" style="gap:8px;margin-top:16px">${[5, 4, 3, 2, 1].map((s, i) => `<div style="display:grid;grid-template-columns:28px 1fr 22px;gap:10px;align-items:center;font-size:13px"><span class="meta">${s}★</span><div class="meter"><i style="--w:${Math.round(counts[i] / mx * 100)}"></i></div><span class="num meta">${counts[i]}</span></div>`).join('')}</div></div>
          <div class="alert info">${ico('info')}<div><b>Good replies</b><div class="meta">Thank them by name, answer the point they raised, keep it short. Never argue in public.</div></div></div></div>
      </div>`,
      mount: el => {
        $$('[data-f]', el).forEach(b => b.onclick = () => { rvF = b.dataset.f; PN.rerender(); });
        $('[data-list]', el).addEventListener('click', async e => {
          const art = e.target.closest('[data-i]'); if (!art) return;
          const v = all[Number(art.dataset.i)];
          if (e.target.closest('[data-reply]')) {
            const acts = $('[data-acts]', art);
            acts.outerHTML = `<form class="rv-acts" data-rform style="display:grid;gap:8px"><textarea class="inp" rows="3" placeholder="Write a reply to ${esc(v.who.split(' ')[0])}" aria-label="Your reply">${esc(L(v.reply))}</textarea><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn sm ghost" data-cancel>Cancel</button><button class="btn sm pri">Post reply</button></div></form>`;
            const f = $('[data-rform]', art), ta = $('textarea', f); ta.focus();
            $('[data-cancel]', f).onclick = () => PN.rerender();
            f.onsubmit = ev => { ev.preventDefault(); const txt = ta.value.trim(); if (!txt) { ta.focus(); return; } PN.setRev(v, { reply: txt }, `Replied to ${v.who}`); PN.toast('Reply posted on your page.', 'ok', live(r)); PN.refreshSide(); PN.rerender(); };
            return;
          }
          if (e.target.closest('[data-unreply]')) { PN.setRev(v, { reply: null }, `Removed the reply to ${v.who}`); PN.toast('Reply removed.'); PN.rerender(); return; }
          if (e.target.closest('[data-hide]')) { PN.setRev(v, { hidden: !v.hidden }, `${v.hidden ? 'Showed' : 'Hid'} the review by ${v.who}`); PN.toast(v.hidden ? 'Review hidden from the site.' : 'Review is visible again.'); PN.refreshSide(); PN.rerender(); return; }
          if (e.target.closest('[data-flag]')) { PN.setRev(v, { flagged: true }, `Reported the review by ${v.who}`); PN.toast('Sent to the khabo team. We check reports within a day.'); }
        });
      }
    };
  };

  /* =================== Table QR =================== */
  const CARDS = { shape: 'Shapes', dark: 'Colour', light: 'Light', tent: 'Table tent', frame: 'Scan frame', number: 'Big letters', elegant: 'Fine dining', photo: 'Photo' };
  const QR_DEF = { tables: 12, layout: 'list', header: 'photo', theme: 'auto', card: 'dark', frame: 'banner', look: 'rounded', cpal: '', qrc: 'match', ctext: 'Scan for the menu and prices', cbn: false, tnum: false };
  /* Table QR: every choice shows straight away in the preview and the cards below, but nothing is saved
     until "Save changes" (same as the Restaurant page). Leaving with unsaved changes asks first. */
  V.qr = ({ r }) => {
    const draft = Object.assign({}, QR_DEF, r.qr);
    if (!CARDS[draft.card]) draft.card = 'dark';
    let qfCat = (K.QR_FRAMES.find(f => f.id === draft.frame) || K.QR_FRAMES[0]).cat;
    const fo = (th, n) => ({ d: th.deep, a: th.accent, l: draft.cpal === 'mono' ? th.deep : th.accent, t1: draft.tnum ? `Table ${n}` : r.name.en, t2: draft.tnum ? (draft.ctext || r.name.en) : draft.ctext });
    const url = t => new URL(`../index.html#/t/${r.slug || r.id}${t ? `?table=${t}` : ''}`, location.href).href;
    const prevUrl = () => new URL(`../index.html?embed=1#/t/${r.slug || r.id}?table=4&tml=${draft.layout}&tmh=${draft.header}&tmt=${draft.theme}`, location.href).href;
    const style = () => PN.qrStyleFor(r, { pal: draft.cpal, qrc: draft.qrc, look: draft.look });
    /* one printed table card. Every design shares the same parts (mark, name, QR, table number, words)
       laid out differently. --l is the accent for light paper: with black and white it falls back to black. */
    const card = i => {
      const th = PN.palOf(r, draft.cpal), n = i + 1, k = draft.card;
      const mono = `<i class="cd-mono">${esc(r.mono || r.name.en.slice(0, 2))}</i>`;
      const nm = `<b class="cd-name">${esc(r.name.en)}</b>${draft.cbn && r.name.bn ? `<em class="cd-bn">${esc(r.name.bn)}</em>` : ''}`;
      const tx = draft.ctext ? `<small class="cd-tx">${esc(draft.ctext)}</small>` : '';
      const box = `<div class="qr-box" data-qr="${n}"></div>`;
      /* the table number is optional (off by default): every design works with or without it */
      const tb = draft.tnum ? `<span class="cd-t"><em>Table</em>${n}</span>` : '';
      const head = `<div class="cd-head">${mono}${nm}</div>`;
      const img = r.hero && r.hero[0] ? `<img src="${PN.src(r.hero[0], 600)}" alt="">` : '';
      if (k === 'shape') return `<div class="qr-card cd-shape">${K.qrFrame(draft.frame, Object.assign(fo(th, n), { attr: `data-qr="${n}"` }))}</div>`;
      const inner = {
        dark: `${head}${box}${tb}${tx}`,
        light: `${head}${box}${tb}${tx}`,
        tent: `<div class="cd-back">${mono}${nm}${tb}${tx}</div><div class="cd-front">${box}${tb}</div>`,
        frame: `${head}<div class="cd-fr"><div class="cd-fq">${box}</div><span class="cd-tab">${esc(draft.ctext || 'Scan for the menu')}</span></div>${tb}`,
        number: draft.tnum ? `<div class="cd-big"><em>Table</em><strong>${n}</strong><span>${esc(r.name.en)}</span></div><div class="cd-low">${box}${tx}</div>`
          : `<div class="cd-big no-n"><strong>${esc(r.mono || r.name.en.slice(0, 2))}</strong><span>${esc(r.name.en)}</span></div><div class="cd-low">${box}${tx}</div>`,
        elegant: `${nm}<span class="cd-orn"><i></i>✦<i></i></span>${box}${draft.tnum ? `<span class="cd-no">Table <b>${n}</b></span>` : ''}${tx}`,
        photo: `<div class="cd-ph">${img}<div>${nm}</div></div>${box}${tb}${tx}`
      }[k];
      return `<div class="qr-card cd-${k}" style="--d:${th.deep};--a:${th.accent};--l:${draft.cpal === 'mono' ? th.deep : th.accent}">${inner}</div>`;
    };
    const mini = k => `<span class="lay-ic lay-${k}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
    const HINT = { list: 'Good for most menus: name, price and a small photo.', photos: 'Two photos side by side. Best for cafés and desserts.', cards: 'One big photo per dish. Best for short menus with great photos.', compact: 'No photos, loads fastest. Best for long menus.', classic: 'Like a printed menu card: name, dotted line, price. Elegant for fine dining.' };
    const THEME_SW = { auto: ['#FFFFFF', '#E9ECF5'], paper: ['#F6F0E4', '#E3D5BB'], night: ['#0E1018', '#2A2F40'], brand: [r.theme.deep, r.theme.accent] };
    const segBtns = (key, entries) => entries.map(([k, l]) => `<button type="button" class="${draft[key] === k ? 'on' : ''}" data-k="${k}">${l}</button>`).join('');
    return {
      title: 'Table QR', sub: 'Guests scan the card on their table and see your menu in your colours. No app needed. Try a choice, see it on the right, then save.',
      acts: `<a class="btn" href="${url(1)}" target="_blank" rel="noopener">${ico('arrow-up-right', 'sm')}Open table menu</a><button class="btn pri" data-print>${ico('printer', 'sm')}Print cards</button>`,
      html: `<div class="grid g-main">
        <div class="card"><div class="card-h"><h2>Table menu</h2><span class="r meta">What guests see after scanning</span></div><div class="card-b stack">
          <div class="field"><span class="lbl">Layout</span><div class="lays" data-set="layout">${Object.entries(K.TM_LAYOUTS).map(([k, l]) => `<button type="button" class="lay ${draft.layout === k ? 'on' : ''}" data-k="${k}">${mini(k)}<span>${l}</span></button>`).join('')}</div><span class="hint" data-hint>${HINT[draft.layout]}</span></div>
          <div class="field"><span class="lbl">Colour theme</span><div class="tms" data-set="theme">${Object.entries(K.TM_THEMES).map(([k, l]) => `<button type="button" class="tm-sw ${draft.theme === k ? 'on' : ''}" data-k="${k}"><i style="--x:${THEME_SW[k][0]};--y:${THEME_SW[k][1]}"></i><span>${l}</span></button>`).join('')}</div><span class="hint">Light follows the guest’s phone: dark at night if their phone is set that way.</span></div>
          <div class="field"><span class="lbl">Top of the menu</span><div class="seg" data-set="header">${segBtns('header', Object.entries(K.TM_HEADERS))}</div></div>
        </div></div>
        <div class="tm-prev"><div class="ws-phone static"><div class="ws-view" data-frame="390"><iframe src="${prevUrl()}" title="Table menu preview"></iframe></div></div><span class="meta">Live preview, table 4. Scroll inside the phone.</span></div>
      </div>
      <div class="card cd-opts" style="margin-top:16px"><div class="card-h"><h2>Table cards</h2><span class="r meta">What you print and put on each table</span></div><div class="card-b">
        <div class="cd-grid">
          <div class="field full"><span class="lbl">Design</span><div class="seg" data-set="card">${segBtns('card', Object.entries(CARDS))}</div></div>
          <div class="field full qfp" data-frames style="${draft.card === 'shape' ? '' : 'display:none'}"><span class="lbl">Shape around the code</span><div class="qfp-tabs" data-qfcat>${Object.entries(K.QR_FRAME_CATS).map(([k, l]) => `<button type="button" class="${qfCat === k ? 'on' : ''}" data-c="${k}">${l}</button>`).join('')}</div><div class="qfp-grid" data-qfgrid></div><span class="hint">Your name (or the table number, if it is on) goes in big letters, your words under it. Every shape keeps the code on white so phones read it.</span></div>
          <div class="field full"><span class="lbl">Colours</span><div data-set="cpal">${PN.swatches(r, draft.cpal)}</div></div>
          <div class="field"><span class="lbl">QR code colour</span><div class="seg" data-set="qrc">${segBtns('qrc', [['match', 'Same as the card'], ['black', 'Black']])}</div></div>
          <div class="field"><span class="lbl">QR style</span><div class="seg" data-set="look">${segBtns('look', K.qrLooksFor(r).map(k => [k, K.QR_LOOKS[k].en]))}</div>${r.brand && r.brand.shape ? '<span class="hint">Logo shape makes the whole code look like your logo. Phones read it like any QR code.</span>' : ''}</div>
          <div class="field"><label for="f-ct">Words on the card</label><input class="inp" id="f-ct" maxlength="40" value="${esc(draft.ctext)}" placeholder="Leave empty to hide"></div>
          <div class="field cd-small"><div><label for="f-n">Number of tables</label><input class="inp num" id="f-n" type="number" min="1" max="60" value="${draft.tables}"></div>${PN.f.sw('cbn', 'Bangla name', draft.cbn)}</div>
          <div class="field full cd-tsw">${PN.f.sw('tnum', 'Show the table number on the card', draft.tnum, { hint: 'Off by default, so every card looks the same. Each code still opens the menu for its own table.' })}</div>
        </div></div></div>
      <div class="sec-t"><h2>Cards to print</h2><span class="meta" data-cmeta></span></div>
      <div class="qr-print"><div class="qr-grid" data-cards></div></div>
      <div class="savebar" role="region" aria-label="Unsaved changes"><span>You have unsaved changes</span><button class="btn ghost sm" data-discard>Discard</button><button class="btn gold sm" data-saveq>Save changes</button></div>`,
      mount: el => {
        const bar = $('.savebar', el), frame = $('.tm-prev iframe', el);
        const fit = () => $$('[data-frame]', el).forEach(v => { const f = v.firstElementChild, w = Number(v.dataset.frame), sc = v.clientWidth / w; f.style.width = w + 'px'; f.style.height = (v.clientHeight / sc) + 'px'; f.style.transform = `scale(${sc})`; });
        fit(); addEventListener('resize', fit, { passive: true });
        const paintCards = () => {
          const n = Math.min(60, Math.max(1, Number(draft.tables) || 1));
          $('[data-cards]', el).innerHTML = Array.from({ length: n }, (_, i) => card(i)).join('');
          $('[data-cmeta]', el).textContent = `${n} tables · ${CARDS[draft.card]}`;
          $$('[data-qr]', el).forEach(b => K.qrArt(b, url(b.dataset.qr), style()));
        };
        paintCards();
        /* the shape picker: every frame in this group, drawn in the chosen colours with a real code */
        const paintFrames = () => {
          const th = PN.palOf(r, draft.cpal), g = $('[data-qfgrid]', el);
          g.innerHTML = K.QR_FRAMES.filter(f => f.cat === qfCat).map(f => `<button type="button" class="qfp-t ${draft.frame === f.id ? 'on' : ''}" data-fr="${f.id}" title="${esc(f.en)}"><span>${K.qrFrame(f.id, Object.assign(fo(th, 1), { attr: 'data-qrt' }))}</span><b>${esc(f.en)}</b></button>`).join('');
          $$('[data-qrt]', g).forEach(b => K.qrArt(b, url(1), style()));
        };
        if (draft.card === 'shape') paintFrames();
        $('[data-qfcat]', el).addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; qfCat = b.dataset.c; $$('[data-c]', e.currentTarget).forEach(x => x.classList.toggle('on', x === b)); paintFrames(); });
        $('[data-qfgrid]', el).addEventListener('click', e => { const b = e.target.closest('[data-fr]'); if (!b) return; draft.frame = b.dataset.fr; $$('[data-fr]', e.currentTarget).forEach(x => x.classList.toggle('on', x === b)); paintCards(); dirty(); });
        const dirty = () => { const was = JSON.stringify(Object.assign({}, QR_DEF, r.qr)); bar.classList.toggle('on', JSON.stringify(draft) !== was); };
        let lastPrev = prevUrl();
        $$('[data-set]', el).forEach(g => g.addEventListener('click', e => {
          const b = e.target.closest('[data-k]'); if (!b) return;
          const key = g.dataset.set; draft[key] = b.dataset.k;
          $$('[data-k]', g).forEach(x => x.classList.toggle('on', x === b));
          if (key === 'layout') $('[data-hint]', el).textContent = HINT[draft.layout];
          if (key === 'layout' || key === 'header' || key === 'theme') { const u = prevUrl(); if (u !== lastPrev) { lastPrev = u; frame.src = u; } }
          if (key === 'card') { $('[data-frames]', el).style.display = draft.card === 'shape' ? '' : 'none'; if (draft.card === 'shape') paintFrames(); }
          if (['look', 'cpal', 'qrc'].includes(key) && draft.card === 'shape') paintFrames();
          if (['look', 'card', 'cpal', 'qrc'].includes(key)) paintCards();
          dirty();
        }));
        $('#f-n', el).addEventListener('input', e => { draft.tables = Math.min(60, Math.max(1, Number(e.target.value) || 1)); paintCards(); dirty(); });
        let ct = 0; $('#f-ct', el).addEventListener('input', e => { draft.ctext = e.target.value.trim(); clearTimeout(ct); ct = setTimeout(() => { paintCards(); if (draft.card === 'shape') paintFrames(); dirty(); }, 200); });
        $('[name=cbn]', el).addEventListener('change', e => { draft.cbn = e.target.checked; paintCards(); dirty(); });
        $('[name=tnum]', el).addEventListener('change', e => { draft.tnum = e.target.checked; paintCards(); if (draft.card === 'shape') paintFrames(); dirty(); });
        $('[data-discard]', el).onclick = () => PN.rerender();
        $('[data-saveq]', el).onclick = () => {
          const before = Object.assign({}, r.qr); r.qr = Object.assign({}, r.qr, draft);
          const NAMES = { layout: 'menu layout', header: 'menu top', theme: 'menu colours', look: 'QR style', card: 'card design', frame: 'card shape', cpal: 'card colours', qrc: 'QR colour', ctext: 'card words', cbn: 'Bangla name', tnum: 'table number', tables: 'number of tables' };
          const what = Object.keys(NAMES).filter(k => before[k] !== draft[k]).map(k => NAMES[k]);
          if (saved(r, `Changed the table QR: ${what.join(', ') || 'settings'}`, 'Saved. Guests see it on their next scan.') !== false) PN.rerender();
        };
        $('[data-print]', el).onclick = () => { if (bar.classList.contains('on')) PN.toast('Printing what you see. Save to keep these choices.', 'ok'); print(); };
        /* leaving with unsaved changes asks first */
        const guard = e => {
          if (!bar.isConnected) { document.removeEventListener('click', guard, true); removeEventListener('beforeunload', unload); return; }
          const a = e.target.closest('a[href^="#"]'); if (!a || !bar.classList.contains('on')) return;
          if (!confirm('You have unsaved changes on Table QR. Leave without saving?')) { e.preventDefault(); e.stopPropagation(); }
        };
        const unload = e => { if (bar.isConnected && bar.classList.contains('on')) { e.preventDefault(); e.returnValue = ''; } };
        document.addEventListener('click', guard, true); addEventListener('beforeunload', unload);
      }
    };
  };

  /* =================== Price insights (private to the restaurant) =================== */
  V.insights = ({ r }) => {
    const rows = r.menu.filter(d => !d.share).map(d => {
      const others = D.restaurants.filter(x => x.id !== r.id && x.city === r.city && !x.hidden).flatMap(x => x.menu.filter(o => o.type === d.type && !o.share).map(o => o.price));
      if (!others.length) return { d, none: true };
      const s = others.slice().sort((a, b) => a - b), med = s[Math.floor(s.length / 2)], diff = d.price - med;
      return { d, med, diff, pct: Math.round(diff / med * 100), n: others.length, lo: s[0], hi: s[s.length - 1] };
    });
    const cmp = rows.filter(x => !x.none), above = cmp.filter(x => x.pct > 10).length, below = cmp.filter(x => x.pct < -10).length;
    const city = (D.cities[r.city] || {}).en;
    return {
      title: 'Price insights', sub: `How your prices compare with the same kind of dish elsewhere in ${esc(city)}. Only you and the khabo team see this.`,
      html: `<div class="grid g3"><div class="card stat"><div class="k">${ico('chart-line-up', 'sm')}Dishes compared</div><div class="v num">${cmp.length}</div><div class="d">of ${rows.length} single-portion dishes</div></div>
        <div class="card stat"><div class="k">${ico('trend-down', 'sm')}Priced above typical</div><div class="v num">${above}</div><div class="d">more than 10% over the ${esc(city)} middle price</div></div>
        <div class="card stat"><div class="k">${ico('tag', 'sm')}Priced below typical</div><div class="v num">${below}</div><div class="d">a good value point to mention</div></div></div>
        <div class="card" style="margin-top:16px"><div class="tbl-wrap"><table class="tbl tbl-m"><thead><tr><th>Dish</th><th class="r">Your price</th><th class="r">Middle price in ${esc(city)}</th><th>Range elsewhere</th><th class="r">Difference</th></tr></thead><tbody>
        ${rows.map(x => `<tr><td class="who-td"><div class="who">${PN.thumb(x.d.p, x.d.name.en)}<div><b>${esc(x.d.name.en)}</b><span class="meta">${esc((D.types[x.d.type] || {}).en || '')}</span></div></div></td>
          <td class="r num" data-k="Yours" style="font-weight:700">${PN.tk(x.d.price)}</td>
          ${x.none ? `<td colspan="3" class="meta" data-k="Compared">Nobody else in ${esc(city)} serves this kind of dish yet</td>` : `<td class="r num" data-k="Middle">${PN.tk(x.med)}</td><td class="meta num" data-k="Range">${PN.tk(x.lo)} to ${PN.tk(x.hi)} · ${x.n} dish${x.n > 1 ? 'es' : ''}</td><td class="r end"><span class="badge ${x.pct > 10 ? 'warn' : x.pct < -10 ? 'ok' : ''}">${x.pct > 0 ? '+' : ''}${x.pct}%</span></td>`}</tr>`).join('')}
        </tbody></table></div></div>`
    };
  };

  /* =================== Team & account (owners) =================== */
  V.team = ({ r, me }) => {
    const team = PN.users().filter(u => u.rid === r.id);
    return {
      title: 'Team & account', sub: 'People who can sign in and change this restaurant.',
      acts: `<button class="btn pri" data-addu>${ico('plus', 'sm')}Add a team member</button>`,
      html: `<div class="card" id="requests" style="margin-bottom:16px"><div class="card-h"><h2>Requests to khabo</h2><span class="r"><button class="btn sm" data-ask>${ico('paper-plane-right', 'sm')}Ask for a change</button></span></div><div class="rows" style="padding:4px 0">${reqList(r)}</div></div>
        <div class="grid g-main"><div class="card"><div class="rows">${team.map(u => `<div class="row"><span class="av">${PN.initials(u.name)}</span><div><b>${esc(u.name)}${u.u === me.u ? ' <span class="badge ind">You</span>' : ''}${!u.hash && u.inv ? ` <span class="badge warn">${Date.now() > u.inv.exp ? 'Invite ran out' : 'Invited'}</span>` : ''}</b><span class="meta">${esc(u.u)}${u.contact ? ` · ${esc(u.contact)}` : ''} · ${!u.hash ? 'Has not joined yet' : u.active ? (u.last ? 'Last signed in ' + PN.ago(u.last) : 'Never signed in') : 'Turned off'}</span></div>${u.u === me.u ? '' : `<span style="display:flex;gap:6px">${!u.hash ? `<button class="btn sm" data-reinv="${esc(u.u)}">New code</button>` : ''}<button class="btn sm danger" data-rmu="${esc(u.u)}">Remove</button></span>`}</div>`).join('')}</div></div>
        <form class="card" data-pw novalidate><div class="card-h"><h2>Change your password</h2></div><div class="card-b stack">${PN.f.text('now', 'Current password', '', { type: 'password', attr: 'autocomplete="current-password"' })}${PN.f.text('next', 'New password', '', { type: 'password', hint: 'At least 6 characters', attr: 'autocomplete="new-password"' })}<button class="btn pri" style="justify-self:start">Update password</button></div></form></div>`,
      mount: el => {
        if (me.role === 'restaurant') { PN.seeReplies(r.id); PN.refreshSide(); }
        if (location.hash.endsWith('#requests')) $('#requests', el).scrollIntoView();
        $('[data-ask]', el).onclick = () => PN.askKhabo(r);
        $('#requests', el).addEventListener('click', async e => { const b = e.target.closest('[data-cancelq]'); if (!b) return; const q = PN.requests(r.id).find(x => x.id === b.closest('[data-q]').dataset.q); if (q && await PN.confirm({ title: 'Cancel this request?', text: 'The khabo team will no longer see it.', ok: 'Cancel request' }) && PN.cancelRequest(q)) { PN.toast('Request cancelled.'); PN.rerender(); } });
        $('[data-addu]', el).onclick = () => PN.userModal({ rid: r.id, lockRole: true });
        $$('[data-reinv]', el).forEach(b => b.onclick = () => { const u = PN.findUser(b.dataset.reinv), c = u && PN.reinvite(u); if (c) PN.inviteCard(u, c); });
        $$('[data-rmu]', el).forEach(b => b.onclick = async () => { if (!await PN.confirm({ title: `Remove ${b.dataset.rmu}?`, text: 'They will not be able to sign in any more.', ok: 'Remove', danger: true })) return; PN.removeUser(b.dataset.rmu); PN.toast('Team member removed.'); PN.rerender(); });
        $('[data-pw]', el).onsubmit = e => {
          e.preventDefault(); const v = PN.form(e.target);
          if (!PN.checkPw(me, v.now)) { PN.toast('Your current password is not right.', 'bad'); return; }
          if ((v.next || '').length < 6) { PN.toast('Use at least 6 characters.', 'bad'); return; }
          PN.setPassword(me, v.next); PN.log(r.id, 'Changed their password'); PN.save(); e.target.reset(); PN.toast('Password updated.');
        };
      }
    };
  };

  /* =================== Admin settings for one restaurant =================== */
  /* each card shows only to the levels that may use it (see PN.LEVELS) */
  const shrink = (src, w, q = .82) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { const k = Math.min(1, w / im.width), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q)); }; im.onerror = rej; im.src = src; });
  const pickFile = accept => new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => res(i.files[0] || null); i.click(); });
  const roomThumb = t => t.thumb || t.img || `${K.panoDir(t.pano)}${t.pano}-s.jpg`;
  V.settings = ctx => {
    const { r, admin } = ctx;
    if (!admin) return V.overview(ctx);
    const can = PN.can, accts = PN.users().filter(u => u.rid === r.id), b = PN.bill(r), tour = r.tour || [];
    const card = (t, body, o = {}) => `<div class="card" ${o.style ? `style="${o.style}"` : ''}><div class="card-h"><h2 ${o.red ? 'style="color:var(--red)"' : ''}>${t}</h2>${o.r ? `<span class="r">${o.r}</span>` : ''}</div>${body}</div>`;
    const lv = `<span class="badge ind">${PN.levelOf(PN.me())}</span>`;
    return {
      title: 'Admin settings', sub: 'Only the khabo team sees this tab. Owners cannot change anything here.', acts: lv,
      html: `<div class="grid g2">
        ${can('rest.admin') ? card('Visibility and labels', `<div class="card-b stack" style="gap:6px">
          ${PN.f.sw('live', 'Live on khabo', !r.hidden, { hint: 'Off hides the page, its dishes and its deals from the whole site' })}
          ${PN.f.sw('featured', 'Featured', r.featured, { hint: 'Shown first in lists, with a "Featured" label' })}
          ${PN.f.sw('founding', 'Founding Partner', r.founding, { hint: 'One of the first 50 restaurants' })}
          ${r.deal ? PN.f.sw('week', 'Deal of the week', r.deal.week, { hint: `Puts "${esc(L(r.deal))}" on the home page. Only one restaurant at a time.` }) : ''}
        </div>`) : ''}
        ${can('rest.admin') ? card('Web address and cuisine', `<div class="card-b stack">
          <div class="field"><label for="f-slug">Web address</label><div class="addr-in"><span>${PN.DOMAIN}/</span><input class="inp" id="f-slug" name="slug" value="${esc(r.slug || r.id)}" autocapitalize="off" spellcheck="false"></div><span class="hint">Small letters, numbers and dashes. Old addresses keep working, so printed QR codes never break.${(r.oldSlugs || []).length ? ` Old: ${r.oldSlugs.map(esc).join(', ')}` : ''}</span></div>
          <button class="btn sm" data-slug style="justify-self:start">Save address</button>
          <div class="field"><span class="lbl">Cuisine</span><div class="tchips" data-cu>${D.cuisines.map(c => `<button type="button" class="tchip ${(r.cuisines || []).includes(c.id) ? 'on' : ''}" data-k="${c.id}">${esc(c.en)}</button>`).join('')}</div><span class="hint">Diners filter by these. Saved as you tap.</span></div>
        </div>`) : ''}
        ${can('rest.admin') ? card('360° tour', `<div class="rows">${tour.map((t, i) => `<div class="row tour-row" data-room="${i}"><img class="thumb" src="${roomThumb(t)}" alt=""><div style="display:grid;gap:6px;min-width:0"><input class="inp sm" data-rname value="${esc(t.en)}" aria-label="Room name"><span class="meta">${t.img ? 'Uploaded here' : 'Shot by the khabo team'}${t.day ? ' · day and night' : ''}</span></div>
            <span style="display:flex;gap:4px"><button class="ibtn sm" data-rup ${i ? '' : 'disabled'} aria-label="Move up">${ico('caret-up', 'sm')}</button><button class="ibtn sm" data-rdn ${i < tour.length - 1 ? '' : 'disabled'} aria-label="Move down">${ico('caret-down', 'sm')}</button><button class="ibtn sm" data-rrm aria-label="Remove room">${ico('x', 'sm')}</button></span></div>`).join('') || `<div class="empty" style="padding:22px">${ico('virtual-reality')}<b>No tour yet</b>Add a room from a 360° photo.</div>`}</div>
          <div class="card-b" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn sm" data-addroom>${ico('plus', 'sm')}Add a room from a 360° photo</button><span class="meta">A 2:1 photo from a 360° camera. It is shrunk to fit this prototype.</span></div>`, { r: `<span class="meta">${tour.length} room${tour.length === 1 ? '' : 's'}</span>` }) : ''}
        ${can('rest.admin') ? card('Restaurant film', `<div class="card-b stack">
          ${r.film ? `<div class="film-row"><video src="${esc(r.film.src)}" muted playsinline preload="metadata"></video><div><b>Film is on</b><span class="meta">${esc(r.film.len || '')} · plays at the top of the page</span></div><button class="btn sm danger" data-filmoff>Remove</button></div>` : '<p class="meta">No film. The page opens with its cover photos.</p>'}
          <div class="field"><label for="f-film">Film link (MP4)</label><input class="inp" id="f-film" name="film" value="${esc(r.film ? r.film.src : '')}" placeholder="https://.../film.mp4"><span class="hint">A short silent film, 10 to 30 seconds. Use a link from khabo's video storage.</span></div>
          <button class="btn sm" data-film style="justify-self:start">Save film</button></div>`) : ''}
        ${can('billing') ? card('Plan', `<div class="card-b stack">
          ${PN.f.sel('plan', 'Plan', r.plan, Object.entries(PN.PLANS).map(([k, p]) => [k, `${p.name} · ${PN.tk(p.price)} a month`]))}
          <a class="btn" href="#/billing" style="justify-self:start">Open billing</a></div>`, { r: `<span class="badge ${b.status === 'paid' ? 'ok' : b.status === 'trial' ? 'ind' : b.status === 'due' ? 'warn' : 'bad'}">${{ paid: 'Paid', due: 'Due', overdue: 'Overdue', trial: 'Trial' }[b.status]}</span>` }) : ''}
        ${can('users.rest') ? card('Sign-in accounts', `<div class="rows">${accts.length ? accts.map(u => `<div class="row"><span class="av sm">${PN.initials(u.name)}</span><div><b>${esc(u.name)}</b><span class="meta">${esc(u.u)}${u.active ? '' : ' · turned off'}</span></div><a class="btn sm ghost" href="#/users">Manage</a></div>`).join('') : `<div class="empty" style="padding:24px">${ico('users')}<b>No accounts yet</b>Add one so the owner can sign in.</div>`}</div>`, { r: `<button class="btn sm" data-addu>${ico('plus', 'sm')}Add</button>` }) : ''}
        ${can('rest.delete') ? card('Delete restaurant', `<div class="card-b stack"><p class="meta">Removes the page, menu and deals from khabo and turns off its sign-in accounts. This cannot be undone.</p><button class="btn danger" data-delr style="justify-self:start">Delete ${esc(r.name.en)}</button></div>`, { red: true, style: 'border-color:color-mix(in srgb,var(--red) 30%,transparent)' }) : ''}
      </div>`,
      mount: el => {
        el.addEventListener('change', e => {
          const n = e.target.name; if (!n) return;
          if (n === 'live') { if (e.target.checked) delete r.hidden; else r.hidden = true; saved(r, e.target.checked ? 'Put the page live' : 'Hid the page from khabo', e.target.checked ? 'The page is live.' : 'The page is hidden from khabo.'); }
          if (n === 'featured' || n === 'founding') { if (e.target.checked) r[n] = true; else delete r[n]; saved(r, `${e.target.checked ? 'Turned on' : 'Turned off'} ${n === 'featured' ? 'Featured' : 'Founding Partner'}`, 'Saved.'); }
          if (n === 'week') {
            D.restaurants.forEach(x => { if (x !== r && (x.deals || []).some(d => d.week)) { x.deals.forEach(d => delete d.week); K.syncDeal(x); PN.saveR(x); } });
            const head = r.deal; (r.deals || []).forEach(d => delete d.week); if (e.target.checked && head) head.week = true; K.syncDeal(r);
            saved(r, e.target.checked ? 'Made its deal the deal of the week' : 'Removed it as deal of the week', 'Saved.');
          }
          if (n === 'plan') { if (PN.setPlan(r, e.target.value)) PN.toast('Plan updated.'); }
          if (['live', 'featured', 'founding', 'week', 'plan'].includes(n)) PN.rerender();
        });
        const on = (sel, fn) => { const x = $(sel, el); if (x) x.onclick = fn; };
        on('[data-addu]', () => PN.userModal({ rid: r.id }));
        on('[data-delr]', async () => {
          if (!await PN.confirm({ title: `Delete ${r.name.en}?`, text: 'The page, menu and deals leave khabo and its accounts are turned off. This cannot be undone.', ok: 'Delete restaurant', danger: true })) return;
          if (PN.deleteR(r.id) === false) return; PN.toast(`${r.name.en} was deleted.`); location.hash = '#/restaurants';
        });
        on('[data-slug]', () => {
          const v = $('#f-slug', el).value.trim().toLowerCase(), cur = r.slug || r.id;
          if (v === cur) return PN.toast('That is already the address.');
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) || v.length < 3 || v.length > 40) return PN.toast('Use 3 to 40 small letters, numbers and single dashes.', 'bad');
          if (PN.all().some(x => x !== r && (x.id === v || x.slug === v || (x.oldSlugs || []).includes(v)))) return PN.toast('Another restaurant already uses that address.', 'bad');
          r.oldSlugs = [...new Set([...(r.oldSlugs || []), cur])].filter(x => x !== v && x !== r.id); r.slug = v === r.id ? undefined : v; if (!r.slug) delete r.slug;
          saved(r, `Changed the web address to ${PN.DOMAIN}/${v}`, `New address: ${PN.DOMAIN}/${v}. The old one still works.`); PN.rerender();
        });
        const cu = $('[data-cu]', el);
        if (cu) cu.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; const list = (r.cuisines || []).slice(), i = list.indexOf(b.dataset.k); if (i >= 0) list.splice(i, 1); else list.push(b.dataset.k); if (!list.length) return PN.toast('Keep at least one cuisine.', 'bad'); r.cuisines = list; b.classList.toggle('on', i < 0); saved(r, `Set the cuisine to ${list.map(k => (D.cuisines.find(c => c.id === k) || {}).en).join(', ')}`, 'Cuisine saved.'); };
        /* 360 rooms */
        const rooms = () => { r.tour = r.tour || []; return r.tour; };
        el.addEventListener('click', async e => {
          const row = e.target.closest('[data-room]'); if (!row) return; const i = Number(row.dataset.room), t = rooms();
          if (e.target.closest('[data-rup]')) { t.splice(i - 1, 0, t.splice(i, 1)[0]); saved(r, 'Reordered the 360 tour', 'Order saved. The first room opens first.'); PN.rerender(); }
          if (e.target.closest('[data-rdn]')) { t.splice(i + 1, 0, t.splice(i, 1)[0]); saved(r, 'Reordered the 360 tour', 'Order saved. The first room opens first.'); PN.rerender(); }
          if (e.target.closest('[data-rrm]')) {
            if (!await PN.confirm({ title: `Remove ${t[i].en}?`, text: 'It leaves the 360 tour on the page.', ok: 'Remove room', danger: true })) return;
            const gone = t.splice(i, 1)[0]; t.forEach(x => x.spots = (x.spots || []).filter(s => s.to !== gone.id));
            if (!t.length) delete r.tour; saved(r, `Removed the 360 room ${gone.en}`, 'Room removed.'); PN.rerender();
          }
        });
        el.addEventListener('change', e => { const inp = e.target.closest('[data-rname]'); if (!inp) return; const t = rooms()[Number(inp.closest('[data-room]').dataset.room)]; const v = inp.value.trim(); if (!v) return; t.en = v; t.bn = t.bn || v; saved(r, `Renamed a 360 room to ${v}`, 'Room name saved.'); });
        on('[data-addroom]', async () => {
          const f = await pickFile('image/*'); if (!f) return;
          const url = URL.createObjectURL(f), im = new Image();
          im.onload = async () => {
            const ratio = im.width / im.height; URL.revokeObjectURL(url);
            if (ratio < 1.9 || ratio > 2.1) return PN.toast('That is not a 360° photo. It should be twice as wide as it is tall.', 'bad');
            const src = await new Promise(res => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.readAsDataURL(f); });
            const img = await shrink(src, 2560), thumb = await shrink(src, 360, .7);
            const n = rooms().length + 1, id = 'room-' + Date.now().toString(36);
            rooms().push({ id, en: `Room ${n}`, bn: `রুম ${n}`, pano: 'up-' + id, img, thumb, yaw: 0, spots: [] });
            K.panoUp[`up-${id}`] = { img, thumb };
            if (saved(r, 'Added a 360 room') !== false) PN.toast('Room added. Give it a name.'); PN.rerender();
          };
          im.onerror = () => PN.toast('Could not read that photo.', 'bad'); im.src = url;
        });
        on('[data-film]', () => {
          const v = $('#f-film', el).value.trim();
          if (!v) { delete r.film; saved(r, 'Removed the film', 'Film removed.'); PN.rerender(); return; }
          let u; try { u = new URL(v); } catch (x) { return PN.toast('That is not a link.', 'bad'); }
          if (u.protocol !== 'https:' || !/\.(mp4|webm)(\?|$)/i.test(u.pathname + u.search) && !/videos\.pexels\.com|player\.vimeo\.com/.test(u.hostname)) return PN.toast('Use an https link to an MP4 or WebM file.', 'bad');
          r.film = Object.assign({}, r.film, { src: u.href, poster: (r.film && r.film.poster) || r.hero[0], len: (r.film && r.film.len) || '0:15' });
          saved(r, 'Changed the film', 'Film saved.'); PN.rerender();
        });
        on('[data-filmoff]', async () => { if (!await PN.confirm({ title: 'Remove the film?', text: 'The page will open with its cover photos.', ok: 'Remove', danger: true })) return; delete r.film; saved(r, 'Removed the film', 'Film removed.'); PN.rerender(); });
      }
    };
  };
})();
