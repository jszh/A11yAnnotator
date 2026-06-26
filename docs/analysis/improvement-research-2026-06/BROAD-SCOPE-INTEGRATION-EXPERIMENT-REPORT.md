# Broad-Scope Integration Experiment Report

Date: 2026-06-21

This report continues the broad-scope work after the first prototype report. The earlier pass was too detached:
it did not integrate with the v3 builder/orchestrator, did not visually inspect evidence agreement, and had too few
fixtures. This pass moves the work into the actual harness path and starts the larger fixture program.

## What Changed In The Harness

Integrated sidecar path:

- `scripts/v3/lib/broad-scope-probes.js`
  - Adds `runBroadScopeForUrl(url, { browser, file, runId, pageDigest })`.
  - Runs scope inventory, text spacing, resize text, reduced motion, forced colors, non-interference,
    interaction, media inventory, authentication/redundant-entry, and cognitive research probes.
  - Uses fresh pages for mutating probes so text-spacing/reduced-motion/forced-colors/resize do not contaminate
    one another.
  - Adds dynamic sidecar measurements for previously weak lanes:
    - `probeAudioAutoplay`: distinguishes unmuted autoplay-without-controls risk from muted/controlled media, and
      emits `1.4.2` evidence only when known non-silent generated media advances across a >3s sampling window with
      no native or plausible custom independent control. Arbitrary saved-site autoplay remains review/uncertain
      unless future instrumentation proves audibility and control absence.
    - `probeFlashTemporal`: samples animation state over time and also marks fast infinite flash-like CSS as
      review-risk evidence when samples do not prove threshold.
    - `probeContextChanges`: drives focus/input targets and records URL/title/content state deltas.
    - `probePointerActivation`: drives pointerdown/move-away/pointerup and records down-event state changes for
      pointer-cancellation review.
- `scripts/v3/lib/orchestrator.js`
  - Adds opt-in `runBroadScope`.
  - Attaches `bundle.broadScope` with run identity.
- `scripts/v3/lib/schemas.js`, `scripts/v3/lib/cross-artifact.js`, `scripts/v3/lib/bundle-loader.js`
  - Allows and identity-binds the `broadScope` artifact.
- `scripts/v3/lib/build-v3.js`
  - Surfaces `broadScopeFindings`, `broadScopeWarnings`, and `broadScopeVisualChecks`.
  - Surfaces a sanitized `broadScopeReviewPackets` index and summary count. The full packet stays in the
    evidence bundle for LLM review; strict result output carries only ids/aspect/sc/family/target/mode/refs.
  - Folds broad-scope findings into `triageCandidates`.
  - Does not alter the obligation ledger or authoritative claim counts.
- `scripts/v3/lib/broad-scope-llm-review.js`
  - Adds a strict judge + adversarial critic procedure for broad-scope evidence packets.
  - Adds `buildReviewPacketsFromBroadScope`, which turns broad-scope findings into bounded LLM packets with:
    standard anchor, aspect, SC, registered claim family when one exists, target, required evidence, critic
    questions, evidence references, visual agreement flag, scope warnings, and fail-closed limitations.
  - Adds process/site-set packet builders. Positive manifest warnings become scope packets; clean process/site-set
    controls produce no fabricated "clear" packet. The current process analyzer tracks required-vs-measured steps,
    per-step result gaps/failures, duplicate/missing targets, process-boundary completeness, and redundant-entry
    exception facts. The current site-set analyzer compares page titles by purpose, repeated navigation order and
    destinations, help mechanisms, component identification, and same-name link purpose within a declared same-state
    / same-breakpoint context.
  - Adds `reviewToJudgment` / `buildJudgmentsArtifact` to convert only registered v3 SC/family/target barrier
    packets into the existing `judgments.json` lane. The family must exist in the applicability oracle and match the
    SC, and the packet must carry machine-readable `observed.evidenceClaims` satisfying the packet's
    `requiredEvidence`. Broad-scope `LIKELY_OK` / clear-side reviews remain sidecar rationale; there is no
    clear-lifting escape hatch in no-human operation.
  - Unknown/non-v3 requirements such as EN-only user-preference items, process/site-set findings, or packets
    missing a concrete target remain sidecar-only.

This preserves the v3 safety rule: broad-scope signals are evidence/review packets, not conformance outcomes.
When a broad-scope LLM barrier review is mapped into `judgments.json`, it is still an LLM shadow observation and, at
most, an ungated/gated PROVISIONAL barrier fill of an independently enumerated obligation. It never becomes an
authoritative claim, broad-scope clears do not clear obligations, and barrier conversion requires structural evidence
tokens rather than LLM assertion alone.

## Independent Critic Fixture Matrices

Saved machine-readable fixture design artifacts:

- `evidence/broad-scope-fixture-matrix/adaptation-matrix.json`
- `evidence/broad-scope-fixture-matrix/non-interference-interaction-matrix.json`
- `evidence/broad-scope-fixture-matrix/media-process-auth-matrix.json`

Coverage:

- 23 aspects.
- Each aspect has 10 positive/barrier cases and 10 negative/control cases.
- Total designed cases: 460.

The critic agents explicitly classified which aspects can be deterministic, hybrid, or LLM-first, and warned
against clearing from absence.

## Generated Fixtures So Far

Generated runnable fixture corpora:

- Generator: `scripts/v3/tests/manual/generate-broad-scope-adaptation-fixtures.js`
- Validator: `scripts/v3/tests/manual/validate-broad-scope-adaptation-fixtures.js`
- Generator: `scripts/v3/tests/manual/generate-broad-scope-ni-interaction-fixtures.js`
- Validator: `scripts/v3/tests/manual/validate-broad-scope-ni-interaction-fixtures.js`
- Generator: `scripts/v3/tests/manual/generate-broad-scope-media-process-auth-fixtures.js`
- Validator: `scripts/v3/tests/manual/validate-broad-scope-media-process-auth-fixtures.js`

Validated aspects:

| Aspect | Positive | Negative | Total | Validation |
|---|---:|---:|---:|---|
| text-spacing | 10 | 10 | 20 | 20/20 |
| forced-colors | 10 | 10 | 20 | 20/20 |
| forced-colors-nontext | 10 | 10 | 20 | 20/20 measured non-text boundary loss |
| reduced-motion | 10 | 10 | 20 | 20/20 |
| resize-text | 10 | 10 | 20 | 20/20 |
| audio-control | 10 | 10 | 20 | 20/20 |
| pause-stop-hide | 10 | 10 | 20 | 20/20 |
| flash-risk | 10 | 10 | 20 | 20/20 |
| keyboard-trap | 10 | 10 | 20 | 20/20 trusted focus-retention probe |
| context-change | 10 | 10 | 20 | 20/20 |
| pointer-operation | 10 | 10 | 20 | 20/20 |
| pointer-gesture | 10 | 10 | 20 | 20/20 trusted path-gesture/click/alternative probe |
| character-shortcuts | 10 | 10 | 20 | 20/20 trusted single-character probe |
| status-announcement | 10 | 10 | 20 | 20/20 trusted status-message probe with live/focus/dialog/direct-announcement guards |
| label-in-name | 10 | 10 | 20 | 20/20 visible-label/name containment probe |
| target-size-minimum | 10 | 10 | 20 | 20/20 target-size geometry probe |
| dragging-movement | 10 | 10 | 20 | 20/20 trusted drag/click/alternative probe |
| media-alternatives | 10 | 10 | 20 | 20/20 SC-scoped 1.2.x content-model/alternative adequacy evidence |
| complete-process | 10 | 10 | 20 | 20/20 |
| site-set-consistency | 10 | 10 | 20 | 20/20 |
| redundant-entry | 10 | 10 | 20 | 20/20 |
| accessible-authentication | 10 | 10 | 20 | 20/20 review-packet semantics |
| language-readability-cognitive | 10 | 10 | 20 | 20/20 review-packet semantics |

Generated fixture total:

- 460 designed cases.
- 460 generated rows.
- 460 passed the appropriate evidence/fixture validator.

Validation output:

- `scripts/v3/tests/generated/broad-scope/adaptation/validation.json`
- `scripts/v3/tests/generated/broad-scope/non-interference-interaction/validation.json`
- `scripts/v3/tests/generated/broad-scope/media-process-auth/validation.json`

Important iteration:

- First text-spacing positive template failed 10/10 because it was too roomy under spacing. The generator was
  tightened to a visually verified before-clean/after-clipped case.
- The forced-colors lane was split into text loss and non-text boundary/state loss. The new
  `forced-colors-nontext` generated cases use focusable icon buttons whose boundary/icon contrast is measurable:
  positives drop from >= 3:1 boundary contrast to 1:1 under forced-colors emulation, while system-color negatives
  remain visible.
- Authentication and cognitive negative controls initially failed because they still produce legitimate review
  packets. The validator now treats those as LLM-first lanes: negative/control means the LLM should clear or apply an
  exception, not that the sidecar should be silent.
- Dynamic-probe iteration caught two important measurement pitfalls:
  - Still-frame flash sampling is too weak for general `2.3.1`. The generated lane now validates opacity,
    background-luminance, and red-state temporal transitions with sampled rate plus generated area/red-threshold
    evidence, but arbitrary canvas/video/occlusion cases still require rendered-frame sampling and fuller threshold
    math for a definite judgment.
  - `location.hash` did not mutate under the data-URL test harness, so context-change testing now uses observable
    title/content deltas in unit tests and records state deltas rather than relying on one URL mechanism.
  - Dragging-movement alternatives cannot be treated as global page-level clears on multi-target pages. The
    `2.5.7` probe now accepts unscoped `data-v3-drag-alternative` controls only when there is a single drag target;
    multi-target pages require `data-v3-drag-alternative-for` to identify the target whose dragging functionality
    the simple-pointer alternative covers.
  - Adversarial multi-target testing caught a target attribution bug: early `probeDraggingMovements()` traces read
    `#target[data-state]` even when probing a different drag target. The probe now reads `targetState` for the
    current target selector, and the regression test includes a wrong-alternative case to ensure unrelated target
    changes do not suppress a barrier candidate.
  - Alternative/click suppression is no longer based on "any state changed." A simple click or marked alternative
    suppresses a `2.5.7` candidate only when it reaches the same observed target state as the drag operation, with
    marker fallback only when no target state is available.

## Visual Evidence Inspection

Visual capture script:

- `scripts/v3/tests/manual/capture-broad-scope-visuals.js`
- `scripts/v3/tests/manual/capture-broad-scope-ni-visuals.js`

