/* Makes smaller copies of the 360 still photos (public/media/360/<name>.jpg, not the -4k ones) so cards on phones
   download card-sized photos: <name>-480.jpg, <name>-960.jpg, and a tiny <name>-24.jpg used as a blurred preview.
   Run again after adding photos: node scripts/media-sizes.mjs */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
const dir = path.resolve('public/media/360');
const files = fs.readdirSync(dir).filter(f => /\.jpg$/.test(f) && !/-4k\.jpg$/.test(f) && !/-(24|480|960)\.jpg$/.test(f));
for (const f of files) {
  const base = f.replace(/\.jpg$/, '');
  for (const [w, q] of [[480, 72], [960, 74], [24, 50]]) {
    const out = path.join(dir, `${base}-${w}.jpg`);
    if (fs.existsSync(out)) continue;
    await sharp(path.join(dir, f)).resize({ width: w }).jpeg({ quality: q, progressive: true, mozjpeg: true }).toFile(out);
  }
}
console.log('done', files.length);
