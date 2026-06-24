# case-01 — 130px position:sticky news masthead eats 83% of the 256px reflow viewport

## Scenario
"Tidewater Dispatch", a small coastal newspaper, publishes a long-form estuary feature. The
masthead — wordmark, tagline, a five-item section nav, and a dateline — is a `position: sticky`
header given `min-height: 130px` so the brand stays on screen as readers scroll. At a desktop
height of ~900px that 130px header is an unremarkable ~14% of the screen. When a low-vision
reader zooms to the Reflow target (a viewport equivalent to 256 CSS pixels tall), the sticky
masthead is rendered at **212px of the 256px viewport — 83%** — leaving roughly a 44px sliver
in which to read the article. The article text itself reflows perfectly to a single 320px-wide
column with no horizontal scrolling; only the vertical space is destroyed.

## Attribute tuple
- **Content domain:** news / long-form editorial
- **UI component / pattern:** site masthead with sticky brand + section navigation
- **Host-language construct:** `<header class="masthead">` with `position: sticky; top: 0; min-height: 130px`
- **Locale / i18n:** en (LTR)
- **Failure mechanism:** a valid sticky header sized for desktop consumes the *height* axis of the 256px reflow viewport, leaving an unreadable sliver

## Developer persona
A solo developer who maintains the paper's site read that "sticky headers keep your brand
visible and improve navigation," copied a sticky-header recipe from a CSS blog, and set a
comfortable `min-height` so the wordmark and section links never wrap on desktop. They tested
at 320px *width* (the number they'd heard for reflow) and saw the article wrap correctly, so
they shipped it. They never set the browser to a 256px *height* — the height axis of the SC —
and so never saw the masthead swallow the screen.

## Element / selector carrying the issue
`header.masthead` — `position: sticky; top: 0; min-height: 130px` (rendered ~212px tall once
the logo row, section nav, and dateline stack at 320px width).

## Exact accessibility mechanism
A screen-magnifier / low-vision user zooms the page to read it. At the Reflow height of 256
CSS pixels the sticky masthead pins to the top and occupies 83% of the viewport, so only a
two-or-three-line band of article text is ever visible; the reader must scroll almost a full
screen for every couple of lines, which is precisely the "scroll back and forth / lose your
place / increased physical and cognitive effort" harm the SC exists to prevent. The content is
not *lost* (it scrolls beneath), but it cannot be *read* without loss of function. A screen
reader user is unaffected; the harm is specific to people who zoom — the population Reflow
protects. The corrective pattern (WCAG technique C34) — un-fixing the header at small heights —
is not applied here (compare case-05, which applies it).

## Expected ACT-style outcome
**failed** (SC 1.4.10). At the 256px reflow viewport a persistent sticky region consumes the
overwhelming majority of the screen, so non-excepted reading content cannot be presented
without loss of information/functionality. The header is decorative chrome, not excepted
two-dimensional content.

## Why automated tools miss it
The viewport meta allows zoom (ACT rule b4f0c3 passes), the article reflows to one column with
**0px horizontal overflow at 320px**, and `position: sticky` + `min-height: 130px` are valid,
ubiquitous CSS that no linter flags. axe-core, WAVE, and Lighthouse never render the page at a
256px-*tall* viewport, and even if they did they have no rule that computes "the visible sticky
chrome as a fraction of the viewport." Verified empirically: at 320×256 the masthead renders
212px tall (83% of the height). Judging that the remaining sliver is unusable is a
visual-proportion decision a human must make at the narrow viewport — exactly the judgment the
SC's Focus-Not-Obscured overlap note assigns to a reviewer.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, "Overlap with other success criteria → Focus Not Obscured (Minimum)" (`wcag-understanding/reflow.html`)
> "Such sticky or fixed content can pose significant issues for those who would benefit from Reflow, as aside from obscuring keyboard focus, such sticky or fixed content can make reading content difficult if not impossible."

**Reference:** WCAG 2.2 Technique C34 — "Using media queries to un-fix sticky headers / footers" (`wcag-techniques/css/C34.html`)
> "when using mobile devices in landscape orientation or when zooming in on the desktop, sticky regions may block a big portion of the screen: the height of the sticky region may leave only a small part of the screen for the display of page content."

**Reference:** WCAG 2.2 Understanding — Reflow, "Intent" (`wcag-understanding/reflow.html`)
> "The intent of this success criterion is to let users enlarge text and other related content without having to scroll in two dimensions to read."
