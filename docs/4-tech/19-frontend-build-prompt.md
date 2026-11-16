# Front end build prompt

Copy everything below the line into a new Claude Code session opened in `E:\1. Startup\Restaurant`.
Written 16 Nov 2026. Backend comes later (Supabase, see [17-tech-stack.md](17-tech-stack.md)).

---

You are building the real front end of **khabo**, a restaurant discovery site for Bangladesh. Diners see the real menu, real prices and the real place before they go out. Restaurants pay for plans; diners never pay.

## 1. Goal

Build the complete front end in Next.js: every diner page, the owner panel and the khabo team panel. It should look and move like a top product site, and stay fast on a cheap Android phone on a slow connection.

**No backend yet.** All data comes from local typed mock data. It has to be easy to swap for Supabase later without touching any page or component.

## 2. Read these first

- `CLAUDE.md`: rules that always apply (prices, no fakes, Bangla + English, light + dark, 390px, writing style, deal order).
- `docs/3-design/25-design-rules.md`: price format, cards, QR cards, motion, general look, deal order.
- `docs/4-tech/17-tech-stack.md` and `docs/4-tech/18-security-and-access.md`: the stack, roles and team levels.
- `docs/2-product/09-prd.md`, `docs/2-product/12-sitemap.md`, `docs/2-product/15-erd.md`, `docs/2-product/27-new-features-brief.md`: what exists and how the data is shaped.
- **The prototype** in `website/` is the reference: `website/index.html` + `website/app/app.js` + `website/app/app.css` (diner site), `website/panel/` (owner and admin panels), `website/classic.html` + `website/code/` (QR table menu and print menu), `website/restaurants/*/restaurant.js`, `website/data/common.js`, `website/data/prices.js`, `website/code/i18n.js` (every word in English and Bangla). Run it with `python website/serve.py` and open http://localhost:8765.

The prototype is a **starting point, not a limit**. Keep every feature, section and piece of content it has. You are free to do better: better layouts, better loading, better scrolling, better search, better transitions, better spacing. If you change something big, show it to the founder before moving on.

## 3. Stack (front end)

| Part | Use |
|---|---|
| Framework | Next.js (latest stable, App Router) + TypeScript (strict) |
| Styling | Tailwind CSS v4, design tokens as CSS variables (light and dark) |
| Components | Base UI (`@base-ui/react`) for dialogs, popovers, menus, tabs, switches, selects, tooltips. Style them ourselves |
| Animation | Motion (`motion/react`), CSS transitions, the View Transitions API for page changes |
| Extra pieces | Vaul (phone bottom sheets), Sonner (toasts), cmdk (search), `@number-flow/react` (animated numbers), dnd-kit (drag lists in panels), Recharts (price charts) |
| 3D and 360 | Three.js through React Three Fiber, loaded only when a 360 tour or 3D dish opens. `<model-viewer>` for GLB dishes |
| Map | Leaflet (or MapLibre), loaded only when the map scrolls into view |
| Icons | `@phosphor-icons/react` only |
| Fonts | Figtree and Noto Sans Bengali through `next/font` |
| Language | `next-intl`, English and Bangla, with the words from `website/code/i18n.js` |
| Theme | `next-themes`, light and dark, no flash on load |
| State | Zustand for the bill, saved items and settings. URL search params for filters |
| Offline | Serwist (service worker) so the QR table menu opens offline after the first scan |
| Hosting | Cloudflare Workers through `@opennextjs/cloudflare`. Keep the code compatible from day one |

Check with the founder before adding any big library not on this list.

## 4. Where the code goes

Create the new app in `E:\1. Startup\Restaurant\web\`. Do not change `website/`; it stays as the reference.

```
web/
  app/[locale]/            pages (diner site, /partner, /admin, /t/[id] table menu)
  components/ui/           buttons, sheets, dialogs, inputs (built on Base UI)
  components/motion/       shared animations (see section 6)
  components/<feature>/    restaurant, dish, deals, prices, events, reviews, bill, search, map, panel
  lib/data/                types + mock data + the data layer (section 5)
  lib/format/              price, date, Bangla digits
  messages/en.json, bn.json
  styles/tokens.css
