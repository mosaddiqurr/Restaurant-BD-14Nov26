'use client';
/* "Ask the way you talk": examples that open Ask khabo, and a little window that types a real question
   and shows the real answer (worked out on the server from the live menus). */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m, useInView, useReducedMotion } from 'motion/react';
import { useI } from '@/components/providers/i18n';
import { I, Rise } from '@/components/ui/bits';
import { useApp } from '@/lib/store';
import { EASE } from '@/lib/khabo';
import type { AskAnswer } from '@/lib/ask';
import { AiCard, Thinking } from './ask-card';

function AiDemo({ q, a }: { q: string; a: AskAnswer }) {
  const [run, setRun] = useState(0);
  return <DemoRun key={run + q} q={q} a={a} again={() => setRun(run + 1)} />;
}

function DemoRun({ q, a, again }: { q: string; a: AskAnswer; again: () => void }) {
  const i = useI();
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? q.length : 0), [step, setStep] = useState<'type' | 'think' | 'done'>(reduce ? 'done' : 'type');
  useEffect(() => {
    if (step === 'type') {
      if (n < q.length) { const tm = setTimeout(() => setN(n + 1), 34); return () => clearTimeout(tm); }
      const tm = setTimeout(() => setStep('think'), 260);
      return () => clearTimeout(tm);
    }
    if (step === 'think') { const tm = setTimeout(() => setStep('done'), 1500); return () => clearTimeout(tm); }
  }, [n, step, q.length]);
  return (
    <>
      <div className="me" aria-label={q}>{q.slice(0, n)}{step === 'type' ? <span className="ai-caret" aria-hidden="true" /> : null}</div>
      <AnimatePresence mode="wait">
        {step === 'think' ? (
          <m.div key="th" style={{ justifySelf: 'start' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}><Thinking /></m.div>
        ) : null}
        {step === 'done' ? (
          <m.div key="ans" className="bot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
            <p>{a.text}</p>
            <div className="opts" style={{ marginTop: 12 }}>
              {a.cards.map((c, k) => (
                <m.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 + k * 0.06, ease: EASE }}>
                  <AiCard c={c} />
                </m.div>
              ))}
            </div>
            <button className="link" style={{ marginTop: 12 }} onClick={again}><I n="arrow-counter-clockwise" b />{i.tx('again')}</button>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function AiSec({ q, a }: { q: string; a: AskAnswer }) {
  const i = useI();
  const set = useApp(s => s.set);
  const ex = [i.t('try_1'), i.t('try_4'), i.t('try_5')];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12% 0px' });
  return (
    <section className="sec" id="ask"><div className="wrap ai-s">
      <div>
        <Rise as="h2" className="h2">{i.t('ai_title')}</Rise>
        <Rise as="p" className="sub" d={1}>{i.t('ai_sub')}</Rise>
        <div className="ai-ex">
          {ex.map((z, k) => (
            <m.button key={k} onClick={() => set({ ai: { q: z } })}
              whileHover={{ x: 3, transition: { duration: 0.2, ease: EASE } }} whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}>
              <span>{z}</span><I n="arrow-up-right" b />
            </m.button>
          ))}
        </div>
        <button className="btn btn-pri btn-lg" onClick={() => set({ ai: { q: '' } })}><I n="sparkle" f />{i.t('ask_title')}</button>
      </div>
      <div className="ai-win">
        <div className="ai-win-h"><span className="orb"><I n="sparkle" f /></span><b>{i.t('ask_title')}</b><span className="meta">{i.t('ask_langs')}</span></div>
        <div className="ai-body" ref={ref}>{inView ? <AiDemo q={q} a={a} /> : null}</div>
      </div>
    </div></section>
  );
}
