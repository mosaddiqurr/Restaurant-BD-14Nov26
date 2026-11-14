# Epics & User Stories

Format: *As a [user], I want [goal], so that [reason].* Each story lists acceptance criteria (AC) and priority (see [PRD](09-prd.md)).

---

## Epic 1: Discovery & Search
**1.1** As a diner, I want to search restaurants by name, dish or cuisine in Bangla or English, so that I find what I want quickly. **P0**
- AC: results appear for Bangla and English spellings; typo-tolerant; empty state suggests alternatives.

**1.2** As a diner, I want to filter by area, budget, price per person, occasion, facilities, dietary and more, so that I only see places that fit my needs. **P0**
- AC: filters combine; the active filters are visible and removable; result count updates.

**1.3** As a diner, I want to search a dish across restaurants and compare prices, so that I get the best value. **P0**
- AC: results show dish name, restaurant, price, portion and "updated X days ago"; sortable by price.

**1.4** As a diner, I want to compare 2–3 restaurants side by side, so that I can decide. **P1**

**1.5** As a diner, I want to browse area and cuisine pages, so that I can explore. **P0**

---

## Epic 2: Restaurant Page
**2.1** As a diner, I want to see the full menu with real prices and when they were updated, so that I know what I'll pay. **P0**
- AC: categories; price, portion, spice, veg/non-veg; "updated X days ago"; warning if stale.

**2.2** As a diner, I want to view dishes as photos, video or 3D (whatever the restaurant provides), so that I see exactly what I'll get. **P0 photo / P1 video / P1–P2 3D**
- AC: 3D works in the browser without an app; falls back to photo if the device can't show 3D.

**2.3** As a diner, I want to watch the promo video and see the kitchen and a 360° tour, so that I know the place before going. **P0 / P1 360°**
- AC: kitchen media shows its capture date.

**2.4** As a diner, I want to estimate my bill including VAT and service charge, so that there are no surprises. **P0**
- AC: add dishes and quantities; set number of people; shows subtotal, VAT, service charge, total and per person.

**2.5** As a diner, I want to read verified reviews and see related Facebook posts, so that I can trust what others say. **P0 / P1 Facebook**
- AC: verified reviews labelled; Facebook posts shown via the official embed, labelled "From Facebook", linking to the original.

**2.6** As a diner, I want to call, WhatsApp or get directions in one tap, so that visiting is easy. **P0**

---

## Epic 3: QR Menu & Print Menu
**3.1** As a diner at a table, I want to scan the QR and see the menu instantly without an app, so that ordering is easy. **P0**
- AC: loads quickly on 3G; Bangla default with English toggle; no login.

**3.2** As a diner who can't scan, I want a short web link on the table card, so that I can still open the menu. **P0**

**3.3** As a restaurant owner, I want to print a menu that matches my online prices, so that I never have wrong paper menus. **P0**
- AC: PDF generated from live data; restaurant branding; date printed.

**3.4** As an admin, I want to generate printable QR table cards for a restaurant, so that we can deliver them. **P0**

---

## Epic 4: AI Assistant
**4.1** As a diner, I want to ask in Bangla, English or Banglish where to eat, so that I get suggestions like asking a friend. **P0**

**4.2** As a diner, I want to say my budget and group size and get a meal plan with a total, so that I can plan exactly. **P0**
- AC: suggests a restaurant, dishes and quantities; total includes VAT and service charge; total ≤ budget; links to the restaurant page.

**4.3** As a diner, I want the AI to show only real data and tell me when it doesn't know, so that I can trust it. **P0**
- AC: every suggestion maps to a real restaurant and dish in our database; never invents prices.

---

## Epic 5: Reviews & Trust
**5.1** As a registered diner, I want to write a review with photos, so that I can share my experience. **P0**

**5.2** As a diner, I want to see which reviews are verified, so that I know they're real. **P0** *(verification method: open decision)*

**5.3** As a moderator, I want flagged and suspicious reviews in a queue, so that fake reviews are removed. **P0**

**5.4** As a restaurant, I want to reply to reviews, so that I can respond to customers. **P1 via admin / P2 self-serve**

---

## Epic 6: Diner Account
**6.1** As a diner, I want to sign up with my phone or Google, so that I can review and save places. **P0**
**6.2** As a diner, I want to save favourites and follow restaurants, so that I can come back and get deals. **P1**
**6.3** As a diner, I want to share a shortlist and let friends vote, so that the group decides together. **P2**

---

## Epic 7: Deals & Promotion
**7.1** As a diner, I want to see current deals, so that I save money. **P0**
**7.2** As a Premium restaurant, I want my deal in the Deal of the Week slot, so that more people see it. **P0**
**7.3** As a Premium restaurant, I want featured placement in my area and cuisine searches, clearly labelled, so that I get more visibility. **P0**

---

## Epic 8: Content
**8.1** As a diner, I want to see the monthly Food Price Index, so that I know what food costs in each area. **P1**
**8.2** As a journalist, I want a shareable graphic and summary, so that I can report on it. **P1**
**8.3** As a diner, I want seasonal guides (iftar, Eid), so that I can plan special meals. **P1**

---

## Epic 9: Restaurant Sign-up & Reporting
**9.1** As a restaurant owner, I want a page explaining packages and prices, so that I can decide to join. **P0**
**9.2** As a restaurant owner, I want to submit an interest form, so that the team contacts me. **P0**
**9.3** As a restaurant owner, I want a monthly report with views, QR scans, top dishes and price comparison, so that I see the value. **P0**
**9.4** As a restaurant owner, I want to edit my menu and mark dishes sold out myself, so that changes are instant. **P2**

---

## Epic 10: Admin & Operations
**10.1** As a data-entry team member, I want to add and bulk-edit menus and prices, so that onboarding is fast. **P0**
**10.2** As a content team member, I want to upload photos, videos, 360° and 3D files for dishes and restaurants, so that pages are complete. **P0**
**10.3** As an admin, I want every price change saved with its date, so that we keep price history and the Price Index. **P0**
**10.4** As an admin, I want alerts for menus not updated in 30+ days, so that data stays current. **P0**
**10.5** As a sales team member, I want a leads pipeline, so that I track every restaurant conversation. **P0**
**10.6** As an admin, I want team roles with different permissions, so that people only access what they need. **P0**

---

## Epic 11: Billing
**11.1** As an admin, I want to assign a plan, trial and price (by city) to a restaurant, so that billing is correct. **P0**
**11.2** As an admin, I want invoices with bKash / Nagad payment links and automatic reminders, so that we collect payments on time. **P0**
**11.3** As an admin, I want late accounts downgraded and later hidden automatically, following the grace rules, so that billing is enforced fairly. **P0**
See [Billing Logic](13-business-billing-logic.md).
