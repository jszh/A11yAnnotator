# case-07 — PASS paired repair of case-02

## Scenario and source pair

This is the counterfactual PASS partner for **case-02** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Northwind Pharmacy refill queue: each status help icon shipped with a native title=, but a Bootstrap/jQuery-UI-style tooltip plugin strips the native title on load (removeAttribute('title')) and renders its own gray span.nwtip styled to mimic the native UA tooltip. The author bubble is pointer-events:none, toggled only on mouseenter/mouseleave of the 18px icon, with no Escape handler. Visually near-identical to the case-01 native tooltip, but author-owned, so 1.4.13 applies and it fails.

## Exact repair

Removed the author tooltip plug-in so the unchanged title attributes are rendered only by the user agent. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-02 and this repair.

## Primary selector

`.info[title]`

## Accessibility mechanism

The pharmacy cards and title strings remain, but no script removes title or creates span.nwtip. Any tooltip appearance is therefore completely controlled by the user agent and is excluded from SC 1.4.13 applicability.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-02. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: removed the author tooltip plug-in so the unchanged title attributes are rendered only by the user agent.

## Citation retained from the source case

**Reference:** wcag-techniques/failures/F95.html

> The objective of this failure is to describe a situation where users find it difficult or impossible to move the pointer over additional content that appears on hover.

