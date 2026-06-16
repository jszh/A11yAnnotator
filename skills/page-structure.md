---
name: page-structure
description: Verify the document's heading hierarchy, page title, and landmark regions form a coherent, navigable outline. Static and largely deterministic, but with a vision/judgment step for "descriptive enough".
covers: cat_3 (primary); cat_2 (landmarks)
wcag: 2.4.2 Page Titled (A); 2.4.6 Headings and Labels (AA); 1.3.1 Info and Relationships (A); 2.4.10 Section Headings (AAA)
instruments: DOM, axe, AX tree, vision
behavioral: no (static — safe in noscript mode)
---

# page-structure

## v3.2 division of labor
You do **not** investigate and you do **not** drive tools. The collector + the
deterministic runners have already loaded the page, read the DOM, run axe, walked
the AX tree, and captured the vision crops. They **hand** you their signals, the
realism-corrected VSR (screen-reader) transcript, and the declared crops. Your
only job is to **judge meaning** over that handed evidence.

**Defer to the runner.** Where a deterministic runner already disposed an
obligation — `document-title` already fired for a *missing/empty* title,
`empty-heading` already fired for a heading with no accessible name, `p-as-heading`
already caught a `<p>` styled as a heading, `heading-order` already flagged a level
skip — that obligation is **settled by the runner**, not by you. Do not re-litigate
a clean or already-failed deterministic check.

You only adjudicate the **auto-PARTIAL residue**: the meaning calls a runner
*cannot* make. Concretely, that residue is the descriptiveness/relationship
judgments below — a title that is *present but names nothing*, a heading that is
*present but generic*, and a *visually-shown* heading/section relationship that the
DOM does *not* expose programmatically.

> **Map findings to the right SC and level.** An *empty / non-descriptive*
> heading is **1.3.1** (broken programmatic structure, A) and/or **2.4.6**
> (headings must describe, AA). **2.4.10 Section Headings is Level AAA** — it's
> about whether headings are *used to organize* content, a higher bar; cite it
> only for that, and mark it AAA. **A missing `<h1>` is NOT a WCAG failure** — no
> SC requires a single h1; `page-has-heading-one` is an axe *best-practice* rule,
> so report it as best-practice, not a conformance violation.

## What you JUDGE
Three meaning calls, scoped to the handed evidence:

- **2.4.2 page-title descriptiveness** — the runner already disposed
  *missing/empty* (`document-title`). You judge whether the *present* title
  actually describes the page's topic/state. Generic, truncated, or boilerplate
  titles fail 2.4.2 even when axe passes them ("Amazon.com: Keep shopping for",
  "Home", "Untitled").
- **2.4.6 heading descriptiveness** — for headings that *have* an accessible name
  (so `empty-heading` did not fire), judge whether the name describes the section
  it labels. A present-but-uninformative heading ("More", "Section", "Click here")
  fails 2.4.6 (AA).
- **1.3.1 info + relationships** — judge whether a relationship that is **shown
  visually** is **exposed programmatically**. A styled `<div>`/`<p>` that reads as a
  section header ("Our Research Pillars") but is not a heading element / not
  `role=heading` is a genuine 1.3.1 failure: the heading relationship is visible to
  sighted users but absent from the outline a screen-reader navigates. Likewise a
  landmark that *exists* but is mis-typed or duplicated-and-unlabelled exposes the
  *wrong* relationship → 1.3.1.

**Soundness floor — do not promote best-practice to a 1.3.1 failure.** A
heading-level **skip** (`heading-order`), a **missing `<h1>`** (`page-has-heading-one`),
and a **missing landmark** (no `main`/`nav`; `landmark-*`/`region`) are
**best-practice / AT-navigation** findings. WCAG does **not** require sequential
heading levels, a single h1, or any landmark. A missing landmark or a heading-skip
is **best-practice, NOT a 1.3.1** conformance violation — record it as
best-practice and move on. (Plain *absence* of a landmark is best-practice;
a landmark that is present but mis-typed/duplicated-unlabelled is a real 1.3.1
relationship defect — that distinction is yours to make.)

## Evidence you are handed
You receive, pre-computed — you do not re-collect any of it:

- **a11y-eval signals (DOM)** — `document.title`; the full heading list
  (`h1..h6` + `[role=heading]` with `aria-level`, each with its trimmed text); the
  landmark inventory (`header/nav/main/aside/footer` + `[role=...]`, counts and
  labels).
- **axe runner verdicts** — which of `document-title`, `empty-heading`,
  `p-as-heading`, `heading-order`, `landmark-unique`, `page-has-heading-one`,
  `region` fired (and which passed). A rule that fired has **already disposed** its
  obligation; treat it as settled, classify by the bucket rules above.
- **AX-tree signal** — the accessible name the AT computes for each suspect
  heading/landmark (e.g. an empty `<h2>` or a nameless `role=heading` span resolves
  to `name:null` and is invisible to heading navigation even though it sits in the
  outline). This is handed to you; you do not query nodes yourself.
- **VSR announcement** — the realism-corrected screen-reader transcript of the
  page title and the heading-navigation order, exactly as an AT user would hear it.
  Read it as the announced reality; do not re-derive it.
- **Declared vision crops** — the screenshots the collector marked relevant:
  the rendered title/tab, and the page regions where *visual* section headers
  appear. Map those visual section headers onto the handed DOM heading list — a
  visual section with no corresponding heading element is the 1.3.1 gap.

## WCAG soundness caveats (these STOP a false clear or a false barrier)
- **Don't clear on a clean axe run.** axe passes a present-but-generic title and a
  named-but-uninformative heading. "Descriptive enough" (2.4.2 / 2.4.6) is the
  residue handed to *you*; a green deterministic check is not a clear here.
- **Don't barrier on best-practice.** Heading-level skips, missing `<h1>`, and
  missing `main`/`nav` landmarks are **best-practice, NOT a 1.3.1** failure. Tag
  them `best-practice`; do not count them as conformance violations.
- **Repetition is not a failure.** Duplicate heading *text* alone is not a 1.3.1
  or 2.4.6 failure — record it, don't barrier on it.
- **2.4.10 is AAA.** Cite Section Headings only for "are headings used to organize
  content," and mark it AAA — never fold it into the A/AA verdict.
- **Absence vs. wrong relationship.** Plain absence of a landmark is best-practice;
  a present-but-mis-typed/duplicated-unlabelled landmark is a real 1.3.1 defect.

## Output
One line: **verdict — REPRODUCED** (normative 2.4.2 / 2.4.6 / 1.3.1 failure in the
handed evidence) / **NOT REPRODUCED** (outline coherent, title and headings
descriptive) / **PARTIAL** (some obligations met, descriptiveness/relationship
residue still fails, or best-practice findings recorded alongside a clear normative
result) / **N-A** (no page-structure obligation in scope) — with the SC, the level,
and the one piece of handed evidence that decides it.
