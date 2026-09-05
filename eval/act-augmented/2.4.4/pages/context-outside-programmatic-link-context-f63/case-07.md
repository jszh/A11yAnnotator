# News document links — repaired in-link context

## Scenario and source pair

Both Coastal Ledger story teasers from source case-01 remain intact, including the visually flowing continuation paragraphs after each document link.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Changed only the two identical link names to `Read the proposed 2025 harbor fee schedule` and `Read the approved fall school-bus route map`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`article .more > a`

## Accessibility mechanism

The distinguishing document purpose is now inside each anchor’s accessible name; the following sibling paragraph is no longer required to interpret either link.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “This can be achieved by putting the description of the link in the same sentence, paragraph, list item, or table cell as the link.”

