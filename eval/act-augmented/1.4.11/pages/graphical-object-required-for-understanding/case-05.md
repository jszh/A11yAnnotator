# case-05 — Stacked-area chart, pale bands (~1.1:1) with NO inline values, but a working "Long Description" data table → Not Applicable

## Scenario
An open-data site ("GridWatch") shows "Electricity generation mix, 2015–2024" as an inline-SVG
stacked-area chart on a dark panel. The five bands are pale tints that sit only ~1.05–1.3:1
against each other, so the band-to-band boundaries — the graphical objects you'd normally need
to read the shares — are below 3:1, and there are **no inline values** on the chart. On its own
this would fail like case-01/03. **But** immediately below the chart, a working `<details>`
"View data table (Long Description)" discloses a real, conforming `<table>` carrying every value
for every year and source. Per the Understanding "Required for Understanding" list, when the
information is available in a table revealed by a Long Description button, the graphic is not
relied upon for understanding → **Not Applicable**. This is a *different* exemption mechanism
than case-02 (inline labels+values): here the equivalence comes from a separate data table.

## Attribute tuple
- **content-domain:** government / open-data / energy statistics
- **UI-component/pattern:** inline-SVG stacked-area chart + `<details>` disclosure data table
- **host-language construct:** five stacked `<polygon>` bands; `<details><summary>` revealing a
  `<table>` with `<caption>`, `scope="col"`/`scope="row"` headers
- **locale/i18n:** en-GB
- **failure-mechanism:** *none that fails* — the long-description data-table exemption applies;
  included as a long-tail NA boundary distinct from the inline-label exemption (case-02).

## Developer persona
A civic-data developer themed the dashboard dark and used a tasteful monochrome tint ramp for
the stacked bands, so the boundaries came out faint (~1.1:1). Knowing the bands were hard to
read precisely, he deliberately added a "View data table (Long Description)" disclosure
containing the full dataset — following the WCAG guidance that a data table behind a Long
Description button exempts a chart. That conscious choice is what makes the page conform despite
the low-contrast bands.

## Element / selector carrying the issue
The low-contrast graphical objects are the band boundaries between the stacked `<polygon>`
elements (`svg.area polygon`), ~1.1:1 apart. The exempting element is the disclosure
`details.ld` and its `table.data`, which supplies the equivalent text (every value for every
year/source).

## Exact accessibility mechanism (what AT experiences, why it passes/NA)
A user with moderately low vision who cannot distinguish the ~1.1:1 band boundaries can open
"View data table (Long Description)" and read the exact share for each source and year in a
plain table — the data is available in another form. A screen-reader user reaches the same
table via the `<summary>` disclosure; the table uses `<caption>` and scoped headers so it is
fully navigable, and the `aria-label` explicitly points to it ("Exact figures are in the data
table below"). Per the Understanding list, because the information is available in a table that
becomes visible when a Long Description is pressed, the chart's bands are not required for
understanding and their low contrast does not fail 1.4.11 → **Not Applicable**.

## Expected ACT-style outcome
**inapplicable**

## Why automated tools miss it
A scanner that *did* parse the SVG could flag the ~1.1:1 band boundaries as a non-text-contrast
failure — a **false positive** here. The correct outcome is Not Applicable, but no automated
tool can find the `<details>` sibling, verify that the disclosed table actually contains the
chart's data for every series and year, and conclude that the low-contrast bands are therefore
exempt. "Does a long description / data table convey the equivalent information, so the graphic
is not relied upon?" is exactly the human judgment that separates Fail from Not Applicable — and
it is a *different* exemption from the inline labels+values of case-02, which a single hard-coded
rule could not capture either.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — Required for Understanding:**
> "The information is available in another form, such as in a table that follows the graph, which
> becomes visible when a \"Long Description\" button is pressed."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The page implements exactly this:
a Long Description disclosure reveals a data table with the full dataset, so the low-contrast
bands are exempt.)

> **WCAG 2.2 Understanding, Non-text Contrast — Infographics:**
> "A long description would also be sufficient because then the infographic is not relied upon
> for understanding."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The principle applies to this chart:
the long-description table means the graphic is not relied upon, making the band contrast Not
Applicable.)
