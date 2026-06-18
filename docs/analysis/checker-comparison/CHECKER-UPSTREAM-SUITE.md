# Upstream checker test suites and normalized ACT pilot

**Date:** 2026-06-16  
**Purpose:** inspect the upstream repositories for reusable test cases, compile a normalized evaluation
suite, and produce initial pass/fail rates while preserving the distinction between tool bugs and
different rule/WCAG interpretations.

## Repositories inspected

Shallow clones were fetched into `/private/tmp/a11y-checker-upstream/`:

| Checker | Repository | Reusable test material found | Immediate portability |
|---|---|---:|---|
| axe-core | `dequelabs/axe-core` | 209 integration HTML files, 124 JS expectation files under `test/integration/full` | Medium. Many expectations are JS assertions or DOM class conventions, so an adapter is needed. |
| IBM Equal Access | `IBMa/equal-access` | 1,597 ruleunit HTML files; 1,636 files with `OpenAjax.a11y.ruleCoverage` / `UnitTest` expectations | Medium-high. Expectations are embedded, but rule ID to WCAG mapping must be normalized. |
| QualWeb | `qualweb/core`, plus `qualweb/act-rules` | Core has engine tests; ACT package has 1,146 W3C ACT test cases with expected outcomes | High for ACT cases. These are the best cross-tool backbone. |
| Siteimprove Alfa | `Siteimprove/alfa` | 114 `packages/alfa-rules/test/**/rule.spec.ts(x)` files | Low-medium. Rich expectations, but most are virtual DOM TSX, not browser HTML fixtures. |
| HTML_CodeSniffer | `squizlabs/HTML_CodeSniffer` | 13 WCAG2 HTML fixtures with `@HTMLCS_Test@` assertions | High but small. Assertions are tool-message specific. |

## Why ACT is the first normalized suite

Vendor suites are useful, but they often encode the vendor's own rule semantics. The W3C ACT test-case
bundle is better as a cross-tool pilot because each case carries:

- an ACT rule ID,
- an expected outcome (`failed`, `passed`, `inapplicable`),
- a WCAG requirement mapping,
- a public URL.

The first runnable adapter is [eval/checker-comparison/run-act-suite.js](../../../eval/checker-comparison/run-act-suite.js).
It runs axe, IBM, HTML_CodeSniffer, Alfa, and QualWeb over ACT cases and writes:

- `eval/checker-comparison/upstream-evidence/act-pilot/raw.json`
- `eval/checker-comparison/upstream-evidence/act-pilot/summary.json`

Commands used:

```bash
cd eval/checker-comparison
npm install
node run-act-suite.js --limit=20
node run-act-suite.js --stratified --limit=50
node run-act-suite.js --stratified --limit=0
```

## ACT coverage inventory

The ACT fixture bundle contains 1,146 cases. SC counts in the bundle:

| SC | Cases | SC | Cases | SC | Cases |
|---|---:|---|---:|---|---:|
| 1.1.1 | 94 | 1.3.1 | 159 | 1.3.5 | 28 |
| 1.3.3 | 21 | 1.4.3 | 66 | 1.4.6 | 66 |
| 1.4.12 | 53 | 2.1.1 | 17 | 2.1.2 | 16 |
| 2.4.2 | 18 | 2.4.4 | 65 | 2.4.6 | 28 |
| 2.4.7 | 7 | 2.5.3 | 13 | 3.3.1 | 9 |
| 4.1.2 | 218 | plus media/language/AAA/retired SCs | 370 |

This is a better broad scanner benchmark than the original 15-fixture comparison, but it still does not
replace human WCAG adjudication. ACT rules test particular rule formulations; a scanner may report a
different problem under the same SC on the same page.

## Full ACT run

Command:

```bash
cd eval/checker-comparison
node run-act-suite.js --stratified --limit=0
```

The runner selected **432 approved ACT cases** with WCAG mappings and expected outcomes. This is smaller
than the raw 1,146-case bundle because unapproved/non-conformance-mapped cases are filtered out.

