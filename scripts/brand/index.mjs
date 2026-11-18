// preview page for the Khaoya brand folder
import fs from 'fs';
const root = process.argv[2];
const files = JSON.parse(fs.readFileSync(`${root}/.files.json`));
const groups = [
  ['Khaoya main logos', 'khaoya/svg/khaoya-main'], ['Khaoya wordmarks', 'khaoya/svg/khaoya-wordmark'],
  ['Khaoya one line', 'khaoya/svg/khaoya-one-line'], ['Khaoya icon', 'khaoya/svg/khaoya-icon'],
  ['Mama AI', 'mama/svg/'], ['Business, Menu, Deals', 'business/svg/'], ['App icons', 'app-icon/svg/'],
];
const bg = f => /reverse|white/.test(f) ? '#0C5A3E' : /black/.test(f) ? '#FFFFFF' : '#F7F1DE';
const card = f => `<a class="c" href="${f}" download><span class="t" style="background:${bg(f)}"><img src="${f}" alt=""></span><span class="n">${f.split('/').pop()}</span></a>`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Khaoya brand</title><link rel="icon" href="logo/app-icon/khaoya-favicon.ico"><link rel="stylesheet" href="colors/colors.css">
<style>body{margin:0;font-family:system-ui,sans-serif;background:#fff;color:#1A1300}main{max-width:1180px;margin:0 auto;padding:24px 16px 60px}
h1{color:var(--khaoya-green);margin:8px 0 4px}h2{color:var(--khaoya-green);margin:36px 0 12px;font-size:20px}p{color:#555;margin:0 0 8px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}.c{display:block;border:1px solid #e6e1d2;border-radius:12px;overflow:hidden;text-decoration:none;color:inherit}
.t{display:flex;align-items:center;justify-content:center;height:150px;padding:14px;box-sizing:border-box}.t img{max-width:100%;max-height:100%}
.n{display:block;padding:8px 10px;font-size:12px;color:#555;word-break:break-all}.pal{max-width:100%;border-radius:12px;border:1px solid #e6e1d2}</style></head>
<body><main><h1>Khaoya brand</h1><p>Click any logo to download the SVG. PNGs are in each folder's png and png-background folders. The colour behind each logo here is only for viewing.</p>
${groups.map(([t, p]) => `<h2>${t}</h2><div class="g">${files.filter(f => f.includes(p)).map(f => card(f)).join('')}</div>`).join('')}
<h2>Colours</h2><img class="pal" src="colors/palette.svg" alt="Khaoya colour palette"></main></body></html>`;
fs.writeFileSync(`${root}/index.html`, html);
