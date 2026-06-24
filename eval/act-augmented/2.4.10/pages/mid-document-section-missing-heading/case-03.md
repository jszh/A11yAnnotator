# case-03 — How-to article: Step 4 of a five-step procedure rendered as a bare bold paragraph instead of an `<h3>`

## Scenario
A plumbing how-to lays its procedure out as five numbered steps, each a sub-section under
an `<h3>` ("Step 1 — Shut off…", "Step 2 — …", "Step 3 — …", "Step 5 — …"). **Step 4 —
Re-tighten the nut to the correct point** is an equally substantial step (the torque
instruction plus a stripped-thread callout) but it appears as a `<p class="step-lead">`
(bold lead) followed by body paragraphs — **no `<h3>`**. The five steps read continuously on
screen, so a sighted reader never notices that one step dropped out of the heading outline.

## Attribute tuple
- **content-domain**: developer-docs-style how-to / DIY home repair
- **UI-component/pattern**: numbered step-by-step procedure (`<h3>` per step)
- **host-language construct**: `<h3>` step headings; the orphan step is `<p class="step-lead">`
  with `<strong>`-equivalent CSS bold, not a heading
- **locale/i18n**: en
- **failure-mechanism**: a Markdown→HTML render dropped one heading — the source line lost
  its leading `### `, so `### Step 4 …` became `**Step 4 …**`, emitting bold-in-paragraph
  rather than `<h3>`; a section in a *headed sequence* is left un-headed (content-authoring
  source: markdown renderer)

## Developer persona
A docs author writes in Markdown; the static-site generator turns `###` into `<h3>`. While
fixing a typo on the Step 4 line she accidentally deleted the `### ` prefix and, to keep it
looking like a heading in the rendered preview, wrapped it in `**…**`. The preview showed
bold text that looked like the other step titles, so the change passed her eyeball review.
The generator faithfully produced `<p><strong>Step 4 …</strong></p>` — visually right,
semantically a hole in the procedure's outline.

## Element / selector carrying the issue
- FAIL: `p.step-lead` (text "Step 4 — Re-tighten the nut to the correct point"). It is a
  procedural sub-section equivalent to its four `<h3>` siblings but has no heading role.
  The DOM heading order under Procedure runs `h3#step1, h3#step2, h3#step3, h3#step5` —
  Step 4 is missing from the outline.

## Exact accessibility mechanism
A screen-reader user following the repair pulls up the heading list to track their place in
the procedure, or arrows heading-to-heading from one step to the next. AT announces:

> "Step 1 — Shut off the supply…, h3 · Step 2 …, h3 · Step 3 …, h3 · Step 5 …, h3."

There is **no "Step 4" heading**. A blind reader jumping from Step 3 to the next heading
lands on **Step 5** and silently skips the entire re-tightening step — the step that
carries the critical "no more than three-quarters of a turn" warning and the stripped-thread
callout. The "Step 4" text is read, if reached linearly, as ordinary bold body text with no
role or level, so the user has no programmatic cue that a new step began. The danger here is
sharpened by sequence: because the visible *numbers* run 1-2-3-4-5, a sighted user assumes
all five are equivalent headings, but the outline a blind user navigates has only four.

## Expected ACT-style outcome
**failed** — the procedure is organised into step sections and one step section (Step 4) has
no heading, while its sibling steps do. The page passes ACT 047fe0 (it has `<h1>`, `<h2>`
and `<h3>` headings for non-repeated content); the violation is purely the per-section
missing heading inside an otherwise-headed sequence.

## Why automated tools miss it
The heading levels present are h1 → h2 → h3 with **no skipped level** — the document never
jumps from h3 to h5; the Step 4 heading is simply *absent*, leaving a perfectly legal
3,3,3,3 run. So axe-core's `heading-order` is satisfied, `empty-heading` is satisfied (no
empty heading exists), `page-has-heading-one` passes, and Lighthouse/WAVE report a clean
heading structure. There is no malformed token to catch. To flag this, a tool would have to
read the procedure, notice that "Step 4" names a step at the same level as Steps 1-3 and 5,
and conclude a heading is missing from the numbered sequence — a content-segmentation
judgment no checker makes. This per-step gap is exactly what the ACT corpus (which only ever
removes the *one* document heading) never tests.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent of Section Headings**
> "For instance, long documents are often divided into a variety of chapters, chapters have
> subtopics, etc. When such sections exist, they need to have headings that introduce them.
> This clearly indicates the organization of the content, facilitates navigation within the
> content, and provides mental 'handles' that aid in comprehension of the content."

> **WCAG Techniques — H69: Providing heading elements at the beginning of each section of content (Description)**
> "Since headings indicate the start of important sections of content, it is possible for
> users with assistive technology to jump directly to the appropriate heading and begin
> reading the content."

> **WCAG Techniques — H69 (Tests)**
> "Check that the content is divided into separate sections. Check that each section on the
> page starts with a heading."
