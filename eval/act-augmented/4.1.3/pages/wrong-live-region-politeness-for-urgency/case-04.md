# case-04 — Refill-outcome live region muted to `aria-live="off"` by an on-by-default "Focus mode" toggle (backwards SCR14)

## Scenario
A hospital patient-portal "Refill prescription" screen has a valid status region for the
refill outcome: `<p id="refillStatus" role="status" aria-live="…" aria-atomic="true">`.
The developer added a "Focus mode" button — copied from SCR14's *let users silence
non-emergency alerts* pattern — but wired it backwards and left it **on by default**. In
the "On" state the handler sets the outcome region to `aria-live="off"`. So when the
patient submits a refill for a controlled medication and the gateway blocks it
("Refill request FAILED… requires prescriber re-authorization. Call your clinic."), that
consequential failure message is written into a region that is currently muted. A sighted
user sees the red error; a screen-reader user — for whom the chatty-alerts toggle is
silently active — hears nothing and reasonably believes the refill went through. The
politeness value is dynamically *wrong in the dangerous direction*: `off` at the exact
moment the status message must be announced.

## Attribute tuple
- **content-domain:** healthcare / hospital patient portal (prescription refill)
- **UI-component / pattern:** refill form with an outcome status region + a "Focus mode" announcement toggle
- **host-language construct:** `<p role="status" aria-live="off|polite" aria-atomic="true">` whose `aria-live` is flipped by an `aria-pressed` toggle that defaults to muted
- **locale / i18n:** en-US, clinical register
- **failure-mechanism:** muted-when-it-matters — a backwards/on-by-default SCR14 toggle sets the outcome region `aria-live="off"`, so the status message is not surfaced

## Developer persona
The developer liked SCR14's idea of letting users quiet chatty announcements and reused
its toggle, but inverted the logic and shipped it enabled by default: "Focus mode: On"
sets `aria-live="off"` on the *outcome* region (not just a low-value ticker), and a fresh
visitor lands with announcements already suppressed. They tested visually — the red error
appears on submit — and never ran a screen reader with the default toggle state to hear
that the failure message is announced to no one.

## Element / selector carrying the issue
`p#refillStatus[role="status"]` whose `aria-live` is set to `"off"` by
`button#focusToggle` (which starts `aria-pressed="true"`, so the region is muted at load
and on every submit until the user manually turns focus mode off). The refill-failure text
is injected by the handler on `button#submitBtn`.

## Exact accessibility mechanism
`aria-live="off"` tells assistive technology **not** to announce updates to the region;
the region is still a valid `role="status"` container in the DOM, but while muted its
content changes are not surfaced. Because "Focus mode" defaults to On, `#refillStatus`
is `aria-live="off"` when the user presses *Submit*, so injecting the failure text
("Refill request FAILED… requires prescriber re-authorization… please call your clinic")
produces no announcement. The message unambiguously meets the WCAG definition of a status
message — it reports the *result of an action* and *the existence of an error*, and it
takes no focus — yet it is not programmatically surfaced. This is exactly WCAG `F103`:
a status message that cannot be programmatically determined / is not announced by AT. The
markup is valid and the text is present (so absence-checkers pass); the defect is the
**runtime politeness value (`off`) being wrong at the instant the status fires**, leaving
the non-visual user believing the refill succeeded.

## Expected ACT-style outcome
**failed** — a genuine status message (refill outcome / error) is written into a present,
valid live region, but the region is `aria-live="off"` (an on-by-default "Focus mode"
toggle muted it), so AT announces nothing and the screen-reader user never learns the
refill failed. The status message is not surfaced — a direct F103 failure of 4.1.3.

## Why automated tools miss it
`#refillStatus` is a present, non-empty-capable live region with valid `role="status"`,
`aria-live`, and `aria-atomic="true"`, and the failure text is genuinely injected into it.
axe-core / WAVE / Lighthouse confirm a correctly-wired status container exists and find no
fault — `aria-live="off"` is a legal value, and a static or single-snapshot scan does not
model that a toggle flipped the region to `off` *before the message was written*. Catching
it requires toggling state, submitting, and listening: noticing that the chatty-alerts
control is on by default and mutes the *outcome* region precisely when it must speak — a
runtime, contextual human judgment.

## Citation
**Reference:** WCAG Techniques — F103 "Failure of Success Criterion 4.1.3 due to providing
status messages that cannot be programmatically determined through role or properties"
(`wcag-techniques/failures/F103.html`)

> "The objective of this technique is to describe a failure where status messages are used
> in content but are not communicated to the user due to a lack of appropriate roles or
> properties."

**Supporting reference:** WCAG 2.2 Understanding SC 4.1.3 — Intent
(`wcag-understanding/status-messages.html`)

> "The intent of this success criterion is to make users aware of important changes in
> content that are not given focus, and to do so in a way that doesn't unnecessarily
> interrupt their work."
