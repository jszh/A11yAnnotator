# case-04 — Vendor field whose only label is a repurposed company brand-mark glyph

## Scenario
"Quillbeck" is a B2B accounts-payable app. On *Add a vendor*, the first two fields have proper
visible text labels ("Vendor name", "Billing email"). The third, full-width field has NO text label —
its only visible cue is the Quillbeck brand mark (a decorative quill nib inside a rounded square),
the exact same logo glyph used in the top bar, dropped into a 46px tile to the left of the input.
The field expects the internal Quillbeck vendor account ID, but a brand mark carries no inherent
meaning about data entry, so a sighted user cannot infer what to type.

## Attribute tuple
- **content-domain:** B2B fintech — accounts-payable / vendor management
- **UI-component/pattern:** two-column form grid with one icon-prefixed full-width field
- **host-language construct:** decorative brand `<svg>` (`aria-hidden`) reused as a field cue beside `<input aria-label="Quillbeck vendor account ID">`; sibling fields use real `<label for>`
- **locale/i18n:** en-US
- **failure-mechanism:** decorative brand mark repurposed as an icon-only field label, conveying no field-purpose meaning

## Developer persona
An engineer needed "one more field" on the vendor form and, short on icons, reused the company logo
component that was already imported for the header ("it's on brand, and every other field has an icon
to its left"). They added an `aria-label` so the field would not trip the accessibility lint, unaware
that a logo says nothing to a sighted user about entering a vendor account ID — and that the two
real-label fields above set an expectation this field silently breaks.

## Element / selector carrying the issue
- `input[aria-label="Quillbeck vendor account ID"]` inside `.branded` — its only visible cue is the
  preceding `span.brandcue > svg` (the decorative Quillbeck logo, `aria-hidden="true"`). No `<label>`.

## Exact accessibility mechanism
The input is exposed with role `textbox` and accessible name "Quillbeck vendor account ID" (from
`aria-label`; the logo SVG is `aria-hidden`), so a screen-reader user knows the field and 4.1.2
passes. A sighted user sees only a brand mark and no text — the visible cue is a decorative logo that
communicates no field purpose. Unlike the sibling fields with real `<label>`s, this field presents no
understandable visible label to all users, failing the 3.3.2 image-label "widely understood" limb (a
brand mark is, by construction, not a widely-understood symbol for "vendor account ID").

## Expected ACT-style outcome
**failed** (SC 3.3.2 Labels or Instructions — visible-cue-adequacy limb). Accessible name present
(4.1.2 passes), sibling fields are correctly labeled, but this field's only visible cue is a
meaningless decorative brand glyph.

## Why automated tools miss it
axe-core / WAVE confirm the input has an accessible name (`aria-label`) and the brand SVG is
`aria-hidden`, so no label violation is reported. No tool can recognise that the rendered glyph is
merely the company logo reused as decoration, nor reason that a brand mark conveys no field-purpose
meaning to a sighted user. That the glyph is not a label "widely understood by the intended target
audience" is a human visual-semantic judgment.

## Citation
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "Using images as labels meets the requirements of the criterion, but care should be taken to ensure that the images are widely understood by the intended target audience."
>
> **Reference:** Trusted Tester v5.1.3 — SC 3.3.2, Test 5.A Notes (`refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`)
>
> **Quote (verbatim):** "The label or instruction must be **visible when the form field has focus**."
