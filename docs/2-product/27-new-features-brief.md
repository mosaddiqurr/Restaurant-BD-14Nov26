# New Features Brief

Written 16 Nov 2026 after the founder picked new ideas from a look at food apps around the world (Beli, Zomato District, EazyDiner, Yelp, Google Maps, Popmenu, Tabelog).

**For whoever builds this (a person or an AI):** read [CLAUDE.md](../../CLAUDE.md) and the [design rules](../3-design/25-design-rules.md) first. Each feature below has its PRD ID ([09-prd.md](09-prd.md)) and its phase ([14-product-roadmap.md](14-product-roadmap.md)). Build only the phase you are asked to build.

---

## Rules for every feature here

- **Diners never pay.** Every diner feature is free and works without an account, except where an account is needed to save something (lists, stamp cards, reviews).
- **Real data only.** No made-up numbers, prices, visits or trends on the live site. The prototype may use the demo data in `archive/prototype/data/` and `archive/prototype/restaurants/`.
- **Prices:** menu price only, shown as ৳420 with a smaller taka sign. VAT and service only on the bill.
- **Bangla and English** for every word. **Light and dark mode.** **Works at 390px wide** with no sideways scroll.
- **Built for thousands of restaurants:** everything comes from data, nothing is written for one restaurant. Reuse the shared parts in `archive/prototype/code/`.
- **Where to build in the prototype:** Phase 1 and 1.5 features go in the main site (`archive/prototype/code/pages/`) and the panels (`archive/prototype/panel/`). Phase 2 and later go in `archive/prototype/future/` as clickable prototypes, not linked from the main site, until the founder says so.
- **Featured** (paid) items are always labelled and never pushed into "real" lists like Trending or price averages.

---

## Phase 1 (launch)

### Menu from a photo (RD-6)

**What:** owner or team uploads photos of the paper menu. AI reads it and fills in the menu. A person checks it before it goes live.

**Do we need an API?** Yes, the **Claude API**, which is already in our tech stack. Claude can read photos (Bangla and English). No extra service needed.

**Cost:** about ৳1 to ৳5 per menu page, depending on the model. Test Haiku 5.5 and Sonnet 5.5 on 10 real Bangla and English menus (printed and handwritten) and pick the one that gets prices right.

**How it works:**
1. In the restaurant panel (Menu & prices) and the admin panel, add an **"Upload menu photo"** button. Allow several photos (menus often have 2 to 6 pages).
2. The photos go to a server function. It sends them to Claude with a fixed instruction: return each dish as `category, name in English, name in Bangla, price, portion` in a set format. Never guess a price that is not readable; mark it "unclear" instead.
3. The panel shows a **draft table** with the photo beside it. Unclear cells are marked in marigold. The person fixes them.
4. **New menu:** the person taps Confirm and the dishes are saved.
   **Update:** the panel shows only what changed ("Mutton Kacchi ৳380 to ৳420", "New: Beef Tehari ৳280", "Gone: Fish Fry"). The person ticks which changes to keep, then Confirm.
5. Every price change is saved in price history (AD-4) with who confirmed it.

**Rules:** nothing goes live without a person confirming. Delete the photos after 30 days unless the team keeps them.

**Prototype:** show the full flow with a sample photo and a ready-made draft result (no real API call). The real AI call is added at go-live (build plan Step 4).

**Done when:** a team member can turn a 3-page menu photo into a checked menu in under 10 minutes.

---

## Phase 1.5 (weeks after launch)

### Price tracker (D-9)

**What:** its own page where anyone can check how dish prices change.

**Already there:** the general dish sheet (`archive/prototype/code/pages/dish.js`) already has a small six-month price line. A restaurant's own page and its QR menu do not show price history, on purpose, and that stays.

**Page (`/prices`), shares one page with the Food Price Index:**
1. Search or pick a dish type (kacchi, biryani, tehari, burger, coffee...) and an area.
2. A line chart: each restaurant's price over time, plus the area average as a thicker line.
3. Under it, a list: restaurant, price now, price 3 months ago, change (৳ and up/down arrow), "updated X days ago".
4. "This month": biggest rises and biggest drops in the city.
5. The monthly Food Price Index ("The Kacchi Report") sits on the same page as a second tab.

**Data:** price history records `dish, branch, old price, new price, date, confirmed by` (already planned as AD-4). The dish type (`kacchi`, `biryani`...) groups the same dish across restaurants.

**Rules:** only real saved changes. An area average needs at least 3 restaurants, otherwise do not show it. Menu prices only. Featured restaurants get no special place here.

