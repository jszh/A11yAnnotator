# case-06 — SaaS dashboard: tabs, dialog-trigger, action menu, custom player controls out of scope; ONE filter field instructed (overall PASS)

## Scenario
A CRM analytics dashboard ("Pipeline overview"). Its interactive surface is almost entirely **non-data-entry** controls: a sidebar nav, a 4-tab `role="tablist"`, a "Refresh data" action button, an "Open settings" button that triggers a modal settings dialog, an "Export" menu-button (CSV/PDF/link), a segmented "Day/Week/Month" toggle group (`aria-pressed`), and custom `<span role="button">` chart "player" controls (step back/forward a day, play/pause the live ticker). None of these accept typed or selected *data* — they navigate, open dialogs, fire actions, or toggle view state, so 3.3.2 does not apply to them. The single genuine data-entry control is the "Filter deals" combobox/search input, correctly given a visible `<label>` **and** a visible instruction ("Type a company or owner name; results update as you type. Press Esc to clear the filter.") via `aria-describedby`. The dashboard therefore **passes** 3.3.2. The discriminating judgment is to classify the dense control set by purpose — exactly one is data entry, and it is instructed.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard (CRM pipeline)
- **UI-component / pattern:** tabs (tablist) + menu button (export) + dialog-trigger (settings) + action button (refresh) + segmented toggle group + custom span/role=button media-style controls + one filter combobox
- **host-language construct:** `role=tab` buttons, `<button aria-haspopup>`, `<span role="button" tabindex=0>` action controls, one `<input role="combobox">` with `<label>` + `aria-describedby`
- **locale / i18n:** en
- **failure-mechanism:** none — this is the dense-dashboard false-positive guard; many action/toggle/navigation controls + one correctly-instructed input

## Developer persona
A product engineer on a React dashboard who built the chart "player" controls as custom `span role="button"` widgets (with proper `aria-label`s and keyboard handlers) and used `aria-pressed` toggles for the time grouping. They knew the only thing the user *types into* is the deal filter, so that got a real label and a usage hint; everything else is a button/tab/toggle. The trap is the control density plus the input-adjacent feel of a custom player: an evaluator might reflexively demand "instructions" for the Refresh button or the player controls, which are not data entry.

## Element / selector carrying the issue
No failing element. In-scope + satisfied: `#dealFilter` (the combobox/search input) with `label[for="dealFilter"]` + `#filter-hint`. Out-of-scope controls an evaluator must NOT flag: `[role=tab]` (×4), `#refreshBtn`, `#settingsBtn` (dialog trigger), `#exportBtn` + export menu items, `.seg button` (×3 toggles), `.player .ctl` (×3 custom action buttons), sidebar nav links, and the in-dialog preference toggle buttons.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user, filter:** "Filter deals, combo box, Type a company or owner name; results update as you type. Press Esc to clear the filter." — label + instruction both reach the user. In scope, satisfied.
- **Screen-reader user, out-of-scope controls:** "All deals, tab, selected"; "Open settings, button, has popup dialog"; "Export, button, has popup menu"; "Week, button, pressed"; "Play live updates, button". Each is an action/navigation/toggle control — none prompts for data entry, so none owes a 3.3.2 instruction.
- **Keyboard user:** Tab/arrow through tabs, Enter on the dialog trigger opens settings, Space toggles segmented buttons and the player; only the filter input is typed into.
- Net: one data-entry control, labelled and instructed; the rest correctly out of scope. **Pass.**

## Expected ACT-style outcome
**passed** (SC 3.3.2 — the dashboard's single data-entry control has a visible label and instruction; the tabs, dialog trigger, action/export buttons, segmented toggles, and custom player controls are not data-entry controls and 3.3.2 does not apply to them).

## Why automated tools miss it
axe/WAVE/Lighthouse raise no 3.3.2 issue here — but only because every control happens to carry an accessible name and the filter has a `<label>`. They do not, and cannot, perform the discriminating scope judgment this fixture is about: deciding which of a dozen dense, partly-custom controls are "associated with data entry" (exactly one) versus actions/navigation/toggles (the rest). A scope-blind evaluator (or model) is liable to over-flag the Refresh button or the custom `span role=button` player controls as "missing input instructions." Distinguishing a data-entry control from an action/toggle/dialog-trigger by its role and behaviour is a semantic judgment, not an attribute check.

## Citation
> "This success criterion does not apply to links or other controls (such as an expand/collapse widget, or similar interactive components) that are not associated with data entry."
— wcag-understanding/labels-or-instructions.html (Intent)

> "A website provides a global search field in the header of the site. Any term can be entered, so there are no instructions needed, but the field needs a cue to communicate its purpose."
— wcag-understanding/labels-or-instructions.html (Examples) — the filter field is the in-scope control; here it is given both a cue (label) and a usage instruction.

> "The intent of this success criterion is not to clutter the page with unnecessary information but to provide important cues and instructions that will benefit people with disabilities. Too much information or instruction can be just as harmful as too little."
— wcag-understanding/labels-or-instructions.html (Intent) — adding field-style instructions to action/toggle/tab controls would be exactly the unnecessary clutter the SC warns against.
