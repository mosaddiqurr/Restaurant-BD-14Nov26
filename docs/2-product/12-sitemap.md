# Sitemap & Information Architecture

URLs are examples; `[brand-domain]` is not decided. Every public page has Bangla and English versions (e.g. `/bn/...` and `/en/...`, or a language toggle; to be decided with the tech stack).

---

## 1. Public website (diners)
```
/                                   Home: search bar, AI assistant entry, popular areas, cuisines, map of every partner restaurant, deals, Deal of the Week, Food Price Index highlight
├── /search?q=&filters              Search results (restaurants + dishes tabs), filters, sort, map view (P1)
├── /dishes/{dish}                  Dish across restaurants with price comparison (e.g. /dishes/kacchi)
├── /{city}                         City page (e.g. /dhaka, /bogura)
│   ├── /{city}/{area}              Area page (e.g. /dhaka/dhanmondi)
│   │   └── /{city}/{area}/{restaurant}     Restaurant page
│   │        ├── #menu              Menu (photo / video / 3D) + updated date
│   │        ├── #bill              Bill calculator
│   │        ├── #media             Promo video, photos, kitchen, 360° tour
│   │        ├── #reviews           Verified reviews + Facebook posts
│   │        ├── #deals             Deals
│   │        └── #info              Hours, facilities, map, contact
│   └── /{city}/cuisine/{cuisine}   Cuisine in a city (e.g. /dhaka/cuisine/chinese)
├── /occasions/{occasion}           e.g. family dinner, birthday, iftar, office party
├── /compare?ids=                   Compare restaurants (P1)
├── /ask                            AI assistant (full page)
├── /deals                          All deals, Deal of the Week
├── /prices                         Price tracker: dish prices over time, area averages, rises and drops (P1); Food Price Index is a tab here
│   └── /prices/index/{city}/{month}
├── /buffets                        Buffet finder and compare (P1)
├── /events                         Events at restaurants (P1)
├── /trending                       Trending this week, from real views and QR scans (P1)
├── /l/{list-id}                    A shared diner list, opens without an account (P2)
├── /guides/{guide}                 Seasonal guides (iftar, Eid) (P1)
├── /new                            New restaurants (P1)
├── /account                        Diner account
│   ├── /account/saved              Saved restaurants and dishes (P1)
│   ├── /account/reviews            My reviews
│   ├── /account/following          Followed restaurants (P1)
│   ├── /account/lists              My lists (P2)
│   └── /account/cards              My stamp cards (P2)
├── /login  /signup
├── /about  /contact  /help
└── /legal/terms  /legal/privacy  /legal/review-policy
```

## 2. QR / short-link pages (lightweight)
```
/r/{restaurant-slug}                QR menu view: fast, minimal, no login
/r/{restaurant-slug}/print          Printable menu (PDF)
```

## 3. For Restaurants (business)
```
/business                           Value, how it works, packages, Dhaka/Bogura pricing, FAQ
├── /business/pricing
├── /business/signup                Interest form → leads in admin
└── /business/founding-partners     Founding offer (if approved)
```

## 4. Restaurant dashboard (phase 2)
```
/dashboard                          Overview: views, QR scans, top dish
├── /dashboard/menu                 Menu editor, sold-out toggle
├── /dashboard/profile              Info, hours, facilities, VAT / service charge
├── /dashboard/media                Photos, videos
├── /dashboard/reviews              Read and reply
├── /dashboard/deals                Create deals
├── /dashboard/reports              Monthly reports, competitor price insights
├── /dashboard/qr                   Download QR cards, print menu
├── /dashboard/billing              Plan, invoices, pay
└── /dashboard/team                 Staff logins
```

## 5. Admin panel (our team)
```
/admin
├── /admin/restaurants              Restaurants, branches, status
│   └── /admin/restaurants/{id}     Info · menu & prices · media · facilities · QR · deals · reviews · billing · reports
├── /admin/menus/bulk               Bulk menu entry
├── /admin/media                    Media library
├── /admin/reviews                  Moderation queue
├── /admin/facebook-posts           Approve linked Facebook posts (P1)
├── /admin/deals                    Deals, Deal of the Week, featured placement
├── /admin/leads                    Sales pipeline
├── /admin/billing                  Plans, subscriptions, invoices, payments, overdue
├── /admin/reports                  Monthly report generation
├── /admin/price-index              Food Price Index (P1)
├── /admin/stale                    Menus not updated in 30+ days
├── /admin/locations                Cities, areas
├── /admin/taxonomy                 Cuisines, facilities, occasions, dish types
├── /admin/ai-logs                  AI question logs (anonymised)
└── /admin/users                    Team members and roles
```

## 6. Main navigation (diner site)
**Header:** Logo · Search · Ask AI · Deals · Language (বাংলা / EN) · Log in
**Footer:** About · Food Price Index · Areas · Cuisines · Help · For Restaurants · Terms · Privacy
**Mobile bottom bar:** Home · Search · Ask AI · Deals · Account
