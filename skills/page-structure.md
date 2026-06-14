---
name: page-structure
description: Verify the document's heading hierarchy, page title, and landmark regions form a coherent, navigable outline. Static and largely deterministic, but with a vision/judgment step for "descriptive enough".
covers: cat_3 (primary); cat_2 (landmarks)
wcag: 2.4.2 Page Titled (A); 2.4.6 Headings and Labels (AA); 1.3.1 Info and Relationships (A); 2.4.10 Section Headings (AAA)
instruments: DOM, axe, AX tree, vision
behavioral: no (static — safe in noscript mode)
---

> **Map findings to the right SC and level.** An *empty / non-descriptive*
> heading is **1.3.1** (broken programmatic structure, A) and/or **2.4.6**
> (headings must describe, AA). **2.4.10 Section Headings is Level AAA** — it's
> about whether headings are *used to organize* content, a higher bar; cite it
> only for that, and mark it AAA. **A missing `<h1>` is NOT a WCAG failure** — no
> SC requires a single h1; `page-has-heading-one` is an axe *best-practice* rule,
> so report it as best-practice, not a conformance violation.

# page-structure

## When to run
Findings about page title quality, empty/skipped/non-descriptive headings,
missing `<h1>`, "eyebrow" labels that look like headings but aren't, or absent
landmark structure.

## Procedure
1. **Title** — `--eval "return document.title"`. Fails 2.4.2 if generic, truncated,
   or it doesn't describe the page's topic/state ("Amazon.com: Keep shopping for").
   axe `document-title` only catches *missing/empty* — descriptiveness is a vision call.
2. **Heading tree** — `--eval "return [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].map(h=>h.tagName+(h.getAttribute('aria-level')?'/al'+h.getAttribute('aria-level'):'')+':'+JSON.stringify((h.textContent||'').trim().slice(0,40)))"`.
   Flag: **empty heading text** (1.3.1 / 2.4.6 — a named heading present in the
   outline but with no accessible name *is* a programmatic-structure defect), **level
   skips** (axe `heading-order` — **AT-compat / best-practice, NOT a hard 1.3.1
   failure**; WCAG does not require sequential levels — note it, don't assert 1.3.1),
   and **visually-prominent labels that are not headings** (a styled
   `<div>`/`<p>` "Our Research Pillars" → genuine 1.3.1: a heading relationship shown
   visually is not exposed programmatically; axe `p-as-heading` catches the
   `<p>`-styled-as-heading case). A **missing `<h1>`** (axe `page-has-heading-one`)
   is **best-practice, not an SC** — note it as such. (`heading-order`,
   `empty-heading`, `p-as-heading`, `landmark-unique`, `region` are best-practice /
   experimental axe rules — runnable by name via `--axe <rule>`; the annotator's
   auto-scan now includes the `best-practice` tag so they surface there too.)
3. **Confirm via SR** — `/ax-node` on a suspect heading: an empty `<h2>` or a
   `role=heading` span with no name returns `name:null` → invisible to heading
   navigation even though it occupies the outline.
4. **Landmarks** — `--eval` count `header/nav/main/aside/footer` + `[role=...]`.
   **H5: missing `main`/`nav` is NOT a 1.3.1 failure** — no SC requires landmarks;
   they're a best-practice/AT-navigation aid (axe `landmark-*`/`region` are
   best-practice rules). Report absence as **best practice**, not a conformance
   violation. A landmark that exists but is mis-typed/duplicated-unlabelled can be a
   1.3.1 issue (wrong relationship is exposed); plain absence is not.
5. **Vision** — screenshot; map the *visual* section headers to the DOM headings.
   Visual sections with no corresponding heading element = the gap.

## Classify — separate the three buckets (H5); don't fold best-practice into 1.3.1
- **REPRODUCED (normative failure)** — empty/un-named heading in the outline, a
  visually-styled non-heading that should be a heading (relationship not exposed), a
  mis-typed/duplicated-unlabelled landmark, or a title that names nothing (2.4.2).
- **AT-compat / best-practice (record, do NOT count as a 1.3.1 conformance failure)** —
  heading-level skips, missing `<h1>`, missing `main`/`nav` landmarks, duplicate heading
  *text* (repetition alone isn't a failure). Tag these `best-practice`.
- **NOT REPRODUCED** — outline is coherent and the title is descriptive.

## Limits
"Descriptive enough" (2.4.2/2.4.6) is judgment — axe passes a present-but-generic
title and an empty `role=heading` span, so don't rely on a clean axe run here.
