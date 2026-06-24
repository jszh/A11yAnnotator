# SC 3.3.3 Error Suggestion — augmented test corpus

The published ACT rules for SC 3.3.3 (Error Suggestion, Level AA) stop at what a machine can confirm: whether *some* programmatically associated error text exists. They do not probe the limbs that actually decide conformance, and those are precisely the limbs that require human judgment. This corpus targets the gaps: an error that is *named* but whose correction is *withheld even though it is knowable*; a suggestion that is *present but wrong, misleading, or contradicts the validation rule*; a suggestion that is *correctly withheld under the security/purpose exception* (which must read as PASS); the *knowability/precondition gate* where no suggestion is required and absence must not be penalized (DNA); a suggestion that is *technically present but too vague to be actionable*; a suggestion that is *stranded far from its field or otherwise unreachable* (the provision/locatability limb); and *color/asterisk/icon-only* error indication with no text suggestion (the "in text" limb). Every page is hand-authored as a focused PASS or FAIL probe with verbatim WCAG / Trusted-Tester citations, and every page is flagged `requiresHumanJudgment` because automated checkers pass or are silent on all of them.

All seven aspects meet the bar of at least 5 valid human-judgment pages. Two aspects sit at exactly 5 valid pages rather than 6: `correction-not-knowable-dna-pass` and `suggestion-stranded-far-from-field-or-unreachable` each have one `needs-fix` page (case-04 in both), caused by a desync between the orchestrator's case metadata and the actual file on disk — in both instances the on-disk file is itself sound and keep-worthy, so the defect is in the task packaging, not the fixture content. No aspect is short of the 5-valid-page threshold.

| aspect | valid pages | page statuses |
|---|---|---|
| error-named-but-no-correction-when-knowable | 6 | valid, valid, valid, valid, valid, valid |
| suggestion-present-but-wrong-or-misleading | 6 | valid, valid, valid, valid, valid, valid |
| suggestion-correctly-withheld-security-purpose-exception | 6 | valid, valid, valid, valid, valid, valid |
| correction-not-knowable-dna-pass | 5 | valid, valid, valid, needs-fix, valid, valid |
| suggestion-present-but-too-vague-to-be-actionable | 6 | valid, valid, valid, valid, valid, valid |
| suggestion-stranded-far-from-field-or-unreachable | 5 | valid, valid, valid, needs-fix, valid, valid |
| color-asterisk-icon-only-no-text-suggestion | 6 | valid, valid, valid, valid, valid, valid |
