# case-03 — Primary nav of six links collapses to a hamburger button that is dead (no menu wired); destinations unreachable at 320px (FAIL)

## Scenario
A municipal transit site ("Cedar Valley Transit") shows its six primary destinations — Plan a trip,
Schedules, Fares & passes, Service alerts, Accessibility services, Contact us — as a horizontal nav at
desktop width. A `@media (max-width:768px)` rule hides the nav list and reveals a hamburger button
labelled "Menu." The button is genuinely well-formed: `type="button"`, `aria-label="Menu"`,
`aria-expanded="false"`. But it is purely decorative — there is no click handler, no `<details>`, no
target panel, and no links inside it. Activating it does nothing. At 320px the six destinations are
display:none and exist nowhere else (the footer carries only Privacy / Terms / Public-records links).
A low-vision user who zooms to 400%, or any phone user, can never reach the six destinations.

## Attribute tuple
- **Content domain:** municipal / public transit schedule
- **UI component / pattern:** primary navigation collapsing to a hamburger "menu button"
- **Host-language construct:** real `<button aria-label aria-expanded>` with **no** wired menu; nav `<ul>` set to `display:none` in a `@media (max-width:768px)` query
- **Locale / i18n:** en-US (24-hour-free US transit phrasing, "Public records")
- **Failure mechanism:** decorative/dead replacement control — the hamburger looks like the SC-blessed responsive pattern but reveals nothing

## Developer persona
A government contractor delivered the site theme and the hamburger markup, intending to wire the toggle
JavaScript "in the next sprint." The CSS that hides the desktop nav and shows the hamburger shipped;
the JavaScript that opens the menu never did. Because the button renders and has an accessible name,
the visual QA pass and the automated scan both came back green, so the missing behaviour went
unnoticed — the page *looks* like every other responsive site that collapses nav into a hamburger.

## Element / selector carrying the issue
`button.hamburger` (selector `.hamburger`) — shown only by `@media (max-width:768px){ .hamburger {
display:inline-block } }` while `nav.primary { display:none }` removes the six links. The button has no
`onclick`, references no panel, and contains no links. The six dropped destinations are the six `<a>`
elements under `nav.primary ul li`.

## Exact accessibility mechanism
At ≥769px the six navigation links are visible, focusable, and operable. At 320px the nav is removed
from the rendering and a hamburger button takes its place. A keyboard or screen-reader user can focus
and activate that button — `aria-expanded` stays `"false"` because nothing toggles it — and no menu
opens, no links appear, focus goes nowhere. The six destinations are not repositioned into the column,
not behind a working disclosure, and not duplicated anywhere, so the entire primary navigation
(functionality available at desktop width) is unavailable after reflow to 320px. This is the F102
"hamburger that goes nowhere" failure: a replacement mechanism is present but does not surface the
dropped content.

## Expected ACT-style outcome
**failed** (SC 1.4.10). Navigation functionality present at 1280px is unreachable at 320px; the
hamburger is a dead control, not an equivalent mechanism. (Contrast case-04, where the same collapse
is implemented with a working disclosure and passes.)

## Why automated tools miss it
axe-core, WAVE, and Lighthouse see a valid `<button>` with an accessible name and an `aria-expanded`
attribute — it passes button-name and role checks. The six `<a>` links also exist in the static DOM
(merely `display:none` at narrow width), so link checks pass too. No automated tool activates the
button at a 320px viewport, observes whether a menu actually opens, and verifies that the dropped
navigation became reachable. The PASS pattern (working hamburger) and this FAIL pattern (dead
hamburger) are byte-for-byte indistinguishable to a static scanner — telling them apart requires a
human to operate the control after reflow and judge whether it genuinely reveals the lost links.

## Citation
**Reference:** WCAG Technique F102 (`wcag-techniques/failures/F102.html`)
> "This content, however, should still be available after reflow to 320px viewport width, either by being repositioned in a single column view, or through some interaction offering the information in some other way, for example, in a disclosure area, a dialog, or via a link to another view."

**Reference:** Understanding SC 1.4.10 Reflow — Examples (`wcag-understanding/reflow.html`)
> "Note that as the zoom percentage increases, the navigation changes first to hide options behind a \"More\" dropdown menu. As zooming continues, most navigation options are eventually behind a \"hamburger\" menu button. All the information and functionality is still available from this web page."
