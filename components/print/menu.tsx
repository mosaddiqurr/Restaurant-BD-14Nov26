/* Printable menus (ported from archive/prototype/panel/print.js). No hooks, so it draws on the server and in the browser.
   The restaurant picks one of the designs in MENUS (saved as r.printMenu by its panel); the paper is filled from
   its real menu, so paper always matches Khaoya. The look of each design lives in styles/print-menu.css (.pm-<id>).
   To add a design: a line in MENUS and a CSS block there.
   Dish photos are an option on every design (o.pics): none, beside each dish, photo cards, big photos in the
   corners, or a strip down the side. The photo designs simply start with one of those switched on.
   Prices are menu prices only; the footer says VAT and service come on top, as on every Khaoya menu. */
import clsx from 'clsx';
import type { CSSProperties, ReactNode } from 'react';
import { areaOf, src } from '@/lib/khabo';
import type { Dish, Restaurant, Text } from '@/lib/data/types';

export type PrintDesign = { id: string; name: Text; note: Text; pics?: Pics };
export type Pics = 'none' | 'side' | 'card' | 'corner' | 'strip';
export const MENUS: PrintDesign[] = [
  { id: 'plates', name: { en: 'Round plates', bn: 'গোল প্লেট' }, note: { en: 'Big round dish photos at the corners', bn: 'কোণে খাবারের বড় গোল ছবি' }, pics: 'corner' },
  { id: 'cards', name: { en: 'Photo cards', bn: 'ছবির কার্ড' }, note: { en: 'Each dish with its photo above the name', bn: 'প্রতিটি খাবারের নামের ওপরে তার ছবি' }, pics: 'card' },
  { id: 'board', name: { en: 'Board', bn: 'বোর্ড' }, note: { en: 'Dark board, a round photo beside each dish', bn: 'গাঢ় বোর্ড, প্রতিটি খাবারের পাশে গোল ছবি' }, pics: 'side' },
  { id: 'star', name: { en: 'Star dish', bn: 'সেরা খাবার' }, note: { en: 'Your best dish big on top, small photos below', bn: 'ওপরে সেরা খাবার বড় করে, নিচে ছোট ছবি' }, pics: 'side' },
  { id: 'strip', name: { en: 'Photo strip', bn: 'ছবির সারি' }, note: { en: 'A column of dish photos down the right side', bn: 'ডান পাশে ওপর থেকে নিচে খাবারের ছবি' }, pics: 'strip' },
  { id: 'split', name: { en: 'Half photo', bn: 'অর্ধেক ছবি' }, note: { en: 'Photos fill the left side, menu on the right', bn: 'বাঁ পাশ জুড়ে ছবি, ডান পাশে মেনু' }, pics: 'strip' },
  { id: 'classic', name: { en: 'Classic', bn: 'ক্লাসিক' }, note: { en: 'Ivory paper, centred serif, dotted lines to the price', bn: 'ঘিয়ে কাগজ, মাঝখানে সেরিফ লেখা, দাম পর্যন্ত ডট লাইন' } },
  { id: 'bistro', name: { en: 'Bistro', bn: 'বিস্ট্রো' }, note: { en: 'Black and white, big title, framed, two columns', bn: 'সাদা-কালো, বড় নাম, ফ্রেমে ঘেরা, দুই কলাম' } },
  { id: 'modern', name: { en: 'Modern', bn: 'আধুনিক' }, note: { en: 'Clean sans, your own colour, fine lines', bn: 'পরিষ্কার লেখা, নিজের রং, সরু লাইন' } },
  { id: 'night', name: { en: 'Night', bn: 'রাত' }, note: { en: 'Your deep colour with your accent, for dinner places', bn: 'গাঢ় রঙে সঙ্গী রং, রাতের খাবারের জায়গার জন্য' } },
  { id: 'heritage', name: { en: 'Heritage', bn: 'ঐতিহ্য' }, note: { en: 'Bangla first, double frame, warm paper', bn: 'বাংলা আগে, দুই স্তরের ফ্রেম, উষ্ণ কাগজ' } },
  { id: 'cafe', name: { en: 'Café', bn: 'ক্যাফে' }, note: { en: 'Friendly and light, two columns', bn: 'হালকা আর বন্ধুসুলভ, দুই কলাম' } },
  { id: 'editorial', name: { en: 'Editorial', bn: 'ম্যাগাজিন' }, note: { en: 'Magazine style with numbered sections', bn: 'ম্যাগাজিনের ধাঁচে, নম্বর দেওয়া ভাগ' } },
  { id: 'minimal', name: { en: 'Minimal', bn: 'সাদামাটা' }, note: { en: 'Quiet and centred, fine-dining feel', bn: 'শান্ত আর মাঝখানে সাজানো' } },
  { id: 'photo-t', name: { en: 'Cover photo', bn: 'কভার ছবি' }, note: { en: 'Your cover photo across the top', bn: 'ওপরে জুড়ে কভার ছবি' } },
  { id: 'deco', name: { en: 'Deco', bn: 'ডেকো' }, note: { en: 'Ivory and gold, art deco frame', bn: 'ঘিয়ে আর সোনালি, আর্ট ডেকো ফ্রেম' } },
  { id: 'kitchen', name: { en: 'Kitchen', bn: 'কিচেন' }, note: { en: 'Bold street-food board, marigold header', bn: 'জোরালো স্ট্রিট ফুড বোর্ড, ওপরে গাঁদা রং' } },
  { id: 'bilingual', name: { en: 'Two languages', bn: 'দুই ভাষা' }, note: { en: 'English left, Bangla right, price between', bn: 'বাঁয়ে ইংরেজি, ডানে বাংলা, মাঝে দাম' } },
];
export const PICS: [Pics, Text][] = [
  ['none', { en: 'No photos', bn: 'ছবি নেই' }], ['side', { en: 'Beside each dish', bn: 'প্রতিটি খাবারের পাশে' }], ['card', { en: 'Photo cards', bn: 'ছবির কার্ড' }],
  ['corner', { en: 'Big photos at the corners', bn: 'কোণে বড় ছবি' }], ['strip', { en: 'Photo strip', bn: 'ছবির সারি' }],
];

