# case-01 — Library announcement prose mis-rendered into non-wrapping `<pre>` code blocks

## Scenario
A public-library blog post ("Summer Reading Program 2026"). The author drafted ordinary
multi-paragraph announcement text. Because the source paragraphs were indented four spaces
(pasted from an indented email body), the Markdown renderer treated each paragraph as an
*indented code block* and emitted `<pre><code>...</code></pre>`. The renderer's stock CSS gives
`<pre>` `white-space: pre` + `overflow-x: auto`, so each paragraph is one physical line that runs
hundreds of CSS pixels off the right edge and will not wrap.

## Attribute tuple
- **Content domain:** public library / civic services blog
- **UI component / pattern:** Markdown-rendered article body, code-block (`<pre><code>`) styling
- **Host-language construct:** `<pre><code>` with `white-space:pre; overflow-x:auto`
- **Locale / i18n:** en
- **Failure mechanism:** gratuitous non-wrapping — prose whose layout carries no meaning forced into a non-reflowing preformatted block (the "must reflow" side of the G224 line)

## Developer persona
A youth-services librarian, not a developer, wrote the post in a CMS Markdown editor. They pasted
the body from an email where the paragraphs happened to be indented. They never saw a code block in
the preview pane on their wide desktop monitor (the dark box just looked like a "styled quote"), and
nobody tested the post at a zoomed-in / narrow width. The mistake is invisible at desktop width and
only bites a low-vision reader at 320px.

## Element / selector carrying the issue
`article pre` (the three `<pre><code>` paragraph blocks). All three are prose.

## Exact accessibility mechanism
At a 320 CSS px viewport, each `<pre>` keeps its content on one unbreakable line and exposes a
horizontal scrollbar. A low-vision user who has zoomed to reach the 320px viewport must now scroll
the text block left-and-right to read every single sentence — exactly the two-dimensional scrolling
SC 1.4.10 exists to prevent. There is no code, indentation hierarchy, or ascii layout in the block:
nothing would be lost by wrapping. The Understanding "Preformatted text conveys meaning" exception
therefore does NOT apply, so the content must reflow. It does not. FAIL.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The prose should be normal wrapping `<p>` text (or the `<pre>` should be given
`white-space: pre-wrap`); as authored it forces horizontal scrolling to read meaningless-layout text.

## Why automated tools miss it
The markup is semantically *correct*: `<pre><code>` is the right element for preformatted text, so no
linter flags it. axe-core / WAVE / Lighthouse have no rule that renders the page at 320px and computes
horizontal overflow, and even a hypothetical overflow detector cannot read the bytes inside `<pre>`
and decide that this is prose with no meaningful layout (must wrap) rather than Python or ascii-art
(exempt). That read-the-content judgment is the whole 1.4.10 exception test.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "The presentation of text where the layout has specific meaning, such as code indentation for Python or \"ascii art\" as just two examples, would lose meaning if the layout were not presented correctly. This success criterion does not apply where that meaning would be lost. However, this is not the case for most other instances of text where text wrapping can be applied without loss of meaning."

**Reference:** WCAG Technique G224 (`wcag-techniques/general/G224.html`)
> "Or, for code where non-wrapping lines are not essential, the code wraps or a mechanism is provided to allow line wrapping."
