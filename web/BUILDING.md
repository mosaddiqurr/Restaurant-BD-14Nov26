# Building the khabo front end

The real khabo website in Next.js. The prototype in `../website/` is the reference: same features, same content, same look, rebuilt properly. Backend comes later (Supabase); for now all data is local.

Run: `npm run dev -- -p 3100` (or the "web" entry in `.claude/launch.json`), then open http://localhost:3100.

## Rules from the founder (always)

Read `../CLAUDE.md` and `../docs/3-design/25-design-rules.md`. In short:
- Prices: menu price only, "৳420" with a smaller taka sign (`<Tk v={420} />`). VAT and service only on the bill.
- Every word in English and Bangla. Light and dark. Phone first, 390px wide with no sideways scroll.
- Plain short words, no em dashes, no small label text above headings. Flat colours, no glow.
- Premium deals and dishes first, then Pro, then Starter. Paid placement is marked "Featured".

## Stack

Next.js 16 (App Router, `cacheComponents`), React 19.3, TypeScript strict, Tailwind v4, Motion (`motion/react`), Base UI (`@base-ui/react/*`), Vaul (sheets), Sonner (toasts), cmdk (search), input-otp, NumberFlow, Recharts, dnd-kit, zustand, next-themes, Leaflet, Three.js (360 only), qrcode-generator.
This Next.js has breaking changes from older versions: read `node_modules/next/dist/docs/` before using an API you are unsure of (params are Promises, `proxy.ts` not middleware, `'use cache'`, `<ViewTransition>` from React).

## Where things are

```
app/[lang]/layout.tsx            html, fonts, providers, overlays (every page)
app/[lang]/(site)/               the diner site (header, footer, tab bar)
app/[lang]/(site)/page.tsx       home
app/[lang]/(site)/<page>/        restaurants, dishes, deals, prices, events, business, r/[id]
app/[lang]/partner, admin, t     owner panel, khabo team panel, table QR menu (own layouts)
app/api/*                        small JSON endpoints (search, ask, dish extras)
components/ui/bits.tsx           I (icon), Tk (price), Num, Mono, Pic, Rise, Pill, Seg, Stars, Spice, Logo, RailX
components/ui/choose.tsx         Choose (popover choice list), AreaPop
components/cards/                RCard, DCard, AddBtn, Coupon, Code, Countdown, Seal, ECard, RvCard; actions (openDish, addDish, needSign)
components/media/                MapBox (Leaflet), Model (3D dish)
components/shell/                header, tab bar, footer, nav helpers (useHref, useGo, qs, parseQs)
components/overlays/             dish sheet, bill, search palette, Ask khabo, sign in, film, 360 tour, photos, reviews
lib/data/types.ts                data shapes (match the database tables later)
lib/data/catalog.ts              THE DATA LAYER (server only). Pages read data only through these functions
lib/khabo.ts                     shared rules: photos (src), opening hours, deals order, filters, toCard/toMini
lib/store.ts                     zustand: bill, open overlays, area, own reviews, deal order (saved in the browser)
lib/demo-db.ts                   owner/team panel saves (localStorage "khabo.panel.v1") + hooks diner pages use to show them
lib/i18n/                        createI18n; server getI18n(lang); client useI()
messages/en.json, bn.json        every word (imported from the prototype). i.t(key), i.tx(key) for the newer words
styles/khabo.css                 the prototype's whole stylesheet (class names match the prototype markup)
styles/next.css                  what the Next build adds (icons, view transitions, skeletons)
data/catalog/                    restaurants/<id>.json, common.json, prices.json (made by scripts/import-prototype.mjs)
public/media/                    360 rooms, 3D models, restaurant logos. public/icons: Phosphor sprites
```

## How to write a page

1. The page file is a **server component**: `export default async function Page({ params }: PageProps<'/[lang]/dishes'>)`, `const { lang } = await params`. Load data with `lib/data/catalog.ts` and pass plain objects to one client component.
2. The UI is a **client component** (`'use client'`) that gets those props. Use `const i = useI()` for words: `i.t('key')`, `i.tx('newer_key')`, `i.L({en, bn})`, `i.N(5)`, `i.tk(420)`, `i.dg('12')`.
3. Port the markup from `../website/app/app.js` (htm templates) into JSX with **the same class names**: the styles in `styles/khabo.css` then just work. `html\`<${X} a=${1}>\`` becomes `<X a={1}>`; `className=${clsx(...)}` stays; `style=${{ '--d': x }}` needs `as CSSProperties`.
4. Navigation: `<Link href={href('/restaurants', { area: 'gulshan' })}>` with `const href = useHref()`; never hard-code `/en`. Filters live in the URL (`qs`, `parseQs`).
5. Icons: `<I n="star" f />` (f = filled, b = bold). If a name is missing from the sprite, add it to `scripts/icons-used.json` and run `node scripts/icons-build.mjs`.
6. Photos: `<Pic id={photoId} w={600} />` (srcset included). Plain URL: `src(id, w)` from `lib/khabo`.
7. Time-dependent things (open now, countdowns, "on now") must not differ between the saved (static) page and the browser: render them only after mount with `useMounted()` from bits.tsx. Do not use `suppressHydrationWarning` for them (React would keep the stale text).
8. Never use `useState` for scroll or pointer positions; use Motion values or a rAF-throttled listener.

## Motion rules (Emil Kowalski's craft)

- Animate only `transform`, `opacity` (and `clip-path`, `filter: blur` lightly). Never width/height/top/left on scroll.
- UI moves 150 to 300 ms with a strong ease out: `EASE = [0.23, 1, 0.32, 1]`; sheets `SHEET = [0.32, 0.72, 0, 1]`; springs (`SPR`) for things you drag or that slide under tabs.
- Never from scale 0 (start about 0.95 + opacity 0). Buttons: `scale(0.97)` on press. Exits faster than entries.
- Popovers grow from their trigger (Base UI `--transform-origin`). Modals stay centred.
- Hover effects only under `@media (hover: hover) and (pointer: fine)`.
- Stagger 30 to 80 ms, total under about 300 ms. Nothing loops forever on cards.
- Everything respects reduced motion (MotionConfig `reducedMotion="user"` is already on).

## Speed

Server components by default; client only for interactive leaves. Heavy things load only when used (`next/dynamic` or `import()` in an effect): Leaflet, Three.js, model-viewer, Recharts, the panels. Phones get small images (`Pic` srcset). Films play only when asked on phones.

## Data rules

Pages never import JSON directly; they call `lib/data/catalog.ts`. Client code that needs data on demand calls a route in `app/api/`. Owner and team edits go through `lib/demo-db.ts` so diner pages show them (`useLiveRestaurant`, `useLiveReviews`).
