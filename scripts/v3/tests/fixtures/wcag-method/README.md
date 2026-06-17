# WCAG method-vs-reference regression fixtures

These HTML fixtures back `scripts/v3/tests/regression-wcag-method.test.js`, which locks the behavior
measured in the Round-3 empirical campaign documented in
[`docs/audits/HARDCODED-JUDGMENTS-WCAG-AUDIT.md`](../../../../../docs/audits/HARDCODED-JUDGMENTS-WCAG-AUDIT.md).

Each fixture is driven through the **real** runner/detector code and judged against WCAG 2.2 (and the
cited papers, BAGEL CHI'23 / LOTUS ICSE'23). Every test asserts the **WCAG-correct** outcome. Two flavors:

- **CORRECT-GUARD** — the harness already matches WCAG; the test passes today, and any change is a regression.
- **KNOWN-GAP** (`{ todo: 'fix at file:line' }`) — the harness is *currently wrong* per the audit, so the
  WCAG-correct assertion **fails today**. node:test reports it as `todo` (not a hard failure — the build
  stays green at `fail 0`), and the summary shows `todo 10` with each fix location printed. **When the
  builder fixes the gap, the assertion passes — delete the `{ todo }` flag to convert it into a permanent
  guard.** This polarity keeps "10 known WCAG gaps" honest in the test output instead of hiding live defects
  behind green checkmarks.

Run: `node --test scripts/v3/tests/regression-wcag-method.test.js` → `pass 14, fail 0, todo 10`.

All of these findings are **non-authoritative** in production (shadow / barrier-only / `calibrated:false`);
the tests assert instrument-level behavior, not published verdicts.

| Fixture | Finding | Runner / detector | Kind | Builder fixes at |
|---|---|---|---|---|
| `b2-contrast-false-clear.html` | §B2 | `text-contrast-pixel` | KNOWN-GAP | `exp-runners.js` `runTextContrastPixel` ~`:271` — use the rendered backdrop mean, not `a.bgColor`, when `pixelAgrees` gap>0 |
| `b2-contrast-gap17-rejects.html` | §B2 | `text-contrast-pixel` | CORRECT-GUARD | — |
| `b5-contrast-textshadow-false-barrier.html` | §B5 | `text-contrast-pixel` | KNOWN-GAP | `exp-runners.js` `measureContrast` ~`:160` — abstain when `text-shadow`/`-webkit-text-stroke` present (axe returns `review`) |
| `b5-contrast-noshadow-control.html` | §B5 | `text-contrast-pixel` | CORRECT-GUARD | — |
| `b3-status-true-barrier.html` | §B3 | `detectStatusMessages` | CORRECT-GUARD | — |
| `b3-status-live-region-ok.html` | §B3 | `detectStatusMessages` | CORRECT-GUARD | — |
| `b3-status-disclosure-fp.html` | §B3 | `detectStatusMessages` | KNOWN-GAP | `status-detector.js:91-105` — add an `aria-expanded`/`aria-controls` (+`role=tabpanel`) disclosure exclusion |
| `b3-status-cap-fn.html` | §B3 | `detectStatusMessages` | KNOWN-GAP | `status-detector.js:24,57` — `maxTriggers=12` cap; raise/derive it and record truncation |
| `b3-status-nonbutton-fn.html` | §B3 | `detectStatusMessages` | KNOWN-GAP | `status-detector.js:55` — widen the button-only pass-1 selector |
| `b4-error-english-ok.html` | §B4 | `form-error-probe` | CORRECT-GUARD | — |
| `b4-error-{spanish,german,japanese}-fb.html` | §B4 | `form-error-probe` | KNOWN-GAP | `exp-runners.js` `probeFormError` `:393-395,:460` — drop ERR_TEXT/`reddish`; defer a surfaced field-message to INCONCLUSIVE |
| `b4-error-coloronly-barrier.html` | §B4 | `form-error-probe` | CORRECT-GUARD | — |
| `l5-trap-roleless-runner-fc.html` | §D | `keyboard-trap-escape` | KNOWN-GAP | `exp-runners.js:733` — `region = el.closest(TRAP_REGION_SEL) || el` (class fallback, `kbd-graph.js:83`) |
| `l5-trap-roledialog-runner-ok.html` | §D | `keyboard-trap-escape` | CORRECT-GUARD | — |
| `l5-trap-roleless-detector-ok.html` | §D | `detectKeyboardTraps` | CORRECT-GUARD | — |
| `l5-apg-modal-ok.html` | §D | `detectKeyboardTraps` | CORRECT-GUARD | — |
| `a-reflow-{overflow-360,clean}.html` | §A | `reflow-overflow-probe` | CORRECT-GUARD | — |
| `a-obscured-{full,partial90}.html` | §A | `focus-obscured-barrier` | CORRECT-GUARD | — |
| `a-label-{placeholder-only,for-visible}.html` | §A | `field-label-probe` | CORRECT-GUARD | — |

B1 (order-check 1.3.2/2.4.3 — fix `order-check.js:64,68`) and the §A pure-geometry constants
(`evalTargetSize`, `isLargeText`) need no HTML fixture — those assertions are inline in the test.

**Two KNOWN-GAP cases assert `>= 1` rather than an exact count** (B1 adjacent/reversal; B3 non-button),
because the post-fix finding count depends on which fix the builder chooses — see the audit's
"Residual uncertainties" section.

**Fixture note (2.4.11):** the `focus-obscured-barrier` runner calls `scrollIntoView({block:'center'})`
before measuring, so an overlay must stay over the focused element *after* that scroll. The obscured
fixtures use an **absolute** bar on a short page (it scrolls with the input); a `position:fixed` bar over a
tall page would slide off and expose a strip — a false "not obscured" that reflects the fixture, not the runner.
