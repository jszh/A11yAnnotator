# case-01 — Recipe page where the "Nutrition" section heading is a lone icon-font glyph `<h2>` (PUA codepoint U+F080)

## Scenario
A seasonal-cooking recipe page ("Slow-roast harissa carrots with whipped feta" on *Ember &
Root*) is organised into four sections: **About this dish**, **Ingredients**, **Method**, and
a nutrition panel. The author built every section title from a design-kit icon set, so each
heading carries a small olive **bar-chart icon**. The first three pair that icon (as a
decorative accent) with real words; the fourth heading is `<h2><span class="ico">&#xf080;</span></h2>`
— its *only* content is the icon-font glyph itself, the Private Use Area codepoint **U+F080**.
A sighted reader sees a bar-chart emblem above a nutrition table and infers "nutrition"; a
screen-reader user gets a heading whose name is an unpronounceable private-use character.

## Attribute tuple
- **content-domain**: food & cooking — seasonal recipe / editorial blog
- **UI-component/pattern**: long-form recipe (ingredients list, numbered method, nutrition
  table) with `<section aria-labelledby>` blocks whose titles use an icon set
- **host-language construct**: `<h2>` whose only content is a literal icon-font glyph — the
  Private Use codepoint U+F080 as a real (non-whitespace) text node — referenced by `aria-labelledby`
- **locale/i18n**: en-GB (metric quantities, kcal)
- **failure-mechanism**: icon-glyph-only heading — present, visible, exposed, and with a
  technically NON-EMPTY accessible name (the PUA character), yet that name is a meaningless
  private-use codepoint, so the heading carries no section name

## Developer persona
A food blogger themed a recipe template whose section titles use an icon font. For three
sections they typed the icon glyph and then the words; for the nutrition block they pasted the
bar-chart glyph as a standalone "emblem" heading and moved straight on to the data table,
never typing the word "Nutrition" after it. In the editor preview the icon looked like a tidy
section marker and the publish lint (which only flags *empty* `<h2></h2>` elements) passed —
because the heading is not empty, it contains the glyph — so the wordless heading shipped.

## Element / selector carrying the issue
- FAIL: `h2#h-nutri` — accessible name is the single character `U+F080` (an icon-font glyph in
  the Private Use Area), role `heading`, level 2, visible and not ignored. The section it
  introduces (the nutrition table + serving notes) has no real name.

## Exact accessibility mechanism
Verified in Chromium's accessibility tree (CDP `Accessibility.getPartialAXTree`): `#h-nutri`
computes to `role="heading"`, `name=""` (length 1, non-empty, not whitespace),
`ignored=false`. The three sibling headings compute their real names — "About this dish",
"Ingredients", "Method" — because their icon accent is `aria-hidden="true"` and excluded; only
the nutrition heading's glyph is the name. U+F080 is an **unassigned Private Use Area**
codepoint: it has no Unicode name and no CLDR label, so a screen reader has nothing
pronounceable to announce for it. A heading-list navigation reads the outline as:

> "About this dish, heading level 2 · Ingredients, heading level 2 · Method, heading level 2 ·
> **heading, level 2** (with no spoken name, or a literal 'private use F080' / a fallback box)."

The blind cook gets no "mental handle" for the nutrition section — the one section they may be
scanning for (allergens, calories, salt) is the unnamed one. The bar-chart icon that signals
"nutrition" to a sighted reader lives entirely in a font glyph that assistive technology
cannot name. The heading is present and exposed (not `display:none`, not `aria-hidden`), so
this is the present-but-nameless failure mode — and, unlike a literal empty heading, its name
is genuinely non-empty, which is what makes it escape lint.

## Expected ACT-style outcome
**failed** — a section heading is present and exposed but, holding only an icon-font glyph,
conveys no section name.

## Why automated tools miss it
The `<h2>` contains a real, non-whitespace text node (U+F080), so axe-core's `empty-heading`
rule does NOT fire. axe computes the accessible name with `commons.text.sanitize`, i.e.
`.replace(/\s+/g,' ').trim()`; U+F080 is not `\s`, so the sanitized name is the single
character U+F080 (length 1, non-empty). Empirically confirmed: running axe-core 4.x over this
page (`empty-heading`, `heading-order`, `page-has-heading-one`) yields **zero violations and
zero incomplete results**. (This is precisely why a lone `&nbsp;`, U+00A0, is NOT used here —
U+00A0 *is* `\s`, so it would collapse to `""` and trip `empty-heading`; an NBSP heading is a
lint catch, an icon-glyph heading is not.) WAVE and Lighthouse likewise see "a heading with
text content" and report nothing, and no checker performs OCR on, or attaches semantics to, a
Private Use codepoint. Deciding that a non-empty heading whose name is an icon glyph names
nothing is a human visual/semantic judgment.

## Citation
> **WCAG 2.2 Understanding — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content, facilitates navigation within the content, and
> provides mental 'handles' that aid in comprehension of the content. Other page elements may
> complement headings to improve presentation (e.g., horizontal rules and boxes), but visual
> presentation is not sufficient to identify document sections."

> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."

> **WCAG Techniques — G141: Organizing a page using headings**
> "The objective of this technique is to ensure that sections have headings that identify them."
