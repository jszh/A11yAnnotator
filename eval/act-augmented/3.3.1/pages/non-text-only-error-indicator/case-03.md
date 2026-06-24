# case-03 — Invalid postcode flagged only by a red border + a CSS background-image error glyph

## Scenario
A car-insurance quote form (Pennine Mutual), re-rendered by the server after a failed submit:
the applicant typed an unrecognised UK postcode (`SW1A 9ZZ XX`), so server-side validation
rejected it and re-displayed the form with the user's data preserved. The server marked the bad
field by adding `class="flagged"` to the postcode `<input>`. That class does exactly two things:
it draws a **red 2px border** and it paints a **red round error glyph as a CSS
`background-image`** (an inline-SVG data URI) into the right edge of the box. Nothing else
changed — no message, no instruction, no asterisk, no hidden text, no `title`, and no
`aria-invalid`/`aria-required`. The red box with its red error icon is the only error signal.

## Attribute tuple
- **content-domain:** finance / insurance (car-insurance quote intake)
- **UI-component/pattern:** server-rendered text-input `<form>`, fields in a two-column row
- **host-language construct:** `<input type="text" class="flagged">` + CSS
  `background-image:url("data:image/svg+xml,…")` glyph
- **locale/i18n:** en-GB (UK postcode, dd/mm/yyyy date, number-plate format)
- **failure-mechanism:** error conveyed by red border + a CSS `background-image` icon — a paint
  operation that never enters the accessibility tree and never appears in any text

## Developer persona
A front-end developer styled invalid fields with a tidy "red border + a baked-in error icon"
look, implementing the icon as a `background-image` data URI "so there is no extra DOM and no
broken-image risk." He toggles it with a single `.flagged` class his validation script adds. He
assumed the red box with the icon "obviously says it is wrong," never rendered an error message,
and never tested with a screen reader — so the meaning lives entirely in the paint.

## Element / selector carrying the issue
`input#postcode.flagged` (value `SW1A 9ZZ XX`). Its red border + the red CSS `background-image`
error glyph are the sole indicator that this field is in error; no text on the page says so.

## Exact accessibility mechanism (what AT experiences, why it fails)
The error cue is a CSS `background-image`, which is a pure paint operation: unlike a real `<img>`,
an `aria-label`, an `aria-invalid` attribute, or even CSS `::before`/`::after` text content, a
`background-image` is **never** part of an element's accessible name and **never** enters the
accessibility tree in any browser. Verified on Chromium (CDP `getPartialAXTree` on `#postcode`):
the accessible name is exactly **"Postcode"** — byte-for-byte the same as it would be without the
`.flagged` class and the same shape as the other fields — with `invalid="false"` and
`required="false"` and no error message. So a screen-reader user hears "Postcode, edit, SW1A 9ZZ
XX," with no "invalid", no "error", and nothing describing the problem, while a sighted user
reads the red box with the red error icon instantly as "this field is wrong." The error is
conveyed by colour + a background-image glyph alone, never in text — the SC 3.3.1 sole-cue
prohibition.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The DOM is pristine: every control has a real associated `<label>`, the page has a title, one
heading, and good contrast — so structural scanners find nothing to flag. A red border is among
the most common decorative styles on the web, and a CSS `background-image` is invisible to
accessibility-tree inspection (tools read names, roles and ARIA, not painted backgrounds), so
axe/WAVE/Lighthouse have no rule that treats "red border + background-image icon" as an error
indicator. There is no error *text* and no `aria-invalid` for a rule to read, so ACT 36b590 finds
nothing to evaluate and passes vacuously. Recognising that the red box with its painted glyph is
the lone error signal, and confirming the meaning is absent from all text, is a rendered-visual
judgment automation cannot make.

## Citation
> **WCAG Techniques, G84 — Description:** "The "in text" portion of the success criterion
> underscores that it is not sufficient simply to indicate that a field has an error by putting an
> asterisk on its label or turning the label red. A text description of the problem should be
> provided."

(Verbatim from `wcag-techniques/general/G84.html`. This page indicates the error only by turning
the field red and painting an icon into it; no text description of the problem is provided, which
is exactly what this technique says is insufficient.)

> **WCAG 2.2 Understanding 3.3.1 — Examples note:** "This success criterion does not mean that
> color or text styles cannot be used to indicate errors. It simply requires that errors also be
> identified using text."

(Verbatim from `wcag-understanding/error-identification.html`. The red border + CSS icon use
colour/styling to indicate the error, which is permitted only if the error is *also* identified
in text — it is not, so the page fails.)
