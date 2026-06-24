# case-04 — fixed support-chat panel covers the "Give now" CTA at the reflow viewport with no collapse

## Scenario
"Riverside Children's Hospice" runs a single-page donation flow: pick an amount, enter name and
email, press "Give now". A third-party support-chat widget is `position: fixed` in the
bottom-right and **expanded by default** (header bar, greeting, message input, Send). It is ~280px
tall and up to 300px wide. At the 320px reflow viewport the panel parks over the bottom of the
form — directly on top of the "Give now" submit button. Hit-testing confirms the chat covers
**9,258 of the 11,750 px²** of the button (79%), and `document.elementFromPoint` at the button's
centre returns the chat's message **input**, not the button. The widget has a title bar but **no
minimise/collapse/close** control, so the page's primary functionality is unreachable and cannot
be uncovered.

## Attribute tuple
- **Content domain:** nonprofit / donation flow
- **UI component / pattern:** persistent fixed live-chat widget (Intercom/Zendesk-style) over a form
- **Host-language construct:** `section.chat { position: fixed; bottom; right; height: 280px }`, open by default, no collapse control
- **Locale / i18n:** en
- **Failure mechanism:** fixed widget obscures the primary action (loss of *functionality*, not just reading space), with no dismiss/collapse affordance

## Developer persona
A fundraising manager enabled a hosted chat product by pasting its embed snippet, and chose the
"always open so visitors see we're here to help" configuration. On their desktop the panel sits
in an empty corner far from the donate button. They QA'd the donation on a laptop and never
zoomed; nobody on the team tried to submit the form at a 320px viewport, where the fixed panel
migrates over the CTA. The vendor's snippet exposes the open panel but the team never added a
minimise toggle.

## Element / selector carrying the issue
`section.chat` (`position: fixed; bottom: 10px; right: 10px; height: 280px; z-index: 70`),
expanded by default with no collapse control. The victim is `button.give` ("Give now").

## Exact accessibility mechanism
A low-vision user zooms the donation page to complete a gift. The fixed chat panel covers the
"Give now" button: a pointer/voice-control user clicking where the button visually is hits the
chat input instead (verified via `elementFromPoint`), and a keyboard user who reaches the button
finds its focus ring hidden behind the panel with no way to move or dismiss the panel. Because
there is no minimise affordance, the obstruction is permanent — the user cannot complete the
core task of the page. This is the SC's "without loss of *functionality*" limb: fixed content at
the reflow viewport blocks an operation that cannot be reached, with no dismiss path (the
Focus-Not-Obscured overlap).

## Expected ACT-style outcome
**failed** (SC 1.4.10). At the reflow viewport, fixed author content obscures the primary
interactive control with no mechanism to dismiss or collapse it, so functionality is lost.

## Why automated tools miss it
The chat widget is a model citizen to a linter: a labelled region, a real `<input>` with an
associated (visually-hidden) label, a named Send button, and good contrast. The donation form
reflows to one column with zero horizontal overflow. Nothing static is wrong. No automated tool
renders at 320px, computes that the fixed panel's rectangle covers the submit button, hit-tests
the button's centre, or reasons that "no collapse control exists." Verified empirically: the
chat covers 79% of the button and owns its centre point. Recognising the CTA is unreachable —
and irrecoverably so — is a functional-obstruction judgment a human must make at the narrow
viewport.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, "Reflowing websites and web applications" (`wcag-understanding/reflow.html`)
> "Neither adjusting or relocating content is considered a loss of information or functionality, so long as users are still able to access the content."

**Reference:** WCAG 2.2 Understanding — Reflow, Focus Not Obscured overlap note (`wcag-understanding/reflow.html`)
> "commonly toolbars, menubars, navigation and other \"sidebar\" content may be presented with sticky or fixed positions at larger viewport sizes. It is strongly suggested that at smaller viewport sizes that such components are modified to have static positioning, or their display can be toggled by the user."

**Reference:** WCAG 2.2 Understanding — Reflow, Focus Not Obscured overlap (`wcag-understanding/reflow.html`)
> "there is a way for a user to dismiss the obscuring content without requiring the advancement of keyboard focus."
