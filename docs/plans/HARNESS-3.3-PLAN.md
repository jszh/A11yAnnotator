# Harness 3.3 - evidence stabilization before the gold-annotation run

**Status:** proposed next course of action after reviewing:

- [docs/analysis/CHECKER-COMPARISON.md](../analysis/CHECKER-COMPARISON.md)
- [docs/audits/HARDCODED-JUDGMENTS-WCAG-AUDIT.md](../audits/HARDCODED-JUDGMENTS-WCAG-AUDIT.md)
- [docs/plans/HARNESS-3.2-PLAN.md](HARNESS-3.2-PLAN.md)
- committed code at `23bc4c9`

## Executive decision

3.3 should be a **stabilization and annotation-readiness release**, not a broad new automation release.
The current v3 architecture is directionally right: deterministic claims remain separate from
non-authoritative PROVISIONAL/annotation evidence, LLM outputs are structured, and the bundle boundary
is much stronger than in earlier rounds. The remaining risk is that a few non-WCAG heuristics still
produce bad evidence in ways that would waste annotation effort or, worse, make an uncalibrated
PROVISIONAL clear look more reliable than it is.

The best course is:

1. Fix the known false-clear / false-barrier deterministic and instrument gaps before a saved-site run.
2. Surface axe's already-integrated decided coverage first — **1.3.5, 1.3.1, 1.4.4, 2.4.4, 3.1.x** — which
   the collector captures (`out.axe`) but the v3 ledger never reconciles. Then add IBM Equal Access as the
   one live non-authoritative checker stage: an LLM triage prior for the uncovered meaning SCs **1.4.1 /
   1.3.3**, plus its decided wins **1.4.12** (text-spacing) and **2.5.3** (label-in-name). Alfa is the
   better *decided-coverage* engine but is deferred — see Workstream C.
3. Add the missing form-submit vision pair so 3.3.1 / 3.3.3 rubrics can actually adjudicate.
4. Make every non-deterministic evidence artifact identity-bound and visibly non-authoritative.
5. Run the saved corpus for **gold annotation input**, not final results: all PARTIAL/PROVISIONAL rows
   plus a stratified sample of deterministic pass/fail rows should go to humans.

## Current state read

### What is strong enough to keep

- The v3 triple keeps `observationOutcome`, `wcagApplicability`, and `conformanceOutcome` separate.
- The builder derives aggregates instead of trusting agent-authored totals.
- LLM rows are capped below authoritative CLAIMs and are labelled as PROVISIONAL / calibrated false in
  ungated mode.
- The LLM rubric lane is now reachable from the CLI and supports atomic rubrics with vision evidence.
- The role/name/identity hardening from 3.2 is in the committed code.

### What is not yet stable enough for a large annotation run

The hardcoded-judgments audit identifies several live issues that are still present or only partly
resolved in HEAD:

- **1.4.3 contrast:** the code records the rendered backdrop mean, but still clears using the CSS-resolved
  contrast ratio after a `<=16` channel agreement check. This can clear a true failure when the rendered
  backdrop differs inside that tolerance.
- **3.3.1 error identification:** red color, English keyword, class-name, and role/live heuristics still
  decide whether an error was identified. This can false-barrier localized conforming errors and
  false-clear color-only or misleading messages.
- **2.1.2 keyboard trap:** two distinct defects. The runner's role-only region selector **false-CLEARS** a
  role-less modal trap (a real false clear, the dangerous direction), while its fixed 12-tab budget
  **over-abstains** — flipping a valid CLEAR to INCONCLUSIVE at ≥13 in-region focusables (a lost clear,
  never a false trap). The stronger `kbd-graph` instrument already has the broader selector and a
  focusable-derived budget.
- **4.1.3 status messages:** the status instrument is non-authoritative, but it still over-flags lazy
  *inserted* primary content and under-covers triggers beyond the first 12 button-like controls. It is also
  **insertion-only** — blind to status revealed by toggling `hidden`/`display` on pre-rendered nodes
  (`addedCount=0`), so an entire class of un-announced status is never evaluated (audit B3).