Visual artifacts:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/`

Representative visual inspections performed:

| Fixture | Before/after observation | Visual conclusion |
|---|---|---|
| `ts-p1` | before reads “Spacing sensitive”; after spacing shows truncated “Spacing sensiti” | geometry and pixels agree: positive text loss |
| `ts-n1` | after spacing remains readable and wraps | negative control agrees |
| `zr-p1` | after resize visibly clips “Resize sensitive…” | geometry and pixels agree: positive resize loss |
| `zr-n1` | after resize wraps and remains readable | negative control agrees |
| `fc-p1` | before is readable black-on-white; forced-colors crop becomes a gray-on-gray block | geometry, computed contrast, and pixels agree: positive forced-colors text/affordance loss |
| `fc-n1` | system-color button remains readable under forced colors | negative control agrees |
| `fcn-p1` | before shows a bordered icon button; forced-colors crop becomes a gray rounded block with the icon and boundary gone | computed non-text boundary contrast and pixels agree: positive forced-colors non-text affordance loss |
| `fcn-n1` | system-color icon button remains visible as white boundary/icon on black under forced colors | negative control agrees |
| `rm-p1` | reduced-motion crop appears transformed compared with before | still screenshots suggest motion state but do not prove persistence, duration, or missing controls |
| `rm-n1` | reduced-motion crop is static/readable after the media-query override | negative control agrees: motion stops under the user preference |
| `rm-n5` | after the pause control is exercised, the target freezes in a transformed state | screenshot is contextual; trusted click/state evidence proves a working pause control affected the motion |
| `rm-n8` | essential security-progress text remains animated under reduced motion | screenshot is contextual; semantic exception facts are load-bearing |

The visual evidence supports the current sidecar signals for these generated adaptation fixtures.

Representative non-adaptation visual/state inspections performed:

| Fixture | Observation | Integration conclusion |
|---|---|---|
| `audio-p1` / `audio-n1` / `audio-n2` | positive and muted negative are visually invisible; controlled negative shows native audio controls; manifest records autoplay, muted/controls, loop, duration, and currentTime before/after >3s | screenshots are context only; measured state proves generated non-silent autoplay for `audio-p1`, while muted/native-control negatives remain clean |
| `motion-p1` / `motion-n1` | still screenshots are subtle; manifest shows positive transform changes with infinite 8s animation, no working pause/stop/hide control, and an explicit parallel/non-essential marker; negative is a finite 2s pulse | temporal DOM/style evidence is required; still crops alone are weak |
| `flash-p1` / `flash-p5` / `flash-p8` / controls | still crops often look similar; validation records opacity, background-luminance, red-state, rate, area, and red-threshold facts | `2.3.1` cannot be judged from still screenshots; fixture-scoped temporal samples are useful, but arbitrary pages need rendered-frame sampling plus full threshold math |
| `context-p1` / `context-p2` / `context-n1` | screenshots show the driven input/change state; manifest shows positive title/body text deltas for input/change/focus cases, while negatives do not change context | state delta is required; visual-only review would miss or misclassify the context change |
| `pointer-p1` / `pointer-n1` | positive canvas is visually blank; manifest shows `activated:true` after pointerdown and no abort/undo/reversal after move-away/up; negative button does not activate on down | event-sequence evidence is required; this evidence is specifically `2.5.2` pointer-cancellation evidence, not generic `2.5.1` pointer-gesture proof |
| `gesture-p1` / `gesture-n1` / `gesture-n4` | positive path-gesture case records completion only after a trusted zigzag-like pointer path; alternative-control negative records same-state completion by a marked button; click-control negative records completion by ordinary click | `2.5.1` evidence must bind path-based functionality to failed target-click and failed same-function marked alternatives; screenshots are context, state traces are load-bearing |
| `drag-p1` / `drag-n1` / `drag-n4` | positive drag-only case records drag completion after trusted mouse drag, no completion after click, and no alternative; alternative-control negative records the same function completed by a separate simple-pointer button; click-control negative records the same function completed by ordinary click | `2.5.7` evidence must bind drag functionality to failed simple-click and failed same-function alternative probes; screenshots are context, state traces are load-bearing |
| `status-p1` / `status-p5` / `status-p6` / controls | positive cases visually add a status line, remove visible “Application busy” text, or change a visible icon; negative controls show role/live/focus/direct-announcement/dialog/native-alert/disclosure channels in state traces | `4.1.3` evidence must bind trusted activation to status information without focus/context change and without live/status/alert/log/direct-announcement semantics; removal and icon cases are fixture-scoped edge cases |
| `trap-p1` / `trap-n1` | positive state trace shows focus retained by the trapping button after real Tab; negative screenshots are context only because a single still frame does not prove absence of a trap | trusted focus-retention graph evidence is required; screenshots can corroborate target context but cannot prove `2.1.2` |
| `media-p1` / `media-n4` / `media-p3` / `media-n8` | screenshots show only mechanical context: video/audio controls and transcript links; state traces carry the fixture media content model, tracks, transcript links, and adequacy comparison | media packets need semantic comparison of required auditory/visual content against captions/transcripts/descriptions; screenshots are context only |
| `auth-p1` | password/captcha-like text is visible | visual context can support classification, but accessible-authentication requires flow semantics and alternatives |
| `auth-n1` | password/code fields plus “Use a magic link” are visible | visual context shows a possible alternative; LLM must judge whether it is applicable/adequate |

Additional visual audit in this pass:

- `ts-p1` before/after was inspected again. The before crop is fully readable; the after-spacing crop visibly clips
  the end of “Spacing sensitive.” This is the strongest visual-agreement lane.
- `fcn-p1` before/forced-colors crops were inspected. Before forced colors, the focusable button has a clear black
  border and hamburger icon. Under forced-colors emulation, the target becomes a nearly blank gray rounded
  rectangle. The measured boundary contrast dropped from 18.88:1 to 1:1.
- `fcn-n1` before/forced-colors crops were inspected. The system-color negative keeps a visible button boundary and
  icon in forced-colors mode, so the scoped no-packet result is plausible.
- `rm-n5` before/after-pause-control crops were inspected. The target remains visible and freezes at a rotated
  state after the button is clicked; the decisive evidence is the trusted click and `workingTargetPaths: ["#target"]`.
- `rm-n8` before/reduced-motion crops were inspected. The target visibly matches the generated essential-progress
  context; the decisive evidence is `essentialMotion: true` and lack of `parallelNonEssential`, not the still image.
- `flash-p5` before and after-550ms target crops looked effectively identical even though the temporal sampler
  measured background-luminance/red-state transitions at 5 Hz. Still screenshots are not enough for `2.3.1`;
  temporal sampling plus threshold/area/red facts are required.
- `flash-n5` also looked similar in still crops, but temporal samples showed small non-red opacity flashing:
  5 Hz was observed, yet neither generated large-area nor red-threshold evidence was present, so the barrier
  evidence was correctly withheld.
- `context-p1` and `context-p2` before/after page screenshots show the typed value and changed page text/title, but
  the conformance-relevant evidence is still the trusted input/change action and recorded state delta, not pixels
  alone.
- `pointer-p1` before/after-pointer screenshots are visually blank except for the heading. Pointer-cancellation
  evidence must come from trusted event/state traces.
- `gesture-p1` after-gesture screenshot shows a visible status of `gesture completed 1`; the decisive facts are the
  trusted path-like pointer trace, the isolated click attempt that did not reach the same target state, and the
  absence of a target-scoped marked simple-pointer alternative. `gesture-n1` shows a simple button alternative
  completing the same generated function, and `gesture-n4` shows an ordinary click completing it.
- `drag-p1` after-drag screenshot shows a visible status of `drag completed 1`, but the decisive facts are the
  trusted drag state delta, the isolated click attempt that did not change state, and the absence of a same-function
  simple-pointer alternative. `drag-n1` shows a button alternative completing the same generated function, and
  `drag-n4` shows an ordinary click completing it; both are correctly withheld as barriers.
- `trap-p1` after-Tab screenshot shows the trapping button focused, and the manifest records `activeElementId:
  "target"` after real keyboard input. This is useful context, but the real proof comes from the keyboard graph's
  repeated focus-retention detection; a single `trap-n1` screenshot cannot prove no trap.
- `media-p1`, `media-p3`, `media-n4`, and `media-n8` were inspected. Pixels agree with the mechanical surface:
  video/audio controls are visible, and transcript links are visible only on the transcript-control cases. The
  decisive media evidence is the state/metadata packet: media type, row-level SC, auditory content, visual content,
  caption text, transcript text, description text, tracks, transcript links, and token-coverage adequacy facts.
- `auth-n1` visually shows a possible alternative mechanism, which is why accessible-authentication negatives are
  semantic judgment cases rather than deterministic silence.

## Tests Run

Command:

```bash
node --test scripts/v3/tests/broad-scope-probes.test.js
```

Result:

- 29 tests passed.
- Includes pure probe tests, builder consumption, cross-artifact identity refusal, and end-to-end
  `orchestrate(runBroadScope)`.

Command:

```bash
node scripts/v3/tests/manual/validate-broad-scope-adaptation-fixtures.js
```

Result:

- 100 generated adaptation fixtures validated.
- 100 pass, 0 fail.

Additional fixture validators:

```bash
node scripts/v3/tests/manual/validate-broad-scope-ni-interaction-fixtures.js
node scripts/v3/tests/manual/validate-broad-scope-media-process-auth-fixtures.js
```

Result:

- 240 non-interference/interaction fixtures validated.
- 120 media/process/auth/site/cognitive fixtures validated.
- Combined generated fixture validation: 460 pass, 0 fail.

Mock no-human LLM packet validator:

```bash
node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js
```

Result:

- 460 generated validation rows loaded.
- 440 bounded review packets produced.
- 20 clean process/site-set control rows produced no review packet, by design; they are not converted into
  fabricated clears.
- 30 packets converted into registered v3 barrier `judgments`:
  - positive reduced-motion / motion-control: 10
  - positive pause-stop-hide / motion-control: 10
  - positive keyboard-trap / no-keyboard-trap: 10
- Verdict distribution from the injected judge/critic procedure:
  - `LIKELY_BARRIER`: 170
  - `LIKELY_OK`: 20
  - `UNCERTAIN`: 270
- Output: `scripts/v3/tests/generated/broad-scope/llm-packet-validation.json`

This validator is adversarial plumbing coverage: it deliberately builds packets for many negative rows so the
judge/critic clear path is exercised. It should not be read as the expected annotation work queue size.

Stratified all-aspect packet pressure:

```bash
node scripts/v3/tests/manual/run-broad-scope-stratified-packet-pressure.js
```

Result:

- 460 generated validation rows loaded.
- 23 aspects.
- 10 positive and 10 negative rows per aspect.
- 250 review packets produced from positive/review-relevant rows.
- 210 rows produced no packet:
  - mostly clean negative controls;
  - clean process/site controls.
- 30 packets converted into registered v3 barrier `judgments`:
  - `reduced-motion`: 10 fixture-scoped `2.2.2` motion-control barriers;
  - `pause-stop-hide`: 10 fixture-scoped `2.2.2` motion-control barriers;
  - `keyboard-trap`: 10
- Motion-control packets convert only for the regenerated fixtures that now carry measured persistent motion,
  missing control evidence, and explicit parallel/non-essential evidence. Arbitrary saved pages still cannot bridge
  from motion labels alone.
- Output: `evidence/broad-scope-stratified-packet-pressure/results.json`

Per-aspect packet integration summary:

| Aspect | Rows | Packet Rows | Packets | Converted Judgments | Expected No-Probe Rows | Verdict Shape |
|---|---:|---:|---:|---:|---:|---|
| accessible-authentication | 20 | 20 | 20 | 0 | 0 | 10 barrier / 10 uncertain |
| audio-control | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| character-shortcuts | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| complete-process | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 no-review |
| context-change | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| dragging-movement | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| flash-risk | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| forced-colors | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| forced-colors-nontext | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| keyboard-trap | 20 | 10 | 10 | 10 | 0 | 10 barrier / 10 scoped OK |
| label-in-name | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| language-readability-cognitive | 20 | 20 | 20 | 0 | 0 | 10 barrier / 10 uncertain |
| media-alternatives | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| pause-stop-hide | 20 | 10 | 10 | 10 | 0 | 10 barrier / 10 scoped OK |
| pointer-operation | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| pointer-gesture | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| reduced-motion | 20 | 10 | 10 | 10 | 0 | 10 barrier / 10 scoped OK |
| redundant-entry | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| resize-text | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| site-set-consistency | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 no-review |
| status-announcement | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| target-size-minimum | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |
| text-spacing | 20 | 10 | 10 | 0 | 0 | 10 barrier / 10 scoped OK |

Subagent LLM prompt-pack experiment:

```bash
node scripts/v3/tests/manual/build-broad-scope-subagent-prompt-pack.js --sample-per-class 1
```

Artifacts:

- `evidence/broad-scope-subagent-prompt-pack/prompts.json`
- `evidence/broad-scope-subagent-prompt-pack/sample-prompts.json`
- `evidence/broad-scope-subagent-prompt-pack/rawls-judge-review.json`
- `evidence/broad-scope-subagent-prompt-pack/lagrange-critic-review.json`
- `evidence/broad-scope-subagent-prompt-pack/rawls-comparison.json`
- `evidence/broad-scope-subagent-prompt-pack/helmholtz-vision-ts-p1-review.json`

Result:

- Full prompt pack: 460 entries, 250 actual packet prompts, 210 no-packet scoped rows.
- The first JSON-only judge sample covered 10 positive packet rows across visual, temporal, keyboard,
  interaction, authentication, and cognitive lanes.
- Judge result: 9 `UNCERTAIN`, 1 `LIKELY_BARRIER`, 0 unsafe clears.
- The accepted barrier was `trap-p1` (`2.1.2`), where trusted keyboard-trap evidence covered every required
  evidence token.
- The critic agreed with all 10 judge decisions.
- Key finding: a JSON-only LLM correctly refused `ts-p1` text-spacing because the packet claimed visual agreement
  but did not expose a concrete visual reference in the prompt. The prompt-pack builder now attaches existing visual
  evidence refs from the captured fixture manifests when available.
- Follow-up vision-backed review for `ts-p1`, using the actual before/after screenshots, returned
  `LIKELY_BARRIER` with high confidence: the before image showed “Spacing sensitive” fully visible, and the
  after-spacing image showed the text clipped at the right edge.

Interpretation:

- This supports the no-human design principle: the LLM should not be expected to trust detector labels or fixture
  labels. It should see the evidence modality needed by the SC.
- For visual SCs, the packet must include visual evidence refs and the LLM/vision stage must be able to inspect
  them. JSON-only prompts are too weak even when generated validators have marked the fixture positive.
- For threshold/process/semantic SCs, the correct current behavior remains `UNCERTAIN` unless the packet contains
  the specific threshold, scope, and exception evidence required by WCAG/TT/EN semantics.

Vision prompt-pack batch:

```bash
node scripts/v3/tests/manual/build-broad-scope-vision-prompt-pack.js
node scripts/v3/tests/manual/compare-broad-scope-vision-review.js \
  --review evidence/broad-scope-vision-prompt-pack/dalton-adaptation-vision-review.json \
  --out evidence/broad-scope-vision-prompt-pack/dalton-adaptation-comparison.json
