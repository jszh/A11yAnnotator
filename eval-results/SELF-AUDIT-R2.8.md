# Self-Audit — Round 2.8 (adversarial workflow `r28-adversarial-audit`)

Date: 2026-06-15

**What this is.** After shipping the R2.8 harness fixes I ran a background Workflow that
spawned one adversarial agent per fix to *refute* it with **code-executed** counterexamples,
then an **independent verifier** re-ran each claim. Only findings that survived both layers
(`isReal && reproduced && severity ≠ not-a-bug`) are listed below. This is my OWN self-audit —
distinct from the external reviewer's `ROUND2*-INDEPENDENT-VERIFICATION.md`.

**Audited:** the R2.8 fixes (external R27 audit remediation), HEAD 20c4149..a4d63f0

**Disposition:** PENDING - proposed for R2.9 (awaiting approval).

## Summary — 5 confirmed (3 high, 2 medium)

| Fix surface | Confirmed gaps |
|---|---:|
| A-support-binding | 2 |
| B-driver-inventory | 0 *(exhausted)* |
| C-axe | 1 |
| D-freshness | 2 |
| E-sweep | 1 |
| F-trap | 1 |
| G-skipcap | 0 *(exhausted)* |

## Findings

### [1] HIGH · reproduced — `A-support-binding`
**2.4.11 (Focus Not Obscured, AA) has NO support predicate — a fabricated REPRODUCED focus-management failure validates with zero driver support, AND a real obscured failure can be silently cleared**

