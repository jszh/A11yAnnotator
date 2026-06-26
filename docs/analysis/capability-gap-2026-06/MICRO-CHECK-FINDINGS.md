# Micro-check integration — findings + design rules (corrected)

Micro-checks are wired into the runners for ONE job: **REDUCE false-barriers**. They review a deterministic FAIL —
"is this flagged barrier actually exempt/acceptable?" — and CLEAR it (fail→pass) only on a high-confidence 'clear'.
They never touch abstains or passes, so they can only LOWER the false-barrier count. Validated on the adversarial corpora.

## What works — clearing UNAMBIGUOUS exemptions (safe FB reduction)
| Capability | det FB | with micro-check FB | new false-clears | cleared |
|---|---|---|---|---|
| **C6** 1.4.10 | 5 | **3** | **0** | 2 × F102 "disappeared but has an accessible equivalent at 320px" |
| **C1** 1.4.x/4.1.2 | 9 | **8** | **0** | 1 × disabled/inactive control (exempt) |
| **C4** 1.4.11 | 6 | 6 | 0 | 0 — its exemptions are adversarially ambiguous (see below) |
| **C5** 3.3.x | 2 | 2 | 0 | structural fails — no clearable exemption |
| **C8** 1.1.1/4.1.2 | 2 | 2 | 0 | glyph fail reviewed for "decorative" (conservative) |
| **C2** 3.3.2 | 0 | 0 | 0 | nothing to clear |

## What does NOT clear — and must not (would add false-clears)
- **Perceptual / borderline-perceptual questions.** Using `use-of-color-adequacy` as a CLEAR false-cleared 5/5 real
  colour-only barriers (the LLM hallucinates a non-colour cue). Same failure mode as graphical/state-indicator
  contrast (Rule 1). ⇒ a 1.4.1 colour-only fail is LEFT as a fail; never cleared.
- **Adversarially-ambiguous exemptions.** A true essential brand-colour SWATCH (case-21) and a false-essential faint
  DIVIDER (case-10) look alike; the conservative essential check (tuned to reject case-10) therefore also won't clear
  case-21. The safe choice: leave it as a false-BARRIER (recoverable) rather than risk a false-CLEAR. So C4 nets ~0.
- **Measurement false-barriers** (e.g. C4 adjacent inverse-surface-trap) are not exemptions — an LLM exemption check
  correctly does not touch them; they need a deterministic measurement fix instead.

## The rule
A micro-check may CLEAR a deterministic fail only when the exemption is UNAMBIGUOUS and NON-perceptual (disabled/
inactive control; a clearly-present accessible equivalent). Everything else stays a (recoverable) false-barrier. Net
effect across the suite: a few false-barriers removed, **zero** new false-clears.

## Calibration (effort=medium, best-judgment gate = clear on a not-low-confidence 'clear')
Loosening from "high-confidence only" to BEST JUDGMENT (the right instinct — high-only cleared almost nothing) is safe
ONLY for the reliable checks; it is the CHECK that matters, not the conservatism level. Measured per check:

| Clear check | clears real false-barriers? | false-clears added |
|---|---|---|
| disabled/inactive exemption (`essential-presentation` on contrast) | yes, reliably | **0** |
| accessible equivalent (`equivalent-content-on-reflow`) | yes, reliably | **0** |
| essential brand-swatch (`essential-presentation`, ambiguous case) | sometimes (LLM-variance / flaky) | 0 |
| `decorative-or-component` (decorative-vs-grouping) | — | **+1** |
| `use-of-color-adequacy` / `distinguishable-in-grayscale` (1.4.1) | some | **+8** |
| `state-value-correct` (4.1.2) | 1 | **+5** |

