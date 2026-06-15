# Harness fixes & changes — change log (2026-06-14)

Everything changed while fixing the harness issues catalogued in
[`HARNESS-ISSUES.md`](HARNESS-ISSUES.md). Issue tags (T1–T16) reference that file.

**Scope rule honoured:** the per-page eval data under `eval-results/<slug>/`
(`collect.json`, `drive.json`, `results.json`, `notes.md`, shots) was **NOT
modified**. The only files touched inside `eval-results/` are this changelog and
[`AGENT-PLAN.md`](AGENT-PLAN.md) (the prompt), both at the user's request. All
behavioural fixes live in `scripts/`.

> The old per-page results were produced by the buggy harness and remain frozen for
> reference. To get accurate results, **regenerate `collect.json`/`drive.json` with
> the fixed scripts and re-run the agent pass** — ideally only for the ~254 affected
> elements. Old bundles lack the new fields and carry the old bugs.

---

## Files added

| File | Lines | Purpose |
|---|---|---|
| `scripts/lib/a11y-eval.js` | 171 | Shared **pure** helpers (no DOM/puppeteer) — the logic fixes, unit-testable. Required by both browser scripts. |
| `scripts/tests/unit.test.js` | 123 | `node:test` unit tests for the pure helpers — **21/21 pass**. |
| `scripts/tests/integration.test.js` | 105 | End-to-end tests vs the live server on known pages — **9/9 pass** (auto-skips if `:3001` is down). |
| `scripts/tests/regression-sweep.js` | 56 | Cross-page invariant checker over a results dir (read-only). |
| `scripts/tests/TEST-PLAN.md` | 113 | QA method per issue + coverage matrix + run instructions. |

## Files modified

| File | Change |
|---|---|
| `scripts/eval-page.js` | T4, T3, T5/T11, T12, T14 (static collector). |
| `scripts/drive-page.js` | T1/T8, T2, T6, T9/T10, T12, T13, T14, T15 (dynamic driver). |
| `eval-results/AGENT-PLAN.md` | Prompt rewritten to use the new fields & calibrate verdicts (→ v3). |

---

## What changed, by issue

### T1/T8 — focus ring (the highest-impact fix) · `drive-page.js`, `lib`
- **Before:** focus verdict came from a tab-walk screenshot diff + an outline read
  taken while the element was often *unfocused* or off-screen; a wrong/blank crop gave
  `diff=0` that was misread as "no ring." ~113 focus REPRODUCED verdicts at risk;
  ~65–75 estimated false positives.
- **After:** new `forcedFocusRing()` forces `:focus-visible` via CDP
  `CSS.forcePseudoState` and reads the outline + a *fresh* screenshot diff
  (scroll-independent). `focusRingDecision()` (in `lib`) combines forced-diff >
  computed-while-focused-outline > tab-diff and returns a **tri-state**
  `focusIndicator.present` (`true`/`false`/`null`=PARTIAL). Black-frame crops
  detected via `frameStats()`+`isBlankFrame()`.

### T2 — keyboard over-report on composite widgets · `drive-page.js`, `lib`
- Arrow-key probe now uses **real (trusted) `page.keyboard.press`** instead of
  synthetic `dispatchEvent`. New `keyboardSignal{operable,confident,reason}` from
  `keyboardOperabilitySignal()` — roving-tabindex items (`tab`/`option`… with
  `tabindex=-1`) are no longer flagged 2.1.1 for being un-Tab-reachable; synthetic-only
  / un-hydrated evidence yields `operable:null` (→ PARTIAL), not a confident failure.

### T3 — target-size 2.5.8 exceptions · `eval-page.js`, `lib`
- `evalTargetSize()` applies the **spacing** (24px-circle non-overlap) and **inline**
  (pure `display:inline`, text-flow) exceptions. `eval-page.js` now emits
  `targetSize{passes,reason}` plus `nearestTargetCenterDist`/`display`/`isInline` —
  replacing the raw `box<24` rule that false-flagged footer/nav text links.

