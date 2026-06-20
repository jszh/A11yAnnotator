# Improvement candidates — adversarially reviewed

Brainstormed improvements to the harness, each **adversarially reviewed**: a failure-mode argument, a
constructed counterexample, and a *targeted experiment* on the existing run data where possible. The point is
to kill the bad ideas with evidence before building them. Reaches-LLM eval (66 GT-fail, 392 GT-pass). The
best config after the HTML work is the now-default facet-gated style-stripped HTML augment (exp17: 77.3 / 81.0
/ F1 0.79).

Verdict legend: **PURSUE** (evidence supports it) · **DROP** (counterexample kills it) · **CONDITIONAL**
(works only with a stated guard).

---

## 0. The promotion's own gate set — DROP 2.1.2 from the gate (SC-level gate is too coarse)

**Idea (shipped):** gate HTML augmentation OFF for runner-owned SCs {1.4.3, 4.1.2, 2.1.2}.

**Adversarial review.** 2.1.2 is a *mixed-facet* SC: the `onblur` markup the HTML exposes helps the LLM catch
*real* keyboard traps (TPs) as well as over-flag escapable ones (FPs). An SC-level gate cannot separate them.

**Targeted experiment (exp16 ungated vs exp17 gated).** Gating 2.1.2 **lost 2 real TPs** (`80af7b` GT-fail)
to remove 2 FPs; the gated config's 2.1.2 FNs rose to **4** (vs 2 ungated). The F1 math favors *ungating*:
gated = 51 TP / 12 FP → F1 0.791; ungated 2.1.2 ≈ 53 TP / 14 FP → **F1 ≈ 0.797**. 4.1.2 is clean (HTML helped
0/6 of its recall — verified), 1.4.3 is clean (its HTML benefit is 0, all over-flag).

**Verdict (REVISED after the run): KEEP the gate as shipped {1.4.3,4.1.2,2.1.2}.** My F1 estimate (0.797)
was WRONG — exp18 (`V3_HTML_GATE_SCS=1.4.3,4.1.2`) gave **0.782 < the gated 0.791** (recall +1 but FP +3 on a
fresh run, not the estimated +2/+2; LLM non-determinism dominated the point estimate). A real tension exists
(2.1.2 is mixed-facet) but blanket-ungating does not help; the principled fix is facet-level deferral to the
live keyboard instrument on the *escape* question. **Lesson: the run is ground truth; the estimate was
within-noise optimism.** Gate set left env-tunable (`V3_HTML_GATE_SCS`) for the eventual facet-level fix.

## A. Feed 2.4.4 destination *content* (resolve_destination) so the model judges purpose, not URL — DROP

**Idea:** the residual 2.4.4 FPs are same-named links to different URLs the GT treats as same-*purpose*; fetch
each destination and let the model compare content.

**Adversarial review + counterexample.** Two independent killers, both verified on `fd3a94`:
1. **The destinations don't exist.** The links point at `…/about/contact.html`, `contact-us.html?page=1`, etc.
   — **0 of 8 linked targets exist as files** in the saved single-page fixtures. `resolve_destination` would
   404 on every one (and already refuses cross-origin). The method is *infeasible* on this corpus.
2. **The discriminating signal is URL *structure*, not content.** `contact-us.html?page=1` vs `?page=2` is the
   **same path, different query** = same purpose (pagination). The model over-flags because it compares the
   whole URL string.

**Verdict: DROP — and the URL-structure alternative is ALSO refuted (scoped test).** Characterizing all 24
fd3a94 cases by URL pattern: the discriminator is **the opposite** of a clean heuristic — `contact-us.html?page=1`
vs `?page=2` (same-path/diff-query) are GT-**failed** (real barriers the LLM correctly catches), while
`index.html` vs `index-copy.html` (diff-path) are GT-**passed** (same purpose). So a "same-path → same purpose"
signal would *clear the real `?page` barriers*. 2.4.4 equivalent-purpose is irreducibly semantic; no cheap
URL signal works, and (Method G) neither model capacity nor reasoning effort fixes it either.

## B. Compute the deterministic contrast facet on the ACT collector path — PURSUE (root cause found)

**Idea:** the residual contrast FP (`afw4f7/6b811d06`, `#777` on `#EEE`) is *vision-driven* (verified — the
style-strip cleaned the markup, the model read the gray off the crop). Stop the model re-judging contrast.

**Targeted experiment (collector probe).** The element collects `contrastRatio=undefined,
contrastReliable=undefined`. **`act-page-collect.js` has 0 contrast refs; `eval-page.js` has 12.** So the
deterministic contrast facet is computed on the *corpus* path but **not** the ACT *eval* path — meaning the
contrast rubric's gate (`contrastReliable !== true`) is *always* true on the eval set, so **every** 1.4.3
obligation falls through to the LLM, which judges flat-colour contrast from the crop and over-flags
inactive/large-text cases (missing applicability).

