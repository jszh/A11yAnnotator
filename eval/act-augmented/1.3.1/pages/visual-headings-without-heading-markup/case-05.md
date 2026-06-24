# case-05 — Recipe partial failure: real `<h1>` + real `<h2>` "Ingredients", but `<div>` "Method"/"Notes"

## Scenario
A food-blog recipe ("Brown-Butter Banana Bread"). The page title is a correct `<h1>`. The recipe has
three peer subsections — **Ingredients**, **Method**, **Notes & Substitutions** — all styled
identically (same `.step-head` rule: 1.45rem, weight 700, brown, ruled underline) so a sighted reader
sees three equal-rank section headings. But only **"Ingredients" is a real `<h2>`**; "Method" and
"Notes & Substitutions" are `<div class="step-head">` with no heading semantics. The page is therefore
a *partial* F2 failure: the outline a screen-reader user gets ("Brown-Butter Banana Bread" → "Ingredients")
silently omits two of the three visually-equal subsections.

## Attribute tuple
- **Content domain:** food / recipe blog
- **UI component / pattern:** recipe with peer subsections (ingredients / method / notes)
- **Host-language construct:** mixed — one `<h2>` and two `<div>`s sharing one presentational CSS class
- **Locale / i18n:** en (metric + imperial units)
- **Failure mechanism:** F2 *partial* — some visual headings are programmatic, some are styled `<div>`s

## Developer persona
An agency themed a recipe blog on a CMS. The first subsection in the reusable "recipe" block template
was wired as `<h2>` ("Ingredients"), but the developer building the rest of the template duplicated the
visual style onto plain `<div>`s for "Method" and "Notes" (copying the CSS class, not the element) to
hit a deadline. Because the rendered result is pixel-identical across all three labels, the regression
was invisible in review, and the page passed every automated heading check thanks to the real `<h1>`
and `<h2>`.

## Element / selector carrying the issue
`div.step-head` — the two subsection labels "Method" and "Notes & Substitutions". The contrast element
that makes the failure visible to a human is the sibling `h2.step-head` ("Ingredients"), which is
styled identically but is correctly a heading.

## Exact accessibility mechanism
"Ingredients" exposes as `heading level 2`; "Method" and "Notes & Substitutions" expose as `generic`
static text. A screen-reader user navigating by heading lands on the title and "Ingredients", then
"Next heading" finds nothing — they are dropped straight past the method and the notes, the two most
procedurally important sections, with no signal that further sections exist. The visual rank-equality
of the three labels (TT 10.B requires *each* visual heading to be programmatically determinable) is
broken for two of three. This is the explicit mixed/partial case the aspect calls out.

## Expected ACT-style outcome
**failed** (SC 1.3.1, F2; Trusted Tester 10.B). Three visually apparent peer headings exist; only one
is programmatically a heading, so the page fails 10.B's "each visual heading is programmatically
determinable."

## Why automated tools miss it
The real `<h1>` and `<h2>` satisfy `page-has-heading-one`; `heading-order` sees `h1 → h2` in correct,
gapless order and PASSES — there is no out-of-sequence level to flag because the missing headings are
*absent*, not *mis-leveled*. WAVE/Lighthouse likewise report a clean, short outline. No tool compares
the rendered visual weight of "Method"/"Notes" against "Ingredients" to notice that three identical
section labels produced only one heading. That comparison — "these three look like equal-rank headings,
why are only one in the outline?" — is a visual + structural judgment a human must make.

## Citation
**Reference:** Trusted Tester v5.1.3 — Test 10.B `1.3.1-heading-determinable`, Evaluate Results (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
> "1. Each programmatically determinable heading is serving as a visual heading on the page, AND 2. Each visual heading is programmatically defined."

**Reference:** WCAG Technique F2 (`wcag-techniques/failures/F2.html`)
> "If, in either situation, check 1 is true and check 2 is false, this failure condition applies and the content fails this success criterion."
