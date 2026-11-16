/* Words the table menu added (the older ones are in messages/*.json). Use with i.L(W.x) and fill() for {slots}. */
export const W = {
  withTax: { en: 'With VAT and service', bn: 'ভ্যাট ও সার্ভিস সহ' },
  withVat: { en: 'With VAT', bn: 'ভ্যাট সহ' },
  withSvc: { en: 'With service charge', bn: 'সার্ভিস চার্জ সহ' },
  items: { en: '{n} items', bn: '{n}টি আইটেম' },
  item: { en: '1 item', bn: '১টি আইটেম' },
  noteVat: { en: 'Menu prices. VAT {v}% is added to the bill.', bn: 'মেনুর দাম। বিলে ভ্যাট {v}% যোগ হবে।' },
  noteSvc: { en: 'Menu prices. Service {s}% is added to the bill.', bn: 'মেনুর দাম। বিলে সার্ভিস {s}% যোগ হবে।' },
  noteNone: { en: 'Menu prices. Nothing else is added to the bill.', bn: 'মেনুর দাম। বিলে আর কিছু যোগ হয় না।' },
  offline: { en: 'You are offline. Showing the menu saved on this phone, prices from {d}.', bn: 'আপনি অফলাইনে আছেন। এই ফোনে রাখা মেনু দেখানো হচ্ছে, দাম {d} তারিখের।' },
  weak: { en: 'The signal is weak. Showing the menu saved on this phone, prices from {d}.', bn: 'নেটওয়ার্ক দুর্বল। এই ফোনে রাখা মেনু দেখানো হচ্ছে, দাম {d} তারিখের।' },
  updated: { en: 'Last updated {t}', bn: 'শেষ আপডেট {t}' },
  savedHere: { en: 'Saved on this phone. It opens even with no signal.', bn: 'এই ফোনে রাখা আছে। নেটওয়ার্ক ছাড়াও খুলবে।' },
  clearSearch: { en: 'Clear the search', bn: 'খোঁজা মুছুন' },
  moreHere: { en: 'More from this kitchen', bn: 'এই রান্নাঘরের আরও খাবার' },
  close: { en: 'Close', bn: 'বন্ধ করুন' },
  tableBill: { en: 'Bill for table {n}', bn: 'টেবিল {n}-এর বিল' },
  viewIn: { en: 'বাংলা', bn: 'EN' },
  langLabel: { en: 'বাংলায় দেখুন', bn: 'View in English' },
  menuOf: { en: '{n} menu', bn: '{n}-এর মেনু' },
} as const;

/** "{v}" style slots */
export const fillW = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? String(v[k]) : m));
