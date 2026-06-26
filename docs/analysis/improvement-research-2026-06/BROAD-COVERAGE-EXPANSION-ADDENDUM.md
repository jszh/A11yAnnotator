# Broad coverage expansion addendum

Date: 2026-06-21

Scope: broaden the discovery-lane discussion beyond ACT and beyond the current known errors. This addendum looks
across WCAG 2.2, Trusted Tester, EN 301 549 web requirements, WAI disability-coverage notes, and the current v3
harness architecture. It is not an experiment report; no fresh ACT/LLM runs were performed.

## Executive summary

The harness should expand coverage, but only if it preserves the safety properties that now make v3 usable for
gold-data collection:

- New mechanisms should first produce **obligations, triage candidates, or side evidence**, not authoritative
  conformance.
- New SCs should enter through the same **claim-family / registry / default-closed** path, not ad hoc result fields.
- Page/process-scope requirements should be represented as **coverage and boundary metadata**, not squeezed into
  element-level pass/fail rows.
- Anything that can create a false clear must require a closed scope proof; otherwise it stays PARTIAL or
  review-only.

The broad opportunity is to add a second layer above the existing element obligations:

1. A **coverage-scope layer** for full-page, process, user-preference, and accessibility-support boundaries.
2. A **discovery layer** for regions/states/sets not visible to the static collector.
3. A **review-candidate layer** for semantic or site-level questions that are useful for humans but not yet sound
   enough for the obligation ledger.

That lets us support more WCAG/Trusted Tester/EN concepts without breaking current features or diluting the
meaning of a v3 claim.

## Current architectural anchors to preserve

The current code already has the right safety shape:

- `v3-schema.js` separates observation, applicability, and conformance. `conformanceOutcome` remains
  `NOT_ASSESSED`, which is important: the harness can collect evidence without pretending to certify pages.
- `registry.js` is default-closed for clearing directions. A new criterion cannot accidentally publish a pass.
- `catalog.js` requires typed outcomes and directional support predicates for deterministic experiments.
- `build-v3.js` reconciles obligations independently and leaves unsupported cases as PARTIAL.
- `axe-surface.js` and `checker-ibm.js` are side-signal lanes. Expanding them is lower-risk because findings are
  non-authoritative and structured.
- `coverage.truncated` / summary coverage disclosure already acknowledges that element caps limit full-page claims.

Those constraints should be considered features, not friction. They are what let the harness expand without
silently changing the semantics of old results.

## Broad WCAG / TT / EN expansion map

