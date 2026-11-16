/* Nawabpur Kacchi Ghar (Nawabpur Road, Old Dhaka)

   Everything about this restaurant is in this folder:
   - restaurant.js (this file): details, hours, prices, photos, menu, 360 tour rooms and reviews
   - 360/  the 360° room photos its virtual tour uses (only if it has a tour)

   Helpers you will see below:
   e('English', 'বাংলা')  a text in both languages
   D(id, type, English, Bangla, price, photo, [portion en, portion bn], spice 0-3, extra)  one menu item
   P.xx  a shared photo, FILM.xx  a shared sample film, pv('room', 'a')  a still from one of this restaurant's 360 rooms
   R(restaurant, name, stars, verified, when, text, dishes ordered)  one review in reviewList (reviews: is the total count) */
addRestaurant(({ e, D, pv, P, FILM, R, ago }) => ({
  id: 'nawabpur-kacchi', name: e('Nawabpur Kacchi Ghar', 'নবাবপুর কাচ্চি ঘর'), mono: 'NK', since: 1987,
  area: 'old-dhaka', city: 'dhaka', geo: [23.7175, 90.413], spot: e('Nawabpur Road, Old Dhaka', 'নবাবপুর রোড, পুরান ঢাকা'), address: e('118 Nawabpur Road, Old Dhaka 1100', '১১৮ নবাবপুর রোড, পুরান ঢাকা ১১০০'),
  phone: '+8801700001131', cuisines: ['mughlai'],
  theme: { deep: '#1E140C', accent: '#F28C4B', font: 'serif' },
  tagline: e('Old Dhaka kacchi since 1987. Usually gone by nine.', '১৯৮৭ থেকে পুরান ঢাকার কাচ্চি। সাধারণত নয়টার মধ্যে শেষ।'),
  story: e('Small, loud and always full. One dish, done the same way for almost forty years.', 'ছোট, হইচই আর সবসময় ভিড়। একটাই খাবার, প্রায় চল্লিশ বছর একইভাবে।'),
  rating: 4.7, reviews: 812, verified: 402, ppl: [300, 500], hours: ['11:30', '22:00'],
  vat: 5, service: 0, seats: 45, fac: ['generator'], pay: ['Cash', 'bKash'], plan: 'starter', checked: 1,
  hero: ['pl', 'kc3'],
  gallery: { inside: [], outside: [], kitchen: [], food: ['pl'] },
  signature: ['nk-kacchi', 'nk-jali', 'nk-jorda'],
  cats: [{ id: 'rice', ...e('Kacchi', 'কাচ্চি') }, { id: 'side', ...e('Sides', 'সাইড') }],
  menu: [
    D('nk-kacchi', 'kacchi', 'Kacchi Platter', 'কাচ্চি প্ল্যাটার', 380, 'pl', ['Serves 1 · 2 pcs, egg, aloo', '১ জন · ২ পিস, ডিম, আলু'], 1, { cat: 'rice', best: true, desc: e('Their only main dish, cooked in batches from 11am.', 'তাদের একমাত্র মূল খাবার, সকাল ১১টা থেকে দফায় দফায় রান্না।') }),
    D('nk-half', 'kacchi', 'Half Kacchi', 'হাফ কাচ্চি', 260, null, ['Serves 1 · 1 pc', '১ জন · ১ পিস'], 1, { cat: 'rice' }),
    D('nk-jali', 'kebab', 'Jali Kabab', 'জালি কাবাব', 60, null, ['1 piece', '১ পিস'], 1, { cat: 'side' }),
    D('nk-borhani', 'drink', 'Borhani', 'বোরহানি', 70, null, ['1 glass', '১ গ্লাস'], 1, { cat: 'side', veg: true }),
    D('nk-jorda', 'dessert', 'Shahi Jorda', 'শাহী জর্দা', 90, null, ['1 plate', '১ প্লেট'], 0, { cat: 'side', veg: true })
  ],
  reviewList: [
    R('nawabpur-kacchi', 'Mahfuz Alam', 5, true, ago('4 days ago', '৪ দিন আগে'), 'রাত ৮টায় গিয়ে শেষ কয়েক প্লেট পেয়েছি। স্বাদ আগের মতোই।', ['Kacchi Platter', 'Borhani']),
    R('nawabpur-kacchi', 'Tasnim Sultana', 4, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'No AC and very busy, but the kacchi is worth it. Go before 8pm.', ['Kacchi Platter'])
  ]
}));
