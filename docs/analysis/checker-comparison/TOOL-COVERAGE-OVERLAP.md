# Tool Coverage / Overlap for Harness SCs

Date: 2026-06-16

Purpose: identify which external accessibility checkers provide useful coverage for the Success
Criteria the v3 harness currently uses or plans to use, and where they overlap with existing
deterministic/LLM/human lanes.

Sources:

- Current obligation oracle: `scripts/v3/lib/applicability-oracle.js`
- Current clearability/default-closed registry: `scripts/v3/lib/registry.js`
- Current rubrics: `scripts/v3/llm-rubrics/*.md`
- 3.3 plan: `docs/plans/HARNESS-3.3-PLAN.md`
- Prior comparison: `docs/analysis/CHECKER-COMPARISON.md`
- Full ACT pilot: `eval/checker-comparison/upstream-evidence/act-pilot/summary.json`
- v3 deterministic ACT pilot: `docs/analysis/V3-ACT-PILOT.md`
- Small harness fixture/real-page comparison: `eval/checker-comparison/evidence/sc-matrix.json`

## Executive Read

The tool overlap is useful, but narrower than a raw catalog count suggests.

- **Strong scanner overlap with approved ACT evidence:** `1.1.1`, `1.3.1`, `1.3.5`,
  `1.4.3`, `2.1.1`, `2.4.2`, `2.4.4`, `2.4.7`, `4.1.2`.
- **Useful live imports:** `1.3.5` hard findings from axe/IBM, `2.5.3` IBM hard findings
  after targeted validation, and existing axe/IBM hard findings as non-authoritative evidence
  for `1.1.1`, `2.4.4`, `2.4.2`, and `4.1.2`.
- **Useful triage-only imports:** IBM `POTENTIAL`/manual flags for `1.3.3`, `1.4.1`,
  `2.4.6`, and noisy structural `1.3.1` candidates. These should narrow LLM/human review,
  never publish barriers.
- **Little or no scanner help:** the harness's dynamic/layout SCs: `1.3.2`, `1.4.10`,
  `1.4.13`, `2.1.2`, `2.4.3`, `2.4.11`, `2.4.13`, `2.5.5`, `2.5.8`, `3.3.1`,
  `3.3.2`, `3.3.3`, `4.1.3`. Some tools have catalog or small-corpus hits for a few
  of these, but not enough to replace the harness probes or semantic review.

One important update to the earlier `CHECKER-COMPARISON.md`: in the broader ACT run, `1.3.5`
is **not IBM-only**. axe, Alfa, and QualWeb also perform strongly on the approved ACT
autocomplete-valid cases. Since axe is already integrated, the first implementation step is to
make sure axe `1.3.5` findings are preserved and routed; IBM is still valuable as an independent
peer signal.

## Method Notes

The full ACT pilot selected **432 approved ACT cases** with WCAG mappings. Its same-SC rates are
not final "best checker per WCAG rule" truth, because many apparent false positives are
same-SC/different-rule conflicts. They are still the best normalized evidence we have for scanner
overlap.

The raw ACT bundle has some SCs that did not appear in the selected approved run. Those are listed
as "raw ACT only." They are useful for future targeted runs, but not enough to make a current
precision/recall claim.

Cell format in the table:

- `ACT selected`: number of approved selected ACT cases in the full run.
- `Raw ACT`: count in the source ACT bundle.
- `Best tool signal`: strongest observed external signal.
- `Use in harness`: how to integrate it without overstating authority.

## Coverage Table

