# khabo

Restaurant discovery for Bangladesh: real menus, all-in prices, 360° looks inside.

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

## Folder map

```
Restaurant/
├── README.md                 you are here
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
    ├── design-options/       pages for choosing between design ideas
    └── future/               prototypes not on the site yet (admin, owner dashboard)
```
