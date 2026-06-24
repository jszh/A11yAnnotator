# case-05 — Off-canvas drawer closed with `transform: translateX(-110%)`: focusable links keep their focus ring, painted entirely off-screen (FAIL)

## Scenario
MyHealth Portal's dashboard has a hamburger button that opens an off-canvas
navigation drawer. The drawer is "closed" by sliding it off the left edge with
`transform: translateX(-110%)` (chosen over `display:none` so the open/close can
animate). The consequence: while closed, the drawer's links are still rendered,
still focusable, and still in the tab order — their layout box is at `left:0`, only
the paint is pushed ~300px off the left of the viewport. When a keyboard user Tabs
from the menu button, focus moves to the first drawer link ("Dashboard"); the link
has a correct, high-contrast focus ring, but it is painted entirely off-screen and
the browser does not scroll to it (its layout position is already "in view"), so
the user sees no focus anywhere.

## Attribute tuple
- **Content domain:** healthcare / patient portal
- **UI component / pattern:** off-canvas navigation drawer (mobile-style hamburger menu)
- **Host-language construct:** `transform: translateX(-110%)` to hide; links left focusable (no `display:none` / `inert` / `tabindex=-1`)
- **Locale / i18n:** en-US
- **Failure mechanism:** focus moves to an element pushed outside the visible viewport by a CSS transform; indicator painted off-screen, browser does not scroll to it

## Developer persona
A developer adapted a CSS-only off-canvas drawer snippet that animates with
`transform` (the snippet's comment said "slide, don't display:none, so it
transitions"). They knew enough to animate it but not enough to also make the
closed drawer non-focusable (`inert`, `visibility:hidden`, or `tabindex=-1` on the
links). They tested by clicking the hamburger to open the menu and tabbing
*inside* it — which worked — and never tabbed past the hamburger with the menu
*closed*, so they never saw focus disappear off the left edge.

## Element / selector carrying the issue
`.drawer a:focus-visible` while the drawer is in its closed (translated-off) state,
caused by `.drawer { transform: translateX(-110%) }` with the links left in the tab
order. Verified in Chromium: Tab from the menu button lands on the "Dashboard"
link, whose bounding box is at x ≈ -294…-42 — entirely off the left edge
(`paintedInViewport: false`) — and no focus ring is visible in the viewport.

## Exact accessibility mechanism
`Tab` from the hamburger button moves focus to the first drawer link. The browser
paints the author's 3px ring on that link — but the drawer is translated ~300px off
the left edge, so the link and its ring are rendered off-screen. Crucially, the
browser's focus/`scrollIntoView` machinery uses the element's *layout* position
(which is `left:0`, on-screen) and therefore does not scroll; a CSS transform moves
only the paint, not the layout box. So the indicator exists but is unseeable, and
the keyboard user has no idea focus has entered an invisible menu. (This is the
classic off-canvas / off-screen-slide pattern: content hidden by transform instead
of `display:none` keeps leaking into the tab order.)

## Expected ACT-style outcome
**failed** (SC 2.4.7 — the focus indicator is drawn but lies entirely outside the
visible viewport because the element is translated off-screen while remaining
focusable, so the user never sees focus).

## Why automated tools miss it
The drawer links have a valid, high-contrast `:focus-visible` ring, and focusing
one changes pixels, so oj04fd is satisfied — it requires only a changed pixel
"inside the scrolling area of the viewport," and the drawer's layout box IS at
`left:0`. But the drawer is closed with `transform: translateX(-110%)` (not
`display:none` / `visibility:hidden` / `inert`), so its links stay focusable while
being painted off-screen. Judging that the indicator is painted outside the visible
region — rather than simply that some pixel changed — requires running the keyboard
sequence and reasoning about transform geometry, which static scanners do not do.

## Citation
**Reference:** ACT Rule oj04fd — Expectation (`act-rules/extracted/oj04fd.md`)
> "For each target element, there is at least one device pixel inside the scrolling area of the viewport whose HSL color value is different when the element is focused from when it is not."

**Reference:** WCAG 2.2 Understanding — Focus Visible (`wcag-understanding/focus-visible.html`)
> "This success criterion helps anyone who relies on the keyboard to operate the page, by letting them visually determine the component on which keyboard operations will interact at any point in time."
