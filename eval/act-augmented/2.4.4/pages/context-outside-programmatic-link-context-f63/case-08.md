# Account documents table — repaired cell link context

## Scenario and source pair

The banking documents table from source case-02 is retained with separate label cells and action cells for a monthly statement and tax form.

**Paired failed source:** `case-02.html`

## Exact counterfactual repair

Changed only the two `View` link names to `View June 2025 checking statement` and `View 2024 interest tax form`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`td.cta-cell > a.btn`

## Accessibility mechanism

Each link now carries the row’s document identity in its own accessible name, so purpose is determinable even though the label remains in a different table cell.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “This can be achieved by putting the description of the link in the same sentence, paragraph, list item, or table cell as the link.”

