# case-06 — TRUE-NEGATIVE: required (green) vs optional (charcoal) labels differ by >3:1 lightness → PASSES via the escape hatch

## Scenario
A "Create API key" form in the Helios developer console. Required field labels are **green**
(`#2e8b2e`); optional field labels are **charcoal** (`#222222`). There is **no "(required)"
text** — the distinction is purely the label colour. But the two colours differ **both in hue
(green vs near-neutral) and in lightness**: the contrast ratio between the two label colours is
**~3.67:1 (>= 3:1)**. Per the WCAG 1.4.1 Understanding note, a difference in lightness that
reaches a 3:1 contrast ratio counts as an *additional visual distinction*, so the
required/optional split is not hue-only — it survives greyscale and colour-vision deficiency as
a light-vs-dark difference. The page therefore **passes 1.4.1** via the lightness escape hatch.

## Attribute tuple
- **content-domain:** developer tools / API console (dev-ops)
- **UI-component/pattern:** "create resource" settings form (API-key generation)
- **host-language construct:** `.f.req label { color:#2e8b2e }` (green, lighter) vs
  `.f:not(.req) label { color:#222 }` (charcoal, darker); no text cue
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — boundary case to confirm the evaluator applies the 3:1-lightness
  escape hatch instead of reflexively failing a colour-coded required cue

## Developer persona
A platform engineer building an internal dev console read the WCAG 1.4.1 Understanding note and
deliberately chose label colours that differ in lightness, not just hue — a dark charcoal for
optional and a noticeably lighter green for required — so the distinction would hold up in
greyscale. They verified the green-vs-charcoal contrast was above 3:1 and the green-on-white text
was above 4.5:1. They intentionally relied on the lightness rule rather than adding "(required)"
text, treating it as the minimal conformant approach.

## Element / selector carrying the issue
No issue. Relevant elements: `.f.req label` (Key name, Scope, Environment) rendered green
`#2e8b2e`, versus `.f:not(.req) label` (Description, Allowed IP range, Auto-expire after)
rendered charcoal `#222222`. These should be judged PASS via the lightness escape hatch, not
flagged.

## Colour math (sRGB, WCAG relative-luminance formula)
- required green `#2e8b2e` vs optional charcoal `#222222` → **3.67:1** (>= 3:1 → escape hatch met)
- required green `#2e8b2e` vs white background `#ffffff` → 4.33:1 (meets 1.4.3 text contrast)
- optional charcoal `#222222` vs white `#ffffff` → 15.9:1 (meets 1.4.3)

## Exact accessibility mechanism (what AT experiences, why it passes)
A sighted user with red-green or any colour-vision deficiency perceives the required labels as
distinctly *lighter* than the optional labels regardless of hue, because the two colours are
~3.67:1 apart in relative luminance — so they can still tell required from optional. Viewing the
page in greyscale (the Trusted Tester detection method) preserves that light-vs-dark difference:
the green collapses to a mid grey and the charcoal to near-black, and the two remain
distinguishable. (Note: a screen-reader user still gets no "required" announcement because there
is no `aria-required`/text cue — that is a separate 1.3.1/3.3.2 matter; 1.4.1 only requires a
*visible* non-colour-hue alternative, which the lightness difference supplies.)

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
This is the boundary an over-eager rule gets wrong. A heuristic that fails any "colour-coded
required field" would wrongly fail this page. Automated tools do not compute the lightness
(luminance) difference *between two label foreground colours* and apply the 3:1 escape hatch from
the 1.4.1 Understanding note — they only check foreground-vs-background contrast for 1.4.3. So a
tool cannot affirm the pass for the right reason, and a naive judge might fail it. Correctly
passing this requires computing the inter-label contrast ratio and knowing the escape-hatch rule
— a quantitative + interpretive judgment.

## Citation
> **WCAG 2.2 Understanding, Use of Color — Note on lightness:**
> "If content is conveyed through the use of colors that differ not only in their hue, but that
> also have a significant difference in lightness, then this counts as an additional visual
> distinction, as long as the difference in relative luminance between the colors leads to a
> contrast ratio of 3:1 or greater. For example, a light green and a dark red differ both by
> color (hue) and by lightness, so they would pass if the contrast ratio is at least 3:1."

(Verbatim from `wcag-understanding/use-of-color.html`. The required green and optional charcoal
differ in both hue and lightness with an inter-colour contrast of ~3.67:1 ≥ 3:1, so the
distinction counts as an additional visual distinction and the page passes.)

> **WCAG Techniques, F81 — note on the lightness exception:**
> "It would also not fail if the color chosen had sufficient luminosity difference (lightness)
> from the other text that it would be easily be seen as different if viewed in black and white.
> A minimum contrast ratio of 3:1 is considered sufficient."

(Verbatim from `wcag-techniques/failures/F81.html`. This page meets that exact exception — the
required and optional label colours have a luminosity (lightness) difference of ≥ 3:1, so it is
not a colour-only failure.)
