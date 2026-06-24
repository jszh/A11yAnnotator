# case-05 — Menu nav links: focus only nudges letter-spacing by ~0.17px per gap

## Scenario
A restaurant site ("Osteria del Ponte") gives its menu-section nav links a "subtle kinetic"
focus treatment. The ONLY thing `:focus` changes is `letter-spacing`, from `.12em` to
`.132em` (a +0.012em ≈ 0.2px-per-gap nudge); the default outline is removed. Tabbing through
"Antipasti / Primi / Secondi / Dolci / Reservations" shifts a handful of anti-aliased glyph
edges by a fraction of a pixel — a non-zero pixel diff with no perceptible focus cue.

## Attribute tuple
- **content-domain:** restaurant menu / hospitality
- **UI-component/pattern:** menu-section navigation links
- **host-language construct:** `<a>` with `:focus { letter-spacing:.132em }`, `outline:0`
- **locale/i18n:** Italian menu content, `lang="en"` page (mixed but not the defect)
- **failure-mechanism:** focus change is a pure sub-pixel geometry nudge (no color/border/size box) — below perception (G195 magnitude limb, geometry facet)

## Developer persona
The boutique studio that built the site prides itself on micro-interactions. The designer
wanted focus to make the word "breathe" and kept dialing `letter-spacing` down until the
motion was "barely there for elegance" — past the point where it reads as a focus indicator
at all. They removed `outline` because "the spacing *is* the interaction," not realizing the
result is no perceptible indicator for keyboard users.

## Element / selector carrying the issue
`nav.cats a:focus { letter-spacing:.132em }` (base `nav.cats a { letter-spacing:.12em;
outline:0 }`) on the five menu-section links.

## Exact accessibility mechanism
A sighted keyboard user Tabs across the section links. On focus the only change is
`letter-spacing` increasing by 0.012em — at 17px that is ~0.2px per inter-letter gap.
Measured live, the focused "Antipasti" link grows from 81.98px to 83.36px total (a 1.38px
spread across 8 gaps, ~0.17px each): the word does not visibly move. There is no color
change, no outline, no border, no size box, no weight change — nothing a human can point to
as "this link is focused." The sub-pixel reflow does flip a few anti-aliased glyph-edge
pixels between near-black and near-cream (so a per-pixel diff records a non-zero change, and
oj04fd passes), but the change is below human perception as a focus indicator. The SC's
purpose — letting the user "visually determine the component on which keyboard operations
will interact" — is not met.

## Expected ACT-style outcome
**failed** — SC 2.4.7 (Focus Visible, Level AA). A fractional letter-spacing nudge that
shifts only a few edge pixels is not a *visible* indication of which element has focus.

## Why automated tools miss it
There is a `:focus` rule and it changes a real layout property (`letter-spacing`), so no
"missing focus style" heuristic fires, and `outline:0` has an author-supplied (if useless)
replacement. axe-core / WAVE / Lighthouse cannot rasterize the two focus states, diff them,
and decide the sub-pixel reflow is below human perception — and a pixel-diff checker only
confirms "yes, some edge pixels changed." Whether a ~0.17px-per-gap letter-spacing shift is
a perceptible focus indicator is a pure human visual judgment.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.4.7 Focus Visible
> (`wcag-understanding/focus-visible.html`)
>
> **Quote (verbatim):** "This success criterion helps anyone who relies on the keyboard to
> operate the page, by letting them visually determine the component on which keyboard
> operations will interact at any point in time."
>
> **Quote (verbatim):** "Ensure each item receiving focus has a visible indicator."
>
> **Reference:** WCAG Technique G195 "Using an author-supplied, visible focus indicator"
> (`wcag-techniques/general/G195.html`)
>
> **Quote (verbatim):** "Navigate to the component and check that it has a visible focus
> indicator."
