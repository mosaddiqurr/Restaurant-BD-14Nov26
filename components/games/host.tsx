'use client';
/* The frame every khabo mini game plays in: a canvas, the score and best score, a "Tap to start" card and a
   game-over card, pause when the tab is hidden or the game is scrolled away, and touch / mouse / keys turned into
   simple inputs. The game itself (three.js) is loaded only when the frame comes near the screen, unless the page
   hands it over already loaded (the offline page does, so it works with no signal). Styles: styles/games.css */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useTheme } from 'next-themes';
import { useI } from '@/components/providers/i18n';
import { I } from '@/components/ui/bits';
import type { IconName } from '@/components/ui/icon-names';
import type { Brand, GameApi, GameFactory, GameId } from './types';
import '@/styles/games.css';

export const KHABO: Brand = { deep: '#123B28', accent: '#E0A42E', mono: 'kh', name: 'Khaoya' };

export const GAMES: Record<GameId, { name: { en: string; bn: string }; how: { en: string; bn: string }; icon: IconName }> = {
  rickshaw: {
    name: { en: 'Rickshaw Run', bn: 'রিকশা রান' },
    how: { en: 'Tap to jump over potholes, puddles and buses. It gets faster.', bn: 'গর্ত, পানি আর বাস পার হতে চাপুন। আস্তে আস্তে গতি বাড়ে।' },
    icon: 'bicycle',
  },
  fuchka: {
    name: { en: 'Fuchka Catch', bn: 'ফুচকা ধরো' },
    how: { en: 'Slide the plate to catch fuchka. Miss the chillies.', bn: 'প্লেট সরিয়ে ফুচকা ধরুন। মরিচ এড়িয়ে চলুন।' },
    icon: 'bowl-food',
  },
  cha: {
    name: { en: 'Cha Stack', bn: 'চায়ের কাপ' },
    how: { en: 'Tap to drop each cup right on top of the last one.', bn: 'প্রতিটি কাপ ঠিক আগেরটার ওপর ফেলতে চাপুন।' },
    icon: 'coffee',
  },
};

const LOADERS: Record<GameId, () => Promise<{ default: GameFactory }>> = {
  rickshaw: () => import('./rickshaw'),
  fuchka: () => import('./fuchka'),
  cha: () => import('./cha'),
};

/** download all three games ahead of time (the table menu does this once it is idle, so they work with no signal) */
export const warmGames = () => Promise.all(Object.values(LOADERS).map(l => l().catch(() => null)));

const W = {
  start: { en: 'Tap to start', bn: 'শুরু করতে চাপুন' },
  again: { en: 'Play again', bn: 'আবার খেলুন' },
  score: { en: 'Score', bn: 'স্কোর' },
  best: { en: 'Best', bn: 'সেরা' },
  newBest: { en: 'New best!', bn: 'নতুন রেকর্ড!' },
  over: { en: 'Game over', bn: 'খেলা শেষ' },
  paused: { en: 'Paused. Tap to go on', bn: 'থেমে আছে। চালাতে চাপুন' },
  loading: { en: 'Getting the game ready', bn: 'খেলা তৈরি হচ্ছে' },
};

export const bestKey = (id: GameId, scope?: string) => `khabo.game.${id}${scope ? '.' + scope : ''}`;
export const readBest = (k: string) => { try { return Number(localStorage.getItem(k)) || 0; } catch { return 0; } };
const saveBest = (k: string, v: number) => { try { localStorage.setItem(k, String(v)); } catch { /* private window */ } };

type Phase = 'loading' | 'ready' | 'play' | 'paused' | 'over';

