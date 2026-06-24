# case-02 — Restaurant menu: "Salads" course between Appetizers and Soups headed only by larger bold text

## Scenario
The Understanding example for 2.4.10 verbatim ("A menu contains different sections for
different courses. Each section has a heading: Appetizers, Salad, Soup, Entree, Dessert.")
rendered as a real prix-fixe dinner menu. Five courses appear: **Appetizers**, **Salads**,
**Soups**, **Entrées**, **Desserts**. Four course titles are native `<h2 class="course">`.
The **Salads** course — sitting between Appetizers and Soups — is introduced by a
`<p class="course-title">` styled with the *identical* font-size, weight, letter-spacing
and decorative rule as the real `<h2>` headings. Visually it is indistinguishable from a
course heading; programmatically it is plain body text.

## Attribute tuple
- **content-domain**: restaurant menu & ordering (the canonical Understanding example)
- **UI-component/pattern**: visual course list with decorative rules
- **host-language construct**: real `<h2 class="course">` for four courses; the offending
  course uses `<p class="course-title">` styled to mimic the heading
- **locale/i18n**: en + French dish names (single primary `lang="en"`)
- **failure-mechanism**: visual-only conveyance — font-size/font-weight alone implies a
  heading; the styled `<p>` carries no heading role (ARIA anti-pattern: "heading level /
  heading-ness chosen for visual size, not document structure")

## Developer persona
A small-restaurant owner built the page in a drag-and-drop site builder. For four courses
he used the "Heading 2" block; for the Salads course he had already typed the word into a
"Text" block while laying out the dishes, then bumped its font size and weight in the
builder's style panel so it "matched" — never converting the block to a heading. In the
WYSIWYG canvas all five course titles look the same, so the mistake is invisible to him.

## Element / selector carrying the issue
- FAIL: `p.course-title` (text "Salads"). It visually matches the four `h2.course`
  elements but has no heading role/level. The Salads course is a distinct section with no
  heading element, while Appetizers/Soups/Entrées/Desserts each have an `<h2>`.

## Exact accessibility mechanism
The blind diner pulls up the menu's heading list to choose a course. AT reports:

> "Appetizers, h2 · Soups, h2 · Entrées, h2 · Desserts, h2."

**Salads never appears.** The user concludes the restaurant has four courses, or — if they
arrow linearly — encounters the three salad dishes adrift with no announced course boundary,
unsure whether they are still under "Appetizers" or have entered something new. The word
"Salads" is read, if reached, as ordinary text with no role, so a diner navigating
heading-to-heading skips from Appetizers straight to Soups. This is precisely the
Understanding example's point: "visual presentation is not sufficient to identify document
sections" — the bigger, bolder, ruled "Salads" is visual presentation only.

## Expected ACT-style outcome
**failed** — the menu is organised into course sections and one course (Salads) has no
heading introducing it, while its sibling courses do. Passes ACT 047fe0 (the page has
`<h1>`/`<h2>` headings for non-repeated content); the violation is purely the per-section
(per-course) missing heading.

## Why automated tools miss it
All four `<h2 class="course">` headings are non-empty and in order, the page has one
`<h1>`, and the styled "Salads" is a perfectly valid `<p>` — so axe-core, WAVE and
Lighthouse find no heading defect (there is no skipped level to flag, no empty heading, no
missing h1). A tool cannot infer that a `<p>` *should* have been a heading: there is no
role to test against, and font-size/weight are not reliable signals (plenty of bold large
text is legitimately not a heading). Recognising that "Salads" is a course title on a par
with the other four — and that the course is a section requiring its own heading — is a
human reading + visual-prominence judgment, exactly the gap the ACT corpus leaves untested.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Examples of Section Headings**
> "A menu contains different sections for different courses. Each section has a heading:
> Appetizers, Salad, Soup, Entree, Dessert."

> **WCAG 2.2 Understanding 2.4.10 — Intent of Section Headings**
> "Other page elements may complement headings to improve presentation (e.g., horizontal
> rules and boxes), but visual presentation is not sufficient to identify document sections."

> **WCAG Techniques — G141: Organizing a page using headings (Tests)**
> "Examine a page with content organized into sections. Check that a heading for each
> section exists."