- **1.3.2 / 2.4.3 order instruments:** the gross-jump threshold is an invented heuristic with recall holes.
- **3.3.2 field labels:** arbitrary nearby sibling text is treated as enough to suppress a barrier, even
  when it may be unrelated. This only **under-reports** a barrier — it can never false-clear (the runner is
  barrier-only and `programmaticNamePresent` stays false); audit §A rates it **LOW severity** /
  non-authoritative follow-up, the least urgent item in this workstream.
- **CLI artifact completeness:** `instruments` exists as an orchestrator stage and builder input, but the
  single-page CLI does not currently expose an instruments switch or write `instruments.json`.
- **axe coverage captured but not surfaced:** axe is integrated and the collector keeps all its WCAG
  violations in `out.axe` ([eval-page.js](../../scripts/eval-page.js#L203-L218)), but the v3 ledger
  pipeline contains **zero `axe` references** — `out.axe` is read only by the legacy agent path as a
  reconciliation gate, never to emit axe-decided verdicts. So axe's already-decided wins (**1.3.5, 1.3.1,
  1.4.4, 2.4.4, 3.1.x**) are free coverage that v3 currently drops. This is the first thing to wire.
- **Checker comparison (post-ACT-pilot):** the scored 432-case ACT pilot overturned the fixture-era read.
  axe (already integrated) owns the decided bulk and **decides 1.3.5 and 1.3.1 perfectly**; **IBM is the
  lowest-recall real engine (0.79) and decides no ACT SC axe doesn't** (its 12 decided SCs ⊆ axe's 17). For
  *added* decided coverage the comparison points to **Alfa**, not IBM. IBM's surviving value narrowed to a
  non-authoritative **1.4.1/1.3.3 triage prior** plus its one outright win **1.4.12** (and 2.5.3, tied with
  Alfa). No external-checker integration exists in committed code.

## 3.3 workstreams

### A. Fix live false-clear and false-barrier sources first

These are accuracy fixes for **non-authoritative lanes** — shadow instruments, barrier-only runners, and
`calibrated:false` PROVISIONAL rows. Per the audit's containment finding (§F), **none of B1–B4 or the §D
trap defect reaches the authoritative ledger**, so none corrupts a published CLAIM. They are
**release-blocking for annotation quality, not for authoritative correctness**: false barriers on conformant
pages would waste human-label effort, and the one false-clear among them (A1 contrast) would seed bad gold
and make an uncalibrated PROVISIONAL clear look more reliable than it is.

