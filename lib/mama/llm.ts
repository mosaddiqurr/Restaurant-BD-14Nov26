/* Mama's language models. A question goes to the fastest free model first: Gemini 3.1 Flash-Lite (usually about
   a second). If it has not answered after a moment, the next model is asked too, and the first good answer wins,
   so one slow model never keeps a diner waiting. Then Gemini 3.5 Flash-Lite, the newest Flash-Lite and Flash
   (each has its own free daily limit), then GLM-4.7-Flash. If none answers within 8.5 seconds, the caller uses
   the built-in planner instead. A model that says "limit reached" rests until its limit resets; one that is down
   rests a few seconds. Diners never see which model answered. Keys live in .env.local (this computer) and in
   Netlify (live site). */
import 'server-only';

type Model = { id: string; kind: 'gemini' | 'glm' };
const MODELS: Model[] = [
  { id: 'gemini-3.1-flash-lite', kind: 'gemini' },
  { id: 'gemini-3.5-flash-lite', kind: 'gemini' },
  { id: 'gemini-flash-lite-latest', kind: 'gemini' },
  { id: 'gemini-flash-latest', kind: 'gemini' },
  { id: 'glm-4.7-flash', kind: 'glm' },
];
/** how long to wait for one model before also asking the next */
const HEDGE = 2500;

/** the longest a diner waits in total; after that the built-in planner answers (also keeps under the host's time limit) */
const BUDGET = 8500;

/** when each model may be tried again (kept while the server runs) */
const restUntil = new Map<string, number>();

/** Gemini's free daily limits reset at midnight in California */
function nextPacificMidnight(now = Date.now()) {
  const pt = new Date(new Date(now).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const ms = (24 - pt.getHours()) * 3600e3 - pt.getMinutes() * 60e3 - pt.getSeconds() * 1e3;
  return now + Math.max(ms, 60e3);
}

class Busy extends Error { constructor(public rest: number, msg: string) { super(msg); } }

export type Turn = { role: 'user' | 'mama'; text: string };
export type LlmOut = { json: unknown; model: string };

async function gemini(m: Model, system: string, turns: Turn[], schema: object, signal: AbortSignal) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Busy(Infinity, 'no Gemini key');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m.id}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map(t => ({ role: t.role === 'user' ? 'user' : 'model', parts: [{ text: t.text }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 700, responseMimeType: 'application/json', responseSchema: schema },
    }),
    signal,
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 429) {
    const msg = JSON.stringify(j);
    throw new Busy(/per ?day|PerDay|daily/i.test(msg) ? nextPacificMidnight() : Date.now() + 60e3, `${m.id} limit`);
  }
  /* overloaded or down for a moment: rest briefly. Gone (404) or bad request: rest an hour */
  if (!res.ok) throw new Busy(Date.now() + (res.status >= 500 ? 10e3 : 3600e3), `${m.id} ${res.status}`);
  const text = j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  return JSON.parse(text);
}

async function glm(m: Model, system: string, turns: Turn[], signal: AbortSignal) {
  const key = process.env.GLM_API_KEY;
  if (!key) throw new Busy(Infinity, 'no GLM key');
  const res = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: m.id, temperature: 0.4, max_tokens: 700, thinking: { type: 'disabled' }, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, ...turns.map(t => ({ role: t.role === 'user' ? 'user' : 'assistant', content: t.text }))],
    }),
    signal,
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 429) throw new Busy(Date.now() + 20e3, `${m.id} busy`);
  if (!res.ok) throw new Busy(Date.now() + 60e3, `${m.id} ${res.status}`);
  const text = String(j.choices?.[0]?.message?.content || '').replace(/^```(json)?|```$/g, '').trim();
  return JSON.parse(text);
}

/** asks the free models in turn, overlapping when one is slow; null when none answered in time
    (the caller then uses the built-in planner) */
export async function askModels(system: string, turns: Turn[], schema: object): Promise<LlmOut | null> {
  const free = MODELS.filter(m => (restUntil.get(m.id) || 0) <= Date.now());
  if (!free.length) return null;
  const stop = new AbortController();
  const signal = AbortSignal.any([stop.signal, AbortSignal.timeout(BUDGET)]);
  return new Promise<LlmOut | null>(done => {
    let next = 0, open = 0, over = false, timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (v: LlmOut | null) => { if (over) return; over = true; clearTimeout(timer); stop.abort(); done(v); };
    const launch = () => {
      clearTimeout(timer);
      if (over) return;
      if (next >= free.length) { if (!open) finish(null); return; }
      const m = free[next++]; open++;
      timer = setTimeout(launch, HEDGE);
      (m.kind === 'gemini' ? gemini(m, system, turns, schema, signal) : glm(m, system, turns, signal))
        .then(json => finish({ json, model: m.id }))
        .catch(e => {
          open--;
          if (over) return;
          if (e instanceof Busy) restUntil.set(m.id, e.rest);
          else if (!(e instanceof Error && /abort|timeout/i.test(e.name + e.message))) restUntil.set(m.id, Date.now() + 10e3);
          console.warn('[mama]', m.id, e instanceof Error ? e.message : e); // shows in Netlify's function logs (never the key)
          if (signal.aborted) { if (!open) finish(null); return; }
          launch();
        });
    };
    signal.addEventListener('abort', () => { if (!open) finish(null); setTimeout(() => finish(null), 50); });
    launch();
  });
}
