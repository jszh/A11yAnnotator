# case-04 — Sortable table: rows re-sort but aria-sort never moves off the original column

## Scenario
A SaaS analytics dashboard ("Pulsegrid") has a sortable campaign-performance table. Each column header is a button inside a `<th>` carrying `aria-sort`. The initial sort (Spend, descending) is correctly marked `aria-sort="descending"` with the others `aria-sort="none"`. Clicking another header re-orders the rows and moves a visible ▲/▼ arrow (via a `data-active` flag), but the handler never rewrites any `aria-sort` attribute.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard (marketing campaign metrics)
- **UI-component / pattern:** sortable data table (`th[aria-sort]` column headers) — a long-tail interactive value
- **host-language construct:** native `<table>` with `aria-sort` on `<th>`, sort driven by re-rendering `<tr>` nodes + a CSS `data-active` arrow
- **locale / i18n:** en-US
- **failure-mechanism:** the user-settable "current sort" value is exposed via `aria-sort` but is frozen on the initial column; only the row order and a CSS arrow update (notify limb broken)

## Developer persona
A data-viz frontend developer was diligent about the *initial* ARIA — they set `aria-sort="descending"` on the default Spend column and `"none"` elsewhere, so it audits clean. But their sort routine focused on the visible result: it re-renders the `<tbody>` and toggles a `data-active` class that drives the arrow glyph via CSS. They never added `setAttribute('aria-sort', ...)` because "the arrow already shows it."

## Element / selector carrying the issue
The four `th[aria-sort]` headers, especially `th[data-key="spend"]` (stuck at `descending`) and the other headers (stuck at `none`). After interaction, `aria-sort` no longer reflects the active sort column or direction.

## Exact accessibility mechanism (what AT experiences, why it fails)
- On load, AT announces the Spend column as "sorted descending" and the rows match — initial role/structure/value are all valid.
- The user activates "Conversions": the rows genuinely re-sort (verified: first row changes from "Product Launch Teaser" to "Webinar Invite") and a sighted user sees the ▲/▼ arrow jump to Conversions.
- But every `aria-sort` is unchanged: Conversions stays `"none"`, Spend stays `"descending"`. AT therefore tells the user the table is still sorted by Spend descending — contradicting both the visible state and the actual row order.
- The current-sort value the user set is not programmatically updated and its change is not **notified** to AT.

Verified with Puppeteer: after clicking the Conversions header, `th[data-key="conv"]` `aria-sort` = `none`, `th[data-key="spend"]` `aria-sort` = `descending`, `data-active` moved to Conversions, and the first row changed.

## Expected ACT-style outcome
**failed** (SC 4.1.2 — the user-settable sort state exposed via `aria-sort` is not updated/notified when the user changes it).

## Why automated tools miss it
The initial snapshot is exemplary: valid table semantics, exactly one `aria-sort="descending"` and the rest `"none"` — every static ARIA-value rule passes, and there is no "invalid aria-sort" or "missing state" to flag. The failure is that the *value* never changes when the user sorts; catching it requires activating a different header and then re-reading `aria-sort` to confirm it tracks the new column/direction. No static scanner performs that operate-then-observe step, so this interactive set/notify failure is invisible to axe/WAVE/Lighthouse.

## Citation
> "states, properties, and values that can be set by the user can be programmatically set; and **notification of changes** to these items is available to user agents, including assistive technologies."
— refs/trusted-tester/sc-4.1.2-name-role-value.md (WCAG SC 4.1.2 text)

> "However, when custom controls are created, it is up to the control's author to ensure that the control is correctly exposed to users via the platform's accessibility API. If this is not done, then assistive technologies will not be able to understand what the control is or how to operate it..."
— wcag-techniques/failures/F15.html (Description — exposing semantics "incompletely")
