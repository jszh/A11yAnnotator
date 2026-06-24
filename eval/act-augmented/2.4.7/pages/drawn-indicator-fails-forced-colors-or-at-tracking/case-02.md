# case-02 — Hotel nav whose focus indicator is a CSS gradient background swap

## Scenario
The primary navigation of a German alpine hotel site ("Alpenhof Resort"). The nav links
sit on a flat teal panel. To convey focus, the author removes the native ring
(`outline: none`) and swaps the link's flat `background` for a `linear-gradient`
(teal→green wash) on `:focus`. In the default render, tabbing across "Zimmer & Suiten",
"Angebote", "Spa & Wellness" etc. paints a visible gradient behind the focused item, so
pixels change and oj04fd's single snapshot passes. There is no outline, border, weight, or
text change — the gradient *is* the entire indicator.

## Attribute tuple
- **content-domain:** hospitality / hotel booking (German locale)
- **UI-component / pattern:** horizontal primary `<nav>` with anchor links
- **host-language construct:** `:focus { outline: none; background: linear-gradient(...) }`
- **locale / i18n:** de-DE
- **failure-mechanism:** gradient/background-image focus cue flattened to a single system color in forced-colors mode, eliminating the perceptible difference

## Developer persona
A boutique agency built the site in a visual page builder and applied a brand "wash" to
hover and focus states to match the resort's marketing palette. The designer judged the
focus state purely on a Retina display in light mode. Forced-colors / High Contrast was
never part of the brand review, and gradients are exactly what those modes discard.

## Element / selector carrying the issue
`nav.primary a:focus` — the only focus styling is `background: linear-gradient(180deg,
#7fd6c4, #38a08c)` (plus a text-color tweak) over a base flat `background: #d9efe9`, with
`outline: none`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Default render, keyboard user:** Tab moves through the nav; each focused link shows a
  green gradient wash distinct from its flat neighbours. Focus is visible. oj04fd passes.
- **Forced-colors / Windows High Contrast user:** the user agent overrides author colors
  with the system palette and treats author `background-image` (which includes CSS
  gradients) as `none`, painting the element's system `Canvas` color instead. Both the
  flat base background and the gradient focus background collapse to the **same system
  color**, and the small `color` change is also overridden by the system text color. The
  focused link is now visually identical to the others — the difference that signalled
  focus is gone. The keyboard user cannot tell which nav item is focused.
- The gradient is a real CSS background-image, so a forced-colors UA genuinely drops it;
  the failure is in the rendering, not a comment.

## Expected ACT-style outcome
**failed** (SC 2.4.7). The focusable nav links rely solely on a gradient background that is
flattened away in a standard user rendering mode, so there is no mode of operation in which
focus is visible for forced-colors users.

## Why automated tools miss it
- `outline: none` plus a real background change is valid and produces a genuine pixel
  difference, so oj04fd and screenshot-diff focus tools pass.
- axe/WAVE/Lighthouse run one light-mode render and never simulate forced colors; they have
  no concept that "gradient background = treated as none in forced colors."
- Recognising that a gradient/background-image is the *only* cue and that it disappears in
  forced colors is the precise semantic judgment the C40 forced-colors caveat (and G165's
  "drawn indicator won't carry over") demands of a human.

## Citation
> **WCAG Technique C40, Description note:** "User agents commonly suppress the `box-shadow`
> property in forced-color modes, so authors should avoid relying on `box-shadow` alone to
> implement focus indicators." (The same forced-colors suppression applies to author
> background images / gradients, which is why a gradient-only focus cue likewise fails.)
>
> **WCAG Technique G165 (Using the default focus indicator…), Description:** "If you draw
> your own focus indicator, for example by coloring sections of the page in response to
> user action, these settings will not carry over, and AT will not usually be able to find
> your focus indicator."
