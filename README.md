# khabo

Restaurant discovery for Bangladesh: real menus, real prices, 360° looks inside.

Free for diners (B2C). Restaurants pay a monthly plan (B2B), and they are our only paying customers. Rules for building: [CLAUDE.md](CLAUDE.md).

The main folder is the website itself (Next.js + TypeScript): the diner site, the owner panel, the khabo team panel and the QR table menu. How it is built: [BUILDING.md](BUILDING.md).

## Run it on this computer

```
npm install
npm run dev -- -p 3100
```

Open http://localhost:3100 (it goes to /en or /bn).

## Put it online

Connect this GitHub repo to Netlify. Netlify reads `netlify.toml`, builds the site and puts it online. After that, every push to `main` goes live by itself, and Netlify keeps every past version, so you can go back to an older one with one click.

## Folder map

```
Restaurant/
├── README.md          you are here
├── CLAUDE.md          rules for building: business model, prices, look
├── BUILDING.md        how the website is built
├── netlify.toml       how Netlify builds and publishes the site
├── app/               the pages (/en and /bn)
├── components/        the parts pages are made of
├── lib/               data loading and shared helpers
├── data/catalog/      demo data: every restaurant, menus, prices
├── messages/          every word in English and Bangla
├── public/            photos, films, 360 tours, icons, the offline helper
├── styles/            the look
├── scripts/           small helper scripts
├── docs/              plans and research (start at docs/00-document-index.md)
└── archive/           old files not used any more
    └── prototype/     the first prototype in plain HTML, kept as a reference
```

The old prototype still opens on its own: `python archive/prototype/serve.py`, then http://localhost:8765.