**Where it shows:** a "Prices" link in the header and footer, and the home page "Price check" section links to it. *(Proposal: the phone bottom bar stays as it is. Founder to confirm.)*

**Start date:** prices are saved from launch day; the page opens once there are 2 to 3 months of history.

### Buffet finder and compare (D-10)

**Data for each buffet:** branch, name (Bangla/English), price per person, child price, days, start and end time, season (all year / Ramadan iftar / Eid), what is included (list of dishes), photos.

**Screens:** a Buffets page with filters (area, price, day, iftar), buffet cards (photo, ৳1,499 per person, days, time), a buffet detail sheet with the full list of dishes, and compare 2 or 3 buffets side by side (reuse the Compare prototype in `archive/prototype/future/compare.js`). Owners add and edit buffets in the panel.

### Trending this week (D-11)

**How:** count real dish and restaurant views and QR scans in each area over the last 7 days. Do not count views by the owner, staff or our team, or repeat views from the same device on the same day.

**Lists:** "Most viewed dishes in Uttara this week", "Most scanned restaurants in Bogura". Shown on the home page and area pages.

**Rules:** show a list only when it has enough data (e.g. at least 50 views in that area that week). Featured placement never changes these lists.

### Events at restaurants (D-12)

**Data:** branch, title (Bangla/English), type (live music, match screening, iftar special, festival menu, other), date and time, photo, optional entry price, ends at. Events hide on their own after they end.

**Screens:** owners add events in the panel. Events show on the restaurant page and on an Events list (filter by date, area, type). Upcoming events can also appear on the home page.

---

## Phase 2 (around 50 to 100+ restaurants)

### My lists (U-7)

**What:** diners make lists like "My top 10 biryani" or "Date night in Gulshan", rank the places by dragging, and share a link.

**How:**
1. "Save" on any restaurant or dish asks "Add to which list?" (or a new list).
2. On the list page, drag to change the order; add a short note to each place.
3. Share button gives a link (`/l/{list-id}`) that opens without an account. Lists can be private or public.

**Why Phase 2, not now:** lists need diner accounts and many users to be useful. Saved favourites come first in Phase 1.5 (U-2). **Friends** (follow friends, see their lists, U-8) come in Phase 3, when enough people use khabo.

### Digital stamp cards (L-1)

**What:** "Buy 5 coffees, get the 6th free" on the diner's phone instead of a paper card.

**Step by step:**
1. **Owner sets up a card** in the panel: what earns a stamp (any visit, or chosen items like coffee), how many stamps, the reward, expiry date. *(Which plans get this: open, see below.)*
2. **Diner joins for free:** on the restaurant page or after scanning the table QR, tap "Get stamp card". This needs a free account (phone number and SMS code).
3. **Earning a stamp:** the diner opens "My cards" and shows a code on their phone. Staff scan it with the restaurant panel on the staff phone and tap "+1 stamp". This stops people stamping themselves.
4. **Reward:** when the card is full, the diner shows it, staff tap "Redeem", the card starts again.
5. **Owner report:** cards given, stamps this month, rewards used, how many diners came back.

**Needed first:** diner accounts and staff logins in the panel (staff roles, RD-4).

**Data:** `stamp cards` (restaurant, rule, reward, expiry), `diner cards` (diner, card, stamps), `stamps` (diner card, staff member, time), `rewards used`.

**Rules:** one stamp per diner per restaurant per day. Free for diners; the restaurant gives the reward. A stamped visit counts as a **verified visit**, so it can help verify that diner's review (V-2).

**Later (Phase 3):** rewards across many restaurants (already in the roadmap).

### Voice reviews in Bangla (V-6)

**How:** a microphone button on the review form. The diner speaks, the words appear as text, the diner fixes them and posts.

**API:** start with the phone browser's own speech-to-text (free, works for Bangla in Chrome on Android). If it is not good enough, use a paid speech service that supports Bangla (for example Google Cloud Speech-to-Text). We do not keep the voice recording.

**Rules:** same review rules, limits and verification as typed reviews.

### AI price advice (RD-7)

**What:** short, plain tips in the restaurant panel and the monthly report.

**Examples:** "Your beef tehari is ৳60 above the Dhanmondi average." "Views on your mutton kacchi dropped 20% this month." "3 places near you added a set menu under ৳500."

**How:** the numbers come from our database (price averages from the price tracker, views from the reports). AI only turns the numbers into a short sentence in Bangla and English. It never makes up a number and never tells the owner what they must do.

**Rule:** compare only with at least 3 similar restaurants in the same area.

### Google Maps and Facebook sync (RD-8)

