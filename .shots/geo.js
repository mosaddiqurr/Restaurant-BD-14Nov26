// Adds geo: [lat, lng] to each restaurant in data.js, right after its city field.
const fs = require('fs');
const file = process.argv[2];
const G = {
  'shahi-handi': [23.7547, 90.3741],     // House 32, Road 27 (old), Dhanmondi
  'nodir-paar': [23.7983, 90.4150],      // Road 90, Gulshan 2
  'kabab-ghor': [23.7631, 90.3627],      // Tajmahal Road, Mohammadpur
  'kathgolap': [23.7940, 90.4045],       // Road 11, Banani
  'cha-adda': [23.7487, 90.3718],        // Road 9/A, Dhanmondi
  'mirpur-bawarchi': [23.8069, 90.3687], // Section 10, Mirpur
  'lake-view': [23.7468, 90.3792],       // Lakeside, Road 8, Dhanmondi
  'garden-rooftop': [23.8715, 90.3965],  // Sonargaon Janapath, Sector 7, Uttara
  'mahasthan-bhoj': [24.8440, 89.3705],  // Jaleshwaritola, Bogura
  'shamiana': [23.7907, 90.4058],        // Road 17, Banani
  'nawabpur-kacchi': [23.7175, 90.4130], // Nawabpur Road, Old Dhaka
  'satmatha-fuchka': [24.8478, 89.3727]  // Satmatha clock tower, Bogura
};
let s = fs.readFileSync(file, 'utf8'), n = 0;
for (const [id, [la, lo]] of Object.entries(G)) {
  const i = s.indexOf(`id: '${id}', name:`); if (i < 0) { console.log('missing', id); continue; }
  const m = /city: '[a-z]+',/.exec(s.slice(i)); if (!m) { console.log('no city', id); continue; }
  const at = i + m.index + m[0].length;
  if (s.slice(at, at + 8).includes('geo')) continue;
  s = s.slice(0, at) + ` geo: [${la}, ${lo}],` + s.slice(at); n++;
}
fs.writeFileSync(file, s);
console.log('added', n);
