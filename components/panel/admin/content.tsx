'use client';
/* Site text: every word on khabo's own pages in English and Bangla, grouped by page, plus the general
   "About this dish" texts. Edits wait in a draft until Save. Saved into the panel data (db.content) for now:
   the live site reads them once the backend is ready. Ported from archive/prototype/panel/admin.js (V.content). */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { C } from '@/lib/khabo';
import type { Text } from '@/lib/data/types';
import { can, log, logIn, mutate } from '@/lib/panel/store';
import enRaw from '@/messages/en.json';
import bnRaw from '@/messages/bn.json';
import { useSaveEntry } from '../draft';
import { Empty, Ico, Page, usePanel, useT } from '../ui';
import { useKeep } from './parts';
import { bnN } from '@/lib/panel/admin';

const EN = enRaw as Record<string, string>, BN = bnRaw as Record<string, string>;
const tx = (en: string, bn: string): Text => ({ en, bn });
type Saved = { text?: Record<string, Text>; about?: Record<string, Partial<Record<'made' | 'side', Text>>> };

const LABEL: Record<string, Text> = {
  hero_1: tx('Headline, first line', 'শিরোনাম, প্রথম লাইন'), hero_2: tx('Headline, second line', 'শিরোনাম, দ্বিতীয় লাইন'), hero_sub: tx('Under the headline', 'শিরোনামের নিচে'),
  ai_title: tx('Ask section, title', 'জিজ্ঞাসা অংশ, শিরোনাম'), ai_sub: tx('Ask section, text', 'জিজ্ঞাসা অংশ, লেখা'),
  see_title: tx('“See it” section, title', '“দেখে নিন” অংশ, শিরোনাম'), see_sub: tx('“See it” section, text', '“দেখে নিন” অংশ, লেখা'),
  spec_title: tx('Price compare, title', 'দাম তুলনা, শিরোনাম'), spec_sub: tx('Price compare, text', 'দাম তুলনা, লেখা'),
  own_title: tx('For owners, title', 'মালিকদের জন্য, শিরোনাম'), own_sub: tx('For owners, text', 'মালিকদের জন্য, লেখা'),
  deals_title: tx('Page title', 'পেজের শিরোনাম'), deals_sub: tx('Under the title', 'শিরোনামের নিচে'), deal_note: tx('Small note at the bottom', 'নিচের ছোট নোট'),
  biz_h1: tx('Headline', 'শিরোনাম'), biz_sub: tx('Under the headline', 'শিরোনামের নিচে'), biz_note: tx('Price note', 'দামের নোট'),
  plans_title: tx('Plans, title', 'প্ল্যান, শিরোনাম'), plans_sub: tx('Plans, text', 'প্ল্যান, লেখা'), faq: tx('Questions, title', 'প্রশ্ন, শিরোনাম'),
  form_title: tx('Sign-up form, title', 'যোগ দেওয়ার ফর্ম, শিরোনাম'), form_sub: tx('Sign-up form, text', 'যোগ দেওয়ার ফর্ম, লেখা'),
  footer_line: tx('Footer, line under the logo', 'ফুটার, লোগোর নিচের লাইন'), demo_note: tx('Preview note', 'প্রিভিউ নোট'),
  nav_explore: tx('Top menu', 'ওপরের মেনু'), nav_deals: tx('Top menu', 'ওপরের মেনু'), nav_business: tx('Top menu', 'ওপরের মেনু'),
  tm_welcome: tx('Welcome line', 'স্বাগত লাইন'), tm_note: tx('Note under the menu', 'মেনুর নিচের নোট'), about_dish: tx('Section title', 'অংশের শিরোনাম'), how_made: tx('Heading', 'শিরোনাম'),
};
type Sect = { id: string; name: Text; ico: string; url: string | null; rx?: RegExp; top?: string[]; about?: boolean };
const SECT: Sect[] = [
  { id: 'home', name: tx('Home page', 'হোম পেজ'), ico: 'house', url: '', rx: /^(hero_|ph_\d|q_|live_360|step_inside|craving$|all_dishes|from_price|near_title|change_area|budget|any_budget|no_budget_area|spec_|average|compare_all|see_title|see_sub|bx_|drag_look|turn_it|browse_all|occasions|facilities|n_dishes_places|per_person$|own_|see_plans|see_sample|sample_report|page_views|qr_scans|top_dish$|since$|partners|try_table|tc_scan|popular$)/, top: ['hero_1', 'hero_2', 'hero_sub', 'see_title', 'see_sub', 'spec_title', 'spec_sub', 'own_title', 'own_sub'] },
  { id: 'deals', name: tx('Deals', 'অফার'), ico: 'tag', url: '/deals', rx: /^(deal|all_deals|usual|you_save|pct_off|off$|this_week|week_dates|see_deal|until_x|from_x|n_deals|save_x|no_deals|all$)/, top: ['deals_title', 'deals_sub', 'deal_note'] },
  { id: 'biz', name: tx('For restaurants', 'রেস্টুরেন্টের জন্য'), ico: 'briefcase', url: '/business', rx: /^(biz_|book_visit|see_live|vs_|get_|g_|try_it|see_print|sample$|oct|calls_dirs|top_dishes|price_insight|insight_line|how\d|how_title|plans|most_popular|per_month|per_day|choose_plan|f_|faq|form_|your_name|rest_name|phone|other_area|plan$|not_sure|err_|qrb_|qrs_|qr_menu|partner_sign_in)/, top: ['biz_h1', 'biz_sub', 'biz_note', 'plans_title', 'plans_sub', 'faq', 'form_title', 'form_sub'] },
  { id: 'rest', name: tx('Restaurant page', 'রেস্টুরেন্টের পেজ'), ico: 'storefront', url: '/r/shahi-handi', rx: /^(tour_|rooms?$|watch_film|see_photos|n_photos|n_dishes$|n_verified|menu$|inside|kitchen|photos|reviews$|info$|sections|call|vat_plus|added_bill|n_seats|has_cabins|directions|checked_by_team|signature|video|best_seller|veg$|menu_note|search_menu|menu_none|full_screen|outside|food$|follow|visit|hours|every_day|address|fac_none|payment|good_know|more_near|powered|own_this|link_copied|zoom_|use_motion|fullscreen|day$|night$|call_book|loading_|captured|no_webgl|motion_denied|play|pause|seek|mute|film_end|replay|view_table|d3_fail|go_home|n_reviews|prices$|on_the_bill|seats|since_label|about_r|in_3d|has_video|watch_kitchen|map_of|open_gmaps|featured$|founding|pp_short|film$|lowest$|spice_\d|checked_|open_|opens_at|closed_now)/ },
  { id: 'dish', name: tx('Dish page', 'খাবারের পেজ'), ico: 'bowl-food', url: '/dishes', rx: /^(about_dish|how_made|main_ing|spice_lvl|served_with|spice_note|people_said|dish_video_note|d3_hint|photo_soon|price_|lowest_in|same_dish_else|sold_out|also_here|photo$|for_n|allin_line)/, top: ['about_dish', 'how_made'] },
  { id: 'reviews', name: tx('Reviews', 'রিভিউ'), ico: 'star', url: '/r/shahi-handi', rx: /^(write_review|verified|not_verified|rv_|review|st_\d|pick_stars|just_now|your_rating|tap_stars|what_ordered|add_photos|choose_photos|post_review|signin_review|login_review|owner_reply|reply_from|no_reviews|n_stars|ordered|with_photos)/ },
  { id: 'explore', name: tx('Search and explore', 'খোঁজা ও ঘুরে দেখা'), ico: 'magnifying-glass', url: '/restaurants', rx: /^(search|explore|stat_|highest|dh_bar_label|to$|typical|pp_upto|dish_upto|group_of|late_night|mild|featured_note|see_all|remove|nothing_|sort|restaurants|dishes$|group_by|by_|filters|area$|dish$|occasion|all_of|city_area|pp_max|any$|when$|rating|food_pref|veg_options|group_size|see_before|menu_3d|clear_all|show_n_|no_results|no_match|near_|kb_search|rs_|categories|all_food|dishes_sub|dish_search|any_price|max_price|map_|pc_|serves_x|where$|anywhere|food_type|any_food|labels|choose_area|n_places|area_set|coming_soon|type_range|per_person_short|cuisine$|places_word|place_one|from_at|all_in_city|show_less|show_all_cats|city$|tab_places|tab_dishes|nav_restaurants|nav_dishes)/ },
  { id: 'ask', name: tx('Ask AI', 'এআই-কে জিজ্ঞেস'), ico: 'sparkle', url: '', rx: /^(ask_|ai_|try_|speak|send$|use_bill|also_fits|vat_service|bill_loaded|listening|mic_off|recent|cravings)/, top: ['ai_title', 'ai_sub'] },
  { id: 'bill', name: tx('Bill', 'বিল'), ico: 'receipt', url: '/r/shahi-handi', rx: /^(bill|view_bill|people$|split_even|fewer|more$|subtotal|vat$|service|total_all_in|each_|share_whatsapp|clear_bill|add_to_bill|remove_one|add_one|hide_bill|saved_bills|all_in$|n_items)/ },
  { id: 'table', name: tx('Table menu and print', 'টেবিল মেনু ও প্রিন্ট'), ico: 'qr-code', url: '/t/shahi-handi', rx: /^(tm_|table_n|pm_|print_)/, top: ['tm_welcome', 'tm_note'] },
  { id: 'account', name: tx('Sign in and account', 'সাইন ইন ও অ্যাকাউন্ট'), ico: 'user-circle', url: null, rx: /^(me_|login_|sign|phone_no|phone_err|send_code|or$|google_|change_no|enter_code|code_|digit_n|continue|your_account|your_reviews)/ },
  { id: 'common', name: tx('Menus, footer, buttons', 'মেনু, ফুটার, বোতাম'), ico: 'list', url: null, rx: /./, top: ['footer_line', 'nav_explore', 'nav_deals', 'nav_business', 'demo_note'] },
  { id: 'about', name: tx('About this dish', 'এই খাবার সম্পর্কে'), ico: 'chef-hat', url: '/dishes', about: true },
];
/* the order rules run in: the first match wins (so "phone_no" is sign-in, not the sign-up form) */
const ORDER = ['reviews', 'table', 'account', 'biz', 'dish', 'deals', 'bill', 'rest', 'home', 'ask', 'explore', 'common'];
let KEYS: Record<string, string[]> | null = null;
function sections() {
  if (KEYS) return KEYS;
  const out: Record<string, string[]> = {}; SECT.forEach(s => { out[s.id] = []; });
  Object.keys(EN).forEach(k => { const id = ORDER.find(x => SECT.find(s => s.id === x)!.rx!.test(k))!; out[id].push(k); });
  SECT.forEach(s => { if (s.top) out[s.id] = [...s.top.filter(k => out[s.id].includes(k)), ...out[s.id].filter(k => !s.top!.includes(k))]; });
  out.about = Object.keys(C.types).filter(k => C.types[k].made).flatMap(k => [`a:${k}:made`, `a:${k}:side`]);
  return (KEYS = out);
}
const isA = (k: string) => k.startsWith('a:');
const aParts = (k: string) => { const [, ty, f] = k.split(':'); return [ty, f as 'made' | 'side'] as const; };
/** the words khabo ships with */
const orig = (k: string): Text => {
  if (!isA(k)) return { en: EN[k] || '', bn: BN[k] || '' };
  const [ty, f] = aParts(k), v = (C.types[ty] as unknown as Record<string, Text | undefined>)?.[f];
  return { en: v?.en || '', bn: v?.bn || '' };
};
const same = (a: Text, b: Text) => a.en === b.en && a.bn === b.bn;

