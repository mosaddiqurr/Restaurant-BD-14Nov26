/* khabo service worker: keeps the QR table menu working with weak or no signal.
   Registered only by the table menu (components/table/offline.tsx). Hand-made, no plugin, nothing big up front.

   What it does
   - Table menu pages (/en/t/<id>, /bn/t/<id>): network first. A slow line gets a few seconds, then the copy
     saved on this phone is shown. Every good answer refreshes the saved copy.
   - Printed codes (/t/<id>): online the site sends the guest to their language; offline the saved copy opens.
   - Files the menu uses (/_next/static, /icons, /media, fonts, menu photos): stale-while-revalidate, with a
     cap on how many are kept. Only for table menu pages; the rest of the site is left alone.
   - Every other page: straight to the network. Only when there is no signal at all, the "No internet" page
     (/en/offline, /bn/offline, with the Rickshaw Run game) is shown instead of the browser's error. That page and
     its files are saved when the worker is installed, and refreshed on later installs.
   - Never touched: anything that is not a GET (API posts, forms) and /api. */
const V = 'v5';
const PAGES = 'khabo-pages-' + V, FILES = 'khabo-files-' + V, PICS = 'khabo-pics-' + V, OFF = 'khabo-offline-' + V;
const CAP = { [PAGES]: 30, [FILES]: 220, [PICS]: 120 };
const TABLE = /^\/(en|bn)\/t\/([^/]+)\/?$/;
const SHORT = /^\/t\/([^/]+)\/?$/;
const PHOTO_HOSTS = /^(images\.unsplash\.com|cdn\.polyhaven\.com)$/;
const FONT_HOSTS = /^fonts\.(gstatic|googleapis)\.com$/;
/* on a computer running the site for testing, code changes all the time: there files are network first */
const DEV = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.test$/.test(self.location.hostname);
/* how long a weak line gets before the saved copy is shown (longer on a test computer, where pages build on demand) */
const WAIT = DEV ? 12000 : 3500;

/* table menu tabs open right now (and since when the page on screen is a saved copy) */
const tableClients = new Set();
const served = new Map();

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(keepOffline().catch(() => {})); });

/* save the "No internet" pages and every file they use (scripts, styles, fonts, icons) */
async function keepOffline(name = OFF) {
  const cache = await caches.open(name), files = new Set();
  for (const l of ['en', 'bn']) {
    const res = await fetch('/' + l + '/offline', { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) continue;
    const html = await res.clone().text();
    await cache.put('/' + l + '/offline', res);
    for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+|\/icons\/[^"]+|\/icon\.svg)"/g)) files.add(m[1]);
  }
  for (const f of files) {
    try {
      const res = await fetch(f);
      if (!res.ok) continue;
      if (f.endsWith('.css')) {
        const css = await res.clone().text();
        for (const m of css.matchAll(/url\((\/_next\/static\/media\/[^)"']+)\)/g)) files.add(m[1]);
      }
      await cache.put(f, res);
    } catch { /* try again on the next install */ }
  }
  for (const f of ['/icons/regular.svg', '/icons/fill.svg', '/icons/bold.svg']) {
    try { const r = await fetch(f); if (r.ok) await cache.put(f, r); } catch { /* fine */ }
  }
}
/* no signal on a normal page: the saved "No internet" page in the page's language */
async function sitePage(e, url) {
  try {
    return await fetch(e.request);
  } catch (err) {
    const lang = /^\/bn(\/|$)/.test(url.pathname) ? 'bn' : 'en';
    const cache = await caches.open(OFF);
    const own = /^\/(en|bn)\/offline\/?$/.exec(url.pathname);
    if (own) {
      const hit = (await cache.match('/' + own[1] + '/offline')) || (await cache.match('/' + (own[1] === 'bn' ? 'en' : 'bn') + '/offline'));
      if (hit) return hit;
      throw err;
    }
    /* go to the saved page at its own address (the site's router needs the address to match the page),
       remembering where the person wanted to go so Try again can take them there */
    if (await cache.match('/' + lang + '/offline')) return Response.redirect(url.origin + '/' + lang + '/offline?from=' + encodeURIComponent(url.pathname + url.search), 302);
    throw err;
  }
}
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('khabo-') && ![PAGES, FILES, PICS, OFF, OFF + '-next'].includes(k)) await caches.delete(k);
  await self.clients.claim();
})()));

const pageKey = url => url.origin + url.pathname.replace(/\/$/, '');
const savedAt = res => Number(res && res.headers.get('x-khabo-saved')) || null;

