# case-04 — The correct IBAN fix exists only inside a hover-only `title=""` tooltip; the field's visible/announced error is bare

## Scenario
A retail-banking international-transfer step (Meridian Banking). The customer entered the German
IBAN `DE89 3704 0044 0532 0130` — 20 digits with spaces, two digits short — so the payment is
rejected. The field shows a red border and, beside it, a bare message: "This entry can't be
processed." The system actually computed a **correct, adequate suggestion** — "IBAN for Germany
must be 22 characters: country code DE, 2 check digits, then 18 digits, with no spaces — for
example DE89370400440532013000. You entered 20 digits; add the 2 missing digits and remove the
spaces." — but that text exists **only** as the `title=""` attribute of a small red **ⓘ** info
glyph next to the error. It is in no visible text node, it is not in the field's accessible
description (`aria-describedby` points only at the bare message), and the glyph is a
non-interactive `<span>` that cannot receive keyboard focus. The fix is therefore reachable **only
by hovering a mouse** over the icon — an interaction channel keyboard, touch, and many AT users do
not have. The suggestion is on the page but is not provided in any way most users can reach.

## Attribute tuple + developer persona
- **content-domain:** finance / retail banking — SEPA international transfer flow
- **UI-component/pattern:** single-field error with an adjacent info-icon "tooltip" (native `title`)
- **host-language construct:** `<input aria-invalid="true" aria-describedby="iban-err">` whose
  describedby is the bare message; the real fix lives in `<span class="info" title="…full IBAN
  format + example…">` — a `title`-only native tooltip, non-focusable, mouse-hover only
- **locale/i18n:** en-UI with de-DE IBAN rules (DE + 2 check digits + 18 digits = 22 chars)
- **failure-mechanism:** unreachable channel — the only copy of the suggestion is in a hover-only
  `title` attribute, surfaced by mouse hover but never by keyboard focus or touch, and not exposed
  in the field's accessible description
- **persona:** A bank front-end dev wanted the form to look clean, so they kept the inline error
  terse ("This entry can't be processed.") and stuffed the detailed format guidance into the info
  icon's `title` so it would "show on hover." In QA they mouse-hovered the ⓘ, saw the full IBAN
  tip appear, and ticked the "suggestion is shown" requirement. They never tabbed to the field to
  hear what a screen reader announces, never tried it on a phone (no hover), and assumed `title`
  was a universal tooltip. The terse visible error masked that the actual fix is mouse-only.

## Element / selector carrying the issue
- The field that erred: `input#iban[aria-invalid="true"]`, described only by `#iban-err`
  ("This entry can't be processed." — no format, no example, no suggestion).
- The sole copy of the suggestion: `span.info[title]` — the full IBAN format and worked example
  live only in that `title` attribute; the span is not focusable and is referenced by nothing.

## Exact accessibility mechanism (what AT experiences / why it fails)
- A **keyboard-only** user tabs to the IBAN field, sees the red border and "This entry can't be
  processed.", and has no way to reveal the `title` — `title` tooltips appear on mouse hover, not
  on keyboard focus of a non-interactive `<span>`, and the span is not in the tab order. The fix
  never surfaces; they must guess the IBAN format unaided.
- A **screen-reader** user on the field hears "Recipient IBAN, edit, invalid data, This entry can't
  be processed." via `aria-describedby="iban-err"`. The `title` on the separate, non-focusable info
  span is not part of the field's accessible description and is not reliably announced, so the
  format-and-example suggestion is effectively absent from the announced content.
- A **touch / mobile** user has no hover at all; tapping the ⓘ does nothing (it is not a button and
  has no handler), so the `title` never appears. The fix is unreachable.
- The correct suggestion is therefore present in the DOM but **not provided to the user**: it is
  locked in a mouse-hover-only attribute and absent from every visible, announced, and
  keyboard/touch-reachable path.

## Expected ACT-style outcome
**failed** — A correct, knowable suggestion exists, but its only copy is a hover-only `title`
attribute that keyboard, touch, and AT users cannot reach, and it is not exposed as the field's
accessible description; the visible/announced error is bare. The suggestion is not "provided to the
user" through any channel they can use (3.3.3), and a `title`-only tip is exactly the kind of
non-text-description shortcut G84 warns against.

## Why automated tools miss it
A `title=""` attribute is valid HTML — several scanners even treat `title` as a legitimate
accessible-name/description source, so the presence of a populated `title` looks like a positive
signal, not a defect. The field has a real `<label>`, an `aria-invalid` state, and an associated
(if unhelpful) error message; there is *some* error text on the page. No empty attribute, no broken
id reference, and no missing label exists to flag. Recognizing the failure requires a human to read
the `title` to find the real fix, reason that `title` tooltips are mouse-hover-only (never exposed
to keyboard focus on a `<span>`, never on touch, unreliable for AT), and confirm the suggestion
appears nowhere else — an interaction-channel + content judgment axe/WAVE/Lighthouse cannot make.

## Citation
- **Reference:** WCAG 2.2 Understanding Error Suggestion, Intent —
  `wcag-understanding/error-suggestion.html`
  > "The intent of this success criterion is to ensure that users receive appropriate suggestions
  > for correction of an input error if it is possible."
- **Reference:** WCAG 2.2 Technique G84 — Providing a text description when the user provides
  information that is not in the list of allowed values — `wcag-techniques/general/G84.html`
  > "The \"in text\" portion of the success criterion underscores that it is not sufficient simply
  > to indicate that a field has an error by putting an asterisk on its label or turning the label
  > red. A text description of the problem should be provided."
- **Reference:** WCAG 2.2 Understanding Error Suggestion, In brief (What to do) —
  `wcag-understanding/error-suggestion.html`
  > "Where errors are detected, suggest known ways to correct them."
