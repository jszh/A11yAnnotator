# SC 2.4.6 Headings and Labels — augmented test corpus

The published ACT rules for SC 2.4.6 (notably b49b2e "Heading is descriptive") operate almost entirely on the flat accessibility tree and reduce the criterion's descriptiveness requirement to mechanical checks — does a heading exist, is its accessible name non-empty, does a form control have an associated label. They cannot judge whether text that is *present and topically true* is actually adequate to orient a user, whether sibling headings/labels differentiate their sections, whether a graphical (icon) label conveys the control's real function, whether a label carries the data-format / required-status cues a field actually needs, whether a button's action verb makes its function clear, whether descriptiveness that holds in source order survives rendered reading order or collapsed/dynamic state, or whether a visible label and a computed accessible name diverge in descriptiveness. Every one of these turns on human semantic judgment that a static checker, ordering strictly by the flat tree, structurally misses.

This corpus adds seven human-judgment aspects covering both limbs of the SC — the descriptiveness of heading text and of form-control / button labels. Each aspect is built as six pages (five failing/boundary cases plus a PASS control). All seven aspects clear the bar of at least five valid human-judgment pages. Six aspects are fully valid at 6/6; `descriptiveness-depends-on-layout-or-state` stands at 5 valid pages because `case-04` is flagged `needs-fix` (a severe metadata mismatch — the file on disk is a "Send money" banking wizard with a `Continue` button under the labels limb, while the supplied metadata described a FAQ-accordion headings case at selector `#t1`; the file must be re-paired with its correct wizard/labels/`#primary`/G131 packaging). No aspect is below five valid pages.

| aspect | valid pages | page statuses |
|---|---|---|
| generic-boilerplate-non-orienting | 6 | valid, valid, valid, valid, valid, valid |
| non-distinct-siblings-relational | 6 | valid, valid, valid, valid, valid, valid |
| icon-graphical-label-context | 6 | valid, valid, valid, valid, valid, valid |
| label-omits-data-requirements | 6 | valid, valid, valid, valid, valid, valid |
| ambiguous-button-action-label | 6 | valid, valid, valid, valid, valid, valid |
| descriptiveness-depends-on-layout-or-state | 5 | valid, valid, valid, needs-fix, valid, valid |
| visible-vs-accessible-name-divergence | 6 | valid, valid, valid, valid, valid, valid |
