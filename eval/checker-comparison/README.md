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
