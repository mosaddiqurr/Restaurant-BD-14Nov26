/* Garden Rooftop (Sector 7, Uttara)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'garden-rooftop', name: e('Garden Rooftop', 'গার্ডেন রুফটপ'), mono: 'GR', since: 2020,
  area: 'uttara', city: 'dhaka', geo: [23.8715, 90.3965], spot: e('Sector 7, Uttara', 'সেক্টর ৭, উত্তরা'), address: e('Roof, 12 Sonargaon Janapath, Sector 7, Uttara, Dhaka 1230', 'ছাদ, ১২ সোনারগাঁও জনপথ, সেক্টর ৭, উত্তরা, ঢাকা ১২৩০'),
  phone: '+8801700000802', cuisines: ['asian', 'grill'],
  theme: { deep: '#0F2619', accent: '#A5DB7E', font: 'sans' },
  tagline: e('Thai and Chinese on a garden terrace, ten minutes from the airport.', 'বাগান-টেরেসে থাই আর চাইনিজ, এয়ারপোর্ট থেকে দশ মিনিট।'),
  story: e('A lawn on the roof, a play corner for kids and a kitchen that does a proper green curry.', 'ছাদে সবুজ ঘাস, বাচ্চাদের খেলার জায়গা আর ঠিকঠাক গ্রিন কারি।'),
  rating: 4.3, reviews: 128, verified: 66, ppl: [550, 950], hours: ['12:00', '23:30'],
  vat: 10, service: 5, seats: 100, fac: ['rooftop', 'parking', 'ac', 'kids'], pay: ['Cash', 'Card'], plan: 'pro', checked: 2, mediaDate: e('Oct 2026', 'অক্টোবর ২০২৬'),
  hero: [pv('lythwood_terrace', 'a'), pv('lythwood_terrace', 'b'), 'in'],
  gallery: { inside: ['in'], outside: [pv('lythwood_terrace', 'a'), pv('lythwood_terrace', 'b')], kitchen: [], food: [] },
  tour: [{ id: 'lawn', ...e('Garden terrace', 'বাগান টেরেস'), pano: 'lythwood_terrace', yaw: 40, spots: [{ info: e('Kids play corner on the lawn', 'ঘাসের ওপর বাচ্চাদের খেলার জায়গা'), yaw: 80, pitch: -12 }] }],
  signature: ['gr-greencurry', 'gr-platter', 'gr-tomyum'],
  cats: [{ id: 'thai', ...e('Thai', 'থাই') }, { id: 'chinese', ...e('Chinese', 'চাইনিজ') }, { id: 'drink', ...e('Drinks', 'পানীয়') }],
  menu: [
    D('gr-greencurry', 'thai', 'Thai Green Curry', 'থাই গ্রিন কারি', 520, null, ['Serves 2 · with rice', '২ জন · ভাতসহ'], 2, { cat: 'thai', best: true }),
    D('gr-tomyum', 'thai', 'Tom Yum Kung', 'টম ইয়াম কুং', 380, null, ['Serves 2', '২ জন'], 3, { cat: 'thai' }),
    D('gr-platter', 'platter', 'Thai Platter for 3', 'থাই প্ল্যাটার (৩ জন)', 1390, null, ['Serves 3', '৩ জন'], 2, { cat: 'thai', share: 3 }),
    D('gr-friedrice', 'chinese', 'Chicken Fried Rice', 'চিকেন ফ্রাইড রাইস', 340, null, ['Serves 1 to 2', '১-২ জন'], 0, { cat: 'chinese' }),
    D('gr-chili', 'chinese', 'Chili Chicken', 'চিলি চিকেন', 420, null, ['Serves 2', '২ জন'], 2, { cat: 'chinese' }),
    D('gr-mocktail', 'drink', 'Green Apple Mojito', 'গ্রিন অ্যাপল মোহিতো', 220, null, ['1 glass', '১ গ্লাস'], 0, { cat: 'drink', veg: true })
  ],
  deal: { id: 'thai-lunch', ...e('Weekday Thai lunch, 15% off', 'কর্মদিবসে থাই লাঞ্চে ১৫% ছাড়'), desc: e('Thai Platter for 3 at lunch.', 'দুপুরে ৩ জনের থাই প্ল্যাটার।'), when: e('Sunday to Thursday, 12pm to 4pm', 'রবি থেকে বৃহস্পতি, দুপুর ১২টা থেকে ৪টা'), price: 1180, was: 1390, p: pv('lythwood_terrace', 'a') },
  reviewList: [
    R('garden-rooftop', 'Mitu Das', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'Green curry was the real thing. Kids loved the lawn.', ['Thai Green Curry'])
  ]
}));
