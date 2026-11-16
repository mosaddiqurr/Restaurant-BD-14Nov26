# Design Exploration Prompts (v2)

Prompts for another AI session to explore, show and rank design options before anything is built.

## How to use
Paste these **in order, in the same conversation**:

| Step | Paste | What you get |
|---|---|---|
| 0 | **Context Pack** | The AI learns the whole product. No output needed. |
| 1 | **Prompt A: Directions** | 10 visual directions, 10+ colour palettes, 10 Bangla + English font pairings, motion ideas, all scored and ranked |
| 2 | **Prompt B: Visual Demo** | One interactive HTML page to switch between the top 3–5 directions and see them live |
| 3 | **Prompt C: Critic** | An independent, strict ranking and a single recommendation |
| 4 | **Prompt D: Design System Hand-off** | The chosen direction written up as a design system (colours, fonts, spacing, components, motion rules) to bring back for building |

**Attach** your reference images (painted coastline footer, blue engraved-town footer) in Steps 0, 1 and 2.
**Bring back** to the build session: the output of Prompt D plus the demo HTML file from Prompt B.

---

## Step 0: Context Pack

```text
I'm going to ask you for design work in several steps. First, read and remember this context. Reply only "Context received" and a 5-line summary of what you understood.

=== PRODUCT ===
Name: not decided yet. Use "[Brand]" or a tasteful placeholder wordmark. Name options under consideration: Khabo (খাবো, "I'll eat"), Bhoj (ভোজ, "feast"), Dekho (দেখো, "Look!"), Mela (মেলা, "fair"), Khojo (খোঁজো, "Search!"). The design must work with any short one-word name.
What it is: Bangladesh's dine-in restaurant discovery platform.
One line: "See the real menu, real prices and the real place before you go."
Category: Bangladesh's dine-in discovery network. Competitors sell restaurants software; we bring restaurants customers and trust.
Core word: REAL. Real menus, real prices, real photos, real reviews. Never fake (no AI-faked food or interiors, no fake reviews).
Long-term vision: all 64 districts of Bangladesh, then other local businesses (cafés, bakeries, salons, shops). The identity must be able to grow beyond food.

=== MARKETS ===
Launch: Dhaka (Dhanmondi, Gulshan, Banani, Mirpur, Uttara and other areas) and Bogura (Jaleshwaritola).

=== USERS ===
1) Diners (free): families, friend groups, young professionals, students, office groups. Mostly on mid-range or budget Android phones, sometimes on slow mobile data. Many prefer Bangla; many mix Bangla and English ("Banglish"). Older users must find it easy.
2) Restaurant owners (paying customers): busy, often not tech-savvy, mainly on phones.
3) Our internal team (admin panel).

=== DINER FEATURES ===
- Search restaurants and dishes in Bangla or English, with MANY filters: city, area, cuisine (Bengali, Chinese, Thai, Indian, fast food, café…), budget, price per person, occasion (family dinner, birthday, iftar, date, office party), open now, rating, dietary (halal, veg, spice level), facilities (family cabin, prayer room, parking, AC, kids' area, wheelchair access, generator), group size, rooftop/view, buffet, has deals, has 360°/video/3D, newly opened, distance.
- Dish search with price comparison across restaurants ("Kacchi under ৳400 in Dhanmondi").
- Restaurant page: full menu with real prices and "prices updated X days ago"; each restaurant chooses its menu format: real photo menu, video dish menu or 3D dish menu (rotatable in the browser, no app); 20–30 sec promo video (45–60 sec for Premium); professional kitchen photos/video with capture date (no hygiene badge); 360° virtual tour; photo gallery; facilities; hours; map; call/WhatsApp/directions.
- Bill calculator: pick dishes and people → subtotal, VAT, service charge, total, per person.
- AI assistant in Bangla, English and Banglish: e.g. "৳২,৫০০, ৪ জন, ফ্যামিলি, ধানমন্ডি" → suggested restaurant + dishes + total that fits the budget. Answers only from our real data, shown as result cards.
- Verified reviews (labelled), plus public Facebook posts about the restaurant shown via the official embed, labelled "From Facebook".
- Deals and offers; "Deal of the Week"; "Featured" restaurants (always labelled).
- Compare restaurants side by side; save favourites; follow restaurants.
- Monthly Food Price Index (e.g. average Kacchi price by area), with shareable graphics for press and social media.
- Seasonal guides: Ramadan iftar & buffets, Eid, Pohela Boishakh.
- Table QR menu: scanned at the restaurant table; must open almost instantly on a cheap phone; a short web link for people who can't scan; NFC tap cards later. Restaurants can also print a paper menu generated from the same live data.

=== RESTAURANT SIDE (paid) ===
Packages per month (Dhaka / Bogura): Starter ৳1,999 / ৳1,499 · Pro ৳4,999 / ৳4,499 (Most Popular) · Premium ৳9,999 / ৳9,499.
They get: their page, professional photos, QR table cards, print menu, verified reviews, monthly report (views, QR scans, top dishes), competitor price insights, promo video, 360°, kitchen media, deals, featured placement, Deal of the Week, social promotion. A "For Restaurants" section (/business) sells this. A self-serve owner dashboard comes later.

=== SITE STRUCTURE (main pages) ===
Home · Search results · Dish comparison · City / Area / Cuisine / Occasion pages · Restaurant page · AI assistant · Deals · Food Price Index · Compare · Account (saved, reviews) · QR menu (lightweight) · For Restaurants (/business, pricing, sign-up) · Help, About, Legal.
Mobile bottom bar: Home · Search · Ask AI · Deals · Account.

=== TECH (decided) ===
Website: Next.js (React, TypeScript), hosted on Cloudflare Workers. Backend: Supabase (PostgreSQL). Cloudflare in front; media on Cloudflare R2.
Motion/3D likely via GSAP or Motion (Framer Motion), Three.js or <model-viewer> for 3D dishes, Pannellum for 360° tours. React component libraries such as 21st.dev are usable.
Design outputs must be implementable in React/Next.js: express colours, type and spacing as design tokens (CSS variables).

=== DESIGN AMBITION ===
Award-level (Awwwards / FWA calibre), premium, nothing like any Bangladeshi website so far. Memorable in the first 3 seconds on a phone. 3D, motion, kinetic typography and rich illustration are welcome. It must NOT look like a template or "AI slop" (no generic purple gradients, random glassmorphism, emoji icons, stock-looking layouts).
Founders love rich, illustrated, place-based scenes like the attached reference footers: (1) a painterly aerial coastline with a sailboat, trees and white text over it; (2) a detailed blue engraving/toile-style hillside town and river on cream with elegant serif text. A Bangladesh-specific version could show Old Dhaka, rivers and boats, rickshaws, tea stalls, Bogura's Mahasthangarh terracotta heritage, but judge whether it serves the product.

=== NON-NEGOTIABLE CONSTRAINTS ===
1. Bangla + English everywhere, with a language toggle. Bangla fonts must render conjuncts correctly, have several weights, and be free/affordable for the web. Never uppercase or letter-space Bangla; Bangla needs more line-height than Latin. Bangla numerals in Bangla mode (৳ ১,২৫০).
2. Mobile-first and fast. Heavy 3D/motion only where it creates a wow moment (homepage hero, 3D dish viewer, footer scene). The QR menu page must be extremely light. Respect "reduce motion". Good on mid-range Android over slow data.
3. Food photography is the hero of restaurant and menu pages; the UI frames photos and never competes with them.
4. Prices, filters and reviews must be crystal clear and trustworthy. WCAG AA contrast; tap targets ≥ 44px.
5. Light mode required; dark mode where it fits.
6. Paid placement is always visibly labelled "Featured".
```

