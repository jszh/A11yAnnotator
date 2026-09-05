# Invoice actions — real heading context

## Scenario and source pair

The complete overdue-invoice dashboard and all nine short action links are preserved.

**Paired failed source:** `case-03.html`

**Coverage lane:** contextual purpose

## Exact counterfactual repair

Changed the three styled invoice-title paragraphs into real `h2` elements and gave each heading a stable ID. Each action link now uses a self-first `aria-labelledby` reference followed by its invoice heading, so the visible action remains the beginning of the computed name and the invoice-specific context is directly associated. No unrelated content or destination was removed.

## Primary selector

`.invoice .actions a`

## Accessibility mechanism

Each Edit, Void, and Resend link is directly named by its own visible text plus the correct invoice heading. For example, the first link computes to “Edit Invoice #1042 — Northwind Traders.” This no longer relies on advisory preceding-heading context alone.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “Alternatively, authors may choose to use an ARIA technique to associate additional text on the page with the link.”
