// PNG exports: transparent, with background, app icon sizes, favicons, and the common folder
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const sharp = createRequire(process.cwd() + '/package.json')('sharp');
const root = process.argv[2];
const P = f => path.join(root, f);
const files = JSON.parse(fs.readFileSync(P('.files.json')));
const BG = { color: '#F7F1DE', reverse: '#0C5A3E', white: '#0C5A3E', black: '#FFFFFF' };
const mk = d => fs.mkdirSync(P(d), { recursive: true });

for (const f of files.filter(f => !f.includes('/app-icon/'))) {
  const fam = f.split('/')[1], base = path.basename(f, '.svg'), v = base.split('-').pop();
  const isIcon = /-icon-/.test(base);
  mk(`logo/${fam}/png`); mk(`logo/${fam}/png-background`);
  const img = sharp(P(f), { density: 900 }).resize(isIcon ? { width: 1024, height: 1024, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } } : { width: 2000 });
  const buf = await img.png().toBuffer();
  fs.writeFileSync(P(`logo/${fam}/png/${base}.png`), buf);
  const m = await sharp(buf).metadata(); const pad = Math.round(m.width * 0.12);
  await sharp(buf).extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG[v] }).flatten({ background: BG[v] })
    .png().toFile(P(`logo/${fam}/png-background/${base}.png`));
}

mk('logo/app-icon/png');
const ico = async (svg, out) => {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map(s => sharp(svg, { density: 300 }).resize(s, s).png().toBuffer()));
  const head = Buffer.alloc(6 + 16 * sizes.length); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let off = head.length;
  sizes.forEach((s, i) => { const e = 6 + 16 * i; head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(pngs[i].length, e + 8); head.writeUInt32LE(off, e + 12); off += pngs[i].length; });
  fs.writeFileSync(out, Buffer.concat([head, ...pngs]));
};
for (const name of ['khaoya-app-icon', 'mama-app-icon']) {
  const svg = P(`logo/app-icon/svg/${name}.svg`);
  for (const s of [16, 32, 48, 180, 192, 512, 1024]) await sharp(svg, { density: 72 * s / 512 * 4 }).resize(s, s).png().toFile(P(`logo/app-icon/png/${name}-${s}.png`));
  await ico(svg, P(`logo/app-icon/${name.replace('-app-icon', '')}-favicon.ico`));
}
for (const s of [192, 512]) await sharp(P('logo/app-icon/svg/khaoya-app-icon-maskable.svg'), { density: 72 * s / 512 * 4 }).resize(s, s).png().toFile(P(`logo/app-icon/png/khaoya-app-icon-maskable-${s}.png`));

// the common folder: the few files used every day
mk('logo/common');
const common = [
  'logo/khaoya/svg/khaoya-main-en-color.svg', 'logo/khaoya/svg/khaoya-main-en-reverse.svg',
  'logo/khaoya/svg/khaoya-main-both-color.svg', 'logo/khaoya/svg/khaoya-main-both-reverse.svg',
  'logo/khaoya/svg/khaoya-main-bn-color.svg', 'logo/khaoya/svg/khaoya-icon-color.svg',
  'logo/khaoya/png/khaoya-main-en-color.png', 'logo/khaoya/png/khaoya-main-both-color.png', 'logo/khaoya/png-background/khaoya-main-en-reverse.png',
  'logo/mama/svg/mama-main-en-color.svg', 'logo/mama/svg/mama-icon-color.svg',
  'logo/app-icon/svg/khaoya-app-icon.svg', 'logo/app-icon/png/khaoya-app-icon-512.png', 'logo/app-icon/khaoya-favicon.ico',
];
for (const f of common) fs.copyFileSync(P(f), P(`logo/common/${path.basename(f)}`));
console.log('png done');
