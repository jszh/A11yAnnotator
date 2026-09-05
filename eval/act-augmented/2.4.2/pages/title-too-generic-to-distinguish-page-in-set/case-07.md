# Riverstone bottle — repaired distinguishing title

## Scenario and source pair

The full Riverstone Outdoors product-detail page from source case-01 is retained, including collection navigation, breadcrumb, product name, capacity, and purchase controls.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Replaced the generic `<title>Online Store</title>` with `750 ml Stainless Steel Insulated Water Bottle — Riverstone Outdoors`. The source fixture’s explanatory footer sentence was updated to describe the repaired title rather than falsely claim that every page still uses “Online Store”; no functional page content, layout, behavior, or destination changed.

## Primary selector

`head > title`

## Accessibility mechanism

The title now distinguishes this specific product and size from the other pages in the store.

## Expected ACT-style outcome

**passed** — SC 2.4.2

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **Trusted Tester SC 2.4.2, Test 12.B (`refs/trusted-tester/sc-2.4.2-page-titled.md`):**
> “If the web page is part of a set of web pages, determine whether the Page Title is sufficient to distinguish the web page from other pages.”
