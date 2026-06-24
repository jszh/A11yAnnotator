# case-03 — Whole-row clickable `<tr>` navigation with no link/button semantics

## Scenario
The **Harbourline Realty** agent dashboard shows an "Active Listings" data table. A helper
line reads "Click a row to open the listing," and each `<tr>` behaves accordingly: hovering
highlights the entire row and shows a pointer cursor, and clicking navigates to that
property's detail page (`location.href`). Each row visually and behaviourally presents itself
as one large link to the listing. But the navigation lives on `<tr onclick="openListing(...)">`
with `cursor:pointer` — there is no `<a>` wrapping the row content, no `role` on the `<tr>`,
no `tabindex`, and the cells hold only plain text (and an inert status pill), so nothing
inside the row is focusable either.

## Attribute tuple
- **content-domain:** real-estate listings (agent/CRM dashboard)
- **UI-component / pattern:** clickable data-table row ("whole row is the link")
- **host-language construct:** `<tr onclick>` inside an otherwise-correct `<table>` (no `<a>`, no `role`, no `tabindex`)
- **locale / i18n:** en-GB place names
- **failure-mechanism:** scripted row presented as a link whose exposed role is the **generic table-row role**, not link/button (F42)

## Developer persona
A dashboard developer who knew their `<table>` semantics — they used `<thead>`, `<th scope="col">`,
and a `<caption>`, so the data table is textbook-correct. For the "open on click" interaction
they reached for the most common Stack Overflow pattern, `row.onclick = () => location.href = ...`,
plus a `cursor:pointer` hover. Because the table passed every accessibility linter they ran (it
*is* a valid data table), they never noticed that the clickable affordance itself has no
programmatic role and no keyboard path.

## Element / selector carrying the issue
- `tbody tr.listing` — four clickable rows. Each is the navigation control yet exposes the
  generic table-row role with no interactive semantics and no focusable child. (The table's
  header/caption markup is correct and is not the defect.)

## Exact accessibility mechanism (what AT experiences)
A sighted user sees a full-width hover highlight and pointer cursor and reads each row as a
link to the property. A screen-reader user navigating the table hears the cell contents as
ordinary data ("PX-2291, 14 Mariner's Walk Saltcoats, 3, Active, $649,000") with the row
exposed as a generic `row` — there is no announcement that the row is operable, it never
appears in the links list, and there is no cue that clicking opens anything. With no
`tabindex` anywhere in the row, a keyboard-only user cannot focus or activate any listing.
The link relationship that the hover/pointer/navigation behaviour conveys is not
programmatically determinable.

## Expected ACT-style outcome
**failed** — SC 1.3.1 Info and Relationships, F42 emulated-link path: a row presented as a
link via styling and scripted navigation exposes a generic role, so the control relationship
is not programmatically determinable. (The underlying data-table markup is correct and is not
the failing aspect.)

## Why automated tools miss it
The table itself is valid, so data-table checks pass. The `<tr>` has no `role`, so ACT's
1.3.1 role rules (4e8ab6, 674b10), which apply only when a role is present, never fire. Every
cell contains real text, so there is no empty-element or missing-attribute defect for a linter
to catch. axe / WAVE / Lighthouse cannot infer that a `<tr>` with `cursor:pointer` and an
`onclick` *is presented as* a link to the listing — recognising that "the whole row is the
control" and that its generic row role contradicts that is a visual/behavioural judgment no
static rule makes.

## Citation
**Reference:** WCAG Techniques — *F42: Failure of Success Criteria 1.3.1, 2.1.1, 2.1.3, or
4.1.2 when emulating links* (`wcag-techniques/failures/F42.html`).

> "For all elements presented as links which use JavaScript event handlers to make the element
> emulate a link: 1. Check if the programmatically determined role of the element is 'link'. …
> If check #1 is false then this failure condition applies and the content fails Success
> Criteria 1.3.1 Info and Relationships and 4.1.2 Name, Role, Value."

**Supporting reference:** WCAG 2.2 Understanding — *Info and Relationships* (Intent)
(`wcag-understanding/info-and-relationships.html`).

> "Having these structures and these relationships programmatically determined or available in
> text ensures that information important for comprehension will be perceivable to all."
