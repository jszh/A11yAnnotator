# ACT-Augmented Test Corpus

The W3C ACT test cases in `eval/checker-comparison/act-subset/` are **synthetic and
low-variety** — each rule ships a handful of minimal pages that exercise the rule's
exact applicability/expectation, not the breadth of the WCAG Success Criterion.

This corpus **augments** them. For each of the 22 in-scope SCs we:

1. Study the existing ACT rules + their test cases to map what limb of the SC they test.
2. Gather every reference doc for the SC (WCAG Understanding, WCAG Techniques, EN 301 549
   Annex C, Trusted Tester v5.1.3) — paths resolved in `_resources/<sc>.json`.
3. Run 5 independent reasoning agents (diverse lenses) to surface **aspects of the SC
   not covered by the ACT tests**.
4. Synthesize a deduplicated, prioritized list of uncovered aspects (`<sc>/aspects.json`).
5. For each aspect construct **≥5 distinct test pages** (`<sc>/pages/<aspect>/case-NN.html`)
   + per-page documentation (`case-NN.md`) grounded in the references with citation + quote.
6. Adversarially critique each page and verify it in a real browser via CDP
   (`_tools/inspect.js`) — verdicts in `<sc>/verdicts.json`.
7. Judge everything and finalize the valid test cases (`<sc>/README.md`).

## Layout
- `_tools/build-sc-resources.js` — regenerates `_resources/<sc>.json`.
- `_tools/inspect.js` — CDP inspector (AX tree, axe cross-check, tab-walk, contrast, screenshots).
- `_resources/<sc>.json` — every reference path + ACT rule/test-case inventory per SC.
- `<sc>/` — per-SC outputs (intent-map, reasonings, aspects, pages, verdicts, README).
- `PROGRESS.md` — per-SC completion ledger.
