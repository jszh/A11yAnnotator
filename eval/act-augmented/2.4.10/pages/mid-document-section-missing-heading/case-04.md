# case-04 — Government services page: final "How to appeal a refusal" section is a landmark region with an aria-label but no heading

## Scenario
A city parking-permit guidance page is organised into four topical sections: **Who can
apply**, **What you'll need**, **Fees**, and (last) **How to appeal a refusal**. The first
three are `<section role="region">` each introduced by a visible `<h2>`. The fourth — a
substantive appeals section (eligibility, the 21-day window, evidence to submit, the review
process, escalation to the adjudicator) — is *also* a `<section role="region">` and even
carries `aria-label="Appeals"`, but it has **no heading element**; its visible title is a
styled `<p class="region-title">`. POSITION = LAST, so the gap is at the end of the page.

## Attribute tuple
- **content-domain**: government / civic services portal (parking permit)
- **UI-component/pattern**: landmark regions (`role="region"`) for page sections
- **host-language construct**: `<section role="region" aria-labelledby>` with `<h2>` for
  three sections; the appeals section uses `role="region" aria-label="Appeals"` + a styled
  `<p>` title and **no heading**
- **locale/i18n**: en-GB
- **failure-mechanism**: an `aria-label` on a region names the *landmark* but is **not a
  heading** — it produces no heading-outline entry; the developer substituted a landmark
  label for a section heading (ARIA anti-pattern: region labelled but un-headed)

## Developer persona
A government front-end developer follows an internal pattern library that wraps every page
block in `<section role="region">` and insists each region have an accessible name. For
three blocks they used `aria-labelledby` pointing at the visible `<h2>`. For the appeals
block — added later by a different contractor — they reached for the quicker
`aria-label="Appeals"` and styled a `<p>` to look like the other titles, believing "the
region has a name, so it's accessible." They conflated *landmark name* with *section
heading*, so the appeals block has a name in the landmarks list but no entry in the
headings list.

## Element / selector carrying the issue
- FAIL: `section[role="region"][aria-label="Appeals"]` contains a `p.region-title` ("How to
  appeal a refusal") instead of an `<h2>`. It is a distinct content section with no heading,
  while `Who can apply`, `What you'll need`, and `Fees` each have an `<h2>`.

## Exact accessibility mechanism
Screen-reader users navigate long-form content two ways: by **heading** (h-key / heading
list) and by **landmark** (d-key / landmarks list). This page exposes the appeals block to
the *landmarks* list (as a region named "Appeals") but **not to the headings list**. A user
who skims the heading outline — the more common skim for an article-style guidance page —
hears:

> "Who can apply, h2 · What you'll need, h2 · Fees, h2."

The appeals section is **absent from the outline**, so a blind resident who has just been
refused a permit and is hunting for "how do I challenge this?" finds no heading for it and
may conclude the page does not cover appeals. Worse, the landmark name "Appeals" is terse
and differs from the visible title "How to appeal a refusal", so even a user who switches to
the landmarks list gets a different, less informative label than sighted users see. The
visible "How to appeal a refusal" text is a `<p>` with no role/level — read as ordinary
body text. A region label is not a substitute for a heading: 2.4.10 requires a *heading*
that introduces each section.

## Expected ACT-style outcome
**failed** — the page is organised into sections and the final appeals section has no
heading introducing it, while its sibling sections do. The page passes ACT 047fe0 (it has
`<h1>` and `<h2>` headings for non-repeated content); the violation is the per-section
missing heading on the last section, masked by a landmark `aria-label`.

## Why automated tools miss it
The page has one `<h1>` and three valid `<h2>`s (no empty heading, no skipped level), and
the appeals region is a *well-formed* landmark with a non-empty accessible name — so axe-core
will not flag it under any landmark or heading rule (a region with an `aria-label` is
considered correctly named). axe/WAVE/Lighthouse have no rule that says "this landmark
should additionally contain a heading," and certainly none that reads the region's prose to
decide it is a distinct content section. The presence of `role="region"` + `aria-label`
actively *masks* the gap from naive tools by making the block look fully labelled.
Distinguishing a landmark name from a required section heading, and judging that the appeals
prose is a substantive section needing its own heading, is human reasoning the ACT corpus
never exercises.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content, facilitates navigation within the content, and
> provides mental 'handles' that aid in comprehension of the content."

> **WCAG 2.2 Understanding 2.4.10 — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."

> **WCAG Techniques — G141: Organizing a page using headings (When to Use / Tests)**
> "Pages with content organized into sections. … Check that a heading for each section
> exists."