```

Artifacts:

- `evidence/broad-scope-vision-prompt-pack/vision-prompts.json`
- `evidence/broad-scope-vision-prompt-pack/dalton-adaptation-vision-review.json`
- `evidence/broad-scope-vision-prompt-pack/dalton-adaptation-comparison.json`

Prompt-pack coverage:

- 26 captured visual cases across 13 aspects.
- Each covered aspect has one positive and one negative captured visual case.
- The vision pack intentionally labels only text-spacing, resize-text, and keyboard-trap positives as visually
  decidable barrier candidates. Forced-colors, motion, flashing, media, interaction, authentication, and cognitive
  positives require additional semantic/temporal/state evidence even when screenshots exist.

Adaptation vision batch result:

- 8 cases reviewed: `text-spacing`, `resize-text`, `forced-colors`, and `reduced-motion`, each positive/negative.
- 8/8 acceptable by the comparator; 0 unsafe visual verdicts.
- Verdicts:
  - `LIKELY_BARRIER`: `ts-p1`, `zr-p1`, `fc-p1`.
  - `LIKELY_OK`: `ts-n1`, `zr-n1`, `fc-n1`, `rm-n1`.
  - `UNCERTAIN`: `rm-p1`.
- Forced-colors correction: `fc-p1` now starts readable in normal mode and becomes gray-on-gray only under
  forced-colors emulation. The probe records normal contrast >= 4.5:1 and forced-colors contrast < 3:1 before adding
  `forced-colors-render` + `essential-meaning-or-affordance-loss`.
- `rm-p1` correctly remains `UNCERTAIN` from still screenshots: the images suggest a changed transformed state, but
  do not prove persistent auto-motion, duration/looping, or lack of a working pause/stop/hide control.

State-trace prompt-pack batch:

```bash
node scripts/v3/tests/manual/build-broad-scope-state-prompt-pack.js
node scripts/v3/tests/manual/compare-broad-scope-state-review.js \
  --review evidence/broad-scope-state-prompt-pack/noether-state-review.json \
  --out evidence/broad-scope-state-prompt-pack/noether-state-comparison.json
```

Artifacts:

- `evidence/broad-scope-state-prompt-pack/state-prompts.json`
- `evidence/broad-scope-state-prompt-pack/noether-state-review.json`
- `evidence/broad-scope-state-prompt-pack/noether-state-comparison.json`

Coverage:

- 10 state-trace cases across 5 aspects:
  `context-change`, `flash-risk`, `keyboard-trap`, `pause-stop-hide`, and `pointer-operation`.
- Each aspect has one positive and one negative trace case.

Result:

- 10/10 acceptable by the comparator; 0 unsafe state-trace verdicts.
- Verdicts:
  - `LIKELY_OK`: `context-n1`, `pointer-n1`.
  - `UNCERTAIN`: all positive traces plus `flash-n1`, `trap-n1`, and `motion-n1`.

Interpretation:

- State traces are valuable, but this earlier captured manifest was intentionally not enough to promote most
  positive temporal/interaction cases:
  - `context-p1`: the trace showed a context/state change from a trusted action, but this earlier packet did not
    yet encode the advice-beforehand fact now present in the regenerated prompt pack.
  - `flash-p1`: fast infinite animation is visible in state, but there is no frame-sampled flash count plus
    area/red-threshold calculation.
  - `motion-p1`: infinite motion and transform delta are present, but the trace does not prove the content is
    parallel/non-essential or that no working pause/stop/hide mechanism exists.
  - `pointer-p1`: activation on pointerdown is present, but alternatives, undo/reversal, and cancellation behavior
    are not established.
  - `trap-p1`: the simple manifest state shows focus retained after Tab, but does not encode repeated Tab/Shift+Tab
    confinement or advised-exit evidence. The stronger keyboard graph probe remains the right evidence source for
    `2.1.2`.
- This reinforces the harness design rule: positive state deltas are applicability/evidence surfaces until the packet
  contains the exact WCAG exception and threshold facts.

Adversarial state packet experiment:

```bash
node scripts/v3/tests/manual/build-broad-scope-adversarial-state-pack.js
node scripts/v3/tests/manual/compare-broad-scope-adversarial-state-review.js \
  --review evidence/broad-scope-adversarial-state-pack/banach-adversarial-state-review.json \
  --out evidence/broad-scope-adversarial-state-pack/banach-adversarial-state-comparison.json
```

Artifacts:

- `evidence/broad-scope-adversarial-state-pack/adversarial-state-prompts.json`
- `evidence/broad-scope-adversarial-state-pack/banach-adversarial-state-review.json`
- `evidence/broad-scope-adversarial-state-pack/banach-adversarial-state-comparison.json`

Purpose:

- The ordinary state pack showed that current traces are too thin for positive barriers.
- This adversarial pack adds the missing facts explicitly: controls searched/exercised, advised-warning text,
  pointer cancellation alternatives, repeated Tab/Shift+Tab confinement, and advised Escape exit.
- It tests whether the no-human LLM procedure can produce definite verdicts when the packet has the facts WCAG/TT
  actually needs.

Result:

- 8/8 pass against expected outcomes.
- 4 `LIKELY_BARRIER`, 4 `LIKELY_OK`.
- 0 unsafe false clears and 0 unsafe false barriers.

Covered pairs:

- `2.2.2` motion:
  - barrier when persistent parallel non-essential motion has no pause/stop/hide control;
  - OK when an exercised pause control changes animation state to paused.
- `3.2.1` context change:
  - barrier when focus changes context without advance advice;
  - OK when the focus-triggered help behavior is advised beforehand.
- `2.5.2` pointer cancellation:
  - barrier when pointerdown completes the action and move-away/up cannot abort, undo, or reverse it;
  - OK when action completes only on up-event on the target.
- `2.1.2` keyboard trap:
  - barrier when repeated Tab/Shift+Tab confinement has no advised exit;
  - OK when Escape is advised and moves focus out.

Interpretation:

- The LLM procedure can make definite no-human judgments when packets contain positive support for both the
  barrier facts and the relevant exception/control facts.
- The implementation target for real probes is now sharper: gather these missing facts automatically rather than
  relying on the LLM to infer them from thin traces.
- This also validates the current conservative behavior: when those facts are absent, `UNCERTAIN` is the correct
  safe sink.

Implemented probe enrichment from adversarial findings:

- `probeContextChanges` now collects explicit label/wrapping-label/`aria-describedby` advice text for each driven
  focus/input candidate. Dynamic context-change packets now emit:
  - `trusted-focus-or-input-action`;
  - `context-change-observed`;
  - either `not-advised-beforehand` or `advised-beforehand`.
- `probePointerActivation` now records whether pointerdown completed an action and whether the move-away/pointerup
  sequence failed to abort/reverse it or reveal undo/cancel controls. Dynamic pointer packets now emit:
  - `trusted-pointer-sequence`;
  - `down-event-completes-action`;
  - `no-abort-undo-reversal-or-up-event-completion` when supported by the trace.
- The end-to-end `orchestrate(runBroadScope)` test now asserts those richer evidence tokens survive into the actual
  `broadScope.reviewPackets`, not merely the raw probe result.

Verification:

```bash
node --test scripts/v3/tests/broad-scope-probes.test.js
```

Result:

- 19/19 passed with real Chromium.
- This is the first slice where the adversarial “missing facts” experiment has been converted back into real
  browser-probe evidence emitted by the harness.

Command:

```bash
node --test scripts/v3/tests/broad-scope-llm-review.test.js
```

Result:

- 13 tests passed.
- Covers prompt requirements, barrier/OK agreement, critic dispute -> `UNCERTAIN`, and malformed-output fail-closed.
- Covers evidence-packet construction from broad-scope sidecar findings.
- Covers the v3 judgment adapter:
  - registered `2.2.2` / `motion-control` packets with a concrete target validate as normal judgments only when
    they include complete structural evidence, including parallel/non-essential scope evidence;
  - non-v3 `EN-C.9.7`, fictional-family, SC/family-mismatch, and missing-target packets are not converted;
  - an agreed barrier can fill an enumerated motion-control obligation as PROVISIONAL, never authoritative;
  - a critic-disputed clear stays `UNCERTAIN` and leaves the obligation PARTIAL.

Command:

```bash
node --test scripts/v3/tests/broad-scope-llm-review.test.js scripts/v3/tests/broad-scope-probes.test.js scripts/v3/tests/kbd-graph.test.js
```

Result:

- 40 tests passed.
- The broad-scope probe suite required a real Chromium launch; sandboxed launch failed as expected, and the same
  suite passed with browser permission.
- New dynamic tests cover audio autoplay risk vs muted/controlled controls, fast flash vs slow blink, focus-triggered
  state changes vs inline help, pointerdown activation vs ordinary button down, and end-to-end `runBroadScope`
  dynamic findings through the builder.
- New LLM-review tests cover persisted packet rationales, conversion of registered packets into `judgments`,
  rationale text staying out of strict results, and critic-disputed clears producing `UNCERTAIN` with no provisional
  fill.

## Saved-Page Pressure Runs

Added pressure runner:

- `scripts/v3/tests/manual/run-broad-scope-saved-pressure.js`

Purpose:

- exercise the broad-scope sidecar on arbitrary local HTML files;
- make no LLM calls;
- publish no v3 conformance claims;
- aggregate detector/packet volume and save screenshots for visual sanity checks.

Command:

```bash
node scripts/v3/tests/manual/run-broad-scope-saved-pressure.js \
  --limit 30 \
  --capture-top 6 \
  --timeout-ms 20000 \
  --element-cap 2500
