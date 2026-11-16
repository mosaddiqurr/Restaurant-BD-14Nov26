/* Shahi Handi House (Road 27, Dhanmondi)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'shahi-handi', name: e('Shahi Handi House', 'শাহী হান্ডি হাউস'), mono: 'SH', since: 1998,
  area: 'dhanmondi', city: 'dhaka', geo: [23.7547, 90.3741], spot: e('Road 27, Dhanmondi', 'রোড ২৭, ধানমন্ডি'),
  address: e('House 32, Road 27 (old), Dhanmondi, Dhaka 1209', 'বাড়ি ৩২, রোড ২৭ (পুরাতন), ধানমন্ডি, ঢাকা ১২০৯'),
  phone: '+8801700000127', cuisines: ['mughlai', 'bangladeshi'],
  theme: { deep: '#2A0C14', accent: '#E2B04A', font: 'serif' },
  /* brand: a demo logo for the prototype (logo.svg in this folder).
     shape = the outline in a 100 x 100 box, box = where the real QR square sits inside it [x, y, size],
     extra = lines drawn around the shape (the steam). With qr.look 'logo' every QR of this restaurant takes this shape. */
  brand: { logo: 'logo.svg', shape: 'M26 18H74Q78 18 77 22L75.5 26Q74.5 28 71 28C70 31 71 33 73 34.5C89 42 97 54 96 68C95 84 82 95 63 96H37C18 95 5 84 4 68C3 54 11 42 27 34.5C29 33 30 31 29 28Q25.5 28 24.5 26L23 22Q22 18 26 18ZM41 18C41 9 59 9 59 18Z', box: [24, 40, 52], extra: 'M40 10c-5-4 5-7 0-12M50 8c-5-4 5-7 0-12M60 10c-5-4 5-7 0-12' },
  qr: { look: 'logo' },
  /* social pages (demo links). main = the one shown first and bigger */
  social: { main: 'facebook', links: { facebook: { url: 'https://facebook.com/shahihandi.demo', n: '48k' }, instagram: { url: 'https://instagram.com/shahihandi.demo', n: '12.4k' }, tiktok: { url: 'https://tiktok.com/@shahihandi.demo', n: '31k' } } },
  tagline: e('Old Dhaka kacchi, sealed in the handi and opened at your table.', 'পুরান ঢাকার কাচ্চি, হান্ডিতে মুখবন্ধ রান্না, খোলা হয় আপনার টেবিলে।'),
  story: e('On Road 27 since 1998. The kacchi goes into dough-sealed handis at 6 every morning and cooks over coal for four hours. The family cabins upstairs seat six to ten.', '১৯৯৮ সাল থেকে রোড ২৭-এ। প্রতিদিন সকাল ৬টায় আটা দিয়ে মুখবন্ধ হান্ডিতে কাচ্চি ওঠে, কয়লার আঁচে রান্না হয় চার ঘণ্টা। ওপরতলার ফ্যামিলি কেবিনে ৬ থেকে ১০ জন বসতে পারেন।'),
  rating: 4.6, reviews: 362, verified: 214, ppl: [450, 650], hours: ['11:00', '23:30'],
  vat: 5, service: 5, seats: 140, fac: ['cabin', 'ac', 'parking', 'prayer', 'generator', 'kids', 'wheelchair', 'wifi', 'events'],
  pay: ['Cash', 'bKash', 'Nagad', 'Card'], plan: 'premium', featured: true, founding: true, checked: 2, mediaDate: e('Oct 2026', 'অক্টোবর ২০২৬'),
  hero: [pv('warm_restaurant_night', 'a'), 'iB', pv('warm_reception_dinner', 'a')],
  film: { src: FILM.hall, poster: pv('warm_restaurant_night', 'b'), len: '0:10' },
  kitchen: { src: FILM.kitchen, poster: 'kc1', date: e('Filmed 12 Oct 2026', 'ধারণ ১২ অক্টোবর ২০২৬'), photos: ['kc1', 'kc3'] },
  gallery: { inside: [pv('warm_restaurant_night', 'a'), pv('warm_restaurant', 'a'), pv('anniversary_lounge', 'a'), 'iB', pv('warm_reception_dinner', 'a'), pv('warm_reception_dinner', 'b')], outside: ['ex3'], kitchen: ['kc1', 'kc3'], food: ['kt', 'hd', 'b4', 'te', 'bw'] },
  tour: [
    { id: 'hall', ...e('Main hall', 'মূল হল'), pano: 'warm_restaurant_night', day: 'warm_restaurant', yaw: 110,
      spots: [{ to: 'banquet', yaw: 160, pitch: -2 }, { to: 'lounge', yaw: 52, pitch: -3 }, { info: e('90 seats, fully air-conditioned', '৯০টি আসন, পুরো এসি'), yaw: 112, pitch: -18 }] },
    { id: 'banquet', ...e('Banquet hall', 'ব্যাঙ্কুয়েট হল'), pano: 'warm_reception_dinner', yaw: 135,
      spots: [{ to: 'hall', yaw: 75, pitch: -2 }, { info: e('Events for up to 120 guests', '১২০ জন পর্যন্ত অনুষ্ঠান'), yaw: 150, pitch: -10 }] },
    { id: 'lounge', ...e('Family lounge', 'ফ্যামিলি লাউঞ্জ'), pano: 'anniversary_lounge', yaw: 125,
      spots: [{ to: 'hall', yaw: 200, pitch: -2 }, { info: e('Private for groups of 6 to 10. Book a day ahead.', '৬ থেকে ১০ জনের জন্য আলাদা। এক দিন আগে বুক করুন।'), yaw: 120, pitch: -16 }] }
  ],
  signature: ['mutton-kacchi', 'kacchi-handi', 'morog-polao'],
  cats: [{ id: 'rice', ...e('Kacchi & rice', 'কাচ্চি ও ভাত') }, { id: 'grill', ...e('Kebab', 'কাবাব') }, { id: 'curry', ...e('Curries & bread', 'তরকারি ও রুটি') }, { id: 'sweet', ...e('Drinks & dessert', 'পানীয় ও মিষ্টি') }],
  menu: [
    D('mutton-kacchi', 'kacchi', 'Mutton Kacchi', 'মাটন কাচ্চি', 420, 'kt', ['Serves 1 · 2 pcs mutton, aloo', '১ জন · ২ পিস মাটন, আলু'], 1, { cat: 'rice', best: true, video: FILM.serve, desc: e('Basmati and mutton cooked together in a sealed handi. Comes with aloo, salad and a boiled egg on request.', 'বাসমতি চাল আর মাটন একসাথে মুখবন্ধ হান্ডিতে রান্না। সাথে আলু, সালাদ, চাইলে ডিম।') }),
    D('kacchi-handi', 'kacchi', 'Kacchi Handi for 4', 'কাচ্চি হান্ডি (৪ জন)', 1590, 'hd', ['Serves 4 · 8 pcs mutton', '৪ জন · ৮ পিস মাটন'], 1, { cat: 'rice', share: 4, desc: e('The whole handi, opened at your table. Order 30 minutes ahead on weekends.', 'পুরো হান্ডি, টেবিলে খোলা হয়। ছুটির দিনে ৩০ মিনিট আগে অর্ডার দিন।') }),
    D('chicken-biryani', 'biryani', 'Chicken Tikka Biryani', 'চিকেন টিক্কা বিরিয়ানি', 310, 'b4', ['Serves 1 · 1 tikka leg', '১ জন · ১টি টিক্কা লেগ'], 2, { cat: 'rice', desc: e('Tandoor-charred chicken over spiced biryani rice.', 'তন্দুরে পোড়া চিকেন, মশলাদার বিরিয়ানির ওপর।') }),
    D('morog-polao', 'polao', 'Morog Polao', 'মোরগ পোলাও', 320, 'te', ['Serves 1 · quarter chicken', '১ জন · কোয়ার্টার মুরগি'], 0, { cat: 'rice', desc: e('Wedding-style polao with a slow-cooked chicken leg.', 'বিয়েবাড়ির পোলাও, ধীরে রান্না মুরগির রানের সাথে।') }),
    D('mutton-seekh', 'kebab', 'Mutton Seekh Kabab', 'মাটন শিক কাবাব', 240, null, ['2 skewers', '২টি শিক'], 2, { cat: 'grill' }),
    D('shami-kabab', 'kebab', 'Shami Kabab', 'শামি কাবাব', 95, null, ['1 piece', '১ পিস'], 1, { cat: 'grill' }),
    D('butter-chicken', 'curry', 'Butter Chicken', 'বাটার চিকেন', 340, 'bw', ['Serves 1 to 2', '১-২ জন'], 1, { cat: 'curry', desc: e('Tomato, butter and cream, finished with kasuri methi.', 'টমেটো, মাখন আর ক্রিম, শেষে কসুরি মেথি।') }),
    D('mutton-rezala', 'curry', 'Mutton Rezala', 'মাটন রেজালা', 380, null, ['Serves 1 to 2', '১-২ জন'], 1, { cat: 'curry' }),
    D('butter-naan', 'naan', 'Butter Naan', 'বাটার নান', 55, null, ['1 piece', '১ পিস'], 0, { cat: 'curry', veg: true }),
    D('borhani', 'drink', 'Borhani', 'বোরহানি', 90, null, ['1 glass', '১ গ্লাস'], 1, { cat: 'sweet', veg: true }),
    D('firni', 'dessert', 'Firni in a clay bowl', 'মাটির বাটিতে ফিরনি', 110, null, ['1 bowl', '১ বাটি'], 0, { cat: 'sweet', veg: true })
  ],
  /* deals: as many as the restaurant runs, in the order diners see them */
  deals: [{ id: 'family-feast', ...e('Family Feast for 4', '৪ জনের ফ্যামিলি ফিস্ট'), desc: e('Kacchi handi, 4 borhani and 4 firni.', 'কাচ্চি হান্ডি, ৪টি বোরহানি আর ৪টি ফিরনি।'), when: e('Sunday to Thursday', 'রবি থেকে বৃহস্পতি'), price: 1790, was: 2190, p: 'hd', week: true  },
    { id: 'lunch-kacchi', ...e('Weekday lunch: kacchi and borhani', 'দুপুরের অফার: কাচ্চি আর বোরহানি'), desc: e('One plate of mutton kacchi with a glass of borhani.', 'এক প্লেট মাটন কাচ্চি আর এক গ্লাস বোরহানি।'), when: e('Sunday to Thursday, 12pm to 4pm', 'রবি থেকে বৃহস্পতি, দুপুর ১২টা থেকে ৪টা'), price: 450, was: 510, p: 'kt' },
    { id: 'grill-night', ...e('Grill night for 2', 'দুজনের গ্রিল নাইট'), desc: e('Tikka biryani for two, seekh kabab and two naan.', 'দুজনের টিক্কা বিরিয়ানি, শিক কাবাব আর দুটি নান।'), when: e('Friday and Saturday, after 7pm', 'শুক্র ও শনি, সন্ধ্যা ৭টার পর'), price: 890, was: 1010, p: 'b4' }],
  /* events: shown on this page, the Events page and Home until they end */
  events: [
    { id: 'bijoy-dibos', ...e('Victory Day kacchi feast', 'বিজয় দিবসের কাচ্চি ভোজ'), type: 'festival', start: '2026-12-16T12:00', end: '2026-12-16T23:00', p: 'hd', desc: e('A set menu of kacchi, rezala, firni and borhani for the whole family.', 'পুরো পরিবারের জন্য কাচ্চি, রেজালা, ফিরনি আর বোরহানির সেট মেনু।') }
  ],
  reviewList: [
    R('shahi-handi', 'Tanvir Ahmed', 5, true, ago('2 days ago', '২ দিন আগে'), 'কাচ্চির মাংস একদম নরম, আলুটাও ঠিকঠাক। ৪ জন গিয়েছিলাম, বিল এসেছে ১,৯৮০ টাকা, এখানে যা দেখেছিলাম প্রায় তাই।', ['Mutton Kacchi', 'Borhani'], { pics: ['kt'] }),
    R('shahi-handi', 'Nusrat Jahan', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'Took my parents for their anniversary. The family lounge looked exactly like the 360 tour, quiet and properly cool. Rezala was a little sweet for me.', ['Kacchi Handi for 4', 'Mutton Rezala'], { reply: e('Thank you, Nusrat. We have passed your note on the rezala to our chef.', 'ধন্যবাদ, নুসরাত। রেজালা নিয়ে আপনার মতামত আমাদের শেফকে জানানো হয়েছে।') }),
    R('shahi-handi', 'Rafiq Hasan', 3, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'Friday te 40 minute wait korte hoyeche. Khabar valo, kintu weekend e age theke call kore jaben.', ['Chicken Tikka Biryani']),
    R('shahi-handi', 'Sadia Karim', 5, true, ago('3 weeks ago', '৩ সপ্তাহ আগে'), 'Morog polao tastes like a proper wedding. Parking was easy on a weekday evening.', ['Morog Polao', 'Butter Naan'])
  ]
}));
