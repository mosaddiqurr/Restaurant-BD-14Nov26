'use client';
/* Restaurant page: what diners see on the khabo page (name and story, contact, social links, hours and charges,
   facilities, payment, colours). Nothing is saved until "Save changes". Owners cannot change the name or area
   (only the khabo team can, so diners and reviews never lose track); they ask for it instead.
   Ported from archive/prototype/panel/rest.js (V.page). */
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { C, areaOf, src, where } from '@/lib/khabo';
import type { Text } from '@/lib/data/types';
import { can, clone, monoOf, requestsOf, type PR } from '@/lib/panel/store';
import { PAYS, PAY_N, type ReqKind } from '@/lib/panel/words';
import { AskKhabo } from '../ask';
import { countChanges, useSaveEntry } from '../draft';
import { AreaF, Field, Ico, MoneyF, Page, SelF, SwRow, TextF, useLive, useR, useSaved, useT } from '../ui';

/** a social link: a full link or just the handle (@name). '' when empty, null when it is not that network */
export function socialUrl(k: string, v0: string) {
  const n = C.socials[k]; let v = String(v0 || '').trim(); if (!v) return '';
  if (!/^https?:\/\//i.test(v)) { if (/^[\w.@-]+$/.test(v)) return n.base + v.replace(/^@/, ''); v = 'https://' + v; }
  try {
    const u = new URL(v), h = u.hostname.toLowerCase().replace(/^(www|m)\./, '');
    return /^https?:$/.test(u.protocol) && new RegExp(n.host).test(h) ? 'https://' + h + u.pathname.replace(/\/$/, '') : null;
  } catch { return null; }
}

type F = {
  en: string; bn: string; tag: string; tagbn: string; story: string; storybn: string; phone: string; spot: string; spotbn: string; addr: string; addrbn: string; area: string;
  soc: Record<string, { url: string; n: string }>; main: string; open: string; close: string; ppl0: string; ppl1: string; showppl: boolean; vat: string; service: string; seats: string;
  fac: string[]; pay: string[]; deep: string; accent: string; font: 'serif' | 'sans';
};
const toF = (r: PR): F => ({
  en: r.name.en, bn: r.name.bn, tag: r.tagline?.en || '', tagbn: r.tagline?.bn || '', story: r.story?.en || '', storybn: r.story?.bn || '',
  phone: r.phone || '', spot: r.spot?.en || '', spotbn: r.spot?.bn || '', addr: r.address?.en || '', addrbn: r.address?.bn || '', area: r.area,
  soc: Object.fromEntries(Object.keys(C.socials).map(k => [k, { url: r.social?.links[k]?.url || '', n: r.social?.links[k]?.n || '' }])), main: r.social?.main || '',
  open: r.hours[0], close: r.hours[1], ppl0: String(r.ppl[0]), ppl1: String(r.ppl[1]), showppl: !r.hidePpl, vat: String(r.vat), service: String(r.service), seats: r.seats ? String(r.seats) : '',
  fac: (r.fac || []).slice(), pay: (r.pay || []).slice(), deep: r.theme.deep, accent: r.theme.accent, font: r.theme.font || 'sans',
});

/* how easy the words are to read on the chosen background (WCAG contrast). Custom colours must pass,
   so a page never ends up hard to read or out of place on khabo */
const lum = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function ReadCheck({ deep, accent }: { deep: string; accent: string }) {
  const t = useT();
  const w = ratio('#FFFFFF', deep), a = ratio(accent, deep), ok = w >= 7 && a >= 4.5;
  return (
    <span className={clsx('badge', ok ? 'ok' : 'warn')}>
      {ok ? t('Easy to read', 'সহজে পড়া যায়') : w < 7 ? t('Background too light: use a darker one', 'পটভূমি বেশি হালকা: আরও গাঢ় দিন') : t('Accent too close to the background', 'উজ্জ্বল রং পটভূমির খুব কাছাকাছি')}
      {' '}({a.toFixed(1)}:1)
    </span>
  );
}

export function Profile() {
  const i = useI(), t = useT(), { r, me, db } = useR(), saved = useSaved(), live = useLive();
  const team = can('rest.admin', me);
  const base = useMemo(() => toF(r), [r]);
  const [f, setF] = useState<F>(base), [from, setFrom] = useState(base);
  if (from !== base) { setFrom(base); setF(base); }
  const [ask, setAsk] = useState<ReqKind | null>(null);
  const dirty = JSON.stringify(f) !== JSON.stringify(base);
  const up = <K extends keyof F>(k: K) => (v: F[K]) => setF(o => ({ ...o, [k]: v }));
  const tog = (k: 'fac' | 'pay', v: string) => setF(o => ({ ...o, [k]: o[k].includes(v) ? o[k].filter(x => x !== v) : [...o[k], v] }));
  const asked = requestsOf(db, r.id).find(q => q.state === 'open' && q.kind === 'name');
  const custom = !C.palettes.some(p => p.deep === r.theme.deep && p.accent === r.theme.accent);
  const sec = (h: string, p: string, body: ReactNode) => <div className="f-sec"><div><h3>{h}</h3><p>{p}</p></div><div className="f-grid">{body}</div></div>;
  const fail = (m: string) => { toast.error(m); return false; };
  /** puts the form into the restaurant's draft (the save bar then saves it). false when something needs fixing */
  const save = (): boolean => {
    if (!dirty) return true;
    if (team && !f.en.trim()) return fail(t('The page needs an English name.', 'পেজের একটি ইংরেজি নাম লাগবে।'));
    const p0 = Number(f.ppl0), p1 = Number(f.ppl1);
    if (p0 && p1 && p1 < p0) return fail(t('"Up to" must be more than "from".', '"পর্যন্ত" অবশ্যই "থেকে"-র চেয়ে বেশি হতে হবে।'));
    if (!team && !C.palettes.some(x => x.deep === f.deep && x.accent === f.accent) && !(f.deep === r.theme.deep && f.accent === r.theme.accent)) return fail(t('Pick one of the colour pairs.', 'একটি রঙের জোড়া বাছুন।'));
    if (team && (f.deep !== base.deep || f.accent !== base.accent) && (ratio('#FFFFFF', f.deep) < 7 || ratio(f.accent, f.deep) < 4.5)) return fail(t('These colours are hard to read. Use a darker background or a brighter accent.', 'এই রংগুলো পড়তে কষ্ট হয়। আরও গাঢ় পটভূমি বা আরও উজ্জ্বল রং দিন।'));
    const links: Record<string, { url: string; n?: string }> = {}; let badSoc = '';
    Object.keys(C.socials).forEach(k => { const u = socialUrl(k, f.soc[k].url); if (u === null) badSoc = badSoc || C.socials[k].en; else if (u) links[k] = { url: u, ...(f.soc[k].n.trim() ? { n: f.soc[k].n.trim() } : {}) }; });
    if (badSoc) return fail(t(`That ${badSoc} link does not look right. Paste the link to your ${badSoc} page, or just @yourname.`, `${badSoc} লিংকটি ঠিক মনে হচ্ছে না। আপনার ${badSoc} পেজের লিংক দিন, বা শুধু @আপনারনাম।`));
    const two = (en: string, bn: string, old?: Text): Text => (en.trim() || bn.trim() ? { en: en.trim() || bn.trim(), bn: bn.trim() || en.trim() } : old || { en: '', bn: '' });
    const nr = clone(r);
    if (team) { if (f.en.trim() !== r.name.en) nr.mono = monoOf(f.en.trim()); nr.name = { en: f.en.trim(), bn: f.bn.trim() || f.en.trim() }; if (f.area !== r.area) { nr.area = f.area; nr.city = areaOf(f.area).city; } }
    nr.tagline = two(f.tag, f.tagbn); nr.story = two(f.story, f.storybn);
    nr.phone = f.phone.trim(); nr.spot = two(f.spot, f.spotbn, r.spot); nr.address = two(f.addr, f.addrbn, r.address);
    nr.hours = [f.open || r.hours[0], f.close || r.hours[1]]; nr.ppl = [p0 || r.ppl[0], p1 || r.ppl[1]];
    if (f.showppl) delete nr.hidePpl; else nr.hidePpl = true;
    nr.vat = Number(f.vat) || 0; nr.service = Number(f.service) || 0; if (Number(f.seats)) nr.seats = Number(f.seats); else delete nr.seats;
    nr.fac = f.fac; nr.pay = f.pay; nr.theme = { ...nr.theme, deep: f.deep, accent: f.accent, font: f.font };
    const main = links[f.main] ? f.main : Object.keys(links)[0] || '';
    if (Object.keys(links).length) nr.social = { links, main }; else delete nr.social;
    return saved(nr, { en: 'Updated page details', bn: 'পেজের তথ্য বদলেছেন' });
  };
  useSaveEntry({ count: countChanges(base, f, ['deep', 'accent', 'font']) + (f.deep !== base.deep || f.accent !== base.accent || f.font !== base.font ? 1 : 0), save, discard: () => setF(base), pri: 0 });
  return (
    <Page title={t('Restaurant page', 'রেস্টুরেন্টের পেজ')} sub={t('What diners see on your khabo page.', 'খাবোতে আপনার পেজে ডাইনাররা যা দেখেন।')}
      acts={<a className="btn" href={live(r)} target="_blank" rel="noopener"><Ico n="arrow-up-right" sm />{t('View page', 'পেজ দেখুন')}</a>}>
      <form className="card" noValidate onSubmit={e => { e.preventDefault(); save(); }}>
        {sec(t('Name and story', 'নাম আর গল্প'), t('Your name, a one-line tagline and a few words about the place.', 'আপনার নাম, এক লাইনের পরিচয় আর জায়গাটি নিয়ে কয়েকটি কথা।'), <>
          {team ? <>
            <TextF label={t('Name (English)', 'নাম (ইংরেজি)')} value={f.en} onChange={up('en')} req />
            <TextF bn label={t('Name (Bangla)', 'নাম (বাংলা)')} value={f.bn} onChange={up('bn')} />
          </> : (
            <Field full label={t('Restaurant name', 'রেস্টুরেন্টের নাম')} hint={t('Only the khabo team changes names, so diners and reviews never lose track of you.', 'নাম শুধু খাবো টিম বদলায়, যাতে ডাইনার আর রিভিউ কখনো আপনাকে হারিয়ে না ফেলে।')}>
              <div className="locked"><Ico n="lock-simple" sm /><div><b>{r.name.en}</b><span className="bn">{r.name.bn}</span></div>
                {asked ? <span className="badge warn">{t(`Asked for “${asked.data.en}”`, `“${asked.data.en}” চাওয়া হয়েছে`)}</span> : <button type="button" className="btn sm" onClick={() => setAsk('name')}>{t('Ask for a change', 'বদলাতে বলুন')}</button>}</div>
            </Field>
          )}
          <TextF full label={t('Tagline (English)', 'পরিচয় লাইন (ইংরেজি)')} value={f.tag} onChange={up('tag')} hint={t('One sentence. Shown under your name.', 'এক বাক্য। আপনার নামের নিচে দেখায়।')} />
          <TextF full bn label={t('Tagline (Bangla)', 'পরিচয় লাইন (বাংলা)')} value={f.tagbn} onChange={up('tagbn')} />
          <AreaF full label={t('About (English)', 'পরিচিতি (ইংরেজি)')} value={f.story} onChange={up('story')} />
          <AreaF full bn label={t('About (Bangla)', 'পরিচিতি (বাংলা)')} value={f.storybn} onChange={up('storybn')} />
        </>)}
        {sec(t('Contact and address', 'যোগাযোগ আর ঠিকানা'), t('How diners call and find you.', 'ডাইনাররা কীভাবে ফোন করেন আর আপনাকে খুঁজে পান।'), <>
          <TextF type="tel" label={t('Phone', 'ফোন')} value={f.phone} onChange={up('phone')} />
          <TextF label={t('Short location (English)', 'ছোট ঠিকানা (ইংরেজি)')} value={f.spot} onChange={up('spot')} hint={t('e.g. Road 27, Dhanmondi', 'যেমন Road 27, Dhanmondi')} />
          <TextF bn label={t('Short location (Bangla)', 'ছোট ঠিকানা (বাংলা)')} value={f.spotbn} onChange={up('spotbn')} />
          <TextF full label={t('Full address (English)', 'পুরো ঠিকানা (ইংরেজি)')} value={f.addr} onChange={up('addr')} />
          <TextF full bn label={t('Full address (Bangla)', 'পুরো ঠিকানা (বাংলা)')} value={f.addrbn} onChange={up('addrbn')} />
          {team ? <SelF label={t('Area', 'এলাকা')} value={f.area} onChange={up('area')} opts={C.areas.map(a => [a.id, `${i.L(a)}, ${i.L(C.cities[a.city])}`])} />
            : <Field label={t('Area', 'এলাকা')} hint={t('Set by the khabo team', 'খাবো টিম ঠিক করে')}><div className="locked sm"><Ico n="lock-simple" sm /><b>{where(i, r)}</b><button type="button" className="btn sm" onClick={() => setAsk('area')}>{t('Ask for a change', 'বদলাতে বলুন')}</button></div></Field>}
        </>)}
        {sec(t('Social media', 'সোশ্যাল মিডিয়া'), t('Shown on your page under your story and in Visit. Pick the one you post on most; it is shown first and bigger.', 'আপনার পেজে গল্পের নিচে আর "যাওয়া" অংশে দেখায়। যেটায় বেশি পোস্ট করেন সেটা বাছুন; সেটা আগে আর বড় করে দেখায়।'),
          <div className="full soc-ed">
            {Object.entries(C.socials).map(([k, n]) => (
              <div key={k} className="soc-row">
                <span className="soc-ic"><Ico n={n.icon} /></span>
                <TextF label={n.en} value={f.soc[k].url} onChange={v => setF(o => ({ ...o, soc: { ...o.soc, [k]: { ...o.soc[k], url: v } } }))} ph={k === 'facebook' ? 'facebook.com/yourpage' : '@yourname'} attr={{ autoCapitalize: 'off', spellCheck: false }} />
                <TextF label={t('Followers', 'ফলোয়ার')} value={f.soc[k].n} onChange={v => setF(o => ({ ...o, soc: { ...o.soc, [k]: { ...o.soc[k], n: v } } }))} ph={t('e.g. 12k', 'যেমন ১২ হাজার')} />
                <label className="soc-main" title={t('Show this one first', 'এটা আগে দেখান')}><input type="radio" name="smain" checked={f.main === k} onChange={() => up('main')(k)} /><span>{t('Main', 'প্রধান')}</span></label>
              </div>
            ))}
            <span className="hint">{t('Leave empty what you do not use. Followers are optional, write them the way you like (12k, 3,400).', 'যা ব্যবহার করেন না, খালি রাখুন। ফলোয়ার ঐচ্ছিক, যেভাবে খুশি লিখুন (১২ হাজার, ৩,৪০০)।')}</span>
          </div>)}
        {sec(t('Hours and prices', 'সময় আর দাম'), t('Opening hours and the charges added to every bill.', 'খোলার সময় আর প্রতিটি বিলে যোগ হওয়া চার্জ।'), <>
          <TextF type="time" label={t('Opens', 'খোলে')} value={f.open} onChange={up('open')} />
          <TextF type="time" label={t('Closes', 'বন্ধ হয়')} value={f.close} onChange={up('close')} hint={t('After midnight is fine, e.g. 01:00', 'মাঝরাতের পরেও হতে পারে, যেমন ০১:০০')} />
          <MoneyF label={t('Per person, from', 'জনপ্রতি, থেকে')} value={f.ppl0} onChange={up('ppl0')} />
          <MoneyF label={t('Per person, up to', 'জনপ্রতি, পর্যন্ত')} value={f.ppl1} onChange={up('ppl1')} />
          <div className="full card" style={{ padding: '0 16px' }}><SwRow label={t('Show price per person on my page', 'আমার পেজে জনপ্রতি দাম দেখান')} on={f.showppl} onChange={up('showppl')}
            hint={t('Off hides it from the top of your page. khabo still uses it for search filters like "under ৳500".', 'বন্ধ করলে পেজের ওপর থেকে লুকাবে। খাবো তবুও "৳৫০০-এর কম" এমন খোঁজের জন্য এটা ব্যবহার করে।')} /></div>
          <TextF type="number" label={t('VAT (%)', 'ভ্যাট (%)')} value={f.vat} onChange={up('vat')} attr={{ min: 0, max: 20 }} />
          <TextF type="number" label={t('Service charge (%)', 'সার্ভিস চার্জ (%)')} value={f.service} onChange={up('service')} attr={{ min: 0, max: 20 }} />
          <TextF type="number" label={t('Seats', 'আসন')} value={f.seats} onChange={up('seats')} />
        </>)}
        {sec(t('Facilities and payment', 'সুবিধা আর পেমেন্ট'), t('Diners filter by these. Only pick what you really have.', 'ডাইনাররা এগুলো দিয়ে খোঁজেন। যা সত্যিই আছে, শুধু সেটাই বাছুন।'), <>
          <div className="full"><div className="tchips">
            {Object.entries(C.facilities).map(([k, x]) => <button key={k} type="button" className={clsx('tchip', f.fac.includes(k) && 'on')} aria-pressed={f.fac.includes(k)} onClick={() => tog('fac', k)}><Ico n={x.i} sm />{i.L(x)}</button>)}
          </div></div>
          <Field full label={t('Payment', 'পেমেন্ট')}><div className="tchips">
            {PAYS.map(p => <button key={p} type="button" className={clsx('tchip', f.pay.includes(p) && 'on')} aria-pressed={f.pay.includes(p)} onClick={() => tog('pay', p)}>{i.L(PAY_N[p])}</button>)}
          </div></Field>
        </>)}
        {sec(t('Page look', 'পেজের রং'), t('Your colours and lettering. Every choice is made to sit well with khabo, so your page feels like yours and still belongs.', 'আপনার রং আর অক্ষরের ধরন। প্রতিটি বাছাই খাবোর সঙ্গে মানিয়ে বানানো, তাই পেজ আপনার নিজের মতো লাগে, আবার খাবোর সঙ্গেও মানায়।'), <>
          {/* the preview is the real name card from the page, in the chosen colours and lettering */}
          <div className="full">
            <div className={clsx('look look2', f.font === 'serif' && 'serif')} style={{ '--d': f.deep, '--a': f.accent } as CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.hero?.[0] ? <img src={src(r.hero[0], 900)} alt="" /> : null}
              <div className="l2-card">
                <span className="l2-mono">{r.mono}</span>
                <div>
                  <b>{i.L(r.name)}</b>
                  <em>{r.name.bn}</em>
                  <i className="l2-rule" />
                  <p>{i.L(r.tagline) || t('Your one-line tagline shows here.', 'আপনার এক লাইনের পরিচয় এখানে দেখাবে।')}</p>
                </div>
              </div>
              <span className="lb">{t('See the menu', 'মেনু দেখুন')}</span>
            </div>
          </div>
          <Field full label={t('Lettering', 'অক্ষরের ধরন')}><div className="fonts">
            {([['serif', t('Classic', 'ক্লাসিক'), t('Elegant, for heritage and fine dining', 'রুচিশীল, ঐতিহ্য আর ফাইন ডাইনিংয়ের জন্য')], ['sans', t('Modern', 'আধুনিক'), t('Clean, for cafés and casual places', 'পরিষ্কার, ক্যাফে আর সাধারণ জায়গার জন্য')]] as const).map(([k, n, h]) => (
              <button key={k} type="button" className={clsx('fontc', k, f.font === k && 'on')} aria-pressed={f.font === k} onClick={() => up('font')(k)}>
                <span className="aa">Aa</span><span><b>{n}</b><small>{h}</small></span>
              </button>
            ))}
          </div></Field>
          <Field full label={t('Colour pairs', 'রঙের জোড়া')}><div className="palg">
            {(C.paletteGroups || [{ id: '', en: '', bn: '' }]).map(g => {
              const list = C.palettes.filter(p => !g.id || p.g === g.id);
              return list.length ? (
                <div key={g.id}>
                  {g.id ? <h4>{i.L(g)}</h4> : null}
                  <div className="pals">
                    {list.map(p => <button key={p.id} type="button" className={clsx('pal', f.deep === p.deep && f.accent === p.accent && 'on')} aria-pressed={f.deep === p.deep && f.accent === p.accent} style={{ '--d': p.deep, '--a': p.accent } as CSSProperties} onClick={() => setF(o => ({ ...o, deep: p.deep, accent: p.accent }))}><i /><span>{i.L(p)}</span></button>)}
                  </div>
                </div>
              ) : null;
            })}
            {custom ? <div className="pals"><button type="button" className={clsx('pal', f.deep === r.theme.deep && f.accent === r.theme.accent && 'on')} style={{ '--d': r.theme.deep, '--a': r.theme.accent } as CSSProperties} onClick={() => setF(o => ({ ...o, deep: r.theme.deep, accent: r.theme.accent }))}><i /><span>{t('Custom (set by khabo)', 'নিজস্ব (খাবো ঠিক করেছে)')}</span></button></div> : null}
          </div></Field>
          {team ? <div className="full colors">
            <label><input type="color" value={f.deep} onChange={e => up('deep')(e.target.value)} /> {t('Background', 'পটভূমি')}</label>
            <label><input type="color" value={f.accent} onChange={e => up('accent')(e.target.value)} /> {t('Accent', 'উজ্জ্বল রং')}</label>
            <ReadCheck deep={f.deep} accent={f.accent} />
            <span className="meta">{t('khabo team only: custom colours. Keep the background dark and the accent bright.', 'শুধু খাবো টিম: নিজস্ব রং। পটভূমি গাঢ় আর উজ্জ্বল রং উজ্জ্বল রাখুন।')}</span>
          </div> : null}
        </>)}
      </form>
      <AskKhabo open={!!ask} kind={ask || 'name'} onClose={() => setAsk(null)} />
    </Page>
  );
}
