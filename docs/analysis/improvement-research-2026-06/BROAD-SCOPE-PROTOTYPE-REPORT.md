# Broad-Scope WCAG / Trusted Tester / EN Prototype Report

Date: 2026-06-21

Scope: continue the improvement research without running ACT or Claude-powered experiments. This pass broadens the
analysis beyond the known ACT errors and the item-B discovery lane into WCAG conformance requirements, Trusted Tester
structural gaps, EN 301 549 web conformance scope, and WAI user-needs areas. The work is intentionally local,
deterministic, and reproducible.

## Executive Conclusion

The best next expansion is not another verdict lane. It is a **sidecar evidence layer** that makes broader scope,
state, and process risks visible while preserving v3's existing publication boundary.

The prototype supports this conclusion:

- It can cheaply detect full-page scope risks: caps, cross-origin frames, shadow roots, pseudo-element imagery, media,
  and zoom-restricting viewport policies.
- It can produce useful review candidates for EN/WCAG user-preference and non-interference areas: text spacing,
  forced-colors, reduced motion, autoplay audio, persistent motion, flash-like animation,
  pointer/shortcut/context-change surfaces.
- It can inventory media alternatives and authentication/redundant-entry risks without pretending that track presence,
  password fields, or duplicated labels are themselves conformance judgments.
- The adversarial tests caught two real prototype bugs before the report was written:
  - a page-evaluate helper leaked out of browser context;
  - transcript links were initially associated too broadly across media elements.

The safest integration rule remains:

> New broad-coverage mechanisms should emit `scopeWarnings`, `triageCandidates`, `researchAnnotations`, or
> process/site sidecar findings first. They should not publish a clear or barrier in the v3 element ledger unless
> a finite, positive, independently reconciled support predicate exists.

## Normative Anchors

The local design follows these WCAG/WAI constraints:

- WCAG conformance is for **full pages** and cannot be achieved if part of a page is excluded:
  <https://www.w3.org/TR/WCAG22/#cc1>
- WCAG complete processes require all pages in the process to conform at the specified level:
  <https://www.w3.org/TR/WCAG22/#cc2>
- WCAG accessibility-supported use requires AT/user-agent support, not merely a Chrome AX observation:
  <https://www.w3.org/TR/WCAG22/#dfn-accessibility-supported>
- WCAG non-interference covers content that can block use of the rest of the page, even when that content is not
  otherwise relied upon:
  <https://www.w3.org/TR/WCAG22/#cc5>
- WAI explicitly notes that tools cannot check all accessibility aspects automatically; human judgment is required
  and tools can be false or misleading:
  <https://www.w3.org/WAI/test-evaluate/tools/selecting/#what-evaluation-tools-can-do-and-can-not-do>

Those anchors argue against broad automated PASS claims. They argue for richer evidence and honest boundaries.

## What Was Built

New local prototype module:

- `scripts/v3/lib/broad-scope-probes.js`

New tests:

- `scripts/v3/tests/broad-scope-probes.test.js`

New reproducible runner and fixtures:

- `scripts/v3/tests/manual/run-broad-scope-prototypes.js`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-prototype/fixtures/scope-adaptation.html`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-prototype/fixtures/non-interference.html`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-prototype/fixtures/interaction.html`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-prototype/fixtures/media-auth.html`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-prototype/fixtures/process-site.json`

Generated evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-prototype/observations.json`

## Local Validation

Command run:

```bash
node --test scripts/v3/tests/broad-scope-probes.test.js
```

Result:

- 11 tests passed.
- 8 tests launched real headless Chrome.
- No ACT suite was run.
- No Claude/LLM calls were used.

Evidence generation command:

```bash
node scripts/v3/tests/manual/run-broad-scope-prototypes.js
```

Result:

- Wrote `observations.json` with scope, adaptation, non-interference, interaction, media, authentication, process,
  site-set, and cognitive-review observations.

### 2026-06-22 update: generated fixture matrix and visual-content discovery

The broad-scope prototype now has a larger generated fixture matrix for fixture-scoped sidecar validation. The
current generated matrix covers 26 broad aspects with 10 positive and 10 negative controls each.

Additional commands run:

```bash
node scripts/v3/tests/manual/generate-broad-scope-ni-interaction-fixtures.js
node scripts/v3/tests/manual/validate-broad-scope-ni-interaction-fixtures.js
node --test scripts/v3/tests/broad-scope-probes.test.js
node --test scripts/v3/tests/broad-scope-llm-review.test.js
node scripts/v3/tests/manual/capture-broad-scope-ni-visuals.js
node scripts/v3/tests/manual/build-broad-scope-subagent-prompt-pack.js
node scripts/v3/tests/manual/run-broad-scope-stratified-packet-pressure.js
node scripts/v3/tests/manual/audit-broad-scope-prompt-pack.js
node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js
```

Result:

- 300/300 generated non-interference/interaction fixture validations passed.
- `visual-content-discovery` passed 10/10 positives and 10/10 negatives.
- `broad-scope-probes.test.js` passed 35/35, including real Chrome coverage for the visual-content probe.
- `broad-scope-llm-review.test.js` passed 14/14.
- Prompt-pack audit now covers 520 entries. Visual-content contributes 20 rows: 10 packet entries, 10 no-packet
  entries, 0 barrier-bridgeable, 0 clear-bridgeable, and 0 missing expected visual references.
- Prompt pressure for visual-content yields `{UNCERTAIN: 10, NO_REVIEW: 10}` with 0 converted judgments.

New evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/visual-content-subagent-review.json`

The new `visual-content-discovery` lane is intentionally **discovery-only**. It nominates rendered non-DOM or
partly non-DOM visual surfaces for downstream 1.1.1 / 1.4.1 / 1.4.5 review: pseudo/background image text, canvas
charts, SVG charts, and color-only status cues. It does not decide whether the content fails WCAG. Prompt generation
now constrains discovery-only packets to `allowedVerdicts:["UNCERTAIN"]`, and the review layer still clamps any
attempted discovery-only barrier or clear back to `UNCERTAIN`.

This is a fixture-assisted sidecar, not a general real-page vision system. The current detector still relies on
known elements/markers such as canvas, SVG, background-image-text metadata, or color-only metadata. Adequate
alternative suppression is likewise fixture-proven, not inferred from arbitrary page text. Real saved-site support
still needs full-page/tiled screenshots, OCR or visual-language discovery, canvas/SVG semantic extraction, and a
downstream adequacy rubric before any conformance result can be published.

### 2026-06-22 update: media-alternatives LLM packet hardening

The media-alternatives lane was also reviewed as an autonomous LLM-judgment slice. An independent subagent reviewed
the generated media packets against WCAG 1.2.1 / 1.2.2 / 1.2.3 / 1.2.5, Trusted Tester-style media procedures, and
EN 301 549 web Annex C as WCAG pass-through. The review found that the barrier-side positives were sound, but the
packet contract still over-relied on synthetic fixture metadata and could be misread as a clear/pass path.
A follow-up independent critic then found that the generated fixture path had outpaced the live `runBroadScopeForUrl`
path: live media findings dropped structural evidence/details, mis-scoped all video warnings to `1.2.2`, and let
nearby transcript text satisfy scoped `1.2.2` caption adequacy.

Fixes made:

- `media-alternative-inventory` judge prompts now allow only `LIKELY_BARRIER` or `UNCERTAIN`, not `LIKELY_OK`.
- The prompt includes an SC-specific decision table: 1.2.1 audio/video-only alternatives, 1.2.2 captions,
  1.2.3 audio description or full media alternative, and 1.2.5 audio description.
- The prompt explicitly says to judge only the scoped SC and not infer adjacent 1.2.x pass/fail.
- Media screenshots now have `visualAgreement:null` and are labelled contextual only; measured media state and
  extracted alternatives are load-bearing.
- Generated media controls now include real inline transcript/description fixture content where feasible, and the
  media collector extracts `[data-v3-transcript]`, `details`, and `[data-v3-description-text]` content for adequacy.
- Negative/control rows now emit explicit `SCOPED_MEDIA_CONTROL` packets with
  `adequate-alternative-or-exception-observed`, not no-packet rows.
- The barrier-required evidence key is now `alternative-missing-or-inadequate-observed`; adequate alternatives or
  media-alternative-for-text exceptions remain packet-visible but structurally incomplete for a barrier.
- Review-time `LIKELY_BARRIER` overclaims are clamped to `UNCERTAIN` whenever media packets lack the barrier-specific
  required evidence.
- Live media findings now carry `owned-media-element`, `media-content-model-observed` when a content model exists,
  `alternative-missing-or-inadequate-observed` for actual missing/inadequate alternatives, and the extracted media
  details into the LLM packet. Real pages without a content model still fail closed to `UNCERTAIN`.
- Live warning SC mapping now preserves fixture-scoped `1.2.1`, `1.2.2`, `1.2.3`, and `1.2.5` instead of labelling
  every video warning as captions.
- `1.2.2` caption adequacy no longer falls back to transcript text; transcripts may support media alternatives, but
  they do not satisfy the captions SC.

Verification:

- `node scripts/v3/tests/manual/validate-broad-scope-media-process-auth-fixtures.js`: 120/120 pass, with
  media-alternatives 10/10 positives and 10/10 negatives.
- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 25/25 pass, including media adequate-control and
  overclaim-clamp regressions.
- `node --test scripts/v3/tests/broad-scope-probes.test.js`: 39/39 pass, including live media regressions for
  SC mapping, structural evidence/detail propagation, and transcript-not-caption behavior.
- Prompt-pack audit for media: 20 rows, 20 packets, 10 structurally barrier-ready positives, 10 scoped media controls,
  0 bridgeable clears, and controls missing only `alternative-missing-or-inadequate-observed`.
- Prompt pressure for media: `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, 0 converted judgments.
- Visual inspection of representative captures confirmed target/context agreement: `media-p1` shows a lone video with
  no visible transcript/caption text, `media-n1` shows an equivalent video context where adequacy comes from extracted
  caption metadata, and `media-n2` visibly shows source text plus an explicit media-alternative-for-text label. Pixels
  remain contextual only; extracted media metadata and content-model adequacy are load-bearing.

New evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/media-alternatives-agent-review-input.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/media-alternatives-subagent-review.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/media-alternatives-review-status.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/media-p1-media-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/media-n1-media-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/media-n2-media-page.png`

### 2026-06-23 update: keyboard-trap packet/control hardening

The keyboard-trap lane was hardened as a no-human LLM-judgment slice for WCAG 2.2 SC 2.1.2. The original generated
prompt path had 10 positive packets but 10 no-packet controls, and an independent subagent found that the controls
were synthesized downstream rather than preserved in the source validation ledger. It also found that generated
coverage exercised only the self-refocus detector, not the region/fixed-set trap detectors, and did not pressure
Escape/advised-exit or single-focusable false-positive guards.
A follow-up live-path check found that `runBroadScopeForUrl` was not executing the keyboard-trap detectors at all,
so the generated prompt-pack lane could pass while real saved-page broad-scope runs omitted keyboard-trap packets.

Fixes made:

- `keyboard-trap` judge prompts now allow only `LIKELY_BARRIER` or `UNCERTAIN`; `LIKELY_OK` is clamped out.
- Clean/control rows now emit explicit scoped packets with `trusted-keyboard-navigation-observed` and
  `focus-escape-or-advised-exit-observed`; they intentionally miss the three barrier-required claims.
- The browser-backed validation ledger now records keyboard-trap control evidence and detector details at the
  source, instead of relying on prompt-pack synthesis.
- Generated positives now cover 4 self-refocus traps, 3 region/escape traps, and 3 fixed-set confinement traps.
- Generated controls now include ordinary keyboard navigation, single-focusable non-proof, Escape release,
  keyboard-operable close controls, advised Escape exit, natural modal escape, one-way directional confinement, and
  focus redirection.
- Review-time `LIKELY_BARRIER` overclaims on controls are clamped to `UNCERTAIN`; controls cannot become clears or
  converted authoritative judgments.
- Live `runBroadScopeForUrl` now runs focus-retention, region-escape, and fixed-set-confinement trap detectors and
  emits keyboard-trap findings with structural evidence and detector details.

Verification:

- `node scripts/v3/tests/manual/generate-broad-scope-ni-interaction-fixtures.js`: regenerated the diversified
  keyboard-trap fixture set.
- `node scripts/v3/tests/manual/validate-broad-scope-ni-interaction-fixtures.js`: 300/300 pass, with keyboard-trap
  10/10 positives and 10/10 negatives.
- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 27/27 pass, including keyboard-trap prompt and
  scoped-control overclaim regressions.
- `node --test scripts/v3/tests/broad-scope-probes.test.js`: 39/39 pass, including live `runBroadScopeForUrl`
  keyboard-trap packet emission.
- Prompt-pack audit for keyboard-trap: 20 rows, 20 packets, 10 structurally barrier-ready positives, 10 scoped
  controls, 10 barrier-bridgeable positives, and 0 clear-bridgeable controls.
- Prompt pressure for keyboard-trap: `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, with 10 converted positive barrier
  judgments and 0 converted controls.
