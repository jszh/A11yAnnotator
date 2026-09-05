# News documents — external IDREF names

## Scenario and source pair

Both Coastal Ledger document teasers and their separated continuation paragraphs are preserved.

**Paired failed source:** `case-01.html`

**Coverage lane:** external reference

## Exact counterfactual repair

Added IDs to each link and its existing continuation paragraph, then used `aria-labelledby` with self-reference followed by the matching external paragraph. No unrelated content or destination was removed.

## Primary selector

`#fee-link, #routes-link`

## Accessibility mechanism

Each accessible name starts with the visible `Read the full document` label and includes the cross-node document description, making purpose programmatically determinable.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **wcag-understanding/link-purpose-in-context.html:**
> “If the description follows the link, there can be confusion and difficulty for screen reader users who are reading through the page in order (top to bottom).”

