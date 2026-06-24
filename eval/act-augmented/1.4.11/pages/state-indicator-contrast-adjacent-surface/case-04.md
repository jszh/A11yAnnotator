# case-04 — Radio group boundary: flat-fill selected state PASSES vs mark-on-fill inner dot at 1.46:1 FAILS (same physical colors, different correct adjacent surface)

## Scenario
An auto-insurance quote wizard (step 3 of 5) shows two custom radio groups. **Group A
(Liability)** uses a *flat-fill* selected state: choosing an option fills the whole circle solid
blue `#1565C0`, which contrasts **5.75:1** with the white page — the fill itself is the selection
indicator, so it needs no internal contrast. That is the explicitly-allowed flat-design pattern, so
Group A **passes**. **Group B (Deductible)** uses a *mark-on-fill* pattern: the selected control
fills medium blue `#4A90D9` and a faint inner dot `#7BB0E6` appears as the selection mark — but the
dot is **1.46:1** against the fill it sits on, so Group B **fails**. The page exists to force the
judge to choose the correct adjacent surface: the wrong choice would mark A as fail or B as pass.

## Attribute tuple
- **Content domain:** insurance quote wizard (multi-step coverage selection)
- **UI component / pattern:** custom radio group (APG radio) — two variants: flat-fill vs inner-dot-on-fill
- **Host-language construct:** `input:checked + .ringA { background:#1565C0 }` (fill = indicator) vs `input:checked + .ringB::after { background:#7BB0E6 }` on `.ringB { background:#4A90D9 }`
- **Locale / i18n:** en (US insurance)
- **Failure mechanism:** boundary page — flat-fill PASS (fill vs page 5.75:1) deliberately paired with mark-on-fill FAIL (dot vs fill 1.46:1)

## Developer persona
A dev built two radio groups months apart. The first (liability) used the design system's correct
"solid fill on select" pattern. Later, under deadline, they cloned it for the deductible group but
the designer wanted a "subtler, more refined" selected look, so they softened the fill to `#4A90D9`
and added a pale inner dot `#7BB0E6` for "a bit of depth." Both groups looked selected on their
screen and both controls clearly stood out from the white page, so the dev assumed parity. They
never noticed the second group now relies on an inner dot that barely contrasts with its own fill.

## Element / selector carrying the issue
- **Passes:** `.optA input:checked + .ringA` (`background:#1565C0`) — the flat fill vs the white page (5.75:1). No internal mark, so nothing internal needs 3:1.
- **Fails:** `.optB input:checked + .ringB::after` (`background:#7BB0E6`) on `.ringB` (`background:#4A90D9`) — the inner dot is the selection mark; its adjacent surface is the fill, giving **1.46:1**.

## Exact accessibility mechanism
Screen-reader users are fine in both groups: native radios expose checked state. The visual
difference is the whole point. In Group A, a low-vision user sees a solid blue circle that plainly
differs from the empty grey rings — selection is clear. In Group B, the selected control is a
medium-blue circle with an almost-invisible dot inside; against the other (also-blue when hovered/
styled) controls the user cannot reliably tell *which* option is selected, because the dot that
marks it is 1.46:1 against its fill. Per the Understanding, a flat fill that contrasts with the page
is allowed, but a separate state mark inside the component must contrast 3:1 with that part of the
component. So the identical "blue-ish" aesthetic passes in A and fails in B purely on which surface
is adjacent to the state mark.

## Expected ACT-style outcome
**failed** (SC 1.4.11) — driven by Group B. Group A is a conforming flat-fill example (used here to
sharpen the adjacent-surface judgment, not as the violation). A reviewer who measured both controls
against the page would wrongly pass B; the correct adjacency for B's inner dot is its fill.

## Why automated tools miss it
Both groups use real native radios with correct labels and checked state — nothing for a linter to
flag. axe/Lighthouse compute no contrast for these CSS shapes/pseudo-elements, and even a
component-vs-page heuristic would pass *both* groups (A legitimately, B via the 3.34:1 fill-vs-page
distractor). Distinguishing "flat fill = indicator, compare to page" from "inner dot = indicator,
compare to fill," and recognizing that the same blue palette yields opposite verdicts, is a
human-only segmentation + pattern-classification judgment.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "It is possible to use a flat design where the status indicator fills the component and does not contrast with the component, but does contrast with the colors adjacent to the component."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "The second and third show the radio button selected and filled with a color that contrasts with the color adjacent to the component. The last example shows the state indicator contrasting with the component colors."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "For visual information required to identify a state, such as the check in a checkbox or the thumb of a slider, that part might be within the component so the adjacent color might be another part of the component."