/* pick: dishes whose photo is used (null = every dish that has one). hide: dishes left off the paper.
   title / tag / note: the owner's own words (empty = the restaurant's name, its tagline, no note) */
export type PmOpts = { look: string; lang: 'both' | 'en' | 'bn'; desc: boolean; qr: boolean; size: 'a4' | 'a5'; bw: boolean; cats: string[] | null; pics: Pics; pick: string[] | null; hide: string[]; title: string; tag: string; note: string };
export const PM_DEF: PmOpts = { look: 'classic', lang: 'both', desc: true, qr: true, size: 'a4', bw: false, cats: null, pics: 'none', pick: null, hide: [], title: '', tag: '', note: '' };
/** a restaurant that may carry its saved print choices (the owner panel saves them as r.printMenu) */
export type PrintRest = Restaurant & { printMenu?: Partial<PmOpts> };
export const pmOpts = (r: PrintRest): PmOpts => ({ ...PM_DEF, ...(r.printMenu || {}) });
export const designOf = (id?: string | null) => MENUS.find(m => m.id === id);
/** 210 mm in CSS pixels */
export const A4W = 793.7;

/** which dishes get a photo, best first: signature dishes, then the rest of the menu */
export function photoDishes(r: Restaurant, o: Pick<PmOpts, 'hide' | 'pick'>) {
  const sig = r.signature || [], hide = o.hide || [];
  const rank = (d: Dish) => (sig.includes(d.id) ? sig.indexOf(d.id) : 99);
  return r.menu.filter(d => d.p && !hide.includes(d.id) && (!o.pick || o.pick.includes(d.id))).sort((a, b) => rank(a) - rank(b));
}

const BD = '০১২৩৪৫৬৭৮৯';
const bnNum = (s: string | number) => String(s).replace(/\d/g, d => BD[+d]);
const nf = new Intl.NumberFormat('en-IN');

