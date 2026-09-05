# Speaker details — computed-name boundary

## Scenario and source pair

The complete Volt & Wire highlights page and Aurora product destination are preserved. The suspicious chevron link now has a destination-specific computed accessible name.

**Paired failed source:** `case-05.html`

**Coverage lane:** accessibility-tree/applicability

## Exact counterfactual repair

Added only `aria-label="Aurora Bluetooth speaker details"` to the failing Aurora product anchor and hid the chevron glyph from the name computation. The anchor, destination, content, and navigation purpose are unchanged.

## Primary selector

`.spotlight:nth-of-type(2) a.chev`

## Accessibility mechanism

The accessibility tree exposes a link named `Aurora Bluetooth speaker details`. The visible glyph remains suspicious, but the computed name now identifies the preserved product destination.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **Trusted Tester 6.A (`refs/trusted-tester/sc-2.4.4-link-purpose.md`):**
> “The purpose of each link can be determined from any combination of the link text, accessible name, accessible description, and/or programmatically determined link context.”
