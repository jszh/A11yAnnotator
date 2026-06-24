# case-04 — Scoreboard: `grid-template-areas` re-pairs team/score on screen, but DOM groups teams then scores

## Scenario
A football full-time scoreboard. Visually it reads, in two tidy rows: **Hillside Harriers — 3** and **Riverton Wanderers — 1**. It is a CSS grid using `grid-template-areas`. But the four grid items are authored in the source **grouped by type, not by team**: both team names first, then both scores — DOM order `Harriers, Wanderers, 3, 1`. Grid placement (`grid-area`) re-pairs each score with its team visually. Linearized for a screen reader, the page reads **"Hillside Harriers  Riverton Wanderers  3  1"** — the scores detach from their teams, and a listener cannot tell who scored 3 and who scored 1.

## Attribute tuple
- **content-domain:** sports / live results
- **UI-component / pattern:** scoreboard (label/value grid)
- **host-language construct:** `display:grid` + `grid-template-areas` + `grid-area` placement; DOM items grouped by type
- **locale / i18n:** en-GB
- **failure-mechanism:** F1-style — CSS grid placement re-pairs items visually while source order interleaves them so each score binds to the wrong (or no) team when linearized

## Developer persona
A junior developer hand-built the widget from a "CSS grid scoreboard" CodePen. They found it tidier to author all the team names together and then all the scores together in the markup, and relied on `grid-template-areas` to position each item in the right cell. The grid renders the correct pairing, so the source-order grouping looked harmless during a quick visual check.

## Element / selector carrying the issue
`.board` (the `grid-template-areas` container). The four children — `.home`, `.away`, `.homescore`, `.awayscore` — are in DOM order team, team, score, score, but `grid-area` places them as team/score per row.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted user:** reads "Harriers 3, Wanderers 1" — each score is adjacent to its team.
- **Screen-reader user:** grid placement is presentational; the accessibility tree follows DOM order, so the four cells are spoken "Hillside Harriers, Riverton Wanderers, 3, 1". There is no programmatic association between a team and its score (no table, no `aria` pairing), so the listener hears two team names, then two bare numbers, and cannot reconstruct the result. A braille user gets the same detached stream.
- Verified with Puppeteer: visual order (top→bottom, left→right) is `3, Hillside Harriers, 1, Riverton Wanderers`; DOM/linearized order is `Hillside Harriers, Riverton Wanderers, 3, 1` — the scores are separated from their teams.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — CSS grid placement creates a visual pairing whose meaning is lost in the programmatically-determined reading order).

## Why automated tools miss it
Each cell contains valid text; there are no empty nodes, missing names, or contrast failures, so axe/WAVE/Lighthouse find nothing. Tools do not reconstruct the visual grid pairing from `grid-area` rules to compare against source order, and even detecting the geometric mismatch would not tell a tool that "3" must be read immediately after "Hillside Harriers" to convey the score. Binding a number to the adjacent team is content comprehension — a human judgment.

## Citation
> "Assistive technologies rely on the source code or other programmatically determined order to render the content in the correct sequence. Thus, it is important not to rely on CSS to visually position content in a specific sequence if this sequence results in a meaning that is different from the programmatically determined reading order."
— wcag-techniques/failures/F1.html (Description)

> "Check that the reading order of the content is correct and the meaning of the content is preserved in relation to the surrounding page or context … Code inspection: review the HTML code to determine the logical reading sequence."
— wcag-techniques/failures/F1.html (Tests › Procedure)