/* keep a page with the time it was saved, so the menu can say how old it is */
async function keepPage(key, res) {
  const body = await res.blob();
  const h = new Headers(res.headers); h.set('x-khabo-saved', String(Date.now()));
  const cache = await caches.open(PAGES);
  await cache.put(key, new Response(body, { status: res.status, statusText: res.statusText, headers: h }));
  trim(PAGES);
}
async function trim(name) {
  const cache = await caches.open(name), keys = await cache.keys();
  for (let k = 0; k < keys.length - CAP[name]; k++) await cache.delete(keys[k]);
}
const isHtml = res => res && res.ok && res.type === 'basic' && (res.headers.get('content-type') || '').includes('text/html');
const timeout = ms => new Promise((_, no) => setTimeout(() => no(new Error('slow')), ms));

/* the saved copy of this menu page. With other = true (no signal at all) the other language will do too */
async function savedCopy(url, id, other) {
  const cache = await caches.open(PAGES);
  const want = await cache.match(pageKey(url));
  if (want || !other) return want || null;
  const list = (await Promise.all(['en', 'bn'].map(l => cache.match(url.origin + '/' + l + '/t/' + id)))).filter(Boolean);
  return list.sort((a, b) => savedAt(b) - savedAt(a))[0] || null;
}

async function tablePage(e, url, id) {
  if (e.resultingClientId) tableClients.add(e.resultingClientId);
  let bad = null;
  const net = fetch(e.request).then(async res => {
    if (res.status >= 500) { bad = res; throw new Error('server'); }
    if (isHtml(res)) await keepPage(pageKey(url), res.clone());
    return res;
  });
  e.waitUntil(net.then(() => {}, () => {}));
  try {
    const res = await Promise.race([net, timeout(WAIT)]);
    if (e.resultingClientId) served.set(e.resultingClientId, { from: 'net', at: Date.now() });
    return res;
  } catch {
    const use = copy => { if (e.resultingClientId) served.set(e.resultingClientId, { from: 'cache', at: savedAt(copy) }); return copy; };
    const copy = await savedCopy(url, id, false);
    if (copy) return use(copy);
    /* nothing saved in this language: wait for the network after all, and with no signal at all
       show the menu saved in the other language rather than nothing */
    return net.catch(async () => { const other = await savedCopy(url, id, true); return other ? use(other) : bad || offline(url); });
  }
}

/* a printed code: /t/<id>?table=4. Offline, open the saved menu in the language it was saved in */
async function shortLink(e, url, id) {
  try {
    return await Promise.race([fetch(e.request), timeout(WAIT)]);
  } catch {
    const copy = await savedCopy(url, id, true);
    if (!copy) return offline(url);
    const lang = /\/bn\/t\//.test(copy.url) ? 'bn' : 'en';
    return Response.redirect(url.origin + '/' + lang + '/t/' + id + url.search, 302);
  }
}

/* nothing saved and no signal: a small page in both languages */
function offline(url) {
  const html = `<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>khabo</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;background:#F5F6F3;color:#0E1712;text-align:center;padding:24px;box-sizing:border-box}@media (prefers-color-scheme:dark){body{background:#0B120F;color:#E9EFEA}}b{display:block;font-size:20px;margin:12px 0 6px}p{margin:0 0 4px;opacity:.75}button{margin-top:18px;height:46px;padding:0 20px;border:0;border-radius:12px;background:#0C5A3E;color:#F7F1DE;font:inherit;font-weight:700}</style></head>
<body><div><svg width="56" height="56" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#0C5A3E"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#F7F1DE" stroke-width="2.6"/><circle cx="19.2" cy="13" r="3.1" fill="#F4B91A"/></svg>
<b>No signal</b><p>This menu is not saved on this phone yet. Try again when you have signal.</p>
<b>নেটওয়ার্ক নেই</b><p>এই মেনু এখনো এই ফোনে রাখা হয়নি। নেটওয়ার্ক পেলে আবার চেষ্টা করুন।</p>
<button onclick="location.reload()">Try again · আবার চেষ্টা করুন</button></div></body></html>`;
  return new Response(html, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

/* files: stale-while-revalidate. Photos from other sites are fetched openly (cors) so they can be kept small */
async function getFile(req, url) {
  if (url.origin !== self.location.origin) {
    try { const r = await fetch(url.href, { mode: 'cors', credentials: 'omit' }); if (r.ok) return r; } catch { /* fall back below */ }
    return fetch(req);
  }
  return fetch(req);
}
const keepable = res => res && res.ok && (res.type === 'basic' || res.type === 'cors') && !(res.headers.get('cache-control') || '').includes('no-store');
async function swr(e, req, url, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(url.href, { ignoreVary: true });
  const immutable = !DEV && url.pathname.startsWith('/_next/static/');
  const fresh = () => getFile(req, url).then(async res => {
    if (keepable(res)) { await cache.put(url.href, res.clone()); trim(name); }
    return res;
  });
  if (hit) { if (!immutable) e.waitUntil(fresh().catch(() => {})); return hit; }
  return fresh();
}
async function netFirst(req, url, name) {
  const cache = await caches.open(name);
  try {
    const res = await getFile(req, url);
    if (keepable(res)) { await cache.put(url.href, res.clone()); trim(name); }
    return res;
  } catch (err) {
    const hit = await cache.match(url.href, { ignoreVary: true });
    if (hit) return hit;
    throw err;
  }
}
function fileBucket(url) {
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) return FILES;
    if (url.pathname.startsWith('/media/') && /\.(jpe?g|png|webp|avif|svg|gif)$/i.test(url.pathname)) return PICS;
    if (url.pathname === '/icon.svg' || /^\/icon-\d+\.png$/.test(url.pathname)) return FILES;
    return null;
  }
  if (PHOTO_HOSTS.test(url.hostname)) return PICS;
  if (FONT_HOSTS.test(url.hostname)) return FILES;
  return null;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    if (url.origin !== self.location.origin) return;
    const t = TABLE.exec(url.pathname);
    if (t) return e.respondWith(tablePage(e, url, t[2]));
    const s = SHORT.exec(url.pathname);
    if (s) return e.respondWith(shortLink(e, url, s[1]));
    if (url.pathname.startsWith('/api/')) return;
    return e.respondWith(sitePage(e, url));
  }
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;
  if (url.searchParams.has('_rsc') || req.headers.get('rsc')) return;
  /* site files go to the network; only when it cannot be reached, the saved copy for the "No internet" page is used */
  if (url.origin === self.location.origin && !tableClients.has(e.clientId) && /^\/(_next\/static|icons)\//.test(url.pathname)) {
    return e.respondWith(fetch(req).catch(async err => {
      const hit = await (await caches.open(OFF)).match(url.pathname + url.search);
      if (hit) return hit;
      throw err;
    }));
  }
  /* only for the table menu: the diner site and the panels go straight to the network */
  if (!tableClients.has(e.clientId)) return;
  const name = fileBucket(url);
  if (!name) return;
  e.respondWith(DEV && name === FILES && url.pathname.startsWith('/_next/') ? netFirst(req, url, name) : swr(e, req, url, name));
});

