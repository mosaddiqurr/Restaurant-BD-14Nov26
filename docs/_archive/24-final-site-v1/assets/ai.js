/* khabo prototype · AI assistant demo engine.
   Production: Claude API with database tools (answers only from our data, PRD A-1…A-8).
   This demo reads budget, people, area, needs and dish from Bangla / English / Banglish text,
   picks a restaurant from KH data and builds a meal plan with VAT + service charge. */
window.KAI = (function () {
  const A = window.APP, D = A.D;
  const BND = '০১২৩৪৫৬৭৮৯';
  const toEn = s => s.replace(/[০-৯]/g, d => String(BND.indexOf(d)));
  function detect(q) {
    if (/[ঀ-৲৴-৿]/.test(q)) return 'bn'; /* ৳ (U+09F3) is used in English too */
    if (/\b(ache|achhe|emon|kothay|kothai|khabo|jabo|valo|bhalo|koto|jon|chai|dorkar|korbo|jaiga|jayga)\b/i.test(q)) return 'bl';
    return 'en';
  }
  function parse(q) {
    const s = toEn(q).toLowerCase().replace(/[,৳]/g, ' ');
    let people = null, budget = null;
    const pm = s.match(/(\d+)\s*(জন|jon|people|persons?|guests?|of us|members?)/) || s.match(/\bfor\s+(\d+)\b/);
    if (pm) people = Number(pm[1]);
    const nums = [...s.matchAll(/(\d+)\s*(k\b)?/g)].map(m => Number(m[1]) * (m[2] ? 1000 : 1)).filter(n => n >= 100);
    if (nums.length) budget = Math.max(...nums);
    if (budget && people && /(each|per person|per head|জনপ্রতি|jonproti|pp\b|a head)/.test(s)) budget *= people;
    const area = D.areas.find(a => s.indexOf(a.en.toLowerCase()) > -1 || q.indexOf(a.bn) > -1 || (a.id === 'dhanmondi' && /ধানমন্ডি/.test(q)));
    const feats = [];
    if (/(cabin|কেবিন)/.test(s)) feats.push('cabin');
    if (/(rooftop|রুফটপ|ছাদ|chad\b)/.test(s)) feats.push('rooftop');
    if (/(parking|পার্কিং)/.test(s)) feats.push('parking');
    const dish = /(kacchi|কাচ্চি)/.test(s) ? 'kacchi' : /(tehari|তেহারি)/.test(s) ? 'tehari' : /(ilish|ইলিশ|hilsa)/.test(s) ? 'ilish' : null;
    return { people: people || 2, hasPeople: !!people, budget, area, feats, dish };
  }
  function pick(p, o) {
    o = o || {};
    let list = D.restaurants.filter(r => r.menu && r.menu.length >= 2);
    if (p.area && !o.anyArea) list = list.filter(r => r.area === p.area.id);
    if (p.area && o.anyArea) list = list.filter(r => r.city === p.area.city);
    if (p.feats.length && !o.noFeat) list = list.filter(r => p.feats.every(f => (r.fac || []).indexOf(f) > -1));
    if (p.dish) list = list.filter(r => r.menu.some(m => m.name.en.toLowerCase().indexOf(p.dish) > -1));
    if (p.budget) list = list.filter(r => r.ppl[0] * p.people <= p.budget);
    list.sort((a, b) => (b.rating - a.rating) || (a.dist - b.dist));
    return list[0];
  }
  function plan(r, p) {
    const big = m => /serves [3-9]|for 4/i.test(m.por.en + ' ' + m.name.en);
    const mains = r.menu.filter(m => ['biryani', 'kebab', 'fish', 'thali', 'curry', 'snacks'].indexOf(m.cat) > -1 && !big(m));
    const main = (p.dish && mains.find(m => m.name.en.toLowerCase().indexOf(p.dish) > -1)) || mains.find(m => m.tags.indexOf('best') > -1) || mains[0] || r.menu[0];
    const lines = [{ m: main, q: p.people }];
    const tot = ls => { const sub = ls.reduce((s, l) => s + l.m.price * l.q, 0); return sub + Math.round(sub * r.vat / 100) + Math.round(sub * r.service / 100); };
    const tryAdd = (m, q) => { if (!m || lines.some(l => l.m === m)) return; const n = lines.concat([{ m, q }]); if (!p.budget || tot(n) <= p.budget) lines.push({ m, q }); };
    if (p.people >= 4) tryAdd(r.menu.find(big), 1);
    tryAdd(r.menu.find(m => m.cat === 'drinks'), p.people);
    tryAdd(r.menu.find(m => m.cat === 'dessert'), p.people);
    const sub = lines.reduce((s, l) => s + l.m.price * l.q, 0), vat = Math.round(sub * r.vat / 100), svc = Math.round(sub * r.service / 100);
    return { lines, sub, vat, svc, tot: sub + vat + svc, each: Math.ceil((sub + vat + svc) / p.people) };
  }
  const FEAT = { cabin: { bn: 'ফ্যামিলি কেবিন', en: 'a family cabin', bl: 'family cabin' }, rooftop: { bn: 'রুফটপ', en: 'a rooftop', bl: 'rooftop' }, parking: { bn: 'পার্কিং', en: 'parking', bl: 'parking' } };
  function respond(q) {
    const lg = detect(q), p = parse(q);
    let r = pick(p), miss = false;
    if (!r) { miss = true; r = pick(p, { anyArea: true }) || pick(p, { anyArea: true, noFeat: true }) || pick(Object.assign({}, p, { budget: null, dish: null }), { anyArea: true, noFeat: true }); }
    if (!r) return { lg, text: { bn: 'এই প্রশ্নের উত্তর দেওয়ার মতো তথ্য আমার কাছে এখনো নেই।', en: "I don't have that information yet.", bl: 'Ei proshner uttor dewar moto info amar kache ekhono nei.' }[lg] };
    const pl = plan(r, p), an = p.area ? (lg === 'bn' ? p.area.bn : p.area.en) : '';
    const locBn = n => /[া-ৌ]$/.test(n) ? n + 'তে' : n + 'ে';
    const fe = p.feats.map(f => FEAT[f][lg]).join(lg === 'en' ? ' and ' : ', ');
    const NB = x => lg === 'bn' ? String(x).replace(/[0-9]/g, d => BND[d]) : String(x);
    const tkx = x => '৳' + NB(Number(x).toLocaleString('en-IN'));
    let text;
    if (miss && p.area && !p.feats.length) {
      text = {
        bn: `${locBn(an)} পুরো মেনুসহ জায়গা এখনো আমাদের তালিকায় নেই। কাছের সবচেয়ে ভালো বিকল্প:`,
        en: `I don't have full menus for ${an} yet. Closest good option:`,
        bl: `${an}-e full menu shoho jaiga ekhono amader list-e nei. Kacher best option:`
      }[lg];
    } else if (miss && (p.area || p.feats.length)) {
      text = {
        bn: `${an ? locBn(an) + ' ' : ''}${fe || 'এমন'} আছে এমন জায়গা আমাদের তালিকায় এখনো নেই। কাছের সবচেয়ে ভালো বিকল্প:`,
        en: `I don't have a place${an ? ' in ' + an : ''}${fe ? ' with ' + fe : ''} yet. Closest good option:`,
        bl: `${an ? an + '-e ' : ''}${fe || 'emon'} ache emon jaiga amader list-e ekhono nei. Kacher best option:`
      }[lg];
    } else {
      text = {
        bn: `${an ? locBn(an) + ' ' : ''}${NB(p.people)} জনের জন্য${p.budget ? ' ' + tkx(p.budget) + ' বাজেটে' : ''} সবচেয়ে ভালো মিল:`,
        en: `Best match for ${p.people} ${p.people > 1 ? 'people' : 'person'}${p.budget ? ' within ' + tkx(p.budget) : ''}${an ? ' in ' + an : ''}:`,
        bl: `${p.people} jon${p.budget ? ', ' + p.budget + ' taka' : ''}${an ? ', ' + an : ''}: best option holo`
      }[lg];
    }
    return { lg, p, r, pl, text };
  }
  return { respond, detect, parse };
})();
