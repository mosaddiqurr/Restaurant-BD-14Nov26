/* Menu from a photo (RD-6).
   The owner or the khabo team uploads photos of the paper menu. The AI reads dishes, prices and categories into a draft.
   A person checks the draft and confirms. For an update, only the changes are shown, each with a tick box.
   Nothing goes live without a person confirming. Every price change goes into price history with who confirmed it.

   PROTOTYPE: there is no AI call here. "Reading" returns a ready-made draft built from the restaurant's own menu
   (one price up, one price unreadable, one new dish, one dish gone), and the sample photo is drawn from that draft.
   At go-live the photos go to a server function that sends them to Claude (see docs/2-product/27-new-features-brief.md). */
(function () {
  'use strict';
  const PN = window.PN, D = PN.D, $ = PN.$, $$ = PN.$$, ico = PN.ico, esc = PN.esc;

  /* the panel's language for these new screens (Bangla or English) */
  const LKEY = 'khabo.panel.lang';
  PN.lang = PN.lang || (() => { try { return localStorage.getItem(LKEY) || 'en'; } catch (e) { return 'en'; } });
  PN.setLang = PN.setLang || (v => { try { localStorage.setItem(LKEY, v); } catch (e) { } });
  PN.tt = PN.tt || ((en, bn) => PN.lang() === 'bn' ? bn : en);
  PN.langBtn = PN.langBtn || (() => `<button class="btn sm ghost" data-lang-t type="button">${PN.lang() === 'bn' ? 'English' : 'বাংলা'}</button>`);
  const tt = (en, bn) => PN.tt(en, bn);
  const BD = '০১২৩৪৫৬৭৮৯';
  const num = v => { const s = PN.n(v); return PN.lang() === 'bn' ? s.replace(/[0-9]/g, c => BD[c]) : s; };
  const tk = v => '৳' + num(Math.round(v));
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const slug = s => norm(s).replace(/ /g, '-') || 'dish';

  /* ---------- the ready-made draft (stands in for the AI result) ---------- */
  const NEW_MENU = [
    ['Rice', 'Mutton Kacchi', 'মাটন কাচ্চি', 380, 'Serves 1'], ['Rice', 'Chicken Biryani', 'চিকেন বিরিয়ানি', 260, 'Serves 1'], ['Rice', 'Beef Tehari', 'বিফ তেহারি', 220, 'Serves 1'],
    ['Kebab', 'Chicken Tikka', 'চিকেন টিক্কা', 200, '4 pieces'], ['Kebab', 'Beef Chap', 'বিফ চাপ', null, '1 piece'], ['Drinks', 'Borhani', 'বোরহানি', 70, '1 glass'], ['Drinks', 'Lassi', 'লাচ্চি', 90, '1 glass']
  ];
  function draftFor(r) {
    if (!r.menu.length) return NEW_MENU.map(([cat, en, bn, price, por]) => ({ cat, en, bn, price, por, unclear: price == null, keep: true }));
    const catName = d => (r.cats.find(c => c.id === d.cat) || r.cats[0] || { en: 'Menu' }).en;
    const rows = r.menu.map(d => ({ cat: catName(d), en: d.name.en, bn: d.name.bn, price: d.price, por: d.por.en, keep: true }));
    const bi = Math.max(0, r.menu.findIndex(d => d.best));
    rows[bi].price = rows[bi].price + (rows[bi].price >= 1000 ? 100 : 40);          /* the printed menu has a newer price */
    const ui = rows.findIndex((x, i) => i !== bi && i >= 2); if (ui >= 0) { rows[ui].price = null; rows[ui].unclear = true; }   /* a smudged price */
    if (rows.length > 4) rows.pop();                                                 /* a dish no longer on paper */
    const extra = [['Beef Tehari', 'বিফ তেহারি', 280], ['Chicken Roast', 'চিকেন রোস্ট', 240], ['Mango Lassi', 'আমের লাচ্চি', 140]].find(([en]) => !r.menu.some(d => norm(d.name.en) === norm(en)));
    if (extra) rows.splice(1, 0, { cat: rows[0].cat, en: extra[0], bn: extra[1], price: extra[2], por: 'Serves 1', keep: true });
    return rows;
  }

  /* ---------- a sample photo of the paper menu, drawn from the draft (no made-up food images) ---------- */
  function paperPhoto(r, rows, page, pages) {
    const c = document.createElement('canvas'), W = 900, H = 1200; c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#2B2622'; g.fillRect(0, 0, W, H);                                  /* the table it lies on */
    g.save(); g.translate(W / 2, H / 2); g.rotate((page % 2 ? 1 : -1) * 0.018); g.translate(-W / 2, -H / 2);
    g.fillStyle = '#F6EFDF'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 30; g.fillRect(60, 50, W - 120, H - 100); g.shadowBlur = 0;
    g.strokeStyle = (r.theme && r.theme.deep) || '#2A0C14'; g.lineWidth = 3; g.strokeRect(84, 74, W - 168, H - 148);
    g.fillStyle = (r.theme && r.theme.deep) || '#2A0C14'; g.textAlign = 'center';
    g.font = '700 46px Georgia, serif'; g.fillText(r.name.en || 'Menu', W / 2, 160);
    g.font = '28px "Noto Sans Bengali", sans-serif'; g.fillText(r.name.bn || '', W / 2, 205);
    g.font = '20px Georgia, serif'; g.fillText(`Page ${page + 1} of ${pages}`, W / 2, H - 100);
    let y = 270, cat = null;
    rows.forEach(x => {
      if (x.cat !== cat) { cat = x.cat; y += 18; g.textAlign = 'left'; g.font = 'italic 700 30px Georgia, serif'; g.fillStyle = (r.theme && r.theme.deep) || '#2A0C14'; g.fillText(cat, 120, y); y += 46; }
      g.textAlign = 'left'; g.fillStyle = '#2A2320'; g.font = '26px Georgia, serif'; g.fillText(x.en, 120, y);
      g.font = '20px "Noto Sans Bengali", sans-serif'; g.fillStyle = '#5A4E44'; g.fillText(x.bn || '', 120, y + 28);
      g.strokeStyle = 'rgba(42,35,32,.35)'; g.setLineDash([2, 6]); g.beginPath(); g.moveTo(120 + g.measureText(x.en).width + 160, y - 6); g.lineTo(W - 230, y - 6); g.stroke(); g.setLineDash([]);
      g.textAlign = 'right'; g.font = '700 28px Georgia, serif'; g.fillStyle = '#2A2320';
      if (x.price != null) g.fillText('Tk ' + x.price, W - 120, y);
      else { g.fillText('Tk 3', W - 160, y); g.fillStyle = 'rgba(70,55,40,.55)'; g.beginPath(); g.ellipse(W - 140, y - 10, 34, 18, -0.3, 0, Math.PI * 2); g.fill(); }  /* a smudge */
      y += 74;
    });
    g.restore();
    return c.toDataURL('image/jpeg', 0.86);
  }

  /* ---------- what changes against the live menu ---------- */
  function diff(r, rows) {
    const live = new Map(r.menu.map(d => [norm(d.name.en), d])), seen = new Set(), out = [];
    rows.forEach((x, i) => {
      const d = live.get(norm(x.en));
      if (d) { seen.add(d); if (x.price != null && x.price !== d.price) out.push({ kind: 'price', d, x, i, keep: true }); }
      else out.push({ kind: 'new', x, i, keep: true });
    });
    r.menu.forEach(d => { if (!seen.has(d)) out.push({ kind: 'gone', d, keep: true }); });
    return out;
  }
  const guessType = en => { const n = norm(en); const hit = Object.keys(D.types).find(k => n.includes(k) || n.includes(norm(D.types[k].en).split(' ')[0])); return hit || (/(lassi|borhani|juice|shake)/.test(n) ? 'drink' : /(tea|coffee|cha)/.test(n) ? 'tea' : /(roast|curry|rezala|korma)/.test(n) ? 'curry' : 'curry'); };
  const catFor = (r, name) => { let c = r.cats.find(z => norm(z.en) === norm(name)); if (!c) { c = { id: slug(name) + '-' + Date.now().toString(36).slice(-3), en: name, bn: name }; r.cats.push(c); } return c.id; };
  const newDish = (r, x) => ({ id: slug(x.en) + '-' + Date.now().toString(36).slice(-4), type: guessType(x.en), name: { en: x.en, bn: x.bn || x.en }, price: Math.round(x.price), p: null, por: { en: x.por || 'Serves 1', bn: x.por || '১ জন' }, spice: 0, cat: catFor(r, x.cat) });

  /* ---------- the flow: pick photos → reading → draft → (update) changes → confirm ---------- */
  PN.menuPhoto = r => {
    let photos = [], rows = null, step = 'pick', page = 0, changes = null, closeIt = null;
    const isNew = !r.menu.length;
    const body = () => {
      if (step === 'pick') return `<div class="mp">
        <p class="mp-lead">${tt('Take a clear photo of every page of the paper menu. You will check everything before it goes live.', 'কাগজের মেনুর প্রতিটি পাতার পরিষ্কার ছবি তুলুন। লাইভ হওয়ার আগে সব আপনি দেখে নেবেন।')}</p>
        <div class="mp-drop"><button class="btn pri" type="button" data-add>${ico('camera', 'sm')}${tt('Add menu photos', 'মেনুর ছবি দিন')}</button><button class="btn" type="button" data-sample>${ico('image', 'sm')}${tt('Use the sample menu photo', 'নমুনা মেনুর ছবি নিন')}</button><span class="meta">${tt('JPG or PNG, up to 6 pages', 'JPG বা PNG, ৬ পাতা পর্যন্ত')}</span></div>
        ${photos.length ? `<div class="mp-thumbs">${photos.map((p, i) => `<figure><img src="${p}" alt="${tt('Menu page', 'মেনুর পাতা')} ${i + 1}"><figcaption>${tt('Page', 'পাতা')} ${num(i + 1)}</figcaption><button type="button" class="ibtn sm" data-rmp="${i}" aria-label="${tt('Remove', 'বাদ দিন')}">${ico('x', 'sm')}</button></figure>`).join('')}</div>` : ''}
        <p class="mp-note">${ico('info', 'sm')}${tt('Prototype: reading uses a ready-made draft, not a real AI call.', 'প্রোটোটাইপ: পড়ার কাজে আগে থেকে তৈরি একটি খসড়া দেখানো হয়, আসল এআই নয়।')}</p></div>`;
      if (step === 'read') return `<div class="mp mp-reading"><div class="mp-scan"><img src="${photos[0]}" alt=""><i></i></div><p class="t-shimmer" data-text="${tt('Reading the menu', 'মেনু পড়া হচ্ছে')}">${tt('Reading the menu', 'মেনু পড়া হচ্ছে')}</p><p class="meta">${tt(`${photos.length} photo${photos.length > 1 ? 's' : ''}: dishes, prices and categories`, `${num(photos.length)}টি ছবি: খাবার, দাম আর ক্যাটাগরি`)}</p></div>`;
      const viewer = `<div class="mp-view"><div class="mp-pages">${photos.map((p, i) => `<button type="button" class="${i === page ? 'on' : ''}" data-pg="${i}">${tt('Page', 'পাতা')} ${num(i + 1)}</button>`).join('')}</div><img src="${photos[page]}" alt="${tt('Menu page', 'মেনুর পাতা')} ${page + 1}"></div>`;
      if (step === 'draft') {
        const bad = rows.filter(x => x.price == null || x.price === '').length;
        return `<div class="mp-split">${viewer}<div class="mp-draft">
          <div class="mp-dh"><b>${tt(`Draft: ${rows.length} dishes`, `খসড়া: ${num(rows.length)}টি খাবার`)}</b>${bad ? `<span class="mp-warn">${ico('warning', 'sm')}${tt(`${bad} price${bad > 1 ? 's' : ''} could not be read. Fix in the marigold boxes.`, `${num(bad)}টি দাম পড়া যায়নি। হলুদ ঘরে ঠিক করুন।`)}</span>` : `<span class="mp-ok">${ico('check-circle', 'sm')}${tt('Every price is filled in', 'সব দাম দেওয়া আছে')}</span>`}</div>
          <div class="mp-head"><span>${tt('Category', 'ক্যাটাগরি')}</span><span>${tt('Name (English)', 'নাম (ইংরেজি)')}</span><span>${tt('Name (Bangla)', 'নাম (বাংলা)')}</span><span>${tt('Price', 'দাম')}</span><span>${tt('Portion', 'পরিমাণ')}</span></div>
          ${rows.map((x, i) => `<div class="mp-row ${x.price == null || x.price === '' ? 'unclear' : ''}" data-i="${i}">
            <input class="inp" data-k="cat" value="${esc(x.cat)}" aria-label="${tt('Category', 'ক্যাটাগরি')}"><input class="inp" data-k="en" value="${esc(x.en)}" aria-label="${tt('Name (English)', 'নাম (ইংরেজি)')}"><input class="inp bn" data-k="bn" value="${esc(x.bn)}" aria-label="${tt('Name (Bangla)', 'নাম (বাংলা)')}">
            <label class="mp-price"><span>৳</span><input class="inp num" data-k="price" type="number" min="1" inputmode="numeric" value="${x.price == null ? '' : x.price}" placeholder="${tt('Not readable', 'পড়া যায়নি')}" aria-label="${tt('Price', 'দাম')}"></label>
            <input class="inp" data-k="por" value="${esc(x.por || '')}" aria-label="${tt('Portion', 'পরিমাণ')}"></div>`).join('')}
        </div></div>`;
      }
      /* changes (update) */
      const line = (c, j) => {
        const what = c.kind === 'price' ? `<b>${esc(c.d.name.en)}</b> <span class="mp-was">${tk(c.d.price)}</span> ${ico('arrow-right', 'sm')} <b class="num">${tk(c.x.price)}</b>`
          : c.kind === 'new' ? `<span class="mp-tag new">${tt('New', 'নতুন')}</span><b>${esc(c.x.en)}</b> <span class="meta">${esc(c.x.cat)}</span> <b class="num">${tk(c.x.price)}</b>`
            : `<span class="mp-tag gone">${tt('Gone', 'বাদ')}</span><b>${esc(c.d.name.en)}</b> <span class="meta">${tt('not on the new paper menu', 'নতুন কাগজের মেনুতে নেই')}</span>`;
        return `<label class="mp-ch"><input type="checkbox" data-c="${j}" ${c.keep ? 'checked' : ''}><span>${what}</span></label>`;
      };
      return `<div class="mp-split">${viewer}<div class="mp-draft">
        <div class="mp-dh"><b>${changes.length ? tt(`${changes.length} change${changes.length > 1 ? 's' : ''} from your live menu`, `লাইভ মেনু থেকে ${num(changes.length)}টি পরিবর্তন`) : tt('No changes: the paper menu matches your live menu.', 'কোনো পরিবর্তন নেই: কাগজের মেনু আর লাইভ মেনু একই।')}</b><span class="meta">${tt('Untick anything you do not want to change.', 'যা বদলাতে চান না তার টিক তুলে দিন।')}</span></div>
        ${['price', 'new', 'gone'].map(k => { const list = changes.map((c, j) => [c, j]).filter(([c]) => c.kind === k); return list.length ? `<p class="mp-sub">${{ price: tt('Price changed', 'দাম বদলেছে'), new: tt('New dishes', 'নতুন খাবার'), gone: tt('Removed dishes', 'বাদ পড়া খাবার') }[k]}</p>${list.map(([c, j]) => line(c, j)).join('')}` : ''; }).join('')}
      </div></div>`;
    };
    const foot = () => {
      if (step === 'pick') return `<span class="l">${PN.langBtn()}</span><button class="btn ghost" data-cancel>${tt('Cancel', 'বাতিল')}</button><button class="btn pri" data-read ${photos.length ? '' : 'disabled'}>${ico('sparkle', 'sm')}${tt('Read the menu', 'মেনু পড়ুন')}</button>`;
      if (step === 'read') return '';
      const bad = rows.filter(x => x.price == null || x.price === '').length;
      if (step === 'draft') return `<span class="l">${PN.langBtn()}</span><button class="btn ghost" data-back>${tt('Back', 'পেছনে')}</button>${isNew
        ? `<button class="btn pri" data-confirm ${bad ? 'disabled' : ''}>${ico('check', 'sm')}${tt(`Confirm and save ${rows.length} dishes`, `নিশ্চিত করে ${num(rows.length)}টি খাবার রাখুন`)}</button>`
        : `<button class="btn pri" data-next ${bad ? 'disabled' : ''}>${tt('See the changes', 'পরিবর্তন দেখুন')}${ico('arrow-right', 'sm')}</button>`}`;
      const n = changes.filter(c => c.keep).length;
      return `<span class="l">${PN.langBtn()}</span><button class="btn ghost" data-back>${tt('Back to the draft', 'খসড়ায় ফিরুন')}</button><button class="btn pri" data-confirm ${n ? '' : 'disabled'}>${ico('check', 'sm')}${tt(`Confirm ${n} change${n === 1 ? '' : 's'}`, `${num(n)}টি পরিবর্তন নিশ্চিত করুন`)}</button>`;
    };
    const paint = box => { $('.dw-b', box).innerHTML = body(); const f = $('.dw-f', box); f.innerHTML = foot(); f.hidden = !f.innerHTML; $('h2', box).textContent = tt('Menu from a photo', 'ছবি থেকে মেনু'); };
    const apply = () => {
      const me = (PN.me() || {}).name || 'Someone';
      if (isNew) {
        rows.forEach(x => r.menu.push(newDish(r, x)));
        PN.saveR(r, `Added ${rows.length} dishes from a menu photo (checked by ${me})`);
        PN.toast(tt(`${rows.length} dishes are on your menu.`, `${num(rows.length)}টি খাবার মেনুতে যোগ হয়েছে।`));
      } else {
        const keep = changes.filter(c => c.keep); let p = 0, a = 0, g = 0;
        keep.forEach(c => {
          if (c.kind === 'price') { PN.priceChange(r, c.d, Math.round(c.x.price)); p++; }        /* saved in price history with who confirmed it */
          if (c.kind === 'new') { r.menu.push(newDish(r, c.x)); a++; }
          if (c.kind === 'gone') { const i = r.menu.indexOf(c.d); if (i >= 0) r.menu.splice(i, 1); g++; }
        });
        PN.saveR(r, `Menu photo update: ${[p && `${p} price change${p > 1 ? 's' : ''}`, a && `${a} new`, g && `${g} removed`].filter(Boolean).join(', ')} (checked by ${me})`);
        PN.toast(tt(`${keep.length} change${keep.length > 1 ? 's are' : ' is'} live on your page.`, `${num(keep.length)}টি পরিবর্তন আপনার পেজে লাইভ।`));
      }
      closeIt(); PN.rerender(); PN.refreshSide && PN.refreshSide();
    };
    PN.modal({
      title: tt('Menu from a photo', 'ছবি থেকে মেনু'), body: body(), foot: foot(),
      mount: (box, close) => {
        closeIt = close; box.classList.add('mp-modal');
        box.addEventListener('click', async e => {
          const t = e.target.closest('button'); if (!t) return;
          if (t.matches('[data-lang-t]')) { PN.setLang(PN.lang() === 'bn' ? 'en' : 'bn'); return paint(box); }
          if (t.matches('[data-cancel]')) return close();
          if (t.matches('[data-add]')) { const got = await PN.pickPhotos(true); photos = photos.concat(got || []).slice(0, 6); return paint(box); }
          if (t.matches('[data-sample]')) { const d = draftFor(r), half = Math.ceil(d.length / 2); photos = (d.length > 6 ? [d.slice(0, half), d.slice(half)] : [d]).map((part, i, all) => paperPhoto(r, part, i, all.length)); rows = d; return paint(box); }
          if (t.dataset.rmp != null) { photos.splice(Number(t.dataset.rmp), 1); return paint(box); }
          if (t.matches('[data-read]')) { step = 'read'; paint(box); rows = rows || draftFor(r); setTimeout(() => { step = 'draft'; paint(box); }, 1800); return; }
          if (t.dataset.pg != null) { page = Number(t.dataset.pg); return paint(box); }
          if (t.matches('[data-back]')) { step = step === 'changes' ? 'draft' : 'pick'; return paint(box); }
          if (t.matches('[data-next]')) { changes = diff(r, rows); step = 'changes'; return paint(box); }
          if (t.matches('[data-confirm]')) return apply();
        });
        /* edits in the draft table */
        box.addEventListener('input', e => {
          const inp = e.target.closest('[data-k]'); if (inp) { const row = inp.closest('[data-i]'), x = rows[Number(row.dataset.i)], k = inp.dataset.k; x[k] = k === 'price' ? (inp.value === '' ? null : Number(inp.value)) : inp.value; if (k === 'price') { row.classList.toggle('unclear', x.price == null || !(x.price > 0)); if (!(x.price > 0)) x.price = null; const f = $('.dw-f', box); f.innerHTML = foot(); const dh = $('.mp-dh', box); if (dh) { const bad = rows.filter(z => z.price == null).length; dh.lastElementChild.outerHTML = bad ? `<span class="mp-warn">${ico('warning', 'sm')}${tt(`${bad} price${bad > 1 ? 's' : ''} could not be read. Fix in the marigold boxes.`, `${num(bad)}টি দাম পড়া যায়নি। হলুদ ঘরে ঠিক করুন।`)}</span>` : `<span class="mp-ok">${ico('check-circle', 'sm')}${tt('Every price is filled in', 'সব দাম দেওয়া আছে')}</span>`; } } }
        });
        box.addEventListener('change', e => { const c = e.target.closest('[data-c]'); if (c) { changes[Number(c.dataset.c)].keep = c.checked; $('.dw-f', box).innerHTML = foot(); } });
      }
    });
  };
})();
