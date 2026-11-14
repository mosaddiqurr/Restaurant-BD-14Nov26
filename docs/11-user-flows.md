# User Flows

Diagrams use Mermaid. They render on GitHub, in VS Code (with a Mermaid extension) and in most Markdown viewers.

---

## Flow 1: Diner finds a restaurant (before the visit)
```mermaid
flowchart TD
  A[Diner opens site<br/>Google / social / shared link] --> B{How do they search?}
  B -->|Search box| C[Type restaurant, dish or cuisine]
  B -->|Browse| D[City / area / cuisine page]
  B -->|Ask AI| E[AI assistant]
  C --> F[Results list]
  D --> F
  F --> G[Apply filters: budget, area, facilities, occasion...]
  G --> F
  F --> H[Open restaurant page]
  E --> H
  H --> I[View menu + prices + updated date]
  I --> J[Watch promo video / kitchen / 360° / 3D dishes]
  J --> K[Bill calculator]
  K --> L[Read verified reviews + Facebook posts]
  L --> M{Decide}
  M -->|Go| N[Call / WhatsApp / Directions]
  M -->|Not sure| O[Compare / save / share]
  O --> F
```

## Flow 2: AI budget planning
```mermaid
flowchart TD
  A["Diner: '৳2,500, 4 people, Dhanmondi, family'"] --> B[AI extracts budget, group size, area, needs]
  B --> C[Search our database: restaurants + dishes + prices + facilities]
  C --> D{Enough data?}
  D -->|No| E["Say so honestly and suggest the closest options or widen the area"]
  D -->|Yes| F[Build meal plan: dishes × quantities]
  F --> G[Add VAT + service charge; check total ≤ budget]
  G --> H[Show cards: restaurant, dishes, total, per person, updated date]
  H --> I[Diner opens restaurant page or asks to adjust]
  I -->|Adjust| B
```

## Flow 3: QR menu at the table
```mermaid
flowchart TD
  A[Diner sits at table] --> B{Can they scan?}
  B -->|Yes| C[Scan QR with camera]
  B -->|Can't scan| D[Type short link printed on card]
  B -->|No smartphone| E[Paper menu, printed from our system, same prices]
  B -->|Phase 2| F[Tap NFC card]
  C --> G[Lightweight menu opens, no app, no login]
  D --> G
  F --> G
  G --> H[QR scan counted for monthly report]
  G --> I[Browse menu, dish photos, bill calculator]
  I --> J[After the meal: invited to leave a review]
```

## Flow 4: Diner writes a review
```mermaid
flowchart TD
  A[Diner taps 'Write review'] --> B{Logged in?}
  B -->|No| C[Sign up / log in: phone OTP or Google]
  C --> D
  B -->|Yes| D[Rating + text + optional photos]
  D --> E[Verification step: method to be decided]
  E --> F[Anti-abuse checks: limits, patterns]
  F --> G{Suspicious?}
  G -->|No| H[Published with 'Verified' label if verified]
  G -->|Yes| I[Moderation queue]
  I --> J{Moderator decision}
  J -->|Approve| H
  J -->|Reject| K[Diner notified]
```

## Flow 5: Restaurant onboarding (sales → live)
```mermaid
flowchart TD
  A[Lead: field visit / /business form / referral] --> B[Sales visit: discovery questions + demo]
  B --> C{Interested?}
  C -->|No| D[Record reason; follow up later]
  C -->|Yes| E[Choose package; start trial or founding offer]
  E --> F[Collect menu, prices, facilities, VAT/service charge]
  F --> G[Schedule shoot]
  G --> H[Shoot: dishes, interior, kitchen, promo, 360°/3D]
  H --> I[Data entry + media upload in admin]
  I --> J[Owner reviews and approves page]
  J --> K[Go live]
  K --> L[Deliver QR table cards + printed menu]
  L --> M[Monthly report + account check-in]
```

## Flow 6: Menu / price update
```mermaid
flowchart TD
  A[Restaurant changes a price] --> B{How?}
  B -->|Launch phase| C[WhatsApp to our team]
  B -->|Phase 2| D[Owner edits in dashboard]
  C --> E[Admin updates price]
  D --> E2[Price saved]
  E --> E2
  E2 --> F[Price history saved with date]
  F --> G[Website + QR menu update instantly]
  G --> H[Owner reprints menu with 'Print menu' if needed]
  I[System: menu not updated in 30 days] --> J[Staleness alert to team]
  J --> K[Team calls restaurant to confirm prices]
  K --> E
```

## Flow 7: Billing cycle
```mermaid
flowchart TD
  A[Trial ends / billing date] --> B[Invoice created with bKash / Nagad link]
  B --> C[Reminder: 3 days before due]
  C --> D{Paid by due date?}
  D -->|Yes| E[Active; receipt sent]
  D -->|No| F[Reminders: due date, +3 days]
  F --> G{Paid within 7 days?}
  G -->|Yes| E
  G -->|No| H[Downgrade: paid features hidden; basic listing stays]
  H --> I{Paid within 30 days?}
  I -->|Yes| E
  I -->|No| J[Listing hidden; data kept for easy return]
```
*Grace periods are proposals; see [Billing Logic](13-business-billing-logic.md).*

## Flow 8: Monthly report
```mermaid
flowchart TD
  A[Month ends] --> B[Collect per-restaurant events: page views, QR scans, dish views, call/direction taps]
  B --> C[Compare dish prices with similar restaurants in the area]
  C --> D[Generate report PDF]
  D --> E[Send via WhatsApp]
  E --> F[Account manager check-in for Pro / Premium]
```
