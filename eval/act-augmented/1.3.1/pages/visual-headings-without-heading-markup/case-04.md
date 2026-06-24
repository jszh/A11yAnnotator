# case-04 — Newsletter "view in browser" archive: section headings are styled `<span>` in layout `<td>`

## Scenario
The web-archived ("view in browser") version of an HTML email newsletter, *The Foundry Weekly* #142.
Built the only way email reliably lays out — nested `<table role="presentation">` grids. Each story's
section heading ("Top Story", "Quick Hits", "Tool of the Week", "Community Spotlight", plus the story
title "Desktop CNC prices fall below $900") is a bold, 22px `<span class="sectionhead">` sitting inside
a layout `<td>`. To a sighted reader these are unmistakably the headings that divide the issue into
sections. But there is **no `<h1>`–`<h6>` and no `role="heading"`** in the document. The layout tables
correctly use `role="presentation"` and have no `<th>`/`scope`, so they are *not* mis-marked data
tables — that part passes. The single defect is that the visual section headings carry no heading
semantics.

## Attribute tuple
- **Content domain:** email marketing / newsletter republished to the web
- **UI component / pattern:** table-based email layout with kicker + section headings
- **Host-language construct:** `<span>` (inside a layout `<td>`) styled with `font-size`/`font-weight:bold`
- **Locale / i18n:** en
- **Failure mechanism:** F2 — visual headings rendered as styled spans; heading-free document despite obvious sectioning

## Developer persona
An email-template developer maintains the newsletter in an ESP (email service provider) drag-and-drop
builder. Email clients strip or ignore `<h1>`–`<h6>` styling inconsistently, so the house style is to
*never* use heading tags and instead style every "heading" as a `<span>`/`<td>` with explicit pixel
font sizes for cross-client consistency. The exact same HTML is published as the "view in browser"
web archive, carrying the email-only heading-avoidance habit onto a real web page where it now fails
1.3.1.

## Element / selector carrying the issue
`span.sectionhead` (the four section headings + the lead story title). The `span.kicker` "TOP STORY"
eyebrow is decorative labeling above the title; the load-bearing visual headings are the
`span.sectionhead` lines.

## Exact accessibility mechanism
Each `span.sectionhead` resolves to inline static text (role `generic`) in the accessibility tree,
never a `heading`. A screen-reader user gets an empty headings list and cannot navigate section to
section; they must traverse the entire linearized table to find each story. Note this page is a useful
*contrast* case for TT 14: the tables are correctly presentational (`role="presentation"`, no `<th>`),
so the 14.x table tests pass — the failure is isolated to 10.B (visual heading not programmatically
determinable). The sectioning relationship lives only in font size/weight and the horizontal rules
between blocks.

## Expected ACT-style outcome
**failed** (SC 1.3.1, F2; Trusted Tester 10.B). Multiple visual section headings are present and
apparent; none is programmatically a heading. (The layout tables themselves are correctly presentational
and do not fail 14.x.)

## Why automated tools miss it
The document is well-formed: `role="presentation"` tables (so no "data table missing headers" finding),
valid styled `<span>`s, nothing empty or absent. axe-core/WAVE/Lighthouse have no rule that promotes a
bold styled `<span>` to "should be a heading"; a heading-free page is at most a soft alert. Email-style
markup specifically lacks any `<h*>` for a tool to even order or compare. Recognizing that
"Quick Hits" and "Tool of the Week" are section headings requires reading the rendered visual rhythm of
the newsletter — kicker, big bold title, body copy, divider — a layout-and-meaning judgment no scanner
performs.

## Citation
**Reference:** WCAG Technique F2 — *Failure ... using changes in text presentation to convey information without using the appropriate markup or text* (`wcag-techniques/failures/F2.html`)
> "This failure also applies to images of text that are not enclosed in the appropriate semantic markup."

**Reference:** Trusted Tester v5.1.3 — Test 10.B `1.3.1-heading-determinable` (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
> "Identify all visually apparent headings (often larger/bolded font, extra spacing — though not always). Note the hierarchy/structure of each heading relative to others."