- Visual inspection of representative captures confirmed signal agreement: `trap-p8` shows focus confined inside a
  fixed two-button set with an outside link visible; `trap-n3` shows focus returning to the advised Escape target;
  `trap-n2` shows the single focusable retaining focus, which remains a non-proof rather than a barrier.

New evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/keyboard-trap-review-status.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/trap-p8-targeted-after-keys-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/trap-n3-targeted-after-keys-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/trap-n2-targeted-after-keys-page.png`

### 2026-06-22 update: accessible-authentication packet hardening

The accessible-authentication lane was hardened as a generated fixture and packet-review slice for WCAG 2.2
SC 3.3.8. The change is intentionally scoped: it improves review packets for LLM/human annotation, but still does
not publish an authentication conformance verdict.

Fixes made:

- Positive auth fixtures now require explicit evidence of all three barrier predicates: an authentication step, a
  cognitive function test, and missing allowed alternative/exception evidence.
- Negative/control auth fixtures now carry scoped exception/control evidence: password-manager support, passkey or
  magic-link style alternatives, one-time-code autocomplete/paste support, non-cognitive alternatives,
  object-recognition exception, personal-content exception, or explicit not-authentication-step evidence.
- The `accessible-authentication` prompt allows only `LIKELY_BARRIER` or `UNCERTAIN`. It does not allow
  `LIKELY_OK`, because a clean scoped control is not process-wide conformance.
- Prompt-pack, packet-validation, and pressure scripts now emit auth control packets instead of silently dropping
  them as `NO_REVIEW`.

Verification:

- `node scripts/v3/tests/manual/validate-broad-scope-media-process-auth-fixtures.js`: 120/120 pass, with
  accessible-authentication 10/10 positives and 10/10 negatives.
- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 16/16 pass.
- `node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js`: accessible-authentication produced 20
  packets: 10 `LIKELY_BARRIER`, 10 `UNCERTAIN`, 0 converted judgments.
- Prompt-pack audit for accessible-authentication: 20 rows, 20 packet entries, 10 structurally barrier-ready
  positives, 10 scoped auth controls, 0 bridgeable barriers/clears.
- Prompt pressure for accessible-authentication: `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, 0 converted judgments.

New evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/accessible-authentication-agent-review-input.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/accessible-authentication-review-status.json`

Remaining limits:

- Fresh representative auth screenshots and independent subagent critique are pending because browser/subagent quota
  was exhausted during this pass.
- The lane still does not drive a real authentication process, use test credentials, prove CAPTCHA-equivalent
  alternatives, or establish process-wide conformance. Absence of an auth packet must never read as a pass.

### 2026-06-22 update: redundant-entry packet hardening

The redundant-entry lane was hardened as a generated fixture, browser-validation, prompt-pack, and visual-inspection
slice for WCAG 2.2 SC 3.3.7. The previous version detected duplicate field-like keys but did not carry the
normative evidence needed by the LLM packet contract.

Fixes made:

- Generated redundant-entry fixtures now cover 10 barrier variants and 10 control/exception variants.
- Positive packets require all four SC 3.3.7 predicates: same process, same information previously entered or
  provided, required re-entry, and no auto-populate/selection/exception evidence.
- Negative/control packets expose exception or non-applicability evidence: auto-populated reuse, available
  selection, different process, not previously provided, optional re-entry, security purpose, invalid-data
  correction, essential purpose, not redundant entry, and user-confirmed reuse.
- The `redundant-entry-review` prompt allows only `LIKELY_BARRIER` or `UNCERTAIN`, not `LIKELY_OK`.
- The auth detector was tightened so generic `postal code` fields no longer create stray authentication-code
  candidates.
- The real `runBroadScopeForUrl()` path now preserves candidate `evidenceClaims` / `evidenceStrength`; the earlier
  fixture path was correct, but real URL-side packets could lose the SC 3.3.7 predicates.
- Broad-scope review now hard-clamps judge output to per-aspect `allowedVerdicts`, so media/auth/redundant-entry
  sidecar packets cannot retain a disallowed `LIKELY_OK` even if an injected judge and critic agree.

Verification:

- `node scripts/v3/tests/manual/validate-broad-scope-media-process-auth-fixtures.js`: 120/120 pass, with
  redundant-entry 10/10 positives and 10/10 negatives.
- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 18/18 pass.
- `node --test scripts/v3/tests/broad-scope-probes.test.js`: 35/35 pass, including the real `runBroadScopeForUrl`
  claim-propagation assertion and the postal-code non-auth regression.
- `node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js`: redundant-entry produced 20 packets:
  10 `LIKELY_BARRIER`, 10 `UNCERTAIN`, 0 converted judgments.
- Prompt-pack audit for redundant-entry: 20 rows, 20 packet entries, 10 structurally barrier-ready positives,
  10 scoped redundant-entry controls, 0 bridgeable barriers/clears.
- Prompt pressure for redundant-entry: `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, 0 converted judgments.
- `node scripts/v3/tests/manual/capture-broad-scope-ni-visuals.js`: visual manifest includes all 20
  redundant-entry cases. Representative visual inspection confirmed agreement for `redundant-p1`
  (required repeated email), `redundant-n1` (auto-populated reused email), and `redundant-n10`
  (user-confirmed “Use same as shipping” reuse).

New evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/redundant-entry-review-status.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/redundant-p1-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/redundant-n1-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/redundant-n10-before-page.png`

Remaining limits:

- Independent subagent review for this slice was incorporated. It accepted the generated controls as fixture
  semantics, but emphasized that `data-v3-*` metadata is not real process proof without traces/manifests and that
  SC 3.3.7 should not be presented as a current EN 301 549 V3.2.1 clause.
- The lane still relies on fixture metadata for same-process and previously-provided facts. Real saved websites need
  process/session traces or explicit manifests before the packet can be trusted beyond generated controls.
- Absence of a redundant-entry packet must never read as a pass.

### 2026-06-22 update: language/readability cognitive packet hardening

The `language-readability-cognitive` lane was hardened as a generated fixture, browser-validation, prompt-pack,
visual-inspection, and independent-review slice for WCAG 2.2 SC 3.1.5 Reading Level. This is a Level AAA sidecar
only. It is not generally a Trusted Tester or EN 301 549 V3.2.1 web requirement.

Fixes made:

- Generated cognitive/readability fixtures now cover 10 positive and 10 negative/control cases instead of repeated
  long-sentence/acronym clones.
- Positive packets require user-facing required text, reading level above lower secondary after removing proper
  names/titles, language/method support, no supplemental content observed, no lower-secondary version observed, and
  supplement adequacy evaluated.
- Negative/control packets expose supplemental/simple-version/non-required/below-threshold/proper-name-title/
  unsupported-language evidence and resolve to `UNCERTAIN`, not pass.
- The `plain-language-research` prompt allows only `LIKELY_BARRIER` or `UNCERTAIN`; it explicitly forbids relying on
  sentence length, acronym count, or specialized vocabulary alone.
- The collector can extract structured `data-v3-reading-*` fixture evidence while leaving unstructured real-page
  text as conservative research-only candidates.
- Independent review requested split evidence claims and negative-control contradiction checks; both were added.

Verification:

- `node scripts/v3/tests/manual/validate-broad-scope-media-process-auth-fixtures.js`: 120/120 pass, with
  language-readability-cognitive 10/10 positives and 10/10 negatives.
- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 19/19 pass.
- `node --test scripts/v3/tests/broad-scope-probes.test.js`: 35/35 pass.
- `node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js`: language-readability-cognitive produced
  20 packets: 10 `LIKELY_BARRIER`, 10 `UNCERTAIN`, 0 converted judgments.
- Prompt-pack audit for language-readability-cognitive: 20 rows, 20 packet entries, 10 structurally barrier-ready
  positives, 10 controls, 0 bridgeable barriers/clears.
- Prompt pressure for language-readability-cognitive: `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, 0 converted judgments.
- `node scripts/v3/tests/manual/capture-broad-scope-ni-visuals.js`: visual manifest includes all 20 cognitive cases.
  Representative visual inspection confirmed agreement for `cog-p1` (complex required loan language with no support),
  `cog-n1` (plain-language summary), and `cog-n9` (unsupported-language control).

New evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/language-readability-cognitive-review-status.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/cog-p1-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/cog-n1-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/cog-n9-before-page.png`

Remaining limits:

- Fixture `data-v3-reading-*` attributes are synthetic oracle labels, not measured reading-level proof.
- Real saved websites need passage selection, language detection, proper-name/title removal records, language-specific
  readability formulas or qualified review, lower-secondary threshold mapping, and supplemental-content adequacy
  review.
- Absence of a language/readability packet must never read as a pass.

### 2026-06-22 update: complete-process control packet hardening

The `complete-process` lane was hardened so generated clean process controls are no longer invisible to prompt-pack
and pressure testing. The production packet builder still emits no packet for a clean manifest by default, but generated
negative controls can opt into a scoped review packet. Those packets allow only `LIKELY_BARRIER` or `UNCERTAIN`, never
`LIKELY_OK`, and remain structurally incomplete because they intentionally lack
`process-failure-observed`.

An independent critic caught an important normative issue in the first version of this change: missing, duplicated,
unmeasured, or boundary-incomplete process steps were being treated as `LIKELY_BARRIER` evidence. That was corrected.
WCAG 2.2 Complete Processes requires all pages in the process to conform at the specified level; a coverage gap proves
uncertainty about that requirement, not an accessibility failure by itself. The current lane therefore distinguishes
`process-coverage-gap-observed` from `process-failure-observed`, and only the latter can make a process packet
structurally barrier-ready. Reference: https://www.w3.org/TR/WCAG22/#cc5

What changed:

- `complete-process` prompts now include explicit rules for WCAG complete-process / EN C.9.6.3 scope: a barrier
  requires positive evidence that a measured page or step in the declared process failed an accessibility requirement;
  process coverage gaps remain `UNCERTAIN`.
- `buildReviewPacketsFromProcessAnalysis(..., { includeControls: true })` emits clean control packets for generated
  negative process rows while preserving the fail-closed default for ordinary clean manifests.
- Prompt-pack, packet-validation, and stratified pressure scripts request process control packets for generated
  negative fixtures and label them as `SCOPED_PROCESS_CONTROL`.
- Generated process positives were changed from manifest-coverage gaps to 10 measured process failures; generated
  process negatives remain 10 clean/exception controls.
- Review-time `LIKELY_BARRIER` overclaims are clamped to `UNCERTAIN` whenever the packet is missing required
  structural evidence, so a bad judge/critic pair cannot leave a coverage-only process packet as a barrier rationale.

Verification:

- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 22/22 pass, including coverage-gap-not-barrier,
  coverage-gap-overclaim clamp, and process-control no-clear regressions.
- `node --test scripts/v3/tests/broad-scope-probes.test.js`: manifest/process/site-set pure tests passed; browser-backed
  tests could not be rerun after the semantic repair because Chrome launch requires escalation and the approval review
  rejected that run in this continuation. The same browser suite passed 35/35 immediately before the semantic split.
- `node scripts/v3/tests/manual/validate-broad-scope-media-process-auth-fixtures.js --json-only-merge`: refreshed JSON
  process/site-set rows without launching Chrome; aggregate validation remains 120/120, with complete-process
  10 positives / 10 negatives and 10 observed positives.
- `node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js`: complete-process now emits 20 packets:
  `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, 0 converted judgments.