```

Result:

- Input mix: `assets/fixtures`, `act-rules/pages`, and `eval/checker-comparison/act-subset/pages`,
  sampled round-robin by root.
- 30 pages ran.
- 0 failures.
- 0 broad-scope findings.
- 0 review packets.
- 21 cognitive research annotations.
- Output:
  - `evidence/broad-scope-saved-pressure/results.json`
  - `evidence/broad-scope-saved-pressure/artifacts.json`
  - screenshots under `evidence/broad-scope-saved-pressure/screenshots/`

Interpretation:

- This sample was mostly static ACT-like/simple fixture content. The sidecar did not spray candidates across
  ordinary pages, which is a good false-positive pressure sign.
- This is not a recall proof. It says only that the new broad-scope probes are quiet on a quiet local sample.
- The cognitive research annotations remain non-authoritative sidecar material and do not enter review packets.

Visual sanity check:

- Representative quiet screenshot: `bypass-blocks-cf77f2/chapter2.html` is plain text/nav content. The zero-finding
  result is plausible.

Generated-corpus pressure command:

```bash
node scripts/v3/tests/manual/run-broad-scope-saved-pressure.js \
  --roots scripts/v3/tests/generated/broad-scope/adaptation,scripts/v3/tests/generated/broad-scope/non-interference-interaction,scripts/v3/tests/generated/broad-scope/media-process-auth \
  --limit 45 \
  --capture-top 8 \
  --out docs/analysis/improvement-research-2026-06/evidence/broad-scope-generated-pressure \
  --timeout-ms 20000 \
  --element-cap 2500
```

Result:

- 45 generated pages ran.
- 0 failures.
- 70 findings.
- 70 review packets.
- 5 visual checks.
- Output:
  - `evidence/broad-scope-generated-pressure/results.json`
  - `evidence/broad-scope-generated-pressure/artifacts.json`
  - screenshots under `evidence/broad-scope-generated-pressure/screenshots/`

Detector volume:

| Detector | Findings |
|---|---:|
| accessible-authentication | 25 |
| media-alternative-inventory | 15 |
| audio-control | 5 |
| audio-control-dynamic | 5 |
| captcha-authentication | 5 |
| forced-colors | 5 |
| paste-blocking | 5 |
| scope-media-autoplay | 5 |

Evidence-strength volume:

| Evidence-strength bucket | Findings | Meaning |
|---|---:|---|
| applicability-review-surface | 60 | Positive review surface, not proof of failure |
| applicability-risk-unproven-playback | 5 | Autoplay/control risk where actual audible playback was not proven |
| visual-review-surface | 5 | Visual-adaptation review surface |

Interpretation:

- Known generated positives are detected in the end-to-end sidecar flow.
- `audio-control` positives intentionally produce multiple packets: scope inventory, static media candidate,
  media-alternative inventory, and dynamic playback/control evidence. The generated positive now persists raw
  measured fields (`beforeCurrentTime`, `afterCurrentTime`, `duration`, `loop`, `knownNonSilentTone`,
  `noIndependentControlObserved`) and only the dynamic packet has the two required `1.4.2` evidence claims. This is
  useful for annotation but should be deduplicated before any LLM work queue.
- `accessible-authentication` controls and negatives can still create review packets, because a password field is an
  applicability surface, not proof of failure. This is acceptable only because the packet judge is instructed that
  absence is not a pass and the critic can collapse unsafe clears to `UNCERTAIN`.
- Visual screenshots corroborate that audio controls can be invisible while still materially relevant, and that auth
  packets need semantic/flow review rather than screenshot-only judgment.
- This 45-page sample is not a pressure pass over all 17 generated aspects. Sorted file order plus the sample limit
  exercised mainly forced-colors, audio/media, and authentication/captcha/paste. The later stratified packet pressure
  run covers all 17 generated aspects and both positive/negative partitions.

Process/site manifest pressure command:

```bash
node scripts/v3/tests/manual/run-broad-scope-saved-pressure.js \
  --roots scripts/v3/tests/generated/broad-scope/media-process-auth/accessible-authentication \
  --manifest-roots scripts/v3/tests/generated/broad-scope/media-process-auth/complete-process,scripts/v3/tests/generated/broad-scope/media-process-auth/site-set-consistency \
  --limit 6 \
  --capture-top 2 \
  --out docs/analysis/improvement-research-2026-06/evidence/broad-scope-process-site-pressure \
  --timeout-ms 20000 \
  --element-cap 2500
