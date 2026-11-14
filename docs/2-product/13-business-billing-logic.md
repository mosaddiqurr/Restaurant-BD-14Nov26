# Business & Billing Logic Spec

Defines how plans, prices, trials, payments and account states work, so the software behaves consistently.
Items marked **(proposed)** or *(open)* need founder confirmation (see [90-decisions-needed.md](../90-decisions-needed.md)).

---

## 1. Plans
| Plan code | Name | Dhaka (৳/month) | Bogura (৳/month) |
|---|---|---|---|
| `starter` | Starter | 1,999 | 1,499 |
| `pro` | Pro | 4,999 | 4,499 |
| `premium` | Premium | 9,999 | 9,499 |

Rules:
- Price depends on the **city of the branch**. Each city has its own price list in the system (not hard-coded), so new cities can be added.
- Bogura rule: Dhaka price − ৳500 per tier (agreed).
- Each **branch** is billed separately *(open: discount for multi-branch chains)*.
- Feature access is controlled by plan (see the feature matrix in [Pricing](../1-business/05-pricing-and-packages.md)). The system checks "does this branch's active plan include feature X?" rather than hard-coding tiers.

## 2. Billing periods (proposed)
| Period | Price |
|---|---|
| Monthly | List price |
| Quarterly | 5% off *(open)* |
| Annual | Pay 10 months, get 12 *(open)* |

## 3. Trials and offers
| Offer | Logic | Status |
|---|---|---|
| Free trial | Trial length set per account (default 7 days); full plan features during trial; first invoice on trial end | *(open)* |
| Founding Partner | Flag `founding_partner = true`; locked price for 12 months; permanent badge; limited to the first 50 | *(open)* |
| Setup / shoot fee | One-time invoice line; can be waived per account | *(open)* |
| Minimum commitment | Contract end date; early cancellation rule | *(open)* |

## 4. Subscription states
```
lead → trial → active → past_due → downgraded → suspended → cancelled
                 ↑__________|___________|____________|   (payment restores to active)
```
| State | Meaning | What diners see |
|---|---|---|
| `trial` | Free trial running | Full page per plan |
| `active` | Paid and current | Full page per plan |
| `past_due` | Due date passed, within 7 days **(proposed)** | Full page; reminders sent |
| `downgraded` | 7+ days overdue **(proposed)** | Basic listing only (name, info, menu); paid features hidden |
| `suspended` | 30+ days overdue **(proposed)** | Page hidden from search and the public; QR shows "menu temporarily unavailable" *(open: or keep the QR menu working)* |
| `cancelled` | Customer cancelled or long suspension | Hidden; **data and media kept** for easy return *(retention period: open)* |

## 5. Upgrades and downgrades
- **Upgrade:** effective immediately; pay the pro-rated difference for the rest of the period **(proposed)**.
- **Downgrade:** effective at the next billing date **(proposed)**.
- Content made for a higher tier (videos, 360°, 3D) is hidden after a downgrade but kept, so it can be restored on upgrade.

## 6. Invoices and payments
- Invoice created **7 days before** the due date **(proposed)**, with a unique number, plan, period, amount, discounts and fees.
- Payment methods at launch: **bKash and Nagad** (payment link or merchant number), bank transfer, cash collected by staff with a receipt.
- **Launch:** payments confirmed manually by admin (transaction ID recorded). **Later:** automatic confirmation through a payment gateway.
- **Reminders (WhatsApp/SMS):** 3 days before the due date, on the due date, 3 days after, and 7 days after (before downgrade).
- Receipts sent automatically after payment is confirmed.
- **VAT / tax on our invoices:** confirm with an accountant once the trade licence and BIN are in place.

## 7. Paid placement rules
- **Featured placement (Premium):** appears at the top of matching area / cuisine searches, always labelled "Featured". Maximum featured slots per search page *(open, e.g. 2)*. Rotation when there are more Premium restaurants than slots.
- **Deal of the Week:** one or more slots per city per week *(open)*; Premium only; rotation schedule managed in admin.
- Featured status **never changes ratings or reviews**.

## 8. Menu-format entitlements *(open)*
| Format | Proposed tier |
|---|---|
| Photo menu | All tiers |
| Video dish menu | Pro and Premium |
| 3D dish menu | Premium, or a paid add-on for others |

## 9. Monthly report entitlements
| Content | Starter | Pro | Premium |
|---|:---:|:---:|:---:|
| Page views, QR scans | ✅ | ✅ | ✅ |
| Top 5 dishes viewed | ✅ | ✅ | ✅ |
| Call / directions taps | ✅ | ✅ | ✅ |
| Competitor price insights | | ✅ | ✅ |
| Account manager check-in | | ✅ | ✅ |

## 10. Cancellation
- Owner can cancel anytime; the plan runs to the end of the paid period *(subject to the minimum commitment decision)*.
- No refunds for partial months **(proposed)**.
- Media rights after cancellation: defined in the Media & Content Rights Agreement (later document).
