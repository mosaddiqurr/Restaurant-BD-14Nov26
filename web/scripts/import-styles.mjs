/* Brings the prototype stylesheet (../website/app/app.css) into the app as styles/khabo.css.
   The prototype ran inside a preview frame, so:
   - container queries on the frame become normal media queries
   - "phone view" rules of the preview become max-width: 720px media queries
   - the preview rail and frame rules are dropped
   Run once: node scripts/import-styles.mjs (the result is then edited by hand, so do not re-run blindly). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let css = fs.readFileSync(path.resolve(here, '../../website/app/app.css'), 'utf8');

const drop = [
  /^\.app \{[^\n]*\n/m, /^\.stage \{[^\n]*\n/m, /^\.frame \{[^\n]*\n/m, /^\.scroller \{[^\n]*\n/m,
  /^\.app\[data-view="phone"\] \.(stage|frame|scroller) \{[^\n]*\n/gm,
  /^\.rail(?![-\w])[^\n]*\n/gm, /^\.rail-(h|ctl|note)[^\n]*\n/gm,
  /^\.app\.site[^\n]*\n/gm, /^@media \(max-width: 760px\) \{ \.app \{[^\n]*\n/m,
  /^\.boot \{[^\n]*\n/m
];
for (const re of drop) css = css.replace(re, '');

css = css.replace(/@container s \(/g, '@media (');
css = css.replace(/^\.app\[data-view="phone"\] ([^{]+)\{([^\n]*)\}\s*$/gm, (m, sel, body) => `@media (max-width: 720px) { ${sel.trim()} {${body}} }`);
css = css.replace(/\.screen \{ container-type: inline-size; container-name: s; min-height: 100%; \}/, '.screen { min-height: 100dvh; }');
css = css.replace(/body \{ font: 400 15\.5px\/1\.5 var\(--sans\); color: var\(--ink\); background: #DCE1DB;/, 'body { font: 400 15.5px/1.5 var(--sans); color: var(--ink); background: var(--bg);');
css = css.replace(/:root\[data-theme="dark"\] body \{ background: #050806; \}\n/, '');
css = css.replace(/--sans: Figtree, "Noto Sans Bengali", system-ui, sans-serif; --serif: "Tiro Bangla", Georgia, serif;/,
  '--sans: var(--font-figtree), var(--font-bangla), system-ui, sans-serif; --serif: var(--font-tiro), Georgia, serif;');
css = css.replace(/font-family: Figtree, "Noto Sans Bengali", sans-serif/g, 'font-family: var(--sans)');

const left = (css.match(/\.app\b|@container|data-view/g) || []);
fs.writeFileSync(path.resolve(here, '../styles/khabo.css'), '/* khabo styles, brought over from the prototype (website/app/app.css) and tuned for the real site. */\n' + css);
console.log('written styles/khabo.css', css.length, 'bytes; leftovers:', left.length);
