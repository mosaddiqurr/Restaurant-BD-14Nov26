/* Imports the prototype data from archive/prototype into typed JSON for the Next.js app.
   Run: node scripts/import-prototype.mjs
   It reads the prototype's restaurant.js files with their shared helpers, then writes:
   data/catalog/common.json, data/catalog/restaurants/<id>.json, data/catalog/prices.json,
   messages/en.json + bn.json, and the 360 rooms, logos and 3D models into public/media. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(here, '..');
const SITE = path.resolve(WEB, 'archive/prototype');
const read = p => fs.readFileSync(path.join(SITE, p), 'utf8');
const out = (p, data) => { const f = path.join(WEB, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 1)); };

/* a pretend browser: just enough for the prototype's data files */
const store = {};
const win = { KHABO_RESTAURANTS: [], localStorage: { getItem: k => store[k] ?? null, setItem() {} } };
win.window = win;
win.addRestaurant = make => win.KHABO_RESTAURANTS.push(make);
win.document = { currentScript: { src: 'http://x/data/common.js' }, write() {} };
const ctx = vm.createContext(win);
const run = (code, name) => vm.runInContext(code, ctx, { filename: name });

run(read('code/i18n.js'), 'i18n.js');
const ids = [...read('restaurants/list.js').matchAll(/^\s+'([\w-]+)',$/gm)].map(m => m[1]);
ids.forEach(id => run(read(`restaurants/${id}/restaurant.js`), id));
run(read('data/common.js'), 'common.js');
run(read('data/prices.js'), 'prices.js');
run(read('media/dish-3d-models.js'), 'models.js');

const K = win.K, D = K.data;

/* the extra words app.js adds (const X = {...}) */
const app = read('app/app.js');
const xs = app.indexOf('const X = {'), xe = app.indexOf('\n};\n', xs);
const X = vm.runInNewContext('const e = (en, bn) => ({ en, bn });' + app.slice(xs, xe + 3) + ' X');

/* ---------- messages ---------- */
for (const lang of ['en', 'bn']) {
  const msg = { ...K.T[lang] };
  for (const [k, v] of Object.entries(X)) {
    if (k in K.T.en) { msg['x_' + k] = v[lang] ?? v.en; } else msg[k] = v[lang] ?? v.en;
  }
  out(`messages/${lang}.json`, msg);
}
const clash = Object.keys(X).filter(k => k in K.T.en);
if (clash.length) console.log('words also in i18n (saved as x_<key>):', clash.join(', '));

/* ---------- common lists ---------- */
const socials = Object.fromEntries(Object.entries(D.socials).map(([k, v]) => [k, { en: v.en, base: v.base, icon: v.i, host: v.host.source }]));
out('data/catalog/common.json', {
  photos: D.P, films: D.FILM, palettes: D.palettes, socials, cities: D.cities, areas: D.areas, soon: D.soon,
  cuisines: D.cuisines, types: D.types, cravings: D.cravings, facilities: D.facilities, occasions: D.occasions,
  budgets: D.budgets, updated: D.updated, dealTags: K.DEAL_TAGS,
  tableMenu: { layouts: K.TM_LAYOUTS, headers: K.TM_HEADERS, themes: K.TM_THEMES },
  order: ids
});

/* ---------- restaurants (each with its reviews) ---------- */
const panoHome = {};
for (const r of D.restaurants) {
  (r.tour || []).forEach(t => { panoHome[t.pano] = r.id; if (t.day) panoHome[t.day] = r.id; });
  JSON.stringify(r.gallery || {}).replace(/pv:([\w-]+):/g, (m, p) => { panoHome[p] = panoHome[p] || r.id; });
}
for (const r of D.restaurants) {
  const rv = D.reviews.filter(v => v.r === r.id);
  out(`data/catalog/restaurants/${r.id}.json`, { ...r, reviewList: rv });
}
out('data/catalog/prices.json', K.priceLog);
out('data/catalog/pano-home.json', panoHome);

/* ---------- media ---------- */
let rooms = 0;
for (const id of ids) {
  const dir = path.join(SITE, 'restaurants', id);
  if (fs.existsSync(path.join(dir, 'logo.svg'))) out(`public/media/r/${id}/logo.svg`, fs.readFileSync(path.join(dir, 'logo.svg')));
  const pd = path.join(dir, '360');
  if (!fs.existsSync(pd)) continue;
  for (const f of fs.readdirSync(pd)) {
    const file = path.join(pd, f);
    if (f.endsWith('.jpg')) out(`public/media/360/${f}`, fs.readFileSync(file));
    else if (f.endsWith('-4k.js')) {
      const m = fs.readFileSync(file, 'utf8').match(/base64,([^'"]+)/);
      if (m) { out(`public/media/360/${f.replace(/\.js$/, '.jpg')}`, Buffer.from(m[1], 'base64')); rooms++; }
    }
  }
}
for (const [id, g] of Object.entries(K.models || {})) out(`public/media/models/${id}.gltf`, JSON.stringify(g));
console.log(`restaurants: ${D.restaurants.length}, reviews: ${D.reviews.length}, 4k rooms: ${rooms}, models: ${Object.keys(K.models || {}).length}`);
