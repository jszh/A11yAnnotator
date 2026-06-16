# Self-Audit — Round 2.4 (adversarial workflow `r24-adversarial-audit`)

Date: 2026-06-14

**What this is.** After shipping the R2.4 harness fixes I ran a background Workflow that
spawned one adversarial agent per fix to *refute* it with **code-executed** counterexamples,
then an **independent verifier** re-ran each claim. Only findings that survived both layers
(`isReal && reproduced && severity ≠ not-a-bug`) are listed below. This is my OWN self-audit —
distinct from the external reviewer's `ROUND2*-INDEPENDENT-VERIFICATION.md`.

**Audited:** the R2.4 fixes (R23-C1/C2/H1/H2/H3/M1/M2 remediation), HEAD b755e42..2bb2133

**Disposition:** ALL fixed in R2.5 (A-F).

## Summary — 9 confirmed (5 high, 2 medium, 2 low)

| Fix surface | Confirmed gaps |
|---|---:|
| A-provenance | 2 |
| B-behavioral-binding | 3 |
| C-trap | 2 |
| D-target | 3 |
| E-merge | 0 *(exhausted)* |
| F-strictness | 0 *(exhausted)* |

## Findings

### [1] HIGH · reproduced — `A-provenance`
**Completeness is trivially bypassable: agent drops the entire collected inventory via skipped[] with a 1-character reason, hiding real WCAG failures and emitting a validated 'clean' audit**

