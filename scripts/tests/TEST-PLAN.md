# Harness fix — QA / test plan

Covers every issue catalogued in `eval-results/HARNESS-ISSUES.md` (T1–T16). Each
issue gets (a) the fix location, (b) one or more QA methods, and (c) a concrete,
re-runnable check. The eval-results are **not** modified — these tests run the
fixed harness against the saved pages fresh.

## How to run
```
node --test scripts/tests/unit.test.js          # pure-function unit tests (fast, no browser)
node --test --test-timeout=600000 scripts/tests/integration.test.js   # end-to-end vs live server :3001
node --test --test-timeout=600000 scripts/tests/*.test.js             # everything (glob — NOT the bare dir)
node scripts/tools/regression-sweep.js eval-results                   # cross-page invariants
```
Use the `*.test.js` glob, not the bare directory (`node --test scripts/tests/` tries to
*load* the path as a module and fails). The integration suite has a non-skipped
**precondition** test that FAILS if `:3001` is down, so a no-server run can't silently
pass with zero executed integration assertions; its individual cases still skip.

### Round-2 suites (response to the independent audit — REMEDIATION-PLAN.md)
- `unit.test.js` — pure logic incl. the audit counterexamples: target-size circle-to-rect
  (`{w:10,h:10}` near a large neighbour → fail, C4) and focus focus-dependence
  (always-on shadow → false, H1).
- `result.test.js` — deterministic builder + schema validator: each **C5** corruption
  (anyIssue/bySkill drift, disallowed SC e.g. 4.1.3 on focus-visibility, empty evidence,
  missing skill key) is rejected.
- `docs.test.js` — normative-consistency (no browser): skill/plan ↔ lib/contract
  (4.1.3 scope C1, 3.3.1 C2, 1.3.1 buckets H5, contrast threshold H6).
- `evidence.test.js` — the same counterexamples proven END-TO-END on deterministic
  fixtures served by the annotator: `fx-focus.html` (always-on shadow vs real ring vs
  suppressed), `fx-target.html` (small-near-large vs isolated), `fx-states.html` (H7).
- `scripts/tools/regression-sweep.js` — cross-page invariants incl. the C5 aggregate
  rebuild, T6 notFound, T9/H3 walk speech, present value-domain, T3 geometry.

### Round-2.1 suites (response to the independent round-2 verification)
- `result.test.js` — STRICT validator: rejects missing summary/pageSkills, an issue with
  no SC, a wrong level, content-corrupted issue lists, multi-SC violations, and a definite
  dynamic verdict on a notFound element; aggregates page-level findings (R2-C1).
- `unit.test.js` — `focusSpatialVerdict` (R2-H4: thin ring on a big control via the
  perimeter band; 2.4.13 metrics captured-not-enforced); 2.5.8 UA-control + inline-prose
  exceptions (R2-H5); composite roving keyboard null vs false.
- `evidence.test.js` (deterministic fixtures) — thin-large + JS-event focus (R2-H4),
  A↔B trap vs wraparound (R2-H2), first-focusable sentinel (R2-H3), target exceptions
  (R2-H5: prose-link PASS / nav-link FAIL / checkbox UA-control PASS), trusted form
  submit + observed invalid events + per-field validity (R2-H6).
- `meta.test.js` — proves the run-all glob executes >0 tests & exits 0, and the sweep
  fails on a known violation / passes on a clean builder-produced corpus.
- `docs.test.js` — M4 Classify-contradiction guards (announcement/grouping/name-role-state).
- Fixtures: `fx-focus-thin`, `fx-focus-js`, `fx-trap`, `fx-wraparound`, `fx-firstfocus`,
  `fx-target-exc`, `fx-form` (all under `assets/saved/`).

### 2.4.13 Focus Appearance (AAA)
Captured but **not enforced**: `focusIndicator.focusAppearance{areaPx, minThicknessPx,
maxContrastChange, meetsIfEnforced}`. The spatial measure already computes the changed-
region area/thickness/contrast, so enabling the AAA threshold later is a config flip in
`focusSpatialVerdict` (`meets2413`), not new instrumentation.

