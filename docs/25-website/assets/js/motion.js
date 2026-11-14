/* khabo motion: small helpers shared by every page; the curves live in assets/css/motion.css.
   Text never moves on its own: words only fade in. Nothing here runs under "reduce motion". */
(function () {
  const K = window.K;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sheets: the content fades in a beat after the sheet arrives ---------- */
  const baseOpen = K.sheet.open;
  K.sheet.open = o => {
    const rec = baseOpen(o);
    const body = rec.el.querySelector('.sheet-b');
    if (body && !reduce()) {
      Array.from(body.children).forEach((c, i) => c.style.setProperty('--si', Math.min(i, 8)));
      rec.el.classList.add('enter');
      setTimeout(() => rec.el.classList.remove('enter'), 1000);
    }
    return rec;
  };
})();
