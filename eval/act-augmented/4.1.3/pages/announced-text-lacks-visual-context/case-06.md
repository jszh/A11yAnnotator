# case-06 — Pricing recommendation announces "Best value" with no plan name (column heading is the locator)

## Scenario
A SaaS pricing page ("Cadence project tracker") with three plan columns: Starter, Team, Business.
A "Team size" `<select>` recomputes which plan is the best value and moves a green "Best value" ribbon
to the winning column, while a shared `role="status"` / `aria-atomic="true"` live region updates to
announce the recommendation. But the region announces only "Best value." Which plan won is conveyed
solely by which column the ribbon visually sits over — and the column's identity is its heading
(`<h2>Starter/Team/Business</h2>`), which is outside the live region. The ribbon itself is
`aria-hidden`, so even it never reaches AT.

## Attribute tuple
- **content-domain:** SaaS subscription / pricing
- **UI-component/pattern:** comparison pricing table with a dynamic recommendation ribbon (column-header as locator)
- **host-language construct:** shared `<span role="status" aria-live="polite" aria-atomic="true">` set to "Best value"; per-column `.ribbon` is `aria-hidden`
- **locale/i18n:** en
- **failure-mechanism:** announced status names the recommendation but not its subject plan; the column heading that identifies the plan is visual-only context not added to the atomic region

## Developer persona
A growth/marketing engineer A/B-testing a "smart pricing" feature. They wired the team-size selector to
re-rank plans and added a live region so the recommendation would be announced (good instinct). They
wrote "Best value" because the ribbon visibly lands on the right column and the plan name is the big
heading directly above it — self-evident on screen. They set the ribbon `aria-hidden="true"` to avoid
it being read as stray text mid-column, not realizing that this also removes the *only* per-column hook
to the plan name, leaving AT with a context-free "Best value." They verified visually that the ribbon
jumps columns; they never listened to the announcement alone.

## Element / selector carrying the issue
`#bestStatus` (`span[role="status"][aria-live="polite"][aria-atomic="true"]`), set to `"Best value"`.
The plan identity lives in the column headings `#plan-team h2` etc. and in the `aria-hidden` `.ribbon`,
both outside the live region.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user changes "Team size" to "16–50 people." The ribbon moves to the Business column and
the polite live region updates; the screen reader announces "Best value." It does not announce
"Business," because the live region's atomic contents are just "Best value," the ribbon is
`aria-hidden`, and a live region does not read the column heading it visually aligns with. A sighted
user sees "Best value" pinned above the Business column heading and reads "Business is best value." The
AT user hears "Best value" three different times as they explore team sizes, with no way to know which
plan is recommended each time — the recommendation status is contextually empty. Remediation: announce
the plan name inside the atomic region, e.g. "Best value: Business plan."

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The live region is present before the update, valid, non-empty, and announced in full; each plan column
has a real `<h2>` heading; making the decorative ribbon `aria-hidden` is itself legitimate. So there is
no F103 missing-role failure, no empty-region failure, no heading failure. No automated rule states that
a recommendation status must name *which* item it recommends when the item's identity is conveyed by the
column heading the recommendation visually sits over. Recognizing that "Best value" is ambiguous
precisely because the plan name is a separate column heading — and that the `aria-hidden` ribbon removed
the last programmatic link — requires reasoning about visual column structure and meaning, i.e. human
judgment.

## Citation
> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — "Non-displayed text specific to AT users":**
> "There may be cases where the addition of visible text does not by itself convey sufficient
> information to the user of assistive technology. For example, the proximity of new content to other
> pieces of information on the screen may provide a visual context that is lacking in the text alone.
> In such cases, authors may wish to designate additional content for inclusion in the status message,
> including non-displayed text which can be provided to the assistive technologies, for added context."

> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — Benefits:**
> "The ability of an assistive technology to announce such new important text content allows more users
> to benefit from an awareness of the information in an equivalent manner."

> **WCAG Technique ARIA22, `wcag-techniques/aria/ARIA22.html` — Description:**
> "Such additional context can be critical where the status message text alone will not provide an
> equivalent to the visual experience."
