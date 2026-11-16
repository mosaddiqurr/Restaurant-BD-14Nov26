# Product Requirements Document (PRD)

**Product:** [Brand] · **Version:** Draft 1 · **Platform:** mobile-first website (installable); native app later
**Related:** [Vision](../1-business/01-product-vision.md) · [User stories](10-epics-and-user-stories.md) · [Flows](11-user-flows.md) · [Sitemap](12-sitemap.md) · [Billing](13-business-billing-logic.md) · [Data model](15-erd.md)

---

## 1. Goal
Help diners choose where to eat by showing **real menus, real prices, the real place and trusted reviews**, and give restaurants an affordable online presence that brings customers.

khabo is B2C and B2B: diners use everything free; restaurants are the only ones who pay. Price display rules: [25-design-rules.md](../3-design/25-design-rules.md).

## 2. Users
| User | Description |
|---|---|
| **Diner (guest)** | Browses without an account. Diners (B2C) never pay for anything |
| **Diner (registered)** | Saves favourites, writes reviews, follows restaurants |
| **Restaurant owner / staff** | The paying customer (B2B). Receives reports; later manages their own page (phase 2) |
| **[Brand] admin team** | Sales, content, data entry, moderation, billing |

## 3. Priorities
- **P0:** required at launch
- **P1:** soon after launch (target: within weeks)
- **P2:** phase 2
- **P3:** future

*The split between P0 and P1 is a proposal. Final launch scope is an open founder decision.*

---

## 4. Functional requirements

