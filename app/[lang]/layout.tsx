import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Figtree, Noto_Sans_Bengali, Tiro_Bangla } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import { KeepHtml } from '@/components/providers/keep-html';
import { SwRegister } from '@/components/providers/sw-register';
import { Overlays } from '@/components/overlays/overlays';
import { getDict } from '@/lib/i18n/server';
import { isLang, LANGS } from '@/lib/i18n/core';
import '../globals.css';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });
const bangla = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-bangla', display: 'swap', weight: ['400', '500', '600', '700'] });
const tiro = Tiro_Bangla({ subsets: ['latin', 'bengali'], variable: '--font-tiro', display: 'swap', weight: '400' });

export const generateStaticParams = () => LANGS.map(lang => ({ lang }));

/* shared by every page. The words (title, description) are set per language in (site)/layout.tsx and by each page;
   reading the language here would stop the panels' restaurant pages from being prepared ahead of time */
export const metadata: Metadata = {
  metadataBase: new URL('https://khabo.app'),
  title: { default: 'Khaoya', template: '%s · Khaoya' },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F5F6F3' }, { media: '(prefers-color-scheme: dark)', color: '#0B120F' }],
};

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} suppressHydrationWarning className={`${figtree.variable} ${bangla.variable} ${tiro.variable}`}>
      <body>
        <KeepHtml />
        <SwRegister />
        <AppProviders lang={lang} dict={getDict(lang)}>
          {children}
          <Overlays />
        </AppProviders>
      </body>
    </html>
  );
}
