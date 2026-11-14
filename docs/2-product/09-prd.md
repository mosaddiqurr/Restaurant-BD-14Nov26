# Product Requirements Document (PRD)

**Product:** [Brand] · **Version:** Draft 1 · **Platform:** mobile-first website (installable); native app later
**Related:** [Vision](../1-business/01-product-vision.md) · [User stories](10-epics-and-user-stories.md) · [Flows](11-user-flows.md) · [Sitemap](12-sitemap.md) · [Billing](13-business-billing-logic.md) · [Data model](15-erd.md)

---

## 1. Goal
Help diners choose where to eat by showing **real menus, real prices, the real place and trusted reviews**, and give restaurants an affordable online presence that brings customers.

## 2. Users
| User | Description |
|---|---|
| **Diner (guest)** | Browses without an account |
| **Diner (registered)** | Saves favourites, writes reviews, follows restaurants |
| **Restaurant owner / staff** | Receives reports; later manages their own page (phase 2) |
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

### 4.2 Restaurant page
| ID | Requirement | Priority |
|---|---|---|
| R-1 | Basic info: name, address, map, phone, hours, price per person, cuisines, facilities | P0 |
| R-2 | **Full menu** with categories, real prices, portion size, spice level, veg/non-veg | P0 |
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

### 4.6 Diner accounts
| ID | Requirement | Priority |
|---|---|---|
| U-1 | Sign up / log in by phone (OTP) and/or Google | P0 |
| U-2 | Save favourite restaurants and dishes | P1 |
| U-3 | Follow restaurants for deals | P1 |
| U-4 | Shareable shortlist with group voting | P2 |
| U-5 | Bill split with bKash / Nagad links | P2 |
| U-6 | Deal and price-drop alerts | P2 |

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
| RD-3 | Self-serve dashboard: menu editor, sold-out toggle, profile, facilities, photos | P2 |
| RD-4 | Dashboard analytics, deals manager, review replies, staff roles | P2 |
| RD-5 | Detailed visit / conversion tracking | P3 |

### 4.10 Admin panel (our team)
| ID | Requirement | Priority |
|---|---|---|
| AD-1 | Create and edit restaurants, branches, menus, dishes, prices, media | P0 |
| AD-2 | Bulk menu entry (paste or upload) | P0 |
| AD-3 | Media upload: photos, videos, 360°, 3D models | P0 |
| AD-4 | Price history saved on every change | P0 |
| AD-5 | Review moderation queue | P0 |
| AD-6 | Deals, featured placement and Deal of the Week management | P0 |
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
QR ordering, call-waiter, table bookings, POS connection, native app, rewards, WhatsApp bot, other business types, cities beyond Dhaka and Bogura.

## 7. Success metrics (targets to confirm)
- Paying restaurants and churn
- Diner visitors, searches, AI chats
- QR scans per restaurant per week
- % of menus updated in the last 30 days (target > 90%)
- Verified reviews per month

## 8. Open questions
Review verification method · 360°/3D capture method · which tiers get video/3D menus · launch scope (P0 vs P1) · tech stack · design system. See [90-decisions-needed.md](../90-decisions-needed.md).
