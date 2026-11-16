/* khabo: small motion pieces shared by the site and the panels.
   Ideas from transitions.dev, written again here so they work without React:
   1. Lift group:   stacked photos lift when hovered, neighbours lift less, then spring back.  Mark a row with data-lift.
   2. Shimmer text: a light band sweeps across text while something is loading.  <span class="t-shimmer" data-text="...">...</span>
   3. Accordion:    smooth open and close, the arrow flips.  .t-acc[data-open] > .t-acc-head + .t-acc-panel > .t-acc-in
   4. Drag with physics: the card tilts with your hand speed, the column opens a slot, the card springs into it.  KF.drag(root, opts)
   Everything turns off when the device asks for reduced motion. */
(function () {
  'use strict';
  const CSS = `
[data-lift] > * { transform: translateY(var(--shift, 0px)) scale(var(--sa, 1)); transition: transform 320ms cubic-bezier(.22, 1, .36, 1); will-change: transform; }
[data-lift] > *:hover { z-index: 2; position: relative; }
.t-shimmer { position: relative; display: inline-block; color: var(--ink-3, #6e6e6e); }
.t-shimmer::before { content: attr(data-text); position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(90deg, transparent 0%, transparent 40%, var(--ink, #ededed) 50%, transparent 60%, transparent 100%); background-size: 400% 100%; background-repeat: no-repeat; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; animation: t-shimmer 2s linear infinite; }
@keyframes t-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0% 0; } }
.t-acc-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 260ms cubic-bezier(.22, 1, .36, 1); }
.t-acc[data-open="true"] .t-acc-panel { grid-template-rows: 1fr; }
.t-acc-in { overflow: hidden; min-height: 0; opacity: 0; filter: blur(2px); transition: opacity 260ms cubic-bezier(.22, 1, .36, 1), filter 260ms cubic-bezier(.22, 1, .36, 1); }
.t-acc[data-open="true"] .t-acc-in { opacity: 1; filter: blur(0); }
.t-acc-chev { display: inline-flex; flex: none; transition: transform 260ms cubic-bezier(.22, 1, .36, 1); }
.t-acc[data-open="true"] .t-acc-chev { transform: scaleY(-1); }
.t-ghost { position: fixed !important; left: 0; top: 0; z-index: 1000; margin: 0 !important; pointer-events: none; transform-origin: 50% 25%; box-shadow: 0 26px 50px -18px rgba(14, 18, 48, .38), 0 0 0 1px rgba(14, 18, 48, .06) !important; will-change: transform; transition: none !important; }
.t-ghost.t-land { transition: transform 520ms cubic-bezier(.34, 1.56, .64, 1), box-shadow 300ms !important; box-shadow: 0 2px 6px rgba(14, 18, 48, .1) !important; }
.t-src { opacity: .3; transition: opacity .2s; }
.t-slot { border-radius: 14px; border: 1.5px dashed currentColor; opacity: .35; height: 0; transition: height 300ms cubic-bezier(.22, 1, .36, 1); }
body.t-dragging, body.t-dragging * { cursor: grabbing !important; user-select: none; }
@media (prefers-reduced-motion: reduce) {
  [data-lift] > *, .t-acc-panel, .t-acc-in, .t-acc-chev, .t-ghost.t-land, .t-slot { transition: none !important; }
  [data-lift] > * { transform: none !important; }
  .t-shimmer::before { animation: none !important; }
}`;
  if (!document.getElementById('khabo-feel')) { const s = document.createElement('style'); s.id = 'khabo-feel'; s.textContent = CSS; document.head.appendChild(s); }
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. lift group: the hovered item lifts most, each neighbour a little less; the return is a bouncy spring */
  const IN = 'cubic-bezier(.22, 1, .36, 1)', OUT = 'cubic-bezier(.34, 3.85, .64, 1)';
  const lift = (g, idx, phase, up = -6) => {
    [...g.children].forEach((el, i) => {
      el.style.transitionTimingFunction = phase === 'out' ? OUT : IN;
      if (idx == null) { el.style.setProperty('--shift', '0px'); el.style.setProperty('--sa', '1'); return; }
      el.style.setProperty('--shift', (up * Math.pow(.45, Math.abs(i - idx))).toFixed(2) + 'px');
      el.style.setProperty('--sa', i === idx ? '1.06' : '1');
    });
  };
  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;
    const it = e.target.closest && e.target.closest('[data-lift] > *'); if (!it) return;
    lift(it.parentElement, [...it.parentElement.children].indexOf(it), 'in');
  });
  document.addEventListener('pointerout', e => {
    const g = e.target.closest && e.target.closest('[data-lift]'); if (!g || g.contains(e.relatedTarget)) return;
    lift(g, null, 'out');
  });
  /* a newly added item: the row ripples from the new photo, then springs back */
  const pop = g => { if (!g || still() || !g.children.length) return; lift(g, g.children.length - 1, 'in', -9); setTimeout(() => lift(g, null, 'out'), 260); };

  /* 3. accordion: any .t-acc-head opens and closes its .t-acc */
  document.addEventListener('click', e => {
    const h = e.target.closest && e.target.closest('.t-acc-head'); if (!h) return;
    const a = h.closest('.t-acc'), open = a.dataset.open !== 'true';
    a.dataset.open = String(open); h.setAttribute('aria-expanded', String(open));
  });

  /* 4. drag with physics.
     opts: item (card selector), zone (drop area selector), list (where the slot goes inside a zone, optional),
     key (attribute that names a card), overClass (class on the zone under the card), onDrop(id, zone).
     Mouse and pen only: on touch the page keeps scrolling and the card's own buttons do the moving. */
  const drag = (root, o) => {
    root.addEventListener('dragstart', e => { if (e.target.closest && e.target.closest(o.item)) e.preventDefault(); });
    root.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.pointerType === 'touch') return;
      const card = e.target.closest(o.item);
      if (!card || !root.contains(card) || e.target.closest('a,button,input,select,textarea,label')) return;
      const sx = e.clientX, sy = e.clientY, id = card.getAttribute(o.key);
      let ghost = null, slot = null, over = null, raf = 0, r, ox, oy, px = sx, py = sy, lx = sx, lt = performance.now(), vx = 0, tilt = 0;
      const place = (x, y, rot, sc) => { ghost.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sc})`; };
      const loop = () => {
        const aim = still() ? 0 : Math.max(-14, Math.min(14, vx * 10));
        tilt += (aim - tilt) * .16; vx *= .88;
        place(px - ox, py - oy, tilt.toFixed(2), 1.04);
        raf = requestAnimationFrame(loop);
      };
      const setOver = z => {
        if (z === over) return;
        if (over) { over.classList.remove(o.overClass || 't-over'); if (slot) { const s = slot; s.style.height = '0px'; setTimeout(() => s.remove(), 300); slot = null; } }
        over = z;
        if (over && over !== card.closest(o.zone)) {
          over.classList.add(o.overClass || 't-over');
          slot = document.createElement('div'); slot.className = 't-slot';
          (o.list ? over.querySelector(o.list) : over).appendChild(slot);
          requestAnimationFrame(() => { if (slot) slot.style.height = r.height + 'px'; });
        } else if (over) over.classList.add(o.overClass || 't-over');
      };
      const move = ev => {
        px = ev.clientX; py = ev.clientY;
        if (!ghost) {
          if (Math.hypot(px - sx, py - sy) < 6) return;
          r = card.getBoundingClientRect(); ox = sx - r.left; oy = sy - r.top;
          ghost = card.cloneNode(true); ghost.classList.add('t-ghost'); ghost.removeAttribute('id');
          ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px';
          document.body.appendChild(ghost); card.classList.add('t-src'); document.body.classList.add('t-dragging');
          loop();
        }
        const now = performance.now(), dt = Math.max(8, now - lt);
        vx = vx * .6 + ((px - lx) / dt) * .4; lx = px; lt = now;
        const under = document.elementFromPoint(px, py);
        setOver(under && under.closest(o.zone));
      };
      const end = () => {
        removeEventListener('pointermove', move); removeEventListener('pointerup', end); removeEventListener('pointercancel', end);
        if (!ghost) return;
        cancelAnimationFrame(raf); document.body.classList.remove('t-dragging');
        const swallow = ev => { ev.stopPropagation(); ev.preventDefault(); };
        root.addEventListener('click', swallow, true); setTimeout(() => root.removeEventListener('click', swallow, true), 60);
        const z = over && over !== card.closest(o.zone) ? over : null, to = (slot && z ? slot : card).getBoundingClientRect();
        if (over) over.classList.remove(o.overClass || 't-over');
        ghost.classList.add('t-land'); place(to.left, to.top, 0, 1);
        const finish = () => { ghost.remove(); if (slot) slot.remove(); card.classList.remove('t-src'); if (z) o.onDrop(id, z); };
        if (still()) finish(); else setTimeout(finish, 480);
      };
      addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end);
    });
  };

  window.KF = { lift, pop, drag };
})();
