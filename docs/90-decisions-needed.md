# Decisions Needed from the Founders

Nothing in this list is decided. Each item lists the options; the founders choose.
When a decision is made, record it in the **Decision** line and update the related documents.

---

## 1. Brand & identity

### 1.1 Brand name
Requirement: one word, easy to say in Bangla and English, can grow beyond restaurants (or a food name if we accept that trade-off).

| Option | Meaning | Domain signal (DNS check only, confirm at a registrar) |
|---|---|---|
| Khabo | খাবো, "I'll eat / Shall we eat?" | khabo.com, khabo.app possibly free |
| Bhoj | ভোজ, "feast" | bhoj.com possibly free |
| Dekho | দেখো, "Look!" | dekho.app, getdekho.com possibly free (dekho.com taken) |
| Mela | মেলা, "fair / gathering" | mela.app, melabd.com possibly free |
| Khojo | খোঁজো, "Search!" | khojo.app possibly free |
| Mezban | মেজবান, traditional feast | mezban.app possibly free |

Food name = easier marketing now, harder expansion to shops later.
**Decision:** ___

### 1.2 Domain
Options: (a) .com only · (b) .com + .com.bd (৳700, needs NID or trade licence) · (c) .com.bd only.
**Decision:** ___

### 1.3 Logo
Waits for the name. **Decision:** ___

---

## 2. Design (for Brand Guide & Design System)
Options are ready to compare in two files (open in a browser):
- **How it looks:** [18-design-directions.html](3-design/18-design-directions.html): 11 visual directions, 16 palettes, 10 Bangla + English font pairings, scored.
- **How it works:** [19-experience-concepts.html](3-design/19-experience-concepts.html): 10 experience concepts (home layout, navigation, flows), compared on ease of use.
- Recommendation (not decided): *Neel Calm* look + *One Box + Lenses* structure.
- Also open: keep "Ask AI" as its own bottom-bar tab, or merge it into search and add a "Plans" tab.

Areas to decide:
- Colour palette (food-warm vs. fresh/modern vs. premium/dark)
- Fonts (must support Bangla + English)
- UI style and components
**Decision (14 Nov 2026):**
- ✅ **Colours:** Green + Marigold, light and dark mode. Founder confirmed on 16 Nov 2026 after comparing the redesign previews ([archive/prototype/design-options/final.html](../archive/prototype/design-options/final.html)). This replaces the earlier Indigo + Marigold choice ([23-indigo-identity.html](3-design/23-indigo-identity.html), kept for the record).
- ✅ **Deal order (16 Nov 2026):** Premium-plan restaurants' deals and dishes always show first, then Pro, then Starter. Inside each plan the khabo team can set the order. See [25-design-rules.md](3-design/25-design-rules.md) section 6.
- ✅ **Fonts:** Figtree (English) + Noto Sans Bengali (Bangla). Founder liked #3 "Clear and complete" best and asked the design team to pick the best performer.
- ✅ **Ask AI:** small button beside the search; it jumps to the AI section in the middle of the home page. Bottom bar keeps an Ask AI tab.
- ✅ **Final design v1:** [_archive/24-final-site-v1/preview.html](_archive/24-final-site-v1/preview.html). Founder to review and give feedback.
- Still open: time-of-day themes (dawn / dusk / night) are a future idea, see the tracker backlog.

---

## 3. Tech stack (for Architecture & CLAUDE.md)
**Decision:** ✅ Next.js + TypeScript on Cloudflare Workers + Supabase (database and login) + Cloudflare R2 for files + Cloudflare Stream for films + SSLCommerz for payments. Changed from InsForge on 16 Nov 2026 (founder decision). See [17-tech-stack.md](4-tech/17-tech-stack.md).
Still open: AI model (Haiku 5.5 vs Sonnet 5.5, to be decided by testing) · Cloudflare free vs Pro plan · SMS provider · payment gateway (later).

---

## 4. Pricing & packages

| # | Question | Options | Decision |
|---|---|---|---|
| 4.1 | How to cover shoot costs | (a) 6- or 12-month commitment for Pro/Premium · (b) one-time setup fee ৳3,000–5,000 · (c) both · (d) absorb the cost | ___ |
| 4.2 | Free trial | (a) 7 days free · (b) first month free for founding partners · (c) both | ___ |
| 4.3 | Founding partner offer | (a) Pro at Starter price for 12 months · (b) % discount · (c) none | ___ |
| 4.4 | Which tiers get video menu and 3D dish menu | e.g. video dishes in Pro, 3D dishes in Premium, or paid add-on | ___ |
| 4.5 | Social promotion in Premium | e.g. 2 guaranteed posts/reels per month on our pages | ___ |
| 4.6 | Light promotion for all tiers | Yes / No | ___ |
| 4.7 | Prepay discounts | e.g. quarterly 5% off, annual = pay 10 months get 12 | ___ |
| 4.8 | NFC cards (phase 2) | Included in Premium + ~৳1,000 add-on for others | ✅ Agreed: phase 2 |
| 4.9 | Bogura pricing | ৳500 less than Dhaka per tier | ✅ Agreed |
| 4.11 | Which plans get the new features (events, stamp cards, automatic Google/Facebook sync, own web address, AI price advice) | Included in all · from Pro · paid add-on. See [new features brief](2-product/27-new-features-brief.md) | ___ |
| 4.12 | Pay through khabo (Phase 3): khabo's cut of each bill | e.g. 2 to 5% | ___ |
| 4.13 | Own web address: who buys the domain | Owner buys it · we sell it as an add-on | ___ |
| 4.10 | Branded QR codes (logo, colours, shape) | (a) included in every tier · (b) logo in every tier, shape choice from Pro · (c) paid add-on | ___ |

---

## 5. Product

| # | Question | Options | Decision |
|---|---|---|---|
| 5.1 | How reviews are verified | Method not fixed yet; can combine several methods | ___ |
| 5.2 | 360° / virtual tour method | Rent 360° camera · used camera · phone panorama · video-to-3D software (founder researching) | ___ |
| 5.3 | 3D dish capture method | Photogrammetry app · 3D scanning service · AI image-to-3D (check realism) | ___ |
| 5.4 | Facebook reviews | Show public Facebook posts using Facebook's official embed, linked to the original | ___ |
| 5.5 | Launch scope | Everything at launch vs. core first and the rest within weeks (see PRD priorities) | ___ |
| 5.6 | Map tiles for the live site | The preview uses free OpenStreetMap tiles, which are not meant for production traffic. Options: (a) MapTiler or Stadia Maps paid plan (~$25–50/month) · (b) Google Maps (free credit, then per load) · (c) host our own tiles on Cloudflare R2 | ___ |

---

## 6. Company

| # | Question | Decision |
|---|---|---|
| 6.1 | Sole proprietorship first, or a limited company straight away | ___ |
| 6.2 | Co-founder roles, equity split, vesting (see co-founder guide) | ___ |
| 6.3 | Pre-revenue budget and investment amount | ___ |
| 6.4 | Team: who does sales, content shoots, menu updates, development | ___ |
