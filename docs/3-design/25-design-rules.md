# Design Rules

Rules for the real build, learned from the prototype in `website/`. When the prototype and this doc disagree, this doc wins.

---

## 1. How prices are shown

Prices are the most important thing on khabo. They must be easy to read and always look the same.

### The format
- Write a price as **৳420**: the taka sign first, then the number with commas (৳1,590).
- The taka sign is **smaller and lighter** than the number (about 70% size), so the eye reads the number first.
- Round to whole taka. No decimals.
- Use the same font weight and tabular (even-width) numbers everywhere, so prices line up in lists.
- In Bangla mode, the number uses Bangla digits (৳৪২০).

### What we show, and what we don't
- **Dish cards, menus and the dish page show the menu price only.** No "all-in" price, no "with VAT and service" line next to dishes.
- **VAT and service charge appear only on the bill** (bill calculator, table bill). There we show each line and the total.
- **"Lowest"** may be shown next to a dish when it is the cheapest of that dish in the area. Nothing else sits next to the price.

### Where the price sits
| Place | How it looks |
|---|---|
| Dish card (Dishes page, home, search) | A **dark navy tag** (#141938, white text) on the bottom-left of the photo. Same in light and dark mode. In dark mode it gets a thin light outline. |
| Dish page | A solid block in the **restaurant's own deep colour** with the price in white and the add button in the restaurant's accent colour. No glow, no shine. |
| Restaurant menu row | The price on the right of the row, same format, no extra lines. |
| Deals | The deal price large, the old price crossed out and smaller next to it. |
| Price check (home) | A solid dark card with the typical price, a simple scale from lowest to highest, and one row per place. |
| Bill | Each line on the right, then VAT, service and the total in bold. |

### In code
- One helper writes every price, so a change in one place changes the whole site. In the prototype it is `K.tk()` (plain text) and `K.tkH()` (with the smaller taka sign).

---

## 2. Cards and grids

The "What you get" grid on the For restaurants page was rebuilt because the old one had uneven boxes, overlapping parts and an empty box with a big icon. The rules:

- **One grid, 12 columns** on laptops. Each row adds up to 12 (for example 7 + 5, then 5 + 7). Phones: one column.
- **Same corner radius, padding, gap and heading size** on every card in a grid.
- **Rows grow to fit their content.** Never set a fixed height that can cut off text or make one card spill into another.
- **Photo cards:** photo fills the card, a dark fade at the bottom, the heading and text sit on the fade, bottom-left.
- **Text cards:** heading and one line at the top, then a real example of the feature (a real menu, a real QR code, a real report). **No big stand-in icons** as decoration.
- **Show the real product.** Use real restaurant names, dishes and prices from the data, not placeholders.

---

## 3. QR table cards

- **No table number by default.** Every card shows the restaurant name, the code and the owner's words, so all cards look the same.
- The owner can switch **"Show the table number on the card"** on. Then every design (including shapes) shows the number.
- Either way, each code still opens the menu for its own table, so later features (ordering, calling a waiter) still know the table.

---

## 4. Motion

Shared animations live in one file, `website/code/feel.js`, used by the site and the panels. Ideas from transitions.dev, rewritten without React. All of them stop when a phone or computer asks for reduced motion.

| Animation | Where it is used |
|---|---|
| Lift group (hover lifts a photo, neighbours lift less, springy return) | Dish photos in the bill bar on restaurant pages. When a dish is added, the row ripples. |
| Shimmer text (a light band sweeps across words) | The AI while it is finding an answer: "Checking menus and prices". Use it for any loading text. |
| Toast open and close (rises with fade, blur and scale) | Every toast message on the site and in the panels. |
| Accordion (smooth height, answer un-blurs, arrow flips) | FAQ on the For restaurants page. |
| Drag with physics (card tilts with hand speed, column opens a slot, card springs in) | Leads board in the admin panel. Mouse only; on phones the arrow buttons move a lead. |

---

## 5. General look

- Flat, solid colours. **No glow effects**, no shiny overlays, no coloured shadows behind price boxes.
- Soft plain shadows only where something sits on top of something else.
- Every screen in light and dark mode. Every screen at phone width (390px) with no sideways scroll.
- Restaurant pages use the restaurant's own two colours (deep and accent) and font. khabo pages use Green and Marigold (confirmed 16 Nov 2026).
- Type: Figtree for English (headings tight but not condensed), Noto Sans Bengali for Bangla.
- Writing: plain, short words, no em dashes, no small label text above headings.

## 6. Deal and listing order

- **Premium first, always.** Deals, and dishes in "Best match" lists, from Premium-plan restaurants (৳9,999) come first, then Pro, then Starter.
- **The khabo team can reorder** deals inside each plan group from the admin panel. They cannot move a Pro deal above a Premium one.
- After plan and team order: the Deal of the Week, then rating.
- Every live deal a restaurant adds shows on the Deals page by itself, with no extra step.
- Paid placement is still marked "Featured" so diners can trust what they see.
- Each deal can carry its own coupon code. Until a restaurant adds one, the preview shows a sample code made from the restaurant and the deal name.
