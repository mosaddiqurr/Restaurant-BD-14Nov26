# khabo website

A working prototype of the khabo website. Plain HTML, CSS and JavaScript, so it opens anywhere with no install.
The real launch version will be rebuilt in Next.js (see [docs/4-tech/17-tech-stack.md](../docs/4-tech/17-tech-stack.md)); this folder is its blueprint.

## Run it

```
python website/serve.py
```

Open http://localhost:8765. For the phone frame: http://localhost:8765/mobile.html.

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
│   ├── core.js         the engine: page switching, the bill, shared helpers
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
├── design-options/     pages for choosing between design ideas (headlines, name animation)
└── future/             prototypes not on the site yet: admin panel, owner dashboard, compare, map
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