```

Result:

- 6 HTML auth pages ran.
- 40 process/site manifests analyzed.
- 20 process/site review packets produced:
  - `complete-process`: 10
  - `site-set-consistency`: 10
- Process warnings now cover varied process-scope failures:
  - missing required measured step;
  - duplicate step id;
  - failed required step;
  - incomplete process boundary;
  - same-process redundant entry without auto-populate/selection/security exception;
  - missing step target;
  - explicit unmeasured step;
  - missing persisted-field evidence;
  - extra required step absent from measured pages;
  - missing per-step result.
- Site-set warnings now cover varied page-set failures:
  - duplicate page title for pages with different purposes;
  - inconsistent repeated navigation order;
  - same navigation label pointing to different destinations;
  - inconsistent repeated help mechanism order;
  - same-function component with inconsistent label/role;
  - same link name with different destination/purpose;
  - missing page URL in the declared set;
  - help-mechanism inconsistency across a third page;
  - component role drift;
  - combined duplicate-title plus missing repeated nav item.
- Clean negative manifests produced zero packets, preserving the no-fabricated-clear rule.
- Output:
  - `evidence/broad-scope-process-site-pressure/results.json`
  - `evidence/broad-scope-process-site-pressure/artifacts.json`

Implementation hardening from critic pass:

- Multi-SC packet semantics are now preserved:
  - packets keep `sc` / primary SC for v3-bridge compatibility;
  - packets also keep `rawSc` and `relatedScs`;
  - the sanitized `broadScopeReviewPackets` result index preserves `rawSc` and `relatedScs`.
- Pressure reports now stratify signals by `evidenceStrength`, so review surfaces are not presented as observed
  barriers.
- The pressure runner can analyze process/site JSON manifests separately from page-local HTML probes via
  `--manifest-roots`.
- Broad-scope strict results now redact rich `detail` / visual `note` text. The evidence bundle keeps the full
  packet; `v3-results.json` carries controlled summary codes such as `text-spacing:text-spacing` plus metadata.
- The v3 bridge is barrier-only by default. Broad-scope `LIKELY_OK` / clear-side reviews remain sidecar rationale
  and cannot clear an obligation in no-human operation.
- The v3 bridge now also enforces required-evidence coverage structurally. A registered SC/family/target and an
  agreeing LLM barrier are insufficient unless the packet's `observed.evidenceClaims` cover its `requiredEvidence`.
  This specifically closes the overclaim path for motion/trap packets where CSS or candidate labels alone did not
  prove exceptions or controls.
- Process/site subagent review is saved at
  `evidence/broad-scope-subagent-prompt-pack/process-site-scope-subagent-review.json`. The review initially found
  over-broad exact-array help/nav comparisons, optimistic process coverage defaults, missing structured process
  packet fields, and no-packet rows summarized as `LIKELY_OK`. The implemented remediation now requires declared
  required steps and explicit measured status, prevents missing-target steps from counting as measured, compares
  repeated help/nav relative order instead of exact availability, exposes process gap fields in packets, and labels
  no-packet pressure rows as `NO_REVIEW`.
- Cognitive/readability research now enters the production broad-scope sidecar as `plain-language-research` review
  packets as well as `researchAnnotations`; it remains sidecar-only with no registered v3 claim family.
- The orchestrator now has an opt-in broad-scope judge/critic integration lane:
  - `runBroadScopeForUrl()` still produces the browser-derived sidecar packet artifact;
  - callers may inject `runBroadScopeJudge` and `runBroadScopeCritic`;
  - the orchestrator runs `runBroadScopePacketReviews()` over those packets;
  - broad-scope rationales are stored in a first-class `broadScopeRationale` side artifact;
  - only barrier reviews with registered SC/family/target and complete structural evidence can become
    `judgments`; clear-side reviews remain sidecar-only.
- `broadScopeRationale` is now registered in the bundle schema, bundle loader, and cross-artifact identity gate,
  so saved/replayed evidence can bind broad-scope LLM rationales to the same file/run/page digest as the packet
  artifact.
- Reduced-motion / pause-stop-hide evidence now exercises obvious visible pause/stop/hide controls before emitting
  missing-control evidence:
  - persistent motion with no matching working control carries `auto-motion-persists`, `duration-or-looping`, and
    `no-working-pause-stop-hide`;
  - persistent motion with a clicked control that pauses/stops/hides the target carries `working-pause-stop-hide`
    instead, preventing the packet from looking like a barrier.
  - Generated fixtures now also cover essential-motion and working-control negatives, and blind subagent review
    accepted those as `LIKELY_OK` sidecar outcomes. Arbitrary saved pages still need positive evidence for
    essential-motion and "presented in parallel with other content" facts before any definite motion judgment.
- Focused verification after this enrichment:
  - `node --test scripts/v3/tests/broad-scope-probes.test.js scripts/v3/tests/broad-scope-llm-review.test.js`
  - sandboxed browser launch failed as expected;
  - latest focused rerun passed with browser permission: 44 tests passed, 0 failed.
- Focused verification after orchestrator judge/critic integration:
  - `node --test scripts/v3/tests/broad-scope-probes.test.js scripts/v3/tests/broad-scope-llm-review.test.js scripts/v3/tests/meta.test.js`
  - earlier focused rerun passed with browser permission: 34 tests passed, 0 failed;
  - latest broad-scope focused pair rerun passed with browser permission: 44 tests passed, 0 failed;
  - the orchestrator test now exercises the real browser probe -> broad-scope packet -> injected judge/critic ->
    `broadScopeRationale` -> barrier-only `judgments` -> build gate path.

Prompt-pack integration audit:

- Added `scripts/v3/tests/manual/audit-broad-scope-prompt-pack.js`.
- Regenerated the fixture manifests, browser validations, prompt pack, and stratified packet pressure outputs.
- Browser validation summary:
  - adaptation: 100/100 passed;
  - non-interference / interaction: 240/240 passed;
  - media / process / auth: 120/120 passed.
- Prompt-pack audit summary:
  - 460 total entries;
  - 250 packet entries;
  - 210 no-packet entries;
  - 200 packets with structurally complete required evidence;
  - 30 barrier-bridgeable packets;
  - 0 clear-bridgeable packets;
  - 0 prompt-rule omissions.
  - fixture answer labels are now written only to `answer-key.json`; judge-facing `prompts.json` /
    `sample-prompts.json` do not expose `expected` or `expectedDirection`. The state and vision prompt packs use
    the same split-answer-key discipline.
  - evidence claims are no longer synthesized from fixture labels. They must come from validator-measured
    `row.evidenceClaims`, otherwise the packet remains structurally incomplete.
  - generated reduced-motion and pause-stop-hide packets now include measured persistent motion, missing
    pause/stop/hide control evidence, and explicit `parallel-non-essential-content`; those generated fixtures are
    bridgeable as provisional barriers. Saved-page motion remains sidecar unless the same facts are positively
    proved.
  - generated character-shortcuts positives now carry complete `2.1.4` evidence:
    `trusted-keyboard-action`, `single-printable-character-shortcut-observed`, and
    `no-off-remap-or-focus-scope-exception`.
  - generated label-in-name positives now carry complete sidecar `2.5.3` evidence:
    `visible-text-label`, `accessible-name-observed`, and `accessible-name-missing-visible-text`. Negative controls
    cover content-derived names, `aria-label` containing visible text, `aria-labelledby` containing visible text,
    input value names, and names with visible text plus extra purpose. Representative vision inspection agrees:
    `label-p1-before-target.png` visibly reads "Review cart 1" while validation records accessible name
    "Continue checkout 1"; `label-n1-before-target.png` visibly reads "Pay now 1" and validation records the
    same content-derived accessible name; `label-p2-before-target.png` visibly reads "Remove 2" while validation
    records accessible name "Delete item 2" from `aria-label`.
  - blind subagent review initially caught an unsound `title`-over-contents accessible-name surrogate in the
    label-in-name probe/fixtures. The probe now falls back to visible contents before `title`, the disputed
    positives were changed to explicit `aria-label` mismatches, and the updated review reports 10
    `LIKELY_BARRIER` positives and 10 scoped-OK negatives.
  - generated complete-process and site-set consistency positives now carry structural scope evidence tokens:
    `complete-process` packets require `declared-process-steps`, `process-scope-comparison`, and
    `process-gap-or-failure-observed`; `site-set-consistency` packets require `declared-page-set`,
    `same-state-breakpoint-context`, `repeated-mechanism-comparison`, and
    `site-set-inconsistency-or-scope-gap-observed`. This fixed an earlier prompt-contract mismatch where
    complete-process packets wrongly required the clean condition `all-required-steps-measured`, which would have
    pushed true missing-step barriers toward `UNCERTAIN`.
  - generated target-size positives now carry complete sidecar `2.5.8` geometry evidence:
    `rendered-pointer-target`, `measured-target-size-below-24`, and `target-spacing-intersection`, using the same
    `evalTargetSize` circle/rectangle geometry as the v3 builder. Negative controls cover 24x24-or-larger targets,
    the spacing exception, inline/prose surfaces, essential exception, equivalent-target exception, and unmodified
    user-agent control exception. Vision
    inspection agrees for representative cases: `targetsize-p1` shows two tiny adjacent square buttons,
    `targetsize-n1` shows tiny but widely spaced targets, `targetsize-n2` shows small inline links inside a
    sentence, and `targetsize-n5` shows default native checkbox controls. Equivalent, inline/prose, essential, and
    UA-control generated exceptions now carry explicit pass reasons rather than nested geometry-fail text. This
    remains sidecar review: equivalent/essential/inline/UA exceptions must be considered by the judge before
    treating a geometry candidate as a barrier.
  - blind subagent review of `target-size-minimum` initially found missing UA-control coverage and unclear
    equivalent/inline negative evidence. After hardening, it reports 10 `LIKELY_BARRIER` positives and 10 scoped-OK
    negatives; the remaining caveat is that negative scoped-OK evidence lives in `validation.json` rather than as
    prompt packets.
  - generated audio-control positives now carry complete generated-fixture `1.4.2` evidence:
    `audible-autoplay-more-than-three-seconds` and `no-independent-control`, backed by measured >3s currentTime
    advancement and a known non-silent tone marker. This is deliberately fixture-scoped, not a claim that arbitrary
    saved-site media audibility is solved.
  - generated flash-risk positives carry complete generated-fixture `2.3.1` evidence claims for three narrow
    classes: large red opacity flashing, large color-only red/black background-luminance flashing, and small red
    opacity flashing. Negative controls include slow red flashing, small non-red fast flashing, and low-delta fast
    color changes. The adversarial review below still blocks treating this as a general flash detector.
  - generated pointer-operation positives now expose the concrete dynamic-probe SC as `2.5.2`, because the measured
    evidence proves pointer-cancellation risk rather than generic pointer-gesture failure.
  - generated pointer-gesture positives now carry complete sidecar `2.5.1` evidence:
    `trusted-path-gesture-operation`, `path-based-functionality-observed`, and
    `target-click-and-marked-alternatives-only-no-equivalent-observed`. Negative controls cover ordinary click completion,
    explicit same-function simple-pointer alternatives, essential path gestures, and user-agent-provided gesture
    annotations. The current lane is intentionally scoped: it proves generated/marked path-gesture behavior, not
    exhaustive discovery of all unmarked simple-pointer alternatives, multipoint gestures, keyboard alternatives,
    menus, text fields, or revealed controls on arbitrary pages.
  - generated dragging-movement positives now carry complete sidecar `2.5.7` evidence:
    `trusted-drag-operation`, `dragging-functionality-observed`, and
    `scoped-no-target-click-or-marked-alternative-observed`. Negative controls cover ordinary click completion,
    explicit
    same-function simple-pointer alternatives, essential dragging, and unmodified/user-agent-provided dragging.
    Multi-target alternative evidence is target-bound with `data-v3-drag-alternative-for`; otherwise a page-level
    unrelated button could suppress a real barrier. The current lane is intentionally scoped: it proves fixture
    behavior for target click and marked alternatives, not exhaustive discovery of all possible simple-pointer,
    keyboard, menu, text-field, or revealed alternatives on arbitrary pages. Essential and user-agent exceptions in
    generated negatives remain authored fixture annotations, not independent exception adjudication.
  - generated forced-colors non-text positives now carry complete sidecar evidence:
    `forced-colors-render`, `non-text-boundary-or-state-loss`, and `essential-control-boundary`, backed by measured
    boundary contrast dropping from >= 3:1 to < 3:1 under forced-colors emulation. This remains EN/visual-adaptation
    sidecar evidence with no v3 bridge.
  - generated media-alternatives positives now carry fixture-scoped `1.2.x` evidence:
    `owned-media-element`, `media-content-model-observed`, and `alternative-presence-and-adequacy-evidence`.
    The fixture matrix now covers `1.2.2` missing/incomplete captions including meaningful sounds, `1.2.1`
    missing/inadequate audio-only transcripts and video-only alternatives, `1.2.3` missing/inadequate visual
    alternatives or descriptions for synchronized media, and `1.2.5` inadequate audio description. Negative controls
    cover adequate captions, clearly labeled media-alternative-for-text, adequate audio description, adequate
    audio-only transcript, adequate video-only alternative, and adequate full media alternative. Prompt artifacts now
    preserve the row-level SC split instead of flattening all media packets to `1.2.2`: current media prompt packets
    are 4 for `1.2.2`, 3 for `1.2.1`, 2 for `1.2.3`, and 1 for `1.2.5`.
  - blind subagent review of `media-alternatives` reports `qualified-pass-sidecar-only-not-bridge-ready`: the 10
    positive and 10 negative generated cases are broadly plausible as fixture-scoped WCAG `1.2.x` evidence and
    sidecar/no-clear behavior is preserved. Remaining bridge blockers are deliberate: the metadata token-coverage
    adequacy comparison is not a production caption/transcript/audio-description evaluator, the media-alternative-for-
    text exception is asserted by fixture metadata rather than independently proven, and `1.2.5` promotion would need
    real audio-description evidence plus proof that the visual information is not already in the audio track.
  - generated status-announcement positives now carry complete sidecar `4.1.3` evidence:
    `trusted-activation-action`, `status-message-observed`, `focus-not-moved-to-message`, and
    `no-live-region-or-programmatic-status-role`, with raw `activation.isTrusted=true` recorded by the probe.
    Positive controls now include success/result text, error/result text, progress/waiting state, modification of
    existing status text, removal of a waiting status, a non-text/icon status cue with fixture intent metadata, late
    async status text, empty-result text, and queue-state text. Negative controls cover `role=status`, `role=alert`,
    `role=log`, `aria-live=polite`, `aria-live=assertive`, explicit focus movement to the message, direct
    programmatic announcement instrumentation, HTML modal dialog context, native browser alert context, and disclosure
    expansion context. This remains DOM/live-region/direct-announcement evidence, not a real-AT speech proof.
  - blind subagent review of `status-announcement` reports `PASS_WITH_EDGE_CONCERNS`: the 10 positive and 10
    negative cases are normatively plausible for fixture-scoped WCAG 4.1.3 evidence, the probe avoids the main false
    positives, and the prompt-pack/integration-audit preserve sidecar/no-clear behavior. The two medium caveats are
    deliberate edge cases: status removal is valid only when the removed text itself conveys waiting/completion
    status, and the non-text/icon status case relies on fixture intent metadata rather than a general arbitrary-page
    data-attribute interpretation.
  - blind subagent review of `dragging-movement` initially found overbroad alternative-search wording, coarse
    alternative equivalence, and a hidden hard-coded `#target` state-read risk. After hardening, the updated review
    reports `improved-scoped-fixture-evidence-supported-with-remaining-exception-and-scope-caveats`: the scoped
    evidence token fixes the overclaim, current-target state reads fix the attribution bug, and target click /
    marked alternatives must reach the same observed target state. Remaining caveats are authored essential/UA
    exception annotations and representative-only visual/state coverage.
  - blind subagent review of `pointer-gesture` initially found the same overclaim risk for the alternative-search
    evidence. The pointer-gesture token was renamed to
    `target-click-and-marked-alternatives-only-no-equivalent-observed`, the prompt packs were regenerated, and the
    final subagent re-check reports that the wording concern is resolved for fixture-scoped `2.5.1` path-gesture
    evidence. Remaining caveats are deliberate: this is not exhaustive discovery of unmarked alternatives, not
    multipoint-touch coverage, not page-wide conformance, and not independent proof of essential/user-agent
    exceptions.
  - adversarial fixture testing caught and fixed a stale-coordinate activation bug in the status probe: earlier status
    changes shifted layout, so stored click coordinates could hit the wrong later control. The probe now activates
    stored selectors at action time.
  - representative status screenshots/state traces were refreshed after the expanded status matrix. Visual inspection
    agrees for `status-p1` visible status text, `status-p5` visible waiting-text removal, `status-p6` visible icon
    status, `status-n7` modal dialog context, `status-n8` native alert context via state trace, and `status-n9`
    disclosure context. The load-bearing evidence remains trusted action/state traces rather than pixels alone.
