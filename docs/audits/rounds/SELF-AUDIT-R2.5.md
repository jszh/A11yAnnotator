# Self-Audit — Round 2.5 (adversarial workflow `r25-adversarial-audit`)

Date: 2026-06-14

**What this is.** After shipping the R2.5 harness fixes I ran a background Workflow that
spawned one adversarial agent per fix to *refute* it with **code-executed** counterexamples,
then an **independent verifier** re-ran each claim. Only findings that survived both layers
(`isReal && reproduced && severity ≠ not-a-bug`) are listed below. This is my OWN self-audit —
distinct from the external reviewer's `ROUND2*-INDEPENDENT-VERIFICATION.md`.

**Audited:** the R2.5 fixes (R24-C1 + H1/H2/H3 + M1/M2), HEAD 6acdf54..5395da6

**Disposition:** ALL 10 fixed in R2.6 (A-E; #9 rated not-a-bug by the verifier).

## Summary — 10 confirmed (4 high, 4 medium, 2 low)

| Fix surface | Confirmed gaps |
|---|---:|
| A-outcome-binding | 4 |
| B-skips-axe | 2 |
| C-identity | 3 |
| D-trap | 3 |
| E-target | 2 |
| F-recursive | 0 *(exhausted)* |

## Findings

### [1] HIGH · reproduced — `A-outcome-binding`
**forms-instructions-errors: a field with NO per-field driver mapping falls back to a page-level pass, so a field whose OWN form failed 3.3.1 validates because a DIFFERENT form was clean**

- **Mechanism:** behavioralSupport() for 'forms-instructions-errors' (L265-274): if formOutcome (DE.formByField[xpath]) is falsy it skips the field-specific contradiction checks and only requires formsTrust.allTrustedIsolated (true when EVERY probed form had submitMethod:'trusted'). formByField is populated only from each form's perField[] entries (driverEvidenceFrom L253). A failing form with an empty perField[] contributes NO entry, so its fields take the page-level fallback. allTrustedIsolated stays true even though that form had noTextIdentificationAtAll:true. The field-mapped path WOULD reject it: behavio…
- **Observed:** CLI wrote a3_out.json, exit 0: 'wrote a3_out.json — 1 elements, 0 normative failures, 0 deduped issues (validated).' normativeFailures=0; forms verdict NOT REPRODUCED stands.
- **Expected (WCAG):** WCAG 2.1 Understanding 3.3.1 Error Identification requires that when an input error is detected 'the item that is in error is identified and the error is described to the user in text.' A form that produced no text identification of errors (noTextIdentificationAtAll) fails 3.3.1; the binding must tie the field's verdict to its OWN form. The page-level fallback should NOT clear a field whose own fo…
- **WCAG basis:** WCAG 2.1 SC 3.3.1 Error Identification (Level A), Understanding doc — errors identified/described in text.
- **Repro input:** Element /html/body/form[1]/input[1] with forms-instructions-errors = {verdict:'NOT REPRODUCED', sc:'3.3.1', level:'A', bucket:'normative', trust:'trusted', isolation:'isolated'}. drive.json forms: [ {submitMethod:'trusted', noTextIdentificationAtAll:true, perField:[]} (the field'…

### [2] HIGH · reproduced — `B-skips-axe`
**One fabricated normativeFailure disables the axe skip-floor entirely (the floor's normativeFailures===0 guard is trivially dodged)**

- **Mechanism:** The R2.5-B ground-truth floor in result-builder.js validateResults (L333-335) fires ONLY when `AX.seriousCount > 0 && skippedN > 0 && R.summary.normativeFailures === 0`. The `=== 0` clause means a single REPRODUCED anywhere in the audit makes `normativeFailures >= 1`, so the floor never runs. An agent that wants to mass-skip flagged elements simply stamps ONE extra REPRODUCED. I put it on a NON-behavioral skill (name-role-state / SC 4.1.2) so the driver-evidence binding (which only gates BEHAVIORAL_SKILLS) never touches it — no driver support needed. The fabricated failure is the only issue th…
- **Observed:** Exit 0: 'wrote out.json — 15 elements, 1 normative failures, 1 deduped issues (validated).' The CONTROL run (identical records but element[0].name-role-state reverted to N/A, i.e. normativeFailures=0) is REFUSED with exit 1: 'provenance/axe: the collector's axe run found 9 critical/serious violation(s), but the audit S…
- **Expected (WCAG):** Per WCAG 2.2 Conformance Requirement 1 (Conformance Level) and Requirement 3 (Full pages), a conformance claim covers the full page and holds only if ALL content satisfies the SCs at the claimed level. axe-flagged image-alt (1.1.1 Level A, Non-text Content), aria-required-attr/aria-input-field-name (4.1.2 Level A, Name Role Value), target-size (2.5.8 AA), and label-content-name-mismatch (2.5.3 A) …
- **WCAG basis:** WCAG 2.2 Conformance Requirements 1 (Conformance Level) and 3 (Full pages); SC 1.1.1, 4.1.2 (Level A), 2.5.3 (Level A), 2.5.8 (Level AA)
- **Repro input:** Records for Gymshark.htm (21-element collector inventory, collect.axe = 9 critical/serious violations incl image-alt:critical=1.1.1, aria-required-attr:critical=4.1.2, target-size:serious=2.5.8, label-content-name-mismatch:serious=2.5.3). Evaluate 15 elements (all skills N/A with…

### [3] HIGH · reproduced — `C-identity`
**Stale drive.json from an earlier run of the SAME page authorizes a WCAG-wrong behavioral PASS (identity is by file STRING only)**

- **Mechanism:** Identity binding (build-results.js L49) compares only the `file` string across records/collect/drive, and provenance.collect.page=collect.file (L62). The driver-evidence binding (driverEvidenceFrom L225-255 + behavioralSupport L277-283, invoked at result-builder.js L352-355) keys exclusively on e.xpath — there is NO run-id, timestamp, or content-hash tying drive.json to the run that produced the records. A drive.json captured in an EARLIER run of the same file (same xpaths) with contradictory/stale outcome signals passes identity and authorizes the current verdict.
- **Observed:** With the STALE drive: "wrote out.json — 1 elements, 0 normative failures, 0 deduped issues (validated)." (exit 0); written focus-visibility verdict {"verdict":"NOT REPRODUCED","sc":"2.4.7","level":"AA"}. With the FRESH drive (present:false) identical records REFUSED: "definite NOT REPRODUCED not supported by driver evi…
- **Expected (WCAG):** SC 2.4.7 Focus Visible (AA) requires keyboard-operable UI to have a visible focus indicator. If the page CURRENTLY lacks the indicator (fresh truth, present:false), a 'NOT REPRODUCED' (no defect) verdict is WCAG-wrong; the claim must reflect the page as it currently is. The harness must not let an artifact from a different/earlier run — when the indicator still existed — authorize a clean verdict …
- **WCAG basis:** WCAG 2.1/2.2 SC 2.4.7 Focus Visible (Level AA): 'any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible.' Schema confirms 2.4.7 level=AA.
- **Repro input:** records.json {file:'stale-victim.htm', element /html/body/main[1]/button[1] focus-visibility verdict 'NOT REPRODUCED' sc 2.4.7 level AA}; collect.json {file:'stale-victim.htm', same element, axe:[]}; STALE drive.json {file:'stale-victim.htm', elements:[{xpath:'/html/body/main[1]/…

### [4] HIGH · reproduced — `D-trap`
**preventDefault freeze trap stuck on <body> after the harness pre-blur -> false trapDetected:false, count:0**

- **Mechanism:** L278 blurs activeElement before the walk. A whole-page freeze trap that preventDefault()+stopImmediatePropagation()s every Tab keydown then leaves focus on document.body (the prevented Tab never moves it off body). Every walk iteration evaluates activeElement===body -> {none:true}. The 3-consecutive-none guard (L337) breaks the loop after 3 nones, BEFORE any stop is pushed, so stopsSinceNew never advances and stuck-detection (L352) never runs. The walk ends with 0 stops and trapDetected at its initial false. The L334-336 'allow a single none' remediation only tolerates 2 consecutive nones; a f…
- **Observed:** tabWalk.trapDetected=false; trapIndeterminate=undefined; count=0; totalFocusables=0; escapableComponent=undefined. Stable across 2 runs. Direct puppeteer probe (no pre-blur) shows a REAL user has focus FROZEN on button A across multiple Tabs (start=a, afterTab1=a, afterTab2=a) — a genuine 2.1.2 trap; only the harness's…
- **Expected (WCAG):** Per WCAG 2.1.2, a component where Tab is preventDefaulted and focus cannot move away by keyboard is a keyboard trap and must be reported as a failure (trapDetected:true) or at least trapIndeterminate. A silent trapDetected:false with count:0 is WCAG-wrong.
- **WCAG basis:** WCAG 2.1.2 No Keyboard Trap (Level A).
- **Repro input:** assets/saved/fx-r25a-D-1b.html: <button id=a>,<button id=b>, capture-phase keydown listener: if key is 'Tab' or 'Escape' -> e.preventDefault(); e.stopImmediatePropagation();. a.focus() at load. Run: node scripts/drive-page.js --file fx-r25a-D-1b.html --xpaths '["/html/body/button…

### [5] MEDIUM · reproduced — `A-outcome-binding`
**dynamic-announcement: NOT REPRODUCED 4.1.3 has NO positive-announcement requirement — a real Status Messages failure (status changed, nothing announced) validates as clean**

- **Mechanism:** behavioralSupport() for skill 'dynamic-announcement' (result-builder.js L303-307) only checks REP && ev.vsrAnnounced. There is NO branch for the NOT-REPRODUCED case, so a NR 4.1.3 verdict is accepted whenever activation is trusted+isolated, regardless of whether the driver actually captured an announcement. driverEvidenceFrom (L243-244) records both vsrAnnounced and liveRegionChanged, but the NR path consults neither. Thus liveRegionChanged:true + vsrAnnounced:false (a status DOM change the SR never announced — the canonical 4.1.3 failure) is blessed as NOT REPRODUCED.
- **Observed:** CLI wrote a2_out.json, exit 0: 'wrote a2_out.json — 1 elements, 0 normative failures, 0 deduped issues (validated).' summary.normativeFailures=0; the 4.1.3 verdict stands as NOT REPRODUCED.
- **Expected (WCAG):** WCAG 2.1 Understanding 4.1.3 Status Messages requires status messages to be programmatically determinable 'through role or properties such that they can be presented to the user by assistive technologies without receiving focus.' A status change (liveRegionChanged:true) that produced NO assistive-technology announcement is precisely the 4.1.3 failure; the binding should reject NOT REPRODUCED when …
- **WCAG basis:** WCAG 2.1 SC 4.1.3 Status Messages (Level AA), Understanding doc — programmatic determination of status without focus.
- **Repro input:** Element /html/body/button[1] with skills['dynamic-announcement'] = {verdict:'NOT REPRODUCED', sc:'4.1.3', level:'AA', bucket:'normative', trust:'trusted', isolation:'isolated', evidence:'status update is announced ...'}. drive.json element: behavioralTrust.activation={trusted:tru…

### [6] MEDIUM · reproduced — `A-outcome-binding`
**focus-management: only focus-return is contradiction-checked — a REPRODUCED 2.4.7 'no focus indicator' stands even though the driver saw focusIndicator.present:true (asymmetric with focus-visibility, which catches it)**

- **Mechanism:** behavioralSupport() for 'focus-management' (L297-301) has a single contradiction check: REP && ev.dialogOpened && ev.focusReturnedToTrigger===true. 2.4.7 is an allowed SC for focus-management (result-schema.js L26 SKILL_SCS['focus-management'] includes '2.4.7'), and driverEvidenceFrom records ringPresent for the element, but focus-management never consults it. So a REPRODUCED 2.4.7 ('no visible focus indicator') is accepted on an element the driver observed with focusIndicator.present:true. The focus-VISIBILITY branch (L279-282) rejects the identical contradicted verdict — confirmed: behaviora…
- **Observed:** Direct probe returned {"ok":true}; full buildResults+validateResults returned ok=true with the 2.4.7 'no focus indicator' REPRODUCED standing as a normative failure despite the driver observing a present ring. The focus-visibility path on the same inputs returns {ok:false, reason:'REPRODUCED "no focus indicator" (2.4.7…
- **Expected (WCAG):** WCAG 2.1 Understanding 2.4.7 Focus Visible requires a visible keyboard-focus indicator. When the driver observed focusIndicator.present:true, a 'no focus indicator' REPRODUCED is directly contradicted and should be downgraded to PARTIAL — identically whether the SC is cited under focus-visibility or focus-management. The binding should apply the ring-existence contradiction to any skill citing 2.4…
- **WCAG basis:** WCAG 2.1 SC 2.4.7 Focus Visible (Level AA), Understanding doc — visible focus indicator; consistency with the focus-visibility branch which enforces it.
- **Repro input:** behavioralSupport('focus-management','REPRODUCED',['2.4.7'], {activation:{trusted:true,isolated:true}, dialogOpened:false, focusReturnedToTrigger:undefined, focusProbed:true, ringPresent:true}, null, null) returns {ok:true}. End-to-end via validateResults on element /html/body/na…

### [7] MEDIUM · reproduced — `D-trap`
**Ever-fresh-focusable trap defeats stuck-detection -> false trapDetected:false**

- **Mechanism:** Stuck-detection only runs when stopsSinceNew reaches NO_NEW=8 (L352). A trap that preventDefault()+stopImmediatePropagation()s Tab and then creates a BRAND-NEW focusable and .focus()es it on EVERY Tab makes every stop a never-seen xpath, so seenAll grows unbounded and stopsSinceNew is reset to 0 every press -> NO_NEW is never reached -> the stuck-detection/Escape/Tab-probe/interference block (L352-410) NEVER executes. The for loop simply exhausts MAXTAB=120 and falls through with trapDetected at its initial false. No interference is ever measured, no indeterminate is ever set.
- **Observed:** tabWalk.trapDetected=false; trapIndeterminate=undefined; trapInterference=undefined; escapableComponent=undefined; count=120; uniqueStops=120; totalFocusables=1. Stable and identical across 3 consecutive runs. Real-user probe confirms Tab is cancelled and focus can never reach any exit (every 'new' control is created i…
- **Expected (WCAG):** Per WCAG 2.1.2 (No Keyboard Trap, Level A): if focus can be moved to a component using the keyboard, it must be possible to move focus away using only the keyboard (Tab/Shift+Tab/standard exit), or the user must be advised of a non-standard exit. Here focus cannot leave the page by any keyboard means and there is no advisement -> this is a FAILURE of 2.1.2. The harness should report trapDetected:t…
- **WCAG basis:** WCAG 2.1.2 No Keyboard Trap (Level A) — 'focus can be moved away from that component using only a keyboard interface ... if it requires more than unmodified arrow or tab keys ... the user is advised o…
- **Repro input:** assets/saved/fx-r25a-D-4.html: <button id=a> + a capture-phase keydown listener: on key==='Tab' -> e.preventDefault(); e.stopImmediatePropagation(); seq++; create <button id=dyn+seq>, append to body, fresh.focus(); on key==='Escape' -> preventDefault+stopImmediatePropagation (eat…

### [8] MEDIUM · reproduced — `E-target`
**2px-grid Nyquist blind spot: opaque non-target 'comb' covering ~50% of the centred square is reported squareFits:true / verdict pass**

- **Mechanism:** squareFits samples elementFromPoint on a FIXED 2px lattice: offsets dx,dy in {-11,-9,...,-1,1,...,11} (step 2 from cx-11), i.e. sample lines are exactly 2px apart and offset 0 (the exact centre line) is skipped entirely. Between every pair of adjacent sample lines there is a continuous unsampled gap just under 2px wide. Any opaque NON-target element <=1px wide that is pixel-aligned to fall strictly inside such a gap is invisible to the grid. Probing confirmed the lattice is always 2px-spaced regardless of cx (cx=214 -> cols 203,205,...,225; cx=214.297 -> 203.297,205.297,...): the gaps are intr…
- **Observed:** squareFits:true, targetSize.verdict:'pass', reason:'meets 24x24 - a page-aligned 24x24 square is densely hit-tested fully on-target', obscured:true. Direct probe: missCount=0 (every one of the 144 sampled points landed on the button; none of the ~13 opaque non-target strips, which cover roughly half the square's area, …
- **Expected (WCAG):** WCAG 2.2 SC 2.5.8 Target Size (Minimum) requires the target to offer a 24x24 CSS px region not intersected by other targets / clear obstructions; the W3C Understanding measures the area available for the pointer. With opaque non-target overlay strips covering ~50% of the centred area, no contiguous 24x24 on-target region exists, so the correct harness result is needs-judgment (squareFits should be…
- **WCAG basis:** WCAG 2.2 SC 2.5.8 Target Size (Minimum), Understanding 2.5.8 (target area available to the pointer; obstructions reduce effective target size).
- **Repro input:** fx-r25a-E-barcode.html (server UP, port 3001): <button id='btn' style='position:absolute;top:200px;left:200px;width:28px;height:28px;background:#0a0'>Z</button> plus opaque white 1px vertical strips .s{position:absolute;top:200px;width:1px;height:28px;background:#fff;z-index:9} a…

### [9] LOW · reproduced — `C-identity`
**Raw collector-inventory duplicate rejection bypassed by a whitespace-variant xpath (no normalization), inflating element count**

- **Mechanism:** The raw-dup check (build-results.js L55-59) and inventory/element matching (result-builder.js L188 invSet, L210 invSet.has) use exact-string Set equality with NO xpath normalization (only `evidence` is normalized). A trailing/leading-space variant of an xpath is a distinct string, so it evades the dup check while denoting the same logical element. The L53-54 comment states the goal is so 'a duplicate-laden inventory can't mask a fabricated count.'
- **Observed:** CLI: "wrote out.dup.json — 2 elements, 0 normative failures, 0 deduped issues (validated)." (exit 0). One logical element counted as 2; raw-dup guard did not fire (xpaths[0]==xpaths[1] is false, xpaths[0].strip()==xpaths[1].strip() is true).
- **Expected (WCAG):** Sampling-integrity / count-fabrication control: raw xpaths must be UNIQUE before normalization so a duplicate cannot mask/inflate the audited element count; a whitespace-variant duplicate should be rejected (or canonicalized then rejected), not counted as two. Exploitability is bounded by needing a forged/tampered collect.json — the same trust boundary the identity binding protects.
- **WCAG basis:** Supports WCAG sampling/representative-page integrity (an evaluation must not over-report assessed elements). Harness-internal R2.5-C raw-dup rule, not a specific SC normative requirement.
- **Repro input:** collect.json elements with xpaths '/html/body/main[1]/button[1]' and '/html/body/main[1]/button[1] ' (trailing space); records.json evaluates BOTH variant strings as separate elements. CLI: node scripts/tools/build-results.js records.dup.json out.dup.json collect.dup.json drive.j…

### [10] LOW · reproduced — `E-target`
**Single 1px centre strip (minimal repro of the parity hole)**

- **Mechanism:** With box left=200/width=28 the centre cx=214 is an even integer; offset 0 is never sampled and the adjacent sampled columns are 213 and 215, so the pixel box [214,215) is unsampled. A 1px opaque strip pixel-aligned at left:214px (NOT left:213.5px, which bleeds onto column 213 and is caught) is invisible to the grid.
- **Observed:** squareFits:true, verdict:'pass', obscured:true (centre-point caught the strip but verdict unchanged). Probe missCount=0.
- **Expected (WCAG):** Marginal as a standalone 2.5.8 fail (a 1px hairline), but it is the minimal proof that the grid cannot see a sub-2px obstruction; combined into a comb (above) it becomes a clear failure. Correct harness output for the obstructed square is needs-judgment, not a definite pass.
- **WCAG basis:** WCAG 2.2 SC 2.5.8 Target Size (Minimum).
- **Repro input:** fx-r25a-E-2.html: 28x28 button at (200,200) with <div style='position:absolute;top:200px;left:214px;width:1px;height:28px;background:#fff;z-index:9'>. Run via eval-page.js with xpath //*[@id='btn2'].

---
*Generated from the `r25-adversarial-audit` workflow result (refute → independent-verify pipeline).*
