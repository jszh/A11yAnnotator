# case-04 — Constellation map: focus paints a detached marker in a corner legend, far from the star

## Scenario
An interactive astronomy learning module. Bright "stars" (the seven stars of the Big
Dipper) are absolutely-positioned `<a>` links scattered across a star-field stage. On
focus, the star's native outline is removed (`outline: none`) and **nothing visually
changes on the star itself**. Instead, JavaScript slides a single shared yellow marker
square over the matching star *name* inside a fixed legend panel pinned to the top-right
corner of the page. The cue for "which star is focused" is therefore a detached painted
square in a different region of the page, spatially disconnected from the focused element.

## Attribute tuple
- **content-domain:** education / astronomy interactive
- **UI-component / pattern:** scattered map of icon links (star buttons) with a side legend
- **host-language construct:** `:focus { outline: none }` on the star + JS that repositions a shared `#focus-marker` over a corner legend row
- **locale / i18n:** en-US
- **failure-mechanism:** JS-painted, detached/orphaned indicator — the cue is far from the real focus position; AT cannot find/associate it and it is unusable for magnifier/forced-colors users (G165 "drawn, detached")

## Developer persona
A junior developer building a classroom demo thought a "now focused: <name>" legend in the
corner was a friendlier indicator than an outline on tiny 18px star dots ("the dots are too
small to ring nicely"). They mirrored a pattern from an old SCR31-style "highlight on
focus" tutorial but highlighted a *remote* element instead of the focused one. It demos
fine on a projector where the whole page is visible at once.

## Element / selector carrying the issue
The star links `a.star:focus` (which only get `outline: none`, no on-element cue) combined
with `#focus-marker`, the shared square that JS moves over `ul#legend li[data-for=…]` in the
corner `<aside class="legend">`. The indicator is positionally detached from the focused
star.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Default render, full page visible, mouse user:** glancing at the corner legend, a
  sighted user *might* infer which star is active. A naive pixel-diff sees "something
  changed on the page" → oj04fd passes.
- **Sighted keyboard user / screen-magnifier user:** when zoomed into the constellation
  (where the action is), the corner legend marker is **off-screen**. The focused star shows
  no change at all, so the user has lost focus entirely — the indicator does not track the
  focus position.
- **Screen-reader / AT user:** the legend is `aria-hidden="true"` and the marker is a bare
  `<span>` with no semantics. AT cannot find or announce the cue; per G165, a self-drawn,
  detached indicator is exactly what "AT will not usually be able to find."
- **Forced-colors user:** the marker is an author-drawn box that, even if it paints, is
  divorced from the focused element, so it still fails to indicate focus on the star.
- The detachment is genuinely implemented in JS (the marker moves to the legend, never to
  the star), so the failure is real, not a comment.

## Expected ACT-style outcome
**failed** (SC 2.4.7). The focusable stars have no focus indicator on or adjacent to
themselves; the only cue is a detached, AT-invisible square elsewhere on the page, so focus
is not visibly indicated on the element receiving it.

## Why automated tools miss it
- `outline: none` is legal because a "replacement" indicator exists *somewhere* — a scanner
  cannot judge that the replacement is in the wrong place.
- A default-render screenshot diff detects a pixel change on the page and cannot reason
  about whether that change is *co-located with* the focused element — that is a spatial /
  semantic judgment a human makes by watching focus move.
- The markup is well-formed (real links, labelled legend rows), so axe/WAVE/Lighthouse find
  nothing.

## Citation
> **WCAG Technique G165 (Using the default focus indicator for the platform…),
> Description:** "If you draw your own focus indicator, for example by coloring sections of
> the page in response to user action, these settings will not carry over, and AT will not
> usually be able to find your focus indicator."