| Area | Standards driver | Current support | Good next support | Breakage risk | Integration rule |
|---|---|---|---|---|---|
| Full-page completeness | WCAG 5.2.2, EN C.9.6.2 | Coverage disclosure exists | Page coverage manifest: DOM counts, sampled regions, state coverage, caps, untested iframes/shadow roots | False page-level clears | Metadata only; never turn "no finding" into pass on truncated pages |
| Complete processes | WCAG 5.2.3, EN C.9.6.3, TT cross-page limits | Single-page only | Optional flow manifest: named steps, URLs/states, per-step result refs | Scope confusion | Separate process artifact; no per-page row may imply process conformance |
| Accessibility-supported ways | WCAG 5.2.4, EN C.9.6.4 | Chrome AX proxy | AT-baseline labels: Chrome AX, VoiceOver/NVDA spot-check, browser matrix notes | False AT support | Baseline metadata and gold labels; no clear unless support baseline is declared |
| Non-interference | WCAG 5.2.5, EN C.9.6.5 | 2.1.2 partial; 2.2.2 review; little 1.4.2/2.3.1 | Add audio-control, strengthen trap review, add flash detector/deferral | User-harm misses | Barrier-oriented; clears only on closed detection scope |
| User preferences | EN C.9.7, WAI low-vision/motion needs | `render_with_overrides` as LLM tool; no conformance lane | Deterministic probes for `user-scalable`, forced-colors survival, reduced-motion, text spacing | Browser-specific false claims | Side conformance-scope lane first; route hard failures as review/provisional only |
| Media alternatives | WCAG 1.2.x, TT media checks | `1.2.2` media-alternatives rubric exists | Expand to 1.2.1/1.2.3/1.2.5 as inventory + human review; optional track presence from axe | Caption-quality hallucination | Presence can be checker evidence; quality/sync is human/LLM review only |
| Audio control | WCAG 1.4.2, non-interference | Mostly absent | Detect autoplay audible media >3s and pause/volume controls | Saved pages may not play audio offline | Barrier candidates only; require positive audible/autoplay evidence |
| Pause/stop/hide | WCAG 2.2.2, non-interference | `motion-control` family/rubric exists | Timed mutation/animation observer, reduced-motion comparison, pause-control inventory | Decorative/loading animation FPs | Keep applicability narrow: moving/blinking/auto-updating content >5s and parallel with other content |
| Three flashes | WCAG 2.3.1, non-interference | Explicitly out of scope | Optional frame-sampling detector with strict thresholds, or human review queue | Severe false sense of safety | Do not clear; flag only obvious high-risk candidates |
| Resize text / text spacing | WCAG 1.4.4, 1.4.12, EN AA | axe/IBM side signals; reflow machinery | Run zoom 200% and text-spacing CSS, reuse geometry/clip/overlap evidence | Layout variance/noisy FPs | Separate from 1.4.10; no global clear from one viewport |
| Pointer gestures/cancellation/dragging | WCAG 2.5.1, 2.5.2, 2.5.7 | Some notes in keyboard skill; no lane | Gesture inventory: draggable/map/canvas/slider; alternative-control review | Hard to infer functionality | Triage candidates first; human labels alternatives |
| Character key shortcuts | WCAG 2.1.4 | No lane | Listener/key-event inventory plus real key probe on page scope | Shortcut discovery is incomplete | Review-only unless shortcut is explicitly observed and no modifier/focus exception applies |
| Predictable context changes | WCAG 3.2.1, 3.2.2 | Adjacent to hover/modal notes; no lane | Focus/input mutation probe: navigation/dialog/focus shift without user request | Legit widgets/dialogs | Barrier-only candidate; semantic review decides "context change" and expectation |
| Consistent help | WCAG 3.2.6, EN WCAG 2.2 | No lane | Multi-page/site-set pass over help mechanisms | Needs page set | Process/site artifact only |
| Redundant entry | WCAG 3.3.7, EN WCAG 2.2 | No lane | Flow-aware form field memory detection across steps | Requires process/session | Flow artifact; never single-page claim |
| Accessible authentication | WCAG 3.3.8, EN WCAG 2.2 | CAPTCHA alternative partial | Login/auth flow detector; password-manager/copy-paste/CAPTCHA alternatives review | Security/auth state hard offline | Review-only unless controlled flow captured |
| Language and unusual words | WCAG 3.1.x | axe 3.1.x side signals; no cognitive rubric | Language-of-parts surfacing; optional readability/abbreviation candidates | Language/culture bias | Side signals and human review, not automated fail except checker-decided lang attrs |
| Cognitive/readability | WCAG AAA + WAI COGA themes | Out of taxonomy | Optional research annotation lane: plain-language, memory load, distraction | Subjective, model-biased | Keep outside conformance ledger; collect human labels if study needs it |
| Site-level consistency/navigation | WCAG 3.2.3, 3.2.4, 2.4.5 | Out of scope | Multi-page crawl/set comparison | Saved single-page corpus mismatch | Separate site-set report |
| Mobile/touch orientation | WCAG 1.3.4, 2.5.x | Mostly out of scope | Viewport/device emulation matrix; touch target/gesture candidate lane | Device-specific claims | Metadata and candidates; no single desktop clear |
| Shadow DOM / iframes / generated content | Cross-cutting WCAG support | Partial | Coverage manifest for shadow roots, frame reachability, pseudo-element content/backgrounds | Missed obligations | Producer expansion with explicit untested-surface counts |

## Prioritized expansion lanes

### P0 — Make scope and non-coverage impossible to miss

This is the safest broad expansion because it does not decide new SCs.

- Extend the coverage manifest beyond `truncated`:
  - total DOM nodes, collected nodes, cap, excluded counts by reason
  - same-origin iframes traversed, cross-origin iframes not traversed
  - shadow roots seen/traversed/not traversed
  - dynamic states attempted and skipped
  - viewport/zoom/text-spacing/forced-colors/reduced-motion variants captured
- Add `scopeWarnings[]` to results, separate from obligations:
  - `page-truncated`
  - `cross-origin-frame-untested`
  - `shadow-root-untested`
  - `single-page-only`
  - `no-real-at-baseline`
  - `process-scope-not-evaluated`
- Keep these warnings from affecting existing per-element outcomes. They qualify how humans should read the run.

Why first: EN and WCAG conformance requirements are mostly scope requirements. Honest boundaries reduce false
confidence without introducing false positives.

