/* Demo data. Every restaurant, review and price here is fictional.
   Photos: Unsplash. 360 rooms + food scans: Poly Haven (CC0). Films: Mixkit (free licence). */
window.K = window.K || {};
K.data = (function () {
  const P = {
    kt: '1589302168068-964664d93dc0', k: '1563379091339-03b21ab4a4f8', te: '1631515243349-e0cb75fb8d3a', po: '1588644525273-f37b60d78512',
    th: '1743674453123-93356ade2891', ch: '1599487488170-d11ec9c172f0', na: '1565557623262-b51c2513a641', fi: '1652954008429-ce394eacbd7f',
    fu: '1781243680771-1fea4521e196', pl: '1633945274405-b6c8069047b0', sk: '1603360946369-dc9bb6258143', sm: '1786603449553-d94235e87fe5',
    bw: '1712757248842-04f6e3844374', tb: '1698751963561-f567afae288e', bp: '1752673508949-f4aeeaef75f0', hd: '1697155406055-2db32d47ca07',
    b3: '1633945274309-2c16c9682a8c', b4: '1714611626323-5ba6204453be',
    in: '1517248135467-4c7edcad34c4', ro: '1526069631228-723c945bea6b', di: '1709548145082-04d0cde481d4', i2: '1667388969250-1c7220bf3f37',
    i3: '1538334421852-687c439c92f4', i4: '1570560258879-af7f8e1447ac', i5: '1636405189493-181ecf851006', iA: '1751200503125-d8cb239f95ba',
    iB: '1749137011592-0a77520c82dc', iC: '1651684081211-602801541b08', iD: '1780345493801-d343616b49b1',
    ex1: '1759866614069-e5b93d17e663', ex2: '1793346460209-d70c68c8c16c', ex3: '1579027989536-b7b1f875659b',
    kc1: '1600565193348-f74bd3c7ccdf', kc2: '1763951718950-c536b1295213', kc3: '1588416820614-f8d6ac6cea56', kc4: '1622021142947-da7dedc7c39a', kc5: '1792582427557-14fa39dbe877'
  };
  const V = id => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
  const FILM = { hall: V(29050), kitchen: V(15875), grill: V(4678), serve: V(4672), cafe: V(4385) };
  const e = (en, bn) => ({ en, bn });

  /* ---------- places ---------- */
  const cities = { dhaka: e('Dhaka', 'ঢাকা'), bogura: e('Bogura', 'বগুড়া') };
  const areas = [
    { id: 'dhanmondi', city: 'dhaka', ...e('Dhanmondi', 'ধানমন্ডি'), blurb: e('Lake walks, old favourites and kacchi on every road.', 'লেকের পাড়, পুরোনো প্রিয় জায়গা আর প্রতিটা রোডে কাচ্চি।') },
    { id: 'gulshan', city: 'dhaka', ...e('Gulshan', 'গুলশান'), blurb: e('Quiet dining rooms and family dinners.', 'শান্ত ডাইনিং আর পরিবারের ডিনার।') },
    { id: 'banani', city: 'dhaka', ...e('Banani', 'বনানী'), blurb: e('Rooftops, thalis and late evenings.', 'রুফটপ, থালি আর লম্বা সন্ধ্যা।') },
    { id: 'mirpur', city: 'dhaka', ...e('Mirpur', 'মিরপুর'), blurb: e('Tehari, biryani and honest prices.', 'তেহারি, বিরিয়ানি আর ন্যায্য দাম।') },
    { id: 'mohammadpur', city: 'dhaka', ...e('Mohammadpur', 'মোহাম্মদপুর'), blurb: e('Kebab streets that stay up late.', 'রাত জাগা কাবাবের রাস্তা।') },
    { id: 'uttara', city: 'dhaka', ...e('Uttara', 'উত্তরা'), blurb: e('Garden terraces near the airport.', 'এয়ারপোর্টের কাছে বাগান-টেরেস।') },
    { id: 'old-dhaka', city: 'dhaka', ...e('Old Dhaka', 'পুরান ঢাকা'), blurb: e('Where kacchi began. Go early.', 'কাচ্চির শুরু এখানেই। আগে যান।') },
    { id: 'jaleshwaritola', city: 'bogura', ...e('Jaleshwaritola', 'জলেশ্বরীতলা'), blurb: e('Family restaurants and Bogura doi.', 'পরিবারের রেস্টুরেন্ট আর বগুড়ার দই।') },
    { id: 'satmatha', city: 'bogura', ...e('Satmatha', 'সাতমাথা'), blurb: e('Evening fuchka at the heart of town.', 'শহরের মাঝখানে সন্ধ্যার ফুচকা।') }
  ];
  const soon = [e('Bashundhara', 'বসুন্ধরা'), e('Chattogram', 'চট্টগ্রাম'), e('Sylhet', 'সিলেট')];

  /* ---------- taxonomy ---------- */
  const cuisines = [
    { id: 'mughlai', ...e('Mughlai & biryani', 'মোগলাই ও বিরিয়ানি'), p: 'kt' },
    { id: 'bangladeshi', ...e('Bangladeshi', 'বাংলাদেশি'), p: 'po' },
    { id: 'grill', ...e('Kebab & grill', 'কাবাব ও গ্রিল'), p: 'ch' },
    { id: 'street', ...e('Street food', 'স্ট্রিট ফুড'), p: 'fu' },
    { id: 'asian', ...e('Chinese & Thai', 'চাইনিজ ও থাই'), p: null },
    { id: 'cafe', ...e('Café & bakery', 'ক্যাফে ও বেকারি'), p: 'ph:strawberry_chocolate_cake' },
    { id: 'dessert', ...e('Desserts & drinks', 'মিষ্টি ও পানীয়'), p: null }
  ];
  const types = {
    kacchi: { ...e('Kacchi', 'কাচ্চি'), cu: 'mughlai', p: 'kt', i: 'cooking-pot' },
    biryani: { ...e('Biryani', 'বিরিয়ানি'), cu: 'mughlai', p: 'b4', i: 'bowl-food' },
    tehari: { ...e('Tehari', 'তেহারি'), cu: 'bangladeshi', p: 'b3', i: 'bowl-food' },
    polao: { ...e('Polao', 'পোলাও'), cu: 'bangladeshi', p: 'te', i: 'bowl-steam' },
    kebab: { ...e('Kebab & chap', 'কাবাব ও চাপ'), cu: 'grill', p: 'ch', i: 'fire' },
    curry: { ...e('Curries', 'তরকারি'), cu: 'mughlai', p: 'bw', i: 'bowl-steam' },
    naan: { ...e('Naan', 'নান'), cu: 'mughlai', p: 'na', i: 'grains' },
    fish: { ...e('Fish', 'মাছ'), cu: 'bangladeshi', p: 'fi', i: 'fish-simple' },
    thali: { ...e('Thali & bhorta', 'থালি ও ভর্তা'), cu: 'bangladeshi', p: 'po', i: 'bowl-food' },
    platter: { ...e('Platters', 'প্ল্যাটার'), cu: 'grill', p: 'pl', i: 'fork-knife' },
    fuchka: { ...e('Fuchka & chotpoti', 'ফুচকা ও চটপটি'), cu: 'street', p: 'fu', i: 'bowl-food' },
    snack: { ...e('Snacks', 'নাস্তা'), cu: 'street', p: 'sm', i: 'cookie' },
    chinese: { ...e('Chinese', 'চাইনিজ'), cu: 'asian', p: null, i: 'bowl-steam' },
    thai: { ...e('Thai', 'থাই'), cu: 'asian', p: null, i: 'pepper' },
    tea: { ...e('Tea & coffee', 'চা ও কফি'), cu: 'cafe', p: 'ph:tea_set_01', i: 'coffee' },
    bakery: { ...e('Cakes & bakes', 'কেক ও বেকারি'), cu: 'cafe', p: 'ph:carrot_cake', i: 'cake' },
    dessert: { ...e('Desserts & doi', 'মিষ্টি ও দই'), cu: 'dessert', p: null, i: 'ice-cream' },
    drink: { ...e('Drinks', 'পানীয়'), cu: 'dessert', p: null, i: 'drop' }
  };
  /* what each kind of dish is, in plain words. A dish can carry its own made / ing / side to override this. */
  const about = {
    kacchi: { made: e('Raw mutton marinated in yogurt and spices, layered with half-cooked basmati, sealed with dough and slow-cooked on low heat for about two hours.', 'দই আর মশলায় মাখানো কাঁচা মাটন, আধা সেদ্ধ বাসমতির সাথে স্তরে স্তরে সাজিয়ে, ময়দা দিয়ে মুখ বন্ধ করে প্রায় দুই ঘণ্টা কম আঁচে রান্না।'), ing: [e('Mutton', 'মাটন'), e('Basmati rice', 'বাসমতি চাল'), e('Yogurt', 'দই'), e('Ghee', 'ঘি'), e('Saffron', 'জাফরান'), e('Aloo', 'আলু')], side: e('Borhani and salad', 'বোরহানি আর সালাদ') },
    biryani: { made: e('The meat is cooked in a spiced gravy first, then layered with fragrant rice and finished on steam (dum).', 'মাংস আগে মশলায় রান্না, তারপর সুগন্ধি চালের সাথে স্তর করে দমে শেষ করা।'), ing: [e('Chicken or mutton', 'মুরগি বা মাটন'), e('Basmati rice', 'বাসমতি চাল'), e('Fried onion', 'বেরেস্তা'), e('Ghee', 'ঘি'), e('Whole spices', 'গরম মশলা')], side: e('Borhani and salad', 'বোরহানি আর সালাদ') },
    tehari: { made: e('Small pieces of beef cooked with short-grain rice, mustard oil and green chilli, all in one pot.', 'ছোট টুকরো গরুর মাংস, চিনিগুঁড়া চাল, সরিষার তেল আর কাঁচা মরিচ, এক হাঁড়িতে রান্না।'), ing: [e('Beef', 'গরুর মাংস'), e('Chinigura rice', 'চিনিগুঁড়া চাল'), e('Mustard oil', 'সরিষার তেল'), e('Green chilli', 'কাঁচা মরিচ')], side: e('Salad and green chilli', 'সালাদ আর কাঁচা মরিচ') },
    polao: { made: e('Fragrant short-grain rice cooked in ghee with whole spices, served with slow-cooked meat.', 'ঘি আর গোটা মশলায় রান্না সুগন্ধি চিনিগুঁড়া চালের পোলাও, ধীরে রান্না মাংসের সাথে।'), ing: [e('Chinigura rice', 'চিনিগুঁড়া চাল'), e('Ghee', 'ঘি'), e('Chicken', 'মুরগি'), e('Whole spices', 'গোটা মশলা')], side: e('Salad', 'সালাদ') },
    kebab: { made: e('Meat marinated for hours in yogurt and spices, then grilled over charcoal or cooked flat on a hot iron (chap).', 'মাংস কয়েক ঘণ্টা দই আর মশলায় মেখে কয়লার আগুনে বা গরম তাওয়ায় (চাপ) রান্না।'), ing: [e('Meat', 'মাংস'), e('Yogurt', 'দই'), e('Ginger and garlic', 'আদা-রসুন'), e('Chilli', 'মরিচ'), e('Lemon', 'লেবু')], side: e('Naan or paratha, and salad', 'নান বা পরোটা, আর সালাদ') },
    curry: { made: e('Meat or vegetables simmered slowly in a gravy of onion, tomato and spices.', 'পেঁয়াজ, টমেটো আর মশলার ঝোলে ধীরে রান্না মাংস বা সবজি।'), ing: [e('Onion', 'পেঁয়াজ'), e('Tomato', 'টমেটো'), e('Ginger and garlic', 'আদা-রসুন'), e('Spices', 'মশলা')], side: e('Naan or rice', 'নান বা ভাত') },
    naan: { made: e('Soft dough pressed onto the wall of a hot clay tandoor and baked in about a minute.', 'নরম খামির গরম মাটির তন্দুরের দেয়ালে লাগিয়ে প্রায় এক মিনিটে সেঁকা।'), ing: [e('Flour', 'ময়দা'), e('Yogurt', 'দই'), e('Butter', 'মাখন')], side: e('Curry or kebab', 'তরকারি বা কাবাব') },
    fish: { made: e('Fresh fish rubbed with turmeric and chilli, then fried or cooked in a light gravy.', 'তাজা মাছ হলুদ-মরিচে মেখে ভাজা বা হালকা ঝোলে রান্না।'), ing: [e('Fish', 'মাছ'), e('Turmeric', 'হলুদ'), e('Chilli', 'মরিচ'), e('Mustard oil', 'সরিষার তেল')], side: e('Plain rice', 'সাদা ভাত') },
    thali: { made: e('A full plate of rice, dal and a few bhortas, mashed by hand with mustard oil, onion and chilli.', 'পুরো এক থালা: ভাত, ডাল আর কয়েক রকম ভর্তা, সরিষার তেল, পেঁয়াজ আর মরিচ দিয়ে হাতে মাখা।'), ing: [e('Rice', 'ভাত'), e('Dal', 'ডাল'), e('Bhorta', 'ভর্তা'), e('Mustard oil', 'সরিষার তেল')] },
    platter: { made: e('A mix of grilled items for the table, cooked when you order and served on one board.', 'টেবিলের জন্য কয়েক রকম গ্রিল, অর্ডারের পর রান্না করে এক প্লেটে দেওয়া।'), ing: [e('Kebabs', 'কাবাব'), e('Grilled chicken', 'গ্রিল চিকেন'), e('Naan', 'নান'), e('Sauces', 'সস')], side: e('Naan and dips', 'নান আর সস') },
    fuchka: { made: e('Crisp hollow shells filled with spiced chickpeas and egg, with tamarind water on the side.', 'মচমচে ফাঁপা ফুচকায় মশলাদার ডাবলি আর ডিম, পাশে তেঁতুলের টক।'), ing: [e('Semolina shells', 'সুজির ফুচকা'), e('Chickpeas', 'ডাবলি'), e('Egg', 'ডিম'), e('Tamarind', 'তেঁতুল')], side: e('Tamarind water', 'তেঁতুলের টক') },
    snack: { made: e('Made fresh through the day and fried when you order.', 'সারাদিন তাজা বানানো, অর্ডারের পর ভাজা।'), side: e('Tea', 'চা') },
    chinese: { made: e('Cooked fast in a very hot wok with soy sauce, garlic and vegetables, the Dhaka way.', 'খুব গরম কড়াইয়ে সয়া সস, রসুন আর সবজি দিয়ে দ্রুত রান্না, ঢাকার ধরনে।'), ing: [e('Chicken or prawn', 'মুরগি বা চিংড়ি'), e('Soy sauce', 'সয়া সস'), e('Garlic', 'রসুন'), e('Vegetables', 'সবজি')], side: e('Fried rice or chowmein', 'ফ্রাইড রাইস বা চাউমিন') },
    thai: { made: e('Cooked with lemongrass, lime leaf and chilli for a sour, hot and fragrant taste.', 'লেমনগ্রাস, লেবু পাতা আর মরিচে রান্না, টক-ঝাল আর সুগন্ধি স্বাদ।'), ing: [e('Lemongrass', 'লেমনগ্রাস'), e('Lime leaf', 'লেবু পাতা'), e('Chilli', 'মরিচ'), e('Coconut milk', 'নারকেলের দুধ')], side: e('Steamed rice', 'সাদা ভাত') },
    tea: { made: e('Made when you order.', 'অর্ডারের পর বানানো।') },
    bakery: { made: e('Baked in the cafe kitchen, usually the same morning.', 'ক্যাফের নিজের রান্নাঘরে বানানো, সাধারণত সেদিন সকালেই।') },
    dessert: { made: e('Made in the kitchen each day and served chilled.', 'প্রতিদিন রান্নাঘরে বানানো, ঠান্ডা করে দেওয়া।') },
    drink: { made: e('Made fresh when you order.', 'অর্ডার করলে তাজা বানানো।') }
  };
  Object.keys(about).forEach(k => Object.assign(types[k], about[k]));
  /* the dish shortcuts shown first on Home */
  const cravings = ['kacchi', 'biryani', 'tehari', 'kebab', 'fuchka', 'fish', 'thali', 'naan', 'platter', 'bakery', 'tea', 'polao'];

  const facilities = {
    cabin: { ...e('Family cabins', 'ফ্যামিলি কেবিন'), i: 'users-three' },
    ac: { ...e('Air-conditioned', 'এসি'), i: 'snowflake' },
    parking: { ...e('Parking', 'পার্কিং'), i: 'car' },
    prayer: { ...e('Prayer room', 'নামাজের জায়গা'), i: 'hands-praying' },
    generator: { ...e('Generator backup', 'জেনারেটর'), i: 'lightning' },
    kids: { ...e('Kids corner', 'শিশুদের জায়গা'), i: 'baby' },
    wheelchair: { ...e('Wheelchair access', 'হুইলচেয়ার সুবিধা'), i: 'wheelchair' },
    wifi: { ...e('Free Wi-Fi', 'ফ্রি ওয়াই-ফাই'), i: 'wifi-high' },
    rooftop: { ...e('Rooftop or view', 'রুফটপ / ভিউ'), i: 'buildings' },
    events: { ...e('Event hall', 'অনুষ্ঠানের হল'), i: 'confetti' }
  };
  const occasions = [
    { id: 'family', ...e('Family dinner', 'পরিবারের ডিনার'), i: 'users-three', q: { fac: ['cabin'] } },
    { id: 'friends', ...e('Friends hangout', 'বন্ধুদের আড্ডা'), i: 'chats-circle', q: { maxPP: 600 } },
    { id: 'date', ...e('Date night', 'ডেট নাইট'), i: 'heart', q: { fac: ['rooftop'] } },
    { id: 'office', ...e('Office lunch', 'অফিস লাঞ্চ'), i: 'briefcase', q: { fac: ['ac', 'parking'] } },
    { id: 'birthday', ...e('Birthday or event', 'জন্মদিন / অনুষ্ঠান'), i: 'confetti', q: { fac: ['events'] } },
    { id: 'quick', ...e('Quick bite', 'হালকা নাস্তা'), i: 'clock', q: { maxPP: 300 } },
    { id: 'late', ...e('Late night', 'গভীর রাত'), i: 'moon-stars', q: { late: true } },
    { id: 'tour', ...e('Has a 360° tour', '৩৬০° ট্যুর আছে'), i: 'virtual-reality', q: { media: ['tour'] } }
  ];
  const budgets = [
    { id: 'u300', ...e('Under ৳300', '৳৩০০-এর নিচে'), max: 300 },
    { id: 'u600', ...e('৳300 to ৳600', '৳৩০০ থেকে ৳৬০০'), min: 300, max: 600 },
    { id: 'u1000', ...e('৳600 to ৳1,000', '৳৬০০ থেকে ৳১,০০০'), min: 600, max: 1000 },
    { id: 'o1000', ...e('৳1,000 and up', '৳১,০০০ ও বেশি'), min: 1000 }
  ];

  /* ---------- menu helper ----------
     D(id, type, en, bn, price, photo, portion[en,bn], spice 0-3, extra) */
  const D = (id, type, en, bn, price, p, por, spice, x) => Object.assign({ id, type, name: e(en, bn), price, p: p || null, por: e(por[0], por[1]), spice: spice || 0 }, x || {});
  const pv = (pano, v) => `pv:${pano}:${v}`;

  const restaurants = [
    {
      id: 'shahi-handi', name: e('Shahi Handi House', 'শাহী হান্ডি হাউস'), mono: 'SH', since: 1998,
      area: 'dhanmondi', city: 'dhaka', geo: [23.7547, 90.3741], spot: e('Road 27, Dhanmondi', 'রোড ২৭, ধানমন্ডি'),
      address: e('House 32, Road 27 (old), Dhanmondi, Dhaka 1209', 'বাড়ি ৩২, রোড ২৭ (পুরাতন), ধানমন্ডি, ঢাকা ১২০৯'),
      phone: '+8801700000127', cuisines: ['mughlai', 'bangladeshi'],
      theme: { deep: '#2A0C14', accent: '#E2B04A', font: 'serif' },
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
      deal: { id: 'family-feast', ...e('Family Feast for 4', '৪ জনের ফ্যামিলি ফিস্ট'), desc: e('Kacchi handi, 4 borhani and 4 firni.', 'কাচ্চি হান্ডি, ৪টি বোরহানি আর ৪টি ফিরনি।'), when: e('Sunday to Thursday', 'রবি থেকে বৃহস্পতি'), price: 1790, was: 2190, p: 'hd', week: true }
    },
    {
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
      ]
    },
    {
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
      deal: { id: 'midnight', ...e('After 11pm chap combo', 'রাত ১১টার পর চাপ কম্বো'), desc: e('Beef chap, 2 garlic naan and a lassi.', 'বিফ চাপ, ২টি গার্লিক নান আর একটি লাচ্ছি।'), when: e('Every night after 11pm', 'প্রতি রাতে ১১টার পর'), price: 360, was: 430, p: 'sk' }
    },
    {
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
      deal: { id: 'sunset', ...e('Sunset hour, 20% off drinks', 'সূর্যাস্তের সময় পানীয়তে ২০% ছাড়'), desc: e('All mocktails and juices.', 'সব মকটেল আর জুস।'), when: e('Daily, 5pm to 7pm', 'প্রতিদিন বিকেল ৫টা থেকে ৭টা'), price: 208, was: 260, p: pv('hotel_rooftop_balcony', 'b') }
    },
    {
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
      deal: { id: 'tea-time', ...e('Cake slice and two chai', 'এক টুকরো কেক আর দুই কাপ চা'), desc: e('Any slice with two doodh cha.', 'যেকোনো এক টুকরো কেক, দুই কাপ দুধ চা।'), when: e('Weekdays, 3pm to 6pm', 'কর্মদিবসে বিকেল ৩টা থেকে ৬টা'), price: 260, was: 330, p: 'ph:carrot_cake' }
    },
    {
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
      ]
    },
    {
      id: 'lake-view', name: e('Lake View Café', 'লেক ভিউ ক্যাফে'), mono: 'LV', since: 2017,
      area: 'dhanmondi', city: 'dhaka', geo: [23.7468, 90.3792], spot: e('Dhanmondi Lake, Road 8', 'ধানমন্ডি লেক, রোড ৮'), address: e('Lakeside, Road 8, Dhanmondi, Dhaka 1205', 'লেকের পাড়, রোড ৮, ধানমন্ডি, ঢাকা ১২০৫'),
      phone: '+8801700000711', cuisines: ['street', 'cafe'],
      theme: { deep: '#0A2A3E', accent: '#8FD0F2', font: 'sans' },
      tagline: e('Doi fuchka by the lake, best just before sunset.', 'লেকের পাড়ে দই ফুচকা, সূর্যাস্তের ঠিক আগে সবচেয়ে ভালো।'),
      story: e('Open-air tables under the trees, with a covered section for the rain.', 'গাছের নিচে খোলা টেবিল, বৃষ্টির জন্য ছাউনি দেওয়া অংশও আছে।'),
      rating: 4.1, reviews: 154, verified: 77, ppl: [200, 450], hours: ['09:00', '22:30'],
      vat: 5, service: 0, seats: 50, fac: ['wifi', 'rooftop'], pay: ['Cash', 'bKash'], plan: 'starter', checked: 6,
      hero: ['ex2', 'i3', 'fu'],
      gallery: { inside: ['i3'], outside: ['ex2'], kitchen: [], food: ['fu'] },
      signature: ['doi-fuchka', 'lv-chotpoti', 'lv-coffee'],
      cats: [{ id: 'street', ...e('Fuchka & chaat', 'ফুচকা ও চাট') }, { id: 'drink', ...e('Drinks', 'পানীয়') }],
      menu: [
        D('doi-fuchka', 'fuchka', 'Doi Fuchka', 'দই ফুচকা', 160, 'fu', ['8 pieces', '৮ পিস'], 1, { cat: 'street', best: true, veg: true, desc: e('Crisp puri filled with spiced potato, tamarind and sweet doi.', 'মচমচে পুরিতে মশলা আলু, তেঁতুল আর মিষ্টি দই।') }),
        D('lv-fuchka', 'fuchka', 'Fuchka', 'ফুচকা', 120, null, ['8 pieces', '৮ পিস'], 2, { cat: 'street', veg: true }),
        D('lv-chotpoti', 'fuchka', 'Chotpoti', 'চটপটি', 130, null, ['1 plate', '১ প্লেট'], 2, { cat: 'street' }),
        D('lv-lemonade', 'drink', 'Mint Lemonade', 'মিন্ট লেমনেড', 110, null, ['1 glass', '১ গ্লাস'], 0, { cat: 'drink', veg: true }),
        D('lv-coffee', 'tea', 'Café Latte', 'ক্যাফে লাতে', 190, null, ['1 cup', '১ কাপ'], 0, { cat: 'drink', veg: true })
      ]
    },
    {
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
      deal: { id: 'thai-lunch', ...e('Weekday Thai lunch, 15% off', 'কর্মদিবসে থাই লাঞ্চে ১৫% ছাড়'), desc: e('Thai Platter for 3 at lunch.', 'দুপুরে ৩ জনের থাই প্ল্যাটার।'), when: e('Sunday to Thursday, 12pm to 4pm', 'রবি থেকে বৃহস্পতি, দুপুর ১২টা থেকে ৪টা'), price: 1180, was: 1390, p: pv('lythwood_terrace', 'a') }
    },
    {
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
      deal: { id: 'kacchi-doi', ...e('Kacchi and doi combo', 'কাচ্চি ও দই কম্বো'), desc: e('Bogura Kacchi with a small pot of doi.', 'বগুড়ার কাচ্চি আর এক সরা দই।'), when: e('Every day', 'প্রতিদিন'), price: 380, was: 420, p: 'bp' }
    },
    {
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
      ]
    },
    {
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
      ]
    },
    {
      id: 'satmatha-fuchka', name: e('Satmatha Fuchka Corner', 'সাতমাথা ফুচকা কর্নার'), mono: 'SF', since: 2014,
      area: 'satmatha', city: 'bogura', geo: [24.8478, 89.3727], spot: e('Satmatha, Bogura', 'সাতমাথা, বগুড়া'), address: e('Beside the clock tower, Satmatha, Bogura 5800', 'ঘড়ির টাওয়ারের পাশে, সাতমাথা, বগুড়া ৫৮০০'),
      phone: '+8801700001242', cuisines: ['street'],
      theme: { deep: '#2D0F2A', accent: '#FF9BB8', font: 'sans' },
      tagline: e('Bogura’s evening fuchka stop, with chotpoti on the side.', 'বগুড়ার সন্ধ্যার ফুচকার ঠিকানা, পাশে চটপটি।'),
      story: e('Twenty-four stools, one counter and the tamarind water everyone talks about.', 'চব্বিশটা টুল, একটা কাউন্টার আর সবার মুখে মুখে তেঁতুল পানি।'),
      rating: 4.3, reviews: 64, verified: 41, ppl: [100, 220], hours: ['15:00', '22:00'],
      vat: 0, service: 0, seats: 24, fac: [], pay: ['Cash', 'bKash'], plan: 'starter', checked: 5,
      hero: ['tb'],
      gallery: { inside: [], outside: [], kitchen: [], food: ['tb'] },
      signature: ['sf-chotpoti', 'sf-fuchka', 'sf-jhalmuri'],
      cats: [{ id: 'street', ...e('Street food', 'স্ট্রিট ফুড') }],
      menu: [
        D('sf-chotpoti', 'fuchka', 'Chotpoti', 'চটপটি', 70, 'tb', ['1 plate', '১ প্লেট'], 2, { cat: 'street', best: true }),
        D('sf-fuchka', 'fuchka', 'Fuchka', 'ফুচকা', 80, null, ['10 pieces', '১০ পিস'], 2, { cat: 'street', veg: true }),
        D('sf-doi', 'fuchka', 'Doi Fuchka', 'দই ফুচকা', 120, null, ['8 pieces', '৮ পিস'], 1, { cat: 'street', veg: true }),
        D('sf-jhalmuri', 'snack', 'Jhalmuri', 'ঝালমুড়ি', 40, null, ['1 cone', '১ ঠোঙা'], 2, { cat: 'street', veg: true })
      ]
    }
  ];

  /* ---------- reviews ---------- */
  const R = (r, who, st, vf, when, t, ord, x) => Object.assign({ r, who, st, vf, when, t, ord: ord || [] }, x || {});
  const ago = (en, bn) => e(en, bn);
  const reviews = [
    R('shahi-handi', 'Tanvir Ahmed', 5, true, ago('2 days ago', '২ দিন আগে'), 'কাচ্চির মাংস একদম নরম, আলুটাও ঠিকঠাক। ৪ জন গিয়েছিলাম, বিল এসেছে ১,৯৮০ টাকা, এখানে যা দেখেছিলাম প্রায় তাই।', ['Mutton Kacchi', 'Borhani'], { pics: ['kt'] }),
    R('shahi-handi', 'Nusrat Jahan', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'Took my parents for their anniversary. The family lounge looked exactly like the 360 tour, quiet and properly cool. Rezala was a little sweet for me.', ['Kacchi Handi for 4', 'Mutton Rezala'], { reply: e('Thank you, Nusrat. We have passed your note on the rezala to our chef.', 'ধন্যবাদ, নুসরাত। রেজালা নিয়ে আপনার মতামত আমাদের শেফকে জানানো হয়েছে।') }),
    R('shahi-handi', 'Rafiq Hasan', 3, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'Friday te 40 minute wait korte hoyeche. Khabar valo, kintu weekend e age theke call kore jaben.', ['Chicken Tikka Biryani']),
    R('shahi-handi', 'Sadia Karim', 5, true, ago('3 weeks ago', '৩ সপ্তাহ আগে'), 'Morog polao tastes like a proper wedding. Parking was easy on a weekday evening.', ['Morog Polao', 'Butter Naan']),
    R('nodir-paar', 'Farhana Akter', 5, true, ago('4 days ago', '৪ দিন আগে'), 'ভর্তার থালাটা অসাধারণ, প্রতিটা ভর্তার স্বাদ আলাদা। দাম একটু বেশি, তবে মাছ একদম তাজা।', ['Bhorta Bhaat Thali', 'Rupchanda Fry']),
    R('nodir-paar', 'Imran Chowdhury', 4, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'Good for taking guests from abroad. The veranda is lovely in winter. Service charge is 5% on top of 10% VAT, so check the bill estimate first.', ['Shorshe Ilish']),
    R('kabab-ghor', 'Arif Hossain', 5, true, ago('1 day ago', '১ দিন আগে'), 'Raat 12 tay gesilam, tikka ekdom gorom gorom. Garlic naan must.', ['Chicken Tikka Skewers', 'Garlic Naan']),
    R('kabab-ghor', 'Mehnaz Rahman', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'Smoky, loud, fun. Not the place for a quiet dinner, perfect for friends.', ['Beef Seekh with Fries']),
    R('kabab-ghor', 'Shakil Ahmed', 4, false, ago('3 weeks ago', '৩ সপ্তাহ আগে'), 'চাপটা ভালো, তবে শুক্রবার রাতে জায়গা পাওয়া কঠিন।', ['Beef Chap']),
    R('kathgolap', 'Tahsin Islam', 5, true, ago('5 days ago', '৫ দিন আগে'), 'Booked a rail table for sunset after seeing the 360 view. Worth it. BBQ platter easily feeds four.', ['BBQ Platter for 4']),
    R('kathgolap', 'Ruma Begum', 3, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'সুন্দর জায়গা, কিন্তু ভ্যাট আর সার্ভিস চার্জ মিলিয়ে ২০%। আগে থেকে হিসাব করে যাওয়া ভালো।', ['Rooftop Kacchi', 'Tom Yum Soup']),
    R('cha-adda', 'Nabila Huq', 5, true, ago('3 days ago', '৩ দিন আগে'), 'Saw the strawberry cake in 3D on my table at home, ordered it for my sister’s birthday. It looked exactly the same.', ['Strawberry Chocolate Cake']),
    R('cha-adda', 'Sabbir Rahman', 5, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'বিকেলের আড্ডার জন্য সেরা। মসলা চা এক পটে দুই কাপের বেশি হয়।', ['Masala Chai, pot for two', 'Shingara']),
    R('cha-adda', 'Ayesha Siddiqua', 4, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'Croissant was flaky and fresh at 9am. Wi-Fi is fast enough to work from.', ['Butter Croissant']),
    R('mirpur-bawarchi', 'Kamrul Islam', 4, true, ago('2 days ago', '২ দিন আগে'), 'Tehari te jhal ektu beshi, kintu 230 takay eto valo tehari kom pawa jay.', ['Beef Tehari', 'Borhani']),
    R('mirpur-bawarchi', 'Shirin Akhter', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'বাচ্চাদের নিয়ে গিয়েছিলাম, খেলার জায়গাটা ছোট কিন্তু পরিষ্কার।', ['Chicken Polao']),
    R('lake-view', 'Rakib Hasan', 4, true, ago('6 days ago', '৬ দিন আগে'), 'Doi fuchka at sunset by the lake is the whole point. Gets crowded after 6.', ['Doi Fuchka']),
    R('garden-rooftop', 'Mitu Das', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'Green curry was the real thing. Kids loved the lawn.', ['Thai Green Curry']),
    R('mahasthan-bhoj', 'Habibur Rahman', 5, true, ago('3 days ago', '৩ দিন আগে'), 'ঢাকা থেকে ফেরার পথে থেমেছিলাম। মাটির হাঁড়ির কাচ্চি আর দই, দুটোই দারুণ। কেবিন পরিষ্কার।', ['Bogura Kacchi', 'Bogura Doi']),
    R('mahasthan-bhoj', 'Jannatul Ferdous', 5, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'Amar bhai er biye r agey ekhane family dinner korechilam, 14 jon. Event hall ta boro.', ['Polao and Roast Set']),
    R('shamiana', 'Anika Tabassum', 4, true, ago('1 week ago', '১ সপ্তাহ আগে'), 'The brass thali feels special. Veg thali is filling and good value at lunch.', ['Seven-bowl Veg Thali']),
    R('nawabpur-kacchi', 'Mahfuz Alam', 5, true, ago('4 days ago', '৪ দিন আগে'), 'রাত ৮টায় গিয়ে শেষ কয়েক প্লেট পেয়েছি। স্বাদ আগের মতোই।', ['Kacchi Platter', 'Borhani']),
    R('nawabpur-kacchi', 'Tasnim Sultana', 4, true, ago('2 weeks ago', '২ সপ্তাহ আগে'), 'No AC and very busy, but the kacchi is worth it. Go before 8pm.', ['Kacchi Platter']),
    R('satmatha-fuchka', 'Rashed Karim', 4, true, ago('5 days ago', '৫ দিন আগে'), 'Tetul pani ta ashadharon. 80 takay 10 ta fuchka, Bogura te best.', ['Fuchka'])
  ];

  return { P, FILM, cities, areas, soon, cuisines, types, cravings, facilities, occasions, budgets, restaurants, reviews, updated: e('14 Nov 2026', '১৪ নভেম্বর ২০২৬') };
})();
