# case-06 — Two "open the syllabus" links in one list item that go to two genuinely different course sections (FAIL)

## Scenario
A university course-registration page for *BIOL 204 Genetics*. A single `<li>` explains
that the course runs as two separate cohorts and contains two **"open the syllabus"**
links in the same sentence-pair — one for the in-person Monday/Wednesday lab cohort, one
for the fully online evening cohort. Both links have the identical accessible name and
the identical (same-DOM-node) context: they are inside the **same `<li>`**. But they
resolve to **genuinely different resources** — `/biol204/syllabus?cohort=in-person-mon-wed`
versus `/biol204/syllabus?cohort=online-evening` — which the page itself says are different
documents (different required texts, lab fees, exam dates and grading scheme). Because the
names AND context are identical but the purposes differ, at least one link fails to let
the user determine its purpose, so the page **fails** SC 2.4.4. The two links are NOT
byte-identical (different query strings) and differ only in a `?cohort=` value, so a
checker cannot decide from the URLs whether they serve the same or a different resource.

## Attribute tuple
- **content-domain:** higher education / course registration (LMS / student portal)
- **UI-component / pattern:** two inline anchors inside one list item, same base path with differing query strings
- **host-language construct:** two `<a href="/biol204/syllabus?cohort=…">` inside a single `<li>` of a `<ul class="sections">`
- **locale / i18n:** en-US
- **failure-mechanism:** identical accessible name + identical (same-DOM-node) context, but the two links resolve to **genuinely different resources** (two distinct section syllabi); disambiguating text trails each link (F63) instead of being inside it or programmatically associated

## Developer persona
A department admin pasted the two section links into one bullet because, in the CMS, both
go to "the syllabus page" and only a query parameter changes. She reused the same friendly
"open the syllabus" anchor text for both, assuming the surrounding sentence made the
difference clear to everyone — not realising a screen-reader user pulling a links list
hears the two anchors with no surrounding prose, and that the in-person and online cohorts
are, in practice, two different courses with different books and exams.

## Element / selector carrying the issue
`li > a[href^="/biol204/syllabus?cohort="]` (×2) — two `<a>` with accessible name
"open the syllabus" in one `<li>`, resolving to `?cohort=in-person-mon-wed` and
`?cohort=online-evening`. At least one link does not, on its own, let the user determine
its purpose.

## Exact accessibility mechanism (what AT experiences, why it FAILS)
- **Screen-reader user using a links list / rotor:** hears "open the syllabus / open the
  syllabus" with no surrounding sentence. The two activate **different** syllabus
  documents (different texts, lab fees, exam dates), so the user cannot tell which is the
  in-person cohort and which is the online one — and picking wrong means the wrong textbook
  and a missed exam.
- **Difference is real, not ambiguous-to-all:** unlike fd3a94 Passed Example 9 (two
  identical social-media links that are ambiguous to *everyone*), here the page openly
  states the cohorts differ; sighted readers can disambiguate from the trailing prose, so
  the screen-reader user is specifically disadvantaged.
- **Context is mis-placed (F63):** the disambiguating words ("for the Monday/Wednesday
  in-person lecture cohort…" / "for the fully online evening cohort…") TRAIL each link
  rather than being inside it or tied via `aria-label`/`aria-labelledby`, so they are not
  carried with the link in a links list.

## Expected ACT-style outcome
**failed** (SC 2.4.4). Two links with identical accessible name and identical
programmatically determined context (the same `<li>`) resolve to genuinely different
resources, so at least one link does not let the user determine its purpose.

## Why automated tools miss it
- Each `<a>` has non-empty discernible text and a valid `href`, so axe/WAVE/Lighthouse
  **link-name** / **discernible-text** checks PASS — no rule fires.
- The two hrefs are **not byte-identical**, so the naive shortcut "same name + same href
  ⇒ same resource ⇒ pass" does not even apply. But they differ only in a query-string
  value (`?cohort=in-person-mon-wed` vs `?cohort=online-evening`). A static checker
  cannot decide whether two query-string variants of one path resolve to the **same**
  resource (which would PASS — fd3a94 Passed Examples) or to genuinely **different**
  resources (which FAILS — fd3a94 Failed Example 1, `contact-us.html?page=1` vs `?page=2`).
- Concluding "an in-person lab cohort and an online evening cohort are different courses,
  therefore the two syllabi are non-equivalent, therefore at least one link fails"
  requires reading the human prose and judging course equivalence — the same
  not-fully-automatable judgment fd3a94 is built around. This distinguishes the FAIL here
  from case-02, where three differently-encoded links carry the **same** dataset and PASS.

## Citation
> "For each pair of links in each target set, one of the following is true: both links resolve to the same resource ; or both links resolve to equivalent resources ; or there is no visual information within the web page to let users know that both links resolve to non-equivalent resources ."
— act-rules/extracted/fd3a94.md (Expectation)

> "then the user will not be able to find out where the link is going with any ease. If the user must leave the link to search for the context, the context is not programmatically determined link context and this failure condition occurs."
— wcag-techniques/failures/F63.html (Description)
