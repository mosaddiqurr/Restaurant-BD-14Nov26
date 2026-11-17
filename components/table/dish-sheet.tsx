'use client';
/* The dish sheet on the table menu: photo (or the dish film), names in both languages, portion, spice, the price
   in the restaurant's own colour with the add button, how it is made, and more dishes from the same kitchen.
   Opened from the table menu it stays about this restaurant only: no other places, no price history. */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { m } from 'motion/react';
import { Drawer } from 'vaul';
import { useI } from '@/components/providers/i18n';
import { I, Spice, Tk } from '@/components/ui/bits';
import { C, SPR, src } from '@/lib/khabo';
import type { Dish, Restaurant, RestaurantMini } from '@/lib/data/types';
import { Img, TAdd, rVars, useChecked } from './parts';
import { tagsOf } from '@/lib/tags';
import { W } from './words';
import { sized } from '@/components/cards/actions';

const SWEET = ['tea', 'bakery', 'dessert', 'drink', 'coffee'];

export function TableDishSheet({ r, mini, dish, open, onClose, onPick, theme }: {
  r: Restaurant; mini: RestaurantMini; dish: Dish | null; open: boolean; onClose: () => void; onPick: (d: Dish) => void; theme: string;
}) {
  const i = useI();
  /* a new dish starts on its photo, at the top */
  const [pick, setPick] = useState<{ id?: string; tab: 'photo' | 'video' }>({ tab: 'photo' });
  const tab = pick.id === dish?.id ? pick.tab : 'photo', setTab = (t: 'photo' | 'video') => setPick({ id: dish?.id, tab: t });
  const scroller = useRef<HTMLDivElement>(null);
  const checked = useChecked(r);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [dish?.id]);
  const d = dish;
  /* portions: the first is chosen to start; the price and the + follow the chosen one */
  const [szPick, setSzPick] = useState<{ id?: string; sz?: string }>({});
  const sz = d?.sizes?.length ? d.sizes.find(z => z.id === (szPick.id === d.id ? szPick.sz : undefined)) || d.sizes[0] : null;
  const line = d && sz ? sized(d, sz) : d;
  const ty = d ? C.types[d.type] : undefined;
  const more = d ? [...r.signature || [], ...r.menu.filter(m => m.best).map(m => m.id)]
    .map(id => r.menu.find(m => m.id === id)).filter((m, k, a): m is Dish => !!m && m.id !== d.id && a.indexOf(m) === k).slice(0, 4) : [];
  const other = d ? (i.bn ? d.name.en : d.name.bn) : '';
  const showSpice = d ? d.spice > 0 || !SWEET.includes(d.type) : false;
  return (
    <Drawer.Root open={open && !!d} onOpenChange={o => { if (!o) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="tmx-over" />
        <Drawer.Content className={clsx('tmx tmx-c tmx-dish', 'tm-th-' + theme)} style={rVars(r)} data-font={r.theme.font} aria-describedby={undefined}>
          {d ? (
            <div className="tmx-scroll" ref={scroller}>
              <div className="tmx-media">
                <span className="tmx-grab" aria-hidden="true" />
                {tab === 'video' && d.video ? (
                  <>
                    <video key={d.id} src={d.video} poster={d.p ? src(d.p, 800) : undefined} autoPlay muted loop playsInline />
                    <span className="tmx-note"><I n="video-camera" />{i.t('dish_video_note')}</span>
                  </>
                ) : d.p ? (
                  <Img id={d.p} w={1000} sizes="(max-width: 560px) 100vw, 560px" alt={i.L(d.name)} eager />
                ) : (
                  <div className="tmx-none"><span><I n={ty?.i || 'fork-knife'} /></span><span>{i.t('photo_soon')}</span></div>
                )}
                {d.video ? (
                  <div className="tmx-tabs" role="tablist">
                    {(['photo', 'video'] as const).map(k => (
                      <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                        {tab === k ? <m.span layoutId="tmx-tab" className="tm-pill" transition={SPR} /> : null}
                        <I n={k === 'photo' ? 'image' : 'play'} f={k === 'video'} />{i.t(k)}
                      </button>
                    ))}
                  </div>
                ) : null}
                <button type="button" className="tmx-x" onClick={onClose} aria-label={i.L(W.close)}><I n="x" b /></button>
              </div>
              <div className="tmx-info">
                <Drawer.Title className="tmx-name">{i.L(d.name)}</Drawer.Title>
                {other && other !== i.L(d.name) ? <p className="tmx-alt">{other}</p> : null}
                <div className="tmx-meta">
                  <span>{i.L(sz?.por || d.por)}</span>
                  {d.spice ? <span><Spice n={d.spice} />{i.t('spice_' + d.spice)}</span> : null}
                  {d.veg ? <span className="tmx-tag veg"><I n="leaf" />{i.t('veg')}</span> : null}
                  {tagsOf(d).map(g => <span key={g.id} className="tmx-tag">{i.L(g)}</span>)}
                  {d.share ? <span className="tmx-tag"><I n="users-three" />{i.t('for_n', { n: i.N(d.share) })}</span> : null}
                </div>
                {d.desc && i.L(d.desc) ? <p className="tmx-desc">{i.L(d.desc)}</p> : null}
                {d.sizes?.length ? (
                  <div className="szs" role="radiogroup" aria-label={i.t('portion')}>
                    {d.sizes.map(z => (
                      <button key={z.id} type="button" role="radio" aria-checked={z.id === sz?.id} className={z.id === sz?.id ? 'on' : ''} onClick={() => setSzPick({ id: d.id, sz: z.id })}>
                        <b>{i.L(z.name)}</b><Tk v={z.price} />
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="tmx-buy">
                  <Tk v={line!.price} />
                  <TAdd r={mini} d={line!} />
                </div>
                {checked ? <span className="tmx-fresh">{checked}</span> : null}
                {ty?.made || showSpice ? (
                  <section className="tmx-sec">
                    <h3>{i.t('about_dish')}</h3>
                    <dl>
                      {ty?.made ? <div><dt>{i.t('how_made')}</dt><dd>{i.L(ty.made)}</dd></div> : null}
                      {showSpice ? <div><dt>{i.t('spice_lvl')}</dt><dd>{i.t('spice_note_' + (d.spice || 0))}</dd></div> : null}
                    </dl>
                  </section>
                ) : null}
                {more.length ? (
                  <section className="tmx-sec">
                    <h3>{i.t('also_here')}</h3>
                    <div>
                      {more.map(m => (
                        <button key={m.id} type="button" className="tmx-row" onClick={() => onPick(m)}>
                          <span className="tmx-th">{m.p ? <Img id={m.p} w={120} sizes="54px" /> : i.L(m.name).charAt(0)}</span>
                          <span><b>{i.L(m.name)}</b><small>{i.L(m.por)}</small></span>
                          <Tk v={m.price} />
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          ) : <Drawer.Title className="sr">{i.t('menu')}</Drawer.Title>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
