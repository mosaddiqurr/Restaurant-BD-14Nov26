/* Shared data for every page: places, dish types, facilities, budgets, and the helpers restaurants use.
   The restaurants themselves are in restaurants/<name>/restaurant.js.
   Demo data. Every restaurant, review and price here is fictional.
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
  /* the khabo team can change "About this dish" text in the admin panel (Site text) */
  let siteSaved = null; try { siteSaved = (JSON.parse(localStorage.getItem('khabo.panel.v1') || 'null') || {}).site; } catch (err) { siteSaved = null; }
  K.ABOUT0 = JSON.parse(JSON.stringify(about)); /* the defaults, so the admin panel can put a change back */
  if (siteSaved && siteSaved.about) Object.keys(siteSaved.about).forEach(k => { if (about[k]) Object.assign(about[k], siteSaved.about[k]); });
  /* and any interface text: { key: { en, bn } } over code/i18n.js */
  if (window.K && K.T && !K.T0) K.T0 = { en: Object.assign({}, K.T.en), bn: Object.assign({}, K.T.bn) };
  if (siteSaved && siteSaved.text && window.K && K.T) Object.keys(siteSaved.text).forEach(k => { const v = siteSaved.text[k]; if (v.en) K.T.en[k] = v.en; if (v.bn) K.T.bn[k] = v.bn; });
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

  const R = (r, who, st, vf, when, t, ord, x) => Object.assign({ r, who, st, vf, when, t, ord: ord || [] }, x || {});
  const ago = (en, bn) => e(en, bn);

  /* ---------- page colours ----------
     Restaurants pick one of these pairs: a deep background and a warm accent. Every pair is built the same way
     (dark enough for white text, accent bright enough to read on it), so no page feels cut off from khabo.
     Only the khabo team can set other colours. */
  const palettes = [
    { id: 'saffron', deep: '#2A0C14', accent: '#E2B04A', ...e('Saffron night', 'জাফরান রাত') },
    { id: 'indigo', deep: '#14192B', accent: '#F4D77E', ...e('Indigo and gold', 'নীল ও সোনালি') },
    { id: 'forest', deep: '#13281C', accent: '#E9A23B', ...e('Forest marigold', 'বন ও গাঁদা') },
    { id: 'garden', deep: '#0F2619', accent: '#A5DB7E', ...e('Garden', 'বাগান') },
    { id: 'ember', deep: '#1A1110', accent: '#FF8A4C', ...e('Ember', 'অঙ্গার') },
    { id: 'river', deep: '#0A2A3E', accent: '#8FD0F2', ...e('River', 'নদী') },
    { id: 'clay', deep: '#3A1606', accent: '#E8955A', ...e('Terracotta', 'পোড়ামাটি') },
    { id: 'chili', deep: '#3A120A', accent: '#F2B33D', ...e('Chili and turmeric', 'মরিচ ও হলুদ') },
    { id: 'cocoa', deep: '#1E140C', accent: '#F28C4B', ...e('Cocoa', 'কোকো') },
    { id: 'teal', deep: '#062B33', accent: '#86D3C6', ...e('Lagoon', 'লেগুন') },
    { id: 'rose', deep: '#2D0F2A', accent: '#FF9BB8', ...e('Rose', 'গোলাপ') },
    { id: 'plum', deep: '#2A1636', accent: '#F2A93B', ...e('Plum and amber', 'বেগুনি ও অ্যাম্বার') }
  ];
  /* social networks a restaurant can link; `host` is what a real link must contain */
  const socials = {
    facebook: { en: 'Facebook', host: /(^|\.)(facebook|fb)\.com$/, base: 'https://facebook.com/', i: 'facebook-logo' },
    instagram: { en: 'Instagram', host: /(^|\.)instagram\.com$/, base: 'https://instagram.com/', i: 'instagram-logo' },
    tiktok: { en: 'TikTok', host: /(^|\.)tiktok\.com$/, base: 'https://tiktok.com/@', i: 'tiktok-logo' },
    youtube: { en: 'YouTube', host: /(^|\.)(youtube\.com|youtu\.be)$/, base: 'https://youtube.com/@', i: 'youtube-logo' }
  };

  /* ---------- restaurants ----------
     Each restaurant lives in its own folder: restaurants/<name>/restaurant.js (listed in restaurants/list.js).
     Those files run first and hand over a recipe; here each one is cooked with the shared helpers. */
  const restaurants = [], reviews = [];
  (window.KHABO_RESTAURANTS || []).forEach(make => {
    const r = make({ e, D, pv, P, FILM, R, ago });
    reviews.push(...(r.reviewList || [])); delete r.reviewList;
    restaurants.push(r);
  });

  /* ---------- changes made in the admin and restaurant panels ----------
     Prototype only: panel/store.js saves them in this browser under "khabo.panel.v1".
     A changed restaurant replaces the original; new ones are added; deleted and hidden ones leave the site.
     The panels themselves (window.KHABO_PANEL) still see hidden restaurants so they can switch them back on. */
  K.revKey = v => `${v.r}|${v.who}|${String(v.t).slice(0, 24)}`;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('khabo.panel.v1') || 'null'); } catch (err) { saved = null; }
  if (saved) {
    Object.keys(saved.rest || {}).forEach(id => {
      const i = restaurants.findIndex(r => r.id === id);
      /* a copy saved before a field existed (e.g. events) keeps that field from the restaurant's file */
      if (i >= 0) { const sv = saved.rest[id]; if (!('events' in sv) && restaurants[i].events) sv.events = restaurants[i].events; restaurants[i] = sv; } else restaurants.push(saved.rest[id]);
    });
    for (let i = restaurants.length - 1; i >= 0; i--) {
      const r = restaurants[i];
      if ((saved.gone || {})[r.id] || (r.hidden && !window.KHABO_PANEL)) restaurants.splice(i, 1);
    }
    reviews.forEach(v => { const s = (saved.reviews || {})[K.revKey(v)]; if (s) { v.hidden = !!s.hidden; if (s.reply) v.reply = s.reply; } });
  }
  /* deals: a restaurant can run several. r.deals is the list, in the order the restaurant chose (paused ones have off: true).
     r.deal is the headline one (the deal of the week first) used by cards, filters and the home page. */
  /* the kind of deal the owner picks. `ring` runs round the gold seal (English only: Bangla letters break on a curve) */
  K.DEAL_TAGS = {
    offer: { en: 'Special offer', bn: 'বিশেষ অফার', ring: 'SPECIAL OFFER' },
    limited: { en: 'Limited time', bn: 'সীমিত সময়ের অফার', ring: 'LIMITED TIME' },
    lunch: { en: 'Lunch deal', bn: 'দুপুরের অফার', ring: 'LUNCH DEAL' },
    family: { en: 'Family deal', bn: 'ফ্যামিলি অফার', ring: 'FAMILY DEAL' },
    weekend: { en: 'Weekend deal', bn: 'উইকেন্ড অফার', ring: 'WEEKEND DEAL' },
    night: { en: 'Late night deal', bn: 'রাতের অফার', ring: 'LATE NIGHT' },
    new: { en: 'New offer', bn: 'নতুন অফার', ring: 'NEW OFFER' },
    festive: { en: 'Festival special', bn: 'উৎসবের অফার', ring: 'FESTIVAL SPECIAL' }
  };
  /* a deal can have a first and a last day (YYYY-MM-DD). Outside those days it hides by itself. */
  K.today = () => { const n = new Date(); return new Date(n.getTime() - n.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  K.dealState = d => { const t = K.today(); return d.off ? 'off' : d.from && d.from > t ? 'soon' : d.to && d.to < t ? 'ended' : 'live'; };
  K.dealsOf = r => (r.deals || []).filter(d => K.dealState(d) === 'live');
  K.syncDeal = r => {
    if (!r.deals) r.deals = [r.deal, r.dealOff && Object.assign({}, r.dealOff, { off: true })].filter(Boolean);
    delete r.dealOff;
    const live = K.dealsOf(r);
    r.deal = live.find(d => d.week) || live[0];
    if (!r.deal) delete r.deal;
  };
  restaurants.forEach(K.syncDeal);
  /* "prices checked X days ago" counts from the last time the restaurant confirmed or changed a price */
  restaurants.forEach(r => { if (r.checkedAt) r.checked = Math.max(0, Math.floor((Date.now() - r.checkedAt) / 864e5)); });

  /* each 360 room's files sit in the folder of the restaurant that uses it */
  const root = (document.currentScript && document.currentScript.src || '').replace(/data\/common\.js.*$/, '');
  const panoHome = {};
  restaurants.forEach(r => {
    (r.tour || []).forEach(t => { panoHome[t.pano] = r.id; if (t.day) panoHome[t.day] = r.id; });
    JSON.stringify(r.gallery || {}).replace(/pv:([\w-]+):/g, (m, p) => { panoHome[p] = panoHome[p] || r.id; });
  });
  /* 360 rooms the khabo team uploaded in the admin panel carry their picture with them (room.img) */
  K.panoUp = {};
  restaurants.forEach(r => (r.tour || []).forEach(t => { if (t.img) K.panoUp[t.pano] = { img: t.img, thumb: t.thumb || t.img }; }));
  /* table menu choices (what guests see after scanning): r.qr.layout and r.qr.header */
  K.TM_LAYOUTS = { list: 'List with photos', photos: 'Photo grid', cards: 'Big photos', compact: 'Text only' };
  K.TM_HEADERS = { photo: 'Cover photo', colour: 'Your colour' };
  K.TM_LAYOUTS.classic = 'Classic menu';
  /* colour themes for the table menu. 'auto' follows the phone (light or dark) */
  K.TM_THEMES = { auto: 'Light', paper: 'Warm paper', night: 'Dark', brand: 'Your colour' };
  /* a file in a restaurant's own folder, e.g. its logo */
  K.restFile = (r, f) => `${root}restaurants/${r.id}/${f}`;
  K.panoDir = pano => `${root}restaurants/${panoHome[pano]}/360/`;

  return { P, FILM, palettes, socials, cities, areas, soon, cuisines, types, cravings, facilities, occasions, budgets, restaurants, reviews, updated: e('14 Nov 2026', '১৪ নভেম্বর ২০২৬') };
})();
