# SC 2.4.3 Focus Order — augmented test corpus

The ACT rules for SC 2.4.3 (Focus Order, Level A) are thin: they catch only mechanically-detectable signatures (e.g. positive `tabindex` lint) and stop short of the criterion's actual demand, which is that focus traverse content in an order that *preserves meaning and operability*. That judgment — whether a given order is "logical," whether a CSS-reordered layout still keeps the implied hierarchy intact, whether a revealed dialog or dismissed menu lands focus somewhere sensible — is inherently a human call that no static checker resolves. This corpus fills that gap with pages built around the limbs the Understanding document and Trusted Tester procedure actually describe but the automated tooling ignores.

The eight aspects below cover: CSS-reordered layouts where DOM/tab order contradicts the meaningful visual order; focus interleaving between two semantically distinct sections (the canonical Understanding failing example); F85 revealed-content traversal (a non-modal dialog/menu not next in order); F85 focus-return-after-dismissal (including the modal close branch); modal containment failing forward and backward; the multiple-valid-orders boundary (row-wise vs column-wise grids that must NOT be flagged); confusing/illogical stops from nested focusable wrappers or focusable static content; and F44 positive-`tabindex` orders that break meaning. Each aspect carries pass/fail/inapplicable boundary cases so the corpus tests restraint as well as detection. Every aspect meets the bar of at least 5 valid human-judgment pages. Note that `nested-and-static-focusable-illogical-stops` lands at exactly 5 valid pages: one of its six (case-04) was dropped because the cited nested-focusable mechanism is absent (the two links per card are siblings, not nested, and their accessible names are distinguishable), so it is neither a real 2.4.3 failure nor a fit for this bucket. The remaining seven aspects have 6 valid pages each, with one entry (`css-reorder-tab-vs-visual-meaning` case-02) flagged `needs-fix` for a broken element-under-test selector that does not affect the page itself.

| aspect | valid pages | page statuses |
|---|---|---|
| css-reorder-tab-vs-visual-meaning | 6 | valid, needs-fix, valid, valid, valid, valid, valid |
| interleaved-focus-between-semantic-groups | 6 | valid, valid, valid, valid, valid, valid |
| f85-revealed-dialog-not-adjacent | 6 | valid, valid, valid, valid, valid, valid |
| f85-focus-return-after-dismissal | 6 | valid, valid, valid, valid, valid, valid |
| modal-focus-not-contained-both-directions | 6 | valid, valid, valid, valid, valid, valid |
| multiple-valid-orders-row-vs-column | 6 | valid, valid, valid, valid, valid, valid |
| nested-and-static-focusable-illogical-stops | 5 | valid, valid, valid, dropped, valid, valid |
| f44-positive-tabindex-breaks-meaning | 6 | valid, valid, valid, valid, valid, valid |
