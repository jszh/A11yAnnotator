# case-02 — HTML-email layout table: document name and "View" link in different rows

## Scenario
A transactional HTML email from a credit union ("Riverbend Credit Union — June Statement Ready"),
rendered from `file://` as an email preview. The body is a classic email layout `<table>`. Each
document is described by a bold label row ("June 2025 Account Statement", "2024 Year-End Tax Form
(1099-INT)") followed, two rows later, by a separate `<td>` containing only a blue "View" button
link. The describing text is in a different table row/cell than the link.

## Attribute tuple
- **content-domain:** online banking / credit union statements
- **UI-component/pattern:** HTML-email layout table with bold "label" rows and separate "View" CTA rows
- **host-language construct:** `<table role="presentation">` (layout table); link `<a>` alone in its `<td>`, description in a sibling `<tr>` above
- **locale/i18n:** en
- **failure-mechanism:** F63 — context in an adjacent cell/row of a layout table (the canonical F63 "audio player" shape, modernized to a banking email)

## Developer persona
A marketing-ops developer assembled the email in a drag-and-drop email builder (Mailchimp/Klaviyo
style) where every content block becomes its own table row. They dropped a "Heading" block, a
"Subtext" block, then a "Button" block, and set the button label to the builder's default "View".
Because email clients strip many styles, they avoided putting the document name into the button. In
the visual preview the bold label sits right above the button, so it looks self-explanatory.

## Element / selector carrying the issue
The two `td.cta-cell > a.btn` links (hrefs `/docs/stmt-2025-06.pdf` and `/docs/1099int-2024.pdf`),
each with accessible name "View". Their describing labels are in earlier `tr > td.label-cell`
elements — a different cell and a different row.

## Exact accessibility mechanism (what AT experiences, why it fails)
The table is `role="presentation"`, so AT exposes no row/column structure and no header
relationships at all — it is pure layout. A screen-reader user on the Links list hears "View, link"
and "View, link" with nothing to tell a bank statement from a tax form. Programmatically determined
context for a link is limited to the link's own sentence/paragraph/list-item/table cell, or an
associated `<th>`; here the cell holds only "View", there is no `<th>` (and could be none — it is a
presentation table), and no `aria-label`/`aria-labelledby` ties the button to the label row above.
The describing label is therefore arbitrary nearby content the user must leave the link to find,
which is exactly the F63 failure condition.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Both links have non-empty accessible names, valid hrefs, and good contrast; the table is correctly
marked `role="presentation"` so no "layout table used as data table" heuristic fires. axe-core, WAVE,
and Lighthouse see two well-formed "View" links and pass. No tool can know that "View" is
under-descriptive *and* that the only disambiguating text sits in a non-associated row above — that
requires understanding that a presentation table provides no programmatic association and that "View"
alone does not convey the link's purpose. This is the F63 adjacent-cell shape that the corpus only
exercises with the W3C audio-player/Gutenberg fixtures.

## Citation
> **WCAG Technique F63 — Examples, "A Link in an Adjacent Cell Within a Layout Table":**
> "An audio site provides links to where its player can be downloaded. The information about what would be downloaded by the link is in the preceding row of the layout table, which is not programmatically determined context for the link."

(Verbatim from `wcag-techniques/failures/F63.html`. Here the document name is in a preceding row of a layout table, identical in shape.)

> **WCAG Technique F63 — Description:**
> "then the user will not be able to find out where the link is going with any ease. If the user must leave the link to search for the context, the context is not programmatically determined link context and this failure condition occurs."

(Verbatim from `wcag-techniques/failures/F63.html`.)
