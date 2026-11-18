'use client';
/* Ask Mama: a chat that plans a meal from the real menus. A side sheet on laptops, a bottom sheet on
   phones (you can drag it down to close). Answers come from /api/ask (lib/mama/brain.ts). On a restaurant
   page Mama knows the place (store.here), and every question carries the chat so far, so follow-ups work.
   The chat is kept for the visit (sessionStorage, this browser only, gone when the tab closes); "New chat" clears it.
   The microphone uses the browser's own voice typing, so it costs nothing and is hidden where it is not supported. */
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
const W = {
  err: { en: 'Something went wrong. Check your connection and ask again.', bn: 'কিছু একটা সমস্যা হয়েছে। ইন্টারনেট দেখে আবার জিজ্ঞেস করুন।' },
  fresh: { en: 'New chat', bn: 'নতুন চ্যাট' },
  copy: { en: 'Copy', bn: 'কপি' },
  copied: { en: 'Copied', bn: 'কপি হয়েছে' },
  again: { en: 'Ask this again', bn: 'আবার জিজ্ঞেস করুন' },
  mic: { en: 'Speak your question', bn: 'বলে জিজ্ঞেস করুন' },
  stop: { en: 'Stop listening', bn: 'শোনা বন্ধ করুন' },
  listenTap: { en: 'Listening… tap the mic again to stop', bn: 'শুনছি… থামাতে আবার মাইকে চাপুন' },
};
/** why voice typing could not start, in words a diner understands */
const MIC_ERR = {
  blocked: { en: 'Allow the microphone for this site in your browser, then tap the mic again.', bn: 'ব্রাউজারে এই সাইটের জন্য মাইক্রোফোন চালু করে আবার মাইকে চাপুন।' },
  none: { en: 'No microphone found on this device.', bn: 'এই ডিভাইসে কোনো মাইক্রোফোন পাওয়া যায়নি।' },
  service: { en: 'Voice typing is not working in this browser. Try Chrome or Safari, or type your question.', bn: 'এই ব্রাউজারে ভয়েস টাইপিং কাজ করছে না। Chrome বা Safari ব্যবহার করুন, অথবা লিখে জিজ্ঞেস করুন।' },
};
type MicErr = keyof typeof MIC_ERR;
const KEY = 'khaoya-mama-chat';
/** the chat saved for this visit; error lines are not kept */
const load = (): Msg[] => { try { const v = JSON.parse(sessionStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const save = (m: Msg[]) => { try { sessionStorage.setItem(KEY, JSON.stringify(m.filter(x => !('err' in x)).slice(-40))); } catch { /* private window: the chat is just not kept */ } };
const turnsOf = (m: Msg[]) => m.flatMap((x): Turn[] => 'me' in x ? [{ role: 'user', text: x.me }] : 'bot' in x ? [{ role: 'mama', text: x.bot.text }] : []);
/* the browser's own voice typing (Chrome, Edge, Safari; not Firefox) */
type Rec = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; abort(): void; onresult: ((e: { results: ArrayLike<{ isFinal: boolean } & ArrayLike<{ transcript: string }>> }) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };
const recCtor = () => { if (typeof window === 'undefined') return null; const w = window as unknown as Record<string, unknown>; return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as (new () => Rec) | null; };
/** the answer waits a moment, so the thinking line can be read */
const MIN_THINK = 900;

export function AiSheet() {
  const i = useI();
  const ai = useApp(s => s.ai), set = useApp(s => s.set), here = useApp(s => s.here);
  const rid = here?.id;
  const phone = useMedia(PHONE);
  const q0 = ai?.q.trim() || '';
  const [start] = useState(() => { const s = load(); return { saved: s, top: s.reduce((n, x) => Math.max(n, x.id), 0) }; });
  const [msgs, setMsgs] = useState<Msg[]>(() => q0 ? [...start.saved, { id: start.top + 1, me: q0 }] : start.saved), [q, setQ] = useState(''), [busy, setBusy] = useState(!!q0);
  const body = useRef<HTMLDivElement>(null), seq = useRef(start.top + 1), ctl = useRef<AbortController | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  /* the sheet only mounts in the browser (store.ai is never set on the server), so this check is safe here */
  const [canMic] = useState(() => !!recCtor()), [mic, setMic] = useState(false), [micErr, setMicErr] = useState<MicErr | null>(null);
  const rec = useRef<Rec | null>(null), input = useRef<HTMLTextAreaElement>(null);
  /* the box grows with the question so the whole text stays visible (CSS caps it at about 5 lines) */
  useEffect(() => {
    const el = input.current;
    if (!el || CSS.supports('field-sizing', 'content')) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [q]);
  /* voice typing state that must survive the browser's own restarts: does the diner still want it on, the words
     already final, and how many restarts in a row heard nothing (so a broken mic cannot loop forever) */
  const want = useRef(false), said = useRef(''), fails = useRef(0);
  useEffect(() => () => { want.current = false; rec.current?.abort(); }, []);
  useEffect(() => { save(msgs); }, [msgs]);

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
    micOff(true);
    const history = turnsOf(msgs);
    setMsgs(m => [...m, { id: ++seq.current, me: t }]);
    setBusy(true); setQ('');
    fetchAnswer(t, history);
  };

  /* opened again with a new question (from the home page or search): it joins the chat so far */
  const [seen, setSeen] = useState(ai);
  const [pending, setPending] = useState(() => q0 ? { q: q0, history: turnsOf(start.saved) } : null);
  if (seen !== ai) {
    setSeen(ai);
    const first = ai?.q.trim() || '';
    if (ai && first) { setPending({ q: first, history: turnsOf(msgs) }); setMsgs(m => [...m, { id: Date.now(), me: first }]); }
    setBusy(!!first);
  }
  const asked = useRef<unknown>(null);
  useEffect(() => { if (!ai) ctl.current?.abort(); }, [ai]);
  useEffect(() => {
    if (!pending || asked.current === pending) return;
    asked.current = pending;
    fetchAnswer(pending.q, pending.history);
  }, [pending, fetchAnswer]);

  const fresh = () => {
    ctl.current?.abort(); micOff(true);
    setMsgs([]); setBusy(false); setQ('');
  };
  const copy = async (id: number, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(c => c === id ? null : c), 1500); } catch { /* clipboard blocked */ }
  };
  const again = (text: string) => { setQ(text); input.current?.focus(); };
  /* voice typing: tap the mic and it keeps listening until you tap it again. The words appear in the box as you
     speak; you check them and press Send. Browsers end a listening session on their own after a pause, so we
     quietly start a new one while the mic is still on. */
  const micOff = (discard?: boolean) => {
    want.current = false;
    if (discard) rec.current?.abort(); else rec.current?.stop();
    setMic(false);
  };
  const listen = () => {
    if (want.current) { micOff(); return; }
    const R = recCtor();
    if (!R) return;
    setMicErr(null);
    want.current = true; fails.current = 0;
    said.current = q.trim();
    setMic(true);
    const join = (...p: string[]) => p.map(x => x.trim()).filter(Boolean).join(' ');
    const run = () => {
      const r = new R();
      r.lang = i.lang === 'bn' ? 'bn-BD' : 'en-US';
      /* Android Chrome repeats words in continuous mode, so there each session is one phrase and we restart */
      r.interimResults = true; r.continuous = !/Android/i.test(navigator.userAgent);
      const began = Date.now();
      let done = '';
      r.onresult = e => {
        let fin = '', live = '';
        for (let k = 0; k < e.results.length; k++) { const x = e.results[k]; if (x.isFinal) fin += x[0].transcript + ' '; else live += x[0].transcript; }
        done = fin;
        setQ(join(said.current, fin, live));
      };
      r.onerror = e => {
        const fatal: Record<string, MicErr> = { 'not-allowed': 'blocked', 'service-not-allowed': 'service', network: 'service', 'audio-capture': 'none', 'language-not-supported': 'service' };
        if (fatal[e.error]) { want.current = false; setMicErr(fatal[e.error]); }
      };
      r.onend = () => {
        said.current = join(said.current, done);
        rec.current = null;
        if (!want.current) { setMic(false); return; }
        /* ended almost at once three times in a row: something is wrong, stop instead of looping */
        fails.current = Date.now() - began < 800 ? fails.current + 1 : 0;
        if (fails.current >= 3) { want.current = false; setMic(false); setMicErr('service'); return; }
        run();
      };
      rec.current = r;
      try { r.start(); } catch { rec.current = null; want.current = false; setMic(false); setMicErr('service'); }
    };
    run(); // started straight from the tap: some browsers only allow the microphone from a tap
  };
  const tools = (id: number, text: string, mine: boolean) => (
    <div className="ai-tools">
      <button type="button" onClick={() => copy(id, text)} aria-label={i.L(copied === id ? W.copied : W.copy)} title={i.L(copied === id ? W.copied : W.copy)}><I n={copied === id ? 'check' : 'copy'} b /></button>
      {mine ? <button type="button" onClick={() => again(text)} aria-label={i.L(W.again)} title={i.L(W.again)}><I n="arrow-counter-clockwise" b /></button> : null}
    </div>
  );

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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {msgs.length ? <button type="button" className="ai-new" onClick={fresh} aria-label={i.L(W.fresh)} title={i.L(W.fresh)}><I n="plus" b /><span>{i.L(W.fresh)}</span></button> : null}
              <Drawer.Close className="x" aria-label={i.t('close')}><I n="x" b /></Drawer.Close>
            </div>
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
              <mo.div key={m.id} className="ai-turn mine" initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.28, ease: EASE }} style={{ transformOrigin: 'right bottom' }}>
                <div className="me">{m.me}</div>
                {tools(m.id, m.me, true)}
              </mo.div>
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
                {tools(m.id, m.bot.text, false)}
              </mo.div>
            ) : (
              <mo.p key={m.id} className="bot ai-err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>{i.L(W.err)}</mo.p>
            ))}
            <AnimatePresence>
              {busy ? <mo.div key="busy" style={{ justifySelf: 'start' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}><Thinking /></mo.div> : null}
            </AnimatePresence>
          </div>
          {mic || micErr ? <p className={micErr ? 'ai-mic-note bad' : 'ai-mic-note'} role="status">{micErr ? i.L(MIC_ERR[micErr]) : i.L(W.listenTap)}</p> : null}
          <form className="ai-form" onSubmit={ev => { ev.preventDefault(); ask(q); }}>
            <textarea ref={input} rows={1} value={q} onChange={ev => setQ(ev.target.value)} placeholder={i.t('ai_ph')} aria-label={i.t('ask_title')} enterKeyHint="send" autoComplete="off"
              onKeyDown={ev => { if (ev.key === 'Enter' && !ev.shiftKey && !ev.nativeEvent.isComposing) { ev.preventDefault(); if (!busy) ask(q); } }} />
            {canMic ? <button type="button" className={mic ? 'ai-mic on' : 'ai-mic'} onClick={listen} aria-pressed={mic} aria-label={i.L(mic ? W.stop : W.mic)} title={i.L(mic ? W.stop : W.mic)}><I n="microphone" f={mic} b={!mic} /></button> : null}
            <mo.button className="btn btn-pri ai-send" type="submit" aria-label={i.t('send')} disabled={!q.trim() || busy} whileTap={{ scale: 0.97 }}><I n="paper-plane-right" f /><span className="ai-send-t">{i.t('send')}</span></mo.button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
