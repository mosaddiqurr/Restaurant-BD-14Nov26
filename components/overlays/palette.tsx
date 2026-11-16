'use client';
/* The search palette (Ctrl K, / or the search buttons): restaurants, dishes, kinds of dish and areas,
   fed by /api/search as you type, with the matched words marked. Plus quick links and Ask khabo. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { m } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Pic, Tk } from '@/components/ui/bits';
import { useHref } from '@/components/shell/nav';
import { openDish } from '@/components/cards/actions';
import { useApp } from '@/lib/store';
import { C, EASE, areaOf, where } from '@/lib/khabo';
import type { PaletteHit, SearchOut } from '@/app/api/search/route';
import '@/styles/home-extra.css';

const W = {
  plates: { en: '{n} plates, from {p}', bn: '{n}টি প্লেট, {p} থেকে' },
  clear: { en: 'Clear the search', bn: 'খোঁজা মুছুন' },
  move: { en: 'move', bn: 'সরান' }, open: { en: 'open', bn: 'খুলুন' }, close: { en: 'close', bn: 'বন্ধ' },
};

type Kind = PaletteHit['kind'];
type Hit<K extends Kind> = Extract<PaletteHit, { kind: K }>;

/** the text with every searched word marked */
function Hl({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const re = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  return <>{text.split(re).map((p, k) => (k % 2 ? <mark key={k} className="pal-mark">{p}</mark> : p))}</>;
}

/** each row slides in once, the first time it appears */
const Row = ({ k, children }: { k: number; children: ReactNode }) => (
  <m.div className="pal-r" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(k, 8) * 0.02, ease: EASE }}>{children}</m.div>
);

