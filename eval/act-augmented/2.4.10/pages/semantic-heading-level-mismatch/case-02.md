# case-02 — Recipe: "Instructions" demoted to h3 under "Ingredients" (peers falsely nested)

## Scenario
A food-blog recipe page ("Browned Butter Banana Bread", `h1`) has the two canonical
top-level parts of any recipe: **Ingredients** and **Instructions**. "Ingredients" is `h2`;
"Instructions" is `h3`. Because they are co-equal halves of the recipe, the demotion makes
the accessibility outline read the cooking steps as a *subsection of the ingredient list*.
No numeric level is skipped (h1 → h2 → h3).

## Attribute tuple
- **content-domain**: food blog / recipe (consumer cooking)
- **UI-component/pattern**: recipe "card" with ingredient list + numbered method
- **host-language construct**: native heading elements styled identically via CSS
  (`h2, h3 { font-size:1.3rem }`)
- **locale/i18n**: en, metric + imperial units
- **failure-mechanism**: (b) two co-equal peer sections given different levels so one falsely
  nests under the other

## Developer persona
A home-cook blogger uses a WordPress recipe plugin's "card" template. The template ships
"Ingredients" as `h2` and "Instructions" as `h3` (the plugin author chose levels by where the
blocks sit, not by meaning), and styles both with the same orange heading style so the card
looks balanced. The blogger fills in content and publishes; since both headings render the
same size, nothing looks wrong and the demotion is never caught.

## Element / selector carrying the issue
- FAIL: the `h3` with text **"Instructions"** (`body > h3`). It should be `h2`, a sibling of
  the "Ingredients" `h2`.

## Exact accessibility mechanism
A screen-reader cook who pulls up the heading list to jump straight to the method hears:
> "Ingredients, heading level 2 · Instructions, heading level 3."
Level 3 communicates "this is a sub-part of the level-2 item above it" — i.e. that the steps
are a detail of the ingredient list. A blind user trying to understand the recipe's shape is
told there is really only one top-level section (Ingredients) with a nested note, when in
fact the recipe has two equal halves. On rotor navigation by level, "Instructions" is buried
one tier down from where a cook would expect the second main section to be. The levels say
"child"; the content says "peer."

## Expected ACT-style outcome
**failed** — co-equal sections are given different levels, so the heading nesting contradicts
the true (peer) hierarchy (H69/G141 "properly nested").

## Why automated tools miss it
The sequence h1 → h2 → h3 is strictly non-skipping, so axe-core `heading-order`, Lighthouse,
and WAVE all pass; both headings are non-empty and descriptive. Knowing that "Ingredients"
and "Instructions" are the two co-equal top-level parts of a recipe — siblings, both `h2` —
rather than parent and child is document-structure / culinary common sense that no automated
checker models. The font sizes are identical, removing even a visual heuristic.

## Citation
> **WCAG Techniques — G141: Organizing a page using headings (Description)**
> "To facilitate navigation and understanding of overall document structure, authors should
> use headings that are properly nested (e.g., `h1` followed by `h2`, `h2` followed by `h2`
> or `h3`, `h3` followed by `h3` or `h4`, etc.)."

> **WCAG Techniques — H69 (Description)**
> "Headings are designed to convey logical hierarchy. … When headings are nested
> hierarchically, the most important information is given the highest logical level, and
> subsections are given subsequent logical levels.(i.e., `h2` is a subsection of `h1`)."
