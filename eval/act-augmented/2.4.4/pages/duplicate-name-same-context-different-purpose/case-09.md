# Bakery forms — separate paragraph contexts

## Scenario and source pair

The full bakery page and both non-equivalent order forms are preserved; both links still visibly read `order form`.

**Paired failed source:** `case-01.html`

**Coverage lane:** contextual purpose

## Exact counterfactual repair

Split the original combined lead paragraph into separate paragraphs, one naming celebration cakes and one naming sourdough and bread boxes. No unrelated content or destination was removed.

## Primary selector

`.lead > a`

## Accessibility mechanism

Each identical name is now resolved by its own allowed paragraph context, so the user can determine which form each link opens.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **wcag-understanding/link-purpose-in-context.html:**
> “It is a best practice for links with the same destination to have consistent text (and this is a requirement per Success Criterion 3.2.4 Consistent Identification for pages in a set). It is also a best practice for links with different purposes and destinations to have different link text.”

