# case-04 — Gov benefits page: a new top-level program buried as h3 under the previous one

## Scenario
A county human-services page ("Help with Heating & Cooling Costs", `h1`) describes two
separate, independently funded assistance programs: **LIHEAP** (bill help) and **WAP**
(weatherization). LIHEAP is `h2`, with two genuine sub-sections "Who qualifies for LIHEAP"
and "How to apply for LIHEAP" correctly `h3`. The second program, **Weatherization
Assistance Program (WAP)**, is then introduced — but it is tagged `h3`, the same level as
LIHEAP's sub-sections, so the AT outline reads WAP (and its own qualify/apply sub-sections)
as a third, fourth, and fifth child of LIHEAP. A whole separate program is buried inside the
previous one. The sequence is h1, h2, h3, h3, **h3**, h3, h3 — no numeric skip.

## Attribute tuple
- **content-domain**: government / civic services portal (energy assistance)
- **UI-component/pattern**: long-form program-information page with apply CTAs and a callout
- **host-language construct**: native headings on a templated `.gov` layout
- **locale/i18n**: en (US)
- **failure-mechanism**: a brand-new top-level topic is marked deeper than the sub-topics
  above it, so the AT outline implies it belongs under the previous section (mechanism (a),
  inverted: child level applied to what should start a new chapter)

## Developer persona
An agency content editor migrated the page from an old PDF into the county CMS. The PDF used
indentation, not real heading levels, so when the editor re-created the structure they set
each new program heading to `h3` "to match the indent depth they saw," not realising the
first program had its own `h3` sub-sections already. The template renders `h2` and `h3` in
the same blue, so the page looked consistent and shipped.

## Element / selector carrying the issue
- FAIL: the `h3` with text **"Weatherization Assistance Program (WAP)"** (the third `h3` on
  the page). It begins a new top-level program and should be `h2`, a sibling of the LIHEAP
  `h2`. (Its own "Who qualifies / How to apply" `h3`s are then correct *relative to a WAP
  h2*, but wrong as long as WAP itself is mis-leveled.)

## Exact accessibility mechanism
A screen-reader user listening to the heading outline hears:
> "LIHEAP, h2 · Who qualifies for LIHEAP, h3 · How to apply for LIHEAP, h3 · Weatherization
> Assistance Program, h3 · Who qualifies for WAP, h3 · How to apply for WAP, h3 · When to
> contact the pharmacist… (next h2)."
Everything from "Weatherization" onward sounds like more sub-detail *of LIHEAP*. A user
eligible only for WAP, skimming the heading list for a second program, never hears a second
top-level entry and may conclude the page covers only LIHEAP. The structure hides an entire
benefit. The levels say "still inside LIHEAP"; the content says "a new, independent program
starts here."

## Expected ACT-style outcome
**failed** — a new top-level section is given a subsection level, so the nesting contradicts
the content hierarchy (H69/G141 "properly nested").

## Why automated tools miss it
The heading sequence is monotonic and non-skipping, so axe-core `heading-order`, Lighthouse,
and WAVE all pass; every heading is non-empty and descriptive. Whether "Weatherization
Assistance Program" *continues* LIHEAP or *starts a new program* is a meaning judgment that
depends on reading the prose ("two separate … programs … funded differently"). The numeric
pattern and the identical font sizes give automation nothing to flag.

## Citation
> **WCAG Techniques — G141: Organizing a page using headings (Description)**
> "To facilitate navigation and understanding of overall document structure, authors should
> use headings that are properly nested (e.g., `h1` followed by `h2`, `h2` followed by `h2`
> or `h3`, `h3` followed by `h3` or `h4`, etc.)."

> **WCAG 2.2 Understanding 2.4.10 — Benefits**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."
