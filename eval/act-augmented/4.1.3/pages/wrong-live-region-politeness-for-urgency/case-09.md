# case-09 — paired PASS repair of case-01

## Source and exact repair
The complete Helmsley preferences UI, including its decorative checkmark, submit interaction, focus behavior, and success text remain. The pre-existing region changes from `aria-live="off"` to `role="status" aria-live="polite"`; its decorative SVG and empty text span exist at load, and status text is inserted only after activation. The visual reveal uses `:has(.status-text:not(:empty))`, while the handler performs one `textContent` mutation and no class mutation.

## Expected outcome
**passed.** “Preferences saved” is a non-urgent success status announced politely without moving focus.

## Why tools may still over-report
The region is empty at rest and visually hidden with opacity until submission. Validation requires exercising the control and distinguishing healthy empty-at-birth wiring from a region inserted already populated.

## Citation
`wcag-understanding/status-messages.html`:
> "The intent of this success criterion is to make users aware of important changes in content that are not given focus, and to do so in a way that doesn't unnecessarily interrupt their work."
