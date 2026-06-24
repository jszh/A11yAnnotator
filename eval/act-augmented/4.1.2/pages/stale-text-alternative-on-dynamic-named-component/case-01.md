# case-01 — Favorite/star toggle: `<img alt>` swaps to filled star but name frozen

## Scenario
An e-commerce product page (Brewhaus Coffee Supply, a copper pour-over kettle). The
"favorite" control is a real `<button>` wrapping an `<img>` whose `src` is a star
icon. Clicking it swaps the SVG data-URI from an empty outline star to a filled gold
star and shows the visible note "Saved to your favorites." The `<img alt>` — which is
the entire accessible name of the button — never changes from **"Add to favorites"**.

## Attribute tuple
- **content-domain:** e-commerce product detail page
- **UI-component/pattern:** favorite/save toggle button (`<button>` wrapping a swappable `<img>`)
- **host-language construct:** `<img alt>` as the button's accessible name; `src` mutated via `setAttribute`
- **locale/i18n:** en-US
- **failure-mechanism:** F20 — non-text content (the star glyph) updated on click; its text alternative (alt) not updated

## Developer persona
A junior front-end dev copied a "favourite toggle" snippet from a Stack Overflow
answer. The snippet swaps the icon data-URI to a filled star and pushes the product id
into a list. The author updated the picture and the visible "Saved" note but left the
toggle's accessible name (the `<img alt>`) exactly as it shipped.

## Element / selector carrying the issue
`button#favBtn > img#favIcon[alt]` — the `alt` attribute is the stale name.

## Exact accessibility mechanism
At first paint the name "Add to favorites" matches the empty star: correct. After a
click the rendered glyph is a filled gold star (the universal "this is saved" state)
and a sighted user sees "Saved to your favorites." But a screen-reader / braille /
voice-control user still gets the name **"Add to favorites"** for an item that is
already favorited. The name now describes the OPPOSITE action from the one the control
performs; it should read "Remove from favorites." Per F20, the text alternative can no
longer be substituted for the non-text content without losing function.

Verified with Puppeteer: after `click`, the icon `src` fingerprint changed (empty→filled
star) while the computed name stayed `"Add to favorites"` (changed=false) — the F20
condition holds.

## Expected ACT-style outcome
**failed** (4.1.2; also implicates 1.1.1 per F20's dual scope, but the named/interactive
toggle limb keeps this in 4.1.2).

## Why automated tools miss it
The `<img>` ALWAYS has a non-empty `alt`, so axe `image-alt`, `button-name`, and
Lighthouse's name checks PASS on every sample — there is never an empty name to flag.
The defect is temporal: the name is correct at load and only becomes wrong after a
click. A one-shot static scan reads the DOM once and sees a valid named button.
Catching it requires triggering the click and comparing the NEW pixels (filled star)
against the UNCHANGED name — a visual + temporal judgment no scanner performs.

## Citation
> **WCAG Technique F20 (Failure of SC 1.1.1 and 4.1.2), Description:** "The objective of
> this failure condition is to address situations where the non-text content is updated,
> but the text alternative is not updated at the same time. If the text in the text
> alternative cannot still be used in place of the non-text content without losing
> information or function, then it fails because it is no longer a text alternative for
> the non-text content."
> — `wcag-techniques/failures/F20.html`