**Adversarial caveat (the guard that makes it sound).** Porting the ratio alone is *not* enough — the FPs are
GT-*inapplicable* (disabled / inactive / large-text), so the port must carry the **applicability** (skip
inactive components; use the large-text threshold), or it just moves the over-flag from the LLM to a
deterministic FP. Counterexample if skipped: `#777`-on-`#EEE` is 3.5:1 (< 4.5) → a naive deterministic check
flags it, but the case is inapplicable → still an FP.

**Verdict: PURSUE — split into two, part 1 SHIPPED.** Scoped `--sc=1.4.3` test (exp20) splits B:
- **Part 1 — inactive-component exemption (SHIPPED, commit ecca50e).** The afw4f7 inapplicable FPs are all
  DISABLED controls (`<fieldset disabled>`, `<div role=button aria-disabled>`, a `<label>` wrapping / named-by a
  disabled control). `act-page-collect` now flags `inactiveText`; the oracle skips the 1.4.3 obligation.
  Probe-verified: all 4 disabled cases → exempt (noObligation); 3 real GT-fail barriers NOT exempted (0
  over-fire). WCAG-correct (1.4.3 exempts inactive components).
- **Part 2 — contrast-RATIO port (TESTED → REVERTED).** Implemented the port (ratio + bold/large threshold +
  a boundary guard) and scoped-tested it (`--sc=1.4.3`, exp22). It **failed**: a deterministic-mint FP on
  `afw4f7/dc170fd0` (GT-pass). The fixture is `p{color:#ccc; background:#000 + black-hole.jpeg}` — at the
  collector's settle moment the `<style>`/bg-image hadn't rendered, so `#ccc` read on default white → ratio
  ~1.6 → "clear fail" → minted (a fresh probe, styles applied, correctly gets reliable=false). **Collection-
  time contrast is timing-fragile** w.r.t. style/image application, so a deterministic disposition over it
  mis-fires. The **vision LLM sees the RENDERED page**, so contrast is more robustly left to it. Also exposed a
  genuine boundary issue: `319a4651` is GT-pass at ratio **4.43 vs 4.5** — the GT is lenient within rounding,
  so strict deterministic contrast over-flags near the threshold regardless of timing. **Verdict: do not port
  a deterministic contrast disposition to the ACT path.** A future *evidence-only* variant (surface the ratio
  to the LLM where reliably flat, no disposition) is lower-risk but unproven; the active-control contrast FPs
  are accepted as a near-threshold/ambiguity limitation. Reverted; B part 1 stands.

**Opus FN deep-dive (refines Method G).** Analyzing the 2.4.4 barriers Opus missed: all 4 are confident
`LIKELY_OK` clears (not abstain, not noObligation), and Opus *cites the destinations it was given* (chat/phone,
`redirect1.html`, `?page` — verified factually grounded, not hallucinated). So: **0% missing signal**; **~70%
model-calibration** (Opus has a stronger lenient "equivalent-purpose" prior — pagination/redirects/nearby text
all read as equivalent); **~30% soft prompt-overfit** (the rubric states the strict rule, Sonnet follows it,
Opus's lenient prior overrides the same instructions — so the prompt implicitly relies on Sonnet's disposition).
A *model-robust* operational test ("differ in path OR query and the name alone doesn't state the distinct
purpose → barrier; do not infer equivalence from redirects/pagination/non-enclosing text") would de-couple the
rubric from Sonnet — but part of the gap is irreducible rule-ambiguity (some Opus clears are defensible).

## G. Faceted LLM — stronger model / higher reasoning for hard (high-FP/FN) categories — DROP

**Idea:** route the hard categories (2.4.4, 4.1.2, 1.1.1) to Opus or `effort=high` instead of Sonnet/medium.

**Targeted experiments.** (1) `effort=high` full run (exp19) vs medium (exp17): F1 **0.768 < 0.791**; the
systematic FPs (2.4.4 ×4) and hard FNs (4.1.2 ×3, 1.1.1 ×3) are **identical** — stable across effort. (2) Opus
scoped to 2.4.4 (exp21) vs Sonnet: Opus is *more conservative* — TP **13→9**, FP 4→3 → F1 **0.69 vs 0.84**. It
trades 4 real barriers for 1 fewer FP, the wrong direction for detection.

**Verdict: DROP.** Neither reasoning effort nor model capacity selectively fixes the systematic errors — they
are **evidence/knowledge-limited, not capacity-limited** (purpose-equivalence and alt-adequacy are genuinely
ambiguous). Confirms the harness thesis: improvement comes from *evidence provisioning* (Method B part 2), not
LLM scaling.

## C. Self-consistency / multi-seed voting (reduce LLM noise) — DROP (only fixes the noise tail)

**Idea:** run the LLM N times per subject, majority-vote, to cut variance.

**Targeted experiment (cross-run consistency, 4 HTML+vision runs).** Of 27 GT-pass cases *ever* flagged: **12
are systematic** (flagged in ≥3/4 runs) and only **10 are noise-like** (1/4). The systematic set is exactly
the RCA cases — `afw4f7/1.4.3` contrast, `fd3a94/2.4.4` ×3, `7d6734/1.1.1` SVG, etc.

**Counterexample.** `afw4f7/1.4.3` is flagged in ≥3/4 runs → a 3-vote ensemble would *confirm* the FP, not kill
it. Voting cannot touch a **consistent evidence-interpretation error**; it only smooths the ~10 noise FPs
(~2.5% of 392), at N× cost.

**Verdict: DROP** — dominated by route-by-facet for the systematic errors (which it cannot fix) and marginal
on the noise tail. (The style-strip already removed the systematic contrast FP that voting *cannot*.)

## D. Adversarial verification (skeptic refutes each flagged barrier) — DROP / CONDITIONAL

**Idea:** per LLM-flagged barrier, spawn a skeptic prompted to refute; kill if refuted.

**Adversarial review.** A skeptic re-reading the *same* evidence shares the same systematic blind spot
(Method C shows these errors are stable across independent judgments). For `afw4f7` it would reason "yes, gray
on light-gray *is* low contrast → barrier real" and **confirm**. It also risks refuting *real* barriers (the
same-name-different-purpose 2.4.4 TPs), costing recall.

