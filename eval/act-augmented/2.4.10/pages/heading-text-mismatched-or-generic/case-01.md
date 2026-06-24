# case-01 — Civic permit page with three sections all headed the CMS placeholder "Section Heading"

## Scenario
A municipal "Apply for a Residential Parking Permit" page on a city .gov site is divided
into three genuinely distinct, finished sections: **eligibility rules**, a **fee schedule**
(with a real table), and a **how-to-apply** step list (with a call-to-action button). Every
section opens with a non-empty `<h2>`, but all three read the literal Drupal/CMS template
default **"Section Heading"** — placeholder strings the content author pasted real body copy
under but never renamed. The page looks finished in the WYSIWYG preview because the bodies
differ, yet the heading outline names nothing.

## Attribute tuple
- **content-domain**: government / civic services portal (city Department of Transportation & Parking)
- **UI-component/pattern**: long-form instructional page with `<section aria-labelledby>` landmarks, a fee `<table>`, and an ordered step list
- **host-language construct**: `<section aria-labelledby>` bound to sequential `<h2 id>` headings
- **locale/i18n**: en-US
- **failure-mechanism**: (a) literal CMS placeholder text ("Section Heading") left in over finished real content

## Developer persona
A part-time municipal communications officer building the page in a Drupal theme whose
"Section" component ships with the demo text "Section Heading". They dropped three Section
components onto the layout, pasted the real eligibility / fee / apply copy into each body,
and published — never overwriting the demo heading because the body preview "looked done."
No one ever reviewed the page as a heading-only outline.

## Element / selector carrying the issue
- FAIL: `h2#h-1` (text "Section Heading") over the eligibility section.
- FAIL: `h2#h-2` (text "Section Heading") over the fee-schedule section.
- FAIL: `h2#h-3` (text "Section Heading") over the how-to-apply section.

## Exact accessibility mechanism
A blind user who opens the heading list (NVDA Elements List, JAWS heading list, VoiceOver
rotor) — the canonical way to skim a long procedural page — hears:

> "Section Heading, heading level 2 · Section Heading, heading level 2 · Section Heading,
> heading level 2."

That outline gives **zero** orientation: the user cannot tell which heading leads to the
eligibility rules, which to the fees, and which to the application steps. To find "how much
is the second-vehicle permit" they must enter each section and read it top to bottom,
defeating the purpose of headings entirely. The heading text is not merely generic — it is a
template artifact that describes no section at all. This is the section-level analogue of
F2/H69: a heading is present but does not introduce its section.

## Expected ACT-style outcome
**failed** — each section has a heading element, but the heading text is leftover CMS
placeholder copy that does not name or introduce the section it sits above.

## Why automated tools miss it
"Section Heading" is a non-empty `<h2>` in valid order, so axe-core (`empty-heading`,
`heading-order`, `page-has-heading-one`), WAVE and Lighthouse all pass — a heading element
exists for every section and contains text. No checker has a model of the section bodies
(eligibility vs. fees vs. application steps), so none can detect that "Section Heading" is a
placeholder that fits none of them. Worse, the three headings are identical, but duplicate
heading text is not itself a violation any tool reports. Recognising the string as an
un-replaced template default — rather than a real section title — requires reading the body
prose and the heading together, which is pure semantic human judgment.

## Citation
> **WCAG 2.2 Understanding — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content, facilitates navigation within the content, and
> provides mental \"handles\" that aid in comprehension of the content."

> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."

> **WCAG Techniques — G141: Organizing a page using headings**
> "The objective of this technique is to ensure that sections have headings that identify
> them."
