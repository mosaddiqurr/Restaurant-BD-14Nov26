/* Lake View Café (Dhanmondi Lake, Road 8)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'lake-view', name: e('Lake View Café', 'লেক ভিউ ক্যাফে'), mono: 'LV', since: 2017,
  area: 'dhanmondi', city: 'dhaka', geo: [23.7468, 90.3792], spot: e('Dhanmondi Lake, Road 8', 'ধানমন্ডি লেক, রোড ৮'), address: e('Lakeside, Road 8, Dhanmondi, Dhaka 1205', 'লেকের পাড়, রোড ৮, ধানমন্ডি, ঢাকা ১২০৫'),
  phone: '+8801700000711', cuisines: ['street', 'cafe'],
  theme: { deep: '#0A2A3E', accent: '#8FD0F2', font: 'sans' },
  tagline: e('Doi fuchka by the lake, best just before sunset.', 'লেকের পাড়ে দই ফুচকা, সূর্যাস্তের ঠিক আগে সবচেয়ে ভালো।'),
  story: e('Open-air tables under the trees, with a covered section for the rain.', 'গাছের নিচে খোলা টেবিল, বৃষ্টির জন্য ছাউনি দেওয়া অংশও আছে।'),
  rating: 4.1, reviews: 154, verified: 77, ppl: [200, 450], hours: ['09:00', '22:30'],
  vat: 5, service: 0, seats: 50, fac: ['wifi', 'rooftop'], pay: ['Cash', 'bKash'], plan: 'starter', checked: 6,
  hero: ['ex2', 'i3', 'fu'],
  gallery: { inside: ['i3'], outside: ['ex2'], kitchen: [], food: ['fu'] },
  signature: ['doi-fuchka', 'lv-chotpoti', 'lv-coffee'],
  cats: [{ id: 'street', ...e('Fuchka & chaat', 'ফুচকা ও চাট') }, { id: 'drink', ...e('Drinks', 'পানীয়') }],
  menu: [
    D('doi-fuchka', 'fuchka', 'Doi Fuchka', 'দই ফুচকা', 160, 'fu', ['8 pieces', '৮ পিস'], 1, { cat: 'street', best: true, veg: true, desc: e('Crisp puri filled with spiced potato, tamarind and sweet doi.', 'মচমচে পুরিতে মশলা আলু, তেঁতুল আর মিষ্টি দই।') }),
    D('lv-fuchka', 'fuchka', 'Fuchka', 'ফুচকা', 120, null, ['8 pieces', '৮ পিস'], 2, { cat: 'street', veg: true }),
    D('lv-chotpoti', 'fuchka', 'Chotpoti', 'চটপটি', 130, null, ['1 plate', '১ প্লেট'], 2, { cat: 'street' }),
    D('lv-lemonade', 'drink', 'Mint Lemonade', 'মিন্ট লেমনেড', 110, null, ['1 glass', '১ গ্লাস'], 0, { cat: 'drink', veg: true }),
    D('lv-coffee', 'tea', 'Café Latte', 'ক্যাফে লাতে', 190, null, ['1 cup', '১ কাপ'], 0, { cat: 'drink', veg: true })
  ],
  reviewList: [
    R('lake-view', 'Rakib Hasan', 4, true, ago('6 days ago', '৬ দিন আগে'), 'Doi fuchka at sunset by the lake is the whole point. Gets crowded after 6.', ['Doi Fuchka'])
  ]
}));
