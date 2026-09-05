# Sales/support email — separate paragraph contexts

## Scenario and source pair

The complete Latchkey contact card and its distinct sales and production-support mailto destinations are preserved; both links still read `Email us`.

**Paired failed source:** `case-03.html`

**Coverage lane:** contextual purpose

## Exact counterfactual repair

Placed each mail link in its own paragraph whose text identifies either pricing/trial inquiries or broken-production support. No unrelated content or destination was removed.

## Primary selector

`.card p > a[href^="mailto:"]`

## Accessibility mechanism

The identical names are now disambiguated by separate allowed paragraph contexts rather than one shared ambiguous paragraph.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **act-rules/extracted/fd3a94.md:**
> “This rule assumes that reading the URL, such as from the status bar when the link is focused, is not considered part of the context, and therefore, it does not disambiguate links.”