- `node scripts/v3/tests/manual/run-broad-scope-stratified-packet-pressure.js`: complete-process pressure gives
  `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, 0 converted judgments.
- Prompt-pack audit for complete-process: 20 rows, 20 packet entries, 10 structurally barrier-ready positives,
  10 scoped process controls, 0 bridgeable clears, and the controls missing only
  `process-failure-observed`.

Remaining limits:

- The process lane is manifest-driven. It does not yet crawl real flows, authenticate, dismiss overlays, or prove that
  the declared process boundary is complete.
- Clean process controls are review controls, not passes. Absence of a complete-process packet must never read as
  complete-process conformance.
- Process evidence is JSON/procedure evidence rather than visual evidence; representative manifests were inspected
  instead of screenshots.

### 2026-06-23 update: site-set consistency control packet hardening

The `site-set-consistency` lane was hardened so generated clean page-set controls are no longer invisible to
prompt-pack and pressure testing. Like complete-process, this is a scope-level JSON/procedure lane, not a page-level
claim. Generated negative controls now opt into scoped review packets that allow only `LIKELY_BARRIER` or
`UNCERTAIN`; they never allow `LIKELY_OK` and never bridge into authoritative v3 judgments.

What changed:

- `site-set-consistency` prompts now include explicit rules for WCAG 2.4.2, 3.2.3, 3.2.4, 3.2.6, and same-name
  link-purpose review surfaces: a barrier requires a user-meaningful inconsistency across pages in the same declared
  set, state, locale, and breakpoint context.
- The analyzer now distinguishes `site-set-scope-gap-observed` from `site-set-inconsistency-observed`. Too-small
  sets, missing URLs, and unproven same-state/breakpoint context are `UNCERTAIN`, not barriers.
- Site-set scope gaps are disqualifying even when another inconsistency is observed in the same packet; this prevents
  missing-URL or unproven-context packets from becoming structurally barrier-ready.
- Same-name link href variance without explicit purpose/context difference is now `site-set-review-gap-observed`,
  not `same-link-name-different-purpose` proof.
- `buildReviewPacketsFromSiteSetAnalysis(..., { includeControls: true })` emits clean control packets for generated
  negative site-set rows while preserving the fail-closed default for ordinary clean manifests.
- Generated `site-p7` was changed from a missing URL scope gap to a missing page title, so the 10 positive fixtures
  are user-facing title/navigation/help/component/link consistency failures rather than manifest coverage gaps.
- Review-time `LIKELY_BARRIER` overclaims are clamped to `UNCERTAIN` whenever required structural evidence is missing.

Verification:

- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 24/24 pass, including site-set control, scope-gap,
  scope-gap-disqualification, href-only link review, and overclaim-clamp regressions.
- `node scripts/v3/tests/manual/validate-broad-scope-media-process-auth-fixtures.js --json-only-merge`: refreshed JSON
  process/site-set rows without launching Chrome; site-set remains 10 positives / 10 negatives with 10 observed
  positives.
- `node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js`: site-set now emits 20 packets:
  `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, 0 converted judgments.
