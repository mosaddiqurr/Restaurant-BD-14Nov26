/* Branded QR codes: each restaurant's QR in its own colours, with its logo in the middle
   and a choice of module and corner shapes.

   One renderer for every page (restaurant QR panel, table cards, print menu, home, For restaurants).
   A restaurant's look comes from data, never from page code:
     r.qr = { look: 'rounded' }                  pick one of K.QR_LOOKS
     r.qr = { dots: 'dots', eyes: 'leaf' }       or set the shapes yourself
     r.logo = 'url-to-square-logo.png'           optional; the monogram is used when there is none
   With a logo in the middle the code uses the highest error correction (H, about 30%),
   and the logo covers well under that, so phones still read it. Colours stay dark on white. */
(function () {
  const K = window.K;
  const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  let wait = null;
  const lib = () => window.qrcode ? Promise.resolve() : (wait = wait || new Promise(res => { const s = document.createElement('script'); s.src = LIB; s.onload = s.onerror = res; document.head.appendChild(s); }));

  /* tested looks a restaurant can choose from; each one is just a pair of shapes */
  K.QR_LOOKS = {
    classic: { dots: 'square', eyes: 'square', en: 'Classic', bn: 'ক্লাসিক' },
    rounded: { dots: 'rounded', eyes: 'rounded', en: 'Rounded', bn: 'গোলাকার' },
    dots: { dots: 'dots', eyes: 'circle', en: 'Dots', bn: 'ডট' },
    leaf: { dots: 'rounded', eyes: 'leaf', en: 'Leaf', bn: 'পাতা' },
    diamond: { dots: 'diamond', eyes: 'rounded', en: 'Diamond', bn: 'ডায়মন্ড' },
    bars: { dots: 'bars', eyes: 'rounded', en: 'Lines', bn: 'লাইন' }
  };

  /* what a restaurant's code looks like unless told otherwise */
  K.qrStyle = (r, look) => {
    const q = r.qr || {}, L = K.QR_LOOKS[look || q.look] || K.QR_LOOKS.rounded;
    return {
      dots: look ? L.dots : q.dots || L.dots, eyes: look ? L.eyes : q.eyes || L.eyes,
      fg: q.fg || r.theme.deep, eye: q.eye || r.theme.deep, bg: '#fff',
      logo: r.logo ? { src: r.logo } : { text: r.mono, bg: r.theme.deep, fg: r.theme.accent }
    };
  };

  /* --- shapes, all drawn in module units on an n x n grid --- */
  const f = v => +v.toFixed(3);
  /* a square with only its free corners rounded, so touching modules melt together */
  function blob(x, y, on, r) {
    const t = !on(x, y - 1), b = !on(x, y + 1), l = !on(x - 1, y), rt = !on(x + 1, y);
    const tl = t && l ? r : 0, tr = t && rt ? r : 0, br = b && rt ? r : 0, bl = b && l ? r : 0;
    return `M${x + tl} ${y}H${f(x + 1 - tr)}${tr ? `A${r} ${r} 0 0 1 ${x + 1} ${f(y + tr)}` : ''}V${f(y + 1 - br)}${br ? `A${r} ${r} 0 0 1 ${f(x + 1 - br)} ${y + 1}` : ''}H${f(x + bl)}${bl ? `A${r} ${r} 0 0 1 ${x} ${f(y + 1 - bl)}` : ''}V${f(y + tl)}${tl ? `A${r} ${r} 0 0 1 ${f(x + tl)} ${y}` : ''}Z`;
  }
  /* rounded rectangle with its own radius per corner: tl, tr, br, bl */
  function rrect(x, y, w, h, [a, b, c, d]) {
    return `M${f(x + a)} ${y}H${f(x + w - b)}A${b} ${b} 0 0 1 ${f(x + w)} ${f(y + b)}V${f(y + h - c)}A${c} ${c} 0 0 1 ${f(x + w - c)} ${f(y + h)}H${f(x + d)}A${d} ${d} 0 0 1 ${x} ${f(y + h - d)}V${f(y + a)}A${a} ${a} 0 0 1 ${f(x + a)} ${y}Z`;
  }
  const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0Z`;

  function moduleShape(style, x, y, on) {
    switch (style) {
      case 'dots': return circ(x + .5, y + .5, .43);
      case 'diamond': return `M${x + .5} ${f(y - .02)}L${f(x + 1.02)} ${y + .5}L${x + .5} ${f(y + 1.02)}L${f(x - .02)} ${y + .5}Z`;
      case 'rounded': return blob(x, y, on, .5);
      default: return `M${x} ${y}h1v1h-1Z`;
    }
  }
  /* finder corners: outer ring (7x7) and centre (3x3); the leaf points away from the code */
  function eyeShape(style, x, y, corner) {
    const ring = (rad, inner) => rrect(x, y, 7, 7, rad) + rrect(x + 1, y + 1, 5, 5, inner);
    const leafOuter = corner === 'tl' ? [3.5, .6, 3.5, .6] : corner === 'tr' ? [.6, 3.5, .6, 3.5] : [.6, 3.5, .6, 3.5];
    const leafCore = corner === 'tl' ? [1.5, .3, 1.5, .3] : [.3, 1.5, .3, 1.5];
    switch (style) {
      case 'circle': return { ring: circ(x + 3.5, y + 3.5, 3.5) + circ(x + 3.5, y + 3.5, 2.5), core: circ(x + 3.5, y + 3.5, 1.5) };
      case 'rounded': return { ring: ring([2, 2, 2, 2], [1.3, 1.3, 1.3, 1.3]), core: rrect(x + 2, y + 2, 3, 3, [.9, .9, .9, .9]) };
      case 'leaf': return { ring: ring(leafOuter, leafOuter.map(v => Math.max(.3, v - 1))), core: rrect(x + 2, y + 2, 3, 3, leafCore) };
      default: return { ring: `M${x} ${y}h7v7h-7ZM${x + 1} ${y + 1}h5v5h-5Z`, core: `M${x + 2} ${y + 2}h3v3h-3Z` };
    }
  }

  /* build the SVG for a URL; returns a string so it also works for print and server use */
  K.qrSvg = (url, st) => {
    const hasLogo = !!st.logo;
    const q = window.qrcode(0, hasLogo ? 'H' : 'M'); q.addData(url); q.make();
    const n = q.getModuleCount();
    /* logo window: about a fifth of the width, always an odd size so it sits dead centre */
    let lw = hasLogo ? Math.round(n * .22) : 0; if (lw && lw % 2 === 0) lw++;
    const l0 = (n - lw) / 2 - .5, l1 = l0 + lw + 1;
    const inEye = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    const inLogo = (x, y) => lw && x >= l0 && x < l1 && y >= l0 && y < l1;
    const on = (x, y) => x >= 0 && y >= 0 && x < n && y < n && q.isDark(y, x) && !inEye(x, y) && !inLogo(x, y);
    let d = '';
    if (st.dots === 'bars') {
      /* vertical runs merged into one rounded bar each */
      for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) {
        if (!on(x, y) || on(x, y - 1)) continue;
        let e = y; while (on(x, e + 1)) e++;
        d += rrect(x + .1, y + .05, .8, e - y + .9, [.4, .4, .4, .4]);
      }
    } else {
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (on(x, y)) d += moduleShape(st.dots, x, y, on);
    }
    let eyes = '', cores = '';
    [[0, 0, 'tl'], [n - 7, 0, 'tr'], [0, n - 7, 'bl']].forEach(([x, y, c]) => { const e = eyeShape(st.eyes, x, y, c); eyes += e.ring; cores += e.core; });
    let logo = '';
    if (hasLogo) {
      const s = lw - .6, x = (n - s) / 2;
      logo = st.logo.src
        ? `<rect x="${f(x - .3)}" y="${f(x - .3)}" width="${f(s + .6)}" height="${f(s + .6)}" rx="${f(s * .26)}" fill="#fff"/><image href="${st.logo.src}" x="${f(x)}" y="${f(x)}" width="${f(s)}" height="${f(s)}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round ${f(s * .22)})"/>`
        : `<rect x="${f(x)}" y="${f(x)}" width="${f(s)}" height="${f(s)}" rx="${f(s * .26)}" fill="${st.logo.bg}"/><text x="${n / 2}" y="${n / 2}" fill="${st.logo.fg}" font-family="Figtree, system-ui, sans-serif" font-weight="800" font-size="${f(s * (String(st.logo.text).length > 2 ? .34 : .42))}" text-anchor="middle" dominant-baseline="central" letter-spacing="-.02em">${K.esc(st.logo.text)}</text>`;
    }
    return `<svg class="qra" viewBox="-.5 -.5 ${n + 1} ${n + 1}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code"><rect x="-.5" y="-.5" width="${n + 1}" height="${n + 1}" fill="${st.bg}"/><path d="${d}" fill="${st.fg}"/><path d="${eyes}" fill="${st.eye}" fill-rule="evenodd"/><path d="${cores}" fill="${st.eye}"/>${logo}</svg>`;
  };

  /* render into a box once the library is ready: K.qrArt(box, url, K.qrStyle(r)) */
  K.qrArt = (box, url, st) => lib().then(() => {
    try { box.innerHTML = K.qrSvg(url, st); } catch (e) { box.innerHTML = K.ico('qr-code', 'lg'); }
  });
})();
