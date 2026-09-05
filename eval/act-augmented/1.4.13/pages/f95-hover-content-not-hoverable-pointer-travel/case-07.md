# case-07 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> SaaS billing page: a "?" help button beside "Seat overage" shows a custom tooltip positioned 30px BELOW the trigger, separated by a transparent .gap spacer (pointer-events:none). Show/hide is bound only to the trigger button's mouseover/mouseout; the tooltip has no hover handler and is not a descendant of the trigger. Moving the pointer down to read the tooltip crosses the gap, fires mouseout, and the tooltip vanishes before the pointer reaches it.

## Exact repair

Replaced immediate trigger-only hiding with a 500ms pointer-travel grace period and tooltip mouseenter/mouseleave support; Escape also dismisses. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`#ov-trigger`

## Accessibility mechanism

The 30px layout gap is unchanged, but leaving the trigger schedules rather than immediately performs hide. Entering the tooltip cancels that schedule, making the tooltip itself hoverable; Escape dismisses without requiring pointer or focus movement.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: replaced immediate trigger-only hiding with a 500ms pointer-travel grace period and tooltip mouseenter/mouseleave support; Escape also dismisses.

## Citation retained from the source case

**Reference:** wcag-techniques/failures/F95.html

> A pop-up opens on pointer hover. Due to the chosen screen magnification, the content is only partially visible. However, as soon as the pointer is moved away from the trigger towards the pop-up content so it can be read, the pop-up automatically closes.

