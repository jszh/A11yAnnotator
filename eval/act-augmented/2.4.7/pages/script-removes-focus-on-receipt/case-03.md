# case-03 — E-commerce logo image link with onfocus="this.blur()" (F55 Example 2)

## Scenario
A handmade-ceramics shop. The site header's brand/logo is an image link
`<a href="/" onfocus="this.blur()"><img alt="Fern & Field home"></a>`, which is the very
first tab stop on the page. Because of the `onfocus="this.blur()"` handler, the instant a
keyboard user presses Tab into the page the logo link receives and immediately loses focus,
so no focus indicator is ever shown on the first interactive element — keyboard users start
their journey with focus already lost.

## Attribute tuple
- **content-domain**: e-commerce product & checkout (boutique storefront)
- **UI-component/pattern**: header brand/logo image link (icon/logo link)
- **host-language construct**: `<a onfocus>` wrapping an `<img alt>` (image link)
- **locale/i18n**: en
- **failure-mechanism**: F55 — `onfocus="this.blur()"` on an image link (canonical F55 Example 2)

## Developer persona
A solo maker built the shop on a hand-coded HTML template. The logo link kept showing a
"boxy" focus outline when it was tabbed to or clicked, which the maker found distracting in
their carefully art-directed header. They found the exact F55 Example 2 markup
(`<a onfocus="this.blur()"><img ...></a>`) in an old web-design forum post titled "remove
that ugly box around my logo link" and pasted it in. They added a proper `alt` and
`aria-label` because they had read that images "need alt text," so the page passes naive
checks while being keyboard-broken at its very first stop.

## Element / selector carrying the issue
- FAIL: `header.shop a.brand[href="/"]` — `onfocus="this.blur()"`, wraps `img[alt="Fern & Field home"]`.

## Exact accessibility mechanism
On page load a keyboard user presses Tab; focus moves to the logo link (the first focusable
element). The link fires its `focus` event and the inline `onfocus="this.blur()"` calls
`.blur()`, removing focus within the same tick. The `a.brand:focus { outline: 3px }` rule
is valid but never paints because the element is unfocused at paint time. The user sees the
focus ring appear to start at the first *nav* link instead, with the logo silently skipped;
they receive no indication the logo is even focusable, and it is operable only by mouse.
Because the alt text and link name are present and correct, the only thing wrong is the
behavioral focus theft — exactly F55.

## Expected ACT-style outcome
**failed** — focus does not remain on the logo image link when received; it never shows a
visible focus indicator (F55).

## Why automated tools miss it
Every static signal is healthy: the `<img>` has descriptive `alt`, the `<a>` has an `href`
and an `aria-label`, and a valid `:focus` outline is declared. Alt-text, link-name, and
contrast scanners all pass, and there is no automated 2.4.7 rule to run. The fault is purely
behavioral — `onfocus` grants then revokes focus in one tick — so a single DOM snapshot or
pixel diff of the focused state shows the logo with no ring, indistinguishable from "not
focused yet." Only running the keyboard sequence and confirming the indicator never settles
on the logo (the F55 procedure) reveals the failure; that is human/dynamic judgment.

## Citation
> **WCAG Techniques — F55: Failure of Success Criteria 2.1.1, 2.4.7, 2.4.13, and 3.2.1 due to using script to remove focus when focus is received**
> Example: `<a onFocus="this.blur()" href="Page.html"><img src="myImage.gif"></a>`
>
> Tests / Procedure: "Use the keyboard to verify that you can get to all interactive elements
> using the keyboard." and "Check that when focus is placed on each element, focus remains
> there until user moves it."

> **WCAG 2.2 Understanding 2.4.7 — Benefits of Focus Visible**
> "This success criterion helps anyone who relies on the keyboard to operate the page, by
> letting them visually determine the component on which keyboard operations will interact at
> any point in time."
