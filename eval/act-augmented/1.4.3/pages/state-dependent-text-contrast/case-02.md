# case-02 — Section-nav link contrast fine at rest, drops to ~2.55:1 on :hover/:focus

## Scenario
A business-news masthead with a horizontal section navigation (Markets, Economy, Companies, Opinion, Technology). At rest each link is dark brand blue (`#1a3a6b`) on white — about **11.3:1**, comfortably passing. On `:hover` (and `:focus`) the link recolors to a pale brand blue (`#8aa4c8`) on the same white bar — about **2.55:1**, below the 4.5:1 minimum for this 15px normal-weight label. The link text is genuine, meaningful navigation text shown when a pointer hovers or the link has keyboard focus — squarely in the 1.4.3 extension.

## Attribute tuple
- **content-domain:** online newspaper / financial journalism
- **UI-component / pattern:** primary section navigation bar (`<nav>` with link list)
- **host-language construct:** `a:hover, a:focus` pseudo-class `color` rule
- **locale / i18n:** en-GB
- **failure-mechanism:** hover/focus text color below 4.5:1 — the hover/focus state the 1.4.3 Understanding explicitly brings into scope

## Developer persona
A designer at the paper built the nav as a Webflow interaction, then it was hand-coded by a junior dev. The brand kit had two blues: a dark "default" and a light "accent." The designer used the light accent as the hover treatment because it looked airy in the comp; nobody checked that "accent on white" is only ~2.55:1. The rest state was contrast-checked and signed off; the hover state was never measured because the QA pass screenshotted the page without a pointer over the nav.

## Element / selector carrying the issue
`nav.primary a:hover` / `nav.primary a:focus` — `color:#8aa4c8` on the `#fff` nav bar (rest `color:#1a3a6b` passes).

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Low-vision / contrast-impaired sighted user, pointer user:** moving the mouse over a section link makes the label fade to ~2.55:1 — the very moment they are trying to read which section they are about to click, the label becomes hard to read.
- **Keyboard user:** the same pale color is applied on `:focus`, so tabbing through the nav presents each focused label at ~2.55:1.
- The resting color is fine, so the failure exists only in the hover/focus state — exactly the state the SC says must still meet contrast.

## Expected ACT-style outcome
**failed** (SC 1.4.3 — hover/focus link text at 2.55:1 < 4.5:1; hover/focus text is in scope).

## Why automated tools miss it
axe-core, WAVE, and Lighthouse evaluate the page in its static, un-hovered render. No pointer is over any element during a scan and the tools do not synthesize `:hover`, so the computed style they read for each link is the resting `#1a3a6b`, which passes at ~11.3:1. The `:hover`/`:focus` rule is real CSS that genuinely repaints the link, but a scanner never enters that state. Detecting the failure requires a human (or a driven session) to hover or tab onto a link and measure the hovered color against the bar.

## Citation
> "This success criterion applies to text in the page, including placeholder text and text that is shown when a pointer is hovering over an object or when an object has keyboard focus. If any of these are used in a page, the text needs to provide sufficient contrast."
— wcag-understanding/contrast-minimum.html (Intent)

> "Best practice is to include all states of the text. For example, text, link text, visited link text, link text with hover and keyboard focus, etc."
— wcag-techniques/failures/F24.html (Description, note)
