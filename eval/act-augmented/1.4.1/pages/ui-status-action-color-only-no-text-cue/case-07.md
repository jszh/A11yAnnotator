# case-07 — TRUE NEGATIVE: color-coded transit schedule WITH a T1/T2/T3 text code per row

## Scenario
A light-rail weekend departures board groups services into three tracks, each shown over a
distinct background hue. Crucially, every departure ALSO carries an in-text track code after
the destination ("· T1", "· T2", "· T3"), and the legend ties each code to its line name.
Colour is complemented by a non-colour text cue carried in the content, so in grayscale a
rider can still read which track each departure belongs to. This is the sufficient G14
pattern and PASSES.

## Attribute tuple
- **content-domain:** municipal transit schedule (light rail departures)
- **UI-component/pattern:** schedule **table** (`<table>` of departures) — deliberately different DOM from case-04's card grid
- **host-language construct:** `<tr class="t1|t2|t3">` background hue + a `<span class="code">· T1</span>` text code in every destination cell
- **locale/i18n:** en (generic)
- **failure-mechanism:** none — the passing boundary for case-04's failing colour-coded conference schedule

## Developer persona
A transit-agency dev built the board from the official W3C G14 example, keeping both halves:
the per-track background colour *and* the "T1/T2/T3" text code on every row. Chose a table
(real tabular departure data) rather than cards to fit the existing timetable component.

## Element / selector carrying the issue
None (boundary case). The track is conveyed by both `tr.t1/.t2/.t3` background **and** the
`span.code` text ("· T1" etc.) inside each destination cell.

## Exact accessibility mechanism
A user who cannot perceive the track hues still reads the "· T1 / · T2 / · T3" code in each
destination cell and maps it via the legend, so the track category is fully available
without colour. A screen-reader user hears, e.g., "Harbour Int'l Airport · T2." The verified
expectation is that in grayscale the codes remain legible and the track stays
distinguishable. Colour is redundant reinforcement.

## Expected ACT-style outcome
**passed** — the track category conveyed by background hue is also conveyed by the in-text
T1/T2/T3 code on every row (G14 satisfied); colour is not the only visual means.

## Why automated tools miss it
As with the other boundary case, a tool cannot *certify* the pass — it cannot reason that
the "· T2" text adequately backs the colour. But there is no defect. This page exists to
verify the evaluator separates a genuinely G14-compliant colour-coded schedule from the
failing case-04, which uses the *same* hue-per-track design but omits the text code.

## Citation
> **WCAG Technique G14 (Understanding 1.4.1 / G14.html — "A color-coded schedule"):** "…
> **After the name of each session is a code identifying the track in text: T1 for Track 1,
> T2 for Track 2, and T3 for Track 3.**"

This page implements that text-code sentence faithfully (a "· T1/T2/T3" code after every
destination), which is exactly what makes the colour redundant and the pattern pass — the
sentence case-04 deliberately omits.
