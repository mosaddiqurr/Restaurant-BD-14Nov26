/* the full animation engine (springs, layout moves, drag). It downloads after the page has shown,
   so the first paint never waits for it. Used by LazyMotion in components/providers/app-providers.tsx */
import { domMax } from 'motion/react';
export default domMax;
