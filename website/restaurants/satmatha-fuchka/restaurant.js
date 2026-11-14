/* Satmatha Fuchka Corner (Satmatha, Bogura)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'satmatha-fuchka', name: e('Satmatha Fuchka Corner', 'সাতমাথা ফুচকা কর্নার'), mono: 'SF', since: 2014,
  area: 'satmatha', city: 'bogura', geo: [24.8478, 89.3727], spot: e('Satmatha, Bogura', 'সাতমাথা, বগুড়া'), address: e('Beside the clock tower, Satmatha, Bogura 5800', 'ঘড়ির টাওয়ারের পাশে, সাতমাথা, বগুড়া ৫৮০০'),
  phone: '+8801700001242', cuisines: ['street'],
  theme: { deep: '#2D0F2A', accent: '#FF9BB8', font: 'sans' },
  tagline: e('Bogura’s evening fuchka stop, with chotpoti on the side.', 'বগুড়ার সন্ধ্যার ফুচকার ঠিকানা, পাশে চটপটি।'),
  story: e('Twenty-four stools, one counter and the tamarind water everyone talks about.', 'চব্বিশটা টুল, একটা কাউন্টার আর সবার মুখে মুখে তেঁতুল পানি।'),
  rating: 4.3, reviews: 64, verified: 41, ppl: [100, 220], hours: ['15:00', '22:00'],
  vat: 0, service: 0, seats: 24, fac: [], pay: ['Cash', 'bKash'], plan: 'starter', checked: 5,
  hero: ['tb'],
  gallery: { inside: [], outside: [], kitchen: [], food: ['tb'] },
  signature: ['sf-chotpoti', 'sf-fuchka', 'sf-jhalmuri'],
  cats: [{ id: 'street', ...e('Street food', 'স্ট্রিট ফুড') }],
  menu: [
    D('sf-chotpoti', 'fuchka', 'Chotpoti', 'চটপটি', 70, 'tb', ['1 plate', '১ প্লেট'], 2, { cat: 'street', best: true }),
    D('sf-fuchka', 'fuchka', 'Fuchka', 'ফুচকা', 80, null, ['10 pieces', '১০ পিস'], 2, { cat: 'street', veg: true }),
    D('sf-doi', 'fuchka', 'Doi Fuchka', 'দই ফুচকা', 120, null, ['8 pieces', '৮ পিস'], 1, { cat: 'street', veg: true }),
    D('sf-jhalmuri', 'snack', 'Jhalmuri', 'ঝালমুড়ি', 40, null, ['1 cone', '১ ঠোঙা'], 2, { cat: 'street', veg: true })
  ],
  reviewList: [
    R('satmatha-fuchka', 'Rashed Karim', 4, true, ago('5 days ago', '৫ দিন আগে'), 'Tetul pani ta ashadharon. 80 takay 10 ta fuchka, Bogura te best.', ['Fuchka'])
  ]
}));
