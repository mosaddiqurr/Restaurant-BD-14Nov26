/* Cha Adda (Road 9/A, Dhanmondi)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'cha-adda', name: e('Cha Adda', 'চা আড্ডা'), mono: 'CA', since: 2019,
  area: 'dhanmondi', city: 'dhaka', geo: [23.7487, 90.3718], spot: e('Road 9/A, Dhanmondi', 'রোড ৯/এ, ধানমন্ডি'), address: e('61 Road 9/A, Dhanmondi, Dhaka 1209', '৬১ রোড ৯/এ, ধানমন্ডি, ঢাকা ১২০৯'),
  phone: '+8801700000519', cuisines: ['cafe', 'street'],
  theme: { deep: '#13281C', accent: '#E9A23B', font: 'sans' },
  tagline: e('Slow tea, warm bakes and the best seat for an afternoon adda.', 'ধীরে চা, গরম বেকারি আর বিকেলের আড্ডার সেরা জায়গা।'),
  story: e('Every cake on our menu is scanned in 3D, so you can turn it around, check the size and even see it on your own table.', 'আমাদের প্রতিটা কেক থ্রিডিতে স্ক্যান করা। ঘুরিয়ে দেখুন, মাপ বুঝুন, এমনকি নিজের টেবিলেও বসিয়ে দেখুন।'),
  rating: 4.5, reviews: 302, verified: 188, ppl: [180, 420], hours: ['08:00', '23:00'],
  vat: 5, service: 0, seats: 40, fac: ['wifi', 'ac'], pay: ['Cash', 'bKash', 'Card'], plan: 'premium', checked: 1, mediaDate: e('Nov 2026', 'নভেম্বর ২০২৬'),
  hero: [pv('comfy_cafe', 'a'), 'iD', 'ro'],
  film: { src: FILM.cafe, poster: 'iD', len: '0:15' },
  gallery: { inside: [pv('comfy_cafe', 'a'), 'iD', pv('comfy_cafe', 'b'), 'ro'], outside: [], kitchen: [], food: ['ph:strawberry_chocolate_cake', 'ph:carrot_cake', 'ph:croissant', 'ph:tea_set_01', 'sm'] },
  tour: [{ id: 'cafe', ...e('Café floor', 'ক্যাফে'), pano: 'comfy_cafe', yaw: 40, spots: [{ info: e('Sofa corner, good for four', 'সোফা কর্নার, চারজনের জন্য ভালো'), yaw: 275, pitch: -12 }] }],
  signature: ['strawberry-cake', 'masala-chai', 'croissant'],
  cats: [{ id: 'bake', ...e('Cakes & bakes', 'কেক ও বেকারি') }, { id: 'tea', ...e('Tea & coffee', 'চা ও কফি') }, { id: 'snack', ...e('Snacks', 'নাস্তা') }],
  menu: [
    D('strawberry-cake', 'bakery', 'Strawberry Chocolate Cake', 'স্ট্রবেরি চকলেট কেক', 1890, 'ph:strawberry_chocolate_cake', ['Whole cake · serves 8', 'পুরো কেক · ৮ জন'], 0, { cat: 'bake', best: true, d3: 'strawberry_chocolate_cake', veg: true, desc: e('Dark chocolate sponge, ganache and fresh strawberries. Order by noon for the same evening.', 'ডার্ক চকলেট স্পঞ্জ, গানাশ আর তাজা স্ট্রবেরি। দুপুরের মধ্যে অর্ডার দিলে সন্ধ্যায় পাবেন।') }),
    D('carrot-cake', 'bakery', 'Carrot Cake', 'ক্যারট কেক', 1490, 'ph:carrot_cake', ['Whole cake · serves 8', 'পুরো কেক · ৮ জন'], 0, { cat: 'bake', d3: 'carrot_cake', veg: true, desc: e('Spiced carrot sponge with cream cheese frosting and walnuts.', 'মশলাদার গাজরের স্পঞ্জ, ক্রিম চিজ আর আখরোট।') }),
    D('croissant', 'bakery', 'Butter Croissant', 'বাটার ক্রোয়াসাঁ', 160, 'ph:croissant', ['1 piece', '১ পিস'], 0, { cat: 'bake', d3: 'croissant', veg: true, desc: e('Laminated by hand every morning at six.', 'প্রতিদিন সকাল ছয়টায় হাতে বানানো।') }),
    D('masala-chai', 'tea', 'Masala Chai, pot for two', 'মসলা চা (দুজনের পট)', 220, 'ph:tea_set_01', ['Pot · 2 cups', 'পট · ২ কাপ'], 0, { cat: 'tea', best: true, d3: 'tea_set_01', veg: true, desc: e('Assam leaf, ginger, cardamom and clove, served in a porcelain set.', 'আসামের পাতা, আদা, এলাচ আর লবঙ্গ, পোর্সেলিনের সেটে।') }),
    D('doodh-cha', 'tea', 'Doodh Cha', 'দুধ চা', 40, null, ['1 cup', '১ কাপ'], 0, { cat: 'tea', veg: true }),
    D('cold-coffee', 'tea', 'Cold Coffee', 'কোল্ড কফি', 220, null, ['1 glass', '১ গ্লাস'], 0, { cat: 'tea', veg: true }),
    D('shingara', 'snack', 'Shingara', 'শিঙাড়া', 60, 'sm', ['2 pieces', '২ পিস'], 1, { cat: 'snack', veg: true })
  ],
  deal: { id: 'tea-time', ...e('Cake slice and two chai', 'এক টুকরো কেক আর দুই কাপ চা'), desc: e('Any slice with two doodh cha.', 'যেকোনো এক টুকরো কেক, দুই কাপ দুধ চা।'), when: e('Weekdays, 3pm to 6pm', 'কর্মদিবসে বিকেল ৩টা থেকে ৬টা'), price: 260, was: 330, p: 'ph:carrot_cake' },
  reviewList: [
    R('cha-adda', 'Nabila Huq', 5, true, ago('3 days ago', '৩ দিন আগে'), 'Saw the strawberry cake in 3D on my table at home, ordered it for my sister’s birthday. It looked exactly the same.', ['Strawberry Chocolate Cake']),
    R('cha-adda', 'Sabbir Rahman', 5, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'বিকেলের আড্ডার জন্য সেরা। মসলা চা এক পটে দুই কাপের বেশি হয়।', ['Masala Chai, pot for two', 'Shingara']),
    R('cha-adda', 'Ayesha Siddiqua', 4, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'Croissant was flaky and fresh at 9am. Wi-Fi is fast enough to work from.', ['Butter Croissant'])
  ]
}));
