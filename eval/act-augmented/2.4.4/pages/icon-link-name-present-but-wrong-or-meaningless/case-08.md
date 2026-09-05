# Transit article back icon — repaired image alternative

## Scenario and source pair

The complete Harbor Ledger transit article from source case-02 is retained, including masthead, article navigation, body, and pager.

**Paired failed source:** `case-02.html`

## Exact counterfactual repair

Changed only the linked image’s misleading `alt="forward"` to `alt="Back to all Transit stories"`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`.artnav > a.iconnav[href="/transit/index"]`

## Accessibility mechanism

Because the adjacent visual caption remains `aria-hidden`, the repaired image alternative becomes the link’s accurate accessible name.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “The text of or associated with the link is intended to describe the purpose of the link.”

