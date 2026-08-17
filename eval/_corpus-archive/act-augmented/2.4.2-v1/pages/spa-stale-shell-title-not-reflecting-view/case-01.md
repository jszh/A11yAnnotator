# case-01 — SPA routed to "Settings › Notifications" but `<title>` stays "My App"

## Scenario
A single-file settings SPA. On load the inline router resolves the location hash
`#/settings/notifications` and renders a fully-formed **Notification preferences** view into
`<main>` (email-notification switches, a delivery-frequency control, a "Settings › Notifications"
breadcrumb, and `aria-current="page"` on the Settings nav link). The rendered body unambiguously
shows one specific view. The router updates the body on every route change but never assigns
`document.title`, so the title is frozen at the generic shell value **"My App"** — the same string
for every view this app can render.

## Element / selector carrying the issue
- `head > title` — text node `"My App"`.
- The contradicting evidence is the rendered `main#view` content: breadcrumb "Settings › Notifications",
  `<h1>Notification preferences</h1>`, and `nav.side a[aria-current="page"]` = "Settings".

## Exact accessibility mechanism (what AT experiences and why it fails)
A screen-reader user who navigates to this view, or who has several browser tabs open, relies on the
accessible page title (exposed in the tab, the window title, the tab/window switcher, and announced by
some AT on navigation) to know **where they are**. Here the title announces only "My App". It does not
identify that the current view is *Notification preferences*, and because it is identical across the
Home, Projects, Settings, and Help views, it cannot distinguish this view from any other. The user is
told the name of the application but not the topic of the page they are actually on. For an SPA, where
the URL bar may not visibly change topic either, the title is often the only programmatic locator — and
it is wrong for this state.

## Expected ACT-style outcome
**failed** (limb 2 — descriptiveness/distinguishability). The title is present and non-empty
(2779a5 passes) but does not identify or distinguish the topic of the current view.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse verify only that a non-empty `<title>` exists. "My App" is a valid,
non-empty string, so the presence rule (ACT 2779a5) passes and no tool raises a flag. Judging that
"My App" fails to reflect a *Notification preferences* view requires reading the rendered body, inferring
its specific topic, and recognizing that the static app-name title ignores it — and further that the
title would be byte-identical on every other view. That is a semantic, cross-element comparison no
presence/structure linter performs. The dynamic dimension (the title must update on a client-side route
change and did not) leaves no signal in a static head snapshot, where the title simply looks fine.

## Citation
> **WCAG 2.2 Understanding — Understanding SC 2.4.2 Page Titled (`wcag-understanding/page-titled.html`):**
> "In cases such as Single Page Applications (SPAs), where various distinct pages/views are all nominally
> served from the same URI and the content of the page is changed dynamically, the title of the page
> should also be changed dynamically to reflect the content or topic of the current view."

> **WCAG Techniques — F25 (`wcag-techniques/failures/F25.html`):**
> "This describes a failure condition when the web page has a title, but the title does not identify the
> contents or purpose of the web page."
