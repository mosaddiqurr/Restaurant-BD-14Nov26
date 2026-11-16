'use client';
/* Your website (ported from website/panel/site.js).
   Every restaurant's khabo page is also its own website: the QR on the table opens it, and the owner can put the
   same link on Facebook, Instagram, Google Maps and so on. This page gives them the link, the QR, the places
   to put it, and door stickers. */
import { useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { useI } from '@/components/providers/i18n';
import { qrStyle } from '@/components/qr/qr';
import type { Text } from '@/lib/data/types';
import { clone, hash, rng, siteAddr, type PR } from '@/lib/panel/store';
import { copyText, Ico, Page, Sample, useLive, useR, useSaved, useT } from '../ui';
import { qrFile, QrSvg, Scaled, siteLink, svgFor } from '../qr/kit';
import { StickerDrawer } from '../qr/sticker';

/* where an owner can put their link. Saved per restaurant in r.promo = { id: true } */
const SPOTS: { id: string; icon: string; t: Text; h: Text; act?: 'sticker' | 'png' }[] = [
  { id: 'facebook', icon: 'share-network', t: { en: 'Facebook page', bn: 'ফেসবুক পেজ' }, h: { en: 'In your page’s About or Page info, paste the link in the Website box.', bn: 'পেজের About বা Page info-তে Website ঘরে লিংকটি দিন।' } },
  { id: 'instagram', icon: 'camera', t: { en: 'Instagram bio', bn: 'ইনস্টাগ্রাম বায়ো' }, h: { en: 'Edit profile, then add the link under Links.', bn: 'Edit profile-এ গিয়ে Links-এ লিংকটি যোগ করুন।' } },
  { id: 'google', icon: 'map-pin', t: { en: 'Google Maps', bn: 'গুগল ম্যাপস' }, h: { en: 'In your Google Business Profile, put the link in the Website box. People who find you on Maps land on your menu.', bn: 'Google Business Profile-এর Website ঘরে লিংকটি দিন। ম্যাপে যারা আপনাকে খুঁজে পান, তারা সোজা আপনার মেনুতে আসবেন।' } },
  { id: 'whatsapp', icon: 'whatsapp-logo', t: { en: 'WhatsApp Business', bn: 'হোয়াটসঅ্যাপ বিজনেস' }, h: { en: 'Add the link to your business profile, and send it when someone asks for the menu.', bn: 'বিজনেস প্রোফাইলে লিংকটি দিন, আর কেউ মেনু চাইলে এটি পাঠান।' } },
  { id: 'door', icon: 'door-open', t: { en: 'Door or window', bn: 'দরজা বা জানালা' }, h: { en: 'A QR sticker lets people passing by see the menu and prices before they walk in.', bn: 'কিউআর স্টিকার থাকলে পথচারীরা ভেতরে ঢোকার আগেই মেনু আর দাম দেখে নিতে পারেন।' }, act: 'sticker' },
  { id: 'bill', icon: 'receipt', t: { en: 'Bill and visiting cards', bn: 'বিল আর ভিজিটিং কার্ড' }, h: { en: 'Print the QR on your bill pad and cards so people come back.', bn: 'বিলের প্যাড আর কার্ডে কিউআর ছাপুন, যাতে মানুষ আবার আসে।' }, act: 'png' },
  { id: 'takeaway', icon: 'bowl-food', t: { en: 'Takeaway bags and boxes', bn: 'টেকঅ্যাওয়ের ব্যাগ আর বাক্স' }, h: { en: 'A small QR sticker brings takeaway customers back to your page.', bn: 'ছোট একটি কিউআর স্টিকার টেকঅ্যাওয়ের ক্রেতাদের আবার আপনার পেজে নিয়ে আসে।' }, act: 'png' },
];
/* everything the website shows, and where the owner changes it */
const PARTS: [string, Text, string][] = [
  ['list', { en: 'Menu and prices', bn: 'মেনু আর দাম' }, 'menu'], ['tag', { en: 'Deals', bn: 'অফার' }, 'deals'], ['images', { en: 'Photos', bn: 'ছবি' }, 'photos'],
  ['virtual-reality', { en: '360° tour', bn: '৩৬০° ট্যুর' }, 'photos'], ['chat-circle-dots', { en: 'Reviews and your replies', bn: 'রিভিউ আর আপনার উত্তর' }, 'reviews'],
  ['clock', { en: 'Opening hours and map', bn: 'খোলার সময় আর ম্যাপ' }, 'profile'], ['phone', { en: 'Call and WhatsApp buttons', bn: 'কল আর হোয়াটসঅ্যাপ বোতাম' }, 'profile'],
];

const noSub = () => () => {};
/** a ready-made post for social media, in English or Bangla */
const post = (r: PR, lang: string, addr: string) => lang === 'bn'
  ? `${r.name.bn || r.name.en}-এর পুরো মেনু, আজকের দাম, ছবি${r.tour?.length ? ', ৩৬০° ট্যুর' : ''} আর রিভিউ এক জায়গায়। কোনো অ্যাপ লাগবে না: ${addr}`
  : `See our full menu, today’s prices, photos${r.tour?.length ? ', a 360° tour' : ''} and reviews in one place. No app needed: ${addr}`;

/* sample visits, the same for a restaurant every time (real numbers come once the site is live) */
const traffic = (id: string) => {
  const rnd = rng(id + '|traffic'), base = 60 + hash(id) % 120;
  const sum = Array.from({ length: 30 }, (_, i) => Math.round(base * (0.75 + rnd() * 0.5) * (i % 7 === 4 || i % 7 === 5 ? 1.35 : 1))).reduce((a, b) => a + b, 0);
  return { views: sum, qr: Math.round(sum * 0.21), shared: Math.round(sum * 0.14) };
};

export function SitePage() {
  const { r, rto } = useR();
  const i = useI(), t = useT(), live = useLive(), saved = useSaved();
  const link = siteLink(i.lang, r), addr = siteAddr(r);
  const promo = (r.promo || {}) as Record<string, unknown>;
  const lang = promo._lang === 'bn' ? 'bn' : 'en';
  /* the post can be edited before copying; it starts again when the language or the restaurant changes */
  const fresh = post(r, lang, addr);
  const [text, setText] = useState(fresh), [base, setBase] = useState(fresh);
  if (base !== fresh) { setBase(fresh); setText(fresh); }
  const [stk, setStk] = useState(false);
  const canShare = useSyncExternalStore(noSub, () => !!navigator.share, () => false);
  const svg = useMemo(() => svgFor(link, qrStyle(r)), [link, r]);
  const tr = useMemo(() => traffic(r.id), [r.id]);
  const n = SPOTS.filter(s => promo[s.id]).length;

  const copyLink = () => copyText(link, t('Link copied. Paste it anywhere.', 'লিংক কপি হয়েছে। যেকোনো জায়গায় পেস্ট করুন।'));
  const dl = (kind: 'png' | 'svg') => qrFile(svg, `${r.id}-khabo-qr`, kind, t('Could not make the PNG. Try the SVG.', 'PNG তৈরি করা গেল না। SVG চেষ্টা করুন।'));
  const save = (patch: Record<string, unknown>, what?: Text) => { const nr = clone(r); nr.promo = { ...(nr.promo || {}), ...patch }; saved(nr, what); };
  const spot = (s: (typeof SPOTS)[number], on: boolean) => save({ [s.id]: on || undefined },
    { en: `${on ? 'Added' : 'Removed'} the website link: ${s.t.en}`, bn: `ওয়েবসাইটের লিংক ${on ? 'যোগ করেছেন' : 'সরিয়েছেন'}: ${s.t.bn}` });
  const wa = `https://wa.me/?text=${encodeURIComponent(post(r, 'en', addr).replace(addr, link))}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
  const stat = (k: string, icon: string, v: number, note: string) => (
    <div className="card stat"><div className="k"><Ico n={icon} sm />{k}</div><div className="v num">{i.N(v)}</div><div className="d">{note}</div></div>
  );

  return (
    <Page title={t('Your website', 'আপনার ওয়েবসাইট')}
      sub={t('Your khabo page is your restaurant’s own website. The QR on your tables opens it, and you can share the same link anywhere.', 'আপনার খাবো পেজই আপনার রেস্টুরেন্টের নিজের ওয়েবসাইট। টেবিলের কিউআর এটাই খোলে, আর একই লিংক যেকোনো জায়গায় শেয়ার করা যায়।')}
      acts={<>
        <a className="btn" href={live(r)} target="_blank" rel="noopener"><Ico n="arrow-up-right" sm />{t('Open your website', 'ওয়েবসাইট খুলুন')}</a>
        <button type="button" className="btn pri" onClick={copyLink}><Ico n="check" sm />{t('Copy link', 'লিংক কপি করুন')}</button>
      </>}>
      <div className="pq">
        <section className="card ws-hero" style={{ '--d': r.theme.deep, '--a': r.theme.accent } as CSSProperties}>
          <div className="ws-stage">
            <div className="ws-desk">
              <div className="ws-bar"><i /><i /><i /><span><Ico n="globe-hemisphere-east" sm />{addr}</span></div>
              <Scaled w={1280} url={live(r)} title={t('Your website on a computer', 'কম্পিউটারে আপনার ওয়েবসাইট')} lazy />
            </div>
            <div className="ws-phone"><Scaled w={390} url={live(r) + '?embed=1'} title={t('Your website on a phone', 'ফোনে আপনার ওয়েবসাইট')} lazy /></div>
          </div>
          <div className="ws-side">
            <h2>{t(`${r.name.en} has its own website`, `${r.name.bn || r.name.en}-এর নিজের ওয়েবসাইট আছে`)}</h2>
            <p>{t('No web designer and no hosting bill. Whatever you save in this panel shows on it straight away.', 'ওয়েব ডিজাইনার বা হোস্টিংয়ের বিল লাগে না। এই প্যানেলে যা রাখেন, সাথে সাথে সেখানে দেখা যায়।')}</p>
            <div className="ws-addr"><span><Ico n="globe-hemisphere-east" /><b>{addr}</b></span><button type="button" className="btn sm" onClick={copyLink}>{t('Copy', 'কপি')}</button></div>
            <p className="meta">{t('This will be your address once khabo is live. For now the link opens this test site.', 'খাবো চালু হলে এটাই হবে আপনার ঠিকানা। এখন লিংকটি এই পরীক্ষার সাইট খোলে।')}</p>
            <div className="ws-share">
              <a className="btn sm" href={wa} target="_blank" rel="noopener"><Ico n="whatsapp-logo" sm />{t('WhatsApp', 'হোয়াটসঅ্যাপ')}</a>
              <a className="btn sm" href={fb} target="_blank" rel="noopener"><Ico n="share-network" sm />{t('Facebook', 'ফেসবুক')}</a>
              {canShare ? <button type="button" className="btn sm" onClick={() => navigator.share({ title: r.name.en, text: post(r, i.lang, addr), url: link }).catch(() => {})}><Ico n="share-network" sm />{t('More', 'আরও')}</button> : null}
            </div>
            <div className="ws-qr">
              <QrSvg cls="ws-qr-box" svg={svg} />
              <div>
                <b>{t('Your website QR', 'আপনার ওয়েবসাইটের কিউআর')}</b>
                <span className="meta">{t('The same code works on the door, on bills, cards and takeaway bags. Table cards are under ', 'একই কোড দরজা, বিল, কার্ড আর টেকঅ্যাওয়ের ব্যাগে কাজ করে। টেবিল কার্ড আছে ')}<Link href={rto('qr')}>{t('Table QR', 'টেবিল কিউআর')}</Link>{t('.', '-এ।')}</span>
                <div className="ws-share">
                  <button type="button" className="btn sm" onClick={() => dl('png')}><Ico n="arrow-down" sm />PNG</button>
                  <button type="button" className="btn sm" onClick={() => dl('svg')}><Ico n="arrow-down" sm />SVG</button>
                  <button type="button" className="btn sm" onClick={() => setStk(true)}><Ico n="printer" sm />{t('Door sticker', 'দরজার স্টিকার')}</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid g-main" style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-h"><h2>{t('Where to put your link', 'লিংক কোথায় দেবেন')}</h2><span className="r meta">{t(`${n} of ${SPOTS.length} done`, `${i.N(SPOTS.length)}টির মধ্যে ${i.N(n)}টি হয়েছে`)}</span></div>
            <div className="card-b" style={{ paddingTop: 0 }}><div className="meter" style={{ marginBottom: 6 }}><i style={{ '--w': Math.round(n / SPOTS.length * 100) } as CSSProperties} /></div></div>
            <div className="ws-spots">
              {SPOTS.map(s => {
                const on = !!promo[s.id];
                return (
                  <label key={s.id} className={clsx('ws-spot', on && 'on')}>
                    <input type="checkbox" checked={on} onChange={e => spot(s, e.target.checked)} />
                    <span className="ws-ic"><Ico n={s.icon} /></span>
                    <span className="ws-t"><b>{i.L(s.t)}</b><span className="meta">{i.L(s.h)}</span></span>
                    {s.act === 'sticker' ? <button type="button" className="btn sm" onClick={e => { e.preventDefault(); setStk(true); }}>{t('Print', 'প্রিন্ট')}</button>
                      : s.act === 'png' ? <button type="button" className="btn sm" onClick={e => { e.preventDefault(); dl('png'); }}>{t('QR', 'কিউআর')}</button>
                        : <button type="button" className="btn sm" onClick={e => { e.preventDefault(); copyLink(); }}>{t('Copy link', 'লিংক কপি')}</button>}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="stack" style={{ gap: 16 }}>
            <div className="card">
              <div className="card-h">
                <h2>{t('Ready-made post', 'তৈরি পোস্ট')}</h2>
                <span className="r">
                  <div className="seg" role="radiogroup">
                    {(['en', 'bn'] as const).map(k => <button key={k} type="button" role="radio" aria-checked={lang === k} className={lang === k ? 'on' : ''} onClick={() => save({ _lang: k })}>{k === 'en' ? 'English' : 'বাংলা'}</button>)}
                  </div>
                </span>
              </div>
              <div className="card-b stack">
                <textarea className={clsx('inp', lang === 'bn' && 'bn')} rows={4} value={text} onChange={e => setText(e.target.value)} aria-label={t('Ready-made post', 'তৈরি পোস্ট')} />
                <button type="button" className="btn" style={{ justifySelf: 'start' }} onClick={() => copyText(text, t('Post copied.', 'পোস্ট কপি হয়েছে।'))}><Ico n="check" sm />{t('Copy post', 'পোস্ট কপি করুন')}</button>
              </div>
            </div>
            <div className="card">
              <div className="card-h"><h2>{t('Always up to date', 'সবসময় হালনাগাদ')}</h2></div>
              <div className="ws-parts">
                {PARTS.map(([icon, l, v]) => <Link key={l.en} href={rto(v)}><Ico n={icon} sm /><span>{i.L(l)}</span><Ico n="caret-right" sm /></Link>)}
              </div>
            </div>
          </div>
        </div>

        <div className="sec-t"><h2>{t('Visits to your website, last 30 days', 'আপনার ওয়েবসাইটে ভিজিট, গত ৩০ দিন')}</h2><Sample /></div>
        <div className="grid g3">
          {stat(t('All visits', 'সব ভিজিট'), 'eye', tr.views, t('From khabo, your link and your QR', 'খাবো, আপনার লিংক আর কিউআর থেকে'))}
          {stat(t('From your QR codes', 'আপনার কিউআর কোড থেকে'), 'qr-code', tr.qr, t('Tables, door, bills and bags', 'টেবিল, দরজা, বিল আর ব্যাগ'))}
          {stat(t('From your shared link', 'শেয়ার করা লিংক থেকে'), 'share-network', tr.shared, t('Facebook, Instagram, WhatsApp, Maps', 'ফেসবুক, ইনস্টাগ্রাম, হোয়াটসঅ্যাপ, ম্যাপস'))}
        </div>
      </div>
      <StickerDrawer r={r} open={stk} onClose={() => setStk(false)} url={link} />
    </Page>
  );
}
