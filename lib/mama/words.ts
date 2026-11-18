/* Mama's dictionary: how people in Bangladesh ask about food, in Banglish (Bangla in English letters), Bangla and
   English. It is not training: these lines go to the language model with every question, so whichever model
   answers (Gemini, GLM, or one we pick later) learns the same words. To teach Mama a new word, add a line here.
   Each line: the ways people write it = what it means. */

/** asking, time, yes/no */
const ASK = [
  'ki, ki ki, কী, কি = what (ki ki ache = what all is there)',
  'koto, kto, কত = how much / how many',
  'kothay, kothai, koi, kon jaygay, কোথায়, কই = where',
  'kon, konta, konti, kontay, কোন, কোনটা = which',
  'kemon, kmn, kemne, কেমন = how is it / is it good',
  'ache, ase, achhe, আছে = there is / do they have; nai, nei, nay, নাই, নেই = there is not',
  'jawa jay, jaoa jay, jabo, jaite pari, যাওয়া যায় = is it worth going / can we go',
  'khola, open, খোলা = open; bondho, bondo, বন্ধ = closed; koyta porjonto, কয়টা পর্যন্ত = until what time',
  'ekhon, akhon, এখন = now; aj, ajke, আজ = today; kal, kalke, কাল = tomorrow (or yesterday); porshu = day after tomorrow',
  'shokal, sokal, সকাল = morning; dupur, দুপুর = lunch time; bikal, bikel, বিকাল = afternoon; shondha, sondha, সন্ধ্যা = evening; rat, raat, rate, raate, rater, রাত, রাতে = night / at night (check the hours: it must be open then); late night, beshi rat, gobhir rat = after 11pm',
  'bolo, bolen, bolun, dao, den, dekhao, বলো, দাও = tell me / show me; list dao = give a list',
  'hobe, hbe, হবে = will it be / is it possible; parbo, pari, পারি = can I',
  'r, ar, আর = and / more (r ki = what else); aro, আরো = more',
  'ei, eta, eita, eitay, ekhane, eikhane, এই, এটা, এখানে = this / here; oi, ota, okhane = that / there',
];

/** people and money */
const MONEY = [
  'ami, amar, আমি = I / my; amra, amader, আমরা = we / our; jon, জন = people (4 jon = 4 people); dujon = 2 people',
  'bondhu, bondhura, friends, বন্ধু = friends; family, poribar, পরিবার, baba ma, parents = family; bacca, baccha, bachcha, বাচ্চা = kids',
  'taka, tk, tako, টাকা, ৳ = taka; hajar, hazar, k, হাজার = thousand (2 hajar = 2000, 2.5k = 2500); sho, shoo, শো, শ = hundred (5 sho = 500)',
  'moddhe, modhye, er moddhe, under, ভেতরে, মধ্যে = within / under (500 er moddhe = up to 500)',
  'jonproti, jon proti, per head, protijon, জনপ্রতি = per person',
  'kom, kom dame, sosta, shosta, cheap, budget, pocket friendly, কম, সস্তা = cheap / low price; dami, expensive, beshi dam, দামি = expensive',
  'bill koto, khoroch, khorch, খরচ = total cost (VAT and service are added on the bill)',
];

/** taste and opinion */
const TASTE = [
  'bhalo, valo, vlo, ভালো = good; shera, sera, best, সেরা = best; top, famous, nam kora = popular',
  'joss, jos, fatafati, osthir, jotil, darun, দারুণ, জোস = amazing (slang praise)',
  'moja, mojar, tasty, মজা = tasty; bhalo na, baje, faltu, বাজে = bad',
  'jhal, jhaal, spicy, ঝাল = spicy; kom jhal, jhal chara, mild = not spicy; mishti, misti, মিষ্টি = sweet; tok, টক = sour',
  'gorom, hot = hot (temperature); thanda, cold = cold',
  'pet bhore, pet vore, bhorpet = filling / full meal; halka, light = light meal',
  'chara, chhara, bade, baade, baad diye, ছাড়া, বাদে = except / without / other than',
];

