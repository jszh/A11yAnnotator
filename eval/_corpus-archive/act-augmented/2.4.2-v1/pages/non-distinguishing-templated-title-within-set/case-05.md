# case-05 — Single FAQ-answer page titled only "Help Center"

## Scenario
One article in a support knowledge base. The body answers ONE specific question: the
`<h1>` is the question itself ("How do I request a refund for a charge I didn't
recognize?"), followed by numbered steps, a note callout, a "Was this article helpful?"
widget, and a related-articles list. The `<title>` is just **"Help Center"** — the
section name, identical on every help article.

## Element / selector carrying the issue
`head > title` (value: `Help Center`), judged against `article > h1` (the specific
question), the `nav.crumbs` ("Billing & Plans / Refunds"), and the per-article
`.feedback` / `.related` widgets that show this is one answer among many.

## Exact accessibility mechanism (what AT experiences and why it fails)
Help-center users very often arrive from search and open several candidate answers in
tabs to find the one that fits. The accessible document name / tab label comes from
`<title>`, so every article reads identically as **"Help Center"**. A screen-reader
user cannot tell the refund answer from the "charged twice" answer or the "update card"
answer by title alone; a list of search results would show many identical "Help Center"
rows, defeating the core benefit of the SC ("Users can more quickly identify the content
they need when accurate, descriptive titles appear in … lists of search results"). The
distinguishing content — the actual question — sits in the `<h1>` and never reaches the
title, so the set-distinguishability limb of SC 2.4.2 fails.

## Why automated tools cannot detect this
"Help Center" is present, non-empty, grammatical, and topically relevant (it is the
section), so axe/WAVE/Lighthouse pass it. The defect is that the same string is reused
across every answer page instead of carrying the specific question — a cross-page,
meaning-based judgement. A single-page automated checker has no sibling to compare and
no way to know "Help Center" is the template constant rather than this page's identity.

## Expected ACT-style outcome
**failed** (SC 2.4.2, Level A — Limb 2 distinguishability)

## Citation
> **WCAG 2.2 Understanding, `wcag-understanding/page-titled.html` (Intent):**
> "When titles appear in site maps or lists of search results, users can more quickly identify the content they need."

> **WCAG Technique G88, `wcag-techniques/general/G88.html` (Description):**
> "It may also be helpful for the title to … Be unique within the site or other resource to which the web page belongs"
