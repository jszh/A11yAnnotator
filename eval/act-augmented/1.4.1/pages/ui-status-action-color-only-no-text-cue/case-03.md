# case-03 — "Record updated" conveyed only by the row turning green (patient portal)

## Scenario
A pediatric patient portal lets a parent edit immunization administration dates in a table.
On "Save row," an optimistic-UI handler tints the saved `<tr>` green to confirm the update
succeeded. The "updated successfully" status is carried by the green row background **alone**
— no "Saved" / "Updated" word, no checkmark character, no timestamp change, no status
message. The intro text even tells users "Saved rows are highlighted," cementing colour as
the sole confirmation.

## Attribute tuple
- **content-domain:** healthcare / patient portal (pediatric immunizations)
- **UI-component/pattern:** editable data table with per-row save (optimistic UI / autosave)
- **host-language construct:** `<tr>` gets `class="saved"` added by JS `onclick`; CSS `tr.saved { background:#d7f0dd }`
- **locale/i18n:** en-US
- **failure-mechanism:** a *status* ("database entry updated successfully") encoded by a colour change only — the Understanding's second named action/status example

## Developer persona
A junior dev built the editable table and added optimistic save: on click, flip a row class
so the parent "sees" it took. Pulled the green-row pattern from a UI-kit "success row"
snippet that styled `.saved` with a tint and nothing else. There was a `toast()` helper in
the codebase but it wasn't wired here, so the green tint became the only feedback.

## Element / selector carrying the issue
`tr.saved` (added to a row after its "Save row" button is pressed). The only change on
success is `background:#d7f0dd`; the row's cell text is unchanged.

## Exact accessibility mechanism
After saving an edit to a medical record, a user with red-green colour deficiency or in
grayscale cannot tell a saved row from an unsaved one — the success of a consequential,
hard-to-reverse change is unperceivable. (A screen-reader user gets nothing at all, since
no text changes and there is no live region — a related 4.1.3 gap — but the *1.4.1* failure
is that the *visible* confirmation is colour-only.) The verified render shows the saved DTaP
and Varicella rows tinted green in colour but indistinguishable from unsaved rows in
grayscale, and no "Saved"/✓ text anywhere on the page.

## Expected ACT-style outcome
**failed** — colour (the row turning green) is the only visual means of conveying the
"updated successfully" status; no non-colour text/character cue confirms the save.

## Why automated tools miss it
The `saved` class is added only at runtime after a click, so a static scan never sees the
changed state at all. Even with the class applied, the row is a valid `<tr>` of real text
cells — no missing label, no empty element, contrast still passes. No tool can determine
that the green background *is* the success confirmation and that nothing else carries it;
that requires triggering the save and judging that the only confirmation is a hue change.

## Citation
> **WCAG 2.2 Understanding 1.4.1 (use-of-color.html, Intent):** "Examples of indications of
> an action include: using color to indicate that a link will open in a new window or that
> a database entry has been updated successfully."

This page implements the "database entry has been updated successfully" status entirely in
colour (the row turning green), with no redundant text — precisely the situation the SC
names as needing a non-colour visual equivalent.