- `node scripts/v3/tests/manual/run-broad-scope-stratified-packet-pressure.js`: site-set pressure gives
  `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, 0 converted judgments.
- Prompt-pack audit for site-set: 20 rows, 20 packet entries, 10 structurally barrier-ready positives, 10 scoped
  site-set controls, 0 bridgeable clears, and the controls missing only `site-set-inconsistency-observed`.

Remaining limits:

- The site-set lane is manifest-driven. It does not yet crawl real page sets, normalize locale/breakpoint/state, or
  prove that the declared set contains all relevant pages.
- Clean site-set controls are review controls, not passes. Absence of a site-set packet must never read as site-set
  conformance.
- Site-set evidence is JSON/procedure evidence rather than visual evidence; representative manifests were inspected
  instead of screenshots.

## Prototype Coverage Table

| Lane | Standards relevance | Prototype result | Evidence strength | Recommended integration |
|---|---|---:|---|---|
| Scope inventory | WCAG full pages, EN C.9.6.2, TT page boundaries | Detects cap risk, cross-origin frames, shadow roots, pseudo backgrounds, media, viewport policy | Strong as metadata | Add `scopeWarnings`; never affects element verdicts directly |
| Process manifest | WCAG complete processes, EN C.9.6.3 | Detects missing/duplicate steps and unmeasurable persisted data; generated clean controls now emit scoped `UNCERTAIN` packets for prompt testing | Strong as manifest validation; real-flow boundary proof still absent | Separate `processFindings`, references page result IDs only; no pass/clear from clean manifests |
| Site-set manifest | 2.4.2, 2.4.4, 3.2.3, 3.2.4, 3.2.6 | Detects page-set title/navigation/help/component/link inconsistencies; generated clean controls now emit scoped `UNCERTAIN` packets for prompt testing | Medium as manifest validation; real page-set boundary proof still absent | Separate `siteSetFindings`; no page-level PASS and no pass/clear from clean manifests |
| Viewport zoom policy | EN C.9.7, 1.4.4 adjacency | Detects `user-scalable=no` / `maximum-scale<2` | Strong static risk | Scope/user-preference warning; candidate for human review |
| Text spacing | 1.4.12 | Detects newly clipped text after WCAG spacing CSS | Medium; viewport/layout-specific | Positive candidate only; clean result is scoped evidence |
| Forced colors | EN C.9.7, 1.4.11 / 2.4.7 adjacency | Uses CDP media emulation; nominates `forced-color-adjust:none`; records style-change count as context | Medium; browser-specific and visual semantics remain | Candidate/review first; no pass from one Chrome variant |
| Reduced motion | 2.2.2 / user preference | Detects persistent motion under `prefers-reduced-motion: reduce` | Medium; essential-motion exception remains semantic | Candidate/review first; barrier only with duration/control proof |
| Autoplay audio | 1.4.2, non-interference | Generated fixtures now prove autoplay known-non-silent media >3s with no native or working independent control; clean controls emit scoped `UNCERTAIN` packets | Medium in generated fixtures; arbitrary saved-page audibility remains unresolved | Requires observed playback, generated/non-silent audibility evidence, and tested custom-control absence before barrier |
| Persistent motion | 2.2.2 | Nominates long/infinite CSS motion and marquee-like surfaces | Medium | Pair with timed observer and pause-control inventory |
| Flash risk | 2.3.1 | Nominates fast flash-like CSS animation | Low-medium | Review only unless frame-sampling threshold is implemented |
| Context-change surfaces | 3.2.1, 3.2.2 | Nominates focus/input/change handlers | Low as static, useful for planning | Needs fresh-clone driven probe and semantic review |
| Pointer/drag surfaces | 2.5.1, 2.5.2, 2.5.7 | Nominates canvas, draggable, pointer/touch/mouse surfaces | Low as static | Triage only; promote narrow down-event subdomain later |
| Character shortcuts | 2.1.4 | Trusted single-key probe with off/remap/focus-only exception checks; 10/10 generated positives bridge as barrier-only, 10/10 controls remain `UNCERTAIN` | Medium in generated fixtures; real-page listener discovery still incomplete | Barrier-only v3 bridge for positive evidence; no clears from absence or controls |
| Status announcements | 4.1.3 | Trusted activation/status-change probe now emits 10/10 positive packets and 10/10 scoped control packets; controls cover live/status/alert/log roles, focus/context movement, dialogs, disclosure, and direct announcements | Medium in generated fixtures; AT/browser announcement support and delayed real-page status flows remain open | Sidecar review only; no v3 bridge or clears until a status-message claim family and AT/accessibility-API derivation are added |
| Target size minimum | 2.5.8 | Geometry probe now emits 10/10 positive packets and 10/10 scoped control packets; controls cover spacing, inline, essential, equivalent, UA-control, and >=24px cases | Medium-strong in generated geometry; real equivalent/essential/UA exception proof remains semantic/attribution-heavy | Sidecar LLM review only here; core v3 deterministic geometry remains the publication path; no broad-scope clears or bridges |
| Visual-content discovery | 1.1.1, 1.4.1, 1.4.5 | Fixture-assisted discovery of pseudo/background text, canvas/SVG charts, and color-only cues without proven alternatives | Medium in generated fixtures; low on arbitrary saved pages | Discovery-only packets constrained to `UNCERTAIN`; downstream rubric/vision/human decides adequacy |
| Media alternatives | 1.2.x | Inventories owned media, scoped content model, tracks, inline transcript/description evidence, and adequacy gaps | Medium in generated fixtures; real media extraction still open | Sidecar LLM review: barrier-or-uncertain only; scoped controls are not passes |
| Authentication/entry | WCAG 2.2 3.3.7 / 3.3.8, 2.2.x, CAPTCHA-related 1.1.1; EN only where the applicable procurement version incorporates the relevant WCAG version | Nominates password/OTP, paste blocking, captcha, timers, repeated fields; generated 3.3.8 and 3.3.7 packets now expose barrier predicates and scoped exception controls | Medium as fixture/prompt evidence; real flows still low without credentials/session traces | Process/flow artifact; sidecar LLM queue only, no single-page conformance verdict |
| Cognitive/readability | WCAG 2.2 AAA SC 3.1.5 / WAI COGA themes; not generally EN 301 549 V3.2.1 web scope | Generated packets now expose reading-level barrier predicates and scoped support/control evidence; real pages remain research-only without measured readability evidence | Medium as fixture/prompt evidence; low on arbitrary saved pages until readability methods and supplement adequacy are implemented | Sidecar LLM queue only; no pass/clear and no non-AAA publication by default |

### 2026-06-24 update: character key shortcut bridge and probe hardening

The `character-shortcuts` lane was upgraded from static shortcut-surface triage to a generated fixture,
browser-validation, prompt-pack, visual-inspection, and barrier-only v3 bridge slice for WCAG 2.2 SC 2.1.4.
The normative rule followed is the WCAG 2.2 Character Key Shortcuts requirement: single printable-character
shortcuts require at least one of turn-off, remap including a non-printable key, or active-only-on-focus.

Fixes made:

- Registered `character-key-shortcut` as the SC 2.1.4 claim family and added explicit registry entries that keep
  the lane barrier-only. `LIKELY_OK` never becomes a v3 judgment.
- `character-shortcut` packets now carry the registered claim family, so structurally complete positives can bridge
  into the existing provisional judgment path.
- The shortcut state oracle now compares a broader visible DOM text/attribute signature, not only fixture globals,
  `#target`, and `#status`.
- Generated fixtures still provide 10 positive and 10 negative/control cases, now including a positive with an
  inert visible off control, a positive whose activation changes a non-status region, true remap-to-modifier
  controls, focus-only controls, no-surface controls, and Control/Alt modified-key controls.
- Shortcut control packets use `fixture-validator-control-proof` rather than `fixture-validator-positive-proof`.
- Visual evidence was refreshed and inspected for representative positives and controls. Screenshots are contextual;
  trusted keyboard/click traces are load-bearing.

Verification:

- `node scripts/v3/tests/manual/validate-broad-scope-ni-interaction-fixtures.js`: 300/300 pass, with
  character-shortcuts 10/10 positives and 10/10 negatives.
- `node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js`: character-shortcuts produced 20 packets:
  10 `LIKELY_BARRIER`, 10 `UNCERTAIN`; positives converted to 10 barrier-only judgments, controls to 0 judgments.
- Prompt-pack audit for character-shortcuts: 20 rows, 20 packet entries, 10 structurally barrier-ready positives,
  10 barrier-bridgeable positives, 0 clear-bridgeable rows.
- Prompt pressure for character-shortcuts: `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, `convertedJudgments: 10`.
- `node scripts/v3/tests/manual/capture-broad-scope-ni-visuals.js`: representative shortcut screenshots refreshed.
- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 32/32 pass.
- `node --test scripts/v3/tests/broad-scope-probes.test.js`: 39/39 pass.
- `node --test scripts/v3/tests/coverage/fifth-pass.test.js scripts/v3/tests/coverage/trusted-tester-gaps.test.js`:
  27/27 pass.

New evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/character-shortcuts-review-status.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/shortcut-p1-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/shortcut-p2-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/shortcut-p3-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/shortcut-n2-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/shortcut-n3-before-page.png`

Remaining limits:

- Real saved-page discovery is still incomplete for document/window listeners added only through `addEventListener`
  unless a declared shortcut surface is present.
- The broader DOM signature is not a full semantic state model and can miss canvas-only, network-only, storage-only,
  or offscreen effects.
- Arbitrary settings dialogs, persisted shortcut preferences, and multi-step remap workflows still need deeper
  state-machine exploration.
- A fresh independent subagent review was attempted, but the subagent hit the available usage limit before producing
  findings; the previous independent review findings were used as the remediation checklist.

### 2026-06-24 update: status-message packet controls and visual/programmatic split

The `status-announcement` lane was upgraded from positive-only status-message triage to a 10 positive / 10 control
fixture, browser-validation, prompt-pack, visual-inspection, and sidecar-review slice for WCAG 2.2 SC 4.1.3. The
normative rule followed is that status messages must be programmatically determinable through role or properties so
assistive technologies can present them without receiving focus. The Understanding document narrows the scope to
messages about success, results, waiting state, progress, or errors, and excludes changes of context such as dialogs
or focus moves.

Fixes made:

- `status-announcement` prompts now allow only `LIKELY_BARRIER` or `UNCERTAIN`; there is no `LIKELY_OK` path.
- Controls now emit scoped packets rather than disappearing as no-packet rows. The 10 controls cover `role=status`,
  `role=alert`, `role=log`, `aria-live`, focus moved to the message, direct programmatic announcement, HTML dialog
  context, native alert context, and disclosure/expanded-content context.
- Positive packets require a trusted activation, an observed status message, focus not moved to the message, and no
  live/status/alert/log/direct announcement channel.
- The lane deliberately has no registered v3 publication claim family yet, so even structurally complete positives
  remain sidecar review evidence and convert to 0 authoritative judgments.
- Visual evidence was refreshed and inspected for representative positive and control cases. The inspection confirmed
  that visually similar status text can be either a barrier candidate or a scoped control depending on role/live/focus
  evidence; pixels alone are not sufficient for 4.1.3.

Verification:

- `node scripts/v3/tests/manual/validate-broad-scope-ni-interaction-fixtures.js`: 300/300 pass, with
  status-announcement 10/10 positives and 10/10 negatives.
- `node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js`: status-announcement produced 20 packets:
  10 `LIKELY_BARRIER`, 10 `UNCERTAIN`; positives converted to 0 judgments, controls to 0 judgments.
- Prompt-pack audit for status-announcement: 20 rows, 20 packet entries, 10 structurally barrier-ready positives,
  0 barrier-bridgeable rows, 0 clear-bridgeable rows.
- Prompt pressure for status-announcement: `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, `convertedJudgments: 0`.
- `node scripts/v3/tests/manual/capture-broad-scope-ni-visuals.js`: representative status screenshots refreshed.
- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 34/34 pass.
- `node --test scripts/v3/tests/broad-scope-probes.test.js`: 39/39 pass.
- `node --test scripts/tests/result.test.js scripts/tests/docs.test.js scripts/tests/meta.test.js`: 99/99 pass.

Independent review:

- `status-announcement-subagent-review.json` returned `PASS_WITH_EDGE_CONCERNS`.
- Carried-forward concerns: status-text removal is valid only when removal itself conveys waiting/completion or
  availability; icon-only status is fixture-scoped and must not treat `data-v3-status-meaning` as an accessibility
  API channel; native-alert controls should continue to expose dialog/context disqualification if future variants also
  mutate visible text; control packets remain non-clear evidence.

New evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/status-announcement-review-status.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/status-announcement-subagent-review.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/status-p1-after-status-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/status-n1-after-status-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/status-n5-after-status-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/status-n6-after-status-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/status-n7-after-status-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/status-n9-after-status-page.png`

Remaining limits:

- The lane remains sidecar-only until a registered status-message claim family, publication derivation, and
  accessibility-API/AT support story are added.
- The generated fixture slice records role/live/direct-announcement/focus/context channels; it does not prove actual
  real-AT announcement behavior.
- Removed status text and non-text/icon status cues need explicit semantic review and should not generalize from
  fixture metadata alone.
- Saved websites may need longer settle windows and state-machine exploration for delayed, debounced, or multi-step
  status updates.

### 2026-06-24 update: target-size control packets and exception visibility

The `target-size-minimum` lane was upgraded from positive-only 2.5.8 geometry review to a 10 positive / 10 control
fixture, browser-validation, prompt-pack, visual-inspection, and independent-critic slice. The normative rule followed
is WCAG 2.2 SC 2.5.8: pointer targets must admit a 24 by 24 CSS pixel square, or undersized targets must satisfy the
24 CSS pixel diameter circle spacing rule, or one of the Equivalent, Inline, User Agent Control, or Essential
exceptions must apply.

Fixes made:

- Target-size prompts now allow only `LIKELY_BARRIER` or `UNCERTAIN`; there is no `LIKELY_OK` path.
- Negative/control rows now emit scoped packets instead of disappearing as `NO_PACKET_SCOPED_OK`.
- Control evidence now distinguishes at-least-24, spacing exception, inline/in-sentence exception, equivalent-target
  exception, essential exception, and unmodified user-agent-control exception.
- Exception evidence is disqualifying for structural `LIKELY_BARRIER` readiness.
- The broad-scope LLM target-size lane deliberately has no registered v3 publication claim family, so even
  structurally complete positives remain sidecar review evidence and convert to 0 authoritative judgments. The core v3
  deterministic geometry path remains the intended publication authority for measured 2.5.8 geometry.
- Visual evidence was expanded and inspected for representative positive and control cases. The inspection confirmed
  that visually tiny targets can be barriers or scoped controls depending on spacing/inline/equivalent/essential/UA
  evidence.

Verification:

- `node scripts/v3/tests/manual/validate-broad-scope-ni-interaction-fixtures.js`: 300/300 pass, with
  target-size-minimum 10/10 positives and 10/10 negatives.
- `node scripts/v3/tests/manual/validate-broad-scope-llm-packets.js`: target-size-minimum produced 20 packets:
  10 `LIKELY_BARRIER`, 10 `UNCERTAIN`; positives converted to 0 judgments, controls to 0 judgments.
