# WCAG Techniques corpus (in-scope SCs)

WCAG 2.2 technique pages for **our 22 in-scope Success Criteria** (the SCs declared in
[`categories.json`](../categories.json) across the 9 annotation categories), pulled verbatim
from the W3C source so the coverage analysis can reason over the real technique text (Description,
Examples, Tests) rather than just titles.

## Provenance
- **Source repo:** [`w3c/wcag`](https://github.com/w3c/wcag), `main` branch.
- **Pinned commit:** `7bc46c7411c56270cf06e6b57a73e88fdcfca143`
- **Fetched:** 2026-06-17 (shallow clone, files copied verbatim — no edits).
- **Path mapping:** each technique HTML is at `techniques/<technology>/<ID>.html` upstream and is
  mirrored here as `<technology>/<ID>.html`.
- **License:** W3C Document License (the technique pages are W3C deliverables).

## Scope
- **22 Success Criteria**, **174 unique techniques** (210 SC↔technique pairs — a technique can serve
  more than one SC).
- The SC list and the SC↔technique↔role mapping are in [`techniques-manifest.json`](techniques-manifest.json).
  Each technique records its `scs` map (`{ "<sc>": ["sufficient"|"advisory"|"failure"] }`).

## Layout (technique count per technology)

| Folder | Count | Notes |
|---|---:|---|
| `general/` | 58 | technology-agnostic (`G*`) |
| `failures/` | 46 | documented failures (`F*`) |
| `aria/` | 21 | ARIA techniques (`ARIA*`) |
| `css/` | 19 | CSS techniques (`C*`) |
| `html/` | 15 | HTML techniques (`H*`) |
| `client-side-script/` | 8 | scripting techniques (`SCR*`) |
| `pdf/` | 7 | PDF techniques (`PDF*`) — out of this harness's web-runtime domain |

## Derivation
- `categories.json` → the 22 in-scope SCs.
- `wcag.json` (WCAG 2.2 quickref data) → the `sufficient` / `advisory` / `failure` technique lists per SC.
- The intersection (every technique referenced by any in-scope SC) was resolved to upstream files and copied here.

The coverage analysis of these techniques against the v3 harness / axe / IBM / skills / LLM rubrics is in
[`../docs/analysis/WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md`](../docs/analysis/WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md).