---

## Prompt A: Directions, Palettes, Fonts and Ranking

```text
Act as a world-class design team: creative director, brand strategist, senior product designer, motion designer and native Bangla typography specialist, with decades of experience shipping award-winning consumer products (Apple, Airbnb, Linear, Stripe-level craft). Be opinionated and specific. Never give generic "modern and clean" answers. Use the Context Pack above.

STEP 1: Research (brief)
a) What do the best food, discovery and travel products do well (e.g. Airbnb, Resy, Zomato/District, Tabelog, award-winning restaurant sites), and what do Bangladeshi websites usually get wrong?
b) Evaluate these UI resources: which are worth using, and for what (navbars, footers, CTAs, components, motion, 3D icons, backgrounds, brand guidelines)? Say honestly if you cannot open one. ui.wensity.com, appllama.io, motionsites.ai, studio.motionsites.ai, recent.design, scrolltide.co, inspora.design, styleslibrary.site, navbar.gallery, footer.design, cta.gallery, styles.refero.design, 3dicons.co, supahero.io, glass.samasante.com, jiro.build, minimal.gallery, kage.design, component.gallery, designmd.ai, 21st.dev, vibeprompts.dev, mobbin.com, backgrounds.supply, brandguidelines.net.

STEP 2: 10 visual directions
Give 10 truly distinct directions. Seeds you may use, change or reject:
 1. Rickshaw Art Modern: vivid hand-painted rickshaw-art motifs (UNESCO-recognised) made premium
 2. Engraved Bengal: indigo engraving illustrations on warm cream (Bengal indigo history), elegant serif, river and Old Dhaka scenes
 3. Spice Market Night: premium dark UI, saffron/turmeric/chilli accents, dramatic food photography, 3D dish hero
 4. Monsoon Fresh: greens, river teal, rain, light and airy
 5. Terracotta Heritage: clay and terracotta inspired by Mahasthangarh/Paharpur (Bogura heritage)
 6. Nakshi Kantha Thread: stitch lines and quilt patterns as UI details and motion
 7. Editorial Food Magazine: big type, generous whitespace, magazine layouts
 8. Night Market Neon: street-food night energy, warm neon on deep tones
 9-10. Two wildcards of your own
For EACH direction:
 - Name, one-line idea, emotion it creates, who it appeals to most
 - Moodboard: imagery, textures, illustration style, photography style
 - Colour palette with HEX and roles: background, surface, elevated surface, text primary, text secondary, brand primary, accent, price highlight, success/verified, warning (stale price), error, border, focus ring. Light AND dark variants. Contrast ratios for text pairs.
 - Typography: English display + body, Bangla display + body; weights; mobile and desktop sizes; Bangla line-heights; licence
 - Signature motion and 3D moments (hero, scroll, page transitions, micro-interactions, loading states) and how each degrades on slow phones or with reduced motion
 - Mobile hero concept: exact layout and what happens in the first 3 seconds. Desktop hero too.
 - Iconography and illustration; footer concept (illustrated scene?)
 - How these look in this style: restaurant card, filter chips, menu list with prices, 3D dish viewer, bill calculator, AI chat result card, QR menu page, Food Price Index chart, "For Restaurants" pricing table
 - Risks: dated, cheap, hard to read, slow, too food-only for future expansion, culturally off

STEP 3: Extra palettes
Beyond the 10 directions, give 5 additional standalone palettes (HEX + roles, light/dark) that could pair with any layout. Rank all palettes for appetite appeal, trust, uniqueness and accessibility.

STEP 4: 10 Bangla + English font pairings
Rank them. For each: fonts and weights, licence, why they pair well, Bangla rendering quality (conjuncts, numerals, ৳ sign), personality, and best use (display / body / UI). Consider Noto Sans/Serif Bengali, Hind Siliguri, Anek Bangla, Tiro Bangla, Baloo Da 2, Galada, Mina, Atma and others, with strong Latin partners. Verify Bangla support before recommending. Show sample lines as text:
 "আসল মেনু, আসল দাম — যাওয়ার আগেই দেখুন"
 "Real menu. Real price. Before you go."
 "কাচ্চি বিরিয়ানি — ৳ ৩৮০ · Kacchi Biryani — ৳380"

STEP 5: Scoring and ranking
Score all 10 directions 1–10 on: first impression (3 sec, phone), uniqueness in Bangladesh, premium feel, food appetite appeal, Bangla typography quality, readability and trust, mobile performance safety, scalability to other businesses, timelessness (2+ years), buildability by a small team in Next.js. Table with totals, then ranking. Recommend a TOP 3 (or a hybrid) and the one you'd bet the company on, with reasons a non-designer founder understands.

STEP 6: Signature ideas
List 15 "signature moments" that could make the site famous (e.g. a kinetic Bangla headline, a 3D dish you can spin, a live price ticker for the Food Price Index, an illustrated footer of Old Dhaka that changes with the time of day), each rated for impact vs build effort vs performance cost.

STEP 7: The 15 most common mistakes to avoid for this product's design.

Format: clear sections and tables. No code yet.
```