The full run covered these ACT rules:

| ACT rule | Name |
|---|---|
| `09o5cg` | Text has enhanced contrast |
| `0ssw9k` | Scrollable content can be reached with sequential focus navigation |
| `23a2a8` | Image has non-empty accessible name |
| `24afc2` | Letter spacing in `style` attributes is not `!important` |
| `2779a5` | HTML page has non-empty title |
| `307n5z` | Element with presentational children has no focusable content |
| `59796f` | Image button has non-empty accessible name |
| `6cfa84` | Element with aria-hidden has no content in sequential focus navigation |
| `73f2c2` | `autocomplete` attribute has valid value |
| `78fd32` | Line height in style attributes is not `!important` |
| `7d6734` | SVG element with explicit role has non-empty accessible name |
| `8fc3b6` | Object element rendering non-text content has non-empty accessible name |
| `97a4e1` | Button has non-empty accessible name |
| `9e45ec` | Word spacing in `style` attributes is not `!important` |
| `a25f45` | Headers attribute specified on a cell refers to cells in the same table element |
| `afw4f7` | Text has minimum contrast |
| `akn7bn` | Iframe with interactive elements is not excluded from tab-order |

### Full-run rates

These rates are **by same-WCAG-SC matching**, not fully adjudicated ACT-rule matching. They are useful for
triage, but apparent false positives need review because same-SC/different-rule findings may be valid
other issues on the page.

| Tool | TP | FN | FP | TN | Review-only miss | TN with review | Errors | Recall on failed | FP rate on non-failed | Decision agreement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| axe | 118 | 22 | 4 | 268 | 4 | 7 | 9 | 84.3% | 1.5% | 93.7% |
| IBM | 107 | 28 | 28 | 254 | 9 | 6 | 0 | 79.3% | 9.9% | 86.6% |
| HTMLCS | 46 | 40 | 35 | 130 | 56 | 111 | 14 | 53.5% | 21.2% | 70.1% |
| Alfa | 133 | 8 | 13 | 270 | 3 | 5 | 0 | 94.3% | 4.6% | 95.0% |
| QualWeb | 135 | 5 | 28 | 243 | 4 | 17 | 0 | 96.4% | 10.3% | 92.0% |

### What the mismatches appear to mean

The full run produced **287 review items**:

- 103 were same-rule/no-finding/review-only style misses under same-SC scoring.
- 184 were same-SC/different-rule conflicts and should not be treated as final false positives.

Examples:

- **Same-SC/different-rule, not automatically a false positive:** ACT `a25f45` tests a table `headers`
  relationship under 1.3.1. IBM reported `aria_content_in_landmark`; QualWeb reported missing table
  caption/scope technique checks. Those are different 1.3.1 assertions, not direct failures of the ACT
  `headers` rule.
- **Likely unsupported rule or rule-scope miss:** axe and IBM missed ACT `09o5cg` (enhanced contrast,
  1.4.6). That is unsurprising for axe if AAA/enhanced contrast is not in the configured rule set; this
  needs rule-configuration validation before calling it a tool bug.
- **Review-only rather than hard fail:** HTMLCS often reports warnings/manual checks where ACT expects a
  failed rule, e.g. 1.3.5 autocomplete validity and 1.4.12 text spacing.
- **Harness/setup errors:** axe and HTMLCS failed to inject scripts into several SVG-only inapplicable
  cases (`document.body` null / `appendChild` failure). These should be excluded or handled with SVG-safe
  injection before final rates.

Largest mismatch clusters in the full run:

| Cluster | Count | Likely interpretation |
|---|---:|---|
| HTMLCS review-only on 1.4.12 | 14 | HTMLCS emits manual/review warnings where ACT expects hard failed text-spacing rules. |
| QualWeb apparent FP on 1.3.1 | 13 | Mostly same-SC/different-rule technique findings, not direct ACT-rule failures. |
| axe / IBM / HTMLCS FN on 1.4.6 | 13 each | Likely AAA/enhanced-contrast configuration or unsupported-rule scope, not necessarily bugs. |
| HTMLCS FN on 4.1.2 | 11 | Likely under-coverage of ACT name/role/value cases. |
| IBM apparent FP on 1.3.1 | 11 | Mostly same-SC/different-rule findings like landmark/table technique issues. |
| HTMLCS FP on 1.1.1 | 10 | Needs adjudication; may include broad non-text warnings on inapplicable cases. |
| HTMLCS review-only on 1.3.5 | 8 | HTMLCS H98 issues are review/manual rather than hard autocomplete failures. |

### Per-SC compact table

Cell format: `TP/FN/FP/TN/r<review>/e<errors>`.

| SC | axe | IBM | HTMLCS | Alfa | QualWeb |
|---|---|---|---|---|---|
| 1.1.1 | 18/3/0/53/r0/e0 | 16/5/5/47/r1/e0 | 11/7/14/28/r14/e0 | 18/3/0/53/r0/e0 | 18/2/4/41/r9/e0 |
| 1.3.1 | 4/0/0/12/r1/e0 | 4/0/11/2/r0/e0 | 2/0/2/1/r12/e0 | 4/0/1/12/r0/e0 | 4/0/13/0/r0/e0 |
| 1.3.5 | 10/0/0/18/r0/e0 | 10/0/1/17/r0/e0 | 0/0/0/0/r24/e0 | 10/0/0/18/r0/e0 | 10/0/0/18/r0/e0 |
| 1.4.3 | 7/0/0/18/r7/e0 | 7/0/0/19/r6/e0 | 4/1/5/15/r7/e0 | 8/1/1/19/r3/e0 | 9/0/2/18/r3/e0 |
| 1.4.4 | 4/0/0/7/r0/e0 | 0/4/0/7/r0/e0 | 0/0/0/0/r11/e0 | 4/0/0/7/r0/e0 | 4/0/0/7/r0/e0 |
| 1.4.6 | 0/13/0/21/r0/e0 | 0/13/0/21/r0/e0 | 0/13/0/21/r0/e0 | 11/1/1/19/r2/e0 | 12/0/1/19/r2/e0 |
| 1.4.12 | 13/1/0/36/r0/e0 | 14/0/0/39/r0/e0 | 0/0/0/0/r50/e0 | 14/0/1/38/r0/e0 | 14/0/0/39/r0/e0 |
| 2.1.1 | 2/1/0/14/r0/e0 | 1/2/0/13/r1/e0 | 0/3/0/14/r0/e0 | 3/0/3/11/r0/e0 | 3/0/6/8/r0/e0 |
| 2.1.3 | 2/0/0/8/r0/e0 | 0/2/0/8/r0/e0 | 0/2/0/8/r0/e0 | 2/0/2/6/r0/e0 | 2/0/1/7/r0/e0 |
| 2.2.1 | 4/0/0/10/r0/e0 | 0/0/0/10/r5/e0 | 4/0/1/8/r0/e0 | 4/0/1/10/r0/e0 | 4/0/1/10/r0/e0 |
| 2.2.4 | 4/0/0/10/r0/e0 | 0/0/0/10/r5/e0 | 4/0/1/8/r0/e0 | 4/0/1/10/r0/e0 | 4/0/1/10/r0/e0 |
| 2.4.2 | 5/3/0/8/r0/e0 | 5/3/0/10/r0/e0 | 5/0/2/0/r9/e0 | 5/3/0/10/r0/e0 | 5/3/0/10/r0/e0 |
| 2.4.4 | 11/0/1/16/r0/e0 | 11/0/1/16/r0/e0 | 2/1/1/5/r19/e0 | 11/0/1/16/r0/e0 | 11/0/1/14/r2/e0 |
| 2.4.7 | 0/1/0/6/r0/e0 | 0/1/0/6/r0/e0 | 0/0/0/2/r5/e0 | 0/0/0/4/r3/e0 | 0/0/0/2/r5/e0 |
| 2.4.9 | 11/0/1/16/r0/e0 | 11/0/1/16/r0/e0 | 2/1/1/5/r19/e0 | 11/0/1/16/r0/e0 | 11/0/1/14/r2/e0 |
| 3.1.1 | 8/0/0/3/r0/e0 | 8/0/2/4/r0/e0 | 4/4/1/2/r0/e0 | 8/0/1/5/r0/e0 | 8/0/0/6/r0/e0 |
| 3.1.2 | 9/0/0/9/r0/e0 | 9/0/1/8/r0/e0 | 2/0/2/0/r14/e0 | 9/0/0/9/r0/e0 | 9/0/0/9/r0/e0 |
| 3.2.5 | 4/0/0/10/r0/e0 | 0/0/0/10/r5/e0 | 4/0/1/8/r0/e0 | 4/0/1/10/r0/e0 | 4/0/1/10/r0/e0 |
| 4.1.2 | 37/0/4/62/r3/e0 | 36/0/8/60/r2/e0 | 17/12/12/41/r24/e0 | 38/0/4/64/r0/e0 | 38/0/5/58/r5/e0 |