/* the table menu asks: is the page on screen a saved copy? And: please keep this page and these files */
self.addEventListener('message', e => {
  const m = e.data || {}, port = e.ports && e.ports[0], from = e.source && e.source.id;
  const reply = v => { if (port) port.postMessage(v); };
  if (from && typeof m.page === 'string' && TABLE.test(m.page)) tableClients.add(from);
  if (m.type === 'info') { if (from) tableClients.add(from); reply(served.get(from) || null); return; }
  if (m.type === 'save' && typeof m.page === 'string' && TABLE.test(m.page)) e.waitUntil(save(m, reply));
  /* the site asks now and then: refresh the saved "No internet" page (at most twice a day) so it matches the live site */
  if (m.type === 'offline') e.waitUntil((async () => {
    const hit = await (await caches.open(OFF)).match('/en/offline');
    const at = Number(hit && hit.headers.get('date') ? Date.parse(hit.headers.get('date')) : 0);
    if (hit && Date.now() - at < 12 * 3600e3) return;
    /* build the new copy on the side and swap it in only when it is complete (a bad line keeps the old one) */
    const TMP = OFF + '-next';
    await caches.delete(TMP);
    await keepOffline(TMP);
    const tmp = await caches.open(TMP);
    if (!(await tmp.match('/en/offline')) || !(await tmp.match('/bn/offline'))) { await caches.delete(TMP); return; }
    await caches.delete(OFF);
    const off = await caches.open(OFF);
    for (const k of await tmp.keys()) { const r = await tmp.match(k); if (r) await off.put(k, r); }
    await caches.delete(TMP);
  })().catch(() => {}));
});

async function save(m, reply) {
  const origin = self.location.origin, key = origin + m.page.replace(/\/$/, '');
  let at = null;
  try {
    const pages = await caches.open(PAGES), had = await pages.match(key);
    /* the page itself: skip it when it was saved a moment ago (the visit already saved it) */
    if (!had || Date.now() - savedAt(had) > 60e3) {
      if (!m.quiet || !had) {
        const res = await fetch(key, { credentials: 'same-origin' });
        if (isHtml(res)) await keepPage(key, res);
      }
    }
    at = savedAt(await pages.match(key));
    for (const f of (Array.isArray(m.files) ? m.files : []).slice(0, 200)) {
      let url; try { url = new URL(f); } catch { continue; }
      const name = fileBucket(url); if (!name) continue;
      const cache = await caches.open(name);
      if (await cache.match(url.href, { ignoreVary: true })) continue;
      try { const res = await getFile(new Request(url.href), url); if (keepable(res)) await cache.put(url.href, res); } catch { /* try again next time */ }
    }
    await Promise.all([trim(FILES), trim(PICS)]);
  } catch { /* storage full or private window: the menu still works online */ }
  reply({ at });
}
