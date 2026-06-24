# case-05 — Conference schedule grid: track encoded by cell background color only, no T1/T2/T3 code

## Scenario
A developer conference ("DevConf 2026") publishes its Friday schedule as a two-room grid.
Each session cell is tinted by its track: blue = Platform & Data, green = Frontend, yellow
= AI & ML. The legend keys each track name to a colored square. The cell text gives the
session title and speaker but never the track name or a track code. There is no "T1/T2/T3"
text, no icon, and no border/shape difference between tracks — track membership is carried
solely by the cell background color. This is precisely the G14 "color-coded schedule"
example with the redundant text track code stripped out.

## Attribute tuple
- **content-domain:** events / conference programming
- **UI-component/pattern:** data `<table>` schedule grid with color-coded cells + swatch legend
- **host-language construct:** `<td class="track-…">` with track conveyed by CSS `background`
- **locale/i18n:** en-US
- **failure-mechanism:** track category encoded by cell background hue only; legend color-keyed; no in-cell text code/icon/pattern (G14/G111 not met)

## Developer persona
A conference organizer built the schedule in a spreadsheet, color-filling each cell by
track, then exported it to an HTML table for the event site. The spreadsheet "color = track"
mental model carried straight over. They added a color legend, considered the page done, and
never added the "T1/T2/T3" codes that the WCAG schedule example calls for — the colors
looked unambiguous to them. The table markup is clean because the export tool emits proper
`<caption>` and `<th scope>`.

## Element / selector carrying the issue
The track-tinted session cells: `td.sess.track-platform`, `td.sess.track-frontend`,
`td.sess.track-ai`. Track identity lives only in those classes' `background` color. The
legend `.key i` swatches are likewise color-only.

## Exact accessibility mechanism
A delegate planning their day needs to know each session's track. That information is
conveyed purely by cell background hue. A user with color-vision deficiency cannot reliably
separate the blue, green, and yellow tints (and the three pale pastels are nearly identical
in grayscale), so they cannot tell which sessions belong to the AI track they came for.
Nothing redundant carries the track: no "T1/T2/T3" code in the cell text, no icon, no
border/shape variation, no pattern. The G14 schedule example explicitly appends a text code
("T1 for Track 1, T2 for Track 2, and T3 for Track 3") for exactly this reason; its absence
here is the failure. The good table semantics (caption, scoped headers) help AT users read
the grid but do nothing for sighted CVD users, who 1.4.1 specifically protects.

## Expected ACT-style outcome
**failed** — SC 1.4.1 (Use of Color, Level A). A non-text categorical encoding (track) is
conveyed by background color alone with no visible non-color alternative.

## Why automated tools miss it
The table is, if anything, a model of good markup: `<caption>`, `<th scope="col">`, real
session text, and the title text clears 4.5:1 against every pastel tint. axe-core, WAVE,
and Lighthouse pass it and may even score the table semantics favorably. No checker can
render the grid, learn that the cell tints encode three tracks, confirm the legend is
color-keyed, and notice there is no text code/icon/pattern backing the color. Recognizing
that "track is conveyed by background hue only" is a semantic + visual judgment no static
analyzer performs.

## Citation
> **Reference:** WCAG Technique G14 "Ensuring that information conveyed by color
> differences is also available in text" — A color-coded schedule
> (`wcag-techniques/general/G14.html`)
>
> **Quote (verbatim):** "Sessions for Track 1 are displayed over a blue background.
> Sessions in Track 2 are displayed over a yellow background. Sessions in Track 3 are
> displayed on a green background. After the name of each session is a code identifying the
> track in text: T1 for Track 1, T2 for Track 2, and T3 for Track 3."
>
> **Reference:** WCAG Understanding 1.4.1 "Use of Color"
> (`wcag-understanding/use-of-color.html`)
>
> **Quote (verbatim):** "This should not in any way discourage the use of color on a page,
> or even color coding if it is complemented by other visual indication."
