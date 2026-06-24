# case-02 — Impossible date flagged only by a decorative (alt="") red warning-triangle icon

## Scenario
A family clinic's multi-step appointment-request intake (step 1 of 3). The patient entered a
date of birth of **31/02/1991** — 31 February does not exist. The validator flagged it by
placing a red exclamation-triangle SVG image immediately to the right of the field. The image
is marked **decorative** with `alt=""`, so assistive technology skips it entirely, and there is
no nearby message, no hidden text, no `aria-label`, no `title`, and no `aria-invalid`. The
triangle is the only thing on the page that says "this date is wrong."

## Attribute tuple
- **content-domain:** healthcare (patient intake / appointment booking)
- **UI-component/pattern:** multi-step form, field + adjacent status icon
- **host-language construct:** `<img class="warn-ico" alt="" src="data:image/svg+xml,…">`
- **locale/i18n:** en-GB (UK phone format, GP surgery)
- **failure-mechanism:** error meaning carried by an icon glyph whose text alternative is
  deliberately empty, so the error is conveyed by image alone with no text

## Developer persona
A contractor building the clinic portal used a generic "field with trailing icon" component. To
satisfy the accessibility linter that kept warning about images without alt text, he set
`alt=""` on every status icon — the linter went green. He did not realise that the warning
triangle, unlike a purely decorative flourish, *carries the only error information*, and that
`alt=""` therefore hides the error from non-visual users.

## Element / selector carrying the issue
`img.warn-ico[alt=""]` beside `input#dob` (value `31/02/1991`). The red triangle is the sole
error indicator; its empty alt removes it from the accessibility tree.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user navigating the form hears "Date of birth, edit, 31/02/1991" and then moves
to "Contact number" — the `alt=""` image is announced as nothing at all. There is no spoken cue
that the date is impossible, no message text, no programmatic invalid state. A sighted user, by
contrast, sees the universal red ⚠ symbol directly beside the field and reads it instantly as
"error." The error meaning lives entirely in a picture whose text alternative was emptied, so it
is available neither in text nor via AT, violating the "in text" requirement of SC 3.3.1.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`alt=""` is *exactly* what automated checkers want for a non-informative image — axe/WAVE/
Lighthouse positively reward it and would flag the page only if the alt were missing. They
cannot tell that *this* particular icon is informative (it is the error indicator) rather than
decorative; distinguishing an error-bearing glyph from ornamental chrome requires reading the
rendered context (an impossible date with a warning triangle beside it). Nor can a tool confirm
that the error meaning is absent from every other text node. ACT 36b590 finds no error text to
evaluate, so it does not fire. The judgment is inherently visual-semantic.

## Citation
> **WCAG 2.2 Understanding 3.3.1 — Intent:** "It is perfectly acceptable to indicate the error
> in other ways such as through the use of an image, color, or other visual indicator, in
> addition to the text description."

(Verbatim from `wcag-understanding/error-identification.html`. The red triangle *image* is
acceptable only as an addition to a text description, which is absent here, so the image is the
sole — and therefore non-conforming — indicator.)

> **WCAG Techniques, F81 — Description:** "the failure that occurs when a required field or an
> error field is marked with color differences only, without an alternate way to identify the
> required field or error field."

(Verbatim from `wcag-techniques/failures/F81.html`. The error field is marked only by the red
icon glyph with no alternate text identification — the `alt=""` removes any text alternative.)
