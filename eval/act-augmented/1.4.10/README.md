# SC 1.4.10 Reflow — augmented test corpus

The published ACT rules for SC 1.4.10 (Reflow, Level AA) check little more than whether a page produces a page-level horizontal scrollbar at the 320 CSS px reflow viewport. They do not exercise the parts of the SC that actually require human judgment: distinguishing genuinely-excepted two-dimensional content (tables, maps, code/diagrams whose orientation carries meaning) from non-excepted prose that merely fails to wrap; recognizing the F102 case where content or functionality is *lost* (not merely repositioned) at 320 px even when no scrollbar appears; deciding whether a truncated long string remains reachable via a reveal/link (PASS) or is irrecoverably hidden (FAIL); handling overflow that lives *inside* a child scroll container (a `pre`, a carousel strip, a toolbar) rather than at the document level; and weighing whether sticky/fixed chrome consumes so much of the 320×256 viewport that reflowed content cannot be read or operated (the overlap with Focus Not Obscured).

This corpus covers those seven aspects with hand-labeled, human-judgment pages, each mixing genuine failures with PASS controls and exception-PASS boundary cases so a reviewer cannot pass by a naive "is there a horizontal scrollbar" heuristic. Every page was statically reviewed and dynamically probed at 320 CSS px. All seven aspects meet the bar of at least five valid human-judgment pages; five aspects carry seven valid pages each, while `carousel-panel-overflow-g225` and `meaningful-indentation-vs-gratuitous-g224` each carry six valid pages (still comfortably above the five-page minimum, so no aspect is short).

| aspect | valid pages | page statuses |
|---|---|---|
| non-excepted-horizontal-overflow-at-320px | 7 | valid, valid, valid, valid, valid, valid, valid |
| f102-content-disappears-no-equivalent | 7 | valid, valid, valid, valid, valid, valid, valid |
| long-unbreakable-string-overflow-c33 | 7 | valid, valid, valid, valid, valid, valid, valid |
| two-d-exception-overclaimed-or-misscoped | 7 | valid, valid, valid, valid, valid, valid, valid |
| sticky-fixed-content-consumes-small-viewport | 7 | valid, valid, valid, valid, valid, valid, valid |
| carousel-panel-overflow-g225 | 6 | valid, valid, valid, valid, valid, valid |
| meaningful-indentation-vs-gratuitous-g224 | 6 | valid, valid, valid, valid, valid, valid |
