# Tech Stack (Final)

**Status:** ✅ Final, confirmed by the founder on 16 Nov 2026. This is the stack khabo keeps as it grows. New pieces get added around it; the core does not get replaced.

History: decided 13 Nov 2026; 16 Nov 2026 Supabase replaced InsForge, the site moved to Cloudflare Workers, files to R2, payments to SSLCommerz; later on 16 Nov the founder confirmed this final version, adding domain, email, SMS, search, maps and monitoring.

---

## 1. The idea in one line

The only part that is truly hard to change later is **the database**, so it is the industry standard (PostgreSQL). Every other part can be swapped in a day or two without touching the data.

```
Diner's phone / computer
        ↓
Cloudflare: domain, HTTPS, attack and bot protection
        ↓
Website: Next.js (already built), hosted on Cloudflare Workers
        ↓
Supabase: PostgreSQL database + logins + security rules
        ↓
Cloudflare R2: photos, 360°, 3D files · Cloudflare Stream: films
        +
Claude API (AI) · SSLCommerz (payments) · SMS · Resend (email) · Sentry · PostHog
```

## 2. What is stored where

| What | Where | Why there |
|---|---|---|
| Words and numbers: restaurants, menus, prices, price history, portions, deals, events, reviews, users, plans, invoices | **PostgreSQL** (run by Supabase) | A database is made for this: fast search, reports, "who can change what" |
| Big files: photos, menu photos, 360° tours, 3D dishes, logos | **Cloudflare R2** | Files are big; R2 is much cheaper than keeping them in the database, and free to send to visitors |
| Restaurant films | **Cloudflare Stream** | Plays smoothly on slow phone data, makes poster frames |

The database keeps only the link to each file, for example "Shahi Handi's cover photo is at this address in R2".

## 3. The final stack

| Part | Choice | Why |
|---|---|---|
| **Domain (main)** | **.com** from **Cloudflare Registrar** | Sold at the wholesale price: no markup and no surprise renewal price. Free privacy protection. Same account as hosting and security, so nothing to connect between companies |
| **Domain (Bangladesh)** | **.com.bd** from **BTCL** (direct or an approved seller) | Cloudflare cannot sell .com.bd. Protects the name in Bangladesh and builds local trust; it points to the main site. Check the name is free (and on Facebook and Instagram) before buying |
| **DNS, HTTPS, security** | **Cloudflare** | Free HTTPS, attack (DDoS) protection, firewall, bot protection (Turnstile); fast in Bangladesh |
| **Website hosting** | **Cloudflare Workers** with the OpenNext adapter (`@opennextjs/cloudflare`) | Fast in Asia, cheap even on Eid and Friday-night spikes, same account as domain and files. Every push to GitHub goes live by itself |
| **Website code** | **Next.js + TypeScript** | Already built (diner site, owner panel, team panel, QR table menu). Server code for the backend lives here too, so there is no separate server to look after |
| **Database** | **PostgreSQL** | The most used database for new apps. Handles price history, reports, search, roles, payments and later POS. Free and open source; no one company owns it |
| **Who runs the database** | **Supabase** (servers in Singapore) | Runs PostgreSQL for us with backups. Over 250,000 customers. Open source, and the data can be exported and moved any time |
| **Logins** | **Supabase Auth** | Email + password, phone code, Google. Passwords are stored scrambled. Roles (diner, owner, staff, khabo team) live in our own `profiles` table |
| **Who can change what** | **Supabase security rules** (row level security) | The database itself makes sure an owner can only change their own restaurant. Details: [18-security-and-access.md](18-security-and-access.md) |
| **Search** | Built into PostgreSQL (full text + fuzzy matching) | Finds dishes and restaurants even with spelling mistakes and Banglish. A separate search service only if we ever outgrow it |
| **Maps** | **Leaflet** (already built) + **PostGIS** in PostgreSQL for "near me" | Free and open; no Google Maps bills. Map tiles provider still open (decision 5.6) |
| **Photos, 360°, 3D files** | **Cloudflare R2** + Cloudflare Images (resizing) | About $0.015 per GB a month, first 10 GB free, free to send to visitors. Works like Amazon S3, so files can move later. Uploads are checked by our server first (logged in, own restaurant only) |
| **Films** | **Cloudflare Stream** | Smooth on slow data, poster frames, no extra bandwidth bill |
| **3D, 360°, games** | **Three.js** + `<model-viewer>` for real 3D dish captures (AR on phones) | Already built; loads only where needed |
| **Restaurant payments** | **SSLCommerz** | One connection takes bKash, Nagad, Rocket, cards and bank. Stripe does not serve Bangladesh businesses. Direct bKash later if fees are better |
| **Phone login codes** | A **Bangladeshi SMS company** | Cheaper and more reliable on local networks than foreign services |
| **Emails from the site** | **Resend** | Receipts, monthly reports, password emails; lands in the inbox, not spam |
| **Team email** (name@khabo...) | **Google Workspace** | Professional mailboxes, calendar, documents |
| **AI assistant + menu from a photo** | **Claude API** (Anthropic) | Strong in Bangla, English and Banglish; reads menu photos. Answers only from our database. Model chosen by testing (section 6) |
| **Error alerts** | **Sentry** | Tells us when something breaks, before diners complain |
| **Visitor stats** | **PostHog** | What diners do; also feeds the restaurant monthly reports |
| **Code and versions** | **GitHub** | Every change saved; every past version can come back |
| **Offline table menu and games** | Service worker (already built) | Menu and games open with weak or no signal after the first visit |

