# Backend role — terse but identifying title

## Scenario and source pair

The full Northwind Robotics job posting is preserved. Its title is now terse and template-like, but it names the exact role and employer that dominate the page.

**Paired failed source:** `case-03.html`

**Coverage lane:** contextual-purpose title

## Exact counterfactual repair

Changed only the title from the footer mission statement to `Senior Backend Engineer (Payments) — Northwind Robotics`. No unrelated content or destination was removed.

## Primary selector

`head > title`

## Accessibility mechanism

The compact title genuinely identifies this posting’s topic and purpose; it is not relying on mere non-empty title presence.

## Expected ACT-style outcome

**passed** — SC 2.4.2

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **wcag-techniques/failures/F25.html:**
> “A site generated using templates includes the same title for each
                                page on the site. So the title cannot be used to distinguish among
                                the pages.”

