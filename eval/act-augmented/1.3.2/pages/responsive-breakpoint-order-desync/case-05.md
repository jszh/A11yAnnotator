# case-05 — Podcast transport row: mobile `order` flips Previous|Play|Next to Next|Play|Previous

## Scenario
A podcast episode player ("Episode 142 — The Longitude Problem") with a chapter transport row.
The controls are a **directionally meaningful left-to-right sequence**, and the page pins that
meaning with a caption that is also the group's accessible name: *"Use the controls below to move
through the episode, left to right: previous chapter, play, next chapter."* The button labels
reinforce direction with arrows: "‹ Previous chapter" and "Next chapter ›". Source/DOM order is
Previous, Play, Next, and the desktop render shows them left-to-right as Previous | Play | Next —
matching the caption and the universal back-left / forward-right convention. Correct.

At `max-width:560px` a designer reversed the row with flex `order` ("so the thumb reaches the
buttons better on phones") and produced the visual order **Next | Play | Previous**. Now the
left-to-right order contradicts the caption's stated "left to right: previous, play, next," and
the spatial back/forward convention is inverted: the left-pointing "‹ Previous" button sits on the
**right**, and the right-pointing "Next ›" button sits on the **left**. The directional meaning of
the sequence is broken at exactly one viewport. DOM/tab order remains Previous, Play, Next.

## Attribute tuple
- **content-domain:** media / audio (podcast player), SaaS-style component
- **UI-component/pattern:** media transport / toolbar (`role="group"`) — a directional control row
- **host-language construct:** flexbox `order` reassigned inside `@media (max-width:560px)`
- **locale/i18n:** en (LTR), arrow glyphs as directional affordances
- **failure-mechanism:** responsive `order` reflow inverts a directionally meaningful sequence vs.
  its own caption at one breakpoint (C27 confusion; F1-style meaning change conditional on viewport)

## Developer persona
A product designer who built the component with Figma auto-layout and used the "reverse direction"
toggle for the mobile variant, thinking it would just mirror spacing. The generated CSS set flex
`order` to reverse the row. They validated the desktop variant against the caption and shipped the
mobile variant after a quick look — the buttons "all still there," not noticing that the arrows and
the caption now point the wrong way relative to position.

## Element / selector carrying the issue
The `.transport` group's children — `@media (max-width:560px) { .btn-prev { order:3 } .btn-next
{ order:1 } }`. Source order (Previous, Play, Next) and the caption `#transport-help` are correct;
the contradiction appears only in the rendered order below 560px.

## Exact accessibility mechanism (what AT experiences / why it fails)
Viewport-conditional, cross-state desync. (a) A **sighted mobile / screen-magnifier user** reads
the transport left-to-right as Next, Play, Previous, which directly contradicts the on-screen
caption "left to right: previous, play, next" and the arrow glyphs (a "‹"-arrow button on the
right, a "›"-arrow button on the left) — the directional meaning of the sequence is wrong, and a
user reaching for "the right-hand control to go forward" will instead go back. (b) A
**screen-reader user** hears the group's name ("…left to right: previous, play, next") and then the
buttons in DOM order Previous, Play, Next — i.e. consistent with the caption — so the blind and
sighted experiences of the same phone diverge. The order is meaningful (it encodes direction and
is described as left-to-right), and at ≤560px the visual order no longer matches that meaningful
order. Stripping CSS (Trusted Tester linearization) yields Previous→Play→Next, but the rendered
mobile order is Next→Play→Previous — they disagree.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Each control is a real `<button>` with a correct accessible name, the group has an accessible name,
DOM order is correct, and flex `order` is legal CSS. axe/WAVE/Lighthouse evaluate one viewport and
never render the ≤560px reversal; even rendered, no rule can detect that the visual left-to-right
order now contradicts a *prose caption* that defines the intended order, or that an arrow glyph's
direction no longer matches its position — that requires reading the caption, knowing the
back/forward spatial convention, and comparing rendered states. The desktop and mobile DOM are
identical, so a static analysis sees nothing. This is the human contextual + multi-viewport
judgment a single-width DOM-vs-visual tool cannot perform.

## Citation
> **WCAG Techniques, C27 — Description:**
> "A keyboard user may have trouble predicting where focus will go next when the source order does
> not match the visual order."

(Verbatim from `wcag-techniques/css/C27.html`. At ≤560px the visual order is Next, Play, Previous
while focus/DOM order is Previous, Play, Next; a sighted keyboard user tabbing expects forward
movement to follow the visible left-to-right arrangement and is misled, and the arrow/caption
meaning is contradicted.)

> **WCAG Understanding 1.3.2, Intent:**
> "It is important that it be possible to programmatically determine at least one sequence of the
> content that makes sense."

(Verbatim from `wcag-understanding/meaningful-sequence.html`. The programmatic order does make
sense, but the mobile visual order contradicts the captioned meaningful sequence, so the rendered
presentation at that breakpoint conveys a wrong directional order.)
