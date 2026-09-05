# Bakery order forms — repaired duplicate names

## Scenario and source pair

The full Hollow Lane Bakery ordering page from source case-01 is retained, including both realistic cake and weekly bread-box forms.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Changed only the two identical `order form` names to `celebration cake order form` and `weekly bread-box order form`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`p.lead > a[href="#cake-form"], p.lead > a[href="#bread-form"]`

## Accessibility mechanism

The two non-equivalent destinations are now distinguishable directly from their accessible names.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “The intent of this Success Criterion is to help users understand the purpose of each link so they can decide whether they want to follow the link.”

