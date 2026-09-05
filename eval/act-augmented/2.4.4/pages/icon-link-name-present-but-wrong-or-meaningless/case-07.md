# Sales toolbar icons — repaired accessible names

## Scenario and source pair

The full sales-pipeline application from source case-01 is retained, including navigation, toolbar icons, and pipeline columns.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Changed only the three meaningless `aria-label` values to `Search sales records`, `Open workspace settings`, and `Open inbox`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`.tools > a.iconlink`

## Accessibility mechanism

Each icon link now exposes a concise accessible name that matches its actual destination and function.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “Link text that is as meaningful as possible will aid users who want to choose from this list of links.”

