# Future features: clickable prototypes

Front-end only. No backend, no login. Open `future/index.html` through the local server
(`http://localhost:8765/future/`). Everything reads the fictional demo data from
`../data/common.js` and the restaurant files listed in `../restaurants/list.js`.

Edits are saved in the browser's localStorage under keys that start with `kh2.future.`.
The admin panel and the owner dashboard share these keys, so a price changed in one shows in the other
and in Compare. "Reset demo data" in the admin panel clears them.

## Files

| File | What it is |
|---|---|
| `index.html` | Hub page with links to the four prototypes |
| `future.css` | Shared styles (radius: controls 10px, cards 14px, tags 6px) |
| `future.js` | Shared helpers and the small localStorage data layer (`window.F`) |
| `admin.html`, `admin.js` | Admin panel |
| `dashboard.html`, `dashboard.js` | Owner dashboard |
| `compare.html`, `compare.js` | Compare restaurants |
| `map.html`, `map.js` | Map view (Leaflet 1.9.4 from cdnjs, OpenStreetMap tiles) |

---

## 1. Admin panel (`admin.html`)

**PRD:** 4.10, AD-1 to AD-12. **Priority:** P0 (AD-11 Price Index is P1 and not built here).

Sidebar: Restaurants, Menus & prices, Media, Reviews queue, Deals & featured, Plans & billing, Leads,
Reports, Staleness alerts, Team. Each is a tab inside the page (`admin.html#/menus/shahi-handi` and so on).

**Real (from the demo data):** restaurants, areas, plans, ratings, menus, dish prices, photos, deals,
featured flags, 360 rooms, films, 3D dishes, published reviews, list prices from the pricing sheet.

**Works in the prototype (saved in the browser):**
- Restaurant list with search (name, area or dish) and city and plan filters.
- Menu table: inline price edit (Enter saves, Esc cancels, a 50% or bigger change asks first), each change
  writes a price-history entry with old price, new price, source and person; sold-out toggle; bulk paste of
  `Dish name, price` lines with a preview (update, new dish, no change, line to fix); "Mark prices confirmed".
- Reviews queue: approve, reject with a reason, reply as the restaurant, undo, restore.
- Leads kanban (New, Called, Demo, Signed): drag and drop or "Move to" button, add and edit leads, activity log.
- Staleness alerts: menus with no edit or confirmation in 30+ days (14, 45 and 60 also selectable),
  "due in 7 days" list, mark confirmed, snooze 7 days. Editing a price also clears the alert.
- Deals: pause or resume, Deal of the Week per city (Premium deals only). Reports: mark as sent.

**Mocked:** pending reviews and their flags, leads, team members, billing status and payment dates, report
send status, and the "last confirmed" dates used by staleness alerts. These dates are sample values chosen so
some menus are overdue; the diner site shows its own fresher "prices checked" values. Media upload is not built.

**Production needs:**
- Tables (see `docs/15-erd.md`): BRANCH (with `menu_last_verified_at`), MENU_CATEGORY, DISH, DISH_PRICE
  (append-only price history with `changed_by` and `source`), MEDIA, REVIEW, REVIEW_REPLY, DEAL, PLACEMENT,
  PLAN, PLAN_PRICE, SUBSCRIPTION, INVOICE, PAYMENT, LEAD, MONTHLY_REPORT, STAFF_ROLE, USER.
- Auth: staff login with roles admin, sales, content, data entry, moderator (AD-12). The permission grid on the
  Team tab is the proposed starting point. Every write is checked on the server and logged with the user.
- A daily job that finds menus past the staleness limit and notifies the content team.
- File storage and a media pipeline for photos, video, 360 panoramas and 3D models (AD-3).
- Bulk paste parsing on the server too, inside one transaction, so a half-applied paste cannot happen.
- Lead form on the `/business` page writes to LEAD and notifies sales (B-2).

## 2. Owner dashboard (`dashboard.html`)

**PRD:** RD-1 to RD-4. **Priority:** RD-1 monthly report and RD-2 price insights are P0 (sent as a report at
launch); RD-3 menu editor and RD-4 deals and review replies are P2 (self-serve, later).

