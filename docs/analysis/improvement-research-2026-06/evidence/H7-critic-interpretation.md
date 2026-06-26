# H7 — adversarial self-critique pass: a SCOPED win, broad version refuted

A second skeptic pass over each flagged barrier (V3_LLM_CRITIC), prompted to re-apply the rubric's
applicability/exemption clauses and refute if one holds.

## Broad critic (all SCs) — net-negative, within noise
| | TP | FN | FP | F1 |
|---|---|---|---|---|
| baseline (K=3 maj) | 51 | 15 | 14 | 0.7786 |
| critic ON (all SCs) | 49 | 17 | 12 | 0.7717 |
Aggregate F1 0.7717 is WITHIN the noise band (0.767–0.784) → no measurable aggregate effect. Refutation
asymmetry = **1.00** (4 FP-fixed / 4 TP-lost) — a SYMMETRIC refuter.

## But the STABLE-case decomposition is clean and actionable
(baseline 3/3 → critic cleared; noisy cases excluded as unreliable)
- ✅ **FP fixed (stable):** `ec2a7a47` (1.1.1 SVG-decorative), `2845a840` (1.4.3 non-language symbol-soup) — the
  critic CORRECTLY applied the present exemptions the first pass ignored. **This validates the mechanism.**
- ❌ **TP lost (stable):** `0ec0e93e` (2.1.2 keyboard-trap), `7505d097` (2.4.10), `664972fe` (1.3.1) — the skeptic
  OVER-refuted real STRUCTURAL/dynamic barriers where no applicability exemption exists.

## The fix: SCOPE the critic to applicability-exemption SCs
The failure mode is clean: the critic helps where a present exemption is ignored (1.1.1/1.4.3/1.4.5) and HURTS
on structural barriers (2.1.2/1.3.1/2.4.10). Default-scoped via `V3_LLM_CRITIC_SCS=1.1.1,1.4.3,1.4.5`. Predicted
effect: keep the 2 stable applicability-FP fixes, drop the 3 structural-TP losses → net +2 FP, 0 TP.

## Validation: exp28 (--sc=1.1.1) + exp29 (--sc=1.4.3), critic ON — REFUTES the predicted scoped win ❌
- exp28 1.1.1: `ec2a7a47` (the FP the broad critic cleared in exp27) is **STILL FLAGGED** → the critic's
  downgrade was NOT reproducible. The critic is ITSELF a non-deterministic LLM call.
- exp29 1.4.3: `2845a840` cleared ✓ BUT tp 3→2 / fn 0→1 — the scoped critic **lost a real 1.4.3 barrier**.

## VERDICT: H7 REFUTED
The adversarial critic does not give a reliable improvement. It (a) applies exemptions only INCONSISTENTLY
(ec2a7a47 cleared once, not on re-run), and (b) costs TPs even when scoped to applicability SCs (exp29). Stacking
a second LLM judgment on a noisy first judgment adds noise — it does not asymmetrically remove confident FPs.
This REINFORCES the central finding: the LLM lane is noise-bound; more LLM passes don't escape it. The critic
code is reverted (refuted; not left as inert flag-gated code).

## Lesson (meta)
I PREDICTED a clean "+2 FP scoped win" from exp27's stable-case decomposition. The validation runs refuted it.
Validate, don't infer — the same lesson the noise floor (H1) formalizes.
