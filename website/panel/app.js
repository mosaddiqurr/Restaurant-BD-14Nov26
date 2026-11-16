/* khabo panels: shared helpers, the login page, the sidebar shell and page switching.
   Restaurant pages live in rest.js, admin-only pages in admin.js. Both register into PN.views. */
(function () {
  'use strict';
  const PN = window.PN, D = PN.D;
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  PN.$ = $; PN.$$ = $$;

  /* ---------- text, numbers, pictures ---------- */
  const nf = new Intl.NumberFormat('en-IN');
  PN.n = v => nf.format(v);
  PN.tk = v => '৳' + nf.format(Math.round(v));
  PN.L = o => o == null ? '' : typeof o === 'string' ? o : (o.en != null ? o.en : '');
  PN.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  PN.ico = (n, c = '') => `<svg class="ico ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  window.K.ico = window.K.ico || PN.ico; window.K.esc = window.K.esc || PN.esc; /* qr.js uses these */
  PN.src = (k, w = 400) => {
    if (!k) return '';
    if (/^(data:|https?:|blob:)/.test(k)) return k;
    if (k.startsWith('pv:')) { const [, p, v] = k.split(':'); return `${K.panoDir(p)}${p}-${v}.jpg`; }
    if (k.startsWith('ph:')) return `https://cdn.polyhaven.com/asset_img/primary/${k.slice(3)}.png?height=${Math.max(256, w)}`;
    const id = D.P[k]; return id ? `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop` : '';
  };
  PN.thumb = (k, word = '', cls = 'thumb') => k ? `<img class="${cls}" src="${PN.src(k, 200)}" alt="" loading="lazy">` : `<span class="${cls}" aria-hidden="true">${PN.esc(String(word).trim().charAt(0))}</span>`;
  PN.mono = (r, cls = '') => `<span class="mono ${cls}" style="--d:${r.theme.deep};--a:${r.theme.accent}" aria-hidden="true">${PN.esc(r.mono || r.name.en.slice(0, 2).toUpperCase())}</span>`;
  PN.initials = s => String(s).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  PN.area = id => D.areas.find(a => a.id === id) || { en: id || '' };
  PN.where = r => `${PN.L(PN.area(r.area))}, ${PN.L(D.cities[r.city] || '')}`;
  PN.page = r => `../index.html#/r/${encodeURIComponent(r.slug || r.id)}`;
  PN.ago = ts => {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return 'just now'; if (s < 3600) return `${Math.round(s / 60)} min ago`; if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    const d = Math.round(s / 86400); return d === 1 ? 'yesterday' : `${d} days ago`;
  };
  PN.days = n => n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`;
  PN.stars = n => `<span class="stars" aria-label="${n} out of 5">${[1, 2, 3, 4, 5].map(i => PN.ico('star-fill', i <= n ? '' : 'off')).join('')}</span>`;
  PN.slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
  PN.spark = (vals, color = 'var(--indigo)') => {
    const lo = Math.min(...vals), hi = Math.max(...vals), W = 92, H = 34;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1) * W).toFixed(1)},${(H - 3 - (hi === lo ? .5 : (v - lo) / (hi - lo)) * (H - 6)).toFixed(1)}`);
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
  PN.logo = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#0C5A3E"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="19.2" cy="13" r="3.1" fill="#F5A300"/></svg>';

  /* photos chosen from the computer are shrunk before saving, so the browser does not run out of space */
  PN.readPhoto = (file, max = 1200) => new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('not an image'));
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', .78));
    };
    im.onerror = rej; im.src = url;
  });
  PN.pickPhotos = (multi = true) => new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = multi;
    i.onchange = async () => { const out = []; for (const f of i.files) { try { out.push(await PN.readPhoto(f)); } catch (e) { } } res(out); };
    i.click();
  });

  /* ---------- toast ---------- */
  PN.toast = (msg, kind = 'ok', link) => {
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
    const t = document.createElement('div'); t.className = `toast ${kind}`;
    t.innerHTML = `${PN.ico(kind === 'bad' ? 'warning' : 'check-circle')}<span>${PN.esc(msg)}</span>${link ? `<a href="${link.href}" target="_blank" rel="noopener">${PN.esc(link.text)}</a>` : ''}`;
    box.append(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3400);
  };

  /* ---------- drawer (side panel) and modal (centre) ---------- */
  const layer = (kind, o) => {
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const box = document.createElement('div'); box.className = kind; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', o.title);
    box.innerHTML = `<div class="dw-h">${o.head || ''}<h2>${PN.esc(o.title)}</h2><button class="ibtn" data-x aria-label="Close">${PN.ico('x')}</button></div><div class="dw-b">${o.body}</div>${o.foot ? `<div class="dw-f">${o.foot}</div>` : ''}`;
    document.body.append(scrim, box);
    const last = document.activeElement;
    requestAnimationFrame(() => { scrim.classList.add('on'); box.classList.add('on'); });
    let shut = false;
    const close = () => { if (shut) return; shut = true; o.onClose && o.onClose(); scrim.classList.remove('on'); box.classList.remove('on'); document.removeEventListener('keydown', key); setTimeout(() => { scrim.remove(); box.remove(); }, 420); last && last.focus && last.focus(); };
    const key = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    scrim.onclick = close; $('[data-x]', box).onclick = close;
    o.mount && o.mount(box, close);
    setTimeout(() => { const f = $('input:not([type=hidden]),select,textarea', $('.dw-b', box)); f && f.focus({ preventScroll: true }); }, 60);
    return close;
  };
  PN.drawer = o => layer('drawer', o);
  PN.modal = o => layer('modal', o);
  PN.confirm = o => new Promise(res => {
    let yes = false;
    PN.modal({
      title: o.title, body: `<p style="color:var(--ink-2)">${o.text}</p>`,
      foot: `<button class="btn ghost l" data-no>Cancel</button><button class="btn ${o.danger ? 'danger solid' : 'pri'}" data-yes>${PN.esc(o.ok || 'Confirm')}</button>`,
      mount: (box, c) => { $('[data-no]', box).onclick = c; $('[data-yes]', box).onclick = () => { yes = true; c(); }; setTimeout(() => $('[data-yes]', box).focus(), 80); },
      onClose: () => res(yes)
    });
  });

  /* ---------- form pieces ---------- */
  PN.f = {
    text: (name, label, val, o = {}) => `<div class="field ${o.full ? 'full' : ''}"><label for="f-${name}">${label}</label><input class="inp ${o.bn ? 'bn' : ''}" id="f-${name}" name="${name}" value="${PN.esc(val == null ? '' : val)}" ${o.type ? `type="${o.type}"` : ''} ${o.ph ? `placeholder="${PN.esc(o.ph)}"` : ''} ${o.req ? 'required' : ''} ${o.attr || ''}>${o.hint ? `<span class="hint">${o.hint}</span>` : ''}</div>`,
    area: (name, label, val, o = {}) => `<div class="field ${o.full ? 'full' : ''}"><label for="f-${name}">${label}</label><textarea class="inp ${o.bn ? 'bn' : ''}" id="f-${name}" name="${name}" rows="${o.rows || 3}" ${o.ph ? `placeholder="${PN.esc(o.ph)}"` : ''}>${PN.esc(val || '')}</textarea>${o.hint ? `<span class="hint">${o.hint}</span>` : ''}</div>`,
    money: (name, label, val, o = {}) => `<div class="field ${o.full ? 'full' : ''}"><label for="f-${name}">${label}</label><div class="pre"><span>৳</span><input class="inp num" id="f-${name}" name="${name}" type="number" min="0" step="1" inputmode="numeric" value="${val == null ? '' : val}" ${o.req ? 'required' : ''}></div>${o.hint ? `<span class="hint">${o.hint}</span>` : ''}</div>`,
    sel: (name, label, val, opts, o = {}) => `<div class="field ${o.full ? 'full' : ''}"><label for="f-${name}">${label}</label><select class="sel" id="f-${name}" name="${name}">${opts.map(([v, l]) => `<option value="${PN.esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${PN.esc(l)}</option>`).join('')}</select>${o.hint ? `<span class="hint">${o.hint}</span>` : ''}</div>`,
    sw: (name, label, on, o = {}) => `<label class="check" style="justify-content:space-between"><span>${label}${o.hint ? `<span class="meta" style="display:block;font-weight:500">${o.hint}</span>` : ''}</span><span class="sw"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i></span></label>`
  };
  PN.form = el => {
    const o = {};
    $$('[name]', el).forEach(x => { if (x.type === 'radio') { if (x.checked) o[x.name] = x.value; return; } o[x.name] = x.type === 'checkbox' ? x.checked : x.type === 'number' ? (x.value === '' ? null : Number(x.value)) : x.value.trim(); });
    return o;
  };

  /* ---------- theme ---------- */
  const THEME = 'khabo.panel.theme';
  PN.theme = () => { let t = 'light'; try { t = localStorage.getItem(THEME) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (e) { } return t; };
  const applyTheme = () => { document.documentElement.dataset.theme = PN.theme(); };
  PN.toggleTheme = () => { try { localStorage.setItem(THEME, PN.theme() === 'dark' ? 'light' : 'dark'); } catch (e) { } applyTheme(); paintSide(); };
  applyTheme();

  /* ---------- login ---------- */
  function loginPage() {
    const pics = ['in', 'i4', 'kt', 'di', 'i3', 'bw', 'i2', 'ch', 'iA', 'fu', 'i5', 'b4', 'iB', 'th', 'iC', 'pl', 'ro', 'na'];
    const col = i => { const s = pics.filter((_, j) => j % 3 === i); return `<div class="lg-col">${[...s, ...s].map(k => `<img src="${PN.src(k, 360)}" alt="" loading="lazy">`).join('')}</div>`; };
    const accts = [['admin', 'admin', 'khabo team · Master', 'Everything', null], ...PN.users().filter(u => ['client1', 'client2', 'client3'].includes(u.u) && PN.r(u.rid)).map(u => [u.u, u.u, PN.r(u.rid).name.en, 'Only this restaurant', PN.r(u.rid)])];
    const levels = ['manager', 'support', 'sales', 'finance'];
    $('#app').innerHTML = `<main class="login">
      <section class="lg-art" aria-hidden="true">
        <div class="lg-wall">${col(0)}${col(1)}${col(2)}</div>
        <div class="lg-brand">${PN.logo}<span>khabo</span></div>
        <div class="lg-say"><h2>Your restaurant, kept up to date in minutes.</h2><p>Change prices, mark dishes sold out, answer reviews and print table QR cards. Every change shows on khabo straight away.</p></div>
      </section>
      <section class="lg-form">
        <form class="lg-box" novalidate>
          <h1>Sign in</h1>
          <p>For khabo partner restaurants and the khabo team.</p>
          <div class="lg-fields">
            <div class="lg-err" role="alert">${PN.ico('warning', 'sm')}<span></span></div>
            ${PN.f.text('u', 'Username, mobile or email', '', { attr: 'autocomplete="username" autocapitalize="off" spellcheck="false"' })}
            <div class="field" data-inv hidden><label for="f-code">Invite code</label><input class="inp num" id="f-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="6 digits"></div>
            <div class="field"><label for="f-p" data-pl>Password</label><div class="pwd"><input class="inp" id="f-p" name="p" type="password" autocomplete="current-password"><button type="button" class="ibtn sm" data-eye aria-label="Show password">${PN.ico('eye', 'sm')}</button></div></div>
            <div class="lg-row"><label class="check"><input type="checkbox" name="keep" checked> Keep me signed in</label></div>
            <button class="btn pri lg" type="submit"><span data-go>Sign in</span> ${PN.ico('arrow-right', 'sm')}</button>
            <button type="button" class="lg-inv" data-invt>I have an invite code</button>
          </div>
          <div class="lg-demo">
            <h3>Test accounts for this prototype (tap to fill)</h3>
            <div class="lg-accts">${accts.map(([u, p, n, s, r]) => `<button type="button" class="lg-acct" data-u="${u}" data-p="${p}">${r ? PN.mono(r) : `<span class="mono" style="--d:#2A3DB8;--a:#fff">${PN.ico('shield-check', 'sm')}</span>`}<span><b>${PN.esc(n)}</b><span class="meta">${s}</span></span><code>${u} / ${p}</code></button>`).join('')}</div>
            <div class="lg-lv"><span class="meta">Other khabo team levels:</span>${levels.map(l => `<button type="button" class="lg-acct sm" data-u="${l}" data-p="${l}" title="${PN.esc(PN.LEVELS[l].note)}"><code>${l} / ${l}</code></button>`).join('')}</div>
          </div>
          <a class="lg-back" href="../index.html">${PN.ico('arrow-left', 'sm')} Back to khabo</a>
        </form>
      </section>
    </main>`;
    const form = $('form'), err = $('.lg-err');
    $('[data-eye]').onclick = e => { const i = $('#f-p'); i.type = i.type === 'password' ? 'text' : 'password'; e.currentTarget.setAttribute('aria-label', i.type === 'password' ? 'Show password' : 'Hide password'); };
    $$('.lg-acct').forEach(b => b.onclick = () => { $('#f-u').value = b.dataset.u; $('#f-p').value = b.dataset.p; $('button[type=submit]').focus(); });
    /* first time with an invite: the same box asks for the code and a new password */
    let inv = /invite/.test(location.hash);
    const mode = () => { $('[data-inv]').hidden = !inv; $('[data-pl]').textContent = inv ? 'Choose a password' : 'Password'; $('#f-p').autocomplete = inv ? 'new-password' : 'current-password'; $('[data-go]').textContent = inv ? 'Set password and sign in' : 'Sign in'; $('[data-invt]').textContent = inv ? 'I already have a password' : 'I have an invite code'; $('.lg-box h1').textContent = inv ? 'Join your team' : 'Sign in'; };
    $('[data-invt]').onclick = () => { inv = !inv; mode(); err.classList.remove('on'); $('#f-u').focus(); }; mode();
    form.onsubmit = e => {
      e.preventDefault();
      const v = PN.form(form);
      if (!v.u || !v.p || inv && !v.code) { err.querySelector('span').textContent = inv ? 'Enter your username, mobile or email, the code and a new password.' : 'Enter your username and password.'; err.classList.remove('on'); void err.offsetWidth; err.classList.add('on'); return; }
      const res = inv ? PN.acceptInvite(v.u, v.code, v.p, v.keep) : PN.signIn(v.u, v.p, v.keep);
      if (res.error) { err.querySelector('span').textContent = res.error; err.classList.remove('on'); void err.offsetWidth; err.classList.add('on'); $('#f-p').select(); return; }
      location.hash = '#/'; boot();
      const n = res.user.role === 'admin' && PN.can('rest.admin') ? PN.openRequests().length : 0;
      if (n) PN.toast(`${n} request${n > 1 ? 's' : ''} from restaurants waiting for you.`, 'ok', null);
    };
    $('#f-u').focus();
  }

  /* ---------- the shell ---------- */
  PN.views = PN.views || {};
  const REST_NAV = [
    ['overview', 'Overview', 'squares-four'], ['menu', 'Menu & prices', 'list'], ['page', 'Restaurant page', 'storefront'], ['site', 'Your website', 'globe-hemisphere-east'], ['photos', 'Photos', 'images'],
    ['deals', 'Deals', 'tag'], ['events', 'Events', 'calendar-blank'], ['reviews', 'Reviews', 'chat-circle-dots'], ['qr', 'Table QR', 'qr-code'], ['print', 'Print menu', 'printer'], ['insights', 'Price insights', 'chart-line-up'], ['team', 'Team & account', 'users']
  ];
  PN.REST_NAV = REST_NAV;
  /* each admin page and the permission it needs (see PN.LEVELS in store.js) */
  const ADMIN_NAV = [
    ['', 'Overview', 'squares-four'], ['requests', 'Requests', 'paper-plane-right', 'rest.admin'], ['restaurants', 'Restaurants', 'storefront', 'rest.view'], ['users', 'Team & users', 'users', ['users.rest', 'users.admin']], ['reviews', 'Reviews', 'chat-circle-dots', 'reviews.moderate'],
    ['dealorder', 'Deal order', 'arrows-down-up', 'rest.admin'], ['billing', 'Plans & billing', 'credit-card', 'billing'], ['leads', 'Leads', 'briefcase', 'leads'], ['content', 'Site text', 'translate', 'site'], ['activity', 'Activity', 'clock', 'activity']
  ];
  const allowed = item => !item[3] || [].concat(item[3]).some(p => PN.can(p));
  /* inside one restaurant: content pages need rest.edit, Admin settings needs any of these */
  const SETTINGS_PERMS = ['rest.admin', 'billing', 'rest.delete', 'users.rest'];
  PN.restViewOk = (view, r) => view === 'overview' ? PN.can('rest.view') : view === 'settings' ? SETTINGS_PERMS.some(p => PN.can(p)) : PN.can('rest.edit');
  PN.noAccess = (what) => ({ title: 'No access', sub: '', html: `<div class="card empty" style="padding:48px 24px">${PN.ico('lock-simple')}<b>Your level cannot open ${PN.esc(what)}</b>Ask a Master admin if you need it. Every attempt is written to the activity log.</div>` });
  let me = null, cur = { view: '', rid: null };

  const badge = (key) => {
    if (key === 'reviews') { const n = PN.reviews(me.role === 'admin' ? null : me.rid).filter(v => !v.reply && !v.hidden && v.st <= 3).length; return n ? `<span class="cnt">${n}</span>` : ''; }
    if (key === 'restaurants') return `<span class="cnt dim">${PN.all().length}</span>`;
    if (key === 'requests') { const n = PN.openRequests().length; return n ? `<span class="cnt gold" title="${n} waiting">${n}</span>` : ''; }
    if (key === 'team' && me.role === 'restaurant') { const n = PN.replies(me.rid).length; return n ? `<span class="cnt gold" title="New answer from khabo">${n}</span>` : ''; }
    return '';
  };
  function paintSide() {
    const side = $('.side'); if (!side) return;
    const dark = PN.theme() === 'dark';
    let ctx = '', nav = '';
    if (me.role === 'restaurant') {
      const r = PN.r(me.rid);
      document.documentElement.style.setProperty('--accent', r.theme.accent);
      document.documentElement.style.setProperty('--accent-ink', r.theme.deep);
      /* the restaurant's own card: its cover photo, its logo, its colours and its font */
      const cover = r.hero && r.hero[0] ? `<img src="${PN.src(r.hero[0], 600)}" alt="">` : '';
      const mark = r.brand && r.brand.logo ? `<img src="${K.restFile(r, r.brand.logo)}" alt="">` : `<i>${PN.esc(r.mono || r.name.en.slice(0, 2).toUpperCase())}</i>`;
      ctx = `<div class="side-ctx" data-font="${r.theme.font || 'sans'}" style="--d:${r.theme.deep};--a:${r.theme.accent}"><span class="sc-ph">${cover}</span>
        <div class="sc-id"><span class="sc-logo">${mark}</span><div class="sc-tx"><b>${PN.esc(r.name.en)}</b><span>${PN.ico('map-pin', 'sm')}${PN.esc(PN.where(r))}</span></div></div>
        <a class="sc-go" href="${PN.page(r)}" target="_blank" rel="noopener">View your page${PN.ico('arrow-up-right', 'sm')}</a></div>`;
      nav = `<nav class="nav" aria-label="Restaurant">${REST_NAV.map(([k, l, i]) => `<a class="nl ${cur.view === k ? 'on' : ''}" href="#/${k}">${PN.ico(i)}<span>${l}</span>${badge(k)}</a>`).join('')}</nav>`;
    } else {
      document.documentElement.style.removeProperty('--accent'); document.documentElement.style.removeProperty('--accent-ink');
      const active = cur.rid ? 'restaurants' : cur.view;
      nav = `<nav class="nav" aria-label="Admin"><h4>khabo team</h4>${ADMIN_NAV.filter(allowed).map(([k, l, i]) => `<a class="nl ${active === k ? 'on' : ''}" href="#/${k}">${PN.ico(i)}<span>${l}</span>${badge(k)}</a>`).join('')}</nav>`;
      if (cur.rid && PN.r(cur.rid)) { const r = PN.r(cur.rid); ctx = ''; nav += `<nav class="nav" aria-label="Now editing"><h4>Now editing</h4><a class="nl on" href="#/rest/${r.id}/overview" style="height:auto;padding:8px 12px">${PN.mono(r, 'sm')}<span style="line-height:1.25">${PN.esc(r.name.en)}</span></a></nav>`; }
    }
    side.innerHTML = `<a class="side-brand" href="#/">${PN.logo}<span>khabo</span><small>${me.role === 'admin' ? PN.levelOf(me) : 'Partner'}</small></a>${ctx}${nav}
      <div class="side-foot">
        <div class="side-tools"><button class="ibtn sm" data-theme-t aria-label="${dark ? 'Light' : 'Dark'} mode">${PN.ico(dark ? 'sun' : 'moon', 'sm')}</button><a class="ibtn sm" href="../index.html" target="_blank" rel="noopener" aria-label="Open khabo">${PN.ico('globe-hemisphere-east', 'sm')}</a><span class="note">Prototype</span></div>
        <div class="me"><span class="av sm">${PN.initials(me.name)}</span><div><b>${PN.esc(me.name)}</b><span>${me.role === 'admin' ? `${PN.levelOf(me)} · khabo team` : 'Owner'} · ${PN.esc(me.u)}</span></div><button class="ibtn sm" data-out aria-label="Sign out">${PN.ico('door-open', 'sm')}</button></div>
      </div>`;
    $('[data-theme-t]', side).onclick = PN.toggleTheme;
    $('[data-out]', side).onclick = () => { PN.signOut(); location.hash = '#/'; boot(); };
  }
  PN.refreshSide = paintSide;

  function shell() {
    $('#app').innerHTML = `<div class="shell"><aside class="side" aria-label="Main menu"></aside><div class="nav-scrim"></div>
      <div class="main"><div class="mtop"><button class="ibtn" data-nav aria-label="Open menu">${PN.ico('list')}</button><b></b></div><div id="view"></div></div></div>`;
    $('[data-nav]').onclick = () => document.body.classList.add('nav-open');
    $('.nav-scrim').onclick = () => document.body.classList.remove('nav-open');
    addEventListener('scroll', () => { const t = $('.top'); t && t.classList.toggle('scrolled', scrollY > 4); }, { passive: true });
  }

  /* ---------- page switching ---------- */
  function route() {
    if (!me) return;
    document.body.classList.remove('nav-open');
    const parts = location.hash.replace(/^#\/?/, '').split('#')[0].split('/').filter(Boolean);
    let view, r = null, admin = me.role === 'admin', base;
    if (!admin) { r = PN.r(me.rid); view = parts[0] || 'overview'; base = '#/'; if (!REST_NAV.some(x => x[0] === view)) view = 'overview'; cur = { view, rid: null }; }
    else if (parts[0] === 'rest' && PN.r(parts[1])) { r = PN.r(parts[1]); view = parts[2] || 'overview'; base = `#/rest/${r.id}/`; cur = { view, rid: r.id }; }
    else { view = parts[0] || ''; if (!ADMIN_NAV.some(x => x[0] === view)) view = ''; cur = { view, rid: null }; }
    paintSide();
    const fn = r ? (PN.views.rest[view] || PN.views.rest.overview) : PN.views.admin[view || 'overview'];
    const ctx = { r, admin, base, me, view };
    /* the same check a server would make: a page your level cannot open never renders */
    const item = !r && ADMIN_NAV.find(x => x[0] === view), blocked = admin && (r ? !PN.restViewOk(view, r) : item && !allowed(item));
    if (blocked) PN.log(r ? r.id : null, `Tried to open ${r ? view + ' for ' + r.name.en : item[1]} (no access)`);
    const v = blocked ? PN.noAccess(r ? `this page for ${r.name.en}` : item[1]) : fn(ctx);
    const tabs = admin && r ? `<nav class="rtabs" aria-label="${PN.esc(r.name.en)}">${[...REST_NAV.filter(x => x[0] !== 'team'), ['settings', 'Admin settings', 'sliders-horizontal']].filter(x => PN.restViewOk(x[0], r)).map(([k, l, i]) => `<a class="${view === k ? 'on' : ''}" href="${base}${k}">${PN.ico(i, 'sm')}${l}</a>`).join('')}</nav>` : '';
    const crumb = admin && r ? `<div class="crumb"><a href="#/restaurants">Restaurants</a>${PN.ico('caret-right', 'sm')}<span>${PN.esc(r.name.en)}</span></div>` : '';
    /* a fresh container each time, so click handlers from the previous page never run twice */
    const old = $('#view'), fresh = old.cloneNode(false); old.replaceWith(fresh);
    $('#view').innerHTML = `<header class="top"><div>${crumb}<h1>${v.title}</h1>${v.sub ? `<p class="sub">${v.sub}</p>` : ''}</div>${v.acts ? `<div class="acts">${v.acts}</div>` : ''}</header>${tabs}<div class="pg">${v.html}</div>`;
    $('.mtop b').textContent = r ? r.name.en : 'khabo admin';
    document.title = `${v.title.replace(/<[^>]+>/g, '')} · khabo ${admin ? 'admin' : 'partner'}`;
    scrollTo(0, 0);
    !blocked && v.mount && v.mount($('#view'), ctx);
  }
  PN.rerender = route;

  /* live news from other tabs: a new owner request pops up for the team; an answer pops up for the owner */
  PN.onSync = before => {
    me = PN.me(); if (!me) { boot(); return; }
    if (me.role === 'admin' && PN.can('rest.admin')) PN.openRequests().filter(q => !before.has(q.id)).forEach(q => PN.toast(`New request from ${PN.r(q.rid).name.en}: ${PN.REQ[q.kind] || q.kind}`, 'ok'));
    if (me.role === 'restaurant') PN.requests(me.rid).filter(q => before.get(q.id) === 'open' && (q.state === 'done' || q.state === 'declined')).forEach(q => PN.toast(`khabo ${q.state === 'done' ? 'said yes to' : 'declined'} your request: ${PN.REQ[q.kind] || q.kind}`, q.state === 'done' ? 'ok' : 'bad'));
    if (['', 'overview', 'requests'].includes(cur.view) && !document.querySelector('.scrim')) route(); else paintSide();
  };

  function boot() {
    me = PN.me();
    if (!me) { loginPage(); return; }
    shell(); route();
  }
  addEventListener('hashchange', () => { if (PN.me()) route(); });
  document.addEventListener('DOMContentLoaded', boot);
})();
