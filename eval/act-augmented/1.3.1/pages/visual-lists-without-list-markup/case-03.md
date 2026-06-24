# case-03 — Coffee-cupping glossary: term/definition pairs coded as alternating `<p>`

## Scenario
A roaster's field handbook presents a "Glossary of Cupping Terms": six tasting terms, each with a definition. Visually it is a classic description list — a bold term on one line, its indented definition on the next. In the markup each term is a `<p class="term">` (bolded by CSS) and each definition is a separate `<p class="def">` (indented by CSS). There is no `<dl>`, `<dt>`, or `<dd>`. The correct type for term/description pairs is a description list.

## Attribute tuple
- **content-domain:** food & beverage / professional training reference
- **UI-component / pattern:** glossary / description (definition) list
- **host-language construct:** alternating `<p class="term">` (bold) and `<p class="def">` (indented) paragraphs
- **locale / i18n:** en-US
- **failure-mechanism:** a visually apparent description list with NO `<dl>` — term↔definition pairing relationship is not programmatically expressed (TT 10.D, type = description list)

## Developer persona
A lead roaster wrote the handbook in a WYSIWYG page editor. To make a glossary they bolded each term line and left the definition line plain, nudging it over with the indent button. The editor emitted a flat run of `<p>` elements. They assumed "looks like a glossary" was good enough and never knew `<dl>`/`<dt>`/`<dd>` existed.

## Element / selector carrying the issue
The alternating `p.term` / `p.def` paragraph pairs (the whole glossary block).

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user sees term/definition pairs and grasps the pairing relationship from bolding + indentation + proximity.
- A screen reader reads twelve independent paragraphs in a row. Nothing tells it that "Body" is a *term* and the next paragraph is *its definition*. There is no `dl` group, so the user cannot navigate term-by-term, cannot perceive that the paragraphs come in bound pairs, and the bold/indent presentation that conveys the relationship to sighted users is entirely lost (CSS styling is not exposed to AT).
- Per TT 10.D, a visually apparent list of terms+descriptions must be a `dl`; coding it as plain paragraphs fails both the "is a list" and the "correct type" checks.

Verified with Puppeteer: the DOM has 0 `<dl>`/`<dt>`/`<dd>` and 0 list roles of any kind; the accessibility tree exposes only generic paragraph text, while the screenshot shows six visually paired term/definition entries.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — a visually apparent description list is not programmatically a `dl`; TT 10.D type = description list).

## Why automated tools miss it
A sequence of `<p>` elements with bold and indentation styling is valid HTML and triggers no axe/WAVE/Lighthouse rule — there is no automated check that pairs alternating paragraphs and concludes "this is a term/description list that should be a `<dl>`." Recognizing the term↔definition relationship from visual grouping and meaning, and that `<dl>` is the right structure, is human semantic judgment.

## Citation
> "**Description list** (`dl`) — groups terms with their descriptions."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 10.D — How to Test)

> "A simple text document is formatted with double blank lines before titles, asterisks to indicate list items and other standard formatting conventions so that its structure can be programmatically determined."
— wcag-understanding/info-and-relationships.html (Examples — A text document)