**What:** the owner changes the menu, hours or photos on khabo once; their Google listing updates by itself. New deals and dishes post to their Facebook page.

**How:**
1. **Google:** apply for access to the **Google Business Profile API** (free, but Google must approve khabo). In the panel, the owner taps "Connect Google" and allows khabo to manage their listing. Then khabo can update hours, description, photos, posts and the food menu.
2. **Facebook:** make a Meta app and pass Meta's app review for page posting. The owner taps "Connect Facebook" and picks their page. khabo then posts deals and new dishes (with photo and link). Facebook does not take menu data, so the menu stays as the khabo link.
3. The panel shows "Last synced" and any error in plain words.

**Start the Google and Meta applications early,** since approval can take weeks.

### Own web address (RD-9)

**Already there:** every restaurant's khabo page is already its own website ("Your website" in the panel, `archive/prototype/panel/site.js`).

**What is new:** the page can open on the restaurant's own name, e.g. `shahihandi.com`.

**How:**
1. The owner buys a domain (about ৳1,500 a year for a .com), or we buy it for them as an add-on.
2. In the panel, "Your website > Use your own address": the owner types the domain and gets one setting to copy into their domain account (a CNAME record pointing to khabo). We can do this for them.
3. **Cloudflare for SaaS** (we already use Cloudflare) gives the domain a secure padlock automatically.
4. The Next.js site checks which address was opened and shows that restaurant's page.
5. The page keeps a small "Made with khabo" line linking back to khabo.

---

## Phase 3 (expand the product)

### How busy right now (D-13)

1. In the panel, staff tap one of three buttons: **Quiet / Busy / Waiting about __ min**.
2. The restaurant page and cards show it with the time it was set ("Busy, updated 10 min ago").
3. After 2 hours with no update, it disappears, so it is never wrong for long.
4. Later: estimate it from QR scans in the last 30 minutes, once there is enough data.

### Scan a menu (D-14)

**What:** the diner points the camera at a paper menu and sees our photos, prices and reviews of those dishes. (Yelp calls theirs "Menu Vision". We call ours "Scan a menu".)

**How:**
1. A "Scan a menu" button in the app, and on the QR table menu.
2. Find the restaurant: from the table QR if scanned, or the phone's location, or the diner picks it.
3. The photo goes to the Claude API, which reads the dish names.
4. We match the names to that restaurant's dishes in our database.
5. Show each matched dish with its photo, our price and its rating. Dishes we do not have show as text only.

**Rules:** works only for restaurants on khabo. Never show a price we have not confirmed. Costs a few taka per scan, so set a daily limit per phone.

### Friends (U-8)

Follow friends, see their lists and the places they ranked. Builds on My lists.

### Pay your bill through khabo (PAY-1)

**What:** the restaurant offers a discount (e.g. 10 to 20%) if the diner pays the bill through khabo. This is how Zomato District and EazyDiner earn money. Free for diners.

**How:**
1. **Payment gateway first:** sign up with a Bangladeshi gateway that takes bKash and Nagad (for example SSLCommerz, bKash Payment Gateway, aamarPay or ShurjoPay). Choose one that can pay the restaurant directly, so khabo never holds the restaurant's money. Check the legal side with a lawyer and the gateway first.
2. **Restaurant joins** in the panel: sets the discount, days and times, minimum bill.
3. **Diner side:** the restaurant page shows "Pay with khabo, get 15% off". At the end of the meal, staff create the bill in the panel (or the diner types the amount), the diner sees the bill total, the discount and the amount to pay, and pays by bKash or Nagad.
4. **Staff** see "Paid" on their panel straight away.
5. **Money:** the gateway sends the restaurant the money minus khabo's cut. khabo's cut is an open decision.
6. **Report:** bills paid, discount given, new diners brought in.

**Rules:** no fee for diners, ever. The discount is on the bill, and VAT and service stay on the bill as normal.

---

## Phase 4 (maybe)

### Restaurant job board (J-1)

Restaurants post jobs (chef, waiter, cashier, manager); people apply free with a phone number. Founder not sure yet; do not build until decided.

---

## Open decisions for the founder

Also listed in [90-decisions-needed.md](../90-decisions-needed.md).

| # | Question |
|---|---|
| 1 | Which plans get: events, stamp cards, automatic Google/Facebook sync, own web address, AI price advice? Included, from Pro, or a paid add-on? |
| 2 | Pay through khabo: what cut does khabo take (e.g. 2 to 5% of the bill)? |
| 3 | Price tracker: a "Prices" link in the header and footer only, or also in the phone bottom bar? |
| 4 | Own web address: does the owner buy the domain, or do we sell it as an add-on? |