/* ---------- one piece of text ---------- */
const Row = memo(function Row({ k, v, o, changed, dirty, label, tag, onEdit, onUndo }: {
  k: string; v: Text; o: Text; changed: boolean; dirty: boolean; label: string; tag?: string;
  onEdit: (k: string, v: Text) => void; onUndo: (k: string) => void;
}) {
  const t = useT();
  const toks = o.en.match(/\{\w+\}/g) || [], long = Math.max(v.en.length, v.bn.length, o.en.length) > 58;
  const side = isA(k) && k.endsWith(':side');
  const inp = (l: 'en' | 'bn') => {
    const p = { className: clsx('inp', l === 'bn' && 'bn'), value: v[l], 'aria-label': `${label || k}, ${l === 'en' ? t('English', 'ইংরেজি') : t('Bangla', 'বাংলা')}`, lang: l,
      onChange: (e: { target: { value: string } }) => onEdit(k, { ...v, [l]: e.target.value }) };
    return long
      ? <textarea {...p} rows={Math.min(6, Math.ceil(Math.max(v.en.length, v.bn.length * 1.15, o.en.length) / 50))} />
      : <input {...p} placeholder={side ? (l === 'en' ? 'Served with' : 'সাথে যা দেওয়া হয়') : undefined} />;
  };
  return (
    <div className={clsx('tx', dirty && 'dirty')}>
      <div className="tx-h">{label ? <b>{label}</b> : null}{tag ? <span className="tx-tag">{tag}</span> : null}
        {dirty ? <span className="tx-st dr">{t('Not saved', 'রাখা হয়নি')}</span> : changed ? <span className="tx-st ch">{t('Changed', 'বদলানো')}</span> : null}
        {toks.length ? <span className="tx-tok" title={t('Khaoya fills these in. Keep them as they are.', 'এগুলো খাওয়া নিজে বসায়। যেমন আছে রাখুন।')}>{toks.map(x => <code key={x}>{x}</code>)}</span> : null}
        {changed || dirty ? <button type="button" className="tx-undo" onClick={() => onUndo(k)}><Ico n="arrow-clockwise" sm />{t('Back to original', 'আগের লেখায় ফিরুন')}</button> : null}
      </div>
      <div className="tx-in">{inp('en')}{inp('bn')}</div>
    </div>
  );
});

