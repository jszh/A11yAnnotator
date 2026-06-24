# case-03 — ASCII-art network diagram whose spatial layout is the content (excepted overflow)

## Scenario
An open-source message-bus project's architecture / CONTRIBUTING doc. It embeds a hand-drawn ASCII
diagram (boxes made of `+ - |`, arrows `-->` / `v`) whose POSITIONS encode the topology: which
service connects to which, request direction, and a parallel fan-out to two subscriber groups. The
diagram is genuinely wider than 320 CSS px and uses `white-space:pre`, so it scrolls horizontally at a
narrow viewport. Its layout is the information.

## Attribute tuple
- **Content domain:** open-source developer docs / system architecture
- **UI component / pattern:** ASCII-art diagram in a `<figure>` with `role="img"` + `aria-label`
- **Host-language construct:** `<pre role="img" aria-label="...">` with `white-space:pre`
- **Locale / i18n:** en; also a `forced-colors` media query so the art survives High Contrast
- **Failure mechanism:** NONE — exception side; "ascii art" is the canonical layout-carries-meaning case

## Developer persona
A maintainer who draws architecture diagrams in plain text so they live in version control and render
in any terminal. Knowing that screen-magnifier and forced-colors users exist, they add a `role="img"`
+ `aria-label` transcript and make the art inherit `CanvasText` in forced-colors mode. They keep it
preformatted on purpose: wrapping would scramble the alignment and destroy the picture.

## Element / selector carrying the issue
`figure.diagram pre.ascii` — the ASCII topology diagram (overflows 320px, exempt).

## Exact accessibility mechanism
At 320 CSS px the diagram exceeds the viewport and exposes a horizontal scrollbar. This is two-
dimensional content requiring consistent orientation for understanding — equivalent to a drawn graphic
or a map. SC 1.4.10's exception, and the Understanding doc's explicit "ascii art" example, cover it:
wrapping the lines would shatter the box/arrow alignment and convey nothing. So the horizontal scroll
of this single figure is permitted; all surrounding prose, headings, and links reflow normally. A
screen-reader user is not left behind because the `aria-label` provides an equivalent. PASS.

## Expected ACT-style outcome
**passed** (SC 1.4.10). The overflowing content is ascii art whose meaning would be lost on wrap
(excepted), and only that one section scrolls while the rest of the page reflows.

## Why automated tools miss it
A scanner sees a `<pre>` overflowing 320px — structurally identical to case-01's failing prose block.
No tool can examine the characters and recognize an arrangement of `+ - | >` as a meaningful diagram
(exempt) versus prose that should wrap. The `role="img"`/`aria-label` satisfies a name linter, but
whether the *overflow* is exempt is a read-the-content meaning call — human judgment.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "The presentation of text where the layout has specific meaning, such as code indentation for Python or \"ascii art\" as just two examples, would lose meaning if the layout were not presented correctly. This success criterion does not apply where that meaning would be lost."

**Reference:** Understanding SC 1.4.10 Reflow — exceptions (`wcag-understanding/reflow.html`)
> "Graphics and video are by their nature two-dimensional. Slicing up a graphic (photograph, drawing, graph, etc.) and stacking the blocks would make the graphic difficult to understand, if not rendering it unintelligible."
