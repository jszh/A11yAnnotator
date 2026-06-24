# case-02 — "Vite + React" (build-scaffold default) on an HR onboarding checklist SPA

## Scenario
The shipped build of a single-page app. The body that renders into `#root` is a real
"New Engineer Onboarding Checklist" for an HR People-Ops console (numbered steps,
done/pending states, app bar, footer version). But the document `<title>` is the
untouched Vite + React scaffold default, `Vite + React` — the name of the build tool,
not the page. An inline script wires up progress but deliberately never sets
`document.title`, and the SPA never updates the title on route change.

## Attribute tuple
- **content-domain:** SaaS / internal HR tooling
- **UI-component/pattern:** SPA app shell + ordered checklist with CSS counters & state
- **host-language construct:** client-rendered React app (server fallback markup) + `<script>`
- **locale/i18n:** en-US
- **failure-mechanism:** F25 sub-class (c) — machine/scaffold default + dynamic-state
  pattern (SPA route change without updating `document.title`)

## Developer persona
A junior front-end dev bootstrapped the project with `npm create vite@latest -- --template react`,
built the onboarding view, and shipped. They never added react-helmet or a
`document.title = ...` call, so every route in the SPA shows the scaffold default in the
tab.

## Element / selector carrying the issue
`head > title` (text node `Vite + React`); the inline `<script>` is the (absent) place a
correct app would set `document.title`.

## Exact accessibility mechanism
On load and on every in-app route change, AT users get the title "Vite + React". A
screen-reader user querying the page title, or any user reading the tab, learns the
framework that built the app — never that this view is an onboarding checklist. Because
SPAs reuse one URL across views, the static scaffold title also fails to distinguish
this view from every other view in the app.

## Expected ACT-style outcome
**failed** — title is present but identifies the build tool, not the page; F25 applies.

## Why automated tools miss it
"Vite + React" is a non-empty, valid title, so `document-title` / 2779a5 pass on the
served HTML. Automated scanners also typically evaluate the initial DOM and do not model
that the SPA never updates `document.title` per view. Knowing that "Vite + React" is a
generator default describing tooling — not page content — is semantic judgment.

## Citation
> **WCAG 2.2 Understanding 2.4.2** (`wcag-understanding/page-titled.html`):
> "In cases such as Single Page Applications (SPAs), where various distinct pages/views
> are all nominally served from the same URI and the content of the page is changed
> dynamically, the title of the page should also be changed dynamically to reflect the
> content or topic of the current view."
