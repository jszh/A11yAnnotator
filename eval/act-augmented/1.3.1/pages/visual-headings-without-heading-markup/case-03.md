# case-03 — Word-exported policy: numbered section headings are styled `<p><span>`, not `<h*>`

## Scenario
An institutional "Open Data Policy" document authored in a word processor and pasted into a CMS
rich-text field. The export emitted each section heading — "1. Scope", "2. Definitions",
"2.1 Research data", "2.2 Open access", "3. Data-Sharing Principles", "4. Exceptions and Embargoes",
"5. Review" — as a `<p class="MsoHeading1/2">` whose run is wrapped in a `<span>` carrying inline
`font-size`/`font-weight:bold`. Visually it is a clean, numbered, two-level outline; a sighted reader
instantly reads the hierarchy (1, 2, then 2.1/2.2 indented, etc.). But there is **no `<h1>`–`<h6>`
and no `role="heading"`** anywhere — every "heading" is a styled paragraph. The document's title is
likewise a centered styled `p.MsoTitle`.

## Attribute tuple
- **Content domain:** governance / policy / legal documentation
- **UI component / pattern:** numbered multi-level document outline (1, 2, 2.1, 2.2 …)
- **Host-language construct:** `<p>` with class + `<span>` carrying **inline** `font-size`/`font-weight` (word-processor export artifact)
- **Locale / i18n:** en
- **Failure mechanism:** F2 — heading hierarchy conveyed by inline-styled spans + numeric prefixes; no heading elements

## Developer persona
A research-governance administrator (not a developer) wrote the policy in Microsoft Word using Word's
built-in "Heading 1"/"Heading 2" styles. They copy-pasted it straight into the CMS's WYSIWYG editor.
The CMS paste filter preserved the visual `Mso*` class names and inline font runs but did **not**
convert Word's heading *styles* into HTML `<h*>` elements — a classic round-trip loss. The author saw
the headings look correct on screen and published it; nobody inspected the generated markup.

## Element / selector carrying the issue
`p.MsoHeading1 > span` and `p.MsoHeading2 > span` — the seven numbered section/sub-section headings,
plus `p.MsoTitle > span` (the document title). The numbering ("2.1", "2.2") additionally encodes a
heading *level* relationship that is lost programmatically.

## Exact accessibility mechanism
Every heading run resolves in the accessibility tree to static text inside a `paragraph`, never a
`heading` with a level. A screen-reader user gets an empty headings list and cannot perceive the
1 → 2 → 2.1 → 2.2 nesting that the visual numbering and indentation make obvious; they must read the
whole policy linearly to reconstruct its structure. Beyond TT 10.B (visual heading not programmatically
determinable), the numeric outline means the *levels* are lost too (TT 10.C would have nothing to
evaluate because no programmatic heading exists). The relationship is conveyed purely by presentation
(font size, bold, indentation, numeric prefix) — exactly the loss SC 1.3.1 targets.

## Expected ACT-style outcome
**failed** (SC 1.3.1, F2; Trusted Tester 10.B). A multi-level visual heading outline is present and
apparent; none of it is programmatically a heading.

## Why automated tools miss it
The markup is fully well-formed: valid `<p>` and `<span>` elements, valid inline `style`/`font-size`
declarations, nothing empty or missing. axe-core has no rule that converts "styled bold paragraph"
into "should be a heading"; `page-has-heading-one` does not hard-fail a heading-free page; WAVE at most
raises a "No headings" alert. Crucially, the inline styles look like ordinary text formatting, so a
linter cannot distinguish a deliberately-emphasized phrase from a section heading. Deciding that
"3. Data-Sharing Principles" is a heading — and that "2.1"/"2.2" are its sub-levels — requires reading
the document and interpreting the numbering and visual weight, a human comprehension task.

## Citation
**Reference:** WCAG Technique F2 — *Failure ... using changes in text presentation to convey information without using the appropriate markup* (`wcag-techniques/failures/F2.html`)
> "This document describes a failure that occurs when a change in the appearance of text conveys meaning without using appropriate semantic markup."

**Reference:** WCAG General Technique G115 — *Using semantic elements to mark up structure* (`wcag-techniques/general/G115.html`)
> "In other words, the elements are used according to their meaning, not because of the way they appear visually."
