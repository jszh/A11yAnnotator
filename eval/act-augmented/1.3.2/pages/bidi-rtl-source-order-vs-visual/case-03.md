# case-03 — Museum catalogue: Arabic exhibit name and its acquisition year transposed in source

## Scenario
An English (LTR) museum collections-management catalogue shows a gallery caption that names an
Arabic exhibit ("الأرشيف", al-Arshif / "the Archive") and its acquisition year. The intended,
meaningful caption is `On loan from the الأرشيف 2023 collection, restored last spring.` In
natural source order the bidi algorithm rendered the year "2023" to the visual left of the
Arabic word, which the cataloguer felt put the number "on the wrong side." Instead of isolating
the Arabic run with `<bdi>`, they "fixed the visual" by physically swapping the two tokens in
the source (`… the 2023 الأرشيف collection …`). The rendered line is byte-for-byte identical on
screen — but the logical/source order is now scrambled.

## Attribute tuple
- **content-domain:** cultural-heritage / museum collections CMS
- **UI-component / pattern:** exhibit catalogue caption card
- **host-language construct:** LTR English paragraph with an embedded Arabic name + adjacent year digits, NO `<bdi>`
- **locale / i18n:** en (English base, `lang="en"`) with an embedded RTL Arabic run
- **failure-mechanism:** G57 source-character reordering — two adjacent tokens (Arabic name + year) transposed in the content stream so the bidi algorithm yields the desired visual, exposing the wrong logical order

## Developer persona
A museum cataloguer entering records in a CMS rich-text field. The exhibit name was pasted from
an Arabic finding-aid; when the year landed on the "wrong side" of the name, they dragged the
year token in front of the Arabic word in the editor until the caption looked right — a visual
edit that silently transposed the underlying text nodes.

## Element / selector carrying the issue
`.card .caption` in Gallery 4 (the Islamic Ceramics caption).

## Exact accessibility mechanism (what AT experiences, why it fails)
- VERIFIED with a Puppeteer rendering harness (per-character client-rect sort): the source
  `… the 2023 الأرشيف collection …` produces a screen layout identical to the layout produced
  by the logically-correct source `… the الأرشيف 2023 collection …` (the bidi algorithm
  reorders the year+name run for display either way).
  - LOGICAL (DOM/source order, what a screen reader reads): `On loan from the 2023 الأرشيف collection, restored last spring.`
  - VISUAL (laid out on screen): indistinguishable from the correct caption.
- A sighted reader sees a correct caption.
- A screen reader reads the **logical** order, so it announces the acquisition **year before
  the exhibit name** ("…the two-thousand-twenty-three al-Arshif collection…") — the wrong
  meaningful sequence, while the screen looks perfect.
- Per G57 the fix is `<bdi>` around the Arabic run with the tokens in logical order, not
  transposing them in the byte stream → fail.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — two tokens transposed in the content stream so the programmatic reading
order conveys a different meaning than the visual order).

## Why automated tools miss it
The page is valid `lang="en"` HTML, every attribute is present, and the render is correct —
two visually-identical sources differ only in their logical token order. No linter, axe, WAVE,
or Lighthouse check can tell that the year and the Arabic name were swapped, because doing so
requires reading Arabic, knowing its directionality, and reconstructing the intended meaning to
judge that "year before name" is the wrong sequence.

## Citation
> "Some techniques permit the content to be rendered visually in a meaningful sequence even if this is different from the order in which the content is encoded in the underlying source file."
— wcag-techniques/general/G57.html (Description)

> "A sequence is meaningful if the order of content in the sequence cannot be changed without affecting its meaning."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
