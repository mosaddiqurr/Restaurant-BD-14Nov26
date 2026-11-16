# CLAUDE.md

Instructions for Claude Code (and any developer) working on khabo. Read this before you build anything.

## What khabo is

khabo helps people in Bangladesh see the real menu, real prices and the real place before they go out to eat.

It has two sides:

| Side | Who | What they do | Do they pay? |
|---|---|---|---|
| **B2C** | Diners (users) | Find restaurants and dishes, compare prices, see inside, read reviews, use the AI, scan table QR menus | **Never.** Everything for diners is free, forever. No paid diner plans, no fees, no paywalls. |
| **B2B** | Restaurants | Get a professional page, menu, photos, film, 360° tour, QR cards, print menu, reports, deals, featured placement | **Yes.** Restaurants are the only paying customers (Starter, Pro, Premium per month). |

What this means when you build:
- Every diner feature works with no account and no payment. An account only adds saving and reviews.
- Anything that costs money lives on the restaurant side: plans, billing, invoices, add-ons.
- Paid placement is always marked "Featured" so diners can trust what they see.
- The diner side is how we prove value to restaurants, so it must stay fast, honest and free.

Full detail: [docs/1-business/01-product-vision.md](docs/1-business/01-product-vision.md) and [docs/1-business/05-pricing-and-packages.md](docs/1-business/05-pricing-and-packages.md).

## Where things are

- `docs/` plans and research. Start at [docs/00-document-index.md](docs/00-document-index.md).
- `website/` the working prototype (plain HTML, CSS and JavaScript). It is the reference for the real build.
- `web/` the real front end in Next.js + TypeScript (diner site, owner panel, khabo team panel, QR table menu). Backend not connected yet; read [web/BUILDING.md](web/BUILDING.md) before changing it.
- Design rules, including how prices are shown: [docs/3-design/25-design-rules.md](docs/3-design/25-design-rules.md).
- Tech stack: [docs/4-tech/17-tech-stack.md](docs/4-tech/17-tech-stack.md). Who can change what: [docs/4-tech/18-security-and-access.md](docs/4-tech/18-security-and-access.md).

## Rules that always apply

- **Prices:** follow the price rules in the design rules doc. In short: show the menu price only, as "৳420" with a smaller taka sign. No "all-in" on dishes or menus. VAT and service are added only on the bill.
- **No fakes:** no AI-made interiors or dishes, no fake reviews, no made-up numbers on the live site.
- **Bangla and English** for every piece of text a diner or owner sees.
- **Light and dark mode** for every screen. Check both.
- **Phone first.** Check every screen at 390px wide with no sideways scrolling.
- **Build for scale:** thousands of restaurants later. Data-driven, reusable parts, nothing hard-coded to one restaurant.
- **Writing style:** plain, short words. No em dashes. No small label text above headings. No badges stuck on photos except the price tag and media marker.
- **Look:** flat, solid colours. No glow effects, no shiny gradients on price boxes or cards. khabo's colours are green and marigold. English type is Figtree, Bangla is Noto Sans Bengali.
- **Deal order:** Premium-plan deals and dishes always show first, then Pro, then Starter. The khabo team can reorder inside each plan. Every live deal shows on the Deals page.

## Working with the founder

- The founder is not technical. Explain in simple words.
- Ask before deciding anything that goes into the docs (stack, name, design direction, pricing).
- Commit or push only when asked.
