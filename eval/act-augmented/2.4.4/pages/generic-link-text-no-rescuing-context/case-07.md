# Ferry story — repaired generic link text

## Scenario and source pair

The Coastal Ledger ferry-terminal article from source case-01 is retained with its full editorial layout and story content.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Replaced only the generic `Read more` anchor text with `Read the full ferry-terminal approval story`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`.more-row > a[href="/news/ferry-terminal-approved-full"]`

## Accessibility mechanism

The link’s own accessible name now identifies its destination without depending on nearby prose.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “The intent of this Success Criterion is to help users understand the purpose of each link so they can decide whether they want to follow the link.”

