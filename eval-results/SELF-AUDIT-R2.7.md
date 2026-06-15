# Self-Audit — Round 2.7 (adversarial workflow `r27-adversarial-audit`)

Date: 2026-06-14

**What this is.** After shipping the R2.7 harness fixes I ran a background Workflow that
spawned one adversarial agent per fix to *refute* it with **code-executed** counterexamples,
then an **independent verifier** re-ran each claim. Only findings that survived both layers
(`isReal && reproduced && severity ≠ not-a-bug`) are listed below. This is my OWN self-audit —
distinct from the external reviewer's `ROUND2*-INDEPENDENT-VERIFICATION.md`.

**Audited:** the R2.7 fixes (R2.6 self-audit remediation), HEAD 1a0a856..c0f3f34

**Disposition:** ALL fixed in R2.8 (subsumed by the external R27 audit + my findings).

## Summary — 5 confirmed (4 high, 1 medium)

| Fix surface | Confirmed gaps |
|---|---:|
| A-binding | 2 |
| B-axe-floor | 1 |
| C-runid-fresh | 1 |
| D-trap | 2 |

## Findings

### [1] HIGH · reproduced — `A-binding`
**display:none aria-live region registers as liveRegionChanged:true (and VSR 'assertive:'), accepting a NOT REPRODUCED 4.1.3 on an imperceptible status**

- **Mechanism:** The same liveText snapshot uses querySelectorAll + textContent, which read CSS-hidden nodes. A display:none aria-live/role=status region is removed from the accessibility tree (AT cannot perceive it), but its textContent change still flips liveText so activate.liveRegionChanged:true (and the bundled VSR even produces 'assertive:'). This is independent of the ancestor-inheritance path: the element's own aria-live is non-'off' so the R2.7-A filter does nothing, and the change is captured despite being invisible to AT. behavioralSupport's 4.1.3 silent-status guard requires !liveRegionChanged, so …
- **Observed:** Driver activate: liveRegionChanged:true, vsrAnnouncement:'assertive: Error saved ...', viewChanged:true. behavioralSupport(...) => {ok:true}. build-results.js: 'wrote /tmp/r27a3/results.json — 1 elements, 0 normative failures, 0 deduped issues (validated).' EXIT 0; results.json records dynamic-announcement NOT REPRODUC…
- **Expected (WCAG):** SC 4.1.3 requires the status message be presentable to AT without focus. display:none content is not in the accessibility tree, so the status is NOT presented and 4.1.3 FAILS. The harness should reject NOT REPRODUCED here.
- **WCAG basis:** WCAG 2.1 SC 4.1.3 Status Messages; content with display:none is excluded from the accessibility tree (not perceivable by assistive technology).
- **Repro input:** Fixture: <style>.gone{display:none}</style> ... <div id=statusRegion class=gone aria-live="assertive" role=status></div> + button onclick sets statusRegion.textContent and appends a view marker. xpaths=["/html/body/main/button"], run-id R27A3.

### [2] HIGH · reproduced — `B-axe-floor`
**Omitting collect.axeRan defeats the fail-closed axe skip-floor (absence treated as ran:true)**