### P1 — Expand deterministic/checker evidence where standards are mechanical

Use tools where they already decide a narrow facet well.

- Keep expanding axe side signals where rule families are precise:
  - language/page plumbing (`3.1.1`, `3.1.2`)
  - resize/viewport and autocomplete (`1.4.4`, `1.3.5`)
  - skip/bypass (`2.4.1`) as a checker signal, with a separate "works when activated" behavior probe later
  - selected name/ARIA rules by rule ID, not whole `4.1.2`
- Keep IBM narrow:
  - hard `1.4.12` and `2.5.3`
  - review priors for `1.4.1` and `1.3.3`
- Add a local side-signal normalizer for `1.4.2` audio control and `meta-viewport` zoom blocking if checker
  output is insufficient.

Integration rule: checker decisions stay side signals until gold validates them on saved sites. They can mint
review obligations or fill provisional rows only through the existing calibrated/provisional path.

### P2 — Add user-preference and adaptation probes

These support EN C.9.7, WAI low-vision needs, and WCAG 1.4.4/1.4.12/1.4.10 adjacency.

- `zoom-200-probe`: capture layout at 200% text/page zoom; detect clipping/overlap/loss of controls.
- `text-spacing-probe`: inject WCAG text spacing CSS; detect clipped/overlapped text and hidden functionality.
- `forced-colors-probe`: emulate forced-colors and compare essential boundaries/focus indicators.
- `reduced-motion-probe`: emulate `prefers-reduced-motion: reduce`; detect whether non-essential motion persists.
- `viewport-zoom-policy`: static detection of `user-scalable=no`, `maximum-scale=1`, and touch-action blockers.

Soundness:

- Do not clear page-wide adaptation from a single viewport.
- Treat detected loss as a barrier candidate with positive evidence.
- Treat clean output as scoped evidence only: "no issue observed in this viewport/state," not global pass.

### P3 — Add non-interference lanes

These matter because WCAG says they apply to all content even when content is not otherwise relied upon.

- `audio-control` for WCAG 1.4.2:
  - detect media/audio contexts that autoplay for more than 3 seconds
  - check for pause/stop or independent volume
  - saved-page limitation: if audio cannot play offline, emit PARTIAL with reason
- `motion-control` hardening for WCAG 2.2.2:
  - timed observer for auto-updating/moving content >5s
  - control inventory: pause/stop/hide, carousel controls, reduced-motion handling
  - avoid flagging brief loaders and essential progress indicators
- `flash-risk` for WCAG 2.3.1:
  - strict frame-sampling detector for obvious high-risk flashes
  - never emit a clear; absent detection is not proof
- `trap-review` strengthening for 2.1.2:
  - fixed-set confinement plus escape-advisory semantic packet
  - standard exits and documented non-standard exit handled separately

Integration rule: these lanes should be barrier-oriented and conservative. Non-interference is a place where
false negatives are dangerous, but false positives are also expensive; require positive observed harm.

### P4 — Add interaction predictability and pointer-operation candidates

These are not well covered by rule-based tools and map to WAI/TT user needs.

- `on-focus-context-change` / `on-input-context-change`:
  - focus/change controls
  - detect navigation, modal opening, large content replacement, focus shift
  - rubric/human decides whether change is expected or user-initiated
- `pointer-cancellation`:
  - compare down/up/cancel behavior for custom controls
  - candidate-only unless the down-event activation is positively observed and no reversal/cancel exists
- `dragging-movements`:
  - detect draggable/map/canvas/slider surfaces
  - check for non-drag alternative controls
  - mostly human review, especially maps/canvas
- `pointer-gestures`:
  - detect multipoint/path-based gestures in touch handlers/canvas/maps
  - review for single-pointer alternative
- `character-key-shortcuts`:
  - key listener inventory
  - real key probes for single-character shortcuts
  - exceptions: only active on focus, can be turned off, or remapped

Integration rule: these should start as `triageCandidates`, not obligations, because functionality inference is
open-world. Promote a narrow sub-domain only after adversarial fixtures and saved-site gold.

### P5 — Add process/site-set artifacts

This is the only principled way to support complete-process, consistent-help, redundant-entry, consistent
navigation, and accessible-authentication requirements.

- Define `flow-manifest.json`:
  - steps, URLs/states, action to advance, expected persisted user data
  - authentication requirements and test credentials where available
  - scope boundary and skipped steps
- Define `site-set-manifest.json`:
  - pages considered siblings
  - repeated nav/help components
  - title uniqueness and same-label consistency comparisons