## QA methods used
- **Unit** — pure logic in `scripts/lib/a11y-eval.js` tested in isolation with known
  inputs/outputs (`unit.test.js`). Deterministic, millisecond-fast, no browser.
- **Integration** — run `eval-page.js` / `drive-page.js` against a saved page whose
  correct answer we independently established during the audit, and assert the
  emitted JSON (`integration.test.js`).
- **Inspection** — a documented manual check (read a screenshot / diff two JSON
  fields) for things not worth automating or not fully automatable.
- **Regression guard** — a property that must hold across many pages (e.g. "no
  element ever reports `vsrAnnouncement === 'document'`"), runnable as a sweep.

---

## Coverage matrix

| Issue | Fix location | Unit | Integration | Inspection / regression |
|---|---|---|---|---|
| **T1/T8** focus ring (unfocused read / crop drift) | `drive-page.js` `forcedFocusRing()` + `focusRingDecision()` | `focusRingDecision` 4 cases | Apple el7/el10 → `present:true`; Apple el4 (suppressed) → `present:false` | sweep: count `present` tri-state; spot-read 3 forced-diff shots |
| **T2** roving / synthetic keyboard over-report | `drive-page.js` `keyboardOperabilitySignal()` + real arrow keys | `keyboardOperabilitySignal` 3 cases, `isRovingTabindexItem` | Google Drive el20 tab → `operable:null` | regression: no composite widget yields a *confident* failure from synthetic-only evidence |
| **T3** target-size 2.5.8 exceptions | `eval-page.js` `evalTargetSize()` | `evalTargetSize` 6 cases | Home Artera footer links → `targetSize.passes:true` | inspection: spot-check a genuinely-cramped icon still fails |
| **T4** large-text contrast threshold (14px↔14pt bug) | `eval-page.js` `contrastThresholdFor()` | `isLargeText`/`contrastThresholdFor` boundary cases | Domino's JOIN NOW (16px bold) → `contrastThreshold:4.5` | regression: no element with 14≤px<18.66 bold keeps threshold 3.0 |
| **T5/T11** container/overlay contrast | `eval-page.js` child-colour + overlay-walk flags | (covered by integration) | Calendly "Read now" → `needsPixelContrast:true, contrastReliable:false` | inspection: pixel-contrast crop confirms true ratio |
| **T6** DOM instability across loads | `drive-page.js` re-locate retry | — | (observed: fewer `notFound`) | regression: `notFound` count vs collect, and no definite dynamic verdict on `notFound` |
| **T9/T10** VSR "document" / sticky speech | `drive-page.js` `meaningfulAnnouncement()` + stop-before-reload | `isVsrNoisePhrase`, `meaningfulAnnouncement` | BuzzFeed → 0 `vsrAnnouncement==='document'`, raw still present | regression sweep across all driven pages |
| **T12** offline media artifacts | `eval-page.js` `isMediaErrorName`; `drive-page.js` `isBlankFrame` | `isMediaErrorName`, `isBlankFrame` | (media pages) → `mediaErrorName`/`baseBlankFrame` flags | inspection: o11 el15 name flagged not-author-supplied |
| **T13** tab-walk cap + trap | `drive-page.js` cap 50→120 + wall-clock budget | — | (large pages reach more stops) | inspection: Wayfair/justgalsbeingchicks `budgetExceeded`/`trapDetected` flags |
| **T14** cookie/consent overlay | both scripts hide `CONSENT_SELECTORS` | (selector list reviewed) | Domino's → `consentHidden.count>=1` | inspection: Home Artera shots no longer near-black |
| **T15** forms probe junk forms | `drive-page.js` skip 0-visible-field forms | — | Reebok → forms include `skipped:true`, real form still probed | regression: no submitted form with 0 visible fields |
| **T7/T16** noscript SSR / sampling coverage | inherent — flagged, not "fixed" | — | — | inspection: `scriptsDisabled`, per-sample disclaimer; axe-on-unsampled reported separately |

---

## Per-issue detail

### T1/T8 — focus ring (highest blast radius)
- **Root cause:** focus shot captured the wrong region (scroll/coord desync) → `diff=0`
  misread as "no ring"; and the `computed-only` fallback read the outline while the
  element was *unfocused*.
- **Fix:** `forcedFocusRing()` forces `:focus-visible` via CDP `CSS.forcePseudoState`
  and reads the outline + a fresh screenshot diff (deterministic, scroll-independent);
  `focusRingDecision()` combines forced-diff > computed-while-focused-outline >
  tab-diff, returns a **tri-state** `present` (`true`/`false`/`null`=PARTIAL).
- **Unit:** `outline:auto` while focused ⇒ present even at diff 0; forced diff
  authoritative; genuine `none` ⇒ false; no-crop+no-forced+no-computed ⇒ null.
- **Integration:** Apple el7/el10 (former false positives) ⇒ `present:true`; Apple el4
  (page sets `:focus-visible{outline:none}`) ⇒ `present:false` — proves the probe
  *discriminates* rather than always-true.
- **Inspection:** the probe was validated against the round-2 finding — Panera #15
  (8.44% real ring) and the `outline:auto` UA-default cases now resolve to present.

### T2 — keyboard over-report on composite widgets
- **Fix:** roving-tabindex carve-out + real (trusted) arrow keys + tri-state
  `keyboardOperabilitySignal` (`operable:null` ⇒ agent records PARTIAL, not a
  confident 2.1.1 REPRODUCED).
- **Unit/Integration** as in the matrix.

### T3 — target-size 2.5.8
- **Fix:** `evalTargetSize` applies the **spacing** (24px-circle non-overlap) and
  **inline** exceptions; `eval-page.js` supplies nearest-target centre distance and a
  strict `display:inline` flag.
- **Guard against over-exemption:** inline limited to pure `inline` (not
  inline-block); cramped icons with `nearestTargetCenterDist<24` still FAIL (unit).

### T4 — contrast threshold arithmetic bug
- **Fix:** `isLargeText` uses 18pt(24px)/14pt(18.66px-bold); replaces the `>=14 && bold`
  bug. Unit tests pin the exact boundaries (incl. the Domino's 16px-bold regression).

### T9/T10 — VSR signal hygiene
- **Fix:** `meaningfulAnnouncement(after, before)` drops root/landmark "noise" phrases
  and sticky repeats; VSR is `stop()`-ed before every reload.
- **Regression sweep** (manual/CI): `for f in driven pages: assert no element has
  activate.vsrAnnouncement === 'document'`.

### T12 — offline media
- **Fix:** `isMediaErrorName` flags `axName="Unable to play media."` as
  not-author-supplied; `isBlankFrame` (luma mean/std/dark-fraction) flags black-frame
  crops so a black-on-black diff isn't read as "no ring".

### T13/T14/T15 — tab-walk budget, consent overlays, forms hygiene
- Behavioural; verified by the emitted flags (`budgetExceeded`, `consentHidden`,
  `forms[].skipped`) and the integration assertions above.

### T6 / T7 / T16 — partial by nature
- **T6:** one re-locate retry reduces `notFound`; the residual is reported honestly so
  the agent records PARTIAL (never a definite dynamic verdict on a missing element).
- **T7 (noscript) / T16 (sampling):** not "bugs" to fix — the harness now flags
  `scriptsDisabled` and the per-sample scope so findings carry the right caveat.

---

## Regression sweep (optional, run after a full re-eval)
A standalone sweep over freshly-generated `drive.json`/`collect.json` can assert the
invariants that unit/integration can't cover per-page:
1. No `activate.vsrAnnouncement === 'document'` (T9).
2. No `forms[]` entry with 0 visible fields that was submitted (T15).
3. No 2.5.8 REPRODUCED on a `targetSize.passes===true` element (T3).
4. No element with `14<=fontPx<18.66 && bold` carrying `contrastThreshold===3` (T4).
5. Focus `present` is tri-state and `null` ⇒ the page records PARTIAL (T1/T8).
