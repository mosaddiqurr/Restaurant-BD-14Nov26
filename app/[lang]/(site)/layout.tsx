import type { Metadata } from 'next';
import { Header, TabBar } from '@/components/shell/header';
import { Footer } from '@/components/shell/footer';
import { NavProgress } from '@/components/shell/nav-progress';
import { getNav } from '@/lib/data/catalog';
import { getI18n } from '@/lib/i18n/server';
import { isLang } from '@/lib/i18n/core';

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;
  const bn = lang === 'bn';
  return {
    title: { default: bn ? 'খাবো · না জেনে আর বাইরে খেতে যাবেন না' : 'khabo · Eat out without the guesswork', template: bn ? '%s · খাবো' : '%s · khabo' },
    description: bn ? 'বের হওয়ার আগেই আসল মেনু, আসল দাম আর ভেতরটা দেখে নিন।' : 'Real menus, real prices and a real look inside, before you leave home.',
    alternates: { languages: { en: '/en', bn: '/bn' } },
  };
}

/* the diner site: header, the page, footer, and the tab bar on phones */
export default async function SiteLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  const nav = await getNav();
  const i = getI18n(isLang(lang) ? lang : 'en');
  return (
    <div className="screen">
      <a className="skip" href="#main">{i.t('skip_main') === 'skip_main' ? (i.bn ? 'মূল অংশে যান' : 'Skip to content') : i.t('skip_main')}</a>
      <NavProgress />
      <Header nav={nav} />
      <main id="main">{children}</main>
      <Footer />
      <TabBar />
    </div>
  );
}
