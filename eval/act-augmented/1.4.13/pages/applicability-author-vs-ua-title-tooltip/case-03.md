# case-03 — `title=""` suppresses the native tooltip; a CSS `::after` repaints an identical gray bubble: author-controlled, FAILS

## Scenario
A public-transit trip planner ("Aurora Transit") lists each leg of a journey with a small round service-note icon. The author explicitly sets `title=""` on each icon to **kill** the browser's native tooltip, then paints a visually identical gray bubble using a pure-CSS `::after` whose `content: attr(data-hint)` pulls the note text from a `data-hint` attribute. There is **no JavaScript** involved in the tooltip. The bubble appears only while the 22px icon itself is `:hover`ed; a `::after` pseudo-element is not in the accessibility tree, cannot receive the pointer, and there is no Escape affordance. The look is indistinguishable from a native tooltip, but the owner is the author's CSS — so 1.4.13 applies and it fails hoverable + dismissible.

## Attribute tuple
- **content-domain:** municipal / public-transit trip planner
- **UI-component / pattern:** service-note info icon with CSS-only tooltip
- **host-language construct:** `title=""` (native suppressed) + `::after { content: attr(data-hint) }` (no JS)
- **locale / i18n:** en-US
- **failure-mechanism:** author CSS pseudo-element tooltip — not hoverable (pseudo can't take pointer), not dismissible (no Esc), and misattributable as a suppressed/absent native tooltip
- (visual-only-conveyance facet: `CSS ::after content carries the only text`)

## Developer persona
A designer-developer disliked the OS tooltip's appearance and the "double tooltip" effect, so they followed a popular CSS-only tooltip recipe from a blog: set `title=""` to silence the browser, stash the real text in `data-hint`, and reveal it with `::after`. It looked perfect in their quick mouse test. They never considered that a `::after` cannot be hovered into, exposes no role to AT, and offers no Escape — and they assumed `title=""` made the element "accessible enough."

## Element / selector carrying the issue
`.feat` (the service-note icons, each with `title=""` and `data-hint="…"`). The visible bubble is the CSS rule `.feat:hover::after`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted mouse user hovers the icon; the gray `::after` bubble appears with the note and looks native.
- A `::after` pseudo-element is generated content: it has no DOM node, no accessibility-tree presence, and **cannot receive the pointer**. Moving the pointer off the 22px icon toward the bubble ends `:hover` → the bubble vanishes. **Not hoverable** (F95).
- There is no Escape/dismiss mechanism, and the bubble overlaps adjacent content. **Not dismissible without moving the pointer.**
- The author set `title=""`, so the UA renders **no** native tooltip; the visible bubble is therefore author-controlled CSS, **not** user-agent-controlled — the UA carve-out does **not** apply. 1.4.13 **is** in scope. → FAILS.

Verified with Puppeteer: `.feat` has `title=""`; `getComputedStyle(.feat, '::after').content` is the `data-hint` text; on a real mouse hover the `::after` opacity goes to `1` (bubble visible).

## Expected ACT-style outcome
**failed** (SC 1.4.13 — author-controlled CSS `::after` tooltip on hover that is not hoverable and not dismissible; UA-exclusion does not apply because `title=""` suppresses the native tooltip and the author paints the bubble).

## Why automated tools miss it
The element carries a `title` attribute (`title=""`), so a scanner reads "has a native tooltip" — but an empty title yields **no** UA tooltip, so a tool may instead conclude there is nothing on hover at all. Neither interpretation captures the reality: the visible gray bubble is an author CSS `::after`, which puts the content **in scope** for 1.4.13. Recognizing that the bubble is author-painted (not the suppressed/absent UA tooltip), that a pseudo-element cannot be hovered into, and that there is no dismiss path all require human visual + semantic judgment that no static checker performs.

## Citation
> "This criterion does not attempt to solve such issues when the appearance of the additional content is completely controlled by the user agent. A prominent example is the common behavior of browsers to display the `title` attribute in HTML as a small tooltip."
— wcag-understanding/content-on-hover-or-focus.html (Intent → Additional Notes)

> "A technique to view the content fully in both situations is to move the mouse pointer directly from the trigger onto the new content. … This condition generally implies that the additional content overlaps or is positioned adjacent to the target."
— wcag-understanding/content-on-hover-or-focus.html (Intent → Hoverable)

> "1. The pointer can be moved over the new content without the additional content disappearing. 2. The appearance of the additional content is controlled by the user agent, not the author." … "If #1 and #2 are false, then content fails the Success Criterion."
— wcag-techniques/failures/F95.html (Tests → Procedure & Expected Results)
