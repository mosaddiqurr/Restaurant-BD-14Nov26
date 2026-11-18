/* Ask Mama: POST /api/ask { q, lang, rid?, history? } → { text, cards }.
   Mama (lib/mama/brain.ts) answers only from restaurants and prices on Khaoya. rid = the restaurant page
   the person is on. GET ?q=&lang= still works for quick tests. */
import type { NextRequest } from 'next/server';
import { getRestaurants } from '@/lib/data/catalog';
import type { AskAnswer } from '@/lib/ask';
import { mama } from '@/lib/mama/brain';
import type { Turn } from '@/lib/mama/llm';
import { isLang } from '@/lib/i18n/core';

/* a fair share per person, so one visitor cannot use up the free daily limit for everyone */
const PER_MIN = 12, PER_DAY = 150;
const seen = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now(), t = (seen.get(ip) || []).filter(x => now - x < 864e5);
  t.push(now); seen.set(ip, t);
  if (seen.size > 5000) seen.clear();
  return t.filter(x => now - x < 6e4).length > PER_MIN || t.length > PER_DAY;
}
const SLOW: Record<'en' | 'bn', string> = {
  en: 'You are asking a lot at once. Wait a minute and ask me again.',
  bn: 'একসাথে অনেক প্রশ্ন হয়ে গেছে। এক মিনিট পরে আবার জিজ্ঞেস করুন।',
};

async function reply(q0: string, l: string | null, rid: string | null, history: Turn[], ip: string) {
  const q = q0.slice(0, 300), lang = isLang(l) ? l : 'en';
  if (!q.trim()) return Response.json({ text: '', cards: [] } satisfies AskAnswer);
  if (tooMany(ip)) return Response.json({ text: SLOW[lang], cards: [] } satisfies AskAnswer);
  const out = await mama({ q, lang, rid, history }, await getRestaurants());
  const { by, ...body } = out;
  return Response.json(body satisfies AskAnswer, { headers: { 'Cache-Control': 'no-store', ...(process.env.NODE_ENV !== 'production' && by ? { 'x-mama-model': by } : {}) } });
}

const ipOf = (req: NextRequest) => (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const history: Turn[] = Array.isArray(b.history)
    ? b.history.filter((t: Turn) => t && (t.role === 'user' || t.role === 'mama') && typeof t.text === 'string').slice(-6).map((t: Turn) => ({ role: t.role, text: t.text.slice(0, 600) }))
    : [];
  return reply(String(b.q || ''), b.lang ?? null, typeof b.rid === 'string' ? b.rid : null, history, ipOf(req));
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return reply(sp.get('q') || '', sp.get('lang'), sp.get('rid'), [], ipOf(req));
}
