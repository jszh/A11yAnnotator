# case-06 — PASS control: success toast with chime + check icon backed by co-located text inside role="alert"

## Scenario
A Saffron Kitchen food-ordering "Review your order" page. Pressing **Place order** shows a confirmation
toast that is a real `role="alert"` (present at load), plays a short success chime, and displays a green
check icon. Crucially, the same atomic alert region also contains a meaningful text node — "Order placed
— Confirmation #SK-4471 · ready ~6:45 PM" — and the check SVG is `aria-hidden="true"` (decorative,
because the text carries the meaning). This is the correct counterpart to the failing cases.

## Attribute tuple
- **content-domain:** restaurant menu & ordering
- **UI-component/pattern:** toast / snackbar confirmation (dynamic-state: success of an action) with audio + icon
- **host-language construct:** `role="alert"` atomic region containing an `aria-hidden` `<svg>` icon **and** a visible text label; WebAudio chime
- **locale/i18n:** en
- **failure-mechanism:** none — the non-text status (icon + sound) is backed by an accurate co-located text equivalent (boundary PASS)

## Developer persona
An experienced front-end dev who read ARIA22 and the 4.1.3 Understanding "Non-textual status content"
note. They deliberately treated the check icon as decorative (`aria-hidden`) because the *text* carries
the status, put the human-readable confirmation inside the same atomic `role="alert"`, and treated the
chime as a supplementary cue whose information is duplicated by the visible+programmatic text. They
verified with a screen reader that the toast announces "Order placed, Confirmation #SK-4471, ready ~6:45 PM".

## Element / selector carrying the issue
`#toast[role="alert"]` — on success it contains `svg[aria-hidden="true"]` (decorative) **plus**
`.txt` with the text "Order placed / Confirmation #SK-4471 · ready ~6:45 PM". The region's computed text
is the meaningful confirmation string.

## Exact accessibility mechanism (what AT experiences, why it passes)
The `role="alert"` (assertive, atomic) fires on success and announces its full text content: "Order
placed, Confirmation #SK-4471, ready ~6:45 PM." The decorative check icon is correctly hidden so it does
not inject a stray symbol, and the chime is purely supplementary — its information ("your order
succeeded") is fully duplicated by the announced text and the visible message. A blind user receives the
same status as a sighted user. This satisfies 4.1.3: the status role is present **and** the non-text
status (icon/sound) is backed by an accurate text alternative — the exact combination the Understanding
doc requires and that cases 01–05 each break.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
This is the boundary that shows why the *failing* cases evade tooling: structurally, a scanner sees the
same shape here as in case-01/02 — a valid live region plus an `aria-hidden` decorative icon. An
automated tool cannot, on its own, certify this as a genuine PASS, because doing so requires reading the
region's text content in context and confirming it actually conveys the order status (and that the chime
has a text/visible equivalent). The very judgment that distinguishes this PASS from the icon-only
failures — "is the non-text status backed by an accurate text alternative?" — is the human/semantic call
no axe/WAVE/Lighthouse rule performs.

## Citation
> **WCAG Techniques ARIA22 (role=status shopping-cart example), `wcag-techniques/aria/ARIA22.html`:**
> "Because it adds visual context, the shopping cart image — with succinct and accurate `alt` text — is
> also placed in the container. Due to the `aria-atomic` value, a screen reader will announce \"Shopping
> cart, six items\"."

> **WCAG Techniques ARIA22 (Tests / Procedure), `wcag-techniques/aria/ARIA22.html`:**
> "Check that elements or attributes that provide information equivalent to the visual experience for the
> status message (such as a shopping cart image with proper `alt` text) also reside in the container."

(This page meets the ARIA22 test: the information equivalent to the visual experience — the confirmation
text — resides inside the atomic live region, so the present role announces a meaningful status.)
