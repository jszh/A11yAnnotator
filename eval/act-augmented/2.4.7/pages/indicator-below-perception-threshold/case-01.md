# case-01 — Editorial links: focus only shifts ink #000000 → #0a0a0a on white

## Scenario
A regional newspaper ("The Tidewater Review") runs a longform article with inline
links and a section nav. The newsroom replaced the browser's default focus ring with
a "quiet, on-brand" treatment: when a link receives keyboard focus, its text color
changes from pure black `#000000` to near-black `#0a0a0a` on the white page. The
default outline is removed (`outline:0`). Tabbing through links therefore produces a
real-but-imperceptible change and no other cue.

## Attribute tuple
- **content-domain:** news / long-form editorial
- **UI-component/pattern:** in-text links + a section-kicker `<nav>` of links
- **host-language construct:** `<a>` styled with `:focus { color:#0a0a0a }`, `outline:0`
- **locale/i18n:** en-US
- **failure-mechanism:** focus indicator present but its contrast change (~1.06:1) is below human perception (G195 magnitude limb)

## Developer persona
A front-end developer at the paper was told by the design lead that the default blue
focus ring "looks like a bug on our serif layout." She removed `outline` and, wanting
focus to still "do something," nudged the link color one step darker in the design
tool — `#0a0a0a` — which on her calibrated monitor "felt" slightly heavier. She never
tabbed the page on a normal display to confirm anyone could actually see it.

## Element / selector carrying the issue
`nav.kicker a:focus` and the in-article `main a:focus` — rule `a:focus { color:#0a0a0a }`
with `a { outline:0 }`.

## Exact accessibility mechanism
A sighted keyboard user tabs from link to link. The ONLY visual change on focus is the
text color moving from `#000000` to `#0a0a0a` on a `#ffffff` background. The contrast
*change* between the two focus states is about **1.06:1** (computed: relative luminance
0 vs ~0.0028) — there is no outline, no border, no underline change, no weight change.
This is far below G195's guidance of a 3:1 contrast change for the focus indicator, and
there is no indicator *area* at all (no 1px border, nothing on the shortest side). The
pixel diff is genuinely non-zero (glyph anti-aliasing edges shift by up to ~10/255 on a
few pixels — verified by a headless before/after diff: maxChannelDelta = 10), so the
ACT rule oj04fd ("an element... has visible focus" via *any* change in HSL) treats it as
a change. But no human can distinguish `#0a0a0a` from `#000` text on white, so the focus
position is effectively invisible — defeating the SC's purpose ("help a person know which
element has the keyboard focus").

## Expected ACT-style outcome
**failed** — SC 2.4.7 (Focus Visible, Level AA). A focus indicator that is below the
human perception threshold does not give the keyboard user a *visible* indication of
which element has focus.

## Why automated tools miss it
There IS a `:focus` rule and it changes a real property, so a "missing focus style /
`outline:none` with no replacement" heuristic does not fire — `outline:0` paired with an
author-supplied alternative is the legal pattern these heuristics are designed to permit.
axe-core, WAVE, and Lighthouse have no check that measures the *contrast delta* between
an element's focused and unfocused appearance and compares it to G195's 3:1 / area
thresholds. The oj04fd rule itself passes on ANY HSL change. Deciding that a ~1.06:1
ink shift is below human perception requires rendering both states and making a visual
judgment about noticeability — exactly the human reasoning the SC purpose demands.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.4.7 Focus Visible
> (`wcag-understanding/focus-visible.html`)
>
> **Quote (verbatim):** "The purpose of this success criterion is to help a person know
> which element has the keyboard focus."
>
> **Quote (verbatim):** "Without a focus indicator, sighted keyboard users cannot operate
> the page."
>
> **Reference:** WCAG Technique G195 "Using an author-supplied, visible focus indicator"
> (`wcag-techniques/general/G195.html`)
>
> **Quote (verbatim):** "Check that the change of contrast of the indicator between
> focused and unfocused states has a ratio of 3:1 or more for the minimum focus indicator
> area."
