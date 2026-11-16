# khabo

Restaurant discovery for Bangladesh: real menus, real prices, 360° looks inside.

Free for diners (B2C). Restaurants pay a monthly plan (B2B), and they are our only paying customers. Rules for building: [CLAUDE.md](CLAUDE.md).

The project has two folders:

| Folder | What is in it |
|---|---|
| [`docs/`](docs/00-document-index.md) | Plans and research: business, product, design, tech. Start with [`docs/00-document-index.md`](docs/00-document-index.md). |
| [`website/`](website/README.md) | The khabo website: all the code, every restaurant, the 360 tours. |

## See the website

```
python website/serve.py
```

Then open http://localhost:8765 (phone frame: http://localhost:8765/mobile.html).
Admin and restaurant panels: http://localhost:8765/panel/

## Folder map

```
Restaurant/
├── README.md                 you are here
├── CLAUDE.md                 rules for building: business model, prices, look
├── docs/                     plans and research
│   ├── 00-document-index.md  list of every document
│   ├── 90-decisions-needed.md
│   ├── 1-business/           vision, business model, competitors, pricing, sales
│   ├── 2-product/            PRD, user stories, user flows, sitemap, roadmap, database
│   ├── 3-design/             design explorations and colour themes
│   ├── 4-tech/               tech stack
│   └── _archive/             older versions, kept for reference
└── website/                  the khabo website (see website/README.md)
    ├── index.html            the site
    ├── restaurants/          one folder per restaurant
    ├── data/                 shared lists: areas, dish types, facilities
    ├── code/                 how the site works
    ├── styles/               how the site looks
    ├── media/                3D dish models
    ├── panel/                admin and restaurant panels (sign in: admin/admin, client1/client1)
    ├── design-options/       pages for choosing between design ideas
    └── future/               prototypes not built yet (compare, map)
```
