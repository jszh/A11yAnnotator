# Batch-3 fix plan — from the s11 regression RCAs (2026-08-17)

Source: three parallel RCA agents over aug-annot-s10-tools (ace2be98) vs aug-annot-s11-tools
(01241deb + partial batch-2 tree), all 12 regression/no-fire cases root-caused with deterministic
reproductions; plus items the batch-2 soundness review deferred. Batch-2 remediations (21 findings)
are already in the batch-2 commit — this plan is the NEXT round. Ordering: deterministic-validated
fixes first, judgment fixes behind fixed-evidence replay per the two-lane validation protocol.

## Fixes

1. **3.3.1 at-rest branch presence-framing** (regressed error-message-mismatches-05/06).
   (a) Rubric: one cross-reference sentence in the at-rest branch — present error text must be TRUE
   of the error (check `associatedErrorText`/`adjacentErrorText` against `retainedValue`, including
   OTHER records' retained values for relational messages); present-but-wrong ⇒ REPRODUCED.
   (b) Collector: widen `ERROR_CLASS` to the bare `err` token (case-05's false "no error text").
   Validation: fixed-evidence replay over the 5 mismatch cases + the 2 new at-rest wins (rep≥3);
   deterministic pre/post for the lexicon.

2. **2.4.4 linkTarget FP prime** (new FP generic-link-text-02). First: A/B fixed-evidence replay
   ±the linkTarget signal block, n≥5/arm. Only on a stable flip: add "these facts never DEMOTE a
   context rescue" clause. Otherwise accept as noise.

3. **1.3.1 F34 guard collision** (ascii-pre-04): one disambiguating sentence — terminal/CLI *output*
   whose first line is a header row aligned over values, with prose directing column comparison, is
   a table; "code listing" means source code. Fixed-evidence replay rep≥3.

4. **1.3.1 visualHeadings closed-world** (special-status-05, accepted as mostly-correct): optional
   note wording "entries are deterministic; the list is NOT exhaustive". Replay ±block; watch the
   1.3.1 GT-pass slice (over-fire is the known FP direction).

5. **1.3.1 ariaTable truth-gap** (layout-table-05): deterministic header-side fabrication tell —
   columnheader cells that structurally mirror data cells (same inner stack / ≥2 value-like blocks)
   → existing `LAYOUT_STRUCTURE_SUSPECT` channel. Flood-check the predicate over all 904
   act-augmented pages + official ACT (held-out gate) before adoption.

6. **1.1.1 area-map case**: no code fix — the area-crop lane exists in batch-2; the s11 miss was
   run-state skew. The batch-2-commit rerun is the validation.

7. **1.4.1 F13 mint reason not threaded** (image-chart-03): thread the F13 construction hit as a
   signal (pattern: `deterministicAbstained`) + short F13 branch in use-of-color-v0 — when the
   image's own alt declares colour coding, the colour-resolved fact must appear in text; an
   unstated visual covariate does not clear it. Replay on the image-chart family + 1.4.1 FP watch.

8. **1.4.13 teleport hover travel** (case-03): `steps` on both `mouse.move` calls in the tri-probe
   so travel is continuous — flips the case to a deterministic hoverable:false barrier.
   Deterministic pre/post on 1.4.13 families + ACT byte-identity.

9. **1.4.13 persistence rubric gap** (case-02): document `persistenceSamples`/`vanishedWhileHeld`
   in hover-persistent-v0 + the adjudicator note; `vanishedWhileHeld:true` is a positive
   self-withdrawal observation refutable only by a tool dwell exceeding the max sample offset.
   Fixed-evidence replay + targeted 1.4.13 slice.

10. **2.4.3 f85 clause-lane feeder** (case-02): admit rank-3 safe openers to the reveal pass when a
    hidden dialog-shaped region with ≥2 focusables exists; keep+surface the opened-ring containment
    aggregate (`containmentLeak`) and open the clause-C gate on it. Runner tests + det pre/post
    (openersFound≥1, containment fact present) + ACT byte-identity + targeted 2.4.3 slice.

11. **2.1.2 instrument-lane starvation** (region-loop-01/04; the keystone): hoist the three at-rest
    trap detectors above the 2.4.3 reveal pass (or give the reveal pass a bounded share of the 90s
    cap). MUST validate at corpus concurrency (no-LLM annotated suite over the 2.1.2 family at
    PAGE_CONC 12) — single-page replays mask the cap. Assert oneway findings + minted obligations +
    instr_ms under cap.

12. **4.1.3 muted-region admission** (wrong-live-region-01): extend the collector's live-region
    carve-out to the muted shape (any `aria-live` value, or `aria-atomic`/`aria-relevant`, not
    aria-hidden). Collector unit test + orchestrated no-LLM on the case + ACT byte-identity.

## Deferred (explicitly not in batch 3)

- Legacy status-sweep exhaustion on ~25-trigger pages (pre-existing; reported via `budgetExhausted`).
- Marking region-detector close-control clicks as harness interaction (unreachable by the births
  artifact under the new ordering).
- Adjudicator surfacing hunks for `harnessInteraction` and `truncated` (rubric carries the scoping
  today; surfacing is a lead-applied hunk).
- Scroll-sample extension to the hover persistence probe (the authored scroll-hide defect remains
  uncovered by any instrument) — docs/DEFERRED-TODO.md.
- detectFocusRetentionTraps runs after the destructive Esc probe without re-open (pre-existing).

## Open user decisions (carried from batch 2)

- 3 corpus REVIEW leak edits (1.3.2 #itinNote inner-text replacement; 1.4.5 trailing-clause trim;
  2.1.2 docnote removal); 2 scanner false-positives stay as-is.
- Merit-rejected items standing for veto: 22px badge substantiality floor; bold/size
  presentationOutliers widening; two 3.3.1 det-FPs (priced trade-off); 2.4.4 duplicate-name +
  2.4.2 "Lámina 12" label disputes (corpus notes, not code).
- Colour-token lane: 24 firing pages need hand-review before any V3_COLOUR_TOKEN_LANE enable.

## 2026-08-17 user decisions (recorded)

- Commit approved (4-commit package). Merit-rejected items stay rejected. categories.json merge deferred.
- Token-lane: 24-page hand-review goes into batch 3; flag stays off.
- Corpus REVIEW edits applied: 1.3.2 #itinNote inner text replaced (node+id kept — aria-describedby
  target), 1.4.5 src-note trailing clause trimmed, 2.1.2 case-06 docnote removed whole. Scanner
  false-positives (1.4.3 "Lighthouse Cottage", 2.4.4 "Project: Lighthouse") left as-is.
- Label disputes moved to needs-validation: 2.4.2::title-loses-meaning-out-of-context::case-05
  ("Lámina 12") and 2.4.4::duplicate-name-same-context-different-purpose::case-01. NOTE: the 2.4.4
  case is inferred — the audit's dispute record was deliberately not filed; case-01 is the family's
  only untagged GT-fail the harness persistently contests (02/06 were already needs-validation).
  Correct the key if the dispute was a different case.
- Next scored run: ON THE SERVER (user directive; codex resized to c4-highcpu-16 and validated
  sharding at --pages 32 --browsers 4). Local scored runs discontinued for now; platform-change
  caveat applies vs Mac baselines (fonts/vision).
