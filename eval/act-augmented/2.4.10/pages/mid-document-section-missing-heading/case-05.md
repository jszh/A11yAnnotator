# case-05 — Terms of Service: the opening clause "1. Acceptable Use" is a Word-pasted fake-bold paragraph, not a heading

## Scenario
A Terms of Service document is organised into six numbered clause sections. Clauses **2–6**
("Your Content and Licence", "Fees, Billing and Renewal", "Service Availability",
"Termination", "Limitation of Liability") each carry a real `<h2>`. Clause **1. Acceptable
Use** — the substantive opening clause — is rendered as `<p class="MsoBodyText"><b>1.
Acceptable Use</b></p>`, a Word-pasted bold lead, **not a heading**. POSITION = FIRST: the
gap is the very first content section, so a screen-reader user's heading outline opens
*mid-document* at clause 2.

## Attribute tuple
- **content-domain**: legal / terms & policy (SaaS Terms of Service)
- **UI-component/pattern**: long-form numbered legal clauses
- **host-language construct**: `<h2>` per clause for clauses 2–6; clause 1 is
  `<p class="MsoBodyText"><b>…</b></p>` (mso fake-bold body text, not a heading)
- **locale/i18n**: en
- **failure-mechanism**: content-authoring source — pasted from Microsoft Word; the first
  clause's title was Word *body text with a bold run* (mso style) rather than Word "Heading
  2", so the CMS produced bold-in-paragraph instead of `<h2>`; the leading section is left
  un-headed while later siblings are headed

## Developer persona
A product manager drafted the terms in Microsoft Word and pasted them into the company CMS's
WYSIWYG editor. In Word, clauses 2-6 used the "Heading 2" paragraph style (so the CMS mapped
them to `<h2>`), but clause 1 had been typed earlier as ordinary body text with its title
manually **bolded** — a classic "fake heading." The paste preserved the `Mso…` class and the
`<b>` but produced a `<p>`, not a heading. On screen the bold "1. Acceptable Use" looks the
same as the other clause titles, and the numbering 1-6 reads uniformly, so nobody noticed
clause 1 fell out of the outline.

## Element / selector carrying the issue
- FAIL: `p.MsoBodyText > b` (text "1. Acceptable Use"). It is the first clause section's
  title but has no heading role. The document's heading outline therefore begins at
  `h2#c2` ("2. Your Content and Licence") — clause 1 is missing entirely.

## Exact accessibility mechanism
A screen-reader user reviewing a contract relies heavily on the heading list to jump between
clauses (and to find a specific clause by name). AT announces the outline as:

> "2. Your Content and Licence, h2 · 3. Fees, Billing and Renewal, h2 · 4. Service
> Availability, h2 · 5. Termination, h2 · 6. Limitation of Liability, h2."

The outline **starts at clause 2**. A blind user skimming clause titles sees the agreement
apparently begin at "2.", with no clause 1 — disorienting in a legal document where clause
order and completeness matter, and where "Acceptable Use" is the clause most likely to be
searched for. The "1. Acceptable Use" text is exposed as ordinary bold body text with no
role or level, so a user navigating heading-to-heading skips straight past the binding
acceptable-use obligations to clause 2. Because the missing heading is at the *start*, the
very first thing the heading navigator surfaces is already the second section — the leading
section has no programmatic boundary at all.

## Expected ACT-style outcome
**failed** — the document is organised into clause sections and the opening section (clause
1, Acceptable Use) has no heading, while clauses 2-6 do. The page passes ACT 047fe0 (it has
`<h1>` and `<h2>` headings for non-repeated content); the violation is the per-section
missing heading on the first section.

## Why automated tools miss it
Clauses 2-6 are five non-empty `<h2>` elements in correct order under a single `<h1>`, so
axe-core's `page-has-heading-one`, `empty-heading`, and `heading-order` all pass — there is
no *skipped* level (the headings just start at the second clause), no empty heading, and
`<b>` inside `<p>` is perfectly valid HTML. WAVE and Lighthouse see a clean heading
structure. The `Mso…` class and bold run are exactly what survives a Word paste and are
invisible to a structure checker, which has no concept of "fake heading." To flag this a tool
would have to read the contract, recognise that "1. Acceptable Use" is a clause section
equal in rank to clauses 2-6, and conclude that the *first* section is missing the heading
its siblings all have — a content-segmentation judgment. The ACT corpus, which only ever
removes the single document heading, never tests a leading-section-only gap like this.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent of Section Headings**
> "The intent of this success criterion is to provide headings for sections of a web page,
> when the page is organized into sections. … When such sections exist, they need to have
> headings that introduce them."

> **WCAG 2.2 Understanding 2.4.10 — In brief**
> "Where content is organized in sections, provide section headings."

> **WCAG Techniques — H69: Providing heading elements at the beginning of each section of content (Tests)**
> "Check that the content is divided into separate sections. Check that each section on the
> page starts with a heading."
