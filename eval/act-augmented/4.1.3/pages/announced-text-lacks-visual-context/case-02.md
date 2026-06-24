# case-02 — Per-row "Saved ✓" announces the action but not which lead (row position is the only locator)

## Scenario
A SaaS CRM ("Northwind CRM") leads pipeline grid. Each row is a lead (name + company). Changing the
Stage `<select>` in a row autosaves and injects a green "Saved ✓" confirmation into that row's own
per-row live region. The region is a correct `role="status"` / `aria-atomic="true"` element, empty
before the update and filled atomically, so the whole "Saved" string is announced. But the status text
names only the action — never the *subject*. Which lead was saved is conveyed solely by which row the
checkmark visually lands in.

## Attribute tuple
- **content-domain:** SaaS CRM / sales pipeline dashboard
- **UI-component/pattern:** editable data grid with per-row status cell (APG grid + status)
- **host-language construct:** one `<span role="status" aria-live="polite" aria-atomic="true">` per `<tr>`, filled via `innerHTML` on `change`
- **locale/i18n:** en
- **failure-mechanism:** announced string lacks the row identity that visible position supplies — no offscreen lead name added to the per-row status

## Developer persona
A senior engineer who deliberately built *per-row* live regions (instead of one shared toast) thinking
that would make the announcement contextual — "the region is inside the row, so AT will know the row."
They also gave every Stage select an excellent accessible name including the lead and company. But a
live region announces only its own atomic contents, not its DOM ancestors; sitting inside the `<tr>`
does not make the row name part of the announcement. The developer reasoned spatially ("it's in the
row") instead of testing what the region's atomic string actually says.

## Element / selector carrying the issue
The per-row status spans `#r1`–`#r4` (`td.rowstatus > span[role="status"][aria-atomic="true"]`). On
save each receives `Saved ✓` with no lead name. The lead identity exists only in the sibling
`.lead-name` cell at the start of the same visual row.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user tabs to Dana Whitfield's Stage select (accessible name correctly says "Stage for
Dana Whitfield, Cobalt Health"), picks "Negotiation," and moves on. The polite live region in that row
fires and the screen reader announces "Saved" (with the checkmark `aria-hidden`). The announcement does
**not** include "Dana Whitfield" — a live region speaks its own atomic contents, not the row's other
cells. If the user has changed several leads in a session, "Saved" announcements are indistinguishable;
they cannot confirm *which* record was persisted. A sighted user has zero ambiguity because the green
check appears in Dana's row. The fix is to include offscreen row context in the status, e.g.
`Saved — Dana Whitfield, Cobalt Health`, so the AT string carries the subject the layout shows. This
is the "Non-displayed text specific to AT users" remediation; it was not applied.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Every live region is structurally valid and present before the update; the injected content is
non-empty; the form controls have rich accessible names. axe/WAVE/Lighthouse confirm the live region
exists and announces, and find no missing role/property (so it is not even an F103 candidate). No
automated rule asserts that a status string must identify its *subject* when the subject is established
only by table-row position. Recognizing that "Saved" is ambiguous specifically because the lead name is
a different cell in the same visual row — and that the announcement omits it — requires reasoning about
table semantics and visual grouping, which is human judgment.

## Citation
> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — "Non-displayed text specific to AT users":**
> "There may be cases where the addition of visible text does not by itself convey sufficient
> information to the user of assistive technology. For example, the proximity of new content to other
> pieces of information on the screen may provide a visual context that is lacking in the text alone."

> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — "Non-displayed text specific to AT users":**
> "In such cases, authors may wish to designate additional content for inclusion in the status message,
> including non-displayed text which can be provided to the assistive technologies, for added context."

> **WCAG Technique ARIA22, `wcag-techniques/aria/ARIA22.html` — Tests / Procedure step 3:**
> "Check that elements or attributes that provide information equivalent to the visual experience for
> the status message ... also reside in the container."
