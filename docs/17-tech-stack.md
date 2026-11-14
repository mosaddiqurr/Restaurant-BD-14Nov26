# Tech Stack (Decision Record)

**Status:** ✅ Decided by the founders on 13 Nov 2026.
The detailed System Architecture document and CLAUDE.md follow after the design direction is chosen.

---

## 1. The stack

```
Diner's phone / computer
        ↓
Cloudflare: domain, SSL (HTTPS), DDoS protection, firewall, bot protection (Turnstile)
        ↓
Website: Next.js (React), hosted on InsForge Sites
        ↓
InsForge Pro: PostgreSQL database, login, file storage, server functions, security rules
        ↓
Cloudflare R2: photos, videos, 360° and 3D files
        +
Claude API: AI assistant (reads only from our database)
```

| Layer | Choice | Why |
|---|---|---|
| Website framework | **Next.js (React, TypeScript)** | Best for a premium, animated, fast, SEO-friendly site; largest component ecosystem (e.g. 21st.dev); easy path to a native app later |
| Website hosting | **InsForge Sites** | One provider and one bill; no separate Vercel account needed |
| Backend | **InsForge Pro** | Database, login, storage and functions in one place; least setup; Claude can manage it directly |
| Database | **PostgreSQL** (inside InsForge) | Strong for price history, reports and search; portable if we ever move |
| Security & domain | **Cloudflare** | DDoS protection, firewall, SSL, bot protection; fast in Bangladesh |
| Media storage | **Cloudflare R2** | Very cheap storage (~$0.015/GB/month); suits photos, videos, 3D |
| 3D / 360° / motion | **Three.js** (360° tours and 3D dish viewer; used in the final design prototype, r160) · `<model-viewer>` for real 3D dish captures (GLB, with AR on phones) · CSS motion first, **Motion** (`motion/react`) only where needed | Proven, browser-only, no app needed. Three.js loads only on pages with 3D, after the page is ready |
| Page transitions & motion | The browser's **View Transitions API** + CSS, kept in one shared layer (`motion.css`, `motion.js` in the prototype). Each page style has its own move: pages slide up or back, a restaurant photo grows out of its card and shrinks back on Back, list cards slide when filters change, a dish category swaps its plate | No library to download. Browsers without View Transitions simply swap pages. Everything turns off under "reduce motion". Moves use only `transform`, `opacity` and `clip-path`, so they stay smooth on cheap Android phones |
| Fonts | **Figtree** + **Noto Sans Bengali**, self-hosted with `next/font` | Variable fonts (one file per script); Noto Sans Bengali matches the Android system Bangla font |
| Icons | **Phosphor Icons** (`@phosphor-icons/react`) | One family, regular + fill weights |
| Maps | **Leaflet 1.9** + map tiles (provider open, see decision 5.6) | Small, free, works on low-end phones; loads only when the map scrolls into view. Pins come from `BRANCH.lat/lng`; labels de-overlap, and pins cluster by area above 60 per view |
| QR codes | **qrcode-generator** for the code + our own SVG renderer for branded styles (logo, colours, shapes) | One renderer for screen and print, so table cards and the PDF menu always match. Each style is checked by reading every square back from the rendered image; cards are also test-scanned on real phones before printing |
| Media delivery | Cloudflare R2 + Cloudflare Images (resizing) · video as short MP4/HLS with poster frames | Small images on phones; video only plays when asked (autoplay on laptops only, never on data saver) |
| AI assistant | **Claude API**: Haiku 5.5 vs Sonnet 5.5, decided by testing | See section 3 |
| Payments | bKash / Nagad, confirmed manually at launch → payment gateway later | Simple start |
| Phone login | SMS OTP through a local Bangladeshi SMS provider | Familiar for users |

**Not chosen:** PHP/Laravel (founder preference), Vercel account (not needed), all-Cloudflare backend (too much setup), Supabase (kept as the fallback if InsForge doesn't work out, since both use PostgreSQL).

---

### Added for the final design (14 Nov 2026)
- The final design prototype is plain HTML/CSS/JS in `24-final-site/` so it opens anywhere. It is written to port straight into Next.js: tokens become CSS variables in a global stylesheet, `assets/app.js` pieces become React components, `assets/data.js` matches the shape of our database tables.
- 360° tours in the prototype use free CC0 panoramas from Poly Haven; production uses our own 360° captures.

## 2. Monthly cost at launch (estimate)

| Item | Cost (USD) |
|---|---|
| InsForge Pro (hosting + backend) | $25 |
| Cloudflare: free plan, or Pro for the advanced firewall | $0, or ~$20–25 |
| Cloudflare R2 | under $1 |
| Domain (~$10–15/year) | ~$1 |
| AI assistant (with a spending cap) | ~$1–20 |
| SMS for login | small, pay per message |
| **Total** | **≈ $30–75/month** (≈ ৳3,600–9,000) |

During development: mostly free plans (the InsForge free plan pauses after a week without activity, so it's for development only).

---

## 3. AI model decision process
1. Build the assistant so it answers **only from our database**.
2. Prepare 30–50 real test questions in Bangla, English and Banglish (budget planning, family/group, area, dish search).
3. Run them on **Claude Haiku 5.5** ($0.10 / $0.50 per million tokens) and **Claude Sonnet 5.5** ($2 / $10).
4. Founders compare the answers side by side and choose (or use Sonnet only for meal planning).
5. Set a **monthly spending cap** and use caching to lower costs.

---

## 4. Who does what
| Task | Who |
|---|---|
| Create accounts (InsForge, Cloudflare, domain, Anthropic API), billing, passwords | **Founders** |
| bKash/Nagad merchant accounts, SMS provider (need business documents) | **Founders** |
| Code, database, security rules, deployment, testing, debugging | **Claude** (with founder approval for live deploys, deletions, and anything that costs money) |
| Security review before launch | **An experienced human developer** (1–2 days) |

---

## 5. Security essentials
- Cloudflare in front of everything (DDoS, firewall, bot protection, HTTPS)
- Database security rules: each restaurant can see only its own data; admin roles
- Secret keys never exposed in the website code
- Input validation, rate limits on login and AI
- Daily backups
- Human security review before handling real payments and personal data

---

## Sources
- InsForge pricing: https://insforge.dev/pricing
- InsForge Sites: https://docs.insforge.dev/core-concepts/sites/overview
- InsForge deployments: https://docs.insforge.dev/core-concepts/deployments/overview
- Cloudflare pricing overview: https://www.activepieces.com/blog/cloudflare-pricing-2026-plans-and-what-you-pay
