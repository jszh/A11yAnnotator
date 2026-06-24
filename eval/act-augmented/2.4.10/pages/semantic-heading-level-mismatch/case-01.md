# case-01 — Textbook chapter: a sub-sub-point flattened to a sibling h2 (no numeric skip)

## Scenario
A university course reader's "Chapter 3: Cellular Respiration" page (`h1`) has three
sub-topic sections — Glycolysis (`3.1`), The Citric Acid Cycle (`3.2`), and Oxidative
Phosphorylation (`3.3`) — correctly marked `h2`. Inside section 3.2 there is a point,
numbered **3.2.1 "Fate of the Reduced Carriers"**, that explains where the NADH/FADH2
*produced by the citric acid cycle* go next. It is conceptually a child of 3.2, but it is
tagged `h2`, so the accessibility-tree outline lists it as a fourth sibling alongside 3.1 /
3.2 / 3.3, flattening the hierarchy. No numeric level is skipped (the sequence is
h1, h2, h2, h2, h2).

## Attribute tuple
- **content-domain**: higher-ed LMS / course reader (introductory cell biology)
- **UI-component/pattern**: long-form scholarly article with numbered section outline
- **host-language construct**: native `<h1>`/`<h2>` heading elements, no ARIA
- **locale/i18n**: en (US)
- **failure-mechanism**: (a) a sub-topic that elaborates only the section above it is marked
  as that section's sibling (`h2`) instead of its child (`h3`)

## Developer persona
An instructor pasted the chapter from a Word manuscript into the LMS's HTML block. In Word
the heading styles had been overridden so "Heading 2" and "Heading 3" looked identical, and
the paste mapped every styled line to `<h2>`. Because the visual result looked right in the
editor preview, the instructor never read the page back as a heading-only outline and never
noticed that 3.2.1 had been promoted to a top-level section.

## Element / selector carrying the issue
- FAIL: the fourth heading, `h2` with text **"3.2.1 Fate of the Reduced Carriers"**
  (`body > h2:nth-of-type(3)`). It should be `h3`.

## Exact accessibility mechanism
A screen-reader user navigating by heading (NVDA Elements List / JAWS heading list /
VoiceOver rotor) hears a flat outline:
> "Glycolysis, h2 · The Citric Acid Cycle, h2 · Fate of the Reduced Carriers, h2 ·
> Oxidative Phosphorylation, h2."
The outline tells the user that "Fate of the Reduced Carriers" is a major, top-level division
of the chapter on the same footing as the three stages of respiration. In reality it is a
detail *inside* the citric-acid-cycle section — it only makes sense as a continuation of 3.2.
A blind student building a mental model of the chapter is misled about its structure, and a
student who jumps to that "section" lands mid-thought with no parent context. The levels say
"sibling"; the content says "child."

## Expected ACT-style outcome
**failed** — the heading levels do not reflect the topical containment (H69/G141 "properly
nested": a subsection must be given a subsequent logical level).

## Why automated tools miss it
The heading sequence is monotonic and non-skipping (h1→h2→h2→h2→h2), so axe-core
`heading-order`, `empty-heading`, and `page-has-heading-one`, plus Lighthouse and WAVE, all
report a valid heading structure. Every heading is non-empty and descriptive (2.4.6 also
passes). Determining that "3.2.1 Fate of the Reduced Carriers" is *contained in* "3.2 The
Citric Acid Cycle" — and therefore demands a deeper level — requires reading and
understanding the biochemistry in the prose. No linter has a model of topical containment,
so the wrong level is invisible to automation.

## Citation
> **WCAG Techniques — H69: Providing heading elements at the beginning of each section of
> content (Description)**
> "When headings are nested hierarchically, the most important information is given the
> highest logical level, and subsections are given subsequent logical levels.(i.e.,
> `h2` is a subsection of `h1`)."

> **WCAG Techniques — G141: Organizing a page using headings (Description)**
> "To facilitate navigation and understanding of overall document structure, authors should
> use headings that are properly nested (e.g., `h1` followed by `h2`, `h2` followed by `h2`
> or `h3`, `h3` followed by `h3` or `h4`, etc.)."
