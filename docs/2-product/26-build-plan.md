# Build Plan

How khabo goes from design to a live product. Plain steps, in order. Decided with the founder on 15 Nov 2026.

The roadmap ([14-product-roadmap.md](14-product-roadmap.md)) says **what** goes in each phase. This page says **how we build it**.

---

## Step 1: Design the whole product as a prototype

Plain HTML, CSS and JavaScript in [`website/`](../../website/README.md). Fast to change, opens anywhere, fake data. This is the blueprint for the real build.

| Part | Status |
|---|---|
| Customer website: home, restaurants, dishes, restaurant pages, QR table menu, AI demo | ✅ Done |
| Login (fake accounts, 5 team levels, lockout, timeouts) | ✅ Done |
| **Admin panel** for the khabo team: every restaurant, team and users, reviews, billing, leads, site text, activity | ✅ Done |
| **Restaurant panel** for owners: only their own restaurant (menu, prices, sold out, page, social links, photos, deals, reviews, website, table QR, print menu, stickers) | ✅ Done |

Who can change what, the five team levels and the test accounts: [Security and Access](../4-tech/18-security-and-access.md).

In the prototype, changes are saved in the browser and show on the website straight away. The rules are checked in the browser here; the real lock comes from the server and the database in Step 3.

**At the same time:** show the prototype to restaurant owners (roadmap Phase 0). Goal: 5 to 10 owners say they will pay.

## Step 2: Founder review

Go through every page of the website and both panels. Fix what needs fixing before any real code is written. Changes are cheap now and expensive later.

## Step 3: Build the real product on our computer

Using the approved design as the blueprint ([tech stack](../4-tech/17-tech-stack.md)): Next.js + TypeScript on Cloudflare Workers, Supabase for the database and login, Cloudflare R2 for files, Cloudflare Stream for films. Everything on free plans while we build. Times below are rough and depend on review speed.

**3a. Accounts (founders, about 1 day).** Cloudflare, Supabase, GitHub, the domain (on Cloudflare), an SMS provider. Apply to SSLCommerz now, as approval takes the longest.

**Status (16 Nov 2026):** the whole front end is built in `web/` (Next.js + TypeScript, Tailwind, Motion, Base UI) on local demo data: diner site, owner panel, khabo team panel, QR table menu (works offline after the first scan) and print menus. What is left in Step 3 is the backend: Supabase tables, real login, file uploads to R2, then swapping `web/lib/data/catalog.ts` and `web/lib/demo-db.ts` for real database calls.

**3b. Foundation (about 1 week).**
- New Next.js + TypeScript project, live on Cloudflare from day one (every push to GitHub goes live by itself)
- The green design system from the prototype: colours, Figtree and Noto Sans Bengali, light and dark, Bangla and English
- Database tables: restaurants, branches, menus, dishes, prices and price history, photos, deals, events, reviews and replies, users, roles
- Security rules in the database: a restaurant account can only read and change its own restaurant; khabo team levels as in [Security and Access](../4-tech/18-security-and-access.md)
- File uploads to R2 through our server, which checks the login first

**3c. Diner website (2 to 3 weeks).** Home, restaurants, dishes, deals, prices, events and restaurant pages on real data. 360 tours and 3D dishes (Three.js, loaded only there), films, photos, search, filters, map. QR table menu that also opens offline after the first scan.

**3d. Login and panels (2 to 3 weeks).**
- Diners and owners: phone number and SMS code, or Google
- khabo team: password plus 2-step, the 5 team levels
- Owner panel: menu and prices, sold out, photos, deals, events, review replies, QR and print menus
- Admin panel and activity log, all on real data
- Real restaurant data entered by the team

**3e. Testing (about 1 week).** Every screen at 390px on real phones, light and dark, Bangla and English. Speed check, security check, and trying to break the access rules on purpose.

No AI yet. The free rule-based Ask khabo stays.

## Step 4: Go live

- Domain and hosting are already on Cloudflare from Step 3; switch to paid plans (Supabase Pro, Cloudflare Workers paid, Stream)
- Enter 30 to 50 restaurants, owners get their logins
- Add the Claude AI (Haiku 5.5, daily spending limit) once real traffic starts

## Step 5: Grow

Roadmap Phase 1.5 onwards: restaurant plans and billing through SSLCommerz (bKash, Nagad, cards, bank), menu from a photo, price reports, more 360 tours, video and 3D menus, stamp cards, then POS and table payments, then the mobile app.

---

**Change from the earlier roadmap:** the restaurant panel (owners editing their own menu, prices, sold out and page) moved from Phase 2 to Phase 1, so owners have it from launch. Founder decision, 15 Nov 2026.
