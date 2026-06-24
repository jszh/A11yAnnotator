# case-05 — Radio group flagged only by a reddened <legend>; no text says a choice is required

## Scenario
A French bistro's table-reservation form, re-rendered after the guest submitted without choosing
a seating preference. The required radio group was flagged by reddening its `<legend>`
("Préférence de salle") — `legend.flagged { color:#c11a22; }` — and nothing else. No text states
that a choice is required or that the group is in error; there is no message, no hidden text, no
`aria-required`/`aria-invalid` on the group. The reddened legend is the sole error cue. (The
field labels — Terrasse, Salle intérieure, Cave voûtée — stay neutral.)

## Attribute tuple
- **content-domain:** hospitality / restaurant booking
- **UI-component/pattern:** `<fieldset>`/`<legend>` radio group (APG radiogroup pattern)
- **host-language construct:** `<legend class="flagged">` colour change
- **locale/i18n:** fr-FR (French form copy, `lang="fr"` on the form)
- **failure-mechanism:** error/required state of a radio group conveyed solely by legend colour

## Developer persona
A web agency themed a restaurant template. Their design system styles "section needs attention"
by turning the heading/legend red, applied with a single class their validation script toggles.
The designer liked the clean look and explicitly removed the "(obligatoire)" suffix and the error
sentence from the template because they "cluttered" the elegant layout, trusting the red legend
to carry the meaning.

## Element / selector carrying the issue
`fieldset > legend.flagged` (the red "Préférence de salle"). Its colour is the only indicator
that the radio group is required and was left unanswered.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user entering the group hears the group name "Préférence de salle" followed by
"Terrasse, radio button, not checked, 1 of 3" — exactly as a non-errored optional group would
sound. The legend's red `color` is not announced, there is no "required," no "error," and no
message describing the omission. So a non-visual user cannot tell the field is mandatory or that
it caused the failed submit, while a sighted user reads the red legend as "this group is the
problem." The error is conveyed by colour alone, never in text — the SC 3.3.1 sole-cue
prohibition.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The group is built correctly — real `<fieldset>`/`<legend>`, every radio labelled, keyboard
operable — so structural scanners pass. Colour-only detection (F81) is unreliable, and even a
tool that noticed the legend is red cannot know the red *means* "in error / required" rather
than brand theming (red is a common accent colour). There is no required attribute or message
for a rule to read, so ACT 36b590 finds nothing to evaluate and passes vacuously. Judging that
the reddened legend is the sole cue and that the requirement/error is unstated in text demands a
human looking at the rendered French form.

## Citation
> **WCAG 2.2 Understanding 3.3.1 — Examples note:** "This success criterion does not mean that
> color or text styles cannot be used to indicate errors. It simply requires that errors also be
> identified using text."

(Verbatim from `wcag-understanding/error-identification.html`. The reddened legend uses colour
to indicate the error, which is permitted only if the error is *also* identified in text — it is
not.)

> **WCAG Techniques, F81 — Examples:** "A user submits an online form and leaves a required field
> blank, resulting in an error. The form field that caused the error is indicated by red text
> only, without an additional non-color indication that the field caused an error."

(Verbatim from `wcag-techniques/failures/F81.html`. This page matches the example precisely: a
required radio group left blank, the error indicated by red legend text only.)
