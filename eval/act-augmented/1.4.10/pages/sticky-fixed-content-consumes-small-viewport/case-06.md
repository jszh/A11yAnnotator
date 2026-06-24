# case-06 — sticky editor toolbar fails on BOTH axes: 552px of off-canvas controls + 41% vertical eat

## Scenario
"DocForge CMS" provides a page editor. The formatting toolbar is `position: sticky` and laid out
as a single non-wrapping row (`white-space: nowrap; overflow-x: auto`) holding a style select and
~16 buttons (bold/italic/.../insert link, image, code, table, undo, redo, **Publish**). At 320px
the toolbar's content is **872px wide against a 320px client width — 552px of horizontal
overflow** — so its right half, including the **Publish** button (rendered at left=793px), runs
off-canvas behind the toolbar's internal horizontal scrollbar; the user must scroll sideways
*inside the toolbar* to reach those controls. The same toolbar is `min-height: 104px` and sticky,
so it also eats **41% of the 256px reflow height**. The editable area below it is ordinary prose
(a getting-started guide), **not** an excepted persistent-toolbar editing canvas — so it must
reflow.

## Attribute tuple
- **Content domain:** developer docs / CMS authoring
- **UI component / pattern:** sticky rich-text formatting toolbar (`role="toolbar"`)
- **Host-language construct:** `div.toolbar { position: sticky; min-height: 104px; white-space: nowrap; overflow-x: auto }`
- **Locale / i18n:** en
- **Failure mechanism:** dual-axis — horizontal: controls overflow off-canvas at 320px; vertical: sticky bar consumes the short viewport

## Developer persona
A frontend dev built the editor toolbar to match a desktop word processor and chose
`overflow-x: auto` so "it never wraps and the buttons stay aligned." On a wide screen all 16
buttons fit on one line. The dev assumed the toolbar fell under the SC's persistent-toolbar
exception ("editors need their toolbar visible") and never checked that the *edited content here
is plain prose*, nor that at 320px the right-hand controls disappear off-canvas. They tested only
at full width.

## Element / selector carrying the issue
`div.toolbar[role="toolbar"]` — `position: sticky; min-height: 104px; white-space: nowrap;
overflow-x: auto`. The worst-affected control is `.toolbar .publish` (off-canvas at left=793px,
viewport 320px).

## Exact accessibility mechanism
A low-vision user zooms to edit a page. (1) Horizontal: to reach Publish (or insert-link, image,
code, table) they must discover and operate a horizontal scrollbar *inside* the toolbar — a
second scroll axis the SC is meant to eliminate; verified the toolbar scrollWidth is 872px vs
320px client width and Publish sits entirely off-screen. (2) Vertical: the sticky bar pins 104px
(41%) of the 256px viewport, shrinking the editable prose band. Because the edited content is
ordinary text (it reflows fine on its own), the persistent-toolbar/exception does not apply — the
toolbar is chrome that must itself reflow or wrap. The result is two-dimensional scrolling plus
reduced reading space: the core Reflow harm.

## Expected ACT-style outcome
**failed** (SC 1.4.10). At 320px the toolbar's controls overflow off-canvas requiring horizontal
scrolling, and the sticky bar consumes a large share of the 256px height; the editable region is
non-excepted prose.

## Why automated tools miss it
`overflow-x: auto` + `white-space: nowrap` is a normal, valid pattern; every toolbar button has
an `aria-label`, good contrast, and is focusable, so axe/WAVE pass. Lighthouse's viewport audit
passes (zoom allowed) and it does not measure rendered toolbar width or detect off-canvas
controls. No tool decides whether the editable region qualifies for the persistent-toolbar
exception — that requires understanding the *content* is plain prose. Verified empirically:
toolbar scrollWidth 872px (552px overflow), Publish off-canvas, sticky bar 104px (41%) of height.
Both axes require a human rendering and reasoning at 320px.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, "Interfaces with persistent toolbars" (`wcag-understanding/reflow.html`)
> "Interfaces which provide toolbars to edit content need to show both the content and the toolbar in the viewport. Depending on the number of toolbar buttons, the toolbar may need to scroll in the direction of text, or might even need to remain fully visible and scroll along with the rich text content or editable canvas area that it provides features for editing."

**Reference:** WCAG 2.2 Understanding — Reflow, Intent (`wcag-understanding/reflow.html`)
> "When lines of text extend beyond the edge of a viewport, users will be forced to scroll back-and-forth to read line by line. This can cause them to lose their place and can significantly increase both physical and cognitive effort."

**Reference:** WCAG 2.2 Understanding — Reflow, "Understanding the scope of exceptions" (`wcag-understanding/reflow.html`)
> "When a section of content is excepted from Reflow, the exception does not automatically extend to other content that doesn't need two-dimensional scrolling for understanding or functionality."
