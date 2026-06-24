# SC 2.1.1 Keyboard — augmented test corpus

The two ACT rules that touch SC 2.1.1 are narrow: they exercise the *reachability* of scroll regions and iframes, not the full normative text of the SC. As a result they leave most of 2.1.1 untested. They do not cover whether explicit/custom interactive controls can be both reached AND activated from the keyboard (F54 pointer-only handlers; F42 emulated controls that focus but never execute), whether keyboard focus can actually *rest* on a control once received (F55 focus-stealing), whether function-level operations such as drag-and-drop have a keyboard equivalent and how the path-vs-endpoint exception and the G202 "parity, not per-control" allowance apply, whether essential information disclosed only on hover/pointer is reachable by keyboard or available elsewhere on the page (the Trusted Tester essential-information branch, including the two-second title-reveal check), and the SC's entirely separate second limb — functions that require specific *timing* of individual keystrokes (Trusted Tester Test 4.B). These are exactly the parts of 2.1.1 that hinge on human judgment rather than a mechanical rule.

This corpus adds six aspects covering those gaps. Each aspect is finalized with 6 valid human-judgment pages (5 fail/boundary failures plus 1 pass/boundary case), all of which passed deterministic scoring as `valid` with `recommendation: keep`. Every aspect meets and exceeds the 5-valid-page bar, so no aspect is short.

| aspect | valid pages | page statuses |
|---|---|---|
| pointer-only-handlers-no-keyboard-path | 6 | valid, valid, valid, valid, valid, valid |
| emulated-control-focusable-but-not-activatable | 6 | valid, valid, valid, valid, valid, valid |
| drag-drop-endpoint-vs-path-exception-and-function-parity | 6 | valid, valid, valid, valid, valid, valid |
| hover-pointer-only-revealed-essential-content | 6 | valid, valid, valid, valid, valid, valid |
| focus-removed-on-receipt | 6 | valid, valid, valid, valid, valid, valid |
| keystroke-timing-dependence | 6 | valid, valid, valid, valid, valid, valid |
