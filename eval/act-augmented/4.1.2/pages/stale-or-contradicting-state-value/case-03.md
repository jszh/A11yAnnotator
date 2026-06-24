# case-03 — Tab strip: third tab visually active but aria-selected="true" sits on the first tab (analytics dashboard)

## Scenario
A Quanta Insights SaaS analytics dashboard shows a four-tab strip — Overview, Audience, **Funnel**,
Revenue — over a campaign-analytics view. The **Funnel** tab (third) is the one rendered active: it has
the bright white text and the blue underline (`.active` class), and the Funnel panel (KPIs + a
conversion-funnel table) is the only `role="tabpanel"` shown; the other three panels are `hidden`.
But `aria-selected="true"` is set on the **Overview** tab (first), and Funnel carries
`aria-selected="false"`. Exactly one tab is marked selected (structurally valid), but it is the wrong
tab.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard
- **UI-component/pattern:** tabs (APG Tabs pattern) with one visible tabpanel
- **host-language construct:** `role="tablist"` / `role="tab"` / `role="tabpanel"` with `aria-controls` + `aria-selected`
- **locale/i18n:** en
- **failure-mechanism:** `aria-selected="true"` is on a different tab than the one rendered active and whose panel is shown

## Developer persona
A front-end engineer implementing deep-linkable tabs. When the dashboard loads with `?view=funnel`,
the render code applies the `.active` class to the Funnel tab and shows its panel — but the
`aria-selected` flags were initialized from a separate default constant that always marks the first
tab selected, and the deep-link code path forgot to move `aria-selected` to the active tab. The
roving-`tabindex` and click handler work after interaction, so the bug only exists on the
deep-linked initial render. A designer signed off because it "looked right."

## Element / selector carrying the issue
Mismatch pair: `#t-fun[role="tab"].active[aria-selected="false"]` (visually active, panel shown) vs.
`#t-over[role="tab"][aria-selected="true"]` (visually inactive, panel hidden).

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen reader navigating the tablist announces "Overview, tab, **selected**" and "Funnel, tab" (not
selected) — the inverse of what is on screen and of which panel is actually displayed. An AT user
believes they are on Overview; if they read the associated panel they may land on the visible Funnel
content while being told Overview is current, or follow `aria-controls` to the hidden Overview panel.
The selected-state value does not reflect the component's actual current state, so AT is given an
incorrect value. Roles and the required `aria-selected` are all present and valid; only the value is
on the wrong element.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The tablist is structurally well-formed: four tabs with `role="tab"`, accessible names, `aria-controls`,
and exactly one `aria-selected="true"` — so ACT 4e8ab6 / 5c01ea / 6a7281 pass and tab-pattern linters
see a valid single-selection tablist. Automated tools have no model of which tab *looks* active (bright
+ underlined) or which panel is *visible*; they cannot tell that the highlighted tab and the shown
panel are Funnel while `aria-selected="true"` is on Overview. Resolving that requires reading the
rendered UI and matching the visual selection to the exposed selection.

## Citation
> **WCAG 2.2 Understanding 4.1.2 (Intent), `wcag-understanding/name-role-value.html`:**
> "The intent of this success criterion is to ensure that Assistive Technologies (AT) can gather
> appropriate information about, activate (or set) and keep up to date on the status of user interface
> controls in the content."

> **WCAG 2.2 SC 4.1.2 text (via `refs/trusted-tester/sc-4.1.2-name-role-value.md`):**
> "states, properties, and values that can be set by the user can be programmatically set; and
> notification of changes to these items is available to user agents, including assistive technologies."

(The currently-selected tab is a state; exposing `selected` on a tab that is not the active one means
the true selection is not programmatically reflected to AT.)
