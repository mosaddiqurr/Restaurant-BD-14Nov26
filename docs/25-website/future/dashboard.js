/* khabo owner dashboard prototype (PRD RD-1 to RD-4). One page, tabs in the hash, no backend. */
(function () {
  'use strict';
  const F = window.F; if (!F) return;
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = F.esc, ico = F.ico, L = F.L;
  const view = $('#view');
  const qs = new URLSearchParams(location.search);
  let rid = qs.get('r');
  if (!F.r(rid)) rid = F.store.get('dash.rid', 'shahi-handi');
  if (!F.r(rid)) rid = F.all()[0].id;
  const preview = {}; // starter accounts can preview paid sections in this session
  const TABS = [['report', 'Monthly report', 'chart-line-up'], ['prices', 'Price insights', 'tag'], ['menu', 'Menu', 'receipt'], ['deals', 'Deals', 'gift'], ['reviews', 'Reviews', 'chats-circle']];
  const owner = () => `${L(F.r(rid).name)} (owner)`;
  const empty = (icon, title, text, action = '') => `<div class="empty"><div class="em-ic">${ico(icon)}</div><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ''}${action}</div>`;
  const paid = r => r.plan !== 'starter';

  /* ---------- switcher, header, tabs ---------- */
  $('#rsw').innerHTML = F.all().map(r => `<option value="${r.id}">${esc(L(r.name))}</option>`).join('');
  $('#rsw').value = rid;
  $('#rsw').onchange = e => { rid = e.target.value; F.store.set('dash.rid', rid); history.replaceState(null, '', `?r=${rid}${location.hash || '#report'}`); render(); };

  const tabOf = () => { const t = location.hash.replace(/^#\/?/, ''); return TABS.some(x => x[0] === t) ? t : 'report'; };
  function render() {
    const r = F.r(rid), tab = tabOf();
    F.store.set('dash.rid', rid);
    const pend = F.reviews().filter(x => x.r === rid && x.status === 'published' && !x.reply).length;
    $('#who').innerHTML = `${F.mono(r, 'lg')}<div><h1>${esc(L(r.name))}</h1><div class="meta"><span>${esc(F.where(r))}</span><span class="tag indigo">${F.plan(r.plan)} plan</span>${r.founding ? '<span class="tag gold">Founding Partner</span>' : ''}</div></div>
      <a class="btn" href="${F.pageUrl(r.id)}" target="_blank" rel="noopener">${ico('arrow-up-right')}View your page</a>`;
    $('#tabs').innerHTML = TABS.map(t => `<a href="#${t[0]}" class="${tab === t[0] ? 'on' : ''}" ${tab === t[0] ? 'aria-current="page"' : ''}>${ico(t[2])}${t[1]}${t[0] === 'reviews' && pend ? ` <span class="count">${pend}</span>` : ''}</a>`).join('');
    document.title = `${TABS.find(t => t[0] === tab)[1]} · ${L(r.name)} · khabo for restaurants`;
    ({ report: vReport, prices: vPrices, menu: vMenu, deals: vDeals, reviews: vReviews })[tab](r);
  }
  window.addEventListener('hashchange', () => { render(); view.focus({ preventScroll: true }); });

  /* ---------- sample numbers for the report (deterministic per restaurant and month) ---------- */
  function sample(r) {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth(), days = now.getDate();
    const rnd = F.rng(r.id + ':' + y + '-' + m);
    const perDay = r.reviews * (0.45 + rnd() * 0.25), qrDay = r.seats * (0.22 + rnd() * 0.16);
    const daily = [];
    for (let d = 1; d <= days; d++) {
      const wd = new Date(y, m, d).getDay(), wk = wd === 5 || wd === 6 ? 1.35 : 1;
      daily.push({ d, wd, v: Math.round((perDay + qrDay) * wk * (0.8 + rnd() * 0.4)) });
    }
    const views = daily.reduce((s, x) => s + x.v, 0);
    const qr = Math.round(qrDay * days * (0.9 + rnd() * 0.2));
    const calls = Math.round(views * (0.022 + rnd() * 0.018)), dirs = Math.round(views * (0.035 + rnd() * 0.03));
    const prev = k => Math.round(k * (0.78 + rnd() * 0.36));
    const rest = views - qr, sAI = Math.round(rest * (0.09 + rnd() * 0.06)), sShare = Math.round(rest * (0.1 + rnd() * 0.08));
    const sources = [['Search on khabo', rest - sAI - sShare], ['Table QR cards', qr], ['Shared links', sShare], ['AI assistant', sAI]];
    const menu = F.menu(r.id);
    const w = menu.map(d => ({ d, w: (d.best ? 2.2 : 1) * ((r.signature || []).includes(d.id) ? 1.6 : 1) * (d.p ? 1.3 : 1) * (0.5 + rnd()) }));
    w.sort((a, b) => b.w - a.w);
    const dishViews = Math.round(views * 0.62), tw = w.reduce((s, x) => s + x.w, 0);
    const top = w.slice(0, 5).map(x => ({ d: x.d, v: Math.round(dishViews * x.w / tw) }));
    return { days, daily, views, qr, calls, dirs, pv: prev(views), pqr: prev(qr), pcalls: prev(calls), pdirs: prev(dirs), sources, top, month: F.month(), monthPrev: F.month(new Date(y, m - 1, 1).getTime()) };
  }
  const delta = (a, b) => { if (!b) return ''; const p = Math.round((a - b) / b * 100); return p === 0 ? 'Same as' : `${p > 0 ? 'Up' : 'Down'} ${Math.abs(p)}% on`; };

  function barChart(daily, width) {
    const W = Math.max(260, Math.round(width || 640)), H = 170, padL = 34, padB = 22, padT = 8, n = daily.length;
    const max = Math.max(...daily.map(x => x.v)), step = Math.pow(10, Math.floor(Math.log10(max))) / 2;
    const top = Math.ceil(max / step) * step || 1, plotW = W - padL, plotH = H - padB - padT;
    const bw = Math.max(4, Math.min(22, plotW / n - 4)), gap = (plotW - bw * n) / n;
    const yOf = v => padT + plotH - v / top * plotH;
    const ticks = [0, top / 2, top];
    const bar = (x, y, w, h) => { const r = Math.min(4, w / 2, h); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; };
    return `<div class="chart" id="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Page views per day this month">
      <g class="grid">${ticks.map(t => `<line x1="${padL}" x2="${W}" y1="${yOf(t)}" y2="${yOf(t)}"/><text x="${padL - 8}" y="${yOf(t) + 4}" text-anchor="end">${F.n(t)}</text>`).join('')}</g>
      ${daily.map((x, i) => { const bx = padL + gap / 2 + i * (bw + gap), by = yOf(x.v); return `<path class="bar" data-i="${i}" d="${bar(bx, by, bw, padT + plotH - by)}"/><rect x="${bx - gap / 2}" y="${padT}" width="${bw + gap}" height="${plotH}" fill="transparent" data-i="${i}"/>`; }).join('')}
      ${daily.filter((x, i) => i === 0 || (i + 1) % 7 === 0 || i === n - 1).map(x => { const i = x.d - 1; return `<text x="${padL + gap / 2 + i * (bw + gap) + bw / 2}" y="${H - 6}" text-anchor="middle">${x.d}</text>`; }).join('')}
    </svg><div class="tip" hidden></div></div>`;
  }
  function bindChart(daily, monthName) {
    const c = $('#chart'); if (!c) return;
    const tip = $('.tip', c), svg = $('svg', c);
    const DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hide = () => { tip.hidden = true; $$('.bar.hl', c).forEach(b => b.classList.remove('hl')); };
    svg.addEventListener('mousemove', e => {
      const t = e.target.closest('[data-i]'); if (!t) return hide();
      const i = +t.dataset.i, x = daily[i], bar = $(`.bar[data-i="${i}"]`, c);
      $$('.bar.hl', c).forEach(b => b !== bar && b.classList.remove('hl')); bar.classList.add('hl');
      const bb = bar.getBoundingClientRect(), cb = c.getBoundingClientRect();
      tip.innerHTML = `${DN[x.wd]} ${x.d} ${monthName.split(' ')[0]}: <b>${F.n(x.v)}</b> views`;
      tip.style.left = (bb.left - cb.left + bb.width / 2) + 'px'; tip.style.top = (bb.top - cb.top) + 'px'; tip.hidden = false;
    });
    svg.addEventListener('mouseleave', hide);
  }

  /* ---------- price comparison (real demo menus) ---------- */
  function insights(r) {
    const others = F.all().filter(o => o.id !== r.id && o.city === r.city);
    const peersAll = others.flatMap(o => F.menu(o.id).map(d => ({ r: o, d, pp: F.perPerson(d) })));
    return F.menu(r.id).filter(d => d.type).map(d => {
      const peers = peersAll.filter(p => p.d.type === d.type).sort((a, b) => a.pp - b.pp);
      const you = F.perPerson(d), pps = peers.map(p => p.pp), med = F.median(pps);
      const all = pps.concat(you), mixed = pps.length > 0 && Math.max(...all) / Math.min(...all) >= 3; // e.g. one shami kabab vs a plate of four skewers
      return { d, you, peers, med, mixed, min: pps.length ? Math.min(...pps) : null, max: pps.length ? Math.max(...pps) : null, diff: med == null ? null : you - med, pct: med ? (you - med) / med : null };
    });
  }
  const por = d => d.por ? L(d.por) : '';
  const posText = x => {
    if (x.med == null) return '';
    if (x.mixed) return '<span class="tag" title="Prices in this group range more than three times, so the median is not a fair guide">Portions vary</span>';
    if (Math.abs(x.pct) < 0.05) return '<span class="tag">Close to median</span>';
    return `<span class="tag line">${x.diff > 0 ? '+' : '-'}${F.tk(Math.abs(x.diff))} (${Math.round(Math.abs(x.pct) * 100)}% ${x.diff > 0 ? 'above' : 'below'})</span>`;
  };
  function rangeSvg(x) {
    const W = 160, H = 22, pad = 6, lo = Math.min(x.min, x.you), hi = Math.max(x.max, x.you), span = hi - lo || 1;
    const sx = v => pad + (v - lo) / span * (W - pad * 2);
    return `<span class="range"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Your price ${F.tk(x.you)}, others from ${F.tk(x.min)} to ${F.tk(x.max)}, median ${F.tk(x.med)}">
      <line x1="${sx(x.min)}" x2="${sx(x.max)}" y1="11" y2="11" stroke="rgba(14,18,48,.16)" stroke-width="2" stroke-linecap="round"/>
      ${x.peers.map(p => `<circle cx="${sx(p.pp)}" cy="11" r="3" fill="#B4B9D3"><title>${esc(L(p.r.name))}: ${F.tk(p.pp)}</title></circle>`).join('')}
      <line x1="${sx(x.med)}" x2="${sx(x.med)}" y1="4" y2="18" stroke="#62688A" stroke-width="1.5"><title>Median ${F.tk(x.med)}</title></line>
      <circle cx="${sx(x.you)}" cy="11" r="5.5" fill="#2A3DB8" stroke="#fff" stroke-width="2"><title>You: ${F.tk(x.you)}</title></circle></svg></span>`;
  }

  /* =====================================================================
     Monthly report (RD-1, with RD-2 summary)
     ===================================================================== */
  function vReport(r) {
    const s = sample(r);
    const kpi = (label, icon, v, p) => `<div class="card kpi"><div class="k-l">${ico(icon, 'sm')}${label}</div><div class="k-v">${F.n(v)}</div><div class="k-d">${delta(v, p)} the same days in ${esc(s.monthPrev.split(' ')[0])}</div></div>`;
    const totalSrc = s.sources.reduce((a, x) => a + x[1], 0), maxTop = Math.max(...s.top.map(x => x.v));
    const ins = insights(r).filter(x => x.med != null && !x.mixed).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 3);
    view.innerHTML = `
      <div class="sec-h"><div><h2>${esc(s.month)} so far</h2><p>1 to ${s.days} ${esc(s.month.split(' ')[0])}, compared with the same days last month.</p></div>
        <div class="row"><button class="btn" data-act="copy">${ico('whatsapp-logo')}Copy for WhatsApp</button><button class="btn" data-act="print">${ico('printer')}Save as PDF</button></div></div>
      <div class="note gold" style="margin-bottom:16px">${ico('info')}<span><b>Sample numbers.</b> The real report counts visits to your page and scans of your table QR cards. These numbers are made up so you can see the layout.</span></div>
      <div class="kpis" style="margin-bottom:16px">${kpi('Page views', 'eye', s.views, s.pv)}${kpi('QR menu scans', 'qr-code', s.qr, s.pqr)}${kpi('Call taps', 'phone', s.calls, s.pcalls)}${kpi('Directions taps', 'navigation-arrow', s.dirs, s.pdirs)}</div>
      <div class="g2" style="margin-bottom:16px">
        <div class="card"><div class="card-h"><h3>Page views per day</h3><span class="sample">Sample</span></div><div class="card-b">${barChart(s.daily)}</div></div>
        <div class="card"><div class="card-h"><h3>Where visitors came from</h3><span class="sample">Sample</span></div><div class="card-b" style="padding-top:8px;padding-bottom:8px">
          ${s.sources.map(x => `<div class="src-row"><span>${x[0]}</span><div class="hbar"><i style="width:${(x[1] / totalSrc * 100).toFixed(1)}%"></i></div><span class="num">${Math.round(x[1] / totalSrc * 100)}%</span></div>`).join('')}
        </div></div></div>
      <div class="g2 even">
        <div class="card"><div class="card-h"><h3>Top 5 dishes viewed</h3><span class="sample">Sample</span></div>
          ${s.top.map((x, i) => `<div class="top-row"><span class="rank">${i + 1}</span>${F.thumb(x.d.p)}<div style="min-width:0"><b style="font-weight:600">${esc(L(x.d.name))}</b><span class="sub">${F.tk(x.d.price)}${x.d.soldOut ? ', sold out now' : ''}</span></div><div class="hbar"><i style="width:${(x.v / maxTop * 100).toFixed(1)}%"></i></div><span class="num">${F.n(x.v)}</span></div>`).join('')}</div>
        <div class="card"><div class="card-h"><h3>Your prices against ${esc(L(F.city(r.city)))}</h3>${paid(r) ? '' : '<span class="tag">Pro</span>'}</div>
          ${!paid(r) && !preview[rid] ? `<div class="card-b"><p class="ink2">Price insights compare your dishes with other restaurants in ${esc(L(F.city(r.city)))}. They come with the Pro and Premium plans.</p><p style="margin-top:12px"><a href="#prices">See a preview</a></p></div>`
            : ins.length ? `<div class="ins-list">${ins.map(x => `<div><span style="flex:1"><b style="font-weight:600">${esc(L(x.d.name))}</b> at ${F.tk(x.you)}${x.d.share ? ' per person' : ''}. ${esc(L(F.city(r.city)))} median ${F.tk(x.med)}.</span>${posText(x)}</div>`).join('')}</div><div class="card-b" style="border-top:1px solid var(--line)"><a href="#prices">See all dishes</a></div>`
              : `<div class="card-b muted">No other restaurant in ${esc(L(F.city(r.city)))} lists the same dishes yet.</div>`}
        </div></div>`;
    const fit = () => { const c = $('#chart'); if (!c) return; c.outerHTML = barChart(s.daily, c.clientWidth); bindChart(s.daily, s.month); };
    fit();
    let rt; window.onresize = () => { clearTimeout(rt); rt = setTimeout(() => { if (tabOf() === 'report') fit(); }, 150); };
    view.onclick = e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'print') window.print();
      if (a.dataset.act === 'copy') {
        const txt = `${L(r.name)}, ${s.month} so far (sample numbers)\nPage views: ${F.n(s.views)}\nQR menu scans: ${F.n(s.qr)}\nCall taps: ${F.n(s.calls)}\nDirections taps: ${F.n(s.dirs)}\nTop dish: ${L(s.top[0].d.name)}`;
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => F.toast('Summary copied. Paste it into WhatsApp.'), () => F.toast('Could not copy in this browser'));
      }
    };
  }

  /* =====================================================================
     Price insights (RD-2), from the demo menus
     ===================================================================== */
  function gate(r, what, sub, icon) {
    view.innerHTML = `<div class="card gate">${empty(icon, `${what} come with Pro`, `${sub} You are on Starter. Talk to your khabo contact to upgrade.`,
      `<div class="row" style="justify-content:center;margin-top:8px"><button class="btn primary" data-act="preview">Preview with your data</button></div>`)}</div>`;
    view.onclick = e => { if (e.target.closest('[data-act="preview"]')) { preview[rid] = true; render(); } };
  }
  function vPrices(r) {
    if (!paid(r) && !preview[rid]) return gate(r, 'Price insights', `See how your prices compare with the same dishes at other restaurants in ${esc(L(F.city(r.city)))}.`, 'tag');
    const rows = insights(r), cmp = rows.filter(x => x.med != null), none = rows.filter(x => x.med == null), fair = cmp.filter(x => !x.mixed);
    const above = fair.filter(x => x.pct >= 0.05).length, below = fair.filter(x => x.pct <= -0.05).length, close = fair.length - above - below;
    const city = L(F.city(r.city));
    view.innerHTML = `
      <div class="sec-h"><div><h2>Price insights</h2><p>Each dish compared per person with dishes of the same type at other ${esc(city)} restaurants on khabo. Sharing dishes are divided by the number of people they serve.</p></div></div>
      ${!paid(r) ? `<div class="note" style="margin-bottom:16px">${ico('info')}<span>Preview. Price insights are part of Pro and Premium.</span></div>` : ''}
      <div class="kpis" style="margin-bottom:16px">
        <div class="card kpi"><div class="k-l">Above the median</div><div class="k-v">${above}</div><div class="k-d">dishes 5% or more above</div></div>
        <div class="card kpi"><div class="k-l">Close to the median</div><div class="k-v">${close}</div><div class="k-d">within 5%</div></div>
        <div class="card kpi"><div class="k-l">Below the median</div><div class="k-v">${below}</div><div class="k-d">dishes 5% or more below</div></div>
        <div class="card kpi"><div class="k-l">Hard to compare</div><div class="k-v">${none.length + cmp.length - fair.length}</div><div class="k-d">portions vary or no similar dish</div></div></div>
      ${cmp.length ? `<div class="card tbl-wrap" style="margin-bottom:16px"><table class="tbl"><thead><tr><th>Your dish</th><th class="num">You, per person</th><th class="num">${esc(city)} median</th><th>Range</th><th>Against median</th><th class="num">Others</th><th><span class="sr">Expand</span></th></tr></thead><tbody>
        ${cmp.map((x, i) => `<tr class="exp" data-i="${i}" tabindex="0" aria-expanded="false"><td><b style="font-weight:600">${esc(L(x.d.name))}</b><span class="sub">${esc(L(F.type(x.d.type)))}, ${x.d.share ? `${F.tk(x.d.price)} serves ${x.d.share}` : esc(por(x.d))}</span></td>
          <td class="num"><b>${F.tk(x.you)}</b></td><td class="num">${F.tk(x.med)}</td><td>${rangeSvg(x)}</td><td>${posText(x)}</td><td class="num">${x.peers.length}</td><td class="num">${ico('caret-down', 'sm caret')}</td></tr>
          ${x.peers.map(p => `<tr class="peer" data-of="${i}" hidden><td colspan="2" style="padding-left:28px">${esc(L(p.d.name))} <span class="muted">${p.d.share ? `${F.tk(p.d.price)} serves ${p.d.share}` : esc(por(p.d))}</span></td><td class="num">${F.tk(p.pp)}</td><td colspan="4"><a href="${F.pageUrl(p.r.id)}" target="_blank" rel="noopener">${esc(L(p.r.name))}</a> <span class="muted">${esc(L(F.area(p.r.area)))}</span></td></tr>`).join('')}`).join('')}
        </tbody></table></div>` : ''}
      ${none.length ? `<div class="card"><div class="card-h"><h3>No comparison yet</h3></div><div class="card-b ink2">No other ${esc(city)} restaurant on khabo lists ${none.map(x => esc(L(F.type(x.d.type)).toLowerCase())).filter((v, i, a) => a.indexOf(v) === i).join(', ')} yet. These dishes will be compared as more restaurants join: ${none.map(x => esc(L(x.d.name))).join(', ')}.</div></div>` : ''}
      <p class="small muted" style="margin-top:12px">Prices come from the menus on khabo, including any change made today. The median is the middle price, so one very cheap or very expensive place does not move it much. When prices in a group differ by more than three times, such as one shami kabab against a plate of four skewers, you see "Portions vary" instead of a percentage. Open a row to see every dish it was compared with.</p>`;
    const toggle = tr => { const open = !tr.classList.contains('open'); tr.classList.toggle('open', open); tr.setAttribute('aria-expanded', open); $$(`tr.peer[data-of="${tr.dataset.i}"]`).forEach(p => p.hidden = !open); };
    view.onclick = e => { const tr = e.target.closest('tr.exp'); if (tr && !e.target.closest('a')) toggle(tr); };
    view.onkeydown = e => { const tr = e.target.closest('tr.exp'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(tr); } };
  }

  /* =====================================================================
     Menu editor with sold-out toggles (RD-3)
     ===================================================================== */
  function vMenu(r) {
    view.onclick = null; view.onkeydown = null;
    const menu = F.menu(r.id), so = menu.filter(d => d.soldOut).length;
    view.innerHTML = `
      <div class="sec-h"><div><h2>Menu</h2><p>Change a price and press Enter. Turn on Sold out when a dish runs out today. Your page updates straight away and khabo keeps a record of every price change.</p></div>
        <div class="row so-bar"><span class="small muted" id="socount">${so ? `${so} sold out` : 'Nothing sold out'}</span><button class="btn" data-act="clear-so" ${so ? '' : 'disabled'}>Clear all sold out</button></div></div>
      <div class="card tbl-wrap"><table class="tbl menu-tbl"><thead><tr><th>Dish</th><th class="num">Price</th><th>Sold out</th></tr></thead><tbody id="mrows">
      ${r.cats.map(c => { const ds = menu.filter(d => d.cat === c.id); return ds.length ? `<tr class="group"><td colspan="3">${esc(L(c))} <span class="count">${ds.length}</span></td></tr>${ds.map(d => `<tr data-did="${esc(d.id)}" class="${d.soldOut ? 'off' : ''}">
        <td><div class="cell-r">${F.thumb(d.p)}<div><span class="dname">${esc(L(d.name))}</span>${d.name.bn ? `<span class="sub bn">${esc(d.name.bn)}</span>` : ''}</div></div></td>
        <td class="num"><label class="money"><span class="sr">Price of ${esc(L(d.name))}</span><input class="input sm" inputmode="numeric" autocomplete="off" value="${d.price}" data-price></label></td>
        <td><label class="switch so"><input type="checkbox" data-so ${d.soldOut ? 'checked' : ''}><span class="tr"></span><span>${d.soldOut ? 'Sold out' : 'Available'}</span></label></td></tr>`).join('')}` : ''; }).join('')}
      </tbody></table></div>
      <p class="small muted" style="margin-top:12px">Need to add or remove a dish, or change photos? Send it to your khabo contact on WhatsApp. ${r.plan === 'premium' ? 'Premium gets same-day changes.' : ''}</p>`;
    const tb = $('#mrows');
    const count = () => { const n = F.menu(r.id).filter(d => d.soldOut).length; $('#socount').textContent = n ? `${n} sold out` : 'Nothing sold out'; $('[data-act="clear-so"]').disabled = !n; };
    tb.addEventListener('input', e => { if (e.target.matches('[data-price]')) { const d = F.dish(r.id, e.target.closest('tr').dataset.did); e.target.classList.toggle('changed', String(d.price) !== e.target.value.trim()); } });
    tb.addEventListener('keydown', e => {
      if (!e.target.matches('[data-price]')) return;
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Escape') { e.target.value = F.dish(r.id, e.target.closest('tr').dataset.did).price; e.target.classList.remove('changed'); e.target.blur(); }
    });
    tb.addEventListener('change', async e => {
      const tr = e.target.closest('tr'), did = tr.dataset.did, d = F.dish(r.id, did);
      if (e.target.matches('[data-so]')) {
        F.setSoldOut(r.id, did, e.target.checked); tr.classList.toggle('off', e.target.checked);
        e.target.parentElement.lastElementChild.textContent = e.target.checked ? 'Sold out' : 'Available'; count();
        F.toast(e.target.checked ? `${L(d.name)} shows as sold out` : `${L(d.name)} is available again`);
        return;
      }
      if (!e.target.matches('[data-price]')) return;
      const inp = e.target, raw = F.bnDigits(inp.value).replace(/[৳,\s]/g, ''), v = Math.round(Number(raw));
      const revert = () => { inp.value = d.price; inp.classList.remove('changed'); };
      if (raw === '' || !Number.isFinite(v) || v <= 0) { revert(); F.toast('Enter a price above ৳0'); return; }
      if (v === d.price) return revert();
      const pct = Math.abs(v - d.price) / d.price;
      if (pct >= 0.5 && !(await F.confirm('Check this price', `${L(d.name)} would change from ${F.tk(d.price)} to ${F.tk(v)}. That is a ${Math.round(pct * 100)}% change. Is that right?`, 'Yes, save'))) return revert();
      const from = d.price;
      F.setPrice(r.id, did, v, { by: owner(), source: 'Owner dashboard' }); inp.value = v; inp.classList.remove('changed');
      F.toast(`${L(d.name)} is now ${F.tk(v)}`, { label: 'Undo', run: () => { F.setPrice(r.id, did, from, { by: owner(), source: 'Owner dashboard (undo)' }); inp.value = from; } });
    });
    view.onclick = e => {
      if (!e.target.closest('[data-act="clear-so"]')) return;
      F.menu(r.id).filter(d => d.soldOut).forEach(d => F.setSoldOut(r.id, d.id, false)); vMenu(r); F.toast('Every dish is available again');
    };
  }

  /* =====================================================================
     Deals manager (RD-4)
     ===================================================================== */
  function vDeals(r) {
    if (!paid(r) && !preview[rid]) return gate(r, 'Deals', 'Put a deal on your page and in the Deals list that diners browse.', 'gift');
    const list = F.deals(r.id), dotw = F.dotw()[r.city] === r.id;
    const st = d => d.status === 'paused' ? '<span class="tag">Paused</span>' : d.end && new Date(d.end + 'T23:59:59') < new Date() ? '<span class="tag">Ended</span>' : d.start && new Date(d.start + 'T00:00:00') > new Date() ? '<span class="tag indigo">Scheduled</span>' : '<span class="tag green">Live</span>';
    const dates = d => d.start || d.end ? `${d.start ? F.dateShort(new Date(d.start + 'T00:00:00')) : 'Now'} to ${d.end ? F.date(new Date(d.end + 'T00:00:00')) : 'no end date'}` : 'No end date';
    view.innerHTML = `
      <div class="sec-h"><div><h2>Deals</h2><p>Deals show on your page and in the Deals list. Diners see the deal price next to the usual price.</p></div>
        <div class="row"><button class="btn primary" data-act="new">${ico('plus')}New deal</button></div></div>
      ${!paid(r) ? `<div class="note" style="margin-bottom:16px">${ico('info')}<span>Preview. Deals are part of Pro and Premium.</span></div>` : ''}
      ${dotw ? `<div class="note gold" style="margin-bottom:16px">${ico('star')}<span>Your deal is the Deal of the Week in ${esc(L(F.city(r.city)))} this week.</span></div>` : ''}
      <div class="card">${list.length ? list.map(d => `<div class="deal ${d.status === 'paused' ? 'paused' : ''}" data-id="${esc(d.id)}">
          ${d.p ? `<img class="dimg" src="${F.src(d.p, 200)}" alt="" loading="lazy">` : `<span class="dimg none">${ico('gift', 'lg')}</span>`}
          <div style="min-width:0"><div class="row wrap"><b style="font-weight:650">${esc(d.title)}</b>${st(d)}</div>
            <div class="ink2 small" style="margin-top:2px">${esc(d.desc)}</div>
            <div style="margin-top:6px"><span class="price">${F.tk(d.price)}<s>${F.tk(d.was)}</s></span> <span class="small muted">saves ${F.tk(d.was - d.price)}</span></div>
            <div class="small muted" style="margin-top:2px">${esc(d.when)}. ${dates(d)}</div></div>
          <div class="deal-a"><button class="btn sm" data-act="edit">Edit</button><button class="btn sm" data-act="toggle">${d.status === 'paused' ? 'Resume' : 'Pause'}</button><button class="btn sm ghost danger" data-act="del">Delete</button></div></div>`).join('')
        : empty('gift', 'No deals yet', 'A deal is a simple offer such as a family set or a weekday lunch price. It shows on your page and in the Deals list.', '<button class="btn primary" data-act="new">Create a deal</button>')}</div>`;
    view.onclick = async e => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const id = a.closest('[data-id]') && a.closest('[data-id]').dataset.id, all = F.deals(r.id), d = all.find(x => x.id === id);
      if (a.dataset.act === 'new') dealForm(r, null);
      if (a.dataset.act === 'edit') dealForm(r, d);
      if (a.dataset.act === 'toggle') { d.status = d.status === 'paused' ? 'active' : 'paused'; F.saveDeals(r.id, all); vDeals(r); F.toast(d.status === 'paused' ? 'Deal paused. It is hidden from diners.' : 'Deal is live again'); }
      if (a.dataset.act === 'del' && await F.confirm('Delete deal', `Delete "${d.title}"? Diners will no longer see it.`, 'Delete deal', true)) { F.saveDeals(r.id, all.filter(x => x.id !== id)); vDeals(r); F.toast('Deal deleted'); }
    };
  }
  function dealForm(r, d) {
    const x = d || { id: '', title: '', desc: '', when: '', price: '', was: '', start: '', end: '', status: 'active', p: null };
    const m = F.modal({
      title: d ? 'Edit deal' : 'New deal',
      body: `<label class="field"><span>Deal name</span><input class="input" name="title" maxlength="60" value="${esc(x.title)}" placeholder="Family set for 4"></label>
        <label class="field"><span>What is included</span><textarea class="input" name="desc" rows="2" maxlength="160" placeholder="Kacchi for 4, 4 borhani and 4 firni">${esc(x.desc)}</textarea></label>
        <label class="field"><span>When it applies</span><input class="input" name="when" maxlength="60" value="${esc(x.when)}" placeholder="Sunday to Thursday, lunch only"></label>
        <div class="row wrap" style="gap:12px">
          <label class="field"><span>Deal price</span><span class="money"><input class="input" name="price" inputmode="numeric" value="${esc(x.price)}" style="width:130px"></span></label>
          <label class="field"><span>Usual price</span><span class="money"><input class="input" name="was" inputmode="numeric" value="${esc(x.was)}" style="width:130px"></span></label></div>
        <div class="row wrap" style="gap:12px">
          <label class="field"><span>Starts <span class="hint">(optional)</span></span><input class="input" type="date" name="start" value="${esc(x.start)}"></label>
          <label class="field"><span>Ends <span class="hint">(optional)</span></span><input class="input" type="date" name="end" value="${esc(x.end)}"></label></div>
        <p class="err" id="derr" hidden></p>`,
      foot: `<button class="btn" type="button" data-cancel>Cancel</button><button class="btn primary" type="button" data-save>${d ? 'Save deal' : 'Publish deal'}</button>`
    });
    const el = m.el, val = n => el.querySelector(`[name="${n}"]`).value.trim(), err = $('#derr', el);
    $('[data-cancel]', el).onclick = m.close;
    $('[data-save]', el).onclick = () => {
      const num = n => Math.round(Number(F.bnDigits(val(n)).replace(/[৳,\s]/g, '')));
      const o = { title: val('title'), desc: val('desc'), when: val('when') || 'Every day', price: num('price'), was: num('was'), start: val('start'), end: val('end') };
      const bad = !o.title ? 'Give the deal a name.' : !(o.price > 0) ? 'Enter the deal price.' : !(o.was > 0) ? 'Enter the usual price so diners can see the saving.' : o.price >= o.was ? 'The deal price should be lower than the usual price.' : o.start && o.end && o.end < o.start ? 'The end date is before the start date.' : '';
      if (bad) { err.textContent = bad; err.hidden = false; return; }
      const all = F.deals(r.id);
      if (d) Object.assign(all.find(y => y.id === d.id), o); else all.unshift(Object.assign({ id: 'deal-' + Date.now().toString(36), status: 'active', p: null }, o));
      F.saveDeals(r.id, all); m.close(); vDeals(r); F.toast(d ? 'Deal saved' : 'Deal published on your page');
    };
  }

  /* =====================================================================
     Review replies (RD-4)
     ===================================================================== */
  let rvFilter = 'all';
  function vReviews(r) {
    const all = F.reviews().filter(x => x.r === r.id), pub = all.filter(x => x.status === 'published'), waiting = all.filter(x => x.status === 'pending').length;
    const need = pub.filter(x => !x.reply), done = pub.filter(x => x.reply);
    const list = rvFilter === 'need' ? need : rvFilter === 'done' ? done : pub;
    view.innerHTML = `
      <div class="sec-h"><div><h2>Reviews</h2><p>${r.rating.toFixed(1)} out of 5 from ${F.n(r.reviews)} reviews, ${F.n(r.verified)} from verified visits. ${waiting ? `${waiting} new review${waiting > 1 ? 's are' : ' is'} being checked by the khabo team.` : 'New reviews are checked by the khabo team before they appear.'}</p></div></div>
      <div class="tabs" style="margin-bottom:16px">${[['all', 'All', pub.length], ['need', 'Needs a reply', need.length], ['done', 'Replied', done.length]].map(t => `<button data-f="${t[0]}" class="${rvFilter === t[0] ? 'on' : ''}">${t[1]} <span class="count">${t[2]}</span></button>`).join('')}</div>
      <div class="card">${list.length ? list.map(x => {
        const bn = /[ঀ-৿]/.test(x.t);
        return `<div class="rv" data-id="${x.id}"><div class="rv-h"><b>${esc(x.who)}</b>${F.stars(x.st)}<span class="small muted">${esc(F.ago(x.at))}</span>${x.vf ? `<span class="tag green">${ico('seal-check', 'sm')}Verified visit</span>` : ''}</div>
          <p class="rv-t ${bn ? 'bn' : ''}">${esc(x.t)}</p>${x.ord.length ? `<p class="small muted">Ordered: ${x.ord.map(esc).join(', ')}</p>` : ''}
          ${x.reply ? `<div class="rv-reply"><b>Your reply</b><p>${esc(x.reply)}</p></div>` : ''}
          <div class="row"><button class="btn sm ${x.reply ? 'ghost' : ''}" data-act="reply">${x.reply ? 'Edit reply' : 'Reply'}</button></div><div class="rv-x" hidden></div></div>`;
      }).join('') : empty('chats-circle', rvFilter === 'need' ? 'All caught up' : 'No reviews here', rvFilter === 'need' ? 'Every review has a reply.' : 'Reviews from diners will show up here once they are approved.')}</div>`;
    view.onclick = e => {
      const f = e.target.closest('[data-f]'); if (f) { rvFilter = f.dataset.f; return vReviews(r); }
      const a = e.target.closest('[data-act]'); if (!a) return;
      const box = a.closest('.rv') && $('.rv-x', a.closest('.rv')), id = a.closest('.rv') && a.closest('.rv').dataset.id, x = all.find(y => y.id === id);
      if (a.dataset.act === 'reply') {
        box.hidden = false;
        box.innerHTML = `<label class="field"><span>Your reply</span><textarea class="input" rows="3" maxlength="600" data-reply placeholder="Thank you for coming...">${esc(x.reply)}</textarea><span class="hint">Replies are public. Keep it short and polite. Thank the diner and answer any problem they raise.</span></label>
          <div class="row"><button class="btn sm primary" data-act="post">Post reply</button><button class="btn sm ghost" data-act="cancel">Cancel</button></div>`;
        $('textarea', box).focus();
      }
      if (a.dataset.act === 'cancel') { box.hidden = true; box.innerHTML = ''; }
      if (a.dataset.act === 'post') {
        const t = $('[data-reply]', box).value.trim(); if (!t) { F.toast('Write a reply first'); return; }
        F.setReview(id, { reply: t, replyAt: Date.now(), replyBy: owner() }); render(); F.toast('Reply posted on your page');
      }
    };
  }

  if (!location.hash) history.replaceState(null, '', `?r=${rid}#report`);
  render();
})();
