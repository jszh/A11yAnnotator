# case-08 — paired counterfactual for case-02

## Pair and scenario
The Riverbank donation page keeps the same hosted-payment iframe, five internal controls, secure-card styling, parent-page cancel link, and cross-document accessibility boundary as case-02.

This page is paired with **case-02** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Remove only the frame-local first/last keydown handlers that wrapped Tab and Shift+Tab. Point the unchanged parent iframe to `case-08-frame.html`; native browser focus traversal now crosses both iframe boundaries.

## Element / selector
`iframe[src="case-08-frame.html"]`

## Expected ACT-style outcome
**passed** — SC 2.1.2. Keyboard focus can leave the embedded application through reliable native Tab and Shift+Tab behavior.

## Why this is a hard negative
Static DOM and AX inspection show a separate focus context but cannot establish a trap. This pass must be distinguished through actual boundary traversal, including the last and first internal controls.

## Citation
**Reference:** wcag-techniques/general/G21.html
> Ensuring that the keyboard function for advancing focus within content (commonly the tab key) exits the subset of the content after it reaches the final navigation location.