### 4.1 Discovery & search (diners)
| ID | Requirement | Priority |
|---|---|---|
| D-1 | Search restaurants by name, dish or cuisine, in Bangla or English | P0 |
| D-2 | Filters: city, area, cuisine, budget, **price per person**, occasion, open now, rating, dietary (halal, veg, spice level), facilities (family cabin, prayer room, parking, AC, kids' area, wheelchair access, generator), group size, rooftop/view, buffet, has deals, has 360°/video/3D, newly opened, distance | P0 (core set) / P1 (rest) |
| D-3 | Sort by relevance, price, rating, distance, recently updated | P0 |
| D-4 | **Dish search across restaurants** with price comparison ("Kacchi under ৳400 in Dhanmondi") | P0 |
| D-5 | City, area and cuisine landing pages (SEO-friendly) | P0 |
| D-6 | Compare 2–3 restaurants side by side (prices, facilities, rating) | P1 |
| D-7 | **Home page map:** every partner restaurant pinned at its verified address, labelled with its name; switch city; tap a pin for photo, rating, price per person, open now and a link to the page. Labels never overlap (a hidden label shows on hover/zoom); pins merge into area bubbles once a view holds more than 60 | P0 (founder request, 14 Nov 2026) |
| D-7b | Full map page with filters (budget, cuisine, open now), map on area pages, "near me" | P1 |
| D-8 | **Start from where the user is:** on the first visit, ask once for the phone's location (with a short reason, never on page load before the user sees the site). If they allow it, set the nearest area (e.g. Dhanmondi) as the default for "Open around", the map and search, and show it in the area picker. If they refuse or are outside our cities, keep the current default and never ask again. The user can always change the area; their choice is remembered and wins over the detected one | P1 (founder request, 14 Nov 2026) |
| D-9 | **Price tracker page:** its own page in the main menu. Search a dish (e.g. kacchi) and see its price over time at each restaurant and the area average, plus "biggest rises" and "biggest drops" this month. Uses only real saved price changes (AD-4). The general dish sheet keeps its small six-month price line and links here. A restaurant's own page and QR menu never show price history. Combined with the Food Price Index (C-1) on one page | P1 (founder request, 16 Nov 2026; needs 2 to 3 months of saved prices first) |
| D-10 | **Buffet finder and compare:** every buffet with price per person (and child price), days and times, what is included, photos; compare 2 or 3 buffets. Iftar buffets in Ramadan | P1 (founder request, 16 Nov 2026) |
| D-11 | **Trending this week:** lists made only from real views and QR scans, e.g. "Most viewed dishes in Uttara this week". No list until there is enough real data. Featured items never enter these lists | P1 (founder request, 16 Nov 2026) |
| D-12 | **Events at restaurants:** live music, match screenings, iftar specials, Pohela Boishakh menus. Owners add them from the restaurant panel; they show on the restaurant page and an Events list | P1 (founder request, 16 Nov 2026) |
| D-13 | **How busy right now:** "Quiet / Busy / About 20 min wait", set by owner taps in the panel, later estimated from QR scans. Always shows when it was last updated | P3 (founder request, 16 Nov 2026) |
| D-14 | **Scan a menu:** the diner photographs a paper menu; AI reads the dish names and shows our photos, prices and reviews for those dishes. Works only for restaurants we have | P3 (founder request, 16 Nov 2026) |

### 4.2 Restaurant page
| ID | Requirement | Priority |
|---|---|---|
| R-1 | Basic info: name, address, map, phone, hours, price per person, cuisines, facilities | P0 |
| R-2 | **Full menu** with categories, real prices, portion size ("Serves 1 · 2 pcs mutton", "Serves 4"), spice level (0 to 3), veg/non-veg. Already in the prototype | P0 |
| R-3 | "**Prices updated X days ago**" label; warning if older than a set limit | P0 |
| R-4 | **Menu formats, restaurant's choice:** real photo menu (P0), video dish menu (P1), **3D dish menu** (P1/P2, viewable in browser, no app) | P0–P2 |
| R-5 | Photo gallery: interior, exterior, dishes | P0 |
| R-6 | Promo video: 20–30 sec (Pro), 45–60 sec (Premium) | P0 |
| R-7 | Kitchen photos and video with capture date (no hygiene badge) | P0 |
| R-8 | 360° / virtual tour viewer | P1 |
| R-9 | **Bill calculator:** pick dishes and people; adds VAT and service charge; shows per-person total | P0 |
| R-10 | Verified reviews with rating | P0 |
| R-11 | **Facebook posts about the restaurant:** public posts shown with Facebook's official embed, linking to the original; labelled "From Facebook" and kept separate from verified reviews | P1 |
| R-12 | Deals and offers | P0 |
| R-13 | Call, WhatsApp, directions and share buttons | P0 |
| R-14 | "Featured" and "Founding Partner" labels | P0 |
| R-15 | Bangla / English toggle | P0 |

### 4.3 QR menu & print menu
| ID | Requirement | Priority |
|---|---|---|
| Q-1 | Each restaurant (branch) has a unique QR code and short link (e.g. `/r/restaurant-name`) | P0 |
| Q-2 | QR opens a **lightweight menu view**: fast on slow connections, no app, no login | P0 |
| Q-3 | Printable QR table cards (PDF) with the short link and a one-line Bangla "how to scan" | P0 |
| Q-4 | **Print menu:** generate a printable PDF menu from live data, so paper always matches online | P0 |
| Q-5 | QR scans counted per restaurant (for the monthly report) | P0 |
| Q-6 | NFC table cards using the same link | P2 |
| Q-8 | **Branded QR codes:** the restaurant's logo in the middle of the code, its own colours, and a choice of tested shapes (classic, rounded, dots, leaf, diamond, lines). Used on table cards, the print menu and the restaurant's QR panel. Rules: highest error correction (H) whenever a logo is used; logo covers no more than ~8% of the code; dark code on a white background; every style is test-scanned with ordinary Android and iPhone cameras before cards are printed | P0 (founder request, 14 Nov 2026) |
| Q-9 | Restaurant picks its QR style and uploads its logo from the owner dashboard (concierge sets it at launch) | P1 |
| Q-7 | Order and call-waiter from the table | P3 |

### 4.4 AI assistant
| ID | Requirement | Priority |
|---|---|---|
| A-1 | Chat in Bangla, English and Banglish | P0 |
| A-2 | Answers **only from our database** (restaurants, dishes, prices, facilities); never invents restaurants, dishes or prices | P0 |
| A-3 | **Budget planning:** "৳2,500, 4 people, Dhanmondi" → suggested restaurant + dishes + total including VAT and service charge | P0 |
| A-4 | Group and occasion suggestions ("family of 5, need a cabin") | P0 |
| A-5 | Every answer shows result cards (restaurant, dishes, price, updated date) linking to pages | P0 |
| A-6 | Says "I don't have that information yet" when data is missing | P0 |
| A-7 | Cost control: daily per-user limit, caching common questions, cheaper model for simple queries | P0 |
| A-8 | Log questions (anonymised) to learn what users want and what data is missing | P0 |

### 4.5 Reviews
| ID | Requirement | Priority |
|---|---|---|
| V-1 | Registered diners can write a review with rating and photos | P0 |
| V-2 | **Verified review** label; the verification method is an open decision and may combine several methods | P0 |
| V-3 | Anti-abuse: limits per account / phone / device, suspicious-pattern flags, admin moderation queue | P0 |
| V-4 | Restaurants can reply to reviews | P1 (via admin) / P2 (self-serve) |
| V-5 | Report a review | P0 |
| V-6 | **Voice review in Bangla:** speak the review, it turns into text, the diner checks and edits it before posting. Same rules as typed reviews | P2 (founder request, 16 Nov 2026) |

### 4.6 Diner accounts
| ID | Requirement | Priority |
|---|---|---|
| U-1 | Sign up / log in by phone (OTP) and/or Google | P0 |
| U-2 | Save favourite restaurants and dishes | P1 |
| U-3 | Follow restaurants for deals | P1 |
| U-4 | Shareable shortlist with group voting | P2 |
| U-5 | Bill split with bKash / Nagad links | P2 |
| U-6 | Deal and price-drop alerts | P2 |
| U-7 | **My lists:** make lists ("My top 10 biryani"), rank places in them, share a list by link. Anyone can open a shared list without an account | P2 (founder request, 16 Nov 2026) |
| U-8 | **Friends:** follow friends, see their lists and the places they ranked | P3 |
| U-9 | **Stamp cards:** the diner's free stamp cards from restaurants (see L-1) | P2 |

### 4.7 Content
| ID | Requirement | Priority |
|---|---|---|
| C-1 | **Food Price Index** page: monthly average prices of standard dishes by area; Dhaka and Bogura editions; shareable graphic | P1 |
| C-2 | Seasonal guides (Ramadan iftar & buffet, Eid, Pohela Boishakh) | P1 |
| C-3 | "New this week" restaurants | P1 |

### 4.8 For Restaurants (business) pages
| ID | Requirement | Priority |
|---|---|---|
| B-1 | `/business` page: value, packages, pricing (Dhaka/Bogura), FAQ, sign-up / contact form | P0 |
| B-2 | Lead form saves to the admin panel and notifies the sales team | P0 |

### 4.9 Restaurant reporting & dashboard
| ID | Requirement | Priority |
|---|---|---|
| RD-1 | **Monthly report** per restaurant: page views, QR scans, top 5 dishes viewed, calls/directions taps; sent by WhatsApp/PDF | P0 |
| RD-2 | **Competitor price insights:** compare their dish prices with similar restaurants in the same area | P0 (in report) |
| RD-3 | Self-serve dashboard: menu editor, sold-out toggle, profile, facilities, photos | P0 (moved up 15 Nov 2026) |
| RD-4 | Dashboard analytics, deals manager, review replies, staff roles | P1 (deals and review replies P0) |
| RD-5 | Detailed visit / conversion tracking | P3 |
| RD-6 | **Menu from a photo:** owner or team uploads photos of the paper menu (at sign-up or any time later). AI reads dishes, prices and categories and shows a draft. A person checks and fixes it, then taps Confirm. Nothing goes live without that check. On an update, only changed prices are shown for approval, and each one is saved in price history | P0 (founder request, 16 Nov 2026; works once the Claude API is connected at go-live) |
| RD-7 | **AI price advice:** short tips in the panel and monthly report, made only from our data, e.g. "Your beef tehari is ৳60 above the Dhanmondi average, and its views dropped 20% this month" | P2 (founder request, 16 Nov 2026) |
| RD-8 | **Google Maps and Facebook sync:** owner changes the menu, hours or photos once on khabo and they update on the restaurant's Google Business Profile; new deals and dishes post to their Facebook page. Works after the owner connects their Google and Facebook accounts | P2 (founder request, 16 Nov 2026) |
| RD-9 | **Own web address:** the restaurant's khabo page (already its website in "Your website") can open on its own name, e.g. shahihandi.com, with a small "Made with khabo" line | P2 (founder request, 16 Nov 2026) |

### 4.11 Loyalty, payments and jobs
| ID | Requirement | Priority |
|---|---|---|
| L-1 | **Digital stamp card:** owner sets a card in the panel (e.g. "Buy 5 coffees, get 1 free", which items, expiry). The diner shows their card's code on their phone; staff scan it in the panel and add a stamp. When full, staff tap Redeem. One stamp per visit per day. Free for diners; the restaurant gives the reward. A stamped visit also counts as a verified visit for reviews | P2 (founder request, 16 Nov 2026) |
| PAY-1 | **Pay your bill through khabo:** restaurants that join offer a discount (e.g. 10 to 20%). The diner enters the bill or scans the staff's bill code, sees the discount, and pays by bKash or Nagad through a payment gateway. The gateway pays the restaurant directly minus khabo's cut; khabo never holds the money. No fee for diners, ever | P3 (founder request, 16 Nov 2026; needs a payment gateway) |
| J-1 | **Restaurant job board:** restaurants post jobs (chef, waiter, cashier); people apply free | P3, maybe (founder not sure, 16 Nov 2026) |

### 4.10 Admin panel (our team)
| ID | Requirement | Priority |
|---|---|---|
| AD-1 | Create and edit restaurants, branches, menus, dishes, prices, media | P0 |
| AD-2 | Bulk menu entry (paste or upload) | P0 |
| AD-3 | Media upload: photos, videos, 360°, 3D models | P0 |
| AD-4 | Price history saved on every change | P0 |
| AD-5 | Review moderation queue | P0 |
| AD-6 | Deals, featured placement and Deal of the Week management. Deal order: Premium-plan deals always first, then Pro, then Starter; the team reorders inside each plan (see design rules section 6) | P0 |
| AD-7 | Plans, subscriptions, invoices, payments, trial and grace status | P0 |
| AD-8 | Leads (restaurant sign-ups) pipeline | P0 |
| AD-9 | Monthly report generation | P0 |
| AD-10 | Staleness alerts: menus not updated in 30+ days | P0 |
| AD-11 | Food Price Index generation | P1 |
| AD-12 | Team roles: admin, sales, content, data entry, moderator | P0 |

---

## 5. Non-functional requirements
| Area | Requirement |
|---|---|
| **Performance** | Restaurant and QR menu pages load fast on 3G and low-end Android phones |
| **Mobile-first** | Designed for phones first; installable (add to home screen) |
| **Language** | Full Bangla and English; Bangla fonts must render correctly |
| **SEO** | Indexable pages with clean URLs: `/dhaka/dhanmondi/restaurant-name` |
| **Accessibility** | Large tap targets, readable text, works for older users |
| **Media** | Optimised images and streamed video; 360° and 3D viewable in the browser without an app |
| **Security** | Role-based admin access, secure login, backups (detailed in a later Security Plan) |
| **Privacy** | Minimal personal data; clear privacy policy |
| **Trust** | Paid placement always labelled "Featured" |
| **Reliability** | Daily backups; error monitoring |
| **Scale** | Built for thousands of branches across all 64 districts, not for today's dozen. Every page is driven by data: adding a restaurant, area or city means adding records, never writing page code. Lists and maps load in pages or on demand. The map clusters pins once a view holds more than 60. Shared parts (QR renderer, map, cards, filters) are written once and reused everywhere |
| **Location accuracy** | Each branch's map pin is placed by our team at onboarding (dropped on the real entrance and confirmed by the owner). It is never only geocoded from the typed address, because Bangladeshi addresses often geocode to the wrong road |

---

## 6. Out of scope for launch
QR ordering, call-waiter, table bookings, POS connection, native app, rewards, WhatsApp bot, other business types, cities beyond Dhaka and Bogura. Also later: how busy now, scan a menu, my lists and friends, stamp cards, voice reviews, pay the bill through khabo, job board. How each one will be built: [27-new-features-brief.md](27-new-features-brief.md).

## 7. Success metrics (targets to confirm)
- Paying restaurants and churn
- Diner visitors, searches, AI chats
- QR scans per restaurant per week
- % of menus updated in the last 30 days (target > 90%)
- Verified reviews per month

## 8. Open questions
Review verification method · 360°/3D capture method · which tiers get video/3D menus · launch scope (P0 vs P1) · tech stack · design system. See [90-decisions-needed.md](../90-decisions-needed.md).
