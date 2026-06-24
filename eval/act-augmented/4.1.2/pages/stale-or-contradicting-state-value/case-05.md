# case-05 — Sortable column shows a descending arrow but aria-sort="ascending" (government open-data table)

## Scenario
A Metro Transit Open Data page presents a "Weekday Route Punctuality" table of routes ranked by
on-time percentage. The "On-time %" column header shows a **down arrow (▼)** and the rows are clearly
sorted **descending** — 96.8%, 93.1%, 90.4%, … down to 71.2%. The caption even states the table is
sorted "from highest to lowest (descending)." But that header's `aria-sort` is hard-coded
`"ascending"`. The exposed sort direction is the opposite of both the visible arrow and the actual row
order.

## Attribute tuple
- **content-domain:** government / civic services open-data portal
- **UI-component/pattern:** sortable data table (`aria-sort` on a column header)
- **host-language construct:** `<th scope="col" aria-sort>` with a sort `<button>` and a glyph arrow
- **locale/i18n:** en
- **failure-mechanism:** `aria-sort` token value ("ascending") contradicts the rendered descending order + ▼ arrow

## Developer persona
A civic-data developer built a reusable sortable-table component. The default markup template for a
sorted column shipped with `aria-sort="ascending"` (the developer's "first state"), and the
server-side renderer that produces the down arrow and the high-to-low row order for the default view
sets the arrow and order but never overrides the template's `aria-sort` token. Clicking the header to
re-sort updates `aria-sort` correctly thereafter — but the **server-rendered default view** ships
`ascending` over descending data.

## Element / selector carrying the issue
`th[scope="col"][aria-sort="ascending"]` (the On-time % header) whose visible arrow is ▼ and whose
column rows descend 96.8% → 71.2%.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen reader announces the On-time % column header as "On-time %, **sorted ascending**." A
non-sighted user reasoning about the data therefore believes the worst-performing routes are listed
first and that route 12 (actually the best, 96.8%) is the lowest — the exact inverse of the truth.
`aria-sort` is the property that communicates current sort direction; its value here misrepresents the
component's actual state, so AT receives an incorrect value. The attribute is present and its token is
valid, so this is purely a value-correctness defect.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`aria-sort="ascending"` is one of the permitted tokens (`ascending` / `descending` / `other` / `none`)
for a column header, so ACT 5c01ea (state permitted on role) and 6a7281 (valid token value) pass, and
there is no missing-attribute trigger for 4e8ab6. A scanner cannot read the ▼ glyph as "descending,"
cannot perceive that the rows run high-to-low, and does no comparison between the rendered sort and the
exposed token. Determining that `aria-sort="ascending"` lies about a descending table requires reading
the arrow and the data order and matching them against the attribute — human/visual judgment.

## Citation
> **WCAG 2.2 SC 4.1.2 text (via `refs/trusted-tester/sc-4.1.2-name-role-value.md`):**
> "states, properties, and values that can be set by the user can be programmatically set; and
> notification of changes to these items is available to user agents, including assistive technologies."

> **WCAG 2.2 Understanding 4.1.2 (Intent), `wcag-understanding/name-role-value.html`:**
> "If custom controls are created, however, or interface elements are programmed (in code or script) to
> have a different role and/or function than usual, then additional measures need to be taken to ensure
> that the controls provide important and appropriate information to assistive technologies"

(The sort direction is "important and appropriate information"; an `aria-sort` that names the opposite
direction from the rendered sort fails to provide it correctly.)
