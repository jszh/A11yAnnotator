# case-06 — Terms of Service: genuinely correct nesting (PASS boundary/control)

## Scenario
A SaaS Terms of Service page ("Lumen Cloud Storage — Terms of Service", `h1`) has three
top-level articles: **Your Account** (`h2`), **Acceptable Use** (`h2`), and **Termination**
(`h2`). The first article has two real sub-clauses — **Eligibility** and **Account
Security** — that are genuinely facets of the account, and they are correctly nested as `h3`.
The other two articles are genuine peers of the first and are kept at `h2`. Here the level
NUMBERS match the topical containment exactly. This is the deliberate control: nesting is
present, but it is *semantically correct*, so it must NOT be flagged.

## Attribute tuple
- **content-domain**: legal / SaaS terms & policy
- **UI-component/pattern**: legal document with numbered articles and sub-clauses
- **host-language construct**: native headings with DISTINCT visual levels (`h2` larger than
  `h3`), and matching correct semantics
- **locale/i18n**: en
- **failure-mechanism**: none — correct nesting; included to sharpen that the aspect tests a
  level/meaning *contradiction*, not the mere presence of nested headings

## Developer persona
A privacy/legal engineer hand-authored the Terms in plain HTML, deliberately choosing levels
to match the document's logical outline: sub-clauses of an article are `h3`; new articles are
`h2`. This is the "done right" counterpart to the failing cases in this set.

## Element / selector carrying the issue
- PASS: all six headings. `h2` "Your Account" contains `h3` "Eligibility" and `h3` "Account
  Security" (true sub-clauses); `h2` "Acceptable Use" and `h2` "Termination" are true peers
  of "Your Account". Every level matches the content's containment relationships.

## Exact accessibility mechanism
A screen-reader user navigating the heading list hears:
> "Your Account, h2 · Eligibility, h3 · Account Security, h3 · Acceptable Use, h2 ·
> Termination, h2."
This outline is an accurate model of the document: three top-level articles, the first with
two nested clauses. A blind reader can correctly infer that Eligibility and Account Security
are parts of the account article, and that Acceptable Use and Termination are separate
articles of equal weight. The levels and the content agree — there is no contradiction for a
human applying H69/G141 to find, so the page satisfies the success criterion.

## Expected ACT-style outcome
**passed** — headings are present and properly nested: subsection levels (`h3`) are used only
for genuine subsections, and peer articles share the same level (`h2`), matching the topical
hierarchy.

## Why automated tools miss it
Automated tools also pass this page (clean, non-skipping heading-order; non-empty headings),
but unlike the failing cases the *human* verdict agrees with them here. The control matters
because the failing cases in this directory are likewise green to automation; a model that
learned "nested headings present ⇒ flag" would wrongly fail this page. Distinguishing this
correct nesting from the contradictory nesting in case-01..05 requires the same human
semantic judgment about topical containment — which is exactly the capability under test.

## Citation
> **WCAG Techniques — H69 (Description)**
> "When headings are nested hierarchically, the most important information is given the
> highest logical level, and subsections are given subsequent logical levels.(i.e.,
> `h2` is a subsection of `h1`). Providing this type of structure will help users
> understand the overall organization of the content more easily."

> **WCAG Techniques — G141: Organizing a page using headings (Description)**
> "To facilitate navigation and understanding of overall document structure, authors should
> use headings that are properly nested (e.g., `h1` followed by `h2`, `h2` followed by `h2`
> or `h3`, `h3` followed by `h3` or `h4`, etc.)."
