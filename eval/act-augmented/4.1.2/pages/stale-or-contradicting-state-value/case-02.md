# case-02 — Accordion panel visibly open but trigger keeps aria-expanded="false" (patient portal FAQ)

## Scenario
A Riverside Family Health patient-portal article, "Before Your Appointment," presents an FAQ as a
three-item accordion. The first item, "What should I bring to my appointment?", is rendered **open**:
its wrapper has the `open` class, the disclosure chevron is rotated to the down/expanded position, and
the full answer (a bulleted list of what to bring) is visible. The trigger button, however, exposes
`aria-expanded="false"`. The other two items are genuinely collapsed (collapsed visual + `false`).
A sighted user sees the first panel open; an AT user is told it is collapsed.

## Attribute tuple
- **content-domain:** healthcare / patient portal
- **UI-component/pattern:** disclosure accordion (APG Accordion pattern), first panel default-open
- **host-language construct:** `<h2><button aria-expanded aria-controls>` heading trigger + `role="region"` panel
- **locale/i18n:** en
- **failure-mechanism:** exposed expanded-state value contradicts the rendered open panel

## Developer persona
An agency developer theming a healthcare CMS template. The design called for the first FAQ to be
"open by default" so visitors see an answer immediately. The dev achieved that by adding the `open`
class to the first item in the template markup — but the button's `aria-expanded` was templated as a
static `"false"` for every item and never reconciled with the default-open state. The JavaScript
toggle handler updates both `open` and `aria-expanded` correctly on click, so QA clicking around saw
no problem; the **default-open** item shipped contradictory.

## Element / selector carrying the issue
`.acc.open > .acc-header > .acc-trigger[aria-expanded="false"]` (first accordion trigger). Visual
state: panel `#p1` displayed, chevron rotated. Exposed state: `aria-expanded="false"`.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen reader announces the first trigger as "What should I bring to my appointment?, button,
**collapsed**." A user who expects more content behind a collapsed control may activate it to "open"
it — which actually **closes** the already-open panel, hiding the very content they wanted. The
expanded/collapsed status, which the Understanding doc explicitly names as a state AT must keep up to
date with, is reported as the opposite of reality. The required state is present and its value is
valid; the defect is solely that the value contradicts the rendered state.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The trigger is a real `<button>` (role button), has an accessible name, and `aria-expanded="false"` is
a permitted, valid boolean — ACT 4e8ab6 / 5c01ea / 6a7281 pass and axe/WAVE/Lighthouse stay silent.
No static checker knows that the controlled panel is visibly expanded (chevron rotated, content
showing) while the button says "collapsed." Detecting the contradiction requires rendering the
accordion, observing that panel `#p1` is open, and comparing that to `aria-expanded="false"` — a
rendered-state comparison outside any string-validity rule.

## Citation
> **WCAG 2.2 Understanding 4.1.2 (Intent), `wcag-understanding/name-role-value.html`:**
> "Other examples of user interface control states are whether or not a checkbox or radio button has
> been selected, or whether a collapsible tree view or accordion is expanded or collapsed."

> **WCAG Technique F20 (Failure due to not updating ... when changes ... occur), `wcag-techniques/failures/F20.html`:**
> "the non-text content is updated, but the text alternative is not updated at the same time."

(F20 is the canonical "exposed value left stale relative to the current state" failure shape; here the
exposed `aria-expanded` was not set to match the default-open panel, so AT is given the wrong state.)