/** one menu page at real A4 size. qr = the code for the footer (a <QR /> or SVG text) */
export function MenuSheet({ r, o: o0, qr }: { r: Restaurant; o: Partial<PmOpts>; qr?: ReactNode | string }) {
  const o = { ...PM_DEF, ...o0 };
  const bnFirst = o.lang === 'bn', price = (v: number) => (bnFirst ? bnNum(nf.format(v)) : nf.format(v));
  const bnMain = bnFirst || (o.look === 'heritage' && o.lang === 'both');
  const nm = (x: Text) => (bnMain ? x.bn || x.en : x.en);
  const alt = (x: Text) => (o.lang === 'both' ? (bnMain ? x.en : x.bn && x.bn !== x.en ? x.bn : '') : '');
  const area = areaOf(r.area), hide = o.hide || [];
  const cats = r.cats.map((c, i) => ({ c, i, ds: r.menu.filter(d => (d.cat || r.cats[0]?.id) === c.id && !hide.includes(d.id)) }))
    .filter(x => x.ds.length && (!o.cats || !o.cats.length || o.cats.includes(x.c.id)));
  const extra = bnFirst
    ? [r.vat ? `ভ্যাট ${bnNum(r.vat)}%` : '', r.service ? `সার্ভিস ${bnNum(r.service)}%` : ''].filter(Boolean).join(' ও ')
    : [r.vat ? `VAT ${r.vat}%` : '', r.service ? `service charge ${r.service}%` : ''].filter(Boolean).join(' and ');
  const note = bnFirst ? (extra ? `দাম টাকায়, ${extra} ছাড়া।` : 'দাম টাকায়।') : (extra ? `Prices in taka, before ${extra}.` : 'Prices in taka.');
  const pics = o.pics || 'none', withPic = photoDishes(r, o), has = new Set(withPic.map(d => d.id));
  // eslint-disable-next-line @next/next/no-img-element
  const img = (d: Dish, w: number, cls?: string) => <img className={cls} src={src(d.p, w)} alt="" crossOrigin="anonymous" />;
  const title = o.title || (bnFirst ? r.name.bn : r.name.en), tag = o.tag || (r.tagline ? (bnFirst ? r.tagline.bn : r.tagline.en) : '');
  const item = (d: Dish) => {
    const desc = o.desc ? (bnFirst ? d.desc?.bn || d.por?.bn : d.desc?.en || d.por?.en) : '';
    const a = alt(d.name) || (o.look === 'bilingual' && !bnFirst ? d.name.bn : '');
    const pic = (pics === 'side' || pics === 'card') && has.has(d.id) ? img(d, pics === 'card' ? 600 : 240, 'pm-pic') : null;
    return (
      <li key={d.id} className={clsx('pm-i', pic && 'has-pic')}>
        {pic}
        <div className="pm-tx">
          <div className="pm-row"><b className={clsx('pm-nm', bnMain && 'bn')}>{nm(d.name)}</b><span className="pm-dots" /><span className={clsx('pm-p', bnFirst && 'bn')}>{price(d.price)}</span></div>
          {a ? <span className={clsx('pm-alt', !bnMain && 'bn')}>{a}</span> : null}
          {desc ? <span className={clsx('pm-d', bnFirst && 'bn')}>{desc}</span> : null}
        </div>
      </li>
    );
  };
  /* photo cards: dishes with a photo become cards, the rest stay as a plain list under them */
  const list = (ds: Dish[]) => pics === 'card'
    ? <>{ds.some(d => has.has(d.id)) ? <ul className="pm-grid">{ds.filter(d => has.has(d.id)).map(item)}</ul> : null}{ds.some(d => !has.has(d.id)) ? <ul>{ds.filter(d => !has.has(d.id)).map(item)}</ul> : null}</>
    : <ul>{ds.map(item)}</ul>;
  const star = withPic[0];
  return (
    <article className={clsx('pm', `pm-${o.look}`, `pics-${pics}`, o.bw && 'pm-bw')} lang={bnFirst ? 'bn' : 'en'} style={{ '--d': o.bw ? '#161616' : r.theme.deep, '--a': o.bw ? '#161616' : r.theme.accent } as CSSProperties}>
      {pics === 'corner' ? <div className="pm-corner" aria-hidden="true">{withPic.slice(0, 2).map((d, i) => <span key={d.id} className={`pm-c${i}`}>{img(d, 900)}</span>)}</div> : null}
      {pics === 'strip' ? <aside className="pm-photos" aria-hidden="true">{withPic.slice(0, o.look === 'split' ? 3 : 4).map(d => <figure key={d.id}>{img(d, 700)}<figcaption className={bnMain ? 'bn' : undefined}>{nm(d.name)}</figcaption></figure>)}</aside> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="pm-photo">{o.look === 'photo-t' && r.hero?.[0] ? <img src={src(r.hero[0], 1400)} alt="" crossOrigin="anonymous" /> : null}</div>
      <header className="pm-h">
        <p className={clsx('pm-k', bnFirst && 'bn')}>{bnFirst ? area.bn : area.en}{r.since ? ` · ${bnFirst ? 'স্থাপিত ' + bnNum(r.since) : 'Since ' + r.since}` : ''}</p>
        <h1 className={clsx('pm-n', bnFirst && 'bn')}>{title}</h1>
        {!o.title && !bnFirst && (o.lang === 'both' || o.look === 'heritage' || o.look === 'bilingual') && r.name.bn ? <p className="pm-nb">{r.name.bn}</p> : null}
        {tag ? <p className={clsx('pm-tag', bnFirst && 'bn')}>{tag}</p> : null}
      </header>
      {o.look === 'star' && star ? <div className="pm-hero">{img(star, 1400)}<div><span className={bnFirst ? 'bn' : undefined}>{bnFirst ? 'আমাদের সেরা' : 'House favourite'}</span><b className={bnMain ? 'bn' : undefined}>{nm(star.name)}</b><em>৳{price(star.price)}</em></div></div> : null}
      <div className="pm-body">
        {cats.map(({ c, i, ds }) => (
          <section key={c.id} className="pm-cat">
            <h2><span className="pm-no">{String(i + 1).padStart(2, '0')}</span><span className={clsx('pm-cn', bnFirst && 'bn')}>{bnFirst ? c.bn || c.en : c.en}</span>{o.lang === 'both' && c.bn ? <span className="pm-calt bn">{c.bn}</span> : null}</h2>
            {list(ds)}
          </section>
        ))}
      </div>
      <footer className="pm-f">
        {o.qr && qr ? (typeof qr === 'string' ? <div className="pm-qr" dangerouslySetInnerHTML={{ __html: qr }} /> : <div className="pm-qr">{qr}</div>) : null}
        <div>
          {o.qr && qr ? <b className={bnFirst ? 'bn' : undefined}>{bnFirst ? 'স্ক্যান করে ছবি আর আজকের দাম দেখুন' : 'Scan for photos and today’s prices'}</b> : null}
          {o.note ? <span className="pm-own">{o.note}</span> : null}
          <span className={bnFirst ? 'bn' : undefined}>{note}</span>
          <span className={bnFirst ? 'bn' : undefined}>{bnFirst ? r.address?.bn || r.address?.en : r.address?.en}{r.phone ? ' · ' + (bnFirst ? bnNum(r.phone) : r.phone) : ''}</span>
        </div>
        <div className="pm-by">Khaoya</div>
      </footer>
    </article>
  );
}

/** a long menu first shrinks a little; if it still does not fit one A4 sheet, it goes to two columns
    (photo cards and strip layouts only shrink: two columns of cards would be too small to read) */
export function fitMenu(pm: HTMLElement) {
  const body = pm.querySelector<HTMLElement>('.pm-body'); if (!body) return;
  /* the sheet's own height (not scrollHeight: corner photos hang off the edge on purpose) */
  const over = () => pm.offsetHeight / pm.offsetWidth * 210 > 297.5;
  const shrink = (min: number) => { let z = 1; body.style.zoom = '1'; while (over() && z > min) { z = Math.round((z - 0.02) * 100) / 100; body.style.zoom = String(z); } };
  const keep = /pics-(card|strip)/.test(pm.className);
  body.style.columns = '';
  shrink(keep ? 0.62 : 0.86);
  if (!keep && over() && getComputedStyle(body).columnCount !== '2') { body.style.columns = '2'; shrink(0.72); }
}
