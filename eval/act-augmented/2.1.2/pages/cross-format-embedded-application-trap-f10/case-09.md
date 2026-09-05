# case-09 — paired accessibility-tree-boundary hard negative for case-03

## Pair and category
Full counterpart of **case-03**. Batch `gena11y-fp-50-v2`; category `accessibility-tree-boundary`.

## Exact repair
Remove only the shadow root's `focusout` re-grab listener. The custom element, open shadow DOM, `delegatesFocus`, textarea, Post button, styling, and following host link remain unchanged.

## Selector and mechanism
`comment-composer` — Tab enters the shadow controls, advances textarea → Post, and then crosses the shadow boundary to `a[data-after="true"]` without a nonstandard command.

## Expected outcome
**passed** — SC 2.1.2.

## Why tools may miss
Light DOM still exposes only a custom-element host. Verification requires piercing the shadow tree and exercising focus across its boundary.

## Citation
**Reference:** `wcag-understanding/no-keyboard-trap.html`
> The intent of this success criterion is to ensure that content does not "trap" keyboard focus within subsections of content on a web page.
