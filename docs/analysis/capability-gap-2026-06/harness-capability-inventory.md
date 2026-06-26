# Harness capability inventory (for the aspect→capability gap analysis)

What the v3 harness CAN currently do per covered SC. Reason about gaps against THIS.

## LLM judgment rubrics (the judgment capability) + their DECLARED vision evidence
A rubric judges ONLY over its declared evidence frames. If an aspect needs evidence NOT in the list, that's a gap.
- 1.1.1: `alt-text-adequacy-v0` [element-crop, surrounding-region]; `long-description-completeness-v0` [element-crop, surrounding-region]; `captcha-alternative-v0` [element-crop, surrounding-region]
- 1.3.1: `info-relationships-v0` [**viewport** only]
- 1.3.2: `sequence-meaning-v0` [**viewport** only]
- 1.4.1: `use-of-color-v0` [element-crop, surrounding-region]
- 1.4.3: `contrast-over-complex-backdrop-v0` [element-crop, surrounding-region] — ONLY routed when `contrastReliable!==true` (flat-bg disposed by the C3 runner)
- 1.4.5: `images-of-text-v0` [element-crop, surrounding-region]
- 1.4.10: `reflow-no-hscroll-v0` [viewport-320]
- 1.4.11: `non-text-contrast-v0` [element-crop, surrounding-region]
- 1.4.13: `hover-content-v0` [state-before, state-after]
- 2.1.1: (keyboard-operability skill; `keyboard-activation` runner) — no atomic rubric beyond the agent
- 2.1.2: (keyboard-operability; `keyboard-trap-escape` runner + instrument)
- 2.4.2: `page-title-v0` [viewport]
- 2.4.3: `focus-order-meaning-v0` [viewport, state-before, state-after]
- 2.4.4: `link-purpose-v0` [element-crop, surrounding-region]
- 2.4.6: `heading-descriptive-v0` [**viewport** only]
- 2.4.7: `focus-visible-clear-v0` [state-before, state-after]
- 2.4.10: `section-headings-v0` [**viewport** only]
- 3.3.1: `error-identification-v0` [state-before, state-after]
- 3.3.2: `field-label-v0` [element-crop]
- 3.3.3: `error-suggestion-v0` [state-before, state-after]
- 4.1.2: `accessible-name-adequacy-v0` [element-crop, surrounding-region]
- 4.1.3: `status-message-v0` [**viewport** only]

## Deterministic runners (evidence/disposition)
`text-contrast-pixel` (1.4.3 flat/uniform bg + worst-case non-uniform), `reflow-overflow-probe` (1.4.10 @320px),
`keyboard-activation` (2.1.1), `keyboard-trap-escape` (2.1.2), `field-label-probe` (3.3.2), `form-error-probe`
(3.3.1/3.3.3), `hover-content-tri` (1.4.13), `focus-obscured-barrier` (2.4.11), `ax-state-diff` (4.1.3/state).

## Deterministic detectors / instruments
`iframeTabExcluded` (2.1.1), `prohibitedAriaAttr` (4.1.2), tab-order instrument (2.4.3), keyboard-trap instrument
(2.1.2), aria-hidden-focus (4.1.2), `evalTargetSize` (2.5.8 geometry), axe-promotion (4.1.2/1.1.1/2.4.4/1.4.1).

## Vision evidence TYPES the capture pipeline can produce (vision-capture STATE_TRANSITIONS)
`viewport`, `element-crop`, `surrounding-region`, `viewport-320` (reflow), state pairs keyed by SC→transition:
`2.4.7→focus`, `1.4.13→hover`, `3.3.1/3.3.3→submit`, `2.4.3→focus`. KEY LIMITS:
- **viewport-only rubrics are blind below the fold / off-screen** (1.3.1, 1.3.2, 2.4.6, 2.4.10, 4.1.3) — no full-page/tiled capture wired to them (capture_full_page tool exists but is LLM-triggered only).
- **State transitions are SC-keyed + frozen** — only the listed transitions are captured; a reveal (disclosure/tab/
  carousel/menu) that exposes a NEW subject is NOT captured (no reveal-state producer; dynamic-subjects emission absent).
- Off-screen elements (`top:-9999px`), <6px, hidden ⇒ no crop ⇒ rubric ABSTAINS at the required-evidence gate.

## Precompute signals surfaced to the LLM (precomputeSignals)
name/role/axName/states, contrast{ratio,reliable,fg,threshold}, sectionHeading (visible preceding heading, 2.4.6),
inactiveText (1.4.3 exemption), boxMin (geometry), enclosing HTML (style-stripped), decorativeMarking.nearbyText
(1.1.1), checkerHint (axe incomplete). NO: per-glyph pixel contrast over images, effective-bg through overlays,
table-relationship facts (th/headers/scope), list-structure facts, reading-order/DOM-vs-visual divergence beyond vsr,
reveal-state, full-page structure, media content-model, computed-vs-rendered color divergence.

## CDP tools (LLM-callable when tools enabled)
query_ax_node, observe_state_after_activation, probe_screen_reader_after_action, set_state_and_capture,
measure_geometry_live, request_hi_res_crop, ocr_image_text, compare_named_regions, render_with_overrides,
compute_contrast_ratio (flat fg/bg + font-threshold + text-shadow halo), resolve_part_color, resolve_destination,
capture_full_page.

## Known documented gaps (DEFERRED-TODO / prior analysis) — pre-seed the analysis
- Full-page/tiled structure vision for 1.3.1/1.3.2/2.4.6/2.4.10 (item G) — viewport-blind below fold.
- Reveal-state discovery (item D/G4) — hidden post-activation subjects never enumerated.
- Table-relationship collection (routing #4) — th/scope/headers facts not collected.
- Decorative-marking signal beyond nearbyText (routing #5).
