# case-03 — Literal F73 hover-only underline (recipe blog): cue appears only on :hover/:active

## Scenario
A sourdough-focaccia recipe blog. The recipe body links use the *exact* F73 stylesheet
pattern: `a:link`/`a:visited`/`a:active` have `text-decoration:none`, and only `a:hover`
(plus `a:active`) introduce an underline and a color change to red. At rest the links are
green `#1f6f43` on a cream background with no underline, weight, or size cue. To judge this
correctly an evaluator must compare the **resting** render to the **hover** render and apply
the rule that a hover-only cue does not rescue the resting state.

## Attribute tuple
- **content-domain:** restaurant / recipe & cooking blog
- **UI-component/pattern:** `<main>` recipe with prose + `<ul class="ingredients">` (links appear in both prose and list items)
- **host-language construct:** classic `a:link/a:visited/a:active/a:hover` cascade (the literal F73 example markup, re-themed)
- **locale/i18n:** en-US
- **failure-mechanism:** F73 hover-only — the only non-color cue (underline+red) is injected on `:hover`/`:active`; the resting state is color-only

## Developer persona
A home-cook blogger copied a "links underline on hover for a cleaner look" CSS recipe from
a Stack Overflow answer years ago and pasted it into every site they've built since. It
looks tidy and "interactive" to them on a mouse; they have never used the page with a
keyboard or in grayscale and don't know F73 calls hover-only cues a failure.

## Element / selector carrying the issue
`.recipe a` — governed by `a:link {text-decoration:none}` at rest, with the underline only
in `a:hover`/`a:active`. (No `:focus` rule exists, so keyboard users get color-only too.)

## Exact accessibility mechanism
In the resting state the only difference between a link and surrounding text is hue (green vs
near-black) at **2.30:1** lightness — below the 3:1 escape hatch. A reader who does not hover
(e.g. a touch user who taps directly, a low-vision user scanning, anyone in grayscale) sees
color-only links. F73 and G183 are explicit that a cue appearing only on hover/focus is
still a failure because conformance is judged "before focus or pointing." The hover underline
exists in the DOM/CSS and really fires on mouseover, but it does not count.

## Expected ACT-style outcome
**failed** — F73: "If the non-color cue only happens when the mouse hovers over the link or
when the link receives focus, it is still a failure."

## Why automated tools miss it
Static scanners parse the resting computed style and see a colored, validly-named `<a>` that
passes 1.4.3 (6.05:1 on cream); they do not simulate `:hover`/`:active`, do not compare
resting-vs-hover renders, and have no rule that hover-only cues fail. Catching this requires
capturing the resting and hover states, noticing the underline only appears on hover, and
applying the F73 "still a failure" rule — pure human procedure.

## Citation
> **WCAG Technique F73** (`wcag-techniques/failures/F73.html`):
> "If the visual cue is only provided on hover (as in the example above), it would still
> fail."
