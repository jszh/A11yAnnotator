# case-07 — PASS control: a fixed 150px transit-service notice that is genuinely user-dismissible

## Scenario
A government transit portal ("City of Northgate · Metrolink Riverside Line") shows a tall
`position: fixed` bottom notice (~150px) about weekend engineering work. Left in place at the
256px reflow viewport this banner would consume **81%** of the height — identical static markup
to a failing cookie bar. What makes the page **pass** is behaviour: the banner is genuinely
user-dismissible. Its "Dismiss this notice" button **removes the banner from the DOM**
(verified: after activation the `.notice` element is gone and visible fixed chrome drops to 0px),
and the button is the **first focusable element** on the page (the banner precedes `<main>`), so
a keyboard user reaches Dismiss *before* the page content — exactly the "dismiss without
advancing focus past the obscured content" condition.

## Attribute tuple
- **Content domain:** government / municipal transit schedule
- **UI component / pattern:** fixed site notice / service advisory banner
- **Host-language construct:** `section.notice { position: fixed; bottom: 0; min-height: 150px }` with a working `Dismiss` button that calls `.remove()`
- **Locale / i18n:** en
- **Failure mechanism:** none — corrective "dismissible obscuring content" pattern, included as a boundary control

## Developer persona
The transit authority's accessibility team learned from an audit that a permanent fixed banner
fails Reflow at small viewports. Rather than redesign the alert system, they made the banner
dismissible: the Dismiss control truly removes the element (not merely hides a flag), and they
placed the banner *before* `<main>` in the DOM so the Dismiss button is first in tab order,
satisfying the "dismiss without advancing focus past the obscured content" requirement.

## Element / selector carrying the issue
`section.notice` (`position: fixed; bottom: 0; min-height: 150px`) — and decisively its
`.notice .dismiss` button, which executes `this.closest('.notice').remove()` and is the first
focusable element in the document.

## Exact accessibility mechanism
A low-vision user zooms and is initially met by the fixed notice consuming most of the viewport
(81% at 256px). But the very first Tab lands on "Dismiss this notice"; activating it removes the
banner entirely, after which the full schedule, replacement-bus table, and accessibility
information reflow into one readable column with no persistent obstruction (verified: fixed chrome
= 0px post-dismiss). The information in the banner is not lost — it is also conveyed by the inline
`.alert` in the page body and the "Full details" button — so dismissing it costs nothing. This is
the SC's Focus-Not-Obscured overlap satisfied via the explicit "way to dismiss the obscuring
content without requiring the advancement of keyboard focus."

## Expected ACT-style outcome
**passed** (SC 1.4.10). The obscuring fixed content is dismissible by a control reachable without
advancing focus past the obscured content, and after dismissal the page reflows with no loss of
information or functionality.

## Why automated tools miss it
A tool cannot tell a dismissible banner from a permanent one from static markup: both are
`position: fixed` with a button. Whether activating Dismiss truly frees the viewport (vs only
setting a flag, as in case-02) and whether the control precedes the obscured content in focus
order are *behavioural* facts requiring interaction. Verified empirically (Puppeteer): Dismiss is
first in focus order and `.remove()` drops fixed chrome to 0px. An automated checker can neither
confirm the PASS nor distinguish it from case-02's FAIL without rendering, tabbing, and
activating — which is exactly why this control sharpens the aspect.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, Focus Not Obscured overlap (`wcag-understanding/reflow.html`)
> "in the case author created content does obscure content, there is a way for a user to dismiss the obscuring content without requiring the advancement of keyboard focus."

**Reference:** WCAG 2.2 Understanding — Reflow, Focus Not Obscured overlap note (`wcag-understanding/reflow.html`)
> "It is strongly suggested that at smaller viewport sizes that such components are modified to have static positioning, or their display can be toggled by the user."

**Reference:** WCAG 2.2 Understanding — Reflow, sticky-ad corrective figure caption (`wcag-understanding/reflow.html`)
> "Making the advertisement's positioning static, the reflowed content of the web page can be read..."