| SC | Harness use | ACT selected / raw | Best tool signal | Coverage / overlap judgment | Use in harness |
|---|---|---:|---|---|---|
| `1.1.1` | Current LLM rubric: non-text content adequacy | 74 / 94 | axe and Alfa low-FP on ACT; IBM/QualWeb also catch many; HTMLCS noisy | Strong candidate discovery, weak semantic adequacy | Import hard findings as evidence/candidate priors; LLM/human still decides alt adequacy and decorative/contextual cases |
| `1.3.1` | Current page-level info/relationships rubric | 17 / 81 | all tools have signals; IBM/QualWeb produce many same-SC/different-rule FPs | Broad but noisy structural overlap | Triage only. Never treat landmark/table/list/structure scanner hits as full SC verdicts without assertion-level mapping |
| `1.3.2` | Instrument/adjudication target for meaningful sequence | 0 / 0 | HTMLCS blanket review only in small corpus | No useful automated coverage | Harness order signals + LLM/human. Do not import scanner verdicts |
| `1.3.3` | 3.3 planned LLM triage for sensory characteristics | 0 / 21 raw-only | IBM targeted `text_sensory_misuse` review in small corpus | Useful as a semantic suspicion, not a verdict | Import IBM review flags as LLM candidate priors; no hard pass/fail |
| `1.3.5` | 3.3 planned deterministic scanner lane for autocomplete | 28 / 28 | axe, IBM, Alfa, QualWeb all strong on ACT; HTMLCS review-only | Strong scanner overlap for invalid autocomplete tokens | Preserve axe `1.3.5` hard findings and add IBM peer hard findings; still LLM/human for "field asks covered personal-data purpose but lacks token" |
| `1.4.1` | 3.3 planned LLM triage for use of color | 0 / 0 | IBM targeted review flags in small corpus | Triage-only semantic coverage | Import IBM color-use flags as LLM priors; no hard verdict |
| `1.4.3` | Current deterministic contrast runner + rubric for complex backdrops | 32 / 32 | all tools have contrast rules; axe/IBM good on simple cases; statics struggle with rendered/composited backdrops | Strong overlap on simple CSS, harness stronger for rendered pixels | Use scanners as corroboration/candidate discovery only; rendered harness measurement remains authority for supported sub-domain |
| `1.4.10` | Current reflow barrier runner + rubric | 0 / 0 | HTMLCS blanket review in small corpus | No useful scanner coverage | Harness runner + LLM/human for loss of information/function |
| `1.4.13` | Current hover/focus content barrier runner + rubric | 0 / 0 | HTMLCS blanket review in small corpus | No useful scanner coverage | Harness hover/focus experiments + LLM/human |
| `2.1.1` | Current keyboard-operable barrier-only lane | 17 / 17 | Alfa/QualWeb stronger ACT same-SC recall but more FPs; axe/IBM sparse | Partial markup/static overlap; cannot prove all functionality | Keep harness real-key activation. Scanner findings are triage/corroboration only |
| `2.1.2` | Current keyboard-trap runner | 0 / 16 raw-only | no reliable live evidence from full selected ACT run | Not enough external evidence | Harness trap-region/escape experiments remain authority |
| `2.4.2` | Current page-title LLM rubric | 18 / 18 | all major tools catch empty/non-empty title; descriptiveness not automated | Good for empty/missing title, not descriptive topic/purpose | Use hard missing/empty title as candidate evidence; LLM/human judges descriptiveness |
| `2.4.3` | Instrument/adjudication target for focus order | 0 / 0 | IBM/HTMLCS review-only small-corpus flags | No useful scanner coverage | Harness focus/order signals + LLM/human |
| `2.4.4` | Current link-purpose LLM rubric | 28 / 65 | axe/IBM/Alfa good on ACT selected; HTMLCS mostly review | Good for accessible-name-derived failures, not contextual purpose | Import hard findings as evidence; LLM/human remains needed for purpose-in-context |
| `2.4.6` | Current heading/label descriptiveness rubric | 0 / 28 raw-only | HTMLCS blanket review; IBM may triage label/heading text | Weak direct coverage | LLM/human for descriptiveness; scanner review flags can prioritize candidates only |
| `2.4.7` | Current focus-visible real-keyboard runner + rubric | 7 / 7 | scanners mostly review-only; no strong hard failure support | External tools do not replace pixel/keyboard evidence | Harness real focus pixels remain authority; scanner flags are low-priority triage |
| `2.4.11` | Current focus-not-obscured barrier runner + rubric | 0 / 0 | IBM review-only `potential_obscured` in small corpus | Triage-only, weak | Harness visual/overlay runner; IBM review can prioritize but not decide |
| `2.4.13` | Proxy/review-only focus appearance | 0 / 0 | no meaningful scanner evidence | No scanner coverage | Keep proxy/review only unless a dedicated algorithm is built |
| `2.5.3` | Current label-in-name obligation/rubric; 3.3 planned scanner supplement | 0 / 13 raw-only | IBM strong in small corpus; axe and Alfa catalog-tagged | Promising but needs targeted ACT/vendor validation | Add IBM hard findings as non-authoritative candidate evidence after targeted validation; LLM/human for ambiguous visible-label/name mapping |
| `2.5.5` | Current AAA target-size enhanced rubric | 0 / 0 | Alfa hard findings in small corpus | Single-tool, AAA, unvalidated | Optional Alfa-derived triage only; do not publish hard barriers without gold |
| `2.5.8` | Current target-size minimum obligation/rubric; planned deterministic runner | 0 / 0 | axe/Alfa catalog-tagged; Alfa small-corpus hard hits | Not enough normalized evidence; harness geometry is better aligned | Build/promote harness geometry runner; scanner hits can be comparison evidence only |
| `3.3.1` | Current error-identification runner/rubric | 0 / 9 raw-only | QualWeb/HTMLCS review-only small-corpus hits | Weak scanner coverage | Harness form-submit/native-validation evidence + LLM/human for text identification |
| `3.3.2` | Current field-label runner/rubric | 0 / 0 | axe catalog-tagged; IBM/QualWeb small-corpus hits | Some overlap, but current harness directly probes labels | Keep harness as primary; scanner hard findings can be extra candidates after assertion-level mapping |
| `3.3.3` | Current error-suggestion rubric | 0 / 0 | HTMLCS review-only small-corpus hits | No reliable scanner coverage | LLM/human |
| `4.1.2` | Current AX name/role/value runner + scanner evidence | 106 / 140 | all tools have strong overlap; axe/Alfa low FP in ACT; IBM broad | Strong overlap, but assertion-level differences matter | Existing axe evidence remains useful; IBM can corroborate. Harness AX-state diff remains authority for dynamic state claims |
| `4.1.3` | Current non-authoritative status-message instrument | 0 / 0 | HTMLCS blanket review only in small corpus | No useful scanner coverage | Harness status instrument + human/LLM review only |

