# C1 — Interaction-driven capture & diff: status

`scripts/v3/lib/interaction-capture.js` — the highest-leverage capability (the dominant Phase-1 gap: the harness
reads only the RESTING state). Self-test 7/7; vs 193 independent adversarial cases (8 aspects, 2 agents; held-out
untouched): **136/193 (70.5%); DANGEROUS = 16 false-clear, 9 false-barrier.**

## What it does
- **runStateColor**: drives the element into hover/focus/active/checked via REAL interaction (page.hover/focus/mouse
  — getComputedStyle then reflects the state; more reliable than CDP forcePseudoState), then re-measures:
  - 1.4.3 state-dependent TEXT contrast (worst of rest + state vs the font threshold). [acc 20/24]
  - 1.4.11 state-indicator NON-text contrast — COMPOSES with C4 (collectNonTextFacts/disposeFromFacts) in the
    driven state, not text contrast. [acc 17/26]
  - 1.4.1 use-of-color: decides only the UNAMBIGUOUS colour-only fail (no underline/border/weight/icon/bg cue at
    rest OR in-state); otherwise ABSTAINS with the in-state cue facts for the use-of-color rubric. [FB→0]
- **runDynamicNRV**: reads the accessible name + aria-state, ACTIVATES (click / key:Enter/Space/ArrowRight), re-reads,
  and diffs. Fails: visible state changed but name+state stale; state conveyed by a toggle GLYPH (☐/☑) with no
  aria-state flip; an exposed aria-state that didn't flip. Passes: aria-state flipped, or a genuine label change the
  name tracked. [acc: stale-name 19/24, state-value 17/24, value-settable 16/24]

## Residual dangerous (16 FC) — hard semantic / AX-name edge cases
- state-color (7): near-threshold in-state; a state the real-interaction driver couldn't reach; C4's in-state edges.
- dynamic-nrv (9): one-way-toggle (needs TWO activations), contradicting-value correctness (semantic), and the
  simplified accessible-name (aria-label||labelledby||text) missing alt/title sources — the clean refinement is to
  read the REAL computed AX name via CDP Accessibility (noted follow-up).

## Verdict
Reasonable + robust as a prototype: the interaction-driven capture MECHANISM is verified and decides the clear
state-dependent contrast + dynamic staleness cases; composes with C4 for 1.4.11; routes the perceptual (1.4.1) +
semantic (state-correctness) dimensions to the rubric. The AX-name read is the main refinement for the dynamic-nrv tail.
