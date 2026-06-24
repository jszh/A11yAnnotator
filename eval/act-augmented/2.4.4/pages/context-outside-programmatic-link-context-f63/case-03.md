# case-03 — Definition list: recording title in `<dt>`, bare "Listen" link in `<dd>`

## Scenario
An investor-relations "Events & Presentations" page for a fictional public company (Heliograph
Systems). A description list pairs each earnings-call/investor-day recording title with a pill-shaped
"Listen" link. The recording's identity ("Q1 FY2025 earnings call", "2025 Investor Day keynote",
"Q4 FY2024 earnings call") lives entirely in the `<dt>`; the link is alone in the `<dd>` with the
accessible name "Listen". Three different recordings, three identical "Listen" links.

## Attribute tuple
- **content-domain:** corporate / investor relations (financial filings & webcasts)
- **UI-component/pattern:** `<dl>` term/description pairs with an icon+text "Listen" action button
- **host-language construct:** `<dt>` (term = description) and `<dd>` (definition = the bare link); CSS grid lays them side by side
- **locale/i18n:** en
- **failure-mechanism:** F63 — dt/dd association is NOT in the enumerated programmatic-context set; the describing text is outside the link's container

## Developer persona
A front-end developer chose a definition list because semantically "each call title defines a media
item" felt right, and `<dl>` is the WAI-ARIA-friendly grouping they'd seen in a name/value pattern.
They put the human label in the `<dt>` and the action in the `<dd>`, assuming the `<dt>`–`<dd>`
pairing would carry over to the link. They never added `aria-labelledby` because the layout (grid:
title on the left, button on the right) already "associates" them to a sighted eye.

## Element / selector carrying the issue
Each `dl.media dd > a.listen` (hrefs `/webcast/q1-fy25`, `/webcast/investor-day-25`,
`/webcast/q4-fy24`), accessible name "Listen" (the SVG is `aria-hidden`). The describing text is in
the sibling `<dt>`, which is not the link's sentence, paragraph, list item, table cell, or an
associated table header — and there is no ARIA name/description tying the `<dt>` to the `<a>`.

## Exact accessibility mechanism (what AT experiences, why it fails)
The enumerated forms of "programmatically determined link context" are: same sentence, same
paragraph, same list item, same table cell, or the associated table header cell — *plus* an ARIA
property such as `aria-label`/`aria-labelledby`. A `<dt>` is none of those. A screen-reader user
arriving on the `<dd>` link, or pulling up the Links list, hears only "Listen, link" three times.
HTML's `<dt>`/`<dd>` grouping is a visual/semantic convenience for sighted readers; it does NOT make
the `<dt>` the link's programmatic context, and screen readers do not announce the matching `<dt>`
when focus lands on the link. To learn which call they are opening, the user must leave the link and
hunt for the `<dt>` — the F63 failure. This is precisely the "arguably not in the enumerated list"
dt/dd judgment the aspect targets.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The `<dl>`/`<dt>`/`<dd>` markup is valid and well-formed, each "Listen" link has a non-empty
accessible name, the decorative SVG is correctly `aria-hidden`, and contrast passes. axe-core/WAVE/
Lighthouse have no rule that says "a `<dt>` does not count as a `<dd>` link's programmatic context" —
that is a fine semantic distinction about which DOM relationships WCAG enumerates as "associated".
Deciding it requires (a) reading WCAG's closed list of associated contexts and (b) judging that
"Listen" alone is under-descriptive — neither of which a static scanner can do.

## Citation
> **WCAG 2.2 Understanding — Understanding Link Purpose (In Context), Intent:**
> "This can be achieved by putting the description of the link in the same sentence, paragraph, list item, or table cell as the link, or in the table header cell for a link in a data table, because these are directly associated with the link itself. Alternatively, authors may choose to use an ARIA technique to associate additional text on the page with the link."

(Verbatim from `wcag-understanding/link-purpose-in-context.html`. A `<dt>` is not in this enumerated set, and no ARIA technique is used here.)

> **Trusted Tester v5.1.3 — SC 2.4.4, Note:**
> "\"Programmatically determined link context\" is **limited** to same sentence/paragraph/list-item/table-cell or associated table header — not arbitrary nearby text."

(Verbatim from `refs/trusted-tester/sc-2.4.4-link-purpose.md`. The `<dt>` is arbitrary nearby text relative to the `<dd>` link.)