---

## Prompt B: Visual Demo (interactive comparison page)

```text
Using the Context Pack and your top 3 (or up to 5) directions from Prompt A, build ONE self-contained interactive HTML file (libraries only from a reliable CDN with pinned versions) that lets the founders SEE and COMPARE the directions. It is a decision tool, but it must look award-level, never like a template.

SWITCHER: a fixed, elegant control to switch Direction 1/2/3(/4/5) · Light/Dark · বাংলা/English. Switching animates smoothly and changes colours, fonts, illustration style and motion style.

SECTIONS (one scrolling page, mobile-first, also great on desktop):
 a. Homepage hero: the first 3 seconds must impress (kinetic Bangla/English headline, subtle 3D or parallax, illustrated scene). Search bar with placeholder "কাচ্চি, ধানমন্ডি, ৳৫০০-এর মধ্যে…" / "Kacchi in Dhanmondi under ৳500…" and an "Ask AI" entry. Mobile bottom bar.
 b. Filter chips + results: 3 restaurant cards (photo, name, area, cuisines, price per person, rating with "Verified", "prices updated 3 days ago", facility icons like family cabin and prayer room); one card labelled "Featured".
 c. Dish comparison: "Kacchi Biryani" across 4 restaurants, sorted by price.
 d. Restaurant page: header with promo-video placeholder, tabs (Menu, Photos & Video, 360° Tour, Kitchen, Reviews, Deals, Info); menu categories; dishes with prices (Bangla numerals in Bangla mode), portion, spice level, veg/non-veg; one dish with a "3D" button that opens a simple rotating 3D placeholder; switch between photo / video / 3D menu formats.
 e. Bill calculator: dishes × people → subtotal, VAT, service charge, total, per person.
 f. AI assistant: the user writes "৳২,৫০০, ৪ জন, ফ্যামিলি, ধানমন্ডি"; the AI replies with a meal-plan card (restaurant, dishes, quantities, total within budget, updated date).
 g. Reviews: verified reviews and one "From Facebook" post card.
 h. QR table menu (mobile): ultra-light, clear, fast.
 i. Food Price Index: Kacchi average price by area chart with a shareable-graphic look.
 j. For Restaurants: pricing table (Starter / Pro "Most Popular" / Premium, Dhaka and Bogura prices).
 k. Footer: a rich illustrated Bangladeshi scene in the direction's style (inspired by the attached references), with columns Explore / For Restaurants / Company / Legal, and a newsletter field.

CONTENT: realistic but invented restaurant names; real dish names (Kacchi Biryani, Beef Tehari, Morog Polao, Shorshe Ilish, Fuchka, Borhani, Chicken Chap, Naan); real Dhaka/Bogura areas; realistic prices. Food photos: tasteful placeholders clearly marked as placeholders.

QUALITY RULES: correct Bangla fonts, generous Bangla line-height, no uppercase or letter-spacing on Bangla; honour prefers-reduced-motion; keep heavy effects to the hero, 3D dish and footer; AA contrast; visible focus states; tap targets ≥ 44px; smooth on a mid-range phone.
Under each section add a small caption: "What this direction does here and why."
Polish spacing, icons, hover and press states and transitions like a top studio's pitch.
```