| ID | Area | Action | Why | Tests |
|---|---|---|---|---|
| A1 | 1.4.3 contrast | When rendered backdrop pixels are available, compute the contrast ratio against the rendered backdrop mean, not the CSS-resolved `bgColor`. If the rendered/CSS channels disagree, either use the rendered ratio or abstain; do not clear from the CSS ratio. **Residual (audit J.4):** the rendered *mean* still hides a worst-pixel envelope — under `range ≤ 12` a backdrop can average above threshold while its darkest region fails. This fix closes the SVG/canvas mis-resolution but leaves a smaller residual false-clear envelope until per-pixel worst-case eval. | WCAG 1.4.3 is about the actual rendered text/background contrast. A tolerated mismatch cannot support a clear. | Regress the documented white-on-SVG/body-gray false clear; include normal solid, large text, gradient, antialiasing, and mixed-color cases. |
| A2 | 3.3.1 form errors | Stop using red color, English keywords, and class names as deterministic proof that an error is identified. Native validation may still satisfy 3.3.1. A newly surfaced, field-associated visible message should become INCONCLUSIVE unless the association/text evidence is mechanically sufficient; language/meaning goes to LLM/human. | WCAG 3.3.1 requires the error item to be identified in text. Color, class names, and English-only stems are not normative and are not internationalized. | Localized Spanish/German/Japanese conforming messages must not become barriers; color-only field echo must not clear; native validation remains non-barrier; AND a success-worded message that also contains an error keyword on a real error (e.g. "Thank you — please enter a valid email") must not clear (today `ERR_TEXT` wins over the `OK_TEXT && !ERR_TEXT` exclusion — audit B4's second false clear). |
| A3 | 2.1.2 trap region | Share the broader trap-region selector with `kbd-graph` and replace the fixed 12-step runner budget with a budget derived from the in-region focusable count plus safety margin. Preserve Escape/advised-exit handling. | WCAG 2.1.2 is about whether focus can leave a component by keyboard; role-less modal implementations are common. | Role-less `.modal` trap, role dialog trap, APG modal with Escape, 13+ focusable clear case, advised non-standard exit. |
| A4 | 4.1.3 status instrument | Keep status output non-authoritative, but improve it: exclude lazy disclosure/tab primary content, widen safe triggers beyond buttons, and report trigger truncation (`coverageTruncated`, `unprobedTriggers`). | WCAG 4.1.3 covers status messages, not every lazy DOM insertion. Under-covered triggers should not be invisible. | Lazy disclosure/tab insertion should not flag; link/checkbox/tab trigger status cases should be covered or explicitly reported as unprobed; trigger >12 records truncation. |
| A5 | 1.3.2 / 2.4.3 order instruments | Replace the gross-jump rule or quarantine it as uncalibrated. Preferred: adjacent within-column inversion signal plus optional BAGEL-style FuncSet-entry-multiplicity experiment. Do not present absence of a finding as a pass. | WCAG has no `25%` / `12px` threshold for meaningful sequence or focus order. **Caveat (audit J.1/J.2):** the replacement threshold (`delta ≥ 1` vs BAGEL multiplicity) is itself a design choice with no WCAG ground-truth, and the x-overlap "column" model cannot decide cross-column reading order (Z-order/RTL/masonry) from geometry alone — so this stays triage, not pass/fail. | Small-list reversal, adjacent swap, main/sidebar, card grid, CSS-hoisted footer. |
| A6 | 3.3.2 field label | Treat unrelated nearby sibling text as INCONCLUSIVE evidence, not as barrier suppression. Programmatic/visible associated labels remain mechanical; unassociated nearby prose goes to LLM/human. | WCAG 3.3.2 accepts labels or instructions, but deciding whether sibling text labels a field is semantic. **LOWEST severity in A** — barrier-only, can never false-clear; this only recovers a missed barrier (audit §A). | Placeholder-only with submit/marketing sibling should still surface for review; true visible adjacent label should not false-barrier. |

### B. Make evidence artifacts annotation-grade

3.3 should make every annotation input replayable and tied to the same page identity.

- Add an explicit CLI switch/env for instruments, e.g. `V3_INSTRUMENTS=1`, and write `instruments.json`
  when run.
- Include `instruments` in the same cross-artifact identity gate as LLM evidence. It is non-authoritative,
  but humans may label from it, so stale/wrong-page findings are still harmful.
- Add a `runMode` or `evidenceMode` field to `v3-results.summary` that makes `provisionalMode`,
  `runLlm`, `runInstruments`, and external checker use visible without reading logs.
- Preserve current safety: instruments and IBM signals must not create authoritative CLAIMs.

### C. Surface axe's existing coverage first, then add IBM as a narrow cross-signal

The scored ACT pilot reordered this completely. axe (already integrated) is the decided workhorse and
**owns 1.3.5 and 1.3.1 outright**; IBM decides nothing axe doesn't. For *added* decided breadth the
comparison points to **Alfa, not IBM**. So 3.3 does the free thing first, then adds IBM only for the narrow
role it uniquely fills.

**C0. Surface what axe already decides (free win, do this before any external engine).**
axe runs with the full WCAG tag set and the collector keeps every violation in `out.axe`
([eval-page.js](../../scripts/eval-page.js#L203-L218)), but **no v3 module consumes it** — the ledger has
zero `axe` references; only the legacy agent path reads it as a reconciliation gate. Reconcile `out.axe`
into v3 per-SC output for axe's already-decided wins — **1.3.5** (invalid autocomplete, perfect 10/0 on the
ACT suite), **1.3.1** (perfect, 0 FP), **1.4.4**, **2.4.4**, **3.1.x** — as a non-authoritative cross-signal
at the same tier as the other adds. This is decided coverage v3 throws away today; it costs no new engine.

**C1. Add IBM Equal Access as the one live external checker.**
Do not integrate every checker. For decided breadth the comparison prefers Alfa; IBM is added only for the
wins it uniquely contributes to a *triage/annotation-readiness* release: the meaning-SC triage prior axe
and Alfa do not provide, plus one decided SC neither axe-surfacing nor Alfa is being wired for.

- Add a v3 stage such as `checkerFindings.json`.
- Pin `accessibility-checker` and the IBM ruleset version/hash. **IBM does fetch its rulepack from a remote
  CDN at runtime** (`ACEngineManager` → `cdn.jsdelivr.net/.../accessibility-checker-engine`, confirmed in
  the installed engine), so vendor/cache the bundle or emit an explicit `checkerUnavailable` artifact; do
  not let network availability silently change results.
- Normalize IBM exactly as the comparison harness now does:
  - `category === VIOLATION && level === FAIL` => hard finding.
  - `POTENTIAL` / `MANUAL` => review prior only.
- Hard decided supplements (vs *our harness*; axe already owns 1.3.5/1.3.1 — do **not** re-wire those to IBM):
  - **1.4.12 Text Spacing:** the one SC IBM decides outright (J=1.0 on the ACT suite); axe does not decide
    it. This is IBM's only decided-coverage win and the strongest single reason to run it.
  - **2.5.3 Label in Name:** `label_name_visible` hard failures. IBM is **tied with Alfa** here; since Alfa
    is not being wired (C-defer), IBM is the cross-signal. Feed to the 2.5.3 rubric and review queue before
    considering any promotion.
- Triage priors (the role axe/Alfa cannot fill):
  - IBM review flags for **1.4.1** and **1.3.3** — the uncovered *meaning* SCs no tool decides — should be
    attached to LLM/human review packets as targeted suspicion, never as pass/fail. IBM's element-level
    `potential` flag names the suspect element and reason, which is exactly the per-element prior our
    `precomputeSignals` lacks for these families.
  - **Drop 1.3.1 and 2.4.6 from the prior list:** axe decides 1.3.1 cleanly (J=1.0, 0 FP) while IBM adds
    11–13 FP, so an IBM 1.3.1 prior is net noise; and IBM contributes no usable 2.4.6 triage (its surviving
    triage scope is 1.4.1/1.3.3 only).

**C-defer. Alfa is the better decided-coverage engine, deferred — not rejected.** Alfa has the best balanced
ACT accuracy (0.95), MIT license, 0 real-page errors, and no remote fetch, and uniquely decides 2.4.9 /
1.4.6 plus the ○-tier 2.5.3 / 2.5.5 / 2.5.8. It is deferred from 3.3 because (a) 3.3's goal is
triage/annotation-readiness, where IBM's meaning-SC prior is the unique need and Alfa offers none; (b) Alfa's
immutable/`Future`-based TS architecture carries non-trivial integration cost; and (c) the comparison's own
conclusion is that *no new engine is strictly required*. Revisit Alfa when decided-breadth expansion (not
annotation readiness) is the goal. Do not run QualWeb or HTML_CodeSniffer live; harvest QualWeb's rule
catalog only as a coverage-gap reference (1.4.4/1.4.5/1.4.8/2.4.10) for later SC expansion.

### D. Finish the state-pair evidence bridge for forms

The 3.2 plan says 3.3.1 and 3.3.3 abstain because the form-submit state pair is missing. 3.3 should add it.

- Capture `state-before` and `state-after` around a real invalid-submit attempt for constrained fields.
- Include the submitted field, surrounding form, error summary region, referenced description/error nodes,
  focus target, validation message, validity state, and visible text delta.
- Keep the driver isolated per field/form, because invalid submit mutates page state.
- Update `error-identification-v0.md` and `error-suggestion-v0.md` so they treat color/class/English terms
  as weak priors only and explicitly support non-English text when the evidence makes the error clear.

### E. Add targeted LLM-only review lanes for missing semantic SCs, without ledger overreach

3.3 should not pretend to fully enumerate every semantic SC. It should create review candidates where the
input evidence is targeted.

- Add a side artifact, e.g. `triageCandidates.json`, for non-ledger semantic candidates derived from IBM
  review flags or existing instruments.
- Candidate-only in 3.3:
  - **1.4.1 Use of Color**
  - **1.3.3 Sensory Characteristics**
  - instrument adjudication for **1.3.2**, **2.4.3**, and **4.1.3**
- These may be sent to LLM/human review, but should not become obligation-ledger PROVISIONAL rows until
  the project has a sound enumeration/completeness story for each family.

### F. Reduce easy LLM load where deterministic facts are already present

- Add or promote a deterministic target-size runner for **2.5.8** using the existing 24px circle/spacing
  geometry. It may decide geometry failures and geometry passes in the closed sub-domain; exceptions
  (Equivalent, Essential, Inline, User-Agent control, shape assumptions) stay LLM/human.
- For **2.5.3**, add a simple deterministic pre-check when visible text and accessible name are both
  reliable strings: if normalized visible label is not contained in the accessible name, emit a
  non-authoritative hard evidence signal; use IBM as an independent cross-signal.
- Keep **2.5.5** AAA target-size-enhanced in the LLM/human lane unless there is a specific reason to spend
  implementation time on AAA automation before AA annotation readiness.

### G. Gold-annotation run protocol

Once A-D are green, run the saved websites to produce annotation inputs.

Suggested annotation sample:

- Label **all PARTIAL** rows.
- Label **all PROVISIONAL clears**, because false clears are the dangerous direction.
- Label **all hard findings** for 1.3.5 (axe's surfaced autocomplete decision) and 2.5.3 (the wired
  IBM `label_name_visible` checker finding) until their precision is known on this corpus.
- Label a stratified sample of deterministic pass/fail rows, at least 20%, stratified by SC, mechanism,
  page family, and evidence source.
- Oversample known-risk mechanisms from this plan: contrast complex/backdrop, forms, trap, order/status
  instruments, and IBM label/name.
- Report false-clear, false-barrier, abstention, and human-disagreement rates separately. Do not collapse
  them into one accuracy number.

Exit gate for "reasonable for human labeling":

- No known reproduced false clear remains in a deterministic clearable runner.
- Every non-authoritative row exposes source, mechanism, calibration state, evidence refs, and mode.
- The run summary can count authoritative CLAIM, PROVISIONAL, PARTIAL, instrument-only, checker-only, and
  triage-only items separately.
- A small pilot on 5-10 saved pages produces a manageable PARTIAL/PROVISIONAL volume and no obvious
  systematic false-clear class.

## WCAG alignment analysis

This section maps the plan to the relevant WCAG 2.2 success criteria and explains what remains judgmental.

| SC | WCAG nature | 3.3 alignment |
|---|---|---|
| 1.1.1 Non-text Content | Requires equivalent text alternatives; adequacy depends on image purpose/context. | Keep LLM/human for adequacy. Deterministic/axe can find missing names, but not whether the text alternative serves the same purpose. |
| 1.3.1 Info and Relationships | Relationships conveyed visually must be programmatically determinable or available in text. | axe decides 1.3.1 cleanly (J=1.0, 0 FP) — surface axe's finding (C0), **not** IBM's (IBM/QualWeb each add 11–13 FP). Whether a visual relationship is meaningful remains LLM/human. |
| 1.3.2 Meaningful Sequence | Sequence must preserve meaning when order matters. | Current gross-jump heuristic is not normative. 3.3 treats order tools as triage, not pass/fail, unless replaced with a calibrated method. |
| 1.3.3 Sensory Characteristics | Instructions cannot rely only on sensory traits such as shape, color, size, visual location, or sound. | Add candidate review from IBM priors; no ledger claims until enumeration is sound. |
| 1.3.5 Identify Input Purpose | Personal-data input purpose must be programmatically determinable through valid autocomplete tokens. | axe already decides invalid-autocomplete-token failures perfectly (10/0 on the ACT suite) — surface axe's existing output (C0) rather than wiring IBM, which is redundant. Detecting that a field asks for a covered personal-data purpose but lacks the token remains semantic. |
| 1.4.1 Use of Color | Color cannot be the only means of conveying information or prompting a response. | IBM color priors and screenshots can narrow candidates; LLM/human determines whether color is sole means. |
| 1.4.3 Contrast Minimum | Numeric contrast thresholds are fixed, but only when the foreground/background pair is actually known. | 3.3 fixes the rendered-backdrop mis-resolution false clear, but a residual worst-pixel false-clear envelope remains under `range ≤ 12` (audit J.4) since the ratio uses the rendered *mean*, not the darkest pixel. LLM may only judge perceptual readability over complex cases; it must not invent ratios. |
| 1.4.10 Reflow | Content must reflow at 320 CSS px width / 256 CSS px height except for content requiring two-dimensional layout. | Existing barrier-only runner remains appropriate; exceptions and non-barrier residues are semantic review. |
| 1.4.13 Content on Hover or Focus | Additional hover/focus content must be dismissible, hoverable, and persistent, with exceptions. | Runner can catch some barriers; LLM/human still judges exception semantics and visual state evidence. |
| 2.1.1 Keyboard | All functionality must be keyboard-operable, except path-dependent input. | Deterministic probes can find failures on sampled controls; proving all functionality is keyboard-operable remains open-scope. |
| 2.1.2 No Keyboard Trap | Keyboard focus must be escapable; non-standard exit is allowed if advised. | 3.3 region/budget fix aligns measurement to the SC and reduces false clears. |
| 2.4.2 Page Titled | Page title must describe topic or purpose. | Existence is mechanical; descriptiveness remains LLM/human. |
| 2.4.3 Focus Order | Focus order must preserve meaning and operability. | Keep order findings as review until the heuristic has a justified, calibrated method. |
| 2.4.4 Link Purpose | Link purpose must be determinable from link text or context. | LLM/human remains necessary for ambiguous context and generic link text. |
| 2.4.6 Headings and Labels | Headings/labels must describe topic or purpose. | Descriptiveness is semantic and remains LLM/human; IBM is **not** a credited triage prior for 2.4.6 (its surviving triage scope is 1.4.1/1.3.3 only). |
| 2.4.7 Focus Visible | Keyboard focus indicator must be visible. | Deterministic real-focus pixels are primary. LLM/human only for ambiguous visual adequacy residues. |
| 2.4.11 Focus Not Obscured (Minimum) | Focus indicator must not be entirely hidden by author-created content. | Barrier-only runner is directionally right; visual ambiguity and author/content causation can still need review. |
| 2.4.13 Focus Appearance | Area/thickness/contrast requirements are numeric but hard to measure robustly. | Keep as proxy/review unless a dedicated geometry/contrast implementation is built and calibrated. |
| 2.5.3 Label in Name | Visible label text must be included in accessible name for label-bearing UI components. | Add IBM `label_name_visible` (Alfa decides it equally if ever added) plus simple string evidence; LLM/human remains for OCR/ambiguous visible labels and name purpose. |
| 2.5.5 Target Size (Enhanced) | AAA 44x44 target size with exceptions. | Low priority for 3.3; retain LLM/human unless AAA automation is needed. |
| 2.5.8 Target Size (Minimum) | AA 24px target or sufficient spacing, with exceptions. | Deterministic geometry can reduce LLM load; exceptions remain LLM/human. |
| 3.3.1 Error Identification | If an input error is automatically detected, the item in error is identified and described in text. | 3.3 removes color/English/class as deterministic proof and adds form-submit vision for semantic adjudication. |
| 3.3.2 Labels or Instructions | Labels/instructions must be provided when content requires user input. | Mechanical labels are deterministic; deciding whether nearby text is an instruction remains LLM/human. |
| 3.3.3 Error Suggestion | If suggestions are known and security/purpose allow, suggestions are provided. | Needs form-submit state pair plus semantic LLM/human judgment. |
| 4.1.2 Name, Role, Value | UI components must expose name/role/value and state changes. | Deterministic AX/name/state diff remains appropriate; semantic name adequacy belongs to other SCs. |
| 4.1.3 Status Messages | Status messages must be programmatically determinable without receiving focus. | Instrument should detect likely unannounced status messages, but status-vs-primary-content remains review. |

## LLM/human responsibility before and after 3.3

| Area / SC | Current v3.2 state | Currently needs LLM/human? | 3.3 change | After 3.3 needs LLM/human? |
|---|---|---:|---|---:|
| 1.1.1 Non-text content | Atomic alt adequacy rubric; deterministic tools find missing names but not adequacy. | Yes | No major change. | Yes, for adequacy/purpose. |
| 1.3.1 Info and relationships | Page-level LLM rubric; axe decides 1.3.1 (J=1.0, 0 FP) but its output is not yet surfaced into v3. | Yes | Surface axe's existing 1.3.1 decision (C0); do **not** attach IBM priors (adds ~11 FP). | Yes for meaningfulness, with axe-decided structure surfaced. |
| 1.3.2 Meaningful sequence | Instrument-only; gross-jump heuristic has recall holes. | Yes/human review of instrument findings | Fix or quarantine order heuristic; keep as triage-only. | Yes, unless a calibrated order method is later promoted. |
| 1.3.3 Sensory characteristics | Not meaningfully covered in v3 ledger. | Yes, if reviewed manually | Add IBM-derived triage candidates and rubric/review packets, not ledger rows. | Yes, but candidates are easier to find. |
| 1.3.5 Identify input purpose | Not surfaced from v3 output, though axe already decides invalid-autocomplete tokens perfectly (10/0). | Yes for field purpose | Surface axe's existing 1.3.5 decision (C0); do not wire IBM (withdrawn — redundant). | Partly: axe handles invalid tokens; LLM/human still decides personal-data purpose/required token absence. |
| 1.4.1 Use of color | Not meaningfully covered in v3 ledger. | Yes, if reviewed manually | Add IBM-derived triage candidates and visual packets. | Yes, but candidates are easier to find. |
| 1.4.3 Contrast minimum | Deterministic for computable flat cases; LLM rubric for complex backdrops; live false-clear risk. | Sometimes | Fix rendered-backdrop ratio. | Less often; LLM only for complex/non-computable visual readability. |
| 1.4.10 Reflow | Barrier-only runner; LLM rubric for residues/exceptions. | Yes for exceptions and clears | No major change. | Yes, same scope. |
| 1.4.13 Hover/focus content | Barrier-only runner; LLM rubric over before/after screenshots. | Yes | No major change. | Yes, especially exceptions/persistence ambiguity. |
| 2.1.1 Keyboard | Deterministic probes can prove sampled failures; clear withdrawn/open-scope. | Yes/human for whole-functionality claims | No broad 3.3 expansion. | Yes for complete keyboard operability beyond sampled failures. |
| 2.1.2 No keyboard trap | Deterministic runner can decide sub-domain but region/budget gap remains. | Rarely | Fix region selector and dynamic budget. | Usually no for covered components; unusual advised exits may still need review. |
| 2.4.2 Page titled | LLM rubric judges descriptiveness. | Yes | No major change. | Yes. |
| 2.4.3 Focus order | Instrument-only; gross-jump heuristic. | Yes/human review of findings | Fix/quarantine order heuristic. | Yes, unless later calibrated. |
| 2.4.4 Link purpose | LLM rubric. | Yes | No major change. | Yes. |
| 2.4.6 Headings and labels | LLM rubric. | Yes | No IBM prior (2.4.6 is outside IBM's surviving 1.4.1/1.3.3 triage scope). | Yes; descriptiveness remains LLM/human. |
| 2.4.7 Focus visible | Deterministic focus pixels plus LLM rubric for ambiguous clears. | Sometimes | No major change. | Sometimes, for ambiguous visual adequacy. |
| 2.4.11 Focus not obscured | Barrier-only runner plus LLM rubric. | Yes for clears/ambiguous overlays | No major change. | Yes for non-barrier residues and ambiguity. |
| 2.4.13 Focus appearance | Proxy/review only. | Yes/human if in scope | No promotion in 3.3. | Yes. |
| 2.5.3 Label in name | LLM rubric only for many cases. | Yes | Add IBM `label_name_visible` hard evidence (Alfa-equivalent if Alfa is ever added) and simple string evidence. | Less often; LLM/human for ambiguous visible labels/OCR/name context. |
| 2.5.5 Target size enhanced | LLM rubric for AAA target size. | Yes | Keep low priority. | Yes. |
| 2.5.8 Target size minimum | LLM rubric over measured geometry/exceptions. | Yes | Add deterministic 24px/spacing geometry runner for closed sub-domain. | Less often; LLM/human for exceptions and non-rect/semantic cases. |
| 3.3.1 Error identification | Barrier-only runner has language/color/class heuristic risks; rubric abstains without form-submit vision. | Yes, but currently underfed | Fix deterministic error surface and add form-submit state pair. | Yes for semantics/text identification, now with usable evidence. |
| 3.3.2 Labels or instructions | Deterministic field-label probe plus LLM rubric; nearby-text issue. | Sometimes | Treat unrelated nearby text as inconclusive. | More honest: LLM/human for nearby/unassociated instructions. |
| 3.3.3 Error suggestion | Rubric exists but form-submit state pair missing. | Yes, but currently underfed | Add form-submit state pair. | Yes, with usable evidence. |
| 4.1.2 Name, role, value | Deterministic AX/name/state checks. | Usually no | No major change. | Usually no, except semantic name adequacy under other SCs. |
| 4.1.3 Status messages | Non-authoritative status instrument, no semantic status-vs-content adjudication. | Yes/human review of findings | Improve trigger coverage/exclusions and expose truncation. | Yes, but with cleaner triage. |

## Implementation order

0. **C0 (axe surfacing — free win first):** reconcile `out.axe` into v3 per-SC output for axe's
   already-decided wins (1.3.5, 1.3.1, 1.4.4, 2.4.4, 3.1.x) before integrating any external engine.
1. **A1-A3:** fix the reproduced shadow/barrier-only runner inaccuracies (a non-authoritative false-clear
   in 1.4.3, false barriers in 3.3.1, a role-less-trap false-clear plus an over-abstention budget in
   2.1.2). None is an authoritative-verdict bug; all are annotation-quality fixes.
2. **B:** make instruments/checkers identity-bound and CLI-visible.
3. **D:** add form-submit vision state pairs.
4. **C1:** wire IBM as a pinned non-authoritative checker stage — 1.4.12 + 2.5.3 hard evidence and the
   1.4.1/1.3.3 triage prior only (not 1.3.5/1.3.1, which C0 surfaces from axe).
5. **A4-A6 + E:** clean instruments and add triage-only semantic candidates.
6. **F:** reduce LLM load for 2.5.8 and 2.5.3.
7. Pilot saved-site run, inspect volumes and manual-label burden, then run the full saved corpus.

The guiding rule is simple: **anything that can definitely clear a barrier must rest on positive,
SC-specific evidence; absence of contradiction is not enough.** When the evidence is targeted but not
complete, emit a reviewable packet instead of a verdict.
