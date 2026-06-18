# Coverage progress tracker — WCAG techniques + ACT rules (combined)

**Date:** 2026-06-17 · **Living tracker** — itemizes every recommendation from the two source analyses
and marks its current status after **round 1** of implementation.

**Sources (detailed reference):**
- [WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md](./WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md) — 174 techniques / 210 SC-technique pairs.
- [ACT-RULES-COVERAGE-ANALYSIS.md](./ACT-RULES-COVERAGE-ANALYSIS.md) — 40 manual/semi-auto ACT rules.
- [COVERAGE-IMPLEMENTATION.md](./COVERAGE-IMPLEMENTATION.md) — what the builder shipped (round 1).
- [COVERAGE-IMPLEMENTATION-REVIEW.md](./COVERAGE-IMPLEMENTATION-REVIEW.md) — my verification of that work.

## Status legend
| | Meaning |
|---|---|
| ✅ | Shipped (round 1) — verified working |
| 🟡 | Partial — some of the item shipped; residual remains |
| ⬜ | Not started |
| ⛔ | Declined / by-design (intentionally not done) |
| 🌫 | Out of domain (single-page-DOM harness can't collect the signal) |

> **Load-bearing caveat:** every round-1 gain is a **NON-AUTHORITATIVE shadow cross-signal** (scored vs
> gold, fed to the review queue) — *nothing gates conformance*. The `AUTHORITY` registry still publishes
> nothing (only `focus-visual-retry`, pinned `shadow`). So "✅ Done" means **"a scored signal now exists,"
> not "this SC is now authoritatively decided."** In the gating sense, authoritative-CAPTURED is still ~0.

## Headline
- Round 1 took the **cheapest, highest-ROI slice**: *surface what axe already decides* + *one detector over
  already-collected AX data* + *one runner-robustness fix*. ~**9 of ~30 actionable items** are done (all shadow).
- The big wins land on the **name/role/value cluster** (1.1.1, 4.1.2) and **structure** (1.3.1, 2.4.2, 2.1.1):
  ~22 ACT rules' worth of axe coverage that was silently dropped is now consumed.
- **Untouched:** every *new instrument* (dialog, ariaNotify, cross-viewport, event-listener), every *new
  rubric* (1.4.11, 1.4.1, 2.4.3, 2.4.10, 4.1.2-adequacy), the *meaning* SCs, and *activating the inert LLM lane*.
- **1 must-fix** from review (regression guard for the collection coercion) is still open.

---

## Part A — Itemized recommendation tracker

`From`: **T** = technique analysis, **A** = ACT analysis. Evidence = commit.

### Theme 1 — Surface existing axe capability (highest ROI)
| # | Item | From | SC/rules | Status | Evidence | Residual |
|---|---|---|---|---|---|---|
| 1 | Surface **1.1.1 image-alt family** (image-alt/input-image-alt/svg-img-alt/object-alt/role-img-alt) | T,A | 1.1.1; 23a2a8/59796f/7d6734/8fc3b6 | ✅ | c36b827 (wholesale 1.1.1) | shadow only |
| 2 | Surface **4.1.2 name family** (button-name/link-name/label/select-name/aria-input-field-name/aria-toggle-field-name/summary-name/frame-title/aria-command-name) | T,A | 4.1.2; c487ae/2t702h/97a4e1/cae760/m6b1q3/e086e5 | ✅ | c36b827 (per-rule allow-list) | shadow only |
| 3 | Surface **4.1.2 aria-validity** (aria-required-attr/aria-allowed-attr/aria-valid-attr/aria-roles/aria-valid-attr-value/nested-interactive/aria-hidden-focus) | A | 4.1.2; 4e8ab6/5c01ea/5f99a7/674b10/6a7281/307n5z/6cfa84 | ✅ | c36b827 | covers the ACT-referenced rules, not the *full* ARIA-spec model |
| 4 | Surface **2.1.1** (scrollable-region-focusable, frame-focusable-content) | A | 2.1.1; 0ssw9k/akn7bn | ✅ | c36b827 (wholesale 2.1.1) | shadow only |
| 5 | Surface **2.4.2** (document-title) | T,A | 2.4.2; 2779a5 | ✅ | c36b827 (wholesale 2.4.2) | presence only; descriptiveness still inert rubric |
| 6 | Surface **best-practice** rules with no wcag tag | T,A | presentation-role-conflict→1.1.1 (46ca7f); empty-heading→1.3.1 (ffd0e9) | 🟡 | c36b827 (BEST_PRACTICE_RULE_SC) | only these 2 mapped; region/landmark-unique/heading-order best-practice rules still dropped |
| 7 | Surface axe **`incomplete`** (needs-review) as review-tier | A | a25f45/bc4a75/ff89c9 | ✅ | c36b827 (collect.axeIncomplete) | review-tier prior, not a decision |
| 8 | Surface **1.4.1 link-in-text-block** (F73) | T,A | 1.4.1 | ⬜ | — | only the inert IBM 1.4.1 prior exists |
| 9 | Surface **1.4.3 color-contrast** as corroborating signal | T | 1.4.3 | ⛔ | — | deterministic pixel runner owns 1.4.3; color-contrast intentionally dropped |
| 10 | **Bug:** per-rule surfacing also emits obsolete **4.1.1** (button-name carries wcag411) | review | 4.1.2 family | 🟡 | review #2 | filter tagScs to in-scope SCs |

### Theme 2 — New deterministic detectors (over already-collected data)
| # | Item | From | SC | Status | Evidence | Residual |
|---|---|---|---|---|---|---|
| 11 | **Static AX-name-presence** for the targets `ax-state-diff` misses (img/svg/object/iframe/summary/heading + widgets) | T,A | 1.1.1/4.1.2/1.3.1 | ✅ | c36b827 (`ax-name-presence`, shadow) | shadow only; iframe/object not sampled so unreached; heading→1.3.1 attribution editorial (review #3) |
| 12 | **Group-label / fieldset** detector (F82/H71) | T | 3.3.2 | ⬜ | — | builder's queued next-item #1 |
| 13 | **Required-cue ↔ aria-required** parity (ARIA2) | T | 1.3.1/3.3.2 | ⬜ | — | builder's queued next-item #1 |
| 14 | **Keyboard-orphan / pointer-only-handler** detector (F42/F54/F59) | T | 2.1.1/4.1.2 | ⬜ | — | blocked on event-listener instrument (#24) |
| 15 | **Focus-retention** probe (F55 `onfocus=blur`) | T | 2.1.1/2.4.7 | ⬜ | — | signal partly observable; re-route, not new instrument |
| 16 | **Dangling-IDREF** detector (aria-labelledby/describedby) | T,A | 1.1.1/1.3.1/4.1.2 | ⬜ | — | pure DOM detector |
| 17 | **Plain-text layout** detector (F32/F33/F34/F48) | T | 1.3.1/1.3.2 | ⬜ | — | |
| 18 | **Focus-indicator contrast/geometry** measurement (F78/G195) | T | 1.4.11/2.4.7 | ⬜ | — | over already-captured focus screenshots |
| 19 | **Page-title non-empty** deterministic runner (2779a5) | A | 2.4.2 | ⛔ | c36b827 | superseded — covered by surfaced axe document-title (#5); builder dropped the redundant signal |

### Theme 3 — Robustness fixes to existing runners
| # | Item | From | SC | Status | Evidence | Residual |
|---|---|---|---|---|---|---|
| 20 | keyboard-activation must **not navigate off-page** on external links (the c487ae self-invalidation-on-nav) | A (procedure divergence) | 2.1.1 | ✅ | 36d732c (capture-phase nav guard) | sound; `target=_blank`/window.open edge unhandled (minor) |

### Theme 4 — New instruments (raw signals not collected today)
| # | Item | From | SC | Status | Evidence | Residual |
|---|---|---|---|---|---|---|
| 21 | **`page.on('dialog')`** native alert/confirm capture | T,A | 3.3.1/3.3.3 (SCR18); 4.1.3 | ⬜ | — | builder's queued next-item #2 |
| 22 | **`document.ariaNotify` spy** + live-region replacement observation | T,A | 4.1.3 (ARIA27) | ⬜ | — | builder's queued next-item #3 |
| 23 | **Event-listener inventory** (CDP getEventListeners) for `addEventListener` pointer handlers | T,A | 2.1.1 (F54)/4.1.2 | ⬜ | — | unblocks #14 |
| 24 | **Cross-viewport content-delta** probe (F102) | T | 1.4.10 | ⬜ | — | builder's queued next-item #4 |
| 25 | **Vertical / sticky-occupancy** measurement at 320×256 (C34) | T,A | 1.4.10 | ⬜ | — | viewport already 320×256; measurement missing |
| 26 | **Style/zoom/text-resize control** activation + re-measure (C30/G206) | T | 1.4.5/1.4.10 | ⬜ | — | |
| 27 | **Forced-colors re-render** in the v3 pipeline | T | 1.4.1/1.4.3/1.4.11 | ⬜ | — | exists only as standalone `verify-finding.js` tool |
| 28 | **Real-AT voicing transcript** for status (VSR `/sr-act`) | T,A | 4.1.3 | ⬜ | — | non-announcement currently inferred structurally |
| 29 | **Focus-trigger limb** for hover-content | T | 1.4.13 | ⬜ | — | runner exercises hover, never `el.focus()` |

### Theme 5 — New / extended LLM rubrics + lane activation
| # | Item | From | SC | Status | Evidence | Residual |
|---|---|---|---|---|---|---|
| 30 | **1.4.11** graphical-object / non-text-contrast rubric | T,A | 1.4.11 | ⬜ | — | no automated lane at all today |
| 31 | **1.4.1** color-meaning rubric | T,A | 1.4.1 | ⬜ | — | |
| 32 | **2.4.3** focus-order rubric | T | 2.4.3 | ⬜ | — | |
| 33 | **2.4.10** section-headings rubric | T | 2.4.10 | ⬜ | — | no automated lane at all today |
| 34 | **4.1.2** accessible-name *adequacy* rubric (ARIA14/16) | A | 4.1.2 | ⬜ | — | name-presence now covered (#2/#11); adequacy not |
| 35 | **1.1.1** long-description-completeness rubric (ARIA15/F67/G92) | T,A | 1.1.1 | ⬜ | — | |
| 36 | **Activate the inert LLM rubric lane** (`opts.runLlm` + agent) | T,A | many "meaning" SCs | ⬜ | — | config/run choice; rubrics exist but off by default |

### Theme 6 — Declined / out of domain
| # | Item | From | Status | Note |
|---|---|---|---|---|
| 37 | Relational link/iframe-set instruments (fd3a94/4b1c6c) | A | ⛔ | builder: out of single-page-DOM domain (in-page relational is technically in-domain but a heavy new instrument) |
| 38 | Hand-rolled WAI-ARIA validity tables | A | ⛔ | superseded by surfacing axe aria-* (#3) |
| 39 | Promote axe to authoritative | T,A | ⛔ | needs the full readiness gate (gold size 149, sealed eval, raters, validated measurement) |
| 40 | 1.4.6 enhanced contrast (09o5cg) | A | ⛔ | out of scope per instruction |
| 41 | Media-transcript rules (1a02b0/ee13b5) | A | 🌫 | needs media playback + frame comprehension + multi-page |
| 42 | Multi-page / corpus crawl (F25/G127 title uniqueness) | T,A | 🌫 | harness is single-page |

### Review backlog
| # | Item | From | Status | Note |
|---|---|---|---|---|
| 43 | **Regression guard** asserting eval-page.js emits `axName:''` (not `null`) for an empty in-tree name-requiring element | review #1 | ⬜ | **must-fix** — without it the dead-detector bug can silently regress with the test still green |

---

## Part B — Per-SC roll-up (lanes before → after round 1)

Authoritative lanes in **bold**; everything else is shadow/inert.

| SC | Before round 1 | Round-1 delta | After |
|---|---|---|---|
| 1.1.1 | inert alt-adequacy rubric; axe dropped | + axe image-alt family (shadow), + presentation-role-conflict (shadow), + `ax-name-presence` img (shadow) | name-**presence** now scored (shadow); adequacy still inert |
| 1.3.1 | axe 1.3.1 surfaced; inert info-rel rubric | + empty-heading (shadow), + `ax-name-presence` heading, + `incomplete` review (td-headers/required-owned) | modestly richer shadow set |
| 1.3.2 | order-check triage (opt-in) | — | unchanged |
| 1.4.1 | inert IBM prior; skill | — | unchanged (gap) |
| 1.4.3 | **text-contrast-pixel** (flat bg); inert complex-backdrop rubric | — | unchanged |
| 1.4.5 | inert images-of-text rubric (wired bc83341, pre-analysis) | — | unchanged |
| 1.4.10 | **reflow runner**; inert rubric | — | unchanged |
| 1.4.11 | skill only | — | **still no automated lane** |
| 1.4.13 | **hover-content runner** (barrier-only); inert rubric | — | unchanged |
| 2.1.1 | **keyboard-activation** (barrier-only); kbd-graph | + axe scrollable/frame-focusable (shadow); **runner no longer stalls/navigates off-page** | more robust + shadow signals |
| 2.1.2 | **keyboard-trap-escape**; kbd/vsr trap | — | unchanged |
| 2.4.2 | page-title slot presence; inert rubric | + axe document-title (shadow) | presence corroborated |
| 2.4.3 | order-check triage | — | unchanged |
| 2.4.4 | axe link-name surfaced (2.4.4); inert link-purpose rubric | (link-name 4.1.2 limb now also surfaced) | ~unchanged for 2.4.4 |
| 2.4.6 | inert heading-descriptive rubric | — | unchanged |
| 2.4.7 | **focus-visual-retry** (shadow-pinned); inert rubric | — | unchanged |
| 2.4.10 | skill only | — | **still no automated lane** |
| 3.3.1 | **form-error-probe** (barrier-only); inert rubric | — | unchanged |
| 3.3.2 | **field-label-probe**; inert rubric | — | unchanged (group-label detector still queued) |
| 3.3.3 | inert error-suggestion rubric | — | unchanged |
| 4.1.2 | **ax-state-diff** (widget activation); vsr no-name | + axe name+aria-validity family (shadow), + `ax-name-presence` widgets (shadow) | static/non-widget name-presence + aria-validity now scored (shadow) |
| 4.1.3 | status-detector (opt-in, insertion-only) | — | unchanged (dialog/ariaNotify/submit instruments still queued) |

---

## Part C — Prioritized backlog (what to do next)

1. **#43 regression guard** (must-fix) — cheap, closes the door on the bug just fixed.
2. **#10 4.1.1 leak filter** — one-line precision fix to the surfacing.
3. **#12/#13 group-label + required-cue detectors** (3.3.2/1.3.1) — pure detectors over collected DOM; a real hole axe does *not* cover (non-redundant). *Builder's own next-item #1.*
4. **#21 `page.on('dialog')`** — small new signal; unblocks 3.3.1/3.3.3/4.1.3. *Builder's next-item #2.*
5. **#22 ariaNotify spy** (4.1.3). *Builder's next-item #3.*
6. **#36 activate the inert LLM lane** — flips ~12 "meaning" SCs from no-signal to scored PROVISIONAL with no new code.
7. **#24 cross-viewport content-delta** (F102) — instrument-heavier; do later. *Builder's next-item #4.*
8. **Measure** (review #4) — re-run the ACT-subset eval (`run-evaluation.js`, see [V3-ACT-SUBSET-PIPELINE.md](../act-benchmark/V3-ACT-SUBSET-PIPELINE.md)) and record the recall/precision delta from round 1, since "scored vs gold" is the justification.
