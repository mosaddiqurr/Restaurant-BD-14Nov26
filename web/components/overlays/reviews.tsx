'use client';
/* All reviews of a restaurant (with filters and sort), and writing one. A side sheet on laptops,
   a bottom sheet on phones. Ported from website/app/app.js (AllReviews, WriteReview). */
import '@/styles/restaurant-extra.css';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Drawer } from 'vaul';
import { AnimatePresence, m } from 'motion/react';
import { toast } from '@/lib/toast';
import { useI } from '@/components/providers/i18n';
import { I, Mono, Seg } from '@/components/ui/bits';
import { Choose } from '@/components/ui/choose';
import { RvCard, filterRv } from '@/components/cards/review';
import { needSign } from '@/components/cards/actions';
import { S, useApp, type WriteOpen } from '@/lib/store';
import { useLiveReviews } from '@/lib/demo-db';
import { EASE } from '@/lib/khabo';
import type { Review, Text } from '@/lib/data/types';
import type { MenuNames } from '@/app/api/dish/route';
import { useIsPhone, type RMini, type RvAllX, type WriteX } from '@/components/restaurant/util';
import { W } from '@/components/restaurant/words';

const NONE: Review[] = [];
function useKept<T>(v: T | null) {
  const [k, setK] = useState<T | null>(v);
  if (v && v !== k) setK(v);
  return v || k;
}
const sameName = (o: string, d: Text) => o.toLowerCase() === d.en.toLowerCase() || o === d.bn;

