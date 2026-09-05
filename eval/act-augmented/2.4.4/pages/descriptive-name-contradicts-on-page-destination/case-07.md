# Credit-union legal links — repaired destination

## Scenario and source pair

The full Ferndale Credit Union Help & Legal Centre from source case-01 is retained, including privacy, terms, and fee sections plus footer navigation.

**Paired failed source:** `case-01.html`

## Exact counterfactual repair

Changed only the Privacy Policy link target from the contradictory `#terms` fragment to the matching `#privacy` fragment. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`footer nav[aria-label="Legal documents"] a[href="#privacy"]`

## Accessibility mechanism

The descriptive link name and actual on-page destination now agree; activating it lands on the Privacy Policy heading.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “The intent of this Success Criterion is to help users understand the purpose of each link so they can decide whether they want to follow the link.”

