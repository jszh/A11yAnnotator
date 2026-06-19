# Generalization audit + noObligation coverage analysis (2026-06-19)

Two questions drove this pass: (1) are the FP/FN fixes **overfit** to the 74-case run4 subset they were
tuned on, and (2) what do the **noObligation** cases say about coverage gaps. Both were answered
**empirically over the full 581-case ACT corpus** (not the 74), which is the closest thing to a held-out set.

## 1. The larger problem: overfitting to a finite corpus with no held-out set

The fix-and-measure loop ran against the *same* 74 FP/FN cases it measured on. That is textbook
overfitting risk — recall 53%→86% measured *fit to this corpus*, not generalization. Several detectors
were conditioned on the **example pages** rather than the **rule**.

**Held-out check** (`results/generalization-check.json`): run every deterministic detector over all 581 ACT
cases and tally fire-by-GT. A detector firing on **passed/inapplicable** cases it was never tuned to is the
over-fit tell. Result (pre-fix): **3 of 4 new detectors over-fired**.

| detector | cause of over-fire | resolution |
|---|---|---|
| `iframeTabExcluded` | none (1 failed, 0 over-fire) | kept |
| `focusableInAriaHidden` | 6cfa84's PASSED example (an off-screen focus-sentinel `<a>` in aria-hidden that redirects focus on receipt) is **statically identical** to its FAILED example — they differ only in dynamic `onfocus` behaviour | **reverted** — a static detector here is fundamentally unsound; 6cfa84 needs the dynamic LLM-with-tools lane |
| `prohibitedAriaAttr` (braille) | `<div role=heading aria-braillelabel>` is **name-from-content** → the braille label is validly backed; my condition only checked aria-label/labelledby | **fixed** — exempt name-from-content roles |
| `prohibitedAriaAttr` (roledescription) | over-*narrow* (`div/span` only) — would miss `<p>/<em>/<strong>/<code>` | **generalized** to the ARIA-prohibited generic/structural role set |
| `svgNamedDescendant` (suppress) | suppresses on 1 failed (fd3a94/7ebe961d) — but that is a 2.4.4 case; suppressing its *1.1.1* obligation cannot cause a 2.4.4 FN | kept (cross-rule, no FN) |

**Post-fix re-check: 0 over-fire** on the 2 kept barriers across all 581 cases; the roledescription
broadening introduced no new over-fire. Adversarial/synthetic-variant tests pin each condition
(`scripts/v3/tests/link-context-generalization.test.js`, 10 tests).

**The lesson worth keeping:** the held-out full-corpus check is now the regression gate for any detector
change — passing the tuned examples is not evidence a condition generalizes. The single sharpest finding is
that **6cfa84 has a statically-indistinguishable passed/failed pair**, so a deterministic detector there can
only trade an FN for an FP. That rule belongs to the dynamic (focus-driving) LLM lane, not a static flag.

## 2. noObligation coverage (126 cases, `results/probe-noob-work/`)

A noObligation outcome is **correct** when GT is inapplicable/passed (nothing to evaluate) and a **silent
coverage-gap FN** only when GT=failed.

- **119 / 126 correct** (73 inapplicable + 46 passed). The harness does *not* over-enumerate — independent
  corroboration of the low-FP picture from §1.
- **7 / 126 are real coverage gaps** (GT=failed, zero obligation enumerated). **All 7 are now closed**, each
  verified deterministically:

| case | SC | rule | closed by |
|---|---|---|---|
| 1345bf06, 7cddc927, c4a2fe12 | 4.1.2 | kb1m8s | `prohibitedAriaAttr` detector (braille-unbacked / roledescription / brailleroledescription) |
| bf023941 | 1.4.5 | 0va7u6 | bg-image → enumerates `images-of-text@1.4.5` (+ `non-text-content@1.1.1`) |
| 41afaa9b | 1.4.3 | afw4f7 | `text-contrast` obligation now enumerated (→ runner/LLM, no longer silent) |
| f5ea9fd3 | 2.1.2 | 80af7b | `detectFocusRetentionTraps` (self-refocus `onblur→this.focus()`) |
| 7dcc4ae0 | 2.1.2 | 80af7b | `detectFixedSetConfinementTraps` (Button1↔Button2 mutual bounce, `deterministicTrapConfirmed`) |

## Next steps

1. **Pipeline robustness, not coverage** is the residual risk for the 2 kbd-trap cases: their detectors are
   deterministic and stable in isolation but run in the **live-key-driving instruments lane, which times out
   under 16-page concurrent load** (same root cause as the earlier kbd "flakiness" finding — contention, not
   the detector). Give that lane time headroom / a retry / lower its concurrency so it reliably emits the
   barrier under load. This is the highest-value follow-up.
2. **Make the held-out full-corpus generalization check a standing gate** after any detector/oracle change.
3. **6cfa84 → dynamic lane**: route the focusable-in-aria-hidden judgment to the LLM with the focus-driving
   tools (observe whether focus rests vs redirects), since no static condition can distinguish its
   passed/failed pair.
