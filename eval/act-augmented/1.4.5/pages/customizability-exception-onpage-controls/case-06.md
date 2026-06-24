# case-06 — Working size/colour control that re-renders the disclosure image of text but drops the cooling-off line (functional yet non-equivalent)

## Scenario
An auto-insurance quote summary renders its legally required "Important disclosures" block
as an SVG **image of text** (to lock the compliance-approved typeface and layout). It ships
a real C30-style customization control: **A-  A+** size and a "High contrast" colour toggle.
Operating it genuinely re-renders the disclosure as fresh, sharp SVG text at the chosen size
and colour — no pixelation, no inert spans. The trap: the re-render template silently
**omits the third disclosure line** — the 14-day cooling-off / cancellation right that is
present in the default image. So the moment a user *customizes* (the exact action a low-vision
user must take to read it), the output loses material content. The controls work; the
customized result is not equivalent to the original.

## Attribute tuple
- **content-domain:** insurance (auto quote / regulated disclosure)
- **UI-component/pattern:** C30 size + contrast control re-rendering an SVG disclosure
- **host-language construct:** SVG `<text>` re-built in JS from a `LINES` array
- **locale/i18n:** en, US regulatory context
- **failure-mechanism:** customization control re-renders correctly but the customized output omits part of the original text (not equivalent)

## Developer persona
A dev built the disclosure-customizer properly: redraw SVG glyphs at the chosen size/colour,
high-contrast option included. But they hand-typed the disclosure lines into a `LINES` array
for the re-render path while the *default* image was exported separately by the compliance
team. Between drafts the cooling-off clause was added to the compliance image but the dev's
`LINES` array was never updated, so the customized variant is one line short. The control was
QA'd for "does it get bigger / higher contrast" (yes) but not line-by-line against the
default.

## Element / selector carrying the issue
The image of text: `#discSvg` inside `#discWrap`. The control: `.disclosure-controls #inc` /
`#dec` / `#contrastSel`. On first interaction the handler replaces `#discWrap`'s SVG using a
`LINES` array that is missing the cooling-off sentence present in the initial markup.

## Exact accessibility mechanism
A low-vision user cannot read the 14px default disclosure, so they press A+ (or pick High
contrast) — the only way for them to read it. The block re-renders larger and sharper, which
*looks* like a successful customization. But the enlarged version they can now read no longer
contains "A 14-day cooling-off period applies: you may cancel for a full refund within 14
days." The sighted default reader sees four lines; the user who relies on customization sees
three. 1.4.5's customizability exception is met only when the customized image of text
remains **the same effect and information** as the original (TT Test 7.E: "the same effect
and information"); an output that drops a material line is functional but non-equivalent, so
the exception fails. The harm lands specifically on the disabled user who must customize.

## Expected ACT-style outcome
**failed** — SC 1.4.5 (Images of Text, Level AA). The disclosure is an image of text with a
working size/colour control, but the customized (re-rendered) output omits a material line,
so the "can be visually customized" route is not satisfied — the customized image is not an
equivalent presentation of the original text.

## Why automated tools miss it
Both states are technically clean: the SVG has `role="img"` and an `aria-label`, the controls
are labelled `<button>`s and a `<select>`, contrast clears in both colour modes, and the page
is well-formed. axe-core/WAVE/Lighthouse cannot OCR either SVG, cannot diff the default
glyphs against the re-rendered glyphs, and cannot know that one specific regulatory sentence
vanished on customization. Catching this requires a human to read the default disclosure,
operate the control, and compare the customized output line-by-line for completeness — pure
semantic/contextual judgment about content equivalence.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 7.E `1.4.5-image-of-text`, How to Test
> (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
>
> **Quote (verbatim):** "Determine if text can be used instead of the image of text to
> present the **same effect and information**."
>
> **Reference:** WCAG Technique C30 "Using CSS to replace text with images of text and
> providing user interface controls to switch" (`wcag-techniques/css/C30.html`)
>
> **Quote (verbatim):** "Check that when the control is activated the resulting page includes
> text (programmatically determined text) wherever images of text had been used."
