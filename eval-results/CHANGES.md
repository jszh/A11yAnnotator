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
