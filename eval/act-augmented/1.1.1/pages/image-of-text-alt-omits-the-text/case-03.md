# case-03 — Inline SVG certificate (role="img") named "Award badge"; recipient and date are unread <text>

## Scenario
An internal "Recognition wall" page shows an "Employee of the Quarter" certificate built as
a decorative inline `<svg role="img">`. The SVG is named by a single `<title>` element:
"Award badge". The certificate's meaningful content is drawn with SVG `<text>` elements:
"EMPLOYEE OF THE QUARTER / Awarded to Dana Okafor / Q2 2026 · Customer Success". Because the
SVG carries an explicit `role="img"` plus a `<title>`, the accessibility tree collapses it
into one image node named "Award badge"; the inner `<text>` glyphs are not exposed. A sighted
colleague reads exactly who won and when; a screen-reader user hears only "Award badge,
image" and never learns the recipient is Dana Okafor.

## Attribute tuple
- **Content domain:** enterprise / HR (internal recognition intranet)
- **UI component / pattern:** award/certificate card built from inline SVG
- **Host-language construct:** inline `<svg role="img">` named by `<title>`, with meaningful content in child `<text>` elements
- **Locale / i18n:** en
- **Failure mechanism:** SVG treated as a single named image whose name ("Award badge") omits the recipient/date text the SVG visibly draws

## Developer persona
A front-end developer dropped in an SVG certificate exported from the design system. To get a
screen reader to "say something" they added `role="img"` and a `<title>` of "Award badge"
(matching the design-system component name). They did not realise that giving the SVG its own
role+name suppresses the inner `<text>` from the accessibility tree, so the recipient's name
— the whole point of the certificate — silently disappears for AT.

## Element / selector carrying the issue
`svg[role="img"] > title` ("Award badge"). The load-bearing strings ("Awarded to Dana
Okafor", "EMPLOYEE OF THE QUARTER", "Q2 2026") live in sibling `svg > text` nodes that the
named-image collapse hides from AT.

## Exact accessibility mechanism
With `role="img"` and a `<title>`, the accessible name is "Award badge" and the SVG subtree
is presented as a single graphic; descendant `<text>` is not exposed as separate content
(verified: the a11y image node name is "Award badge"; "Dana Okafor" and "QUARTER" are absent
from the accessibility tree). So the recipient and quarter — meaningful text the image
displays — never reach AT. Because this is an image of meaningful text, the accessible name
must contain that same text; "Award badge" does not.

## Expected ACT-style outcome
**failed** (SC 1.1.1). ACT rule 7d6734 ("SVG element with explicit role has a non-empty
accessible name") PASSES — the `<title>` provides a non-empty name. The page nonetheless
fails 1.1.1: the name is a generic label and the displayed words (recipient, award, date) are
lost.

## Why automated tools miss it
axe's `svg-img-alt` and ACT 7d6734 only require the SVG to have *a* non-empty name; "Award
badge" satisfies that. No automated checker reads the inner `<text>` glyphs, recognises they
are the meaningful content, and verifies the name reproduces them — and because the named-img
collapse removes those `<text>` nodes from the a11y tree, even a tool that walked the tree
would not see them as the alternative. Judging that the name must include "Dana Okafor" and
the quarter is a manual transcription-equivalence call.

## Citation
**Reference:** Trusted Tester v5.1.3 SC 1.1.1, Test 7.A step 1.d (`refs/trusted-tester/sc-1.1.1-non-text-content.md`)
> "If the image is of **meaningful text**, ANDI Output must contain the **same text**."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "When non-text content contains words that are important to understanding the content, the alt text should include those words."

**Reference:** ACT Rule qt1vmo "Image accessible name is descriptive" (`act-rules/extracted/qt1vmo.md`)
> "Each test target has an accessible name that serves an equivalent purpose to the non-text content of that test target."
