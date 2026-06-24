# case-03 — Focus recolours the button's OWN border in place (blue→green) within the visible boundary, over a solid-blue interior

## Scenario
A Cedar Park Health patient-portal "Confirm your appointment" screen. The primary action is
a **solid brand-blue** button — its interior fill is blue (`#4189B9`) and it carries a 2px
blue (`#4189B9`) border that traces the component's visible edge (border and fill the same
hue, so at rest it reads as one solid blue shape on a white card). On focus the button does
**not** add an outer outline — it recolours its own existing border, in place, from blue to
green (`#4B933A`). The border does not move; it stays at the visible edge, so this is a
change to the border *within the visible boundary*. The adjacency that matters is therefore
the component interior (the blue fill), and green-on-blue-interior is **1.005:1**, so the
focus indicator does not contrast with the component it borders.

## Attribute tuple
- **content-domain:** healthcare / patient portal (appointment confirmation)
- **UI-component/pattern:** solid-fill primary `<button>` inside a summary card
- **host-language construct:** `:focus { outline:none; border-color: <colour> }` (recolours
  the existing border in place; no outer outline added)
- **locale/i18n:** en-US
- **failure-mechanism:** focus indicator is a change to the component's own border within the
  visible boundary that does not contrast with the inside fill (green `#4B933A` vs the blue
  interior `#4189B9` = 1.005:1)

## Developer persona
A front-end developer wanted the focus state to feel "on-brand" rather than the default blue
ring, so on `:focus` he swapped the button's existing blue border to the brand's secondary
green and removed the outline to avoid a "double border." He reasoned that any colour change
on the border reads as focus. He checked only that the focused border looked different from
the blue resting state — he never checked the green border against the button's own blue
interior, into which it disappears.

## Element / selector carrying the issue
`#confirm:focus` — `border-color: #4B933A` on the same 2px border that defines the visible
boundary, sitting just inside the edge of the solid `#4189B9` interior fill (FAIL, 1.005:1).
The `outline:none` removes any outer indicator, so the recoloured in-place border is the
*only* focus signal. (The sibling "Go back" ghost button keeps a high-contrast black
`outline` on focus and is not part of the defect.)

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard / low-vision user tabs to **Confirm appointment**. The only focus signal is that
the button's own border changes hue from blue to green, in the same position. Because the
change sits within the visible boundary, the adjacency that matters is the component interior
(the blue fill), and green-on-blue is **1.005:1** — for a user with moderately low vision the
focused green border is indistinguishable from the blue surface it sits on, so they cannot
perceive that the control is focused. This is *not* the out-of-scope "background colour
changed between states" case: the SC does not compare focused vs unfocused, but it *does*
require that the focus indicator — here the recoloured border just inside the visible edge —
contrast with the component it borders, which it fails. The defect is genuinely rendered; the
`:focus` rule fires.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A clear change *does* happen on focus (the border colour changes), so axe-core, WAVE and
Lighthouse "is there a visible focus change?" heuristics pass. None of them (a) recognises
the recoloured in-place border *as* the focus indicator, (b) determines it sits within the
visible boundary rather than as an outer outline, or (c) requires it to contrast with the
component interior. A blunt border-vs-page check would even read the green border against the
white card (3.79:1) and call it fine — exactly the wrong adjacency. Deciding that an
in-boundary border-recolour must beat the interior fill is a structural judgement automation
cannot make.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — "Relationship with Focus Visible":**
> "If the focus indicator changes the border of the component within the visible boundary it
> must contrast with the component. Typically an outline goes around (outside) the visible
> boundary of the component, in this case changing the border is just inside the visible edge
> of the component."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The recoloured border is "just
inside the visible edge," so it must contrast with the component — and green-on-blue-interior
at 1.005:1 does not.)

> **WCAG 2.2 Understanding, Non-text Contrast (figure `figure-focus-border`):**
> "Fail: The border of the control changes from blue (#4189B9) to green (#4B933A). This is
> within the component and does not contrast with the inside background of the component."

(Verbatim from `wcag-understanding/non-text-contrast.html`. This page reproduces that exact
failing figure — the identical blue→green in-boundary border recolour over a solid `#4189B9`
interior — as a live `:focus` state.)
