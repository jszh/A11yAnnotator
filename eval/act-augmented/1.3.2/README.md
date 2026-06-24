# SC 1.3.2 Meaningful Sequence — augmented test corpus

The public ACT rules for SC 1.3.2 (Meaningful Sequence, Level A) lean heavily on the cases a deterministic checker can resolve, and they leave the criterion's hardest limb — *whether a source-order read still preserves meaning* — almost entirely untested. The normative requirement ("when the sequence in which content is presented affects its meaning, a correct reading sequence can be programmatically determined") is fundamentally a human-judgment call: a tool can see that the DOM order differs from the visual order, but it cannot decide whether that divergence actually breaks meaning (an F1 failure) or is harmless (a conformant Example-2 reorder). The ACT corpus also barely touches the failure techniques that produce visually-structured-but-DOM-flat content — layout-table linearization (F49), white space inserted within a word (F32), and faked columns/tables in pre-formatted plain text (F33/F34) — nor the directionality and reflow cases (G57 bidi/RTL, C27 responsive flow-order desync) where the visual order is correct but the programmatic order is not (or vice versa). Finally, the conditional applicability gate ("*when* the sequence affects meaning") and the multiple-valid-orders limb ("there may be more than one order that is correct... only one correct order needs to be provided") are exactly the spots where a naive checker over-flags, and they were unrepresented.

This corpus adds seven aspects covering those gaps, each with six hand-judged pages (a mix of `failed` cases, deliberate PASS/over-flag controls, and word-vs-initialism / multiple-valid-order carve-outs). Every page is marked `requiresHumanJudgment` and was verified against the rendered geometry, the Chromium AX tree, and the cited WCAG source text. All seven aspects meet the 5-valid-page bar (each has 6 valid pages); none are short.

| aspect | valid pages | page statuses |
|---|---|---|
| css-reorder-changes-meaning-vs-harmless | 6 | valid, valid, valid, valid, valid, valid |
| layout-table-linearization-scrambles-sequence | 6 | valid, valid, valid, valid, valid, valid |
| whitespace-within-word-vs-initialism | 6 | valid, valid, valid, valid, valid, valid |
| faked-columns-tables-in-plain-text | 6 | valid, valid, valid, valid, valid, valid |
| responsive-breakpoint-order-desync | 6 | valid, valid, valid, valid, valid, valid |
| bidi-rtl-source-order-vs-visual | 6 | valid, valid, valid, valid, valid, valid |
| applicability-and-multiple-valid-orders | 6 | valid, valid, valid, valid, valid, valid |
