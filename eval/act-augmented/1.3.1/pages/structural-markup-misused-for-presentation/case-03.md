# case-03 — Every recipe ingredient marked up as its own `<h5>` (fabricated outline)

## Scenario
A food-blog recipe page ("Brown-Butter Banana Bread"). Under the real `<h2>` "Ingredients"
section, each of the six ingredient lines is marked up as a separate `<h5>` so that they all
render in a uniform bold serif. None of these `<h5>` elements begins a section — each is an
ingredient, i.e. a list item. The page therefore fabricates a six-deep run of `<h5>`
"subsections" that reflect no actual section structure, flooding the heading outline with
non-heading content. (As a secondary defect, the visually apparent list of ingredients is not
coded as a `<ul>`.)

## Attribute tuple
- **content-domain:** restaurant menu & ordering / recipe content
- **UI-component/pattern:** recipe ingredients list
- **host-language construct:** repeated sibling `<h5>` headings (heading levels skipped from h2)
- **locale/i18n:** en (US)
- **failure-mechanism:** structural (heading) markup fabricating an outline with relationships
  that do not exist (F43, "fabricates a misleading heading outline")

## Developer persona
A solo food blogger writes posts in the blog platform's block editor. They liked how the
"Heading 5" style rendered ingredients — uniform, bold, slightly boxed — so they applied it to
each ingredient line one by one. They never used the list block, and they have never navigated
their own site by heading, so the avalanche of `<h5>` items in the heading rotor is invisible
to them.

## Element / selector carrying the issue
`main h5` — the six sibling ingredient headings ("2 cups all-purpose flour" … "2 large eggs,
room temperature"), all direct children of the article between the `<h2>` "Ingredients" and the
`<h2>` "Method".

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user pulling up the headings list (or pressing `H`) to skim the recipe's
structure gets: "Brown-Butter Banana Bread (h1); Ingredients (h2); 2 cups all-purpose flour
(h5); 1 tsp baking soda (h5); 1/2 tsp fine sea salt (h5); … Method (h2); …". Every ingredient
is announced as a heading-level-5 *section heading*, asserting that each ingredient introduces
a subsection nested under "Ingredients" — a relationship that does not exist; the ingredients
are peers in a single list, not nested sections. The fabricated outline makes the heading rotor
useless for navigation (six non-headings between two real sections) and misrepresents flat
list items as a hierarchy. Per F43 the heading markup is used for visual effect while
indicating sectioning relationships absent from the content; per TT Test 10.D the ingredients
are also a visually apparent list that is not programmatically a list.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Each `<h5>` is valid and non-empty. The only structural anomaly is the h2→h5 jump, which
axe-core and Lighthouse treat as a heading-order *warning* (or do not flag at all), never a
hard 1.3.1 failure; six repeated h5 siblings violate no rule. There is no automated check that
recognises "2 cups all-purpose flour" as an ingredient/list item rather than a section title —
that requires understanding the recipe domain and that ingredients are list members. WAVE will
simply report a deep heading structure. Only a human reading the words can see the outline is
fabricated.

## Citation
> **WCAG Techniques, F43 — Description:**
> "The objective of this technique is to describe a failure that occurs when structural markup
> is used to achieve a presentational effect, but indicates relationships that do not exist in
> the content. This is disorienting to users who are depending on those relationships to
> navigate the content."

(Verbatim from `wcag-techniques/failures/F43.html`. The six `<h5>` ingredients indicate
subsection relationships that do not exist, disorienting heading-navigation users.)

> **Trusted Tester v5.1.3, Test 10.D note:**
> "Not all lists require markup — a list of items in a sentence separated by commas need not be
> a bulleted/numbered list."

(Verbatim from `refs/trusted-tester/sc-1.3.1-info-and-relationships.md`. The converse holds
here: a visually apparent, line-by-line ingredient list IS list content and must not instead
be coded as a run of headings.)
