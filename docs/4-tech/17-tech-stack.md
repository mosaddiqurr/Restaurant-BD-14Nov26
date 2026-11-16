# Tech Stack (Decision Record)

**Status:** ✅ Decided by the founders on 13 Nov 2026. **Updated 16 Nov 2026:** Supabase replaces InsForge, the website runs on Cloudflare Workers, files go to R2 from day one, payments through SSLCommerz.
The detailed System Architecture document and CLAUDE.md follow after the design direction is chosen.

---

## 1. The stack

```
Diner's phone / computer
        ↓
Cloudflare: domain, SSL (HTTPS), DDoS protection, firewall, bot protection (Turnstile)
        ↓
Website: Next.js (React, TypeScript), hosted on Cloudflare Workers (OpenNext adapter)
        ↓
Supabase: PostgreSQL database, login (Supabase Auth), security rules (row level security), server functions
        ↓
Cloudflare R2: photos, menu photos, 360° and 3D files · Cloudflare Stream: restaurant films
        +
Claude API: AI assistant (reads only from our database)
```

| Layer | Choice | Why |
|---|---|---|
| Website framework | **Next.js (React, TypeScript)** | Best for a premium, animated, fast, SEO-friendly site; largest component ecosystem (e.g. 21st.dev); easy path to a native app later |
| Website hosting | **Cloudflare Workers** with the OpenNext adapter (`@opennextjs/cloudflare`) | Fast in Bangladesh and Asia, free to start (~$5/month after), handles Eid and Friday-night spikes without big bills; domain, files and films in the same account. Every push to GitHub goes live by itself |
| Backend | **Supabase** | Years of large apps in production; database, login, security rules and functions in one place; servers in Singapore and Mumbai; big community and docs |
| Database | **PostgreSQL** (inside Supabase) | Strong for price history, reports, search, roles and later payments and POS; can be exported and moved anywhere |
| Login | **Supabase Auth** | Email + password, SMS code, Google. Passwords are stored hashed (scrambled), so nobody can read them. Usernames and roles (diner, owner, staff, khabo team levels) live in our own `profiles` table linked to each account |
| Security & domain | **Cloudflare** | DDoS protection, firewall, SSL, bot protection; fast in Bangladesh |
| Media storage | **Cloudflare R2** from day one | Very cheap storage (~$0.015/GB/month) and free to send files to visitors; works like Amazon S3, so files can move later. Uploads go through our server first, which checks the Supabase login and that the file belongs to the person's own restaurant, then hands out a short-lived upload link |
| Films | **Cloudflare Stream** | Plays smoothly on slow phone connections, makes poster frames |
| 3D / 360° / motion | **Three.js** (360° tours and 3D dish viewer; the v1 prototype used it; the current prototype in `archive/prototype/` uses its own 8 KB WebGL 360 viewer, which can move to Three.js in the real build if needed) · `<model-viewer>` for real 3D dish captures (GLB, with AR on phones) · CSS motion first, **Motion** (`motion/react`) only where needed | Proven, browser-only, no app needed. Three.js loads only on pages with 3D, after the page is ready |
| Page transitions & motion | The browser's **View Transitions API** + CSS, kept in one shared layer (`motion.css`, `motion.js` in the prototype). Each page style has its own move: pages slide up or back, a restaurant photo grows out of its card and shrinks back on Back, list cards slide when filters change, a dish category swaps its plate | No library to download. Browsers without View Transitions simply swap pages. Everything turns off under "reduce motion". Moves use only `transform`, `opacity` and `clip-path`, so they stay smooth on cheap Android phones |
| Fonts | **Figtree** + **Noto Sans Bengali**, self-hosted with `next/font` | Variable fonts (one file per script); Noto Sans Bengali matches the Android system Bangla font |
| Icons | **Phosphor Icons** (`@phosphor-icons/react`) | One family, regular + fill weights |
| Maps | **Leaflet 1.9** + map tiles (provider open, see decision 5.6) | Small, free, works on low-end phones; loads only when the map scrolls into view. Pins come from `BRANCH.lat/lng`; labels de-overlap, and pins cluster by area above 60 per view |
| QR codes | **qrcode-generator** for the code + our own SVG renderer for branded styles (logo, colours, shapes) | One renderer for screen and print, so table cards and the PDF menu always match. Each style is checked by reading every square back from the rendered image; cards are also test-scanned on real phones before printing |
| Media delivery | Cloudflare R2 + Cloudflare Images (resizing) · video as short MP4/HLS with poster frames | Small images on phones; video only plays when asked (autoplay on laptops only, never on data saver) |
| AI assistant | **Claude API**: Haiku 5.5 vs Sonnet 5.5, decided by testing | See section 3 |
| Payments | **SSLCommerz** (bKash, Nagad, cards, bank) for restaurant plans; direct bKash gateway later if fees are better. Stripe does not accept businesses registered in Bangladesh | One connection covers every local way to pay. Payment code runs only on the server and is confirmed by the gateway's webhook |
| Offline table menu | Service worker (PWA) saves the menu, prices and photos after the first scan | Menu opens with weak or no signal; shows when it was last updated; orders and reviews wait and send when back online |
| Phone login | SMS OTP through a local Bangladeshi SMS provider | Familiar for users |

**Not chosen:** PHP/Laravel (founder preference), Vercel (founder choice), InsForge (newer, less proven at scale; was the first pick on 13 Nov), Supabase Storage for files (R2 is cheaper and avoids a move later), all-Cloudflare backend (too much setup), Stripe (not available for Bangladesh businesses), whole site in Three.js (too heavy for phones).

**Can we change later?** Yes, each part on its own: Next.js can move to another host, the PostgreSQL database can be exported, R2 files work with any S3-compatible storage.

---

### Added for the final design (14 Nov 2026)
- The final design prototype is plain HTML/CSS/JS in `archive/prototype/` (one folder per restaurant under `archive/prototype/restaurants/`) so it opens anywhere. It is written to port straight into Next.js: tokens become CSS variables in a global stylesheet, `assets/app.js` pieces become React components, `assets/data.js` matches the shape of our database tables.
- 360° tours in the prototype use free CC0 panoramas from Poly Haven; production uses our own 360° captures.

## 2. Monthly cost at launch (estimate)

| Item | Cost (USD) |
|---|---|
| Supabase Pro (database + login) | $25 |
| Cloudflare Workers (website hosting) | $0–5 |
| Cloudflare: free plan, or Pro for the advanced firewall | $0, or ~$20–25 |
| Cloudflare R2 | under $1 |
| Cloudflare Stream (films) | ~$5 |
| Domain (~$10–15/year) | ~$1 |
| AI assistant (with a spending cap) | ~$1–20 |
| SMS for login | small, pay per message |
| **Total** | **≈ $35–80/month** (≈ ৳4,200–9,600) |

During development: free plans (the Supabase free plan pauses after a week without activity, so it's for development only).

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
| Create accounts (Supabase, Cloudflare, GitHub, domain, Anthropic API), billing, passwords | **Founders** |
| SSLCommerz / bKash / Nagad merchant accounts, SMS provider (need business documents; apply early, approval takes days to weeks) | **Founders** |
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
- Supabase pricing: https://supabase.com/pricing
- Next.js on Cloudflare (OpenNext): https://opennext.js.org/cloudflare
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- SSLCommerz: https://developer.sslcommerz.com/
- Cloudflare pricing overview: https://www.activepieces.com/blog/cloudflare-pricing-2026-plans-and-what-you-pay
