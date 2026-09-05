# Ferry story — same-paragraph context

## Scenario and source pair

The full Coastal Ledger lead story remains intact, including its generic `Read more` anchor.

**Paired failed source:** `case-01.html`

**Coverage lane:** contextual purpose

## Exact counterfactual repair

Added the destination-identifying phrase `Continue the Harbor Commission ferry-terminal approval story:` inside the link’s own paragraph. No unrelated content or destination was removed.

## Primary selector

`.more-row > a`

## Accessibility mechanism

The link text remains generic-looking, but the allowed same-paragraph context objectively identifies the story.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **WCAG Techniques F63 (wcag-techniques/failures/F63.html):**
> “A news service lists the first few sentences of an article in a paragraph. The next paragraph contains the link "Read More...". Because the link is not in the same paragraph as the lead sentence, the user cannot easily discover what the link will let the user read more about.”

