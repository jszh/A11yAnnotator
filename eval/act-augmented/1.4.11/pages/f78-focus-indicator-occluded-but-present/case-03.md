# case-03 — Analytics-app top nav where a permanent 2px blue "chip" outline on every nav button is re-used verbatim as the focus ring (FAIL)

## Scenario
The Cohortly retention-analytics app gives every primary-nav button a permanent `2px solid #2f6df6`
outline to achieve a "chip / pill" look across the toolbar, and then sets the keyboard focus indicator
to the identical `2px solid #2f6df6` outline at the same offset. All five nav items (Overview, Cohorts,
Funnels, Segments, Reports) wear the same blue box at rest, and the focused item wears the same blue
box. The page is rendered with the *Funnels* item focused (`autofocus`). A keyboard user Tabbing across
the nav sees five identical blue-outlined buttons and cannot tell which one currently has focus.

## Attribute tuple
- **Content domain:** SaaS analytics dashboard (retention / funnels)
- **UI component / pattern:** horizontal primary navigation bar of `<button>` items (APG menubar-ish toolbar)
- **Host-language construct:** `outline: 2px solid` declared identically on `.nav-item` and `.nav-item:focus`; `autofocus` to render the focused state
- **Locale / i18n:** en-US
- **Failure mechanism:** F78 (a) — author outline on every sibling visually identical to the focus indicator, so the focused item is indistinguishable from its peers

## Developer persona
A product designer specified a single "outline/2px/brand-blue" token in Figma for the nav-item resting
style because the team liked the bordered look. A front-end developer wired the same design token into
both the resting `.nav-item` rule and the `:focus` rule, reasoning "the focus state should use the brand
outline too — that's consistent." The team only ever clicked the nav with a mouse during QA, so the
fact that focus is invisible against four identical siblings never surfaced.

## Element / selector carrying the issue
`.nav-item` (resting) vs `.nav-item:focus` — both `outline: 2px solid #2f6df6; outline-offset: 2px;`.
The focused element at load is the *Funnels* button.

## Exact accessibility mechanism
A focus indicator is genuinely painted on the focused nav button — the app is not `outline:none`. But
because every sibling already carries the identical `2px solid #2f6df6` outline, the focused button is
visually indistinguishable from the four others. The "visual information necessary to indicate state"
(which control is focused) provides no discriminating signal: there is no relative difference between
focused and unfocused items. A sighted keyboard user or magnifier user cannot determine their position
in the nav, even though both the resting outline and the focus outline individually have acceptable
contrast (blue #2f6df6 on white is ~4:1). This is an indistinguishability failure, distinct from the
low-contrast failures the Understanding figures illustrate.

## Expected ACT-style outcome
**failed** (SC 1.4.11, also implicates 2.4.7 / F78). A focus indicator exists but is not perceivably
distinct from the persistent identical outline on sibling controls.

## Why automated tools miss it
`.nav-item:focus` is declared with a real `2px solid` outline of finite width and good contrast, so any
"is there a contrasting focus style?" heuristic passes. axe-core / WAVE / Lighthouse have no rule that
compares the focused element's appearance against its unfocused siblings or against its own resting
state. Uniform decorative outlines on a nav are a common, legitimate visual style. Only a human who
renders the focused state and scans the row can conclude that the focused item looks exactly like the
other four — a relational visual judgment no static checker makes.

## Citation
**Reference:** WCAG Technique F78 — Description (`wcag-techniques/failures/F78.html`)
> "Other styling may make it difficult to see the focus indicator even though it is present, such as outlines that look the same as the focus outline, or thick borders that are the same color as the focus indicator so it cannot be seen against them."

**Reference:** WCAG 2.2 Understanding 1.4.11 — User Interface Components (`wcag-understanding/non-text-contrast.html`)
> "Also, any visual information necessary to indicate state, such as whether a component is selected or focused must also ensure that the information used to identify the control in that state has a minimum 3:1 contrast ratio."
