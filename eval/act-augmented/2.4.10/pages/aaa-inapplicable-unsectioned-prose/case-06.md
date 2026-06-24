# case-06 — Continuous dated journal entry, multi-topic stream of consciousness (no section headings)

## Scenario
A journaling app's single-entry view shows one day from a solo sailor's field journal (Day 47
of a Pacific crossing). In one continuous stream of reflection the writer drifts across several
topics — the wind shift and sea state, a windvane repair, a remembered argument with their
father at the dock, what they ate, a pod of dolphins, the dusk doubt about going on. These are
not "sections": they are the natural associative wandering of one person's daily entry, written
as continuous prose. A diary entry is exactly the "long letter / personal document" genre the
AAA note exempts — "putting headings into a letter would be very strange," and the same is
true of a private journal entry. So 2.4.10 does not apply: **PASS / inapplicable**. The date
"21 March" is the entry's `<h1>` label; the entry body has no internal headings, correctly.

## Attribute tuple
- **content-domain**: personal journaling / lifelogging app (long-form private diary)
- **UI-component/pattern**: single-entry reader view with prev/next entry navigation
- **host-language construct**: `<article>` of `<p>` elements (one continuous entry); a date `<h1>`; **no** `<h2>`..`<h6>`
- **locale/i18n**: en, informal first-person diction
- **failure-mechanism**: NONE — false-positive guard; a free-associating dated journal entry is genuinely unsectioned personal prose where headings would be inappropriate

## Developer persona
A solo indie developer building a minimalist journaling app. The product philosophy is "an
entry is a single uninterrupted thought" — the editor is deliberately one plain text body with
no heading toolbar, because the maker believes forcing structure onto a diary ruins it. The
entry-view template renders the entry's date as the `<h1>` and the body as paragraphs. There is
no heading control to misuse and no missing structure: a journal entry has none by design and
by genre.

## Element / selector carrying the issue
- No issue. Relevant: `article > p` (the continuous multi-topic entry body, correctly
  heading-less). The `h1` is the entry's date label, not a heading inside the reflection.

## Exact accessibility mechanism
A screen-reader user reading the entry hears the date heading, then the body as one continuous
voice moving naturally from the wind to the windvane to the father to the onions to the
dolphins to the dusk doubt — precisely the way the writer thought it and the way a sighted
reader reads it. The heading list shows one entry (the date). There are no topics to jump
between: the dolphins paragraph and the doubt paragraph are emotionally and temporally
continuous, not separable subjects a reader would navigate to in isolation. Imposing headings
("Weather / Repairs / Family / Meals / Wildlife / Doubts") would fracture an intimate
continuous reflection into a bureaucratic outline and would be exactly the "very strange"
move the AAA note warns against. The content is not "organized into sections," so the
precondition for 2.4.10 is unmet and the criterion is satisfied.

## Expected ACT-style outcome
**passed** (inapplicable — a continuous personal journal entry is genuinely unsectioned prose).
Flagging it for "lacks section headings" would be a **false positive**.

## Why automated tools miss it
The entry body is `<article>`/`<p>` with no `<h2>`..`<h6>` — the same markup shape as a
sectioned article that forgot its headings (cf. case-04). axe-core, WAVE, and Lighthouse see a
valid single-`<h1>` document with no empty or disordered headings and report nothing; a naive
"long text, few headings" heuristic would *wrongly* flag it. The only way to reach PASS is to
read the prose, recognise the genre (a personal, free-associating diary entry), and apply the
human judgment that such writing is not "organized into sections" and that headings would be
inappropriate. No automated checker can recognise diaristic stream-of-consciousness or weigh
authorial intent, which is exactly why this realistic inapplicability case is absent from the
ACT corpus's degenerate stubs.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent**
> "This provision is included at Level AAA because it cannot be applied to all types of
> content and it may not always be possible to insert headings. … Or, a long letter would
> often cover different topics, but putting headings into a letter would be very strange."

> **WCAG 2.2 Understanding 2.4.10 — Intent (applicability gate)**
> "The intent of this success criterion is to provide headings for sections of a web page,
> when the page is organized into sections."

> **WCAG Techniques — G141: Organizing a page using headings (When to Use)**
> "Pages with content organized into sections."
