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

## Scope expansion (user, 2026-08-17 evening): cover ALL residuals

Batch 3 now covers the FULL s12 residual, not just the s11-regression RCA set. Five RCA lanes
launched over the ~15 never-root-caused FNs, the 3 stable FPs, and the 4.1.3 loss cluster
(fixed-evidence replays). Findings merge into the fix list above before implementation begins.
Still open for the user: the removal-of-status-06 label-vs-doctrine ruling.

## RCA-3 findings: images lane (merged 2026-08-17)

13. **1.1.1 decor case-01** (miss ×3): badge SVG (22×22, removed from a11y tree) fails
    decorativeSuspect()'s 24px gate — no obligation ever mints on the barrier element.
    Fix: measured gate experiment (V3_DECORATIVE_MIN_DIM=20 verified to flip it in-lane) with
    flood scan BEFORE adoption; label itself is annotator-split (Mengqi no / Ajit yes) so
    "accept as documented gate residual" is defensible. Validation: det pre/post + flood + slice.

14. **nearbyText null on single-child wrappers** (keystone: decor-01/02/06 all affected):
    act-page-collect.js:783-794 (+ scripts/eval-page.js:494) reads only parent+direct siblings, so
    div>canvas / div>svg / span>svg all yield nearbyText:null — starving the redundancy baseline
    AND the abstain valves' "can I verify" question. Fix: climb ancestors until non-subject text.
    Validation: det pre/post + re-freeze + family replay.

15. **decor case-02** (stable wrong-reason miss ×3): judge cites "adjacent HTML comparison table"
    that is the candidate canvas's OWN pixels. Fix: decorative-image-verification-v0 — redundancy
    quote must come from TEXTUAL evidence (nearbyText/DOM/tool text), never pixels inside the
    candidate's crop. Validation: fixed-evidence replay (packs in scratchpad/rca3-images/packs/).

16. **decor case-06 + longdesc case-03 flips = batch-2 abstain valves over defective evidence**
    (NOT platform, NOT noise; the abstains are epistemically more honest than the old catches).
    Fixes: (a) constrain both valves' "place the text would live" to content-bearing locations
    (a labeled user-entry field is not one); (b) longdesc: dedicated captionText fact
    (figcaption + aria-describedby target, ~1200 cap) for complexImageHint images — the 2800-cap
    enclosingHtml is eaten by SVG markup, truncating the caption mid-sentence (reproduced
    byte-identically on Mac at 7b379689). Do NOT revert the valves. Validation: replay packs.

17. **4.1.3 non-textual case-05** (miss ×3; old "accname diff" RCA was wrong): the detector
    deliberately voices svg[role=img][aria-label=check] but flattens icon-ness/role/lang into
    addedInsideLiveRegion:["check"], and the rubric's "one-word outcome is COMPLETE" guard then
    actively clears it. Fix: provenance on accname-voiced additions ({viaAccName, tag, role} +
    document lang) in status-detector.js:149-190,280,454; symbol-name/lang-mismatch clause in
    status-message-v0.md:83-89 with the one-word guard carved to exclude icon-accname
    announcements. Validation: detector unit tests + fixed-evidence replay on the family.

## RCA-3 findings: relationships lane (merged 2026-08-17)

18. **1.3.1 emulated-controls case-05**: F42 detector excludes the FOCUSABLE role-less sub-case by
    construction (act-page-collect.js ~:715 `_emulatedShape` requires !focusable && no tabindex>=0)
    — the page's own ruleName targets exactly that shape; s10/s11 catches were free-scan luck.
    Fix: sibling fact `emulatedControlFocusable` (same guards, tabindex>=0, non-interactive role) →
    control-semantics routing + rubric premise branch. Validation: unit + ACT-581 FP gate + slice.

19. **INFRA (caused 3 silent s12 lane drops incl. structural-markup-04)**: required-evidence gate
    abstains SILENTLY when the single page-wide viewport shot fails (vision-capture.js:244, 3×80ms
    tries) — llm-adjudicator.js:2103-2107 returns null untraced. Fix: (a) loud per-subject
    noVerdict {reason:'missing-declared-frame'}; (b) harden the page-wide shot (settle + backoff —
    it amortizes over the whole page); (c) optional fieldset-with-no-controls structural fact (the
    case's LABELED defect has no fact at all). Validation: captureVision unit test w/ failing mock;
    re-run the 3 pages. PAPER-TABLES 1k-post7 corrected ("0 errors" was wrong at lane granularity).

20. **1.3.1 form-label case-01** (miss ×3, stable): CSS-grid cross-pairing — all four inputs render
    under the WRONG label while for/id is textually perfect; no lane sees geometry. Fix:
    deterministic `labelGeometryMismatch` fact (nearest label above/left w/ column overlap ≠ own
    label; agent's 15-line predicate found 4/4). Validation: unit + FP sweep over all form pages +
    ACT + targeted slice. NOTE corpus metadata drift: manifest ruleName describes a different page.

21. **1.3.1 special-status case-01**: ACCEPT — the measured F2 veto (collect-styling-outliers.js
    documents this exact shape as inseparable from ordinary design; weight/size sweep = 28.6% of
    pages). Tag deliberately-out/F2-veto in corpus notes.

22. **2.4.2 stale-in-family case-02**: recoverable soundly post-uniqueness-deletion — title
    VOLUNTEERS "2025" while every page identity surface (hero aria-label, h2, dl, footer) asserts
    2026. Fix: deterministic `titleInstanceConflict` fact (title year token appears in NO
    heading/hero surface and a different year does) + one page-title-v0 contradiction clause
    (never fires on an ABSENT token — anti-richness firewall preserved; foil case-06 safe by
    construction). Validation: unit on all 6 fixtures + targeted 2.4.2 slice incl. the families
    that motivated the deletion.

23. **Cross-cutting**: batch-2 page-level payloads ANCHOR the info-relationships judge (case-05's
    verdict transcribes the visualHeadings entries) — add one presence-framing line: "the facts
    are additive anchors, not the complete inventory; the crop remains in scope."
