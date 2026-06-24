# case-02 — Recipe: `flex-direction:row-reverse` renders steps 1-4 but the `<ol>` source order is 4-3-2-1

## Scenario
A recipe blog post, "Brown-Butter Madeleines," presents a numbered Method as four cards. Visually the cards read **1 → 2 → 3 → 4** top to bottom (brown the butter, whisk eggs, fold flour, then bake). They are a real `<ol class="steps">`. But the list is laid out with `flex-direction:row-reverse` + `flex-wrap:wrap-reverse`, which renders the **last** DOM child at the top. So the `<ol>` source order is literally **4, 3, 2, 1** — the bake step is the first list item. Because an ordered list is, by WCAG's own definition, an inherently meaningful sequence, a screen reader announces "list item 1 of 4" on the **bake** step and reads the recipe in a dangerous order: bake the batter before it has been mixed.

## Attribute tuple
- **content-domain:** food / recipe blog
- **UI-component / pattern:** numbered step list (`<ol>`) styled as cards
- **host-language construct:** `<ol>` + `display:flex; flex-direction:row-reverse; flex-wrap:wrap-reverse`
- **locale / i18n:** en, metric/Celsius
- **failure-mechanism:** CSS visual reorder of an *inherently meaningful* sequence (an ordered list) so the linearized order is the reverse of the visual order

## Developer persona
A home-cook blogger copied a "responsive card grid" CSS snippet from an older post that used `flex-direction:row-reverse` to right-align thumbnails. Pasted onto the recipe steps it happens to wrap into a single column, and the reversed main axis flips the rendered order. The visible numerals (`<span class="n">`) were typed by hand to read 1-4 top-to-bottom, so the page *looks* perfect; the blogger never inspected the underlying `<ol>` order.

## Element / selector carrying the issue
`ol.steps` (the `flex-direction:row-reverse` / `wrap-reverse` container). The individual `li` source order is 4→3→2→1; the hand-typed `.n` badges mask the reversal visually.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted user:** reads steps 1, 2, 3, 4 in the correct cooking order.
- **Screen-reader user:** the screen reader follows DOM order and treats the `<ol>` as a meaningful sequence, announcing "list, 4 items; item 1 of 4: **Pipe the batter into a buttered madeleine mold and bake at 200 C…**". The cook is told to bake first, then (item 4 of 4) to "Brown the butter… let it cool" last. Following the announced order produces an inedible result. The hand-typed "4/3/2/1" badges are read *with* the text, so the listener also hears a list whose item numbers count **down** while the list position counts up — incoherent.
- Verified with Puppeteer: visual order (top→bottom) is `1, 2, 3, 4`; DOM/linearized order is `4, 3, 2, 1` — exact reverse.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — the sequence affects meaning, and the programmatically-determined order is the reverse of the correct reading order).

## Why automated tools miss it
The `<ol>` is valid; every `<li>` has text; there are no empty nodes, missing labels, or contrast issues, so axe/WAVE/Lighthouse pass it. Tools do not compute that `flex-direction:row-reverse` has inverted the visual order relative to source, and even if they detected the geometric mismatch they could not know that *these particular* steps must be performed in order (a recipe), versus an unordered set where order is irrelevant. Recognizing that reversing the sequence makes the instructions dangerous is human comprehension of the content's meaning.

## Citation
> "A sequence is *meaningful* if the order of content in the sequence cannot be changed without affecting its meaning."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)

> "The semantics of some elements define whether or not their content is a meaningful sequence. For instance, in HTML, text is always a meaningful sequence. Tables and ordered lists are meaningful sequences, but unordered lists are not."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