/** dishes people name (Khaoya's dish kinds are in brackets) */
const FOOD = [
  'kacchi, kachchi, kachhi, kachi, কাচ্চি = kacchi biryani [kacchi]; biryani, biriyani, birani, বিরিয়ানি [biryani]; tehari, তেহারি [tehari]',
  'polao, pulao, পোলাও [polao]; morog polao = chicken polao; khichuri, khichdi, খিচুড়ি = khichuri',
  'mangsho, mangso, মাংস = meat; gorur, beef, গরু = beef; khasi, khashi, mutton, খাসি = mutton; murgi, morog, chicken, মুরগি = chicken; hash = duck',
  'bhuna, vuna, ভুনা = dry thick curry; rezala, রেজালা = white mild meat curry; kala bhuna = dark beef curry; roast, রোস্ট = Bengali chicken roast; curry, torkari, tarkari [curry]',
  'mach, maach, fish, মাছ [fish]; ilish, hilsa, ইলিশ = hilsa; chingri, prawn, চিংড়ি = prawn; rui, koi, pabda = river fish',
  'bhaat, vaat, rice, ভাত = rice; dal, daal, ডাল = lentils; bhorta, vorta, ভর্তা = mashed sides [thali]; shobji, sobji, vegetable = vegetables; thali, set menu, platter [thali] [platter]',
  'kabab, kebab, shik, sheek, boti, কাবাব [kebab]; chap, chaap, চাপ = Old Dhaka beef chap [kebab]; grill, bbq = grilled meat',
  'naan, nan, নান [naan]; porota, paratha, parata, পরোটা = paratha; ruti, roti, রুটি = flat bread',
  'fuchka, phuchka, puchka, ফুচকা; chotpoti, chatpati, চটপটি; jhalmuri, ঝালমুড়ি [fuchka]; singara, shingara, samucha, somucha, chop, snacks [snack]',
  'haleem, halim, হালিম = haleem; nehari, nihari = slow beef stew; chinese, chowmein, fried rice [chinese]; thai, tom yum [thai]',
  'cha, chaa, tea, চা [tea]; dudh cha = milk tea; lal cha, rong cha = black tea; coffee, kofi [tea]',
  'mishti, misti, sweets, মিষ্টি [dessert]; doi, dahi, দই = yogurt, Bogura doi is famous [dessert]; firni, payesh, pitha, pudding [dessert]; cake, pastry [bakery]',
  'borhani, burhani, বোরহানি = spiced yogurt drink [drink]; lassi, lacchi [drink]; juice, shorbot, cold drink, coke [drink]',
];

/** places, features and getting there */
const PLACE = [
  'restaurant, resturant, restora, restorant, hotel (in Bangladesh a "hotel" often means a small eatery) = restaurant',
  'rooftop, chhad, chad, ছাদ = rooftop; view, lake view = view; date, couple = for a date',
  'cabin, family cabin, kebin = private family cabin; ac, এসি = air-conditioned; parking, gari rakha = parking',
  'namaz, namaj, prayer room, নামাজ = prayer room; kids zone, bacchader khela = kids corner; wifi = free Wi-Fi',
  'kache, kachakachi, ashe pashe, near me, কাছে = near; dure = far; location, thikana, address, ঠিকানা = address',
  'booking, table book, reserve = reservation (call the restaurant); delivery, home delivery = not in Khaoya’s data, suggest calling the restaurant',
  'offer, discount, deal, ছাড় = deals; event, program, live music, gaan = events',
  'Puran Dhaka, Old Dhaka, পুরান ঢাকা = Old Dhaka; Bogra, Bogura, বগুড়া = Bogura; DMD, Dhanmondi = Dhanmondi',
];

/** the whole dictionary, ready to put in front of a model */
export const DICTIONARY = [ASK, MONEY, TASTE, FOOD, PLACE].flat().join('\n');

/** Banglish words that are not English, used to tell a Banglish question from an English one */
export const BANGLISH_WORDS = [
  'rate', 'raate', 'rater', 'ami', 'amra', 'amar', 'amader', 'apni', 'apnar', 'tumi', 'jon', 'jonproti', 'dujon', 'taka', 'takar', 'tk', 'hajar', 'hazar', 'sho',
  'khabo', 'khaite', 'khete', 'khawa', 'khaowa', 'khabar', 'kothay', 'kothai', 'koi', 'ache', 'ase', 'achhe', 'nai', 'nei', 'koto', 'kto',
  'bhalo', 'valo', 'vlo', 'ki', 'kon', 'konta', 'kontay', 'khola', 'bondho', 'bondo', 'ekhon', 'akhon', 'aj', 'ajke', 'kal', 'kalke',
  'raat', 'dupur', 'bikal', 'sokal', 'shokal', 'moddhe', 'modhye', 'jonno', 'sathe', 'shathe', 'dao', 'den', 'bolo', 'bolen', 'bolun',
  'dekhao', 'kemon', 'kmn', 'kemne', 'hobe', 'hbe', 'jabo', 'jaite', 'jawa', 'jaoa', 'jay', 'jai', 'jabe', 'niye', 'theke', 'ei', 'eta',
  'eita', 'eitay', 'oita', 'ota', 'oi', 'khane', 'ekhane', 'eikhane', 'okhane', 'kono', 'asen', 'lagbe', 'kintu', 'ekta', 'duita', 'gula',
  'gulo', 'naki', 'chacchi', 'chai', 'onek', 'kom', 'beshi', 'kisu', 'kichu', 'shob', 'sob', 'koyta', 'koita', 'khub', 'ektu', 'pari',
  'parbo', 'chara', 'chhara', 'bade', 'baade', 'sosta', 'shosta', 'dami', 'jhal', 'jhaal', 'mishti', 'misti', 'joss', 'fatafati', 'moja',
  'mojar', 'darun', 'aro', 'ar', 'r', 'e', 'te', 'er', 'o', 'ta', 'mangsho', 'murgi', 'morog', 'gorur', 'khasi', 'mach', 'bhaat', 'vaat',
  'ruti', 'porota', 'kache', 'dure', 'thikana', 'poribar', 'bondhu', 'bondhura', 'bacca', 'baccha', 'cha', 'doi', 'bhorta', 'vorta',
];