**Not chosen:** PHP/Laravel, Vercel, Netlify, InsForge (newer, less proven), Firebase (not PostgreSQL, hard to leave), Supabase Storage for files (R2 is cheaper), Stripe (not for Bangladesh businesses), Google Maps (expensive at scale), many small services like Swiggy (that is for companies with thousands of engineers; we can split later if ever needed, keeping the same database).

**Later, added on top (not replacing anything):** a phone app (React Native) on the same Supabase backend; a bigger database plan as traffic grows; a dedicated search service only if needed.

**Before launch:** test a full build of this site on Cloudflare Workers, because it uses very new Next.js features. This is a check, not a change of plan.

---

## 4. Cost

Dollar prices are converted at about ৳120 per dollar. Prices checked on 16 Nov 2026 and can change; confirm at signup.

### 4.1 One-time setup

| Item | Cost | Notes |
|---|---|---|
| .com domain, first year | ~$10.50 (~৳1,300) | Cloudflare Registrar, wholesale price |
| .com.bd domain, first year | ৳700 + VAT | BTCL price from Jan 2026 (renewal ৳1,020 a year) |
| SSLCommerz merchant setup | ask SSLCommerz | One outside source says about ৳25,500 one time; not confirmed. Needs trade licence and business papers; apply early |
| SMS provider | first recharge, e.g. ৳1,000 | Prepaid credit you use up, not a fee |
| Security check by an experienced human developer before real payments | ~৳20,000 to ৳50,000 (estimate) | 1 to 2 days of work |
| Building the backend | ৳0 extra | Built with Claude Code (your existing Claude plan) |
| All accounts (Supabase, Cloudflare, GitHub, Resend, Sentry, PostHog, Anthropic) | ৳0 | Free to open |
| **Total one-time** | **about ৳50,000 to ৳80,000** | Most of it is the SSLCommerz setup and the security check. Without payments yet: about ৳3,000 |

Not counted here: shoot equipment for 360° and 3D, trade licence, company costs.

### 4.2 Every month

