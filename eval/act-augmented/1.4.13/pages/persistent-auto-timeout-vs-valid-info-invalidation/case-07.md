# case-07 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Business-banking wire-transfer form: a daily-limit help tooltip (role=tooltip) appears on hover/focus of a ? button, is hoverable and Esc-dismissible, but a setTimeout(...,4000) removes it 4 seconds after it appears while the trigger is still hovered/focused. Verified: opacity 1 at 0s -> opacity 0 / visibility hidden at 5s while still hovering.

## Exact repair

Removed only the four-second auto-dismiss timer. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`#limitTip[role="tooltip"]`

## Accessibility mechanism

The tooltip still appears on hover/focus, is hoverable, and is Escape-dismissible. With the timer removed, it remains visible as long as hover or focus persists and the daily-limit information remains valid.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: removed only the four-second auto-dismiss timer.

## Citation retained from the source case

**Reference:** WCAG Technique SCR39 (wcag-techniques/client-side-script/SCR39.html)

> The additional content stays visible and does not automatically close after a time.

