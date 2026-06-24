# case-03 — RTL formatting toolbar: first button hugs the inline-start edge so its focus ring is clipped off the visible track (FAIL)

## Scenario
An Arabic (`dir="rtl"`) e-commerce CMS ("سوق المنارة" / Manara Market) lets
merchants edit product descriptions with a horizontal formatting toolbar. There
are more tools than fit, so the team hides the overflow behind a gradient fade and
a "⋯ more tools" affordance using `overflow:hidden` on the bar. To make the first
tool hug the bar's inline-start edge for a tidy rail, the inner track is pulled
flush with a negative `margin-inline-start`. In RTL the inline-start edge is the
RIGHT side, where the first button in tab order ("غامق" / Bold) lives — so when a
keyboard user Tabs to it, the right rail of its focus ring (the edge a user scans
toward in RTL) is painted at / past the `overflow:hidden` boundary and clipped.

## Attribute tuple
- **Content domain:** e-commerce product authoring (CMS rich-text editor)
- **UI component / pattern:** horizontal `role="toolbar"` with overflow fade + "more" button
- **Host-language construct:** `dir="rtl" lang="ar"`, `overflow:hidden` clip, `margin-inline-start` pull, logical-property layout
- **Locale / i18n:** Arabic (RTL); writing-mode-sensitive inline-start = right
- **Failure mechanism:** focus ring clipped at a horizontally-clipped (`overflow:hidden`) toolbar's inline-start edge

## Developer persona
A developer building an LTR-first design system added the overflow-fade toolbar
and tuned the negative margin so the first button sat snug against the edge — in
their LTR test build, that was the *left* edge and looked fine. The component was
later dropped into the Arabic store with `dir="rtl"`, which flipped inline-start
to the right. They sanity-checked with a mouse in Arabic and the buttons worked;
they never tabbed, so they never saw the first button's ring sliced by the clip on
the now-right inline-start edge.

## Element / selector carrying the issue
`.tool:focus-visible` on the first toolbar button, clipped by
`.toolbar { overflow: hidden }` combined with `.toolbar__track { margin-inline-start: -52px }`.
Verified in Chromium (RTL): focusing the first tool, its box and the right rail of
its ring extend past the toolbar's clip boundary and are removed; over half the
button label is cut off at the right edge.

## Exact accessibility mechanism
`Tab` focuses the first toolbar button; the browser paints the author's 3px ring
around it. Because the track is pulled flush with `margin-inline-start: -52px`, the
button straddles the toolbar's `overflow:hidden` inline-start (right) edge, so the
ring's right rail and right corners are clipped away. The surviving left/top/bottom
fragments plus a faint tint mean *some* pixels change, but the bold ring edge a
keyboard user in an RTL UI scans toward is gone. Tools nearer the inline-end edge
are additionally covered by the fade + "⋯ more" overlay, occluding their rings too.

## Expected ACT-style outcome
**failed** (SC 2.4.7 — the focus indicator is drawn but clipped by the toolbar's
`overflow:hidden` at the inline-start edge, so it is not actually visible).

## Why automated tools miss it
Every toolbar button has a valid, high-contrast `:focus-visible` ring and a
background swap, so oj04fd is satisfied (pixels change inside the bar) and
axe/WAVE/Lighthouse report nothing. The defect is layout- and writing-mode-aware:
in this RTL toolbar the first button in tab order is the right-most one, pinned
against the `overflow:hidden` boundary, so the rail facing the edge is clipped.
Whether a keyboard user can actually SEE the ring — given the clip box, the RTL
inline-start edge, and the overflow fade — is a human visual judgment a static
scanner cannot make.

## Citation
**Reference:** WCAG Technique F78 — Failure due to styling element outlines/borders so the visual focus indicator is removed or non-visible (`wcag-techniques/failures/F78.html`)
> "Other styling may make it difficult to see the focus indicator even though it is present, such as outlines that look the same as the focus outline, or thick borders that are the same color as the focus indicator so it cannot be seen against them."

**Reference:** ACT Rule oj04fd — Expectation (`act-rules/extracted/oj04fd.md`)
> "For each target element, there is at least one device pixel inside the scrolling area of the viewport whose HSL color value is different when the element is focused from when it is not."
