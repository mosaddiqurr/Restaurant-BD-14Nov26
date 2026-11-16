/* khabo panels: pages only the khabo team (admin) sees.
   To change one restaurant, the admin opens it from Restaurants and gets the same pages the owner has (rest.js). */
(function () {
  'use strict';
  const PN = window.PN, D = PN.D, $ = PN.$, $$ = PN.$$, ico = PN.ico, esc = PN.esc, L = PN.L;
  const V = PN.views.admin = {};
  const STATUS = { paid: ['Paid', 'ok'], due: ['Due', 'warn'], overdue: ['Overdue', 'bad'], trial: ['Trial', 'ind'] };
  const planBadge = p => `<span class="badge ${p === 'premium' ? 'gold' : p === 'pro' ? 'ind' : ''}">${(PN.PLANS[p] || { name: p }).name}</span>`;

  /* ---------- add a user (also used by restaurant owners for their team) ---------- */
  PN.userModal = (o = {}) => {
    const me = PN.me(), owner = me.role !== 'admin';
    const rs = PN.all().slice().sort((a, b) => a.name.en.localeCompare(b.name.en));
    PN.modal({
      title: owner ? 'Add a team member' : 'Add a user',
      body: `<div class="f-grid">${PN.f.text('name', 'Full name', '', { full: true, req: true })}${PN.f.text('contact', 'Mobile number or email', '', { hint: 'Their own. They can sign in with it, and in the real build the invite code is sent here.', attr: 'autocapitalize="off" spellcheck="false" inputmode="email"' })}${PN.f.text('u', 'Username', '', { hint: 'Small letters and numbers', attr: 'autocapitalize="off" spellcheck="false"' })}
        ${owner || o.lockRole || !PN.can('users.admin') ? '' : PN.f.sel('role', 'Account type', o.rid ? 'restaurant' : 'support', [['restaurant', 'Restaurant (one restaurant only)'], ...Object.entries(PN.LEVELS).map(([k, l]) => [k, `khabo team · ${l.name}: ${l.note}`])], { full: true })}
        ${owner ? '' : `<div class="full" data-rwrap ${o.rid || o.lockRole || !PN.can('users.admin') ? '' : 'hidden'}>${PN.f.sel('rid', 'Restaurant', o.rid || rs[0].id, rs.map(r => [r.id, `${r.name.en} · ${PN.L(PN.area(r.area))}`]))}</div>`}</div>
        <p class="meta" style="margin-top:12px">${owner ? `They will be able to change ${esc(PN.r(me.rid).name.en)} only. ` : ''}You will get a 6-digit invite code for them. They sign in with it once and choose their own password, so nobody else ever knows it.</p>`,
      foot: `<button class="btn ghost l" data-c>Cancel</button><button class="btn pri" data-ok>Create invite</button>`,
      mount: (box, close) => {
        const role = $('[name=role]', box), wrap = $('[data-rwrap]', box);
        if (role && wrap) role.onchange = () => { wrap.hidden = role.value !== 'restaurant'; };
        $('[data-c]', box).onclick = close;
        $('[data-ok]', box).onclick = () => {
          const v = PN.form($('.dw-b', box)), u = (v.u || '').toLowerCase();
          const r = owner ? me.rid : (v.role || 'restaurant') === 'restaurant' ? (v.rid || o.rid) : null, level = r ? undefined : v.role;
          if (!v.name) return PN.toast('Add their name.', 'bad');
          if (!/^[a-z0-9._-]{3,}$/.test(u)) return PN.toast('Username: at least 3 small letters or numbers, no spaces.', 'bad');
          if (PN.users().some(x => x.u === u)) return PN.toast('That username is taken.', 'bad');
          const contact = PN.contactOf(v.contact);
          if (!contact) return PN.toast('Add their mobile number (01XXXXXXXXX) or email.', 'bad');
          if (PN.findUser(contact)) return PN.toast('Someone already uses that number or email.', 'bad');
          const code = PN.addUser({ u, name: v.name, contact, role: r ? 'restaurant' : 'admin', level, rid: r || undefined }); if (!code) return;
          close(); PN.rerender(); PN.inviteCard(PN.findUser(u), code);
        };
      }
    });
  };

  /* the code is shown once, with a ready message to send on WhatsApp or SMS */
  PN.inviteCard = (u, code) => {
    const link = new URL('index.html', location.href).href, msg = `Hi ${u.name.split(' ')[0]}, you are invited to the khabo panel${u.rid ? ` for ${PN.r(u.rid).name.en}` : ''}. Open ${link}, tap "I have an invite code", type ${u.contact || u.u} and the code ${code}. The code works for ${PN.INVITE_DAYS} days.`;
    PN.modal({
      title: `Invite for ${u.name}`,
      body: `<div class="inv"><span class="meta">Invite code</span><b class="num">${code.slice(0, 3)} ${code.slice(3)}</b><span class="meta">Works for ${PN.INVITE_DAYS} days, once. You will not see it again.</span></div>
        <p class="meta" style="margin:14px 0 8px">Send them this message. In the real build khabo sends the code to ${esc(u.contact || 'them')} by itself.</p><textarea class="inp" rows="4" readonly>${esc(msg)}</textarea>`,
      foot: `<button class="btn ghost l" data-c>Done</button>${/^\+880/.test(u.contact || '') ? `<a class="btn" href="https://wa.me/${u.contact.slice(1)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${ico('whatsapp-logo', 'sm')}WhatsApp</a>` : ''}<button class="btn pri" data-cp>${ico('check', 'sm')}Copy message</button>`,
      mount: (box, close) => { $('[data-c]', box).onclick = close; $('[data-cp]', box).onclick = () => PN.copy(msg, 'Message copied.'); }
    });
  };

  /* ---------- add a restaurant ---------- */
  const addRestaurant = (pre = {}) => {
    PN.modal({
      title: 'Add a restaurant',
      body: `<div class="f-grid">${PN.f.text('en', 'Name (English)', pre.name || '', { req: true })}${PN.f.text('bn', 'Name (Bangla)', '', { bn: true })}
        ${PN.f.sel('area', 'Area', pre.area || D.areas[0].id, D.areas.map(a => [a.id, `${a.en}, ${D.cities[a.city].en}`]))}${PN.f.sel('plan', 'Plan', 'starter', Object.entries(PN.PLANS).map(([k, p]) => [k, p.name]))}
        ${PN.f.text('phone', 'Phone', pre.phone || '', { type: 'tel', full: true })}</div>
        <div class="field"><span class="lbl">Cuisines</span><div class="tchips" data-cu>${D.cuisines.map(c => `<button type="button" class="tchip" data-k="${c.id}">${esc(c.en)}</button>`).join('')}</div></div>
        <p class="dw-sub">Owner sign-in (optional)</p><div class="f-grid">${PN.f.text('u', 'Username', '', { attr: 'autocapitalize="off"' })}${PN.f.text('p', 'Password', '')}</div>
        <div class="alert info">${ico('info')}<div class="meta">New restaurants start hidden. Add the menu and photos, then switch it live in Admin settings.</div></div>`,
      foot: `<button class="btn ghost l" data-c>Cancel</button><button class="btn pri" data-ok>Add restaurant</button>`,
      mount: (box, close) => {
        const cu = [];
        $('[data-cu]', box).onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; const i = cu.indexOf(b.dataset.k); if (i >= 0) cu.splice(i, 1); else cu.push(b.dataset.k); b.classList.toggle('on', i < 0); };
        $('[data-c]', box).onclick = close;
        $('[data-ok]', box).onclick = () => {
          const v = PN.form($('.dw-b', box));
          if (!v.en) return PN.toast('Give the restaurant a name.', 'bad');
          const u = (v.u || '').toLowerCase();
          if (u && (!/^[a-z0-9._-]{3,}$/.test(u) || PN.users().some(x => x.u === u))) return PN.toast('That username is not valid or is taken.', 'bad');
          if (u && (v.p || '').length < 6) return PN.toast('Password: at least 6 characters.', 'bad');
          let id = PN.slug(v.en); while (PN.r(id)) id += '-2';
          const area = PN.area(v.area), near = PN.all().filter(x => x.area === v.area || x.city === area.city);
          const geo = near.length ? [near.reduce((a, x) => a + x.geo[0], 0) / near.length + .002, near.reduce((a, x) => a + x.geo[1], 0) / near.length + .002] : [23.78, 90.4];
          const now = new Date();
          const r = {
            id, name: { en: v.en, bn: v.bn || v.en }, mono: (PN.initials(v.en) + v.en.replace(/\s/g, '').slice(1, 2).toUpperCase()).slice(0, 2), since: now.getFullYear(),
            area: v.area, city: area.city, geo, spot: { en: area.en, bn: area.bn }, address: { en: `${area.en}, ${D.cities[area.city].en}`, bn: `${area.bn}, ${D.cities[area.city].bn}` },
            phone: v.phone || '', cuisines: cu.length ? cu : ['bangladeshi'], theme: { deep: '#14192B', accent: '#F5A300', font: 'sans' },
            tagline: { en: '', bn: '' }, story: { en: '', bn: '' }, rating: 0, reviews: 0, verified: 0, ppl: [300, 700], hours: ['11:00', '23:00'],
            vat: 5, service: 0, seats: 40, fac: [], pay: ['Cash', 'bKash'], plan: v.plan, checked: 0, checkedAt: Date.now(), mediaDate: { en: now.toLocaleString('en', { month: 'short', year: 'numeric' }), bn: '' },
            hero: ['in'], gallery: { inside: [], outside: [], kitchen: [], food: [] }, signature: [], cats: [{ id: 'main', en: 'Mains', bn: 'মূল খাবার' }], menu: [], hidden: true
          };
          if (PN.addR(r) === false) return;
          if (u) PN.addUser({ u, p: v.p, name: `${v.en} owner`, role: 'restaurant', rid: id });
          if (pre.lead) { pre.lead.stage = 'won'; pre.lead.rid = id; PN.save(); }
          close(); PN.toast(`${v.en} was added. Next: its menu.`); location.hash = `#/rest/${id}/menu`;
        };
      }
    });
  };

  /* =================== Overview =================== */
  V.overview = () => {
    const rs = PN.all(), liveRs = rs.filter(r => !r.hidden), stale = rs.filter(r => r.checked >= 30);
    const revs = PN.reviews(), flagged = revs.filter(v => PN.revState(v).flagged && !v.hidden), low = revs.filter(v => v.st <= 3 && !v.reply && !v.hidden);
    const bills = rs.map(r => ({ r, b: PN.bill(r) })), mrr = bills.filter(x => x.b.status !== 'trial').reduce((a, x) => a + PN.PLANS[x.r.plan].price, 0);
    const overdue = bills.filter(x => x.b.status === 'overdue'), leads = PN.leads().filter(l => l.stage !== 'won');
    const att = [
      ...stale.map(r => ({ r, i: 'receipt', t: `Prices last confirmed ${PN.days(r.checked)}`, k: 'bad', go: `#/rest/${r.id}/menu`, b: 'Check menu' })),
      ...overdue.map(x => ({ r: x.r, i: 'credit-card', t: `${PN.PLANS[x.r.plan].name} payment overdue`, k: 'bad', go: '#/billing', b: 'Billing' })),
      ...flagged.map(v => ({ r: PN.r(v.r), i: 'warning', t: `Review by ${v.who} reported by the restaurant`, k: 'warn', go: '#/reviews', b: 'Review' })),
      ...rs.filter(r => r.hidden).map(r => ({ r, i: 'eye', t: 'Hidden from khabo', k: '', go: `#/rest/${r.id}/settings`, b: 'Settings' }))
    ].filter(x => x.r);
    const byPlan = Object.keys(PN.PLANS).map(k => [k, rs.filter(r => r.plan === k).length]), pmax = Math.max(1, ...byPlan.map(x => x[1]));
    const byCity = Object.keys(D.cities).map(k => [D.cities[k].en, rs.filter(r => r.city === k).length]);
    const logs = PN.logs().slice(0, 7);
    return {
      title: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${esc(PN.me().name.split(' ')[0])}`, sub: 'Everything on khabo today.',
      acts: PN.can('rest.add') ? `<button class="btn pri" data-addr>${ico('plus', 'sm')}Add restaurant</button>` : '',
      html: `${reqCard()}<div class="grid g4">
          <div class="card stat hl"><div class="k">${ico('storefront', 'sm')}Restaurants live</div><div class="v num">${liveRs.length}</div><div class="d">${rs.length - liveRs.length} hidden · ${rs.reduce((a, r) => a + r.menu.length, 0)} dishes</div></div>
          ${PN.can('billing') ? `<div class="card stat"><div class="k">${ico('credit-card', 'sm')}Monthly plan revenue</div><div class="v num">${PN.tk(mrr)}</div><div class="d">${overdue.length} overdue · sample payments</div></div>` : `<div class="card stat"><div class="k">${ico('briefcase', 'sm')}Restaurants in talks</div><div class="v num">${leads.length}</div><div class="d">sales leads</div></div>`}
          <div class="card stat"><div class="k">${ico('receipt', 'sm')}Menus to check</div><div class="v num">${stale.length}</div><div class="d">prices older than 30 days</div></div>
          <div class="card stat"><div class="k">${ico('chat-circle-dots', 'sm')}Reviews to watch</div><div class="v num">${flagged.length + low.length}</div><div class="d">${flagged.length} reported · ${low.length} low without reply</div></div>
        </div>
        <div class="grid g-main" style="margin-top:16px">
          <div class="card"><div class="card-h"><h2>Needs attention</h2><span class="meta">${att.length} item${att.length === 1 ? '' : 's'}</span></div><div class="rows" style="padding:6px 0">${att.length ? att.slice(0, 8).map(x => `<a class="row click" href="${x.go}">${PN.mono(x.r)}<div><b>${esc(x.r.name.en)}</b><span class="meta">${esc(x.t)}</span></div><span class="badge ${x.k}">${x.b}</span></a>`).join('') : `<div class="empty">${ico('check-circle')}<b>Nothing needs attention</b>All menus are fresh and payments are in.</div>`}</div></div>
          <div class="stack" style="align-content:start">
            <div class="card"><div class="card-h"><h2>Restaurants by plan</h2></div><div class="card-b stack" style="gap:12px">${byPlan.map(([k, n]) => `<div style="display:grid;grid-template-columns:80px 1fr 24px;gap:10px;align-items:center"><span style="font-weight:650">${PN.PLANS[k].name}</span><div class="meter"><i style="--w:${Math.round(n / pmax * 100)}"></i></div><span class="num meta">${n}</span></div>`).join('')}<div class="meta">${byCity.map(([c, n]) => `${n} in ${c}`).join(' · ')}</div></div></div>
            <div class="card"><div class="card-h"><h2>Sales pipeline</h2><a class="r btn sm ghost" href="#/leads">Open</a></div><div class="card-b"><div class="v num" style="font-size:28px;font-weight:780">${leads.length} <span class="meta" style="font-size:14px;font-weight:600">restaurants in talks</span></div><div class="meta" style="margin-top:4px">${['new', 'contacted', 'visited', 'trial'].map(s => `${PN.leads().filter(l => l.stage === s).length} ${s}`).join(' · ')}</div></div></div>
          </div>
        </div>
        <div class="card" style="margin-top:16px"><div class="card-h"><h2>Latest activity</h2><a class="r btn sm ghost" href="#/activity">See all</a></div><div class="rows" style="padding:6px 0">${logs.length ? logs.map(actRow).join('') : `<div class="empty">${ico('clock')}<b>No changes yet</b>Every change by the team or a restaurant shows here.</div>`}</div></div>`,
      mount: el => { const a = $('[data-addr]', el); if (a) a.onclick = () => addRestaurant(); reqMount(el); }
    };
  };
  /* owners ask for changes they cannot make themselves (a new name, a new area, a new 360 shoot...).
     They land here and in the Requests page; the menu shows how many are waiting. */
  PN.reqWhat = q => q.kind === 'name' ? `New name: “${esc(q.data.en)}”${q.data.bn ? ` / <span class="bn">${esc(q.data.bn)}</span>` : ''}` : esc((q.data && q.data.text) || '');
  const STATE = { open: ['Waiting', 'warn'], done: ['Done', 'ok'], declined: ['Declined', 'bad'], cancelled: ['Cancelled', ''] };
  const reqRow = (q, act) => { const r = PN.r(q.rid); if (!r) return ''; return `<div class="row rq" data-q="${q.id}">${PN.mono(r)}<div><b>${esc(r.name.en)} · ${esc(PN.REQ[q.kind] || q.kind)}</b><span class="rq-w">${PN.reqWhat(q)}</span><span class="meta">${esc(q.by)} · ${PN.ago(q.at)}${q.note ? ` · “${esc(q.note)}”` : ''}${q.state !== 'open' && q.doneBy ? ` · ${STATE[q.state][0]} by ${esc(q.doneBy)} ${PN.ago(q.doneAt)}${q.reply ? `: “${esc(q.reply)}”` : ''}` : ''}</span></div>${act ? `<span class="rq-a">${q.kind !== 'name' ? `<a class="btn sm ghost" href="#/rest/${r.id}/settings">Open settings</a>` : ''}<button class="btn sm ghost" data-no>Decline</button><button class="btn sm pri" data-yes>${q.kind === 'name' ? 'Approve' : 'Mark done'}</button></span>` : `<span class="badge ${STATE[q.state][1]}">${STATE[q.state][0]}</span>`}</div>`; };
  const reqCard = () => {
    const qs = PN.openRequests(); if (!qs.length || !PN.can('rest.admin')) return '';
    return `<div class="card rq-card" style="margin-bottom:16px"><div class="card-h"><h2>Requests from restaurants</h2><span class="badge gold">${qs.length} waiting</span><a class="r btn sm ghost" href="#/requests">See all</a></div><div class="rows" style="padding:4px 0">${qs.slice(0, 3).map(q => reqRow(q, true)).join('')}</div></div>`;
  };
  /* Approve / Mark done / Decline asks for a short answer the owner will read */
  const reqMount = el => el.addEventListener('click', e => {
    const row = e.target.closest('[data-q]'); if (!row) return; const q = PN.requests().find(x => x.id === row.dataset.q); const ok = !!e.target.closest('[data-yes]'); if (!q || !ok && !e.target.closest('[data-no]')) return;
    const r = PN.r(q.rid), verb = ok ? (q.kind === 'name' ? 'Approve' : 'Mark done') : 'Decline';
    PN.modal({
      title: `${verb}: ${r.name.en}`, body: `<p class="meta" style="margin-bottom:12px">${esc(PN.REQ[q.kind] || q.kind)}. ${PN.reqWhat(q)}</p>${ok && q.kind !== 'name' ? `<div class="alert info" style="margin-bottom:12px">${ico('info')}<div>Make the change in <a href="#/rest/${r.id}/settings">Admin settings</a> first, then mark it done here.</div></div>` : ''}${PN.f.area('reply', 'Message to the owner (optional)', '', { full: true, rows: 3, ph: ok ? 'e.g. Done. The new name shows everywhere now.' : 'e.g. We need a trade licence with the new name first.' })}`,
      foot: `<button class="btn ghost l" data-c>Cancel</button><button class="btn ${ok ? 'pri' : 'danger solid'}" data-go>${verb}</button>`,
      mount: (box, close) => { $('[data-c]', box).onclick = close; $('[data-go]', box).onclick = () => { if (PN.resolveRequest(q, ok, $('[name=reply]', box).value.trim())) { close(); PN.toast(ok ? (q.kind === 'name' ? `Name changed to ${q.data.en}. The owner has been told.` : 'Marked done. The owner has been told.') : 'Declined. The owner has been told.'); PN.rerender(); } }; }
    });
  });
  V.requests = () => {
    const open = PN.openRequests(), past = PN.requests().filter(q => q.state !== 'open' && PN.r(q.rid)).slice(0, 40);
    return {
      title: 'Requests', sub: 'Changes restaurants asked for that only the khabo team can make. New ones pop up in every open admin tab.',
      html: `<div class="card"><div class="card-h"><h2>Waiting</h2>${open.length ? `<span class="badge gold">${open.length}</span>` : ''}</div><div class="rows" style="padding:4px 0">${open.map(q => reqRow(q, true)).join('') || `<div class="empty">${ico('check-circle')}<b>Nothing waiting</b>When a restaurant asks for a change, it shows here.</div>`}</div></div>
        ${past.length ? `<div class="card" style="margin-top:16px"><div class="card-h"><h2>Answered</h2></div><div class="rows" style="padding:4px 0">${past.map(q => reqRow(q, false)).join('')}</div></div>` : ''}`,
      mount: reqMount
    };
  };
  const actRow = x => { const r = x.rid && PN.r(x.rid); return `<div class="act"><span class="av sm" style="${x.role === 'restaurant' && r ? `background:${r.theme.deep};color:${r.theme.accent}` : ''}">${PN.initials(x.who)}</span><div><b>${esc(x.who)}</b> <span style="color:var(--ink-2)">${esc(x.what)}</span>${r ? ` <span class="meta">· ${esc(r.name.en)}</span>` : ''}</div><span class="meta">${PN.ago(x.at)}</span></div>`; };

  /* =================== Restaurants =================== */
  let rq = '', rcity = 'all', rplan = 'all';
  V.restaurants = () => {
    const rows = () => PN.all().filter(r => (rcity === 'all' || r.city === rcity) && (rplan === 'all' || r.plan === rplan) && (!rq || (r.name.en + ' ' + r.name.bn + ' ' + PN.where(r)).toLowerCase().includes(rq.toLowerCase())))
      .map(r => `<tr class="click" data-go="#/rest/${r.id}/overview"><td class="who-td"><div class="who">${PN.mono(r)}<div><b>${esc(r.name.en)}</b><span class="meta">${esc(L(r.spot))}</span></div></div></td>
        <td data-k="Area">${esc(PN.where(r))}</td><td data-k="Plan">${planBadge(r.plan)}</td>
        <td data-k="Status">${r.hidden ? '<span class="badge">Hidden</span>' : '<span class="badge ok"><i class="dot"></i>Live</span>'}</td>
        <td data-k="Prices">${r.checked >= 30 ? `<span class="badge bad">${PN.days(r.checked)}</span>` : `<span class="meta">${PN.days(r.checked)}</span>`}</td>
        <td class="r num" data-k="Dishes">${r.menu.length}</td><td class="r num" data-k="Rating">${r.rating ? r.rating.toFixed(1) : 'New'}</td>
        <td class="r end"><a class="ibtn sm" href="${PN.page(r)}" target="_blank" rel="noopener" aria-label="View ${esc(r.name.en)} on khabo">${ico('arrow-up-right', 'sm')}</a></td></tr>`).join('');
    return {
      title: 'Restaurants', sub: `${PN.all().length} restaurants. ${PN.can('rest.edit') ? 'Open one to change anything on it.' : 'Open one to see how it is doing.'}`,
      acts: PN.can('rest.add') ? `<button class="btn pri" data-addr>${ico('plus', 'sm')}Add restaurant</button>` : '',
      html: `<div class="card"><div class="toolbar"><div class="search">${ico('magnifying-glass', 'sm')}<input class="inp" type="search" placeholder="Search by name or area" value="${esc(rq)}" data-q aria-label="Search restaurants"></div>
          <div class="seg" data-city>${[['all', 'All cities'], ...Object.entries(D.cities).map(([k, c]) => [k, c.en])].map(([k, l]) => `<button class="${rcity === k ? 'on' : ''}" data-k="${k}">${l}</button>`).join('')}</div>
          <select class="sel sm" style="width:auto" data-plan aria-label="Plan">${[['all', 'All plans'], ...Object.entries(PN.PLANS).map(([k, p]) => [k, p.name])].map(([k, l]) => `<option value="${k}" ${rplan === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="tbl-wrap"><table class="tbl tbl-m"><thead><tr><th>Restaurant</th><th>Area</th><th>Plan</th><th>Status</th><th>Prices checked</th><th class="r">Dishes</th><th class="r">Rating</th><th></th></tr></thead><tbody data-rows>${rows()}</tbody></table></div></div>`,
      mount: el => {
        const paint = () => { $('[data-rows]', el).innerHTML = rows() || `<tr><td colspan="8"><div class="empty">${ico('magnifying-glass')}<b>No restaurant matches</b>Try another name or filter.</div></td></tr>`; };
        $('[data-q]', el).oninput = e => { rq = e.target.value; paint(); };
        $$('[data-city] button', el).forEach(b => b.onclick = () => { rcity = b.dataset.k; $$('[data-city] button', el).forEach(x => x.classList.toggle('on', x === b)); paint(); });
        $('[data-plan]', el).onchange = e => { rplan = e.target.value; paint(); };
        $('[data-rows]', el).addEventListener('click', e => { if (e.target.closest('a')) return; const tr = e.target.closest('[data-go]'); if (tr) location.hash = tr.dataset.go; });
        const a = $('[data-addr]', el); if (a) a.onclick = () => addRestaurant();
      }
    };
  };

  /* =================== Users =================== */
  V.users = () => {
    const me = PN.me(), us = PN.users().slice().sort((a, b) => (a.role === b.role ? 0 : a.role === 'admin' ? -1 : 1) || a.u.localeCompare(b.u));
    const levelBadge = u => u.role === 'admin' ? `<span class="badge ${(u.level || 'master') === 'master' ? 'gold' : 'ind'}">${PN.levelOf(u)}</span>` : '<span class="badge">Restaurant</span>';
    const scope = u => u.role === 'admin' ? `<span class="meta">${esc(PN.LEVELS[u.level || 'master'].note)}</span>` : (u.rid && PN.r(u.rid)) ? `<span style="display:inline-flex;gap:8px;align-items:center">${PN.mono(PN.r(u.rid), 'sm')}${esc(PN.r(u.rid).name.en)}</span>` : '<span class="meta">Deleted restaurant</span>';
    const shown = us.filter(u => u.role === 'restaurant' ? PN.can('users.rest') || PN.can('users.admin') : true);
    return {
      title: 'Team & users', sub: 'Everyone who can sign in. Restaurant accounts only see their own restaurant. The khabo team has levels; only a Master can manage team accounts.',
      acts: `<button class="btn pri" data-addu>${ico('plus', 'sm')}Add ${PN.can('users.admin') ? 'user' : 'restaurant account'}</button>`,
      html: `<div class="lv-grid">${Object.entries(PN.LEVELS).map(([k, l]) => `<div class="card lv"><b>${l.name}</b><span class="meta">${esc(l.note)}</span><span class="lv-n">${us.filter(u => u.role === 'admin' && (u.level || 'master') === k).length}</span></div>`).join('')}</div>
      <div class="card" style="margin-top:16px"><div class="tbl-wrap"><table class="tbl tbl-m"><thead><tr><th>User</th><th>Level</th><th>Can change</th><th>Last signed in</th><th>Active</th><th></th></tr></thead><tbody>
        ${shown.map(u => { const self = u.u === me.u, ok = PN.canManage(u) && !self && !PN.isLastMaster(u), locked = u.lockUntil > Date.now(); return `<tr data-u="${esc(u.u)}"><td class="who-td"><div class="who"><span class="av">${PN.initials(u.name)}</span><div><b>${esc(u.name)}${self ? ' <span class="badge ind">You</span>' : ''}${locked ? ' <span class="badge bad">Locked</span>' : ''}</b><span class="meta">${esc(u.u)}</span></div></div></td>
          <td data-k="Level">${levelBadge(u)}</td>
          <td data-k="Can change">${scope(u)}</td>
          <td class="meta" data-k="Last">${!u.hash && u.inv ? '<span class="badge warn">Invited</span>' : u.last ? PN.ago(u.last) : 'Never'}</td>
          <td data-k="Active"><span class="sw"><input type="checkbox" data-act ${u.active ? 'checked' : ''} ${ok ? '' : 'disabled'} aria-label="${esc(u.u)} can sign in"><i></i></span></td>
          <td class="r end" style="white-space:nowrap">${PN.canManage(u) ? `${u.role === 'admin' && PN.can('users.admin') && !self && !PN.isLastMaster(u) ? `<select class="sel sm" data-lv style="width:auto" aria-label="Level for ${esc(u.u)}">${Object.entries(PN.LEVELS).map(([k, l]) => `<option value="${k}" ${(u.level || 'master') === k ? 'selected' : ''}>${l.name}</option>`).join('')}</select>` : ''}${locked ? '<button class="btn sm ghost" data-unlock>Unlock</button>' : ''}<button class="btn sm ghost" data-pw>Reset password</button>` : ''}${ok ? `<button class="ibtn sm" data-rm aria-label="Remove ${esc(u.u)}">${ico('x', 'sm')}</button>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div></div>
      <div class="alert info" style="margin-top:16px">${ico('shield-check')}<div><b>How sign-in is protected</b><div class="meta">Passwords are stored salted and hashed, never as typed. Five wrong tries lock an account for 10 minutes. The khabo team is signed out after 30 minutes without activity, and a new password signs the person out everywhere. Every page and every change is checked against the person's level. In the real product this all runs on the server, with a phone code as a second step for the khabo team.</div></div></div>`,
      mount: el => {
        $('[data-addu]', el).onclick = () => PN.userModal();
        el.addEventListener('change', e => {
          const row = e.target.closest('[data-u]'); if (!row) return; const u = PN.users().find(x => x.u === row.dataset.u);
          if (!PN.canManage(u) || u === me || PN.isLastMaster(u)) { PN.denied('this account'); PN.rerender(); return; }
          if (e.target.matches('[data-act]')) { u.active = e.target.checked; if (!u.active) u.sv = (u.sv || 0) + 1; PN.log(u.rid || null, `${u.active ? 'Turned on' : 'Turned off'} user ${u.u}`); PN.save(); PN.toast(u.active ? `${u.u} can sign in again.` : `${u.u} can no longer sign in and was signed out.`); PN.rerender(); }
          if (e.target.matches('[data-lv]')) { u.level = e.target.value; u.sv = (u.sv || 0) + 1; PN.log(null, `Made ${u.u} a ${PN.LEVELS[u.level].name}`); PN.save(); PN.toast(`${u.u} is now ${PN.LEVELS[u.level].name}. They need to sign in again.`); PN.rerender(); }
        });
        el.addEventListener('click', async e => {
          const row = e.target.closest('[data-u]'); if (!row) return; const u = PN.users().find(x => x.u === row.dataset.u);
          if (!PN.canManage(u)) return;
          if (e.target.closest('[data-unlock]')) { delete u.lockUntil; u.fails = 0; PN.log(u.rid || null, `Unlocked ${u.u}`); PN.save(); PN.toast(`${u.u} can try again.`); PN.rerender(); }
          if (e.target.closest('[data-rm]')) { if (await PN.confirm({ title: `Remove ${u.u}?`, text: `${esc(u.name)} will not be able to sign in. This cannot be undone.`, ok: 'Remove user', danger: true })) { if (PN.removeUser(u.u)) PN.toast('User removed.'); PN.rerender(); } }
          if (e.target.closest('[data-pw]')) { if (!await PN.confirm({ title: `New invite code for ${u.u}?`, text: `${esc(u.name)} is signed out everywhere, their old password stops working, and they choose a new one with the code.`, ok: 'Make a new code' })) return; const c = PN.resetToInvite(u); if (c) { PN.rerender(); PN.inviteCard(u, c); } }
        });
      }
    };
  };

  /* =================== Reviews (all restaurants) =================== */
  let arF = 'attention';
  V.reviews = () => {
    const all = PN.reviews();
    const F = [['attention', 'Needs attention', v => !v.hidden && (PN.revState(v).flagged || (v.st <= 2))], ['all', 'All', () => true], ['low', '3 stars or less', v => v.st <= 3], ['flagged', 'Reported', v => PN.revState(v).flagged], ['hidden', 'Hidden', v => v.hidden]];
    const f = F.find(x => x[0] === arF) || F[0], list = all.filter(f[2]);
    return {
      title: 'Reviews', sub: 'Every review on khabo. Hide reviews that break the rules; owners reply from their panel.',
      html: `<div class="card"><div class="toolbar"><div class="fchips">${F.map(([k, l, fn]) => `<button class="fchip ${arF === k ? 'on' : ''}" data-f="${k}">${l}<span>${all.filter(fn).length}</span></button>`).join('')}</div></div>
        ${list.length ? list.map(v => { const r = PN.r(v.r); if (!r) return ''; const st = PN.revState(v); return `<article class="rv ${v.hidden ? 'hidden-rv' : ''}" data-i="${all.indexOf(v)}"><div class="rv-h">${PN.mono(r)}<div><b>${esc(v.who)} <span class="meta" style="display:inline">on</span> <a href="#/rest/${r.id}/reviews">${esc(r.name.en)}</a></b><span class="meta">${esc(L(v.when))}${v.vf ? ' · Verified visit' : ''}</span></div><div class="r">${st.flagged ? '<span class="badge warn">Reported</span>' : ''}${v.hidden ? '<span class="badge bad">Hidden</span>' : ''}${PN.stars(v.st)}</div></div>
          <p class="rv-t">${esc(v.t)}</p>${v.reply ? `<div class="rv-reply"><b>Reply from ${esc(r.name.en)}</b><p class="rv-t">${esc(L(v.reply))}</p></div>` : ''}
          <div class="rv-acts"><button class="btn sm ${v.hidden ? '' : 'danger'}" data-hide>${v.hidden ? 'Show again' : 'Hide review'}</button>${st.flagged ? '<button class="btn sm ghost" data-clear>Keep it, clear report</button>' : ''}</div></article>`; }).join('') : `<div class="empty">${ico('check-circle')}<b>Nothing here</b>No reviews in this group.</div>`}</div>`,
      mount: el => {
        $$('[data-f]', el).forEach(b => b.onclick = () => { arF = b.dataset.f; PN.rerender(); });
        el.addEventListener('click', e => {
          const a = e.target.closest('[data-i]'); if (!a) return; const v = all[Number(a.dataset.i)];
          if (e.target.closest('[data-hide]')) { PN.setRev(v, { hidden: !v.hidden, flagged: false }, `${v.hidden ? 'Showed' : 'Hid'} the review by ${v.who}`); PN.toast(v.hidden ? 'Review hidden from khabo.' : 'Review is visible again.'); PN.refreshSide(); PN.rerender(); }
          if (e.target.closest('[data-clear]')) { PN.setRev(v, { flagged: false }, `Cleared the report on the review by ${v.who}`); PN.toast('Report cleared. The review stays.'); PN.rerender(); }
        });
      }
    };
  };

  /* =================== Plans & billing =================== */
  V.billing = () => {
    const rows = PN.all().map(r => ({ r, b: PN.bill(r), p: PN.PLANS[r.plan] }));
    const sum = s => rows.filter(x => x.b.status === s).reduce((a, x) => a + x.p.price, 0);
    return {
      title: 'Plans & billing', sub: 'Monthly plans. Payments come by bKash or Nagad and are confirmed by hand for now.',
      html: `<div class="grid g4">${[['paid', 'Paid this month', 'check-circle'], ['due', 'Due', 'clock'], ['overdue', 'Overdue', 'warning'], ['trial', 'On free trial', 'gift']].map(([s, l, i]) => `<div class="card stat"><div class="k">${ico(i, 'sm')}${l}</div><div class="v num">${s === 'trial' ? rows.filter(x => x.b.status === 'trial').length : PN.tk(sum(s))}</div><div class="d">${rows.filter(x => x.b.status === s).length} restaurant${rows.filter(x => x.b.status === s).length === 1 ? '' : 's'}</div></div>`).join('')}</div>
        <div class="card" style="margin-top:16px"><div class="tbl-wrap"><table class="tbl tbl-m"><thead><tr><th>Restaurant</th><th>Plan</th><th class="r">Monthly</th><th>Paid by</th><th>Status</th><th></th></tr></thead><tbody>
        ${rows.map(({ r, b, p }) => `<tr data-r="${r.id}"><td class="who-td"><div class="who">${PN.mono(r)}<div><b>${esc(r.name.en)}</b><span class="meta">${esc(PN.where(r))}</span></div></div></td>
          <td data-k="Plan"><select class="sel sm" data-plan aria-label="Plan for ${esc(r.name.en)}" style="width:auto">${Object.entries(PN.PLANS).map(([k, x]) => `<option value="${k}" ${r.plan === k ? 'selected' : ''}>${x.name}</option>`).join('')}</select></td>
          <td class="r num" data-k="Monthly" style="font-weight:700">${PN.tk(p.price)}</td><td data-k="By">${b.method}</td>
          <td data-k="Status"><span class="badge ${STATUS[b.status][1]}">${STATUS[b.status][0]}</span></td>
          <td class="r end" style="white-space:nowrap">${b.status === 'paid' ? '<span class="meta">Up to date</span>' : `${b.status !== 'trial' ? '<button class="btn sm ghost" data-remind>Send reminder</button>' : ''}<button class="btn sm" data-paid>${b.status === 'trial' ? 'Start paid plan' : 'Mark as paid'}</button>`}</td></tr>`).join('')}
        </tbody></table></div></div>
        <p class="meta" style="margin-top:12px">Sample payment states. Prices follow the pricing sheet (Dhaka rates).</p>`,
      mount: el => {
        el.addEventListener('change', e => { if (!e.target.matches('[data-plan]')) return; const r = PN.r(e.target.closest('[data-r]').dataset.r); if (!PN.setPlan(r, e.target.value)) return; PN.toast(`${r.name.en} is now on ${PN.PLANS[r.plan].name}.`); PN.rerender(); });
        el.addEventListener('click', e => {
          const tr = e.target.closest('[data-r]'); if (!tr) return; const r = PN.r(tr.dataset.r), b = PN.bill(r);
          if (e.target.closest('[data-paid]')) { b.status = 'paid'; PN.log(r.id, `Confirmed payment of ${PN.tk(PN.PLANS[r.plan].price)}`); PN.save(); PN.toast(`Payment from ${r.name.en} confirmed.`); PN.rerender(); }
          if (e.target.closest('[data-remind]')) { PN.log(r.id, 'Sent a payment reminder'); PN.save(); PN.toast(`Reminder sent to ${r.name.en} (prototype: nothing is really sent).`); }
        });
      }
    };
  };

  /* =================== Leads =================== */
  /* Restaurants the sales team is talking to. Board (drag a card to the next stage) or list.
     Each lead keeps a follow-up date and a short history of notes, so nobody forgets to call back. */
  const STAGES = [['new', 'New', '#6C7293'], ['contacted', 'Contacted', '#2A3DB8'], ['visited', 'Visited', '#7A4FD0'], ['trial', 'On trial', '#C27A00'], ['won', 'Signed', '#12804A']];
  const stageOf = k => STAGES.find(s => s[0] === k) || STAGES[0];
  const isoDay = n => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const fmtDay = v => new Date(v + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const LEAD_SEED = { l1: { n: 2 }, l2: { n: -1, plan: 'pro' }, l3: { n: 0, plan: 'pro' }, l4: { d: '2026-11-30', plan: 'starter' }, l5: { n: 4 }, l6: { plan: 'starter' } };
  const leadFix = x => {
    if (!x.at) { const h = PN.hash(x.id), s = LEAD_SEED[x.id] || {}; x.at = Date.now() - (4 + h % 20) * 864e5; x.upd = Date.now() - (h % 4) * 864e5 - 36e5; if (!('next' in x)) x.next = s.d || (s.n != null ? isoDay(s.n) : ''); if (!('plan' in x)) x.plan = s.plan || ''; }
    if (!x.hist) x.hist = x.note ? [{ at: x.upd || x.at, who: 'khabo team', what: x.note }] : [];
    return x;
  };
  const leadsAll = () => PN.leads().map(leadFix);
  const cityOfArea = id => (PN.area(id) || {}).city;
  /* when to call back: overdue in red, today in amber, later in grey */
  const nextChip = x => {
    if (!x.next || x.stage === 'won') return '';
    const t = K.today(), d = Math.round((new Date(x.next + 'T00:00') - new Date(t + 'T00:00')) / 864e5);
    const [cls, txt] = d < 0 ? ['bad', `Call back was due ${d === -1 ? 'yesterday' : `${-d} days ago`}`] : d === 0 ? ['warn', 'Call back today'] : ['', `Call back ${d === 1 ? 'tomorrow' : fmtDay(x.next)}`];
    return `<span class="ld-next ${cls}">${ico('calendar-blank', 'sm')}${txt}</span>`;
  };
  const telLink = p => String(p || '').replace(/[^\d+]/g, '');
  let lq = '', lcity = 'all', lview = 'board';
  /* Deal order: Premium deals always first; the team drags the order inside each plan. The page itself lives on the site (index.html#/admin/deals). */
  V.dealorder = () => ({
    title: 'Deal order', sub: 'Premium deals always come first, then Pro, then Starter. Drag to change the order inside each plan.',
    html: `<div class="card" style="padding:0;overflow:hidden"><iframe src="../index.html?embed=1#/admin/deals" title="Deal order" style="display:block;width:100%;height:780px;border:0"></iframe></div>`
  });
  V.leads = () => {
    const all = leadsAll(), open = all.filter(x => x.stage !== 'won'), t = K.today();
    const due = open.filter(x => x.next && x.next <= t).length, won = all.filter(x => x.stage === 'won').length;
    const fresh = all.filter(x => Date.now() - x.at < 7 * 864e5).length;
    const stat = (k, v, d, cls = '') => `<div class="ld-stat ${cls}"><span>${k}</span><b class="num">${v}</b><small>${d}</small></div>`;
    return {
      title: 'Leads', sub: 'Restaurants the team is talking to. Drag a card to the next stage as the talk moves on.',
      acts: `<button class="btn pri" data-addl>${ico('plus', 'sm')}Add lead</button>`,
      html: `<div class="ld-stats">
          ${stat('In talks', open.length, `${fresh} new this week`)}
          ${stat('Call back today', due, due ? 'Including overdue' : 'All caught up', due ? 'due' : '')}
          ${stat('Signed', won, 'Joined khabo')}
          ${stat('Signed out of all', all.length ? Math.round(won / all.length * 100) + '%' : '0%', `${won} of ${all.length} leads`)}
        </div>
        <div class="ld-bar">
          <label class="search"><span class="sr">Search leads</span>${ico('magnifying-glass', 'sm')}<input class="inp sm" type="search" placeholder="Search name, person, area or note" value="${esc(lq)}" data-lq></label>
          <div class="seg sm" data-lcity>${[['all', 'All cities'], ...Object.entries(D.cities).map(([k, c]) => [k, c.en])].map(([k, l]) => `<button type="button" class="${lcity === k ? 'on' : ''}" data-k="${k}">${l}</button>`).join('')}</div>
          <div class="seg sm" data-lview><button type="button" class="${lview === 'board' ? 'on' : ''}" data-k="board">${ico('squares-four', 'sm')}Board</button><button type="button" class="${lview === 'list' ? 'on' : ''}" data-k="list">${ico('list', 'sm')}List</button></div>
        </div>
        <div data-lout></div>`,
      mount: el => {
        const out = $('[data-lout]', el);
        const match = x => (lcity === 'all' || cityOfArea(x.area) === lcity) && (!lq || [x.name, x.person, L(PN.area(x.area)), x.note, x.phone].join(' ').toLowerCase().includes(lq.toLowerCase()));
        const card = x => {
          const [, , c] = stageOf(x.stage), last = x.hist[0];
          return `<article class="ld" data-l="${x.id}" style="--c:${c}" tabindex="0" aria-label="${esc(x.name)}, open details">
            <div class="ld-top"><span class="ld-av">${esc(PN.initials(x.name))}</span><div><b>${esc(x.name)}</b><span class="meta">${esc(L(PN.area(x.area)))}${x.person ? ` · ${esc(x.person)}` : ''}</span></div></div>
            ${x.plan && PN.PLANS[x.plan] ? `<span class="ld-plan">${ico('sparkle', 'sm')}Interested in ${PN.PLANS[x.plan].name}</span>` : ''}
            ${last ? `<p>${esc(last.what)}</p>` : ''}
            ${nextChip(x)}
            <div class="ld-f"><span class="meta" title="Last updated">${x.upd ? PN.ago(x.upd) : ''}</span><span class="ld-acts">
              ${x.phone ? `<a class="ibtn sm" href="tel:${telLink(x.phone)}" aria-label="Call ${esc(x.person || x.name)}" title="Call">${ico('phone', 'sm')}</a><a class="ibtn sm" href="https://wa.me/${telLink(x.phone).replace('+', '')}" target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp">${ico('whatsapp-logo', 'sm')}</a>` : ''}
              ${x.stage !== STAGES[0][0] ? `<button class="ibtn sm" data-mv="-1" aria-label="Move back a stage" title="Move back">${ico('caret-left', 'sm')}</button>` : ''}${x.stage !== 'won' ? `<button class="ibtn sm" data-mv="1" aria-label="Move to the next stage" title="Next stage">${ico('caret-right', 'sm')}</button>` : ''}
            </span></div>
            ${x.stage === 'won' ? (x.rid && PN.r(x.rid) ? `<a class="btn sm ghost ld-cta" href="#/rest/${x.rid}/overview">${ico('storefront', 'sm')}Open restaurant</a>` : `<button class="btn sm gold ld-cta" data-conv>${ico('plus', 'sm')}Add to khabo</button>`) : ''}
          </article>`;
        };
        const paint = () => {
          const ls = leadsAll().filter(match);
          if (lview === 'board') {
            out.innerHTML = `<div class="ld-board">${STAGES.map(([k, l, c]) => { const col = ls.filter(x => x.stage === k).sort((a, b) => (a.next || '9') < (b.next || '9') ? -1 : 1); return `<section class="ld-col" data-col="${k}" style="--c:${c}"><header><i></i>${l}<span>${col.length}</span></header><div class="ld-list">${col.map(card).join('') || `<p class="ld-empty">${lq ? 'No match here' : 'Drop a lead here'}</p>`}</div></section>`; }).join('')}</div>`;
          } else {
            const rows = ls.slice().sort((a, b) => (a.stage === 'won') - (b.stage === 'won') || ((a.next || '9') < (b.next || '9') ? -1 : 1));
            out.innerHTML = `<div class="card"><div class="tbl-wrap"><table class="tbl ld-tbl"><thead><tr><th>Restaurant</th><th>Stage</th><th>Contact</th><th>Next step</th><th>Updated</th></tr></thead><tbody>${rows.map(x => { const [, l, c] = stageOf(x.stage); return `<tr data-l="${x.id}" tabindex="0"><td><div class="ld-top"><span class="ld-av" style="--c:${c}">${esc(PN.initials(x.name))}</span><div><b>${esc(x.name)}</b><span class="meta">${esc(L(PN.area(x.area)))}</span></div></div></td><td><span class="ld-stage" style="--c:${c}">${l}</span></td><td>${esc(x.person || '')}<span class="meta" style="display:block">${esc(x.phone || '')}</span></td><td>${nextChip(x) || '<span class="meta">None set</span>'}</td><td class="meta">${x.upd ? PN.ago(x.upd) : ''}</td></tr>`; }).join('') || `<tr><td colspan="5"><div class="empty">${ico('magnifying-glass')}<b>No leads found</b>Try another search or city.</div></td></tr>`}</tbody></table></div></div>`;
          }
        };
        paint();
        const setStage = (x, k) => {
          if (x.stage === k) return; const l = stageOf(k)[1];
          x.stage = k; x.upd = Date.now(); x.hist.unshift({ at: x.upd, who: PN.me().name, what: `Moved to ${l}` });
          PN.log(null, `Moved lead ${x.name} to ${l}`); PN.save(); paint();
          if (k === 'won') PN.toast(`${x.name} signed. Add them to khabo when you are ready.`);
        };
        const find = id => leadsAll().find(l => l.id === id);
        $('[data-lq]', el).addEventListener('input', e => { lq = e.target.value.trim(); paint(); });
        $$('[data-lcity] button', el).forEach(b => b.onclick = () => { lcity = b.dataset.k; $$('[data-lcity] button', el).forEach(x => x.classList.toggle('on', x === b)); paint(); });
        $$('[data-lview] button', el).forEach(b => b.onclick = () => { lview = b.dataset.k; $$('[data-lview] button', el).forEach(x => x.classList.toggle('on', x === b)); paint(); });
        out.addEventListener('click', e => {
          const c = e.target.closest('[data-l]'); if (!c) return; const x = find(c.dataset.l);
          const mv = e.target.closest('[data-mv]');
          if (mv) { const i = STAGES.findIndex(s => s[0] === x.stage) + Number(mv.dataset.mv); return setStage(x, STAGES[i][0]); }
          if (e.target.closest('[data-conv]')) return addRestaurant({ name: x.name, area: x.area, phone: x.phone, lead: x });
          if (e.target.closest('a,button')) return;
          leadDrawer(x, paint);
        });
        out.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-l]')) leadDrawer(find(e.target.dataset.l), paint); });
        /* drag a card onto another column: it tilts with your hand speed, the column opens a slot, the card springs in (feel.js) */
        if (window.KF) KF.drag(out, { item: '.ld', zone: '[data-col]', list: '.ld-list', key: 'data-l', overClass: 'over', onDrop: (id, col) => { const x = find(id); if (x) setStage(x, col.dataset.col); } });
        $('[data-addl]', el).onclick = () => leadDrawer(null, () => PN.rerender());
      }
    };
  };
  /* one drawer for adding and for looking after a lead: details, stage, follow-up date and notes */
  const leadDrawer = (x, done) => {
    const isNew = !x, v = x || { stage: 'new', area: D.areas[0].id, plan: '', next: isoDay(2), hist: [] };
    PN.drawer({
      title: isNew ? 'Add a lead' : v.name,
      body: `${isNew ? '' : `<div class="field"><span class="lbl">Stage</span><div class="ld-steps" data-stg>${STAGES.map(([k, l, c]) => `<button type="button" class="${v.stage === k ? 'on' : ''}" data-k="${k}" style="--c:${c}">${l}</button>`).join('')}</div></div>`}
        <div class="f-grid">
          ${PN.f.text('name', 'Restaurant name', v.name || '', { full: true })}
          ${PN.f.sel('area', 'Area', v.area, D.areas.map(a => [a.id, `${a.en}, ${L(D.cities[a.city] || '')}`]))}
          ${PN.f.sel('plan', 'Interested in', v.plan || '', [['', 'Not sure yet'], ...Object.entries(PN.PLANS).map(([k, p]) => [k, `${p.name}, ৳${p.price.toLocaleString('en-IN')} a month`])])}
          ${PN.f.text('person', 'Contact person', v.person || '')}
          ${PN.f.text('phone', 'Phone', v.phone || '', { type: 'tel', ph: '01712 345678' })}
          ${PN.f.text('next', 'Call back on', v.next || '', { type: 'date', full: true, hint: 'Leave empty if there is nothing to do yet. Due and overdue calls show in red on the board.' })}
        </div>
        <div class="field" style="margin-top:18px"><label for="f-nn">${isNew ? 'First note' : 'Add a note'}</label><textarea class="inp" id="f-nn" rows="2" placeholder="What was said, what they asked for, what happens next"></textarea></div>
        ${v.hist.length ? `<div class="ld-hist"><span class="lbl">History</span>${v.hist.map(h => `<div><i></i><p>${esc(h.what)}</p><span class="meta">${esc(h.who)} · ${PN.ago(h.at)}</span></div>`).join('')}</div>` : ''}`,
      foot: `${isNew ? '<button class="btn ghost l" data-c>Cancel</button>' : '<button class="btn ghost danger l" data-del>Delete lead</button>'}<button class="btn pri" data-ok>${isNew ? 'Add lead' : 'Save'}</button>`,
      mount: (box, close) => {
        let stage = v.stage;
        const stg = $('[data-stg]', box); if (stg) stg.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; stage = b.dataset.k; $$('button', stg).forEach(y => y.classList.toggle('on', y === b)); };
        const c = $('[data-c]', box); if (c) c.onclick = close;
        const del = $('[data-del]', box); if (del) del.onclick = async () => {
          if (!await PN.confirm({ title: `Delete ${v.name}?`, text: 'The lead and its notes are removed. This cannot be undone.', ok: 'Delete', danger: true })) return;
          const arr = PN.leads(); arr.splice(arr.indexOf(x), 1); PN.log(null, `Deleted lead ${v.name}`); PN.save(); close(); PN.toast('Lead deleted.'); done();
        };
        $('[data-ok]', box).onclick = () => {
          const f = PN.form($('.dw-b', box)), note = $('#f-nn', box).value.trim(), me = PN.me().name, now = Date.now();
          if (!f.name) return PN.toast('Add the restaurant name.', 'bad');
          if (f.phone && !/^(\+?880|0)1\d{9}$/.test(f.phone.replace(/[\s-]/g, ''))) return PN.toast('That phone number does not look right. Use a mobile number like 01712 345678.', 'bad');
          const y = x || { id: 'l' + now.toString(36), stage: 'new', at: now, hist: [] };
          const moved = !isNew && stage !== y.stage;
          Object.assign(y, { name: f.name, area: f.area, plan: f.plan, person: f.person, phone: f.phone, next: f.next, upd: now });
          if (moved) { y.stage = stage; y.hist.unshift({ at: now, who: me, what: `Moved to ${stageOf(stage)[1]}` }); }
          if (note) { y.hist.unshift({ at: now, who: me, what: note }); y.note = note; }
          if (isNew) { PN.leads().unshift(y); PN.log(null, `Added lead ${y.name}`); } else PN.log(null, `Updated lead ${y.name}${moved ? ` (now ${stageOf(stage)[1]})` : ''}`);
          PN.save(); close(); PN.toast(isNew ? 'Lead added.' : 'Lead saved.'); done();
        };
      }
    });
  };

  /* =================== Site text =================== */
  /* Every word on khabo's own pages (code/i18n.js), grouped by page, plus the general "About this dish" texts.
     Saved as db.site.text = { key: { en, bn } } and db.site.about; data/common.js lays them over the defaults.
     K.T0 and K.ABOUT0 hold the defaults, so any change can be put back. Edits wait in a draft until Save. */
  const TXT_LABEL = {
    hero_1: 'Headline, first line', hero_2: 'Headline, second line', hero_sub: 'Under the headline', ai_title: 'Ask section, title', ai_sub: 'Ask section, text',
    see_title: '“See it” section, title', see_sub: '“See it” section, text', spec_title: 'Price compare, title', spec_sub: 'Price compare, text', own_title: 'For owners, title', own_sub: 'For owners, text',
    deals_title: 'Page title', deals_sub: 'Under the title', deal_note: 'Small note at the bottom', biz_h1: 'Headline', biz_sub: 'Under the headline', biz_note: 'Price note',
    plans_title: 'Plans, title', plans_sub: 'Plans, text', faq: 'Questions, title', form_title: 'Sign-up form, title', form_sub: 'Sign-up form, text',
    footer_line: 'Footer, line under the logo', demo_note: 'Preview note', nav_explore: 'Top menu', nav_deals: 'Top menu', nav_business: 'Top menu',
    tm_welcome: 'Welcome line', tm_note: 'Note under the menu', about_dish: 'Section title', how_made: 'Heading'
  };
  const TXT_SECT = [
    { id: 'home', name: 'Home page', ico: 'house', url: '', rx: /^(hero_|ph_\d|q_|live_360|step_inside|craving$|all_dishes|from_price|near_title|change_area|budget|any_budget|no_budget_area|spec_|average|compare_all|see_title|see_sub|bx_|drag_look|turn_it|browse_all|occasions|facilities|n_dishes_places|per_person$|own_|see_plans|see_sample|sample_report|page_views|qr_scans|top_dish$|since$|partners|try_table|tc_scan|popular$)/, top: ['hero_1', 'hero_2', 'hero_sub', 'see_title', 'see_sub', 'spec_title', 'spec_sub', 'own_title', 'own_sub'] },
    { id: 'deals', name: 'Deals', ico: 'tag', url: '#/deals', rx: /^(deal|all_deals|usual|you_save|pct_off|off$|this_week|week_dates|see_deal|until_x|from_x|n_deals|save_x|no_deals|all$)/, top: ['deals_title', 'deals_sub', 'deal_note'] },
    { id: 'biz', name: 'For restaurants', ico: 'briefcase', url: '#/business', rx: /^(biz_|book_visit|see_live|vs_|get_|g_|try_it|see_print|sample$|oct|calls_dirs|top_dishes|price_insight|insight_line|how\d|how_title|plans|most_popular|per_month|per_day|choose_plan|f_|faq|form_|your_name|rest_name|phone|other_area|plan$|not_sure|err_|qrb_|qrs_|qr_menu|partner_sign_in)/, top: ['biz_h1', 'biz_sub', 'biz_note', 'plans_title', 'plans_sub', 'faq', 'form_title', 'form_sub'] },
    { id: 'rest', name: 'Restaurant page', ico: 'storefront', url: '#/r/shahi-handi', rx: /^(tour_|rooms?$|watch_film|see_photos|n_photos|n_dishes$|n_verified|menu$|inside|kitchen|photos|reviews$|info$|sections|call|vat_plus|added_bill|n_seats|has_cabins|directions|checked_by_team|signature|video|best_seller|veg$|menu_note|search_menu|menu_none|full_screen|outside|food$|follow|visit|hours|every_day|address|fac_none|payment|good_know|more_near|powered|own_this|link_copied|zoom_|use_motion|fullscreen|day$|night$|call_book|loading_|captured|no_webgl|motion_denied|play|pause|seek|mute|film_end|replay|view_table|d3_fail|go_home|n_reviews|prices$|on_the_bill|seats|since_label|about_r|in_3d|has_video|watch_kitchen|map_of|open_gmaps|featured$|founding|pp_short|film$|lowest$|spice_\d|checked_|open_|opens_at|closed_now)/ },
    { id: 'dish', name: 'Dish page', ico: 'bowl-food', url: '#/dishes', rx: /^(about_dish|how_made|main_ing|spice_lvl|served_with|spice_note|people_said|dish_video_note|d3_hint|photo_soon|price_|lowest_in|same_dish_else|sold_out|also_here|photo$|for_n|allin_line)/, top: ['about_dish', 'how_made'] },
    { id: 'reviews', name: 'Reviews', ico: 'star', url: '#/r/shahi-handi', rx: /^(write_review|verified|not_verified|rv_|review|st_\d|pick_stars|just_now|your_rating|tap_stars|what_ordered|add_photos|choose_photos|post_review|signin_review|login_review|owner_reply|reply_from|no_reviews|n_stars|ordered|with_photos)/ },
    { id: 'explore', name: 'Search and explore', ico: 'magnifying-glass', url: '#/explore', rx: /^(search|explore|stat_|highest|dh_bar_label|to$|typical|pp_upto|dish_upto|group_of|late_night|mild|featured_note|see_all|remove|nothing_|sort|restaurants|dishes$|group_by|by_|filters|area$|dish$|occasion|all_of|city_area|pp_max|any$|when$|rating|food_pref|veg_options|group_size|see_before|menu_3d|clear_all|show_n_|no_results|no_match|near_|kb_search|rs_|categories|all_food|dishes_sub|dish_search|any_price|max_price|map_|pc_|serves_x|where$|anywhere|food_type|any_food|labels|choose_area|n_places|area_set|coming_soon|type_range|per_person_short|cuisine$|places_word|place_one|from_at|all_in_city|show_less|show_all_cats|city$|tab_places|tab_dishes|nav_restaurants|nav_dishes)/ },
    { id: 'ask', name: 'Ask AI', ico: 'sparkle', url: '#/ask', rx: /^(ask_|ai_|try_|speak|send$|use_bill|also_fits|vat_service|bill_loaded|listening|mic_off|recent|cravings)/, top: ['ai_title', 'ai_sub'] },
    { id: 'bill', name: 'Bill', ico: 'receipt', url: '#/r/shahi-handi', rx: /^(bill|view_bill|people$|split_even|fewer|more$|subtotal|vat$|service|total_all_in|each_|share_whatsapp|clear_bill|add_to_bill|remove_one|add_one|hide_bill|saved_bills|all_in$|n_items)/ },
    { id: 'table', name: 'Table menu and print', ico: 'qr-code', url: '#/t/shahi-handi', rx: /^(tm_|table_n|pm_|print_)/, top: ['tm_welcome', 'tm_note'] },
    { id: 'account', name: 'Sign in and account', ico: 'user-circle', url: '', rx: /^(me_|login_|sign|phone_no|phone_err|send_code|or$|google_|change_no|enter_code|code_|digit_n|continue|your_account|your_reviews)/ },
    { id: 'common', name: 'Menus, footer, buttons', ico: 'list', url: '', rx: /./, top: ['footer_line', 'nav_explore', 'nav_deals', 'nav_business', 'demo_note'] },
    { id: 'about', name: 'About this dish', ico: 'chef-hat', url: '#/dishes', about: true }
  ];
  /* the order rules run in: the first match wins (so "phone_no" is sign-in, not the sign-up form) */
  const TXT_ORDER = ['reviews', 'table', 'account', 'biz', 'dish', 'deals', 'bill', 'rest', 'home', 'ask', 'explore', 'common'];
  let txtKeys = null;
  const txtSections = () => {
    if (txtKeys) return txtKeys;
    const T0 = K.T0 || K.T; txtKeys = {}; TXT_SECT.forEach(s => txtKeys[s.id] = []);
    Object.keys(T0.en).forEach(k => { const id = TXT_ORDER.find(i => TXT_SECT.find(s => s.id === i).rx.test(k)); txtKeys[id].push(k); });
    TXT_SECT.forEach(s => { if (s.top) txtKeys[s.id] = [...s.top.filter(k => txtKeys[s.id].includes(k)), ...txtKeys[s.id].filter(k => !s.top.includes(k))]; });
    txtKeys.about = Object.keys(D.types).filter(k => D.types[k].made).flatMap(k => [`a:${k}:made`, `a:${k}:side`]);
    return txtKeys;
  };
  const ctDraft = {};
  let ctSec = 'home', ctQ = '';
  V.content = () => {
    const db = PN.db(); db.site = db.site || {}; db.site.text = db.site.text || {}; db.site.about = db.site.about || {};
    const T = K.T, T0 = K.T0 || K.T, A0 = K.ABOUT0 || {}, S = txtSections();
    /* value helpers. Keys are "word keys" from i18n.js, or "a:<dish type>:made|side" for About this dish */
    const isA = k => k.startsWith('a:');
    const saved = k => { if (!isA(k)) return { en: T.en[k] || '', bn: T.bn[k] || '' }; const [, t, f] = k.split(':'), v = D.types[t][f] || {}; return { en: v.en || '', bn: v.bn || '' }; };
    const orig = k => { if (!isA(k)) return { en: T0.en[k] || '', bn: T0.bn[k] || '' }; const [, t, f] = k.split(':'), v = (A0[t] || {})[f] || {}; return { en: v.en || '', bn: v.bn || '' }; };
    const cur = k => ctDraft[k] || saved(k);
    const changed = k => { const o = orig(k), s = saved(k); return o.en !== s.en || o.bn !== s.bn; };
    const label = k => { if (isA(k)) { const [, t, f] = k.split(':'); return `${D.types[t].en}, ${f === 'made' ? 'how it is made' : 'served with'}`; } return TXT_LABEL[k] || ''; };
    const secCount = id => ({ n: S[id].length, ch: S[id].filter(changed).length, dr: S[id].filter(k => ctDraft[k]).length });
    const row = (k, tag) => {
      const v = cur(k), o = orig(k), toks = (o.en.match(/\{\w+\}/g) || []), long = Math.max(v.en.length, v.bn.length) > 58;
      const inp = l => long ? `<textarea class="inp ${l === 'bn' ? 'bn' : ''}" rows="${Math.min(6, Math.ceil(Math.max(v.en.length, v.bn.length * 1.15) / 50))}" data-l="${l}" aria-label="${l === 'en' ? 'English' : 'Bangla'}">${esc(v[l])}</textarea>` : `<input class="inp ${l === 'bn' ? 'bn' : ''}" data-l="${l}" value="${esc(v[l])}" aria-label="${l === 'en' ? 'English' : 'Bangla'}" ${isA(k) && k.endsWith(':side') ? `placeholder="${l === 'en' ? 'Served with' : 'সাথে যা দেওয়া হয়'}"` : ''}>`;
      const lb = label(k), st = ctDraft[k] ? '<span class="tx-st dr">Not saved</span>' : changed(k) ? '<span class="tx-st ch">Changed</span>' : '';
      return `<div class="tx ${ctDraft[k] ? 'dirty' : ''}" data-k="${k}">
        <div class="tx-h">${lb ? `<b>${esc(lb)}</b>` : ''}${tag ? `<span class="tx-tag">${esc(tag)}</span>` : ''}${st}${toks.length ? `<span class="tx-tok" title="khabo fills these in. Keep them as they are.">${toks.map(t => `<code>${esc(t)}</code>`).join('')}</span>` : ''}${changed(k) || ctDraft[k] ? `<button type="button" class="tx-undo" data-undo>${ico('arrow-clockwise', 'sm')}Back to original</button>` : ''}</div>
        <div class="tx-in">${inp('en')}${inp('bn')}</div></div>`;
    };
    const nav = () => TXT_SECT.map(s => { const c = secCount(s.id); return `<button type="button" class="tx-nav ${!ctQ && ctSec === s.id ? 'on' : ''}" data-sec="${s.id}">${ico(s.ico, 'sm')}<span>${s.name}</span>${c.dr ? '<i class="dot dr" title="Not saved"></i>' : c.ch ? '<i class="dot" title="Changed"></i>' : ''}<em>${c.n}</em></button>`; }).join('');
    const body = () => {
      if (ctQ) {
        const q = ctQ.toLowerCase(), hits = [];
        TXT_SECT.forEach(s => S[s.id].forEach(k => { const v = cur(k), o = orig(k); if ([v.en, v.bn, o.en, label(k)].join(' ').toLowerCase().includes(q)) hits.push([k, s.name]); }));
        return `<div class="tx-top"><div><h2>Search results</h2><span class="meta">${hits.length} match${hits.length === 1 ? '' : 'es'} for “${esc(ctQ)}” across the whole site</span></div></div>
          ${hits.slice(0, 120).map(([k, s]) => row(k, s)).join('') || `<div class="empty">${ico('magnifying-glass')}<b>Nothing found</b>Try fewer words, or search in Bangla.</div>`}${hits.length > 120 ? `<p class="meta" style="padding:14px 4px">Showing the first 120. Add more words to narrow it down.</p>` : ''}`;
      }
      const s = TXT_SECT.find(x => x.id === ctSec), c = secCount(s.id);
      return `<div class="tx-top"><div><h2>${ico(s.ico, 'sm')}${s.name}</h2><span class="meta">${c.n} piece${c.n === 1 ? '' : 's'} of text${c.ch ? ` · ${c.ch} changed` : ''}</span></div>${s.url != null ? `<a class="btn sm" href="../index.html${s.url}" target="_blank" rel="noopener">${ico('arrow-up-right', 'sm')}See this page</a>` : ''}</div>
        <div class="tx-cols"><span>English</span><span>বাংলা</span></div>
        ${S[s.id].map(k => row(k)).join('')}
        <p class="meta tx-foot">${s.about ? 'Shown under “About this dish” for every dish of that kind, unless the restaurant wrote its own.' : 'Words in {curly brackets} are filled in by khabo, like a number or a name. Keep them as they are.'} Changes show on khabo after a refresh.</p>`;
    };
    const nDraft = () => Object.keys(ctDraft).length;
    return {
      title: 'Site text', sub: 'Every word on khabo’s own pages, in English and Bangla. Pick a page or search for any words you see on the site.',
      acts: `<a class="btn" href="../index.html" target="_blank" rel="noopener">${ico('arrow-up-right', 'sm')}Open khabo</a>`,
      html: `<div class="tx-wrap">
          <aside class="tx-side card"><label class="search"><span class="sr">Search all site text</span>${ico('magnifying-glass', 'sm')}<input class="inp sm" type="search" placeholder="Search any words" value="${esc(ctQ)}" data-txq></label><nav data-txnav>${nav()}</nav></aside>
          <div class="tx-main card" data-txbody>${body()}</div>
        </div>
        <div class="savebar ${nDraft() ? 'on' : ''}" role="region" aria-label="Unsaved changes"><span data-txn>${nDraft()} unsaved change${nDraft() === 1 ? '' : 's'}</span><button class="btn ghost sm" data-discard>Discard</button><button class="btn gold sm" data-savect>Save changes</button></div>`,
      mount: el => {
        const bodyEl = $('[data-txbody]', el), navEl = $('[data-txnav]', el), bar = $('.savebar', el);
        const repaint = (top) => { bodyEl.innerHTML = body(); navEl.innerHTML = nav(); bars(); if (top) bodyEl.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
        const bars = () => { const n = nDraft(); bar.classList.toggle('on', n > 0); $('[data-txn]', el).textContent = `${n} unsaved change${n === 1 ? '' : 's'}`; navEl.innerHTML = nav(); };
        navEl.addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (!b) return; ctSec = b.dataset.sec; ctQ = ''; $('[data-txq]', el).value = ''; repaint(innerWidth < 900); });
        let tq = 0; $('[data-txq]', el).addEventListener('input', e => { clearTimeout(tq); tq = setTimeout(() => { ctQ = e.target.value.trim(); repaint(); }, 180); });
        bodyEl.addEventListener('input', e => {
          const r = e.target.closest('[data-k]'); if (!r) return; const k = r.dataset.k;
          const v = { en: $('[data-l=en]', r).value, bn: $('[data-l=bn]', r).value }, s = saved(k);
          if (v.en === s.en && v.bn === s.bn) delete ctDraft[k]; else ctDraft[k] = v;
          r.classList.toggle('dirty', !!ctDraft[k]); bars();
        });
        bodyEl.addEventListener('click', e => {
          if (!e.target.closest('[data-undo]')) return; const r = e.target.closest('[data-k]'), k = r.dataset.k, o = orig(k), s = saved(k);
          if (o.en === s.en && o.bn === s.bn) delete ctDraft[k]; else ctDraft[k] = o;
          r.outerHTML = row(k, ctQ ? (TXT_SECT.find(x => S[x.id].includes(k)) || {}).name : ''); bars();
        });
        $('[data-discard]', el).onclick = () => { Object.keys(ctDraft).forEach(k => delete ctDraft[k]); repaint(); PN.toast('Changes discarded.'); };
        $('[data-savect]', el).onclick = () => {
          if (!PN.can('site')) return PN.denied('site text');
          const keys = Object.keys(ctDraft); let empty = 0; if (!keys.length) return PN.toast('Nothing to save yet.');
          keys.forEach(k => {
            const v = { en: ctDraft[k].en.trim(), bn: ctDraft[k].bn.trim() }, o = orig(k);
            if (!v.en) { empty++; v.en = o.en; } if (!v.bn) v.bn = o.bn || v.en;
            const same = v.en === o.en && v.bn === o.bn;
            if (isA(k)) {
              const [, t, f] = k.split(':'), a = db.site.about[t] = db.site.about[t] || {};
              if (same) delete a[f]; else a[f] = v; if (!Object.keys(a).length) delete db.site.about[t];
              D.types[t][f] = v.en ? v : undefined;
            } else { if (same) delete db.site.text[k]; else db.site.text[k] = v; T.en[k] = v.en; T.bn[k] = v.bn; }
            delete ctDraft[k];
          });
          PN.log(null, `Changed ${keys.length} piece${keys.length > 1 ? 's' : ''} of site text`); PN.save();
          PN.toast(`Saved ${keys.length} change${keys.length > 1 ? 's' : ''}${empty ? `. ${empty} left empty went back to the original` : ''}. Refresh khabo to see them.`);
          repaint();
        };
        /* leaving the page keeps the draft; the bar is still there when you come back */
      }
    };
  };

  /* =================== Activity =================== */
  /* Every change, searchable. Filter by restaurant, who made it, when, city, area, cuisine and kind; sort by time, restaurant or person. */
  const KINDS = [
    ['request', 'Requests', /request/i, 'paper-plane-right'], ['deal', 'Deals', /deal/i, 'tag'], ['review', 'Reviews', /review|repl/i, 'star'],
    ['account', 'Accounts', /invite|account|password|signed|user|code|team member|level/i, 'users'], ['sales', 'Sales and billing', /lead|plan|invoice|paid|payment|billing/i, 'briefcase'],
    ['site', 'Site text', /site text/i, 'translate'], ['media', 'Photos and film', /photo|film|tour|cover|video|360/i, 'images'],
    ['menu', 'Menu and prices', /dish|menu|price|item|sold out|categor/i, 'fork-knife'], ['page', 'Page and other', /[\s\S]/, 'storefront']
  ];
  const kindOf = x => KINDS.find(k => k[2].test(x.what));
  const AF0 = { q: '', rid: 'all', who: 'all', when: 'all', city: 'all', area: 'all', cu: 'all', kind: 'all', sort: 'new', n: 60 };
  const aF = Object.assign({}, AF0);
  const dayLabel = ts => { const d = new Date(ts), t = new Date(); t.setHours(0, 0, 0, 0); const diff = Math.round((t - new Date(d).setHours(0, 0, 0, 0)) / 864e5); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); };
  const hl = (s, q) => { if (!q) return esc(s); const i = s.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? esc(s) : esc(s.slice(0, i)) + `<mark>${esc(s.slice(i, i + q.length))}</mark>` + hl(s.slice(i + q.length), q); };
  V.activity = () => {
    const m = location.hash.match(/^#\/activity\/([^/#?]+)/); if (m && PN.r(m[1])) { Object.assign(aF, AF0, { rid: m[1] }); history.replaceState(null, '', '#/activity'); }
    const seg = (key, opts) => `<div class="seg sm" data-af="${key}">${opts.map(([k, l]) => `<button type="button" class="${aF[key] === k ? 'on' : ''}" data-k="${k}">${l}</button>`).join('')}</div>`;
    const rests = PN.all().slice().sort((a, b) => a.name.en.localeCompare(b.name.en));
    return {
      title: 'Activity', sub: 'Every change, by the team and by restaurants. Search, filter and sort to find anything.',
      acts: PN.can('reset') ? '<button class="btn danger" data-reset>Reset demo data</button>' : '',
      html: `<div class="card ac-filters">
          <div class="ac-row1">
            <label class="search"><span class="sr">Search activity</span>${ico('magnifying-glass', 'sm')}<input class="inp" type="search" placeholder="Search what changed, who, or a restaurant" value="${esc(aF.q)}" data-aq></label>
            <select class="sel" data-afs="rid" aria-label="Restaurant"><option value="all">All restaurants</option><option value="none" ${aF.rid === 'none' ? 'selected' : ''}>khabo only (no restaurant)</option>${rests.map(r => `<option value="${r.id}" ${aF.rid === r.id ? 'selected' : ''}>${esc(r.name.en)}</option>`).join('')}</select>
            <select class="sel" data-afs="sort" aria-label="Sort">${[['new', 'Newest first'], ['old', 'Oldest first'], ['rest', 'By restaurant, A to Z'], ['who', 'By person, A to Z']].map(([k, l]) => `<option value="${k}" ${aF.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          </div>
          <button type="button" class="btn sm ac-ftog" data-ftog aria-expanded="false">${ico('sliders-horizontal', 'sm')}<span>More filters</span></button>
          <div class="ac-row2">
            <div class="ac-g"><span class="lbl">Who</span>${seg('who', [['all', 'Everyone'], ['team', 'khabo team'], ['rest', 'Restaurants']])}</div>
            <div class="ac-g"><span class="lbl">When</span>${seg('when', [['all', 'Any time'], ['today', 'Today'], ['d7', '7 days'], ['d30', '30 days']])}</div>
            <div class="ac-g"><span class="lbl">City</span>${seg('city', [['all', 'All'], ...Object.entries(D.cities).map(([k, c]) => [k, c.en])])}</div>
            <div class="ac-g"><span class="lbl">Area</span><select class="sel sm" data-afs="area" aria-label="Area"></select></div>
            <div class="ac-g"><span class="lbl">Cuisine</span><select class="sel sm" data-afs="cu" aria-label="Cuisine"><option value="all">All cuisines</option>${D.cuisines.map(c => `<option value="${c.id}" ${aF.cu === c.id ? 'selected' : ''}>${esc(c.en)}</option>`).join('')}</select></div>
          </div>
          <div class="ac-kinds" data-kinds></div>
        </div>
        <div class="ac-sum" data-asum></div>
        <div class="card ac-res" data-ares></div>`,
      mount: el => {
        const areaSel = $('[data-afs=area]', el);
        const paintAreas = () => { const as = D.areas.filter(a => aF.city === 'all' || a.city === aF.city); if (aF.area !== 'all' && !as.some(a => a.id === aF.area)) aF.area = 'all'; areaSel.innerHTML = `<option value="all">All areas</option>${as.map(a => `<option value="${a.id}" ${aF.area === a.id ? 'selected' : ''}>${esc(a.en)}</option>`).join('')}`; };
        const base = () => {
          const now = Date.now(), t0 = new Date().setHours(0, 0, 0, 0), lim = { today: t0, d7: now - 7 * 864e5, d30: now - 30 * 864e5 }[aF.when], q = aF.q.toLowerCase(), place = aF.city !== 'all' || aF.area !== 'all' || aF.cu !== 'all';
          return PN.logs().filter(x => {
            const r = x.rid && PN.r(x.rid);
            if (aF.rid === 'none' ? x.rid : aF.rid !== 'all' && x.rid !== aF.rid) return false;
            if (aF.who === 'team' && x.role !== 'admin' || aF.who === 'rest' && x.role !== 'restaurant') return false;
            if (place && (!r || aF.city !== 'all' && r.city !== aF.city || aF.area !== 'all' && r.area !== aF.area || aF.cu !== 'all' && !(r.cuisines || []).includes(aF.cu))) return false;
            if (lim && x.at < lim) return false;
            if (q && !`${x.who} ${x.what} ${r ? `${r.name.en} ${r.name.bn} ${PN.where(r)}` : 'khabo'}`.toLowerCase().includes(q)) return false;
            return true;
          });
        };
        const row = x => {
          const r = x.rid && PN.r(x.rid), k = kindOf(x), time = new Date(x.at);
          return `<div class="ac-it"><span class="av sm" style="${x.role === 'restaurant' && r ? `background:${r.theme.deep};color:${r.theme.accent}` : ''}">${esc(PN.initials(x.who))}</span>
            <div class="ac-m"><div class="ac-who"><b>${hl(x.who, aF.q)}</b><span class="ac-role ${x.role === 'admin' ? 'team' : ''}">${x.role === 'admin' ? 'khabo team' : x.role === 'restaurant' ? 'Restaurant' : 'System'}</span></div>
              <p>${hl(x.what, aF.q)}</p>
              <div class="ac-tags">${r ? `<button type="button" class="ac-r" data-fr="${r.id}" title="Show only ${esc(r.name.en)}">${PN.mono(r, 'xs')}${hl(r.name.en, aF.q)}<span class="meta">${esc(L(PN.area(r.area)))}</span></button>` : ''}<span class="ac-k">${ico(k[3], 'sm')}${k[1]}</span></div></div>
            <time datetime="${time.toISOString()}" title="${time.toLocaleString('en-GB')}">${time.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}<span>${PN.ago(x.at)}</span></time></div>`;
        };
        const paint = () => {
          const b = base(), counts = {}; b.forEach(x => { const k = kindOf(x)[0]; counts[k] = (counts[k] || 0) + 1; });
          if (aF.kind !== 'all' && !counts[aF.kind]) aF.kind = 'all';
          $('[data-kinds]', el).innerHTML = `<button type="button" class="fchip ${aF.kind === 'all' ? 'on' : ''}" data-kind="all">All kinds <span>${b.length}</span></button>${KINDS.filter(k => counts[k[0]]).map(k => `<button type="button" class="fchip ${aF.kind === k[0] ? 'on' : ''}" data-kind="${k[0]}">${ico(k[3], 'sm')}${k[1]} <span>${counts[k[0]]}</span></button>`).join('')}`;
          let list = aF.kind === 'all' ? b : b.filter(x => kindOf(x)[0] === aF.kind);
          const rn = x => { const r = x.rid && PN.r(x.rid); return r ? r.name.en : '~khabo'; };
          const S = { new: (a, c) => c.at - a.at, old: (a, c) => a.at - c.at, rest: (a, c) => rn(a).localeCompare(rn(c)) || c.at - a.at, who: (a, c) => a.who.localeCompare(c.who) || c.at - a.at };
          list = list.slice().sort(S[aF.sort]);
          const people = new Set(list.map(x => x.who)).size, places = new Set(list.filter(x => x.rid).map(x => x.rid)).size;
          const active = Object.keys(AF0).filter(k => k !== 'n' && k !== 'sort' && aF[k] !== AF0[k]).length;
          $('[data-asum]', el).innerHTML = `<b>${list.length}</b> change${list.length === 1 ? '' : 's'} · ${people} ${people === 1 ? 'person' : 'people'} · ${places} restaurant${places === 1 ? '' : 's'}${active ? `<button type="button" class="ac-clear" data-aclear>${ico('x', 'sm')}Clear ${active} filter${active > 1 ? 's' : ''}</button>` : ''}`;
          const grp = x => aF.sort === 'rest' ? (rn(x) === '~khabo' ? 'khabo, no restaurant' : rn(x)) : aF.sort === 'who' ? x.who : dayLabel(x.at);
          let last = null, html = '';
          list.slice(0, aF.n).forEach(x => { const g = grp(x); if (g !== last) { html += `<div class="ac-day">${esc(g)}</div>`; last = g; } html += row(x); });
          $('[data-ares]', el).innerHTML = list.length ? html + (list.length > aF.n ? `<button type="button" class="btn ac-more" data-amore>Show ${Math.min(60, list.length - aF.n)} more of ${list.length - aF.n}</button>` : '') : `<div class="empty">${ico('clock')}<b>${PN.logs().length ? 'Nothing matches' : 'No activity yet'}</b>${PN.logs().length ? 'Try fewer words or clear a filter.' : 'Changes appear here as soon as anyone makes one.'}</div>`;
        };
        paintAreas(); paint();
        let tq = 0; $('[data-aq]', el).addEventListener('input', e => { clearTimeout(tq); tq = setTimeout(() => { aF.q = e.target.value.trim(); aF.n = 60; paint(); }, 160); });
        $$('[data-af]', el).forEach(g => g.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; aF[g.dataset.af] = b.dataset.k; aF.n = 60; $$('[data-k]', g).forEach(x => x.classList.toggle('on', x === b)); if (g.dataset.af === 'city') paintAreas(); paint(); }));
        $$('[data-afs]', el).forEach(s => s.addEventListener('change', () => { aF[s.dataset.afs] = s.value; aF.n = 60; paint(); }));
        el.addEventListener('click', e => {
          const ft = e.target.closest('[data-ftog]'); if (ft) { const open = $('.ac-filters', el).classList.toggle('open'); ft.setAttribute('aria-expanded', open); $('span', ft).textContent = open ? 'Fewer filters' : 'More filters'; return; }
          const k = e.target.closest('[data-kind]'); if (k) { aF.kind = k.dataset.kind; return paint(); }
          const fr = e.target.closest('[data-fr]'); if (fr) { aF.rid = fr.dataset.fr; $('[data-afs=rid]', el).value = aF.rid; return paint(); }
          if (e.target.closest('[data-amore]')) { aF.n += 60; return paint(); }
          if (e.target.closest('[data-aclear]')) { Object.assign(aF, AF0, { sort: aF.sort }); PN.rerender(); }
        });
        const rs = $('[data-reset]', el); if (rs) rs.onclick = async () => {
          if (!PN.can('reset')) return PN.denied('this');
          if (!await PN.confirm({ title: 'Reset all demo data?', text: 'Every change made in the panels is undone: menus, photos, users, reviews and billing go back to the start. Everyone is signed out.', ok: 'Reset everything', danger: true })) return;
          PN.resetAll(); PN.signOut(); location.href = location.pathname;
        };
      }
    };
  };
})();