- **Mechanism:** behavioralSupport() in /Users/jason/Developer/A11yAnnotator/scripts/lib/result-builder.js (L318-340) keys its POSITIVE-support loop ONLY on SCs 2.4.7, 2.1.1, 4.1.3, 2.4.3, 2.1.2. focus-management is allowed by RESULT-CONTRACT.md / SKILL_SCS to cite 2.4.11, but 2.4.11 has no branch, so it falls through to `return {ok:true}` after only the probe-existence gate (L309-312: activation trusted+isolated). The driver DOES capture the ground truth for this SC — drive-page.js:653 computes `obscured` per element — but driverEvidenceFrom() (L229-277) never surfaces `obscured` into the `ev` object, so the …
- **Observed:** CLI exit 0: 'wrote fx-out.json — 4 elements, 1 normative failures, 1 deduped issues (validated).' The output carries summary.normativeFailures=1 with the REPRODUCED 2.4.11 issue, despite no driver evidence of an obscured focus (driver in fact reported focusIndicator.present:true and never surfaced `obscured`). The symm…
- **Expected (WCAG):** WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum): 'no part of the focused component is hidden by author-created content.' A DEFINITE verdict on this SC must be demonstrated by an observed driver outcome — per the commit's own stated invariant (R27-C1: 'a DEFINITE verdict must be DEMONSTRATED by an observed driver outcome, not merely the ABSENCE of a known contradiction'). The driver-captured `obscu…
- **WCAG basis:** WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum), Level AA (Understanding 2.4.11)
- **Repro input:** collect.json {file:'fx-r28a-2411.html',runId:'R28A',collectedAt:1000,axeRan:true,axe:[],elements:[4 button xpaths]}; drive.json {file:...,runId:'R28A',drivenAt:2000,elements:[{xpath:button[1],behavioralTrust:{activation:{trusted:true,isolated:true}},focusIndicator:{present:true},…

### [2] HIGH · reproduced — `D-freshness`
**Stale drive with forged-fresh drivenAt + reused runId clears a now-broken 2.4.7 control (no artifact digest binds driver to collector)**

- **Mechanism:** The freshness gate (build-results.js lines 56-72) is pure agent-editable-JSON trust: it checks (a) collect.runId === drive.runId — both plain JSON strings — and (b) Number.isFinite(collectedAt/drivenAt) with drivenAt >= collectedAt — both plain JSON numbers. There is NO digest/hash/HMAC/signature anywhere binding the driver artifact to the collector's actual DOM/inventory (grep for digest|sha|hash|checksum|hmac|signature across build-results.js, result-builder.js, eval-page.js, drive-page.js returns only unrelated boxShadow/isolation hits). So an agent that has a STALE drive.json captured from…
- **Observed:** wrote out.json — 1 elements, 0 normative failures (EXIT=0); summary.bySkill['focus-visibility'] = {reproduced:0, partial:0, notReproduced:1, na:0} — i.e. 2.4.7 recorded as PASS. The identical records with an honestly-fresh drive observing present:false is REFUSED (EXIT=1, 'NOT REPRODUCED (2.4.7) not supported... must b…
- **Expected (WCAG):** WCAG 2.1 SC 2.4.7 Focus Visible (Level AA): 'Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible.' The W3C Understanding doc's failure F78 is failing this SC by removing/obscuring the focus indicator. A control with no visible focus indicator in the CURRENT page FAILS 2.4.7 and must be reported as a finding (REPRODUCED) or at minimum PARTIAL (…
- **WCAG basis:** WCAG 2.1 SC 2.4.7 Focus Visible (AA); W3C Understanding 2.4.7 / failure technique F78. Cross-checked against result-builder.js behavioralSupport 2.4.7 predicate (lines 319-322) which treats driver rin…
- **Repro input:** records_fv.json: one element /html/body/button[1] with focus-visibility = {verdict:'NOT REPRODUCED', sc:'2.4.7', evidence:'driver observed a visible focus ring present...'}, other 9 element skills N/A, 3 pageSkills NOT REPRODUCED. collect.json: {file:'x.html', runId:'R1', collect…

### [3] HIGH · reproduced — `E-sweep`
**Sweep omits the R2.8-B driver-inventory-integrity gate, so a duplicate driver xpath flips driverEvidenceFrom() (last-record-wins) and the sweep approves a fabricated 2.4.7 REPRODUCED that the mandatory CLI refuses**

- **Mechanism:** Attack (2) from the prompt: the sweep's identity/freshness/binding re-gate is a STRICT SUBSET of the CLI's. build-results.js enforces R2.8-B (lines 89-94): driver xpaths must be UNIQUE (dDup) because driverEvidenceFrom() keys by xpath and the LAST record overwrites earlier ones (confirmed by run: two /a records present:true then present:false -> ringPresent=false; reversed -> true). regression-sweep.js NEVER replicates this dedup. Its only cross-artifact checks are file-identity (L37), runId (L38), and freshness (L39); for behavioral binding it calls builder.driverEvidenceFrom(D) directly (L81…
- **Observed:** CLI on this exact drive.json: 'REFUSED: driver inventory has 1 duplicate xpath(s) (e.g. /a) — behavioral evidence would be order-dependent (R2.8-B).' (exit 2). The SAME corpus through the sweep: 'regression sweep OK — 1 pages, all invariants hold (...)' (exit 0). Control proof the duplicate is load-bearing: with the ho…
- **Expected (WCAG):** WCAG 2.4.7 Focus Visible (Level AA) requires that 'Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible' (W3C Understanding confirmed). A REPRODUCED 'no visible focus indicator' must rest on the driver actually OBSERVING an absent ring. Here the only honest probe of /a observed present:true (a visible ring exists), so the correct verdict is NOT…
- **WCAG basis:** WCAG 2.1 SC 2.4.7 Focus Visible (Level AA); R2.8-B driver-inventory integrity contract (build-results.js L85-94) which the R2.8-E sweep is documented (regression-sweep.js L32-34) to mirror.
- **Repro input:** Corpus dir /tmp/sweepcorpus with one slug PageA containing: collect.json {file:'p.htm',runId:'R1',collectedAt:1000,axeRan:true,axe:[],elements:[/a../e]}; drive.json {file:'p.htm',runId:'R1',drivenAt:1010,tabWalk:{trapDetected:false},forms:[], elements:[{/a,focusIndicator:{present…

### [4] MEDIUM · reproduced — `A-support-binding`
**2.4.13 (Focus Appearance, AAA) has NO support predicate — a fabricated REPRODUCED focus-visibility failure validates, contradicting the harness's own 'captured-not-enforced' design for 2.4.13**

- **Mechanism:** focus-visibility is allowed to cite 2.4.13 (SKILL_SCS / RESULT-CONTRACT.md L27), but behavioralSupport() has no 2.4.13 branch; only the focus-visibility probe gate (L302-303: ev.focusProbed) runs, then the per-SC loop falls through to {ok:true}. The driver captures 2.4.13 proxy metrics (drive-page.js:564 focusAppearance / a11y-eval.js focusAppearance2413) but driverEvidenceFrom never surfaces them, and TEST-PLAN.md explicitly states 2.4.13 is 'captured but NOT enforced — proxies only', i.e. the harness should not emit a definite 2.4.13 verdict at all — yet the binding lets a fabricated one thr…
- **Observed:** CLI exit 0: 'wrote fx-out-2413.json — 4 elements, 1 normative failures, 1 deduped issues (validated).' A REPRODUCED 2.4.13 normative failure is written with no thickness/area/contrast measurement bound from the driver.
- **Expected (WCAG):** WCAG 2.2 SC 2.4.13 Focus Appearance requires a contiguous focus area of at least the perimeter of a 2px-thick line around the component (or 4px-thick on the shortest side) AND a >=3:1 contrast change. The harness explicitly captures these only as non-enforced proxies; a definite REPRODUCED resting on no measured proxy is unsupported and should be forced to PARTIAL (per the R27-C1 positive-support …
- **WCAG basis:** WCAG 2.2 SC 2.4.13 Focus Appearance, Level AAA (Understanding 2.4.13)
- **Repro input:** Same artifacts as the 2.4.11 case but button[1].skills['focus-visibility']={verdict:'REPRODUCED',sc:'2.4.13 Focus Appearance',level:'AAA',evidence:'Focus indicator is a 1px hairline far below the 2px / >=3:1 area threshold — focus appearance fails.',bucket:'normative',trust:'trus…

### [5] MEDIUM · reproduced — `C-axe`
**axeAdjudications launders real axe WCAG failures with a one-character reason (near-zero substantiveness bar)**

- **Mechanism:** Reconciliation (result-builder.js ~L376-381) clears an axe-flagged SC if it appears in axeAdjudications. The only validity check on an adjudication entry (L379) is `!a.sc || !String(a.reason||'').trim()` — i.e. sc present AND reason non-whitespace. There is NO substantiveness gate, in stark asymmetry with the sibling provenance.skipped reason gate (L200) which requires `rr.length>=8 && /[a-z]{3,}/`. So a real, high-confidence axe WCAG violation is dismissed by an agent-authored {sc, reason:'x'}. This is amplified because ~18 of the SCs axe can emit (e.g. 1.4.4 meta-viewport, 3.1.1 html-has-lan…
- **Observed:** EXIT=0, wrote out.json — 1 elements, 0 normative failures, 0 deduped issues (validated). The two real axe WCAG violations (3.1.1 Language of Page, level A; 1.4.4 Resize Text, level AA) are fully laundered. A single-character reason ('x'/'n') passes; only an empty/whitespace reason is rejected.
- **Expected (WCAG):** SC 3.1.1 Language of Page (A) and SC 1.4.4 Resize Text (AA) are real normative criteria; axe's html-has-lang and meta-viewport rules are well-established true-positive detectors. Per the contract's own stated intent ('a clean result cannot silently ignore axe'), dismissing such a flagged failure should require a substantive, reviewable justification — at minimum parity with the provenance.skipped …
- **WCAG basis:** WCAG 2.2 SC 3.1.1 (Language of Page, A) and SC 1.4.4 (Resize Text, AA); Understanding docs make these conformance-required. The harness's RESULT-CONTRACT reconciliation intent (R2.8-C) is to force eac…
- **Repro input:** collect.json: {file:'FX.html',runId:'R1',collectedAt:1000,elements:[{xpath:'/html/body/div[1]'}],axeRan:true,axe:[{id:'html-has-lang',wcag:['wcag311','wcag2a'],nodes:[...]},{id:'meta-viewport',wcag:['wcag144','wcag2aa'],nodes:[...]}]}. records.json: 1 element fully evaluated (all…

---
*Generated from the `r28-adversarial-audit` workflow result (refute → independent-verify pipeline).*
