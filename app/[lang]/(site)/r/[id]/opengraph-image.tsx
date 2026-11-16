/* The picture WhatsApp, Facebook and Messenger show when someone shares a restaurant link: the restaurant's photo
   on the left, its name in English and Bangla, area, rating and price per person on its own colours on the right.
   Made with next/og (Satori, Emil Kowalski's pick for share images). Built once per restaurant and language. */
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getRestaurant, getRestaurantIds } from '@/lib/data/catalog';
import { areaOf, src } from '@/lib/khabo';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'khabo';

export async function generateStaticParams() {
  return (await getRestaurantIds()).map(id => ({ id }));
}

/* a photo as data Satori can draw: files from /public are read from disk, others are fetched */
async function photo(id: string) {
  const u = src(id, 960);
  if (!u) return null;
  try {
    if (u.startsWith('/')) {
      const b = await readFile(path.join(process.cwd(), 'public', u));
      return `data:image/jpeg;base64,${b.toString('base64')}`;
    }
    const r = await fetch(u);
    if (!r.ok) return null;
    const t = r.headers.get('content-type') || 'image/jpeg';
    return `data:${t};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
  } catch { return null; }
}

/* only the letters this card needs, from Google Fonts (keeps the font tiny) */
async function font(family: string, weight: number, text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`, /* no browser name: Google then sends a plain .ttf, which Satori can read */ {})).text();
    const url = /src: url\((.+?)\) format\('(opentype|truetype)'\)/.exec(css)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch { return null; }
}

export default async function Image({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { id } = await params;
  const r = await getRestaurant(id);
  if (!r) return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', background: '#123B28' }} />, size);

  /* the picture's words are in English for both languages: the image maker cannot place Bangla vowel signs
     correctly yet (it would print মেনু as মনেু). The Bangla title and description travel in the link preview text,
     which phones draw properly. */
  const a = areaOf(r.area);
  const nameMain = r.name.en, where = a.en;
  const price = `৳${r.ppl[0].toLocaleString('en-IN')}-${r.ppl[1].toLocaleString('en-IN')}`;
  const per = 'per person';
  const rv = `${r.reviews.toLocaleString('en-IN')} reviews`;
  const line = 'Real menu, real prices, see inside';
  const allText = `${nameMain}${r.tagline.en}${where}${price}${per}${rv}${line}khabo0123456789.,-৳`;

  const [pic, latin, latinBold, bangla] = await Promise.all([
    photo(r.hero[0]),
    font('Figtree', 600, allText), font('Figtree', 800, allText),
    font('Noto+Sans+Bengali', 700, allText),
  ]);
  const fonts = [
    latin && { name: 'Figtree', data: latin, weight: 600 as const },
    latinBold && { name: 'Figtree', data: latinBold, weight: 800 as const },
    bangla && { name: 'Bangla', data: bangla, weight: 700 as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 600 | 800 | 700 }[];

  const deep = r.theme.deep, accent = r.theme.accent;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: deep, fontFamily: 'Figtree, Bangla' }}>
        <div style={{ width: 560, height: '100%', display: 'flex', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          {pic ? <img src={pic} width={560} height={630} style={{ width: 560, height: 630, objectFit: 'cover' }} /> : null}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 56px 52px', color: '#FBF3E0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1F5A3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, border: '4px solid #FBF3E0', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#E0A42E' }} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>khabo</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: nameMain.length > 18 ? 54 : 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>{nameMain}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: accent, lineHeight: 1.25 }}>{r.tagline.en}</div>
            <div style={{ fontSize: 26, fontWeight: 600, opacity: 0.82, marginTop: 6 }}>{where}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 44, fontWeight: 800, color: accent }}>
                  <svg width="36" height="36" viewBox="0 0 24 24"><path fill={accent} d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
                  {r.rating.toFixed(1)}
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, opacity: 0.75 }}>{rv}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 44, fontWeight: 800 }}>{price}</div>
                <div style={{ fontSize: 20, fontWeight: 600, opacity: 0.75 }}>{per}</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, opacity: 0.8 }}>{line}</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