export function Palette() {
  const i = useI(), href = useHref(), router = useRouter();
  const open = useApp(s => s.palette), set = useApp(s => s.set);
  const [q, setQ] = useState('');
  const [data, setData] = useState<SearchOut | null>(null);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState('');
  const cache = useRef(new Map<string, SearchOut>());

  /* ask the server, a moment after the last key press; answers are kept for this visit */
  useEffect(() => {
    if (!open) return;
    const key = q.trim();
    const hit = cache.current.get(key);
    if (hit) { setData(hit); setBusy(false); return; }
    setBusy(true);
    const ctl = new AbortController();
    const tm = setTimeout(() => {
      fetch('/api/search?q=' + encodeURIComponent(key), { signal: ctl.signal })
        .then(r => r.json() as Promise<SearchOut>)
        .then(d => { cache.current.set(key, d); setData(d); setBusy(false); })
        .catch(() => { if (!ctl.signal.aborted) setBusy(false); });
    }, key ? 140 : 0);
    return () => { clearTimeout(tm); ctl.abort(); };
  }, [q, open]);

  /* the typed words are cleared once the palette has closed */
  useEffect(() => {
    if (open) return;
    const tm = setTimeout(() => setQ(''), 220);
    return () => clearTimeout(tm);
  }, [open]);

  const pick = (fn: () => void) => () => { set({ palette: false }); setTimeout(fn, 30); };
  const go = (path: string, qs?: Record<string, string>) => pick(() => router.push(href(path, qs)));

  const hits = data?.hits || [];
  const of = <K extends Kind>(k: K) => hits.filter((h): h is Hit<K> => h.kind === k);
  const types = of('type'), dishes = of('dish'), rests = of('rest'), areas = of('area');
  const words = (data?.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const typed = !!data?.q;
  let n = 0;

  const restGroup = rests.length ? (
    <Command.Group key="r" heading={i.t('nav_restaurants')}>
      {rests.map(h => (
        <Command.Item key={'r' + h.id} value={'r:' + h.id} onSelect={go('/r/' + h.id)}>
          <Row k={n++}>
            <Pic id={h.hero} w={80} sizes="34px" />
            <div className="pal-t"><div><Hl text={i.L(h.name)} words={words} /></div><small>{where(i, h)} · ★ {i.N(h.rating)}</small></div>
          </Row>
        </Command.Item>
      ))}
    </Command.Group>
  ) : null;
  const dishGroup = types.length || dishes.length ? (
    <Command.Group key="d" heading={typed ? i.t('nav_dishes') : i.t('signature')}>
      {types.map(h => (
        <Command.Item key={'t' + h.id} value={'t:' + h.id} onSelect={go('/dishes', { type: h.id })}>
          <Row k={n++}>
            {h.pic ? <Pic id={h.pic} w={80} sizes="34px" /> : <I n={C.types[h.id]?.i || 'bowl-food'} />}
            <div className="pal-t"><div><Hl text={i.L(h.name)} words={words} /></div><small>{i.L(W.plates).replace('{n}', i.N(h.n)).replace('{p}', i.tk(h.lo))}</small></div>
            <I n="arrow-right" />
          </Row>
        </Command.Item>
      ))}
      {dishes.map(h => (
        <Command.Item key={'d' + h.r + h.id} value={'d:' + h.r + ':' + h.id} onSelect={pick(() => openDish(h.mini, h.dish))}>
          <Row k={n++}>
            <Pic id={h.p} w={80} tone={h.theme} icon={C.types[h.dish.type]?.i} sizes="34px" />
            <div className="pal-t"><div><Hl text={i.L(h.name)} words={words} /></div><small>{i.L(h.rest)}, {i.L(areaOf(h.area))}</small></div>
            <Tk v={h.price} />
          </Row>
        </Command.Item>
      ))}
    </Command.Group>
  ) : null;
  const areaGroup = areas.length ? (
    <Command.Group key="a" heading={i.t('areas')}>
      {areas.map(h => (
        <Command.Item key={'a' + h.id} value={'a:' + h.id} onSelect={go('/restaurants', { area: h.id })}>
          <Row k={n++}>
            <I n="map-pin" />
            <div className="pal-t"><div><Hl text={i.L(h.name)} words={words} /></div><small>{i.L(C.cities[h.city])} · {i.t('n_places', { n: i.N(h.n) })}</small></div>
          </Row>
        </Command.Item>
      ))}
    </Command.Group>
  ) : null;
  /* what was typed decides the order: a kind of dish first, then an area, then places */
  const ranked: [ReactNode, number, string | undefined][] = [
    [restGroup, typed ? (rests.length ? 2 : 0) : 9, rests[0] && 'r:' + rests[0].id],
    [dishGroup, typed ? (types.length ? 4 : dishes.length ? 1 : 0) : 8, types[0] ? 't:' + types[0].id : dishes[0] && 'd:' + dishes[0].r + ':' + dishes[0].id],
    [areaGroup, typed ? (areas.length ? 3 : 0) : 7, areas[0] && 'a:' + areas[0].id],
  ];
  ranked.sort((a, b) => b[1] - a[1]);
  const groups = ranked.map(z => z[0]);
  const first = ranked.find(z => z[2])?.[2] || 'go:ask';
  const none = typed && !busy && !hits.length;

  /* new results: the best one is ready for Enter */
  const [was, setWas] = useState(first);
  if (was !== first) { setWas(first); setSel(first); }

  return (
    <Command.Dialog value={sel} onValueChange={setSel} open={open} onOpenChange={o => set({ palette: o })} label={i.t('search')} overlayClassName="cmdk-over" loop shouldFilter={false}>
      <div className="pal-in">
        <I n="magnifying-glass" b />
        <Command.Input value={q} onValueChange={setQ} placeholder={i.t('search_ph')} enterKeyHint="search" />
        {busy && q.trim() ? <span className="pal-spin" aria-hidden="true" />
          : q ? <button className="x pal-x" onClick={() => setQ('')} aria-label={i.L(W.clear)}><I n="x" b /></button> : null}
      </div>
      <Command.List>
        {!data ? <Command.Loading><div className="pal-sk">{[0, 1, 2, 3, 4].map(k => <div key={k} className="sk" />)}</div></Command.Loading> : null}
        {none ? <div className="pal-none"><b>{i.t('no_match', { q: data!.q })}</b><span>{i.t('no_match_sub')}</span></div> : null}
        {groups}
        <Command.Group heading="khabo">
          <Command.Item value="go:ask" onSelect={pick(() => set({ ai: { q: q.trim() } }))}>
            <div className="pal-r"><I n="sparkle" f /><div className="pal-t"><div>{i.t('ask_title')}{q.trim() ? `: “${q.trim()}”` : ''}</div><small>{i.t('ask_ai_sub')}</small></div></div>
          </Command.Item>
          {([['/deals', i.t('nav_deals'), 'tag'], ['/dishes', i.t('nav_dishes'), 'bowl-food'], ['/business', i.t('nav_business'), 'handshake'], ['/partner', i.t('partner_sign_in'), 'squares-four']] as const).map(([p, l, ic]) => (
            <Command.Item key={p} value={'go:' + p} onSelect={go(p)}>
              <div className="pal-r"><I n={ic} /><div className="pal-t"><div>{l}</div></div></div>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
      <div className="cmdk-foot">
        <span><span className="kbd">↑↓</span> {i.L(W.move)}</span>
        <span><span className="kbd">Enter</span> {i.L(W.open)}</span>
        <span><span className="kbd">Esc</span> {i.L(W.close)}</span>
      </div>
    </Command.Dialog>
  );
}