**Verdict: DROP as a generic pass; CONDITIONAL only if the skeptic is given the *grounding* facet** (the
deterministic ratio for contrast, the path-equivalence for 2.4.4) — but that is just route-by-facet again, so
it's redundant. Verification adds value for *novel* claims, not for these systematic evidence errors.

## E. Extend `collectTables` to ARIA grids (the 1.3.1 `d0f69e` gap) — CONDITIONAL

**Idea:** the HTML augment currently *compensates* for the `<table>`-only collector missing a `div/role=grid`
table (`d0f69e`). Collect ARIA grids deterministically instead.

**Adversarial review.** Already analyzed in DEFERRED-TODO §E: gating 1.3.1 enumeration on structure-*presence*
is unsafe (the *absence* of structure is the barrier for fake-heading/no-heading cases). Broadening
`collectTables` to `role=grid|table|treegrid` is safe (more detection), but the *enumeration* gate must stay
on page **substance**, not table-presence.

**Verdict: CONDITIONAL** — broaden the *detection* (ARIA roles) but keep the substance-gate from §E. Lower
priority than B; the HTML augment already recovers `d0f69e`, so this is determinism/elegance, not new recall.

## F. FN recovery — limited headroom (residual FNs are hard semantic)

**Targeted experiment (FNs of the best config).** exp17 FNs by SC: 4.1.2 ×3 (name-role-value), 1.1.1 ×3
(alt-adequacy), 2.1.2 ×4 (the gate artifact — Method 0), 1.4.5 ×2 (image-of-text), 2.4.2/2.4.10/2.4.4 ×1 each.

**Reading.** Excluding the 2.1.2 gate artifact (fixed by Method 0), the residual FNs are **hard semantic
judgments** (is this alt adequate? is this control's name right? is this text-in-an-image essential?) that *no*
evidence form recovered across configs — they are at the boundary of what the LLM does reliably, not an
evidence-provisioning gap. **Verdict:** limited headroom; do not chase with more evidence. The honest framing
for the paper's limitation section.

---

## Ranked action list (post-scoped-test)

1. **Method E** — broaden ARIA-grid detection (keep §E substance-gate). *Determinism win; HTML already recovers d0f69e.*
2. **Method B parity** — replicate `inactiveText` (B part 1) on the eval-page (corpus) path.
3. **(optional) evidence-only contrast** — surface the flat-colour ratio to the contrast rubric *as evidence*
   (no disposition), grounding the vision LLM where reliably flat. Lower-risk than the reverted deterministic
   disposition; unproven — needs its own scoped test.
4. **SHIPPED:** HTML promotion (default), B part 1 (1.4.3 inactive-component exemption).
5. **DROP / REVERTED:** B part 2 (deterministic contrast — timing-fragile), Method 0 (gate-ungate, run-refuted),
   A (URL signal, scoped-refuted), C (voting), D (skeptic), G (faceted-LLM — effort + Opus both refuted; the
   Opus FN gap is model-calibration + soft prompt-overfit, not missing signal). The throughline: every generic
   LLM lever (more votes, a skeptic pass, more reasoning, a bigger model) is dominated by — or, for deterministic
   contrast, defeated by the timing-fragility of — *provisioning the right facet-routed evidence*; the durable
   wins (det floor, route-by-facet, the inactive-exemption, the vision lane) all hold.
