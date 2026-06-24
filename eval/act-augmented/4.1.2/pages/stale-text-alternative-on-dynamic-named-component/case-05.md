# case-05 — Icon-only repeat-MODE cycle button: `<svg><title>` lags one state behind from the 2nd click

## Scenario
A dark-theme ambient-music player (Tideline). The repeat control is an **icon-only**
`<button>` — it contains nothing but an inline `<svg role="img">`, whose `<title>` is the
button's *entire* accessible name (no `aria-label`, no `aria-labelledby`, no visible text or
badge inside the button). It is a three-state **cycle**, not a binary toggle: each click
advances `off → all → one → off`. On every click the glyph genuinely morphs (the loop strokes
recolor; a script-drawn **"1"** overlay appears for the "one" state) and a separate visible
caption under the player updates. But the `<svg><title>` is rewritten **only on the first
transition** (`off → all`); from the second click onward it is frozen. So after two clicks the
glyph + caption say "Repeating **one track**", yet the announced name is still
**"Repeat all tracks"** — one state behind reality.

## Attribute tuple
- **content-domain:** media player / streaming-audio "now playing" widget
- **UI-component/pattern:** icon-only repeat-MODE cycle button (3-state: off/all/one), not a binary toggle
- **host-language construct:** inline `<svg role="img"><title>` as the *sole* accessible name; `data-mode` recolors the glyph + reveals a `<text>` "1" overlay; visible caption is a separate node
- **locale/i18n:** en-US
- **failure-mechanism:** F20 over the 4.1.2 name-over-time limb — non-text content (the glyph) updated every click; its text alternative (the `<title>`) only updated for the first step, then stale

## Developer persona
A player-widget refactor. The original repeat button was a binary on/off and *did* keep its
`<svg><title>` in sync. A later ticket expanded it to a three-state cycle (`off → all → one`).
The dev added the new glyph art and the new caption strings, and remembered to relabel the
title on the **first** step (`off → all`) — but pasted the remaining steps from the visual code
path and never carried the title rewrite through. So the `<svg><title>`, which is the button's
**entire** accessible name, lags one state behind from the second click onward.

## Element / selector carrying the issue
`button#repeatBtn > svg > title#repeatTitle` — the `<title>` text is the whole accessible name
and is rewritten only when `off → all`; the `all → one` and `one → off` transitions update the
glyph (`data-mode`) and the visible `#repeatCaption`, but never the title.

## Exact accessibility mechanism
Because the button is icon-only, the SVG `<title>` is the *only* accessible-name contributor —
there is no `aria-label`/`aria-labelledby` and no live visible text or badge inside the
`<button>` to dilute or correct it. After two clicks the control is visibly in the "repeat one
track" mode (active teal loop glyph with a "1" overlay; caption "Repeating one track on a
loop."), but a screen-reader announces **"Repeat all tracks"** and a voice-control user who
says "repeat all tracks" would be acting on a control that is actually in "one" mode. Note this
is a **3-state cycle with no `aria-pressed`**, so there is no programmatic state channel
compensating for the wrong name — the name string is the only thing announced, and it is one
state stale.

Verified with Chromium's accessibility tree (Puppeteer `accessibility.snapshot`):
- default: name = `"Repeat off"` (glyph off, caption "off") — in sync
- after 1 click (`off → all`): name = `"Repeat all tracks"` — in sync (title updated)
- after 2 clicks (`all → one`): glyph shows the "1" overlay and caption reads "Repeating one
  track on a loop", but name = **`"Repeat all tracks"`** — STALE
- after 3 clicks (`one → off`): caption "Repeat is off", but name still `"Repeat all tracks"` — STALE
- **sole-source proof:** at the "one" state, blanking `#repeatTitle` drops the accessible name
  to `""` (empty), confirming the `<svg><title>` is the *only* name contributor.

## Expected ACT-style outcome
**failed** (4.1.2).

## Why automated tools miss it
The button always has a non-empty accessible name (the `<title>` is never empty), so axe
`button-name` / Lighthouse pass on every state. No automated tool diffs the rendered glyph
geometry (a script-drawn `<text>` "1" overlay), the recolored loop, or the separate visible
caption against the buried `<svg><title>` string — and deciding the title is now semantically
*wrong* requires correlating three different surfaces across a multi-click sequence. That is a
cross-modal, post-interaction human judgment a scanner cannot make.

## Citation
> **WCAG Technique F20 (Failure of SC 1.1.1 and 4.1.2), Description:** "The objective of this failure condition is to address situations where the non-text content is updated, but the text alternative is not updated at the same time. If the text in the text alternative cannot still be used in place of the non-text content without losing information or function, then it fails because it is no longer a text alternative for the non-text content."
> — `wcag-techniques/failures/F20.html`
