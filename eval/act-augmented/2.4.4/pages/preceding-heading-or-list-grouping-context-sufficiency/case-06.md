# case-06 — Arabic pharmacy portal: "PDF" rescued by its `<dt>` grouping above, but an orphaned "PDF" in a "see also" strip is tied to no document (FAIL)

## Scenario
An Arabic-language (RTL) pharmacy patient portal lists patient forms. Each form is offered in two formats
under a definition-list term: `<dt>` names the document (e.g. "استمارة طلب صرف الأدوية" / "Medication refill
request form") and the following `<dd>` holds short format links: HTML / PDF / Word. The `<dt>` grouping
carries purpose for those links the way H80's preceding heading does — so those instances are determinable
*in context*. The defect is scenario 5 applied to a non-heading grouping: at the bottom a "روابط إضافية"
("Additional links") strip repeats a bare **PDF** link that is not inside any `<dt>/<dd>` document grouping
and has no document name anywhere near it. The same short link text "PDF" is rescued by its grouping in one
place and orphaned in another — and the orphaned one fails. This exercises grouping-other-than-heading
(definition list) plus an i18n RTL context.

## Attribute tuple
- **Content domain:** healthcare / pharmacy patient portal
- **UI component / pattern:** documents-in-multiple-formats grouped by a definition-list term (`<dt>`), plus a loose "see also" links strip
- **Host-language construct:** `<dl>`/`<dt>`/`<dd>` grouping as the purpose carrier (not an `<h*>` heading); a trailing `<p>` of bare format links with no grouping
- **Locale / i18n:** Arabic (`lang="ar" dir="rtl"`), with `lang="en"` on the Latin format words ("PDF", "Word")
- **Failure mechanism:** one "PDF" link is in a `<dd>` whose `<dt>` names the document (determinable); the trailing "PDF" link is in no document grouping (not determinable) — same text, mixed outcome

## Developer persona
A back-end-leaning developer localising a portal to Arabic. They correctly modelled the forms list as a
definition list (`<dt>` term + `<dd>` formats) because it read naturally as "term → its downloads". Late in
the project a stakeholder asked to "also surface the opening-hours sheet and the new tariff PDF somewhere
handy", so the dev dropped a quick "Additional links" box at the bottom with two bare links. They set `lang`
on the Latin format words to avoid the screen reader mispronouncing "PDF" in Arabic — careful about i18n,
but they never reconsidered whether the bare "PDF" in the loose box still had a document to belong to.

## Element / selector carrying the issue
`section.also p a[href="/docs/2024-tariff.pdf"]` — the orphaned "PDF" link. Its only nearby text is the
generic group heading "روابط إضافية" ("Additional links"), which names no document. By contrast the passing
instances are `dl dd a` whose `<dt>` (e.g. `#doc-refill`, `#doc-consent`) names the document.

## Exact accessibility mechanism
Inside the `<dl>`, a `<dt>` is the grouping term for its `<dd>` content; a screen-reader user reading a "PDF"
link in the `<dd>` can read the current term and learn it is "the medication refill request form, PDF" — the
grouping supplies purpose, so those links are determinable in context (effectively passing). The trailing
"PDF" in the "Additional links" `<p>` has no `<dt>`, no document heading, and no `aria-label`: its
programmatically determined context is only the generic strip title "روابط إضافية", which does not name a
document. A user pulling up the links list hears multiple "PDF" links; the ones under a `<dt>` resolve by
their term, but the orphaned one resolves to nothing — the user cannot tell it is the 2024 tariff. The link
text combined with any programmatically determinable context does not describe the purpose. (The page passes
where the grouping carries purpose and fails where the grouping is absent, so the page as a whole fails.)

## Expected ACT-style outcome
**failed** (SC 2.4.4 — at least one link, the orphaned "PDF" in the "Additional links" strip, has a purpose
that cannot be determined from the link text together with its programmatically determined context; the
`<dt>`-grouped instances are determinable, but the page contains a failing link).

## Why automated tools miss it
Every link has non-empty text ("HTML", "PDF", "Word"), so c487ae / axe `link-name` passes; the `lang`
attributes are valid. A tool cannot distinguish the "PDF" that *is* rescued by its preceding `<dt>` term from
the one that is *not* — both are syntactically identical `<a>PDF</a>` nodes. Judging that a `<dt>` term
functions as a sufficient grouping carrier (so those instances are fine) while the bare "PDF" in a generic
"Additional links" box is orphaned (so that one fails) requires reading the Arabic document names, knowing
that a `<dt>` groups its `<dd>`, and recognising the loose strip has no document context — a multi-step
semantic and structural judgment no checker performs.

## Citation
**Reference:** WCAG 2.2 Understanding — Link Purpose (In Context) (`wcag-understanding/link-purpose-in-context.html`)
> "This can be achieved by putting the description of the link in the same sentence, paragraph, list item, or table cell as the link, or in the table header cell for a link in a data table, because these are directly associated with the link itself."
> "whatever amount of context is available on the web page that can be used to interpret the purpose of the link must be made available in the link text or programmatically associated with the link to satisfy the success criterion."

**Reference:** WCAG Technique F63 — Failure due to providing link context only in content that is not related to the link (`wcag-techniques/failures/F63.html`)
> "If the context for the link is not provided in one of the following ways: in the same sentence, paragraph, list item, or table cell as the link; via a suitable ARIA property such as aria-label or aria-labelledby ... then the user will not be able to find out where the link is going with any ease."
