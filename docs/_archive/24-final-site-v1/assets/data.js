/* Demo data for the design prototype. All restaurants are fictional.
   Photos: Unsplash · 360° rooms: Poly Haven (CC0) · Videos: Mixkit (free licence). */
window.KH = (function () {
  const P = {
    /* food */
    kt:'1589302168068-964664d93dc0', k:'1563379091339-03b21ab4a4f8', te:'1631515243349-e0cb75fb8d3a', po:'1588644525273-f37b60d78512',
    th:'1743674453123-93356ade2891', ch:'1599487488170-d11ec9c172f0', na:'1565557623262-b51c2513a641', fi:'1652954008429-ce394eacbd7f',
    fu:'1781243680771-1fea4521e196', pl:'1633945274405-b6c8069047b0', sk:'1603360946369-dc9bb6258143', sm:'1786603449553-d94235e87fe5',
    bw:'1712757248842-04f6e3844374', tb:'1698751963561-f567afae288e', bp:'1752673508949-f4aeeaef75f0', hd:'1697155406055-2db32d47ca07',
    b3:'1633945274309-2c16c9682a8c', b4:'1714611626323-5ba6204453be',
    /* inside */
    in:'1517248135467-4c7edcad34c4', ro:'1526069631228-723c945bea6b', di:'1709548145082-04d0cde481d4', i2:'1667388969250-1c7220bf3f37',
    i3:'1538334421852-687c439c92f4', i4:'1570560258879-af7f8e1447ac', i5:'1636405189493-181ecf851006', iA:'1751200503125-d8cb239f95ba',
    iB:'1749137011592-0a77520c82dc', iC:'1651684081211-602801541b08', iD:'1780345493801-d343616b49b1',
    /* outside */
    ex1:'1759866614069-e5b93d17e663', ex2:'1793346460209-d70c68c8c16c', ex3:'1579027989536-b7b1f875659b',
    /* kitchen */
    kc1:'1600565193348-f74bd3c7ccdf', kc2:'1763951718950-c536b1295213', kc3:'1588416820614-f8d6ac6cea56', kc4:'1622021142947-da7dedc7c39a', kc5:'1792582427557-14fa39dbe877'
  };
  const PANO = n => h => `https://cdn.polyhaven.com/asset_img/primary/${n}.png?height=${h || 1024}`;
  const V = id => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
  const VIDEO = { promo: V(29050), kitchen: V(15875), grill: V(4678), serve: V(4672), diners: V(4385) };

  const areas = [
    { id:'dhanmondi', city:'dhaka', en:'Dhanmondi', bn:'ধানমন্ডি', n:9 },
    { id:'gulshan', city:'dhaka', en:'Gulshan', bn:'গুলশান', n:7 },
    { id:'banani', city:'dhaka', en:'Banani', bn:'বনানী', n:6 },
    { id:'mirpur', city:'dhaka', en:'Mirpur', bn:'মিরপুর', n:8 },
    { id:'uttara', city:'dhaka', en:'Uttara', bn:'উত্তরা', n:6 },
    { id:'mohammadpur', city:'dhaka', en:'Mohammadpur', bn:'মোহাম্মদপুর', n:4 },
    { id:'bashundhara', city:'dhaka', en:'Bashundhara', bn:'বসুন্ধরা', n:3 },
    { id:'old-dhaka', city:'dhaka', en:'Old Dhaka', bn:'পুরান ঢাকা', n:5 },
    { id:'jaleshwaritola', city:'bogura', en:'Jaleshwaritola', bn:'জলেশ্বরীতলা', n:6 },
    { id:'satmatha', city:'bogura', en:'Satmatha', bn:'সাতমাথা', n:3 }
  ];
  const cities = { dhaka:{ en:'Dhaka', bn:'ঢাকা' }, bogura:{ en:'Bogura', bn:'বগুড়া' } };

  const cats = [
    { id:'biryani', en:'Biryani', bn:'বিরিয়ানি', p:'k' }, { id:'kebab', en:'Kebab', bn:'কাবাব', p:'sk' },
    { id:'fuchka', en:'Fuchka', bn:'ফুচকা', p:'fu' }, { id:'fish', en:'Fish', bn:'মাছ', p:'fi' },
    { id:'naan', en:'Naan', bn:'নান', p:'na' }, { id:'polao', en:'Polao', bn:'পোলাও', p:'po' },
    { id:'thali', en:'Thali', bn:'থালি', p:'th' }, { id:'platters', en:'Platters', bn:'প্ল্যাটার', p:'pl' },
    { id:'tehari', en:'Tehari', bn:'তেহারি', p:'te' }
  ];
  const moreCats = [
    ['kacchi','Kacchi','কাচ্চি','cooking-pot',31],['chinese','Chinese','চাইনিজ','bowl-steam',24],['haleem','Haleem','হালিম','bowl-food',12],
    ['bbq','BBQ & grill','বিবিকিউ ও গ্রিল','fire',19],['bhorta','Bhorta-bhaat','ভর্তা-ভাত','grains',14],['seafood','Seafood','সি-ফুড','fish-simple',9],
    ['thai','Thai','থাই','pepper',11],['pizza','Pizza','পিৎজা','pizza',16],['burger','Burger','বার্গার','hamburger',18],
    ['cafe','Café & tea','ক্যাফে ও চা','coffee',22],['dessert','Mishti & dessert','মিষ্টি ও ডেজার্ট','cake',15],['doi','Doi (Bogura)','দই (বগুড়া)','bowl-food',6],
    ['pitha','Pitha','পিঠা','cookie',7],['iftar','Iftar','ইফতার','moon-stars',20],['buffet','Buffet','বুফে','fork-knife',10],
    ['breakfast','Breakfast','নাস্তা','egg',13],['lassi','Juice & lassi','জুস ও লাচ্ছি','orange-slice',17],['icecream','Ice cream','আইসক্রিম','ice-cream',8]
  ];

  /* menu item: [id, en, bn, price, cat, photo, portion{en,bn}, spice 0-3, media flags, desc] */
  const M = (id,en,bn,price,cat,p,por,spice,media,desc,tags) => ({ id,name:{en,bn},price,cat,p,por,spice,media:media||'',desc,tags:tags||[] });
  const por = (en,bn)=>({en,bn});

  const restaurants = [
    {
      id:'shahi-handi', name:{en:'Shahi Handi House',bn:'শাহী হান্ডি হাউস'}, mono:'SH', area:'dhanmondi', city:'dhaka', spot:{en:'Road 27, Dhanmondi',bn:'রোড ২৭, ধানমন্ডি'},
      cuisines:[{en:'Mughlai',bn:'মোগলাই'},{en:'Kacchi',bn:'কাচ্চি'},{en:'Bangladeshi',bn:'বাংলাদেশি'}],
      rating:4.6, reviews:362, verified:214, ppl:[450,650], hours:['11:00','23:30'], dist:1.2, plan:'premium',
      has3d:true, hasVideo:true, hasKitchen:true, featured:true, founding:true, checked:2, photosDate:'Oct 2026',
      photos:{ inside:['in','iA','iB','iC'], outside:['ex1'], kitchen:['kc2','kc1','kc3','hd'], food:['kt','bp','sk','po','ch','na','tb','b3'] },
      hero:['in','iA','ex1','iB','kc2','iC'],
      tour:[{id:'hall',en:'Main hall',bn:'মূল হল',pano:'warm_restaurant_night'},{id:'buffet',en:'Buffet hall',bn:'বুফে হল',pano:'warm_reception_dinner'},{id:'cabin',en:'Family cabin',bn:'ফ্যামিলি কেবিন',pano:'comfy_cafe'},{id:'terrace',en:'Terrace',bn:'টেরেস',pano:'bush_restaurant'}],
      video:{ src:VIDEO.promo, poster:'iA', len:'0:30' }, kitchenVideo:{ src:VIDEO.kitchen, poster:'kc1', len:'0:24', date:{en:'Filmed 12 Oct 2026',bn:'ধারণ ১২ অক্টোবর ২০২৬'} },
      phone:'+880 1700-000127', address:{en:'House 32, Road 27 (old), Dhanmondi, Dhaka 1209',bn:'বাড়ি ৩২, রোড ২৭ (পুরাতন), ধানমন্ডি, ঢাকা ১২০৯'},
      vat:5, service:5, seats:140,
      fac:['cabin','ac','parking','prayer','generator','kids','wheelchair','wifi'],
      pay:['Cash','bKash','Nagad','Card'],
      deal:{ off:'15%', en:'Family Feast for 4, 15% off', bn:'৪ জনের ফ্যামিলি ফিস্ট, ১৫% ছাড়', when:{en:'Sunday to Thursday, lunch and dinner',bn:'রবি থেকে বৃহস্পতি, দুপুর ও রাত'}, price:1690, was:1990, p:'tb' },
      menu:[
        M('mutton-kacchi','Mutton Kacchi Biryani','মাটন কাচ্চি বিরিয়ানি',380,'biryani','kt',por('Serves 1 · 2 pcs mutton, aloo','১ জন · ২ পিস মাটন, আলু'),1,'v3','Basmati rice and mutton slow-cooked together in a sealed handi, with aloo and a boiled egg on request.',['best']),
        M('chicken-biryani','Chicken Biryani','চিকেন বিরিয়ানি',260,'biryani','k',por('Serves 1 · 1 leg piece','১ জন · ১ লেগ পিস'),1,'','Chicken biryani with kalijira rice and a light ghee finish.'),
        M('kacchi-handi','Kacchi Handi for 4','কাচ্চি হান্ডি (৪ জন)',1450,'biryani','hd',por('Serves 4 · 8 pcs mutton','৪ জন · ৮ পিস মাটন'),1,'v3','The full sealed handi opened at your table.',['share']),
        M('morog-polao','Morog Polao','মোরগ পোলাও',290,'biryani','po',por('Serves 1','১ জন'),0,'','Fragrant polao with a whole quarter chicken.'),
        M('shami-kabab','Shami Kabab','শামি কাবাব',90,'kebab','sk',por('1 piece','১ পিস'),1,'','Minced beef and lentil patty, pan-fried.'),
        M('chicken-chap','Chicken Chap','চিকেন চাপ',180,'kebab','ch',por('Serves 1 · half','১ জন · হাফ'),2,'v','Flattened chicken marinated overnight, grilled on charcoal.'),
        M('mutton-seekh','Mutton Seekh Kabab','মাটন শিক কাবাব',220,'kebab','sk',por('2 skewers','২ শিক'),2,'v','Hand-pressed mutton on skewers over coal.'),
        M('mutton-rezala','Mutton Rezala','মাটন রেজালা',340,'curry','b3',por('Serves 1–2','১–২ জন'),1,'','White, mildly spiced gravy with yoghurt and cashew.'),
        M('chicken-roast','Chicken Roast','চিকেন রোস্ট',260,'curry','b4',por('1 quarter','১ কোয়ার্টার'),0,'','Wedding-style sweet and rich roast.'),
        M('butter-naan','Butter Naan','বাটার নান',50,'bread','na',por('1 piece','১ পিস'),0,'v','From the clay tandoor, brushed with butter.'),
        M('borhani','Borhani','বোরহানি',80,'drinks','sm',por('1 glass','১ গ্লাস'),1,'','Spiced yoghurt drink with mint.'),
        M('firni','Firni','ফিরনি',90,'dessert','bw',por('1 clay bowl','১ মাটির বাটি'),0,'','Chilled rice pudding set in a clay bowl.')
      ]
    },
    {
      id:'nodir-paar', name:{en:'Nodir Paar',bn:'নদীর পাড়'}, mono:'NP', area:'gulshan', city:'dhaka', spot:{en:'Gulshan 2',bn:'গুলশান ২'},
      cuisines:[{en:'Bengali',bn:'বাঙালি'},{en:'Fish',bn:'মাছ'},{en:'Bhorta',bn:'ভর্তা'}],
      rating:4.5, reviews:241, verified:158, ppl:[600,1200], hours:['12:00','23:00'], dist:3.4, plan:'pro',
      has3d:true, hasVideo:true, hasKitchen:true, founding:true, checked:4,
      photos:{ inside:['i2','iD'], outside:['ex2'], kitchen:['kc4'], food:['fi','pl','th','bw'] }, hero:['i2','fi','iD','ex2','pl'],
      tour:[{id:'hall',en:'Dining room',bn:'ডাইনিং',pano:'warm_restaurant'},{id:'terrace',en:'River terrace',bn:'নদীর টেরেস',pano:'bush_restaurant'}],
      video:{ src:VIDEO.diners, poster:'i2', len:'0:28' }, kitchenVideo:{ src:VIDEO.kitchen, poster:'kc4', len:'0:20', date:{en:'Filmed 3 Oct 2026',bn:'ধারণ ৩ অক্টোবর ২০২৬'} },
      phone:'+880 1700-000233', address:{en:'Road 90, Gulshan 2, Dhaka',bn:'রোড ৯০, গুলশান ২, ঢাকা'}, vat:10, service:5, seats:90,
      fac:['ac','parking','cabin','wifi','wheelchair'], pay:['Cash','bKash','Card'],
      menu:[
        M('shorshe-ilish','Shorshe Ilish','সর্ষে ইলিশ',650,'fish','fi',por('1 large piece','১টি বড় পিস'),2,'v','Padma hilsa in mustard paste, steamed.',['best']),
        M('mezban-platter','Mezban Platter','মেজবান প্ল্যাটার',1690,'platters','pl',por('Serves 3–4','৩–৪ জন'),2,'3','Beef mezbani, chana dal, rice and bhorta.',['share']),
        M('bengali-thali','Bengali Thali','বাঙালি থালি',520,'thali','th',por('Serves 1 · 9 items','১ জন · ৯ পদ'),1,'','Rice, dal, three bhortas, fish, veg and dessert.'),
        M('iftar-platter','Iftar Platter','ইফতার প্ল্যাটার',1450,'platters','bw',por('Serves 4','৪ জন'),1,'','Seasonal iftar box.')
      ]
    },
    {
      id:'kabab-ghor', name:{en:'Kabab Ghor',bn:'কাবাব ঘর'}, mono:'KG', area:'mohammadpur', city:'dhaka', spot:{en:'Tajmahal Road, Mohammadpur',bn:'তাজমহল রোড, মোহাম্মদপুর'},
      cuisines:[{en:'Kebab',bn:'কাবাব'},{en:'Grill',bn:'গ্রিল'},{en:'Naan',bn:'নান'}],
      rating:4.4, reviews:518, verified:301, ppl:[300,550], hours:['16:00','01:00'], dist:2.6, plan:'pro',
      has3d:false, hasVideo:true, hasKitchen:true, checked:1,
      photos:{ inside:['iC'], outside:['ex3'], kitchen:['kc2','kc5'], food:['sk','ch','na'] }, hero:['iC','sk','kc5','ch','na'],
      video:{ src:VIDEO.grill, poster:'kc2', len:'0:25' }, kitchenVideo:{ src:VIDEO.grill, poster:'kc5', len:'0:25', date:{en:'Filmed 28 Sep 2026',bn:'ধারণ ২৮ সেপ্টেম্বর ২০২৬'} },
      phone:'+880 1700-000348', address:{en:'Tajmahal Road, Mohammadpur, Dhaka',bn:'তাজমহল রোড, মোহাম্মদপুর, ঢাকা'}, vat:5, service:0, seats:70,
      fac:['ac','generator','kids'], pay:['Cash','bKash','Nagad'],
      menu:[
        M('kg-chap','Beef Chap','বিফ চাপ',200,'kebab','ch',por('Serves 1','১ জন'),2,'v','Charcoal-grilled beef chap.',['best']),
        M('kg-seekh','Seekh Kabab','শিক কাবাব',160,'kebab','sk',por('2 skewers','২ শিক'),2,'',''),
        M('kg-naan','Garlic Naan','গার্লিক নান',60,'bread','na',por('1 piece','১ পিস'),0,'',''),
        M('kg-kacchi','Mutton Kacchi','মাটন কাচ্চি',340,'biryani','bp',por('Serves 1','১ জন'),1,'','')
      ]
    },
    {
      id:'kathgolap', name:{en:'Kathgolap Rooftop',bn:'কাঠগোলাপ রুফটপ'}, mono:'KR', area:'banani', city:'dhaka', spot:{en:'Road 11, Banani',bn:'রোড ১১, বনানী'},
      cuisines:[{en:'Bangladeshi',bn:'বাংলাদেশি'},{en:'Chinese',bn:'চাইনিজ'},{en:'Grill',bn:'গ্রিল'}],
      rating:4.3, reviews:176, verified:102, ppl:[700,1400], hours:['15:00','00:00'], dist:4.1, plan:'premium',
      has3d:true, hasVideo:true, featured:true, checked:3,
      photos:{ inside:['i5','ro'], outside:['ro'], kitchen:[], food:['pl','bw','kt'] }, hero:['i5','ro','pl','bw'],
      tour:[{id:'roof',en:'Rooftop',bn:'রুফটপ',pano:'bush_restaurant'},{id:'hall',en:'Indoor',bn:'ভেতর',pano:'comfy_cafe'}],
      video:{ src:VIDEO.diners, poster:'i5', len:'0:45' }, phone:'+880 1700-000412', address:{en:'Road 11, Banani, Dhaka',bn:'রোড ১১, বনানী, ঢাকা'}, vat:10, service:10, seats:120,
      fac:['rooftop','ac','parking','wifi','cabin'], pay:['Cash','bKash','Card'],
      menu:[ M('kr-kacchi','Kacchi Biryani','কাচ্চি বিরিয়ানি',450,'biryani','kt',por('Serves 1','১ জন'),1,'',''), M('kr-platter','BBQ Platter','বিবিকিউ প্ল্যাটার',1890,'platters','pl',por('Serves 4','৪ জন'),2,'v3','') ]
    },
    {
      id:'cha-adda', name:{en:'Cha Adda',bn:'চা আড্ডা'}, mono:'CA', area:'dhanmondi', city:'dhaka', spot:{en:'Road 9/A, Dhanmondi',bn:'রোড ৯/এ, ধানমন্ডি'},
      cuisines:[{en:'Café',bn:'ক্যাফে'},{en:'Snacks',bn:'নাস্তা'}],
      rating:4.5, reviews:302, verified:188, ppl:[150,350], hours:['08:00','23:00'], dist:0.8, plan:'starter',
      checked:5, photos:{ inside:['i3'], outside:[], kitchen:[], food:['sm','fu'] }, hero:['i3','sm','fu'],
      phone:'+880 1700-000519', address:{en:'Road 9/A, Dhanmondi, Dhaka',bn:'রোড ৯/এ, ধানমন্ডি, ঢাকা'}, vat:5, service:0, seats:40, fac:['wifi','ac'], pay:['Cash','bKash'],
      menu:[ M('ca-chai','Masala Chai','মসলা চা',40,'drinks','sm',por('1 cup','১ কাপ'),0,'',''), M('ca-fuchka','Fuchka','ফুচকা',120,'snacks','fu',por('8 pieces','৮ পিস'),2,'','') ]
    },
    {
      id:'mirpur-bawarchi', name:{en:'Mirpur Bawarchi',bn:'মিরপুর বাবুর্চি'}, mono:'MB', area:'mirpur', city:'dhaka', spot:{en:'Section 10, Mirpur',bn:'সেকশন ১০, মিরপুর'},
      cuisines:[{en:'Tehari',bn:'তেহারি'},{en:'Biryani',bn:'বিরিয়ানি'},{en:'Bangladeshi',bn:'বাংলাদেশি'}],
      rating:4.2, reviews:689, verified:377, ppl:[180,350], hours:['10:30','23:00'], dist:6.2, plan:'starter',
      checked:3, photos:{ inside:['di','iC'], outside:['ex3'], kitchen:[], food:['te','k','po','b4','sk','na'] }, hero:['di','te','iC','k','po'],
      phone:'+880 1700-000604', address:{en:'Plot 14, Section 10, Mirpur, Dhaka 1216',bn:'প্লট ১৪, সেকশন ১০, মিরপুর, ঢাকা ১২১৬'}, vat:5, service:0, seats:60,
      fac:['ac','generator','kids'], pay:['Cash','bKash','Nagad'],
      menu:[
        M('beef-tehari','Beef Tehari','বিফ তেহারি',220,'biryani','te',por('Serves 1','১ জন'),2,'','Mustard-oil tehari with small beef cubes and green chilli.',['best']),
        M('mb-kacchi','Mutton Kacchi','মাটন কাচ্চি',320,'biryani','k',por('Serves 1','১ জন'),1,'',''),
        M('mb-polao','Chicken Polao','চিকেন পোলাও',240,'biryani','po',por('Serves 1','১ জন'),0,'',''),
        M('mb-roast','Chicken Roast','চিকেন রোস্ট',180,'curry','b4',por('1 quarter','১ কোয়ার্টার'),0,'',''),
        M('mb-borhani','Borhani','বোরহানি',60,'drinks','sm',por('1 glass','১ গ্লাস'),1,'','')
      ]
    },
    {
      id:'lake-view', name:{en:'Lake View Café',bn:'লেক ভিউ ক্যাফে'}, mono:'LV', area:'dhanmondi', city:'dhaka', spot:{en:'Dhanmondi Lake',bn:'ধানমন্ডি লেক'},
      cuisines:[{en:'Café',bn:'ক্যাফে'},{en:'Fuchka',bn:'ফুচকা'}], rating:4.1, reviews:154, verified:77, ppl:[200,450], hours:['09:00','22:30'], dist:1.6, plan:'starter',
      checked:6, photos:{ inside:['i4'], outside:[], kitchen:[], food:['fu','sm'] }, hero:['i4','fu','sm'], phone:'+880 1700-000711', address:{en:'Road 8, Dhanmondi Lake, Dhaka',bn:'রোড ৮, ধানমন্ডি লেক, ঢাকা'}, vat:5, service:0, seats:50, fac:['wifi','rooftop'], pay:['Cash','bKash'],
      menu:[ M('lv-fuchka','Doi Fuchka','দই ফুচকা',150,'snacks','fu',por('8 pieces','৮ পিস'),1,'','') ]
    },
    {
      id:'garden-rooftop', name:{en:'Garden Rooftop',bn:'গার্ডেন রুফটপ'}, mono:'GR', area:'uttara', city:'dhaka', spot:{en:'Sector 7, Uttara',bn:'সেক্টর ৭, উত্তরা'},
      cuisines:[{en:'Thai',bn:'থাই'},{en:'Chinese',bn:'চাইনিজ'}], rating:4.3, reviews:128, verified:66, ppl:[500,900], hours:['12:00','23:30'], dist:9.5, plan:'pro',
      has3d:true, checked:2, photos:{ inside:['ro'], outside:['ex1'], kitchen:[], food:['pl'] }, hero:['ro','ex1','pl'],
      tour:[{id:'roof',en:'Rooftop',bn:'রুফটপ',pano:'bush_restaurant'}], phone:'+880 1700-000802', address:{en:'Sector 7, Uttara, Dhaka',bn:'সেক্টর ৭, উত্তরা, ঢাকা'}, vat:10, service:5, seats:100, fac:['rooftop','parking','ac'], pay:['Cash','Card'],
      menu:[ M('gr-platter','Thai Platter','থাই প্ল্যাটার',1290,'platters','pl',por('Serves 3','৩ জন'),2,'','') ]
    },
    {
      id:'mahasthan-bhoj', name:{en:'Mahasthan Bhoj',bn:'মহাস্থান ভোজ'}, mono:'MV', area:'jaleshwaritola', city:'bogura', spot:{en:'Jaleshwaritola, Bogura',bn:'জলেশ্বরীতলা, বগুড়া'},
      cuisines:[{en:'Bangladeshi',bn:'বাংলাদেশি'},{en:'Kacchi',bn:'কাচ্চি'},{en:'Doi',bn:'দই'}], rating:4.6, reviews:97, verified:71, ppl:[250,500], hours:['11:00','22:30'], dist:0.6, plan:'pro',
      has3d:true, hasVideo:true, founding:true, checked:2, photos:{ inside:['iB','iA'], outside:['ex1'], kitchen:['kc3'], food:['bp','th','bw'] }, hero:['iB','bp','iA','th'],
      tour:[{id:'hall',en:'Main hall',bn:'মূল হল',pano:'warm_restaurant'},{id:'buffet',en:'Event hall',bn:'অনুষ্ঠান হল',pano:'warm_reception_dinner'}],
      video:{ src:VIDEO.serve, poster:'iB', len:'0:30' }, phone:'+880 1700-000915', address:{en:'Jaleshwaritola, Bogura 5800',bn:'জলেশ্বরীতলা, বগুড়া ৫৮০০'}, vat:5, service:0, seats:110, fac:['cabin','ac','parking','prayer','generator'], pay:['Cash','bKash','Nagad'],
      menu:[ M('mv-kacchi','Kacchi Biryani','কাচ্চি বিরিয়ানি',260,'biryani','bp',por('Serves 1','১ জন'),1,'v3','',['best']), M('mv-doi','Bogura Doi','বগুড়ার দই',120,'dessert','bw',por('1 small pot','১টি ছোট সরা'),0,'','') ]
    },
    {
      id:'shamiana', name:{en:'Shamiana',bn:'শামিয়ানা'}, mono:'SM', area:'banani', city:'dhaka', spot:{en:'Road 17, Banani',bn:'রোড ১৭, বনানী'},
      cuisines:[{en:'Thali',bn:'থালি'},{en:'Bengali',bn:'বাঙালি'}], rating:4.4, reviews:211, verified:120, ppl:[350,700], hours:['12:00','22:30'], dist:3.9, plan:'starter',
      checked:4, photos:{ inside:['iD'], outside:[], kitchen:[], food:['th'] }, hero:['iD','th'], phone:'+880 1700-001020', address:{en:'Road 17, Banani, Dhaka',bn:'রোড ১৭, বনানী, ঢাকা'}, vat:5, service:5, seats:60, fac:['ac','cabin'], pay:['Cash','Card'],
      menu:[ M('sm-thali','Bengali Thali','বাঙালি থালি',320,'thali','th',por('Serves 1','১ জন'),1,'','') ]
    }
  ];

  const fac = {
    cabin:{en:'Family cabins',bn:'ফ্যামিলি কেবিন',i:'users-three'}, ac:{en:'Air-conditioned',bn:'এসি',i:'snowflake'},
    parking:{en:'Parking',bn:'পার্কিং',i:'car'}, prayer:{en:'Prayer room',bn:'নামাজের জায়গা',i:'hands-praying'},
    generator:{en:'Generator backup',bn:'জেনারেটর',i:'lightning'}, kids:{en:'Kids zone',bn:'শিশুদের জায়গা',i:'baby'},
    wheelchair:{en:'Wheelchair access',bn:'হুইলচেয়ার সুবিধা',i:'wheelchair'}, wifi:{en:'Free Wi-Fi',bn:'ফ্রি ওয়াই-ফাই',i:'wifi-high'},
    rooftop:{en:'Rooftop / view',bn:'রুফটপ / ভিউ',i:'buildings'}
  };

  const reviews = [
    { r:'shahi-handi', who:'Tanvir A.', ini:'TA', when:{en:'2 days ago',bn:'২ দিন আগে'}, st:5, vf:true, lang:'bn', t:'কাচ্চির মাংস একদম নরম, আলুটাও ঠিকঠাক। ৪ জন গিয়েছিলাম, বিল এসেছে ১৯৫০ টাকা, অ্যাপে যা দেখেছি প্রায় তাই। ফ্যামিলি কেবিন আগে থেকে বলে রাখলে ভালো।', ord:['Mutton Kacchi','Borhani','Firni'], pics:['kt','iB'], help:24 },
    { r:'shahi-handi', who:'Nusrat J.', ini:'NJ', when:{en:'1 week ago',bn:'১ সপ্তাহ আগে'}, st:4, vf:true, lang:'en', t:'Took my parents for their anniversary. The 3D tour was exactly what we got, the family cabin is quiet and the AC works properly. Kacchi was great, the rezala was a little sweet for me.', ord:['Kacchi Handi for 4','Mutton Rezala'], help:17,
      reply:{ en:'Thank you, Nusrat. We have passed your note on the rezala to our chef.', bn:'ধন্যবাদ, নুসরাত। রেজালা নিয়ে আপনার মতামত আমাদের শেফকে জানানো হয়েছে।' } },
    { r:'shahi-handi', who:'Rafiq H.', ini:'RH', when:{en:'2 weeks ago',bn:'২ সপ্তাহ আগে'}, st:3, vf:true, lang:'bn', t:'Friday te 40 minute wait korte hoyeche. Khabar valo, kintu weekend e age theke call kore jaben.', ord:['Chicken Biryani'], help:31 },
    { r:'shahi-handi', who:'Sadia K.', ini:'SK', when:{en:'3 weeks ago',bn:'৩ সপ্তাহ আগে'}, st:5, vf:false, lang:'en', t:'Seekh kabab straight off the coal, and the naan comes hot. Parking was easy on a weekday evening.', ord:['Mutton Seekh Kabab','Butter Naan'], pics:['sk','na'], help:9 }
  ];

  return { P, PANO, VIDEO, areas, cities, cats, moreCats, restaurants, fac, reviews };
})();
