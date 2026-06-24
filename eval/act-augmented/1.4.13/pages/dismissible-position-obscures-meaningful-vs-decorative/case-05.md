# case-05 — Large hero-card trigger: away-positioned popover harms discoverability AND still covers the cost table (FAIL)

## Scenario
A real-estate listing page makes its entire **Walk Score hero card** (a large tile with the
big "88", Transit/Bike/Commute sub-scores, and a hint line) the hover/focus **trigger**. On
hover/focus it reveals a "how scores are calculated" popover. There is **no keyboard
dismiss** (no Escape handler, no close button, not hoverable-to-close). The author tried to
satisfy *Dismissible* via **Method 1** by pushing the popover **away from the large trigger**
(into the next grid column) "so it doesn't overlap the trigger." Two problems compound:
1. The trigger is **large**, so a popover appearing far from it (over in the cost column) is
   easy to miss — the Understanding says that for a large trigger this away-positioning is a
   discoverability problem and "only the second method [dismiss] may be appropriate."
2. The relocated popover **still obscures meaningful content** — it lands directly on the
   *Monthly cost estimate* breakdown (principal & interest, taxes, insurance, HOA), hiding
   the cost rows.
Method 1 is not achieved (it covers a real cost table), and the method that *should* have
been used for a large trigger — Method 2 (Esc/dismiss) — is absent. The page **FAILS**.

## Attribute tuple
- **content-domain**: real-estate listings
- **UI-component/pattern**: large hero-card trigger with explainer popover (the whole tile is the trigger)
- **host-language construct**: `<button class="hero-trigger">` wrapping the hero; nested `<span role="tooltip">`; CSS `:hover/:focus .pop`
- **locale/i18n**: en (USD)
- **failure-mechanism**: large-trigger away-positioning that harms discoverability AND still overlaps the cost breakdown; Method 2 missing

## Developer persona
A property-portal developer wrapped the existing Walk Score widget in a `<button>` to add an
explainer, then read half of the 1.4.13 Understanding: "don't let the popup cover the
trigger." To obey that, they shoved the popover into the adjacent column — not realizing
(a) that for a *large* trigger the Understanding actually recommends Method 2 because away-
positioned content is hard to notice, and (b) that the adjacent column holds the monthly-cost
table. They added no Escape handler. The fix the spec points to (Esc dismiss) is exactly the
one they skipped.

## Element / selector carrying the issue
- Trigger: `button.hero-trigger` (the entire Walk Score hero tile — a *large* trigger)
- Popup: `#ws-pop` (`span[role="tooltip"].pop`)
- Obscured content: the `section.costs` "Monthly cost estimate" table rows (P&I, taxes, insurance, HOA)

## Exact accessibility mechanism
A low-vision user focuses the big hero tile; the explainer pops up **far to the side**, over
in the cost column, where — given their narrow magnified viewport — they may not see it at
all (the discoverability concern the Understanding raises for large triggers). If they do
find it, it is now **covering the monthly-cost breakdown**, and with no Escape they cannot
clear it in place to read the figures it hides. So the away-positioning neither makes the
content reliably noticeable nor avoids obscuring meaningful content. The Understanding's
guidance for a large trigger is that "only the second method may be appropriate" — i.e. a
dismiss mechanism — and that mechanism does not exist here. Screen-reader users get the
popover text via `aria-describedby`, so this is a visual/interaction failure, not a
name/role one.

## Expected ACT-style outcome
**failed** — for a large trigger, Method 1 away-positioning is inappropriate (it harms
discoverability) and is not even achieved (it overlaps the cost table); Method 2 (dismiss)
is absent.

## Why automated tools miss it
The DOM is valid: a real `<button>` trigger with an accessible name, a `role="tooltip"`
popover wired via `aria-describedby`, focus styles, passing contrast. No tool can perform
the chain of reasoning this case requires — "the trigger is *large* → content placed away
from it may go unnoticed → the spec says Method 2 is the appropriate method here → Method 2
(Esc) is missing" — nor can it see that the relocated popover lands on the cost-table rows.
That trigger-size-vs-method judgment plus the visual overlap assessment is squarely human.
axe/WAVE/Lighthouse never enter the hover/focus state at all.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Dismissible (large-trigger nuance)**
> "For most triggers of relatively small size, it is desirable for both methods to be
> implemented. If the trigger is large, noticing the additional content may be of concern if
> it appears away from the trigger. In those cases, only the second method may be
> appropriate."

> **WCAG 2.2 Understanding 1.4.13 — Dismissible (Method 1 + exception)**
> "Position the additional content so that it does not obscure any other content including
> the trigger, with the exception of white space and purely decorative content, such as a
> background graphic which provides no information."
