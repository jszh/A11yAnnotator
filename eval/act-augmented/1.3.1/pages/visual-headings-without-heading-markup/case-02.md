# case-02 — Help-center FAQ where each question is a styled `<div>`, not a heading

## Scenario
A retailer's help-center article ("Returns & Refunds"). The page has one real `<h1>`. Beneath it,
five FAQ questions ("How long do I have to return an item?", "Do I have to pay for return shipping?",
"When will I get my money back?", "Can I exchange instead of refund?", "What if my item arrived
damaged?") are each rendered as a `<div class="q">` styled at 150% size and bold, clearly functioning
as sub-section headings that title the answer paragraph(s) below each. None of the questions is an
`<h2>`/`<h3>` and none carries `role="heading"`. A screen-reader user's heading list shows only the
single page title; the entire Q&A structure is invisible to heading navigation, so the user cannot
jump from question to question and must read the article top to bottom.

## Attribute tuple
- **Content domain:** e-commerce customer support / help center
- **UI component / pattern:** FAQ / Q&A block
- **Host-language construct:** `<div>` styled with `font-size:150%; font-weight:bold`
- **Locale / i18n:** en
- **Failure mechanism:** F2 — partial outline; the real `<h1>` masks the missing sub-heading semantics

## Developer persona
A junior developer hand-coded the article from a Figma comp. They correctly used `<h1>` for the page
title (so the linter's "needs one h1" check was satisfied and they felt done), but for the FAQ they
copied a `<div class="q">` snippet from an old internal template and bumped the size in CSS rather than
using `<h2>`. Because the page already had an `<h1>`, every automated check went green and the missing
question-level headings were never noticed.

## Element / selector carrying the issue
`div.q` — the five FAQ question lines. Each is a `<div>` that visually and functionally is a heading
for the answer beneath it.

## Exact accessibility mechanism
The accessibility tree exposes each `div.q` as a generic container with static text — role `generic`,
not `heading`. The screen-reader headings list contains exactly one entry (the `<h1>`). "Next heading"
skips straight from the page title past all five questions to nothing, so the FAQ's internal structure
is not programmatically determinable even though it is visually obvious. This is precisely the
mismatch TT 10.B forbids: a visual heading that is not programmatically determinable. The presence of
the legitimate `<h1>` makes the failure *more* deceptive, not less — it pushes the page past the
naive "has a heading?" checks.

## Expected ACT-style outcome
**failed** (SC 1.3.1, F2; Trusted Tester 10.B). Five visual headings are present and apparent; none
is programmatically a heading.

## Why automated tools miss it
Because a valid `<h1>` exists, axe-core `page-has-heading-one` PASSES and `heading-order` finds a
single well-ordered heading with nothing to flag; WAVE reports "1 heading" with no error; Lighthouse's
heading audit is satisfied. No automated rule can infer that the bold 150% `<div>` questions are
themselves headings that should appear in the outline — that requires reading the rendered visual
hierarchy and recognizing a Q&A pattern, a semantic/visual judgment unavailable to a DOM scan.

## Citation
**Reference:** Trusted Tester v5.1.3 — Test 10.B `1.3.1-heading-determinable` (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
> "If ANDI does not identify a visually apparent heading → not defined programmatically."

**Reference:** WCAG 2.2 Understanding Info and Relationships (`wcag-understanding/info-and-relationships.html`)
> "Sighted users perceive structure and relationships through various visual cues — headings are often in a larger, bold font separated from paragraphs by blank lines ... Having these structures and these relationships programmatically determined or available in text ensures that information important for comprehension will be perceivable to all."
