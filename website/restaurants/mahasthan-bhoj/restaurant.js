/* Mahasthan Bhoj (Jaleshwaritola, Bogura)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'mahasthan-bhoj', name: e('Mahasthan Bhoj', 'মহাস্থান ভোজ'), mono: 'MV', since: 2012,
  area: 'jaleshwaritola', city: 'bogura', geo: [24.844, 89.3705], spot: e('Jaleshwaritola, Bogura', 'জলেশ্বরীতলা, বগুড়া'), address: e('7 Jaleshwaritola Road, Bogura 5800', '৭ জলেশ্বরীতলা রোড, বগুড়া ৫৮০০'),
  phone: '+8801700000915', cuisines: ['bangladeshi', 'mughlai', 'dessert'],
  theme: { deep: '#3A1606', accent: '#E8955A', font: 'serif' },
  tagline: e('Bogura kacchi and the town’s famous doi, a short walk from Satmatha.', 'বগুড়ার কাচ্চি আর বিখ্যাত দই, সাতমাথা থেকে হাঁটা পথ।'),
  story: e('Doi is set every morning in clay pots from Sherpur. Families from all over the north stop here on the way home.', 'প্রতিদিন সকালে শেরপুরের মাটির সরায় দই বসানো হয়। উত্তরবঙ্গের অনেক পরিবার বাড়ি ফেরার পথে এখানে থামে।'),
  rating: 4.6, reviews: 97, verified: 71, ppl: [250, 500], hours: ['11:00', '22:30'],
  vat: 5, service: 0, seats: 110, fac: ['cabin', 'ac', 'parking', 'prayer', 'generator', 'events'], pay: ['Cash', 'bKash', 'Nagad'], plan: 'pro', founding: true, checked: 2, mediaDate: e('Oct 2026', 'অক্টোবর ২০২৬'),
  hero: ['in', 'bp', 'kc3'],
  film: { src: FILM.serve, poster: 'bp', len: '0:16' },
  kitchen: { src: FILM.kitchen, poster: 'kc3', date: e('Filmed 9 Oct 2026', 'ধারণ ৯ অক্টোবর ২০২৬'), photos: ['kc3'] },
  gallery: { inside: ['in'], outside: [], kitchen: ['kc3'], food: ['bp'] },
  signature: ['mv-kacchi', 'bogura-doi', 'mv-bhuna'],
  cats: [{ id: 'rice', ...e('Rice', 'ভাত') }, { id: 'curry', ...e('Curries', 'তরকারি') }, { id: 'sweet', ...e('Doi & drinks', 'দই ও পানীয়') }],
  menu: [
    D('mv-kacchi', 'kacchi', 'Bogura Kacchi', 'বগুড়ার কাচ্চি', 280, 'bp', ['Serves 1 · clay pot', '১ জন · মাটির হাঁড়ি'], 1, { cat: 'rice', best: true, video: FILM.serve, desc: e('Mutton kacchi served in its own clay pot.', 'নিজস্ব মাটির হাঁড়িতে মাটন কাচ্চি।') }),
    D('mv-polao', 'polao', 'Polao and Roast Set', 'পোলাও-রোস্ট সেট', 320, null, ['Serves 1', '১ জন'], 0, { cat: 'rice' }),
    D('mv-bhuna', 'curry', 'Beef Bhuna', 'গরুর মাংস ভুনা', 260, null, ['Serves 1 to 2', '১-২ জন'], 2, { cat: 'curry' }),
    D('mv-roast', 'curry', 'Chicken Roast', 'চিকেন রোস্ট', 190, null, ['1 quarter', '১ কোয়ার্টার'], 0, { cat: 'curry' }),
    D('bogura-doi', 'dessert', 'Bogura Doi', 'বগুড়ার দই', 140, null, ['1 small clay pot', '১টি ছোট সরা'], 0, { cat: 'sweet', best: true, veg: true, desc: e('Thick, sweet and set overnight in clay.', 'ঘন, মিষ্টি, সারা রাত মাটির সরায় বসানো।') }),
    D('mv-borhani', 'drink', 'Borhani', 'বোরহানি', 50, null, ['1 glass', '১ গ্লাস'], 1, { cat: 'sweet', veg: true })
  ],
  deal: { id: 'kacchi-doi', ...e('Kacchi and doi combo', 'কাচ্চি ও দই কম্বো'), desc: e('Bogura Kacchi with a small pot of doi.', 'বগুড়ার কাচ্চি আর এক সরা দই।'), when: e('Every day', 'প্রতিদিন'), price: 380, was: 420, p: 'bp' },
  reviewList: [
    R('mahasthan-bhoj', 'Habibur Rahman', 5, true, ago('3 days ago', '৩ দিন আগে'), 'ঢাকা থেকে ফেরার পথে থেমেছিলাম। মাটির হাঁড়ির কাচ্চি আর দই, দুটোই দারুণ। কেবিন পরিষ্কার।', ['Bogura Kacchi', 'Bogura Doi']),
    R('mahasthan-bhoj', 'Jannatul Ferdous', 5, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'Amar bhai er biye r agey ekhane family dinner korechilam, 14 jon. Event hall ta boro.', ['Polao and Roast Set'])
  ]
}));
