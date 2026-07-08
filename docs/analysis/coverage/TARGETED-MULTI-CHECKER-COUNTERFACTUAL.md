# Targeted multi-checker counterfactual — would other engines beside axe improve FP/FN?

**Date:** 2026-07-08. **Method:** exact per-case counterfactual over the composed 799-corpus system
verdicts (see `ACT-799-SYSTEM-PR-AND-CHECKER-COVERAGE.md`) against the five-engine per-case evidence
(`upstream-evidence/act-subset-checkers/` + `act-rest/`), computed by an analyst subagent and
**independently recomputed from raw files by an adversarial verifier subagent** (analyst scratchpad
off-limits to the verifier; baseline TP=232 FN=2 FP=30 TN=535 reproduced exactly by both; every
portfolio figure confirmed to the digit). Machine-readable:
[`targeted-multi-checker-counterfactual.json`](./targeted-multi-checker-counterfactual.json).
Policies are restricted to production-implementable rules (tool metadata only — never the testcase's
own ruleId/expected).

## Answer

**Yes — but only QualWeb, and only as a targeted trusted-rule lane.** IBM/alfa/htmlcs add nothing
(verified: IBM's FP-kills are a strict subset of QualWeb's and IBM-as-barrier adds 4 new FPs;
alfa/htmlcs as barriers add 17 / 35 new FPs). All numbers below are raw ACT labels on the 799
(baseline R 99.1 / P 88.5 / FP 5.3 / F1 0.935).

| policy (verified) | TP/FN/FP/TN | R | P | F1 |
|---|---|---|---|---|
| baseline (current splice) | 232/2/30/535 | 99.1 | 88.5 | 0.935 |
| **QW trusted barrier + clear lane** | 233/1/22/543 | **99.6** | **91.4** | **0.953** |
| + clear extended over pre-settled axe FPs on trusted rules | 233/1/17/548 | 99.6 | 93.2 | 0.963 |
| production-honest variant (definitive-silent, no curated set) | 232/2/21/544 | 99.1 | 91.7 | 0.951 |

- **Barrier:** a QualWeb rule-level violation (its own ACT-id metadata) on a trusted rule publishes as
  an authoritative barrier. Rescues 1 of our 2 residual FNs — `d0f69e/6bb6ca5d` (1.3.1
  th-assigned-cells: QualWeb hard rule-level catch; axe only review). Adds **zero** GT-negative flags
  across all 799 on the trusted set (untrusted-set example of why scoping matters: QualWeb has 1
  rule-level FP on `afw4f7` contrast).
- **Clear lane:** on trusted rules where QualWeb ran and emitted nothing, treat the construct as
  settled-clear and suppress the LLM ask. Kills 8 of the 18 reaches-LLM residual FPs (`akn7bn`,
  `2779a5`×3, `23a2a8`×2, `7d6734`, `6cfa84`) with zero raw-label TP loss (verified: every GT-fail the
  LLM catches on trusted rules is also QualWeb-caught).
- **Extension (verifier-found):** QualWeb is also silent on 5 of the 12 pre-settled axe FPs that sit
  on trusted rules; letting the QualWeb clear demote those (i.e., overriding the axe pre-settle) takes
  FP 22→17. Design cost: a checker lane overriding the currently-authoritative axe lane.
- The other 2 residual FNs/FPs no engine touches: `0va7u6/bf023941` (1.4.5 — all five engines silent;
  irreducibly LLM/vision) and the 1.3.3 floor (9bd38c uncovered by every engine).

## The 12 pre-settled axe FPs — mostly a single-tool hygiene problem

11/12 are axe firing **off-construct** rules (region, landmark-one-main, page-has-heading-one,
frame-title, html-has-lang, …) whose ACT-ids do not include the case's rule — scaffold noise on
minimal fixtures, the same mechanism as AccessGuru's best-practice inflation (Table 1g). No rule-level
engine corroborates the case's own rule on any of the 11. The 12th (`2779a5/ecc29b73`,
GT=inapplicable) is a genuine cross-engine disagreement: axe `document-title` (actIds=[2779a5]) AND
IBM both flag it rule-level; QualWeb is silent. Options quantified: qualweb-gated demotion to
LLM-with-reasons demotes 9/12 with recall-at-risk 2 pre-settled TPs (LLM-dependent outcome); the
cleaner fix is upstream single-tool hygiene — stop letting off-construct axe findings pre-settle a
target-SC verdict at all.

## Honest limits (both agents flag the same one)

- **In-sample result.** The 6 rules doing all the work (2779a5, 23a2a8, 7d6734, 6cfa84, akn7bn,
  d0f69e) have **zero** cases in the act-rest 609 — no independent-sample confirmation exists, unlike
  the two-corpus evidence behind QualWeb's overall fp=0 profile. Per-rule failed-counts are thin
  (akn7bn n=1). "Zero cost" is partly definitional: the trusted set is derived from the same cases it
  is scored on. The production-honest **definitive-silent** variant (trust QualWeb's own implements
  metadata; suppress only when it emitted neither violation nor review) needs no curated list and
  still lands F1 0.951 (kills 9 FP incl. `afw4f7/fc92e273`, loses 1 TP — `fd3a94/8dc58c48`).
- **Starred accounting trade-off.** The clear lane suppresses the LLM exactly where it catches
  cross-rule barriers the raw label doesn't cover: the two aria-hidden W3C wordmarks
  (`23a2a8/25e5364c`, `e15b9aca`) are FPs raw but TPs under the Table-1d override — starred portfolio
  is R 98.7 (−0.5) / P 91.4 / F1 0.949. Wiring a QualWeb clear lane on image rules directly conflicts
  with the decorative/e88epe cross-rule lane. If adopted, scope the clear to rules with no
  cross-rule sibling construct (excluding 23a2a8/qt1vmo/7d6734 drops the raw gain to FP 30→25 but
  keeps the starred wordmark catches).
- The structural (generalizing) part of the finding: trust QualWeb only on deterministic DOM/ARIA
  predicates; on judgment rules it correctly *reviews* rather than decides (verified on fd3a94 /
  afw4f7 residuals), so a definitive-silence gate auto-routes around exactly the rules where
  suppression would be wrong — that mechanism, not the specific deltas, is the transferable claim.

**Status:** analysis only — nothing wired. Adoption decision (and whether to gate on a DHS-TT
held-out probe first) is with the user. Verifier artifacts:
`scratchpad/checker-verify/VERDICT.md`; analyst: `scratchpad/checker-counterfactual/REPORT.md`.