- **Perceptual cue-presence is NOT reliable even in grayscale.** Rendering the crop grayscale (the principled "what a
  colour-blind user sees" test) still failed: grayscale preserves LUMINANCE, so a blue link still looks lighter than
  black body text and the model calls it "distinguishable" — plus a standing bias toward finding a reason to clear.
- **Kept ON (best judgment):** disabled/inactive exemption, accessible-equivalent. **Kept OFF (over-clear):**
  decorative-or-component, use-of-color/grayscale, state-value-correct.
- The right fix for the perceptual/state false-barriers is **deterministic cue-detection** (the true false-barriers —
  colour+text-LABEL, native range, alt-DID-update — have a deterministically detectable signal the runner missed),
  not an LLM clear. See FALSE-BARRIERS.md (DETECTION bucket).

## Deferred (NOT integrated) — abstain-escalation
Turning a deterministic ABSTAIN into a fail (to catch a barrier the runner can't decide) is built (`resolveEscalation`,
gated behind `escalateAbstains`, default OFF) but NOT wired in, because it ADDS false-barriers (C5 +15, C8 +11) — the
opposite of this goal. See docs/DEFERRED-TODO.md. Revisit when recall is wanted over precision.

## Modules
`scripts/v3/lib/micro-checks.js` (`resolveClear` integrated; `resolveEscalation` deferred). Wrappers:
`{nontext-contrast,form-binding,small-signals,reflow,interaction,reveal}-checklist.js`.
## Prompt experiment — use-of-color (1.4.1), 10 structures over 3 rounds
Developed on FRESH synthetic dev sets (hand-authored, NO test-set data), gated on the held-out capability-tests.
Every result reports BOTH error types (false-clear = real barrier wrongly cleared; false-barrier = a fine element
wrongly failed) — a conservative prompt can trade one for the other.

**Crop colour, not grayscale.** Grayscale was WORSE for every structure (3-4 false-clears) — it preserves luminance,
so a colour-only element still looks like a different shade. Use the COLOUR crop.

**Structures A/B'd (synthetic, colour crop):**
| structure | false-clears | false-barriers |
|---|---|---|
| baseline "is there a cue?" | 3 | 0 |
| forced-enumeration | 1 | 1 |
| describe-then-decide (+ fill clause) | 2-4 | 0-1 |
| strict-auditor (default-deny) | 1 | 0 |
| counterfactual "imagine recoloured" | 3-4 | up to 3 (WORST) |
| few-shot examples | 3 | 0 |
| self-critique | 2 | 1 |
| single-distinguisher | 4 | 3 |
| **PER-CUE BOOLEAN RUBRIC** | **2** | **0** (WON) |

**Winner — per-cue boolean rubric:** force an explicit check of each cue type AGAINST THE SIBLINGS (does the element
have an underline / border / heavier weight / icon / different-shape / added-label that the others LACK?), with the
clause that a coloured BACKGROUND/FILL — or a shape made only by a fill — is COLOUR. The explicit per-cue + per-sibling
structure removes both the "invent a cue" bias and the "count a fill as a cue" error. Now in `micro-checks.js`.

**Held-out gate (C1):** false-clears **8 (grayscale) -> 2 (per-cue rubric, colour)**, while clearing **3 false-barriers**
(false-barriers 9 -> 6), **0 new false-barriers**. The 2 residual false-clears are both STATE cases (a toggle and a
hover-shift) where only one state is in the crop — fixable only with BOTH-state evidence, not a prompt (follow-up).

### Rounds 4-8 — evidence designs (both-state, routing) + the overfitting lesson
Continued past prompt structure into EVIDENCE design (still synthetic-only dev, held-out gate). Every result reported FC + FB.
- **Both-state crop (rest + active) + a STRUCTURE-focused prompt** ("did anything MOVE or APPEAR, or only colour change?")
  scored 6/6 (0 FC / 0 FB) on synthetic STATE cases — including the toggle the single-state rubric misses. But it
  OVER-FLAGS static cases 3× (nothing moves on a static underlined link → wrongly "barrier"), so it can't be the default.
- **Routing** (detect a visible state-change → both-state prompt; else → per-cue rubric) scored a perfect **12/12, 0 FC /
  0 FB on the unified synthetic set** — the apparent winner.
- **HELD-OUT GATE CAUGHT OVERFITTING:** the routed design did WORSE on the real corpus (3 false-clears vs the plain
  rubric's 2). My synthetic state cases were cleaner than the held-out ones (which encode state differently than my
  drive-hover/focus model), so the both-state prompt over-cleared. Reverted to the plain per-cue rubric.
- **Conclusion:** the per-cue boolean rubric on a colour crop is the robust production winner (held-out 2 FC, clears 3
  false-barriers, 0 new false-barriers). The residual false-clears are STATE-CHANGE cases (toggle/hover conveyed by
  colour only, one state visible) — and the right fix is DETERMINISTIC: the runner can check whether a non-colour
  property (knob position, an appearing underline/border) changed between rest and the driven state. That is a runner
  improvement, not a prompt one. The `use-of-color-state` prompt is retained (unused) as the record of the attempt.

**No further prompt ideas materially help** — across 10 structures, colour-vs-grayscale, single-vs-both-state, zoom,
absolute-vs-relative framing, and routing, the per-cue rubric is the stable optimum and the remaining error is an
evidence/deterministic problem, not a prompt one.
