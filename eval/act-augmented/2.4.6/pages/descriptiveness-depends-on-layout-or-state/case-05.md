# case-05 — Interaction-driven label change: "Show details" relabels to "Submit" but only toggles a panel

## Scenario
A CRM lead-detail card with two buttons. The first, labeled **"Show details"**, toggles a
details panel — its initial label correctly describes its function. After the user clicks
it, the script **relabels it to "Submit"** while the button still only expands/collapses
the panel; it submits nothing. In the post-interaction state the visible label no longer
describes the control's function and falsely promises a submission. The second button is a
**pass control**: it relabels on interaction too ("Show notes" ⇄ "Hide notes"), but its
new label stays descriptive in every state — demonstrating that interaction-driven
relabeling is fine when the result is still accurate.

## Attribute tuple
- **content-domain**: SaaS CRM (lead detail record)
- **UI-component/pattern**: disclosure toggle button whose label mutates on click
- **host-language construct**: `<button aria-expanded>` with `textContent` swapped in JS
- **locale/i18n**: en
- **failure-mechanism**: label limb — interaction changes the label to one that misdescribes the control's function

## Developer persona
A dev reused a generic toggle handler across the card. For the notes button they wrote the
correct two-state pattern ("Show notes"/"Hide notes"). For the details button they
copy-adapted it but, distracted, typed the "expanded" label as "Submit" — perhaps
intending a future save action that never shipped — instead of "Hide details". Because the
initial render shows the correct "Show details", a glance at the page (and a static DOM
scan) looked fine; the bad label only appears after a click.

## Element / selector carrying the issue
- FAIL: `#detailsBtn` — initial label "Show details" (descriptive) becomes "Submit" after
  the click handler runs, while the control merely toggles `#detailsPanel`. Verified at
  runtime: after `click()` the button's `textContent` is "Submit".
- PASS boundary: `#notesBtn` — relabels "Show notes" → "Hide notes" on interaction; the
  new label still describes the function in each state.

## Exact accessibility mechanism
TT Test 5.B requires that "any changes to form labels that occur automatically or as a
result of interaction" be included in the label-adequacy judgment. After interaction the
"Submit" label tells every user — sighted, screen-reader, voice-control — that activating
the control will submit the record. In reality it only collapses a details panel. A
voice-control user who says "click Submit" triggers a no-op toggle; a screen-reader user is
told the control submits; all users are misled about the function. Crucially, at every
single instant the button's visible text equals its accessible name (label-in-name is
satisfied in both states), so the defect is purely the *adequacy* of the label relative to
the function — and only in the post-click state.

## Expected ACT-style outcome
**failed** (after interaction a visible button label no longer describes the control's
function; the page contains a non-descriptive interaction-driven label).

## Why automated tools miss it
A static scan of the initial DOM sees "Show details" — a perfectly descriptive label — and
passes. The accessible name matches the visible text in both states, so label-in-name
(the only adjacent thing a linter checks) is green throughout. No automated tool clicks the
button, observes the relabel to "Submit", and reasons that a control which only toggles a
panel must not be labeled "Submit". That requires driving the interaction and understanding
what the control actually does — human evaluation. The pass control (notes button) shows
that "label changed on click" alone is not a violation, so even a hypothetical
mutation-watching tool would over-flag without semantic judgment.

## Citation
> **Trusted Tester v5.1.3 — Test 5.B (Notes)**
> "Any changes to form labels that occur automatically or as a result of interaction should
> be included."

> **WCAG 2.2 Understanding 2.4.6 — Intent (labels limb)**
> "This success criterion does not require the use of labels; however, it does require that
> if labels are present, they must be accurate and sufficiently clear or descriptive."