## Practical Integration Recommendations

1. **Preserve and route axe `1.3.5` and `2.5.3` findings.** The axe catalog includes both SCs, and
   the ACT run shows `1.3.5` works well. The earlier "IBM-only" conclusion should be softened.

2. **Add IBM as a peer scanner, but with strict role separation.**
   - Hard-fail import candidates: `1.3.5`, `2.5.3`.
   - Triage-only priors: `1.3.3`, `1.4.1`, `2.4.6`, selected `1.3.1`.
   - Exclude high-volume/noisy structural hard findings from publication authority until assertion-level
     mapping is built.

3. **Do not run QualWeb live in the harness yet.** It is useful as a catalog/coverage-gap reference
   and it performs well on ACT, but the earlier real-page run had a silent under-report. That makes it
   a poor production dependency until robustness is fixed.

4. **Do not integrate HTML_CodeSniffer live.** It is mostly blanket review notices for the SCs we use,
   plus weaker ACT hard-decision performance and prior crash behavior.

5. **Treat Alfa as optional comparison evidence, not a live dependency.** It is strong on ACT and has
   target-size signals, but its integration cost is higher and its unique value is mostly AAA/target-size
   territory that still needs gold validation.

6. **Prioritize assertion-level mapping before any scanner-derived publication.** Same-SC overlap is
   not enough. For example, a `1.3.1` landmark finding and a `1.3.1` table-header ACT failure are both
   same-SC but are not the same assertion. The v3 obligation model already has claim families; imported
   scanner findings should bind to claim families, not just SC labels.

## What This Means for 3.3

The 3.3 plan direction still looks right, with two refinements:

- For **`1.3.5`**, use **axe + IBM** as redundant hard-fail sources for invalid autocomplete tokens.
  This is lower implementation overhead than adding IBM as the only source, because axe is already
  present.
- For **semantic SCs**, use scanner output mainly to improve candidate selection and evidence packets.
  It should reduce missed obvious examples and annotator search time, not replace LLM/human judgment.

The biggest remaining scanner blind spots are exactly the harness's reason for existing: dynamic
keyboard behavior, focus visibility/obscuration, status messages, hover/focus content, reflow, and
target geometry/exceptions.

Follow-up calibration has started in [V3-ACT-PILOT.md](../act-benchmark/V3-ACT-PILOT.md): the no-LLM deterministic
v3 harness now has an ACT runner, and the first `1.4.3` sample already exposed a useful contrast
edge case: text-shadow can make an ACT example pass while the current CSS foreground/background
measurement hard-fails it.
