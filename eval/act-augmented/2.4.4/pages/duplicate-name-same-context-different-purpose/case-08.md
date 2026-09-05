# Sales and support email links — repaired duplicate names

## Scenario and source pair

The developer-tools contact card from source case-03 is retained with both mailto destinations and their production-versus-sales context.

**Paired failed source:** `case-03.html`

## Exact counterfactual repair

Changed only the identical `Email us` names to `Email our sales team` and `Email production support`. No unrelated page content, layout, behavior, or destination was changed.

## Primary selector

`.card p > a[href^="mailto:"]`

## Accessibility mechanism

A links-list user can now choose the correct non-equivalent mailbox from the link name alone.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The repaired page preserves the failed source’s realistic context and distractors. It differs only at the target decision boundary, so a detector must evaluate purpose rather than memorize the surrounding template.

## Citation

> **WCAG Understanding 2.4.4 (`wcag-understanding/link-purpose-in-context.html`):**
> “The intent of this Success Criterion is to help users understand the purpose of each link so they can decide whether they want to follow the link.”

