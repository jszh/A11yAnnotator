# case-07 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Banco Aurora high-yield savings page: a circular info 'i' icon next to '4.35% APY' reveals a hover-only popup disclosing a material tiered-rate caveat (4.35% only up to $250,000; above that 0.50%) found nowhere else on the page. The trigger is a non-focusable <span> with only mouseover/mouseout handlers, so keyboard, switch, and magnifier users never see the cap.

## Exact repair

Made the unchanged-looking info trigger a native button and added focus, activation, pointer-travel, popup-hover, and Escape handling. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`button#apy-info`

## Accessibility mechanism

The APY disclosure and visual appearance of the trigger are unchanged. The trigger is now a named native button; focus or activation opens the popup, blur schedules hide, pointer travel onto the popup cancels hide, and Escape dismisses it.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: made the unchanged-looking info trigger a native button and added focus, activation, pointer-travel, popup-hover, and Escape handling.

## Citation retained from the source case

**Reference:** wcag-understanding/content-on-hover-or-focus.html

> Content which can be triggered via pointer hover should also be able to be triggered by keyboard focus.  Refer to Success Criterion 2.1.1 Keyboard.
