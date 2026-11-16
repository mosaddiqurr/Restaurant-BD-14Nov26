import fs from 'node:fs';
const core = 'node_modules/@phosphor-icons/core/assets/regular';
const all = new Set(fs.readdirSync(core).map(f => f.replace(/\.svg$/, '')));
const files = ['../website/app/app.js', '../website/panel/rest.js', '../website/panel/admin.js', '../website/panel/app.js', '../website/panel/site.js', '../website/panel/print.js', '../website/panel/menuphoto.js', '../website/panel/events.js', '../website/data/common.js', '../website/code/pages/table.js', '../website/code/core.js', ...fs.readdirSync('data/catalog/restaurants').map(f => 'data/catalog/restaurants/' + f), 'data/catalog/common.json'];
const used = new Set();
for (const f of files) { const s = fs.readFileSync(f, 'utf8'); for (const m of s.matchAll(/['"`=]([a-z][a-z0-9-]+)['"`]/g)) if (all.has(m[1])) used.add(m[1]); for (const m of s.matchAll(/ph-([a-z][a-z0-9-]+)/g)) if (all.has(m[1])) used.add(m[1]); }
const extra = ['magnifying-glass','x','list','sun','moon','translate','caret-down','caret-up','caret-left','caret-right','check','arrow-right','arrow-left','arrow-up','arrow-down','plus','minus','star','heart','share-network','map-pin','phone','receipt','fork-knife','storefront','user','sparkle','house','tag','calendar-blank','chart-line-up','sliders-horizontal','funnel','wifi-slash','cloud-arrow-down','spinner-gap'];
extra.forEach(n => all.has(n) && used.add(n));
fs.writeFileSync('scripts/icons-used.json', JSON.stringify([...used].sort()));
console.log(used.size);
