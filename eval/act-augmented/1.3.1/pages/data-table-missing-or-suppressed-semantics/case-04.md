# case-04 — Correct bus timetable suppressed with `role="presentation"` (F92)

## Scenario
A transit agency publishes the "Route 14" weekday morning timetable. Five stops run down
the side and four departures (Bus A–D) across the top; each cell is the time that bus
leaves that stop. This is the archetypal data table — a time like "7:25" is meaningless
without both its stop (row) and its bus (column). The markup is *textbook correct*:
a `<caption>`, a `<thead>` with `<th scope="col">` for each bus, and a
`<th scope="row">` for each stop, so every time cell is programmatically tied to its stop
and its bus. The author then placed `role="presentation"` on the `<table>`, which strips
all of that from the accessibility tree.

## Attribute tuple
- **content-domain:** public transit / scheduling
- **UI-component/pattern:** schedule grid (stops × departures)
- **host-language construct:** correct `<table>` (`<caption>` + `<th scope>`) + `role="presentation"`
- **locale/i18n:** en-US
- **failure-mechanism:** F92 — data-table semantics deliberately suppressed

## Developer persona
A front-end dev inherited a correctly-marked-up timetable but disliked the default table
borders and zebra striping bleeding through the agency's new design. Rather than override
the CSS, they pasted `role="presentation"` onto the `<table>` from a Stack Overflow answer
titled "remove table styling" — not realising the role removes the table's *semantics*,
not its appearance, and that the styling actually comes from their own CSS (which still
applies). Visually nothing changed, so it shipped.

## Element / selector carrying the issue
`table.tt[role="presentation"]` — the role on the `<table>` cascades suppression to its
required-owned descendants (`<thead>`, `<tr>`, `<th>`, `<td>` and all `scope`
associations). Verified in the Chromium accessibility tree: the table contributes **no**
`table`/`row`/`columnheader`/`rowheader`/`cell` nodes at all (snapshot `{}` for table
roles).

## Exact accessibility mechanism
`role="presentation"` removes the element's implicit semantics and the semantics of its
required-owned children from the accessibility API. A screen-reader user encounters no
table here — the content linearises into a flat run of text: "Stop Bus A Bus B Bus C Bus
D Maple St & 1st Ave 6:05 6:35 7:05 7:35 Riverside Park 6:14 …". There is no table mode,
no header announcement, no stop/bus association for any time. The header-to-data
relationship that *was* correctly encoded is now invisible to AT (TT 14.A fails — the
data table carries `role="presentation"`).

## Expected ACT-style outcome
**failed** (F92; Trusted Tester 14.A `1.3.1-table-identification`: "A data table with
`role="presentation"` will not convey table semantics and **fails** this test"). ACT
table rules a25f45/d0f69e are **inapplicable** (the suppressed table is removed from the
tree, so there is nothing for them to evaluate).

## Why automated tools miss it
ACT treats `role="presentation"`/`aria-hidden` purely as an **inapplicability** trigger:
the element leaves the accessibility tree, so structural rules simply don't apply — the
corpus never contains a real data table marked `role="presentation"` that should FAIL.
axe/WAVE/Lighthouse raise nothing because `role="presentation"` on a `<table>` is
perfectly valid for *layout* tables. The tool cannot tell whether the suppressed table is
harmless layout or a genuine data table whose semantics were wrongly stripped.
Distinguishing "correctly suppressed layout" from "wrongly suppressed data" requires a
human to judge that these times are unintelligible without their stop/bus headers — i.e.
that this IS data.

## Citation
> **Reference:** WCAG Techniques — F92 "Failure of Success Criterion 1.3.1 due to the use
> of role presentation on content which conveys semantic information"
> (`wcag-techniques/failures/F92.html`)
>
> **Quote (verbatim):** "This failure occurs when a role of presentation is applied to an
> element whose purpose is to convey information or relationships in the content. Elements
> such as `table`, can convey information about the content contained in them via their
> semantic markup." … "data tables need to retain their semantic information and should
> therefore not be marked up with role=presentation."

> **Reference:** Trusted Tester v5.1.3 — Test 14.A `1.3.1-table-identification`
> (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
>
> **Quote (verbatim):** "A data table with `role="presentation"` will not convey table
> semantics and **fails** this test."
