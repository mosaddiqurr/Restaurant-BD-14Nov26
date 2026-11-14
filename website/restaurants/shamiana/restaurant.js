/* Shamiana (Road 17, Banani)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'shamiana', name: e('Shamiana', 'শামিয়ানা'), mono: 'SM', since: 2016,
  area: 'banani', city: 'dhaka', geo: [23.7907, 90.4058], spot: e('Road 17, Banani', 'রোড ১৭, বনানী'), address: e('House 5, Road 17, Banani, Dhaka 1213', 'বাড়ি ৫, রোড ১৭, বনানী, ঢাকা ১২১৩'),
  phone: '+8801700001020', cuisines: ['bangladeshi'],
  theme: { deep: '#2A1636', accent: '#F2A93B', font: 'serif' },
  tagline: e('A seven-bowl Bengali thali, served on brass.', 'পিতলের থালায় সাত বাটির বাঙালি থালি।'),
  story: e('Lunch thalis change daily. Ask for the khichuri on rainy days.', 'দুপুরের থালি প্রতিদিন বদলায়। বৃষ্টির দিনে খিচুড়ি চেয়ে নিন।'),
  rating: 4.4, reviews: 211, verified: 120, ppl: [350, 700], hours: ['12:00', '22:30'],
  vat: 5, service: 5, seats: 60, fac: ['ac', 'cabin'], pay: ['Cash', 'Card'], plan: 'starter', checked: 4,
  hero: ['di', 'th'],
  gallery: { inside: ['di'], outside: [], kitchen: [], food: ['th'] },
  signature: ['veg-thali', 'fish-thali', 'khichuri'],
  cats: [{ id: 'thali', ...e('Thali', 'থালি') }, { id: 'sweet', ...e('Sweet & drinks', 'মিষ্টি ও পানীয়') }],
  menu: [
    D('veg-thali', 'thali', 'Seven-bowl Veg Thali', 'সাত বাটির নিরামিষ থালি', 320, 'th', ['Serves 1', '১ জন'], 1, { cat: 'thali', best: true, veg: true, desc: e('Rice, dal, three seasonal vegetables, bhaji and chutney.', 'ভাত, ডাল, তিনটি মৌসুমি সবজি, ভাজি আর চাটনি।') }),
    D('fish-thali', 'thali', 'Fish Thali', 'মাছের থালি', 420, null, ['Serves 1 · rui or pabda', '১ জন · রুই বা পাবদা'], 1, { cat: 'thali' }),
    D('khichuri', 'thali', 'Bhuna Khichuri with Beef', 'গরুর মাংসসহ ভুনা খিচুড়ি', 340, null, ['Serves 1', '১ জন'], 2, { cat: 'thali' }),
    D('payesh', 'dessert', 'Payesh', 'পায়েস', 90, null, ['1 bowl', '১ বাটি'], 0, { cat: 'sweet', veg: true }),
    D('aam-pora', 'drink', 'Aam Pora Shorbot', 'আম পোড়া শরবত', 110, null, ['1 glass', '১ গ্লাস'], 0, { cat: 'sweet', veg: true })
  ],
  reviewList: [
    R('shamiana', 'Anika Tabassum', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'The brass thali feels special. Veg thali is filling and good value at lunch.', ['Seven-bowl Veg Thali'])
  ]
}));
