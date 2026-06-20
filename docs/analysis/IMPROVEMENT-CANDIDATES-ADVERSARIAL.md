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

**Verdict: DROP 2.1.2 from the gate** (set {1.4.3, 4.1.2}); the principled fix for keyboard-trap is
facet-level deferral to the live keyboard instrument on the *escape* question, not a blanket SC gate. Being
verified by exp18 (`V3_HTML_GATE_SCS=1.4.3,4.1.2`). The gate set is now env-tunable.

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

**Verdict: DROP the fetch; PURSUE a cheaper alternative** — a structured signal on `sameNameLinks` that
normalizes destinations (same-path/different-query → "likely same purpose"; different-path → "possibly
different"), so the model judges path-divergence not query-divergence. No network, no missing files.

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

**Verdict: PURSUE** — port `eval-page.js`'s contrast computation (`color`/`effBg`/ratio/`reliable` + the
existing pixel-contrast runner hook) into `act-page-collect.js`, *with* the inactive/large-text applicability.
Then flat-colour contrast is settled deterministically and the rubric only routes genuinely-ambiguous
complex-backdrop cases (`reliable=false`) to the LLM. Highest-value of the candidates: a clean root cause + a
principled fix that removes the systematic contrast FP at the source. (Cross-ref: routing-analysis Tier-0 #2.)

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

## Ranked action list

1. **Method 0** — drop 2.1.2 from the gate (verifying via exp18). *Cheap, F1 +~0.006.*
2. **Method B** — port the contrast facet (with applicability) to the ACT collector. *Highest value: removes the systematic contrast FP at the source.*
3. **Method A-alt** — URL-structure signal on `sameNameLinks` (same-path/different-query → same purpose). *Cheap; addresses the dominant residual FP (2.4.4 ×3–4).*
4. **Method E** — broaden ARIA-grid detection (keep §E substance-gate). *Determinism win.*
5. **Drop:** C (voting), D (skeptic) — dominated by route-by-facet; only touch the noise tail / share the blind spot.
