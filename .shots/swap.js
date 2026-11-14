// replace the CSS block between two markers in a file with the contents of another file
const fs = require('fs');
const [file, from, to, src] = process.argv.slice(2);
let s = fs.readFileSync(file, 'utf8');
const a = s.indexOf(from), b = s.indexOf(to, a);
if (a < 0 || b < 0) { console.error('marker missing'); process.exit(1); }
const end = s.indexOf('\n', b) + 1;
s = s.slice(0, a) + fs.readFileSync(src, 'utf8') + s.slice(end);
fs.writeFileSync(file, s);
console.log('swapped', end - a, 'chars');
