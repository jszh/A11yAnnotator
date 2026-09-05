# case-07 — paired external-reference hard negative for case-01

## Pair and category
Full counterpart of **case-01**. Batch `gena11y-fp-50-v2`; category `external-reference`.

## Exact repair
Keep the trapped worksheet and working Ctrl+M behavior. Move the existing accurate instruction from the unreachable collapsed disclosure into the start of the worksheet, give it an ID, and reference it from the worksheet with `aria-describedby`. No instruction text is invented or changed.

## Selector and mechanism
`#worksheet[aria-describedby="worksheet-exit-help"]` — sighted users encounter the advice inside the subset before its controls, and assistive technology obtains the working Ctrl+M exit method through the external reference.

## Expected outcome
**passed** — SC 2.1.2 because a documented, keyboard-operable exit exists and its instruction is programmatically available at the subset boundary.

## Why tools may miss
The behavior still looks like a trap under repeated Tab. Correct judgment requires resolving the external description and then verifying the described modified-key exit.

## Citation
**Reference:** `wcag-techniques/general/G21.html`
> Providing a keyboard function to move the focus out of the subset of the content. Be sure to document the feature in an accessible manner within the subset.
