# case-05 — News archive: visited vs unvisited links differ by colour only, below 3:1 (visited-link exemption)

## Scenario
A newsroom investigations archive lists article links. The links are distinguished from static text by an UNDERLINE (a non-colour cue), so the link-vs-text distinction is fine. The only purely colour-based distinction is between visited links (purple) and unvisited links (blue), and the contrast between those two link colours is ~1.09:1 — below 3:1. Per the visited-link exemption, distinguishing visited from unvisited links by colour alone does NOT fail SC 1.4.1, even below 3:1.

## Attribute tuple
- **content-domain:** news / long-form editorial (investigations archive)
- **UI-component / pattern:** list of article links grouped by year
- **host-language construct:** `a { color:#1a52b5; text-decoration:underline }` + `a:visited { color:#5a3da8 }`
- **locale / i18n:** en
- **failure-mechanism:** NONE — colour-only visited/unvisited distinction is explicitly exempt (limb d)

## Developer persona
A newsroom developer kept the browser's classic blue/purple link convention but tuned both shades to match the publication's palette, landing on a blue and a purple that look almost equally dark (contrast between them under 3:1). They knew they could not add any non-colour styling to the `:visited` state (the `:visited` pseudo-class is restricted to colour changes for privacy reasons), and correctly relied on the visited-link exemption. The link-vs-text distinction is carried by the underline.

## Element / selector carrying the issue
`ul.archive a` (unvisited `#1a52b5`) and `ul.archive a:visited` (`#5a3da8`). The visited/unvisited difference is colour-only and below 3:1; the link-vs-text difference is the underline.

## Exact accessibility mechanism (what AT experiences / why it passes)
- Links are distinguished from static text by an UNDERLINE, a non-colour cue, so there is no F73 failure on the link-vs-text axis.
- The visited vs unvisited distinction is colour-only and the two link colours contrast at ~1.09:1 (below 3:1). The Understanding note states that where colour alone distinguishes visited from unvisited links, it does not result in a failure of this criterion, even where the contrast between the two link colours is below 3:1 — because authors have very limited control over visited-state styling (the `:visited` pseudo-class can only change colour, for privacy reasons), so conveying visited state is not an author responsibility.
- Both link colours still meet SC 1.4.3 against the page (~7:1), so contrast minimums against the background are satisfied.

Verified by rendering (with a simulated visited state on alternate rows the visited links read only marginally different from unvisited, confirming <3:1 between them) and contrast computation: unvisited/visited inter-element = 1.09:1; unvisited/bg = 7.2:1; visited/bg = 7.9:1.

## Expected ACT-style outcome
**passed** (SC 1.4.1 — the colour-only distinction is between visited and unvisited links, which is exempt even below 3:1; link-vs-text is carried by the underline).

## Why automated tools miss it
A tool that measures the contrast between `:link` and `:visited` colours and finds it below 3:1 might naively flag a use-of-colour or contrast problem. The correct verdict requires knowing the SPECIFIC visited-link exemption — that conveying a link's visited status is not an author responsibility because the `:visited` pseudo-class is constrained to colour for privacy — which no automated checker encodes. Distinguishing this exempt case from a genuine F73 (colour as the ONLY link cue) also requires confirming the underline carries the link-vs-text role.

## Citation
> "Where color alone distinguishes between visited and unvisited links, it does not result in a failure of this Success Criterion, even where the contrast between the two link colors is below 3:1. Note that authors must continue to ensure that all text links meet contrast minimums against the page background (SC 1.4.3)."
— wcag-understanding/use-of-color.html (Intent note — visited-link exemption)

> "It is considered a browser setting if a visited link changes color — this is not failed for 13.A."
— refs/trusted-tester/sc-1.4.1-use-of-color.md (Notes)
