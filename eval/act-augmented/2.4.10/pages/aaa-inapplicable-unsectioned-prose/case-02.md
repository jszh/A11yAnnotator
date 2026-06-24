# case-02 — Boundary pair: continuous disclaimer (PASS) beside an eight-clause Terms of Service missing all headings (FAIL)

## Scenario
A single `/legal` page on a tool retailer's site contains two halves under one `<main>`:

- **Half A — `#disclaimer`**: a continuous, single-argument warranty disclaimer. It makes
  ONE legal point ("to the extent the law allows, we disclaim implied warranties") across a
  couple of long flowing paragraphs. It is *not* organized into sections — there is nothing
  to subdivide — so it correctly has no headings. For 2.4.10 this half is PASS / inapplicable.
- **Half B — `#tos`**: a Terms of Service that IS genuinely organized into eight distinct,
  self-contained topical clauses — eligibility, orders & payment, shipping, returns,
  acceptable use, limitation of liability, governing law, changes. Each clause is its own
  `<section>` and covers a different topic, but **none has a heading** (only a bare clause
  number inside the paragraph). This half *is* "organized into sections," so 2.4.10 applies
  and **fails**.

Because the page as a whole contains a genuine 2.4.10 failure (Half B), the page-level
verdict is **failed**. The page exists to force the judge to distinguish *genre/structure*:
both halves are heading-less paragraph prose, yet one passes and one fails.

## Attribute tuple
- **content-domain**: legal / terms & policy (e-commerce retailer)
- **UI-component/pattern**: long-form legal page with two in-page anchors (Disclaimer, Terms of Service)
- **host-language construct**: nested `<section>` elements — eight child `<section>`s in `#tos`, each with a `<p>` and a bare numeric `<span class="clause-num">`, and **no** `<h2>`/`<h3>`
- **locale/i18n**: en-GB
- **failure-mechanism**: content genuinely organized into eight distinct topical sections, each `<section>` lacking the heading 2.4.10 requires (Half B); contrasted against legitimately unsectioned prose (Half A)

## Developer persona
A back-end developer was handed two Word documents by the legal team and told to "put the
legal stuff up." They pasted the disclaimer and the ToS into one template, wrapped each
numbered ToS clause in a `<section>` because a linter nudged them toward "semantic
sectioning," but used only the clause's existing number ("1.", "2.", ...) as the visible
label — never adding a heading element. They assumed `<section>` *was* the structure and
that the numbers were enough. The disclaimer had no numbered parts, so they left it as plain
paragraphs — which, for that half, happens to be correct.

## Element / selector carrying the issue
- FAIL: `#tos > section` (eight of them) — each is a distinct topical clause that is
  "organized into a section" yet carries no heading. The `<span class="clause-num">` is a
  number, not a heading element and not a programmatic heading.
- PASS (guard): `#disclaimer` — continuous single-argument prose, correctly heading-less.

## Exact accessibility mechanism
A screen-reader user pulls up the heading list to navigate this long legal page. They hear
exactly one heading: the page `<h1>` "Disclaimer & Terms of Service." There is **no way to
jump to the returns clause, the liability clause, or the governing-law clause** — the eight
clauses are programmatically indistinguishable from one another and from the running text.
The user must arrow through every clause linearly to find, say, the refund window. That is
precisely the navigation failure 2.4.10 targets: the content *is* organized into sections
(eight clear topical clauses), so headings are required and their absence fails. Half A, by
contrast, is one continuous argument — a heading list entry there would label nothing, and
its absence is correct. The same DOM shape (`section`/`p`, no headings) is a failure in one
half and a pass in the other; only reading the content resolves which.

## Expected ACT-style outcome
**failed** (page level) — the Terms-of-Service half is organized into eight distinct sections
and none has a section heading. (The disclaimer half is a PASS/inapplicable guard within the
same page.)

## Why automated tools miss it
Every `<section>` in `#tos` is well-formed; the page has a single valid `<h1>`; there are no
empty headings and no skipped levels (there are no sub-headings at all). So axe-core
(`page-has-heading-one`, `empty-heading`, `heading-order` all green), WAVE, and Lighthouse
report no heading defect. Critically, the *passing* disclaimer half and the *failing* ToS
half are the **same DOM pattern** — `<section>` wrapping `<p>` with no `<h2>`. A tool cannot
fire on Half B without also firing on Half A (false positive) or stay silent on Half A
without also missing Half B (false negative). Resolving it requires reading the eight clauses,
recognising they cover eight different topics (hence "organized into sections"), and judging
that the disclaimer is a single continuous argument (hence not). That is human semantic
judgment, exactly what the AAA applicability gate demands.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent**
> "The intent of this success criterion is to provide headings for sections of a web page,
> when the page is organized into sections. For instance, long documents are often divided
> into a variety of chapters, chapters have subtopics, etc. When such sections exist, they
> need to have headings that introduce them."

> **WCAG 2.2 Understanding 2.4.10 — Intent (visual presentation is not enough)**
> "Other page elements may complement headings to improve presentation (e.g., horizontal
> rules and boxes), but visual presentation is not sufficient to identify document sections."

> **WCAG Techniques — H69: Providing heading elements at the beginning of each section of content (Tests)**
> "1. Check that the content is divided into separate sections. 2. Check that each section on
> the page starts with a heading."
