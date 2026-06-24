# case-02 — SaaS settings subsection titled only "Settings"

## Scenario
A CRM web application (Cadence CRM) with a multi-pane Settings area. The current pane is
**Notifications**: the left rail shows it as the active item (`aria-current="page"`), the breadcrumb
reads "Settings › Workspace › Notifications", and the H1 is "Notification settings". The body is
unmistakably the notification preferences pane. The document `<title>` is the single bare word
**`Settings`** — the same word every sibling pane (Profile, Security & login, Billing & plan,
Integrations, API keys, Team members) would also emit.

## Attribute tuple
- **content-domain:** B2B SaaS / CRM account administration
- **UI-component/pattern:** persistent left-nav settings shell with `role="switch"` toggles (a "set of web pages")
- **host-language construct:** server-rendered shell whose `<title>` is the static section root word
- **locale/i18n:** en
- **failure-mechanism:** non-distinguishing title across a set of sibling pages (F25 "same title for each page")

## Developer persona
A front-end developer who set `<title>Settings</title>` once in the shared `SettingsLayout`
component wrapper and never overrode it per sub-route. Each pane swaps its main content but inherits
the layout's static title. It felt DRY and "good enough" — every settings page is, after all, a
settings page — so the per-pane distinction was never added.

## Element / selector carrying the issue
`head > title` (text node `Settings`), shared by every route under the settings layout.

## Exact accessibility mechanism (what AT experiences, why it fails)
This is a "set of web pages" (Trusted Tester 12.B.a). A user with several settings panes open in
tabs — or moving between them and using the screen-reader page-title query to confirm where they
landed — hears "Settings" on every one. The title cannot distinguish the Notifications pane from
the Billing or API-keys pane; navigation gives no orientation cue. It fails limb (b) twice over:
out of context "Settings" doesn't say *which* settings, and within the set it does not distinguish
this page from its siblings.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A single-page scan finds a present, non-empty `<title>` that even reads like a plausible title, so
2.4.2 passes mechanically. A scanner audits one DOM state and has no concept that five other routes
ship the identical word, nor that this specific route is really the Notifications pane. Detecting a
non-distinguishing title across a set requires crawling siblings and comparing — a human/manual step.

## Citation
> **Trusted Tester v5.1.3, Test 12.B — Evaluate Results (PASS if ALL true):**
> "2. If the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other pages in the web site."

(Verbatim from `refs/trusted-tester/sc-2.4.2-page-titled.md`. "Settings" on every pane fails check 2.)

> **WCAG Technique F25 (Failure … title not identifying the contents), Examples:**
> "A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages."

(Verbatim from `wcag-techniques/failures/F25.html`.)
