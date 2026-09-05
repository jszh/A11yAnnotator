# case-09 — paired PASS repair of case-03

## Source and exact repair
The same Aerolinks legs, identical “Travel date” labels, and retained dates remain. The outbound constant is the durable future date `2099-07-14` in both pair members; the return remains the past date `2025-03-02`. The error is moved from the valid outbound leg to the invalid return leg, made leg-specific, and connected through `aria-describedby`.

## Expected outcome
**passed.** Both text and programmatic association identify the return field and its past-date error.

## Why tools may still over-report
The duplicate labels and two fieldsets remain deliberately confusable; a local extractor must follow the IDREF and preserve the return legend context.

## Citation
`act-rules/extracted/36b590.md`:
> "Each test target either has no form field error indicators , or at least one of the form field error indicators allows the identification of the related test target, through text , or through non-text content , or through presentation ."
