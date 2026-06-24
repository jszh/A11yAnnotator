# case-03 — Custom seat-picker whose only focus cue is a background-color swap (no UA ring restored)

## Scenario
A rail-booking "Choose your seat" step ("Coastliner 14:05 to Harborside"). The seats are
**custom, non-native widgets**: `<div tabindex="0" role="button">` (deliberately not
`<button>`/`<input>`). To highlight the focused seat the author removes the outline and, on
`:focus`, swaps the seat's `background-color` from a resting grey (`#f3f5f9`) to amber
(`#ffe08a`). In a default render, tabbing tints the focused seat amber — pixels change and the
single-render ACT rule oj04fd passes. The `background-color` swap is the *entire* focus
indicator: no border-color change, no outline, no box-shadow, no text change.

## Attribute tuple
- **content-domain:** travel / rail-ticket booking (seat selection)
- **UI-component / pattern:** custom keyboard widget grid — `div[tabindex][role=button]` seat tiles (NOT native controls)
- **host-language construct:** `.seat:focus { outline: none; background-color: #ffe08a }` on a non-native focusable element
- **locale / i18n:** en-GB, GBP
- **failure-mechanism:** background-COLOR-only focus cue overridden by the system Canvas color in forced-colors mode, and (because the widget is non-native) Chromium restores no UA focus ring — so no indicator survives

## Developer persona
A front-end dev built the seat tiles as styled `<div>`s "so they could be laid out and themed
freely," wiring `tabindex`/`role`/keydown by hand. For the focus state they reused the same
amber `:focus { background-color }` they use for hover-highlighting rows — it looked clearly
focused on their light-themed monitor and a mouse-driven QA pass signed off. They never tested
Windows High Contrast, and they assumed (as with a native input) the browser would "still draw
a ring anyway." For a hand-rolled `div` widget, it does not.

## Element / selector carrying the issue
`.seat:focus` on `div.seat[tabindex="0"][role="button"]` — the rule is `outline: none;
background-color: #ffe08a;`. The background-color is the sole focus cue; the resting
`background-color: #f3f5f9` and the 1px grey border are identical between focused and unfocused
seats.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Default render, sighted keyboard user:** Tab lands on a seat tile, its background turns
  amber, focus is clearly visible. oj04fd's snapshot sees a pixel change → pass.
- **Forced-colors / Windows High Contrast user:** the user agent enforces the system palette
  and overrides author **background-colors** with the system `Canvas` color. The amber focus
  background and the grey resting background collapse to the *same* system color, so the focused
  seat is no longer distinguishable from its neighbours. Crucially, because the seats are
  **non-native** focusable elements (`div[tabindex]`, not `<input>`/`<button>`), the browser
  does **not** restore a UA focus outline on them — unlike a native control, where Chromium
  re-paints a forced-colors ring even after `outline: none`. With author color overridden and no
  UA ring, **no focus indicator remains**: the focused seat renders pixel-identically to the
  unfocused seats. A keyboard user in High Contrast cannot tell which seat is focused before
  pressing Enter to select (and pay for) it.
- This is genuinely implemented in the cascade (`outline: none` + a `background-color` swap on a
  hand-built widget); forced-colors mode really overrides the color and really declines to ring
  a `div`. Verified empirically: forced-colors focused vs. unfocused screenshots are identical.
- Note this is **not** the background-IMAGE / data-URI mistake. A `url()` background image
  (including a `data:` SVG) is *preserved* in forced colors; that would keep painting and pass.
  This case relies on `background-color`, which forced-colors mode *does* override — the
  distinction that makes the outcome correct.

## Expected ACT-style outcome
**failed** (SC 2.4.7). The keyboard-operable seat widgets' only focus indicator is an author
`background-color` that is overridden under a standard user rendering mode (forced colors),
with no UA fallback ring on these non-native elements — so there is no mode of operation in
which focus is visible for forced-colors users.

## Why automated tools miss it
- `outline: none` is legal CSS when a visible replacement exists, and here a replacement (the
  background-color swap) does exist in the default render, so no linter rule fires.
- In the default render the focus genuinely changes pixels, so oj04fd / any screenshot-diff
  focus checker passes.
- axe/WAVE/Lighthouse evaluate one default-theme render; none simulate forced colors, and none
  reason that (a) author `background-color` is overridden there while a `url()` image would not
  be, and (b) the browser restores no UA ring on a non-native `div[tabindex]` widget. Holding
  both facts together is the human/spec judgment this aspect requires — the G165 caveat that a
  self-drawn (here, color-only) indicator "will not carry over."

## Citation
> **WCAG Technique G165 (Using the default focus indicator for the platform so that high
> visibility default focus indicators will carry over), Description:** "If you use the native
> focus indicator, any system-wide settings for its visibility will carry over to the web page.
> If you draw your own focus indicator, for example by coloring sections of the page in response
> to user action, these settings will not carry over, and AT will not usually be able to find
> your focus indicator."
>
> **WCAG Technique C40 (Creating a two-color focus indicator to ensure sufficient contrast with
> all components), Description note:** "Avoid setting `outline: none` to use `box-shadow` on its
> own. User agents commonly suppress the `box-shadow` property in forced-color modes, so authors
> should avoid relying on `box-shadow` alone to implement focus indicators." (The same
> forced-colors override applies to an author `background-color`-only cue used here: the focus
> color is replaced by the system Canvas color, so a color-only indicator likewise fails — and
> unlike `box-shadow` on a native control, no UA ring is restored on this non-native widget.)
