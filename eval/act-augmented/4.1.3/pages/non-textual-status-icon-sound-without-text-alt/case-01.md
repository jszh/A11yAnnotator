# case-01 — Inline validation swaps a gray dot to a red "X" SVG (aria-hidden) inside a present role="alert"

## Scenario
A Meridian Insurance "Auto quote — Driver details" wizard (step 2 of 5). The licence-number field
has inline validation. Beneath the input is a status row that the developer correctly set up as a
live region: `<div role="alert" aria-atomic="true">`. On submit, JavaScript swaps the SVG inside that
row from a neutral gray dot to a red **X** badge when the value is invalid (and to a green check when
valid). The red X is the only thing that changes; there is no text, and the SVG is `aria-hidden="true"`.

## Attribute tuple
- **content-domain:** insurance quote wizard
- **UI-component/pattern:** stepper / multi-step form with inline field validation (APG no specific widget; alert live region)
- **host-language construct:** inline `<svg>` swapped via `innerHTML`, marked `aria-hidden="true"`, inside `role="alert"`
- **locale/i18n:** en
- **failure-mechanism:** non-text status (icon) is the sole carrier of the error state; live region present but its computed text is empty

## Developer persona
A mid-level developer who *had read* about live regions and did the hard part right — they pre-placed
an empty `role="alert"` container in the DOM before any update (the thing F103 and most audits check
for). They then reached for a crisp inline SVG icon set for the visual states and, following the common
"icons are decorative, hide them from AT" rule of thumb, slapped `aria-hidden="true"` on every glyph.
They never added the paired error *text* because the design comp only showed the icon. The result is a
textbook-correct live region whose payload is invisible to AT.

## Element / selector carrying the issue
`#licenceStatus[role="alert"] > svg#vIcon[aria-hidden="true"]` — after an invalid submit it holds the
red-X path. The alert container has no other (text) children, so its accessible/text content is `""`.

## Exact accessibility mechanism (what AT experiences, why it fails)
On invalid submit the `role="alert"` mutation fires, so the screen reader interrupts with its live-region
boundary ("alert") — but then reads nothing, because the only descendant is an `aria-hidden` SVG with
no `<title>`/`aria-label`/`aria-labelledby` and there is no sibling text node. The user hears an alert
ping followed by silence and has no idea the licence number was rejected. A sighted user sees an
unmistakable red X. Per the Understanding doc, an icon status is surfaced through the **combination** of
a text alternative (1.1.1) *and* the status role; here the role is present but the text alternative is
absent, so 4.1.3 fails (routed through 1.1.1). The PASS path (green check) is equally unlabeled but is
out of scope for this FAIL page.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The container has a valid `role="alert"` placed in the DOM before the update — F103 / the missing-live-region
seeds PASS. The SVG carries `aria-hidden="true"`, which is the *recommended* markup for a decorative
graphic, so an alt/name linter sees nothing wrong (there is no missing `alt` attribute on an `<svg>`; it
is explicitly hidden on purpose). No automated tool can decide that this specific dot→X swap *conveys the
error status* (rather than being ornamental) and therefore required a programmatic text equivalent.
Recognizing the red X means "invalid" and that the alert announces an empty string requires visual +
semantic judgment.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Non-textual status content), `wcag-understanding/status-messages.html`:**
> "Changes in content are not restricted to text changes. Where an icon or sound indicates a status
> message, this information will be surfaced by the screen reader through a combination of two things:
> 1) existing WCAG requirements governing text alternatives (under Success Criterion 1.1.1 Non-Text
> Content), and 2) the requirement of this current success criterion to supply an appropriate role."

> **WCAG 2.2 Understanding 4.1.3 (Status message examples), `wcag-understanding/status-messages.html`:**
> "After a user unsuccessfully fills in a form because some of the data is in the incorrect format,
> text is added to the existing form which reads \"5 errors on page\". The screen reader announces the
> same message."

(The role is present and fires, but with no text alternative the icon-only error status is announced as
nothing — the second half of the "combination" the Understanding requires is missing.)
