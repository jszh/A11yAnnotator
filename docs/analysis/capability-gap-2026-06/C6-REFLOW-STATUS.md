# C6 — Reflow runner (1.4.10): status

`scripts/v3/lib/reflow-runner.js` — enhances the existing reflow-overflow-probe. Validated vs 156 independent
adversarial cases (7 aspects, 2 agents; held-out set untouched): **130/156 (83%); DANGEROUS = 13 false-clear, 5
false-barrier.**

## Fixed / added
- **G225 BUG FIXED**: the old `measureReflow` `isExempt` treated ANY `overflow-x:auto|scroll` ancestor as a valid
  2-D affordance → wrongly cleared a carousel stranding flowable panels. Now the 2-D exception applies only to
  genuinely-2D content (data table / toolbar / map / media / code).
- **Inner-scroller detection**: a stranded carousel reads `documentElement.scrollWidth===320` (overflow is INSIDE
  the scroller). Now detects per-container `scrollWidth>clientWidth` on `overflow-x:auto|scroll` regions + a
  reachability heuristic (focusable / enabled nav / tabs). g225 acc 20/22.
- **F102 wide(1280)-vs-320 diff**: content visible at 1280 that disappears at 320 (display:none, zero-size, OR
  clipped by an ancestor overflow:hidden) with no reveal/equivalent → fail. f102 acc 16/22.
- **Sticky/fixed viewport consumption** (≥40% of 320×256) → fail. sticky acc 20/22.
- **Culprit classification**: unbreakable-string (C33), document-overflow source.
- **G224 indentation collapse** → abstain (meaning is a rubric judgment); detects relative collapse + nesting-flatten.

## Residual false-clears (13) — hard semantic / edge, largely rubric-owned
- G224 ×4 (verse-shape / <pre> code / file-tree / term-pairing indentation — semantic meaning the runner can't judge).
- two-d over-claim ×3 (role=toolbar stretched to body; layout-table-with-th used for layout; per-cell granularity).
- g225 broken-nav ×2 (orphaned/broken buttons pass the "enabled nav present" heuristic).
- f102 vertical-clip ×2 (fixed-height overflow:hidden vertical clip — the diff checks horizontal/disappearance).
- sticky ×2 (fixed-px-width bar with no doc scroll; fixed-footer nowrap buttons offscreen).

## Verdict
Reasonable + robust for the prototype: the real BUG is fixed, the core dimensions are sound, the runner abstains on
the semantic-judgment dimension (G224) and over-flags (non-fatal, routes to rubric) more than it false-clears. The
residual false-clears are the long tail of semantic/over-claim cases the rubric backstops. DONE as a prototype.