```

## 5. Data layer (so the backend plugs in later)

- Write TypeScript types for every table in `docs/2-product/15-erd.md`: restaurants, branches, menus, dishes, prices, price history, photos, films, 360 rooms, deals, events, reviews, replies, users, roles.
- Convert the prototype data (`website/restaurants/*/restaurant.js`, `data/common.js`, `data/prices.js`) into typed mock files. Same restaurants, same content.
- All pages read data **only** through one data layer, for example `getRestaurant(id)`, `listDishes(filters)`, `listDeals()`, `getPriceHistory(dishId)`, `saveReview()`, `updateMenu()`. Today these read the mock files and save changes in the browser. Later they will call Supabase, and nothing else changes.
- Sign in is a fake for now (the test accounts in `website/README.md`), but roles and team levels must already decide what each screen shows, exactly as in `18-security-and-access.md`.
- Build for thousands of restaurants: nothing hard coded to one restaurant, lists paged or virtualised, filters in the URL.

## 6. Motion and feel (top quality, still light)

Follow the craft of Emil Kowalski (animations.dev, the maker of Sonner and Vaul). If his skill is installed in Claude Code, load it and follow it. Also use `website/code/feel.js` and section 4 of the design rules. Other sites like Motion Primitives, Magic UI, Aceternity, React Bits and 21st.dev are for **ideas only**: rebuild what fits in our own style, and never copy glow, neon or shiny gradient effects.

Rules:
- Animate only `transform`, `opacity` and `clip-path`. Never animate width, height, top or left on scroll.
- UI moves are quick: 150 to 300 ms with a strong ease out (for example `cubic-bezier(.32,.72,0,1)`). Springs for things you drag or throw.
- Never start an animation from scale 0. Start from about 0.95 with opacity 0.
- Every animation can be interrupted. A tap in the middle must feel instant.
- Nothing moves for no reason. No endless looping animations on cards.
- Everything respects "reduce motion".
- Never track scroll or pointer position with `useState`. Use Motion values or CSS scroll-driven animations.

Put these in `components/motion/` and reuse them everywhere:
- **Page changes:** View Transitions. A restaurant photo grows out of its card and shrinks back on Back. Lists slide when filters change.
- **Loading:** skeletons shaped like the real content, then a soft reveal. A branded first load (the rolling plate from the prototype, made better), shown only on a slow first visit, never on every page.
- **Scrolling:** the sticky section bar on restaurant pages, with Call, Directions and Bill shrinking into it (already in the prototype). Sections fade up once as they enter. Use native scroll (no scroll hijacking on phones). If smooth scroll is used on laptops, keep it off on touch screens.
- **Search:** the search box grows into a full search panel, results appear one after another, and the matched words are highlighted.
- **Sheets and dialogs:** Vaul on phones (drag down to close), a centred dialog on laptops.
- **Numbers:** prices and the bill total roll with NumberFlow. Bangla digits stay plain.
- **Lift group, shimmer text, toasts, accordion and drag with physics:** as in the design rules.

## 7. Speed budget (check every page)

- On a mid Android phone with slow 4G: main content shows in under 2.5 seconds, layout never jumps (CLS under 0.1), taps answer in under 200 ms.
- First page JavaScript under about 170 KB (gzip). Three.js, maps, charts, the 360 viewer and the panels load only where they are used.
- Server components by default. Only interactive leaves use `'use client'`.
- Images through `next/image`, sized for each screen, lazy below the fold. Films play only when asked on phones and never on data saver.
- Run Lighthouse on phone settings and aim for 90+ in every category.

## 8. Pages to build

Diner site:
- Home, Restaurants, Dishes, Deals, Prices (price tracker and Food Price Index), Events.
- Restaurant page: film, photos, 360 tour, menu with the bill, kitchen, reviews with owner replies, events, deals, map, Call, Directions and Bill.
- Dish sheet: photos, 3D, price history, "What people said", Review this dish.
- Search, saved items, Ask khabo (rule-based for now), For restaurants (business) page, account, sign in.
- QR table menu `/t/[id]` (works offline after the first scan, shows when it was last updated) and the printable menu.

Owner panel (`/partner`): overview, menu and prices, sold out, upload menu photo (sample flow), page and photos, deals, events, reviews and replies, table QR, print menus, stickers, insights, team.

khabo team panel (`/admin`): restaurants, team and users, reviews, billing (screens only), leads board, site text, deal order, activity log. Show only what each team level is allowed to see.

## 9. Rules that never change

- Prices: menu price only, written "৳420" with a smaller taka sign. VAT and service only on the bill.
- Premium deals and dishes show first, then Pro, then Starter. Paid placement is always marked "Featured".
- Flat, solid colours: green and marigold for khabo, each restaurant's own two colours on its page. No glow, no shiny gradients on price boxes or cards, no badges on photos except the price tag and the media marker.
- Every piece of text in English and Bangla. Plain, short words, no em dashes, no small label text above headings.
- Every screen in light and dark, and at 390px wide with no sideways scrolling.
- Accessible: keyboard works everywhere, visible focus, good contrast, real buttons and labels.

## 10. How to work

1. Plan first: list the phases, the folder setup and the motion system, and show the founder before writing pages.
2. Build in this order, and show the founder at the end of each phase:
   1. Setup, design tokens, fonts, theme, language, data layer with mock data, motion kit
   2. Home, Restaurants, Dishes, search
   3. Restaurant page, dish sheet, bill, 360 and 3D
   4. Deals, Prices, Events, reviews, saved, Ask khabo, For restaurants
   5. QR table menu (offline) and print menu
   6. Owner panel
   7. khabo team panel
   8. Polish: speed budget, accessibility, Playwright screenshots of every page at 390px and 1440px, light and dark, English and Bangla
3. After each phase, check it in the browser yourself (phone and laptop width, both themes, both languages) before saying it is done.
4. The founder is not technical. Explain in plain words, and ask before big design changes.
5. Commit only when the founder asks.