- Output:
  - `evidence/broad-scope-subagent-prompt-pack/integration-audit.json`
  - `evidence/broad-scope-subagent-prompt-pack/answer-key.json`

Subagent stand-in judge evidence:

- A local subagent reviewed `sample-prompts.json` using the constructed judge prompts and without using
  fixture expected labels as evidence.
- Saved output:
  - `evidence/broad-scope-subagent-prompt-pack/subagent-judge-review.json`
  - `evidence/broad-scope-subagent-prompt-pack/subagent-judge-comparison.json`
- Judge-only comparison:
  - 19 packet reviews;
  - 5 `LIKELY_BARRIER`;
  - 14 `UNCERTAIN`;
  - 0 unsafe clears;
  - 1 review would convert to a v3 judgment under the current barrier-only structural gate.
- Judge + critic reconciled comparison:
  - 19 packet reviews;
  - critic used for all 19;
  - 3 final `LIKELY_BARRIER`;
  - 16 final `UNCERTAIN`;
  - 0 unsafe clears;
  - 1 review would convert to a v3 judgment under the current barrier-only structural gate.
  - The critic disputed the two motion-control barriers because the packet did not prove parallel/non-essential
    scope or rule out essential-motion exception; this drove the stricter motion required-evidence gate.
- Targeted shortcut subagent validation:
  - a fresh local subagent reviewed the current `shortcut-p1` packet against WCAG 2.2 SC 2.1.4;
  - verdict: `LIKELY_BARRIER`, confidence `high`;
  - saved at `evidence/broad-scope-subagent-prompt-pack/shortcut-p1-subagent-review.json`.
- Targeted motion/context/pointer subagent validation:
  - a fresh local subagent reviewed only the judge-facing packet text for `motion-p1`, `context-p1`, `context-p2`,
    and `pointer-p1`, without answer keys or fixture labels;
  - verdicts: 4 `LIKELY_BARRIER`, 0 unsafe clears;
  - all four were judged evidence-supported, with the publication caveat that context and pointer remain sidecar /
    provisional until registered;
  - the review caught a useful specificity issue: the pointer evidence proves `2.5.2` pointer cancellation, not
    generic `2.5.1` pointer gestures. The validator now writes `sc: "2.5.2"` for generated pointer rows only when
    pointerdown completion plus failed cancellation/reversal is observed, and the regenerated prompt pack exposes
    `pointer-p1` as `2.5.2`;
  - saved at `evidence/broad-scope-subagent-prompt-pack/motion-context-pointer-subagent-review.json`.
- Targeted forced-colors non-text visual validation:
  - a fresh local subagent reviewed only the judge-facing `fcn-p1` packet plus the before/forced-colors screenshots,
    without answer keys or fixture labels;
  - verdict: `LIKELY_BARRIER`, `evidence_ok: true`, `visual_agreement: true`;
  - reasoning matched the measured evidence: the before image has a clear bordered icon button, while the
    forced-colors image loses the icon and meaningful boundary/affordance;
  - saved at `evidence/broad-scope-subagent-prompt-pack/forced-colors-nontext-subagent-review.json`.
- Targeted reduced-motion exception/control validation:
  - a fresh local subagent reviewed only constructed packet facts plus screenshots for `rm-n5` and `rm-n8`, without
    answer keys or fixture labels;
  - `rm-n5` verdict: `LIKELY_OK`, because trusted control evidence showed the visible "Pause animation" control was
    clicked and affected `#target`;
  - `rm-n8` verdict: `LIKELY_OK`, because the packet facts marked the motion as essential, not parallel
    non-essential, and the context described it as the only progress indication for a required security check;
  - both remain sidecar review outcomes. The harness still does not publish broad-scope `LIKELY_OK` reviews as v3
    clears;
  - saved at `evidence/broad-scope-subagent-prompt-pack/reduced-motion-exception-subagent-review.json`.
- Interpretation:
  - This is a useful no-human LLM safety signal: the stand-in judge refused most detector-only or
    exception-incomplete packets.
  - It also confirms the fixture reviewer criticism: the corpus currently provides 10/10 detector rows per aspect,
    not 10/10 semantically diverse judgment-ready cases per aspect.

Flash-risk adversarial review:

- Saved output:
  - `evidence/broad-scope-subagent-prompt-pack/flash-risk-adversarial-review.json`
- Earlier findings:
  - the prior flash probe was opacity-centric and could miss color/background/canvas/video/class/keyframe flashes;
  - the runtime sampler is vulnerable to aliasing because nominal step intervals are not equivalent to actual
    rendered-frame timestamps;
  - the generated area/red checks are fixture proxies, not full WCAG 2.3.1 area and saturated-red threshold math;
  - computed opacity must not be accepted without rendered pixel agreement, viewport intersection, and occlusion
    checks;
  - the 10/10 flash fixture set was one repeated happy path, not broad coverage.
- Implemented response in the first prompt-pack pass:
  - removed answer-label fallback from prompt/pressure builders;
  - separated `answer-key.json` from judge-facing prompt packs;
  - threaded measured evidence claims through validators where the validator proves the required facts.
- Implemented response in the flash follow-up:
  - `probeFlashTemporal` now samples opacity, background luminance, and red-like state over time;
  - generated flash fixtures now cover large opacity flashes, color-only red/black flashes, small red flashes, slow
    controls, small non-red fast controls, and low-delta fast color controls;
  - validation records transition basis, opacity/luminance/red-state crossings, measured Hz, generated area, and
    red-threshold risk.
- Targeted flash threshold subagent validation:
  - a fresh local subagent reviewed only constructed packet facts plus contextual screenshots for `flash-p5`,
    `flash-p8`, and `flash-n5`, without answer keys or fixture labels;
  - verdicts: `flash-p5` `LIKELY_BARRIER`, `flash-p8` `LIKELY_BARRIER`, `flash-n5` `LIKELY_OK`;
  - the judge explicitly treated still screenshots as contextual and relied on temporal sample facts for the
    verdicts;
  - saved at `evidence/broad-scope-subagent-prompt-pack/flash-threshold-subagent-review.json`.
- Remaining position:
  - generated flash packets are useful as fixture-scoped temporal evidence and prompt plumbing tests across opacity
    and color/luminance variants;
  - arbitrary saved-page `2.3.1` remains review/uncertain until there is real rendered-frame sampling, sliding
    one-second timing windows, visual agreement, viewport/occlusion checks, canvas/video discovery, and WCAG
    area/red-threshold math.

Adversarial lesson from pressure runs:

- A low packet count on ordinary pages is not a correctness guarantee; it can also mean broad-scope recall is weak.
- A high packet count on generated auth/media pages is not necessarily detector noise; some WCAG/TT/EN surfaces are
  review-first by nature.
- Therefore the next scaling metric should not be raw packet count alone. Track:
  - packets per unique target;
  - duplicate packet families per target;
  - packets that can become registered v3 judgments;
  - packets that remain sidecar-only;
  - LLM critic-disputed clear rate;
  - human/LLM annotation minutes per packet family.
- Broad-scope failures must be interpreted as missing evidence, not as clean pages. The pressure output now records
  `failed`/`manifestFailed`; strict v3 publication should continue to avoid conformance conclusions from a failed
  sidecar.

## Broader WCAG / Trusted Tester / EN Support Strategy

The broad-scope work should remain a sidecar-first expansion, not a second conformance engine. The existing v3
features are strongest when a finite target, state, action, and predicate can be independently enumerated. Many
WCAG/Trusted Tester/EN requirements do not have that shape in a single saved page.

Recommended lanes:

| Lane | Examples | Harness support | Publication posture |
|---|---|---|---|
| Single-state deterministic | viewport zoom restriction, text clipping after spacing/resize, forced-colors opt-out, obvious media markup inventory | deterministic probes + bounded packets | sidecar review; promote only after finite predicate + adversarial fixtures |
| Trusted interaction | focus/input context changes, pointerdown activation, keyboard shortcut surfaces, drag/pointer alternatives | real input probes on fresh pages | barrier packets when positive state deltas exist; clears require explicit alternative/exception evidence |
| Temporal/non-interference | autoplay audio, pause/stop/hide, flashing, moving/blinking content | time-sampled probes + media state | never clear from absence; flash needs full threshold/area math before definite verdict |
| Process/site-set | complete processes, repeated entry, consistent help/navigation/title across pages, timeouts | manifests and multi-page/session traces | scope warnings/review packets until a process manifest or crawler can prove coverage |
| Semantic adequacy | media alternatives, captcha alternatives, accessible authentication alternatives, plain-language/cognitive support | LLM judge + critic over bounded evidence | sidecar or provisional only; critic dispute -> `UNCERTAIN` |
| Platform/user preference / EN | forced colors, reduced motion, zoom/reflow, user preference support, non-web ICT adjacencies | browser emulation + static policy probes | EN-specific sidecar unless mapped to a registered WCAG family |

Trusted Tester implications:

- TT-style visually apparent structure, labels, lists, table associations, form instructions, and error messages can
  use the existing skill/rubric approach, but should keep the current v3 rule: a deterministic detector may nominate
  evidence; the LLM/human judges semantic adequacy.
- TT process-oriented checks should not be reduced to page-local verdicts. Use process/site-set manifests, saved
  navigation traces, or explicit crawl sessions.
- TT list/structure gaps already have local precedent in `scripts/v3/lib/collect-lists.js`; broad-scope should reuse
  that style: collect visual/DOM evidence, avoid conformance claims from missing semantics unless the visual
  relationship is positively established.

EN implications:

- EN 301 549 includes WCAG-derived web requirements plus platform/user-preference and ICT-context requirements.
  For web snapshots, the harness should record EN-adjacent evidence such as forced-colors/user-preference survival,
  but not publish EN conformance unless the requirement is explicitly registered and scoped.
- `EN-C.9.7` forced-colors evidence is therefore correct as sidecar-only today.

Compatibility with existing features:

- Do not widen `RESULT-CONTRACT` or the v3 obligation ledger just because a broad-scope packet exists.
- Do not create page-level rollups for process/site findings.
- Keep broad-scope packets identity-bound in the evidence bundle and summarized in results, but keep long-form
  LLM rationale out of strict results.
- Promote one family at a time only after:
  - finite applicability predicate;
  - positive-support rule rather than contradiction-only rule;
  - adversarial positive/negative fixtures;
  - saved-page pressure run;
  - duplicate/queue-load analysis;
  - critic-disputed false-clear tests.

## Current LLM-Judgment Position

Assumption for the next phase: no human in the loop; LLM handles judgment and final outcome is delivered to a
human only afterward.

Design consequence:

- The LLM must not be asked to infer facts from absence.
- The LLM receives evidence packets with:
  - deterministic observation;
  - visual reference/agreement where relevant;
  - scoped warning;
  - applicability question;
  - explicit exceptions to check.
- A missing evidence packet or disagreement between geometry/CSSOM/pixels should produce `PARTIAL`, not a clear.

Added procedure module:

- `scripts/v3/lib/broad-scope-llm-review.js`

