# case-03 — TOC entry "Chapter 3: Results" whose anchor scrolls to Chapter 5: Conclusions

## Scenario
A single-page final technical report has a table of contents with five precise entries:
"Chapter 1: Introduction", "Chapter 2: Methods", **"Chapter 3: Results"**, "Chapter 4:
Discussion", "Chapter 5: Conclusions". The chapters themselves are on the same page with
ids `#ch1`..`#ch5`. The "Chapter 3: Results" TOC link's `href` is **`#ch5`**, the
"Chapter 5: Conclusions" heading. The real Results chapter is `#ch3`. Selecting the
Results entry takes the reader to Conclusions — a different real chapter — so the
contradiction is fully verifiable on the page.

## Attribute tuple
- **content-domain:** developer docs / long-form technical report (research)
- **UI-component / pattern:** in-page table of contents (ordered list of fragment anchors)
- **host-language construct:** `<a href="#ch5">Chapter 3: Results</a>` — text/id mismatch
- **locale / i18n:** en-GB
- **failure-mechanism:** descriptive name vs. actual destination mismatch — TOC entry points to the wrong (but real) chapter anchor

## Developer persona
The report was authored in a markdown-to-HTML pipeline that auto-generated heading ids
(`#ch1`..`#ch5`). After conversion, a chapter was reordered and the author hand-edited the
TOC to renumber the visible labels but mis-typed one `href` (left "Results" pointing at
`#ch5` after a copy from the Conclusions line). Because every anchor still resolves and
every label is descriptive, the slip survived review — the contents list "looks complete
and correct".

## Element / selector carrying the issue
`nav.toc ol li:nth-child(3) a` — accessible name "Chapter 3: Results", `href="#ch5"`. The
contradicting target is `<h2 id="ch5">Chapter 5: Conclusions</h2>`. The honest target is
`<h2 id="ch3">Chapter 3: Results</h2>`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Screen-reader user navigating a long document:** relies on the TOC links to jump
  directly to a section instead of arrowing through pages of prose. They choose
  "Chapter 3: Results" to hear the findings; focus/scroll lands on "Chapter 5:
  Conclusions". They may not immediately realise they are in the wrong chapter, and will
  read or quote the wrong material — the link did not let them reliably reach the purpose
  it named.
- **Cognitive / reading-disability user:** navigating a dense report by its contents list
  is a key strategy; being silently delivered to the wrong chapter is disorienting and
  erodes trust in the whole TOC.
- The mismatch is concretely in the DOM (`href="#ch5"`, and `#ch5` is Conclusions), so any
  agent that resolves the fragment lands on the contradicting heading.

## Expected ACT-style outcome
**failed** (SC 2.4.4). The link's descriptive name announces a destination ("Chapter 3:
Results") that does not match its actual on-page destination ("Chapter 5: Conclusions").

## Why automated tools miss it
- Every TOC label is non-empty, specific, and unique — ideal link text by all name
  heuristics; nothing for c487ae or generic-text rules to flag.
- `#ch5` resolves to a present element, so anchor-validity checks pass.
- The Results chapter *does* exist (`#ch3`) and the Conclusions chapter *does* exist
  (`#ch5`); the page is structurally sound with proper headings.
- The only way to detect the fault is to **follow "Chapter 3: Results", read the heading
  that appears ("Chapter 5: Conclusions"), and recognise the numeric/topic contradiction**
  — a semantic comparison between the link's claim and the target's content that requires a
  human reader.

## Citation
> "The text of, or associated with, the link is intended to describe the purpose of the link."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))

> "Check that text of the link describes the purpose of the link"
— wcag-techniques/general/G91.html (Tests — Procedure)