export function SiteText() {
  const i = useI(), t = useT(), { db, me } = usePanel();
  const S = useMemo(() => sections(), []);
  const [sec, setSec] = useKeep('tx.sec', 'home');
  const [draft, setDraft] = useKeep<Record<string, Text>>('tx.draft', {});
  const [qIn, setQIn] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { const tm = setTimeout(() => setQ(qIn.trim()), 180); return () => clearTimeout(tm); }, [qIn]);
  const body = useRef<HTMLDivElement>(null);
  const saved0 = useMemo(() => (db.content || {}) as Saved, [db.content]);
  /** what is saved now (or the original when nothing is saved) */
  const saved = useCallback((k: string): Text => {
    if (!isA(k)) return saved0.text?.[k] || orig(k);
    const [ty, f] = aParts(k); return saved0.about?.[ty]?.[f] || orig(k);
  }, [saved0]);
  const cur = (k: string) => draft[k] || saved(k);
  const changed = (k: string) => !same(orig(k), saved(k));
  const label = (k: string) => {
    if (isA(k)) { const [ty, f] = aParts(k); return `${i.L(C.types[ty])}, ${f === 'made' ? t('how it is made', 'কীভাবে তৈরি') : t('served with', 'সাথে যা দেওয়া হয়')}`; }
    return LABEL[k] ? i.L(LABEL[k]) : '';
  };
  const onEdit = useCallback((k: string, v: Text) => setDraft(d => {
    const n = { ...d }; if (same(v, saved(k))) delete n[k]; else n[k] = v; return n;
  }), [setDraft, saved]);
  const onUndo = useCallback((k: string) => setDraft(d => {
    const n = { ...d }, o = orig(k); if (same(o, saved(k))) delete n[k]; else n[k] = o; return n;
  }), [setDraft, saved]);
  const count = (id: string) => ({ n: S[id].length, ch: S[id].filter(changed).length, dr: S[id].filter(k => draft[k]).length });
  const nDraft = Object.keys(draft).length;

  const save = (): boolean => {
    const keys = Object.keys(draft); if (!keys.length) return true;
    if (!can('site', me)) { log(null, { en: 'Tried to change site text (no access)', bn: 'সাইটের লেখা বদলানোর চেষ্টা (অনুমতি নেই)' }); toast.error(t('Your level cannot change site text.', 'আপনার লেভেলে সাইটের লেখা বদলানো যায় না।')); return false; }
    let empty = 0;
    mutate(d => {
      const c = (d.content = (d.content || {}) as Record<string, unknown>) as Saved;
      c.text = c.text || {}; c.about = c.about || {};
      keys.forEach(k => {
        const o = orig(k), v = { en: draft[k].en.trim(), bn: draft[k].bn.trim() };
        if (!v.en) { empty++; v.en = o.en; }
        if (!v.bn) v.bn = o.bn || v.en;
        const isSame = same(v, o);
        if (isA(k)) {
          const [ty, f] = aParts(k), a = (c.about![ty] = c.about![ty] || {});
          if (isSame) delete a[f]; else a[f] = v;
          if (!Object.keys(a).length) delete c.about![ty];
        } else if (isSame) delete c.text![k]; else c.text![k] = v;
      });
      logIn(d, null, { en: `Changed ${keys.length} piece${keys.length > 1 ? 's' : ''} of site text`, bn: `সাইটের লেখার ${bnN(keys.length)}টি অংশ বদলেছেন` });
    });
    setDraft({});
    if (empty) toast(t(`${empty} left empty went back to the original.`, `খালি রাখা ${i.N(empty)}টি আগের লেখায় ফিরেছে।`));
    return true;
  };
  useSaveEntry({ count: nDraft, save, discard: () => setDraft({}) });
  const pick = (id: string) => {
    setSec(id); setQIn(''); setQ('');
    if (innerWidth < 900) requestAnimationFrame(() => body.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  let main;
  if (q) {
    const qq = q.toLowerCase(), hits: [string, string][] = [];
    SECT.forEach(s => S[s.id].forEach(k => { const v = cur(k), o = orig(k); if ([v.en, v.bn, o.en, o.bn, label(k)].join(' ').toLowerCase().includes(qq)) hits.push([k, i.L(s.name)]); }));
    main = <>
      <div className="tx-top"><div><h2>{t('Search results', 'খোঁজের ফল')}</h2><span className="meta">{t(`${hits.length} match${hits.length === 1 ? '' : 'es'} for “${q}” across the whole site`, `পুরো সাইটে “${q}”-এর ${i.N(hits.length)}টি মিল`)}</span></div></div>
      {hits.length ? hits.slice(0, 120).map(([k, s]) => <Row key={k} k={k} v={cur(k)} o={orig(k)} changed={changed(k)} dirty={!!draft[k]} label={label(k)} tag={s} onEdit={onEdit} onUndo={onUndo} />)
        : <Empty icon="magnifying-glass" title={t('Nothing found', 'কিছু পাওয়া যায়নি')}>{t('Try fewer words, or search in Bangla.', 'কম শব্দ দিয়ে, বা বাংলায় খুঁজে দেখুন।')}</Empty>}
      {hits.length > 120 ? <p className="meta" style={{ padding: '14px 4px' }}>{t('Showing the first 120. Add more words to narrow it down.', 'প্রথম ১২০টি দেখানো হচ্ছে। আরও শব্দ দিয়ে খোঁজ ছোট করুন।')}</p> : null}
    </>;
  } else {
    const s = SECT.find(x => x.id === sec) || SECT[0], c = count(s.id);
    main = <>
      <div className="tx-top">
        <div><h2><Ico n={s.ico} sm />{i.L(s.name)}</h2><span className="meta">{t(`${c.n} piece${c.n === 1 ? '' : 's'} of text${c.ch ? ` · ${c.ch} changed` : ''}`, `${i.N(c.n)}টি লেখা${c.ch ? ` · ${i.N(c.ch)}টি বদলানো` : ''}`)}</span></div>
        {s.url != null ? <a className="btn sm" href={`/${i.lang}${s.url}`} target="_blank" rel="noopener"><Ico n="arrow-up-right" sm />{t('See this page', 'এই পেজ দেখুন')}</a> : null}
      </div>
      <div className="tx-cols"><span>English</span><span>বাংলা</span></div>
      {S[s.id].map(k => <Row key={k} k={k} v={cur(k)} o={orig(k)} changed={changed(k)} dirty={!!draft[k]} label={label(k)} onEdit={onEdit} onUndo={onUndo} />)}
      <p className="meta tx-foot">{s.about
        ? t('Shown under “About this dish” for every dish of that kind, unless the restaurant wrote its own.', 'ওই ধরনের প্রতিটি খাবারের “এই খাবার সম্পর্কে” অংশে দেখায়, যদি রেস্টুরেন্ট নিজে কিছু না লেখে।')
        : t('Words in {curly brackets} are filled in by Khaoya, like a number or a name. Keep them as they are.', '{বাঁকা বন্ধনীর} ভেতরের শব্দ খাওয়া নিজে বসায়, যেমন একটি সংখ্যা বা নাম। যেমন আছে রাখুন।')}</p>
    </>;
  }

  return (
    <Page title={t('Site text', 'সাইটের লেখা')}
      sub={t('Every word on Khaoya’s own pages, in English and Bangla. Pick a page or search for any words you see on the site.', 'খাওয়া-র নিজের পেজের প্রতিটি শব্দ, ইংরেজি আর বাংলায়। একটি পেজ বাছুন, বা সাইটে দেখা যেকোনো শব্দ খুঁজুন।')}
      acts={<a className="btn" href={`/${i.lang}`} target="_blank" rel="noopener"><Ico n="arrow-up-right" sm />{t('Open Khaoya', 'খাওয়া খুলুন')}</a>}>
      <div className="alert info tx-live"><Ico n="info" /><div className="meta">{t('Saved words are kept in this prototype for now. The live site will read them once the backend is ready; until then Khaoya still shows the original words.', 'রাখা লেখা আপাতত এই প্রোটোটাইপে থাকছে। ব্যাকএন্ড তৈরি হলে লাইভ সাইট এগুলো পড়বে; ততদিন খাওয়া আগের লেখাই দেখাবে।')}</div></div>
      <div className="tx-wrap">
        <aside className="tx-side card">
          <label className="search"><span className="sr">{t('Search all site text', 'সাইটের সব লেখা খুঁজুন')}</span><Ico n="magnifying-glass" sm />
            <input className="inp sm" type="search" placeholder={t('Search any words', 'যেকোনো শব্দ খুঁজুন')} value={qIn} onChange={e => setQIn(e.target.value)} /></label>
          <nav aria-label={t('Pages', 'পেজ')}>
            {SECT.map(s => {
              const c = count(s.id);
              return (
                <button key={s.id} type="button" className={clsx('tx-nav', !q && sec === s.id && 'on')} aria-current={!q && sec === s.id ? 'true' : undefined} onClick={() => pick(s.id)}>
                  <Ico n={s.ico} sm /><span>{i.L(s.name)}</span>
                  {c.dr ? <i className="dot dr" title={t('Not saved', 'রাখা হয়নি')} /> : c.ch ? <i className="dot" title={t('Changed', 'বদলানো')} /> : null}<em>{i.N(c.n)}</em>
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="tx-main card" ref={body}>{main}</div>
      </div>
    </Page>
  );
}
