# OSS accessibility-checker comparison (reproducible)

Evidence base for the question: **do IBM Equal Access, the W3C ACT-Rules checkers, and other open-source
web accessibility checkers SUPPLEMENT or SUPERSEDE axe-core and our harness?**

This folder is self-contained and reproducible: one runner, pinned engine versions, and the raw +
aggregated result outputs. The narrative analysis report lives at
[docs/analysis/checker-comparison/CHECKER-COMPARISON.md](../../docs/analysis/checker-comparison/CHECKER-COMPARISON.md).

## Engines under test (all permissive-licensed)

| Engine | Package (pinned) | Rules | License | Nature |
|---|---|---|---|---|
| **axe-core** (Deque) | `axe-core@4.12.1` | 105 | MPL-2.0 | static DOM scan — *already integrated in our harness* (baseline) |
| **IBM Equal Access** | `accessibility-checker@4.0.26` | 162 | Apache-2.0 | static DOM scan (broadest rule set) |
| **QualWeb** (W3C ACT-Rules) | `@qualweb/core@0.8.11` + `act-rules@0.8.0` + `wcag-techniques@0.4.7` | ACT + WCAG-T | ISC | static, ACT-Rules + WCAG-Techniques |
| **Alfa** (Siteimprove) | `@siteimprove/alfa-rules@0.117.0` | 89 (ACT) | MIT | static, ACT-Rules reference impl |
| **HTML_CodeSniffer** (Squiz) | `html_codesniffer@2.5.1` | WCAG2AA | BSD-3-Clause | static, technique-based (notice-heavy) |

`pa11y` is a wrapper over HTML_CodeSniffer + axe (not an independent engine). The W3C **Nu HTML Checker**
(`vnu-jar`) validates markup conformance, not WCAG, and was scoped out.

## Reproduce

```sh
cd eval/checker-comparison
npm install                       # installs the pinned engines (~561 pkgs; not committed)
CHROME_PATH="/path/to/google-chrome" npm run run      # → evidence/<fixture>.json + combined.json
npm run analyze                   # → evidence/sc-matrix.json + catalogs.json, prints the SC matrix
```

- Requires Node ≥ 20 and a headless **Google Chrome** (the runner reuses the system Chrome, default
  macOS path; override with `CHROME_PATH`). It serves `assets/saved/` over a localhost HTTP server
  (QualWeb requires HTTP, not `file://`).
- `node run.js <fixture.html> ...` runs a subset; no args = the default 17-fixture set.

## Test corpus

15 **known-ground-truth** harness fixtures (`assets/saved/fx-v3-*.html`) — each element self-documents
its true verdict in-page (e.g. `BARRIER: grey on white (~2.3:1)`, `INCONCLUSIVE: text over a gradient`),
so engine output can be scored against truth — plus 2 real pages (`Amazon Sign-In.htm`, `BuzzFeed.htm`)
for real-world breadth/robustness. The fixtures span the SCs our deterministic runners own
(1.4.3, 3.3.2, 3.3.1, 4.1.2, 2.1.1, 2.1.2, 2.4.7, 1.4.13, 1.4.10, 2.4.11) plus instrument/○-tier SCs.

## Outputs (in `evidence/`)

- **`<fixture>.json`** — normalized findings per engine:
  `byTool.{axe|ibm|alfa|qualweb|htmlcs}[] = { tool, ruleId, sc:[..], outcome:'violation'|'review', impact, target, message }`,
  plus `counts` and per-engine `errors`. Each engine's native rule id is preserved (`ruleId`/`raw`)
  and mapped to WCAG SC where the engine exposes it.
- **`combined.json`** — per-fixture counts + any engine errors (robustness at a glance).
- **`sc-matrix.json`** — per-SC × per-engine tally (violations / review / #fixtures) across the corpus,
  plus per-fixture counts. The quantitative backbone of the analysis.
- **`catalogs.json`** — each engine's rule count, full SC coverage, license, version.

## Headline caveats captured in the data

- **Static vs behavioral.** All five engines are single-state DOM scans. Our harness is behavioral
  (real keyboard, hover-dwell, submit, forced `:focus-visible`, 320px reflow, VSR). The behavioral SCs
  (2.1.1, 2.1.2, 2.4.7-on-real-focus, 1.4.13, 4.1.3, 2.4.11) cannot be superseded by a static scan.
- **Robustness on real pages.** HTML_CodeSniffer **crashed** on `Amazon Sign-In.htm`
  (`Cannot read properties of undefined (reading 'replace')`); QualWeb returned **0** on `BuzzFeed.htm`
  (heavy-page timeout). See `combined.json`.
- **Noise.** HTML_CodeSniffer is dominated by manual-check *notices* (`review`), not decided violations.
  IBM's large 1.3.1 count is partly a per-element `aria_content_in_landmark` rule (fires on every
  control on a landmark-less fixture). Read `outcome: 'violation'` vs `'review'` accordingly.