- **Mechanism:** build-results.js:87 computes `collectorAxe.ran = collect.axeRan !== false`. When collect.json has no axeRan field (legacy collector predating R2.7-B, or any agent-supplied collect.json), `undefined !== false` evaluates to true, so ran:true. With axe[] also absent, axeArr=[] and wcagViolations:0. In result-builder.js validateResults (lines 352-357) the floor only fires when `wcagViolations > 0` OR `ran === false`; both are false, so the floor never fires even though axe genuinely never ran. The audit is therefore allowed to SKIP collected elements with zero independent ground truth that the ski…
- **Observed:** Exit 0: `wrote out.json — 3 elements, 0 normative failures, 0 deduped issues (validated).` The audit was ACCEPTED with 1 of 4 collected elements skipped and no axe ground truth. CONTROL: adding explicit axeRan:false to the same collect.json yields exit 1 — `provenance/axe: the collector's axe run did NOT complete, so a…
- **Expected (WCAG):** Per the harness's own stated R2.7-B intent (result-builder.js comment lines 346-350: 'absence of axe is not evidence of conformance ... Fail-closed'), and per WCAG-EM 5.4 (Step 4: Audit the Selected Sample) which requires every selected sample element to be checked, a skip permitted only because axe 'didn't object' must be backed by positive proof axe actually ran. WCAG conformance (Conformance Re…
- **WCAG basis:** WCAG 2.2 Conformance Requirement 1 (Conformance Level — all content conforms); WCAG-EM 1.0 Step 4 (audit every element of the selected sample); and the harness's own R2.7-B fail-closed specification (…
- **Repro input:** records.json: file 'fx-axe-test.html', 3 evaluated button elements (all-N/A skills + evidence), valid pageSkills, and skipped:[{xpath:'/html/body/button[4]', reason:'could not be evaluated within scope this run'}]. collect.json: {file:'fx-axe-test.html', runId:'RAXE1', collectedA…

### [3] HIGH · reproduced — `C-runid-fresh`
**R2.7-C drive-freshness check is fail-OPEN: deleting drive.drivenAt lets a stale drive (reused runId) authorize a now-wrong behavioral verdict**

- **Mechanism:** build-results.js line 63 guards the freshness comparison with `typeof collect.collectedAt==='number' && typeof drive.drivenAt==='number'`. The run-identity check (line 56) only requires matching runIds. So a stale drive.json whose runId is reused but whose `drivenAt` field is deleted skips the freshness gate entirely (the AND short-circuits false) and is accepted. The stale drive's behavioral evidence (e.g. focusIndicator.present:true) then satisfies behavioralSupport() and authorizes a definite verdict that no longer reflects the current page.
- **Observed:** exit 0, wrote out.json. out.elements[0].skills['focus-visibility'] = {verdict:'NOT REPRODUCED', sc:'2.4.7', level:'AA', ...}, anyIssue:false, summary.normativeFailures:0. The identical stale drive WITH its real drivenAt present is correctly REFUSED ('stale drive — drive.drivenAt (...) is BEFORE collect.collectedAt (...…
- **Expected (WCAG):** SC 2.4.7 Focus Visible (Level AA): any keyboard-operable user interface has a mode where the focus indicator is visible. The harness purpose-built R2.7-C to stop a STALE drive from clearing a now-failing behavioral SC. If the live page regressed (focus ring removed), the correct result is a 2.4.7 failure (or at minimum PARTIAL, since no FRESH trusted driver evidence supports a definite NOT REPRODU…
- **WCAG basis:** WCAG 2.2 Understanding SC 2.4.7 Focus Visible (AA); harness contract R2.6-C/R2.7-C (drive must be from the same run AND have run after the collect) and R2.4-B (definite behavioral verdicts bound to fr…
- **Repro input:** records.json: file=page.html, one element /html/body/button[1] with focus-visibility {verdict:'NOT REPRODUCED', sc:'2.4.7', level:'AA', evidence:'focus ring clearly visible when tabbed to'}. collect.json: {file:'page.html', runId:'RUN-1', collectedAt: NOW, axeRan:true, axe:[], el…

### [4] HIGH · reproduced — `D-trap`
**Ever-fresh keyboard trap that does NOT preventDefault and adds exactly one focusin per Tab is silently passed (false negative)**

- **Mechanism:** The post-loop MAXTAB branch (drive-page.js:429) only flags non-convergence as trapIndeterminate when an interference signal fires: prevented>0, defocus>=2, or (focusins-tabs) > max(2, tabs*0.25). An ever-fresh trap that lets native Tab advance (no e.preventDefault), never mutates tabindex/disabled/inert/aria-hidden (defocus=0), and produces exactly one focusin per landing (focusins==tabs => excess refocus=0) trips NONE of these. Because focus never revisits an element, the in-loop stuck-detector (stopsSinceNew>=NO_NEW=8) also never runs, so there is no in-loop verdict. The walk truncates at MA…
- **Observed:** tabWalk.trapDetected=false, trapIndeterminate=undefined, count=120, totalFocusables=1, escapableComponent=undefined, and all 120 stops are UNIQUE xpaths (button[1]..button[120]) — focus advanced to a brand-new element on every Tab and never converged or escaped, yet the page is reported as not a keyboard trap.
- **Expected (WCAG):** WCAG 2.1.2 (No Keyboard Trap): once focus enters a component it must be possible to move focus away using a keyboard interface. Focus that can only ever advance to endlessly-regenerated new focusables and never reaches anything outside the chain cannot be moved away => the walk cannot assess keyboard/focus and must be trapIndeterminate (the explicit R2.6-D intent, restated in the R2.7-D commit: 'a…
- **WCAG basis:** WCAG 2.1.2 No Keyboard Trap (Level A) — Understanding: content must not trap keyboard focus such that the user cannot move away using standard keyboard methods.
- **Repro input:** fx-r27a-D-everfresh-1.html: <div id=host><button id=start>start</button></div> + script: document.addEventListener('focusin',function(e){var cur=e.target;if(cur.tagName!=='BUTTON')return;n++;if(n>400)return;var b=document.createElement('button');b.textContent='gen'+n;cur.parentNo…

### [5] MEDIUM · reproduced — `D-trap`
**Clean long navigation (130 links) that disables two unrelated buttons on first focus is falsely reported as a non-converging keyboard trap (false positive)**

- **Mechanism:** The same MAXTAB gate (drive-page.js:429) treats fin.defocus>=2 as proof of interference. The driver's MutationObserver increments defocus for ANY tabindex='-1'/disabled/inert/aria-hidden attribute mutation anywhere in the subtree during the walk — it does not require the mutation to confine the focused cycle. A legitimate long nav (>MAXTAB sequentially tabbable links, no preventDefault, no programmatic refocus, focus advances forward and is never trapped) that incidentally disables two off-nav menu buttons (a normal progressive-UI pattern: sold-out/premium/unavailable items) produces defocus=2…
- **Observed:** tabWalk.trapDetected=null, trapIndeterminate=true, count=120, totalFocusables=132, trapReason='tab-walk did not converge AND the page interfered with Tab (kept advancing under preventDefault/refocus) — keyboard/focus indeterminate'. The reason text is itself false: instrumentation showed prevented=0 and focusins==tabs=…
- **Expected (WCAG):** WCAG 2.1.2 (No Keyboard Trap): focus that moves freely forward through a navigation and is never confined does NOT fail 2.1.2. A conformant long nav must not be degraded to an indeterminate/PARTIAL keyboard verdict merely because two unrelated controls were disabled during the walk; the 'page interfered with Tab' assertion is unsupported (no preventDefault, no refocus occurred). This is the exact …
- **WCAG basis:** WCAG 2.1.2 No Keyboard Trap (Level A) — focus that can be moved away by standard Tab is conformant; a long page the walk merely truncated is not a trap.
- **Repro input:** fx-r27a-D-longnav-defocus-6.html: <nav> with 130 <a href=#l0..l129> links + two off-nav <button id=m1>/<button id=m2> + script (real newlines, no // line comments): document.addEventListener('focusin',function(e){if(done)return;done=true;document.getElementById('m1').setAttribute…

---
*Generated from the `r27-adversarial-audit` workflow result (refute → independent-verify pipeline).*
