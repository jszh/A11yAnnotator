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

## RCA-3 findings: keyboard/misc lane (merged 2026-08-17)

24. **2.1.2 modal-popover case-05**: latent timing hole in ALL trees — the page self-opens its
    popover at load+400ms; the at-rest kbd block starts ~235-300ms after load on fast hardware, so
    the walk sees a popover-less page and both reveal lanes find openersFound:0 (no declared
    opener). s10/s11 "catches" were PAGE_CONC-12 contention luck; batch-2 exonerated (delay-0
    control catches; s10 tree on idle Mac misses identically). Fix: late-arrival re-pass — at lane
    end, if the rendered-focusable set grew since walk time, run the at-rest trap block once
    (bounded, mirrors births-top-up pattern). Validation: scratch driver both polarities + 2.1.2
    family no-LLM at corpus concurrency + ACT byte-identity. ALSO: platform caveat must cover
    SCHEDULING/TIMING, not just fonts/vision (speed itself changes recall on self-opening UI).

25. **2.4.3 focus-not-contained case-03**: stable evidence gap — page force-focuses INTO a visible
    overlay at load; elementFromPoint at the underlying stops returns the scrim; clause-C keys only
    on dialog[open]/aria-modal so the fact never exists; fix #10 (opened-ring containmentLeak)
    does NOT cover it. Fix: per-stop occlusion fact in probeActive (occludedBy xpath) + surface
    the page-set initial-focus stop + one rubric sentence. Validation: driver + fixed-evidence
    replay rep≥3 both polarities + 2.4.3 slice + ACT byte-identity.

26. **1.4.1 scoping case-07**: (a) noObligation is DESIGNED — the covering widening is the
    flag-OFF token lane (verified firing on this exact page); disposition: deliberately-out
    pending the token-lane decision. (b) REAL defect found en route: on zero-focusable pages
    collectTabOrder's sentinel-wrap requires sawNode first → 2000 no-op Tab presses per direction
    (measured 67.6s) → chronic 90s lane cap-out. Fix: end walk after N consecutive boundary
    sentinels with sawNode=false. Validation: driver pre/post (67.6s → <1s), ring byte-identity on
    focusable pages, ACT byte-identity.

27. **1.4.1 inline-links case-05**: judge noise on stable evidence + label-vs-doctrine conflict —
    axe link-in-text-block PASSES all six links (bold = distinguishing styling) and the rubric
    defers to an axe pass, so the misses are doctrine-correct; s11's lone "catch" violated two
    rubric rules. Fix: add deterministic `linkCueParity` facts (platform-immune style math), then a
    USER DOCTRINE DECISION: F73 cue-parity clause (with an axe-DEFER carve-out) OR file the label
    as a doctrine dispute. Do not "fix" the judge. Validation: replay rep≥3 both polarities +
    link-specific-bold control page.

28. **2.1.2 input-gate case-05**: as labeled, mechanically indistinguishable from its PASSING
    siblings (probe: typing the displayed suggestion + Tab completes the flow keyboard-only);
    separating it requires the withdrawn-unsound C5 semantics. Disposition: RECOMMEND
    needs-validation retag (USER APPROVAL NEEDED — new case, not covered by the earlier ruling);
    sound alternatives noted (re-scope to its mouse-only control, or re-author).

Infra note (RCA cost): the runner persists only results.json — no per-case obligation/instrument
artifacts — so every evidence diff required probing frozen code trees. Cheap per-case artifact
dumps would cut future RCA time substantially; candidate batch-3 infra item.

## RCA-3 findings: stable FPs + token lane (merged 2026-08-17)

29. **FP 1.4.1 required-field case-06** (rubric split-brain, replay 3/3 sd=0): the legend subject
    holds the shade-key text and the contrast measurement clears IT, but member fields never
    receive the key text, so the F81 CRITICAL GUARD default fires on them. Fix: attach
    `fieldColourState.colourKeyText` (lexicon-matched instruction, clipped) in
    collect-colour-peers.js + one use-of-color-v0 sentence (stated-lightness key + measured >=3:1
    + two-state set clears members). Recall-safe by precondition (fail siblings have none of the
    three). Validation: re-freeze + replay n=3 (expect 0/3) + fail-sibling replays + 1.4.1 slice.

30. **FP 1.4.13 hover-content case-05** (deterministic, C9 tri-probe): pointer-travel loses :hover
    on a pointer-events:none bubble → true hoverable=false, but the revealed text is FULLY
    redundant with rest-visible text. Fix: redundancy exemption at applicability in
    runHoverContentTri (revealed text contained in rest-visible local text or equals trigger's
    accessible name → contentIsAdditional=false). PRICED: adopts the corpus's redundancy-decisive
    1.4.13 stance (mild label dispute recorded); a redundant-but-obscuring tooltip stops flagging
    deterministically. Validation: deterministic 1.4.13 sweep pre/post + regression fixture +
    one targeted 1.4.13 LLM slice.

