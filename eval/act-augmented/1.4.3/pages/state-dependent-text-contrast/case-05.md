# case-05 — Tablist: selected tab label is white on pale teal (~1.60:1) while unselected tabs pass

## Scenario
A marketing-analytics app with an APG tablist (Overview, Channels, Audience, Spend). Unselected tabs are dark text (`#283543`) on the light tab bar (`#eef2f6`) — about **11.1:1**, passing. The **selected** tab gets a "pill" treatment: white text (`#ffffff`) on a pale-teal gradient (effective `#9ad8d4`) — about **1.60:1**, so the active tab's own label is the hardest to read. Because selection moves, *whichever* tab is selected inherits the failing white-on-pale-teal treatment while the rest return to passing dark text. The failing text is a property of the `aria-selected="true"` state.

## Attribute tuple
- **content-domain:** marketing / analytics SaaS dashboard
- **UI-component / pattern:** ARIA tablist with a styled selected "pill"
- **host-language construct:** `[role="tab"][aria-selected="true"]` attribute-selector color/background rule (selection roves via JS)
- **locale / i18n:** en-GB (£ spend)
- **failure-mechanism:** selected-state tab text below 4.5:1; the selected state is a non-initial, driven state per tab

## Developer persona
A designer themed the tablist after a dribbble shot: dark inactive tabs and a soft teal "active pill" with white text for a modern look. The teal was chosen for brand harmony, not contrast — white on `#9ad8d4` is only ~1.60:1. The engineer wired standard APG keyboard behavior and verified roles/selection were announced correctly, treating the styling as the designer's call. QA screenshotted the default (Overview selected) and judged it "looks clean," never noticing the selected label was barely legible — and never checking that every tab fails the same way once selected.

## Element / selector carrying the issue
`[role="tab"][aria-selected="true"]` — selected tab: `color:#ffffff` on a pale-teal pill (`~#9ad8d4`), ~1.60:1. Unselected `[role="tab"]` (`#283543` on `#eef2f6`) passes.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Low-vision sighted user:** the tab telling them "this is the view you're looking at" (the selected tab) is the least readable element in the tablist at ~1.60:1. Orientation — knowing which report is active — depends on reading that label.
- **Keyboard user:** activating any other tab moves the failing treatment onto that tab; the failure is reproducible on every tab, not a one-off.
- The selected state is the in-scope state here; the SC requires contrast "wherever it occurs," including state-dependent presentations.

## Expected ACT-style outcome
**failed** (SC 1.4.3 — selected-tab label at 1.60:1 < 4.5:1; the selected state must still meet contrast).

## Why automated tools miss it
A static scan sees exactly one tab selected and the rest passing; it does not activate the other tabs to confirm each fails when selected. Many contrast engines also treat the selected "pill" as a rounded gradient component region and down-rank or skip its text rather than measuring white-on-pale-teal as a text-on-background pair. Even where a tool might flag the single selected tab, it cannot establish that the failure is a property of the selected *state* (true for any tab) — that requires driving the tablist and re-measuring per selection, which is a human/behavioral step.

## Citation
> "This success criterion applies to text in the page, including placeholder text and text that is shown when a pointer is hovering over an object or when an object has keyboard focus. If any of these are used in a page, the text needs to provide sufficient contrast."
— wcag-understanding/contrast-minimum.html (Intent)

> "Identify ALL text AND images of text. … Some text may not initially be visible (appears on mouseover or focus). It must still conform to the contrast requirement wherever it occurs."
— refs/trusted-tester/sc-1.4.3-contrast-minimum.md (Identify Content)
