# case-03 — Required-field markers that are background-image asterisks (inline style=)

## Scenario
A volunteer sign-up form for an animal shelter. Mandatory fields (First name, Last name,
Email, Preferred role) are flagged with a red asterisk — but each asterisk is a
`background-image` painted onto an empty `<span class="mark">` via the **HTML `style=`
attribute** (the F3 "style attribute" carrier). There is no literal `*` character, no word
"required", and — deliberately — no `required` or `aria-required` attribute on the inputs.
The optional Phone field has no marker, so the asterisk genuinely carries distinct
information. This is the required-field-marker variant of F3.

## Attribute tuple
- **content-domain:** non-profit / charity web form
- **UI-component / pattern:** labelled form with required-field indicators
- **host-language construct:** inline `style="background-image:url(...)"` on a `<span>` inside `<label>`
- **locale / i18n:** en-GB
- **failure-mechanism:** F3 (style-attribute carrier) — "this field is required" conveyed exclusively by a background image

## Developer persona
A WordPress site-builder user assembled the form in a drag-and-drop plugin and styled the
"required marker" by pasting a Stack Overflow snippet that draws a red asterisk as a tiny
inline-style background image (to dodge a font-rendering glitch with the `*` glyph). The
plugin's own `required` validation was left off because the coordinator wanted to receive
partial applications, so even the implicit programmatic signal is absent.

## Element / selector carrying the issue
- `label .mark` on First name / Last name / Email / Preferred role — empty `<span>` whose
  inline-`style` `background-image` is the only "required" indicator.
- The inputs have **no** `required` / `aria-required`; Phone has no marker at all.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user hears "First name, edit text" with nothing to indicate it is mandatory,
because the `<span class="mark">` is empty in the accessibility tree and the `background-image`
contributes no name. There is no `required` state to announce either. The user cannot tell
required from optional fields, may submit an incomplete form, and only discovers the obligation
after a rejected submission. In forced-colors / "hide backgrounds", the asterisks disappear
visually too.

## Expected ACT-style outcome
**failed** — F3 (style-attribute carrier): the "required" information is conveyed exclusively
by a CSS background image with no text equivalent and no programmatic required-state. ACT
1.1.1 rules are **Inapplicable** (the marker is a background image on a `<span>`, not a
nameable image element).

## Why automated tools miss it
There is no missing-`alt` and no missing-`label` to catch: every field has a proper
`<label for>`. Because no `required`/`aria-required` is present, "required-field is not
indicated programmatically" rules also do not trigger (the page never claims the field is
required in code). axe/WAVE/Lighthouse cannot OCR the asterisk SVG nor reason that the red
asterisk a sighted user sees encodes a mandatory obligation absent from the text. Only a human
comparing the rendered asterisks against the markup spots it.

## Citation
**Reference:** WCAG Technique F3 — *Failure of Success Criterion 1.1.1 due to conveying
information exclusively using CSS background images* (`wcag-techniques/failures/F3.html`).

> "This failure would apply equally in a case where the background image was declared in the
> HTML style attribute, as well as in a case where the background image declaration was created
> dynamically in a client script (see example 3 below)."

**Supporting reference:** WCAG 2.2 Understanding 1.1.1 — Intent
(`wcag-understanding/non-text-content.html`).

> "Text alternatives are a primary way for making information accessible because they can be
> rendered through any sensory modality (for example, visual, auditory or tactile) to match the
> needs of the user."
