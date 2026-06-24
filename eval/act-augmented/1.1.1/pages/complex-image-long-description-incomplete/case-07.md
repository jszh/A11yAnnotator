# case-07 — Org chart: caption is a flat roster; the reporting lines (who reports to whom) are absent

## Scenario
A staff intranet shows an engineering org chart as an inline SVG: a VP at the top, two directors
beneath, and four leads beneath the directors, all joined by connecting lines that encode the
reporting hierarchy. The `figcaption` lists all seven people and their titles as a flat roster
but states none of the reporting relationships. A bilingual touch (an Arabic line, correctly
marked `lang="ar"`) adds a realistic localisation facet without changing the verdict.

## Attribute tuple
- **content-domain:** enterprise HR / staff intranet
- **UI-component / pattern:** inline `<svg role="img">` org chart with connecting lines + `figcaption`
- **host-language construct:** SVG with `aria-labelledby` (title) + visible caption containing a `lang="ar"` span
- **locale / i18n:** mixed en / ar (Arabic roster line marked `lang="ar"`, `dir:rtl`)
- **failure-mechanism:** long description names the nodes but drops the reporting edges the org chart exists to convey (F67)

## Developer persona
An HR-ops person maintains the chart in a slide and exports it to SVG each quarter. For the
caption they paste the team roster they already keep for the directory ("seven people: name —
title"). The roster has no hierarchy column, so the caption has no hierarchy. They added the
Arabic line because the company is bilingual, and (correctly) tagged it `lang="ar"` — which makes
the page look *more* carefully built, not less, masking the real defect.

## Element / selector carrying the issue
`svg[role="img"]` (name via `#orgName`) paired with `figure > figcaption`. The caption lists
people+titles; the `<path>` connecting lines that encode reporting are not described.

## Exact accessibility mechanism
A screen-reader user hears "Almasaf Group engineering organisation chart," then a flat list of
seven name/title pairs. The sighted user follows the lines: Rivera and Tanaka report to Haddad;
Nair and Kowalski report to Rivera; Russo and Farouk report to Tanaka. The reporting structure —
the only reason an org chart differs from a staff list — is invisible to the non-sighted user,
who cannot answer "who manages whom / who is my skip-level?" The alternative omits the
relationships, so it does not present the same information.

## Expected ACT-style outcome
**failed** — F67 (the long description lists nodes but drops the reporting lines, so it does not
present the same information as the chart). Name + description presence PASS; the `lang="ar"`
markup is correct and does not affect the 1.1.1 outcome.

## Why automated tools miss it
The SVG has a non-empty accessible name and a descriptive caption; the foreign-language passage
is even correctly marked, so language checks are clean too. axe/WAVE/Lighthouse report no issue.
No tool follows the `<path>` connectors to derive the hierarchy or checks that the caption
encodes it. Recognising that an org chart's content is its edges — and that a flat roster drops
them — is a semantic judgement over the diagram.

## Citation
> **Reference:** WCAG Techniques — F67 (`wcag-techniques/failures/F67.html`)
>
> "Check that the long description serves the same purpose or presents the same information as
> the non-text content."
>
> (The org chart's purpose is to present reporting relationships; the caption presents only a
> roster, so it neither serves the same purpose nor presents the same information.)
