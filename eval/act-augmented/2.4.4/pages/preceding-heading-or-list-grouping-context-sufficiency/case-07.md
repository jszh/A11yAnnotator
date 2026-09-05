# Convention hotel links — repaired programmatic context

## Scenario and source pair

The complete convention hotel page from source case-01 is retained, including both hotel descriptions and the pooled quick-links bar.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Added only purpose-specific `aria-label` values to the six Map, Photos, and Book now anchors, incorporating Royal Palm Hotel or Hotel Three Rivers as appropriate. The booking names preserve the complete visible label (“Book now”) before adding hotel context, so the repair also satisfies Label in Name. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`.resource-bar a`

## Accessibility mechanism

Although visual grouping remains unchanged, every link now has programmatically determinable hotel context and a unique, accurate purpose.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “The link can be made understandable out of context by providing additional text in the accessible name or description.”
