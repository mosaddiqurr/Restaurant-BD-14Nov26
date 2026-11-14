/* khabo prototype · shared shell: theme, language, header, nav, footer, sheets, filters, bill */
(function () {
  const D = window.KH;
  const qs = new URLSearchParams(location.search);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('kb_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('kb_' + k, JSON.stringify(v)); } catch (e) {} }
  };
  let theme = qs.get('theme') || store.get('theme', null);
  if (!theme) theme = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  const lang = qs.get('lang') || store.get('lang', 'en');
  const root = document.documentElement;
  root.dataset.theme = theme; root.lang = lang;

  /* ---------- i18n ---------- */
  const T = {
    en: {
      explore:'Explore', ask:'Ask AI', deals:'Deals', forRest:'For restaurants', login:'Log in', home:'Home', search:'Search', account:'Account',
      searchPh:'Restaurant, dish or area', filters:'Filters', openNow:'Open now', closed:'Closed', close:'Close',
      openTill:'Open · till {t}', opensAt:'Closed · opens {t}', openShort:'Open till {t}', km:'km', reviews:'reviews',
      ppl:'{p}/person', checkedShort:'Checked {n}d ago', checkedLong:'Menu and prices checked {n} days ago',
      seeAll:'See all', video:'Video', tour3d:'3D tour', featured:'Featured', founding:'Founding partner', save:'Save', saved:'Saved to your list', share:'Share', linkCopied:'Link copied',
      call:'Call', whatsapp:'WhatsApp', directions:'Directions', clearAll:'Clear all', showN:'Show {n} restaurants', showOne:'Show 1 restaurant', showNone:'No matches, loosen filters',
      budget:'Budget', budgetPP:'Budget per person', anyBudget:'Any budget', upTo:'Up to {p}', under:'Under {p}', sort:'Sort by',
      sBest:'Best match', sPrice:'Price: low to high', sRating:'Rating', sDist:'Distance', sFresh:'Recently updated',
      when:'When', openLate:'Open after 11 PM', area:'Area', cuisine:'Cuisine', rating:'Rating', any:'Any',
      seeBefore:'See before you go', hasTour:'3D tour', hasVideo:'Video', hasKitchen:'Kitchen video',
      facilities:'Facilities', dietary:'Food needs', halal:'Halal', veg:'Vegetarian options', mild:'Mild spice options',
      group:'Group size', offers:'Offers', hasDeal:'Has a deal', buffet:'Buffet', newOpen:'Newly opened',
      chooseArea:'Choose your area', areaSet:'Showing places near {a}', restaurantsN:'{n} restaurants',
      bill:'Bill calculator', items:'{n} items', item1:'1 item', people:'People', subtotal:'Subtotal', vat:'VAT {v}%', svc:'Service charge {v}%', total:'Total', each:'Each person pays',
      billEmpty:'Tap + on any dish and your bill adds up here, with VAT and service charge.', billNote:'Estimate from menu prices checked {n} days ago. The restaurant gives the final bill.',
      shareBill:'Send on WhatsApp', viewBill:'View bill', clear:'Clear', add:'Add',
      footAbout:'Real menus, real prices and real photos of restaurants, checked by our team.',
      fExplore:'Explore', fAreas:'Areas', fCuisines:'Cuisines', fDeals:'Deals', fAsk:'Ask AI', fCompany:'Company', fAbout:'About', fContact:'Contact', fHelp:'Help',
      fBiz:'For restaurants', fPlans:'Plans and prices', fJoin:'List your restaurant', fFounding:'Founding partners', fLegal:'Legal', fTerms:'Terms', fPrivacy:'Privacy', fReviewPolicy:'Review policy',
      dhaka:'Dhaka', bogura:'Bogura', demo:'Demo action in the prototype'
    },
    bn: {
      explore:'এক্সপ্লোর', ask:'AI-কে জিজ্ঞেস', deals:'অফার', forRest:'রেস্টুরেন্টের জন্য', login:'লগ ইন', home:'হোম', search:'সার্চ', account:'অ্যাকাউন্ট',
      searchPh:'রেস্টুরেন্ট, খাবার বা এলাকা', filters:'ফিল্টার', openNow:'এখন খোলা', closed:'বন্ধ', close:'বন্ধ করুন',
      openTill:'খোলা · {t} পর্যন্ত', opensAt:'বন্ধ · খুলবে {t}', openShort:'{t} পর্যন্ত খোলা', km:'কিমি', reviews:'রিভিউ',
      ppl:'জনপ্রতি {p}', checkedShort:'যাচাই {n} দিন আগে', checkedLong:'মেনু ও দাম যাচাই করা হয়েছে {n} দিন আগে',
      seeAll:'সব দেখুন', video:'ভিডিও', tour3d:'3D ট্যুর', featured:'ফিচার্ড', founding:'ফাউন্ডিং পার্টনার', save:'সেভ', saved:'আপনার তালিকায় রাখা হলো', share:'শেয়ার', linkCopied:'লিংক কপি হয়েছে',
      call:'কল', whatsapp:'হোয়াটসঅ্যাপ', directions:'পথ দেখুন', clearAll:'সব মুছুন', showN:'{n}টি রেস্টুরেন্ট দেখুন', showOne:'১টি রেস্টুরেন্ট দেখুন', showNone:'মিল নেই, ফিল্টার কমান',
      budget:'বাজেট', budgetPP:'জনপ্রতি বাজেট', anyBudget:'যেকোনো বাজেট', upTo:'{p} পর্যন্ত', under:'{p}-এর নিচে', sort:'সাজান',
      sBest:'সবচেয়ে মিল', sPrice:'দাম: কম থেকে বেশি', sRating:'রেটিং', sDist:'দূরত্ব', sFresh:'সম্প্রতি আপডেট',
      when:'কখন', openLate:'রাত ১১টার পরেও খোলা', area:'এলাকা', cuisine:'খাবারের ধরন', rating:'রেটিং', any:'যেকোনো',
      seeBefore:'যাওয়ার আগে দেখুন', hasTour:'3D ট্যুর', hasVideo:'ভিডিও', hasKitchen:'রান্নাঘরের ভিডিও',
      facilities:'সুবিধা', dietary:'খাবারের চাহিদা', halal:'হালাল', veg:'নিরামিষ আছে', mild:'কম ঝালের খাবার',
      group:'কতজন', offers:'অফার', hasDeal:'অফার আছে', buffet:'বুফে', newOpen:'নতুন খুলেছে',
      chooseArea:'আপনার এলাকা বেছে নিন', areaSet:'{a}-এর কাছের জায়গা দেখানো হচ্ছে', restaurantsN:'{n}টি রেস্টুরেন্ট',
      bill:'বিল হিসাব', items:'{n}টি আইটেম', item1:'১টি আইটেম', people:'কতজন', subtotal:'মোট', vat:'ভ্যাট {v}%', svc:'সার্ভিস চার্জ {v}%', total:'সর্বমোট', each:'জনপ্রতি',
      billEmpty:'যেকোনো খাবারে + চাপুন, ভ্যাট ও সার্ভিস চার্জসহ বিল এখানে হিসাব হবে।', billNote:'{n} দিন আগে যাচাই করা দাম থেকে আনুমানিক হিসাব। চূড়ান্ত বিল দেবে রেস্টুরেন্ট।',
      shareBill:'হোয়াটসঅ্যাপে পাঠান', viewBill:'বিল দেখুন', clear:'মুছুন', add:'যোগ',
      footAbout:'রেস্টুরেন্টের আসল মেনু, আসল দাম আর আসল ছবি, আমাদের টিমের যাচাই করা।',
      fExplore:'এক্সপ্লোর', fAreas:'এলাকা', fCuisines:'খাবারের ধরন', fDeals:'অফার', fAsk:'AI-কে জিজ্ঞেস', fCompany:'প্রতিষ্ঠান', fAbout:'আমাদের কথা', fContact:'যোগাযোগ', fHelp:'সাহায্য',
      fBiz:'রেস্টুরেন্টের জন্য', fPlans:'প্ল্যান ও দাম', fJoin:'রেস্টুরেন্ট যুক্ত করুন', fFounding:'ফাউন্ডিং পার্টনার', fLegal:'নীতিমালা', fTerms:'শর্তাবলি', fPrivacy:'গোপনীয়তা', fReviewPolicy:'রিভিউ নীতি',
      dhaka:'ঢাকা', bogura:'বগুড়া', demo:'প্রোটোটাইপে ডেমো'
    }
  };
  function t(k, vars) { let s = (T[lang] && T[lang][k] != null) ? T[lang][k] : (T.en[k] != null ? T.en[k] : k); if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]); return s; }
  function addT(o) { for (const l in o) { T[l] = T[l] || {}; Object.assign(T[l], o[l]); } }

  /* ---------- helpers ---------- */
  const BN = '০১২৩৪৫৬৭৮৯';
  const N = x => lang === 'bn' ? String(x).replace(/[0-9]/g, d => BN[d]) : String(x);
  const fmt = x => Number(x).toLocaleString('en-IN');
  const tk = x => '৳' + N(fmt(x));
  const L = o => o == null ? '' : (typeof o === 'object' ? (o[lang] != null ? o[lang] : o.en) : o);
  const img = (k, w, h) => `https://images.unsplash.com/photo-${D.P[k] || k}?auto=format&fit=crop&w=${w || 640}${h ? '&h=' + h : ''}&q=70`;
  const ic = (n, f) => `<i class="ph${f ? '-fill' : ''} ph-${n}" aria-hidden="true"></i>`;
  const R = id => D.restaurants.find(r => r.id === id);
  const areaOf = id => D.areas.find(a => a.id === id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  function href(u) {
    const extra = ['theme', 'lang', 'frame'].filter(k => qs.has(k)).map(k => k + '=' + encodeURIComponent(qs.get(k)));
    if (!extra.length) return u;
    const i = u.indexOf('#'); const p = i < 0 ? u : u.slice(0, i); const h = i < 0 ? '' : u.slice(i);
    return p + (p.indexOf('?') > -1 ? '&' : '?') + extra.join('&') + h;
  }
  const NOW = { h:19, m:40, dow:4 }; /* demo clock: Thursday 7:40 PM, keeps screenshots consistent */
  function fmtTime(hm) {
    let [h, m] = hm.split(':').map(Number); h = h % 24;
    const h12 = ((h + 11) % 12) + 1, mm = m ? ':' + String(m).padStart(2, '0') : '';
    if (lang === 'bn') { const per = h < 4 ? 'রাত' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকেল' : h < 19 ? 'সন্ধ্যা' : 'রাত'; return per + ' ' + N(h12 + mm); }
    return h12 + mm + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function openState(r) {
    const mins = x => { const [a, b] = x.split(':').map(Number); return a * 60 + b; };
    const o = mins(r.hours[0]); let c = mins(r.hours[1]); if (c <= o) c += 1440;
    const now = NOW.h * 60 + NOW.m; const open = now >= o && now < c;
    return { open, label: open ? t('openTill', { t: fmtTime(r.hours[1]) }) : t('opensAt', { t: fmtTime(r.hours[0]) }), short: open ? t('openShort', { t: fmtTime(r.hours[1]) }) : t('closed') };
  }
  const pplText = r => t('ppl', { p: tk(r.ppl[0]) + '–' + N(fmt(r.ppl[1])) });
  function stars(n) { let s = ''; for (let i = 1; i <= 5; i++) s += ic(n >= i ? 'star' : n >= i - .5 ? 'star-half' : 'star', n >= i - .5); return s; }
  const logoSvg = () => `<svg viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="8" fill="var(--pri)"/><circle cx="17.5" cy="10.5" r="4.6" fill="var(--mar)"/><path d="M7 19.5h14" stroke="var(--prT)" stroke-width="2.6" stroke-linecap="round"/></svg>`;

  /* ---------- restaurant card ---------- */
  function rcard(r, o) {
    o = o || {}; const st = openState(r); const a = areaOf(r.area);
    return `<article class="rcard">
      <div class="im"><img src="${img(r.hero[0], 640, 480)}" alt="" loading="lazy">
        <div class="tl"><span class="mbadge lt ${st.open ? 'open' : ''}">${st.short}</span></div>
        <div class="bl">${r.has3d ? `<span class="mbadge">${ic('cube-focus')}3D</span>` : ''}${r.hasVideo ? `<span class="mbadge">${ic('play', 1)}${t('video')}</span>` : ''}</div>
        <button class="sv" data-save aria-pressed="false" aria-label="${t('save')}">${ic('heart')}</button>
      </div>
      <div class="bd">
        <div class="t1"><h3><a class="stretch" href="${href('restaurant.html?id=' + r.id)}">${L(r.name)}</a></h3><span class="rate">${ic('star', 1)}${N(r.rating.toFixed(1))}</span></div>
        <div class="mt">${L(a)}<span class="dot"></span>${N(r.dist)} ${t('km')}<span class="dot"></span>${r.cuisines.slice(0, 2).map(L).join(', ')}</div>
        <div class="t3"><span class="price">${pplText(r)}</span><span class="fresh">${t('checkedShort', { n: N(r.checked) })}</span>${o.feat && r.featured ? `<span class="badge out">${t('featured')}</span>` : ''}</div>
      </div></article>`;
  }

  /* ---------- header / nav / footer ---------- */
  function header(active) {
    const cur = k => active === k ? ' aria-current="page"' : '';
    return `<header class="hdr" id="hdr"><div class="wrap in">
      <a class="logo" href="${href('index.html')}" aria-label="khabo home">${logoSvg()}<span>khabo</span></a>
      <nav class="nav" aria-label="Main">
        <a href="${href('search.html')}"${cur('search')}>${ic('compass')}${t('explore')}</a>
        <a href="${href('index.html#ask')}" data-ask>${ic('sparkle')}${t('ask')}</a>
        <a href="${href('search.html?deals=1')}"${cur('deals')}>${ic('tag')}${t('deals')}</a>
        <a href="${href('business.html')}"${cur('biz')}>${ic('storefront')}${t('forRest')}</a>
      </nav>
      <div class="seg hide-m" role="group" aria-label="Language"><button data-lang="en" aria-pressed="${lang === 'en'}">EN</button><button data-lang="bn" aria-pressed="${lang === 'bn'}">বাংলা</button></div>
      <button class="ib hide-d" data-lang="${lang === 'en' ? 'bn' : 'en'}" aria-label="Language" style="font-size:14px;font-weight:800">${lang === 'en' ? 'বাং' : 'EN'}</button>
      <button class="ib" data-theme-toggle aria-label="Light or dark">${ic(theme === 'dark' ? 'sun' : 'moon')}</button>
      <a class="btn sm line hide-m" href="#" data-demo style="margin-left:6px">${t('login')}</a>
      <button class="ib hide-d" aria-label="${t('account')}" data-demo>${ic('user-circle')}</button>
    </div></header>`;
  }
  function bnav(active) {
    const it = (k, u, i, lbl, cls) => `<a href="${href(u)}" class="${cls || ''}"${active === k ? ' aria-current="page"' : ''}${k === 'ask' ? ' data-ask' : ''}>${ic(i, active === k)}${lbl}</a>`;
    return `<nav class="bnav" aria-label="Main">${it('home', 'index.html', 'house-line', t('home'))}${it('search', 'search.html', 'magnifying-glass', t('search'))}${it('ask', 'index.html#ask', 'sparkle', t('ask').replace('AI-কে জিজ্ঞেস', 'AI'), 'ai')}${it('deals', 'search.html?deals=1', 'tag', t('deals'))}${it('acc', '#', 'user-circle', t('account'))}</nav>`;
  }

  function footArt() {
    const W = 1440, S = '#3E4B9A', A = '#8FA0FF', M = '#F5A300', Lt = '#C9CEEA', P = '#E9A8C0', G = '#4ED69A';
    let band = '';
    for (let x = 18; x < W; x += 72) band += `<path d="M${x} 22l6-6 6 6-6 6z" fill="${M}"/><circle cx="${x + 42}" cy="22" r="2" fill="${A}"/>`;
    let waves = '';
    [[184, 0], [196, 34], [206, 12]].forEach(([y, o]) => { for (let x = 352 + o; x < 860; x += 72) if (x < 640 || x > 742) waves += `M${x} ${y}q8-5 16 0t16 0`; });
    const shapla = (x, y) => `<ellipse cx="${x}" cy="${y + 3}" rx="16" ry="3" stroke="${G}" stroke-opacity=".55" stroke-width="1.5"/><g fill="${P}" fill-opacity=".9"><path d="M${x} ${y}C${x - 6} ${y - 8} ${x - 4} ${y - 14} ${x} ${y - 16}C${x + 4} ${y - 14} ${x + 6} ${y - 8} ${x} ${y}Z"/><path d="M${x} ${y}C${x - 10} ${y - 3} ${x - 13} ${y - 9} ${x - 12} ${y - 12}C${x - 6} ${y - 11} ${x - 2} ${y - 6} ${x} ${y}Z"/><path d="M${x} ${y}C${x + 10} ${y - 3} ${x + 13} ${y - 9} ${x + 12} ${y - 12}C${x + 6} ${y - 11} ${x + 2} ${y - 6} ${x} ${y}Z"/></g>`;
    let grass = ''; [24, 66, 140, 258, 306, 900, 1088, 1290].forEach(x => grass += `M${x} 178l3-6 3 6 3-5`);
    let win = ''; [[1306, 126, 3, 5], [1340, 108, 3, 7], [1378, 136, 2, 4], [1408, 116, 3, 6]].forEach(([x, y, c, r]) => { for (let i = 0; i < c; i++) for (let j = 0; j < r; j++) win += `M${x + i * 8} ${y + j * 9}h3`; });
    return `<svg class="art" viewBox="0 0 ${W} 214" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <g opacity=".85"><path d="M0 8H${W}" stroke="${M}" stroke-width="2" stroke-dasharray="8 8"/>${band}<path d="M0 36H${W}" stroke="${A}" stroke-width="1.5" stroke-dasharray="3 10"/></g>
      <g stroke="${A}" stroke-width="1.8" opacity=".75"><path d="M598 74q6-6 12 0q6-6 12 0M630 60q5-5 10 0q5-5 10 0M752 88q5-5 10 0q5-5 10 0"/></g>
      <g stroke="${Lt}" stroke-width="2"><path d="M0 170H330M880 170H${W}"/></g>
      <g stroke="${S}" stroke-width="2">${'<path d="' + grass + '"/>'}<path d="M1300 170V120H1328V170M1334 170V102H1366V170M1372 170V130H1396V170M1402 170V110H1432V170"/><path d="${win}" stroke-width="2.5"/></g>
      <g stroke="${Lt}" stroke-width="2"><path d="M92 170C94 140 100 112 112 88"/><path d="M112 88C96 78 80 80 70 92M112 88C102 72 92 68 80 68M112 88C118 70 130 66 142 70M112 88C128 82 140 86 150 98M112 88C114 76 120 66 128 62" stroke="${A}"/>
        <path d="M162 170V138H240V170M150 140L174 114H228L252 140Z M186 115L178 138M200 115V138M214 115L222 138M193 170V150H209V170M220 148h12v10h-12z"/>
        <path d="M282 170V138" /><path d="M282 142C266 132 258 122 254 112C268 120 278 128 282 138M282 138C298 124 306 116 314 114C304 128 294 136 282 144M282 138C280 124 284 112 292 104" stroke="${G}" stroke-opacity=".8"/></g>
      <g><path d="M654 172A36 36 0 0 1 726 172Z" fill="${M}"/><path d="M662 182H718M670 190H710M680 198H700" stroke="${M}" stroke-width="2" opacity=".7"/></g>
      <path d="M330 172H880" stroke="${A}" stroke-opacity=".45" stroke-width="1.5"/>
      <path d="${waves}" stroke="${A}" stroke-opacity=".5" stroke-width="1.8"/>
      ${shapla(380, 198)}${shapla(612, 194)}${shapla(806, 200)}
      <g stroke="${Lt}" stroke-width="2"><path d="M418 176Q486 200 556 172Q488 186 418 176Z"/><path d="M458 180C458 160 502 160 504 180M470 164V180M482 161V180M494 164V180" stroke="${A}"/>
        <path d="M516 176V96"/><path d="M518 100L566 108L562 158L518 164Z" fill="${M}" fill-opacity=".16"/><path d="M518 120L564 126M518 142L563 144M541 104L540 161" opacity=".55"/>
        <circle cx="432" cy="146" r="5"/><path d="M432 151L436 174M434 158L446 168M414 136L452 194"/></g>
      <g stroke="${Lt}" stroke-width="2"><circle cx="1032" cy="150" r="20"/><circle cx="954" cy="156" r="14"/><path d="M1032 130V170M1012 150H1052M1018 136L1046 164M1046 136L1018 164M954 142V170M940 156H968" stroke="${S}"/>
        <path d="M954 156L978 124L1032 150M978 124L1004 128M1004 116H1052V134H1004ZM996 140H1040"/><path d="M1004 116C1004 80 1050 74 1058 116"/>
        <path d="M1010 104C1020 92 1040 88 1054 98M1016 92C1026 84 1040 82 1050 86" stroke="${M}"/><path d="M1040 120h10v9h-10z" fill="${M}" stroke="none"/>
        <circle cx="974" cy="90" r="6"/><path d="M974 96L982 118M977 104L958 112M952 108L962 116M982 118L970 140L974 156M978 120h10"/></g>
      <g stroke="${Lt}" stroke-width="2"><path d="M1112 112L1272 102L1268 118L1118 126Z" fill="#fff" fill-opacity=".04"/><path d="M1124 125V170M1262 117V170M1132 146H1254V170"/>
        <path d="M1158 146C1154 132 1180 132 1176 146ZM1176 140L1188 132M1160 138C1152 128 1160 124 1168 128"/><path d="M1168 126c-4-6 4-10 0-16" stroke="${M}"/>
        <path d="M1200 138h8v8h-8zM1214 138h8v8h-8zM1228 138h8v8h-8z" stroke="${A}"/><rect x="1162" y="80" width="60" height="22" rx="4" stroke="${M}"/>
        <path d="M1246 118V128"/><circle cx="1246" cy="133" r="5" fill="${M}" stroke="none"/>
        <circle cx="1100" cy="138" r="5"/><path d="M1100 143L1102 160L1110 170M1102 150L1112 148M1094 160h16M1096 160V170M1108 160V170"/></g>
      <text x="1192" y="97" text-anchor="middle" fill="${M}" font-family="Noto Sans Bengali, sans-serif" font-size="14" font-weight="700">চা</text>
    </svg>`;
  }
  function footer() {
    const li = (k, u) => `<li><a href="${href(u || '#')}">${t(k)}</a></li>`;
    return `<footer class="foot dk"><div class="art-wrap">${footArt()}</div><div class="wrap">
      <div class="cols">
        <div class="brand"><a class="logo" href="${href('index.html')}">${logoSvg()}<span>khabo</span></a><p>${t('footAbout')}</p>
          <div class="seg" role="group" aria-label="Language" style="margin-top:16px"><button data-lang="en" aria-pressed="${lang === 'en'}">English</button><button data-lang="bn" aria-pressed="${lang === 'bn'}">বাংলা</button></div></div>
        <div><h4>${t('fExplore')}</h4><ul>${li('fAreas', 'search.html')}${li('fCuisines', 'search.html')}${li('fDeals', 'search.html?deals=1')}${li('fAsk', 'index.html#ask')}</ul></div>
        <div><h4>${t('fBiz')}</h4><ul>${li('fPlans', 'business.html#plans')}${li('fJoin', 'business.html#join')}${li('fFounding', 'business.html#plans')}</ul></div>
        <div><h4>${t('fCompany')}</h4><ul>${li('fAbout')}${li('fContact')}${li('fHelp')}</ul></div>
        <div><h4>${t('fLegal')}</h4><ul>${li('fTerms')}${li('fPrivacy')}${li('fReviewPolicy')}</ul></div>
      </div>
      <div class="bot"><span>© ${N(2026)} khabo</span><div class="soc"><a href="#" aria-label="Facebook">${ic('facebook-logo')}</a><a href="#" aria-label="Instagram">${ic('instagram-logo')}</a><a href="#" aria-label="YouTube">${ic('youtube-logo')}</a></div></div>
    </div></footer>`;
  }

  /* ---------- sheets ---------- */
  let sheetEl, scrimEl, lastFocus;
  function ensureSheet() {
    if (sheetEl) return;
    scrimEl = document.createElement('div'); scrimEl.className = 'scrim';
    sheetEl = document.createElement('div'); sheetEl.className = 'sheet'; sheetEl.tabIndex = -1; sheetEl.style.outline = 'none'; sheetEl.setAttribute('role', 'dialog'); sheetEl.setAttribute('aria-modal', 'true');
    document.body.append(scrimEl, sheetEl); scrimEl.addEventListener('click', closeSheet);
  }
  function openSheet(o) {
    ensureSheet(); lastFocus = document.activeElement;
    sheetEl.className = 'sheet' + (o.center ? ' ctr' : '');
    sheetEl.innerHTML = `<div class="grab"></div><div class="hd"><h3>${o.title}</h3><button class="ib" data-close aria-label="${t('close')}">${ic('x')}</button></div><div class="bd">${o.body}</div>${o.foot ? `<div class="ft">${o.foot}</div>` : ''}`;
    sheetEl.setAttribute('aria-label', o.title.replace(/<[^>]+>/g, ''));
    requestAnimationFrame(() => { scrimEl.classList.add('on'); sheetEl.classList.add('on'); });
    document.body.style.overflow = 'hidden';
    sheetEl.querySelector('[data-close]').addEventListener('click', closeSheet);
    setTimeout(() => sheetEl.focus({ preventScroll: true }), 60);
    return sheetEl;
  }
  function closeSheet() { if (!sheetEl) return; scrimEl.classList.remove('on'); sheetEl.classList.remove('on'); document.body.style.overflow = ''; lastFocus && lastFocus.focus && lastFocus.focus(); }

  /* ---------- toast ---------- */
  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2200);
  }

  /* ---------- area ---------- */
  const getArea = () => store.get('area', 'gulshan');
  function areaLabel() { const a = areaOf(getArea()); return L(a) + ', ' + L(D.cities[a.city]); }
  function openArea() {
    const grp = c => `<div class="cityh">${L(D.cities[c])}</div><div class="arealist">${D.areas.filter(a => a.city === c).map(a => `<button data-pick-area="${a.id}" aria-pressed="${a.id === getArea()}"><span>${L(a)}</span><small>${t('restaurantsN', { n: N(a.n) })}</small></button>`).join('')}</div>`;
    const s = openSheet({ title: t('chooseArea'), body: grp('dhaka') + grp('bogura'), center: true });
    s.querySelectorAll('[data-pick-area]').forEach(b => b.addEventListener('click', () => {
      store.set('area', b.dataset.pickArea); document.querySelectorAll('[data-area-label]').forEach(e => e.textContent = areaLabel());
      closeSheet(); toast(t('areaSet', { a: L(areaOf(b.dataset.pickArea)) })); document.dispatchEvent(new CustomEvent('kb:area'));
    }));
  }

  /* ---------- filters ---------- */
  const F0 = () => ({ sort:'best', max:2000, open:false, late:false, areas:[], cuisines:[], rating:0, media:[], fac:[], diet:[], group:0, offers:[] });
  let F = Object.assign(F0(), store.get('filters', {}));
  const CUIS = [['bangladeshi','Bangladeshi','বাংলাদেশি'],['mughlai','Mughlai','মোগলাই'],['kacchi','Kacchi','কাচ্চি'],['kebab','Kebab','কাবাব'],['bengali','Bengali','বাঙালি'],['fish','Fish','মাছ'],['chinese','Chinese','চাইনিজ'],['thai','Thai','থাই'],['café','Café','ক্যাফে'],['thali','Thali','থালি']];
  function matches(r, f) {
    f = f || F;
    if (f.max < 2000 && r.ppl[0] > f.max) return false;
    if (f.open && !openState(r).open) return false;
    if (f.late && Number(r.hours[1].split(':')[0]) < 23 && Number(r.hours[1].split(':')[0]) > 4) return false;
    if (f.areas.length && f.areas.indexOf(r.area) < 0) return false;
    if (f.cuisines.length && !r.cuisines.some(c => f.cuisines.indexOf(c.en.toLowerCase()) > -1)) return false;
    if (f.rating && r.rating < f.rating) return false;
    if (f.media.indexOf('3d') > -1 && !r.has3d) return false;
    if (f.media.indexOf('video') > -1 && !r.hasVideo) return false;
    if (f.media.indexOf('kitchen') > -1 && !r.hasKitchen) return false;
    if (f.fac.some(x => (r.fac || []).indexOf(x) < 0)) return false;
    if (f.offers.indexOf('deal') > -1 && !r.deal) return false;
    if (f.group >= 10 && (r.seats || 0) < 80) return false;
    return true;
  }
  function activeCount(f) { f = f || F; let n = 0; if (f.max < 2000) n++; if (f.open) n++; if (f.late) n++; if (f.rating) n++; if (f.group) n++; n += f.areas.length + f.cuisines.length + f.media.length + f.fac.length + f.diet.length + f.offers.length; return n; }
  function sortList(list, f) {
    f = f || F; const a = list.slice();
    if (f.sort === 'price') a.sort((x, y) => x.ppl[0] - y.ppl[0]);
    else if (f.sort === 'rating') a.sort((x, y) => y.rating - x.rating);
    else if (f.sort === 'dist') a.sort((x, y) => x.dist - y.dist);
    else if (f.sort === 'fresh') a.sort((x, y) => x.checked - y.checked);
    else a.sort((x, y) => (y.featured ? 1 : 0) - (x.featured ? 1 : 0) || y.rating * 10 - y.dist - (x.rating * 10 - x.dist));
    return a;
  }
  function openFilters(onApply) {
    let f = JSON.parse(JSON.stringify(F));
    const chip = (grp, val, label, icon, on) => `<button class="chip" data-f="${grp}" data-v="${val}" aria-pressed="${on}">${icon ? ic(icon) : ''}${label}</button>`;
    const multi = (grp, list) => list.map(([v, en, bn, i]) => chip(grp, v, lang === 'bn' ? bn : en, i, f[grp].indexOf(v) > -1)).join('');
    const one = (grp, list) => list.map(([v, en, bn, i]) => chip(grp, v, lang === 'bn' ? bn : en, i, String(f[grp]) === String(v))).join('');
    const body = `
      <div class="fg"><h4>${t('sort')}</h4><div class="chips">${one('sort', [['best', t('sBest'), t('sBest')], ['price', t('sPrice'), t('sPrice')], ['rating', t('sRating'), t('sRating')], ['dist', t('sDist'), t('sDist')], ['fresh', t('sFresh'), t('sFresh')]])}</div></div>
      <div class="fg"><h4>${t('budgetPP')} <small data-maxlbl></small></h4><input class="rng" type="range" min="100" max="2000" step="50" value="${f.max}" data-max aria-label="${t('budgetPP')}"><div class="rngv"><span>${tk(100)}</span><span>${tk(2000)}+</span></div>
        <div class="chips" style="margin-top:12px">${[[300, 'u300'], [600, 'u600'], [1200, 'u1200'], [2000, 'any']].map(([v]) => `<button class="chip" data-quickmax="${v}" aria-pressed="${f.max === v}">${v === 2000 ? t('anyBudget') : t('under', { p: tk(v) })}</button>`).join('')}</div></div>
      <div class="fg"><h4>${t('when')}</h4><div class="chips"><button class="chip" data-fb="open" aria-pressed="${f.open}">${ic('clock')}${t('openNow')}</button><button class="chip" data-fb="late" aria-pressed="${f.late}">${ic('moon-stars')}${t('openLate')}</button></div></div>
      <div class="fg"><h4>${t('seeBefore')}</h4><div class="chips">${multi('media', [['3d', t('hasTour'), t('hasTour'), 'cube-focus'], ['video', t('hasVideo'), t('hasVideo'), 'play'], ['kitchen', t('hasKitchen'), t('hasKitchen'), 'cooking-pot']])}</div></div>
      <div class="fg"><h4>${t('area')}</h4><div class="chips">${multi('areas', D.areas.map(a => [a.id, a.en, a.bn]))}</div></div>
      <div class="fg"><h4>${t('cuisine')}</h4><div class="chips">${multi('cuisines', CUIS)}</div></div>
      <div class="fg"><h4>${t('rating')}</h4><div class="chips">${one('rating', [[0, t('any'), t('any')], [4, '4.0+', '৪.০+', 'star'], [4.5, '4.5+', '৪.৫+', 'star']])}</div></div>
      <div class="fg"><h4>${t('facilities')}</h4><div class="chips">${multi('fac', Object.keys(D.fac).map(k => [k, D.fac[k].en, D.fac[k].bn, D.fac[k].i]))}</div></div>
      <div class="fg"><h4>${t('group')}</h4><div class="chips">${one('group', [[0, t('any'), t('any')], [2, '2', '২'], [4, '4', '৪'], [6, '6', '৬'], [10, '10+', '১০+']])}</div></div>
      <div class="fg"><h4>${t('dietary')}</h4><div class="chips">${multi('diet', [['halal', t('halal'), t('halal')], ['veg', t('veg'), t('veg'), 'leaf'], ['mild', t('mild'), t('mild')]])}</div></div>
      <div class="fg"><h4>${t('offers')}</h4><div class="chips">${multi('offers', [['deal', t('hasDeal'), t('hasDeal'), 'tag'], ['buffet', t('buffet'), t('buffet'), 'fork-knife'], ['new', t('newOpen'), t('newOpen'), 'sparkle']])}</div></div>`;
    const s = openSheet({ title: t('filters'), body, foot: `<button class="btn line" data-fclear>${t('clearAll')}</button><button class="btn" data-fapply></button>` });
    const upd = () => {
      const n = D.restaurants.filter(r => matches(r, f)).length;
      s.querySelector('[data-fapply]').textContent = n === 0 ? t('showNone') : n === 1 ? t('showOne') : t('showN', { n: N(n) });
      s.querySelector('[data-maxlbl]').textContent = f.max >= 2000 ? t('anyBudget') : t('upTo', { p: tk(f.max) });
      s.querySelectorAll('[data-quickmax]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.quickmax) === f.max)));
    };
    s.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.f) {
        const g = b.dataset.f, v = b.dataset.v;
        if (Array.isArray(f[g])) { const i = f[g].indexOf(v); i > -1 ? f[g].splice(i, 1) : f[g].push(v); b.setAttribute('aria-pressed', String(i < 0)); }
        else { f[g] = isNaN(Number(v)) ? v : Number(v); b.parentElement.querySelectorAll('[data-f]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }
      } else if (b.dataset.fb) { f[b.dataset.fb] = !f[b.dataset.fb]; b.setAttribute('aria-pressed', String(f[b.dataset.fb])); }
      else if (b.dataset.quickmax) { f.max = Number(b.dataset.quickmax); s.querySelector('[data-max]').value = f.max; }
      else if (b.hasAttribute('data-fclear')) { closeSheet(); F = F0(); store.set('filters', F); openFilters(onApply); return; }
      else if (b.hasAttribute('data-fapply')) { F = f; store.set('filters', F); closeSheet(); if (onApply) onApply(F); else location.href = href('search.html'); return; }
      upd();
    });
    s.querySelector('[data-max]').addEventListener('input', e => { f.max = Number(e.target.value); upd(); });
    upd();
  }

  /* ---------- bill ---------- */
  const billSubs = [];
  const Bill = {
    get(rid) { return store.get('bill_' + rid, { items: {}, people: 2 }); },
    save(rid, b) { store.set('bill_' + rid, b); billSubs.forEach(f => f(rid)); },
    add(rid, id, d) { const b = this.get(rid); b.items[id] = Math.max(0, (b.items[id] || 0) + d); if (!b.items[id]) delete b.items[id]; this.save(rid, b); },
    people(rid, d) { const b = this.get(rid); b.people = Math.min(40, Math.max(1, b.people + d)); this.save(rid, b); },
    clear(rid) { const b = this.get(rid); b.items = {}; this.save(rid, b); },
    qty(rid, id) { return this.get(rid).items[id] || 0; },
    calc(rid) {
      const r = R(rid), b = this.get(rid); let sub = 0, count = 0; const lines = [];
      for (const id in b.items) { const m = r.menu.find(x => x.id === id); if (!m) continue; const q = b.items[id]; sub += m.price * q; count += q; lines.push({ m, q }); }
      const vat = Math.round(sub * r.vat / 100), svc = Math.round(sub * r.service / 100), tot = sub + vat + svc;
      return { lines, sub, vat, svc, tot, count, people: b.people, each: Math.ceil(tot / b.people), r };
    },
    on(f) { billSubs.push(f); }
  };
  function stepper(rid, id, q, sm) { return `<span class="step${sm ? ' sm' : ''}"><button data-bq="${id}" data-rid="${rid}" data-d="-1" aria-label="−">${ic('minus')}</button><span>${N(q)}</span><button data-bq="${id}" data-rid="${rid}" data-d="1" aria-label="+">${ic('plus')}</button></span>`; }
  function addBtn(rid, id) { const q = Bill.qty(rid, id); return q ? stepper(rid, id, q) : `<button class="addb" data-bq="${id}" data-rid="${rid}" data-d="1">${ic('plus')}${t('add')}</button>`; }
  function billHTML(rid) {
    const c = Bill.calc(rid);
    const ppl = `<div class="ppl"><b>${t('people')}</b><span class="step"><button data-bp="${rid}" data-d="-1" aria-label="−">${ic('minus')}</button><span>${N(c.people)}</span><button data-bp="${rid}" data-d="1" aria-label="+">${ic('plus')}</button></span></div>`;
    if (!c.count) return `<div class="bill">${ppl}<div class="empty">${ic('receipt')}<span>${t('billEmpty')}</span></div></div>`;
    return `<div class="bill">${c.lines.map(({ m, q }) => `<div class="li"><div class="n">${L(m.name)}<small>${tk(m.price)} × ${N(q)}</small></div>${stepper(rid, m.id, q, 1)}<div class="p">${tk(m.price * q)}</div></div>`).join('')}
      <div style="height:8px"></div><div class="row"><span>${t('subtotal')}</span><b>${tk(c.sub)}</b></div>
      ${c.r.vat ? `<div class="row"><span>${t('vat', { v: N(c.r.vat) })}</span><b>${tk(c.vat)}</b></div>` : ''}
      ${c.r.service ? `<div class="row"><span>${t('svc', { v: N(c.r.service) })}</span><b>${tk(c.svc)}</b></div>` : ''}
      <div class="tot"><span>${t('total')}</span><span class="num">${tk(c.tot)}</span></div>
      ${ppl}<div class="pp"><span>${t('each')}</span><b>${tk(c.each)}</b></div>
      <p class="nt">${t('billNote', { n: N(c.r.checked) })}</p></div>`;
  }
  function billText(rid) { const c = Bill.calc(rid); return L(c.r.name) + '\n' + c.lines.map(({ m, q }) => `${L(m.name)} × ${q} = ৳${fmt(m.price * q)}`).join('\n') + `\n${t('total')}: ৳${fmt(c.tot)} · ${t('each')}: ৳${fmt(c.each)} (${c.people})`; }
  function openBill(rid) {
    const render = () => `<div data-billbody>${billHTML(rid)}</div>`;
    const s = openSheet({ title: t('bill') + ' · ' + L(R(rid).name), body: render(), foot: `<button class="btn line" data-bclear="${rid}">${t('clear')}</button><a class="btn" target="_blank" rel="noopener" data-bshare="${rid}">${ic('whatsapp-logo')}${t('shareBill')}</a>` });
    const sync = () => { const b = s.querySelector('[data-billbody]'); if (b) b.innerHTML = billHTML(rid); const a = s.querySelector('[data-bshare]'); if (a) a.href = 'https://wa.me/?text=' + encodeURIComponent(billText(rid)); };
    Bill.on(r => { if (r === rid && sheetEl.classList.contains('on')) sync(); }); sync();
  }

  /* ---------- global events ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-theme-toggle],[data-lang],[data-save],[data-share],[data-area-open],[data-filters-open],[data-bq],[data-bp],[data-bclear],[data-demo],[data-close-sheet]');
    if (!el) return;
    if (el.hasAttribute('data-theme-toggle')) {
      theme = theme === 'dark' ? 'light' : 'dark'; root.dataset.theme = theme; store.set('theme', theme);
      if (qs.has('theme')) { qs.set('theme', theme); history.replaceState(null, '', '?' + qs.toString() + location.hash); }
      document.querySelectorAll('[data-theme-toggle]').forEach(b => b.innerHTML = ic(theme === 'dark' ? 'sun' : 'moon'));
      document.dispatchEvent(new CustomEvent('kb:theme'));
    } else if (el.dataset.lang) {
      if (el.dataset.lang === lang) return; store.set('lang', el.dataset.lang);
      if (qs.has('lang')) qs.set('lang', el.dataset.lang); else qs.set('lang', el.dataset.lang);
      location.search = '?' + qs.toString();
    } else if (el.hasAttribute('data-save')) {
      e.preventDefault(); const on = el.getAttribute('aria-pressed') !== 'true'; el.setAttribute('aria-pressed', String(on));
      el.innerHTML = ic('heart', on); if (on) toast(t('saved'));
    } else if (el.hasAttribute('data-share')) {
      e.preventDefault(); const u = location.href;
      if (navigator.share) navigator.share({ title: document.title, url: u }).catch(() => {});
      else { try { navigator.clipboard.writeText(u); } catch (x) {} toast(t('linkCopied')); }
    } else if (el.hasAttribute('data-area-open')) { e.preventDefault(); openArea(); }
    else if (el.hasAttribute('data-filters-open')) { e.preventDefault(); openFilters(window.KB_onFilters); }
    else if (el.dataset.bq) { e.preventDefault(); Bill.add(el.dataset.rid, el.dataset.bq, Number(el.dataset.d)); }
    else if (el.dataset.bp) { e.preventDefault(); Bill.people(el.dataset.bp, Number(el.dataset.d)); }
    else if (el.dataset.bclear) { Bill.clear(el.dataset.bclear); }
    else if (el.hasAttribute('data-demo')) { e.preventDefault(); toast(t('demo')); }
    else if (el.hasAttribute('data-close-sheet')) closeSheet();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  /* ---------- mount ---------- */
  function shell(o) {
    o = o || {};
    const h = document.getElementById('hdr-slot'); if (h) h.outerHTML = header(o.active);
    const f = document.getElementById('ftr-slot'); if (f) f.outerHTML = footer();
    if (o.bnav !== false) { document.body.insertAdjacentHTML('beforeend', bnav(o.active)); document.body.classList.add('has-bnav'); }
    const hdr = document.getElementById('hdr');
    const onS = () => hdr && hdr.classList.toggle('sc', scrollY > 4); addEventListener('scroll', onS, { passive: true }); onS();
    document.title = (o.title ? o.title + ' · ' : '') + 'khabo';
  }

  window.APP = { D, t, addT, N, fmt, tk, L, img, ic, R, areaOf, esc, href, fmtTime, openState, pplText, stars, rcard, shell, openSheet, closeSheet, toast,
    openArea, areaLabel, getArea, openFilters, matches, sortList, activeCount, getF: () => F, setF: f => { F = Object.assign(F0(), f); store.set('filters', F); }, F0,
    Bill, billHTML, openBill, addBtn, stepper, store, qs, lang: () => lang, theme: () => theme, NOW, logoSvg };
})();
