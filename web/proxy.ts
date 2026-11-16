/* Every page lives under /en or /bn. A link without one (for example a printed table QR code, /t/shahi-handi)
   goes to the language the visitor chose before, or the one their phone asks for. */
import { NextResponse, type NextRequest } from 'next/server';

const LANGS = ['en', 'bn'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (LANGS.some(l => pathname === '/' + l || pathname.startsWith('/' + l + '/'))) return;
  const saved = req.cookies.get('lang')?.value;
  const asks = req.headers.get('accept-language') || '';
  const lang = saved && LANGS.includes(saved) ? saved : /^bn\b|,\s*bn\b/i.test(asks) ? 'bn' : 'en';
  const url = req.nextUrl.clone();
  url.pathname = '/' + lang + (pathname === '/' ? '' : pathname);
  return NextResponse.redirect(url);
}

export const config = {
  /* skip Next.js files, the API, media and anything with a file extension */
  matcher: ['/((?!_next|api|media|icons|favicon|.*\\.[\\w]+$).*)'],
};
