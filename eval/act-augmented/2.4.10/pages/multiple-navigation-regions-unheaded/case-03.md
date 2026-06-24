# case-03 — SaaS dashboard: global top nav + workspace left nav, both unheaded

## Scenario
A "Pulse Analytics" SaaS dashboard (workspace *Acme Marketing*, *Overview* panel) has two
navigation regions that a user must distinguish to operate the product:
1. a **global top nav** that switches **product areas** (Dashboards / Reports / Integrations /
   Settings) plus a separate account nav (Help / Notifications / Account: Dana R.), and
2. a **workspace left nav** scoped to the current workspace (Overview / Campaigns /
   Audiences / Conversions / Budgets / Workspace members).

Both are `<nav>` landmarks; the main panel has a single `<h1>` "Overview". **Neither
navigation region has a heading.** The left nav shows the workspace name "Acme Marketing" as
a styled `<div>` (a brand label, not a heading and not a label for *navigation*). A
screen-reader user navigating by heading finds only "Overview" and cannot tell, by heading,
the global product navigation from the workspace navigation — two operationally different
controls.

## Attribute tuple
- **content-domain:** SaaS analytics / marketing dashboard (B2B product UI)
- **UI-component / pattern:** app shell with global top bar + workspace left rail (two-tier app navigation)
- **host-language construct:** three `<nav>` elements (`nav.product`, `nav.account`, `nav.workspace`); single `<h1>` in `<main>`; workspace name rendered as `div.wsname` (styled brand text, not a heading)
- **locale / i18n:** en-US
- **failure-mechanism:** H69 nav-demarcation — global/top navigation and left/secondary navigation are distinct sections, neither demarcated by a heading; the `div.wsname` is a brand label, not a section heading

## Developer persona
A React team assembled the shell from a component library: `<TopBar>` and `<SideNav>`
ship as `<nav>` landmarks out of the box, which the team treated as "accessible navigation."
The `<SideNav>` exposes a `workspaceName` prop that renders as a styled label; the team set
it to "Acme Marketing" and assumed that *labelled* the navigation. They added an `<h1>` to
the page-content component for each route. Nobody added a heading to either nav region —
heading semantics for chrome wasn't part of the component contract, and the visual design
made the two navs obviously separate, so it looked complete in review.

## Element / selector carrying the issue
- `header.global nav.product` (region 1, global product navigation) — no heading.
- `header.global nav.account` (account actions navigation) — no heading.
- `nav.workspace` (region 2, workspace navigation) — no heading; `div.wsname`
  "Acme Marketing" is a brand label, not a heading, and does not name the navigation.

The document's only heading is `main h1` "Overview", which labels the data panel.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user sees a dark global bar (product switcher) and a white workspace rail with the
  workspace name; the two are unmistakably different controls.
- A screen-reader user navigating by heading gets exactly one heading: "Overview" (h1). The
  global product nav and the workspace nav are reachable as landmarks but invisible to heading
  navigation, so the user cannot, by heading, find or distinguish "switch product area" from
  "navigate within this workspace."
- The `div.wsname` "Acme Marketing" *looks* like it titles the left nav, but it is a styled
  `<div>` with no heading role, so it never appears in the headings list — it cannot demarcate
  the section for AT.
- Per H69, heading markup should demarcate "top or main navigation, left or secondary
  navigation"; this dashboard has exactly that top/left split and demarcates neither with a
  heading.

The defect is genuinely in the DOM: heading-less `<nav>` regions plus a styled-`div`
pseudo-title.

## Expected ACT-style outcome
**failed** (SC 2.4.10 — H69 nav-demarcation sub-limb: distinct top/global and left/workspace
navigation sections, neither introduced by a section heading).

## Why automated tools miss it
The page has one `<h1>`, valid `<nav>` landmarks, no empty headings, and no missing
attributes, so axe-core, WAVE, and Lighthouse pass it (ACT 047fe0 passes on the `<h1>`). No
automated checker can decide that the dark top bar (product-area switcher) and the white left
rail (workspace navigation) are two distinct sections that each warrant a demarcating heading,
nor that the styled "Acme Marketing" div is a brand label rather than a navigation heading.
Recognizing the two navigations do different jobs, and that heading-navigation users need a
heading to tell them apart, is a contextual product-comprehension judgment only a human can
make.

## Citation
> "to demarcate different navigational sections like top or main navigation, left or secondary navigation and footer navigation;"
— wcag-techniques/html/H69.html (Description — objective bullet list)

> "In pages where content in part of the page updates, headings can be used to quickly access updated content."
— wcag-understanding/section-headings.html (Benefits of Section Headings)

> "Other page elements may complement headings to improve presentation (e.g., horizontal rules and boxes), but visual presentation is not sufficient to identify document sections."
— wcag-understanding/section-headings.html (Intent of Section Headings)