/* ---------- every review ---------- */
export function AllReviews() {
  const i = useI(), phone = useIsPhone();
  const rvAll = useApp(s => s.rvAll), set = useApp(s => s.set), myRv = useApp(s => s.myRv);
  const cur = useKept(rvAll);
  const [f, setF] = useState('all'), [sort, setSort] = useState('new'), [seen, setSeen] = useState(rvAll);
  if (rvAll !== seen) { setSeen(rvAll); if (rvAll) { setF('all'); setSort('new'); } }
  const list0 = useLiveReviews(cur?.list || NONE);
  const r = cur?.r as (RMini & RvAllX) | undefined;
  let list: (Review & { own?: boolean })[] = r ? [...(f === 'all' ? myRv.filter(v => v.r === r.id).map(v => ({ ...v, own: true })) : []), ...filterRv(list0, f)] : [];
  if (r?.dish) list = list.filter(v => (v.ord || []).some(o => sameName(o, r.dish!)));
  if (sort === 'high') list = list.slice().sort((a, b) => b.st - a.st);
  if (sort === 'low') list = list.slice().sort((a, b) => a.st - b.st);
  const RVF: [string, string][] = [['all', i.t('rv_all')], ['verified', i.t('verified_visit')], ['photos', i.t('with_photos')], ['bn', 'বাংলায়']];
  const close = () => set({ rvAll: null });
  return (
    <Drawer.Root open={!!rvAll} onOpenChange={o => { if (!o) close(); }} direction={phone ? 'bottom' : 'right'}>
      <Drawer.Portal>
        <Drawer.Overlay className="vaul-over" />
        <Drawer.Content className="vaul-r" aria-describedby={undefined}>
          {r ? (
            <>
              <div className="side-h">
                <div>
                  <Drawer.Title className="h3">{r.dish ? i.tx('rv_about', { d: i.L(r.dish) }) : i.tx('all_rv')}</Drawer.Title>
                  <p className="meta" style={{ marginTop: 2 }}><I n="star" f cls="star" /> {i.N(r.rating)}{r.reviews != null ? ' · ' + i.t('rv_counts', { n: i.N(r.reviews), v: i.N(r.verified || 0) }) : ''}</p>
                </div>
                <button className="x" onClick={close} aria-label={i.t('close')}><I n="x" b /></button>
              </div>
              <div className="side-p" style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
                <div className="rva-tools">
                  <Seg id="rva" items={RVF} value={f} onChange={setF} />
                  <Choose icon="sort-ascending" label={i.tx(sort === 'new' ? 'newest' : sort === 'high' ? 'high' : 'low')} opts={[['new', i.tx('newest')], ['high', i.tx('high')], ['low', i.tx('low')]]} value={sort} onPick={setSort} />
                </div>
                <AnimatePresence mode="popLayout" initial={false}>
                  {list.length ? list.map((v, k) => (
                    <m.div key={v.who + (v.at || '') + k + f + sort} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.28, delay: Math.min(k, 6) * 0.03, ease: EASE }}>
                      <RvCard v={v} r={r} />
                    </m.div>
                  )) : <m.div key="none" className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><b>{i.t('no_reviews')}</b></m.div>}
                </AnimatePresence>
                <button className="btn btn-own" style={{ '--rd': r.theme.deep, '--ra': r.theme.accent } as React.CSSProperties}
                  onClick={() => { close(); needSign(() => S().set({ write: { r, dish: r.dish?.en } })); }}>
                  <I n="chat-circle-dots" />{i.t('write_review')}
                </button>
              </div>
            </>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/* ---------- write a review ---------- */
/** a chosen photo, made small enough to keep in this browser */
async function shrink(file: File, max = 720): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
  return c.toDataURL('image/jpeg', 0.78);
}
const BD = '০১২৩৪৫৬৭৮৯';
const asciiDigits = (s: string) => s.replace(/[০-৯]/g, c => String(BD.indexOf(c)));

export function WriteReview() {
  const i = useI(), phone = useIsPhone();
  const write = useApp(s => s.write), set = useApp(s => s.set), user = useApp(s => s.user), addReview = useApp(s => s.addReview);
  const w = useKept<WriteOpen>(write);
  const [st, setSt] = useState(0), [ord, setOrd] = useState<string[]>([]), [txt, setTxt] = useState(''), [pics, setPics] = useState<string[]>([]), [err, setErr] = useState('');
  /* a fresh form each time it opens */
  const [seen, setSeen] = useState<WriteOpen | null>(null);
  if (write && write !== seen) { setSeen(write); setSt(0); setTxt(''); setPics([]); setErr(''); setOrd(write.dish ? [write.dish] : []); }
  /* the dish names come with the request from the restaurant page; from anywhere else they load from /api/dish */
  const given = w ? (w.r as RMini & WriteX).menu : undefined;
  const [fetched, setFetched] = useState<{ id: string; menu: { id: string; name: Text }[] } | null>(null);
  const rid = w?.r.id;
  useEffect(() => {
    if (!rid || given) return;
    let dead = false;
    fetch(`/api/dish?r=${encodeURIComponent(rid)}`).then(x => x.ok ? x.json() as Promise<MenuNames> : null).then(v => { if (!dead && v) setFetched({ id: rid, menu: v.menu }); }).catch(() => {});
    return () => { dead = true; };
  }, [rid, given]);
  const menu = given || (fetched && fetched.id === rid ? fetched.menu : []);
  const r = w?.r;
  /* the first dozen dishes, and the one this review is about if it is further down */
  const chips = menu.slice(0, 12);
  if (w?.dish) { const d = menu.find(z => z.name.en === w.dish); if (d && !chips.includes(d)) chips.unshift(d); }
  const len = txt.trim().length;
  const check = (): string => {
    if (!st) return 'st';
    if (len < 20) return 't';
    if (len > 1000) return 'long';
    const flat = asciiDigits(txt).replace(/[\s-]/g, '');
    if (/(https?:\/\/|www\.)/i.test(txt) || /(\+?88)?01[3-9]\d{8}/.test(flat)) return 'link';
    return '';
  };
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!r) return;
    const e = check(); setErr(e); if (e) return;
    addReview({
      r: r.id, who: user ? `${i.tx('you')} (${user})` : i.tx('you'), st, t: txt.trim(), ord,
      when: { en: 'Just now', bn: 'এইমাত্র' }, at: Date.now(), vf: false, mine: true, ...(pics.length ? { pics } : {}), ...(w?.dish ? { dish: w.dish } : {}),
    });
    set({ write: null });
    toast.success(i.t('review_thanks'));
  };
  const pick = async (files: FileList | null) => {
    if (!files) return;
    const room = 4 - pics.length; if (room <= 0) return;
    const out = await Promise.all(Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, room).map(f => shrink(f).catch(() => '')));
    setPics(p => [...p, ...out.filter(Boolean)].slice(0, 4));
  };
  return (
    <Drawer.Root open={!!write} onOpenChange={o => { if (!o) set({ write: null }); }} direction={phone ? 'bottom' : 'right'}>
      <Drawer.Portal>
        <Drawer.Overlay className="vaul-over" />
        <Drawer.Content className="vaul-r" aria-describedby={undefined}>
          {r ? (
            <form className="wr" onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', height: '100%', '--rd': r.theme.deep, '--ra': r.theme.accent } as React.CSSProperties}>
              <div className="side-h">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Mono r={r} />
                  <div><Drawer.Title className="h3">{i.t('write_review')}</Drawer.Title><span className="meta">{i.L(r.name)}{user ? ' · ' + user : ''}</span></div>
                </div>
                <button type="button" className="x" onClick={() => set({ write: null })} aria-label={i.t('close')}><I n="x" b /></button>
              </div>
              <div className="side-p">
                <b style={{ display: 'block', fontSize: 14.5 }} id="wr-st">{i.t('your_rating')}</b>
                <div className="pick-st" role="radiogroup" aria-labelledby="wr-st" style={{ marginTop: 6 }}>
                  {[1, 2, 3, 4, 5].map(k => (
                    <m.button type="button" key={k} className={k <= st ? 'on' : ''} role="radio" aria-checked={k === st} aria-label={i.t('n_stars', { n: k })}
                      onClick={() => { setSt(k); setErr(''); }} whileTap={{ scale: 0.9 }}
                      animate={k <= st ? { scale: [1, 1.22, 1] } : { scale: 1 }} transition={{ duration: 0.3, delay: k <= st ? k * 0.03 : 0, ease: EASE }}>
                      <I n="star" f />
                    </m.button>
                  ))}
                </div>
                <p className="meta" style={{ color: err === 'st' ? 'var(--bad)' : undefined }}>{st ? i.t('st_' + st) : err === 'st' ? i.t('pick_stars') : i.t('tap_stars')}</p>
                <label><span>{i.t('what_ordered')}</span></label>
                <div className="chips" style={{ marginTop: 8 }}>
                  {chips.map(d => {
                    const on = ord.includes(d.name.en);
                    return <button type="button" key={d.id} className={clsx('chip sm', on && 'on')} aria-pressed={on} onClick={() => setOrd(on ? ord.filter(z => z !== d.name.en) : [...ord, d.name.en])}>{on ? <I n="check" b /> : null}{i.L(d.name)}</button>;
                  })}
                  {!chips.length ? <span className="sk sk-line" style={{ width: 180, height: 32, borderRadius: 10 }} /> : null}
                </div>
                <label>
                  {i.t('your_review')}
                  <textarea value={txt} onChange={ev => { setTxt(ev.target.value); if (err && err !== 'st') setErr(''); }} placeholder={i.t('review_ph')} aria-invalid={err === 't' || err === 'long' || err === 'link'} maxLength={1200} />
                  <span className="meta" style={{ fontWeight: 500, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span>{i.t('review_help')}</span>
                    <span className={clsx('wr-count', len >= 20 && 'ok')} aria-live="polite">{len < 20 ? i.L(W.letters).replace('{n}', i.dg(len)) : <I n="check-circle" f />}</span>
                  </span>
                  {err === 't' ? <span className="wr-err">{i.t('review_err')}</span> : err === 'long' ? <span className="wr-err">{i.L(W.tooLong)}</span> : err === 'link' ? <span className="wr-err">{i.L(W.noLinks)}</span> : null}
                </label>
                <label>
                  {i.t('add_photos')}
                  <span className={clsx('btn btn-line btn-sm wr-file')} aria-disabled={pics.length >= 4}>
                    <I n="camera" />{pics.length >= 4 ? i.L(W.upTo4) : i.t('choose_photos')}
                    <input type="file" accept="image/*" multiple hidden disabled={pics.length >= 4} onChange={ev => { pick(ev.target.files); ev.target.value = ''; }} />
                  </span>
                </label>
                {pics.length ? (
                  <div className="wr-pics">
                    <AnimatePresence initial={false}>
                      {pics.map((p, k) => (
                        <m.div key={p.slice(-40) + k} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2, ease: EASE }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p} alt="" />
                          <button type="button" onClick={() => setPics(pics.filter((_, x) => x !== k))} aria-label={i.L(W.removePhoto)}><I n="x" b /></button>
                        </m.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : null}
                <p className="meta" style={{ marginTop: 14, display: 'flex', gap: 6 }}><I n="seal-check" />{i.t('review_note')}</p>
              </div>
              <div style={{ padding: '12px 22px 20px', borderTop: '1px solid var(--line)' }}>
                <button className="btn btn-own btn-lg" type="submit" style={{ width: '100%' }}>{i.t('post_review')}</button>
              </div>
            </form>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