The switcher at the top shows the dashboard for any restaurant (`dashboard.html?r=kabab-ghor#prices`).
Tabs: Monthly report, Price insights, Menu, Deals, Reviews.

**Real:** price insights use the live demo menus. Each dish is compared per person (sharing dishes divided by
the number they serve) with every dish of the same type at other restaurants in the same city: median, range
and difference. When prices in a group differ more than three times (one shami kabab against a plate of four
skewers) it shows "Portions vary" instead of a misleading percentage. Starter plans see a "comes with Pro"
screen with a preview button, matching the pricing sheet.

**Works:** menu price edits (recorded in price history as "Owner dashboard"), sold-out toggles and "Clear all
sold out", deals (create, edit, pause, delete, with validation), review replies, "Save as PDF" (print),
"Copy for WhatsApp".

**Mocked:** every number in the monthly report (page views, QR scans, call and directions taps, daily chart,
sources, top 5 dishes). They are labelled "Sample" on screen and generated from the restaurant id, so they stay
the same on reload.

**Production needs:**
- EVENT table (page_view, qr_scan, dish_view, call_tap, direction_tap, with source) and a small tracking
  script on restaurant pages and QR menus; MONTHLY_REPORT for the generated snapshot and PDF.
- DISH_TYPE kept tight enough for fair comparisons (for example "beef seekh, 2 skewers" rather than "kebab"),
  or a portion size field to normalise on. PRD RD-2 says "same area"; switch from city to area once each area
  has enough restaurants.
- Auth: owner login by phone OTP, BRANCH_MEMBER with roles owner and manager, one user able to manage several
  branches. Plan checks on the server (insights and deals for Pro and Premium).
- Moderation: owner replies go live directly, reviews still go through the admin queue.

## 3. Compare (`compare.html`)

**PRD:** D-6. **Priority:** P1.

Two or three restaurants side by side: price per person, rating, VAT and service (with what a ৳1,000 bill
comes to), open hours with open now, cheapest main dish (not drinks, desserts or single-piece sides) with its
all-in price, every facility, 360 tour, film and 3D dishes. "Lowest" and "Highest" mark the best value in a row.
Pick restaurants with the selectors; the choice is kept in the URL: `compare.html?ids=shahi-handi,kabab-ghor`.

**Real:** everything on the page comes from the demo data, including any price or sold-out change saved in the
admin panel or dashboard. **Mocked:** nothing.

**Production needs:** a read endpoint that returns the comparison fields for up to 3 branches in one call;
"Add to compare" buttons on restaurant cards and pages; the same "open now" logic as the diner site, using the
restaurant's time zone rather than the device clock.

## 4. Map (`map.html`)

**PRD:** D-7. **Priority:** P1.

Leaflet map with OpenStreetMap tiles. Pins use each restaurant's accent colour; hovering a list row lights up its
pin and hovering a pin lights up the row. Clicking a row flies to the pin and opens a popup with
"Open page" (`../index.html#/r/<id>`) and "Compare" with the nearest restaurant. Filters: city and budget per
person, kept in the URL (`map.html?city=bogura&bud=u600`).

**Real:** names, areas, prices per person, ratings, photos, colours. **Mocked:** pin positions. The
restaurants are fictional, so each pin sits 150 to 600 m from its area centre, in a direction derived from its id.

**Production needs:** `lat`/`lng` on BRANCH (already in the ERD), captured on the sales visit; a tile plan that
fits OpenStreetMap's usage policy (a hosted tile provider or own tiles once traffic grows); marker clustering
when an area has many pins; "near me" with the browser's location, only after the user asks.

---

## Checks done

- `node --check` passes on every JS file.
- Admin, dashboard and compare were opened in headless Microsoft Edge (desktop and 375px wide): no console
  errors, no sideways scrolling.
- All five pages were then clicked through in the desktop app's browser (desktop and 375px wide): price edit and
  history, bulk paste, sold out, review approve, reject and reply, lead moves, staleness confirm and snooze,
  deal create with validation, compare selectors and URL, map hover highlight and popup links. No console errors.
