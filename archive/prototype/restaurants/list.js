/* The restaurants on the site, one folder each.

   To add a restaurant:
   1. Copy any restaurant folder (for example shahi-handi) and rename it, e.g. my-new-place
   2. Open my-new-place/restaurant.js and change the details, menu and reviews
   3. Put its 360 room photos in my-new-place/360/ (optional)
   4. Add 'my-new-place' to the list below

   The order here is the default order on the site. */
const RESTAURANTS = [
  'shahi-handi',
  'nodir-paar',
  'kabab-ghor',
  'kathgolap',
  'cha-adda',
  'mirpur-bawarchi',
  'lake-view',
  'garden-rooftop',
  'mahasthan-bhoj',
  'shamiana',
  'nawabpur-kacchi',
  'satmatha-fuchka',
];

/* loads each restaurant.js before the rest of the site starts */
window.KHABO_RESTAURANTS = [];
function addRestaurant(make) { window.KHABO_RESTAURANTS.push(make); }
(function () {
  const here = document.currentScript.src.replace(/list\.js(\?.*)?$/, '');
  RESTAURANTS.forEach(id => document.write(`<script src="${here}${id}/restaurant.js"><\/script>`));
})();