Versions/results are a snapshot (2026-06-16); `npm install` re-pins the exact engine versions above.

---

## FN×LLM evidence-lane eval (`run-fn-llm.js`)

A separate runner in this folder evaluates **our harness's LLM evidence lane** over the W3C ACT-Rules
testcases — the *reaches-LLM* subset (the hard cases the deterministic stack does not pre-settle). Scoring is
**per-SC** (ACT ground truth is per success-criterion): on a `failed` case a flagged barrier is a true positive
(recall); on a `passed`/`inapplicable` case the same flag is a false positive (specificity).

```sh
node run-fn-llm.js --reaches-llm --tools                 # full reaches-LLM set, Claude (default)
node run-fn-llm.js --reaches-llm --tools --provider=gemini --global-llm=50
node run-fn-llm.js --reaches-llm --no-llm                # deterministic-only baseline (also computes the exclusion)
node run-fn-llm.js --reaches-llm --cases=<ids-file> --out=<name>   # subset
```

### Cross-rule-indeterminate exclusion (scoring correction)

An ACT testcase carries **one rule's** expected outcome, but the harness judges the **whole SC**. For some SCs
the rules *partition a construct by applicability*, so a page can be `inapplicable`/`passed` for the rule it was
authored for while a **sibling same-SC rule is applicable and its verdict is a non-deterministic judgment** —
and no sibling label exists for the page. Treating that page's single label as an SC-level "no barrier" example
mislabels it: a correct barrier flag is graded a false positive against a label that never covered the construct.

The canonical case is **1.1.1 images**: `23a2a8`/`qt1vmo`/`7d6734`/`8fc3b6`/`59796f` own **in-tree** images
(*"has a name / descriptive name"*); **`e88epe`** owns **removed-from-tree** images (*"is it decorative?"*). A
page authored for an in-tree rule that *also* contains a substantial **removed-from-tree** image is inapplicable
to its own rule, but `e88epe` is applicable to that image and its verdict is a judgment — unrecorded. So the
page's true 1.1.1 status is **undetermined by its label** (e.g. the W3C-wordmark-under-`23a2a8` cases).

The scorer detects these and **excludes them from the specificity (FP) denominator** — scored neither FP nor
true-negative — and **reports the excluded set every run** (never a silent denominator change):

```
cross-rule-indeterminate EXCLUDED: 6 of 13 negatives ({"cross-rule-indeterminate:e88epe(1.1.1-removed-image)":6})
  - 23a2a8/e15b9aca inapplicable (would-be FP: true) — cross-rule-indeterminate:e88epe(1.1.1-removed-image)
  - …
```

Three guardrails keep it from excusing genuine errors (it keys on **label validity, never on whether the
harness agrees** — see `crossRuleIndeterminate` in `run-fn-llm.js`):

1. **Eligibility = the standard's applicability** (`e88epe` ⇐ *an image not in the a11y tree*), **not** our
   `decorativeSuspect` routing. A genuinely-clean page with **no removed image** (the `7d6734` in-tree yellow
   circle, the `e88epe` `pdf-icon` with `alt="PDF"`) is **not** excluded — a real over-flag there still counts.
2. **Indeterminacy size** (`INDETERMINACY_MIN_DIM = 24`px, min of width/height): below it a removed image is an
   icon/spacer/sliver — unambiguously decorative — so `e88epe`'s verdict is deterministic and the label valid ⇒
   not excluded.
3. **`e88epe`'s own cases are never excluded** — the owning rule's label is present, so the SC *is* determined.

**Honest cost (documented, not hidden):** size cannot separate a *clear-decorative* substantial texture/photo
(which `e88epe` would pass) from an *ambiguous* substantial logo (which `e88epe` might fail) — that separation is
the very judgment the exclusion exists to avoid relying on. So the exclusion also removes a few negatives the
harness *correctly cleared* (it cannot condition on "was it a would-be-FP?" without becoming self-serving). The
`wouldBeFP` flag in the reported excluded set makes this auditable per case. Net effect on the full reaches-LLM
set: a small denominator reduction that removes the mislabeled cases (which otherwise *reward under-flagging*),
at the price of a handful of true-negative cases — recoverable, if ever needed, by criterion-level hand-labeling
of **only the reported excluded set** (not the corpus). Tunables: `INDETERMINACY_MIN_DIM`, `E88EPE_SIBLINGS_111`.
