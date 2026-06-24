# case-05 — Sworn witness statement: consecutively-numbered evidentiary paragraphs that are NOT topical sections (PASS)

## Scenario
A court public-records portal reproduces a verbatim sworn witness statement. Legal drafting
convention numbers **every paragraph consecutively** (1, 2, 3 …) so that any sentence can be
cited precisely in later argument ("see paragraph 5 of the Fenwick statement"). But those
numbers are a *citation device*, not topical section divisions. The statement is one
continuous, first-person, chronological account of what the witness saw on a single evening —
leaving the bakery, hearing the lorry, the collision, staying with the injured plaintiff, the
jurat. It does not break into topics ("Background", "Observation", "Conclusion"); paragraph 6
flows straight into paragraph 7 as one narrative. It is a pre-existing legal filing reproduced
verbatim — headings cannot be inserted and would be alien to the genre. So 2.4.10 does not
apply: **PASS / inapplicable**.

The long-tail trap this case probes: a numbered list *looks like* "sections that each need a
heading." Here it is not — it is sequential evidentiary paragraphs of one account. The only
heading is the court registry's filing label (`<h1>` "Witness Statement of Margaret A.
Fenwick"), which labels the *artefact*, not a section inside it.

## Attribute tuple
- **content-domain**: legal / court records (public filing portal)
- **UI-component/pattern**: verbatim document reproduction with a case caption and jurat
- **host-language construct**: `<ol class="statement">` with CSS counter-numbered `<li>`s (one continuous narrative); a registry `<h1>`; **no** `<h2>`..`<h6>`
- **locale/i18n**: en (common-law witness-statement / jurat conventions)
- **failure-mechanism**: NONE — false-positive guard; the consecutive numbering is a legal-citation device, not topical sectioning, so the heading-less continuous account is correct

## Developer persona
A court-IT developer building the read-only public-records viewer. Filings are ingested and
displayed *exactly as filed* — altering the substance of a sworn document is unthinkable in
this context. The developer rendered the numbered paragraphs as an `<ol>` (faithful to the
filed format) and gave the *record* an `<h1>` from the docket metadata. They would never inject
topical headings into an affidavit: the numbers are the document's own reference scheme and
the statement is a single sworn narrative.

## Element / selector carrying the issue
- No issue. Relevant: `ol.statement > li` (the nine consecutively-numbered evidentiary
  paragraphs of one continuous account). The `h1` is the registry's filing label, outside the
  statement's prose.

## Exact accessibility mechanism
A screen-reader user navigating by list/items hears nine numbered paragraphs read as a single
chronological account — which is exactly how a sighted reader and the court itself read it. The
heading list shows one entry: the filing label. There are **no topical sections to jump
between**: paragraph 5 (the lorry reversing) and paragraph 7 (the impact) are consecutive
beats of one event, not separable subjects. Imposing headings would be impossible (this is a
pre-existing sworn document) and meaningless (there are no topics to title). Because the
content is not "organized into sections," 2.4.10's precondition is unmet and the criterion is
satisfied. The numbering must not be mistaken for sectioning — that is the precise judgment the
case forces.

## Expected ACT-style outcome
**passed** (inapplicable — consecutively-numbered evidentiary paragraphs of one continuous
account are not "sections" within the meaning of 2.4.10). Flagging it for "no heading per list
item" would be a **false positive** against a pre-existing legal document.

## Why automated tools miss it
An `<ol>` of `<li>`s with no `<h2>`..`<h6>` is structurally identical whether the items are
"topical sections that each need a heading" or "sequential evidentiary paragraphs of one
account." axe-core has no rule that fires (valid single `<h1>`; no empty/disordered headings;
a well-formed list). A heuristic that flagged "numbered blocks without headings" would
*wrongly* fail every affidavit, contract recital, and legislative section-list — all of which
number for citation, not sectioning. Only reading the nine paragraphs reveals they are one
continuous chronological narrative, and only knowing the genre (a sworn statement) explains why
the numbering is a reference device. That is human semantic + domain judgment, beyond any
automated checker.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent (applicability gate)**
> "The intent of this success criterion is to provide headings for sections of a web page,
> when the page is organized into sections."

> **WCAG 2.2 Understanding 2.4.10 — Intent**
> "This provision is included at Level AAA because it cannot be applied to all types of
> content and it may not always be possible to insert headings. For example, when posting a
> pre-existing document to the web, headings that an author did not include in the original
> document cannot be inserted."

> **WCAG Techniques — G141: Organizing a page using headings (When to Use)**
> "Pages with content organized into sections."
