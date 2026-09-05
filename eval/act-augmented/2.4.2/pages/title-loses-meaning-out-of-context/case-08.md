# Notifications — compact settings title

## Scenario and source pair

The full Cadence CRM notification-settings view is preserved with its sidebar, breadcrumb, switches, and workspace preferences.

**Paired failed source:** `case-02.html`

**Coverage lane:** contextual-purpose title

## Exact counterfactual repair

Changed only the bare `Settings` title to `Notifications — Cadence CRM`. No unrelated content or destination was removed.

## Primary selector

`head > title`

## Accessibility mechanism

The terse title carries both the specific settings topic and product context, so it remains meaningful outside the page.

## Expected ACT-style outcome

**passed** — SC 2.4.2

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **Trusted Tester v5.1.3 (refs/trusted-tester/sc-2.4.2-page-titled.md), Test 12.B Evaluate Results:**
> “If the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other pages in the web site.”

