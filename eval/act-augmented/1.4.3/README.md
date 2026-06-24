# SC 1.4.3 Contrast (Minimum) — augmented test corpus

The published ACT rule for SC 1.4.3 (09o5cg) is deliberately narrow: it scores only the stricter AAA-calibrated ratios on solid-color, single-state, human-language live text, and it explicitly declares whole limbs of the success criterion out of scope. As a result, the ACT corpus never exercises the parts of 1.4.3 that actually depend on human judgment — the pure-decoration ("conveys no information") exemption as distinct from the glyph test, the logotype/brand exemption and its erosion when a logo becomes an interactive control, the inactive-UI exemption where visual disabled-styling diverges from real operability, the F24 cascade/inheritance/compositing problem of finding the *effective* background through stacked translucent layers, the F83 background-image limb judged by the least-contrast / per-letter method (the inverse of ACT's best-case pixel scoring), the real AA thresholds (4.5:1 / 3:1) plus the large-scale-text size/weight classification near the boundary, state-dependent text (placeholder, hover, focus, active, selected, error) including the visited-link exclusion, and the "picture with significant other visual content" incidental-text exemption versus an image-of-text-for-look.

This corpus adds hand-built, human-judgment fixtures for each of those eight aspects, with scoring done deterministically and recorded in `summary.json`. Six of the eight aspects reach the target of at least 5 valid pages. Two fall short and are flagged here: **`effective-background-across-cascade-and-overlays`** holds at 5 valid pages (case-04 needs-fix — a self-refuting normative citation and an F24 misattribution on a mix-blend-mode composite that passes on declared CSSOM colors), and **`aa-thresholds-and-large-text-classification`** is the weakest at only **3 valid pages** (case-02, case-03, and case-04 are needs-fix because their documented failures do not actually render — gradient/large-text instances that pass at their intended viewport, so they are below the 5-valid-page bar and need rebuilt failing instances).

| aspect | valid pages | page statuses |
|---|---|---|
| decorative-vs-meaningful-text-exemption | 6 | valid, valid, valid, valid, valid, valid |
| logotype-brand-exemption-and-erosion | 6 | valid, valid, valid, valid, valid, valid |
| faux-disabled-vs-genuinely-inactive-ui | 5 | valid, needs-fix, valid, valid, valid, valid |
| effective-background-across-cascade-and-overlays | 5 | valid, valid, valid, needs-fix, valid, valid |
| background-image-least-contrast-per-letter | 6 | valid, valid, valid, valid, valid, valid |
| aa-thresholds-and-large-text-classification | 3 | valid, needs-fix, needs-fix, needs-fix, valid, valid |
| state-dependent-text-contrast | 6 | valid, valid, valid, valid, valid, valid |
| picture-with-significant-other-content-exemption | 6 | valid, valid, valid, valid, valid, valid |
