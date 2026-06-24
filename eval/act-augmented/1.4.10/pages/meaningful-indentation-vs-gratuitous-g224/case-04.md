# case-04 — Nested list dressed as the G224 pattern but item text is locked to one line (FAIL)

## Scenario
A legal-research product's regulatory "issue tree" sidebar shows a deep 42 CFR outline
(Title > Chapter > Part > Section > Subsection) as real semantic nested `<ul>`/`<li>`. The hierarchy's
meaning genuinely depends on visible indentation (you must see that `§ 482.13(a)` sits inside `§ 482.13`
inside `Part 482`), so flattening would lose parent/child relationships and the container is allowed to
scroll horizontally to bring a level into view. The author copied the *scaffolding* of the G224 nested-
list technique — semantic list, `overflow-x:auto` container, a media query that reduces per-level indent
— but set `white-space:nowrap` on every list-item label. Each item is a long regulatory sentence, so at
320 CSS px the item TEXT runs off the right edge and will not wrap.

## Attribute tuple
- **Content domain:** legal / regulatory research (42 CFR public-health regulations)
- **UI component / pattern:** tree-style nested navigation list (real `<ul>`/`<li>`, not `<pre>`)
- **Host-language construct:** nested `<ul>` + `overflow-x:auto` container + `white-space:nowrap` labels + indent media query
- **Locale / i18n:** en (US Code citation style)
- **Failure mechanism:** counterfeit-G224 — meaningful indentation is preserved, but the individual list-item prose is forced non-wrapping so item text needs two-dimensional scrolling to read

## Developer persona
A front-end developer who skimmed the G224 working example and reproduced its *visible* parts: a
horizontally-scrollable container, nested semantic lists, and a media query that trims indentation at
narrow widths. They added `white-space:nowrap` to the labels so citation numbers like `§ 482.13(a)`
would not break mid-citation — and never noticed that the same rule also pins the long heading prose to
one physical line. They left a `min-width` "safety net" comment from a tutorial but never paired it with
any wrapping. The page looks textbook-conforming on a wide monitor.

## Element / selector carrying the issue
`.issuetree li > .node` — the list-item labels, set `white-space:nowrap`. The nesting/indent is fine;
the non-wrapping of the item prose is the defect.

## Exact accessibility mechanism
At 320 CSS px the `.issuetree` container scrolls horizontally, so a low-vision user CAN bring a nested
level into view — that half mimics the G224 pass arrangement. But because each `.node` is
`white-space:nowrap`, the moment a level is in view its items' text still extends past the right edge:
the reader must scroll the row left-and-right to read each provision sentence. G224's list procedure
defines the conforming arrangement as: once a nested list is visible, ONLY vertical scrolling is needed
to read the items' content. This page denies exactly that. The indentation (which level contains which)
is meaningful and may be preserved, but the wrapping of the regulatory prose inside each item carries no
meaning — these are sentences, not Python or ascii-art — so the per-item text must reflow, and it does
not. FAIL.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The item-label text should reflow (drop `white-space:nowrap`, or apply
`overflow-wrap` / `white-space:normal` with a per-item width) so that once a nested level is in view only
vertical scrolling is needed; the meaningful indentation can stay.

## Why automated tools miss it
Byte-for-byte this is the conforming case: a semantic nested `<ul>` inside an `overflow-x:auto` container
with an indentation media query and a `min-width` comment. A scanner sees a deep list in a horizontally-
scrollable box and cannot tell that `white-space:nowrap` makes the item TEXT — not just the level indent
— the thing forcing left-right reading, nor that wrapping the prose would lose nothing while flattening
the hierarchy would lose meaning. Distinguishing this counterfeit from the genuine G224 pass arrangement
(case-02's PASS pattern) requires reading the items and judging whether their text can reflow — human
judgment.

## Citation
**Reference:** WCAG Technique G224 (`wcag-techniques/general/G224.html`)
> "While it is important for the individual list item text to reflow, the list hierarchy would suffer if flattened so that all content would fit within a 320 CSS pixel wide viewport."

**Reference:** WCAG Technique G224 — list procedure conforming arrangement (`wcag-techniques/general/G224.html`)
> "At this breakpoint, each nested list level can be horizontally scrolled into view, and once a nested list is visible within the viewport, only vertical scrolling will be necessary to read the content of the nested list's items."

**Reference:** Understanding SC 1.4.10 Reflow — "Preformatted text conveys meaning" (`wcag-understanding/reflow.html`)
> "However, this is not the case for most other instances of text where text wrapping can be applied without loss of meaning."
