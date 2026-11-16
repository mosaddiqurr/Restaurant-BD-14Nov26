/* Nodir Paar (Road 90, Gulshan 2)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'nodir-paar', name: e('Nodir Paar', 'নদীর পাড়'), mono: 'NP', since: 2015,
  area: 'gulshan', city: 'dhaka', geo: [23.7983, 90.415], spot: e('Road 90, Gulshan 2', 'রোড ৯০, গুলশান ২'), address: e('House 14, Road 90, Gulshan 2, Dhaka 1212', 'বাড়ি ১৪, রোড ৯০, গুলশান ২, ঢাকা ১২১২'),
  phone: '+8801700000233', cuisines: ['bangladeshi'],
  theme: { deep: '#062B33', accent: '#86D3C6', font: 'serif' },
  tagline: e('Twelve bhortas, river fish and rice the way your nani made it.', 'বারো রকম ভর্তা, নদীর মাছ আর নানুর হাতের মতো ভাত।'),
  story: e('Fish comes in from Chandpur and Khulna every morning. If it is not good that day, it is not on the menu.', 'প্রতিদিন সকালে চাঁদপুর আর খুলনা থেকে মাছ আসে। সেদিন ভালো না হলে মেনুতে থাকে না।'),
  rating: 4.5, reviews: 241, verified: 158, ppl: [600, 1100], hours: ['12:00', '23:00'],
  vat: 10, service: 5, seats: 90, fac: ['ac', 'parking', 'cabin', 'wifi', 'wheelchair'], pay: ['Cash', 'bKash', 'Card'], plan: 'pro', founding: true, checked: 4, mediaDate: e('Oct 2026', 'অক্টোবর ২০২৬'),
  hero: ['i5', pv('bush_restaurant', 'a'), 'i2'],
  film: { src: FILM.cafe, poster: 'i5', len: '0:15' },
  kitchen: { src: FILM.kitchen, poster: 'kc4', date: e('Filmed 3 Oct 2026', 'ধারণ ৩ অক্টোবর ২০২৬'), photos: ['kc4'] },
  gallery: { inside: ['i5', pv('bush_restaurant', 'a'), 'i2', pv('bush_restaurant', 'b')], outside: [pv('veranda', 'a'), pv('veranda', 'b')], kitchen: ['kc4'], food: ['fi', 'po'] },
  tour: [
    { id: 'dining', ...e('Dining room', 'ডাইনিং রুম'), pano: 'bush_restaurant', yaw: 40, spots: [{ to: 'veranda', yaw: 95, pitch: -4 }, { info: e('Window tables look onto the garden', 'জানালার পাশের টেবিল থেকে বাগান দেখা যায়'), yaw: 0, pitch: -8 }] },
    { id: 'veranda', ...e('Garden veranda', 'বাগানের বারান্দা'), pano: 'veranda', yaw: 40, spots: [{ to: 'dining', yaw: 160, pitch: -4 }] }
  ],
  signature: ['rupchanda-fry', 'bhorta-thali', 'shorshe-ilish'],
  cats: [{ id: 'fish', ...e('Fish', 'মাছ') }, { id: 'rice', ...e('Rice & bhorta', 'ভাত ও ভর্তা') }, { id: 'sweet', ...e('Sweet & tea', 'মিষ্টি ও চা') }],
  menu: [
    D('rupchanda-fry', 'fish', 'Rupchanda Fry', 'রূপচাঁদা ফ্রাই', 560, 'fi', ['1 whole fish', '১টি আস্ত মাছ'], 1, { cat: 'fish', best: true, desc: e('Silver pomfret, turmeric and chilli, shallow-fried in mustard oil.', 'রূপচাঁদা, হলুদ-মরিচে মেখে সরিষার তেলে ভাজা।') }),
    D('shorshe-ilish', 'fish', 'Shorshe Ilish', 'সর্ষে ইলিশ', 690, null, ['1 large piece', '১টি বড় পিস'], 2, { cat: 'fish', desc: e('Padma hilsa steamed in mustard paste and green chilli.', 'পদ্মার ইলিশ, সর্ষে বাটা আর কাঁচা মরিচে ভাপা।') }),
    D('chingri-malai', 'fish', 'Chingri Malaikari', 'চিংড়ি মালাইকারি', 640, null, ['2 large prawns', '২টি বড় চিংড়ি'], 1, { cat: 'fish' }),
    D('bhorta-thali', 'thali', 'Bhorta Bhaat Thali', 'ভর্তা ভাত থালি', 480, 'po', ['Serves 1 · 6 bhortas, dal, rice', '১ জন · ৬ রকম ভর্তা, ডাল, ভাত'], 2, { cat: 'rice', best: true, desc: e('Six bhortas that change with the season, dal, rice and a fried egg.', 'মৌসুম বুঝে ছয় রকম ভর্তা, ডাল, ভাত আর ডিম ভাজি।') }),
    D('mezbani', 'curry', 'Mezbani Beef', 'মেজবানি গরুর মাংস', 420, null, ['Serves 1 to 2', '১-২ জন'], 3, { cat: 'rice' }),
    D('dal-bhaat', 'thali', 'Dal Bhaat Set', 'ডাল ভাত সেট', 260, null, ['Serves 1', '১ জন'], 0, { cat: 'rice', veg: true }),
    D('mishti-doi', 'dessert', 'Mishti Doi', 'মিষ্টি দই', 120, null, ['1 clay pot', '১টি মাটির পাত্র'], 0, { cat: 'sweet', veg: true }),
    D('lebu-cha', 'tea', 'Lebu Cha', 'লেবু চা', 50, null, ['1 cup', '১ কাপ'], 0, { cat: 'sweet', veg: true })
  ],
  events: [
    { id: 'iftar-27', ...e('Ramadan iftar platter', 'রমজানের ইফতার প্ল্যাটার'), type: 'iftar', start: '2027-02-08T17:30', end: '2027-03-09T19:30', p: 'pl', price: 650, desc: e('Every day of Ramadan, from maghrib. Book a table a day ahead.', 'রমজানের প্রতিদিন, মাগরিব থেকে। এক দিন আগে টেবিল বুক করুন।') }
  ],
  reviewList: [
    R('nodir-paar', 'Farhana Akter', 5, true, ago('4 days ago', '৪ দিন আগে'), 'ভর্তার থালাটা অসাধারণ, প্রতিটা ভর্তার স্বাদ আলাদা। দাম একটু বেশি, তবে মাছ একদম তাজা।', ['Bhorta Bhaat Thali', 'Rupchanda Fry']),
    R('nodir-paar', 'Imran Chowdhury', 4, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'Good for taking guests from abroad. The veranda is lovely in winter. Service charge is 5% on top of 10% VAT, so check the bill estimate first.', ['Shorshe Ilish'])
  ]
}));