Added tests:

- `scripts/v3/tests/broad-scope-llm-review.test.js`

Procedure:

1. Build a strict judge prompt from the evidence packet.
2. Build an adversarial critic prompt from the same packet plus the proposed verdict.
3. Reconcile:
   - judge barrier + critic agrees -> `LIKELY_BARRIER`;
   - judge clear + critic agrees -> `LIKELY_OK`;
   - critic disputes, malformed judge, malformed critic, or missing evidence -> `UNCERTAIN`.
4. Optional v3 bridge:
   - convert only registered SC/family/target `LIKELY_BARRIER` reviews into `judgments.json`;
   - require structural evidence claims covering the packet's required evidence before conversion;
   - keep `LIKELY_OK` and `UNCERTAIN` broad-scope reviews in sidecar rationale, not the v3 obligation ledger;
   - let the existing judgment processor create structured `source:'llm'` shadow observations;
   - let the existing provisional machinery fill only independently enumerated obligations as provisional barriers;
   - leave EN/process/site/cognitive research findings in the broad-scope sidecar.
5. Corpus-scale mock review:
   - build packets for all generated rows;
   - inject judge/critic functions instead of making a network call;
   - persist `broadScopeRationale` records for both converted and sidecar-only packets;
  - convert only registered barrier packets into `judgments`.

Packet discipline:

- `pointer-gesture` is grounded in [WCAG 2.2 SC 2.5.1 Pointer Gestures](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html):
  author functionality that uses a
  path-based or multipoint gesture needs a single-pointer alternative that does not depend on a path-based gesture,
  unless the gesture is essential. The current probe covers a generated path-gesture subset only; it does not yet
  emulate true multipoint touch gestures or discover arbitrary unmarked alternatives.
- `audio-control` requires positive audible-autoplay and duration/control evidence; static autoplay markup is only
  an applicability risk. The generated fixture lane now observes known non-silent tone playback across >3 seconds
  and checks native/plausible custom controls before adding `audible-autoplay-more-than-three-seconds` and
  `no-independent-control`. Generic saved-site media without audibility proof remains review/uncertain.
- `flash-risk` requires rendered temporal frame sampling for a definite threshold judgment; CSS names, computed
  opacity, and still screenshots are review risk only. The current generated-fixture probe can separate opacity,
  background-luminance, red-state, small-red, small non-red, slow, and low-delta generated cases, but it does not
  implement general WCAG area/red-threshold math, actual timestamped rendered-frame cadence, viewport/occlusion
  checks, or canvas/video flash discovery.
- `motion-control` / `pause-stop-hide` now distinguishes uncontrolled persistent motion from persistent motion with
  an exercised visible pause/stop/hide control. The generated positive fixtures also carry explicit
  `parallel-non-essential-content` evidence, so they can bridge as provisional barriers. Saved-page motion still does
  not auto-prove semantic exceptions such as essential motion or whether the motion is presented in parallel with
  other content; the v3 bridge requires explicit `parallel-non-essential-content` evidence before converting a
  motion barrier.
- `context-change` and `pointer-operation` require trusted action/state deltas; screenshots alone are insufficient.
  The current probes now record focus/input/change-triggered state changes and pointerdown-before-pointerup
  activation. The dynamic pointer proof is scoped to `2.5.2` pointer cancellation; the new pointer-gesture probe
  separately covers a fixture-scoped `2.5.1` path-gesture subset with trusted path movement, simple-click,
  same-function alternative, and exception evidence. The dragging-movement probe separately covers a fixture-scoped
  `2.5.7` subset with trusted drag, simple-click, same-function alternative, and exception evidence. Multipoint
  gesture proof remains future work.
- `character-shortcut` now has a trusted dynamic keyboard probe: positives must show a real single printable
  character key changing page state from a non-input focus context, plus no visible off/remap/focus-scope exception.
  Negative fixtures include no-shortcut, focus-scoped, off-control, and modified-key cases.
- `media`, `auth`, `process`, and `site-set` packets remain semantic/flow review unless a registered v3 family and
  finite applicability predicate exists.

This simulates the no-human-in-loop LLM procedure without calling external Claude. It specifically tests the high-risk
case where a proposed clear is based on absence of evidence; the critic disputes it and the reconciler collapses it
to `UNCERTAIN`. Even if a broad-scope clear is agreed by judge and critic, it remains sidecar-only. Even for barriers,
the bridge refuses conversion unless the packet has structural evidence coverage for the required facts.

## Broader WCAG / Trusted Tester / EN Roadmap

This update intentionally looks beyond the ACT subset and the current FN/FP cases. The inputs are:

- WAI aspect inventory: `docs/reference/WAI-PEOPLE-USE-WEB-ASPECTS.md`.
- Taxonomy coverage comparison: `docs/reference/WAI-COVERAGE-COMPARISON.md`.
- Trusted Tester gap analyses: `docs/analysis/TRUSTED-TESTER-GAP-ANALYSIS*.md`.
- EN Annex C analysis: `docs/analysis/en301549/EN301549-ANNEX-C-ANALYSIS.md`.
- Current broad-scope sidecar code: `scripts/v3/lib/broad-scope-probes.js` and
  `scripts/v3/lib/broad-scope-llm-review.js`.

The design principle is the same as v3: broaden discovery and evidence, but do not let new broad-scope probes
become authoritative conformance results until they have finite applicability, adversarial fixtures, and a
registered bridge. New lanes should initially produce sidecar packets, review candidates, or process/site-scope
artifacts only.

| Theme | Current state | Best next support pattern | Main risk | Safety rail |
|---|---|---|---|---|
| Full-page / scrolled structure vision | A first `visual-structure-discovery` sidecar now finds generated non-semantic visual headings/lists/tables and attaches visual refs; full-page/tiled saved-site vision is still deferred | Next: add full-page/tiled capture and richer OCR/vision discovery for below-fold, canvas/SVG, pseudo-rendered, and responsive structure | More visual false positives on decorative layout | Discovery only; per-region rubric must cite crop + DOM/AX target; no page clear from absence; discovery verdicts hard-clamped to `UNCERTAIN` |
| Reveal-state discovery | Sidecar discovery prototype now activates generated disclosures/tabs/details/menus/dialog-like controls and emits review packets only; no v3 `dynamicSubject` emission yet | Next: promote the discovery output into bounded `dynamicSubjects`, then re-run structure/focus/name-role-value checks inside the revealed state | State explosion, wrong-state attribution, and treating discovery as a barrier | Per-control cap, fresh reload, stable selector identity, stateReached/new-visible-node gate, no clear if reveal not reached, discovery packets default `UNCERTAIN` |
| User preferences / adaptation | Text spacing, resize text, forced-colors, reduced motion sidecar lanes exist; forced-colors text-loss fixtures now validated | Extend forced-colors beyond text to state/boundary/focus loss; add no-author-CSS/custom-font/custom-color checks where feasible | Browser-emulation monoculture; visual semantics overreach | Keep EN-C.9.7 sidecar-only; require before/after pixel or computed evidence plus visual target |
| Non-interference | Keyboard trap has the strongest bridge; motion/audio/flash are sidecar or review-only | Prioritize 1.4.2 audible autoplay, 2.2.2 persistent non-essential motion, 2.3.1 flash thresholds, 2.1.2 trap hardening | Temporal sampling errors; autoplay/offline under-hydration | Barrier-only or UNCERTAIN; require threshold measurement and control-search evidence |
| Media alternatives | Fixture-scoped media packets now carry row-level `1.2.x` SC, media content model, tracks/transcript links, and token-coverage adequacy facts for captions/transcripts/descriptions | Replace fixture metadata with real VTT/transcript extraction, sampled media/OCR/audio description evidence, and SC-specific quality rubrics before any promotion | Metadata adequacy can overfit; real caption timing, speaker identity, meaningful sound, and description quality remain semantic | Sidecar-only; preserve row-level SC; no clear from no warning; 1.2.5 requires audio-description-specific evidence |
| Process / site-set scope | Structured manifest analyzers now cover 10/10 generated positive and 10/10 generated negative controls for complete-process and site-set consistency; single-page corpus still cannot infer these scopes by itself | Support optional flow manifests and page-set manifests from saved-site crawls/session traces; eventually add a flow orchestrator that can prove all required process pages/states were visited | Treating incomplete manifests as page conformance, or treating a clean single page as process/site-set conformance | Process/site artifacts separate from page results; missing manifest = scope warning, not pass; packets remain sidecar-only and convert no v3 judgments |
| Cognitive / understandable content | Plain-language research packets exist; no conformance bridge | Keep as research/triage: reading level, acronyms, metaphors, timeout burden, authentication burden, complex process flags | Over-medicalized or subjective LLM verdicts | No direct WCAG A/AA conformance bridge except specific SCs like 3.3.7/3.3.8 with positive facts |
| Pointer and speech-input support | Character shortcuts, pointer-operation, pointer-gesture, label-in-name, target-size-minimum, and fixture-scoped dragging-movement probes exist | Extend pointer/drag beyond generated targets, add multipoint gesture tests, speech-control review, and target-size exception hardening | False clears from untried alternatives; exception complexity | Trusted pointer sequence + target-bound alternative search; visible-label/name evidence; target-size exceptions default UNCERTAIN |
| Native dialogs and live announcements | Status-message fixtures/probe now cover trusted visible status updates, status removal, icon status intent, role/live/focus channels, direct announcement hooks, HTML dialog context, native alert context, disclosure context, and late async status updates | Add real-AT speech calibration and richer live-region replacement/mutation timing; keep direct `document.ariaNotify` support behind observed API/call evidence | Late async announcements, stale repeats, and confusing dialog/focus-management issues with 4.1.3 | Symmetric settle window; selector-based trusted actions; no failure unless a visual/status event is positively observed and no programmatic/focus/dialog/disclosure channel is present |
| EN / Section 508 conformance scope | EN web criteria are WCAG pass-through; EN adds full-page, complete-process, accessibility-support, non-interference, user-preference scope | Keep web harness scoped to web-page evidence; add disclosures for truncation, process incompleteness, AT-support assumptions | Accidentally implying EN conformance from element annotations | Publication language and schema must preserve `scope`, `coverageTruncated`, and sidecar-only status |
| Non-web ICT / documents / software | EN C.10/C.11 and closed-functionality requirements are outside current web snapshot pipeline | Treat as separate pipelines or imported evidence classes, not extensions of page obligations | Breaking web assumptions by forcing non-web requirements into DOM model | Explicit scope boundary; separate contracts if added later |
| Documents and rich embedded content | PDFs, office documents, EPUBs, embedded viewers, canvas/SVG-heavy apps, and downloadable media can contain WCAG/EN-relevant barriers outside ordinary DOM facts | Add imported-evidence adapters only when the artifact is in scope: document text/structure extraction, media metadata, canvas/OCR/vision discovery, and viewer-state provenance | Mixing source-document conformance with web-wrapper conformance | Record artifact type, extraction tool/version, page/viewer state, and never roll document findings into a web-page pass without an explicit scope decision |
| Real AT / accessibility support | CDP AX-tree is a proxy, not an accessibility-supported proof across AT/browser combinations | Keep headless AX as default; add optional real-AT spot-check lane for promoted mechanisms or disputed gold cases | Operational fragility and platform monoculture | Real-AT evidence is calibration/spot-check unless a full support matrix is declared |