- **Mechanism:** build-results.js L38 passes input.skipped straight through into provenance.collect.skipped — skipped[] is 100% AGENT-controlled, not derived from collect.json. validateProvenance (result-builder.js L186-201) only requires each skip entry to be {xpath in inventory, reason: any non-whitespace string}, with NO cap on how many elements may be skipped and NO quality bar on the reason. So an agent evaluates exactly one token element and lists the other N-1 collected xpaths in skipped[] with reason "." The 'default-closed completeness' check (L200-201: every inv xpath must be seen||skipped) is satisf…
- **Observed:** wrote /tmp/fx-r24a-out.json — 1 elements, 0 normative failures, 0 deduped issues (validated). exit 0. Written summary.elements=1, normativeFailures=0, issues=0, provenance.collect.xpaths.length=21, skipped.length=20. Reddit collect.json's axe[] carries critical aria-allowed-attr, critical aria-valid-attr-value, serious…
- **Expected (WCAG):** A conformance audit cannot claim a page passes (0 failures) while evidence (axe, in the collector's own output) shows critical/serious violations on collected elements. WCAG-EM (the W3C evaluation methodology the provenance gate emulates) requires the evaluated sample to be representative and completeness to be substantive; a skip must be justified (e.g. genuinely out-of-scope / not in the sample)…
- **WCAG basis:** WCAG-EM 1.0 Step 3 (representative sample) / Step 5 (record findings) — completeness; plus SC 2.4.4 Link Purpose (A) and SC 4.1.2 Name,Role,Value (A): the link-name and aria-valid-attr-value violation…
- **Repro input:** Through the real mandatory gate: node scripts/tools/build-results.js <input.json> out.json eval-results/Reddit/collect.json eval-results/Reddit/drive.json, where input.json evaluates only collect.elements[0] (all skills N/A) and sets input.skipped = collect.xpaths.slice(1).map(x=…

### [2] HIGH · reproduced — `B-behavioral-binding`
**dynamic-announcement (4.1.3) NOT REPRODUCED rubber-stamped on bare-click activation — driver's actual announcement signals discarded**

- **Mechanism:** behavioralSupport() for 'dynamic-announcement' (result-builder.js lines 235-240) only checks ev.activation.trusted===true && ev.activation.isolated===true. driverEvidenceFrom() (lines 210-216) distils activation down to {trusted,isolated} only. The driver (drive-page.js lines 646/655/669) actually CAPTURES liveRegionChanged, liveMutations, and vsrAnnouncement, but the binding throws all of it away. So a definite 4.1.3 verdict validates whenever a trusted+isolated click occurred, with ZERO evidence that any status message was programmatically announced. The agent's self-stamped trust:'trusted'/…
- **Observed:** build-results.js exit 0; 'wrote out.json — 1 elements, 0 normative failures, 0 deduped issues (validated).' The dynamic-announcement NOT REPRODUCED verdict was written unchanged (verified via the written out.json). validateResults().ok===true, errors:[].
- **Expected (WCAG):** SC 4.1.3 conformance (a NOT REPRODUCED i.e. 'no status-message problem') requires that the status change be programmatically determinable via role/properties and exposable to AT without focus. The driver evidence used (a trusted+isolated click) carries no information about whether a status message was announced, so it cannot substantiate the claim; the verdict should be forced to PARTIAL (per the …
- **WCAG basis:** WCAG 2.2 SC 4.1.3 Status Messages (AA): 'status messages can be programmatically determined through role or properties such that they can be presented to the user by assistive technologies without rec…
- **Repro input:** Ran the MANDATORY gate: node scripts/tools/build-results.js /tmp/r24a/input.json out.json collect.json drive.json. input element /html/body/button[1] has skills.dynamic-announcement={verdict:'NOT REPRODUCED',sc:'4.1.3',level:'AA',evidence:'clicking added item to cart and the coun…

### [3] HIGH · reproduced — `C-trap`
**Disable-the-boundary trap evades detection two ways: BODY-wrap break short-circuits the walk AND the interference classifier sees no preventDefault/no extra focusin**

- **Mechanism:** The trap arms on modal focusin and sets tabindex=-1 on every non-modal focusable (or could disable them). Native Tab then cycles only the modal members forever; focus can never reach the boundary. Two independent code paths in the fix let this through. (1) PRIMARY: the native last->first Tab wrap passes through document.body in headless Chrome, so the per-stop snapshot returns {none:true}. The loop does `if (st.none) { if (i > 0) break; ... }` (L324), terminating the ENTIRE tab-walk before stopsSinceNew can reach NO_NEW(8). So the trap-confirmation probe at L338-379 (Escape + Tab/Shift+Tab + i…
- **Observed:** out.tabWalk.trapDetected = false (count:2, no escapableComponent, no budgetExceeded; stops: 'Modal B -> Modal C' then BODY break). For fx-r24a-C-disable1.html: trapDetected=false, count:6, stops 'Skip -> Outside 1 -> Outside 2 -> Modal A -> Modal B -> Modal C'. Standalone CDP probe (probe-escape.js) on disable2 confirm…
- **Expected (WCAG):** trapDetected should be true (a definite or at least flagged 2.1.2 failure). WCAG 2.1.2 No Keyboard Trap: 'If keyboard focus can be moved to a component using a keyboard interface, then focus can be moved away from that component using only a keyboard interface, and, if it requires more than unmodified arrow or tab keys or other standard exit methods, the user is advised of the method.' Here focus …
- **WCAG basis:** WCAG 2.1.2 (No Keyboard Trap), Level A. Normative requirement that focus be moveable away from a component using only the keyboard; the page actively prevents this by removing the boundary from the ta…
- **Repro input:** Fixture /Users/jason/Developer/A11yAnnotator/assets/saved/fx-r24a-C-disable2.html (and fx-r24a-C-disable1.html). Run: `node scripts/drive-page.js --file fx-r24a-C-disable2.html --xpaths /tmp/xp-disable1.json --shotdir /tmp/r24a` where /tmp/xp-disable1.json = ["/html/body/header/b…

### [4] HIGH · reproduced — `C-trap`
**BODY-wrap break alone undetects any disable/roving trap regardless of cycle length**

- **Mechanism:** Independent of the classifier, the `if (st.none) { if (i > 0) break; }` guard at L324 means ANY trap whose member cycle wraps through document.body (which is every native-Tab roving/disable trap in headless Chrome) terminates the walk on the first wrap. Because all distinct members are 'new' on the first pass (stopsSinceNew=0 each), the BODY stop is always hit BEFORE any revisit accumulates stopsSinceNew to NO_NEW(8). The probe block (the entire detection mechanism the fix added) is therefore unreachable for this trap class — making fixture member count irrelevant to evasion.
- **Observed:** Native sequence captured: 'skip b1 b2 m1 m2 m3 BODY m1 m2 m3 m1 m2 m3 BODY ...'. Harness loop breaks at the first BODY (count:2 for disable2 after the leading blur, count:6 for disable1). trapDetected:false in both; the Escape/Tab/Shift probe never executes.
- **Expected (WCAG):** The walk should not silently abandon detection when native Tab wraps through the document body; a wrap that always returns into the same bounded set with no path to any outside focusable is exactly the 2.1.2 condition that must be probed, not a termination signal.
- **WCAG basis:** WCAG 2.1.2 (No Keyboard Trap), Level A — same SC; this is the second, independent code path (the loop-termination guard) that suppresses the required check.
- **Repro input:** Same fixtures fx-r24a-C-disable1.html / fx-r24a-C-disable2.html. probe-disable1.js (standalone puppeteer) shows the native focus sequence: 'skip b1 b2 m1 m2 m3 BODY m1 m2 m3 BODY ...' — BODY recurs once per wrap; in the harness loop that first BODY break happens at iteration ~3-6…

### [5] HIGH · reproduced — `D-target`
**Off-viewport target with overflow:hidden ancestor clip => null => unsound flag fallback => FALSE PASS**

- **Mechanism:** squareFits only runs when the whole centered 24x24 square is on-screen (line 347: sqMaxY <= innerHeight). The harness uses a fixed 1280x900 viewport and never scrollIntoView()s the element before probing. For a target whose center is below the fold (or within 12px of any viewport edge), squareFits becomes null and evalTargetSize falls back to shapeBlocksSquare = transformed || clipped(clip-path ONLY) || (cornerR>0 && !fits). That flag set does NOT include overflow:hidden clipping on the element or an ancestor. So a target whose bbox (getBoundingClientRect) is 40x40 but whose real painted/click…
- **Observed:** Off-screen element: box {x:40,y:882,w:40,h:40}, squareFits:null, clipped:false, transformed:false, targetSize.verdict:'pass', reason:'meets 24x24 (axis-aligned)'. Independent dense 1px scan of the centered 24x24 square: only 60/625 sample points are on-target (565 off-target, 90%), confirming the real clickable target …
- **Expected (WCAG):** Per WCAG 2.2 SC 2.5.8 Understanding, the target (the region that accepts the pointer) must be at least 24x24 CSS px. A target clipped by an ancestor overflow:hidden to a 14px-wide window has an actual target far below 24px and fails 2.5.8 (no exception applies). The harness should report fail or at minimum needs-judgment, not a definite 'pass'.
- **WCAG basis:** SC 2.5.8 Target Size (Minimum), AA: 'The size of the target for pointer inputs is at least 24 by 24 CSS pixels' — 'target' is the rendered/clickable region, which ancestor overflow clipping reduces be…
- **Repro input:** fixture assets/saved/fx-r24a-D-overflow-1.html: <div class='clip below' style='position:absolute;left:40px;top:882px;width:14px;height:40px;overflow:hidden'><button style='position:absolute;width:40px;height:40px' aria-label='Off-screen clipped'></button></div> (center y=902 > 90…

### [6] MEDIUM · reproduced — `B-behavioral-binding`
**forms-instructions-errors (3.3.1) verdict validated by PAGE-LEVEL 'all forms submitted trusted' — never tied to the field's own form error evidence**

- **Mechanism:** The forms branch of behavioralSupport() (lines 228-232) ignores the per-element ev and the element xpath entirely; it consults only formsTrust={probed, allTrustedIsolated}. driverEvidenceFrom() (lines 217-220) reduces the whole forms array to allTrustedIsolated = forms.every(f=>f.submitMethod==='trusted'). The driver collected rich per-form error evidence (submitBlocked, nativeTextIdentification, errorAnnouncedLive, aria-invalid, validationMessages — drive-page.js lines 716-727) but NONE of it reaches the binding. So a definite forms verdict on ANY field — even one in a form the driver observe…
- **Observed:** build-results.js exit 0; 'wrote out2.json — 1 elements, 0 normative failures, 0 deduped issues (validated).' The forms-instructions-errors NOT REPRODUCED verdict on the search field was written unchanged despite its own form having submitBlocked:false / nativeTextIdentification:false. validateResults().ok===true. Also …
- **Expected (WCAG):** A NOT REPRODUCED for 3.3.1 asserts the field's input error is identified in text. The binding must verify the field's OWN form produced a text error identification (the driver's submitBlocked/nativeTextIdentification/validationMessages for that form), not merely that some/all forms on the page submitted via a trusted click. As written it cannot distinguish a real error-identifying signup form from…
- **WCAG basis:** WCAG 2.2 SC 3.3.1 Error Identification (A): 'If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text.' (also bears on 3.3.2/…
- **Repro input:** Ran the MANDATORY gate: node scripts/tools/build-results.js /tmp/r24a/input2.json out2.json collect2.json drive2.json. Element /html/body/form[1]/input[1] (a searchbox) has skills.forms-instructions-errors={verdict:'NOT REPRODUCED',sc:'3.3.1',level:'A',evidence:'submitting this f…

### [7] MEDIUM · reproduced — `D-target`
**5x5 grid (5-6px spacing) misses off-target bands in the gaps => FALSE PASS even when >50% of the square is off-target**

- **Mechanism:** The probe samples only 25 points at offsets [-11,-6,0,6,11] in x and y. The largest gaps between consecutive sample columns/rows are 5-6px. Any off-target feature narrower than the gap and positioned between sample lines is invisible to the grid. Placing 4px-wide non-target strips precisely centered in the (49,55) and (55,61) gaps (both axes) leaves every one of the 25 grid points on the button while making the majority of the centered 24x24 square off-target. squareFits returns true => definite 'pass'.
- **Observed:** box {x:40,y:40,w:30,h:30}, squareFits:true, targetSize.verdict:'pass', reason:'meets 24x24 — a page-aligned 24x24 square is fully on-target (hit-tested)'. Independent dense 1px scan: 320/625 points off-target (51%), gridAllOn:true, gridOff:[].
- **Expected (WCAG):** A page-aligned 24x24 square centered on the target is NOT fully on the target (51% of it lands on non-target elements), so the harness's own positive-proof criterion is false; squareFits should be false => needs-judgment.
- **WCAG basis:** SC 2.5.8 Target Size (Minimum), AA: the contiguous target region accepting the pointer must be >=24x24 CSS px; a square riddled with off-target bands is not fully on-target. The grid undersamples the …
- **Repro input:** fixture assets/saved/fx-r24a-D-notch-2.html: a 30x30 button at (40,40) (center 55,55) with four non-descendant white strips — vertical at x[50,54] & x[56,60], horizontal at y[50,54] & y[56,60], each 4px wide and inside the 24x24 square. Run: node scripts/eval-page.js --file fx-r2…

### [8] LOW · reproduced — `A-provenance`
**skipped[] entries have NO key-strictness enforcement — arbitrary keys (e.g. forgedVerdict, note, __proto__hint) ride through the mandatory gate into the written results, contradicting the contract's 'reject any unexpected schema key' invariant**

- **Mechanism:** validateProvenance L188-191 checks only s.xpath truthiness, s.reason non-empty, and inventory membership — it never iterates Object.keys(s) against an allowed set, unlike EVERY other nested structure: PROV_COLLECT_KEYS (L180), provenance top (L177), VERDICT_KEYS (L137), ELEMENT_KEYS/SUMMARY_KEYS/ISSUE_KEYS/COUNTBASIS_KEYS/BYSKILL_CELL_KEYS. Because build-results.js copies input.skipped verbatim into provenance.collect.skipped, the agent-supplied extra keys persist in the validated output file.
- **Observed:** wrote ... (validated). exit 0. out.provenance.collect.skipped[0] = {"xpath":"/html/body/a[1]","reason":"out of scope","forgedVerdict":"REPRODUCED","note":{"a":1},"__proto__hint":"x"}. Inline: a skip entry {xpath,reason,verdict,sc,smuggled} also validated ok:true with no error.
- **Expected (WCAG):** Not a direct WCAG-SC violation — the smuggled keys are inert (no aggregation code reads them). But the contract/commit asserts strict rejection of any unexpected schema key throughout the result; skipped[] is the one nested object that violates this, so the strictness guarantee is incomplete and the result file is not byte-canonical/agent-untrusted as claimed.
- **WCAG basis:** No SC — this is a contract-integrity (provenance hardening) gap, not a WCAG-correctness one. Reported because it undercuts the fix's stated 'no smuggled keys' / agent-untrusted-provenance invariant an…
- **Repro input:** node scripts/tools/build-results.js <input> out.json eval-results/Reddit/collect.json eval-results/Reddit/drive.json with input.skipped entries = {xpath, reason:"out of scope", forgedVerdict:"REPRODUCED", note:{a:1}, __proto__hint:"x"}

### [9] LOW · reproduced — `D-target`
**Small interior hole between grid points => FALSE PASS (realistic icon-with-gap case)**

- **Mechanism:** Same undersampling root cause, minimal/realistic form: a single ~4-5px non-target gap (e.g. a split-glyph icon button or an interior non-interactive cutout) placed entirely between adjacent grid sample points is missed by all 25 points. squareFits=true even though the centered 24x24 square overlaps the hole.
- **Observed:** box {x:40,y:40,w:30,h:30}, squareFits:true, verdict:'pass'. Dense 1px scan: 16/625 points off-target (the .hole intercepts hits at x[50,54] y[50,54]), gridAllOn:true, gridOff:[].
- **Expected (WCAG):** The centered 24x24 square contains a non-target region, so it is not fully on-target; per the harness's own criterion squareFits should be false. Whether a few-px interior hole is a hard 2.5.8 failure is borderline, but the harness should not silently emit a DEFINITE pass on a non-rectangular hit area it did not actually verify.
- **WCAG basis:** SC 2.5.8 Target Size (Minimum), AA — target region must accept the pointer across the required area; the probe claims positive proof it does not have.
- **Repro input:** fixture assets/saved/fx-r24a-D-notch-1.html: 30x30 button (center 55,55) with one 4x4 white .hole div at x[50,54], y[50,54] (in the gap between grid cols 49&55 / rows 49&55). Run: node scripts/eval-page.js --file fx-r24a-D-notch-1.html --xpaths /tmp/xp-notch1.json (['/html/body/b…

---
*Generated from the `r24-adversarial-audit` workflow result (refute → independent-verify pipeline).*
