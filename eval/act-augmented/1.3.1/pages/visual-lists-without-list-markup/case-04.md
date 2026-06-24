# case-04 — Course outline: two-level hierarchy flattened into one `<ul>`

## Scenario
A course syllabus shows an "Outline of Topics" for Unit 1 of a cell-biology class: three main topics (square bullets, bold) each followed by two or three indented sub-topics (dash bullets, lighter weight). Visually it is a clear two-level outline. Programmatically it is a **single flat `<ul>`**: all eleven items are direct siblings (`<li>`), and the visual nesting is faked with CSS classes (`lvl1` / `lvl2`) that change the bullet glyph and left-padding. There is no nested `<ul>` inside the parent `<li>` elements, so the sub-topic-belongs-to-topic grouping is not in the markup.

## Attribute tuple
- **content-domain:** higher-education / academic syllabus
- **UI-component / pattern:** multi-level nested outline / hierarchical list
- **host-language construct:** one flat `<ul>` with `lvl1`/`lvl2` CSS classes (`::before` glyph + `padding-left`) instead of nested `<ul>`
- **locale / i18n:** en-US
- **failure-mechanism:** a list that IS coded as a list, but whose programmatic nesting is FLATTENED — the visual hierarchy is not consistent with the programmatic list relationships (TT 10.D, second PASS condition)

## Developer persona
A teaching assistant pasted the outline from a Word document into the LMS rich-text editor. Word's "Increase Indent" produced sub-items that the editor flattened into the same `<ul>` with extra indentation styling rather than a true nested list. The visual indentation looked right, so nobody noticed the hierarchy never made it into the markup.

## Element / selector carrying the issue
`ul.outline` — a single list whose `li.lvl2` items should be inside a nested `<ul>` within their parent `li.lvl1`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user sees three top-level topics each owning a set of indented sub-topics, and reads the parent/child grouping from the indentation and bullet change.
- A screen reader announces "list, 11 items" and reads eleven peers at the same level. It reports no nesting depth, never says "list, 3 items" for the parents with sub-lists inside, and gives no signal that "Phospholipid bilayer…" is a child of "Membrane structure and transport." The CSS that creates the visual hierarchy (padding, `::before` glyphs) is invisible to AT.
- Per TT 10.D PASS condition 2, the programmatic list relationships (nesting/hierarchy) must be consistent with the visual relationships. A flat list with a visual two-level hierarchy violates this → fail.

Verified with Puppeteer: the DOM has exactly 1 `<ul>` with 11 `<li>` all at the same depth (no nested `<ul>`); the accessibility tree shows a single `list` with 11 sibling `listitem`s and no nesting, while the screenshot shows a clear two-level outline.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — programmatic list nesting is flattened relative to the visually apparent hierarchy; TT 10.D PASS condition 2).

## Why automated tools miss it
A flat `<ul>` of `<li>` elements is structurally valid; axe/WAVE/Lighthouse have no rule asserting "these indented items should be a nested sub-list." Detecting the failure requires comparing the *visual* indentation hierarchy (rendered via CSS padding and bullet glyphs) against the *programmatic* nesting depth and judging that the markup loses a grouping the visuals convey — a visual-to-semantic comparison automated tools cannot make.

## Citation
> "All programmatic list relationships (nesting, hierarchies) are consistent with the list relationships presented visually."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 10.D — Evaluate Results, condition 2)

> "The objective of this technique is to describe a failure that occurs when structural markup is used to achieve a presentational effect, but indicates relationships that do not exist in the content. This is disorienting to users who are depending on those relationships to navigate the content or to understand the relationship of one piece of the content to another."
— wcag-techniques/failures/F43.html (Description)
