# case-05 — Kanban SPA deep-linked to one card but `<title>` stays "Planner"

## Scenario
A kanban app (Planner) deep-linked to a single card detail (`#/board/sprint-14/card/PLT-238`). The router
opens that card's detail dialog over a dimmed board and renders its full content: the card key/board, an
`<h1>Fix flaky checkout test</h1>`, status pill ("In progress"), assignee, points, due date, description,
and a checklist. The open card detail is unmistakably one specific item. `document.title` is the shell value
**"Planner"**, set at boot, and is never updated when a card is opened — identical to the board view and
every other card.

## Element / selector carrying the issue
- `head > title` — text node `"Planner"`.
- Contradicting evidence: `#cardTitle` (`h1`) = "Fix flaky checkout test"; the card key "PLT-238 · Sprint 14";
  the header crumb (`#crumb`) updated to "Sprint 14 › PLT-238". A dialog with `aria-labelledby="cardTitle"`
  is open, confirming the user is on the card view.

## Exact accessibility mechanism (what AT experiences and why it fails)
This card view is a deep-linkable state: a teammate can paste the link to PLT-238 and it opens directly. A
screen-reader user opening that link, or returning to the tab later, needs the title to tell them which card
they are on. Instead they get "Planner" — the bare app name. The card view is a distinct page in the SPA's
set of views, and the title neither identifies its topic (a specific defect ticket) nor distinguishes it from
the board or from the other cards. The accessible page name a user relies on across the tab bar, window
switcher, and history is uninformative for this state.

## Expected ACT-style outcome
**failed** (limb 2). Title present and non-empty (2779a5 passes) but does not reflect the opened card and is
identical across views.

## Why automated tools miss it
"Planner" is a non-empty, valid `<title>`, so ACT 2779a5 passes and axe/WAVE/Lighthouse stay silent. There
is even an open `role="dialog"` with a correct `aria-labelledby` — accessible-name automation for the dialog
would pass too. Detecting the SC failure requires reading the open card's heading/key, recognizing it as a
distinct deep-linkable view, and judging that the app-name title fails to reflect it (and is identical to every
other card's title). That is semantic and cross-state; structural checks cannot reach it. The per-card title
update is a runtime SPA behaviour invisible to a static head snapshot.

## Citation
> **WCAG 2.2 Understanding — Understanding SC 2.4.2 Page Titled (`wcag-understanding/page-titled.html`):**
> "In cases such as Single Page Applications (SPAs), where various distinct pages/views are all nominally
> served from the same URI and the content of the page is changed dynamically, the title of the page
> should also be changed dynamically to reflect the content or topic of the current view."

> **WCAG Techniques — F25, Examples (`wcag-techniques/failures/F25.html`):**
> "A site generated using templates includes the same title for each page on the site. So the title cannot
> be used to distinguish among the pages."
