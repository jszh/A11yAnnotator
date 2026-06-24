# case-06 — Dark-mode inputs: border subsumed into near-black panel, interior-vs-panel is 1.15:1 (FAIL)

## Scenario
"Ledgerwise," a fintech dashboard in **dark mode**. The "Create a restricted key" panel is a
near-black card (`#11151C`). Its inputs have a near-black interior fill (`#1B2230`) and a faint
decorative border (`#3A4658`). This is the dark-mode INVERSE of the canonical subsumed-border
pass: a literal per-edge tool measures the border vs the panel (1.91:1) or vs the interior
(1.67:1) and flags the border — but applying the subsumption rule correctly reveals the *real*
failure. The faint border is closest in brightness to the near-black surroundings and is
subsumed, leaving the meaningful adjacency interior-vs-panel = **1.15:1**, below 3:1, so the
inputs are not identifiable. **FAIL.**

## Attribute tuple
- **content-domain:** fintech / developer dashboard (API key management)
- **UI-component/pattern:** dark-mode text inputs on a near-black panel
- **host-language construct:** `<input>` with `background:#1B2230` interior + 1px `#3A4658` border inside a `#11151C` panel
- **locale/i18n:** en-US
- **failure-mechanism:** once the faint border is subsumed into the dark surroundings, the interior fill vs the panel is 1.15:1 — nothing perceptibly identifies the input

## Developer persona
A developer ported a light-mode form to dark mode by inverting the palette: panel and input
fill both became near-black with only a couple of luminance steps between them, and the border
was darkened to "look subtle." On their high-quality monitor in a dim room they could still
make out the fields, so it shipped. An automated scan flagged the border (1.91:1), prompting a
"darken/adjust border" ticket — which would not fix the actual problem (the invisible
interior-vs-panel adjacency).

## Element / selector carrying the issue
`.panel .field input` — interior `#1B2230` vs panel `#11151C` = 1.15:1 (the meaningful
adjacency, once the subsumed `#3A4658` border is ignored). All three inputs (Key name, Allowed
IP range, Expires) are affected.

## Exact accessibility mechanism
A low-vision user looking at the panel sees an almost uniform near-black field; the input
boxes do not stand out from the card. The faint border, being closest in brightness to the
near-black panel, is subsumed into it (the same reasoning that makes a subsumed border a PASS
in the light-mode example) — but here, with the border removed from consideration, the
remaining cue is the interior fill against the panel, which is only 1.15:1. There is no
perceptible visual information identifying that a control is present. Verdict: **FAIL**.

## Expected ACT-style outcome
**failed** — SC 1.4.11 Non-text Contrast (Level AA). After the subsumed border is correctly
ignored, the meaningful visual information identifying the control (interior fill vs panel) is
1.15:1, below 3:1.

## Why automated tools miss it
A per-edge checker flags the declared border (`#3A4658` vs panel 1.91:1; vs interior 1.67:1)
and points the developer at the wrong element — encouraging a border tweak that leaves the
control just as invisible. To reach the correct verdict a tool would have to (1) recognize the
faint border is subsumed into the near-black surroundings and drop it from consideration, then
(2) measure the remaining interior-vs-panel adjacency (1.15:1) as the governing cue. That
two-step interpretation — applying the subsumption rule and then identifying the true
comparison surface — is exactly the human judgment the SC requires; automated tools do not
perform it.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast — "Adjacent colors"
> subsumption rule and dark-background example (`wcag-understanding/non-text-contrast.html`)
>
> **Quote (verbatim):** "The following example shows an input that has a light background on
> the inside and a dark background around it. The input also has a dark grey border which is
> considered to be subsumed into the dark background. The border does not interfere with
> identifying the component, so the contrast ratio is taken between the white background and
> dark blue background."
>
> **Quote (verbatim, Intent):** "Unless the control is inactive, any visual information
> provided that is necessary for a user to identify that a control is present and how to
> operate it must have a minimum 3:1 contrast ratio with the adjacent colors."
