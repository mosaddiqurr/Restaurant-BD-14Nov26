/* khabo AI (demo engine). Reads Bangla, English and Banglish; answers only from K.data; says so when it cannot.
   In production the same contract is served by the Claude API with these restaurants as the only source. */
(function () {
  const K = window.K, D = K.data, t = K.t, L = K.L, ico = K.ico, $ = K.$, $$ = K.$$;

  /* ---------------- understanding ---------------- */
  const A = {
    area: {
      dhanmondi: ['dhanmondi', 'dhanmondhi', 'ধানমন্ডি'], gulshan: ['gulshan', 'গুলশান'], banani: ['banani', 'বনানী'], mirpur: ['mirpur', 'মিরপুর'],
      mohammadpur: ['mohammadpur', 'mohammodpur', 'mohammedpur', 'মোহাম্মদপুর'], uttara: ['uttara', 'উত্তরা'],
      'old-dhaka': ['old dhaka', 'puran dhaka', 'puran dhaka', 'puraan dhaka', 'nawabpur', 'পুরান ঢাকা', 'পুরান', 'নবাবপুর'],
      jaleshwaritola: ['jaleshwaritola', 'জলেশ্বরীতলা'], satmatha: ['satmatha', 'সাতমাথা']
    },
    city: { dhaka: ['dhaka', 'ঢাকা'], bogura: ['bogura', 'bogra', 'বগুড়া', 'বগুরা'] },
    nope: { bashundhara: ['bashundhara', 'বসুন্ধরা'], chattogram: ['chattogram', 'chittagong', 'ctg', 'চট্টগ্রাম'], sylhet: ['sylhet', 'সিলেট'], khulna: ['khulna', 'খুলনা'], rajshahi: ['rajshahi', 'রাজশাহী'], badda: ['badda', 'বাড্ডা'], motijheel: ['motijheel', 'মতিঝিল'] },
    type: {
      kacchi: ['kacchi', 'kachchi', 'kachi', 'kacci', 'কাচ্চি'], biryani: ['biryani', 'biriyani', 'birani', 'biriani', 'বিরিয়ানি', 'বিরানি'], tehari: ['tehari', 'তেহারি'],
      polao: ['polao', 'pulao', 'polau', 'পোলাও'], kebab: ['kebab', 'kabab', 'kabob', 'chap', 'tikka', 'seekh', 'sheek', 'grill', 'bbq', 'কাবাব', 'চাপ', 'টিক্কা', 'গ্রিল'],
      fish: ['fish', 'mach', 'maach', 'ilish', 'hilsa', 'rupchanda', 'chingri', 'prawn', 'মাছ', 'ইলিশ', 'রূপচাঁদা', 'চিংড়ি'],
      thali: ['thali', 'bhorta', 'vorta', 'bharta', 'khichuri', 'থালি', 'ভর্তা', 'খিচুড়ি'], fuchka: ['fuchka', 'phuchka', 'puchka', 'fuska', 'chotpoti', 'chatpati', 'ফুচকা', 'চটপটি'],
      naan: ['naan', 'নান'], platter: ['platter', 'প্ল্যাটার'], chinese: ['chinese', 'fried rice', 'chowmein', 'চাইনিজ'], thai: ['thai', 'tom yum', 'green curry', 'থাই'],
      tea: ['tea', 'cha', 'chai', 'coffee', 'চা', 'কফি'], bakery: ['cake', 'croissant', 'pastry', 'bakery', 'কেক'], dessert: ['doi', 'mishti', 'dessert', 'sweet', 'firni', 'payesh', 'দই', 'মিষ্টি', 'ফিরনি', 'পায়েস'],
      curry: ['curry', 'rezala', 'bhuna', 'roast', 'রেজালা', 'ভুনা', 'রোস্ট'], snack: ['shingara', 'singara', 'samosa', 'jhalmuri', 'শিঙাড়া', 'ঝালমুড়ি']
    },
    fac: {
      cabin: ['cabin', 'private room', 'কেবিন'], rooftop: ['rooftop', 'roof top', 'roof', 'chad', 'chhad', 'view', 'ছাদ', 'রুফটপ', 'ভিউ'], parking: ['parking', 'park', 'পার্কিং'],
      kids: ['kid', 'kids', 'child', 'children', 'baccha', 'bacca', 'বাচ্চা', 'শিশু'], prayer: ['prayer', 'namaz', 'namaj', 'নামাজ'], ac: ['ac', 'a/c', 'air con', 'এসি'],
      wifi: ['wifi', 'wi-fi', 'ওয়াইফাই'], wheelchair: ['wheelchair', 'হুইলচেয়ার'], events: ['event', 'birthday', 'party', 'anniversary', 'jonmodin', 'biye', 'জন্মদিন', 'অনুষ্ঠান', 'পার্টি']
    },
    family: ['family', 'poribar', 'paribar', 'parents', 'abbu', 'ammu', 'পরিবার', 'ফ্যামিলি', 'বাবা-মা'],
    open: ['open now', 'ekhon khola', 'khola ache', 'এখন খোলা', 'খোলা আছে'], late: ['late', 'midnight', 'raat', 'রাতে', 'গভীর রাত', 'মাঝরাত'],
    cheap: ['cheap', 'cheapest', 'lowest', 'sasta', 'shosta', 'kom dam', 'kom dame', 'সস্তা', 'কম দাম', 'কম দামে'], best: ['best', 'top', 'shera', 'sera', 'সেরা'],
    cap: ['under', 'below', 'within', 'less than', 'max', 'moddhe', 'modhye', 'niche', 'er kom', 'মধ্যে', 'নিচে', 'ভেতরে', 'কমে'],
    perHead: ['per person', 'per head', 'each', 'jon proti', 'jonpoti', 'prottek', 'জনপ্রতি', 'প্রতিজন', 'মাথাপিছু'],
    peopleW: ['jon', 'jn', 'people', 'persons', 'person', 'pax', 'guests', 'members', 'of us', 'জন', 'জনের'],
    moneyW: ['tk', 'taka', 'bdt', 'টাকা', '৳'],
    banglish: ['jon', 'taka', 'er', 'moddhe', 'kothay', 'valo', 'bhalo', 'khabo', 'khete', 'jabo', 'ache', 'koto', 'kon', 'amra', 'ami', 'dorkar', 'chai', 'niye', 'sathe', 'jonno', 'kom', 'beshi', 'ekta', 'kichu', 'hobe', 'jaiga', 'jayga', 'te', 'diye', 'khub', 'shob']
  };
  const NUMW = { 'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'নয়': 9, 'দশ': 10, 'বারো': 12, ek: 1, dui: 2, tin: 3, char: 4, pach: 5, panch: 5, choy: 6, chhoy: 6, sat: 7, shat: 7, aat: 8, noy: 9, dosh: 10, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };
  const BD = '০১২৩৪৫৬৭৮৯';
  const lat = s => /^[a-z/ -]+$/.test(s);
  const has = (txt, w) => lat(w) ? new RegExp(`(^|[^a-z])${w.replace(/[/]/g, '\\/')}([^a-z]|$)`).test(txt) : txt.includes(w);
  const pick = (txt, map) => { for (const [k, ws] of Object.entries(map)) if (ws.some(w => has(txt, w))) return k; return null; };
  const pickAll = (txt, map) => Object.entries(map).filter(([k, ws]) => ws.some(w => has(txt, w))).map(([k]) => k);
  const any = (txt, ws) => ws.some(w => has(txt, w));

  function parse(raw) {
    const lang = /[ঀ-৿]/.test(raw) ? 'bn' : (A.banglish.filter(w => has(raw.toLowerCase(), w)).length >= 1 && !/\b(the|with|for|and|near|need|want|under)\b/i.test(raw) ? 'bl' : 'en');
    let s = ' ' + String(raw).toLowerCase().replace(/[০-৯]/g, d => BD.indexOf(d)).replace(/(\d),(\d)/g, '$1$2') + ' ';
    s = s.replace(/আড়াই হাজার|arai hajar|arai hazar/g, '2500').replace(/দেড় হাজার|der hajar|dedh hajar/g, '1500')
      .replace(/(\d+(?:\.\d+)?)\s*(k(?![a-z])|হাজার|hajar|hazar|thousand)/g, (m, n) => String(Math.round(parseFloat(n) * 1000)));
    for (const [w, n] of Object.entries(NUMW)) { const re = lat(w) ? new RegExp(`(^|[^a-z])${w}(?=\\s*(jon|jn|people|persons|of us|guests|জন))`, 'g') : new RegExp(`${w}(?=\\s*জন)`, 'g'); s = s.replace(re, (m, a) => (lat(w) ? a : '') + n); }
    const p = { lang, raw };
    const nums = [...s.matchAll(/(৳\s*)?(\d+(?:\.\d+)?)\s*([a-zঀ-৿/-]*)/g)].map(m => ({ v: parseFloat(m[2]), pre: !!m[1], post: m[3] || '', i: m.index }));
    for (const n of nums) {
      const after = s.slice(n.i, n.i + 18);
      const isPeople = A.peopleW.some(w => after.includes(' ' + w) || n.post === w || n.post.startsWith(w)) || /family of\s*$|for\s*$|amra\s*$|আমরা\s*$/.test(s.slice(Math.max(0, n.i - 12), n.i)) && n.v <= 30;
      if (isPeople && n.v >= 1 && n.v <= 60 && !p.people) { p.people = n.v; continue; }
      const money = n.pre || A.moneyW.some(w => n.post.startsWith(w) || after.includes(w)) || n.v >= 100;
      if (money && !p._money) p._money = n.v;
    }
    const ctx = s.slice(0, 400);
    const capped = any(ctx, A.cap);
    if (p._money) {
      if (any(ctx, A.perHead)) p.budgetPP = p._money;
      else if (p.people || p._money >= 900) p.budget = p._money;
      else p.maxDish = p._money;
    }
    if (p.budgetPP && p.people) p.budget = p.budgetPP * p.people;
    delete p._money; p.capped = capped;
    p.area = pick(s, A.area); p.city = p.area ? K.areaOf(p.area).city : pick(s, A.city);
    p.nope = !p.area && pick(s, A.nope);
    p.type = pick(s, A.type); p.fac = pickAll(s, A.fac);
    p.family = any(s, A.family); p.open = any(s, A.open); p.late = any(s, A.late); p.cheap = any(s, A.cheap); p.best = any(s, A.best);
    if (p.family && !p.people) p.people = 4;
    const rm = D.restaurants.find(r => s.includes(r.name.en.toLowerCase()) || s.includes(r.name.bn));
    if (rm) p.r = rm.id;
    return p;
  }
  K.nlp = { parse };

  /* ---------------- planning from real menus ---------------- */
  const MAIN = ['kacchi', 'biryani', 'tehari', 'polao', 'thali', 'fish', 'thai', 'chinese', 'platter', 'kebab', 'curry', 'fuchka', 'bakery'];
  const SIDE = ['drink', 'tea', 'dessert', 'naan', 'snack'];
  function candidates(p) {
    let rs = D.restaurants.slice();
    if (p.area) rs = rs.filter(r => r.area === p.area); else if (p.city) rs = rs.filter(r => r.city === p.city);
    const hard = p.fac.filter(f => f !== 'ac');
    if (hard.length) rs = rs.filter(r => hard.every(f => r.fac.includes(f)));
    if (p.open) rs = rs.filter(r => K.openState(r).open);
    if (p.late) rs = rs.filter(r => K.isLate(r));
    if (p.type) rs = rs.filter(r => r.menu.some(d => d.type === p.type));
    return rs;
  }
  function meal(r, p) {
    const n = p.people || 2;
    const items = {};
    let mains = r.menu.filter(d => (p.type ? d.type === p.type : MAIN.includes(d.type)) && !d.share);
    if (!mains.length) mains = r.menu.filter(d => MAIN.includes(d.type) || d.type === p.type);
    if (!mains.length) return null;
    mains.sort((a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0) || (p.cheap ? a.price - b.price : 0));
    const share = r.menu.find(d => d.share && (!p.type || d.type === p.type) && n >= d.share - 1);
    const fac = 1 + (r.vat + r.service) / 100;
    const cost = () => Object.entries(items).reduce((s, [id, q]) => s + r.menu.find(d => d.id === id).price * q, 0) * fac;
    let usedShare = false;
    const tryMain = (m, sh) => { for (const k in items) delete items[k]; usedShare = false; if (sh && share && n >= share.share) { const u = Math.floor(n / share.share); items[share.id] = u; const rest = n - u * share.share; if (rest) items[m.id] = rest; usedShare = true; } else items[m.id] = n; };
    let chosen = null;
    const ordered = p.budget ? mains.slice().sort((a, b) => b.price - a.price) : mains;
    for (const sh of [true, false]) { for (const m of ordered) { tryMain(m, sh); if (!p.budget || cost() <= p.budget) { chosen = m; break; } } if (chosen) break; }
    if (!chosen) { const cheapest = mains.slice().sort((a, b) => a.price - b.price)[0]; tryMain(cheapest, false); chosen = cheapest; }
    if (mains.length > 1 && n >= 3 && !usedShare) { // variety: second main for groups when budget allows
      const alt = mains.find(d => d.id !== chosen.id && d.type === chosen.type) || mains.find(d => d.id !== chosen.id);
      if (alt) { const half = Math.floor(n / 2); items[chosen.id] -= half; items[alt.id] = half; if (p.budget && cost() > p.budget) { items[chosen.id] += half; delete items[alt.id]; } }
    }
    const rice = ['kacchi', 'biryani', 'tehari', 'polao', 'thali', 'fish'].includes(chosen.type);
    const rank = { drink: 0, dessert: 1, tea: 2, naan: 3, snack: 4 };
    const sides = r.menu.filter(d => SIDE.includes(d.type) && !(rice && d.type === 'naan')).sort((a, b) => rank[a.type] - rank[b.type] || a.price - b.price);
    for (const sd of sides) {
      if (Object.keys(items).length >= 4) break;
      const q = sd.type === 'naan' ? Math.ceil(n / 2) * 2 : n;
      items[sd.id] = (items[sd.id] || 0) + q;
      if (p.budget && cost() > p.budget) { items[sd.id] -= q; if (!items[sd.id]) delete items[sd.id]; }
      else if (!p.budget && Object.keys(items).length >= 3) break;
    }
    const total = cost();
    const fit = p.budget ? total / p.budget : 0;
    let score = r.rating * 10 + (p.area && r.area === p.area ? 6 : 0) + (p.family && r.fac.includes('cabin') ? 8 : 0) + (p.type && chosen.type === p.type ? 5 : 0);
    if (p.budget) score += total <= p.budget ? 20 - Math.abs(.9 - fit) * 25 : -60;
    if (p.cheap) score -= total / 100;
    return { r, items, total, pp: total / n, people: n, over: p.budget ? total > p.budget : false, score };
  }

  /* ---------------- replies ---------------- */
  const NF = { bn: new Intl.NumberFormat('bn-BD'), en: new Intl.NumberFormat('en-IN') };
  const tk = v => '৳' + NF[p_lang === 'bn' ? 'bn' : 'en'].format(Math.round(v));
  let p_lang = 'en';
  const nm = (o) => p_lang === 'bn' ? o.bn : o.en;
  const num = v => p_lang === 'bn' ? String(v).replace(/[0-9]/g, d => BD[d]) : String(v);
  const where = p => p.area ? nm(K.areaOf(p.area)) : p.city ? nm(D.cities[p.city]) : '';

  function answer(p) {
    p_lang = p.lang;
    const bl = p.lang === 'bl', bn = p.lang === 'bn';
    const say = (en, b, l) => bn ? b : bl ? l : en;
    if (p.nope) {
      const place = p.nope.charAt(0).toUpperCase() + p.nope.slice(1);
      return { text: say(`I don't have any restaurants in ${place} yet. We are in Dhaka and Bogura for now. Here is what I can suggest nearby in our list instead.`, `${place}-এ এখনো আমাদের কোনো রেস্টুরেন্ট নেই। আপাতত আমরা ঢাকা আর বগুড়ায় আছি। এর বদলে আমাদের তালিকা থেকে কিছু প্রস্তাব:`, `${place} e ekhono amader kono restaurant nei. Apatoto Dhaka r Bogura te achi. Er bodole ei gulo dekhte paren:`), cards: [{ kind: 'list', rs: D.restaurants.slice().sort((a, b) => b.rating - a.rating).slice(0, 3) }], follow: followUps(p) };
    }
    const planMode = p.budget || p.people || p.family || p.fac.includes('cabin') || p.fac.includes('events');
    if (planMode) {
      let rs = candidates(p);
      let relaxed = '';
      if (!rs.length && p.area) { const q = Object.assign({}, p, { area: null }); rs = candidates(q); if (rs.length) relaxed = say(`Nothing in ${where(p)} matches all of that yet, so these are from elsewhere in ${nm(D.cities[K.areaOf(p.area).city])}.`, `${where(p)}-এ সব শর্ত মেলে এমন জায়গা এখনো নেই, তাই ${nm(D.cities[K.areaOf(p.area).city])}-এর অন্য জায়গা থেকে দেখাচ্ছি।`, `${where(p)} e shob mile emon jayga ekhono nei, tai onno area theke dekhacchi.`); }
      if (!rs.length) return none(p);
      const plans = rs.map(r => meal(r, p)).filter(Boolean).sort((a, b) => b.score - a.score);
      if (!plans.length) return none(p);
      const best = plans[0];
      const nPeople = num(best.people);
      let text;
      if (best.over) {
        text = say(`With ${tk(p.budget)} for ${nPeople} it's tight everywhere I know. The closest is ${best.r.name.en} at ${tk(best.total)} all-in, about ${tk(best.pp)} each.`,
          `${nPeople} জনের জন্য ${tk(p.budget)}-এ একটু টানাটানি। সবচেয়ে কাছাকাছি ${best.r.name.bn}: ভ্যাট-সার্ভিসসহ ${tk(best.total)}, জনপ্রতি প্রায় ${tk(best.pp)}।`,
          `${nPeople} jon er jonno ${tk(p.budget)} e ektu tight. Shobcheye kachakachi ${best.r.name.en}: VAT-service shoho ${tk(best.total)}, jon proti ~${tk(best.pp)}.`);
      } else {
        const w = where(p), wEn = w ? ` in ${w}` : '';
        text = p.budget
          ? say(`For ${nPeople} people${wEn} with ${tk(p.budget)}, ${best.r.name.en} fits best: ${tk(best.total)} all-in, about ${tk(best.pp)} each.`,
            `${w ? w + '-এ ' : ''}${nPeople} জনের জন্য ${tk(p.budget)}-এর মধ্যে ${best.r.name.bn} সবচেয়ে ভালো মিলছে: ভ্যাট-সার্ভিসসহ ${tk(best.total)}, জনপ্রতি প্রায় ${tk(best.pp)}।`,
            `${w ? w + ' e ' : ''}${nPeople} jon er jonno ${tk(p.budget)} er moddhe ${best.r.name.en} best: VAT-service shoho ${tk(best.total)}, jon proti ~${tk(best.pp)}.`)
          : say(`For ${nPeople} people${wEn}, ${best.r.name.en} is a good pick. A typical meal comes to about ${tk(best.total)} all-in, ${tk(best.pp)} each.`,
            `${w ? w + '-এ ' : ''}${nPeople} জনের জন্য ${best.r.name.bn} ভালো হবে। সাধারণ একটা খাবারে ভ্যাট-সার্ভিসসহ প্রায় ${tk(best.total)}, জনপ্রতি ${tk(best.pp)}।`,
            `${w ? w + ' e ' : ''}${nPeople} jon er jonno ${best.r.name.en} valo hobe. Typical meal e VAT-service shoho ~${tk(best.total)}, jon proti ${tk(best.pp)}.`);
        if (p.family && best.r.fac.includes('cabin')) text += say(' It has family cabins.', ' এখানে ফ্যামিলি কেবিন আছে।', ' Family cabin ache.');
      }
      if (relaxed) text = relaxed + ' ' + text;
      /* always offer a few places to compare; widen to the rest of the city when the area is thin */
      let opts = plans.filter(x => !x.over || best.over).slice(0, 3);
      if (opts.length < 3 && p.area) {
        const city = K.areaOf(p.area).city;
        const extra = candidates(Object.assign({}, p, { area: null, city })).filter(r => !opts.some(o => o.r.id === r.id)).map(r => meal(r, p)).filter(x => x && (!x.over || best.over)).sort((a, b) => b.score - a.score);
        extra.forEach(x => x.near = true); opts = opts.concat(extra).slice(0, 3);
      }
      if (opts.length > 1) text += ' ' + say(`Here are ${num(opts.length)} options to compare.`, `তুলনার জন্য ${num(opts.length)}টি অপশন দিলাম।`, `Compare korar jonno ${num(opts.length)} ta option dilam.`);
      if (!p.area && !p.city) text += ' ' + say('Tell me the area and I can narrow it down.', 'এলাকা বললে আরও ঠিকঠাক বলতে পারব।', 'Area bolle aro thik moto bolte parbo.');
      return { text, cards: [{ kind: 'options', plans: opts }], follow: p.area || p.city ? followUps(p) : areaAsk(p) };
    }
    if (p.type || p.maxDish || p.cheap) {
      let ds = K.allDishes.filter(d => (!p.type || d.type === p.type) && (!p.maxDish || d.price <= p.maxDish));
      if (p.area) ds = ds.filter(d => K.r(d.r).area === p.area); else if (p.city) ds = ds.filter(d => K.r(d.r).city === p.city);
      if (p.open) ds = ds.filter(d => K.openState(K.r(d.r)).open);
      ds = ds.filter(d => !d.share).sort((a, b) => a.price - b.price);
      if (!ds.length) return none(p);
      const places = new Set(ds.map(d => d.r)).size, c = ds[0], tn = p.type ? nm(D.types[p.type]).toLowerCase() : say('dishes', 'খাবার', 'khabar');
      const capT = p.maxDish ? say(` under ${tk(p.maxDish)}`, ` ${tk(p.maxDish)}-এর মধ্যে`, ` ${tk(p.maxDish)} er moddhe`) : '';
      const text = say(`${num(places)} ${places === 1 ? 'place serves' : 'places serve'} ${tn}${capT}${p.area ? ' in ' + where(p) : ''}. Lowest is ${c.name.en} at ${K.r(c.r).name.en}, ${tk(c.price)}.`,
        `${p.area ? where(p) + '-এ ' : ''}${num(places)}টি জায়গায়${capT} ${tn} পাওয়া যায়। সবচেয়ে কম দাম ${K.r(c.r).name.bn}-এর ${c.name.bn}, ${tk(c.price)}।`,
        `${p.area ? where(p) + ' e ' : ''}${num(places)} ta jaygay${capT} ${tn} pawa jay. Shobcheye kom ${K.r(c.r).name.en} er ${c.name.en}, ${tk(c.price)}.`);
      return { text, cards: [{ kind: 'dishes', ds: ds.slice(0, 6) }], follow: followUps(p) };
    }
    if (p.area || p.city || p.fac.length || p.open || p.late || p.best) {
      let rs = D.restaurants.filter(r => (!p.area || r.area === p.area) && (!p.city || r.city === p.city) && p.fac.every(f => r.fac.includes(f)) && (!p.open || K.openState(r).open) && (!p.late || K.isLate(r)));
      if (!rs.length) return none(p);
      rs.sort((a, b) => b.rating - a.rating);
      const text = say(`Here ${rs.length === 1 ? 'is the place' : `are ${num(rs.length)} places`} I'd look at${p.area || p.city ? ' in ' + where(p) : ''}, best rated first.`, `${where(p) ? where(p) + '-এ ' : ''}${num(rs.length)}টি জায়গা, রেটিং অনুযায়ী সাজানো।`, `${where(p) ? where(p) + ' e ' : ''}${num(rs.length)} ta jayga, rating onujayi.`);
      return { text, cards: [{ kind: 'list', rs: rs.slice(0, 4) }], follow: followUps(p) };
    }
    if (p.r) { const r = K.r(p.r); return { text: say(`${r.name.en}: ${K.ppRange(r)} per person, rated ${r.rating}.`, `${r.name.bn}: জনপ্রতি ${K.ppRange(r)}, রেটিং ${num(r.rating)}।`, `${r.name.en}: jon proti ${K.ppRange(r)}, rating ${r.rating}.`), cards: [{ kind: 'list', rs: [r] }], follow: followUps(p) }; }
    return { text: say("I couldn't match that to our restaurants yet. Ask me with a dish, an area, a number of people or a budget.", 'এটা এখনো আমাদের তথ্যের সাথে মেলাতে পারিনি। খাবারের নাম, এলাকা, কতজন বা বাজেট দিয়ে জিজ্ঞেস করুন।', 'Eta ekhono milate parini. Khabar er naam, area, koto jon ba budget diye jiggesh korun.'), cards: [], follow: starters() };
  }
  function none(p) {
    p_lang = p.lang;
    const bn = p.lang === 'bn', bl = p.lang === 'bl';
    const text = bn ? `দুঃখিত, এই শর্তে আমার কাছে এখনো কোনো রেস্টুরেন্টের তথ্য নেই। বাজেট বা এলাকা একটু বদলে দেখুন।` : bl ? `Sorry, ei condition e amar kache ekhono kono restaurant er data nei. Budget ba area ektu change kore dekhen.` : `Sorry, I don't have a restaurant that matches all of that yet. Try a bigger budget or a different area.`;
    return { text, cards: [], follow: followUps(p) };
  }
  function areaAsk(p) {
    const bn = p.lang === 'bn', bl = p.lang === 'bl';
    return ['dhanmondi', 'gulshan', 'mirpur'].map(id => { const a = K.areaOf(id); return bn ? `${a.bn}-এ` : bl ? `${a.en} e` : `In ${a.en}`; });
  }
  function followUps(p) {
    const bn = p.lang === 'bn', bl = p.lang === 'bl';
    const out = [];
    if (p.budget) out.push(bn ? `${num(p.budget + 1000)} টাকা হলে?` : bl ? `${p.budget + 1000} taka hole?` : `What about ৳${NF.en.format(p.budget + 1000)}?`);
    if (!p.fac.includes('cabin')) out.push(bn ? 'ফ্যামিলি কেবিন লাগবে' : bl ? 'Family cabin lagbe' : 'Need a family cabin');
    if (!p.cheap) out.push(bn ? 'সবচেয়ে সস্তা কোনটা?' : bl ? 'Shobcheye sasta konta?' : 'Show me the cheapest');
    if (!p.open) out.push(bn ? 'এখন খোলা আছে কোনগুলো?' : bl ? 'Ekhon khola ache konta?' : 'Which are open now?');
    return out.slice(0, 3);
  }
  function starters() {
    return K.S.lang === 'bn' ? ['ধানমন্ডিতে ৪ জন, ২৫০০ টাকা', 'বগুড়ায় ভালো কাচ্চি কোথায়?', 'রুফটপে ডিনার, বনানী'] : ['৳2,500 for 4 in Dhanmondi', 'Kacchi under ৳400', 'amra 6 jon, family cabin lagbe, Gulshan'];
  }
  /* merge follow-ups into the last question so "what about ৳3,500?" keeps the people and area */
  let memory = null;
  function withMemory(p) {
    if (!memory) return p;
    const fresh = p.area || p.city || p.type || p.r;
    if (fresh && (p.people || p.budget)) return p;
    const m = Object.assign({}, memory);
    for (const k of ['budget', 'people', 'area', 'city', 'type', 'maxDish', 'nope']) if (p[k]) m[k] = p[k];
    m.fac = Array.from(new Set([...(memory.fac || []), ...p.fac]));
    ['family', 'open', 'late', 'cheap', 'best'].forEach(k => m[k] = memory[k] || p[k]);
    m.lang = p.lang; m.raw = p.raw;
    return m;
  }

  /* ---------------- cards ---------------- */
  function planCard(x, compact) {
    const r = x.r, lines = Object.entries(x.items).filter(([, q]) => q > 0).map(([id, q]) => { const d = r.menu.find(m => m.id === id); return `<li><span><b class="num">${K.n(q)}×</b> ${K.esc(L(d.name))}</span><span class="num">${K.tk(d.price * q)}</span></li>`; }).join('');
    const sub = Object.entries(x.items).reduce((s, [id, q]) => s + r.menu.find(m => m.id === id).price * q, 0);
    return `<article class="ai-plan" style="--r-accent:${r.theme.accent};--r-deep:${r.theme.deep}">
      <a class="ai-plan-h" href="#/r/${r.id}"><span class="ph">${K.img(r.hero[0], { w: 200 })}</span><span><b>${K.esc(L(r.name))}</b><span class="meta">${K.where(r)} · ${ico('star-fill', 'sm')} ${K.n(r.rating)}</span></span>${ico('caret-right')}</a>
      <ul class="ai-lines">${lines}</ul>
      <dl class="ai-sum"><div><dt>${t('subtotal')}</dt><dd class="num">${K.tk(sub)}</dd></div><div><dt>${t('vat_service', { v: K.n(r.vat), s: K.n(r.service) })}</dt><dd class="num">${K.tk(x.total - sub)}</dd></div><div class="tot"><dt>${t('total_all_in')}</dt><dd class="num">${K.tk(x.total)}</dd></div></dl>
      <div class="ai-pp"><span>${t('each_of', { n: K.n(x.people) })}</span><b class="num">${K.tk(x.pp)}</b></div>
      <div class="ai-plan-f"><span class="fresh">${K.checked(r.checked)}</span><button class="btn btn-gold" data-use='${JSON.stringify({ r: r.id, items: x.items, people: x.people })}'>${ico('receipt')}${t('use_bill')}</button></div>
    </article>`;
  }
  function card(c) {
    if (c.kind === 'plan') return planCard(c.plan);
    if (c.kind === 'options') return `<div class="ai-opts" data-opts>${c.plans.length > 1 ? `<div class="ai-tabs" role="tablist">${c.plans.map((x, i) => `<button type="button" role="tab" class="ai-tab ${i ? '' : 'on'}" data-opt="${i}" aria-selected="${i ? 'false' : 'true'}">${K.mono(x.r)}<span><b>${K.esc(L(x.r.name))}</b><span class="num">${K.tk(x.total)}${x.near ? ', ' + L(K.areaOf(x.r.area)) : ''}</span></span></button>`).join('')}</div>` : ''}${c.plans.map((x, i) => `<div class="ai-opt" ${i ? 'hidden' : ''}>${planCard(x)}</div>`).join('')}</div>`;
    if (c.kind === 'alts') return `<div class="ai-alts"><span class="meta">${t('also_fits')}</span>${c.plans.map(x => `<a class="ai-alt" href="#/r/${x.r.id}"><span class="ph">${K.img(x.r.hero[0], { w: 96 })}</span><span><b>${K.esc(L(x.r.name))}</b><span class="meta">${K.where(x.r)}</span></span><span class="num price">${K.tk(x.total)}</span></a>`).join('')}</div>`;
    if (c.kind === 'dishes') return `<div class="ai-list">${c.ds.map((d, i) => { const r = K.r(d.r); return `<button class="ai-row" data-dish="${r.id}|${d.id}">${K.ph(d.p, { w: 120, word: L(d.name) })}<span><b>${K.esc(L(d.name))}</b><span class="meta">${K.esc(L(r.name))} · ${L(K.areaOf(r.area))}</span></span><span class="price gold num">${K.tk(d.price)}${i === 0 ? `<em class="badge b-green">${t('lowest')}</em>` : ''}</span></button>`; }).join('')}</div>`;
    if (c.kind === 'list') return `<div class="ai-list">${c.rs.map(r => `<a class="ai-row" href="#/r/${r.id}">${K.ph(r.hero[0], { w: 120 })}<span><b>${K.esc(L(r.name))}</b><span class="meta">${K.where(r)} · ${K.ppRange(r)}</span></span><span class="stars">${ico('star-fill')}${K.n(r.rating)}</span></a>`).join('')}</div>`;
    return '';
  }

  /* ---------------- chat UI ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  K.ai = {
    open(q0 = '') {
      if (K.sheet.count() && K.sheet.top().o.kind === 'ai') { if (q0) send(K.sheet.top().el, q0); return; }
      memory = null;
      K.sheet.open({
        kind: 'ai', cls: 'drawer full-m ai-sheet', grab: false, label: t('ask_title'), focus: 'textarea',
        html: `<header class="ai-h"><span class="ai-orb">${ico('sparkle-fill')}</span><div><b>${t('ask_title')}</b><span class="meta">${t('ask_langs')}</span></div><button class="ibtn" data-close aria-label="${t('close')}">${ico('x')}</button></header>
          <div class="ai-body" aria-live="polite"><div class="ai-hello"><h2>${t('ai_hello')}</h2><p class="meta">${t('ai_hello_sub')}</p><div class="ai-starts">${[t('try_1'), t('try_2'), t('try_3'), t('try_4'), t('try_5')].map(x => `<button class="chip" data-q="${K.esc(x)}">${K.esc(x)}</button>`).join('')}</div></div></div>
          <form class="ai-f"><textarea rows="1" placeholder="${t('ai_ph')}" aria-label="${t('ai_ph')}" enterkeyhint="send"></textarea>${SR ? `<button type="button" class="ibtn ai-mic" aria-label="${t('speak')}">${ico('microphone')}</button>` : ''}<button class="ibtn ai-send" aria-label="${t('send')}">${ico('paper-plane-right')}</button></form>
          <p class="ai-foot meta">${t('ai_honest')}</p>`,
        onOpen: el => {
          const ta = $('textarea', el), f = $('form', el);
          const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; };
          ta.addEventListener('input', fit);
          ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } });
          f.addEventListener('submit', e => { e.preventDefault(); const v = ta.value.trim(); if (!v) return; ta.value = ''; fit(); send(el, v); });
          el.addEventListener('click', e => {
            const q = e.target.closest('[data-q]'); if (q) { send(el, q.dataset.q); return; }
            const u = e.target.closest('[data-use]'); if (u) { const x = JSON.parse(u.dataset.use); K.bill.load(x.r, x.items, x.people); K.toast(t('bill_loaded'), 'receipt'); K.leaveTo('/r/' + x.r); setTimeout(() => K.bill.open(x.r), 700); }
          });
          const mic = $('.ai-mic', el);
          if (mic) mic.onclick = () => {
            try {
              const rec = new SR(); rec.lang = K.S.lang === 'bn' ? 'bn-BD' : 'en-IN'; rec.interimResults = true; rec.maxAlternatives = 1;
              mic.classList.add('rec'); ta.placeholder = t('listening');
              rec.onresult = ev => { ta.value = Array.from(ev.results).map(r => r[0].transcript).join(''); fit(); if (ev.results[ev.results.length - 1].isFinal) { const v = ta.value.trim(); ta.value = ''; fit(); v && send(el, v); } };
              rec.onend = () => { mic.classList.remove('rec'); ta.placeholder = t('ai_ph'); };
              rec.onerror = () => { mic.classList.remove('rec'); K.toast(t('mic_off'), 'microphone'); };
              rec.start();
            } catch (e) { K.toast(t('mic_off'), 'microphone'); }
          };
          if (q0) send(el, q0);
        }
      });
    }
  };
  /* switching between options works in the chat and in the home demo */
  document.addEventListener('click', e => { const b = e.target.closest('[data-opt]'); if (!b) return; const w = b.closest('[data-opts]'); w.querySelectorAll('[data-opt]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); }); w.querySelectorAll('.ai-opt').forEach((x, i) => x.hidden = i !== Number(b.dataset.opt)); });
  K.ai.preview = q => { const a = answer(parse(q)); return { text: a.text, html: a.cards.map(card).join('') }; };
  function send(el, q) {
    const body = $('.ai-body', el), hello = $('.ai-hello', el);
    if (hello) hello.remove();
    body.insertAdjacentHTML('beforeend', `<div class="ai-msg me"><p>${K.esc(q)}</p></div><div class="ai-msg bot typing"><span></span><span></span><span></span></div>`);
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    const p = withMemory(parse(q));
    memory = p;
    const a = answer(p);
    setTimeout(() => {
      const ty = $('.typing', body); if (ty) ty.remove();
      const m = document.createElement('div'); m.className = 'ai-msg bot'; m.innerHTML = `<p></p><div class="ai-cards"></div>${a.follow && a.follow.length ? `<div class="ai-follow">${a.follow.map(x => `<button class="chip" data-q="${K.esc(x)}">${K.esc(x)}</button>`).join('')}</div>` : ''}`;
      body.appendChild(m);
      /* the whole answer fades in at once (no word-by-word typing), then its cards follow */
      $('p', m).textContent = a.text;
      const tick = () => { $('.ai-cards', m).innerHTML = a.cards.map(card).join(''); m.classList.add('done'); body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' }); };
      tick();
    }, 650);
  }
})();
