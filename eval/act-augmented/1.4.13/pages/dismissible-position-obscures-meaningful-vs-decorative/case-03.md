# case-03 — Metric-help popover lands in empty dashboard space (PASS by the white-space exception)

## Scenario
A SaaS analytics dashboard ("Funnel Overview") shows two KPI cards. The left card's
"Activation rate" heading has a `?` help button that, on hover/focus, opens a definition
popover. As in the FAIL cases, there is **no keyboard dismiss** (no Escape handler, no close
button, not hoverable-to-close), so **Method 1 (non-obscuring positioning)** is the only
available path. Here the popover opens **downward into the large empty region below the
cards** — a part of the dashboard canvas with no text, no controls, and no informational
graphics. Geometric overlap with the page exists, but it covers **only empty space**, which
the SC explicitly exempts. So Method 1 is satisfied and the page **PASSES** despite having
no dismiss mechanism. This is the boundary/inverse anchor for the aspect.

## Attribute tuple
- **content-domain**: SaaS analytics dashboard
- **UI-component/pattern**: KPI-card metric-definition popover (`?` affordance)
- **host-language construct**: `<button class="qmark">` + `<div role="tooltip">`; JS class-toggle on `mouseenter`/`focus`
- **locale/i18n**: en
- **failure-mechanism**: NONE — overlap target is empty white space (exempt) → compliant

## Developer persona
A product engineer added metric tooltips so new users understand the funnel terms. They were
careful: they explicitly positioned the popover to drop into the open canvas below the cards
("there's nothing down there to cover") rather than letting it spill onto the neighbouring
card. They knowingly skipped an Escape handler because the popover never overlaps content —
relying on the SC's white-space exception. This is a developer who got Method 1 *right*.

## Element / selector carrying the issue
- Trigger: `button.qmark` (the "What is activation rate?" control)
- Popup: `#m1-pop` (`div[role="tooltip"].pop`)
- Overlap target: empty dashboard canvas below `.row` (no text/control/graphic underneath)

## Exact accessibility mechanism
A low-vision user at high magnification hovers/focuses the `?` to read the metric
definition. The popover appears in the empty region beneath the cards. Because nothing
meaningful sits under it, the user can read the definition and still reach every KPI, label,
bar, and nav link without anything being hidden — even though no Escape dismiss exists. The
absence of a dismiss key is *acceptable here* precisely because Method 1's non-obscuring
condition is met (overlap is only with exempt white space). A screen-reader user gets the
definition via `aria-describedby` as usual. The page does not interfere with viewing or
operating its original content, which is the goal of *Dismissible*.

## Expected ACT-style outcome
**passed** — additional content on hover/focus obscures only white space, satisfying
Method 1; the missing dismiss mechanism is therefore not required.

## Why automated tools miss it (and why it matters)
A naive "any two overlapping boxes fail" heuristic would **wrongly flag** this page, because
the popover's rectangle does intersect the page region. Only a human can see that the
intersected area is empty canvas, invoke the white-space exception, and rule PASS. This is
the precise false-positive an automated overlap detector would produce — the inverse error
to case-01/02 — and distinguishing it requires the same human meaningful-vs-empty judgment.
Conventional scanners (axe/WAVE/Lighthouse) don't evaluate hover-state geometry at all, so
they say nothing either way; the page is included to test that a reviewer does **not** over-
report on harmless white-space overlap.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Dismissible**
> "Position the additional content so that it does not obscure any other content including
> the trigger, with the exception of white space and purely decorative content, such as a
> background graphic which provides no information."

> **WCAG 2.2 Understanding 1.4.13 — In brief (Goal)**
> "More users can perceive and dismiss non-persistent content."
