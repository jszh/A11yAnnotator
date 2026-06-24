# case-03 — Accordion "expanded" chevron at 1.81:1 against its header band (the only open/closed graphic fails its adjacent surface; band-vs-page is fine)

## Scenario
A state DMV FAQ uses an accordion. Each header is a colored band `#5C6B7E` (≈5.4:1 against the
white page — comfortable). The only graphic distinguishing an **open** panel from a closed one is
a chevron that points right when collapsed and rotates 90° down when expanded. The chevron is a
"soft slate" `#8A96A6` drawn on the header band, contrasting only **1.81:1** against it. Because
the rotating chevron is the sole visual open/closed cue and it nearly disappears into the band, a
sighted low-vision user cannot tell which sections are expanded — the expanded-state indicator
fails 1.4.11, even though the band contrasts fine with the page.

## Attribute tuple
- **Content domain:** government / civic services portal (DMV registration FAQ)
- **UI component / pattern:** accordion / disclosure (APG accordion) with rotating chevron as the open/closed cue
- **Host-language construct:** `button[aria-expanded] .chev path { stroke:#8A96A6 }` on `.acc-trigger { background:#5C6B7E }`
- **Locale / i18n:** en (US state government)
- **Failure mechanism:** state-indicator (chevron) vs its adjacent surface (header band) at 1.81:1, while header-band-vs-page (5.44:1) passes

## Developer persona
An agency themed a CMS accordion component for the state portal. The brand palette gave them the
slate `#5C6B7E` band; for the chevron they reached for a lighter tint of the same slate so it would
"sit quietly" inside the band rather than shouting. They confirmed the header text (white) passed
contrast and that the bands read clearly against the page, then signed off. Nobody checked the
chevron against the band, because it was treated as a decorative flourish — not realizing it is the
*only* visual signal of expanded vs collapsed.

## Element / selector carrying the issue
`.acc-trigger .chev path` (`stroke:#8A96A6`) rendered on `.acc-trigger` (`background:#5C6B7E`). The
chevron is the open/closed state mark; its adjacent color is the band it is drawn on, giving
**1.81:1**. The band vs the white page is ~5.4:1 — the distractor surface a naive check would use.

## Exact accessibility mechanism
A screen-reader user is fine: each trigger is a `<button>` whose `aria-expanded` is correctly
`true`/`false`, so the state is announced. The failure is visual, for a sighted low-vision user:
the chevron at 1.81:1 against the band is barely perceptible, so its rotation (right vs down) — the
only graphic that says open vs closed — cannot be discerned. The Understanding explicitly cites "an
arrow graphic indicating a menu is selected or open" as a non-text state indicator that "must have
sufficient contrast to the adjacent colors," and 1.81:1 < 3:1. The adjacent color for this internal
mark is the header band, not the page.

## Expected ACT-style outcome
**failed** (SC 1.4.11). The expanded-state indicator (chevron) does not meet 3:1 against its
adjacent surface (the header band). Correct programmatic `aria-expanded` does not satisfy 1.4.11,
which is a *visual* contrast requirement; and band-vs-page contrast is the wrong comparison for the
internal chevron.

## Why automated tools miss it
The `aria-expanded` attribute is present and correct, so any state-exposure check passes. axe/WAVE/
Lighthouse do not measure the contrast of an SVG chevron against the specific band it overlays, nor
do they know the chevron is the sole open/closed cue. A component-vs-page contrast sample would test
the band (passes). Identifying the chevron as the state graphic, and the band as its adjacent
surface, is human visual judgment. The DOM is exemplary APG markup, so nothing trips a linter.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "the component must not lose contrast with the adjacent colors, and non-text indicators such as the check in a checkbox, or an arrow graphic indicating a menu is selected or open must have sufficient contrast to the adjacent colors."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "any visual information necessary to indicate state, such as whether a component is selected or focused must also ensure that the information used to identify the control in that state has a minimum 3:1 contrast ratio."

**Reference:** WCAG Technique G207 — Ensuring that a contrast ratio of 3:1 is provided for icons (`wcag-techniques/general/G207.html`)
> "if the icons are required to understand the content, then the icons need to have a contrast ratio of at least 3:1."
