# case-04 — Repeating-word ornamental divider "menu · menu ·" (decorative rule, EXEMPT → passed)

## Scenario
A restaurant menu uses a faint repeated word ("menu · menu · menu ·") as a decorative rule
between sections, `#d2d2d2` on cream ≈ 1.5:1. The repeated token is an ornament — the real
section names are the dark `<h2>` "Entrées"/"Plats" directly beneath it. This is a clean
pure-decoration case: a contrast number flags the divider, but the correct verdict is
exemption (PASS). It pairs structurally against case-01's tiled repeated word (DRAFT), which
is meaningful — same mechanism, opposite ruling.

## Attribute tuple
- **content-domain:** restaurant menu / food-service
- **UI-component/pattern:** typographic section divider / ornamental rule between content sections
- **host-language construct:** hand-authored HTML5 + CSS; repeated-word `<div>` as a horizontal rule
- **locale/i18n:** fr-FR menu content within an `en` page (French dish names, EUR prices)
- **failure-mechanism:** genuinely decorative repeated word at ~1.5:1 that a checker FALSE-POSITIVES; correct ruling is exemption → page PASSES 1.4.3

## Developer persona
A café owner using a Squarespace-style template wanted "those little repeating-word divider
lines" she saw on a design blog. She typed the word "menu" over and over into a divider
block and set it very light gray so it would "whisper, not shout." She intended pure
ornament; the word itself is incidental and could be anything.

## Element / selector carrying the issue
`.ornarule` — two repeated-word divider `<div>`s, `color:#d2d2d2` on `#fbf8f3`,
`aria-hidden="true"`, placed between menu sections.

## Exact accessibility mechanism
The divider text conveys no information: the actual section identity comes from the dark
`<h2>` headings ("Entrées", "Plats"), and the repeated word "menu" could be replaced by
dots, stars, or removed without changing the menu's meaning — the Understanding test for
decoration. It is therefore exempt from contrast, so its ~1.5:1 ratio is not a 1.4.3
failure. The divider is `aria-hidden`, so AT users skip it; sighted low-vision users lose no
information because none is carried. All informative text (headings, dish names,
descriptions, prices) is dark and meets contrast.

## Expected ACT-style outcome
**passed** — the only failing-contrast text is a decorative ornamental rule (exempt); all
informative text meets the requirement. The boundary variant demonstrates the exemption
applied correctly to a repeated-word background, contrasting case-01.

## Why automated tools miss it
axe/WAVE/Lighthouse would compute ~1.5:1 for the divider and report a violation, producing a
false positive. They cannot read the repeated word, recognize it as ornament, verify it is
substitutable/removable, and confirm the real section names are dark and pass. The exemption
is a semantic judgment; tools only see a low ratio and would wrongly fail the page. The
near-identical markup to case-01 (a faint repeated word) — but opposite correct verdict — is
precisely why no automated rule can resolve this aspect.

## Citation
> **WCAG 2.2 Understanding — Contrast (Minimum)** (`wcag-understanding/contrast-minimum.html`):
> "if random words are used to create a background and the words could be rearranged or
> substituted without changing meaning, then it would be decorative and would not need to
> meet this criterion."
