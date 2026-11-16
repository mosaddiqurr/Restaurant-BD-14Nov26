'use client';
/* Sheets and dialogs that any page can open (dish, bill, search, Ask khabo, sign in, film, 360 tour, photos, reviews).
   Each one downloads only the first time it opens, so pages stay light. */
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useApp } from '@/lib/store';

const DishSheet = dynamic(() => import('./dish-sheet').then(m => m.DishSheet));
const BillDrawer = dynamic(() => import('./bill').then(m => m.BillDrawer));
const Palette = dynamic(() => import('./palette').then(m => m.Palette));
const AiSheet = dynamic(() => import('./ai-sheet').then(m => m.AiSheet));
const SignIn = dynamic(() => import('./signin').then(m => m.SignIn));
const FilmDlg = dynamic(() => import('./media').then(m => m.FilmDlg));
const TourDlg = dynamic(() => import('./media').then(m => m.TourDlg));
const Lightbox = dynamic(() => import('./media').then(m => m.Lightbox));
const AllReviews = dynamic(() => import('./reviews').then(m => m.AllReviews));
const WriteReview = dynamic(() => import('./reviews').then(m => m.WriteReview));

/** stays mounted after the first open, so the closing animation can play */
function useOnce(open: boolean) {
  const [was, setWas] = useState(false);
  if (open && !was) setWas(true);
  return open || was;
}

export function Overlays() {
  const s = useApp();
  const dish = useOnce(!!s.dish), bill = useOnce(!!s.billOpen), pal = useOnce(s.palette), ai = useOnce(!!s.ai), sign = useOnce(!!s.signin);
  const film = useOnce(!!s.film), tour = useOnce(!!s.tour), lb = useOnce(!!s.lb), rv = useOnce(!!s.rvAll), wr = useOnce(!!s.write);
  return (
    <>
      {dish ? <DishSheet /> : null}
      {bill ? <BillDrawer /> : null}
      {pal ? <Palette /> : null}
      {ai ? <AiSheet /> : null}
      {sign ? <SignIn /> : null}
      {film ? <FilmDlg /> : null}
      {tour ? <TourDlg /> : null}
      {lb ? <Lightbox /> : null}
      {rv ? <AllReviews /> : null}
      {wr ? <WriteReview /> : null}
    </>
  );
}
