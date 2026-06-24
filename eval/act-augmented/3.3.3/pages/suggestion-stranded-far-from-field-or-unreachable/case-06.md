# case-06 — PASS twin: the same MM/DD/YYYY suggestion placed immediately beside the date field AND reachable via a working jump link

## Scenario
A state-park campsite reservation form. As in the FAIL family, an **Arrival date** field rejects a
wrong-format value (`7/4/26`) and the correct fix is "Use the format MM/DD/YYYY (for example,
07/04/2026)." Here the suggestion is **locatable two ways**: (1) it is repeated **inline,
immediately under the date field**, and is programmatically associated to the input via
`aria-describedby="arrival-fix"`; and (2) the top error-summary item is a **working jump link**
`href="#arrival"` that lands on the real field id (with `scroll-margin-top` so the field is in
view on arrival). The suggestion's wording/quality is on par with the FAIL cases; the only
difference is that it is provided close to, associated with, and reachable from the field. This twin
verifies that PROXIMITY/locatability — not mere presence of the suggestion string — is what is
being judged.

## Attribute tuple + developer persona
- **content-domain:** events / outdoor recreation (state-park campsite booking) — same family as case-01 (festival registration) for a controlled proximity contrast
- **UI-component/pattern:** multi-fieldset form with a top error summary that links to the field + an inline near-field suggestion
- **host-language construct:** `input#arrival[aria-invalid="true"][aria-describedby="arrival-fix"]` with the fix `<p id="arrival-fix">` directly beneath; summary `<a href="#arrival">` resolves to the real field
- **locale/i18n:** en-US; MM/DD/YYYY ordering
- **failure-mechanism:** NONE — included as the passing boundary; the same suggestion is correctly located (near-field + associated + reachable)
- **persona:** A parks-department dev followed the GOV.UK / WCAG G139+G177 pattern deliberately:
  every summary error links to its field, and every error message is repeated at the field and tied
  to the input with `aria-describedby`. They tested the jump link and the screen-reader
  announcement, so both the near-field and the reachable-summary paths work.

## Element / selector carrying the issue
- The (correctly located) suggestion: `p#arrival-fix` directly under `input#arrival`, referenced by
  the input's `aria-describedby`.
- The working jump mechanism: `.errsummary a[href="#arrival"]` → `input#arrival` (real, matching id,
  with `scroll-margin-top`).

## Exact accessibility mechanism (what AT experiences / why it passes)
- A **sighted** user sees the red Arrival-date field with the MM/DD/YYYY fix and a concrete example
  right beneath it — no scrolling or hunting required. From the top summary they can also click "Go
  to Arrival date" to jump straight to the field.
- A **screen-reader** user on the Arrival-date field hears "Arrival date, edit, invalid data, That
  isn't a date we recognize. Use the format MM/DD/YYYY (for example, 07/04/2026)." — because the
  fix is exposed via `aria-describedby`. From the summary, activating "Go to Arrival date" moves to
  the actual field.
- A **keyboard** user can reach the field directly from the summary link; the fix is present both at
  the summary and at the field.
- The correct suggestion is thus provided to the user in a way they can connect to and reach for the
  field that erred.

## Expected ACT-style outcome
**passed** — A correct suggestion is provided and is locatable: associated with and adjacent to the
erroring field (G177) and reachable via a working jump mechanism (G139). The locatability limb is
satisfied.

## Why automated tools miss it
This is the boundary the aspect turns on: a scanner sees "a suggestion exists" on BOTH this page and
the stranded-footer FAIL (case-01) and would treat them identically — it has no measure of proximity
or reachability. Only a human (or a vision/semantic judge) recognizes that here the fix sits beside
the field and the jump link lands on it, so the page passes — exactly the distinction
axe/WAVE/Lighthouse cannot draw, which is why presence-only checking would wrongly equate this PASS
with the FAILs.

## Citation
- **Reference:** WCAG 2.2 Technique G177 — Providing suggested correction text —
  `wcag-techniques/general/G177.html`
  > "Suggestions or links to the suggestions should be placed close to the form fields they are
  > associated with, such as at the top of the form, preceding the form fields, or next to the
  > form fields requiring correction."
- **Reference:** WCAG 2.2 Technique G139 — Creating a mechanism that allows users to jump to
  errors — `wcag-techniques/general/G139.html`
  > "provides a link the field(s) with a problem so the user can easily navigate to it to fix the
  > problem."
- **Reference:** WCAG 2.2 Understanding Error Suggestion, In brief —
  `wcag-understanding/error-suggestion.html`
  > "Where errors are detected, suggest known ways to correct them."
