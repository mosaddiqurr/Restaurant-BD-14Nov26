/* Events (D-12): live music, match screenings, iftar specials, festival menus.
   Owners add and remove them here. Each event hides from diners by itself once it ends.
   Saved on the restaurant (r.events) like every other change, so the site shows them straight away. */
(function () {
  'use strict';
  const PN = window.PN, D = PN.D, $ = PN.$, $$ = PN.$$, ico = PN.ico, esc = PN.esc;
  const V = PN.views.rest;
  const tt = (en, bn) => PN.tt(en, bn);
  const TYPES = {
    music: ['Live music', 'লাইভ মিউজিক', 'microphone'], match: ['Match screening', 'খেলা দেখা', 'broadcast'],
    iftar: ['Iftar special', 'ইফতার স্পেশাল', 'moon-stars'], festival: ['Festival menu', 'উৎসবের মেনু', 'confetti'], other: ['Other', 'অন্যান্য', 'calendar-blank']
  };
  PN.EVENT_TYPES = TYPES;
  const BD = '০১২৩৪৫৬৭৮৯', dg = s => PN.lang() === 'bn' ? String(s).replace(/[0-9]/g, c => BD[c]) : String(s);
  const when = ev => {
    const s = new Date(ev.start), e = new Date(ev.end), loc = PN.lang() === 'bn' ? 'bn-BD' : 'en-GB';
    const d = s.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' }), tm = x => x.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
    const sameDay = s.toDateString() === e.toDateString();
    return sameDay ? `${d}, ${tm(s)} ${tt('to', 'থেকে')} ${tm(e)}` : `${d} ${tt('to', 'থেকে')} ${e.toLocaleDateString(loc, { day: 'numeric', month: 'short' })}`;
  };
  const state = ev => { const n = Date.now(), s = +new Date(ev.start), e = +new Date(ev.end); return e < n ? 'ended' : s <= n ? 'now' : 'soon'; };
  const pad = n => String(n).padStart(2, '0');
  const local = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  const card = (r, ev) => {
    const st = state(ev), ty = TYPES[ev.type] || TYPES.other;
    return `<div class="ev-row ${st === 'ended' ? 'ended' : ''}" data-ev="${esc(ev.id)}">
      <div class="ev-ph">${ev.p ? `<img src="${PN.src(ev.p, 400)}" alt="">` : `<span>${ico(ty[2])}</span>`}</div>
      <div class="ev-t"><span class="ev-type">${ico(ty[2], 'sm')}${tt(ty[0], ty[1])}</span><b>${esc(tt(ev.en, ev.bn || ev.en))}</b>
        <span class="meta">${ico('calendar-blank', 'sm')}${when(ev)}</span>
        <span class="meta">${ev.price ? `${tt('Entry', 'এন্ট্রি')} ৳${dg(PN.n(ev.price))}` : tt('Free entry', 'ফ্রি এন্ট্রি')}${st === 'ended' ? ` · ${tt('Ended, hidden from diners', 'শেষ, ডাইনারদের কাছে লুকানো')}` : st === 'now' ? ` · <b class="ev-now">${tt('On now', 'এখন চলছে')}</b>` : ''}</span></div>
      <div class="ev-a"><button class="btn sm" data-edit>${ico('sliders-horizontal', 'sm')}${tt('Edit', 'বদলান')}</button><button class="btn sm ghost" data-del>${ico('x', 'sm')}${tt('Remove', 'সরান')}</button></div>
    </div>`;
  };

  function form(r, ev, done) {
    const isNew = !ev; ev = ev || { type: 'music', start: Date.now() + 2 * 864e5, end: Date.now() + 2 * 864e5 + 3 * 36e5 };
    let photo = ev.p || null;
    const pics = Array.from(new Set([].concat(r.hero || [], (r.gallery || {}).inside || [], (r.gallery || {}).food || []))).slice(0, 8);
    const body = `<form class="stack" data-f novalidate>
      <div class="f-grid">${PN.f.text('en', tt('Title (English)', 'শিরোনাম (ইংরেজি)'), ev.en || '', { req: true, ph: 'e.g. Acoustic Friday on the roof' })}${PN.f.text('bn', tt('Title (Bangla)', 'শিরোনাম (বাংলা)'), ev.bn || '', { bn: true, ph: 'যেমন ছাদে অ্যাকোস্টিক শুক্রবার' })}</div>
      ${PN.f.sel('type', tt('Type', 'ধরন'), ev.type, Object.entries(TYPES).map(([k, v]) => [k, tt(v[0], v[1])]))}
      <div class="f-grid">${PN.f.text('start', tt('Starts', 'শুরু'), local(ev.start), { type: 'datetime-local', req: true })}${PN.f.text('end', tt('Ends', 'শেষ'), local(ev.end), { type: 'datetime-local', req: true, hint: tt('It hides from diners after this.', 'এর পরে ডাইনারদের কাছে লুকিয়ে যাবে।') })}</div>
      ${PN.f.money('price', tt('Entry price (optional)', 'এন্ট্রি দাম (ঐচ্ছিক)'), ev.price || null, { hint: tt('Leave empty for free entry.', 'ফ্রি হলে খালি রাখুন।') })}
      <div class="f-grid">${PN.f.area('desc', tt('Short note (English, optional)', 'ছোট বিবরণ (ইংরেজি, ঐচ্ছিক)'), ev.desc ? ev.desc.en : '', { rows: 2 })}${PN.f.area('descbn', tt('Short note (Bangla, optional)', 'ছোট বিবরণ (বাংলা, ঐচ্ছিক)'), ev.desc ? ev.desc.bn : '', { rows: 2, bn: true })}</div>
      <div class="field"><span class="lbl">${tt('Photo', 'ছবি')}</span><div class="ev-pick">${pics.map(p => `<button type="button" class="${p === photo ? 'on' : ''}" data-pic="${esc(p)}"><img src="${PN.src(p, 160)}" alt=""></button>`).join('')}<button type="button" class="ev-up" data-up>${ico('camera')}<span>${tt('Upload', 'আপলোড')}</span></button></div><span class="hint">${tt('A real photo of your place or the event. No AI images.', 'আপনার জায়গা বা ইভেন্টের আসল ছবি। এআই ছবি নয়।')}</span></div>
      <p class="err" data-err hidden></p>
    </form>`;
    PN.drawer({
      title: isNew ? tt('Add an event', 'ইভেন্ট যোগ করুন') : tt('Edit event', 'ইভেন্ট বদলান'), body,
      foot: `<span class="l">${PN.langBtn()}</span><button class="btn ghost" data-cancel>${tt('Cancel', 'বাতিল')}</button><button class="btn pri" data-save>${isNew ? tt('Add event', 'ইভেন্ট যোগ করুন') : tt('Save', 'রাখুন')}</button>`,
      mount: (box, close) => {
        const paintPics = () => $$('[data-pic]', box).forEach(b => b.classList.toggle('on', b.dataset.pic === photo));
        box.addEventListener('click', async e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.pic) { photo = b.dataset.pic; paintPics(); }
          if (b.matches('[data-up]')) { const [p] = await PN.pickPhotos(false); if (p) { photo = p; const x = document.createElement('button'); x.type = 'button'; x.dataset.pic = p; x.innerHTML = `<img src="${p}" alt="">`; b.before(x); paintPics(); } }
          if (b.matches('[data-cancel]')) close();
          if (b.matches('[data-lang-t]')) { PN.setLang(PN.lang() === 'bn' ? 'en' : 'bn'); close(); form(r, isNew ? null : ev, done); }
          if (b.matches('[data-save]')) {
            const f = PN.form($('[data-f]', box)), err = $('[data-err]', box), s = +new Date(f.start), en = +new Date(f.end);
            const bad = !f.en ? tt('Add a title in English.', 'ইংরেজিতে শিরোনাম দিন।') : !s || !en ? tt('Add a start and an end time.', 'শুরু আর শেষের সময় দিন।') : en <= s ? tt('The end must be after the start.', 'শেষের সময় শুরুর পরে হতে হবে।') : en < Date.now() ? tt('This time has already passed.', 'এই সময় পার হয়ে গেছে।') : '';
            if (bad) { err.textContent = bad; err.hidden = false; return; }
            const o = { id: ev.id || (f.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4)), en: f.en, bn: f.bn || f.en, type: f.type, start: f.start, end: f.end, p: photo || null };
            if (f.price) o.price = Math.round(f.price);
            if (f.desc || f.descbn) o.desc = { en: f.desc || f.descbn, bn: f.descbn || f.desc };
            r.events = (r.events || []).filter(x => x.id !== o.id).concat(o).sort((a, b) => +new Date(a.start) - +new Date(b.start));
            if (PN.saveR(r, `${isNew ? 'Added' : 'Edited'} the event "${o.en}"`)) PN.toast(isNew ? tt('Event added. Diners can see it now.', 'ইভেন্ট যোগ হয়েছে। ডাইনাররা এখন দেখতে পাবেন।') : tt('Event saved.', 'ইভেন্ট রাখা হয়েছে।'));
            close(); done();
          }
        });
      }
    });
  }

  V.events = ({ r }) => {
    const list = (r.events || []).slice().sort((a, b) => +new Date(a.start) - +new Date(b.start));
    const live = list.filter(ev => state(ev) !== 'ended'), past = list.filter(ev => state(ev) === 'ended');
    return {
      title: tt('Events', 'ইভেন্ট'),
      sub: tt('Live music, match screenings, iftar specials and festival menus. They show on your page, the Events page and Home, and hide by themselves when they end. With no events, nothing shows.', 'লাইভ মিউজিক, খেলা দেখা, ইফতার স্পেশাল আর উৎসবের মেনু। এগুলো আপনার পেজ, ইভেন্ট পেজ আর হোমে দেখায়, শেষ হলে নিজেই লুকিয়ে যায়। কোনো ইভেন্ট না থাকলে কিছুই দেখায় না।'),
      acts: `${PN.langBtn()}<button class="btn pri" data-add>${ico('plus', 'sm')}${tt('Add event', 'ইভেন্ট যোগ করুন')}</button>`,
      html: `<div class="card"><div class="card-h"><h2>${tt('Upcoming and on now', 'আসছে আর এখন চলছে')}</h2><span class="meta">${live.length}</span></div>
          ${live.length ? `<div class="ev-list">${live.map(ev => card(r, ev)).join('')}</div>` : `<div class="empty" style="padding:30px">${ico('calendar-blank')}<b>${tt('No events yet', 'এখনো কোনো ইভেন্ট নেই')}</b>${tt('Add one and diners will see it on your page.', 'একটি যোগ করুন, ডাইনাররা আপনার পেজে দেখতে পাবেন।')}</div>`}</div>
        ${past.length ? `<div class="card" style="margin-top:16px"><div class="card-h"><h2>${tt('Ended', 'শেষ হয়েছে')}</h2><span class="meta">${tt('Hidden from diners', 'ডাইনারদের কাছে লুকানো')}</span></div><div class="ev-list">${past.map(ev => card(r, ev)).join('')}</div></div>` : ''}`,
      mount: el => {
        const again = () => PN.rerender();
        el.addEventListener('click', async e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.matches('[data-lang-t]')) { PN.setLang(PN.lang() === 'bn' ? 'en' : 'bn'); return again(); }
          if (b.matches('[data-add]')) return form(r, null, again);
          const row = b.closest('[data-ev]'); if (!row) return;
          const ev = (r.events || []).find(x => x.id === row.dataset.ev); if (!ev) return;
          if (b.matches('[data-edit]')) return form(r, ev, again);
          if (b.matches('[data-del]') && await PN.confirm({ title: tt('Remove this event?', 'এই ইভেন্ট সরাবেন?'), text: esc(tt(ev.en, ev.bn || ev.en)) + tt(' will no longer show to diners.', ' আর ডাইনারদের কাছে দেখাবে না।'), ok: tt('Remove', 'সরান'), danger: true })) {
            r.events = (r.events || []).filter(x => x !== ev);
            if (PN.saveR(r, `Removed the event "${ev.en}"`)) PN.toast(tt('Event removed.', 'ইভেন্ট সরানো হয়েছে।'));
            again();
          }
        });
      }
    };
  };
})();
