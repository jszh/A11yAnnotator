# case-05 — Absolutely-positioned sidebar at `left: 340px` sits off-canvas, forcing page-level horizontal scroll

## Scenario
A trailhead-conditions page has a fluid main article and a "current trail status" sidebar. The sidebar
is taken out of flow with `position: absolute; left: 340px; width: 280px`. On desktop it parks neatly to
the right of the article. But its left edge is fixed at 340 CSS px, so at a 320 CSS-px viewport the
sidebar begins past the right edge of the screen — the page must grow a horizontal scrollbar to reveal
it, and a magnifier user has no idea the status box exists until they scroll right. The sidebar is plain
informational content that should simply stack under the article.

## Attribute tuple
- **Content domain:** municipal / parks (volunteer-run trailhead info)
- **UI component / pattern:** complementary `<aside>` "at a glance" status panel
- **Host-language construct:** `position: absolute; left: 340px` on the aside (off-canvas at 320px)
- **Locale / i18n:** en (LTR)
- **Failure mechanism:** absolutely-positioned off-canvas content generates a page-level horizontal scrollbar

## Developer persona
A parks-department volunteer who codes as a hobby wanted the status box "floating to the right" and
copied an absolute-positioning snippet from a forum answer, hard-coding `left: 340px` to clear the
article. They never wrapped it in a media query to switch to static positioning at narrow widths.
Because absolute elements are removed from flow, the article still looked fine, so the page seemed
responsive on their laptop.

## Element / selector carrying the issue
`.conditions` (the `<aside>`) with `position: absolute; left: 340px; width: 280px`. Its right edge lands
at 620 CSS px, well beyond a 320px viewport, dragging the document's `scrollWidth` past `clientWidth`.

## Exact accessibility mechanism
Absolutely-positioned content with a fixed left offset does not reflow; it stays where it was placed
regardless of viewport width. At 320 CSS px the sidebar is entirely off the right edge, so the browser
shows a horizontal scrollbar at the page level. Worse, a low-vision user who does not think to scroll
right may never discover the trail-status information at all — a combined Reflow + content-discovery
problem. The sidebar is ordinary reflowable content (a definition list of statuses) with no
two-dimensional requirement; the correct behavior is to set it `position: static` at narrow widths so it
stacks below the article.

## Expected ACT-style outcome
**failed** (SC 1.4.10). b4f0c3 (viewport meta) passes; the off-canvas absolute element is the failure.

## Why automated tools miss it
A scanner sees a valid `<aside>` with an accessible name and a permissive viewport meta — no violation.
It does not render at 320 CSS px to find that the absolutely-positioned box is off-screen and forces
horizontal scroll. Even with overflow detection, deciding the off-canvas element is non-excepted content
(rather than, say, a legitimately fixed-dimension widget) requires a human to classify what is over
there and confirm it should have reflowed.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Neither adjusting or relocating content is considered a loss of information or functionality, so long as users are still able to access the content."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "It is strongly suggested that at smaller viewport sizes that such components are modified to have static positioning, or their display can be toggled by the user. Doing so will help ensure the zoomed in content can be read by users, as the sticky components will no longer obstruct the view of the web page's content."

**Reference:** WCAG Technique F102 — Failure due to content disappearing after reflow (`wcag-techniques/failures/F102.html`)
> "For each content element that is not provided at the viewport width of 320px, check that there is a way to reach the same or equivalent content via disclosure widgets, pop-ups, or links to other views"