---

## Prompt C: Critic & Ranking

```text
Now act as an independent, tough review panel: an Awwwards jury member, a senior product designer from a top consumer app, a performance engineer focused on low-end Android phones in South Asia, a native Bangla typographer, and a restaurant owner in Dhaka. Review the directions from Prompt A and the demo from Prompt B (screenshots or HTML attached).

For each direction:
1. Score 1–10 with a one-line reason on: first impression (3 sec, phone), originality in Bangladesh, premium feel, food appetite appeal, Bangla typography correctness, readability of prices and filters, trust, accessibility, real-world mobile performance, scalability to other businesses, timelessness, buildability in Next.js by a small team, and how a restaurant owner would feel being listed there.
2. Three biggest strengths and three biggest risks.
3. Any Bangla rendering or font problems, specifically.
4. What would make it a 10.

Then: a final ranked table; ONE recommended direction (or a precise hybrid), explained in plain language; the final palette (HEX + roles, light/dark), the Bangla + English font pairing, and the 5 signature motion/3D moments to build first; and a list of what the founders must decide themselves. Be honest; do not just praise.
```

---

## Prompt D: Design System Hand-off (after the founders choose)

```text
The founders chose: [write the chosen direction or hybrid here, plus any changes they want].

Write the complete design system for building it in Next.js (React, TypeScript). Output:
1. Design tokens as CSS variables AND JSON: colours (light/dark, with roles), typography scale (English and Bangla separately: families, weights, sizes, line-heights, letter-spacing rules), spacing scale, radii, shadows/elevation, borders, z-index, breakpoints, motion durations and easing curves.
2. Font loading plan: which files/weights, subsetting for Bangla, fallbacks, performance budget.
3. Component specs (anatomy, states, variants, sizes, Bangla/English behaviour, accessibility): buttons, inputs and search bar, filter chips, tabs, restaurant card, dish row (photo/video/3D variants), price display (৳, Bangla numerals, "updated X days ago", stale warning), rating and Verified badge, Featured label, deal card, bill calculator, AI chat bubble and result card, review card, Facebook post card, map/location block, 360° and 3D viewer frames, bottom navigation, header, footer (illustrated scene), modal/sheet, toast, empty/loading/error states, pricing table, QR table card (print), printable menu (A4).
4. Motion system: signature hero animation, page transitions, micro-interactions, scroll effects; what to disable for reduced motion and on slow devices; performance budgets.
5. Illustration and photography guidelines: style rules, do's and don'ts, how the illustrated footer scene is composed and delivered (SVG/layers), food photo rules (real, natural light, no heavy edits).
6. Iconography: style, stroke, sizes, which icon set to use or extend.
7. Layout: grid, key page templates (home, search, restaurant page, QR menu, /business) for mobile and desktop.
8. Accessibility checklist and a Bangla typography checklist.
9. A short brand voice guide (Bangla and English) with example microcopy.
Format: clean Markdown with tables and code blocks, ready to hand to a developer.
```
