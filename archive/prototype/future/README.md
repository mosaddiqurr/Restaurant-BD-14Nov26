# Future features: clickable prototypes

Front-end only. No backend, no login. Open `future/index.html` through the local server
(`http://localhost:8765/future/`). Everything reads the fictional demo data from
`../data/common.js` and the restaurant files listed in `../restaurants/list.js`.

The admin panel and the owner dashboard that used to live here moved to `website/panel/` (with sign-in) on 15 Nov 2026.
This folder keeps the prototypes that are not built yet: Compare and Map.

## Files

| File | What it is |
|---|---|
| `index.html` | Hub page with links to the prototypes |
| `future.css` | Shared styles (radius: controls 10px, cards 14px, tags 6px) |
| `future.js` | Shared helpers and the small localStorage data layer (`window.F`) |
| `compare.html`, `compare.js` | Compare restaurants |
| `map.html`, `map.js` | Map view (Leaflet 1.9.4 from cdnjs, OpenStreetMap tiles) |

---

## 1. Compare (`compare.html`)

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

## 2. Map (`map.html`)

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
