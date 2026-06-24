# case-03 — DIY blog post whose section headings are content-free words "More" / "Stuff" / "Other"

## Scenario
A personal hobby blog post, "Building My First Mechanical Keyboard", is organised into five
sections with substantive, topically-specific bodies: why-I-built-one (intro), a **parts
list**, a **soldering walkthrough** (with a temperature warning and a numbered procedure), a
**firmware/QMK flashing guide** (with a shell code block), and a conclusion. The first and
last `<h2>` are descriptive ("Why I built one", "Was it worth it?"). The three middle
headings are content-free generic words: **"More"**, **"Stuff"**, and **"Other"**. Each word
is valid, non-empty English and sits over richly specific content — but the words name
nothing.

## Attribute tuple
- **content-domain**: personal / hobby developer blog (DIY mechanical keyboards)
- **UI-component/pattern**: long-form article with mixed content blocks — bullet parts list, a `<figure>` warning callout, an ordered procedure, and a `<pre><code>` shell block
- **host-language construct**: `<section aria-labelledby>` with `<h2 id>` headings; `<figure>/<figcaption>`
- **locale/i18n**: en-US
- **failure-mechanism**: (c) generic content-free placeholder words ("More" / "Stuff" / "Other") over substantive, distinct bodies

## Developer persona
A hobbyist new to writing for the web typed the first and last headings deliberately, then —
mid-flow and unsure what to call the middle parts — dropped in throwaway words ("More",
"Stuff", "Other") meaning to revise them later, and published before doing so. They write and
read the post top-to-bottom visually, so the prose feels complete; the heading-only outline
was never checked.

## Element / selector carrying the issue
- FAIL: `h2#h-more` (text "More") over the **parts list**.
- FAIL: `h2#h-stuff` (text "Stuff") over the **soldering walkthrough**.
- FAIL: `h2#h-other` (text "Other") over the **firmware / QMK flashing guide**.
- (PASS by contrast: `h2#h-why` "Why I built one" and `h2#h-end` "Was it worth it?" do name
  their sections — included so the failure is the generic words specifically, not the page.)

## Exact accessibility mechanism
A screen-reader user skimming the rotor/heading list hears:

> "Why I built one · More · Stuff · Other · Was it worth it?"

"More", "Stuff" and "Other" carry no topic, so a user looking for "how do I flash the
firmware?" gets no signal that the QMK guide lives under "Other"; they must open each section
and read it linearly. The words are not *wrong* about a topic (they are too empty to be wrong)
— they simply fail to introduce or identify the section, giving a blind or cognitively-disabled
reader no mental handle. This is a descriptiveness failure at the section level: a heading that
exists but does not let the user know the purpose of the section.

## Expected ACT-style outcome
**failed** — headings are present and non-empty but content-free generic words that do not
identify or introduce their sections.

## Why automated tools miss it
"More", "Stuff" and "Other" are non-empty `<h2>` elements in valid order, so axe-core,
WAVE and Lighthouse pass all heading checks. They are real, correctly-spelled words, so a
spell-check or empty-text heuristic finds nothing. No tool can tell that "Stuff" fails to name
"a soldering walkthrough with a 320 °C iron and a continuity-test step" — that requires reading
the body and judging that the heading conveys none of its purpose, a graded semantic judgment
no checker makes.

## Citation
> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."

> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who navigate content by keyboard will be able to jump the focus from heading to
> heading, enabling them to find quickly content of interest."

> **WCAG Techniques — G141: Organizing a page using headings**
> "The objective of this technique is to ensure that sections have headings that identify
> them."
