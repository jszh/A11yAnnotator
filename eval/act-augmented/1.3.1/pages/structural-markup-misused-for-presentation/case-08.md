# case-08 — paired counterfactual PASS for case-02

## Pair and scenario
This page is the passing counterpart of **case-02** in the same aspect. The product page retains the same first-party shipping and returns policy block from case-02.

## Exact repair
Replace only the non-quotation blockquote with a visually identical div.policy container.

All other realistic content, presentation, controls, and page structure from case-02 are retained.

## Element / selector
`.info > div.policy`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The store policy is no longer exposed as quoted material.

## Why this is a hard negative
The indented visual treatment remains identical, so semantics—not appearance—determine the verdict. It is deliberately paired with case-02, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/failures/F43.html
> The following example uses blockquote for text that is                                 not a quotation to give it prominence by indenting it when displayed                                 in graphical browsers.
