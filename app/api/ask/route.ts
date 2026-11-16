/* Ask khabo: GET /api/ask?q=amra 4 jon, 2500 taka&lang=bn → { text, cards }.
   The planner (lib/ask.ts) reads only restaurants and prices that are on khabo. */
import type { NextRequest } from 'next/server';
import { getRestaurants } from '@/lib/data/catalog';
import { answer, type AskAnswer } from '@/lib/ask';
import { isLang } from '@/lib/i18n/core';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') || '').slice(0, 300);
  const l = sp.get('lang');
  const lang = isLang(l) ? l : 'en';
  const out: AskAnswer = q.trim() ? answer(q, lang, await getRestaurants()) : { text: '', cards: [] };
  return Response.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
