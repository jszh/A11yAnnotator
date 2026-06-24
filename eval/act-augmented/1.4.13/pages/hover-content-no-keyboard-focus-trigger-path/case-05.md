# case-05 — DECOY: e-commerce swatch hover bubble repeats the already-visible color name (PASS)

## Scenario
"Summit & Pine" outdoor-gear product page for the "Trail Runner GTX" shoe. Each color swatch
shows the color name in a small bubble on hover. That bubble has **no focus path** (it uses
`swatch:hover .hover-name`, no `:focus` equivalent) — which *looks* like the same failure as
the other pages. But the color name is already (1) printed as a persistent visible `<span>`
directly under each swatch and (2) exposed as each radio's accessible name (`aria-label="Pine"`
etc.). The hover bubble is `aria-hidden` and purely redundant. This is the redundancy decoy:
the missing focus path costs nobody any *additional* information, so it is **not** a 1.4.13
perceive failure.

## Attribute tuple
- **content-domain:** e-commerce product detail page
- **UI-component/pattern:** color-swatch radio group (APG "radio group") with a hover label bubble
- **host-language construct:** real focusable `<input type="radio">` swatches + CSS `:hover`-only `.hover-name` bubble
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — boundary PASS; the hover content is redundant with persistent visible text and the radio's accessible name, so no perceivable information is lost on keyboard

## Developer persona
A Shopify-theme developer added swatch "name on hover" as a polish touch, mirroring a pattern
seen on competitor sites — but, doing it right elsewhere, they had already rendered the color
name as visible text under each swatch and set `aria-label` on each radio. The hover bubble
ended up duplicating information that is fully available without it. This page tests whether
the reviewer recognizes redundancy and does NOT over-flag a hover-without-focus pattern that
deprives no one.

## Element / selector carrying the issue (here: the element a naive tool would mis-flag)
`.swatch .hover-name` — revealed only by `.swatch:hover`, no focus path; but it merely repeats
`.swatch-name` (persistent visible text) and the radio's `aria-label`.

## Exact accessibility mechanism
A keyboard user Tabs into the radio group and lands on a real `<input type="radio">` with a
visible `:focus-visible` ring; the color name is already on screen (`.swatch-name`) and already
the control's accessible name (`aria-label`), so a screen reader announces "Pine, radio button,
selected." Nothing about the product or the choice is hidden behind hover. The hover bubble is
`aria-hidden="true"` decoration that restates what is already perceivable. Because 1.4.13
protects perception of the *additional* content, and there is no additional content here,
removing the hover bubble would change nothing for any user. Verdict: **PASS**.

## Expected ACT-style outcome
**passed** — SC 1.4.13 Content on Hover or Focus (Level AA). The hover-revealed content carries
no information beyond persistent visible text and the control's accessible name, so the absence
of a focus-trigger path does not deprive keyboard/AT users of perceivable content.

## Why automated tools miss it
A naive heuristic ("a `:hover` rule with no matching `:focus` rule reveals content") would
FLAG this page — the wrong answer. The disposition turns on the human judgment that the hover
content is **redundant**: the color name is already a persistent visible label and the radio's
accessible name, so nothing is lost. Tools cannot compare the semantic content of a hover
bubble against the surrounding visible text and the accessibility tree to conclude "this adds
nothing." That meaning-equivalence assessment — distinguishing this PASS from the FAIL pages —
is exactly the contextual call automated checkers cannot make.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.13 Content on Hover or Focus — "Intent"
> (`wcag-understanding/content-on-hover-or-focus.html`)
>
> **Quote (verbatim):** "The intent of this success criterion is to ensure that authors who
> cause additional content to appear and disappear in this manner must design the interaction
> in such a way that users can: perceive the additional content AND dismiss it without
> disrupting their page experience."
>
> **Quote (verbatim, In brief — Goal):** "More users can perceive and dismiss non-persistent
> content."
