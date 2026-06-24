# case-05 — PASS control: C34 media query un-fixes the sticky course header at the reflow height

## Scenario
A higher-ed LMS course page ("STAT 201, Week 4: Hypothesis Testing") uses the **same** kind of
generously-sized course header as the failing cases — course title, unit heading, a four-item
lesson nav, and a progress strip, `min-height: 128px`, sticky at desktop. But it implements WCAG
technique **C34** correctly: the header is `position: sticky` only behind
`@media (min-height: 481px)`, and `@media (max-height: 480px)` resets it to `position: static`.
At the 256px reflow viewport the header therefore un-fixes and scrolls away with the content, so
the full lesson is readable. Verified: at 320×256 the visible sticky/fixed chrome is **0px**.

## Attribute tuple
- **Content domain:** higher-ed LMS / course page
- **UI component / pattern:** sticky course/lesson header with progress strip
- **Host-language construct:** `header.coursebar` toggled between `position: sticky` and `position: static` by `min-height` / `max-height` media queries
- **Locale / i18n:** en
- **Failure mechanism:** none — this is the corrective C34 pattern, included as a boundary control

## Developer persona
The LMS team's accessibility lead had previously been bitten by a sticky header eating the
zoomed-in viewport (exactly case-01's failure) and adopted C34 as a house rule: any sticky
region must carry a `max-height` media query that un-fixes it on short viewports. They keep the
header sticky on tall screens (where it genuinely aids orientation) and let it scroll away when
space is scarce.

## Element / selector carrying the issue
`header.coursebar` — sticky under `@media (min-height: 481px)`, **static** under
`@media (max-height: 480px)`. This is the element that, correctly gated, makes the page pass.

## Exact accessibility mechanism
A low-vision user zooms to read the lesson. Below 480px viewport height the `max-height` media
query fires and the course header becomes `position: static`: it occupies the top of the
document once, then scrolls out of view as the reader scrolls down, giving the full 256px to the
lesson body. No reading space is permanently consumed and no focus is obscured. The information
(course context, progress) is not lost — it is reachable by scrolling to the top — satisfying the
SC's "without loss of information or functionality" while removing the obstruction. This is the
exact behaviour C34 prescribes and the Understanding doc's overlap note "strongly suggests."

## Expected ACT-style outcome
**passed** (SC 1.4.10). At the reflow viewport the sticky region un-fixes per technique C34, so
content reflows into one readable column with no persistent obstruction and no obscured focus.

## Why automated tools miss it
Symmetry point: a tool sees `position: sticky` inside a media query but cannot evaluate whether
the gate actually frees enough space at 256px — it would need to render at that height and judge
proportion. The PASS is therefore *also* a human visual-proportion judgment; it simply resolves
the other way. Verified empirically: at 320×256 the header is static and consumes 0px of fixed
chrome. An automated checker can neither confirm nor deny this without rendering and reasoning at
the narrow viewport, which is why this boundary control sharpens the aspect — it proves the
distinction is "how much space remains at 256px," not "is `position: sticky` present."

## Citation
**Reference:** WCAG 2.2 Technique C34 — "Using media queries to un-fix sticky headers / footers", Description (`wcag-techniques/css/C34.html`)
> "Disabling, or un-fixing sticky regions, is an effective way to allow for enough available space when users prefer different reading and zoom preferences or when using landscape mode."

**Reference:** WCAG 2.2 Technique C34 — example CSS (`wcag-techniques/css/C34.html`)
> "@media (min-height: 480px) {\n      header {\n        position: -webkit-sticky;\n        position: sticky;\n        top: 0;\n      }\n    }"

**Reference:** WCAG 2.2 Understanding — Reflow, Focus Not Obscured overlap note (`wcag-understanding/reflow.html`)
> "It is strongly suggested that at smaller viewport sizes that such components are modified to have static positioning, or their display can be toggled by the user."
