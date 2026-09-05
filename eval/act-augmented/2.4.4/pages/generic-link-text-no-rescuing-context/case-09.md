# Restaurant detail links — list-item context

## Scenario and source pair

The complete Saffron & Sage restaurant footer is preserved with the three generic `Details` links.

**Paired failed source:** `case-03.html`

**Coverage lane:** contextual purpose

## Exact counterfactual repair

Added only `Menu:`, `Private events:`, and `Gift cards:` text inside the corresponding link list items. No unrelated content or destination was removed.

## Primary selector

`footer .col:nth-child(3) a`

## Accessibility mechanism

Each generic-looking link is now rescued by its own allowed list-item context rather than a remote heading or visual column.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **Trusted Tester v5.1.3 SC 2.4.4 (refs/trusted-tester/sc-2.4.4-link-purpose.md):**
> “"Programmatically determined link context" is limited to same sentence/paragraph/list-item/table-cell or associated table header — not arbitrary nearby text.”

