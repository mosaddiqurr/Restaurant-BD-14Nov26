/* khabo future prototypes: shared helpers and a small data layer.
   Reads the fictional demo data from ../data/common.js (window.K.data).
   Every edit is saved in this browser's localStorage under "kh2.future.*". Nothing is sent to a server. */
(function () {
  'use strict';
  const D = window.K && window.K.data;
  if (!D) {
    document.addEventListener('DOMContentLoaded', () => document.body.insertAdjacentHTML('afterbegin',
      '<p style="padding:24px;font:15px system-ui">Could not load the demo data (../data/common.js). Open this page through the local server.</p>'));
    return;
  }
  const F = window.F = { D, BRAND: 'khabo' };
  const DAY = 864e5, HOUR = 36e5;

  /* ---------- data access ---------- */
  const byId = {};
  D.restaurants.forEach(r => { byId[r.id] = r; r.menu.forEach(d => { if (!d.cat) d.cat = r.cats[0].id; }); });
  F.r = id => byId[id];
  F.all = () => D.restaurants.slice();
  F.area = id => D.areas.find(a => a.id === id) || { en: id };
  F.city = id => D.cities[id] || { en: id };
  F.type = id => D.types[id] || null;
  F.cat = (r, id) => (r.cats.find(c => c.id === id) || { en: id });
  F.facility = id => D.facilities[id] || { en: id, i: 'check' };

  /* ---------- text + numbers ---------- */
  const nf = new Intl.NumberFormat('en-IN');
  F.n = v => nf.format(v);
  F.tk = v => '৳' + nf.format(Math.round(v));
  F.L = o => o == null ? '' : (typeof o === 'string' ? o : (o.en != null ? o.en : ''));
  F.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  F.ico = (n, c = '') => `<svg class="ico ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  F.where = r => `${F.L(F.area(r.area))}, ${F.L(F.city(r.city))}`;
  F.pp = r => `${F.tk(r.ppl[0])} to ${F.tk(r.ppl[1])}`;
  F.plan = p => ({ starter: 'Starter', pro: 'Pro', premium: 'Premium' }[p] || p);
  F.mono = (r, cls = '') => `<span class="mono ${cls}" style="--d:${r.theme.deep};--a:${r.theme.accent}" aria-hidden="true">${F.esc(r.mono || r.name.en.slice(0, 2))}</span>`;
  F.pageUrl = id => `../index.html#/r/${encodeURIComponent(id)}`;
  F.bnDigits = s => String(s).replace(/[০-৯]/g, c => '০১২৩৪৫৬৭৮৯'.indexOf(c));
  F.slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9ঀ-৿]+/g, '-').replace(/^-+|-+$/g, '') || 'dish';
  F.hours = r => {
    const f = s => { let [h, m] = s.split(':').map(Number); const ap = h >= 12 && h < 24 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}${m ? ':' + String(m).padStart(2, '0') : ''}${ap}`; };
    return `${f(r.hours[0])} to ${f(r.hours[1])}`;
  };

  /* the logo, same mark as the main site */
  F.logoSvg = '<svg class="mk" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#2A3DB8"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="19.2" cy="13" r="3.1" fill="#F5A300"/></svg>';
  F.logo = (href, ctx) => `<a class="brand" href="${href}" aria-label="${F.BRAND}">${F.logoSvg}<span>${F.BRAND}</span>${ctx ? `<span class="brand-ctx">${F.esc(ctx)}</span>` : ''}</a>`;

  /* photos: Unsplash keys, pv: local panorama stills, ph: Poly Haven renders */
  F.src = (k, w = 400) => {
    if (!k) return '';
    if (k.startsWith('pv:')) { const [, p, v] = k.split(':'); return `${K.panoDir(p)}${p}-${v}.jpg`; }
    if (k.startsWith('ph:')) return `https://cdn.polyhaven.com/asset_img/primary/${k.slice(3)}.png?height=${w}`;
    const id = D.P[k]; return id ? `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop` : '';
  };
  F.thumb = (k, alt = '', cls = 'thumb') => k ? `<img class="${cls}" src="${F.src(k, 160)}" alt="${F.esc(alt)}" loading="lazy" decoding="async">` : `<span class="${cls} none" aria-hidden="true">${F.ico('fork-knife', 'sm')}</span>`;

  /* deterministic numbers from a string (FNV-1a + mulberry32) */
  F.hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  F.rng = seed => { let a = typeof seed === 'string' ? F.hash(seed) : seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  F.median = arr => { if (!arr.length) return null; const s = arr.slice().sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

  /* ---------- dates ---------- */
  const today0 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  F.today0 = today0;
  F.daysAgoTs = (n, hour = 11) => today0 - n * DAY + hour * HOUR;
  F.daysSince = t => Math.max(0, Math.floor((today0 + DAY - 1 - t) / DAY));
  F.date = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  F.dateShort = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  F.time = t => new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).replace(' at ', ', ');
  F.ago = t => {
    const ms = Date.now() - t;
    if (ms < HOUR) { const m = Math.max(1, Math.round(ms / 6e4)); return m < 2 ? 'just now' : `${m} minutes ago`; }
    if (ms < DAY) { const h = Math.round(ms / HOUR); return h === 1 ? '1 hour ago' : `${h} hours ago`; }
    const d = Math.round(ms / DAY); return d === 1 ? 'yesterday' : `${d} days ago`;
  };
  F.inDays = n => n == null ? '' : n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? 'yesterday' : n < 0 ? `${-n} days ago` : `in ${n} days`;
  F.month = (t = Date.now()) => new Date(t).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  /* ---------- storage ---------- */
  const PFX = 'kh2.future.';
  F.store = {
    get(k, d) { try { const v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { } }
  };
  F.reset = () => { try { Object.keys(localStorage).filter(k => k.startsWith(PFX)).forEach(k => localStorage.removeItem(k)); } catch (e) { } };

  /* ---------- menus, prices, price history ---------- */
  const edits = () => F.store.get('menuEdits', {});
  F.menu = rid => {
    const r = byId[rid]; if (!r) return [];
    const ed = edits()[rid] || {}, added = (F.store.get('menuAdded', {})[rid]) || [];
    return r.menu.concat(added).map(d => {
      const o = ed[d.id] || {};
      return Object.assign({}, d, { base: d.price, price: o.price != null ? o.price : d.price, soldOut: !!o.soldOut });
    });
  };
  F.dish = (rid, did) => F.menu(rid).find(d => d.id === did);
  const patchDish = (rid, did, patch) => { const all = edits(); all[rid] = all[rid] || {}; all[rid][did] = Object.assign(all[rid][did] || {}, patch); F.store.set('menuEdits', all); };
  F.logPrice = e => { const log = F.store.get('priceLog', []); log.push(e); F.store.set('priceLog', log); };
  F.history = (rid, did) => F.store.get('priceLog', []).filter(h => (!rid || h.rid === rid) && (!did || h.did === did)).sort((a, b) => b.at - a.at);
  F.setPrice = (rid, did, price, meta = {}) => {
    const d = F.dish(rid, did); price = Math.round(Number(price));
    if (!d || !(price > 0) || price === d.price) return false;
    patchDish(rid, did, { price });
    F.logPrice({ rid, did, name: F.L(d.name), from: d.price, to: price, at: Date.now(), by: meta.by || 'Admin', source: meta.source || 'Admin panel' });
    F.touch(rid, meta.by, 'edit');
    return true;
  };
  F.setSoldOut = (rid, did, v) => patchDish(rid, did, { soldOut: !!v });
  F.addDish = (rid, o, meta = {}) => {
    const r = byId[rid], all = F.store.get('menuAdded', {}), list = all[rid] = all[rid] || [];
    const ids = new Set(F.menu(rid).map(d => d.id));
    let id = F.slug(o.name), i = 2; while (ids.has(id)) id = `${F.slug(o.name)}-${i++}`;
    const d = { id, type: o.type || null, name: { en: o.name, bn: '' }, price: Math.round(o.price), p: null, cat: o.cat || r.cats[0].id, added: true };
    list.push(d); F.store.set('menuAdded', all);
    F.logPrice({ rid, did: id, name: o.name, from: null, to: d.price, at: Date.now(), by: meta.by || 'Admin', source: meta.source || 'Admin panel' });
    F.touch(rid, meta.by, 'edit');
    return d;
  };

  /* menu freshness. Sample "days since the menu was last confirmed" for the prototype.
     (The diner site shows its own, fresher demo values.) */
  const SEED_CONFIRMED = { 'shahi-handi': 2, 'nodir-paar': 26, 'kabab-ghor': 9, 'kathgolap': 12, 'cha-adda': 5, 'mirpur-bawarchi': 34, 'lake-view': 47, 'garden-rooftop': 18, 'mahasthan-bhoj': 24, 'shamiana': 31, 'nawabpur-kacchi': 15, 'satmatha-fuchka': 39 };
  F.confirmed = rid => {
    const c = F.store.get('confirmed', {})[rid];
    const seed = F.daysAgoTs(SEED_CONFIRMED[rid] != null ? SEED_CONFIRMED[rid] : 10, 11);
    return Math.max(c ? c.at : 0, seed);
  };
  F.confirmedBy = rid => { const c = F.store.get('confirmed', {})[rid]; return c && c.at >= F.confirmed(rid) ? c : null; };
  F.touch = (rid, by, kind = 'confirm', source) => { const c = F.store.get('confirmed', {}); c[rid] = { at: Date.now(), by: by || 'Admin', kind, source: source || '' }; F.store.set('confirmed', c); };
  F.snoozed = rid => { const s = F.store.get('snooze', {})[rid]; return s && s > Date.now() ? s : 0; };
  F.snooze = (rid, days) => { const s = F.store.get('snooze', {}); if (days) s[rid] = Date.now() + days * DAY; else delete s[rid]; F.store.set('snooze', s); };

  /* ---------- reviews ---------- */
  const PENDING = [
    { id: 'pq1', r: 'kabab-ghor', who: 'Sharmin Nahar', st: 5, vf: true, h: 2, t: 'Chap was perfect at midnight. The after 11pm combo is good value for two people.', ord: ['Beef Chap', 'Garlic Naan'], flags: [] },
    { id: 'pq2', r: 'shahi-handi', who: 'Mehedi Hasan', st: 2, vf: false, h: 5, t: 'Waited almost an hour on Friday and the kacchi came out lukewarm. Total scam at this price.', ord: ['Mutton Kacchi'], flags: ['Strong language', 'No visit proof'] },
    { id: 'pq3', r: 'kathgolap', who: 'Kazi Rafsan', st: 2, vf: true, h: 20, t: 'The menu here said ৳420 for tom yum but we paid ৳460. Please check the prices.', ord: ['Tom Yum Soup'], flags: ['Price complaint'] },
    { id: 'pq8', r: 'kathgolap', who: 'Kazi Rafsan', st: 1, vf: false, h: 21, t: 'Prices on the menu were lower than what we paid. Not going back.', ord: [], flags: ['Possible duplicate'] },
    { id: 'pq4', r: 'nodir-paar', who: 'Zarin Tasnim', st: 4, vf: true, h: 26, t: 'রূপচাঁদা ফ্রাই দারুণ ছিল। বসার জায়গা একটু কম, আগে ফোন করে যাবেন।', ord: ['Rupchanda Fry'], flags: [] },
    { id: 'pq5', r: 'mirpur-bawarchi', who: 'Nadia Islam', st: 5, vf: true, h: 50, t: 'Tehari 230 taka, ekdom fresh. Staff Rubel bhai khub helpful chilen.', ord: ['Beef Tehari'], flags: ['Names a staff member'] },
    { id: 'pq6', r: 'satmatha-fuchka', who: 'Tanjim Ahmed', st: 3, vf: false, h: 74, t: 'Fuchka valo, kintu boshar jayga nai. Rate ta ektu beshi mone holo.', ord: ['Fuchka'], flags: [] },
    { id: 'pq7', r: 'mahasthan-bhoj', who: 'Sumaiya Akter', st: 4, vf: true, h: 98, t: 'Doi was the best part. Kacchi portion could be a little bigger for the price.', ord: ['Bogura Kacchi'], flags: [] }
  ];
  const whenToTs = s => {
    const m = /(\d+)\s+(hour|day|week|month)/.exec(s || '');
    if (!m) return today0 - 30 * DAY;
    const n = +m[1], u = { hour: HOUR, day: DAY, week: 7 * DAY, month: 30 * DAY }[m[2]];
    return Date.now() - n * u;
  };
  F.reviews = () => {
    const st = F.store.get('reviewState', {});
    const pub = D.reviews.map((x, i) => ({ id: 'rv' + i, r: x.r, who: x.who, st: x.st, vf: x.vf, at: whenToTs(x.when.en), t: x.t, ord: x.ord || [], reply: x.reply ? F.L(x.reply) : '', replyAt: x.reply ? whenToTs(x.when.en) + DAY : 0, status: 'published', flags: [] }));
    const pend = PENDING.map(x => Object.assign({ status: 'pending', reply: '', at: Date.now() - x.h * HOUR }, x));
    return pub.concat(pend).map(x => Object.assign(x, st[x.id] || {})).sort((a, b) => b.at - a.at);
  };
  F.setReview = (id, patch) => { const st = F.store.get('reviewState', {}); st[id] = Object.assign(st[id] || {}, patch); F.store.set('reviewState', st); };
  F.stars = n => `<span class="stars" aria-label="${n} out of 5">${[1, 2, 3, 4, 5].map(i => F.ico(i <= n ? 'star-fill' : 'star', 'sm')).join('')}</span>`;

  /* ---------- deals ---------- */
  F.deals = rid => {
    const all = F.store.get('deals', {});
    if (all[rid]) return all[rid];
    const r = byId[rid];
    return r && r.deal ? [{ id: r.deal.id, title: F.L(r.deal), desc: F.L(r.deal.desc), when: F.L(r.deal.when), price: r.deal.price, was: r.deal.was, status: 'active', start: '', end: '', p: r.deal.p || null }] : [];
  };
  F.saveDeals = (rid, list) => { const all = F.store.get('deals', {}); all[rid] = list; F.store.set('deals', all); };
  F.dotw = () => {
    const s = F.store.get('dotw', null); if (s) return s;
    const out = {}; D.restaurants.forEach(r => { if (r.deal && r.deal.week) out[r.city] = r.id; }); return out;
  };
  F.setDotw = (city, rid) => { const s = F.dotw(); if (rid) s[city] = rid; else delete s[city]; F.store.set('dotw', s); };

  /* ---------- billing (sample) ---------- */
  F.PRICES = { dhaka: { starter: 1999, pro: 4999, premium: 9999 }, bogura: { starter: 1499, pro: 4499, premium: 9499 } };
  F.monthly = r => { const city = F.PRICES[r.city] || F.PRICES.dhaka; return r.founding && r.plan === 'pro' ? city.starter : city[r.plan]; };
  const BILL = {
    'shahi-handi': ['active', 'bKash', 6, 24], 'nodir-paar': ['active', 'Bank transfer', 11, 19], 'kabab-ghor': ['past_due', 'Nagad', 34, -3],
    'kathgolap': ['active', 'Bank transfer', 4, 26], 'cha-adda': ['active', 'bKash', 9, 21], 'mirpur-bawarchi': ['trial', '', null, 4],
    'lake-view': ['active', 'Cash', 14, 16], 'garden-rooftop': ['active', 'bKash', 2, 28], 'mahasthan-bhoj': ['active', 'Nagad', 7, 23],
    'shamiana': ['past_due', 'bKash', 37, -6], 'nawabpur-kacchi': ['active', 'Cash', 12, 18], 'satmatha-fuchka': ['trial', '', null, 2]
  };
  F.billing = rid => { const b = BILL[rid] || ['active', 'bKash', 10, 20]; return { status: b[0], method: b[1], paidDays: b[2], dueIn: b[3] }; };
  F.STATUS = { trial: ['Trial', 'indigo'], active: ['Active', 'green'], past_due: ['Past due', 'gold'], downgraded: ['Downgraded', 'red'], suspended: ['Suspended', 'red'], cancelled: ['Cancelled', ''] };
  F.statusTag = s => { const x = F.STATUS[s] || [s, '']; return `<span class="tag ${x[1]}">${x[0]}</span>`; };

  /* ---------- leads (sample) ---------- */
  const LEADS = [
    ['ld1', 'Dhaba Junction', 'banani', 'Faisal Mahmud', '+8801700000411', 'Visit', 'new', 'Sajid Hossain', 1, 'pro', 'Busy at lunch. Visit after 4pm.'],
    ['ld2', 'Lalbagh Tehari House', 'old-dhaka', 'Abdul Karim', '+8801700000417', 'Business page form', 'new', '', 0, 'starter', 'Signed up on the business page. Asked about the QR menu.'],
    ['ld3', 'Bogra Doi Ghar', 'satmatha', 'Shahin Alam', '+8801700000422', 'Referral', 'new', 'Nusrat Lima', 2, 'starter', 'Referred by Mahasthan Bhoj.'],
    ['ld4', 'Ilish Bari Kitchen', 'gulshan', 'Rehana Parvin', '+8801700000436', 'Visit', 'called', 'Sajid Hossain', 1, 'pro', 'Wants a 360 tour. Asked for the Pro price in writing.'],
    ['ld5', 'Uttara Grill Station', 'uttara', 'Tanvir Kabir', '+8801700000441', 'Business page form', 'called', 'Sajid Hossain', 3, 'pro', 'Owner travels until Thursday. Call the manager.'],
    ['ld6', 'Kolapata Kitchen', 'mirpur', 'Jesmin Ara', '+8801700000453', 'Visit', 'called', 'Nusrat Lima', -2, 'starter', 'Price-sensitive. Show the Starter one-pager.'],
    ['ld7', 'Rooftop 27', 'dhanmondi', 'Arman Hossain', '+8801700000462', 'Referral', 'demo', 'Sajid Hossain', 0, 'premium', 'Demo booked. Bring the tablet with the Kathgolap 360 tour.'],
    ['ld8', 'Chotpoti Mama', 'jaleshwaritola', 'Mamun Sarkar', '+8801700000478', 'Visit', 'demo', 'Nusrat Lima', 4, 'starter', 'Liked the print menu. Wants to see a sample report.'],
    ['ld9', 'Gol Chattar Cafe', 'mohammadpur', 'Sabrina Yasmin', '+8801700000485', 'Business page form', 'signed', 'Sajid Hossain', null, 'pro', 'Founding Partner. Shoot on Saturday.'],
    ['ld10', 'Shorshe Kitchen', 'banani', 'Rezaul Haque', '+8801700000491', 'Visit', 'signed', 'Sajid Hossain', null, 'starter', '7-day trial started.']
  ];
  F.leads = () => F.store.get('leads', null) || LEADS.map(l => ({ id: l[0], name: l[1], area: l[2], contact: l[3], phone: l[4], source: l[5], stage: l[6], owner: l[7], next: l[8] == null ? null : today0 + l[8] * DAY, plan: l[9], notes: l[10], log: [] }));
  F.saveLeads = list => F.store.set('leads', list);

  /* ---------- team (sample) ---------- */
  F.ROLES = { admin: 'Admin', sales: 'Sales', content: 'Content', data_entry: 'Data entry', moderator: 'Moderator' };
  F.TEAM = [
    { name: 'Rumana Akter', role: 'admin', city: 'Dhaka', seen: 'Active now' },
    { name: 'Sajid Hossain', role: 'sales', city: 'Dhaka', seen: '2 hours ago' },
    { name: 'Nusrat Lima', role: 'sales', city: 'Bogura', seen: 'Yesterday' },
    { name: 'Tania Rahman', role: 'content', city: 'Dhaka', seen: 'Today' },
    { name: 'Mahin Chowdhury', role: 'data_entry', city: 'Dhaka', seen: 'Today' },
    { name: 'Arif Billah', role: 'moderator', city: 'Dhaka', seen: '3 days ago' }
  ];
  F.initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* menu groups */
  const NOT_MAIN = new Set(['drink', 'tea', 'dessert', 'naan', 'snack', 'bakery']);
  F.isMain = d => d.type && !NOT_MAIN.has(d.type);
  F.perPerson = d => d.price / (d.share || 1);

  /* ---------- ui helpers ---------- */
  F.toast = (msg, action) => {
    let w = document.querySelector('.toast-wrap');
    if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; w.setAttribute('role', 'status'); w.setAttribute('aria-live', 'polite'); document.body.appendChild(w); }
    const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = `<span>${F.esc(msg)}</span>${action ? `<button type="button">${F.esc(action.label)}</button>` : ''}`;
    if (action) t.querySelector('button').onclick = () => { action.run(); t.remove(); };
    w.appendChild(t); setTimeout(() => t.remove(), action ? 6000 : 3200);
  };
  /* modal: returns { el, close } */
  F.modal = ({ title, body, foot, wide, onClose }) => {
    const prev = document.activeElement;
    const ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = `<div class="dialog ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${F.esc(title)}">
      <div class="dialog-h"><h2>${F.esc(title)}</h2><button class="btn ghost icon" data-x aria-label="Close">${F.ico('x')}</button></div>
      <div class="dialog-b">${body}</div>${foot ? `<div class="dialog-f">${foot}</div>` : ''}</div>`;
    const close = () => { ov.remove(); document.removeEventListener('keydown', esc); onClose && onClose(); prev && prev.focus && prev.focus(); };
    const esc = e => { if (e.key === 'Escape') close(); };
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    ov.querySelector('[data-x]').onclick = close;
    document.addEventListener('keydown', esc);
    document.body.appendChild(ov);
    const f = ov.querySelector('.dialog-b input, .dialog-b textarea, .dialog-b select'); (f || ov.querySelector('[data-x]')).focus();
    return { el: ov, close };
  };
  F.confirm = (title, text, okLabel, danger) => new Promise(res => {
    const m = F.modal({ title, body: `<p class="ink2">${F.esc(text)}</p>`, foot: `<button class="btn" data-no>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${F.esc(okLabel)}</button>`, onClose: () => res(false) });
    m.el.querySelector('[data-no]').onclick = () => m.close();
    m.el.querySelector('[data-ok]').onclick = () => { res(true); m.close(); };
  });

  /* top bar for the diner-facing prototypes (compare, map) */
  F.siteBar = active => `<header class="topbar">${F.logo('../index.html')}
    <nav aria-label="Prototypes"><a href="compare.html" class="${active === 'compare' ? 'on' : ''}">Compare</a><a href="map.html" class="${active === 'map' ? 'on' : ''}">Map</a></nav>
    <span class="grow"></span><span class="proto-note">${F.ico('info', 'sm')}Prototype, fictional restaurants</span>
    <a class="btn sm ghost" href="index.html">All prototypes</a></header>`;
})();
