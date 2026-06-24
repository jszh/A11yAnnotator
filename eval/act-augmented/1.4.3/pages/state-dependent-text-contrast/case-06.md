# case-06 — Visited-link exclusion boundary: faint :visited color is NOT a 1.4.3 failure (PASS)

## Scenario
A university coursework-wiki reading list. Links are styled so that **already-opened** entries fade — the wiki's "already read" marker. The `:visited` color is deliberately faint (`#b9b3c9` on white, ~2.03:1, below 4.5:1). A judge who drives the page, clicks a reading, and measures the now-faded visited color could be tempted to flag 1.4.3 — but visited-link styling is on the **exclude** list, so the faint visited color is *not* a failure. Every in-scope state passes: unvisited (`a:link`, ~12.1:1), hover (~14.9:1), and focus (~14.9:1 + outline). This is the boundary case that confirms the judge honors the visited exclusion rather than over-flagging a driven low-contrast state.

## Attribute tuple
- **content-domain:** higher-education / coursework wiki
- **UI-component / pattern:** prose reading-list of hyperlinks with visited-state styling
- **host-language construct:** `a:link` / `a:hover` / `a:focus-visible` / `a:visited` pseudo-class color rules
- **locale / i18n:** en-GB academic citations
- **failure-mechanism:** NONE in scope — the only sub-threshold state (`:visited`) is excluded from 1.4.3; included as a passing boundary variant

## Developer persona
A history TA maintaining the module wiki wanted students to see at a glance which readings they had already opened, so they added a faded `:visited` color — a common, well-intentioned "read/unread" affordance. They kept unvisited, hover, and focus colors dark and high-contrast. The faded visited color is intentional UI semantics (mark as read), not a contrast oversight, and it falls under the SC's visited-link exclusion.

## Element / selector carrying the issue
`a:visited` — `color:#b9b3c9` (~2.03:1). This is the **excluded** state. In-scope `a:link` (`#20355e`), `a:hover`/`a:focus-visible` (`#16264a`) all pass.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **In-scope states (unvisited, hover, focus):** all dark, all ≥12:1 — readable for low-vision users; no failure.
- **Visited state:** faded by design to indicate "already read." Trusted Tester explicitly excludes text "Changed to indicate it is a 'visited' link" from the contrast requirement, so a faint visited color is not a 1.4.3 violation.
- **Net:** no in-scope text is below threshold, so the page passes. The test of the judge is whether they correctly attribute the faint color to the visited exclusion instead of reflexively flagging the low ratio they measured after clicking.

## Expected ACT-style outcome
**passed** (SC 1.4.3 — all in-scope link states ≥4.5:1; the only faint state is `:visited`, which is excluded).

## Why automated tools miss it
For privacy, browsers never expose the real `:visited` color via `getComputedStyle` (history-sniffing protection), and scanners do not synthesize a visited state, so automated tools never see the faint color at all — they would also report a pass, but only by accident of not measuring it. The *correct* human verdict (pass) rests on a judgment automated tools cannot make: recognizing that the faint color is the visited state and that the SC's visited-link exclusion removes it from scope. A judge who drives the page must apply the exclusion rather than flag the measured ~2.03:1.

## Citation
> "EXCLUDE text that is: … Changed to indicate it is a 'visited' link"
— refs/trusted-tester/sc-1.4.3-contrast-minimum.md (Identify Content)

> "Best practice is to include all states of the text. For example, text, link text, visited link text, link text with hover and keyboard focus, etc."
— wcag-techniques/failures/F24.html (Description, note) — visited-link styling is named as best practice, not a normative requirement; the SC excludes the visited state from contrast.
