'use client';
/* Ask Mama: a chat that plans a meal from the real menus. A side sheet on laptops, a bottom sheet on
   phones (you can drag it down to close). Answers come from /api/ask (lib/mama/brain.ts). On a restaurant
   page Mama knows the place (store.here), and every question carries the chat so far, so follow-ups work. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';
import { AnimatePresence, m as mo } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, MamaMark } from '@/components/ui/bits';
import { useApp } from '@/lib/store';
import { EASE } from '@/lib/khabo';
import type { AskAnswer } from '@/lib/ask';
import { AiCard, Thinking } from '@/components/home/ask-card';
import { PHONE, useMedia } from '@/components/home/util';
import '@/styles/home-extra.css';

type Turn = { role: 'user' | 'mama'; text: string };
type Msg = { id: number; me: string } | { id: number; bot: AskAnswer } | { id: number; err: true };
const W = { err: { en: 'Something went wrong. Check your connection and ask again.', bn: 'কিছু একটা সমস্যা হয়েছে। ইন্টারনেট দেখে আবার জিজ্ঞেস করুন।' } };
/** the answer waits a moment, so the thinking line can be read */
const MIN_THINK = 900;

export function AiSheet() {
  const i = useI();
  const ai = useApp(s => s.ai), set = useApp(s => s.set), here = useApp(s => s.here);
  const rid = here?.id;
  const phone = useMedia(PHONE);
  const q0 = ai?.q.trim() || '';
  const [msgs, setMsgs] = useState<Msg[]>(q0 ? [{ id: 0, me: q0 }] : []), [q, setQ] = useState(''), [busy, setBusy] = useState(!!q0);
  const body = useRef<HTMLDivElement>(null), seq = useRef(0), ctl = useRef<AbortController | null>(null);

  /* the answer from the server; it only touches state after the network, never straight away */
  const fetchAnswer = useCallback(async (t: string, history: Turn[] = []) => {
    ctl.current?.abort();
    const c = new AbortController();
    ctl.current = c;
    const pause = new Promise(r => setTimeout(r, MIN_THINK));
    try {
      const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: t, lang: i.lang, rid, history }), signal: c.signal });
      if (!res.ok) throw new Error(String(res.status));
      const a = (await res.json()) as AskAnswer;
      await pause;
      if (c.signal.aborted) return;
      setMsgs(m => [...m, { id: ++seq.current, bot: a }]);
    } catch {
      if (c.signal.aborted) return;
      setMsgs(m => [...m, { id: ++seq.current, err: true }]);
    }
    setBusy(false);
  }, [i.lang, rid]);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const history = msgs.flatMap((m): Turn[] => 'me' in m ? [{ role: 'user', text: m.me }] : 'bot' in m ? [{ role: 'mama', text: m.bot.text }] : []);
    setMsgs(m => [...m, { id: ++seq.current, me: t }]);
    setBusy(true); setQ('');
    fetchAnswer(t, history);
  };

  /* each time it opens: a fresh chat, with the question it was opened with (from the home page or search) */
  const [seen, setSeen] = useState(ai);
  if (seen !== ai) {
    setSeen(ai);
    const first = ai?.q.trim() || '';
    if (ai) setMsgs(first ? [{ id: 0, me: first }] : []);
    setBusy(!!first);
  }
  useEffect(() => {
    if (!ai) { ctl.current?.abort(); return; }
    const first = ai.q.trim();
    if (first) fetchAnswer(first);
  }, [ai, fetchAnswer]);

  /* keep the newest message in view */
  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  const ex = here ? [i.t('try_here_1'), i.t('try_here_2'), i.t('try_here_3')] : [i.t('try_1'), i.t('try_4'), i.t('try_5')];
  return (
    <Drawer.Root open={!!ai} onOpenChange={o => { if (!o) set({ ai: null }); }} direction={phone ? 'bottom' : 'right'}>
      <Drawer.Portal>
        <Drawer.Overlay className="vaul-over" />
        <Drawer.Content className="vaul-r ai-sheet" aria-describedby={undefined}>
          <div className="ai-grab" aria-hidden="true" />
          <div className="side-h">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="orb"><MamaMark /></span>
              <div><Drawer.Title className="h3" style={{ fontSize: 18 }}>{i.t('ask_title')}</Drawer.Title><span className="meta">{here ? i.t('ask_about', { name: i.L(here.name) }) : i.t('ask_langs')}</span></div>
            </div>
            <Drawer.Close className="x" aria-label={i.t('close')}><I n="x" b /></Drawer.Close>
          </div>
          <div className="side-p ai-body" ref={body} aria-live="polite">
            {!msgs.length ? (
              <div className="ai-hello">
                <p>{here ? i.t('ai_hello_here', { name: i.L(here.name) }) : i.t('ai_hello_sub')}</p>
                <p className="meta mama-why">{i.t('mama_why')}</p>
                <div className="ai-ex">
                  {ex.map((z, k) => (
                    <mo.button key={k} onClick={() => ask(z)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 + k * 0.05, ease: EASE }} whileTap={{ scale: 0.97 }}>
                      <span>{z}</span><I n="arrow-up-right" b />
                    </mo.button>
                  ))}
                </div>
              </div>
            ) : null}
            {msgs.map(m => 'me' in m ? (
              <mo.div key={m.id} className="me" initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.28, ease: EASE }} style={{ transformOrigin: 'right bottom' }}>{m.me}</mo.div>
            ) : 'bot' in m ? (
              <mo.div key={m.id} className="bot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                <p>{m.bot.text}</p>
                {m.bot.cards.length ? (
                  <div className="opts" style={{ marginTop: 10 }}>
                    {m.bot.cards.map((c, k) => (
                      <mo.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 + k * 0.06, ease: EASE }}><AiCard c={c} /></mo.div>
                    ))}
                  </div>
                ) : null}
              </mo.div>
            ) : (
              <mo.p key={m.id} className="bot ai-err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>{i.L(W.err)}</mo.p>
            ))}
            <AnimatePresence>
              {busy ? <mo.div key="busy" style={{ justifySelf: 'start' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}><Thinking /></mo.div> : null}
            </AnimatePresence>
          </div>
          <form className="ai-form" onSubmit={ev => { ev.preventDefault(); ask(q); }}>
            <input value={q} onChange={ev => setQ(ev.target.value)} placeholder={i.t('ai_ph')} aria-label={i.t('ask_title')} enterKeyHint="send" autoComplete="off" />
            <mo.button className="btn btn-pri" type="submit" disabled={!q.trim() || busy} whileTap={{ scale: 0.97 }}><I n="paper-plane-right" f />{i.t('send')}</mo.button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