- Add site/process outputs separate from element ledger:
  - `processFindings`
  - `siteSetFindings`
  - `scopeWarnings`

Integration rule: per-page v3 results may be referenced by process/site findings, but process/site findings must
not be back-projected into individual page rows as if the page alone proved them.

### P6 — Add cognitive/readability as research annotation, not conformance automation

WAI highlights cognitive/accessibility concerns that WCAG mostly covers at AAA or indirectly. They are important
but very easy to overclaim.

Possible research-only candidates:

- plain-language/readability
- unexplained abbreviations/jargon
- memory burden and redundant re-entry
- distracting motion or visual clutter
- unclear instructions / non-literal labels
- error recovery complexity

Integration rule: keep this in a separate `researchAnnotations` or `cogaCandidates` artifact. Do not mix it with
WCAG A/AA conformance rows unless a specific SC and rubric is explicitly mapped.

## How to avoid breaking existing features

### 1. Do not widen existing claim families unless the assertion is the same

If the new question is set-level, process-level, or state-level, make a new claim family. Examples:

- `iframe-equivalent-purpose`, not `name-role-value`
- `same-name-link-purpose-set`, not per-link `link-purpose`
- `audio-control`, not generic `motion-control`
- `user-preference-zoom`, not `reflow-no-hscroll`

This prevents a new producer from changing the meaning of old obligations.

### 2. Preserve source tiers

Use distinct source tiers:

- `deterministic`: typed experiment with catalog support predicates
- `instrument`: non-authoritative observation/triage
- `checker`: external checker side signal
- `llm`: structured provisional judgment
- `human`: future gold labels
- `scope`: coverage/process/user-preference boundary metadata

The new `scope` tier should never fill an obligation directly. It qualifies the run.

### 3. Keep clears harder than barriers

For new lanes, default to:

- barrier candidates with positive evidence
- review/PARTIAL for absence of evidence
- no clears until a finite completeness proof exists

This matches the current registry design and avoids the dangerous "did not observe a problem, therefore pass"
failure mode.

### 4. Add fixture tests before saved-site runs

Each new broad lane needs positive and adversarial fixtures:

- positive barrier
- obvious non-barrier
- inapplicable
- under-hydrated/offline snapshot
- visually similar but normatively different
- same page with dynamic state changed

For no-quota phases, the first test can simply assert that the right obligation/candidate/scope warning is minted.

### 5. Keep legacy taxonomy stable

The existing nine categories are useful for human annotation. Broad expansion should not force all new SCs into
those labels. Add a `coverageArea` or `standardScope` dimension:

- `wcag-core-current-taxonomy`
- `wcag-adjacent-aa`
- `wcag-aaa-research`
- `trusted-tester-parity`
- `en-conformance-scope`
- `wai-cognitive-research`

That keeps old metrics comparable while letting the harness collect richer data.

## Recommended roadmap

### Next safe step

Implement P0 coverage-scope metadata and P1 checker/mechanical surfacing audits. This improves the usefulness of
the saved-site gold run without adding much risk.

Concrete candidates:

1. Add `scopeWarnings[]` and richer coverage manifest.
2. Add shadow-root / iframe / pseudo-element coverage counts.
3. Add no-LLM tests that page truncation and untested subtrees are visible in results.
4. Audit `axe-surface.js` against current desired broad SC set, especially `2.4.1`, `1.4.2`/audio if available,
   and `3.1.x`.
5. Keep IBM optional and pinned; do not let network availability change whether results look clean.

### Next medium step

Implement adaptation/user-preference probes:

1. Text spacing (`1.4.12`) as geometry evidence.
2. Zoom/resize (`1.4.4`) as geometry evidence.
3. Forced colors and reduced motion as variant captures.
4. User-scalable/viewport static warning.

These are high value because they address WAI/EN gaps and reuse existing reflow/vision machinery.

### Next high-effort step

Implement process/site-set support:

1. Flow manifest.
2. Site-set manifest.
3. Per-flow saved website runs for redundant entry, accessible auth, consistent help, and complete process.

Do this only when the corpus has enough multi-step/site context; otherwise it will add structure with little data.

## Bottom line

The harness can support broader WCAG, Trusted Tester, and EN requirements, but it should do so by expanding the
evidence model, not by making the existing element-level ledger pretend to be a conformance engine. The safe path
is: scope metadata first, narrow mechanical side signals second, bounded discovery third, and only then calibrated
obligation fills.
