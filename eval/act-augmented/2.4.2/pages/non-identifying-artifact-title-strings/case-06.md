# case-06 — "node/3387" (Drupal internal node path) on a 2FA help-centre article

## Scenario
A help-centre layout (sidebar of account-security topics + main content). The article is
a complete "Set up two-factor authentication" guide: intro, prerequisites, numbered
enable steps, a recovery-codes tip, and a turn-off section. The `<title>` is `node/3387`
— the raw Drupal internal node path (a database row reference), not page content.

## Attribute tuple
- **content-domain:** SaaS help centre / account security
- **UI-component/pattern:** two-column docs layout (sidebar nav + ordered steps + tip)
- **host-language construct:** Drupal-rendered page; system path token used as `<title>`
- **locale/i18n:** en
- **failure-mechanism:** F25 sub-class (c) — machine identifier / internal path as title

## Developer persona
An agency themed an older Drupal help site. A misconfigured page-title token (or an
empty Title field falling back to the system path) caused the rendered `<title>` to be
the node's internal path, `node/3387`, instead of the article title. The editor wrote a
correct `<h1>` in the body and never noticed the tab.

## Element / selector carrying the issue
`head > title` (text node `node/3387`).

## Exact accessibility mechanism
AT users querying the title, and anyone reading the tab/bookmark/history, get
"node/3387" — an internal database identifier. It tells the user nothing about
two-factor authentication and cannot distinguish this article from "node/3388" or any
other node. The slash makes it look like a path, reinforcing that it is machine residue.
Fails to describe topic or purpose.

## Expected ACT-style outcome
**failed** — title is a non-descriptive machine identifier; F25 applies (filename/
identifier-not-descriptive family).

## Why automated tools miss it
"node/3387" is non-empty and valid; `document-title` / 2779a5 pass. A scanner has no
model of Drupal node paths and cannot tell an internal identifier from a deliberate
terse title. Recognizing "node/3387" as a CMS row reference, not content, is human
semantic judgment.

## Citation
> **WCAG Technique F25** (`wcag-techniques/failures/F25.html`):
> "This describes a failure condition when the web page has a title, but the title does
> not identify the contents or purpose of the web page."
