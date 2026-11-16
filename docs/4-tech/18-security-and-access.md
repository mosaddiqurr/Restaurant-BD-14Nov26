# Security and Access

Who can see and change what in khabo, and how sign-in is kept safe. Decided with the founder on 15 Nov 2026.

The prototype in [`website/panel/`](../../website/panel/) already follows these rules, so they can be tried. In the prototype everything runs in the browser, so a technical person could still get around it. In the real build (Step 3 of the [build plan](../2-product/26-build-plan.md)) every rule below is checked again on the server and in the database, which is what actually keeps data safe.

---

## 1. Restaurant owners

An owner signs in and sees **only their own restaurant**. They cannot open another restaurant, even by typing its address.

| They can change | Only khabo can change |
|---|---|
| Menu: dishes, prices, sold out, categories, photos, descriptions | **Restaurant name** (they send a request; the team approves it) |
| Tagline, about text, phone, address text | **Area and city** |
| Opening hours, VAT, service charge, seats, facilities, payment types | **Web address** (khabo.com/their-name) |
| Price per person, and whether it shows on their page | **Cuisine type** |
| Page colour: one of 12 khabo colour pairs | Custom colours outside the 12 pairs, and the name font |
| Social media links and which one is shown first | **360° tour and film** |
| Photos, deals (up to 8), replies to reviews | **Visibility**: live or hidden, Featured, Founding Partner, Deal of the week |
| QR style, table menu layout, table card design, print menu, door sticker | **Hiding reviews**, review text and stars |
| Their own team accounts and their own password | **Plan and billing**, other restaurants, khabo's own pages |

**Asking for a locked change:** the owner taps "Ask for a change" (on the Restaurant page, or under Team & account) and picks what: name, area or map pin, web address, cuisine, 360° tour, film, plan, or something else. The request lands in the team's **Requests** page. The menu shows how many are waiting, every open admin tab gets a pop-up straight away, and the team sees a reminder when they sign in. A name is changed for them on Approve; anything else the team changes in Admin settings, then marks it done. Either way they can add a short message. The owner sees the answer on their Overview and under Team & account, with a count in their menu until they read it. In the real build the owner also gets an SMS or WhatsApp message.

**Why the name is locked:** if names change often, diners, reviews, search and printed QR codes lose track of the place. A change is still easy: one request, approved in a day.

**Why only 12 colour pairs and no font choice:** every pair is built the same way (a deep background that white text reads on, and a bright accent), and the fonts are set by khabo. Menus, prices and buttons always use khabo's type. So every restaurant looks like itself, and the whole site still looks like one professional product, not a set of mismatched pages.

## 2. The khabo team: five levels

| Level | Can do | Cannot do |
|---|---|---|
| **Master** | Everything, including team accounts, levels, money and deleting | (nothing) |
| **Manager** | Restaurants (content and the locked fields above), reviews, restaurant accounts, leads, site text, activity | Money, team accounts, deleting restaurants |
| **Support** | Help restaurants with menus, photos, deals and replies; hide reported reviews | Locked fields, money, accounts, leads, site text |
| **Sales** | See restaurants, manage leads, add new restaurants (they start hidden) | Edit restaurants, reviews, money, accounts |
| **Finance** | See restaurants, plans, payments and invoices | Edit restaurants, reviews, accounts |

Rules that always hold:
- Only a **Master** can add, remove or change team accounts and their levels.
- Nobody can remove or turn off **themselves**, or the **last Master**.
- A page your level cannot open never loads. Trying is written to the activity log.
- Every change, by anyone, is in the activity log with who, what and when.

## 3. Adding people: invites, never shared passwords

Decided on 15 Nov 2026.

- When an owner (or the khabo team) adds someone, they enter the person's **name, their own mobile number or email, and a username**. No password.
- khabo makes a **6-digit invite code** that works once, for 3 days. In the prototype the code is shown once, with a ready message to send on WhatsApp. In the real build khabo sends it by SMS or email automatically.
- The new person opens the panel, taps "I have an invite code", and **chooses their own password**. Nobody else ever knows it.
- They can sign in with their **username, mobile number or email**, plus their password.
- Forgot password: the owner or the team makes a **new invite code**. The old password stops working and the person is signed out everywhere. Nobody types a password for someone else.
- **Who checks people:** the khabo team checks the restaurant owner once, when the restaurant signs up (phone call and trade licence). After that the owner adds their own staff without waiting for khabo. The person proves the number or email is theirs by using the code. The team can still see, turn off or remove any account, and every invite is in the activity log.
- **Why mobile first:** most restaurant staff in Bangladesh use their phone number more than email. Email (including Gmail) works too. "Sign in with Google" can come later as an extra button.

## 4. Sign-in safety

| Rule | Prototype | Real build |
|---|---|---|
| Passwords never stored as typed | Salted SHA-256 | Argon2 or bcrypt on the server |
| Wrong passwords | 5 tries, then locked for 10 minutes; a team member can unlock | Same, per account and per IP address |
| Team sessions | Signed out after 30 minutes idle, never "remember me" | Same, plus a second step (code by SMS or app) for every team sign-in |
| Owner sessions | Up to 30 days on their own device if they tick "Keep me signed in" | Same |
| New or reset password | Signs the person out everywhere else | Same |
| Turning an account off | Signs them out straight away | Same |
| Every change checked | Each save is checked against the person's level; locked fields are put back | Checked on the server and by database rules (row-level security), so a hacked browser cannot get around them |

Extra for the real build:
- The admin panel on its own address (for example admin.khabo.com), never linked from the public site.
- HTTPS only, secure cookies that scripts cannot read, protection against forged requests.
- No shared accounts: every team member has their own login, so the activity log always shows who did what.
- Owners sign in with their phone number and an SMS code, so there is no password to steal.
- Backups every day, and a review of team accounts every month.

## 5. Test accounts (prototype only)

| Username | Password | What it is |
|---|---|---|
| `admin` | `admin` | Master |
| `manager` | `manager` | Manager |
| `support` | `support` | Support |
| `sales` | `sales` | Sales |
| `finance` | `finance` | Finance |
| `client1` | `client1` | Owner of Shahi Handi House |
| `client2` | `client2` | Owner of Kathgolap Rooftop |
| `client3` | `client3` | Owner of Cha Adda |

These short passwords exist only in the prototype. Real accounts need at least 6 characters, and the team gets a second step.