/** one game in its frame. `scope` keeps best scores apart (e.g. per restaurant on the table menu) */
export function GameHost({ id, brand = KHABO, factory, scope, cls, compact }: {
  id: GameId; brand?: Brand; factory?: GameFactory; scope?: string; cls?: string; compact?: boolean;
}) {
  const i = useI();
  const { resolvedTheme } = useTheme();
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), api = useRef<GameApi | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [score, setScore] = useState(0), [best, setBest] = useState(0), [fresh, setFresh] = useState(false);
  const [near, setNear] = useState(!!factory);
  const phaseRef = useRef<Phase>('loading');
  const go = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const key = bestKey(id, scope);

  /* load the game only when it comes near the screen (it is three.js, so not on every page view) */
  useEffect(() => {
    if (near) return;
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  const dark = resolvedTheme === 'dark';
  const brandKey = `${brand.deep}|${brand.accent}|${brand.logo || ''}|${brand.mono || ''}`;
  useEffect(() => {
    if (!near) return;
    const canvas = cv.current, el = box.current; if (!canvas || !el) return;
    let dead = false;
    setBest(readBest(key));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const make = (f: GameFactory) => {
      if (dead) return;
      const g = f({
        canvas, brand, dark, reduced,
        onScore: n => setScore(n),
        onOver: n => {
          const b = readBest(key);
          if (n > b) { saveBest(key, n); setBest(n); setFresh(true); } else setFresh(false);
          go('over');
        },
      });
      api.current = g;
      const r = el.getBoundingClientRect(); g.resize(r.width, r.height);
      go('ready');
    };
    if (factory) make(factory); else LOADERS[id]().then(m => make(m.default)).catch(() => { /* stays on the loading card */ });
    const ro = new ResizeObserver(([e]) => { const r = e.contentRect; api.current?.resize(r.width, r.height); });
    ro.observe(el);
    return () => { dead = true; ro.disconnect(); api.current?.destroy(); api.current = null; };
    // the game is rebuilt when the colours or the theme change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, id, brandKey, dark, key]);

  /* pause when the tab is hidden or the game scrolls out of sight */
  useEffect(() => {
    const el = box.current; if (!el) return;
    const stop = () => { if (phaseRef.current === 'play') { api.current?.pause(); go('paused'); } };
    const vis = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', vis);
    const io = new IntersectionObserver(es => { if (es.every(e => !e.isIntersecting)) stop(); }, { threshold: 0.15 });
    io.observe(el);
    return () => { document.removeEventListener('visibilitychange', vis); io.disconnect(); };
  }, []);

  const begin = () => {
    const g = api.current; if (!g) return;
    const p = phaseRef.current;
    if (p === 'paused') { g.resume(); go('play'); return; }
    if (p === 'ready' || p === 'over') { setScore(0); setFresh(false); g.start(); go('play'); }
  };

  /* keys: only while this game is on screen and being played (or waiting to start) */
  useEffect(() => {
    const on = (ev: KeyboardEvent) => {
      const p = phaseRef.current, el = box.current;
      if (!el || !api.current || p === 'loading') return;
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const k = ev.key;
      if (k === ' ' || k === 'ArrowUp' || k === 'Enter') {
        if (p !== 'play') { if (document.activeElement === el || el.contains(document.activeElement)) { ev.preventDefault(); begin(); } return; }
        ev.preventDefault(); api.current.input({ type: 'press' });
      } else if ((k === 'ArrowLeft' || k === 'ArrowRight') && p === 'play') {
        ev.preventDefault(); api.current.input({ type: k === 'ArrowLeft' ? 'left' : 'right', down: true });
      }
    };
    const up = (ev: KeyboardEvent) => {
      if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && phaseRef.current === 'play') api.current?.input({ type: ev.key === 'ArrowLeft' ? 'left' : 'right', down: false });
    };
    addEventListener('keydown', on); addEventListener('keyup', up);
    return () => { removeEventListener('keydown', on); removeEventListener('keyup', up); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (ev: React.PointerEvent) => {
    const r = cv.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)) };
  };
  const down = (ev: React.PointerEvent) => {
    if (phaseRef.current !== 'play') return;
    ev.preventDefault();
    const p = pos(ev);
    api.current?.input({ type: 'move', ...p });
    api.current?.input({ type: 'press' });
  };
  const move = (ev: React.PointerEvent) => {
    if (phaseRef.current !== 'play') return;
    if (ev.pointerType === 'mouse' || ev.buttons) api.current?.input({ type: 'move', ...pos(ev) });
  };

  const g = GAMES[id];
  const card = phase !== 'play';
  return (
    <div ref={box} className={clsx('gm', 'gm-' + id, compact && 'gm-c', cls)} tabIndex={0} role="application" aria-label={i.L(g.name)}
      style={{ '--g-deep': brand.deep, '--g-acc': brand.accent } as React.CSSProperties}>
      <canvas ref={cv} className="gm-cv" onPointerDown={down} onPointerMove={move} />
      <div className="gm-hud" aria-live="polite">
        <span><small>{i.L(W.score)}</small><b>{i.N(score)}</b></span>
        <span><small>{i.L(W.best)}</small><b>{i.N(best)}</b></span>
      </div>
      {card ? (
        <button type="button" className={clsx('gm-card', phase)} onClick={begin} disabled={phase === 'loading'}>
          {phase === 'loading' ? <><span className="gm-spin" aria-hidden="true" /><span className="gm-how">{i.L(W.loading)}</span></>
            : phase === 'over' ? <>
              <span className="gm-t">{fresh ? i.L(W.newBest) : i.L(W.over)}</span>
              <span className="gm-big">{i.N(score)}</span>
              <span className="gm-go"><I n="arrow-clockwise" b />{i.L(W.again)}</span>
            </> : phase === 'paused' ? <span className="gm-go"><I n="play" f />{i.L(W.paused)}</span>
              : <>
                <span className="gm-t">{i.L(g.name)}</span>
                <span className="gm-how">{i.L(g.how)}</span>
                <span className="gm-go"><I n="play" f />{i.L(W.start)}</span>
              </>}
        </button>
      ) : null}
    </div>
  );
}