| Item | While testing | At launch (30 to 50 restaurants) | Growing (about 500 restaurants) |
|---|---|---|---|
| Supabase (database + logins) | $0 | $25 | $40 to $60 (bigger database plan) |
| Cloudflare Workers (hosting) | $0 | $5 | $5 to $15 |
| Cloudflare security | $0 | $0 | $0, or $25 for the Pro firewall |
| Cloudflare R2 (files) | $0 | under $1 | $5 to $10 |
| Cloudflare Stream (films) | $0 | $5 to $25 | $50 to $100 |
| Domains (yearly, shown per month) | $0 | ~$1.50 | ~$1.50 |
| Claude API (AI, with a spending cap) | ~$1 | $5 to $20 | $50 to $150 |
| SMS login codes (~৳0.25 each) | $0 | ~$4 | ~$20 to $40 |
| Resend (emails) | $0 | $0 (free up to 3,000 a month) | $20 |
| Google Workspace (2 people) | $0 | $14 | $14 and up (per person) |
| Sentry (errors) | $0 | $0 | $26 |
| PostHog (stats) | $0 | $0 | $0 to $50 |
| GitHub | $0 | $0 | $0 |
| **Total** | **about $1** | **about $60 to $100 (৳7,200 to ৳12,000)** | **about $230 to $500 (৳28,000 to ৳60,000)** |

Notes:
- **While testing** everything runs on free plans. The free Supabase database sleeps after a week with no use; that is fine for testing.
- **Films are the cost to watch:** Stream charges about $1 per 1,000 minutes watched, plus $5 per 1,000 minutes stored. Restaurant cover films autoplay, so busy pages add up. Keep cover films short.
- **Payment fees are not a monthly bill:** SSLCommerz keeps a small share of each restaurant payment (outside sources say about 1.5% to 2.5%; confirm with SSLCommerz).
- At launch, 30 to 50 restaurants on the cheapest plan already cover these costs many times over.

---

## 5. Who does what

| Task | Who |
|---|---|
| Buy the domains; open accounts (Supabase, Cloudflare, GitHub, Resend, Google Workspace, Sentry, PostHog, Anthropic); billing; passwords | **Founders** (Claude guides each step, never handles passwords) |
| SSLCommerz merchant account and SMS provider (need business documents; approval takes days to weeks) | **Founders** |
| Code, database, security rules, deployment, testing, fixing | **Claude** (founder approves live deploys, deletions and anything that costs money) |
| Security check before real payments and personal data | **An experienced human developer** (1 to 2 days) |

---

## 6. AI model decision process

1. Build the assistant so it answers **only from our database**.
2. Prepare 30 to 50 real test questions in Bangla, English and Banglish (budget planning, family or group, area, dish search).
3. Run them on **Claude Haiku 5.5** ($0.10 / $0.50 per million tokens) and **Claude Sonnet 5.5** ($2 / $10).
4. Founders compare the answers side by side and choose (or use Sonnet only for meal planning).
5. Set a **monthly spending cap** and use caching to lower costs.

---

## 7. Security essentials

- Cloudflare in front of everything (attack and bot protection, firewall, HTTPS)
- Database security rules: each restaurant sees and changes only its own data; team roles
- Secret keys never in the website code that reaches phones
- Input checks, limits on login tries and AI use
- Daily backups (Supabase Pro)
- Human security check before handling real payments and personal data

---

## Sources

- Supabase pricing: https://supabase.com/pricing
- Supabase Pro inclusions: https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/
- Supabase customers and funding: https://itbrief.co.uk/story/supabase-raises-usd-500-million-in-series-f-round
- Next.js on Cloudflare (OpenNext): https://opennext.js.org/cloudflare
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare Stream pricing: https://developers.cloudflare.com/stream/pricing
- .bd domain prices (Jan 2026): https://thefinancialexpress.com.bd/trade/price-of-bd-domain-cut-by-36pc
- SSLCommerz onboarding: https://sslcommerz.com/onboarding-requirements/
- SSLCommerz fees (outside sources, unconfirmed): https://www.photonpay.com/hk/blog/article/payment-methods-in-Bangladesh
- Google Workspace pricing: https://www.emailvendorselection.com/google-workspace-pricing/
- Bangladesh SMS prices: https://sms.automas.com.bd/ and https://serverbd.net/sms-server-bangladesh