## Validation taxonomy for failures

Every mismatch should be adjudicated into one of these buckets before drawing conclusions:

| Bucket | Meaning | Example from pilot | Action |
|---|---|---|---|
| `tool-problem` | The scanner missed or invented the same rule under the same ACT/WCAG semantics. | TBD after adjudication. | Count against scanner. |
| `same-sc-different-rule` | Scanner reported another issue under the same SC. | IBM `aria_content_in_landmark` on ACT `a25f45`. | Do not count as FP for the ACT rule; track separately. |
| `configuration-scope` | Tool not configured for that level/rule. | 1.4.6 AAA enhanced contrast may be omitted by default. | Re-run with matching configuration or exclude. |
| `review-only` | Tool produced manual/review instead of a hard fail. | HTMLCS 1.3.5 H98 warnings. | Count separately from hard recall. |
| `fixture-portability` | The fixture cannot be injected or rendered the same way by a scanner. | SVG-only cases with `document.body === null`. | Fix runner or exclude from final rates. |
| `wcag-interpretation` | The ACT rule and scanner implement defensible but different interpretations. | Needs human review. | Document and avoid leaderboard-style scoring. |

## Recommended next steps

1. Fix SVG/script injection handling in `run-act-suite.js` so axe/HTMLCS SVG errors are not counted as
   scanner errors.
2. Add rule-level mapping where possible:
   - ACT rule ID ↔ axe rule ID where known.
   - ACT rule ID ↔ QualWeb ACT rule ID should be direct.
   - IBM/HTMLCS/Alfa need rule catalog mapping, or same-SC results must stay "triage".
3. Run the full ACT suite in two modes:
   - strict ACT-rule mode for tools with direct ACT/rule mapping,
   - same-SC triage mode for tools without direct mapping.
4. Add vendor-suite adapters after ACT:
   - HTMLCS `@HTMLCS_Test@` comments,
   - IBM `OpenAjax.a11y.ruleCoverage` / `UnitTest`,
   - selected axe fixtures with explicit `.passed` / `.failed` class conventions,
   - Alfa only after converting virtual DOM TSX into browser HTML or running Alfa's own evaluator as the
     ground-truth owner lane.
5. For every mismatch sampled from the full run, apply the taxonomy above before saying "scanner X is
   better on SC Y."

## Current answer

We now know each scanner has tests, but not all upstream tests are equally usable for cross-tool scoring.
The normalized ACT runner completed a full 432-case approved ACT pass. It is enough to say:

- More testing and adjudication are needed before declaring "best scanner per WCAG rule."
- ACT fixtures should be the backbone of the broader benchmark.
- Alfa and QualWeb looked strongest on the same-SC full ACT run, but that may partly reflect their ACT-rule
  alignment.
- HTMLCS is weaker in this pilot, often because it emits review/manual warnings rather than hard failures.
- IBM's apparent false positives include many same-SC/different-rule findings, so they need adjudication
  before being treated as tool problems.
