# case-08 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Marketplace listing whose 'Verified seller' green-check badge — the only per-listing signal that this seller passed identity verification — is an inline SVG suppressed from AT via role=presentation + aria-hidden. Unverified sellers render the same row without the check, so the badge's presence is the data; no text states this seller is verified.

## Exact repair

Removed the decorative suppression and exposed the unchanged check badge as role=img with the equivalent name “Verified seller”. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`.seller-row .badge > svg[role="img"][aria-label="Verified seller"]`

## Accessibility mechanism

The badge’s pixels and marketplace context are unchanged. Removing role=presentation/aria-hidden and supplying role=img plus aria-label="Verified seller" places the trust fact in the accessibility tree.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: removed the decorative suppression and exposed the unchanged check badge as role=img with the equivalent name “Verified seller”.

## Citation retained from the source case

**Reference:** wcag-understanding/non-text-content.html

> a swirl in the corner that conveys no information but just fills up a blank space to create an aesthetic effect are all examples of this... This type of non-text content, therefore, is marked or implemented in a way that assistive technologies (AT) will ignore it and not present anything to the user.

