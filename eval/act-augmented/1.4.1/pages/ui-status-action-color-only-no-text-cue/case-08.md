# Loan actions retain color and gain meaningful labels

- Expected: `passed`
- Category: Decorative/redundant visual cue
- Source pair: case-01.html in this aspect
- Exact repair: Kept the green and red button fills and changed the duplicated Submit labels to “Submit application” and “Cancel application”.
- Primary selector: `button.btn--proceed`

## Why this passes

Each action is identified by meaningful visible button text, so color no longer determines which action proceeds and which cancels.

## Accessibility-tree / visual evidence

The two button names resolve to “Submit application” and “Cancel application”.

## Citation

- Document: `wcag-techniques/general/G14.html`
- Verbatim quote: “An on-line loan application explains that green buttons advance in the process and red buttons cancel the process. A form contains a green button containing the text Go. The instructions say "Press the button labeled Go to submit your results and proceed to the next step."”