- Prompt-pack audit for target-size-minimum: 20 rows, 20 packet entries, 10 structurally barrier-ready positives,
  0 barrier-bridgeable rows, 0 clear-bridgeable rows.
- Prompt pressure for target-size-minimum: `{LIKELY_BARRIER: 10, UNCERTAIN: 10}`, `convertedJudgments: 0`.
- `node scripts/v3/tests/manual/capture-broad-scope-ni-visuals.js`: representative target-size screenshots refreshed.
- `node --test scripts/v3/tests/broad-scope-llm-review.test.js`: 36/36 pass.
- `node --test --test-name-pattern="target-size|status-announcement|character-shortcut" scripts/v3/tests/broad-scope-probes.test.js`:
  selected target-size probe test passed.

Independent review:

- A fresh critic agent returned `PASS_WITH_CONCERNS`, with no blockers.
- Carried-forward concerns: equivalent/essential/UA exceptions are fixture-scoped marker evidence, not full real-page
  proof; visuals are representative rather than exhaustive; fallback target-size control packets would be too thin if
  generated validation rows ever lost their richer evidence claims.
- The critic agreed that no target-size negative can currently clear, no positive bridges, and no control bridges.

New evidence:

- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/target-size-review-status.json`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/targetsize-p1-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/targetsize-n1-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/targetsize-n2-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/targetsize-n3-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/targetsize-n4-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/targetsize-n5-before-page.png`
- `docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/targetsize-n6-before-page.png`

Remaining limits:

- Equivalent-target proof still needs same-page same-function behavior plus equivalent target size/spacing validation on
  real pages.
- Essential/legal presentation and user-agent-control exceptions need stronger real-page evidence than fixture markers.
- Additional adversarial fixtures are still needed for fractional CSS pixels, exactly tangent 24px circles, transforms,
  clipping, rounded corners, complex SVG shapes, and obscured targets.
- A combined run of the broad-scope LLM-review and browser-probe test files printed all individual test passes but
  ended with Node's pending-promise/open-handle wrapper failure after the browser-heavy probes; focused target-size and
  LLM-review tests pass cleanly.

## Adversarial Findings From This Pass

### A1 — Browser-context helper leak

Initial reduced-motion probe called a Node helper from inside `page.evaluate`. Chrome correctly threw
`ReferenceError: parseCssTime is not defined`.

Fix:

- Made the in-page motion collector self-contained.

Lesson:

- Every `page.evaluate` helper must be serialization-safe; browser-backed tests are mandatory for these lanes.

### A2 — Transcript context too broad

The first media inventory associated a transcript link in a surrounding body/adjacent figure with a different media
element. That could become a false reassurance if later promoted.

Fix:

- Transcript hints are now limited to the containing `figure` for the media itself or adjacent siblings that do not
  contain another media element.
- Added regression assertion for the unrelated-video case.

Lesson:

- Media alternative presence is not enough; even mechanical evidence needs ownership scoping before it can support
  anything stronger than review.

## Integration Design

### 1. Add a broad evidence sidecar, not broad verdicts

Recommended artifact:

```json
{
  "scopeWarnings": [],
  "triageCandidates": [],
  "processFindings": [],
  "siteSetFindings": [],
  "researchAnnotations": [],
  "userPreferenceObservations": []
}
```

This should be referenced by v3 results but not merged into `observations`/`claims` as conformance outcomes.

### 2. Use source tiers explicitly

- `scope`: full-page/process/site/variant boundaries.
- `instrument`: deterministic browser observations.
- `checker`: axe/IBM/etc. side signal.
- `llm`: provisional semantic judgment.
- `human`: gold annotation.

No `scope` item should directly clear or fail an SC.

### 3. Promote only narrow subdomains

Good candidates for eventual deterministic promotion:

- viewport zoom restriction as a scoped user-preference warning;
- text clipped by text-spacing override where the target is visible text and not an exempt/offscreen pattern;
- forced-colors opt-out/survival candidates where pixel evidence and semantics agree;
- persistent motion under reduced-motion where duration and absence of pause/stop are observed;
- down-event destructive activation for pointer cancellation, if fresh-clone reversal checks are added.

Poor candidates for deterministic promotion:

- caption adequacy/synchronization;
- audio-description completeness;
- equivalent authentication alternatives;
- semantic expectedness of context changes;
- cognitive/plain-language judgments;
- process conformance without a flow manifest.

## Recommendations

1. **Adopt `broad-scope-probes.js` as an experimental sidecar module**, not a publication-path dependency yet.
2. **Thread `scopeWarnings` into saved-site run outputs** before large gold-data collection, because they help humans
   understand why a page result is partial or bounded.
3. **Add a manifest layer** for process/site-set work before attempting 3.3.7, 3.3.8, 3.2.6, 3.2.3, or title/link
   set comparisons.
4. **Build the next deterministic runner around reduced motion + text spacing**, because they are high-yield,
   browser-observable, and match EN/WCAG user-preference concerns.
5. **Keep media/auth/cognitive lanes as review queues** until there is either flow evidence or human/LLM annotation.
6. **Do not let “no candidate found” become a pass** for any broad lane. Absence is scoped evidence at most.

## Remaining Limits

- ACT was not rerun.
- No LLM/Claude experiments were performed.
- True 200% browser zoom, audio audibility, real AT support, and multi-page flow driving were not implemented in
  this prototype.
- Flash detection is only a CSS-name/duration risk candidate; it is not a WCAG flash-threshold measurement.
- Authentication and redundant-entry signals are still bounded by fixture/static evidence; they need flow manifests,
  test credentials, CAPTCHA alternative discovery, and process context to become more than triage/review queues.
- Visual-content discovery is still fixture/marker assisted. It is useful as a sidecar pattern, but real pages need
  OCR/vision/canvas/SVG extraction and downstream semantic adequacy judgment before 1.1.1 / 1.4.1 / 1.4.5 can move
  beyond `UNCERTAIN`.

## Bottom Line

The broad expansion is feasible and useful, but only if it stays honest about what it knows. The productive move is
to add **more structured uncertainty**, not more confident automation. These probes give human annotators and future
LLM lanes better targets while preserving the current harness's most important safety invariant: no clear without
positive, scoped support.
