# case-01 — Article byline & dateline bumped to `<h3>`/`<h4>` for size (fabricated outline)

## Scenario
A long-form editorial article ("The Quiet Collapse of the Local Newsroom") on a nonprofit
news site. Between the `<h1>` article title and the abstract, the byline
("By Marguerite Adler and Tomas Vance") is marked up as an `<h3>` and the dateline
("Published March 14, 2026 · 11 min read") as an `<h4>` — purely so they render larger and
bolder than body text. Neither begins a section. The genuine sections ("Abstract", "How the
cuts began", "What readers lost") are `<h2>`. The result is a fabricated heading outline in
which an `<h3>` and `<h4>` sit *below* the title as if they were sub- and sub-sub-sections,
but they contain only author names and a date.

## Attribute tuple
- **content-domain:** news / long-form editorial
- **UI-component/pattern:** article byline + dateline block
- **host-language construct:** `<h3>` / `<h4>` heading elements used for font sizing
- **locale/i18n:** en (US)
- **failure-mechanism:** heading markup asserting a sectioning relationship that does not
  exist (F43, "a heading used only for visual effect")

## Developer persona
A staff editor wrote the article in the CMS's rich-text (WYSIWYG) editor. To make the byline
and date stand out under the headline, they highlighted each line and picked "Heading 3" and
"Heading 4" from the paragraph-style dropdown — the same dropdown they use for real section
headings — because those styles happened to give the bold/sized look they wanted. They never
saw the document outline a screen reader builds; the visual result looked right, so they
shipped it.

## Element / selector carrying the issue
`article > h3` (the byline) and `article > h4` (the dateline) — `main article h3:first-of-type`
and the immediately following `h4`.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user navigating by heading (NVDA/JAWS `H` key, VoiceOver rotor "Headings")
hears the outline: "heading level 1, The Quiet Collapse of the Local Newsroom; heading level
3, By Marguerite Adler and Tomas Vance; heading level 4, Published March 14 2026 11 min read;
heading level 2, Abstract…". The user reasonably expects each heading to introduce a block of
related content. Landing on the level-3 "heading" they find only two author names — no section
— and on the level-4 "heading" only a date. The markup asserts that the byline is a subsection
of the article and the date a sub-subsection of the byline; that relationship is false. It
also corrupts the navigable structure: the real first section ("Abstract") is announced as
level 2 *after* a level 3 and 4, so the outline implies the abstract is a sibling of the title
rather than the first real division. Per F43, structural markup (headings) is being used for a
presentational effect while indicating relationships that do not exist in the content.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Every heading is syntactically valid: the elements are real `<h1>`–`<h4>`, none is empty, and
the only level transitions are h1→h3 (a *warning* at most in axe, never a hard failure) and
h3→h4 (perfectly monotonic, no skip). axe-core's `heading-order` and Lighthouse's heading
audit check for *skipped levels*, not for whether a heading's text actually introduces a
section. WAVE will report the headings as present and structurally fine. No automated tool can
read "By Marguerite Adler and Tomas Vance" and infer "this is a byline, which begins no
section, so heading markup misrepresents it" — that is a semantic reading of the content, the
exact human judgment F43 calls for.

## Citation
> **WCAG Techniques, F43 — "Using heading elements for presentational effect":**
> "However, the `h3` and `h4` elements between the title and the abstract are used only for
> visual effect — to control the fonts used to display the authors' names and the date."

(Verbatim from `wcag-techniques/failures/F43.html`. This page reproduces F43's own canonical
failing pattern: byline + date promoted to headings under the title for sizing.)

> **Trusted Tester v5.1.3, Test 10.B note:**
> "content that is not a visual heading should not have a role of heading (e.g., don't use
> heading markup for emphasis)."

(Verbatim from `refs/trusted-tester/sc-1.3.1-info-and-relationships.md`. The byline/date are
emphasised text, not visual headings introducing sections, so heading markup is misused.)
