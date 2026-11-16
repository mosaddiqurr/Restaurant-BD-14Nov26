/* Mirpur Bawarchi (Section 10, Mirpur)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'mirpur-bawarchi', name: e('Mirpur Bawarchi', 'মিরপুর বাবুর্চি'), mono: 'MB', since: 2009,
  area: 'mirpur', city: 'dhaka', geo: [23.8069, 90.3687], spot: e('Section 10, Mirpur', 'সেকশন ১০, মিরপুর'), address: e('Plot 14, Section 10, Mirpur, Dhaka 1216', 'প্লট ১৪, সেকশন ১০, মিরপুর, ঢাকা ১২১৬'),
  phone: '+8801700000604', cuisines: ['bangladeshi', 'mughlai'],
  theme: { deep: '#3A120A', accent: '#F2B33D', font: 'sans' },
  tagline: e('Beef tehari in mustard oil, the Mirpur way, since 2009.', 'সরিষার তেলে বিফ তেহারি, মিরপুরের নিজস্ব স্বাদে, ২০০৯ থেকে।'),
  story: e('A busy family place. Lunch rush is 1pm to 3pm, so come a little early for a table.', 'ব্যস্ত পারিবারিক জায়গা। দুপুর ১টা থেকে ৩টা ভিড়, তাই একটু আগে আসুন।'),
  rating: 4.2, reviews: 689, verified: 377, ppl: [180, 350], hours: ['10:30', '23:00'],
  vat: 5, service: 0, seats: 60, fac: ['ac', 'generator', 'kids'], pay: ['Cash', 'bKash', 'Nagad'], plan: 'starter', checked: 3,
  hero: ['iC', 'b3'],
  gallery: { inside: ['iC'], outside: [], kitchen: [], food: ['b3'] },
  signature: ['beef-tehari', 'mb-kacchi', 'mb-polao'],
  cats: [{ id: 'rice', ...e('Rice', 'ভাত') }, { id: 'side', ...e('Sides & drinks', 'সাইড ও পানীয়') }],
  menu: [
    D('beef-tehari', 'tehari', 'Beef Tehari', 'বিফ তেহারি', 230, 'b3', ['Serves 1', '১ জন'], 2, { cat: 'rice', best: true, desc: e('Small beef cubes, mustard oil and green chilli through fragrant rice.', 'ছোট ছোট গরুর মাংস, সরিষার তেল আর কাঁচা মরিচ।') }),
    D('mb-kacchi', 'kacchi', 'Mutton Kacchi', 'মাটন কাচ্চি', 340, null, ['Serves 1', '১ জন'], 1, { cat: 'rice' }),
    D('mb-polao', 'polao', 'Chicken Polao', 'চিকেন পোলাও', 250, null, ['Serves 1', '১ জন'], 0, { cat: 'rice' }),
    D('mb-roast', 'curry', 'Chicken Roast', 'চিকেন রোস্ট', 190, null, ['1 quarter', '১ কোয়ার্টার'], 0, { cat: 'side' }),
    D('mb-jali', 'kebab', 'Jali Kabab', 'জালি কাবাব', 70, null, ['1 piece', '১ পিস'], 1, { cat: 'side' }),
    D('mb-borhani', 'drink', 'Borhani', 'বোরহানি', 60, null, ['1 glass', '১ গ্লাস'], 1, { cat: 'side', veg: true })
  ],
  reviewList: [
    R('mirpur-bawarchi', 'Kamrul Islam', 4, true, ago('2 days ago', '২ দিন আগে'), 'Tehari te jhal ektu beshi, kintu 230 takay eto valo tehari kom pawa jay.', ['Beef Tehari', 'Borhani']),
    R('mirpur-bawarchi', 'Shirin Akhter', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'বাচ্চাদের নিয়ে গিয়েছিলাম, খেলার জায়গাটা ছোট কিন্তু পরিষ্কার।', ['Chicken Polao'])
  ]
}));
