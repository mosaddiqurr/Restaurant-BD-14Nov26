import { Bebas_Neue, Cormorant_Garamond, DM_Serif_Display, Playfair_Display } from 'next/font/google';
import '@/styles/print-menu.css';

/* the printed menus use a few extra typefaces; they load only on this page */
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '500', '600', '700'], style: ['normal', 'italic'], variable: '--pm-cormorant', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '800'], style: ['normal', 'italic'], variable: '--pm-playfair', display: 'swap' });
const dmserif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--pm-dmserif', display: 'swap' });
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--pm-bebas', display: 'swap' });

/* no diner header or footer: just the paper and a small bar to print it */
export default function PrintLayout({ children }: LayoutProps<'/[lang]/print'>) {
  return <div className={`${cormorant.variable} ${playfair.variable} ${dmserif.variable} ${bebas.variable}`}>{children}</div>;
}