Practical sequencing:

1. Treat ACT as only one calibration input. The generated matrix, Trusted Tester gap notes, WAI user-aspect
   inventory, EN scope analysis, saved-site pressure data, and human annotation needs should all feed the same
   sidecar evidence program. ACT tells us whether a tool/rule matches known atomic examples; it does not cover
   process scope, page-set consistency, platform preferences, real-user workflows, or many semantic adequacy cases.
2. Keep strengthening the generated matrix without ACT: forced-colors now has 10 positive/10 negative text-loss
   fixtures plus 10 positive/10 negative non-text boundary-loss fixtures, and audio-control now has 10 positive/10
   negative generated non-silent playback fixtures with >3s measured state. Reduced-motion negatives now include
   media-query compliance, working pause controls, and essential-motion exceptions. Status-announcement,
   label-in-name, target-size-minimum, pointer-gesture, and dragging-movement now each have 10 positive/10
   negative fixtures. Next do arbitrary-media audibility, rendered-frame flash area/red threshold, real-AT/live-region
   speech calibration, live-region replacement timing fixtures, and multipoint gesture fixtures.
3. Add discovery producers only where the v3 ledger already has a safe ingestion path: reveal-state
   `dynamicSubjects`, page-vision discovered regions, optional process/site manifests.
4. Preserve the publication boundary: broad-scope artifacts may create packets and provisional sidecar judgments,
   but only registered claim families with structural evidence coverage can bridge into v3 judgments.
5. Treat LLM/human interpretation as a semantic reducer over positive evidence, not as a finder of hidden passes.
   In particular, no clean broad-scope packet should ever mean "the page passes"; it means only "this bounded
   candidate did not prove a barrier."

### 2026-06-22 update: reveal-state discovery sidecar

Implemented a first reveal-state discovery lane in the actual broad-scope harness:

- `probeRevealStates` activates disclosure-like controls with trusted clicks on a fresh page and records
  before/after state plus newly visible nodes.
- `runBroadScopeForUrl` emits `reveal-state-discovery` findings as sidecar/shadow evidence only.
- The LLM packet aspect routes to WCAG `1.3.1`, `2.4.3`, `2.4.10`, and `4.1.2`, but explicitly instructs the
  judge to return `UNCERTAIN` from reveal discovery alone unless downstream conformance evidence is also present.
- The deterministic prompt pressure scripts now expect `UNCERTAIN_DISCOVERY` for positive reveal packets and
  `NO_PACKET_SCOPED_OK` for scoped negatives; no reveal packet bridges into v3 judgments.

Adversarial hardening added during subagent review:

- no-id controls now use stable `nth-of-type` CSS paths, so repeated unlabeled buttons do not collapse to the
  first matching `button`;
- adjacent/implicit reveal controls can be discovered, but are marked as discovery evidence rather than
  programmatic-state proof;
- the diff requires newly visible nodes, not merely text changes on already-visible nodes;
- closed `<details>` visibility is modeled explicitly so children of closed details do not appear visible just
  because Chrome reports layout boxes;
- `4.1.2` was added to the raw SC/related-SC routing so name/role/value follow-up is not under-routed.

Evidence:

- Chrome fixture validation:
  `scripts/v3/tests/generated/broad-scope/non-interference-interaction/validation.json` now has 260/260 passing
  rows, including 10/10 reveal positives and 10/10 reveal negatives.
- Chrome probe tests:
  `node --test scripts/v3/tests/broad-scope-probes.test.js` passed 33/33, including the adversarial repeated-control
  and implicit-adjacent-reveal case.
- Prompt-pack audit:
  `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/integration-audit.json`
  reports 20 reveal rows, 10 packet entries, 10 no-packet entries, expected directions
  `{UNCERTAIN_DISCOVERY:10, NO_PACKET_SCOPED_OK:10}`, and 0 bridgeable barrier/clear judgments.
- Packet pressure:
  `docs/analysis/improvement-research-2026-06/evidence/broad-scope-stratified-packet-pressure/results.json`
  reports reveal verdicts `{UNCERTAIN:10, NO_REVIEW:10}`, related SCs `{1.3.1, 2.4.3, 2.4.10, 4.1.2}`, and
  0 converted judgments.
- Visual evidence:
  `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/manifest.json`
  now contains all 20 reveal screenshots/state captures. Manual vision checks confirmed agreement for menu/dialog
  positives (`reveal-p4`, `reveal-p5`) and already-open/broken negatives (`reveal-n5`, `reveal-n7`).
- Independent subagent critique/remediation record:
  `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/reveal-state-subagent-review.json`.

Remaining limitation: this is still a discovery sidecar, not the full TT G4/dynamic-subject implementation. It does
not yet emit revealed nodes into the v3 obligation ledger, does not rerun focus order or structure/name-role-value
checks inside every revealed state, and does not yet cover keyboard-only reveals, hover/focus reveals, long
transitions, shadow DOM, iframes, or bounded state-combination exploration. Absence of a reveal packet is not a pass.

### 2026-06-22 update: visual-structure discovery sidecar

Implemented a first rendered-structure discovery lane in the actual broad-scope harness:

- `probeVisualStructureDiscovery` finds rendered heading-like text, bullet-like groups, and grid/table-like layouts
  that are not expressed as programmatic headings, lists, or tables/grids.
- `runBroadScopeForUrl` emits `visual-structure-discovery` findings as sidecar/shadow evidence only.
- The LLM packet aspect routes to WCAG `1.3.1` and `2.4.6`, with `2.4.10` explicitly labelled as optional AAA
  follow-up rather than EN/WCAG A-AA baseline publication scope.
- Discovery-only aspects (`reveal-state-discovery` and `visual-structure-discovery`) are now code-clamped to
  `UNCERTAIN` after judge/critic reconciliation, even if both model calls agree on `LIKELY_BARRIER`.
- The prompt-pack audit now fails if a positive visual-structure packet is missing its visual reference when visual
  captures exist.

Evidence:

- Chrome fixture validation:
  `scripts/v3/tests/generated/broad-scope/non-interference-interaction/validation.json` now has 280/280 passing
  rows, including 10/10 visual-structure positives and 10/10 visual-structure negatives.
- Chrome probe tests:
  `node --test scripts/v3/tests/broad-scope-probes.test.js` passed 34/34, including rendered non-semantic
  heading/list/grid positives and semantic heading/list/table/large-button negatives.
- LLM review tests:
  `node --test scripts/v3/tests/broad-scope-llm-review.test.js` passed 14/14, including the discovery-only
  hard-clamp regression.
- Prompt-pack audit:
  `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/integration-audit.json`
  reports 500 total prompt entries. Visual-structure has 20 rows, 10 packet entries, 10 no-packet entries,
  expected directions `{UNCERTAIN_DISCOVERY:10, NO_PACKET_SCOPED_OK:10}`, 0 bridgeable barriers/clears, and
  0 missing expected visual refs.
- Packet pressure:
  `docs/analysis/improvement-research-2026-06/evidence/broad-scope-stratified-packet-pressure/results.json`
  reports visual-structure verdicts `{UNCERTAIN:10, NO_REVIEW:10}` and 0 converted judgments.
- Visual evidence:
  `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/manifest.json`
  contains all 20 visual-structure screenshots/state captures. Manual vision checks confirmed agreement for
  visual heading/list/table positives (`vstruct-p1`, `vstruct-p4`, `vstruct-p8`) and semantic heading/list/table
  negatives (`vstruct-n1`, `vstruct-n4`, `vstruct-n8`).
- Independent subagent critique/remediation record:
  `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/visual-structure-subagent-review.json`.

Remaining limitation: this is a heuristic discovery lane, not full-page visual structure judgment. It does not yet
cover tiled/full-page OCR, canvas/SVG text, CSS counters, flex tables, card-title false positives, responsive
breakpoints, shadow DOM, iframes, or saved-site pressure. It also does not prove a WCAG failure by itself: a model
or downstream deterministic check still has to decide whether the visual grouping is meaningful and whether the
programmatic relationship is required.

## Remaining Work

Not complete yet:

- Expand known-SC mappings beyond the proven bridgeable fixture lanes (`2.1.2`/`no-keyboard-trap` and generated
  `2.2.2`/`motion-control`) only after each family has a finite applicability predicate and adversarial fixtures.
  The generated motion fixtures now have parallel/non-essential scope evidence; arbitrary saved-page motion still
  remains sidecar unless that scope evidence is positively observed.
- Add independent critic-pass mock-agent tests:
  - more per-aspect proposed verdicts;
  - more false-negative attacks;
  - disagreement forces `UNCERTAIN` / `PARTIAL`.
- Add more visual/pixel agreement automation for motion and arbitrary saved-page forced-colors cases beyond the
  generated fixture contrast-loss lane.
- Run a larger saved-site pressure pass on the actual saved website corpus once it is selected, not just the mixed
  ACT/fixture sample above.
- Extend the completed stratified generated pressure pass with more adversarial variants per aspect, especially
  cases where a positive surface is present but an exception/alternative should prevent a barrier judgment.
- Add work-queue deduplication for multi-packet media/auth targets before any human/LLM annotation run.
- Regenerate richer judgment-ready fixture variants from the existing matrix scenarios, not repeated templates:
  - forced-colors now has generated visible text-loss and non-text boundary-loss lanes; add richer state/focus-loss
    variants beyond the current icon-button boundary case;
  - audio generated positives now have deterministic known-tone playback/duration/control evidence; arbitrary saved
    pages still need true audibility and external-control instrumentation;
  - flash positives now include opacity, color/luminance, small-red, small non-red, and low-delta controls; remaining
    adversarial classes include CSS keyframes with innocuous names, JS class swaps, canvas/video flashes,
    multi-region flashes, occluded/clipped flashes, real rendered-frame pixel changes, and sampling-phase aliasing;
  - authentication, redundant-entry, process, site-set, and cognitive cases need explicit exception/control facts.
- Add richer dynamic probes before promotion:
  - audibility/duration proof for `1.4.2`;
  - rendered-frame WCAG flash threshold/area math for `2.3.1`, using actual timestamps, sliding one-second windows,
    relative luminance / saturated-red transitions, viewport/occlusion checks, and contiguous flashing-area grouping;
  - framework/event-listener state-change discovery for `3.2.1` / `3.2.2` and pointer/keyboard shortcuts, since
    inline handler discovery will miss SPA behavior;
  - richer arbitrary-page `2.5.7` discovery for author drag widgets, including target-bound alternatives, keyboard
    or text-field alternatives, and clear separation of essential/user-agent-provided dragging exceptions;
  - richer arbitrary-page `2.5.1` discovery for path/multipoint gestures, including unmarked alternatives,
    multipoint-touch emulation where available, keyboard/text-field alternatives, and independent exception
    adjudication;
  - multi-step process/session traces for `3.3.7`, `3.3.8`, and complete-process requirements;
  - crawler or manifest-backed site-set traces for consistent help/navigation/title requirements.
- Keep broad-scope triage explicitly labeled as a review queue. Downstream consumers must not treat
  `triageCandidates` or `broadScopeReviewPackets` as barriers.

The important progress is that broad-scope evidence now flows through the real v3 artifact/build path, has a
validated 500-row generated fixture corpus, has representative visual inspection evidence, and has a mock LLM
judge/critic procedure that fails closed on unsafe clears.