### T4 — large-text contrast threshold bug · `eval-page.js`, `lib`
- `isLargeText()`/`contrastThresholdFor()` use the correct WCAG bands —
  **18pt = 24px** (normal) and **14pt = 18.66px** (bold) — replacing the
  `fontPx>=14 && bold` bug that gave bold 14–18.66px text the lenient 3.0 threshold
  (e.g. Domino's "JOIN NOW" 16px-bold 4.33:1 was wrongly passed).

### T5/T11 — container / overlay contrast unreliable · `eval-page.js`
- `effBg` walk now sets `bgWalkCrossedOverlay` when it crosses a
  positioned/transformed/z-indexed ancestor; `textInChildDiffColor` flags text in a
  differently-coloured child. Either → `contrastReliable:false` + `needsPixelContrast`,
  so the agent uses pixel-contrast instead of a misleading element-level ratio.

### T6 — DOM instability across the two loads · `drive-page.js`
- Per-element **re-locate retry** after a short settle (logs `relocated after retry`);
  residual misses stay honest `notFound`. (Plan: never assert a definite *dynamic*
  verdict on a `notFound` element.)

### T9/T10 — virtual-SR signal hygiene · `drive-page.js`, `lib`
- `meaningfulAnnouncement()` drops root/landmark noise (the `"document"` artifact) and
  sticky/stale repeats; raw kept in `activate.vsrRaw`. The VSR is now `stop()`-ed
  before every reload so it doesn't re-emit the document-root phrase.

### T12 — offline media artifacts · `eval-page.js`, `drive-page.js`, `lib`
- `isMediaErrorName()` flags `axName="Unable to play media."` as not author-supplied
  (`mediaErrorName`/`axNameAuthorSupplied:false`); `isBlankFrame()` flags black-frame
  crops so a black-on-black diff isn't read as "no ring."

### T13 — tab-walk cap + trap · `drive-page.js`
- Global tab-walk default cap raised **50 → 120** and bounded by a **wall-clock
  budget** (`TABWALK_BUDGET_MS`, `tabWalk.budgetExceeded`) so deep elements on large
  pages are reached; local walks remain the reachability source of truth.

### T14 — cookie/consent overlay contamination · both scripts, `lib`
- `CONSENT_SELECTORS` (OneTrust, cmplz, Cookiebot, etc.) hidden before collection so
  banners no longer darken every screenshot or inject duplicate headings. Count
  recorded in `consentHidden`.

### T15 — forms probe submitted junk forms · `drive-page.js`
- The error-on-submit probe now **skips forms with 0 visible editable fields**
  (cookie/hidden/modal/0-field) — emitted as `forms[].skipped` — and only probes
  forms that actually own a field.

### T7 / T16 — inherent (flagged, not "fixed")
- T7 noscript SSR-vs-live: `scriptsDisabled` surfaced; verdicts carry the no-JS caveat.
- T16 sampling: real failures outside the sampled set are to be reported as a separate
  "unsampled" count in `notes.md` (plan rule), not silently dropped.

---

## Agent-plan (`AGENT-PLAN.md`) changes → v3
Rewrote the instructions that *caused* agent-side errors and wired in the new fields:
- **Step 1** name — discount `mediaErrorName` names (T12).
- **Step 2** contrast — trust corrected `contrastThreshold`; route to pixel when
  `contrastReliable:false` (T4/T5/T11).
- **Step 3** keyboard — use `keyboardSignal` tri-state; roving-tabindex carve-out (T2).
- **Step 5** focus — use `focusIndicator.present` tri-state; **never** conclude "no
  ring" from `diff=0` / blank crop / unfocused-computed; visual check is corroboration
  only (T1/T8).
- **Step 6** announcement — `vsrAnnouncement` is noise-filtered; ignore `vsrRaw` (T9).
- **Step 7** target-size — use `targetSize.passes/reason`, not `box<24` (T3).
- **Step 8** forms — ignore `forms[].skipped` (T15).
- **Rules** — calibrate confidence (PARTIAL when indeterminate; contradiction rate
  ~10–15%, not 5%); no definite dynamic verdict on `notFound` (T6); report unsampled
  axe failures separately (T16); treat `consentHidden`/`trapDetected`/`skipped` as
  bookkeeping.
- **§1/§2** field references updated to list the new `collect`/`drive` fields.

---

## Verification

| Suite | Result |
|---|---|
| `node --test scripts/tests/unit.test.js` | **21 / 21 pass** |
| `node --test scripts/tests/integration.test.js` (live `:3001`) | **9 / 9 pass** (~3.8 min) |
| `node scripts/tests/regression-sweep.js eval-results` | flags **885** pre-fix violations in the OLD data (proves the checker; fixed harness output passes) |

End-to-end checks confirmed on real pages: Apple el7/el10 focus false-positives →
`present:true`; Apple el4 (suppressed outline) → `present:false`; Home Artera footer →
target-size passes; Domino's "JOIN NOW" → threshold 4.5; Calendly "Read now" →
`contrastReliable:false`; Google Drive tab → `keyboardSignal.operable:null`; BuzzFeed
→ zero `"document"` announcements; Reebok → cookie forms skipped.

## How to re-validate after a re-eval
```
node --test scripts/tests/                          # unit + integration
node scripts/tests/regression-sweep.js <results-dir>  # cross-page invariants
```

---

# Round 2.1–2.3 — independent-audit remediation (2026-06-14)

Three independent audit rounds (`ROUND2*-INDEPENDENT-VERIFICATION.md`) each found real
residual gaps. **Round 2.3** was organised by ROOT CAUSE rather than by example, per the
instruction "address the root cause … think about edge cases that reveal limitations,
rather than just fixing the examples identified." Each fix below ships adversarial
fixtures/tests that go beyond the auditor's single counterexample.

### R2.3-A — 2.5.8 target size · root: *necessary ≠ sufficient → needs-judgment* (R22-H2)
Every 2.5.8 false-pass came from treating a necessary condition as sufficient. Principle:
when the harness cannot PROVE an exception/pass, it returns `needs-judgment`, never a
definite verdict. · A 24×24 bbox is a definite pass ONLY for an axis-aligned rectangle —
element/ancestor transforms (rotation/skew via matrix off-diagonals), clip-path, and
corner radii too large for a page-aligned 24×24 square to fit (`_square24Fits`) →
needs-judgment. · UA-control exception now requires NATIVE appearance (not
`appearance:none`) AND no transform AND default size — matching size alone is not proof. ·
Inline is NEVER an auto-pass (no heuristic can prove "in a sentence"); an inline target
failing geometry → needs-judgment. · `eval-page.js`, `lib`, `fx-shape.html`.

### R2.3-B — keyboard trap · root: *detect the actual property, not a proxy* (R22-H1)
2.1.2 is "focus cannot move away from a component." The old detector gated on
`totalFocusables > seenAll.size` — a proxy that silently disabled detection on a trap-ONLY
page (the cycle covers every focusable). Now: trigger on the bounded cycle itself, then
confirm by appending a focusable BOUNDARY SENTINEL at document end and testing whether
Escape/Tab/Shift+Tab can reach it. A real trap never reaches the sentinel — true even when
the whole page is the trap. · `drive-page.js`, `fx-trap-only.html`.

### R2.3-C — result gate · root: *completeness + determinism* (R22-C1/C2)
The gate proved SHAPE, not that evaluation happened, and dedup made the normative total
order-dependent. · Every verdict (incl `N/A`, `NOT REPRODUCED`) now needs evidence; page
skills may not be `N/A`; results carry PROVENANCE derived from `collect.json` (not the
agent) so a fabricated element can't validate and a collected one can't be silently
dropped. · Dedup uses FULL evidence + scope/skill/sc/bucket/rule and MERGES
REPRODUCED>PARTIAL with a canonical representative xpath → order-independent tally; issues
are sorted canonically; the validator compares rebuilt arrays EXACTLY (catching
duplicates) and rejects unexpected schema keys. · `lib/result-builder.js`,
`tools/build-results.js`.

### R2.3-D — isolation/trust · root: *enforce, don't trust* (R22-H3)
The "non-isolated probe ⇒ PARTIAL" rule was unenforceable and the activation reload was
conditional (a native control was activated sharing state with the prior hover/keyboard). ·
Activation is now reloaded + re-located UNCONDITIONALLY; every probe carries
`trusted`/`isolated` flags surfaced in a per-element `behavioralTrust` summary. · The
validator REJECTS a definite dynamic verdict stamped `trust:"synthetic"` or
`isolation:"shared"` — it must be PARTIAL. · `drive-page.js`, `lib/result-builder.js`.

### R2.3-E — consent inventory + doc/contract drift (R22-M1/M2)
Consent overlay is analysed WHILE VISIBLE then neutralised; only visible+focusable
controls counted (a hidden input no longer inflates 4.1.2); a multi-selector container is
counted once; findings are PARTIAL until exercised live. · `AGENT-PLAN.md` 2.4.13 proxy
field names corrected; "every issue needs an SC" relaxed to normative-only with `rule`
support; provenance/trust/isolation/page-N/A rules documented; `RESULT-CONTRACT.md` hard
invariants rewritten. · `eval-page.js`, `fx-consent.html`, docs.

**Auditor files** (`ROUND2*-INDEPENDENT-VERIFICATION.md`) are the auditor's and are left
untracked. Per-page eval data under `eval-results/<slug>/` remains FROZEN (pre-W7).

---

# Round 2.4 — second independent-audit remediation (2026-06-14)

Round 2.3's auditor (`ROUND23-INDEPENDENT-VERIFICATION.md`) found that each R2.3 fix
applied the right principle at the wrong DEPTH/BOUNDARY. R2.4 re-grounds them on two
structural rules: **anchor every gate to independent ground truth** (not a value the
evaluated party controls) and **prove-good rather than enumerate-bad** (default-closed).

### R2.4-A — provenance ground truth, default-closed completeness (R23-C1)
`complete` was derived FROM the records (circular) and `collect.json` was optional. Now
collect.json is MANDATORY, provenance is derived only from it, and completeness is always
enforced: every collected element is evaluated OR in `skipped:[{xpath,reason}]`. Inventory
count/dup/skip integrity validated. · `tools/build-results.js`, `lib/result-builder.js`.

### R2.4-B — behavioral verdicts bound to DRIVER evidence (R23-C2)
trust/isolation were optional and self-attested; forms were unenforced. Now build-results
REQUIRES drive.json; a DEFINITE behavioral verdict (4 dynamic skills + forms) is bound to
the driver's behavioralTrust/focusIndicator/forms — even an agent-stamped `trust:"trusted"`
fails if the driver shows no trusted+isolated probe. WCAG 2.1.1 native presumption supports
only "operable" (NOT REPRODUCED), never a keyboard failure. · `lib/result-builder.js`,
`tools/build-results.js`, `lib/result-schema.js`, `tools/regression-sweep.js`.

### R2.4-C — non-mutating keyboard-trap detection (R23-H1)
The boundary sentinel was a real focusable node a page could enumerate/absorb. Replaced
with PASSIVE listeners observing the actual 2.1.2 interference: `Tab` keydown
`defaultPrevented` OR focus-redirect (focusins > Tab presses). Stuck-cycle + interference ⇒
trap; stuck without interference ⇒ wraparound. · `drive-page.js`,
fx-trap-delegated/fx-trap-redirect.

### R2.4-D — target-size positive hit-area proof (R23-H3)
Enumerated shape flags missed overflow-clip and SVG. Now the collector hit-tests whether a
page-aligned 24×24 square centred on the target is FULLY on the target (elementFromPoint
grid); true→pass, false→needs-judgment, null(off-screen)→fall back to flags. Subsumes
transform/clip/radius/overflow/SVG and is more accurate. · `eval-page.js`, `lib/a11y-eval.js`,
fx-target-overflow/svg/circle.

### R2.4-E — fully canonical merge (R23-M1)
The representative xpath now comes from a contributor that CARRIES the winning verdict
(highest precedence, then smallest xpath), and evidence whitespace is collapsed in identity
+ emission — byte-stable regardless of order or raw casing. · `lib/result-builder.js`.

### R2.4-F — recursive strictness (R23-M2)
SC-allowance/level now validated on ANY verdict carrying them (not issues only); nested key
checks added for summary.issues[]/countBasis/bySkill cells. · `lib/result-builder.js`.

**Build command is now:** `build-results.js <records> <results> <collect.json> <drive.json>`
(both inputs mandatory). Auditor files (`ROUND2*-INDEPENDENT-VERIFICATION.md`,
`fx-audit-r23-*`) remain untracked; per-page `eval-results/<slug>/` data stays frozen.

---

# Round 2.5 — third independent-audit remediation (2026-06-14)

Two independent audits of R2.4 (an adversarial self-audit workflow + the external
`ROUND24-INDEPENDENT-VERIFICATION.md`) converged on one deep root cause: **R2.4 bound
verdicts to the EXISTENCE/trust of evidence, not its observed OUTCOME**, and still gated on
representations the evaluated party shapes (skip lists, un-identity-bound artifacts) or the
page can suppress (interference observation, sparse samples). R2.5 re-grounds on: **bind to
the observed outcome (ground truth); where the conforming outcome can't be positively
demonstrated, return PARTIAL/needs-judgment, never a definite verdict.**

### R2.5-A — outcome-aware behavioral binding (R24-C1, CRITICAL)
`behavioralSupport` now reads the driver's OBSERVED outcome and rejects a verdict that
contradicts it: 2.4.7↔`focusIndicator.present`, 2.1.1↔observed key response, 4.1.3↔a
captured `vsrAnnouncement`, 3.3.1↔the FIELD'S OWN form (perField xpath added)
text-identification, 2.4.3↔`focusReturnedToTrigger`. Native presumption supports only
`NOT REPRODUCED`. · `lib/result-builder.js`, `drive-page.js`.

### R2.5-B — bounded + ground-truth-checked skips (my #1)
The agent-controlled skip list could launder a mass-drop into a "0 failures" audit. Now:
substantive reason (≥8 chars, a real word), 25% cap, `{xpath,reason}`-only, and an AXE
FLOOR — if the collector's axe found critical/serious violations, an audit that skipped
elements may not report 0 failures. · `lib/result-builder.js`, `tools/build-results.js`.

### R2.5-C — run/page identity binding (R24-H1)
`records.file === collect.file === drive.file` enforced; duplicate raw collector xpaths
rejected (no silent dedup); collector page recorded in provenance and re-checked against
`results.file`. · `tools/build-results.js`, `lib/result-builder.js`.

### R2.5-D — trap: outcome-layer signals + indeterminate verdict (R24-H2, my #3/#4)
The interference model is defeated by `stopImmediatePropagation` and disable-the-escape
traps. Added focus-FROZEN and background-DEFOCUS (MutationObserver) signals (below the page
event layer), fixed the `st.none` body-wrap short-circuit, and made a bounded cycle with no
demonstrable escape **indeterminate** (`trapDetected:null`) rather than a false wraparound.
· `drive-page.js`, fx-trap-stopimmediate/fx-trap-disable.

### R2.5-E — target-size: dense hit-test, disprove-only (R24-H3, my #5/#7/#9)
The sparse 5×5 grid can't prove a solid square. Densified to ~2px, scrollIntoView for
off-viewport targets, and a definite pass now REQUIRES `squareFits===true` — `null`
(unmeasurable) → needs-judgment, never a flag-pass. · `eval-page.js`, `lib/a11y-eval.js`,
fx-target-strip/belowfold/solid.

### R2.5-F — fail-closed recursive validation (R24-M1, my #8)
Malformed `sc`, level-without-sc, corrupted `countBasis` values, and a null `summary.issues`
entry (was a TypeError) are now rejected fail-closed. · `lib/result-builder.js`.

### R2.5-G — contract/plan sync (R24-M2)
`RESULT-CONTRACT.md` + `AGENT-PLAN.md` updated: outcome-aware binding, identity, default-
closed completeness + skip cap + axe floor, tri-state 2.1.2.

**Build command unchanged:** `build-results.js <records> <results> <collect.json> <drive.json>`.
Auditor files (`ROUND2*-INDEPENDENT-VERIFICATION.md`, `fx-audit-*`) remain untracked; per-page
`eval-results/<slug>/` data stays frozen.

---

# Round 2.6 — R2.5 self-audit remediation (2026-06-14)

The R2.5 adversarial self-audit found 10 residual gaps (0 critical, 4 high) — mostly
*completeness* of the R2.5 mechanisms rather than new classes. All fixed.

- **A (#1/#5/#6)** outcome-binding completeness: contradiction checks are keyed to the
  cited **SC, not the skill** (a 2.4.7 claim on focus-management is now ring-checked);
  the driver emits the COMPLETE `fieldXpaths` so EVERY form field binds to its own form
  (not just the first 8) with a strict page-level fallback; a `NOT REPRODUCED` 4.1.3 is
  rejected on a SILENT status change. · `lib/result-builder.js`, `drive-page.js`.
- **B (#2)** the axe skip-floor no longer gates on `normativeFailures===0` (a single
  fabricated failure used to disable it) — any skip while axe found serious violations is
  rejected. · `lib/result-builder.js`.
- **C (#3/#9)** **run-id** identity: eval-page + drive-page stamp a shared `runId`;
  build-results requires `collect.runId === drive.runId` so a STALE drive from an earlier
  run of the same page is rejected; raw-dup xpath check is whitespace-normalized.
  · `eval-page.js`, `drive-page.js`, `tools/build-results.js`.
- **D (#4/#7)** trap walks that never reach an in-loop verdict are resolved: `count:0`
  with focusables present → frozen-trap/indeterminate; `MAXTAB`-without-convergence →
  indeterminate. · `drive-page.js`.
- **E (#8/#10)** target hit-grid densified to **1px** (closes the 2px Nyquist blind spot —
  a sub-2px comb/strip is now caught). · `eval-page.js`.

R2.5-F (recursive validation) had **0** findings — that surface is exhausted. Auditor
files remain untracked; per-page `eval-results/<slug>/` data stays frozen.

**Build/CLI note:** pass the SAME `--run-id` to `eval-page.js` and `drive-page.js` in one
run; `build-results.js <records> <results> <collect.json> <drive.json>` enforces it.

---

# Round 2.7 — R2.6 self-audit remediation (2026-06-14)

The R2.6 adversarial self-audit found 9 gaps (0 critical, 2 high) — two were fail-OPEN
holes in checks I had just added; the rest were completeness/false-positive edges (two
of which I had self-predicted). All 8 real ones fixed (#9 was rated not-a-bug by the
verifier itself).

- **A (#1/#3)** the driver's `liveRegionChanged` matched `aria-live="off"` regions, so a
  SILENT status change suppressed the 4.1.3 contradiction — now `aria-live="off"` is
  excluded. A 3.3.1 verdict on a field NOT covered by any probed `<form>` is rejected →
  PARTIAL (no page-level laundering). · `drive-page.js`, `lib/result-builder.js`.
- **B (#2/#4/#8)** axe floor: `axeRan` sentinel makes it FAIL CLOSED (axe-not-run + skip →
  reject); counts any WCAG-SC-tagged violation (not just critical/serious impact);
  wired into `regression-sweep`. · `eval-page.js`, `tools/build-results.js`,
  `lib/result-builder.js`, `tools/regression-sweep.js`.
- **C (#5/#6)** run-id proved coordination, not freshness — now also require
  `drive.drivenAt >= collect.collectedAt` (stale reused-id drive rejected); xpath dedup
  strips ALL whitespace (predicate-spacing variants). · `tools/build-results.js`,
  `eval-page.js`/`drive-page.js` (timestamps).
- **D (#7)** `MAXTAB`-without-convergence is only `indeterminate` when interference was
  ALSO observed — a clean long nav (>120 links) is no longer a false trap. · `drive-page.js`.

E (target) and F (recursive) surfaces stayed exhausted. Severity trend: R24 1-crit/3-high
→ R2.5 0-crit/4-high → R2.6 0-crit/2-high. Auditor files untracked; per-page data frozen.

---

# Round 2.8 — external R27 audit remediation (2026-06-15)

The external `ROUND27-INDEPENDENT-VERIFICATION.md` (1 Critical, 5 High, 2 Medium) found the
binding was *contradiction-based* (a failure validated when the driver merely didn't observe
a contradiction) and several gates fail-OPEN on missing fields. All fixed.

- **A (C1)** SUPPORT-based binding: a definite behavioral verdict must be POSITIVELY
  demonstrated by an observed outcome (silence ≠ failure). 2.1.2 is bound to the page
  `tabWalk`; 4.1.3 needs an OBSERVED status message; `liveRegionChanged` excludes
  display:none/`aria-live="off"` regions. · `lib/result-builder.js`, `drive-page.js`.
- **B (H4)** driver inventory integrity: duplicate/extra driver xpaths rejected (evidence was
  order-dependent). · `tools/build-results.js`.
- **C (H3)** axe fails CLOSED (`axeRan === true`); RECONCILIATION — every WCAG-tagged axe SC
  must be a finding or an `axeAdjudications` entry. · build-results, builder, sweep.
- **D (H2)** freshness: timestamps REQUIRED finite; `collectedAt` stamped at collector
  COMPLETION so `drivenAt >= collectedAt` proves the driver used a completed collection.
- **E (H1)** `regression-sweep` requires all three parseable artifacts per page + re-runs the
  identity/freshness gate (an incomplete page now fails, not silently passes).
- **F (H5 + my #4/#5)** trap: `defocus` counts only a REMOVED reachable route (empty divs no
  longer false-trap); background-defocus DEMOTED to indeterminate-suspect; a MAXTAB-unconverged
  walk is honestly indeterminate.
- **G (M1)** strict `floor(25%)` skip cap (no min-2).
- **H (M2)** RESULT-CONTRACT synced + docs tests for the sentinel/freshness/skip-cap/sweep.

Auditor files remain untracked; per-page `eval-results/<slug>/` data stays frozen.
