# case-07 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Online-banking transfer-limit screen: a round 'i' info button shows a tooltip on hover AND keyboard focus that overlaps the help paragraph and the Continue button. The tooltip is keyboard-reachable (meets 2.1.1) but there is NO Escape handler, no documented shortcut, and activating the trigger does not toggle it off — the only way to clear the obscuring content is to move focus/pointer off the trigger.

## Exact repair

Added an Escape handler that hides the unchanged tooltip while focus remains on the trigger, resetting only after the hover/focus state ends. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`button#limitInfo`

## Accessibility mechanism

The same tooltip can overlap the same content, but Escape adds a dismissed state with display:none without blurring the button. Leaving or blurring resets the state so help remains available on a later interaction.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: added an Escape handler that hides the unchanged tooltip while focus remains on the trigger, resetting only after the hover/focus state ends.

## Citation retained from the source case

**Reference:** eval/act-augmented/1.4.13/pages/dismissible-esc-keyboard-dismiss-without-moving-hover-focus/case-01.md

> Alternatively, low vision users who can only navigate via the keyboard do not want the small area of their magnified viewport cluttered with hover text. They need a keyboard method of dismissing something that is obscuring the current focal area.

