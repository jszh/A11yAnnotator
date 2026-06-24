# case-05 — Clinical scatter plot: caption gives axes + N but drops the correlation and the outlier cluster

## Scenario
A Phase-II trial results page shows a scatter plot of drug exposure (x) versus hepatic clearance
time (y) for 60 participants. The point cloud encodes two findings: (1) a strong positive
correlation — clearance rises with exposure — and (2) a distinct cluster of seven high outliers
in the top-right (the slow-metaboliser subgroup that drives the dosing caution), drawn in a
contrasting colour. The `aria-labelledby` name and the `figcaption` restate the axis labels and
the sample size but state neither the correlation nor the outlier cluster.

## Attribute tuple
- **content-domain:** healthcare / clinical-trial research report
- **UI-component / pattern:** inline `<svg role="img">` scatter plot with `figcaption`
- **host-language construct:** SVG with `aria-labelledby` (title) + visible `figcaption`
- **locale / i18n:** en
- **failure-mechanism:** long description restates the scaffolding (axes, N) but drops the result the plot exists to show (F67)

## Developer persona
A research-software engineer auto-generated the figure caption from the plot's metadata: axis
titles, units, and N are all available programmatically, so the caption template emits them.
The *findings* (correlation strength, the outlier subgroup) live only in the statistician's head
and the rendered geometry — the template can't see them, so they never make it into the text.
Caption is non-empty and accurate, so scans pass.

## Element / selector carrying the issue
`svg[role="img"]` (name via `#scatName`) paired with `figure > figcaption`. The caption is
accurate but conveys only the chart's structure, not its data pattern.

## Exact accessibility mechanism
A screen-reader user hears "Scatter plot of drug exposure versus hepatic clearance time," then
the axes and "60 participants, each marker is one participant." A sighted reader immediately sees
the upward trend and the separate high cluster — the two things the figure is published to
communicate and on which Section 5's dosing recommendations rest. The non-sighted reader gets the
chart's frame and none of its content; they cannot tell that exposure predicts clearance or that
a subgroup behaves anomalously. The alternative does not present the same information.

## Expected ACT-style outcome
**failed** — F67 (long description omits the correlation and the outlier cluster — the same
information the plot conveys). Name + description presence PASS; qt1vmo passes on gross identity.

## Why automated tools miss it
The SVG has a non-empty accessible name and an associated caption; axe/WAVE/Lighthouse see both
and report nothing, and qt1vmo passes because the name correctly identifies the scatter plot. No
tool fits a regression to the `<circle>` coordinates, detects the high-value cluster, or verifies
the caption mentions either. "Axes and N are present but the *result* is missing" is a human
reading of the point cloud.

## Citation
> **Reference:** WCAG Techniques — G95 (`wcag-techniques/general/G95.html`)
>
> "This technique is used when the text needed to serve the same purpose and present the same
> information as the original non-text content is too lengthy or when this goal cannot be
> achieved with text alone. In that case this technique is used to provide a short text
> alternative that briefly describes the non-text content. (A long text alternative is then
> provided ... such that the combination serves the same purpose and presents the same
> information as the original non-text content.)"
>
> (Here the short name describes the plot, but the required long alternative that "presents the
> same information" — the correlation and outliers — is missing, so the combination fails.)
