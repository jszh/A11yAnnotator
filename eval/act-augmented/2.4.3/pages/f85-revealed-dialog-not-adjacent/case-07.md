# case-07 — paired external-reference hard negative for case-01

## Pair and category
Full counterpart of **case-01**. Batch `gena11y-fp-50-v2`; category `external-reference`.

## Exact repair
Keep the remotely placed non-modal dialog. Add `aria-controls="subscribeDialog"`; when opened, move focus to its existing email field, and on either existing close path return focus to the trigger. No page content or destination is removed.

## Selector and mechanism
`#openSubscribe[aria-controls="subscribeDialog"]` — the trigger references the distant region and activation immediately transfers focus into it; dismissal restores the initiating context.

## Expected outcome
**passed** — SC 2.4.3.

## Why tools may miss
DOM adjacency remains suspicious. Verification must resolve the external target and observe live focus on open and close rather than infer failure from source distance.

## Citation
**Reference:** `wcag-techniques/failures/F85.html`
> Because a user's focus isn't managed ... the user will need to tab through the rest of the web page before they can interact with the dialog.