31. **FP 1.4.13 persistent-timeout case-06** (deterministic, proven geometry bug): facets probed
    POST-expiry with stale tip coordinates — the reshow is an emptied husk, pointer lands outside
    → false hoverable/dismissible fails. Fix: re-reveal-integrity guard (score facets only when
    reshow signature >= original; else leave unmeasured and let persistenceSamples/
    vanishedWhileHeld route to the LLM facet lane). Preserves case-04's true catch (animation
    restarts at full strength). PRICED: a one-shot never-re-revealing true-fail would shift to the
    LLM lane (no current corpus case has that shape). Validation: same 1.4.13 sweep + pinned
    fixtures (c06 no-flag, c04 still-flag).

32. **Colour-token lane review (24 pages)**: SOUND 15 (10 catch-potential incl. the UNIQUE win —
    scoping case-07's status-dot matrix, a 3-run stable miss reachable by NO other route; +
    ui-status c05 flake stabilization) / NOISE 9-10 groups (ALL switch/checkbox/radio chrome on
    non-1.4.1 pages; the group framing is factually wrong for switches whose knob position the
    collector cannot see). STAGED RECOMMENDATION (user decision): (1) enable V3_COLOUR_TOKEN_LANE=1
    for SC-RESTRICTED runs now — +1 stable-FN recovery, zero FP surface under restrictScs;
    (2) before ANY full-page enable, narrow the instance predicate (skip interactive controls:
    native controls, tabIndex>=0, switch/checkbox/radio/button roles, aria-checked/pressed) —
    removes all chrome groups; re-measure aperture (~24→~12), then one 1.4.1 slice. Plus two
    predicate refinements: record background-image in instance marker; surface single-char content
    as a field instead of silently text-less.

## RCA-3, 4.1.3 loss cluster — PARTIAL (agent hit session limit; resumed)

Arm B rep1 (leak-restored pages, full s12 code+rubric): ALL FOUR announced-text/partial-update
losses flip back to caught — the corpus prose-leak STRIP (32ad4d3a, in the s12 tree; s11 ran
pre-strip) recovers them alone. Implication: those s11 catches were LEAK-ASSISTED — in-page answer
prose was steering the judge, and the s12 "losses" are the honest post-strip baseline, not a
remediation regression. Arm A (per-case attribution vs the status-lane remediations) + the
removal-06 doctrine brief still owed by the resumed agent. If confirmed, the paper's s10/s11
numbers on leak-carrying families are inflated relative to s12 — a corpus-integrity note, and
further vindication of the strip.

## RCA-3 findings: 4.1.3 loss cluster COMPLETE (merged 2026-08-17; supersedes the partial note)

Four-arm replay matrix (n=3/case/arm) attributes all six + wrong-politeness-02; platform
exonerated (Mac arm-A reproduces every s12 outcome); strip manifest confirms announced-02/03 +
atomic-04/05 + wrong-politeness-02 pages were stripped, removal family never was.

33. **announced-02 (leak-assisted s11 catch)** + **announced-03 (leak inflation + s12
    subject-emission luck; fixed evidence catches 3/3 in EVERY arm)**: fix = make the stand-alone
    check STRUCTURAL (verdict JSON must name the announced string AND its subject/referent before
    any clear on an observed announcement) + drive select-change in the activation sweep so the
    string reaches deterministic evidence. announced-03 expected to return with no revert.

34. **atomic-04 (leak primary)**: when atomic:false, status-detector emits the mutated sub-node's
    text as `mutatedFragment` in regionsUpdated — item 5 applies mechanically. **atomic-05 (leak +
    standing gap — typing never driven)**: deterministic type-probe into textareas/contenteditables
    near live regions; wording: births alone never license a clear (the rubric's own PARTIAL caveat
    was violated by the s12 clear).

35. **removal-02 (NOT a flip — missed both runs; births remediation clears on healthy wiring while
    the silent-empty barrier is invisible)**: record `emptiedAtMs`/last-content transitions in the
    birth observer; item-1 sentence: a healthy birth corroborates WIRING, never a clear.

36. **removal-06**: attributed to the state-change softening (adjudicator NOTE > rubric item 4;
    arm D suppresses at least as hard as A), enabled by the timeline surfacing the disabled-flip.
    Budget pool did NOT truncate. USER RULING PENDING (decision brief in the agent report):
    Reading A (label stands) → scope the softening to flows with NO preceding announced
    busy/progress message (pure attribute-flip flows keep their FP win; arm C shows zero collateral);
    Reading B (softening stands) → relabel removal-06 + audit the family. DO NOT IMPLEMENT until ruled.

37. **wrong-politeness-02 (leak)**: honest s12 UNCERTAIN; sound-catch path = surface auto-update
    cadence (the efbfc7 watcher) to the 4.1.3 lane.

38. **Corpus-integrity note for the paper**: s10/s11 recall on leak-carrying families was inflated
    by in-page answer prose legible in judge evidence (announced-02: 0/12 vs 12/12 barrier
    verdicts leak-off/leak-on). s12 post-strip numbers are the honest baseline; the strip is
    vindicated as a measurement correction, and the "4.1.3 give-back" framing in Table 1k-post7
    should be softened accordingly.
