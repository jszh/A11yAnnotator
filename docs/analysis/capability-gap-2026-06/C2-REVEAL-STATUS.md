# C2 — Reveal-state producer + arrow-key driver: status

`scripts/v3/lib/reveal-state-runner.js`. Vs 96 independent adversarial cases (4 aspects; held-out untouched):
**74/96 (77%); DANGEROUS = 0 false-clear, 0 false-barrier** — the cleanest soundness of the set.

## What it decides (the Phase-1 gap: the harness never activates a reveal)
- **2.1.2 composite-widget trap**: drives the widget, presses Tab AND Shift+Tab (re-entering between), fails if focus
  can't leave in EITHER direction (F10). [acc 23/24]
- **2.4.3 F85 reveal-then-check**: activates the trigger; fails if a dialog/menu/modal opens but focus is NOT moved
  into it, or does NOT return to the trigger on Escape/close.
- **1.4.13 / 3.3.2 no-keyboard-path**: tests FOCUS first on the fresh page, then hover; fails if content/instruction
  appears on HOVER but NOT on keyboard focus.

## What it defers (correctly — to existing lanes, now that it makes the region reachable)
- Internal DOM-vs-visual focus ORDER of a revealed region → the 2.4.3 focus-order-meaning rubric.
- 1.4.13 hoverable/dismissible/persistent adequacy of a focus-shown reveal → the 1.4.13 hover-content lane.
- 3.3.2 instruction adequacy of a focus-shown instruction → the field-label rubric.

## Verdict
Robust: 0 dangerous errors. Decides the clear keyboard-trap / focus-management / no-keyboard-path barriers (which
the resting harness cannot see) and routes the perceptual/order judgments to the rubrics it now feeds. Note: shares
the reveal-producer primitive with the external dev's paused work, but scoped here to OUR covered SCs. DONE.
