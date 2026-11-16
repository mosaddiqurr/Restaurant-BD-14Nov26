# khabo website

A working prototype of the khabo website. Plain HTML, CSS and JavaScript, so it opens anywhere with no install.
The real launch version will be rebuilt in Next.js (see [docs/4-tech/17-tech-stack.md](../docs/4-tech/17-tech-stack.md)); this folder is its blueprint.

## Run it

```
python website/serve.py
```

Open http://localhost:8765. For the phone frame: http://localhost:8765/mobile.html.

## Which files are the site (since 16 Nov 2026)

- **index.html + app/app.js + app/app.css**: the main site in the final green design (React from a CDN, no build). It reads the same data as before: `restaurants/*/restaurant.js`, `data/common.js` and `code/i18n.js`.
  Pages: `#/` home, `#/restaurants`, `#/dishes`, `#/deals`, `#/prices` (price tracker and Food Price Index), `#/events`, `#/r/<id>`, `#/business`, `#/partner` (owner overview, menu and prices, reviews), `#/admin/deals` (khabo team: deal order).
- **data/prices.js**: six months of demo price history (made from the menus by a script; demo only). Price changes saved in the panels are added on top.
- **Events** live on each restaurant (`events: [...]` in its restaurant.js, or added in the panel under Events). They hide by themselves after they end.
- **panel/menuphoto.js**: "Upload menu photo" in Menu & prices (owner and admin). Prototype uses a sample photo and a ready-made draft, no AI call yet. **panel/events.js**: the Events screen.
- **classic.html + code/ + styles/**: the earlier design. Still used for the table menu (`#/t/<id>`) and the printable menu (`#/r/<id>/print`); index.html sends those links there, so printed QR codes keep working.
- **panel/**: the full partner and admin panel (now in green). Admin has a new "Deal order" page. Owner changes made on `#/partner` save to the same place as the panel (`khabo.panel.v1` in this browser).
- **design-options/final.html**: the same app with the preview rail (laptop/phone, light/dark, language, compare designs).

Admin and restaurant panels: http://localhost:8765/panel/ (also linked as "Partner sign in" in the site footer).

| Username | Password | Sees |
|---|---|---|
| `admin` | `admin` | Master: everything, including team accounts and money |
| `manager` / `support` / `sales` / `finance` | same as the username | The other khabo team levels, each with less access |
| `client1` | `client1` | Shahi Handi House only |
| `client2` | `client2` | Kathgolap Rooftop only |
| `client3` | `client3` | Cha Adda only |

Who can change what: [docs/4-tech/18-security-and-access.md](../docs/4-tech/18-security-and-access.md).

Changes made in the panels are saved in this browser and show on the website straight away (refresh the site tab).
"Reset demo data" (admin > Activity) undoes everything.

## What is where

```
website/
├── index.html          the website (every page lives inside it)
├── mobile.html         the same site inside a phone frame
├── serve.py            starts the local server
│
├── restaurants/        ONE FOLDER PER RESTAURANT
│   ├── list.js         the list of restaurants on the site
│   ├── shahi-handi/
│   │   ├── restaurant.js   details, hours, prices, photos, menu, 360 rooms, reviews
│   │   └── 360/            the 360° room photos for its virtual tour
│   ├── kathgolap/
│   └── ...
│
├── data/
│   └── common.js       shared lists: cities and areas, dish types and how each is made,
│                       facilities, budgets, and the helpers every restaurant.js uses
│
├── code/               how the site works
│   ├── core.js         the engine: page switching, the bill, shared helpers (the deal ticket and gold seal live here too)
│   ├── i18n.js         every word on the site in English and Bangla
│   ├── ai.js           Ask khabo (the AI planner)
│   ├── pano.js         the 360° viewer
│   ├── media.js        film player, photo viewer, 3D dish viewer
│   ├── map.js, qr.js, motion.js, icons.js
│   └── pages/          one file per page
│       ├── home.js         home page
│       ├── listing.js      Restaurants and Dishes pages
│       ├── restaurant.js   a restaurant's page
│       ├── dish.js         the dish pop-up
│       ├── table.js        the QR table menu
│       ├── more.js         deals, for restaurants, account, AI
│       └── parts.js        cards shared by many pages
│
├── styles/             how the site looks (one file per area, plus motion.css for animation)
├── media/              3D dish models
├── panel/              ADMIN AND RESTAURANT PANELS (sign in at panel/index.html)
│   ├── store.js        accounts, team levels, sign-in safety, saved changes, activity log (the stand-in for a database)
│   ├── app.js          login, sidebar, page switching, shared pieces
│   ├── rest.js         pages for one restaurant: menu, page, photos, deals, reviews, table QR, insights, team, admin settings
│   ├── site.js         "Your website": link, QR, door stickers, where to share
│   ├── print.js        the 12 print menu designs
│   ├── admin.js        pages only the khabo team sees: restaurants, team and users, reviews, billing, leads, site text, activity
│   └── panel.css, print-menu.css, sticker.css   how the panels, menus and stickers look
├── design-options/     pages for choosing between design ideas (headlines, name animation)
└── future/             prototypes not built yet: compare, map
```

## Add a restaurant

1. Copy a restaurant folder in `restaurants/` (for example `shahi-handi`) and rename it, e.g. `my-new-place`.
2. Open `my-new-place/restaurant.js` and change the details, menu and reviews. Notes at the top explain each helper.
3. Put its 360° room photos in `my-new-place/360/` (optional).
4. Add `'my-new-place'` to the list in `restaurants/list.js`.

Refresh the site: the restaurant shows up everywhere (search, listings, dishes, AI, map) on its own.

## Good to know

- All restaurants, reviews and prices are made up for the demo. Photos are from Unsplash, 360 rooms from Poly Haven, films from Mixkit.
- Every page works in English and Bangla, light and dark.
