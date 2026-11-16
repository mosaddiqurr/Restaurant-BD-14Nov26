/* QR frames: a shape drawn around the QR code (a pot, a tea cup, a ticket, an Eid arch...).
   Used for table cards and door stickers. Every frame is one small SVG drawing plus two boxes:
     q  where the QR sits (always on white, so phones read it), in the drawing's own units
     t  where the words go (t1 big, t2 small), and the colour they are written in
   Colours come from the restaurant or the khabo pair the owner picked: d = deep, a = accent,
   l = accent that still shows on white paper (black when the owner picked black and white).
   To add a frame: one F(...) line below. The picker in the panel lists them by group. */
(function () {
  const K = window.K = window.K || {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const W = '#fff';
  const FR = {}, ORDER = [];
  const F = (id, en, cat, w, h, q, t, draw, x = {}) => { FR[id] = Object.assign({ id, en, cat, w, h, q, t, draw }, x); ORDER.push(id); };

  /* small drawing helpers */
  const star = (cx, cy, R, r, n = 5, rot = -90) => { let p = ''; for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R; p += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`; } return p + 'Z'; };
  const flower = (cx, cy, r, c1, c2) => Array.from({ length: 6 }, (_, i) => `<ellipse cx="${cx}" cy="${cy - r * .55}" rx="${r * .32}" ry="${r * .55}" fill="${c1}" transform="rotate(${i * 60} ${cx} ${cy})"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="${r * .3}" fill="${c2}"/>`;
  const burst = (cx, cy, r, c) => Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<line x1="${(cx + r * .35 * Math.cos(a)).toFixed(1)}" y1="${(cy + r * .35 * Math.sin(a)).toFixed(1)}" x2="${(cx + r * Math.cos(a)).toFixed(1)}" y2="${(cy + r * Math.sin(a)).toFixed(1)}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`; }).join('') + `<circle cx="${cx}" cy="${cy}" r="3" fill="${c}"/>`;
  const leaf = (cx, cy, len, rot, c) => `<path d="M${cx} ${cy} q${len * .45} ${-len * .32} ${len} 0 q${-len * .55} ${len * .32} ${-len} 0z" fill="${c}" transform="rotate(${rot} ${cx} ${cy})"/>`;
  const corners = (x, y, s, len, c, w) => { const e = x + s, b = y + s; return `<path d="M${x} ${y + len}V${y + 6}Q${x} ${y} ${x + 6} ${y}H${x + len}M${e - len} ${y}H${e - 6}Q${e} ${y} ${e} ${y + 6}V${y + len}M${e} ${b - len}V${b - 6}Q${e} ${b} ${e - 6} ${b}H${e - len}M${x + len} ${b}H${x + 6}Q${x} ${b} ${x} ${b - 6}V${b - len}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; };

  /* ---------------- standard ---------------- */
  F('banner', 'Scan banner', 'standard', 200, 246, { x: 24, y: 24, s: 152 }, { x: 14, y: 192, w: 172, h: 46, c: () => W },
    o => `<rect x="4" y="4" width="192" height="238" rx="20" fill="${o.d}"/><path d="M90 191l10-9 10 9z" fill="${o.a}"/>`);
  F('top', 'Banner on top', 'standard', 200, 246, { x: 24, y: 74, s: 152 }, { x: 14, y: 8, w: 172, h: 48, c: () => W },
    o => `<rect x="4" y="4" width="192" height="238" rx="20" fill="${o.d}"/><path d="M90 57l10 9 10-9z" fill="${o.a}"/>`);
  F('pill', 'Outline and tab', 'standard', 200, 226, { x: 22, y: 22, s: 156 }, { x: 28, y: 182, w: 144, h: 38, c: () => W },
    o => `<rect x="5" y="5" width="190" height="190" rx="24" fill="#fff" stroke="${o.d}" stroke-width="6"/><rect x="28" y="182" width="144" height="38" rx="19" fill="${o.d}"/>`, { bare: true });
  F('bubble', 'Speech bubble', 'standard', 200, 250, { x: 26, y: 26, s: 148 }, { x: 8, y: 218, w: 184, h: 30, c: o => o.dk },
    o => `<path d="M28 6H172Q194 6 194 28V174Q194 196 172 196H116L100 214L84 196H28Q6 196 6 174V28Q6 6 28 6Z" fill="${o.d}"/>`);
  F('corners', 'Scan corners', 'standard', 200, 236, { x: 24, y: 24, s: 152 }, { x: 8, y: 196, w: 184, h: 38, c: o => o.dk },
    o => corners(8, 8, 184, 40, o.d, 7) + corners(16, 16, 168, 20, o.l, 3), { bare: true });
  F('phone', 'Phone', 'standard', 200, 300, { x: 38, y: 46, s: 124 }, { x: 34, y: 178, w: 132, h: 80, c: o => o.dk },
    o => `<rect x="20" y="4" width="160" height="292" rx="28" fill="${o.d}"/><rect x="30" y="30" width="140" height="236" rx="10" fill="#fff"/><rect x="80" y="14" width="40" height="7" rx="3.5" fill="${o.a}"/><rect x="82" y="276" width="36" height="5" rx="2.5" fill="${o.a}"/>`, { bare: true });
  F('ticket', 'Ticket', 'standard', 200, 270, { x: 26, y: 26, s: 148 }, { x: 14, y: 214, w: 172, h: 44, c: () => W },
    o => `<path d="M20 4H180Q196 4 196 20V192A12 12 0 0 0 196 216V250Q196 266 180 266H20Q4 266 4 250V216A12 12 0 0 0 4 192V20Q4 4 20 4Z" fill="${o.d}"/><line x1="20" y1="204" x2="180" y2="204" stroke="${o.a}" stroke-width="2" stroke-dasharray="6 5"/>`);
  F('ring', 'Round badge', 'standard', 220, 220, { x: 58, y: 58, s: 104 }, null,
    (o, uid) => { const s = (o.t1 || 'Scan me').toUpperCase(), rep = Array(Math.max(2, Math.floor(46 / (s.length + 3)))).fill(s).join('  ✦  ') + '  ✦  '; return `<circle cx="110" cy="110" r="106" fill="${o.d}"/><circle cx="110" cy="110" r="80" fill="#fff"/><circle cx="110" cy="110" r="84" fill="none" stroke="${o.a}" stroke-width="2"/><defs><path id="${uid}" d="M110,110 m-94,0 a94,94 0 1,1 188,0 a94,94 0 1,1 -188,0"/></defs><text font-size="13" font-weight="800" letter-spacing="1.5" fill="${W}"><textPath href="#${uid}" textLength="586" lengthAdjust="spacing">${esc(rep)}</textPath></text>`; }, { bare: true });
  F('clip', 'Clipboard', 'standard', 200, 262, { x: 32, y: 54, s: 136 }, { x: 24, y: 196, w: 152, h: 46, c: o => o.dk },
    o => `<rect x="8" y="18" width="184" height="240" rx="16" fill="${o.d}"/><rect x="20" y="42" width="160" height="204" rx="8" fill="#fff"/><rect x="64" y="4" width="72" height="30" rx="9" fill="${o.a}"/><circle cx="100" cy="15" r="5" fill="${o.d}"/>`, { bare: true });
  F('tag', 'Hanging tag', 'standard', 200, 272, { x: 36, y: 84, s: 128 }, { x: 22, y: 222, w: 156, h: 40, c: () => W },
    o => `<path d="M100 4L186 62V256Q186 268 174 268H26Q14 268 14 256V62Z" fill="${o.d}"/><circle cx="100" cy="44" r="10" fill="#fff" stroke="${o.a}" stroke-width="3"/>`);

  /* ---------------- holidays ---------------- */
  F('eid', 'Eid arch', 'holiday', 200, 272, { x: 34, y: 92, s: 132 }, { x: 16, y: 234, w: 168, h: 34, c: o => o.a },
    o => `<path d="M6 268V112Q6 64 48 44Q88 26 100 4Q112 26 152 44Q194 64 194 112V268Z" fill="${o.d}"/><circle cx="100" cy="54" r="16" fill="${o.a}"/><circle cx="107" cy="49" r="13" fill="${o.d}"/><path d="${star(122, 62, 6, 2.6)}" fill="${o.a}"/>
      <line x1="30" y1="70" x2="30" y2="88" stroke="${o.a}" stroke-width="1.5"/><path d="M24 88h12l-2 14h-8z" fill="${o.a}"/><line x1="170" y1="70" x2="170" y2="88" stroke="${o.a}" stroke-width="1.5"/><path d="M164 88h12l-2 14h-8z" fill="${o.a}"/>`);
  F('lantern', 'Ramadan lantern', 'holiday', 200, 292, { x: 42, y: 70, s: 116 }, { x: 30, y: 198, w: 140, h: 46, c: () => W },
    o => `<circle cx="100" cy="10" r="7" fill="none" stroke="${o.a}" stroke-width="3"/><path d="M72 20H128L150 50H50Z" fill="${o.a}"/><rect x="22" y="50" width="156" height="200" rx="14" fill="${o.d}"/><rect x="22" y="50" width="8" height="200" fill="${o.a}" opacity=".55"/><rect x="170" y="50" width="8" height="200" fill="${o.a}" opacity=".55"/><path d="M50 250H150L130 274H70Z" fill="${o.a}"/><circle cx="100" cy="282" r="6" fill="${o.a}"/>`);
  F('boishakh', 'Pohela Boishakh', 'holiday', 220, 262, { x: 40, y: 38, s: 140 }, { x: 30, y: 186, w: 160, h: 46, c: () => '#B3121D' },
    () => { let dots = ''; for (let x = 44; x <= 176; x += 22) dots += `<circle cx="${x}" cy="12" r="3" fill="#fff"/><circle cx="${x}" cy="250" r="3" fill="#fff"/>`; for (let y = 44; y <= 218; y += 22) dots += `<circle cx="12" cy="${y}" r="3" fill="#fff"/><circle cx="208" cy="${y}" r="3" fill="#fff"/>`;
      return `<rect x="2" y="2" width="216" height="258" rx="20" fill="#C8102E"/><rect x="22" y="22" width="176" height="218" rx="10" fill="#fff"/>${dots}${flower(22, 22, 20, '#F2B705', '#C8102E')}${flower(198, 22, 20, '#F2B705', '#C8102E')}${flower(22, 240, 20, '#F2B705', '#C8102E')}${flower(198, 240, 20, '#F2B705', '#C8102E')}`; }, { bare: true });
  F('victory', 'Red and green', 'holiday', 220, 252, { x: 48, y: 52, s: 124 }, { x: 14, y: 210, w: 192, h: 36, c: () => W },
    () => `<rect x="2" y="2" width="216" height="248" rx="18" fill="#006A4E"/><circle cx="110" cy="114" r="86" fill="#F42A41"/>`);
  F('wreath', 'Winter wreath', 'holiday', 220, 264, { x: 58, y: 58, s: 104 }, { x: 10, y: 230, w: 200, h: 32, c: o => o.dk },
    () => { let s = '<circle cx="110" cy="110" r="92" fill="none" stroke="#1B5E20" stroke-width="10"/>'; for (let i = 0; i < 24; i++) { const a = i * 15, rad = a * Math.PI / 180, x = 110 + 92 * Math.cos(rad), y = 110 + 92 * Math.sin(rad); s += leaf(x.toFixed(1), y.toFixed(1), 26, a + (i % 2 ? 60 : 120), i % 2 ? '#2E7D32' : '#43A047'); if (i % 3 === 0) s += `<circle cx="${(110 + 82 * Math.cos(rad + .1)).toFixed(1)}" cy="${(110 + 82 * Math.sin(rad + .1)).toFixed(1)}" r="4.5" fill="#D32F2F"/>`; }
      return s + `<circle cx="110" cy="110" r="76" fill="#fff"/><path d="M110 196L82 182L84 212Z M110 196L138 182L136 212Z" fill="#C62828"/><path d="M106 198L96 226L104 224L110 202Z M114 198L124 226L116 224L110 202Z" fill="#B71C1C"/><circle cx="110" cy="196" r="7" fill="#E53935"/>`; }, { bare: true });
  F('fireworks', 'New year', 'holiday', 220, 262, { x: 42, y: 60, s: 136 }, { x: 14, y: 210, w: 192, h: 44, c: o => o.a },
    o => `<rect x="2" y="2" width="216" height="258" rx="20" fill="${o.d}"/>${burst(38, 32, 24, o.a)}${burst(182, 30, 20, '#fff')}${burst(110, 26, 16, '#FF7AA2')}<circle cx="70" cy="14" r="1.6" fill="#fff"/><circle cx="150" cy="50" r="1.6" fill="#fff"/><circle cx="20" cy="70" r="1.4" fill="${o.a}"/><circle cx="200" cy="80" r="1.4" fill="${o.a}"/>`);
  F('heart', 'Heart', 'holiday', 220, 250, { x: 62, y: 50, s: 96 }, { x: 10, y: 214, w: 200, h: 34, c: () => '#D81B60' },
    () => `<path d="M110 206C40 156 4 116 4 70C4 34 32 8 64 8C86 8 102 20 110 36C118 20 134 8 156 8C188 8 216 34 216 70C216 116 180 156 110 206Z" fill="#E0245E"/><path d="M40 52c4-14 16-22 30-22" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>`);

  /* ---------------- events and offers ---------------- */
  F('birthday', 'Birthday cake', 'event', 220, 300, { x: 50, y: 112, s: 120 }, { x: 22, y: 246, w: 176, h: 42, c: () => W },
    o => `${[86, 110, 134].map((x, i) => `<rect x="${x - 4}" y="22" width="8" height="34" rx="3" fill="${['#FF7AA2', '#4FC3F7', '#FFD54F'][i]}"/><ellipse cx="${x}" cy="14" rx="5" ry="8" fill="#FFB300"/>`).join('')}<rect x="48" y="54" width="124" height="34" rx="10" fill="${o.a}"/><rect x="14" y="84" width="192" height="212" rx="18" fill="${o.d}"/><path d="M14 102V98Q14 84 32 84H188Q206 84 206 98V102Q196 116 186 102Q176 116 166 102Q156 116 146 102Q136 116 126 102Q116 116 106 102Q96 116 86 102Q76 116 66 102Q56 116 46 102Q36 116 26 102Q20 110 14 102Z" fill="${o.a}"/>`);
  F('wedding', 'Two rings', 'event', 220, 272, { x: 44, y: 76, s: 132 }, { x: 20, y: 218, w: 180, h: 40, c: o => o.a },
    o => `<rect x="8" y="42" width="204" height="226" rx="20" fill="${o.d}"/><rect x="16" y="50" width="188" height="210" rx="14" fill="none" stroke="${o.a}" stroke-width="1.5"/><circle cx="96" cy="34" r="20" fill="none" stroke="${o.a}" stroke-width="6"/><circle cx="124" cy="34" r="20" fill="none" stroke="${o.a}" stroke-width="6"/><path d="M90 8l6-6 6 6-6 8z" fill="#fff"/>`);
  F('opening', 'Grand opening', 'event', 220, 270, { x: 42, y: 66, s: 136 }, { x: 20, y: 214, w: 180, h: 44, c: o => o.dk },
    o => `<rect x="8" y="8" width="204" height="254" rx="20" fill="#fff" stroke="${o.d}" stroke-width="4"/><rect x="8" y="30" width="204" height="18" fill="${o.l}"/><path d="M110 39C90 18 70 22 76 39C70 56 90 60 110 39ZM110 39C130 18 150 22 144 39C150 56 130 60 110 39Z" fill="${o.d}"/><circle cx="110" cy="39" r="7" fill="${o.l}" stroke="${o.d}" stroke-width="3"/>`, { bare: true });
  F('balloons', 'Party balloons', 'event', 220, 292, { x: 48, y: 96, s: 124 }, { x: 20, y: 232, w: 180, h: 46, c: () => W },
    o => `<path d="M40 60Q46 66 40 76M180 56Q174 64 180 76M110 46Q116 60 110 76" stroke="#999" stroke-width="1.5" fill="none"/><ellipse cx="40" cy="34" rx="22" ry="27" fill="${o.a}"/><ellipse cx="180" cy="30" rx="20" ry="25" fill="#FF7AA2"/><ellipse cx="110" cy="22" rx="18" ry="22" fill="#4FC3F7"/><rect x="10" y="76" width="200" height="212" rx="20" fill="${o.d}"/>`);
  F('burst', 'Offer burst', 'event', 220, 220, { x: 60, y: 54, s: 100 }, { x: 22, y: 164, w: 176, h: 30, c: o => o.dk },
    o => `<path d="${star(110, 110, 108, 92, 18)}" fill="${o.l}"/><circle cx="110" cy="110" r="86" fill="${o.d}"/><rect x="22" y="164" width="176" height="30" rx="8" fill="#fff"/>`);

  /* ---------------- food and places ---------------- */
  F('handi', 'Cooking pot', 'theme', 220, 270, { x: 57, y: 86, s: 106 }, { x: 44, y: 204, w: 132, h: 42, c: () => W },
    o => `<path d="M96 6c-6-6 6-10 0-16M110 4c-6-6 6-10 0-16M124 6c-6-6 6-10 0-16" transform="translate(0 14)" stroke="${o.l}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="110" cy="26" r="8" fill="${o.a}"/><path d="M42 58Q110 18 178 58Z" fill="${o.a}"/><rect x="24" y="56" width="172" height="14" rx="7" fill="${o.a}"/><path d="M30 70H190Q214 150 186 230Q176 262 140 264H80Q44 262 34 230Q6 150 30 70Z" fill="${o.d}"/><path d="M28 98Q8 100 10 118Q12 134 30 132M192 98Q212 100 210 118Q208 134 190 132" stroke="${o.a}" stroke-width="7" fill="none" stroke-linecap="round"/>`);
  F('teacup', 'Tea cup', 'theme', 240, 252, { x: 52, y: 66, s: 106 }, { x: 40, y: 182, w: 130, h: 30, c: () => W },
    o => `<path d="M80 40c-8-10 8-14 0-26M105 40c-8-10 8-14 0-26M130 40c-8-10 8-14 0-26" stroke="${o.l}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><ellipse cx="110" cy="234" rx="104" ry="13" fill="${o.a}"/><path d="M188 82Q232 80 230 120Q228 162 186 164" stroke="${o.d}" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M20 50H192V150Q192 216 128 222H84Q20 216 20 150Z" fill="${o.d}"/>`);
  F('plate', 'Plate and cutlery', 'theme', 260, 250, { x: 73, y: 53, s: 114 }, { x: 30, y: 220, w: 200, h: 28, c: o => o.dk },
    o => `<circle cx="130" cy="110" r="104" fill="${o.d}"/><circle cx="130" cy="110" r="94" fill="none" stroke="${o.a}" stroke-width="1.5" opacity=".7"/><circle cx="130" cy="110" r="84" fill="#fff"/>
      ${[15, 21, 27, 33].map(x => `<line x1="${x}" y1="28" x2="${x}" y2="64" stroke="${o.d}" stroke-width="3" stroke-linecap="round"/>`).join('')}<path d="M13 60Q13 86 24 90Q35 86 35 60Z" fill="${o.d}"/><rect x="20" y="88" width="8" height="112" rx="4" fill="${o.d}"/>
      <path d="M232 26Q250 40 247 112H232Z" fill="${o.d}"/><rect x="230" y="108" width="11" height="92" rx="5" fill="${o.d}"/>`, { bare: true });
  F('chef', 'Chef hat', 'theme', 220, 312, { x: 50, y: 118, s: 120 }, { x: 20, y: 252, w: 180, h: 46, c: () => W },
    o => `<rect x="10" y="98" width="200" height="208" rx="20" fill="${o.d}"/><g fill="#fff" stroke="${o.d}" stroke-width="4"><circle cx="70" cy="48" r="32"/><circle cx="150" cy="48" r="32"/><circle cx="110" cy="36" r="38"/><rect x="56" y="58" width="108" height="34" rx="4"/></g><line x1="58" y1="80" x2="162" y2="80" stroke="${o.l}" stroke-width="3"/>`);
  F('bag', 'Takeaway bag', 'theme', 220, 282, { x: 50, y: 98, s: 120 }, { x: 30, y: 230, w: 160, h: 40, c: () => W },
    o => `<path d="M72 60V42Q72 10 110 10Q148 10 148 42V60" stroke="${o.d}" stroke-width="8" fill="none"/><path d="M18 58H202L192 272Q191 278 184 278H36Q29 278 28 272Z" fill="${o.d}"/><rect x="18" y="58" width="184" height="18" fill="${o.a}"/>`);
  F('leaves', 'Fresh leaves', 'theme', 220, 252, { x: 42, y: 32, s: 136 }, { x: 20, y: 198, w: 180, h: 42, c: o => o.dk },
    o => `<rect x="6" y="6" width="208" height="240" rx="22" fill="#fff" stroke="${o.d}" stroke-width="3"/>${leaf(10, 30, 34, -30, '#43A047')}${leaf(10, 30, 30, 20, '#2E7D32')}${leaf(18, 14, 26, -70, '#66BB6A')}${leaf(210, 222, 34, 150, '#43A047')}${leaf(210, 222, 30, 200, '#2E7D32')}${leaf(202, 238, 26, 110, '#66BB6A')}`, { bare: true });
  F('rickshaw', 'Rickshaw art', 'theme', 220, 282, { x: 48, y: 52, s: 124 }, { x: 24, y: 196, w: 172, h: 58, c: () => '#FFC107' },
    o => `<rect x="2" y="2" width="216" height="278" rx="20" fill="${o.d}"/><rect x="10" y="10" width="200" height="262" rx="14" fill="none" stroke="#FFC107" stroke-width="4"/><rect x="17" y="17" width="186" height="248" rx="10" fill="none" stroke="#E53935" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>
      ${flower(26, 26, 18, '#E91E63', '#FFC107')}${flower(194, 26, 18, '#4CAF50', '#FFC107')}${flower(26, 256, 18, '#4CAF50', '#FFC107')}${flower(194, 256, 18, '#E91E63', '#FFC107')}${leaf(44, 30, 18, 10, '#4CAF50')}${leaf(176, 30, 18, 170, '#4CAF50')}${leaf(44, 252, 18, -10, '#E91E63')}${leaf(176, 252, 18, 190, '#E91E63')}`);

  K.QR_FRAME_CATS = { standard: 'Standard', holiday: 'Holidays', event: 'Events and offers', theme: 'Food and places' };
  K.QR_FRAMES = ORDER.map(id => FR[id]);

  /* the words, made to fit their box */
  const words = (f, o) => {
    const T = f.t; if (!T) return '';
    const c = T.c(o), cx = T.x + T.w / 2, l1 = (o.t1 || '').trim(), l2 = (o.t2 || '').trim();
    const fit = (s, max, k) => Math.min(max, T.w / Math.max(1, s.length * k));
    const tx = (s, y, fs, wt, op = 1) => `<text x="${cx}" y="${y.toFixed(1)}" font-size="${fs.toFixed(1)}" font-weight="${wt}" fill="${c}" text-anchor="middle"${op < 1 ? ` opacity="${op}"` : ''}>${esc(s)}</text>`;
    if (l1 && l2 && T.h >= 30) { const f1 = fit(l1, T.h * .46, .6), f2 = fit(l2, T.h * .28, .52), gap = T.h * .07, y0 = T.y + (T.h - f1 - gap - f2) / 2; return tx(l1, y0 + f1 * .8, f1, 800) + tx(l2, y0 + f1 + gap + f2 * .8, f2, 600, .85); }
    const s = l1 || l2; if (!s) return '';
    const fs = fit(s, T.h * .58, .6); return tx(s, T.y + T.h / 2 + fs * .35, fs, 800);
  };
  let uid = 0;
  /* o: { d, a, l, t1, t2, qr (svg markup, optional), attr (extra attributes for the QR box, optional) } */
  K.qrFrame = (id, o) => {
    const f = FR[id] || FR.banner, q = f.q, pad = q.s * .06;
    o = Object.assign({ d: '#14192B', a: '#F5A300' }, o); o.l = o.l || o.a; o.dk = o.dk || o.d;
    const bg = f.bare ? '' : `<rect x="${q.x - pad}" y="${q.y - pad}" width="${q.s + pad * 2}" height="${q.s + pad * 2}" rx="${(q.s * .07).toFixed(1)}" fill="#fff"/>`;
    return `<div class="qf qf-${f.id}" style="--ar:${(f.w / f.h).toFixed(4)}"><svg viewBox="0 0 ${f.w} ${f.h}" aria-hidden="true">${f.draw(o, `qf-${++uid}`)}${bg}${words(f, o)}</svg><div class="qf-q" ${o.attr || ''} style="left:${(q.x / f.w * 100).toFixed(3)}%;top:${(q.y / f.h * 100).toFixed(3)}%;width:${(q.s / f.w * 100).toFixed(3)}%">${o.qr || ''}</div></div>`;
  };
})();
