/* khabo panels: the data layer.

   PROTOTYPE ONLY. Everything is saved in this browser (localStorage key "khabo.panel.v1").
   The website reads the same key (see data/common.js), so a change made here shows on the site straight away.
   In the real build this becomes the database, with security rules that lock each restaurant account
   to its own restaurant.

   What is saved:
     users     login accounts (admin or restaurant)
     rest      a full copy of every restaurant that was changed or added
     gone      restaurants that were deleted
     reviews   per review: hidden by khabo, reply from the owner
     hist      price history per dish
     billing   plan and payment status per restaurant
     leads     restaurants the sales team is talking to
     log       every change: who, what, when */
(function () {
  'use strict';
  const KEY = 'khabo.panel.v1', SESSION = 'khabo.panel.session';
  const D = window.K.data;
  const PN = window.PN = window.PN || {};
  PN.D = D;

  /* ---------- who can do what ----------
     Restaurant owners (role "restaurant") only ever see and change their own restaurant, and never the fields in LOCKED.
     The khabo team (role "admin") has levels. Each level is a list of permissions; "master" has all of them. */
  PN.PERMS = {
    'rest.view': 'See all restaurants',
    'rest.edit': 'Edit menus, pages, photos and deals',
    'rest.admin': 'Name, web address, area, cuisine, 360 tour, film, visibility, Featured, Deal of the week',
    'rest.add': 'Add restaurants',
    'rest.delete': 'Delete restaurants',
    'reviews.moderate': 'Hide or keep reported reviews',
    'users.rest': 'Restaurant sign-in accounts',
    'users.admin': 'khabo team accounts and levels',
    'billing': 'Plans, payments and invoices',
    'leads': 'Sales leads',
    'site': 'Site text (home page and more)',
    'activity': 'Activity log',
    'reset': 'Reset the demo data'
  };
  PN.LEVELS = {
    master: { name: 'Master', note: 'Everything, including team accounts and money', perms: Object.keys(PN.PERMS) },
    manager: { name: 'Manager', note: 'Runs restaurants, reviews, sales and site text. No money, no team accounts, no deleting', perms: ['rest.view', 'rest.edit', 'rest.admin', 'rest.add', 'reviews.moderate', 'users.rest', 'leads', 'site', 'activity'] },
    support: { name: 'Support', note: 'Helps restaurants with menus, photos and deals, and looks after reviews', perms: ['rest.view', 'rest.edit', 'reviews.moderate', 'activity'] },
    sales: { name: 'Sales', note: 'Leads and adding new restaurants (they start hidden)', perms: ['rest.view', 'rest.add', 'leads'] },
    finance: { name: 'Finance', note: 'Plans, payments and invoices', perms: ['rest.view', 'billing', 'activity'] }
  };
  PN.can = (perm, user = PN.me()) => !!user && user.role === 'admin' && (PN.LEVELS[user.level || 'master'] || { perms: [] }).perms.includes(perm);
  PN.levelOf = u => u.role === 'admin' ? (PN.LEVELS[u.level || 'master'] || PN.LEVELS.support).name : 'Owner';
  /* fields only the khabo team (rest.admin) may change. An owner's save that touches them is undone. */
  PN.LOCKED = { name: 'name', slug: 'web address', area: 'area', city: 'city', cuisines: 'cuisine', tour: '360 tour', film: 'film', hidden: 'visibility', featured: 'Featured', founding: 'Founding Partner', plan: 'plan' };

  /* ---------- passwords: never kept as typed. Salted SHA-256 here; the real build uses Argon2 or bcrypt on the server ---------- */
  const sha256 = s => {
    const K2 = [], H = [], bytes = unescape(encodeURIComponent(s)), w = [], f = (n, x) => (n >>> x) | (n << (32 - x));
    let p = 2; for (let c = 0; c < 64; p++) { let q = 1; for (let d = 2; d * d <= p; d++) if (p % d === 0) { q = 0; break; } if (q) { if (c < 8) H[c] = (Math.pow(p, .5) * 4294967296) | 0; K2[c++] = (Math.pow(p, 1 / 3) * 4294967296) | 0; } }
    const m = bytes + '\x80'; let l = m.length; const words = [];
    for (let i = 0; i < l; i++) words[i >> 2] |= (m.charCodeAt(i) & 255) << ((3 - i % 4) * 8);
    const n = ((bytes.length + 8) >> 6) + 1 << 4; words[n - 1] = bytes.length * 8; for (let i = 0; i < n; i++) words[i] = words[i] | 0;
    for (let j = 0; j < n; j += 16) {
      const o = H.slice(0, 8);
      for (let i = 0; i < 64; i++) {
        if (i < 16) w[i] = words[j + i];
        else { const a = w[i - 15], b = w[i - 2]; w[i] = (w[i - 16] + (f(a, 7) ^ f(a, 18) ^ (a >>> 3)) + w[i - 7] + (f(b, 17) ^ f(b, 19) ^ (b >>> 10))) | 0; }
        const [A, B, C, Dd, E, F, G, Hh] = H;
        const t1 = (Hh + (f(E, 6) ^ f(E, 11) ^ f(E, 25)) + ((E & F) ^ (~E & G)) + K2[i] + w[i]) | 0, t2 = ((f(A, 2) ^ f(A, 13) ^ f(A, 22)) + ((A & B) ^ (A & C) ^ (B & C))) | 0;
        H.unshift((t1 + t2) | 0); H[4] = (H[4] + t1) | 0; H.pop();
      }
      for (let i = 0; i < 8; i++) H[i] = (H[i] + o[i]) | 0;
    }
    return H.slice(0, 8).map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  };
  PN.sha256 = sha256;
  const salt = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
  const setPw = (u, p) => { u.salt = salt(); u.hash = sha256(u.salt + '|' + p); delete u.p; u.sv = (u.sv || 0) + 1; };
  PN.checkPw = (u, p) => !!u && !!u.hash && sha256(u.salt + '|' + p) === u.hash;

  /* ---------- invites: nobody ever sets a password for someone else ----------
     A new account gets a 6-digit code (kept only as a hash) that works for 3 days. The person signs in once with the
     code and picks their own password. In the real build the code goes to their phone by SMS (or by email) automatically. */
  PN.INVITE_DAYS = 3;
  const code6 = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, '0');
  const newInvite = u => { const c = code6(), s = salt(); u.inv = { salt: s, hash: sha256(s + '|' + c), exp: Date.now() + PN.INVITE_DAYS * 864e5 }; return c; };
  /* phone numbers and emails are kept in one tidy form, so people can sign in with either */
  PN.contactOf = v => { v = String(v || '').trim().toLowerCase(); const ph = v.replace(/[\s-]/g, ''); if (/^(\+?88)?01[3-9]\d{8}$/.test(ph)) return '+880' + ph.slice(-10); return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v) ? v : ''; };
  PN.findUser = id => { const v = String(id || '').trim().toLowerCase(), c = PN.contactOf(v); return db.users.find(x => x.u.toLowerCase() === v || (c && x.contact === c)); };

  const DEFAULT_USERS = [
    { u: 'admin', p: 'admin', name: 'Mosaddiqur Rahman', role: 'admin', level: 'master' },
    { u: 'manager', p: 'manager', name: 'Farzana Karim', role: 'admin', level: 'manager' },
    { u: 'support', p: 'support', name: 'Rafiq Islam', role: 'admin', level: 'support' },
    { u: 'sales', p: 'sales', name: 'Sabbir Hasan', role: 'admin', level: 'sales' },
    { u: 'finance', p: 'finance', name: 'Nusrat Jahan', role: 'admin', level: 'finance' },
    { u: 'client1', p: 'client1', name: 'Kamal Hossain', role: 'restaurant', rid: 'shahi-handi' },
    { u: 'client2', p: 'client2', name: 'Nadia Rahman', role: 'restaurant', rid: 'kathgolap' },
    { u: 'client3', p: 'client3', name: 'Tanvir Ahmed', role: 'restaurant', rid: 'cha-adda' }
  ];
  const DEFAULT_LEADS = [
    { id: 'l1', name: 'Haji Biryani', area: 'old-dhaka', person: 'Mr. Selim', phone: '+8801711000001', stage: 'new', note: 'Walk-in visit planned for Thursday.' },
    { id: 'l2', name: 'Spice Garden', area: 'gulshan', person: 'Ms. Farah', phone: '+8801711000002', stage: 'contacted', note: 'Wants to see the 360 tour first.' },
    { id: 'l3', name: 'Chillox', area: 'dhanmondi', person: 'Mr. Arif', phone: '+8801711000003', stage: 'visited', note: 'Interested in Pro. Asked about QR cards.' },
    { id: 'l4', name: 'Bogura Doi Ghar', area: 'satmatha', person: 'Mr. Rahim', phone: '+8801711000004', stage: 'trial', note: 'Trial ends 30 Nov.' },
    { id: 'l5', name: 'Sultan’s Dine', area: 'banani', person: 'Mr. Jamil', phone: '+8801711000005', stage: 'new', note: '' },
    { id: 'l6', name: 'The Tea House', area: 'uttara', person: 'Ms. Nabila', phone: '+8801711000006', stage: 'won', note: 'Signed Starter. Shoot booked.' }
  ];

  let db;
  const load = () => {
    try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { db = null; }
    db = db || {};
    db.users = db.users || DEFAULT_USERS.map(x => Object.assign({ active: true, created: Date.now() }, x));
    db.users.forEach(x => { if (x.name === 'Rumana Akter') x.name = 'Mosaddiqur Rahman'; }); /* old demo name */
    DEFAULT_USERS.filter(d => d.role === 'admin' && d.level !== 'master' && !db.users.some(x => x.u === d.u)).forEach(d => db.users.push(Object.assign({ active: true, created: Date.now() }, d)));
    db.users.forEach(x => { if (x.role === 'admin' && !x.level) x.level = 'master'; if (x.p != null) setPw(x, x.p); });
    db.requests = db.requests || [];
    ['rest', 'gone', 'reviews', 'hist', 'billing'].forEach(k => db[k] = db[k] || {});
    db.leads = db.leads || DEFAULT_LEADS.map(x => Object.assign({}, x));
    db.log = db.log || [];
  };
  load();

  /* returns false when the browser storage is full (big photos) */
  PN.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { PN.toast && PN.toast('This browser is out of space. Remove a few uploaded photos and try again.', 'bad'); return false; }
  };
  PN.db = () => db;
  PN.resetAll = () => { localStorage.removeItem(KEY); };

  /* ---------- session ---------- */
  /* A session ends when it runs out, when the password is changed or reset (sv goes up) or when the account is turned off.
     The khabo team is signed out after 30 minutes without activity and can never stay signed in for days. */
  const IDLE = { admin: 30 * 60e3, restaurant: 12 * 3600e3 }, LONG = { admin: 12 * 3600e3, restaurant: 30 * 864e5 };
  const MAX_TRIES = 5, LOCK_MIN = 10;
  const readS = () => { try { const raw = sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
  PN.me = () => {
    const s = readS(); if (!s) return null;
    const u = db.users.find(x => x.u === s.u);
    const now = Date.now();
    if (!u || !u.active || s.sv !== (u.sv || 0) || now > s.exp || (!s.keep || u.role === 'admin') && now - s.at > IDLE[u.role]) { PN.signOut(); return null; }
    if (now - s.at > 60e3) { s.at = now; (s.keep ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(s)); }
    return u;
  };
  PN.signIn = (u, p, keep) => {
    const user = PN.findUser(u), now = Date.now();
    const bad = 'That username and password do not match.';
    if (user && user.lockUntil > now) return { error: `Too many wrong tries. Try again in ${Math.ceil((user.lockUntil - now) / 60e3)} minutes, or ask the khabo team.` };
    if (user && !user.hash && user.inv) return { error: 'This account is not set up yet. Tap “I have an invite code” below.' };
    if (!user || !PN.checkPw(user, p)) {
      if (user) { user.fails = (user.fails || 0) + 1; if (user.fails >= MAX_TRIES) { user.lockUntil = now + LOCK_MIN * 60e3; user.fails = 0; db.log.unshift({ at: now, who: 'Security', role: '', rid: user.rid || null, what: `Locked ${user.u} for ${LOCK_MIN} minutes after ${MAX_TRIES} wrong passwords` }); PN.save(); return { error: `Too many wrong tries. This account is locked for ${LOCK_MIN} minutes. The khabo team can unlock it sooner.` }; } PN.save(); }
      return { error: user && user.fails >= MAX_TRIES - 2 ? `${bad} ${MAX_TRIES - user.fails} tries left before the account is locked for a while.` : bad };
    }
    if (!user.active) return { error: 'This account is turned off. Ask the khabo team to turn it back on.' };
    if (user.role === 'restaurant' && !PN.r(user.rid)) return { error: 'The restaurant for this account no longer exists.' };
    user.fails = 0; delete user.lockUntil;
    const long = keep && user.role !== 'admin';
    const s = { u: user.u, sv: user.sv || 0, at: now, exp: now + (keep ? LONG : IDLE)[user.role], keep: long };
    PN.signOut(); (long ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(s));
    user.last = now; PN.save();
    return { user };
  };
  PN.signOut = () => { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); };
  /* a new password signs the person out everywhere else; their own session carries on */
  PN.setPassword = (u, p) => {
    const self = PN.me() === u; setPw(u, p);
    if (self) { const s = readS(); if (s) { s.sv = u.sv; (s.keep ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(s)); } }
    PN.save();
  };
  PN.denied = what => { PN.toast(`Only the khabo team can change ${what}.`, 'bad'); return false; };

  /* ---------- restaurants ---------- */
  PN.all = () => D.restaurants;
  PN.r = id => D.restaurants.find(r => r.id === id);
  const clone = o => JSON.parse(JSON.stringify(o));
  /* save one restaurant after a change; `what` goes in the activity log */
  /* the locked fields as they were last saved by someone allowed to change them */
  const lockOf = r => { const o = {}; Object.keys(PN.LOCKED).forEach(k => { o[k] = r[k] === undefined ? null : clone(r[k]); }); o._week = (r.deals || []).filter(d => d.week).map(d => d.id); return o; };
  const base = {}; D.restaurants.forEach(r => { base[r.id] = lockOf(r); });
  /* every save goes through here, like a server check: owners only their own restaurant, and never the locked fields */
  PN.saveR = (r, what) => {
    const me = PN.me(); if (!me) return false;
    if (me.role === 'restaurant' ? me.rid !== r.id : !PN.can('rest.edit') && !PN.can('rest.admin')) { PN.toast('You cannot change this restaurant.', 'bad'); return false; }
    if (!PN.can('rest.admin')) {
      const was = base[r.id] || lockOf(r), now = lockOf(r), bad = Object.keys(PN.LOCKED).filter(k => JSON.stringify(was[k]) !== JSON.stringify(now[k]));
      const addedWeek = now._week.filter(id => !was._week.includes(id));
      if (bad.length || addedWeek.length) {
        bad.forEach(k => { if (was[k] === null) delete r[k]; else r[k] = clone(was[k]); });
        (r.deals || []).forEach(d => { if (addedWeek.includes(d.id)) delete d.week; });
        PN.log(r.id, `Tried to change ${bad.map(k => PN.LOCKED[k]).concat(addedWeek.length ? ['Deal of the week'] : []).join(', ')} (blocked)`); PN.save();
        return PN.denied(bad.map(k => PN.LOCKED[k]).concat(addedWeek.length ? ['Deal of the week'] : []).join(', '));
      }
    } else base[r.id] = lockOf(r);
    db.rest[r.id] = clone(r);
    if (what) PN.log(r.id, what);
    return PN.save();
  };
  PN.addR = r => { if (!PN.can('rest.add')) return PN.denied('the list of restaurants'); base[r.id] = lockOf(r); D.restaurants.push(r); db.rest[r.id] = clone(r); PN.log(r.id, 'Added the restaurant'); return PN.save(); };
  PN.deleteR = id => {
    if (!PN.can('rest.delete')) return PN.denied('this');
    const i = D.restaurants.findIndex(r => r.id === id); if (i < 0) return;
    const name = D.restaurants[i].name.en;
    D.restaurants.splice(i, 1); delete db.rest[id]; db.gone[id] = true;
    db.users.forEach(u => { if (u.rid === id) u.active = false; });
    PN.log(null, `Deleted ${name}`);
    PN.save();
  };

  /* prices: every change is kept, newest last */
  PN.hist = (rid, did) => db.hist[rid + '|' + did] || [];
  PN.priceChange = (r, d, v) => {
    const k = r.id + '|' + d.id, h = db.hist[k] = db.hist[k] || [];
    if (!h.length) h.push({ at: Date.now() - 1, v: d.price, who: 'Before' });
    h.push({ at: Date.now(), v, who: (PN.me() || {}).name || '' });
    d.price = v; r.checkedAt = Date.now(); r.checked = 0;
  };

  /* ---------- reviews ---------- */
  PN.reviews = rid => D.reviews.filter(v => !rid || v.r === rid);
  PN.revState = v => db.reviews[K.revKey(v)] || {};
  PN.setRev = (v, patch, what) => {
    const me = PN.me(); if (!me) return false;
    if ('hidden' in patch && !PN.can('reviews.moderate')) return PN.denied('whether a review shows');
    if ('reply' in patch && (me.role === 'restaurant' ? me.rid !== v.r : !PN.can('rest.edit'))) { PN.toast('You cannot reply for this restaurant.', 'bad'); return false; }
    const k = K.revKey(v), s = db.reviews[k] = Object.assign({}, db.reviews[k], patch);
    if ('hidden' in patch) v.hidden = !!s.hidden;
    if ('reply' in patch) v.reply = s.reply || undefined;
    PN.log(v.r, what); PN.save();
  };

  /* ---------- users ---------- */
  PN.users = () => db.users;
  /* who may manage an account: owners their own team, team members with users.rest any restaurant account,
     only users.admin the khabo team. Nobody can remove or turn off themselves, or the last master. */
  PN.canManage = (target, me = PN.me()) => {
    if (!me) return false;
    if (me.role === 'restaurant') return target.role === 'restaurant' && target.rid === me.rid;
    return target.role === 'admin' ? PN.can('users.admin', me) : PN.can('users.rest', me);
  };
  const masters = () => db.users.filter(x => x.role === 'admin' && (x.level || 'master') === 'master' && x.active);
  PN.isLastMaster = u => u.role === 'admin' && (u.level || 'master') === 'master' && masters().length <= 1;
  /* returns the invite code to pass on (shown once), or false */
  PN.addUser = x => {
    if (!PN.canManage(x)) return PN.denied('these accounts');
    const u = Object.assign({ active: true, created: Date.now(), by: (PN.me() || {}).name }, x); delete u.p;
    const code = newInvite(u);
    db.users.push(u); PN.log(x.rid || null, `Invited ${x.role === 'admin' ? PN.LEVELS[x.level].name + ' team member' : 'team member'} ${x.u}`); PN.save(); return code;
  };
  /* forgot password: the old one is wiped and they get a new invite code (nobody sets a password for someone else) */
  PN.resetToInvite = u => { if (!PN.canManage(u)) return PN.denied('this account'); delete u.hash; delete u.salt; u.sv = (u.sv || 0) + 1; const c = newInvite(u); PN.log(u.rid || null, `Reset ${u.u}: old password removed, new invite code made`); PN.save(); return c; };
  PN.reinvite = u => { if (!PN.canManage(u) || u.hash) return false; const c = newInvite(u); PN.log(u.rid || null, `Sent a new invite code to ${u.u}`); PN.save(); return c; };
  /* first sign-in with the code: they choose their own password and are signed in */
  PN.acceptInvite = (id, code, p, keep) => {
    const u = PN.findUser(id), now = Date.now(), bad = 'That invite code is not right, or it has run out. Ask for a new one.';
    if (!u || !u.inv || u.hash) return { error: bad };
    if (u.lockUntil > now) return { error: `Too many wrong tries. Try again in ${Math.ceil((u.lockUntil - now) / 60e3)} minutes.` };
    if (now > u.inv.exp || sha256(u.inv.salt + '|' + String(code).replace(/\D/g, '')) !== u.inv.hash) { u.fails = (u.fails || 0) + 1; if (u.fails >= MAX_TRIES) { u.lockUntil = now + LOCK_MIN * 60e3; u.fails = 0; } PN.save(); return { error: bad }; }
    if (String(p || '').length < 6) return { error: 'Choose a password of at least 6 characters.' };
    setPw(u, p); delete u.inv; u.fails = 0; u.joined = now; db.log.unshift({ at: now, who: u.name, role: u.role, rid: u.rid || null, what: 'Accepted the invite and set a password' }); PN.save();
    return PN.signIn(u.u, p, keep);
  };
  PN.removeUser = u => {
    const x = db.users.find(y => y.u === u), me = PN.me(); if (!x) return false;
    if (!PN.canManage(x)) return PN.denied('this account');
    if (x === me || PN.isLastMaster(x)) { PN.toast('You cannot remove yourself or the last Master account.', 'bad'); return false; }
    db.users.splice(db.users.indexOf(x), 1); PN.log(x.rid || null, `Removed user ${u}`); PN.save(); return true;
  };

  /* ---------- requests from owners for things only the khabo team can change (like a new name) ---------- */
  /* Each request lands in the team's Requests inbox (with a count in the menu and a pop-up in every open admin tab).
     A name is changed for them on Approve; the rest the team changes in Admin settings, then marks done.
     The owner sees the answer on their Overview and under Team & account. */
  PN.REQ = {
    name: 'Restaurant name', area: 'Area or map pin', slug: 'Web address', cuisine: 'Cuisine type',
    tour: '360° tour', film: 'Restaurant film', plan: 'Plan or billing', other: 'Something else'
  };
  PN.requests = rid => db.requests.filter(q => !rid || q.rid === rid);
  PN.openRequests = () => db.requests.filter(q => q.state === 'open' && PN.r(q.rid));
  PN.request = (rid, kind, data, note) => {
    const me = PN.me(); if (!me || me.role === 'restaurant' && me.rid !== rid) return false;
    db.requests.unshift({ id: 'q' + Date.now().toString(36), rid, kind, data, note, by: me.name, at: Date.now(), state: 'open' });
    PN.log(rid, `Asked khabo to change the ${(PN.REQ[kind] || kind).toLowerCase()}`); return PN.save();
  };
  PN.cancelRequest = q => { const me = PN.me(); if (!me || q.state !== 'open' || me.role === 'restaurant' && me.rid !== q.rid) return false; q.state = 'cancelled'; q.doneAt = Date.now(); q.ownerSeen = true; PN.log(q.rid, `Cancelled a request (${(PN.REQ[q.kind] || q.kind).toLowerCase()})`); return PN.save(); };
  PN.resolveRequest = (q, ok, reply) => {
    if (!PN.can('rest.admin')) return PN.denied('this');
    const r = PN.r(q.rid); q.state = ok ? 'done' : 'declined'; q.doneAt = Date.now(); q.doneBy = PN.me().name; q.reply = reply || ''; q.ownerSeen = false;
    if (ok && r && q.kind === 'name') { r.name = { en: q.data.en, bn: q.data.bn || q.data.en }; r.mono = (PN.initials(q.data.en) + q.data.en.replace(/\s/g, '').slice(1, 2).toUpperCase()).slice(0, 2); PN.saveR(r, `Changed the name to ${q.data.en} (owner request)`); }
    PN.log(q.rid, `${ok ? 'Approved' : 'Declined'} a request: ${(PN.REQ[q.kind] || q.kind).toLowerCase()}`); PN.save(); return true;
  };
  /* answers the owner has not looked at yet */
  PN.replies = rid => db.requests.filter(q => q.rid === rid && (q.state === 'done' || q.state === 'declined') && !q.ownerSeen);
  PN.seeReplies = rid => { let n = 0; db.requests.forEach(q => { if (q.rid === rid && !q.ownerSeen && q.state !== 'open') { q.ownerSeen = true; n++; } }); if (n) PN.save(); };

  /* another tab (or, in the real build, the server) changed the data: reload it and tell the page */
  addEventListener('storage', e => {
    if (e.key !== KEY) return;
    const before = new Map(db.requests.map(q => [q.id, q.state]));
    load(); PN.onSync && PN.onSync(before);
  });

  /* ---------- billing (sample until payments are real) ---------- */
  PN.PLANS = { starter: { name: 'Starter', price: 1999 }, pro: { name: 'Pro', price: 4999 }, premium: { name: 'Premium', price: 9999 } };
  PN.bill = r => {
    if (!db.billing[r.id]) {
      const n = PN.hash(r.id) % 10;
      db.billing[r.id] = { status: n < 6 ? 'paid' : n < 8 ? 'due' : n < 9 ? 'overdue' : 'trial', method: n % 2 ? 'bKash' : 'Nagad' };
    }
    return db.billing[r.id];
  };

  PN.setPlan = (r, plan) => {
    if (!PN.can('billing')) return PN.denied('plans');
    r.plan = plan; base[r.id] = Object.assign(base[r.id] || {}, { plan }); db.rest[r.id] = clone(r);
    PN.log(r.id, `Changed the plan to ${PN.PLANS[plan].name}`); return PN.save();
  };

  /* ---------- leads ---------- */
  PN.leads = () => db.leads;

  /* ---------- activity ---------- */
  PN.log = (rid, what) => {
    const me = PN.me();
    db.log.unshift({ at: Date.now(), who: me ? me.name : 'Someone', role: me ? me.role : '', rid, what });
    db.log.length = Math.min(db.log.length, 300);
  };
  PN.logs = rid => db.log.filter(x => !rid || x.rid === rid);

  /* deterministic sample numbers from a string, so the same restaurant always shows the same sample */
  PN.hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  PN.rng = seed => { let a = PN.hash(seed); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
})();
