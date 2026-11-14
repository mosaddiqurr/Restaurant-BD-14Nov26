/* Kabab Ghor (Tajmahal Road, Mohammadpur)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'kabab-ghor', name: e('Kabab Ghor', 'কাবাব ঘর'), mono: 'KG', since: 2004,
  area: 'mohammadpur', city: 'dhaka', geo: [23.7631, 90.3627], spot: e('Tajmahal Road, Mohammadpur', 'তাজমহল রোড, মোহাম্মদপুর'), address: e('22/7 Tajmahal Road, Mohammadpur, Dhaka 1207', '২২/৭ তাজমহল রোড, মোহাম্মদপুর, ঢাকা ১২০৭'),
  phone: '+8801700000348', cuisines: ['grill', 'mughlai'],
  theme: { deep: '#1A1110', accent: '#FF8A4C', font: 'sans' },
  tagline: e('Charcoal, smoke and chap until one in the morning.', 'কয়লার আঁচ, ধোঁয়া আর রাত একটা পর্যন্ত চাপ।'),
  story: e('Everything is grilled to order on open coal, right at the front door. Expect a short wait and a long table.', 'সব কিছু অর্ডার দিলে দরজার সামনেই খোলা কয়লায় গ্রিল হয়। একটু অপেক্ষা, লম্বা টেবিল।'),
  rating: 4.4, reviews: 518, verified: 301, ppl: [300, 550], hours: ['16:00', '01:00'],
  vat: 5, service: 0, seats: 70, fac: ['ac', 'generator', 'kids'], pay: ['Cash', 'bKash', 'Nagad'], plan: 'pro', checked: 1, mediaDate: e('Sep 2026', 'সেপ্টেম্বর ২০২৬'),
  hero: ['iA', 'kc2', pv('qwantani_patio', 'a')],
  film: { src: FILM.grill, poster: 'ch', len: '0:13' },
  kitchen: { src: FILM.serve, poster: 'kc5', date: e('Filmed 28 Sep 2026', 'ধারণ ২৮ সেপ্টেম্বর ২০২৬'), photos: ['kc2', 'kc5'] },
  gallery: { inside: ['iA', pv('qwantani_patio', 'b')], outside: [pv('qwantani_patio', 'a')], kitchen: ['kc2', 'kc5'], food: ['ch', 'sk', 'na'] },
  tour: [{ id: 'patio', ...e('Grill patio', 'গ্রিল প্যাটিও'), pano: 'qwantani_patio', yaw: 225, spots: [{ info: e('Open charcoal grill, cooked in front of you', 'খোলা কয়লার গ্রিল, চোখের সামনে রান্না'), yaw: 22, pitch: -6 }] }],
  signature: ['chicken-tikka', 'beef-seekh', 'garlic-naan'],
  cats: [{ id: 'grill', ...e('From the grill', 'গ্রিল থেকে') }, { id: 'rice', ...e('Rice & bread', 'ভাত ও রুটি') }, { id: 'sweet', ...e('Drinks', 'পানীয়') }],
  menu: [
    D('chicken-tikka', 'kebab', 'Chicken Tikka Skewers', 'চিকেন টিক্কা শিক', 260, 'ch', ['4 skewers', '৪টি শিক'], 2, { cat: 'grill', best: true, video: FILM.grill, desc: e('Yoghurt and red chilli marinade, charred over coal.', 'দই আর লাল মরিচে মাখানো, কয়লায় পোড়া।') }),
    D('beef-seekh', 'kebab', 'Beef Seekh with Fries', 'বিফ শিক ও ফ্রাই', 290, 'sk', ['2 skewers, fries, salad', '২টি শিক, ফ্রাই, সালাদ'], 2, { cat: 'grill' }),
    D('beef-chap', 'kebab', 'Beef Chap', 'বিফ চাপ', 220, null, ['1 plate', '১ প্লেট'], 2, { cat: 'grill' }),
    D('grill-platter', 'platter', 'Mixed Grill for 3', 'মিক্সড গ্রিল (৩ জন)', 1190, null, ['Serves 3', '৩ জন'], 2, { cat: 'grill', share: 3 }),
    D('garlic-naan', 'naan', 'Garlic Naan', 'গার্লিক নান', 60, 'na', ['1 piece', '১ পিস'], 0, { cat: 'rice', veg: true }),
    D('kg-kacchi', 'kacchi', 'Mutton Kacchi (Fri, Sat)', 'মাটন কাচ্চি (শুক্র, শনি)', 360, null, ['Serves 1', '১ জন'], 1, { cat: 'rice' }),
    D('kg-lassi', 'drink', 'Sweet Lassi', 'মিষ্টি লাচ্ছি', 90, null, ['1 glass', '১ গ্লাস'], 0, { cat: 'sweet', veg: true })
  ],
  deal: { id: 'midnight', ...e('After 11pm chap combo', 'রাত ১১টার পর চাপ কম্বো'), desc: e('Beef chap, 2 garlic naan and a lassi.', 'বিফ চাপ, ২টি গার্লিক নান আর একটি লাচ্ছি।'), when: e('Every night after 11pm', 'প্রতি রাতে ১১টার পর'), price: 360, was: 430, p: 'sk' },
  reviewList: [
    R('kabab-ghor', 'Arif Hossain', 5, true, ago('1 day ago', '১ দিন আগে'), 'Raat 12 tay gesilam, tikka ekdom gorom gorom. Garlic naan must.', ['Chicken Tikka Skewers', 'Garlic Naan']),
    R('kabab-ghor', 'Mehnaz Rahman', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'Smoky, loud, fun. Not the place for a quiet dinner, perfect for friends.', ['Beef Seekh with Fries']),
    R('kabab-ghor', 'Shakil Ahmed', 4, false, ago('3 weeks ago', '৩ সপ্তাহ আগে'), 'চাপটা ভালো, তবে শুক্রবার রাতে জায়গা পাওয়া কঠিন।', ['Beef Chap'])
  ]
}));
