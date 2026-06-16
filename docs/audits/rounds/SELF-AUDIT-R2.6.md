# Self-Audit — Round 2.6 (adversarial workflow `r26-adversarial-audit`)

Date: 2026-06-14

**What this is.** After shipping the R2.6 harness fixes I ran a background Workflow that
spawned one adversarial agent per fix to *refute* it with **code-executed** counterexamples,
then an **independent verifier** re-ran each claim. Only findings that survived both layers
(`isReal && reproduced && severity ≠ not-a-bug`) are listed below. This is my OWN self-audit —
distinct from the external reviewer's `ROUND2*-INDEPENDENT-VERIFICATION.md`.

**Audited:** the R2.6 fixes (R2.5 self-audit remediation), HEAD c29ea00..3940b49

**Disposition:** ALL 8 real ones fixed in R2.7 (A-D; #9 was not-a-bug).

## Summary — 9 confirmed (2 high, 5 medium, 2 low)

| Fix surface | Confirmed gaps |
|---|---:|
| A-binding-completeness | 2 |
| B-axe-floor | 3 |
| C-runid | 2 |
| D-trap | 1 |
| E-target-grid | 4 |

## Findings

### [1] HIGH · reproduced — `A-binding-completeness`
**4.1.3 silent-status NR check is suppressed by liveRegionChanged:true even when nothing is announced (aria-live="off")**

- **Mechanism:** The silent-status contradiction (result-builder.js L325-326) fires only when `NR && viewChanged && !focusMoved && !dialogOpened && !vsrAnnounced && !liveRegionChanged`. The driver computes `liveRegionChanged` (drive-page.js L710) as a PURE textContent diff: `before.liveText !== after.liveText`, where liveText = joined trimmed textContent of `[aria-live],[role=status],[role=alert],[role=log],output` (L686/701). This selector matches `[role=status]` regardless of `aria-live="off"`, and a textContent change sets liveRegionChanged:true even though a real screen reader (and the harness's own VSR) a…
- **Observed:** validateResults accepts NOT REPRODUCED on dynamic-announcement/4.1.3; the audit reports a clean pass (normativeFailures unchanged). The VSR positively recorded silence (vsrAnnouncement:null) yet the contradiction was suppressed.
- **Expected (WCAG):** WCAG 2.1 SC 4.1.3 Status Messages (AA): a status message that does NOT receive focus must be programmatically determinable through role/properties so AT can present it. `aria-live="off"` is the explicit instruction to AT to NOT announce updates, so the status change is not perceivable to a screen-reader user — a 4.1.3 failure. With the driver observing a silent view change AND vsrAnnounced:false, …
- **WCAG basis:** https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html — status messages must be exposed to AT without focus; aria-live="off" suppresses the announcement, so the update is not conveyed.
- **Repro input:** Fixture: <span onclick> (non-focusable, so focus stays on body) that on click sets a <div role=status aria-live="off"> textContent to 'Showing N results' and updates a visible count. Driven via `node scripts/drive-page.js --file fx --xpaths [span] --run-id R`. Driver output for t…

### [2] HIGH · reproduced — `B-axe-floor`
**axe-failed-to-run (out.axe=[]) makes the skip floor a silent no-op — a 1.1.1 Level A failure is skipped into a clean audit**

- **Mechanism:** build-results.js:74-75 derives collectorAxe.seriousCount by filtering collect.axe for impact critical|serious. eval-page.js:205 sets out.axe=[] on the axe catch path. result-builder.js:355 `if (AX && AX.seriousCount > 0)` therefore never fires when axe failed to run (seriousCount=0), and NO guard distinguishes 'axe ran clean' from 'axe never ran'. The skipped element is then bounded only by the 25% cap, so an element axe would have flagged is laundered.
- **Observed:** Run A: REFUSED to write — 'provenance/axe: the collector's axe run found 1 critical/serious violation(s), so EVERY collected element must be evaluated — the audit SKIPPED 1'. Run B (axe=[]): 'wrote out.B.json — 4 elements, 0 normative failures, 0 deduped issues (validated)' exit 0; output records skipped:['/html/body/i…
- **Expected (WCAG):** WCAG 2 SC 1.1.1 Non-text Content (Level A) requires the <img> to have a text alternative; a missing-alt image is a Level A failure. The collector's axe pass not running is not evidence of conformance — failing OPEN (treating absent axe as zero violations) lets a genuine Level A defect be skipped and the page reported with 0 normative failures.
- **WCAG basis:** WCAG 2.2 Understanding SC 1.1.1 Non-text Content (Level A): non-text content must have a text alternative.
- **Repro input:** records.json: 5-element inventory, 4 elements evaluated, skipped:[{xpath:'/html/body/img[1]', reason:'decorative image, not part of the interactive sample under audit'}]. collect.json (file=assets/saved/page.html, runId=R1): identical EXCEPT collect.axe. Run A: collect.axe=[{id:'…

### [3] MEDIUM · reproduced — `A-binding-completeness`
**3.3.1 NOT REPRODUCED on a field outside any <form> (or in a skipped form) is cleared by an unrelated clean form via the page-level fallback**

- **Mechanism:** driverEvidenceFrom builds formByField (L264-268) only from forms[].fieldXpaths/perField, and the driver's form probe (drive-page.js L740) iterates ONLY `document.querySelectorAll('form')`. A field NOT inside a <form> element (standalone input with custom JS validation — common in React/SPA where no <form> is rendered), or a field whose form was skipped (L748, 'no visible editable fields'), is never enumerated, so formByField[xp] is undefined. behavioralSupport (L289-294) then routes it to the page-level aggregate fallback: if `formsTrust.allTrustedIsolated && !anyNoTextId`, a NOT REPRODUCED 3.…
- **Observed:** The binding returns {ok:true} for a NOT REPRODUCED 3.3.1 verdict on a field that the driver never probed for error identification; validateResults would accept the field's clean verdict on the strength of an unrelated form.
- **Expected (WCAG):** WCAG 2.1 SC 3.3.1 Error Identification (A): if an input error is automatically detected, the item in error must be identified and described to the user IN TEXT. A NOT REPRODUCED claim must rest on evidence about THAT field's error handling. An unrelated form's native text identification is not evidence about a standalone field; the verdict should not be clearable (the binding should require the fi…
- **WCAG basis:** https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html — errors must be identified in text for the specific field in error.
- **Repro input:** drive.json = {forms:[{skipped:false, submitMethod:'trusted', nativeTextIdentification:true, noTextIdentificationAtAll:false, fieldXpaths:['/html/body/form[1]/input[1]']}], elements:[]}. DE = driverEvidenceFrom(drive) => formsTrust {probed:true, allTrustedIsolated:true, anyNoTextI…

### [4] MEDIUM · reproduced — `B-axe-floor`
**regression-sweep never passes collectorAxe, so the axe floor is entirely inert in the read-only re-gate**

- **Mechanism:** regression-sweep.js:69-70 builds opts = { driverEvidence } only (no collectorAxe) and calls builder.validateResults(R, opts). result-builder.js:354 reads opts.collectorAxe → undefined → the floor at L355 (`if (AX && ...)`) is skipped. A results.json that skipped an axe-flagged element validates clean in the sweep even though build-results.js with the SAME collect.json refuses it.
- **Observed:** 'regression sweep OK — 1 pages, all invariants hold (...C5 aggregates).' exit 0 — while build-results.js with the identical collect.json (Scenario A) REFUSED. The sweep gives false assurance that an axe-flagged-element-skip audit is clean.
- **Expected (WCAG):** If the sweep is used as an independent re-gate of completeness, it must apply the same ground-truth floor: an audit that skipped an element axe reported a violation on (a potential Level A/AA failure) should be flagged, not reported as 'all invariants hold'.
- **WCAG basis:** WCAG-EM completeness: a sample marked un-evaluated cannot be assumed conformant when the automated check flagged it; re-validation must enforce the same must-evaluate floor as the primary gate.
- **Repro input:** slug dir page/ containing results.json (the laundered out.B.json that skipped /html/body/img[1]), collect.json whose axe FOUND the critical image-alt on that xpath, and drive.json. Run: node scripts/tools/regression-sweep.js <dir>.

### [5] MEDIUM · reproduced — `C-runid`
**Stale/hand-edited drive.json passes the run-id gate by reusing --run-id; no collectedAt-vs-drivenAt freshness cross-check**

- **Mechanism:** build-results.js L56 only enforces collect.runId === drive.runId (string equality). drivenAt (stamped by drive-page.js) is never read anywhere; collectedAt is only stored into provenance (L72), never compared. So a drive whose drivenAt predates the collect's collectedAt - impossible for a coordinated run - validates as long as it carries the same run-id string. The shared id proves coordination, not freshness, defeating the stated #3 intent ('a stale drive.json from an earlier run authorized a now-wrong behavioral verdict').
- **Observed:** exit 0; 'wrote out.json - 1 elements, validated'; out.elements[0].skills['focus-visibility'].verdict === 'NOT REPRODUCED'. The 2-hour-stale drive's focusIndicator.present:true authorized a definite 2.4.7 'no defect' verdict on the current page.
- **Expected (WCAG):** A definite NOT REPRODUCED for SC 2.4.7 (Focus Visible, AA - 'any keyboard operable UI has a mode where the focus indicator is visible') must be bound to a focus-indicator probe of the CURRENT page state. A probe captured in an earlier run (drivenAt long before this collect) does not evidence the current page; per the harness's own R2.4-B/R2.5-A binding intent such a verdict must fall back to PARTI…
- **WCAG basis:** WCAG 2.x SC 2.4.7 Focus Visible (Level AA); harness contract R2.4-B/R2.5-A (definite behavioral verdict bound to current driver evidence) and R2.6-C commit 978eaf9 stated goal #3 (reject a stale drive…
- **Repro input:** collect_fresh.json={file:'p.html',runId:'REUSED-ID',collectedAt:NOW,elements:[{xpath:'/btn'}],axe:[]}; drive_stale.json={file:'p.html',runId:'REUSED-ID',drivenAt:NOW-7200000,elements:[{xpath:'/btn',focusIndicator:{present:true},behavioralTrust:{}}],forms:[]}; records claim NOT RE…

### [6] MEDIUM · reproduced — `C-runid`
**Predicate-spacing xpath duplicate evades norm() dedup; same DOM node counted twice, inflating the collector inventory**

- **Mechanism:** build-results.js L64 norm()=trim+collapse-whitespace does NOT strip whitespace inside XPath predicates, so '//div[@id="only"]' and '//div[@id = "only"]' normalize as DISTINCT. But real Chrome document.evaluate (used by eval-page.js L225/L436) resolves both to the IDENTICAL node. The duplicate passes the L66-70 'must be unique' gate and is counted as two elements, masking a fabricated/inflated count - the exact thing #9 claims to reject.
- **Observed:** exit 0; 'wrote out.json - 2 elements, validated'; out.summary.elements === 2 for what is a single DOM node. The L67 'duplicate xpath(s)' REFUSED branch did NOT fire.
- **Expected (WCAG):** The collector inventory must contain each evaluated node once so coverage/skip accounting is honest; the harness's own R2.5-C/R2.6-C #9 requires rejecting (not silently accepting) a duplicate-laden inventory so it cannot mask a fabricated count. Two inventory entries resolving to the same node must be REFUSED as a duplicate.
- **WCAG basis:** Not a single SC clause but the WCAG-conformance evaluation-completeness premise (every in-scope element evaluated and counted once; cf. WCAG-EM sampling) and harness contract R2.5-C/R2.6-C #9 (raw col…
- **Repro input:** Verified in real Chrome: document.evaluate('//div[@id="only"]') and document.evaluate('//div[@id = "only"]') both return the single <div id=only>; same for /html/body/div[1] vs /html/body/div[ 1 ]. collect_dupspacing.json={file:'p.html',runId:'REUSED-ID',collectedAt:NOW,elements:…

### [7] MEDIUM · reproduced — `D-trap`
**Normal long navigation (>MAXTAB distinct focusables) is falsely reported as a non-converging keyboard trap (trapIndeterminate)**

- **Mechanism:** The in-loop stuck-detector only fires after NO_NEW=8 CONSECUTIVE revisits of already-seen elements (drive-page.js L348, L355). On a page with 130 distinct sequentially-tabbable links, the first 120 Tabs (MAXTAB=120) each land on a brand-new element, so stopsSinceNew never reaches 8 and no in-loop verdict is ever produced; the loop exits at i==MAXTAB. The R2.6-D post-loop resolver then sees `unresolved` (trapDetected===false, no escapableComponent, trapIndeterminate==null) and `reached(120) >= MAXTAB(120)`, so it executes the #7 ever-fresh branch (L429-433) and sets trapDetected=null, trapIndet…
- **Observed:** totalFocusables=130, count=120, stops=120 with ALL 120 stops DISTINCT (zero revisits; first stop /html/body/nav[1]/a[1], last stop /html/body/nav[1]/a[120]), trapDetected=null, trapIndeterminate=true, trapReason='tab-walk did not converge (focus kept advancing to new focusables without bound, or exceeded budget) — keyb…
- **Expected (WCAG):** WCAG 2.1.2 'No Keyboard Trap' (SC 2.1.2) is satisfied when focus can be moved away from a component using only the keyboard (Tab/Shift+Tab/arrows/Esc). A page of 130 distinct, sequentially Tab-reachable links has no trap: focus advances through each control and wraps. The harness should report this as NOT a trap (or, if it must hedge, with a reason that does not assert non-convergence). Asserting …
- **WCAG basis:** WCAG 2.1.2 No Keyboard Trap (Level A) — Understanding 2.1.2: focus must be removable from any component using a standard keyboard interface; conformance turns on whether focus can MOVE AWAY, not on th…
- **Repro input:** assets/saved/fx-r26a-D-longnav-3.html (now removed): <nav> containing 130 plain <a href='#itemN'>Link N</a> generated in a loop; no script that touches Tab, no preventDefault, no focus listeners. A fully WCAG-2.1.2-conformant large menu. Run: node scripts/drive-page.js --file fx-…

### [8] LOW · reproduced — `B-axe-floor`
**seriousCount ignores axe rules rated moderate/minor that are still WCAG failures, so the floor passes them through even when axe DID run**

- **Mechanism:** build-results.js:75 counts ONLY impact==='critical'||'serious'. Real axe rates several genuine WCAG violations below serious. A live eval-page.js run produced impact 'moderate' for `region` and `landmark-one-main` and impact 'minor' for `empty-heading`. The floor uses axe's impact severity heuristic as a proxy for 'is a WCAG failure'; any failure axe rates moderate/minor yields seriousCount=0 and the floor stays inert, permitting a skip of the very element axe flagged.
- **Observed:** CLI with the moderate image-alt collect.axe: 'wrote out.C.json — 4 elements, 0 normative failures, 0 deduped issues (validated)' exit 0 — the floor did NOT fire despite axe reporting a violation on the skipped element. Live runs confirmed real axe rules at impact moderate (region, landmark-one-main) and minor (empty-he…
- **Expected (WCAG):** An axe violation node on a collected element is evidence that element may be defective regardless of axe's impact label; impact is a severity heuristic, not a conformance level. The floor should trigger on the presence of a WCAG-tagged violation on the element (or simply any violation node on a skipped element), not on the impact bucket. region/landmark are best-practice-tagged, but the mechanism …
- **WCAG basis:** WCAG 2.2 Understanding: conformance is per Success Criterion/level, independent of axe's `impact` severity heuristic; relying on impact==serious to decide 'must-evaluate' is unsound.
- **Repro input:** Same 5-element records with the img skipped, but collect.axe=[{id:'image-alt',impact:'moderate',wcag:['wcag2a','wcag111'],nodes:[{target:['/html/body/img[1]']}]}] (impact downgraded to moderate). Plus live ground truth: `node scripts/eval-page.js --file fx-r26a-moderate-1.html ..…

### [9] LOW · reproduced — `E-target-grid`
**Outer +-12 ring excluded -> only a sub-pixel razor-band defect escapes (NOT WCAG-relevant, no false pass)**

- **Mechanism:** The grid samples dx/dy in [-11,11], excluding the +-12 outer ring of the 24x24 square. A non-target feature is missed ONLY if it is confined strictly between the +-11 sample and the +-12 edge (a <1px band). Any >=1px feature that reaches x<=23 (within +-11) is sampled and caught.
- **Observed:** squareFits=false, verdict='needs-judgment' — the strip WAS caught because its left edge sits at the dx=+11 sample (screen x=cx+11). Could not construct a >=1px defect that lives only in (11,12) without it being sub-pixel.
- **Expected (WCAG):** SC 2.5.8 measures a 24x24 region; a sub-1px edge gap is physically irrelevant for a pointer and elementFromPoint at the razor edge is ambiguous from sub-pixel rounding. Excluding the +-12 ring does not produce a WCAG-wrong pass.
- **WCAG basis:** WCAG 2.2 SC 2.5.8 Understanding (24 CSS px target).
- **Repro input:** assets/saved/fx-r26a-E-edge-1.html: 24x24 <a> with a 1px white non-target strip at right:0 (local x 23..24).

---
*Generated from the `r26-adversarial-audit` workflow result (refute → independent-verify pipeline).*
