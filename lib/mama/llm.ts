/* Mama's language models. Each question goes to the first model that is free right now:
   three Gemini Flash-Lite models (each has its own free daily limit), then GLM-4.7-Flash. If none answers
   within 9 seconds, the caller uses the built-in planner instead.
   A model that says "limit reached" rests until its limit resets; one that is slow or down rests a minute.
   Diners never see which model answered. Keys live in .env.local (this computer) and in Netlify (live site). */
import 'server-only';

type Model = { id: string; kind: 'gemini' | 'glm'; timeout: number };
const MODELS: Model[] = [
  { id: 'gemini-3.5-flash-lite', kind: 'gemini', timeout: 7000 },
  { id: 'gemini-3.1-flash-lite', kind: 'gemini', timeout: 5000 },
  { id: 'gemini-2.5-flash-lite', kind: 'gemini', timeout: 5000 },
  { id: 'glm-4.7-flash', kind: 'glm', timeout: 9000 },
];

/** the longest a diner waits in total; after that the built-in planner answers (also keeps under the host's time limit) */
const BUDGET = 9000;

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

async function gemini(m: Model, system: string, turns: Turn[], schema: object, ms: number) {
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
    signal: AbortSignal.timeout(ms),
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 429) {
    const msg = JSON.stringify(j);
    throw new Busy(/per ?day|PerDay|daily/i.test(msg) ? nextPacificMidnight() : Date.now() + 60e3, `${m.id} limit`);
  }
  if (!res.ok) throw new Busy(Date.now() + 30e3, `${m.id} ${res.status}`);
  const text = j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  return JSON.parse(text);
}

async function glm(m: Model, system: string, turns: Turn[], ms: number) {
  const key = process.env.GLM_API_KEY;
  if (!key) throw new Busy(Infinity, 'no GLM key');
  const res = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: m.id, temperature: 0.4, max_tokens: 700, thinking: { type: 'disabled' }, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, ...turns.map(t => ({ role: t.role === 'user' ? 'user' : 'assistant', content: t.text }))],
    }),
    signal: AbortSignal.timeout(ms),
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 429) throw new Busy(Date.now() + 20e3, `${m.id} busy`);
  if (!res.ok) throw new Busy(Date.now() + 60e3, `${m.id} ${res.status}`);
  const text = String(j.choices?.[0]?.message?.content || '').replace(/^```(json)?|```$/g, '').trim();
  return JSON.parse(text);
}

/** asks the first free model; null when none could answer (the caller then uses the built-in planner) */
export async function askModels(system: string, turns: Turn[], schema: object): Promise<LlmOut | null> {
  const end = Date.now() + BUDGET;
  for (const m of MODELS) {
    if ((restUntil.get(m.id) || 0) > Date.now()) continue;
    const ms = Math.min(m.timeout, end - Date.now());
    if (ms < 1500) break;
    try {
      const json = m.kind === 'gemini' ? await gemini(m, system, turns, schema, ms) : await glm(m, system, turns, ms);
      return { json, model: m.id };
    } catch (e) {
      restUntil.set(m.id, e instanceof Busy ? e.rest : Date.now() + 30e3);
      if (process.env.NODE_ENV !== 'production') console.warn('[mama]', m.id, e instanceof Error ? e.message : e);
    }
  }
  return null;
}
