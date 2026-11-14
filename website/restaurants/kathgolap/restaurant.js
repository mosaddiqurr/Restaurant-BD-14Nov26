/* Kathgolap Rooftop (Road 11, Banani)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'kathgolap', name: e('Kathgolap Rooftop', 'কাঠগোলাপ রুফটপ'), mono: 'KR', since: 2021,
  area: 'banani', city: 'dhaka', geo: [23.794, 90.4045], spot: e('Road 11, Banani', 'রোড ১১, বনানী'), address: e('Level 11, 48 Road 11, Banani, Dhaka 1213', '১১ তলা, ৪৮ রোড ১১, বনানী, ঢাকা ১২১৩'),
  phone: '+8801700000412', cuisines: ['bangladeshi', 'asian', 'grill'],
  theme: { deep: '#14192B', accent: '#F4D77E', font: 'serif' },
  tagline: e('Banani from the eleventh floor, with the grill going all evening.', 'এগারো তলা থেকে বনানী, সন্ধ্যাজুড়ে জ্বলছে গ্রিল।'),
  story: e('Book a table by the rail if you want the sunset. After 8 pm the lounge side is quieter, and the grill runs until closing.', 'সূর্যাস্ত দেখতে চাইলে রেলিংয়ের পাশের টেবিল বুক করুন। রাত ৮টার পর লাউঞ্জের দিকটা শান্ত, আর গ্রিল চলে বন্ধ হওয়া পর্যন্ত।'),
  rating: 4.3, reviews: 176, verified: 102, ppl: [750, 1400], hours: ['15:00', '00:00'],
  vat: 10, service: 10, seats: 120, fac: ['rooftop', 'ac', 'parking', 'wifi', 'cabin'], pay: ['Cash', 'bKash', 'Card'], plan: 'premium', featured: true, checked: 3, mediaDate: e('Nov 2026', 'নভেম্বর ২০২৬'),
  hero: [pv('hotel_rooftop_balcony', 'a'), 'i4', pv('aft_lounge', 'a')],
  film: { src: FILM.hall, poster: 'i4', len: '0:10' },
  gallery: { inside: [pv('aft_lounge', 'a'), 'i4', pv('aft_lounge', 'b')], outside: [pv('hotel_rooftop_balcony', 'a'), pv('hotel_rooftop_balcony', 'b'), 'ex1'], kitchen: [], food: ['k'] },
  tour: [
    { id: 'roof', ...e('Rooftop', 'রুফটপ'), pano: 'hotel_rooftop_balcony', yaw: 130, spots: [{ to: 'lounge', yaw: 260, pitch: -2 }, { info: e('Rail tables face west for sunset', 'রেলিংয়ের টেবিল পশ্চিমমুখী, সূর্যাস্ত দেখা যায়'), yaw: 150, pitch: -6 }] },
    { id: 'lounge', ...e('Sky lounge', 'স্কাই লাউঞ্জ'), pano: 'aft_lounge', yaw: 10, spots: [{ to: 'roof', yaw: 60, pitch: -2 }] }
  ],
  signature: ['kr-kacchi', 'kr-bbq', 'kr-tomyum'],
  cats: [{ id: 'main', ...e('Mains', 'মূল খাবার') }, { id: 'asian', ...e('Chinese & Thai', 'চাইনিজ ও থাই') }, { id: 'sweet', ...e('Drinks', 'পানীয়') }],
  menu: [
    D('kr-kacchi', 'kacchi', 'Rooftop Kacchi', 'রুফটপ কাচ্চি', 480, 'k', ['Serves 1', '১ জন'], 1, { cat: 'main', best: true }),
    D('kr-bbq', 'platter', 'BBQ Platter for 4', 'বিবিকিউ প্ল্যাটার (৪ জন)', 2190, null, ['Serves 4 · chicken, beef, prawn', '৪ জন · চিকেন, বিফ, চিংড়ি'], 2, { cat: 'main', share: 4 }),
    D('kr-tomyum', 'thai', 'Tom Yum Soup', 'টম ইয়াম স্যুপ', 420, null, ['Serves 2', '২ জন'], 2, { cat: 'asian' }),
    D('kr-friedrice', 'chinese', 'Egg Fried Rice', 'এগ ফ্রাইড রাইস', 340, null, ['Serves 1 to 2', '১-২ জন'], 0, { cat: 'asian' }),
    D('kr-chili', 'chinese', 'Chili Chicken', 'চিলি চিকেন', 460, null, ['Serves 2', '২ জন'], 2, { cat: 'asian' }),
    D('kr-mocktail', 'drink', 'Kathgolap Mocktail', 'কাঠগোলাপ মকটেল', 260, null, ['1 glass', '১ গ্লাস'], 0, { cat: 'sweet', veg: true })
  ],
  deal: { id: 'sunset', ...e('Sunset hour, 20% off drinks', 'সূর্যাস্তের সময় পানীয়তে ২০% ছাড়'), desc: e('All mocktails and juices.', 'সব মকটেল আর জুস।'), when: e('Daily, 5pm to 7pm', 'প্রতিদিন বিকেল ৫টা থেকে ৭টা'), price: 208, was: 260, p: pv('hotel_rooftop_balcony', 'b') },
  reviewList: [
    R('kathgolap', 'Tahsin Islam', 5, true, ago('5 days ago', '৫ দিন আগে'), 'Booked a rail table for sunset after seeing the 360 view. Worth it. BBQ platter easily feeds four.', ['BBQ Platter for 4']),
    R('kathgolap', 'Ruma Begum', 3, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'সুন্দর জায়গা, কিন্তু ভ্যাট আর সার্ভিস চার্জ মিলিয়ে ২০%। আগে থেকে হিসাব করে যাওয়া ভালো।', ['Rooftop Kacchi', 'Tom Yum Soup'])
  ]
}));
