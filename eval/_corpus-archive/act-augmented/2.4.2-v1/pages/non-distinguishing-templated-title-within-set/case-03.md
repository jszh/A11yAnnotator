# case-03 — Online-textbook chapter titled only "Intro to Biology"

## Scenario
One chapter of an 18-chapter online textbook. The body could not be more specific
about which chapter it is: an eyebrow "Chapter 3 of 18", an `<h1>` "Chapter 3:
Cellular Respiration", a sidebar table-of-contents with chapter 3 marked
`aria-current="true"`, and prev/next links ("← Chapter 2: The Cell" / "Chapter 4:
Photosynthesis →"). The `<title>` is just **"Intro to Biology"** — the textbook name,
which repeats verbatim on all 18 chapter pages.

## Element / selector carrying the issue
`head > title` (value: `Intro to Biology`), judged against `main > .eyebrow`,
`main > h1`, `aside.toc li[aria-current="true"]`, and the `nav.pager` prev/next links.

## Exact accessibility mechanism (what AT experiences and why it fails)
A student studying with a screen reader keeps several chapters open and uses the title
to jump back to the chapter they were on. Each chapter's document name is read from
`<title>`, so every chapter announces the identical **"Intro to Biology"**. The user
cannot tell Chapter 3 from Chapter 7 by the title, cannot bookmark "the cellular
respiration chapter" usefully, and a list of search results across the book would show
18 indistinguishable "Intro to Biology" entries. The chapter identity lives in the
body (`h1`, eyebrow, ToC current item) and never reaches the title. WCAG Technique
G127 explicitly prescribes the opposite for this exact case: each textbook page's
title should include the chapter number and title plus the textbook name. Because the
title carries only the book name, the SC 2.4.2 distinguishability limb fails.

## Why automated tools cannot detect this
"Intro to Biology" is present, non-empty, and a correct description of the work, so
axe/WAVE/Lighthouse pass. The failure is that it is the per-book constant rather than
the per-chapter variable — a judgement that requires reading the chapter body, seeing
that this is one numbered item of a collection, and knowing the title would be reused
across chapters. That cross-page, semantic inference is outside what a single-page
linter can compute.

## Expected ACT-style outcome
**failed** (SC 2.4.2, Level A — Limb 2 distinguishability)

## Citation
> **WCAG Technique G127, `wcag-techniques/general/G127.html` (Examples — Chapters in an online textbook):**
> "An online textbook is divided into chapters. The title of each web page includes the number and title of the chapter as well as the title of the textbook."

> **WCAG Technique F25 (Failure), `wcag-techniques/failures/F25.html`:**
> "A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages."
