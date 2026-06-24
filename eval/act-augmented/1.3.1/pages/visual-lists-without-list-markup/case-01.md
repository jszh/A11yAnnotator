# case-01 — Composter feature list: six "•" glyphs in one `<br>`-separated paragraph

## Scenario
A product marketing page for the "Verdant" countertop composter shows a six-item bulleted feature list under "Why families love the Verdant." Each line begins with a "•" bullet glyph. Visually it is an unmistakable unordered list. In the markup, all six lines live inside a single `<p class="features">`; each "bullet" is a literal `&bull;` (U+2022) character and the line breaks are `<br>` elements. There is no `<ul>`, no `<li>`, no `role="list"`.

## Attribute tuple
- **content-domain:** consumer-product / e-commerce marketing page
- **UI-component / pattern:** feature/benefit bullet list
- **host-language construct:** single `<p>` with literal `&bull;` glyphs + `<br>` line breaks
- **locale / i18n:** en-US
- **failure-mechanism:** visually-apparent unordered list with NO programmatic list (F2 — visual presentation conveys list structure without the appropriate markup)

## Developer persona
A small-brand marketing manager wrote the feature copy in their CMS's rich-text field. They wanted bullets but disliked the theme's default `<ul>` spacing, so they typed the bullet characters by hand and pressed Shift+Enter between lines (which the editor stores as `<br>`). The published HTML is one `<p>` — exactly what most WYSIWYG editors emit for that authoring gesture.

## Element / selector carrying the issue
`p.features` (the single paragraph holding all six "bulleted" lines).

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user sees six discrete bulleted items and instantly grasps "list, 6 items."
- A screen reader encounters one paragraph. It announces a continuous run of text; the "•" characters are spoken (e.g. "bullet" or "black small square" depending on the verbosity setting) or silently skipped, and the `<br>` breaks produce only line pauses, not item boundaries.
- The user gets **no** "list, 6 items" announcement, cannot use list-navigation commands (jump by item, "go to list"), and loses the count and the grouping relationship that the visual bullets convey.
- Per TT 10.D this is a visually apparent unordered list that is not programmatically identified as a list of its type → fail.

Verified with Puppeteer: the page contains 0 `<ul>`/`<ol>`/`<li>`/`role="list"` nodes, and the rendered accessibility tree contains **no** list or listitem roles, while the screenshot shows six bulleted lines.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — a visually apparent list is not programmatically a list; TT 10.D).

## Why automated tools miss it
There is no ACT rule, and no axe/WAVE/Lighthouse check, that says "this paragraph looks like a list, so it must be `<ul>`." A `<p>` containing `&bull;` and `<br>` is perfectly valid HTML and trips no linter. Recognizing that the bullet glyphs plus stacked lines visually constitute a six-item list — and that the markup fails to express that list relationship — requires human visual and semantic judgment about meaning, which static rules cannot perform.

## Citation
> "list items are preceded by a bullet and perhaps indented"
— wcag-understanding/info-and-relationships.html (Intent of Info and Relationships)

> "Having these structures and these relationships programmatically determined or available in text ensures that information important for comprehension will be perceivable to all."
— wcag-understanding/info-and-relationships.html (Intent of Info and Relationships)

> "1. All content with the visual appearance of a list is defined programmatically as a list, by type:
>    a. Unordered list (with/without bullets) → `ul`; b. Ordered list → `ol`; c. Terms+descriptions → `dl`."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 10.D — Evaluate Results)
