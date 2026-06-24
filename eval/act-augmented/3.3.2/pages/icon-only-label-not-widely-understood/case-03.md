# case-03 — Robo-advisor field whose only cue is an "equalizer/sliders" glyph meaning risk tolerance

## Scenario
"Northvale Invest" is a robo-advisor onboarding wizard. On *Step 2 — Preferences*, a field's ONLY
visible cue is a three-horizontal-slider "equalizer / mixer" glyph in a round 46px badge to the left
of the input (with a trailing "/ 10"). The field silently expects the investor's risk-tolerance
score from 1 to 10. An equalizer is conventionally a sound-mixing / generic-settings symbol; it is
not conventionally associated with "risk tolerance," so a sighted investor cannot infer from the
glyph what value to enter.

## Attribute tuple
- **content-domain:** online banking / fintech — robo-advisor onboarding wizard
- **UI-component/pattern:** stepper / wizard step with an icon-prefixed numeric field
- **host-language construct:** `<span aria-hidden="true"><svg>…sliders…</svg></span>` beside `<input aria-label="Risk tolerance score from 1 to 10">`
- **locale/i18n:** en-US
- **failure-mechanism:** domain-obscure icon-only label — an equalizer glyph not conventionally meaning "risk tolerance"

## Developer persona
A designer building the wizard wanted a "premium, label-light" feel and mapped each question to a
single icon from a generic UI set. "Risk tolerance" had no obvious icon, so they grabbed the
sliders/equalizer glyph because "it looks like adjusting a level." Engineering added an
`aria-label` to clear the lint gate. No one tested whether a real investor could read "risk
tolerance" out of a mixer glyph.

## Element / selector carrying the issue
- `input[aria-label="Risk tolerance score from 1 to 10"]` — its sole visible cue is the preceding
  `span.eq > svg` equalizer glyph (`aria-hidden="true"`); a "/ 10" suffix gives scale but not meaning.

## Exact accessibility mechanism
The input is exposed with an accessible name "Risk tolerance score from 1 to 10" (from `aria-label`),
so a screen-reader user knows exactly what to enter and 4.1.2 passes. A sighted user sees only an
equalizer glyph and "/ 10"; no visible text states the field is about risk tolerance. Because the
chosen image is not widely understood for that purpose, the visible label fails to communicate what
input is expected — a 3.3.2 failure of the image-label "widely understood" limb, distinct from the
satisfied 4.1.2 name-presence requirement.

## Expected ACT-style outcome
**failed** (SC 3.3.2 Labels or Instructions — visible-cue-adequacy limb). Programmatic name present
(4.1.2 passes); visible cue is a domain-obscure glyph not understood as "risk tolerance."

## Why automated tools miss it
axe-core / Lighthouse confirm an accessible name via `aria-label` and report no label violation; the
glyph SVG is `aria-hidden`. No tool renders the equalizer glyph or carries any model of which symbols
"mean" risk tolerance to a financial-services audience. Deciding that a sliders/mixer glyph is not
"widely understood by the intended target audience" for a risk-tolerance field is an audience-relative
human semantic judgment.

## Citation
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "Using images as labels meets the requirements of the criterion, but care should be taken to ensure that the images are widely understood by the intended target audience. Authors may consider providing additional hints, such as text-based tooltips or supplementary text, to support clarity when using image-based labels."
>
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "Instructions or labels may also specify data formats for data entry fields, especially if they are out of the customary formats or if there are specific rules for correct input."
